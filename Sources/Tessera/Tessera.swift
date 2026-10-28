// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

// Tessera — production-quality SwiftUI components.
//
// This file intentionally declares nothing. It keeps the `Tessera` target
// buildable before any component exists. Do not declare a type named
// `Tessera`: it would shadow the module name (see technical-decisions TD-02).
//
// Layout:
//   Components/<Name>/   one folder per component
//   Core/<Name>/         small shared utilities, declared per component in the registry

import SwiftUI
