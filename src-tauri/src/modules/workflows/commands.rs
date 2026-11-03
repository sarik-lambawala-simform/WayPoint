use std::path::PathBuf;

use super::catalog::{build_catalog, user_workflows_dir, Catalog};
use super::progress::{self, ProgressFile, ProgressRead, Update};
use super::workflow::{shipped_workflow, Workflow};

#[tauri::command]
pub fn workflows_shipped() -> Result<Workflow, String> {
    shipped_workflow().map_err(|e| e.to_string())
}

/// Every workflow visible from a repo (or from the user folder alone when no repo is given).
#[tauri::command]
pub fn workflows_catalog(repo_root: Option<String>) -> Catalog {
    let repo_dir = repo_root
        .map(PathBuf::from)
        .filter(|root| root.is_absolute() && root.is_dir())
        .map(|root| root.join(".workflows"));
    build_catalog(user_workflows_dir().as_deref(), repo_dir.as_deref())
}

/// The `progress.yaml` of a folder, or the error that stops it loading (with the file's path).
#[tauri::command]
pub async fn workflows_read_progress(dir: String) -> ProgressRead {
    tokio::task::spawn_blocking(move || progress::read_progress(&PathBuf::from(dir)))
        .await
        .unwrap_or_default()
}

/// Applies one record (a workflow, a route, a mark) to the folder's `progress.yaml`.
#[tauri::command]
pub async fn workflows_record_progress(
    dir: String,
    update: Update,
) -> Result<ProgressFile, String> {
    tokio::task::spawn_blocking(move || {
        let dir = PathBuf::from(dir);
        if !dir.is_absolute() || !dir.is_dir() {
            return Err(format!("{}: not a folder", dir.display()));
        }
        progress::record(&dir, &update)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Relative paths of the files under each of `dirs` ("" is `root` itself), for the gates.
#[tauri::command]
pub async fn workflows_list_files(root: String, dirs: Vec<String>) -> Vec<String> {
    tokio::task::spawn_blocking(move || {
        let root = PathBuf::from(root);
        if !root.is_absolute() {
            return Vec::new();
        }
        progress::list_files(&root, &dirs)
    })
    .await
    .unwrap_or_default()
}
