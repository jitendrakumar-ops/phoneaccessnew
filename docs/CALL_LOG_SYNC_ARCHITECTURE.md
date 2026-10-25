# Call Log Sync Architecture (Android 10-15)

## High-level flow

1. User opens app and explicitly grants `READ_CALL_LOG`.
2. React Native configures native module with API base URL, device ID, and JWT.
3. Native module schedules WorkManager jobs.
4. Worker reads new call logs and persists unsent rows in Room.
5. Worker uploads pending rows through Retrofit + OkHttp over HTTPS.
6. Server verifies JWT and performs deduplicated upserts in MongoDB using `(deviceId, callId)` unique key.
7. Success marks rows as uploaded locally; failures trigger WorkManager retry.

## Required Android permissions

- `android.permission.READ_CALL_LOG`: Required to read call history.
- `android.permission.INTERNET`: Required for API communication.
- `android.permission.WAKE_LOCK`: Allows WorkManager to complete work reliably.

## Android background limitations (10-15)

- The app cannot run unlimited hidden background execution after process kill.
- Background sync must use Android managed components like WorkManager.
- Periodic work is best-effort and can be deferred by battery optimizations/Doze.
- Minimum periodic interval is 15 minutes.
- Immediate sync requests are still subject to OS constraints.
- If the user revokes permission, sync must stop and no call logs should be read.

## Reliability and retries

- WorkManager uses network constraints and exponential backoff.
- Room stores unsent records when offline or API fails.
- Next run retries pending records automatically.
- App launch triggers bootstrap again, which resumes scheduling if permission is still granted.

## Security

- HTTPS transport configurable on server (`ENABLE_HTTPS=true`).
- JWT bearer authentication required on call sync endpoint.
- Passwords hashed with bcrypt.
- Authorization header validated on every sync request.

## API contracts

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/call-logs/sync` (JWT required)

## Duplicate handling

- Client call ID format: `<system_call_id>:<timestamp>`
- Mongo unique index: `{ deviceId: 1, callId: 1 }`
- Server uses `bulkWrite` with `upsert` to ignore duplicates.
