package com.SmsSender.callsync

import android.content.Context

class CallSyncPreferences(context: Context) {

    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun getApiBaseUrl(): String = prefs.getString(KEY_API_BASE_URL, "") ?: ""

    fun setApiBaseUrl(value: String) {
        prefs.edit().putString(KEY_API_BASE_URL, value.trimEnd('/')).apply()
    }

    fun getJwtToken(): String = prefs.getString(KEY_JWT_TOKEN, "") ?: ""

    fun setJwtToken(value: String) {
        prefs.edit().putString(KEY_JWT_TOKEN, value).apply()
    }

    fun getDeviceId(): String = prefs.getString(KEY_DEVICE_ID, "") ?: ""

    fun setDeviceId(value: String) {
        prefs.edit().putString(KEY_DEVICE_ID, value).apply()
    }

    fun getLastReadTimestamp(): Long = prefs.getLong(KEY_LAST_READ_TIMESTAMP, 0L)

    fun setLastReadTimestamp(value: Long) {
        prefs.edit().putLong(KEY_LAST_READ_TIMESTAMP, value).apply()
    }

    companion object {
        private const val PREFS_NAME = "call_sync_prefs"
        private const val KEY_API_BASE_URL = "api_base_url"
        private const val KEY_JWT_TOKEN = "jwt_token"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_LAST_READ_TIMESTAMP = "last_read_timestamp"
    }
}
