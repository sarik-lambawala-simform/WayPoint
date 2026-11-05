import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import { canStart } from "./lib/stageCommand";

type Props = {
  stageName: string;
  /** The stage's command, e.g. `/grill-with-docs`; the words go after it. */
  command: string;
  /** `required` keeps Start disabled until there are words. */
  ask: "required" | "optional" | null | undefined;
  /** "Start" or "Run" (an unattended stage). */
  verb: string;
  /** The words of the stage's last run, offered again on a re-run. */
  initial?: string;
  onStart: (words: string) => void;
  /** A re-run can be called off; a first start has nothing to go back to. */
  onCancel?: () => void;
  children?: React.ReactNode;
};

/**
 * Asks for the user's words before a stage's claude starts. They are sent with the stage's command
 * as claude's first message, so the skill never runs ahead of them. Enter starts, Shift+Enter is a
 * newline.
 */
export function StageComposer({
  stageName,
  command,
  ask,
  verb,
  initial = "",
  onStart,
  onCancel,
  children,
}: Props) {
  const [words, setWords] = useState(initial);
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  // Focus on mount: on a re-run the stage's terminal is behind this, and keys must not reach it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  const required = ask === "required";
  const ok = canStart(ask, words);
  const has = words.trim().length > 0;
  const start = () => ok && onStart(words);
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6">
      <div className="flex w-full max-w-xl flex-col gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {required ? (
            "What's this feature about?"
          ) : (
            <>
              Anything to add for {stageName}?{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </>
          )}
        </label>
        <Textarea
          id={id}
          ref={ref}
          rows={required ? 4 : 2}
          value={words}
          placeholder={
            required
              ? "e.g. creating a get user API"
              : "Leave empty to run it as is"
          }
          onChange={(e) => setWords(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && onCancel) {
              e.preventDefault();
              onCancel();
            } else if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              start();
            }
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="min-w-0 truncate">
            Sent to claude as{" "}
            <code className="rounded bg-muted px-1 font-mono">
              {command}
              {required || has ? " …" : ""}
            </code>
          </span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Kbd>Enter</Kbd> {verb.toLowerCase()}
              <Kbd>Shift+Enter</Kbd> newline
            </span>
            {onCancel && (
              <Button size="sm" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              disabled={!ok}
              title={ok ? undefined : "Say what the feature is about first"}
              onClick={start}
            >
              {verb} {stageName}
              {!required && has ? " with note" : ""}
            </Button>
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
