import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, SafeAreaView, DeviceEventEmitter, Alert, Linking, Platform, NativeModules } from 'react-native';

export default function WhatsAppNotificationListenerScreen() {
  const [isListening, setIsListening] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let subscription;
    if (isListening) {
      if (Platform.OS === 'android' && NativeModules.WhatsAppModule) {
        NativeModules.WhatsAppModule.start();
      }
      subscription = DeviceEventEmitter.addListener('WHATSAPP_NOTIFICATION_EVENT', (event) => {
        console.log('WhatsApp Notification Received:', event);
        setNotifications((prev) => [event, ...prev].slice(0, 10)); // Keep last 10
      });
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (Platform.OS === 'android' && NativeModules.WhatsAppModule) {
        NativeModules.WhatsAppModule.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const openNotificationSettings = () => {
    if (Platform.OS === 'android' && NativeModules.WhatsAppModule) {
      NativeModules.WhatsAppModule.openNotificationSettings();
    } else {
      Alert.alert('Not Supported', 'This feature is only available on Android.');
    }
  };

  return (
    <View className="flex-1 bg-slate-950 px-6 py-8">
      <Text className="text-3xl font-bold text-white mb-4">WhatsApp Listener</Text>

      <Text className="text-slate-300 text-sm mb-6">
        To read WhatsApp notifications, you must grant Notification Access in Android Settings.
      </Text>

      <Pressable 
        onPress={openNotificationSettings}
        className="w-full p-4 bg-indigo-600 rounded-lg items-center mb-4"
      >
        <Text className="text-white text-base font-semibold">Open Notification Settings</Text>
      </Pressable>

      <Pressable 
        onPress={toggleListening}
        className={`w-full p-4 rounded-lg items-center mb-6 ${isListening ? 'bg-red-500' : 'bg-emerald-500'}`}
      >
        <Text className="text-white text-base font-semibold">
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </Text>
      </Pressable>

      <Text className="text-white text-lg font-semibold mb-2">Recent Notifications:</Text>
      
      {notifications.length === 0 ? (
        <Text className="text-slate-500 italic">No notifications received yet.</Text>
      ) : (
        notifications.map((notif, index) => (
          <View key={index} className="p-3 bg-slate-800 rounded-lg mb-2 border border-slate-700">
            <Text className="text-emerald-400 font-bold mb-1">
              {notif.title || notif.sender || 'Unknown Sender'}
            </Text>
            <Text className="text-slate-300 text-sm">
              {notif.text || notif.message || JSON.stringify(notif)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
