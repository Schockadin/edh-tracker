package com.edhtracker.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.edhtracker.EdhApp

/** Runs a full push+pull sync in the background. */
class SyncWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val repo = (applicationContext as EdhApp).repository
        return repo.sync().fold(
            onSuccess = { Result.success() },
            onFailure = { Result.retry() },
        )
    }
}
