package com.edhtracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.edhtracker.ui.AppViewModel
import com.edhtracker.ui.WINNER_TYPE_LABELS
import com.edhtracker.ui.WIN_TYPE_LABELS
import com.edhtracker.ui.shortDate

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GamesScreen(
    vm: AppViewModel,
    onAddGame: () -> Unit,
    onEditGame: (String) -> Unit,
) {
    val games by vm.games.collectAsStateWithLifecycle()
    val decks by vm.decks.collectAsStateWithLifecycle()
    val deckName = decks.associate { it.uuid to it.name }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Spiele") }) },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddGame) {
                Icon(Icons.Filled.Add, contentDescription = "Spiel hinzufügen")
            }
        },
    ) { padding ->
        if (games.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Noch keine Spiele erfasst.")
            }
            return@Scaffold
        }
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(games, key = { it.uuid }) { game ->
                Card(onClick = { onEditGame(game.uuid) }) {
                    Column(Modifier.fillMaxSize().padding(12.dp)) {
                        androidx.compose.foundation.layout.Row(
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(Modifier.weight(1f)) {
                                Text(
                                    deckName[game.deckUuid] ?: "Unbekanntes Deck",
                                    fontWeight = FontWeight.SemiBold,
                                    style = MaterialTheme.typography.titleMedium,
                                )
                                val result = WINNER_TYPE_LABELS[game.winnerType] ?: game.winnerType
                                val how = game.winType?.let { WIN_TYPE_LABELS[it] }
                                Text(
                                    buildString {
                                        append(shortDate(game.playedAt))
                                        append("  •  ")
                                        append(result)
                                        if (how != null) append(" ($how)")
                                        game.winTurn?.let { append("  •  Turn $it") }
                                        game.bracket?.let { append("  •  Bracket $it") }
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                            IconButton(onClick = { vm.deleteGame(game.uuid) }) {
                                Icon(Icons.Filled.Delete, contentDescription = "Löschen")
                            }
                        }
                    }
                }
            }
        }
    }
}
