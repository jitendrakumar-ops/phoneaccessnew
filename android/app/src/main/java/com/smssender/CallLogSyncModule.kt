package com.SmsSender

import android.Manifest
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.SmsSender.callsync.CallSyncPreferences
import com.SmsSender.callsync.CallSyncScheduler
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class CallLogSyncModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val prefs = CallSyncPreferences(reactContext)

    override fun getName(): String = "CallLogSyncModule"

    @ReactMethod
    fun configure(apiBaseUrl: String, deviceId: String, jwtToken: String, promise: Promise) {
        try {
            prefs.setApiBaseUrl(apiBaseUrl)
            prefs.setDeviceId(deviceId)
            prefs.setJwtToken(jwtToken)
            promise.resolve(true)
        } catch (ex: Exception) {
            promise.reject("CONFIG_ERROR", ex)
        }
    }

    @ReactMethod
    fun hasPermission(promise: Promise) {
        val granted = ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.READ_CALL_LOG,
        ) == PackageManager.PERMISSION_GRANTED
        promise.resolve(granted)
    }

    @ReactMethod
    fun bootstrapSync(promise: Promise) {
        try {
            if (!isPermissionGranted()) {
                promise.resolve(false)
                return
            }

            CallSyncScheduler.schedulePeriodic(reactContext)
            CallSyncScheduler.enqueueImmediate(reactContext)
            promise.resolve(true)
        } catch (ex: Exception) {
            promise.reject("BOOTSTRAP_ERROR", ex)
        }
    }

    @ReactMethod
    fun syncNow(promise: Promise) {
        try {
            if (!isPermissionGranted()) {
                promise.resolve(false)
                return
            }

            CallSyncScheduler.enqueueImmediate(reactContext)
            promise.resolve(true)
        } catch (ex: Exception) {
            promise.reject("SYNC_NOW_ERROR", ex)
        }
    }

    private fun isPermissionGranted(): Boolean {
        val granted = ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.READ_CALL_LOG,
        ) == PackageManager.PERMISSION_GRANTED

        if (!granted) {
            Log.i(TAG, "READ_CALL_LOG not granted; sync will not run")
        }

        return granted
    }

    companion object {
        private const val TAG = "CallLogSyncModule"
    }
}
