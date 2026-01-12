import SwiftUI

@main
struct NeuroMarkMacApp: App {
  @StateObject private var bridge = WebBridge()

  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(bridge)
    }
    .windowStyle(.automatic)
    .windowToolbarStyle(.unifiedCompact)
  }
}
