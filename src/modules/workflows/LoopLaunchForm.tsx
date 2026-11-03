import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReactNode } from "react";
import {
  type BranchMode,
  type LaunchContext,
  type LaunchOptions,
  launchLine,
  optionProblems,
} from "./lib/loopLaunch";

type Props = {
  options: LaunchOptions;
  onChange: (next: LaunchOptions) => void;
  ctx: LaunchContext;
  /** Why starting is off (another feature's run, a failed start); null when it can start. */
  blocked: string | null;
  starting: boolean;
  onStart: () => void;
  onCancel: () => void;
};

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2 border-b border-border/40 pb-3">
      <legend className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 text-xs">
      <span className="w-40 shrink-0" title={hint}>
        {label}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {children}
        {error && <span className="text-destructive">{error}</span>}
      </span>
    </label>
  );
}

function Check({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs" title={hint}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

const BRANCHES: { id: BranchMode; label: string }[] = [
  { id: "new", label: "New branch" },
  { id: "current", label: "Current branch" },
  { id: "per-ticket", label: "A branch per ticket" },
];

/** The Loop's launch form: the script's flags in the Ralph UI's groups, with the exact command under it. */
export function LoopLaunchForm({
  options: o,
  onChange,
  ctx,
  blocked,
  starting,
  onStart,
  onCancel,
}: Props) {
  const set = <K extends keyof LaunchOptions>(k: K, v: LaunchOptions[K]) =>
    onChange({ ...o, [k]: v });
  const problems = optionProblems(o);
  const invalid = Object.keys(problems).length > 0;
  const text = (k: keyof LaunchOptions, placeholder?: string) => (
    <Input
      className="h-7 rounded-md text-xs"
      value={String(o[k])}
      placeholder={placeholder}
      aria-invalid={Boolean(problems[k])}
      onChange={(e) => set(k, e.target.value as never)}
    />
  );
  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="loop-launch">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <Group title="What to run">
          <Field
            label="Only tickets"
            hint="--only: run just these numbers; blockers still apply"
            error={problems.only}
          >
            {text("only", "all, or 1,3,5 or 2-10")}
          </Field>
          <Field
            label="Order"
            hint="--order: take these first, in the order written"
            error={problems.order}
          >
            {text("order", "board order, or 11,1,2")}
          </Field>
          <Field
            label="At most"
            hint="--max: stop after this many tickets"
            error={problems.max}
          >
            {text("max", "no limit")}
          </Field>
        </Group>
        <Group title="Branch">
          <div className="flex gap-3 text-xs">
            {BRANCHES.map((b) => (
              <label key={b.id} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="branch-mode"
                  checked={o.branchMode === b.id}
                  onChange={() => set("branchMode", b.id)}
                />
                {b.label}
              </label>
            ))}
          </div>
          {o.branchMode === "new" && (
            <Field label="Branch name" hint="--new-branch: empty derives one">
              {text("branchName", "derived from the feature")}
            </Field>
          )}
          {o.branchMode === "current" && (
            <Check
              label="Allow on develop, main or master"
              hint="--allow-protected"
              checked={o.allowProtected}
              onChange={(v) => set("allowProtected", v)}
            />
          )}
          {o.branchMode !== "current" && (
            <Field
              label="Cut from"
              hint="--base: default is what is checked out"
            >
              {text("base", "the current commit")}
            </Field>
          )}
          <Check
            label="Start with uncommitted work in the tree"
            hint="--allow-dirty"
            checked={o.allowDirty}
            onChange={(v) => set("allowDirty", v)}
          />
        </Group>
        <Group title="Model and quota">
          <Field label="Model" hint="--model: empty is what claude picks">
            {text("model", "claude's own choice")}
          </Field>
          <Check
            label="Wait for the quota to reset"
            hint="--wait-for-reset"
            checked={o.waitForReset}
            onChange={(v) => set("waitForReset", v)}
          />
          <Field
            label="Stop starting tickets at"
            hint="--quota-ceiling, 0 to 1"
            error={problems.quotaCeiling}
          >
            {text("quotaCeiling")}
          </Field>
          {ctx.caffeinate === "app" ? (
            <div className="flex items-center gap-3 text-xs">
              <span className="w-40 shrink-0">Sleep</span>
              <span className="text-muted-foreground">held by the app</span>
            </div>
          ) : (
            <Check
              label="Keep the machine awake (caffeinate)"
              hint="unchecked passes --no-caffeinate"
              checked={o.caffeinate}
              onChange={(v) => set("caffeinate", v)}
            />
          )}
        </Group>
        <Group title="Failures and network">
          <Check
            label="Keep going after a failed ticket"
            hint="--keep-going"
            checked={o.keepGoing}
            onChange={(v) => set("keepGoing", v)}
          />
          <Check
            label="Do not commit a failed ticket's partial work"
            hint="--no-wip-commit"
            checked={o.noWipCommit}
            onChange={(v) => set("noWipCommit", v)}
          />
          <Field
            label="Failures in a row"
            hint="--max-consecutive-failures"
            error={problems.maxConsecutiveFailures}
          >
            {text("maxConsecutiveFailures")}
          </Field>
          <Check
            label="Do not check the network before a ticket"
            hint="--no-network-check"
            checked={o.noNetworkCheck}
            onChange={(v) => set("noNetworkCheck", v)}
          />
          <Field
            label="Give up offline after (s)"
            hint="--network-wait: empty waits as long as it takes"
            error={problems.networkWait}
          >
            {text("networkWait", "no limit")}
          </Field>
          <Field
            label="Retries after an outage"
            hint="--network-retries"
            error={problems.networkRetries}
          >
            {text("networkRetries")}
          </Field>
        </Group>
      </div>
      <div className="flex shrink-0 flex-col gap-2 border-t border-border/60 px-3 py-2">
        <code
          className="break-all font-mono text-[11px] text-muted-foreground"
          data-testid="launch-line"
        >
          {launchLine(o, ctx)}
        </code>
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            disabled={invalid || starting || blocked !== null}
            title={blocked ?? undefined}
            onClick={onStart}
          >
            Start the loop
          </Button>
          <Button size="xs" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          {blocked && (
            <span className="text-xs text-destructive" data-testid="blocked">
              {blocked}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
