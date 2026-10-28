"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  label?: string;
  /** "strong" is the filled primary style for a page-level action. */
  tone?: "default" | "strong";
};

export function CopyButton({ text, label = "Copy code", tone = "default" }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("copied");
        } catch {
          setState("failed");
        }
      }}
      className={`inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] text-meta font-medium ${
        tone === "strong" ? "bg-fg px-3 text-bg hover:bg-fg/85" : "px-2.5 text-muted hover:bg-stage hover:text-fg"
      }`}
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {state === "copied" ? (
          <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
            <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
          </>
        )}
      </svg>
      <span>{state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}</span>
      <span role="status" className="sr-only">
        {state === "copied" ? "Copied to clipboard" : state === "failed" ? "Could not copy. Select the code and copy it manually." : ""}
      </span>
    </button>
  );
}
