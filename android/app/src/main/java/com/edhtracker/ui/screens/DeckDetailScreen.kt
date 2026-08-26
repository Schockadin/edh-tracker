package com.edhtracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.edhtracker.ui.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeckDetailScreen(vm: AppViewModel, deckUuid: String, onClose: () -> Unit) {
    val decks by vm.decks.collectAsStateWithLifecycle()
    val deck = decks.firstOrNull { it.uuid == deckUuid }
    val cardsFlow = remember(deckUuid) { vm.deckCards(deckUuid) }
    val cards by cardsFlow.collectAsStateWithLifecycle(initialValue = emptyList())
    var showImport by remember { mutableStateOf(false) }

    val total = cards.sumOf { it.quantity }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(deck?.name ?: "Deck") },
                navigationIcon = {
                    IconButton(onClick = onClose) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Zurück")
                    }
                },
                actions = {
                    TextButton(onClick = { showImport = true }) {
                        Text("Importieren")
                    }
                },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            Text(
                "Deckliste ($total Karten)",
                style = MaterialTheme.typography.titleSmall,
                modifier = Modifier.padding(16.dp),
            )
            if (cards.isEmpty()) {
                Text(
                    "Noch keine Karten. Oben rechts eine Liste importieren.",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(horizontal = 16.dp),
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(
                        horizontal = 16.dp,
                        vertical = 4.dp,
                    ),
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    items(cards, key = { it.uuid }) { card ->
                        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                            Text(
                                "${card.quantity}×",
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(end = 8.dp),
                            )
                            Column(Modifier.weight(1f)) {
                                Text(card.name, style = MaterialTheme.typography.bodyLarge)
                                card.typeLine?.let {
                                    Text(it, style = MaterialTheme.typography.bodySmall)
                                }
                            }
                            if (card.colorIdentity.isNotEmpty()) {
                                Text(
                                    card.colorIdentity.joinToString(""),
                                    style = MaterialTheme.typography.labelMedium,
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showImport) {
        PasteImportDialog(
            title = "Deckliste importieren",
            onDismiss = { showImport = false },
            onSubmit = { vm.importDeckList(deckUuid, it) },
        )
    }
}
