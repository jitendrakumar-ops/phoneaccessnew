import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, PermissionsAndroid, Platform, Alert, Pressable } from 'react-native';
import { startCallListener } from './CallListener';

export default function LiveCallScreen() {
  const [liveCallEvent, setLiveCallEvent] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
        ]);
        
        if (
          granted['android.permission.READ_PHONE_STATE'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.READ_CALL_LOG'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          setHasPermission(true);
        } else {
          Alert.alert("Permission Denied", "Live call detection won't work without permissions.");
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    // Check if we already have permission on mount silently
    if (Platform.OS === 'android') {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE).then(granted => {
        if (granted) setHasPermission(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!hasPermission) return;
    
    const unsubscribe = startCallListener((event) => {
      console.log("LiveCallEvent", event);
      setLiveCallEvent(event);
    });
    return () => unsubscribe();
  }, [hasPermission]);

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-white mb-6">Live Call Listener</Text>
        
        {!hasPermission ? (
          <View className="w-full items-center">
            <Text className="text-white mb-6 text-center">
              Requires READ_PHONE_STATE and READ_CALL_LOG permission to detect calls and numbers.
            </Text>
            <Pressable 
              onPress={requestPermission}
              className="w-full p-4 bg-emerald-600 rounded-lg items-center"
            >
              <Text className="text-white text-lg font-semibold">Grant Permissions</Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full max-w-sm">
            {liveCallEvent ? (
              <View className="w-full p-6 bg-emerald-900 rounded-lg border border-emerald-500 items-center shadow-lg">
                <Text className="text-emerald-400 font-bold mb-4 text-xl">
                  {liveCallEvent.callType} Call
                </Text>
                
                <Text className="text-slate-300 text-lg mb-2">
                  <Text className="font-semibold text-white">State: </Text> 
                  {liveCallEvent.state}
                </Text>
                
                <Text className="text-slate-300 text-lg">
                  <Text className="font-semibold text-white">Number: </Text> 
                  {liveCallEvent.incomingNumber}
                </Text>
              </View>
            ) : (
               <View className="w-full p-6 bg-slate-800 rounded-lg border border-slate-700 items-center">
                 <Text className="text-white text-base italic text-center">
                   Waiting for an incoming or outgoing call...
                 </Text>
               </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
