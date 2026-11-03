// Windows runs a workflow's stages inside the space's WSL distro. Everything here is pure: path
// conversion, what the distro check printed, the install lines and the notices. The Linux path is
// a repo's identity; the host path (`\\wsl.localhost\<distro>\...`) exists only to read files.

/** The tools a stage needs inside the distro, in the order `command -v` is asked. */
export const REQUIRED_TOOLS = ["jq", "git", "curl", "claude"] as const;
export type Tool = (typeof REQUIRED_TOOLS)[number];

/** True for `/mnt/<drive>` and anything under it: Windows storage seen from the distro. */
export function isMntPath(linuxPath: string): boolean {
  return /^\/mnt\/[a-zA-Z](\/|$)/.test(linuxPath);
}

/**
 * Where Windows reads a Linux path of `distro`: `\\wsl.localhost\<distro>\a\b`, or the drive path
 * (`C:\a\b`) for `/mnt/<drive>/...`, which the share refuses to serve.
 */
export function wslHostPath(distro: string, linuxPath: string): string {
  const slashed = linuxPath.replace(/\\/g, "/");
  if (isMntPath(slashed)) {
    const [, drive, rest = ""] = /^\/mnt\/([a-zA-Z])\/?(.*)$/.exec(slashed)!;
    return `${drive.toUpperCase()}:\\${rest.replace(/\//g, "\\")}`;
  }
  const tail = slashed.replace(/^\/+/, "").replace(/\/+$/, "");
  const root = `\\\\wsl.localhost\\${distro}`;
  return tail ? `${root}\\${tail.replace(/\//g, "\\")}` : `${root}\\`;
}

/** The Linux path behind a host path of `distro`, or null when the path is not one of its. */
export function linuxPathOfHost(
  distro: string,
  hostPath: string,
): string | null {
  const slashed = hostPath.replace(/\\/g, "/");
  const drive = /^([a-zA-Z]):(\/(.*))?$/.exec(slashed);
  if (drive)
    return `/mnt/${drive[1].toLowerCase()}${drive[3] ? `/${drive[3]}` : ""}`;
  for (const prefix of [`//wsl.localhost/${distro}`, `//wsl$/${distro}`]) {
    if (slashed === prefix || slashed.startsWith(`${prefix}/`)) {
      const rest = slashed.slice(prefix.length).replace(/\/+$/, "");
      return rest || "/";
    }
  }
  return null;
}

/** The tools of `REQUIRED_TOOLS` that `command -v jq git curl claude` did not print a path for. */
export function missingTools(output: string): Tool[] {
  const found = new Set(
    output
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.slice(l.lastIndexOf("/") + 1)),
  );
  return REQUIRED_TOOLS.filter((t) => !found.has(t));
}

/** The exact command to install a missing tool in the distro; the app never runs it. */
export function installCommand(tool: Tool): string {
  switch (tool) {
    case "claude":
      return "curl -fsSL https://claude.ai/install.sh | bash";
    default:
      return `sudo apt-get install -y ${tool}`;
  }
}

export type MissingTool = { tool: Tool; install: string };

export function missingWithInstall(output: string): MissingTool[] {
  return missingTools(output).map((tool) => ({
    tool,
    install: installCommand(tool),
  }));
}

export const MNT_WARNING =
  "This repo is under /mnt: it is slow, and file changes may not be noticed. Moving it into the Linux file system is faster.";

/** The one-line warning for a repo under `/mnt/<drive>/`, or null. */
export function repoLocationWarning(linuxRoot: string): string | null {
  return isMntPath(linuxRoot) ? MNT_WARNING : null;
}
