package com.SmsSender.callsync.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction

@Dao
interface PendingCallLogDao {

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertIgnore(items: List<PendingCallLogEntity>): List<Long>

    @Query(
        """
        SELECT * FROM pending_call_logs
        WHERE uploaded = 0
        ORDER BY call_timestamp ASC
        LIMIT :limit
        """,
    )
    suspend fun getPending(limit: Int): List<PendingCallLogEntity>

    @Query("UPDATE pending_call_logs SET uploaded = 1, updated_at = :updatedAt WHERE id IN (:ids)")
    suspend fun markUploaded(ids: List<Long>, updatedAt: Long = System.currentTimeMillis())

    @Query("SELECT COUNT(*) FROM pending_call_logs WHERE uploaded = 0")
    suspend fun countPending(): Int

    @Query("DELETE FROM pending_call_logs WHERE uploaded = 1 AND updated_at < :olderThan")
    suspend fun pruneUploaded(olderThan: Long): Int

    @Transaction
    suspend fun saveAndCountNew(items: List<PendingCallLogEntity>): Int {
        if (items.isEmpty()) {
            return 0
        }

        val results = insertIgnore(items)
        return results.count { it != -1L }
    }
}
