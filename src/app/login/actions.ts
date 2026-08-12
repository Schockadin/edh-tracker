"use server";

import { timingSafeEqual } from "node:crypto";

import { redirect } from "next/navigation";

import { createSession, destroySession } from "@/lib/session";

export interface LoginState {
  error?: string;
}

/** Constant-time string comparison to avoid leaking the password by timing. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do a comparison to keep timing roughly constant.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    return { error: "Server ist nicht konfiguriert (APP_PASSWORD fehlt)." };
  }
  if (!password || !safeEqual(password, expected)) {
    return { error: "Falsches Passwort." };
  }

  await createSession();
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
