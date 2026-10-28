// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import XCTest

/// Performs a capture scenario's interaction while `scripts/previews/capture.sh`
/// records the Simulator. Skipped unless that script sets the environment
/// (`TEST_RUNNER_TESSERA_CAPTURE_*`, which xcodebuild passes on without the
/// prefix). Prints `TESSERA-CAPTURE start|end <unix time>` markers; the script
/// uses them to locate and size the clip. See docs/preview-capture.md.
final class PreviewCaptureTests: XCTestCase {
    /// Real touches per component and scenario. Each starts and ends at rest,
    /// so the trimmed recording loops cleanly.
    @MainActor
    private static let interactions: [String: [String: (XCUIElement) -> Void]] = [
        "animated-button": [
            // Touch, hold and slide off the button, so it shows press feedback
            // without running its action.
            "press": { button in
                for _ in 0..<2 {
                    let center = button.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
                    let away = button.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 4))
                    center.press(forDuration: 0.7, thenDragTo: away)
                    usleep(700_000)
                }
            },
            // 1.5 s action, then the 1.2 s success or 1.6 s failure state.
            "success": { button in
                button.tap()
                usleep(3_200_000)
            },
            "failure": { button in
                button.tap()
                usleep(3_600_000)
            },
        ]
    ]

    @MainActor
    func testCapture() throws {
        let environment = ProcessInfo.processInfo.environment
        guard let component = environment["TESSERA_CAPTURE_COMPONENT"],
            let scenario = environment["TESSERA_CAPTURE_SCENARIO"]
        else {
            throw XCTSkip("Run through scripts/previews/capture.sh.")
        }
        let interaction = try XCTUnwrap(
            Self.interactions[component]?[scenario],
            "No capture interaction for \(component)/\(scenario)"
        )

        let app = XCUIApplication()
        app.launchArguments = [
            "-tessera-capture", component, "-tessera-scenario", scenario,
            "-tessera-scheme", environment["TESSERA_CAPTURE_SCHEME"] ?? "light",
        ]
        app.launch()

        let element = app.descendants(matching: .any)[component].firstMatch
        XCTAssertTrue(element.waitForExistence(timeout: 10))
        // Hold still on both sides of the interaction. The script finds the
        // first touch as the end of this resting stretch, and the trailing rest
        // keeps the app on screen until the clip ends.
        sleep(2)
        print("TESSERA-CAPTURE start \(Date().timeIntervalSince1970)")
        interaction(element)
        print("TESSERA-CAPTURE end \(Date().timeIntervalSince1970)")
        sleep(2)
    }
}
