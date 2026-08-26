package com.edhtracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.edhtracker.ui.AppViewModel
import com.edhtracker.ui.shortDate

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(vm: AppViewModel) {
    val baseUrl by vm.baseUrl.collectAsStateWithLifecycle()
    val lastSync by vm.lastSync.collectAsStateWithLifecycle()
    val busy by vm.busy.collectAsStateWithLifecycle()
    val decks by vm.decks.collectAsStateWithLifecycle()
    val games by vm.games.collectAsStateWithLifecycle()

    Scaffold(topBar = { TopAppBar(title = { Text("Einstellungen") }) }) { padding ->
        Column(
            modifier = Modifier.fillMaxWidth().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Card {
                Column(Modifier.fillMaxWidth().padding(16.dp), Arrangement.spacedBy(4.dp)) {
                    Text("Server", style = MaterialTheme.typography.titleSmall)
                    Text(baseUrl.ifBlank { "—" }, style = MaterialTheme.typography.bodyMedium)
                    Text(
                        "Letzter Sync: " + (lastSync.takeIf { it.isNotBlank() }?.let { shortDate(it) } ?: "nie"),
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Text(
                        "Lokal: ${decks.size} Decks, ${games.size} Spiele",
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }

            Button(
                onClick = { vm.syncNow() },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (busy) "Synchronisiere…" else "Jetzt synchronisieren")
            }

            OutlinedButton(
                onClick = { vm.logout() },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Abmelden")
            }
        }
    }
}
