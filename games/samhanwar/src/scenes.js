/* 삼한통일전 — 만화 칸 배경을 코드로 그린다.
 *
 * 그림 파일을 쓰지 않는다(0바이트). 맥에서 SDXL 을 돌리면 커널 패닉이 나고(2026-09-14),
 * 렌더 호스트는 게임 PC 라 쓰지 않기로 했다. 대신 먹빛 수묵 톤으로 장면 17가지를 칠한다.
 * 같은 장면 이름 + 같은 씨앗이면 언제나 같은 그림이 나온다(칸을 넘겼다 돌아와도 안 바뀐다).
 *
 *   Scenes.draw(canvas, 'palace', 'seokuro-2')
 */
(function () {
  'use strict';

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── 공용 붓 ─────────────────────────────────────────
  function sky(x, w, h, stops) {
    const g = x.createLinearGradient(0, 0, 0, h);
    for (const [p, c] of stops) g.addColorStop(p, c);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  // 산줄기 — 사인 세 겹을 겹쳐 붓으로 그은 능선처럼
  function ridge(x, w, h, R, base, amp, color, freq) {
    const ph = [R() * 6.3, R() * 6.3, R() * 6.3];
    x.fillStyle = color; x.beginPath(); x.moveTo(0, h);
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      const y = base - amp * (0.55 * Math.sin(u * freq + ph[0]) + 0.3 * Math.sin(u * freq * 2.3 + ph[1])
        + 0.15 * Math.sin(u * freq * 5.7 + ph[2]) + 0.6);
      x.lineTo(u * w, y);
    }
    x.lineTo(w, h); x.closePath(); x.fill();
  }
  function mist(x, w, h, y, a, tone = '220,214,190') {
    const d = h * 0.09;
    const g = x.createLinearGradient(0, y - d, 0, y + d);
    g.addColorStop(0, `rgba(${tone},0)`); g.addColorStop(0.5, `rgba(${tone},${a})`); g.addColorStop(1, `rgba(${tone},0)`);
    x.fillStyle = g; x.fillRect(0, y - d, w, d * 2);
  }
  function glow(x, cx, cy, r, rgb, a) {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  function groundBand(x, w, h, y, top, bot) {
    const g = x.createLinearGradient(0, y, 0, h);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    x.fillStyle = g; x.fillRect(0, y, w, h - y);
  }
  // 기와지붕 — 처마가 들린 곡선
  function roof(x, cx, y, s, col) {
    x.fillStyle = col; x.beginPath();
    x.moveTo(cx - s * 1.3, y + s * 0.02);
    x.quadraticCurveTo(cx - s * 0.95, y + s * 0.2, cx - s * 0.64, y - s * 0.3);
    x.lineTo(cx + s * 0.64, y - s * 0.3);
    x.quadraticCurveTo(cx + s * 0.95, y + s * 0.2, cx + s * 1.3, y + s * 0.02);
    x.quadraticCurveTo(cx, y + s * 0.08, cx - s * 1.3, y + s * 0.02);
    x.fill();
    x.fillRect(cx - s * 0.7, y - s * 0.36, s * 1.4, s * 0.08);
  }
  function hall(x, cx, y, s, lit) {
    x.fillStyle = '#14110c'; x.fillRect(cx - s * 1.05, y + s * 0.02, s * 2.1, s * 0.64);
    if (lit) {
      x.fillStyle = 'rgba(232,172,86,.38)';
      for (let i = 0; i < 5; i++) x.fillRect(cx - s * 0.9 + i * s * 0.37, y + s * 0.14, s * 0.26, s * 0.4);
    }
    x.fillStyle = '#6b2c20';
    for (let i = 0; i < 6; i++) x.fillRect(cx - s * 0.98 + i * s * 0.376, y + s * 0.05, s * 0.07, s * 0.6);
    x.fillStyle = '#29271f'; x.fillRect(cx - s * 1.28, y + s * 0.66, s * 2.56, s * 0.13);
    roof(x, cx, y, s, '#1b1f19');
  }
  function stoneWall(x, w, y, hh) {
    x.fillStyle = '#2b2c25'; x.fillRect(0, y, w, hh);
    x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = Math.max(1, hh / 60);
    const rows = 5, bh = hh / rows;
    for (let r = 0; r < rows; r++) {
      const yy = y + r * bh;
      x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke();
      for (let c = (r % 2) * bh; c < w; c += bh * 1.8) { x.beginPath(); x.moveTo(c, yy); x.lineTo(c, yy + bh); x.stroke(); }
    }
    x.fillStyle = '#2b2c25';
    const m = hh * 0.16;
    for (let c = 0; c < w; c += m * 2) x.fillRect(c, y - m * 0.9, m, m * 0.9);
  }
  function flag(x, px, py, s, col, R) {
    x.strokeStyle = '#0c0d0a'; x.lineWidth = Math.max(1, s * 0.07);
    x.beginPath(); x.moveTo(px, py); x.lineTo(px, py - s * 1.7); x.stroke();
    x.fillStyle = col; x.beginPath();
    x.moveTo(px, py - s * 1.7);
    x.quadraticCurveTo(px + s * 0.5, py - s * 1.55 + R() * s * 0.25, px + s, py - s * 1.42);
    x.lineTo(px + s * 0.94, py - s * 1.0);
    x.quadraticCurveTo(px + s * 0.45, py - s * 1.1, px, py - s * 1.08);
    x.fill();
  }
  function flames(x, cx, by, s, R, n = 16) {
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const fx = cx + (R() - 0.5) * s * 1.8, fh = s * (0.45 + R() * 1.2);
      const g = x.createLinearGradient(0, by, 0, by - fh);
      g.addColorStop(0, 'rgba(255,196,96,.75)'); g.addColorStop(0.45, 'rgba(217,97,74,.55)'); g.addColorStop(1, 'rgba(90,24,12,0)');
      x.fillStyle = g; x.beginPath();
      x.moveTo(fx - s * 0.2, by);
      x.quadraticCurveTo(fx - s * 0.24, by - fh * 0.5, fx + (R() - 0.5) * s * 0.3, by - fh);
      x.quadraticCurveTo(fx + s * 0.24, by - fh * 0.5, fx + s * 0.2, by);
      x.fill();
    }
    x.restore();
  }
  function smoke(x, w, h, R, n, rgb = '30,28,24', a = 0.5) {
    for (let i = 0; i < n; i++) glow(x, R() * w, R() * h * 0.6, h * (0.12 + R() * 0.22), rgb, a * (0.4 + R() * 0.6));
  }
  function embers(x, w, h, R, n) {
    x.fillStyle = 'rgba(255,190,110,.85)';
    for (let i = 0; i < n; i++) { const r = Math.max(0.8, R() * w / 500); x.fillRect(R() * w, R() * h * 0.8, r, r); }
  }
  // 창을 든 군사 무리 — 머리·어깨·창대만으로 실루엣을 만든다
  function troops(x, w, baseY, s, R, n, col, facing = 1, from = 0, to = 1) {
    x.fillStyle = col; x.strokeStyle = col; x.lineWidth = Math.max(1, s * 0.08);
    for (let i = 0; i < n; i++) {
      const px = (from + (to - from) * R()) * w, py = baseY + R() * s * 1.2, k = 0.75 + R() * 0.5;
      x.beginPath(); x.arc(px, py - s * 1.55 * k, s * 0.2 * k, 0, 6.3); x.fill();
      x.beginPath();
      x.moveTo(px - s * 0.35 * k, py); x.lineTo(px - s * 0.26 * k, py - s * 1.3 * k);
      x.lineTo(px + s * 0.26 * k, py - s * 1.3 * k); x.lineTo(px + s * 0.35 * k, py); x.fill();
      x.beginPath(); x.moveTo(px + s * 0.3 * facing * k, py - s * 0.2); x.lineTo(px + s * (0.3 + 0.55 * facing) * k, py - s * 2.6 * k); x.stroke();
    }
  }
  function people(x, w, baseY, s, R, n, col, from = 0, to = 1) {
    x.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const px = (from + (to - from) * R()) * w, py = baseY + R() * s * 0.8, k = 0.7 + R() * 0.5;
      x.beginPath(); x.arc(px, py - s * 1.45 * k, s * 0.19 * k, 0, 6.3); x.fill();
      x.beginPath();
      x.moveTo(px - s * 0.42 * k, py); x.quadraticCurveTo(px - s * 0.3 * k, py - s * 1.25 * k, px, py - s * 1.25 * k);
      x.quadraticCurveTo(px + s * 0.3 * k, py - s * 1.25 * k, px + s * 0.42 * k, py); x.fill();
    }
  }
  // 초가집 — 흙벽 위에 둥글게 부푼 이엉 지붕, 새끼줄 선
  function hut(x, cx, by, s, lit) {
    x.fillStyle = '#6b5a3c'; x.fillRect(cx - s * 0.72, by - s * 0.62, s * 1.44, s * 0.62);
    x.fillStyle = '#2a2217'; x.fillRect(cx - s * 0.16, by - s * 0.44, s * 0.32, s * 0.44);
    if (lit) { x.fillStyle = 'rgba(235,170,85,.6)'; x.fillRect(cx - s * 0.12, by - s * 0.4, s * 0.24, s * 0.4); }
    x.fillStyle = '#a88a52'; x.beginPath();
    x.moveTo(cx - s * 1.0, by - s * 0.52);
    x.bezierCurveTo(cx - s * 0.9, by - s * 1.45, cx + s * 0.9, by - s * 1.45, cx + s * 1.0, by - s * 0.52);
    x.quadraticCurveTo(cx, by - s * 0.66, cx - s * 1.0, by - s * 0.52); x.fill();
    x.strokeStyle = 'rgba(60,44,20,.55)'; x.lineWidth = Math.max(1, s * 0.03);
    for (let k = -2; k <= 2; k++) {
      x.beginPath(); x.moveTo(cx + k * s * 0.34, by - s * 0.58);
      x.quadraticCurveTo(cx + k * s * 0.22, by - s * 1.1, cx + k * s * 0.05, by - s * 1.22); x.stroke();
    }
  }
  // 소나무 — 굽은 줄기에 납작한 솔잎 뭉치를 층층이(수묵화의 소나무처럼 옆으로 퍼지게)
  function pine(x, px, by, s, col, R) {
    const lean = (R() - 0.5) * s * 0.5;
    x.strokeStyle = col; x.lineCap = 'round';
    x.lineWidth = Math.max(1.5, s * 0.09);
    x.beginPath(); x.moveTo(px, by);
    x.bezierCurveTo(px + s * 0.25, by - s * 0.6, px - s * 0.2 + lean, by - s * 1.1, px + lean, by - s * 1.8); x.stroke();
    x.fillStyle = col;
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
      const t = (i + 1) / tiers;
      const cx = px + lean * t + (i % 2 ? s * 0.28 : -s * 0.22);
      const cy = by - s * (0.8 + i * 0.42);
      const ww = s * (1.05 - i * 0.22);
      x.lineWidth = Math.max(1, s * 0.04);
      x.beginPath(); x.moveTo(px + lean * t, cy + s * 0.05); x.lineTo(cx, cy); x.stroke();
      for (let k = 0; k < 9; k++) {
        const u = k / 8 - 0.5;
        const rx = cx + u * ww, ry = cy - Math.cos(u * Math.PI) * s * 0.1 + (R() - 0.5) * s * 0.04;
        x.beginPath(); x.ellipse(rx, ry, s * (0.12 + R() * 0.06), s * (0.055 + R() * 0.03), (R() - 0.5) * 0.4, 0, 6.3); x.fill();
      }
    }
  }
  function ship(x, cx, by, s, R) {
    x.fillStyle = '#16140f'; x.beginPath();
    x.moveTo(cx - s, by - s * 0.05); x.quadraticCurveTo(cx, by + s * 0.35, cx + s * 1.1, by - s * 0.15);
    x.lineTo(cx + s * 0.8, by - s * 0.02); x.lineTo(cx - s * 0.8, by - s * 0.02); x.fill();
    x.strokeStyle = '#16140f'; x.lineWidth = Math.max(1, s * 0.05);
    x.beginPath(); x.moveTo(cx, by - s * 0.05); x.lineTo(cx, by - s * 1.4); x.stroke();
    x.fillStyle = `rgba(${190 + R() * 30 | 0},${170 + R() * 20 | 0},130,.85)`;
    x.beginPath(); x.moveTo(cx + s * 0.04, by - s * 1.35); x.quadraticCurveTo(cx + s * 0.75, by - s * 0.9, cx + s * 0.06, by - s * 0.25); x.fill();
  }
  function waves(x, w, top, h, R, col) {
    x.strokeStyle = col; x.lineWidth = Math.max(1, w / 600);
    for (let i = 0; i < 26; i++) {
      const y = top + (i / 26) ** 1.4 * (h - top), len = w * (0.04 + R() * 0.08), px = R() * w;
      x.beginPath(); x.moveTo(px, y); x.quadraticCurveTo(px + len / 2, y - len * 0.08, px + len, y); x.stroke();
    }
  }
  function grain(x, w, h, R) {
    x.fillStyle = 'rgba(255,248,225,.035)';
    for (let i = 0; i < 900; i++) x.fillRect(R() * w, R() * h, 1.2, 1.2);
    x.fillStyle = 'rgba(0,0,0,.06)';
    for (let i = 0; i < 900; i++) x.fillRect(R() * w, R() * h, 1.4, 1.4);
  }
  function vignette(x, w, h, a = 0.6) {
    const g = x.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.35, w / 2, h * 0.55, Math.max(w, h) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  function moon(x, cx, cy, r) {
    glow(x, cx, cy, r * 4, '240,225,180', 0.18);
    x.fillStyle = '#EDE3C4'; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.fill();
  }
  function stars(x, w, h, R, n) {
    for (let i = 0; i < n; i++) { x.fillStyle = `rgba(240,235,210,${0.3 + R() * 0.6})`; const r = R() * 1.6 + 0.4; x.fillRect(R() * w, R() * h, r, r); }
  }

  // ── 장면 ────────────────────────────────────────────
  let terrainImg = null, terrainReady = false;
  const pending = new Set();
  function terrain() {
    if (terrainImg) return terrainReady ? terrainImg : null;
    terrainImg = new Image();
    terrainImg.onload = () => {
      terrainReady = true;
      for (const job of pending) draw(job.canvas, job.key, job.seed);
      pending.clear();
    };
    terrainImg.src = 'art/map/terrain.webp';
    return null;
  }

  const S = {
    palace(x, w, h, R) {
      sky(x, w, h, [[0, '#231e14'], [0.5, '#6a5330'], [0.72, '#3a2f1e'], [1, '#14110c']]);
      glow(x, w * 0.7, h * 0.42, h * 0.5, '240,190,110', 0.25);
      ridge(x, w, h, R, h * 0.5, h * 0.12, '#2c2a22', 5);
      mist(x, w, h, h * 0.55, 0.12);
      groundBand(x, w, h, h * 0.72, '#2a251b', '#0f0d09');
      hall(x, w * 0.5, h * 0.44, w * 0.22, true);
      for (const px of [0.16, 0.84]) {
        glow(x, w * px, h * 0.66, h * 0.09, '240,170,90', 0.45);
        x.fillStyle = '#b8743e'; x.fillRect(w * px - 4, h * 0.63, 8, h * 0.05);
      }
    },
    court(x, w, h, R) {
      sky(x, w, h, [[0, '#120f0b'], [1, '#231c13']]);
      x.fillStyle = '#5d241b';
      for (let i = 0; i < 6; i++) { const px = w * (0.05 + i * 0.18); x.fillRect(px, 0, w * 0.035, h * 0.78); }
      x.fillStyle = '#17130d'; x.fillRect(0, 0, w, h * 0.1);
      groundBand(x, w, h, h * 0.62, '#2a2418', '#0d0b08');
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1;
      for (let i = -8; i <= 8; i++) { x.beginPath(); x.moveTo(w / 2 + i * w * 0.02, h * 0.62); x.lineTo(w / 2 + i * w * 0.14, h); x.stroke(); }
      x.fillStyle = '#3b2f1c'; x.fillRect(w * 0.38, h * 0.44, w * 0.24, h * 0.16);
      x.fillStyle = '#8c6a33'; x.fillRect(w * 0.4, h * 0.3, w * 0.2, h * 0.15);
      glow(x, w / 2, h * 0.36, h * 0.35, '230,170,90', 0.2);
      people(x, w, h * 0.86, h * 0.1, R, 7, '#0b0a07', 0.02, 0.3);
      people(x, w, h * 0.86, h * 0.1, R, 7, '#0b0a07', 0.7, 0.98);
    },
    fortress(x, w, h, R) {
      sky(x, w, h, [[0, '#2b2d28'], [0.55, '#7a6a4a'], [1, '#2a2620']]);
      smoke(x, w, h * 0.7, R, 6, '60,58,50', 0.35);
      ridge(x, w, h, R, h * 0.48, h * 0.14, '#3a3a30', 4);
      ridge(x, w, h, R, h * 0.58, h * 0.1, '#2b2c25', 6);
      stoneWall(x, w, h * 0.6, h * 0.4);
      hall(x, w * 0.55, h * 0.4, w * 0.11, false);
      const cols = ['#D9614A', '#C7A254', '#6BA893'];
      for (let i = 0; i < 5; i++) flag(x, w * (0.08 + i * 0.21), h * 0.52, h * 0.1, cols[i % 3], R);
    },
    battle(x, w, h, R) {
      sky(x, w, h, [[0, '#3a2a1a'], [0.5, '#9a6a3a'], [1, '#3a2a1c']]);
      smoke(x, w, h, R, 10, '120,90,60', 0.35);
      ridge(x, w, h, R, h * 0.55, h * 0.08, '#4a3a28', 3);
      groundBand(x, w, h, h * 0.62, '#4a3822', '#15100a');
      troops(x, w, h * 0.74, h * 0.07, R, 26, '#1a130c', 1, 0, 0.45);
      troops(x, w, h * 0.74, h * 0.07, R, 26, '#120e09', -1, 0.55, 1);
      x.strokeStyle = 'rgba(20,14,8,.7)'; x.lineWidth = Math.max(1, w / 900);
      for (let i = 0; i < 22; i++) {
        const px = R() * w, py = R() * h * 0.5, l = w * 0.05;
        x.beginPath(); x.moveTo(px, py); x.lineTo(px + l, py + l * 0.3); x.stroke();
      }
      for (let i = 0; i < 4; i++) flag(x, w * (0.1 + R() * 0.8), h * 0.66, h * 0.08, R() < 0.5 ? '#D9614A' : '#C7A254', R);
      smoke(x, w, h * 1.4, R, 5, '160,120,80', 0.25);
    },
    fire(x, w, h, R) {
      sky(x, w, h, [[0, '#120806'], [0.6, '#4a1a10'], [1, '#0d0806']]);
      glow(x, w * 0.5, h * 0.7, h * 0.8, '217,97,74', 0.35);
      hall(x, w * 0.5, h * 0.46, w * 0.2, false);
      flames(x, w * 0.5, h * 0.72, h * 0.3, R, 22);
      flames(x, w * 0.2, h * 0.78, h * 0.16, R, 10);
      flames(x, w * 0.82, h * 0.78, h * 0.18, R, 10);
      smoke(x, w, h * 0.7, R, 8, '20,12,10', 0.55);
      groundBand(x, w, h, h * 0.8, '#1a0e08', '#060403');
      embers(x, w, h, R, 90);
    },
    mountain(x, w, h, R) {
      sky(x, w, h, [[0, '#8f8a78'], [0.6, '#c9c1a6'], [1, '#7a7462']]);
      ridge(x, w, h, R, h * 0.38, h * 0.18, 'rgba(90,92,80,.55)', 3.2);
      mist(x, w, h, h * 0.45, 0.35);
      ridge(x, w, h, R, h * 0.55, h * 0.16, 'rgba(60,62,52,.8)', 4.4);
      mist(x, w, h, h * 0.62, 0.3);
      ridge(x, w, h, R, h * 0.78, h * 0.12, '#23241d', 6);
      for (let i = 0; i < 5; i++) pine(x, w * (0.06 + R() * 0.88), h * (0.84 + R() * 0.12), h * (0.12 + R() * 0.06), '#15160f', R);
    },
    night(x, w, h, R) {
      sky(x, w, h, [[0, '#070a12'], [0.7, '#172033'], [1, '#0b0d0c']]);
      stars(x, w, h * 0.6, R, 140);
      moon(x, w * 0.78, h * 0.2, h * 0.055);
      ridge(x, w, h, R, h * 0.66, h * 0.1, '#10141a', 3);
      ridge(x, w, h, R, h * 0.78, h * 0.06, '#0a0c0d', 6);
      for (let i = 0; i < 4; i++) hut(x, w * (0.15 + i * 0.22), h * (0.88 + R() * 0.04), h * 0.1, R() < 0.6);
      glow(x, w * 0.5, h * 0.9, h * 0.25, '230,150,70', 0.18);
    },
    sea(x, w, h, R) {
      sky(x, w, h, [[0, '#4a5256'], [0.5, '#9aa39b'], [0.56, '#5a6a68']]);
      groundBand(x, w, h, h * 0.56, '#3a4a4a', '#0e1616');
      smoke(x, w, h * 0.5, R, 5, '220,225,215', 0.2);
      waves(x, w, h * 0.58, h, R, 'rgba(210,220,210,.35)');
      for (let i = 0; i < 4; i++) ship(x, w * (0.12 + R() * 0.76), h * (0.62 + R() * 0.12), h * (0.06 + R() * 0.07), R);
      ridge(x, w, h, R, h * 0.55, h * 0.03, 'rgba(40,48,48,.7)', 3);
    },
    grave(x, w, h, R) {
      sky(x, w, h, [[0, '#3c3d38'], [0.7, '#77756a'], [1, '#2b2a25']]);
      ridge(x, w, h, R, h * 0.6, h * 0.05, '#4a4a40', 2);
      groundBand(x, w, h, h * 0.66, '#3a3a2e', '#12120e');
      x.fillStyle = '#2e2e24'; x.beginPath(); x.ellipse(w * 0.52, h * 0.72, w * 0.28, h * 0.2, 0, Math.PI, 0); x.fill();
      x.strokeStyle = '#4c3d27'; x.lineWidth = Math.max(1, w / 400);
      for (let i = 0; i < 40; i++) {
        const px = w * (0.28 + R() * 0.48), py = h * (0.66 + R() * 0.16);
        x.beginPath(); x.moveTo(px, py); x.lineTo(px + (R() - 0.5) * w * 0.06, py - h * (0.02 + R() * 0.05)); x.stroke();
      }
      x.strokeStyle = '#1b1b16'; x.lineWidth = Math.max(1, w / 300);
      for (const px of [0.1, 0.9]) {
        x.beginPath(); x.moveTo(w * px, h); x.lineTo(w * px, h * 0.45);
        x.moveTo(w * px, h * 0.6); x.lineTo(w * (px + 0.05), h * 0.5); x.moveTo(w * px, h * 0.7); x.lineTo(w * (px - 0.05), h * 0.58); x.stroke();
      }
    },
    ritual(x, w, h, R) {
      sky(x, w, h, [[0, '#07080b'], [0.8, '#1c1510'], [1, '#0b0906']]);
      stars(x, w, h * 0.5, R, 90);
      groundBand(x, w, h, h * 0.7, '#231a10', '#070503');
      glow(x, w * 0.5, h * 0.72, h * 0.7, '235,150,70', 0.35);
      flames(x, w * 0.5, h * 0.8, h * 0.28, R, 24);
      people(x, w, h * 0.9, h * 0.12, R, 9, '#0a0806', 0.05, 0.38);
      people(x, w, h * 0.9, h * 0.12, R, 9, '#0a0806', 0.62, 0.95);
      embers(x, w, h, R, 60);
    },
    field(x, w, h, R) {
      sky(x, w, h, [[0, '#6f6f69'], [0.55, '#cfc6a2'], [1, '#8a7a4a']]);
      ridge(x, w, h, R, h * 0.46, h * 0.06, 'rgba(90,90,78,.6)', 3);
      groundBand(x, w, h, h * 0.52, '#8d7a44', '#3a3018');
      x.strokeStyle = 'rgba(40,32,14,.35)'; x.lineWidth = Math.max(1, w / 700);
      for (let i = 0; i < 18; i++) {
        const y = h * 0.52 + (i / 18) ** 1.7 * h * 0.48;
        x.beginPath(); x.moveTo(0, y); x.lineTo(w, y + (R() - 0.5) * h * 0.02); x.stroke();
      }
      x.strokeStyle = 'rgba(230,220,190,.25)';
      for (let i = 0; i < 160; i++) { const px = R() * w, py = h * (0.55 + R() * 0.45); x.beginPath(); x.moveTo(px, py); x.lineTo(px + 2, py - h * 0.03); x.stroke(); }
      people(x, w, h * 0.9, h * 0.1, R, 3, '#1f190c', 0.1, 0.9);
    },
    market(x, w, h, R) {
      sky(x, w, h, [[0, '#8a8471'], [0.6, '#d4c49a'], [1, '#6f5f3e']]);
      ridge(x, w, h, R, h * 0.45, h * 0.05, 'rgba(90,86,70,.5)', 3);
      groundBand(x, w, h, h * 0.6, '#6c5a38', '#241c10');
      const cloth = ['#9b3b2c', '#c7a254', '#4f7f6f', '#7a5a8a', '#b86a3a'];
      for (let i = 0; i < 6; i++) {
        const cx = w * (0.08 + i * 0.17), top = h * (0.44 + R() * 0.06), ww = w * 0.14;
        x.fillStyle = '#2a2014'; x.fillRect(cx - ww / 2, top, 3, h * 0.26); x.fillRect(cx + ww / 2 - 3, top, 3, h * 0.26);
        x.fillStyle = cloth[i % cloth.length]; x.beginPath();
        x.moveTo(cx - ww * 0.6, top + h * 0.05); x.lineTo(cx, top - h * 0.04); x.lineTo(cx + ww * 0.6, top + h * 0.05); x.fill();
        x.fillStyle = '#3a2c18'; x.fillRect(cx - ww * 0.45, top + h * 0.17, ww * 0.9, h * 0.05);
      }
      people(x, w, h * 0.92, h * 0.11, R, 14, '#17120b');
    },
    river(x, w, h, R) {
      sky(x, w, h, [[0, '#9aa08f'], [0.6, '#d8d2b6'], [1, '#6c7462']]);
      ridge(x, w, h, R, h * 0.42, h * 0.08, 'rgba(80,90,78,.55)', 3);
      groundBand(x, w, h, h * 0.5, '#4f5a44', '#1c2218');
      x.fillStyle = 'rgba(170,185,175,.75)'; x.beginPath();
      x.moveTo(0, h * 0.6); x.quadraticCurveTo(w * 0.5, h * 0.52, w, h * 0.62); x.lineTo(w, h * 0.78); x.quadraticCurveTo(w * 0.5, h * 0.7, 0, h * 0.8); x.fill();
      waves(x, w, h * 0.6, h * 0.78, R, 'rgba(250,250,240,.35)');
      x.strokeStyle = '#1c2016'; x.lineWidth = Math.max(1, w / 500);
      x.beginPath(); x.moveTo(w * 0.88, h); x.quadraticCurveTo(w * 0.86, h * 0.5, w * 0.8, h * 0.18); x.stroke();
      x.strokeStyle = 'rgba(40,60,34,.8)';
      for (let i = 0; i < 26; i++) { const px = w * (0.62 + R() * 0.3), py = h * (0.2 + R() * 0.2); x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px - w * 0.01, py + h * 0.15, px - w * 0.02, py + h * 0.32); x.stroke(); }
    },
    forge(x, w, h, R) {
      sky(x, w, h, [[0, '#0a0806'], [1, '#1c120b']]);
      glow(x, w * 0.3, h * 0.6, h * 0.7, '240,120,50', 0.45);
      x.fillStyle = '#2a1e14'; x.beginPath(); x.moveTo(w * 0.14, h); x.lineTo(w * 0.2, h * 0.36); x.lineTo(w * 0.42, h * 0.36); x.lineTo(w * 0.48, h); x.fill();
      x.fillStyle = '#ffb060'; x.fillRect(w * 0.25, h * 0.55, w * 0.12, h * 0.12);
      flames(x, w * 0.31, h * 0.67, h * 0.1, R, 10);
      x.fillStyle = '#111'; x.fillRect(w * 0.58, h * 0.66, w * 0.2, h * 0.06); x.fillRect(w * 0.64, h * 0.72, w * 0.08, h * 0.16);
      x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(255,200,110,.8)'; x.lineWidth = Math.max(1, w / 900);
      for (let i = 0; i < 40; i++) { const a = -R() * Math.PI, l = w * (0.02 + R() * 0.08); x.beginPath(); x.moveTo(w * 0.68, h * 0.66); x.lineTo(w * 0.68 + Math.cos(a) * l, h * 0.66 + Math.sin(a) * l); x.stroke(); }
      x.restore();
      groundBand(x, w, h, h * 0.88, '#140e09', '#050403');
    },
    sky(x, w, h, R) {
      sky(x, w, h, [[0, '#04060c'], [0.75, '#141b2c'], [1, '#0b0c0c']]);
      stars(x, w, h * 0.8, R, 260);
      x.save(); x.globalCompositeOperation = 'lighter';
      const g = x.createLinearGradient(w * 0.2, h * 0.55, w * 0.78, h * 0.18);
      g.addColorStop(0, 'rgba(200,220,255,0)'); g.addColorStop(0.85, 'rgba(210,230,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,.95)');
      x.strokeStyle = g; x.lineCap = 'round';
      for (let k = 0; k < 5; k++) { x.lineWidth = h * (0.006 + k * 0.006); x.globalAlpha = 0.5 - k * 0.08; x.beginPath(); x.moveTo(w * 0.2, h * 0.56 + k * h * 0.01); x.quadraticCurveTo(w * 0.5, h * 0.3, w * 0.78, h * 0.18); x.stroke(); }
      x.restore();
      glow(x, w * 0.78, h * 0.18, h * 0.06, '230,240,255', 0.8);
      ridge(x, w, h, R, h * 0.82, h * 0.06, '#07080a', 4);
    },
    village(x, w, h, R) {
      sky(x, w, h, [[0, '#6e6a58'], [0.6, '#bdb294'], [1, '#5a5038']]);
      ridge(x, w, h, R, h * 0.44, h * 0.1, 'rgba(80,80,66,.6)', 3.5);
      mist(x, w, h, h * 0.5, 0.25);
      groundBand(x, w, h, h * 0.6, '#5a4c30', '#1e180e');
      for (let i = 0; i < 5; i++) {
        const cx = w * (0.1 + i * 0.2 + (R() - 0.5) * 0.05), by = h * (0.74 + R() * 0.08);
        hut(x, cx, by, h * 0.12, false);
        glow(x, cx + h * 0.05, by - h * 0.22, h * 0.07, '200,195,180', 0.25);
      }
      x.strokeStyle = '#2a2014'; x.lineWidth = Math.max(1, w / 700);
      for (let i = 0; i < 30; i++) { const px = (i / 30) * w; x.beginPath(); x.moveTo(px, h * 0.9); x.lineTo(px, h * 0.84); x.stroke(); }
      x.beginPath(); x.moveTo(0, h * 0.86); x.lineTo(w, h * 0.86); x.stroke();
    },
    map(x, w, h, R) {
      const img = terrain();
      if (img) {
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const sw = iw * 0.62, sh = sw * h / w;
        const sx = iw * (0.18 + R() * 0.12), sy = Math.max(0, Math.min(ih - sh, ih * (0.12 + R() * 0.2)));
        x.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        x.fillStyle = 'rgba(40,30,14,.28)'; x.fillRect(0, 0, w, h);
      } else {
        sky(x, w, h, [[0, '#1e2a2a'], [1, '#0f1515']]);
        ridge(x, w, h, R, h * 0.6, h * 0.25, '#3a3e30', 2.4);
        return false;                               // 지도 그림이 아직 안 왔다 — 오면 다시 그린다
      }
    },
  };

  function draw(canvas, key, seed) {
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    const x = canvas.getContext('2d');
    const fn = S[key] || S.village;
    const R = rng(hash(`${key}|${seed || ''}`));
    x.save();
    const ok = fn(x, w, h, R);
    if (ok === false) pending.add({ canvas, key, seed });
    grain(x, w, h, R);
    vignette(x, w, h);
    x.restore();
  }

  window.Scenes = { draw, list: Object.keys(S) };
})();
