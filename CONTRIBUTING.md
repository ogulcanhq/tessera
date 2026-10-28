# Contributing to Tessera

Thanks for helping. Tessera is small on purpose: every component should be production quality, accessible and easy to read.

## Before you start

- **New component?** Open a *Component proposal* issue first. Describe the problem, sketch the API and note accessibility considerations. Wait for agreement on scope before writing code.
- **Bug or docs fix?** Open a pull request directly.

## Setup

Requirements: Xcode 26.2 with the iOS 26.2 Simulator, and Node 22.18+ (24 LTS recommended).

```bash
git clone https://github.com/ogulcanhq/tessera.git && cd tessera
make bootstrap
make verify
```

`make verify` runs everything CI runs. While working, run the part you touched:

| Changed | Run |
| --- | --- |
| Swift source or tests | `make lint-swift test-swift` (`make format` fixes formatting) |
| Showcase or UI tests | `make test-showcase` |
| Registry, docs or previews | `npm run registry:check` and `make standalone` |
| Registry tooling | `npm run test:scripts` |
| Website | `make web` |

If your simulator differs, pass a destination: `make test-swift DEST='platform=iOS Simulator,name=iPhone 17'`.

## Pull requests

- Keep each pull request to one component or one fix.
- Follow [docs/component-guidelines.md](docs/component-guidelines.md) and complete the checklist in the PR template.
- If you can't capture Simulator previews, leave that box unchecked and say so. A maintainer will capture them.
- Run `make verify` before pushing. CI runs the same checks.
- Use short, imperative commit messages, for example `Add AnimatedButton reduce-motion fallback`. Pull requests are squash-merged.

## Continuous integration

Every pull request to `main` runs two GitHub Actions workflows: **Swift** on a hosted macOS runner and **Website & registry** on Ubuntu. Both must pass before merging. You can also start them from the Actions tab.

- A macOS run takes much longer than the website run, mostly for the Showcase UI tests.
- The runner uses the Xcode version in `.xcode-version` and the Makefile's simulator (iPhone 17 Pro, iOS 26.2). GitHub updates its macOS images over time; if that Xcode or simulator is removed, the *Select Xcode* step fails and lists what's available.
- If the Swift job fails, download the `xcresult` artifact from the run and open it in Xcode.
- A *preview may be stale* warning on your pull request means the component source changed since its previews were recorded. It doesn't fail CI; see [docs/preview-capture.md](docs/preview-capture.md).
- CI has no haptics, no VoiceOver speech and no real device, so check those by hand on a device for interaction changes.

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
