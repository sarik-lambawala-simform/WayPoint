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
