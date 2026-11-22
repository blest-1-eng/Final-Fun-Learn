package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface FunLearnDao {
  @Query("SELECT * FROM student_profiles ORDER BY createdAtEpochMs ASC")
  suspend fun getAllStudents(): List<StudentProfileEntity>

  @Query("SELECT * FROM student_profiles WHERE id = :studentId LIMIT 1")
  suspend fun getStudentById(studentId: String): StudentProfileEntity?

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun upsertStudent(student: StudentProfileEntity)

  @Query("SELECT * FROM test_results WHERE studentId = :studentId ORDER BY timestampEpochMs DESC LIMIT :limit")
  suspend fun getTestResultsForStudent(studentId: String, limit: Int = 30): List<TestResultEntity>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertTestResult(result: TestResultEntity)

  @Query("SELECT * FROM nyra_levels WHERE studentId = :studentId ORDER BY createdAtEpochMs DESC LIMIT :limit")
  suspend fun getLevelsForStudent(studentId: String, limit: Int = 20): List<NyraLevelEntity>

  @Query("SELECT * FROM nyra_levels WHERE id = :levelId AND studentId = :studentId LIMIT 1")
  suspend fun getLevelById(studentId: String, levelId: String): NyraLevelEntity?

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun upsertLevel(level: NyraLevelEntity)

  @Query("UPDATE nyra_levels SET completed = 1 WHERE id = :levelId AND studentId = :studentId")
  suspend fun markLevelCompleted(studentId: String, levelId: String)

  @Query("SELECT * FROM nyra_tests WHERE studentId = :studentId ORDER BY createdAtEpochMs DESC LIMIT :limit")
  suspend fun getTestsForStudent(studentId: String, limit: Int = 20): List<NyraTestEntity>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun upsertTest(test: NyraTestEntity)

  @Query("UPDATE nyra_tests SET completedScore = :score WHERE id = :testId AND studentId = :studentId")
  suspend fun markTestCompleted(studentId: String, testId: String, score: Int)

  @Query("SELECT * FROM nyra_chat_messages WHERE studentId = :studentId ORDER BY timestampEpochMs ASC")
  suspend fun getChatMessagesForStudent(studentId: String): List<NyraChatMessageEntity>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertChatMessage(message: NyraChatMessageEntity)

  @Query(
    """
    DELETE FROM nyra_chat_messages
    WHERE studentId = :studentId
      AND id NOT IN (
        SELECT id FROM nyra_chat_messages
        WHERE studentId = :studentId
        ORDER BY timestampEpochMs DESC
        LIMIT :keepCount
      )
    """
  )
  suspend fun trimOldChatMessages(studentId: String, keepCount: Int = 24)

  @Query("SELECT * FROM nyra_quota_cache WHERE studentId = :studentId LIMIT 1")
  suspend fun getQuotaCache(studentId: String): NyraQuotaCacheEntity?

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun upsertQuotaCache(quota: NyraQuotaCacheEntity)
}
