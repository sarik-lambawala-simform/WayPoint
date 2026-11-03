# FORK.md

WayPoint is a fork of Terax (`crynta/terax-ai`), based on release tag `v0.9.0`. See
[CONTRIBUTING.md](CONTRIBUTING.md#syncing-with-upstream-terax) for how upstream is merged.

Edits to upstream files carry a `// fork:` marker (`# fork:` in YAML and TOML). JSON files cannot carry
comments, so their fork edits are listed here.

## `src-tauri/tauri.conf.json`

- `productName` is `WayPoint`; `mainBinaryName` is `waypoint` (so the binary never collides with Terax's).
- `identifier` is `com.simform.workflows` (free of the product name, so a rename never moves app data).
- Window `title` is `WayPoint`; `externalBin` is `binaries/wayp-cli`.
- `bundle.targets` is `appimage`, `deb`, `dmg`, `nsis` (no MSI, no rpm; the leftover `bundle.linux.rpm` block is inert); `createUpdaterArtifacts` is `false`.
- Copyright, publisher, descriptions and the file-association name are WayPoint's.
- `version` is `0.1.0` (WayPoint's own series; `package.json` and `Cargo.toml` match). `bundle.macOS.signingIdentity` is `"-"` (ad-hoc signing, no notarization).
- `plugins.updater` keeps `tauri-plugin-updater` in the build with an empty `pubkey` and no `endpoints`.

## `package.json`

- `version` is `0.1.0`.
- `@tauri-apps/plugin-dialog` is added (the folder picker of "Open repo").

## `src-tauri/capabilities/default.json`

- `dialog:allow-open` is added.

## Feature tab

Edits to upstream files are marked `// fork:`: `FeatureTab` and `planFeatureOpen`/`openFeatureTab` in
`src/modules/tabs/lib/useTabs.ts` (plus the label, the icon and the export), a layer in
`src/app/components/WorkspaceSurface.tsx`, three palette items in `src/modules/command-palette/commands.ts`,
and the wiring in `src/app/App.tsx` and `src-tauri/src/lib.rs` (dialog plugin, `workflows_shipped`, `workflows_catalog`).
`isSerializableTab` already returns false for unknown kinds, so Terax's tab saving skips feature tabs; the
`workflows` module saves and reopens them itself (`waypoint-features.json`). New Rust dependencies:
`serde_norway` (workflow files) and `tauri-plugin-dialog`. The shipped workflow is
`src-tauri/workflows/matt-pocock.yaml`, embedded in the binary and parsed by `modules/workflows`.
Progress: `modules/workflows/progress.rs` reads and writes `progress.yaml` (workflow, route, confirm and skip marks) and lists
files for the gates (`workflows_read_progress`, `workflows_record_progress`, `workflows_list_files`); the model is the pure
`lib/progress.ts`. `check.rs` runs a `check` gate's command (`workflows_run_check`, only from Next and Recheck) and
`workflows_build_tickets` feeds the `tickets` gate from the Rust ticket reader, and `map.rs` (`workflows_map_facts`) feeds the `map` gate
(`map.md`, open wayfinder tickets, `## Not yet specified`). A route is written to `progress.yaml` when picked (`route: ''` is a deliberate pick of the plain route);
with none written and a `map.md` in the folder, Wayfinder is inferred and written along with the user's first record. `WorkspaceSurface.tsx` and `App.tsx` pass the feature tab a title setter and an open-file handler.

## Stage terminals

`modules/workflows` hosts one terminal per started stage inside the feature tab (`StageTerminalHost`, `useStageTerminals`), built on the
launcher pattern: `TerminalPane` in the repo root, `whenSessionReady`, then `writeToSession(line + "\r")`. The command lines and the
typed text are the pure `lib/stageCommand.ts`; the terminal model and the session-id store (`waypoint-stage-sessions.json` in the app
data folder, keyed by feature folder and stage) are `lib/stageTerminals.ts`. Stage terminals are not tabs, so Terax's tab saving never
sees them; their leaf ids start at 2^30 so they cannot collide with a tab's. Each stack of stage panes carries its own
`data-terminal-stack` / `data-terminal-area`, so the WebGPU renderer gives it a canvas. The live dot is a `●` in the feature tab's title
and a dot on the stage cell, from `useAgentActivityStore`; no upstream file changed for it.

## `.github/workflows/release.yml`

- `create-release` makes the draft release and reads the upstream tag from the "based on release tag" line at the top of this file, so keep that sentence's wording.

## `ralph/`

The Ralph loop's engine, moved from the Ralph UI repo: `run-ralph-tickets.sh`, `lib/tickets.sh`, and the
script's tests (`ralph/tests`, run by the `ralph-script` CI job on Linux and macOS). `tauri.conf.json`
lists both scripts under `bundle.resources` (`ralph/run-ralph-tickets.sh`, `ralph/lib/tickets.sh`). New in
the script: a `heartbeat` file in the run folder, touched every 5 s (`RALPH_HEARTBEAT_SECS` in tests).
`.gitattributes` sets `eol=lf` for shell scripts and ticket files.

The ticket reader is ported to Rust in `src-tauri/src/modules/ralph/tickets.rs` (new dependency: `regex`).
`src-tauri/tests/ralph_tickets_agree.rs` runs `lib/tickets.sh` over the 24 fixture folders in
`ralph/tests/fixtures/memark-tickets` (301 tickets, copied from the Ralph UI repo) and compares the
six-column rows; it runs on Linux and macOS CI, while Windows CI runs the reader's unit tests.

## `src-tauri/tauri.windows.conf.json`

- Window `title` is `WayPoint`; the `wix` (MSI) version block is removed.

## Renames

- Keychain service `terax-ai` -> `waypoint` (`src/modules/ai/config.ts`).
- Control file `terax/control.json` -> `waypoint/control.json` (`control.rs`, `wayp-cli`).
- CLI `terax` -> `wayp`, sidecar `terax-cli` -> `wayp-cli` (crate `src-tauri/crates/wayp-cli`).
- Kept: `TERAX_*` env vars, the `notify;Terax;` OSC marker, hook commands, module and crate names
  (`terax-control-protocol`), `TERAX.md`.

## Placeholder mark

`branding/waypoint-mark.svg` is a placeholder. The icons were generated with
`pnpm tauri icon branding/waypoint-mark.svg -o src-tauri/icons`; `public/logo.png` is a copy of the 256 px icon.

## Deleted upstream files

`flake.nix`, `flake.lock`, `nix/`, `.github/workflows/update-nix-sources.yml`,
`.github/workflows/signpath-test.yml`, `terax-icon.png`.

## Known coexistence hazard

Agent hook installs (`agent.rs`) write `__terax_notify` hooks into shared user config
(`~/.claude`, Pi extension). Both apps rewrite the same entries to their own executable; the spec keeps the
hook commands unchanged, so this is left for a later ticket.
