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

fn ticket_number(n: &str) -> bool {
    n.len() == 2 && n.chars().all(|c| c.is_ascii_digit())
}

/// The last row recorded for `number` in a feature's `tickets.tsv` (a retried ticket has several).
pub fn read_outcome(tsv: &Path, number: &str) -> Option<TicketOutcome> {
    let text = fs::read_to_string(tsv).ok()?;
    text.lines()
        .filter_map(|line| {
            let cols: Vec<&str> = line.split('\t').collect();
            if cols.first() != Some(&number) || cols.len() < 2 {
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
        .last()
}

/// Reads `file` from `offset` to the last newline, at most `MAX_CHUNK` bytes.
fn read_lines_from(file: &Path, offset: u64) -> Option<(String, u64, bool)> {
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
    let end = buf.iter().rposition(|b| *b == b'\n').map_or(0, |i| i + 1);
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
    let prompt = fs::read_to_string(sub.join(format!("ticket-{number}.prompt.txt")))
        .ok()
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
}
