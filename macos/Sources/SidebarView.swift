import SwiftUI

struct SidebarView: View {
  @EnvironmentObject var bridge: WebBridge
  @State private var selectedItem: String = "all"

  var body: some View {
    ZStack {
      VisualEffectView(material: .sidebar, blendingMode: .behindWindow, state: .active)
      VStack(alignment: .leading, spacing: 16) {
        VStack(alignment: .leading, spacing: 6) {
          Text("Heymi’s Space")
            .font(.system(size: 13, weight: .semibold))
          Text("Workspace")
            .font(.system(size: 10, weight: .medium))
            .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 12)

        VStack(spacing: 8) {
          SidebarRow(icon: "square.stack.3d.up", title: "All Documents", isActive: selectedItem == "all") {
            selectedItem = "all"
            bridge.setFilter(["category": "All"])
            bridge.activeSectionTitle = "All Documents"
          }
          SidebarRow(icon: "star", title: "Favorites", isActive: selectedItem == "favorites") {
            selectedItem = "favorites"
            bridge.setFilter(["favoritesOnly": true])
            bridge.activeSectionTitle = "Favorites"
          }
        }
        .padding(.horizontal, 8)

        Divider().opacity(0.4)

        VStack(alignment: .leading, spacing: 8) {
          Text("Projects")
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(.secondary)
            .padding(.horizontal, 12)
          if bridge.projects.isEmpty {
            Text("No projects yet.")
              .font(.system(size: 11))
              .foregroundStyle(.secondary)
              .padding(.horizontal, 12)
          } else {
            ForEach(bridge.projects) { project in
              SidebarRow(
                icon: "circle.fill",
                title: project.name,
                isActive: selectedItem == project.id,
                tint: Color(hex: project.color)
              ) {
                selectedItem = project.id
                bridge.setFilter(["projectId": project.id])
                bridge.activeSectionTitle = project.name
              }
            }
          }
        }
        .padding(.horizontal, 8)

        Spacer()

        HStack {
          VStack(alignment: .leading, spacing: 2) {
            Text("okb@spark.com")
              .font(.system(size: 11, weight: .semibold))
              .lineLimit(1)
            Text("Account")
              .font(.system(size: 10, weight: .medium))
              .foregroundStyle(.secondary)
          }
          Spacer()
          Button {
            // TODO: open settings modal
          } label: {
            Image(systemName: "gearshape")
          }
          .buttonStyle(.borderless)
        }
        .padding(.horizontal, 12)
        .padding(.bottom, 10)
      }
      .padding(.top, 12)
    }
  }
}

private struct SidebarRow: View {
  let icon: String
  let title: String
  let isActive: Bool
  var tint: Color = .secondary
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      HStack(spacing: 10) {
        Image(systemName: icon)
          .font(.system(size: 12))
          .foregroundStyle(tint)
          .frame(width: 16)
        Text(title)
          .font(.system(size: 12, weight: .medium))
          .foregroundStyle(isActive ? Color.white : Color.primary)
        Spacer()
      }
      .padding(.horizontal, 10)
      .padding(.vertical, 8)
      .background(
        RoundedRectangle(cornerRadius: 10, style: .continuous)
          .fill(isActive ? Color.black.opacity(0.8) : Color.clear)
      )
    }
    .buttonStyle(.plain)
  }
}

private extension Color {
  init(hex: String) {
    let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var value: UInt64 = 0
    Scanner(string: cleaned).scanHexInt64(&value)
    let r = Double((value >> 16) & 0xFF) / 255.0
    let g = Double((value >> 8) & 0xFF) / 255.0
    let b = Double(value & 0xFF) / 255.0
    self.init(red: r, green: g, blue: b)
  }
}
