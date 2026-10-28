// Loads and validates the registry. Shared by check.ts, build.ts and tests.
//
// The registry never stores Swift code: it references files under Sources/,
// which remain the single source of truth (docs/technical-decisions.md TD-03).

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { CategoriesFile, Component, Utility, type Category } from "./schema.ts";

/** Maximum preview file sizes in bytes (TD-15). */
export const MEDIA_BUDGET = { image: 400_000, video: 1_500_000 } as const;

/** Sections the component page adds around docs.mdx (docs/component-guidelines.md). */
const PAGE_SECTIONS = ["installation", "install", "source", "usage", "accessibility"];

export type Issue = { level: "error" | "warning"; where: string; message: string };

export type Registry = {
  root: string;
  categories: Category[];
  components: Component[];
  utilities: Utility[];
  issues: Issue[];
};

export function loadRegistry(root: string): Registry {
  const issues: Issue[] = [];
  const error = (where: string, message: string) => issues.push({ level: "error", where, message });
  const warn = (where: string, message: string) => issues.push({ level: "warning", where, message });

  const categories = readCategories(root, error);
  const components = readItems(root, "components", "component.json", Component, error);
  const utilities = readItems(root, "utilities", "utility.json", Utility, error);
  const utilitiesById = new Map(utilities.map((u) => [u.id, u]));
  const owners = new Map<string, string>();

  const checkSources = (where: string, ownerId: string, files: string[]) => {
    for (const file of files) {
      const absolute = path.join(root, file);
      if (!existsSync(absolute) || !statSync(absolute).isFile()) {
        error(where, `source file not found: ${file}`);
      }
      const owner = owners.get(file);
      if (owner && owner !== ownerId) {
        error(where, `source file ${file} is already owned by "${owner}"; each file belongs to one item`);
      }
      owners.set(file, ownerId);
    }
  };

  const checkUtilities = (where: string, ids: string[]) => {
    try {
      resolveUtilities(ids, utilitiesById);
    } catch (e) {
      error(where, (e as Error).message);
    }
  };

  for (const utility of utilities) {
    const where = `registry/utilities/${utility.id}/utility.json`;
    checkSources(where, utility.id, utility.source.files);
    checkUtilities(where, utility.dependencies.utilities);
  }

  const showcaseSource = readShowcaseSource(root);

  for (const component of components) {
    const where = `registry/components/${component.id}/component.json`;
    const dir = path.join(root, "registry/components", component.id);

    if (!categories.some((c) => c.id === component.category)) {
      error(where, `unknown category "${component.category}"; add it to registry/categories.json`);
    }
    checkSources(where, component.id, component.source.files);
    checkUtilities(where, component.dependencies.utilities);

    const docsPath = path.join(dir, component.docs);
    if (!existsSync(docsPath)) {
      error(where, `documentation file not found: registry/components/${component.id}/${component.docs}`);
    } else {
      // The component page wraps the docs in these sections and links its table
      // of contents to their anchors; a docs heading with the same name collides.
      for (const [, heading = ""] of readFileSync(docsPath, "utf8").matchAll(/^##\s+(.+?)\s*$/gm)) {
        if (PAGE_SECTIONS.includes(heading.toLowerCase())) {
          error(where, `${component.docs} must not use the heading "${heading}": the component page already has that section`);
        }
      }
    }

    if (!new RegExp(`id:\\s*"${component.id}"`).test(showcaseSource)) {
      error(where, `no Showcase entry with id: "${component.id}" in apps/showcase/TesseraShowcase`);
    }

    if (component.status !== "draft") {
      const schemes = new Set(component.previews.flatMap((p) => p.media.map((m) => m.scheme)));
      if (!schemes.has("light") || !schemes.has("dark")) {
        error(where, `status "${component.status}" requires light and dark previews`);
      }
    }

    const seenScenarios = new Set<string>();
    const currentHash = component.previews.length > 0 ? sourceHash(root, bundleSourcePaths(component, utilitiesById)) : "";
    for (const scenario of component.previews) {
      if (seenScenarios.has(scenario.id)) error(where, `duplicate preview scenario "${scenario.id}"`);
      seenScenarios.add(scenario.id);

      for (const media of scenario.media) {
        const files = media.kind === "video" ? [media.file, media.poster] : [media.file];
        for (const file of files) {
          const absolute = path.join(dir, file);
          if (!existsSync(absolute)) {
            error(where, `preview file not found: registry/components/${component.id}/${file}`);
            continue;
          }
          const budget = file.endsWith(".mp4") ? MEDIA_BUDGET.video : MEDIA_BUDGET.image;
          const size = statSync(absolute).size;
          if (size > budget) {
            error(where, `${file} is ${formatBytes(size)}, over the ${formatBytes(budget)} budget`);
          }
        }
      }

      if (currentHash && scenario.capture.sourceHash !== currentHash) {
        warn(
          where,
          `preview "${scenario.id}" may be stale: source changed since capture ` +
            `(current sourceHash ${currentHash}). Recapture, or update the hash if the change is not visual.`,
        );
      }
    }
  }

  return { root, categories, components, utilities, issues };
}

/**
 * Transitive closure of utility ids, dependencies before dependents, deduplicated.
 * Throws on unknown ids and cycles.
 */
export function resolveUtilities(ids: string[], utilitiesById: Map<string, Utility>): string[] {
  const ordered: string[] = [];
  const visiting: string[] = [];

  const visit = (id: string) => {
    if (ordered.includes(id)) return;
    if (visiting.includes(id)) {
      throw new Error(`utility dependency cycle: ${[...visiting, id].join(" → ")}`);
    }
    const utility = utilitiesById.get(id);
    if (!utility) throw new Error(`unknown utility "${id}"; add registry/utilities/${id}/utility.json`);
    visiting.push(id);
    utility.dependencies.utilities.forEach(visit);
    visiting.pop();
    ordered.push(id);
  };

  ids.forEach(visit);
  return ordered;
}

/** Every Swift file a copy-paste user needs, component files first. */
export function bundleSourcePaths(component: Component, utilitiesById: Map<string, Utility>): string[] {
  const utilityFiles = resolveUtilities(component.dependencies.utilities, utilitiesById).flatMap(
    (id) => utilitiesById.get(id)?.source.files ?? [],
  );
  return [...component.source.files, ...utilityFiles];
}

/** Fingerprint of a component's bundle, stored with captured previews to detect staleness. */
export function sourceHash(root: string, files: string[]): string {
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file).update("\0");
    const absolute = path.join(root, file);
    hash.update(existsSync(absolute) ? readFileSync(absolute) : "").update("\0");
  }
  return hash.digest("hex");
}

/**
 * The only transformation between package source and copy-paste source:
 * drop `import Tessera` / `import TesseraFeatures` lines (TD-05).
 */
export function toCopyPasteSource(source: string): string {
  return source.replace(/^import Tessera(Features)?[ \t]*\r?\n/gm, "");
}

export function formatIssues(issues: Issue[]): string {
  return issues.map((i) => `${i.level === "error" ? "✖ error" : "⚠ warning"}  ${i.where}\n    ${i.message}`).join("\n");
}

function readCategories(root: string, error: (where: string, message: string) => void): Category[] {
  const where = "registry/categories.json";
  const json = readJson(path.join(root, where), where, error);
  if (json === undefined) return [];
  const result = CategoriesFile.safeParse(json);
  if (!result.success) {
    reportZodIssues(where, result.error, error);
    return [];
  }
  const ids = result.data.categories.map((c) => c.id);
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate) error(where, `duplicate category "${duplicate}"`);
  return result.data.categories;
}

function readItems<Schema extends typeof Component | typeof Utility>(
  root: string,
  kindDir: string,
  fileName: string,
  schema: Schema,
  error: (where: string, message: string) => void,
): z.infer<Schema>[] {
  const base = path.join(root, "registry", kindDir);
  if (!existsSync(base)) return [];

  const items: z.infer<Schema>[] = [];
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const where = `registry/${kindDir}/${entry.name}/${fileName}`;
    const json = readJson(path.join(base, entry.name, fileName), where, error);
    if (json === undefined) continue;

    const result = schema.safeParse(json);
    if (!result.success) {
      reportZodIssues(where, result.error, error);
      continue;
    }
    if (result.data.id !== entry.name) {
      error(where, `id "${result.data.id}" must match its folder name "${entry.name}"`);
      continue;
    }
    items.push(result.data as z.infer<Schema>);
  }
  return items.sort((a, b) => a.id.localeCompare(b.id));
}

function readJson(file: string, where: string, error: (where: string, message: string) => void): unknown {
  if (!existsSync(file)) {
    error(where, "file not found");
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    error(where, `invalid JSON: ${(e as Error).message}`);
    return undefined;
  }
}

function reportZodIssues(where: string, zodError: z.ZodError, error: (where: string, message: string) => void) {
  for (const issue of zodError.issues) {
    const field = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    error(where, `${field}: ${issue.message}`);
  }
}

function readShowcaseSource(root: string): string {
  const dir = path.join(root, "apps/showcase/TesseraShowcase");
  if (!existsSync(dir)) return "";
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".swift"))
    .map((file) => readFileSync(path.join(dir, file), "utf8"))
    .join("\n");
}

function formatBytes(bytes: number): string {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.round(bytes / 1000)} KB`;
}
