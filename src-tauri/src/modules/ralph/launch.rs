//! Starting a run: the script detached from the app, never from a pane.
//!
//! The page builds the arguments (and shows the exact line); this module refuses a start while the
//! repo has a live run, writes the launch line into the run folder so the header can show it after
//! a reopen, and spawns `ralph/run-ralph-tickets.sh` in its own session so it outlives the app.
//! The command is built by a pure function, so a test reads the environment it would spawn with.

use std::fs;
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::SystemTime;

use super::runs::{live_runs, script_alive, Env, LAUNCH_LINE_FILE};

/// The script, relative to the repo root where it runs.
pub const SCRIPT: &str = "ralph/run-ralph-tickets.sh";

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

/// The command that runs the script: in the repo root, in a session of its own, without the
/// marker that says "inside a Terax pane" and with its output discarded (the run folder has it).
pub fn detached_command(repo_root: &Path, args: &[String]) -> Command {
    let mut cmd = Command::new(repo_root.join(SCRIPT));
    cmd.args(args)
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

/// Starts a run. `launch_line` is what the form showed; it is stored beside the run.
pub fn start(repo_root: &Path, args: &[String], launch_line: &str) -> Result<(), String> {
    if cfg!(windows) {
        return Err("Starting the loop on Windows needs the WSL launch.".to_string());
    }
    if !repo_root.is_absolute() || !repo_root.is_dir() {
        return Err(format!("{}: not a folder", repo_root.display()));
    }
    if !args.iter().any(|a| a == "-y") {
        return Err("The loop is started with -y.".to_string());
    }
    let run_dir = run_dir_arg(args)
        .ok_or_else(|| "The run folder must be a new folder under logs/.".to_string())?;
    let script = repo_root.join(SCRIPT);
    if !script.is_file() {
        return Err(format!("{} was not found in the repo root.", SCRIPT));
    }
    let env = Env {
        now: SystemTime::now(),
        pid_alive: &script_alive,
    };
    if let Some(live) = live_runs(repo_root, &env).first() {
        return Err(format!("{} already has a live run.", live.feature));
    }
    let folder: PathBuf = repo_root.join(run_dir);
    fs::create_dir_all(&folder).map_err(|e| format!("{}: {e}", folder.display()))?;
    fs::write(folder.join(LAUNCH_LINE_FILE), launch_line)
        .map_err(|e| format!("{}: {e}", folder.display()))?;
    let mut child = detached_command(repo_root, args)
        .spawn()
        .map_err(|e| format!("could not start {SCRIPT}: {e}"))?;
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
        let cmd = detached_command(Path::new("/repo"), &args(&["-y"]));
        let removed = cmd
            .get_envs()
            .find(|(k, _)| *k == OsStr::new("TERAX_TERMINAL"));
        assert_eq!(removed, Some((OsStr::new("TERAX_TERMINAL"), None)));
        assert_eq!(cmd.get_current_dir(), Some(Path::new("/repo")));
        assert_eq!(
            cmd.get_program(),
            OsStr::new("/repo/ralph/run-ralph-tickets.sh")
        );
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
        start(repo.path(), &a, "setsid ralph/run-ralph-tickets.sh -y").unwrap();
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
        assert!(start(repo.path(), &ok, "")
            .unwrap_err()
            .contains("not found"));
        assert!(start(repo.path(), &args(&["--run-dir", "logs/r1"]), "").is_err());
        assert!(start(repo.path(), &args(&["-y"]), "").is_err());
    }
}
