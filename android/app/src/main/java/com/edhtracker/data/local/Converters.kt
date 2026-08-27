package com.edhtracker.data.local

import androidx.room.TypeConverter

/** Stores `List<String>` columns as a single separated string. */
class Converters {
    @TypeConverter
    fun fromList(value: List<String>?): String =
        value?.joinToString(SEP) ?: ""

    @TypeConverter
    fun toList(value: String?): List<String> =
        if (value.isNullOrEmpty()) emptyList() else value.split(SEP)

    private companion object {
        // A control char that never appears in card colors or player names.
        const val SEP = "\u0001"
    }
}
