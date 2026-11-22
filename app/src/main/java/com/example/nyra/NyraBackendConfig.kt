package com.example.nyra

import com.example.BuildConfig

object NyraBackendConfig {
  const val DEFAULT_BASE_URL: String = "https://backend-render-5u80.onrender.com"

  val baseUrl: String by lazy {
    val configured = runCatching { BuildConfig.NYRA_BACKEND_URL }
      .getOrNull()
      ?.trim()
      ?.trimEnd('/')
    if (!configured.isNullOrBlank()) configured else DEFAULT_BASE_URL
  }

  val retrofitBaseUrl: String
    get() = "$baseUrl/"

  object Endpoints {
    const val HEALTH = "health"
    const val QUOTA = "v1/nyra/quota"
    const val CHAT = "v1/nyra/chat"
    const val GENERATE = "v1/nyra/generate"
  }

  object TimeoutsSeconds {
    const val CONNECT = 10L
    const val READ = 24L
    const val WRITE = 24L
  }
}
