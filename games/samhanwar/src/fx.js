// 삼한통일전 — 위임 전투 연출(09-14). 전략 지도의 그 성 위에서 칼이 부딪치고 화살이 오간다.
// ★결과는 이미 정해져 있다(SamhanBattle.autoRun). 연출은 병력 막대를 그 결과로 줄여 갈 뿐이다.
// ★그림 파일 없이 캔버스로만 그린다. 5~10초 — 판이 길었을수록 길다.
'use strict';

const DelegateFX = (() => {
  let box = null, cv = null, ctx = null, run = null;
  const WORDS = { ko: ['챙!', '캉!', '쨍!', '깡!', '챙챙!', '캉캉!'], en: ['Clang!', 'Clash!', 'Klang!', 'Ching!'] };
  const rand = (a, z) => a + Math.random() * (z - a);
  const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const sfx = n => { if (typeof Sound !== 'undefined') Sound.sfx(n); };
  const CLASH_LIFE = 760, HIT_AT = 170;

  function ensure() {
    if (box) return;
    box = document.createElement('div');
    box.id = 'dfx'; box.className = 'dfx'; box.hidden = true;
    box.innerHTML = `<canvas class="dfxcv"></canvas>
      <div class="dfxcard" role="status" aria-live="polite">
        <div class="dfxhead"><span class="dfxk"></span><b class="dfxt"></b></div>
        <div class="dfxbar"><span class="nm"></span><i><em></em></i><span class="n"></span></div>
        <div class="dfxbar"><span class="nm"></span><i><em></em></i><span class="n"></span></div>
        <div class="dfxfoot"><span class="dfxres"></span><button class="dfxskip"></button></div>
      </div>`;
    document.body.appendChild(box);
    cv = box.querySelector('canvas');
    ctx = cv.getContext('2d');
    box.querySelector('.dfxskip').onclick = () => { if (run) end(run); };
    window.addEventListener('resize', size);
  }
  function size() {
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // o = { b: 끝난 전투, before: {A,D}, after: {A,D}, tally: autoRun 집계 }
  function play(o, done) {
    ensure(); size();
    if (run) end(run);
    const b = o.b;
    const g = typeof G !== 'undefined' ? G : null;
    const facA = g ? g.castles[b.from].fac : null, facD = g ? g.castles[b.to].fac : null;
    const colA = (FACTIONS[facA] || {}).color || '#8E3B2A';
    const colD = (FACTIONS[facD] || {}).color || '#3E5F7E';
    const hasMap = typeof MapView !== 'undefined';
    // ★전체 보기 배율 그대로면 전장이 지름 150px 에 그친다(09-14 스크린샷) — 그 성으로 당겨 보고, 끝나면 되돌린다
    let saved = null;
    if (hasMap) {
      try { saved = MapView.getView(); MapView.zoomTo(b.to, 2.6); }
      catch (e) { /* 지도가 없어도 연출은 한다 */ }
    }
    let p = hasMap ? MapView.screenOf(b.to) : null;
    let q = hasMap ? MapView.screenOf(b.from) : null;
    if (!p) p = { x: innerWidth / 2, y: innerHeight * 0.42 };
    if (!q) q = { x: p.x - 120, y: p.y + 40 };
    // ★카드가 화면 아래를 덮으므로 성이 그 밑에 깔리면 위로 끌어올린다(폰)
    p = { x: p.x, y: Math.min(p.y, innerHeight - 250) };
    let dx = q.x - p.x, dy = q.y - p.y;
    const dl = Math.hypot(dx, dy);
    if (dl < 1) { dx = -1; dy = 0.35; } else { dx /= dl; dy /= dl; }

    const dur = Math.max(5000, Math.min(10000, 4000 + b.turn * 300));
    const r = run = {
      b, done, t0: performance.now(), dur, p, dir: { x: dx, y: dy }, colA, colD, facA, facD, saved,
      S: Math.max(1.25, Math.min(2.1, Math.min(innerWidth, innerHeight) / 520)),   // 연출 전체 배율
      human: b.human || 'A', before: o.before, after: o.after,
      fire: !!(o.tally && o.tally.fire > 0),
      clashes: [], arrows: [], puffs: [], timers: [], raf: 0, ended: false,
      nextClash: 200, nextVolley: 520, volleyN: 0, lastClang: -1e9, bannered: false,
      dust: Array.from({ length: 16 }, (_, i) => ({
        a: i / 16 * Math.PI * 2, s: rand(0.4, 1.1), r: rand(18, 46), z: rand(10, 22) })),
    };

    box.querySelector('.dfxk').textContent = t('fxKicker');
    box.querySelector('.dfxt').textContent = t('fxTitle', castleName(b.to));
    const mine = ` · ${t('fxMine')}`;
    r.bars = box.querySelectorAll('.dfxbar');
    r.bars[0].style.setProperty('--c', colA);
    r.bars[1].style.setProperty('--c', colD);
    r.bars[0].querySelector('.nm').textContent = (facA ? facName(facA) : 'A') + (r.human === 'A' ? mine : '');
    r.bars[1].querySelector('.nm').textContent = (facD ? facName(facD) : 'D') + (r.human === 'D' ? mine : '');
    box.querySelector('.dfxres').textContent = '';
    box.querySelector('.dfxskip').textContent = t('fxSkip');
    bars(r, 0);
    box.hidden = false;

    if (typeof Sound !== 'undefined') {
      Sound.play('battle');
      Sound.sfx('warcry');
      r.timers.push(setTimeout(() => { if (!r.ended) Sound.sfx('warcry'); }, dur * 0.5));
    }
    const frame = (now) => { if (r.ended) return; draw(r, now); r.raf = requestAnimationFrame(frame); };
    r.raf = requestAnimationFrame(frame);
    r.timers.push(setTimeout(() => end(r), dur));
  }

  function end(r) {
    if (!r || r.ended) return;
    r.ended = true;
    cancelAnimationFrame(r.raf);
    r.timers.forEach(clearTimeout);
    if (run === r) run = null;
    box.hidden = true;
    if (r.saved && typeof MapView !== 'undefined') { try { MapView.setView(r.saved); } catch (e) { /* 무시 */ } }
    if (r.done) r.done();
  }

  // ── 한 장면 ──────────────────────────────────
  function draw(r, now) {
    const W = innerWidth, H = innerHeight;
    const e = now - r.t0, k = Math.min(1, e / r.dur);
    const cx = r.p.x, cy = r.p.y;
    ctx.clearRect(0, 0, W, H);

    // 주변은 어둡게, 전장만 밝게
    ctx.fillStyle = 'rgba(5,7,4,.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const hr = 200 * r.S;
    const hole = ctx.createRadialGradient(cx, cy, 30 * r.S, cx, cy, hr);
    hole.addColorStop(0, 'rgba(0,0,0,1)'); hole.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hole;
    ctx.beginPath(); ctx.arc(cx, cy, hr, 0, 7); ctx.fill();
    ctx.restore();

    // 장면은 성을 중심으로 r.S 배 — 좌표는 배율 1 기준으로 두고 한꺼번에 키운다
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(r.S, r.S); ctx.translate(-cx, -cy);

    // 흙먼지
    for (const d of r.dust) {
      const a = d.a + e * 0.00035 * d.s;
      const x = cx + Math.cos(a) * d.r * 1.35 + r.dir.x * 10, y = cy + Math.sin(a) * d.r * 0.8 + 6;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, d.z);
      gr.addColorStop(0, 'rgba(150,120,80,.24)'); gr.addColorStop(1, 'rgba(150,120,80,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(x, y, d.z, 0, 7); ctx.fill();
    }

    // 세력 고리 — 바깥은 공격측(돌아간다), 안쪽은 수비측
    const pulse = 1 + Math.sin(e / 180) * 0.06;
    ctx.save();
    ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -e / 40;
    ctx.strokeStyle = r.colA; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.ellipse(cx, cy, 72 * pulse, 45 * pulse, 0, 0, 7); ctx.stroke();
    ctx.setLineDash([]); ctx.lineWidth = 3; ctx.strokeStyle = r.colD; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.ellipse(cx, cy, 30, 19, 0, 0, 7); ctx.stroke();
    ctx.restore();

    fort(cx, cy, r.colD, e);
    if (r.fire && k > 0.2) flames(cx, cy, e);

    // 새 칼싸움·화살 — 끝 무렵에는 멈추고 결과를 띄운다
    while (e >= r.nextClash && k < 0.88) { spawnClash(r, r.nextClash); r.nextClash += rand(330, 620); }
    while (e >= r.nextVolley && k < 0.86) { spawnVolley(r, r.nextVolley); r.nextVolley += rand(850, 1300); }

    drawArrows(r, e);
    drawPuffs(r, e);
    drawClashes(r, e);
    ctx.restore();
    bars(r, k);

    if (e > r.dur - 1200) {
      if (!r.bannered) { r.bannered = true; sfx('thud'); }
      banner(r, (e - (r.dur - 1200)) / 1200);
    }
  }

  // ── 칼싸움 ────────────────────────────────────
  function spawnClash(r, at) {
    const a = rand(0, Math.PI * 2);
    const words = WORDS[LANG] || WORDS.ko;
    r.clashes.push({
      x: r.p.x + Math.cos(a) * rand(10, 60) + r.dir.x * 16,
      y: r.p.y + Math.sin(a) * rand(8, 36) + r.dir.y * 10,
      t0: at, sz: rand(0.8, 1.25), rot: rand(-0.35, 0.35),
      word: words[Math.floor(Math.random() * words.length)], sounded: false,
    });
  }
  function drawClashes(r, e) {
    for (const c of r.clashes) {
      const L = e - c.t0;
      if (L < 0 || L > CLASH_LIFE) continue;
      const swing = L < HIT_AT ? ease(L / HIT_AT) : 1;
      const recoil = L > HIT_AT ? Math.min(1, (L - HIT_AT) / 400) : 0;
      const alpha = L < 560 ? 1 : Math.max(0, 1 - (L - 560) / 200);
      const len = 26 * c.sz;
      // 두 칼이 양쪽에서 휘둘러 들어와 끝이 맞닿는다 — 기울기 0.52rad 에서 칼끝이 한가운데서 만난다
      const tilt = 0.52 - (1 - swing) * 0.9 - recoil * 0.22;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(c.x, c.y); ctx.rotate(c.rot);
      sword(-len * 0.5, len * 0.1, -Math.PI / 2 + tilt, len);
      sword(len * 0.5, len * 0.1, -Math.PI / 2 - tilt, len);
      ctx.restore();
      if (L >= HIT_AT) {
        if (!c.sounded) {
          c.sounded = true;
          if (e - r.lastClang > 110) { r.lastClang = e; sfx('clang'); }
        }
        const tip = { x: c.x + Math.sin(c.rot) * len * 0.77, y: c.y - Math.cos(c.rot) * len * 0.77 };
        ctx.save(); ctx.globalAlpha = alpha;
        sparks(tip.x, tip.y, (L - HIT_AT) / 420, c.sz);
        word(tip.x + 10 * c.sz, tip.y - 8 - (L - HIT_AT) * 0.03, c.word, 1.6 - (L - HIT_AT) / 380, c.sz);
        ctx.restore();
      }
    }
    r.clashes = r.clashes.filter(c => e - c.t0 <= CLASH_LIFE);
  }
  // 고리자루 큰칼(환두대도) — 자루 끝의 고리가 이 시대 칼의 표식이다
  function sword(hx, hy, ang, len) {
    const ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca;
    const tx = hx + ca * len, ty = hy + sa * len;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#E9E6DA'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(hx + ca * 6, hy + sa * 6); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,116,122,.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hx + ca * 7 + nx, hy + sa * 7 + ny); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.strokeStyle = '#C7A254'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hx + ca * 6 - nx * 4.5, hy + sa * 6 - ny * 4.5);
    ctx.lineTo(hx + ca * 6 + nx * 4.5, hy + sa * 6 + ny * 4.5);
    ctx.stroke();
    ctx.strokeStyle = '#4A3526'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + ca * 6, hy + sa * 6); ctx.stroke();
    ctx.strokeStyle = '#C7A254'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(hx - ca * 2.5, hy - sa * 2.5, 2.6, 0, 7); ctx.stroke();
  }
  function sparks(x, y, k, sz) {
    if (k >= 1) return;
    ctx.strokeStyle = `rgba(255,${200 + Math.round(40 * (1 - k))},120,${1 - k})`;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + 0.3;
      const r0 = 3 + k * 10 * sz, r1 = r0 + 7 * sz * (1 - k * 0.6);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
      ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
      ctx.stroke();
    }
    const gl = ctx.createRadialGradient(x, y, 0, x, y, 14 * sz);
    gl.addColorStop(0, `rgba(255,240,190,${0.9 * (1 - k)})`); gl.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(x, y, 14 * sz, 0, 7); ctx.fill();
  }
  function word(x, y, s, a, sz) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= Math.min(1, a);
    ctx.font = `900 ${Math.round(15 * sz)}px "Gowun Batang", serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(20,14,8,.85)'; ctx.strokeText(s, x, y);
    ctx.fillStyle = '#FFE3A0'; ctx.fillText(s, x, y);
    ctx.restore();
  }

  // ── 화살 ──────────────────────────────────────
  function spawnVolley(r, at) {
    const back = r.volleyN++ % 2 === 1;          // 번갈아 — 공격측이 쏘고 성벽이 되쏜다
    const perp = { x: -r.dir.y, y: r.dir.x };
    const n = back ? 4 : 7;
    for (let i = 0; i < n; i++) {
      const off = rand(-34, 34), dist = rand(95, 125);
      const far = { x: r.p.x + r.dir.x * dist + perp.x * off, y: r.p.y + r.dir.y * dist + perp.y * off };
      const near = { x: r.p.x + rand(-22, 22), y: r.p.y + rand(-14, 14) };
      r.arrows.push({ s: back ? near : far, d: back ? far : near, t0: at + i * rand(30, 70),
                      fly: rand(520, 700), h: rand(28, 48), col: back ? r.colD : r.colA, landed: false });
    }
    sfx('volley');
  }
  function drawArrows(r, e) {
    for (const a of r.arrows) {
      const L = e - a.t0;
      if (L < 0) continue;
      const u = L / a.fly;
      if (u >= 1) {
        if (!a.landed) { a.landed = true; r.puffs.push({ x: a.d.x, y: a.d.y, t0: e }); }
        continue;
      }
      const mx = (a.s.x + a.d.x) / 2, my = (a.s.y + a.d.y) / 2 - a.h;
      const at = (v) => {
        const iv = 1 - v;
        return { x: iv * iv * a.s.x + 2 * iv * v * mx + v * v * a.d.x,
                 y: iv * iv * a.s.y + 2 * iv * v * my + v * v * a.d.y };
      };
      const p1 = at(u), p0 = at(Math.max(0, u - 0.07));
      const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x), ca = Math.cos(ang), sa = Math.sin(ang);
      ctx.strokeStyle = 'rgba(236,226,200,.95)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(p1.x - ca * 13, p1.y - sa * 13); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      ctx.fillStyle = '#F4EBD2';
      ctx.beginPath();
      ctx.moveTo(p1.x + ca * 3.5, p1.y + sa * 3.5);
      ctx.lineTo(p1.x + Math.cos(ang + 2.5) * 3, p1.y + Math.sin(ang + 2.5) * 3);
      ctx.lineTo(p1.x + Math.cos(ang - 2.5) * 3, p1.y + Math.sin(ang - 2.5) * 3);
      ctx.fill();
      ctx.strokeStyle = a.col; ctx.lineWidth = 2.2;              // 깃 — 쏜 편의 색
      ctx.beginPath(); ctx.moveTo(p1.x - ca * 13, p1.y - sa * 13); ctx.lineTo(p1.x - ca * 9, p1.y - sa * 9); ctx.stroke();
    }
    r.arrows = r.arrows.filter(a => !a.landed);
  }
  function drawPuffs(r, e) {
    for (const f of r.puffs) {
      const k = (e - f.t0) / 320;
      if (k >= 1) continue;
      ctx.fillStyle = `rgba(170,140,100,${0.35 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, 2 + k * 7, 0, 7); ctx.fill();
    }
    r.puffs = r.puffs.filter(f => e - f.t0 < 320);
  }

  // ── 성·불 ─────────────────────────────────────
  function fort(x, y, col, e) {
    const w = 34, h = 16, top = y - h / 2;
    ctx.fillStyle = 'rgba(30,24,18,.92)';
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + h / 2);
    ctx.lineTo(x - w / 2, top);
    for (let i = 0; i < 5; i++) {                                // 성가퀴
      const x0 = x - w / 2 + i * w / 5;
      ctx.lineTo(x0, top - 5); ctx.lineTo(x0 + w / 10, top - 5);
      ctx.lineTo(x0 + w / 10, top); ctx.lineTo(x0 + w / 5, top);
    }
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0c0a07';
    ctx.beginPath(); ctx.arc(x, y + h / 2, 5, Math.PI, 0); ctx.fill();
    const wave = Math.sin(e / 140) * 3;
    ctx.strokeStyle = '#d8cfb8'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, top - 5); ctx.lineTo(x, top - 24); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, top - 24);
    ctx.quadraticCurveTo(x + 7, top - 22 + wave, x + 15, top - 21);
    ctx.lineTo(x + 15, top - 14);
    ctx.quadraticCurveTo(x + 7, top - 15 + wave, x, top - 16);
    ctx.fill();
  }
  function flames(x, y, e) {
    for (let i = 0; i < 5; i++) {
      const fx = x - 14 + i * 7 + Math.sin(e / 90 + i) * 1.5;
      const fh = 12 + Math.sin(e / 70 + i * 1.7) * 4 + (i % 2) * 4, fy = y - 8;
      const gr = ctx.createLinearGradient(fx, fy, fx, fy - fh);
      gr.addColorStop(0, 'rgba(255,120,30,.9)'); gr.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(fx - 4, fy);
      ctx.quadraticCurveTo(fx - 3, fy - fh * 0.6, fx, fy - fh);
      ctx.quadraticCurveTo(fx + 3, fy - fh * 0.6, fx + 4, fy);
      ctx.fill();
    }
  }

  // ── 병력 막대·결과 ────────────────────────────
  function bars(r, k) {
    const top = Math.max(1, r.before.A, r.before.D);
    const wob = k < 1 ? Math.sin(k * 40) * 0.012 : 0;          // 밀고 밀리는 느낌
    ['A', 'D'].forEach((s, i) => {
      const a = r.before[s], z = r.after[s];
      const val = Math.min(a, Math.max(z, a + (z - a) * (ease(k) + wob)));
      r.bars[i].querySelector('em').style.width = (val / top * 100).toFixed(1) + '%';
      r.bars[i].querySelector('.n').textContent = Math.round(val).toLocaleString(LANG === 'ko' ? 'ko-KR' : 'en-US');
    });
  }
  function banner(r, u) {
    const over = r.b.over;
    if (!over) return;
    const wf = over.winner === 'A' ? r.facA : r.facD;
    const col = over.winner === 'A' ? r.colA : r.colD;
    const s = t('fxWin', wf ? facName(wf) : over.winner);
    const a = Math.min(1, u * 3);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = '700 30px "Gowun Batang", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const y = Math.max(40, r.p.y - 100 * r.S - (1 - a) * 10);
    const w = ctx.measureText(s).width + 44;
    ctx.fillStyle = 'rgba(14,17,12,.9)'; ctx.fillRect(r.p.x - w / 2, y - 24, w, 48);
    ctx.fillStyle = col; ctx.fillRect(r.p.x - w / 2, y - 24, 4, 48);
    ctx.fillStyle = '#F0E6D2'; ctx.fillText(s, r.p.x, y + 1);
    ctx.restore();
    const res = box.querySelector('.dfxres');
    if (!res.textContent) res.textContent = over.why;
  }

  return { play, skip: () => { if (run) end(run); }, get active() { return !!run; } };
})();
