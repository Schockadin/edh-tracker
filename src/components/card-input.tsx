"use client";

import { useEffect, useRef, useState } from "react";

import {
  autocompleteCards,
  getCardByName,
  type ScryCard,
} from "@/lib/scryfall";

type Status = "idle" | "checking" | "valid" | "invalid";

interface CardInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Called after validation: the resolved card, or null if not a real card. */
  onResolved?: (card: ScryCard | null) => void;
  placeholder?: string;
  required?: boolean;
  ariaLabel?: string;
  /** Assume the initial value is already a valid card (edit mode). */
  initiallyValid?: boolean;
}

export function CardInput({
  id,
  value,
  onChange,
  onResolved,
  placeholder,
  required,
  ariaLabel,
  initiallyValid,
}: CardInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState<Status>(
    initiallyValid && value ? "valid" : "idle",
  );

  const acAbort = useRef<AbortController | null>(null);
  const valAbort = useRef<AbortController | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      acAbort.current?.abort();
      valAbort.current?.abort();
      if (debounce.current) clearTimeout(debounce.current);
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  function scheduleAutocomplete(q: string) {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      acAbort.current?.abort();
      acAbort.current = new AbortController();
      const list = await autocompleteCards(q, acAbort.current.signal);
      setSuggestions(list);
      setActiveIndex(-1);
      setOpen(list.length > 0);
    }, 250);
  }

  async function validate(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      setStatus("idle");
      onResolved?.(null);
      return;
    }
    setStatus("checking");
    valAbort.current?.abort();
    valAbort.current = new AbortController();
    const card = await getCardByName(trimmed, valAbort.current.signal);
    if (card) {
      setStatus("valid");
      if (card.name !== value) onChange(card.name);
      onResolved?.(card);
    } else {
      setStatus("invalid");
      onResolved?.(null);
    }
  }

  function selectSuggestion(name: string) {
    onChange(name);
    setOpen(false);
    setSuggestions([]);
    void validate(name);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") {
        // No dropdown: validate what's typed instead of submitting blindly.
        e.preventDefault();
        void validate(value);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0];
      if (pick) selectSuggestion(pick);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const invalid = status === "invalid";

  return (
    <div className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          className="input pr-8"
          style={
            invalid ? { borderColor: "#ef4444", boxShadow: "0 0 0 1px #ef4444" } : undefined
          }
          value={value}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          aria-label={ariaLabel}
          aria-invalid={invalid}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v);
            setStatus("idle");
            scheduleAutocomplete(v);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            blurTimer.current = setTimeout(() => {
              setOpen(false);
              void validate(value);
            }, 150);
          }}
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm">
          {status === "checking" ? (
            <span className="text-subtle">…</span>
          ) : status === "valid" ? (
            <span className="text-emerald-500">✓</span>
          ) : status === "invalid" ? (
            <span className="text-red-500">✕</span>
          ) : null}
        </span>
      </div>

      {invalid ? (
        <p className="mt-1 text-xs text-red-500">
          Keine echte Karte — bitte einen Vorschlag wählen.
        </p>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul className="card absolute z-30 mt-1 max-h-56 w-full overflow-auto p-1 text-sm shadow-xl">
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                className={`block w-full rounded-md px-2 py-1.5 text-left ${
                  i === activeIndex
                    ? "bg-arcane-600 text-white"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                // onMouseDown fires before the input's onBlur, so the pick sticks.
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(s);
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
