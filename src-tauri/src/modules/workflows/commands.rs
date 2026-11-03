use std::path::PathBuf;

use super::catalog::{build_catalog, user_workflows_dir, Catalog};
use super::check::{run_check, CheckResult};
use super::map::{map_facts, MapFacts};
use super::progress::{self, ProgressFile, ProgressRead, Update};
use super::workflow::{shipped_workflow, Vars, Workflow};
use crate::modules::ralph::tickets::read_tickets;

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
) -> Result<CheckResult, String> {
    tokio::task::spawn_blocking(move || {
        let root = PathBuf::from(&repo_root);
        if !root.is_absolute() || !root.is_dir() {
            return Err(format!("{repo_root}: not a folder"));
        }
        let feature = PathBuf::from(&feature_dir);
        let feature = feature
            .strip_prefix(&root)
            .map(|p| p.to_string_lossy().replace('\\', "/"))
            .unwrap_or(feature_dir);
        let vars = Vars {
            feature: &feature,
            workflow_dir: &workflow_dir,
        };
        Ok(run_check(&root, &command, &vars, CHECK_TIMEOUT))
    })
    .await
    .map_err(|e| e.to_string())?
}

/// The names of the build tickets in a feature's `issues/` folder, by the ticket reader's rule:
/// a wayfinder ticket (a plain `Type:` line or a `## Question` heading) is not one; a human
/// ticket is. A missing folder holds none.
#[tauri::command]
pub async fn workflows_build_tickets(feature_dir: String) -> Vec<String> {
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
) -> Option<u32> {
    tokio::task::spawn_blocking(move || {
        super::session_turns::turns_since(&repo_root, &session_id, &since)
    })
    .await
    .ok()
    .flatten()
}

/// Whether each claude session's transcript is on this machine; all false without a home folder.
#[tauri::command]
pub async fn workflows_sessions_present(repo_root: String, session_ids: Vec<String>) -> Vec<bool> {
    tokio::task::spawn_blocking(move || match dirs::home_dir() {
        Some(home) => super::session_turns::sessions_present(&home, &repo_root, &session_ids),
        None => vec![false; session_ids.len()],
    })
    .await
    .unwrap_or_default()
}

pub fn build_tickets(issues_dir: &std::path::Path) -> Vec<String> {
    read_tickets(issues_dir)
        .unwrap_or_default()
        .into_iter()
        .filter(|t| !t.wayfinder)
        .map(|t| {
            t.path
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default()
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::build_tickets;

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
        assert_eq!(
            build_tickets(dir.path()),
            ["01-build.md", "02-hitl-check.md"]
        );
        assert!(build_tickets(&dir.path().join("none")).is_empty());
    }
}
