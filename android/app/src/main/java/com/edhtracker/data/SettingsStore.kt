package com.edhtracker.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

/** Persists the server URL, auth token and last sync cursor. */
class SettingsStore(private val context: Context) {
    private object Keys {
        val BASE_URL = stringPreferencesKey("base_url")
        val TOKEN = stringPreferencesKey("token")
        val CURSOR = stringPreferencesKey("cursor")
        val LAST_SYNC = stringPreferencesKey("last_sync")
    }

    val baseUrlFlow: Flow<String> =
        context.dataStore.data.map { it[Keys.BASE_URL] ?: "" }

    val tokenFlow: Flow<String> =
        context.dataStore.data.map { it[Keys.TOKEN] ?: "" }

    val isLoggedInFlow: Flow<Boolean> =
        context.dataStore.data.map { !(it[Keys.TOKEN]).isNullOrEmpty() }

    val lastSyncFlow: Flow<String> =
        context.dataStore.data.map { it[Keys.LAST_SYNC] ?: "" }

    suspend fun baseUrl(): String = baseUrlFlow.first()
    suspend fun token(): String = tokenFlow.first()
    suspend fun cursor(): String? =
        context.dataStore.data.first()[Keys.CURSOR].takeUnless { it.isNullOrEmpty() }

    suspend fun saveSession(baseUrl: String, token: String) {
        context.dataStore.edit {
            it[Keys.BASE_URL] = baseUrl
            it[Keys.TOKEN] = token
        }
    }

    suspend fun setCursor(cursor: String) {
        context.dataStore.edit { it[Keys.CURSOR] = cursor }
    }

    suspend fun setLastSync(iso: String) {
        context.dataStore.edit { it[Keys.LAST_SYNC] = iso }
    }

    /** Clears the token and cursor (keeps the base URL for convenience). */
    suspend fun logout() {
        context.dataStore.edit {
            it.remove(Keys.TOKEN)
            it.remove(Keys.CURSOR)
            it.remove(Keys.LAST_SYNC)
        }
    }
}
