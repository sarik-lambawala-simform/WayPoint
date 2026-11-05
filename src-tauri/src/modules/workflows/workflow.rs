//! A workflow file: the full schema, substitution, and load errors that name the file and line.
//!
//! Pure functions over text; the folder lookup is in `catalog.rs`.

use std::collections::{BTreeMap, HashSet};
use std::fmt;

use serde::{Deserialize, Serialize};

/// The shipped default, embedded so it travels inside the app binary.
const SHIPPED_MATT_POCOCK: &str = include_str!("../../../workflows/matt-pocock.yaml");

pub const SHIPPED_ID: &str = "matt-pocock";
/// What a load error calls the embedded file.
pub const SHIPPED_FILE: &str = "matt-pocock.yaml (shipped)";

/// The only placeholders a workflow file may use.
const PLACEHOLDERS: [&str; 2] = ["feature", "workflow_dir"];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Mode {
    #[default]
    Interactive,
    Unattended,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Session {
    Continue,
    #[default]
    Fresh,
}

/// Whether starting the stage asks the user for words to send with its command. `required`
/// keeps Start disabled until there are some; `optional` (the default) starts without them.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Ask {
    Required,
    #[default]
    Optional,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Scope {
    Repo,
}

/// `confirm`, `tickets`, `map`, or `check: "<shell>"`. Left out means "every `produces` entry
/// matches a file".
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase", try_from = "RawDoneWhen")]
pub enum DoneWhen {
    Confirm,
    Tickets,
    Map,
    Check(String),
}

/// How `done_when` is written in YAML. `serde_norway` reads a derived enum's `Check` as a
/// `!check` tag, not the `check:` map the files use, so the file shape is read here.
#[derive(Deserialize)]
#[serde(untagged)]
enum RawDoneWhen {
    Word(String),
    Check(CheckDoneWhen),
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct CheckDoneWhen {
    check: String,
}

impl TryFrom<RawDoneWhen> for DoneWhen {
    type Error = String;

    fn try_from(raw: RawDoneWhen) -> Result<Self, String> {
        match raw {
            RawDoneWhen::Word(w) => match w.as_str() {
                "confirm" => Ok(Self::Confirm),
                "tickets" => Ok(Self::Tickets),
                "map" => Ok(Self::Map),
                _ => Err(format!(
                    "unknown done_when `{w}`, expected confirm, tickets, map or check: \"<shell>\""
                )),
            },
            RawDoneWhen::Check(c) => Ok(Self::Check(c.check)),
        }
    }
}

/// Fields a route may override on a stage. Everything but `run` and `routes`.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RouteOverride {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub skill: Option<String>,
    #[serde(default)]
    pub prompt: Option<String>,
    #[serde(default)]
    pub args: Option<String>,
    #[serde(default)]
    pub mode: Option<Mode>,
    #[serde(default)]
    pub ask: Option<Ask>,
    #[serde(default)]
    pub session: Option<Session>,
    #[serde(default)]
    pub produces: Option<Vec<String>>,
    #[serde(default)]
    pub done_when: Option<DoneWhen>,
    #[serde(default)]
    pub optional: Option<bool>,
    #[serde(default)]
    pub scope: Option<Scope>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Stage {
    pub name: String,
    #[serde(default)]
    pub skill: Option<String>,
    #[serde(default)]
    pub prompt: Option<String>,
    #[serde(default)]
    pub run: Option<String>,
    #[serde(default)]
    pub args: Option<String>,
    #[serde(default)]
    pub mode: Mode,
    #[serde(default)]
    pub ask: Ask,
    #[serde(default)]
    pub session: Option<Session>,
    #[serde(default)]
    pub produces: Vec<String>,
    #[serde(default)]
    pub done_when: Option<DoneWhen>,
    #[serde(default)]
    pub optional: bool,
    #[serde(default)]
    pub scope: Option<Scope>,
    #[serde(default)]
    pub routes: BTreeMap<String, RouteOverride>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Workflow {
    /// The file stem; filled in by the loader, never read from the file.
    #[serde(default, skip_deserializing)]
    pub id: String,
    pub version: u32,
    pub title: String,
    #[serde(default)]
    pub description: String,
    pub stages: Vec<Stage>,
}

/// A load error: which file, which line (1-based), what is wrong.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LoadError {
    pub file: String,
    pub line: usize,
    pub message: String,
}

impl fmt::Display for LoadError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{}: {}", self.file, self.line, self.message)
    }
}

/// The names `{{ x }}` refers to in `text`, in order. An unclosed `{{` is plain text.
fn placeholders(text: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut rest = text;
    while let Some(start) = rest.find("{{") {
        let after = &rest[start + 2..];
        let Some(end) = after.find("}}") else { break };
        out.push(after[..end].trim().to_string());
        rest = &after[end + 2..];
    }
    out
}

/// Values for the two placeholders.
pub struct Vars<'a> {
    /// The feature folder, relative to the repo root.
    pub feature: &'a str,
    /// The folder holding the workflow file.
    pub workflow_dir: &'a str,
}

/// Replaces `{{ feature }}` and `{{ workflow_dir }}`. Anything else is left as written (the
/// loader rejects unknown names before this runs).
pub fn substitute(text: &str, vars: &Vars) -> String {
    let mut out = String::with_capacity(text.len());
    let mut rest = text;
    while let Some(start) = rest.find("{{") {
        let after = &rest[start + 2..];
        let Some(end) = after.find("}}") else { break };
        out.push_str(&rest[..start]);
        match after[..end].trim() {
            "feature" => out.push_str(vars.feature),
            "workflow_dir" => out.push_str(vars.workflow_dir),
            _ => out.push_str(&rest[start..start + 2 + end + 2]),
        }
        rest = &after[end + 2..];
    }
    out.push_str(rest);
    out
}

/// Every string of a stage or override that substitution applies to.
fn substituted_fields<'a>(
    args: &'a Option<String>,
    prompt: &'a Option<String>,
    produces: &'a [String],
    done_when: &'a Option<DoneWhen>,
) -> Vec<&'a str> {
    let mut out: Vec<&str> = Vec::new();
    out.extend(args.as_deref());
    out.extend(prompt.as_deref());
    out.extend(produces.iter().map(String::as_str));
    if let Some(DoneWhen::Check(cmd)) = done_when {
        out.push(cmd);
    }
    out
}

fn is_blank_or_comment(line: &str) -> bool {
    let t = line.trim();
    t.is_empty() || t.starts_with('#')
}

fn indent_of(line: &str) -> usize {
    line.len() - line.trim_start().len()
}

/// The 1-based line each stage starts on (block-style `stages:` list). Empty when the list is not
/// written that way; callers fall back to the `stages:` line.
fn stage_start_lines(src: &str) -> (usize, Vec<usize>) {
    let lines: Vec<&str> = src.lines().collect();
    let Some(head) = lines
        .iter()
        .position(|l| indent_of(l) == 0 && l.trim_start().starts_with("stages:"))
    else {
        return (1, Vec::new());
    };
    let mut item_indent = None;
    let mut starts = Vec::new();
    for (i, line) in lines.iter().enumerate().skip(head + 1) {
        if is_blank_or_comment(line) {
            continue;
        }
        let indent = indent_of(line);
        let is_item = line.trim_start().starts_with('-');
        match item_indent {
            None if is_item => {
                item_indent = Some(indent);
                starts.push(i + 1);
            }
            Some(n) if indent == n && is_item => starts.push(i + 1),
            Some(n) if indent <= n => break,
            None => break,
            _ => {}
        }
    }
    (head + 1, starts)
}

/// The line holding `needle` within a stage's lines, else the stage's first line.
fn line_of_text(src: &str, from: usize, to: usize, needle: &str) -> usize {
    src.lines()
        .enumerate()
        .skip(from - 1)
        .take(to + 1 - from)
        .find(|(_, l)| l.contains(needle))
        .map_or(from, |(i, _)| i + 1)
}

fn err(file: &str, line: usize, message: impl Into<String>) -> LoadError {
    LoadError {
        file: file.to_string(),
        line,
        message: message.into(),
    }
}

fn from_yaml_error(file: &str, e: serde_norway::Error) -> LoadError {
    let line = e.location().map_or(1, |l| l.line());
    let text = e.to_string();
    let message = match text.rfind(" at line ") {
        Some(i) if e.location().is_some() => text[..i].to_string(),
        _ => text,
    };
    err(file, line, message)
}

/// Parses and checks a workflow file. `id` is the file stem, `file` is what errors call it.
pub fn parse_workflow(id: &str, file: &str, yaml: &str) -> Result<Workflow, LoadError> {
    let mut workflow: Workflow =
        serde_norway::from_str(yaml).map_err(|e| from_yaml_error(file, e))?;
    workflow.id = id.to_string();
    validate(file, yaml, &workflow)?;
    Ok(workflow)
}

fn validate(file: &str, src: &str, w: &Workflow) -> Result<(), LoadError> {
    let total_lines = src.lines().count().max(1);
    let (stages_line, starts) = stage_start_lines(src);
    let start_of = |i: usize| starts.get(i).copied().unwrap_or(stages_line);
    let end_of = |i: usize| match starts.get(i + 1) {
        Some(next) => next - 1,
        None => total_lines,
    };

    if w.version != 1 {
        let line = line_of_text(src, 1, total_lines, "version");
        return Err(err(
            file,
            line,
            format!(
                "unsupported version {}; this app reads version 1",
                w.version
            ),
        ));
    }
    if w.stages.is_empty() {
        return Err(err(
            file,
            stages_line,
            "a workflow needs at least one stage",
        ));
    }

    let mut names = HashSet::new();
    for (i, stage) in w.stages.iter().enumerate() {
        let first = start_of(i);
        let last = end_of(i).max(first);
        if !names.insert(stage.name.as_str()) {
            let line = line_of_text(src, first, last, &format!("name: {}", stage.name));
            return Err(err(
                file,
                line,
                format!("two stages are named `{}`", stage.name),
            ));
        }

        let kinds = [
            stage.skill.is_some(),
            stage.prompt.is_some(),
            stage.run.is_some(),
        ];
        let count = kinds.iter().filter(|k| **k).count();
        if count != 1 {
            return Err(err(
                file,
                first,
                format!(
                    "stage `{}` needs exactly one of `skill`, `prompt` or `run`, found {count}",
                    stage.name
                ),
            ));
        }
        if let Some(run) = &stage.run {
            if run != "loop" {
                let line = line_of_text(src, first, last, "run:");
                return Err(err(
                    file,
                    line,
                    format!("`run: {run}` is not known; the only value is `loop`"),
                ));
            }
            if stage.session.is_some() {
                let line = line_of_text(src, first, last, "session:");
                return Err(err(
                    file,
                    line,
                    format!(
                        "stage `{}` runs the loop and takes no `session`",
                        stage.name
                    ),
                ));
            }
        }

        let mut texts = substituted_fields(
            &stage.args,
            &stage.prompt,
            &stage.produces,
            &stage.done_when,
        );
        for (route, o) in &stage.routes {
            if stage.run.is_some()
                && (o.skill.is_some() || o.prompt.is_some() || o.session.is_some())
            {
                return Err(err(
                    file,
                    line_of_text(src, first, last, route),
                    format!(
                        "route `{route}` of the loop stage `{}` cannot set `skill`, `prompt` or `session`",
                        stage.name
                    ),
                ));
            }
            if o.skill.is_some() && o.prompt.is_some() {
                return Err(err(
                    file,
                    line_of_text(src, first, last, route),
                    format!("route `{route}` sets both `skill` and `prompt`"),
                ));
            }
            texts.extend(substituted_fields(
                &o.args,
                &o.prompt,
                o.produces.as_deref().unwrap_or(&[]),
                &o.done_when,
            ));
        }
        for text in texts {
            for name in placeholders(text) {
                if !PLACEHOLDERS.contains(&name.as_str()) {
                    let line = src
                        .lines()
                        .enumerate()
                        .skip(first - 1)
                        .take(last + 1 - first)
                        .find(|(_, l)| placeholders(l).contains(&name))
                        .map_or(first, |(i, _)| i + 1);
                    return Err(err(
                        file,
                        line,
                        format!(
                            "unknown placeholder `{{{{ {name} }}}}`; only `{{{{ feature }}}}` and `{{{{ workflow_dir }}}}` exist"
                        ),
                    ));
                }
            }
        }
    }
    Ok(())
}

pub fn shipped_workflow() -> Result<Workflow, LoadError> {
    parse_workflow(SHIPPED_ID, SHIPPED_FILE, SHIPPED_MATT_POCOCK)
}

/// The shipped file's text, for the catalog to list.
pub fn shipped_source() -> &'static str {
    SHIPPED_MATT_POCOCK
}

#[cfg(test)]
mod tests {
    use super::*;

    const FIXTURES: &str = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/src/modules/workflows/fixtures"
    );

    fn load_fixture(rel: &str) -> Result<Workflow, LoadError> {
        let path = format!("{FIXTURES}/{rel}");
        let text = std::fs::read_to_string(&path).unwrap();
        let id = rel.rsplit('/').next().unwrap().split('.').next().unwrap();
        parse_workflow(id, rel, &text)
    }

    fn error_of(rel: &str) -> LoadError {
        load_fixture(rel).expect_err(rel)
    }

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
    fn shipped_default_carries_the_full_schema() {
        let w = shipped_workflow().unwrap();
        let by = |n: &str| w.stages.iter().find(|s| s.name == n).unwrap();
        assert_eq!(by("Setup").scope, Some(Scope::Repo));
        assert_eq!(by("Setup").produces, ["docs/agents/issue-tracker.md"]);
        assert_eq!(by("Loop").run.as_deref(), Some("loop"));
        assert!(by("Prototype").optional);
        assert_eq!(by("Prototype").session, Some(Session::Continue));
        assert_eq!(by("Tickets").done_when, Some(DoneWhen::Tickets));
        assert_eq!(by("Grill").done_when, Some(DoneWhen::Confirm));
        let way = &by("Grill").routes["wayfinder"];
        assert_eq!(way.name.as_deref(), Some("Wayfinder"));
        assert_eq!(way.done_when, Some(DoneWhen::Map));
        assert_eq!(way.args.as_deref(), Some("{{ feature }}"));
        let spec = &by("Spec").routes["wayfinder"];
        assert_eq!(spec.session, Some(Session::Fresh));
        assert_eq!(spec.args.as_deref(), Some("{{ feature }}/map.md"));
        assert_eq!(by("Grill").mode, Mode::Interactive);
        assert_eq!(by("Grill").ask, Ask::Required);
        assert_eq!(by("Spec").ask, Ask::Optional);
    }

    #[test]
    fn every_schema_field_loads() {
        let w = load_fixture("full.yaml").unwrap();
        let plan = &w.stages[0];
        assert_eq!(plan.mode, Mode::Unattended);
        assert_eq!(plan.session, Some(Session::Continue));
        assert_eq!(plan.produces.len(), 2);
        assert_eq!(
            plan.done_when,
            Some(DoneWhen::Check("test -f {{ workflow_dir }}/ok".into()))
        );
        assert_eq!(
            plan.routes["fast"].prompt.as_deref(),
            Some("go {{ feature }}")
        );
        assert_eq!(w.stages[1].prompt.as_deref(), Some("hello {{ feature }}"));
        assert_eq!(w.description, "Every field.");
    }

    #[test]
    fn substitutes_the_two_names_and_nothing_else() {
        let vars = Vars {
            feature: ".scratch/login",
            workflow_dir: "/home/u/.config/waypoint/workflows",
        };
        assert_eq!(
            substitute("{{ feature }}/map.md and {{workflow_dir}}/x", &vars),
            ".scratch/login/map.md and /home/u/.config/waypoint/workflows/x"
        );
        assert_eq!(
            substitute("{{ other }} {{ feature", &vars),
            "{{ other }} {{ feature"
        );
    }

    #[test]
    fn an_unknown_key_names_the_file_and_line() {
        let e = error_of("errors/unknown-key.yaml");
        assert_eq!(e.file, "errors/unknown-key.yaml");
        assert_eq!(e.line, 6);
        assert!(e.message.contains("colour"), "{e}");
    }

    #[test]
    fn an_unknown_route_key_is_an_error() {
        let e = error_of("errors/unknown-route-key.yaml");
        assert_eq!(e.line, 8);
        assert!(e.message.contains("colour"), "{e}");
    }

    #[test]
    fn an_unknown_placeholder_names_its_line() {
        let e = error_of("errors/unknown-placeholder.yaml");
        assert_eq!(e.line, 10);
        assert!(e.message.contains("{{ repo }}"), "{e}");
    }

    #[test]
    fn two_stages_with_the_same_name_name_the_second() {
        let e = error_of("errors/duplicate-name.yaml");
        assert_eq!(e.line, 6);
        assert!(e.message.contains("One"), "{e}");
    }

    #[test]
    fn a_stage_needs_exactly_one_of_skill_prompt_run() {
        let none = error_of("errors/no-kind.yaml");
        assert_eq!(none.line, 6);
        assert!(none.message.contains("Two"), "{none}");
        let two = error_of("errors/two-kinds.yaml");
        assert_eq!(two.line, 4);
        assert!(two.message.contains("exactly one"), "{two}");
    }

    #[test]
    fn a_loop_stage_takes_no_skill_prompt_or_session() {
        let skill = error_of("errors/loop-with-skill.yaml");
        assert_eq!(skill.line, 4);
        let session = error_of("errors/loop-with-session.yaml");
        assert_eq!(session.line, 8);
        assert!(session.message.contains("session"), "{session}");
    }

    #[test]
    fn a_bad_enum_value_names_its_line() {
        let e = error_of("errors/bad-mode.yaml");
        assert_eq!(e.line, 6);
    }

    #[test]
    fn done_when_reads_a_word_or_a_check_map_and_names_an_unknown_word() {
        let stage = |done: &str| {
            format!(
                "version: 1\ntitle: T\nstages:\n  - name: A\n    skill: a\n    done_when: {done}\n"
            )
        };
        let w = parse_workflow("x", "x.yaml", &stage("{ check: \"true\" }")).unwrap();
        assert_eq!(w.stages[0].done_when, Some(DoneWhen::Check("true".into())));
        let e = parse_workflow("x", "x.yaml", &stage("sometimes")).unwrap_err();
        assert!(
            e.message.contains("unknown done_when `sometimes`"),
            "{}",
            e.message
        );
        assert!(parse_workflow("x", "x.yaml", &stage("{ check: a, extra: b }")).is_err());
    }

    #[test]
    fn ask_defaults_to_optional_reads_required_and_names_an_unknown_word() {
        let stage = |ask: &str| {
            format!("version: 1\ntitle: T\nstages:\n  - name: A\n    skill: a\n{ask}")
        };
        let w = parse_workflow("x", "x.yaml", &stage("")).unwrap();
        assert_eq!(w.stages[0].ask, Ask::Optional);
        let w = parse_workflow("x", "x.yaml", &stage("    ask: required\n")).unwrap();
        assert_eq!(w.stages[0].ask, Ask::Required);
        assert_eq!(serde_json::to_string(&Ask::Required).unwrap(), "\"required\"");
        let routed = stage("    routes:\n      r: { ask: required }\n");
        let w = parse_workflow("x", "x.yaml", &routed).unwrap();
        assert_eq!(w.stages[0].routes["r"].ask, Some(Ask::Required));
        assert!(parse_workflow("x", "x.yaml", &stage("    ask: always\n")).is_err());
    }

    #[test]
    fn done_when_serializes_to_the_shape_the_frontend_reads() {
        let json = |d: DoneWhen| serde_json::to_string(&d).unwrap();
        assert_eq!(json(DoneWhen::Confirm), "\"confirm\"");
        assert_eq!(json(DoneWhen::Check("t".into())), "{\"check\":\"t\"}");
    }

    #[test]
    fn rejects_empty_malformed_and_versionless_files() {
        assert!(parse_workflow("x", "x.yaml", "version: 1\ntitle: T\nstages: []\n").is_err());
        assert!(parse_workflow("x", "x.yaml", "title: [").is_err());
        assert!(parse_workflow("x", "x.yaml", "title: T\nstages: []\n").is_err());
        let v2 = parse_workflow(
            "x",
            "x.yaml",
            "version: 2\ntitle: T\nstages:\n  - name: A\n    skill: a\n",
        )
        .unwrap_err();
        assert_eq!(v2.line, 1);
    }

    #[test]
    fn display_is_file_colon_line() {
        let e = error_of("errors/unknown-key.yaml");
        assert!(
            e.to_string().starts_with("errors/unknown-key.yaml:6: "),
            "{e}"
        );
    }
}
