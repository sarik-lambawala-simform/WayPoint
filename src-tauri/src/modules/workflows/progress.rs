//! What no file can show about a feature: its workflow, its route and the confirm and skip marks.
//! `progress.yaml` lives in the feature folder (and at the repo root for `scope: repo` stages).
//! It is written only when the user picks a workflow, starts a stage or records something.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_norway::Value;

pub const PROGRESS_FILE: &str = "progress.yaml";

/// One writer at a time, so two quick clicks never lose a mark.
static WRITE_LOCK: Mutex<()> = Mutex::new(());

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct StageMark {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub confirmed: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub skipped: Option<String>,
    /// When a `check` gate last passed.
    #[serde(
        default,
        rename = "check passed",
        skip_serializing_if = "Option::is_none"
    )]
    pub check_passed: Option<String>,
    /// Keys a later version wrote; kept so a write never drops them.
    #[serde(flatten)]
    pub extra: BTreeMap<String, Value>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct ProgressFile {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub workflow: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub route: Option<String>,
    /// Keyed by the stage's plain `name`.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub stages: BTreeMap<String, StageMark>,
    #[serde(flatten)]
    pub extra: BTreeMap<String, Value>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ProgressError {
    pub file: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize)]
pub struct ProgressRead {
    pub file: Option<ProgressFile>,
    pub error: Option<ProgressError>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Mark {
    Confirmed,
    Skipped,
    /// A `check` gate passed.
    Passed,
    Clear,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Update {
    Workflow {
        id: String,
    },
    Route {
        route: Option<String>,
    },
    Mark {
        stage: String,
        mark: Mark,
        at: String,
    },
}

/// A progress file bigger than this is an error, not a parse.
const MAX_FILE_BYTES: u64 = 256 * 1024;

pub fn read_progress(dir: &Path) -> ProgressRead {
    let path = dir.join(PROGRESS_FILE);
    let shown = path.to_string_lossy().into_owned();
    let fail = |message: String| ProgressRead {
        file: None,
        error: Some(ProgressError {
            file: shown.clone(),
            message,
        }),
    };
    let meta = match fs::metadata(&path) {
        Ok(m) => m,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return ProgressRead::default(),
        Err(e) => return fail(e.to_string()),
    };
    if meta.len() > MAX_FILE_BYTES {
        return fail("the file is too big".into());
    }
    let text = match fs::read_to_string(&path) {
        Ok(t) => t,
        Err(e) => return fail(e.to_string()),
    };
    if text.trim().is_empty() {
        return ProgressRead {
            file: Some(ProgressFile::default()),
            error: None,
        };
    }
    match serde_norway::from_str::<ProgressFile>(&text) {
        Ok(file) => ProgressRead {
            file: Some(file),
            error: None,
        },
        Err(e) => fail(e.to_string()),
    }
}

pub fn apply_update(file: &mut ProgressFile, update: &Update) {
    match update {
        Update::Workflow { id } => file.workflow = Some(id.clone()),
        Update::Route { route } => file.route = route.clone(),
        Update::Mark { stage, mark, at } => {
            let entry = file.stages.entry(stage.clone()).or_default();
            entry.confirmed = None;
            entry.skipped = None;
            entry.check_passed = None;
            match mark {
                Mark::Confirmed => entry.confirmed = Some(at.clone()),
                Mark::Skipped => entry.skipped = Some(at.clone()),
                Mark::Passed => entry.check_passed = Some(at.clone()),
                Mark::Clear => {}
            }
            if entry.confirmed.is_none()
                && entry.skipped.is_none()
                && entry.check_passed.is_none()
                && entry.extra.is_empty()
            {
                file.stages.remove(stage);
            }
        }
    }
}

/// Reads, applies one update, writes back atomically. An unreadable file is never overwritten.
pub fn record(dir: &Path, update: &Update) -> Result<ProgressFile, String> {
    let _guard = WRITE_LOCK.lock().unwrap_or_else(|p| p.into_inner());
    let read = read_progress(dir);
    if let Some(err) = read.error {
        return Err(format!("{}: {}", err.file, err.message));
    }
    let mut file = read.file.unwrap_or_default();
    apply_update(&mut file, update);
    let text = serde_norway::to_string(&file).map_err(|e| e.to_string())?;
    let path = dir.join(PROGRESS_FILE);
    let tmp = dir.join(format!("{PROGRESS_FILE}.tmp"));
    fs::write(&tmp, text).map_err(|e| format!("{}: {e}", tmp.display()))?;
    fs::rename(&tmp, &path).map_err(|e| {
        let _ = fs::remove_file(&tmp);
        format!("{}: {e}", path.display())
    })?;
    Ok(file)
}

const MAX_DEPTH: usize = 4;
const MAX_FILES: usize = 5000;
const SKIP_DIRS: [&str; 3] = [".git", "node_modules", "target"];

fn safe_relative(rel: &str) -> Option<PathBuf> {
    let p = Path::new(rel);
    p.components()
        .all(|c| matches!(c, Component::Normal(_) | Component::CurDir))
        .then(|| p.to_path_buf())
}

fn walk(base: &Path, dir: &Path, depth: usize, out: &mut Vec<String>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    let mut entries: Vec<_> = entries.flatten().collect();
    entries.sort_by_key(|e| e.file_name());
    for entry in entries {
        if out.len() >= MAX_FILES {
            return;
        }
        let path = entry.path();
        let Ok(kind) = entry.file_type() else {
            continue;
        };
        if kind.is_dir() {
            let name = entry.file_name();
            let skip = SKIP_DIRS.iter().any(|s| name == *s);
            if depth < MAX_DEPTH && !skip {
                walk(base, &path, depth + 1, out);
            }
        } else if kind.is_file() {
            if let Ok(rel) = path.strip_prefix(base) {
                out.push(rel.to_string_lossy().replace('\\', "/"));
            }
        }
    }
}

/// Relative paths of the files under each relative `dirs` entry of `root` ("" is the root itself).
/// Bounded in depth and count; a missing folder lists nothing; `..` and absolute entries are skipped.
pub fn list_files(root: &Path, dirs: &[String]) -> Vec<String> {
    let mut out = Vec::new();
    for rel in dirs {
        let Some(rel) = safe_relative(rel) else {
            continue;
        };
        walk(root, &root.join(rel), 0, &mut out);
    }
    out.sort();
    out.dedup();
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mark(stage: &str, mark: Mark) -> Update {
        Update::Mark {
            stage: stage.into(),
            mark,
            at: "2026-11-03T10:00:00Z".into(),
        }
    }

    #[test]
    fn a_missing_file_reads_as_nothing_and_is_not_created_by_a_read() {
        let dir = tempfile::tempdir().unwrap();
        let read = read_progress(dir.path());
        assert_eq!(read, ProgressRead::default());
        assert!(!dir.path().join(PROGRESS_FILE).exists());
    }

    #[test]
    fn records_round_trip_keyed_by_plain_stage_name() {
        let dir = tempfile::tempdir().unwrap();
        record(
            dir.path(),
            &Update::Workflow {
                id: "matt-pocock".into(),
            },
        )
        .unwrap();
        record(
            dir.path(),
            &Update::Route {
                route: Some("wayfinder".into()),
            },
        )
        .unwrap();
        record(dir.path(), &mark("Grill", Mark::Confirmed)).unwrap();
        record(dir.path(), &mark("Prototype", Mark::Skipped)).unwrap();
        let text = fs::read_to_string(dir.path().join(PROGRESS_FILE)).unwrap();
        assert!(text.contains("workflow: matt-pocock"), "{text}");
        assert!(text.contains("route: wayfinder"), "{text}");
        let file = read_progress(dir.path()).file.unwrap();
        assert_eq!(
            file.stages["Grill"].confirmed.as_deref(),
            Some("2026-11-03T10:00:00Z")
        );
        assert_eq!(
            file.stages["Prototype"].skipped.as_deref(),
            Some("2026-11-03T10:00:00Z")
        );
    }

    #[test]
    fn a_new_mark_replaces_the_old_one_and_clear_removes_the_entry() {
        let dir = tempfile::tempdir().unwrap();
        record(dir.path(), &mark("Grill", Mark::Confirmed)).unwrap();
        let file = record(dir.path(), &mark("Grill", Mark::Skipped)).unwrap();
        assert!(file.stages["Grill"].confirmed.is_none());
        assert!(file.stages["Grill"].skipped.is_some());
        let file = record(dir.path(), &mark("Grill", Mark::Clear)).unwrap();
        assert!(file.stages.is_empty());
    }

    #[test]
    fn a_check_pass_is_written_under_check_passed_and_cleared_by_clear() {
        let dir = tempfile::tempdir().unwrap();
        record(dir.path(), &mark("Lint", Mark::Passed)).unwrap();
        let text = fs::read_to_string(dir.path().join(PROGRESS_FILE)).unwrap();
        assert!(text.contains("check passed:"), "{text}");
        let file = read_progress(dir.path()).file.unwrap();
        assert_eq!(
            file.stages["Lint"].check_passed.as_deref(),
            Some("2026-11-03T10:00:00Z")
        );
        let file = record(dir.path(), &mark("Lint", Mark::Clear)).unwrap();
        assert!(file.stages.is_empty());
    }

    #[test]
    fn unknown_keys_survive_a_write() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(
            dir.path().join(PROGRESS_FILE),
            "workflow: w\nnote: keep me\nstages:\n  Grill:\n    check passed: x\n",
        )
        .unwrap();
        record(dir.path(), &mark("Spec", Mark::Confirmed)).unwrap();
        let text = fs::read_to_string(dir.path().join(PROGRESS_FILE)).unwrap();
        assert!(text.contains("note: keep me"), "{text}");
        assert!(text.contains("check passed"), "{text}");
    }

    #[test]
    fn a_broken_file_is_an_error_with_its_path_and_is_never_overwritten() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join(PROGRESS_FILE);
        fs::write(&path, "stages: [not, a, map]\n").unwrap();
        let read = read_progress(dir.path());
        let err = read.error.unwrap();
        assert_eq!(err.file, path.to_string_lossy());
        assert!(record(dir.path(), &mark("Grill", Mark::Confirmed)).is_err());
        assert_eq!(
            fs::read_to_string(&path).unwrap(),
            "stages: [not, a, map]\n"
        );
    }

    #[test]
    fn lists_files_under_the_asked_folders_only() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();
        fs::create_dir_all(root.join("issues")).unwrap();
        fs::create_dir_all(root.join("docs/agents")).unwrap();
        fs::create_dir_all(root.join("node_modules/x")).unwrap();
        fs::write(root.join("spec.md"), "").unwrap();
        fs::write(root.join("issues/01-a.md"), "").unwrap();
        fs::write(root.join("docs/agents/issue-tracker.md"), "").unwrap();
        fs::write(root.join("node_modules/x/y.js"), "").unwrap();
        assert_eq!(
            list_files(root, &["".into()]),
            vec!["docs/agents/issue-tracker.md", "issues/01-a.md", "spec.md"]
        );
        assert_eq!(
            list_files(root, &["docs/agents".into(), "nope".into()]),
            vec!["docs/agents/issue-tracker.md"]
        );
        assert!(list_files(root, &["../x".into(), "/etc".into()]).is_empty());
    }
}
