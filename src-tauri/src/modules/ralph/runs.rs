//! The run model: what a feature's newest run folder says, as the Loop stage shows it.
//!
//! Port of the Ralph UI server's `runs.ts`, `board.ts` and the run-reading half of `stream.ts`.
//! It reads `state.json`, `heartbeat`, `tickets.tsv` (the per-ticket results) and the
//! `ticket-NN.jsonl` streams of `<repo>/logs/<run>/`, and never writes. A run folder made by the
//! web app reads as it is.
//!
//! A run is **live** when its phase is not `finished` and `heartbeat` is under 30 s old, and
//! **died** when its phase is not `finished` and the heartbeat is older. Only the app works this
//! out; the script never writes `died`. On Linux and macOS a dead pid is a faster signal for a
//! `kill -9`; the heartbeat is the rule. A folder with no `state.json` is finished, and one with
//! no `heartbeat` reads fine when finished and shows as died when not.
//!
//! The core is pure over a `now` and a pid check, so the tests need no clock and no real process.

use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::Serialize;

use super::tickets::{read_tickets, Ticket};

/// A run whose heartbeat is older than this has stopped, whatever its `state.json` says.
pub const HEARTBEAT_LIVE: Duration = Duration::from_secs(30);

/// The fields of `state.json` the app reads. A field the file lacks reads as "".
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct RunState {
    pub script_pid: u32,
    pub feature: String,
    pub ticket: String,
    pub phase: String,
    pub phase_since: String,
    pub quota_resets_at: String,
    pub offline_since: String,
    pub exit_code: Option<i64>,
}

/// Where a run is: `Died` is a run whose script is gone without writing `finished`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RunStatus {
    Live,
    Finished,
    Died,
}

/// A run folder's `state.json`, or None when it has none or it does not parse. Like the Node
/// reader, a file without a numeric `script_pid` is not a state file.
pub fn read_state(dir: &Path) -> Option<RunState> {
    let text = fs::read_to_string(dir.join("state.json")).ok()?;
    let v: serde_json::Value = serde_json::from_str(&text).ok()?;
    let pid = v.get("script_pid")?.as_u64()?;
    let text_of = |key: &str| {
        v.get(key)
            .and_then(|x| x.as_str())
            .unwrap_or_default()
            .to_string()
    };
    Some(RunState {
        script_pid: u32::try_from(pid).ok()?,
        feature: text_of("feature"),
        ticket: text_of("ticket"),
        phase: text_of("phase"),
        phase_since: text_of("phase_since"),
        quota_resets_at: text_of("quota_resets_at"),
        offline_since: text_of("offline_since"),
        exit_code: v.get("exit_code").and_then(|x| x.as_i64()),
    })
}

/// A run's status from its state and the two signals that tell a live script from a dead one.
/// `pid_alive` is None where the check does not travel (Windows, WSL); `Some(false)` is the
/// fast signal for a `kill -9`.
pub fn run_status(
    state: Option<&RunState>,
    heartbeat_age: Option<Duration>,
    pid_alive: Option<bool>,
) -> RunStatus {
    let Some(state) = state else {
        return RunStatus::Finished;
    };
    if state.phase == "finished" {
        return RunStatus::Finished;
    }
    if pid_alive == Some(false) {
        return RunStatus::Died;
    }
    match heartbeat_age {
        Some(age) if age < HEARTBEAT_LIVE => RunStatus::Live,
        _ => RunStatus::Died,
    }
}

/// Whether `pid` is still the script: the pid runs, and `ps` shows `run-ralph-tickets.sh` for it,
/// so a new process that got the old pid does not count. None where there is no `ps`.
#[cfg(unix)]
pub fn script_alive(pid: u32) -> Option<bool> {
    // SAFETY: signal 0 only checks that the pid exists; nothing is sent.
    let rc = unsafe { libc::kill(pid as libc::pid_t, 0) };
    if rc != 0 {
        // EPERM: alive, owned by someone else. `ps` decides.
        let denied = std::io::Error::last_os_error().raw_os_error() == Some(libc::EPERM);
        if !denied {
            return Some(false);
        }
    }
    let out = std::process::Command::new("ps")
        .args(["-p", &pid.to_string(), "-o", "command="])
        .output()
        .ok()?;
    Some(
        out.status.success()
            && String::from_utf8_lossy(&out.stdout).contains("run-ralph-tickets.sh"),
    )
}

#[cfg(not(unix))]
pub fn script_alive(_pid: u32) -> Option<bool> {
    None
}

/// The folder in a run that holds a feature's tickets: `<NN>-<feature>`.
pub fn feature_dir(run_dir: &Path, feature: &str) -> Option<PathBuf> {
    let mut found: Vec<PathBuf> = fs::read_dir(run_dir)
        .ok()?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_dir())
        .filter(|e| number_prefixed(&e.file_name().to_string_lossy()) == Some(feature.to_string()))
        .map(|e| e.path())
        .collect();
    found.sort();
    found.into_iter().next()
}

/// `name` without its `^[0-9]+-` prefix, or None when it has none.
fn number_prefixed(name: &str) -> Option<String> {
    let rest = name.trim_start_matches(|c: char| c.is_ascii_digit());
    if rest.len() < name.len() && rest.starts_with('-') {
        Some(rest[1..].to_string())
    } else {
        None
    }
}

/// One row of a feature's `tickets.tsv`: the script writes one per ticket it ran.
#[derive(Clone, Debug, PartialEq)]
pub struct ResultRow {
    pub number: String,
    pub seconds: u64,
    /// USD; 0 when the script never saw a cost (a cut stream).
    pub cost: f64,
}

/// The rows of a `tickets.tsv`: number, outcome, seconds, cost, then columns the app skips.
pub fn read_result_rows(file: &Path) -> Vec<ResultRow> {
    let Ok(text) = fs::read_to_string(file) else {
        return Vec::new();
    };
    text.lines()
        .filter_map(|line| {
            let mut cols = line.split('\t');
            let number = cols.next()?;
            let _outcome = cols.next()?;
            if number.len() != 2 || !number.chars().all(|c| c.is_ascii_digit()) {
                return None;
            }
            let seconds = cols
                .next()
                .and_then(|s| s.trim().parse::<f64>().ok())
                .filter(|s| s.is_finite() && *s > 0.0)
                .unwrap_or(0.0);
            let cost = cols
                .next()
                .and_then(|s| s.trim().parse::<f64>().ok())
                .filter(|c| c.is_finite() && *c > 0.0)
                .unwrap_or(0.0);
            Some(ResultRow {
                number: number.to_string(),
                seconds: seconds as u64,
                cost,
            })
        })
        .collect()
}

/// Every run folder of a repo, oldest first. Run folders are named by their start stamp, so name
/// order is time order.
fn run_dirs(logs: &Path) -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = match fs::read_dir(logs) {
        Ok(rd) => rd
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| p.is_dir())
            .collect(),
        Err(_) => Vec::new(),
    };
    dirs.sort();
    dirs
}

fn ms_of(t: SystemTime) -> i64 {
    t.duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// When the run folder was made.
fn started_at(dir: &Path) -> Option<SystemTime> {
    let meta = fs::metadata(dir).ok()?;
    meta.created().or_else(|_| meta.modified()).ok()
}

fn mtime(path: &Path) -> Option<SystemTime> {
    fs::metadata(path).and_then(|m| m.modified()).ok()
}

/// A figure with the reason it is only part of the whole. The UI marks it `+` and shows the reason.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct Cost {
    pub usd: f64,
    pub partial: Option<String>,
}

/// One run as the Loop header shows it. Times are absolute so the page can count on from them
/// without asking again every second.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct RunView {
    /// The run folder's name in `logs/`.
    pub id: String,
    pub dir: String,
    pub status: RunStatus,
    pub phase: String,
    pub phase_since: String,
    pub ticket: String,
    pub quota_resets_at: String,
    pub offline_since: String,
    pub exit_code: Option<i64>,
    /// Unix ms when the run folder was made.
    pub started_at_ms: Option<i64>,
    /// Unix ms when the run last wrote, for a run that is not live; None while live.
    pub ended_at_ms: Option<i64>,
    /// Unix ms of the last heartbeat; None for a folder that has none.
    pub heartbeat_at_ms: Option<i64>,
    /// How many tickets the run has ended.
    pub tickets_ended: usize,
    /// USD of the tickets the run has ended.
    pub cost: Cost,
    /// The command the app started the run with, from the run folder's `launch-line`; None for a
    /// run started elsewhere.
    pub launch_line: Option<String>,
}

/// A ticket's time and cost from the newest run that recorded it.
#[derive(Clone, Debug, Default, PartialEq, Serialize)]
pub struct Spent {
    pub seconds: Option<u64>,
    pub seconds_partial: Option<String>,
    /// None when no run recorded a cost for it.
    pub cost: Option<f64>,
    /// Why the cost is partial, or why there is none.
    pub cost_partial: Option<String>,
    /// Unix ms when the live run started the ticket; the page counts time on from it.
    pub running_since_ms: Option<i64>,
}

/// One row of the Loop's ticket list.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct TicketRow {
    pub number: String,
    pub name: String,
    pub title: String,
    /// The ticket's status key, "" when it has none.
    pub status: String,
    pub human: bool,
    pub running: bool,
    pub spent: Spent,
}

/// What the Loop stage shows for a feature: its newest run (if any) and every build ticket.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct LoopView {
    pub run: Option<RunView>,
    pub tickets: Vec<TicketRow>,
}

const CUT: &str =
    "A stream was cut before its cost was recorded, so this cost may not be the whole.";
const DIED_COST: &str = "The run died during this ticket, so its cost was never recorded.";
const DIED_TIME: &str = "The run died during this ticket; this is the time up to its last output.";
const LIVE_COST: &str = "A ticket that is still running counts when it ends.";

/// The file the app writes in a run folder it starts: the command it ran.
pub const LAUNCH_LINE_FILE: &str = "launch-line";

/// A run that is live, and the feature it works on.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct LiveRun {
    pub feature: String,
    pub run_id: String,
}

/// Every live run under `<repo>/logs/`, whatever feature it works on. One run per repo means this
/// holds at most one entry, unless runs were started outside the app.
pub fn live_runs(repo_root: &Path, env: &Env) -> Vec<LiveRun> {
    run_dirs(&repo_root.join("logs"))
        .into_iter()
        .filter_map(|dir| {
            let state = read_state(&dir)?;
            if state.phase == "finished" {
                return None;
            }
            let heartbeat = mtime(&dir.join("heartbeat"))
                .map(|t| env.now.duration_since(t).unwrap_or_default());
            let alive = (env.pid_alive)(state.script_pid);
            (run_status(Some(&state), heartbeat, alive) == RunStatus::Live).then(|| LiveRun {
                feature: state.feature.clone(),
                run_id: dir
                    .file_name()
                    .map(|n| n.to_string_lossy().into_owned())
                    .unwrap_or_default(),
            })
        })
        .collect()
}

/// The signals a view needs from outside the folder; tests pass their own.
pub struct Env<'a> {
    pub now: SystemTime,
    pub pid_alive: &'a dyn Fn(u32) -> Option<bool>,
}

/// A run folder as the Loop shows it, and the rows it recorded for `feature`.
fn view_run(
    dir: &Path,
    state: Option<&RunState>,
    feature: &str,
    env: &Env,
) -> (RunView, Vec<ResultRow>) {
    let heartbeat = mtime(&dir.join("heartbeat"));
    let heartbeat_age = heartbeat.map(|t| env.now.duration_since(t).unwrap_or_default());
    // The pid is only worth asking when the phase says the run is going.
    let going = state.is_some_and(|s| s.phase != "finished");
    let pid_alive = match state {
        Some(s) if going => (env.pid_alive)(s.script_pid),
        _ => None,
    };
    let status = run_status(state, heartbeat_age, pid_alive);

    let rows: Vec<ResultRow> = feature_dir(dir, feature)
        .map(|sub| read_result_rows(&sub.join("tickets.tsv")))
        .unwrap_or_default();
    let usd: f64 = rows.iter().map(|r| r.cost).sum();
    let unknown = rows.iter().filter(|r| r.cost <= 0.0).count();
    let in_flight = state
        .filter(|s| !s.ticket.is_empty() && s.phase != "finished")
        .filter(|s| !rows.iter().any(|r| r.number == s.ticket))
        .map(|s| s.ticket.clone());
    let partial = if unknown > 0 {
        Some(format!(
            "{unknown} ended ticket{} recorded no cost (a cut stream), so this is a floor.",
            if unknown == 1 { "" } else { "s" }
        ))
    } else {
        match (status, &in_flight) {
            (RunStatus::Died, Some(t)) => Some(format!(
                "The run died during ticket {t}, whose cost was never recorded."
            )),
            (RunStatus::Live, Some(t)) => Some(format!(
                "Ticket {t} is still running; its cost counts when it ends."
            )),
            _ => None,
        }
    };
    let ended_at = match status {
        RunStatus::Live => None,
        RunStatus::Finished => mtime(&dir.join("state.json")).or(heartbeat),
        RunStatus::Died => heartbeat.or_else(|| mtime(&dir.join("state.json"))),
    };
    let empty = RunState::default();
    let s = state.unwrap_or(&empty);
    let view = RunView {
        id: dir
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default(),
        dir: dir.to_string_lossy().into_owned(),
        status,
        phase: s.phase.clone(),
        phase_since: s.phase_since.clone(),
        ticket: s.ticket.clone(),
        quota_resets_at: s.quota_resets_at.clone(),
        offline_since: s.offline_since.clone(),
        exit_code: s.exit_code,
        started_at_ms: started_at(dir).map(ms_of),
        ended_at_ms: ended_at.map(ms_of),
        heartbeat_at_ms: heartbeat.map(ms_of),
        tickets_ended: rows.len(),
        cost: Cost { usd, partial },
        launch_line: fs::read_to_string(dir.join(LAUNCH_LINE_FILE))
            .ok()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty()),
    };
    (view, rows)
}

/// The newest run folder that belongs to `feature`: it holds the feature's `<NN>-<feature>` folder,
/// or its state names the feature (a run that has just started).
fn newest_run(logs: &Path, feature: &str) -> Option<(PathBuf, Option<RunState>)> {
    run_dirs(logs).into_iter().rev().find_map(|dir| {
        let state = read_state(&dir);
        let ours = feature_dir(&dir, feature).is_some()
            || state.as_ref().is_some_and(|s| s.feature == feature);
        ours.then_some((dir, state))
    })
}

/// A ticket's time and cost from the newest run that recorded it. Rows of one run are summed: a
/// ticket attempted twice in a run has two, and one with no cost makes the sum partial.
fn spent_by_ticket(logs: &Path, feature: &str, numbers: &[String]) -> Vec<(String, Spent)> {
    let mut found: Vec<(String, Spent)> = Vec::new();
    for dir in run_dirs(logs).into_iter().rev() {
        let Some(sub) = feature_dir(&dir, feature) else {
            continue;
        };
        let rows = read_result_rows(&sub.join("tickets.tsv"));
        for n in numbers {
            if found.iter().any(|(f, _)| f == n) {
                continue;
            }
            let mine: Vec<&ResultRow> = rows.iter().filter(|r| &r.number == n).collect();
            if mine.is_empty() {
                continue;
            }
            let usd: f64 = mine.iter().map(|r| r.cost).sum();
            let unknown = mine.iter().any(|r| r.cost <= 0.0);
            found.push((
                n.clone(),
                Spent {
                    seconds: Some(mine.iter().map(|r| r.seconds).sum()),
                    cost: (usd > 0.0).then_some(usd),
                    cost_partial: unknown.then(|| CUT.to_string()),
                    ..Spent::default()
                },
            ));
        }
        if found.len() == numbers.len() {
            break;
        }
    }
    found
}

/// When the stream of the ticket a run is on began and last grew, as unix ms.
fn stream_span(stream: &Path) -> Option<(i64, i64)> {
    let meta = fs::metadata(stream).ok()?;
    let last = meta.modified().ok()?;
    let first = meta.created().ok()?;
    Some((ms_of(first), ms_of(last)))
}

/// What the Loop stage shows for a feature: read from `<repo>/logs/` and the feature's `issues/`.
pub fn read_loop_view(
    repo_root: &Path,
    feature_dir_path: &Path,
    feature: &str,
    env: &Env,
) -> LoopView {
    let logs = repo_root.join("logs");
    let tickets: Vec<Ticket> = read_tickets(&feature_dir_path.join("issues"))
        .unwrap_or_default()
        .into_iter()
        .filter(|t| !t.wayfinder)
        .collect();
    let numbers: Vec<String> = tickets.iter().map(|t| t.number.clone()).collect();
    let mut spent = spent_by_ticket(&logs, feature, &numbers);

    let newest = newest_run(&logs, feature);
    let run = newest.as_ref().map(|(dir, state)| {
        let (view, rows) = view_run(dir, state.as_ref(), feature, env);
        (view, rows, dir.clone())
    });

    // The ticket the newest run is on and has not recorded: running now, or cut by a death.
    let mut running: Option<String> = None;
    if let Some((view, rows, dir)) = &run {
        let on = &view.ticket;
        let unrecorded = !on.is_empty() && !rows.iter().any(|r| &r.number == on);
        let stream = feature_dir(dir, feature).map(|sub| sub.join(format!("ticket-{on}.jsonl")));
        match view.status {
            RunStatus::Live if unrecorded => {
                running = Some(on.clone());
                let since = stream.as_deref().and_then(stream_span).map(|(a, _)| a);
                spent.retain(|(n, _)| n != on);
                spent.push((
                    on.clone(),
                    Spent {
                        running_since_ms: since,
                        cost_partial: Some(LIVE_COST.to_string()),
                        ..Spent::default()
                    },
                ));
            }
            RunStatus::Died if unrecorded => {
                let secs = stream
                    .as_deref()
                    .and_then(stream_span)
                    .map(|(a, b)| ((b - a).max(0) / 1000) as u64);
                spent.retain(|(n, _)| n != on);
                spent.push((
                    on.clone(),
                    Spent {
                        seconds: secs,
                        seconds_partial: secs.map(|_| DIED_TIME.to_string()),
                        cost_partial: Some(DIED_COST.to_string()),
                        ..Spent::default()
                    },
                ));
            }
            _ => {}
        }
    }

    let rows = tickets
        .into_iter()
        .map(|t| TicketRow {
            spent: spent
                .iter()
                .find(|(n, _)| n == &t.number)
                .map(|(_, s)| s.clone())
                .unwrap_or_default(),
            running: running.as_deref() == Some(t.number.as_str()),
            name: t
                .path
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default(),
            number: t.number,
            title: t.title,
            status: t.status_key,
            human: t.human,
        })
        .collect();
    LoopView {
        run: run.map(|(view, _, _)| view),
        tickets: rows,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn state(phase: &str) -> RunState {
        RunState {
            script_pid: 1,
            phase: phase.into(),
            ..RunState::default()
        }
    }

    const FRESH: Option<Duration> = Some(Duration::from_secs(2));
    const STALE: Option<Duration> = Some(Duration::from_secs(31));

    #[test]
    fn a_run_is_live_on_a_fresh_heartbeat_and_died_on_an_old_one() {
        let s = state("running");
        assert_eq!(run_status(Some(&s), FRESH, None), RunStatus::Live);
        assert_eq!(run_status(Some(&s), STALE, None), RunStatus::Died);
        assert_eq!(
            run_status(Some(&s), Some(Duration::from_secs(29)), None),
            RunStatus::Live
        );
        assert_eq!(
            run_status(Some(&s), Some(HEARTBEAT_LIVE), None),
            RunStatus::Died
        );
    }

    #[test]
    fn a_dead_pid_is_died_at_once_but_a_live_pid_does_not_rescue_a_stale_heartbeat() {
        let s = state("running");
        assert_eq!(run_status(Some(&s), FRESH, Some(false)), RunStatus::Died);
        assert_eq!(run_status(Some(&s), STALE, Some(true)), RunStatus::Died);
        assert_eq!(run_status(Some(&s), FRESH, Some(true)), RunStatus::Live);
    }

    #[test]
    fn a_finished_run_is_finished_whatever_the_signals_say() {
        let s = state("finished");
        assert_eq!(run_status(Some(&s), None, Some(false)), RunStatus::Finished);
        assert_eq!(run_status(Some(&s), STALE, None), RunStatus::Finished);
        assert_eq!(run_status(None, None, None), RunStatus::Finished);
    }

    #[test]
    fn a_run_with_no_heartbeat_is_died_unless_it_finished() {
        assert_eq!(
            run_status(Some(&state("running")), None, None),
            RunStatus::Died
        );
        assert_eq!(
            run_status(Some(&state("finished")), None, None),
            RunStatus::Finished
        );
    }

    #[test]
    fn a_feature_folder_is_the_numbered_one_for_that_name() {
        assert_eq!(number_prefixed("01-demo"), Some("demo".into()));
        assert_eq!(number_prefixed("12-a-b"), Some("a-b".into()));
        assert_eq!(number_prefixed("demo"), None);
        assert_eq!(number_prefixed("-demo"), None);
    }

    #[test]
    fn result_rows_read_seconds_and_cost_and_skip_other_lines() {
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("tickets.tsv");
        fs::write(
            &file,
            "01\tdone\t12\t0.5\t1\t2\t3\tTitle\tx\n02\tfailed\t7\t0\t0\t0\t0\tT\t\nxx\ta\t1\t1\n03\tdone\n",
        )
        .unwrap();
        let rows = read_result_rows(&file);
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].number, "01");
        assert_eq!(rows[0].seconds, 12);
        assert!((rows[0].cost - 0.5).abs() < 1e-9);
        assert_eq!(rows[1].cost, 0.0);
        assert!(read_result_rows(&dir.path().join("none.tsv")).is_empty());
    }

    fn no_pid(_: u32) -> Option<bool> {
        None
    }

    fn env_at(now: SystemTime) -> Env<'static> {
        Env {
            now,
            pid_alive: &no_pid,
        }
    }

    fn write_run(logs: &Path, id: &str, phase: &str, ticket: &str, rows: &str) -> PathBuf {
        let dir = logs.join(id);
        let sub = dir.join("01-demo");
        fs::create_dir_all(&sub).unwrap();
        fs::write(
            dir.join("state.json"),
            format!(
                r#"{{"script_pid":4242,"feature":"demo","ticket":"{ticket}","phase":"{phase}","phase_since":"","exit_code":""}}"#
            ),
        )
        .unwrap();
        fs::write(sub.join("tickets.tsv"), rows).unwrap();
        dir
    }

    fn feature_with_tickets(repo: &Path, numbers: &[&str]) -> PathBuf {
        let feature = repo.join(".scratch/demo");
        let issues = feature.join("issues");
        fs::create_dir_all(&issues).unwrap();
        for n in numbers {
            fs::write(
                issues.join(format!("{n}-ticket.md")),
                format!("# {n} — Ticket {n}\n\n**Status:** ready-for-agent\n"),
            )
            .unwrap();
        }
        feature
    }

    #[test]
    fn a_folder_with_no_heartbeat_reads_finished_and_a_running_one_reads_died() {
        let repo = tempfile::tempdir().unwrap();
        let logs = repo.path().join("logs");
        write_run(&logs, "old", "finished", "", "01\tdone\t10\t0.25\n");
        let feature = feature_with_tickets(repo.path(), &["01"]);
        let view = read_loop_view(repo.path(), &feature, "demo", &env_at(SystemTime::now()));
        let run = view.run.unwrap();
        assert_eq!(run.status, RunStatus::Finished);
        assert_eq!(run.heartbeat_at_ms, None);
        assert_eq!(view.tickets[0].spent.seconds, Some(10));

        write_run(&logs, "old", "running", "01", "");
        let view = read_loop_view(repo.path(), &feature, "demo", &env_at(SystemTime::now()));
        assert_eq!(view.run.unwrap().status, RunStatus::Died);
    }

    #[test]
    fn a_fresh_heartbeat_makes_a_run_live_and_a_stale_one_died() {
        let repo = tempfile::tempdir().unwrap();
        let logs = repo.path().join("logs");
        let dir = write_run(&logs, "r1", "running", "01", "");
        fs::write(dir.join("heartbeat"), "").unwrap();
        let feature = feature_with_tickets(repo.path(), &["01"]);
        let now = SystemTime::now();
        let live = read_loop_view(repo.path(), &feature, "demo", &env_at(now));
        assert_eq!(live.run.as_ref().unwrap().status, RunStatus::Live);
        assert!(live.tickets[0].running);
        let later = now + Duration::from_secs(60);
        let died = read_loop_view(repo.path(), &feature, "demo", &env_at(later));
        let run = died.run.unwrap();
        assert_eq!(run.status, RunStatus::Died);
        assert!(run.ended_at_ms.is_some());
        assert!(!died.tickets[0].running);
        assert!(died.tickets[0].spent.cost_partial.is_some());
    }

    #[test]
    fn live_runs_names_the_feature_of_each_live_run_and_skips_the_rest() {
        let repo = tempfile::tempdir().unwrap();
        let logs = repo.path().join("logs");
        let live = write_run(&logs, "r1", "running", "01", "");
        fs::write(live.join("heartbeat"), "").unwrap();
        write_run(&logs, "r0", "finished", "", "");
        let second = write_run(&logs, "r2", "running", "01", "");
        fs::write(second.join("heartbeat"), "").unwrap();
        let now = SystemTime::now();
        let found = live_runs(repo.path(), &env_at(now));
        assert_eq!(found.len(), 2);
        assert_eq!(found[0].feature, "demo");
        assert_eq!(found[0].run_id, "r1");
        let later = live_runs(repo.path(), &env_at(now + Duration::from_secs(60)));
        assert!(later.is_empty());
    }

    #[test]
    fn a_run_view_carries_the_launch_line_the_app_wrote() {
        let repo = tempfile::tempdir().unwrap();
        let dir = write_run(&repo.path().join("logs"), "r1", "running", "", "");
        fs::write(
            dir.join(LAUNCH_LINE_FILE),
            "setsid ralph/run-ralph-tickets.sh -y\n",
        )
        .unwrap();
        let feature = feature_with_tickets(repo.path(), &["01"]);
        let view = read_loop_view(repo.path(), &feature, "demo", &env_at(SystemTime::now()));
        assert_eq!(
            view.run.unwrap().launch_line.as_deref(),
            Some("setsid ralph/run-ralph-tickets.sh -y")
        );
    }

    #[test]
    fn a_dead_pid_died_a_run_with_a_fresh_heartbeat() {
        let repo = tempfile::tempdir().unwrap();
        let dir = write_run(&repo.path().join("logs"), "r1", "running", "", "");
        fs::write(dir.join("heartbeat"), "").unwrap();
        let feature = feature_with_tickets(repo.path(), &["01"]);
        let env = Env {
            now: SystemTime::now(),
            pid_alive: &|_| Some(false),
        };
        let view = read_loop_view(repo.path(), &feature, "demo", &env);
        assert_eq!(view.run.unwrap().status, RunStatus::Died);
    }

    #[test]
    fn costs_sum_and_a_ticket_with_no_cost_makes_the_sum_partial() {
        let repo = tempfile::tempdir().unwrap();
        let logs = repo.path().join("logs");
        write_run(
            &logs,
            "r1",
            "finished",
            "",
            "01\tdone\t60\t0.5\n02\tdone\t30\t0\n03\tdone\t5\t0.25\n",
        );
        let feature = feature_with_tickets(repo.path(), &["01", "02", "03"]);
        let view = read_loop_view(repo.path(), &feature, "demo", &env_at(SystemTime::now()));
        let run = view.run.unwrap();
        assert!((run.cost.usd - 0.75).abs() < 1e-9);
        assert!(run.cost.partial.is_some());
        assert_eq!(run.tickets_ended, 3);
        let t = &view.tickets;
        assert_eq!(t[0].spent.cost, Some(0.5));
        assert_eq!(t[0].spent.cost_partial, None);
        assert_eq!(t[1].spent.cost, None);
        assert!(t[1].spent.cost_partial.is_some());
    }

    #[test]
    fn a_ticket_takes_its_time_and_cost_from_the_newest_run_that_recorded_it() {
        let repo = tempfile::tempdir().unwrap();
        let logs = repo.path().join("logs");
        write_run(
            &logs,
            "a",
            "finished",
            "",
            "01\tdone\t10\t1.0\n02\tdone\t20\t2.0\n",
        );
        write_run(&logs, "b", "finished", "", "02\tdone\t5\t0.5\n");
        let feature = feature_with_tickets(repo.path(), &["01", "02"]);
        let view = read_loop_view(repo.path(), &feature, "demo", &env_at(SystemTime::now()));
        assert_eq!(view.run.as_ref().unwrap().id, "b");
        assert_eq!(view.tickets[0].spent.cost, Some(1.0));
        assert_eq!(view.tickets[1].spent.cost, Some(0.5));
        assert_eq!(view.tickets[1].spent.seconds, Some(5));
    }

    #[test]
    fn two_rows_of_a_ticket_in_one_run_sum_and_a_cost_less_one_makes_it_partial() {
        let repo = tempfile::tempdir().unwrap();
        write_run(
            &repo.path().join("logs"),
            "a",
            "finished",
            "",
            "01\tfailed\t10\t0\n01\tdone\t20\t0.5\n",
        );
        let feature = feature_with_tickets(repo.path(), &["01"]);
        let view = read_loop_view(repo.path(), &feature, "demo", &env_at(SystemTime::now()));
        let spent = &view.tickets[0].spent;
        assert_eq!(spent.seconds, Some(30));
        assert_eq!(spent.cost, Some(0.5));
        assert!(spent.cost_partial.is_some());
    }

    #[test]
    fn no_run_still_lists_the_build_tickets_and_leaves_out_wayfinder_ones() {
        let repo = tempfile::tempdir().unwrap();
        let feature = feature_with_tickets(repo.path(), &["01"]);
        fs::write(
            feature.join("issues/02-way.md"),
            "# 02 — Way\n\n## Question\n",
        )
        .unwrap();
        let view = read_loop_view(repo.path(), &feature, "demo", &env_at(SystemTime::now()));
        assert!(view.run.is_none());
        assert_eq!(view.tickets.len(), 1);
        assert_eq!(view.tickets[0].status, "ready-for-agent");
        assert_eq!(view.tickets[0].spent, Spent::default());
    }
}
