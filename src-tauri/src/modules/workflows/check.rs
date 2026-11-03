//! The `check` gate: one shell command, run in the repo root, only when the developer asks.
//! The functional core is `run_check`; the Tauri command in `commands.rs` stays thin.

use std::io::Read;
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use serde::Serialize;

use super::workflow::{substitute, Vars};

/// Output kept for display: the tail, where the failure usually is.
const MAX_OUTPUT: usize = 16 * 1024;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct CheckResult {
    pub passed: bool,
    /// `None` when the command did not start, timed out or was killed by a signal.
    pub exit_code: Option<i32>,
    /// What the command printed (stdout then stderr), or why it could not run.
    pub output: String,
    /// The command as run, placeholders filled in.
    pub command: String,
}

fn shell(command: &str) -> Command {
    #[cfg(windows)]
    {
        let mut c = Command::new("cmd");
        c.arg("/C").arg(command);
        crate::modules::proc::hide_console(&mut c);
        c
    }
    #[cfg(not(windows))]
    {
        let mut c = Command::new("sh");
        c.arg("-c").arg(command);
        c
    }
}

fn tail(mut text: String) -> String {
    if text.len() > MAX_OUTPUT {
        let mut cut = text.len() - MAX_OUTPUT;
        while !text.is_char_boundary(cut) {
            cut += 1;
        }
        text = format!("…{}", &text[cut..]);
    }
    text
}

fn drain<R: Read + Send + 'static>(mut r: R) -> thread::JoinHandle<Vec<u8>> {
    thread::spawn(move || {
        let mut buf = Vec::new();
        let _ = r.read_to_end(&mut buf);
        buf
    })
}

/// Runs `command` (placeholders filled in) with `repo_root` as its working folder.
pub fn run_check(repo_root: &Path, command: &str, vars: &Vars, timeout: Duration) -> CheckResult {
    let command = substitute(command, vars);
    let failed = |output: String| CheckResult {
        passed: false,
        exit_code: None,
        output,
        command: command.clone(),
    };
    let mut child = match shell(&command)
        .current_dir(repo_root)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(c) => c,
        Err(e) => return failed(format!("could not start the command: {e}")),
    };
    let out = child.stdout.take().map(drain);
    let err = child.stderr.take().map(drain);
    let started = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(s)) => break Some(s),
            Ok(None) if started.elapsed() >= timeout => {
                let _ = child.kill();
                let _ = child.wait();
                break None;
            }
            Ok(None) => thread::sleep(Duration::from_millis(20)),
            Err(e) => return failed(format!("could not wait for the command: {e}")),
        }
    };
    let mut text = String::new();
    for handle in [out, err].into_iter().flatten() {
        if let Ok(bytes) = handle.join() {
            text.push_str(&String::from_utf8_lossy(&bytes));
        }
    }
    let Some(status) = status else {
        let mut output = tail(text);
        output.push_str(&format!("\n(stopped after {} s)", timeout.as_secs()));
        return failed(output);
    };
    CheckResult {
        passed: status.success(),
        exit_code: status.code(),
        output: tail(text),
        command,
    }
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;

    fn vars() -> Vars<'static> {
        Vars {
            feature: ".scratch/login",
            workflow_dir: "/w",
        }
    }

    fn run(root: &Path, cmd: &str) -> CheckResult {
        run_check(root, cmd, &vars(), Duration::from_secs(10))
    }

    #[test]
    fn exit_zero_passes_and_runs_in_the_repo_root() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::write(dir.path().join("marker"), "x").unwrap();
        let r = run(dir.path(), "test -f marker");
        assert!(r.passed);
        assert_eq!(r.exit_code, Some(0));
    }

    #[test]
    fn a_failure_reports_its_exit_code_and_output() {
        let dir = tempfile::tempdir().unwrap();
        let r = run(dir.path(), "echo out; echo err >&2; exit 3");
        assert!(!r.passed);
        assert_eq!(r.exit_code, Some(3));
        assert!(
            r.output.contains("out") && r.output.contains("err"),
            "{r:?}"
        );
    }

    #[test]
    fn placeholders_are_filled_in_and_shown() {
        let dir = tempfile::tempdir().unwrap();
        let r = run(dir.path(), "echo {{ feature }}");
        assert_eq!(r.command, "echo .scratch/login");
        assert!(r.output.contains(".scratch/login"));
    }

    #[test]
    fn a_command_that_overruns_is_killed_and_fails() {
        let dir = tempfile::tempdir().unwrap();
        let r = run_check(dir.path(), "sleep 5", &vars(), Duration::from_millis(100));
        assert!(!r.passed);
        assert_eq!(r.exit_code, None);
        assert!(r.output.contains("stopped after"), "{r:?}");
    }
}
