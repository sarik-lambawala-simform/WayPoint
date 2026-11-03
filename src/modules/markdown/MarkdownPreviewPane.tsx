import { MarkdownCode } from "@/components/ai-elements/markdown-code";
import { cn } from "@/lib/utils";
import { currentWorkspaceEnv } from "@/modules/workspace";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { listenFsChanged } from "@/modules/explorer/lib/watch"; // fork
import { fsChangeTouches } from "./lib/markdownLinks"; // fork
import { MarkdownLink, type MarkdownLinkProps } from "./MarkdownLink";
import { MarkdownViewToggle } from "./MarkdownViewToggle";

type ReadResult =
  | { kind: "text"; content: string; size: number }
  | { kind: "binary"; size: number }
  | { kind: "toolarge"; size: number; limit: number };

type Status =
  | { kind: "loading" }
  | { kind: "ready"; content: string }
  | { kind: "binary" }
  | { kind: "toolarge"; size: number; limit: number }
  | { kind: "error"; message: string };

type Props = {
  path: string;
  visible: boolean;
  onSetView: (mode: "rendered" | "raw") => void;
  onOpenMarkdown?: (path: string) => void; // fork
};


export function MarkdownPreviewPane({
  path,
  visible,
  onSetView,
  onOpenMarkdown, // fork
}: Props) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  // fork: bumped when the file changes on disk.
  const [reloadTick, setReloadTick] = useState(0);
  const components = useMemo(
    () => ({
      a: (props: MarkdownLinkProps) => (
        <MarkdownLink
          {...props}
          currentPath={path}
          onOpenMarkdown={onOpenMarkdown}
        />
      ),
      code: MarkdownCode,
    }),
    [path, onOpenMarkdown],
  );

  // fork: reload when the file changes on disk. The old content stays on
  // screen until the new content lands, so the scroll position is kept.
  useEffect(() => {
    let alive = true;
    let unlisten: (() => void) | undefined;
    void listenFsChanged((paths) => {
      if (fsChangeTouches(paths, path)) setReloadTick((n) => n + 1);
    }).then((un) => {
      if (alive) unlisten = un;
      else un();
    });
    return () => {
      alive = false;
      unlisten?.();
    };
  }, [path]);

  useEffect(() => {
    setStatus({ kind: "loading" });
  }, [path]);

  useEffect(() => {
    let cancelled = false;
    invoke<ReadResult>("fs_read_file", {
      path,
      workspace: currentWorkspaceEnv(),
    })
      .then((res) => {
        if (cancelled) return;
        if (res.kind === "text") {
          setStatus({ kind: "ready", content: res.content });
        } else if (res.kind === "binary") {
          setStatus({ kind: "binary" });
        } else {
          setStatus({ kind: "toolarge", size: res.size, limit: res.limit });
        }
      })
      .catch((e) => {
        // fork: a failed re-read (a save mid-rename) keeps the content shown.
        if (!cancelled)
          setStatus((s) =>
            s.kind === "ready" && reloadTick > 0
              ? s
              : { kind: "error", message: String(e) },
          );
      });
    return () => {
      cancelled = true;
    };
  }, [path, reloadTick]);

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden bg-background",
        !visible && "pointer-events-none",
      )}
    >
      <MarkdownViewToggle mode="rendered" onChange={onSetView} />
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6">
          {status.kind === "loading" && (
            <p className="text-[12px] text-muted-foreground">Loading…</p>
          )}
          {status.kind === "error" && (
            <p className="text-[12px] text-destructive">
              Failed to read file: {status.message}
            </p>
          )}
          {status.kind === "binary" && (
            <p className="text-[12px] text-muted-foreground">
              Binary file — cannot render as markdown.
            </p>
          )}
          {status.kind === "toolarge" && (
            <p className="text-[12px] text-muted-foreground">
              File is {status.size} bytes; limit {status.limit}.
            </p>
          )}
          {status.kind === "ready" && (
            <Streamdown
              className="select-text [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={components}
              mode="static"
              parseIncompleteMarkdown={false}
            >
              {status.content}
            </Streamdown>
          )}
        </div>
      </div>
    </div>
  );
}
