import type { ComponentOutput, RegistryOutput } from "../../../scripts/registry/output";
import data from "@/.generated/registry.json";

export type { CategoryOutput, ComponentOutput, PreviewOutput, SourceFileOutput } from "../../../scripts/registry/output";

/** Build-time registry data. Regenerate with `npm run registry -w web`. */
export const registry = data as RegistryOutput;

export function getComponent(id: string): ComponentOutput | undefined {
  return registry.components.find((c) => c.id === id);
}

export function categoryTitle(id: string): string {
  return registry.categories.find((c) => c.id === id)?.title ?? id;
}

/** Placeholder shown in install snippets until `repository` is set in the root package.json. */
export const REPOSITORY_PLACEHOLDER = "https://github.com/<owner>/tessera";

export function githubFileUrl(path: string): string | null {
  return registry.repositoryUrl ? `${registry.repositoryUrl}/blob/main/${path}` : null;
}
