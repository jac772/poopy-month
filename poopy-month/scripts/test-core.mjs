// Unit tests for the pure core logic. Run: node scripts/test-core.mjs
import assert from "node:assert";
import * as C from "../lib/poopy-core.mjs";

let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };

// --- calendar indexing (start = Mon 20 Jul 2026) ---
ok(C.idxFromStart(new Date(2026, 6, 20)) === 0, "20 Jul is index 0");
ok(C.idxFromStart(new Date(2026, 6, 22)) === 2, "22 Jul is index 2");
ok(C.idxFromStart(new Date(2026, 7, 18)) === 29, "18 Aug is index 29");
ok(C.idxFromStart(new Date(2026, 6, 18)) === -2, "18 Jul is before start");
ok(C.dateAtIndex(0).getDay() === 1, "day 1 is a Monday");
ok(C.dateAtIndex(6).getDay() === 0, "day 7 is a Sunday");

// --- weights sum to 100 on both templates ---
function fullState(plan) {
  const done = {};
  plan.forEach((p) => { done[p.id] = true; });
  return { done, photo: "x", notes: { done: "a", felt: "b", change: "c" } };
}
ok(C.scoreFor(fullState(C.PLAN_WEEKDAY), C.PLAN_WEEKDAY) === 100, "weekday full = 100");
ok(C.scoreFor(fullState(C.PLAN_SUNDAY), C.PLAN_SUNDAY) === 100, "sunday full = 100");
ok(C.scoreFor({ done: {} }, C.PLAN_WEEKDAY) === 0, "empty = 0");

// --- diet worth 8: missing it drops a full day to 92 ---
const noDiet = fullState(C.PLAN_WEEKDAY);
delete noDiet.done.dinner;
ok(C.scoreFor(noDiet, C.PLAN_WEEKDAY) === 92, "no diet = 92");

// --- doneCount ---
ok(C.doneCountFor({ done: {} }, C.PLAN_WEEKDAY).endsWith("/14"), "weekday has 14 scored tasks");

// --- month cell values ---
const scores = {};
scores[C.keyAtIndex(0)] = 96;
scores[C.keyAtIndex(1)] = 88;
ok(C.monthVal(0, scores, 2, 70) === 96, "logged past day shows its score");
ok(C.monthVal(2, scores, 2, 70) === 70, "today shows the live score");
ok(C.monthVal(5, scores, 2, 70) === null, "future day is blank");
ok(C.monthVal(1, {}, 2, 70) === 0, "passed day with no data is 0");

// --- streak (a day counts at 80+) ---
ok(C.streakFrom(scores, 2, 85) === 3, "two good days plus a good today = 3");
ok(C.streakFrom(scores, 2, 50) === 2, "low today keeps the two logged days");
const broken = { [C.keyAtIndex(0)]: 96, [C.keyAtIndex(1)]: 40 };
ok(C.streakFrom(broken, 2, 90) === 1, "a sub-80 day breaks the streak");
ok(C.streakFrom({}, -2, 0) === 0, "before the month starts, streak is 0");

// --- training split: alternates cardio/gym from Monday, legs Sat, Sunday rests ---
ok(C.trainingFor(new Date(2026, 6, 20)).kind === "cardio", "Monday is cardio");
ok(C.trainingFor(new Date(2026, 6, 21)).key === "push", "Tuesday is push");
ok(C.trainingFor(new Date(2026, 6, 22)).kind === "cardio", "Wednesday is cardio");
ok(C.trainingFor(new Date(2026, 6, 23)).key === "pull", "Thursday is pull");
ok(C.trainingFor(new Date(2026, 6, 24)).kind === "cardio", "Friday is cardio");
ok(C.trainingFor(new Date(2026, 6, 25)).key === "legs", "Saturday is legs");
ok(C.trainingFor(new Date(2026, 6, 26)) === null, "Sunday has no training session");
ok(C.LIFTS.push.length > 0 && C.LIFTS.pull.length > 0 && C.LIFTS.legs.length > 0, "all three lift lists exist");
ok(C.CARDIO_TYPES.length === 3 && C.CARDIO_MINS === 60, "cardio is 60 mins with three types");

// --- non-negotiables ---
ok(C.nnForPlan(C.PLAN_SUNDAY) === C.NN_SUNDAY, "sunday uses the sunday non-negotiables");
ok(C.missedNames({ done: { wake: true } }, C.NN_WEEKDAY).length === C.NN_WEEKDAY.length - 1, "one hit, rest missed");

console.log("all " + n + " core tests passed");
