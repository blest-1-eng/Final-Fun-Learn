package com.example.nyra

import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface NyraApiService {
  @GET(NyraBackendConfig.Endpoints.HEALTH)
  suspend fun getHealth(): Response<NyraHealthResponse>

  @GET(NyraBackendConfig.Endpoints.QUOTA)
  suspend fun getQuota(
    @Header("X-FunLearn-Client-Id") clientId: String,
  ): Response<NyraQuotaResponse>

  @POST(NyraBackendConfig.Endpoints.CHAT)
  suspend fun chat(
    @Header("X-FunLearn-Client-Id") clientId: String,
    @Body request: NyraChatRequest,
  ): Response<ResponseBody>

  @POST(NyraBackendConfig.Endpoints.GENERATE)
  suspend fun generate(
    @Header("X-FunLearn-Client-Id") clientId: String,
    @Body request: NyraGenerateRequest,
  ): Response<ResponseBody>
}
