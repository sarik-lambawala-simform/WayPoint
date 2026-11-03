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
- `plugins.updater` keeps `tauri-plugin-updater` in the build with an empty `pubkey` and no `endpoints`.

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
