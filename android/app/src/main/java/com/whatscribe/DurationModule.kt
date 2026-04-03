package com.whatscribe

import android.media.MediaMetadataRetriever
import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DurationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "DurationModule"
    }

    @ReactMethod
    fun getDuration(uriString: String, promise: Promise) {
        val retriever = MediaMetadataRetriever()
        try {
            val uri = Uri.parse(uriString)
            retriever.setDataSource(reactApplicationContext, uri)
            val durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
            val durationMs = durationStr?.toLong() ?: 0L
            // Convert to seconds
            val durationSec = durationMs / 1000.0
            promise.resolve(durationSec)
        } catch (e: Exception) {
            promise.reject("DURATION_ERROR", e.message)
        } finally {
            try {
                retriever.release()
            } catch (e: Exception) {
                // Ignore release errors
            }
        }
    }
}
