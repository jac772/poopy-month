// Server-side store for the day records, so the phone and the web show the
// same thing. Backed by Upstash Redis when the env vars are present.
//
// Shape: one Redis hash, field = day key (YYYY-MM-DD), value = the day record
// with an `updatedAt` stamp. Merging is per day and last-write-wins, which is
// right for a single-user app: whichever device touched a given day most
// recently owns that day, and the other days are untouched.
//
// The month view's score map is NOT stored separately. Each record carries its
// own `score`, so the map is derived on read and cannot drift out of step with
// the records it came from.

import { Redis } from "@upstash/redis";

const DAYS_KEY = "poopy:v1:days";

export type DayRecord = Record<string, unknown> & {
  updatedAt?: number;
  score?: number;
};

export type SyncState = {
  days: Record<string, DayRecord>;
  scores: Record<string, number>;
};

// Vercel's Upstash integration sets KV_* names; a hand-made Upstash database
// sets UPSTASH_*. Accept either so the wiring works whichever route is taken.
function credentials(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

let cached: Redis | null | undefined;
function client(): Redis | null {
  if (cached === undefined) {
    const creds = credentials();
    cached = creds ? new Redis(creds) : null;
  }
  return cached;
}

export function isConfigured(): boolean {
  return client() !== null;
}

// Dev-only stand-in so the sync can be built and exercised without a real
// database. Deliberately NOT used in production: silently accepting writes
// into a process that forgets them on every cold start would look like it is
// working while quietly losing days.
const devDays: Record<string, DayRecord> = {};
const devAllowed = process.env.NODE_ENV !== "production";

export function isAvailable(): boolean {
  return isConfigured() || devAllowed;
}

// A record must never carry an inline base64 image. Photos live in blob
// storage and the record keeps only the URL; without this a month of photos
// would end up inside the day records and blow the request size limit.
function stripInlineImages(record: DayRecord): DayRecord {
  const out: DayRecord = { ...record };
  if (typeof out.photo === "string" && out.photo.startsWith("data:")) {
    delete out.photo;
  }
  const meals = out.meals;
  if (meals && typeof meals === "object") {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(meals as Record<string, unknown>)) {
      if (typeof v === "string" && v.startsWith("data:")) continue;
      clean[k] = v;
    }
    out.meals = clean;
  }
  return out;
}

function scoresFrom(days: Record<string, DayRecord>): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const [key, record] of Object.entries(days)) {
    if (typeof record?.score === "number") scores[key] = record.score;
  }
  return scores;
}

export async function readState(): Promise<SyncState> {
  const redis = client();
  if (!redis) {
    const days = devAllowed ? { ...devDays } : {};
    return { days, scores: scoresFrom(days) };
  }
  const days =
    (await redis.hgetall<Record<string, DayRecord>>(DAYS_KEY)) || {};
  return { days, scores: scoresFrom(days) };
}

// Takes the client's records, keeps whichever version of each day is newer,
// writes back only the days that actually changed, and returns the merged
// state so the caller can render the winning version straight away.
export async function mergeState(
  incoming: Record<string, DayRecord>
): Promise<SyncState> {
  const current = await readState();
  const merged: Record<string, DayRecord> = { ...current.days };
  const changed: Record<string, DayRecord> = {};

  for (const [key, raw] of Object.entries(incoming || {})) {
    if (!raw || typeof raw !== "object") continue;
    const record = stripInlineImages(raw);
    const mine = Number(record.updatedAt) || 0;
    const theirs = Number(merged[key]?.updatedAt) || 0;
    if (mine >= theirs) {
      merged[key] = record;
      changed[key] = record;
    }
  }

  if (Object.keys(changed).length) {
    const redis = client();
    if (redis) await redis.hset(DAYS_KEY, changed);
    else if (devAllowed) Object.assign(devDays, changed);
  }

  return { days: merged, scores: scoresFrom(merged) };
}
