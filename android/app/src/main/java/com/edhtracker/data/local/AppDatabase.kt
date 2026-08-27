package com.edhtracker.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [
        FormatEntity::class,
        DeckEntity::class,
        GameEntity::class,
        OpponentEntity::class,
        GroupEntity::class,
        DeckCardEntity::class,
        CollectionCardEntity::class,
        PendingDeletionEntity::class,
    ],
    version = 2,
    exportSchema = false,
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun formatDao(): FormatDao
    abstract fun deckDao(): DeckDao
    abstract fun gameDao(): GameDao
    abstract fun opponentDao(): OpponentDao
    abstract fun groupDao(): GroupDao
    abstract fun deckCardDao(): DeckCardDao
    abstract fun collectionCardDao(): CollectionCardDao
    abstract fun pendingDeletionDao(): PendingDeletionDao

    companion object {
        fun build(context: Context): AppDatabase =
            Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "edh-tracker.db",
            ).fallbackToDestructiveMigration().build()
    }
}
