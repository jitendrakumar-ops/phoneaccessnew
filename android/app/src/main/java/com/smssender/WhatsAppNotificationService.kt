package com.SmsSender

import android.app.Notification
import android.content.Intent
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class WhatsAppNotificationService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName
        
        // Log all packages to logcat just to see if the listener works
        Log.d("WhatsAppListener", "Notification from: $packageName")

        if (packageName == "com.whatsapp" || packageName == "com.whatsapp.w4b") {
            val extras = sbn.notification.extras
            val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
            
            Log.d("WhatsAppListener", "Posted: $title - $text")
            
            val intent = Intent("com.SmsSender.WHATSAPP_NOTIFICATION")
            intent.setPackage(applicationContext.packageName)
            intent.putExtra("title", title)
            intent.putExtra("text", text)
            intent.putExtra("packageName", packageName)
            
            sendBroadcast(intent)
        }
    }
}
