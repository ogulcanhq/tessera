import type { ComponentOutput } from "@/lib/registry";

const dots: Record<ComponentOutput["status"], string> = {
  draft: "bg-muted",
  beta: "bg-accent",
  stable: "bg-fg",
  deprecated: "bg-warn",
};

const labels: Record<ComponentOutput["status"], string> = {
  draft: "Draft",
  beta: "Beta",
  stable: "Stable",
  deprecated: "Deprecated",
};

export function StatusBadge({ component }: { component: ComponentOutput }) {
  return (
    <span className="inline-flex items-center gap-2 text-meta text-muted">
      <span className="inline-flex h-6 items-center gap-1.5 rounded-[var(--radius-control)] border border-line px-2 font-medium text-fg">
        <span className={`size-1.5 rounded-full ${dots[component.status]}`} aria-hidden="true" />
        {labels[component.status]}
      </span>
      {!component.released && <span>Not in a release yet</span>}
    </span>
  );
}
