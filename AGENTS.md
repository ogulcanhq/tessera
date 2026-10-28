# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository.

## What this is

Tessera: SwiftUI components distributed as a Swift package **and** as copy-paste source, demonstrated in a native Showcase app, and cataloged on a static Next.js website. Read `docs/architecture.md` before structural changes.

## Ground rules

- **Swift source in `Sources/` is the single source of truth.** Never duplicate component code elsewhere. The registry and website reference it.
- **No third-party Swift dependencies.** Apple frameworks only.
- **Components never depend on other components.** Shared code goes in `Sources/Tessera/Core/<Name>/` and is declared in the component's `dependencies.utilities`.
- **Previews must be genuine Simulator captures** (`docs/preview-capture.md`). Never add mock, rendered or placeholder images as previews.
- Don't add a backend, database, auth, CLI or MCP server.
- Swift 6 language mode, iOS 17 deployment target. Don't declare a type named `Tessera`.

## Layout and naming

For a component with registry id `animated-button`:

| What | Path |
| --- | --- |
| Swift source | `Sources/Tessera/Components/AnimatedButton/AnimatedButton.swift` (+ helpers in the same folder) |
| Unit tests | `Tests/TesseraTests/AnimatedButton*Tests.swift` |
| Registry metadata | `registry/components/animated-button/component.json` |
| Docs | `registry/components/animated-button/docs.mdx` |
| Preview media | `registry/components/animated-button/previews/` |
| Showcase demo | `apps/showcase/TesseraShowcase/Demos/AnimatedButton/` |
| Showcase entry | `apps/showcase/TesseraShowcase/Catalog/Catalog.swift` (`id: "animated-button"`) |

## Adding a component

1. Write the component in `Sources/Tessera/Components/<Name>/` with `#Preview`s and an SPDX header. Follow `docs/component-guidelines.md`.
2. Add unit tests for non-trivial logic (extract state machines into plain value types).
3. Add a demo and capture scenarios in `apps/showcase/TesseraShowcase/Demos/<Name>/` and an entry in `Catalog.swift`.
4. Add `registry/components/<id>/component.json` (`"$schema": "../../schema/component.schema.json"`) with `status: "draft"` and `docs.mdx`.
5. Capture light and dark previews (`docs/preview-capture.md`), add them to `component.json`, then change status to `beta`.
6. Run `make verify`.

## Commands

| Task | Command |
| --- | --- |
| Everything CI runs | `make verify` |
| Swift package tests | `make test-swift` |
| Showcase build / UI tests | `make build-showcase` / `make test-showcase` |
| Swift formatting | `make format` / `make lint-swift` |
| Validate registry | `npm run registry:check` |
| Registry tooling tests | `npm run test:scripts` |
| Source hash for previews | `npm run registry:hash -- <id>` |
| Record a preview | `scripts/previews/capture.sh <id> <scenario> light\|dark` |
| Copy-paste compile check | `make standalone` |
| Regenerate JSON Schemas | `npm run registry:schema` (after editing `scripts/registry/schema.ts`) |
| Website dev / build | `npm run dev` / `npm run build:web` |
| Website with fixture data | `npm run build:fixture -w web` |

Simulator destination defaults to iPhone 17 Pro, iOS 26.2. Override with `make test-swift DEST='platform=iOS Simulator,name=…'`.

## Website notes

- Next.js 16 App Router, static export (`output: "export"`). No server features (route handlers, server actions, ISR, rewrites).
- Data comes from `apps/web/.generated/` (gitignored), written by `scripts/registry/build.ts`, which runs before `dev`/`build`.
- `apps/web/AGENTS.md` is maintained by Next.js; read the bundled docs in `node_modules/next/dist/docs/` before using Next.js APIs.
