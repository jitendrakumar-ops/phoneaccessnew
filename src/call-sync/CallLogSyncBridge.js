import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

const NativeCallSync = NativeModules.CallLogSyncModule;

if (!NativeCallSync && Platform.OS === 'android') {
  console.warn('CallLogSyncModule native module not found');
}

export async function ensureCallLogPermission() {
  if (Platform.OS !== 'android') {
    return false;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    {
      title: 'Call log access required',
      message:
        'Call log permission is required to sync your call history securely to the server.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function configureCallLogSync({ apiBaseUrl, deviceId, jwtToken }) {
  if (Platform.OS !== 'android' || !NativeCallSync) {
    return false;
  }

  await NativeCallSync.configure(apiBaseUrl, deviceId, jwtToken);
  return true;
}

export async function bootstrapCallLogSync() {
  if (Platform.OS !== 'android' || !NativeCallSync) {
    return false;
  }
  return NativeCallSync.bootstrapSync();
}

export async function triggerCallLogSyncNow() {
  if (Platform.OS !== 'android' || !NativeCallSync) {
    return false;
  }
  return NativeCallSync.syncNow();
}
