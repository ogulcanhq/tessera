import { isValidElement, type ReactNode } from "react";

export type Heading = { id: string; title: string };

/** Anchor id for a heading: "VoiceOver announcements" → "voiceover-announcements". */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}

/** Plain text of rendered heading content, for its anchor id. */
export function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textContent(node.props.children);
  return "";
}

/** `##` headings of an MDX document, outside code fences, in order. */
export function mdxHeadings(source: string): Heading[] {
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of source.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const match = !inFence && /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) {
      const title = (match[1] ?? "").replace(/[`*_]/g, "");
      headings.push({ id: headingId(title), title });
    }
  }
  return headings;
}
