package com.SmsSender.callsync.db

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "pending_call_logs",
    indices = [
        Index(value = ["local_call_id"], unique = true),
        Index(value = ["uploaded"]),
    ],
)
data class PendingCallLogEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    @ColumnInfo(name = "local_call_id")
    val localCallId: String,
    @ColumnInfo(name = "device_id")
    val deviceId: String,
    @ColumnInfo(name = "call_id")
    val callId: String,
    @ColumnInfo(name = "phone_number")
    val phoneNumber: String,
    @ColumnInfo(name = "name")
    val name: String?,
    @ColumnInfo(name = "duration_seconds")
    val durationSeconds: Long,
    @ColumnInfo(name = "call_type")
    val callType: Int,
    @ColumnInfo(name = "call_timestamp")
    val callTimestamp: Long,
    @ColumnInfo(name = "uploaded")
    val uploaded: Boolean = false,
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),
    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis(),
)
