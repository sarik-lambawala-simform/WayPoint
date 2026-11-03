//! A workflow file's stage list. This is the minimum the stage bar needs; the full loader (every
//! field, routes, load errors with line numbers, user and repo files) replaces it later.

use serde::{Deserialize, Serialize};

/// The shipped default, embedded so it travels inside the app binary.
const SHIPPED_MATT_POCOCK: &str = include_str!("../../../workflows/matt-pocock.yaml");

pub const SHIPPED_ID: &str = "matt-pocock";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Stage {
    pub name: String,
    #[serde(default)]
    pub skill: Option<String>,
    #[serde(default)]
    pub run: Option<String>,
    #[serde(default)]
    pub optional: bool,
    #[serde(default)]
    pub scope: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Workflow {
    #[serde(default)]
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub description: String,
    pub stages: Vec<Stage>,
}

/// Parses a workflow file. `id` is the file stem.
pub fn parse_workflow(id: &str, yaml: &str) -> Result<Workflow, String> {
    let mut workflow: Workflow = serde_norway::from_str(yaml).map_err(|e| e.to_string())?;
    workflow.id = id.to_string();
    if workflow.stages.is_empty() {
        return Err("a workflow needs at least one stage".into());
    }
    Ok(workflow)
}

pub fn shipped_workflow() -> Result<Workflow, String> {
    parse_workflow(SHIPPED_ID, SHIPPED_MATT_POCOCK)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shipped_default_lists_the_stages_in_order() {
        let w = shipped_workflow().unwrap();
        assert_eq!(w.id, "matt-pocock");
        assert_eq!(w.title, "Matt Pocock");
        let names: Vec<&str> = w.stages.iter().map(|s| s.name.as_str()).collect();
        assert_eq!(
            names,
            [
                "Setup",
                "Grill",
                "Prototype",
                "Spec",
                "Tickets",
                "Loop",
                "Retro"
            ]
        );
    }

    #[test]
    fn shipped_default_carries_stage_kinds() {
        let w = shipped_workflow().unwrap();
        let by = |n: &str| w.stages.iter().find(|s| s.name == n).unwrap();
        assert_eq!(by("Setup").scope.as_deref(), Some("repo"));
        assert_eq!(by("Loop").run.as_deref(), Some("loop"));
        assert!(by("Prototype").optional);
        assert!(by("Retro").optional);
        assert!(!by("Grill").optional);
    }

    #[test]
    fn rejects_empty_and_malformed_files() {
        assert!(parse_workflow("x", "title: T\nstages: []\n").is_err());
        assert!(parse_workflow("x", "title: [").is_err());
    }
}
