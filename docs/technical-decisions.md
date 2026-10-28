# Tessera — Technical Decisions

> Status: **Accepted for Phase 1B** (updated after implementation, 2026-10-22). Each decision is lightweight ADR-style.
> Status values: **Proposed** (recommended, awaiting approval) · **Needs approval** (a real choice the owner should make) · **Accepted** · **Superseded**.
> Referenced from [`architecture.md`](./architecture.md) and [`implementation-plan.md`](./implementation-plan.md).

## Index

| ID | Decision | Status |
|---|---|---|
| TD-01 | Monorepo with `Package.swift` at the repository root | Accepted |
| TD-02 | One `Tessera` library target; Core/Components separated by folder; Features as a future separate target | Accepted |
| TD-03 | Swift source is the single source of truth; registry references, never copies | Accepted |
| TD-04 | Registry = per-item JSON + MDX, schema authored in zod | Accepted |
| TD-05 | Copy-paste: declared utilities, one-line import strip, standalone compile check | Accepted (check planned for 1C) |
| TD-06 | Previews captured from the Showcase; manual workflow now, XCUITest automation later | Accepted (revised) |
| TD-07 | Website: Next.js static export, `@next/mdx`, Shiki, registry build copies inputs into the app | Accepted |
| TD-08 | Hosting: Vercel | Accepted (not yet connected) |
| TD-09 | Showcase: plain Xcode project with synchronized folders and a local package reference | Accepted |
| TD-10 | Testing: Swift Testing (unit), XCUITest (launch modes + accessibility audit), node:test (registry) | Accepted |
| TD-11 | Zero third-party runtime dependencies; minimal tooling dependencies | Accepted |
| TD-12 | Single SemVer version for the repo, Git tags without `v` prefix, website deploys from `main` | Accepted |
| TD-13 | Tooling: Node with native TypeScript, **npm workspaces**, Makefile entry point, `swift format` | Accepted (revised) |
| TD-14 | CI: GitHub Actions split by path (macOS for Swift, Linux for web/registry) | Accepted |
| TD-15 | Preview media committed to Git with size budgets (no LFS) | Accepted |
| TD-16 | Localization: caller-supplied text; English defaults; no shared localization utility yet | Accepted (revised) |
| TD-17 | Accessibility enforced by checklist + automated audit | Accepted |
| TD-18 | License: MIT with SPDX headers in every Swift file | Accepted |
| TD-19 | iOS 17+ only | Accepted |
| TD-20 | No prefix on component types; `Tessera` prefix on utilities | Accepted |
| TD-21 | Contribution workflow: proposal issue → PR with checklist | Accepted |
| TD-22 | AI-agent friendliness via conventions, `AGENTS.md`, and one verify command | Accepted |
| TD-23 | Empty-registry placeholder route for static export | Accepted |

---

## TD-01 — Monorepo with `Package.swift` at the repository root

**Context.** SPM resolves a package from a Git URL and expects `Package.swift` at the repository root. The repo must also hold the website, Showcase app, registry, and tooling.

**Decision.** One repository. `Package.swift`, `Sources/`, `Tests/` at the root; `apps/web`, `apps/showcase`, `registry/`, `scripts/` alongside.

**Rationale.** Consumers can add `https://github.com/ogulcanhq/tessera` directly. Source, docs, previews, and website change atomically in one PR, so they cannot drift.

**Alternatives.**
- *Package in `packages/swift/`*: cleaner tree, but SPM can't consume a subdirectory — would need a mirror repo synced by CI.
- *Separate repos (package / site / app)*: multiplies release coordination; defeats single source of truth.

**Trade-offs.** SPM clones the whole repository, including web code and preview media, into consumers' caches. Mitigated by media size budgets (TD-15). If clone size becomes a real complaint, a CI-synced mirror repo containing only the package can be added later without changing the source layout.

---

## TD-02 — One `Tessera` target; folder separation; Features as a future separate target

**Context.** Components must be clearly separated from Features, and shared utilities from components. Module boundaries enforce separation but add `import` lines that break copy-paste and force `public` on shared internals.

**Decision.**
- MVP has one library target, `Tessera`, with `Core/` and `Components/` folders. Consumers write `import Tessera`.
- When the first Feature arrives, add a `TesseraFeatures` target depending on `Tessera`. This boundary is worth a module because Features are larger, own strings and state, and must never be imported by Components.
- Core vs Components separation is enforced by the standalone copy-paste check (TD-05): a component compiles with only its declared utilities, so undeclared coupling fails CI.

**Rationale.** One import for consumers, no `public`-for-internal-use leakage, no cross-module plumbing in the MVP. The single real boundary (Features → Components) gets a real module when it exists.

**Alternatives.**
- *`TesseraCore` + `TesseraComponents` targets*: enforces Core boundary at compile time, but Core utilities must become `public` API, consumers may need two imports, and copy-paste needs more transforms.
- *One target per component*: maximum granularity and smallest binaries for consumers who want one component; heavy `Package.swift` maintenance and a umbrella re-export via the underscored `@_exported import`.

**Trade-offs.** Consumers link all components even if they use one (dead-code stripping limits the cost). The folder-per-component layout makes a later split mechanical. Note: never declare a type named `Tessera` — a type that shares the module name breaks module-qualified lookups (`Tessera.AnimatedButton`).

---

## TD-03 — Swift source is the single source of truth

**Context.** The same component appears in the package, the Showcase, the website's source viewer, the copy-paste bundle, and preview media. Duplicates drift.

**Decision.** Swift code exists only under `Sources/`. The registry references files by path. The website reads file contents at build time. The Showcase links the local package. Preview media is derived from the Showcase and stamped with a source hash.

**Rationale.** Every surface is either the source or a reproducible derivative of it. Drift is detectable (hash mismatch, standalone check) rather than prevented by discipline.

**Alternatives.**
- *Registry holds the canonical Swift (shadcn-style), package generated from it*: makes the package a build artifact; Xcode tooling and SPM consumers then depend on a generation step.
- *Hand-maintained copy-paste versions*: guaranteed drift.

**Trade-offs.** The website build depends on files outside `apps/web`, handled by the registry build step (TD-07).

---

## TD-04 — Registry format: per-item JSON + MDX, zod-authored schema

**Context.** Metadata must be machine-readable by Node tooling (website, checks) and easy for humans and agents to edit.

**Decision.** `registry/<kind>s/<id>/component.json` (metadata) + `docs.mdx` (prose) + `previews/` (media). The schema is written once in zod (`scripts/registry/schema.ts`); JSON Schema files are generated into `registry/schema/` and referenced via `$schema` for editor autocomplete and validation.

**Rationale.** JSON is universally parseable, strict, and diff-friendly. Separating metadata from prose keeps MDX free of large frontmatter and lets tools read metadata without an MDX parser. zod gives typed loaders for the website and a single schema definition.

**Alternatives.**
- *MDX frontmatter only*: one file per item, but nested structures (scenarios, dependencies) are awkward in YAML frontmatter and every consumer needs a frontmatter parser.
- *YAML*: friendlier to write, more ambiguous to parse, extra dependency.
- *Swift-side metadata (e.g. a Swift registry file)*: Node tooling can't read it without running Swift.
- *Content frameworks (Contentlayer, Velite, Fumadocs)*: Contentlayer is unmaintained; others are viable but add a layer the MVP doesn't need.

**Trade-offs.** Two files per item instead of one. Showcase catalog parity is checked by text search rather than codegen — simple, slightly brittle; upgrade to codegen if it causes problems.

---

## TD-05 — Copy-paste strategy

**Context.** Users must be able to paste a component into an app without the package. Components may use shared utilities. The package and pasted code must behave the same.

**Decision.**
1. Components declare utilities in `component.json`; the resolver appends the transitive closure of utility files to the bundle. *(Implemented: `scripts/registry/load.ts`.)*
2. Components cannot depend on other components → bundles are always flat.
3. The only source transform is removing `import Tessera` / `import TesseraFeatures` lines. *(Implemented and tested.)*
4. Where package vs app behavior must differ, use `#if SWIFT_PACKAGE`, isolated in a utility. Not needed yet: the first component avoids package resources (TD-16).
5. If package strings are introduced later, use `String(localized:defaultValue:bundle:)` so pasted code works without String Catalog entries.
6. *(Implemented in Phase 1C: `make standalone`, run in CI.)* `scripts/standalone/check.ts` typechecks every bundle as separate files and as one concatenated file, with `xcrun --sdk iphonesimulator swiftc -typecheck -swift-version 6 -target arm64-apple-ios17.0-simulator`, without `SWIFT_PACKAGE`.

**Rationale.** Copy-paste correctness becomes a CI property, not a hope. The transform is one regex, so the displayed source is auditable against GitHub.

**Alternatives.**
- *Inline utilities into each component*: no shared files, but duplicate code inside the package and identical helpers diverging over time.
- *AST-level rewriting* (rename symbols, inline dependencies): powerful, but custom infrastructure with high maintenance.
- *Generate a temporary SPM package for the check*: simpler toolchain setup, but `SWIFT_PACKAGE` would be defined, so it wouldn't test the app-target path.

**Trade-offs.** `#Preview` macros require the Xcode macro plugin path during `swiftc -typecheck`; if plain `swiftc` can't find it, the check passes `-plugin-path` from the active toolchain, or falls back to a generated app-target project. Resolved in Phase 1C (risk R-04): plain `xcrun swiftc -typecheck` with Xcode 26.2 expands and typechecks `#Preview` bodies without extra flags, so no fallback is needed. Pasting two components that share a utility produces a duplicate file the user must skip — mitigated by stable file names and a "shared — paste once" label.

---

## TD-06 — Preview capture workflow

**Context.** The website must show genuine renders of SwiftUI components, including animation.

**Revision (Phase 1B).** Full automation is deferred until the first component works. Implemented now: capture mode and a manual, documented workflow (`docs/preview-capture.md`) using `simctl` and ffmpeg, verified end-to-end on Xcode 26.2 / iPhone 17 Pro / iOS 26.2. Capture metadata is stored inline in `component.json` with `method: "manual"`; there is no separate `manifest.json`. The automation below remains the target design.

**Revision (Phase 1C).** A minimal version of the target design is implemented: `PreviewCaptureTests` (skipped unless run by the script) performs real touches, and `scripts/previews/capture.sh` records with `simctl`, locates the first touch from the video content (ffmpeg `freezedetect` on the band around the component, because recorder and wall-clock timelines differ), converts the variable-frame-rate recording to 30 fps before trimming, and writes MP4 + PNG poster (last frame, accurate BT.709 conversion so it matches the stage color). Metadata is still written by hand, with `method: "automated"`. There is no `previews.config.json`, `simctl ui` appearance switching (capture mode's launch argument sets the scheme) or still export from `.xcresult`.

**Decision (target design).**
- The Showcase has a **capture mode** (launch arguments) that renders a single scenario on a chrome-free `CaptureStage`.
- `TesseraShowcaseUITests/CaptureTests` drives real interactions per scenario and captures stills via `XCUIScreen.main.screenshot()`.
- `scripts/previews/capture.ts` orchestrates: boot a pinned device/runtime (`previews.config.json`), set appearance (`simctl ui <udid> appearance dark|light`), override status bar, `simctl io recordVideo` around `xcodebuild test-without-building`, trim to timestamp markers the test prints, crop and encode with ffmpeg (H.264 MP4 + WebP poster), export stills from the `.xcresult` (`xcrun xcresulttool export attachments`), write `manifest.json` with a source hash.
- Run **locally by the maintainer** when a component changes; CI only verifies presence and freshness.

**Rationale.** Uses only Apple tools plus ffmpeg. Real touches mean press states are genuine. Local capture avoids flaky, slow macOS CI runs and keeps media changes reviewable in PRs.

**Alternatives.**
- *SwiftUI `ImageRenderer` frames → video*: no Simulator needed, but doesn't render interactive states or some effects faithfully, and isn't a "genuine Simulator preview".
- *Self-driving demos without XCUITest* (scenario animates programmatically): simpler, but press feedback triggered by real touches can't be shown.
- *Capture in CI*: reproducible environment, but slow (~15+ min), more fragile, and media would need a bot commit.
- *Manual screen recording*: acceptable fallback for one component; doesn't scale.

**Trade-offs.** Timing between recording and test is approximate (marker-based trim). Needs ffmpeg (`brew install ffmpeg`) on the capture machine. Contributors without the pinned simulator runtime can't regenerate media identically — the maintainer recaptures before release.

---

## TD-07 — Website: Next.js static export, `@next/mdx`, Shiki

**Context.** Static-first, no backend; MDX docs; must display source and media from outside the web app directory.

**Decision.**
- Next.js App Router with `output: "export"`; `images.unoptimized: true` (media is pre-optimized by the capture pipeline).
- `scripts/registry/build.ts` runs before `next build` and writes `apps/web/.generated/` (registry JSON, copied MDX, a generated `docs-map.ts` of static imports) and `apps/web/public/previews/`. Both are gitignored.
- MDX compiled by the official `@next/mdx`; components injected via `mdx-components.tsx`.
- Source highlighting with Shiki in Server Components at build time (zero client JS for code).
- Tailwind CSS for styling.

**Rationale.** Static export is the simplest possible runtime: a folder of files deployable anywhere. Copying inputs into the app avoids bundler configuration for imports outside the project root (Turbopack root, transpilation of external MDX). Official MDX package minimizes third-party risk.

**Alternatives.**
- *Server rendering / ISR on Vercel*: no benefit without dynamic data.
- *Fumadocs / Nextra*: fast docs scaffolding and built-in search, but opinionated layouts that fight a media-first catalog design.
- *`next-mdx-remote`*: reads MDX at runtime from any path; adds a dependency whose maintenance has been uneven.
- *Astro*: excellent for static content sites, but the brief specifies Next.js.

**Trade-offs.** No Next.js image optimization, middleware, or API routes (none needed). A generated directory means `dev` and `build` must run the registry build first; the web app's `dev`, `build` and `typecheck` scripts do this explicitly (npm doesn't need pre-script hooks for it).

---

## TD-08 — Hosting

**Decision (accepted).** Vercel, Git-connected, project root `apps/web`, build command `npm run build` (registry build, then `next build`; set in `apps/web/vercel.json`). Preview deployment per PR. Prepared but not connected in Phase 1B.

**Alternatives.** GitHub Pages via an Actions workflow (no extra account, no per-PR previews without extra work); Cloudflare Pages; Netlify. All work because the output is static.

**Trade-offs.** Vercel's Hobby plan is for non-commercial use, which fits a free OSS project; switching hosts later is trivial.

---

## TD-09 — Showcase project format

**Context.** Xcode project files cause merge conflicts; generators (XcodeGen, Tuist) add tools contributors must install.

**Decision.** Plain `TesseraShowcase.xcodeproj` using Xcode 16+ **synchronized folders** (file additions don't touch `project.pbxproj`), with a local package reference to the repo root. App + UI test targets only.

**Alternatives.** XcodeGen/Tuist (reproducible project, extra dependency); an SPM executable/"app playground" (`.swiftpm`) (limited UI test support).

**Trade-offs.** `project.pbxproj` still changes for build-setting edits, rare after Phase 1B.

---

## TD-10 — Testing strategy

**Decision.**

| Layer | Tool | Location | Runs in CI |
|---|---|---|---|
| Component logic (state machines, calculations) | Swift Testing (`import Testing`) | `Tests/TesseraTests` | Yes |
| Builds | `xcodebuild build` (package + Showcase) | — | Yes |
| Copy-paste correctness | `scripts/standalone/check.ts` | — | From Phase 1C |
| Accessibility | `performAccessibilityAudit()` on the catalog now; per capture scenario from Phase 1C | `TesseraShowcaseUITests` | Yes |
| Showcase launch modes | XCUITest smoke tests (catalog, capture mode) | `TesseraShowcaseUITests` | Yes |
| Preview capture | `CaptureTests` | `TesseraShowcaseUITests` | No (local, maintainer) |
| Registry | zod validation + integrity checks; `node:test` suite on a fixture registry | `scripts/registry/` | Yes |
| Website | `tsc --noEmit`, ESLint, `next build` | `apps/web` | Yes |

To make logic testable, components extract non-trivial state into plain value types (e.g. `AnimatedButtonPhase`) tested without rendering.

**Alternatives.** Snapshot testing (swift-snapshot-testing) — valuable for visual regression, but declaring it in `Package.swift` makes every consumer resolve it. If adopted, it goes in the Showcase project. ViewInspector — introspects SwiftUI internals, brittle across OS versions.

**Trade-offs.** No automated visual regression in the MVP; captured previews in PR diffs serve as the visual record.

**Finding (Phase 1B).** The accessibility audit flagged Apple's `ContentUnavailableView` title (Dynamic Type) and `.secondary` body text (contrast) on iOS 26. The Showcase uses a custom empty state instead. Component authors should expect the same audit strictness.

---

## TD-11 — Dependency policy

**Decision.**
- **Swift runtime:** zero third-party dependencies. Apple frameworks only.
- **Swift tooling:** `swift format` bundled with the toolchain; no SwiftLint.
- **Web:** `next`, `react`, `react-dom`, `tailwindcss` (+ `@tailwindcss/turbopack`), `@next/mdx` (+ `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx`), `remark-gfm`, `shiki`, TypeScript, ESLint (`eslint-config-next`). Root tooling: `zod`, `typescript`, `@types/node`. New dependencies need a justification in the PR.
- **System tools for capture:** Xcode, ffmpeg.
- Dependabot for npm and GitHub Actions; lockfile committed.

**Rationale.** Consumers adopt a UI library more readily when it adds nothing to their dependency graph; fewer packages, fewer supply-chain and upgrade risks.

---

## TD-12 — Versioning and release strategy

**Decision.**
- One SemVer version for the whole repo (package, registry, website). Pre-1.0: minor bumps may break, documented in `CHANGELOG.md` (Keep a Changelog format).
- Tags are bare SemVer (`0.1.0`), which SPM resolves most reliably.
- Release = update `CHANGELOG.md` + registry `since` fields → tag → GitHub Release (notes only). The Showcase is distributed as source; no binaries or code signing.
- Website production deploys from `main`. Items whose `since` is newer than the latest tag show an **Unreleased** badge, and install snippets show the latest tag, so SPM users aren't told to use code they can't resolve yet.

**Alternatives.** Per-component versions (complex for solo dev, SPM can't express it); website deploying only from tags (accurate, but slows doc fixes and needs a release branch).

**Trade-offs.** Copy-paste users on the website may copy unreleased code from `main` — acceptable and labeled.

---

## TD-13 — Tooling and task runner

**Decision.**
- Scripts in TypeScript, run with Node's built-in type stripping (Node 24 LTS, pinned in `.nvmrc` and `engines`) — no `tsx`/`ts-node`.
- **npm workspaces** (`apps/web` + root scripts), lockfile `package-lock.json`. *Revised from pnpm:* Node 25+ no longer bundles Corepack and pnpm wasn't installed; npm ships with Node, so contributors need nothing extra.
- A root `Makefile` is the language-neutral entry point (`make test`, `make standalone`, `make previews ID=animated-button`, `make verify`).
- Xcode version pinned in `.xcode-version` and in CI.

**Alternatives.** Turborepo/Nx (unneeded for one JS app); Swift scripts (`swift run`) for tooling (slower iteration for JSON/MDX work); bash only (fragile for JSON handling).

---

## TD-14 — CI/CD

**Decision.** GitHub Actions, path-filtered:

| Workflow | Runner | Triggers on | Steps |
|---|---|---|---|
| `swift.yml` | `macos-26`, Xcode from `.xcode-version` | `Package.swift`, `Sources/**`, `Tests/**`, `apps/showcase/**`, `.swift-format`, `Makefile` | `make lint-swift`, `make test-swift`, `make test-showcase` (destination pinned by device name, not OS) |
| `web.yml` | `ubuntu-latest` | `apps/web/**`, `registry/**`, `scripts/**`, `Sources/**`, `apps/showcase/TesseraShowcase/**` | `npm ci`, registry check, registry tests, typecheck, lint, `next build` |
| Deploy | Vercel Git integration | `main` + PRs | — |

**Rationale.** macOS minutes are free for public repositories but slow; path filters keep docs-only PRs fast.

**Trade-offs.** The workflows have not run on GitHub yet (nothing is pushed); the `macos-26` label and `/Applications/Xcode_26.2.app` path must be confirmed on the first run. Runner image names and available simulator runtimes change yearly; destination strings live in one place (`Makefile` variables) to make updates a one-line change.

---

## TD-15 — Preview media storage

**Decision (accepted).** Commit optimized media to `registry/components/<id>/previews/` without Git LFS. Budgets enforced by `registry:check`: images ≤ 400 KB, MP4 ≤ 1.5 MB; guidance ≤ 6 s, 30 fps, 900×900 square crop of the capture stage. (Budgets were raised from the Phase 1A proposal to fit PNG stills and H.264 output from the manual workflow; tighten once real media sizes are known.)

**Alternatives.**
- *Git LFS*: keeps history small, and SPM doesn't fetch LFS objects (so consumers' clones stay lean); but requires LFS setup for contributors and the host, and has GitHub bandwidth quotas.
- *External storage (Vercel Blob, S3, R2)*: smallest repo; adds credentials, an upload step, and an external service.
- *GitHub Release assets*: free hosting; awkward linking and versioning.

**Trade-offs.** Plain Git is simplest now; every recapture adds to history permanently. At ~100 components with occasional recaptures, the repo stays in tens of MB. Revisit if `.git` exceeds ~300 MB. Migrating to LFS later requires a history rewrite, so if the catalog is expected to grow quickly, choosing LFS now is reasonable.

---

## TD-16 — Localization strategy

**Decision (revised in Phase 1B).**
1. Components take user-visible text and accessibility text from the caller (`LocalizedStringKey`, `Text`, `@ViewBuilder`) — the caller's localization applies automatically.
2. Where a default is unavoidable, use an English default and keep the API open to a caller override. Avoid unnecessary built-in strings.
3. **No shared localization utility and no package String Catalog yet.** `defaultLocalization: "en"` is set so resources can be added later without breaking changes.
4. If package strings become necessary, follow the original design: namespaced keys `tessera.<component>.<key>`, `String(localized:defaultValue:bundle:)`, and a `localization` utility resolving the bundle with `#if SWIFT_PACKAGE`.
5. Documentation is English-only initially.

**Alternatives.** Requiring callers to pass every string (heavy API); English-only hardcoded strings (violates requirement).

---

## TD-17 — Accessibility enforcement

**Decision.** Requirements in `architecture.md` §10 become a PR checklist in `docs/component-guidelines.md`. Automated: `performAccessibilityAudit()` per capture scenario in CI. Manual: VoiceOver pass and Dynamic Type `AX5` check in the Showcase before merge. Website: semantic HTML, keyboard-accessible copy buttons and tabs, `prefers-reduced-motion` respected, captions not needed (previews have no audio), meaningful `aria-label`s on media.

---

## TD-18 — License

**Decision (accepted).** MIT. Every Swift file begins with:

```swift
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors
```

**Rationale.** Copy-paste is a primary distribution channel; MIT is the most frictionless permissive license and the header travels with pasted code, preserving attribution. (Strictly, MIT asks for the full notice in substantial copies; the website's copy-paste section links the full license text.)

**Alternatives.** Apache-2.0 (explicit patent grant, longer notice requirements); MPL-2.0 (file-level copyleft — friction for app developers); public domain/CC0 (no attribution).

---

## TD-19 — Platforms

**Decision (accepted).** `platforms: [.iOS(.v17)]` only. Components avoid UIKit where SwiftUI suffices so future macOS/visionOS support is incremental.

**Trade-off.** Declaring `.macOS(.v14)` too would allow fast `swift test` on the host without a Simulator, but commits every component to compiling on macOS from day one. Tests instead run through `xcodebuild test` on an iOS Simulator destination.

---

## TD-20 — Naming

**Decision.** Component types use plain descriptive names (`AnimatedButton`), matching SwiftUI conventions and reading naturally in user code. Utilities, which users rarely touch directly and which are likely to collide, use a `Tessera` prefix or namespace (`Bundle.tessera`, `TesseraHaptics`). Localization keys are prefixed `tessera.`.

**Trade-off.** A pasted `AnimatedButton` may collide with an existing type in a user's app; they can rename it. Package users can disambiguate with `Tessera.AnimatedButton` (hence: no type named `Tessera`, TD-02).

---

## TD-21 — Contribution workflow

**Decision.**
1. New components start as a **Component proposal** issue (template: problem, API sketch, accessibility considerations, reference video). Maintainer approves scope before code.
2. Fork → branch → PR using the PR template checklist (registry entry, docs, Showcase demo, previews, tests, accessibility, localization, standalone check).
3. Contributors who can't capture previews mark the checkbox as "needs capture"; the maintainer captures before merge.
4. Conventional, short commit messages; squash merge.
5. No CLA; contributions under the project license (inbound = outbound). DCO sign-off optional — can be added if the project grows.
6. `CODE_OF_CONDUCT.md` (Contributor Covenant), `SECURITY.md`.

---

## TD-22 — AI-agent friendliness

**Decision.**
- Deterministic paths derived from the registry id (architecture §2 naming table).
- `AGENTS.md` at the root: conventions, "how to add a component" steps, commands, and a definition of done. (A `CLAUDE.md` can simply reference it.)
- Machine-readable schemas with `$schema` references.
- One command for full verification: `make verify`, with clear, actionable error messages from every check.
- Small files: one primary type per file.

**Rationale.** Agents (and new contributors) succeed when the next step is discoverable from the repository and success is checkable by a single command.

---

## TD-23 — Empty-registry placeholder route

**Context.** With `output: "export"`, Next.js fails the build when `generateStaticParams()` returns an empty array — which is the case for `/components/[id]` until the first component exists.

**Decision.** When the registry is empty, return a single placeholder param (`_none`) that renders the 404 page (`app/components/[id]/page.tsx`). It disappears automatically once a component exists.

**Alternatives.** Commit a fixture component to the real registry (would ship fake content); disable static export (adds a server for no reason); delete and re-add the route (breaks "ready for the first component").

**Trade-offs.** The empty-state build emits an extra `out/components/_none.html` containing the 404 page.
