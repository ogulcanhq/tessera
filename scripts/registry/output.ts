// Shape of apps/web/.generated/registry.json, written by build.ts.
// The website imports these types (type-only), so this file must stay free of
// runtime code and Node imports.

export type RegistryOutput = {
  /** Repository version from the root package.json. */
  version: string;
  /** Highest SemVer Git tag, or null before the first release. */
  latestRelease: string | null;
  /** From the root package.json `repository` field, or null if not configured yet. */
  repositoryUrl: string | null;
  categories: CategoryOutput[];
  components: ComponentOutput[];
};

export type CategoryOutput = {
  id: string;
  title: string;
  description: string;
  componentCount: number;
};

export type ComponentStatus = "draft" | "beta" | "stable" | "deprecated";

export type ComponentOutput = {
  id: string;
  name: string;
  summary: string;
  category: string;
  tags: string[];
  status: ComponentStatus;
  since: string | null;
  /** True when `since` is at or below the latest release tag. */
  released: boolean;
  platforms: { iOS: string };
  frameworks: string[];
  accessibility: { voiceOver: boolean; dynamicType: boolean; reduceMotion: boolean; notes?: string };
  /** Copy-paste bundle: component files first, then required utilities. */
  files: SourceFileOutput[];
  /** All bundle files concatenated into one valid Swift file. */
  singleFile: string;
  previews: PreviewOutput[];
};

export type SourceFileOutput = {
  name: string;
  /** Repository-relative path of the original file. */
  path: string;
  role: "component" | "utility";
  /** Registry id of the item that owns the file. */
  owner: string;
  /** Copy-paste source: identical to the repository file minus `import Tessera` lines. */
  content: string;
};

export type PreviewOutput = {
  id: string;
  title: string;
  description?: string;
  capture: {
    method: "manual" | "automated";
    device: string;
    os: string;
    xcode: string;
    capturedAt: string;
  };
  media: PreviewMediaOutput[];
};

export type PreviewMediaOutput =
  | { kind: "image"; scheme: "light" | "dark"; src: string; width: number; height: number }
  | { kind: "video"; scheme: "light" | "dark"; src: string; poster: string; width: number; height: number };
