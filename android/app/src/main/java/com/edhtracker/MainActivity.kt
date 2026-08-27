package com.edhtracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.edhtracker.ui.EdhTrackerApp
import com.edhtracker.ui.theme.EdhTrackerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            EdhTrackerTheme {
                EdhTrackerApp()
            }
        }
    }
}
