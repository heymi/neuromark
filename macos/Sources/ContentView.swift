import SwiftUI

struct ContentView: View {
  @EnvironmentObject var bridge: WebBridge
  @State private var localSearch: String = ""
  @State private var selectedViewMode: Int = 0
  @State private var selectedTheme: Int = 2

  var body: some View {
    NavigationSplitView {
      SidebarView()
        .frame(minWidth: 230, idealWidth: 250, maxWidth: 280)
    } detail: {
      WebView()
        .toolbar {
          ToolbarItem(placement: .principal) {
            HStack(spacing: 12) {
              Text(bridge.activeSectionTitle)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.secondary)

              TextField("Search", text: $localSearch)
                .textFieldStyle(.roundedBorder)
                .frame(minWidth: 220, maxWidth: 320)
                .onChange(of: localSearch) { _, newValue in
                  bridge.setSearch(newValue)
                }

              Picker("", selection: $selectedViewMode) {
                Image(systemName: "square.grid.2x2").tag(0)
                Image(systemName: "list.bullet").tag(1)
              }
              .pickerStyle(.segmented)
              .frame(width: 120)
              .onChange(of: selectedViewMode) { _, newValue in
                bridge.setViewMode(newValue == 0 ? "grid" : "list")
              }

              Picker("", selection: $selectedTheme) {
                Image(systemName: "sun.max").tag(0)
                Image(systemName: "moon").tag(1)
                Image(systemName: "circle.lefthalf.filled").tag(2)
              }
              .pickerStyle(.segmented)
              .frame(width: 120)
              .onChange(of: selectedTheme) { _, newValue in
                let value = newValue == 0 ? "light" : newValue == 1 ? "dark" : "auto"
                bridge.setTheme(value)
              }
            }
          }

          ToolbarItemGroup(placement: .automatic) {
            Button {
              bridge.openAddBookmark()
            } label: {
              Image(systemName: "plus")
            }
            Button {
              // TODO: sort menu
            } label: {
              Image(systemName: "arrow.up.arrow.down")
            }
            Button {
              // TODO: more actions
            } label: {
              Image(systemName: "ellipsis.circle")
            }
          }
        }
    }
    .navigationSplitViewStyle(.balanced)
  }
}
