package com.SmsSender

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class WhatsAppPackage : ReactPackage {

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): MutableList<ViewManager<View, ReactShadowNode<*>>> = mutableListOf()

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): MutableList<NativeModule> {
        val modules = mutableListOf<NativeModule>()
        modules.add(WhatsAppModule(reactContext))
        modules.add(SmsSenderModule(reactContext))
        modules.add(CallModule(reactContext))
        modules.add(CallRecorderModule(reactContext))
        modules.add(CallLogSyncModule(reactContext))
        return modules
    }
}
