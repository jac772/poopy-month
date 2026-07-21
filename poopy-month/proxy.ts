// Optional password gate for the whole app. Set SITE_PASSWORD in Vercel to
// turn it on. Without the env var the app is open, so local dev just works.

import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "poopy-key";

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time compare of two equal-length hex strings, so a wrong cookie
// cannot be narrowed down byte by byte through response timing.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const expected = await sha256Hex(password);
  const cookie = request.cookies.get(COOKIE)?.value;
  if (cookie && safeEqual(cookie, expected)) return NextResponse.next();

  return NextResponse.redirect(new URL("/unlock", request.url));
}

export const config = {
  // Everything except the unlock flow, Next internals, and any file with an
  // extension. That last rule keeps the PWA working while locked: the service
  // worker, manifest and icons must stay reachable or install/registration
  // fails on a redirect.
  matcher: ["/((?!_next/static|_next/image|unlock|api/unlock|.*\\..*).*)"],
};
