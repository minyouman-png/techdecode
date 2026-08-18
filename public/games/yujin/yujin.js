/* ===================================================================
   유진이의 수학여행 (Yujin's Math Journey) — menewsoft.com AI 인디게임
   슈퍼유자의 횡스크롤 문법을 그대로 쓰되, **부수고 밟는 대상의 선택이 곧 문제 풀이**다.

   ⚠️설계에서 뒤집지 말 것 —
   1) **오답으로 목숨을 뺏지 않는다.** 학습 게임에서 오답=처벌이면 아이는 생각하기가 아니라
      찍기와 회피를 배운다. 오답은 별을 못 얻고, 왜 틀렸는지 듣고, 다시 푼다.
      목숨은 몬스터 몸통에 닿거나 구덩이에 빠지는 '액션 실패'에만 잃는다.
   2) **문제는 소리가 먼저, 글자는 거들 뿐.** 1학년은 아직 읽기가 느리다. 그래서 음성이
      기본이고 배너는 보조다. 음성이 안 되는 환경에선 자막이 항상 같이 뜬다.
   3) **시간 제한이 없다.** 재촉은 수학 불안을 만든다.
   =================================================================== */
(function () {
'use strict';

/* ---------- 상수 ---------- */
var VH = 540;                 // 캔버스 논리 높이(세로 화면에서는 커진다 — layout 참조)
var WORLD_H = 560;            // 세계의 높이(ROWS*TILE). 세계는 캔버스 '아래'에 붙인다.
var TILE = 40;
var ROWS = 14;
var GROUND_ROW = 11;          // 지면 윗면이 놓이는 행
var GY = GROUND_ROW * TILE;   // 지면 윗면 y (=440)
var GRAV = 2100;
var JUMP_V = -760;
var RUN_A = 1500, RUN_MAX = 250, FRICT = 1400;
var PW = 30, PH = 44;         // 플레이어 히트박스
var BRICK = 46;
var BRICK_BOTTOM = GY - 150;  // 벽돌 아랫면 — 점프 한 번으로 머리가 닿는 높이
var QUIZ_PER_STAGE = 4;       // 한 판에 나오는 문제 수(은행 8개 중에서 뽑는다)
var LIVES = 3;
var SAVE_TAG = 'yujin_math';
var SAVE_KEY = 'yujin_math_v1';

var THEMES = [
  { sky: ['#8fd3ff', '#dff4ff'], hill: '#7cc46a', ground: '#8b5a2b', top: '#5fa845', deco: 'house' },
  { sky: ['#ffd9a0', '#fff3e0'], hill: '#e0a95f', ground: '#a9743c', top: '#c98f45', deco: 'bridge' },
  { sky: ['#a8e6a3', '#e8fbe6'], hill: '#4f9d52', ground: '#6b4a2a', top: '#3f8a44', deco: 'tree' },
  { sky: ['#7f8bd6', '#cfd4f5'], hill: '#4a4a7a', ground: '#4a3a5a', top: '#6a5a86', deco: 'crystal' },
  { sky: ['#ffc6d9', '#fff0f5'], hill: '#d98aa8', ground: '#9a6a5a', top: '#c07d94', deco: 'flower' },
  { sky: ['#bfe3ff', '#f2fbff'], hill: '#8fb8d8', ground: '#7a6a8a', top: '#9fb4cf', deco: 'castle' },
  { sky: ['#ffe6a0', '#fffbe8'], hill: '#d8b45a', ground: '#8a6a3a', top: '#c0a04a', deco: 'hill' },
  { sky: ['#a0d8ff', '#eaf6ff'], hill: '#8ec5f0', ground: '#6f8fb0', top: '#a8d4f5', deco: 'cloud' }
];

/* ---------- 상태 ---------- */
var cv, cx, VW = 900, DPR = 1;
var BANK = null;
var G = {
  mode: 'menu',        // menu | play | pause | result
  paused: false,
  stage: 1,
  lives: LIVES,
  stars: 0,
  solved: 0,
  t: 0,
  camX: 0,
  quizIdx: -1,
  msg: null, msgT: 0
};
var P = null, LV = null, ents = [], fx = [];
var keys = {}, touch = { l: 0, r: 0, j: 0 };
var jumpEdge = false, jumpWasDown = false;

/* ---------- 저장 ---------- */
function load() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; }
}
function save(s) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) {}
}
function best() { var s = load(); return { max: s.max || 1, stars: s.stars || 0, cleared: s.cleared || {} }; }
function markCleared(stage, stars) {
  var s = best();
  s.cleared[stage] = true;
  s.max = Math.max(s.max, Math.min(8, stage + 1));
  s.stars = (s.stars || 0) + stars;
  save(s);
}

/* ---------- 소리: 효과음 ---------- */
var AC = null, sfxOn = true;
function ac() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
function beep(freq, dur, type, vol, slideTo) {
  var a = ac(); if (!a || !sfxOn) return;
  var o = a.createOscillator(), g = a.createGain();
  o.type = type || 'triangle';
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
  g.gain.setValueAtTime(0.0001, a.currentTime);
  g.gain.exponentialRampToValueAtTime(vol || 0.12, a.currentTime + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g); g.connect(a.destination);
  o.start(); o.stop(a.currentTime + dur + 0.02);
}
var SFX = {
  jump: function () { beep(430, 0.16, 'square', 0.07, 760); },
  star: function () { beep(880, 0.1, 'triangle', 0.11); setTimeout(function () { beep(1320, 0.14, 'triangle', 0.1); }, 90); },
  good: function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { beep(f, 0.16, 'triangle', 0.1); }, i * 95); }); },
  bad:  function () { beep(300, 0.18, 'sawtooth', 0.07, 190); },
  bump: function () { beep(180, 0.08, 'square', 0.06); },
  hurt: function () { beep(420, 0.3, 'sawtooth', 0.09, 130); },
  clear: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { setTimeout(function () { beep(f, 0.2, 'triangle', 0.1); }, i * 130); }); }
};

/* ---------- 소리: 나레이션 ----------
   ⚠️브라우저는 사용자 제스처 전에는 소리를 못 낸다 — 시작 버튼 클릭이 그 제스처다.
   ⚠️mp3 가 없거나 못 받는 환경(오프라인·차단)에서도 게임은 굴러가야 한다:
     Web Speech API 로 폴백하고, 그것마저 없으면 자막만 남는다. */
var Voice = {
  muted: false, cur: null, cache: {}, curName: '', onEnd: null, lastQ: '',
  el: null,
  get: function (name) {
    if (this.cache[name]) return this.cache[name];
    var a = new Audio('voice/' + name + '.mp3');
    a.preload = 'auto';
    this.cache[name] = a;
    return a;
  },
  prefetch: function (names) { for (var i = 0; i < names.length; i++) this.get(names[i]).load(); },
  /** 여러 클립을 순서대로 재생한다(문장 경계라 이어 붙여도 자연스럽다). */
  seq: function (list, kind, onEnd) {
    var self = this, i = 0;
    function step() {
      if (i >= list.length) { if (onEnd) onEnd(); return; }
      var it = list[i++];
      self.say(it.n, it.t, kind, step);
    }
    this.stop();
    step();
  },
  say: function (name, text, kind, onEnd) {
    this.stop();
    this.curName = name; this.onEnd = onEnd || null;
    this.subtitle(text, kind);
    if (this.muted) { this.finish(); return; }
    var self = this, a = this.get(name);
    try { a.currentTime = 0; } catch (e) {}
    a.onended = function () { self.finish(); };
    a.onerror = function () { self.speak(text); };
    var p = a.play();
    if (p && p.catch) p.catch(function () { self.speak(text); });
    this.cur = a;
  },
  speak: function (text) {                       // 폴백: 브라우저 내장 TTS
    var self = this;
    if (!window.speechSynthesis) { this.finish(); return; }
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR'; u.rate = 0.92;
      u.onend = function () { self.finish(); };
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { this.finish(); }
  },
  finish: function () {
    var cb = this.onEnd; this.onEnd = null; this.cur = null;
    if (cb) cb();
  },
  stop: function () {
    if (this.cur) { try { this.cur.pause(); this.cur.onended = null; this.cur.onerror = null; } catch (e) {} this.cur = null; }
    if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} }
    this.onEnd = null;
  },
  subtitle: function (text, kind) {
    var el = this.el || (this.el = document.getElementById('say'));
    if (!el) return;
    el.textContent = text || '';
    el.className = text ? ('on ' + (kind || '')) : '';
  },
  hide: function () { this.subtitle('', ''); }
};

/* ---------- 유틸 ---------- */
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rnd(n) { return Math.floor(Math.random() * n); }
function shuffle(a) {
  a = a.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function pickN(arr, n) { return shuffle(arr).slice(0, n); }
function showErr(m) {
  var e = document.getElementById('err');
  if (e) { e.textContent = m; e.style.display = 'block'; }
}


/* ===================================================================
   문제 생성기 — 숫자는 **매번 새로 만든다**
   ⚠️나레이션은 숫자를 말하지 않는다(유형만 가르친다). 그래서 문제를 미리 녹음할 필요가
     없고, 여기서 난수로 만들어도 목소리와 어긋나지 않는다.
   ⚠️각 생성기는 {q, a, c[], pic?} 를 돌려준다. 보기(c)에는 반드시 정답이 들어가고,
     겹치지 않고, 음수가 없어야 한다 — `?test=sim` 이 생성기마다 500번씩 확인한다.
   =================================================================== */
var PIC_EMOJI = ['🍎', '⭐', '🐤', '🍄', '🌰', '🐟', '🍬', '🎈', '🍓', '🐞'];

function ri(a, b) { return a + rnd(b - a + 1); }         // a..b 정수

/** 정답 + 그럴듯한 오답들로 보기를 만든다(중복·음수 제거, 3~4개). */
function mk(q, a, cands, pic) {
  var c = [a];
  for (var i = 0; i < cands.length && c.length < 4; i++) {
    var v = cands[i];
    if (v >= 0 && c.indexOf(v) < 0) c.push(v);
  }
  var pad = 1;
  while (c.length < 3) { if (c.indexOf(a + pad) < 0) c.push(a + pad); pad++; }
  var o = { q: q, a: a, c: c };
  if (pic) o.pic = pic;
  return o;
}

var GEN = {
  count: function () {
    var n = ri(1, 9);
    return mk('몇 개일까?', n, [n + 1, n - 1, n + 2, n - 2],
              { e: PIC_EMOJI[rnd(PIC_EMOJI.length)], n: n });
  },
  order: function () {
    var k = rnd(3);
    if (k === 0) { var n = ri(1, 8); return mk(n + ' 다음 수는?', n + 1, [n - 1, n + 2, n]); }
    if (k === 1) { var m = ri(2, 9); return mk(m + '보다 1 작은 수는?', m - 1, [m + 1, m - 2, m]); }
    var a = ri(1, 6);
    return mk(a + ', ' + (a + 1) + ', □, ' + (a + 3), a + 2, [a + 3, a + 1, a + 4]);
  },
  plus: function () {
    var a = ri(1, 8), b = ri(1, 9 - a), s = a + b;
    return mk(a + ' + ' + b + ' = ?', s, [s + 1, s - 1, a, b]);
  },
  minus: function () {
    var a = ri(2, 9), b = ri(1, a - 1), s = a - b;
    return mk(a + ' − ' + b + ' = ?', s, [s + 1, s - 1, a, b]);
  },
  num50: function () {
    var k = rnd(3);
    if (k === 0) { var o = ri(1, 9); return mk('10과 ' + o + '을(를) 모으면?', 10 + o, [11 + o, 9 + o, o]); }
    if (k === 1) {
      var t = ri(2, 4), u = ri(1, 9), n = t * 10 + u;
      return mk(n + '은(는) 10이 몇 묶음?', t, [t + 1, t - 1, u]);
    }
    var m = ri(10, 48);
    return mk(m + ' 다음 수는?', m + 1, [m + 2, m - 1, m + 10]);
  },
  make10: function () {
    var a = ri(1, 9);
    return mk(a + ' + □ = 10', 10 - a, [11 - a, 9 - a, a]);
  },
  compare: function () {
    // 자리를 바꾼 짝(68 ↔ 86) — '앞자리부터 비교한다'를 정면으로 묻는다
    var a = ri(1, 8), b = ri(a + 1, 9);
    var small = a * 10 + b, big = b * 10 + a;
    var first = rnd(2) ? small : big, second = first === small ? big : small;
    return mk(first + '과(와) ' + second + ' 중 더 큰 수는?', big, [small, big + 1, small - 1]);
  },
  skip: function () {
    var steps = [2, 5, 10], step = steps[rnd(3)];
    var s0 = step * ri(1, step === 2 ? 10 : (step === 5 ? 10 : 9));
    var seq = [s0, s0 + step, s0 + 2 * step], nx = seq[2] + step;
    return mk(seq.join(', ') + ', □', nx, [nx + step, nx - 1, nx + 1]);
  }
};

/* ===================================================================
   레벨 만들기
   한 판 = 문제 4개. 문제 구역 사이는 걷고 뛰는 '숨 돌리는 구간'이다.
   ⚠️문제 구역 안에는 구덩이를 두지 않는다 — 생각하는 동안 발밑까지 신경 쓰게 하면
     푸는 게 아니라 버티는 게임이 된다.
   =================================================================== */
var ZONE_SPAN = 24;           // 구역 간 간격(칸) — 화면 폭(최대 1600px=40칸)보다 좁으면
                              // 다음 구역 문제가 지금 문제와 같이 보인다. 아이가 헷갈린다.
var ZONE_START = 9;           // 첫 구역 중심

function buildLevel(stage) {
  var st = BANK.stages[stage - 1];
  var lv = { stage: stage, st: st, gaps: [], plats: [], zones: [], stars: [] };

  // ⚠️한 판에 벽돌과 몬스터가 둘 다 나오게 번갈아 배치한다(무작위로 두면 한쪽만 나오는 판이 생긴다).
  var first = rnd(2) ? 'brick' : 'mob';
  var seen = {};
  for (var i = 0; i < QUIZ_PER_STAGE; i++) {
    var p, guard = 0;
    do { p = GEN[st.key](); guard++; } while (seen[p.q] && guard < 30);   // 같은 판에 같은 문제 금지
    seen[p.q] = 1;
    var mode = (i % 2 === 0) === (first === 'brick') ? 'brick' : 'mob';
    var c = ZONE_START + i * ZONE_SPAN;
    var choices = shuffle(p.c);
    var z = {
      i: i, p: p, cc: c, choices: choices, mode: mode, v: rnd(BANK.variants || 2),
      startX: (c - 11) * TILE, gateX: (c + 5) * TILE, state: 'idle', tries: 0, items: []
    };
    for (var k = 0; k < choices.length; k++) {
      if (mode === 'brick') {
        z.items.push({
          kind: 'brick', v: choices[k], dead: false, wrong: 0, bump: 0,
          x: (c - 3 + k * 2) * TILE - BRICK / 2 + TILE / 2,
          y: BRICK_BOTTOM - BRICK, w: BRICK, h: BRICK, z: z
        });
      } else {
        z.items.push({
          kind: 'mob', v: choices[k], dead: false, wrong: 0, squash: 0,
          x: (c - 3 + k * 2) * TILE, y: GY - 40, w: 38, h: 40,
          // ⚠️네 마리가 같은 순찰 구간을 공유하면 서로 지나치며 숫자를 가린다(자가검증이 잡음).
          //   각자 제자리 근처에서만 어슬렁거리게 한다.
          vx: (k % 2 ? 30 : -30),
          x0: (c - 3 + k * 2) * TILE - 14, x1: (c - 3 + k * 2) * TILE + 14, z: z
        });
      }
    }
    lv.zones.push(z);
    if (i < QUIZ_PER_STAGE - 1) {
      var gc = c + 12;
      lv.gaps.push({ c0: gc, c1: gc + 1 });
      lv.plats.push({ c: gc - 1, row: GROUND_ROW - 3, len: 3 });
      lv.stars.push({ x: gc * TILE + 10, y: (GROUND_ROW - 4) * TILE, got: false });
      lv.stars.push({ x: (c + 4) * TILE, y: (GROUND_ROW - 2) * TILE, got: false });
    }
  }
  lv.goalC = ZONE_START + QUIZ_PER_STAGE * ZONE_SPAN - 4;
  lv.cols = lv.goalC + 6;
  lv.worldW = lv.cols * TILE;
  return lv;
}

function inGap(col) {
  for (var i = 0; i < LV.gaps.length; i++) if (col >= LV.gaps[i].c0 && col <= LV.gaps[i].c1) return true;
  return false;
}
function platAt(col, row) {
  for (var i = 0; i < LV.plats.length; i++) {
    var p = LV.plats[i];
    if (row === p.row && col >= p.c && col < p.c + p.len) return true;
  }
  return false;
}
function solid(col, row) {
  if (row < 0 || col < 0) return false;
  if (platAt(col, row)) return true;
  if (row >= GROUND_ROW) return !inGap(col);
  return false;
}
function solidRect(x, y, w, h) {
  var c0 = Math.floor(x / TILE), c1 = Math.floor((x + w - 1) / TILE);
  var r0 = Math.floor(y / TILE), r1 = Math.floor((y + h - 1) / TILE);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) if (solid(c, r)) return true;
  return false;
}

/* ===================================================================
   문제 진행
   =================================================================== */
function zoneOf() { return G.quizIdx >= 0 ? LV.zones[G.quizIdx] : null; }

function activateZone(i) {
  var z = LV.zones[i];
  if (!z || z.state !== 'idle') return;
  G.quizIdx = i;
  z.state = 'asking';
  paintQuiz(z);
  document.body.classList.add('quizon');
  var qn = 'q_' + LV.st.key + '_' + z.mode + '_' + z.v;
  Voice.say(qn, BANK.lines[qn], '', null);
}

function paintQuiz(z) {
  var q = document.getElementById('qText'), cpt = document.getElementById('qConcept'),
      pic = document.getElementById('qPic'), hint = document.getElementById('qHint');
  if (!q) return;
  cpt.textContent = LV.st.concept;
  q.textContent = z.p.q;
  if (z.p.pic) {
    var s = '';
    for (var i = 0; i < z.p.pic.n; i++) s += z.p.pic.e;
    pic.textContent = s; pic.style.display = 'block';
  } else { pic.textContent = ''; pic.style.display = 'none'; }
  hint.textContent = z.mode === 'brick' ? '정답 벽돌을 머리로 콩! 하고 쳐요'
                                        : '정답 몬스터를 밟아요';
}

function answer(z, item, correct) {
  if (z.state !== 'asking') return;
  if (correct) {
    z.state = 'done';
    G.solved++;
    G.stars += 3;
    paintHud();
    item.dead = true;
    SFX.good();
    burst(item.x + item.w / 2, item.y + item.h / 2, '#ffe28a', 22);
    // 오답 보기는 조용히 사라진다 — 정답을 본 뒤 오답이 남아 있으면 헷갈린다.
    for (var i = 0; i < z.items.length; i++) if (z.items[i] !== item) z.items[i].fade = 1;
    G.explain = true;
    var on = 'o_' + LV.st.key + '_' + z.v;
    Voice.say(on, BANK.lines[on], 'good', function () {
      G.explain = false;
      Voice.hide();
      if (LV.zones.every(function (x) { return x.state === 'done'; })) toast('마지막 문제까지 다 풀었어! 깃발로 가자 🚩');
    });
  } else {
    z.tries++;
    item.wrong = 1;
    SFX.bad();
    burst(item.x + item.w / 2, item.y + item.h / 2, '#ff9a8a', 10);
    var xn = 'x_' + LV.st.key + '_' + z.v;
    Voice.say(xn, BANK.lines[xn], 'bad', function () { Voice.hide(); });
  }
}

function toast(msg) { G.msg = msg; G.msgT = 2.6; }

/* ===================================================================
   게임 시작 / 스테이지
   =================================================================== */
function startStage(stage) {
  G.stage = stage;
  G.quizIdx = -1;
  G.solved = 0;
  G.t = 0;
  LV = buildLevel(stage);
  ents = []; fx = [];
  P = {
    x: 3 * TILE, y: GY - PH, vx: 0, vy: 0, dir: 1, onG: true,
    inv: 0, anim: 0, dead: 0, flag: 0, spawnX: 3 * TILE
  };
  G.camX = 0;
  document.body.classList.remove('quizon');
  Voice.hide();
  // 이 판에 쓸 음성만 미리 받아 둔다(전부 받으면 9MB — 판마다 1MB 남짓이면 충분하다)
  var names = ['c_stage', 'c_clear', 'c_hurt'];
  LV.zones.forEach(function (z) {
    names.push('q_' + LV.st.key + '_' + z.mode + '_' + z.v,
               'o_' + LV.st.key + '_' + z.v, 'x_' + LV.st.key + '_' + z.v);
  });
  Voice.prefetch(names);
  paintHud();
}

function startGame(stage) {
  G.mode = 'play'; G.paused = false;
  G.lives = LIVES; G.stars = 0;
  document.body.classList.add('playing');
  hideScreens();
  startStage(stage || 1);
  ac();
  Voice.say('c_welcome', BANK.lines.c_welcome, '', function () { Voice.hide(); });
}

function hurt() {
  if (P.inv > 0 || P.dead) return;
  P.inv = 1.6;
  G.lives--;
  SFX.hurt();
  if (G.lives <= 0) { gameOver(); return; }
  Voice.say('c_hurt', BANK.lines.c_hurt, 'bad', function () { Voice.hide(); });
  paintHud();
}

function die() {
  if (P.dead) return;
  // ⚠️부활 대기를 setTimeout 으로 걸면 안 된다 — 일시정지 중에도 흐르고, 프레임을 직접
  //   돌리는 자가검증에서는 아예 안 깨어난다. 게임 시간(update) 안에서만 센다.
  P.dead = 1; P.deadT = 0.9;
  G.lives--;
  SFX.hurt();
  paintHud();
}

function respawn() {
  P.dead = 0; P.deadT = 0; P.inv = 1.4;
  P.x = P.spawnX; P.y = GY - PH - 4; P.vx = 0; P.vy = 0;
  paintHud();
}

function gameOver() {
  G.mode = 'result';
  document.body.classList.remove('quizon');
  Voice.say('c_over', BANK.lines.c_over, 'bad', function () { Voice.hide(); });
  showResult(false);
}

function stageClear() {
  G.mode = 'result';
  document.body.classList.remove('quizon');
  SFX.clear();
  markCleared(G.stage, G.stars);
  var last = G.stage >= BANK.stages.length;
  Voice.say(last ? 'c_win' : 'c_clear', last ? BANK.lines.c_win : BANK.lines.c_clear, 'good',
    function () { Voice.hide(); });
  showResult(true, last);
}

/* ===================================================================
   물리 · 업데이트
   =================================================================== */
function update(dt) {
  G.t += dt;
  if (G.msgT > 0) G.msgT -= dt;
  if (!P || !LV) return;

  var left = keys['ArrowLeft'] || keys['a'] || keys['A'] || touch.l;
  var right = keys['ArrowRight'] || keys['d'] || keys['D'] || touch.r;
  var jumpDown = keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W'] || touch.j;
  jumpEdge = jumpDown && !jumpWasDown;
  jumpWasDown = jumpDown;

  if (P.dead) {
    P.y += 260 * dt;
    P.deadT -= dt;
    if (P.deadT <= 0) { if (G.lives <= 0) gameOver(); else respawn(); }
    return;
  }
  if (P.flag) { updateFlag(dt); return; }

  /* 가로 이동 */
  if (left && !right) { P.vx -= RUN_A * dt; P.dir = -1; }
  else if (right && !left) { P.vx += RUN_A * dt; P.dir = 1; }
  else {
    var f = FRICT * dt;
    P.vx = P.vx > 0 ? Math.max(0, P.vx - f) : Math.min(0, P.vx + f);
  }
  P.vx = clamp(P.vx, -RUN_MAX, RUN_MAX);

  /* 점프 — 홀드하면 조금 더 뜬다(작은 손에도 관대하게) */
  if (jumpEdge && P.onG) { P.vy = JUMP_V; P.onG = false; SFX.jump(); }
  if (!jumpDown && P.vy < -260) P.vy = -260;

  P.vy += GRAV * dt;
  if (P.vy > 1200) P.vy = 1200;

  /* 가로 충돌 */
  var nx = P.x + P.vx * dt;
  if (solidRect(nx, P.y, PW, PH)) {
    while (!solidRect(P.x + Math.sign(P.vx), P.y, PW, PH) && Math.abs(P.x - nx) > 1) P.x += Math.sign(P.vx);
    P.vx = 0;
  } else P.x = nx;
  P.x = clamp(P.x, 0, LV.worldW - PW);

  // ⚠️풀지 않은 문제를 지나치게 두면, 깃발까지 갔다가 되돌아오게 된다.
  //   1학년에게 그 되돌아가기는 문제보다 어렵다 — 그래서 구역 끝을 문으로 막는다.
  var zg = zoneOf();
  if (zg && zg.state === 'asking' && P.x + PW > zg.gateX) {
    P.x = zg.gateX - PW;
    if (P.vx > 0) P.vx = 0;
  }

  /* 세로 충돌 */
  var ny = P.y + P.vy * dt;
  P.onG = false;
  if (solidRect(P.x, ny, PW, PH)) {
    if (P.vy > 0) {                       // 착지
      P.y = Math.floor((ny + PH) / TILE) * TILE - PH;
      P.onG = true;
    } else {                              // 천장
      P.y = Math.floor(ny / TILE) * TILE + TILE;
    }
    P.vy = 0;
  } else P.y = ny;

  if (P.inv > 0) P.inv -= dt;
  P.anim += Math.abs(P.vx) * dt * 0.06;

  /* 구덩이 추락 */
  if (P.y > ROWS * TILE + 60) die();

  /* 안전 리스폰 지점 = 지금 구역의 시작 */
  // 안전 리스폰 지점은 '지금 서 있는 땅' 중 가장 멀리 간 곳. 구덩이 위에서는 갱신하지 않는다.
  if (P.onG && !inGap(Math.floor((P.x + PW / 2) / TILE))) P.spawnX = Math.max(P.spawnX, P.x);

  /* 문제 구역 진입 */
  for (var i = 0; i < LV.zones.length; i++) {
    var z = LV.zones[i];
    if (z.state === 'idle' && P.x + PW > z.startX) { activateZone(i); break; }
  }
  var zc = zoneOf();
  document.body.classList.toggle('quizon',
    !!(zc && (zc.state === 'asking' || (zc.state === 'done' && G.explain))));

  updateItems(dt);
  updateStars();
  updateFx(dt);

  /* 깃발 */
  var gx = LV.goalC * TILE;
  if (P.x + PW > gx && P.x < gx + 30) {
    if (LV.zones.every(function (x) { return x.state === 'done'; })) {
      P.flag = 1; P.vx = 0; P.vy = 0; P.flagY = P.y;
    } else if (G.msgT <= 0) {
      toast('아직 못 푼 문제가 있어! 뒤로 돌아가 볼까?');
    }
  }

  /* 카메라 — 문제 중에는 구역을 화면에 붙잡아 둔다.
     ⚠️좁은 화면에서 플레이어만 따라가면, 문에 막힌 사이 보기(벽돌·몬스터)가 화면 밖으로 나간다. */
  var zq = zoneOf();
  var want;
  if (zq && (zq.state === 'asking' || (zq.state === 'done' && G.explain))) {
    want = zq.cc * TILE + TILE / 2 - VW / 2;
  } else {
    want = P.x + PW / 2 - VW * 0.42;
  }
  G.camX += (clamp(want, 0, Math.max(0, LV.worldW - VW)) - G.camX) * Math.min(1, dt * 7);
}

function updateFlag(dt) {
  P.y += 240 * dt;
  if (P.y >= GY - PH) {
    P.y = GY - PH;
    if (P.flag === 1) { P.flag = 2; P.flagT = 0.6; }
  }
  if (P.flag === 2) { P.flagT -= dt; if (P.flagT <= 0) { P.flag = 3; stageClear(); } }
}

function updateItems(dt) {
  for (var i = 0; i < LV.zones.length; i++) {
    var z = LV.zones[i];
    // ⚠️문제가 시작되기 전 구역의 벽돌·몬스터는 아직 존재하지 않는다.
    //   미리 보이면 "저건 왜 못 밟지?"가 되고, 몸에 닿아 다치면 이유 없는 벌이 된다.
    if (z.state === 'idle') continue;
    for (var k = 0; k < z.items.length; k++) {
      var it = z.items[k];
      if (it.dead) continue;
      if (it.wrong > 0) it.wrong = Math.max(0, it.wrong - dt * 1.6);
      if (it.fade) { it.fade -= dt * 1.8; if (it.fade <= 0) it.dead = true; continue; }

      if (it.kind === 'brick') {
        if (it.bump > 0) it.bump = Math.max(0, it.bump - dt * 5);
        // 머리로 치기: 올라가는 중이고 머리가 벽돌 아랫면을 지나갈 때
        if (P.vy < 0 && !P.dead &&
            P.x + PW > it.x + 4 && P.x < it.x + it.w - 4 &&
            P.y < it.y + it.h && P.y > it.y + it.h - 22) {
          P.vy = 60; it.bump = 1; SFX.bump();
          answer(z, it, it.v === z.p.a);
        }
      } else {
        it.x += it.vx * dt;
        if (it.x < it.x0) { it.x = it.x0; it.vx = Math.abs(it.vx); }
        if (it.x > it.x1) { it.x = it.x1; it.vx = -Math.abs(it.vx); }
        if (it.squash > 0) { it.squash -= dt * 2.2; if (it.squash <= 0) it.dead = true; continue; }
        if (P.dead) continue;
        var hit = P.x + PW > it.x + 3 && P.x < it.x + it.w - 3 &&
                  P.y + PH > it.y + 3 && P.y < it.y + it.h;
        if (!hit) continue;
        var stomp = P.vy > 0 && (P.y + PH) < it.y + it.h * 0.7;
        if (stomp) {
          P.vy = -430;
          if (it.v === z.p.a) { it.squash = 1; answer(z, it, true); }
          else {
            // ⚠️오답 몬스터를 밟아도 다치지 않는다 — 답이 틀린 것과 아픈 것은 다른 일이다.
            answer(z, it, false);
          }
        } else if (P.inv <= 0) {
          hurt();
          P.vx = -P.dir * 180; P.vy = -280;
        }
      }
    }
  }
}

function updateStars() {
  for (var i = 0; i < LV.stars.length; i++) {
    var s = LV.stars[i];
    if (s.got) continue;
    if (Math.abs(P.x + PW / 2 - (s.x + 12)) < 26 && Math.abs(P.y + PH / 2 - (s.y + 12)) < 30) {
      s.got = true; G.stars++; SFX.star();
      burst(s.x + 12, s.y + 12, '#ffe28a', 8);
      paintHud();
    }
  }
}

function burst(x, y, col, n) {
  for (var i = 0; i < n; i++) {
    fx.push({ x: x, y: y, vx: (Math.random() - 0.5) * 240, vy: -Math.random() * 260 - 40,
              life: 0.7, col: col, r: 2 + Math.random() * 3 });
  }
}
function updateFx(dt) {
  for (var i = fx.length - 1; i >= 0; i--) {
    var f = fx[i];
    f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 700 * dt; f.life -= dt;
    if (f.life <= 0) fx.splice(i, 1);
  }
}

/* ===================================================================
   그리기
   ⚠️캐릭터·몬스터·벽돌 전부 캔버스 벡터다. 외부 이미지가 없어 로딩이 없고,
     어떤 화면 크기에서도 또렷하다.
   =================================================================== */
function theme() { return THEMES[(G.stage - 1) % THEMES.length]; }

function render() {
  var th = theme();
  cx.save();
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.clearRect(0, 0, VW, VH);

  /* 하늘 — 캔버스 전체 */
  var g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);

  cx.translate(0, VH - WORLD_H);      // 세계를 아래에 붙인다(남는 위쪽은 하늘)
  drawClouds();
  drawHills(th);
  cx.save();
  cx.translate(-Math.round(G.camX), 0);
  drawDeco(th);
  drawGround(th);
  drawStars();
  drawGoal();
  drawItems();
  drawGate();
  if (P) drawPlayer();
  drawFx();
  cx.restore();

  cx.restore();
  cx.save();
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawToast();
  cx.restore();
}

function drawClouds() {
  cx.fillStyle = 'rgba(255,255,255,.75)';
  for (var i = 0; i < 7; i++) {
    var x = ((i * 260 - G.camX * 0.18) % (VW + 320)) - 160;
    var y = 40 + (i % 3) * 46;
    cx.beginPath();
    cx.arc(x, y, 26, 0, 7); cx.arc(x + 28, y - 8, 20, 0, 7);
    cx.arc(x + 52, y, 24, 0, 7); cx.arc(x + 26, y + 12, 22, 0, 7);
    cx.fill();
  }
}

function drawHills(th) {
  cx.fillStyle = th.hill;
  cx.globalAlpha = 0.55;
  for (var i = 0; i < 8; i++) {
    var x = ((i * 300 - G.camX * 0.35) % (VW + 400)) - 200;
    cx.beginPath();
    cx.moveTo(x - 150, GY);
    cx.quadraticCurveTo(x, GY - 150, x + 150, GY);
    cx.fill();
  }
  cx.globalAlpha = 1;
}

function drawDeco(th) {
  var c0 = Math.floor(G.camX / TILE) - 2, c1 = c0 + Math.ceil(VW / TILE) + 4;
  for (var c = c0; c <= c1; c++) {
    if (c < 0 || c % 7 !== 3 || inGap(c)) continue;
    var x = c * TILE, y = GY;
    cx.save();
    if (th.deco === 'tree' || th.deco === 'flower') {
      cx.fillStyle = '#7a5230'; cx.fillRect(x + 14, y - 44, 12, 44);
      cx.fillStyle = th.deco === 'tree' ? '#3f8a44' : '#e58fb0';
      cx.beginPath(); cx.arc(x + 20, y - 56, 28, 0, 7); cx.fill();
    } else if (th.deco === 'house' || th.deco === 'castle') {
      cx.fillStyle = th.deco === 'house' ? '#e8d5a8' : '#c9d6e8';
      cx.fillRect(x - 4, y - 54, 52, 54);
      cx.fillStyle = '#a4553f';
      cx.beginPath(); cx.moveTo(x - 12, y - 54); cx.lineTo(x + 22, y - 84);
      cx.lineTo(x + 56, y - 54); cx.closePath(); cx.fill();
      cx.fillStyle = 'rgba(60,40,20,.55)'; cx.fillRect(x + 14, y - 30, 16, 30);
    } else if (th.deco === 'crystal') {
      cx.fillStyle = 'rgba(180,200,255,.85)';
      cx.beginPath(); cx.moveTo(x + 20, y - 70); cx.lineTo(x + 38, y - 20);
      cx.lineTo(x + 20, y); cx.lineTo(x + 2, y - 20); cx.closePath(); cx.fill();
    } else if (th.deco === 'bridge' || th.deco === 'hill') {
      cx.fillStyle = 'rgba(255,255,255,.5)';
      cx.beginPath(); cx.arc(x + 20, y - 6, 22, Math.PI, 0); cx.fill();
    } else {
      cx.fillStyle = 'rgba(255,255,255,.6)';
      cx.beginPath(); cx.arc(x + 20, y - 22, 24, 0, 7); cx.fill();
    }
    cx.restore();
  }
}

function drawGround(th) {
  var c0 = Math.floor(G.camX / TILE) - 1, c1 = c0 + Math.ceil(VW / TILE) + 3;
  for (var c = c0; c <= c1; c++) {
    if (c < 0) continue;
    if (inGap(c)) {
      // 구덩이는 '물웅덩이'로 그린다. 어두운 사각형은 구멍이 아니라 벽처럼 보였다.
      var pg = cx.createLinearGradient(0, GY, 0, ROWS * TILE);
      pg.addColorStop(0, '#2b6ea8'); pg.addColorStop(1, '#123a63');
      cx.fillStyle = pg;
      cx.fillRect(c * TILE, GY + 6, TILE, ROWS * TILE - GY);
      cx.fillStyle = 'rgba(0,0,0,.28)';
      cx.fillRect(c * TILE, GY, TILE, 8);
      cx.fillStyle = 'rgba(255,255,255,.35)';
      for (var w = 0; w < 2; w++) {
        var wy = GY + 20 + w * 26 + Math.sin(G.t * 2.4 + c + w) * 3;
        cx.fillRect(c * TILE + 6 + w * 12, wy, 16, 3);
      }
    } else {
      for (var r = GROUND_ROW; r < ROWS; r++) {
        var x = c * TILE, y = r * TILE;
        cx.fillStyle = r === GROUND_ROW ? th.top : th.ground;
        cx.fillRect(x, y, TILE, TILE);
        cx.fillStyle = 'rgba(0,0,0,.09)';
        cx.fillRect(x, y + TILE - 4, TILE, 4);
        cx.fillStyle = 'rgba(255,255,255,.12)';
        cx.fillRect(x, y, TILE, 3);
      }
    }
  }
  for (var i = 0; i < LV.plats.length; i++) {
    var p = LV.plats[i];
    for (var k = 0; k < p.len; k++) {
      var px = (p.c + k) * TILE, py = p.row * TILE;
      cx.fillStyle = th.ground; cx.fillRect(px, py, TILE, TILE * 0.6);
      cx.fillStyle = th.top; cx.fillRect(px, py, TILE, 8);
    }
  }
}

function drawStars() {
  for (var i = 0; i < LV.stars.length; i++) {
    var s = LV.stars[i];
    if (s.got) continue;
    var bob = Math.sin(G.t * 3 + i) * 4;
    star(s.x + 12, s.y + 12 + bob, 13, '#ffd84d', '#b8860b');
  }
}
function star(x, y, r, fill, stroke) {
  cx.save(); cx.translate(x, y); cx.beginPath();
  for (var i = 0; i < 10; i++) {
    var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    cx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  cx.closePath(); cx.fillStyle = fill; cx.fill();
  if (stroke) { cx.strokeStyle = stroke; cx.lineWidth = 2; cx.stroke(); }
  cx.restore();
}

function drawGate() {
  var z = zoneOf();
  if (!z || z.state !== 'asking') return;
  var x = z.gateX, a = 0.3 + Math.sin(G.t * 3) * 0.1;
  var g = cx.createLinearGradient(x, 0, x + 16, 0);
  g.addColorStop(0, 'rgba(255,226,138,' + a + ')');
  g.addColorStop(1, 'rgba(255,226,138,0)');
  cx.fillStyle = g;
  cx.fillRect(x, 0, 16, GY);
  cx.fillStyle = 'rgba(255,226,138,' + (a + 0.35) + ')';
  cx.fillRect(x, 0, 3, GY);
  for (var i = 0; i < 5; i++) {
    var sy = (G.t * 60 + i * 90) % GY;
    star(x + 2, GY - sy, 5, 'rgba(255,245,200,.85)', null);
  }
}

function drawGoal() {
  var x = LV.goalC * TILE;
  cx.fillStyle = '#8a8f98'; cx.fillRect(x + 6, GY - 190, 7, 190);
  var wave = Math.sin(G.t * 4) * 5;
  cx.fillStyle = '#ff6b6b';
  cx.beginPath(); cx.moveTo(x + 13, GY - 186);
  cx.lineTo(x + 78 + wave, GY - 168); cx.lineTo(x + 13, GY - 150);
  cx.closePath(); cx.fill();
  cx.fillStyle = '#fff'; cx.font = 'bold 15px sans-serif'; cx.textAlign = 'center';
  cx.fillText('🚩', x + 42, GY - 162);
  cx.textAlign = 'left';
}

/* ---------- 벽돌 · 몬스터 ---------- */
function drawItems() {
  for (var i = 0; i < LV.zones.length; i++) {
    var z = LV.zones[i];
    if (z.state === 'idle') continue;
    var active = (z.state === 'asking');
    for (var k = 0; k < z.items.length; k++) {
      var it = z.items[k];
      if (it.dead) continue;
      cx.save();
      if (it.fade) cx.globalAlpha = Math.max(0, it.fade);
      if (it.kind === 'brick') drawBrick(it, active);
      else drawMob(it, active);
      cx.restore();
    }
  }
}

function drawBrick(b, active) {
  var y = b.y - (b.bump || 0) * 9;
  var wrong = b.wrong || 0;
  var base = active ? '#d99a4a' : '#b9a48a';
  cx.fillStyle = wrong ? '#e06a5a' : base;
  roundRect(b.x, y, b.w, b.h, 8); cx.fill();
  var g = cx.createLinearGradient(b.x, y, b.x, y + b.h);
  g.addColorStop(0, 'rgba(255,255,255,.42)'); g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,.22)');
  cx.fillStyle = g; roundRect(b.x, y, b.w, b.h, 8); cx.fill();
  cx.strokeStyle = 'rgba(90,50,20,.65)'; cx.lineWidth = 3;
  roundRect(b.x, y, b.w, b.h, 8); cx.stroke();
  cx.fillStyle = '#fffdf5'; cx.font = '900 26px sans-serif';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.strokeStyle = 'rgba(80,40,10,.8)'; cx.lineWidth = 4;
  cx.strokeText(String(b.v), b.x + b.w / 2, y + b.h / 2 + 1);
  cx.fillText(String(b.v), b.x + b.w / 2, y + b.h / 2 + 1);
  cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
}

function drawMob(m, active) {
  var sq = m.squash || 0;
  var h = m.h * (sq ? 0.35 : 1), y = m.y + (m.h - h);
  var wob = Math.sin(G.t * 6 + m.x * 0.05) * 2;
  var col = m.wrong > 0 ? '#e06a5a' : (active ? '#6fc27a' : '#9fb0a6');
  cx.save();
  cx.fillStyle = 'rgba(20,14,30,.18)';
  cx.beginPath(); cx.ellipse(m.x + m.w / 2, m.y + m.h - 1, m.w * 0.42, 5, 0, 0, 7); cx.fill();
  // 몸통(젤리)
  cx.fillStyle = col;
  roundRect(m.x, y + wob, m.w, h, h * 0.42); cx.fill();
  var g = cx.createLinearGradient(m.x, y, m.x, y + h);
  g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(0.55, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,.2)');
  cx.fillStyle = g; roundRect(m.x, y + wob, m.w, h, h * 0.42); cx.fill();
  if (!sq) {
    // 눈
    var ex = m.x + m.w / 2, ey = y + h * 0.36 + wob;
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.ellipse(ex - 7, ey, 5.5, 6.5, 0, 0, 7); cx.fill();
    cx.beginPath(); cx.ellipse(ex + 7, ey, 5.5, 6.5, 0, 0, 7); cx.fill();
    cx.fillStyle = '#20303a';
    var look = m.vx > 0 ? 1.4 : -1.4;
    cx.beginPath(); cx.arc(ex - 7 + look, ey + 1, 3, 0, 7); cx.fill();
    cx.beginPath(); cx.arc(ex + 7 + look, ey + 1, 3, 0, 7); cx.fill();
    cx.fillStyle = 'rgba(255,255,255,.9)';
    cx.beginPath(); cx.arc(ex - 8.4, ey - 1.6, 1.5, 0, 7); cx.fill();
    cx.beginPath(); cx.arc(ex + 5.6, ey - 1.6, 1.5, 0, 7); cx.fill();
    // 숫자표
    cx.fillStyle = '#fffdf5';
    roundRect(m.x + 2, y + h * 0.58 + wob, m.w - 4, 17, 5); cx.fill();
    cx.strokeStyle = 'rgba(40,60,40,.5)'; cx.lineWidth = 2;
    roundRect(m.x + 2, y + h * 0.58 + wob, m.w - 4, 17, 5); cx.stroke();
    cx.fillStyle = '#243b2a'; cx.font = '900 14px sans-serif';
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText(String(m.v), m.x + m.w / 2, y + h * 0.58 + 9 + wob);
    cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
  }
  cx.restore();
}

function roundRect(x, y, w, h, r) {
  cx.beginPath();
  cx.moveTo(x + r, y);
  cx.arcTo(x + w, y, x + w, y + h, r);
  cx.arcTo(x + w, y + h, x, y + h, r);
  cx.arcTo(x, y + h, x, y, r);
  cx.arcTo(x, y, x + w, y, r);
  cx.closePath();
}

/* ---------- 유진 ---------- */
function drawPlayer() {
  var x = P.x, y = P.y, d = P.dir;
  if (P.inv > 0 && Math.floor(P.inv * 12) % 2) return;   // 무적 깜빡임
  var walk = P.onG && Math.abs(P.vx) > 20 ? Math.sin(P.anim * 6) : 0;
  var lean = P.onG ? walk * 0.06 : clamp(P.vy / 1400, -0.16, 0.16);
  cx.save();
  cx.fillStyle = 'rgba(20,14,30,.2)';
  cx.beginPath(); cx.ellipse(x + PW / 2, GY - 2, 16, 5, 0, 0, 7); cx.fill();
  cx.translate(x + PW / 2, y + PH);
  cx.rotate(lean * d);
  cx.scale(d, 1);

  // 다리
  cx.fillStyle = '#ffd9c0';
  cx.fillRect(-9, -14, 7, 14 + walk * 3);
  cx.fillRect(3, -14, 7, 14 - walk * 3);
  cx.fillStyle = '#c0392b';
  cx.fillRect(-11, -4 + Math.max(0, walk * 3), 11, 5);
  cx.fillRect(1, -4 + Math.max(0, -walk * 3), 11, 5);

  // 치마/원피스
  cx.fillStyle = '#f2739a';
  cx.beginPath();
  cx.moveTo(-8, -34); cx.lineTo(8, -34); cx.lineTo(13, -12); cx.lineTo(-13, -12);
  cx.closePath(); cx.fill();
  var gd = cx.createLinearGradient(-13, -34, 13, -12);
  gd.addColorStop(0, 'rgba(255,255,255,.45)'); gd.addColorStop(0.6, 'rgba(255,255,255,0)');
  gd.addColorStop(1, 'rgba(0,0,0,.16)');
  cx.fillStyle = gd; cx.fill();

  // 팔
  cx.fillStyle = '#ffd9c0';
  cx.fillRect(-13, -32, 5, 13 + walk * 2);
  cx.fillRect(8, -32, 5, 13 - walk * 2);

  // 머리
  var hy = -46;
  cx.fillStyle = '#3a2418';
  cx.beginPath(); cx.arc(-13, hy + 2, 6.5, 0, 7); cx.fill();   // 양갈래
  cx.beginPath(); cx.arc(13, hy + 2, 6.5, 0, 7); cx.fill();
  var fg = cx.createRadialGradient(-4, hy - 5, 2, 0, hy, 15);
  fg.addColorStop(0, '#fff2e6'); fg.addColorStop(0.6, '#ffdcc4'); fg.addColorStop(1, '#e8b79a');
  cx.fillStyle = fg;
  cx.beginPath(); cx.arc(0, hy, 14, 0, 7); cx.fill();
  cx.fillStyle = '#3a2418';                                    // 앞머리
  cx.beginPath(); cx.arc(0, hy - 2, 14, Math.PI, 0); cx.fill();
  cx.fillRect(-14, hy - 4, 28, 4);
  // 눈
  cx.fillStyle = '#fff';
  cx.beginPath(); cx.ellipse(-5, hy + 3, 3.4, 4.2, 0, 0, 7); cx.fill();
  cx.beginPath(); cx.ellipse(5.5, hy + 3, 3.4, 4.2, 0, 0, 7); cx.fill();
  cx.fillStyle = '#2b1a12';
  cx.beginPath(); cx.arc(-4.4, hy + 3.6, 2.2, 0, 7); cx.fill();
  cx.beginPath(); cx.arc(6.2, hy + 3.6, 2.2, 0, 7); cx.fill();
  cx.fillStyle = 'rgba(255,255,255,.95)';
  cx.beginPath(); cx.arc(-5.2, hy + 2.2, 1.1, 0, 7); cx.fill();
  cx.beginPath(); cx.arc(5.4, hy + 2.2, 1.1, 0, 7); cx.fill();
  // 볼
  cx.fillStyle = 'rgba(255,140,150,.4)';
  cx.beginPath(); cx.arc(-8, hy + 7, 3.2, 0, 7); cx.fill();
  cx.beginPath(); cx.arc(9, hy + 7, 3.2, 0, 7); cx.fill();
  // 입
  cx.strokeStyle = '#a5523f'; cx.lineWidth = 1.6; cx.beginPath();
  cx.arc(0.6, hy + 7, 3.2, 0.15 * Math.PI, 0.85 * Math.PI); cx.stroke();
  cx.restore();
}

function drawFx() {
  for (var i = 0; i < fx.length; i++) {
    var f = fx[i];
    cx.globalAlpha = Math.max(0, f.life / 0.7);
    cx.fillStyle = f.col;
    cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 7); cx.fill();
  }
  cx.globalAlpha = 1;
}

function drawToast() {
  if (G.msgT <= 0 || !G.msg) return;
  cx.save();
  cx.globalAlpha = Math.min(1, G.msgT);
  cx.font = '900 19px sans-serif'; cx.textAlign = 'center';
  var w = cx.measureText(G.msg).width + 40;
  cx.fillStyle = 'rgba(24,18,40,.85)';
  roundRect(VW / 2 - w / 2, VH - 74, w, 40, 14); cx.fill();
  cx.fillStyle = '#ffe28a';
  cx.fillText(G.msg, VW / 2, VH - 48);
  cx.restore();
  cx.textAlign = 'left';
}

/* ===================================================================
   화면 · 입력 · 루프
   =================================================================== */
function $(id) { return document.getElementById(id); }
function hideScreens() {
  ['menu', 'pause', 'results'].forEach(function (id) { var e = $(id); if (e) e.style.display = 'none'; });
}
function showScreen(id) {
  hideScreens();
  var e = $(id); if (e) e.style.display = 'flex';
}

function paintHud() {
  var st = BANK.stages[G.stage - 1];
  if ($('hStage')) $('hStage').textContent = G.stage + '. ' + st.title;
  if ($('hStar')) $('hStar').textContent = '⭐ ' + G.stars;
  if ($('hLife')) $('hLife').textContent = '❤️'.repeat(Math.max(0, G.lives));
  if ($('hQ')) $('hQ').textContent = '문제 ' + G.solved + '/' + QUIZ_PER_STAGE;
}

function paintStagePick() {
  var box = $('stagePick'); if (!box) return;
  var b = best();
  box.innerHTML = '';
  BANK.stages.forEach(function (s) {
    var btn = document.createElement('button');
    var locked = s.no > b.max;
    btn.className = 'stbtn' + (locked ? ' locked' : '') + (b.cleared[s.no] ? ' cleared' : '');
    btn.innerHTML = '<span class="n">' + s.no + '</span>' + s.title;
    btn.title = s.concept;
    if (!locked) btn.onclick = function () { startGame(s.no); };
    box.appendChild(btn);
  });
}

function showResult(win, last) {
  G.mode = 'result';
  document.body.classList.remove('playing');
  $('resT').textContent = win ? (last ? '🎉 수학여행 완주!' : '🚩 ' + BANK.stages[G.stage - 1].title + ' 클리어!')
                              : '다시 해 볼까?';
  $('resStats').innerHTML = '푼 문제 <span class="big">' + G.solved + '</span> / ' + QUIZ_PER_STAGE +
    '<br>모은 별 <span class="big">' + G.stars + '</span>';
  $('nextBtn').style.display = (win && !last) ? '' : 'none';
  showScreen('results');
}

function layout() {
  var w = window.innerWidth, h = window.innerHeight;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  var aspect = w / h;
  // ⚠️가로 폭에 하한(620)만 두고 높이를 540 으로 고정하면, 세로로 긴 화면에서 그림이
  //   가로로 눌린다(캔버스를 창 크기에 늘려 붙이기 때문). 대신 **높이를 화면비에 맞춰 늘리고**,
  //   남는 공간은 하늘로 채운다 — 세계는 캔버스 아래쪽에 붙인다.
  VW = clamp(Math.round(540 * aspect), 620, 1600);
  VH = Math.max(540, Math.round(VW / aspect));
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.imageSmoothingEnabled = true;
}

function bindInput() {
  window.addEventListener('keydown', function (e) {
    keys[e.key] = 1;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) >= 0) e.preventDefault();
    if (e.key === 'Escape' && G.mode === 'play') togglePause();
  });
  window.addEventListener('keyup', function (e) { keys[e.key] = 0; });
  window.addEventListener('blur', function () { keys = {}; touch.l = touch.r = touch.j = 0; });

  function tb(id, prop) {
    var el = $(id); if (!el) return;
    function on(e) { e.preventDefault(); touch[prop] = 1; el.classList.add('on'); }
    function off(e) { e.preventDefault(); touch[prop] = 0; el.classList.remove('on'); }
    el.addEventListener('touchstart', on, { passive: false });
    el.addEventListener('touchend', off, { passive: false });
    el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown', on);
    window.addEventListener('mouseup', off);
  }
  tb('tLeft', 'l'); tb('tRight', 'r'); tb('tJump', 'j');
  if ('ontouchstart' in window) document.body.classList.add('touch');

  $('startBtn').onclick = function () { startGame(Math.min(best().max, BANK.stages.length)); };
  $('retryBtn').onclick = function () { startGame(G.stage); };
  $('nextBtn').onclick = function () { startGame(Math.min(G.stage + 1, BANK.stages.length)); };
  $('menuBtn').onclick = toMenu;
  $('quitBtn').onclick = toMenu;
  $('resumeBtn').onclick = togglePause;
  $('pauseBtn').onclick = togglePause;
  $('muteBtn').onclick = function () {
    Voice.muted = !Voice.muted; sfxOn = !Voice.muted;
    if (Voice.muted) Voice.stop();
    $('muteBtn').textContent = Voice.muted ? '🔇' : '🔈';
  };
  $('replayBtn').onclick = function () {
    var z = zoneOf();
    if (!z || z.state !== 'asking') return;
    var qn = 'q_' + LV.st.key + '_' + z.mode + '_' + z.v;
    Voice.say(qn, BANK.lines[qn], '', null);
  };
  window.addEventListener('resize', layout);
}

function togglePause() {
  if (G.mode === 'play') { G.mode = 'pause'; G.paused = true; Voice.stop(); showScreen('pause'); }
  else if (G.mode === 'pause') { G.mode = 'play'; G.paused = false; hideScreens(); }
}

function toMenu() {
  G.mode = 'menu'; G.paused = false;
  Voice.stop(); Voice.hide();
  document.body.classList.remove('playing', 'quizon');
  paintStagePick();
  showScreen('menu');
}

/* ---------- 메인 루프 ---------- */
var last = 0, acc = 0;
var STEP = 1 / 60;
function frame(ts) {
  requestAnimationFrame(frame);
  if (!last) last = ts;
  var dt = Math.min(0.1, (ts - last) / 1000);
  last = ts;
  if (G.mode === 'play' && !G.paused) {
    acc += dt;
    var guard = 0;
    while (acc >= STEP && guard++ < 6) { update(STEP); acc -= STEP; }
  }
  if (LV) render();
}

/* ---------- 시작 ---------- */
function boot() {
  cv = $('game'); cx = cv.getContext('2d');
  layout();
  fetch('bank.json?v=1').then(function (r) { return r.json(); }).then(function (d) {
    BANK = d;
    bindInput();
    paintStagePick();
    requestAnimationFrame(frame);
    var q = new URLSearchParams(location.search);
    if (q.get('test') === 'sim') selfTest();
    else if (q.get('stage')) startGame(clamp(parseInt(q.get('stage'), 10) || 1, 1, d.stages.length));
  }).catch(function (e) {
    showErr('문제 은행을 못 읽었습니다: ' + e.message);
  });
}

/* ===================================================================
   자가 검증 (`?test=sim`)
   ⚠️이 게임은 "재미"보다 **문제와 정답이 어긋나지 않는 것**이 먼저다.
     아이가 맞게 풀었는데 틀렸다고 하면 그건 버그가 아니라 사고다.
     그래서 문제 은행 정합성과 판정 로직을 프레임 단위로 직접 돌려 확인한다.
   =================================================================== */
function selfTest() {
  var fails = [];
  function ck(cond, msg) { if (!cond) fails.push(msg); }

  /* 1. 문제 생성기 — 유형마다 500번씩 돌려 본다.
     ⚠️무작위로 만드는 문제라 한 번 눈으로 본 것으로는 검증이 안 된다.
        "정답이 보기 안에 있고, 보기가 겹치지 않고, 음수가 없고, 문제 문장이 비지 않는다". */
  ck(BANK.stages.length === 8, '스테이지가 8개가 아님: ' + BANK.stages.length);
  BANK.stages.forEach(function (st) {
    ck(!!GEN[st.key], st.title + ': 생성기 없음 (' + st.key + ')');
    if (!GEN[st.key]) return;
    var seenQ = {}, seenA = {};
    for (var n = 0; n < 500; n++) {
      var g;
      try { g = GEN[st.key](); } catch (e) { fails.push(st.key + ': 예외 ' + e.message); break; }
      if (!g || !g.q) { fails.push(st.key + ': 문제 문장 없음'); break; }
      if (typeof g.a !== 'number' || !isFinite(g.a)) { fails.push(st.key + ': 정답이 수가 아님'); break; }
      if (g.c.indexOf(g.a) < 0) { fails.push(st.key + ': 정답이 보기에 없음 ' + g.q); break; }
      if (g.c.length < 3) { fails.push(st.key + ': 보기 부족 ' + g.c.join(',')); break; }
      if (new Set(g.c).size !== g.c.length) { fails.push(st.key + ': 보기 중복 ' + g.c.join(',')); break; }
      if (g.c.some(function (v) { return v < 0 || !isFinite(v); })) {
        fails.push(st.key + ': 이상한 보기 ' + g.c.join(',')); break;
      }
      if (/undefined|NaN/.test(g.q + g.c.join(''))) { fails.push(st.key + ': undefined/NaN ' + g.q); break; }
      if (g.pic && !(g.pic.n >= 1 && g.pic.e)) { fails.push(st.key + ': 그림 정보 이상'); break; }
      seenQ[g.q + '|' + (g.pic ? g.pic.n : '')] = 1; seenA[g.a] = 1;
    }
    // 매번 같은 숫자만 나오면 '랜덤'이 아니다
    ck(Object.keys(seenQ).length >= 5, st.title + ': 500번 돌렸는데 문제가 ' +
       Object.keys(seenQ).length + '가지뿐 (숫자가 안 바뀐다)');
    ck(Object.keys(seenA).length >= 3, st.title + ': 정답 값이 ' +
       Object.keys(seenA).length + '가지뿐');
  });

  /* 1-b. 정답을 실제로 계산해 맞는지 — 문제 문장과 정답이 어긋나면 그건 사고다 */
  for (var t1 = 0; t1 < 400; t1++) {
    var gp = GEN.plus(), mp = gp.q.match(/^(\d+) \+ (\d+)/);
    ck(mp && (+mp[1]) + (+mp[2]) === gp.a, '덧셈 정답 불일치: ' + gp.q + ' → ' + gp.a);
    var gm = GEN.minus(), mm = gm.q.match(/^(\d+) − (\d+)/);
    ck(mm && (+mm[1]) - (+mm[2]) === gm.a, '뺄셈 정답 불일치: ' + gm.q + ' → ' + gm.a);
    var gk = GEN.make10(), mk2 = gk.q.match(/^(\d+)/);
    ck(mk2 && (+mk2[1]) + gk.a === 10, '10 만들기 정답 불일치: ' + gk.q + ' → ' + gk.a);
    var gc = GEN.compare(), mc = gc.q.match(/^(\d+)과\(와\) (\d+)/);
    ck(mc && Math.max(+mc[1], +mc[2]) === gc.a, '크기 비교 정답 불일치: ' + gc.q + ' → ' + gc.a);
    var gs = GEN.skip(), ms = gs.q.match(/^(\d+), (\d+), (\d+)/);
    ck(ms && (+ms[3]) + ((+ms[2]) - (+ms[1])) === gs.a, '뛰어 세기 정답 불일치: ' + gs.q + ' → ' + gs.a);
    if (fails.length > 6) break;
  }

  /* 2. 8스테이지 전부 레벨이 만들어지고, 문제 구역이 겹치지 않는가 */
  for (var s = 1; s <= 8; s++) {
    G.stage = s; LV = buildLevel(s);
    ck(LV.zones.length === QUIZ_PER_STAGE, s + '스테이지 구역 수 ' + LV.zones.length);
    for (var i = 0; i < LV.zones.length; i++) {
      var z = LV.zones[i];
      ck(z.items.length === z.choices.length, s + '-' + i + ' 보기/오브젝트 불일치');
      ck(z.items.filter(function (t) { return t.v === z.p.a; }).length === 1,
         s + '-' + i + ' 정답 오브젝트가 1개가 아님');
      // 문제 구역 발밑에 구덩이가 없어야 한다
      for (var c = z.cc - 6; c <= z.cc + 6; c++) ck(!inGap(c), s + '-' + i + ' 구역 안에 구덩이');
      if (i > 0) ck(LV.zones[i].startX > LV.zones[i - 1].cc * TILE, '구역 간격 역전');
    }
    ck(LV.worldW > 0 && isFinite(LV.worldW), s + '스테이지 월드 폭 이상');
    // 한 판에 두 방식이 모두 나오는가 (벽돌만/몬스터만 나오는 판이 없어야 한다)
    var modes = LV.zones.map(function (z) { return z.mode; });
    ck(modes.indexOf('brick') >= 0 && modes.indexOf('mob') >= 0,
       s + '스테이지에 한 방식만 나옴: ' + modes.join(','));
  }

  /* 3. 점프 한 번으로 벽돌에 머리가 닿는가 (물리 실측) */
  Voice.muted = true; sfxOn = false;
  G.mode = 'play'; startStage(1);
  var apex = P.y;
  P.vy = JUMP_V; P.onG = false;
  keys[' '] = 1;
  for (var f = 0; f < 60; f++) { update(STEP); apex = Math.min(apex, P.y); }
  keys[' '] = 0;
  ck(apex <= BRICK_BOTTOM - 2, '점프로 벽돌에 못 닿음(머리 최고점 ' + Math.round(apex) +
     ' / 벽돌 아랫면 ' + BRICK_BOTTOM + ')');

  /* 4. 정답 벽돌만 부서진다 */
  startStage(1);
  var bi = -1;
  for (var i2 = 0; i2 < LV.zones.length; i2++) if (LV.zones[i2].mode === 'brick') { bi = i2; break; }
  var bz = bi >= 0 ? gotoZone(bi) : null;
  if (!bz) fails.push('벽돌 구역이 없음');
  else {
    var wrongB = bz.items.filter(function (t) { return t.v !== bz.p.a; })[0];
    var rightB = bz.items.filter(function (t) { return t.v === bz.p.a; })[0];
    hitBrick(wrongB);
    ck(!wrongB.dead, '오답 벽돌이 부서짐');
    ck(bz.state === 'asking', '오답인데 문제가 끝남');
    ck(G.lives === LIVES, '오답으로 목숨이 줄었다(설계 위반)');
    hitBrick(rightB);
    ck(rightB.dead, '정답 벽돌이 안 부서짐');
    ck(bz.state === 'done', '정답인데 문제가 안 끝남');
    ck(G.solved === 1, '정답인데 푼 문제 수가 안 늘었다');
  }

  /* 5. 정답 몬스터만 밟힌다 · 오답을 밟아도 다치지 않는다 */
  startStage(1);
  var mi = -1;
  for (var i3 = 0; i3 < LV.zones.length; i3++) if (LV.zones[i3].mode === 'mob') { mi = i3; break; }
  var mz = mi >= 0 ? gotoZone(mi) : null;
  if (!mz) fails.push('몬스터 구역이 없음');
  else {
    var wrongM = mz.items.filter(function (t) { return t.v !== mz.p.a; })[0];
    var rightM = mz.items.filter(function (t) { return t.v === mz.p.a; })[0];
    stompMob(wrongM);
    ck(!wrongM.dead && !wrongM.squash, '오답 몬스터가 죽었다');
    ck(G.lives === LIVES, '오답 몬스터를 밟았는데 목숨이 줄었다(설계 위반)');
    stompMob(rightM);
    ck(rightM.squash > 0, '정답 몬스터가 안 밟혔다');
    ck(mz.state === 'done', '정답인데 문제가 안 끝남');
  }

  /* 6. 몬스터 몸통에 닿으면 다친다(액션 실패는 벌칙이 맞다) */
  startStage(2);
  var mi6 = -1;
  for (var i6 = 0; i6 < LV.zones.length; i6++) if (LV.zones[i6].mode === 'mob') { mi6 = i6; break; }
  var z6 = mi6 >= 0 ? gotoZone(mi6) : null;
  if (z6) {
    var m6 = z6.items[0];
    P.inv = 0; P.vy = 0; P.x = m6.x - 4; P.y = m6.y;
    update(STEP);
    ck(G.lives === LIVES - 1, '몸통에 닿았는데 안 다침');
  }

  /* 7. 처음부터 깃발까지 — 문제를 실제로 풀면서 완주할 수 있는가 */
  startStage(3);
  G.lives = 99;
  keys['ArrowRight'] = 1;
  var stuck = 0, prevX = P.x, reached = false;
  for (var f2 = 0; f2 < 6000; f2++) {
    var zz = zoneOf();
    if (zz && zz.state === 'asking') {
      // 정답 오브젝트를 실제 충돌 경로로 친다(문이 열리는지까지 함께 확인된다)
      var right = zz.items.filter(function (t) { return t.v === zz.p.a; })[0];
      if (right && !right.dead && !right.squash) {
        if (zz.mode === 'brick') hitBrick(right); else stompMob(right);
      }
      P.x = (zz.cc - 2) * TILE; P.y = GY - PH; P.vy = 0;
    }
    var ahead = Math.floor((P.x + PW + 26) / TILE);
    keys[' '] = (inGap(ahead) || inGap(ahead + 1)) && P.onG ? 1 : (P.vy < 0 ? keys[' '] : 0);
    update(STEP);
    if (!isFinite(P.x) || !isFinite(P.y)) { fails.push('좌표가 NaN'); break; }
    if (Math.abs(P.x - prevX) < 0.2) stuck++; else stuck = 0;
    prevX = P.x;
    if (P.flag) { reached = true; break; }
  }
  keys['ArrowRight'] = 0; keys[' '] = 0;
  ck(reached, '문제를 다 풀었는데도 깃발까지 못 감');
  ck(G.solved === QUIZ_PER_STAGE, '완주했는데 푼 문제 수가 ' + G.solved);
  ck(stuck < 500, '한 자리에 오래 갇힘');

  /* 7-b. 문제를 풀기 전에는 구역을 못 벗어난다 */
  startStage(5);
  var zg2 = gotoZone(0);
  P.x = zg2.gateX + 200; P.vx = 200;
  update(STEP);
  ck(P.x + PW <= zg2.gateX + 0.5, '안 푼 문제 구역을 지나쳤다 (문이 안 막음)');
  zg2.state = 'done';
  P.x = zg2.gateX + 5;
  update(STEP);
  ck(P.x > zg2.gateX, '문제를 풀었는데 문이 안 열렸다');

  /* 8. 문제를 다 풀지 않으면 깃발이 안 열린다 */
  startStage(4);
  P.x = LV.goalC * TILE + 2; P.y = GY - PH; P.vy = 0;
  update(STEP);
  ck(!P.flag, '문제를 안 풀었는데 깃발이 열렸다');
  LV.zones.forEach(function (z) { z.state = 'done'; });
  P.x = LV.goalC * TILE + 2;
  update(STEP);
  ck(P.flag === 1, '문제를 다 풀었는데 깃발이 안 열렸다');

  /* 9. 나레이션 — 유형마다 필요한 클립 이름이 대본에 다 있는가 */
  var need = Object.keys(BANK.lines);
  BANK.stages.forEach(function (st) {
    for (var v = 0; v < (BANK.variants || 2); v++) {
      ['q_' + st.key + '_brick_' + v, 'q_' + st.key + '_mob_' + v,
       'o_' + st.key + '_' + v, 'x_' + st.key + '_' + v].forEach(function (n) {
        ck(need.indexOf(n) >= 0, '대본에 없는 음성: ' + n);
      });
    }
  });
  ['c_welcome', 'c_stage', 'c_clear', 'c_hurt', 'c_over', 'c_win'].forEach(function (n) {
    ck(need.indexOf(n) >= 0, '대본에 없는 공통 음성: ' + n);
  });
  // ⚠️나레이션은 '유형'만 가르쳐야 한다 — 문제별 음성이 생기면 난수 문제와 어긋난다.
  //   (숫자가 들어갔는지로는 못 가린다: '1 큰 수', '10 묶음', '50까지의 수'는 개념어다.)
  //   대본이 유형 단위로만 이루어져 있는지를 개수로 확인한다.
  var expect = BANK.stages.length * ((BANK.variants || 2) * 2 + (BANK.variants || 2) * 2) + 6;
  ck(need.length === expect,
     '대본 클립 수가 유형 단위가 아님: ' + need.length + ' (기대 ' + expect + ')');

  /* 10. 세이브 왕복 */
  var keep = localStorage.getItem(SAVE_KEY);
  save({ max: 5, stars: 7, cleared: { 3: true } });
  var b = best();
  ck(b.max === 5 && b.stars === 7 && b.cleared[3], '세이브 왕복 실패');
  if (keep === null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY, keep);


  /* ===== 11. 소리를 껐을 때도 진행이 멈추지 않는가 =====
     ⚠️이 게임은 **나레이션이 끝나야** 다음으로 넘어간다(해설 → 배너 내림 → 다음 문제).
        음소거에서 콜백이 안 불리면 게임이 그 자리에서 멈춘다 — 소리를 끄고 노는 아이가 있다. */
  var wasMuted = Voice.muted;
  Voice.muted = true;
  var called = 0;
  Voice.say('c_stage', '검사', '', function () { called++; });
  ck(called === 1, '음소거일 때 나레이션 콜백이 안 불림 — 진행이 멈춘다');
  Voice.seq([{ n: 'c_stage', t: '하나' }, { n: 'c_clear', t: '둘' }], '', function () { called++; });
  ck(called === 2, '음소거일 때 seq 콜백이 안 불림 — 진행이 멈춘다');

  /* 12. 나레이션이 겹치지 않는가 — 새 말이 나오면 이전 말은 끊겨야 한다 */
  var stopped = 0;
  Voice.cur = { pause: function () { stopped++; }, onended: null, onerror: null };
  Voice.say('c_stage', '검사', '', null);
  ck(stopped === 1, '새 나레이션이 이전 것을 안 끊는다 — 목소리가 겹쳐 들린다');

  /* 13. seq 재생 순서 */
  var order = [], origSub = Voice.subtitle;
  Voice.subtitle = function (t, k) { order.push(t); origSub.call(Voice, t, k); };
  Voice.seq([{ n: 'c_stage', t: '하나' }, { n: 'c_clear', t: '둘' }, { n: 'c_win', t: '셋' }],
            '', function () { order.push('끝'); });
  Voice.subtitle = origSub;
  ck(order.join('>') === '하나>둘>셋>끝', 'seq 재생 순서가 어긋남: ' + order.join('>'));
  Voice.muted = wasMuted;
  Voice.stop();

  /* ===== 14. 클리어하면 저장되고 다음이 열리는가 ===== */
  var keep2 = localStorage.getItem(SAVE_KEY);
  localStorage.removeItem(SAVE_KEY);
  G.mode = 'play'; startStage(2); G.stars = 5;
  LV.zones.forEach(function (z) { z.state = 'done'; });
  stageClear();
  ck(best().cleared[2], '클리어했는데 저장이 안 됨');
  ck(best().max >= 3, '클리어했는데 다음 단계가 안 열림 (max=' + best().max + ')');
  ck(best().stars >= 5, '클리어했는데 별이 저장 안 됨');
  if (keep2 === null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY, keep2);

  /* 15. 목숨이 0이면 게임오버로 간다 */
  G.mode = 'play'; startStage(1); G.lives = 1;
  die();
  P.deadT = 0; update(STEP);
  ck(G.lives === 0, '마지막 목숨이 안 줄었다');
  ck(G.mode === 'result', '목숨이 0인데 게임오버가 안 됐다 (mode=' + G.mode + ')');

  /* 16. 세이브 키가 게임마다 분리되어 있는가 (섞이면 진도가 뒤엉킨다) */
  ck(SAVE_KEY.indexOf(SAVE_TAG) >= 0, '세이브 키가 이 게임 것이 아님: ' + SAVE_KEY);

  /* ===== 17. 여덟 단계 전부 완주할 수 있는가 =====
     ⚠️한 단계만 돌려 보고 넘어가면, 뒤쪽 단계에서 못 넘는 구덩이나 못 닿는 벽돌이 남는다. */
  for (var sN = 1; sN <= 8; sN++) {
    G.mode = 'play'; startStage(sN); G.lives = 99; G.introT = 0;
    keys['ArrowRight'] = 1;
    var ok = false, guard = 0;
    for (var fN = 0; fN < 6000; fN++) {
      var zz = zoneOf();
      if (zz && zz.state === 'asking') {
        var right = zz.items.filter(function (t) { return t.v === zz.p.a; })[0];
        if (right && !right.dead && !right.squash) {
          if (zz.mode === 'brick') hitBrick(right); else stompMob(right);
        }
        P.x = (zz.cc - 2) * TILE; P.y = GY - PH; P.vy = 0;
      }
      var ah = Math.floor((P.x + PW + 26) / TILE);
      keys[' '] = (inGap(ah) || inGap(ah + 1)) && P.onG ? 1 : (P.vy < 0 ? keys[' '] : 0);
      update(STEP);
      if (!isFinite(P.x) || !isFinite(P.y)) { fails.push(sN + '단계: 좌표가 NaN'); break; }
      if (P.flag) { ok = true; break; }
      guard = fN;
    }
    keys['ArrowRight'] = 0; keys[' '] = 0;
    ck(ok, sN + '단계: 문제를 다 풀었는데 깃발까지 못 감 (' + guard + '프레임)');
    ck(G.solved === QUIZ_PER_STAGE, sN + '단계: 완주했는데 푼 문제가 ' + G.solved);
  }

  /* ===== 18. 보기가 서로 겹치지 않는가 (순찰 폭까지 고려) ===== */
  for (var sO = 1; sO <= 8; sO++) {
    G.stage = sO; LV = buildLevel(sO);
    LV.zones.forEach(function (z) {
      var its = z.items.slice().sort(function (a, b) { return a.x - b.x; });
      for (var k = 1; k < its.length; k++) {
        var prevR = (its[k - 1].x1 !== undefined ? its[k - 1].x1 : its[k - 1].x) + its[k - 1].w;
        var curL = its[k].x0 !== undefined ? its[k].x0 : its[k].x;
        ck(curL - prevR >= 12,
           sO + '단계: 보기가 겹친다 (' + its[k - 1].v + ' ↔ ' + its[k].v + ')');
      }
    });
  }

  /* ===== 19. 좁은 화면(620px)에서도 보기가 전부 보이는가 =====
     ⚠️문제를 푸는 동안 카메라는 구역에 고정된다. 그 상태에서 보기가 화면 밖이면
        아이는 있는 줄도 모르는 답을 고르지 못한다. */
  var NARROW = 620;
  for (var sV = 1; sV <= 8; sV++) {
    G.stage = sV; LV = buildLevel(sV);
    LV.zones.forEach(function (z) {
      var cam = z.cc * TILE + TILE / 2 - NARROW / 2;
      z.items.forEach(function (it) {
        var left = (it.x0 !== undefined ? it.x0 : it.x) - cam;
        var right = (it.x1 !== undefined ? it.x1 : it.x) + it.w - cam;
        ck(left >= 0 && right <= NARROW,
           sV + '단계: 좁은 화면에서 보기 "' + it.v + '" 가 화면 밖 (' +
           Math.round(left) + '~' + Math.round(right) + ' / 0~' + NARROW + ')');
      });
    });
  }

  /* ===== 20. 구덩이를 실제로 넘을 수 있는가 (물리로 계산) ===== */
  var airT = 2 * Math.abs(JUMP_V) / GRAV;          // 최대 체공 시간
  var reach = RUN_MAX * airT;                       // 최대 도약 거리
  for (var sG = 1; sG <= 8; sG++) {
    G.stage = sG; LV = buildLevel(sG);
    LV.gaps.forEach(function (g) {
      var need = (g.c1 - g.c0 + 1) * TILE + PW;
      ck(reach >= need * 1.25,
         sG + '단계: 구덩이가 너무 넓다 (필요 ' + Math.round(need) +
         'px / 최대 도약 ' + Math.round(reach) + 'px)');
    });
  }

  /* 음성 파일 존재 확인은 비동기 — 끝나면 결과를 갱신한다 */
  report(fails, need.length, true);
  var missing = [];
  var done = 0;
  need.forEach(function (n) {
    fetch('voice/' + n + '.mp3', { method: 'HEAD' }).then(function (r) {
      if (!r.ok) missing.push(n);
    }).catch(function () { missing.push(n); }).then(function () {
      if (++done === need.length) {
        if (missing.length) fails.push('음성 파일 없음 ' + missing.length + '개: ' + missing.slice(0, 5).join(', '));
        report(fails, need.length, false);
      }
    });
  });
}

function report(fails, clips, partial) {
  var out = document.getElementById('sim-test') || document.createElement('pre');
  out.id = 'sim-test';
  out.style.cssText = 'position:fixed;inset:0;z-index:999;background:#101c30;color:#dfe;' +
    'padding:22px;white-space:pre-wrap;font:13px/1.65 ui-monospace,monospace;overflow:auto';
  out.textContent = fails.length
    ? 'SIM FAIL (' + fails.length + ')\n' + fails.join('\n')
    : 'SIM PASS — 문제 생성기 8종 × 500회 · 음성 클립 ' + clips + ' · 판정/물리/진행 검사 통과' +
      (partial ? '\n(음성 파일 존재 확인 중…)' : '\n음성 파일 전수 확인 완료');
  document.title = fails.length ? 'SIM FAIL' : (partial ? 'SIM RUNNING' : 'SIM PASS');
  if (!out.parentNode) document.body.appendChild(out);
}

/* 테스트용 헬퍼 — 실제 충돌과 같은 경로를 타야 의미가 있다.
   ⚠️구역을 건너뛰고 좌표만 옮기면 안 된다: update() 는 지나온 구역을 순서대로 활성화하고,
     활성 구역의 '문'이 플레이어를 되돌려 놓는다(실제로 이 함정에 한 번 빠졌다). */
function gotoZone(i) {
  for (var k = 0; k < i; k++) LV.zones[k].state = 'done';
  activateZone(i);
  var z = LV.zones[i];
  P.x = (z.cc - 5) * TILE; P.y = GY - PH; P.vx = 0; P.vy = 0; P.inv = 0;
  return z;
}

function hitBrick(b) {
  P.x = b.x + b.w / 2 - PW / 2;
  P.y = b.y + b.h - 6;
  P.vy = -200;
  update(STEP);
}
function stompMob(m) {
  P.x = m.x + m.w / 2 - PW / 2;
  P.y = m.y - PH + 6;
  P.vy = 300;
  P.inv = 0;
  update(STEP);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
