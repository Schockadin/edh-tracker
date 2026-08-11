"use client";

import { useState, useTransition } from "react";

import {
  createDeck,
  fetchDeckMeta,
  updateDeck,
} from "@/app/(app)/decks/actions";
import type { Platform } from "@/db/schema";
import { COLORS, PLATFORMS } from "@/lib/validation";
import { COLOR_HEX, PLATFORM_LABELS, type DeckView } from "@/lib/types";

function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes("moxfield")) return "moxfield";
  if (u.includes("archidekt")) return "archidekt";
  if (u.includes("manabox")) return "manabox";
  return "other";
}

export function DeckForm({ deck }: { deck?: DeckView }) {
  const editing = Boolean(deck);
  const [url, setUrl] = useState(deck?.url ?? "");
  const [platform, setPlatform] = useState<Platform>(deck?.platform ?? "other");
  const [name, setName] = useState(deck?.name ?? "");
  const [commander, setCommander] = useState(deck?.commander ?? "");
  const [partnerCommander, setPartnerCommander] = useState(
    deck?.partnerCommander ?? "",
  );
  const [colorIdentity, setColorIdentity] = useState<string[]>(
    deck?.colorIdentity ?? [],
  );
  const [bracket, setBracket] = useState<string>(
    deck?.bracket != null ? String(deck.bracket) : "",
  );

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleColor(c: string) {
    setColorIdentity((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  async function handleFetch() {
    setError(null);
    setInfo(null);
    if (!url) {
      setError("Bitte zuerst einen Deck-Link eingeben.");
      return;
    }
    setFetching(true);
    try {
      const meta = await fetchDeckMeta(url);
      setPlatform(meta.platform);
      if (meta.name) setName(meta.name);
      if (meta.commander) setCommander(meta.commander);
      if (meta.partnerCommander) setPartnerCommander(meta.partnerCommander);
      if (meta.colorIdentity && meta.colorIdentity.length > 0) {
        setColorIdentity(meta.colorIdentity);
      }
      if (!meta.commander) {
        setInfo(
          "Konnte keine Deck-Details automatisch laden — bitte manuell ausfüllen.",
        );
      } else {
        setInfo("Deck-Details geladen.");
      }
    } catch {
      setInfo("Automatischer Import fehlgeschlagen — bitte manuell ausfüllen.");
    } finally {
      setFetching(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      name,
      commander,
      partnerCommander,
      url,
      platform,
      colorIdentity: colorIdentity.filter((c) => COLORS.includes(c as never)),
      bracket: bracket === "" ? null : Number(bracket),
    };
    startTransition(async () => {
      const result = editing
        ? await updateDeck(deck!.id, input)
        : await createDeck(input);
      // On success the action redirects; only errors return here.
      if (result && !result.ok) setError(result.error ?? "Fehler beim Speichern.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card space-y-4">
        <div>
          <label htmlFor="url" className="label">
            Deck-Link (Moxfield / ManaBox / Archidekt)
          </label>
          <div className="flex gap-2">
            <input
              id="url"
              type="url"
              className="input"
              placeholder="https://moxfield.com/decks/…"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setPlatform(detectPlatform(e.target.value));
              }}
              required
            />
            <button
              type="button"
              className="btn-ghost whitespace-nowrap"
              onClick={handleFetch}
              disabled={fetching}
            >
              {fetching ? "Lädt…" : "Details laden"}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Plattform erkannt: {PLATFORM_LABELS[platform]}
          </p>
        </div>

        {info ? <p className="text-sm text-arcane-300">{info}</p> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">
              Deck-Name
            </label>
            <input
              id="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="platform" className="label">
              Plattform
            </label>
            <select
              id="platform"
              className="select"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="commander" className="label">
              Commander
            </label>
            <input
              id="commander"
              className="input"
              value={commander}
              onChange={(e) => setCommander(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="partner" className="label">
              Partner / Hintergrund (optional)
            </label>
            <input
              id="partner"
              className="input"
              value={partnerCommander}
              onChange={(e) => setPartnerCommander(e.target.value)}
            />
          </div>
        </div>

        <div>
          <span className="label">Farbidentität</span>
          <div className="flex gap-2">
            {COLORS.map((c) => {
              const active = colorIdentity.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleColor(c)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition ${
                    active
                      ? "border-white/60 ring-2 ring-white/40"
                      : "border-white/10 opacity-50 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: COLOR_HEX[c], color: "#020617" }}
                  aria-pressed={active}
                  title={c}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sm:w-40">
          <label htmlFor="bracket" className="label">
            Bracket (1–5)
          </label>
          <select
            id="bracket"
            className="select"
            value={bracket}
            onChange={(e) => setBracket(e.target.value)}
          >
            <option value="">– keins –</option>
            {[1, 2, 3, 4, 5].map((b) => (
              <option key={b} value={b}>
                Bracket {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Speichern…" : editing ? "Änderungen speichern" : "Deck speichern"}
        </button>
        <a href="/decks" className="btn-ghost">
          Abbrechen
        </a>
      </div>
    </form>
  );
}
