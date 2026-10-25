package com.SmsSender

import android.accessibilityservice.AccessibilityService
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.text.TextUtils
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class CallRecordingAccessibilityService : AccessibilityService() {
    data class PendingUiSend(
        val message: String,
        val createdAt: Long,
        val expiresAt: Long,
        val attempts: Int,
    )

    companion object {
        private const val WHATSAPP_PACKAGE = "com.whatsapp"
        private const val WHATSAPP_BUSINESS_PACKAGE = "com.whatsapp.w4b"
        private const val AUTOMATION_TTL_MS = 30_000L
        private const val MAX_AUTOMATION_ATTEMPTS = 20

        @Volatile
        private var pendingWhatsAppSend: PendingUiSend? = null

        @Synchronized
        fun enqueueWhatsAppSend(message: String) {
            val now = SystemClock.elapsedRealtime()
            pendingWhatsAppSend = PendingUiSend(
                message = message,
                createdAt = now,
                expiresAt = now + AUTOMATION_TTL_MS,
                attempts = 0,
            )
        }

        @Synchronized
        fun clearPendingWhatsAppSend() {
            pendingWhatsAppSend = null
        }

        @Synchronized
        private fun incrementAttempts(packageName: String): PendingUiSend? {
            return if (isWhatsAppPackage(packageName)) {
                val current = pendingWhatsAppSend ?: return null
                val updated = current.copy(attempts = current.attempts + 1)
                pendingWhatsAppSend = updated
                updated
            } else {
                null
            }
        }

        @Synchronized
        private fun getPendingForPackage(packageName: String): PendingUiSend? {
            return if (isWhatsAppPackage(packageName)) pendingWhatsAppSend else null
        }

        @Synchronized
        private fun clearPendingForPackage(packageName: String) {
            if (isWhatsAppPackage(packageName)) {
                pendingWhatsAppSend = null
            }
        }

        private fun isWhatsAppPackage(packageName: String): Boolean {
            return packageName == WHATSAPP_PACKAGE || packageName == WHATSAPP_BUSINESS_PACKAGE
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) {
            return
        }

        val pkg = event.packageName?.toString() ?: return
        val pending = getPendingForPackage(pkg) ?: return

        val now = SystemClock.elapsedRealtime()
        if (now > pending.expiresAt || pending.attempts >= MAX_AUTOMATION_ATTEMPTS) {
            clearPendingForPackage(pkg)
            return
        }

        val rootNode = rootInActiveWindow ?: return
        val inputNode = findMessageInputNode(rootNode, pkg)
        if (inputNode != null) {
            setNodeText(inputNode, pending.message)
        }

        val sendClicked = clickSendButton(rootNode, pkg)
        if (sendClicked) {
            clearPendingForPackage(pkg)
            return
        }

        Handler(Looper.getMainLooper()).postDelayed({
            val retryRoot = rootInActiveWindow ?: return@postDelayed
            val delayedSend = clickSendButton(retryRoot, pkg)
            if (delayedSend) {
                clearPendingForPackage(pkg)
            }
        }, 1_000L + pending.attempts * 500L)

        incrementAttempts(pkg)
    }

    override fun onInterrupt() {}

    private fun findMessageInputNode(root: AccessibilityNodeInfo, packageName: String): AccessibilityNodeInfo? {
        val viewIdCandidates = if (packageName.startsWith("com.whatsapp")) {
            listOf(
                "$packageName:id/entry",
                "$packageName:id/message_input",
                "$packageName:id/caption",
            )
        } else {
            emptyList()
        }

        for (viewId in viewIdCandidates) {
            val nodes = root.findAccessibilityNodeInfosByViewId(viewId)
            if (!nodes.isNullOrEmpty()) {
                return nodes.firstOrNull { it.isEditable || it.className?.toString()?.contains("EditText") == true }
                    ?: nodes.first()
            }
        }

        return findNodeByPredicate(root) { node ->
            val className = node.className?.toString().orEmpty()
            className.contains("EditText") || node.isEditable
        }
    }

    private fun setNodeText(node: AccessibilityNodeInfo, text: String): Boolean {
        if (TextUtils.isEmpty(text)) {
            return false
        }

        val currentText = node.text?.toString().orEmpty().trim()
        if (currentText == text.trim()) {
            return true
        }

        node.performAction(AccessibilityNodeInfo.ACTION_FOCUS)

        val args = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
        }
        return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
    }

    private fun clickSendButton(root: AccessibilityNodeInfo, packageName: String): Boolean {
        val viewIdCandidates = if (packageName.startsWith("com.whatsapp")) {
            listOf(
                "$packageName:id/send",
                "$packageName:id/send_btn",
                "$packageName:id/send_button",
            )
        } else {
            emptyList()
        }

        for (viewId in viewIdCandidates) {
            val nodes = root.findAccessibilityNodeInfosByViewId(viewId)
            if (!nodes.isNullOrEmpty()) {
                nodes.forEach { candidate ->
                    if (clickNodeOrParent(candidate)) {
                        return true
                    }
                }
            }
        }

        val keywordCandidates = listOf(
            "send",
            "message",
            "send message",
            "bheje",
            "bhejna",
            "भेजें",
            "भेजना",
            "send button",
            "tap to send",
            "arrow",
        )
        val foundByText = findNodeByPredicate(root) { node ->
            val desc = node.contentDescription?.toString()?.lowercase().orEmpty()
            val txt = node.text?.toString()?.lowercase().orEmpty()
            val className = node.className?.toString()?.lowercase().orEmpty()
            val isButtonLike = className.contains("button") || className.contains("imagebutton") || node.isClickable
            val matchesKeyword = keywordCandidates.any { token -> desc.contains(token) || txt.contains(token) }
            (matchesKeyword && isButtonLike) || (isButtonLike && desc.contains("send") && desc.isNotEmpty())
        }

        return foundByText?.let { clickNodeOrParent(it) } == true
    }

    private fun clickNodeOrParent(node: AccessibilityNodeInfo?): Boolean {
        var current = node
        repeat(4) {
            if (current == null) {
                return false
            }
            if (current.isClickable && current.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                return true
            }
            current = current.parent
        }
        return false
    }

    private fun findNodeByPredicate(
        root: AccessibilityNodeInfo,
        predicate: (AccessibilityNodeInfo) -> Boolean,
    ): AccessibilityNodeInfo? {
        if (predicate(root)) {
            return root
        }

        for (i in 0 until root.childCount) {
            val child = root.getChild(i) ?: continue
            val result = findNodeByPredicate(child, predicate)
            if (result != null) {
                return result
            }
        }

        return null
    }
}
