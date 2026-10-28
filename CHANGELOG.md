# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/). Before 1.0, minor versions may contain breaking changes.

## [Unreleased]

### Added

- `AnimatedButton`: a button that runs an async action, with spring press feedback, loading, success and failure states, haptics, VoiceOver announcements and Reduce Motion support (beta).
- Scripted Simulator preview capture (`scripts/previews/capture.sh`) and a standalone copy-paste compile check (`make standalone`).
- Swift package `Tessera` (iOS 17+, Swift 6) with `Core/` and `Components/` structure and a test target.
- Showcase app with component catalog, playground environment controls and chrome-free capture mode.
- Component registry: zod schema, generated JSON Schemas, validation and website data generation.
- Website: home, component catalog with search and category filters, ⌘K search palette, component detail pages with a full-width preview stage, documentation, source viewer with copy, light and dark themes.
- CI workflows for Swift and the website.
