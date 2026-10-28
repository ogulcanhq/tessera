"use client";

import { useState } from "react";
import type { PreviewOutput } from "@/lib/registry";
import { usePrefersReducedMotion, useSiteTheme } from "./use-site-theme";

type Scheme = "light" | "dark";

/**
 * The preview stage: genuine iOS Simulator recordings of a component. SwiftUI
 * cannot run in a browser, so previews are captured from the Showcase app and
 * stored as media (docs/preview-capture.md). The stage takes the recording's
 * appearance, and its color matches the capture stage, so the square
 * recording blends into a wide stage with no visible edge.
 */
export function PreviewPlayer({ previews, name }: { previews: PreviewOutput[]; name: string }) {
  const siteTheme = useSiteTheme();
  const reducedMotion = usePrefersReducedMotion();
  const [scenarioId, setScenarioId] = useState(previews[0]?.id);
  const [schemeOverride, setSchemeOverride] = useState<Scheme | null>(null);
  const [playRequested, setPlayRequested] = useState(false);

  const scenario = previews.find((p) => p.id === scenarioId) ?? previews[0];
  const scheme = schemeOverride ?? siteTheme;

  if (!scenario) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-[var(--radius-stage)] border border-line bg-stage p-8 text-center sm:aspect-[2/1]">
        <div className="max-w-xs">
          <p className="font-medium">No recording yet</p>
          <p className="mt-1.5 text-small text-muted">
            Previews are recorded from the Showcase app in the iOS Simulator. Run the Showcase to try {name} now.
          </p>
        </div>
      </div>
    );
  }

  const media = scenario.media.find((m) => m.scheme === scheme) ?? scenario.media[0];
  const schemes = new Set(scenario.media.map((m) => m.scheme));
  const autoplay = !reducedMotion || playRequested;
  const label = `${name}: ${scenario.title}, ${media.scheme} appearance`;
  // Recordings are square, with the component in the middle. Shown at 4/3 of
  // the stage height, the stage crops them to their middle 75% (the same crop
  // as catalog cards; docs/preview-capture.md), so the component isn't lost in
  // empty stage. Scaled 1% further, which the stage clips: browsers antialias
  // a scaled video's outer pixel rows into a faint line at its edge.
  const mediaClass =
    "absolute top-1/2 left-1/2 aspect-square h-[133.333%] w-auto max-w-none -translate-1/2 scale-[1.01] object-cover";

  return (
    <figure className="overflow-hidden rounded-[var(--radius-stage)] border border-line">
      <div data-theme={media.scheme} className="relative aspect-[4/3] overflow-hidden bg-stage sm:aspect-[2/1] lg:aspect-auto lg:h-[min(420px,56vh)]">
        {media.kind === "video" ? (
          autoplay ? (
            <video
              key={media.src}
              src={media.src}
              poster={media.poster}
              width={media.width}
              height={media.height}
              autoPlay
              muted
              loop
              playsInline
              aria-label={label}
              className={mediaClass}
            />
          ) : (
            <button type="button" onClick={() => setPlayRequested(true)} className="absolute inset-0 grid place-items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.poster} alt={label} className={mediaClass} />
              <span className="relative rounded-[var(--radius-control)] bg-fg px-3.5 py-2 text-small font-medium text-bg">
                Play recording
              </span>
            </button>
          )
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.src} width={media.width} height={media.height} alt={label} className={mediaClass} />
        )}
      </div>

      <figcaption className="flex flex-col gap-3 border-t border-line bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        {previews.length > 1 ? (
          <Segmented
            label="Scenario"
            value={scenario.id}
            onChange={setScenarioId}
            options={previews.map((p) => ({ value: p.id, label: p.title }))}
          />
        ) : (
          <span className="text-small font-medium">{scenario.title}</span>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-meta text-muted">
            Recorded on {scenario.capture.device}, {scenario.capture.os}
          </span>
          {schemes.size > 1 && (
            <Segmented
              label="Appearance"
              value={media.scheme}
              onChange={(s) => setSchemeOverride(s as Scheme)}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          )}
        </div>
      </figcaption>
      {scenario.description && (
        <p className="border-t border-line bg-surface px-3 py-2.5 text-small text-muted sm:px-4">{scenario.description}</p>
      )}
    </figure>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div role="group" aria-label={label} className="scroll-row flex max-w-full shrink-0 gap-0.5 overflow-x-auto rounded-[var(--radius-control)] bg-stage p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`h-7 shrink-0 rounded-[5px] px-2.5 text-meta font-medium whitespace-nowrap ${
            option.value === value ? "bg-surface text-fg ring-1 ring-line-strong" : "text-muted hover:text-fg"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
