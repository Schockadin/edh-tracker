"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/login/actions";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/decks", label: "Decks", icon: "🗂️" },
  { href: "/games", label: "Spiele", icon: "⚔️" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">🃏</span>
            <span>EDH Tracker</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive(pathname, link.href)
                    ? "bg-arcane-600 text-white"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200"
            >
              Abmelden
            </button>
          </form>
        </div>
      </header>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-950/90 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
                isActive(pathname, link.href)
                  ? "text-arcane-300"
                  : "text-slate-400"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
