// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import SwiftUI

/// Playground for one component: the live demo on a stage, plus controls that
/// override the stage's environment so light/dark, Dynamic Type and
/// right-to-left layouts can be checked side by side with the app's own settings.
struct ComponentDetailView: View {
    let entry: CatalogEntry
    @State private var environment = StageEnvironment()
    @Environment(\.dynamicTypeSize) private var systemDynamicTypeSize

    var body: some View {
        List {
            Section {
                Text(entry.summary)
            }

            entry.playground()
                .environment(\.stageEnvironment, environment)

            Section {
                Picker("Appearance", selection: $environment.colorScheme) {
                    Text("Light").tag(ColorScheme.light)
                    Text("Dark").tag(ColorScheme.dark)
                }

                VStack(alignment: .leading) {
                    LabeledContent(
                        "Dynamic Type",
                        value: environment.dynamicTypeSize.map(\.label) ?? "System (\(systemDynamicTypeSize.label))"
                    )
                    Slider(value: dynamicTypeIndex, in: 0...Double(DynamicTypeSize.allCases.count - 1), step: 1)
                        .accessibilityLabel("Dynamic Type size")
                        .accessibilityValue((environment.dynamicTypeSize ?? systemDynamicTypeSize).label)
                }

                Toggle("Right-to-Left Layout", isOn: $environment.isRightToLeft)
                Toggle("Reduce Motion", isOn: $environment.reduceMotion)
            } header: {
                Text("Environment")
            } footer: {
                // Explicit Color.primary: the default footer color fails the contrast audit,
                // and hierarchical .primary resolves to that same footer color.
                Text("Applies to the stage only. Reduce Motion is also on when it's enabled in Settings.")
                    .foregroundStyle(Color.primary)
            }

            if !entry.scenarios.isEmpty {
                Section {
                    ForEach(entry.scenarios) { scenario in
                        NavigationLink(scenario.title) {
                            CaptureStage { scenario.content() }
                                .environment(\.colorScheme, environment.colorScheme)
                        }
                    }
                } header: {
                    Text("Capture Scenarios")
                } footer: {
                    Text("Exactly what capture mode renders for website previews.")
                        .foregroundStyle(Color.primary)
                }
            }
        }
        .navigationTitle(entry.name)
        // Large: inline titles have a fixed size and fail the Dynamic Type audit.
        .navigationBarTitleDisplayMode(.large)
    }

    /// Slider position: the override if one is set, otherwise the system size.
    /// Moving the slider sets the override.
    private var dynamicTypeIndex: Binding<Double> {
        Binding {
            let size = environment.dynamicTypeSize ?? systemDynamicTypeSize
            return Double(DynamicTypeSize.allCases.firstIndex(of: size) ?? 0)
        } set: { index in
            environment.dynamicTypeSize = DynamicTypeSize.allCases[Int(index)]
        }
    }
}

/// The live demo area of a playground: a section whose content gets the
/// stage background and the environment overrides chosen in the detail view.
/// A playground places this first, followed by its own control sections.
struct PlaygroundStage<Content: View>: View {
    @Environment(\.stageEnvironment) private var environment
    @ViewBuilder var content: Content

    var body: some View {
        Section {
            content
                .stageEnvironment(environment)
                .frame(maxWidth: .infinity, minHeight: 240)
                .padding()
                .background(StageBackground.color)
                .environment(\.colorScheme, environment.colorScheme)
                .listRowInsets(EdgeInsets())
        }
    }
}

/// Environment overrides applied to the playground stage only.
struct StageEnvironment {
    var colorScheme: ColorScheme = .light
    /// `nil` follows the system text size, so the stage stays responsive to
    /// Dynamic Type (and to the accessibility audit) until the slider is moved.
    var dynamicTypeSize: DynamicTypeSize?
    var isRightToLeft = false
    var reduceMotion = false
}

extension EnvironmentValues {
    @Entry var stageEnvironment = StageEnvironment()
}

extension View {
    fileprivate func stageEnvironment(_ environment: StageEnvironment) -> some View {
        self
            .transformEnvironment(\.dynamicTypeSize) { size in
                if let override = environment.dynamicTypeSize { size = override }
            }
            .environment(\.layoutDirection, environment.isRightToLeft ? .rightToLeft : .leftToRight)
            // `accessibilityReduceMotion` is read-only; SwiftUI's underscored
            // setter is the only way to simulate it. Showcase only: components
            // read the public value and never set it.
            .transformEnvironment(\._accessibilityReduceMotion) { reduceMotion in
                if environment.reduceMotion { reduceMotion = true }
            }
    }
}

extension DynamicTypeSize {
    fileprivate var label: String {
        switch self {
        case .xSmall: "XS"
        case .small: "S"
        case .medium: "M"
        case .large: "L (Default)"
        case .xLarge: "XL"
        case .xxLarge: "XXL"
        case .xxxLarge: "XXXL"
        case .accessibility1: "AX1"
        case .accessibility2: "AX2"
        case .accessibility3: "AX3"
        case .accessibility4: "AX4"
        case .accessibility5: "AX5"
        @unknown default: "Unknown"
        }
    }
}
