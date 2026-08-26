package com.edhtracker.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Local mirror of the server tables. Every row is keyed by its portable `uuid`
 * and carries a `dirty` flag: rows changed locally and not yet pushed are
 * dirty; sync clears the flag once the server has them.
 */

@Entity(tableName = "formats")
data class FormatEntity(
    @PrimaryKey val uuid: String,
    val name: String,
    val constructionType: String,
    val multiplayer: Boolean,
    val hasCommander: Boolean,
    val createdAt: String,
    val updatedAt: String,
    val dirty: Boolean = false,
)

@Entity(tableName = "decks")
data class DeckEntity(
    @PrimaryKey val uuid: String,
    val name: String,
    val commander: String?,
    val partnerCommander: String?,
    val formatUuid: String,
    val theme: String?,
    val platform: String,
    val url: String,
    val colorIdentity: List<String>,
    val commanderImage: String?,
    val partnerImage: String?,
    val bracket: Int?,
    val archived: Boolean,
    val createdAt: String,
    val updatedAt: String,
    val dirty: Boolean = false,
)

@Entity(tableName = "games")
data class GameEntity(
    @PrimaryKey val uuid: String,
    val deckUuid: String,
    val playedAt: String,
    val bracket: Int?,
    val turnCount: Int?,
    val winnerType: String,
    val winnerOpponentUuid: String?,
    val winTurn: Int?,
    val winType: String?,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String,
    val dirty: Boolean = false,
)

@Entity(tableName = "opponents")
data class OpponentEntity(
    @PrimaryKey val uuid: String,
    val gameUuid: String,
    val playerName: String?,
    val commander: String?,
    val partnerCommander: String?,
    val theme: String?,
    val createdAt: String,
    val updatedAt: String,
    val dirty: Boolean = false,
)

@Entity(tableName = "player_groups")
data class GroupEntity(
    @PrimaryKey val uuid: String,
    val name: String,
    val playerNames: List<String>,
    val createdAt: String,
    val updatedAt: String,
    val dirty: Boolean = false,
)

/** A local deletion awaiting push to the server. */
@Entity(tableName = "pending_deletions", primaryKeys = ["tableName", "uuid"])
data class PendingDeletionEntity(
    val tableName: String,
    val uuid: String,
)
