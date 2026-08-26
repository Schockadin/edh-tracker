package com.edhtracker

import android.app.Application
import com.edhtracker.data.SettingsStore
import com.edhtracker.data.SyncRepository
import com.edhtracker.data.local.AppDatabase
import com.edhtracker.sync.SyncScheduler

/** Owns the app-wide singletons (a minimal manual service locator). */
class EdhApp : Application() {
    val database by lazy { AppDatabase.build(this) }
    val settings by lazy { SettingsStore(this) }
    val repository by lazy { SyncRepository(database, settings) }

    override fun onCreate() {
        super.onCreate()
        SyncScheduler.schedulePeriodic(this)
    }
}
