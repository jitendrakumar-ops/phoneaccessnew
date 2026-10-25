package com.SmsSender.callsync.worker

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.SmsSender.callsync.CallSyncRepository

class CallLogSyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

    private val repository = CallSyncRepository(appContext)

    override suspend fun doWork(): Result {
        if (!hasReadCallLogPermission()) {
            Log.i(TAG, "Permission not granted, no background sync")
            return Result.success()
        }

        return try {
            val collected = repository.collectFromDevice(limit = 300)
            val uploadResult = repository.uploadPending(batchSize = 100)
            val pending = repository.countPending()

            Log.i(
                TAG,
                "sync_success collected=$collected processed=${uploadResult.processed} inserted=${uploadResult.inserted} duplicates=${uploadResult.duplicates} pending=$pending",
            )

            Result.success()
        } catch (ex: CallSyncRepository.SyncHttpException) {
            if (ex.statusCode == 401 || ex.statusCode == 403) {
                Log.w(TAG, "auth_error status=${ex.statusCode}")
                return Result.failure()
            }

            Log.w(TAG, "http_error status=${ex.statusCode} message=${ex.message}")
            Result.retry()
        } catch (ex: Exception) {
            Log.e(TAG, "sync_failed", ex)
            Result.retry()
        }
    }

    private fun hasReadCallLogPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            applicationContext,
            Manifest.permission.READ_CALL_LOG,
        ) == PackageManager.PERMISSION_GRANTED
    }

    companion object {
        private const val TAG = "CallLogSyncWorker"
    }
}
