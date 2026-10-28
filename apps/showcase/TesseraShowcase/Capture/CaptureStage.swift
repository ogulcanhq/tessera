// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import SwiftUI

/// Chrome-free stage used for website previews: solid background that matches
/// the website's preview surface, content centered, status bar and home
/// indicator hidden.
struct CaptureStage<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        ZStack {
            StageBackground.color.ignoresSafeArea()
            content.padding(24)
        }
        .statusBarHidden()
        .persistentSystemOverlays(.hidden)
        .toolbar(.hidden, for: .navigationBar)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("capture.stage")
    }
}

/// Root view in capture mode: resolves the requested component and scenario.
struct CaptureRootView: View {
    let componentID: String
    let scenarioID: String?

    var body: some View {
        CaptureStage {
            if let entry = Catalog.entry(id: componentID),
                let scenario = scenarioID.map({ id in entry.scenarios.first { $0.id == id } })
                    ?? entry.scenarios.first
            {
                scenario.content()
            } else {
                CaptureErrorView(componentID: componentID, scenarioID: scenarioID)
            }
        }
    }
}

/// Shown only when capture mode is launched with an unknown id. Never a preview.
private struct CaptureErrorView: View {
    let componentID: String
    let scenarioID: String?

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
            Text("Nothing to capture")
                .font(.headline)
            Text("No scenario “\(scenarioID ?? "first")” for component “\(componentID)”.")
                .font(.footnote)
                .multilineTextAlignment(.center)
            let ids = Catalog.entries.map(\.id)
            Text(ids.isEmpty ? "The catalog is empty." : "Available: \(ids.joined(separator: ", "))")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .foregroundStyle(.secondary)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("capture.error")
    }
}

/// Keep in sync with `--stage` in apps/web/app/globals.css.
enum StageBackground {
    static let color = Color(
        UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 26 / 255, green: 28 / 255, blue: 33 / 255, alpha: 1)  // #1A1C21
                : UIColor(red: 238 / 255, green: 240 / 255, blue: 243 / 255, alpha: 1)  // #EEF0F3
        }
    )
}

#Preview("Unknown component") {
    CaptureRootView(componentID: "missing", scenarioID: nil)
}
