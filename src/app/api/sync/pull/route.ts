import { NextResponse } from "next/server";

import { verifyBearer } from "@/lib/api-auth";
import { buildSnapshot } from "@/lib/sync-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns records changed since the `?since=<ISO>` cursor (plus deletions), or
 * the full dataset when `since` is omitted.
 */
export async function GET(request: Request) {
  if (!(await verifyBearer(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sinceRaw = new URL(request.url).searchParams.get("since");
  let since: Date | null = null;
  if (sinceRaw) {
    since = new Date(sinceRaw);
    if (Number.isNaN(since.getTime())) {
      return NextResponse.json(
        { error: "Invalid `since` timestamp" },
        { status: 400 },
      );
    }
  }

  const snapshot = await buildSnapshot(since);
  return NextResponse.json(snapshot);
}
