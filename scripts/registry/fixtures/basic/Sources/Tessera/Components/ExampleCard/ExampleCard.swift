// SPDX-License-Identifier: MIT
// FIXTURE — not part of the Tessera package.

import SwiftUI

public struct ExampleCard: View {
    let title: LocalizedStringKey

    public init(title: LocalizedStringKey) {
        self.title = title
    }

    public var body: some View {
        Text(title)
            .padding(TesseraExampleHelper.padding)
            .background(.thinMaterial, in: .rect(cornerRadius: 16))
    }
}
