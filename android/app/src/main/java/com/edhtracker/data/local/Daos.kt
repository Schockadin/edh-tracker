package com.edhtracker.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface FormatDao {
    @Query("SELECT * FROM formats ORDER BY name")
    fun observeAll(): Flow<List<FormatEntity>>

    @Query("SELECT * FROM formats WHERE dirty = 1")
    suspend fun dirty(): List<FormatEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(rows: List<FormatEntity>)

    @Query("UPDATE formats SET dirty = 0 WHERE uuid IN (:uuids)")
    suspend fun clearDirty(uuids: List<String>)

    @Query("DELETE FROM formats WHERE uuid = :uuid")
    suspend fun deleteByUuid(uuid: String)
}

@Dao
interface DeckDao {
    @Query("SELECT * FROM decks ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<DeckEntity>>

    @Query("SELECT * FROM decks WHERE dirty = 1")
    suspend fun dirty(): List<DeckEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(rows: List<DeckEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertOne(row: DeckEntity)

    @Query("UPDATE decks SET dirty = 0 WHERE uuid IN (:uuids)")
    suspend fun clearDirty(uuids: List<String>)

    @Query("DELETE FROM decks WHERE uuid = :uuid")
    suspend fun deleteByUuid(uuid: String)
}

@Dao
interface GameDao {
    @Query("SELECT * FROM games ORDER BY playedAt DESC")
    fun observeAll(): Flow<List<GameEntity>>

    @Query("SELECT * FROM games WHERE dirty = 1")
    suspend fun dirty(): List<GameEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(rows: List<GameEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertOne(row: GameEntity)

    @Query("UPDATE games SET dirty = 0 WHERE uuid IN (:uuids)")
    suspend fun clearDirty(uuids: List<String>)

    @Query("DELETE FROM games WHERE uuid = :uuid")
    suspend fun deleteByUuid(uuid: String)
}

@Dao
interface OpponentDao {
    @Query("SELECT * FROM opponents")
    fun observeAll(): Flow<List<OpponentEntity>>

    @Query("SELECT * FROM opponents WHERE gameUuid = :gameUuid")
    suspend fun forGame(gameUuid: String): List<OpponentEntity>

    @Query("SELECT * FROM opponents WHERE dirty = 1")
    suspend fun dirty(): List<OpponentEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(rows: List<OpponentEntity>)

    @Query("UPDATE opponents SET dirty = 0 WHERE uuid IN (:uuids)")
    suspend fun clearDirty(uuids: List<String>)

    @Query("DELETE FROM opponents WHERE uuid = :uuid")
    suspend fun deleteByUuid(uuid: String)

    @Query("DELETE FROM opponents WHERE gameUuid = :gameUuid")
    suspend fun deleteForGame(gameUuid: String)
}

@Dao
interface GroupDao {
    @Query("SELECT * FROM player_groups ORDER BY name")
    fun observeAll(): Flow<List<GroupEntity>>

    @Query("SELECT * FROM player_groups WHERE dirty = 1")
    suspend fun dirty(): List<GroupEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(rows: List<GroupEntity>)

    @Query("UPDATE player_groups SET dirty = 0 WHERE uuid IN (:uuids)")
    suspend fun clearDirty(uuids: List<String>)

    @Query("DELETE FROM player_groups WHERE uuid = :uuid")
    suspend fun deleteByUuid(uuid: String)
}

@Dao
interface DeckCardDao {
    @Query("SELECT * FROM deck_cards WHERE deckUuid = :deckUuid ORDER BY name")
    fun observeForDeck(deckUuid: String): Flow<List<DeckCardEntity>>

    @Query("SELECT * FROM deck_cards WHERE dirty = 1")
    suspend fun dirty(): List<DeckCardEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(rows: List<DeckCardEntity>)

    @Query("UPDATE deck_cards SET dirty = 0 WHERE uuid IN (:uuids)")
    suspend fun clearDirty(uuids: List<String>)

    @Query("DELETE FROM deck_cards WHERE uuid = :uuid")
    suspend fun deleteByUuid(uuid: String)

    @Query("SELECT uuid FROM deck_cards WHERE deckUuid = :deckUuid")
    suspend fun uuidsForDeck(deckUuid: String): List<String>

    @Query("DELETE FROM deck_cards WHERE deckUuid = :deckUuid")
    suspend fun deleteForDeck(deckUuid: String)
}

@Dao
interface CollectionCardDao {
    @Query("SELECT * FROM collection_cards ORDER BY name")
    fun observeAll(): Flow<List<CollectionCardEntity>>

    @Query("SELECT * FROM collection_cards WHERE dirty = 1")
    suspend fun dirty(): List<CollectionCardEntity>

    @Query("SELECT * FROM collection_cards WHERE zone = :zone")
    suspend fun forZone(zone: String): List<CollectionCardEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(rows: List<CollectionCardEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertOne(row: CollectionCardEntity)

    @Query("UPDATE collection_cards SET dirty = 0 WHERE uuid IN (:uuids)")
    suspend fun clearDirty(uuids: List<String>)

    @Query("DELETE FROM collection_cards WHERE uuid = :uuid")
    suspend fun deleteByUuid(uuid: String)
}

@Dao
interface PendingDeletionDao {
    @Query("SELECT * FROM pending_deletions")
    suspend fun all(): List<PendingDeletionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun add(row: PendingDeletionEntity)

    @Query("DELETE FROM pending_deletions")
    suspend fun clear()
}
