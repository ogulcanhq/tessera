// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import SwiftUI

/// Every component shown in the Showcase, keyed by registry id.
///
/// To add a component, append an entry whose demo lives in
/// `Demos/<ComponentName>/`:
///
///     CatalogEntry(
///         id: "example-component",
///         name: "Example Component",
///         summary: "One sentence, same as component.json.",
///         category: "buttons",
///         scenarios: [
///             CaptureScenario(id: "default", title: "Default") { ExampleComponent() }
///         ],
///         playground: { ExampleComponentPlayground() }
///     )
///
/// A playground's body starts with a `PlaygroundStage { … }` holding the live
/// component, followed by `Section`s with its controls.
@MainActor
enum Catalog {
    static let entries: [CatalogEntry] = [
        CatalogEntry(
            id: "animated-button",
            name: "Animated Button",
            summary: "A button that runs an async action, with press feedback and loading, success and failure states.",
            category: "buttons",
            scenarios: AnimatedButtonDemo.scenarios,
            playground: { AnimatedButtonPlayground() }
        )
    ]

    static func entry(id: String) -> CatalogEntry? {
        entries.first { $0.id == id }
    }
}
