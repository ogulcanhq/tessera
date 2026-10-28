# Tessera

Free, open-source SwiftUI components. Install them as a Swift package or copy the source into your app. Each component is accessible, works in light and dark mode, and is previewed from a real iOS Simulator recording.

> **Status:** pre-release. The first component, Animated Button, is available in beta from `main`; there is no tagged release yet. "Tessera" is a working name.

## Use it

**Swift Package Manager** (iOS 17+, Swift 6). There's no tagged release yet, so this follows `main`, which can change without notice. Once a version is released, depend on it (`from: "x.y.z"`) instead.

```swift
.package(url: "https://github.com/ogulcanhq/tessera", branch: "main")
// target dependency:
.product(name: "Tessera", package: "tessera")
```

```swift
import Tessera
```

**Copy the source.** Each component page on the website lists its files and shows their exact source.

## Repository

| Path | What it is |
| --- | --- |
| `Package.swift`, `Sources/Tessera/` | The Swift package, which holds the only implementation of every component |
| `Tests/` | Swift Testing unit tests |
| `apps/showcase/` | Native iOS Showcase app, also used to capture previews |
| `apps/web/` | Next.js website (static export) |
| `registry/` | Component metadata, docs and preview media that point at `Sources/` |
| `scripts/registry/` | Registry schema, validation and website data generation |
| `docs/` | Architecture, plan, decisions and guides |

## Develop

Requirements: Xcode 26.2 with the iOS 26.2 Simulator, Node 22.18+ (24 LTS recommended).

```bash
git clone https://github.com/ogulcanhq/tessera.git && cd tessera
make bootstrap        # npm ci
make verify           # everything CI runs
npm run dev           # website at http://localhost:3000
open apps/showcase/TesseraShowcase.xcodeproj
```

`make help` lists all tasks.

### Continuous integration

Pull requests to `main`, pushes to `main` and manual runs start two GitHub Actions workflows:

| Workflow | Runner | Runs |
| --- | --- | --- |
| [Swift](.github/workflows/swift.yml) | macOS 26, Xcode from `.xcode-version` | Formatting lint, package tests, Showcase build and UI tests, copy-paste compile check |
| [Website & registry](.github/workflows/web.yml) | Ubuntu | Registry validation, tooling tests, typecheck, lint, website build |

Together they run the same checks as `make verify`. Possibly stale previews are reported as warnings, not failures. If a Swift job fails, its test results (`.xcresult`) are attached to the run. Hosted macOS runners are slower than a local Mac and their Xcode and Simulator set changes with each image update; see [CONTRIBUTING.md](CONTRIBUTING.md#continuous-integration).

## Deploy (Vercel)

The website is a static export, with no server code. To deploy it, create a Vercel project from this repository with:

- **Root Directory:** `apps/web`
- **Framework:** Next.js (detected), build command `npm run build` (from `apps/web/vercel.json`)
- **Include files outside the root directory:** enabled (the default). The build reads `registry/`, `scripts/` and `Sources/`.

Install snippets and GitHub links come from `"repository"` in the root `package.json`.

## Documentation

- [Architecture](docs/architecture.md), [implementation plan](docs/implementation-plan.md), [technical decisions](docs/technical-decisions.md)
- [Component guidelines](docs/component-guidelines.md)
- [Preview capture](docs/preview-capture.md)
- [Contributing](CONTRIBUTING.md)

## License

[MIT](LICENSE)
