package com.edhtracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.toMutableStateList
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.edhtracker.data.SyncRepository
import com.edhtracker.data.local.DeckEntity
import com.edhtracker.ui.AppViewModel
import com.edhtracker.ui.WINNER_TYPES
import com.edhtracker.ui.WINNER_TYPE_LABELS
import com.edhtracker.ui.WIN_TYPES
import com.edhtracker.ui.WIN_TYPE_LABELS

private class OppRow(commander: String = "", name: String = "") {
    var commander by mutableStateOf(commander)
    var name by mutableStateOf(name)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddGameScreen(vm: AppViewModel, onClose: () -> Unit, editUuid: String? = null) {
    val decks by vm.decks.collectAsStateWithLifecycle()
    val games by vm.games.collectAsStateWithLifecycle()
    val allOpponents by vm.opponents.collectAsStateWithLifecycle()
    val activeDecks = decks.filter { !it.archived }

    var deck by remember { mutableStateOf<DeckEntity?>(null) }
    var winnerType by remember { mutableStateOf("me") }
    var winTypeSel by remember { mutableStateOf<String?>(null) }
    var bracket by remember { mutableStateOf("") }
    var turnCount by remember { mutableStateOf("") }
    var winTurn by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    val opponents = remember { listOf(OppRow()).toMutableStateList() }
    var winnerOpponentIndex by remember { mutableStateOf<Int?>(null) }
    var initialized by remember { mutableStateOf(false) }

    // When editing, prefill the form from the synced game once it has loaded.
    LaunchedEffect(editUuid, decks, games, allOpponents) {
        if (editUuid == null || initialized) return@LaunchedEffect
        val g = games.firstOrNull { it.uuid == editUuid } ?: return@LaunchedEffect
        deck = decks.firstOrNull { it.uuid == g.deckUuid }
        winnerType = g.winnerType
        winTypeSel = g.winType
        bracket = g.bracket?.toString() ?: ""
        turnCount = g.turnCount?.toString() ?: ""
        winTurn = g.winTurn?.toString() ?: ""
        notes = g.notes ?: ""
        val opps = allOpponents.filter { it.gameUuid == editUuid }
        opponents.clear()
        if (opps.isEmpty()) {
            opponents.add(OppRow())
        } else {
            opps.forEach { opponents.add(OppRow(it.commander ?: "", it.playerName ?: "")) }
        }
        winnerOpponentIndex = g.winnerOpponentUuid
            ?.let { wu -> opps.indexOfFirst { it.uuid == wu } }
            ?.takeIf { it >= 0 }
        initialized = true
    }

    val canSave = deck != null &&
        (winnerType != "opponent" || winnerOpponentIndex != null)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (editUuid == null) "Spiel erfassen" else "Spiel bearbeiten") },
                navigationIcon = {
                    IconButton(onClick = onClose) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Zurück")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            DropdownField(
                label = "Deck",
                options = activeDecks,
                selected = deck,
                optionLabel = { it.name },
                onSelect = { deck = it },
            )

            DropdownField(
                label = "Ergebnis",
                options = WINNER_TYPES,
                selected = winnerType,
                optionLabel = { WINNER_TYPE_LABELS[it] ?: it },
                onSelect = {
                    winnerType = it
                    if (it != "opponent") winnerOpponentIndex = null
                },
            )

            Text("Gegner", style = androidx.compose.material3.MaterialTheme.typography.titleSmall)
            opponents.forEachIndexed { index, row ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    OutlinedTextField(
                        value = row.commander,
                        onValueChange = { row.commander = it },
                        label = { Text("Commander") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                    )
                    OutlinedTextField(
                        value = row.name,
                        onValueChange = { row.name = it },
                        label = { Text("Name") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                    )
                    IconButton(onClick = {
                        opponents.removeAt(index)
                        if (winnerOpponentIndex == index) winnerOpponentIndex = null
                    }) {
                        Icon(Icons.Filled.Delete, contentDescription = "Gegner entfernen")
                    }
                }
            }
            OutlinedButton(onClick = { opponents.add(OppRow()) }) {
                Text("Gegner hinzufügen")
            }

            if (winnerType == "opponent" && opponents.isNotEmpty()) {
                DropdownField(
                    label = "Siegreicher Gegner",
                    options = opponents.indices.toList(),
                    selected = winnerOpponentIndex,
                    optionLabel = { i ->
                        opponents[i].commander.ifBlank { opponents[i].name.ifBlank { "Gegner ${i + 1}" } }
                    },
                    onSelect = { winnerOpponentIndex = it },
                )
            }

            DropdownField(
                label = "Art des Siegs (optional)",
                options = listOf<String?>(null) + WIN_TYPES,
                selected = winTypeSel,
                optionLabel = { it?.let { t -> WIN_TYPE_LABELS[t] ?: t } ?: "—" },
                onSelect = { winTypeSel = it },
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = bracket,
                    onValueChange = { bracket = it.filter(Char::isDigit).take(1) },
                    label = { Text("Bracket") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = turnCount,
                    onValueChange = { turnCount = it.filter(Char::isDigit).take(3) },
                    label = { Text("Turns") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = winTurn,
                    onValueChange = { winTurn = it.filter(Char::isDigit).take(3) },
                    label = { Text("Sieg-Turn") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                )
            }

            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notizen") },
                modifier = Modifier.fillMaxWidth(),
            )

            Button(
                onClick = {
                    val chosen = deck ?: return@Button
                    val kept = opponents.filter {
                        it.commander.isNotBlank() || it.name.isNotBlank()
                    }
                    val drafts = kept.map {
                        SyncRepository.OpponentDraft(
                            playerName = it.name.ifBlank { null },
                            commander = it.commander.ifBlank { null },
                            theme = null,
                        )
                    }
                    // Remap the winner index against the filtered list.
                    val winnerRow = winnerOpponentIndex?.let { opponents.getOrNull(it) }
                    val mappedWinner = winnerRow?.let { kept.indexOf(it) }?.takeIf { it >= 0 }
                    if (editUuid == null) {
                        vm.addGame(
                            deckUuid = chosen.uuid,
                            winnerType = winnerType,
                            bracket = bracket.toIntOrNull(),
                            turnCount = turnCount.toIntOrNull(),
                            winTurn = winTurn.toIntOrNull(),
                            winType = winTypeSel,
                            notes = notes.ifBlank { null },
                            opponents = drafts,
                            winnerOpponentIndex = mappedWinner,
                            onDone = onClose,
                        )
                    } else {
                        vm.updateGame(
                            gameUuid = editUuid,
                            deckUuid = chosen.uuid,
                            winnerType = winnerType,
                            bracket = bracket.toIntOrNull(),
                            turnCount = turnCount.toIntOrNull(),
                            winTurn = winTurn.toIntOrNull(),
                            winType = winTypeSel,
                            notes = notes.ifBlank { null },
                            opponents = drafts,
                            winnerOpponentIndex = mappedWinner,
                            onDone = onClose,
                        )
                    }
                },
                enabled = canSave,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Speichern")
            }
        }
    }
}
