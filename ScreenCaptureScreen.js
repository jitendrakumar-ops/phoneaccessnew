import React, { useState, useRef } from 'react';
import { View, Text, SafeAreaView, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { captureScreen } from 'react-native-view-shot';

export default function ScreenCaptureScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const takeScreenshot = async () => {
    setLoading(true);
    try {
      const uri = await captureScreen({
        format: "png",
        quality: 0.8
      });
      setImageUri(uri);
      console.log("Screenshot captured: ", uri);
    } catch (error) {
      console.error("Oops, snapshot failed", error);
      Alert.alert("Error", "Failed to capture screen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center px-6 py-10">
        <Text className="text-3xl font-bold text-white mb-6">Screen Capture</Text>
        
        <Text className="text-slate-400 text-center mb-8">
          Take a screenshot of the current app screen and view it below.
        </Text>

        <Pressable 
          onPress={takeScreenshot}
          disabled={loading}
          className={`w-full max-w-sm p-4 rounded-lg items-center mb-8 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-lg font-semibold">Take Screenshot</Text>
          )}
        </Pressable>

        {imageUri ? (
          <View className="w-full flex-1 items-center rounded-lg overflow-hidden border border-slate-700 bg-slate-900 p-2">
            <Text className="text-slate-300 font-bold mb-2">Captured Preview:</Text>
            <Image 
              source={{ uri: imageUri }} 
              style={{ width: '100%', height: '80%' }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-slate-600 italic">No screenshot captured yet</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
