package com.SmsSender

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.telephony.TelephonyManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class CallModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var isReceiverRegistered = false
    private var lastState = TelephonyManager.EXTRA_STATE_IDLE
    private var callType = "Unknown"

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
                val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
                val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

                if (state == TelephonyManager.EXTRA_STATE_RINGING) {
                    callType = "Incoming"
                } else if (state == TelephonyManager.EXTRA_STATE_OFFHOOK) {
                    if (lastState == TelephonyManager.EXTRA_STATE_IDLE) {
                        callType = "Outgoing"
                    }
                } else if (state == TelephonyManager.EXTRA_STATE_IDLE) {
                    // keep callType or set to None
                }
                
                lastState = state ?: TelephonyManager.EXTRA_STATE_IDLE
                
                val params = Arguments.createMap().apply {
                    putString("state", state) // e.g., "RINGING", "OFFHOOK", "IDLE"
                    putString("incomingNumber", incomingNumber ?: "Unknown")
                    putString("callType", callType)
                }
                sendEvent("CALL_EVENT", params)
            }
        }
    }

    @ReactMethod
    fun start() {
        if (!isReceiverRegistered) {
            val filter = IntentFilter(TelephonyManager.ACTION_PHONE_STATE_CHANGED)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
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
            }
            isReceiverRegistered = false
        }
    }

    override fun getName(): String {
        return "CallModule"
    }

    private fun sendEvent(eventName: String, params: Any?) {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }
}
