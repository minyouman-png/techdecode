// 삼한통일전 — 지도. 캔버스에 해안선·간선·거점을 그리고 클릭을 거점으로 바꾼다.
'use strict';

const MapView = (() => {
  const VB = { x: 20, y: 150, w: 700, h: 560 };   // 설계서와 같은 투영 창
  const BY_N = Object.fromEntries(CASTLES.map(c => [c.n, c]));
  let cv, ctx, g, paths = null, view = { s: 1, tx: 0, ty: 0 }, sel = null, hover = null;
  let onPick = () => {};
  let drag = null, moved = 0;
  let badges = null;          // {거점: 대기 무장 수} — 일이 남은 거점을 지도에서 보이게

  function init(canvas, game, pick) {
    cv = canvas; ctx = cv.getContext('2d'); g = game; onPick = pick || (() => {});
    paths = COAST.map(d => new Path2D(d));
    loadArt();
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    cv.addEventListener('wheel', wheel, { passive: false });
    cv.addEventListener('pointerleave', () => { hover = null; draw(); });
    resize();
    window.addEventListener('resize', resize);
  }
  function setGame(game) { g = game; }

  function resize() {
    const r = cv.parentElement.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    cv.style.width = r.width + 'px';
    cv.style.height = r.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  // 지도 좌표 → 화면 좌표
  function baseScale() {
    const r = cv.getBoundingClientRect();
    return Math.min(r.width / VB.w, r.height / VB.h);
  }
  function toScreen(x, y) {
    const b = baseScale() * view.s;
    const r = cv.getBoundingClientRect();
    const ox = (r.width - VB.w * b) / 2 + view.tx;
    const oy = (r.height - VB.h * b) / 2 + view.ty;
    return [(x - VB.x) * b + ox, (y - VB.y) * b + oy];
  }
  function toMap(sx, sy) {
    const b = baseScale() * view.s;
    const r = cv.getBoundingClientRect();
    const ox = (r.width - VB.w * b) / 2 + view.tx;
    const oy = (r.height - VB.h * b) / 2 + view.ty;
    return [(sx - ox) / b + VB.x, (sy - oy) / b + VB.y];
  }

  function radius(sz) { return sz === '대' ? 8 : sz === '중' ? 6 : 4.2; }

  function hit(sx, sy) {
    let best = null, bd = 1e9;
    for (const c of CASTLES) {
      const [x, y] = toScreen(c.x, c.y);
      const d = Math.hypot(x - sx, y - sy);
      const r = radius(c.sz) * baseScale() * view.s + 9;
      if (d < r && d < bd) { bd = d; best = c.n; }
    }
    return best;
  }

  function down(e) {
    cv.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
    moved = 0;
  }
  function move(e) {
    const r = cv.getBoundingClientRect();
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      moved = Math.max(moved, Math.hypot(dx, dy));
      if (moved > 4) { view.tx = drag.tx + dx; view.ty = drag.ty + dy; draw(); }
      return;
    }
    const h = hit(e.clientX - r.left, e.clientY - r.top);
    if (h !== hover) { hover = h; cv.style.cursor = h ? 'pointer' : 'grab'; draw(); }
  }
  function up(e) {
    if (!drag) return;
    const r = cv.getBoundingClientRect();
    if (moved <= 4) {
      const n = hit(e.clientX - r.left, e.clientY - r.top);
      if (n) { sel = n; onPick(n); }
    }
    drag = null; draw();
  }
  function wheel(e) {
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const [bx, by] = toMap(mx, my);
    view.s = Math.max(0.75, Math.min(4, view.s * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    const [ax, ay] = toScreen(bx, by);
    view.tx += mx - ax; view.ty += my - ay;
    draw();
  }

  function select(n) { sel = n; draw(); }
  function focus(n) {
    const c = BY_N[n]; if (!c) return;
    const r = cv.getBoundingClientRect();
    const b = baseScale() * view.s;
    view.tx = r.width / 2 - ((c.x - VB.x) * b + (r.width - VB.w * b) / 2);
    view.ty = r.height / 2 - ((c.y - VB.y) * b + (r.height - VB.h * b) / 2);
    draw();
  }

  // 위임 전투 연출(fx.js)이 그 성으로 당겨 보고, 끝나면 보던 자리로 되돌린다
  function getView() { return { s: view.s, tx: view.tx, ty: view.ty }; }
  function setView(v) { if (!v) return; view.s = v.s; view.tx = v.tx; view.ty = v.ty; draw(); }
  function zoomTo(n, s) {
    view.s = Math.max(view.s, Math.max(0.75, Math.min(4, s)));   // 이미 더 가까이 보고 있으면 그대로
    focus(n);
  }

  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  // ── 그림 지도 (09-14) ──────────────────────────
  // terrain.webp = 실측 고도로 칠한 지형(VB 의 4배) · regions.png = 거점 영역(VB 의 2배, 값 = 거점 번호).
  // 둘 다 ~/samhan-portal/tools/terrain.py 가 만든다. 받기 전이나 못 받으면 예전 벡터 지도로 그린다.
  const ART = { terrain: null, regData: null, tint: null, tintKey: '', loading: false };
  function loadArt() {
    if (ART.loading) return;
    ART.loading = true;
    const img = new Image();
    img.onload = () => { ART.terrain = img; draw(); };
    img.src = 'art/map/terrain.webp';
    const reg = new Image();
    reg.onload = () => {
      const c = document.createElement('canvas');
      c.width = reg.width; c.height = reg.height;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(reg, 0, 0);
      ART.regData = x.getImageData(0, 0, c.width, c.height);   // R 채널 = 거점 번호
      ART.tintKey = '';
      draw();
    };
    reg.src = 'art/map/regions.png';
  }
  function hexRgb(h) { const v = parseInt(String(h).slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }

  // 영토색 — 주인이 바뀔 때만 다시 칠한다(한 번에 150만 칸이라 매 프레임은 무겁다)
  function tintCanvas() {
    if (!ART.regData || !g) return null;
    const key = CASTLES.map(c => g.castles[c.n].fac).join('|');
    if (ART.tint && key === ART.tintKey) return ART.tint;
    const { width: w, height: h, data: src } = ART.regData;
    const facOf = new Array(256).fill(null), rgb = new Array(256).fill(null);
    for (const c of CASTLES) {
      const f = g.castles[c.n].fac;
      facOf[c.n] = f;
      rgb[c.n] = hexRgb(FACTIONS[f] ? FACTIONS[f].color : '#888888');
    }
    const cvs = ART.tint || document.createElement('canvas');
    cvs.width = w; cvs.height = h;
    const x2 = cvs.getContext('2d');
    const out = x2.createImageData(w, h), d = out.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4, n = src[p];
        if (!n || !rgb[n]) continue;
        const f = facOf[n], c = rgb[n];
        const nr = x < w - 1 ? src[p + 4] : 0, nd = y < h - 1 ? src[p + 4 * w] : 0;
        const nl = x > 0 ? src[p - 4] : 0, nu = y > 0 ? src[p - 4 * w] : 0;
        const facEdge = (nr && facOf[nr] !== f) || (nd && facOf[nd] !== f) ||
                        (nl && facOf[nl] !== f) || (nu && facOf[nu] !== f);
        if (facEdge) {                                    // 세력 경계 — 짙은 제 색
          d[p] = c[0] * 0.5; d[p + 1] = c[1] * 0.5; d[p + 2] = c[2] * 0.5; d[p + 3] = 235;
        } else if ((nr && nr !== n) || (nd && nd !== n)) { // 같은 세력 안의 거점 경계 — 옅은 먹선
          d[p] = 20; d[p + 1] = 14; d[p + 2] = 8; d[p + 3] = 60;
        } else {
          d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 80;
        }
      }
    }
    x2.putImageData(out, 0, 0);
    ART.tint = cvs; ART.tintKey = key;
    return cvs;
  }

  // 성곽 그림 — 크기(대·중·소)와 세력색 지붕. 화면 고정 크기로 그린다.
  const ICON_S = { 대: 1.3, 중: 1.0, 소: 0.74 };
  function iconBox(c) {
    // ★화면 고정 크기면 확대해도 성이 점만 하다(09-14) — 확대할수록 조금씩 키운다
    const zk = Math.min(1.7, Math.max(0.9, Math.pow(view.s, 0.4)));
    const S = (ICON_S[c.sz] || 1) * zk, h = 10 * S;
    return { S, w: 16 * S, h, top: h * 0.25 + 7 * S };
  }
  function castleIcon(x, y, c, col, state) {
    const { S, w, h } = iconBox(c);
    const wallTop = -h * 0.25, roofH = 7 * S;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (state) {                                           // 2 = 고른 성 · 1 = 가리킨 성
      ctx.beginPath(); ctx.ellipse(0, h * 0.62, w * 0.82, h * 0.44, 0, 0, 7);
      ctx.strokeStyle = state === 2 ? '#F2C66B' : 'rgba(242,230,200,.75)';
      ctx.lineWidth = state === 2 ? 2.4 : 1.4; ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,.38)';
    ctx.beginPath(); ctx.ellipse(1.5, h * 0.72, w * 0.64, h * 0.3, 0, 0, 7); ctx.fill();
    // 성벽 + 성가퀴
    const n = c.sz === '대' ? 6 : c.sz === '중' ? 5 : 4, cw = w / n;
    ctx.beginPath();
    ctx.moveTo(-w / 2, h * 0.65); ctx.lineTo(-w / 2, wallTop);
    for (let i = 0; i < n; i++) {
      const x0 = -w / 2 + i * cw;
      ctx.lineTo(x0, wallTop - 2.2 * S); ctx.lineTo(x0 + cw / 2, wallTop - 2.2 * S);
      ctx.lineTo(x0 + cw / 2, wallTop); ctx.lineTo(x0 + cw, wallTop);
    }
    ctx.lineTo(w / 2, h * 0.65); ctx.closePath();
    ctx.fillStyle = '#CDBE9C'; ctx.fill();
    ctx.lineWidth = 1.1; ctx.strokeStyle = '#231A12'; ctx.stroke();
    ctx.strokeStyle = 'rgba(60,45,30,.35)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-w / 2 + 1, h * 0.2); ctx.lineTo(w / 2 - 1, h * 0.2); ctx.stroke();
    // 성문
    ctx.fillStyle = '#231A12';
    ctx.beginPath();
    ctx.moveTo(-2.4 * S, h * 0.65); ctx.lineTo(-2.4 * S, h * 0.22);
    ctx.arc(0, h * 0.22, 2.4 * S, Math.PI, 0); ctx.lineTo(2.4 * S, h * 0.65);
    ctx.fill();
    // 누각 — 세력색 지붕
    const rw = w * (c.sz === '소' ? 0.55 : 0.62);
    ctx.fillStyle = '#3A2A1C';
    ctx.fillRect(-rw / 2 + 2 * S, wallTop - roofH * 0.55, rw - 4 * S, roofH * 0.55);
    ctx.beginPath();
    ctx.moveTo(-rw / 2 - 2.5 * S, wallTop - roofH * 0.45);
    ctx.lineTo(-rw / 2 + 1.5 * S, wallTop - roofH);
    ctx.lineTo(rw / 2 - 1.5 * S, wallTop - roofH);
    ctx.lineTo(rw / 2 + 2.5 * S, wallTop - roofH * 0.45);
    ctx.lineTo(rw / 2, wallTop - roofH * 0.6);
    ctx.lineTo(-rw / 2, wallTop - roofH * 0.6);
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = '#1A130C'; ctx.stroke();
    if (c.sz === '대') {                                   // 큰 성은 양쪽 망루
      for (const sx of [-1, 1]) {
        const tx = sx * (w / 2 - 1.5 * S);
        ctx.fillStyle = '#CDBE9C';
        ctx.fillRect(tx - 2.2 * S, wallTop - 4 * S, 4.4 * S, 4 * S);
        ctx.strokeStyle = '#231A12'; ctx.lineWidth = 1;
        ctx.strokeRect(tx - 2.2 * S, wallTop - 4 * S, 4.4 * S, 4 * S);
        ctx.beginPath();
        ctx.moveTo(tx - 3.4 * S, wallTop - 4 * S); ctx.lineTo(tx, wallTop - 7 * S); ctx.lineTo(tx + 3.4 * S, wallTop - 4 * S);
        ctx.closePath();
        ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function draw() {
    if (!ctx) return;
    const r = cv.getBoundingClientRect();
    const b = baseScale() * view.s;
    const art = !!ART.terrain;
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.fillStyle = art ? '#0D1820' : css('--sea');
    ctx.fillRect(0, 0, r.width, r.height);

    ctx.save();
    const [ox, oy] = toScreen(VB.x, VB.y);
    ctx.translate(ox, oy); ctx.scale(b, b); ctx.translate(-VB.x, -VB.y);

    if (art) {
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(ART.terrain, VB.x, VB.y, VB.w, VB.h);
      const tint = tintCanvas();
      if (tint) ctx.drawImage(tint, VB.x, VB.y, VB.w, VB.h);
    } else {
      ctx.fillStyle = css('--land');
      ctx.strokeStyle = css('--coast');
      ctx.lineWidth = 0.7 / view.s;
      for (const p of paths) { ctx.fill(p); ctx.stroke(p); }
    }

    // 길 — 같은 세력끼리는 이어진 길, 남의 땅으로는 끊긴 길
    const seen = new Set();
    for (const c of CASTLES) {
      for (const t of c.adj) {
        const key = c.n < t ? `${c.n}-${t}` : `${t}-${c.n}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const d = BY_N[t];
        const same = g && g.castles[c.n].fac === g.castles[t].fac;
        if (art) {
          ctx.setLineDash(same ? [] : [4 / b, 3.5 / b]);
          ctx.lineWidth = 3 / b; ctx.strokeStyle = 'rgba(18,12,6,.42)';
          ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
          ctx.lineWidth = 1.3 / b; ctx.strokeStyle = same ? 'rgba(242,228,192,.85)' : 'rgba(242,228,192,.5)';
          ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
        } else {
          ctx.lineWidth = 1.1 / view.s;
          ctx.strokeStyle = same ? css('--link2') : css('--link');
          ctx.setLineDash(same ? [] : [3 / view.s, 3 / view.s]);
          ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);

    if (!art) {
      for (const c of CASTLES) {
        const st = g ? g.castles[c.n] : null;
        const fac = st ? st.fac : c.fac;
        const col = FACTIONS[fac] ? FACTIONS[fac].color : '#888';
        const rad = radius(c.sz) / b;
        if (c.sz === '대') {
          ctx.beginPath(); ctx.arc(c.x, c.y, rad + 3.4 / b, 0, 7);
          ctx.strokeStyle = col; ctx.globalAlpha = .5; ctx.lineWidth = 1.2 / b;
          ctx.stroke(); ctx.globalAlpha = 1;
        }
        ctx.beginPath(); ctx.arc(c.x, c.y, rad, 0, 7);
        ctx.fillStyle = col; ctx.fill();
        ctx.lineWidth = (c.n === sel ? 2.6 : 1.2) / b;
        ctx.strokeStyle = c.n === sel ? css('--ink') : (c.n === hover ? css('--ink2') : css('--mapdot'));
        ctx.stroke();
      }
    }
    ctx.restore();

    if (art) {
      for (const c of CASTLES) {
        const [x, y] = toScreen(c.x, c.y);
        if (x < -30 || y < -30 || x > r.width + 30 || y > r.height + 30) continue;
        const fac = g ? g.castles[c.n].fac : c.fac;
        castleIcon(x, y, c, FACTIONS[fac] ? FACTIONS[fac].color : '#888', c.n === sel ? 2 : c.n === hover ? 1 : 0);
      }
    }

    // 이름 (화면 좌표에 고정 크기로)
    // ★서안평·의주성은 4px 떨어져 있어 이름이 포개졌다(09-14) — 고른 성·가리킨 성·대·중·소 순으로 자리를 잡고,
    //   위가 막히면 아래, 거기도 막히면 그 이름은 빼 둔다(고른 성·가리킨 성은 늘 보인다).
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    const RANK = { 대: 0, 중: 1, 소: 2 };
    const order = CASTLES.slice().sort((a, z) => ((z.n === sel) - (a.n === sel)) ||
      ((z.n === hover) - (a.n === hover)) || (RANK[a.sz] - RANK[z.sz]));
    const placed = [];
    const taken = (q) => placed.some(p => q.x0 < p.x1 && q.x1 > p.x0 && q.y0 < p.y1 && q.y1 > p.y0);
    for (const c of order) {
      const must = c.n === sel || c.n === hover;
      const show = c.sz === '대' || view.s > 1.5 || must;
      if (!show) continue;
      const [x, y] = toScreen(c.x, c.y);
      if (x < -40 || y < -20 || x > r.width + 40 || y > r.height + 20) continue;
      const size = c.sz === '대' ? 13 : 11.5;
      ctx.font = `700 ${size}px "Gowun Batang", serif`;
      const label = (typeof castleName === 'function') ? castleName(c.n) : c.nm;
      const tw = ctx.measureText(label).width;
      const above = y - (art ? iconBox(c).top + 2 : radius(c.sz) + 3);
      const below = y + (art ? iconBox(c).h * 0.8 + 2 : radius(c.sz) + 2) + size;
      let ly = null;
      for (const cand of [above, below]) {
        const q = { x0: x - tw / 2 - 2, x1: x + tw / 2 + 2, y0: cand - size - 1, y1: cand + 1 };
        if (!taken(q)) { ly = cand; placed.push(q); break; }
      }
      if (ly == null) {
        if (!must) continue;
        ly = above;
      }
      ctx.lineWidth = art ? 3.6 : 3.2;
      ctx.strokeStyle = art ? 'rgba(14,10,6,.9)' : css('--sea');
      ctx.strokeText(label, x, ly);
      ctx.fillStyle = art ? '#F3EAD6' : css('--ink');
      ctx.fillText(label, x, ly);
    }

    // 대기 무장 배지
    if (badges) {
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const [n, k] of Object.entries(badges)) {
        const c = BY_N[n];
        if (!c || !k) continue;
        const [x, y] = toScreen(c.x, c.y);
        const off = art ? iconBox(c).w / 2 + 3 : radius(c.sz) + 5;
        const bx = x + off, by = y + (art ? iconBox(c).h * 0.55 : radius(c.sz) + 3);
        ctx.beginPath(); ctx.arc(bx, by, 7, 0, 7);
        ctx.fillStyle = css('--hwangto'); ctx.fill();
        ctx.fillStyle = '#17130A';
        ctx.fillText(String(k), bx, by + 0.5);
      }
    }
  }
  function setBadges(b) { badges = b; }

  // 자동화·검증용 — 거점의 화면(뷰포트) 좌표
  function screenOf(n) {
    const c = BY_N[n]; if (!c || !cv) return null;
    const [x, y] = toScreen(c.x, c.y), r = cv.getBoundingClientRect();
    return { x: r.left + x, y: r.top + y };
  }
  return { init, draw, resize, select, focus, zoomTo, getView, setView, setGame, setBadges, screenOf,
           get sel() { return sel; } };
})();
