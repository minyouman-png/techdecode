/* ============================================================
   조스 오브 파이터즈 — 화면 흐름(타이틀·선택·대전·결과)과 자가검증

   ★모든 대전은 1:1 이다. 내가 고른 한 명으로, 나머지는 전부 CPU 가 잡는다.
     · 아케이드 — 내 캐릭터로 나머지 아홉 명을 차례로 상대한다(진도가 저장된다)
     · 한 판 대전 — 상대와 무대를 직접 고른다
     · 연습 — 상대가 가만히 서 있는다(커맨드 익히기)
     · 둘이서 — 같은 키보드로 두 사람이(있으면 좋으니 넣어 둔다)
   ============================================================ */
(function () {
'use strict';

var FA = window.FIGHTANIM, CHARS = window.CHARS, STAGES = window.STAGES, J = window.JOSS;
var SAVE_KEY = 'joss_fighters_v1';
var SAVE = { cleared: {}, best: {}, level: 'hard' };

var UI = {
  mode: 'arcade',
  myIdx: 0, oppIdx: 1, stageIdx: 0,
  arcade: null,      // {order:[…], step:0}
  step: 'char',      // char | opp | stage
};

function $(id) { return document.getElementById(id); }

function loadSave() {
  try {
    var d = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    SAVE.cleared = d.cleared || {};
    SAVE.best = d.best || {};
    SAVE.level = d.level || 'hard';
  } catch (e) {}
  J.setLevel(SAVE.level);
}
function storeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {}
}

/* ---------- 화면 전환 ---------- */
var SCREENS = ['title', 'select', 'result', 'pause', 'movelist'];
function show(id) {
  SCREENS.forEach(function (s) { if ($(s)) $(s).style.display = 'none'; });
  if (id && $(id)) $(id).style.display = 'flex';
  document.body.classList.toggle('fighting', !id);
}

/* ---------- 초상 그리기 ---------- */
function portrait(canvas, ch, pose) {
  var c = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  c.clearRect(0, 0, w, h);
  c.save();
  var s = Math.min(w / 110, h / 150);
  c.translate(w / 2, h - 8);
  c.scale(s, s);
  FA.drawFighter(c, 0, 0, 1, ch, pose || FA.poseAt('idle', 0, true), {});
  if (ch.propDraw) {
    var hp = FA.handPos(pose || FA.poseAt('idle', 0, true), 1, ch.scale);
    c.save(); c.translate(hp.x, hp.y); c.scale(ch.scale, ch.scale);
    ch.propDraw(c, ch.col); c.restore();
  }
  c.restore();
}

/* ---------- 캐릭터 선택 ---------- */
function buildGrid(box, onPick, markCleared) {
  box.innerHTML = '';
  CHARS.forEach(function (ch, i) {
    var b = document.createElement('button');
    b.className = 'charbtn';
    b.setAttribute('data-key', ch.key);
    var cvs = document.createElement('canvas');
    cvs.width = 108; cvs.height = 132;
    b.appendChild(cvs);
    var nm = document.createElement('span');
    nm.className = 'cname';
    nm.innerHTML = ch.name + '<i>' + ch.job + '</i>';
    b.appendChild(nm);
    if (markCleared && SAVE.cleared[ch.key]) b.classList.add('done');
    b.addEventListener('click', function () { onPick(i); });
    b.addEventListener('mouseenter', function () { showProfile(i); });
    box.appendChild(b);
    portrait(cvs, ch);
  });
}

function showProfile(i) {
  var ch = CHARS[i];
  if (!$('pf')) return;
  $('pfName').innerHTML = ch.name + ' <span>' + ch.job + '</span>';
  $('pfTag').textContent = '"' + ch.cry + '"  — ' + ch.tag;
  $('pfDesc').textContent = ch.desc;
  $('pfStat').innerHTML =
    stat('체력', ch.hp, 900, 1180) + stat('속도', ch.walk, 1.8, 3.2) +
    stat('점프', ch.jump, 11.8, 15.2) + stat('무게', ch.weight, 0.82, 1.4);
  $('pfMoves').innerHTML = ch.specials.map(function (sp) {
    return '<div class="mv"><b>' + sp.name + '</b><code>' + cmdText(sp.cmd) + '</code><i>' + sp.note + '</i></div>';
  }).join('') +
    '<div class="mv super"><b>초필살기 · ' + ch.super.name + '</b><code>' + cmdText(ch.super.cmd) +
    '</code><i>' + ch.super.note + ' (게이지 가득)</i></div>';
}
function stat(label, v, lo, hi) {
  var p = Math.round((v - lo) / (hi - lo) * 100);
  return '<div class="st"><span>' + label + '</span><em><i style="width:' + Math.max(6, Math.min(100, p)) + '%"></i></em></div>';
}
var ARROW = { '2': '↓', '3': '↘', '6': '→', '1': '↙', '4': '←', '8': '↑' };
function cmdText(cmd) {
  var motion = cmd.slice(0, -1), btn = cmd.slice(-1);
  var s = motion.split('').map(function (d) { return ARROW[d] || d; }).join('');
  return s + ' + ' + (btn === 'P' ? '손' : '발');
}

/* ---------- 기술표 ---------- */
function buildMoveList(ch) {
  var N = ch.normals;
  var rows = [
    ['약손', 'J', N.lp], ['강손', 'K', N.hp], ['약발', 'U', N.lk], ['강발', 'I', N.hk],
    ['앉아 약손', '↓ + J', N.clp], ['앉아 하단차기', '↓ + U', N.clk], ['다리 후리기', '↓ + I', N.chk],
    ['점프 손', '↑ 중 J', N.jp], ['점프 발', '↑ 중 U', N.jk],
  ];
  var html = '<h3>' + ch.name + ' · ' + ch.job + '</h3><table><tr><th>기술</th><th>입력</th><th>발생</th><th>위력</th></tr>';
  rows.forEach(function (r) {
    html += '<tr><td>' + r[0] + '</td><td><code>' + r[1] + '</code></td><td>' + r[2].startup +
      'F</td><td>' + r[2].dmg + '</td></tr>';
  });
  html += '</table><h4>필살기</h4><table><tr><th>기술</th><th>커맨드</th><th>설명</th></tr>';
  ch.specials.forEach(function (sp) {
    html += '<tr><td>' + sp.name + '</td><td><code>' + cmdText(sp.cmd) + '</code></td><td class="nt">' + sp.note + '</td></tr>';
  });
  html += '<tr class="sup"><td>' + ch.super.name + '</td><td><code>' + cmdText(ch.super.cmd) +
    '</code></td><td class="nt">' + ch.super.note + ' · 게이지 100%</td></tr></table>';
  return html;
}

/* ---------- 대전 시작 ---------- */
function beginMatch(myIdx, oppIdx, stageIdx, twoPlayers, training) {
  J.Snd.ready();
  var g = J.newMatch(CHARS[myIdx], CHARS[oppIdx], STAGES[stageIdx], !!twoPlayers, false);
  if (training) { g.training = true; g.p2.human = true; }   // 상대가 가만히 있는다(입력이 안 들어온다)
  show(null);
  window.onMatchEnd = function (winner) { matchEnd(winner); };
  return g;
}

function matchEnd(winner) {
  var g = J.G;
  var iWon = winner === 1;
  if (UI.mode === 'arcade' && iWon) {
    UI.arcade.step++;
    SAVE.cleared[CHARS[UI.myIdx].key] = SAVE.cleared[CHARS[UI.myIdx].key] || {};
    storeSave();
  }
  show('result');
  var last = UI.mode === 'arcade' && UI.arcade && UI.arcade.step >= UI.arcade.order.length;
  $('rTitle').textContent = iWon ? (last ? '🏆 아케이드 제패!' : 'YOU WIN') : 'YOU LOSE';
  $('rSub').textContent = iWon
    ? (last ? CHARS[UI.myIdx].name + '(으)로 아홉 명을 모두 이겼습니다.' : '"' + CHARS[UI.myIdx].cry + '"')
    : '"' + g.p2.ch.cry + '" — ' + g.p2.ch.name + '에게 졌습니다.';
  $('rNext').style.display = (UI.mode === 'arcade' && iWon && !last) ? '' : 'none';
  $('rRetry').style.display = iWon ? 'none' : '';
  if (last && iWon) {
    SAVE.cleared[CHARS[UI.myIdx].key] = true;
    storeSave();
  }
}

function nextArcade() {
  var a = UI.arcade;
  var oppIdx = a.order[a.step];
  var st = (a.step + UI.myIdx) % STAGES.length;
  UI.oppIdx = oppIdx; UI.stageIdx = st;
  beginMatch(UI.myIdx, oppIdx, st, false, false);
}

function startArcade(myIdx) {
  UI.myIdx = myIdx;
  var order = [];
  CHARS.forEach(function (c, i) { if (i !== myIdx) order.push(i); });
  for (var i = order.length - 1; i > 0; i--) {          // 상대 순서는 판마다 다르다
    var j = Math.floor(Math.random() * (i + 1));
    var t = order[i]; order[i] = order[j]; order[j] = t;
  }
  UI.arcade = { order: order, step: 0 };
  nextArcade();
}

/* ---------- 화면 만들기 ---------- */
function toTitle() {
  show('title');
  if ($('lvBtn')) $('lvBtn').textContent = '난이도 · ' + levelName(SAVE.level);
}
function levelName(l) {
  return { easy: '쉬움', normal: '보통', hard: '어려움', master: '고수' }[l] || l;
}

function openSelect(mode) {
  UI.mode = mode;
  UI.step = 'char';
  show('select');
  $('selTitle').textContent =
    mode === 'arcade' ? '아케이드 — 쓸 캐릭터를 고르세요' :
    mode === 'training' ? '연습 — 쓸 캐릭터를 고르세요' :
    mode === '2p' ? '둘이서 — 1P 캐릭터' : '한 판 대전 — 내 캐릭터';
  buildGrid($('grid'), pickChar, mode === 'arcade');
  showProfile(0);
  $('stageBox').style.display = 'none';
  $('grid').style.display = 'grid';
}

function pickChar(i) {
  if (UI.step === 'char') {
    UI.myIdx = i;
    showProfile(i);
    if (UI.mode === 'arcade') { startArcade(i); return; }
    UI.step = 'opp';
    $('selTitle').textContent = UI.mode === '2p' ? '2P 캐릭터를 고르세요' : '상대를 고르세요 (CPU)';
    buildGrid($('grid'), pickChar, false);
    return;
  }
  if (UI.step === 'opp') {
    UI.oppIdx = i;
    showProfile(i);
    UI.step = 'stage';
    $('selTitle').textContent = '무대를 고르세요';
    $('grid').style.display = 'none';
    $('stageBox').style.display = 'grid';
    buildStages();
    return;
  }
}

function buildStages() {
  var box = $('stageBox');
  box.innerHTML = '';
  STAGES.forEach(function (st, i) {
    var b = document.createElement('button');
    b.className = 'stagebtn';
    var c = document.createElement('canvas');
    c.width = 240; c.height = 135;
    b.appendChild(c);
    var t = document.createElement('span');
    t.innerHTML = st.name + '<i>' + st.where + '</i>';
    b.appendChild(t);
    b.addEventListener('click', function () {
      UI.stageIdx = i;
      beginMatch(UI.myIdx, UI.oppIdx, i, UI.mode === '2p', UI.mode === 'training');
    });
    box.appendChild(b);
    var cc = c.getContext('2d');
    cc.save(); cc.scale(240 / 960, 135 / 540);
    st.draw(cc, 960, 540, 200, 430, 0);
    cc.restore();
  });
}

/* ---------- 손가락 조작(폰·태블릿) ----------
   ⚠️격투게임을 화면 단추로 하는 건 쉽지 않지만, **없으면 폰에서는 아예 못 논다**.
     그래서 방향 네 개와 공격 네 개를 크게 깔아 준다. */
function bindTouch() {
  var map = { tL: 'left', tR: 'right', tU: 'up', tD: 'down', tLP: 'lp', tHP: 'hp', tLK: 'lk', tHK: 'hk' };
  Object.keys(map).forEach(function (id) {
    var el = $(id);
    if (!el) return;
    var code = J.KEYMAP[0][map[id]];
    function on(e) { e.preventDefault(); J.held[code] = 1; el.classList.add('on'); }
    function off(e) { J.held[code] = 0; el.classList.remove('on'); }
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
  });
  var pad = $('padBtn');
  if (pad) pad.addEventListener('click', function () {
    document.body.classList.toggle('pad');
    try { localStorage.setItem('joss_pad', document.body.classList.contains('pad') ? '1' : '0'); } catch (e) {}
  });
  var want = null;
  try { want = localStorage.getItem('joss_pad'); } catch (e) {}
  if (want === '1' || (want === null && ('ontouchstart' in window))) document.body.classList.add('pad');
}

/* ---------- 시작 ---------- */
function boot() {
  loadSave();
  J.fit();
  window.addEventListener('resize', J.fit);
  bindTouch();
  toTitle();

  $('arcadeBtn').addEventListener('click', function () { openSelect('arcade'); });
  $('versusBtn').addEventListener('click', function () { openSelect('versus'); });
  $('trainBtn').addEventListener('click', function () { openSelect('training'); });
  $('twoBtn').addEventListener('click', function () { openSelect('2p'); });
  $('lvBtn').addEventListener('click', function () {
    var order = ['easy', 'normal', 'hard', 'master'];
    SAVE.level = order[(order.indexOf(SAVE.level) + 1) % order.length];
    J.setLevel(SAVE.level); storeSave();
    $('lvBtn').textContent = '난이도 · ' + levelName(SAVE.level);
  });
  $('backBtn').addEventListener('click', toTitle);
  $('mlBtn').addEventListener('click', function () {
    $('mlBody').innerHTML = CHARS.map(buildMoveList).join('<hr>');
    show('movelist');
  });
  $('mlClose').addEventListener('click', toTitle);
  $('rNext').addEventListener('click', nextArcade);
  $('rRetry').addEventListener('click', function () {
    beginMatch(UI.myIdx, UI.oppIdx, UI.stageIdx, UI.mode === '2p', UI.mode === 'training');
  });
  $('rMenu').addEventListener('click', toTitle);
  $('pauseBtn').addEventListener('click', togglePause);
  $('resumeBtn').addEventListener('click', togglePause);
  $('quitBtn').addEventListener('click', function () { J.G.paused = false; toTitle(); });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Escape' && J.G && !$('title').style.display.match(/flex/)) togglePause();
  });

  J.loop();
  if (/[?&]test=sim/.test(location.search)) runSim();
}

function togglePause() {
  var g = J.G;
  if (!g || g.phase === 'match') return;
  g.paused = !g.paused;
  if (g.paused) {
    $('pMoves').innerHTML = buildMoveList(g.p1.ch);
    show('pause');
  } else show(null);
}

/* ============================================================
   자가검증 (?test=sim)
   ⚠️격투게임에서 '돌아간다'는 것으로는 아무것도 보장되지 않는다. 실제로 확인하는 것:
     기술 자료가 동작과 맞물리는가 · 커맨드가 인식되는가 · 판정이 거리대로 나는가 ·
     막기가 높낮이대로 갈리는가 · **CPU 가 실제로 이길 만큼 강한가** ·
     열 명 × 모든 동작과 무대 일곱을 그려도 터지지 않는가.
   ============================================================ */
function runSim() {
  var fails = [], n = 0;
  function ck(ok, what) { n++; if (!ok) fails.push(what); }
  var MOTIONS = ['236', '214', '623', '236236', '214214'];

  /* 1) 캐릭터 자료 */
  ck(CHARS.length === 10, '캐릭터가 ' + CHARS.length + '명이다');
  ck(STAGES.length === 7, '무대가 ' + STAGES.length + '곳이다');
  var seen = {};
  CHARS.forEach(function (ch) {
    ck(!seen[ch.key], 'key 중복: ' + ch.key); seen[ch.key] = 1;
    ck(!!ch.name && !!ch.job && !!ch.desc && !!ch.cry, ch.key + ': 이름·직업·설명·대사 중 빠진 것이 있다');
    ck(ch.specials.length === 3, ch.name + ': 필살기가 ' + ch.specials.length + '개');
    ck(!!ch.super, ch.name + ': 초필살기가 없다');
    ck(ch.hp >= 850 && ch.hp <= 1250, ch.name + ': 체력이 범위 밖 ' + ch.hp);
    ck(ch.walk > 1.5 && ch.walk < 3.6, ch.name + ': 걷기 속도가 이상하다');
    ck(ch.scale > 0.9 && ch.scale < 1.25, ch.name + ': 덩치 배율이 이상하다');
    var moves = ch.specials.concat([ch.super]);
    moves.forEach(function (mv) {
      ck(/^(236|214|623|236236|214214)[PK]$/.test(mv.cmd), ch.name + '/' + mv.name + ': 커맨드 표기 이상 ' + mv.cmd);
      ck(MOTIONS.indexOf(mv.cmd.slice(0, -1)) >= 0, ch.name + '/' + mv.name + ': 모르는 모션');
      ck(!!FA.ANIM[mv.anim], ch.name + '/' + mv.name + ': 없는 동작 ' + mv.anim);
      ck(!!mv.note && mv.note.length > 10, ch.name + '/' + mv.name + ': 설명이 없다');
      var total = mv.startup + mv.active + mv.recovery;
      var alen = FA.animLength(mv.anim);
      // 동작은 마지막 자세로 멈추므로 기술이 조금 더 길어도 된다. 그러나 너무 어긋나면
      // 때리는 그림과 판정이 따로 논다.
      ck(total >= alen * 0.6 && total <= alen * 2.6,
         ch.name + '/' + mv.name + ': 기술 ' + total + 'F 인데 동작은 ' + alen + 'F');
      ck(mv.startup >= 3 && mv.startup <= 20, ch.name + '/' + mv.name + ': 발생 ' + mv.startup + 'F');
      ck(mv.recovery >= 8, ch.name + '/' + mv.name + ': 후딜 ' + mv.recovery + 'F — 너무 짧다');
      ck(!!(mv.box || mv.proj || mv.teleport), ch.name + '/' + mv.name + ': 판정도 장풍도 없다');
      if (mv.box) ck(mv.box[2] > 10 && mv.box[3] > 10, ch.name + '/' + mv.name + ': 판정 상자가 너무 작다');
      if (mv.proj) ck(mv.proj.speed > 3 && mv.proj.dmg > 20, ch.name + '/' + mv.name + ': 장풍 값이 이상하다');
    });
    // 보통기
    ['lp', 'hp', 'lk', 'hk', 'clp', 'clk', 'chk', 'jp', 'jk'].forEach(function (k) {
      var mv = ch.normals[k];
      ck(!!mv, ch.name + ': 보통기 ' + k + ' 없음');
      if (!mv) return;
      var t2 = mv.startup + mv.active + mv.recovery, a2 = FA.animLength(mv.anim);
      ck(Math.abs(t2 - a2) <= 4, ch.name + '/' + k + ': 기술 ' + t2 + 'F vs 동작 ' + a2 + 'F');
      ck(mv.dmg > 10 && mv.dmg < 120, ch.name + '/' + k + ': 위력 ' + mv.dmg);
    });
    // 대공기가 하나씩은 있어야 한다(뛰어드는 상대를 막을 방법)
    ck(ch.specials.some(function (s) { return s.invuln && s.launch; }),
       ch.name + ': 무적 대공기가 없다');
  });

  /* 2) 커맨드 해석 */
  ck(J.matchMotion([5, 2, 3, 6], '236', 16), '↓↘→ 가 인식되지 않는다');
  ck(!J.matchMotion([5, 2, 1, 4], '236', 16), '↓↙← 를 ↓↘→ 로 잘못 읽는다');
  ck(J.matchMotion([6, 2, 3], '623', 16), '→↓↘ 가 인식되지 않는다');
  ck(J.matchMotion([2, 3, 6, 2, 3, 6], '236236', 40), '초필살기 커맨드가 인식되지 않는다');
  ck(!J.matchMotion([2, 3, 6], '236236', 40), '한 번만 돌렸는데 초필살기가 나간다');
  ck(!J.matchMotion([2, 3, 6], '236', 1), '오래된 입력이 되살아난다');

  /* 3) 판정 — 거리대로 맞고 빗나간다 */
  function setup(aIdx, bIdx, dist) {
    var g = J.newMatch(CHARS[aIdx], CHARS[bIdx], STAGES[0], true, false);
    g.phase = 'fight'; g.phaseT = 0;
    g.p1.state = 'idle'; g.p2.state = 'idle';
    g.p1.x = 600; g.p2.x = 600 + dist;
    g.p1.face = 1; g.p2.face = -1;
    return g;
  }
  {
    var g1 = setup(0, 0, 70);
    var hp0 = g1.p2.hp;
    J.startMove(g1.p1, CHARS[0].normals.hp);
    for (var i = 0; i < 20; i++) J.step();
    ck(g1.p2.hp < hp0, '코앞에서 강손을 냈는데 안 맞는다');

    var g2 = setup(0, 0, 300);
    var hp1 = g2.p2.hp;
    J.startMove(g2.p1, CHARS[0].normals.hp);
    for (var i2 = 0; i2 < 20; i2++) J.step();
    ck(g2.p2.hp === hp1, '멀리 있는데 강손이 닿는다');
  }

  /* 4) 막기 — 높낮이가 갈린다 */
  function blockTest(moveKey, crouch) {
    var g = setup(0, 0, 72);
    var d = g.p2, hp = d.hp;
    d.blocking = true; d.crouch = crouch; d.state = crouch ? 'blockLow' : 'block';
    var mv = CHARS[0].normals[moveKey];
    J.applyHit(g, g.p1, d, mv, false);
    return hp - d.hp;
  }
  var midStand = blockTest('hp', false);
  var lowStand = blockTest('clk', false);
  var lowCrouch = blockTest('clk', true);
  ck(midStand < 20, '서서 막았는데 중단을 다 맞는다(' + midStand + ')');
  ck(lowCrouch < 20, '앉아 막았는데 하단을 다 맞는다(' + lowCrouch + ')');
  ck(lowStand > 20, '서서 막았는데 하단이 막힌다(' + lowStand + ')');
  {   // 점프 공격은 앉아서 막을 수 없다
    var g3 = setup(0, 0, 72);
    var d3 = g3.p2, hp3 = d3.hp;
    d3.blocking = true; d3.crouch = true;
    J.applyHit(g3, g3.p1, d3, CHARS[0].normals.jp, false);
    ck(hp3 - d3.hp > 20, '앉아 막기로 점프 공격이 막힌다');
  }
  {   // 잡기는 막을 수 없다
    var g4 = setup(1, 0, 60);
    var d4 = g4.p2, hp4 = d4.hp;
    d4.blocking = true; d4.crouch = false;
    var grab = J.findSpecial(g4.p1, ['grab']);
    ck(!!grab, '종범에게 잡기가 없다');
    J.applyHit(g4, g4.p1, d4, grab, false);
    ck(hp4 - d4.hp > 50, '잡기가 막혔다');
  }

  /* 5) 무적·슈퍼아머 */
  {
    var g5 = setup(0, 0, 70);
    g5.p2.invuln = 30;
    var hp5 = g5.p2.hp;
    J.startMove(g5.p1, CHARS[0].normals.hp);
    for (var i5 = 0; i5 < 20; i5++) J.step();
    ck(g5.p2.hp === hp5, '무적인데 맞는다');

    var g6 = setup(0, 1, 70);
    g6.p2.armorLeft = 1;
    var hp6 = g6.p2.hp, x6 = g6.p2.x;
    J.applyHit(g6, g6.p1, g6.p2, CHARS[0].normals.hp, false);
    ck(g6.p2.hp < hp6, '아머인데 피해가 없다');
    ck(Math.abs(g6.p2.x - x6) < 1, '아머인데 밀려났다');
    ck(g6.p2.hitstun === 0, '아머인데 경직이 걸렸다');
  }

  /* 6) 다운 → 기상까지 막히지 않는가 */
  {
    var g7 = setup(0, 0, 70);
    J.applyHit(g7, g7.p1, g7.p2, CHARS[0].normals.chk, false);
    ck(g7.p2.downT > 0, '다리 후리기를 맞았는데 안 넘어진다');
    for (var i7 = 0; i7 < 200; i7++) J.step();
    ck(g7.p2.downT === 0 && g7.p2.getupT === 0, '넘어진 뒤 일어나지 못한다');
    ck(g7.p2.state === 'idle' || g7.p2.state === 'walk' || g7.p2.state === 'block' || g7.p2.mv,
       '기상 뒤 상태가 이상하다: ' + g7.p2.state);
  }

  /* 7) 장풍 — 날아가고, 맞고, 서로 부딪히면 사라진다 */
  {
    var g8 = setup(0, 0, 320);
    var fb = J.findSpecial(g8.p1, ['fireball']);
    J.startMove(g8.p1, fb);
    for (var i8 = 0; i8 < 12; i8++) J.step();
    ck(g8.projs.length === 1, '장풍이 안 나갔다');
    var hp8 = g8.p2.hp;
    for (var i9 = 0; i9 < 90; i9++) J.step();
    ck(g8.p2.hp < hp8, '장풍이 상대에게 닿지 않는다');

    var g9 = setup(0, 0, 400);
    J.startMove(g9.p1, J.findSpecial(g9.p1, ['fireball']));
    J.startMove(g9.p2, J.findSpecial(g9.p2, ['fireball']));
    for (var iA = 0; iA < 12; iA++) J.step();
    ck(g9.projs.length === 2, '양쪽 장풍이 안 나갔다');
    for (var iB = 0; iB < 60; iB++) J.step();
    ck(g9.projs.length === 0, '장풍끼리 부딪혔는데 안 사라진다');
  }

  /* 8) 게이지와 초필살기 */
  {
    var gA = setup(0, 0, 70);
    ck(gA.p1.meter === 0, '시작부터 게이지가 차 있다');
    J.applyHit(gA, gA.p1, gA.p2, CHARS[0].normals.hp, false);
    ck(gA.p1.meter > 0 && gA.p2.meter > 0, '때리고 맞아도 게이지가 안 찬다');
    gA.p1.meter = 100;
    J.startMove(gA.p1, CHARS[0].super);
    ck(gA.p1.meter === 0, '초필살기를 썼는데 게이지가 남아 있다');
  }

  /* 9) 라운드와 승패 */
  {
    var gB = setup(0, 0, 70);
    gB.p2.hp = 1;
    J.applyHit(gB, gB.p1, gB.p2, CHARS[0].normals.hp, false);
    ck(gB.phase === 'over', 'KO 인데 라운드가 안 끝난다');
    ck(gB.p1.wins === 1, 'KO 로 이겼는데 승수가 안 오른다');
    for (var iC = 0; iC < 400; iC++) J.step();
    ck(gB.round === 2 || gB.phase === 'match', '다음 라운드로 안 넘어간다');
    // 두 판을 더 이기면 경기가 끝난다
    var guard = 0;
    while (gB.phase !== 'match' && guard++ < 20000) {
      gB.p2.hp = 1;
      if (gB.phase === 'fight') J.applyHit(gB, gB.p1, gB.p2, CHARS[0].normals.hp, false);
      J.step();
    }
    ck(gB.phase === 'match', '두 판을 이겼는데 경기가 안 끝난다');
    ck(gB.matchWinner === 1, '이겼는데 승자가 1P 가 아니다');
  }

  /* 10) ★CPU 가 실제로 강한가 — 가만히 서 있는 상대를 시간 안에 KO 시켜야 한다 */
  {
    var beat = 0, tries = 3;
    for (var t = 0; t < tries; t++) {
      var gC = J.newMatch(CHARS[t * 3 % 10], CHARS[(t * 3 + 5) % 10], STAGES[t % 7], true, false);
      gC.p1.human = false;                 // 1P 를 CPU 가 잡는다
      J.setLevel('hard');
      var guard2 = 0;
      while (gC.phase !== 'match' && guard2++ < 60 * 240) J.step();
      if (gC.p1.wins >= 2) beat++;
    }
    ck(beat === tries, 'CPU(어려움)가 가만히 있는 상대를 못 이긴다 (' + beat + '/' + tries + ')');
  }

  /* 11) CPU 끼리 붙여도 끝까지 돈다(예외·멈춤 없이) */
  {
    var ok = true;
    try {
      var gD = J.newMatch(CHARS[3], CHARS[7], STAGES[3], false, true);
      gD.p1.human = false; gD.p2.human = false;
      var guard3 = 0;
      while (gD.phase !== 'match' && guard3++ < 60 * 400) J.step();
      ok = gD.phase === 'match';
    } catch (e) { ok = false; fails.push('CPU 대전 중 오류: ' + e.message); }
    ck(ok, 'CPU 끼리 붙였더니 경기가 안 끝난다');
  }

  /* 12) 화면 밖으로 나가지 않는가 */
  {
    var gE = J.newMatch(CHARS[0], CHARS[1], STAGES[0], false, false);
    gE.p1.human = false; gE.p2.human = false;
    var out = 0;
    for (var iD = 0; iD < 3000; iD++) {
      J.step();
      [gE.p1, gE.p2].forEach(function (f) {
        if (f.x < 40 || f.x > J.ARENA - 40) out++;
        if (f.y > 1) out++;                     // 바닥을 뚫고 내려가지 않는다
      });
      if (Math.abs(gE.p1.x - gE.p2.x) > 900) out++;   // 화면 밖으로 갈라지지 않는다
    }
    ck(out === 0, '무대 밖으로 나가거나 너무 멀어진 프레임이 ' + out + '개');
  }

  /* 13) ★열 명 × 모든 동작, 무대 일곱을 실제로 그려 본다(그리기 코드의 오타를 잡는다) */
  {
    var off = document.createElement('canvas');
    off.width = 960; off.height = 540;
    var oc = off.getContext('2d');
    var drawErr = null;
    try {
      Object.keys(FA.ANIM).forEach(function (name) {
        CHARS.forEach(function (ch) {
          for (var fr = 0; fr < FA.animLength(name); fr += 3) {
            var p = FA.poseAt(name, fr, false);
            FA.drawFighter(oc, 200, 400, 1, ch, p, {});
            if (ch.propDraw) {
              var h = FA.handPos(p, 1, ch.scale);
              oc.save(); oc.translate(200 + h.x, 400 + h.y); ch.propDraw(oc, ch.col); oc.restore();
            }
          }
        });
      });
      STAGES.forEach(function (st) { st.draw(oc, 960, 540, 300, 430, 1.5); });
    } catch (e) { drawErr = e.message; }
    ck(!drawErr, '그리는 중 오류: ' + drawErr);
  }

  /* 14) 열 명의 필살기를 전부 실제로 내 본다 */
  {
    var bad = [];
    CHARS.forEach(function (ch, ci) {
      ch.specials.concat([ch.super]).forEach(function (mv) {
        try {
          var gF = setup(ci, (ci + 1) % 10, 90);
          gF.p1.meter = 100;
          J.startMove(gF.p1, mv);
          for (var k = 0; k < 90; k++) J.step();
          if (gF.p1.mv) bad.push(ch.name + '/' + mv.name + ': 기술이 안 끝난다');
        } catch (e) { bad.push(ch.name + '/' + mv.name + ': ' + e.message); }
      });
    });
    ck(bad.length === 0, bad.slice(0, 4).join(' · '));
  }

  /* 15) ★사람 입력 경로 — 진짜 키를 눌러 커맨드가 나가는가
     ⚠️matchMotion 만 따로 검사하면 "커맨드는 맞는데 손으로는 안 나가는" 상태를 못 잡는다.
       실제 키(JOSS.held)를 눌렀다 떼며 ↓ ↘ → + 약손을 넣어 본다. */
  {
    var gH = setup(0, 0, 320);
    gH.p1.human = true;
    var K = J.KEYMAP[0];
    function hold(keys, frames) {
      Object.keys(J.held).forEach(function (k) { J.held[k] = 0; });
      keys.forEach(function (k) { J.held[k] = 1; });
      for (var i = 0; i < frames; i++) J.step();
    }
    hold([K.down], 3);                    // ↓
    hold([K.down, K.right], 3);           // ↘
    hold([K.right], 2);                   // →
    hold([K.right, K.lp], 2);             // → + 약손
    ck(gH.projs.length === 1 || (gH.p1.mv && gH.p1.mv.key === 'fireball'),
       '↓↘→ + 약손을 진짜로 눌렀는데 장풍이 안 나간다');
    Object.keys(J.held).forEach(function (k) { J.held[k] = 0; });

    // 커맨드 없이 그냥 약손만 누르면 보통기가 나가야 한다(필살기가 아무 때나 나가면 안 된다)
    var gI = setup(0, 0, 320);
    gI.p1.human = true;
    Object.keys(J.held).forEach(function (k) { J.held[k] = 0; });
    J.held[K.lp] = 1;
    for (var q = 0; q < 4; q++) J.step();
    ck(gI.projs.length === 0, '커맨드도 없이 약손만 눌렀는데 장풍이 나갔다');
    ck(gI.p1.mv && gI.p1.mv.name === '약손', '약손을 눌렀는데 약손이 안 나간다');
    Object.keys(J.held).forEach(function (k) { J.held[k] = 0; });

    // 초필살기는 게이지가 없으면 나가지 않는다
    var gJ = setup(0, 0, 320);
    gJ.p1.human = true; gJ.p1.meter = 0;
    hold([K.down], 2); hold([K.down, K.right], 2); hold([K.right], 2);
    hold([K.down], 2); hold([K.down, K.right], 2); hold([K.right], 2);
    hold([K.right, K.hp], 2);
    ck(!(gJ.p1.mv && gJ.p1.mv.key === 'super'), '게이지가 없는데 초필살기가 나갔다');
    Object.keys(J.held).forEach(function (k) { J.held[k] = 0; });
  }

  /* 16) 화면 요소가 화면 밖으로 나가지 않는가(선택 화면) */
  {
    openSelect('versus');
    var gr = $('grid').getBoundingClientRect();
    ck(gr.left >= -1 && gr.right <= window.innerWidth + 1, '캐릭터 선택 칸이 화면 밖으로 나간다');
    ck(document.querySelectorAll('#grid .charbtn').length === 10, '선택 화면에 캐릭터가 10명이 아니다');
    var pf = $('pf').getBoundingClientRect();
    ck(pf.top >= -1, '캐릭터 설명이 위로 잘렸다');
    toTitle();
  }

  var out2 = document.createElement('div');
  out2.id = 'simout';
  out2.textContent = fails.length
    ? 'SIM FAIL (' + fails.length + '/' + n + ')\n' + fails.join('\n')
    : 'SIM PASS — 캐릭터 ' + CHARS.length + '명 · 무대 ' + STAGES.length + '곳 · 검사 ' + n + '개 통과';
  out2.style.cssText = 'position:fixed;left:0;top:0;z-index:99;color:#fff;font:12px monospace;white-space:pre;background:#000c;padding:6px;max-height:100vh;overflow:auto';
  document.body.appendChild(out2);
  document.title = fails.length ? 'SIM FAIL' : 'SIM PASS';
}

window.__joss_ui = { UI: UI, beginMatch: beginMatch, openSelect: openSelect, toTitle: toTitle };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
