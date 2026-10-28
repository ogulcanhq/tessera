// swift-tools-version: 6.0
// SPDX-License-Identifier: MIT

import PackageDescription

let package = Package(
    name: "Tessera",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(name: "Tessera", targets: ["Tessera"])
    ],
    targets: [
        // Components live in Sources/Tessera/Components/<Name>/,
        // shared utilities in Sources/Tessera/Core/<Name>/.
        // See docs/architecture.md §2–3.
        .target(name: "Tessera"),
        .testTarget(name: "TesseraTests", dependencies: ["Tessera"]),
    ],
    swiftLanguageModes: [.v6]
)
