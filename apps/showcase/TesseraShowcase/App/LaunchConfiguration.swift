// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import SwiftUI

/// How the app was launched. Launch arguments of the form `-key value` land in
/// the `UserDefaults` argument domain, so no manual parsing is needed:
///
///     -tessera-capture <component-id>   render one component chrome-free
///     -tessera-scenario <scenario-id>   optional; defaults to the first scenario
///     -tessera-scheme light|dark        optional; defaults to the system appearance
///
/// See docs/preview-capture.md.
struct LaunchConfiguration {
    enum Mode: Equatable {
        case catalog
        case capture(componentID: String, scenarioID: String?)
    }

    let mode: Mode
    let colorScheme: ColorScheme?

    static func current(_ defaults: UserDefaults = .standard) -> LaunchConfiguration {
        let colorScheme: ColorScheme? =
            switch defaults.string(forKey: "tessera-scheme") {
            case "light": .light
            case "dark": .dark
            default: nil
            }

        guard let componentID = defaults.string(forKey: "tessera-capture") else {
            return LaunchConfiguration(mode: .catalog, colorScheme: colorScheme)
        }
        let scenarioID = defaults.string(forKey: "tessera-scenario")
        return LaunchConfiguration(
            mode: .capture(componentID: componentID, scenarioID: scenarioID),
            colorScheme: colorScheme
        )
    }
}

/// The user's appearance choice in catalog mode.
enum Appearance: String, CaseIterable, Identifiable {
    case system, light, dark

    var id: Self { self }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }

    var title: String {
        switch self {
        case .system: "System"
        case .light: "Light"
        case .dark: "Dark"
        }
    }
}
