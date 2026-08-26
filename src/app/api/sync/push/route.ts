import { NextResponse } from "next/server";

import { verifyBearer } from "@/lib/api-auth";
import { applyPush } from "@/lib/sync-server";
import type { SyncPushRequest } from "@/lib/sync-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Applies a batch of client changes (upsert by uuid) and deletions. */
export async function POST(request: Request) {
  if (!(await verifyBearer(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const result = await applyPush(body as SyncPushRequest);
    return NextResponse.json(result);
  } catch (err) {
    console.error("sync push failed:", err);
    return NextResponse.json({ error: "Push failed" }, { status: 500 });
  }
}
