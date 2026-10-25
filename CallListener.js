import { DeviceEventEmitter, NativeModules, Platform } from "react-native";

export function startCallListener(callback) {
  if (Platform.OS === 'android' && NativeModules.CallModule) {
    NativeModules.CallModule.start();
  }

  const subscription = DeviceEventEmitter.addListener(
    "CALL_EVENT",
    (event) => {
      callback(event);
    }
  );

  return () => {
    subscription.remove();
    if (Platform.OS === 'android' && NativeModules.CallModule) {
      NativeModules.CallModule.stop();
    }
  };
}