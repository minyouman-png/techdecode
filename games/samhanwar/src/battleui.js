// 삼한통일전 — 전투 화면. 타일맵 캔버스 + 명령 패널.
'use strict';

const BattleView = (() => {
  const B = () => window.SamhanBattle;
  let cv, ctx, b = null, sel = null, mode = null, cells = [], onDone = null, busy = false;
  let hoverCell = null, skillName = null;
  let pendingDelegate = false;       // 적 페이즈 도중에 위임을 누르면, 그 한 걸음이 끝난 뒤 넘긴다

  // ★사람이 쥔 편. 방어전(v3)에서는 수비측('D')이다 — 'A' 를 박아 두면 적 부대를 조종하게 된다.
  const me = () => (b && b.human) || 'A';
  function open(battle, done) {
    b = battle; onDone = done; sel = null; mode = null; cells = []; busy = false;
    pendingDelegate = false;
    document.getElementById('btl').hidden = false;
    Sound.play('battle');
    if (window.CG) CG.play();
    cv = document.getElementById('btlmap');
    ctx = cv.getContext('2d');
    BattleGfx.init(cv, () => draw());
    if (!open._wired) {
      cv.addEventListener('click', click);
      cv.addEventListener('mousemove', hover);
      cv.addEventListener('mouseleave', () => { hoverCell = null; draw(); });
      window.addEventListener('resize', () => { resize(); });
      open._wired = true;
    }
    resize();
    render();
    const goal = document.getElementById('btlgoal');
    if (goal) goal.textContent = t(me() === 'D' ? 'goalDef' : 'goalAtk', B().MAX_TURN);
    toastB(t(me() === 'D' ? 'goalDef' : 'goalAtk', B().MAX_TURN));
    if (b.phase !== me()) runAI();                  // 방어전은 적이 먼저 움직인다
  }

  function close() {
    document.getElementById('btl').hidden = true;
    BattleGfx.stop();
    b = null;
    Sound.play('field');
  }

  function resize() {
    if (!cv) return;
    const wrap = cv.parentElement.getBoundingClientRect();
    // ★손가락으로 누를 칸은 최소한의 크기가 있어야 한다. 좁은 화면에서는 칸을 줄이는 대신
    //   판을 키우고 감싼 상자가 스크롤한다(실측: 390px 폭에서 칸이 18px 까지 줄었다).
    const touch = window.matchMedia('(pointer: coarse)').matches;
    BattleGfx.layout(wrap.width, wrap.height, touch, B().W, B().H);
    draw();
  }

  function cellAt(ev) {
    if (!b) return { x: -1, y: -1 };
    const r = cv.getBoundingClientRect();
    return BattleGfx.pick(b, ev.clientX - r.left, ev.clientY - r.top);   // 쿼터뷰 — 솟은 칸을 앞에서부터 찾는다
  }
  function hover(ev) {
    const c = cellAt(ev);
    if (!hoverCell || hoverCell.x !== c.x || hoverCell.y !== c.y) { hoverCell = c; draw(); }
  }

  function click(ev) {
    if (busy || !b || b.over || b.phase !== me()) return;
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
      if (u && u.side !== me()) {
        const r = B().attack(b, sel.id, u.id);
        if (!r.ok) { toastB(r.why); Sound.sfx('no'); return; }
        Sound.sfx(sel.unit === '궁병' ? 'arrow' : 'hit');
        mode = null; cells = []; sel = null;
        render(); maybeEnd();
        return;
      }
      mode = null; cells = [];
    }
    if (mode === 'skill') {
      const r = B().skill(b, sel.id, skillName, x, y);
      if (!r.ok) { toastB(r.why); mode = null; cells = []; render(); return; }
      if (r.dmg) Sound.sfx(skillName === '화계' ? 'fire' : 'hit');
      if (r.hit === false) flashAt(u, LANG === 'ko' ? '실패' : 'Failed', '#B9B2A2');
      mode = null; cells = []; sel = null;
      render(); maybeEnd();
      return;
    }
    if (mode === 'duel') {
      if (u && u.side !== me()) {
        const r = B().duel(b, sel.id, u.id);
        if (!r.ok) { toastB(r.why); Sound.sfx('no'); return; }
        Sound.sfx('duel');
        if (!r.accepted) flashAt(u, LANG === 'ko' ? '거절' : 'Refused', '#B9B2A2');
        else {
          const w = b.units.find(v => v.id === r.winner);
          const l = b.units.find(v => v.id === r.loser);
          toastB(LANG === 'ko' ? `${w.nm}이(가) ${l.nm}을(를) 이겼습니다.`
                                : `${w.nm} bested ${l.nm}.`);
        }
        mode = null; cells = []; sel = null;
        render(); maybeEnd();
        return;
      }
      mode = null; cells = [];
    }

    sel = (u && u.side === me() && u.hp > 0) ? u : null;
    render();
  }

  function setMode(m, name) {
    if (!sel) return;
    mode = m; skillName = name || null;
    cells = m === 'move' ? B().moveRange(b, sel) : [];
    render();
  }

  // 글자만 띄운다(거절·실패). 피해·회복 숫자는 BattleGfx.sync 가 상태를 비교해 띄운다 — AI 의 수에도 똑같이.
  function flashAt(u, text, color) { if (u) BattleGfx.say(u, text, color); }

  // ── 적 페이즈 ─────────────────────────────
  function endTurn() {
    if (busy || !b || b.over) return;
    B().endPhase(b);
    render();
    // ★수비측이 30턴을 버티면 '내' 차례 종료에서 기한이 끝난다. runAI 는 끝난 판이면 그냥 돌아가므로
    //   여기서 닫지 않으면 전투 창이 영영 안 닫힌다(09-13 폰 검증에서 멈춤 발견).
    if (b.over) { maybeEnd(); return; }
    runAI();
  }
  function runAI() {
    if (b && b.over) { maybeEnd(); return; }
    if (!b || b.phase === me()) return;
    busy = true; render();
    const step = () => {
      if (pendingDelegate && b && !b.over) { busy = false; handOff(); return; }
      if (!b || b.over) { busy = false; render(); maybeEnd(); return; }
      const r = B().aiStep(b);
      render();
      if (b.over) { busy = false; render(); maybeEnd(); return; }
      if (r.done || b.phase === me()) { busy = false; render(); return; }
      setTimeout(step, 260);
    };
    setTimeout(step, 320);
  }

  function maybeEnd() {
    if (!b || !b.over) return;
    busy = true;
    setTimeout(() => {
      Sound.sfx(b.over.winner === me() ? 'capture' : 'lose');
      const res = b.over;
      const done = onDone;
      const bb = b;
      close();
      if (done) done(bb, res);
    }, 900);
  }

  // ── 위임 ──────────────────────────────────
  // 여기서부터 AI 가 양쪽을 끝까지 두고, 전략 지도 위 연출(DelegateFX)로 넘어간다(09-14 사용자 요청).
  function delegate() {
    if (!b || b.over) return;
    if (busy) { pendingDelegate = true; toastB(t('delegating')); render(); return; }
    handOff();
  }
  function handOff() {
    pendingDelegate = false;
    const bb = b, done = onDone;
    b = null;                                  // 남은 setTimeout 걸음이 판을 건드리지 않게
    BattleGfx.stop();
    document.getElementById('btl').hidden = true;
    runDelegated(bb, done);
  }
  // 전투 창을 열지 않고 곧장 맡긴다 — 출병·방어 창의 [위임]
  function runDelegated(bb, done) {
    const before = forces(bb);
    const tally = B().autoRun(bb);
    DelegateFX.play({ b: bb, before, after: forces(bb), tally }, () => {
      Sound.play('field');
      if (done) done(bb, bb.over);
    });
  }
  function forces(bb) {
    const sum = s => B().sideUnits(bb, s).reduce((n, u) => n + u.hp, 0);
    return { A: sum('A'), D: sum('D') };
  }

  // ── 그리기 ────────────────────────────────
  // 그림은 BattleGfx(쿼터뷰)가 그린다 — 여기서는 무엇을 강조할지만 정해 넘긴다
  function draw() {
    if (!ctx || !b) return;
    const targets = (mode === 'attack' || mode === 'duel') && sel
      ? B().targetsFor(b, sel).filter(v => mode !== 'duel' || (v.off && sel.off && B().dist(sel, v) === 1))
      : [];
    BattleGfx.draw({ b, me: me(), sel, mode, cells: mode === 'move' ? cells : [], targets,
                     hover: hoverCell, colors: sideColors() });
  }
  // 편 색 — 공격측은 출발 거점, 수비측은 목표 거점의 세력색
  function sideColors() {
    const g = typeof G !== 'undefined' ? G : null;
    const fa = g && g.castles[b.from] ? g.castles[b.from].fac : null;
    const fd = g && g.castles[b.to] ? g.castles[b.to].fac : null;
    return { A: (FACTIONS[fa] || {}).color || '#8E3B2A', D: (FACTIONS[fd] || {}).color || '#3E5F7E' };
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
    BattleGfx.sync(b);                          // 직전 상태와 비교해 이동·공격·피해 연출을 만든다
    document.getElementById('btlturn').textContent = t('btlTurn', b.turn, B().MAX_TURN, b.phase === me() ? 'A' : 'D');
    const del = document.getElementById('btldel');
    if (del) del.disabled = !!b.over || pendingDelegate;
    const A = B().sideUnits(b, me()), D = B().sideUnits(b, me() === 'A' ? 'D' : 'A');
    const sum = l => l.reduce((s, u) => s + u.hp, 0);
    document.getElementById('btlforce').innerHTML =
      `<span class="fA">${t('forceMine')} ${A.length} · ${nfB(sum(A))}</span>
       <span class="fD">${t('forceTheirs')} ${D.length} · ${nfB(sum(D))}</span>`;

    const box = document.getElementById('btlcmd');
    box.innerHTML = '';
    if (b.over) { box.innerHTML = `<p class="note">${b.over.why}</p>`; draw(); return; }
    if (busy || b.phase !== me()) { box.innerHTML = `<p class="note">${t('bEnemy')}</p>`; draw(); return; }
    if (!sel) {
      const left = B().sideUnits(b, me()).filter(u => !u.acted).length;
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

  // 자동화·검증용 — 칸의 화면 좌표
  function cellCenter(x, y) {
    if (!cv || !b) return null;
    const r = cv.getBoundingClientRect(), p = BattleGfx.aim(b, x, y);
    return { x: r.left + p.x, y: r.top + p.y };
  }
  return { open, close, endTurn, delegate, runDelegated, render, cellCenter,
           get battle() { return b; }, get busy() { return busy; } };
})();
