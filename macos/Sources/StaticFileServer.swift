import Foundation
import Network

final class StaticFileServer {
  private let rootURL: URL
  private let queue = DispatchQueue(label: "NeuroMark.StaticFileServer")
  private var listener: NWListener?
  private var didSignalReady = false

  init(rootURL: URL) {
    self.rootURL = rootURL
  }

  func start(completion: @escaping (URL?) -> Void) {
    do {
      let listener = try NWListener(using: .tcp, on: .any)
      self.listener = listener

      listener.stateUpdateHandler = { [weak self] state in
        guard let self else { return }
        switch state {
        case .ready:
          guard !self.didSignalReady else { return }
          self.didSignalReady = true
          let portValue = listener.port?.rawValue ?? 0
          if portValue > 0 {
            completion(URL(string: "http://127.0.0.1:\(portValue)"))
          } else {
            completion(nil)
          }
        case .failed:
          completion(nil)
        default:
          break
        }
      }

      listener.newConnectionHandler = { [weak self] connection in
        self?.handle(connection)
      }

      listener.start(queue: queue)
    } catch {
      completion(nil)
    }
  }

  func stop() {
    listener?.cancel()
    listener = nil
  }

  private func handle(_ connection: NWConnection) {
    connection.start(queue: queue)
    var buffer = Data()

    func receiveLoop() {
      connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { [weak self] data, _, _, _ in
        guard let self else { return }
        guard let data, !data.isEmpty else {
          connection.cancel()
          return
        }

        buffer.append(data)
        if let range = buffer.range(of: Data("\r\n\r\n".utf8)) {
          let headerData = buffer.subdata(in: buffer.startIndex..<range.lowerBound)
          guard let request = String(data: headerData, encoding: .utf8) else {
            self.respond(connection, status: "400 Bad Request", body: "Bad Request".data(using: .utf8))
            return
          }

          let lines = request.split(separator: "\r\n", omittingEmptySubsequences: false)
          guard let requestLine = lines.first else {
            self.respond(connection, status: "400 Bad Request", body: "Bad Request".data(using: .utf8))
            return
          }

          let parts = requestLine.split(separator: " ")
          guard parts.count >= 2, parts[0] == "GET" else {
            self.respond(connection, status: "405 Method Not Allowed", body: "Method Not Allowed".data(using: .utf8))
            return
          }

          var rawPath = String(parts[1])
          if let queryIndex = rawPath.firstIndex(of: "?") {
            rawPath = String(rawPath[..<queryIndex])
          }

          let decodedPath = rawPath.removingPercentEncoding ?? rawPath
          let path = decodedPath == "/" ? "/index.html" : decodedPath
          let sanitizedPath = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
          let fileURL = rootURL.appendingPathComponent(sanitizedPath)
          let resolved = fileURL.standardizedFileURL

          guard resolved.path.hasPrefix(rootURL.standardizedFileURL.path) else {
            self.respond(connection, status: "403 Forbidden", body: "Forbidden".data(using: .utf8))
            return
          }

          guard let fileData = try? Data(contentsOf: resolved) else {
            self.respond(connection, status: "404 Not Found", body: "Not Found".data(using: .utf8))
            return
          }

          let mime = self.mimeType(for: resolved.pathExtension)
          self.respond(connection, status: "200 OK", body: fileData, contentType: mime)
        } else {
          receiveLoop()
        }
      }
    }

    receiveLoop()
  }

  private func respond(
    _ connection: NWConnection,
    status: String,
    body: Data?,
    contentType: String = "text/plain; charset=utf-8"
  ) {
    let length = body?.count ?? 0
    let header = """
    HTTP/1.1 \(status)\r
    Content-Type: \(contentType)\r
    Access-Control-Allow-Origin: *\r
    Content-Length: \(length)\r
    Connection: close\r
    \r
    """

    let headerData = Data(header.utf8)
    connection.send(content: headerData, completion: .contentProcessed { _ in
      if let body {
        connection.send(content: body, completion: .contentProcessed { _ in
          connection.cancel()
        })
      } else {
        connection.cancel()
      }
    })
  }

  private func mimeType(for ext: String) -> String {
    switch ext.lowercased() {
    case "html":
      return "text/html; charset=utf-8"
    case "js":
      return "application/javascript; charset=utf-8"
    case "css":
      return "text/css; charset=utf-8"
    case "svg":
      return "image/svg+xml"
    case "png":
      return "image/png"
    case "jpg", "jpeg":
      return "image/jpeg"
    case "json":
      return "application/json; charset=utf-8"
    case "ico":
      return "image/x-icon"
    case "woff2":
      return "font/woff2"
    case "woff":
      return "font/woff"
    case "ttf":
      return "font/ttf"
    case "map":
      return "application/json; charset=utf-8"
    default:
      return "application/octet-stream"
    }
  }
}
