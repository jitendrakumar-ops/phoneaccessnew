const express = require('express');
const CallSyncLog = require('../models/CallSyncLog');
const { authenticateJwt } = require('../middleware/auth');

const router = express.Router();

router.post('/sync', authenticateJwt, async (req, res, next) => {
  try {
    const { deviceId, callLogs } = req.body;

    if (!deviceId || !Array.isArray(callLogs)) {
      return res.status(400).json({
        status: 'error',
        message: 'deviceId and callLogs array are required',
      });
    }

    if (callLogs.length > 500) {
      return res.status(413).json({
        status: 'error',
        message: 'Batch too large; max 500 call logs per request',
      });
    }

    const operations = callLogs.map((log) => {
      const callId = String(log.callId || '').trim();
      if (!callId) {
        throw new Error('Every call log item requires callId');
      }

      return {
        updateOne: {
          filter: {
            deviceId,
            callId,
          },
          update: {
            $setOnInsert: {
              deviceId,
              callId,
              phoneNumber: String(log.phoneNumber || ''),
              name: log.name || null,
              durationSeconds: Number(log.durationSeconds || 0),
              callType: Number(log.callType || 0),
              callTimestamp: Number(log.callTimestamp || 0),
              receivedAt: new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    const result = await CallSyncLog.bulkWrite(operations, { ordered: false });
    const inserted = result.upsertedCount || 0;
    const received = callLogs.length;
    const duplicates = received - inserted;

    return res.json({
      status: 'success',
      received,
      inserted,
      duplicates,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
