package com.edhtracker.data.remote

/** Wire DTOs mirroring the Next.js `/api/sync` contract (see `lib/sync-types`). */

data class LoginRequest(val password: String)

data class LoginResponse(val token: String, val expiresInDays: Int)

data class SyncFormatDto(
    val uuid: String,
    val name: String,
    val constructionType: String,
    val multiplayer: Boolean,
    val hasCommander: Boolean,
    val createdAt: String,
    val updatedAt: String,
)

data class SyncDeckDto(
    val uuid: String,
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
)

data class SyncGameDto(
    val uuid: String,
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
)

data class SyncOpponentDto(
    val uuid: String,
    val gameUuid: String,
    val playerName: String?,
    val commander: String?,
    val partnerCommander: String?,
    val theme: String?,
    val createdAt: String,
    val updatedAt: String,
)

data class SyncGroupDto(
    val uuid: String,
    val name: String,
    val playerNames: List<String>,
    val createdAt: String,
    val updatedAt: String,
)

data class SyncDeletionDto(
    val table: String,
    val uuid: String,
    val deletedAt: String? = null,
)

data class PullResponse(
    val serverTime: String,
    val formats: List<SyncFormatDto> = emptyList(),
    val decks: List<SyncDeckDto> = emptyList(),
    val games: List<SyncGameDto> = emptyList(),
    val opponents: List<SyncOpponentDto> = emptyList(),
    val groups: List<SyncGroupDto> = emptyList(),
    val deletions: List<SyncDeletionDto> = emptyList(),
)

data class PushRequest(
    val formats: List<SyncFormatDto> = emptyList(),
    val decks: List<SyncDeckDto> = emptyList(),
    val games: List<SyncGameDto> = emptyList(),
    val opponents: List<SyncOpponentDto> = emptyList(),
    val groups: List<SyncGroupDto> = emptyList(),
    val deletions: List<SyncDeletionDto> = emptyList(),
)

data class PushResponse(
    val ok: Boolean = true,
    val serverTime: String? = null,
)
