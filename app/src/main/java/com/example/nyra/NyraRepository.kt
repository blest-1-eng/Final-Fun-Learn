package com.example.nyra

import com.example.data.local.FunLearnDao
import com.example.data.local.NyraChatMessageEntity
import com.example.data.local.NyraLevelEntity
import com.example.data.local.NyraQuotaCacheEntity
import com.example.data.local.NyraTestEntity
import com.example.data.local.StudentProfileEntity
import com.example.data.local.TestResultEntity
import java.io.IOException
import java.net.SocketTimeoutException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

class NyraRepository(
  private val dao: FunLearnDao,
  private val apiService: NyraApiService = NyraClientProvider.createService(),
) {

  companion object {
    const val DEFAULT_STUDENT_ID = "student-default"

    fun getClassName(age: Int): String = when (age) {
      3 -> "Nursery"
      4 -> "LKG"
      5 -> "UKG"
      6 -> "1st Class"
      7 -> "2nd Class"
      8 -> "3rd Class"
      9 -> "4th Class"
      else -> "5th Class"
    }

    fun resolveSubjectAndTopic(mode: String): Pair<String, String> = when (mode) {
      "abc", "ws4" -> "English" to "Alphabet & Letter Match"
      "phonics", "missingword" -> "English" to "Phonics & Missing Letters"
      "sentences", "sentencefill", "english" -> "English" to "Simple Sentences"
      "hindivarna", "hinditest" -> "Hindi" to "Hindi Varnamala"
      "hindimatras", "matratest" -> "Hindi" to "Hindi Matras"
      "hindiwords", "wordreadtest" -> "Hindi" to "Hindi Word Reading"
      "advancedhindi", "hindisentencequiz" -> "Hindi" to "Hindi Sentences"
      "numbers", "numbers50", "numbers100", "ws1", "ws2", "tests" -> "Math" to "Counting & Number Sense"
      "ws3", "visualadd", "addition", "addition2", "wordmath" -> "Math" to "Addition"
      "visualsub", "subtraction" -> "Math" to "Subtraction"
      "visualmul", "multiplication" -> "Math" to "Multiplication"
      "tables2to5", "table2to5test", "tables", "tables2to20", "table2to20test", "tables20" -> "Math" to "Multiplication Tables"
      "visualdiv", "divisionquiz" -> "Math" to "Division"
      "visualgreaterless", "greaterlessquiz" -> "Math" to "Number Comparison"
      "nep_logical_thinking" -> "Logical Thinking" to "Puzzles & Problem Solving"
      "nep_digital_ai" -> "Digital Literacy" to "Digital & AI Awareness"
      "nep_env_sustainability" -> "Environmental Studies" to "Nature & Sustainability"
      "nep_financial_literacy" -> "Financial Literacy" to "Money & Saving"
      "nep_indian_heritage" -> "Indian Heritage" to "Culture & Knowledge"
      "nep_life_skills_sel" -> "Life Skills" to "Communication & SEL"
      "nep_art_creativity" -> "Creative Arts" to "Art, Music & Storytelling"
      "nep_stem_innovation" -> "STEM Discovery" to "Science & Innovation"
      else -> "Math" to "Mixed Practice"
    }
  }

  private fun clientIdFor(studentId: String): String {
    val clean = studentId.trim().ifBlank { DEFAULT_STUDENT_ID }
    return "funlearn-$clean"
  }

  private fun nowLabel(): String {
    return SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault()).format(Date())
  }

  private suspend fun ensureActiveStudent(requestedStudentId: String?, requestedAge: Int? = null): StudentProfileEntity {
    val existingStudents = dao.getAllStudents()
    if (existingStudents.isEmpty()) {
      val initialAge = (requestedAge ?: 3).coerceIn(3, 10)
      val starter = StudentProfileEntity(
        id = DEFAULT_STUDENT_ID,
        name = "Little Explorer",
        avatarEmoji = "🧸",
        classAge = initialAge,
        createdAtEpochMs = System.currentTimeMillis(),
      )
      dao.upsertStudent(starter)
      return starter
    }
    val targetId = requestedStudentId?.trim().takeIf { !it.isNullOrBlank() } ?: existingStudents.first().id
    val matched = dao.getStudentById(targetId) ?: existingStudents.first()
    if (requestedAge != null && requestedAge in 3..10 && requestedAge != matched.classAge) {
      val updated = matched.copy(classAge = requestedAge)
      dao.upsertStudent(updated)
      return updated
    }
    return matched
  }

  private fun computeWeakTopics(history: List<TestResultEntity>): JSONArray {
    data class Stat(var count: Int = 0, var scoreSum: Int = 0, var lowCount: Int = 0, var subject: String = "Math")
    val stats = linkedMapOf<String, Stat>()
    for (item in history.take(15)) {
      val wrongTopics = runCatching { JSONArray(item.wrongTopicsJson) }.getOrNull()
      val topicsForEntry = mutableSetOf<String>()
      if (wrongTopics != null && wrongTopics.length() > 0) {
        for (i in 0 until wrongTopics.length()) {
          val t = wrongTopics.optString(i, "").trim()
          if (t.isNotBlank()) topicsForEntry.add(t)
        }
      }
      if (topicsForEntry.isEmpty()) {
        topicsForEntry.add(item.topic.ifBlank { item.subject })
      }
      for (topicName in topicsForEntry) {
        val current = stats.getOrPut(topicName) { Stat(subject = item.subject) }
        current.count += 1
        current.scoreSum += item.score
        if (item.score < 75 || item.wrongCount > 0) current.lowCount += 1
      }
    }
    val sorted = stats.entries
      .map { (topic, s) ->
        val avg = if (s.count > 0) (s.scoreSum.toDouble() / s.count).toInt() else 100
        Triple(topic, s, avg)
      }
      .filter { (_, s, avg) -> s.lowCount > 0 || avg < 80 }
      .sortedWith(compareBy<Triple<String, Stat, Int>> { it.third }.thenByDescending { it.second.lowCount })
      .take(4)

    val arr = JSONArray()
    for ((topic, stat, avg) in sorted) {
      arr.put(
        JSONObject()
          .put("topic", topic)
          .put("subject", stat.subject)
          .put("averageScore", avg)
          .put("attempts", stat.count),
      )
    }
    return arr
  }

  private fun computePerformanceDecline(history: List<TestResultEntity>): JSONObject {
    if (history.isEmpty()) {
      return JSONObject()
        .put("declining", false)
        .put("latestScore", JSONObject.NULL)
        .put("previousAvg", JSONObject.NULL)
        .put("message", "")
    }
    val latest = history.first().score
    if (history.size == 1) {
      val low = latest < 60
      return JSONObject()
        .put("declining", low)
        .put("latestScore", latest)
        .put("previousAvg", latest)
        .put(
          "message",
          if (low) "Let's practice this gently with NYRA step by step!" else "",
        )
    }
    val previousScores = history.drop(1).take(4).map { it.score }
    val prevAvg = previousScores.average().toInt()
    val dropped = latest < 60 || (prevAvg - latest >= 15 && latest < 80)
    return JSONObject()
      .put("declining", dropped)
      .put("latestScore", latest)
      .put("previousAvg", prevAvg)
      .put(
        "message",
        if (dropped) {
          "Good try! Let's review together with NYRA — every step makes you stronger."
        } else {
          ""
        },
      )
  }

  private fun quotaEntityToJson(entity: NyraQuotaCacheEntity?): JSONObject {
    val q = entity ?: NyraQuotaCacheEntity(
      studentId = DEFAULT_STUDENT_ID,
      userUsedToday = 0,
      userDailyLimit = 25,
      userRemainingToday = 25,
      cooldownActive = false,
      message = "NYRA is ready!",
      updatedAtEpochMs = System.currentTimeMillis(),
    )
    return JSONObject()
      .put("userUsedToday", q.userUsedToday)
      .put("userDailyLimit", q.userDailyLimit)
      .put("userRemainingToday", q.userRemainingToday)
      .put("cooldownActive", q.cooldownActive)
      .put("message", q.message)
      .put("updatedAtEpochMs", q.updatedAtEpochMs)
  }

  private fun parseErrorInfo(statusCode: Int, errorBody: String?): Pair<String, Int?> {
    val parsed = errorBody?.let {
      runCatching { NyraClientProvider.errorAdapter.fromJson(it) }.getOrNull()
    }
    val msg = parsed?.userMessage?.takeIf { it.isNotBlank() }
      ?: parsed?.error?.takeIf { it.isNotBlank() }
      ?: when (statusCode) {
        429 -> "NYRA needs a short rest after lots of learning today. Guided offline activities are ready!"
        in 500..599 -> "NYRA's helper brain is taking a moment. Using offline guided learning for now!"
        else -> "Using offline guided learning right now."
      }
    return msg to parsed?.retryAfterSeconds
  }

  suspend fun checkHealthJson(): String = withContext(Dispatchers.IO) {
    try {
      val response = apiService.getHealth()
      val body = response.body()
      if (response.isSuccessful && body != null && body.isHealthy) {
        JSONObject()
          .put("ok", true)
          .put("status", body.status ?: "ok")
          .put("company", body.company ?: "NEXORALABS")
          .put("model", body.model ?: "")
          .put("message", "NYRA Online")
          .toString()
      } else {
        JSONObject()
          .put("ok", false)
          .put("status", "offline")
          .put("message", "Offline Guided Mode")
          .toString()
      }
    } catch (_: Exception) {
      JSONObject()
        .put("ok", false)
        .put("status", "offline")
        .put("message", "Offline Guided Mode")
        .toString()
    }
  }

  suspend fun fetchQuotaJson(studentIdInput: String): String = withContext(Dispatchers.IO) {
    val student = ensureActiveStudent(studentIdInput)
    try {
      val response = apiService.getQuota(clientIdFor(student.id))
      if (response.isSuccessful && response.body() != null) {
        val body = response.body()!!
        val entity = NyraQuotaCacheEntity(
          studentId = student.id,
          userUsedToday = body.userUsedToday,
          userDailyLimit = body.userDailyLimit,
          userRemainingToday = body.userRemainingToday,
          cooldownActive = body.cooldownActive,
          message = body.message?.ifBlank { null } ?: "NYRA is ready!",
          updatedAtEpochMs = System.currentTimeMillis(),
        )
        dao.upsertQuotaCache(entity)
        return@withContext JSONObject()
          .put("ok", true)
          .put("quota", quotaEntityToJson(entity))
          .toString()
      }

      val (msg, _) = parseErrorInfo(response.code(), response.errorBody()?.string())
      val cached = dao.getQuotaCache(student.id)
      val updated = (cached ?: NyraQuotaCacheEntity(
        studentId = student.id,
        userUsedToday = 0,
        userDailyLimit = 25,
        userRemainingToday = if (response.code() == 429) 0 else 25,
        cooldownActive = response.code() == 429,
        message = msg,
        updatedAtEpochMs = System.currentTimeMillis(),
      )).copy(
        cooldownActive = response.code() == 429 || (cached?.cooldownActive ?: false),
        message = msg,
        updatedAtEpochMs = System.currentTimeMillis(),
      )
      dao.upsertQuotaCache(updated)
      JSONObject()
        .put("ok", false)
        .put("quota", quotaEntityToJson(updated))
        .put("notice", msg)
        .toString()
    } catch (_: Exception) {
      val cached = dao.getQuotaCache(student.id)
      JSONObject()
        .put("ok", false)
        .put("quota", quotaEntityToJson(cached))
        .put("notice", "Showing saved daily turns from device.")
        .toString()
    }
  }

  private suspend fun refreshQuotaSilently(studentId: String): JSONObject {
    val raw = fetchQuotaJson(studentId)
    return runCatching { JSONObject(raw).optJSONObject("quota") }.getOrNull()
      ?: quotaEntityToJson(dao.getQuotaCache(studentId))
  }

  suspend fun getStudentSnapshotJson(studentIdInput: String?): String = withContext(Dispatchers.IO) {
    val active = ensureActiveStudent(studentIdInput)
    val allStudents = dao.getAllStudents()
    val history = dao.getTestResultsForStudent(active.id)
    val levels = dao.getLevelsForStudent(active.id)
    val tests = dao.getTestsForStudent(active.id)
    val chats = dao.getChatMessagesForStudent(active.id)
    val quota = dao.getQuotaCache(active.id)

    val studentsArr = JSONArray()
    for (s in allStudents) {
      studentsArr.put(
        JSONObject()
          .put("id", s.id)
          .put("name", s.name)
          .put("avatarEmoji", s.avatarEmoji)
          .put("classAge", s.classAge)
          .put("className", getClassName(s.classAge)),
      )
    }

    val historyArr = JSONArray()
    for (h in history) {
      historyArr.put(
        JSONObject()
          .put("id", h.id)
          .put("studentId", h.studentId)
          .put("age", h.classAge)
          .put("className", h.className)
          .put("mode", h.mode)
          .put("subject", h.subject)
          .put("topic", h.topic)
          .put("score", h.score)
          .put("wrong", h.wrongCount)
          .put("date", h.dateLabel)
          .put("timestamp", h.timestampEpochMs),
      )
    }

    val levelsArr = JSONArray()
    for (lvl in levels) {
      val parsed = runCatching { JSONObject(lvl.levelJson) }.getOrNull()
      if (parsed != null) {
        parsed.put("completed", lvl.completed)
        levelsArr.put(parsed)
      }
    }

    val testsArr = JSONArray()
    for (t in tests) {
      val parsed = runCatching { JSONObject(t.testJson) }.getOrNull()
      if (parsed != null) {
        if (t.completedScore != null) parsed.put("completedScore", t.completedScore)
        testsArr.put(parsed)
      }
    }

    val chatArr = JSONArray()
    for (m in chats) {
      chatArr.put(
        JSONObject()
          .put("id", m.id)
          .put("role", m.role)
          .put("content", m.content)
          .put("source", m.source)
          .put("timestamp", m.timestampEpochMs),
      )
    }

    JSONObject()
      .put("ok", true)
      .put(
        "activeStudent",
        JSONObject()
          .put("id", active.id)
          .put("name", active.name)
          .put("avatarEmoji", active.avatarEmoji)
          .put("classAge", active.classAge)
          .put("className", getClassName(active.classAge)),
      )
      .put("students", studentsArr)
      .put("history", historyArr)
      .put("levels", levelsArr)
      .put("tests", testsArr)
      .put("chatMessages", chatArr)
      .put("weakTopics", computeWeakTopics(history))
      .put("performanceDecline", computePerformanceDecline(history))
      .put("quota", quotaEntityToJson(quota))
      .toString()
  }

  suspend fun switchOrCreateStudentJson(payloadJson: String): String = withContext(Dispatchers.IO) {
    val req = runCatching { JSONObject(payloadJson) }.getOrNull() ?: JSONObject()
    val action = req.optString("action", "switch").trim()
    val requestedId = req.optString("studentId", "").trim()

    if (action == "create") {
      val name = req.optString("name", "").trim().ifBlank { "Explorer" }.take(24)
      val avatar = req.optString("avatarEmoji", "🦊").trim().ifBlank { "🦊" }
      val classAge = req.optInt("classAge", 3).coerceIn(3, 10)
      val newId = "student-${System.currentTimeMillis()}"
      dao.upsertStudent(
        StudentProfileEntity(
          id = newId,
          name = name,
          avatarEmoji = avatar,
          classAge = classAge,
          createdAtEpochMs = System.currentTimeMillis(),
        ),
      )
      return@withContext getStudentSnapshotJson(newId)
    }

    if (action == "updateAge") {
      val classAge = req.optInt("classAge", 3).coerceIn(3, 10)
      val active = ensureActiveStudent(requestedId, classAge)
      return@withContext getStudentSnapshotJson(active.id)
    }

    val active = ensureActiveStudent(requestedId)
    getStudentSnapshotJson(active.id)
  }

  suspend fun recordTestResultJson(payloadJson: String): String = withContext(Dispatchers.IO) {
    val req = runCatching { JSONObject(payloadJson) }.getOrNull() ?: JSONObject()
    val student = ensureActiveStudent(req.optString("studentId"), req.optInt("classAge", -1).takeIf { it in 3..10 })
    val classAge = req.optInt("classAge", student.classAge).coerceIn(3, 10)
    val mode = req.optString("mode", "tests").ifBlank { "tests" }
    val (defaultSubject, defaultTopic) = resolveSubjectAndTopic(mode)
    val subject = req.optString("subject", defaultSubject).ifBlank { defaultSubject }
    val topic = req.optString("topic", defaultTopic).ifBlank { defaultTopic }
    val score = req.optInt("score", 0).coerceIn(0, 100)
    val wrongCount = req.optInt("wrongCount", 0).coerceAtLeast(0)
    val wrongTopics = req.optJSONArray("wrongTopics") ?: JSONArray()
    val nyraTestId = req.optString("nyraTestId", "").trim()

    dao.insertTestResult(
      TestResultEntity(
        id = "res-${System.currentTimeMillis()}-${(100..999).random()}",
        studentId = student.id,
        classAge = classAge,
        className = getClassName(classAge),
        mode = mode,
        subject = subject,
        topic = topic,
        score = score,
        wrongCount = wrongCount,
        wrongTopicsJson = wrongTopics.toString(),
        timestampEpochMs = System.currentTimeMillis(),
        dateLabel = nowLabel(),
      ),
    )

    if (nyraTestId.isNotBlank()) {
      dao.markTestCompleted(student.id, nyraTestId, score)
    }

    val updatedSnapshot = JSONObject(getStudentSnapshotJson(student.id))
    updatedSnapshot.put("saved", true)
    updatedSnapshot.toString()
  }

  suspend fun markLevelCompletedJson(payloadJson: String): String = withContext(Dispatchers.IO) {
    val req = runCatching { JSONObject(payloadJson) }.getOrNull() ?: JSONObject()
    val student = ensureActiveStudent(req.optString("studentId"))
    val levelId = req.optString("levelId", "").trim()
    if (levelId.isNotBlank()) {
      dao.markLevelCompleted(student.id, levelId)
    }
    getStudentSnapshotJson(student.id)
  }

  suspend fun sendChatJson(payloadJson: String): String = withContext(Dispatchers.IO) {
    val req = runCatching { JSONObject(payloadJson) }.getOrNull() ?: JSONObject()
    val student = ensureActiveStudent(req.optString("studentId"))
    val userMessage = req.optString("message", "").trim()
    if (userMessage.isBlank()) {
      return@withContext JSONObject()
        .put("ok", false)
        .put("notice", "Ask NYRA a friendly question to begin!")
        .toString()
    }

    val subject = req.optString("subject", "Math").ifBlank { "Math" }
    val languageMode = req.optString("languageMode", "bilingual").ifBlank { "bilingual" }
    val className = getClassName(student.classAge)
    val history = dao.getTestResultsForStudent(student.id)
    val weakTopics = computeWeakTopics(history)
    val weakTopicNames = (0 until weakTopics.length())
      .mapNotNull { weakTopics.optJSONObject(it)?.optString("topic") }
      .filter { it.isNotBlank() }

    val now = System.currentTimeMillis()
    dao.insertChatMessage(
      NyraChatMessageEntity(
        id = "chat-u-$now",
        studentId = student.id,
        role = "user",
        content = userMessage,
        source = "user",
        timestampEpochMs = now,
      ),
    )

    val priorTurns = dao.getChatMessagesForStudent(student.id)
      .takeLast(6)
      .map { NyraChatMessageDto(role = if (it.role == "assistant") "assistant" else "user", content = it.content) }

    val weakSummary = if (weakTopicNames.isNotEmpty()) weakTopicNames.joinToString(", ") else "none yet"
    val recentSummary = history.take(3).joinToString(", ") { "${it.topic}:${it.score}%" }.ifBlank { "new learner" }

    val systemPrompt = buildString {
      append("You are NYRA, the warm, patient personal learning companion inside NEXORALABS Fun & Learn. ")
      append("The student is ${student.name} in $className (age group ~${student.classAge}). ")
      append("Focus subject: $subject. Language preference: $languageMode (simple English and gentle Hindi when helpful). ")
      append("Recent test history: $recentSummary. Areas needing extra care: $weakSummary. ")
      append("Rules: Use simple, encouraging, child-friendly explanations with 1 easy example and a tiny confidence-boosting question at the end. ")
      append("Keep responses concise (under 110 words), never mention technical details.")
    }

    val messages = listOf(NyraChatMessageDto("system", systemPrompt)) + priorTurns

    try {
      val response = apiService.chat(
        clientId = clientIdFor(student.id),
        request = NyraChatRequest(
          messages = messages,
          classLevel = className,
          subject = subject,
          languageMode = languageMode,
          stream = false,
        ),
      )

      if (response.isSuccessful) {
        val rawBody = response.body()?.string().orEmpty()
        val reply = NyraJsonParsers.extractChatReplyText(rawBody)
        if (reply.isNotBlank()) {
          dao.insertChatMessage(
            NyraChatMessageEntity(
              id = "chat-a-${System.currentTimeMillis()}",
              studentId = student.id,
              role = "assistant",
              content = reply,
              source = "backend",
              timestampEpochMs = System.currentTimeMillis(),
            ),
          )
          dao.trimOldChatMessages(student.id, 24)
          val quotaJson = refreshQuotaSilently(student.id)
          return@withContext JSONObject()
            .put("ok", true)
            .put("reply", reply)
            .put("source", "backend")
            .put("quota", quotaJson)
            .toString()
        }
      }

      val (notice, _) = parseErrorInfo(response.code(), response.errorBody()?.string())
      val fallback = buildOfflineChatReply(student, className, subject, userMessage, weakTopicNames)
      dao.insertChatMessage(
        NyraChatMessageEntity(
          id = "chat-a-${System.currentTimeMillis()}",
          studentId = student.id,
          role = "assistant",
          content = fallback,
          source = "offline",
          timestampEpochMs = System.currentTimeMillis(),
        ),
      )
      dao.trimOldChatMessages(student.id, 24)
      val quotaJson = refreshQuotaSilently(student.id)
      JSONObject()
        .put("ok", false)
        .put("offlineFallback", true)
        .put("reply", fallback)
        .put("notice", notice)
        .put("source", "offline")
        .put("quota", quotaJson)
        .toString()
    } catch (e: Exception) {
      val notice = when (e) {
        is SocketTimeoutException -> "NYRA took a bit too long to respond. Showing a guided offline tip!"
        is IOException -> "No internet right now — NYRA is helping in Offline Guided Mode!"
        else -> "NYRA switched to Offline Guided Mode for you!"
      }
      val fallback = buildOfflineChatReply(student, className, subject, userMessage, weakTopicNames)
      dao.insertChatMessage(
        NyraChatMessageEntity(
          id = "chat-a-${System.currentTimeMillis()}",
          studentId = student.id,
          role = "assistant",
          content = fallback,
          source = "offline",
          timestampEpochMs = System.currentTimeMillis(),
        ),
      )
      dao.trimOldChatMessages(student.id, 24)
      JSONObject()
        .put("ok", false)
        .put("offlineFallback", true)
        .put("reply", fallback)
        .put("notice", notice)
        .put("source", "offline")
        .put("quota", quotaEntityToJson(dao.getQuotaCache(student.id)))
        .toString()
    }
  }

  suspend fun generateAdaptiveLevelJson(payloadJson: String): String = withContext(Dispatchers.IO) {
    val req = runCatching { JSONObject(payloadJson) }.getOrNull() ?: JSONObject()
    val student = ensureActiveStudent(req.optString("studentId"))
    val classAge = req.optInt("classAge", student.classAge).coerceIn(3, 10)
    val className = getClassName(classAge)
    val history = dao.getTestResultsForStudent(student.id)
    val weakTopics = computeWeakTopics(history)
    val defaultWeak = weakTopics.optJSONObject(0)?.optString("topic").orEmpty()

    val subject = req.optString("subject", "Math").ifBlank { "Math" }
    val topic = req.optString("topic", defaultWeak.ifBlank { "Counting & Patterns" }).ifBlank { "Counting & Patterns" }
    val difficulty = req.optString("difficulty", inferDifficulty(history)).ifBlank { "gentle" }
    val languageMode = req.optString("languageMode", "bilingual").ifBlank { "bilingual" }

    val prompt = buildString {
      append("Create an adaptive child-friendly learning level for NEXORALABS Fun & Learn. ")
      append("Student: ${student.name}, Class: $className, Subject: $subject, Topic: $topic, Difficulty: $difficulty, Language: $languageMode. ")
      append("Return ONLY a valid JSON object (no markdown) with exact keys: ")
      append("title, topic, learningObjective, simpleExplanation, ")
      append("activities (array of 2 objects with title, instruction, example), ")
      append("practiceQuestions (array of 2 objects with prompt, options (array of 3 exact strings), correctAnswer (exact string from options), hint), ")
      append("completionCriteria.")
    }

    try {
      val response = apiService.generate(
        clientId = clientIdFor(student.id),
        request = NyraGenerateRequest(
          prompt = prompt,
          classLevel = className,
          subject = subject,
          languageMode = languageMode,
        ),
      )

      if (response.isSuccessful) {
        val rawBody = response.body()?.string().orEmpty()
        val replyText = NyraJsonParsers.extractChatReplyText(rawBody).ifBlank { rawBody }
        val jsonObj = NyraJsonParsers.extractJsonObject(replyText)
        val normalized = jsonObj?.let {
          NyraJsonParsers.normalizeGeneratedLevel(
            rawObj = it,
            studentId = student.id,
            classAge = classAge,
            className = className,
            subject = subject,
            fallbackTopic = topic,
            difficulty = difficulty,
          )
        }
        if (normalized != null) {
          saveLevelEntity(student.id, classAge, subject, topic, difficulty, normalized)
          val quotaJson = refreshQuotaSilently(student.id)
          return@withContext JSONObject()
            .put("ok", true)
            .put("source", "backend")
            .put("level", normalized)
            .put("quota", quotaJson)
            .toString()
        }
      }

      val (notice, _) = parseErrorInfo(response.code(), response.errorBody()?.string())
      val fallback = buildOfflineLevel(student.id, classAge, className, subject, topic, difficulty)
      saveLevelEntity(student.id, classAge, subject, topic, difficulty, fallback)
      val quotaJson = refreshQuotaSilently(student.id)
      JSONObject()
        .put("ok", false)
        .put("offlineFallback", true)
        .put("notice", notice)
        .put("source", "offline")
        .put("level", fallback)
        .put("quota", quotaJson)
        .toString()
    } catch (_: Exception) {
      val fallback = buildOfflineLevel(student.id, classAge, className, subject, topic, difficulty)
      saveLevelEntity(student.id, classAge, subject, topic, difficulty, fallback)
      JSONObject()
        .put("ok", false)
        .put("offlineFallback", true)
        .put("notice", "Using NYRA Offline Guided Level while connection is away.")
        .put("source", "offline")
        .put("level", fallback)
        .put("quota", quotaEntityToJson(dao.getQuotaCache(student.id)))
        .toString()
    }
  }

  suspend fun generateAdaptiveTestJson(payloadJson: String): String = withContext(Dispatchers.IO) {
    val req = runCatching { JSONObject(payloadJson) }.getOrNull() ?: JSONObject()
    val student = ensureActiveStudent(req.optString("studentId"))
    val classAge = req.optInt("classAge", student.classAge).coerceIn(3, 10)
    val className = getClassName(classAge)
    val history = dao.getTestResultsForStudent(student.id)
    val weakTopics = computeWeakTopics(history)
    val defaultWeak = weakTopics.optJSONObject(0)?.optString("topic").orEmpty()

    val subject = req.optString("subject", "Math").ifBlank { "Math" }
    val topic = req.optString("topic", defaultWeak.ifBlank { "Quick Skill Check" }).ifBlank { "Quick Skill Check" }
    val difficulty = req.optString("difficulty", inferDifficulty(history)).ifBlank { "gentle" }
    val languageMode = req.optString("languageMode", "bilingual").ifBlank { "bilingual" }
    val linkedLevelId = req.optString("linkedLevelId", "").trim().ifBlank { null }

    val prompt = buildString {
      append("Create a child-friendly 4-question educational quiz for NEXORALABS Fun & Learn. ")
      append("Student: ${student.name}, Class: $className, Subject: $subject, Topic: $topic, Difficulty: $difficulty, Language: $languageMode. ")
      append("Return ONLY a valid JSON object (no markdown) with exact keys: ")
      append("title, questions (array of 4 objects). ")
      append("Include mixed types: one 'mcq' (with options array of 3 exact strings), one 'true_false' (options ['True','False']), one 'fill_blank', and one 'short_answer'. ")
      append("Every question object MUST have: id, type, topic, prompt, options (for mcq and true_false), correctAnswer (exact matching answer text, never just 'a' or 'b'), explanation.")
    }

    try {
      val response = apiService.generate(
        clientId = clientIdFor(student.id),
        request = NyraGenerateRequest(
          prompt = prompt,
          classLevel = className,
          subject = subject,
          languageMode = languageMode,
        ),
      )

      if (response.isSuccessful) {
        val rawBody = response.body()?.string().orEmpty()
        val replyText = NyraJsonParsers.extractChatReplyText(rawBody).ifBlank { rawBody }
        val jsonObj = NyraJsonParsers.extractJsonObject(replyText)
        val normalized = jsonObj?.let {
          NyraJsonParsers.normalizeGeneratedTest(
            rawObj = it,
            studentId = student.id,
            classAge = classAge,
            className = className,
            subject = subject,
            topic = topic,
            difficulty = difficulty,
            linkedLevelId = linkedLevelId,
          )
        }
        if (normalized != null) {
          saveTestEntity(student.id, classAge, subject, topic, linkedLevelId, normalized)
          val quotaJson = refreshQuotaSilently(student.id)
          return@withContext JSONObject()
            .put("ok", true)
            .put("source", "backend")
            .put("test", normalized)
            .put("quota", quotaJson)
            .toString()
        }
      }

      val (notice, _) = parseErrorInfo(response.code(), response.errorBody()?.string())
      val fallback = buildOfflineTest(student.id, classAge, className, subject, topic, difficulty, linkedLevelId)
      saveTestEntity(student.id, classAge, subject, topic, linkedLevelId, fallback)
      val quotaJson = refreshQuotaSilently(student.id)
      JSONObject()
        .put("ok", false)
        .put("offlineFallback", true)
        .put("notice", notice)
        .put("source", "offline")
        .put("test", fallback)
        .put("quota", quotaJson)
        .toString()
    } catch (_: Exception) {
      val fallback = buildOfflineTest(student.id, classAge, className, subject, topic, difficulty, linkedLevelId)
      saveTestEntity(student.id, classAge, subject, topic, linkedLevelId, fallback)
      JSONObject()
        .put("ok", false)
        .put("offlineFallback", true)
        .put("notice", "Using NYRA Offline Guided Quiz while connection is away.")
        .put("source", "offline")
        .put("test", fallback)
        .put("quota", quotaEntityToJson(dao.getQuotaCache(student.id)))
        .toString()
    }
  }

  private suspend fun saveLevelEntity(
    studentId: String,
    classAge: Int,
    subject: String,
    topic: String,
    difficulty: String,
    levelJson: JSONObject,
  ) {
    dao.upsertLevel(
      NyraLevelEntity(
        id = levelJson.optString("id"),
        studentId = studentId,
        classAge = classAge,
        subject = subject,
        topic = topic,
        difficulty = difficulty,
        completed = false,
        levelJson = levelJson.toString(),
        createdAtEpochMs = System.currentTimeMillis(),
      ),
    )
  }

  private suspend fun saveTestEntity(
    studentId: String,
    classAge: Int,
    subject: String,
    topic: String,
    linkedLevelId: String?,
    testJson: JSONObject,
  ) {
    dao.upsertTest(
      NyraTestEntity(
        id = testJson.optString("id"),
        studentId = studentId,
        classAge = classAge,
        subject = subject,
        topic = topic,
        linkedLevelId = linkedLevelId,
        completedScore = null,
        testJson = testJson.toString(),
        createdAtEpochMs = System.currentTimeMillis(),
      ),
    )
  }

  private fun inferDifficulty(history: List<TestResultEntity>): String {
    if (history.isEmpty()) return "gentle"
    val avg = history.take(5).map { it.score }.average()
    return when {
      avg >= 85.0 -> "challenge"
      avg >= 65.0 -> "standard"
      else -> "gentle"
    }
  }

  private fun buildOfflineChatReply(
    student: StudentProfileEntity,
    className: String,
    subject: String,
    userMessage: String,
    weakTopics: List<String>,
  ): String {
    val weakHint = if (weakTopics.isNotEmpty()) {
      " We can also practice ${weakTopics.first()} together with tiny fun steps."
    } else {
      ""
    }
    return when (subject) {
      "Hindi" ->
        "Hi ${student.name}! ($className) बहुत अच्छा सवाल है! हिंदी में शब्दों को धीरे-धीरे बोलकर और मात्राओं को जोड़कर पढ़ना बहुत आसान होता है — जैसे क + म + ल = कमल।$weakHint क्या आप एक छोटा शब्द बोलकर कोशिश करेंगे?"
      "English" ->
        "Great curiosity, ${student.name}! In $className English, sound out each letter slowly (like C-A-T = Cat) and picture it in your mind.$weakHint Can you tell me a word that starts with A or B?"
      else ->
        "Yay ${student.name}! For $className Math, try counting with apples or fingers one step at a time — for example, 3 apples + 2 apples = 5 apples!$weakHint Ready to try 4 + 2 together?"
    }
  }

  private fun buildOfflineLevel(
    studentId: String,
    classAge: Int,
    className: String,
    subject: String,
    topic: String,
    difficulty: String,
  ): JSONObject {
    var title = ""
    var explanation = ""
    val activities = JSONArray()
    val practiceQuestions = JSONArray()

    when (subject) {
      "Hindi" -> {
        title = "NYRA Hindi Path: $topic"
        explanation = "हर अक्षर और मात्रा को धीरे-धीरे साफ आवाज़ में पढ़ें। तस्वीर के साथ शब्द जोड़ने से सीखना मज़ेदार हो जाता है!"
        activities.put(JSONObject().put("title", "अक्षर पहचान (Letter Spot)").put("instruction", "क, ख, ग, म, ल जैसे 3 अक्षर जोर से बोलें।").put("example", "🍎 क से कमल, म से मछली"))
        activities.put(JSONObject().put("title", "शब्द जोड़ो (Word Builder)").put("instruction", "दो सरल अक्षरों को मिलाकर एक शब्द बनाएं।").put("example", "घ + र = घर"))
        practiceQuestions.put(JSONObject().put("prompt", "‘क’ और ‘म’ और ‘ल’ मिलाकर कौन सा शब्द बनेगा?").put("options", JSONArray(listOf("कमल", "घर", "फल"))).put("correctAnswer", "कमल").put("hint", "तीनों अक्षरों को क्रम से जोड़ें!"))
        practiceQuestions.put(JSONObject().put("prompt", "‘फ’ और ‘ल’ से क्या शब्द बनता है?").put("options", JSONArray(listOf("फल", "जल", "नल"))).put("correctAnswer", "फल").put("hint", "पहला अक्षर फ है!"))
      }
      "English" -> {
        title = "NYRA Word Explorer: $topic"
        explanation = "Every big English word is built from cheerful little letter sounds. Blend each sound slowly and smile as you read!"
        activities.put(JSONObject().put("title", "Sound Check").put("instruction", "Say each letter sound slowly before blending them together.").put("example", "S - U - N -> SUN ☀️"))
        activities.put(JSONObject().put("title", "Picture Sentence").put("instruction", "Say one short sentence using your favorite word.").put("example", "The red apple is sweet. 🍎"))
        practiceQuestions.put(JSONObject().put("prompt", "Which letter completes C _ T for 🐱?").put("options", JSONArray(listOf("A", "O", "U"))).put("correctAnswer", "A").put("hint", "Think of the short 'a' sound in Cat!"))
        practiceQuestions.put(JSONObject().put("prompt", "Which word rhymes with SUN?").put("options", JSONArray(listOf("FUN", "DOG", "HAT"))).put("correctAnswer", "FUN").put("hint", "Listen for the '-un' ending!"))
      }
      else -> {
        val n1 = if (classAge <= 5) 2 else 6
        val n2 = if (classAge <= 5) 3 else 4
        val sum = n1 + n2
        title = "NYRA Number Buddy: $topic"
        explanation = "Group objects in small bunches and count carefully from left to right. Taking one calm step at a time makes numbers easy!"
        activities.put(JSONObject().put("title", "Visual Counting").put("instruction", "Count the first group, then keep counting up for the second group.").put("example", "$n1 apples + $n2 apples = $sum apples 🍎"))
        activities.put(JSONObject().put("title", "Step Check").put("instruction", "Say the bigger number first and count up on your fingers.").put("example", "Start at $n1, count $n2 more -> $sum"))
        practiceQuestions.put(JSONObject().put("prompt", "What is $n1 + $n2?").put("options", JSONArray(listOf("$sum", "${sum + 1}", "${sum - 1}"))).put("correctAnswer", "$sum").put("hint", "Start from $n1 and count $n2 steps forward!"))
        practiceQuestions.put(JSONObject().put("prompt", "Which number is greater: ${n1 + 3} or $n1?").put("options", JSONArray(listOf("${n1 + 3}", "$n1", "Both same"))).put("correctAnswer", "${n1 + 3}").put("hint", "The number you reach later while counting is larger!"))
      }
    }

    return JSONObject()
      .put("id", "nyra-lvl-${System.currentTimeMillis()}")
      .put("studentId", studentId)
      .put("classAge", classAge)
      .put("className", className)
      .put("difficulty", difficulty)
      .put("title", title)
      .put("subject", subject)
      .put("topic", topic)
      .put("learningObjective", "Build steady confidence in $topic for $className.")
      .put("simpleExplanation", explanation)
      .put("activities", activities)
      .put("practiceQuestions", practiceQuestions)
      .put("completionCriteria", "Try both activities and answer the 2 practice questions.")
      .put("completed", false)
      .put("source", "offline")
  }

  private fun buildOfflineTest(
    studentId: String,
    classAge: Int,
    className: String,
    subject: String,
    topic: String,
    difficulty: String,
    linkedLevelId: String?,
  ): JSONObject {
    val questions = JSONArray()
    when (subject) {
      "Hindi" -> {
        questions.put(
          JSONObject()
            .put("id", "q1").put("type", "mcq").put("topic", topic)
            .put("prompt", "🍎 'सेब' का पहला अक्षर क्या है?")
            .put("options", JSONArray(listOf("स", "क", "म")))
            .put("correctAnswer", "स")
            .put("explanation", "'सेब' शब्द 'स' अक्षर से शुरू होता है।"),
        )
        questions.put(
          JSONObject()
            .put("id", "q2").put("type", "true_false").put("topic", topic)
            .put("prompt", "'क + म + ल' से 'कमल' शब्द बनता है।")
            .put("options", JSONArray(listOf("True", "False")))
            .put("correctAnswer", "True")
            .put("explanation", "हाँ! क, म और ल को जोड़ने पर कमल बनता है।"),
        )
        questions.put(
          JSONObject()
            .put("id", "q3").put("type", "fill_blank").put("topic", topic)
            .put("prompt", "रिक्त स्थान भरें: अ से ____ (अनार / फल)")
            .put("correctAnswer", "अनार")
            .put("explanation", "अ से अनार होता है।"),
        )
        questions.put(
          JSONObject()
            .put("id", "q4").put("type", "short_answer").put("topic", topic)
            .put("prompt", "‘फ’ और ‘ल’ मिलाकर कौन सा शब्द बनता है?")
            .put("correctAnswer", "फल")
            .put("explanation", "फ + ल = फल!"),
        )
      }
      "English" -> {
        questions.put(
          JSONObject()
            .put("id", "q1").put("type", "mcq").put("topic", topic)
            .put("prompt", "Which word starts with the letter B?")
            .put("options", JSONArray(listOf("Ball", "Apple", "Cat")))
            .put("correctAnswer", "Ball")
            .put("explanation", "Ball starts with B!"),
        )
        questions.put(
          JSONObject()
            .put("id", "q2").put("type", "true_false").put("topic", topic)
            .put("prompt", "'Sun' and 'Fun' rhyme together.")
            .put("options", JSONArray(listOf("True", "False")))
            .put("correctAnswer", "True")
            .put("explanation", "Yes! Both end with the '-un' sound."),
        )
        questions.put(
          JSONObject()
            .put("id", "q3").put("type", "fill_blank").put("topic", topic)
            .put("prompt", "Fill the missing word: The sky is ____. (blue / shoe)")
            .put("correctAnswer", "blue")
            .put("explanation", "The sky is blue."),
        )
        questions.put(
          JSONObject()
            .put("id", "q4").put("type", "short_answer").put("topic", topic)
            .put("prompt", "Type the opposite of 'BIG' in one word:")
            .put("correctAnswer", "small")
            .put("explanation", "The opposite of big is small."),
        )
      }
      else -> {
        val a = if (classAge <= 5) 3 else 7
        val b = if (classAge <= 5) 2 else 5
        val ans = a + b
        questions.put(
          JSONObject()
            .put("id", "q1").put("type", "mcq").put("topic", topic)
            .put("prompt", "What is $a + $b?")
            .put("options", JSONArray(listOf("$ans", "${ans + 1}", "${ans - 1}")))
            .put("correctAnswer", "$ans")
            .put("explanation", "$a + $b equals $ans."),
        )
        questions.put(
          JSONObject()
            .put("id", "q2").put("type", "true_false").put("topic", topic)
            .put("prompt", "${a + 2} is greater than $a.")
            .put("options", JSONArray(listOf("True", "False")))
            .put("correctAnswer", "True")
            .put("explanation", "Yes, ${a + 2} is 2 more than $a."),
        )
        questions.put(
          JSONObject()
            .put("id", "q3").put("type", "fill_blank").put("topic", topic)
            .put("prompt", "Complete the pattern: 2, 4, 6, ____")
            .put("correctAnswer", "8")
            .put("explanation", "Counting by 2s gives 8 after 6."),
        )
        questions.put(
          JSONObject()
            .put("id", "q4").put("type", "short_answer").put("topic", topic)
            .put("prompt", "If you have $ans apples and eat 1, how many are left?")
            .put("correctAnswer", "${ans - 1}")
            .put("explanation", "$ans - 1 = ${ans - 1} apples left!"),
        )
      }
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
      .put("title", "NYRA $subject Guided Practice ($className)")
      .put("questions", questions)
      .put("source", "offline")
  }
}
