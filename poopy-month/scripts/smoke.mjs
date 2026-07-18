// Client smoke test: bundle the real app and run mountPoopy against a jsdom DOM.
import { JSDOM } from "jsdom";
import { build } from "esbuild";
import { writeFileSync } from "node:fs";
import assert from "node:assert";

const res = await build({
  entryPoints: ["lib/poopy-app.ts"],
  bundle: true, format: "esm", write: false, platform: "browser", logLevel: "silent",
});
writeFileSync("/tmp/poopy-bundle.mjs", res.outputFiles[0].text);

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: "https://localhost/", pretendToBeVisual: true });
const { window } = dom;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};

globalThis.window = window;
globalThis.document = window.document;
globalThis.localStorage = window.localStorage;
globalThis.FileReader = window.FileReader;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.setInterval = () => 0;

const mod = await import("/tmp/poopy-bundle.mjs");
const root = window.document.getElementById("root");
mod.mountPoopy(root);

assert.ok(root.querySelector("#timeline").children.length > 0, "timeline rendered");
assert.equal(root.querySelectorAll("#gaugeSvg .tick").length, 52, "gauge has 52 ticks");
assert.equal(root.querySelector("#grid").children.length, 30, "month has 30 cells");
assert.equal(root.querySelectorAll(".mood-btn").length, 5, "5 mood buttons");
assert.ok(root.querySelector("#bell").querySelector("svg"), "bell icon rendered");
assert.ok(root.querySelector("#badge").textContent.length > 0, "badge set");

const before = root.querySelector("#pctNum").textContent;
root.querySelector(".block .check").dispatchEvent(new window.Event("click", { bubbles: true }));
const after = Number(root.querySelector("#pctNum").textContent);
assert.ok(after >= 8, `score rose after completing first task (${before} -> ${after})`);

// expand a block with a panel (first block that has one)
const expandable = [...root.querySelectorAll(".block")].find((b) => b.querySelector(".panel"));
expandable.querySelector(".meta").dispatchEvent(new window.Event("click", { bubbles: true }));
assert.ok(expandable.classList.contains("open"), "block expands on tap");
assert.ok(expandable.querySelector(".pin").children.length > 0, "panel filled with content");

// switch tabs
root.querySelectorAll("#tabs button")[1].dispatchEvent(new window.Event("click", { bubbles: true }));
assert.ok(root.querySelector("#view-month").classList.contains("active"), "month tab activates");

console.log(`smoke OK: timeline=${root.querySelector("#timeline").children.length} blocks, ticks=52, grid=30, score ${before}->${after}, badge="${root.querySelector("#badge").textContent}"`);
process.exit(0);
