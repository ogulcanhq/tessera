import Link from "next/link";
import type { ComponentOutput } from "@/lib/registry";
import { ComponentCard } from "./component-card";

/**
 * Featured layout for a catalog with a single component: its card at two
 * columns, plus what it covers from its registry entry. Replaces a lone card
 * in a three-column row.
 */
export function ComponentSpotlight({ component, categoryTitle }: { component: ComponentOutput; categoryTitle: string }) {
  const accessibility = [
    { label: "VoiceOver", supported: component.accessibility.voiceOver },
    { label: "Dynamic Type", supported: component.accessibility.dynamicType },
    { label: "Reduce Motion", supported: component.accessibility.reduceMotion },
  ].filter((item) => item.supported);

  return (
    <div className="grid gap-x-5 gap-y-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ComponentCard component={component} categoryTitle={categoryTitle} size="large" />
      </div>
      <div className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6">
        <h3 className="heading text-title">{component.name}</h3>
        <p className="mt-2 text-small text-muted">{component.summary}</p>
        {component.previews.length > 0 && (
          <>
            <p className="mt-6 text-meta font-medium">Recorded in the Simulator</p>
            <ul className="mt-2 space-y-1.5 text-small text-muted">
              {component.previews.map((preview) => (
                <li key={preview.id}>{preview.title}</li>
              ))}
            </ul>
          </>
        )}
        {accessibility.length > 0 && (
          <>
            <p className="mt-6 text-meta font-medium">Supports</p>
            <p className="mt-2 text-small text-muted">{accessibility.map((item) => item.label).join(", ")}</p>
          </>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-8">
          <Link
            href={`/components/${component.id}`}
            className="inline-flex h-9 items-center rounded-[var(--radius-control)] bg-fg px-3.5 text-small font-medium text-bg hover:bg-fg/85"
          >
            View source and docs
          </Link>
          <Link href="/docs/installation" className="text-small font-medium text-muted hover:text-fg">
            Installation
          </Link>
        </div>
      </div>
    </div>
  );
}
