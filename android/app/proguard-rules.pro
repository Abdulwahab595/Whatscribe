# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# React Native & Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.bridge.Systrace { *; }
-keep class com.facebook.react.devsupport.** { *; }

# MMKV
-keep class com.tencent.mmkv.** { *; }
-keep class com.mrousavy.mmkv.** { *; }

# Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.uimanager.Reanimated* { *; }

# In-App Purchases (IAP)
-keep class com.android.vending.billing.**
-keep class com.dooboolab.RNIap.** { *; }

# OkHttp/Networking
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# General React Native
-keep class com.facebook.react.** { *; }
-keep public class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep public class * extends com.facebook.react.bridge.NativeModule { *; }
-keep public class * extends com.facebook.react.uimanager.ViewManager { *; }
-keep public class * extends com.facebook.react.uimanager.events.Event { *; }
-keep public class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { *; }

# react-native-config (Environment Variables)
-keep class com.lugg.ReactNativeConfig.** { *; }

# react-native-share-menu
-keep class com.sharemenu.** { *; }
