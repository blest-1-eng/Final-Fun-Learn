package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
  entities = [
    StudentProfileEntity::class,
    TestResultEntity::class,
    NyraLevelEntity::class,
    NyraTestEntity::class,
    NyraChatMessageEntity::class,
    NyraQuotaCacheEntity::class,
  ],
  version = 1,
  exportSchema = false,
)
abstract class FunLearnDatabase : RoomDatabase() {
  abstract fun funLearnDao(): FunLearnDao

  companion object {
    @Volatile
    private var instance: FunLearnDatabase? = null

    fun getInstance(context: Context): FunLearnDatabase {
      return instance ?: synchronized(this) {
        instance ?: Room.databaseBuilder(
          context.applicationContext,
          FunLearnDatabase::class.java,
          "fun_learn_nyra.db",
        )
          .fallbackToDestructiveMigration(dropAllTables = false)
          .build()
          .also { instance = it }
      }
    }
  }
}
