"use client";

import { useMemo, useState, useTransition } from "react";

import {
  createDeck,
  fetchDeckMeta,
  updateDeck,
} from "@/app/(app)/decks/actions";
import type { Platform } from "@/db/schema";
import {
  getCardByName,
  sortColorIdentity,
  type ScryCard,
} from "@/lib/scryfall";
import {
  COLOR_HEX,
  PLATFORM_LABELS,
  type DeckView,
  type FormatView,
} from "@/lib/types";
import { COLORS, PLATFORMS } from "@/lib/validation";
import { CardInput } from "./card-input";

function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes("moxfield")) return "moxfield";
  if (u.includes("archidekt")) return "archidekt";
  if (u.includes("manabox")) return "manabox";
  return "other";
}

export function DeckForm({
  deck,
  formats,
}: {
  deck?: DeckView;
  formats: FormatView[];
}) {
  const editing = Boolean(deck);
  const [url, setUrl] = useState(deck?.url ?? "");
  const [formatId, setFormatId] = useState<string>(
    deck ? String(deck.formatId) : formats[0] ? String(formats[0].id) : "",
  );
  const selectedFormat = useMemo(
    () => formats.find((f) => String(f.id) === formatId),
    [formats, formatId],
  );
  const hasCommander = selectedFormat?.hasCommander ?? false;
  const [platform, setPlatform] = useState<Platform>(deck?.platform ?? "other");
  const [name, setName] = useState(deck?.name ?? "");
  const [theme, setTheme] = useState(deck?.theme ?? "");
  const [commander, setCommander] = useState(deck?.commander ?? "");
  const [partnerCommander, setPartnerCommander] = useState(
    deck?.partnerCommander ?? "",
  );
  const [commanderCard, setCommanderCard] = useState<ScryCard | null>(null);
  const [partnerCard, setPartnerCard] = useState<ScryCard | null>(null);
  const [commanderImage, setCommanderImage] = useState<string | null>(
    deck?.commanderImage ?? null,
  );
  const [partnerImage, setPartnerImage] = useState<string | null>(
    deck?.partnerImage ?? null,
  );
  const [commanderValid, setCommanderValid] = useState(
    editing && Boolean(deck?.commander),
  );
  const [partnerValid, setPartnerValid] = useState(true);
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

  // Color identity is authoritative from Scryfall: derive it from the resolved
  // commander(s). Only overrides the pips when at least one card is resolved.
  function applyDerivedColors(cards: (ScryCard | null)[]) {
    const resolved = cards.filter(Boolean) as ScryCard[];
    if (resolved.length === 0) return;
    const union = new Set<string>();
    for (const c of resolved) for (const col of c.colorIdentity) union.add(col);
    setColorIdentity(sortColorIdentity(union));
  }

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

      // Resolve commander/partner names against Scryfall for image + colors.
      let cmdCard: ScryCard | null = null;
      let partCard: ScryCard | null = null;
      if (meta.commander) {
        setCommander(meta.commander);
        cmdCard = await getCardByName(meta.commander);
        setCommanderCard(cmdCard);
        setCommanderImage(cmdCard?.artCrop ?? null);
        setCommanderValid(Boolean(cmdCard));
      }
      if (meta.partnerCommander) {
        setPartnerCommander(meta.partnerCommander);
        partCard = await getCardByName(meta.partnerCommander);
        setPartnerCard(partCard);
        setPartnerImage(partCard?.artCrop ?? null);
        setPartnerValid(Boolean(partCard));
      }
      applyDerivedColors([cmdCard, partCard]);

      setInfo(
        meta.commander
          ? "Deck-Details geladen."
          : "Konnte keine Deck-Details automatisch laden (Plattform blockiert evtl. den Zugriff) — bitte Commander manuell eingeben; Farben & Bild kommen dann von Scryfall.",
      );
    } catch {
      setInfo("Automatischer Import fehlgeschlagen — bitte manuell ausfüllen.");
    } finally {
      setFetching(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (hasCommander) {
      if (!commander.trim() || !commanderValid) {
        setError(
          "Bitte einen gültigen Commander (aus den Vorschlägen) wählen.",
        );
        return;
      }
      if (partnerCommander.trim() && !partnerValid) {
        setError("Der Partner ist keine gültige Karte.");
        return;
      }
    }

    const input = {
      name,
      commander: hasCommander ? commander : "",
      partnerCommander: hasCommander ? partnerCommander : "",
      formatId: Number(formatId),
      theme,
      url,
      platform,
      colorIdentity: colorIdentity.filter((c) => COLORS.includes(c as never)),
      commanderImage: hasCommander ? commanderImage : null,
      partnerImage: hasCommander ? partnerImage : null,
      bracket: bracket === "" ? null : Number(bracket),
    };
    startTransition(async () => {
      const result = editing
        ? await updateDeck(deck!.id, input)
        : await createDeck(input);
      if (result && !result.ok)
        setError(result.error ?? "Fehler beim Speichern.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card space-y-4">
        <div>
          <label htmlFor="url" className="label">
            Deck-Link (Moxfield / ManaBox / Archidekt) — optional
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
          <p className="mt-1 text-xs text-muted">
            Plattform erkannt: {PLATFORM_LABELS[platform]}
          </p>
        </div>

        {info ? <p className="text-sm accent">{info}</p> : null}

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
            <label htmlFor="format" className="label">
              Format
            </label>
            <select
              id="format"
              className="select"
              value={formatId}
              onChange={(e) => setFormatId(e.target.value)}
              required
            >
              {formats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="theme" className="label">
              Theme (optional)
            </label>
            <input
              id="theme"
              className="input"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="z. B. Aristocrats, Aggro, Control"
            />
          </div>
          {hasCommander ? (
            <>
              <div>
                <label htmlFor="commander" className="label">
                  Commander
                </label>
                <CardInput
                  id="commander"
                  value={commander}
                  onChange={setCommander}
                  placeholder="z. B. Atraxa, Praetors' Voice"
                  required
                  ariaLabel="Commander"
                  initiallyValid={editing && Boolean(deck?.commander)}
                  onResolved={(card) => {
                    setCommanderCard(card);
                    setCommanderImage(card?.artCrop ?? null);
                    setCommanderValid(Boolean(card));
                    applyDerivedColors([card, partnerCard]);
                  }}
                />
              </div>
              <div>
                <label htmlFor="partner" className="label">
                  Partner / Hintergrund (optional)
                </label>
                <CardInput
                  id="partner"
                  value={partnerCommander}
                  onChange={setPartnerCommander}
                  placeholder="optional"
                  ariaLabel="Partner"
                  initiallyValid={editing && Boolean(deck?.partnerCommander)}
                  onResolved={(card) => {
                    setPartnerCard(card);
                    setPartnerImage(card?.artCrop ?? null);
                    setPartnerValid(
                      Boolean(card) || partnerCommander.trim() === "",
                    );
                    applyDerivedColors([commanderCard, card]);
                  }}
                />
              </div>
            </>
          ) : null}
        </div>

        <div>
          <span className="label">Farbidentität (aus Scryfall)</span>
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
                      : "divider opacity-40 hover:opacity-100"
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

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending
            ? "Speichern…"
            : editing
              ? "Änderungen speichern"
              : "Deck speichern"}
        </button>
        <a href="/decks" className="btn-ghost">
          Abbrechen
        </a>
      </div>
    </form>
  );
}
