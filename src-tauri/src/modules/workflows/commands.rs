use std::path::PathBuf;

use super::catalog::{build_catalog, user_workflows_dir, Catalog};
use super::check::{run_check, run_check_in_wsl, CheckResult};
use super::map::{map_facts, MapFacts};
use super::progress::{self, ProgressFile, ProgressRead, Update};
use super::workflow::{shipped_workflow, Vars, Workflow};
use crate::modules::ralph::launch;
use crate::modules::ralph::runs::{
    live_runs, read_loop_view, request_stop, runs_for_ticket, script_alive, Env, LiveRun, LoopView,
    RunView,
};
use crate::modules::ralph::ticket_read::{read_ticket, ticket_window, TicketRead, TicketWindow};
use crate::modules::ralph::tickets::{mark_done, read_tickets};
use crate::modules::ralph::watch::{unwatch, watch_loop};

const CHECK_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(300);

#[tauri::command]
pub fn workflows_shipped() -> Result<Workflow, String> {
    shipped_workflow().map_err(|e| e.to_string())
}

/// Every workflow visible from a repo (or from the user folder alone when no repo is given).
#[tauri::command]
pub fn workflows_catalog(repo_root: Option<String>) -> Catalog {
    let repo_dir = repo_root
        .map(PathBuf::from)
        .filter(|root| root.is_absolute() && root.is_dir())
        .map(|root| root.join(".workflows"));
    build_catalog(user_workflows_dir().as_deref(), repo_dir.as_deref())
}

/// The `progress.yaml` of a folder, or the error that stops it loading (with the file's path).
#[tauri::command]
pub async fn workflows_read_progress(dir: String) -> ProgressRead {
    tokio::task::spawn_blocking(move || progress::read_progress(&PathBuf::from(dir)))
        .await
        .unwrap_or_default()
}

/// Applies one record (a workflow, a route, a mark) to the folder's `progress.yaml`.
#[tauri::command]
pub async fn workflows_record_progress(
    dir: String,
    update: Update,
) -> Result<ProgressFile, String> {
    tokio::task::spawn_blocking(move || {
        let dir = PathBuf::from(dir);
        if !dir.is_absolute() || !dir.is_dir() {
            return Err(format!("{}: not a folder", dir.display()));
        }
        progress::record(&dir, &update)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Relative paths of the files under each of `dirs` ("" is `root` itself), for the gates.
#[tauri::command]
pub async fn workflows_list_files(root: String, dirs: Vec<String>) -> Vec<String> {
    tokio::task::spawn_blocking(move || {
        let root = PathBuf::from(root);
        if !root.is_absolute() {
            return Vec::new();
        }
        progress::list_files(&root, &dirs)
    })
    .await
    .unwrap_or_default()
}

/// Runs a `check` gate's command in the repo root. Called only from "Next" and "Recheck".
#[tauri::command]
pub async fn workflows_run_check(
    repo_root: String,
    feature_dir: String,
    workflow_dir: String,
    command: String,
    distro: Option<String>,
) -> Result<CheckResult, String> {
    tokio::task::spawn_blocking(move || {
        let root = PathBuf::from(&repo_root);
        let feature = PathBuf::from(&feature_dir);
        let feature = feature
            .strip_prefix(&root)
            .map(|p| p.to_string_lossy().replace('\\', "/"))
            .unwrap_or(feature_dir);
        let vars = Vars {
            feature: &feature,
            workflow_dir: &workflow_dir,
        };
        // A space on the Windows env: the repo path is a Linux path inside the distro.
        if let Some(distro) = distro {
            #[cfg(windows)]
            crate::modules::workspace::validate_wsl_distro_name(&distro)?;
            if !repo_root.starts_with('/') {
                return Err(format!("{repo_root}: not a Linux path"));
            }
            return Ok(run_check_in_wsl(
                &distro,
                &repo_root,
                &command,
                &vars,
                CHECK_TIMEOUT,
            ));
        }
        if !root.is_absolute() || !root.is_dir() {
            return Err(format!("{repo_root}: not a folder"));
        }
        Ok(run_check(&root, &command, &vars, CHECK_TIMEOUT))
    })
    .await
    .map_err(|e| e.to_string())?
}

/// The names of the build tickets in a feature's `issues/` folder, by the ticket reader's rule:
/// a wayfinder ticket (a plain `Type:` line or a `## Question` heading) is not one; a human
/// ticket is. A missing folder holds none.
#[tauri::command]
pub async fn workflows_build_tickets(feature_dir: String) -> Vec<BuildTicket> {
    tokio::task::spawn_blocking(move || {
        let dir = PathBuf::from(feature_dir);
        if !dir.is_absolute() {
            return Vec::new();
        }
        build_tickets(&dir.join("issues"))
    })
    .await
    .unwrap_or_default()
}

/// What the `map` gate looks at in a feature folder.
#[tauri::command]
pub async fn workflows_map_facts(feature_dir: String) -> MapFacts {
    tokio::task::spawn_blocking(move || {
        let dir = PathBuf::from(feature_dir);
        if !dir.is_absolute() {
            return MapFacts::default();
        }
        map_facts(&dir)
    })
    .await
    .unwrap_or_default()
}

/// Turns the user typed into a claude session after `since`; null when its transcript is not here.
#[tauri::command]
pub async fn workflows_session_turns(
    repo_root: String,
    session_id: String,
    since: String,
    claude_home: Option<String>,
) -> Option<u32> {
    tokio::task::spawn_blocking(move || {
        let home = claude_home.map(PathBuf::from).or_else(dirs::home_dir)?;
        super::session_turns::turns_since(&home, &repo_root, &session_id, &since)
    })
    .await
    .ok()
    .flatten()
}

/// Whether each claude session's transcript is on this machine; all false without a home folder.
#[tauri::command]
pub async fn workflows_sessions_present(
    repo_root: String,
    session_ids: Vec<String>,
    claude_home: Option<String>,
) -> Vec<bool> {
    tokio::task::spawn_blocking(move || {
        match claude_home.map(PathBuf::from).or_else(dirs::home_dir) {
            Some(home) => super::session_turns::sessions_present(&home, &repo_root, &session_ids),
            None => vec![false; session_ids.len()],
        }
    })
    .await
    .unwrap_or_default()
}

/// What `command -v jq git curl claude` printed inside a WSL distro; the page lists what is absent.
#[tauri::command]
pub async fn workflows_wsl_check(distro: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || super::wsl::check_distro(&distro))
        .await
        .map_err(|e| e.to_string())?
}

/// The Loop stage's view of a feature now: its newest run and its build tickets.
#[tauri::command]
pub async fn workflows_loop_view(
    repo_root: String,
    feature_dir: String,
    feature: String,
) -> Option<LoopView> {
    tokio::task::spawn_blocking(move || {
        let (repo, dir) = (PathBuf::from(repo_root), PathBuf::from(feature_dir));
        if !repo.is_absolute() || !dir.is_absolute() {
            return None;
        }
        let env = Env {
            now: std::time::SystemTime::now(),
            pid_alive: &script_alive,
        };
        Some(read_loop_view(&repo, &dir, &feature, &env))
    })
    .await
    .ok()
    .flatten()
}

/// The live runs of a repo, whatever feature each works on: the page disables "Start the loop"
/// while another feature has one.
#[tauri::command]
pub async fn workflows_loop_live(repo_root: String) -> Vec<LiveRun> {
    tokio::task::spawn_blocking(move || {
        let repo = PathBuf::from(repo_root);
        if !repo.is_absolute() {
            return Vec::new();
        }
        let env = Env {
            now: std::time::SystemTime::now(),
            pid_alive: &script_alive,
        };
        live_runs(&repo, &env)
    })
    .await
    .unwrap_or_default()
}

/// Where a Windows start runs: the space's distro and the repo's Linux path.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WslTarget {
    pub distro: String,
    pub linux_root: String,
}

/// Starts the script detached in the repo root: the repo's own copy, or else the app's. `args`
/// and `launch_line` are what the launch form showed; the repo having a live run refuses the start.
#[tauri::command]
pub async fn workflows_loop_start(
    app: tauri::AppHandle,
    repo_root: String,
    args: Vec<String>,
    launch_line: String,
    wsl: Option<WslTarget>,
) -> Result<(), String> {
    // The app's own copy of the script, run in a repo that has none.
    let bundled = {
        use tauri::Manager;
        app.path().resource_dir().ok().map(|d| d.join("ralph"))
    };
    tokio::task::spawn_blocking(move || {
        let bundled = bundled.as_deref();
        let Some(target) = wsl else {
            return launch::start(
                &PathBuf::from(repo_root),
                &args,
                &launch_line,
                None,
                bundled,
            );
        };
        // The distro check comes first: a tool the script needs and the distro lacks is named
        // here, before any run folder is made.
        // `check_distro` validates the distro name on Windows and refuses everywhere else.
        let printed = super::wsl::check_distro(&target.distro)?;
        let missing = super::wsl::missing_tools(&printed);
        if !missing.is_empty() {
            return Err(format!("{} lacks {}.", target.distro, missing.join(", ")));
        }
        let wsl = launch::Wsl {
            distro: &target.distro,
            linux_root: &target.linux_root,
        };
        launch::start(
            &PathBuf::from(repo_root),
            &args,
            &launch_line,
            Some(&wsl),
            bundled,
        )
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Asks the live run `run_id` to stop by writing its stop file (never a signal); returns the
/// file's path.
#[tauri::command]
pub async fn workflows_loop_stop(repo_root: String, run_id: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let repo = PathBuf::from(repo_root);
        if !repo.is_absolute() {
            return Err("the repo path must be absolute".to_string());
        }
        let env = Env {
            now: std::time::SystemTime::now(),
            pid_alive: &script_alive,
        };
        request_stop(&repo, &run_id, &env).map(|p| p.to_string_lossy().into_owned())
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Streams the Loop view to the page now and after every change; returns the id for
/// `workflows_loop_unwatch`.
#[tauri::command]
pub fn workflows_loop_watch(
    repo_root: String,
    feature_dir: String,
    feature: String,
    poll: Option<bool>,
    on_view: tauri::ipc::Channel<LoopView>,
) -> Result<u32, String> {
    let (repo, dir) = (PathBuf::from(&repo_root), PathBuf::from(&feature_dir));
    if !repo.is_absolute() || !dir.is_absolute() {
        return Err("the repo and feature paths must be absolute".into());
    }
    Ok(watch_loop(
        repo,
        dir,
        feature,
        poll.unwrap_or(false),
        move |view| on_view.send(view).is_ok(),
    ))
}

/// What a ticket's terminal replays from a run folder, from `offset` on.
#[tauri::command]
pub async fn workflows_ticket_read(
    repo_root: String,
    run_id: String,
    feature: String,
    number: String,
    offset: u64,
) -> Option<TicketRead> {
    tokio::task::spawn_blocking(move || {
        let repo = PathBuf::from(repo_root);
        if !repo.is_absolute() {
            return None;
        }
        Some(read_ticket(&repo, &run_id, &feature, &number, offset))
    })
    .await
    .ok()
    .flatten()
}

/// The runs of a feature that took a ticket, newest first, for the ticket terminal's "Run:" picker.
#[tauri::command]
pub async fn workflows_ticket_runs(
    repo_root: String,
    feature: String,
    number: String,
) -> Vec<RunView> {
    tokio::task::spawn_blocking(move || {
        let repo = PathBuf::from(repo_root);
        if !repo.is_absolute() || number.len() != 2 || !number.bytes().all(|b| b.is_ascii_digit()) {
            return Vec::new();
        }
        let env = Env {
            now: std::time::SystemTime::now(),
            pid_alive: &script_alive,
        };
        runs_for_ticket(&repo, &feature, &number, &env)
    })
    .await
    .unwrap_or_default()
}

/// Where a ticket's commits are looked up from, for one run.
#[tauri::command]
pub async fn workflows_ticket_window(
    repo_root: String,
    run_id: String,
    feature: String,
    number: String,
) -> Option<TicketWindow> {
    tokio::task::spawn_blocking(move || {
        let repo = PathBuf::from(repo_root);
        if !repo.is_absolute() {
            return None;
        }
        Some(ticket_window(&repo, &run_id, &feature, &number))
    })
    .await
    .ok()
    .flatten()
}

#[tauri::command]
pub fn workflows_loop_unwatch(id: u32) {
    unwatch(id);
}

/// A build ticket as the gates see it: its file name and its bold status key (what the loop reads).
#[derive(Debug, PartialEq, serde::Serialize)]
pub struct BuildTicket {
    pub name: String,
    pub status_key: String,
}

pub fn build_tickets(issues_dir: &std::path::Path) -> Vec<BuildTicket> {
    read_tickets(issues_dir)
        .unwrap_or_default()
        .into_iter()
        .filter(|t| !t.wayfinder)
        .map(|t| BuildTicket {
            name: t
                .path
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default(),
            status_key: t.status_key,
        })
        .collect()
}

/// "Mark done" on a human ticket: writes `**Status:** done` into it and returns that line.
#[tauri::command]
pub async fn workflows_ticket_mark_done(
    feature_dir: String,
    number: String,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let dir = PathBuf::from(feature_dir);
        if !dir.is_absolute() {
            return Err(format!("{}: not an absolute path", dir.display()));
        }
        mark_done(&dir.join("issues"), &number)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::{build_tickets, BuildTicket};

    #[test]
    fn build_and_human_tickets_count_and_wayfinder_tickets_do_not() {
        let dir = tempfile::tempdir().unwrap();
        let w = |n: &str, t: &str| std::fs::write(dir.path().join(n), t).unwrap();
        w("00-index.md", "# index\n");
        w(
            "01-build.md",
            "# 01 — Build\n\n**Status:** ready-for-agent\n",
        );
        w(
            "02-hitl-check.md",
            "# 02 — Human\n\n**Status:** ready-for-human\n",
        );
        w("03-way.md", "# 03 — Way\n\nType: question\n");
        w("04-way2.md", "# 04 — Way\n\n## Question\n");
        w("05-note.txt", "x");
        let t = |name: &str, key: &str| BuildTicket {
            name: name.into(),
            status_key: key.into(),
        };
        assert_eq!(
            build_tickets(dir.path()),
            [
                t("01-build.md", "ready-for-agent"),
                t("02-hitl-check.md", "ready-for-human")
            ]
        );
        assert!(build_tickets(&dir.path().join("none")).is_empty());
    }
}
