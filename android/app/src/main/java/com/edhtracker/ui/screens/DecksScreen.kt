package com.edhtracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.edhtracker.ui.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DecksScreen(
    vm: AppViewModel,
    onAddDeck: () -> Unit,
    onOpenDeck: (String) -> Unit,
) {
    val decks by vm.decks.collectAsStateWithLifecycle()
    val formats by vm.formats.collectAsStateWithLifecycle()
    val formatName = formats.associate { it.uuid to it.name }

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
            items(decks.filter { !it.archived }, key = { it.uuid }) { deck ->
                Card(onClick = { onOpenDeck(deck.uuid) }) {
                    Column(Modifier.fillMaxSize().padding(12.dp)) {
                        Text(
                            deck.name,
                            fontWeight = FontWeight.SemiBold,
                            style = MaterialTheme.typography.titleMedium,
                        )
                        val subtitle = buildString {
                            (deck.commander ?: deck.theme)?.let { append(it); append("  •  ") }
                            append(formatName[deck.formatUuid] ?: "Format")
                            if (deck.colorIdentity.isNotEmpty()) {
                                append("  •  ")
                                append(deck.colorIdentity.joinToString(""))
                            }
                        }
                        Text(subtitle, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}
