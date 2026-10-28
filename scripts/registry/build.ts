// Generates the website's build-time data from the registry and Sources/.
//
//   npm run registry:build [-- --root <dir>] [-- --out <web app dir>]
//
// Writes (all gitignored):
//   <out>/.generated/registry.json   metadata + copy-paste source (RegistryOutput)
//   <out>/.generated/docs/<id>.mdx   component docs
//   <out>/.generated/docs-map.ts     static imports of those docs
//   <out>/public/previews/<id>/      preview media

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseCommonArgs, REPO_ROOT } from "./args.ts";
import { bundleSourcePaths, formatIssues, loadRegistry, resolveUtilities, toCopyPasteSource } from "./load.ts";
import type { ComponentOutput, PreviewOutput, RegistryOutput, SourceFileOutput } from "./output.ts";

const { root, values } = parseCommonArgs({ out: { type: "string" } });
const outDir = path.resolve(values.out ?? path.join(REPO_ROOT, "apps/web"));
const generatedDir = path.join(outDir, ".generated");
const previewsDir = path.join(outDir, "public/previews");

const registry = loadRegistry(root);
if (registry.issues.length > 0) console.log(formatIssues(registry.issues) + "\n");
if (registry.issues.some((i) => i.level === "error")) {
  console.error("Registry has errors; fix them before building (npm run registry:check).");
  process.exit(1);
}

const rootPackage = JSON.parse(readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")) as {
  version: string;
  repository?: string | { url?: string };
};
const latestRelease = findLatestRelease();
const utilitiesById = new Map(registry.utilities.map((u) => [u.id, u]));

rmSync(generatedDir, { recursive: true, force: true });
rmSync(previewsDir, { recursive: true, force: true });
mkdirSync(path.join(generatedDir, "docs"), { recursive: true });

const components: ComponentOutput[] = registry.components.map((component) => {
  const utilityIds = resolveUtilities(component.dependencies.utilities, utilitiesById);
  const files: SourceFileOutput[] = bundleSourcePaths(component, utilitiesById).map((file) => {
    const owner = component.source.files.includes(file)
      ? component.id
      : (utilityIds.find((id) => utilitiesById.get(id)?.source.files.includes(file)) ?? component.id);
    return {
      name: path.basename(file),
      path: file,
      role: owner === component.id ? "component" : "utility",
      owner,
      content: toCopyPasteSource(readFileSync(path.join(root, file), "utf8")),
    };
  });

  const sourceDir = path.join(root, "registry/components", component.id);
  copyFileSync(path.join(sourceDir, component.docs), path.join(generatedDir, "docs", `${component.id}.mdx`));

  const previews: PreviewOutput[] = component.previews.map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    ...(scenario.description ? { description: scenario.description } : {}),
    capture: {
      method: scenario.capture.method,
      device: scenario.capture.device,
      os: scenario.capture.os,
      xcode: scenario.capture.xcode,
      capturedAt: scenario.capture.capturedAt,
    },
    media: scenario.media.map((media) => {
      const publish = (file: string) => {
        const target = path.join(previewsDir, component.id, path.basename(file));
        mkdirSync(path.dirname(target), { recursive: true });
        copyFileSync(path.join(sourceDir, file), target);
        return `/previews/${component.id}/${path.basename(file)}`;
      };
      const base = { scheme: media.scheme, width: media.width, height: media.height, src: publish(media.file) };
      return media.kind === "video"
        ? { kind: "video" as const, ...base, poster: publish(media.poster) }
        : { kind: "image" as const, ...base };
    }),
  }));

  return {
    id: component.id,
    name: component.name,
    summary: component.summary,
    category: component.category,
    tags: component.tags,
    status: component.status,
    since: component.since ?? null,
    released: component.since !== undefined && latestRelease !== null && compareSemVer(component.since, latestRelease) <= 0,
    platforms: component.platforms,
    frameworks: component.dependencies.frameworks,
    accessibility: component.accessibility,
    files,
    singleFile: combineFiles(component.name, files),
    previews,
  };
});

const output: RegistryOutput = {
  version: rootPackage.version,
  latestRelease,
  repositoryUrl: repositoryUrl(rootPackage.repository),
  categories: registry.categories.map((category) => ({
    ...category,
    componentCount: components.filter((c) => c.category === category.id).length,
  })),
  components,
};

writeFileSync(path.join(generatedDir, "registry.json"), JSON.stringify(output, null, 2) + "\n");
writeFileSync(path.join(generatedDir, "docs-map.ts"), docsMap(components.map((c) => c.id)));

console.log(
  `Registry build: ${components.length} component(s) → ${path.relative(REPO_ROOT, generatedDir) || generatedDir}`,
);

function combineFiles(name: string, files: SourceFileOutput[]): string {
  const header = [
    `// ${name} — Tessera (MIT License, https://opensource.org/licenses/MIT)`,
    `// Copy-paste bundle: ${files.length} file(s) combined into one.`,
    "",
  ].join("\n");
  return header + files.map((f) => `// MARK: - ${f.name}\n\n${f.content.trimEnd()}\n`).join("\n");
}

function docsMap(ids: string[]): string {
  const entries = ids.map((id) => `  ${JSON.stringify(id)}: () => import(${JSON.stringify(`./docs/${id}.mdx`)}),`);
  return [
    "// Generated by scripts/registry/build.ts — do not edit.",
    'import type { MDXContent } from "mdx/types";',
    "",
    "export const componentDocs: Record<string, () => Promise<{ default: MDXContent }>> = {",
    ...entries,
    "};",
    "",
  ].join("\n");
}

function findLatestRelease(): string | null {
  try {
    const tags = execFileSync("git", ["tag", "--list"], { cwd: REPO_ROOT, encoding: "utf8" })
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => /^\d+\.\d+\.\d+$/.test(t));
    return tags.sort(compareSemVer).at(-1) ?? null;
  } catch {
    return null;
  }
}

function compareSemVer(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function repositoryUrl(repository: string | { url?: string } | undefined): string | null {
  const url = typeof repository === "string" ? repository : repository?.url;
  return url ? url.replace(/^git\+/, "").replace(/\.git$/, "") : null;
}
