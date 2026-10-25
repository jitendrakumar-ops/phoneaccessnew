import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

export default function CameraScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  
  const device = useCameraDevice(isFrontCamera ? 'front' : 'back');
  const camera = useRef(null);

  useEffect(() => {
    (async () => {
      if (!hasPermission) {
        const isGranted = await requestPermission();
        if (!isGranted) {
          Alert.alert("Permission Denied", "Camera permission is required to use this feature.");
        }
      }
    })();
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <Text className="text-white text-lg">Waiting for Camera Permission...</Text>
      </SafeAreaView>
    );
  }

  if (device == null) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white text-lg mt-4">Loading Camera...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 relative">
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
        />
        
        {/* Top Controls */}
        <View className="absolute top-0 left-0 right-0 p-4 flex-row justify-center bg-black/40">
          <Text className="text-white text-lg font-bold">Camera View</Text>
        </View>

        {/* Bottom Controls */}
        <View className="absolute bottom-0 left-0 right-0 pb-12 pt-6 px-8 flex-row justify-around items-center bg-black/60">
          <Pressable 
            onPress={() => setIsFrontCamera(!isFrontCamera)}
            className="px-6 py-3 bg-slate-800 rounded-full border border-slate-600"
          >
            <Text className="text-white font-bold">Flip {isFrontCamera ? 'Back' : 'Front'}</Text>
          </Pressable>

          <Pressable 
            onPress={async () => {
              try {
                if (camera.current) {
                  const photo = await camera.current.takePhoto();
                  Alert.alert("Captured!", "Photo saved at: " + photo.path);
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="w-16 h-16 bg-white rounded-full border-4 border-slate-400 active:bg-slate-300"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
