package com.SmsSender

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class WhatsAppModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var isReceiverRegistered = false

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val title = intent.getStringExtra("title")
            val text = intent.getStringExtra("text")
            val packageName = intent.getStringExtra("packageName")

            val params = Arguments.createMap().apply {
                putString("title", title)
                putString("text", text)
                putString("packageName", packageName)
            }
            sendEvent("WHATSAPP_NOTIFICATION_EVENT", params)
        }
    }

    @ReactMethod
    fun start() {
        if (!isReceiverRegistered) {
            val filter = IntentFilter("com.SmsSender.WHATSAPP_NOTIFICATION")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
            } else {
                reactContext.registerReceiver(receiver, filter)
            }
            isReceiverRegistered = true
        }
    }

    @ReactMethod
    fun stop() {
        if (isReceiverRegistered) {
            try {
                reactContext.unregisterReceiver(receiver)
            } catch (e: Exception) {
                // Ignore
            }
            isReceiverRegistered = false
        }
    }

    @ReactMethod
    fun openNotificationSettings() {
        try {
            val intent = Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            val intent = Intent(android.provider.Settings.ACTION_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        }
    }

    override fun getName(): String {
        return "WhatsAppModule"
    }

    private fun sendEvent(eventName: String, params: Any?) {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }
}
