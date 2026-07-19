// Poopy Month - pure data and logic (no DOM). Testable in node.

/* ---------- icons (lucide-style path data) ---------- */
export const I = {
  wake:'<path d="M12 3v2M5 8l1.4 1.4M19 8l-1.4 1.4M3 14h18M6 18h12M8 14a4 4 0 0 1 8 0"/>',
  walk:'<circle cx="13" cy="4.2" r="1.6"/><path d="M11 21l1.5-5-2.5-2 1-5 3 2 2 1M7.5 21l2-4"/>',
  pen:'<path d="M12 19l7-7a2.5 2.5 0 0 0-3.5-3.5l-7 7L7 19z"/><path d="M15 6l3 3"/>',
  work:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
  coffeeoff:'<path d="M4 8h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M16 9h2a2 2 0 0 1 0 4h-1M3 3l18 18"/>',
  pause:'<rect x="7" y="5" width="3.4" height="14" rx="1.2"/><rect x="13.6" y="5" width="3.4" height="14" rx="1.2"/>',
  gym:'<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  food:'<path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10M17 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v9"/>',
  pill:'<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M8.5 8.5l7 7"/>',
  book:'<path d="M12 6C10 4 6 4 4 5v13c2-1 6-1 8 1 2-2 6-2 8-1V5c-2-1-6-1-8 1zM12 6v13"/>',
  phoneoff:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2M4 4l16 16"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>',
  droplet:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  check:'<path d="M4 12l5 5L20 6"/>',
  camera:'<rect x="3" y="7" width="18" height="14" rx="3"/><circle cx="12" cy="14" r="4"/><path d="M8 7l1.5-3h5L16 7"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',
  edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  flame:'<path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1 1-1.5 1-1.5 1.5 2 2 3 2 5a5 5 0 0 1-10 0c0-4 3-6 5-10.5z"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 6 2 8 2 8H4s2-2 2-8"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0"/>'
};

export const TILE = {anchor:'var(--purple-soft)',move:'var(--lime)',deep:'var(--peach)',fuel:'var(--sky)',brk:'#E7E2D6'};

/* ---------- day plans ---------- */
export const PLAN_WEEKDAY = [
 {id:'wake',t:'05:30',e:'05:45',ic:'wake',cat:'anchor',name:'Wake and hydrate',desc:'500ml water. No phone. Curtains open.',pts:8},
 {id:'walk',t:'05:45',e:'06:00',ic:'walk',cat:'move',name:'Walk and sunlight',desc:'Short walk, daylight in the eyes. Fruit or a smoothie.',pts:5},
 {id:'cre1',t:'06:00',e:'08:00',ic:'pen',cat:'deep',name:'Creative block 1',desc:'Two hours on the OS build. Deepest work, freshest head.',pts:10},
 {id:'bkfst',t:'08:00',e:'08:45',ic:'food',cat:'brk',name:'Breakfast and shower',desc:'',pts:0,routine:true},
 {id:'suppAM',t:'08:45',e:'09:00',ic:'pill',cat:'fuel',name:'Supplements (AM)',desc:'Vitamin D, vitamin C, creatine.',pts:3,expand:'supps'},
 {id:'sashAM',t:'09:00',e:'13:00',ic:'work',cat:'deep',name:'Sashed work',desc:'One block. Meetings drop in from your Sash calendar, fill the gaps with quoting and calls.',pts:5,expand:'work'},
 {id:'caff',t:'11:30',e:'11:30',ic:'coffeeoff',cat:'fuel',name:'No caffeine after 11:30',desc:'Last coffee is behind you.',pts:4,pin:true},
 {id:'midday',t:'13:00',e:'13:45',ic:'pause',cat:'brk',name:'Midday break',desc:'Walk or a short sleep. Off your feet, off the screen.',pts:3},
 {id:'sashPM',t:'13:45',e:'16:30',ic:'work',cat:'deep',name:'Sashed work',desc:'Second work block through to gym.',pts:5,expand:'work'},
 {id:'gym',t:'16:30',e:'17:45',ic:'gym',cat:'move',name:'Training',desc:'Today of session. Tap to open.',pts:12,expand:'gym'},
 {id:'shower',t:'17:45',e:'18:00',ic:'droplet',cat:'brk',name:'Shower',desc:'',pts:0,routine:true},
 {id:'dinner',t:'18:00',e:'18:45',ic:'food',cat:'fuel',name:'Dinner and diet check',desc:'Carnivore adaptation. Confirm you stayed on plan.',pts:8,expand:'diet'},
 {id:'cre2',t:'18:45',e:'20:30',ic:'pen',cat:'deep',name:'Creative block 2',desc:'Second two hours on the OS build.',pts:10},
 {id:'read',t:'20:30',e:'21:15',ic:'book',cat:'brk',name:'Reading and writing',desc:'Buffer for planning, reading, journaling.',pts:4},
 {id:'phone',t:'20:30',e:'20:30',ic:'phoneoff',cat:'anchor',name:'Phone off',desc:'Down for the night by 8:30pm.',pts:5,pin:true},
 {id:'suppPM',t:'21:15',e:'21:30',ic:'pill',cat:'fuel',name:'Wind down and magnesium',desc:'Magnesium glycinate. Lights low.',pts:3,expand:'suppsPM'},
 {id:'sleep',t:'21:30',e:'21:30',ic:'moon',cat:'anchor',name:'Sleep',desc:'Asleep by 9:30pm. That is the whole game.',pts:8,pin:true}
];
export const PLAN_SUNDAY = [
 {id:'su_wake',t:'05:30',e:'05:45',ic:'wake',cat:'anchor',name:'Wake and hydrate',desc:'500ml water. No phone. Curtains open.',pts:8},
 {id:'su_walk',t:'05:45',e:'06:00',ic:'walk',cat:'move',name:'Walk and sunlight',desc:'Short walk, daylight in the eyes.',pts:5},
 {id:'su_reflect',t:'06:00',e:'07:30',ic:'book',cat:'deep',name:'Reflect and read',desc:'Slower start. Journal and read, no screens.',pts:9},
 {id:'su_bkfst',t:'07:30',e:'08:15',ic:'food',cat:'brk',name:'Breakfast and shower',desc:'',pts:0,routine:true},
 {id:'su_suppAM',t:'08:15',e:'08:30',ic:'pill',cat:'fuel',name:'Supplements (AM)',desc:'Vitamin D, vitamin C, creatine.',pts:3,expand:'supps'},
 {id:'su_mealprep',t:'08:30',e:'11:00',ic:'food',cat:'fuel',name:'Meal prep for the week',desc:'Cook and portion the week of meals.',pts:12,expand:'mealprep'},
 {id:'su_portion',t:'11:00',e:'11:30',ic:'pill',cat:'fuel',name:'Portion supplements and meat check',desc:'Bag the week of stacks. Confirm the meat delivery.',pts:5,expand:'portion'},
 {id:'su_caff',t:'11:30',e:'11:30',ic:'coffeeoff',cat:'fuel',name:'No caffeine after 11:30',desc:'Last coffee is behind you.',pts:4,pin:true},
 {id:'su_move',t:'11:30',e:'12:30',ic:'walk',cat:'move',name:'Long walk or mobility',desc:'Easy movement only. No hard session on rest day.',pts:7},
 {id:'su_lunch',t:'12:30',e:'13:15',ic:'food',cat:'brk',name:'Lunch',desc:'',pts:0,routine:true},
 {id:'su_rest',t:'13:15',e:'14:00',ic:'pause',cat:'brk',name:'Rest',desc:'Off your feet. A nap or quiet time.',pts:3},
 {id:'su_plan',t:'14:00',e:'16:00',ic:'pen',cat:'deep',name:'Week review and plan',desc:'Review last week. Plan next week and set your focus.',pts:10,expand:'planning'},
 {id:'su_family',t:'16:00',e:'17:30',ic:'moon',cat:'brk',name:'Family and rest',desc:'',pts:0,routine:true},
 {id:'su_read',t:'17:30',e:'18:00',ic:'book',cat:'brk',name:'Reading and journal',desc:'Slow wind toward the evening.',pts:3},
 {id:'su_dinner',t:'18:00',e:'18:45',ic:'food',cat:'fuel',name:'Dinner and diet check',desc:'Carnivore adaptation. Confirm you stayed on plan.',pts:8,expand:'diet'},
 {id:'su_wind',t:'18:45',e:'20:30',ic:'moon',cat:'brk',name:'Wind down and rest',desc:'',pts:0,routine:true},
 {id:'su_phone',t:'20:30',e:'20:30',ic:'phoneoff',cat:'anchor',name:'Phone off',desc:'Down for the night by 8:30pm.',pts:5,pin:true},
 {id:'su_suppPM',t:'21:15',e:'21:30',ic:'pill',cat:'fuel',name:'Magnesium and lights low',desc:'Magnesium glycinate. Lights low.',pts:3,expand:'suppsPM'},
 {id:'su_sleep',t:'21:30',e:'21:30',ic:'moon',cat:'anchor',name:'Sleep',desc:'Asleep by 9:30pm.',pts:8,pin:true}
];

export const CHECKLISTS = {
  mealprep:['Cook the week of meat','Portion into containers','Prep grab-and-go breakfasts','Label and fridge'],
  portion:['Bag Monday to Saturday stacks','Refill the creatine tub','Confirm next week of meat delivery'],
  planning:['Review last week of scores','Block next week in the calendar','Set next week of focus','Reorder anything running low']
};
export const EXTRA = {photo:4,reflect:3};
export const SUPPS_AM = [{n:'Vitamin D3',tag:'with fat'},{n:'Vitamin C',tag:''},{n:'Creatine 5g',tag:'daily'}];
export const SUPPS_PM = [{n:'Magnesium glycinate',tag:'evening'}];
export const GYM_CODE = '08086484'; // gym entry code

/* ---------- training: 3 lifting days, 3 cardio days, legs on Saturday ---------- */
export const LIFTS = {
  push: [
    {n:'Barbell bench press',s:'4 x 6'},{n:'Standing overhead press',s:'3 x 8'},
    {n:'Incline dumbbell press',s:'3 x 10'},{n:'Lateral raise',s:'3 x 15'},
    {n:'Triceps rope pushdown',s:'3 x 12'},{n:'Overhead triceps extension',s:'3 x 12'}
  ],
  pull: [
    {n:'Deadlift',s:'4 x 5'},{n:'Pull-up',s:'4 x 8'},
    {n:'Barbell row',s:'3 x 8'},{n:'Seated cable row',s:'3 x 10'},
    {n:'Face pull',s:'3 x 15'},{n:'Barbell curl',s:'3 x 12'}
  ],
  legs: [
    {n:'Back squat',s:'4 x 6'},{n:'Romanian deadlift',s:'3 x 8'},
    {n:'Leg press',s:'3 x 10'},{n:'Bulgarian split squat',s:'3 x 10'},
    {n:'Leg curl',s:'3 x 12'},{n:'Standing calf raise',s:'4 x 15'},
    {n:'Hanging leg raise',s:'3 x 15'}
  ]
};
export const CARDIO_TYPES = ['Running','Cycling','Other'];
export const CARDIO_MINS = 60;

// Keyed by day of week: 1 = Monday ... 6 = Saturday. Sunday rests.
export const TRAINING = {
  1:{kind:'cardio',label:'Cardio: 60 mins',desc:'Run, cycle or your choice. Log the type and distance.'},
  2:{kind:'gym',key:'push',label:'Gym: Push',desc:'Chest, shoulders and triceps. Tap to open your lifts.'},
  3:{kind:'cardio',label:'Cardio: 60 mins',desc:'Run, cycle or your choice. Log the type and distance.'},
  4:{kind:'gym',key:'pull',label:'Gym: Pull',desc:'Back and biceps. Tap to open your lifts.'},
  5:{kind:'cardio',label:'Cardio: 60 mins',desc:'Run, cycle or your choice. Log the type and distance.'},
  6:{kind:'gym',key:'legs',label:'Gym: Legs',desc:'The big one. Warm up properly, you have the time.'}
};
export function trainingFor(dt){ return TRAINING[dt.getDay()] || null; }
export const DIET_YES = ['Meat, all cuts','Fish and eggs','Hard cheese','Full-fat yoghurt','Fruit','Black coffee','Water and salt'];
export const DIET_NO = ['Sugar','Bread, grains, pasta','Seed oils','Processed food','Alcohol','Soft drinks'];
export const MOODS = [{k:1,l:'Rough',c:'var(--coral)',m:'sad'},{k:2,l:'Low',c:'#E7A24B',m:'meh'},{k:3,l:'Okay',c:'#E6D9A0',m:'flat'},{k:4,l:'Good',c:'var(--mint)',m:'ok'},{k:5,l:'Sharp',c:'var(--lime)',m:'grin'}];
export const MEET_AM = [{n:'Team standup',t:'09:00'},{n:'Site call: Pembridge',t:'10:30'}];
export const MEET_PM = [{n:'Showroom: Weatherston',t:'14:00'}];
export const WORK_TASKS = ['Quote the Bolsover package','Chase two open quotes','Return calls'];
export const NN_WEEKDAY = [['Wake 05:30','wake'],['Creative block 1','cre1'],['Sashed work','sashAM'],['Training','gym'],['Creative block 2','cre2'],['Diet on plan','dinner'],['Sleep by 21:30','sleep']];
export const NN_SUNDAY = [['Wake 05:30','su_wake'],['Reflect and read','su_reflect'],['Meal prep','su_mealprep'],['Week plan','su_plan'],['Diet on plan','su_dinner'],['Sleep by 21:30','su_sleep']];

/* ---------- calendar ---------- */
// Poopy Month runs Monday 20 July 2026 for 30 days (to Wednesday 19 August).
export const START_Y = 2026, START_M = 6, START_D = 20; // month 6 = July
export const DAYS = 30;
export const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function ymd(dt){return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');}
export function idxFromStart(dt){return Math.round((Date.UTC(dt.getFullYear(),dt.getMonth(),dt.getDate())-Date.UTC(START_Y,START_M,START_D))/86400000);}
export function dateAtIndex(i){return new Date(START_Y,START_M,START_D+i);}
export function keyAtIndex(i){return ymd(dateAtIndex(i));}
export function dateLabelIndex(i){const d=dateAtIndex(i);return WD[d.getDay()]+' '+d.getDate()+' '+MON[d.getMonth()];}
export function planForIndex(i){return dateAtIndex(i).getDay()===0?PLAN_SUNDAY:PLAN_WEEKDAY;}
export function planForDate(dt){return dt.getDay()===0?PLAN_SUNDAY:PLAN_WEEKDAY;}
export function nnForPlan(plan){return plan===PLAN_SUNDAY?NN_SUNDAY:NN_WEEKDAY;}

/* ---------- scoring ---------- */
export function scoreFor(state, plan){
  let s = 0; const done = (state && state.done) || {};
  plan.forEach(p => { if (p.pts > 0 && done[p.id]) s += p.pts; });
  if (state && state.photo) s += EXTRA.photo;
  const n = state && state.notes;
  if (n && (n.done || n.felt || n.change)) s += EXTRA.reflect;
  return Math.min(100, s);
}
export function doneCountFor(state, plan){
  let c = 0, tot = 0; const done = (state && state.done) || {};
  plan.forEach(p => { if (p.pts > 0) { tot++; if (done[p.id]) c++; } });
  return c + '/' + tot;
}
export function missedNames(state, nn){
  const done = (state && state.done) || {};
  return nn.filter(x => !done[x[1]]).map(x => x[0]);
}
export function colFor(v){ return v>=95?'var(--lime)':v>=85?'var(--mint)':v>=70?'var(--peach)':'var(--coral)'; }

// value for a month cell: live for today, stored score for logged days, 0 for a passed day with no data, null for the future.
export function monthVal(i, scores, todayIdx, liveScore){
  if (i === todayIdx) return liveScore;
  const k = keyAtIndex(i);
  if (scores[k] != null) return scores[k];
  if (i < todayIdx) return 0;
  return null;
}
// consecutive days scoring 80+, counting back from today (today counts only once it crosses 80).
export function streakFrom(scores, todayIdx, liveScore){
  let start = liveScore >= 80 ? todayIdx : todayIdx - 1;
  let s = 0;
  for (let i = start; i >= 0; i--){
    const v = (i === todayIdx) ? liveScore : (scores[keyAtIndex(i)] != null ? scores[keyAtIndex(i)] : 0);
    if (v >= 80) s++; else break;
  }
  return s;
}
