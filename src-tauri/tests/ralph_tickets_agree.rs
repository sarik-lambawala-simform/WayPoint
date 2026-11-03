//! The agreement test: the bash reader, `ralph/lib/tickets.sh`, and the Rust reader on every
//! fixture ticket. They must agree on status key, blocker status key, blocker list, blocker met
//! and title, or the app shows a ticket as ready that the loop never runs, or the other way round.
//!
//! Bash runs once per fixture folder and prints one six-column row per ticket. Needs `bash`, so it
//! runs on Linux and macOS; Windows runs the reader's unit tests (CRLF fixtures, UNC paths) instead.

#![cfg(unix)]

use std::path::{Path, PathBuf};
use std::process::Command;

use terax_lib::modules::ralph::tickets::read_tickets;

fn root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../ralph")
}

/// The same snippet the Ralph UI's `tests/tickets-agree.test.ts` runs.
const SNIPPET: &str = r#"set -euo pipefail
source "$1"
ISSUES_DIR="$2"
while IFS=$'\t' read -r num path; do
  if blockers_met "$path"; then met=yes; else met=no; fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$num" "$(status_key_of "$path")" \
    "$(blocker_status_key_of "$path")" "$(blockers_of "$path")" "$met" "$(title_of "$path")"
done < <(ticket_files)"#;

fn bash_rows(dir: &Path) -> Vec<String> {
    let out = Command::new("bash")
        .args(["-c", SNIPPET, "bash"])
        .arg(root().join("lib/tickets.sh"))
        .arg(dir)
        // Byte-order sorting and C-locale character classes, as the Rust reader has them.
        .env("LC_ALL", "C")
        .output()
        .expect("bash runs");
    assert!(
        out.status.success(),
        "bash: {}",
        String::from_utf8_lossy(&out.stderr)
    );
    String::from_utf8(out.stdout)
        .unwrap()
        .lines()
        .map(|l| {
            // The script's blockers column ends with a space; the row is compared trimmed.
            let mut c: Vec<&str> = l.split('\t').collect();
            let trimmed = c.get(3).map(|s| s.trim()).unwrap_or("");
            c[3] = trimmed;
            c.join("\t")
        })
        .collect()
}

fn rust_rows(dir: &Path) -> Vec<String> {
    read_tickets(dir)
        .unwrap()
        .iter()
        .map(|t| {
            [
                t.number.as_str(),
                t.status_key.as_str(),
                t.blocker_status_key.as_str(),
                &t.blockers.join(" "),
                if t.blockers_met { "yes" } else { "no" },
                t.title.as_str(),
            ]
            .join("\t")
        })
        .collect()
}

#[test]
fn the_rust_and_bash_readers_agree_on_all_301_fixture_tickets() {
    let fixtures = root().join("tests/fixtures/memark-tickets");
    let mut folders: Vec<PathBuf> = std::fs::read_dir(&fixtures)
        .unwrap()
        .map(|e| e.unwrap().path())
        .collect();
    folders.sort();
    assert_eq!(folders.len(), 24, "the Ralph UI's 24 fixture folders");
    let mut count = 0;
    for folder in folders {
        let issues = folder.join("issues");
        let bash = bash_rows(&issues);
        assert_eq!(rust_rows(&issues), bash, "{}", folder.display());
        count += bash.len();
    }
    assert_eq!(count, 301);
}
