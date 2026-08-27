package com.edhtracker.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.LibraryBooks
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.VideogameAsset
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.edhtracker.ui.screens.AddDeckScreen
import com.edhtracker.ui.screens.AddGameScreen
import com.edhtracker.ui.screens.CollectionScreen
import com.edhtracker.ui.screens.DeckDetailScreen
import com.edhtracker.ui.screens.DecksScreen
import com.edhtracker.ui.screens.GamesScreen
import com.edhtracker.ui.screens.LoginScreen
import com.edhtracker.ui.screens.SettingsScreen
import com.edhtracker.ui.screens.StatsScreen

private sealed class Dest(val route: String, val label: String, val icon: ImageVector) {
    data object Games : Dest("games", "Spiele", Icons.Filled.VideogameAsset)
    data object Decks : Dest("decks", "Decks", Icons.Filled.Style)
    data object Collection : Dest("collection", "Sammlung", Icons.Filled.LibraryBooks)
    data object Stats : Dest("stats", "Statistik", Icons.Filled.BarChart)
    data object Settings : Dest("settings", "Settings", Icons.Filled.Settings)
}

private val bottomDests =
    listOf(Dest.Games, Dest.Decks, Dest.Collection, Dest.Stats, Dest.Settings)

@Composable
fun EdhTrackerApp(vm: AppViewModel = viewModel()) {
    val loggedIn by vm.isLoggedIn.collectAsStateWithLifecycle()
    val message by vm.message.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(message) {
        message?.let {
            snackbarHostState.showSnackbar(it)
            vm.consumeMessage()
        }
    }

    if (!loggedIn) {
        LoginScreen(vm, snackbarHostState)
        return
    }

    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            NavigationBar {
                bottomDests.forEach { dest ->
                    NavigationBarItem(
                        selected = currentRoute?.hierarchy?.any { it.route == dest.route } == true,
                        onClick = {
                            navController.navigate(dest.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(dest.icon, contentDescription = dest.label) },
                        label = { Text(dest.label) },
                    )
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Dest.Games.route,
            modifier = Modifier.padding(padding),
        ) {
            composable(Dest.Games.route) {
                GamesScreen(
                    vm,
                    onAddGame = { navController.navigate("add_game") },
                    onEditGame = { uuid -> navController.navigate("editGame/$uuid") },
                )
            }
            composable(Dest.Decks.route) {
                DecksScreen(
                    vm,
                    onAddDeck = { navController.navigate("add_deck") },
                    onOpenDeck = { uuid -> navController.navigate("deck/$uuid") },
                )
            }
            composable(Dest.Collection.route) { CollectionScreen(vm) }
            composable(Dest.Stats.route) { StatsScreen(vm) }
            composable(Dest.Settings.route) { SettingsScreen(vm) }
            composable("add_game") {
                AddGameScreen(vm, onClose = { navController.popBackStack() })
            }
            composable("editGame/{uuid}") { entry ->
                val uuid = entry.arguments?.getString("uuid").orEmpty()
                AddGameScreen(
                    vm,
                    onClose = { navController.popBackStack() },
                    editUuid = uuid,
                )
            }
            composable("add_deck") {
                AddDeckScreen(vm, onClose = { navController.popBackStack() })
            }
            composable("deck/{uuid}") { entry ->
                val uuid = entry.arguments?.getString("uuid").orEmpty()
                DeckDetailScreen(vm, uuid, onClose = { navController.popBackStack() })
            }
        }
    }
}
