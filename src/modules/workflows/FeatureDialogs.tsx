import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { featureDirOf, featureNameError } from "./lib/featurePaths";

export type FeatureDialogState =
  | { kind: "open"; repoRoot: string; features: string[] }
  | { kind: "new"; repoRoot: string }
  | null;

type Props = {
  state: FeatureDialogState;
  onClose: () => void;
  onOpenFeature: (repoRoot: string, feature: string) => void;
  onCreateFeature: (repoRoot: string, name: string) => Promise<void>;
};

export function FeatureDialogs({
  state,
  onClose,
  onOpenFeature,
  onCreateFeature,
}: Props) {
  return (
    <>
      <OpenFeatureDialog
        state={state?.kind === "open" ? state : null}
        onClose={onClose}
        onOpenFeature={onOpenFeature}
      />
      <NewFeatureDialog
        state={state?.kind === "new" ? state : null}
        onClose={onClose}
        onCreateFeature={onCreateFeature}
      />
    </>
  );
}

function OpenFeatureDialog({
  state,
  onClose,
  onOpenFeature,
}: {
  state: Extract<FeatureDialogState, { kind: "open" }> | null;
  onClose: () => void;
  onOpenFeature: Props["onOpenFeature"];
}) {
  return (
    <Dialog open={state !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Open feature</DialogTitle>
          <DialogDescription>
            Pick a feature folder of this repo
          </DialogDescription>
        </DialogHeader>
        <Command className="rounded-none">
          <CommandInput placeholder="Open feature…" />
          <CommandList>
            <CommandEmpty>
              No feature folders in .scratch. Use New feature to start one.
            </CommandEmpty>
            {state?.features.map((name) => (
              <CommandItem
                key={name}
                value={name}
                onSelect={() => onOpenFeature(state.repoRoot, name)}
              >
                {name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function NewFeatureDialog({
  state,
  onClose,
  onCreateFeature,
}: {
  state: Extract<FeatureDialogState, { kind: "new" }> | null;
  onClose: () => void;
  onCreateFeature: Props["onCreateFeature"];
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const open = state !== null;

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const submit = async () => {
    if (!state || busy) return;
    const problem = featureNameError(name);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      await onCreateFeature(state.repoRoot, name.trim());
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New feature</DialogTitle>
          <DialogDescription>
            Creates a folder under .scratch/ in this repo.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="feature-name"
        />
        {error ? (
          <div className="text-xs text-destructive">{error}</div>
        ) : (
          <div className="truncate text-xs text-muted-foreground">
            {state ? featureDirOf(state.repoRoot, name.trim() || "…") : ""}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
