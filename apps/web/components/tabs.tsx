"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type TabItem = { id: string; label: ReactNode; content: ReactNode };

/** Accessible tabs (WAI-ARIA pattern, arrow-key navigation). Panels may be server-rendered. */
export function Tabs({ items, label, size = "md" }: { items: TabItem[]; label: string; size?: "sm" | "md" }) {
  const [active, setActive] = useState(items[0]?.id);
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const target =
      event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : delta ? (index + delta + items.length) % items.length : -1;
    if (target < 0) return;
    event.preventDefault();
    setActive(items[target].id);
    refs.current[target]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="scroll-row flex gap-5 overflow-x-auto border-b border-line">
        {items.map((item, index) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[index] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={`-mb-px shrink-0 border-b px-0.5 font-medium whitespace-nowrap ${
                size === "sm" ? "py-2 text-meta" : "py-2.5 text-small"
              } ${selected ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg"}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== active}
          className="pt-4"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
