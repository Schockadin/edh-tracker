"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/login/actions";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/decks", label: "Decks", icon: "🗂️" },
  { href: "/games", label: "Spiele", icon: "⚔️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const hover = "hover:bg-black/5 dark:hover:bg-white/5";

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <header className="nav-surface sticky top-0 z-20 border-b divider">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-strong"
          >
            <span className="hidden sm:inline">EDH Tracker</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive(pathname, link.href)
                    ? "bg-arcane-600 text-white"
                    : `text-soft ${hover}`
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className={`rounded-lg px-3 py-1.5 text-sm text-muted hover:text-strong ${hover}`}
              >
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Bottom tab bar (mobile) */}
      <nav className="nav-surface fixed inset-x-0 bottom-0 z-20 border-t divider sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
                isActive(pathname, link.href)
                  ? "text-arcane-600 dark:text-arcane-300"
                  : "text-muted"
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
