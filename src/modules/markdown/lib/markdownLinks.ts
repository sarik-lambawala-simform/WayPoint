// fork: pure helpers for the markdown tab (relative `.md` links, reload on disk change).

const MD_EXT = /\.(?:md|markdown|mdx)$/i;

/**
 * Resolves a relative `.md` link against the folder of the file that holds it.
 * Returns null for anything else: external URLs, in-page anchors, absolute
 * paths and non-markdown targets. A `#fragment` or `?query` is dropped.
 */
export function resolveMarkdownLink(
  href: string | undefined,
  currentPath: string,
): string | null {
  if (!href || href.startsWith("#") || href.startsWith("//")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return null;
  let target = href.replace(/[?#].*$/, "");
  try {
    target = decodeURIComponent(target);
  } catch {
    return null;
  }
  if (!target || target.startsWith("/") || !MD_EXT.test(target)) return null;

  const backslash = currentPath.includes("\\") && !currentPath.includes("/");
  const sep = backslash ? "\\" : "/";
  const base = currentPath.replace(/\\/g, "/").split("/");
  base.pop();
  const root = base[0] === "" || /^[a-z]:$/i.test(base[0] ?? "");
  const parts = [...base];
  for (const seg of target.replace(/\\/g, "/").split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      // Never climb above the root of the current file.
      if (parts.length > (root ? 1 : 0)) parts.pop();
      continue;
    }
    parts.push(seg);
  }
  return parts.join(sep);
}

/** True when an `fs:changed` batch names this file. */
export function fsChangeTouches(paths: string[], filePath: string): boolean {
  const want = filePath.replace(/\\/g, "/");
  return paths.some((p) => p.replace(/\\/g, "/") === want);
}
