import { cn } from "@/lib/utils";
import type { FeatureTab, Tab } from "@/modules/tabs";
import { FeaturePane } from "./FeaturePane";

type Props = { tabs: Tab[]; activeId: number };

/** Every feature tab stays mounted; the active one is shown. */
export function FeatureStack({ tabs, activeId }: Props) {
  const features = tabs.filter((t): t is FeatureTab => t.kind === "feature");
  return (
    <>
      {features.map((t) => (
        <div
          key={t.id}
          className={cn("absolute inset-0", t.id !== activeId && "hidden")}
        >
          <FeaturePane featureDir={t.featureDir} repoRoot={t.repoRoot} />
        </div>
      ))}
    </>
  );
}
