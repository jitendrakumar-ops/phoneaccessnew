import { NativeModules, Platform } from 'react-native';
import {
  bootstrapCallLogSync,
  configureCallLogSync,
  ensureCallLogPermission,
} from './CallLogSyncBridge';

const { PlatformConstants } = NativeModules;

function getAndroidDeviceIdentity() {
  const model = PlatformConstants?.Model || PlatformConstants?.model || 'Android Device';
  const release = PlatformConstants?.Release || PlatformConstants?.Version || 'unknown';
  const serial = PlatformConstants?.Serial || PlatformConstants?.androidId || `android-${release}`;

  return {
    deviceId: String(serial),
    deviceName: String(model),
  };
}

export async function bootstrapCallLogSyncOnAppLaunch({
  apiBaseUrl,
  jwtToken,
}) {
  if (Platform.OS !== 'android') {
    return { started: false, reason: 'non-android' };
  }

  if (!apiBaseUrl || !jwtToken) {
    return { started: false, reason: 'missing-config' };
  }

  const hasPermission = await ensureCallLogPermission();
  if (!hasPermission) {
    return { started: false, reason: 'permission-denied' };
  }

  const { deviceId, deviceName } = getAndroidDeviceIdentity();
  await configureCallLogSync({
    apiBaseUrl,
    deviceId,
    jwtToken,
  });

  const scheduled = await bootstrapCallLogSync();
  return {
    started: Boolean(scheduled),
    deviceId,
    deviceName,
  };
}
