// 삼한통일전 — 지도. 캔버스에 해안선·간선·거점을 그리고 클릭을 거점으로 바꾼다.
'use strict';

const MapView = (() => {
  const VB = { x: 20, y: 150, w: 700, h: 560 };   // 설계서와 같은 투영 창
  const BY_N = Object.fromEntries(CASTLES.map(c => [c.n, c]));
  let cv, ctx, g, paths = null, view = { s: 1, tx: 0, ty: 0 }, sel = null, hover = null;
  let onPick = () => {};
  let drag = null, moved = 0;

  function init(canvas, game, pick) {
    cv = canvas; ctx = cv.getContext('2d'); g = game; onPick = pick || (() => {});
    paths = COAST.map(d => new Path2D(d));
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

  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  function draw() {
    if (!ctx) return;
    const r = cv.getBoundingClientRect();
    const b = baseScale() * view.s;
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.fillStyle = css('--sea'); ctx.fillRect(0, 0, r.width, r.height);

    ctx.save();
    const [ox, oy] = toScreen(VB.x, VB.y);
    ctx.translate(ox, oy); ctx.scale(b, b); ctx.translate(-VB.x, -VB.y);

    // 육지
    ctx.fillStyle = css('--land');
    ctx.strokeStyle = css('--coast');
    ctx.lineWidth = 0.7 / view.s;
    for (const p of paths) { ctx.fill(p); ctx.stroke(p); }

    // 간선
    ctx.lineWidth = 1.1 / view.s;
    const seen = new Set();
    for (const c of CASTLES) {
      for (const t of c.adj) {
        const key = c.n < t ? `${c.n}-${t}` : `${t}-${c.n}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const d = BY_N[t];
        const same = g && g.castles[c.n].fac === g.castles[t].fac;
        ctx.strokeStyle = same ? css('--link2') : css('--link');
        ctx.setLineDash(same ? [] : [3 / view.s, 3 / view.s]);
        ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // 거점
    for (const c of CASTLES) {
      const st = g ? g.castles[c.n] : null;
      const fac = st ? st.fac : c.fac;
      const col = FACTIONS[fac] ? FACTIONS[fac].color : '#888';
      const rr = radius(c.sz) / view.s * view.s; // 화면 고정 크기
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
    ctx.restore();

    // 이름 (화면 좌표에 고정 크기로)
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (const c of CASTLES) {
      const show = c.sz === '대' || view.s > 1.5 || c.n === sel || c.n === hover;
      if (!show) continue;
      const [x, y] = toScreen(c.x, c.y);
      if (x < -40 || y < -20 || x > r.width + 40 || y > r.height + 20) continue;
      const size = c.sz === '대' ? 13 : 11.5;
      ctx.font = `700 ${size}px "Gowun Batang", serif`;
      ctx.lineWidth = 3.2; ctx.strokeStyle = css('--sea');
      const label = (typeof castleName === 'function') ? castleName(c.n) : c.nm;
      ctx.strokeText(label, x, y - radius(c.sz) - 3);
      ctx.fillStyle = css('--ink');
      ctx.fillText(label, x, y - radius(c.sz) - 3);
    }
  }

  return { init, draw, resize, select, focus, setGame, get sel() { return sel; } };
})();
