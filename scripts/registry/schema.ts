// Registry schema — the single definition of what registry JSON may contain.
// JSON Schema files in registry/schema/ are generated from this file
// (`npm run registry:schema`) for editor autocomplete.

import { z } from "zod";

export const Id = z
  .string()
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, "must be kebab-case, e.g. animated-button");

const SemVer = z.string().regex(/^\d+\.\d+\.\d+$/, "must be MAJOR.MINOR.PATCH, e.g. 0.1.0");

const SwiftSourcePath = z
  .string()
  .regex(/^Sources\/.+\.swift$/, "must be a repository-relative .swift path under Sources/");

const PreviewImagePath = z
  .string()
  .regex(/^previews\/[a-z0-9-]+\.(png|webp|jpg)$/, "must be previews/<name>.png|webp|jpg");

const PreviewVideoPath = z
  .string()
  .regex(/^previews\/[a-z0-9-]+\.mp4$/, "must be previews/<name>.mp4");

export const Category = z
  .object({
    id: Id,
    title: z.string().min(1),
    description: z.string().min(1),
  })
  .strict();

export const CategoriesFile = z
  .object({
    $schema: z.string().optional(),
    categories: z.array(Category).min(1),
  })
  .strict();

const Dimensions = {
  width: z.number().int().positive().describe("Pixel width of the media file"),
  height: z.number().int().positive().describe("Pixel height of the media file"),
};

export const PreviewMedia = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("image"),
      scheme: z.enum(["light", "dark"]),
      file: PreviewImagePath,
      ...Dimensions,
    })
    .strict(),
  z
    .object({
      kind: z.literal("video"),
      scheme: z.enum(["light", "dark"]),
      file: PreviewVideoPath,
      poster: PreviewImagePath.describe("Still frame shown before playback and with reduced motion"),
      ...Dimensions,
    })
    .strict(),
]);

export const PreviewCapture = z
  .object({
    method: z.enum(["manual", "automated"]),
    device: z.string().min(1).describe("Simulator device, e.g. iPhone 17 Pro"),
    os: z.string().min(1).describe("Simulator runtime, e.g. iOS 26.2"),
    xcode: z.string().min(1).describe("Xcode version used to build the Showcase"),
    capturedAt: z.iso.date(),
    sourceHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .describe("Output of `npm run registry:hash -- <id>` at capture time"),
  })
  .strict();

export const PreviewScenario = z
  .object({
    id: Id.describe("Must match a CaptureScenario id in the Showcase"),
    title: z.string().min(1),
    description: z.string().optional(),
    media: z.array(PreviewMedia).min(1),
    capture: PreviewCapture,
  })
  .strict();

export const Status = z
  .enum(["draft", "beta", "stable", "deprecated"])
  .describe("draft: in development, previews optional. beta/stable/deprecated: previews required.");

export const Component = z
  .object({
    $schema: z.string().optional(),
    id: Id,
    kind: z.literal("component"),
    name: z.string().min(1),
    summary: z.string().min(1).max(160),
    category: Id,
    tags: z.array(Id).max(8).default([]),
    status: Status,
    since: SemVer.optional().describe("First release that contains the component"),
    platforms: z.object({ iOS: z.string().regex(/^\d+\.\d+$/) }).strict(),
    source: z.object({ files: z.array(SwiftSourcePath).min(1) }).strict(),
    dependencies: z
      .object({
        utilities: z.array(Id).default([]),
        frameworks: z.array(z.string().min(1)).default(["SwiftUI"]),
      })
      .strict()
      .default({ utilities: [], frameworks: ["SwiftUI"] }),
    docs: z.literal("docs.mdx").default("docs.mdx"),
    previews: z.array(PreviewScenario).default([]),
    accessibility: z
      .object({
        voiceOver: z.boolean(),
        dynamicType: z.boolean(),
        reduceMotion: z.boolean(),
        notes: z.string().optional(),
      })
      .strict(),
  })
  .strict();

export const Utility = z
  .object({
    $schema: z.string().optional(),
    id: Id,
    kind: z.literal("utility"),
    summary: z.string().min(1).max(160),
    source: z.object({ files: z.array(SwiftSourcePath).min(1) }).strict(),
    dependencies: z
      .object({ utilities: z.array(Id).default([]) })
      .strict()
      .default({ utilities: [] }),
  })
  .strict();

export type Category = z.infer<typeof Category>;
export type Component = z.infer<typeof Component>;
export type Utility = z.infer<typeof Utility>;
export type PreviewScenario = z.infer<typeof PreviewScenario>;
