package com.SmsSender.callsync.net

data class CallLogPayload(
    val callId: String,
    val phoneNumber: String,
    val name: String?,
    val durationSeconds: Long,
    val callType: Int,
    val callTimestamp: Long,
)

data class SyncCallLogsRequest(
    val deviceId: String,
    val callLogs: List<CallLogPayload>,
)

data class SyncCallLogsResponse(
    val status: String,
    val received: Int,
    val inserted: Int,
    val duplicates: Int,
)
