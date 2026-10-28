// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import XCTest

/// Drives the real AnimatedButton from the Tessera package inside the Showcase.
///
/// Accessibility audits run with the button at rest. Mid-action, the audit
/// flags the system progress view (no label) and the faded-out label text
/// (contrast); both are deliberate: VoiceOver reads the label plus "in
/// progress", and the result is announced.
final class AnimatedButtonTests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

    @MainActor
    func testScenariosPassAccessibilityAudit() throws {
        for scenario in ["press", "success", "failure"] {
            for scheme in ["light", "dark"] {
                let app = launchCapture(scenario: scenario, scheme: scheme)
                XCTAssertTrue(app.buttons["animated-button"].waitForExistence(timeout: 10))
                try app.performAccessibilityAudit()
                attachScreenshot(of: app, named: "\(scenario)-\(scheme)")
                app.terminate()
            }
        }
    }

    @MainActor
    func testSuccessKeepsItsNameAndReturnsToIdle() throws {
        let app = launchCapture(scenario: "success", scheme: "light")
        let button = app.buttons["animated-button"]
        XCTAssertTrue(button.waitForExistence(timeout: 10))
        XCTAssertEqual(button.label, "Save changes")
        let restingSize = button.frame.size

        button.tap()
        // Running: the label stays in the accessibility tree, so the name doesn't
        // change, and the progress view adds a value ("in progress" in VoiceOver).
        XCTAssertEqual(button.label, "Save changes")
        XCTAssertNotNil(button.value)
        usleep(500_000)  // Past the press spring, well inside the 1.5 s action.
        XCTAssertEqual(button.frame.size, restingSize, "The button must not resize while running")
        attachScreenshot(of: app, named: "success-running")

        // 1.5 s action + 1.2 s result, then back to idle and tappable again.
        sleep(4)
        XCTAssertTrue(button.isHittable)
        XCTAssertEqual(button.label, "Save changes")
    }

    @MainActor
    func testFailureShowsResultThenRecovers() throws {
        let app = launchCapture(scenario: "failure", scheme: "dark")
        let button = app.buttons["animated-button"]
        XCTAssertTrue(button.waitForExistence(timeout: 10))
        button.tap()
        usleep(1_800_000)
        attachScreenshot(of: app, named: "failure-result")
        sleep(3)
        XCTAssertTrue(button.isHittable)
        XCTAssertEqual(button.label, "Send message")
    }

    @MainActor
    func testPlaygroundIgnoresRepeatedTapsWhileRunning() throws {
        let app = XCUIApplication()
        app.launch()
        openPlayground(in: app)

        let button = app.buttons["animated-button"]
        XCTAssertTrue(button.waitForExistence(timeout: 10))
        for _ in 0..<5 { button.tap() }

        let runs = app.descendants(matching: .any)["playground.runs"]
        XCTAssertTrue(runs.waitForExistence(timeout: 5))
        XCTAssertTrue(runs.label.hasSuffix("1"), "Expected 1 action, got “\(runs.label)”")
        attachScreenshot(of: app, named: "playground")

        // After the result clears: audit at rest, then the next tap starts a new action.
        sleep(4)
        // Grey section headers and values are the system List style, not the
        // component; it gets the full audit in testScenariosPassAccessibilityAudit.
        // Every other issue, and any issue on the button, still fails.
        try app.performAccessibilityAudit { issue in
            issue.auditType == .contrast && issue.element?.identifier != "animated-button"
        }
        button.tap()
        XCTAssertTrue(runs.label.hasSuffix("2"), "Expected 2 actions, got “\(runs.label)”")
    }

    /// The playground stage is a List row. With the automatic style, a List
    /// activates the button through its row, which the press gesture used to block.
    @MainActor
    func testPlaygroundAutomaticStyleRunsInAListRow() throws {
        let app = XCUIApplication()
        app.launch()
        openPlayground(in: app)

        XCTAssertTrue(app.buttons["animated-button"].waitForExistence(timeout: 10))
        // Further down the List; its row doesn't exist until scrolled into view.
        let picker = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Button Style")).firstMatch
        for _ in 0..<6 where !picker.isHittable { app.swipeUp() }
        picker.tap()
        let automatic = app.buttons["Automatic"].firstMatch
        XCTAssertTrue(automatic.waitForExistence(timeout: 5))
        automatic.tap()

        let button = app.buttons["animated-button"]
        while !button.isHittable { app.swipeDown() }
        for _ in 0..<3 { button.tap() }
        let runs = app.descendants(matching: .any)["playground.runs"]
        XCTAssertTrue(runs.label.hasSuffix("1"), "Expected 1 action, got “\(runs.label)”")
        attachScreenshot(of: app, named: "playground-automatic")
    }

    @MainActor
    func testPlaygroundReduceMotionReachesTheComponent() throws {
        let app = XCUIApplication()
        app.launch()
        openPlayground(in: app)

        let caption = app.descendants(matching: .any)["playground.reduce-motion"]
        XCTAssertTrue(app.buttons["animated-button"].waitForExistence(timeout: 10))
        XCTAssertFalse(caption.exists)

        let toggle = app.switches["Reduce Motion"]
        while !toggle.isHittable { app.swipeUp() }
        toggle.switches.firstMatch.tap()
        while !app.buttons["animated-button"].isHittable { app.swipeDown() }
        XCTAssertTrue(caption.waitForExistence(timeout: 5))
        attachScreenshot(of: app, named: "playground-reduce-motion")
    }

    // MARK: - Helpers

    @MainActor
    private func launchCapture(scenario: String, scheme: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [
            "-tessera-capture", "animated-button", "-tessera-scenario", scenario, "-tessera-scheme", scheme,
        ]
        app.launch()
        return app
    }

    /// Catalog rows read as "<name>, <summary>".
    @MainActor
    private func openPlayground(in app: XCUIApplication) {
        let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Animated Button")).firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 10))
        row.tap()
    }

    @MainActor
    private func attachScreenshot(of app: XCUIApplication, named name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
