package com.example.nyra

import com.squareup.moshi.JsonClass
import org.json.JSONArray
import org.json.JSONObject

@JsonClass(generateAdapter = true)
data class NyraHealthQuotaDto(
  val day: String? = null,
  val orgRequestsToday: Int? = null,
  val orgDailyReqLimit: Int? = null,
  val cooldownActive: Boolean? = null,
  val note: String? = null,
)

@JsonClass(generateAdapter = true)
data class NyraHealthResponse(
  val status: String? = null,
  val company: String? = null,
  val service: String? = null,
  val model: String? = null,
  val groqConfigured: Boolean? = null,
  val requireAppCheck: Boolean? = null,
  val requireFirebaseAuth: Boolean? = null,
  val quota: NyraHealthQuotaDto? = null,
) {
  val isHealthy: Boolean
    get() = status == "ok" && groqConfigured != false
}

@JsonClass(generateAdapter = true)
data class NyraQuotaResponse(
  val day: String? = null,
  val userUsedToday: Int = 0,
  val userDailyLimit: Int = 25,
  val userRemainingToday: Int = 25,
  val cooldownActive: Boolean = false,
  val message: String? = null,
)

@JsonClass(generateAdapter = true)
data class NyraChatMessageDto(
  val role: String,
  val content: String,
)

@JsonClass(generateAdapter = true)
data class NyraChatRequest(
  val messages: List<NyraChatMessageDto>,
  val classLevel: String? = null,
  val subject: String? = null,
  val languageMode: String? = null,
  val stream: Boolean = false,
)

@JsonClass(generateAdapter = true)
data class NyraGenerateRequest(
  val prompt: String,
  val classLevel: String? = null,
  val subject: String? = null,
  val languageMode: String? = null,
)

@JsonClass(generateAdapter = true)
data class NyraErrorResponse(
  val code: String? = null,
  val userMessage: String? = null,
  val error: String? = null,
  val retryAfterSeconds: Int? = null,
)

object NyraJsonParsers {
  fun extractChatReplyText(rawJson: String): String {
    val obj = runCatching { JSONObject(rawJson) }.getOrNull() ?: return ""
    val replyVal = obj.opt("reply")
    when (replyVal) {
      is String -> if (replyVal.isNotBlank()) return replyVal.trim()
      is JSONObject -> {
        val nested = replyVal.optString("text", "").trim()
        if (nested.isNotBlank()) return nested
      }
    }
    val textVal = obj.optString("text", "").trim()
    if (textVal.isNotBlank()) return textVal
    val msgVal = obj.optString("message", "").trim()
    if (msgVal.isNotBlank()) return msgVal
    val choices = obj.optJSONArray("choices")
    if (choices != null && choices.length() > 0) {
      val content = choices.optJSONObject(0)?.optJSONObject("message")?.optString("content", "")?.trim()
      if (!content.isNullOrBlank()) return content
    }
    return ""
  }

  fun extractJsonObject(rawBody: String): JSONObject? {
    val trimmed = rawBody.trim()
    val candidates = mutableListOf(trimmed)
    val stripped = trimmed
      .replace(Regex("^```(?:json)?\\s*", RegexOption.IGNORE_CASE), "")
      .replace(Regex("\\s*```$"), "")
      .trim()
    if (stripped != trimmed) candidates.add(stripped)
    val firstBrace = stripped.indexOf('{')
    val lastBrace = stripped.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      candidates.add(stripped.substring(firstBrace, lastBrace + 1))
    }
    for (candidate in candidates) {
      val parsed = runCatching { JSONObject(candidate) }.getOrNull()
      if (parsed != null) return parsed
    }
    return null
  }

  fun normalizeGeneratedLevel(
    rawObj: JSONObject,
    studentId: String,
    classAge: Int,
    className: String,
    subject: String,
    fallbackTopic: String,
    difficulty: String,
  ): JSONObject? {
    val src = rawObj.optJSONObject("level") ?: rawObj
    val title = src.optString("title", "").trim()
    val explanation = src.optString("simpleExplanation", "").trim()
    if (title.isBlank() || explanation.isBlank()) return null

    val rawActivities = src.optJSONArray("activities") ?: return null
    val cleanActivities = JSONArray()
    for (i in 0 until minOf(rawActivities.length(), 4)) {
      val item = rawActivities.optJSONObject(i) ?: continue
      val aTitle = item.optString("title", "").trim()
      val aInst = item.optString("instruction", "").trim()
      val aEx = item.optString("example", "").trim()
      if (aTitle.isNotBlank() && aInst.isNotBlank()) {
        cleanActivities.put(
          JSONObject()
            .put("title", aTitle)
            .put("instruction", aInst)
            .put("example", aEx),
        )
      }
    }
    if (cleanActivities.length() == 0) return null

    val rawPractice = src.optJSONArray("practiceQuestions") ?: return null
    val cleanPractice = JSONArray()
    for (i in 0 until minOf(rawPractice.length(), 4)) {
      val q = rawPractice.optJSONObject(i) ?: continue
      val prompt = q.optString("prompt", "").trim()
      var correct = q.optString("correctAnswer", "").trim()
      val hint = q.optString("hint", "Take one small step and check carefully!").trim()
      val rawOpts = q.optJSONArray("options") ?: continue
      val opts = mutableListOf<String>()
      for (j in 0 until rawOpts.length()) {
        val o = rawOpts.optString(j, "").trim()
        if (o.isNotBlank() && !opts.contains(o)) opts.add(o)
      }
      if (correct.isNotBlank() && !opts.contains(correct)) {
        val letterIdx = listOf("a", "b", "c", "d").indexOf(correct.lowercase())
        if (letterIdx in opts.indices) {
          correct = opts[letterIdx]
        } else {
          opts.add(0, correct)
        }
      }
      if (prompt.isNotBlank() && correct.isNotBlank() && opts.size >= 2) {
        val limitedOpts = JSONArray(opts.take(3))
        cleanPractice.put(
          JSONObject()
            .put("prompt", prompt)
            .put("options", limitedOpts)
            .put("correctAnswer", correct)
            .put("hint", hint),
        )
      }
    }
    if (cleanPractice.length() == 0) return null

    return JSONObject()
      .put("id", "nyra-lvl-${System.currentTimeMillis()}")
      .put("studentId", studentId)
      .put("classAge", classAge)
      .put("className", className)
      .put("difficulty", difficulty)
      .put("title", title)
      .put("subject", subject)
      .put("topic", src.optString("topic", fallbackTopic).ifBlank { fallbackTopic })
      .put(
        "learningObjective",
        src.optString(
          "learningObjective",
          "Build clear understanding of $fallbackTopic for $className.",
        ),
      )
      .put("simpleExplanation", explanation)
      .put("activities", cleanActivities)
      .put("practiceQuestions", cleanPractice)
      .put(
        "completionCriteria",
        src.optString(
          "completionCriteria",
          "Complete all activities and answer the practice questions.",
        ),
      )
      .put("completed", false)
      .put("source", "backend")
  }

  fun normalizeGeneratedTest(
    rawObj: JSONObject,
    studentId: String,
    classAge: Int,
    className: String,
    subject: String,
    topic: String,
    difficulty: String,
    linkedLevelId: String?,
  ): JSONObject? {
    val src = rawObj.optJSONObject("test") ?: rawObj
    val rawQuestions = src.optJSONArray("questions") ?: return null
    val allowedTypes = setOf("mcq", "true_false", "fill_blank", "short_answer")
    val cleanQuestions = JSONArray()

    for (i in 0 until minOf(rawQuestions.length(), 6)) {
      val q = rawQuestions.optJSONObject(i) ?: continue
      val rawType = q.optString("type", "mcq").trim()
      val type = if (allowedTypes.contains(rawType)) rawType else "mcq"
      val prompt = q.optString("prompt", "").trim()
      var correct = q.optString("correctAnswer", "").trim()
      val explanation = q.optString("explanation", "The correct answer is $correct.").trim()
      if (prompt.isBlank() || correct.isBlank()) continue

      val item = JSONObject()
        .put("id", q.optString("id", "q${i + 1}").ifBlank { "q${i + 1}" })
        .put("type", type)
        .put("topic", q.optString("topic", topic).ifBlank { topic })
        .put("prompt", prompt)

      when (type) {
        "true_false" -> {
          item.put("options", JSONArray(listOf("True", "False")))
        }
        "mcq" -> {
          val rawOpts = q.optJSONArray("options")
          val opts = mutableListOf<String>()
          if (rawOpts != null) {
            for (j in 0 until rawOpts.length()) {
              val o = rawOpts.optString(j, "").trim()
              if (o.isNotBlank() && !opts.contains(o)) opts.add(o)
            }
          }
          if (!opts.contains(correct)) {
            val letterIdx = listOf("a", "b", "c", "d").indexOf(correct.lowercase())
            if (letterIdx in opts.indices) {
              correct = opts[letterIdx]
            } else {
              opts.add(0, correct)
            }
          }
          if (opts.size < 2) continue
          item.put("options", JSONArray(opts.take(4)))
        }
      }

      item.put("correctAnswer", correct)
      item.put("explanation", explanation)
      cleanQuestions.put(item)
    }

    if (cleanQuestions.length() == 0) return null

    val title = src.optString("title", "").trim().ifBlank {
      "NYRA $subject Practice Test ($className)"
    }

    return JSONObject()
      .put("id", "nyra-test-${System.currentTimeMillis()}")
      .put("studentId", studentId)
      .put("linkedLevelId", linkedLevelId ?: JSONObject.NULL)
      .put("classAge", classAge)
      .put("className", className)
      .put("subject", subject)
      .put("topic", topic)
      .put("difficulty", difficulty)
      .put("title", title)
      .put("questions", cleanQuestions)
      .put("source", "backend")
  }
}
