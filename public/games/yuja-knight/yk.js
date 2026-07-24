'use strict';
/* ============================================================
   유자의 기사 I · YUJA KNIGHT I — 엔진
   1인칭 그리드 던전 크롤러 RPG (고전 용의기사2 시스템 오마주)
   - 5층 미궁(시드 고정) · 턴제 전투 · 레벨업 · 열쇠→보스문→정령 구출
   - 실사풍 SDXL 아트 (벽 텍스처·전투 배경·몬스터·초상)
   ============================================================ */

window.onerror = function (msg, src, line) {
  var e = document.getElementById('err');
  if (e) { e.style.display = 'block'; e.textContent = 'Error: ' + msg + ' (line ' + line + ')'; }
};

let LANG = new URLSearchParams(location.search).get('lang');
if (!I18N[LANG]) LANG = (navigator.language || 'en').slice(0, 2);
if (!I18N[LANG]) LANG = 'en';
const L = I18N[LANG];
const qs = new URLSearchParams(location.search);
function fmt(s) { const a = arguments; return s.replace(/\{(\d)\}/g, (_, i) => a[+i + 1]); }

const SAVE_KEY = 'yk_save';
let RNG = Math.random; // 테스트에서 교체 가능

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ===== 아트 로딩 ===== */
const ART = {};
const ART_LIST = ['title', 'ending', 'port_uja', 'port_minyu', 'port_merchant', 'port_sp1', 'port_sp2', 'port_sp3', 'port_sp4', 'port_sp5', 'port_dragon', 'port_wdragon',
  'bbg1', 'bbg2', 'bbg3', 'bbg4', 'bbg5', 'wall1', 'wall2', 'wall3', 'wall4', 'wall5',
  'm_rat', 'm_dok', 'm_wisp', 'b_golem', 'm_crab', 'm_slime', 'm_wghost', 'b_imugi',
  'm_imp', 'm_lavawolf', 'm_firebird', 'b_ogre', 'm_yeoli', 'm_icegolem', 'm_frostwolf', 'b_iceking',
  'm_sknight', 'm_witch', 'm_wraith', 'b_dragon'];
function loadArt() {
  if (typeof Image === 'undefined' || qs.get('art') === '0') return;
  for (const n of ART_LIST) {
    const im = new Image();
    im.onload = () => { if (im.naturalWidth > 0) ART[n] = im; };
    im.src = 'img/' + n + (n.startsWith('m_') || n.startsWith('b_') ? '.png' : '.jpg');
  }
}
const PORTRAIT = { uja: 'port_uja', minyu: 'port_minyu', mer: 'port_merchant', sp1: 'port_sp1', sp2: 'port_sp2', sp3: 'port_sp3', sp4: 'port_sp4', sp5: 'port_sp5', drg: 'port_dragon', wdrg: 'port_wdragon' };

/* ============================================================
   미궁 생성 (13×13 · 시드 고정 · 재귀 백트래커 + 루프)
   기호: '#'벽 '.'통로 'D'보스문 'B'보스 'K'열쇠상자 'T'보물 'H'샘 'M'상인 'E'이벤트 '>'계단
   ============================================================ */
const MZ = 13;
function genFloor(f) {
  const rng = mulberry32(9100 + f * 137);
  const g = Array.from({ length: MZ }, () => Array(MZ).fill('#'));
  const stack = [[1, 1]];
  g[1][1] = '.';
  const DIRS4 = [[0, -2], [2, 0], [0, 2], [-2, 0]];
  while (stack.length) {
    const [cx2, cy2] = stack[stack.length - 1];
    const cand = DIRS4.map(([dx, dy]) => [cx2 + dx, cy2 + dy, cx2 + dx / 2, cy2 + dy / 2])
      .filter(([nx, ny]) => nx > 0 && ny > 0 && nx < MZ - 1 && ny < MZ - 1 && g[ny][nx] === '#');
    if (!cand.length) { stack.pop(); continue; }
    const [nx, ny, wx, wy] = cand[(rng() * cand.length) | 0];
    g[wy][wx] = '.'; g[ny][nx] = '.';
    stack.push([nx, ny]);
  }
  // 루프 몇 개 (탐험 재미)
  for (let k = 0; k < 5; k++) {
    const x = 1 + ((rng() * (MZ - 2)) | 0), y = 1 + ((rng() * (MZ - 2)) | 0);
    if (g[y][x] === '#' && ((g[y][x - 1] === '.' && g[y][x + 1] === '.') || (g[y - 1] && g[y - 1][x] === '.' && g[y + 1] && g[y + 1][x] === '.'))) g[y][x] = '.';
  }
  // BFS 거리
  const dist = Array.from({ length: MZ }, () => Array(MZ).fill(-1));
  const q = [[1, 1]]; dist[1][1] = 0;
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < MZ && ny < MZ && g[ny][nx] === '.' && dist[ny][nx] < 0) { dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]); }
    }
  }
  // 막다른 곳 수집 (거리 내림차순)
  const ends = [];
  for (let y = 1; y < MZ - 1; y++) for (let x = 1; x < MZ - 1; x++) {
    if (g[y][x] !== '.' || (x === 1 && y === 1)) continue;
    let open = 0;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) if (g[y + dy][x + dx] !== '#') open++;
    if (open === 1) ends.push([x, y, dist[y][x]]);
  }
  ends.sort((a, b) => b[2] - a[2]);
  const used = new Set();
  const take = () => { const e = ends.find(e2 => !used.has(e2[0] + ',' + e2[1])); if (e) used.add(e[0] + ',' + e[1]); return e; };
  // 보스 = 가장 먼 막다른 방 + 그 앞에 문
  const bE = take();
  g[bE[1]][bE[0]] = 'B';
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    const nx = bE[0] + dx, ny = bE[1] + dy;
    if (g[ny] && g[ny][nx] === '.') { g[ny][nx] = 'D'; used.add(nx + ',' + ny); break; }
  }
  const kE = take(); if (kE) g[kE[1]][kE[0]] = 'K';
  const t1 = take(); if (t1) g[t1[1]][t1[0]] = 'T';
  const t2 = take(); if (t2) g[t2[1]][t2[0]] = 'T';
  const hE = take(); if (hE) g[hE[1]][hE[0]] = 'H';
  // 상인: 시작 옆
  if (g[1][2] === '.') g[1][2] = 'M'; else if (g[2][1] === '.') g[2][1] = 'M';
  // 이벤트: 중간 거리 통로
  let ev = null, target = (bE[2] * 0.45) | 0;
  outer: for (let y = 1; y < MZ - 1; y++) for (let x = 1; x < MZ - 1; x++) {
    if (g[y][x] === '.' && Math.abs(dist[y][x] - target) <= 1 && !(x === 1 && y === 1)) { ev = [x, y]; break outer; }
  }
  if (ev) g[ev[1]][ev[0]] = 'E';
  return g;
}
let MAPS = null;
function buildMaps() { MAPS = [0, 1, 2, 3, 4].map(f => genFloor(f + 1)); }

/* ============================================================
   게임 상태
   ============================================================ */
const G = { mode: 'menu', f: 1, x: 1, y: 1, dir: 1, steps: 0, msg: [], msgT: 0, shake: 0, flash: 0, dmgFx: 0 };
let P = null;
let visited = new Set();
function mkPlayer() {
  return {
    lv: 1, exp: 0, hp: 55, maxHp: 55, mp: 12, maxMp: 12, atkBase: 10, defBase: 3,
    gold: 60, wpn: 0, arm: 0, pots: [2, 0, 0], skills: [false, false, false, false, false], key: false, ward: 0,
  };
}
const FLAGS = { boss: [false, false, false, false, false], opened: [], events: [] };
function pAtk() { return P.atkBase + WEAPONS[P.wpn]; }
function pDef() { return P.defBase + ARMORS[P.arm]; }
function expNext(lv) { return 18 * lv * lv + 12 * lv; }
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
function cell(x, y) { return (x < 0 || y < 0 || x >= MZ || y >= MZ) ? '#' : MAPS[G.f - 1][y][x]; }
function openDir(x, y) { // 스폰 시 벽을 마주보지 않도록 열린 방향 선택
  const d = [1, 2, 0, 3].find(d2 => cell(x + DX[d2], y + DY[d2]) !== '#');
  return d === undefined ? 1 : d;
}
function setCell(x, y, v) { MAPS[G.f - 1][y][x] = v; }

function logMsg(m) { G.msg.push(m); if (G.msg.length > 3) G.msg.shift(); G.msgT = 4; }

/* ===== 저장 ===== */
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, f: G.f, x: G.x, y: G.y, dir: G.dir, P, FLAGS }));
  } catch (e) {}
}
function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!s || s.v !== 1) return false;
    G.f = s.f; G.x = s.x; G.y = s.y; G.dir = s.dir;
    P = Object.assign(mkPlayer(), s.P);
    Object.assign(FLAGS, s.FLAGS);
    buildMaps();
    for (const key of FLAGS.opened) {
      const [f2, x2, y2] = key.split(':').map(Number);
      MAPS[f2 - 1][y2][x2] = '.';
    }
    for (let f2 = 1; f2 <= 5; f2++) {
      if (FLAGS.boss[f2 - 1]) {
        for (let y2 = 0; y2 < MZ; y2++) for (let x2 = 0; x2 < MZ; x2++) {
          if (MAPS[f2 - 1][y2][x2] === 'B') MAPS[f2 - 1][y2][x2] = '>';
          if (MAPS[f2 - 1][y2][x2] === 'D') MAPS[f2 - 1][y2][x2] = '.';
        }
      }
    }
    visited = new Set();
    return true;
  } catch (e) { return false; }
}

/* ============================================================
   다이얼로그 (실사 초상 + 타자 효과)
   ============================================================ */
let DLG = null;
function playDlg(lines, onEnd) {
  try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
  DLG = { lines, idx: 0, t: 0, onEnd: onEnd || (() => {}), prevMode: G.mode };
  G.mode = 'dialog';
}
function dlgNext() {
  if (!DLG) return;
  const txt = DLG.lines[DLG.idx][1];
  if (DLG.t * 40 < txt.length) { DLG.t = 999; return; }
  DLG.idx++; DLG.t = 0;
  if (DLG.idx >= DLG.lines.length) {
    const cb = DLG.onEnd, pm = DLG.prevMode;
    DLG = null;
    G.mode = pm === 'dialog' ? 'dungeon' : pm;
    cb();
  }
}
function story(key, onEnd) { playDlg(L.story[key], onEnd); }

/* ============================================================
   전투
   ============================================================ */
let BT = null;
function battleStart(id, isBoss) {
  const m = MOBS[id];
  BT = {
    id, boss: !!isBoss, hp: m.hp, maxHp: m.hp, atk: m.atk, def: m.def,
    phase: 'cmd', sel: 0, sub: -1, subSel: 0, timer: 0, turn: 0,
    log: [fmt(isBoss ? L.bossEncounter : L.encounter, L.mobs[id])],
    shakeM: 0, flashM: 0, over: 0, // over: 1=승리 2=패배 3=도망
  };
  G.mode = 'battle';
  bgmStart(isBoss ? 'boss' : 'battle');
  sfx.warn();
}
function dmgRoll(atk, def) {
  const base = atk * (0.9 + RNG() * 0.25) - def * 0.7;
  return Math.max(1, Math.round(base));
}
function battlePlayerAct(act, idx) {
  if (!BT || BT.over) return [];
  const out = [];
  if (act === 'atk') {
    let d = dmgRoll(pAtk(), BT.def);
    const crit = RNG() < 0.1;
    if (crit) d = Math.round(d * 1.6);
    BT.hp -= d;
    BT.shakeM = 0.35; BT.flashM = 0.2;
    out.push(fmt(crit ? L.critMsg : L.atkMsg, L.mobs[BT.id], d));
    sfx[crit ? 'crit' : 'atk']();
  } else if (act === 'skill') {
    const sk = SKILLS[idx];
    if (!P.skills[idx]) return [];
    if (P.mp < sk.mp) { out.push(L.noMp); sfx.deny(); return out; }
    P.mp -= sk.mp;
    if (sk.heal) {
      const h = Math.round(P.maxHp * sk.heal);
      P.hp = Math.min(P.maxHp, P.hp + h);
      out.push(fmt(L.healCast, L.skills[idx], h));
      sfx.heal();
    } else if (sk.ward) {
      P.ward = sk.ward + 1; // 이번 턴 포함
      out.push(fmt(L.buffCast, L.skills[idx]));
      sfx.heal();
    } else {
      const d = Math.round(dmgRoll(pAtk() * sk.mult, BT.def));
      BT.hp -= d;
      BT.shakeM = 0.45; BT.flashM = 0.3;
      out.push(fmt(L.skillCast, L.skills[idx], L.mobs[BT.id], d));
      sfx.magic();
    }
  } else if (act === 'item') {
    if (P.pots[idx] <= 0) { out.push(L.noItem); sfx.deny(); return out; }
    P.pots[idx]--;
    if (idx === 2) { P.mp = Math.min(P.maxMp, P.mp + 25); out.push(fmt(L.useItem, L.potions[idx], 'MP +25')); }
    else { const h = idx === 0 ? 50 : 150; P.hp = Math.min(P.maxHp, P.hp + h); out.push(fmt(L.useItem, L.potions[idx], 'HP +' + h)); }
    sfx.heal();
  } else if (act === 'run') {
    if (BT.boss) { out.push(L.noRun); sfx.deny(); return out; }
    if (RNG() < 0.62) { out.push(L.runOk); BT.over = 3; sfx.run(); return out; }
    out.push(L.runFail);
  }
  if (BT.hp <= 0) {
    BT.hp = 0; BT.over = 1;
    out.push(fmt(L.victory, L.mobs[BT.id]));
  }
  return out;
}
function battleEnemyAct() {
  if (!BT || BT.over) return [];
  const out = [];
  BT.turn++;
  const strong = BT.boss && BT.turn % 3 === 0;
  let d = dmgRoll(BT.atk * (strong ? 1.5 : 1), pDef());
  if (P.ward > 0) { d = Math.max(1, Math.round(d * 0.4)); out.push(L.guardMsg); }
  P.hp -= d;
  G.dmgFx = 0.4; G.shake = 0.3;
  out.push(fmt(strong ? L.enemyStrong : L.enemyAtk, L.mobs[BT.id], d));
  sfx.hurt();
  if (P.ward > 0) P.ward--;
  if (P.hp <= 0) { P.hp = 0; BT.over = 2; }
  return out;
}
function battleRewards() {
  const m = MOBS[BT.id];
  const out = [fmt(L.expGain, m.exp, m.gold)];
  P.exp += m.exp; P.gold += m.gold;
  while (P.exp >= expNext(P.lv)) {
    P.exp -= expNext(P.lv);
    P.lv++;
    P.maxHp += 12; P.maxMp += 4; P.atkBase += 3; P.defBase += 2;
    P.hp = P.maxHp; P.mp = P.maxMp;
    out.push(fmt(L.levelUp, P.lv));
    sfx.levelup();
  }
  return out;
}
function battleEnd() {
  const wasBoss = BT.boss, mobId = BT.id;
  BT = null;
  P.ward = 0;
  G.mode = 'dungeon';
  bgmStart('dungeon');
  if (wasBoss) {
    FLAGS.boss[G.f - 1] = true;
    // 보스 방 → 계단으로 (5층은 엔딩)
    for (let y = 0; y < MZ; y++) for (let x = 0; x < MZ; x++) if (cell(x, y) === 'B') setCell(x, y, '>');
    if (G.f < 5) {
      story('b' + G.f + 'post', () => {
        P.skills[G.f - 1] = true;
        logMsg(fmt(L.skillGet, L.skills[G.f - 1]));
        saveGame();
      });
    } else {
      startEnding();
    }
  } else {
    saveGame();
  }
}
function playerDead() {
  BT = null; P.ward = 0;
  P.gold = Math.floor(P.gold / 2);
  P.hp = Math.max(1, Math.floor(P.maxHp * 0.6));
  P.mp = P.maxMp;
  G.x = 1; G.y = 1; G.dir = openDir(1, 1); G.steps = 0;
  G.mode = 'dungeon';
  bgmStart('dungeon');
  logMsg(L.dead);
  saveGame();
}

/* ============================================================
   던전 이동·상호작용
   ============================================================ */
function tryMove(fwd) {
  if (G.mode !== 'dungeon') return;
  const d = fwd ? G.dir : (G.dir + 2) % 4;
  const nx = G.x + DX[d], ny = G.y + DY[d];
  const c = cell(nx, ny);
  if (c === '#') { logMsg(L.wallMsg); sfx.bump(); return; }
  if (c === 'D') {
    if (P.key) {
      P.key = false;
      setCell(nx, ny, '.');
      FLAGS.opened.push(G.f + ':' + nx + ':' + ny);
      logMsg(L.doorOpen);
      sfx.door(); saveGame();
    } else { logMsg(L.doorLocked); sfx.deny(); }
    return;
  }
  if (c === 'B') {
    story('b' + G.f + 'pre', () => battleStart(FLOOR_BOSS[G.f - 1], true));
    return;
  }
  if (c === '>') {
    if (!FLAGS.boss[G.f - 1]) { logMsg(L.stairsLocked); sfx.deny(); return; }
    if (G.f >= 5) return; // 5층은 battleEnd에서 엔딩 처리
    G.f++; G.x = 1; G.y = 1; G.steps = 0;
    G.dir = openDir(1, 1);
    visited = new Set(['1,1']);
    sfx.stairs();
    logMsg(fmt(L.stairsMsg, G.f, L.floors[G.f - 1]));
    saveGame();
    story('f' + G.f, () => { logMsg(L.saveMsg); });
    return;
  }
  // 이동 (상인 칸은 밟으면 상점이 열리고, 지나갈 수도 있다)
  G.x = nx; G.y = ny;
  visited.add(nx + ',' + ny);
  sfx.step();
  if (c === 'M') { openShop(); return; }
  if (c === 'K') {
    P.key = true;
    setCell(nx, ny, '.');
    FLAGS.opened.push(G.f + ':' + nx + ':' + ny);
    logMsg(L.keyGet); sfx.chest(); saveGame();
    return;
  }
  if (c === 'T') {
    setCell(nx, ny, '.');
    FLAGS.opened.push(G.f + ':' + nx + ':' + ny);
    const r = RNG();
    if (r < 0.45) { const gold = 30 + G.f * 40 + ((RNG() * 40) | 0); P.gold += gold; logMsg(fmt(L.chestGold, gold)); }
    else if (r < 0.75) { P.pots[0]++; logMsg(fmt(L.chestItem, L.potions[0])); }
    else if (r < 0.9) { P.pots[1]++; logMsg(fmt(L.chestItem, L.potions[1])); }
    else { P.pots[2]++; logMsg(fmt(L.chestItem, L.potions[2])); }
    sfx.chest(); saveGame();
    return;
  }
  if (c === 'H') {
    P.hp = P.maxHp; P.mp = P.maxMp;
    logMsg(L.springMsg); sfx.heal();
    return;
  }
  if (c === 'E') {
    setCell(nx, ny, '.');
    FLAGS.opened.push(G.f + ':' + nx + ':' + ny);
    if (G.f === 5) {
      story('sp5ev', () => { P.skills[4] = true; logMsg(fmt(L.skillGet, L.skills[4])); saveGame(); });
    } else {
      story('f' + G.f + 'hint', () => saveGame());
    }
    return;
  }
  // 랜덤 인카운터
  G.steps++;
  if (G.steps > 5 && RNG() < 0.14) {
    G.steps = 0;
    const list = FLOOR_MOBS[G.f - 1];
    battleStart(list[(RNG() * list.length) | 0], false);
  }
}
function turn(dirDelta) { if (G.mode === 'dungeon') { G.dir = (G.dir + dirDelta + 4) % 4; sfx.turn(); } }

/* ===== 상점 ===== */
let SHOP = null;
function shopItems() {
  const items = [];
  if (P.wpn < 4) items.push({ k: 'w', i: P.wpn + 1, cost: WEAPON_COST[P.wpn + 1] });
  if (P.arm < 4) items.push({ k: 'a', i: P.arm + 1, cost: ARMOR_COST[P.arm + 1] });
  items.push({ k: 'p', i: 0, cost: POTION_COST[0] });
  items.push({ k: 'p', i: 1, cost: POTION_COST[1] });
  items.push({ k: 'p', i: 2, cost: POTION_COST[2] });
  return items;
}
function openShop() { SHOP = { sel: 0 }; G.mode = 'shop'; sfx.chest(); }
function shopBuy() {
  const items = shopItems();
  if (SHOP.sel >= items.length) { closeShop(); return; }
  const it = items[SHOP.sel];
  if (P.gold < it.cost) { logMsg(L.shopNotEnough); sfx.deny(); return; }
  P.gold -= it.cost;
  if (it.k === 'w') { P.wpn = it.i; logMsg(fmt(L.shopBought, L.weapons[it.i])); }
  else if (it.k === 'a') { P.arm = it.i; logMsg(fmt(L.shopBought, L.armors[it.i])); }
  else { P.pots[it.i]++; logMsg(fmt(L.shopBought, L.potions[it.i])); }
  sfx.coin(); saveGame();
  SHOP.sel = Math.min(SHOP.sel, shopItems().length);
}
function closeShop() { SHOP = null; G.mode = 'dungeon'; saveGame(); }

/* ===== 엔딩 ===== */
function startEnding() {
  story('drgpost_dummy' in L.story ? 'drgpost_dummy' : 'ending', () => {
    G.mode = 'ending';
    bgmStart('ending');
    try { localStorage.setItem(SAVE_KEY + '_clear', '1'); } catch (e) {}
  });
}

/* ===== 게임 시작 플로우 ===== */
function newGame() {
  buildMaps();
  P = mkPlayer();
  FLAGS.boss = [false, false, false, false, false];
  FLAGS.opened = []; FLAGS.events = [];
  G.f = 1; G.x = 1; G.y = 1; G.steps = 0; G.msg = [];
  G.dir = openDir(1, 1);
  visited = new Set(['1,1']);
  G.mode = 'dungeon';
  audioInit(); bgmStart('dungeon');
  document.body.classList.add('playing');
  showScreen(null);
  story('intro', () => story('f1', () => { saveGame(); logMsg(L.saveMsg); }));
}
function contGame() {
  if (!loadGame()) { newGame(); return; }
  G.mode = 'dungeon'; G.msg = [];
  visited = new Set([G.x + ',' + G.y]);
  audioInit(); bgmStart('dungeon');
  document.body.classList.add('playing');
  showScreen(null);
  logMsg(fmt(L.stairsMsg, G.f, L.floors[G.f - 1]));
}

/* ============================================================
   오디오 (WebAudio 합성 — 고전 RPG풍)
   ============================================================ */
let AC = null, bgmGain = null, bgmTimer = null, bgmBeat = 0, bgmCur = '';
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  bgmGain = AC.createGain(); bgmGain.gain.value = 0; bgmGain.connect(AC.destination);
}
function tone(f0, dur, type, gain, f1, when) {
  if (!AC) return;
  const t0 = when || AC.currentTime;
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t0);
  if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  gn.gain.setValueAtTime(0, t0);
  gn.gain.linearRampToValueAtTime(gain || 0.12, t0 + 0.01);
  gn.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(gn); gn.connect(AC.destination);
  o.start(t0); o.stop(t0 + dur + 0.03);
}
function noiseS(dur, ff, gain, slide) {
  if (!AC) return;
  const t0 = AC.currentTime, len = Math.max(1, (AC.sampleRate * dur) | 0);
  const buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource(); src.buffer = buf;
  const flt = AC.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.setValueAtTime(ff, t0);
  if (slide) flt.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  const gn = AC.createGain();
  gn.gain.setValueAtTime(gain || 0.14, t0);
  gn.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(flt); flt.connect(gn); gn.connect(AC.destination);
  src.start(t0);
}
const sfx = {
  step() { noiseS(0.05, 300, 0.05, 140); },
  turn() { noiseS(0.04, 500, 0.03, 300); },
  bump() { tone(110, 0.08, 'sine', 0.1, 70); },
  atk() { noiseS(0.09, 1800, 0.12, 400); tone(300, 0.1, 'square', 0.06, 120); },
  crit() { noiseS(0.14, 2200, 0.16, 300); tone(520, 0.16, 'square', 0.09, 130); },
  magic() { if (!AC) return; [520, 660, 880, 1100].forEach((f, i) => tone(f, 0.14, 'sine', 0.08, f * 1.4, AC.currentTime + i * 0.05)); },
  heal() { if (!AC) return; [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.08, undefined, AC.currentTime + i * 0.07)); },
  hurt() { tone(200, 0.18, 'sawtooth', 0.12, 80); noiseS(0.12, 500, 0.1, 150); },
  chest() { if (!AC) return; [660, 880, 1320].forEach((f, i) => tone(f, 0.12, 'triangle', 0.1, undefined, AC.currentTime + i * 0.06)); },
  coin() { tone(1318, 0.07, 'triangle', 0.1); tone(1760, 0.12, 'triangle', 0.09, undefined, AC ? AC.currentTime + 0.05 : 0); },
  door() { noiseS(0.5, 180, 0.16, 60); tone(90, 0.5, 'sine', 0.1, 55); },
  stairs() { if (!AC) return; [392, 494, 587, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.09, undefined, AC.currentTime + i * 0.09)); },
  levelup() { if (!AC) return; [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, 0.14, 'triangle', 0.1, undefined, AC.currentTime + i * 0.06); tone(f * 2, 0.1, 'sine', 0.04, undefined, AC.currentTime + i * 0.06); }); },
  deny() { tone(180, 0.12, 'square', 0.07, 140); },
  run() { noiseS(0.25, 900, 0.1, 2400); },
  warn() { tone(110, 0.4, 'sawtooth', 0.12, 90); tone(220, 0.4, 'sawtooth', 0.06, 180); },
  win() { if (!AC) return; [523, 523, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, undefined, AC.currentTime + i * 0.11)); },
};
const NOTE = (st) => 220 * Math.pow(2, st / 12); // A3 기준
// 던전: 어둡고 신비한 분산화음 / 전투: 질주 / 보스: 반음 긴장 / 엔딩: 따뜻한 장조
const BGM_PAT = {
  dungeon: { tempo: 0.32, bass: [0, 0, -4, -4, -2, -2, -5, -5], arp: [[0, 3, 7, 12], [0, 3, 7, 12], [-4, 0, 3, 8], [-4, 0, 3, 8], [-2, 2, 5, 10], [-2, 2, 5, 10], [-5, -1, 2, 7], [-5, -1, 2, 7]], type: 'triangle', g: 0.05 },
  battle: { tempo: 0.15, bass: [0, 0, 0, 0, -2, -2, -4, -4], arp: [[0, 7, 12, 7], [0, 7, 12, 7], [0, 7, 12, 7], [0, 7, 12, 7], [-2, 5, 10, 5], [-2, 5, 10, 5], [-4, 3, 8, 3], [-4, 3, 8, 3]], type: 'square', g: 0.035 },
  boss: { tempo: 0.13, bass: [0, 0, 1, 1, 0, 0, -1, -1], arp: [[0, 6, 12, 6], [0, 6, 12, 6], [1, 7, 13, 7], [1, 7, 13, 7], [0, 6, 12, 6], [0, 6, 12, 6], [-1, 5, 11, 5], [-1, 5, 11, 5]], type: 'sawtooth', g: 0.028 },
  ending: { tempo: 0.36, bass: [3, 3, 0, 0, 5, 5, 3, 3], arp: [[3, 7, 10, 15], [3, 7, 10, 15], [0, 4, 7, 12], [0, 4, 7, 12], [5, 9, 12, 17], [5, 9, 12, 17], [3, 7, 10, 15], [3, 7, 10, 15]], type: 'triangle', g: 0.055 },
};
function bgmSchedule() {
  if (!AC || !bgmCur) return;
  const pat = BGM_PAT[bgmCur];
  const ahead = AC.currentTime + 0.5;
  while (bgmSchedule.next < ahead) {
    const t = bgmSchedule.next, bar = ((bgmBeat / 4) | 0) % 8, pos = bgmBeat % 4;
    if (pos === 0) {
      const o = AC.createOscillator(), gn = AC.createGain();
      o.type = 'sine'; o.frequency.value = NOTE(pat.bass[bar]) / 2;
      gn.gain.setValueAtTime(0.001, t);
      gn.gain.linearRampToValueAtTime(0.09, t + 0.02);
      gn.gain.exponentialRampToValueAtTime(0.001, t + pat.tempo * 3.6);
      o.connect(gn); gn.connect(bgmGain); o.start(t); o.stop(t + pat.tempo * 4);
    }
    const o2 = AC.createOscillator(), gn2 = AC.createGain();
    o2.type = pat.type; o2.frequency.value = NOTE(pat.arp[bar][pos] + 12);
    gn2.gain.setValueAtTime(0.001, t);
    gn2.gain.linearRampToValueAtTime(pat.g, t + 0.015);
    gn2.gain.exponentialRampToValueAtTime(0.001, t + pat.tempo * 0.95);
    o2.connect(gn2); gn2.connect(bgmGain);
    o2.start(t); o2.stop(t + pat.tempo);
    bgmSchedule.next += pat.tempo; bgmBeat++;
  }
}
function bgmStart(mode) {
  bgmCur = mode;
  if (!AC) return;
  if (!bgmTimer) { bgmSchedule.next = AC.currentTime + 0.05; bgmBeat = 0; bgmTimer = setInterval(bgmSchedule, 120); }
  bgmGain.gain.setTargetAtTime(0.9, AC.currentTime, 0.4);
}
function bgmStop() { bgmCur = ''; if (AC) bgmGain.gain.setTargetAtTime(0, AC.currentTime, 0.3); }

/* ============================================================
   렌더링 (960×540 내부 해상도 → 화면 맞춤)
   ============================================================ */
const cvs = document.getElementById('game');
const cx = cvs.getContext('2d');
const IW = 960, IH = 540;
let SW = 0, SH = 0, DPR = 1, scaleF = 1, offX = 0, offY = 0;
function layout() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  SW = window.innerWidth; SH = window.innerHeight;
  cvs.width = SW * DPR; cvs.height = SH * DPR;
  cvs.style.width = SW + 'px'; cvs.style.height = SH + 'px';
  scaleF = Math.min(SW / IW, SH / IH);
  offX = (SW - IW * scaleF) / 2; offY = (SH - IH * scaleF) / 2;
}
const VP = { x: 14, y: 14, w: 610, h: 424 }; // 3D 뷰포트
const PANEL = { x: 638, y: 14, w: 308, h: 424 };
const LOGBOX = { x: 14, y: 448, w: 932, h: 78 };

/* 3D 뷰 기하: 깊이별 반폭·반높이 비율 */
const DEPTH_S = [1.0, 0.60, 0.375, 0.235, 0.15];
function planeRect(d) {
  const hw = VP.w / 2 * DEPTH_S[d], hh = VP.h / 2 * DEPTH_S[d];
  return { cx: VP.x + VP.w / 2, cy: VP.y + VP.h / 2, hw, hh };
}
function texOrNull(n) { return ART[n] || null; }
function drawFrontWall(d, img, pal) {
  const p = planeRect(d);
  if (img) cx.drawImage(img, p.cx - p.hw, p.cy - p.hh, p.hw * 2, p.hh * 2);
  else { cx.fillStyle = pal.fog; cx.fillRect(p.cx - p.hw, p.cy - p.hh, p.hw * 2, p.hh * 2); }
  // 깊이 안개
  cx.fillStyle = hexA(pal.fog, Math.min(0.75, d * 0.22));
  cx.fillRect(p.cx - p.hw, p.cy - p.hh, p.hw * 2, p.hh * 2);
}
function drawSideWall(dNear, left, img, pal) {
  const n = planeRect(dNear), f = planeRect(dNear + 1);
  const xN = left ? n.cx - n.hw : n.cx + n.hw;
  const xF = left ? f.cx - f.hw : f.cx + f.hw;
  const steps = 13;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps, t1 = (i + 1) / steps;
    const x0 = xN + (xF - xN) * t0, x1 = xN + (xF - xN) * t1;
    const hh = n.hh + (f.hh - n.hh) * t0;
    if (img) {
      const sw = img.width / steps;
      cx.drawImage(img, (left ? t0 : 1 - t1) * img.width, 0, sw, img.height,
        Math.min(x0, x1), n.cy - hh, Math.abs(x1 - x0) + 0.7, hh * 2);
    } else {
      cx.fillStyle = pal.fog;
      cx.fillRect(Math.min(x0, x1), n.cy - hh, Math.abs(x1 - x0) + 0.7, hh * 2);
    }
    cx.fillStyle = hexA('#000000', 0.25 + (left ? 0 : 0.08) + t0 * 0.2 + dNear * 0.16);
    cx.fillRect(Math.min(x0, x1), n.cy - hh, Math.abs(x1 - x0) + 0.7, hh * 2);
  }
}
function drawGapFront(d, left, img, pal) { // 옆 통로 너머 보이는 벽면 조각
  const n = planeRect(d), f = planeRect(d + 1);
  const x0 = left ? n.cx - n.hw : f.cx + f.hw;
  const x1 = left ? f.cx - f.hw : n.cx + n.hw;
  if (img) cx.drawImage(img, left ? 0 : img.width * 0.6, 0, img.width * 0.4, img.height, x0, f.cy - f.hh, x1 - x0, f.hh * 2);
  else { cx.fillStyle = pal.fog; cx.fillRect(x0, f.cy - f.hh, x1 - x0, f.hh * 2); }
  cx.fillStyle = hexA(pal.fog, Math.min(0.8, (d + 1) * 0.22));
  cx.fillRect(x0, f.cy - f.hh, x1 - x0, f.hh * 2);
}
function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;
}
function fwdCell(d, side) { // side: -1 왼쪽 0 정면 1 오른쪽
  const rd = (G.dir + 1) % 4;
  return [G.x + DX[G.dir] * d + DX[rd] * (side || 0), G.y + DY[G.dir] * d + DY[rd] * (side || 0)];
}
function drawProp(c, d, nowS) {
  if (!'DKTHME>B'.includes(c) || c === 'D') return;
  const pN = planeRect(d), pF = planeRect(d + 1);
  const cy2 = pN.cy + (pN.hh + pF.hh) / 2 * 0.62;
  const s = DEPTH_S[d + 1] * 1.35;
  cx.save();
  cx.translate(pN.cx, cy2);
  cx.scale(s, s);
  if (c === 'K' || c === 'T') { // 보물상자 (K=금빛)
    const gold = c === 'K';
    cx.fillStyle = gold ? '#8a6a18' : '#5e4426';
    cx.fillRect(-46, -28, 92, 52);
    const lg = cx.createLinearGradient(0, -60, 0, -8);
    lg.addColorStop(0, gold ? '#e8c04a' : '#8a6a42'); lg.addColorStop(1, gold ? '#a8821e' : '#634a2c');
    cx.fillStyle = lg;
    cx.beginPath(); cx.moveTo(-50, -24); cx.quadraticCurveTo(0, -62, 50, -24); cx.lineTo(50, -8); cx.lineTo(-50, -8); cx.closePath(); cx.fill();
    cx.fillStyle = gold ? '#ffe9a0' : '#c8b078';
    cx.fillRect(-7, -20, 14, 22);
    if (gold) { const tw = (Math.sin(nowS * 5) + 1) / 2; cx.fillStyle = `rgba(255,240,170,${0.3 + tw * 0.5})`; cx.beginPath(); cx.arc(0, -34, 8 + tw * 4, 0, 6.283); cx.fill(); }
  } else if (c === 'H') { // 치유의 샘
    const tw = (Math.sin(nowS * 3) + 1) / 2;
    cx.fillStyle = '#3a566a';
    cx.beginPath(); cx.ellipse(0, 8, 62, 20, 0, 0, 6.283); cx.fill();
    const rg = cx.createRadialGradient(0, 4, 4, 0, 4, 56);
    rg.addColorStop(0, `rgba(150,230,255,${0.8 + tw * 0.2})`); rg.addColorStop(1, 'rgba(60,140,200,.25)');
    cx.fillStyle = rg;
    cx.beginPath(); cx.ellipse(0, 6, 54, 16, 0, 0, 6.283); cx.fill();
    cx.fillStyle = `rgba(210,245,255,${0.5 + tw * 0.4})`;
    cx.beginPath(); cx.arc(-14 + tw * 8, -18 - tw * 22, 4, 0, 6.283); cx.arc(16 - tw * 6, -10 - tw * 30, 3, 0, 6.283); cx.fill();
  } else if (c === 'M') { // 상인 좌판 (차양 + 등불 + 상품)
    const tw = (Math.sin(nowS * 4) + 1) / 2;
    // 기둥
    cx.fillStyle = '#3a2a18';
    cx.fillRect(-56, -66, 7, 76); cx.fillRect(49, -66, 7, 76);
    // 차양 (붉은 천)
    const cg2 = cx.createLinearGradient(0, -92, 0, -58);
    cg2.addColorStop(0, '#8a2a26'); cg2.addColorStop(1, '#5e1a18');
    cx.fillStyle = cg2;
    cx.beginPath();
    cx.moveTo(-64, -62); cx.quadraticCurveTo(0, -96, 64, -62);
    cx.lineTo(58, -50); cx.quadraticCurveTo(0, -80, -58, -50);
    cx.closePath(); cx.fill();
    cx.fillStyle = '#e8d8b8';
    for (let i = 0; i < 4; i++) { cx.beginPath(); cx.arc(-42 + i * 28, -54 + Math.abs(i - 1.5) * -4, 4, 0, Math.PI); cx.fill(); }
    // 좌판
    cx.fillStyle = '#5e4426';
    cx.fillRect(-52, -12, 104, 20);
    cx.fillStyle = '#3e2c16';
    cx.fillRect(-52, 4, 104, 6);
    // 상품 (물약·두루마리·항아리)
    cx.fillStyle = '#c04838'; cx.beginPath(); cx.arc(-30, -20, 8, 0, 6.283); cx.fill();
    cx.fillStyle = '#3a78c8'; cx.beginPath(); cx.arc(-12, -19, 7, 0, 6.283); cx.fill();
    cx.fillStyle = '#e8d8b8'; cx.fillRect(2, -25, 16, 13);
    cx.fillStyle = '#9a5a2a'; cx.beginPath(); cx.ellipse(34, -20, 10, 12, 0, 0, 6.283); cx.fill();
    // 등불
    cx.strokeStyle = '#3a2a1a'; cx.lineWidth = 3;
    cx.beginPath(); cx.moveTo(52, -66); cx.lineTo(52, -46); cx.stroke();
    const lg2 = cx.createRadialGradient(52, -36, 2, 52, -36, 22);
    lg2.addColorStop(0, `rgba(255,200,90,${0.55 + tw * 0.35})`); lg2.addColorStop(1, 'rgba(255,200,90,0)');
    cx.fillStyle = lg2;
    cx.beginPath(); cx.arc(52, -36, 22, 0, 6.283); cx.fill();
    cx.fillStyle = '#d84a3a';
    cx.beginPath(); cx.ellipse(52, -36, 7, 9, 0, 0, 6.283); cx.fill();
    cx.fillStyle = '#ffe9a0';
    cx.fillRect(50.5, -40, 3, 8);
  } else if (c === 'E') { // 이벤트 반짝임
    const tw = (Math.sin(nowS * 4) + 1) / 2;
    const rg = cx.createRadialGradient(0, -20, 2, 0, -20, 40);
    rg.addColorStop(0, `rgba(255,240,180,${0.5 + tw * 0.5})`); rg.addColorStop(1, 'rgba(255,240,180,0)');
    cx.fillStyle = rg;
    cx.beginPath(); cx.arc(0, -20, 40, 0, 6.283); cx.fill();
    cx.fillStyle = `rgba(255,255,230,${0.6 + tw * 0.4})`;
    for (let i = 0; i < 3; i++) {
      const a = nowS * 1.5 + i * 2.09;
      cx.beginPath(); cx.arc(Math.cos(a) * 22, -20 + Math.sin(a) * 14, 3, 0, 6.283); cx.fill();
    }
  } else if (c === '>') { // 계단
    cx.fillStyle = '#c8b894';
    for (let i = 0; i < 4; i++) cx.fillRect(-44 + i * 6, -6 - i * 16, 88 - i * 12, 14);
    cx.fillStyle = 'rgba(0,0,0,.35)';
    for (let i = 0; i < 4; i++) cx.fillRect(-44 + i * 6, 6 - i * 16, 88 - i * 12, 3);
  } else if (c === 'B') { // 보스 기운
    const tw = (Math.sin(nowS * 2.5) + 1) / 2;
    const rg = cx.createRadialGradient(0, -24, 4, 0, -24, 56);
    rg.addColorStop(0, `rgba(160,40,80,${0.4 + tw * 0.3})`); rg.addColorStop(1, 'rgba(160,40,80,0)');
    cx.fillStyle = rg;
    cx.beginPath(); cx.arc(0, -24, 56, 0, 6.283); cx.fill();
  }
  cx.restore();
}
function drawDoorFront(d, pal, nowS) { // 보스문 (정면 벽 위 장식)
  const p = planeRect(d);
  const w = p.hw * 1.1, h = p.hh * 1.7;
  cx.save();
  cx.translate(p.cx, p.cy + p.hh - h / 2 - p.hh * 0.06);
  const lg = cx.createLinearGradient(0, -h / 2, 0, h / 2);
  lg.addColorStop(0, '#2a2118'); lg.addColorStop(1, '#191209');
  cx.fillStyle = lg;
  cx.beginPath();
  cx.moveTo(-w / 2, h / 2); cx.lineTo(-w / 2, -h / 4);
  cx.quadraticCurveTo(0, -h / 2 - h * 0.12, w / 2, -h / 4);
  cx.lineTo(w / 2, h / 2); cx.closePath(); cx.fill();
  cx.strokeStyle = '#8a6a2a'; cx.lineWidth = Math.max(1.5, 5 * DEPTH_S[d]); cx.stroke();
  const tw = (Math.sin(nowS * 3) + 1) / 2;
  cx.fillStyle = `rgba(232,180,74,${0.7 + tw * 0.3})`;
  cx.beginPath(); cx.arc(0, 0, Math.max(3, 12 * DEPTH_S[d]), 0, 6.283); cx.fill();
  cx.fillStyle = '#191209';
  cx.fillRect(-Math.max(1.4, 4 * DEPTH_S[d]) / 2, 0, Math.max(1.4, 4 * DEPTH_S[d]), Math.max(4, 14 * DEPTH_S[d]));
  cx.restore();
}
function render3D(nowS) {
  const pal = FLOOR_PAL[G.f - 1];
  const img = texOrNull('wall' + G.f);
  cx.save();
  cx.beginPath(); cx.rect(VP.x, VP.y, VP.w, VP.h); cx.clip();
  // 천장·바닥
  const cg = cx.createLinearGradient(0, VP.y, 0, VP.y + VP.h / 2);
  cg.addColorStop(0, pal.ceil[0]); cg.addColorStop(1, pal.ceil[1]);
  cx.fillStyle = cg; cx.fillRect(VP.x, VP.y, VP.w, VP.h / 2);
  const fg = cx.createLinearGradient(0, VP.y + VP.h, 0, VP.y + VP.h / 2);
  fg.addColorStop(0, pal.floor[0]); fg.addColorStop(1, pal.floor[1]);
  cx.fillStyle = fg; cx.fillRect(VP.x, VP.y + VP.h / 2, VP.w, VP.h / 2);
  // 걷기 흔들림
  cx.translate((Math.random() - 0.5) * G.shake * 8, Math.sin(nowS * 1.6) * 2 + (Math.random() - 0.5) * G.shake * 8);
  // 벽 (먼 곳 → 가까운 곳)
  let maxD = 3;
  for (let d = 0; d <= 3; d++) { const [fx, fy] = fwdCell(d + 1, 0); if (cell(fx, fy) === '#' || cell(fx, fy) === 'D') { maxD = d; break; } }
  for (let d = Math.min(3, maxD); d >= 0; d--) {
    const [fx, fy] = fwdCell(d + 1, 0);
    const front = cell(fx, fy);
    if (d === maxD && (front === '#' || front === 'D')) {
      drawFrontWall(d + 1, img, pal);
      if (front === 'D') drawDoorFront(d + 1, pal, nowS);
    }
    // 좌우
    for (const side of [-1, 1]) {
      const [sx, sy] = fwdCell(d, side);
      const sc = cell(sx, sy);
      if (sc === '#' || sc === 'D') drawSideWall(d, side < 0, img, pal);
      else {
        const [gx, gy] = fwdCell(d + 1, side);
        if (cell(gx, gy) === '#' || cell(gx, gy) === 'D' || d >= maxD) drawGapFront(d, side < 0, img, pal);
      }
    }
    // 프롭 (해당 칸 위 오브젝트)
    const [px2, py2] = fwdCell(d + 1, 0);
    if (d < maxD || !'#D'.includes(front)) drawProp(cell(px2, py2), d, nowS);
    if (d === maxD && front === 'B') drawProp('B', d, nowS);
  }
  // 앰비언트 입자
  cx.fillStyle = hexA(pal.amb, 0.5);
  for (let i = 0; i < 8; i++) {
    const px3 = VP.x + ((i * 197 + nowS * (6 + i * 3)) % VP.w);
    const py3 = VP.y + ((i * 131 + Math.sin(nowS * 0.8 + i) * 30 + VP.h) % VP.h);
    const tw = (Math.sin(nowS * 2 + i * 1.7) + 1) / 2;
    cx.globalAlpha = 0.15 + tw * 0.35;
    cx.beginPath(); cx.arc(px3, py3, 1.5 + tw, 0, 6.283); cx.fill();
  }
  cx.globalAlpha = 1;
  // 피해 플래시
  if (G.dmgFx > 0) {
    cx.fillStyle = `rgba(200,30,30,${G.dmgFx * 0.5})`;
    cx.fillRect(VP.x, VP.y, VP.w, VP.h);
  }
  cx.restore();
  // 테두리
  ornateFrame(VP.x, VP.y, VP.w, VP.h);
}
function ornateFrame(x, y, w, h) {
  cx.strokeStyle = '#6a532a'; cx.lineWidth = 3;
  cx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
  cx.strokeStyle = '#2a2014'; cx.lineWidth = 1;
  cx.strokeRect(x - 4, y - 4, w + 8, h + 8);
  cx.fillStyle = '#8a6a2a';
  for (const [cx2, cy2] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    cx.beginPath(); cx.arc(cx2, cy2, 4, 0, 6.283); cx.fill();
  }
}
function bar(x, y, w, h, ratio, col, back) {
  cx.fillStyle = back || '#241c12';
  cx.beginPath(); cx.roundRect(x, y, w, h, h / 2); cx.fill();
  if (ratio > 0) {
    cx.fillStyle = col;
    cx.beginPath(); cx.roundRect(x, y, Math.max(h, w * Math.min(1, ratio)), h, h / 2); cx.fill();
  }
  cx.strokeStyle = 'rgba(0,0,0,.5)'; cx.lineWidth = 1; cx.stroke();
}
function drawPanel(nowS) {
  const p = PANEL;
  const bg = cx.createLinearGradient(0, p.y, 0, p.y + p.h);
  bg.addColorStop(0, '#241b10'); bg.addColorStop(1, '#171009');
  cx.fillStyle = bg;
  cx.fillRect(p.x, p.y, p.w, p.h);
  // 초상
  const port = texOrNull('port_uja');
  const ps = 92;
  if (port) {
    cx.save();
    cx.beginPath(); cx.roundRect(p.x + 12, p.y + 12, ps, ps, 8); cx.clip();
    cx.drawImage(port, p.x + 12, p.y + 12, ps, ps);
    cx.restore();
  } else { cx.fillStyle = '#3a2c1a'; cx.fillRect(p.x + 12, p.y + 12, ps, ps); }
  cx.strokeStyle = '#8a6a2a'; cx.lineWidth = 2;
  cx.strokeRect(p.x + 12, p.y + 12, ps, ps);
  cx.textAlign = 'left'; cx.textBaseline = 'top';
  cx.fillStyle = '#ffe9c0'; cx.font = '900 19px serif';
  cx.fillText(L.chars.uja, p.x + 116, p.y + 14);
  cx.fillStyle = '#c8b078'; cx.font = '800 13px sans-serif';
  cx.fillText(`${L.lv} ${P.lv}   ${L.floor}${G.f} · ${L.floors[G.f - 1]}`, p.x + 116, p.y + 40);
  // HP/MP
  cx.font = '800 12px sans-serif';
  cx.fillStyle = '#e8c8a0'; cx.fillText(`${L.hp} ${P.hp}/${P.maxHp}`, p.x + 116, p.y + 60);
  bar(p.x + 116, p.y + 76, 178, 9, P.hp / P.maxHp, P.hp < P.maxHp * 0.25 ? '#d84838' : '#4ab848');
  cx.fillText(`${L.mp} ${P.mp}/${P.maxMp}`, p.x + 116, p.y + 89);
  bar(p.x + 116, p.y + 105, 178, 9, P.mp / P.maxMp, '#3a8ae8');
  // 스탯
  cx.fillStyle = '#c8b078'; cx.font = '700 13px sans-serif';
  cx.fillText(`${L.atk} ${pAtk()}   ${L.def} ${pDef()}`, p.x + 14, p.y + 116);
  cx.fillText(`💰 ${P.gold}`, p.x + 14, p.y + 136);
  if (P.key) { cx.fillStyle = '#ffd34d'; cx.fillText(L.keyLbl, p.x + 120, p.y + 136); }
  // 경험치
  cx.fillStyle = '#8a7658'; cx.font = '700 11px sans-serif';
  cx.fillText(`EXP ${P.exp}/${expNext(P.lv)}`, p.x + 180, p.y + 116);
  bar(p.x + 14, p.y + 156, p.w - 28, 6, P.exp / expNext(P.lv), '#c8a030');
  // 미니맵
  const ms = 17, mx = p.x + (p.w - ms * MZ) / 2, my = p.y + 176;
  cx.fillStyle = '#0e0a06';
  cx.fillRect(mx - 4, my - 4, ms * MZ + 8, ms * MZ + 8);
  for (let y2 = 0; y2 < MZ; y2++) for (let x2 = 0; x2 < MZ; x2++) {
    const c = cell(x2, y2);
    const seen = visited.has(x2 + ',' + y2);
    const near = Math.abs(x2 - G.x) + Math.abs(y2 - G.y) <= 1;
    if (!seen && !near) continue;
    if (c === '#') cx.fillStyle = '#3a3226';
    else if (c === 'D') cx.fillStyle = '#8a6a2a';
    else if (c === 'B') cx.fillStyle = '#7a2438';
    else if (c === '>') cx.fillStyle = '#c8b894';
    else if (c === 'M') cx.fillStyle = '#7a4a9a';
    else if (c === 'H') cx.fillStyle = '#3a7a9a';
    else if (c === 'K' || c === 'T') cx.fillStyle = '#a8842a';
    else if (c === 'E') cx.fillStyle = '#c8b84a';
    else cx.fillStyle = seen ? '#1c1810' : '#14100a';
    cx.fillRect(mx + x2 * ms, my + y2 * ms, ms - 1, ms - 1);
  }
  // 플레이어 화살표
  cx.save();
  cx.translate(mx + G.x * ms + ms / 2, my + G.y * ms + ms / 2);
  cx.rotate(G.dir * Math.PI / 2);
  cx.fillStyle = '#ffe28a';
  cx.beginPath(); cx.moveTo(0, -6); cx.lineTo(5, 5); cx.lineTo(-5, 5); cx.closePath(); cx.fill();
  cx.restore();
  ornateFrame(p.x, p.y, p.w, p.h);
}
function drawLog() {
  const b = LOGBOX;
  cx.fillStyle = 'rgba(14,10,5,.92)';
  cx.fillRect(b.x, b.y, b.w, b.h);
  cx.textAlign = 'left'; cx.textBaseline = 'top';
  cx.font = '700 15px sans-serif';
  G.msg.slice(-3).forEach((m, i) => {
    cx.fillStyle = i === G.msg.length - 1 ? '#ffe9c0' : '#9a8668';
    cx.fillText(m, b.x + 14, b.y + 10 + i * 22);
  });
  ornateFrame(b.x, b.y, b.w, b.h);
}
/* ===== 전투 렌더 ===== */
const BT_CMDS = () => [L.cmdAtk, L.cmdSkill, L.cmdItem, L.cmdRun];
function drawBattle(nowS) {
  const bbg = texOrNull('bbg' + G.f);
  cx.save();
  cx.beginPath(); cx.rect(VP.x, VP.y, VP.w, VP.h); cx.clip();
  if (bbg) cx.drawImage(bbg, VP.x, VP.y, VP.w, VP.h);
  else { cx.fillStyle = FLOOR_PAL[G.f - 1].fog; cx.fillRect(VP.x, VP.y, VP.w, VP.h); }
  cx.fillStyle = 'rgba(0,0,0,.25)';
  cx.fillRect(VP.x, VP.y, VP.w, VP.h);
  // 몬스터
  const mi = texOrNull(BT.id);
  const mcx = VP.x + VP.w / 2 + (Math.random() - 0.5) * BT.shakeM * 22;
  const bob = Math.sin(nowS * 1.8) * 5;
  const mh = Math.min(VP.h * (BT.boss ? 0.74 : 0.58), 330);
  if (mi) {
    const mw = mh * mi.width / mi.height;
    cx.drawImage(mi, mcx - mw / 2, VP.y + VP.h - mh - 28 + bob, mw, mh);
    if (BT.flashM > 0) {
      cx.globalAlpha = BT.flashM * 2.4;
      cx.globalCompositeOperation = 'lighter';
      cx.drawImage(mi, mcx - mw / 2, VP.y + VP.h - mh - 28 + bob, mw, mh);
      cx.globalCompositeOperation = 'source-over';
      cx.globalAlpha = 1;
    }
  } else {
    cx.fillStyle = '#5a2438';
    cx.beginPath(); cx.ellipse(mcx, VP.y + VP.h - mh / 2 - 28 + bob, mh * 0.32, mh / 2, 0, 0, 6.283); cx.fill();
  }
  // 몬스터 이름 + HP
  cx.textAlign = 'center'; cx.textBaseline = 'top';
  cx.font = '900 18px serif';
  cx.fillStyle = '#fff';
  cx.strokeStyle = 'rgba(0,0,0,.7)'; cx.lineWidth = 4;
  const mname = (BT.boss ? '👑 ' : '') + L.mobs[BT.id];
  cx.strokeText(mname, VP.x + VP.w / 2, VP.y + 14);
  cx.fillText(mname, VP.x + VP.w / 2, VP.y + 14);
  bar(VP.x + VP.w / 2 - 130, VP.y + 40, 260, 12, BT.hp / BT.maxHp, BT.boss ? '#c84a8a' : '#d84838');
  // 플레이어 피해 플래시
  if (G.dmgFx > 0) { cx.fillStyle = `rgba(200,30,30,${G.dmgFx * 0.55})`; cx.fillRect(VP.x, VP.y, VP.w, VP.h); }
  // 결계 이펙트
  if (P.ward > 0) {
    const tw = (Math.sin(nowS * 4) + 1) / 2;
    cx.strokeStyle = `rgba(140,220,255,${0.3 + tw * 0.3})`; cx.lineWidth = 6;
    cx.strokeRect(VP.x + 4, VP.y + 4, VP.w - 8, VP.h - 8);
  }
  cx.restore();
  ornateFrame(VP.x, VP.y, VP.w, VP.h);
  // 명령창 (phase cmd일 때)
  if (BT.phase === 'cmd' || BT.phase === 'sub') {
    const menu = BT.sub === 0 ? P.skills.map((s, i) => s ? `${L.skills[i]} (${SKILLS[i].mp}MP)` : null).filter(Boolean)
      : BT.sub === 1 ? [0, 1, 2].map(i => `${L.potions[i]} ×${P.pots[i]}`)
      : BT_CMDS();
    const mw2 = 250, mh2 = menu.length * 30 + 20;
    const mx2 = VP.x + VP.w - mw2 - 14, my2 = VP.y + VP.h - mh2 - 14;
    cx.fillStyle = 'rgba(16,11,6,.93)';
    cx.beginPath(); cx.roundRect(mx2, my2, mw2, mh2, 8); cx.fill();
    cx.strokeStyle = '#8a6a2a'; cx.lineWidth = 2; cx.stroke();
    cx.textAlign = 'left'; cx.textBaseline = 'middle'; cx.font = '800 15px sans-serif';
    menu.forEach((m, i) => {
      const selIdx = BT.sub >= 0 ? BT.subSel : BT.sel;
      cx.fillStyle = i === selIdx ? '#ffe28a' : '#b09a76';
      cx.fillText((i === selIdx ? '▶ ' : '   ') + m, mx2 + 14, my2 + 24 + i * 30);
    });
    BT._menuRect = { x: mx2, y: my2, w: mw2, rows: menu.length };
  }
}
/* ===== 다이얼로그 렌더 ===== */
function drawDialog(nowS) {
  cx.fillStyle = 'rgba(6,4,2,.55)';
  cx.fillRect(0, 0, IW, IH);
  const [sp, txt] = DLG.lines[DLG.idx];
  const shown = txt.slice(0, Math.ceil(DLG.t * 40));
  // 초상
  if (sp !== 'nar' && PORTRAIT[sp]) {
    const img = texOrNull(PORTRAIT[sp]);
    const ps = 240, px2 = 60, py2 = IH - 150 - ps;
    if (img) {
      cx.save();
      cx.beginPath(); cx.roundRect(px2, py2, ps, ps, 12); cx.clip();
      cx.drawImage(img, px2, py2, ps, ps);
      cx.restore();
      cx.strokeStyle = '#8a6a2a'; cx.lineWidth = 3;
      cx.strokeRect(px2, py2, ps, ps);
    }
  }
  // 텍스트 박스
  const bx2 = 40, bw2 = IW - 80, bh2 = 128, by2 = IH - bh2 - 18;
  cx.fillStyle = 'rgba(14,10,5,.95)';
  cx.beginPath(); cx.roundRect(bx2, by2, bw2, bh2, 10); cx.fill();
  cx.strokeStyle = '#8a6a2a'; cx.lineWidth = 2.5; cx.stroke();
  cx.textAlign = 'left'; cx.textBaseline = 'top';
  if (sp !== 'nar') {
    cx.fillStyle = '#ffd34d'; cx.font = '900 16px serif';
    cx.fillText(L.chars[sp] || '', bx2 + 20, by2 - 0 + 12);
  }
  cx.fillStyle = sp === 'nar' ? '#d8c8a8' : '#f5ead8';
  cx.font = (sp === 'nar' ? 'italic ' : '') + '700 17px sans-serif';
  wrapText(shown, bx2 + 20, by2 + (sp === 'nar' ? 22 : 40), bw2 - 40, 24);
  // 진행 힌트
  cx.globalAlpha = 0.5 + ((Math.sin(nowS * 4) + 1) / 2) * 0.5;
  cx.fillStyle = '#ffe28a'; cx.font = '800 13px sans-serif';
  cx.textAlign = 'right';
  cx.fillText('▶ Space', bx2 + bw2 - 16, by2 + bh2 - 24);
  cx.globalAlpha = 1;
  cx.fillStyle = '#8a7658'; cx.textAlign = 'center'; cx.font = '700 12px sans-serif';
  cx.fillText(`${DLG.idx + 1} / ${DLG.lines.length}`, IW / 2, by2 - 20);
}
function wrapText(txt, x0, y0, maxW, lh) {
  let line = '', yy = y0;
  for (const ch of txt) {
    if (cx.measureText(line + ch).width > maxW) { cx.fillText(line, x0, yy); line = ch; yy += lh; }
    else line += ch;
  }
  if (line) cx.fillText(line, x0, yy);
}
/* ===== 상점 렌더 ===== */
function drawShop() {
  cx.fillStyle = 'rgba(6,4,2,.6)';
  cx.fillRect(0, 0, IW, IH);
  const img = texOrNull('port_merchant');
  const w = 620, h = 400, x = (IW - w) / 2, y = (IH - h) / 2;
  cx.fillStyle = 'rgba(20,14,7,.97)';
  cx.beginPath(); cx.roundRect(x, y, w, h, 12); cx.fill();
  cx.strokeStyle = '#8a6a2a'; cx.lineWidth = 3; cx.stroke();
  if (img) {
    cx.save(); cx.beginPath(); cx.roundRect(x + 20, y + 20, 110, 110, 10); cx.clip();
    cx.drawImage(img, x + 20, y + 20, 110, 110); cx.restore();
    cx.strokeStyle = '#8a6a2a'; cx.lineWidth = 2; cx.strokeRect(x + 20, y + 20, 110, 110);
  }
  cx.textAlign = 'left'; cx.textBaseline = 'top';
  cx.fillStyle = '#ffe9c0'; cx.font = '900 20px serif';
  cx.fillText(L.shopTitle, x + 146, y + 24);
  cx.fillStyle = '#c8b078'; cx.font = '700 14px sans-serif';
  cx.fillText(L.shopWelcome, x + 146, y + 54);
  cx.fillStyle = '#ffd34d';
  cx.fillText(`💰 ${P.gold}`, x + 146, y + 80);
  const items = shopItems();
  cx.font = '800 15px sans-serif';
  items.forEach((it, i) => {
    const name = it.k === 'w' ? L.weapons[it.i] + ` (${L.atk}+${WEAPONS[it.i]})` : it.k === 'a' ? L.armors[it.i] + ` (${L.def}+${ARMORS[it.i]})` : L.potions[it.i] + ' — ' + L.potionDesc[it.i];
    cx.fillStyle = i === SHOP.sel ? '#ffe28a' : '#b09a76';
    cx.fillText((i === SHOP.sel ? '▶ ' : '   ') + name, x + 30, y + 150 + i * 32);
    cx.textAlign = 'right';
    cx.fillText(it.cost + ' G', x + w - 30, y + 150 + i * 32);
    cx.textAlign = 'left';
  });
  cx.fillStyle = items.length === SHOP.sel ? '#ffe28a' : '#b09a76';
  cx.fillText((items.length === SHOP.sel ? '▶ ' : '   ') + L.shopLeave, x + 30, y + 150 + items.length * 32);
  SHOP._rect = { x: x + 20, y: y + 150, w: w - 40, rows: items.length + 1 };
}
/* ===== 엔딩 렌더 ===== */
function drawEnding(nowS) {
  const img = texOrNull('ending');
  if (img) {
    const s = Math.max(IW / img.width, (IH - 100) / img.height);
    cx.drawImage(img, (IW - img.width * s) / 2, 0, img.width * s, img.height * s);
  } else { cx.fillStyle = '#20304a'; cx.fillRect(0, 0, IW, IH); }
  cx.fillStyle = 'rgba(8,6,10,.55)';
  cx.fillRect(0, IH - 130, IW, 130);
  cx.textAlign = 'center';
  cx.fillStyle = '#ffe9c0'; cx.font = '900 30px serif'; cx.textBaseline = 'top';
  cx.fillText(L.endTitle, IW / 2, IH - 112);
  cx.fillStyle = '#c8b078'; cx.font = '700 16px sans-serif';
  cx.fillText(L.endSub, IW / 2, IH - 66);
  cx.globalAlpha = 0.6 + ((Math.sin(nowS * 3) + 1) / 2) * 0.4;
  cx.fillStyle = '#ffe28a'; cx.font = '800 13px sans-serif';
  cx.fillText('▶ Space', IW / 2, IH - 36);
  cx.globalAlpha = 1;
  // 별 반짝임
  for (let i = 0; i < 22; i++) {
    const sx = (i * 379) % IW, sy = (i * 173) % (IH * 0.5);
    cx.globalAlpha = 0.2 + ((Math.sin(nowS * 2.4 + i) + 1) / 2) * 0.6;
    cx.fillStyle = '#fff';
    cx.fillRect(sx, sy, 2, 2);
  }
  cx.globalAlpha = 1;
}
/* ===== 메인 렌더 ===== */
function render(nowS) {
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.fillStyle = '#080603'; cx.fillRect(0, 0, SW, SH);
  cx.translate(offX, offY); cx.scale(scaleF, scaleF);
  cx.fillStyle = '#0e0a06'; cx.fillRect(0, 0, IW, IH);
  if (G.mode === 'menu') return;
  if (G.mode === 'ending') { drawEnding(nowS); return; }
  if (G.mode === 'battle' && BT) drawBattle(nowS);
  else render3D(nowS);
  if (P) drawPanel(nowS);
  if (G.mode !== 'dialog') drawLog(); // 다이얼로그 박스와 프레임 겹침 방지
  if (G.mode === 'shop' && SHOP) drawShop();
  if (G.mode === 'dialog' && DLG) drawDialog(nowS);
}

/* ============================================================
   전투 페이즈 머신 (UI 타이밍)
   ============================================================ */
function battleConfirm() {
  if (!BT) return;
  if (BT.phase === 'cmd') {
    if (BT.sel === 0) startPhase(battlePlayerAct('atk'));
    else if (BT.sel === 1) {
      if (!P.skills.some(Boolean)) { sfx.deny(); return; }
      BT.sub = 0; BT.subSel = 0; BT.phase = 'sub';
    } else if (BT.sel === 2) { BT.sub = 1; BT.subSel = 0; BT.phase = 'sub'; }
    else startPhase(battlePlayerAct('run'));
  } else if (BT.phase === 'sub') {
    if (BT.sub === 0) {
      const idxs = P.skills.map((s, i) => s ? i : -1).filter(i => i >= 0);
      startPhase(battlePlayerAct('skill', idxs[BT.subSel]));
    } else startPhase(battlePlayerAct('item', BT.subSel));
  }
}
function startPhase(msgs) {
  if (!msgs.length) return;
  if (msgs.length === 1 && (msgs[0] === L.noMp || msgs[0] === L.noItem || msgs[0] === L.noRun)) {
    BT.log.push(msgs[0]);
    return; // 턴 소모 없음
  }
  BT.sub = -1;
  for (const m of msgs) BT.log.push(m);
  BT.phase = 'anim'; BT.timer = 0.85;
}
function battleTick(dt) {
  if (!BT) return;
  BT.shakeM = Math.max(0, BT.shakeM - dt);
  BT.flashM = Math.max(0, BT.flashM - dt);
  if (BT.phase !== 'anim') return;
  BT.timer -= dt;
  if (BT.timer > 0) return;
  if (BT.over === 1) { // 승리
    sfx.win();
    const rw = battleRewards();
    for (const m of rw) BT.log.push(m);
    BT.phase = 'anim'; BT.timer = 1.1; BT.over = 4;
    return;
  }
  if (BT.over === 4) { battleEnd(); return; }
  if (BT.over === 3) { BT = null; P.ward = 0; G.mode = 'dungeon'; bgmStart('dungeon'); return; }
  if (BT.over === 2) { playerDead(); return; }
  // 적 턴
  const em = battleEnemyAct();
  for (const m of em) BT.log.push(m);
  if (BT.over === 2) { BT.phase = 'anim'; BT.timer = 1.0; return; }
  BT.phase = 'cmd';
}

/* ============================================================
   입력
   ============================================================ */
window.addEventListener('keydown', (e) => {
  const k = e.key;
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(k)) e.preventDefault();
  if (G.mode === 'dialog') { if ([' ', 'Enter', 'ArrowRight'].includes(k)) dlgNext(); else if (k === 'Escape') { while (DLG) dlgNext0(); } return; }
  if (G.mode === 'ending') { if ([' ', 'Enter'].includes(k)) backToMenu(); return; }
  if (G.mode === 'dungeon') {
    if (k === 'ArrowUp' || k === 'w' || k === 'W') tryMove(true);
    else if (k === 'ArrowDown' || k === 's' || k === 'S') tryMove(false);
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') turn(-1);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') turn(1);
    else if (k === 'Escape') backToMenu(true);
    return;
  }
  if (G.mode === 'shop' && SHOP) {
    const n = shopItems().length + 1;
    if (k === 'ArrowUp' || k === 'w') { SHOP.sel = (SHOP.sel + n - 1) % n; sfx.turn(); }
    else if (k === 'ArrowDown' || k === 's') { SHOP.sel = (SHOP.sel + 1) % n; sfx.turn(); }
    else if (k === 'Enter' || k === ' ') shopBuy();
    else if (k === 'Escape') closeShop();
    return;
  }
  if (G.mode === 'battle' && BT) {
    if (BT.phase === 'cmd') {
      if (k === 'ArrowUp' || k === 'w') { BT.sel = (BT.sel + 3) % 4; sfx.turn(); }
      else if (k === 'ArrowDown' || k === 's') { BT.sel = (BT.sel + 1) % 4; sfx.turn(); }
      else if (k === 'Enter' || k === ' ') battleConfirm();
    } else if (BT.phase === 'sub') {
      const n = BT.sub === 0 ? P.skills.filter(Boolean).length : 3;
      if (k === 'ArrowUp' || k === 'w') { BT.subSel = (BT.subSel + n - 1) % n; sfx.turn(); }
      else if (k === 'ArrowDown' || k === 's') { BT.subSel = (BT.subSel + 1) % n; sfx.turn(); }
      else if (k === 'Enter' || k === ' ') battleConfirm();
      else if (k === 'Escape') { BT.sub = -1; BT.phase = 'cmd'; }
    }
  }
});
function dlgNext0() { if (DLG) { DLG.t = 999; dlgNext(); } }
function backToMenu(confirmAsk) {
  if (confirmAsk && !confirm(L.back + '?')) return;
  saveGame();
  G.mode = 'menu';
  bgmStop();
  document.body.classList.remove('playing');
  uiRefresh();
  showScreen('menu');
}
// 캔버스 클릭/터치
cvs.addEventListener('pointerdown', (e) => {
  audioInit();
  const rect = cvs.getBoundingClientRect();
  const ix = (e.clientX - rect.left - offX) / scaleF, iy = (e.clientY - rect.top - offY) / scaleF;
  if (G.mode === 'dialog') { dlgNext(); return; }
  if (G.mode === 'ending') { backToMenu(); return; }
  if (G.mode === 'shop' && SHOP && SHOP._rect) {
    const r = SHOP._rect;
    if (ix >= r.x && ix <= r.x + r.w && iy >= r.y - 6) {
      const row = Math.floor((iy - r.y + 6) / 32);
      if (row >= 0 && row < r.rows) {
        if (SHOP.sel === row) shopBuy(); else { SHOP.sel = row; sfx.turn(); }
      }
    } else closeShop();
    return;
  }
  if (G.mode === 'battle' && BT && (BT.phase === 'cmd' || BT.phase === 'sub') && BT._menuRect) {
    const r = BT._menuRect;
    if (ix >= r.x && ix <= r.x + r.w && iy >= r.y) {
      const row = Math.floor((iy - r.y - 10) / 30);
      if (row >= 0 && row < r.rows) {
        const cur = BT.phase === 'sub' ? BT.subSel : BT.sel;
        if (cur === row) battleConfirm();
        else { if (BT.phase === 'sub') BT.subSel = row; else BT.sel = row; sfx.turn(); }
      }
    } else if (BT.phase === 'sub') { BT.sub = -1; BT.phase = 'cmd'; }
    return;
  }
  if (G.mode === 'dungeon') {
    // 화면 분할 터치: 좌1/4 회전, 우1/4 회전, 중앙 상/하 전진·후퇴
    if (ix < VP.x + VP.w * 0.25) turn(-1);
    else if (ix < VP.x + VP.w * 0.75 && ix > VP.x) { (iy < VP.y + VP.h * 0.62) ? tryMove(true) : tryMove(false); }
    else if (ix <= VP.x + VP.w) turn(1);
  }
});
window.addEventListener('resize', layout);

/* ============================================================
   메뉴 UI (HTML)
   ============================================================ */
function $(id) { return document.getElementById(id); }
function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.style.display = 'none';
  if (id) $(id).style.display = 'flex';
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function uiRefresh() { $('contBtn').style.display = hasSave() ? '' : 'none'; }
function uiInit() {
  $('subT').textContent = L.sub;
  $('startBtn').textContent = L.start;
  $('contBtn').textContent = L.cont;
  $('helpBtn').textContent = L.help;
  $('helpBox').innerHTML = L.helpText;
  $('backBtn').textContent = L.back;
  $('credit').innerHTML = L.credit + '<a href="https://menewsoft.com" target="_blank" rel="noopener">menewsoft.com</a>';
  $('startBtn').onclick = () => { if (hasSave() && !confirm(L.confirmNew)) return; try { localStorage.removeItem(SAVE_KEY); } catch (e) {} newGame(); };
  $('contBtn').onclick = () => contGame();
  $('helpBtn').onclick = () => showScreen('helpScr');
  $('backBtn').onclick = () => showScreen('menu');
  uiRefresh();
  const t = texOrNull('title');
  document.addEventListener('pointerdown', audioInit, { once: true });
}

/* ============================================================
   테스트 (?test=sim)
   ============================================================ */
function runSim() {
  let pass = 0, fail = 0;
  const T = (name, ok, extra) => {
    if (ok) pass++; else fail++;
    console.warn(`[SIM] ${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  };
  // 미궁 5층 유효성: S(1,1)에서 모든 특수 칸 도달 가능, 보스문이 보스방 유일 통로
  buildMaps();
  for (let f = 1; f <= 5; f++) {
    const g = MAPS[f - 1];
    const has = {};
    for (let y = 0; y < MZ; y++) for (let x = 0; x < MZ; x++) { const c = g[y][x]; has[c] = (has[c] || 0) + 1; }
    // BFS (문은 통과 가능 취급 — 열쇠 사용 가정)
    const dist = Array.from({ length: MZ }, () => Array(MZ).fill(-1));
    const q = [[1, 1]]; dist[1][1] = 0;
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= MZ || ny >= MZ) continue;
        if (g[ny][nx] === '#' || dist[ny][nx] >= 0) continue;
        dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]);
      }
    }
    let reach = true, bossPos = null, doorPos = null, keyPos = null;
    for (let y = 0; y < MZ; y++) for (let x = 0; x < MZ; x++) {
      const c = g[y][x];
      if ('BDKTHME'.includes(c) && dist[y][x] < 0) reach = false;
      if (c === 'B') bossPos = [x, y];
      if (c === 'D') doorPos = [x, y];
      if (c === 'K') keyPos = [x, y];
    }
    // 열쇠는 문 없이 도달 가능해야 (문을 벽 취급한 BFS)
    const dist2 = Array.from({ length: MZ }, () => Array(MZ).fill(-1));
    const q2 = [[1, 1]]; dist2[1][1] = 0;
    while (q2.length) {
      const [x, y] = q2.shift();
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= MZ || ny >= MZ) continue;
        if (g[ny][nx] === '#' || g[ny][nx] === 'D' || dist2[ny][nx] >= 0) continue;
        dist2[ny][nx] = dist2[y][x] + 1; q2.push([nx, ny]);
      }
    }
    const keyOk = keyPos && dist2[keyPos[1]][keyPos[0]] >= 0;
    const bossLocked = bossPos && dist2[bossPos[1]][bossPos[0]] < 0; // 문 없이 보스방 도달 불가
    T(`floor ${f} maze valid`, reach && has.B === 1 && has.D === 1 && has.K === 1 && has.M >= 1 && has.E >= 1 && (has.T || 0) >= 1 && keyOk && bossLocked,
      `B=${has.B} D=${has.D} K=${has.K} M=${has.M} E=${has.E} T=${has.T} keyOk=${keyOk} locked=${bossLocked}`);
  }
  // 전투: 공격 데미지·처치·보상·레벨업
  P = mkPlayer();
  G.f = 1;
  RNG = mulberry32(42);
  battleStart('m_rat', false);
  T('battle starts', G.mode === 'battle' && BT && BT.hp === MOBS.m_rat.hp);
  let guard = 0, killed = false;
  while (guard++ < 50 && !killed) {
    const out = battlePlayerAct('atk');
    if (BT.over === 1) killed = true;
    else battleEnemyAct();
    if (BT.over === 2) break;
  }
  T('battle: attack kills mob', killed, `hp=${BT && BT.hp}`);
  const g0 = P.gold, e0 = P.exp;
  const rw = battleRewards();
  T('battle rewards exp+gold', P.gold > g0 && (P.exp > e0 || P.lv > 1), rw.join(' | '));
  battleEnd();
  T('battle end → dungeon', G.mode === 'dungeon' && BT === null);
  // 레벨업 수치
  P = mkPlayer();
  const hp0 = P.maxHp, atk0 = P.atkBase;
  P.exp = expNext(1);
  BT = { id: 'm_rat', boss: false, hp: 0, maxHp: 1 };
  battleRewards();
  T('level up stats', P.lv === 2 && P.maxHp === hp0 + 12 && P.atkBase === atk0 + 3 && P.hp === P.maxHp);
  BT = null;
  // 스킬: MP 소모·배율·회복·결계
  P = mkPlayer();
  P.skills = [true, true, false, true, false];
  P.mp = 30;
  battleStart('m_dok', false);
  RNG = mulberry32(7);
  const atkOut = battlePlayerAct('atk');
  const hpAfterAtk = BT.hp;
  BT.hp = BT.maxHp;
  RNG = mulberry32(7);
  battlePlayerAct('skill', 1); // 물결참 1.8x
  const dmgSkill = BT.maxHp - BT.hp, dmgAtk = MOBS.m_dok.hp - hpAfterAtk;
  T('skill deals more damage & costs MP', dmgSkill > dmgAtk && P.mp === 30 - 8, `atk=${dmgAtk} skill=${dmgSkill} mp=${P.mp}`);
  P.hp = 10;
  battlePlayerAct('skill', 0); // 치유
  T('heal skill restores HP', P.hp > 10 && P.mp === 30 - 8 - 6);
  battlePlayerAct('skill', 3); // 서리 결계
  T('ward skill sets buff', P.ward > 0);
  RNG = mulberry32(3);
  const hpB = P.hp;
  battleEnemyAct();
  const dmgWarded = hpB - P.hp;
  P.ward = 0;
  RNG = mulberry32(3);
  const hpB2 = P.hp;
  battleEnemyAct();
  T('ward reduces damage', dmgWarded < hpB2 - P.hp, `warded=${dmgWarded} normal=${hpB2 - P.hp}`);
  // 아이템
  P.pots = [1, 0, 0]; P.hp = 5;
  battlePlayerAct('item', 0);
  T('potion heals & consumes', P.hp === 55 && P.pots[0] === 0);
  // 도망 (보스 불가)
  BT.boss = true;
  const runOut = battlePlayerAct('run');
  T('cannot flee boss', runOut[0] === L.noRun && !BT.over);
  BT.boss = false;
  RNG = () => 0.1;
  battlePlayerAct('run');
  T('flee works', BT.over === 3);
  BT = null; RNG = Math.random;
  // 던전: 이동·벽·열쇠→문·보물
  buildMaps();
  P = mkPlayer();
  FLAGS.boss = [false, false, false, false, false]; FLAGS.opened = [];
  G.f = 1; G.x = 1; G.y = 1; G.dir = 1; G.mode = 'dungeon'; G.steps = 0;
  RNG = () => 0.99; // 인카운터 차단
  G.dir = [1, 2, 0, 3].find(d2 => cell(1 + DX[d2], 1 + DY[d2]) !== '#');
  const ox = G.x, oy = G.y;
  tryMove(true);
  T('dungeon move', G.x !== ox || G.y !== oy);
  if (G.mode === 'shop') closeShop(); // 상인 칸이었다면 상점 닫기
  T('merchant tile walkable', cell(G.x, G.y) !== '#');
  // 문: 열쇠 없이 → 잠김, 열쇠 → 개방
  let dPos = null;
  for (let y = 0; y < MZ; y++) for (let x = 0; x < MZ; x++) if (cell(x, y) === 'D') dPos = [x, y];
  G.x = dPos[0] - DX[1]; G.y = dPos[1] - DY[1]; G.dir = 1;
  if (cell(G.x, G.y) === '#') { // 문 접근 방향 조정
    for (let d2 = 0; d2 < 4; d2++) {
      const ax = dPos[0] - DX[d2], ay = dPos[1] - DY[d2];
      if (cell(ax, ay) !== '#') { G.x = ax; G.y = ay; G.dir = d2; break; }
    }
  }
  P.key = false;
  tryMove(true);
  T('door locked without key', cell(dPos[0], dPos[1]) === 'D');
  P.key = true;
  tryMove(true);
  T('key opens door', cell(dPos[0], dPos[1]) === '.' && P.key === false);
  // 보스 → 승리 → 계단 + 스킬
  let bPos = null;
  for (let y = 0; y < MZ; y++) for (let x = 0; x < MZ; x++) if (cell(x, y) === 'B') bPos = [x, y];
  G.x = dPos[0]; G.y = dPos[1];
  G.dir = [0, 1, 2, 3].find(d2 => dPos[0] + DX[d2] === bPos[0] && dPos[1] + DY[d2] === bPos[1]);
  tryMove(true); // 보스전 개시 (pre 다이얼로그)
  T('boss dialog then battle', G.mode === 'dialog');
  while (DLG) dlgNext0();
  T('boss battle started', G.mode === 'battle' && BT && BT.boss);
  BT.hp = 1; RNG = () => 0.5;
  battlePlayerAct('atk');
  T('boss defeated', BT.over === 1);
  battleRewards();
  battleEnd(); // post 다이얼로그
  while (DLG) dlgNext0();
  T('boss → spirit skill + stairs', P.skills[0] === true && cell(bPos[0], bPos[1]) === '>' && FLAGS.boss[0]);
  // 계단 → 2층
  G.x = dPos[0]; G.y = dPos[1];
  G.dir = [0, 1, 2, 3].find(d2 => dPos[0] + DX[d2] === bPos[0] && dPos[1] + DY[d2] === bPos[1]);
  tryMove(true);
  while (DLG) dlgNext0();
  T('stairs → floor 2', G.f === 2 && G.x === 1 && G.y === 1);
  // 상점: 구입·골드 차감
  P.gold = 500;
  openShop();
  T('shop opens', G.mode === 'shop');
  SHOP.sel = 0; // 무기
  shopBuy();
  T('shop buy weapon', P.wpn === 1 && P.gold === 500 - WEAPON_COST[1]);
  P.gold = 0; SHOP.sel = 0;
  const w1 = P.wpn;
  shopBuy();
  T('shop rejects when poor', P.wpn === w1);
  closeShop();
  // 저장/불러오기 라운드트립
  const bak = localStorage.getItem(SAVE_KEY);
  G.f = 2; G.x = 3; G.y = 1; P.gold = 777; P.skills[0] = true; FLAGS.boss[0] = true;
  saveGame();
  P = null; G.f = 1;
  T('save/load roundtrip', loadGame() && G.f === 2 && P.gold === 777 && P.skills[0] === true && FLAGS.boss[0] === true);
  T('load reopens boss stairs', MAPS[0].some(row => row.includes('>')) && !MAPS[0].some(row => row.includes('B')));
  if (bak === null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY, bak);
  // 5층 이벤트 → 별빛 스킬, 용 격파 → 엔딩
  buildMaps();
  P = mkPlayer();
  FLAGS.boss = [true, true, true, true, false]; FLAGS.opened = [];
  G.f = 5; G.mode = 'dungeon';
  let ePos = null;
  for (let y = 0; y < MZ; y++) for (let x = 0; x < MZ; x++) if (cell(x, y) === 'E') ePos = [x, y];
  // E 옆에서 진입
  for (let d2 = 0; d2 < 4; d2++) {
    const ax = ePos[0] - DX[d2], ay = ePos[1] - DY[d2];
    if (cell(ax, ay) !== '#') { G.x = ax; G.y = ay; G.dir = d2; break; }
  }
  RNG = () => 0.99;
  tryMove(true);
  while (DLG) dlgNext0();
  T('floor5 event grants starlight skill', P.skills[4] === true);
  battleStart('b_dragon', true);
  BT.hp = 1;
  battlePlayerAct('atk');
  battleRewards();
  battleEnd(); // → ending 스토리
  while (DLG) dlgNext0();
  T('dragon defeat → ending', G.mode === 'ending');
  // 사망 → 입구 부활 + 골드 절반
  P = mkPlayer(); P.gold = 100; G.f = 1; G.mode = 'dungeon';
  battleStart('m_rat', false);
  P.hp = 1;
  RNG = () => 0.5;
  BT.turn = 0;
  battleEnemyAct();
  T('enemy can defeat player', BT.over === 2);
  playerDead();
  T('death → respawn at entrance, half gold', G.mode === 'dungeon' && G.x === 1 && G.y === 1 && P.gold === 50 && P.hp > 0);
  RNG = Math.random;
  // 렌더 스모크
  try {
    layout();
    P = mkPlayer(); G.f = 1; G.x = 1; G.y = 1; G.dir = 1; G.mode = 'dungeon';
    render(1.2);
    battleStart('m_rat', false); render(1.3);
    BT = null; G.mode = 'dialog'; DLG = { lines: L.story.intro, idx: 0, t: 1, onEnd: () => {}, prevMode: 'dungeon' };
    render(1.4);
    DLG = null; G.mode = 'ending'; render(1.5);
    G.mode = 'menu';
    T('render ok', true);
  } catch (e) { T('render ok', false, e.message); }
  bgmStop();
  console.warn(`[SIM] DONE pass=${pass} fail=${fail}`);
}

/* ===== 스크린샷 모드 (?shot=) ===== */
function setupShot() {
  buildMaps();
  P = mkPlayer();
  const s = qs.get('shot');
  document.body.classList.add('playing');
  showScreen(null);
  G.mode = 'dungeon';
  const f = parseInt(s, 10);
  if (f >= 1 && f <= 5) {
    G.f = f; G.x = 1; G.y = 1;
    G.dir = cell(2, 1) !== '#' ? 1 : 2;
    P.skills = [f > 1, f > 2, f > 3, f > 4, false];
    P.lv = f * 4; P.key = f % 2 === 1;
  }
  if (s && s.startsWith('b')) { // 전투: b1~b5 (보스), m1~m5는 일반
    const f2 = +s.slice(1) || 1;
    G.f = f2;
    battleStart(FLOOR_BOSS[f2 - 1], true);
    BT.hp = BT.maxHp * 0.7;
    P.skills = [true, true, f2 > 2, f2 > 3, f2 > 4];
  }
  if (s && s.startsWith('m')) {
    const f2 = +s.slice(1) || 1;
    G.f = f2;
    battleStart(FLOOR_MOBS[f2 - 1][1], false);
  }
  if (s === 'shop') { G.f = 1; openShop(); }
  if (s === 'dlg') { G.f = 1; story('intro', () => {}); DLG.idx = 1; DLG.t = 999; }
  if (s === 'dlg5') { G.f = 5; story('sp5ev', () => {}); DLG.idx = 0; DLG.t = 999; }
  if (s === 'end') { G.mode = 'ending'; }
  logMsg(fmt(L.stairsMsg, G.f, L.floors[G.f - 1]));
  window._SHOT_READY = true;
}

/* ===== 부팅 ===== */
layout();
loadArt();
uiInit();
let lastT = 0;
function frame(tms) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (tms - lastT) / 1000 || 0.016);
  lastT = tms;
  G.msgT = Math.max(0, G.msgT - dt);
  G.shake = Math.max(0, G.shake - dt);
  G.dmgFx = Math.max(0, G.dmgFx - dt);
  if (DLG) DLG.t += dt;
  battleTick(dt);
  render(tms / 1000);
}
if (qs.get('test') === 'sim') { runSim(); }
else if (qs.has('shot')) { setupShot(); }
requestAnimationFrame((t) => { lastT = t; requestAnimationFrame(frame); });
