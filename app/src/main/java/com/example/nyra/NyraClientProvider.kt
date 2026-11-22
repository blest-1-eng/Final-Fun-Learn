package com.example.nyra

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

object NyraClientProvider {
  val moshi: Moshi by lazy {
    Moshi.Builder()
      .addLast(KotlinJsonAdapterFactory())
      .build()
  }

  val errorAdapter by lazy {
    moshi.adapter(NyraErrorResponse::class.java)
  }

  fun createService(baseUrl: String = NyraBackendConfig.retrofitBaseUrl): NyraApiService {
    val normalizedBaseUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
    val okHttpClient = OkHttpClient.Builder()
      .connectTimeout(NyraBackendConfig.TimeoutsSeconds.CONNECT, TimeUnit.SECONDS)
      .readTimeout(NyraBackendConfig.TimeoutsSeconds.READ, TimeUnit.SECONDS)
      .writeTimeout(NyraBackendConfig.TimeoutsSeconds.WRITE, TimeUnit.SECONDS)
      .retryOnConnectionFailure(true)
      .build()

    return Retrofit.Builder()
      .baseUrl(normalizedBaseUrl)
      .client(okHttpClient)
      .addConverterFactory(MoshiConverterFactory.create(moshi))
      .build()
      .create(NyraApiService::class.java)
  }
}
