// 삼한통일전 — 전투판 쿼터뷰(09-14). 사용자 요청: "코에이 삼국지6 이상 수준으로".
// battleui.js 는 조작과 흐름만 맡고, 그리기·화면 좌표 변환은 여기서 한다.
// ★엔진(battle.js)의 20×14 격자·지형 6종은 그대로다. 마름모 칸에 높이를 주고, 부대는 병사 대형으로 그린다.
// ★AI 의 한 수에도 같은 연출이 나오게, render 때마다 부대 상태·전투 기록을 직전과 비교해 효과를 만든다(sync).
'use strict';

const BattleGfx = (() => {
  let cv = null, ctx = null, dpr = 1, onNeed = null;
  let W = 20, H = 14, tw = 64, th = 32, ox = 0, oy = 0;
  const TEX = {}, PAT = {}, POR = {};
  const TEX_NAMES = ['grass', 'forest', 'rock', 'water', 'stone', 'wallside', 'dirt', 'wood'];
  let prev = null, fx = [], raf = 0, last = null, lastT = 0;
  const disp = {};                         // 화면에 그리는 부대 위치(격자 좌표) — 실제 위치로 미끄러져 간다

  // 지형별 높이(th 배수) · 텍스처가 오기 전의 바탕색 · 윗면 텍스처
  // ★성벽을 1.0 칸 높이로 두면 바로 뒤 칸이 통째로 가려 **누를 수 없었다**(09-14, 280칸 중 6칸) —
  //   뒤 칸의 윗부분이 보이는 높이까지만 올린다.
  const ELEV = { 0: 0, 1: 0.05, 2: 0.42, 3: -0.14, 4: 0.62, 5: 0.5 };
  const BASE = { 0: '#7D8A52', 1: '#4F6A3A', 2: '#8A7F6A', 3: '#3F6C78', 4: '#8F8A7E', 5: '#6E5238' };
  const TOP = { 0: 'grass', 1: 'forest', 2: 'rock', 3: 'water', 4: 'stone', 5: 'wood' };
  const SLAB = 0.5;                        // 판 두께(th 배수) — 가장자리가 디오라마처럼 보이게
  const SKIN = '#D8B088', HELM = '#2F2A24', IRON = '#CDD0D2';

  const hash = (x, y, k = 0) => { const s = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s); };
  const elev = (b, x, y) => (ELEV[b.map[y * W + x]] || 0) * th;
  const base = (x, y) => [ox + (x - y) * tw / 2, oy + (x + y + 1) * th / 2];   // 높이 0 인 칸 한가운데
  const darker = (hex, k) => {
    const v = parseInt(String(hex).slice(1), 16);
    const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(n => Math.round(n * k));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  };

  // ── 준비 ─────────────────────────────────────
  function init(canvas, need) {
    cv = canvas; ctx = cv.getContext('2d'); onNeed = need;
    if (init.loaded) return;
    init.loaded = true;
    for (const n of TEX_NAMES) {
      const im = new Image();
      im.onload = () => { TEX[n] = im; clearPat(); if (onNeed) onNeed(); };
      im.src = `art/battle/${n}.webp`;          // 없으면 바탕색으로 그린다
    }
  }
  function clearPat() { for (const k in PAT) delete PAT[k]; }
  // scale = 텍스처 한 장이 차지하는 사용자 단위(윗면은 격자 칸, 옆면은 화면 px)
  function pat(name, scale) {
    const im = TEX[name];
    if (!im) return null;
    const key = name + '@' + scale.toFixed(2);
    if (!PAT[key]) {
      const p = ctx.createPattern(im, 'repeat');
      const k = scale / im.width;
      if (p && p.setTransform) p.setTransform(new DOMMatrix([k, 0, 0, k, 0, 0]));
      PAT[key] = p;
    }
    return PAT[key];
  }

  function layout(wrapW, wrapH, touch, bw, bh) {
    W = bw; H = bh;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const uw = (W + H) / 2, uh = (W + H) / 4 + 1.45;       // 판 크기(tw 배수)
    let s = Math.floor(Math.min((wrapW - 24) / uw, (wrapH - 16) / uh));
    s = Math.max(touch ? 52 : 34, Math.min(100, s));        // 손가락 칸은 최소 크기 — 모자라면 상자가 스크롤한다
    tw = s; th = s / 2;
    const cw = Math.ceil(uw * tw + 24), ch = Math.ceil(uh * tw + 16);
    ox = 12 + H * tw / 2; oy = 8 + tw;                      // 위쪽은 성벽·깃발이 솟을 자리
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    clearPat();
  }

  // ── 좌표 ─────────────────────────────────────
  function center(b, x, y) { const [cx, cy] = base(x, y); return { x: cx, y: cy - elev(b, x, y) }; }
  // 누를 자리 — 칸 한가운데는 앞의 솟은 칸에 가려질 수 있어 윗부분을 가리킨다(자동화·검증용 cellCenter)
  function aim(b, x, y) { const c = center(b, x, y); return { x: c.x, y: c.y - th * 0.28 }; }
  // 캔버스 CSS 좌표 → 칸. 앞(화면 아래)의 솟은 칸부터 찾아야 성벽 뒤를 누르지 않는다.
  function pick(b, px, py) {
    for (let s = W + H - 2; s >= 0; s--) {
      for (let x = Math.min(W - 1, s); x >= Math.max(0, s - H + 1); x--) {
        const y = s - x, c = center(b, x, y);
        if (Math.abs(px - c.x) / (tw / 2) + Math.abs(py - c.y) / (th / 2) <= 1) return { x, y };
      }
    }
    return { x: -1, y: -1 };
  }

  // ── 그리기 ───────────────────────────────────
  // st = { b, me, sel, mode, cells, targets, hover, colors: {A, D} }
  function draw(st) {
    last = st;
    paint(st, performance.now());
    kick();
  }
  function paint(st, now) {
    const b = st.b;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cw = cv.width / dpr, ch = cv.height / dpr;
    const bg = ctx.createRadialGradient(cw / 2, ch * 0.45, 40, cw / 2, ch * 0.5, Math.max(cw, ch) * 0.7);
    bg.addColorStop(0, '#2B2B21'); bg.addColorStop(1, '#0D0E0A');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);

    const hl = new Map();
    for (const p of st.cells || []) hl.set(p.y * W + p.x, 'move');
    for (const u of st.targets || []) hl.set(u.y * W + u.x, 'attack');

    // 부대를 대각선 줄(x+y)로 나눈다 — 칸과 같은 순서로 그려야 앞 칸이 뒤 부대를 가린다
    const rows = new Map(), medals = [];
    for (const u of b.units) {
      const dying = fx.some(f => f.k === 'die' && f.id === u.id && now < f.t0 + f.dur);
      if (u.hp <= 0 && !dying) continue;
      if (u.hidden && u.side !== st.me) continue;          // 숨은 적은 안 보인다
      const p = disp[u.id] || u;
      const s = Math.round(p.x + p.y);
      if (!rows.has(s)) rows.set(s, []);
      rows.get(s).push(u);
    }
    for (let s = 0; s <= W + H - 2; s++) {
      for (let x = Math.max(0, s - H + 1); x <= Math.min(W - 1, s); x++) {
        const y = s - x;
        tile(b, x, y);
        const h = hl.get(y * W + x);
        if (h === 'move') mark(b, x, y, 'rgba(120,200,170,.32)', 'rgba(170,240,210,.75)');
        else if (h === 'attack') mark(b, x, y, 'rgba(230,90,70,.38)', 'rgba(255,140,110,.9)');
        if (st.sel && st.sel.x === x && st.sel.y === y) mark(b, x, y, 'rgba(242,198,107,.22)', '#F2C66B', 2.4);
        if (st.hover && st.hover.x === x && st.hover.y === y) mark(b, x, y, null, 'rgba(250,240,215,.85)');
        decor(st, x, y);
      }
      const list = (rows.get(s) || []).sort((a, c) => (disp[a.id] || a).x - (disp[c.id] || c).x);
      for (const u of list) unit(st, u, now, medals);
    }
    effects(st, now);
    for (const m of medals) medal(...m);
  }

  function diamond(cx, cy, k = 1) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - th / 2 * k); ctx.lineTo(cx + tw / 2 * k, cy);
    ctx.lineTo(cx, cy + th / 2 * k); ctx.lineTo(cx - tw / 2 * k, cy);
    ctx.closePath();
  }

  function tile(b, x, y) {
    const tt = b.map[y * W + x], e = elev(b, x, y);
    const [cx, cy0] = base(x, y), cy = cy0 - e;
    // 앞쪽 두 옆면 — 이웃이 더 낮을 때만 보인다. 판 끝은 두께까지 내린다.
    const nl = y + 1 < H ? elev(b, x, y + 1) : -SLAB * th;
    const nr = x + 1 < W ? elev(b, x + 1, y) : -SLAB * th;
    const sideTex = tt >= 4 ? 'wallside' : tt === 2 ? 'rock' : 'dirt';
    const sideCol = tt >= 4 ? '#7A7468' : tt === 2 ? '#6E6454' : '#5B4631';
    if (e - nl > 0.5) face(cx - tw / 2, cy, cx, cy + th / 2, e - nl, sideTex, sideCol, 0.22);
    if (e - nr > 0.5) face(cx, cy + th / 2, cx + tw / 2, cy, e - nr, sideTex, sideCol, 0.44);
    // 윗면 — 격자 공간에서 칠해 무늬가 칸을 넘어 이어지게 한다
    ctx.save();
    ctx.setTransform(dpr * tw / 2, dpr * th / 2, -dpr * tw / 2, dpr * th / 2, dpr * ox, dpr * (oy - e));
    ctx.fillStyle = pat(TOP[tt], 3) || BASE[tt];
    ctx.fillRect(x, y, 1, 1);
    const v = hash(x, y);                                     // 같은 무늬가 되풀이돼 보이지 않게 칸마다 밝기를 조금
    ctx.fillStyle = v < 0.5 ? `rgba(0,0,0,${((0.5 - v) * 0.22).toFixed(3)})`
                            : `rgba(255,236,190,${((v - 0.5) * 0.12).toFixed(3)})`;
    ctx.fillRect(x, y, 1, 1);
    ctx.restore();
    diamond(cx, cy);
    ctx.strokeStyle = 'rgba(18,14,8,.2)'; ctx.lineWidth = 1; ctx.stroke();   // 격자 — 전술판이 읽혀야 한다
  }
  function face(x0, y0, x1, y1, drop, tex, col, shade) {
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 + drop); ctx.lineTo(x0, y0 + drop);
    ctx.closePath();
    ctx.fillStyle = pat(tex, tw * 1.4) || col; ctx.fill();
    ctx.fillStyle = `rgba(0,0,0,${shade})`; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function mark(b, x, y, fill, stroke, lw) {
    const [cx, cy0] = base(x, y), cy = cy0 - elev(b, x, y);
    if (fill) { diamond(cx, cy); ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { diamond(cx, cy, 0.84); ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
  }

  // ── 지형 장식 ────────────────────────────────
  function decor(st, x, y) {
    const b = st.b, tt = b.map[y * W + x], e = elev(b, x, y);
    const [cx, cy0] = base(x, y), cy = cy0 - e, s = th / 28;
    if (tt === 0 && hash(x, y, 2) > 0.78) {                   // 풀포기
      ctx.strokeStyle = 'rgba(60,80,40,.6)'; ctx.lineWidth = 1;
      const gx = cx + (hash(x, y, 4) - 0.5) * tw * 0.5, gy = cy + (hash(x, y, 5) - 0.5) * th * 0.5;
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) { ctx.moveTo(gx + i * 2 * s, gy); ctx.lineTo(gx + i * 3.4 * s, gy - 4 * s); }
      ctx.stroke();
    } else if (tt === 1) {
      const spots = [[-0.2, -0.12], [0.2, -0.02], [0.02, 0.24]];
      const n = 2 + (hash(x, y, 1) > 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) tree(cx + spots[i][0] * tw, cy + spots[i][1] * th, s * (0.9 + hash(x, y, 6 + i) * 0.3), hash(x, y, 9 + i) > 0.45);
    } else if (tt === 2) {
      for (let i = 0; i < 2; i++) {
        rock(cx + (hash(x, y, 3 + i) - 0.5) * tw * 0.45, cy + (hash(x, y, 7 + i) - 0.3) * th * 0.45,
             s * (0.8 + hash(x, y, 11 + i) * 0.6));
      }
    } else if (tt === 3) {                                    // 물결
      ctx.strokeStyle = 'rgba(225,240,240,.32)'; ctx.lineWidth = 1.1;
      for (let i = 0; i < 2; i++) {
        const wx = cx + (hash(x, y, 13 + i) - 0.5) * tw * 0.45, wy = cy + (hash(x, y, 15 + i) - 0.5) * th * 0.45;
        ctx.beginPath(); ctx.moveTo(wx - 5 * s, wy); ctx.quadraticCurveTo(wx, wy - 2 * s, wx + 5 * s, wy); ctx.stroke();
      }
    } else if (tt === 4) {
      // 성가퀴 — 적이 보는 바깥 가장자리에만
      if (y + 1 >= H || b.map[(y + 1) * W + x] < 4) merlons(cx - tw / 2, cy, cx, cy + th / 2, s);
      if (x + 1 >= W || b.map[y * W + x + 1] < 4) merlons(cx, cy + th / 2, cx + tw / 2, cy, s);
    } else if (tt === 5) {
      gate(b, x, y, cx, cy, s, st.colors.D);
    }
  }
  function tree(x, y, s, pine) {
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(x + 2 * s, y, 7 * s, 3 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4A3624'; ctx.fillRect(x - 1 * s, y - 6 * s, 2 * s, 6 * s);
    if (pine) {
      ['#2C4527', '#33522D', '#3B6034'].forEach((c, i) => {
        const by = y - (5 + i * 5.5) * s, hw = (8.5 - i * 2.2) * s;
        ctx.beginPath(); ctx.moveTo(x, by - 10 * s); ctx.lineTo(x + hw, by); ctx.lineTo(x - hw, by); ctx.closePath();
        ctx.fillStyle = c; ctx.fill();
      });
      ctx.fillStyle = 'rgba(200,230,150,.12)';
      ctx.beginPath(); ctx.moveTo(x, y - 26 * s); ctx.lineTo(x - 6 * s, y - 5 * s); ctx.lineTo(x, y - 7 * s); ctx.closePath(); ctx.fill();
    } else {
      [['#2F4A2B', 0, -12, 7], ['#3D5E35', -2.5, -14, 5], ['#4D7242', -3.2, -15.5, 2.8]].forEach(([c, dx, dy, r]) => {
        ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); ctx.fillStyle = c; ctx.fill();
      });
    }
  }
  function rock(x, y, s) {
    const outline = () => {
      ctx.beginPath();
      ctx.moveTo(x - 7 * s, y); ctx.lineTo(x - 4 * s, y - 7 * s); ctx.lineTo(x + 1 * s, y - 9.5 * s);
      ctx.lineTo(x + 6.5 * s, y - 4 * s); ctx.lineTo(x + 7 * s, y); ctx.closePath();
    };
    outline(); ctx.fillStyle = '#857C6C'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 4 * s, y - 7 * s); ctx.lineTo(x + 1 * s, y - 9.5 * s); ctx.lineTo(x, y - 2 * s); ctx.lineTo(x - 7 * s, y);
    ctx.closePath(); ctx.fillStyle = '#A89F8B'; ctx.fill();                  // 볕 드는 쪽
    outline(); ctx.strokeStyle = 'rgba(30,24,16,.55)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function merlons(x0, y0, x1, y1, s) {
    for (const k of [1 / 6, 3 / 6, 5 / 6]) {
      const mx = x0 + (x1 - x0) * k, my = y0 + (y1 - y0) * k;
      const bw = 5.5 * s, bh = 5 * s;
      ctx.fillStyle = '#9D978A'; ctx.fillRect(mx - bw / 2, my - bh, bw, bh);
      ctx.fillStyle = '#B9B3A5'; ctx.fillRect(mx - bw / 2, my - bh, bw, 1.4 * s);
      ctx.strokeStyle = 'rgba(30,26,20,.6)'; ctx.lineWidth = 1; ctx.strokeRect(mx - bw / 2, my - bh, bw, bh);
    }
  }
  // 성문 — 앞 옆면의 문짝과 수비 세력색 누각
  function gate(b, x, y, cx, cy, s, col) {
    const nl = y + 1 < H ? elev(b, x, y + 1) : -SLAB * th;
    const drop = elev(b, x, y) - nl;
    if (drop > 4) {
      const mx = cx - tw / 4, my = cy + th / 4;
      ctx.fillStyle = '#20150D';
      ctx.beginPath();
      ctx.moveTo(mx - tw * 0.1, my + th * 0.05 + drop); ctx.lineTo(mx - tw * 0.1, my + drop * 0.45);
      ctx.quadraticCurveTo(mx, my + drop * 0.12, mx + tw * 0.1, my + drop * 0.42 - th * 0.1);
      ctx.lineTo(mx + tw * 0.1, my - th * 0.05 + drop); ctx.closePath(); ctx.fill();
    }
    const ry = cy - 15 * s, rw = tw * 0.36;
    ctx.strokeStyle = '#3A2A1C'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(cx - rw * 0.6, cy - 2 * s); ctx.lineTo(cx - rw * 0.6, ry); ctx.moveTo(cx + rw * 0.6, cy - 2 * s); ctx.lineTo(cx + rw * 0.6, ry); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - rw - 4 * s, ry + 1 * s); ctx.quadraticCurveTo(cx - rw * 0.5, ry - 1 * s, cx - rw * 0.35, ry - 8 * s);
    ctx.lineTo(cx + rw * 0.35, ry - 8 * s); ctx.quadraticCurveTo(cx + rw * 0.5, ry - 1 * s, cx + rw + 4 * s, ry + 1 * s);
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(15,10,6,.8)'; ctx.lineWidth = 1; ctx.stroke();
  }

  // ── 부대 ─────────────────────────────────────
  function unit(st, u, now, medals) {
    const b = st.b, p = disp[u.id] || u;
    let gx = p.x, gy = p.y, shake = 0, flash = 0, alpha = u.acted ? 0.66 : 1;
    const walking = Math.hypot(u.x - p.x, u.y - p.y) > 0.02;
    for (const f of fx) {
      if (now < f.t0 || now >= f.t0 + f.dur) continue;
      const k = (now - f.t0) / f.dur;
      if (f.k === 'lunge' && f.id === u.id) {
        const t2 = b.units.find(v => v.id === f.to);
        if (t2) {
          const dx = t2.x - u.x, dy = t2.y - u.y, d = Math.max(0.001, Math.hypot(dx, dy)), a = Math.sin(k * Math.PI) * 0.3;
          gx += dx / d * a; gy += dy / d * a;
        }
      } else if (f.k === 'hit' && f.id === u.id) {
        shake = Math.sin(k * 38) * 3 * (1 - k); flash = 0.55 * (1 - k);
      } else if (f.k === 'die' && f.id === u.id) {
        alpha *= 1 - k;
      }
    }
    const rx = Math.max(0, Math.min(W - 1, Math.round(gx))), ry = Math.max(0, Math.min(H - 1, Math.round(gy)));
    const [bx0, by0] = base(gx, gy);
    const cx = bx0 + shake, cy = by0 - elev(b, rx, ry);
    const mine = u.side === st.me, col = st.colors[u.side] || '#888';
    const face = u.side === 'A' ? 1 : -1, s = th / 25;          // ★th/30 은 칸에 비해 병사가 18px 로 작았다(09-14)
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.ellipse(cx, cy, tw * 0.34, th * 0.34, 0, 0, 7);                 // 발밑 고리 — 아군 금색 · 적 붉은색
    ctx.fillStyle = mine ? 'rgba(232,192,105,.16)' : 'rgba(217,97,74,.16)'; ctx.fill();
    ctx.strokeStyle = mine ? 'rgba(232,192,105,.9)' : 'rgba(217,97,74,.9)';
    ctx.lineWidth = st.sel === u ? 2.6 : 1.3; ctx.stroke();
    banner(cx - face * tw * 0.27, cy - th * 0.02, s, col, u);
    const n = Math.max(1, Math.min(5, Math.ceil(u.hp / u.maxHp * 5)));                  // 병력이 줄면 병사가 준다
    const SLOTS = [[0, -0.04], [-0.2, 0.04], [0.2, 0.04], [-0.1, 0.18], [0.1, 0.18]];
    const pts = SLOTS.slice(0, n).map(([sx, sy], i) => [cx + sx * tw, cy + sy * th * 1.2 -
      (walking ? Math.abs(Math.sin(now / 85 + i)) * 2 : 0)]).sort((a, c) => a[1] - c[1]);
    for (const [px, py] of pts) soldier(u.unit, px, py, s, col, face);
    if (flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,235,200,${flash.toFixed(3)})`;
      ctx.beginPath(); ctx.ellipse(cx, cy - th * 0.45, tw * 0.3, th * 0.7, 0, 0, 7); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    const bw = tw * 0.46, hbx = cx - bw / 2, hby = cy + th * 0.44;                         // 병력 막대
    ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.fillRect(hbx, hby, bw, 3.5);
    ctx.fillStyle = mine ? '#7BC39E' : '#E0A24E'; ctx.fillRect(hbx, hby, bw * Math.max(0, u.hp / u.maxHp), 3.5);
    if (u.confused > 0) {
      ctx.font = `700 ${Math.round(th * 0.5)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#D08AD6'; ctx.fillText('※', cx + tw * 0.3, cy - th * 1.35);
    }
    ctx.restore();
    const hov = st.hover && st.hover.x === u.x && st.hover.y === u.y;
    if ((st.sel === u || hov) && u.hp > 0) medals.push([u, cx, cy - th * 2.25, col]);
  }
  function banner(x, y, s, col, u) {
    ctx.strokeStyle = '#3A2C1E'; ctx.lineWidth = 1.4 * s;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 31 * s); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 31 * s); ctx.lineTo(x + 13 * s, y - 29 * s); ctx.lineTo(x + 12 * s, y - 18 * s); ctx.lineTo(x, y - 19 * s);
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1; ctx.stroke();
    if (u.off && u.nm) {                                                                  // 장수 깃발엔 이름 첫 글자
      ctx.fillStyle = '#F4EAD2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.max(7, Math.round(8.5 * s))}px "Gowun Batang", serif`;
      ctx.fillText(u.nm[0], x + 6.3 * s, y - 24 * s);
    }
  }
  // 병사 한 명 — 오른쪽을 보고 그린 뒤 face 로 뒤집는다
  function soldier(kind, x, y, s, col, face) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(face * s, s);
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(0, 0, kind === '기병' ? 9 : 5.5, 2.2, 0, 0, 7); ctx.fill();
    ctx.lineCap = 'round';
    if (kind === '기병') {
      ctx.strokeStyle = '#3B2A1B'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (const lx of [-5.5, -3.2, 3.2, 5.5]) { ctx.moveTo(lx, -5.5); ctx.lineTo(lx + (lx > 0 ? 0.7 : -0.7), 0); }
      ctx.stroke();
      ctx.fillStyle = '#6B4A2E';
      ctx.beginPath(); ctx.ellipse(0, -7.2, 7.8, 3.7, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5.5, -9); ctx.lineTo(9.6, -14.5); ctx.lineTo(12, -13); ctx.lineTo(8.2, -6.6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#2A1D12'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(-7.4, -8.2); ctx.lineTo(-10.5, -4); ctx.stroke();
      ctx.fillStyle = col; ctx.fillRect(-2.3, -16.5, 4.6, 7.5);
      ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, -18.8, 2.3, 0, 7); ctx.fill();
      ctx.fillStyle = HELM; ctx.beginPath(); ctx.arc(0, -19.4, 2.5, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#5A4630'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-3, -9.5); ctx.lineTo(10.5, -27); ctx.stroke();
      ctx.fillStyle = IRON;
      ctx.beginPath(); ctx.moveTo(10.5, -27); ctx.lineTo(12.4, -30.2); ctx.lineTo(9.2, -27.8); ctx.closePath(); ctx.fill();
    } else {
      ctx.strokeStyle = '#2E241A'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-1.4, -5); ctx.lineTo(-1.8, 0); ctx.moveTo(1.4, -5); ctx.lineTo(1.8, 0); ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(-3.3, -5); ctx.lineTo(-2.6, -12.6); ctx.lineTo(2.6, -12.6); ctx.lineTo(3.3, -5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-3.1, -7.8, 6.2, 1.1);              // 허리띠
      ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, -15, 2.4, 0, 7); ctx.fill();
      ctx.fillStyle = HELM; ctx.beginPath(); ctx.arc(0, -15.6, 2.6, Math.PI, 0); ctx.fill();
      if (kind === '궁병') {
        ctx.strokeStyle = '#6B4F2E'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(2.4, -10.2, 6.2, -1.15, 1.15); ctx.stroke();
        ctx.strokeStyle = 'rgba(235,225,205,.85)'; ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(2.4 + 6.2 * Math.cos(-1.15), -10.2 + 6.2 * Math.sin(-1.15));
        ctx.lineTo(2.4 + 6.2 * Math.cos(1.15), -10.2 + 6.2 * Math.sin(1.15));
        ctx.stroke();
        ctx.fillStyle = '#5A3F26'; ctx.fillRect(-4.8, -13.4, 1.9, 6.2);                   // 화살통
      } else {
        ctx.strokeStyle = '#5A4630'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(3.7, -1); ctx.lineTo(3.7, -24.5); ctx.stroke();
        ctx.fillStyle = IRON;
        ctx.beginPath(); ctx.moveTo(3.7, -27.8); ctx.lineTo(4.9, -24); ctx.lineTo(2.5, -24); ctx.closePath(); ctx.fill();
        ctx.fillStyle = darker(col, 0.62);
        ctx.beginPath(); ctx.ellipse(1.9, -8.8, 2.7, 3.7, 0, 0, 7); ctx.fill();          // 방패
        ctx.strokeStyle = '#C7A254'; ctx.lineWidth = 0.7; ctx.stroke();
      }
    }
    ctx.restore();
  }
  function medal(u, x, y, col) {
    if (u.off) {
      let im = POR[u.off];
      if (im === undefined) {
        im = POR[u.off] = new Image();
        im.onload = () => { if (onNeed) onNeed(); };
        im.onerror = () => { POR[u.off] = null; };
        im.src = `art/portraits/${u.off}.webp`;
      }
      const r = Math.max(15, th * 0.62);
      ctx.beginPath(); ctx.arc(x, y, r + 2.5, 0, 7); ctx.fillStyle = '#F2C66B'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = col; ctx.fill();
      if (im && im.complete && im.naturalWidth) {
        ctx.save(); ctx.clip(); ctx.drawImage(im, x - r, y - r * 1.05, r * 2, r * 2.5); ctx.restore();
      }
      y -= r + 4;
    }
    ctx.font = `700 ${Math.round(Math.max(11, th * 0.42))}px "Gowun Batang", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(10,8,5,.9)'; ctx.strokeText(u.nm, x, y);
    ctx.fillStyle = '#F3EAD6'; ctx.fillText(u.nm, x, y);
  }

  // ── 효과 ─────────────────────────────────────
  function effects(st, now) {
    const b = st.b;
    const at = id => b.units.find(v => v.id === id);
    for (const f of fx) {
      if (now < f.t0 || now >= f.t0 + f.dur) continue;
      const k = (now - f.t0) / f.dur;
      if (f.k === 'arrow') {
        const a = at(f.from), d = at(f.to);
        if (!a || !d) continue;
        const p0 = center(b, a.x, a.y), p1 = center(b, d.x, d.y), A = tw * 0.6;
        for (let i = 0; i < 3; i++) {
          const v = Math.max(0, Math.min(1, k * 1.1 - i * 0.06));
          const x = p0.x + (p1.x - p0.x) * v + (i - 1) * 4;
          const y = p0.y - th * 0.8 + (p1.y - p0.y) * v - Math.sin(v * Math.PI) * A;
          const ang = Math.atan2((p1.y - p0.y) - Math.cos(v * Math.PI) * Math.PI * A, p1.x - p0.x);
          ctx.strokeStyle = 'rgba(240,230,205,.95)'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * 10, y - Math.sin(ang) * 10); ctx.lineTo(x, y); ctx.stroke();
        }
      } else if (f.k === 'hit') {
        const d = at(f.id);
        if (!d || k > 0.55) continue;
        const p = center(b, d.x, d.y), q = k / 0.55;
        ctx.strokeStyle = `rgba(255,225,150,${(1 - q).toFixed(3)})`; ctx.lineWidth = 1.6;
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2 + 0.3, r0 = 4 + q * 10, r1 = r0 + 6;
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(a) * r0, p.y - th * 0.55 + Math.sin(a) * r0 * 0.7);
          ctx.lineTo(p.x + Math.cos(a) * r1, p.y - th * 0.55 + Math.sin(a) * r1 * 0.7);
          ctx.stroke();
        }
      } else if (f.k === 'fire') {
        const d = at(f.id);
        if (!d) continue;
        const p = center(b, d.x, d.y);
        ctx.save(); ctx.globalAlpha = 1 - k * k;
        for (let i = 0; i < 6; i++) {
          const fx0 = p.x - tw * 0.2 + i * tw * 0.08 + Math.sin(now / 80 + i) * 2;
          const fh = th * (0.6 + 0.35 * Math.sin(now / 60 + i * 1.7)), fy = p.y + th * 0.1;
          const gr = ctx.createLinearGradient(fx0, fy, fx0, fy - fh);
          gr.addColorStop(0, 'rgba(255,110,30,.95)'); gr.addColorStop(1, 'rgba(255,220,120,0)');
          ctx.fillStyle = gr;
          ctx.beginPath(); ctx.moveTo(fx0 - 4, fy); ctx.quadraticCurveTo(fx0 - 3, fy - fh * 0.6, fx0, fy - fh);
          ctx.quadraticCurveTo(fx0 + 3, fy - fh * 0.6, fx0 + 4, fy); ctx.fill();
        }
        ctx.restore();
      } else if (f.k === 'heal') {
        const d = at(f.id);
        if (!d) continue;
        const p = center(b, d.x, d.y);
        ctx.fillStyle = `rgba(150,230,160,${(1 - k).toFixed(3)})`;
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * Math.PI * 2;
          ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * tw * 0.22, p.y - k * th * 1.4 - Math.sin(a) * th * 0.2, 1.8, 0, 7); ctx.fill();
        }
      } else if (f.k === 'confuse') {
        const d = at(f.id);
        if (!d) continue;
        const p = center(b, d.x, d.y);
        ctx.strokeStyle = `rgba(210,140,220,${(1 - k).toFixed(3)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(p.x, p.y - th * 1.2, tw * 0.25, th * 0.2, now / 200, 0, Math.PI * 1.5); ctx.stroke();
      } else if (f.k === 'duel') {
        const a = at(f.a), d = at(f.d);
        if (!a || !d) continue;
        const p0 = center(b, a.x, a.y), p1 = center(b, d.x, d.y);
        const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2 - th * 1.1;
        ctx.strokeStyle = `rgba(255,240,200,${(1 - k).toFixed(3)})`; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(mx - 9, my - 9); ctx.lineTo(mx + 9, my + 9); ctx.moveTo(mx + 9, my - 9); ctx.lineTo(mx - 9, my + 9);
        ctx.stroke();
      } else if (f.k === 'num') {
        const d = at(f.id);
        if (!d) continue;
        const p = center(b, d.x, d.y);
        ctx.save();
        ctx.globalAlpha = 1 - k * k;
        ctx.font = `800 ${Math.round(Math.max(12, th * 0.5))}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const y = p.y - th * 1.5 - k * th * 1.1;
        ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(10,8,5,.85)'; ctx.strokeText(f.text, p.x, y);
        ctx.fillStyle = f.color; ctx.fillText(f.text, p.x, y);
        ctx.restore();
      }
    }
  }

  // ── 상태 비교 → 연출 ─────────────────────────
  function sync(b) {
    const now = performance.now();
    if (!prev || prev.b !== b) {
      for (const k in disp) delete disp[k];
      fx = []; prev = null;
    }
    if (prev) {
      for (const L of b.log.slice(prev.log)) {
        if (L.k === 'hit') {
          const a = b.units.find(v => v.id === L.a), d = b.units.find(v => v.id === L.d);
          if (!a || !d) continue;
          const ranged = a.unit === '궁병' && Math.abs(a.x - d.x) + Math.abs(a.y - d.y) > 1;
          fx.push(ranged ? { k: 'arrow', from: a.id, to: d.id, t0: now, dur: 420 }
                         : { k: 'lunge', id: a.id, to: d.id, t0: now, dur: 280 });
          fx.push({ k: 'hit', id: d.id, t0: now + (ranged ? 400 : 140), dur: 340 });
          if (L.back) fx.push({ k: 'hit', id: a.id, t0: now + 460, dur: 300 });
        } else if (L.k === 'skill') {
          if (L.nm === '화계') fx.push({ k: 'fire', id: L.d, t0: now, dur: 1000 });
          else if (L.nm === '응급처치') fx.push({ k: 'heal', id: L.d, t0: now, dur: 900 });
          else if (L.nm === '혼란' && L.hit) fx.push({ k: 'confuse', id: L.d, t0: now, dur: 900 });
        } else if (L.k === 'duel') {
          fx.push({ k: 'duel', a: L.win, d: L.lose, t0: now, dur: 800 });
        }
      }
      const fmt = n => Math.round(n).toLocaleString(typeof LANG !== 'undefined' && LANG === 'en' ? 'en-US' : 'ko-KR');
      for (const u of b.units) {
        const p = prev.units[u.id];
        if (!p) continue;
        const dh = u.hp - p.hp;
        if (dh < 0) fx.push({ k: 'num', id: u.id, text: '−' + fmt(-dh), color: '#F29A7A', t0: now + 150, dur: 1150 });
        else if (dh > 0) fx.push({ k: 'num', id: u.id, text: '+' + fmt(dh), color: '#9ADBA8', t0: now + 150, dur: 1150 });
        if (p.hp > 0 && u.hp <= 0) fx.push({ k: 'die', id: u.id, t0: now + 300, dur: 700 });
      }
    }
    const units = {};
    for (const u of b.units) {
      units[u.id] = { hp: u.hp };
      if (!disp[u.id]) disp[u.id] = { x: u.x, y: u.y };
    }
    prev = { b, log: b.log.length, units };
    kick();
  }
  // 글자만 띄운다(거절·실패)
  function say(u, text, color) {
    fx.push({ k: 'num', id: u.id, text, color: color || '#EDE3CC', t0: performance.now(), dur: 1100 });
    kick();
  }

  // ── 움직임 ───────────────────────────────────
  function kick() { if (!raf && last) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    if (!last || !cv) return;
    const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016);
    lastT = now;
    let moving = false;
    for (const u of last.b.units) {
      const p = disp[u.id];
      if (!p) continue;
      const dx = u.x - p.x, dy = u.y - p.y, d = Math.hypot(dx, dy);
      if (d > 0.001) {
        const step = Math.min(d, dt * 7);                 // 초당 7칸
        p.x += dx / d * step; p.y += dy / d * step;
        moving = true;
      }
    }
    fx = fx.filter(f => now < f.t0 + f.dur);
    paint(last, now);
    if (moving || fx.length) raf = requestAnimationFrame(frame);
    else lastT = 0;
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = null; prev = null; fx = []; lastT = 0;
  }

  return { init, layout, draw, sync, say, pick, center, aim, stop };
})();
