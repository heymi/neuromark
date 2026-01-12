import Foundation
import WebKit

final class WebBridge: NSObject, ObservableObject {
  @Published var searchText: String = ""
  @Published var viewMode: String = "grid"
  @Published var activeSectionTitle: String = "All Documents"
  @Published var projects: [ProjectItem] = []

  fileprivate weak var webView: WKWebView?

  func attach(_ webView: WKWebView) {
    self.webView = webView
  }

  func send(_ payload: [String: Any]) {
    guard let jsonData = try? JSONSerialization.data(withJSONObject: payload),
          let json = String(data: jsonData, encoding: .utf8) else {
      return
    }

    let script = "window.dispatchEvent(new CustomEvent('nativeMessage',{detail:\(json)}));"
    webView?.evaluateJavaScript(script, completionHandler: nil)
  }

  func setSearch(_ value: String) {
    send(["type": "setSearchQuery", "value": value])
  }

  func setViewMode(_ value: String) {
    send(["type": "setViewMode", "value": value])
  }

  func setFilter(_ filter: [String: Any]) {
    send(["type": "setFilter", "value": filter])
  }

  func setTheme(_ value: String) {
    send(["type": "setTheme", "value": value])
  }

  func openAddBookmark() {
    send(["type": "openAddBookmark"])
  }
}

struct ProjectItem: Identifiable {
  let id: String
  let name: String
  let color: String
  let count: Int
}
