package com.edhtracker.data

import android.util.Log
import androidx.room.withTransaction
import com.edhtracker.data.local.AppDatabase
import com.edhtracker.data.local.CollectionCardEntity
import com.edhtracker.data.local.DeckCardEntity
import com.edhtracker.data.local.DeckEntity
import com.edhtracker.data.local.FormatEntity
import com.edhtracker.data.local.GameEntity
import com.edhtracker.data.local.GroupEntity
import com.edhtracker.data.local.OpponentEntity
import com.edhtracker.data.local.PendingDeletionEntity
import com.edhtracker.data.remote.ApiFactory
import com.edhtracker.data.remote.CardImportRequest
import com.edhtracker.data.remote.LoginRequest
import com.edhtracker.data.remote.PushRequest
import com.edhtracker.data.remote.ResolvedCardDto
import com.edhtracker.data.remote.SyncCollectionCardDto
import com.edhtracker.data.remote.SyncDeckCardDto
import com.edhtracker.data.remote.SyncDeckDto
import com.edhtracker.data.remote.SyncDeletionDto
import com.edhtracker.data.remote.SyncFormatDto
import com.edhtracker.data.remote.SyncGameDto
import com.edhtracker.data.remote.SyncGroupDto
import com.edhtracker.data.remote.SyncOpponentDto
import kotlinx.coroutines.flow.Flow
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
    private val deckCardDao = db.deckCardDao()
    private val collectionDao = db.collectionCardDao()
    private val deletionDao = db.pendingDeletionDao()

    // --- Observed streams for the UI -------------------------------------

    val formats = formatDao.observeAll()
    val decks = deckDao.observeAll()
    val games = gameDao.observeAll()
    val opponents = opponentDao.observeAll()
    val groups = groupDao.observeAll()
    val collection = collectionDao.observeAll()

    fun deckCards(deckUuid: String): Flow<List<DeckCardEntity>> =
        deckCardDao.observeForDeck(deckUuid)

    /** Result of a card import: how many were added and which names failed. */
    data class ImportResult(val added: Int, val unresolved: List<String>)

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
        url: String?,
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

    // --- Card imports (resolved server-side via Scryfall) ----------------

    private suspend fun resolve(content: String) =
        ApiFactory.create(settings.baseUrl())
            .importCards("Bearer ${settings.token()}", CardImportRequest(content))

    /** Replace a deck's card list from pasted/uploaded text. */
    suspend fun importDeckList(deckUuid: String, content: String): Result<ImportResult> =
        runCatching {
            val response = resolve(content)
            val resolved = response.resolved
            val now = now()
            db.withTransaction {
                // Tombstone the old cards so the server drops them too, then insert.
                for (old in deckCardDao.uuidsForDeck(deckUuid)) {
                    deletionDao.add(PendingDeletionEntity("deck_cards", old))
                }
                deckCardDao.deleteForDeck(deckUuid)
                deckCardDao.upsert(
                    resolved.map { it.toDeckCard(deckUuid, now) },
                )
            }
            ImportResult(resolved.size, response.unresolved)
        }.onFailure { Log.w(TAG, "deck import failed", it) }

    /** Add pasted/uploaded cards to the collection with the given zone. */
    suspend fun importCollection(content: String, zone: String): Result<ImportResult> =
        runCatching {
            val response = resolve(content)
            val resolved = response.resolved
            val now = now()
            db.withTransaction {
                val existing = collectionDao.forZone(zone)
                    .associateBy { it.name.lowercase() }
                for (c in resolved) {
                    val found = existing[c.name.lowercase()]
                    if (found != null) {
                        collectionDao.upsertOne(
                            found.copy(
                                quantity = found.quantity + c.quantity,
                                updatedAt = now,
                                dirty = true,
                            ),
                        )
                    } else {
                        collectionDao.upsertOne(c.toCollectionCard(zone, now))
                    }
                }
            }
            ImportResult(resolved.size, response.unresolved)
        }.onFailure { Log.w(TAG, "collection import failed", it) }

    suspend fun setCollectionZone(card: CollectionCardEntity, zone: String) {
        val updated = card.copy(
            zone = zone,
            deckUuid = if (zone == "free") null else card.deckUuid,
            updatedAt = now(),
            dirty = true,
        )
        db.withTransaction { collectionDao.upsertOne(updated) }
    }

    suspend fun deleteCollectionCard(uuid: String) {
        db.withTransaction {
            collectionDao.deleteByUuid(uuid)
            deletionDao.add(PendingDeletionEntity("collection_cards", uuid))
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
        val dirtyDeckCards = deckCardDao.dirty()
        val dirtyCollection = collectionDao.dirty()
        val deletions = deletionDao.all()

        val hasOutbound = dirtyFormats.isNotEmpty() || dirtyDecks.isNotEmpty() ||
            dirtyGames.isNotEmpty() || dirtyOpps.isNotEmpty() ||
            dirtyGroups.isNotEmpty() || dirtyDeckCards.isNotEmpty() ||
            dirtyCollection.isNotEmpty() || deletions.isNotEmpty()

        if (hasOutbound) {
            api.push(
                auth,
                PushRequest(
                    formats = dirtyFormats.map { it.toDto() },
                    decks = dirtyDecks.map { it.toDto() },
                    games = dirtyGames.map { it.toDto() },
                    opponents = dirtyOpps.map { it.toDto() },
                    groups = dirtyGroups.map { it.toDto() },
                    deckCards = dirtyDeckCards.map { it.toDto() },
                    collectionCards = dirtyCollection.map { it.toDto() },
                    deletions = deletions.map { SyncDeletionDto(it.tableName, it.uuid) },
                ),
            )
            db.withTransaction {
                formatDao.clearDirty(dirtyFormats.map { it.uuid })
                deckDao.clearDirty(dirtyDecks.map { it.uuid })
                gameDao.clearDirty(dirtyGames.map { it.uuid })
                opponentDao.clearDirty(dirtyOpps.map { it.uuid })
                groupDao.clearDirty(dirtyGroups.map { it.uuid })
                deckCardDao.clearDirty(dirtyDeckCards.map { it.uuid })
                collectionDao.clearDirty(dirtyCollection.map { it.uuid })
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
            if (resp.deckCards.isNotEmpty()) {
                deckCardDao.upsert(resp.deckCards.map { it.toEntity() })
            }
            if (resp.collectionCards.isNotEmpty()) {
                collectionDao.upsert(resp.collectionCards.map { it.toEntity() })
            }
            for (del in resp.deletions) {
                when (del.table) {
                    "decks" -> deckDao.deleteByUuid(del.uuid)
                    "games" -> gameDao.deleteByUuid(del.uuid)
                    "game_opponents" -> opponentDao.deleteByUuid(del.uuid)
                    "formats" -> formatDao.deleteByUuid(del.uuid)
                    "player_groups" -> groupDao.deleteByUuid(del.uuid)
                    "deck_cards" -> deckCardDao.deleteByUuid(del.uuid)
                    "collection_cards" -> collectionDao.deleteByUuid(del.uuid)
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

private fun DeckCardEntity.toDto() = SyncDeckCardDto(
    uuid, deckUuid, name, quantity, scryfallId, setCode, collectorNumber,
    manaValue, typeLine, colorIdentity, imageUrl, rarity, createdAt, updatedAt,
)

private fun SyncDeckCardDto.toEntity() = DeckCardEntity(
    uuid, deckUuid, name, quantity, scryfallId, setCode, collectorNumber,
    manaValue, typeLine, colorIdentity, imageUrl, rarity, createdAt, updatedAt,
    dirty = false,
)

private fun CollectionCardEntity.toDto() = SyncCollectionCardDto(
    uuid, name, quantity, zone, deckUuid, scryfallId, setCode, collectorNumber,
    manaValue, typeLine, colorIdentity, imageUrl, rarity, createdAt, updatedAt,
)

private fun SyncCollectionCardDto.toEntity() = CollectionCardEntity(
    uuid, name, quantity, zone, deckUuid, scryfallId, setCode, collectorNumber,
    manaValue, typeLine, colorIdentity, imageUrl, rarity, createdAt, updatedAt,
    dirty = false,
)

private fun ResolvedCardDto.toDeckCard(deckUuid: String, now: String) = DeckCardEntity(
    uuid = UUID.randomUUID().toString(),
    deckUuid = deckUuid,
    name = name,
    quantity = quantity,
    scryfallId = scryfallId,
    setCode = setCode,
    collectorNumber = collectorNumber,
    manaValue = manaValue,
    typeLine = typeLine,
    colorIdentity = colorIdentity,
    imageUrl = imageUrl,
    rarity = rarity,
    createdAt = now,
    updatedAt = now,
    dirty = true,
)

private fun ResolvedCardDto.toCollectionCard(zone: String, now: String) = CollectionCardEntity(
    uuid = UUID.randomUUID().toString(),
    name = name,
    quantity = quantity,
    zone = zone,
    deckUuid = null,
    scryfallId = scryfallId,
    setCode = setCode,
    collectorNumber = collectorNumber,
    manaValue = manaValue,
    typeLine = typeLine,
    colorIdentity = colorIdentity,
    imageUrl = imageUrl,
    rarity = rarity,
    createdAt = now,
    updatedAt = now,
    dirty = true,
)
