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
import androidx.compose.material3.AssistChip
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

private val ZONE_LABELS = mapOf("free" to "Verfügbar", "used" to "Verbaut")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollectionScreen(vm: AppViewModel) {
    val cards by vm.collection.collectAsStateWithLifecycle()
    var filter by remember { mutableStateOf("all") }
    var importZone by remember { mutableStateOf("free") }
    var showImport by remember { mutableStateOf(false) }

    val free = cards.filter { it.zone == "free" }.sumOf { it.quantity }
    val used = cards.filter { it.zone == "used" }.sumOf { it.quantity }
    val visible = cards.filter { filter == "all" || it.zone == filter }

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
                    "Keine Karten. Importiere deine Sammlung als Text oder CSV.",
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
                                "${card.quantity}×",
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(end = 8.dp),
                            )
                            Text(
                                card.name,
                                style = MaterialTheme.typography.bodyLarge,
                                modifier = Modifier.weight(1f),
                            )
                            AssistChip(
                                onClick = {
                                    vm.setCollectionZone(
                                        card,
                                        if (card.zone == "free") "used" else "free",
                                    )
                                },
                                label = { Text(ZONE_LABELS[card.zone] ?: card.zone) },
                            )
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
        // Zone toggle + paste field.
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showImport = false },
            title = { Text("In Sammlung importieren") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(importZone == "free", { importZone = "free" }, { Text("Verfügbar") })
                        FilterChip(importZone == "used", { importZone = "used" }, { Text("Verbaut") })
                    }
                    ImportTextField(
                        onReady = { showImport = false; vm.importCollection(it, importZone) },
                    )
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showImport = false }) { Text("Abbrechen") }
            },
        )
    }
}

@Composable
private fun ImportTextField(onReady: (String) -> Unit) {
    var text by remember { mutableStateOf("") }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        androidx.compose.material3.OutlinedTextField(
            value = text,
            onValueChange = { text = it },
            label = { Text("Karten (Text oder CSV)") },
            modifier = Modifier.fillMaxWidth(),
        )
        TextButton(
            onClick = { onReady(text) },
            enabled = text.isNotBlank(),
        ) { Text("Importieren") }
    }
}
