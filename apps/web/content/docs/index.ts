/** Docs navigation, in reading order. Each slug maps to content/docs/<slug>.mdx. */
export const docs = [
  { slug: "introduction", title: "Introduction", description: "What Tessera is and how it is organized." },
  { slug: "installation", title: "Installation", description: "Add Tessera with Swift Package Manager or copy the source." },
  { slug: "accessibility", title: "Accessibility", description: "What every Tessera component guarantees." },
  { slug: "contributing", title: "Contributing", description: "Propose, build and document a component." },
] as const;

export type DocSlug = (typeof docs)[number]["slug"];
