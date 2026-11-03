use std::path::PathBuf;

use super::catalog::{build_catalog, user_workflows_dir, Catalog};
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
