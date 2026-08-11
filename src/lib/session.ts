import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, signToken, verifyToken } from "./token";

function sessionDays(): number {
  const raw = Number(process.env.SESSION_DAYS);
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}

export async function createSession(): Promise<void> {
  const days = sessionDays();
  const token = await signToken(days);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Guard for server components / actions. Redirects to /login when there is no
 * valid session. Returns the session payload otherwise.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
