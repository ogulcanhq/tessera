// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import SwiftUI

/// One component as presented in the Showcase.
///
/// `id`, `category` and every scenario `id` must match the component's
/// `registry/components/<id>/component.json`; `npm run registry:check` verifies
/// that each registry id has an entry here.
struct CatalogEntry: Identifiable {
    let id: String
    let name: String
    let summary: String
    let category: String
    let scenarios: [CaptureScenario]
    let playground: @MainActor () -> AnyView

    init<Playground: View>(
        id: String,
        name: String,
        summary: String,
        category: String,
        scenarios: [CaptureScenario],
        @ViewBuilder playground: @escaping @MainActor () -> Playground
    ) {
        self.id = id
        self.name = name
        self.summary = summary
        self.category = category
        self.scenarios = scenarios
        self.playground = { AnyView(playground()) }
    }
}

/// A fixed, named state of a component used for website previews.
/// Scenarios must be deterministic: same input, same pixels.
struct CaptureScenario: Identifiable {
    let id: String
    let title: String
    let content: @MainActor () -> AnyView

    init<Content: View>(
        id: String,
        title: String,
        @ViewBuilder content: @escaping @MainActor () -> Content
    ) {
        self.id = id
        self.title = title
        self.content = { AnyView(content()) }
    }
}
