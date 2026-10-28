"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { matches } from "@/lib/search";

export type SearchItem = {
  group: "Components" | "Categories" | "Docs";
  title: string;
  detail: string;
  href: string;
  /** Lowercased text matched against the query. */
  text: string;
};

/**
 * Site-wide search: a header trigger and a ⌘K / Ctrl-K command palette over
 * components, categories and docs. Built on <dialog>, so focus is trapped
 * and Escape closes it natively.
 */
export function SiteSearch({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => (query ? items.filter((item) => matches(item.text, query)) : items), [items, query]);

  const open = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setQuery("");
    setActive(0);
    dialog.showModal();
    inputRef.current?.focus();
  };

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (item: SearchItem | undefined) => {
    if (!item) return;
    dialogRef.current?.close();
    router.push(item.href);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => (index + delta + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label="Search"
        className="flex h-8 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface pr-1.5 pl-2.5 text-small text-muted hover:border-line-strong hover:text-fg max-sm:size-8 max-sm:justify-center max-sm:p-0"
      >
        <SearchIcon />
        <span className="max-sm:hidden">Search</span>
        <kbd className="ml-5 rounded-[4px] border border-line px-1.5 font-sans text-[11.5px] leading-[18px] max-sm:hidden">
          ⌘K
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Search Tessera"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
        className="m-auto mt-[12vh] w-[min(600px,calc(100vw-32px))] overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-surface p-0 text-fg shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <SearchIcon className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            placeholder="Search components and docs"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            className="h-13 w-full bg-transparent text-lead outline-none placeholder:text-muted focus-visible:outline-none"
          />
          <kbd className="shrink-0 rounded-[4px] border border-line px-1.5 text-[11.5px] leading-[18px] text-muted">esc</kbd>
        </div>

        <ul id={listId} role="listbox" aria-label="Results" className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
          {results.map((item, index) => {
            const heading = item.group !== results[index - 1]?.group ? item.group : null;
            const selected = index === active;
            return (
              <li key={item.href} role="presentation">
                {heading && (
                  <div role="presentation" className="px-2.5 pt-2.5 pb-1 text-meta font-medium text-muted">
                    {heading}
                  </div>
                )}
                <div
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => setActive(index)}
                  onClick={() => go(item)}
                  className={`flex cursor-pointer items-baseline justify-between gap-4 rounded-[var(--radius-control)] px-2.5 py-2 ${
                    selected ? "bg-stage" : ""
                  }`}
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="truncate text-meta text-muted">{item.detail}</span>
                </div>
              </li>
            );
          })}
        </ul>
        {results.length === 0 && (
          <p role="status" className="px-4 pt-2 pb-8 text-center text-muted">
            Nothing matches “{query}”.
          </p>
        )}
      </dialog>
    </>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`size-[15px] ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="7" cy="7" r="4.75" />
      <path d="m10.5 10.5 3.25 3.25" strokeLinecap="round" />
    </svg>
  );
}
