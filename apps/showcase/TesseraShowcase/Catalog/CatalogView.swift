// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Tessera contributors

import SwiftUI

struct CatalogView: View {
    var entries: [CatalogEntry] = Catalog.entries
    @AppStorage("appearance") private var appearance: Appearance = .system

    private var categories: [(name: String, entries: [CatalogEntry])] {
        Dictionary(grouping: entries, by: \.category)
            .map { (name: $0.key, entries: $0.value.sorted { $0.name < $1.name }) }
            .sorted { $0.name < $1.name }
    }

    var body: some View {
        NavigationStack {
            Group {
                if entries.isEmpty {
                    EmptyCatalogView()
                } else {
                    List(categories, id: \.name) { category in
                        Section {
                            ForEach(category.entries) { entry in
                                NavigationLink(value: entry.id) {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(entry.name)
                                        Text(entry.summary)
                                            .font(.footnote)
                                            .foregroundStyle(Color.primary)
                                    }
                                }
                            }
                        } header: {
                            // Explicit Color.primary: the default header and secondary
                            // colors fall short of the contrast audit.
                            Text(category.name.capitalized)
                                .foregroundStyle(Color.primary)
                        }
                    }
                }
            }
            .navigationTitle("Tessera")
            .navigationDestination(for: String.self) { id in
                if let entry = Catalog.entry(id: id) {
                    ComponentDetailView(entry: entry)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Picker("Appearance", selection: $appearance) {
                            ForEach(Appearance.allCases) { Text($0.title).tag($0) }
                        }
                    } label: {
                        Label("Appearance", systemImage: "circle.lefthalf.filled")
                    }
                }
            }
        }
    }
}

/// Custom rather than `ContentUnavailableView`, whose title does not scale through
/// every Dynamic Type size and fails `performAccessibilityAudit()`.
private struct EmptyCatalogView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                Image(systemName: "square.grid.3x3")
                    .font(.largeTitle)
                    .foregroundStyle(.secondary)
                    .accessibilityHidden(true)
                Text("No Components Yet")
                    .font(.title2.bold())
                Text("Components appear here once they are added to Catalog.swift. See AGENTS.md.")
                    .font(.body)
            }
            .multilineTextAlignment(.center)
            .padding(32)
            .frame(maxWidth: .infinity)
        }
        .defaultScrollAnchor(.center)
    }
}

#Preview("Empty") {
    CatalogView(entries: [])
}
