import ExpoModulesCore
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

public class YeounPhotoImportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("YeounPhotoImport")
    // Expo's module queue owns all decode/encode resources, never the UI/worklet runtime.
    AsyncFunction("prepareAsync") { (sourceUri: String, destinationUri: String) -> [String: Any] in
      try autoreleasepool { try self.prepare(sourceUri, destinationUri) }
    }
  }

  private func fail(_ code: String) -> NSError {
    NSError(domain: "YeounPhotoImport", code: 1, userInfo: [NSLocalizedDescriptionKey: code])
  }

  private func prepare(_ sourceUri: String, _ destinationUri: String) throws -> [String: Any] {
    let manager = FileManager.default
    let cache = manager.urls(for: .cachesDirectory, in: .userDomainMask)[0].resolvingSymlinksInPath().path + "/"
    guard let input = URL(string: sourceUri), input.isFileURL,
          let output = URL(string: destinationUri), output.isFileURL,
          input.resolvingSymlinksInPath().path.hasPrefix(cache),
          output.resolvingSymlinksInPath().path.hasPrefix(cache + "yeoun-m0/"),
          output.lastPathComponent == "source.jpg", input != output else { throw fail("IMPORT_FILE") }
    let size = (try manager.attributesOfItem(atPath: input.path)[.size] as? NSNumber)?.int64Value ?? 0
    guard size > 0 && size <= 100 * 1024 * 1024 else { throw fail("IMPORT_SIZE") }
    guard let source = CGImageSourceCreateWithURL(input as CFURL,
      [kCGImageSourceShouldCache: false] as CFDictionary),
      let sourceType = CGImageSourceGetType(source)
      else { throw fail("IMPORT_FORMAT") }
    let type = sourceType as String
    guard [UTType.jpeg.identifier, UTType.png.identifier, UTType.heic.identifier, UTType.heif.identifier].contains(type)
      else { throw fail("IMPORT_FORMAT") }
    if type == UTType.png.identifier && CGImageSourceGetCount(source) != 1 { throw fail("IMPORT_FORMAT") }
    let index = CGImageSourceGetPrimaryImageIndex(source)
    guard let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any],
      let w = properties[kCGImagePropertyPixelWidth] as? NSNumber,
      let h = properties[kCGImagePropertyPixelHeight] as? NSNumber else { throw fail("IMPORT_FORMAT") }
    let width = w.doubleValue, height = h.doubleValue
    guard width > 0 && height > 0 && width <= 100_000 && height <= 100_000 && width * height <= 200_000_000
      else { throw fail("IMPORT_SIZE") }
    let scale = min(1.0, min(sqrt(12_000_000 / (width * height)), 4096 / max(width, height)))
    let edge = max(1, Int(floor(max(width, height) * scale)))
    // Read metadata first, then ask ImageIO to downsample while decoding and apply all EXIF orientations.
    guard let image = CGImageSourceCreateThumbnailAtIndex(source, index, [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceThumbnailMaxPixelSize: edge,
      kCGImageSourceShouldCacheImmediately: true
    ] as CFDictionary), image.width * image.height <= 12_000_000, max(image.width, image.height) <= 4096,
      let space = CGColorSpace(name: CGColorSpace.sRGB),
      let context = CGContext(data: nil, width: image.width, height: image.height,
        bitsPerComponent: 8, bytesPerRow: 0, space: space,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { throw fail("IMPORT_DECODE") }
    let rect = CGRect(x: 0, y: 0, width: CGFloat(image.width), height: CGFloat(image.height))
    context.setFillColor(CGColor(gray: 1, alpha: 1)); context.fill(rect)
    context.draw(image, in: rect)
    guard let flattened = context.makeImage() else { throw fail("IMPORT_DECODE") }
    do {
      guard let writer = CGImageDestinationCreateWithURL(output as CFURL, UTType.jpeg.identifier as CFString, 1, nil)
        else { throw fail("IMPORT_WRITE") }
      // Fresh SDR JPEG, no source EXIF/GPS or orientation tag is copied.
      CGImageDestinationAddImage(writer, flattened, [kCGImageDestinationLossyCompressionQuality: 1.0] as CFDictionary)
      guard CGImageDestinationFinalize(writer) else { throw fail("IMPORT_WRITE") }
      return ["width": image.width, "height": image.height, "resized": scale < 1,
        "flattened": type == UTType.png.identifier]
    } catch {
      try? manager.removeItem(at: output)
      throw error
    }
  }
}
