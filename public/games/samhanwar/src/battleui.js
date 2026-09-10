// 삼한통일전 — 전투 화면. 타일맵 캔버스 + 명령 패널.
'use strict';

const BattleView = (() => {
  const B = () => window.SamhanBattle;
  let cv, ctx, b = null, sel = null, mode = null, cells = [], onDone = null, busy = false;
  let hoverCell = null, flash = [], skillName = null;

  const COL = {
    0: '#242a1f', 1: '#2c3a26', 2: '#3a3a30', 3: '#1d2b38', 4: '#4a453a', 5: '#5c4630',
  };

  function open(battle, done) {
    b = battle; onDone = done; sel = null; mode = null; cells = []; busy = false; flash = [];
    document.getElementById('btl').hidden = false;
    Sound.play('battle');
    if (window.CG) CG.play();
    cv = document.getElementById('btlmap');
    ctx = cv.getContext('2d');
    if (!open._wired) {
      cv.addEventListener('click', click);
      cv.addEventListener('mousemove', hover);
      cv.addEventListener('mouseleave', () => { hoverCell = null; draw(); });
      window.addEventListener('resize', () => { resize(); });
      open._wired = true;
    }
    resize();
    render();
  }

  function close() {
    document.getElementById('btl').hidden = true;
    b = null;
    Sound.play('field');
  }

  function resize() {
    if (!cv) return;
    const wrap = cv.parentElement.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // ★손가락으로 누를 칸은 최소한의 크기가 있어야 한다. 좁은 화면에서는 칸을 줄이는 대신
    //   판을 키우고 감싼 상자가 스크롤한다(실측: 390px 폭에서 칸이 18px 까지 줄었다).
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const minCell = touch ? 30 : 18;
    const cell = Math.max(minCell, Math.floor(Math.min(wrap.width / B().W, wrap.height / B().H)));
    cv.style.width = cell * B().W + 'px';
    cv.style.height = cell * B().H + 'px';
    cv.width = cell * B().W * dpr;
    cv.height = cell * B().H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cv._cell = cell;
    draw();
  }

  function cellAt(ev) {
    const r = cv.getBoundingClientRect();
    return { x: Math.floor((ev.clientX - r.left) / cv._cell),
             y: Math.floor((ev.clientY - r.top) / cv._cell) };
  }
  function hover(ev) {
    const c = cellAt(ev);
    if (!hoverCell || hoverCell.x !== c.x || hoverCell.y !== c.y) { hoverCell = c; draw(); }
  }

  function click(ev) {
    if (busy || !b || b.over || b.phase !== 'A') return;
    const { x, y } = cellAt(ev);
    if (x < 0 || y < 0 || x >= B().W || y >= B().H) return;
    const u = B().at(b, x, y);

    if (mode === 'move') {
      if (cells.some(c => c.x === x && c.y === y)) {
        B().move(b, sel.id, x, y);
        mode = null; cells = [];
        render();
        return;
      }
      mode = null; cells = [];
    }
    if (mode === 'attack') {
      if (u && u.side === 'D') {
        const r = B().attack(b, sel.id, u.id);
        if (!r.ok) { toastB(r.why); Sound.sfx('no'); return; }
        Sound.sfx(sel.unit === '궁병' ? 'arrow' : 'hit');
        flashAt(u, `−${nfB(r.dmg)}`, '#D9614A');
        if (r.back) flashAt(sel, `−${nfB(r.back)}`, '#C7A254');
        mode = null; cells = []; sel = null;
        render(); maybeEnd();
        return;
      }
      mode = null; cells = [];
    }
    if (mode === 'skill') {
      const r = B().skill(b, sel.id, skillName, x, y);
      if (!r.ok) { toastB(r.why); mode = null; cells = []; render(); return; }
      if (r.dmg) { flashAt(u, `−${nfB(r.dmg)}`, '#E08A3C'); Sound.sfx(skillName === '화계' ? 'fire' : 'hit'); }
      if (r.heal) flashAt(u, `+${nfB(r.heal)}`, '#6BA893');
      if (r.hit === false) flashAt(u, '실패', '#787E74');
      mode = null; cells = []; sel = null;
      render(); maybeEnd();
      return;
    }
    if (mode === 'duel') {
      if (u && u.side === 'D') {
        const r = B().duel(b, sel.id, u.id);
        if (!r.ok) { toastB(r.why); Sound.sfx('no'); return; }
        Sound.sfx('duel');
        if (!r.accepted) flashAt(u, '거절', '#787E74');
        else {
          const w = b.units.find(v => v.id === r.winner);
          const l = b.units.find(v => v.id === r.loser);
          flashAt(l, `−${nfB(r.cut)}`, '#D9614A');
          toastB(LANG === 'ko' ? `${w.nm}이(가) ${l.nm}을(를) 이겼습니다.`
                                : `${w.nm} bested ${l.nm}.`);
        }
        mode = null; cells = []; sel = null;
        render(); maybeEnd();
        return;
      }
      mode = null; cells = [];
    }

    sel = (u && u.side === 'A' && u.hp > 0) ? u : null;
    render();
  }

  function setMode(m, name) {
    if (!sel) return;
    mode = m; skillName = name || null;
    cells = m === 'move' ? B().moveRange(b, sel) : [];
    render();
  }

  function flashAt(u, text, color) {
    if (!u) return;
    flash.push({ x: u.x, y: u.y, text, color, t: performance.now() });
    requestAnimationFrame(tick);
  }
  function tick() {
    const now = performance.now();
    flash = flash.filter(f => now - f.t < 1100);
    draw();
    if (flash.length) requestAnimationFrame(tick);
  }

  // ── 적 페이즈 ─────────────────────────────
  function endTurn() {
    if (busy || !b || b.over) return;
    B().endPhase(b);
    render();
    runAI();
  }
  function runAI() {
    if (!b || b.over || b.phase !== 'D') return;
    busy = true; render();
    const step = () => {
      if (!b || b.over) { busy = false; render(); maybeEnd(); return; }
      const r = B().aiStep(b);
      render();
      if (b.over) { busy = false; render(); maybeEnd(); return; }
      if (r.done || b.phase === 'A') { busy = false; render(); return; }
      setTimeout(step, 260);
    };
    setTimeout(step, 320);
  }

  function maybeEnd() {
    if (!b || !b.over) return;
    busy = true;
    setTimeout(() => {
      Sound.sfx(b.over.winner === 'A' ? 'capture' : 'lose');
      const res = b.over;
      const done = onDone;
      const bb = b;
      close();
      if (done) done(bb, res);
    }, 900);
  }

  // ── 그리기 ────────────────────────────────
  function draw() {
    if (!ctx || !b) return;
    const c = cv._cell;
    const W = B().W, H = B().H;
    ctx.clearRect(0, 0, c * W, c * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        ctx.fillStyle = COL[b.map[y * W + x]] || COL[0];
        ctx.fillRect(x * c, y * c, c, c);
        ctx.strokeStyle = 'rgba(0,0,0,.28)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * c + .5, y * c + .5, c - 1, c - 1);
      }
    }
    // 성문
    ctx.strokeStyle = '#C7A254'; ctx.lineWidth = 2;
    ctx.strokeRect(b.gate.x * c + 2, b.gate.y * c + 2, c - 4, c - 4);

    // 이동/대상 표시
    if (mode === 'move') {
      ctx.fillStyle = 'rgba(107,168,147,.30)';
      for (const p of cells) ctx.fillRect(p.x * c, p.y * c, c, c);
    }
    if (mode === 'attack' || mode === 'duel') {
      ctx.fillStyle = 'rgba(217,97,74,.30)';
      for (const t of B().targetsFor(b, sel)) {
        if (mode === 'duel' && (!t.off || !sel.off || B().dist(sel, t) !== 1)) continue;
        ctx.fillRect(t.x * c, t.y * c, c, c);
      }
    }

    // 부대
    for (const u of b.units) {
      if (u.hp <= 0) continue;
      const px = u.x * c, py = u.y * c;
      if (u.hidden && u.side === 'D') continue;         // 숨은 적은 안 보인다
      ctx.fillStyle = u.side === 'A' ? '#8E3B2A' : '#3E5F7E';
      if (u.hidden) ctx.globalAlpha = .5;
      ctx.fillRect(px + 2, py + 2, c - 4, c - 4);
      ctx.globalAlpha = 1;
      if (u === sel) { ctx.strokeStyle = '#F0E6D2'; ctx.lineWidth = 2; ctx.strokeRect(px + 2, py + 2, c - 4, c - 4); }
      // 병종 글자
      ctx.fillStyle = '#EFEADF';
      ctx.font = `700 ${Math.round(c * 0.42)}px "Gowun Batang", serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(u.unit[0], px + c / 2, py + c / 2 - c * 0.06);
      // 체력 막대
      const w = (c - 8) * (u.hp / u.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(px + 4, py + c - 8, c - 8, 3.5);
      ctx.fillStyle = u.side === 'A' ? '#6BA893' : '#C7A254';
      ctx.fillRect(px + 4, py + c - 8, w, 3.5);
      if (u.acted) { ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.fillRect(px + 2, py + 2, c - 4, c - 4); }
      if (u.confused > 0) {
        ctx.fillStyle = '#C77ACC'; ctx.font = `700 ${Math.round(c * 0.3)}px sans-serif`;
        ctx.fillText('※', px + c - 7, py + 8);
      }
    }
    // 뜨는 숫자
    const now = performance.now();
    for (const f of flash) {
      const k = (now - f.t) / 1100;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = f.color;
      ctx.font = `700 ${Math.round(c * 0.42)}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x * c + c / 2, f.y * c + c / 2 - k * c * 0.9);
      ctx.globalAlpha = 1;
    }
    if (hoverCell) {
      ctx.strokeStyle = 'rgba(240,230,210,.5)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(hoverCell.x * c + 1, hoverCell.y * c + 1, c - 2, c - 2);
    }
  }

  function nfB(n) { return Math.round(n).toLocaleString(LANG === 'ko' ? 'ko-KR' : 'en-US'); }
  function toastB(m) {
    const box = document.getElementById('btltoast');
    box.textContent = m; box.className = 'btltoast show';
    clearTimeout(toastB._t);
    toastB._t = setTimeout(() => { box.className = 'btltoast'; }, 2200);
  }

  function render() {
    if (!b) return;
    document.getElementById('btlturn').textContent = t('btlTurn', b.turn, B().MAX_TURN, b.phase);
    const A = B().sideUnits(b, 'A'), D = B().sideUnits(b, 'D');
    const sum = l => l.reduce((s, u) => s + u.hp, 0);
    document.getElementById('btlforce').innerHTML =
      `<span class="fA">${t('forceMine')} ${A.length} · ${nfB(sum(A))}</span>
       <span class="fD">${t('forceTheirs')} ${D.length} · ${nfB(sum(D))}</span>`;

    const box = document.getElementById('btlcmd');
    box.innerHTML = '';
    if (b.over) { box.innerHTML = `<p class="note">${b.over.why}</p>`; draw(); return; }
    if (busy || b.phase !== 'A') { box.innerHTML = `<p class="note">${t('bEnemy')}</p>`; draw(); return; }
    if (!sel) {
      const left = B().sideUnits(b, 'A').filter(u => !u.acted).length;
      box.innerHTML = `<p class="note">${t('bPick', left)}</p>`;
      draw(); return;
    }

    const info = document.createElement('div');
    info.className = 'bsel';
    info.innerHTML = `<b>${sel.nm}</b>
      <span class="bu u${sel.unit}">${t(sel.unit)}</span>
      <span class="bhp">${nfB(sel.hp)}<i>/${nfB(sel.maxHp)}</i></span>
      <span class="bstat">${LANG === 'ko' ? '무' : 'M'}${sel.mu} ${LANG === 'ko' ? '지' : 'W'}${sel.ji}
        · ${t('bKi', sel.ki)} · ${t(B().terrOf(b, sel.x, sel.y).nm)}</span>`;
    box.appendChild(info);

    const row = document.createElement('div');
    row.className = 'brow';
    const mk = (label, fn, dis) => {
      const btn = document.createElement('button');
      btn.textContent = label; btn.disabled = !!dis;
      btn.onclick = fn;
      row.appendChild(btn);
      return btn;
    };
    mk(t('bMove'), () => setMode('move'), sel.moved);
    mk(t('bAttack'), () => setMode('attack'), sel.acted || !B().targetsFor(b, sel).length);
    mk(t('bDuel'), () => setMode('duel'),
      sel.acted || !sel.off || !B().targetsFor(b, sel).some(t => t.off && B().dist(sel, t) === 1));
    mk(t('bWait'), () => { B().wait(b, sel.id); sel = null; mode = null; cells = []; render(); }, sel.acted);
    box.appendChild(row);

    if (sel.ki > 0 && !sel.acted) {
      const srow = document.createElement('div');
      srow.className = 'brow skills';
      for (const [k, S] of Object.entries(B().SKILLS)) {
        const btn = document.createElement('button');
        btn.textContent = t(k);
        btn.title = LANG === 'ko' ? (S.why || '') : '';
        btn.onclick = () => {
          if (k === '매복') {
            const r = B().skill(b, sel.id, '매복');
            if (!r.ok) return toastB(r.why);
            toastB(LANG === 'ko' ? '숲에 몸을 숨겼습니다. 드러나며 넣는 첫 공격이 두 배입니다.'
                                  : 'Hidden in the wood. Your first strike will hit twice as hard.');
            Sound.sfx('ok');
            sel = null; render(); return;
          }
          setMode('skill', k);
        };
        srow.appendChild(btn);
      }
      box.appendChild(srow);
    }
    draw();
  }

  return { open, close, endTurn, render, get battle() { return b; } };
})();
