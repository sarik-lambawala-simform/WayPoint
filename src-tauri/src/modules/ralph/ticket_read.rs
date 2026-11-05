//! What one ticket's terminal replays from a run folder: the prompt the script gave `claude`, the
//! growing `ticket-NN.jsonl` stream, and the row the script recorded when the ticket ended.
//!
//! Reads only. The page asks again with the offset it last got, so a stream that grows is sent once
//! and a reopen replays from offset 0.

use std::fs::{self, File};
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};

use serde::Serialize;

use super::runs::feature_dir;

/// The most a single read sends; the rest follows on the next ask.
const MAX_CHUNK: u64 = 8 * 1024 * 1024;

/// The row the script wrote to `tickets.tsv` when the ticket ended.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct TicketOutcome {
    pub outcome: String,
    pub seconds: Option<f64>,
    pub cost: Option<f64>,
    pub reason: String,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct TicketRead {
    /// The ticket has a stream in this run.
    pub has_stream: bool,
    /// `ticket-NN.prompt.txt`: the prompt passed to `claude -p`.
    pub prompt: Option<String>,
    /// New complete lines of the stream since `offset`.
    pub chunk: String,
    /// Where the next read starts.
    pub offset: u64,
    /// The stream is shorter than the offset asked for: it was replaced, so `chunk` starts over.
    pub reset: bool,
    pub outcome: Option<TicketOutcome>,
}

/// A run folder's name: one plain path component.
fn plain_name(name: &str) -> bool {
    !name.is_empty() && name != "." && name != ".." && !name.contains(['/', '\\', '\0'])
}

pub fn ticket_number(n: &str) -> bool {
    n.len() == 2 && n.chars().all(|c| c.is_ascii_digit())
}

/// The last row recorded for `number` in a feature's `tickets.tsv` (a retried ticket has several).
pub fn read_outcome(tsv: &Path, number: &str) -> Option<TicketOutcome> {
    let text = fs::read_to_string(tsv).ok()?;
    text.lines()
        .filter_map(|line| {
            let cols: Vec<&str> = line.split('\t').collect();
            // Fewer than the seconds and cost columns is a row still being appended.
            if cols.first() != Some(&number) || cols.len() < 4 {
                return None;
            }
            let num = |i: usize| {
                cols.get(i)
                    .and_then(|s| s.trim().parse::<f64>().ok())
                    .filter(|v| v.is_finite() && *v > 0.0)
            };
            Some(TicketOutcome {
                outcome: cols[1].to_string(),
                seconds: num(2),
                cost: num(3),
                reason: cols.get(8).map(|s| s.to_string()).unwrap_or_default(),
            })
        })
        .next_back()
}

/// Reads `file` from `offset` to the last newline, at most `MAX_CHUNK` bytes.
fn read_lines_from(file: &Path, offset: u64) -> Option<(String, u64, bool)> {
    // A symlink in a run folder is not followed out of it.
    if !fs::symlink_metadata(file).ok()?.is_file() {
        return None;
    }
    let mut f = File::open(file).ok()?;
    let len = f.metadata().ok()?.len();
    let (start, reset) = if offset > len {
        (0, true)
    } else {
        (offset, false)
    };
    f.seek(SeekFrom::Start(start)).ok()?;
    let mut buf = Vec::new();
    f.take(MAX_CHUNK).read_to_end(&mut buf).ok()?;
    // Hold back a line the script is still writing.
    // A line longer than a whole read is sent in pieces rather than waited on for ever.
    let end = match buf.iter().rposition(|b| *b == b'\n') {
        Some(i) => i + 1,
        None if buf.len() as u64 >= MAX_CHUNK => buf.len(),
        None => 0,
    };
    buf.truncate(end);
    Some((
        String::from_utf8_lossy(&buf).into_owned(),
        start + end as u64,
        reset,
    ))
}

/// One ticket of one run folder under `<repo>/logs/`. A name that is not a plain component, or a
/// ticket number that is not two digits, reads as nothing.
pub fn read_ticket(
    repo_root: &Path,
    run_id: &str,
    feature: &str,
    number: &str,
    offset: u64,
) -> TicketRead {
    let none = TicketRead {
        has_stream: false,
        prompt: None,
        chunk: String::new(),
        offset: 0,
        reset: offset > 0,
        outcome: None,
    };
    if !plain_name(run_id) || !plain_name(feature) || !ticket_number(number) {
        return none;
    }
    let run_dir: PathBuf = repo_root.join("logs").join(run_id);
    let Some(sub) = feature_dir(&run_dir, feature) else {
        return none;
    };
    let stream = sub.join(format!("ticket-{number}.jsonl"));
    let prompt_file = sub.join(format!("ticket-{number}.prompt.txt"));
    let prompt = fs::symlink_metadata(&prompt_file)
        .ok()
        .filter(|m| m.is_file() && m.len() <= MAX_CHUNK)
        .and_then(|_| fs::read_to_string(&prompt_file).ok())
        .map(|p| p.trim_end_matches('\n').to_string());
    let outcome = read_outcome(&sub.join("tickets.tsv"), number);
    match read_lines_from(&stream, offset) {
        Some((chunk, next, reset)) => TicketRead {
            has_stream: true,
            prompt,
            chunk,
            offset: next,
            reset,
            outcome,
        },
        None => TicketRead {
            prompt,
            outcome,
            ..none
        },
    }
}

/// What a finished ticket's commits are looked up from: the commit the script started the ticket
/// at (it names it in the prompt as the review's fixed point), and when the stream last grew.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct TicketWindow {
    pub base_sha: Option<String>,
    /// Unix ms of the stream's last write: the ticket's commits are not newer than this.
    pub ended_ms: Option<i64>,
    /// The script recorded the ticket `completed`.
    pub completed: bool,
}

/// The sha the prompt names as the fixed point: ``use `<sha>` as the fixed point``.
pub fn base_sha_of(prompt: &str) -> Option<String> {
    let end = prompt.find("` as the fixed point")?;
    let start = prompt[..end].rfind('`')? + 1;
    let sha = &prompt[start..end];
    ((7..=64).contains(&sha.len()) && sha.chars().all(|c| c.is_ascii_hexdigit()))
        .then(|| sha.to_ascii_lowercase())
}

pub fn ticket_window(repo_root: &Path, run_id: &str, feature: &str, number: &str) -> TicketWindow {
    let none = TicketWindow {
        base_sha: None,
        ended_ms: None,
        completed: false,
    };
    if !plain_name(run_id) || !plain_name(feature) || !ticket_number(number) {
        return none;
    }
    let run_dir: PathBuf = repo_root.join("logs").join(run_id);
    let Some(sub) = feature_dir(&run_dir, feature) else {
        return none;
    };
    let prompt_file = sub.join(format!("ticket-{number}.prompt.txt"));
    let base_sha = fs::symlink_metadata(&prompt_file)
        .ok()
        .filter(|m| m.is_file() && m.len() <= MAX_CHUNK)
        .and_then(|_| fs::read_to_string(&prompt_file).ok())
        .and_then(|p| base_sha_of(&p));
    let ended_ms = fs::symlink_metadata(sub.join(format!("ticket-{number}.jsonl")))
        .ok()
        .filter(|m| m.is_file())
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as i64);
    let completed =
        read_outcome(&sub.join("tickets.tsv"), number).is_some_and(|o| o.outcome == "completed");
    TicketWindow {
        base_sha,
        ended_ms,
        completed,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn run_folder() -> (tempfile::TempDir, PathBuf) {
        let repo = tempfile::tempdir().unwrap();
        let sub = repo.path().join("logs/ralph-tickets-1/01-feat");
        fs::create_dir_all(&sub).unwrap();
        (repo, sub)
    }

    #[test]
    fn a_half_written_row_is_not_an_outcome() {
        let (_repo, sub) = run_folder();
        let tsv = sub.join("tickets.tsv");
        fs::write(&tsv, "03\tfailed\t12\t0.5\t\t\t\t\tbuild broke\n03\tcomple").unwrap();
        let o = read_outcome(&tsv, "03").unwrap();
        assert_eq!(o.outcome, "failed");
        fs::write(&tsv, "03\tdone\n").unwrap();
        assert!(read_outcome(&tsv, "03").is_none());
    }

    #[test]
    fn a_stream_is_sent_once_and_a_partial_line_waits() {
        let (repo, sub) = run_folder();
        let stream = sub.join("ticket-03.jsonl");
        fs::write(&stream, "{\"a\":1}\n{\"b\":").unwrap();
        let first = read_ticket(repo.path(), "ralph-tickets-1", "feat", "03", 0);
        assert!(first.has_stream);
        assert_eq!(first.chunk, "{\"a\":1}\n");
        assert!(!first.reset);
        fs::write(&stream, "{\"a\":1}\n{\"b\":2}\n").unwrap();
        let second = read_ticket(repo.path(), "ralph-tickets-1", "feat", "03", first.offset);
        assert_eq!(second.chunk, "{\"b\":2}\n");
        let third = read_ticket(repo.path(), "ralph-tickets-1", "feat", "03", second.offset);
        assert_eq!(third.chunk, "");
        assert_eq!(third.offset, second.offset);
    }

    #[test]
    fn a_shorter_stream_starts_over() {
        let (repo, sub) = run_folder();
        fs::write(sub.join("ticket-03.jsonl"), "{\"a\":1}\n").unwrap();
        let r = read_ticket(repo.path(), "ralph-tickets-1", "feat", "03", 500);
        assert!(r.reset);
        assert_eq!(r.chunk, "{\"a\":1}\n");
    }

    #[test]
    fn the_prompt_and_the_last_recorded_row_come_with_it() {
        let (repo, sub) = run_folder();
        fs::write(sub.join("ticket-03.jsonl"), "{}\n").unwrap();
        fs::write(sub.join("ticket-03.prompt.txt"), "/implement\n\nDo it\n").unwrap();
        fs::write(
            sub.join("tickets.tsv"),
            "03\tblocked\t10\t0\t1\t2\t3\tT\tfirst try\n03\tcompleted\t40\t0.5\t1\t2\t3\tT\t\n",
        )
        .unwrap();
        let r = read_ticket(repo.path(), "ralph-tickets-1", "feat", "03", 0);
        assert_eq!(r.prompt.as_deref(), Some("/implement\n\nDo it"));
        let o = r.outcome.unwrap();
        assert_eq!(o.outcome, "completed");
        assert_eq!(o.seconds, Some(40.0));
        assert_eq!(o.cost, Some(0.5));
    }

    #[test]
    fn a_ticket_with_no_stream_reads_as_none() {
        let (repo, _sub) = run_folder();
        let r = read_ticket(repo.path(), "ralph-tickets-1", "feat", "04", 0);
        assert!(!r.has_stream);
        assert_eq!(r.prompt, None);
    }

    #[test]
    fn names_that_climb_out_of_logs_read_as_nothing() {
        let (repo, sub) = run_folder();
        fs::write(sub.join("ticket-03.jsonl"), "{}\n").unwrap();
        for run in ["..", "../x", "a/b", ""] {
            assert!(!read_ticket(repo.path(), run, "feat", "03", 0).has_stream);
        }
        assert!(!read_ticket(repo.path(), "ralph-tickets-1", "../feat", "03", 0).has_stream);
        assert!(!read_ticket(repo.path(), "ralph-tickets-1", "feat", "../3", 0).has_stream);
    }

    #[test]
    fn the_base_sha_is_the_fixed_point_the_prompt_names() {
        let p = "x\nWhen you run /code-review, use `A57FAEF40292` as the fixed point — y";
        assert_eq!(base_sha_of(p).as_deref(), Some("a57faef40292"));
        assert_eq!(base_sha_of("use `zzzzzzzz` as the fixed point"), None);
        assert_eq!(base_sha_of("use `abc` as the fixed point"), None);
        assert_eq!(base_sha_of("no such text"), None);
    }

    #[test]
    fn a_window_has_the_base_the_stream_time_and_whether_it_completed() {
        let (repo, sub) = run_folder();
        fs::write(sub.join("ticket-03.jsonl"), "{}\n").unwrap();
        fs::write(
            sub.join("ticket-03.prompt.txt"),
            "use `a57faef40292038884aa146e30d405498669ad47` as the fixed point",
        )
        .unwrap();
        let w = ticket_window(repo.path(), "ralph-tickets-1", "feat", "03");
        assert_eq!(
            w.base_sha.as_deref(),
            Some("a57faef40292038884aa146e30d405498669ad47")
        );
        assert!(w.ended_ms.is_some());
        assert!(!w.completed);
        fs::write(
            sub.join("tickets.tsv"),
            "03\tcompleted\t4\t0\t1\t2\t3\tT\t\n",
        )
        .unwrap();
        assert!(ticket_window(repo.path(), "ralph-tickets-1", "feat", "03").completed);
        assert_eq!(
            ticket_window(repo.path(), "../x", "feat", "03"),
            TicketWindow {
                base_sha: None,
                ended_ms: None,
                completed: false
            }
        );
    }
}
