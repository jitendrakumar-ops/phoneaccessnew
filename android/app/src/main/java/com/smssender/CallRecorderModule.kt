package com.SmsSender

import android.media.MediaRecorder
import com.facebook.react.bridge.*
import java.io.File

class CallRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var mediaRecorder: MediaRecorder? = null
    private var currentFilePath: String? = null

    override fun getName() = "CallRecorderModule"

    @ReactMethod
    fun startRecording(promise: Promise) {
        try {
            val audioFile = File(reactApplicationContext.cacheDir, "call_record_${System.currentTimeMillis()}.mp4")
            currentFilePath = audioFile.absolutePath

            mediaRecorder = MediaRecorder().apply {
                setAudioSource(MediaRecorder.AudioSource.VOICE_RECOGNITION)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setOutputFile(currentFilePath)
                prepare()
                start()
            }
            promise.resolve(currentFilePath)
        } catch (e: Exception) {
            promise.reject("RECORDING_ERROR", "Failed to start: ${e.message}")
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
            promise.resolve(currentFilePath)
        } catch (e: Exception) {
            mediaRecorder?.release()
            mediaRecorder = null
            promise.reject("RECORDING_ERROR", "Failed to stop: ${e.message}")
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = android.content.Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }
}
