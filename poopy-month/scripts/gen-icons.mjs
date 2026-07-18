// Generates the PWA icons from inline SVG. Run: node scripts/gen-icons.mjs
// Design: a cartoon steaming pile of poo (straight-point swirl, white eyes, grin)
// on the brand lime, matching the chosen "Option A".
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const pub = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const INK = "#17140F", BROWN = "#8A5A34", LIME = "#C2F04B";
const tip = "M45 56 Q49 37 59 23 L62 16 L65 23 Q75 37 75 56 Z";
const body =
  '<ellipse cx="60" cy="96" rx="35" ry="15"/>' +
  '<ellipse cx="60" cy="80" rx="30" ry="15"/>' +
  '<ellipse cx="61" cy="65" rx="23" ry="13"/>' +
  '<ellipse cx="60" cy="54" rx="18" ry="11"/>' +
  '<path d="' + tip + '"/>';

const poo =
  '<g fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round">' +
    '<path d="M41 31 q-5 -6 0 -11 q5 -6 0 -11"/>' +
    '<path d="M79 31 q5 -6 0 -11 q-5 -6 0 -11"/></g>' +
  '<g fill="' + INK + '" stroke="' + INK + '" stroke-width="7.5" stroke-linejoin="round" stroke-linecap="round">' + body + '</g>' +
  '<g fill="' + BROWN + '">' + body + '</g>' +
  '<path d="M39 64 q2 -7 9 -9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>' +
  '<ellipse cx="51" cy="64" rx="8" ry="9.5" fill="#fff" stroke="' + INK + '" stroke-width="2.6"/>' +
  '<ellipse cx="69" cy="64" rx="8" ry="9.5" fill="#fff" stroke="' + INK + '" stroke-width="2.6"/>' +
  '<circle cx="52" cy="66" r="4.3" fill="' + INK + '"/><circle cx="70" cy="66" r="4.3" fill="' + INK + '"/>' +
  '<circle cx="50.3" cy="64" r="1.5" fill="#fff"/><circle cx="68.3" cy="64" r="1.5" fill="#fff"/>' +
  '<path d="M47 80 Q60 86 73 80 Q60 99 47 80 Z" fill="#fff" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>';

function svg(scale) {
  const content = scale === 1
    ? poo
    : '<g transform="translate(60,60) scale(' + scale + ') translate(-60,-60)">' + poo + '</g>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">' +
    '<rect width="120" height="120" fill="' + LIME + '"/>' + content + '</svg>';
}

async function out(scale, size, name) {
  await sharp(Buffer.from(svg(scale))).resize(size, size).png().toFile(join(pub, name));
  console.log("wrote", name);
}

// Home-screen / browser icons use the full-bleed art; the maskable one is
// scaled in so nothing important gets clipped by Android's mask.
await out(1, 192, "icon-192.png");
await out(1, 512, "icon-512.png");
await out(1, 180, "apple-touch-icon.png");
await out(0.78, 512, "icon-maskable.png");
console.log("icons done");
