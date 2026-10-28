// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import SwiftUI

@main
struct TesseraShowcaseApp: App {
    private let launch = LaunchConfiguration.current()
    @AppStorage("appearance") private var appearance: Appearance = .system

    var body: some Scene {
        WindowGroup {
            switch launch.mode {
            case .catalog:
                CatalogView()
                    .preferredColorScheme(appearance.colorScheme)
            case .capture(let componentID, let scenarioID):
                CaptureRootView(componentID: componentID, scenarioID: scenarioID)
                    .preferredColorScheme(launch.colorScheme)
            }
        }
    }
}
