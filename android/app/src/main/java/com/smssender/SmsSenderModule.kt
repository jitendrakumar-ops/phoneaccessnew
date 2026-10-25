package com.SmsSender

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.content.pm.PackageManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SmsSenderModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SmsSenderModule"

    @ReactMethod
    fun openWhatsAppComposer(recipient: String?, message: String?, promise: Promise) {
        val number = recipient?.trim().orEmpty()
        val text = message?.trim().orEmpty()

        if (number.isEmpty() || text.isEmpty()) {
            promise.reject("E_INVALID_ARGS", "recipient and message are required")
            return
        }

        val normalizedPhone = number.filter { it.isDigit() }
        if (normalizedPhone.isEmpty()) {
            promise.reject("E_INVALID_RECIPIENT", "recipient must contain at least one digit")
            return
        }

        val packageCandidates = listOf("com.whatsapp", "com.whatsapp.w4b")
        val targetPackage = packageCandidates.firstOrNull { isPackageInstalled(it) }
        if (targetPackage == null) {
            promise.reject("E_WHATSAPP_MISSING", "WhatsApp app is not installed on this device.")
            return
        }

        try {
            CallRecordingAccessibilityService.enqueueWhatsAppSend(text)

            val uriCandidates = listOf(
                Uri.parse("whatsapp://send?phone=$normalizedPhone&text=${Uri.encode(text)}"),
                Uri.parse("https://wa.me/$normalizedPhone?text=${Uri.encode(text)}"),
            )

            val launchIntent = uriCandidates
                .asSequence()
                .map { uri ->
                    Intent(Intent.ACTION_VIEW, uri).apply {
                        setPackage(targetPackage)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                }
                .firstOrNull { intent -> intent.resolveActivity(reactContext.packageManager) != null }

            if (launchIntent == null) {
                CallRecordingAccessibilityService.clearPendingWhatsAppSend()
                promise.reject("E_WHATSAPP_COMPOSER_UNAVAILABLE", "WhatsApp compose intent is unavailable.")
                return
            }

            reactContext.startActivity(launchIntent)
            promise.resolve(true)
        } catch (error: Throwable) {
            CallRecordingAccessibilityService.clearPendingWhatsAppSend()
            promise.reject("E_WHATSAPP_COMPOSER_FAILED", error.message ?: error.toString())
        }
    }

    private fun isPackageInstalled(packageName: String): Boolean {
        return try {
            reactContext.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (_: PackageManager.NameNotFoundException) {
            false
        }
    }
}
