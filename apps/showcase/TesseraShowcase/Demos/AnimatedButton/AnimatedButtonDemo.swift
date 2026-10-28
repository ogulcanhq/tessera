// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import SwiftUI
import Tessera

/// Capture scenarios for website previews. Labels, timing and outcomes are
/// fixed so every recording of a scenario is identical.
enum AnimatedButtonDemo {
    static let scenarios = [
        CaptureScenario(id: "press", title: "Press feedback") {
            AnimatedButton {
                try await Task.sleep(for: .seconds(1.5))
            } label: {
                Label("Continue", systemImage: "arrow.right")
            }
            .demoStyle()
        },
        CaptureScenario(id: "success", title: "Loading to success") {
            AnimatedButton("Save changes") {
                try await Task.sleep(for: .seconds(1.5))
            }
            .demoStyle()
        },
        CaptureScenario(id: "failure", title: "Loading to failure") {
            AnimatedButton("Send message") {
                try await Task.sleep(for: .seconds(1.5))
                throw DemoError.failed
            }
            .demoStyle()
        },
    ]
}

enum DemoError: Error {
    case failed
}

extension Color {
    /// The website's accent. White text on it passes the contrast audit in both
    /// appearances, which iOS 26 system blue and dark-mode indigo don't quite.
    fileprivate static let jade = Color(red: 11 / 255, green: 122 / 255, blue: 100 / 255)
}

extension View {
    fileprivate func demoStyle() -> some View {
        self
            .buttonStyle(.borderedProminent)
            .tint(.jade)
            .font(.title3.weight(.semibold))
            .controlSize(.large)
            .accessibilityIdentifier("animated-button")
    }
}

/// Live playground: every option maps to a standard SwiftUI modifier or to the
/// simulated action, so what you see is what callers get.
struct AnimatedButtonPlayground: View {
    @State private var title = "Save changes"
    @State private var showsIcon = false
    @State private var role = RoleOption.none
    @State private var style = StyleOption.borderedProminent
    @State private var tint = TintOption.jade
    @State private var controlSize = ControlSize.large
    @State private var shape = ShapeOption.automatic
    @State private var delay = 1.5
    @State private var outcome = OutcomeOption.success
    @State private var runs = 0

    var body: some View {
        PlaygroundStage {
            VStack(spacing: 16) {
                button
                    .styled(style)
                    .tint(tint.color)
                    .controlSize(controlSize)
                    .buttonBorderShape(shape.shape)
                ReduceMotionCaption()
            }
        }

        Section {
            LabeledContent("Actions started", value: runs.formatted())
                .accessibilityIdentifier("playground.runs")
            // A row rather than a section footer: long footers don't fully scale
            // with Dynamic Type and fail the accessibility audit.
            Text(
                "Taps while an action runs or its result shows are ignored, so rapid tapping starts only one action. Touch and hold the button to see press feedback; in the Simulator, Debug › Slow Animations shows it in detail."
            )
            .font(.footnote)
        }

        Section("Label") {
            TextField("Title", text: $title)
            Toggle("Icon", isOn: $showsIcon)
        }

        Section("Style") {
            Picker("Role", selection: $role) {
                ForEach(RoleOption.allCases) { Text($0.title).tag($0) }
            }
            Picker("Button Style", selection: $style) {
                ForEach(StyleOption.allCases) { Text($0.title).tag($0) }
            }
            Picker("Tint", selection: $tint) {
                ForEach(TintOption.allCases) { Text($0.title).tag($0) }
            }
            Picker("Control Size", selection: $controlSize) {
                ForEach(ControlSize.allCases, id: \.self) { Text($0.title).tag($0) }
            }
            Picker("Border Shape", selection: $shape) {
                ForEach(ShapeOption.allCases) { Text($0.title).tag($0) }
            }
        }

        Section("Simulated Action") {
            Picker("Outcome", selection: $outcome) {
                ForEach(OutcomeOption.allCases) { Text($0.title).tag($0) }
            }
            VStack(alignment: .leading) {
                LabeledContent(
                    "Duration", value: Duration.seconds(delay).formatted(.units(allowed: [.seconds, .milliseconds])))
                Slider(value: $delay, in: 0.2...4, step: 0.1)
                    .accessibilityLabel("Duration")
                    .accessibilityValue(Duration.seconds(delay).formatted())
            }
        }
    }

    private var button: some View {
        AnimatedButton(role: role.role) {
            runs += 1
            try await Task.sleep(for: .seconds(delay))
            if outcome == .failure { throw DemoError.failed }
        } label: {
            if showsIcon {
                Label(title, systemImage: "arrow.right")
            } else {
                Text(title)
            }
        }
        .accessibilityIdentifier("animated-button")
    }
}

/// Confirms what the component sees: shown when Reduce Motion is on for the
/// stage, whether from the playground toggle or from Settings.
private struct ReduceMotionCaption: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        if reduceMotion {
            Label("Reduce Motion", systemImage: "figure.walk.motion")
                .font(.footnote)
                .accessibilityIdentifier("playground.reduce-motion")
        }
    }
}

private enum RoleOption: String, CaseIterable, Identifiable {
    case none, destructive, cancel
    var id: Self { self }
    var title: String { rawValue.capitalized }
    var role: ButtonRole? {
        switch self {
        case .none: nil
        case .destructive: .destructive
        case .cancel: .cancel
        }
    }
}

private enum StyleOption: String, CaseIterable, Identifiable {
    case borderedProminent, bordered, borderless, plain, automatic
    var id: Self { self }
    var title: String {
        switch self {
        case .borderedProminent: "Bordered Prominent"
        case .bordered: "Bordered"
        case .borderless: "Borderless"
        case .plain: "Plain"
        case .automatic: "Automatic"
        }
    }
}

private enum TintOption: String, CaseIterable, Identifiable {
    case jade, accent, indigo, green, orange, pink
    var id: Self { self }
    var title: String { self == .accent ? "Accent Color" : rawValue.capitalized }
    var color: Color? {
        switch self {
        case .jade: .jade
        case .accent: nil
        case .indigo: .indigo
        case .green: .green
        case .orange: .orange
        case .pink: .pink
        }
    }
}

private enum ShapeOption: String, CaseIterable, Identifiable {
    case automatic, capsule, roundedRectangle
    var id: Self { self }
    var title: String { self == .roundedRectangle ? "Rounded Rectangle" : rawValue.capitalized }
    var shape: ButtonBorderShape {
        switch self {
        case .automatic: .automatic
        case .capsule: .capsule
        case .roundedRectangle: .roundedRectangle
        }
    }
}

private enum OutcomeOption: String, CaseIterable, Identifiable {
    case success, failure
    var id: Self { self }
    var title: String { rawValue.capitalized }
}

extension ControlSize {
    fileprivate var title: String {
        switch self {
        case .mini: "Mini"
        case .small: "Small"
        case .regular: "Regular"
        case .large: "Large"
        case .extraLarge: "Extra Large"
        @unknown default: "Unknown"
        }
    }
}

extension View {
    @ViewBuilder
    fileprivate func styled(_ style: StyleOption) -> some View {
        switch style {
        case .borderedProminent: buttonStyle(.borderedProminent)
        case .bordered: buttonStyle(.bordered)
        case .borderless: buttonStyle(.borderless)
        case .plain: buttonStyle(.plain)
        case .automatic: buttonStyle(.automatic)
        }
    }
}

#Preview("Playground") {
    NavigationStack {
        List {
            AnimatedButtonPlayground()
        }
    }
}
