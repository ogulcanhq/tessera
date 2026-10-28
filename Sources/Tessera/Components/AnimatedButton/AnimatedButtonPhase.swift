// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

/// The lifecycle of an `AnimatedButton`.
///
///     idle ──tap──▶ running ──returns──▶ succeeded ──after 1.2 s──▶ idle
///                      │    ──throws───▶ failed ─────after 1.6 s──▶ idle
///                      └──cancelled──▶ idle
///
/// Transitions that don't appear above are ignored, which is what makes the
/// button safe against duplicate taps and late results.
enum AnimatedButtonPhase: Equatable, Sendable {
    case idle
    case running
    case succeeded
    case failed

    /// How an action ended.
    enum Outcome: Equatable, Sendable {
        case success
        case failure
        case cancelled
    }

    /// How long the result stays visible before the button returns to idle.
    var resultDuration: Duration? {
        switch self {
        case .succeeded: .milliseconds(1200)
        case .failed: .milliseconds(1600)
        case .idle, .running: nil
        }
    }

    /// Starts an action. Only possible from `idle`; returns `false` (and changes
    /// nothing) while an action is running or a result is showing.
    @discardableResult
    mutating func start() -> Bool {
        guard self == .idle else { return false }
        self = .running
        return true
    }

    /// Records how the running action ended. Ignored unless running.
    mutating func finish(_ outcome: Outcome) {
        guard self == .running else { return }
        switch outcome {
        case .success: self = .succeeded
        case .failure: self = .failed
        case .cancelled: self = .idle
        }
    }

    /// Returns from a shown result to `idle`. Ignored in any other phase.
    mutating func reset() {
        guard self == .succeeded || self == .failed else { return }
        self = .idle
    }

    /// Abandons whatever is happening, e.g. when the view disappears.
    mutating func cancel() {
        self = .idle
    }
}

extension AnimatedButtonPhase.Outcome {
    /// Runs `action` and classifies how it ended. `CancellationError`, or any
    /// result that arrives after the surrounding task was cancelled, counts as
    /// cancellation rather than failure.
    @MainActor
    static func of(_ action: @MainActor () async throws -> Void) async -> Self {
        do {
            try await action()
            return Task.isCancelled ? .cancelled : .success
        } catch {
            return error is CancellationError || Task.isCancelled ? .cancelled : .failure
        }
    }
}
