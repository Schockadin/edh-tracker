import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * Pure JWT sign/verify helpers. No `next/headers` usage, so these are safe to
 * call from the Edge middleware as well as from server actions.
 */

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is not set or too short (need at least 16 characters).",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(days: number): Promise<string> {
  return new SignJWT({ sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "edh_session";
