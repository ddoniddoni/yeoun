import Foundation
import CryptoKit

// Independent of working/shared caches. All operations run on Expo's module queue.
enum RecoveryFiles {
  private static let limit = 100 * 1024 * 1024
  private static func fail() -> NSError {
    NSError(domain: "YeounRecovery", code: 1, userInfo: [NSLocalizedDescriptionKey: "RECOVERY_FILE"])
  }
  static func directory() throws -> URL {
    let manager = FileManager.default
    var url = manager.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("yeoun-recovery", isDirectory: true)
    try manager.createDirectory(at: url, withIntermediateDirectories: true)
    var values = URLResourceValues(); values.isExcludedFromBackup = true
    try url.setResourceValues(values)
    return url
  }
  private static func validName(_ name: String) -> Bool {
    name.range(of: "^(source|output)-[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\\.jpg$", options: .regularExpression) != nil
  }
  private static func managed(_ name: String) throws -> URL {
    guard validName(name) else { throw fail() }
    let root = try directory().resolvingSymlinksInPath()
    let url = root.appendingPathComponent(name).resolvingSymlinksInPath()
    guard url.deletingLastPathComponent().path == root.path else { throw fail() }
    return url
  }
  private static func working(_ uri: String) throws -> URL {
    let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("yeoun-m0").resolvingSymlinksInPath().path + "/"
    guard let url = URL(string: uri), url.isFileURL else { throw fail() }
    let path = url.resolvingSymlinksInPath().path
    guard path.hasPrefix(root) else { throw fail() }
    let relative = String(path.dropFirst(root.count))
    guard relative.range(of: "^[A-Za-z0-9-]{1,100}/(source|filtered(-[0-9]+)?)\\.jpg$", options: .regularExpression) != nil
      else { throw fail() }
    return url
  }
  private static func digest(_ url: URL) throws -> (Int, String) {
    let handle = try FileHandle(forReadingFrom: url); defer { try? handle.close() }
    var hash = SHA256(); var size = 0
    while let chunk = try handle.read(upToCount: 256 * 1024), !chunk.isEmpty {
      size += chunk.count
      guard size <= limit else { throw fail() }
      hash.update(data: chunk)
    }
    guard size > 0 else { throw fail() }
    return (size, hash.finalize().map { String(format: "%02x", $0) }.joined())
  }
  private static func copy(_ source: URL, _ target: URL) throws -> (Int, String) {
    let manager = FileManager.default
    guard !manager.fileExists(atPath: target.path) else { throw fail() }
    let expected = try digest(source)
    do {
      try manager.copyItem(at: source, to: target)
      let handle = try FileHandle(forWritingTo: target)
      defer { try? handle.close() }
      try handle.synchronize()
      let actual = try digest(target)
      guard actual == expected else { throw fail() }
      return actual
    } catch { try? manager.removeItem(at: target); throw error }
  }
  static func stash(_ uri: String, _ name: String) throws -> [String: Any] {
    let (bytes, sha256) = try copy(working(uri), managed(name))
    return ["bytes": bytes, "sha256": sha256]
  }
  static func restore(_ name: String, _ bytes: Int, _ sha256: String, _ uri: String) throws {
    let source = try managed(name)
    let actual = try digest(source)
    guard actual.0 == bytes && actual.1 == sha256 else { throw fail() }
    _ = try copy(source, working(uri))
  }
  static func prune(_ keep: [String]) throws {
    guard keep.allSatisfy({ validName($0) }) else { throw fail() }
    for url in try FileManager.default.contentsOfDirectory(at: directory(), includingPropertiesForKeys: nil) {
      if validName(url.lastPathComponent) && !keep.contains(url.lastPathComponent) {
        try FileManager.default.removeItem(at: url)
      }
    }
  }
}
