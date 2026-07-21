// Client half of the sync. Rules it follows, in order of importance:
//
// 1. localStorage stays the thing the UI reads and writes. Every tick is saved
//    locally first and instantly, so the app is never waiting on a network and
//    still works with no signal.
// 2. The server is a background mirror. Pushes are debounced and failures are
//    swallowed, because a dropped sync must never cost you a tick.
// 3. Pulling happens on load and whenever the app comes back to the front,
//    which is the moment that actually matters: picking up the laptop after
//    using the phone.

type DayRecord = Record<string, any>;

const PUSH_DELAY = 900;
const POLL_INTERVAL = 60000;

export type SyncDeps = {
  // Current day key and record, read fresh each time so we always send the
  // latest version rather than a snapshot captured at wiring time.
  dayKey: () => string;
  record: () => DayRecord;
  // Called with the server's copy of the current day when it is newer than
  // ours.
  onRemoteDay: (record: DayRecord) => void;
  // Called with every day the server holds, so past days can be filled in
  // locally. The month view reads those straight out of localStorage.
  onRemoteDays: (days: Record<string, DayRecord>, scores: Record<string, number>) => void;
  // Every day record held locally. Used once per load to upload history that
  // was recorded before this sync existed.
  localDays?: () => Record<string, DayRecord>;
};

export type Sync = {
  push: () => void;
  pull: () => void;
  uploadPhoto: (dataUrl: string, slot: string, day?: string) => Promise<string | null>;
};

// A photo that has not been uploaded yet is still a base64 data URL sitting in
// the record. Never put that on the wire: it would be a few hundred KB per
// request and the server drops it anyway.
function withoutInlineImages(record: DayRecord): DayRecord {
  const out: DayRecord = { ...record };
  if (typeof out.photo === "string" && out.photo.startsWith("data:")) delete out.photo;
  if (out.meals && typeof out.meals === "object") {
    const meals: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(out.meals as Record<string, unknown>)) {
      if (typeof v === "string" && v.startsWith("data:")) continue;
      meals[k] = v;
    }
    out.meals = meals;
  }
  return out;
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [head, body] = dataUrl.split(",");
    const type = /:(.*?);/.exec(head)?.[1] || "image/jpeg";
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type });
  } catch {
    return null;
  }
}

export function createSync(deps: SyncDeps): Sync {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let pending = false;
  // Once the server has told us it has no store, stop asking. Otherwise every
  // tick fires a doomed request for the rest of the session.
  let disabled = false;

  function applyRemote(data: any) {
    if (!data || data.available === false) {
      disabled = true;
      return;
    }
    const key = deps.dayKey();
    const days = data.days || {};
    const remote = days[key];
    const mine = Number(deps.record()?.updatedAt) || 0;
    if (remote && (Number(remote.updatedAt) || 0) > mine) deps.onRemoteDay(remote);
    deps.onRemoteDays(days, data.scores || {});
  }

  async function post(days: Record<string, DayRecord>): Promise<any | null> {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    if (res.status === 501) {
      disabled = true;
      return null;
    }
    return res.ok ? res.json() : null;
  }

  async function send() {
    if (disabled) return;
    if (inFlight) {
      pending = true;
      return;
    }
    inFlight = true;
    try {
      const data = await post({
        [deps.dayKey()]: withoutInlineImages(deps.record()),
      });
      if (data) applyRemote(data);
    } catch {
      // Offline or the request failed. The local save already happened and the
      // next tick will push again, so there is nothing to recover here.
    } finally {
      inFlight = false;
      if (pending) {
        pending = false;
        send();
      }
    }
  }

  // One-time upload of days this device holds that the server has never seen,
  // for history recorded before the sync existed. Strictly gap filling: a day
  // the server already knows about is left alone, so this can never overwrite
  // something another device put there.
  let backfilled = false;
  async function backfill(serverDays: Record<string, DayRecord>) {
    if (backfilled || disabled || !deps.localDays) return;
    backfilled = true;

    let local: Record<string, DayRecord> = {};
    try {
      local = deps.localDays() || {};
    } catch {
      return;
    }

    const gaps: Record<string, DayRecord> = {};
    for (const [key, rec] of Object.entries(local)) {
      if (!rec || typeof rec !== "object") continue;
      if (serverDays[key]) continue;
      gaps[key] = rec;
    }
    const keys = Object.keys(gaps);
    if (!keys.length) return;

    // Lift any inline photos into blob storage first, otherwise they would be
    // stripped on the way out and the history would arrive without pictures.
    // A failed upload just means that one photo stays on this device.
    for (const key of keys) {
      const rec = gaps[key];
      if (typeof rec.photo === "string" && rec.photo.startsWith("data:")) {
        const url = await uploadPhoto(rec.photo, "photo", key);
        if (url) rec.photo = url;
      }
      const meals = rec.meals as Record<string, unknown> | undefined;
      if (meals && typeof meals === "object") {
        for (const [slot, val] of Object.entries(meals)) {
          if (typeof val === "string" && val.startsWith("data:")) {
            const url = await uploadPhoto(val, "meal-" + slot, key);
            if (url) meals[slot] = url;
          }
        }
      }
    }

    try {
      const payload: Record<string, DayRecord> = {};
      for (const key of keys) payload[key] = withoutInlineImages(gaps[key]);
      const data = await post(payload);
      if (data) applyRemote(data);
    } catch {
      // Leave backfilled set: a half-finished upload should not retry in a
      // loop. The next load will pick up whatever is still missing.
    }
  }

  function push() {
    if (disabled) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(send, PUSH_DELAY);
  }

  async function pull() {
    if (disabled) return;
    try {
      const res = await fetch("/api/sync", { cache: "no-store" });
      if (res.status === 501) {
        disabled = true;
        return;
      }
      if (res.ok) {
        const data = await res.json();
        applyRemote(data);
        if (data?.available !== false) await backfill(data.days || {});
      }
    } catch {
      // Same as above: a failed pull just leaves the local copy showing.
    }
  }

  async function uploadPhoto(
    dataUrl: string,
    slot: string,
    day?: string
  ): Promise<string | null> {
    if (!dataUrl.startsWith("data:")) return dataUrl;
    const blob = dataUrlToBlob(dataUrl);
    if (!blob) return null;
    const form = new FormData();
    form.append("file", blob, `${slot}.jpg`);
    form.append("slot", slot);
    form.append("day", day || deps.dayKey());
    try {
      const res = await fetch("/api/photo", { method: "POST", body: form });
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data?.url === "string" ? data.url : null;
    } catch {
      return null;
    }
  }

  if (typeof document !== "undefined") {
    // Coming back to the app is the moment that matters: picking up the laptop
    // after ticking things off on the phone.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") pull();
    });
    window.addEventListener("online", () => {
      pull();
      send();
    });
    // Safety net for the screen that is already open and never refocused, such
    // as the laptop sitting on the desk while the phone is the one being used.
    // One read a minute is nothing against the Upstash free tier.
    setInterval(pull, POLL_INTERVAL);
  }

  return { push, pull, uploadPhoto };
}
