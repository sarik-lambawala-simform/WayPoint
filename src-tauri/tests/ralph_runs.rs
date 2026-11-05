//! The run model over real run folders: the real `run-ralph-tickets.sh` runs in a temp git repo
//! with the fake `claude` and `curl` of `ralph/tests/fakes` playing back a saved stream, and the
//! model reads the folder it made. Needs `bash`, `git` and `jq`, so it runs on Linux and macOS.

#![cfg(unix)]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant, SystemTime};

use terax_lib::modules::ralph::runs::{read_loop_view, script_alive, Env, LoopView, RunStatus};

fn ralph() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../ralph")
}

fn git(repo: &Path, args: &[&str]) {
    let out = Command::new("git")
        .args(args)
        .current_dir(repo)
        .output()
        .expect("git runs");
    assert!(
        out.status.success(),
        "git {args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
}

/// A temp git repo with one commit and `.scratch/demo/issues/01-the-first-ticket.md`, ready for the agent.
fn make_repo() -> tempfile::TempDir {
    let repo = tempfile::tempdir().unwrap();
    let p = repo.path();
    git(p, &["init", "-q", "-b", "main"]);
    git(p, &["config", "user.email", "test@example.com"]);
    git(p, &["config", "user.name", "Test"]);
    git(p, &["config", "commit.gpgsign", "false"]);
    fs::write(p.join(".gitignore"), ".scratch/\nlogs/\n").unwrap();
    fs::write(p.join("README.md"), "temp repo\n").unwrap();
    git(p, &["add", "."]);
    git(p, &["commit", "-q", "-m", "start"]);
    let issues = p.join(".scratch/demo/issues");
    fs::create_dir_all(&issues).unwrap();
    fs::write(p.join(".scratch/demo/spec.md"), "# Demo\n").unwrap();
    fs::write(
        issues.join("01-the-first-ticket.md"),
        "# 01. The first ticket\n\n**Blocked by:** None\n\n**Status:** ready-for-agent\n\n- [ ] Do it.\n",
    )
    .unwrap();
    repo
}

fn start(repo: &Path, delay: &str) -> Child {
    let path = format!(
        "{}:{}",
        ralph().join("tests/fakes").display(),
        std::env::var("PATH").unwrap_or_default()
    );
    Command::new(ralph().join("run-ralph-tickets.sh"))
        .args(["-y", "--issues-dir", ".scratch/demo", "--no-caffeinate"])
        .current_dir(repo)
        .env("PATH", path)
        .env(
            "FAKE_CLAUDE_STREAM",
            ralph().join("tests/fixtures/streams/done.jsonl"),
        )
        .env("FAKE_CLAUDE_DELAY", delay)
        .env("RALPH_HEARTBEAT_SECS", "0.2")
        .env("RALPH_STOP_POLL", "0.1")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .expect("the script starts")
}

fn run_dir(repo: &Path) -> Option<PathBuf> {
    let mut runs: Vec<PathBuf> = fs::read_dir(repo.join("logs"))
        .ok()?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .collect();
    runs.sort();
    runs.pop()
}

fn wait_for(what: &str, mut check: impl FnMut() -> bool) {
    let until = Instant::now() + Duration::from_secs(20);
    while !check() {
        assert!(Instant::now() < until, "timed out waiting for {what}");
        std::thread::sleep(Duration::from_millis(20));
    }
}

fn phase(repo: &Path) -> String {
    run_dir(repo)
        .and_then(|d| fs::read_to_string(d.join("state.json")).ok())
        .and_then(|t| serde_json::from_str::<serde_json::Value>(&t).ok())
        .and_then(|v| v["phase"].as_str().map(str::to_string))
        .unwrap_or_default()
}

fn no_pid(_: u32) -> Option<bool> {
    None
}

fn view(repo: &Path, now: SystemTime, pid_alive: &dyn Fn(u32) -> Option<bool>) -> LoopView {
    let env = Env { now, pid_alive };
    read_loop_view(repo, &repo.join(".scratch/demo"), "demo", &env)
}

#[test]
fn a_finished_run_reads_finished_with_its_time_and_cost() {
    let repo = make_repo();
    let status = start(repo.path(), "0").wait().unwrap();
    assert!(status.success());
    let v = view(repo.path(), SystemTime::now(), &script_alive);
    let run = v.run.expect("a run");
    assert_eq!(run.status, RunStatus::Finished);
    assert_eq!(run.tickets_ended, 1);
    // `done.jsonl` ends with a `result` event costing $2.68.
    assert!((run.cost.usd - 2.68).abs() < 0.01, "{}", run.cost.usd);
    assert_eq!(run.cost.partial, None);
    let t = &v.tickets[0];
    assert!(t.spent.seconds.is_some());
    assert!(t.spent.cost.is_some_and(|c| (c - 2.68).abs() < 0.01));
    assert_eq!(t.spent.cost_partial, None);
}

#[test]
fn a_run_with_no_heartbeat_reads_finished_when_it_finished() {
    let repo = make_repo();
    assert!(start(repo.path(), "0").wait().unwrap().success());
    let dir = run_dir(repo.path()).unwrap();
    fs::remove_file(dir.join("heartbeat")).unwrap();
    let run = view(repo.path(), SystemTime::now(), &script_alive)
        .run
        .unwrap();
    assert_eq!(run.status, RunStatus::Finished);
    assert_eq!(run.heartbeat_at_ms, None);
}

#[test]
fn a_running_script_is_live_and_a_stale_heartbeat_or_a_kill_dies_it() {
    let repo = make_repo();
    let mut script = start(repo.path(), "1");
    wait_for("claude to run", || {
        phase(repo.path()) == "running"
            && run_dir(repo.path()).is_some_and(|d| d.join("heartbeat").exists())
    });
    let now = SystemTime::now();
    let v = view(repo.path(), now, &script_alive);
    assert_eq!(v.run.as_ref().unwrap().status, RunStatus::Live);
    assert!(v.tickets[0].running);
    assert!(v.tickets[0].spent.running_since_ms.is_some());

    // The same folder a minute later, with no pid check: the heartbeat is the rule.
    let stale = view(repo.path(), now + Duration::from_secs(60), &no_pid);
    assert_eq!(stale.run.as_ref().unwrap().status, RunStatus::Died);
    let died = &stale.tickets[0].spent;
    assert!(died.cost_partial.is_some());
    assert_eq!(died.cost, None);

    // kill -9: the heartbeat is still fresh, the dead pid is the faster signal.
    script.kill().unwrap();
    script.wait().unwrap();
    let killed = view(repo.path(), SystemTime::now(), &script_alive);
    assert_eq!(killed.run.as_ref().unwrap().status, RunStatus::Died);
    assert!(killed.run.unwrap().cost.partial.is_some());
}

#[test]
fn a_died_run_with_no_heartbeat_still_reads_died() {
    let repo = make_repo();
    let mut script = start(repo.path(), "1");
    wait_for("claude to run", || phase(repo.path()) == "running");
    script.kill().unwrap();
    script.wait().unwrap();
    let dir = run_dir(repo.path()).unwrap();
    let _ = fs::remove_file(dir.join("heartbeat"));
    let run = view(repo.path(), SystemTime::now(), &no_pid).run.unwrap();
    assert_eq!(run.status, RunStatus::Died);
}
