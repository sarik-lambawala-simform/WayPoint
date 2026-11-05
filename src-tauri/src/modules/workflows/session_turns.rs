//! How many turns the user has typed into a claude session since a moment, read from claude's own
//! transcript (`~/.claude/projects/<working directory>/<session id>.jsonl`). Only the "behind" note
//! of a forked stage uses it; nothing here writes.

use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

use serde_json::Value;

/// Claude names a project folder after its working directory with every character outside
/// `[A-Za-z0-9]` turned into `-`.
pub fn project_dir_name(cwd: &str) -> String {
    cwd.chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '-' })
        .collect()
}

/// A session id is a plain uuid; anything else could climb out of the projects folder.
pub fn is_session_id(id: &str) -> bool {
    let b = id.as_bytes();
    b.len() == 36
        && b.iter().enumerate().all(|(i, c)| match i {
            8 | 13 | 18 | 23 => *c == b'-',
            _ => c.is_ascii_hexdigit(),
        })
}

pub fn transcript_path(home: &Path, cwd: &str, session_id: &str) -> Option<PathBuf> {
    if !is_session_id(session_id) {
        return None;
    }
    Some(
        home.join(".claude")
            .join("projects")
            .join(project_dir_name(cwd))
            .join(format!("{session_id}.jsonl")),
    )
}

/// True when a transcript line is something the user typed: not a tool result, a meta message,
/// a sub-agent's message or command output.
fn is_typed_turn(v: &Value) -> bool {
    if v.get("type").and_then(Value::as_str) != Some("user") {
        return false;
    }
    if v.get("isMeta").and_then(Value::as_bool) == Some(true)
        || v.get("isSidechain").and_then(Value::as_bool) == Some(true)
    {
        return false;
    }
    match v.pointer("/message/content") {
        Some(Value::String(s)) => {
            !(s.starts_with("<local-command-") || s.starts_with("<system-reminder>"))
        }
        Some(Value::Array(parts)) => {
            let kind = |p: &Value| p.get("type").and_then(Value::as_str).map(str::to_owned);
            parts.iter().any(|p| kind(p).as_deref() == Some("text"))
                && !parts
                    .iter()
                    .any(|p| kind(p).as_deref() == Some("tool_result"))
        }
        _ => false,
    }
}

/// Turns typed with a timestamp after `since` (an ISO 8601 UTC string of the same shape claude
/// writes, so the strings compare in time order). A line without a timestamp is not counted.
pub fn count_turns_since(lines: impl Iterator<Item = String>, since: &str) -> u32 {
    let mut n = 0;
    for line in lines {
        if !line.contains("\"user\"") {
            continue;
        }
        let Ok(v) = serde_json::from_str::<Value>(&line) else {
            continue;
        };
        let after = v
            .get("timestamp")
            .and_then(Value::as_str)
            .is_some_and(|t| t > since);
        if after && is_typed_turn(&v) {
            n += 1;
        }
    }
    n
}

/// None when the session's transcript is not on this machine.
pub fn turns_since(home: &Path, repo_root: &str, session_id: &str, since: &str) -> Option<u32> {
    let path = transcript_path(home, repo_root, session_id)?;
    let file = File::open(path).ok()?;
    Some(count_turns_since(
        BufReader::new(file).lines().map_while(Result::ok),
        since,
    ))
}

/// Whether each session's transcript is on this machine, in the order given.
pub fn sessions_present(home: &Path, repo_root: &str, session_ids: &[String]) -> Vec<bool> {
    session_ids
        .iter()
        .map(|id| transcript_path(home, repo_root, id).is_some_and(|p| p.is_file()))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    const ID: &str = "6f1c2a52-8c0e-4a1f-9d57-3b1d3a0f6a11";

    fn user(ts: &str, content: &str) -> String {
        format!(
            r#"{{"type":"user","timestamp":"{ts}","message":{{"role":"user","content":{content}}}}}"#
        )
    }

    #[test]
    fn a_project_folder_is_the_working_directory_with_dashes() {
        assert_eq!(
            project_dir_name("/home/a/My Repo.git"),
            "-home-a-My-Repo-git"
        );
    }

    #[test]
    fn only_a_plain_uuid_names_a_transcript() {
        let home = Path::new("/h");
        assert_eq!(
            transcript_path(home, "/r", ID).unwrap(),
            Path::new("/h/.claude/projects/-r").join(format!("{ID}.jsonl"))
        );
        assert!(transcript_path(home, "/r", "../../x").is_none());
    }

    #[test]
    fn counts_typed_turns_after_the_moment_and_nothing_else() {
        let lines = vec![
            user("2026-11-03T10:00:00.000Z", r#""before""#),
            user("2026-11-03T10:05:00.000Z", r#""one""#),
            user(
                "2026-11-03T10:06:00.000Z",
                r#"[{"type":"text","text":"two"}]"#,
            ),
            user(
                "2026-11-03T10:07:00.000Z",
                r#"[{"type":"tool_result","content":"x"}]"#,
            ),
            user(
                "2026-11-03T10:08:00.000Z",
                r#""<local-command-stdout>ok</local-command-stdout>""#,
            ),
            r#"{"type":"assistant","timestamp":"2026-11-03T10:09:00.000Z"}"#.to_string(),
            r#"{"type":"user","isMeta":true,"timestamp":"2026-11-03T10:10:00.000Z","message":{"content":"m"}}"#.to_string(),
            "not json {\"user\"".to_string(),
        ];
        assert_eq!(
            count_turns_since(lines.into_iter(), "2026-11-03T10:01:00.000Z"),
            2
        );
    }

    #[test]
    fn a_session_is_present_only_when_its_transcript_file_is() {
        let home = tempfile::tempdir().unwrap();
        let dir = home.path().join(".claude/projects/-r");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join(format!("{ID}.jsonl")), "{}\n").unwrap();
        let other = "0a1c2a52-8c0e-4a1f-9d57-3b1d3a0f6a22".to_string();
        let ids = vec![ID.to_string(), other, "../x".to_string()];
        assert_eq!(
            sessions_present(home.path(), "/r", &ids),
            vec![true, false, false]
        );
    }
}
