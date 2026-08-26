package com.edhtracker.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Purple = Color(0xFF7C3AED)
private val PurpleDark = Color(0xFFA78BFA)

private val LightColors = lightColorScheme(
    primary = Purple,
    secondary = Color(0xFF6366F1),
)

private val DarkColors = darkColorScheme(
    primary = PurpleDark,
    secondary = Color(0xFF818CF8),
)

@Composable
fun EdhTrackerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = MaterialTheme.typography,
        content = content,
    )
}
