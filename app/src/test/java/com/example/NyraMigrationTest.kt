package com.example

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.local.FunLearnDatabase
import com.example.nyra.NyraBackendConfig
import com.example.nyra.NyraClientProvider
import com.example.nyra.NyraJsonParsers
import com.example.nyra.NyraRepository
import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress
import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class NyraMigrationTest {

  private lateinit var db: FunLearnDatabase
  private var server: HttpServer? = null

  @Before
  fun setUp() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    db = Room.inMemoryDatabaseBuilder(context, FunLearnDatabase::class.java)
      .allowMainThreadQueries()
      .build()
  }

  @After
  fun tearDown() {
    db.close()
    server?.stop(0)
    server = null
  }

  @Test
  fun centralizedBackendUrl_matchesNewRenderDeployment() {
    assertEquals("https://backend-render-5u80.onrender.com", NyraBackendConfig.baseUrl)
    assertEquals("health", NyraBackendConfig.Endpoints.HEALTH)
    assertEquals("v1/nyra/quota", NyraBackendConfig.Endpoints.QUOTA)
    assertEquals("v1/nyra/chat", NyraBackendConfig.Endpoints.CHAT)
    assertEquals("v1/nyra/generate", NyraBackendConfig.Endpoints.GENERATE)
  }

  @Test
  fun nyraJsonParsers_resolvesLetterIndexCorrectAnswerFromLiveSchema() {
    val raw = JSONObject(
      """
      {
        "title": "Math Practice",
        "questions": [
          {
            "id": "q1",
            "type": "mcq",
            "topic": "Addition",
            "prompt": "What is 5 + 3?",
            "options": ["6", "8", "10"],
            "correctAnswer": "b",
            "explanation": "5 + 3 = 8."
          }
        ]
      }
      """.trimIndent(),
    )

    val normalized = NyraJsonParsers.normalizeGeneratedTest(
      rawObj = raw,
      studentId = "s1",
      classAge = 7,
      className = "2nd Class",
      subject = "Math",
      topic = "Addition",
      difficulty = "gentle",
      linkedLevelId = null,
    )

    assertNotNull(normalized)
    val q0 = normalized!!.getJSONArray("questions").getJSONObject(0)
    assertEquals("8", q0.getString("correctAnswer"))
  }

  @Test
  fun repository_integratesAllFourBackendEndpointsViaRetrofitAndMoshi() = runTest {
    val localServer = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    localServer.createContext("/health") { exchange ->
      val body = """{"status":"ok","company":"NEXORALABS","service":"nyra-backend","model":"openai/gpt-oss-120b","groqConfigured":true}"""
      exchange.responseHeaders.add("Content-Type", "application/json")
      exchange.sendResponseHeaders(200, body.toByteArray().size.toLong())
      exchange.responseBody.use { it.write(body.toByteArray()) }
    }
    localServer.createContext("/v1/nyra/quota") { exchange ->
      val body = """{"day":"2026-01-01","userUsedToday":3,"userDailyLimit":25,"userRemainingToday":22,"cooldownActive":false,"message":"NYRA is ready!"}"""
      exchange.responseHeaders.add("Content-Type", "application/json")
      exchange.sendResponseHeaders(200, body.toByteArray().size.toLong())
      exchange.responseBody.use { it.write(body.toByteArray()) }
    }
    localServer.createContext("/v1/nyra/chat") { exchange ->
      val body = """{"reply":"2 + 3 equals 5 apples! Try 4 + 1 next!","model":"openai/gpt-oss-120b"}"""
      exchange.responseHeaders.add("Content-Type", "application/json")
      exchange.sendResponseHeaders(200, body.toByteArray().size.toLong())
      exchange.responseBody.use { it.write(body.toByteArray()) }
    }
    localServer.createContext("/v1/nyra/generate") { exchange ->
      val payload = """
        {
          "reply": "{\"title\":\"Counting Check\",\"questions\":[{\"id\":\"q1\",\"type\":\"mcq\",\"topic\":\"Counting\",\"prompt\":\"How many is 2 + 2?\",\"options\":[\"3\",\"4\",\"5\"],\"correctAnswer\":\"4\",\"explanation\":\"2 + 2 = 4.\"}]}"
        }
      """.trimIndent()
      exchange.responseHeaders.add("Content-Type", "application/json")
      exchange.sendResponseHeaders(200, payload.toByteArray().size.toLong())
      exchange.responseBody.use { it.write(payload.toByteArray()) }
    }
    localServer.start()
    server = localServer

    val baseUrl = "http://127.0.0.1:${localServer.address.port}/"
    val repo = NyraRepository(db.funLearnDao(), NyraClientProvider.createService(baseUrl))

    val health = JSONObject(repo.checkHealthJson())
    assertTrue(health.getBoolean("ok"))
    assertEquals("NEXORALABS", health.getString("company"))

    val quota = JSONObject(repo.fetchQuotaJson("student-default")).getJSONObject("quota")
    assertEquals(22, quota.getInt("userRemainingToday"))

    val chat = JSONObject(
      repo.sendChatJson("""{"studentId":"student-default","subject":"Math","message":"Help with 2 + 3"}"""),
    )
    assertTrue(chat.getBoolean("ok"))
    assertTrue(chat.getString("reply").contains("5 apples"))

    val testRes = JSONObject(
      repo.generateAdaptiveTestJson("""{"studentId":"student-default","classAge":5,"subject":"Math","topic":"Counting"}"""),
    )
    assertTrue(testRes.getBoolean("ok"))
    assertEquals("backend", testRes.getString("source"))
    assertEquals(1, testRes.getJSONObject("test").getJSONArray("questions").length())
  }

  @Test
  fun repository_handlesQuotaExhaustionAndMultiStudentIsolationOffline() = runTest {
    val localServer = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    localServer.createContext("/v1/nyra/chat") { exchange ->
      val body = """{"code":"USER_DAILY_LIMIT","userMessage":"NYRA needs a short rest until tomorrow!","retryAfterSeconds":60}"""
      exchange.responseHeaders.add("Content-Type", "application/json")
      exchange.sendResponseHeaders(429, body.toByteArray().size.toLong())
      exchange.responseBody.use { it.write(body.toByteArray()) }
    }
    localServer.createContext("/v1/nyra/quota") { exchange ->
      val body = """{"userUsedToday":25,"userDailyLimit":25,"userRemainingToday":0,"cooldownActive":true,"message":"Resting briefly"}"""
      exchange.responseHeaders.add("Content-Type", "application/json")
      exchange.sendResponseHeaders(200, body.toByteArray().size.toLong())
      exchange.responseBody.use { it.write(body.toByteArray()) }
    }
    localServer.start()
    server = localServer

    val repo = NyraRepository(
      db.funLearnDao(),
      NyraClientProvider.createService("http://127.0.0.1:${localServer.address.port}/"),
    )

    val aaravSnap = JSONObject(
      repo.switchOrCreateStudentJson("""{"action":"create","name":"Aarav","avatarEmoji":"🦊","classAge":7}"""),
    )
    val aaravId = aaravSnap.getJSONObject("activeStudent").getString("id")

    val diyaSnap = JSONObject(
      repo.switchOrCreateStudentJson("""{"action":"create","name":"Diya","avatarEmoji":"🐼","classAge":4}"""),
    )
    val diyaId = diyaSnap.getJSONObject("activeStudent").getString("id")

    repo.recordTestResultJson(
      """{"studentId":"$aaravId","classAge":7,"mode":"subtraction","topic":"Subtraction","score":45,"wrongCount":3}""",
    )

    val diyaCheck = JSONObject(repo.getStudentSnapshotJson(diyaId))
    assertEquals(0, diyaCheck.getJSONArray("history").length())

    val aaravCheck = JSONObject(repo.getStudentSnapshotJson(aaravId))
    assertEquals(1, aaravCheck.getJSONArray("history").length())
    assertTrue(aaravCheck.getJSONObject("performanceDecline").getBoolean("declining"))

    val chatFallback = JSONObject(
      repo.sendChatJson("""{"studentId":"$aaravId","subject":"Math","message":"Help me"}"""),
    )
    assertFalse(chatFallback.getBoolean("ok"))
    assertTrue(chatFallback.getBoolean("offlineFallback"))
    assertEquals("NYRA needs a short rest until tomorrow!", chatFallback.getString("notice"))
    assertTrue(chatFallback.getString("reply").contains("Aarav"))
  }
}
