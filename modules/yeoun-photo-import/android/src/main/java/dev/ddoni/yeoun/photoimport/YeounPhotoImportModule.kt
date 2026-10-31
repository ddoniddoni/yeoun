package dev.ddoni.yeoun.photoimport

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorSpace
import android.graphics.ImageDecoder
import android.graphics.Matrix
import android.graphics.Paint
import android.net.Uri
import android.os.Build
import androidx.exifinterface.media.ExifInterface
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

class YeounPhotoImportModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("YeounPhotoImport")
    AsyncFunction("recoveryDirectoryAsync") { recovery().directory().path }
    AsyncFunction("stashRecoveryFileAsync") { uri: String, name: String -> recovery().stash(uri, name) }
    AsyncFunction("restoreRecoveryFileAsync") { name: String, bytes: Long, sha256: String, uri: String ->
      recovery().restore(name, bytes, sha256, uri)
    }
    AsyncFunction("pruneRecoveryFilesAsync") { keep: List<String> -> recovery().prune(keep) }
    // AsyncFunction's module queue owns bitmaps; nothing crosses the bridge but file metadata.
    AsyncFunction("prepareAsync") { sourceUri: String, destinationUri: String ->
      prepare(sourceUri, destinationUri)
    }
  }

  private fun recovery() = RecoveryFiles(requireNotNull(appContext.reactContext))

  private fun boundedSize(width: Int, height: Int): Pair<Int, Int> {
    require(width > 0 && height > 0 && width <= 100_000 && height <= 100_000 &&
      width.toLong() * height <= 200_000_000L) { "IMPORT_SIZE" }
    val scale = min(1.0, min(sqrt(12_000_000.0 / (width.toDouble() * height)), 4096.0 / max(width, height)))
    return Pair(max(1, floor(width * scale).toInt()), max(1, floor(height * scale).toInt()))
  }

  private fun prepare(sourceUri: String, destinationUri: String): Map<String, Any> {
    val context = requireNotNull(appContext.reactContext)
    val sourceUrl = Uri.parse(sourceUri)
    val outputUrl = Uri.parse(destinationUri)
    require(sourceUrl.scheme == "file" && outputUrl.scheme == "file") { "IMPORT_FILE" }
    val source = File(requireNotNull(sourceUrl.path)).canonicalFile
    val output = File(requireNotNull(outputUrl.path)).canonicalFile
    val cache = context.cacheDir.canonicalPath + File.separator
    require(source.path.startsWith(cache) && output.path.startsWith(cache + "yeoun-m0/") &&
      output.name == "source.jpg" && source != output) { "IMPORT_FILE" }
    require(source.length() in 1L..(100L * 1024 * 1024)) { "IMPORT_SIZE" }
    var decoded: Bitmap? = null
    var flattened: Bitmap? = null
    var resized = false
    var png = false
    try {
      decoded = if (Build.VERSION.SDK_INT >= 28) {
        ImageDecoder.decodeBitmap(ImageDecoder.createSource(source)) { decoder, info, _ ->
          require(info.mimeType in setOf("image/jpeg", "image/png", "image/heic", "image/heif") && !info.isAnimated) { "IMPORT_FORMAT" }
          png = info.mimeType == "image/png"
          val (w, h) = boundedSize(info.size.width, info.size.height)
          resized = w < info.size.width || h < info.size.height
          decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
          decoder.setTargetSize(w, h)
          decoder.setTargetColorSpace(ColorSpace.get(ColorSpace.Named.SRGB))
          decoder.setOnPartialImageListener { false }
        }
      } else {
        // API 24–27: bound pixel allocation with inSampleSize, then normalize EXIF.
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(source.path, bounds)
        require(bounds.outMimeType in setOf("image/jpeg", "image/png")) { "IMPORT_FORMAT" }
        png = bounds.outMimeType == "image/png"
        val (w, h) = boundedSize(bounds.outWidth, bounds.outHeight)
        var sample = 1
        while ((bounds.outWidth.toLong() + sample - 1) / sample > w ||
          (bounds.outHeight.toLong() + sample - 1) / sample > h) sample *= 2
        resized = sample > 1
        val bitmap = requireNotNull(BitmapFactory.decodeFile(source.path, BitmapFactory.Options().apply {
          inSampleSize = sample; inPreferredConfig = Bitmap.Config.ARGB_8888
        })) { "IMPORT_DECODE" }
        try {
          val exif = ExifInterface(source)
          val matrix = Matrix().apply {
            if (exif.isFlipped) postScale(-1f, 1f)
            postRotate(exif.rotationDegrees.toFloat())
          }
          val oriented = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
          if (oriented !== bitmap) bitmap.recycle()
          oriented
        } catch (error: Throwable) { bitmap.recycle(); throw error }
      }
      val image = requireNotNull(decoded)
      require(image.width.toLong() * image.height <= 12_000_000L && max(image.width, image.height) <= 4096) { "IMPORT_SIZE" }
      val flat = Bitmap.createBitmap(image.width, image.height, Bitmap.Config.ARGB_8888)
      flattened = flat
      Canvas(flat).apply { drawColor(Color.WHITE); drawBitmap(image, 0f, 0f, Paint(Paint.FILTER_BITMAP_FLAG)) }
      output.outputStream().use { require(flat.compress(Bitmap.CompressFormat.JPEG, 100, it)) { "IMPORT_WRITE" } }
      require(output.length() > 0) { "IMPORT_WRITE" }
      return mapOf("width" to flat.width, "height" to flat.height, "resized" to resized, "flattened" to png)
    } catch (error: Throwable) {
      output.delete()
      throw error
    } finally {
      flattened?.recycle()
      decoded?.recycle()
    }
  }
}
