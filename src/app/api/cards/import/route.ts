import { NextResponse } from "next/server";

import { verifyBearer } from "@/lib/api-auth";
import { parseCardImport } from "@/lib/decklist";
import { resolveCards } from "@/lib/scryfall-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Parses a pasted / uploaded card list and resolves it against Scryfall. Used
 * by the Android client so decklist and collection imports share the exact same
 * parsing and card data as the web app.
 */
export async function POST(request: Request) {
  if (!(await verifyBearer(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const content =
    body && typeof body === "object" && typeof body.content === "string"
      ? body.content
      : "";
  if (!content.trim()) {
    return NextResponse.json({ error: "Empty content" }, { status: 400 });
  }

  const lines = parseCardImport(content);
  const result = await resolveCards(lines);
  return NextResponse.json(result);
}
