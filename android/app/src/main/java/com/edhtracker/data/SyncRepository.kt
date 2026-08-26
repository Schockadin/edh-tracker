package com.edhtracker.data

import android.util.Log
import androidx.room.withTransaction
import com.edhtracker.data.local.AppDatabase
import com.edhtracker.data.local.DeckEntity
import com.edhtracker.data.local.FormatEntity
import com.edhtracker.data.local.GameEntity
import com.edhtracker.data.local.GroupEntity
import com.edhtracker.data.local.OpponentEntity
import com.edhtracker.data.local.PendingDeletionEntity
import com.edhtracker.data.remote.ApiFactory
import com.edhtracker.data.remote.LoginRequest
import com.edhtracker.data.remote.PushRequest
import com.edhtracker.data.remote.SyncDeckDto
import com.edhtracker.data.remote.SyncDeletionDto
import com.edhtracker.data.remote.SyncFormatDto
import com.edhtracker.data.remote.SyncGameDto
import com.edhtracker.data.remote.SyncGroupDto
import com.edhtracker.data.remote.SyncOpponentDto
import java.time.Instant
import java.util.UUID

/** Local-first data access + bidirectional sync with the Next.js server. */
class SyncRepository(
    private val db: AppDatabase,
    private val settings: SettingsStore,
) {
    private val formatDao = db.formatDao()
    private val deckDao = db.deckDao()
    private val gameDao = db.gameDao()
    private val opponentDao = db.opponentDao()
    private val groupDao = db.groupDao()
    private val deletionDao = db.pendingDeletionDao()

    // --- Observed streams for the UI -------------------------------------

    val formats = formatDao.observeAll()
    val decks = deckDao.observeAll()
    val games = gameDao.observeAll()
    val opponents = opponentDao.observeAll()
    val groups = groupDao.observeAll()

    // --- Auth ------------------------------------------------------------

    suspend fun login(baseUrl: String, password: String): Result<Unit> =
        runCatching {
            val api = ApiFactory.create(baseUrl)
            val resp = api.login(LoginRequest(password))
            settings.saveSession(baseUrl.trim(), resp.token)
        }.onFailure { Log.w(TAG, "login failed", it) }

    suspend fun logout() = settings.logout()

    // --- Mutations (write locally + mark dirty, sync pushes later) --------

    /** Creates a new deck locally (full deck editing with Scryfall is web-only). */
    suspend fun addDeck(
        name: String,
        commander: String?,
        formatUuid: String,
        url: String,
        platform: String,
        theme: String?,
        bracket: Int?,
    ) {
        val now = now()
        val entity = DeckEntity(
            uuid = UUID.randomUUID().toString(),
            name = name,
            commander = commander,
            partnerCommander = null,
            formatUuid = formatUuid,
            theme = theme,
            platform = platform,
            url = url,
            colorIdentity = emptyList(),
            commanderImage = null,
            partnerImage = null,
            bracket = bracket,
            archived = false,
            createdAt = now,
            updatedAt = now,
            dirty = true,
        )
        db.withTransaction { deckDao.upsertOne(entity) }
    }

    suspend fun addGame(
        deckUuid: String,
        winnerType: String,
        bracket: Int?,
        turnCount: Int?,
        winTurn: Int?,
        winType: String?,
        notes: String?,
        opponents: List<OpponentDraft>,
        winnerOpponentIndex: Int?,
    ) {
        val now = now()
        val gameUuid = UUID.randomUUID().toString()
        val oppEntities = opponents.map {
            OpponentEntity(
                uuid = UUID.randomUUID().toString(),
                gameUuid = gameUuid,
                playerName = it.playerName,
                commander = it.commander,
                partnerCommander = null,
                theme = it.theme,
                createdAt = now,
                updatedAt = now,
                dirty = true,
            )
        }
        val winnerUuid = winnerOpponentIndex
            ?.takeIf { winnerType == "opponent" && it in oppEntities.indices }
            ?.let { oppEntities[it].uuid }

        val game = GameEntity(
            uuid = gameUuid,
            deckUuid = deckUuid,
            playedAt = now,
            bracket = bracket,
            turnCount = turnCount,
            winnerType = winnerType,
            winnerOpponentUuid = winnerUuid,
            winTurn = winTurn,
            winType = winType,
            notes = notes,
            createdAt = now,
            updatedAt = now,
            dirty = true,
        )
        db.withTransaction {
            gameDao.upsertOne(game)
            if (oppEntities.isNotEmpty()) opponentDao.upsert(oppEntities)
        }
    }

    suspend fun deleteGame(gameUuid: String) {
        db.withTransaction {
            opponentDao.deleteForGame(gameUuid)
            gameDao.deleteByUuid(gameUuid)
            // The server cascade-deletes opponents; we only need to push the game.
            deletionDao.add(PendingDeletionEntity("games", gameUuid))
        }
    }

    // --- Sync ------------------------------------------------------------

    suspend fun sync(): Result<Unit> = runCatching {
        val baseUrl = settings.baseUrl()
        val token = settings.token()
        require(baseUrl.isNotEmpty() && token.isNotEmpty()) { "Not logged in" }
        val api = ApiFactory.create(baseUrl)
        val auth = "Bearer $token"

        // 1. Push local changes first so the server has our latest.
        val dirtyFormats = formatDao.dirty()
        val dirtyDecks = deckDao.dirty()
        val dirtyGames = gameDao.dirty()
        val dirtyOpps = opponentDao.dirty()
        val dirtyGroups = groupDao.dirty()
        val deletions = deletionDao.all()

        val hasOutbound = dirtyFormats.isNotEmpty() || dirtyDecks.isNotEmpty() ||
            dirtyGames.isNotEmpty() || dirtyOpps.isNotEmpty() ||
            dirtyGroups.isNotEmpty() || deletions.isNotEmpty()

        if (hasOutbound) {
            api.push(
                auth,
                PushRequest(
                    formats = dirtyFormats.map { it.toDto() },
                    decks = dirtyDecks.map { it.toDto() },
                    games = dirtyGames.map { it.toDto() },
                    opponents = dirtyOpps.map { it.toDto() },
                    groups = dirtyGroups.map { it.toDto() },
                    deletions = deletions.map { SyncDeletionDto(it.tableName, it.uuid) },
                ),
            )
            db.withTransaction {
                formatDao.clearDirty(dirtyFormats.map { it.uuid })
                deckDao.clearDirty(dirtyDecks.map { it.uuid })
                gameDao.clearDirty(dirtyGames.map { it.uuid })
                opponentDao.clearDirty(dirtyOpps.map { it.uuid })
                groupDao.clearDirty(dirtyGroups.map { it.uuid })
                deletionDao.clear()
            }
        }

        // 2. Pull server changes since the last cursor and apply them.
        val since = settings.cursor()
        val resp = api.pull(auth, since)
        db.withTransaction {
            if (resp.formats.isNotEmpty()) {
                formatDao.upsert(resp.formats.map { it.toEntity() })
            }
            if (resp.decks.isNotEmpty()) {
                deckDao.upsert(resp.decks.map { it.toEntity() })
            }
            if (resp.games.isNotEmpty()) {
                gameDao.upsert(resp.games.map { it.toEntity() })
            }
            if (resp.opponents.isNotEmpty()) {
                opponentDao.upsert(resp.opponents.map { it.toEntity() })
            }
            if (resp.groups.isNotEmpty()) {
                groupDao.upsert(resp.groups.map { it.toEntity() })
            }
            for (del in resp.deletions) {
                when (del.table) {
                    "decks" -> deckDao.deleteByUuid(del.uuid)
                    "games" -> gameDao.deleteByUuid(del.uuid)
                    "game_opponents" -> opponentDao.deleteByUuid(del.uuid)
                    "formats" -> formatDao.deleteByUuid(del.uuid)
                    "player_groups" -> groupDao.deleteByUuid(del.uuid)
                }
            }
        }
        settings.setCursor(resp.serverTime)
        settings.setLastSync(now())
    }.onFailure { Log.w(TAG, "sync failed", it) }

    private fun now(): String = Instant.now().toString()

    data class OpponentDraft(
        val playerName: String?,
        val commander: String?,
        val theme: String?,
    )

    private companion object {
        const val TAG = "SyncRepository"
    }
}

// --- Mappers ----------------------------------------------------------------

private fun FormatEntity.toDto() = SyncFormatDto(
    uuid, name, constructionType, multiplayer, hasCommander, createdAt, updatedAt,
)

private fun SyncFormatDto.toEntity() = FormatEntity(
    uuid, name, constructionType, multiplayer, hasCommander, createdAt, updatedAt,
    dirty = false,
)

private fun DeckEntity.toDto() = SyncDeckDto(
    uuid, name, commander, partnerCommander, formatUuid, theme, platform, url,
    colorIdentity, commanderImage, partnerImage, bracket, archived, createdAt, updatedAt,
)

private fun SyncDeckDto.toEntity() = DeckEntity(
    uuid, name, commander, partnerCommander, formatUuid, theme, platform, url,
    colorIdentity, commanderImage, partnerImage, bracket, archived, createdAt, updatedAt,
    dirty = false,
)

private fun GameEntity.toDto() = SyncGameDto(
    uuid, deckUuid, playedAt, bracket, turnCount, winnerType, winnerOpponentUuid,
    winTurn, winType, notes, createdAt, updatedAt,
)

private fun SyncGameDto.toEntity() = GameEntity(
    uuid, deckUuid, playedAt, bracket, turnCount, winnerType, winnerOpponentUuid,
    winTurn, winType, notes, createdAt, updatedAt, dirty = false,
)

private fun OpponentEntity.toDto() = SyncOpponentDto(
    uuid, gameUuid, playerName, commander, partnerCommander, theme, createdAt, updatedAt,
)

private fun SyncOpponentDto.toEntity() = OpponentEntity(
    uuid, gameUuid, playerName, commander, partnerCommander, theme, createdAt, updatedAt,
    dirty = false,
)

private fun GroupEntity.toDto() = SyncGroupDto(
    uuid, name, playerNames, createdAt, updatedAt,
)

private fun SyncGroupDto.toEntity() = GroupEntity(
    uuid, name, playerNames, createdAt, updatedAt, dirty = false,
)
