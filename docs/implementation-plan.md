# Tessera — Implementation Plan

> Status: **Phase 1E complete** (2026-10-28): [github.com/ogulcanhq/tessera](https://github.com/ogulcanhq/tessera) is public and both CI workflows pass on `main`. Hosting and the release dry run wait for approval.
> Companion documents: [`architecture.md`](./architecture.md), [`technical-decisions.md`](./technical-decisions.md).

## Overview

| Phase | Goal | Status |
|---|---|---|
| **1A — Architecture** | Planning documents | Done |
| **1B — Foundation** | Package, Showcase, registry, website and CI working with zero components | **Done** |
| **1C — Animated Button** | One component end-to-end through every surface | **Done** |
| **1D — Validation** | Prove the slice works for users and contributors; connect hosting | Local validation done; hosting and release need approval |
| **1E — Repository & CI** | Publish the repository; CI running on GitHub | **Done** |

### Approved decisions (start of Phase 1B)

Temporary name "Tessera" · MIT · iOS 17+ · Swift 6/SwiftUI · SPM · Next.js App Router, TypeScript, Tailwind CSS, MDX · monorepo · preview media in Git without LFS · Vercel hosting · English-only docs · Showcase distributed as source · no backend, database, auth, CLI or MCP.

### Scope changes applied in Phase 1B

- **Preview capture:** capture-mode architecture and a documented manual workflow only; XCUITest automation deferred until after the first component.
- **Localization:** no shared localization utility; components use caller-provided text and English defaults.
- **Showcase distribution:** no release ZIPs or code signing; runs locally from Xcode.
- **Hosting:** prepared for Vercel; not deployed or connected.
- **Package manager:** npm workspaces instead of pnpm (TD-13).

### Prerequisites (local machine)

- Xcode 26.2 (`.xcode-version`) with the iOS 26.2 Simulator runtime
- Node 22.18+ (`.nvmrc` pins 24 LTS); npm ships with Node
- ffmpeg, only for preview capture (`brew install ffmpeg`)

The default simulator destination lives in the `Makefile` (`DEST ?= platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2`) and can be overridden per command.

---

## Phase 1B — Foundation (complete)

### Delivered

| # | Task | Result |
|---|---|---|
| 1B-1 | Repository scaffolding | Git initialized (`main`, no commits); `.gitignore`, `.editorconfig`, `.nvmrc`, `.xcode-version`, `.swift-format`, `LICENSE` (MIT), `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md` |
| 1B-2 | Swift package | Root `Package.swift` (tools 6.0, Swift 6 mode, iOS 17, `defaultLocalization: "en"`), `Sources/Tessera/{Core,Components}`, `Tests/TesseraTests` (Swift Testing smoke test) |
| 1B-3 | Showcase app | `apps/showcase/TesseraShowcase.xcodeproj` (synchronized folders, local package ref, shared scheme with capture args); catalog, empty state, detail/playground with environment controls, capture mode; UI tests for both launch modes with accessibility audit |
| 1B-4 | Registry | zod schema → generated JSON Schemas; `categories.json`; `check.ts`, `build.ts`, `hash.ts`; fixture registry; 13 `node:test` tests |
| 1B-5 | Standalone copy-paste checker | **Moved to 1C** (no bundle exists to check). Bundle assembly and import stripping are implemented and tested |
| 1B-6 | Preview capture | Capture mode + manual workflow (`docs/preview-capture.md`), verified on the simulator end-to-end (launch, screenshot, record, ffmpeg encode). Automation deferred |
| 1B-7 | Website | Home, catalog with filter + empty state, component detail route, docs (4 pages), preview player, Shiki source viewer, copy buttons, install tabs, light/dark/system theme, responsive; static export; detail route verified with the fixture registry |
| 1B-8 | Task runner | `Makefile` (`help`, `bootstrap`, `format`, `lint-swift`, `test-swift`, `build-showcase`, `test-showcase`, `registry`, `test-scripts`, `web`, `verify`, `clean`) |
| 1B-9 | CI | `.github/workflows/swift.yml` (macOS), `web.yml` (Linux), `dependabot.yml`; not yet run on GitHub |
| 1B-10 | Contributor & agent docs | `CONTRIBUTING.md`, `AGENTS.md`, `docs/component-guidelines.md`, `docs/preview-capture.md`, issue and PR templates |
| 1B-11 | Hosting | `apps/web/vercel.json` + README deploy settings; connection deferred to 1D |

### Acceptance criteria — results

| Criterion | Result |
|---|---|
| Swift package builds and tests without components | ✅ `make test-swift` |
| Showcase builds; launch modes and accessibility audit pass | ✅ `make test-showcase` (2 UI tests) |
| `swift format lint --strict` clean | ✅ |
| Registry validation catches missing/invalid source references, unknown utilities, categories, docs, Showcase entries, missing previews | ✅ fixture tests |
| Website builds as a static export and renders the empty catalog | ✅ `npm run build:web`; checked in a browser in light/dark, desktop/mobile |
| Detail route renders source, copy, install and MDX docs | ✅ `npm run build:fixture -w web` |
| TypeScript typecheck and ESLint clean | ✅ |
| No third-party Swift dependencies | ✅ |

### Verification commands

```bash
make bootstrap          # npm ci
make verify             # lint-swift, test-swift, test-showcase, registry, test-scripts, web
npm run build:fixture -w web && npm run preview -w web   # optional: detail page with fixture data
```

---

## Phase 1C — Animated Button

### Delivered (2026-10-25)

| # | Task | Result |
|---|---|---|
| 1C-1 | Phase model + tests | `AnimatedButtonPhase` (idle, running, succeeded, failed; `start`, `finish`, `reset`, `cancel`) and `Outcome.of(_:)`; 17 Swift Testing tests including duplicate taps, rapid taps, late results and cancellation |
| 1C-2 | Component | `AnimatedButton` as specified, plus a `StringProtocol` initializer and announcement parameters with English defaults ("Done", "Failed") that callers override or set to `nil`; press feedback wraps the caller's button style; indicators overlaid so the size never changes |
| 1C-3 | Showcase | Playground (label, icon, role, style, tint, control size, border shape, outcome, duration, action counter), stage-level Reduce Motion toggle; scenarios `press`, `success`, `failure`; 5 UI tests including accessibility audits of every scenario in both appearances |
| 1C-4 | Registry + docs | `component.json` (now `beta`) and `docs.mdx` |
| 1C-5 | Standalone check | `scripts/standalone/check.ts`, `make standalone`, CI step; R-04 resolved (no plugin path needed) |
| 1C-6 | Preview capture | Scripted: `scripts/previews/capture.sh` + `PreviewCaptureTests`; 3 scenarios × light/dark, 23–30 KB per video |
| 1C-7 | Website | Real catalog entry, single-component spotlight on the home page, detail page with recordings, source, install and docs; copied text verified identical to `Sources/` |

**Differences from the spec above:** three capture scenarios (press, success, failure) instead of two; the result announcements default to short English text rather than `nil`; the Showcase playground also offers button style and an action counter; Reduce Motion in the playground uses SwiftUI's underscored `_accessibilityReduceMotion` setter (Showcase only, never in components).

**Goal:** one component flows through package → Showcase → Simulator capture → website, with docs, source viewing and copy-paste.

### Component specification *(approval requested)*

```swift
public struct AnimatedButton<Label: View>: View {
    public init(
        role: ButtonRole? = nil,
        action: @escaping @MainActor () async throws -> Void,
        @ViewBuilder label: () -> Label
    )
}

extension AnimatedButton where Label == Text {
    public init(_ titleKey: LocalizedStringKey, role: ButtonRole? = nil,
                action: @escaping @MainActor () async throws -> Void)
}
```

| Phase | Visual | Reduce Motion | Accessibility |
|---|---|---|---|
| `idle` | Label | — | Button trait, caller's label |
| pressed | Spring scale-down (~0.96) | Opacity dim, no scale | — |
| `running` | Label cross-fades to `ProgressView`; width held stable; taps ignored | Cross-fade only | `ProgressView` provides the system "in progress" semantics |
| `succeeded` | Checkmark, success haptic (`sensoryFeedback`), back to idle after ~1.2 s | Cross-fade, no bounce | Optional caller-provided announcement |
| `failed` (action threw) | Shake + xmark, error haptic, back to idle | Cross-fade, no shake | Optional caller-provided announcement |

- Strings (TD-16): no package resources. Result announcements are optional parameters (e.g. `successAnnouncement: LocalizedStringKey?`, `failureAnnouncement: LocalizedStringKey?`), defaulting to nil or a minimal English default — final choice in the 1C PR.
- Styling via standard modifiers (`.tint`, `.buttonBorderShape`, `.controlSize`, `.font`).
- Phase transitions in a pure value type `AnimatedButtonPhase`, unit-tested.
- The running task is cancelled when the view disappears.

### Tasks

| # | Task | Details |
|---|---|---|
| 1C-1 | Phase model + tests | `AnimatedButtonPhase.swift`; tests for idle→running, re-entrancy ignored, success/failure, auto-reset, cancellation |
| 1C-2 | Component | `AnimatedButton.swift`: view, convenience init, Reduce Motion branches, haptics, announcements, cancellation, 44 pt target, Dynamic Type; `#Preview`s (idle, success, failure, dark, AX5, RTL) |
| 1C-3 | Showcase | `Demos/AnimatedButton/`: playground (role, tint, size, shape, latency, outcome) and scenarios `default` (press feedback) and `async-success`; entry in `Catalog.swift`; UI test running `performAccessibilityAudit()` on each scenario |
| 1C-4 | Registry + docs | `component.json` (`status: "draft"`), `docs.mdx` (no top-level "Usage" heading) |
| 1C-5 | Standalone copy-paste check | `scripts/standalone/check.ts` + `make standalone` + CI step: `xcrun --sdk iphonesimulator swiftc -typecheck -swift-version 6 -target arm64-apple-ios17.0-simulator` on separate files and the combined file, without `SWIFT_PACKAGE`. Resolve the `#Preview` macro plugin path (risk R-04) |
| 1C-6 | Preview capture | Manual workflow for both scenarios × light/dark; metadata + `sourceHash` in `component.json`; status → `beta` |
| 1C-7 | Website check | Catalog tile and detail page with real media; verify light/dark switching, reduced motion, copy of each file and the combined file |

### Acceptance criteria

1. **SwiftUI implementation** — Swift 6, no warnings, no UIKit, iOS 17; unit tests pass.
2. **In the package** — `import Tessera; AnimatedButton("Save") { … }` compiles in the Showcase.
3. **In the Showcase** — catalog entry, live playground, chrome-free capture scenarios; accessibility audit passes.
4. **Genuine Simulator preview** — captured from the Showcase; hashes match; within budgets.
5. **Preview on the website** — tile and detail player; light/dark; reduced-motion poster.
6. **Actual source on the website** — identical to `Sources/` except `import Tessera` lines (tested).
7. **Copy the source** — per-file and combined copy work; standalone check passes.
8. **Installation and usage docs** — component page + `/docs/installation`.

### Verification commands

```bash
make test-swift && make test-showcase
npm run registry:hash -- animated-button
make standalone
npm run registry:check      # no stale-preview warning
make verify
```

---

## Phase 1D — Validation

### Delivered (2026-10-26)

| # | Result |
|---|---|
| 1D-1 | Not run as a fresh clone: the project isn't a Git repository yet. `make clean && make verify` passes from a clean build state. |
| 1D-2 | A new Xcode app resolved Tessera by Git URL (a local `file://` clone, since nothing is pushed), built with warnings as errors, and passed 4 UI tests. |
| 1D-3 | A second app target with only the website's "All files in one" source built with warnings as errors and passed the same 4 UI tests. `make standalone` covers per-file output. |
| 1D-4 | Source edit → stale-preview warning confirmed. New check: a docs heading that duplicates a page section is an error. |
| 1D-5 | Partly: light, dark, 390 px mobile, Reduce Motion and the table of contents checked in the browser. Lighthouse and VoiceOver + Safari need a deployed page. |
| 1D-6–8 | Blocked: need a public repository URL, Vercel and GitHub access, and approval. |

The consumer tests found one bug: with the default style in a `List` or `Form`, `AnimatedButton` ignored taps, because a list row button is activated by its row and the press gesture blocked that. Fixed in the component (the press gesture also triggers the button; the duplicate-tap guard drops the second trigger), covered by a Showcase UI test, and added to `component-guidelines.md`.

Website polish: a shorter detail stage that crops recordings to 4:3, a table of contents that lists the docs' own sections, catalog cards that play on hover or focus under Reduce Motion, and install snippets marked provisional until `repository` is set.

### Tasks

| # | Task | Details |
|---|---|---|
| 1D-1 | Clean-clone test | Fresh clone → `make bootstrap && make verify` |
| 1D-2 | SPM consumer test | New Xcode app consumes the package by local path, then by Git URL after pushing (needs approval) |
| 1D-3 | Copy-paste consumer test | New app with no package; paste "All files in one" and per-file output; build and run |
| 1D-4 | Drift detection | Edit source → stale-preview warning; undeclared utility → standalone check fails |
| 1D-5 | Website quality | Lighthouse (a11y 100, performance ≥ 90 mobile), keyboard-only, VoiceOver + Safari, both themes |
| 1D-6 | Hosting | Set `repository` in root `package.json`; connect Vercel (needs approval); confirm preview and production deploys |
| 1D-7 | CI on GitHub | First real run of both workflows; fix runner label / Xcode path if needed |
| 1D-8 | Release dry run | CHANGELOG 0.1.0 entry, `since` fields, release checklist; tag only on approval |
| 1D-9 | Retrospective | Update these documents with actual effort and follow-ups (capture automation, budgets) |

### Acceptance criteria

1. Clean clone passes `make verify` without undocumented steps.
2. A new app consumes `AnimatedButton` via SPM and via copy-paste with zero Swift 6 warnings.
3. Drift scenarios are caught with actionable messages.
4. Lighthouse targets met on the deployed component page.
5. CI green on GitHub; Vercel preview deploy works.

---

## Phase 1E — Repository & CI

Covers 1D-1 (fresh clone) and 1D-7 (CI on GitHub). Vercel (1D-6) and the release dry run (1D-8) stay out of scope.

| # | Task | Result |
|---|---|---|
| 1E-1 | Hygiene | `.gitignore` reviewed; secret, personal-data and absolute-path scan of every committed file |
| 1E-2 | Repository URL | `repository` in the root `package.json` drives install snippets and GitHub links; snippets say they track `main` until a release |
| 1E-3 | Workflows | `swift.yml` (macOS 26, Xcode from `.xcode-version`, the Makefile's iPhone 17 Pro / iOS 26.2 destination) and `web.yml` (Ubuntu); PRs to `main`, pushes to `main`, manual runs; read-only token; actions pinned to commit SHAs; xcresult uploaded on failure; registry issues as annotations |
| 1E-4 | Fresh clone | A local clone of the commit passes `make bootstrap && make verify` |
| 1E-5 | Publish | Public repository, pushed to `main`. First runs: Swift passed in 9 min 14 s on Xcode 26.2 (17C52), Website & registry passed |
| 1E-6 | Follow-up | The CI log now lists test counts from each `.xcresult`. Dependabot groups only minor and patch updates, because its first grouped pull request bundled TypeScript 7 and ESLint 10 and failed typecheck |

---

## Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Manual capture is slow and inconsistent between captures | Medium | Medium | Pinned device/runtime, documented commands, crop/encode recipe; automate after 1C |
| R-02 | Copy-paste and package behavior diverge | Medium | High | Single-regex transform (tested); standalone check in 1C |
| R-03 | Repository growth from media | Medium (over time) | Medium | Budgets in `registry:check`; revisit at ~300 MB |
| R-04 | `#Preview` macros don't typecheck with bare `swiftc` | Medium | Low | Resolve plugin path in 1C-5, or generated app-target fallback |
| R-05 | Website shows `main` code newer than the latest release | Medium | Low | Unreleased badge; install snippet tracks the latest tag |
| R-06 | CI runner label / Xcode path differ from assumptions | Medium | Low | Checked against the macOS 26 image's software list; the *Select Xcode* step prints what's installed |
| R-07 | Swift 6 concurrency friction with async closures | Medium | Low | `@MainActor` closures; `Sendable` phase model |
| R-08 | Scope creep before the pipeline is proven | Medium | High | Exactly one component in 1C |
| R-09 | Working name conflicts with existing projects | Unknown | Medium | Decide final name before tagging 0.1.0 |
| R-10 | Strict accessibility audit fails on system views (seen in 1B) | Medium | Low | Custom views where needed; audit runs per scenario |
| R-11 | Next.js 16 static export rejects empty `generateStaticParams` | Resolved | — | Placeholder route (TD-23) |
| R-12 | Dev-only npm audit findings (`eslint-config-next` → `braces`) | Present | Low | Not shipped to users; npm's only fix is a downgrade; track upstream via Dependabot |
