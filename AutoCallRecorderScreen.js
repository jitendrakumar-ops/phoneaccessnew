import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, PermissionsAndroid, Platform, Alert, Pressable, ActivityIndicator, NativeModules } from 'react-native';
import Sound from 'react-native-nitro-sound';
import { startCallListener } from './CallListener';

const { CallRecorderModule } = NativeModules;

export default function AutoCallRecorderScreen() {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [liveCallEvent, setLiveCallEvent] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState(null);
  const [status, setStatus] = useState('Waiting for call...');
  const [isPlaying, setIsPlaying] = useState(false);

  // Use refs to avoid closure stale state in the listener
  const isRecordingRef = useRef(isRecording);
  
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        
        if (
          granted['android.permission.READ_PHONE_STATE'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.READ_CALL_LOG'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          setHasPermissions(true);
        } else {
          Alert.alert("Permission Denied", "Call recording needs Phone and Microphone permissions.");
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      Promise.all([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
      ]).then(([phone, audio]) => {
        if (phone && audio) setHasPermissions(true);
      });
    }
  }, []);

  // Handle call recording logic
  useEffect(() => {
    if (!hasPermissions) return;
    
    const unsubscribe = startCallListener(async (event) => {
      setLiveCallEvent(event);
      
      const state = event.state;
      
      // Call is Active / Answered / Outgoing Started
      if (state === 'OFFHOOK' && !isRecordingRef.current) {
        setStatus('Call started. Recording via Accessibility Bypass...');
        try {
          const result = await CallRecorderModule.startRecording();
          setIsRecording(true);
          if (result) setAudioUri(result);
        } catch (err) {
          console.error("Failed to start recording", err);
          setStatus('Failed to start recording');
        }
      }
      
      // Call Ended
      if (state === 'IDLE' && isRecordingRef.current) {
        setStatus('Call ended. Saving recording...');
        try {
          const result = await CallRecorderModule.stopRecording();
          setIsRecording(false);
          if (result) setAudioUri(result);
          setStatus('Saved successfully to Local Storage');
        } catch (err) {
          console.error("Failed to stop recording", err);
          setIsRecording(false);
          setAudioUri(null); 
          setStatus('Blocked by Android! Did you enable Accessibility Service?');
        }
      }
    });

    return () => unsubscribe();
  }, [hasPermissions]);

  const playRecording = async () => {
    if (!audioUri) {
      Alert.alert('No recording found');
      return;
    }
    try {
      setIsPlaying(true);
      setStatus('Playing recording...');
      await Sound.startPlayer(audioUri);
      setStatus('Playback finished');
    } catch (err) {
      console.log('Play Error:', err);
      setStatus('Failed to play');
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center px-6 py-10">
        <Text className="text-3xl font-bold text-white mb-2 text-center">Auto Call Recorder</Text>
        <Text className="text-slate-400 mb-6 text-center">
          Uses Accessibility Service to bypass Android 10+ recording restrictions.
        </Text>
        
        {!hasPermissions ? (
          <View className="w-full items-center">
            <Pressable 
              onPress={requestPermissions}
              className="w-full p-4 bg-emerald-600 rounded-lg items-center mb-4"
            >
              <Text className="text-white text-lg font-semibold">Grant Permissions</Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full max-w-sm">
            <Pressable 
              onPress={() => CallRecorderModule.openAccessibilitySettings()}
              className="w-full p-4 bg-yellow-600 rounded-lg items-center mb-6"
            >
              <Text className="text-white text-base font-bold text-center">
                MUST DO: Enable "SmsSender" in Accessibility Settings!
              </Text>
            </Pressable>

            {/* Status Panel */}
            <View className={`w-full p-6 rounded-lg border mb-6 ${isRecording ? 'bg-red-900 border-red-500' : 'bg-slate-800 border-slate-700'}`}>
              <Text className={`text-xl font-bold mb-2 ${isRecording ? 'text-red-400' : 'text-slate-300'}`}>
                {isRecording ? '⏺ RECORDING IN PROGRESS' : 'STATUS'}
              </Text>
              <Text className="text-white text-base">{status}</Text>
              
              {liveCallEvent && (
                <View className="mt-4 pt-4 border-t border-slate-600">
                  <Text className="text-slate-300">Call State: <Text className="font-bold text-white">{liveCallEvent.state}</Text></Text>
                  <Text className="text-slate-300">Number: <Text className="font-bold text-white">{liveCallEvent.incomingNumber}</Text></Text>
                  <Text className="text-slate-300">Type: <Text className="font-bold text-white">{liveCallEvent.callType || 'Unknown'}</Text></Text>
                </View>
              )}
            </View>

            {/* Playback Controls */}
            {audioUri && !isRecording && (
              <View className="w-full p-6 rounded-lg bg-indigo-900 border border-indigo-500 items-center">
                <Text className="text-indigo-300 mb-4 text-center">Last Recording Saved!</Text>
                <Pressable 
                  onPress={playRecording}
                  disabled={isPlaying}
                  className={`w-full p-4 rounded-lg items-center ${isPlaying ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                >
                  {isPlaying ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white text-lg font-bold">▶ PLAY RECORDING</Text>
                  )}
                </Pressable>
                <Text className="text-slate-400 text-xs mt-4 text-center break-all">{audioUri}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
