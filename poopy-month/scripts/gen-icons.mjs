// Generates the PWA icons from inline SVG. Run: node scripts/gen-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const pub = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

// Full-bleed lime tile with a bold ink check (brand: completion).
const base = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#C2F04B"/>
  <path d="M148 262 l72 74 l144 -158" fill="none" stroke="#17140F" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Maskable: same mark inside the safe zone (more padding around the edges).
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#C2F04B"/>
  <path d="M178 264 l58 60 l118 -128" fill="none" stroke="#17140F" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

async function out(svg, size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(pub, name));
  console.log("wrote", name);
}

await out(base, 192, "icon-192.png");
await out(base, 512, "icon-512.png");
await out(base, 180, "apple-touch-icon.png");
await out(maskable, 512, "icon-maskable.png");
console.log("icons done");
