// 삼한통일전 — 규칙 엔진. 화면을 모르는 순수 상태 기계다.
// 1단계에서는 전투가 자동 판정이다(전술 SRPG 는 3단계).
//
// ★IIFE 로 감싸는 이유: 클래식 스크립트의 최상위 function 선언은 전역이 된다.
//   ui.js 에도 doAttack 이 있어 나중에 읽히는 쪽이 엔진 함수를 덮어썼고, AI 가 화면
//   함수를 호출하는 사고가 났다(2026-09-10 실측). 밖으로 내보내는 것은 SamhanEngine 뿐이다.
'use strict';
(function () {

const SIM = {
  START_YEAR: 246,
  MAX_MONTH: 300,          // 25년
  UNITS: {
    // cost·up 은 1,000명 기준(금). 대규모 거점 수입 ~1,450 에 맞춰 실측 조정했다.
    보병: { atk: 10, def: 12, mv: 5, rng: 1, cost: 300, up: 40, beats: '기병' },
    기병: { atk: 16, def: 8, mv: 8, rng: 1, cost: 600, up: 75, beats: '궁병' },
    궁병: { atk: 12, def: 6, mv: 5, rng: 2, cost: 450, up: 50, beats: '보병' },
  },
  COUNTER: 1.3,
  HARVEST_MONTH: 9,
  RECRUIT: { 모병: { train: 50, morale: 70, popMul: 1.0, secDrop: 2, priceMul: 1 },
             징병: { train: 10, morale: 30, popMul: 1.6, secDrop: 10, priceMul: 0.25 } },
};

// ──────────────────────────────────────────── 난수 (시드 고정 = 재현 가능)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ──────────────────────────────────────────── 초기 상태
function newGame(playerFaction, seed) {
  const rnd = mulberry32(seed >>> 0);
  const g = {
    seed: seed >>> 0, turn: 0, year: SIM.START_YEAR, month: 1,
    player: playerFaction, over: null, log: [], rndState: seed >>> 0,
    castles: {}, factions: {}, officers: {},
  };
  for (const c of CASTLES) {
    g.castles[c.n] = {
      n: c.n, fac: c.fac, pop: c.pop, ag: c.ag, cm: c.cm, sec: c.sec,
      gold: c.sz === '대' ? 1200 : c.sz === '중' ? 600 : 260,
      food: Math.round(c.pop * 0.25 * (c.ag / 50)),
      troops: { 보병: 0, 기병: 0, 궁병: 0 },
      train: 50, morale: 70, wall: c.wall, hosp: 0,
    };
    // 초기 주둔군: 규모의 35~50%
    const base = Math.round(c.garr * (0.35 + rnd() * 0.15));
    const cav = c.fac === '선비' || c.fac === '부여' || c.fac === '읍루' ? 0.45 : 0.22;
    g.castles[c.n].troops.기병 = Math.round(base * cav);
    g.castles[c.n].troops.궁병 = Math.round(base * 0.26);
    g.castles[c.n].troops.보병 = base - g.castles[c.n].troops.기병 - g.castles[c.n].troops.궁병;
  }
  for (const [id, f] of Object.entries(FACTIONS)) {
    g.factions[id] = {
      id, alive: true, cap: f.cap, aggr: f.aggr,
      // 외교 — 상대별 태도(0~100)와 관계 상태
      att: {},            // {상대: 호감도}
      rel: {},            // {상대: 'war' | 'peace' | 'ally' | 'truce'}
      truce: {},          // {상대: 남은 개월}
      tribute: {},        // {상대: 남은 개월}  조공을 바치는 중
    };
  }
  for (const o of OFFICERS) {
    g.officers[o.id] = {
      id: o.id, fac: o.fac, loc: o.loc, lv: o.lv, exp: 0,
      mu: o.mu, ji: o.ji, jg: o.jg, loy: o.loy, done: false, hurt: 0,
      // 부대 — 무장이 직접 거느리는 병력. 3단계 SRPG 에서 이 덩어리가 한 칸을 차지한다.
      corps: null,          // {unit, n} 또는 null
      found: o.fac !== null, // 재야는 탐색해야 드러난다
    };
  }
  // 초기 외교 — 국경을 맞댄 세력끼리는 서먹하다
  for (const f of Object.values(g.factions)) {
    for (const o of Object.keys(g.factions)) {
      if (o === f.id) continue;
      f.att[o] = 45 + Math.round(rnd() * 20);
      f.rel[o] = 'peace';
    }
  }
  // 246년의 실제 전선 — 시작부터 전쟁인 곳
  const WARS = [['고구려', '위'], ['마한', '위'], ['백제', '위'], ['야마토', '구노국']];
  for (const [a, d] of WARS) {
    if (!g.factions[a] || !g.factions[d]) continue;
    setRel(g, a, d, 'war');
    g.factions[a].att[d] = 10; g.factions[d].att[a] = 10;
  }
  g.rndState = (seed >>> 0) + 1;
  return g;
}

function rndOf(g) {
  g.rndState = (g.rndState + 0x6D2B79F5) | 0;
  let t = Math.imul(g.rndState ^ (g.rndState >>> 15), 1 | g.rndState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ──────────────────────────────────────────── 조회
const CASTLE_BY_N = Object.fromEntries(CASTLES.map(c => [c.n, c]));
const OFFICER_BY_ID = Object.fromEntries(OFFICERS.map(o => [o.id, o]));

function castleDef(n) { return CASTLE_BY_N[n]; }
function officerDef(id) { return OFFICER_BY_ID[id]; }
function factionCastles(g, fid) {
  return Object.values(g.castles).filter(c => c.fac === fid).map(c => c.n);
}
function officersAt(g, n) {
  return Object.values(g.officers).filter(o => o.loc === n);
}
function factionOfficers(g, fid) {
  return Object.values(g.officers).filter(o => o.fac === fid);
}
function troopTotal(c) { return c.troops.보병 + c.troops.기병 + c.troops.궁병; }

// 그 거점에 실제로 있는 병력 = 주둔군 + 그곳 무장들의 부대
function corpsAt(g, n, fid) {
  return Object.values(g.officers)
    .filter(o => o.loc === n && o.corps && o.corps.n > 0 && (fid == null || o.fac === fid));
}
function garrisonTotal(g, n) {
  const c = g.castles[n];
  return troopTotal(c) + corpsAt(g, n, c.fac).reduce((s, o) => s + o.corps.n, 0);
}
function wildAt(g, n) {
  return Object.values(g.officers).filter(o => o.loc === n && o.fac === null && o.found && !o.captive && !o.dead);
}

// ──────────────────────────────────────────── 산출 공식 (설계서와 1:1)
function income(c) {
  return Math.round(c.pop * 0.01 * (c.cm / 50) * (0.5 + c.sec / 200));
}
function harvest(c) {
  return Math.round(c.pop * 0.25 * (c.ag / 50));
}
function draftCap(c) {
  return Math.round(c.pop * 0.10 * (c.sec / 100));
}
function upkeep(c) {
  let s = 0;
  for (const [u, n] of Object.entries(c.troops)) s += (n / 1000) * SIM.UNITS[u].up;
  return Math.round(s);
}
function foodUse(c) { return Math.round(troopTotal(c) * 0.06); }

// 부대 실효 전투력
function power(c, unit, n, off) {
  const U = SIM.UNITS[unit];
  const mu = off ? off.mu : 50;
  return n * (U.atk / 10) * (0.4 + c.train / 167) * (0.6 + c.morale / 250) * (1 + mu / 200);
}
function castlePower(g, c) {
  const off = bestOfficer(g, c.n, 'mu');
  let p = 0;
  for (const [u, n] of Object.entries(c.troops)) p += power(c, u, n, off);
  // 그 거점에 있는 아군 부대도 함께 지킨다
  for (const o of corpsAt(g, c.n, c.fac)) p += power(c, o.corps.unit, o.corps.n, o);
  return p;
}
function bestOfficer(g, n, key) {
  const list = officersAt(g, n).filter(o => o.fac === g.castles[n].fac);
  if (!list.length) return null;
  return list.reduce((a, b) => (b[key] > a[key] ? b : a));
}

// ──────────────────────────────────────────── 명령
const ORDERS = {
  농업: { key: 'ag', cost: c => costOf(c), stat: 'jg' },
  상업: { key: 'cm', cost: c => costOf(c), stat: 'jg' },
  치안: { key: 'sec', cost: c => costOf(c), stat: 'jg' },
};
function costOf(c) {
  const sz = castleDef(c.n).sz;
  return sz === '대' ? 100 : sz === '중' ? 70 : 50;
}

function doDevelop(g, n, offId, kind) {
  const c = g.castles[n], o = g.officers[offId], O = ORDERS[kind];
  if (!O) return { ok: false, why: '없는 명령' };
  if (!o || o.loc !== n || o.fac !== c.fac) return { ok: false, why: '그 거점의 무장이 아닙니다' };
  if (o.done) return { ok: false, why: '이미 이번 달 명령을 받았습니다' };
  const cost = O.cost(c);
  if (c.gold < cost) return { ok: false, why: `자금이 모자랍니다 (${cost} 필요)` };
  const cap = castleDef(n).cap;
  if (c[O.key] >= cap) return { ok: false, why: `이미 상한 ${cap} 입니다` };
  c.gold -= cost;
  const gain = Math.max(1, Math.floor(o[O.stat] / 10 + 1 + rndOf(g) * 3));
  const before = c[O.key];
  c[O.key] = Math.min(cap, c[O.key] + gain);
  o.done = true;
  o.exp += 12;
  return { ok: true, gain: c[O.key] - before, kind };
}

function doRecruit(g, n, offId, unit, count, mode) {
  const c = g.castles[n], o = g.officers[offId];
  const R = SIM.RECRUIT[mode], U = SIM.UNITS[unit];
  if (!R || !U) return { ok: false, why: '없는 병종/방식' };
  if (!o || o.loc !== n || o.fac !== c.fac) return { ok: false, why: '그 거점의 무장이 아닙니다' };
  if (o.done) return { ok: false, why: '이미 이번 달 명령을 받았습니다' };
  count = Math.max(0, Math.floor(count));
  const cap = castleDef(n).garr - troopTotal(c);
  if (count > cap) return { ok: false, why: `주둔 상한을 넘습니다 (여유 ${cap})` };
  if (count > draftCap(c)) return { ok: false, why: `징집 가능 인원을 넘습니다 (${draftCap(c)})` };
  const gold = Math.round((count / 1000) * U.cost * R.priceMul);
  if (c.gold < gold) return { ok: false, why: `자금이 모자랍니다 (${gold} 필요)` };

  c.gold -= gold;
  c.pop = Math.max(1000, c.pop - Math.round(count * R.popMul));
  c.sec = Math.max(0, c.sec - R.secDrop);
  // 새 병력이 섞이며 훈련도·사기가 가중 평균으로 희석된다
  const had = troopTotal(c);
  c.train = Math.round((c.train * had + R.train * count) / (had + count || 1));
  c.morale = Math.round((c.morale * had + R.morale * count) / (had + count || 1));
  c.troops[unit] += count;
  o.done = true; o.exp += 10;
  return { ok: true, gold, count, mode, unit };
}

function doTrain(g, n, offId) {
  const c = g.castles[n], o = g.officers[offId];
  if (!o || o.loc !== n || o.fac !== c.fac) return { ok: false, why: '그 거점의 무장이 아닙니다' };
  if (o.done) return { ok: false, why: '이미 이번 달 명령을 받았습니다' };
  if (troopTotal(c) === 0) return { ok: false, why: '훈련할 병력이 없습니다' };
  const before = c.train;
  c.train = Math.min(100, c.train + Math.round(5 + o.mu / 8));
  c.morale = Math.min(100, c.morale + 2);
  o.done = true; o.exp += 14;
  return { ok: true, gain: c.train - before };
}

// ──────────────────────────────────────────── 2단계 내정 — 축성·수송·매매·위임 (2026-09-13 v2)
// 아군 영토로 이어진 거점. 코에이처럼 영토 안이면 어디든 한 달에 닿는다.
function reachable(g, from) {
  const fid = g.castles[from] && g.castles[from].fac;
  if (!fid) return [];
  const seen = new Set([from]), stack = [from];
  while (stack.length) {
    for (const n of castleDef(stack.pop()).adj) {
      if (!seen.has(n) && g.castles[n].fac === fid) { seen.add(n); stack.push(n); }
    }
  }
  seen.delete(from);
  return [...seen];
}

// 축성 — 함락되면 성벽이 4할로 주저앉는데 여태 올릴 방법이 없었다
function fortifyCost(c) { return Math.round(costOf(c) * 1.5); }
function fortifyRange(o) { const b = o.jg / 2 + o.mu / 4; return [Math.round(b * 20), Math.round((b + 10) * 20)]; }
function doFortify(g, n, offId) {
  const c = g.castles[n], o = g.officers[offId];
  if (!o || o.loc !== n || o.fac !== c.fac) return { ok: false, why: '그 거점의 무장이 아닙니다' };
  if (o.done) return { ok: false, why: '이미 이번 달 명령을 받았습니다' };
  const max = castleDef(n).wall;
  if (c.wall >= max) return { ok: false, why: `성벽이 이미 온전합니다 (${max})` };
  const cost = fortifyCost(c);
  if (c.gold < cost) return { ok: false, why: `자금이 모자랍니다 (${cost} 필요)` };
  c.gold -= cost;
  const before = c.wall;
  c.wall = Math.min(max, c.wall + Math.round((o.jg / 2 + o.mu / 4 + rndOf(g) * 10) * 20));
  o.done = true; o.exp += 12;
  return { ok: true, before, after: c.wall, gain: c.wall - before };
}

// 수송 — ★자금·군량은 거점마다 따로 쌓인다. 옮길 수 없으면 변방은 굶고 수도엔 돈이 썩는다.
const UNIT_KEYS = ['보병', '기병', '궁병'];
function doTransport(g, from, to, offId, load) {
  const a = g.castles[from], b = g.castles[to], o = g.officers[offId];
  if (!a || !b) return { ok: false, why: '없는 거점' };
  if (!o || o.loc !== from || o.fac !== a.fac) return { ok: false, why: '그 거점의 무장이 아닙니다' };
  if (o.done) return { ok: false, why: '이미 이번 달 명령을 받았습니다' };
  if (!reachable(g, from).includes(to)) return { ok: false, why: '아군 영토로 이어진 거점이 아닙니다' };
  const L = { gold: 0, food: 0, 보병: 0, 기병: 0, 궁병: 0 };
  for (const k of Object.keys(L)) L[k] = Math.max(0, Math.floor(+(load && load[k]) || 0));
  if (L.gold > a.gold) return { ok: false, why: `자금이 모자랍니다 (${a.gold})` };
  if (L.food > a.food) return { ok: false, why: `군량이 모자랍니다 (${a.food})` };
  for (const u of UNIT_KEYS) if (L[u] > a.troops[u]) return { ok: false, why: `${u}이 모자랍니다 (${a.troops[u]})` };
  const men = L.보병 + L.기병 + L.궁병;
  const room = castleDef(to).garr - troopTotal(b);
  if (men > room) return { ok: false, why: `받는 거점의 주둔 여유가 모자랍니다 (${Math.max(0, room)})` };
  if (men + L.gold + L.food <= 0) return { ok: false, why: '보낼 것이 없습니다' };
  a.gold -= L.gold; b.gold += L.gold;
  a.food -= L.food; b.food += L.food;
  if (men > 0) {
    // 병사가 섞이면 훈련도·사기가 가중 평균이 된다
    const had = troopTotal(b);
    b.train = Math.round((b.train * had + a.train * men) / (had + men));
    b.morale = Math.round((b.morale * had + a.morale * men) / (had + men));
    for (const u of UNIT_KEYS) { a.troops[u] -= L[u]; b.troops[u] += L[u]; }
  }
  o.done = true; o.exp += 8;
  return Object.assign({ ok: true, to, men }, L);
}

// 상인 — 추수 직후(9·10월)가 가장 싸고 보릿고개(여름)가 가장 비싸다. 무장이 필요 없다.
const SEASON = [0.9, 0.9, 1.1, 1.1, 1.1, 1.35, 1.35, 1.35, 0.7, 0.7, 0.9, 0.9];
function grainPrice(g, n) {
  const c = g.castles[n];
  return Math.max(4, Math.round(10 * SEASON[(g.month - 1) % 12] * (1.15 - c.cm / 400)));
}
function sellPrice(g, n) { return Math.max(2, Math.floor(grainPrice(g, n) * 0.7)); }
function tradeCap(c) { return Math.floor(c.cm * 3) * 100; }
function tradeLeft(c) { return Math.max(0, tradeCap(c) - (c.tv || 0)); }
function doTrade(g, n, mode, food) {
  const c = g.castles[n];
  if (!c) return { ok: false, why: '없는 거점' };
  if (c.cm < 30) return { ok: false, why: '저자가 작아 상인이 오지 않습니다 (상업 30 필요)' };
  food = Math.floor(Math.max(0, +food || 0) / 100) * 100;
  if (food <= 0) return { ok: false, why: '100석 단위로 거래합니다' };
  if (food > tradeLeft(c)) return { ok: false, why: `이번 달 거래 여유를 넘습니다 (${tradeLeft(c)}석)` };
  let gold;
  if (mode === 'buy') {
    gold = Math.ceil(food / 100 * grainPrice(g, n));
    if (c.gold < gold) return { ok: false, why: `자금이 모자랍니다 (${gold} 필요)` };
    c.gold -= gold; c.food += food;
  } else if (mode === 'sell') {
    if (food > c.food) return { ok: false, why: `군량이 모자랍니다 (${c.food})` };
    gold = Math.floor(food / 100 * sellPrice(g, n));
    c.food -= food; c.gold += gold;
  } else return { ok: false, why: '없는 거래' };
  c.tv = (c.tv || 0) + food;
  return { ok: true, mode, food, gold };
}

// 위임 — 거점 서른일곱을 한 달에 하나하나 명령할 수는 없다(코에이의 위임·군단).
const POLICIES = ['직할', '내정', '군비', '균형'];
function policyOf(c) { return c.gov || '직할'; }
function setPolicy(g, n, p) {
  const c = g.castles[n];
  if (!c || !POLICIES.includes(p)) return { ok: false, why: '없는 방침' };
  if (p === '직할') delete c.gov; else c.gov = p;
  return { ok: true, policy: p };
}
function govOrders(g, c, o, p) {
  const d = castleDef(c.n);
  const low = c.ag <= c.cm ? '농업' : '상업', high = low === '농업' ? '상업' : '농업';
  const devOk = k => c[ORDERS[k].key] < d.cap && c.gold >= costOf(c);
  const dev = k => devOk(k) && doDevelop(g, c.n, o.id, k).ok;
  const recruit = (share, capN) => {
    const room = d.garr - troopTotal(c);
    const mode = c.gold > 2500 ? '모병' : '징병';
    const per = SIM.UNITS.보병.cost * SIM.RECRUIT[mode].priceMul;
    const cnt = Math.floor(Math.min(draftCap(c), room, c.gold * share / per * 1000, capN) / 100) * 100;
    return cnt >= 200 && doRecruit(g, c.n, o.id, '보병', cnt, mode).ok;
  };
  const train = lim => c.train < lim && troopTotal(c) > 0 && doTrain(g, c.n, o.id).ok;
  const fort = (lim, mul) => c.wall < d.wall * lim && c.gold >= fortifyCost(c) * mul && doFortify(g, c.n, o.id).ok;
  const plan = p === '내정'
    ? [() => c.sec < 50 && dev('치안'), () => dev(low), () => dev(high), () => dev('치안')]
    : p === '군비'
      ? [() => troopTotal(c) < d.garr * 0.8 && c.gold > 500 && recruit(0.5, 3000), () => train(85),
         () => fort(0.9, 1), () => c.sec < 50 && dev('치안'), () => dev('상업')]
      : [() => c.sec < 45 && dev('치안'), () => troopTotal(c) < d.garr * 0.5 && c.gold > 700 && recruit(0.4, 2000),
         () => train(65), () => fort(0.6, 2), () => dev(low), () => dev('치안')];
  for (const step of plan) if (step()) return true;
  return false;
}
// ★출병·수송·외교는 맡기지 않는다 — 판을 흔드는 결정은 사람이 한다.
function runDelegated(g) {
  if (!g.player || !g.factions[g.player] || !g.factions[g.player].alive) return;
  for (const n of factionCastles(g, g.player)) {
    const c = g.castles[n], p = policyOf(c);
    if (p === '직할') continue;
    let k = 0;
    for (const o of officersAt(g, n)) {
      if (o.fac !== c.fac || o.done) continue;
      if (o.loy < 45 && c.gold > 600) doReward(g, n, o.id, 200);   // 흔들리는 무장부터 녹을 내린다
      if (govOrders(g, c, o, p)) k++;
    }
    if (k) g.log.push({ t: g.turn, k: 'gov', n, count: k });
  }
}

// ──────────────────────────────────────────── 화면을 위한 조회 — 예상치·대기·진언
function devRange(o) { return [Math.max(1, Math.floor(o.jg / 10 + 1)), Math.max(1, Math.floor(o.jg / 10 + 3.999))]; }
function trainGain(o) { return Math.round(5 + o.mu / 8); }
function searchChance(o) { return Math.min(0.85, 0.18 + o.jg / 180); }
function hireChance(g, offId, targetId) {
  const o = g.officers[offId], td = officerDef(targetId);
  const worth = (td.mu + td.ji + td.jg) / 3;
  return Math.max(0.05, Math.min(0.92, (o.jg + 30 - worth) / 100));
}
function idleAt(g, n) {
  const c = g.castles[n];
  return officersAt(g, n).filter(o => o.fac && o.fac === c.fac && !o.done);
}
function idleCastles(g, fid) {
  return factionCastles(g, fid).map(n => ({ n, k: idleAt(g, n).length })).filter(x => x.k > 0);
}
// 군사의 진언 — 급한 것부터, 같은 종류는 가장 급한 하나만.
//   ★거점 서른 곳이 전부 '병력이 얇다'고 아뢰면 아무 말도 안 한 것과 같다.
function advise(g, fid) {
  const out = [];
  const truce = o => (g.factions[fid].truce[o] || 0) > 0;
  for (const n of factionCastles(g, fid)) {
    const c = g.castles[n], d = castleDef(n);
    const use = foodUse(c);
    const toHarvest = ((SIM.HARVEST_MONTH - g.month + 12) % 12) + 1;
    if (use > 0 && c.food / use < Math.min(4, toHarvest)) {
      const v = Math.floor(c.food / use);
      out.push({ k: 'food', n, v, pri: 100, s: 10 - v });
    }
    const net = income(c) - upkeep(c);
    if (net < 0 && c.gold < -net * 6) out.push({ k: 'deficit', n, v: -net, pri: 90, s: -net });
    if (c.sec < 30) out.push({ k: 'sec', n, v: Math.round(c.sec), pri: 85, s: 30 - c.sec });
    const mineG = garrisonTotal(g, n);
    const corps = corpsAt(g, n, fid).reduce((s, o) => s + o.corps.n, 0);
    for (const to of d.adj) {
      const tc = g.castles[to];
      if (tc.fac === fid) continue;
      const rel = relOf(g, fid, tc.fac), theirs = garrisonTotal(g, to);
      if (rel === 'war' && theirs >= Math.max(2000, mineG * 1.5))
        out.push({ k: 'threat', n, to, v: +(theirs / Math.max(1, mineG)).toFixed(1), pri: 80, s: theirs / Math.max(1, mineG) });
      // ★부대만 셌더니 부대를 안 만든 사람에게는 24개월 동안 한 번도 '칠 만합니다'가 안 나왔다(09-13 자유 플레이).
      //   부대가 없으면 출진 창이 쓰는 주둔군 8할을 doAttack 과 같은 전력식으로 견준다.
      if (rel !== 'ally' && !truce(tc.fac)) {
        const his = castlePower(g, tc) * 1.28 + tc.wall * 0.15;
        const mineP = corps > 0
          ? corpsAt(g, n, fid).reduce((x, o) => x + power(c, o.corps.unit, o.corps.n, o), 0)
          : castlePower(g, c) * 0.8;
        const r = mineP / Math.max(1, his);
        if (r >= 1.3 && (corps > 0 ? corps : troopTotal(c) * 0.8) >= 1000)
          out.push({ k: 'target', n, to, v: +r.toFixed(1), pri: 40, s: r });
      }
    }
    const idle = idleAt(g, n).length;
    const wild = wildAt(g, n);
    if (wild.length && idle) out.push({ k: 'wild', n, off: wild[0].id, pri: 60, s: 1 });
    const hidden = officersAt(g, n).filter(o => o.fac === null && !o.found).length;
    if (hidden && idle) out.push({ k: 'hidden', n, v: hidden, pri: 35, s: hidden });
    if (mineG < d.garr * 0.4) out.push({ k: 'thin', n, v: Math.round(mineG / d.garr * 100), pri: 30, s: d.garr - mineG });
  }
  for (const o of factionOfficers(g, fid)) {
    const c = g.castles[o.loc];
    if (o.loy < 40 && c && c.fac === fid) out.push({ k: 'loy', n: o.loc, off: o.id, v: Math.round(o.loy), pri: 70, s: 40 - o.loy });
  }
  const cps = captivesOf(g, fid);
  if (cps.length) out.push({ k: 'captive', n: cps[0].loc, v: cps.length, pri: 65, s: cps.length });
  out.sort((a, b) => b.pri - a.pri || b.s - a.s);
  const seen = new Set();
  return out.filter(x => (seen.has(x.k) ? false : (seen.add(x.k), true)));
}

// ──────────────────────────────────────────── 3단계 — 포로·계략·사자 외교·방어전 (2026-09-13 v3)
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
// 군주 — 사료의 군주 이름과 같은 무장, 없으면 그 세력에서 가장 뛰어난 충성 100 무장
const LORD_ID = (() => {
  const out = {};
  for (const [fid, F] of Object.entries(FACTIONS)) {
    const mine = OFFICERS.filter(o => o.fac === fid);
    const l = mine.find(o => o.nm === F.lord) ||
      mine.slice().sort((x, y) => (y.loy - x.loy) || ((y.mu + y.ji + y.jg) - (x.mu + x.ji + x.jg)))[0];
    if (l) out[fid] = l.id;
  }
  return out;
})();
function isLord(g, id) { const o = g.officers[id]; return !!o && !!o.fac && lordIdOf(g, o.fac) === id; }
// 직위 — 정보 창·무장 목록에 보여 주기만 한다(규칙에는 쓰지 않는다, 09-14 "장수 직위").
//   군주 = LORD_ID · 군사 = 군주 다음으로 지력이 높은 사람 · 태수 = 군주가 머물지 않는 아군 거점마다 레벨이 가장 높은 사람
//   · 장군 = 부대를 거느린 사람 · 나머지는 무장
const RANK_ORDER = ['lord', 'sage', 'gov', 'general', 'officer'];
function ranksOf(g, fid) {
  const out = {};
  const mine = factionOfficers(g, fid);
  const sum = o => o.mu + o.ji + o.jg;
  const lord = mine.find(o => lordIdOf(g, fid) === o.id);
  if (lord) out[lord.id] = 'lord';
  const sage = mine.filter(o => !out[o.id]).sort((a, b) => b.ji - a.ji || b.lv - a.lv)[0];
  if (sage) out[sage.id] = 'sage';
  const gov = new Map();
  for (const o of mine) {
    if (out[o.id] || !g.castles[o.loc] || g.castles[o.loc].fac !== fid) continue;
    if (lord && lord.loc === o.loc) continue;              // 군주가 머무는 성은 군주가 직접 다스린다
    const cur = gov.get(o.loc);
    if (!cur || o.lv > cur.lv || (o.lv === cur.lv && sum(o) > sum(cur))) gov.set(o.loc, o);
  }
  for (const o of gov.values()) out[o.id] = 'gov';
  for (const o of mine) if (!out[o.id]) out[o.id] = o.corps && o.corps.n > 0 ? 'general' : 'officer';
  return out;
}

// 거점 그래프에서 가장 가까운 그 세력의 거점
function nearestOwned(g, fid, from) {
  const seen = new Set([from]), q = [from];
  while (q.length) {
    const n = q.shift();
    if (g.castles[n] && g.castles[n].fac === fid) return n;
    for (const x of castleDef(n).adj) if (!seen.has(x)) { seen.add(x); q.push(x); }
  }
  return null;
}
// 자금이 나갈 거점 — 수도를 빼앗겼으면 가장 넉넉한 거점
function purseOf(g, fid) {
  const cap = g.factions[fid] && g.factions[fid].cap;
  if (g.castles[cap] && g.castles[cap].fac === fid) return g.castles[cap];
  const mine = factionCastles(g, fid).map(n => g.castles[n]).sort((x, y) => y.gold - x.gold);
  return mine[0] || g.castles[cap];
}
function envoyBonus(o) { return o ? (o.jg * 0.6 + o.ji * 0.4 - 55) / 200 : 0; }
function envoyOf(g, a, opt) {
  const src = opt && opt.src != null && g.castles[opt.src] && g.castles[opt.src].fac === a ? g.castles[opt.src] : purseOf(g, a);
  if (!opt || !opt.envoy) return { src, o: null };
  const o = g.officers[opt.envoy];
  if (!o || o.fac !== a || o.loc !== src.n) return { why: '그 거점의 무장이 아닙니다' };
  if (o.done) return { why: '이미 이번 달 명령을 받았습니다' };
  return { src, o };
}
function spendEnvoy(o) { if (o) { o.done = true; o.exp += 10; } }

// 함락 — 성에 있던 무장은 사로잡히거나 이웃 거점으로 달아나고, 달아날 곳이 없으면 재야로 흩어진다
function settleFallen(g, n, oldFac, newFac, leadMu) {
  const flee = castleDef(n).adj.filter(x => g.castles[x].fac === oldFac);
  const caught = [], fled = [], scattered = [];
  for (const o of Object.values(g.officers)) {
    if (o.loc !== n || o.fac !== oldFac) continue;
    o.corps = null;
    let p = flee.length ? clamp(0.35 + ((leadMu || 60) - o.mu) / 200, 0.1, 0.7) : 0.85;
    if (lordIdOf(g, oldFac) === o.id && flee.length) p = Math.min(p, 0.3);   // 군주는 먼저 빼돌린다
    if (newFac && rndOf(g) < p) {
      o.captive = newFac; o.capFrom = oldFac; o.prevLoy = o.loy; o.capTurn = g.turn;
      o.fac = null; o.loy = 0; o.found = true;
      caught.push(o.id);
    } else if (flee.length) {
      o.loc = flee[Math.floor(rndOf(g) * flee.length)];
      o.loy = Math.max(0, o.loy - 4);
      fled.push(o.id);
    } else {
      o.fac = null; o.loy = 0; o.found = true;
      scattered.push(o.id);
    }
  }
  if (caught.length) g.log.push({ t: g.turn, k: 'captive', n, fac: newFac, from: oldFac, ids: caught });
  if (fled.length) g.log.push({ t: g.turn, k: 'fled', n, fac: oldFac, ids: fled });
  return { caught, fled, scattered };
}

function captivesOf(g, fid) { return Object.values(g.officers).filter(o => o.captive === fid && !o.dead); }
function hireCaptiveChance(g, id) {
  const o = g.officers[id];
  if (!o || !o.captive) return 0;
  const from = g.factions[o.capFrom], alive = !!(from && from.alive);
  if (alive && lordIdOf(g, o.capFrom) === id) return 0;                  // 살아 있는 나라의 군주는 굽히지 않는다
  const prev = o.prevLoy == null ? 80 : o.prevLoy;
  return clamp(0.12 + (100 - prev) / 120 + (alive ? 0 : 0.35) + Math.min(6, g.turn - (o.capTurn || g.turn)) * 0.04, 0.03, 0.9);
}
function releaseCaptive(g, o, why) {
  const from = o.capFrom, alive = g.factions[from] && g.factions[from].alive;
  const home = alive ? nearestOwned(g, from, o.loc) : null;
  const captor = o.captive;
  o.captive = null;
  if (home != null) { o.fac = from; o.loc = home; o.loy = Math.min(100, (o.prevLoy == null ? 70 : o.prevLoy) + 3); }
  else { o.fac = null; o.loy = 0; o.found = true; }
  g.log.push({ t: g.turn, k: 'freed', off: o.id, by: captor, fac: from, home, why });
  delete o.capFrom; delete o.prevLoy; delete o.capTurn; delete o.capTry;
  return home;
}
function doCaptive(g, fid, id, act) {
  const o = g.officers[id];
  if (!o || o.captive !== fid || o.dead) return { ok: false, why: '우리가 잡은 포로가 아닙니다' };
  if (act === 'hire') {
    if (o.capTry === g.turn) return { ok: false, why: '이번 달엔 이미 설득했습니다' };
    o.capTry = g.turn;
    const p = hireCaptiveChance(g, id);
    if (p > 0 && rndOf(g) < p) {
      const from = o.capFrom;
      o.captive = null; o.fac = fid; o.loy = 50 + Math.round(rndOf(g) * 15); o.done = true;
      delete o.capFrom; delete o.prevLoy; delete o.capTurn; delete o.capTry;
      g.log.push({ t: g.turn, k: 'turned', off: id, fac: fid, from });
      return { ok: true, joined: true, chance: p };
    }
    return { ok: true, joined: false, chance: p };
  }
  if (act === 'free') {
    const from = o.capFrom;
    const home = releaseCaptive(g, o, 'free');
    if (home != null) addAtt(g, from, fid, 10);
    return { ok: true, home };
  }
  if (act === 'kill') {
    const from = o.capFrom, alive = g.factions[from] && g.factions[from].alive;
    o.captive = null; o.dead = true; o.fac = null; o.loc = -1; o.corps = null;
    if (alive) addAtt(g, from, fid, -25);
    for (const f of Object.keys(g.factions)) if (f !== fid && f !== from) addAtt(g, f, fid, -4);
    for (const x of factionOfficers(g, fid)) x.loy = Math.max(0, x.loy - 1.5);   // 보는 눈이 있다
    g.log.push({ t: g.turn, k: 'executed', off: id, by: fid, fac: from });
    return { ok: true };
  }
  return { ok: false, why: '없는 처분' };
}
// 월말 — 성을 빼앗기면 포로는 풀려나고, 가끔은 스스로 달아난다
function processCaptives(g) {
  for (const o of Object.values(g.officers)) {
    if (!o.captive || o.dead) continue;
    const c = g.castles[o.loc];
    if (!c || c.fac !== o.captive) releaseCaptive(g, o, 'lost');
    else if (rndOf(g) < 0.05) releaseCaptive(g, o, 'escape');
  }
}

// 계략 — 인접한 남의 거점(동맹 제외)에 지력으로 건다
const PLOTS = {
  유언비어: { cost: 100, officer: false },
  선동: { cost: 200, officer: false },
  이간: { cost: 100, officer: true },
  유혹: { cost: 300, officer: true },
};
function plotTargets(g, n) {
  const fid = g.castles[n].fac;
  return castleDef(n).adj.filter(x => g.castles[x].fac !== fid && relOf(g, fid, g.castles[x].fac) !== 'ally');
}
function defWit(g, n) { const o = bestOfficer(g, n, 'ji'); return o ? o.ji : 30; }
function plotChance(g, kind, offId, to, targetId) {
  const o = g.officers[offId], tc = g.castles[to], t = targetId ? g.officers[targetId] : null;
  if (!o || !tc) return 0;
  if (kind === '유언비어') return clamp(0.3 + (o.ji - defWit(g, to)) / 90, 0.05, 0.9);
  if (kind === '선동') return clamp(0.15 + (o.ji - defWit(g, to)) / 110 + (50 - tc.sec) / 150, 0.03, 0.8);
  if (!t) return 0;
  if (kind === '이간') return isLord(g, t.id) ? 0 : clamp(0.3 + (o.ji - t.ji) / 90, 0.05, 0.9);
  if (kind === '유혹') return isLord(g, t.id) ? 0 : clamp((85 - t.loy) / 45 + (o.jg - t.ji) / 250, 0.02, 0.8);
  return 0;
}
function doPlot(g, n, offId, kind, to, targetId) {
  const c = g.castles[n], o = g.officers[offId], P = PLOTS[kind];
  if (!P) return { ok: false, why: '없는 계략' };
  if (!o || o.loc !== n || o.fac !== c.fac) return { ok: false, why: '그 거점의 무장이 아닙니다' };
  if (o.done) return { ok: false, why: '이미 이번 달 명령을 받았습니다' };
  if (!plotTargets(g, n).includes(to)) return { ok: false, why: '이 거점과 맞닿은 남의 거점이 아닙니다' };
  const tc = g.castles[to], tf = tc.fac;
  let t = null;
  if (P.officer) {
    t = g.officers[targetId];
    if (!t || t.loc !== to || t.fac !== tf) return { ok: false, why: '그 거점의 무장이 아닙니다' };
    if (isLord(g, t.id)) return { ok: false, why: '군주에게는 통하지 않습니다' };
  }
  if (c.gold < P.cost) return { ok: false, why: `자금이 모자랍니다 (${P.cost} 필요)` };
  const p = plotChance(g, kind, offId, to, targetId);
  c.gold -= P.cost;
  o.done = true; o.exp += 14;
  const hit = rndOf(g) < p;
  const eff = {};
  if (hit) {
    if (kind === '유언비어') {
      eff.sec = Math.min(tc.sec, Math.round(6 + o.ji / 10 + rndOf(g) * 4));
      tc.sec -= eff.sec; tc.morale = Math.max(5, tc.morale - 4);
    } else if (kind === '선동') {
      eff.sec = Math.min(tc.sec, Math.round(12 + o.ji / 8));
      tc.sec -= eff.sec;
      eff.desert = 0;
      for (const u of UNIT_KEYS) { const k = Math.round(tc.troops[u] * 0.06); tc.troops[u] -= k; eff.desert += k; }
      tc.pop = Math.round(tc.pop * 0.98);
      if (tc.sec < 20) g.log.push({ t: g.turn, k: 'revolt', n: to });
    } else if (kind === '이간') {
      eff.loy = Math.min(t.loy, Math.round(6 + o.ji / 8));
      t.loy -= eff.loy;
    } else if (kind === '유혹') {
      if (t.corps && t.corps.n > 0) {
        const room = Math.max(0, castleDef(to).garr - troopTotal(tc));
        tc.troops[t.corps.unit] += Math.min(t.corps.n, room);
      }
      t.corps = null; t.fac = c.fac; t.loc = n; t.loy = 45 + Math.round(rndOf(g) * 15); t.done = true;
      eff.joined = true;
    }
  } else {
    addAtt(g, tf, c.fac, rndOf(g) < 0.5 ? -8 : -3);          // 들키면 원한을 산다
  }
  g.log.push({ t: g.turn, k: 'plot', kind, by: c.fac, from: n, n: to, tf, ok: hit, eff, off: offId, target: targetId || null });
  return { ok: true, hit, chance: p, eff };
}

// 공동작전 — 동맹에게 그 거점을 쳐 달라고 청한다. 받아들이면 이번 달에 곧장 친다.
function jointSources(g, ally, to) {
  return castleDef(to).adj.filter(x => g.castles[x].fac === ally)
    .sort((x, y) => garrisonTotal(g, y) - garrisonTotal(g, x));
}
function jointTargets(g, a, ally) {
  return CASTLES.map(c => c.n).filter(n => {
    const f = g.castles[n].fac;
    return f !== a && f !== ally && atWar(g, a, f) && relOf(g, ally, f) !== 'ally' &&
      !((g.factions[ally].truce[f] || 0) > 0) && jointSources(g, ally, n).length;
  });
}
function jointChance(g, a, ally, envoy) { return clamp((attOf(g, ally, a) - 40) / 60 + envoyBonus(envoy), 0.05, 0.9); }
const JOINT_COST = 300;
function doJoint(g, a, ally, to, opt) {
  if (relOf(g, a, ally) !== 'ally') return { ok: false, why: '동맹이 아닙니다' };
  if (!jointTargets(g, a, ally).includes(to)) return { ok: false, why: '동맹이 칠 수 있는 교전 상대의 거점이 아닙니다' };
  const ev = envoyOf(g, a, opt);
  if (ev.why) return { ok: false, why: ev.why };
  if (ev.src.gold < JOINT_COST) return { ok: false, why: `자금이 모자랍니다 (${JOINT_COST} 필요)` };
  const p = jointChance(g, a, ally, ev.o);
  ev.src.gold -= JOINT_COST;
  spendEnvoy(ev.o);
  if (rndOf(g) >= p) { addAtt(g, ally, a, -2); return { ok: true, accepted: false, chance: p }; }
  const from = jointSources(g, ally, to)[0];
  const battle = doAttack(g, from, to, 0.7);
  addAtt(g, ally, a, -4);
  g.log.push({ t: g.turn, k: 'joint', a, ally, from, to, win: battle.win, captured: battle.captured });
  return { ok: true, accepted: true, chance: p, from, battle };
}

// 항복 권고 — 거점도 병력도 세 배는 되어야 귀를 기울인다
function powerOf(g, fid) { return factionCastles(g, fid).reduce((x, n) => x + garrisonTotal(g, n), 0); }
function demandRatio(g, a, b) {
  const hc = factionCastles(g, b).length;
  return Math.min(factionCastles(g, a).length / Math.max(1, hc), powerOf(g, a) / Math.max(1, powerOf(g, b)));
}
function demandChance(g, a, b, envoy) {
  const r = demandRatio(g, a, b);
  if (r < 3) return 0;
  return clamp((r - 3) / 8 + 0.08 + envoyBonus(envoy) + (attOf(g, b, a) - 50) / 400 +
    (factionCastles(g, b).length <= 1 ? 0.1 : 0), 0.03, 0.6);
}
const DEMAND_COST = 500;
function doDemand(g, a, b, opt) {
  if (!g.factions[b] || !g.factions[b].alive || a === b) return { ok: false, why: '없는 세력' };
  if (relOf(g, a, b) === 'ally') return { ok: false, why: '동맹에게는 권하지 않습니다' };
  if (demandRatio(g, a, b) < 3) return { ok: false, why: '세력 차이가 세 배는 되어야 귀를 기울입니다' };
  const ev = envoyOf(g, a, opt);
  if (ev.why) return { ok: false, why: ev.why };
  if (ev.src.gold < DEMAND_COST) return { ok: false, why: `자금이 모자랍니다 (${DEMAND_COST} 필요)` };
  const p = demandChance(g, a, b, ev.o);
  ev.src.gold -= DEMAND_COST;
  spendEnvoy(ev.o);
  if (rndOf(g) >= p) { addAtt(g, b, a, -10); return { ok: true, accepted: false, chance: p }; }
  const castles = factionCastles(g, b);
  for (const n of castles) g.castles[n].fac = a;
  for (const o of Object.values(g.officers)) {
    if (o.fac === b) { o.fac = a; o.loy = lordIdOf(g, b) === o.id ? 65 : 55; o.done = true; }
    if (o.captive === b) o.captive = a;
  }
  g.factions[b].alive = false;
  for (const f of Object.values(g.factions)) { f.rel[b] = 'peace'; delete f.truce[b]; }
  g.log.push({ t: g.turn, k: 'surrender', a, b, castles: castles.length });
  return { ok: true, accepted: true, chance: p, castles: castles.length };
}

// 방어전 — AI 가 사람 거점을 칠 때 쌓아 둔 침공
function incomingValid(g, x) {
  const a = g.castles[x.from], d = g.castles[x.to];
  if (!a || !d || a.fac !== x.af || d.fac !== g.player) return false;
  if (relOf(g, x.af, g.player) === 'ally' || (g.factions[x.af].truce[g.player] || 0) > 0) return false;
  return Math.round(troopTotal(a) * x.ratio) > 0;
}
function incomingForce(g, x) { return Math.round(troopTotal(g.castles[x.from]) * x.ratio); }
function defendAuto(g, x) {
  if (!incomingValid(g, x)) return { ok: false, why: '침공이 무산되었습니다' };
  return doAttack(g, x.from, x.to, x.ratio);
}
function resolveIncoming(g) {
  const list = g.incoming || [];
  g.incoming = [];
  for (const x of list) defendAuto(g, x);
}

// ──────────────────────────────────────────── 외교
function setRel(g, a, b, r) {
  if (!g.factions[a] || !g.factions[b]) return;
  g.factions[a].rel[b] = r;
  g.factions[b].rel[a] = r;
}
function relOf(g, a, b) {
  return (g.factions[a] && g.factions[a].rel[b]) || 'peace';
}
function atWar(g, a, b) { return relOf(g, a, b) === 'war'; }
function attOf(g, a, b) {
  const f = g.factions[a];
  return f && f.att[b] != null ? f.att[b] : 50;
}
function addAtt(g, a, b, d) {
  const f = g.factions[a];
  if (!f) return;
  f.att[b] = Math.max(0, Math.min(100, (f.att[b] == null ? 50 : f.att[b]) + d));
}
// 국경을 맞댄 세력만 서로를 신경 쓴다
function neighbors(g, fid) {
  const out = new Set();
  for (const n of factionCastles(g, fid)) {
    for (const t of castleDef(n).adj) {
      const o = g.castles[t].fac;
      if (o && o !== fid) out.add(o);
    }
  }
  return [...out];
}

function doDeclareWar(g, a, b) {
  if (a === b || !g.factions[b] || !g.factions[b].alive) return { ok: false, why: '없는 세력' };
  if (atWar(g, a, b)) return { ok: false, why: '이미 전쟁 중입니다' };
  if ((g.factions[a].truce[b] || 0) > 0)
    return { ok: false, why: `화친 기간이 ${g.factions[a].truce[b]}개월 남았습니다` };
  setRel(g, a, b, 'war');
  addAtt(g, b, a, -35);
  // 지켜보는 이웃들도 마음을 접는다
  for (const o of neighbors(g, a)) if (o !== b) addAtt(g, o, a, -6);
  g.log.push({ t: g.turn, k: 'war', a, b });
  return { ok: true };
}

// 강화 — 자금을 얹어 청한다. 상대가 이기고 있으면 잘 받지 않는다.
function peaceChance(g, a, b, gold, envoy) {
  const mine = factionCastles(g, a).length, his = factionCastles(g, b).length;
  const edge = his / Math.max(1, mine);          // 상대가 우세하면 콧대가 높다
  return clamp((attOf(g, b, a) / 100) * 0.6 + (gold || 0) / 4000 + (1 - Math.min(2, edge)) * 0.25 + envoyBonus(envoy), 0.05, 0.95);
}
function doPeace(g, a, b, gold, opt) {
  if (!atWar(g, a, b)) return { ok: false, why: '전쟁 중이 아닙니다' };
  const ev = envoyOf(g, a, opt);
  if (ev.why) return { ok: false, why: ev.why };
  const cap = ev.src;
  gold = Math.max(0, Math.floor(gold || 0));
  if (cap.gold < gold) return { ok: false, why: `자금이 모자랍니다 (${gold} 필요)` };
  const p = peaceChance(g, a, b, gold, ev.o);
  cap.gold -= gold;
  spendEnvoy(ev.o);
  if (rndOf(g) < p) {
    setRel(g, a, b, 'peace');
    g.factions[a].truce[b] = 12; g.factions[b].truce[a] = 12;   // 1년간 재선전포고 금지
    addAtt(g, b, a, 12 + Math.round(gold / 200));
    g.log.push({ t: g.turn, k: 'peace', a, b, gold });
    return { ok: true, accepted: true };
  }
  addAtt(g, b, a, 3);
  return { ok: true, accepted: false, chance: p };
}

// 동맹 — 호감이 높아야 받는다
function allyChance(g, a, b, envoy) {
  return clamp((attOf(g, b, a) - 55) / 45 + envoyBonus(envoy), 0.02, 0.9);
}
function doAlly(g, a, b, opt) {
  if (atWar(g, a, b)) return { ok: false, why: '전쟁 중에는 맺지 못합니다' };
  if (relOf(g, a, b) === 'ally') return { ok: false, why: '이미 동맹입니다' };
  const ev = envoyOf(g, a, opt);
  if (ev.why) return { ok: false, why: ev.why };
  const p = allyChance(g, a, b, ev.o);
  spendEnvoy(ev.o);
  if (rndOf(g) < p) {
    setRel(g, a, b, 'ally');
    addAtt(g, b, a, 10);
    g.log.push({ t: g.turn, k: 'ally', a, b });
    return { ok: true, accepted: true };
  }
  return { ok: true, accepted: false, chance: p };
}
function doBreakAlly(g, a, b) {
  if (relOf(g, a, b) !== 'ally') return { ok: false, why: '동맹이 아닙니다' };
  setRel(g, a, b, 'peace');
  addAtt(g, b, a, -30);
  for (const o of Object.keys(g.factions)) if (o !== a) addAtt(g, o, a, -8);  // 소문은 퍼진다
  g.log.push({ t: g.turn, k: 'unally', a, b });
  return { ok: true };
}

// 예물 — 호감을 산다
function giftGain(gold, envoy) { return Math.round(gold / 120 * (envoy ? 0.75 + envoy.jg / 200 : 1)); }
function doGift(g, a, b, gold, opt) {
  const ev = envoyOf(g, a, opt);
  if (ev.why) return { ok: false, why: ev.why };
  const cap = ev.src;
  gold = Math.max(100, Math.floor(gold));
  if (cap.gold < gold) return { ok: false, why: `자금이 모자랍니다 (${gold} 필요)` };
  cap.gold -= gold;
  spendEnvoy(ev.o);
  const gain = giftGain(gold, ev.o);
  addAtt(g, b, a, gain);
  return { ok: true, gain };
}

// 부대 편성 — 거점 주둔군에서 무장에게 병력을 떼어 준다
function doAssign(g, n, offId, unit, count) {
  const c = g.castles[n], o = g.officers[offId];
  if (!o || o.loc !== n || o.fac !== c.fac) return { ok: false, why: '그 거점의 무장이 아닙니다' };
  if (!SIM.UNITS[unit]) return { ok: false, why: '없는 병종' };
  count = Math.max(0, Math.floor(count));
  const cap = troopCap(o);
  const already = o.corps && o.corps.unit === unit ? o.corps.n : 0;
  if (o.corps && o.corps.unit !== unit && o.corps.n > 0)
    return { ok: false, why: `이미 ${o.corps.unit} 부대를 거느립니다. 먼저 해산하십시오` };
  if (already + count > cap)
    return { ok: false, why: `통솔 상한을 넘습니다 (Lv${o.lv} → ${cap}명, 현재 ${already})` };
  if (count > c.troops[unit]) return { ok: false, why: `주둔 ${unit}이 모자랍니다 (${c.troops[unit]})` };
  c.troops[unit] -= count;
  o.corps = { unit, n: already + count };
  return { ok: true, unit, count, total: o.corps.n };
}

function doDisband(g, offId) {
  const o = g.officers[offId];
  if (!o || !o.corps || o.corps.n <= 0) return { ok: false, why: '거느린 부대가 없습니다' };
  const c = g.castles[o.loc];
  if (!c || c.fac !== o.fac) return { ok: false, why: '아군 거점이 아닙니다' };
  const room = castleDef(o.loc).garr - troopTotal(c);
  const back = Math.min(o.corps.n, Math.max(0, room));
  c.troops[o.corps.unit] += back;
  const lost = o.corps.n - back;
  o.corps = null;
  return { ok: true, back, lost };
}

// 하사 — 자금을 내려 충성을 얻는다
function doReward(g, n, offId, gold) {
  const c = g.castles[n], o = g.officers[offId];
  if (!o || o.loc !== n || o.fac !== c.fac) return { ok: false, why: '그 거점의 무장이 아닙니다' };
  // ★충성이 이미 꼭대기면 자금만 없앤다 — 받아 주지 않는 편이 정직하다
  if (o.loy >= 99) return { ok: false, why: '이미 충성이 지극합니다' };
  gold = Math.max(50, Math.floor(gold));
  if (c.gold < gold) return { ok: false, why: `자금이 모자랍니다 (${gold} 필요)` };
  c.gold -= gold;
  const before = o.loy;
  // 이미 충성스러운 이에게는 덜 오른다
  o.loy = Math.min(100, o.loy + (gold / 60) * (1 - o.loy / 130));
  return { ok: true, gain: Math.round(o.loy - before), gold };
}

// 탐색 — 숨은 재야를 찾는다
function doSearch(g, n, offId) {
  const c = g.castles[n], o = g.officers[offId];
  if (!o || o.loc !== n || o.fac !== c.fac) return { ok: false, why: '그 거점의 무장이 아닙니다' };
  if (o.done) return { ok: false, why: '이미 이번 달 명령을 받았습니다' };
  o.done = true; o.exp += 10;
  const hidden = Object.values(g.officers).filter(x => x.loc === n && x.fac === null && !x.found);
  if (!hidden.length) return { ok: true, found: null, why: '더 찾을 사람이 없습니다' };
  // 정치가 높을수록 사람을 잘 찾는다
  if (rndOf(g) < searchChance(o)) {
    const t = hidden[Math.floor(rndOf(g) * hidden.length)];
    t.found = true;
    return { ok: true, found: officerDef(t.id).nm, id: t.id };
  }
  return { ok: true, found: null };
}

// 재야 등용
function doRecruitOfficer(g, n, offId, targetId) {
  const c = g.castles[n], o = g.officers[offId], t = g.officers[targetId];
  if (!o || o.loc !== n || o.fac !== c.fac) return { ok: false, why: '그 거점의 무장이 아닙니다' };
  if (o.done) return { ok: false, why: '이미 이번 달 명령을 받았습니다' };
  if (!t || t.loc !== n || t.fac !== null || t.captive || t.dead) return { ok: false, why: '이 거점의 재야 인물이 아닙니다' };
  if (!t.found) return { ok: false, why: '아직 찾지 못한 사람입니다' };
  o.done = true; o.exp += 8;
  const td = officerDef(targetId);
  // 재야일수록 눈이 높다 — 능력 합이 높으면 어렵다
  const chance = hireChance(g, offId, targetId);
  if (rndOf(g) < chance) {
    t.fac = c.fac; t.loy = 55 + Math.round(rndOf(g) * 20);
    return { ok: true, joined: true, name: td.nm };
  }
  return { ok: true, joined: false, name: td.nm, chance };
}

// 이동
function doMove(g, offId, to) {
  const o = g.officers[offId];
  if (!o) return { ok: false, why: '없는 무장' };
  if (o.done) return { ok: false, why: '이미 이번 달 명령을 받았습니다' };
  if (!g.castles[to] || g.castles[to].fac !== o.fac) return { ok: false, why: '아군 거점이 아닙니다' };
  if (!reachable(g, o.loc).includes(to)) return { ok: false, why: '아군 영토로 이어진 거점이 아닙니다' };
  o.loc = to; o.done = true;
  return { ok: true, to };
}

// 출병 — 무장의 부대로 나간다. 2단계에서 부대 단위가 됐고, 3단계에서 SRPG 로 교체된다.
//   offIds 를 주면 그 무장들의 부대만 나가고, 비우면 주둔군에서 send 비율만큼 임시 편성한다.
function doAttack(g, from, to, send, offIds) {
  const a = g.castles[from], d = g.castles[to];
  if (a.fac === d.fac) return { ok: false, why: '아군 거점입니다' };
  if (!castleDef(from).adj.includes(to)) return { ok: false, why: '인접한 거점이 아닙니다' };
  if (relOf(g, a.fac, d.fac) === 'ally') return { ok: false, why: '동맹입니다. 먼저 파기하십시오' };
  if ((g.factions[a.fac].truce[d.fac] || 0) > 0)
    return { ok: false, why: `화친 중입니다 (${g.factions[a.fac].truce[d.fac]}개월 남음)` };
  if (!atWar(g, a.fac, d.fac)) doDeclareWar(g, a.fac, d.fac);
  const defFac = d.fac;

  // 출전 부대를 모은다
  const force = [];      // {off, unit, n}  off 는 null 이면 주둔군 분견대
  if (offIds && offIds.length) {
    for (const id of offIds) {
      const o = g.officers[id];
      if (!o || o.loc !== from || o.fac !== a.fac) return { ok: false, why: '그 거점의 무장이 아닙니다' };
      if (!o.corps || o.corps.n <= 0) return { ok: false, why: `${officerDef(id).nm}은(는) 부대가 없습니다` };
      force.push({ off: o, unit: o.corps.unit, n: o.corps.n });
    }
  } else {
    const ratio = Math.max(0.1, Math.min(1, send == null ? 0.8 : send));
    const lead = bestOfficer(g, from, 'mu');
    for (const u of Object.keys(a.troops)) {
      const n = Math.round(a.troops[u] * ratio);
      if (n > 0) force.push({ off: lead, unit: u, n, fromGarrison: true });
    }
  }
  const sentTotal = force.reduce((x, f) => x + f.n, 0);
  if (sentTotal <= 0) return { ok: false, why: '내보낼 병력이 없습니다' };

  const lead = force.reduce((x, f) => (f.off && (!x || f.off.mu > x.mu) ? f.off : x), null);
  let ap = force.reduce((x, f) => x + power(a, f.unit, f.n, f.off), 0);
  const dp = castlePower(g, d) * 1.28 + d.wall * 0.15;

  ap *= 0.85 + rndOf(g) * 0.3;
  const win = ap > dp;
  const lossA = win ? Math.min(0.55, dp / (ap + 1) * 0.5) : 0.62;
  const lossD = win ? 0.7 : Math.min(0.5, ap / (dp + 1) * 0.45);

  // 공격측 손실 — 부대별로
  let deadA = 0;
  for (const f of force) {
    const cas = Math.round(f.n * lossA);
    deadA += cas;
    f.alive = f.n - cas;
    if (f.fromGarrison) a.troops[f.unit] -= cas;
    else f.off.corps.n = f.alive;
  }
  // 수비측 손실 — 주둔군과 부대에 고르게
  let deadD = 0;
  for (const u of Object.keys(d.troops)) {
    const cas = Math.round(d.troops[u] * lossD);
    d.troops[u] -= cas; deadD += cas;
  }
  for (const o of corpsAt(g, to, d.fac)) {
    const cas = Math.round(o.corps.n * lossD);
    o.corps.n -= cas; deadD += cas;
    if (o.corps.n <= 0) o.corps = null;
  }
  a.hosp += Math.round(deadA * 0.45);
  d.hosp += Math.round(deadD * 0.45);

  let captured = false;
  if (win) {
    d.wall = Math.max(0, d.wall - Math.round(sentTotal * 0.12 + 400));
    if (garrisonTotal(g, to) <= 0 || d.wall <= 0) {
      captured = true;
      const old = d.fac;
      d.fac = a.fac;
      d.sec = Math.max(10, d.sec - 25);
      d.gold = Math.round(d.gold * 0.7);
      for (const u of Object.keys(d.troops)) d.troops[u] = 0;
      // 부대를 거느린 무장은 부대째 성으로 들어간다
      let room = castleDef(to).garr;
      for (const f of force) {
        if (f.fromGarrison) {
          const moveIn = Math.max(0, Math.min(f.alive, room));
          d.troops[f.unit] += moveIn; a.troops[f.unit] -= moveIn; room -= moveIn;
        } else {
          f.off.loc = to; room -= f.off.corps ? f.off.corps.n : 0;
        }
      }
      d.train = a.train; d.morale = Math.min(100, a.morale + 8);
      d.wall = Math.round(castleDef(to).wall * 0.4);
      // 함락된 쪽 무장은 사로잡히거나 이웃 거점으로 달아난다. 부대는 사라진다.
      settleFallen(g, to, old, a.fac, lead ? lead.mu : 60);
      checkDead(g, old);
    }
  } else {
    a.morale = Math.max(10, a.morale - 12);
  }
  // 무장 경험과 충성
  for (const f of force) {
    if (!f.off) continue;
    f.off.exp += win ? 60 : 25;
    f.off.loy = Math.max(0, Math.min(100, f.off.loy + (win ? 2 : -3)));
  }
  g.log.push({ t: g.turn, k: 'battle', from, to, win, captured, deadA, deadD, af: a.fac, df: defFac,
               lead: lead ? lead.id : null });
  return { ok: true, win, captured, deadA, deadD, lead: lead ? lead.id : null };
}

function checkDead(g, fid) {
  if (!g.factions[fid]) return;
  if (factionCastles(g, fid).length === 0) {
    g.factions[fid].alive = false;
    g.log.push({ t: g.turn, k: 'fall', fac: fid });
  }
}

// ──────────────────────────────────────────── 사건
// kind 'hist' = 사서에 적힌 일(src 필수, 정해진 해·달에 온다) · 'fic' = 가상 이야기(창작, 조건이 맞으면 확률로 온다)
// run(g, ctx) 는 [한국어 결과, 영어 결과] 를 돌려준다. 칸 만화 대본은 story.js 에 있다.
// 한 번 일어난 사건은 다시 오지 않는다(g.done). 무천만 해마다 온다.
function lordIdOf(g, fid) { return (g.lords && g.lords[fid]) || LORD_ID[fid]; }
function aliveOff(g, id, fac) {
  const o = g.officers[id];
  return !!o && !o.dead && !o.captive && (fac === undefined || o.fac === fac);
}
// 사건으로 죽는다 — 군주였다면 뒤를 이을 사람을 정해 저장(g.lords)에 남긴다
function killOff(g, id, heir) {
  const o = g.officers[id];
  if (!o || o.dead) return;
  const fac = o.fac, wasLord = !!fac && lordIdOf(g, fac) === id;
  o.dead = true; o.fac = null; o.loc = -1; o.corps = null; o.captive = null;
  if (!wasLord) return;
  const cand = heir && aliveOff(g, heir, fac) ? g.officers[heir]
    : factionOfficers(g, fac).sort((a, b) => (b.lv - a.lv) || ((b.mu + b.ji + b.jg) - (a.mu + a.ji + a.jg)))[0];
  if (!cand) return;
  g.lords = g.lords || {};
  g.lords[fac] = cand.id; cand.loy = 100;
}
const facAlive = (g, f) => !!(g.factions[f] && g.factions[f].alive);
const owns = (g, n, f) => !!(g.castles[n] && g.castles[n].fac === f);
function eachCastle(g, fid, fn) { for (const n of factionCastles(g, fid)) fn(g.castles[n], n); }
const bump = (c, k, d, lo, hi) => { c[k] = Math.max(lo, Math.min(hi, Math.round(c[k] + d))); };
function nameKoEn(kind, key, ko) {
  const T = typeof NAMES_EN !== 'undefined' ? NAMES_EN : null;
  const tab = T && (T[kind] || T[kind + 's']);
  return [ko, (tab && tab[key]) || ko];
}
const facKE = f => nameKoEn('fac', f, FACTIONS[f] ? FACTIONS[f].nm : f);
const castleKE = n => nameKoEn('castle', n, castleDef(n).nm);
const foundIfWild = (g, id) => { const o = g.officers[id]; if (o && o.fac === null) o.found = true; };

const EVENTS = [
  // ── 사료 사건 ────────────────────────────────
  {
    id: 'girinyeong', kind: 'hist', y: 246, m: 8, need: g => g.castles[10] && g.castles[22],
    nm: '기리영 싸움', nmEn: 'Battle of Girinyeong',
    txt: '낙랑의 부종사 오림이 진한 여덟 나라를 떼어 낙랑에 붙이려 했다. 통역이 말을 잘못 옮겨 ' +
         '한(韓)의 신지가 격분했고, 마한이 대방군의 기리영을 쳤다. 대방태수 궁준이 전사했다.',
    txtEn: 'Wu Lin of Lelang tried to detach eight states from Jinhan. An interpreter garbled his words, the chiefs of Han ' +
           'took offence, and Mahan stormed Girinyeong in Daifang. Gong Zun, Grand Administrator of Daifang, was killed.',
    src: '삼국지 위서 동이전 한전', srcEn: 'Records of the Three Kingdoms, Book of Wei, Account of the Han',
    run: (g) => {
      setRel(g, '마한', '위', 'war');
      addAtt(g, '위', '마한', -30); addAtt(g, '마한', '위', -30);
      const d = g.castles[10];
      if (d) { d.wall = Math.round(d.wall * 0.7); d.morale = Math.max(10, d.morale - 15); }
      if (aliveOff(g, 'gungjun')) killOff(g, 'gungjun');
      return ['마한과 위가 등을 돌렸습니다. 대방의 성벽이 상하고 궁준이 전사했습니다.',
              'Mahan and Wei are now at war. The walls of Daifang are damaged and Gong Zun is dead.'];
    },
  },
  {
    id: 'baekje_nakrang', kind: 'hist', y: 246, m: 8, need: g => g.castles[8] && g.castles[19],
    nm: '백제, 낙랑 변경을 치다', nmEn: 'Baekje Raids the Lelang Border',
    txt: '위가 고구려를 치는 틈을 타 백제 고이왕이 좌장 진충을 보내 낙랑 변경을 습격하고 ' +
         '주민을 잡아왔다. 낙랑태수 유무가 노하자 왕이 침공을 두려워하여 그 사람들을 돌려보냈다.',
    txtEn: 'While Wei was busy with Goguryeo, King Goi of Baekje sent his commander Jinchung to raid the Lelang border and seize ' +
           'its people. When Liu Mao of Lelang grew angry, the king feared an invasion and sent them back.',
    src: '삼국사기 백제본기 고이왕 13년', srcEn: 'Samguk Sagi, Annals of Baekje, King Goi year 13',
    run: (g) => {
      const c = g.castles[19];
      if (c) bump(c, 'morale', 6, 0, 100);
      addAtt(g, '위', '백제', -25);
      const o = g.officers['jinchung'];
      if (o) o.exp += 90;
      return ['진충이 공을 세웠으나, 낙랑이 백제를 벼르게 되었습니다.',
              'Jinchung has earned merit, but Lelang now bears a grudge against Baekje.'];
    },
  },
  {
    id: 'deungnae', kind: 'hist', y: 246, m: 9, need: g => aliveOff(g, 'deungnae', '고구려'),
    nm: '득래의 간언', nmEn: 'The Warning of Deungnae',
    txt: '득래는 왕이 중국과 등지는 것을 여러 번 말렸으나 왕이 따르지 않자, "이 땅에 쑥대가 나는 것을 보겠다" ' +
         '탄식하고 먹지 않아 죽었다. 훗날 관구검은 그 무덤을 헐지 말라 명했다.',
    txtEn: 'Deungnae warned the king again and again against turning on China. When he was ignored he sighed, "I shall see ' +
           'mugwort grow on this land," and starved himself to death. Guanqiu Jian later ordered his grave left untouched.',
    src: '삼국사기 고구려본기 동천왕 20년', srcEn: 'Samguk Sagi, Annals of Goguryeo, King Dongcheon year 20',
    run: (g) => {
      killOff(g, 'deungnae');
      for (const o of factionOfficers(g, '고구려')) o.loy = Math.max(0, o.loy - 2);
      return ['득래가 세상을 떠났습니다. 고구려 신하들의 마음이 무거워졌습니다.',
              'Deungnae is dead. A heaviness has settled over the ministers of Goguryeo.'];
    },
  },
  {
    id: 'gwangugeom', kind: 'hist', y: 246, m: 10, need: g => g.castles[1],
    nm: '관구검의 침공', nmEn: 'Guanqiu Jian Invades',
    txt: '위의 유주자사 관구검이 현도태수 왕기를 앞세워 고구려를 쳤다. 환도성이 함락되고 ' +
         '동천왕은 동쪽으로 달아났다. 밀우가 뒤를 막고, 유유가 거짓 항복으로 적장을 찔러 죽였다.',
    txtEn: 'Guanqiu Jian, Inspector of You Province, struck Goguryeo with Wang Qi of Xuantu in the van. Hwando fell and King ' +
           'Dongcheon fled east. Miru held the rear, and Yuyu feigned surrender to stab the enemy commander.',
    src: '삼국지 위서 관구검전 · 삼국사기 고구려본기 동천왕 20년',
    srcEn: 'Records of the Three Kingdoms, Biography of Guanqiu Jian · Samguk Sagi, King Dongcheon year 20',
    run: (g) => {
      setRel(g, '고구려', '위', 'war');
      const c = g.castles[1];
      if (c) { c.wall = Math.round(c.wall * 0.5); c.morale = Math.max(10, c.morale - 20); }
      for (const id of ['miru', 'yuyu']) { const o = g.officers[id]; if (o) o.exp += 120; }
      return ['국내성의 성벽이 크게 상했습니다. 밀우와 유유가 공을 세웠습니다.',
              'The walls of Gungnae are badly damaged. Miru and Yuyu have earned great merit.'];
    },
  },
  {
    id: 'pyeongyang247', kind: 'hist', y: 247, m: 2, need: g => owns(g, 1, '고구려') && g.done && g.done.gwangugeom,
    nm: '평양성을 쌓다', nmEn: 'Building Pyongyang Fortress',
    txt: '환도성이 전쟁으로 무너져 다시 도읍으로 삼기 어렵자, 동천왕이 평양성을 쌓고 백성과 종묘사직을 옮겼다. ' +
         '이 평양이 지금의 평양인지는 학설이 갈린다.',
    txtEn: 'With Hwando ruined by war, King Dongcheon built Pyongyang Fortress and moved his people and shrines there. ' +
           'Scholars disagree on whether this was today\'s Pyongyang.',
    src: '삼국사기 고구려본기 동천왕 21년', srcEn: 'Samguk Sagi, Annals of Goguryeo, King Dongcheon year 21',
    run: (g) => {
      const c = g.castles[1];
      bump(c, 'morale', 10, 0, 100); bump(c, 'sec', 6, 0, castleDef(1).cap); c.pop += 2000;
      return ['국내성의 사기와 치안이 오르고 백성이 모여들었습니다.',
              'Morale and order rise in Gungnae, and people gather there again.'];
    },
  },
  {
    id: 'bulnae247', kind: 'hist', y: 247, m: 4, need: g => owns(g, 18, '동예') && facAlive(g, '위'),
    nm: '불내예왕', nmEn: 'The King of Bulnae-Ye',
    txt: '정시 8년, 불내후가 위의 궁궐에 이르러 조공하니 황제가 그를 불내예왕으로 봉했다. ' +
         '그는 백성 사이에 섞여 살며 사철마다 군에 나아가 예를 갖추었다.',
    txtEn: 'In the eighth year of Zhengshi the Lord of Bulnae came to the Wei court with tribute and was named King of Bulnae-Ye. ' +
           'He lived among his people and paid his respects at the commandery every season.',
    src: '삼국지 위서 동이전 예전', srcEn: 'Records of the Three Kingdoms, Book of Wei, Account of the Ye',
    run: (g) => {
      addAtt(g, '위', '동예', 25); addAtt(g, '동예', '위', 25);
      g.castles[18].gold += 500;
      return ['위와 동예가 가까워졌습니다. 하슬라의 금고가 늘었습니다.',
              'Wei and Dongye have grown closer. The treasury of Haseulla has grown.'];
    },
  },
  {
    id: 'zhangzheng247', kind: 'hist', y: 247, m: 6,
    need: g => facAlive(g, '야마토') && facAlive(g, '구노국') && aliveOff(g, 'himiko', '야마토'),
    nm: '황제의 누런 깃발', nmEn: 'The Emperor\'s Yellow Banner',
    txt: '왜의 여왕 히미코와 구노국의 남왕 히미쿠코는 본래 사이가 나빴다. 히미코가 대방군에 싸우는 형편을 알리자, ' +
         '위는 장정을 보내 조서와 누런 깃발을 난승미에게 주고 격문으로 타일렀다.',
    txtEn: 'Himiko, queen of Wa, had long been at odds with Himikuko, male king of Kunu. When she reported the fighting to Daifang, ' +
           'Wei sent Zhang Zheng to give Nashime an edict and a yellow banner and to admonish them by proclamation.',
    src: '삼국지 위서 왜인전', srcEn: 'Records of the Three Kingdoms, Book of Wei, Account of the Wa',
    run: (g) => {
      setRel(g, '야마토', '구노국', 'war');
      addAtt(g, '위', '야마토', 20); addAtt(g, '야마토', '위', 20);
      const o = g.officers['nanseungmi']; if (o) o.exp += 80;
      eachCastle(g, '야마토', c => bump(c, 'morale', 6, 0, 100));
      return ['야마토와 구노국이 전쟁에 들어갔습니다. 위가 야마토의 편에 섰습니다.',
              'Yamato and Kunu are at war. Wei has taken Yamato\'s side.'];
    },
  },
  {
    id: 'hwachin248', kind: 'hist', y: 248, m: 2, need: g => facAlive(g, '신라') && facAlive(g, '고구려'),
    nm: '사로와 고구려의 화친', nmEn: 'Saro Makes Peace with Goguryeo',
    txt: '첨해가 왕위에 오른 이듬해, 사로가 고구려에 사신을 보내 화친을 맺었다.',
    txtEn: 'The year after Cheomhae took the throne, Saro sent envoys to Goguryeo and made peace.',
    src: '삼국사기 신라본기 첨해이사금 2년', srcEn: 'Samguk Sagi, Annals of Silla, Cheomhae Isageum year 2',
    run: (g) => {
      if (relOf(g, '신라', '고구려') === 'war') setRel(g, '신라', '고구려', 'peace');
      addAtt(g, '신라', '고구려', 25); addAtt(g, '고구려', '신라', 25);
      return ['사로와 고구려의 사이가 가까워졌습니다.', 'Saro and Goguryeo have drawn closer.'];
    },
  },
  {
    id: 'himiko', kind: 'hist', y: 248, m: 3, need: g => aliveOff(g, 'himiko'),
    nm: '히미코의 죽음', nmEn: 'The Death of Himiko',
    txt: '왜의 여왕 히미코가 죽었다. 무덤을 크게 만들고 따라 죽은 종이 백여 명이었다. ' +
         '남자를 왕으로 세웠으나 나라가 따르지 않아 서로 죽이기를 천여 명, ' +
         '다시 히미코의 종녀 이여를 세우고서야 잦아들었다.',
    txtEn: 'Himiko, queen of Wa, died. A great mound was raised and over a hundred servants died with her. A man was made king, ' +
           'but the land would not obey and more than a thousand were killed, until Iyo of Himiko\'s clan was made queen.',
    src: '삼국지 위서 왜인전', srcEn: 'Records of the Three Kingdoms, Book of Wei, Account of the Wa',
    run: (g) => {
      const y = g.officers['wa_iyeo'];
      if (y && !y.dead) { y.fac = '야마토'; y.loy = 100; y.lv += 3; y.found = true; }
      killOff(g, 'himiko', 'wa_iyeo');
      for (const n of factionCastles(g, '야마토')) {
        const c = g.castles[n];
        c.sec = Math.max(5, c.sec - 20); c.morale = Math.max(10, c.morale - 15);
      }
      return ['야마토가 크게 흔들렸습니다. 이여가 뒤를 이었습니다.', 'Yamato is shaken to its core. Iyo has taken the throne.'];
    },
  },
  {
    id: 'okjeo_tribute', kind: 'hist', y: 247, m: 7, need: g => g.castles[17] && g.castles[17].fac,
    nm: '옥저의 공물', nmEn: 'The Tribute of Okjeo',
    txt: '동옥저는 고구려에 소금과 물고기, 해초를 져 날랐다. 천 리 길을 지고 갔다 한다.',
    txtEn: 'East Okjeo carried salt, fish and seaweed to Goguryeo on their backs, a thousand li on foot.',
    src: '삼국지 위서 동이전 동옥저전', srcEn: 'Records of the Three Kingdoms, Book of Wei, Account of East Okjeo',
    run: (g) => {
      const owner = g.castles[17].fac;
      for (const n of factionCastles(g, owner)) g.castles[n].food += 2000;
      const [ko, en] = facKE(owner);
      return [`${ko}의 군량이 늘었습니다.`, `The grain stores of ${en} have grown.`];
    },
  },
  {
    id: 'dongcheon248', kind: 'hist', y: 248, m: 9, need: g => aliveOff(g, 'dongcheon', '고구려'),
    nm: '동천왕의 죽음과 시원', nmEn: 'The Death of Dongcheon',
    txt: '동천왕이 죽자 그 은덕을 그리워하여 따라 죽으려는 신하가 많았다. 새 왕이 예가 아니라며 막았으나 ' +
         '장례날 무덤에서 스스로 죽는 이가 많아, 사람들이 땔나무로 주검을 덮고 그곳을 시원(柴原)이라 불렀다.',
    txtEn: 'When King Dongcheon died, many who remembered his kindness sought to die with him. The new king forbade it, yet many ' +
           'killed themselves at the tomb, and people covered them with firewood and named the place Siwon.',
    src: '삼국사기 고구려본기 동천왕 22년', srcEn: 'Samguk Sagi, Annals of Goguryeo, King Dongcheon year 22',
    run: (g) => {
      killOff(g, 'dongcheon', 'gy_yeonbul');
      const heir = g.officers[lordIdOf(g, '고구려')];
      if (heir) heir.lv += 2;
      eachCastle(g, '고구려', c => bump(c, 'morale', -6, 10, 100));
      const hn = heir ? heir.nm : '';
      return [`동천왕이 세상을 떠났습니다. ${hn}이(가) 고구려의 뒤를 이었습니다.`,
              `King Dongcheon is dead. ${heir && heir.en ? heir.en : 'His heir'} now rules Goguryeo.`];
    },
  },
  {
    id: 'seokuro249', kind: 'hist', y: 249, m: 4, need: g => aliveOff(g, 'seokuro', '신라') && facAlive(g, '야마토'),
    nm: '석우로의 농담', nmEn: 'Seok Uro\'s Jest',
    txt: '석우로가 왜의 사신 갈나고에게 "너희 왕을 소금 굽는 종으로 삼겠다" 농담했다. 노한 왜왕이 우도주군을 보내 쳐들어오자 ' +
         '우로가 스스로 적진에 갔고, 왜인들은 그를 불태워 죽였다. 신라본기는 첨해왕 3년, 열전은 7년의 일로 적었다.',
    txtEn: 'Seok Uro joked to the Wa envoy Galnago that he would make the Wa king a salt-boiling slave. The enraged king sent Udojugun ' +
           'to attack; Uro went to the enemy himself and was burned to death. The Silla Annals date it to 249, his biography to 253.',
    src: '삼국사기 신라본기 첨해이사금 3년 · 열전 석우로', srcEn: 'Samguk Sagi, Annals of Silla, Cheomhae year 3 · Biography of Seok Uro',
    run: (g) => {
      killOff(g, 'seokuro');
      setRel(g, '신라', '야마토', 'war');
      addAtt(g, '신라', '야마토', -30); addAtt(g, '야마토', '신라', -30);
      eachCastle(g, '신라', c => bump(c, 'morale', -8, 10, 100));
      return ['석우로가 죽었습니다. 사로와 야마토가 원수가 되었습니다.', 'Seok Uro is dead. Saro and Yamato are now bitter enemies.'];
    },
  },
  {
    id: 'buyeo_gone', kind: 'hist', y: 249, m: 5, need: g => factionCastles(g, '부여').length > 0,
    nm: '부여의 흉년', nmEn: 'Famine in Buyeo',
    txt: '부여의 옛 풍속에는 비바람이 고르지 못해 오곡이 여물지 않으면 그 허물을 왕에게 돌려, ' +
         '왕을 바꾸거나 죽이자 하였다. 이해 부여에 흉년이 들었다.',
    txtEn: 'By the old custom of Buyeo, when the weather failed and the grain did not ripen the king was blamed, and some would say ' +
           'he should be replaced or killed. This year Buyeo\'s harvest failed.',
    src: '삼국지 위서 동이전 부여전', srcEn: 'Records of the Three Kingdoms, Book of Wei, Account of Buyeo',
    run: (g) => {
      for (const n of factionCastles(g, '부여')) {
        const c = g.castles[n];
        c.food = Math.round(c.food * 0.5);
        c.sec = Math.max(5, c.sec - 12);
      }
      return ['부여의 곳간이 절반으로 줄었습니다.', 'Buyeo\'s granaries have been cut in half.'];
    },
  },
  {
    id: 'gwanna251', kind: 'hist', y: 251, m: 4,
    need: g => aliveOff(g, 'gy_yeonbul', '고구려') && lordIdOf(g, '고구려') === 'gy_yeonbul',
    nm: '관나부인의 가죽 주머니', nmEn: 'Lady Gwanna\'s Leather Sack',
    txt: '중천왕이 아끼던 관나부인이 왕후 연씨를 시기하여, 가죽 주머니를 들고 "왕후가 나를 여기 넣어 바다에 던지려 한다"고 ' +
         '모함했다. 거짓임을 안 왕은 도리어 관나부인을 그 주머니에 넣어 서해에 던지게 했다.',
    txtEn: 'Lady Gwanna, favored by King Jungcheon, envied Queen Yeon and, holding a leather sack, claimed the queen meant to throw ' +
           'her into the sea in it. Seeing the lie, the king had Lady Gwanna herself cast into the western sea in that sack.',
    src: '삼국사기 고구려본기 중천왕 4년', srcEn: 'Samguk Sagi, Annals of Goguryeo, King Jungcheon year 4',
    run: (g) => {
      const cap = FACTIONS['고구려'].cap;
      if (owns(g, cap, '고구려')) bump(g.castles[cap], 'sec', 5, 0, castleDef(cap).cap);
      const o = g.officers['gy_yeonbul']; if (o) o.exp += 40;
      return ['궁중의 기강이 바로 섰습니다.', 'Order in the palace has been restored.'];
    },
  },
  {
    id: 'goegok255', kind: 'hist', y: 255, m: 9, need: g => facAlive(g, '백제') && facAlive(g, '신라'),
    nm: '괴곡 싸움', nmEn: 'The Battle West of Goegok',
    txt: '백제가 쳐들어오자 사로의 일벌찬 익종이 괴곡 서쪽에서 맞서 싸웠으나 전사했다.',
    txtEn: 'When Baekje invaded, Ikjong, an ilbeolchan of Saro, met them west of Goegok and was killed.',
    src: '삼국사기 신라본기 첨해이사금 9년', srcEn: 'Samguk Sagi, Annals of Silla, Cheomhae Isageum year 9',
    run: (g) => {
      setRel(g, '백제', '신라', 'war');
      addAtt(g, '백제', '신라', -20); addAtt(g, '신라', '백제', -20);
      eachCastle(g, '신라', c => { for (const u of UNIT_KEYS) c.troops[u] = Math.round(c.troops[u] * 0.9); });
      return ['백제와 사로가 전쟁에 들어갔습니다. 사로의 병력이 줄었습니다.', 'Baekje and Saro are at war. Saro has lost troops.'];
    },
  },
  {
    id: 'yangmaek259', kind: 'hist', y: 259, m: 12,
    need: g => facAlive(g, '고구려') && facAlive(g, '위') && aliveOff(g, 'gy_yeonbul', '고구려'),
    nm: '양맥 골짜기 싸움', nmEn: 'The Valleys of Yangmaek',
    txt: '위의 장수 위지해가 쳐들어오자 중천왕이 정예 기병 오천을 골라 양맥의 골짜기에서 쳐부수고 팔천여 명의 목을 베었다.',
    txtEn: 'When the Wei general Yuchi Kai invaded, King Jungcheon chose five thousand elite horsemen, crushed him in the valleys ' +
           'of Yangmaek, and took more than eight thousand heads.',
    src: '삼국사기 고구려본기 중천왕 12년', srcEn: 'Samguk Sagi, Annals of Goguryeo, King Jungcheon year 12',
    run: (g) => {
      eachCastle(g, '위', c => { for (const u of UNIT_KEYS) c.troops[u] = Math.round(c.troops[u] * 0.92); });
      eachCastle(g, '고구려', c => bump(c, 'morale', 10, 0, 100));
      const o = g.officers['gy_yeonbul']; if (o) o.exp += 150;
      return ['위의 병력이 줄고 고구려의 사기가 올랐습니다.', 'Wei\'s armies have shrunk and Goguryeo\'s morale soars.'];
    },
  },
  {
    id: 'goi260', kind: 'hist', y: 260, m: 1, need: g => facAlive(g, '백제'),
    nm: '여섯 좌평과 열여섯 관등', nmEn: 'Six Ministers and Sixteen Ranks',
    txt: '고이왕이 여섯 좌평을 두어 나랏일을 나누어 맡기고, 좌평에서 극우까지 열여섯 관등을 정했다.',
    txtEn: 'King Goi appointed six jwapyeong ministers to share the affairs of state and set sixteen ranks, from jwapyeong down to geugu.',
    src: '삼국사기 백제본기 고이왕 27년', srcEn: 'Samguk Sagi, Annals of Baekje, King Goi year 27',
    run: (g) => {
      eachCastle(g, '백제', (c, n) => bump(c, 'sec', 8, 0, castleDef(n).cap));
      for (const o of factionOfficers(g, '백제')) o.loy = Math.min(100, o.loy + 6);
      return ['백제의 치안과 신하들의 충성이 올랐습니다.', 'Order and loyalty rise across Baekje.'];
    },
  },
  {
    id: 'goi262', kind: 'hist', y: 262, m: 1, need: g => facAlive(g, '백제'),
    nm: '뇌물을 받은 관리는', nmEn: 'The Law on Bribes',
    txt: '고이왕이 영을 내려, 재물을 받거나 도둑질한 관리는 장물의 세 배를 물리고 평생 벼슬길을 막았다.',
    txtEn: 'King Goi decreed that any official who took bribes or stole must repay threefold and be barred from office for life.',
    src: '삼국사기 백제본기 고이왕 29년', srcEn: 'Samguk Sagi, Annals of Baekje, King Goi year 29',
    run: (g) => {
      eachCastle(g, '백제', (c, n) => { bump(c, 'sec', 6, 0, castleDef(n).cap); c.gold += 300; });
      return ['백제의 치안이 오르고 거점마다 금 300이 들어왔습니다.', 'Order rises in Baekje, and each hold gains 300 gold.'];
    },
  },
  {
    id: 'jin265', kind: 'hist', y: 265, m: 12, need: g => facAlive(g, '위'),
    nm: '위가 가고 진이 서다', nmEn: 'Wei Falls, Jin Rises',
    txt: '사마염이 위의 마지막 황제에게서 자리를 물려받아 진(晉)을 세웠다. 이 게임에서는 위 세력이 이름을 그대로 둔 채 진을 잇는다.',
    txtEn: 'Sima Yan took the throne from the last Wei emperor and founded the Jin dynasty. In this game the Wei faction keeps its name and carries on as Jin.',
    src: '진서 무제기', srcEn: 'Book of Jin, Annals of Emperor Wu',
    run: (g) => {
      eachCastle(g, '위', (c) => { bump(c, 'morale', -12, 10, 100); bump(c, 'sec', -6, 5, 100); });
      return ['낙랑과 대방의 사기와 치안이 떨어졌습니다.', 'Morale and order fall in Lelang and Daifang.'];
    },
  },
  {
    id: 'mucheon', kind: 'hist', y: 0, m: 10, repeat: true, need: g => g.castles[18] && g.castles[18].fac,
    nm: '무천(舞天)', nmEn: 'Mucheon, the Dance to Heaven',
    txt: '예 사람은 시월이면 하늘에 제사하고 밤낮으로 술 마시며 노래하고 춤춘다. 이를 무천이라 한다.',
    txtEn: 'In the tenth month the people of Ye sacrifice to Heaven, drinking, singing and dancing day and night. This is called Mucheon.',
    src: '삼국지 위서 동이전 예전', srcEn: 'Records of the Three Kingdoms, Book of Wei, Account of the Ye',
    run: (g) => {
      const owner = g.castles[18].fac;
      for (const n of factionCastles(g, owner)) {
        const c = g.castles[n];
        c.morale = Math.min(100, c.morale + 8);
        c.sec = Math.min(castleDef(n).cap, c.sec + 4);
      }
      const [ko, en] = facKE(owner);
      return [`${ko}의 사기가 올랐습니다.`, `Morale rises across ${en}.`];
    },
  },

  // ── 가상 이야기(창작) ─────────────────────────
  {
    id: 'f_minyu', kind: 'fic', chance: 0.25,
    need: g => { const o = g.officers.kimminyu; return !!o && !o.dead && !o.captive && o.fac === null && !o.found && !!g.castles[18]; },
    nm: '대관령의 창잡이', nmEn: 'The Spearman of Daegwallyeong',
    txt: '대관령 고갯길을 막은 산적 떼를 창 한 자루로 흩어 버린 젊은이가 있었다. 그는 강릉의 김민유라 이름만 남기고 사라졌다.',
    txtEn: 'A young man scattered the bandits blocking the Daegwallyeong pass with a single spear, left only the name Kim Min-yu of Gangneung, and vanished.',
    src: '창작', srcEn: 'Fiction',
    run: (g) => {
      g.officers.kimminyu.found = true;
      bump(g.castles[18], 'sec', 8, 0, castleDef(18).cap);
      return ['재야 인재 김민유가 하슬라에 이름을 드러냈습니다. 탐색하지 않아도 등용할 수 있습니다.',
              'Kim Min-yu has made his name known at Haseulla. He can be recruited without a search.'];
    },
  },
  {
    id: 'f_jeongchan', kind: 'fic', chance: 0.3, ms: [3, 4],
    need: g => aliveOff(g, 'jeongchan') && !!g.castles[20],
    nm: '정찬의 서쪽 창고', nmEn: 'Jeong Chan\'s West Storehouse',
    txt: '보릿고개에 중원경의 솥이 비자, 아전 정찬이 풍년마다 덜어 둔 곡식 창고를 열어 백성에게 빌려주었다.',
    txtEn: 'When the spring famine emptied the pots of Jungwongyeong, the clerk Jeong Chan opened a storehouse of grain he had set aside in good years and lent it out.',
    src: '창작', srcEn: 'Fiction',
    run: (g) => {
      const c = g.castles[20];
      c.food += 5000; bump(c, 'sec', 6, 0, castleDef(20).cap);
      foundIfWild(g, 'jeongchan');
      return ['중원경의 군량이 5,000 늘고 치안이 올랐습니다.', 'Jungwongyeong gains 5,000 grain and order rises.'];
    },
  },
  {
    id: 'f_forge', kind: 'fic', chance: 0.2,
    need: g => aliveOff(g, 'kimgyeongho') && !!(g.castles[21] && g.castles[21].fac),
    nm: '북원의 대장간', nmEn: 'The Smithy of Bugwon',
    txt: '대장장이 김경호가 벼린 쇠창이 휘지 않는다는 소문에, 창을 든 장정 팔백이 북원성 군적에 이름을 올렸다.',
    txtEn: 'Word spread that the spears forged by the smith Kim Gyeong-ho never bent, and eight hundred young men joined the rolls of Bugwon.',
    src: '창작', srcEn: 'Fiction',
    run: (g) => {
      const c = g.castles[21];
      c.troops['보병'] += 800; c.gold = Math.max(0, c.gold - 200);
      foundIfWild(g, 'kimgyeongho');
      return ['북원성에 보병 800이 늘었습니다(쇠값 금 200).', 'Bugwon gains 800 infantry (200 gold spent on iron).'];
    },
  },
  {
    id: 'f_archery', kind: 'fic', chance: 0.3, ms: [5, 6],
    need: g => aliveOff(g, 'johyeonjin') && !!(g.castles[19] && g.castles[19].fac),
    nm: '한수의 버들잎', nmEn: 'The Willow Leaf on the Han',
    txt: '오월 씨뿌리기를 마친 뒤 한수 가의 활쏘기 겨루기에서, 위례의 조현진이 백 보 밖 버들잎을 꿰뚫었다.',
    txtEn: 'At an archery contest on the Han after the May sowing, Jo Hyeon-jin of Wirye pierced a willow leaf a hundred paces away.',
    src: '창작', srcEn: 'Fiction',
    run: (g) => {
      bump(g.castles[19], 'morale', 12, 0, 100);
      g.officers.johyeonjin.exp += 100;
      foundIfWild(g, 'johyeonjin');
      return ['위례성의 사기가 올랐습니다. 조현진이 경험을 쌓았습니다.', 'Morale rises in Wirye. Jo Hyeon-jin gains experience.'];
    },
  },
  {
    id: 'f_plague', kind: 'fic', chance: 0.18, ms: [6, 7, 8],
    pick: g => {
      const list = factionCastles(g, g.player).filter(n => g.castles[n].sec < 60);
      if (!list.length) return null;
      return list.sort((a, b) => g.castles[b].pop - g.castles[a].pop)[0];
    },
    nm: '여름 열병', nmEn: 'Summer Fever',
    txt: '여름 열병이 고을을 휩쓸었다. 무당의 굿으로도 잦아들지 않다가, 가을바람이 불고서야 물러갔다.',
    txtEn: 'A summer fever swept the town. The shaman\'s rites could not stop it; only the autumn wind drove it away.',
    src: '창작', srcEn: 'Fiction',
    run: (g, n) => {
      const c = g.castles[n], helped = aliveOff(g, 'kimyujin', g.player);
      c.pop = Math.round(c.pop * (helped ? 0.95 : 0.9));
      bump(c, 'morale', -8, 10, 100);
      const [ko, en] = castleKE(n);
      return helped
        ? [`${ko}의 인구가 5% 줄었습니다. 김유진 덕분에 피해가 절반에 그쳤습니다.`, `${en} loses 5% of its people. Thanks to Kim Yu-jin, the toll was halved.`]
        : [`${ko}의 인구가 10% 줄고 사기가 떨어졌습니다.`, `${en} loses 10% of its people and morale falls.`];
    },
  },
  {
    id: 'f_pirates', kind: 'fic', chance: 0.2,
    need: g => aliveOff(g, 'jogyeongjun') && !!(g.castles[31] && g.castles[31].fac),
    nm: '모래톱에 걸린 해적선', nmEn: 'Pirates on the Sandbar',
    txt: '구야 포구를 턴 해적선을, 물때를 아는 조경준이 모래톱으로 몰아 불화살로 잡았다.',
    txtEn: 'Pirates raided the harbor of Guya, but Jo Gyeong-jun, who knew the tides, drove their ships onto a sandbar and took them with fire arrows.',
    src: '창작', srcEn: 'Fiction',
    run: (g) => {
      g.castles[31].gold += 700;
      foundIfWild(g, 'jogyeongjun');
      return ['구야의 금고에 금 700이 들어왔습니다.', 'The treasury of Guya gains 700 gold.'];
    },
  },
  {
    id: 'f_comet', kind: 'fic', chance: 0.08, need: g => g.year >= 250,
    nm: '살별', nmEn: 'The Comet',
    txt: '꼬리가 긴 살별이 동북 하늘을 가로질렀다. 사람들은 난리의 징조라 수군거렸다.',
    txtEn: 'A long-tailed comet crossed the northeastern sky, and people whispered that it foretold war.',
    src: '창작', srcEn: 'Fiction',
    run: (g) => {
      for (const c of Object.values(g.castles)) bump(c, 'morale', -5, 10, 100);
      eachCastle(g, g.player, (c, n) => bump(c, 'sec', 5, 0, castleDef(n).cap));
      return ['온 땅의 사기가 조금 떨어졌습니다. 우리 거점은 채비를 서둘러 치안이 올랐습니다.',
              'Morale dips everywhere. Our holds hurried their preparations, and order rises.'];
    },
  },
  {
    id: 'f_bandits', kind: 'fic', chance: 0.3,
    pick: g => {
      if (!aliveOff(g, 'seojongbeom')) return null;
      const list = factionCastles(g, g.player).filter(n => g.castles[n].sec < 40);
      return list.length ? list.sort((a, b) => g.castles[a].sec - g.castles[b].sec)[0] : null;
    },
    nm: '밤의 도적 떼', nmEn: 'Bandits in the Night',
    txt: '치안이 흐트러진 고을 바깥에서 도적 떼가 창고에 불을 질렀다. 무진의 기마 서종범이 밤길을 달려 그들을 흩었다.',
    txtEn: 'Bandits set fire to the storehouses outside a lawless town, until Seo Jong-beom, the horseman of Mujin, rode through the night and scattered them.',
    src: '창작', srcEn: 'Fiction',
    run: (g, n) => {
      const c = g.castles[n];
      c.gold = Math.max(0, c.gold - 300); bump(c, 'sec', 8, 0, castleDef(n).cap);
      foundIfWild(g, 'seojongbeom');
      const [ko, en] = castleKE(n);
      return [`${ko}이(가) 금 300을 잃었으나 도적이 흩어져 치안이 올랐습니다.`, `${en} lost 300 gold, but the bandits are gone and order rises.`];
    },
  },
  {
    id: 'f_market', kind: 'fic', chance: 0.2,
    need: g => aliveOff(g, 'choiinu') && !!(g.castles[28] && g.castles[28].fac),
    nm: '개성의 큰 장', nmEn: 'The Great Fair of Gaeseong',
    txt: '낙랑과 마한의 상인이 함께 모인 개성의 큰 장에서, 두 곳 말을 다 하는 최인우가 흥정을 붙였다.',
    txtEn: 'At a great fair in Gaeseong where merchants of Lelang and Mahan met, Choi In-u, who spoke both tongues, brokered the deals.',
    src: '창작', srcEn: 'Fiction',
    run: (g) => {
      g.castles[28].gold += 900;
      foundIfWild(g, 'choiinu');
      return ['개성의 금고에 금 900이 들어왔습니다.', 'The treasury of Gaeseong gains 900 gold.'];
    },
  },
  {
    id: 'f_hunt', kind: 'fic', chance: 0.3, ms: [12, 1],
    need: g => aliveOff(g, 'hamjunwon') && !!(g.castles[17] && g.castles[17].fac),
    nm: '함주의 곰', nmEn: 'The Bear of Hamju',
    txt: '한겨울 함주 고을에 내려온 큰 곰을, 홑옷 차림의 사냥꾼 함준원이 눈보라 속에서 잡았다.',
    txtEn: 'In deep winter a great bear came down on Hamju, and Ham Jun-won, a hunter in a thin coat, brought it down in the blizzard.',
    src: '창작', srcEn: 'Fiction',
    run: (g) => {
      const c = g.castles[17];
      bump(c, 'morale', 8, 0, 100); c.food += 1500;
      foundIfWild(g, 'hamjunwon');
      return ['함주성의 사기가 오르고 군량이 1,500 늘었습니다.', 'Morale rises in Hamju and it gains 1,500 grain.'];
    },
  },
];

const FIC_GAP = 5;             // 가상 이야기 사이 최소 간격(달) — 너무 잦으면 사료 사건이 묻힌다
function runEvents(g) {
  g.done = g.done || {};
  const fired = [];
  let ficFired = false;
  for (const e of EVENTS) {
    if (!e.repeat && g.done[e.id]) continue;
    let ctx = null;
    if (e.kind === 'fic') {
      if (ficFired || g.turn < 3 || g.turn - (g.lastFic == null ? -99 : g.lastFic) < FIC_GAP) continue;
      if (e.ms && !e.ms.includes(g.month)) continue;
      if (e.need && !e.need(g)) continue;
      if (e.pick) { ctx = e.pick(g); if (ctx == null) continue; }
      if (rndOf(g) >= e.chance) continue;
    } else {
      if (e.y && g.year !== e.y) continue;
      if (e.m && g.month !== e.m) continue;
      if (e.need && !e.need(g)) continue;
      if (e.repeat && g.done[e.id] === g.year) continue;
    }
    const again = e.repeat && g.done[e.id] != null;
    const out = e.run(g, ctx);
    const [result, resultEn] = Array.isArray(out) ? out : [out, out];
    g.done[e.id] = e.repeat ? g.year : true;
    if (e.kind === 'fic') { ficFired = true; g.lastFic = g.turn; }
    // ★일어난 달을 기록해 둔다 — 사건은 월말 정산에서 터지고 그 뒤에 달이 넘어가므로,
    //   화면에서 g.month 를 읽으면 한 달 뒤로 표시된다(실측: 8월 사건이 9월로).
    const rec = { t: g.turn, k: 'event', id: e.id, kind: e.kind, nm: e.nm, nmEn: e.nmEn, txt: e.txt, txtEn: e.txtEn,
                  src: e.src, srcEn: e.srcEn, result, resultEn, castle: ctx, again, y: g.year, m: g.month };
    g.log.push(rec);
    fired.push(rec);
  }
  return fired;
}

// ──────────────────────────────────────────── 월말 정산
function endMonth(g) {
  for (const c of Object.values(g.castles)) {
    delete c.tv;                                   // 이번 달 상인 거래량
    c.gold += income(c) - upkeep(c);
    if (c.gold < 0) { c.morale = Math.max(5, c.morale - 6); c.gold = 0; }
    c.food -= foodUse(c);
    if (g.month === SIM.HARVEST_MONTH) c.food += harvest(c);
    if (c.food < 0) {
      c.food = 0;
      c.morale = Math.max(5, c.morale - 10);
      const starve = Math.round(troopTotal(c) * 0.04);
      let left = starve;
      for (const u of ['보병', '궁병', '기병']) {
        const cut = Math.min(c.troops[u], left);
        c.troops[u] -= cut; left -= cut;
      }
    }
    // 야전병원 복귀
    if (c.hosp > 0) {
      const back = Math.round(c.hosp * 0.3);
      c.hosp -= back;
      const room = castleDef(c.n).garr - troopTotal(c);
      c.troops.보병 += Math.min(back, Math.max(0, room));
    }
    // 인구
    let growth = 0.002 + (c.ag - 50) / 20000 - Math.max(0, 40 - c.sec) / 4000;
    if (c.sec < 30) growth -= 0.01;
    c.pop = Math.max(800, Math.round(c.pop * (1 + growth)));
    // 치안이 바닥이면 반란
    if (c.sec < 20 && rndOf(g) < 0.12) {
      c.sec = Math.min(100, c.sec + 15);
      c.pop = Math.round(c.pop * 0.96);
      g.log.push({ t: g.turn, k: 'revolt', n: c.n });
    }
    c.sec = Math.max(0, Math.min(castleDef(c.n).cap, c.sec - 0.4));
  }
  // 무장 정리 + 레벨업
  for (const o of Object.values(g.officers)) {
    o.done = false;
    if (o.hurt > 0) o.hurt--;
    while (o.exp >= expNeed(o.lv) && o.lv < 50) { o.exp -= expNeed(o.lv); levelUp(g, o); }
    if (o.fac) {
      const c = g.castles[o.loc];
      if (!c || c.fac !== o.fac) {
        // 있던 거점이 넘어갔다 — 갈 곳을 잃으면 마음도 식는다
        o.loy = Math.max(0, o.loy - 4);
      } else if (c.gold <= 0) {
        o.loy = Math.max(0, o.loy - 3);     // 봉록이 끊겼다
      } else if (c.food <= 0) {
        o.loy = Math.max(0, o.loy - 2);
      } else {
        o.loy = Math.min(100, o.loy + 0.4);
      }
      // ★충성이 바닥이면 떠난다. 거느린 부대는 거점에 남는다.
      if (o.loy < 20 && rndOf(g) < (20 - o.loy) / 160) {
        if (o.corps && o.corps.n > 0 && c && c.fac === o.fac) {
          const room = castleDef(o.loc).garr - troopTotal(c);
          c.troops[o.corps.unit] += Math.min(o.corps.n, Math.max(0, room));
        }
        g.log.push({ t: g.turn, k: 'leave', off: o.id, fac: o.fac, n: o.loc });
        o.fac = null; o.corps = null; o.loy = 0; o.found = true;
      }
    }
  }
  // 외교 시효와 표류
  for (const f of Object.values(g.factions)) {
    for (const o of Object.keys(f.truce)) if (f.truce[o] > 0) f.truce[o]--;
    for (const o of Object.keys(f.att)) {
      if (!g.factions[o] || !g.factions[o].alive) continue;
      const r = f.rel[o];
      // 전쟁은 마음을 갉고, 동맹은 쌓는다. 평화는 천천히 중립으로 돌아간다.
      if (r === 'war') f.att[o] = Math.max(0, f.att[o] - 1);
      else if (r === 'ally') f.att[o] = Math.min(100, f.att[o] + 0.8);
      else f.att[o] += f.att[o] < 50 ? 0.3 : -0.2;
    }
  }
  processCaptives(g);
  for (const fid of Object.keys(g.factions)) checkDead(g, fid);
  runEvents(g);
}

function expNeed(lv) { return 60 + lv * 26; }
function levelUp(g, o) {
  o.lv++;
  const d = officerDef(o.id);
  const axes = d.growth.length ? d.growth : ['mu', 'ji', 'jg'];
  const pick = axes[Math.floor(rndOf(g) * axes.length)];
  o[pick] = Math.min(100, o[pick] + 1 + (rndOf(g) < 0.35 ? 1 : 0));
  if (rndOf(g) < 0.4) {
    const other = ['mu', 'ji', 'jg'][Math.floor(rndOf(g) * 3)];
    o[other] = Math.min(100, o[other] + 1);
  }
}
// ★한 무장이 데려가는 병력. 1,000+레벨×200 은 대규모 성(주둔 30,000)을 치기엔 너무 적어
//   전술 전투가 3,600 대 14,000 으로 성립하지 않았다(2026-09-10 실측) → 1,200+레벨×300.
function troopCap(o) { return 1200 + o.lv * 300; }

function nextTurn(g) {
  resolveIncoming(g);
  endMonth(g);
  g.turn++;
  g.month++;
  if (g.month > 12) { g.month = 1; g.year++; }
  if (g.turn >= SIM.MAX_MONTH) g.over = winnerByCastles(g);
  else {
    const alive = Object.values(g.factions).filter(f => f.alive);
    if (alive.length === 1) g.over = alive[0].id;
  }
  return g;
}
function winnerByCastles(g) {
  let best = null, n = -1;
  for (const f of Object.values(g.factions)) {
    if (!f.alive) continue;
    const k = factionCastles(g, f.id).length;
    if (k > n) { n = k; best = f.id; }
  }
  return best;
}

// ──────────────────────────────────────────── AI (1단계: 최소한만)
function aiTurn(g, fid) {
  const mine = factionCastles(g, fid);
  if (!mine.length) return;
  const offs = factionOfficers(g, fid).filter(o => !o.done);
  const aggr = g.factions[fid].aggr;

  // 포로 — AI 는 처단하지 않는다. 설득해 보고, 안 되면 가끔 풀어 준다.
  for (const cp of captivesOf(g, fid)) {
    const r1 = doCaptive(g, fid, cp.id, 'hire');
    if (r1.ok && !r1.joined && rndOf(g) < 0.25) doCaptive(g, fid, cp.id, 'free');
  }

  for (const o of offs) {
    const c = g.castles[o.loc];
    if (!c || c.fac !== fid) continue;
    const r = rndOf(g);
    // 지략가는 가끔 이웃에게 계략을 건다 — 사람 세력도 당하는 쪽이 되어야 한다
    if (o.ji >= 72 && c.gold > 500 && r < 0.05) {
      const tg = plotTargets(g, c.n).filter(x => relOf(g, fid, g.castles[x].fac) === 'war' || attOf(g, fid, g.castles[x].fac) < 40);
      if (tg.length) {
        const to = tg[Math.floor(rndOf(g) * tg.length)];
        const victims = officersAt(g, to).filter(x => x.fac === g.castles[to].fac && !isLord(g, x.id));
        const r2 = victims.length && rndOf(g) < 0.35
          ? doPlot(g, c.n, o.id, '이간', to, victims[Math.floor(rndOf(g) * victims.length)].id)
          : doPlot(g, c.n, o.id, '유언비어', to);
        if (r2.ok) continue;
      }
    }
    // 병력이 얇으면 채우고, 곳간이 얇으면 상업, 아니면 농업/치안
    // ★채우는 선(0.75)이 나가는 선(0.5)보다 위여야 한다. 반대로 두면 둘 사이에서 굳는다.
    if (troopTotal(c) < castleDef(c.n).garr * 0.75 && c.gold > 600) {
      const room = castleDef(c.n).garr - troopTotal(c);
      const mode = c.gold > 3000 ? '모병' : '징병';
      const afford = Math.floor(c.gold * 0.55 / (SIM.UNITS.보병.cost * SIM.RECRUIT[mode].priceMul) * 1000);
      const cap = Math.min(draftCap(c), room, afford, 3000);
      if (cap >= 200) { doRecruit(g, c.n, o.id, '보병', Math.floor(cap / 100) * 100, mode); continue; }
    }
    if (c.sec < 45) { doDevelop(g, c.n, o.id, '치안'); continue; }
    if (c.gold < 350) { doDevelop(g, c.n, o.id, '상업'); continue; }
    if (c.train < 70 && r < 0.4) { doTrain(g, c.n, o.id); continue; }
    if (o.loy < 45 && c.gold > 500 && r < 0.5) { doReward(g, c.n, o.id, 200); }
    const wild = wildAt(g, c.n);
    if (wild.length && r < 0.3) { doRecruitOfficer(g, c.n, o.id, wild[0].id); continue; }
    const hidden = officersAt(g, c.n).some(x => x.fac === null && !x.found);
    if (hidden && r < 0.22) { doSearch(g, c.n, o.id); continue; }
    // 부대를 안 거느린 무장에게 병력을 준다
    if ((!o.corps || o.corps.n === 0) && troopTotal(c) > 1500 && r < 0.55) {
      const unit = ['보병', '보병', '기병', '궁병'][Math.floor(rndOf(g) * 4)];
      const want = Math.min(troopCap(o), c.troops[unit]);
      if (want >= 500) { doAssign(g, c.n, o.id, unit, Math.floor(want / 100) * 100); }
    }
    doDevelop(g, c.n, o.id, r < 0.5 ? '농업' : '상업');
  }
  // 출병 판단
  for (const n of mine) {
    const c = g.castles[n];
    if (garrisonTotal(g, n) < castleDef(n).garr * 0.5) continue;
    const targets = castleDef(n).adj.filter(t => {
      const o = g.castles[t].fac;
      if (o === fid) return false;
      if (relOf(g, fid, o) === 'ally') return false;
      if ((g.factions[fid].truce[o] || 0) > 0) return false;
      return true;
    });
    if (!targets.length) continue;
    const t = targets[Math.floor(rndOf(g) * targets.length)];
    // 실제로 내보낼 8할로 견준다. 전군 기준으로 재면 늘 이길 것 같아 보인다.
    const mine_p = castlePower(g, c) * 0.8;
    const his_p = castlePower(g, g.castles[t]) * 1.28 + g.castles[t].wall * 0.15;
    if (mine_p > his_p * (1.15 + (1 - aggr) * 0.45) && rndOf(g) < 0.35 + aggr * 0.45) {
      // ★사람 세력의 거점을 칠 때는 바로 판정하지 않고 쌓아 둔다 — 화면이 요격·농성을 묻는다.
      //   아무도 묻지 않으면(자가검증·자동 진행) nextTurn 이 자동 판정한다.
      if (g.holdAttacks && g.castles[t].fac === g.player) {
        g.incoming = g.incoming || [];
        if (!g.incoming.some(x => x.to === t)) g.incoming.push({ from: n, to: t, af: fid, ratio: 0.8 });
      } else doAttack(g, n, t, 0.8);
    }
  }
}

// AI 외교 — 이웃만 상대한다
function aiDiplomacy(g, fid) {
  const me = g.factions[fid];
  const mine = factionCastles(g, fid).length;
  for (const o of neighbors(g, fid)) {
    if (o === g.player && rndOf(g) < 0.5) continue;      // 사람에게는 덜 들이댄다
    const his = factionCastles(g, o).length;
    const r = relOf(g, fid, o);
    if (r === 'war') {
      // 밀리고 있으면 강화를 청한다
      if (his > mine * 1.5 && rndOf(g) < 0.25) {
        doPeace(g, fid, o, Math.min(g.castles[me.cap].gold, 400));
      }
    } else if (r === 'peace') {
      if (attOf(g, o, fid) > 70 && rndOf(g) < 0.10) doAlly(g, fid, o);
      else if (attOf(g, fid, o) < 30 && mine > his * 1.4 &&
               (me.truce[o] || 0) === 0 && rndOf(g) < me.aggr * 0.12) {
        doDeclareWar(g, fid, o);
      } else if (attOf(g, fid, o) < 45 && g.castles[me.cap].gold > 1500 && rndOf(g) < 0.08) {
        doGift(g, fid, o, 300);
      }
    } else if (r === 'ally') {
      // 동맹이 약해지면 저버리는 세력도 있다
      if (his < mine * 0.4 && me.aggr > 0.7 && rndOf(g) < 0.05) doBreakAlly(g, fid, o);
    }
  }
}

function runAllAI(g) {
  for (const f of Object.values(g.factions)) {
    if (!f.alive || f.id === g.player) continue;
    aiDiplomacy(g, f.id);
    aiTurn(g, f.id);
  }
  runDelegated(g);
}

// ──────────────────────────────────────────── 저장
function saveState(g) {
  return JSON.stringify({
    v: 1, seed: g.seed, turn: g.turn, year: g.year, month: g.month,
    player: g.player, over: g.over, rndState: g.rndState,
    castles: g.castles, factions: g.factions, officers: g.officers,
    done: g.done || {}, log: g.log.slice(-120),
  });
}
function loadState(s) {
  const d = typeof s === 'string' ? JSON.parse(s) : s;
  if (!d || d.v !== 1) return null;
  return d;
}

  window.SamhanEngine = {
    SIM, newGame, nextTurn, endMonth, aiTurn, runAllAI,
    doDevelop, doRecruit, doTrain, doMove, doAttack, doRecruitOfficer,
    doAssign, doDisband, doReward, doSearch, corpsAt, garrisonTotal, wildAt,
    doDeclareWar, doPeace, doAlly, doBreakAlly, doGift, runEvents, EVENTS,
    relOf, atWar, attOf, addAtt, neighbors,
    income, harvest, draftCap, upkeep, foodUse, power, castlePower, troopTotal,
    castleDef, officerDef, officersAt, factionCastles, factionOfficers,
    bestOfficer, troopCap, expNeed, saveState, loadState, rndOf, costOf, ORDERS,
    reachable, fortifyCost, fortifyRange, doFortify, doTransport,
    grainPrice, sellPrice, tradeCap, tradeLeft, doTrade,
    POLICIES, policyOf, setPolicy, runDelegated,
    devRange, trainGain, searchChance, hireChance, idleAt, idleCastles, advise,
    LORD_ID, lordIdOf, killOff, isLord, ranksOf, RANK_ORDER, nearestOwned, purseOf, envoyBonus, settleFallen,
    captivesOf, hireCaptiveChance, doCaptive, processCaptives,
    PLOTS, plotTargets, plotChance, doPlot, defWit,
    peaceChance, allyChance, giftGain, jointTargets, jointSources, jointChance, doJoint, JOINT_COST,
    powerOf, demandRatio, demandChance, doDemand, DEMAND_COST,
    incomingValid, incomingForce, defendAuto, resolveIncoming,
  };
})();
