package com.example.nyra

import android.webkit.JavascriptInterface
import android.webkit.WebView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONObject

class NyraWebBridge(
  private val repository: NyraRepository,
  private val webViewProvider: () -> WebView?,
) {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  @JavascriptInterface
  fun getBackendBaseUrl(): String = NyraBackendConfig.baseUrl

  @JavascriptInterface
  fun invokeAsync(requestId: String, action: String, payloadJson: String?) {
    val safePayload = payloadJson ?: "{}"
    scope.launch {
      val resultJson = try {
        when (action) {
          "health" -> repository.checkHealthJson()
          "quota" -> {
            val studentId = runCatching { JSONObject(safePayload).optString("studentId") }.getOrDefault("")
            repository.fetchQuotaJson(studentId)
          }
          "snapshot" -> {
            val studentId = runCatching { JSONObject(safePayload).optString("studentId") }.getOrDefault("")
            repository.getStudentSnapshotJson(studentId)
          }
          "student" -> repository.switchOrCreateStudentJson(safePayload)
          "recordResult" -> repository.recordTestResultJson(safePayload)
          "markLevelCompleted" -> repository.markLevelCompletedJson(safePayload)
          "chat" -> repository.sendChatJson(safePayload)
          "generateLevel" -> repository.generateAdaptiveLevelJson(safePayload)
          "generateTest" -> repository.generateAdaptiveTestJson(safePayload)
          else -> JSONObject().put("ok", false).put("notice", "Unsupported action").toString()
        }
      } catch (e: Exception) {
        JSONObject()
          .put("ok", false)
          .put("notice", e.message ?: "Unable to complete action right now.")
          .toString()
      }

      val targetWebView = webViewProvider() ?: return@launch
      val quotedRequestId = JSONObject.quote(requestId)
      val quotedResult = JSONObject.quote(resultJson)
      targetWebView.post {
        targetWebView.evaluateJavascript(
          "window.__nyraBridgeResolve && window.__nyraBridgeResolve($quotedRequestId, $quotedResult);",
          null,
        )
      }
    }
  }
}
