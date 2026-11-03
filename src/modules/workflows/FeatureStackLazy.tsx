import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";
import type { FeatureStack as FeatureStackType } from "./FeatureStack";

const Inner = lazy(() =>
  import("./FeatureStack").then((m) => ({ default: m.FeatureStack })),
);

type Props = ComponentProps<typeof FeatureStackType>;

export function FeatureStack(props: Props) {
  if (!props.tabs.some((t) => t.kind === "feature")) return null;
  return (
    <Suspense fallback={null}>
      <Inner {...props} />
    </Suspense>
  );
}
