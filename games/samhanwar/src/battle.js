// 삼한통일전 — 전술 전투. 영걸전·조조전 문법: 장수 한 명이 한 칸을 차지한다.
//
// ★핵심 규약: 유닛의 hp 가 곧 병력 수다. 전투에서 깎인 만큼이 그대로 전략 화면의
//   부대·주둔군에 남는다(applyResult). 전술과 전략 사이에 환산 층이 없다.
// ★engine.js 와 마찬가지로 IIFE 로 감싼다 — 클래식 스크립트의 최상위 선언은 전역이 되고,
//   ui 쪽 이름과 부딪히면 조용히 덮어쓴다(1단계 doAttack 사고).
'use strict';
(function () {

const W = 20, H = 14;
const MAX_TURN = 30;
const MAX_SIDE = 12;      // 한쪽 최대 부대 수
// ★피해가 '때리는 쪽 병력'에 비례하므로 덩치가 크게 다르면 한 방에 지워진다.
//   수비 주둔군을 이 크기로 쪼개 서로 비슷한 부대끼리 붙게 한다.
const CHUNK = 4000;

// 지형 — 이동비, 방어보정, 기병 진입 여부
const TERR = {
  // ★지형 보정을 키웠다. 1.2~1.5 로는 전력비가 결과를 그대로 정해서 자리 잡기가 무의미했다
  //   (실측 승률: 0.7배 0% → 1.0배 80%). 좋은 자리를 잡으면 수를 뒤집을 수 있어야 한다.
  0: { nm: '평지', mv: 1, def: 1.00, horse: true },
  1: { nm: '숲',   mv: 2, def: 1.38, horse: true, horseMv: 3, hide: true },
  2: { nm: '산',   mv: 3, def: 1.75, horse: false },
  3: { nm: '하천', mv: 3, def: 0.72, horse: true },
  4: { nm: '성벽', mv: 99, def: 1.85, horse: false, wall: true },
  5: { nm: '성문', mv: 2, def: 1.45, horse: true, gate: true },
};

const SKILLS = {
  화계: { nm: '화계', need: 1, rng: 3, kind: 'attack',
        why: '숲과 평지에서, 건조기(3~5월·9~11월)에만' },
  혼란: { nm: '혼란', need: 1, rng: 2, kind: 'debuff' },
  매복: { nm: '매복', need: 1, rng: 0, kind: 'self', why: '숲에서만' },
  응급: { nm: '응급처치', need: 1, rng: 2, kind: 'heal' },
};

function rnd(b) {
  b.seed = (b.seed + 0x6D2B79F5) | 0;
  let t = Math.imul(b.seed ^ (b.seed >>> 15), 1 | b.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ──────────────────────────────────────── 지형 생성
function makeMap(b, def) {
  const m = new Array(W * H).fill(0);
  const put = (x, y, v) => { if (x >= 0 && x < W && y >= 0 && y < H) m[y * W + x] = v; };

  // 수비측 성은 위쪽. 규모가 클수록 성벽이 두껍다.
  const wallY = def.sz === '대' ? 3 : def.sz === '중' ? 2 : 2;
  const halfW = def.sz === '대' ? 8 : def.sz === '중' ? 6 : 5;
  const cx = Math.floor(W / 2);
  for (let y = 0; y < wallY; y++) {
    for (let x = cx - halfW; x <= cx + halfW; x++) put(x, y, 4);
  }
  // 성문 하나
  const gx = cx + Math.floor((rnd(b) - 0.5) * 4);
  put(gx, wallY - 1, 5);
  b.gate = { x: gx, y: wallY - 1 };

  // 숲·산·하천을 흩는다
  const blobs = 5 + Math.floor(rnd(b) * 4);
  for (let i = 0; i < blobs; i++) {
    const t = rnd(b) < 0.55 ? 1 : rnd(b) < 0.6 ? 2 : 3;
    const bx = 1 + Math.floor(rnd(b) * (W - 2));
    const by = wallY + 1 + Math.floor(rnd(b) * (H - wallY - 3));
    const r = 1 + Math.floor(rnd(b) * 2);
    for (let y = by - r; y <= by + r; y++) {
      for (let x = bx - r; x <= bx + r; x++) {
        if (Math.abs(x - bx) + Math.abs(y - by) > r) continue;
        if (m[y * W + x] === 0 && rnd(b) < 0.75) put(x, y, t);
      }
    }
  }
  // 하천은 가로로 한 줄 흐르기도 한다
  if (rnd(b) < 0.4) {
    const ry = Math.floor(H * 0.55 + rnd(b) * 2);
    let x = 0;
    while (x < W) {
      put(x, ry + (rnd(b) < 0.3 ? 1 : 0), 3);
      x += 1;
    }
    // 건널 자리 두 곳
    for (let k = 0; k < 2; k++) put(2 + Math.floor(rnd(b) * (W - 4)), ry, 0);
  }
  return m;
}

// ──────────────────────────────────────── 전투 개시
// opts.human — 사람이 쥔 편('A' 공격 · 'D' 수비). 방어전이면 'D'.
// opts.atkRatio — 공격측을 무장 부대 대신 출발 거점 주둔군의 이 몫으로 꾸린다(AI 의 침공).
function start(g, from, to, offIds, En, opts) {
  const opt = opts || {};
  const a = g.castles[from], d = g.castles[to];
  const defDef = En.castleDef(to);
  const b = {
    seed: (g.rndState ^ (from * 733) ^ (to * 977)) | 0,
    from, to, turn: 1, phase: 'A', over: null, human: opt.human === 'D' ? 'D' : 'A',
    month: g.month, year: g.year,
    units: [], log: [], W, H,
  };
  b.map = makeMap(b, defDef);
  const wallY = defDef.sz === '대' ? 3 : 2;

  let uid = 0;
  const add = (side, offId, unit, hp, x, y, gar) => {
    const o = offId ? g.officers[offId] : null;
    const od = offId ? En.officerDef(offId) : null;
    b.units.push({
      id: ++uid, side, off: offId,
      nm: od ? od.nm : (side === 'A' ? '아군 분견대' : '주둔군'),
      unit, hp: Math.max(1, Math.round(hp)), maxHp: Math.max(1, Math.round(hp)),
      x, y, mu: o ? o.mu : 45, ji: o ? o.ji : 40, jg: o ? o.jg : 40,
      ki: o ? kiOf(o.ji) : 0,
      train: side === 'A' ? a.train : d.train,
      morale: side === 'A' ? a.morale : d.morale,
      moved: false, acted: false, confused: 0, hidden: false, hurt: 0, ambush: false,
      gar: !!gar,            // 주둔군에서 쪼갠 부대 — 결과를 무장 부대가 아니라 주둔군에 되돌린다
    });
  };

  const spread = (n) => {
    const xs = [];
    const step = Math.max(1, Math.floor(W / (n + 1)));
    for (let i = 1; i <= n; i++) xs.push(Math.min(W - 1, i * step));
    return xs;
  };
  const chunkUp = (troops, ratio, room) => {
    const out = [];
    for (const u of ['보병', '기병', '궁병']) {
      let n = Math.round(troops[u] * ratio);
      while (n > 0 && out.length < room) { const take = Math.min(n, CHUNK); out.push({ unit: u, n: take }); n -= take; }
      if (n > 0) { const last = out.filter(c => c.unit === u).pop() || out[out.length - 1]; if (last) last.n += n; }
    }
    return out;
  };
  const leadFor = (n, fac, key, used) => En.officersAt(g, n)
    .filter(o => o.fac === fac && !used.has(o.id)).sort((x, y) => y[key] - x[key])[0] || null;

  // 공격측 — 아래 두 줄에 편다
  if (opt.atkRatio) {
    const ch = chunkUp(a.troops, opt.atkRatio, MAX_SIDE);
    if (!ch.length) return null;
    const axs = spread(ch.length), used = new Set();
    ch.forEach((c, i) => {
      const lead = leadFor(from, a.fac, c.unit === '궁병' ? 'ji' : 'mu', used);
      if (lead) used.add(lead.id);
      add('A', lead ? lead.id : null, c.unit, c.n, axs[i], H - 1 - (i % 2), true);
    });
  } else {
    const atk = (offIds || []).map(id => g.officers[id])
      .filter(o => o && o.corps && o.corps.n > 0).slice(0, MAX_SIDE);
    if (!atk.length) return null;
    const axs = spread(atk.length);
    atk.forEach((o, i) => add('A', o.id, o.corps.unit, o.corps.n, axs[i], H - 1 - (i % 2)));
  }

  // 수비측 — 부대를 가진 무장은 그대로 한 칸, 주둔군은 비슷한 크기로 쪼갠다
  const dOffs = En.corpsAt(g, to, d.fac).slice(0, MAX_SIDE);
  const chunks = [];
  for (const u of ['보병', '기병', '궁병']) {
    let n = d.troops[u];
    while (n > 0 && chunks.length + dOffs.length < MAX_SIDE) {
      const take = Math.min(n, CHUNK);
      chunks.push({ unit: u, n: take });
      n -= take;
    }
    // 자리가 모자라면 남은 병력을 마지막 같은 병종 부대에 얹는다
    if (n > 0) {
      const last = chunks.filter(c => c.unit === u).pop() || chunks[chunks.length - 1];
      if (last) last.n += n;
    }
  }
  const dxs = spread(Math.max(1, chunks.length + dOffs.length));
  let di = 0;
  const usedLead = new Set(dOffs.map(o => o.id));
  for (const ch of chunks) {
    const lead = En.bestOfficer(g, to, ch.unit === '궁병' ? 'ji' : 'mu');
    const useLead = lead && !usedLead.has(lead.id);
    if (useLead) usedLead.add(lead.id);
    add('D', useLead ? lead.id : null, ch.unit, ch.n,
        dxs[di++], wallY + (ch.unit === '궁병' ? -1 : 1), true);
  }
  for (const o of dOffs) add('D', o.id, o.corps.unit, o.corps.n, dxs[di++], wallY + 1);
  // 궁병은 성벽 위로 올린다(수비 보정 +50%)
  for (const u of b.units) {
    if (u.side === 'D' && u.unit === '궁병') {
      const wy = wallY - 1;
      if (b.map[wy * W + u.x] === 4) u.y = wy;
    }
  }
  // ★성문을 비워 두면 기병이 곧장 올라와 3턴 만에 끝난다(09-13 방어전 추적: 수비가 성벽 앞에만 서 있었다).
  //   병력이 가장 많은 보병(없으면 기병) 부대를 성문 칸에 세운다.
  const gateHolder = b.units.filter(u => u.side === 'D' && u.unit !== '궁병')
    .sort((x, y) => (y.unit === '보병') - (x.unit === '보병') || y.hp - x.hp)[0];
  if (gateHolder) {
    const occ = b.units.find(u => u !== gateHolder && u.x === b.gate.x && u.y === b.gate.y);
    if (occ) { occ.y = Math.min(H - 1, occ.y + 2); }
    gateHolder.x = b.gate.x; gateHolder.y = b.gate.y;
    b.units.splice(b.units.indexOf(gateHolder), 1);
    b.units.unshift(gateHolder);            // 겹침 정리에서 먼저 자리를 차지하게
  }
  // 겹침 정리
  const seen = new Set();
  for (const u of b.units) {
    let guard = 0;
    while ((seen.has(u.y * W + u.x) || !passable(b, u, u.x, u.y)) && guard++ < 200) {
      u.x = (u.x + 1) % W;
      if (u.x === 0) u.y = Math.min(H - 1, Math.max(0, u.y + (u.side === 'A' ? -1 : 1)));
    }
    seen.add(u.y * W + u.x);
  }
  b.log.push({ k: 'start', a: b.units.filter(u => u.side === 'A').length,
               d: b.units.filter(u => u.side === 'D').length });
  return b;
}

// ──────────────────────────────────────── 판·이동
const at = (b, x, y) => b.units.find(u => u.hp > 0 && u.x === x && u.y === y);
const terrOf = (b, x, y) => TERR[b.map[y * W + x]];
function passable(b, u, x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const t = terrOf(b, x, y);
  if (t.wall) return u.unit === '궁병';       // 성벽엔 궁병만 오른다
  if (!t.horse && u.unit === '기병') return false;
  return true;
}
function moveCost(b, u, x, y) {
  const t = terrOf(b, x, y);
  if (t.wall) return u.unit === '궁병' ? 3 : 99;
  if (u.unit === '기병' && t.horseMv) return t.horseMv;
  return t.mv;
}

function moveRange(b, u) {
  const mv = SIM_MV(u);
  const best = new Map([[u.y * W + u.x, 0]]);
  const q = [[u.x, u.y, 0]];
  while (q.length) {
    const [x, y, c] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!passable(b, u, nx, ny)) continue;
      const other = at(b, nx, ny);
      if (other && other.side !== u.side) continue;      // 적은 뚫지 못한다
      const nc = c + moveCost(b, u, nx, ny);
      if (nc > mv) continue;
      const k = ny * W + nx;
      if (best.has(k) && best.get(k) <= nc) continue;
      best.set(k, nc);
      q.push([nx, ny, nc]);
    }
  }
  // 아군이 서 있는 칸은 지나갈 수는 있어도 멈추지 못한다
  const out = [];
  for (const [k] of best) {
    const x = k % W, y = Math.floor(k / W);
    if (at(b, x, y) && !(x === u.x && y === u.y)) continue;
    out.push({ x, y });
  }
  return out;
}
// ★병종 수치는 엔진 SIM.UNITS 한 곳에서 읽는다 — 전투와 정보 창(병종 정보)이 같은 수를 쓰게(09-14).
//   예전엔 이 파일에 같은 값이 따로 적혀 있었다.
function unitSpec(unit) { const U = window.SamhanEngine.SIM.UNITS; return U[unit] || U.보병; }
function kiOf(ji) { return Math.floor(ji / 20); }
function SIM_MV(u) {
  const base = unitSpec(u.unit).mv;
  return u.hurt > 0 ? Math.max(2, base - 2) : base;
}
function rangeOf(u) { return unitSpec(u.unit).rng; }
const dist = (a, c) => Math.abs(a.x - c.x) + Math.abs(a.y - c.y);

function targetsFor(b, u) {
  return b.units.filter(v => v.hp > 0 && v.side !== u.side && !v.hidden &&
                             dist(u, v) <= rangeOf(u));
}

// ──────────────────────────────────────── 전투 계산
function atkStat(u) {
  const A = unitSpec(u.unit).atk;
  const hurt = u.hurt > 0 ? 0.8 : 1;
  return A * (1 + u.mu / 200) * (0.4 + u.train / 167) * (0.6 + u.morale / 250) * hurt;
}
function defStat(b, u) {
  // 수비측은 농성 이점을 받는다 — 성벽 위가 아니어도 미리 자리를 잡고 기다린다
  const siege = u.side === 'D' ? 1.15 : 1;
  return baseDef(u) * terrOf(b, u.x, u.y).def * siege;
}
function baseDef(u) { return unitSpec(u.unit).def * (1 + u.mu / 300); }
// 정보 창(부대 일람) — 평지에서 칠 때의 값. 전투와 같은 함수를 쓴다.
function unitStats(u) { return { atk: atkStat(u), def: baseDef(u), mv: SIM_MV(u), rng: rangeOf(u), ki: kiOf(u.ji || 0) }; }

function damage(b, a, d) {
  let ratio = atkStat(a) / Math.max(1, defStat(b, d));
  ratio = Math.max(0.35, Math.min(2.5, ratio));
  // ★피해를 '현재 병력'에만 비례시키면 앞선 쪽이 눈덩이처럼 굴러 전력비가 결과를 결정한다
  //   (실측: 0.7배 승률 7% → 1.0배 93%). 손실을 입어도 대열은 버티므로 최대 병력을 섞는다.
  const eff = a.hp * 0.6 + a.maxHp * 0.4;
  let dmg = eff * 0.20 * ratio;
  if (unitSpec(a.unit).beats === d.unit) dmg *= window.SamhanEngine.SIM.COUNTER;
  if (a.ambush) dmg *= 2;
  dmg *= 0.9 + rnd(b) * 0.2;
  return Math.max(1, Math.round(dmg));
}

function attack(b, uid, tid) {
  const u = b.units.find(x => x.id === uid), t = b.units.find(x => x.id === tid);
  if (!u || !t || u.hp <= 0 || t.hp <= 0) return { ok: false, why: '없는 부대' };
  if (u.side !== b.phase) return { ok: false, why: '이 편의 차례가 아닙니다' };
  if (u.acted) return { ok: false, why: '이미 행동했습니다' };
  if (u.confused > 0) return { ok: false, why: '혼란 상태입니다' };
  if (dist(u, t) > rangeOf(u)) return { ok: false, why: '사거리 밖입니다' };

  const d1 = damage(b, u, t);
  t.hp = Math.max(0, t.hp - d1);
  u.ambush = false; u.hidden = false;
  const rec = { k: 'hit', a: u.id, d: t.id, dmg: d1, back: 0 };

  // 반격 — 사거리가 닿을 때만. 궁병이 2칸에서 쏘면 근접은 반격하지 못한다.
  if (t.hp > 0 && t.confused <= 0 && dist(u, t) <= rangeOf(t)) {
    const d2 = Math.round(damage(b, t, u) * 0.7);
    u.hp = Math.max(0, u.hp - d2);
    rec.back = d2;
  }
  u.moved = true; u.acted = true;
  if (t.hp <= 0) b.log.push({ k: 'down', id: t.id, nm: t.nm });
  b.log.push(rec);
  check(b);
  return { ok: true, dmg: d1, back: rec.back, dead: t.hp <= 0 };
}

// 일기토
function duel(b, uid, tid) {
  const u = b.units.find(x => x.id === uid), t = b.units.find(x => x.id === tid);
  if (!u || !t) return { ok: false, why: '없는 부대' };
  if (!u.off || !t.off) return { ok: false, why: '장수가 없는 부대와는 겨루지 못합니다' };
  if (u.acted) return { ok: false, why: '이미 행동했습니다' };
  if (dist(u, t) !== 1) return { ok: false, why: '맞붙어야 도발할 수 있습니다' };
  u.moved = true; u.acted = true;
  // 무력이 크게 밀리면 응하지 않는다
  if (t.mu + 22 < u.mu && rnd(b) < 0.7) {
    b.log.push({ k: 'duelno', a: u.id, d: t.id });
    return { ok: true, accepted: false };
  }
  const roll = (x) => x.mu * (0.75 + rnd(b) * 0.5);
  const ru = roll(u), rt = roll(t);
  const win = ru >= rt;
  const [W_, L] = win ? [u, t] : [t, u];
  const cut = Math.round(L.hp * 0.25);
  L.hp = Math.max(0, L.hp - cut);
  L.hurt = 3;
  L.morale = Math.max(5, L.morale - 30);
  b.log.push({ k: 'duel', win: W_.id, lose: L.id, cut });
  check(b);
  return { ok: true, accepted: true, winner: W_.id, loser: L.id, cut };
}

// 계략
function skill(b, uid, name, tx, ty) {
  const u = b.units.find(x => x.id === uid);
  const S = SKILLS[name];
  if (!u || !S) return { ok: false, why: '없는 계략' };
  if (u.side !== b.phase) return { ok: false, why: '이 편의 차례가 아닙니다' };
  if (u.acted) return { ok: false, why: '이미 행동했습니다' };
  if (u.confused > 0) return { ok: false, why: '혼란 상태입니다' };
  if (u.ki < S.need) return { ok: false, why: '계략을 더 쓸 수 없습니다 (지력 ÷ 20회)' };

  if (name === '매복') {
    if (!terrOf(b, u.x, u.y).hide) return { ok: false, why: '숲에서만 숨을 수 있습니다' };
    u.hidden = true; u.ambush = true; u.ki -= 1; u.moved = true; u.acted = true;
    b.log.push({ k: 'skill', nm: '매복', a: u.id });
    return { ok: true, hidden: true };
  }

  const t = at(b, tx, ty);
  if (!t) return { ok: false, why: '그 자리에 부대가 없습니다' };
  if (dist(u, t) > S.rng) return { ok: false, why: '사거리 밖입니다' };

  if (name === '화계') {
    const dry = [3, 4, 5, 9, 10, 11].includes(b.month);
    if (!dry) return { ok: false, why: '건조기가 아닙니다 (3~5월·9~11월)' };
    const tt = b.map[t.y * W + t.x];
    if (tt === 3) return { ok: false, why: '물 위에는 불이 붙지 않습니다' };
    if (t.side === u.side) return { ok: false, why: '아군에게는 쓰지 않습니다' };
    const base = Math.round(t.hp * (u.ji / 300) * (tt === 1 ? 1.5 : 1));
    t.hp = Math.max(0, t.hp - base);
    let spread = 0;
    for (const v of b.units) {
      if (v.hp <= 0 || v.id === t.id || dist(v, t) !== 1) continue;
      const c = Math.round(v.hp * (u.ji / 600));
      v.hp = Math.max(0, v.hp - c); spread += c;
    }
    u.ki -= 1; u.moved = true; u.acted = true;
    b.log.push({ k: 'skill', nm: '화계', a: u.id, d: t.id, dmg: base, spread });
    check(b);
    return { ok: true, dmg: base, spread };
  }
  if (name === '혼란') {
    if (t.side === u.side) return { ok: false, why: '아군에게는 쓰지 않습니다' };
    const p = Math.max(0.05, Math.min(0.95, (u.ji - t.ji + 60) / 100));
    u.ki -= 1; u.moved = true; u.acted = true;
    if (rnd(b) < p) {
      t.confused = 2;
      b.log.push({ k: 'skill', nm: '혼란', a: u.id, d: t.id, hit: true });
      return { ok: true, hit: true };
    }
    b.log.push({ k: 'skill', nm: '혼란', a: u.id, d: t.id, hit: false });
    return { ok: true, hit: false };
  }
  if (name === '응급') {
    if (t.side !== u.side) return { ok: false, why: '아군에게만 씁니다' };
    const heal = Math.round(t.maxHp * (u.ji / 400));
    const before = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + heal);
    u.ki -= 1; u.moved = true; u.acted = true;
    b.log.push({ k: 'skill', nm: '응급처치', a: u.id, d: t.id, heal: t.hp - before });
    return { ok: true, heal: t.hp - before };
  }
  return { ok: false, why: '없는 계략' };
}

function move(b, uid, x, y) {
  const u = b.units.find(v => v.id === uid);
  if (!u || u.hp <= 0) return { ok: false, why: '없는 부대' };
  if (u.side !== b.phase) return { ok: false, why: '이 편의 차례가 아닙니다' };
  if (u.moved) return { ok: false, why: '이미 움직였습니다' };
  if (u.confused > 0) return { ok: false, why: '혼란 상태입니다' };
  if (!moveRange(b, u).some(p => p.x === x && p.y === y)) return { ok: false, why: '갈 수 없는 자리입니다' };
  u.x = x; u.y = y; u.moved = true;
  if (!terrOf(b, x, y).hide) u.hidden = false;
  return { ok: true };
}

function wait(b, uid) {
  const u = b.units.find(v => v.id === uid);
  if (!u) return { ok: false, why: '없는 부대' };
  u.moved = true; u.acted = true;
  return { ok: true };
}

// ──────────────────────────────────────── 페이즈
function sideUnits(b, side) { return b.units.filter(u => u.hp > 0 && u.side === side); }
function phaseDone(b) { return sideUnits(b, b.phase).every(u => u.acted); }

function endPhase(b) {
  if (b.over) return b;
  const next = b.phase === 'A' ? 'D' : 'A';
  if (next === 'A') {
    b.turn++;
    if (b.turn > MAX_TURN) { finish(b, 'D', '기한 초과 — 공격측이 물러납니다'); return b; }
  }
  b.phase = next;
  for (const u of sideUnits(b, next)) {
    u.moved = false; u.acted = false;
    if (u.confused > 0) { u.confused--; u.moved = true; u.acted = true; }
    if (u.hurt > 0) u.hurt--;
  }
  check(b);
  return b;
}

function check(b) {
  if (b.over) return;
  if (!sideUnits(b, 'D').length) return finish(b, 'A', '수비군이 무너졌습니다');
  if (!sideUnits(b, 'A').length) return finish(b, 'D', '공격군이 무너졌습니다');
  const gate = at(b, b.gate.x, b.gate.y);
  if (gate && gate.side === 'A') return finish(b, 'A', '성문을 점거했습니다');
}
function finish(b, winner, why) {
  b.over = { winner, why };
  b.log.push({ k: 'end', winner, why });
}

// ──────────────────────────────────────── 위임 — 사람 편까지 AI 가 끝까지 둔다(09-14)
// ★수동 전투 도중에 넘겨받아도 된다 — 이미 행동한 부대는 acted 로 남아 aiStep 이 건너뛴다.
//   30턴 상한이 있어 반드시 끝나지만, 혹시 모를 교착에 대비해 걸음 수 상한을 따로 둔다.
function autoRun(b, cap) {
  const tally = { steps: 0, melee: 0, arrows: 0, fire: 0, confuse: 0 };
  const limit = cap || 6000;
  b.delegated = true;
  while (!b.over && tally.steps < limit) {
    const r = aiStep(b);
    tally.steps++;
    if (r.act === 'attack') {
      const u = b.units.find(v => v.id === r.unit);
      if (u && u.unit === '궁병') tally.arrows++; else tally.melee++;
    } else if (r.act === '화계') tally.fire++;
    else if (r.act === '혼란') tally.confuse++;
  }
  if (!b.over) finish(b, 'D', '기한 초과 — 공격측이 물러납니다');
  return tally;
}

// ──────────────────────────────────────── 적 페이즈 AI
function aiStep(b) {
  // 한 부대만 움직인다. 화면이 한 걸음씩 보여줄 수 있게.
  const mine = sideUnits(b, b.phase).filter(u => !u.acted);
  if (!mine.length) { endPhase(b); return { done: true }; }
  const u = mine[0];
  const foes = b.units.filter(v => v.hp > 0 && v.side !== u.side && !v.hidden);
  if (!foes.length) { wait(b, u.id); return { unit: u.id, act: 'wait' }; }

  // 계략을 쓸 만하면 먼저
  if (u.ki > 0 && u.ji >= 70 && rnd(b) < 0.45) {
    const near = foes.filter(v => dist(u, v) <= 3).sort((a, c) => c.hp - a.hp)[0];
    if (near) {
      const dry = [3, 4, 5, 9, 10, 11].includes(b.month);
      if (dry && dist(u, near) <= 3 && b.map[near.y * W + near.x] !== 3) {
        const r = skill(b, u.id, '화계', near.x, near.y);
        if (r.ok) return { unit: u.id, act: '화계', target: near.id };
      }
      if (dist(u, near) <= 2) {
        const r = skill(b, u.id, '혼란', near.x, near.y);
        if (r.ok) return { unit: u.id, act: '혼란', target: near.id };
      }
    }
  }

  // ★수비측은 성문을 지킨다 — 성문 위의 부대는 떠나지 않고, 성문이 비었는데 적이 다가오면 채운다
  if (u.side === 'D') {
    const onGate = u.x === b.gate.x && u.y === b.gate.y;
    if (onGate) {
      const h = targetsFor(b, u).sort((a, c) => score(b, u, c) - score(b, u, a))[0];
      if (h) { attack(b, u.id, h.id); return { unit: u.id, act: 'attack', target: h.id }; }
      wait(b, u.id); return { unit: u.id, act: 'hold' };
    }
    if (u.unit !== '궁병' && !at(b, b.gate.x, b.gate.y) && foes.some(v => dist(v, b.gate) <= 9) &&
        moveRange(b, u).some(c => c.x === b.gate.x && c.y === b.gate.y)) {
      move(b, u.id, b.gate.x, b.gate.y);
      const h = targetsFor(b, u).sort((a, c) => score(b, u, c) - score(b, u, a))[0];
      if (h) { attack(b, u.id, h.id); return { unit: u.id, act: 'attack', target: h.id, moved: true }; }
      u.acted = true; return { unit: u.id, act: 'gate' };
    }
  }

  // 때릴 수 있으면 때린다 — 상성 우위와 약한 적을 고른다
  let hit = targetsFor(b, u).sort((a, c) => score(b, u, c) - score(b, u, a))[0];
  if (hit) { attack(b, u.id, hit.id); return { unit: u.id, act: 'attack', target: hit.id }; }

  // 아니면 가장 가까운 적 쪽으로 붙는다
  const goal = foes.sort((a, c) => dist(u, a) - dist(u, c))[0];
  const cells = moveRange(b, u);
  let best = null, bestD = 1e9;
  for (const c of cells) {
    const d = Math.abs(c.x - goal.x) + Math.abs(c.y - goal.y);
    const t = terrOf(b, c.x, c.y);
    const score2 = d - (t.def - 1) * 5;      // 방어 좋은 칸을 뚜렷하게 선호
    if (score2 < bestD) { bestD = score2; best = c; }
  }
  if (best && (best.x !== u.x || best.y !== u.y)) move(b, u.id, best.x, best.y);
  else u.moved = true;
  hit = targetsFor(b, u).sort((a, c) => score(b, u, c) - score(b, u, a))[0];
  if (hit) { attack(b, u.id, hit.id); return { unit: u.id, act: 'attack', target: hit.id, moved: true }; }
  u.acted = true;
  return { unit: u.id, act: 'move' };
}
function score(b, u, t) {
  let s = damage(b, u, t) / Math.max(1, t.hp);
  if (unitSpec(u.unit).beats === t.unit) s += 0.3;
  if (t.off) s += 0.15;
  return s;
}

// ──────────────────────────────────────── 결과를 전략에 되돌린다
function applyResult(g, b, En) {
  const a = g.castles[b.from], d = g.castles[b.to];
  const win = b.over && b.over.winner === 'A';
  const atkFac = a.fac, defFac = d.fac;
  let deadA = 0, deadD = 0;

  for (const u of b.units) {
    const lost = u.maxHp - u.hp;
    if (u.side === 'A') {
      deadA += lost;
      if (u.off && u.gar) { const o = g.officers[u.off]; if (o) o.exp += win ? 50 : 20; }
      else if (u.off) {
        const o = g.officers[u.off];
        if (o) {
          o.corps = u.hp > 0 ? { unit: u.unit, n: u.hp } : null;
          o.exp += win ? 70 : 30;
          o.loy = Math.max(0, Math.min(100, o.loy + (win ? 2 : -3)));
          if (u.hp <= 0) { o.loy = Math.max(0, o.loy - 5); }
        }
      }
    } else {
      deadD += lost;
      if (u.off) {
        const o = g.officers[u.off];
        if (o && !u.gar && o.corps) o.corps = u.hp > 0 ? { unit: u.unit, n: u.hp } : null;
        if (o) o.exp += win ? 20 : 50;
      }
      // 주둔군에서 쪼갠 부대는 아래에서 병종별로 합산해 되돌린다
    }
  }
  // 주둔군에서 쪼갠 부대(무장 부대가 아닌 것)의 생존자를 병종별로 합산
  const back = { 보병: 0, 기병: 0, 궁병: 0 };
  const sentA = { 보병: 0, 기병: 0, 궁병: 0 }, survA = { 보병: 0, 기병: 0, 궁병: 0 };
  for (const u of b.units) {
    if (u.side === 'D' && u.gar) back[u.unit] += Math.max(0, u.hp);
    if (u.side === 'A' && u.gar) { sentA[u.unit] += u.maxHp; survA[u.unit] += Math.max(0, u.hp); }
  }
  for (const k of Object.keys(back)) d.troops[k] = back[k];
  // 주둔군에서 나간 공격 부대 — 떠난 만큼 빼고, 지면 살아남은 이가 돌아온다
  for (const k of Object.keys(sentA)) a.troops[k] = Math.max(0, a.troops[k] - sentA[k] + (win ? 0 : survA[k]));

  a.hosp += Math.round(deadA * 0.45);
  d.hosp += Math.round(deadD * 0.45);

  let captured = false;
  if (win) {
    captured = true;
    const old = d.fac;
    d.fac = a.fac;
    d.sec = Math.max(10, d.sec - 25);
    d.gold = Math.round(d.gold * 0.7);
    for (const u of Object.keys(d.troops)) d.troops[u] = 0;
    d.wall = Math.round(En.castleDef(b.to).wall * 0.4);
    d.train = a.train;
    d.morale = Math.min(100, a.morale + 8);
    // 살아남은 공격 부대가 성으로 들어간다 — 무장 부대는 무장째, 주둔군 부대는 병사만
    let room = En.castleDef(b.to).garr, leadMu = 0;
    for (const u of b.units) {
      if (u.side !== 'A' || u.hp <= 0) continue;
      if (u.off) leadMu = Math.max(leadMu, u.mu);
      if (u.off && !u.gar) g.officers[u.off].loc = b.to;
    }
    for (const k of Object.keys(survA)) { const m = Math.min(survA[k], room); d.troops[k] += m; room -= m; }
    // 성에 있던 무장은 사로잡히거나 달아난다
    En.settleFallen(g, b.to, old, a.fac, leadMu || 60);
  } else {
    a.morale = Math.max(10, a.morale - 12);
  }
  g.log.push({ t: g.turn, k: 'battle', from: b.from, to: b.to, win, captured, deadA, deadD,
               af: atkFac, df: defFac, tactical: true });
  return { win, captured, deadA, deadD };
}

window.SamhanBattle = {
  W, H, MAX_TURN, MAX_SIDE, CHUNK, TERR, SKILLS,
  start, move, attack, duel, skill, wait, endPhase, aiStep, autoRun, phaseDone,
  moveRange, targetsFor, sideUnits, applyResult, terrOf, at, dist, rangeOf, damage, unitSpec, unitStats,
};
})();
