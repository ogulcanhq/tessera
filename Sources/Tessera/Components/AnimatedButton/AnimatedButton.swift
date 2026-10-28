// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import SwiftUI

/// A button that runs an asynchronous action and shows its progress and result.
///
/// Tapping the button starts `action`. While it runs, the label is replaced by a
/// progress indicator and further taps are ignored. When it returns, the button
/// shows a checkmark; when it throws, it shows an xmark and shakes. Either way it
/// returns to its label on its own.
///
///     AnimatedButton("Save") {
///         try await saveChanges()
///     }
///     .buttonStyle(.borderedProminent)
///
/// Style it with standard modifiers such as `.buttonStyle`, `.tint`,
/// `.controlSize`, `.buttonBorderShape` and `.font`. Press feedback is added on
/// top of whichever button style is in effect.
///
/// **Errors.** A thrown error produces the failure state, and the error itself is
/// not passed on. To show or log details, catch inside `action` and rethrow:
///
///     AnimatedButton("Send") {
///         do { try await send() } catch { lastError = error; throw error }
///     }
///
/// **Cancellation.** If the view disappears while `action` runs, its task is
/// cancelled and the button returns to idle without showing a result. Throwing
/// `CancellationError` from `action` does the same.
///
/// **Accessibility.** VoiceOver reads the label and the system's progress
/// description while running, then announces the result (by default "Done" or
/// "Failed"; pass your own text, or `nil` for no announcement). Success and
/// failure play the matching haptics. With Reduce Motion on, scale and shake
/// are replaced by fades.
public struct AnimatedButton<Label: View>: View {
    private let role: ButtonRole?
    private let successAnnouncement: LocalizedStringResource?
    private let failureAnnouncement: LocalizedStringResource?
    private let action: @MainActor () async throws -> Void
    private let label: Label

    @State private var phase = AnimatedButtonPhase.idle
    @State private var task: Task<Void, Never>?
    @State private var shakes = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.controlSize) private var controlSize

    /// Creates a button with a custom label.
    ///
    /// - Parameters:
    ///   - role: The button's role, such as `.destructive`.
    ///   - successAnnouncement: Spoken by VoiceOver when `action` returns, or `nil` for silence.
    ///   - failureAnnouncement: Spoken by VoiceOver when `action` throws, or `nil` for silence.
    ///   - action: The work to perform. Throw to show the failure state.
    ///   - label: The button's content, shown whenever no action is in progress.
    public init(
        role: ButtonRole? = nil,
        successAnnouncement: LocalizedStringResource? = "Done",
        failureAnnouncement: LocalizedStringResource? = "Failed",
        action: @escaping @MainActor () async throws -> Void,
        @ViewBuilder label: () -> Label
    ) {
        self.role = role
        self.successAnnouncement = successAnnouncement
        self.failureAnnouncement = failureAnnouncement
        self.action = action
        self.label = label()
    }

    public var body: some View {
        Button(role: role, action: start) {
            // The label alone sizes the button and stays in the accessibility
            // tree in every phase, so size and VoiceOver name never change.
            // Indicators are overlaid and never affect layout.
            label
                .opacity(phase == .idle ? 1 : 0)
                .overlay { indicator }
                .animation(
                    reduceMotion ? .easeInOut(duration: 0.2) : .spring(duration: 0.35, bounce: 0.3), value: phase)
        }
        .buttonStyle(AnimatedButtonPressStyle())
        .modifier(AnimatedButtonShake(trigger: shakes))
        .sensoryFeedback(trigger: phase) { _, newPhase in
            switch newPhase {
            case .succeeded: .success
            case .failed: .error
            case .idle, .running: nil
            }
        }
        .onChange(of: phase) { _, newPhase in
            announce(newPhase)
        }
        .onDisappear {
            task?.cancel()
            task = nil
            phase.cancel()
        }
    }

    /// What replaces the label outside `idle`. The progress view is left
    /// accessible so VoiceOver adds the system's "in progress" description;
    /// the result icons are decorative, since the result is announced.
    @ViewBuilder
    private var indicator: some View {
        let transition: AnyTransition =
            reduceMotion ? .opacity : .scale(scale: 0.4).combined(with: .opacity)
        switch phase {
        case .idle:
            EmptyView()
        case .running:
            ProgressView()
                .controlSize(progressSize)
                .tint(ForegroundStyle())
                .transition(.opacity)
        case .succeeded:
            resultIcon("checkmark")
                .transition(transition)
        case .failed:
            resultIcon("xmark")
                .transition(transition)
        }
    }

    /// One step below the button's size: a spinner at the button's own size
    /// is taller than its label.
    private var progressSize: ControlSize {
        switch controlSize {
        case .mini, .small: .mini
        case .regular: .small
        default: .regular
        }
    }

    private func resultIcon(_ systemName: String) -> some View {
        Image(systemName: systemName)
            .fontWeight(.semibold)
            .accessibilityHidden(true)
    }

    private func start() {
        guard phase.start() else { return }
        task = Task {
            let outcome = await AnimatedButtonPhase.Outcome.of(action)
            guard !Task.isCancelled else { return }
            phase.finish(outcome)
            if phase == .failed, !reduceMotion {
                shakes += 1
            }
            guard let duration = phase.resultDuration else { return }
            try? await Task.sleep(for: duration)
            guard !Task.isCancelled else { return }
            phase.reset()
        }
    }

    private func announce(_ newPhase: AnimatedButtonPhase) {
        let announcement: LocalizedStringResource? =
            switch newPhase {
            case .succeeded: successAnnouncement
            case .failed: failureAnnouncement
            case .idle, .running: nil
            }
        guard let announcement else { return }
        AccessibilityNotification.Announcement(String(localized: announcement)).post()
    }
}

extension AnimatedButton where Label == Text {
    /// Creates a button with a localized text label.
    ///
    /// - Parameters:
    ///   - titleKey: The label's localized string key.
    ///   - role: The button's role, such as `.destructive`.
    ///   - successAnnouncement: Spoken by VoiceOver when `action` returns, or `nil` for silence.
    ///   - failureAnnouncement: Spoken by VoiceOver when `action` throws, or `nil` for silence.
    ///   - action: The work to perform. Throw to show the failure state.
    public init(
        _ titleKey: LocalizedStringKey,
        role: ButtonRole? = nil,
        successAnnouncement: LocalizedStringResource? = "Done",
        failureAnnouncement: LocalizedStringResource? = "Failed",
        action: @escaping @MainActor () async throws -> Void
    ) {
        self.init(
            role: role,
            successAnnouncement: successAnnouncement,
            failureAnnouncement: failureAnnouncement,
            action: action
        ) {
            Text(titleKey)
        }
    }

    /// Creates a button with a verbatim text label, such as a value from your model.
    @_disfavoredOverload
    public init<S: StringProtocol>(
        _ title: S,
        role: ButtonRole? = nil,
        successAnnouncement: LocalizedStringResource? = "Done",
        failureAnnouncement: LocalizedStringResource? = "Failed",
        action: @escaping @MainActor () async throws -> Void
    ) {
        self.init(
            role: role,
            successAnnouncement: successAnnouncement,
            failureAnnouncement: failureAnnouncement,
            action: action
        ) {
            Text(title)
        }
    }
}

/// A short horizontal shake, played each time `trigger` changes.
private struct AnimatedButtonShake: ViewModifier {
    let trigger: Int

    func body(content: Content) -> some View {
        content.keyframeAnimator(initialValue: 0, trigger: trigger) { content, offset in
            content.offset(x: offset)
        } keyframes: { _ in
            KeyframeTrack {
                for offset in [-7.0, 6, -4, 2, 0] {
                    CubicKeyframe(offset, duration: 0.07)
                }
            }
        }
    }
}

/// Adds spring press feedback to the button style already in effect.
/// `Button(configuration)` renders with the next style up the hierarchy, so
/// `.buttonStyle(.borderedProminent)` applied by the caller still applies.
private struct AnimatedButtonPressStyle: PrimitiveButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        AnimatedButtonPressEffect(configuration: configuration)
    }
}

///
/// A default-styled button in a `List` or `Form` is activated by its row, and
/// any gesture inside the row stops the row from firing. So a tap that ends on
/// the button also triggers it from the press gesture. Elsewhere the button
/// fires as well, and AnimatedButton ignores the second trigger because its
/// action is already running.
private struct AnimatedButtonPressEffect: View {
    /// Movement beyond which a touch is a drag or scroll, not a tap.
    private static let tapSlop = 20.0

    let configuration: PrimitiveButtonStyleConfiguration
    @GestureState private var isPressed = false
    @State private var size = CGSize.zero
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.isEnabled) private var isEnabled

    var body: some View {
        Button(configuration)
            .scaleEffect(isPressed && !reduceMotion ? 0.96 : 1)
            .opacity(isPressed && reduceMotion ? 0.75 : 1)
            .animation(
                reduceMotion ? .easeOut(duration: 0.12) : .spring(duration: 0.3, bounce: 0.45),
                value: isPressed
            )
            .onGeometryChange(for: CGSize.self) {
                $0.size
            } action: {
                size = $0
            }
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .updating($isPressed) { _, pressed, _ in
                        pressed = true
                    }
                    .onEnded { value in
                        let moved = hypot(value.translation.width, value.translation.height)
                        guard isEnabled, moved < Self.tapSlop,
                            CGRect(origin: .zero, size: size).contains(value.location)
                        else { return }
                        configuration.trigger()
                    }
            )
    }
}

#Preview("Styles") {
    VStack(spacing: 20) {
        AnimatedButton("Save changes") {
            try await Task.sleep(for: .seconds(1.5))
        }
        .buttonStyle(.borderedProminent)
        .controlSize(.large)

        AnimatedButton {
            try await Task.sleep(for: .seconds(1.5))
        } label: {
            Label("Continue", systemImage: "arrow.right")
        }
        .buttonStyle(.bordered)

        AnimatedButton("Delete", role: .destructive) {
            try await Task.sleep(for: .seconds(1.5))
        }
        .buttonStyle(.borderedProminent)
    }
    .padding()
}

#Preview("Failure") {
    AnimatedButton("Send message") {
        try await Task.sleep(for: .seconds(1.5))
        throw URLError(.notConnectedToInternet)
    }
    .buttonStyle(.borderedProminent)
    .controlSize(.large)
}

#Preview("Dark, AX5, RTL") {
    AnimatedButton("Save changes") {
        try await Task.sleep(for: .seconds(1.5))
    }
    .buttonStyle(.borderedProminent)
    .padding()
    .dynamicTypeSize(.accessibility5)
    .environment(\.layoutDirection, .rightToLeft)
    .preferredColorScheme(.dark)
}
