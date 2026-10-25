package com.SmsSender.callsync.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [PendingCallLogEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class CallSyncDatabase : RoomDatabase() {

    abstract fun pendingCallLogDao(): PendingCallLogDao

    companion object {
        @Volatile
        private var INSTANCE: CallSyncDatabase? = null

        fun getInstance(context: Context): CallSyncDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    CallSyncDatabase::class.java,
                    "call_sync.db",
                ).fallbackToDestructiveMigration().build().also {
                    INSTANCE = it
                }
            }
        }
    }
}
