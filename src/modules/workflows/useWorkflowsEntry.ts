import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { native } from "@/modules/ai/lib/native";
import { useSpaces } from "@/modules/spaces";
import type { Tab } from "@/modules/tabs";
import type { WorkspaceEnv } from "@/modules/workspace";
import type { FeatureDialogState } from "./FeatureDialogs";
import {
  createFeature,
  listFeatures,
  pickFolder,
  resolveRepoRoot,
} from "./lib/api";
import { featureDirOf } from "./lib/featurePaths";
import {
  featureEntries,
  loadSavedFeatures,
  planRestore,
  saveFeatures,
} from "./lib/featureStore";
import { planOpenRepo } from "./lib/openRepo";

type OpenFeatureInput = {
  repoRoot: string;
  feature: string;
  featureDir: string;
  spaceId?: string;
  activate?: boolean;
};

type Params = {
  tabs: Tab[];
  booted: boolean;
  spacesHydrated: boolean;
  workspaceEnv: WorkspaceEnv;
  openFeatureTab: (input: OpenFeatureInput) => number;
  newTab: (cwd?: string) => void;
  setActiveSpaceForNewTabs: (id: string) => void;
};

/**
 * The module's entry points for the command palette ("Open repo", "Open feature", "New feature"),
 * and the reopening of feature tabs on launch.
 */
export function useWorkflowsEntry({
  tabs,
  booted,
  spacesHydrated,
  workspaceEnv,
  openFeatureTab,
  newTab,
  setActiveSpaceForNewTabs,
}: Params) {
  const [dialog, setDialog] = useState<FeatureDialogState>(null);

  const openRepo = useCallback(async () => {
    try {
      const folder = await pickFolder();
      if (!folder) return;
      const repoRoot = await resolveRepoRoot(folder);
      if (!repoRoot) {
        toast.error("That folder is not inside a git repository.");
        return;
      }
      const { spaces, create, setActive } = useSpaces.getState();
      const plan = planOpenRepo(spaces, repoRoot);
      if (plan.kind === "switch") {
        setActive(plan.spaceId);
        return;
      }
      const meta = create({
        name: plan.name,
        root: plan.root,
        env: workspaceEnv,
      });
      setActiveSpaceForNewTabs(meta.id);
      newTab(plan.root);
      setActive(meta.id);
    } catch (e) {
      toast.error(`Could not open the repo: ${e}`);
    }
  }, [workspaceEnv, newTab, setActiveSpaceForNewTabs]);

  /** The git top folder of the active space. */
  const activeRepoRoot = useCallback(async (): Promise<string | null> => {
    const { spaces, activeId } = useSpaces.getState();
    const root = spaces.find((s) => s.id === activeId)?.root;
    if (!root) {
      toast.error("This space has no folder. Use Open repo first.");
      return null;
    }
    try {
      const repoRoot = await resolveRepoRoot(root);
      if (!repoRoot) toast.error("This space is not inside a git repository.");
      return repoRoot;
    } catch (e) {
      toast.error(`Could not read the repo: ${e}`);
      return null;
    }
  }, []);

  const openFeature = useCallback(async () => {
    const repoRoot = await activeRepoRoot();
    if (!repoRoot) return;
    setDialog({
      kind: "open",
      repoRoot,
      features: await listFeatures(repoRoot),
    });
  }, [activeRepoRoot]);

  const newFeature = useCallback(async () => {
    const repoRoot = await activeRepoRoot();
    if (repoRoot) setDialog({ kind: "new", repoRoot });
  }, [activeRepoRoot]);

  const onOpenFeature = useCallback(
    (repoRoot: string, feature: string) => {
      openFeatureTab({
        repoRoot,
        feature,
        featureDir: featureDirOf(repoRoot, feature),
      });
      setDialog(null);
    },
    [openFeatureTab],
  );

  const onCreateFeature = useCallback(
    async (repoRoot: string, name: string) => {
      const featureDir = await createFeature(repoRoot, name);
      openFeatureTab({ repoRoot, feature: name, featureDir });
      setDialog(null);
    },
    [openFeatureTab],
  );

  // Set once the reopen below has run, so a launch never saves an empty list over last
  // session's.
  const loaded = useRef(false);

  // Reopen last session's feature tabs once Terax's own restore has finished (it replaces the
  // whole tab list), without taking focus from the restored active tab.
  const restored = useRef(false);
  useEffect(() => {
    if (!booted || !spacesHydrated || restored.current) return;
    restored.current = true;
    void (async () => {
      try {
        const saved = await loadSavedFeatures();
        const repoRoots = new Set<string>();
        if (Array.isArray(saved)) {
          for (const e of saved) {
            if (e && typeof e.repoRoot === "string") repoRoots.add(e.repoRoot);
          }
        }
        const existing = new Map<string, Set<string>>();
        for (const root of repoRoots) {
          await native.workspaceAuthorize(root).catch(() => {});
          existing.set(root, new Set(await listFeatures(root)));
        }
        const spaceIds = new Set(useSpaces.getState().spaces.map((s) => s.id));
        for (const e of planRestore(saved, spaceIds, (r) => existing.get(r))) {
          openFeatureTab({
            repoRoot: e.repoRoot,
            feature: e.feature,
            featureDir: featureDirOf(e.repoRoot, e.feature),
            spaceId: e.spaceId,
            activate: false,
          });
        }
      } catch (e) {
        console.error("[waypoint] reopening feature tabs failed:", e);
      } finally {
        loaded.current = true;
      }
    })();
  }, [booted, spacesHydrated, openFeatureTab]);

  // Save the open feature tabs.
  const lastSaved = useRef("");
  useEffect(() => {
    if (!loaded.current) return;
    const entries = featureEntries(tabs);
    const json = JSON.stringify(entries);
    if (json === lastSaved.current) return;
    lastSaved.current = json;
    saveFeatures(entries).catch((e) =>
      console.error("[waypoint] saving feature tabs failed:", e),
    );
  }, [tabs]);

  return {
    dialog,
    closeDialog: () => setDialog(null),
    openRepo,
    openFeature,
    newFeature,
    onOpenFeature,
    onCreateFeature,
  };
}
