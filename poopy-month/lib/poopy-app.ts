// @ts-nocheck
// Poopy Month - DOM app. Mounts the whole UI into a container and wires all behaviour.
// Pure data and logic live in ./poopy-core.mjs so they can be unit tested.
import * as C from './poopy-core.mjs';

const {
  I, TILE, PLAN_WEEKDAY, PLAN_SUNDAY, CHECKLISTS, EXTRA, SUPPS_AM, SUPPS_PM, GYM,
  DIET_YES, DIET_NO, MOODS, MEET_AM, MEET_PM, WORK_TASKS, NN_WEEKDAY, NN_SUNDAY, DAYS,
  ymd, idxFromStart, dateAtIndex, keyAtIndex, dateLabelIndex, planForIndex, nnForPlan,
  scoreFor, doneCountFor, missedNames, colFor, monthVal, streakFrom
} = C;

function svg(n, e){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" ' + (e || '') + '>' + I[n] + '</svg>';
}

const TEMPLATE = `
<div class="wrap">
  <svg id="swirl" viewBox="0 0 400 400" aria-hidden="true"></svg>
  <div class="layer">
    <header class="top">
      <div class="wordmark"><b>Poopy</b> Month</div>
      <div class="daychip">
        <button class="bellbtn" id="bell" aria-label="Phone alerts"></button>
        <div class="badge" id="badge"></div>
        <div class="streak"><span class="fl" id="flame"></span><span id="streakN">0</span></div>
      </div>
    </header>

    <section class="view active" id="view-today">
      <div class="gauge-wrap">
        <div class="gauge">
          <div class="orb" style="width:26px;height:26px;top:16px;right:44px;"></div>
          <div class="orb" style="width:20px;height:20px;bottom:38px;left:30px;"></div>
          <svg id="gaugeSvg" viewBox="0 0 250 250"></svg>
          <div class="center">
            <div class="pct"><span id="pctNum">0</span><small>%</small></div>
            <div class="clab">Done today</div>
          </div>
        </div>
      </div>
      <div class="seclbl">Today's plan <span class="cnt" id="doneCount">0/17</span></div>
      <div class="timeline" id="timeline"></div>
      <div class="tip"><b>Every block is 15 minutes.</b> Tap a block to open it, tap the square to complete it. Your Sash meetings drop into the work blocks once your Google calendars are connected.</div>
    </section>

    <section class="view" id="view-month">
      <div class="seclbl" style="margin-top:16px">The month</div>
      <div class="cal-head">
        <h2 id="calTitle">July</h2>
        <div class="avg"><span>30-day avg</span><b id="avg">--</b></div>
      </div>
      <p class="monthnote">Runs Monday 20 July for 30 days. Each day scores out of 100, weighted by what matters. A day at 80 or above keeps your streak alive.</p>
      <div class="dow"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
      <div class="grid" id="grid"></div>
      <div class="legend">
        <div class="li"><span class="sq" style="background:var(--lime)"></span>95+</div>
        <div class="li"><span class="sq" style="background:var(--mint)"></span>85-94</div>
        <div class="li"><span class="sq" style="background:var(--peach)"></span>70-84</div>
        <div class="li"><span class="sq" style="background:var(--coral)"></span>under 70</div>
      </div>
    </section>

    <section class="view" id="view-record">
      <div class="seclbl" id="recDay" style="margin-top:16px">Daily record</div>
      <div class="reflect">
        <label class="photo" id="photo">
          <input type="file" accept="image/*" capture="user" id="photoInput" hidden>
          <div id="photoPh" style="display:flex;flex-direction:column;align-items:center;gap:10px">
            <span id="camIcon"></span>
            <span class="pt">Today's photo</span>
            <span class="ps">One shot of you, every day</span>
          </div>
        </label>
        <div>
          <div class="fldlbl">How I feel</div>
          <div class="mood-row" id="mood"></div>
        </div>
        <div class="field"><div class="fldlbl">What got done</div><textarea id="n-done" placeholder="The wins that count."></textarea></div>
        <div class="field"><div class="fldlbl">Body and head</div><textarea id="n-felt" placeholder="Energy, sleep, focus, cravings."></textarea></div>
        <div class="field"><div class="fldlbl">Change tomorrow</div><textarea id="n-change" placeholder="One adjustment."></textarea></div>
        <button class="bigbtn" id="saveBtn">Save today's record</button>
        <div class="save-note" id="savedNote"></div>
      </div>
    </section>

    <nav class="tabs" id="tabs">
      <button data-tab="today" class="active"><span class="ti"></span>Today</button>
      <button data-tab="month"><span class="ti"></span>Month</button>
      <button data-tab="record"><span class="ti"></span>Record</button>
    </nav>
  </div>
  <div class="modal" id="dayModal"><div class="scrim" id="scrim"></div><div class="sheet" id="sheet"></div></div>
</div>`;

export function mountPoopy(root){
  root.innerHTML = TEMPLATE;
  const $ = (id) => root.querySelector('#' + id);

  /* ---------- calendar context (real dates) ---------- */
  const TODAY = new Date();
  const TODAY_IDX = idxFromStart(TODAY);
  const TODAY_KEY = ymd(TODAY);
  const started = TODAY_IDX >= 0 && TODAY_IDX < DAYS;
  let PLAN = (TODAY.getDay() === 0) ? PLAN_SUNDAY : PLAN_WEEKDAY;

  /* ---------- state (one record per calendar day) ---------- */
  const KEY = 'poopy:v1:' + TODAY_KEY;
  const SCORES_KEY = 'poopy:v1:scores';
  function readJSON(k){ try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function normalize(s){ s.done=s.done||{}; s.supp=s.supp||{}; s.gymSets=s.gymSets||{}; s.gymWt=s.gymWt||{}; s.diet=s.diet||false; s.gymDone=s.gymDone||false; s.mood=s.mood||0; s.notes=s.notes||{}; s.photo=s.photo||null; return s; }
  let S = normalize(readJSON(KEY));
  let scores = readJSON(SCORES_KEY);
  function sv(){ localStorage.setItem(KEY, JSON.stringify(S)); }
  function svScores(){ localStorage.setItem(SCORES_KEY, JSON.stringify(scores)); }

  /* ---------- time ---------- */
  function toMin(t){ const [a,b]=t.split(':').map(Number); return a*60+b; }
  function nowMin(){ const d=new Date(); return d.getHours()*60+d.getMinutes(); }
  function fmt(t,e){ return t===e ? t : t+' - '+e; }

  /* ---------- score / header ---------- */
  function scoreToday(){ return scoreFor(S, PLAN); }
  function streakCount(){ return streakFrom(scores, TODAY_IDX, scoreToday()); }
  function setBadge(){
    const b=$('badge');
    if(TODAY_IDX < 0) b.innerHTML = 'STARTS<br>20 JUL';
    else if(TODAY_IDX >= DAYS) b.innerHTML = 'DONE<br>30 / 30';
    else b.innerHTML = 'DAY<br>' + (TODAY_IDX+1) + '<span style="font-weight:700;font-size:9px"> / 30</span>';
  }
  function refresh(){
    const p = scoreToday();
    setGauge(p);
    $('doneCount').textContent = doneCountFor(S, PLAN);
    if(started){ scores[TODAY_KEY] = p; svScores(); }
    $('streakN').textContent = streakCount();
    setBadge();
    renderMonth();
    sv();
  }

  /* ---------- gauge ---------- */
  const N = 52;
  function buildGauge(){
    const g=$('gaugeSvg'); let h=''; const cx=125,cy=125,rin=88,rout=104;
    for(let i=0;i<N;i++){
      const a=(i/N)*2*Math.PI - Math.PI/2 + 0.02;
      const x1=cx+rin*Math.cos(a), y1=cy+rin*Math.sin(a), x2=cx+rout*Math.cos(a), y2=cy+rout*Math.sin(a);
      h+='<line class="tick" data-i="'+i+'" x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke="#DCD6C8" stroke-width="5" stroke-linecap="round"/>';
    }
    h+='<circle cx="125" cy="125" r="76" fill="var(--card)" stroke="var(--ink)" stroke-width="3.5"/>';
    g.innerHTML=h;
  }
  function tickColor(i){ const t=i/N; return t<0.34?'var(--lime)':t<0.67?'#4FC4DE':'var(--purple)'; }
  function setGauge(pct){
    const lit=Math.round(N*pct/100);
    root.querySelectorAll('#gaugeSvg .tick').forEach(l=>{
      const i=+l.dataset.i;
      if(i<lit){ l.setAttribute('stroke', tickColor(i)); l.setAttribute('stroke-width','7'); }
      else { l.setAttribute('stroke','#DCD6C8'); l.setAttribute('stroke-width','5'); }
    });
    $('pctNum').textContent = Math.round(pct);
  }

  /* ---------- timeline ---------- */
  let openPanelId = null;
  function statusOf(p, nm){ if(p.t===p.e) return toMin(p.t)<=nm?'past':'future'; if(toMin(p.e)<=nm) return 'past'; if(toMin(p.t)<=nm) return 'current'; return 'future'; }
  function nowLine(){
    const d=new Date(); const hh=String(d.getHours()).padStart(2,'0'), mm=String(d.getMinutes()).padStart(2,'0');
    const w=document.createElement('div'); w.className='nowline';
    w.innerHTML='<div class="ln"></div><span class="t">now '+hh+':'+mm+'</span><div class="ln"></div>'; return w;
  }
  function renderTimeline(){
    const tl=$('timeline'); tl.innerHTML=''; const nm=nowMin(); let placed=false;
    PLAN.forEach(p=>{
      const st=statusOf(p,nm);
      if(!placed && st!=='past'){ tl.appendChild(nowLine()); placed=true; }
      const done=!!S.done[p.id];
      const missed=st==='past' && !done && p.pts>0 && !p.routine;
      const el=document.createElement('div');
      el.className='block'+(done?' done':'')+(p.routine?' routine':'')+(st==='past'?' past':'')+(st==='current'?' current':'')+(missed?' missed':'');
      el.dataset.pid=p.id;
      el.style.setProperty('--tile', TILE[p.cat]);
      const right=p.routine?'':'<span class="pts">'+p.pts+'</span>';
      let suffix='';
      if(st==='current') suffix=' <span class="nowtag">now</span>';
      else if(p.expand && !missed) suffix=' &middot; <span class="tapopen">tap to open</span>';
      if(missed) suffix+=' &middot; <span class="missedtag">'+(p.expand?'missed &middot; open':'missed')+'</span>';
      el.innerHTML=
        '<div class="row">'+
          '<div class="tile">'+svg(p.ic,'width="21" height="21"')+'</div>'+
          '<div class="meta"><div class="time">'+fmt(p.t,p.e)+suffix+'</div>'+
            '<div class="name">'+p.name+'</div>'+(p.desc&&!p.routine?'<div class="desc">'+p.desc+'</div>':'')+'</div>'+
          '<div class="rgt">'+right+'<button class="check" aria-label="Complete">'+svg('check','width="16" height="16"')+'</button></div>'+
        '</div>'+
        (p.expand?'<div class="panel"><div class="pin" id="pin-'+p.id+'"></div></div>':'');
      tl.appendChild(el);
      el.querySelector('.check').addEventListener('click',ev=>{ ev.stopPropagation();
        S.done[p.id]=!S.done[p.id];
        if(p.id==='gym'||p.id==='su_gym') S.gymDone=S.done[p.id];
        if(p.id==='dinner'||p.id==='su_dinner') S.diet=S.done[p.id];
        sv(); refresh(); renderTimeline();
      });
      if(p.expand){
        el.querySelector('.meta').addEventListener('click',()=>{ const o=el.classList.toggle('open'); openPanelId=o?p.id:null; if(o) fillPin(el, p); });
        if(openPanelId===p.id){ el.classList.add('open'); fillPin(el, p); }
      }
    });
    if(!placed) tl.appendChild(nowLine());
  }
  let scrolledOnce=false;
  function scrollToNow(){
    if(scrolledOnce) return; scrolledOnce=true;
    const nl=root.querySelector('#view-today .nowline'); if(!nl) return;
    const nm=nowMin(); if(nm<toMin('05:00')||nm>toMin('21:15')) return;
    const y=nl.getBoundingClientRect().top+window.scrollY-170; if(y>60) window.scrollTo({top:y,behavior:'smooth'});
  }

  function fillPin(blockEl, p){
    const el=blockEl.querySelector('#pin-'+p.id); if(!el || el.dataset.f) return;
    if(CHECKLISTS[p.expand]){
      const items=CHECKLISTS[p.expand], titles={mealprep:'Prep checklist',portion:'Portion and orders',planning:'Plan the week'};
      el.innerHTML='<h4>'+(titles[p.expand]||'Checklist')+'</h4>'+items.map((t,i)=>{ const k=p.id+'-c'+i,on=S.supp[k]; return '<div class="mini'+(on?' on':'')+'" data-k="'+k+'"><div class="mc">'+svg('check','width="13" height="13"')+'</div><div class="mt">'+t+'</div></div>'; }).join('');
      el.querySelectorAll('.mini[data-k]').forEach(m=>m.addEventListener('click',()=>{ const k=m.dataset.k; S.supp[k]=!S.supp[k]; m.classList.toggle('on',S.supp[k]); sv(); }));
      el.dataset.f='1'; return;
    }
    if(p.expand==='supps'||p.expand==='suppsPM'){
      const list=p.expand==='supps'?SUPPS_AM:SUPPS_PM, key=p.expand;
      el.innerHTML='<h4>'+(key==='supps'?'Morning stack':'Evening stack')+'</h4>'+list.map((x,i)=>{ const k=key+i,on=S.supp[k]; return '<div class="mini'+(on?' on':'')+'" data-k="'+k+'"><div class="mc">'+svg('check','width="13" height="13"')+'</div><div class="mt">'+x.n+'</div>'+(x.tag?'<span class="tag">'+x.tag+'</span>':'')+'</div>'; }).join('');
      el.querySelectorAll('.mini').forEach(m=>m.addEventListener('click',()=>{ const k=m.dataset.k; S.supp[k]=!S.supp[k]; m.classList.toggle('on',S.supp[k]); sv(); }));
    }
    if(p.expand==='gym'){
      el.innerHTML='<h4>Push A &middot; log your lifts</h4>'+GYM.map((x,i)=>{
        const wt=S.gymWt[i]||'', sets=parseInt(x.s)||3; let sh='';
        for(let j=0;j<sets;j++){ const sk=i+'-'+j,on=S.gymSets[sk]; sh+='<button class="setbtn'+(on?' done':'')+'" data-sk="'+sk+'">'+(on?'&#10003;':(j+1))+'</button>'; }
        return '<div class="ex"><div class="ex-h"><b>'+x.n+'</b><span class="sc">'+x.s+'</span></div><div class="ex-c"><div class="wt"><label>kg</label><input type="number" inputmode="decimal" data-wt="'+i+'" value="'+wt+'" placeholder="--"></div><div class="sets">'+sh+'</div></div></div>';
      }).join('')+'<button class="bigbtn'+(S.gymDone?' done':'')+'" id="gymCta">'+(S.gymDone?'Workout logged':'Complete workout')+'</button>';
      el.querySelectorAll('[data-wt]').forEach(inp=>inp.addEventListener('input',()=>{ S.gymWt[inp.dataset.wt]=inp.value; sv(); }));
      el.querySelectorAll('[data-sk]').forEach(b=>b.addEventListener('click',()=>{ const sk=b.dataset.sk; S.gymSets[sk]=!S.gymSets[sk]; b.classList.toggle('done',S.gymSets[sk]); b.innerHTML=S.gymSets[sk]?'&#10003;':(parseInt(sk.split('-')[1])+1); sv(); }));
      el.querySelector('#gymCta').addEventListener('click',()=>{ S.gymDone=!S.gymDone; S.done.gym=S.gymDone; sv(); renderTimeline(); refresh(); });
    }
    if(p.expand==='diet'){
      el.innerHTML='<div class="diet-grid"><div class="dc yes"><b>On the plan</b><ul>'+DIET_YES.map(x=>'<li>'+x+'</li>').join('')+'</ul></div><div class="dc no"><b>Off the plan</b><ul>'+DIET_NO.map(x=>'<li>'+x+'</li>').join('')+'</ul></div></div><div class="toggle-row"><span>Stayed on plan today</span><div class="sw'+(S.done[p.id]?' on':'')+'" id="dsw"></div></div>';
      el.querySelector('#dsw').addEventListener('click',()=>{ S.done[p.id]=!S.done[p.id]; S.diet=S.done[p.id]; el.querySelector('#dsw').classList.toggle('on',S.done[p.id]); renderTimeline(); refresh(); sv(); });
    }
    if(p.expand==='work'){
      const meet=(p.id==='sashAM')?MEET_AM:MEET_PM;
      el.innerHTML='<h4>From your Sash calendar</h4>'+meet.map(m=>'<div class="mini"><div class="mc" style="background:var(--sky);color:var(--ink)">'+svg('cal','width="12" height="12"')+'</div><div class="mt">'+m.n+'</div><span class="tag">'+m.t+'</span></div>').join('')+
        '<h4 style="margin-top:13px">Fill the gaps</h4>'+WORK_TASKS.map((t,i)=>{ const k=p.id+'-w'+i,on=S.supp[k]; return '<div class="mini'+(on?' on':'')+'" data-k="'+k+'"><div class="mc">'+svg('check','width="13" height="13"')+'</div><div class="mt">'+t+'</div></div>'; }).join('');
      el.querySelectorAll('.mini[data-k]').forEach(m=>m.addEventListener('click',()=>{ const k=m.dataset.k; S.supp[k]=!S.supp[k]; m.classList.toggle('on',S.supp[k]); sv(); }));
    }
    el.dataset.f='1';
  }

  /* ---------- month ---------- */
  function renderMonth(){
    const g=$('grid'); g.innerHTML=''; const live=scoreToday(); const lived=[];
    for(let d=0; d<DAYS; d++){
      const v=monthVal(d, scores, TODAY_IDX, live), c=document.createElement('div'), today=d===TODAY_IDX;
      c.className='cell'+(v===null?' empty':'')+(today?' today':'');
      if(v===null){ c.innerHTML='<span class="dn">'+(d+1)+'</span>'; }
      else{
        lived.push(v); const col=colFor(v);
        c.style.background='color-mix(in srgb,'+col+' 45%, var(--card))'; c.style.cursor='pointer';
        c.innerHTML='<span class="dn">'+(d+1)+'</span><span class="pc">'+Math.round(v)+'</span>';
        c.addEventListener('click',()=>openDay(d));
      }
      g.appendChild(c);
    }
    $('avg').textContent = lived.length ? Math.round(lived.reduce((a,b)=>a+b,0)/lived.length) : '--';
  }
  function openDay(i){
    const isToday = i===TODAY_IDX;
    const plan = planForIndex(i);
    const state = isToday ? S : normalize(readJSON('poopy:v1:'+keyAtIndex(i)));
    const sc = isToday ? scoreToday() : scoreFor(state, plan);
    const scCol = sc>0 ? colFor(sc) : 'var(--muted)';
    const nn = nnForPlan(plan);
    const missSet = new Set(missedNames(state, nn));
    const nnHtml = nn.map(x=>{ const miss=missSet.has(x[0]); return '<div class="nn-item '+(miss?'miss':'hit')+'"><span class="dot">'+(miss?'':svg('check','width="11" height="11"'))+'</span>'+x[0]+'</div>'; }).join('');
    const moodLbl = (MOODS.find(m=>m.k===state.mood)||{}).l || 'Not logged';
    const photoHtml = state.photo ? '<img src="'+state.photo+'" alt="">' : (isToday ? 'No photo yet. Add one on the Record tab.' : 'No photo saved');
    const notes = state.notes || {};
    const nb=(l,v)=>v?'<div class="day-note"><b>'+l+'</b><p>'+v+'</p></div>':'';
    $('sheet').innerHTML=
      '<div class="sh-head"><h3>Day '+(i+1)+' &middot; '+dateLabelIndex(i)+'</h3><button class="xbtn" id="xbtn">'+svg('x','width="16" height="16"')+'</button></div>'+
      '<div class="day-score"><div class="big" style="color:'+scCol+'">'+Math.round(sc)+'</div><div><div class="lab">Score out of 100</div><div style="font-family:var(--round);font-weight:800;font-size:16px;margin-top:2px">Felt '+moodLbl+'</div></div></div>'+
      '<div class="day-photo">'+photoHtml+'</div>'+
      nb('What got done',notes.done)+nb('Body and head',notes.felt)+nb('Change tomorrow',notes.change)+
      '<div class="day-note"><b>Non-negotiables</b><div class="nn-list">'+nnHtml+'</div></div>';
    $('sheet').querySelector('#xbtn').addEventListener('click',closeModal);
    $('dayModal').classList.add('open');
  }
  function closeModal(){ $('dayModal').classList.remove('open'); }
  function initModal(){ $('scrim').addEventListener('click',closeModal); }

  /* ---------- mood faces (drawn, no emoji) ---------- */
  function face(m,c){
    const eyes='<circle cx="9" cy="12" r="1.7" fill="#17140F"/><circle cx="17" cy="12" r="1.7" fill="#17140F"/>';
    let mouth='';
    if(m==='grin') mouth='<path d="M8 15.5c1.4 2.4 6.6 2.4 8 0" stroke="#17140F" stroke-width="2" fill="none" stroke-linecap="round"/>';
    if(m==='ok') mouth='<path d="M8.5 15.5c1.2 1.6 5.8 1.6 7 0" stroke="#17140F" stroke-width="2" fill="none" stroke-linecap="round"/>';
    if(m==='flat') mouth='<path d="M9 16.5h6" stroke="#17140F" stroke-width="2" fill="none" stroke-linecap="round"/>';
    if(m==='meh') mouth='<path d="M9 17c1-1 5-1 6 .2" stroke="#17140F" stroke-width="2" fill="none" stroke-linecap="round"/>';
    if(m==='sad') mouth='<path d="M8.5 17.5c1.4-2 6.6-2 8 0" stroke="#17140F" stroke-width="2" fill="none" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 26 26" width="34" height="34"><rect x="2" y="2" width="22" height="22" rx="8" fill="'+c+'" stroke="#17140F" stroke-width="2.4"/>'+eyes+mouth+'</svg>';
  }
  function initMood(){
    const rowEl=$('mood');
    rowEl.innerHTML=MOODS.map(x=>'<button class="mood-btn'+(S.mood===x.k?' sel':'')+'" data-m="'+x.k+'">'+face(x.m,x.c)+'<span>'+x.l+'</span></button>').join('');
    rowEl.querySelectorAll('.mood-btn').forEach(b=>b.addEventListener('click',()=>{ S.mood=+b.dataset.m; rowEl.querySelectorAll('.mood-btn').forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); sv(); }));
  }

  /* ---------- record ---------- */
  function showPhoto(src){ $('photo').innerHTML='<img src="'+src+'" alt="Today">'; }
  function initRecord(){
    $('camIcon').innerHTML=svg('camera','width="36" height="36" style="opacity:.5"');
    const input=$('photoInput');
    if(S.photo) showPhoto(S.photo);
    input.addEventListener('change',e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ S.photo=r.result; sv(); showPhoto(r.result); refresh(); }; r.readAsDataURL(f); });
    ['done','felt','change'].forEach(k=>{ const t=$('n-'+k); t.value=(S.notes&&S.notes[k])||''; t.addEventListener('input',()=>{ S.notes[k]=t.value; sv(); }); });
    $('saveBtn').addEventListener('click',()=>{ sv(); refresh(); const n=$('savedNote'); n.textContent='Saved'+(started?', Day '+(TODAY_IDX+1)+' locked in.':'.'); setTimeout(()=>n.textContent='',2200); });
    initMood();
  }

  /* ---------- swirl backdrop ---------- */
  function buildSwirl(){
    const s=$('swirl'); let h='';
    for(let i=0;i<26;i++){ const rot=i*(360/26); h+='<ellipse cx="200" cy="200" rx="70" ry="150" fill="none" stroke="var(--swirl)" stroke-width="1" transform="rotate('+rot+' 200 200)"/>'; }
    s.innerHTML=h;
  }

  /* ---------- tabs ---------- */
  function initTabs(){
    const map={today:'sun',month:'grid',record:'camera'};
    root.querySelectorAll('#tabs button').forEach(b=>{
      b.querySelector('.ti').innerHTML=svg(map[b.dataset.tab],'width="22" height="22"');
      b.addEventListener('click',()=>{
        root.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
        root.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); $('view-'+b.dataset.tab).classList.add('active');
        window.scrollTo(0,0);
      });
    });
  }

  /* ---------- notifications ---------- */
  let bannerTimer=null;
  function showBanner(title,body){
    let b=document.getElementById('poopy-banner');
    if(!b){ b=document.createElement('div'); b.id='poopy-banner'; b.className='banner'; document.body.appendChild(b); }
    b.innerHTML='<div class="bic">'+svg('bell','width="18" height="18"')+'</div><div class="bt"><div class="ap">Poopy Month &middot; now</div><b>'+title+'</b><span>'+body+'</span></div>';
    requestAnimationFrame(()=>b.classList.add('show'));
    clearTimeout(bannerTimer); bannerTimer=setTimeout(()=>b.classList.remove('show'),4400);
  }
  function currentOrNext(){ const nm=nowMin(); let cur=null,nxt=null; for(const p of PLAN){ const s=statusOf(p,nm); if(s==='current'&&!cur)cur=p; if(s==='future'&&!nxt)nxt=p; } return cur||nxt||PLAN[0]; }
  function updateBell(){ $('bell').classList.toggle('on',!!S.alerts); }
  function initBell(){
    const bell=$('bell'); bell.innerHTML=svg('bell','width="18" height="18"'); updateBell();
    bell.addEventListener('click',async()=>{
      S.alerts=!S.alerts; sv(); updateBell();
      if(S.alerts){
        if('Notification' in window && Notification.permission==='default'){ try{ await Notification.requestPermission(); }catch(e){} }
        const p=currentOrNext();
        showBanner(p.name, fmt(p.t,p.e)+' &middot; tap to open in the app');
        if('Notification' in window && Notification.permission==='granted'){ try{ new Notification('Poopy Month',{body:'Time for '+p.name}); }catch(e){} }
      }
    });
  }

  /* ---------- boot ---------- */
  $('flame').innerHTML=svg('flame','width="15" height="15"');
  buildSwirl(); buildGauge(); renderTimeline(); renderMonth(); initRecord(); initTabs(); initModal(); initBell();
  setBadge();
  $('recDay').textContent = 'Daily record' + (started ? ' · Day ' + (TODAY_IDX+1) : '');
  $('calTitle').textContent = '20 Jul to 18 Aug';
  refresh();
  setTimeout(()=>setGauge(scoreToday()),120);
  setTimeout(scrollToNow,420);
  const tlEl=$('timeline');
  setInterval(()=>{ const a=document.activeElement; if(a && tlEl.contains(a)) return; renderTimeline(); }, 60000);
}
