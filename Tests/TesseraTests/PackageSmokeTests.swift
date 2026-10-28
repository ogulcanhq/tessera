// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import Testing
@testable import Tessera

/// Keeps the test target meaningful before the first component lands:
/// the module must build and link for the iOS Simulator.
@Test func packageLinks() {
    #expect(Bool(true))
}
