// GET  /api/sync -> everything the server holds
// POST /api/sync -> push local day records, get the merged result back
//
// When no store is configured this answers 501 with { available: false } and
// the client quietly stays on localStorage only, so a missing env var degrades
// to the old device-local behaviour instead of breaking the app.

import { isAvailable, mergeState, readState } from "@/lib/sync-server";

export const dynamic = "force-dynamic";

const UNAVAILABLE = { available: false, days: {}, scores: {} };

export async function GET() {
  if (!isAvailable()) return Response.json(UNAVAILABLE, { status: 501 });
  try {
    const state = await readState();
    return Response.json({ available: true, ...state });
  } catch (err) {
    console.error("sync read failed", err);
    return Response.json({ available: false, error: "read failed" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!isAvailable()) return Response.json(UNAVAILABLE, { status: 501 });
  try {
    const body = await request.json();
    const days = body?.days && typeof body.days === "object" ? body.days : {};
    const state = await mergeState(days);
    return Response.json({ available: true, ...state });
  } catch (err) {
    console.error("sync write failed", err);
    return Response.json({ available: false, error: "write failed" }, { status: 502 });
  }
}
