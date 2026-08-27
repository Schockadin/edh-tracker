package com.edhtracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.edhtracker.data.local.DeckEntity
import com.edhtracker.ui.AppViewModel

private data class DeckStat(
    val games: Int,
    val wins: Int,
    val winRate: Float,
    val lastPlayed: String?,
)

private val SORT_KEYS = listOf("name", "lastPlayed", "winRate")
private val SORT_LABELS = mapOf(
    "name" to "Name",
    "lastPlayed" to "Zuletzt gespielt",
    "winRate" to "Win-Rate",
)
private val BRACKETS = listOf("all", "1", "2", "3", "4", "5", "none")
private fun bracketLabel(b: String) = when (b) {
    "all" -> "Alle Brackets"
    "none" -> "Ohne Bracket"
    else -> "Bracket $b"
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DecksScreen(
    vm: AppViewModel,
    onAddDeck: () -> Unit,
    onOpenDeck: (String) -> Unit,
) {
    val decks by vm.decks.collectAsStateWithLifecycle()
    val formats by vm.formats.collectAsStateWithLifecycle()
    val games by vm.games.collectAsStateWithLifecycle()
    val formatName = formats.associate { it.uuid to it.name }

    // Per-deck stats derived from games (ISO timestamps compare lexicographically).
    val statByDeck = remember(games) {
        games.groupBy { it.deckUuid }.mapValues { (_, gs) ->
            val total = gs.size
            val wins = gs.count { it.winnerType == "me" }
            DeckStat(
                games = total,
                wins = wins,
                winRate = if (total > 0) wins.toFloat() / total else 0f,
                lastPlayed = gs.maxOfOrNull { it.playedAt },
            )
        }
    }

    var formatFilter by remember { mutableStateOf("all") } // "all" or a format uuid
    var sort by remember { mutableStateOf("name") }
    var bracket by remember { mutableStateOf("all") }

    fun matches(d: DeckEntity): Boolean {
        if (formatFilter != "all" && d.formatUuid != formatFilter) return false
        return when (bracket) {
            "all" -> true
            "none" -> d.bracket == null
            else -> d.bracket?.toString() == bracket
        }
    }

    fun sorted(list: List<DeckEntity>): List<DeckEntity> = when (sort) {
        "winRate" -> list.sortedWith(
            compareByDescending<DeckEntity> { statByDeck[it.uuid]?.winRate ?: 0f }
                .thenByDescending { statByDeck[it.uuid]?.games ?: 0 }
                .thenBy { it.name.lowercase() },
        )
        "lastPlayed" -> list.sortedWith(
            // Played decks first (newest), never-played last, then by name.
            compareByDescending<DeckEntity> { statByDeck[it.uuid]?.lastPlayed ?: "" }
                .thenBy { it.name.lowercase() },
        )
        else -> list.sortedBy { it.name.lowercase() }
    }

    val filtered = decks.filter(::matches)
    val active = sorted(filtered.filter { !it.archived })
    val archived = sorted(filtered.filter { it.archived })

    Scaffold(
        topBar = { TopAppBar(title = { Text("Decks") }) },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddDeck) {
                Icon(Icons.Filled.Add, contentDescription = "Deck hinzufügen")
            }
        },
    ) { padding ->
        if (decks.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Noch keine Decks. Lege eins an oder synchronisiere.")
            }
            return@Scaffold
        }
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            item(key = "controls") {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    DropdownField(
                        label = "Format",
                        options = listOf("all") + formats.map { it.uuid },
                        selected = formatFilter,
                        optionLabel = { if (it == "all") "Alle Formate" else formatName[it] ?: "Format" },
                        onSelect = { formatFilter = it },
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        DropdownField(
                            label = "Sortierung",
                            options = SORT_KEYS,
                            selected = sort,
                            optionLabel = { SORT_LABELS[it] ?: it },
                            onSelect = { sort = it },
                            modifier = Modifier.weight(1f),
                        )
                        DropdownField(
                            label = "Bracket",
                            options = BRACKETS,
                            selected = bracket,
                            optionLabel = { bracketLabel(it) },
                            onSelect = { bracket = it },
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }

            if (active.isEmpty()) {
                item(key = "empty") {
                    Text(
                        "Keine Decks für diese Filter.",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(vertical = 8.dp),
                    )
                }
            }
            items(active, key = { it.uuid }) { deck ->
                DeckCard(deck, formatName[deck.formatUuid], statByDeck[deck.uuid], onOpenDeck)
            }

            if (archived.isNotEmpty()) {
                item(key = "archived-header") {
                    Text(
                        "Archiviert",
                        style = MaterialTheme.typography.labelLarge,
                        modifier = Modifier.padding(top = 12.dp, bottom = 2.dp),
                    )
                }
                items(archived, key = { it.uuid }) { deck ->
                    DeckCard(deck, formatName[deck.formatUuid], statByDeck[deck.uuid], onOpenDeck)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DeckCard(
    deck: DeckEntity,
    formatName: String?,
    stat: DeckStat?,
    onOpenDeck: (String) -> Unit,
) {
    Card(onClick = { onOpenDeck(deck.uuid) }) {
        Column(Modifier.fillMaxWidth().padding(12.dp)) {
            Text(
                deck.name,
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.titleMedium,
            )
            val subtitle = buildString {
                (deck.commander ?: deck.theme)?.let { append(it); append("  •  ") }
                append(formatName ?: "Format")
                if (deck.colorIdentity.isNotEmpty()) {
                    append("  •  ")
                    append(deck.colorIdentity.joinToString(""))
                }
            }
            Text(subtitle, style = MaterialTheme.typography.bodySmall)
            val statsLine = buildString {
                val g = stat?.games ?: 0
                val wr = ((stat?.winRate ?: 0f) * 100).toInt()
                append("$g Spiele · $wr% WR")
                deck.bracket?.let { append("  •  Bracket $it") }
            }
            Text(
                statsLine,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 2.dp),
            )
        }
    }
}
