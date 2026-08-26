package com.edhtracker.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.edhtracker.EdhApp
import com.edhtracker.data.SyncRepository
import com.edhtracker.data.local.CollectionCardEntity
import com.edhtracker.data.local.DeckCardEntity
import com.edhtracker.data.local.DeckEntity
import com.edhtracker.data.local.FormatEntity
import com.edhtracker.data.local.GameEntity
import com.edhtracker.data.local.OpponentEntity
import kotlinx.coroutines.flow.Flow
import com.edhtracker.sync.SyncScheduler
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/** Single view model backing every screen; state comes from the local DB. */
class AppViewModel(app: Application) : AndroidViewModel(app) {
    private val repo: SyncRepository = (app as EdhApp).repository
    private val settings = (app as EdhApp).settings

    val isLoggedIn: StateFlow<Boolean> =
        settings.isLoggedInFlow.stateIn(viewModelScope, SharingStarted.Eagerly, false)
    val baseUrl: StateFlow<String> =
        settings.baseUrlFlow.stateIn(viewModelScope, SharingStarted.Eagerly, "")
    val lastSync: StateFlow<String> =
        settings.lastSyncFlow.stateIn(viewModelScope, SharingStarted.Eagerly, "")

    val formats: StateFlow<List<FormatEntity>> =
        repo.formats.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val decks: StateFlow<List<DeckEntity>> =
        repo.decks.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val games: StateFlow<List<GameEntity>> =
        repo.games.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val opponents: StateFlow<List<OpponentEntity>> =
        repo.opponents.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val collection: StateFlow<List<CollectionCardEntity>> =
        repo.collection.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val allDeckCards: StateFlow<List<DeckCardEntity>> =
        repo.allDeckCards.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun deckCards(deckUuid: String): Flow<List<DeckCardEntity>> = repo.deckCards(deckUuid)

    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    fun consumeMessage() { _message.value = null }

    fun login(baseUrl: String, password: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            _busy.value = true
            val result = repo.login(baseUrl.trim(), password)
            if (result.isSuccess) {
                // Initial full sync right after login.
                repo.sync()
                _message.value = "Angemeldet und synchronisiert."
            } else {
                _message.value = "Anmeldung fehlgeschlagen. URL & Passwort prüfen."
            }
            _busy.value = false
            onDone(result.isSuccess)
        }
    }

    fun syncNow() {
        viewModelScope.launch {
            _busy.value = true
            val result = repo.sync()
            _message.value =
                if (result.isSuccess) "Sync abgeschlossen." else "Sync fehlgeschlagen."
            _busy.value = false
            // Also enqueue a background attempt in case of transient failure.
            SyncScheduler.syncNow(getApplication())
        }
    }

    fun addGame(
        deckUuid: String,
        winnerType: String,
        bracket: Int?,
        turnCount: Int?,
        winTurn: Int?,
        winType: String?,
        notes: String?,
        opponents: List<SyncRepository.OpponentDraft>,
        winnerOpponentIndex: Int?,
        onDone: () -> Unit,
    ) {
        viewModelScope.launch {
            repo.addGame(
                deckUuid, winnerType, bracket, turnCount, winTurn, winType, notes,
                opponents, winnerOpponentIndex,
            )
            _message.value = "Spiel gespeichert."
            onDone()
        }
    }

    fun deleteGame(gameUuid: String) {
        viewModelScope.launch { repo.deleteGame(gameUuid) }
    }

    fun addDeck(
        name: String,
        commander: String?,
        formatUuid: String,
        url: String?,
        platform: String,
        theme: String?,
        bracket: Int?,
        onDone: () -> Unit,
    ) {
        viewModelScope.launch {
            repo.addDeck(name, commander, formatUuid, url, platform, theme, bracket)
            _message.value = "Deck gespeichert."
            onDone()
        }
    }

    fun importDeckList(deckUuid: String, content: String) {
        viewModelScope.launch {
            _busy.value = true
            val result = repo.importDeckList(deckUuid, content)
            _message.value = result.fold(
                onSuccess = { importSummary(it) },
                onFailure = { "Import fehlgeschlagen (Server erreichbar?)." },
            )
            _busy.value = false
        }
    }

    fun importCollection(content: String) {
        viewModelScope.launch {
            _busy.value = true
            val result = repo.importCollection(content)
            _message.value = result.fold(
                onSuccess = { importSummary(it) },
                onFailure = { "Import fehlgeschlagen (Server erreichbar?)." },
            )
            _busy.value = false
        }
    }

    private fun importSummary(r: SyncRepository.ImportResult): String {
        val base = "${r.added} Karten importiert."
        return if (r.unresolved.isEmpty()) base
        else "$base ${r.unresolved.size} nicht gefunden."
    }

    fun deleteCollectionCard(uuid: String) {
        viewModelScope.launch { repo.deleteCollectionCard(uuid) }
    }

    fun logout() {
        viewModelScope.launch { repo.logout() }
    }
}
