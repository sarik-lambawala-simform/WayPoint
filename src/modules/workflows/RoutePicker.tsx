import { cn } from "@/lib/utils";

type Props = {
  /** The workflow's route names; the plain route is always offered first. */
  routes: string[];
  /** The route in force; null is the plain one. */
  route: string | null;
  onPick: (route: string | null) => void;
  className?: string;
};

const label = (r: string) => r.charAt(0).toUpperCase() + r.slice(1);

/** Chooses between the plain route and the workflow's named ones. Nothing when it has none. */
export function RoutePicker({ routes, route, onPick, className }: Props) {
  if (routes.length === 0) return null;
  const options: (string | null)[] = [null, ...routes];
  return (
    <div
      className={cn("flex items-center gap-1 text-[11px]", className)}
      role="radiogroup"
      aria-label="Route"
    >
      <span className="text-muted-foreground">Route</span>
      {options.map((r) => (
        <button
          key={r ?? "plain"}
          type="button"
          role="radio"
          aria-checked={r === route}
          onClick={() => r !== route && onPick(r)}
          className={cn(
            "rounded px-1.5 py-0.5 transition-colors",
            r === route
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50",
          )}
        >
          {r === null ? "Default" : label(r)}
        </button>
      ))}
    </div>
  );
}
