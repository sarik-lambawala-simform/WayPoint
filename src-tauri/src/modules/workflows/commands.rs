use super::workflow::{shipped_workflow, Workflow};

#[tauri::command]
pub fn workflows_shipped() -> Result<Workflow, String> {
    shipped_workflow()
}
