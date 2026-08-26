package com.edhtracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.background
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatsScreen(vm: AppViewModel) {
    val games by vm.games.collectAsStateWithLifecycle()
    val decks by vm.decks.collectAsStateWithLifecycle()
    val deckName = decks.associate { it.uuid to it.name }

    val total = games.size
    val myWins = games.count { it.winnerType == "me" }
    val winrate = if (total > 0) myWins * 100 / total else 0

    // Wins per deck (only counting games I won).
    val winsPerDeck = games
        .filter { it.winnerType == "me" }
        .groupingBy { it.deckUuid }
        .eachCount()
        .entries
        .sortedByDescending { it.value }
    val maxWins = winsPerDeck.maxOfOrNull { it.value } ?: 0

    Scaffold(topBar = { TopAppBar(title = { Text("Statistik") }) }) { padding ->
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatTile("Spiele", total.toString(), Modifier.weight(1f))
                StatTile("Siege", myWins.toString(), Modifier.weight(1f))
                StatTile("Winrate", "$winrate%", Modifier.weight(1f))
            }

            Text("Siege pro Deck", style = MaterialTheme.typography.titleMedium)
            if (winsPerDeck.isEmpty()) {
                Text("Noch keine Siege erfasst.", style = MaterialTheme.typography.bodyMedium)
            } else {
                winsPerDeck.forEach { (uuid, count) ->
                    Column(Modifier.fillMaxWidth()) {
                        Text(
                            "${deckName[uuid] ?: "Unbekannt"} — $count",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        val fraction = if (maxWins > 0) count.toFloat() / maxWins else 0f
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .height(10.dp)
                                .padding(top = 2.dp)
                                .background(
                                    MaterialTheme.colorScheme.surfaceVariant,
                                    RoundedCornerShape(6.dp),
                                ),
                        ) {
                            Box(
                                Modifier
                                    .fillMaxWidth(fraction)
                                    .height(10.dp)
                                    .background(
                                        MaterialTheme.colorScheme.primary,
                                        RoundedCornerShape(6.dp),
                                    ),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatTile(label: String, value: String, modifier: Modifier = Modifier) {
    Card(modifier = modifier) {
        Column(
            Modifier.fillMaxWidth().padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text(label, style = MaterialTheme.typography.labelMedium)
        }
    }
}
