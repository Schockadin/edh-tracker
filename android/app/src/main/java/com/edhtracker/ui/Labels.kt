package com.edhtracker.ui

/** Display labels mirroring the web app (see `lib/types.ts`). */

val WINNER_TYPES = listOf("me", "opponent", "draw")

val WINNER_TYPE_LABELS = mapOf(
    "me" to "Ich",
    "opponent" to "Gegner",
    "draw" to "Unentschieden",
)

val WIN_TYPES = listOf(
    "combat_damage", "commander_damage", "burn", "infect", "combo", "mill",
    "poison", "alt_win", "decking", "concession", "other",
)

val WIN_TYPE_LABELS = mapOf(
    "combat_damage" to "Combat Damage",
    "commander_damage" to "Commander Damage",
    "burn" to "Burn",
    "infect" to "Infect",
    "combo" to "Combo",
    "mill" to "Mill",
    "poison" to "Poison",
    "alt_win" to "Alternative Win",
    "decking" to "Decking Out",
    "concession" to "Concession",
    "other" to "Sonstiges",
)

val PLATFORMS = listOf("moxfield", "manabox", "archidekt", "other")

val PLATFORM_LABELS = mapOf(
    "moxfield" to "Moxfield",
    "manabox" to "ManaBox",
    "archidekt" to "Archidekt",
    "other" to "Sonstige",
)

/** Formats an ISO-8601 instant as a short local date (yyyy-MM-dd), best effort. */
fun shortDate(iso: String): String =
    iso.takeIf { it.length >= 10 }?.substring(0, 10) ?: iso
