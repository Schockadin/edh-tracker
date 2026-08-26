import { NextResponse } from "next/server";

import { safeEqual } from "@/lib/api-auth";
import { signToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sessionDays(): number {
  const raw = Number(process.env.SESSION_DAYS);
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}

/**
 * Password → session JWT for API clients (the Android app). The token is the
 * same signed JWT the web login issues and is sent as `Authorization: Bearer`
 * on subsequent `/api/sync/*` calls.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password =
    body && typeof body === "object" && typeof body.password === "string"
      ? body.password
      : "";
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: "Server misconfigured (APP_PASSWORD missing)." },
      { status: 500 },
    );
  }
  if (!password || !safeEqual(password, expected)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const days = sessionDays();
  const token = await signToken(days);
  return NextResponse.json({ token, expiresInDays: days });
}
