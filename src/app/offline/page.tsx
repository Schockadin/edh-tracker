import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">🃏</div>
      <h1 className="text-2xl font-bold">Du bist offline</h1>
      <p className="text-slate-400">
        Diese Seite ist gerade nicht im Cache verfügbar. Sobald du wieder online
        bist, funktioniert alles wie gewohnt weiter — bereits geöffnete Seiten
        bleiben nutzbar.
      </p>
      {/* A full-page reload is intentional here so the browser re-attempts the
          network request rather than a client-side soft navigation. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="btn-primary mt-2">
        Erneut versuchen
      </a>
    </main>
  );
}
