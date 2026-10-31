package dev.ddoni.yeoun.photoimport

import android.content.Context
import android.net.Uri
import java.io.File
import java.security.MessageDigest

// Native streaming IO only; no photo buffers or pixels cross the JS bridge.
internal class RecoveryFiles(private val context: Context) {
  private val namePattern = Regex("^(source|output)-[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\\.jpg$")
  fun directory(): File = File(context.noBackupFilesDir, "yeoun-recovery").apply {
    require(isDirectory || mkdirs()) { "RECOVERY_DIRECTORY" }
  }.canonicalFile
  private fun managed(name: String): File {
    require(namePattern.matches(name)) { "RECOVERY_NAME" }
    val root = directory()
    return File(root, name).canonicalFile.also { require(it.parentFile == root) { "RECOVERY_PATH" } }
  }
  private fun working(uri: String): File {
    val url = Uri.parse(uri)
    require(url.scheme == "file") { "RECOVERY_PATH" }
    val file = File(requireNotNull(url.path)).canonicalFile
    val prefix = File(context.cacheDir, "yeoun-m0").canonicalPath + "/"
    require(file.path.startsWith(prefix) &&
      Regex("^[A-Za-z0-9-]{1,100}/(source|filtered(-[0-9]+)?)\\.jpg$").matches(file.path.removePrefix(prefix))) { "RECOVERY_PATH" }
    return file
  }
  private fun digest(file: File): Pair<Long, String> {
    val hash = MessageDigest.getInstance("SHA-256")
    var size = 0L
    file.inputStream().buffered().use { input ->
      val buffer = ByteArray(256 * 1024)
      while (true) {
        val count = input.read(buffer)
        if (count < 0) break
        size += count
        require(size <= 100L * 1024 * 1024) { "RECOVERY_SIZE" }
        hash.update(buffer, 0, count)
      }
    }
    require(size > 0) { "RECOVERY_SIZE" }
    return size to hash.digest().joinToString("") { "%02x".format(it.toInt() and 0xff) }
  }
  private fun copy(source: File, target: File): Pair<Long, String> {
    require(!target.exists()) { "RECOVERY_EXISTS" }
    val expected = digest(source)
    require(target.createNewFile()) { "RECOVERY_CREATE" }
    try {
      source.inputStream().use { input -> target.outputStream().use { output ->
        input.copyTo(output, 256 * 1024); output.fd.sync()
      } }
      val actual = digest(target)
      require(actual == expected) { "RECOVERY_CHECKSUM" }
      return actual
    } catch (error: Throwable) { target.delete(); throw error }
  }
  fun stash(uri: String, name: String): Map<String, Any> {
    val (bytes, sha256) = copy(working(uri), managed(name))
    return mapOf("bytes" to bytes, "sha256" to sha256)
  }
  fun restore(name: String, bytes: Long, sha256: String, uri: String) {
    val source = managed(name)
    require(digest(source) == (bytes to sha256)) { "RECOVERY_CHECKSUM" }
    copy(source, working(uri))
  }
  fun prune(keep: List<String>) {
    require(keep.all { namePattern.matches(it) }) { "RECOVERY_NAME" }
    for (file in requireNotNull(directory().listFiles())) {
      if (namePattern.matches(file.name) && file.name !in keep) require(file.delete()) { "RECOVERY_DELETE" }
    }
  }
}
