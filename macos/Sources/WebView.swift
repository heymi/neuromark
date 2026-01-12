import SwiftUI
import WebKit

struct WebView: NSViewRepresentable {
  @EnvironmentObject var bridge: WebBridge

  func makeCoordinator() -> Coordinator {
    Coordinator(bridge: bridge)
  }

  func makeNSView(context: Context) -> WKWebView {
    let config = WKWebViewConfiguration()
    let controller = WKUserContentController()
    controller.add(context.coordinator, name: "neuromark")
    config.userContentController = controller

    let webView = WKWebView(frame: .zero, configuration: config)
    webView.setValue(false, forKey: "drawsBackground")
    webView.navigationDelegate = context.coordinator
    bridge.attach(webView)

    let distURL =
      Bundle.main.resourceURL?.appendingPathComponent("dist") ??
      Bundle.main.url(forResource: "dist", withExtension: nil, subdirectory: "Resources")

    if let distURL {
      let indexURL = distURL.appendingPathComponent("index.html")
      if FileManager.default.fileExists(atPath: indexURL.path) {
        context.coordinator.startServer(rootURL: distURL, webView: webView)
      } else {
        let html = """
        <html><body style='font-family:-apple-system;background:#111;color:#fff;'>
        <h3>dist/index.html not found</h3>
        <p>Run npm build and copy dist/ into macos/Resources/dist/.</p>
        </body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
      }
    } else {
      let html = "<html><body style='font-family:-apple-system;background:#111;color:#fff;'><h3>dist/index.html not found</h3><p>Run npm build and copy dist/ into macos/Resources/dist/.</p></body></html>"
      webView.loadHTMLString(html, baseURL: nil)
    }

    return webView
  }

  func updateNSView(_ nsView: WKWebView, context: Context) {}

  final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
    private let bridge: WebBridge
    private var server: StaticFileServer?

    init(bridge: WebBridge) {
      self.bridge = bridge
    }

    deinit {
      server?.stop()
    }

    func startServer(rootURL: URL, webView: WKWebView) {
      if server != nil { return }
      let newServer = StaticFileServer(rootURL: rootURL)
      server = newServer
      newServer.start { baseURL in
        DispatchQueue.main.async {
          if let baseURL {
            let indexURL = baseURL.appendingPathComponent("index.html")
            webView.load(URLRequest(url: indexURL))
          } else {
            let indexURL = rootURL.appendingPathComponent("index.html")
            webView.loadFileURL(indexURL, allowingReadAccessTo: rootURL)
          }
        }
      }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
      guard message.name == "neuromark" else { return }
      guard let body = message.body as? [String: Any],
            let type = body["type"] as? String else { return }

      if type == "stateChanged" {
        bridge.activeSectionTitle = body["title"] as? String ?? bridge.activeSectionTitle
        if let projectList = body["projects"] as? [[String: Any]] {
          bridge.projects = projectList.compactMap { item in
            guard let id = item["id"] as? String,
                  let name = item["name"] as? String,
                  let color = item["color"] as? String else {
              return nil
            }
            let count = item["count"] as? Int ?? 0
            return ProjectItem(id: id, name: name, color: color, count: count)
          }
        }
      }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
      NSLog("WKWebView navigation failed: %@", error.localizedDescription)
      let html = "<html><body style='font-family:-apple-system;background:#111;color:#fff;'><h3>Failed to load content</h3><p>\(error.localizedDescription)</p></body></html>"
      webView.loadHTMLString(html, baseURL: nil)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
      NSLog("WKWebView provisional navigation failed: %@", error.localizedDescription)
      let html = "<html><body style='font-family:-apple-system;background:#111;color:#fff;'><h3>Failed to load content</h3><p>\(error.localizedDescription)</p></body></html>"
      webView.loadHTMLString(html, baseURL: nil)
    }
  }
}
