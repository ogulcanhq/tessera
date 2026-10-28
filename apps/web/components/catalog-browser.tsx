"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CategoryOutput, ComponentOutput } from "@/lib/registry";
import { matches, searchText } from "@/lib/search";
import { ComponentCard } from "./component-card";

type Props = {
  components: ComponentOutput[];
  categories: CategoryOutput[];
};

/**
 * Catalog driven by the URL: `?category=` is the source of truth for the
 * filter (so palette and category links work while the page is open), and
 * `?q=` seeds the search field. Must render inside <Suspense>.
 */
export function CatalogBrowserFromURL(props: Props) {
  const params = useSearchParams();
  const requested = params.get("category");
  const category = props.categories.some((c) => c.id === requested) ? requested : null;
  return (
    <CatalogBrowser
      {...props}
      category={category}
      onCategoryChange={(next) => writeParams({ category: next })}
      initialQuery={params.get("q") ?? ""}
    />
  );
}

/** Updates the query string in place. Next syncs this with useSearchParams. */
function writeParams(changes: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(changes)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(null, "", url);
}

/** Search, category filter and gallery grid. */
export function CatalogBrowser({
  components,
  categories,
  category = null,
  onCategoryChange = () => {},
  initialQuery = "",
}: Props & { category?: string | null; onCategoryChange?: (category: string | null) => void; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const setCategory = onCategoryChange;
  const searchRef = useRef<HTMLInputElement>(null);

  const titles = useMemo(() => new Map(categories.map((c) => [c.id, c.title])), [categories]);
  const populated = categories.filter((c) => c.componentCount > 0);
  const indexed = useMemo(() => components.map((c) => ({ component: c, text: searchText(c) })), [components]);
  const results = indexed
    .filter(({ component, text }) => (!category || component.category === category) && matches(text, query))
    .map(({ component }) => component);

  // The search text stays local (typing must not wait on the router); it is mirrored to `?q=` for sharing.
  const queryChanged = useRef(false);
  useEffect(() => {
    if (!queryChanged.current) {
      queryChanged.current = true;
      return;
    }
    writeParams({ q: query || null });
  }, [query]);

  // "/" jumps to the search field from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== "/" || target.closest("input, textarea, [contenteditable=true], dialog")) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const clear = () => {
    setCategory(null);
    setQuery("");
  };

  const summary = query
    ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${query}”`
    : `${results.length} ${results.length === 1 ? "component" : "components"}`;

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 bg-bg/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
          <div role="group" aria-label="Filter by category" className="scroll-row -mx-1 flex gap-1 overflow-x-auto px-1">
            <FilterButton selected={category === null} onClick={() => setCategory(null)} count={components.length}>
              All
            </FilterButton>
            {populated.map((c) => (
              <FilterButton key={c.id} selected={category === c.id} onClick={() => setCategory(c.id)} count={c.componentCount}>
                {c.title}
              </FilterButton>
            ))}
          </div>
          <label className="relative block md:w-72">
            <span className="sr-only">Search components</span>
            <svg viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 left-3 size-[15px] -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="7" cy="7" r="4.75" />
              <path d="m10.5 10.5 3.25 3.25" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && query) {
                  event.preventDefault();
                  setQuery("");
                }
              }}
              placeholder="Search components"
              className="h-9 w-full rounded-[var(--radius-control)] border border-line bg-surface pr-9 pl-9 text-small outline-none placeholder:text-muted hover:border-line-strong focus:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent [&::-webkit-search-cancel-button]:hidden"
            />
            <kbd aria-hidden="true" className="absolute top-1/2 right-2.5 max-sm:hidden -translate-y-1/2 rounded-[4px] border border-line px-1.5 text-[11.5px] leading-[18px] text-muted">
              /
            </kbd>
          </label>
        </div>
      </div>

      <p role="status" className="mt-6 text-meta text-muted">
        {summary}
        {category && ` in ${titles.get(category)}`}
      </p>

      {results.length > 0 ? (
        <ul className="mt-4 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((component) => (
            <li key={component.id}>
              <ComponentCard component={component} categoryTitle={titles.get(component.category) ?? component.category} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-[var(--radius-card)] border border-line bg-surface px-6 py-14 text-center">
          <p className="font-medium">No components match{query ? ` “${query}”` : ""}.</p>
          <p className="mt-1.5 text-small text-muted">Try a shorter search or another category.</p>
          <button
            type="button"
            onClick={clear}
            className="mt-5 h-8 rounded-[var(--radius-control)] border border-line-strong px-3 text-small font-medium hover:bg-stage"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function FilterButton({
  selected,
  onClick,
  count,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-[var(--radius-control)] px-3 text-small whitespace-nowrap ${
        selected ? "bg-fg text-bg" : "text-muted hover:bg-stage hover:text-fg"
      }`}
    >
      {children}
      <span className={`tabular-nums ${selected ? "opacity-60" : "opacity-70"}`}>{count}</span>
    </button>
  );
}
