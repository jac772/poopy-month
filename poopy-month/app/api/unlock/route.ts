// Sets the access cookie when the right password is posted. The cookie holds
// a SHA-256 of the password, never the password itself.

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  const password = process.env.SITE_PASSWORD;
  const form = await request.formData();
  const attempt = String(form.get("password") ?? "");

  if (!password || attempt !== password) {
    return Response.redirect(new URL("/unlock?error=1", request.url), 303);
  }

  const hash = await sha256Hex(password);
  // Secure only over https, otherwise the cookie is silently dropped when
  // testing the gate against a local http dev server.
  const secure = new URL(request.url).protocol === "https:" ? " Secure;" : "";
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `poopy-key=${hash}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${60 * 60 * 24 * 90}`
  );
  headers.append("Location", new URL("/", request.url).toString());
  return new Response(null, { status: 303, headers });
}
