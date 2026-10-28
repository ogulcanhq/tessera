# Component guidelines

What every Tessera component must meet before it merges. The PR template mirrors the checklist at the end.

## API

- Follow SwiftUI conventions: a `View` struct, a `@ViewBuilder` label where content varies, plus a convenience initializer taking a `LocalizedStringKey`.
- Prefer standard modifiers (`.tint`, `.controlSize`, `.font`, `.buttonBorderShape`) over bespoke configuration types.
- Public API is `public`; everything else is `internal` or `private`. Top-level `private` names must be unique across a component's files, because the website offers all files combined into one.
- No type prefix on components (`AnimatedButton`). Shared utilities use a `Tessera` prefix (`TesseraHaptics`).
- Swift 6 strict concurrency: mark async closures `@MainActor` where they touch UI. Cancel running tasks when the view disappears.
- Extract non-trivial state (phases, timing, layout math) into plain value types and unit-test them with Swift Testing.

## Copy-paste safety

- Import only Apple frameworks. Never `import Tessera` inside `Sources/Tessera`.
- Never use `Bundle.module` directly. A pasted file has no package bundle.
- Never reference another component. Shared code goes in `Core/<Name>/` as a utility with its own `utility.json`, declared in the component's `dependencies.utilities`.

## Text and localization

- Take user-facing text from the caller (`LocalizedStringKey`, `Text`, `@ViewBuilder`), so the app's localization applies.
- Let callers provide accessibility text where the default can't be derived from their label.
- Avoid built-in strings. If one is unavoidable, use an English default and keep the API open to a caller-provided override. A shared localization utility is deferred until a component genuinely needs one.

## Accessibility

- VoiceOver: a meaningful label, correct traits, the current value, and announcements for important state changes.
- Dynamic Type through AX5 without clipping. Prefer intrinsic sizing to fixed frames.
- Reduce Motion: replace movement, scale and shake with cross-fades (`@Environment(\.accessibilityReduceMotion)`).
- Tap targets at least 44 × 44 pt.
- Contrast: system `.secondary` text on light backgrounds can fail the audit. Check with `performAccessibilityAudit()`.
- Light and dark mode, right-to-left layout.

## Interaction

- Controls must work with every standard style, in a `List` or `Form` as well as in stacks. A default-styled button in a list row is activated by its row, and any gesture inside the row (even a `simultaneousGesture`) stops the row from firing. Test that case on the Simulator.

## Motion

- Purposeful and quick. Prefer springs for direct manipulation and short ease-out curves for state changes.
- Deterministic in capture scenarios: same input, same frames.

## Documentation (`docs.mdx`)

The website places `docs.mdx` under a **Usage** heading and follows it with an **Accessibility** section built from `component.json` (supported features plus `accessibility.notes`), so don't repeat either heading. Start with a sentence or two, then use `##` sections such as *Basic usage*, *Customization*, *Errors* and *Limitations*; put accessibility details that need code (such as custom announcements) under a specific heading. Code examples must compile; mirror them in `#Preview`s.

## Checklist

- [ ] Source in `Sources/Tessera/Components/<Name>/` with SPDX header and `#Preview`s
- [ ] Unit tests for non-trivial logic
- [ ] Showcase demo, capture scenarios and catalog entry
- [ ] `component.json` and `docs.mdx`; `npm run registry:check` passes
- [ ] Light and dark previews captured from the Simulator (`docs/preview-capture.md`)
- [ ] Works with the default style in a `List` row as well as in stacks
- [ ] VoiceOver, Dynamic Type (AX5), Reduce Motion, RTL and both appearances checked in the Showcase
- [ ] `make verify` passes
