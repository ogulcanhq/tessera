// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import XCTest

/// Smoke tests for the two launch modes. Component-specific capture and
/// accessibility tests are added with each component.
final class ShowcaseLaunchTests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

    @MainActor
    func testCatalogLaunches() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.navigationBars["Tessera"].waitForExistence(timeout: 10))
        try app.performAccessibilityAudit()
    }

    @MainActor
    func testCaptureModeHidesAppChrome() {
        let app = XCUIApplication()
        app.launchArguments = ["-tessera-capture", "missing-component", "-tessera-scheme", "dark"]
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any)["capture.error"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.navigationBars.firstMatch.exists)
    }
}
