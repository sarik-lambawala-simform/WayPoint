//! What the `map` gate looks at: `map.md`, the wayfinder tickets in `issues/` and the map's
//! `## Not yet specified` section.

use std::path::Path;

use serde::Serialize;

use crate::modules::ralph::tickets::{blocker_status_key_of, is_done_key, read_tickets};

const SECTION: &str = "## Not yet specified";

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize)]
pub struct MapFacts {
    /// `map.md` exists in the feature folder.
    pub exists: bool,
    /// Names of the wayfinder tickets whose status is not completed, resolved or done.
    pub open_wayfinder: Vec<String>,
    /// `## Not yet specified` holds nothing but comments (or the map has no such section).
    pub unspecified_clear: bool,
}

/// True when `section` (the lines under a heading) holds nothing but whitespace and
/// `<!-- ... -->` comments, which may span lines.
fn only_comments(section: &str) -> bool {
    let mut rest = section;
    let mut text = String::new();
    while let Some(start) = rest.find("<!--") {
        text.push_str(&rest[..start]);
        match rest[start..].find("-->") {
            Some(end) => rest = &rest[start + end + 3..],
            // An unterminated comment is not a comment: its text counts.
            None => break,
        }
    }
    text.push_str(rest);
    text.trim().is_empty()
}

/// The lines between the `## Not yet specified` heading and the next `## ` heading (or the end).
/// Fenced comments are not special: only a line starting with `## ` ends the section.
pub fn unspecified_clear(map: &str) -> bool {
    let mut inside = false;
    let mut body = String::new();
    for line in map.lines() {
        let trimmed = line.trim_end();
        if inside && line.starts_with("## ") {
            break;
        }
        if !inside && trimmed == SECTION {
            inside = true;
            continue;
        }
        if inside {
            body.push_str(line);
            body.push('\n');
        }
    }
    only_comments(&body)
}

pub fn map_facts(feature_dir: &Path) -> MapFacts {
    let Ok(map) = std::fs::read_to_string(feature_dir.join("map.md")) else {
        return MapFacts::default();
    };
    let open_wayfinder = read_tickets(&feature_dir.join("issues"))
        .unwrap_or_default()
        .into_iter()
        .filter(|t| t.wayfinder)
        .filter(|t| {
            let text = std::fs::read_to_string(&t.path).unwrap_or_default();
            !is_done_key(&blocker_status_key_of(&text))
        })
        .map(|t| {
            t.path
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default()
        })
        .collect();
    MapFacts {
        exists: true,
        open_wayfinder,
        unspecified_clear: unspecified_clear(&map),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_section_of_comments_is_clear() {
        let map = "# m\n\n## Not yet specified\n\n<!-- Nothing left. -->\n\n## Out of scope\n- x\n";
        assert!(unspecified_clear(map));
        assert!(unspecified_clear(
            "# m\n## Not yet specified\n<!-- a\nb -->\n"
        ));
        assert!(unspecified_clear("# m\n"), "no section holds nothing");
    }

    #[test]
    fn anything_but_comments_is_not_clear() {
        assert!(!unspecified_clear(
            "## Not yet specified\n- Where does X go?\n"
        ));
        assert!(!unspecified_clear(
            "## Not yet specified\n<!-- c -->\nreal text\n## Out of scope\n"
        ));
        assert!(!unspecified_clear(
            "## Not yet specified\n<!-- unterminated\n- x\n"
        ));
    }

    #[test]
    fn open_wayfinder_tickets_and_a_missing_map() {
        let dir = tempfile::tempdir().unwrap();
        assert!(!map_facts(dir.path()).exists);
        std::fs::write(
            dir.path().join("map.md"),
            "# m\n## Not yet specified\n<!-- none -->\n",
        )
        .unwrap();
        std::fs::create_dir(dir.path().join("issues")).unwrap();
        let w = |n: &str, t: &str| std::fs::write(dir.path().join("issues").join(n), t).unwrap();
        w("01-a.md", "# a\n\nType: question\n\n**Status:** resolved\n");
        w(
            "02-b.md",
            "# b\n\n## Question\n\n**Status:** ready-for-agent\n",
        );
        w("03-c.md", "# c\n\n**Status:** ready-for-agent\n");
        let f = map_facts(dir.path());
        assert!(f.exists && f.unspecified_clear);
        assert_eq!(f.open_wayfinder, ["02-b.md"]);
    }
}
