import { timingSafeEqual } from "node:crypto";

import { verifyToken } from "./token";

/** Constant-time string comparison to avoid leaking secrets by timing. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do a comparison to keep timing roughly constant.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify the `Authorization: Bearer <jwt>` header of an API request. The token
 * is the same signed session JWT the web app issues (see `lib/token`), so the
 * Android client obtains one via `POST /api/auth/login`. Returns true when the
 * token is present and valid.
 */
export async function verifyBearer(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  const payload = await verifyToken(match[1]);
  return payload !== null;
}
