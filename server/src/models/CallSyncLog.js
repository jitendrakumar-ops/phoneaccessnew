const mongoose = require('mongoose');

const CallSyncLogSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    callId: { type: String, required: true },
    phoneNumber: { type: String, default: '' },
    name: { type: String, default: null },
    durationSeconds: { type: Number, default: 0 },
    callType: { type: Number, required: true },
    callTimestamp: { type: Number, required: true },
    receivedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

CallSyncLogSchema.index({ deviceId: 1, callId: 1 }, { unique: true });
CallSyncLogSchema.index({ deviceId: 1, callTimestamp: -1 });

module.exports = mongoose.model('CallSyncLog', CallSyncLogSchema);
