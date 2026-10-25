import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import CallLogs from 'react-native-call-log';

const CALLLOG_API_URL = 'http://192.168.1.124:3000/api/calllog';

function getDeviceInfo() {
  const platformConstants = NativeModules.PlatformConstants || {};

  const deviceName =
    platformConstants.Model ||
    platformConstants.model ||
    platformConstants.systemName ||
    `${Platform.OS} device`;

  const deviceId =
    platformConstants.Serial ||
    platformConstants.deviceId ||
    platformConstants.androidId ||
    `${Platform.OS}-${platformConstants.Release || platformConstants.Version || 'unknown'}`;

  return {
    deviceId: String(deviceId),
    deviceName: String(deviceName),
  };
}

function normalizeCallLog(entry) {
  return {
    id: String(entry.id ?? entry._id ?? ''),
    phoneNumber: String(entry.phoneNumber ?? entry.number ?? ''),
    formattedNumber: String(entry.formattedNumber ?? ''),
    duration: Number(entry.duration ?? 0),
    name: String(entry.name ?? ''),
    timestamp: String(entry.timestamp ?? ''),
    dateTime: String(entry.dateTime ?? ''),
    type: String(entry.type ?? ''),
    rawType: Number(entry.rawType ?? 0),
    phoneAccountId: String(entry.phoneAccountId ?? ''),
    simDisplayName: String(entry.simDisplayName ?? ''),
    cachedMatchedNumber: String(entry.cachedMatchedNumber ?? ''),
    cachedNumberType: String(entry.cachedNumberType ?? ''),
    cachedNumberLabel: String(entry.cachedNumberLabel ?? ''),
  };
}

import { startCallListener } from './CallListener';

export default function CallsScreen({autoRequest = false}) {
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false);
  const [dialogShown, setDialogShown] = useState(false);
  const [permissionState, setPermissionState] = useState('unknown');
  const [statusMessage, setStatusMessage] = useState('');
  const [liveCallEvent, setLiveCallEvent] = useState(null);

  useEffect(() => {
console.log("LiveCallEvent",liveCallEvent)

    const unsubscribe = startCallListener((event) => {
      console.log("LiveCallEvent",event)
      setLiveCallEvent(event);
    });
    return () => unsubscribe();
  }, []);

  const requestCallLogPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not supported', 'Call log access is only available on Android.');
      return false;
    }

    const permissions = [
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
    ];

    const results = await PermissionsAndroid.requestMultiple(permissions);
    const allGranted = permissions.every(
      permission => results[permission] === PermissionsAndroid.RESULTS.GRANTED,
    );

    if (allGranted) {
      setGranted(true);
      setPermissionState('granted');
      return true;
    }

    const anyNeverAskAgain = permissions.some(
      permission => results[permission] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
    );

    if (anyNeverAskAgain) {
      setGranted(false);
      setPermissionState('never_ask_again');
      Alert.alert(
        'Permission blocked',
        'Call log access is blocked. Open app settings and allow required permissions.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open settings', onPress: () => Linking.openSettings()},
        ],
        {cancelable: true},
      );
      return false;
    }

    setGranted(false);
    setPermissionState('denied');
    Alert.alert(
      'Permission denied',
      'READ_CALL_LOG permission is required to access call history. Tap again to retry.',
    );
    return false;
  }, []);

  const sendCallLogs = useCallback(async () => {
    setStatusMessage('');
    setLoading(true);

    try {
      const hasPermission = granted || (await requestCallLogPermissions());
      if (!hasPermission) {
        return;
      }

      const logs = await CallLogs.load(50);
      const payload = logs.map(normalizeCallLog);
      const { deviceId, deviceName } = getDeviceInfo();
      const response = await fetch(CALLLOG_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_logs: payload,
          device_id: deviceId,
          device_name: deviceName,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      setStatusMessage(`Successfully sent ${payload.length} call log entries.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send call log.';
      setStatusMessage(message);
      Alert.alert('Call log send failed', message);
    } finally {
      setLoading(false);
    }
  }, [granted, requestCallLogPermissions]);

  useEffect(() => {
    if (autoRequest && !dialogShown) {
      setDialogShown(true);
      Alert.alert(
        'Permission required',
        'App will request access to your call log. Allow to proceed?',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Allow', onPress: () => requestCallLogPermissions()},
        ],
        {cancelable: true},
      );
    }
  }, [autoRequest, dialogShown, requestCallLogPermissions]);

  return (
    <SafeAreaView className="flex-1 bg-slate-300">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-sm items-center gap-6">
          <Text className="text-center text-2xl font-bold text-slate-800">All Phone Calls</Text>

          {liveCallEvent ? (
            <View className="w-full p-4 bg-emerald-100 rounded-lg border border-emerald-500">
              <Text className="text-emerald-800 font-bold mb-1">Live Call State:</Text>
              <Text className="text-slate-700 text-sm">State: {liveCallEvent.state}</Text>
              <Text className="text-slate-700 text-sm">Number: {liveCallEvent.incomingNumber}</Text>
            </View>
          ) : null}

          <Text className="text-center text-base text-white">
            This tab requests the Android `READ_CALL_LOG` permission. To actually
            read call history, install a native module such as `react-native-call-log`
            or implement a small native bridge.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={sendCallLogs}
            className={`min-h-12 w-full items-center justify-center rounded-lg bg-amber-500 px-5 ${
              loading ? 'opacity-70' : 'active:bg-amber-600'
            }`}>
            <View className="flex-row items-center justify-center gap-3">
              {loading ? <ActivityIndicator color="#000" /> : null}
              <Text className="text-base font-semibold text-white">
                {loading ? 'Sending call log...' : 'Send Call Log to /api/calllog'}
              </Text>
            </View>
          </Pressable>

          {statusMessage ? (
            <Text className="text-center text-sm text-emerald-300">{statusMessage}</Text>
          ) : null}
          {permissionState === 'denied' ? (
            <Text className="text-center text-sm text-red-300">
              Permission denied. Tap the button to request again.
            </Text>
          ) : null}
          {permissionState === 'never_ask_again' ? (
            <Text className="text-center text-sm text-red-300">
              Call log access is blocked. Open app settings and enable the required permissions.
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
