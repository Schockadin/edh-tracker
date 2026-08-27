package com.edhtracker.data.remote

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

interface EdhApi {
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @GET("api/sync/pull")
    suspend fun pull(
        @Header("Authorization") authorization: String,
        @Query("since") since: String?,
    ): PullResponse

    @POST("api/sync/push")
    suspend fun push(
        @Header("Authorization") authorization: String,
        @Body body: PushRequest,
    ): PushResponse

    @POST("api/cards/import")
    suspend fun importCards(
        @Header("Authorization") authorization: String,
        @Body body: CardImportRequest,
    ): CardImportResponse
}

/** Builds a Retrofit [EdhApi] bound to a user-supplied base URL. */
object ApiFactory {
    private val moshi: Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    fun create(baseUrl: String): EdhApi {
        var url = baseUrl.trim()
        // Be forgiving: default to https when the user omits the scheme.
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://$url"
        }
        if (!url.endsWith("/")) url = "$url/"
        return Retrofit.Builder()
            .baseUrl(url)
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(EdhApi::class.java)
    }
}
