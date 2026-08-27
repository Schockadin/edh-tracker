package com.edhtracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.edhtracker.data.local.CollectionCardEntity
import com.edhtracker.data.local.DeckCardEntity

/** The card data shown in the detail overlay. */
data class CardInfo(
    val name: String,
    val imageUrl: String?,
    val typeLine: String?,
    val manaValue: Int?,
    val colorIdentity: List<String>,
    val setCode: String?,
    val collectorNumber: String?,
    val rarity: String?,
) {
    companion object {
        fun from(c: DeckCardEntity) = CardInfo(
            c.name, c.imageUrl, c.typeLine, c.manaValue, c.colorIdentity,
            c.setCode, c.collectorNumber, c.rarity,
        )

        fun from(c: CollectionCardEntity) = CardInfo(
            c.name, c.imageUrl, c.typeLine, c.manaValue, c.colorIdentity,
            c.setCode, c.collectorNumber, c.rarity,
        )
    }
}

/** Overlay with the Scryfall image and metadata for a single card. */
@Composable
fun CardDetailDialog(card: CardInfo, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Schließen") }
        },
        title = { Text(card.name) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                if (card.imageUrl != null) {
                    AsyncImage(
                        model = card.imageUrl,
                        contentDescription = card.name,
                        contentScale = ContentScale.Fit,
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(488f / 680f)
                            .clip(RoundedCornerShape(12.dp)),
                    )
                }
                card.typeLine?.let {
                    Text(it, style = MaterialTheme.typography.bodyMedium)
                }
                val meta = buildList {
                    card.manaValue?.let { add("MV $it") }
                    if (card.colorIdentity.isNotEmpty()) add(card.colorIdentity.joinToString(""))
                    card.rarity?.let { add(it.replaceFirstChar(Char::uppercase)) }
                    val set = listOfNotNull(card.setCode?.uppercase(), card.collectorNumber)
                        .joinToString(" ")
                    if (set.isNotBlank()) add(set)
                }.joinToString("  •  ")
                if (meta.isNotBlank()) {
                    Text(meta, style = MaterialTheme.typography.bodySmall)
                }
            }
        },
    )
}
