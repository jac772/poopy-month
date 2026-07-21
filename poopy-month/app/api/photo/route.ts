// Photo upload. Images go to Vercel Blob and the day record keeps only the
// returned URL, which is what keeps the synced records small enough to move
// around and stops a month of base64 filling up localStorage.
//
// Without BLOB_READ_WRITE_TOKEN this answers 501 and the client falls back to
// holding the image locally as it always did, so nothing is lost.

import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const devPhotos = new Map<string, { body: Buffer; type: string }>();
const devAllowed = process.env.NODE_ENV !== "production";

function configured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function POST(request: Request) {
  if (!configured() && !devAllowed) {
    return Response.json({ available: false }, { status: 501 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const slot = String(form.get("slot") || "photo").replace(/[^a-z0-9_-]/gi, "");
  const day = String(form.get("day") || "unknown").replace(/[^0-9-]/g, "");

  if (!(file instanceof Blob)) {
    return Response.json({ error: "no file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "too large" }, { status: 413 });
  }

  const name = `poopy/${day}/${slot}.jpg`;

  if (!configured()) {
    // Dev stand-in so the upload path can be exercised without a blob store.
    const body = Buffer.from(await file.arrayBuffer());
    const id = `${day}-${slot}`;
    devPhotos.set(id, { body, type: file.type || "image/jpeg" });
    return Response.json({ available: true, url: `/api/photo?id=${id}`, dev: true });
  }

  // addRandomSuffix keeps a re-shot photo from being served stale out of the
  // blob CDN cache under the same URL.
  const blob = await put(name, file, {
    access: "public",
    contentType: file.type || "image/jpeg",
    addRandomSuffix: true,
  });
  return Response.json({ available: true, url: blob.url });
}

// Serves the dev stand-in photos only. In production the URLs point straight
// at blob storage and never reach this handler.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  const hit = devPhotos.get(id);
  if (!hit) return new Response("not found", { status: 404 });
  return new Response(new Uint8Array(hit.body), {
    headers: { "Content-Type": hit.type, "Cache-Control": "no-store" },
  });
}
