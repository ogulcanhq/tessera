import { highlight } from "@/lib/highlight";
import { CopyButton } from "./copy-button";

type Props = {
  code: string;
  lang?: string;
  /** Shown in the header bar, e.g. a file name. */
  title?: string;
  /** Optional link rendered next to the title, e.g. the file on GitHub. */
  href?: string | null;
  copyLabel?: string;
  /** Caps the height for long files; the block scrolls inside. */
  maxHeight?: number;
};

export async function CodeBlock({ code, lang = "swift", title, href, copyLabel, maxHeight }: Props) {
  const html = await highlight(code.trimEnd(), lang);
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-code">
      <div className="flex h-10 items-center justify-between gap-3 border-b border-line pr-1 pl-4">
        <span className="truncate font-mono text-[12px] text-muted">
          {href ? (
            <a href={href} className="hover:text-fg hover:underline">
              {title}
            </a>
          ) : (
            (title ?? lang)
          )}
        </span>
        <CopyButton text={code} label={copyLabel} />
      </div>
      <div
        className="overflow-auto px-4 py-3.5"
        style={maxHeight ? { maxHeight } : undefined}
        tabIndex={0}
        role="region"
        aria-label={title ? `Code: ${title}` : "Code"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
