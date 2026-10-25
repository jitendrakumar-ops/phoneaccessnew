package com.SmsSender.callsync.net

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface CallSyncApi {

    @POST("api/v1/call-logs/sync")
    suspend fun syncCallLogs(@Body body: SyncCallLogsRequest): Response<SyncCallLogsResponse>
}
