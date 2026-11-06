//! The ticket reader: a line-for-line port of `ralph/lib/tickets.sh`.
//!
//! The loop script and the app must never disagree about a ticket, so every rule here is the
//! script's rule: the status key, the blocker list, whether the blockers are met, the title, and
//! the wayfinder / human classification. `tests/ralph_tickets_agree.rs` runs the script's own
//! functions over the fixture folders and compares row by row.
//!
//! Regex rules:
//! - `[[:space:]]` in the script is ASCII whitespace (`[ \t\n\r\x0B\x0C]`). The `regex` crate's
//!   `[[:space:]]` class is ASCII-only too, and no pattern here uses a plain `\s`, which would
//!   also take Unicode spaces (a non-breaking space in a ticket is text to the script).
//! - The two lookarounds of the TypeScript reader are not needed: the field range is found by a
//!   line state machine (`blockers_field`) and the segment split uses a plain regex.
//!
//! CRLF: a `\r` before the line end is dropped wherever the script drops it (`tr -d '\r'`, awk's
//! `gsub(/\r/, "")`) and counts as whitespace everywhere else, so a CRLF ticket reads as its LF
//! twin. The one deliberate difference is `title`: the script leaves a trailing `\r` on it, the
//! reader does not.

use std::collections::{BTreeMap, HashSet};
use std::io;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;

use regex::Regex;

use crate::modules::workspace::{resolve_path, WorkspaceEnv};

fn re(pattern: &str) -> Regex {
    Regex::new(pattern).expect("static ticket-reader regex")
}

/// `^NN` then an em-dash or a period at the start of a heading, as `title_of` strips it.
static TITLE_NUMBER: LazyLock<Regex> =
    LazyLock::new(|| re(r"^[0-9][0-9][[:space:]]*(?:—|\.)[[:space:]]*"));
static WAYFINDER_HEADING: LazyLock<Regex> =
    LazyLock::new(|| re(r"^##[[:space:]]+Question[[:space:]]*$"));
static BLOCKED_BY_LABEL: LazyLock<Regex> =
    LazyLock::new(|| re(r"^(?:\*\*Blocked by:\*\*|Blocked by:)"));
static BLOCKED_BY_PREFIX: LazyLock<Regex> =
    LazyLock::new(|| re(r"^(?:\*\*Blocked by:\*\*|Blocked by:)[[:space:]]*"));
static BOLD_LABEL: LazyLock<Regex> = LazyLock::new(|| re(r"^\*\*[A-Z][A-Za-z -]*:\*\*"));
static PLAIN_LABEL: LazyLock<Regex> = LazyLock::new(|| re(r"^[A-Z][A-Za-z -]*:(?:[[:space:]]|$)"));
static NONE_FIELD: LazyLock<Regex> =
    LazyLock::new(|| re(r"^(?:[Nn]one|[Nn]othing)(?:[^A-Za-z]|$)"));
static MD_LINK: LazyLock<Regex> = LazyLock::new(|| re(r"\[([^\]]*)\]\([^)]*\)"));
static WORD_SEPARATOR: LazyLock<Regex> =
    LazyLock::new(|| re(r"[[:space:]]+(?:[Aa]nd|[Pp]lus|[Ww]ith)[[:space:]]+"));
static PUNCT_SEPARATOR: LazyLock<Regex> = LazyLock::new(|| re(r"[,;&+|/\\]|[[:space:]]{2,}"));
static TICKET_WORD: LazyLock<Regex> = LazyLock::new(|| re(r"^[Tt]icket[[:space:]]+"));
static LEADING_NUMBER: LazyLock<Regex> = LazyLock::new(|| re(r"^[0-9][0-9](?:[^0-9]|$)"));

/// `[[:space:]]` in the C locale.
fn is_space(c: char) -> bool {
    matches!(c, ' ' | '\t' | '\n' | '\r' | '\x0B' | '\x0C')
}

fn is_blank(line: &str) -> bool {
    line.chars().all(is_space)
}

/// One ticket as the script sees it. The columns of the agreement test are `number`,
/// `status_key`, `blocker_status_key`, `blockers`, `blockers_met` and `title`.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Ticket {
    /// The two digits from the file name.
    pub number: String,
    pub path: PathBuf,
    pub title: String,
    /// `status_key_of`: the bold `**Status:**` line only. This is what the loop reads.
    pub status_key: String,
    /// `blocker_status_key_of`: bold, then plain `Status:`. This is how the ticket reads as a blocker.
    pub blocker_status_key: String,
    /// Blocker numbers in the order the field names them, each once.
    pub blockers: Vec<String>,
    /// True when every blocker has a ticket file and a done status key.
    pub blockers_met: bool,
    /// A wayfinder ticket asks a question rather than asking for code.
    pub wayfinder: bool,
    /// Work only a human can do: `-hitl-` in the file name, or `ready-for-human`.
    pub human: bool,
}

impl Ticket {
    /// `agent_may_take`: not a wayfinder, and not work for a human.
    pub fn agent_may_take(&self) -> bool {
        !self.wayfinder && !self.human
    }
}

/// `field_of`: the first value of one field, trimmed. `label` is the literal line start
/// (`**Status:**`, `Status:`). Empty when no line has the label.
pub fn field_of(text: &str, label: &str) -> String {
    for line in text.split('\n') {
        if let Some(rest) = line.strip_prefix(label) {
            let value: String = rest.trim_start_matches(is_space).replace('\r', "");
            return value.trim_end_matches(is_space).to_string();
        }
    }
    String::new()
}

/// `status_of`: the raw bold `**Status:**` value.
pub fn status_of(text: &str) -> String {
    field_of(text, "**Status:**")
}

/// `key_of`: the status cut at the first `,`, `.` or an em-dash set off by spaces. The rest is a note for a human.
pub fn key_of(raw: &str) -> String {
    let mut key = raw;
    if let Some(i) = key.find([',', '.']) {
        key = &key[..i];
    }
    if let Some(i) = key.find(" — ") {
        key = &key[..i];
    }
    key.trim_end_matches(is_space).to_string()
}

pub fn status_key_of(text: &str) -> String {
    key_of(&status_of(text))
}

/// `blocker_status_key_of`: bold `**Status:**` first, then plain `Status:`.
pub fn blocker_status_key_of(text: &str) -> String {
    let mut st = status_of(text);
    if st.is_empty() {
        st = field_of(text, "Status:");
    }
    key_of(&st)
}

/// `is_done_key`: `completed`, `resolved` and `done` all mean the work is done.
pub fn is_done_key(key: &str) -> bool {
    matches!(key, "completed" | "resolved" | "done")
}

/// `is_wayfinder`: a plain `Type:` line or a `## Question` heading. A bold `**Type:**` alone is
/// not enough, because build tickets carry `**Type:** task` too.
pub fn is_wayfinder(text: &str) -> bool {
    text.split('\n')
        .any(|l| l.starts_with("Type:") || WAYFINDER_HEADING.is_match(l))
}

/// `is_human`: `-hitl-` in the file name, or the bold status key is `ready-for-human`.
pub fn is_human(file_name: &str, text: &str) -> bool {
    file_name.contains("-hitl-") || status_key_of(text) == "ready-for-human"
}

/// `title_of`: the first line with its `#` and its leading `NN` and its em-dash or period stripped.
/// Empty when the first line is not a heading.
pub fn title_of(text: &str) -> String {
    let first = text.split('\n').next().unwrap_or("");
    let first = first.strip_suffix('\r').unwrap_or(first);
    let Some(rest) = first.strip_prefix('#') else {
        return String::new();
    };
    let rest = rest.trim_start_matches(is_space);
    TITLE_NUMBER.replace(rest, "").into_owned()
}

/// The lines of the Blocked-by field: the first `**Blocked by:**` or plain `Blocked by:` line,
/// plus the lines after it up to a blank line, a heading, or the next label line. A plain field
/// stops at a plain `Label:` line too; a bold one stops only at a bold label (its wrapped titles
/// can start a line with `Capture: ...`). The awk state machine in `blockers_of`, step for step.
fn blockers_field(text: &str) -> Option<String> {
    let mut line: Option<String> = None;
    let mut plain = false;
    for l in text.split('\n') {
        let label = BOLD_LABEL.is_match(l) || (plain && PLAIN_LABEL.is_match(l));
        if let Some(acc) = line.as_mut() {
            if is_blank(l) || l.starts_with('#') || label {
                break;
            }
            acc.push(' ');
            acc.push_str(l);
        } else if BLOCKED_BY_LABEL.is_match(l) {
            plain = l.starts_with("Blocked by:");
            line = Some(l.to_string());
        }
    }
    line
}

/// `blockers_of`: the blocker numbers, in field order, each once. See `lib/tickets.sh` for why
/// each normalisation step is there. In short: `none` means no blockers, a markdown link counts
/// as its text, every list punctuation but the dash becomes one delimiter, and only a two-digit
/// number at the START of a segment counts.
pub fn blockers_of(text: &str) -> Vec<String> {
    let Some(field) = blockers_field(text) else {
        return Vec::new();
    };
    let field = field.replace('\r', "");
    let mut line = BLOCKED_BY_PREFIX.replace(&field, "").into_owned();
    if NONE_FIELD.is_match(&line) {
        return Vec::new();
    }
    while MD_LINK.is_match(&line) {
        line = MD_LINK.replace(&line, "$1").into_owned();
    }
    line = WORD_SEPARATOR.replace_all(&line, ";").into_owned();
    line = PUNCT_SEPARATOR.replace_all(&line, ";").into_owned();

    let mut seen = HashSet::new();
    let mut out = Vec::new();
    for seg in line.split(';').filter(|s| !s.is_empty()) {
        let seg = seg.trim_start_matches(is_space);
        let seg = TICKET_WORD.replace(seg, "");
        if LEADING_NUMBER.is_match(&seg) {
            let n = &seg[..2];
            if seen.insert(n.to_string()) {
                out.push(n.to_string());
            }
        }
    }
    out
}

/// A `NN-*.md` name: two digits, a dash, anything, `.md`.
fn is_ticket_name(name: &str) -> bool {
    let b = name.as_bytes();
    b.len() >= 6
        && b[0].is_ascii_digit()
        && b[1].is_ascii_digit()
        && b[2] == b'-'
        && name.ends_with(".md")
}

/// Every `NN-*.md` file in the dir (including `00-index.md`, as the script's glob has it),
/// name to text, in byte order of name. A symlink counts when it points at a file.
fn read_texts(dir: &Path) -> io::Result<BTreeMap<String, String>> {
    let mut texts = BTreeMap::new();
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let Ok(name) = entry.file_name().into_string() else {
            continue;
        };
        if !is_ticket_name(&name) || !entry.path().metadata().is_ok_and(|m| m.is_file()) {
            continue;
        }
        let bytes = std::fs::read(entry.path())?;
        texts.insert(name, String::from_utf8_lossy(&bytes).into_owned());
    }
    Ok(texts)
}

/// `blockers_met` for one ticket: every blocker has a ticket file (`path_for`: the first
/// `NN-*.md` by name) and that file's blocker status key is done.
fn blockers_met(blockers: &[String], texts: &BTreeMap<String, String>) -> bool {
    blockers.iter().all(|b| {
        let prefix = format!("{b}-");
        texts
            .iter()
            .find(|(name, _)| name.starts_with(&prefix))
            .is_some_and(|(_, text)| is_done_key(&blocker_status_key_of(text)))
    })
}

/// `ticket_files` + the per-ticket readers: every ticket in a ticket dir, `00-index.md` left
/// out, sorted by number then name.
pub fn read_tickets(issues_dir: &Path) -> io::Result<Vec<Ticket>> {
    let texts = read_texts(issues_dir)?;
    // BTreeMap order is by name, and names start with the two digits, so this is `sort -n`
    // with the name as the tie-break.
    Ok(texts
        .iter()
        .filter(|(name, _)| name.as_str() != "00-index.md")
        .map(|(name, text)| {
            let blockers = blockers_of(text);
            Ticket {
                number: name[..2].to_string(),
                path: issues_dir.join(name),
                title: title_of(text),
                status_key: status_key_of(text),
                blocker_status_key: blocker_status_key_of(text),
                blockers_met: blockers_met(&blockers, &texts),
                blockers,
                wayfinder: is_wayfinder(text),
                human: is_human(name, text),
            }
        })
        .collect())
}

/// `\r` when the line ends with one, so a rewritten line keeps its file's line ending.
fn eol(line: &str) -> &'static str {
    if line.ends_with('\r') {
        "\r"
    } else {
        ""
    }
}

/// `text` with its `**Status:**` line set to `**Status:** done`. The first such line is the one
/// the reader uses, so it is the one replaced; a ticket with none gets the line under its title.
/// Line endings stay as the file has them.
pub fn with_status_done(text: &str) -> String {
    const LINE: &str = "**Status:** done";
    let mut lines: Vec<&str> = text.split('\n').collect();
    if let Some(i) = lines.iter().position(|l| l.starts_with("**Status:**")) {
        let replaced = format!("{LINE}{}", eol(lines[i]));
        let mut out: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
        out[i] = replaced;
        return out.join("\n");
    }
    let cr = lines.first().map_or("", |l| eol(l));
    if text.is_empty() {
        return format!("{LINE}\n");
    }
    let rest = lines.split_off(1);
    let mut out = format!("{}\n{cr}\n{LINE}{cr}\n", lines[0]);
    out.push_str(&rest.join("\n"));
    out
}

/// "Mark done": writes `**Status:** done` into human ticket `number` of `issues_dir` and returns
/// that line. Only a ticket the agent may not take is closed this way; a symlink is never written
/// through. The file is replaced whole, so a reader never sees half of it.
pub fn mark_done(issues_dir: &Path, number: &str) -> Result<String, String> {
    rewrite_ticket(issues_dir, number, |name, text, _| {
        if !is_human(name, text) {
            return Err(format!("ticket {number} is not a human ticket"));
        }
        Ok(with_status_done(text))
    })?;
    Ok("**Status:** done".to_string())
}

/// The statuses the Loop panel sets. Never `in-progress`: only the loop sets that, when it picks.
pub const EDIT_STATUSES: [&str; 4] = ["ready-for-agent", "ready-for-human", "completed", "blocked"];

/// One change from the Loop panel: a new status key, or the whole Blocked by list.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum TicketEdit {
    /// The key, and the `**Completed at:**` stamp a `completed` key writes.
    Status {
        key: String,
        completed_at: String,
    },
    Blockers(Vec<String>),
}

static COMPLETED_AT: LazyLock<Regex> =
    LazyLock::new(|| re(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"));
static STATUS_LABEL: LazyLock<Regex> = LazyLock::new(|| re(r"^\*\*Status:\*\*[ \t\x0B\x0C]*"));

/// Splits `text` into lines without their `\r`, and that `\r` per line.
fn lines_of(text: &str) -> Vec<(String, &'static str)> {
    text.split('\n')
        .map(|l| (l.strip_suffix('\r').unwrap_or(l).to_string(), eol(l)))
        .collect()
}

fn join_lines(lines: &[(String, &'static str)]) -> String {
    lines
        .iter()
        .map(|(l, cr)| format!("{l}{cr}"))
        .collect::<Vec<_>>()
        .join("\n")
}

/// `text` with the key of its first `**Status:**` line set to `key`; the note after the key stays.
/// On `completed`, `**Completed at:** <stamp>` is set (or added under the status line, as the loop
/// does); off `completed` it is removed, with the blank line the loop put before it.
pub fn with_status(text: &str, key: &str, completed_at: &str) -> Result<String, String> {
    let mut lines = lines_of(text);
    let at = lines
        .iter()
        .position(|(l, _)| l.starts_with("**Status:**"))
        .ok_or("This ticket has no **Status:** line, the only one the loop reads.")?;
    let (line, cr) = lines[at].clone();
    let label = STATUS_LABEL
        .find(&line)
        .map_or("", |m| m.as_str())
        .to_string();
    let value = &line[label.len()..];
    let old = key_of(value);
    let label = if label.len() > "**Status:**".len() {
        label
    } else {
        "**Status:** ".into()
    };
    lines[at] = (format!("{label}{key}{}", &value[old.len()..]), cr);

    let done = lines
        .iter()
        .position(|(l, _)| l.starts_with("**Completed at:**"));
    if key == "completed" {
        let stamped = format!("**Completed at:** {completed_at}");
        match done {
            Some(i) => lines[i].0 = stamped,
            None => {
                lines.insert(at + 1, (String::new(), cr));
                lines.insert(at + 2, (stamped, cr));
            }
        }
    } else if let Some(i) = done {
        // The blank line before goes too when the loop added it under the status line, or when a
        // blank line after still keeps the paragraphs apart.
        let blank_before = i > 0 && is_blank(&lines[i - 1].0);
        let loop_added = i > 1 && lines[i - 2].0.starts_with("**Status:**");
        let blank_after = lines.get(i + 1).is_none_or(|(l, _)| is_blank(l));
        if blank_before && (loop_added || blank_after) {
            lines.drain(i - 1..=i);
        } else {
            lines.remove(i);
        }
    }
    Ok(join_lines(&lines))
}

/// `text` with its Blocked by field, wrapped lines too, written as one bold line: `01, 03` or
/// `None`. A ticket without the field gets one above its status line.
pub fn with_blockers(text: &str, numbers: &[String]) -> Result<String, String> {
    let mut lines = lines_of(text);
    let value = format!(
        "**Blocked by:** {}",
        if numbers.is_empty() {
            "None".to_string()
        } else {
            numbers.join(", ")
        }
    );
    if let Some(at) = lines.iter().position(|(l, _)| BLOCKED_BY_LABEL.is_match(l)) {
        // The same range `blockers_field` reads.
        let plain = lines[at].0.starts_with("Blocked by:");
        let mut end = at + 1;
        while let Some((l, _)) = lines.get(end) {
            if is_blank(l)
                || l.starts_with('#')
                || BOLD_LABEL.is_match(l)
                || (plain && PLAIN_LABEL.is_match(l))
            {
                break;
            }
            end += 1;
        }
        let cr = lines[at].1;
        lines.splice(at..end, [(value, cr)]);
    } else {
        let at = lines
            .iter()
            .position(|(l, _)| l.starts_with("**Status:**"))
            .ok_or("This ticket has no **Status:** line, the only one the loop reads.")?;
        let cr = lines[at].1;
        lines.splice(at..at, [(value, cr), (String::new(), cr)]);
    }
    Ok(join_lines(&lines))
}

/// Writes one panel edit into build ticket `number`. Refuses a wayfinder ticket, a status the
/// panel does not set, a ticket without a bold status line, and a blocker that is not another
/// ticket of the folder.
pub fn edit_ticket(issues_dir: &Path, number: &str, edit: &TicketEdit) -> Result<(), String> {
    rewrite_ticket(issues_dir, number, |_, text, texts| {
        if is_wayfinder(text) {
            return Err("Wayfinder tickets are view only.".into());
        }
        match edit {
            TicketEdit::Status { key, completed_at } => {
                if !EDIT_STATUSES.contains(&key.as_str()) {
                    return Err(format!(
                        "The panel sets {}. Not {key}.",
                        EDIT_STATUSES.join(", ")
                    ));
                }
                if key == "completed" && !COMPLETED_AT.is_match(completed_at) {
                    return Err(format!("not a UTC stamp: {completed_at}"));
                }
                with_status(text, key, completed_at)
            }
            TicketEdit::Blockers(numbers) => {
                let others: HashSet<&str> = texts
                    .iter()
                    .filter(|(n, t)| {
                        n.as_str() != "00-index.md"
                            && !n.starts_with(&format!("{number}-"))
                            && !is_wayfinder(t)
                    })
                    .map(|(n, _)| &n[..2])
                    .collect();
                let mut sorted: Vec<String> = numbers.clone();
                sorted.sort();
                sorted.dedup();
                if let Some(b) = sorted.iter().find(|b| !others.contains(b.as_str())) {
                    return Err(format!("{b} is not another build ticket of this feature."));
                }
                with_blockers(text, &sorted)
            }
        }
    })
}

/// Replaces ticket `number` of `issues_dir` with what `edit` makes of its text, through a temp file
/// and a rename, keeping its permissions. Never writes through a symlink or over invalid UTF-8.
/// `edit` gets the file name, the text, and every ticket text of the folder.
fn rewrite_ticket(
    issues_dir: &Path,
    number: &str,
    edit: impl FnOnce(&str, &str, &BTreeMap<String, String>) -> Result<String, String>,
) -> Result<(), String> {
    if !super::ticket_read::ticket_number(number) {
        return Err(format!("not a ticket number: {number}"));
    }
    let texts = read_texts(issues_dir).map_err(|e| e.to_string())?;
    let prefix = format!("{number}-");
    let (name, text) = texts
        .iter()
        .find(|(n, _)| n.starts_with(&prefix))
        .ok_or_else(|| format!("no ticket {number} in {}", issues_dir.display()))?;
    let path = issues_dir.join(name);
    let meta = std::fs::symlink_metadata(&path).map_err(|e| e.to_string())?;
    if !meta.is_file() {
        return Err(format!("{} is not a plain file", path.display()));
    }
    // The reader decodes lossily; writing that back would replace invalid bytes on disk.
    let on_disk = std::fs::read(&path).map_err(|e| e.to_string())?;
    if std::str::from_utf8(&on_disk).is_err() {
        return Err(format!("{} is not valid UTF-8", path.display()));
    }
    let next = edit(name, text, &texts)?;
    if next == *text {
        return Ok(());
    }
    // A name of its own, so two presses never share a temp file, and `create_new` never follows
    // a link left at that name.
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_nanos());
    let tmp = issues_dir.join(format!(".{number}.{}.{nanos}.tmp", std::process::id()));
    std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&tmp)
        .and_then(|mut f| std::io::Write::write_all(&mut f, next.as_bytes()))
        .map_err(|e| e.to_string())?;
    let swap = std::fs::set_permissions(&tmp, meta.permissions())
        .and_then(|()| std::fs::rename(&tmp, &path));
    if let Err(e) = swap {
        let _ = std::fs::remove_file(&tmp);
        return Err(e.to_string());
    }
    Ok(())
}

/// The ticket dir of a feature as this machine reaches it. A WSL workspace's path is a Linux path
/// inside the distro; on Windows it becomes a `\\wsl.localhost\<distro>\...` path (or the drvfs
/// path for `/mnt/c/...`), elsewhere it is unchanged.
pub fn issues_dir_on_host(path: &str, workspace: &WorkspaceEnv) -> PathBuf {
    resolve_path(path, workspace)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn blockers(s: &str) -> String {
        blockers_of(s).join(" ")
    }

    #[test]
    fn done_status_replaces_the_first_status_line_and_keeps_line_endings() {
        assert_eq!(
            with_status_done("# 01 — A\n\n**Status:** ready-for-human\n- [ ] x\n"),
            "# 01 — A\n\n**Status:** done\n- [ ] x\n"
        );
        assert_eq!(
            with_status_done("# 01\r\n**Status:** in-progress\r\n**Status:** later\r\n"),
            "# 01\r\n**Status:** done\r\n**Status:** later\r\n"
        );
        assert_eq!(
            status_key_of(&with_status_done("# t\n**Status:** x, y\n")),
            "done"
        );
    }

    #[test]
    fn done_status_goes_under_the_title_when_there_is_none() {
        assert_eq!(
            with_status_done("# 01 — A\n\nbody\n"),
            "# 01 — A\n\n**Status:** done\n\nbody\n"
        );
        assert_eq!(
            with_status_done("# 01\r\nbody"),
            "# 01\r\n\r\n**Status:** done\r\nbody"
        );
        assert_eq!(with_status_done(""), "**Status:** done\n");
        assert_eq!(status_key_of(&with_status_done("# 01\nbody\n")), "done");
    }

    #[test]
    fn mark_done_closes_only_a_human_ticket() {
        let dir = tempfile::tempdir().unwrap();
        let w = |n: &str, t: &str| std::fs::write(dir.path().join(n), t).unwrap();
        w("01-build.md", "# 01 — B\n\n**Status:** ready-for-agent\n");
        w("02-hitl-x.md", "# 02 — H\n\n**Status:** in-progress\n");
        w("03-y.md", "# 03 — H\n\n**Status:** ready-for-human\n");
        assert!(mark_done(dir.path(), "01")
            .unwrap_err()
            .contains("not a human"));
        assert!(mark_done(dir.path(), "09")
            .unwrap_err()
            .contains("no ticket"));
        assert!(mark_done(dir.path(), "../").is_err());
        assert_eq!(mark_done(dir.path(), "02").unwrap(), "**Status:** done");
        assert_eq!(mark_done(dir.path(), "03").unwrap(), "**Status:** done");
        let read = |n: &str| std::fs::read_to_string(dir.path().join(n)).unwrap();
        assert_eq!(read("02-hitl-x.md"), "# 02 — H\n\n**Status:** done\n");
        assert_eq!(read("03-y.md"), "# 03 — H\n\n**Status:** done\n");
        assert_eq!(
            read("01-build.md"),
            "# 01 — B\n\n**Status:** ready-for-agent\n"
        );
        assert_eq!(
            std::fs::read_dir(dir.path()).unwrap().count(),
            3,
            "no temp file is left behind"
        );
    }

    const STAMP: &str = "2026-11-05T10:00:00Z";

    #[test]
    fn with_status_keeps_the_note_and_the_label_spacing() {
        let t = "# 01 — A\n\n**Status:**   ready-for-agent, parked by the stop\n";
        assert_eq!(
            with_status(t, "blocked", STAMP).unwrap(),
            "# 01 — A\n\n**Status:**   blocked, parked by the stop\n"
        );
        assert!(with_status("# 01\nStatus: x\n", "blocked", STAMP).is_err());
    }

    #[test]
    fn completed_stamps_completed_at_and_leaving_it_removes_the_stamp() {
        let t = "# 01\n\n**Status:** ready-for-agent\n\n- [ ] a\n";
        let done = with_status(t, "completed", STAMP).unwrap();
        assert_eq!(
            done,
            "# 01\n\n**Status:** completed\n\n**Completed at:** 2026-11-05T10:00:00Z\n\n- [ ] a\n"
        );
        // The loop's layout round-trips back to the file it started from.
        assert_eq!(with_status(&done, "ready-for-agent", STAMP).unwrap(), t);
        // A second completed replaces the stamp instead of adding one.
        let again = with_status(&done, "completed", "2026-11-06T00:00:00Z").unwrap();
        assert_eq!(again.matches("**Completed at:**").count(), 1);
        assert!(again.contains("2026-11-06T00:00:00Z"));
    }

    #[test]
    fn a_crlf_ticket_stays_crlf() {
        let t = "# 01\r\n\r\n**Status:** blocked\r\n";
        let done = with_status(t, "completed", STAMP).unwrap();
        assert_eq!(
            done,
            "# 01\r\n\r\n**Status:** completed\r\n\r\n**Completed at:** 2026-11-05T10:00:00Z\r\n"
        );
        assert_eq!(status_key_of(&done), "completed");
    }

    #[test]
    fn with_blockers_rewrites_the_whole_field_and_reads_back() {
        let t = "# 03\n\n**Blocked by:** 01 — Fork base,\n  02 — Release\n\n**Status:** ready-for-agent\n";
        let one = with_blockers(t, &["02".into()]).unwrap();
        assert_eq!(
            one,
            "# 03\n\n**Blocked by:** 02\n\n**Status:** ready-for-agent\n"
        );
        assert_eq!(blockers_of(&one), ["02"]);
        let none = with_blockers(t, &[]).unwrap();
        assert!(none.contains("**Blocked by:** None\n"));
        assert!(blockers_of(&none).is_empty());
        // No field yet: one goes above the status line.
        let added = with_blockers("# 03\n\n**Status:** blocked\n", &["01".into()]).unwrap();
        assert_eq!(added, "# 03\n\n**Blocked by:** 01\n\n**Status:** blocked\n");
    }

    #[test]
    fn edit_ticket_writes_only_what_the_panel_may_set() {
        let dir = tempfile::tempdir().unwrap();
        let w = |n: &str, t: &str| std::fs::write(dir.path().join(n), t).unwrap();
        w("00-index.md", "# index\n");
        w(
            "01-a.md",
            "# 01 — A\n\n**Blocked by:** None\n\n**Status:** completed\n",
        );
        w(
            "02-b.md",
            "# 02 — B\n\n**Blocked by:** 01\n\n**Status:** ready-for-agent\n",
        );
        w(
            "03-way.md",
            "# 03 — W\n\nType: question\n\n**Status:** open\n",
        );
        let read = |n: &str| std::fs::read_to_string(dir.path().join(n)).unwrap();
        let status = |key: &str| TicketEdit::Status {
            key: key.into(),
            completed_at: STAMP.into(),
        };

        assert!(edit_ticket(dir.path(), "02", &status("in-progress"))
            .unwrap_err()
            .contains("Not in-progress"));
        assert!(edit_ticket(dir.path(), "03", &status("blocked"))
            .unwrap_err()
            .contains("view only"));
        let bad_stamp = TicketEdit::Status {
            key: "completed".into(),
            completed_at: "yesterday".into(),
        };
        assert!(edit_ticket(dir.path(), "02", &bad_stamp).is_err());
        for bad in [["02"], ["03"], ["00"], ["09"]] {
            let edit = TicketEdit::Blockers(bad.iter().map(|s| s.to_string()).collect());
            assert!(edit_ticket(dir.path(), "02", &edit).is_err(), "{bad:?}");
        }
        assert_eq!(
            read("02-b.md"),
            "# 02 — B\n\n**Blocked by:** 01\n\n**Status:** ready-for-agent\n"
        );

        edit_ticket(dir.path(), "02", &status("blocked")).unwrap();
        edit_ticket(
            dir.path(),
            "02",
            &TicketEdit::Blockers(vec!["01".into(), "01".into()]),
        )
        .unwrap();
        assert_eq!(
            read("02-b.md"),
            "# 02 — B\n\n**Blocked by:** 01\n\n**Status:** blocked\n"
        );
        assert_eq!(
            std::fs::read_dir(dir.path()).unwrap().count(),
            4,
            "no temp file is left behind"
        );
    }

    #[cfg(unix)]
    #[test]
    fn mark_done_never_writes_through_a_symlink() {
        let dir = tempfile::tempdir().unwrap();
        let outside = dir.path().join("elsewhere.txt");
        std::fs::write(&outside, "# x\n**Status:** ready-for-human\n").unwrap();
        let issues = dir.path().join("issues");
        std::fs::create_dir(&issues).unwrap();
        std::os::unix::fs::symlink(&outside, issues.join("01-hitl-a.md")).unwrap();
        assert!(mark_done(&issues, "01").is_err());
        assert_eq!(
            std::fs::read_to_string(&outside).unwrap(),
            "# x\n**Status:** ready-for-human\n"
        );
    }

    #[test]
    fn status_key_cuts_at_comma_period_and_dash() {
        assert_eq!(key_of("completed, closed by hand"), "completed");
        assert_eq!(key_of("done. Shipped"), "done");
        assert_eq!(key_of("resolved — see map"), "resolved");
        assert_eq!(key_of("ready-for-agent  "), "ready-for-agent");
        assert_eq!(key_of(""), "");
    }

    #[test]
    fn blocker_status_falls_back_to_plain_status() {
        assert_eq!(
            blocker_status_key_of("# t\n\nStatus: resolved\n"),
            "resolved"
        );
        assert_eq!(status_key_of("# t\n\nStatus: resolved\n"), "");
        assert_eq!(
            blocker_status_key_of("**Status:**\nStatus: done\n"),
            "done",
            "an empty bold value gives way to a plain one"
        );
        assert_eq!(
            blocker_status_key_of("**Status:** completed\nStatus: x\n"),
            "completed"
        );
    }

    #[test]
    fn every_documented_blocked_by_form_parses() {
        assert_eq!(
            blockers("**Blocked by:** 03 - Extract `activityMerge.ts`; 11 - The Activity trail"),
            "03 11"
        );
        assert_eq!(
            blockers("**Blocked by:** 01, 02, 03, 04, 05, 06, 07 - every ticket in this spec."),
            "01 02 03 04 05 06 07"
        );
        assert_eq!(
            blockers("**Blocked by:** 02 & 05, plus 11 and 12"),
            "02 05 11 12"
        );
        assert_eq!(
            blockers("**Blocked by:** [02 — May the Card hold a claim?](02-may-the-card.md), now resolved."),
            "02"
        );
        assert_eq!(
            blockers("**Blocked by:** ticket 03, which is resolved."),
            "03"
        );
        assert_eq!(blockers("**Blocked by:** none. Related to ticket 06"), "");
        assert_eq!(blockers("Blocked by: Nothing"), "");
        assert_eq!(blockers("# t\n\nno field here\n"), "");
    }

    #[test]
    fn a_dash_never_splits_a_title_and_prose_numbers_are_not_blockers() {
        assert_eq!(blockers("**Blocked by:** 02 - 15 minute timer"), "02");
        assert_eq!(blockers("**Blocked by:** 03 — Read §15 and React 18"), "03");
        assert_eq!(blockers("**Blocked by:** 03, 03, 04"), "03 04");
    }

    #[test]
    fn a_wrapped_field_reads_to_a_blank_line_heading_or_label() {
        let text = "# t\n**Blocked by:** 03 — Extract; 11 — The trail; 21 — Node settings\nand the Result tab; 22 — Last.\n**Status:** ready-for-agent\n";
        assert_eq!(blockers(text), "03 11 21 22");
        let blank = "**Blocked by:** 03\n\n04 — not part of the field\n";
        assert_eq!(blockers(blank), "03");
        let heading = "**Blocked by:** 03\n## Notes\n04\n";
        assert_eq!(blockers(heading), "03");
        // A bold field stops only at a bold label: a wrapped title may start "Capture: ...".
        let wrap = "**Blocked by:** 03 — Title\nCapture: x;\n04 — more\n";
        assert_eq!(blockers(wrap), "03 04");
        // A plain field stops at a plain label.
        let plain = "Blocked by: 03\nResolved by: 04\n";
        assert_eq!(blockers(plain), "03");
    }

    #[test]
    fn crlf_reads_the_same_as_lf() {
        let lf = "# 04 — Title\n\n**Blocked by:** 03 — A;\n  05 — B\n**Status:** completed, by hand\n**Type:** task\n";
        let crlf = lf.replace('\n', "\r\n");
        assert_eq!(blockers_of(&crlf), blockers_of(lf));
        assert_eq!(blockers_of(&crlf), ["03", "05"]);
        assert_eq!(status_key_of(&crlf), "completed");
        assert_eq!(title_of(&crlf), title_of(lf));
        assert_eq!(title_of(&crlf), "Title");
        assert!(!is_wayfinder(&crlf));
        let q = "# t\r\n## Question\r\n";
        assert!(is_wayfinder(q));
        assert_eq!(blockers("**Blocked by:** 03\r\n\r\n04\r\n"), "03");
    }

    #[test]
    fn title_strips_the_number_in_both_forms() {
        assert_eq!(title_of("# 22 — The Activity tab\n"), "The Activity tab");
        assert_eq!(title_of("# 07. Seven\n"), "Seven");
        assert_eq!(title_of("#   No number\n"), "No number");
        assert_eq!(title_of("## 05 — Two hashes\n"), "# 05 — Two hashes");
        assert_eq!(title_of("no heading\n"), "");
    }

    #[test]
    fn wayfinder_needs_a_plain_type_or_a_question_heading() {
        assert!(is_wayfinder("# t\nType: question\n"));
        assert!(is_wayfinder("# t\n## Question  \n"));
        assert!(!is_wayfinder("# t\n**Type:** task\n"));
        assert!(!is_wayfinder("# t\n## Questions\n"));
        assert!(!is_wayfinder("# t\n  Type: x\n"));
    }

    #[test]
    fn human_is_hitl_in_the_name_or_ready_for_human() {
        assert!(is_human("18-hitl-thing.md", "**Status:** ready-for-agent"));
        assert!(is_human("18-thing.md", "**Status:** ready-for-human"));
        assert!(is_human("18-thing.md", "**Status:** ready-for-human, note"));
        assert!(!is_human("18-thing.md", "Status: ready-for-human"));
        assert!(!is_human("18-thing.md", "**Status:** ready-for-agent"));
    }

    #[test]
    fn a_non_breaking_space_is_text_not_whitespace() {
        // `\s` would take U+00A0; `[[:space:]]` does not.
        assert_eq!(blockers("**Blocked by:** 03\u{a0}\u{a0}04"), "03");
        assert_eq!(title_of("#\u{a0}x\n"), "\u{a0}x");
    }

    fn write(dir: &Path, name: &str, text: &str) {
        std::fs::write(dir.join(name), text).unwrap();
    }

    #[test]
    fn blockers_met_needs_a_file_and_a_done_status() {
        let d = tempfile::tempdir().unwrap();
        write(d.path(), "00-index.md", "# index\n");
        write(d.path(), "01-a.md", "# 01 — A\n**Status:** completed\n");
        write(
            d.path(),
            "02-b.md",
            "# 02 — B\nStatus: resolved\nType: question\n",
        );
        write(
            d.path(),
            "03-c.md",
            "# 03 — C\n**Status:** ready-for-agent\n",
        );
        write(
            d.path(),
            "04-d.md",
            "# 04 — D\n**Blocked by:** 01; 02\n**Status:** ready-for-agent\n",
        );
        write(
            d.path(),
            "05-e.md",
            "# 05 — E\n**Blocked by:** 01, 03\n**Status:** ready-for-agent\n",
        );
        write(
            d.path(),
            "06-f.md",
            "# 06 — F\n**Blocked by:** 09\n**Status:** ready-for-agent\n",
        );
        write(d.path(), "notes.md", "# not a ticket\n");
        let t = read_tickets(d.path()).unwrap();
        let met: Vec<(&str, bool)> = t
            .iter()
            .map(|t| (t.number.as_str(), t.blockers_met))
            .collect();
        assert_eq!(
            met,
            [
                ("01", true),
                ("02", true),
                ("03", true),
                ("04", true),
                ("05", false),
                ("06", false)
            ]
        );
        assert!(!t[1].agent_may_take(), "a wayfinder is not for the agent");
        assert_eq!(t[1].status_key, "");
        assert_eq!(t[1].blocker_status_key, "resolved");
    }

    #[test]
    fn crlf_fixture_folders_read_like_lf_ones() {
        let fixtures = fixtures_dir();
        let mut count = 0;
        for folder in std::fs::read_dir(&fixtures).unwrap() {
            let issues = folder.unwrap().path().join("issues");
            let lf = read_tickets(&issues).unwrap();
            let tmp = tempfile::tempdir().unwrap();
            for t in &lf {
                let name = t.path.file_name().unwrap();
                let text = std::fs::read_to_string(&t.path)
                    .unwrap()
                    .replace("\r\n", "\n");
                std::fs::write(tmp.path().join(name), text.replace('\n', "\r\n")).unwrap();
            }
            // The index is not a ticket but a blocker may name it.
            let index = issues.join("00-index.md");
            if index.exists() {
                let text = std::fs::read_to_string(&index)
                    .unwrap()
                    .replace("\r\n", "\n");
                std::fs::write(tmp.path().join("00-index.md"), text.replace('\n', "\r\n")).unwrap();
            }
            let crlf = read_tickets(tmp.path()).unwrap();
            assert_eq!(lf.len(), crlf.len());
            for (a, b) in lf.iter().zip(&crlf) {
                let (mut a, mut b) = (a.clone(), b.clone());
                a.path = PathBuf::new();
                b.path = PathBuf::new();
                assert_eq!(a, b, "{}", issues.display());
            }
            count += lf.len();
        }
        assert_eq!(count, 301);
    }

    fn fixtures_dir() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../ralph/tests/fixtures/memark-tickets")
    }

    #[cfg(not(windows))]
    #[test]
    fn a_local_path_is_unchanged() {
        assert_eq!(
            issues_dir_on_host("/home/u/feat/issues", &WorkspaceEnv::Local),
            PathBuf::from("/home/u/feat/issues")
        );
    }

    #[cfg(windows)]
    #[test]
    fn a_wsl_path_becomes_a_unc_path() {
        let ws = WorkspaceEnv::Wsl {
            distro: "Ubuntu".into(),
        };
        let p = issues_dir_on_host("/home/u/feat/issues", &ws)
            .display()
            .to_string();
        let tail = r"Ubuntu\home\u\feat\issues";
        assert!(
            p == format!(r"\\wsl.localhost\{tail}") || p == format!(r"\\wsl$\{tail}"),
            "{p}"
        );
        let drvfs = issues_dir_on_host("/mnt/c/work/feat/issues", &ws);
        assert_eq!(drvfs, PathBuf::from(r"C:\work\feat\issues"));
    }

    #[cfg(windows)]
    #[test]
    fn a_unsafe_distro_never_reaches_the_share_root() {
        let ws = WorkspaceEnv::Wsl {
            distro: r"..\evil".into(),
        };
        let p = issues_dir_on_host("/x", &ws).display().to_string();
        assert!(p.contains("__terax_invalid_distro__"), "{p}");
    }
}
