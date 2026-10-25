import React, { useState } from 'react';
import { View, Text, Pressable, Alert, PermissionsAndroid, Platform } from 'react-native';
import Sound, {
  AudioSourceAndroidType,
  OutputFormatAndroidType,
  AudioEncoderAndroidType,
} from 'react-native-nitro-sound';

const RECORDER_PROFILES = [
  {
    name: 'voice_recognition',
    audioSet: {
      AudioSourceAndroid: AudioSourceAndroidType.VOICE_RECOGNITION,
      OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSamplingRate: 44100,
      AudioChannels: 1,
      AudioEncodingBitRate: 128000,
    },
  },
  {
    name: 'mic',
    audioSet: {
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSamplingRate: 44100,
      AudioChannels: 1,
      AudioEncodingBitRate: 128000,
    },
  },
];

export default function MicScreen() {
  const [recording, setRecording] = useState(false);
  const [audioUri, setAudioUri] = useState(null);
  const [status, setStatus] = useState('Ready');

  // Permission
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // Start Recording
  const startRecording = async () => {
    try {
      const hasPermission = await requestPermission();

      if (!hasPermission) {
        Alert.alert('Permission required', 'Microphone access is needed');
        return;
      }

      setStatus('Recording...');

      // Start recorder with source fallback for better device compatibility
      let result = null;
      let started = false;
      let lastStartError = null;

      for (const profile of RECORDER_PROFILES) {
        try {
          result = await Sound.startRecorder(undefined, profile.audioSet, true);
          started = true;
          break;
        } catch (startError) {
          lastStartError = startError;
        }
      }

      if (!started) {
        throw lastStartError || new Error('Unable to start recorder');
      }

      setRecording(true);

      // result usually returns file path
      if (result) {
        setAudioUri(result);
      }
    } catch (err) {
      console.log('Start Error:', err);
      setStatus('Failed to start recording');
    }
  };

  // Stop Recording
  const stopRecording = async () => {
    try {
      const result = await Sound.stopRecorder();

      setRecording(false);
      setStatus('Saved');

      if (result) {
        setAudioUri(result);
      }
    } catch (err) {
      console.log('Stop Error:', err);
      setStatus('Stop failed');
    }
  };

  // Play Audio
  const playAudio = async () => {
    try {
      if (!audioUri) {
        Alert.alert('No recording found');
        return;
      }

      setStatus('Playing...');

      await Sound.startPlayer(audioUri);
    } catch (err) {
      console.log('Play Error:', err);
      setStatus('Play failed');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>

      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
        Voice Recorder
      </Text>

      <Pressable
        onPress={startRecording}
        disabled={recording}
        style={{
          padding: 15,
          backgroundColor: recording ? '#999' : 'green',
          borderRadius: 10
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          Start Recording
        </Text>
      </Pressable>

      <Pressable
        onPress={stopRecording}
        disabled={!recording}
        style={{
          padding: 15,
          backgroundColor: !recording ? '#999' : 'red',
          marginTop: 10,
          borderRadius: 10
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          Stop Recording
        </Text>
      </Pressable>

      <Pressable
        onPress={playAudio}
        style={{
          padding: 15,
          backgroundColor: 'blue',
          marginTop: 10,
          borderRadius: 10
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          Play Audio
        </Text>
      </Pressable>

      <Text style={{ marginTop: 20, fontSize: 16 }}>
        Status: {status}
      </Text>

      <Text style={{ marginTop: 10, fontSize: 12 }}>
        File: {audioUri || 'No recording yet'}
      </Text>

    </View>
  );
}