// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import Testing

@testable import Tessera

@Suite("AnimatedButton phases")
struct AnimatedButtonPhaseTests {
    @Test func startsFromIdle() {
        var phase = AnimatedButtonPhase.idle
        let started = phase.start()
        #expect(started)
        #expect(phase == .running)
    }

    @Test func runningToSuccess() {
        var phase = AnimatedButtonPhase.running
        phase.finish(.success)
        #expect(phase == .succeeded)
    }

    @Test func runningToFailure() {
        var phase = AnimatedButtonPhase.running
        phase.finish(.failure)
        #expect(phase == .failed)
    }

    @Test func cancelledRunReturnsToIdleWithoutAResult() {
        var phase = AnimatedButtonPhase.running
        phase.finish(.cancelled)
        #expect(phase == .idle)
    }

    @Test(
        "Taps are ignored while running or showing a result",
        arguments: [
            AnimatedButtonPhase.running, .succeeded, .failed,
        ])
    func duplicateStartIsIgnored(phase initial: AnimatedButtonPhase) {
        var phase = initial
        let started = phase.start()
        #expect(!started)
        #expect(phase == initial)
    }

    @Test(arguments: [AnimatedButtonPhase.succeeded, .failed])
    func resultResetsToIdle(phase initial: AnimatedButtonPhase) {
        var phase = initial
        phase.reset()
        #expect(phase == .idle)
    }

    @Test("Reset doesn't interrupt a running action")
    func resetIgnoredWhileRunning() {
        var phase = AnimatedButtonPhase.running
        phase.reset()
        #expect(phase == .running)
    }

    @Test("A late result is ignored once the run was abandoned")
    func finishIgnoredUnlessRunning() {
        var phase = AnimatedButtonPhase.idle
        phase.finish(.success)
        #expect(phase == .idle)

        phase = .succeeded
        phase.finish(.failure)
        #expect(phase == .succeeded)
    }

    @Test(arguments: [AnimatedButtonPhase.idle, .running, .succeeded, .failed])
    func cancelAlwaysReturnsToIdle(phase initial: AnimatedButtonPhase) {
        var phase = initial
        phase.cancel()
        #expect(phase == .idle)
    }

    @Test func onlyResultsHaveADuration() {
        #expect(AnimatedButtonPhase.idle.resultDuration == nil)
        #expect(AnimatedButtonPhase.running.resultDuration == nil)
        #expect(AnimatedButtonPhase.succeeded.resultDuration == .milliseconds(1200))
        #expect(AnimatedButtonPhase.failed.resultDuration == .milliseconds(1600))
    }

    @Test("Rapid taps start exactly one run per cycle")
    func rapidRepeatedTaps() {
        var phase = AnimatedButtonPhase.idle
        var started = 0
        for _ in 0..<10 where phase.start() { started += 1 }
        #expect(started == 1)

        phase.finish(.success)
        for _ in 0..<10 where phase.start() { started += 1 }
        #expect(started == 1)

        phase.reset()
        for _ in 0..<10 where phase.start() { started += 1 }
        #expect(started == 2)
    }
}

@Suite("AnimatedButton outcomes")
@MainActor
struct AnimatedButtonOutcomeTests {
    struct SampleError: Error {}

    @Test func returningIsSuccess() async {
        let outcome = await AnimatedButtonPhase.Outcome.of {}
        #expect(outcome == .success)
    }

    @Test func throwingIsFailure() async {
        let outcome = await AnimatedButtonPhase.Outcome.of { throw SampleError() }
        #expect(outcome == .failure)
    }

    @Test func cancellationErrorIsCancellation() async {
        let outcome = await AnimatedButtonPhase.Outcome.of { throw CancellationError() }
        #expect(outcome == .cancelled)
    }

    @Test("Cancelling the task mid-action yields cancellation, even if the action then returns")
    func cancelledTaskIsCancellation() async {
        let task = Task { @MainActor in
            await AnimatedButtonPhase.Outcome.of {
                // Ignores cancellation on purpose, like an action that can't be interrupted.
                try? await Task.sleep(for: .seconds(5))
            }
        }
        task.cancel()
        #expect(await task.value == .cancelled)
    }

    @Test("A cancelled sleep throws CancellationError, which is not a failure")
    func cancelledSleepIsCancellation() async {
        let task = Task { @MainActor in
            await AnimatedButtonPhase.Outcome.of {
                try await Task.sleep(for: .seconds(5))
            }
        }
        task.cancel()
        #expect(await task.value == .cancelled)
    }
}
