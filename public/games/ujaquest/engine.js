/* ===================================================================
   유자의 동산 여행 — 과학동산 / 도덕동산 공용 엔진 (menewsoft.com AI 인디게임)

   [[yujin-math-game]](유진이의 수학여행)과 같은 놀이 방식이지만 문제의 성질이 다르다:
   **답이 숫자가 아니라 낱말**이다. 그래서 두 가지가 갈린다 —
   ① 수학은 규칙으로 숫자를 만들 수 있어 난수로 냈지만, 여기는 **문제 은행**(동산마다 10문제)에서
      한 판에 4개를 무작위로 뽑는다.
   ② 수학 문제는 화면의 식만 봐도 읽히지만 여기 문제는 **문장**이라 1학년에겐 읽기가 벽이다.
      → 문제 문장을 **문제마다 음성으로 읽어 준다**(수학은 유형만 읽어 줬다).

   한 파일로 두 게임을 굴린다 — `window.QUEST_SUBJECT` 가 'science' | 'moral'.
   =================================================================== */
/* 원본 설계 노트(그대로 유지되는 원칙) — menewsoft.com AI 인디게임
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
var WORLD_H = 560;
var PAD_INSET = 0;           // 화면 조작 버튼이 차지하는 아래쪽 높이(논리 px)            // 세계의 높이(ROWS*TILE). 세계는 캔버스 '아래'에 붙인다.
var TILE = 40;
var ROWS = 14;
var GROUND_ROW = 11;          // 지면 윗면이 놓이는 행
var GY = GROUND_ROW * TILE;   // 지면 윗면 y (=440)
var GRAV = 2100;
var JUMP_V = -760;
var RUN_A = 1500, RUN_MAX = 250, FRICT = 1400;
var PW = 30, PH = 44;         // 플레이어 히트박스
var BRICK = 46;               // (숫자용 기본값 — 낱말은 WORD_W 를 쓴다)
var BRICK_BOTTOM = GY - 150;  // 벽돌 아랫면 — 점프 한 번으로 머리가 닿는 높이
var QUIZ_PER_STAGE = 4;       // 한 판에 나오는 문제 수(동산 은행 10개 중에서 뽑는다)
var LIVES = 3;
var SUBJECT = window.QUEST_SUBJECT || 'science';
// 주인공 — 같은 동산을 아이마다 자기 모습으로 간다. 음성·문제 은행은 그대로 같이 쓰고
// 이름을 부르는 인사말(c_welcome_<주인공>)만 갈린다. ⚠️몸 크기·히트박스는 모두 같다.
var HERO = window.QUEST_HERO || 'uja';
var WELCOME = 'c_welcome' + (HERO === 'uja' ? '' : '_' + HERO);
var SAVE_TAG = 'uja_quest';
// ⚠️유자의 진도가 이미 저장돼 있다 — 유자 키는 건드리지 않고 새 주인공만 뒤에 붙인다.
var SAVE_KEY = 'uja_quest_' + SUBJECT + (HERO === 'uja' ? '' : '_' + HERO) + '_v1';
// ⚠️보기가 낱말이라 숫자보다 훨씬 넓다 → 보기는 3개, 벽돌·몬스터를 넓게 벌려 놓는다.
// ⚠️BOX_H 를 WORLD_H(세계 높이)와 헷갈리지 말 것 — 이름이 비슷해 한 번 위험했다.
var WORD_W = 144, BOX_H = 54, MOB_H = 62;

var THEME_SETS = {
  science: [
    { sky: ['#a8e6a3', '#e8fbe6'], hill: '#4f9d52', ground: '#6b4a2a', top: '#3f8a44', deco: 'tree' },
    { sky: ['#d9f2a8', '#f4ffe6'], hill: '#7cb342', ground: '#7a5a2a', top: '#66a83c', deco: 'flower' },
    { sky: ['#bfe3ff', '#f2fbff'], hill: '#8fb8d8', ground: '#7a6a8a', top: '#9fb4cf', deco: 'cloud' },
    { sky: ['#a0d8ff', '#eaf6ff'], hill: '#5fa8d8', ground: '#4a6a8a', top: '#7fc0e8', deco: 'wave' },
    { sky: ['#ffd9a0', '#fff3e0'], hill: '#c98f45', ground: '#8a6a3a', top: '#d8a95f', deco: 'crystal' },
    { sky: ['#ffe6a0', '#fffbe8'], hill: '#d8b45a', ground: '#8a6a3a', top: '#c0a04a', deco: 'lamp' },
    { sky: ['#ffc6d9', '#fff0f5'], hill: '#d98aa8', ground: '#9a6a5a', top: '#c07d94', deco: 'bell' },
    { sky: ['#3a3f7a', '#8f93d6'], hill: '#2e3260', ground: '#3a3550', top: '#4b4a80', deco: 'star' }
  ],
  moral: [
    { sky: ['#ffe1c4', '#fff6ea'], hill: '#e0a95f', ground: '#a9743c', top: '#c98f45', deco: 'house' },
    { sky: ['#cfe8ff', '#f0f8ff'], hill: '#7fa8cf', ground: '#6f7f9a', top: '#9ec2e0', deco: 'bridge' },
    { sky: ['#ffe6a0', '#fffbe8'], hill: '#d8b45a', ground: '#8a6a3a', top: '#c0a04a', deco: 'lamp' },
    { sky: ['#ffc6d9', '#fff0f5'], hill: '#d98aa8', ground: '#9a6a5a', top: '#c07d94', deco: 'flower' },
    { sky: ['#bfe3ff', '#f2fbff'], hill: '#8fb8d8', ground: '#7a6a8a', top: '#9fb4cf', deco: 'castle' },
    { sky: ['#d8d2f0', '#f4f2ff'], hill: '#9a90c8', ground: '#6a5f88', top: '#b0a6dc', deco: 'crystal' },
    { sky: ['#ffd9a0', '#fff3e0'], hill: '#e8b06a', ground: '#9a6a3a', top: '#d8a95f', deco: 'bell' },
    { sky: ['#a8e6a3', '#e8fbe6'], hill: '#4f9d52', ground: '#6b4a2a', top: '#3f8a44', deco: 'tree' }
  ]
};
var THEMES = THEME_SETS[SUBJECT] || THEME_SETS.science;


/* ---------- 상태 ---------- */
var cv, cx, VW = 900, DPR = 1;
var BANK = null;
var VOICE_BASE = 'voice/' + SUBJECT + '/';
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
    var a = new Audio(VOICE_BASE + name + '.mp3');
    a.preload = 'auto';
    this.cache[name] = a;
    return a;
  },
  prefetch: function (names) { for (var i = 0; i < names.length; i++) this.get(names[i]).load(); },
  /** 여러 클립을 순서대로 재생한다(문장 경계라 이어 붙여도 자연스럽다).
      list = [{n: 파일이름, t: 자막}] */
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
   레벨 만들기
   한 판 = 문제 4개. 문제 구역 사이는 걷고 뛰는 '숨 돌리는 구간'이다.
   ⚠️문제 구역 안에는 구덩이를 두지 않는다 — 생각하는 동안 발밑까지 신경 쓰게 하면
     푸는 게 아니라 버티는 게임이 된다.
   =================================================================== */
var ZONE_SPAN = 28;           // 구역 간 간격(칸) — 화면 폭(최대 1600px=40칸)보다 좁으면
                              // 다음 구역 문제가 지금 문제와 같이 보인다. 아이가 헷갈린다.
var ZONE_START = 15;          // ⚠️첫 구역 중심. 낱말 보기가 넓어(±6칸) 시작 지점과 겹치면
                              //   출발하자마자 몬스터 위에 서 있게 된다(자가검증이 잡아냈다).           // 첫 구역 중심

function buildLevel(stage) {
  var st = BANK.stages[stage - 1];
  var probs = pickN(st.problems, QUIZ_PER_STAGE);
  var lv = { stage: stage, st: st, gaps: [], plats: [], zones: [], stars: [] };

  // ⚠️한 판에 벽돌과 몬스터가 둘 다 나오게 번갈아 배치한다.
  var first = rnd(2) ? 'brick' : 'mob';
  for (var i = 0; i < probs.length; i++) {
    var p = probs[i];
    var mode = (i % 2 === 0) === (first === 'brick') ? 'brick' : 'mob';
    var c = ZONE_START + i * ZONE_SPAN;
    var choices = shuffle(p.c);
    var z = {
      i: i, p: p, cc: c, choices: choices, mode: mode, v: rnd(BANK.variants || 2),
      startX: (c - 11) * TILE, gateX: (c + 8) * TILE, state: 'idle', tries: 0, items: []
    };
    // ⚠️낱말 보기는 넓다 — 3개를 5칸 간격으로 벌려 놓아야 글자가 서로 겹치지 않는다.
    for (var k = 0; k < choices.length; k++) {
      // ⚠️낱말 상자는 넓다. 간격은 두 조건 사이에서 정해진다 —
      //   너무 좁으면 상자끼리 겹치고, 너무 넓으면 **좁은 화면(620px)에서 바깥 보기가 화면 밖**으로 나간다.
      //   5칸(200px) + 순찰 ±16px 가 둘을 모두 만족한다(자가검증 18·19번이 지킨다).
      var cx0 = (c - 5 + k * 5) * TILE + TILE / 2;
      if (mode === 'brick') {
        z.items.push({
          kind: 'brick', v: choices[k], dead: false, wrong: 0, bump: 0,
          x: cx0 - WORD_W / 2, y: BRICK_BOTTOM - BOX_H, w: WORD_W, h: BOX_H, z: z
        });
      } else {
        z.items.push({
          kind: 'mob', v: choices[k], dead: false, wrong: 0, squash: 0,
          x: cx0 - WORD_W / 2, y: GY - MOB_H, w: WORD_W, h: MOB_H,
          vx: (k % 2 ? 18 : -18), x0: cx0 - WORD_W / 2 - 16, x1: cx0 - WORD_W / 2 + 16, z: z
        });
      }
    }
    lv.zones.push(z);
    if (i < probs.length - 1) {
      var gc = c + 14;
      lv.gaps.push({ c0: gc, c1: gc + 1 });
      lv.plats.push({ c: gc - 1, row: GROUND_ROW - 3, len: 3 });
      lv.stars.push({ x: gc * TILE + 10, y: (GROUND_ROW - 4) * TILE, got: false });
      lv.stars.push({ x: (c + 9) * TILE, y: (GROUND_ROW - 2) * TILE, got: false });
    }
  }
  lv.goalC = ZONE_START + probs.length * ZONE_SPAN - 6;
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
  askZone(z, true);
}

/** 문제를 들려준다. intro 는 처음 한 번만(다시 듣기·오답 뒤에는 문제 문장만). */
function askZone(z, withIntro) {
  var list = [];
  if (withIntro) {
    var inm = 'intro_' + LV.st.key + '_' + z.mode + '_' + z.v;
    list.push({ n: inm, t: BANK.lines[inm] });
  }
  list.push({ n: 'q_' + z.p.id, t: BANK.lines['q_' + z.p.id] });
  Voice.seq(list, '', null);
}

function paintQuiz(z) {
  var q = document.getElementById('qText'), cpt = document.getElementById('qConcept'),
      pic = document.getElementById('qPic'), hint = document.getElementById('qHint');
  if (!q) return;
  cpt.textContent = LV.st.concept;
  q.textContent = z.p.q;
  pic.textContent = ''; pic.style.display = 'none';
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
    var on = 'o_' + z.p.id;
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
    // ⚠️힌트만 주고 답은 말하지 않는다 — 답을 알려 주면 다시 풀 기회가 사라진다.
    //   힌트가 끝나면 문제를 한 번 더 읽어 준다(문제를 잊은 채 멈추지 않게).
    var xn = 'x_' + LV.st.key + '_' + z.v;
    Voice.say(xn, BANK.lines[xn], 'bad', function () {
      Voice.hide();
      if (z.state === 'asking') askZone(z, false);
    });
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
    names.push('intro_' + LV.st.key + '_' + z.mode + '_' + z.v,
               'q_' + z.p.id, 'o_' + z.p.id, 'x_' + LV.st.key + '_' + z.v);
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
  Voice.say(WELCOME, BANK.lines[WELCOME] || BANK.lines.c_welcome, '', function () { Voice.hide(); });
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

  cx.translate(0, VH - WORLD_H - PAD_INSET);   // 세계를 아래에 붙인다(조작 버튼 높이만큼 띄운다)
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
      // ⚠️태블릿 모드에서는 세계를 버튼 높이만큼 올렸다 — 그만큼 땅을 **이어서** 그린다.
      //   평평한 색으로 메우면 아래쪽이 커다란 갈색 판처럼 보인다.
      var rEnd = ROWS + (PAD_INSET > 0 ? Math.ceil(PAD_INSET / TILE) + 1 : 0);
      for (var r = GROUND_ROW; r < rEnd; r++) {
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
  labelOn(String(b.v), b.x, y, b.w, b.h, '#fffdf5', 'rgba(80,40,10,.85)');
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
    var ex = m.x + m.w / 2, ey = y + h * 0.26 + wob;
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.ellipse(ex - 11, ey, 7.5, 9, 0, 0, 7); cx.fill();
    cx.beginPath(); cx.ellipse(ex + 11, ey, 7.5, 9, 0, 0, 7); cx.fill();
    cx.fillStyle = '#20303a';
    var look = m.vx > 0 ? 2 : -2;
    cx.beginPath(); cx.arc(ex - 11 + look, ey + 1.5, 4.2, 0, 7); cx.fill();
    cx.beginPath(); cx.arc(ex + 11 + look, ey + 1.5, 4.2, 0, 7); cx.fill();
    cx.fillStyle = 'rgba(255,255,255,.95)';
    cx.beginPath(); cx.arc(ex - 13, ey - 2.4, 2.1, 0, 7); cx.fill();
    cx.beginPath(); cx.arc(ex + 9, ey - 2.4, 2.1, 0, 7); cx.fill();
    cx.fillStyle = 'rgba(255,140,150,.35)';
    cx.beginPath(); cx.arc(ex - 26, ey + 8, 5, 0, 7); cx.fill();
    cx.beginPath(); cx.arc(ex + 26, ey + 8, 5, 0, 7); cx.fill();
    // 숫자표
    var tw = m.w - 14, th = 24, ty = y + h * 0.5 + wob;
    cx.fillStyle = '#fffdf5';
    roundRect(m.x + 7, ty, tw, th, 7); cx.fill();
    cx.strokeStyle = 'rgba(40,60,40,.5)'; cx.lineWidth = 2;
    roundRect(m.x + 7, ty, tw, th, 7); cx.stroke();
    labelOn(String(m.v), m.x + 7, ty, tw, th, '#243b2a', null);
  }
  cx.restore();
}

/** 상자 안에 낱말을 넣는다. 글자가 길면 글씨를 줄여서라도 상자 밖으로 안 나가게 한다.
    ⚠️보기가 잘리면 아이는 '읽을 수 없는 답'을 고르게 된다 — 잘림은 오답보다 나쁘다. */
function labelOn(text, x, y, w, h, fill, stroke) {
  var size = h > 40 ? 25 : 16;
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for (; size > 9; size--) {
    cx.font = '900 ' + size + 'px sans-serif';
    if (cx.measureText(text).width <= w - 12) break;
  }
  if (stroke) { cx.strokeStyle = stroke; cx.lineWidth = 4; cx.strokeText(text, x + w / 2, y + h / 2 + 1); }
  cx.fillStyle = fill;
  cx.fillText(text, x + w / 2, y + h / 2 + 1);
  cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
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
  if (HERO === 'kkaebi') { drawKkaebi(); return; }
  drawUja();
}

/* 깨비 — 도깨비 아이(작은 뿔 두 개, 파란 피부, 호랑이무늬 조끼)
   ⚠️피부색을 하늘색으로 하면 하늘 배경에 묻힌다 — 하늘보다 진한 청록으로 잡고,
      주황 호랑이무늬 조끼로 한 번 더 떼어 놓는다. 몸 크기·히트박스는 세 아이가 모두 같다. */
function drawKkaebi() {
  var x = P.x, y = P.y, d = P.dir;
  if (P.inv > 0 && Math.floor(P.inv * 12) % 2) return;
  var walk = P.onG && Math.abs(P.vx) > 20 ? Math.sin(P.anim * 6) : 0;
  var lean = P.onG ? walk * 0.06 : clamp(P.vy / 1400, -0.16, 0.16);
  var SKIN = '#3fb3c9';
  cx.save();
  cx.fillStyle = 'rgba(20,14,30,.2)';
  cx.beginPath(); cx.ellipse(x + PW / 2, GY - 2, 16, 5, 0, 0, 7); cx.fill();
  cx.translate(x + PW / 2, y + PH);
  cx.rotate(lean * d);
  cx.scale(d, 1);

  // 다리
  cx.fillStyle = SKIN;
  cx.fillRect(-9, -16, 7, 16 + walk * 3);
  cx.fillRect(3, -16, 7, 16 - walk * 3);
  cx.fillStyle = '#6b4326';                       // 반바지
  cx.fillRect(-10, -26, 9, 12);
  cx.fillRect(2, -26, 9, 12);
  cx.fillStyle = '#d9b872';                       // 짚신
  cx.fillRect(-11, -5 + Math.max(0, walk * 3), 11, 5);
  cx.fillRect(1, -5 + Math.max(0, -walk * 3), 11, 5);

  // 호랑이무늬 조끼
  cx.fillStyle = '#f0a03a';
  cx.beginPath();
  cx.moveTo(-10, -36); cx.lineTo(10, -36); cx.lineTo(11, -22); cx.lineTo(-11, -22);
  cx.closePath(); cx.fill();
  cx.save();                                      // 무늬가 조끼 밖으로 삐져나가지 않게
  cx.beginPath();
  cx.moveTo(-10, -36); cx.lineTo(10, -36); cx.lineTo(11, -22); cx.lineTo(-11, -22);
  cx.closePath(); cx.clip();
  cx.fillStyle = 'rgba(48,30,16,.8)';       // 줄무늬는 가늘게 — 굵으면 주황이 다 덮여 갈색 옷이 된다
  cx.fillRect(-7.6, -37, 2.8, 11);
  cx.fillRect(-1.0, -35, 2.8, 11);
  cx.fillRect(5.4, -37, 2.8, 11);
  cx.restore();
  var gd = cx.createLinearGradient(-11, -36, 11, -22);
  gd.addColorStop(0, 'rgba(255,255,255,.4)'); gd.addColorStop(0.6, 'rgba(255,255,255,0)');
  gd.addColorStop(1, 'rgba(0,0,0,.18)');
  cx.fillStyle = gd;
  cx.beginPath();
  cx.moveTo(-10, -36); cx.lineTo(10, -36); cx.lineTo(11, -22); cx.lineTo(-11, -22);
  cx.closePath(); cx.fill();

  // 팔(조끼라 소매가 없다)
  cx.fillStyle = SKIN;
  cx.fillRect(-14, -35, 5, 15 + walk * 2);
  cx.fillRect(9, -35, 5, 15 - walk * 2);

  // 머리
  var hy = -47;
  // 뿔 — 머리보다 먼저 그려 뒤에서 솟아 나오게 한다.
  // ⚠️바깥으로 눕히면 귀처럼 보인다 — 거의 곧게 세우고 머리 위로 확실히 내보낸다.
  cx.fillStyle = '#ffe6b8';
  cx.strokeStyle = '#c99a52'; cx.lineWidth = 1.4;
  cx.beginPath();
  cx.moveTo(-8.5, hy - 6); cx.lineTo(-6.2, hy - 25); cx.lineTo(-2.5, hy - 8);
  cx.closePath(); cx.fill(); cx.stroke();
  cx.beginPath();
  cx.moveTo(2.5, hy - 8); cx.lineTo(6.2, hy - 25); cx.lineTo(8.5, hy - 6);
  cx.closePath(); cx.fill(); cx.stroke();

  var fg = cx.createRadialGradient(-4, hy - 5, 2, 0, hy, 15);
  fg.addColorStop(0, '#9fe6f2'); fg.addColorStop(0.6, '#4dbdd2'); fg.addColorStop(1, '#2b8ba0');
  cx.fillStyle = fg;
  cx.beginPath(); cx.arc(0, hy, 14, 0, 7); cx.fill();

  cx.fillStyle = '#2b2140';                       // 삐죽삐죽한 머리카락
  cx.beginPath(); cx.arc(0, hy - 1, 14.2, Math.PI, 0); cx.fill();
  cx.fillRect(-14.2, hy - 3, 28.4, 5);
  cx.beginPath();
  cx.moveTo(-6, hy - 13); cx.lineTo(-2, hy - 18); cx.lineTo(1, hy - 12);
  cx.closePath(); cx.fill();

  // 눈(도깨비라 조금 크다)
  cx.fillStyle = '#fff';
  cx.beginPath(); cx.ellipse(-5, hy + 3, 3.8, 4.6, 0, 0, 7); cx.fill();
  cx.beginPath(); cx.ellipse(5.5, hy + 3, 3.8, 4.6, 0, 0, 7); cx.fill();
  cx.fillStyle = '#1b2b3a';
  cx.beginPath(); cx.arc(-4.4, hy + 3.6, 2.4, 0, 7); cx.fill();
  cx.beginPath(); cx.arc(6.2, hy + 3.6, 2.4, 0, 7); cx.fill();
  cx.fillStyle = 'rgba(255,255,255,.95)';
  cx.beginPath(); cx.arc(-5.2, hy + 2.2, 1.2, 0, 7); cx.fill();
  cx.beginPath(); cx.arc(5.4, hy + 2.2, 1.2, 0, 7); cx.fill();
  // 볼 · 입 · 작은 송곳니
  cx.fillStyle = 'rgba(255,120,120,.3)';
  cx.beginPath(); cx.arc(-9, hy + 7, 3.2, 0, 7); cx.fill();
  cx.beginPath(); cx.arc(10, hy + 7, 3.2, 0, 7); cx.fill();
  cx.strokeStyle = '#1d5a66'; cx.lineWidth = 1.6; cx.beginPath();
  cx.arc(0.6, hy + 7, 3.4, 0.15 * Math.PI, 0.85 * Math.PI); cx.stroke();
  cx.fillStyle = '#fffdf5';
  cx.beginPath();
  cx.moveTo(2.2, hy + 6.6); cx.lineTo(4.6, hy + 6.6); cx.lineTo(3.4, hy + 9.6);
  cx.closePath(); cx.fill();
  cx.restore();
}

/* 유자 — 여자아이(양갈래 머리, 원피스) */
function drawUja() {
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
  roundRect(VW / 2 - w / 2, VH - 74 - PAD_INSET, w, 40, 14); cx.fill();
  cx.fillStyle = '#ffe28a';
  cx.fillText(G.msg, VW / 2, VH - 48 - PAD_INSET);
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
  placeTopUi();      // 칩 내용이 바뀌면 줄 수가 바뀔 수 있다
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
  // ⚠️화면 조작 버튼은 화면 아래를 덮는다. 세계를 그대로 바닥에 붙이면 **버튼이 캐릭터가
  //   걸어다니는 자리를 가린다**(폰에서 특히). 버튼 높이만큼 세계를 위로 올리고,
  //   생긴 아래 여백은 땅으로 메운다.
  // ⚠️필요한 만큼만 올린다. 고정값을 쓰면 가로 태블릿처럼 원래도 여유가 있는 화면에서
  //   아래가 갈색 벌판이 된다. **버튼의 실제 위치를 재서** 지면이 버튼 위에 오도록만 맞춘다.
  PAD_INSET = 0;
  if (document.body.classList.contains('pad')) {
    var jb = document.getElementById('tJump');
    var r = jb ? jb.getBoundingClientRect() : null;
    var topCss = r && r.height ? r.top : h - 130;      // 아직 안 그려졌으면 대략값
    var need = GY + VH - WORLD_H - topCss * (VH / h) + 10;
    PAD_INSET = Math.max(0, Math.round(need));
  }
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.imageSmoothingEnabled = true;
  placeTopUi();
}

/** ⚠️좁은 화면에서는 HUD 칩이 두 줄로 접힌다 — 배너 위치를 고정해 두면 그 위에 겹쳐 앉는다.
    HUD 가 실제로 차지한 높이를 재서 그만큼 내린다. */
function placeTopUi() {
  var hud = $('hud'), top = $('topui');
  if (!top) return;
  var h = hud && hud.offsetHeight ? hud.offsetHeight : 40;
  top.style.top = (h + 10) + 'px';
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
  // ?pad=1 / ?pad=0 으로 강제할 수 있다(기기 감지가 틀렸을 때 링크 하나로 해결된다)
  var padQ = new URLSearchParams(location.search).get('pad');
  setPad(padQ === null ? padOn() : padQ === '1');
  if ($('padBtn')) $('padBtn').onclick = function () { setPad(!document.body.classList.contains('pad')); };
  if ($('padToggle')) $('padToggle').onclick = function () {
    setPad(!document.body.classList.contains('pad'));
  };

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
    askZone(z, false);
  };
  window.addEventListener('resize', layout);
}


/* ---------- 태블릿 모드(화면 조작 버튼) ----------
   ⚠️'ontouchstart 가 있으면 터치 기기' 라는 감지는 자주 틀린다 — 터치 되는 노트북에서는
     쓸데없이 뜨고, 일부 태블릿 브라우저에서는 안 뜬다. 안 뜨면 아이는 조작할 방법이 없다.
     그래서 **감지는 첫 기본값을 정하는 데만 쓰고, 최종 결정은 사람이 버튼으로 한다.**
     선택은 저장해 두어 다음에 열 때 그대로 나온다. */
var PAD_KEY = SAVE_KEY + '_pad';

function padGuess() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
}
function padOn() {
  var v = null;
  try { v = localStorage.getItem(PAD_KEY); } catch (e) {}
  return v === null ? padGuess() : v === '1';
}
function setPad(on) {
  document.body.classList.toggle('pad', !!on);
  try { localStorage.setItem(PAD_KEY, on ? '1' : '0'); } catch (e) {}
  var b = $('padBtn'), t = $('padToggle');
  if (b) { b.classList.toggle('on', !!on); b.title = on ? '태블릿 모드 켜짐' : '태블릿 모드 꺼짐'; }
  if (t) {
    t.classList.toggle('on', !!on);
    t.textContent = on ? '📱 태블릿 모드 켜짐' : '📱 태블릿 모드';
  }
  if (!on) { touch.l = touch.r = touch.j = 0; }   // 끌 때 눌린 채로 남지 않게
  if (cv) layout();                              // 세계를 올리고/내리려면 다시 재야 한다
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
  fetch(SUBJECT + '.json?v=1').then(function (r) { return r.json(); }).then(function (d) {
    BANK = d;
    bindInput();
    paintStagePick();
    requestAnimationFrame(frame);
    var q = new URLSearchParams(location.search);
    if (q.get('test') === 'sim') {
      // 검증·디버깅용 훅. 클로저 안의 상태를 밖에서 들여다볼 수 있어야 원인을 좁힌다.
      window.__q = {
        G: G, keys: keys, update: update, startStage: startStage, buildLevel: buildLevel,
        get P() { return P; }, get LV() { return LV; },
        C: { BRICK_BOTTOM: BRICK_BOTTOM, JUMP_V: JUMP_V, GY: GY, PH: PH, PW: PW, TILE: TILE,
             WORD_W: WORD_W, MOB_H: MOB_H, STEP: STEP, LIVES: LIVES }
      };
      selfTest();
    }
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

  /* 1. 문제 은행 — 문제와 정답이 어긋나면 그건 버그가 아니라 사고다 */
  ck(BANK.stages.length === 8, '동산이 8개가 아님: ' + BANK.stages.length);
  var ids = {}, need = Object.keys(BANK.lines);
  BANK.stages.forEach(function (st) {
    ck(st.problems.length >= QUIZ_PER_STAGE,
       st.title + ': 문제가 ' + st.problems.length + '개뿐 (한 판에 ' + QUIZ_PER_STAGE + '개 필요)');
    st.problems.forEach(function (p) {
      ck(!ids[p.id], '중복 문제 id ' + p.id); ids[p.id] = 1;
      ck(!!p.q && p.q.length > 3, p.id + ': 문제 문장이 비었음');
      ck(p.c.indexOf(p.a) >= 0, p.id + ': 정답이 보기에 없음');
      ck(p.c.length >= 3, p.id + ': 보기 부족');
      ck(new Set(p.c).size === p.c.length, p.id + ': 보기 중복 ' + p.c.join(','));
      p.c.forEach(function (w) {
        ck(typeof w === 'string' && w.length > 0 && w.length <= 9,
           p.id + ': 보기 길이 이상 "' + w + '"');
      });
      // ★음성 호환: 어떤 문제가 뽑혀도 그 문제의 음성이 있어야 한다.
      //   (없어도 게임은 브라우저 음성으로 읽어 주지만, 그건 폴백이지 정상이 아니다)
      ck(need.indexOf('q_' + p.id) >= 0, p.id + ': 문제 음성(q_) 없음');
      ck(need.indexOf('o_' + p.id) >= 0, p.id + ': 정답 해설 음성(o_) 없음');
    });
    for (var v = 0; v < (BANK.variants || 2); v++) {
      ['intro_' + st.key + '_brick_' + v, 'intro_' + st.key + '_mob_' + v,
       'x_' + st.key + '_' + v].forEach(function (n) {
        ck(need.indexOf(n) >= 0, '대본에 없는 음성: ' + n);
      });
    }
  });
  [WELCOME, 'c_stage', 'c_clear', 'c_hurt', 'c_over', 'c_win'].forEach(function (n) {
    ck(need.indexOf(n) >= 0, '대본에 없는 공통 음성: ' + n);
  });
  ck(Object.keys(ids).length >= 40, '문제 총수가 너무 적음: ' + Object.keys(ids).length);

  /* 1-b. 한 판에 뽑히는 문제가 실제로 바뀌는가 (같은 판만 계속 나오면 안 된다) */
  var seenSets = {};
  for (var t1 = 0; t1 < 60; t1++) {
    LV = buildLevel(1);
    seenSets[LV.zones.map(function (z) { return z.p.id; }).sort().join(',')] = 1;
    var dup = {}, dupFound = false;
    LV.zones.forEach(function (z) { if (dup[z.p.id]) dupFound = true; dup[z.p.id] = 1; });
    ck(!dupFound, '한 판에 같은 문제가 두 번 나왔다');
  }
  ck(Object.keys(seenSets).length >= 10,
     '60번 만들었는데 문제 조합이 ' + Object.keys(seenSets).length + '가지뿐');

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
    // 시작 지점이 첫 구역의 오브젝트와 겹치면 출발하자마자 몬스터에 닿는다
    var f0 = LV.zones[0].items[0];
    ck(f0.x > 3 * TILE + PW + 60,
       s + '스테이지: 시작 지점과 첫 보기가 너무 가깝다 (x=' + Math.round(f0.x) + ')');
    // 한 판에 두 방식이 모두 나오는가 (벽돌만/몬스터만 나오는 판이 없어야 한다)
    var modes = LV.zones.map(function (z) { return z.mode; });
    ck(modes.indexOf('brick') >= 0 && modes.indexOf('mob') >= 0,
       s + '스테이지에 한 방식만 나옴: ' + modes.join(','));
  }

  /* 3. 점프 한 번으로 벽돌에 머리가 닿는가 (물리 실측) */
  Voice.muted = true; sfxOn = false;
  G.mode = 'play'; startStage(1);
  // ⚠️점프 높이는 순수 물리 측정이다. 벽돌·몬스터가 남아 있으면 밟기·머리치기로 값이 오염된다.
  LV.zones.forEach(function (z) { z.items = []; });
  G.lives = LIVES;
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
  G.lives = LIVES;
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
  G.lives = LIVES;
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
  G.lives = LIVES;
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

  /* 9. 낱말 보기가 벽돌 안에 들어가는가 — 잘리면 아이는 못 읽는다 */
  cx.font = '900 10px sans-serif';
  BANK.stages.forEach(function (st) {
    st.problems.forEach(function (p) {
      p.c.forEach(function (w) {
        ck(cx.measureText(w).width <= WORD_W - 12,
           p.id + ': 보기 "' + w + '" 는 가장 작은 글씨로도 벽돌에 안 들어감');
      });
    });
  });

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


  /* ===== 21. 태블릿 모드 — 폰·태블릿에서 손가락으로 조작할 수 있는가 =====
     ⚠️버튼이 보이는 것만으로는 부족하다. **눌렀을 때 실제로 움직여야** 한다.
        여기서는 진짜 이벤트를 쏘아 입력 경로 전체(리스너 → touch 상태 → 물리)를 확인한다. */
  var padKeep = null;
  try { padKeep = localStorage.getItem(PAD_KEY); } catch (e) {}

  setPad(true);
  ck(document.body.classList.contains('pad'), '태블릿 모드를 켰는데 body.pad 가 없다');
  var padEl = document.getElementById('touch');
  document.body.classList.add('playing');
  ck(padEl && getComputedStyle(padEl).display !== 'none', '태블릿 모드인데 조작 버튼이 안 보인다');
  ['tLeft', 'tRight', 'tJump'].forEach(function (id) {
    var el = document.getElementById(id);
    ck(!!el, '조작 버튼이 없다: ' + id);
    if (!el) return;
    var r = el.getBoundingClientRect();
    // 손가락으로 누를 크기인가 (접근성 권고 44px)
    ck(r.width >= 44 && r.height >= 44, id + ' 버튼이 너무 작다 ' + Math.round(r.width) + 'px');
    ck(r.right <= window.innerWidth + 1 && r.bottom <= window.innerHeight + 1 && r.left >= -1,
       id + ' 버튼이 화면 밖에 있다');
  });

  /* 실제로 눌러 본다 — 오른쪽 버튼을 누르면 오른쪽으로 가야 한다 */
  G.mode = 'play'; startStage(1); G.lives = 99;
  LV.zones.forEach(function (z) { z.items = []; });
  function press(id, type) {
    var el = document.getElementById(id);
    var ev;
    try {
      ev = new TouchEvent(type, { bubbles: true, cancelable: true });
    } catch (e) {                       // TouchEvent 를 못 만드는 환경(데스크톱 크롬)
      ev = new MouseEvent(type === 'touchstart' ? 'mousedown' : 'mouseup',
                          { bubbles: true, cancelable: true });
      (type === 'touchstart' ? el : window).dispatchEvent(ev);
      return;
    }
    el.dispatchEvent(ev);
  }
  var x0 = P.x;
  press('tRight', 'touchstart');
  for (var pf = 0; pf < 40; pf++) update(STEP);
  press('tRight', 'touchend');
  ck(P.x > x0 + 30, '오른쪽 버튼을 눌렀는데 안 움직였다 (' +
     Math.round(x0) + ' → ' + Math.round(P.x) + ')');
  for (var pf2 = 0; pf2 < 30; pf2++) update(STEP);
  ck(Math.abs(P.vx) < 1, '버튼에서 손을 뗐는데 계속 움직인다 (vx=' + Math.round(P.vx) + ')');

  var y0 = P.y;
  press('tJump', 'touchstart');
  var apexPad = P.y;
  for (var pf3 = 0; pf3 < 30; pf3++) { update(STEP); apexPad = Math.min(apexPad, P.y); }
  press('tJump', 'touchend');
  ck(apexPad < y0 - 60, '점프 버튼을 눌렀는데 안 뛴다 (' +
     Math.round(y0) + ' → ' + Math.round(apexPad) + ')');

  /* ⚠️태블릿 모드에서만 도는 코드(세계를 위로 올리고 아래를 땅으로 메우는 부분)는
     기본값이 '꺼짐'인 환경에서 한 번도 실행되지 않는다 — 실제로 그 길에서 한 번 터졌다.
     그래서 **켠 상태로 직접 한 프레임을 그려 본다.** */
  setPad(true); layout();
  ck(PAD_INSET >= 0 && isFinite(PAD_INSET), '태블릿 모드 여백 계산이 이상하다 (' + PAD_INSET + ')');
  var drawErr = '';
  try { render(); } catch (e) { drawErr = e.message; }
  ck(!drawErr, '태블릿 모드에서 그리기가 터진다: ' + drawErr);

  /* 버튼이 캐릭터가 걸어다니는 자리를 덮지 않는가 */
  var scaleY = window.innerHeight / VH;
  var groundScreenY = (GY + (VH - WORLD_H - PAD_INSET)) * scaleY;
  ['tLeft', 'tRight', 'tJump'].forEach(function (id) {
    var r = document.getElementById(id).getBoundingClientRect();
    ck(r.top >= groundScreenY - 2,
       id + ' 버튼이 지면(캐릭터가 걸어다니는 자리)을 덮는다 (버튼 위 ' +
       Math.round(r.top) + ' / 지면 ' + Math.round(groundScreenY) + ')');
  });

  /* 문제 배너가 HUD 를 덮지 않는가 (좁은 화면에서 칩이 두 줄이 되면 겹쳤다) */
  document.body.classList.add('quizon');
  paintHud(); placeTopUi();
  var hudR = document.getElementById('hud').getBoundingClientRect();
  var quizR = document.getElementById('quiz').getBoundingClientRect();
  ck(quizR.top >= hudR.bottom - 1,
     '문제 배너가 HUD 를 덮는다 (배너 위 ' + Math.round(quizR.top) +
     ' / HUD 아래 ' + Math.round(hudR.bottom) + ')');
  document.body.classList.remove('quizon');

  /* 껐을 때: 버튼이 사라지고, 눌려 있던 입력도 풀려야 한다 */
  press('tLeft', 'touchstart');
  setPad(false);
  ck(!document.body.classList.contains('pad'), '태블릿 모드를 껐는데 body.pad 가 남았다');
  ck(getComputedStyle(padEl).display === 'none', '껐는데 조작 버튼이 아직 보인다');
  var vxBefore = P.vx;
  for (var pf4 = 0; pf4 < 20; pf4++) update(STEP);
  ck(P.vx >= vxBefore - 1, '태블릿 모드를 껐는데 버튼이 눌린 채로 남아 계속 움직인다');

  /* 선택이 저장되는가 (다음에 열었을 때 그대로여야 한다) */
  setPad(true);
  ck(padOn() === true, '태블릿 모드 켬이 저장되지 않는다');
  setPad(false);
  ck(padOn() === false, '태블릿 모드 끔이 저장되지 않는다');
  try {
    if (padKeep === null) localStorage.removeItem(PAD_KEY);
    else localStorage.setItem(PAD_KEY, padKeep);
  } catch (e) {}
  setPad(padOn());
  document.body.classList.remove('playing');

  /* 음성 파일 존재 확인은 비동기 — 끝나면 결과를 갱신한다 */
  report(fails, need.length, true, Object.keys(ids).length);
  var missing = [];
  var done = 0;
  need.forEach(function (n) {
    fetch(VOICE_BASE + n + '.mp3', { method: 'HEAD' }).then(function (r) {
      if (!r.ok) missing.push(n);
    }).catch(function () { missing.push(n); }).then(function () {
      if (++done === need.length) {
        if (missing.length) fails.push('음성 파일 없음 ' + missing.length + '개: ' + missing.slice(0, 5).join(', '));
        report(fails, need.length, false, Object.keys(ids).length);
      }
    });
  });
}

function report(fails, clips, partial, nprob) {
  var out = document.getElementById('sim-test') || document.createElement('pre');
  out.id = 'sim-test';
  out.style.cssText = 'position:fixed;inset:0;z-index:999;background:#101c30;color:#dfe;' +
    'padding:22px;white-space:pre-wrap;font:13px/1.65 ui-monospace,monospace;overflow:auto';
  out.textContent = fails.length
    ? 'SIM FAIL (' + fails.length + ')\n' + fails.join('\n')
    : 'SIM PASS — 동산 8 · 문제 ' + nprob + ' · 음성 클립 ' + clips +
      ' · 판정/물리/진행 검사 통과' +
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
