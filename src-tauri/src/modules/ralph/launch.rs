//! Starting a run: the script detached from the app, never from a pane.
//!
//! The page builds the arguments (and shows the exact line); this module refuses a start while the
//! repo has a live run, writes the launch line into the run folder so the header can show it after
//! a reopen, and spawns `ralph/run-ralph-tickets.sh` in its own session so it outlives the app.
//! The command is built by a pure function, so a test reads the environment it would spawn with.

use std::collections::HashMap;
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{LazyLock, Mutex};
use std::time::{Duration, Instant, SystemTime};

use super::runs::{live_runs, script_alive, Env, LAUNCH_LINE_FILE};

/// The script, relative to the repo root where it runs.
pub const SCRIPT: &str = "ralph/run-ralph-tickets.sh";

/// The ticket reader the script sources from beside itself (`$RALPH_HOME/lib/tickets.sh`).
const LIB: &str = "lib/tickets.sh";

/// Which copy of the script a start runs: the repo's own, or the one bundled with the app.
#[derive(Debug, PartialEq)]
pub enum ScriptSource {
    Repo,
    /// The app's `ralph` resource folder, holding `run-ralph-tickets.sh` and `lib/tickets.sh`.
    Bundled(PathBuf),
}

/// The repo's own `ralph/run-ralph-tickets.sh` wins, so a script change can be tried in one repo;
/// a repo without one runs the app's copy.
pub fn script_source(repo_root: &Path, bundled: Option<&Path>) -> Result<ScriptSource, String> {
    if repo_root.join(SCRIPT).is_file() {
        return Ok(ScriptSource::Repo);
    }
    match bundled {
        Some(dir) if dir.join("run-ralph-tickets.sh").is_file() && dir.join(LIB).is_file() => {
            Ok(ScriptSource::Bundled(dir.to_path_buf()))
        }
        _ => Err(format!(
            "{SCRIPT} was found neither in the repo root nor with the app."
        )),
    }
}

/// Where a bundled start runs the script from, relative to the repo root: a copy in the run
/// folder. The run folder is outside the script's dirty-tree check, and a relative path needs no
/// translation into WSL nor an execute bit.
pub fn bundled_script_rel(run_dir: &str) -> String {
    format!("{run_dir}/{SCRIPT}")
}

/// Copies the bundled script and its ticket reader into `<run folder>/ralph/`.
fn copy_bundled(bundled: &Path, run_folder: &Path) -> Result<(), String> {
    let to = run_folder.join("ralph");
    for rel in ["run-ralph-tickets.sh", LIB] {
        let dest = to.join(rel);
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
        }
        fs::copy(bundled.join(rel), &dest).map_err(|e| format!("{}: {e}", dest.display()))?;
    }
    Ok(())
}

/// How long after a start the script has to show a state file; a start inside it is refused.
const SETTLE: Duration = Duration::from_secs(15);

static RECENT: LazyLock<Mutex<HashMap<PathBuf, Instant>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

/// The value of `--run-dir` among `args`, when it names a folder under `logs/` that stays inside
/// the repo (a relative path with no `..`).
pub fn run_dir_arg(args: &[String]) -> Option<&str> {
    let at = args.iter().position(|a| a == "--run-dir")?;
    let dir = args.get(at + 1)?;
    let path = Path::new(dir);
    let inside = path.is_relative()
        && path.components().all(|c| matches!(c, Component::Normal(_)))
        && path.starts_with("logs")
        && path != Path::new("logs");
    inside.then_some(dir.as_str())
}

/// The command that runs the script (`script`, relative to the repo root) by `/bin/bash`, its own
/// shebang: in the repo root, in a session of its own, without the marker that says "inside a
/// Terax pane" and with its output discarded (the run folder has it).
pub fn detached_command(repo_root: &Path, script: &str, args: &[String]) -> Command {
    let mut cmd = Command::new("/bin/bash");
    cmd.arg(script)
        .args(args)
        .current_dir(repo_root)
        .env_remove("TERAX_TERMINAL")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // SAFETY: setsid is async-signal-safe and touches no memory of the parent.
        unsafe {
            cmd.pre_exec(|| {
                libc::setsid();
                Ok(())
            });
        }
    }
    cmd
}

/// Where a Windows run lives: the WSL distro and the repo's Linux path. The app's `repo_root`
/// is then the share path (`\\wsl.localhost\<distro>\...`) it reads and writes the run folder through.
pub struct Wsl<'a> {
    pub distro: &'a str,
    pub linux_root: &'a str,
}

/// `wsl.exe` arguments of the launch:
/// `-d <distro> --cd <linux path> -- setsid /bin/bash <script> <args>`, `script` relative to the repo.
pub fn wsl_launch_args(
    distro: &str,
    linux_root: &str,
    script: &str,
    args: &[String],
) -> Vec<String> {
    [
        "-d",
        distro,
        "--cd",
        linux_root,
        "--",
        "setsid",
        "/bin/bash",
        script,
    ]
    .into_iter()
    .map(String::from)
    .chain(args.iter().cloned())
    .collect()
}

/// The `wsl.exe` command of a Windows start. It is spawned detached from the app's console
/// (`DETACHED_PROCESS`) and put in no Job Object, so closing the app does not end the run.
pub fn wsl_command(wsl: &Wsl, script: &str, args: &[String]) -> Command {
    let mut cmd = Command::new("wsl.exe");
    cmd.args(wsl_launch_args(wsl.distro, wsl.linux_root, script, args))
        .env_remove("TERAX_TERMINAL")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const DETACHED_PROCESS: u32 = 0x0000_0008;
        cmd.creation_flags(DETACHED_PROCESS);
    }
    cmd
}

/// Starts a run. `launch_line` is what the form showed; it is stored beside the run with the
/// script's path as run. With `wsl` the script runs inside the distro; `repo_root` is then the
/// share path. `bundled` is the app's `ralph` resource folder, run when the repo has no script.
pub fn start(
    repo_root: &Path,
    args: &[String],
    launch_line: &str,
    wsl: Option<&Wsl>,
    bundled: Option<&Path>,
) -> Result<(), String> {
    match wsl {
        None if cfg!(windows) => {
            return Err("Starting the loop on Windows needs the WSL launch.".to_string());
        }
        Some(_) if !cfg!(windows) => {
            return Err("The WSL launch is only available on Windows.".to_string());
        }
        Some(w) if !w.linux_root.starts_with('/') => {
            return Err(format!("{}: not a Linux path", w.linux_root));
        }
        _ => {}
    }
    if !repo_root.is_absolute() || !repo_root.is_dir() {
        return Err(format!("{}: not a folder", repo_root.display()));
    }
    if !args.iter().any(|a| a == "-y") {
        return Err("The loop is started with -y.".to_string());
    }
    let run_dir = run_dir_arg(args)
        .ok_or_else(|| "The run folder must be a new folder under logs/.".to_string())?;
    let source = script_source(repo_root, bundled)?;
    let script = match &source {
        ScriptSource::Repo => SCRIPT.to_string(),
        ScriptSource::Bundled(_) => bundled_script_rel(run_dir),
    };
    let env = Env {
        now: SystemTime::now(),
        pid_alive: &script_alive,
    };
    if let Some(live) = live_runs(repo_root, &env).first() {
        return Err(format!("{} already has a live run.", live.feature));
    }
    let folder: PathBuf = repo_root.join(run_dir);
    if folder.exists() {
        return Err(format!("{run_dir} already exists."));
    }
    // The script writes its state only after it starts, so a second start in that gap would see no
    // live run; refuse one that follows too closely.
    {
        let mut recent = RECENT.lock().map_err(|e| e.to_string())?;
        let now = Instant::now();
        recent.retain(|_, at| now.duration_since(*at) < SETTLE);
        if recent.contains_key(repo_root) {
            return Err("A run was started a moment ago.".to_string());
        }
        recent.insert(repo_root.to_path_buf(), now);
    }
    // Any failure from here on leaves no run folder and no settle window behind.
    let undo = |err: String| {
        let _ = fs::remove_dir_all(&folder);
        if let Ok(mut recent) = RECENT.lock() {
            recent.remove(repo_root);
        }
        err
    };
    let line = launch_line.replacen(SCRIPT, &script, 1);
    fs::create_dir_all(&folder)
        .and_then(|()| fs::write(folder.join(LAUNCH_LINE_FILE), &line))
        .map_err(|e| undo(format!("{}: {e}", folder.display())))?;
    if let ScriptSource::Bundled(dir) = &source {
        copy_bundled(dir, &folder).map_err(undo)?;
    }
    let mut cmd = match wsl {
        Some(w) => wsl_command(w, &script, args),
        None => detached_command(repo_root, &script, args),
    };
    let mut child = cmd
        .spawn()
        .map_err(|e| undo(format!("could not start {script}: {e}")))?;
    // Reaped off-thread so the finished script does not stay a zombie while the app runs.
    std::thread::spawn(move || {
        let _ = child.wait();
    });
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::OsStr;

    fn args(list: &[&str]) -> Vec<String> {
        list.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn the_spawned_environment_drops_terax_terminal() {
        let cmd = detached_command(Path::new("/repo"), SCRIPT, &args(&["-y"]));
        let removed = cmd
            .get_envs()
            .find(|(k, _)| *k == OsStr::new("TERAX_TERMINAL"));
        assert_eq!(removed, Some((OsStr::new("TERAX_TERMINAL"), None)));
        assert_eq!(cmd.get_current_dir(), Some(Path::new("/repo")));
        assert_eq!(cmd.get_program(), OsStr::new("/bin/bash"));
        let got: Vec<_> = cmd.get_args().collect();
        assert_eq!(got, [OsStr::new(SCRIPT), OsStr::new("-y")]);
    }

    #[test]
    fn the_wsl_launch_line_is_wsl_exe_in_the_distro_with_setsid() {
        let a = args(&[
            "-y",
            "--issues-dir",
            ".scratch/demo",
            "--run-dir",
            "logs/r1",
        ]);
        assert_eq!(
            wsl_launch_args("Ubuntu", "/home/me/app", SCRIPT, &a).join(" "),
            "-d Ubuntu --cd /home/me/app -- setsid /bin/bash ralph/run-ralph-tickets.sh -y --issues-dir .scratch/demo --run-dir logs/r1"
        );
        let wsl = Wsl {
            distro: "Ubuntu",
            linux_root: "/home/me/app",
        };
        let cmd = wsl_command(&wsl, "logs/r1/ralph/run-ralph-tickets.sh", &a);
        assert_eq!(cmd.get_program(), OsStr::new("wsl.exe"));
        let removed = cmd
            .get_envs()
            .find(|(k, _)| *k == OsStr::new("TERAX_TERMINAL"));
        assert_eq!(removed, Some((OsStr::new("TERAX_TERMINAL"), None)));
        let got: Vec<_> = cmd.get_args().collect();
        assert_eq!(got.len(), 8 + a.len());
        assert_eq!(got[6], OsStr::new("/bin/bash"));
        assert_eq!(got[7], OsStr::new("logs/r1/ralph/run-ralph-tickets.sh"));
    }

    #[test]
    fn a_wsl_start_needs_windows_and_a_linux_path() {
        let a = args(&["-y", "--run-dir", "logs/r1"]);
        let ok = Wsl {
            distro: "Ubuntu",
            linux_root: "/home/me/app",
        };
        let bad = Wsl {
            distro: "Ubuntu",
            linux_root: "C:\\app",
        };
        let repo = tempfile::tempdir().unwrap();
        if !cfg!(windows) {
            assert!(start(repo.path(), &a, "", Some(&ok), None)
                .unwrap_err()
                .contains("only available on Windows"));
        }
        assert!(start(repo.path(), &a, "", Some(&bad), None).is_err());
    }

    #[test]
    fn the_run_folder_must_be_new_and_under_logs() {
        let ok = args(&["-y", "--run-dir", "logs/ralph-tickets-1"]);
        assert_eq!(run_dir_arg(&ok), Some("logs/ralph-tickets-1"));
        for bad in ["/tmp/x", "logs", "../logs/x", "logs/../../x", "other/x"] {
            assert_eq!(run_dir_arg(&args(&["--run-dir", bad])), None, "{bad}");
        }
        assert_eq!(run_dir_arg(&args(&["-y"])), None);
    }

    #[cfg(unix)]
    #[test]
    fn a_started_run_does_not_inherit_terax_terminal_and_lives_in_the_repo_root() {
        use std::os::unix::fs::PermissionsExt;
        let repo = tempfile::tempdir().unwrap();
        let script = repo.path().join(SCRIPT);
        fs::create_dir_all(script.parent().unwrap()).unwrap();
        fs::write(
            &script,
            "#!/bin/sh\n{ echo \"term=${TERAX_TERMINAL-unset}\"; pwd; echo \"$@\"; } > seen.txt\n",
        )
        .unwrap();
        fs::set_permissions(&script, fs::Permissions::from_mode(0o755)).unwrap();
        std::env::set_var("TERAX_TERMINAL", "1");
        let a = args(&["-y", "--run-dir", "logs/r1"]);
        start(
            repo.path(),
            &a,
            "setsid ralph/run-ralph-tickets.sh -y",
            None,
            None,
        )
        .unwrap();
        let seen = repo.path().join("seen.txt");
        for _ in 0..100 {
            if seen.is_file() && fs::metadata(&seen).map(|m| m.len() > 0).unwrap_or(false) {
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
        std::env::remove_var("TERAX_TERMINAL");
        let text = fs::read_to_string(&seen).unwrap();
        assert!(text.starts_with("term=unset\n"), "{text}");
        assert!(text.contains("-y --run-dir logs/r1"));
        let line = fs::read_to_string(repo.path().join("logs/r1").join(LAUNCH_LINE_FILE)).unwrap();
        assert_eq!(line, "setsid ralph/run-ralph-tickets.sh -y");
    }

    #[cfg(unix)]
    #[test]
    fn a_start_is_refused_without_the_script_or_without_a_run_folder() {
        let repo = tempfile::tempdir().unwrap();
        let ok = args(&["-y", "--run-dir", "logs/r1"]);
        let err = start(repo.path(), &ok, "", None, None).unwrap_err();
        assert!(
            err.contains("neither in the repo root nor with the app"),
            "{err}"
        );
        assert!(!repo.path().join("logs/r1").exists());
        assert!(start(
            repo.path(),
            &args(&["--run-dir", "logs/r1"]),
            "",
            None,
            None
        )
        .is_err());
        assert!(start(repo.path(), &args(&["-y"]), "", None, None).is_err());
    }

    /// A fake of the app's `ralph` folder: a script that sources its reader from beside itself, as
    /// the real one does, and records where it ran.
    #[cfg(unix)]
    fn fake_bundle(dir: &Path, mark: &str) {
        fs::create_dir_all(dir.join("lib")).unwrap();
        fs::write(dir.join("lib/tickets.sh"), format!("LIB_SAYS={mark}\n")).unwrap();
        fs::write(
            dir.join("run-ralph-tickets.sh"),
            "#!/bin/bash\nRALPH_HOME=\"$(cd \"$(dirname \"${BASH_SOURCE[0]}\")\" && pwd)\"\n\
             source \"$RALPH_HOME/lib/tickets.sh\"\n\
             { echo \"$LIB_SAYS\"; pwd; echo \"$@\"; } > seen.txt\n",
        )
        .unwrap();
    }

    #[cfg(unix)]
    fn wait_for(path: &Path) -> String {
        for _ in 0..100 {
            if let Ok(text) = fs::read_to_string(path) {
                if text.lines().count() >= 3 {
                    return text;
                }
            }
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
        panic!("{} was never written", path.display());
    }

    /// A repo with no `ralph/` folder of its own runs the app's copy, in the repo root.
    #[cfg(unix)]
    #[test]
    fn a_repo_without_its_own_script_runs_the_apps_copy() {
        let repo = tempfile::tempdir().unwrap();
        let app = tempfile::tempdir().unwrap();
        fake_bundle(app.path(), "bundled");
        let a = args(&["-y", "--issues-dir", ".scratch/f", "--run-dir", "logs/r1"]);
        start(
            repo.path(),
            &a,
            "setsid ralph/run-ralph-tickets.sh -y --issues-dir .scratch/f --run-dir logs/r1",
            None,
            Some(app.path()),
        )
        .unwrap();
        let text = wait_for(&repo.path().join("seen.txt"));
        let mut lines = text.lines();
        assert_eq!(lines.next(), Some("bundled"));
        assert_eq!(
            Path::new(lines.next().unwrap()).canonicalize().unwrap(),
            repo.path().canonicalize().unwrap()
        );
        assert_eq!(
            lines.next(),
            Some("-y --issues-dir .scratch/f --run-dir logs/r1")
        );
        assert!(!repo.path().join("ralph").exists());
        let line = fs::read_to_string(repo.path().join("logs/r1").join(LAUNCH_LINE_FILE)).unwrap();
        assert_eq!(
            line,
            "setsid logs/r1/ralph/run-ralph-tickets.sh -y --issues-dir .scratch/f --run-dir logs/r1"
        );
    }

    #[cfg(unix)]
    #[test]
    fn the_repos_own_script_wins_over_the_apps_copy() {
        let repo = tempfile::tempdir().unwrap();
        let app = tempfile::tempdir().unwrap();
        fake_bundle(&repo.path().join("ralph"), "repo");
        fake_bundle(app.path(), "bundled");
        assert_eq!(
            script_source(repo.path(), Some(app.path())),
            Ok(ScriptSource::Repo)
        );
        let a = args(&["-y", "--run-dir", "logs/r1"]);
        start(
            repo.path(),
            &a,
            "setsid ralph/run-ralph-tickets.sh -y",
            None,
            Some(app.path()),
        )
        .unwrap();
        assert!(wait_for(&repo.path().join("seen.txt")).starts_with("repo\n"));
        assert!(!repo.path().join("logs/r1/ralph").exists());
    }

    #[test]
    fn an_app_copy_missing_its_reader_is_not_used() {
        let repo = tempfile::tempdir().unwrap();
        let app = tempfile::tempdir().unwrap();
        fs::write(app.path().join("run-ralph-tickets.sh"), "").unwrap();
        assert!(script_source(repo.path(), Some(app.path())).is_err());
        assert!(script_source(repo.path(), None).is_err());
    }
}
