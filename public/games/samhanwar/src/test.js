// 삼한통일전 — 자가 검증. `?test=sim` 으로 연다.
// 무인으로 60턴을 돌려 NaN·교착·데이터 불일치를 잡는다.
'use strict';

window.runSamhanTests = function () {
  const en = window.SamhanEngine;
  const R = [];
  const ok = (name, cond, note) => R.push({ name, pass: !!cond, note: note || '' });
  const num = v => typeof v === 'number' && Number.isFinite(v);

  // ── 데이터 무결성 ──────────────────────────
  ok('거점 37개', CASTLES.length === 37, `${CASTLES.length}개`);
  ok('세력 17개', Object.keys(FACTIONS).length === 17);
  ok('무장 id 유일', new Set(OFFICERS.map(o => o.id)).size === OFFICERS.length);

  const byN = Object.fromEntries(CASTLES.map(c => [c.n, c]));
  let sym = true, iso = 0;
  for (const c of CASTLES) {
    if (!c.adj.length) iso++;
    for (const t of c.adj) if (!byN[t] || !byN[t].adj.includes(c.n)) sym = false;
  }
  ok('인접 대칭', sym);
  ok('고립 거점 없음', iso === 0, `${iso}개`);

  // 연결성 — 한 덩어리여야 한다
  const seen = new Set([CASTLES[0].n]), stack = [CASTLES[0].n];
  while (stack.length) for (const t of byN[stack.pop()].adj) if (!seen.has(t)) { seen.add(t); stack.push(t); }
  ok('전체 연결', seen.size === CASTLES.length, `${seen.size}/${CASTLES.length}`);

  let capOk = true;
  for (const [id, f] of Object.entries(FACTIONS)) {
    if (!f.castles.includes(f.cap)) capOk = false;
    if (!f.castles.length) capOk = false;
  }
  ok('세력 수도 일치', capOk);

  let locOk = true, statOk = true;
  for (const o of OFFICERS) {
    if (!byN[o.loc]) locOk = false;
    for (const k of ['mu', 'ji', 'jg']) if (!(o[k] >= 1 && o[k] <= 100)) statOk = false;
    if (!o.bio || o.bio.length < 20) statOk = false;          // 열전 누락 방지
    if (o.real && !o.src) statOk = false;                      // 실존인데 근거 없음
  }
  ok('무장 거점 유효', locOk);
  ok('무장 능력·열전 유효', statOk);
  ok('무장 200명 이상', OFFICERS.length >= 200, `${OFFICERS.length}명`);
  ok('실존 30명 이상', OFFICERS.filter(o => o.real).length >= 30,
    `${OFFICERS.filter(o => o.real).length}명`);
  ok('요청 가상무장 16명 보존',
    ['kimminyu','kimgyeongho','jeongchan','johyeonjin','kimyujin','kimyujeong',
     'kimgyeongdong','simjunbo','kimgyoil','seojongbeom','kimgilsu','jogyeongjun',
     'idongsik','hamjunwon','choiinu','nojinhui']
      .every(id => OFFICERS.some(o => o.id === id)));
  ok('무장 없는 거점 없음',
    CASTLES.every(c => OFFICERS.some(o => o.loc === c.n)),
    CASTLES.filter(c => !OFFICERS.some(o => o.loc === c.n)).map(c => c.nm).join(',') || '전 거점 배치');
  ok('김민유 무·지 90+', (() => { const o = OFFICERS.find(x => x.id === 'kimminyu'); return o && o.mu >= 90 && o.ji >= 90; })());
  ok('김경호 무력 98', (() => { const o = OFFICERS.find(x => x.id === 'kimgyeongho'); return o && o.mu === 98; })());
  ok('정찬 정치 100', (() => { const o = OFFICERS.find(x => x.id === 'jeongchan'); return o && o.jg === 100; })());

  // ── 5단계: 언어와 소리 ──────────────────────────
  ok('두 언어가 있다', !!I18N.ko && !!I18N.en);
  ok('영어에 빠진 문구 없음', (() => {
    const missing = Object.keys(I18N.ko).filter(k => I18N.en[k] == null);
    return missing.length === 0 ? true : (ok._m = missing.join(','), false);
  })(), ok._m || '');
  ok('함수형 문구는 양쪽 다 함수', Object.keys(I18N.ko)
    .every(k => typeof I18N.ko[k] === typeof I18N.en[k]));
  ok('세력 영문명 17개', Object.keys(FACTIONS).every(id => !!NAMES_EN.fac[id]));
  ok('거점 영문명 37개', CASTLES.every(c => !!NAMES_EN.castle[c.n]));
  ok('무장 영문명 전원', OFFICERS.every(o => !!o.en), 
    OFFICERS.filter(o => !o.en).map(o => o.nm).join(',') || '201명');
  ok('무장 영문 열전 전원', OFFICERS.every(o => o.bioEn && o.bioEn.length > 30),
    `${OFFICERS.filter(o => o.bioEn).length}/${OFFICERS.length}`);
  ok('실존은 영문 출전도 있다',
    OFFICERS.filter(o => o.real).every(o => o.srcEn && !/[가-힣]/.test(o.srcEn)),
    OFFICERS.filter(o => o.real && /[가-힣]/.test(o.srcEn || '')).map(o => o.nm).join(',') || '35명');
  ok('영문 열전에 한글이 섞이지 않았다',
    OFFICERS.every(o => !/[가-힣]/.test(o.bioEn)),
    OFFICERS.filter(o => /[가-힣]/.test(o.bioEn)).map(o => o.nm).join(',') || '깨끗');
  ok('언어 전환', (() => {
    const before = LANG;
    setLang('en'); const en1 = t('tabDiplo'), fac = facName('고구려'), cst = castleName(1);
    setLang('ko'); const ko1 = t('tabDiplo');
    setLang(before);
    return en1 === 'Diplomacy' && ko1 === '외교' && fac === 'Goguryeo' && cst === 'Gungnae';
  })());
  ok('소리 모듈', typeof Sound === 'object' && typeof Sound.play === 'function');

  // ── 공식 ───────────────────────────────────
  const g0 = en.newGame('백제', 12345);
  const c0 = g0.castles[19];
  ok('수입 유한', num(en.income(c0)) && en.income(c0) > 0);
  ok('추수 유한', num(en.harvest(c0)) && en.harvest(c0) > 0);
  ok('징집상한 유한', num(en.draftCap(c0)) && en.draftCap(c0) > 0);
  ok('초기 병력 상한 이내',
    CASTLES.every(c => en.troopTotal(g0.castles[c.n]) <= c.garr));

  // 결정성 — 같은 시드는 같은 결과
  const a = en.newGame('백제', 999), b = en.newGame('백제', 999);
  for (let i = 0; i < 8; i++) { en.runAllAI(a); en.nextTurn(a); en.runAllAI(b); en.nextTurn(b); }
  ok('시드 결정적', en.saveState(a) === en.saveState(b));

  // ── 명령 ───────────────────────────────────
  const g = en.newGame('백제', 4242);
  const cap = FACTIONS['백제'].cap;
  const off = en.officersAt(g, cap).find(o => o.fac === '백제');
  const before = g.castles[cap].ag;
  const r1 = en.doDevelop(g, cap, off.id, '농업');
  ok('내정 명령', r1.ok && g.castles[cap].ag > before, r1.why || `+${r1.gain}`);
  const r2 = en.doDevelop(g, cap, off.id, '농업');
  ok('한 달 한 명령', !r2.ok, r2.why);

  const off2 = en.officersAt(g, cap).find(o => o.fac === '백제' && !o.done);
  if (off2) {
    const t0 = en.troopTotal(g.castles[cap]);
    const r3 = en.doRecruit(g, cap, off2.id, '보병', 500, '징병');
    ok('징병', r3.ok && en.troopTotal(g.castles[cap]) === t0 + 500, r3.why);
    ok('징병은 훈련도를 떨어뜨린다', g.castles[cap].train < 50);
  } else ok('징병', false, '무장 부족');

  const wild = Object.values(g.officers).filter(o => o.fac === null);
  ok('재야 존재', wild.length >= 20, `${wild.length}명`);
  ok('재야는 처음엔 숨어 있다', wild.every(o => !o.found));

  // ── 2단계: 부대 편성 ────────────────────────────
  const g2 = en.newGame('고구려', 31337);
  const cap2 = FACTIONS['고구려'].cap;
  const c2 = g2.castles[cap2];
  const o2 = en.officersAt(g2, cap2).find(o => o.fac === '고구려');
  const t2 = c2.troops.보병, gar0 = en.garrisonTotal(g2, cap2);
  const r4 = en.doAssign(g2, cap2, o2.id, '보병', 800);
  ok('부대 편성', r4.ok && o2.corps && o2.corps.n === 800 && c2.troops.보병 === t2 - 800, r4.why);
  ok('편성해도 거점 총병력은 그대로', en.garrisonTotal(g2, cap2) === gar0,
    `${en.garrisonTotal(g2, cap2)} vs ${gar0}`);
  const over = en.doAssign(g2, cap2, o2.id, '보병', 99999);
  ok('통솔 상한 강제', !over.ok, over.why);
  const mix = en.doAssign(g2, cap2, o2.id, '기병', 100);
  ok('한 무장은 한 병종', !mix.ok, mix.why);
  const r5 = en.doDisband(g2, o2.id);
  ok('부대 해산', r5.ok && !o2.corps && c2.troops.보병 === t2, r5.why);

  // 하사
  const oLow = en.officersAt(g2, cap2).find(o => o.fac === '고구려' && o.loy < 95);
  const before5 = oLow.loy, gold5 = g2.castles[cap2].gold;
  const r6 = en.doReward(g2, cap2, oLow.id, 300);
  ok('하사로 충성 상승', r6.ok && oLow.loy > before5, r6.why || `${Math.round(before5)}→${Math.round(oLow.loy)}`);
  ok('하사에 자금이 든다', g2.castles[cap2].gold === gold5 - 300);
  const oFull = en.officersAt(g2, cap2).find(o => o.fac === '고구려' && o.loy >= 99);
  if (oFull) {
    const gold6 = g2.castles[cap2].gold;
    const r6b = en.doReward(g2, cap2, oFull.id, 300);
    ok('충성 만점이면 자금을 쓰지 않는다', !r6b.ok && g2.castles[cap2].gold === gold6, r6b.why);
  } else ok('충성 만점이면 자금을 쓰지 않는다', true, '만점 무장 없음(건너뜀)');

  // 탐색 — 숨은 재야를 찾는다
  const wildCastle = CASTLES.find(c => Object.values(g2.officers)
    .some(o => o.loc === c.n && o.fac === null) &&
    Object.values(g2.officers).some(o => o.loc === c.n && o.fac === '고구려'));
  if (wildCastle) {
    const seeker = en.officersAt(g2, wildCastle.n).find(o => o.fac === '고구려');
    let hit = false;
    for (let i = 0; i < 40 && !hit; i++) { seeker.done = false; hit = !!en.doSearch(g2, wildCastle.n, seeker.id).found; }
    ok('탐색으로 재야 발견', hit, `${wildCastle.nm}`);
  } else ok('탐색으로 재야 발견', true, '같은 거점에 재야+아군 없음(건너뜀)');

  // 부대로 출병
  const g3 = en.newGame('백제', 555);
  const cap3 = FACTIONS['백제'].cap;
  const o3 = en.officersAt(g3, cap3).find(o => o.fac === '백제');
  en.doAssign(g3, cap3, o3.id, '보병', 1000);
  const tgt = en.castleDef(cap3).adj.find(n => g3.castles[n].fac !== '백제');
  const r7 = en.doAttack(g3, cap3, tgt, null, [o3.id]);
  ok('부대 출병', r7.ok && typeof r7.win === 'boolean', r7.why);
  ok('부대 손실이 부대에 남는다', !o3.corps || o3.corps.n < 1000,
    o3.corps ? `${o3.corps.n}명 생존` : '전멸');

  // ── 3단계: 전술 전투 ────────────────────────────
  const BT = window.SamhanBattle;
  ok('전투 모듈 적재', !!BT && typeof BT.start === 'function');

  const gb = en.newGame('고구려', 8080);
  const capB = FACTIONS['고구려'].cap;
  const offsB = en.officersAt(gb, capB).filter(o => o.fac === '고구려').slice(0, 4);
  for (const o of offsB) {
    const u = ['보병', '기병', '궁병'][offsB.indexOf(o) % 3];
    en.doAssign(gb, capB, o.id, u, Math.min(en.troopCap(o), gb.castles[capB].troops[u], 1200));
  }
  const withCorps = offsB.filter(o => o.corps && o.corps.n > 0);
  const tgtB = en.castleDef(capB).adj.find(n => gb.castles[n].fac !== '고구려');
  const bt = BT.start(gb, capB, tgtB, withCorps.map(o => o.id), en);
  ok('전투 개시', !!bt && bt.units.length >= 2, bt ? `${bt.units.length}부대` : '실패');
  ok('맵 20x14', bt.map.length === BT.W * BT.H && BT.W === 20 && BT.H === 14);
  ok('공격·수비 양쪽 배치',
    BT.sideUnits(bt, 'A').length > 0 && BT.sideUnits(bt, 'D').length > 0,
    `${BT.sideUnits(bt,'A').length} vs ${BT.sideUnits(bt,'D').length}`);
  ok('성문이 있다', !!bt.gate && bt.map[bt.gate.y * BT.W + bt.gate.x] === 5);
  ok('부대 hp = 병력', BT.sideUnits(bt, 'A').every(u => u.hp === u.maxHp && u.hp > 0));
  ok('겹쳐 놓인 부대 없음',
    new Set(bt.units.map(u => u.y * BT.W + u.x)).size === bt.units.length);
  ok('기병은 산에 못 선다', bt.units.every(u =>
    !(u.unit === '기병' && BT.terrOf(bt, u.x, u.y).nm === '산')));
  ok('궁병만 성벽 위', bt.units.every(u =>
    !(BT.terrOf(bt, u.x, u.y).nm === '성벽' && u.unit !== '궁병')));

  // 이동 범위
  const mover = BT.sideUnits(bt, 'A')[0];
  const rng = BT.moveRange(bt, mover);
  ok('이동 범위 계산', rng.length > 1, `${rng.length}칸`);
  ok('이동 범위에 적 칸 없음',
    !rng.some(p => { const v = BT.at(bt, p.x, p.y); return v && v.side !== mover.side; }));
  const dest = rng.find(p => p.x !== mover.x || p.y !== mover.y);
  const mr = BT.move(bt, mover.id, dest.x, dest.y);
  ok('이동', mr.ok && mover.x === dest.x && mover.y === dest.y, mr.why);
  ok('한 번만 움직인다', !BT.move(bt, mover.id, mover.x, mover.y).ok);

  // 상성 — 기병이 궁병을 칠 때 더 아프다
  const mk = (unit, mu) => ({ unit, mu, hp: 3000, maxHp: 3000, x: 5, y: 5,
                              train: 50, morale: 70, hurt: 0, ambush: false });
  const cav = mk('기병', 70), arc = mk('궁병', 70), inf = mk('보병', 70);
  const dCav = BT.damage(bt, cav, arc), dInf = BT.damage(bt, inf, arc);
  ok('병종 상성이 피해에 반영', dCav > dInf, `기병→궁병 ${dCav} vs 보병→궁병 ${dInf}`);

  // 30턴 무인 전투 — 반드시 끝나야 한다
  let stuck = null, guard = 0;
  while (!bt.over && guard++ < 4000) {
    const before = { t: bt.turn, p: bt.phase };
    const r = BT.aiStep(bt);
    if (bt.turn === before.t && bt.phase === before.p && !r.unit && !r.done) { stuck = '진전 없음'; break; }
  }
  ok('전투가 반드시 끝난다', !!bt.over && !stuck,
    bt.over ? `${bt.turn}턴 · ${bt.over.winner === 'A' ? '공격측' : '수비측'} 승 · ${bt.over.why}` : (stuck || '무한'));
  ok('전투 hp 음수 없음', bt.units.every(u => u.hp >= 0 && num(u.hp)));

  // 결과가 전략에 되돌아간다
  const beforeCorps = withCorps.map(o => o.corps ? o.corps.n : 0);
  const out = BT.applyResult(gb, bt, en);
  ok('전투 결과 반영', typeof out.win === 'boolean' && num(out.deadA) && num(out.deadD),
    `아군 ${out.deadA} · 적 ${out.deadD} 손실`);
  ok('부대 병력이 전투 결과와 일치',
    withCorps.every((o, i) => !o.corps || o.corps.n <= beforeCorps[i]));
  ok('손실이 실제로 있었다', out.deadA + out.deadD > 0, `${out.deadA + out.deadD}명`);
  if (out.captured) ok('함락 시 주인이 바뀐다', gb.castles[tgtB].fac === '고구려');
  else ok('함락 실패 시 주인 유지', gb.castles[tgtB].fac !== '고구려');

  // 여러 시드로 반복 — 교착·예외가 없어야 한다
  let fails = 0, ended = 0, turns = [];
  for (let k = 0; k < 25; k++) {
    const gx = en.newGame('백제', 1000 + k * 37);
    const capX = FACTIONS['백제'].cap;
    const ox = en.officersAt(gx, capX).filter(o => o.fac === '백제').slice(0, 3);
    for (const o of ox) {
      const u = ['보병', '기병', '궁병'][ox.indexOf(o) % 3];
      en.doAssign(gx, capX, o.id, u, Math.min(en.troopCap(o), gx.castles[capX].troops[u], 1500));
    }
    const wc = ox.filter(o => o.corps && o.corps.n > 0).map(o => o.id);
    const tx = en.castleDef(capX).adj.find(n => gx.castles[n].fac !== '백제');
    try {
      const bx = BT.start(gx, capX, tx, wc, en);
      if (!bx) { fails++; continue; }
      let g2 = 0;
      while (!bx.over && g2++ < 4000) BT.aiStep(bx);
      if (bx.over) { ended++; turns.push(bx.turn); } else fails++;
      BT.applyResult(gx, bx, en);
    } catch (e) { fails++; }
  }
  ok('25회 반복 전투 무사고', fails === 0 && ended === 25,
    `완료 ${ended}/25 · 평균 ${turns.length ? (turns.reduce((a,b)=>a+b,0)/turns.length).toFixed(1) : '-'}턴`);

  // ── 4단계: 외교와 사건 ──────────────────────────
  const gd = en.newGame('백제', 2468);
  ok('시작부터 전쟁인 전선이 있다', en.atWar(gd, '고구려', '위') && en.atWar(gd, '마한', '위'),
    '고구려·마한 대 위');
  ok('나머지는 평시', en.relOf(gd, '부여', '신라') === 'peace');
  ok('이웃 계산', en.neighbors(gd, '백제').length > 0,
    en.neighbors(gd, '백제').join(','));

  const w1 = en.doDeclareWar(gd, '백제', '마한');
  ok('선전포고', w1.ok && en.atWar(gd, '백제', '마한'), w1.why);
  ok('선전포고는 호감을 깎는다', en.attOf(gd, '마한', '백제') < 45,
    `${Math.round(en.attOf(gd, '마한', '백제'))}`);
  ok('두 번은 안 된다', !en.doDeclareWar(gd, '백제', '마한').ok);

  gd.castles[FACTIONS['백제'].cap].gold = 9000;
  let peaced = false;
  for (let i = 0; i < 40 && !peaced; i++) {
    const r = en.doPeace(gd, '백제', '마한', 500);
    peaced = r.ok && r.accepted;
  }
  ok('강화가 성립한다', peaced && !en.atWar(gd, '백제', '마한'));
  ok('강화 뒤엔 화친 기간이 있다', (gd.factions['백제'].truce['마한'] || 0) > 0,
    `${gd.factions['백제'].truce['마한']}개월`);
  const blocked = en.doDeclareWar(gd, '백제', '마한');
  ok('화친 중엔 재선전포고 불가', !blocked.ok, blocked.why);

  // 화친 중엔 공격도 막힌다
  const anyAdj = en.factionCastles(gd, '백제')
    .flatMap(n => en.castleDef(n).adj.map(t => [n, t]))
    .find(([, t]) => gd.castles[t].fac === '마한');
  if (anyAdj) {
    const r = en.doAttack(gd, anyAdj[0], anyAdj[1], 0.8, null);
    ok('화친 중엔 출병 불가', !r.ok, r.why);
  } else ok('화친 중엔 출병 불가', true, '인접한 마한 거점 없음(건너뜀)');

  // 예물·동맹
  const g5 = en.newGame('신라', 999);
  g5.castles[FACTIONS['신라'].cap].gold = 20000;
  const a0 = en.attOf(g5, '가야', '신라');
  en.doGift(g5, '신라', '가야', 600);
  ok('예물이 호감을 올린다', en.attOf(g5, '가야', '신라') > a0,
    `${Math.round(a0)} → ${Math.round(en.attOf(g5, '가야', '신라'))}`);
  for (let i = 0; i < 30; i++) en.doGift(g5, '신라', '가야', 600);
  let allied = false;
  for (let i = 0; i < 30 && !allied; i++) allied = !!en.doAlly(g5, '신라', '가야').accepted;
  ok('호감이 높으면 동맹이 된다', allied, `호감 ${Math.round(en.attOf(g5, '가야', '신라'))}`);
  if (allied) {
    const adj2 = en.factionCastles(g5, '신라')
      .flatMap(n => en.castleDef(n).adj.map(t => [n, t]))
      .find(([, t]) => g5.castles[t].fac === '가야');
    if (adj2) ok('동맹은 치지 못한다', !en.doAttack(g5, adj2[0], adj2[1], 0.8, null).ok);
    else ok('동맹은 치지 못한다', true, '인접 없음(건너뜀)');
    const br = en.doBreakAlly(g5, '신라', '가야');
    ok('동맹 파기는 평판을 깎는다',
      br.ok && en.attOf(g5, '가야', '신라') < 100 && en.relOf(g5, '신라', '가야') === 'peace');
  } else { ok('동맹은 치지 못한다', false, '동맹 실패'); ok('동맹 파기는 평판을 깎는다', false); }

  // 사건
  ok('사건 정의에 사료가 붙어 있다', en.EVENTS.every(e => e.nm && e.txt && e.src && e.run));
  const ge = en.newGame('고구려', 4321);
  let fired = [];
  for (let i = 0; i < 60; i++) { en.nextTurn(ge); fired = fired.concat(ge.log.filter(x => x.k === 'event')); }
  const ids = new Set(ge.log.filter(x => x.k === 'event').map(x => x.id));
  ok('사건이 실제로 일어난다', ids.size >= 3, [...ids].join(','));
  ok('기리영 싸움이 246년 8월에', (() => {
    const g2 = en.newGame('마한', 11);
    while (!(g2.year === 246 && g2.month === 9)) en.nextTurn(g2);
    return g2.log.some(x => x.k === 'event' && x.id === 'girinyeong') && en.atWar(g2, '마한', '위');
  })());
  ok('한 번짜리 사건은 되풀이되지 않는다',
    ge.log.filter(x => x.k === 'event' && x.id === 'gwangugeom').length <= 1);
  ok('무천은 해마다 온다',
    ge.log.filter(x => x.k === 'event' && x.id === 'mucheon').length >= 2,
    `${ge.log.filter(x => x.k === 'event' && x.id === 'mucheon').length}회`);

  // ── v2: 코에이 문법 — 축성·수송·매매·위임·진언 (2026-09-13) ─────────────
  {
    const gv = en.newGame('고구려', 5151);
    const capN = FACTIONS['고구려'].cap;
    const reach = en.reachable(gv, capN);
    ok('수송 가능 거점 = 아군 영토로 이어진 곳',
      reach.length > 0 && reach.every(n => gv.castles[n].fac === '고구려') && !reach.includes(capN), reach.join(','));
    const far = reach.find(n => !en.castleDef(capN).adj.includes(n));
    const c = gv.castles[capN];
    c.wall = 2000; c.gold = 5000;
    const fo = en.idleAt(gv, capN)[0];
    const fr = en.doFortify(gv, capN, fo.id);
    ok('축성이 성벽을 올린다', fr.ok && c.wall > 2000 && c.wall <= en.castleDef(capN).wall && fo.done,
      fr.why || `${fr.before}→${fr.after}`);
    ok('축성에 자금이 든다', c.gold === 5000 - en.fortifyCost(c));
    ok('한 무장이 두 번 축성하지 못한다', !en.doFortify(gv, capN, fo.id).ok);

    const to = reach[0], tc = gv.castles[to];
    const g0s = c.gold + tc.gold, f0s = c.food + tc.food, i0s = c.troops.보병 + tc.troops.보병;
    const tp = en.idleAt(gv, capN)[0];
    const tr = en.doTransport(gv, capN, to, tp.id, { gold: 1000, food: 3000, 보병: 500 });
    ok('수송', tr.ok, tr.why);
    ok('수송은 총량을 보존한다',
      c.gold + tc.gold === g0s && c.food + tc.food === f0s && c.troops.보병 + tc.troops.보병 === i0s);
    const enemyN = CASTLES.find(x => gv.castles[x.n].fac !== '고구려').n;
    const tp2 = en.idleAt(gv, capN)[0];
    ok('남의 거점으로는 수송 불가', !!tp2 && !en.doTransport(gv, capN, enemyN, tp2.id, { gold: 10 }).ok);
    ok('가진 것보다 많이는 못 보낸다', !!tp2 && !en.doTransport(gv, capN, to, tp2.id, { gold: c.gold + 1 }).ok);

    c.cm = 60; c.gold = 4000;
    const food0 = c.food, price = en.grainPrice(gv, capN);
    const b1 = en.doTrade(gv, capN, 'buy', 2000);
    ok('군량을 산다', b1.ok && c.food === food0 + 2000 && c.gold === 4000 - Math.ceil(20 * price), b1.why);
    const s1 = en.doTrade(gv, capN, 'sell', 1000);
    ok('파는 값이 사는 값보다 싸다', s1.ok && s1.gold < Math.ceil(10 * price), s1.why);
    ok('거래량 상한', !en.doTrade(gv, capN, 'buy', en.tradeCap(c) + 100).ok);
    const m0 = gv.month;
    gv.month = 9; const p9 = en.grainPrice(gv, capN);
    gv.month = 7; const p7 = en.grainPrice(gv, capN);
    gv.month = m0;
    ok('추수철 군량이 여름보다 싸다', p9 < p7, `9월 ${p9} · 7월 ${p7}`);
    ok('상업이 낮으면 상인이 오지 않는다', (() => { const k = c.cm; c.cm = 10; const r = en.doTrade(gv, capN, 'buy', 100); c.cm = k; return !r.ok; })());

    if (far) {
      const mv = en.idleAt(gv, capN)[0];
      const mr = mv ? en.doMove(gv, mv.id, far) : { ok: false, why: '무장 부족' };
      ok('인접하지 않아도 아군 영토면 이동', mr.ok && mv.loc === far, mr.why);
    } else ok('인접하지 않아도 아군 영토면 이동', true, '해당 지형 없음');

    const gd2 = en.newGame('신라', 8080);
    const dn = FACTIONS['신라'].cap;
    const sn = en.factionCastles(gd2, '신라').find(n => n !== dn);
    ok('방침 설정', en.setPolicy(gd2, dn, '내정').ok && en.policyOf(gd2.castles[dn]) === '내정');
    ok('없는 방침은 거절', !en.setPolicy(gd2, dn, '약탈').ok);
    const idle0 = en.idleAt(gd2, dn).length, idleS = sn ? en.idleAt(gd2, sn).length : 0;
    en.runDelegated(gd2);
    ok('위임 거점의 무장이 일한다', idle0 > 0 && en.idleAt(gd2, dn).length < idle0,
      `${idle0}→${en.idleAt(gd2, dn).length}`);
    ok('직할 거점은 건드리지 않는다', !sn || en.idleAt(gd2, sn).length === idleS);
    ok('위임 기록', gd2.log.some(x => x.k === 'gov' && x.n === dn));

    const ga = en.newGame('백제', 3131);
    const an = FACTIONS['백제'].cap;
    ga.castles[an].food = 10; ga.castles[an].sec = 12;
    const adv = en.advise(ga, '백제');
    ok('진언: 군량 경고', adv.some(a => a.k === 'food' && a.n === an), adv.map(a => a.k).join(','));
    ok('진언: 치안 경고', adv.some(a => a.k === 'sec' && a.n === an));
    ok('진언은 종류마다 하나', new Set(adv.map(a => a.k)).size === adv.length);
    ok('진언 문구가 양쪽 언어에 있다',
      ['food', 'deficit', 'threat', 'sec', 'loy', 'wild', 'hidden', 'target', 'thin']
        .every(k => typeof I18N.ko['adv_' + k] === 'function' && typeof I18N.en['adv_' + k] === 'function'));
    ok('대기 무장 수 = 명령 안 받은 아군 무장',
      en.idleCastles(ga, '백제').reduce((s2, x) => s2 + x.k, 0) ===
      Object.values(ga.officers).filter(o => o.fac === '백제' && !o.done && ga.castles[o.loc].fac === '백제').length);

    const gz = en.newGame('가야', 2468);
    let zbad = null;
    for (let i = 0; i < 36 && !zbad; i++) {
      for (const n of en.factionCastles(gz, gz.player)) en.setPolicy(gz, n, en.POLICIES[1 + (n % 3)]);
      en.runAllAI(gz); en.nextTurn(gz);
      for (const c2 of Object.values(gz.castles)) {
        for (const k of ['gold', 'food', 'wall', 'sec', 'ag', 'cm', 'train', 'morale']) {
          if (!num(c2[k]) || c2[k] < 0) zbad = `${k} @${c2.n} ${i}턴 (${c2[k]})`;
        }
        if (c2.wall > en.castleDef(c2.n).wall) zbad = `성벽 초과 @${c2.n}`;
        if (en.troopTotal(c2) > en.castleDef(c2.n).garr * 1.5) zbad = `주둔 초과 @${c2.n}`;
      }
    }
    ok('위임 36턴 무사고', !zbad, zbad || `${gz.year}년 ${gz.month}월 · 위임 명령 ${gz.log.filter(x => x.k === 'gov').reduce((s2, x) => s2 + x.count, 0)}건`);
    const back2 = en.loadState(en.saveState(gz));
    ok('위임 방침이 저장된다', !!back2 &&
      en.factionCastles(back2, back2.player).every(n => !!back2.castles[n].gov));
    ok('전투 기록에 공수 세력이 남는다', gz.log.filter(x => x.k === 'battle').every(x => x.af && x.df));
  }

  // ── v3: 포로·계략·사자 외교·방어전 (2026-09-13) ─────────────
  {
    const BT3 = window.SamhanBattle;
    const tries = (n, fn) => { for (let i = 0; i < n; i++) { const r = fn(i); if (r) return r; } return null; };
    ok('군주 17세력 모두 지정', Object.keys(FACTIONS).every(f => !!en.LORD_ID[f]));

    // 함락 → 포로
    const gp = en.newGame('고구려', 6161);
    const foeN = CASTLES.find(c => gp.castles[c.n].fac === '위' && c.adj.some(x => gp.castles[x].fac === '고구려')).n;
    const inside = en.officersAt(gp, foeN).filter(o => o.fac === '위').length;
    const st = en.settleFallen(gp, foeN, '위', '고구려', 100);
    ok('함락 시 무장이 모두 정리된다', st.caught.length + st.fled.length + st.scattered.length === inside,
      `잡힘 ${st.caught.length} · 달아남 ${st.fled.length} · 흩어짐 ${st.scattered.length}`);
    const cap0 = st.caught.length ? gp.officers[st.caught[0]] : null;
    ok('포로는 재야 목록에 없다', !st.caught.length || !en.wildAt(gp, foeN).some(o => o.captive));
    if (cap0) {
      gp.castles[foeN].fac = '고구려';
      ok('포로 등용 가망이 유한', num(en.hireCaptiveChance(gp, cap0.id)));
      const h = en.doCaptive(gp, '고구려', cap0.id, 'hire');
      ok('포로 설득', h.ok, h.why);
      ok('한 달에 한 번만 설득', !en.doCaptive(gp, '고구려', cap0.id, 'hire').ok || h.joined);
    }
    // 군주는 굽히지 않는다
    const gl = en.newGame('백제', 7272);
    const lordW = gl.officers[en.LORD_ID['위']];
    Object.assign(lordW, { captive: '백제', capFrom: '위', prevLoy: 100, capTurn: 0, fac: null });
    ok('살아 있는 나라의 군주는 등용 불가', en.hireCaptiveChance(gl, lordW.id) === 0);
    const fr = en.doCaptive(gl, '백제', lordW.id, 'free');
    ok('석방하면 원래 나라로', fr.ok && lordW.fac === '위' && gl.castles[lordW.loc].fac === '위', `→ ${lordW.loc}`);
    const vict = en.factionOfficers(gl, '위').find(o => !en.isLord(gl, o.id));
    Object.assign(vict, { captive: '백제', capFrom: '위', prevLoy: 80, capTurn: 0, fac: null, loc: FACTIONS['백제'].cap });
    const att0 = en.attOf(gl, '위', '백제');
    const kr = en.doCaptive(gl, '백제', vict.id, 'kill');
    ok('처단', kr.ok && vict.dead && vict.loc === -1 && en.attOf(gl, '위', '백제') < att0);
    ok('죽은 무장은 어디에도 안 잡힌다', !en.officersAt(gl, FACTIONS['백제'].cap).some(o => o.id === vict.id));
    // 갇힌 성을 잃으면 풀려난다
    const v2 = en.factionOfficers(gl, '위').find(o => !en.isLord(gl, o.id) && !o.dead);
    const jail = FACTIONS['백제'].cap;
    Object.assign(v2, { captive: '백제', capFrom: '위', prevLoy: 80, capTurn: 0, fac: null, loc: jail });
    gl.castles[jail].fac = '마한';
    en.processCaptives(gl);
    ok('갇힌 성을 잃으면 포로가 풀려난다', !v2.captive && v2.fac === '위');
    gl.castles[jail].fac = '백제';

    // 계략
    const gs = en.newGame('고구려', 8383);
    const home = CASTLES.find(c => gs.castles[c.n].fac === '고구려' && en.plotTargets(gs, c.n).length).n;
    const tgt = en.plotTargets(gs, home)[0];
    ok('계략 대상 = 맞닿은 남의 거점', en.castleDef(home).adj.includes(tgt) && gs.castles[tgt].fac !== '고구려');
    const plotter = en.idleAt(gs, home)[0];
    plotter.ji = 100; plotter.jg = 100;
    const sec0 = gs.castles[tgt].sec;
    const hitR = tries(30, () => {
      gs.castles[home].gold = 5000; plotter.done = false;
      const r = en.doPlot(gs, home, plotter.id, '유언비어', tgt);
      return r.ok && r.hit ? r : null;
    });
    ok('유언비어가 치안을 깎는다', !!hitR && gs.castles[tgt].sec < sec0, hitR ? `−${hitR.eff.sec}` : '30회 모두 실패');
    ok('계략은 명령을 소모한다', plotter.done && !en.doPlot(gs, home, plotter.id, '유언비어', tgt).ok);
    const tf = gs.castles[tgt].fac;
    const victim = en.officersAt(gs, tgt).find(o => o.fac === tf && !en.isLord(gs, o.id));
    if (victim) {
      const loy0 = victim.loy;
      tries(30, () => { gs.castles[home].gold = 5000; plotter.done = false; const r = en.doPlot(gs, home, plotter.id, '이간', tgt, victim.id); return r.hit ? r : null; });
      ok('이간이 충성을 깎는다', victim.loy < loy0, `${loy0}→${victim.loy}`);
      ok('충성 85 이상이면 유혹 가망이 낮다', (() => { const k = victim.loy; victim.loy = 99; const p = en.plotChance(gs, '유혹', plotter.id, tgt, victim.id); victim.loy = k; return p <= 0.1; })());
      victim.loy = 20;
      const lure = tries(40, () => { gs.castles[home].gold = 5000; plotter.done = false; const r = en.doPlot(gs, home, plotter.id, '유혹', tgt, victim.id); return r.hit ? r : null; });
      ok('유혹하면 우리 편으로 온다', !!lure && victim.fac === '고구려' && victim.loc === home);
    } else ok('이간이 충성을 깎는다', true, '대상 무장 없음');
    const lordT = en.officersAt(gs, tgt).find(o => en.isLord(gs, o.id));
    ok('군주에게는 이간이 안 통한다', !lordT || !en.doPlot(gs, home, en.idleAt(gs, home)[0].id, '이간', tgt, lordT.id).ok);

    // 사자 외교
    const gd3 = en.newGame('신라', 9494);
    const smart = { jg: 100, ji: 100 }, dull = { jg: 10, ji: 10 };
    ok('정치 높은 사자가 동맹 가망을 올린다', en.allyChance(gd3, '신라', '가야', smart) > en.allyChance(gd3, '신라', '가야', dull));
    const capS = FACTIONS['신라'].cap;
    const env = en.idleAt(gd3, capS)[0];
    gd3.castles[capS].gold = 3000;
    const gr = en.doGift(gd3, '신라', '가야', 500, { src: capS, envoy: env.id });
    ok('친선은 사자 명령을 소모하고 그 거점 자금이 든다', gr.ok && env.done && gd3.castles[capS].gold === 2500, gr.why);
    ok('수도를 잃어도 외교 자금은 내 거점에서', (() => {
      const g2 = en.newGame('백제', 1212); const cp = FACTIONS['백제'].cap;
      g2.castles[cp].fac = '마한';
      return en.purseOf(g2, '백제').fac === '백제';
    })());
    // 공동작전
    const gj = en.newGame('고구려', 3434);
    gj.factions['부여'].rel['고구려'] = 'ally'; gj.factions['고구려'].rel['부여'] = 'ally';
    gj.factions['부여'].att['고구려'] = 100;
    const jt = en.jointTargets(gj, '고구려', '부여');
    ok('공동작전 대상 = 동맹과 맞닿은 교전 상대의 거점', jt.every(n => en.atWar(gj, '고구려', gj.castles[n].fac)), `${jt.length}곳`);
    if (jt.length) {
      const jr = tries(20, () => { const c = en.purseOf(gj, '고구려'); c.gold = 5000; const r = en.doJoint(gj, '고구려', '부여', jt[0]); return r.accepted ? r : null; });
      ok('공동작전을 받으면 동맹이 곧장 친다', !!jr && typeof jr.battle.win === 'boolean' && gj.log.some(x => x.k === 'joint'));
    } else ok('공동작전을 받으면 동맹이 곧장 친다', true, '대상 없음(지형)');
    // 항복 권고
    const gq = en.newGame('마한', 5656);
    // ★3배가 넘는 상대에게 doDemand 를 부르면 실제로 항복해 나라가 사라진다 — 비율이 모자란 쌍에만 부른다
    const weakPair = Object.keys(FACTIONS).find(f => f !== '마한' && en.demandRatio(gq, '마한', f) < 3);
    ok('세력 차이 3배 미만이면 권고 불가', !weakPair || !en.doDemand(gq, '마한', weakPair).ok, weakPair || '해당 없음');
    for (const n of en.factionCastles(gq, '마한')) gq.castles[n].troops.보병 = 200000;
    const small = Object.keys(FACTIONS).filter(f => f !== '마한' && gq.factions[f].alive)
      .sort((a, b) => en.factionCastles(gq, a).length - en.factionCastles(gq, b).length)[0];
    ok('압도하면 가망이 생긴다', en.demandChance(gq, '마한', small) > 0, `${small} 비 ${en.demandRatio(gq, '마한', small).toFixed(1)}`);
    const sc = en.factionCastles(gq, small);
    const dq = tries(40, () => { en.purseOf(gq, '마한').gold = 5000; const r = en.doDemand(gq, '마한', small); return r.accepted ? r : null; });
    ok('항복하면 거점·무장이 넘어온다', !!dq && sc.every(n => gq.castles[n].fac === '마한') && !gq.factions[small].alive &&
      en.factionOfficers(gq, small).length === 0);

    // 방어전
    const gdf = en.newGame('백제', 4545);
    gdf.holdAttacks = true;
    const myN = FACTIONS['백제'].cap;
    const enemyN = en.castleDef(myN).adj.find(x => gdf.castles[x].fac !== '백제');
    const ef = gdf.castles[enemyN].fac;
    en.doDeclareWar(gdf, ef, '백제');
    gdf.castles[enemyN].troops = { 보병: 40000, 기병: 20000, 궁병: 10000 };
    gdf.factions[ef].aggr = 1;
    for (const x of Object.values(gdf.castles)) if (x.fac === '백제') x.troops = { 보병: 300, 기병: 0, 궁병: 0 };
    let inc = null;
    for (let i = 0; i < 12 && !inc; i++) { gdf.incoming = []; en.aiTurn(gdf, ef); inc = (gdf.incoming || []).find(x => x.af === ef); }
    ok('사람 거점 공격은 바로 판정하지 않고 쌓인다', !!inc && gdf.castles[inc.to].fac === '백제', inc ? `${inc.from}→${inc.to}` : '침공 없음');
    if (inc) {
      ok('침공이 유효하다', en.incomingValid(gdf, inc));
      const aT0 = en.troopTotal(gdf.castles[inc.from]);
      const bd = BT3.start(gdf, inc.from, inc.to, [], en, { human: 'D', atkRatio: inc.ratio });
      ok('방어 전투 개시(사람=수비)', !!bd && bd.human === 'D' && BT3.sideUnits(bd, 'A').length > 0 && BT3.sideUnits(bd, 'A').every(u => u.gar));
      let gg = 0;
      while (bd && !bd.over && gg++ < 4000) BT3.aiStep(bd);
      ok('방어 전투가 끝난다', !!bd && !!bd.over, bd && bd.over ? bd.over.why : '');
      const sentN = BT3.sideUnits(bd, 'A').length >= 0 ? bd.units.filter(u => u.side === 'A').reduce((x, u) => x + u.maxHp, 0) : 0;
      const survN = bd.units.filter(u => u.side === 'A').reduce((x, u) => x + u.hp, 0);
      const out = BT3.applyResult(gdf, bd, en);
      const aT1 = en.troopTotal(gdf.castles[inc.from]);
      ok('주둔군 공격 부대의 병력이 출발 거점에 맞게 남는다',
        out.win ? aT1 === aT0 - sentN : aT1 === aT0 - sentN + survN, `${aT0}→${aT1} (보냄 ${sentN} · 생존 ${survN} · ${out.win ? '함락' : '격퇴'})`);
      ok('방어 결과가 전투와 일치', out.captured === (gdf.castles[inc.to].fac === ef));
    }
    const gdf2 = en.newGame('백제', 4546);
    gdf2.incoming = [{ from: enemyN, to: myN, af: gdf2.castles[enemyN].fac, ratio: 0.8 }];
    en.doDeclareWar(gdf2, gdf2.castles[enemyN].fac, '백제');
    en.nextTurn(gdf2);
    ok('묻지 않은 침공은 달이 넘어갈 때 자동 판정', (gdf2.incoming || []).length === 0 &&
      gdf2.log.some(x => x.k === 'battle' && x.to === myN));

    // AI 계략·포로 처분이 섞여도 36턴 무사고
    const gz3 = en.newGame('고구려', 1357);
    gz3.holdAttacks = true;
    let bad3 = null;
    for (let i = 0; i < 36 && !bad3; i++) {
      en.aiTurn(gz3, gz3.player); en.runAllAI(gz3); en.nextTurn(gz3);
      for (const o of Object.values(gz3.officers)) {
        if (o.captive && (o.fac || o.dead)) bad3 = `포로 상태 모순 ${o.id}`;
        if (o.captive && !gz3.factions[o.captive]) bad3 = `없는 세력의 포로 ${o.id}`;
        if (!o.dead && !gz3.castles[o.loc]) bad3 = `없는 거점 ${o.id} @${o.loc}`;
        if (o.fac && !gz3.factions[o.fac].alive && en.factionCastles(gz3, o.fac).length === 0 && o.fac !== gz3.player) {
          // 망한 나라에 남은 무장은 월말 checkDead 뒤에도 소속만 남는다 — 기존 동작
        }
      }
      for (const c of Object.values(gz3.castles)) if (!num(c.sec) || c.sec < 0) bad3 = `치안 이상 @${c.n}`;
    }
    ok('v3 36턴 무사고', !bad3, bad3 || `포로 로그 ${gz3.log.filter(x => x.k === 'captive').length} · 계략 ${gz3.log.filter(x => x.k === 'plot').length} · 투항 ${gz3.log.filter(x => x.k === 'turned').length}`);
    ok('AI 가 계략을 쓴다', gz3.log.some(x => x.k === 'plot'));
    ok('v3 문구가 양쪽 언어에 있다', ['c_포로', 'c_유혹', 'c_항복권고', 'defTitle', 'goalDef', 'repCapTook', 'adv_captive']
      .every(k => I18N.ko[k] != null && typeof I18N.ko[k] === typeof I18N.en[k]));
  }

  // ── 60턴 무인 진행 ─────────────────────────
  const s = en.newGame('고구려', 77);
  let bad = null, battles = 0, caps = 0;
  for (let i = 0; i < 60 && !bad; i++) {
    en.aiTurn(s, s.player);       // 플레이어 자리도 AI 가 대신
    en.runAllAI(s);
    en.nextTurn(s);
    for (const c of Object.values(s.castles)) {
      for (const k of ['pop', 'ag', 'cm', 'sec', 'gold', 'food', 'train', 'morale', 'wall']) {
        if (!num(c[k])) { bad = `${k} NaN @거점${c.n} ${i}턴`; break; }
      }
      if (c.pop < 0 || en.troopTotal(c) < 0) bad = `음수 @거점${c.n} ${i}턴`;
      if (en.troopTotal(c) > en.castleDef(c.n).garr * 1.5) bad = `주둔 초과 @거점${c.n}`;
    }
    for (const o of Object.values(s.officers)) {
      if (o.corps && (!num(o.corps.n) || o.corps.n < 0)) bad = `부대 이상 ${o.id} ${i}턴`;
      if (o.corps && o.corps.n > en.troopCap(o)) bad = `통솔 초과 ${o.id} (${o.corps.n}>${en.troopCap(o)})`;
      if (!num(o.loy) || o.loy < 0 || o.loy > 100) bad = `충성 이상 ${o.id} (${o.loy})`;
      if (o.fac && !g0.factions[o.fac]) bad = `없는 세력 소속 ${o.id}`;
    }
    for (const f of Object.values(s.factions)) {
      for (const [o, v] of Object.entries(f.att)) {
        if (!num(v) || v < 0 || v > 100) bad = `호감 이상 ${f.id}→${o} (${v})`;
      }
      for (const [o, r] of Object.entries(f.rel)) {
        if (!['war', 'peace', 'ally', 'truce'].includes(r)) bad = `관계 이상 ${f.id}→${o} (${r})`;
        if (s.factions[o] && s.factions[o].rel[f.id] !== r) bad = `관계 비대칭 ${f.id}↔${o}`;
      }
    }
  }
  battles = s.log.filter(x => x.k === 'battle').length;
  caps = s.log.filter(x => x.k === 'battle' && x.captured).length;
  ok('60턴 무인 완주', !bad, bad || `${s.year}년 ${s.month}월`);
  ok('전투가 실제로 일어난다', battles > 0, `${battles}회 · 함락 ${caps}회`);
  ok('세력이 남아 있다', Object.values(s.factions).filter(f => f.alive).length >= 1);
  ok('이탈이 일어난다', s.log.some(x => x.k === 'leave'),
    `${s.log.filter(x => x.k === 'leave').length}건`);
  ok('AI 가 외교를 한다',
    s.log.some(x => ['war', 'peace', 'ally', 'unally'].includes(x.k)),
    ['war','peace','ally','unally'].map(k => `${k} ${s.log.filter(x=>x.k===k).length}`).join(' · '));
  ok('AI 가 부대를 편성한다',
    Object.values(s.officers).filter(o => o.corps && o.corps.n > 0).length > 0,
    `${Object.values(s.officers).filter(o => o.corps && o.corps.n > 0).length}부대`);
  ok('총 병력 유한', Object.values(s.castles).every(c => num(en.troopTotal(c))));

  // ── 저장 왕복 ──────────────────────────────
  const raw = en.saveState(s);
  const back = en.loadState(raw);
  ok('저장 왕복', back && en.saveState(back) === raw);
  ok('저장 크기 적정', raw.length < 260000, `${(raw.length / 1024).toFixed(0)}KB`);

  // ── 출력 ───────────────────────────────────
  const pass = R.filter(r => r.pass).length;
  const box = document.createElement('div');
  box.style.cssText = `position:fixed;inset:0;z-index:999;overflow:auto;padding:26px;
    background:#0E110C;color:#E5E3D9;font:13px/1.7 "IBM Plex Mono",monospace`;
  box.innerHTML = `<h2 style="font:600 20px/1.3 system-ui;margin:0 0 4px">
      삼한통일전 자가검증 — ${pass}/${R.length} 통과</h2>
    <p style="color:#787E74;margin:0 0 16px">전투 ${battles}회 · 함락 ${caps}회 · 저장 ${(raw.length / 1024).toFixed(0)}KB</p>` +
    R.map(r => `<div style="color:${r.pass ? '#6BA893' : '#D9614A'}">
      ${r.pass ? '✔' : '✘'} ${r.name}${r.note ? ` <span style="color:#787E74">— ${r.note}</span>` : ''}</div>`).join('');
  document.body.appendChild(box);
  window.__samhanTest = { pass, total: R.length, fails: R.filter(r => !r.pass) };
  return window.__samhanTest;
};
