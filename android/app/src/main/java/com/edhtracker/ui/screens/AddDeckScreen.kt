package com.edhtracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.edhtracker.data.local.FormatEntity
import com.edhtracker.ui.AppViewModel
import com.edhtracker.ui.PLATFORMS
import com.edhtracker.ui.PLATFORM_LABELS

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddDeckScreen(vm: AppViewModel, onClose: () -> Unit) {
    val formats by vm.formats.collectAsStateWithLifecycle()

    var name by remember { mutableStateOf("") }
    var commander by remember { mutableStateOf("") }
    var format by remember { mutableStateOf<FormatEntity?>(null) }
    var url by remember { mutableStateOf("") }
    var platform by remember { mutableStateOf("other") }
    var bracket by remember { mutableStateOf("") }

    val canSave = name.isNotBlank() && format != null

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Deck anlegen") },
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
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            DropdownField(
                label = "Format",
                options = formats,
                selected = format,
                optionLabel = { it.name },
                onSelect = { format = it },
            )
            OutlinedTextField(
                value = commander,
                onValueChange = { commander = it },
                label = { Text("Commander (optional)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = url,
                onValueChange = { url = it },
                label = { Text("Deck-URL (optional)") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                modifier = Modifier.fillMaxWidth(),
            )
            DropdownField(
                label = "Plattform",
                options = PLATFORMS,
                selected = platform,
                optionLabel = { PLATFORM_LABELS[it] ?: it },
                onSelect = { platform = it },
            )
            OutlinedTextField(
                value = bracket,
                onValueChange = { bracket = it.filter(Char::isDigit).take(1) },
                label = { Text("Bracket (1–5, optional)") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )
            Button(
                onClick = {
                    val f = format ?: return@Button
                    vm.addDeck(
                        name = name.trim(),
                        commander = commander.ifBlank { null },
                        formatUuid = f.uuid,
                        url = url.trim().ifBlank { null },
                        platform = platform,
                        theme = null,
                        bracket = bracket.toIntOrNull(),
                        onDone = onClose,
                    )
                },
                enabled = canSave,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Speichern")
            }
        }
    }
}
