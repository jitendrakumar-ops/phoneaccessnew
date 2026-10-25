# Folder Structure for Call Log Sync

## Mobile (React Native + Android)

- android/app/src/main/java/com/smssender/CallLogSyncModule.kt
- android/app/src/main/java/com/smssender/callsync/CallSyncPreferences.kt
- android/app/src/main/java/com/smssender/callsync/CallSyncRepository.kt
- android/app/src/main/java/com/smssender/callsync/CallSyncScheduler.kt
- android/app/src/main/java/com/smssender/callsync/db/CallSyncDatabase.kt
- android/app/src/main/java/com/smssender/callsync/db/PendingCallLogDao.kt
- android/app/src/main/java/com/smssender/callsync/db/PendingCallLogEntity.kt
- android/app/src/main/java/com/smssender/callsync/net/ApiModels.kt
- android/app/src/main/java/com/smssender/callsync/net/CallSyncApi.kt
- android/app/src/main/java/com/smssender/callsync/net/RetrofitProvider.kt
- android/app/src/main/java/com/smssender/callsync/worker/CallLogSyncWorker.kt
- src/call-sync/CallLogSyncBridge.js
- src/call-sync/callLogSyncService.js

## Backend (Node.js + Express + MongoDB)

- server/src/middleware/auth.js
- server/src/models/User.js
- server/src/models/CallSyncLog.js
- server/src/routes/auth.js
- server/src/routes/callSync.js
- server/src/utils/logger.js
- server/server.js
- server/.env.example
