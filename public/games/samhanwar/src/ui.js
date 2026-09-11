// 삼한통일전 — 화면. 엔진 상태를 읽어 그리고, 사람의 입력을 엔진 호출로 바꾼다.
'use strict';

const E = () => window.SamhanEngine;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
const nf = n => Math.round(n).toLocaleString(LANG === 'ko' ? 'ko-KR' : 'en-US');
// 무장 이름 — 영어에서는 한자 로마자 표기가 없으므로 한글 이름을 그대로 두되 병기한다
const offName = d => (LANG === 'ko' ? d.nm : (d.en || d.nm));

let G = null;
let picked = null;      // 선택 거점
let pickedOff = null;   // 선택 무장

// ────────────────────────────────────────── 언어·소리
const STATIC = ['brand', 'eyebrow', 'lede', 'pickhead', 'picksub', 'tYm', 'tTurn', 'tFac', 'tCastle',
                'tGold', 'tFood', 'tTroop', 'tabCastle', 'tabRoster', 'tabDiplo', 'over', 'btl'];
function applyStatic() {
  for (const k of STATIC) {
    const el2 = document.getElementById('i-' + k.toLowerCase()) || document.getElementById('i-' + k);
    if (el2) el2.textContent = t(k);
  }
  $('#continue').textContent = t('cont');
  $('#next').textContent = t('next');
  $('#restart').textContent = t('restart');
  $('#overback').textContent = t('backMenu');
  $('#evok').textContent = t('evOk');
  $('#btlend').textContent = t('btlEnd');
  $('#langbtn').textContent = LANG === 'ko' ? 'English' : '한국어';
  $('#maphint').textContent = LANG === 'ko'
    ? '거점 클릭 · 드래그로 이동 · 휠로 확대'
    : 'click a hold · drag to pan · wheel to zoom';
  document.title = LANG === 'ko' ? '삼한통일전 — 서기 246년' : 'War for the Three Han — AD 246';
  const h1 = $('#i-title');
  if (h1) h1.innerHTML = LANG === 'ko'
    ? '삼한통일전<span class="hj">三韓統一戰</span>'
    : 'War for the<br>Three Han<span class="hj">三韓統一戰</span>';
}

// ────────────────────────────────────────── 시작
function boot() {
  const saved = Store.get('samhan_game');
  $('#continue').hidden = !saved;
  // 두 갈래 — 짧은 판과 통일전
  const modes = $('#modes');
  modes.innerHTML = '';
  const mk = (key, sub, fn, hot) => {
    const b = el('button', 'modebtn' + (hot ? ' hot' : ''));
    b.innerHTML = `<b>${t(key)}</b><span>${t(sub)}</span>`;
    b.onclick = fn; modes.appendChild(b);
  };
  mk('modeSkirmish', 'modeSkirmishSub', startSkirmish, true);
  mk('modeCampaign', 'modeCampaignSub', () => {
    $('#modes').hidden = true; $('#pickwrap').hidden = false;
    $('#facpick').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $('#pickwrap').hidden = true;
  $('#modes').hidden = false;
  const grid = $('#facpick');
  const counts = {};
  for (const c of CASTLES) counts[c.fac] = (counts[c.fac] || 0) + 1;
  for (const [id, f] of Object.entries(FACTIONS)) {
    const b = el('button', 'facbtn');
    b.style.setProperty('--c', f.color);
    b.innerHTML = `<b>${facName(id)}</b><i>${f.hanja}</i>
      <span class="fmeta">${lordName(id)} · ${t('castlesN')} ${counts[id]}</span>`;
    b.onclick = () => start(id);
    grid.appendChild(b);
  }
  $('#continue').onclick = () => {
    const d = E().loadState(Store.get('samhan_game'));
    if (!d) { alert(LANG === 'ko' ? '저장을 읽지 못했습니다. 새로 시작해 주세요.'
                                   : 'Could not read the save. Please start a new game.'); return; }
    G = d; enterGame();
  };
}

// ★포털용 짧은 판. 통일전은 처음 전투까지 몇 분이 걸리는데, 캐주얼 포털에서는
//   그 사이에 사람이 떠난다. 기리영 싸움만 떼어 바로 붙게 한다.
function startSkirmish() {
  Sound.sfx('ok');
  const en = E();
  G = en.newGame('마한', (Date.now() ^ 0x9e37) >>> 0);
  G.skirmish = true;
  const from = 22, to = 10;                   // 목지국 → 대방
  const cap = G.castles[from];
  // 사료대로 8월. 화계가 통하는 건조기다.
  G.year = 246; G.month = 8;
  cap.troops = { 보병: 9000, 기병: 3000, 궁병: 4000 };
  cap.train = 62; cap.morale = 78;
  const offs = en.officersAt(G, from).filter(o => o.fac === '마한').slice(0, 6);
  const ids = [];
  offs.forEach((o, i) => {
    o.lv = 9;
    const u = ['보병', '기병', '궁병', '보병', '궁병', '기병'][i];
    const r = en.doAssign(G, from, o.id, u, Math.min(en.troopCap(o), cap.troops[u]));
    if (r.ok) ids.push(o.id);
  });
  en.doDeclareWar(G, '마한', '위');
  $('#intro').hidden = true;
  $('#game').hidden = false;
  MapView.init($('#map'), G, pickCastle);
  MapView.setGame(G); pickCastle(from); MapView.focus(from);
  render();
  Sound.init(); Sound.play('field');
  if (window.CG) CG.play();
  // ★alert 는 페이지를 멈춘다 — 포털 iframe 안에서는 게임이 멈춘 것처럼 보이고,
  //   자동화·녹화도 그 자리에서 막힌다(실측). 게임 안의 안내 모달을 쓴다.
  evQueue = [{ nm: t('modeSkirmish'), txt: t('skirmishIntro'), src: '삼국지 위서 동이전',
               result: '', y: G.year, m: G.month }];
  showEvent();
  const btl = window.SamhanBattle.start(G, from, to, ids, en);
  if (!btl) { toast('출전할 부대가 없습니다'); return; }
  BattleView.open(btl, (bb) => {
    const out = window.SamhanBattle.applyResult(G, bb, en);
    if (out.captured && window.CG) CG.happy();
    $('#overtxt').textContent = out.captured ? t('skirmishWin') : t('skirmishLose');
    $('#i-over').textContent = out.captured ? t('modeSkirmish') : t('modeSkirmish');
    $('#over').hidden = false;
    Sound.sfx(out.captured ? 'capture' : 'lose');
    render();
  });
}

function start(fid) {
  Sound.sfx('ok');
  G = E().newGame(fid, (Date.now() ^ 0x5a17) >>> 0);
  enterGame();
}

function enterGame() {
  $('#intro').hidden = true;
  Sound.init(); Sound.play('field');
  if (window.CG) CG.play();
  $('#game').hidden = false;
  MapView.init($('#map'), G, pickCastle);
  MapView.setGame(G);
  const cap = FACTIONS[G.player].cap;
  pickCastle(cap);
  MapView.focus(cap);
  render();
}

// ────────────────────────────────────────── 렌더
function render() {
  const en = E();
  $('#ym').textContent = t('ym', G.year, G.month);
  $('#turnno').textContent = t('turn', G.turn + 1);
  const mine = en.factionCastles(G, G.player);
  let gold = 0, food = 0, tr = 0;
  // ★부대는 무장이 들고 있다 — troopTotal 만 세면 편성한 병력이 사라진 것처럼 보인다
  for (const n of mine) { const c = G.castles[n]; gold += c.gold; food += c.food; tr += en.garrisonTotal(G, n); }
  $('#sgold').textContent = nf(gold);
  $('#sfood').textContent = nf(food);
  $('#stroop').textContent = nf(tr);
  $('#scastle').textContent = mine.length;
  const f = FACTIONS[G.player];
  $('#facname').textContent = facName(G.player);
  $('#facname').style.color = f.color;

  MapView.setGame(G);
  MapView.draw();
  renderPanel();
  renderRoster();
  renderDiplo();

  if (G.over) {
    const w = FACTIONS[G.over];
    $('#overtxt').textContent = G.over === G.player
      ? t('winMe', facName(G.over))
      : t('winOther', facName(G.over), facName(G.player));
    $('#over').hidden = false;
  }
}

function pickCastle(n) {
  picked = n; pickedOff = null;
  MapView.select(n);
  renderPanel();
}

function renderPanel() {
  const en = E(), box = $('#panel');
  box.innerHTML = '';
  if (picked == null) return;
  const d = en.castleDef(picked), c = G.castles[picked];
  const f = FACTIONS[c.fac];
  const own = c.fac === G.player;

  const head = el('div', 'phead');
  head.innerHTML = `<div class="ptitle"><b>${castleName(picked)}</b>
      <span class="sz s${d.sz}" title="${sizeName(d.sz)}">${sizeMark(d.sz)}</span></div>
    <div class="pnow">${LANG === 'ko' ? d.now : ''} ${d.lat.toFixed(2)}°N ${d.lon.toFixed(2)}°E</div>
    <div class="pfac" style="--c:${f.color}">${facName(c.fac)} <i>${f.hanja}</i></div>`;
  box.appendChild(head);

  // 수치
  const stats = el('div', 'stats');
  const bar = (label, v, cap, extra) => `
    <div class="st"><span class="sl">${label}</span>
      <span class="sv">${nf(v)}${cap ? `<i>/${cap}</i>` : ''}</span>
      ${cap ? `<span class="sbar"><i style="width:${Math.round(v / cap * 100)}%"></i></span>` : ''}
      ${extra ? `<span class="sx">${extra}</span>` : ''}</div>`;
  stats.innerHTML =
    bar(t('농업'), c.ag, d.cap, `${t('harvest')} ${nf(en.harvest(c))}`) +
    bar(t('상업'), c.cm, d.cap, `${t('income')} ${nf(en.income(c))}`) +
    bar(t('치안'), c.sec, d.cap, `${t('draft')} ${nf(en.draftCap(c))}`) +
    bar(t('훈련도'), c.train, 100) +
    bar(t('사기'), c.morale, 100) +
    bar(t('성벽'), c.wall, d.wall);
  box.appendChild(stats);

  const kv = el('div', 'kv');
  kv.innerHTML = `
    <div><dt>${t('pop')}</dt><dd>${nf(c.pop)}</dd></div>
    <div><dt>${t('gold')}</dt><dd>${nf(c.gold)}</dd></div>
    <div><dt>${t('food')}</dt><dd>${nf(c.food)}</dd></div>
    <div><dt>${t('upkeep')}</dt><dd>−${nf(en.upkeep(c))}</dd></div>
    <div><dt>${t('garrison')}</dt><dd>${nf(en.troopTotal(c))}<i>/${nf(d.garr)}</i></dd></div>
    <div><dt>${t('corps')}</dt><dd>${nf(en.garrisonTotal(G, picked) - en.troopTotal(c))}</dd></div>
    <div><dt>${t('hosp')}</dt><dd>${nf(c.hosp)}</dd></div>`;
  box.appendChild(kv);

  const tr = el('div', 'troops');
  for (const u of ['보병', '기병', '궁병']) {
    tr.innerHTML += `<div class="tu u${u}"><span>${t(u)}</span><b>${nf(c.troops[u])}</b></div>`;
  }
  box.appendChild(tr);

  // 무장
  const here = en.officersAt(G, picked);
  const ours = here.filter(o => o.fac === c.fac);
  const wild = here.filter(o => o.fac === null && o.found);
  const hiddenCount = here.filter(o => o.fac === null && !o.found).length;
  if (ours.length) box.appendChild(offList(t('here'), ours, own));
  if (wild.length) box.appendChild(offList(t('wild'), wild, own, true));
  if (own && hiddenCount) {
    box.appendChild(el('p', 'note', t('hidden', hiddenCount)));
  }

  if (!own) {
    const rel = en.relOf(G, G.player, c.fac);
    const truce = G.factions[G.player].truce[c.fac] || 0;
    const msg = rel === 'ally' ? t('relAlly') : truce ? t('relTruce', truce)
      : rel === 'war' ? t('relWar') : t('relPeace');
    box.appendChild(el('p', 'note', msg));
  }
  renderOrders();
}

function offList(title, list, own, isWild) {
  const en = E();
  const wrap = el('div', 'olist');
  wrap.appendChild(el('h4', null, title));
  for (const o of list) {
    const d = en.officerDef(o.id);
    const b = el('button', 'ocard' + (pickedOff === o.id ? ' on' : '') + (isWild ? ' wild' : ''));
    b.innerHTML = `
      <span class="por" data-p="${o.id}">${portraitTag(o.id, d)}</span>
      <span class="oinfo">
        <b>${offName(d)}${d.sex === '여' ? `<em class="fem">${t('female')}</em>` : ''}</b>
        <span class="olv">${t('lv')}${o.lv}${o.corps ? ` · <b class="cps u${o.corps.unit}">${t(o.corps.unit)} ${nf(o.corps.n)}</b>` : ''}${o.done ? ' · ✓' : ''}</span>
        ${o.fac ? `<span class="loy"><i style="width:${Math.round(o.loy)}%"></i></span>` : ''}
      </span>
      <span class="ostat"><i>${t('abMu')}</i>${o.mu}<i>${t('abJi')}</i>${o.ji}<i>${t('abJg')}</i>${o.jg}</span>`;
    b.onclick = () => { pickedOff = pickedOff === o.id ? null : o.id; renderPanel(); };
    b.oncontextmenu = ev => { ev.preventDefault(); openBio(o.id); };
    const info = el('span', 'bioBtn', t('bio'));
    info.onclick = ev => { ev.stopPropagation(); openBio(o.id); };
    b.appendChild(info);
    wrap.appendChild(b);
  }
  return wrap;
}

// ★lazy 는 목록에서만 쓴다. 숨겨진(hidden) 부모 안에 lazy 이미지를 넣으면 화면 밖으로 보고
//   무기한 미뤄 열전 초상이 끝내 안 뜬다(2026-09-10 실측: complete=false, 0x0).
function portraitTag(id, d, lazy = true) {
  const initial = d.nm.slice(0, 1);
  return `<img src="art/portraits/${id}.webp" alt=""${lazy ? ' loading="lazy"' : ''}
     onerror="this.replaceWith(Object.assign(document.createElement('span'),
       {className:'noimg',textContent:'${initial}'}))">`;
}

// ────────────────────────────────────────── 명령
function renderOrders() {
  const en = E(), box = $('#orders');
  box.innerHTML = '';
  if (picked == null) return;
  const c = G.castles[picked];
  if (c.fac !== G.player) { renderAttack(box); return; }
  if (!pickedOff) {
    box.appendChild(el('p', 'note', t('pickOfficer')));
    renderAttack(box);
    return;
  }
  const o = G.officers[pickedOff];
  const d = en.officerDef(pickedOff);
  if (o.fac === null) {
    // 등용
    const row = el('div', 'orow');
    const who = en.officersAt(G, picked).filter(x => x.fac === G.player && !x.done);
    if (!who.length) { box.appendChild(el('p', 'note', t('noOfficer'))); return; }
    const sel = el('select');
    for (const w of who) sel.appendChild(new Option(offName(en.officerDef(w.id)), w.id));
    const b = el('button', 'go', LANG === 'ko' ? `${d.nm} 등용` : `Recruit ${offName(d)}`);
    b.onclick = () => {
      const r = en.doRecruitOfficer(G, picked, sel.value, pickedOff);
      if (!r.ok) return toast(r.why);
      toast(r.joined ? `${r.name}이(가) 뜻을 함께하기로 했습니다.` : `${r.name}이(가) 응하지 않았습니다.`);
      pickedOff = null; save(); render();
    };
    row.append(el('span', 'olab', t('oEnvoy')), sel, b);
    box.appendChild(row);
    return;
  }
  if (o.done) { box.appendChild(el('p', 'note', t('doneThisMonth'))); renderAttack(box); return; }

  // 내정
  const dev = el('div', 'orow');
  dev.appendChild(el('span', 'olab', t('oDev')));
  for (const k of ['농업', '상업', '치안']) {
    const b = el('button', null, `${t(k)} (${en.costOf(c)}${LANG === 'ko' ? '금' : 'g'})`);
    b.onclick = () => {
      const r = en.doDevelop(G, picked, pickedOff, k);
      if (!r.ok) return toast(r.why);
      toast(`${t(k)} +${r.gain}`); Sound.sfx('ok'); save(); render();
    };
    dev.appendChild(b);
  }
  box.appendChild(dev);

  const trainRow = el('div', 'orow');
  trainRow.appendChild(el('span', 'olab', t('oTrain')));
  const tb = el('button', null, t('doTrain'));
  tb.onclick = () => {
    const r = en.doTrain(G, picked, pickedOff);
    if (!r.ok) return toast(r.why);
    toast(`${t('훈련도')} +${r.gain}`); Sound.sfx('ok'); save(); render();
  };
  trainRow.appendChild(tb);
  box.appendChild(trainRow);

  // 징집
  const rr = el('div', 'orow');
  rr.appendChild(el('span', 'olab', t('oRecruit')));
  const unit = el('select'); ['보병', '기병', '궁병'].forEach(u => unit.appendChild(new Option(t(u), u)));
  const mode = el('select'); ['모병', '징병'].forEach(m => mode.appendChild(new Option(t(m), m)));
  const cnt = el('input'); cnt.type = 'number'; cnt.min = 100; cnt.step = 100;
  cnt.value = Math.min(1000, Math.max(100, Math.floor(en.draftCap(c) / 100) * 100));
  const rb = el('button', 'go', t('oRecruit'));
  rb.onclick = () => {
    const r = en.doRecruit(G, picked, pickedOff, unit.value, +cnt.value, mode.value);
    if (!r.ok) return toast(r.why);
    toast(`${t(r.mode)} ${nf(r.count)} (${nf(r.gold)}${LANG === 'ko' ? '금' : 'g'})`);
    Sound.sfx('ok'); save(); render();
  };
  rr.append(unit, mode, cnt, rb);
  box.appendChild(rr);

  // 부대 편성
  const corpsRow = el('div', 'orow');
  corpsRow.appendChild(el('span', 'olab', t('oCorps')));
  const cu = el('select'); ['보병', '기병', '궁병'].forEach(u => cu.appendChild(new Option(`${t(u)} (${nf(c.troops[u])})`, u)));
  if (o.corps) cu.value = o.corps.unit;
  const cn = el('input'); cn.type = 'number'; cn.min = 100; cn.step = 100;
  const room = en.troopCap(o) - (o.corps ? o.corps.n : 0);
  cn.value = Math.max(0, Math.min(1000, Math.floor(room / 100) * 100));
  const cb = el('button', 'go', t('doAssign'));
  cb.onclick = () => {
    const r = en.doAssign(G, picked, pickedOff, cu.value, +cn.value);
    if (!r.ok) return toast(r.why);
    toast(`${d.nm} → ${r.unit} ${nf(r.total)}명`); save(); render();
  };
  corpsRow.append(cu, cn, cb);
  if (o.corps && o.corps.n > 0) {
    const db = el('button', null, t('doDisband'));
    db.onclick = () => {
      const r = en.doDisband(G, pickedOff);
      if (!r.ok) return toast(r.why);
      toast(`부대 해산 — ${nf(r.back)}명 복귀${r.lost ? ` (${nf(r.lost)}명 상한 초과로 흩어짐)` : ''}`);
      save(); render();
    };
    corpsRow.appendChild(db);
  }
  corpsRow.appendChild(el('span', 'hint', t('capLead', nf(en.troopCap(o)))));
  box.appendChild(corpsRow);

  // 탐색·하사
  const misc = el('div', 'orow');
  misc.appendChild(el('span', 'olab', t('oMisc')));
  const sb = el('button', null, t('doSearch'));
  sb.onclick = () => {
    const r = en.doSearch(G, picked, pickedOff);
    if (!r.ok) return toast(r.why);
    toast(r.found ? (LANG === 'ko' ? `${r.found}을(를) 찾았습니다.` : `You found ${r.found}.`)
                  : (r.why || (LANG === 'ko' ? '아무도 찾지 못했습니다.' : 'No one was found.')),
      r.found ? 'good' : '');
    Sound.sfx(r.found ? 'ok' : 'no');
    save(); render();
  };
  misc.appendChild(sb);
  const rw = el('button', null, t('doReward'));
  rw.onclick = () => {
    const r = en.doReward(G, picked, pickedOff, 300);
    if (!r.ok) return toast(r.why);
    toast(`${d.nm}의 충성 +${r.gain}`); save(); render();
  };
  misc.appendChild(rw);
  box.appendChild(misc);

  // 이동
  const adj = en.castleDef(picked).adj.filter(n => G.castles[n].fac === G.player);
  if (adj.length) {
    const mv = el('div', 'orow');
    mv.appendChild(el('span', 'olab', t('oMove')));
    const s = el('select');
    for (const n of adj) s.appendChild(new Option(en.castleDef(n).nm, n));
    const b = el('button', null, t('doMove'));
    b.onclick = () => {
      const r = en.doMove(G, pickedOff, +s.value);
      if (!r.ok) return toast(r.why);
      toast(`${d.nm} → ${en.castleDef(r.to).nm}`); pickedOff = null; save(); render();
    };
    mv.append(s, b);
    box.appendChild(mv);
  }
  renderAttack(box);
}

function corpsPicker(en, from, to) {
  // 그 거점에서 부대를 거느린 무장 목록. 아무도 없으면 주둔군 분견대로 나간다.
  const list = en.corpsAt(G, from, G.player);
  if (!list.length) return null;
  const wrap = el('div', 'corpsel');
  wrap.appendChild(el('span', 'olab', t('oAttack')));
  wrap.dataset.to = to;
  for (const o of list) {
    const lab = el('label', 'cchk');
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = o.id; cb.checked = true;
    lab.append(cb, el('span', null, `${offName(en.officerDef(o.id))} ${t(o.corps.unit)} ${nf(o.corps.n)}`));
    cb.onchange = () => updateForce(en, wrap);
    wrap.appendChild(lab);
  }
  const bar = el('div', 'fbal');
  wrap.appendChild(bar);
  updateForce(en, wrap);
  return wrap;
}

// ★들어가기 전에 양쪽 병력을 보여 준다. 3,600 으로 14,000 을 치러 들어가면 학살당한다.
function updateForce(en, wrap) {
  const to = +wrap.dataset.to;
  const bar = wrap.querySelector('.fbal');
  if (!bar || !to) return;
  const mine = [...wrap.querySelectorAll('input:checked')]
    .reduce((s, x) => s + (G.officers[x.value].corps?.n || 0), 0);
  const theirs = en.garrisonTotal(G, to);
  const ratio = theirs > 0 ? mine / theirs : 9;
  const verdict = ratio >= 1.6 ? [t('v_plenty'), 'good'] :
                  ratio >= 1.0 ? [t('v_even'), ''] :
                  ratio >= 0.6 ? [t('v_short'), 'warn'] : [t('v_none'), 'bad'];
  bar.className = 'fbal ' + verdict[1];
  bar.innerHTML = `${t('forceMine')} <b>${nf(mine)}</b> · ${t('forceTheirs')} <b>${nf(theirs)}</b>
    <span>${t('forceNote')} — ${verdict[0]}</span>`;
}

function renderAttack(box) {
  const en = E();
  const c = G.castles[picked];
  let from = null, to = null;
  if (c.fac === G.player) {
    const foes = en.castleDef(picked).adj.filter(n => G.castles[n].fac !== G.player);
    if (!foes.length) return;
    from = picked;
    const row = el('div', 'orow atk');
    row.appendChild(el('span', 'olab', t('oAttack')));
    const s = el('select');
    for (const n of foes) s.appendChild(new Option(`${castleName(n)} (${facName(G.castles[n].fac)})`, n));
    s.onchange = () => { const w = box.querySelector('.corpsel'); if (w) { w.dataset.to = s.value; updateForce(en, w); } };
    const ratio = el('select');
    const RA = LANG === 'ko' ? [[1,'전군'],[0.8,'8할'],[0.6,'6할'],[0.4,'4할']]
                             : [[1,'all'],[0.8,'80%'],[0.6,'60%'],[0.4,'40%']];
    RA.forEach(([v, l]) => ratio.appendChild(new Option(l, v)));
    ratio.selectedIndex = 1;
    const picker = corpsPicker(en, from, +s.value);
    const b = el('button', 'go danger', picker ? t('sally') : t('attack'));
    b.onclick = () => uiAttack(from, +s.value, +ratio.value, picker, true);
    const qb = el('button', null, t('quick'));
    qb.title = LANG === 'ko' ? '전술 화면 없이 한 번에 결판냅니다'
                             : 'Resolve at once, without the tactical screen';
    qb.onclick = () => uiAttack(from, +s.value, +ratio.value, picker, false);
    row.append(s, ratio, b, qb);
    box.appendChild(row);
    if (picker) box.appendChild(picker);
  } else {
    const src = en.castleDef(picked).adj.filter(n => G.castles[n].fac === G.player);
    if (!src.length) return;
    const row = el('div', 'orow atk');
    row.appendChild(el('span', 'olab', t('oAttack')));
    const s = el('select');
    for (const n of src) s.appendChild(new Option(LANG === 'ko' ? `${castleName(n)}에서` : `from ${castleName(n)}`, n));
    const ratio = el('select');
    const RA2 = LANG === 'ko' ? [[1,'전군'],[0.8,'8할'],[0.6,'6할'],[0.4,'4할']]
                              : [[1,'all'],[0.8,'80%'],[0.6,'60%'],[0.4,'40%']];
    RA2.forEach(([v, l]) => ratio.appendChild(new Option(l, v)));
    ratio.selectedIndex = 1;
    const b = el('button', 'go danger', LANG === 'ko' ? `${castleName(picked)} 공격` : `Attack ${castleName(picked)}`);
    b.onclick = () => uiAttack(+s.value, picked, +ratio.value, null);
    row.append(s, ratio, b);
    box.appendChild(row);
  }
}

function uiAttack(from, to, ratio, picker, tactical) {
  const en = E();
  const ids = picker ? [...picker.querySelectorAll('input:checked')].map(x => x.value) : [];

  // ★부대를 거느린 무장이 있을 때만 전술 전투가 성립한다.
  //   주둔군 분견대만으로 나가는 출병은 예전처럼 자동 판정이다.
  if (tactical && ids.length) {
    const btl = window.SamhanBattle.start(G, from, to, ids, en);
    if (!btl) return toast('출전할 부대가 없습니다');
    BattleView.open(btl, (bb, res) => {
      const out = window.SamhanBattle.applyResult(G, bb, en);
      const nm = en.castleDef(to).nm;
      Sound.sfx(out.captured ? 'capture' : 'lose');
      if (out.captured && window.CG) CG.happy();
      toast(out.captured ? `${nm} 함락! (아군 ${nf(out.deadA)} · 적 ${nf(out.deadD)} 손실)`
        : `${bb.over.why} (아군 ${nf(out.deadA)} · 적 ${nf(out.deadD)} 손실)`,
        out.captured ? 'good' : 'bad');
      pickedOff = null; save(); render();
    });
    return;
  }
  const r = en.doAttack(G, from, to, ratio, ids.length ? ids : null);
  if (!r.ok) return toast(r.why);
  const nm = en.castleDef(to).nm;
  const who = r.lead ? `${en.officerDef(r.lead).nm}, ` : '';
  if (r.captured && window.CG) CG.happy();
  toast(r.captured ? `${who}${nm} 함락! (아군 ${nf(r.deadA)} · 적 ${nf(r.deadD)} 손실)`
    : r.win ? `${nm} 공격 성공, 함락에는 이르지 못했습니다. (아군 ${nf(r.deadA)} 손실)`
      : `${nm} 공격 실패. (아군 ${nf(r.deadA)} 손실)`, r.captured ? 'good' : r.win ? '' : 'bad');
  save(); render();
}

// ────────────────────────────────────────── 명부
function renderRoster() {
  const en = E(), box = $('#roster');
  box.innerHTML = '';
  const mine = en.factionOfficers(G, G.player)
    .sort((a, b) => (b.mu + b.ji + b.jg) - (a.mu + a.ji + a.jg));
  if (!mine.length) { box.appendChild(el('p', 'note', '거느린 무장이 없습니다.')); return; }
  for (const o of mine) {
    const d = en.officerDef(o.id);
    const row = el('button', 'rrow');
    row.innerHTML = `
      <span class="por sm">${portraitTag(o.id, d)}</span>
      <span class="rn"><b>${offName(d)}</b><i>${castleName(o.loc)}${o.corps ? ` · ${t(o.corps.unit)} ${nf(o.corps.n)}` : ''}</i></span>
      <span class="rs"><b>${o.mu}</b><b>${o.ji}</b><b>${o.jg}</b></span>
      <span class="rl">${t('lv')}${o.lv}<i class="loy sm"><i style="width:${Math.round(o.loy)}%"></i></i></span>`;
    row.onclick = () => openBio(o.id);
    box.appendChild(row);
  }
}

// ────────────────────────────────────────── 외교
const relName = r => t(r);

function renderDiplo() {
  const en = E(), box = $('#diplo');
  box.innerHTML = '';
  const me = G.factions[G.player];
  const cap = G.castles[me.cap];
  const head = el('p', 'note', t('dCash', castleName(me.cap), nf(cap.gold)));
  box.appendChild(head);

  const nb = new Set(en.neighbors(G, G.player));
  const others = Object.values(G.factions)
    .filter(f => f.alive && f.id !== G.player)
    .sort((a, b) => (nb.has(b.id) ? 1 : 0) - (nb.has(a.id) ? 1 : 0) ||
                    en.attOf(G, b.id, G.player) - en.attOf(G, a.id, G.player));

  let mark = null;
  for (const f of others) {
    const isNb = nb.has(f.id);
    if (mark !== isNb) {
      mark = isNb;
      box.appendChild(el('div', 'dsec', isNb ? t('dNeighbor') : t('dFar')));
    }
    const F = FACTIONS[f.id];
    const rel = en.relOf(G, G.player, f.id);
    const truce = me.truce[f.id] || 0;
    const att = Math.round(en.attOf(G, f.id, G.player));
    const row = el('div', 'drow');
    const left = el('div', 'dname');
    left.innerHTML = `<b style="--c:${F.color}">${facName(f.id)}
        <span class="rel ${truce ? 'truce' : rel}">${truce
          ? (LANG === 'ko' ? `화친 ${truce}개월` : `truce ${truce}mo`)
          : relName(rel)}</span></b>
      <span class="dmeta">${t('castlesN')} ${en.factionCastles(G, f.id).length} · ${t('dEyes', att)}</span>
      <span class="attbar"><i style="width:${att}%"></i></span>`;
    row.appendChild(left);

    const act = el('div', 'dact');
    const mk = (label, fn, cls) => {
      const b = el('button', cls, label); b.onclick = fn; act.appendChild(b);
    };
    if (rel === 'war') {
      mk(t('dPeace'), () => {
        const r = en.doPeace(G, G.player, f.id, 500);
        if (!r.ok) return toast(r.why);
        toast(r.accepted
          ? (LANG === 'ko' ? `${facName(f.id)}와(과) 화친했습니다. 1년간 다시 칠 수 없습니다.`
                           : `${facName(f.id)} accepts. You cannot attack them for a year.`)
          : (LANG === 'ko' ? `${facName(f.id)}이(가) 응하지 않았습니다. (가망 ${Math.round(r.chance*100)}%)`
                           : `${facName(f.id)} refuses. (odds ${Math.round(r.chance*100)}%)`),
          r.accepted ? 'good' : 'bad');
        Sound.sfx(r.accepted ? 'ok' : 'no');
        save(); render();
      });
    } else if (rel === 'ally') {
      mk(t('dBreak'), () => {
        if (!confirm(LANG === 'ko'
          ? `${facName(f.id)}와(과)의 동맹을 파기하면 여러 세력이 등을 돌립니다. 그래도 하시겠습니까?`
          : `Breaking with ${facName(f.id)} will turn several powers against you. Proceed?`)) return;
        const r = en.doBreakAlly(G, G.player, f.id);
        if (!r.ok) return toast(r.why);
        toast(LANG === 'ko' ? `${facName(f.id)}와(과)의 동맹을 파기했습니다.`
                             : `You have broken with ${facName(f.id)}.`, 'bad');
        Sound.sfx('no'); save(); render();
      }, 'war');
    } else {
      if (isNb) mk(t('dWar'), () => {
        if (!confirm(LANG === 'ko' ? `${facName(f.id)}에 선전포고하시겠습니까?`
                                   : `Declare war on ${facName(f.id)}?`)) return;
        const r = en.doDeclareWar(G, G.player, f.id);
        if (!r.ok) return toast(r.why);
        toast(LANG === 'ko' ? `${facName(f.id)}에 선전포고했습니다.`
                             : `War declared on ${facName(f.id)}.`, 'bad');
        Sound.sfx('no'); save(); render();
      }, 'war');
      mk(t('dAlly'), () => {
        const r = en.doAlly(G, G.player, f.id);
        if (!r.ok) return toast(r.why);
        toast(r.accepted
          ? (LANG === 'ko' ? `${facName(f.id)}와(과) 동맹을 맺었습니다.` : `${facName(f.id)} accepts the alliance.`)
          : (LANG === 'ko' ? `${facName(f.id)}이(가) 응하지 않았습니다. (가망 ${Math.round(r.chance*100)}%)`
                           : `${facName(f.id)} refuses. (odds ${Math.round(r.chance*100)}%)`),
          r.accepted ? 'good' : '');
        Sound.sfx(r.accepted ? 'ok' : 'no');
        save(); render();
      });
    }
    mk(t('dGift'), () => {
      const r = en.doGift(G, G.player, f.id, 300);
      if (!r.ok) return toast(r.why);
      toast(LANG === 'ko' ? `${facName(f.id)}에 예물을 보냈습니다. 호감 +${r.gain}`
                           : `Gifts sent to ${facName(f.id)}. Regard +${r.gain}`);
      Sound.sfx('ok'); save(); render();
    });
    row.appendChild(act);
    box.appendChild(row);
  }
}

// ────────────────────────────────────────── 사건
let evQueue = [];
function showEvent() {
  if (!evQueue.length) { $('#ev').hidden = true; return; }
  const e = evQueue[0];
  $('#ev').hidden = false;
  $('#evwhen').textContent = `${e.y || G.year}년 ${e.m || G.month}월`;
  $('#evnm').textContent = e.nm;
  $('#evtxt').textContent = e.txt;
  $('#evsrc').textContent = `— ${e.src}`;
  $('#evres').textContent = e.result || '';
}

// ────────────────────────────────────────── 열전
function openBio(id) {
  const en = E();
  const d = en.officerDef(id), o = G.officers[id];
  const f = o.fac ? FACTIONS[o.fac] : null;
  $('#bio').hidden = false;
  $('#bioBody').innerHTML = `
    <div class="biohead">
      <div class="bpor">${portraitTag(id, d, false)}</div>
      <div class="bmeta">
        <h3>${offName(d)}<span class="bh">${d.hanja}</span>${d.sex === '여' ? `<em class="fem">${t('female')}</em>` : ''}</h3>
        <div class="btag">
          <span class="chip" style="--c:${f ? f.color : '#8a8a8a'}">${f ? facName(o.fac) : t('wild')}</span>
          <span class="chip plain">${castleName(o.loc)}</span>
          <span class="chip plain">${t(d.unit)}</span>
          <span class="chip ${d.real ? 'real' : 'fic'}">${d.real ? t('real') : t('fic')}</span>
        </div>
        <div class="bstats">
          ${['mu', 'ji', 'jg'].map((k, i) => `
            <div class="bs"><span>${(LANG === 'ko' ? ['무력','지력','정치'] : ['Might','Wit','Rule'])[i]}</span>
              <b>${o[k]}</b><span class="bbar"><i style="width:${o[k]}%"></i></span></div>`).join('')}
        </div>
        <div class="blv">${t('lv')} ${o.lv} · ${t('exp')} ${o.exp}/${en.expNeed(o.lv)} ·
          ${t('capT')} ${nf(en.troopCap(o))} · ${t('loy')} ${Math.round(o.loy)}
          ${o.corps ? ` · ${t(o.corps.unit)} ${nf(o.corps.n)}` : ''}</div>
      </div>
    </div>
    <div class="biotext">
      <h4>${t('bio')}</h4>
      <p>${LANG === 'en' && d.bioEn ? d.bioEn : d.bio}</p>
      ${d.src ? `<p class="src">— ${LANG === 'en' && d.srcEn ? d.srcEn : d.src}</p>`
      : `<p class="src fic">${t('ficNote')}</p>`}
    </div>`;
}

// ────────────────────────────────────────── 진행
let adMonths = 0;
function nextMonth() {
  const en = E();
  if (!$('#ev').hidden) return;              // 사건을 읽는 중엔 넘기지 않는다
  // ★광고는 달이 넘어가는 자리에서만 — 전투 중이나 명령 중에 끼면 판을 망친다.
  //   cg.js 가 3분 쿨다운을 지키므로 여기서는 '적당한 자리'만 알려 준다.
  if (window.CG && CG.available() && ++adMonths >= 6) {
    adMonths = 0;
    CG.ad('midgame', () => { CG.play(); doNextMonth(); });
    return;
  }
  doNextMonth();
}
function doNextMonth() {
  const en = E();
  en.runAllAI(G);
  en.nextTurn(G);
  save(); render();
  Sound.sfx('month');
  // 이번 달에 일어난 사건을 차례로 보여 준다
  evQueue = G.log.filter(x => x.t === G.turn - 1 && x.k === 'event');
  if (evQueue.length) { Sound.sfx('event'); showEvent(); }
  const left = G.log.filter(x => x.t === G.turn - 1 && x.k === 'leave' && x.fac === G.player);
  if (left.length) {
    toast(`${left.map(x => en.officerDef(x.off).nm).join(', ')}이(가) 떠났습니다.`, 'bad');
  }
  const b = G.log.filter(x => x.t === G.turn - 1 && x.k === 'battle');
  const mineLost = b.filter(x => G.castles[x.to].fac === G.player || x.captured);
  if (b.length) {
    const last = b[b.length - 1];
    if (last.captured) toast(`${en.castleDef(last.to).nm}의 주인이 바뀌었습니다.`);
  }
}

function toast(msg, kind) {
  if (kind === 'bad') Sound.sfx('no');
  const box = $('#toast');
  box.textContent = msg;
  box.className = 'toast show ' + (kind || '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { box.className = 'toast'; }, 2600);
}

// ★포털 iframe 안의 localStorage 는 격리되거나 지워진다 → CG.store 가 있으면 그쪽으로.
//   밖에서는 그대로 localStorage 로 떨어진다.
const Store = {
  get: k => (window.CG ? CG.store.get(k) : (() => { try { return localStorage.getItem(k); } catch (e) { return null; } })()),
  set: (k, v) => { if (window.CG) CG.store.set(k, v); else { try { localStorage.setItem(k, v); } catch (e) { /* 시크릿 */ } } },
  del: k => { if (window.CG) CG.store.del(k); else { try { localStorage.removeItem(k); } catch (e) { /* 시크릿 */ } } },
};
function save() {
  try { Store.set('samhan_game', E().saveState(G)); } catch (e) { /* 저장 실패는 게임을 막지 않는다 */ }
}

// ────────────────────────────────────────── 배선
window.addEventListener('DOMContentLoaded', () => {
  initLang();
  applyStatic();
  boot();
  $('#langbtn').onclick = () => {
    setLang(LANG === 'ko' ? 'en' : 'ko');
    applyStatic();
    $('#facpick').innerHTML = '';
    boot();
    if (G) render();
  };
  $('#snd').onclick = () => {
    const on = Sound.toggle();
    $('#snd').classList.toggle('off', !on);
    if (on) Sound.play(document.getElementById('btl').hidden ? 'field' : 'battle');
    else Sound.stop();
  };
  $('#snd').classList.toggle('off', Sound.muted());
  $('#next').onclick = nextMonth;
  $('#bioClose').onclick = () => { $('#bio').hidden = true; };
  $('#bio').onclick = e => { if (e.target.id === 'bio') $('#bio').hidden = true; };
  $('#restart').onclick = () => { Store.del('samhan_game'); location.reload(); };
  $('#btlend').onclick = () => BattleView.endTurn();
  $('#evok').onclick = () => { evQueue.shift(); showEvent(); render(); };
  $('#overback').onclick = () => { Store.del('samhan_game'); location.reload(); };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $('#bio').hidden = true;
    if (e.key === ' ' && !$('#game').hidden && $('#bio').hidden) { e.preventDefault(); nextMonth(); }
  });
  $$('.tab').forEach(t => t.onclick = () => {
    $$('.tab').forEach(x => x.classList.toggle('on', x === t));
    $$('.tabpane').forEach(p => p.hidden = p.id !== t.dataset.pane);
  });
  if (new URLSearchParams(location.search).get('test')) window.runSamhanTests?.();
});
