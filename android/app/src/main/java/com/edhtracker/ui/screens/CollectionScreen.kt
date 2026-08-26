package com.edhtracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.edhtracker.ui.AppViewModel

/** A collection card together with its derived used/free split. */
private data class CardRow(val name: String, val owned: Int, val used: Int, val uuid: String) {
    val free: Int get() = owned - used
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollectionScreen(vm: AppViewModel) {
    val cards by vm.collection.collectAsStateWithLifecycle()
    val deckCards by vm.allDeckCards.collectAsStateWithLifecycle()
    var filter by remember { mutableStateOf("all") }
    var showImport by remember { mutableStateOf(false) }

    // Total quantity of each card built across all decks, keyed by lower name.
    val usedByName = remember(deckCards) {
        deckCards.groupBy { it.name.lowercase() }
            .mapValues { (_, list) -> list.sumOf { it.quantity } }
    }
    val rows = cards.map {
        val built = usedByName[it.name.lowercase()] ?: 0
        CardRow(it.name, it.quantity, minOf(it.quantity, built), it.uuid)
    }
    val free = rows.sumOf { it.free }
    val used = rows.sumOf { it.used }
    val visible = rows.filter {
        filter == "all" || (filter == "used" && it.used > 0) || (filter == "free" && it.free > 0)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Sammlung") },
                actions = {
                    TextButton(onClick = { showImport = true }) { Text("Importieren") }
                },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                FilterChip(filter == "all", { filter = "all" }, { Text("Alle (${free + used})") })
                FilterChip(filter == "free", { filter = "free" }, { Text("Verfügbar ($free)") })
                FilterChip(filter == "used", { filter = "used" }, { Text("Verbaut ($used)") })
            }

            if (visible.isEmpty()) {
                Text(
                    "Keine Karten. Importiere deine Sammlung als Text oder CSV. " +
                        "Verbaut/verfügbar wird automatisch aus den Decklisten abgeleitet.",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(16.dp),
                )
            } else {
                LazyColumn(
                    Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(
                        horizontal = 12.dp,
                        vertical = 4.dp,
                    ),
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    items(visible, key = { it.uuid }) { card ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "${card.owned}×",
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(end = 8.dp),
                            )
                            Text(
                                card.name,
                                style = MaterialTheme.typography.bodyLarge,
                                modifier = Modifier.weight(1f),
                            )
                            if (card.used > 0) {
                                Text(
                                    "${card.used} verbaut",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(start = 8.dp),
                                )
                            }
                            if (card.free > 0) {
                                Text(
                                    "${card.free} frei",
                                    style = MaterialTheme.typography.labelMedium,
                                    modifier = Modifier.padding(start = 8.dp),
                                )
                            }
                            IconButton(onClick = { vm.deleteCollectionCard(card.uuid) }) {
                                Icon(Icons.Filled.Delete, contentDescription = "Entfernen")
                            }
                        }
                    }
                }
            }
        }
    }

    if (showImport) {
        PasteImportDialog(
            title = "In Sammlung importieren",
            onDismiss = { showImport = false },
            onSubmit = { vm.importCollection(it) },
        )
    }
}
