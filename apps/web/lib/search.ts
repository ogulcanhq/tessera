import type { ComponentOutput } from "./registry";

/** Lowercased text a component is matched against: name, summary, category and tags. */
export function searchText(component: Pick<ComponentOutput, "name" | "summary" | "category" | "tags">): string {
  return [component.name, component.summary, component.category, ...component.tags].join(" ").toLowerCase();
}

/** True when every word of the query appears somewhere in `text`. */
export function matches(text: string, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((word) => text.includes(word));
}
