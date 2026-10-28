/** Placeholder wordmark glyph (temporary name): four tiles, one in the accent. */
export function TileMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <rect x="1" y="1" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="11" y="1" width="8" height="8" rx="2" fill="currentColor" opacity="0.32" />
      <rect x="1" y="11" width="8" height="8" rx="2" fill="currentColor" opacity="0.32" />
      <rect x="11" y="11" width="8" height="8" rx="2" fill="var(--accent)" />
    </svg>
  );
}
