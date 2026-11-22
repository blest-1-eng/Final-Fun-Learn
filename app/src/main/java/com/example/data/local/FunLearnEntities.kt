package com.example.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "student_profiles")
data class StudentProfileEntity(
  @PrimaryKey val id: String,
  val name: String,
  val avatarEmoji: String,
  val classAge: Int,
  val createdAtEpochMs: Long,
)

@Entity(tableName = "test_results")
data class TestResultEntity(
  @PrimaryKey val id: String,
  val studentId: String,
  val classAge: Int,
  val className: String,
  val mode: String,
  val subject: String,
  val topic: String,
  val score: Int,
  val wrongCount: Int,
  val wrongTopicsJson: String,
  val timestampEpochMs: Long,
  val dateLabel: String,
)

@Entity(tableName = "nyra_levels")
data class NyraLevelEntity(
  @PrimaryKey val id: String,
  val studentId: String,
  val classAge: Int,
  val subject: String,
  val topic: String,
  val difficulty: String,
  val completed: Boolean,
  val levelJson: String,
  val createdAtEpochMs: Long,
)

@Entity(tableName = "nyra_tests")
data class NyraTestEntity(
  @PrimaryKey val id: String,
  val studentId: String,
  val classAge: Int,
  val subject: String,
  val topic: String,
  val linkedLevelId: String?,
  val completedScore: Int?,
  val testJson: String,
  val createdAtEpochMs: Long,
)

@Entity(tableName = "nyra_chat_messages")
data class NyraChatMessageEntity(
  @PrimaryKey val id: String,
  val studentId: String,
  val role: String,
  val content: String,
  val source: String,
  val timestampEpochMs: Long,
)

@Entity(tableName = "nyra_quota_cache")
data class NyraQuotaCacheEntity(
  @PrimaryKey val studentId: String,
  val userUsedToday: Int,
  val userDailyLimit: Int,
  val userRemainingToday: Int,
  val cooldownActive: Boolean,
  val message: String,
  val updatedAtEpochMs: Long,
)
