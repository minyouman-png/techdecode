// 삼한통일전 — 화면. 엔진 상태를 읽어 그리고, 사람의 입력을 엔진 호출로 바꾼다.
// ★2026-09-13 v2 — 코에이 문법으로 뒤집었다: "무장 먼저 → 명령 찾기"에서 "명령 먼저 → 무장 고르기"로.
//   명령이 거점 수치·무장 목록 아래 맨 밑에 숨어 있었고 무장 카드를 눌러야만 나타나서,
//   직접 해 본 사람이 "내정·외교·이동·등용 그 어떤 것도 보이지 않는다"고 했다.
'use strict';

const E = () => window.SamhanEngine;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = (tag, c, x) => { const n = document.createElement(tag); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
const nf = n => Math.round(n).toLocaleString(LANG === 'ko' ? 'ko-KR' : 'en-US');
// 무장 이름 — 영어에서는 한자 로마자 표기가 없으므로 한글 이름을 그대로 두되 병기한다
const offName = d => (LANG === 'ko' ? d.nm : (d.en || d.nm));
const costG = n => t('costG', nf(n));
const UNITS = ['보병', '기병', '궁병'];

let G = null;
let picked = null;      // 선택 거점

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
  $('#btldel').textContent = t('bDelegate');
  $('#btldel').title = t('delegateTip');
  $('#help').title = t('guideTitle');
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
    G = d; enterGame(false);
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
    $('#i-over').textContent = t('modeSkirmish');
    $('#over').hidden = false;
    Sound.sfx(out.captured ? 'capture' : 'lose');
    render();
  });
}

function start(fid) {
  Sound.sfx('ok');
  G = E().newGame(fid, (Date.now() ^ 0x5a17) >>> 0);
  enterGame(true);
}

function enterGame(fresh) {
  $('#intro').hidden = true;
  Sound.init(); Sound.play('field');
  if (window.CG) CG.play();
  $('#game').hidden = false;
  MapView.init($('#map'), G, pickCastle);
  MapView.setGame(G);
  // ★AI 가 내 거점을 칠 때 바로 판정하지 않고 요격·농성을 묻는다(v3 방어전)
  if (!G.skirmish) G.holdAttacks = true;
  const cap = E().factionCastles(G, G.player).includes(FACTIONS[G.player].cap)
    ? FACTIONS[G.player].cap : (E().factionCastles(G, G.player)[0] || FACTIONS[G.player].cap);
  pickCastle(cap);
  MapView.focus(cap);
  render();
  if (fresh && !Store.get('samhan_guide')) openGuide();
  else if (G.incoming && G.incoming.length) { monthCtx = { before: snapshot(), was: { y: G.year, m: G.month } }; handleIncoming(); }
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

  const idle = en.idleCastles(G, G.player);
  const k = idle.reduce((s, x) => s + x.k, 0);
  $('#idle').textContent = t('idleBtn', k);
  $('#idle').classList.toggle('zero', k === 0);

  MapView.setGame(G);
  MapView.setBadges(Object.fromEntries(idle.map(x => [x.n, x.k])));
  MapView.draw();
  renderPanel();
  renderRoster();
  renderDiplo();

  if (G.over) {
    $('#overtxt').textContent = G.over === G.player
      ? t('winMe', facName(G.over))
      : t('winOther', facName(G.over), facName(G.player));
    $('#over').hidden = false;
  }
}

function pickCastle(n) {
  picked = n;
  MapView.select(n);
  renderPanel();
  const pane = $('#pane-castle');
  if (pane) pane.scrollTop = 0;
}
function showTab(id) {
  $$('.tab').forEach(x => x.classList.toggle('on', x.dataset.pane === id));
  $$('.tabpane').forEach(p => { p.hidden = p.id !== id; });
}
function goCastle(n) { showTab('pane-castle'); pickCastle(n); MapView.focus(n); }
// 상단 「대기 n명」 — 일이 남은 다음 거점으로
function nextIdle() {
  const list = E().idleCastles(G, G.player).map(x => x.n).sort((a, b) => a - b);
  if (!list.length) { toast(t('allOrdered')); return; }
  const i = list.findIndex(n => n > (picked || 0));
  goCastle(list[i < 0 ? 0 : i]);
  Sound.sfx('click');
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

  box.appendChild(own ? cmdMenu(picked) : foeMenu(picked));

  // 수치
  box.appendChild(el('h4', 'psub', t('detail')));
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
  for (const u of UNITS) {
    tr.innerHTML += `<div class="tu u${u}"><span>${t(u)}</span><b>${nf(c.troops[u])}</b></div>`;
  }
  box.appendChild(tr);

  // 무장
  const here = en.officersAt(G, picked);
  const ours = here.filter(o => o.fac === c.fac);
  const wild = here.filter(o => o.fac === null && o.found && !o.captive && !o.dead);
  const caps = here.filter(o => o.captive && !o.dead);
  const hiddenCount = here.filter(o => o.fac === null && !o.found).length;
  if (ours.length) box.appendChild(offList(t('here'), ours, own));
  if (caps.length && own) box.appendChild(offList(t('capHere'), caps, own, 'cap'));
  if (wild.length) box.appendChild(offList(t('wild'), wild, own, true));
  if (own && hiddenCount) box.appendChild(el('p', 'note', t('hidden', hiddenCount)));
}

function offList(title, list, own, isWild) {
  const en = E();
  const wrap = el('div', 'olist');
  wrap.appendChild(el('h4', null, title));
  for (const o of list) {
    const d = en.officerDef(o.id);
    const b = el('button', 'ocard' + (isWild ? ' wild' : ''));
    b.innerHTML = `
      <span class="por" data-p="${o.id}">${portraitTag(o.id, d)}</span>
      <span class="oinfo">
        <b>${offName(d)}${d.sex === '여' ? `<em class="fem">${t('female')}</em>` : ''}</b>
        <span class="olv">${t('lv')}${o.lv}${o.corps ? ` · <b class="cps u${o.corps.unit}">${t(o.corps.unit)} ${nf(o.corps.n)}</b>` : ''}${o.done ? ' · ✓' : ''}</span>
        ${o.fac ? `<span class="loy"><i style="width:${Math.round(o.loy)}%"></i></span>` : ''}
      </span>
      <span class="ostat"><i>${t('abMu')}</i>${o.mu}<i>${t('abJi')}</i>${o.ji}<i>${t('abJg')}</i>${o.jg}</span>`;
    // 재야 카드를 누르면 곧장 등용 명령으로, 포로 카드는 포로 처우로, 아군 카드는 열전으로
    const cap = isWild === 'cap';
    const act = () => (cap ? openCmd('포로', picked) : isWild && own ? openCmd('등용', picked, { target: o.id }) : openBio(o.id));
    b.onclick = act;
    b.oncontextmenu = ev => { ev.preventDefault(); openBio(o.id); };
    const info = el('span', 'bioBtn', cap ? t('c_포로') : isWild && own ? t('c_등용') : t('bio'));
    info.onclick = ev => { ev.stopPropagation(); act(); };
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

// ────────────────────────────────────────── 명령 메뉴
const CATS = ['내정', '군사', '인사', '계략', '외교', '정보'];
const MENU = {
  내정: ['농업', '상업', '치안', '축성', '수송', '매매', '방침'],
  군사: ['징집', '훈련', '편성', '해산', '출진'],
  인사: ['탐색', '등용', '포상', '이동', '포로'],
  계략: ['유언비어', '선동', '이간', '유혹'],
  외교: ['친선', '동맹', '강화', '공동작전', '항복권고', '선전포고', '파기'],
  정보: ['거점일람', '세력일람', '무장일람', '부대일람', '병종정보'],
};
let cmdCat = '내정';
function catOf(id) { return CATS.find(k => MENU[k].includes(id)) || '군사'; }

function cmdMenu(n) {
  const en = E(), c = G.castles[n];
  const wrap = el('div', 'cmenu');
  const idle = en.idleAt(G, n).length;
  const line = el('div', 'cline');
  line.innerHTML = `<span class="${idle ? 'hot' : ''}">${t('idleHere', idle)}</span>`;
  const pol = el('button', 'polchip', t('polChip', t('pol_' + en.policyOf(c))));
  pol.onclick = () => openCmd('방침', n);
  line.appendChild(pol);
  wrap.appendChild(line);

  const cats = el('div', 'ccats');
  for (const k of CATS) {
    const b = el('button', 'ccat' + (k === cmdCat ? ' on' : ''), t('cat_' + k));
    b.onclick = () => { cmdCat = k; Sound.sfx('click'); renderPanel(); };
    cats.appendChild(b);
  }
  wrap.appendChild(cats);

  const list = el('div', 'clist');
  for (const id of MENU[cmdCat]) {
    const def = CMD[id];
    const warn = def.block ? def.block(n) : null;
    const cost = def.cost ? def.cost(c) : '';
    const b = el('button', 'citem' + (warn ? ' dim' : ''));
    b.dataset.cmd = id;
    b.innerHTML = `<b>${t('c_' + id)}</b>${cost ? `<em>${cost}</em>` : ''}<span>${warn || t('cs_' + id)}</span>`;
    b.onclick = () => { Sound.sfx('click'); def.go ? def.go(n) : openCmd(id, n); };
    list.appendChild(b);
  }
  if (cmdCat === '외교') {
    for (const fid of en.neighbors(G, G.player)) {
      const rel = en.relOf(G, G.player, fid), truce = G.factions[G.player].truce[fid] || 0;
      const r = el('button', 'citem');
      r.innerHTML = `<b>${facName(fid)}</b><em class="rel ${truce ? 'truce' : rel}">${truce ? t('truce') : relName(rel)}</em>
        <span>${t('castlesN')} ${en.factionCastles(G, fid).length} · ${t('dEyes', Math.round(en.attOf(G, fid, G.player)))}</span>`;
      r.onclick = () => showTab('pane-diplo');
      list.appendChild(r);
    }
  }
  wrap.appendChild(list);
  return wrap;
}

function foeMenu(n) {
  const en = E(), c = G.castles[n];
  const wrap = el('div', 'cmenu');
  const rel = en.relOf(G, G.player, c.fac);
  const truce = G.factions[G.player].truce[c.fac] || 0;
  wrap.appendChild(el('p', 'note', rel === 'ally' ? t('relAlly') : truce ? t('relTruce', truce)
    : rel === 'war' ? t('relWar') : t('relPeace')));
  const src = en.castleDef(n).adj.filter(x => G.castles[x].fac === G.player);
  const list = el('div', 'clist');
  const b = el('button', 'citem' + (src.length ? '' : ' dim'));
  b.dataset.cmd = '출진';
  b.innerHTML = `<b>${t('c_공격', castleName(n))}</b><em>${nf(en.garrisonTotal(G, n))}</em>
    <span>${src.length ? t('cs_공격', src.map(castleName).join(', ')) : t('srcNone')}</span>`;
  b.onclick = () => openAttack(null, n);
  list.appendChild(b);
  const dp = el('button', 'citem');
  dp.innerHTML = `<b>${t('c_외교창')}</b><span>${t('cs_외교창')}</span>`;
  dp.onclick = () => showTab('pane-diplo');
  list.appendChild(dp);
  wrap.appendChild(list);
  return wrap;
}

// ────────────────────────────────────────── 명령 정의
// off: 무장이 필요한가 · idle: 이번 달 명령을 안 받은 무장만 · stat: 목록 정렬·강조 능력치
// block(n): 지금 못 하는 까닭(메뉴에 흐리게) · cost(c) · preview(o, s) · params(s, box) · exec(s)
function devCmd(k) {
  return {
    off: true, idle: true, stat: 'jg',
    cost: c => costG(E().costOf(c)),
    block: n => { const cap = E().castleDef(n).cap; return G.castles[n][E().ORDERS[k].key] >= cap ? t('capped', cap) : null; },
    preview: o => { const [a, b] = E().devRange(o); return t('gainRange', a, b); },
    exec: s => {
      const c = G.castles[s.n], key = E().ORDERS[k].key, before = c[key];
      const r = E().doDevelop(G, s.n, s.off, k);
      return r.ok ? { ok: true, msg: t('rStat', t(k), nf(before), nf(c[key])) } : r;
    },
  };
}

const CMD = {
  농업: devCmd('농업'), 상업: devCmd('상업'), 치안: devCmd('치안'),

  축성: {
    off: true, idle: true, stat: 'jg',
    cost: c => costG(E().fortifyCost(c)),
    block: n => (G.castles[n].wall >= E().castleDef(n).wall ? t('wallFull') : null),
    preview: o => { const [a, b] = E().fortifyRange(o); return t('gainRange', nf(a), nf(b)); },
    exec: s => {
      const r = E().doFortify(G, s.n, s.off);
      return r.ok ? { ok: true, msg: t('rStat', t('성벽'), nf(r.before), nf(r.after)) } : r;
    },
  },

  수송: {
    off: true, idle: true, stat: 'jg',
    block: n => (E().reachable(G, n).length ? null : t('destNone')),
    params: (s, box) => {
      const en = E(), c = G.castles[s.n];
      const dests = en.reachable(G, s.n).sort((a, b) => a - b);
      if (!dests.length) { box.appendChild(el('p', 'note', t('destNone'))); return false; }
      if (!dests.includes(+s.pv.to)) s.pv.to = dests[0];
      field(box, t('p_dest'), selectEl(dests.map(x => [x,
        `${castleName(x)} · ${t('gold')} ${nf(G.castles[x].gold)} · ${t('food')} ${nf(G.castles[x].food)}`]),
        s.pv.to, v => { s.pv.to = +v; drawCmd(); }));
      numField(box, s, 'gold', t('gold'), c.gold, 100);
      numField(box, s, 'food', t('food'), c.food, 1000);
      for (const u of UNITS) numField(box, s, u, t(u), c.troops[u], 100);
      const room = en.castleDef(s.pv.to).garr - en.troopTotal(G.castles[s.pv.to]);
      box.appendChild(el('p', 'hint', t('roomAt', castleName(s.pv.to), nf(Math.max(0, room)))));
      return true;
    },
    exec: s => {
      const load = { gold: s.pv.gold, food: s.pv.food, 보병: s.pv.보병, 기병: s.pv.기병, 궁병: s.pv.궁병 };
      const r = E().doTransport(G, s.n, +s.pv.to, s.off, load);
      if (!r.ok) return r;
      const parts = [['gold', r.gold], ['food', r.food], ['보병', r.보병], ['기병', r.기병], ['궁병', r.궁병]]
        .filter(x => x[1] > 0).map(x => `${t(x[0])} ${nf(x[1])}`).join(' · ');
      s.pv.gold = 0; s.pv.food = 0; UNITS.forEach(u => { s.pv[u] = 0; });
      return { ok: true, msg: t('rTrans', castleName(r.to), parts) };
    },
  },

  매매: {
    off: false,
    block: n => (G.castles[n].cm < 30 ? t('tradeNo') : null),
    params: (s, box) => {
      const en = E(), c = G.castles[s.n];
      if (c.cm < 30) { box.appendChild(el('p', 'note', t('tradeNo'))); return false; }
      s.pv.mode = s.pv.mode || 'buy';
      const buy = en.grainPrice(G, s.n), sell = en.sellPrice(G, s.n), left = en.tradeLeft(c);
      box.appendChild(el('p', 'hint', t('priceLine', buy, sell, nf(left))));
      field(box, t('p_trade'), segEl([['buy', t('p_buy')], ['sell', t('p_sell')]], s.pv.mode,
        v => { s.pv.mode = v; delete s.pv.food; drawCmd(); }));
      const max = s.pv.mode === 'buy'
        ? Math.min(left, Math.floor(c.gold / buy) * 100)
        : Math.min(left, Math.floor(c.food / 100) * 100);
      if (s.pv.food == null) s.pv.food = Math.min(max, 5000);
      const tot = el('p', 'hint tot');
      const upd = () => {
        const fd = Math.floor((+s.pv.food || 0) / 100) * 100;
        const gd = s.pv.mode === 'buy' ? Math.ceil(fd / 100 * buy) : Math.floor(fd / 100 * sell);
        tot.textContent = t('tradeTotal', nf(fd), nf(gd), s.pv.mode === 'buy');
      };
      numField(box, s, 'food', t('food'), max, 1000, upd);
      box.appendChild(tot); upd();
      return true;
    },
    exec: s => {
      const r = E().doTrade(G, s.n, s.pv.mode, s.pv.food);
      if (!r.ok) return r;
      delete s.pv.food;
      return { ok: true, msg: t('rTrade', nf(r.food), nf(r.gold), r.mode === 'buy') };
    },
  },

  방침: {
    off: false, once: true,
    params: (s, box) => {
      s.pv.pol = s.pv.pol || E().policyOf(G.castles[s.n]);
      const grid = el('div', 'polgrid');
      for (const p of E().POLICIES) {
        const b = el('button', 'polopt' + (s.pv.pol === p ? ' on' : ''));
        b.type = 'button';
        b.innerHTML = `<b>${t('pol_' + p)}</b><span>${t('pold_' + p)}</span>`;
        b.onclick = () => { s.pv.pol = p; Sound.sfx('click'); drawCmd(); };
        grid.appendChild(b);
      }
      box.appendChild(grid);
      return true;
    },
    exec: s => {
      const r = E().setPolicy(G, s.n, s.pv.pol);
      return r.ok ? { ok: true, msg: t('rPolicy', castleName(s.n), t('pol_' + r.policy)) } : r;
    },
  },

  징집: {
    off: true, idle: true, stat: 'jg',
    block: n => {
      const en = E(), c = G.castles[n];
      return en.castleDef(n).garr - en.troopTotal(c) <= 0 ? t('garrFull') : null;
    },
    params: (s, box) => {
      const en = E(), c = G.castles[s.n], d = en.castleDef(s.n);
      s.pv.unit = s.pv.unit || '보병'; s.pv.mode = s.pv.mode || '모병';
      field(box, t('p_unit'), segEl(UNITS.map(u => [u, t(u)]), s.pv.unit, v => { s.pv.unit = v; drawCmd(); }));
      field(box, t('p_mode'), segEl([['모병', t('모병')], ['징병', t('징병')]], s.pv.mode,
        v => { s.pv.mode = v; drawCmd(); }));
      const per = Math.round(en.SIM.UNITS[s.pv.unit].cost * en.SIM.RECRUIT[s.pv.mode].priceMul);
      const room = Math.max(0, d.garr - en.troopTotal(c));
      const max = Math.max(0, Math.floor(Math.min(en.draftCap(c), room, c.gold / per * 1000) / 100) * 100);
      if (s.pv.count == null) s.pv.count = Math.min(max, 1000);
      const tot = el('p', 'hint tot');
      const upd = () => { tot.textContent = t('recruitCost', nf(Math.round((+s.pv.count || 0) / 1000 * per))); };
      numField(box, s, 'count', t('p_count'), max, 100, upd);
      box.appendChild(tot); upd();
      box.appendChild(el('p', 'hint', t('recruitHint', nf(en.draftCap(c)), nf(room), nf(per))));
      box.appendChild(el('p', 'hint', t(s.pv.mode === '모병' ? 'modeHire' : 'modeDraft')));
      return max > 0;
    },
    exec: s => {
      const r = E().doRecruit(G, s.n, s.off, s.pv.unit, s.pv.count, s.pv.mode);
      if (!r.ok) return r;
      delete s.pv.count;
      return { ok: true, msg: t('rRecruit', t(r.mode), t(r.unit), nf(r.count), nf(r.gold)) };
    },
  },

  훈련: {
    off: true, idle: true, stat: 'mu',
    block: n => (E().troopTotal(G.castles[n]) ? null : t('noTroops')),
    preview: o => t('gainOne', E().trainGain(o)),
    exec: s => {
      const c = G.castles[s.n], before = c.train;
      const r = E().doTrain(G, s.n, s.off);
      return r.ok ? { ok: true, msg: t('rStat', t('훈련도'), before, c.train) } : r;
    },
  },

  편성: {
    off: true, idle: false, stat: 'mu',
    preview: o => (o.corps && o.corps.n > 0
      ? `${t(o.corps.unit)} ${nf(o.corps.n)}/${nf(E().troopCap(o))}` : t('capLead', nf(E().troopCap(o)))),
    params: (s, box) => {
      const en = E(), c = G.castles[s.n], o = G.officers[s.off];
      if (!o) return false;
      const locked = !!(o.corps && o.corps.n > 0);
      if (locked) s.pv.unit = o.corps.unit;
      s.pv.unit = s.pv.unit || '보병';
      field(box, t('p_unit'), segEl(UNITS.map(u => [u, `${t(u)} ${nf(c.troops[u])}`]), s.pv.unit,
        v => { s.pv.unit = v; delete s.pv.count; drawCmd(); }, locked));
      const room = Math.max(0, en.troopCap(o) - (locked ? o.corps.n : 0));
      const max = Math.floor(Math.min(room, c.troops[s.pv.unit]) / 100) * 100;
      if (s.pv.count == null) s.pv.count = max;
      numField(box, s, 'count', t('p_count'), max, 100);
      box.appendChild(el('p', 'hint', locked ? t('corpsLocked', t(o.corps.unit)) : t('capLead', nf(en.troopCap(o)))));
      return max > 0;
    },
    exec: s => {
      const r = E().doAssign(G, s.n, s.off, s.pv.unit, s.pv.count);
      if (!r.ok) return r;
      delete s.pv.count;
      return { ok: true, msg: t('rAssign', t(r.unit), nf(r.total)) };
    },
  },

  해산: {
    off: true, idle: false, stat: 'mu', filter: o => !!(o.corps && o.corps.n > 0),
    block: n => (E().corpsAt(G, n, G.player).length ? null : t('noCorpsHere')),
    preview: o => `${t(o.corps.unit)} ${nf(o.corps.n)}`,
    exec: s => {
      const r = E().doDisband(G, s.off);
      return r.ok ? { ok: true, msg: t('rDisband', nf(r.back), nf(r.lost)) } : r;
    },
  },

  출진: {
    block: n => (E().castleDef(n).adj.some(x => G.castles[x].fac !== G.player) ? null : t('foeNone')),
    go: n => openAttack(n, null),
  },

  탐색: {
    off: true, idle: true, stat: 'jg',
    preview: o => t('chance', Math.round(E().searchChance(o) * 100)),
    params: (s, box) => {
      const k = E().officersAt(G, s.n).filter(o => o.fac === null && !o.found).length;
      box.appendChild(el('p', 'hint', k ? t('hidden', k) : t('hiddenNone')));
      return true;
    },
    exec: s => {
      const r = E().doSearch(G, s.n, s.off);
      if (!r.ok) return r;
      const nm = r.id ? offName(E().officerDef(r.id)) : '';
      return { ok: true, good: !!r.found, msg: r.found ? t('rSearchY', nm) : (r.why ? t('hiddenNone') : t('rSearchN')) };
    },
  },

  등용: {
    off: true, idle: true, stat: 'jg', paramsFirst: true,
    block: n => (E().wildAt(G, n).length ? null : t('wildNone')),
    preview: (o, s) => (s.pv.target ? t('chance', Math.round(E().hireChance(G, o.id, s.pv.target) * 100)) : ''),
    params: (s, box) => {
      const en = E(), wild = en.wildAt(G, s.n);
      if (!wild.length) { box.appendChild(el('p', 'note', t('wildNone'))); return false; }
      if (!wild.some(w => w.id === s.pv.target)) s.pv.target = wild[0].id;
      box.appendChild(el('h4', null, t('p_target')));
      for (const w of wild) {
        const d = en.officerDef(w.id);
        const b = el('button', 'tgt' + (w.id === s.pv.target ? ' on' : ''));
        b.type = 'button';
        b.innerHTML = `<span class="por sm">${portraitTag(w.id, d)}</span>
          <span class="pn"><b>${offName(d)}</b><i>${t(d.unit)}${d.real ? ` · ${t('real')}` : ''}</i></span>
          <span class="pst"><i>${t('abMu')}</i>${w.mu} <i>${t('abJi')}</i>${w.ji} <i>${t('abJg')}</i>${w.jg}</span>`;
        b.onclick = () => { s.pv.target = w.id; Sound.sfx('click'); drawCmd(); };
        box.appendChild(b);
      }
      return true;
    },
    exec: s => {
      const r = E().doRecruitOfficer(G, s.n, s.off, s.pv.target);
      if (!r.ok) return r;
      const nm = offName(E().officerDef(s.pv.target));
      return { ok: true, good: r.joined, msg: r.joined ? t('rHireY', nm) : t('rHireN', nm) };
    },
  },

  포상: {
    off: true, idle: false, stat: 'loy', asc: true,
    preview: o => (o.loy >= 99 ? t('loyFull') : ''),
    params: (s, box) => {
      s.pv.amount = s.pv.amount || 300;
      field(box, t('p_amount'), segEl([[100, costG(100)], [300, costG(300)], [500, costG(500)]], s.pv.amount,
        v => { s.pv.amount = +v; drawCmd(); }));
      box.appendChild(el('p', 'hint', t('rewardHint')));
      return true;
    },
    exec: s => {
      const o = G.officers[s.off], before = Math.round(o.loy);
      const r = E().doReward(G, s.n, s.off, s.pv.amount);
      return r.ok ? { ok: true, msg: t('rStat', t('loy'), before, Math.round(o.loy)) } : r;
    },
  },

  이동: {
    off: true, idle: true, stat: 'mu',
    block: n => (E().reachable(G, n).length ? null : t('destNone')),
    preview: o => (o.corps && o.corps.n > 0 ? `${t(o.corps.unit)} ${nf(o.corps.n)}` : ''),
    params: (s, box) => {
      const dests = E().reachable(G, s.n).sort((a, b) => a - b);
      if (!dests.length) { box.appendChild(el('p', 'note', t('destNone'))); return false; }
      if (!dests.includes(+s.pv.to)) s.pv.to = dests[0];
      field(box, t('p_dest'), selectEl(dests.map(x => [x,
        `${castleName(x)} · ${t('here')} ${E().officersAt(G, x).filter(o => o.fac === G.player).length}`]),
        s.pv.to, v => { s.pv.to = +v; }));
      return true;
    },
    exec: s => {
      const r = E().doMove(G, s.off, +s.pv.to);
      return r.ok ? { ok: true, msg: t('rMove', castleName(r.to)) } : r;
    },
  },

  포로: {
    off: false, noExec: true,
    block: () => (E().captivesOf(G, G.player).length ? null : t('capNone')),
    more: () => E().captivesOf(G, G.player).length > 0,
    params: (s, box) => {
      const en = E(), list = en.captivesOf(G, G.player);
      if (!list.length) { box.appendChild(el('p', 'note', t('capNone'))); return false; }
      for (const o of list) {
        const d = en.officerDef(o.id), p = en.hireCaptiveChance(G, o.id);
        const lord = en.LORD_ID[o.capFrom] === o.id;
        const card = el('div', 'capcard');
        card.dataset.off = o.id;
        card.innerHTML = `<span class="por sm">${portraitTag(o.id, d)}</span>
          <span class="pn"><b>${offName(d)}</b><i>${t('capFromAt', facName(o.capFrom), castleName(o.loc))}${lord ? ` · ${t('lordMark')}` : ''}</i></span>
          <span class="pst"><i>${t('abMu')}</i>${o.mu} <i>${t('abJi')}</i>${o.ji} <i>${t('abJg')}</i>${o.jg}</span>`;
        const acts = el('div', 'capacts');
        const b1 = el('button', 'hire', o.capTry === G.turn ? t('capTried') : `${t('capHire')} · ${t('chance', Math.round(p * 100))}`);
        b1.disabled = o.capTry === G.turn || p === 0;
        b1.onclick = () => capAct(o.id, 'hire');
        const b2 = el('button', 'free', t('capFree'));
        b2.onclick = () => capAct(o.id, 'free');
        const b3 = el('button', 'kill', s.pv.kill === o.id ? t('capKillSure') : t('capKill'));
        b3.onclick = () => { if (s.pv.kill !== o.id) { s.pv.kill = o.id; drawCmd(); return; } capAct(o.id, 'kill'); };
        acts.append(b1, b2, b3);
        card.appendChild(acts);
        box.appendChild(card);
      }
      box.appendChild(el('p', 'hint', t('capHint')));
      return true;
    },
  },

  유언비어: plotCmd('유언비어'), 선동: plotCmd('선동'), 이간: plotCmd('이간'), 유혹: plotCmd('유혹'),

  친선: diploCmd({
    list: () => othersAlive(),
    params: (s, box) => {
      s.pv.amount = s.pv.amount || 300;
      field(box, t('p_amount'), segEl([[300, costG(300)], [500, costG(500)], [1000, costG(1000)]], s.pv.amount,
        v => { s.pv.amount = +v; drawCmd(); }));
    },
    preview: (o, s) => t('regardGain', E().giftGain(s.pv.amount || 300, o)),
    exec: s => {
      const r = E().doGift(G, G.player, s.pv.fac, s.pv.amount, { src: s.n, envoy: s.off });
      return r.ok ? { ok: true, msg: t('rGift', facName(s.pv.fac), r.gain) } : r;
    },
  }),
  동맹: diploCmd({
    list: () => othersAlive().filter(f => E().relOf(G, G.player, f) === 'peace'),
    hint: 'allyHint',
    preview: (o, s) => t('chance', Math.round(E().allyChance(G, G.player, s.pv.fac, o) * 100)),
    exec: s => {
      const r = E().doAlly(G, G.player, s.pv.fac, { src: s.n, envoy: s.off });
      if (!r.ok) return r;
      return { ok: true, good: r.accepted, msg: r.accepted ? t('rAllyY', facName(s.pv.fac)) : t('rRefuse', facName(s.pv.fac), Math.round(r.chance * 100)) };
    },
  }),
  강화: diploCmd({
    list: () => othersAlive().filter(f => E().atWar(G, G.player, f)),
    hint: 'peaceHint',
    params: (s, box) => {
      if (s.pv.amount == null) s.pv.amount = 500;
      field(box, t('p_amount'), segEl([[0, t('noGold')], [500, costG(500)], [1000, costG(1000)]], s.pv.amount,
        v => { s.pv.amount = +v; drawCmd(); }));
    },
    preview: (o, s) => t('chance', Math.round(E().peaceChance(G, G.player, s.pv.fac, s.pv.amount || 0, o) * 100)),
    exec: s => {
      const r = E().doPeace(G, G.player, s.pv.fac, s.pv.amount, { src: s.n, envoy: s.off });
      if (!r.ok) return r;
      return { ok: true, good: r.accepted, msg: r.accepted ? t('rPeaceY', facName(s.pv.fac)) : t('rRefuse', facName(s.pv.fac), Math.round(r.chance * 100)) };
    },
  }),
  공동작전: diploCmd({
    list: () => othersAlive().filter(f => E().relOf(G, G.player, f) === 'ally' && E().jointTargets(G, G.player, f).length),
    hint: 'jointHint', cost: () => costG(E().JOINT_COST),
    params: (s, box) => {
      const en = E(), tg = en.jointTargets(G, G.player, s.pv.fac);
      if (!tg.includes(+s.pv.to)) s.pv.to = tg[0];
      field(box, t('p_target'), selectEl(tg.map(x => [x, `${castleName(x)} · ${facName(G.castles[x].fac)} · ${nf(en.garrisonTotal(G, x))}`]),
        s.pv.to, v => { s.pv.to = +v; drawCmd(); }));
      const src = en.jointSources(G, s.pv.fac, +s.pv.to)[0];
      if (src != null) box.appendChild(el('p', 'hint', t('jointFrom', facName(s.pv.fac), castleName(src), nf(en.troopTotal(G.castles[src])))));
    },
    preview: (o, s) => t('chance', Math.round(E().jointChance(G, G.player, s.pv.fac, o) * 100)),
    exec: s => {
      const to = +s.pv.to, nm = castleName(to), ally = facName(s.pv.fac);
      const r = E().doJoint(G, G.player, s.pv.fac, to, { src: s.n, envoy: s.off });
      if (!r.ok) return r;
      if (!r.accepted) return { ok: true, good: false, msg: t('rRefuse', ally, Math.round(r.chance * 100)) };
      return { ok: true, good: r.battle.win, msg: r.battle.captured ? t('rJointCap', ally, nm) : r.battle.win ? t('rJointWin', ally, nm) : t('rJointLose', ally, nm) };
    },
  }),
  항복권고: diploCmd({
    list: () => othersAlive().filter(f => E().relOf(G, G.player, f) !== 'ally'),
    hint: 'demandHint', cost: () => costG(E().DEMAND_COST),
    params: (s, box) => {
      const r = E().demandRatio(G, G.player, s.pv.fac);
      box.appendChild(el('p', 'hint tot', t('demandRatio', r.toFixed(1))));
      return r >= 3;
    },
    preview: (o, s) => t('chance', Math.round(E().demandChance(G, G.player, s.pv.fac, o) * 100)),
    exec: s => {
      const fac = facName(s.pv.fac);
      const r = E().doDemand(G, G.player, s.pv.fac, { src: s.n, envoy: s.off });
      if (!r.ok) return r;
      return { ok: true, good: r.accepted, msg: r.accepted ? t('rSurr', fac, r.castles) : t('rRefuse', fac, Math.round(r.chance * 100)) };
    },
  }),
  선전포고: diploCmd({
    envoy: false, hint: 'warHint',
    list: () => { const nb = new Set(E().neighbors(G, G.player)); return othersAlive().filter(f => nb.has(f) && E().relOf(G, G.player, f) === 'peace' && !(G.factions[G.player].truce[f] > 0)); },
    exec: s => {
      const r = E().doDeclareWar(G, G.player, s.pv.fac);
      return r.ok ? { ok: true, good: false, msg: t('rWar', facName(s.pv.fac)) } : r;
    },
  }),
  파기: diploCmd({
    envoy: false, hint: 'unallyHint',
    list: () => othersAlive().filter(f => E().relOf(G, G.player, f) === 'ally'),
    exec: s => {
      const r = E().doBreakAlly(G, G.player, s.pv.fac);
      return r.ok ? { ok: true, good: false, msg: t('rUnally', facName(s.pv.fac)) } : r;
    },
  }),

  외교창: { go: () => showTab('pane-diplo') },
  거점일람: { go: () => openInfo('castles') },
  세력일람: { go: () => openInfo('factions') },
  무장일람: { go: () => openInfo('officers') },
  부대일람: { go: () => openInfo('corps') },
  병종정보: { go: () => openInfo('units') },
};

function othersAlive() { return Object.values(G.factions).filter(f => f.alive && f.id !== G.player).map(f => f.id); }
function relLabel(fid) {
  const tr = G.factions[G.player].truce[fid] || 0;
  return tr ? t('truce') : relName(E().relOf(G, G.player, fid));
}

// 계략 — 대상 거점(과 무장)을 먼저 고르고, 지력 순 무장이 가망과 함께 나온다
function plotCmd(kind) {
  const P = () => E().PLOTS[kind];
  return {
    off: true, idle: true, stat: 'ji', paramsFirst: true,
    cost: () => costG(E().PLOTS[kind].cost),
    block: n => (E().plotTargets(G, n).length ? null : t('plotNone')),
    preview: (o, s) => (s.pv.to != null && (!P().officer || s.pv.target)
      ? t('chance', Math.round(E().plotChance(G, kind, o.id, +s.pv.to, s.pv.target) * 100)) : ''),
    params: (s, box) => {
      const en = E(), tg = en.plotTargets(G, s.n);
      if (!tg.length) { box.appendChild(el('p', 'note', t('plotNone'))); return false; }
      if (!tg.includes(+s.pv.to)) { s.pv.to = tg[0]; s.pv.target = null; }
      field(box, t('p_target'), selectEl(tg.map(x => [x,
        `${castleName(x)} · ${facName(G.castles[x].fac)} · ${t('치안')} ${Math.round(G.castles[x].sec)} · ${t('st_ji')} ${en.defWit(G, x)}`]),
        s.pv.to, v => { s.pv.to = +v; s.pv.target = null; drawCmd(); }));
      if (P().officer) {
        const tc = G.castles[+s.pv.to];
        const list = en.officersAt(G, +s.pv.to).filter(o => o.fac === tc.fac && !en.isLord(G, o.id))
          .sort((x, y) => x.loy - y.loy);
        if (!list.length) { box.appendChild(el('p', 'note', t('plotNoOfficer'))); return false; }
        if (!list.some(o => o.id === s.pv.target)) s.pv.target = list[0].id;
        box.appendChild(el('h4', null, t('p_victim')));
        for (const w of list) {
          const d = en.officerDef(w.id);
          const b = el('button', 'tgt' + (w.id === s.pv.target ? ' on' : ''));
          b.type = 'button';
          b.innerHTML = `<span class="por sm">${portraitTag(w.id, d)}</span>
            <span class="pn"><b>${offName(d)}</b><i>${t('lv')}${w.lv}</i></span>
            <span class="pst"><i>${t('st_loy')}</i>${Math.round(w.loy)} <i>${t('st_ji')}</i>${w.ji}</span>`;
          b.onclick = () => { s.pv.target = w.id; Sound.sfx('click'); drawCmd(); };
          box.appendChild(b);
        }
      }
      box.appendChild(el('p', 'hint', t('ph_' + kind)));
      return true;
    },
    exec: s => {
      const to = +s.pv.to, tf = G.castles[to].fac;
      const tn = castleName(to), vn = s.pv.target ? offName(E().officerDef(s.pv.target)) : '';
      const r = E().doPlot(G, s.n, s.off, kind, to, s.pv.target);
      if (!r.ok) return r;
      if (!r.hit) return { ok: true, good: false, msg: t('rPlotFail', tn, facName(tf), Math.round(r.chance * 100)) };
      if (kind === '유혹') s.pv.target = null;
      return { ok: true, good: true, msg: kind === '유언비어' ? t('rRumor', tn, r.eff.sec)
        : kind === '선동' ? t('rIncite', tn, r.eff.sec, nf(r.eff.desert))
        : kind === '이간' ? t('rDiscord', vn, r.eff.loy) : t('rLure', vn, castleName(s.n)) };
    },
  };
}

// 외교 — 사자를 보낼 거점·상대 세력을 먼저 고르고, 정치 순 무장이 사자로 나온다
function diploCmd(o) {
  const envoy = o.envoy !== false;
  return {
    off: envoy, idle: true, stat: 'jg', paramsFirst: true, cost: o.cost,
    block: () => (o.list().length ? null : t('facNone')),
    preview: o.preview && ((off, s) => (s.pv.fac ? o.preview(off, s) : '')),
    params: (s, box) => {
      const en = E(), list = o.list();
      if (envoy) {
        const mine = en.factionCastles(G, G.player).sort((x, y) => x - y);
        field(box, t('p_src'), selectEl(mine.map(n => [n,
          `${castleName(n)} · ${t('idleShort', en.idleAt(G, n).length)} · ${t('gold')} ${nf(G.castles[n].gold)}`]),
          s.n, v => { s.n = +v; s.off = null; drawCmd(); }));
      }
      if (!list.length) { box.appendChild(el('p', 'note', t('facNone'))); return false; }
      if (!list.includes(s.pv.fac)) s.pv.fac = list[0];
      field(box, t('p_fac'), selectEl(list.map(f => [f,
        `${facName(f)} · ${relLabel(f)} · ${t('thAtt')} ${Math.round(en.attOf(G, f, G.player))} · ${t('castlesN')} ${en.factionCastles(G, f).length}`]),
        s.pv.fac, v => { s.pv.fac = v; drawCmd(); }));
      const extra = o.params ? o.params(s, box) : true;
      if (o.hint) box.appendChild(el('p', 'hint', t(o.hint)));
      return extra !== false;
    },
    exec: o.exec,
  };
}
// 외교 탭에서 부를 때 — 사자를 낼 수 있는 거점을 고른다
function envoyCastle() {
  const en = E();
  if (picked != null && G.castles[picked].fac === G.player && en.idleAt(G, picked).length) return picked;
  const best = en.factionCastles(G, G.player)
    .map(n => ({ n, k: en.idleAt(G, n).length, g: G.castles[n].gold }))
    .sort((x, y) => ((y.k > 0) - (x.k > 0)) || y.g - x.g)[0];
  return best ? best.n : en.purseOf(G, G.player).n;
}

function capAct(id, act) {
  const en = E(), o = G.officers[id], nm = offName(en.officerDef(id)), from = o.capFrom;
  const r = en.doCaptive(G, G.player, id, act);
  if (!r.ok) return toast(r.why, 'bad');
  const msg = act === 'hire' ? (r.joined ? t('rCapHireY', nm) : t('rCapHireN', nm, Math.round(r.chance * 100)))
    : act === 'free' ? (r.home != null ? t('rCapFree', nm, facName(from)) : t('rCapFreeWild', nm))
    : t('rCapKill', nm);
  Sound.sfx(act === 'hire' && r.joined ? 'ok' : act === 'kill' ? 'no' : 'click');
  cs.pv.kill = null;
  cs.res = { msg, off: act === 'kill' ? null : id, good: act === 'hire' ? r.joined : undefined };
  save(); render(); drawCmd();
}

// ────────────────────────────────────────── 명령 창 — 명령 → 무장 → 조건 → 결과
let cs = null;   // {id, n, off, pv, res}
function openCmd(id, n, pv) {
  cs = { id, n, off: null, pv: Object.assign({}, pv || {}), res: null };
  $('#cmd').hidden = false;
  $('#cmd .dlgx').hidden = false;
  drawCmd();
}
function closeCmd() {
  // ★방어전은 달 넘기기 한가운데다 — 결판을 내기 전에는 닫히지 않고, 닫으면 다음 침공으로 이어진다
  if (cs && cs.id === '방어') {
    if (!cs.res) return;
    $('#cmd').hidden = true; cs = null;
    handleIncoming();
    return;
  }
  $('#cmd').hidden = true; cs = null;
}

function candidates(def, n) {
  const c = G.castles[n];
  let list = E().officersAt(G, n).filter(o => o.fac && o.fac === c.fac);
  if (def.filter) list = list.filter(def.filter);
  const val = o => (def.stat === 'loy' ? o.loy : o[def.stat]);
  return list.sort((a, b) => (def.idle ? (a.done - b.done) : 0) || (def.asc ? val(a) - val(b) : val(b) - val(a)));
}

function dlgHead(box, cat, id, where, title) {
  const head = el('div', 'dhead');
  head.innerHTML = `<span class="dcat">${t('cat_' + cat)} · ${where}</span>
    <h3>${title || t('c_' + id)}</h3><p>${t('cd_' + id)}</p>`;
  box.appendChild(head);
}

function drawCmd() {
  if (!cs) return;
  if (cs.id === '출진') return drawAttack();
  if (cs.id === '방어') return drawDefense();
  const en = E(), def = CMD[cs.id], box = $('#cmdBody'), c = G.castles[cs.n];
  box.innerHTML = '';
  dlgHead(box, catOf(cs.id), cs.id, castleName(cs.n));
  if (cs.res) return drawResult(box, def);

  let can = true;
  const pbox = el('div', 'dparams');
  const params = () => { if (def.params && def.params(cs, pbox) === false) can = false; box.appendChild(pbox); };
  if (def.paramsFirst) params();

  if (def.off) {
    const list = candidates(def, cs.n);
    const usable = o => !(def.idle && o.done);
    if (!cs.off || !list.some(o => o.id === cs.off && usable(o))) cs.off = (list.find(usable) || {}).id || null;
    const wrap = el('div', 'dpick');
    wrap.appendChild(el('h4', null, t('pickWho')));
    if (!cs.off) wrap.appendChild(el('p', 'note', list.length ? t('noIdleHere') : t('noOfficer')));
    for (const o of list) {
      const d = en.officerDef(o.id);
      const ok = usable(o);
      const r = el('button', 'prow' + (o.id === cs.off ? ' on' : '') + (ok ? '' : ' done'));
      const sv = def.stat === 'loy' ? Math.round(o.loy) : o[def.stat];
      r.innerHTML = `<span class="por sm">${portraitTag(o.id, d)}</span>
        <span class="pn"><b>${offName(d)}</b><i>${t('lv')}${o.lv}${o.corps && o.corps.n > 0 ? ` · ${t(o.corps.unit)} ${nf(o.corps.n)}` : ''}${o.done ? ` · ${t('doneMark')}` : ''}</i></span>
        <span class="pst"><i>${t('st_' + def.stat)}</i>${sv}</span>
        <span class="ppv">${ok && def.preview ? def.preview(o, cs) : ''}</span>`;
      r.disabled = !ok;
      r.onclick = () => { cs.off = o.id; delete cs.pv.count; Sound.sfx('click'); drawCmd(); };
      wrap.appendChild(r);
    }
    box.appendChild(wrap);
    if (!cs.off) can = false;
  }
  if (!def.paramsFirst && (!def.off || cs.off)) params();

  const foot = el('div', 'dfoot');
  const cost = def.cost ? def.cost(c) : '';
  foot.appendChild(el('span', 'dcost', `${cost ? t('costIs', cost) + ' · ' : ''}${t('purse', nf(c.gold), nf(c.food))}`));
  const cl = el('button', 'dcl', t('close')); cl.onclick = closeCmd;
  foot.appendChild(cl);
  if (!def.noExec) {
    const go = el('button', 'dgo', cs.id === '방침' ? t('setBtn') : cs.id === '선전포고' ? t('c_선전포고') : t('exec'));
    go.disabled = !can;
    go.onclick = runCmd;
    foot.appendChild(go);
  }
  box.appendChild(foot);
}

function runCmd() {
  const def = CMD[cs.id];
  const r = def.exec(cs);
  if (!r || !r.ok) { toast(r ? r.why : '—', 'bad'); return; }
  Sound.sfx(r.good === false ? 'no' : 'ok');
  cs.res = { msg: r.msg, off: def.off ? cs.off : null, good: r.good };
  save(); render(); drawCmd();
}

function drawResult(box, def) {
  const en = E(), r = cs.res;
  const wrap = el('div', 'dres' + (r.good === false ? ' bad' : ''));
  if (r.off && G.officers[r.off]) {
    const d = en.officerDef(r.off);
    wrap.innerHTML = `<span class="por">${portraitTag(r.off, d, false)}</span><div><b>${offName(d)}</b><p>${r.msg}</p></div>`;
  } else {
    wrap.style.gridTemplateColumns = '1fr';
    wrap.innerHTML = `<div><p>${r.msg}</p></div>`;
  }
  box.appendChild(wrap);
  const foot = el('div', 'dfoot');
  foot.appendChild(el('span', 'dcost', cs.id === '출진' || cs.id === '방어' ? '' : t('purse', nf(G.castles[cs.n].gold), nf(G.castles[cs.n].food))));
  const cl = el('button', 'dcl', cs.id === '방어' ? t('defNext') : t('close')); cl.onclick = closeCmd;
  foot.appendChild(cl);
  const more = def.once ? false : def.more ? def.more()
    : def.off ? candidates(def, cs.n).some(o => !(def.idle && o.done)) : true;
  if (more) {
    const a = el('button', 'dgo alt', t('cmdAgain'));
    a.onclick = () => { cs.res = null; drawCmd(); };
    foot.appendChild(a);
  }
  box.appendChild(foot);
}

// 입력 부품
function field(box, label, ctrl) {
  const f = el('div', 'fld');                       // ★label 로 감싸면 글자를 눌러도 첫 버튼이 눌린다
  f.appendChild(el('span', null, label));
  f.appendChild(ctrl);
  box.appendChild(f);
  return f;
}
function selectEl(opts, val, on) {
  const s = el('select');
  for (const [v, l] of opts) s.appendChild(new Option(l, v));
  s.value = String(val);
  s.onchange = () => on(s.value);
  return s;
}
function segEl(opts, val, on, locked) {
  const w = el('div', 'seg');
  for (const [v, l] of opts) {
    const cur = String(v) === String(val);
    const b = el('button', cur ? 'on' : null, l);
    b.type = 'button';
    b.disabled = !!locked && !cur;
    b.onclick = () => { if (!cur) { Sound.sfx('click'); on(v); } };
    w.appendChild(b);
  }
  return w;
}
function numField(box, s, key, label, max, step, onInput) {
  max = Math.max(0, Math.floor(max));
  s.pv[key] = Math.min(Math.max(0, Math.floor(+s.pv[key] || 0)), max);
  const w = el('div', 'numw');
  const inp = el('input');
  inp.type = 'number'; inp.min = 0; inp.max = max; inp.step = step; inp.value = s.pv[key];
  inp.inputMode = 'numeric'; inp.dataset.key = key;
  inp.oninput = () => { s.pv[key] = Math.max(0, Math.min(max, Math.floor(+inp.value || 0))); if (onInput) onInput(); };
  const all = el('button', null, t('allBtn'));
  all.type = 'button';
  all.onclick = () => { s.pv[key] = max; inp.value = max; if (onInput) onInput(); };
  w.append(inp, all, el('i', null, `/ ${nf(max)}`));
  field(box, label, w);
  return inp;
}

// ────────────────────────────────────────── 출진 창
function openAttack(from, to) {
  cs = { id: '출진', n: from != null ? from : to, off: null, res: null,
         pv: { from, to, fixFrom: from != null } };
  $('#cmd').hidden = false;
  $('#cmd .dlgx').hidden = false;
  drawAttack();
}

function drawAttack() {
  const en = E(), box = $('#cmdBody'), s = cs;
  box.innerHTML = '';
  const title = s.pv.to != null && !s.pv.fixFrom ? t('c_공격', castleName(s.pv.to)) : null;
  dlgHead(box, '군사', '출진', castleName(s.n), title);
  if (s.res) return drawResult(box, { off: false, once: true });

  const pbox = el('div', 'dparams');
  const stop = msg => {
    pbox.appendChild(el('p', 'note', msg)); box.appendChild(pbox);
    const foot = el('div', 'dfoot');
    const cl = el('button', 'dcl', t('close')); cl.onclick = closeCmd;
    foot.appendChild(cl); box.appendChild(foot);
  };
  if (s.pv.fixFrom) {
    const foes = en.castleDef(s.pv.from).adj.filter(x => G.castles[x].fac !== G.player);
    if (!foes.length) return stop(t('foeNone'));
    if (!foes.includes(s.pv.to)) s.pv.to = foes[0];
    field(pbox, t('p_target'), selectEl(foes.map(x => [x,
      `${castleName(x)} · ${facName(G.castles[x].fac)} · ${nf(en.garrisonTotal(G, x))}`]),
      s.pv.to, v => { s.pv.to = +v; drawAttack(); }));
  } else {
    const src = en.castleDef(s.pv.to).adj.filter(x => G.castles[x].fac === G.player);
    if (!src.length) return stop(t('srcNone'));
    if (!src.includes(s.pv.from)) { s.pv.from = src[0]; s.pv.sel = null; }
    field(pbox, t('p_from'), selectEl(src.map(x => [x, `${castleName(x)} · ${nf(en.garrisonTotal(G, x))}`]),
      s.pv.from, v => { s.pv.from = +v; s.pv.sel = null; drawAttack(); }));
  }
  const from = s.pv.from, to = s.pv.to, tc = G.castles[to];
  const rel = en.relOf(G, G.player, tc.fac), truce = G.factions[G.player].truce[tc.fac] || 0;
  pbox.appendChild(el('p', 'hint', rel === 'ally' ? t('relAlly') : truce ? t('relTruce', truce)
    : rel === 'war' ? t('relWar') : t('relPeace')));

  const corps = en.corpsAt(G, from, G.player);
  if (!s.pv.sel) s.pv.sel = corps.map(o => o.id);
  let mine;
  if (corps.length) {
    pbox.appendChild(el('h4', null, t('pickCorps')));
    for (const o of corps) {
      const d = en.officerDef(o.id);
      const on = s.pv.sel.includes(o.id);
      const r = el('button', 'prow' + (on ? ' on' : ''));
      r.type = 'button';
      r.innerHTML = `<span class="por sm">${portraitTag(o.id, d)}</span>
        <span class="pn"><b>${offName(d)}</b><i>${t('lv')}${o.lv}</i></span>
        <span class="pst"><i>${t('st_mu')}</i>${o.mu}</span>
        <span class="ppv">${t(o.corps.unit)} ${nf(o.corps.n)}</span>`;
      r.onclick = () => {
        s.pv.sel = on ? s.pv.sel.filter(x => x !== o.id) : s.pv.sel.concat(o.id);
        Sound.sfx('click'); drawAttack();
      };
      pbox.appendChild(r);
    }
    mine = corps.filter(o => s.pv.sel.includes(o.id)).reduce((x, o) => x + o.corps.n, 0);
  } else {
    pbox.appendChild(el('p', 'hint', t('noCorps')));
    s.pv.ratio = s.pv.ratio || 0.8;
    const RA = [[1, t('ra100')], [0.8, t('ra80')], [0.6, t('ra60')], [0.4, t('ra40')]];
    field(pbox, t('p_ratio'), segEl(RA, s.pv.ratio, v => { s.pv.ratio = +v; drawAttack(); }));
    mine = Math.round(en.troopTotal(G.castles[from]) * s.pv.ratio);
  }
  // ★들어가기 전에 양쪽 병력을 보여 준다. 3,600 으로 14,000 을 치러 들어가면 학살당한다.
  const theirs = en.garrisonTotal(G, to);
  const ratio = theirs > 0 ? mine / theirs : 9;
  // ★기준은 실측이다(09-13, 전술 전투 비율마다 24판): 1.0배 0% · 1.3배 46% · 1.6배 79% · 2.0배 96%.
  //   예전 기준(1.0배 = 비등)은 한 판도 못 이기는 싸움을 해볼 만하다고 알려 줬다.
  const verdict = ratio >= 1.8 ? [t('v_plenty'), 'good'] : ratio >= 1.3 ? [t('v_even'), '']
    : ratio >= 0.9 ? [t('v_short'), 'warn'] : [t('v_none'), 'bad'];
  const bal = el('div', 'fbal2 ' + verdict[1]);
  bal.innerHTML = `${t('forceMine')} <b>${nf(mine)}</b> · ${t('forceTheirs')} <b>${nf(theirs)}</b>
    <span>${t('forceNote')} — ${verdict[0]}</span>`;
  pbox.appendChild(bal);
  box.appendChild(pbox);

  const foot = el('div', 'dfoot');
  foot.appendChild(el('span', 'dcost', ''));
  const cl = el('button', 'dcl', t('close')); cl.onclick = closeCmd;
  const blocked = rel === 'ally' || truce > 0 || mine <= 0;
  const quick = el('button', 'dgo alt', t('quick'));
  quick.title = t('quickTip');
  quick.disabled = blocked;
  quick.onclick = () => attackRun(false);
  foot.append(cl, quick);
  if (corps.length) {
    const tac = el('button', 'dgo', t('sally'));
    tac.disabled = blocked || !s.pv.sel.length;
    tac.onclick = () => attackRun(true);
    // 위임 — 같은 전술 전투를 무장들에게 맡기고 지도 위에서 지켜본다(09-14)
    const del = el('button', 'dgo alt', t('delegate'));
    del.title = t('delegateTip');
    del.disabled = tac.disabled;
    del.onclick = () => attackRun('delegate');
    foot.append(del, tac);
  }
  box.appendChild(foot);
}

function attackRun(tactical) {
  const en = E(), s = cs, from = s.pv.from, to = s.pv.to;
  const ids = (s.pv.sel || []).filter(id => G.officers[id] && G.officers[id].corps && G.officers[id].loc === from);
  const nm = castleName(to);
  // ★부대를 거느린 무장이 있을 때만 전술 전투가 성립한다.
  //   주둔군 분견대만으로 나가는 출병은 예전처럼 자동 판정이다.
  if (tactical && ids.length) {
    const df = G.castles[to].fac;
    if (!en.atWar(G, G.player, df)) {
      const w = en.doDeclareWar(G, G.player, df);
      if (!w.ok) return toast(w.why, 'bad');
    }
    const btl = window.SamhanBattle.start(G, from, to, ids, en);
    if (!btl) return toast(t('noSortie'), 'bad');
    closeCmd();
    const finish = (bb) => {
      const out = window.SamhanBattle.applyResult(G, bb, en);
      Sound.sfx(out.captured ? 'capture' : 'lose');
      if (out.captured && window.CG) CG.happy();
      toast(out.captured ? t('rCap', nm, nf(out.deadA), nf(out.deadD)) + caughtNote(to)
        : t('rTacLose', bb.over.why, nf(out.deadA), nf(out.deadD)), out.captured ? 'good' : 'bad');
      save(); render();
      if (out.captured) goCastle(to);
    };
    if (tactical === 'delegate') BattleView.runDelegated(btl, finish);
    else BattleView.open(btl, finish);
    return;
  }
  const r = en.doAttack(G, from, to, s.pv.ratio || 0.8, ids.length ? ids : null);
  if (!r.ok) return toast(r.why, 'bad');
  if (r.captured && window.CG) CG.happy();
  Sound.sfx(r.captured ? 'capture' : r.win ? 'ok' : 'lose');
  cs.res = {
    off: r.lead && G.officers[r.lead] && G.officers[r.lead].fac === G.player ? r.lead : null,
    good: r.captured || r.win,
    msg: r.captured ? t('rCap', nm, nf(r.deadA), nf(r.deadD)) + caughtNote(to)
      : r.win ? t('rWin', nm, nf(r.deadA)) : t('rLose', nm, nf(r.deadA)),
  };
  save(); render(); drawAttack();
}

function caughtNote(to) {
  const x = G.log.filter(v => v.k === 'captive' && v.t === G.turn && v.n === to && v.fac === G.player).pop();
  return x ? ' ' + t('rCaught', x.ids.length) : '';
}

// ────────────────────────────────────────── 방어전 — 적이 내 거점을 칠 때 요격할지 농성할지
let monthCtx = null;
function openDefense(x) {
  cs = { id: '방어', n: x.to, off: null, pv: { x }, res: null };
  $('#cmd').hidden = false;
  drawDefense();
}
function drawDefense() {
  const en = E(), box = $('#cmdBody'), x = cs.pv.x, c = G.castles[x.to];
  $('#cmd .dlgx').hidden = !cs.res;
  box.innerHTML = '';
  const head = el('div', 'dhead');
  head.innerHTML = `<span class="dcat">${t('defKicker')} · ${t('ym', G.year, G.month)}</span>
    <h3>${t('defTitle', facName(x.af), castleName(x.to))}</h3>
    <p>${t('defLede', facName(x.af), castleName(x.from), castleName(x.to))}</p>`;
  box.appendChild(head);
  if (cs.res) return drawResult(box, { off: false, once: true });

  const lead = en.bestOfficer(G, x.from, 'mu');
  const theirs = en.incomingForce(G, x), mine = en.garrisonTotal(G, x.to);
  const ratio = theirs > 0 ? mine * 1.28 / theirs : 9;
  const verdict = ratio >= 1.6 ? [t('v_plenty'), 'good'] : ratio >= 1.0 ? [t('v_even'), '']
    : ratio >= 0.6 ? [t('v_short'), 'warn'] : [t('v_none'), 'bad'];
  const pbox = el('div', 'dparams');
  const bal = el('div', 'fbal2 ' + verdict[1]);
  bal.innerHTML = `${t('forceTheirs')} <b>${nf(theirs)}</b>${lead ? ` (${offName(en.officerDef(lead.id))})` : ''} ·
    ${t('forceMine')} <b>${nf(mine)}</b> · ${t('성벽')} ${nf(c.wall)}<span>${t('defNote')} — ${verdict[0]}</span>`;
  pbox.appendChild(bal);
  pbox.appendChild(el('p', 'hint', t('defAutoHint')));
  pbox.appendChild(el('p', 'hint', t('defTacHint')));
  box.appendChild(pbox);

  const foot = el('div', 'dfoot');
  foot.appendChild(el('span', 'dcost', ''));
  const auto = el('button', 'dgo alt', t('defAuto'));
  auto.onclick = () => {
    const r = en.defendAuto(G, x);
    G.incoming.shift();
    const nm = castleName(x.to);
    Sound.sfx(r.captured ? 'lose' : 'ok');
    cs.res = { good: !r.captured, msg: !r.ok ? t('defVoid') : r.captured ? t('defLost', nm, nf(r.deadD), nf(r.deadA))
      : r.win ? t('defDamaged', nm, nf(r.deadD), nf(r.deadA)) : t('defHeld', nm, nf(r.deadD), nf(r.deadA)) };
    save(); render(); drawDefense();
  };
  const sally = (delegated) => {
    if (!en.atWar(G, x.af, G.player)) en.doDeclareWar(G, x.af, G.player);
    const btl = window.SamhanBattle.start(G, x.from, x.to, [], en, { human: 'D', atkRatio: x.ratio });
    if (!btl) return auto.onclick();
    G.incoming.shift();
    $('#cmd').hidden = true; cs = null;
    const finish = (bb) => {
      const out = window.SamhanBattle.applyResult(G, bb, en);
      const nm = castleName(x.to);
      toast(out.captured ? t('defLost', nm, nf(out.deadD), nf(out.deadA)) : t('defHeld', nm, nf(out.deadD), nf(out.deadA)),
        out.captured ? 'bad' : 'good');
      save(); render();
      handleIncoming();
    };
    if (delegated) BattleView.runDelegated(btl, finish);
    else BattleView.open(btl, finish);
  };
  const tac = el('button', 'dgo', t('defTac'));
  tac.disabled = mine <= 0;
  tac.onclick = () => sally(false);
  const del = el('button', 'dgo alt', t('defDel'));
  del.title = t('delegateTip');
  del.disabled = mine <= 0;
  del.onclick = () => sally(true);
  foot.append(auto, del, tac);
  box.appendChild(foot);
}

// ────────────────────────────────────────── 명부
function renderRoster() {
  const en = E(), box = $('#roster');
  box.innerHTML = '';
  const mine = en.factionOfficers(G, G.player)
    .sort((a, b) => (b.mu + b.ji + b.jg) - (a.mu + a.ji + a.jg));
  if (!mine.length) { box.appendChild(el('p', 'note', t('noOfficer'))); return; }
  const rk = en.ranksOf(G, G.player);
  for (const o of mine) {
    const d = en.officerDef(o.id);
    const row = el('button', 'rrow');
    row.innerHTML = `
      <span class="por sm">${portraitTag(o.id, d)}</span>
      <span class="rn"><b>${offName(d)}</b><i>${rk[o.id] !== 'officer' ? t('rank_' + rk[o.id]) + ' · ' : ''}${castleName(o.loc)}${o.corps ? ` · ${t(o.corps.unit)} ${nf(o.corps.n)}` : ''}${o.done ? ' · ✓' : ''}</i></span>
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
  const head = el('p', 'note', t('dCash'));
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
    const mk = (label, cmd, cls) => {
      const b = el('button', cls, label);
      b.onclick = () => openCmd(cmd, envoyCastle(), { fac: f.id });
      act.appendChild(b);
    };
    if (rel === 'war') mk(t('dPeace'), '강화');
    else if (rel === 'ally') {
      if (en.jointTargets(G, G.player, f.id).length) mk(t('dJoint'), '공동작전');
      mk(t('dBreak'), '파기', 'war');
    } else {
      if (isNb && !truce) mk(t('dWar'), '선전포고', 'war');
      mk(t('dAlly'), '동맹');
    }
    mk(t('dGift'), '친선');
    if (rel !== 'ally' && en.demandRatio(G, G.player, f.id) >= 3) mk(t('dDemand'), '항복권고');
    row.appendChild(act);
    box.appendChild(row);
  }
}

// ────────────────────────────────────────── 정보 일람
// ★09-14 사용자 요청 "세력 정보·장수 직위·레벨·장수 정보·병력 스펙·부대 정보" —
//   거점 · 세력(행을 누르면 상세) · 무장(직위·레벨, 머리글 정렬) · 부대(예상 공방) · 병종(전투가 쓰는 수치 그대로)
const INFO_KINDS = [['castles', '거점일람'], ['factions', '세력일람'], ['officers', '무장일람'],
  ['corps', '부대일람'], ['units', '병종정보']];
let infoKind = 'castles', infoFac = null, infoScope = 'mine', infoSort = { k: 'rank', dir: 1 };
const RANK_IDX = r => E().RANK_ORDER.indexOf(r);
function openInfo(kind, fac) { infoKind = kind; infoFac = fac || null; $('#info').hidden = false; drawInfo(); }
function drawInfo() {
  const en = E(), box = $('#infoBody');
  box.innerHTML = '';
  const kind = INFO_KINDS.find(k => k[0] === infoKind) || INFO_KINDS[0];
  dlgHead(box, '정보', kind[1], facName(G.player));
  box.appendChild(segEl(INFO_KINDS.map(([k, c]) => [k, t('c_' + c)]), kind[0],
    v => { infoKind = v; infoFac = null; drawInfo(); }));
  const draw = { castles: infoCastles, factions: infoFac ? infoFaction : infoFactions, officers: infoOfficers,
    corps: infoCorps, units: infoUnits };
  draw[kind[0]](en, box);
  const foot = el('div', 'dfoot');
  foot.appendChild(el('span', 'dcost', kind[0] === 'castles' ? t('infoHint') : ''));
  const cl = el('button', 'dcl', t('close')); cl.onclick = () => { $('#info').hidden = true; };
  foot.appendChild(cl);
  box.appendChild(foot);
}
// 표 한 장. heads = [[정렬키|null, 머리글, 칸 class]] — sortable 이면 키가 있는 머리글을 눌러 정렬한다
function infoTable(box, heads, rows, sortable) {
  const wrapT = el('div', 'tscroll');
  wrapT.style.marginTop = '10px';
  const tb = el('table', 'itab'), hr = el('tr');
  for (const [k, label, cls] of heads) {
    const can = !!(sortable && k), on = can && infoSort.k === k;
    const th = el('th', [cls, can ? 'sort' : '', on ? 'on' : ''].filter(Boolean).join(' ') || null,
      label + (on ? (infoSort.dir > 0 ? ' ▾' : ' ▴') : ''));
    if (can) th.onclick = () => { infoSort = { k, dir: infoSort.k === k ? -infoSort.dir : 1 }; drawInfo(); };
    hr.appendChild(th);
  }
  const thead = el('thead');
  thead.appendChild(hr); tb.appendChild(thead);
  const body = el('tbody');
  rows.forEach(r => body.appendChild(r));
  tb.appendChild(body);
  wrapT.appendChild(tb);
  box.appendChild(wrapT);
}
const facDot = fid => `<span class="fdot" style="background:${FACTIONS[fid].color}"></span>`;
function lordOf(en, fid) {
  const id = en.LORD_ID[fid], o = id && G.officers[id];
  return o && o.fac === fid ? id : null;
}
function relText(en, fid) {
  if (fid === G.player) return '—';
  return (G.factions[G.player].truce[fid] || 0) ? t('truce') : relName(en.relOf(G, G.player, fid));
}

function infoCastles(en, box) {
  const rows = en.factionCastles(G, G.player).sort((a, b) => a - b).map(n => {
    const c = G.castles[n], d = en.castleDef(n), idle = en.idleAt(G, n).length;
    const use = en.foodUse(c);
    const tr = el('tr', 'go');
    tr.innerHTML = `<td>${castleName(n)}</td><td>${nf(c.pop)}</td><td>${nf(c.gold)}</td>
      <td class="${use > 0 && c.food / use < 3 ? 'low' : ''}">${nf(c.food)}</td>
      <td>${nf(en.garrisonTotal(G, n))}<small style="color:var(--ink3)">/${nf(d.garr)}</small></td>
      <td class="${c.sec < 30 ? 'low' : ''}">${Math.round(c.sec)}</td><td>${nf(c.wall)}</td>
      <td class="${idle ? 'hot' : ''}">${idle || '—'}</td><td>${t('pol_' + en.policyOf(c))}</td>`;
    tr.onclick = () => { $('#info').hidden = true; goCastle(n); };
    return tr;
  });
  infoTable(box, [[null, t('thHold')], [null, t('pop')], [null, t('gold')], [null, t('food')], [null, t('thTroop')],
    [null, t('치안')], [null, t('성벽')], [null, t('thIdle')], [null, t('thPol')]], rows);
}

function infoFactions(en, box) {
  const rows = Object.values(G.factions).filter(f => f.alive)
    .map(f => {
      const cs2 = en.factionCastles(G, f.id);
      return { f, cs2, troops: cs2.reduce((x, n) => x + en.garrisonTotal(G, n), 0) };
    })
    .sort((a, b) => b.cs2.length - a.cs2.length || b.troops - a.troops)
    .map(({ f, cs2, troops }) => {
      const me = f.id === G.player, lord = lordOf(en, f.id);
      const tr = el('tr', 'go' + (me ? ' me' : ''));
      tr.innerHTML = `<td>${facDot(f.id)}${facName(f.id)}</td><td class="l">${lord ? offName(en.officerDef(lord)) : '—'}</td>
        <td>${cs2.length}</td><td>${nf(troops)}</td><td>${en.factionOfficers(G, f.id).length}</td>
        <td>${relText(en, f.id)}</td><td>${me ? '—' : Math.round(en.attOf(G, f.id, G.player))}</td>`;
      tr.onclick = () => { Sound.sfx('click'); infoFac = f.id; drawInfo(); };
      return tr;
    });
  infoTable(box, [[null, t('thFac')], [null, t('thLord'), 'l'], [null, t('castlesN')], [null, t('thTroop')],
    [null, t('thOff')], [null, t('thRel')], [null, t('thAtt')]], rows);
}

// 세력 상세 — 군주·수도·병종별 병력·금·군량·관계, 거점 표, 무장 표
function infoFaction(en, box) {
  const fid = infoFac, F = FACTIONS[fid], f = G.factions[fid];
  const back = el('button', 'dcl ibk', t('infoBack'));
  back.onclick = () => { infoFac = null; drawInfo(); };
  box.appendChild(back);
  const holds = en.factionCastles(G, fid).sort((a, b) => a - b);
  const offs = en.factionOfficers(G, fid), rk = en.ranksOf(G, fid), lord = lordOf(en, fid);
  const men = { 보병: 0, 기병: 0, 궁병: 0 };
  let gold = 0, food = 0;
  for (const n of holds) {
    const c = G.castles[n];
    gold += c.gold; food += c.food;
    for (const u in men) men[u] += c.troops[u];
  }
  const corps = offs.filter(o => o.corps && o.corps.n > 0);
  for (const o of corps) men[o.corps.unit] += o.corps.n;
  const kv = (k, v) => `<span>${k}<b>${v}</b></span>`;
  const head = el('div', 'ifac');
  head.innerHTML = `<h4>${facDot(fid)}${facName(fid)} <small>${F.hanja}</small></h4>
    <div class="ikv">
      ${kv(t('thLord'), lord ? offName(en.officerDef(lord)) : '—')}
      ${kv(t('fdCap'), holds.includes(f.cap) ? castleName(f.cap) : '—')}
      ${kv(t('castlesN'), holds.length)}
      ${kv(t('thOff'), offs.length)}
      ${kv(t('fdAvgLv'), offs.length ? (offs.reduce((x, o) => x + o.lv, 0) / offs.length).toFixed(1) : '—')}
      ${kv(t('fdCorps'), corps.length)}
      ${kv(t('thTroop'), nf(men.보병 + men.기병 + men.궁병))}
      ${['보병', '기병', '궁병'].map(u => kv(t(u), nf(men[u]))).join('')}
      ${kv(t('gold'), nf(gold))}
      ${kv(t('food'), nf(food))}
      ${fid === G.player ? '' : kv(t('thRel'), relText(en, fid)) + kv(t('thAtt'), Math.round(en.attOf(G, fid, G.player)))}
    </div>`;
  box.appendChild(head);
  box.appendChild(el('div', 'isub', t('fdHolds')));
  infoTable(box, [[null, t('thHold')], [null, t('thTroop')], [null, t('성벽')], [null, t('rank_gov'), 'l']],
    holds.map(n => {
      const gov = offs.find(o => o.loc === n && (rk[o.id] === 'gov' || rk[o.id] === 'lord'));
      const tr = el('tr', 'go');
      tr.innerHTML = `<td>${castleName(n)}</td><td>${nf(en.garrisonTotal(G, n))}</td><td>${nf(G.castles[n].wall)}</td>
        <td class="l">${gov ? offName(en.officerDef(gov.id)) : '—'}</td>`;
      tr.onclick = () => { $('#info').hidden = true; goCastle(n); };
      return tr;
    }));
  box.appendChild(el('div', 'isub', t('fdOfficers')));
  const list = offs.map(o => ({ o, r: rk[o.id] }))
    .sort((a, b) => RANK_IDX(a.r) - RANK_IDX(b.r) || b.o.lv - a.o.lv);
  infoTable(box, officerHeads(false), list.map(x => officerRow(en, x.o, x.r, false)));
}

function officerHeads(withFac) {
  return [['name', t('thName')], ['rank', t('thRank'), 'l'], ...(withFac ? [['fac', t('thFac'), 'l']] : []),
    ['lv', t('lv')], ['mu', t('st_mu')], ['ji', t('st_ji')], ['jg', t('st_jg')], ['loy', t('loy')],
    [null, t('thLoc')], ['corps', t('thCorps')], [null, t('thStat')]];
}
function officerRow(en, o, r, withFac) {
  const d = en.officerDef(o.id), cap = en.troopCap(o);
  const state = [o.done ? t('doneMark') : '', o.hurt > 0 ? t('hurtN', o.hurt) : ''].filter(Boolean).join(' · ') || '—';
  const tr = el('tr', 'go');
  tr.innerHTML = `<td>${offName(d)}</td><td class="l rk rk-${r}">${t('rank_' + r)}</td>
    ${withFac ? `<td class="l">${facDot(o.fac)}${facName(o.fac)}</td>` : ''}
    <td>${o.lv}<small class="dim"> ${o.exp}/${en.expNeed(o.lv)}</small></td>
    <td>${o.mu}</td><td>${o.ji}</td><td>${o.jg}</td>
    <td class="${o.loy < 40 ? 'low' : ''}">${Math.round(o.loy)}</td>
    <td>${castleName(o.loc)}</td>
    <td>${o.corps && o.corps.n > 0 ? `${t(o.corps.unit)} ${nf(o.corps.n)}` : '—'}<small class="dim">/${nf(cap)}</small></td>
    <td>${state}</td>`;
  tr.onclick = () => openBio(o.id);
  return tr;
}

function infoOfficers(en, box) {
  const sc = segEl([['mine', t('scopeMine')], ['all', t('scopeAll')]], infoScope, v => { infoScope = v; drawInfo(); });
  sc.style.marginTop = '8px';
  box.appendChild(sc);
  const all = infoScope === 'all';
  const facs = all ? Object.values(G.factions).filter(f => f.alive).map(f => f.id) : [G.player];
  const list = [];
  for (const fid of facs) {
    const rk = en.ranksOf(G, fid);
    for (const o of en.factionOfficers(G, fid)) list.push({ o, r: rk[o.id] });
  }
  const { k, dir } = infoSort;
  const name = x => offName(en.officerDef(x.o.id));
  const cmp = {
    name: (a, b) => name(a).localeCompare(name(b)),
    rank: (a, b) => RANK_IDX(a.r) - RANK_IDX(b.r),
    fac: (a, b) => facName(a.o.fac).localeCompare(facName(b.o.fac)),
    corps: (a, b) => (b.o.corps ? b.o.corps.n : 0) - (a.o.corps ? a.o.corps.n : 0),
  }[k] || ((a, b) => (b.o[k] || 0) - (a.o[k] || 0));
  list.sort((a, b) => cmp(a, b) * dir || RANK_IDX(a.r) - RANK_IDX(b.r) || b.o.lv - a.o.lv);
  infoTable(box, officerHeads(all), list.map(x => officerRow(en, x.o, x.r, all)), true);
  box.appendChild(el('p', 'hint', t('infoOffNote', list.length)));
}

function infoCorps(en, box) {
  const rk = en.ranksOf(G, G.player), B = window.SamhanBattle;
  const list = en.factionOfficers(G, G.player).filter(o => o.corps && o.corps.n > 0)
    .sort((a, b) => b.corps.n - a.corps.n);
  if (!list.length) { box.appendChild(el('p', 'note', t('noCorpsList'))); return; }
  const rows = list.map(o => {
    const c = G.castles[o.loc], cap = en.troopCap(o), unit = o.corps.unit;
    // 전투를 열 때와 같은 재료 — 무장 능력 + 머무는 거점의 훈련도·사기
    const s = B.unitStats({ unit, mu: o.mu, ji: o.ji, train: c.train, morale: c.morale, hurt: 0 });
    const tr = el('tr', 'go');
    tr.innerHTML = `<td>${offName(en.officerDef(o.id))}</td><td class="l rk rk-${rk[o.id]}">${t('rank_' + rk[o.id])}</td>
      <td>${castleName(o.loc)}</td><td>${t(unit)}</td>
      <td>${nf(o.corps.n)}<small class="dim">/${nf(cap)}</small><span class="ibar"><i style="width:${Math.min(100, Math.round(o.corps.n / cap * 100))}%"></i></span></td>
      <td>${Math.round(c.train)}</td><td>${Math.round(c.morale)}</td>
      <td>${s.atk.toFixed(1)}</td><td>${s.def.toFixed(1)}</td><td>${s.mv}</td><td>${s.rng}</td><td>${s.ki}</td>
      <td>${nf(Math.round(en.power(c, unit, o.corps.n, o)))}</td>`;
    tr.onclick = () => openBio(o.id);
    return tr;
  });
  infoTable(box, [[null, t('thName')], [null, t('thRank'), 'l'], [null, t('thLoc')], [null, t('thUnit')], [null, t('thN')],
    [null, t('훈련도')], [null, t('사기')], [null, t('thAtk')], [null, t('thDef')], [null, t('thMv')], [null, t('thRng')],
    [null, t('thKi')], [null, t('thPow')]], rows);
  box.appendChild(el('p', 'hint', t('corpsNote', list.length, nf(list.reduce((x, o) => x + o.corps.n, 0)))));
}

function infoUnits(en, box) {
  const U = en.SIM.UNITS, T = window.SamhanBattle.TERR;
  const weakTo = u => Object.keys(U).find(k => U[k].beats === u);
  infoTable(box, [[null, t('thUnit')], [null, t('thAtk')], [null, t('thDef')], [null, t('thMv')], [null, t('thRng')],
    [null, t('thBeats')], [null, t('thWeak')], [null, t('thCost')], [null, t('thUp')]],
    Object.entries(U).map(([k, s]) => {
      const tr = el('tr');
      tr.innerHTML = `<td>${t(k)}</td><td>${s.atk}</td><td>${s.def}</td><td>${s.mv}</td><td>${s.rng}</td>
        <td>${t(s.beats)}</td><td>${t(weakTo(k))}</td><td>${nf(s.cost)}</td><td>${nf(s.up)}</td>`;
      return tr;
    }));
  infoTable(box, [[null, t('thTerr')], [null, t('thMvCost')], [null, t('thDefMul')], [null, t('thNote'), 'l']],
    Object.values(T).map(x => {
      const notes = [x.wall ? t('tnWall') : !x.horse ? t('tnNoHorse') : x.horseMv ? t('tnHorseMv', x.horseMv) : '',
        x.hide ? t('tnHide') : '', x.gate ? t('tnGate') : ''].filter(Boolean).join(' · ') || '—';
      const tr = el('tr');
      tr.innerHTML = `<td>${t(x.nm)}</td><td>${x.wall ? 3 : x.mv}</td><td>×${x.def.toFixed(2)}</td><td class="l">${notes}</td>`;
      return tr;
    }));
  const ul = el('ul', 'ifx');
  ul.innerHTML = ['uf1', 'uf2', 'uf3', 'uf4', 'uf5'].map(k => `<li>${t(k, en.SIM.COUNTER)}</li>`).join('');
  box.appendChild(ul);
}

// ────────────────────────────────────────── 사건
let evQueue = [];
function showEvent() {
  if (!evQueue.length) { $('#ev').hidden = true; return; }
  const e = evQueue[0];
  $('#ev').hidden = false;
  $('#evwhen').textContent = t('ym', e.y || G.year, e.m || G.month);
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
          ${o.fac ? `<span class="chip plain">${t('rank_' + en.ranksOf(G, o.fac)[o.id])}</span>` : ''}<span class="chip plain">${castleName(o.loc)}</span>
          <span class="chip plain">${t(d.unit)}</span>
          <span class="chip ${d.real ? 'real' : 'fic'}">${d.real ? t('real') : t('fic')}</span>
        </div>
        <div class="bstats">
          ${['mu', 'ji', 'jg'].map(k => `
            <div class="bs"><span>${t('st_' + k)}</span>
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
const MODALS = ['ev', 'cmd', 'rep', 'info', 'guide', 'btl', 'over'];
const anyModal = () => MODALS.some(id => !$('#' + id).hidden);

let adMonths = 0;
function nextMonth() {
  if (anyModal()) return;                    // 사건·명령·보고를 읽는 중엔 넘기지 않는다
  // ★광고는 달이 넘어가는 자리에서만 — 전투 중이나 명령 중에 끼면 판을 망친다.
  //   cg.js 가 3분 쿨다운을 지키므로 여기서는 '적당한 자리'만 알려 준다.
  if (window.CG && CG.available() && ++adMonths >= 6) {
    adMonths = 0;
    CG.ad('midgame', () => { CG.play(); doNextMonth(); });
    return;
  }
  doNextMonth();
}

function snapshot() {
  const en = E(), mine = en.factionCastles(G, G.player);
  const s = { gold: 0, food: 0, troops: 0, castles: mine.length };
  for (const n of mine) { const c = G.castles[n]; s.gold += c.gold; s.food += c.food; s.troops += en.garrisonTotal(G, n); }
  return s;
}

let repPending = null;
function doNextMonth() {
  monthCtx = { before: snapshot(), was: { y: G.year, m: G.month } };
  E().runAllAI(G);
  handleIncoming();
}
// 쌓인 침공을 하나씩 묻고, 다 끝나면 달을 넘긴다
function handleIncoming() {
  const en = E(), list = G.incoming || [];
  while (list.length && !en.incomingValid(G, list[0])) list.shift();
  if (list.length) { save(); return openDefense(list[0]); }
  G.incoming = [];
  finishMonth();
}
function finishMonth() {
  const en = E();
  const ctx = monthCtx || { before: snapshot(), was: { y: G.year, m: G.month } };
  monthCtx = null;
  en.nextTurn(G);
  save(); render();
  Sound.sfx('month');
  repPending = buildReport(ctx.before, snapshot(), ctx.was);
  // 이번 달에 일어난 사건을 차례로 보여 주고, 다 읽으면 보고를 올린다
  evQueue = G.log.filter(x => x.t === G.turn - 1 && x.k === 'event');
  if (evQueue.length) { Sound.sfx('event'); showEvent(); }
  else flushReport();
}

function buildReport(before, after, was) {
  const en = E(), turn = G.turn - 1, me = G.player;
  const L = G.log.filter(x => x.t === turn);
  return {
    before, after, harvest: was.m === en.SIM.HARVEST_MONTH,
    attacked: L.filter(x => x.k === 'battle' && x.df === me && x.af !== me),
    left: L.filter(x => x.k === 'leave' && x.fac === me),
    revolts: L.filter(x => x.k === 'revolt' && G.castles[x.n] && G.castles[x.n].fac === me),
    gov: L.filter(x => x.k === 'gov'),
    falls: L.filter(x => x.k === 'fall'),
    caught: L.filter(x => x.k === 'captive' && (x.fac === me || x.from === me)),
    fled: L.filter(x => x.k === 'fled' && x.fac === me),
    plots: L.filter(x => x.k === 'plot' && x.tf === me && x.by !== me),
    freed: L.filter(x => x.k === 'freed' && (x.fac === me || x.by === me)),
    turned: L.filter(x => x.k === 'turned' && x.from === me),
    surr: L.filter(x => x.k === 'surrender' && x.a === me),
    advice: en.advise(G, me).slice(0, 3),
  };
}

function reportOn() { return Store.get('samhan_report') !== '0'; }
function flushReport() {
  const rep = repPending;
  repPending = null;
  if (!rep || G.over) return;
  if (reportOn()) return showReport(rep);
  // 보고를 끈 사람에게도 나쁜 소식만은 알린다
  if (rep.left.length) toast(t('repLeave', rep.left.map(x => offName(E().officerDef(x.off))).join(', ')), 'bad');
  const lost = rep.attacked.filter(x => x.captured);
  if (lost.length) toast(t('repLost', castleName(lost[0].to)), 'bad');
}

function showReport(rep) {
  const en = E(), box = $('#repBody');
  box.innerHTML = '';
  const head = el('div', 'dhead');
  head.innerHTML = `<span class="dcat">${t('repKicker')} · ${facName(G.player)}</span><h3>${t('repTitle', t('ym', G.year, G.month))}</h3>`;
  box.appendChild(head);

  const grid = el('div', 'rgrid');
  const cell = (label, a, b) => {
    const dlt = b - a;
    return `<div class="rcell"><span>${label}</span><b>${nf(b)}</b>
      <i class="${dlt > 0 ? 'up' : dlt < 0 ? 'down' : ''}">${dlt > 0 ? '+' : dlt < 0 ? '−' : '±'}${nf(Math.abs(dlt))}</i></div>`;
  };
  grid.innerHTML = cell(t('gold'), rep.before.gold, rep.after.gold) + cell(t('food'), rep.before.food, rep.after.food) +
    cell(t('thTroop'), rep.before.troops, rep.after.troops) + cell(t('castlesN'), rep.before.castles, rep.after.castles);
  box.appendChild(grid);

  const lines = [];
  if (rep.harvest) lines.push([t('repHarvest'), 'good']);
  for (const b of rep.attacked) {
    lines.push([t(b.captured ? 'repAtkLost' : 'repAtkHeld', facName(b.af), castleName(b.to), nf(b.deadD), nf(b.deadA)),
      b.captured ? 'bad' : 'good']);
  }
  for (const x of rep.revolts) lines.push([t('repRevolt', castleName(x.n)), 'bad']);
  if (rep.left.length) lines.push([t('repLeave', rep.left.map(x => offName(en.officerDef(x.off))).join(', ')), 'bad']);
  for (const x of rep.falls) lines.push([t('repFall', facName(x.fac)), '']);
  const names = ids => ids.map(id => offName(en.officerDef(id))).join(', ');
  for (const x of rep.caught) {
    lines.push(x.fac === G.player ? [t('repCapTook', names(x.ids), castleName(x.n)), 'good']
      : [t('repCapLost', names(x.ids), facName(x.fac)), 'bad']);
  }
  for (const x of rep.fled) lines.push([t('repFled', names(x.ids), castleName(x.n)), '']);
  for (const x of rep.plots) {
    lines.push(x.ok ? [t('repPlotHit', facName(x.by), t('c_' + x.kind), castleName(x.n)), 'bad']
      : [t('repPlotMiss', facName(x.by), castleName(x.n)), 'good']);
  }
  for (const x of rep.freed) {
    const nm = names([x.off]);
    if (x.fac === G.player && x.home != null) lines.push([t('repBack', nm, facName(x.by)), 'good']);
    else if (x.by === G.player) lines.push([t(x.why === 'lost' ? 'repCapLostCastle' : 'repEscaped', nm), 'bad']);
  }
  for (const x of rep.turned) lines.push([t('repTurned', names([x.off]), facName(x.fac)), 'bad']);
  for (const x of rep.surr) lines.push([t('repSurrTook', facName(x.b), x.castles), 'good']);
  if (rep.gov.length) lines.push([t('repGov', rep.gov.reduce((s, x) => s + x.count, 0), rep.gov.length), '']);
  if (lines.length) {
    const sec = el('div', 'rsec');
    sec.appendChild(el('h4', null, t('repNews')));
    const ul = el('ul');
    for (const [txt, cls] of lines) ul.appendChild(el('li', cls, txt));
    sec.appendChild(ul);
    box.appendChild(sec);
  }

  const sec = el('div', 'rsec');
  sec.appendChild(el('h4', null, t('repAdvice')));
  if (!rep.advice.length) sec.appendChild(el('p', 'note', t('repNone')));
  for (const a of rep.advice) {
    const row = el('div', 'adv');
    row.appendChild(el('span', null, advText(a)));
    const b = el('button', null, t('advGo'));
    b.onclick = () => { $('#rep').hidden = true; advGo(a); };
    row.appendChild(b);
    sec.appendChild(row);
  }
  box.appendChild(sec);

  const foot = el('div', 'dfoot');
  const chk = el('label', 'rchk');
  const cb = el('input'); cb.type = 'checkbox'; cb.checked = true;
  cb.onchange = () => Store.set('samhan_report', cb.checked ? '1' : '0');
  chk.append(cb, el('span', null, t('repShow')));
  foot.appendChild(chk);
  const ok = el('button', 'dgo', t('repOk'));
  ok.onclick = () => { $('#rep').hidden = true; };
  foot.appendChild(ok);
  box.appendChild(foot);
  $('#rep').hidden = false;
}

function advText(a) {
  const en = E(), nm = castleName(a.n);
  switch (a.k) {
    case 'food': return t('adv_food', nm, a.v);
    case 'deficit': return t('adv_deficit', nm, nf(a.v));
    case 'threat': return t('adv_threat', nm, castleName(a.to), a.v);
    case 'sec': return t('adv_sec', nm, a.v);
    case 'loy': return t('adv_loy', offName(en.officerDef(a.off)), a.v);
    case 'wild': return t('adv_wild', nm, offName(en.officerDef(a.off)));
    case 'hidden': return t('adv_hidden', nm, a.v);
    case 'target': return t('adv_target', nm, castleName(a.to), a.v);
    case 'thin': return t('adv_thin', nm, a.v);
    case 'captive': return t('adv_captive', a.v);
    default: return a.k;
  }
}
// 진언을 누르면 그 거점으로 가서 알맞은 명령 창까지 열어 준다
function advGo(a) {
  goCastle(a.n);
  const open = { food: '매매', deficit: '상업', sec: '치안', threat: '징집', thin: '징집', hidden: '탐색' }[a.k];
  if (a.k === 'target') return openAttack(a.n, null) || (cs.pv.to = a.to, drawAttack());
  if (a.k === 'wild') return openCmd('등용', a.n, { target: a.off });
  if (a.k === 'loy') { openCmd('포상', a.n); cs.off = a.off; return drawCmd(); }
  if (a.k === 'captive') return openCmd('포로', a.n);
  if (open) openCmd(open, a.n);
}

// ────────────────────────────────────────── 첫 판 안내
let guideStep = 0;
function openGuide() { guideStep = 0; $('#guide').hidden = false; drawGuide(); }
function closeGuide() { $('#guide').hidden = true; Store.set('samhan_guide', '1'); }
function drawGuide() {
  const box = $('#guideBody');
  box.innerHTML = '';
  const i = guideStep + 1;
  const head = el('div', 'dhead');
  head.innerHTML = `<span class="dcat">${t('guideTitle')} · ${i} / 4</span><h3>${t('g' + i + 't')}</h3>`;
  box.appendChild(head);
  box.appendChild(el('p', 'gbody', t('g' + i)));
  const dots = el('div', 'gdots');
  for (let k = 0; k < 4; k++) dots.appendChild(el('i', k === guideStep ? 'on' : null));
  box.appendChild(dots);
  const foot = el('div', 'dfoot');
  const skip = el('button', 'dcl', t('guideSkip')); skip.onclick = closeGuide;
  foot.appendChild(skip);
  foot.appendChild(el('span', 'dcost', ''));
  if (guideStep > 0) {
    const prev = el('button', 'dcl', t('guidePrev'));
    prev.onclick = () => { guideStep--; drawGuide(); };
    foot.appendChild(prev);
  }
  const next = el('button', 'dgo', guideStep < 3 ? t('guideNext') : t('guideStart'));
  next.onclick = () => { if (guideStep < 3) { guideStep++; drawGuide(); } else closeGuide(); };
  foot.appendChild(next);
  box.appendChild(foot);
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
  $('#idle').onclick = nextIdle;
  $('#help').onclick = openGuide;
  $('#bioClose').onclick = () => { $('#bio').hidden = true; };
  $('#bio').onclick = e => { if (e.target.id === 'bio') $('#bio').hidden = true; };
  $('#restart').onclick = () => {
    if (G && !G.over && !G.skirmish && !confirm(t('restartAsk'))) return;
    Store.del('samhan_game'); location.reload();
  };
  $('#btlend').onclick = () => BattleView.endTurn();
  $('#btldel').onclick = () => BattleView.delegate();
  $('#evok').onclick = () => { evQueue.shift(); showEvent(); render(); if (!evQueue.length) flushReport(); };
  $('#overback').onclick = () => { Store.del('samhan_game'); location.reload(); };
  $$('[data-close]').forEach(b => {
    b.onclick = () => { if (b.dataset.close === 'cmd') closeCmd(); else $('#' + b.dataset.close).hidden = true; };
  });
  // 바깥을 누르면 닫힌다 — 안내만은 끝까지 읽게 둔다
  for (const id of ['cmd', 'rep', 'info']) {
    $('#' + id).addEventListener('click', e => { if (e.target.id === id) { if (id === 'cmd') closeCmd(); else $('#' + id).hidden = true; } });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $('#bio').hidden = true;
      if (!$('#cmd').hidden) closeCmd();
      $('#rep').hidden = true; $('#info').hidden = true;
    }
    const typing = /INPUT|SELECT|TEXTAREA/.test((e.target && e.target.tagName) || '');
    if (e.key === ' ' && !typing && !$('#game').hidden && $('#bio').hidden) { e.preventDefault(); nextMonth(); }
  });
  $$('.tab').forEach(tab => { tab.onclick = () => showTab(tab.dataset.pane); });
  if (new URLSearchParams(location.search).get('test')) window.runSamhanTests?.();
});
