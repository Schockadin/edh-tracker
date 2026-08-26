import "server-only";

import { eq, gt } from "drizzle-orm";

import { db } from "@/db";
import {
  decks,
  formats,
  gameOpponents,
  games,
  playerGroups,
  syncTombstones,
} from "@/db/schema";
import type {
  SyncDeck,
  SyncDeletion,
  SyncFormat,
  SyncGame,
  SyncGroup,
  SyncOpponent,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
} from "./sync-types";

// --- Pull -------------------------------------------------------------------

/**
 * Build a sync snapshot. When `since` is given, only records changed after that
 * instant (and deletions recorded after it) are returned; otherwise the full
 * dataset is returned and deletions are omitted (a fresh client needs none).
 */
export async function buildSnapshot(
  since: Date | null,
): Promise<SyncPullResponse> {
  const serverTime = new Date();

  const [formatRows, deckRows, gameRows, oppRows, groupRows] =
    await Promise.all([
      db.select().from(formats),
      db.select().from(decks),
      db.select().from(games),
      db.select().from(gameOpponents),
      db.select().from(playerGroups),
    ]);

  // id → uuid maps for resolving foreign keys into portable uuids.
  const formatUuid = new Map(formatRows.map((f) => [f.id, f.uuid]));
  const deckUuid = new Map(deckRows.map((d) => [d.id, d.uuid]));
  const gameUuid = new Map(gameRows.map((g) => [g.id, g.uuid]));
  const oppUuid = new Map(oppRows.map((o) => [o.id, o.uuid]));

  const changed = (updatedAt: Date) => !since || updatedAt > since;

  const outFormats: SyncFormat[] = formatRows
    .filter((f) => changed(f.updatedAt))
    .map((f) => ({
      uuid: f.uuid,
      name: f.name,
      constructionType: f.constructionType,
      multiplayer: f.multiplayer,
      hasCommander: f.hasCommander,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

  const outDecks: SyncDeck[] = deckRows
    .filter((d) => changed(d.updatedAt))
    .map((d) => ({
      uuid: d.uuid,
      name: d.name,
      commander: d.commander,
      partnerCommander: d.partnerCommander,
      formatUuid: formatUuid.get(d.formatId) ?? "",
      theme: d.theme,
      platform: d.platform,
      url: d.url,
      colorIdentity: d.colorIdentity ?? [],
      commanderImage: d.commanderImage,
      partnerImage: d.partnerImage,
      bracket: d.bracket,
      archived: d.archived,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));

  const outGames: SyncGame[] = gameRows
    .filter((g) => changed(g.updatedAt))
    .map((g) => ({
      uuid: g.uuid,
      deckUuid: deckUuid.get(g.deckId) ?? "",
      playedAt: g.playedAt.toISOString(),
      bracket: g.bracket,
      turnCount: g.turnCount,
      winnerType: g.winnerType,
      winnerOpponentUuid:
        g.winnerOpponentId != null
          ? (oppUuid.get(g.winnerOpponentId) ?? null)
          : null,
      winTurn: g.winTurn,
      winType: g.winType,
      notes: g.notes,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }));

  const outOpps: SyncOpponent[] = oppRows
    .filter((o) => changed(o.updatedAt))
    .map((o) => ({
      uuid: o.uuid,
      gameUuid: gameUuid.get(o.gameId) ?? "",
      playerName: o.playerName,
      commander: o.commander,
      partnerCommander: o.partnerCommander,
      theme: o.theme,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

  const outGroups: SyncGroup[] = groupRows
    .filter((g) => changed(g.updatedAt))
    .map((g) => ({
      uuid: g.uuid,
      name: g.name,
      playerNames: g.playerNames ?? [],
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }));

  let deletions: SyncDeletion[] = [];
  if (since) {
    const tomb = await db
      .select()
      .from(syncTombstones)
      .where(gt(syncTombstones.deletedAt, since));
    deletions = tomb.map((t) => ({
      table: t.tableName,
      uuid: t.rowUuid,
      deletedAt: t.deletedAt.toISOString(),
    }));
  }

  return {
    serverTime: serverTime.toISOString(),
    formats: outFormats,
    decks: outDecks,
    games: outGames,
    opponents: outOpps,
    groups: outGroups,
    deletions,
  };
}

// --- Push -------------------------------------------------------------------

const DELETABLE = new Set([
  "decks",
  "games",
  "game_opponents",
  "formats",
  "player_groups",
]);

/**
 * Apply a batch of client changes. In a single-user setup the pushing client
 * is applying edits the user just made, so records are upserted by `uuid`
 * (last writer wins by arrival). Foreign keys arrive as uuids and are resolved
 * to local ids; unknown references are skipped rather than failing the batch.
 */
export async function applyPush(
  payload: SyncPushRequest,
): Promise<SyncPushResponse> {
  const applied = {
    formats: 0,
    decks: 0,
    games: 0,
    opponents: 0,
    groups: 0,
    deletions: 0,
  };

  await db.transaction(async (tx) => {
    // 1. Formats.
    for (const f of payload.formats ?? []) {
      await tx
        .insert(formats)
        .values({
          uuid: f.uuid,
          name: f.name,
          constructionType: f.constructionType,
          multiplayer: f.multiplayer,
          hasCommander: f.hasCommander,
          createdAt: new Date(f.createdAt),
        })
        .onConflictDoUpdate({
          target: formats.uuid,
          set: {
            name: f.name,
            constructionType: f.constructionType,
            multiplayer: f.multiplayer,
            hasCommander: f.hasCommander,
          },
        });
      applied.formats++;
    }

    const formatId = new Map(
      (await tx.select({ id: formats.id, uuid: formats.uuid }).from(formats)).map(
        (r) => [r.uuid, r.id],
      ),
    );

    // 2. Decks (need a valid format).
    for (const d of payload.decks ?? []) {
      const fid = formatId.get(d.formatUuid);
      if (fid == null) continue;
      await tx
        .insert(decks)
        .values({
          uuid: d.uuid,
          name: d.name,
          commander: d.commander,
          partnerCommander: d.partnerCommander,
          formatId: fid,
          theme: d.theme,
          platform: d.platform,
          url: d.url,
          colorIdentity: d.colorIdentity,
          commanderImage: d.commanderImage,
          partnerImage: d.partnerImage,
          bracket: d.bracket,
          archived: d.archived,
          createdAt: new Date(d.createdAt),
        })
        .onConflictDoUpdate({
          target: decks.uuid,
          set: {
            name: d.name,
            commander: d.commander,
            partnerCommander: d.partnerCommander,
            formatId: fid,
            theme: d.theme,
            platform: d.platform,
            url: d.url,
            colorIdentity: d.colorIdentity,
            commanderImage: d.commanderImage,
            partnerImage: d.partnerImage,
            bracket: d.bracket,
            archived: d.archived,
          },
        });
      applied.decks++;
    }

    const deckId = new Map(
      (await tx.select({ id: decks.id, uuid: decks.uuid }).from(decks)).map(
        (r) => [r.uuid, r.id],
      ),
    );

    // 3. Games (winnerOpponentId resolved after opponents are upserted).
    for (const g of payload.games ?? []) {
      const did = deckId.get(g.deckUuid);
      if (did == null) continue;
      await tx
        .insert(games)
        .values({
          uuid: g.uuid,
          deckId: did,
          playedAt: new Date(g.playedAt),
          bracket: g.bracket,
          turnCount: g.turnCount,
          winnerType: g.winnerType,
          winnerOpponentId: null,
          winTurn: g.winTurn,
          winType: g.winType,
          notes: g.notes,
          createdAt: new Date(g.createdAt),
        })
        .onConflictDoUpdate({
          target: games.uuid,
          set: {
            deckId: did,
            playedAt: new Date(g.playedAt),
            bracket: g.bracket,
            turnCount: g.turnCount,
            winnerType: g.winnerType,
            winTurn: g.winTurn,
            winType: g.winType,
            notes: g.notes,
          },
        });
      applied.games++;
    }

    const gameId = new Map(
      (await tx.select({ id: games.id, uuid: games.uuid }).from(games)).map(
        (r) => [r.uuid, r.id],
      ),
    );

    // 4. Opponents.
    for (const o of payload.opponents ?? []) {
      const gid = gameId.get(o.gameUuid);
      if (gid == null) continue;
      await tx
        .insert(gameOpponents)
        .values({
          uuid: o.uuid,
          gameId: gid,
          playerName: o.playerName,
          commander: o.commander,
          partnerCommander: o.partnerCommander,
          theme: o.theme,
          createdAt: new Date(o.createdAt),
        })
        .onConflictDoUpdate({
          target: gameOpponents.uuid,
          set: {
            gameId: gid,
            playerName: o.playerName,
            commander: o.commander,
            partnerCommander: o.partnerCommander,
            theme: o.theme,
          },
        });
      applied.opponents++;
    }

    // 5. Resolve winning opponents now that opponent rows exist.
    const oppId = new Map(
      (
        await tx
          .select({ id: gameOpponents.id, uuid: gameOpponents.uuid })
          .from(gameOpponents)
      ).map((r) => [r.uuid, r.id]),
    );
    for (const g of payload.games ?? []) {
      if (g.winnerType !== "opponent" || !g.winnerOpponentUuid) continue;
      const gid = gameId.get(g.uuid);
      const wid = oppId.get(g.winnerOpponentUuid);
      if (gid == null || wid == null) continue;
      await tx
        .update(games)
        .set({ winnerOpponentId: wid })
        .where(eq(games.id, gid));
    }

    // 6. Player groups.
    for (const grp of payload.groups ?? []) {
      await tx
        .insert(playerGroups)
        .values({
          uuid: grp.uuid,
          name: grp.name,
          playerNames: grp.playerNames,
          createdAt: new Date(grp.createdAt),
        })
        .onConflictDoUpdate({
          target: playerGroups.uuid,
          set: { name: grp.name, playerNames: grp.playerNames },
        });
      applied.groups++;
    }

    // 7. Deletions (DB triggers turn these into tombstones for other clients).
    for (const del of payload.deletions ?? []) {
      if (!DELETABLE.has(del.table)) continue;
      switch (del.table) {
        case "decks":
          await tx.delete(decks).where(eq(decks.uuid, del.uuid));
          break;
        case "games":
          await tx.delete(games).where(eq(games.uuid, del.uuid));
          break;
        case "game_opponents":
          await tx
            .delete(gameOpponents)
            .where(eq(gameOpponents.uuid, del.uuid));
          break;
        case "formats":
          await tx.delete(formats).where(eq(formats.uuid, del.uuid));
          break;
        case "player_groups":
          await tx
            .delete(playerGroups)
            .where(eq(playerGroups.uuid, del.uuid));
          break;
      }
      applied.deletions++;
    }
  });

  return { ok: true, applied, serverTime: new Date().toISOString() };
}
