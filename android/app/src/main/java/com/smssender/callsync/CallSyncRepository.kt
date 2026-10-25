package com.SmsSender.callsync

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.CallLog
import android.util.Log
import androidx.core.content.ContextCompat
import com.SmsSender.callsync.db.CallSyncDatabase
import com.SmsSender.callsync.db.PendingCallLogEntity
import com.SmsSender.callsync.net.CallLogPayload
import com.SmsSender.callsync.net.RetrofitProvider
import com.SmsSender.callsync.net.SyncCallLogsRequest

class CallSyncRepository(private val context: Context) {

    private val prefs = CallSyncPreferences(context)
    private val dao = CallSyncDatabase.getInstance(context).pendingCallLogDao()

    suspend fun collectFromDevice(limit: Int = 200): Int {
        if (!hasReadCallLogPermission()) {
            Log.i(TAG, "READ_CALL_LOG permission missing, skip collection")
            return 0
        }

        val deviceId = prefs.getDeviceId()
        if (deviceId.isBlank()) {
            Log.w(TAG, "Device id missing, skip collection")
            return 0
        }

        val projection = arrayOf(
            CallLog.Calls._ID,
            CallLog.Calls.NUMBER,
            CallLog.Calls.CACHED_NAME,
            CallLog.Calls.DURATION,
            CallLog.Calls.TYPE,
            CallLog.Calls.DATE,
        )

        val since = prefs.getLastReadTimestamp()
        val selection = if (since > 0L) "${CallLog.Calls.DATE} > ?" else null
        val selectionArgs = if (since > 0L) arrayOf(since.toString()) else null

        val cursor = context.contentResolver.query(
            CallLog.Calls.CONTENT_URI,
            projection,
            selection,
            selectionArgs,
            "${CallLog.Calls.DATE} ASC LIMIT $limit",
        ) ?: return 0

        var lastSeenTs = since
        val entities = mutableListOf<PendingCallLogEntity>()

        cursor.use {
            val idxId = it.getColumnIndexOrThrow(CallLog.Calls._ID)
            val idxNumber = it.getColumnIndexOrThrow(CallLog.Calls.NUMBER)
            val idxName = it.getColumnIndexOrThrow(CallLog.Calls.CACHED_NAME)
            val idxDuration = it.getColumnIndexOrThrow(CallLog.Calls.DURATION)
            val idxType = it.getColumnIndexOrThrow(CallLog.Calls.TYPE)
            val idxDate = it.getColumnIndexOrThrow(CallLog.Calls.DATE)

            while (it.moveToNext()) {
                val systemId = it.getString(idxId)
                val number = it.getString(idxNumber) ?: ""
                val name = it.getString(idxName)
                val duration = it.getLong(idxDuration)
                val type = it.getInt(idxType)
                val date = it.getLong(idxDate)

                if (date > lastSeenTs) {
                    lastSeenTs = date
                }

                val callId = "$systemId:$date"
                val localCallId = "$deviceId:$callId"
                entities.add(
                    PendingCallLogEntity(
                        localCallId = localCallId,
                        deviceId = deviceId,
                        callId = callId,
                        phoneNumber = number,
                        name = name,
                        durationSeconds = duration,
                        callType = type,
                        callTimestamp = date,
                    ),
                )
            }
        }

        if (entities.isNotEmpty()) {
            prefs.setLastReadTimestamp(lastSeenTs)
        }

        val inserted = dao.saveAndCountNew(entities)
        Log.i(TAG, "Collected ${entities.size} logs, inserted $inserted new logs")
        return inserted
    }

    suspend fun uploadPending(batchSize: Int = 100): UploadResult {
        val apiBaseUrl = prefs.getApiBaseUrl()
        val jwtToken = prefs.getJwtToken()
        val deviceId = prefs.getDeviceId()

        if (apiBaseUrl.isBlank() || jwtToken.isBlank() || deviceId.isBlank()) {
            Log.w(TAG, "Sync config incomplete, skip upload")
            return UploadResult(skipped = true)
        }

        val pending = dao.getPending(batchSize)
        if (pending.isEmpty()) {
            return UploadResult(processed = 0, inserted = 0, duplicates = 0)
        }

        val payload = pending.map {
            CallLogPayload(
                callId = it.callId,
                phoneNumber = it.phoneNumber,
                name = it.name,
                durationSeconds = it.durationSeconds,
                callType = it.callType,
                callTimestamp = it.callTimestamp,
            )
        }

        val api = RetrofitProvider.create(apiBaseUrl, jwtToken)
        val response = api.syncCallLogs(SyncCallLogsRequest(deviceId = deviceId, callLogs = payload))

        if (!response.isSuccessful) {
            val statusCode = response.code()
            val body = response.errorBody()?.string().orEmpty()
            throw SyncHttpException(statusCode, body)
        }

        val body = response.body()
        val inserted = body?.inserted ?: 0
        val duplicates = body?.duplicates ?: 0

        dao.markUploaded(pending.map { it.id })
        dao.pruneUploaded(System.currentTimeMillis() - RETENTION_MS)

        return UploadResult(
            processed = pending.size,
            inserted = inserted,
            duplicates = duplicates,
        )
    }

    suspend fun countPending(): Int = dao.countPending()

    private fun hasReadCallLogPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_CALL_LOG,
        ) == PackageManager.PERMISSION_GRANTED
    }

    data class UploadResult(
        val processed: Int = 0,
        val inserted: Int = 0,
        val duplicates: Int = 0,
        val skipped: Boolean = false,
    )

    class SyncHttpException(val statusCode: Int, message: String) : RuntimeException(message)

    companion object {
        private const val TAG = "CallSyncRepository"
        private const val RETENTION_MS = 7L * 24L * 60L * 60L * 1000L
    }
}
