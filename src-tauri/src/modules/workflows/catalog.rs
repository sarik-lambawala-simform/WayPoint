//! Where workflow files are found: the shipped default, `~/.config/waypoint/workflows/` and the
//! repo's `.workflows/`. On an id clash the repo wins, then the user, then the shipped file.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

use super::workflow::{
    parse_workflow, shipped_source, LoadError, Workflow, SHIPPED_FILE, SHIPPED_ID,
};

/// A workflow file bigger than this is an error, not a parse.
const MAX_FILE_BYTES: u64 = 256 * 1024;

/// Where a file comes from. Declared in precedence order: the first one wins an id clash.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Source {
    Repo,
    User,
    Shipped,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct FileRef {
    pub source: Source,
    /// The real path, or the bundled file's name for the shipped default.
    pub path: String,
}

/// A workflow the picker offers: the file in use and the files it shadows.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct CatalogEntry {
    pub id: String,
    pub source: Source,
    pub path: String,
    /// The folder holding the file; `{{ workflow_dir }}`. Empty for the shipped file.
    pub dir: String,
    pub workflow: Workflow,
    pub shadows: Vec<FileRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Catalog {
    pub entries: Vec<CatalogEntry>,
    /// Files that did not load. A file that fails still holds its id: the file below it is not
    /// quietly used instead.
    pub errors: Vec<LoadError>,
    /// The real path of the user workflows folder, shown in the app.
    pub user_dir: String,
}

struct Candidate {
    source: Source,
    id: String,
    /// `None` for the shipped default.
    path: Option<PathBuf>,
}

impl Candidate {
    fn path_text(&self) -> String {
        self.path
            .as_ref()
            .map_or_else(|| SHIPPED_FILE.to_string(), |p| p.display().to_string())
    }
}

/// `~/.config/waypoint/workflows`, on every OS (`%USERPROFILE%\.config\...` on Windows).
pub fn user_workflows_dir() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".config").join("waypoint").join("workflows"))
}

fn is_workflow_file(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|e| e.to_str()),
        Some("yaml" | "yml")
    )
}

/// The workflow files of one folder, sorted; `.yaml` before `.yml` for the same stem. A missing
/// folder is an empty list. `follow_links` is off for a repo folder: a checked-in symlink must not
/// make the app read a file outside the repo.
fn list_dir(dir: &Path, source: Source, follow_links: bool) -> Vec<Candidate> {
    let Ok(read) = fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut out: Vec<Candidate> = read
        .flatten()
        .filter_map(|entry| {
            let path = entry.path();
            if !is_workflow_file(&path) {
                return None;
            }
            let is_file = if follow_links {
                fs::metadata(&path).map(|m| m.is_file()).unwrap_or(false)
            } else {
                entry.file_type().map(|t| t.is_file()).unwrap_or(false)
            };
            if !is_file {
                return None;
            }
            let id = path.file_stem()?.to_str()?.to_string();
            Some(Candidate {
                source,
                id,
                path: Some(path),
            })
        })
        .collect();
    out.sort_by(|a, b| a.path.cmp(&b.path));
    out
}

fn load_file(c: &Candidate) -> Result<Workflow, LoadError> {
    let Some(path) = &c.path else {
        return parse_workflow(&c.id, SHIPPED_FILE, shipped_source());
    };
    let file = path.display().to_string();
    let fail = |message: String| LoadError {
        file: file.clone(),
        line: 1,
        message,
    };
    let size = fs::metadata(path)
        .map_err(|e| fail(format!("cannot read the file: {e}")))?
        .len();
    if size > MAX_FILE_BYTES {
        return Err(fail(format!(
            "the file is {size} bytes; a workflow file is at most {MAX_FILE_BYTES}"
        )));
    }
    let bytes = fs::read(path).map_err(|e| fail(format!("cannot read the file: {e}")))?;
    let text = String::from_utf8(bytes).map_err(|_| fail("the file is not UTF-8 text".into()))?;
    parse_workflow(&c.id, &file, &text)
}

/// Finds and loads every workflow file visible from a repo. `repo_dir` is the repo's
/// `.workflows/` folder when a repo is open.
pub fn build_catalog(user_dir: Option<&Path>, repo_dir: Option<&Path>) -> Catalog {
    let mut candidates = vec![Candidate {
        source: Source::Shipped,
        id: SHIPPED_ID.to_string(),
        path: None,
    }];
    if let Some(dir) = user_dir {
        candidates.extend(list_dir(dir, Source::User, true));
    }
    if let Some(dir) = repo_dir {
        candidates.extend(list_dir(dir, Source::Repo, false));
    }

    let mut by_id: BTreeMap<String, Vec<Candidate>> = BTreeMap::new();
    for c in candidates {
        by_id.entry(c.id.clone()).or_default().push(c);
    }

    let mut entries = Vec::new();
    let mut errors = Vec::new();
    for (id, mut group) in by_id {
        // Stable: within one source the sorted file order (`.yaml` first) is kept.
        group.sort_by_key(|c| c.source);
        let mut loaded = Vec::with_capacity(group.len());
        for c in &group {
            match load_file(c) {
                Ok(w) => loaded.push(Some(w)),
                Err(e) => {
                    errors.push(e);
                    loaded.push(None);
                }
            }
        }
        let Some(Some(workflow)) = loaded.into_iter().next() else {
            continue;
        };
        let mut group = group.into_iter();
        let winner = group.next().expect("a group has a file");
        let dir = winner
            .path
            .as_deref()
            .and_then(Path::parent)
            .map_or_else(String::new, |p| p.display().to_string());
        entries.push(CatalogEntry {
            id,
            source: winner.source,
            path: winner.path_text(),
            dir,
            workflow,
            shadows: group
                .map(|c| FileRef {
                    source: c.source,
                    path: c.path_text(),
                })
                .collect(),
        });
    }
    // The shipped default first, then by id.
    entries.sort_by_key(|e| (e.id != SHIPPED_ID, e.id.clone()));

    Catalog {
        entries,
        errors,
        user_dir: user_dir.map_or_else(String::new, |d| d.display().to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const LOOKUP: &str = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/src/modules/workflows/fixtures/lookup"
    );

    fn catalog() -> Catalog {
        let user = PathBuf::from(LOOKUP).join("user");
        let repo = PathBuf::from(LOOKUP).join("repo");
        build_catalog(Some(&user), Some(&repo))
    }

    fn entry<'a>(c: &'a Catalog, id: &str) -> &'a CatalogEntry {
        c.entries.iter().find(|e| e.id == id).unwrap()
    }

    #[test]
    fn finds_shipped_user_and_repo_files_and_both_extensions() {
        let c = catalog();
        let ids: Vec<&str> = c.entries.iter().map(|e| e.id.as_str()).collect();
        assert_eq!(ids, ["matt-pocock", "mine", "shared", "team"]);
        assert_eq!(entry(&c, "mine").source, Source::User); // .yml
        assert_eq!(entry(&c, "team").source, Source::Repo); // .yaml
        assert!(c.errors.is_empty(), "{:?}", c.errors);
    }

    #[test]
    fn repo_beats_user_beats_shipped_and_shadows_are_listed() {
        let c = catalog();
        let shared = entry(&c, "shared");
        assert_eq!(shared.source, Source::Repo);
        assert_eq!(shared.workflow.title, "Shared (repo)");
        assert_eq!(shared.shadows.len(), 1);
        assert_eq!(shared.shadows[0].source, Source::User);
        assert!(Path::new(&shared.shadows[0].path).ends_with("user/shared.yaml"));

        let matt = entry(&c, "matt-pocock");
        assert_eq!(matt.source, Source::User);
        assert_eq!(matt.workflow.title, "My Matt Pocock");
        assert_eq!(matt.shadows.len(), 1);
        assert_eq!(matt.shadows[0].source, Source::Shipped);
    }

    #[test]
    fn the_file_in_use_carries_its_real_path_and_folder() {
        let c = catalog();
        let team = entry(&c, "team");
        assert!(Path::new(&team.path).ends_with("repo/team.yaml"));
        assert!(Path::new(&team.dir).ends_with("repo"));
    }

    #[test]
    fn without_user_or_repo_folders_only_the_shipped_file_loads() {
        let c = build_catalog(None, Some(Path::new("/no/such/folder")));
        assert_eq!(c.entries.len(), 1);
        assert_eq!(c.entries[0].source, Source::Shipped);
        assert!(c.entries[0].shadows.is_empty());
        assert_eq!(c.user_dir, "");
    }

    #[test]
    fn reports_the_user_folder_path() {
        let c = catalog();
        assert!(Path::new(&c.user_dir).ends_with("lookup/user"));
    }

    #[test]
    fn a_broken_winner_reports_its_error_and_keeps_its_id() {
        let dir = tempfile::tempdir().unwrap();
        let user = dir.path().join("user");
        let repo = dir.path().join("repo");
        std::fs::create_dir_all(&user).unwrap();
        std::fs::create_dir_all(&repo).unwrap();
        let good = "version: 1\ntitle: Good\nstages:\n  - name: A\n    skill: a\n";
        std::fs::write(user.join("w.yaml"), good).unwrap();
        std::fs::write(
            repo.join("w.yaml"),
            "version: 1\ntitle: Bad\nstages:\n  - name: A\n",
        )
        .unwrap();
        let c = build_catalog(Some(&user), Some(&repo));
        assert!(c.entries.iter().all(|e| e.id != "w"));
        assert_eq!(c.errors.len(), 1);
        assert!(Path::new(&c.errors[0].file).ends_with("repo/w.yaml"));
        assert_eq!(c.errors[0].line, 4);
    }

    #[test]
    fn yaml_beats_yml_for_the_same_stem() {
        let dir = tempfile::tempdir().unwrap();
        let body =
            |t: &str| format!("version: 1\ntitle: {t}\nstages:\n  - name: A\n    skill: a\n");
        std::fs::write(dir.path().join("w.yaml"), body("Yaml")).unwrap();
        std::fs::write(dir.path().join("w.yml"), body("Yml")).unwrap();
        let c = build_catalog(Some(dir.path()), None);
        let w = entry(&c, "w");
        assert_eq!(w.workflow.title, "Yaml");
        assert_eq!(w.shadows.len(), 1);
    }

    #[cfg(unix)]
    #[test]
    fn a_symlink_in_the_repo_folder_is_not_followed() {
        let dir = tempfile::tempdir().unwrap();
        let outside = dir.path().join("outside.yaml");
        std::fs::write(
            &outside,
            "version: 1\ntitle: O\nstages:\n  - name: A\n    skill: a\n",
        )
        .unwrap();
        let repo = dir.path().join("repo");
        std::fs::create_dir_all(&repo).unwrap();
        std::os::unix::fs::symlink(&outside, repo.join("link.yaml")).unwrap();
        let c = build_catalog(None, Some(&repo));
        assert!(c.entries.iter().all(|e| e.id != "link"));
    }
}
