import Link from "next/link";
import { categoryTitle } from "@/lib/registry";
import { upcoming } from "@/lib/upcoming";

const promises = [
  "A recording from the iOS Simulator, in light and dark",
  "The complete Swift source, ready to copy",
  "Install steps for Swift Package Manager or copy-paste",
  "Usage docs and accessibility notes",
];

/**
 * Shown while the registry has no components. It describes the component in
 * progress in words only: no mock preview, no placeholder cards.
 */
export function CatalogEmpty() {
  return (
    <div className="grid overflow-hidden rounded-[var(--radius-stage)] border border-line md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="bg-stage px-6 py-8 sm:px-10 sm:py-12">
        <p className="flex items-center gap-2 text-meta text-muted">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          In progress: {categoryTitle(upcoming.category)}
        </p>
        <h3 className="heading mt-4 text-heading sm:text-page">{upcoming.name}</h3>
        <p className="mt-3 max-w-[40ch] text-lead text-muted">{upcoming.summary}</p>
        <ul aria-label="States" className="mt-8 grid max-w-md grid-cols-2 border-t border-l border-line-strong/70">
          {upcoming.states.map((state) => (
            <li key={state} className="border-r border-b border-line-strong/70 px-3.5 py-3 text-small">
              {state}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col bg-surface px-6 py-8 sm:px-10 sm:py-12">
        <p className="font-medium">The catalog opens with this component. Each entry comes with:</p>
        <ul className="mt-4 space-y-2.5 text-small text-muted">
          {promises.map((item) => (
            <li key={item} className="flex gap-3">
              <svg viewBox="0 0 16 16" className="mt-[3px] size-3.5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-auto pt-8 text-small text-muted">
          Want to help build it?{" "}
          <Link href="/docs/contributing" className="text-accent underline underline-offset-3 hover:decoration-2">
            Read the contributing guide
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
