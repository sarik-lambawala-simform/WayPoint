import { cn } from "@/lib/utils";
import type { FeatureTab, Tab } from "@/modules/tabs";
import type { WorkspaceEnv } from "@/modules/workspace";
import { type ComponentProps, useEffect, useMemo } from "react";
import { FeaturePane } from "./FeaturePane";
import { disposeClosedFeatures } from "./useStageTerminals";

type Props = {
  tabs: Tab[];
  activeId: number;
  onTitle: (id: number, title: string) => void;
  onOpenPath: (path: string) => void;
  onOpenCommitFile: ComponentProps<typeof FeaturePane>["onOpenCommitFile"];
  /** Switches the active space's environment; only on an offer the user accepts. */
  onSwitchEnv: (env: WorkspaceEnv) => void;
};

/** Every feature tab stays mounted; the active one is shown. */
export function FeatureStack({
  tabs,
  activeId,
  onTitle,
  onOpenPath,
  onOpenCommitFile,
  onSwitchEnv,
}: Props) {
  const features = useMemo(
    () => tabs.filter((t): t is FeatureTab => t.kind === "feature"),
    [tabs],
  );
  // Stage terminals die with their feature tab.
  useEffect(() => {
    disposeClosedFeatures(new Set(features.map((t) => t.featureDir)));
  }, [features]);
  return (
    <>
      {features.map((t) => (
        <div
          key={t.id}
          className={cn("absolute inset-0", t.id !== activeId && "hidden")}
        >
          <FeaturePane
            featureDir={t.featureDir}
            repoRoot={t.repoRoot}
            feature={t.feature}
            active={t.id === activeId}
            onTitle={(title) => onTitle(t.id, title)}
            onOpenPath={onOpenPath}
            onOpenCommitFile={onOpenCommitFile}
            onSwitchEnv={onSwitchEnv}
          />
        </div>
      ))}
    </>
  );
}
