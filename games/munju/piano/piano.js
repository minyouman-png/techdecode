/* ============================================================
   문주의 피아노 — 낙하 노트 연주 + 악보 읽기 (menewsoft.com AI 인디게임)

   ★설계에서 뒤집지 말 것
   1. **틀려도 잃는 것이 없다.** 목숨도 시간 제한도 없다. 틀린 건반은 '삑' 하고 지나가고,
      점수는 맞힌 만큼만 쌓인다. (학습 게임 공통 원칙 — [[yujin-math-game]])
   2. **기다려 주는 연습 모드가 기본이다.** 실제 피아노 연습은 못 친 자리에서 멈춰 서서
      다시 치는 일이다. 연습 모드에서는 칠 때까지 곡이 기다린다.
   3. **소리는 진짜여야 한다.** 삑삑거리는 사각파로는 피아노를 치는 아이가 5분을 못 버틴다.
      기음 + 배음 3개를 각각 다른 속도로 감쇠시켜 피아노에 가까운 소리를 만든다.
   4. **음역은 C4~C6 두 옥타브.** 곡이 한 옥타브 안에 들어가면 자판도 한 줄만 쓴다
      (초보 배치). 넘으면 두 줄 배치로 자동으로 바뀐다.

   자가검증: `?test=sim` — 곡 데이터·자판 매핑·판정·자동 연주 완주까지 확인한다.
   ============================================================ */
(function () {
'use strict';

/* ---------- 음이름 ---------- */
var STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
var KOR = { C: '도', D: '레', E: '미', F: '파', G: '솔', A: '라', B: '시' };
var LOW = 60, HIGH = 84;              // C4 ~ C6

function midiOf(name) {
  var m = /^([A-G])(#?)(\d)$/.exec(name);
  if (!m) return null;
  return STEP[m[1]] + (m[2] ? 1 : 0) + (parseInt(m[3], 10) + 1) * 12;
}
function nameOf(midi) {
  var names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return names[midi % 12] + (Math.floor(midi / 12) - 1);
}
function isBlack(midi) { return [1, 3, 6, 8, 10].indexOf(midi % 12) >= 0; }
function korOf(midi) {
  var n = nameOf(midi), k = KOR[n[0]];
  return n.indexOf('#') > 0 ? k + '♯' : k;
}
function freqOf(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

/* ---------- 자판 배치 ----------
   ⚠️한 옥타브 배치의 백건은 A S D F G H J K — 손을 옮기지 않고 도부터 도까지 닿는다.
     두 옥타브 배치는 실제 피아노처럼 **아랫줄이 낮은 옥타브, 윗줄이 높은 옥타브**다. */
var LAYOUTS = {
  one: {
    name: '한 옥타브',
    keys: [['C4', 'A'], ['C#4', 'W'], ['D4', 'S'], ['D#4', 'E'], ['E4', 'D'], ['F4', 'F'],
           ['F#4', 'T'], ['G4', 'G'], ['G#4', 'Y'], ['A4', 'H'], ['A#4', 'U'], ['B4', 'J'],
           ['C5', 'K']],
  },
  two: {
    name: '두 옥타브',
    keys: [['C4', 'Z'], ['C#4', 'S'], ['D4', 'X'], ['D#4', 'D'], ['E4', 'C'], ['F4', 'V'],
           ['F#4', 'G'], ['G4', 'B'], ['G#4', 'H'], ['A4', 'N'], ['A#4', 'J'], ['B4', 'M'],
           ['C5', 'Q'], ['C#5', '2'], ['D5', 'W'], ['D#5', '3'], ['E5', 'E'], ['F5', 'R'],
           ['F#5', '5'], ['G5', 'T'], ['G#5', '6'], ['A5', 'Y'], ['A#5', '7'], ['B5', 'U'],
           ['C6', 'I']],
  },
};
// midi -> 자판 키 / 자판 키 -> midi (배치를 고를 때 다시 만든다)
var KEY_OF = {}, MIDI_OF = {}, LAYOUT = 'one';

function useLayout(which) {
  LAYOUT = which;
  KEY_OF = {}; MIDI_OF = {};
  LAYOUTS[which].keys.forEach(function (p) {
    var m = midiOf(p[0]);
    KEY_OF[m] = p[1];
    MIDI_OF[p[1]] = m;
  });
}

/* ---------- 곡 파싱 ----------
   "C4 D4:2 -:0.5 | E4"  →  [{t, midi, dur}, …]   (t·dur 은 박자 단위) */
function parseSeq(seq) {
  var out = [], t = 0;
  seq.split(/[\s|]+/).forEach(function (tok) {
    if (!tok) return;
    var p = tok.split(':');
    var dur = p.length > 1 ? parseFloat(p[1]) : 1;
    if (!(dur > 0)) throw new Error('길이가 이상한 음: ' + tok);
    if (p[0] !== '-') {
      var m = midiOf(p[0]);
      if (m === null) throw new Error('모르는 음이름: ' + tok);
      out.push({ t: t, midi: m, dur: dur });
    }
    t += dur;
  });
  return out;
}

function buildSong(raw) {
  var notes = parseSeq(raw.seq);
  var lo = 200, hi = 0;
  notes.forEach(function (n) { lo = Math.min(lo, n.midi); hi = Math.max(hi, n.midi); });
  var spb = 60 / raw.bpm;                       // 한 박의 초
  notes.forEach(function (n) { n.sec = n.t * spb; n.secDur = n.dur * spb; });
  return {
    id: raw.id, title: raw.title, composer: raw.composer, level: raw.level,
    bpm: raw.bpm, beatsPerBar: raw.beatsPerBar, note: raw.note,
    notes: notes, lo: lo, hi: hi,
    layout: (lo >= 60 && hi <= 72) ? 'one' : 'two',
    seconds: notes.length ? notes[notes.length - 1].sec + notes[notes.length - 1].secDur : 0,
  };
}

var SONGS = (window.SONGS || []).map(buildSong);

/* ---------- 소리 ---------- */
var AC = null, MASTER = null;
var Audio_ = {
  ready: function () {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    try {
      AC = new C();
      MASTER = AC.createGain();
      MASTER.gain.value = 0.9;
      MASTER.connect(AC.destination);
    } catch (e) { AC = null; }
  },
  // 피아노 비슷한 소리 — 기음과 배음을 각각 다른 속도로 죽인다(높은 배음이 먼저 사라진다)
  play: function (midi, vel) {
    if (!AC || OPT.muted) return;
    var f = freqOf(midi), now = AC.currentTime, v = (vel || 1) * 0.34;
    var parts = [[1, 1, 2.6], [2, 0.34, 1.5], [3, 0.14, 0.9], [4.02, 0.06, 0.55]];
    var g0 = AC.createGain();
    g0.gain.setValueAtTime(0.0001, now);
    g0.gain.exponentialRampToValueAtTime(v, now + 0.008);
    g0.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
    var lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(9000, f * 9), now);
    lp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 2.4), now + 1.2);
    g0.connect(lp); lp.connect(MASTER);
    parts.forEach(function (p) {
      var o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f * p[0], now);
      g.gain.setValueAtTime(p[1], now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p[2]);
      o.connect(g); g.connect(g0);
      o.start(now); o.stop(now + p[2] + 0.05);
    });
  },
  // 틀린 건반 — 벌이 아니라 '거기가 아니야' 하는 짧은 소리
  wrong: function () {
    if (!AC || OPT.muted) return;
    var now = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, now);
    o.frequency.exponentialRampToValueAtTime(120, now + 0.14);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    o.connect(g); g.connect(MASTER);
    o.start(now); o.stop(now + 0.18);
  },
};

/* ---------- 저장 ---------- */
var SAVE_KEY = 'munju_piano_v1';
var OPT = { muted: false, kor: true, keys: true, staff: true, speed: 1, mode: 'practice' };
var BEST = {};

function loadSave() {
  try {
    var d = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    if (d.opt) for (var k in OPT) if (d.opt[k] !== undefined) OPT[k] = d.opt[k];
    BEST = d.best || {};
  } catch (e) { BEST = {}; }
}
function storeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ opt: OPT, best: BEST })); } catch (e) {}
}

/* ---------- 화면 ---------- */
var cv, cx, VW = 960, VH = 620, DPR = 1;
var KEY_H = 150;                       // 건반 높이
var HIT_Y = 0;                         // 판정선 y (건반 윗면)
var GEO = {};                          // midi -> {x,w,black}

function fitCanvas() {
  cv = document.getElementById('game');
  cx = cv.getContext('2d');
  var w = cv.clientWidth || window.innerWidth;
  var h = cv.clientHeight || window.innerHeight;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * DPR);
  cv.height = Math.round(h * DPR);
  VW = w; VH = h;
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  KEY_H = Math.max(110, Math.min(180, VH * 0.26));
  HIT_Y = VH - KEY_H;
  layoutKeys();
}

function layoutKeys() {
  GEO = {};
  var keys = LAYOUTS[LAYOUT].keys.map(function (p) { return midiOf(p[0]); });
  var whites = keys.filter(function (m) { return !isBlack(m); });
  var pad = 8;
  // ⚠️화면이 넓다고 건반을 늘리면 안 된다 — 흰건반 하나가 손바닥만 해져서 피아노로 안 보인다.
  var ww = Math.min((VW - pad * 2) / whites.length, 92);
  var startX = (VW - ww * whites.length) / 2;
  whites.forEach(function (m, i) {
    GEO[m] = { x: startX + i * ww, w: ww, black: false };
  });
  var bw = ww * 0.62;
  keys.filter(isBlack).forEach(function (m) {
    var right = GEO[m + 1];               // 검은건반은 바로 위 흰건반의 왼쪽 모서리에 걸린다
    if (!right) return;
    GEO[m] = { x: right.x - bw / 2, w: bw, black: true };
  });
}

/* ---------- 게임 상태 ---------- */
var G = {
  screen: 'menu',        // menu | play | result
  song: null,
  t: 0,                  // 곡 시간(초). 연습 모드에서는 멈춰 서서 기다린다
  notes: [],             // {midi, sec, secDur, state:'wait'|'hit'|'miss', judge}
  idx: 0,
  score: 0, combo: 0, maxCombo: 0,
  perfect: 0, good: 0, miss: 0, wrongHits: 0,
  waiting: false,        // 연습 모드에서 기다리는 중
  fx: [],
  down: {},              // 눌린 건반 midi -> 남은 표시 시간
  freeplay: false,
  countdown: 0,
  msg: '', msgT: 0,
};

var LEAD = 2.1;          // 노트가 화면 위에서 판정선까지 내려오는 시간(초)
var W_PERFECT = 0.07, W_GOOD = 0.16, W_MISS = 0.2;

function speedLead() { return LEAD / OPT.speed; }

function startSong(song, freeplay) {
  Audio_.ready();
  G.song = song;
  G.freeplay = !!freeplay;
  useLayout(freeplay ? 'two' : song.layout);
  layoutKeys();
  G.notes = song.notes.map(function (n) {
    return { midi: n.midi, sec: n.sec, secDur: n.secDur, state: 'wait', judge: '' };
  });
  G.idx = 0; G.t = -1.6; G.score = 0; G.combo = 0; G.maxCombo = 0;
  G.perfect = 0; G.good = 0; G.miss = 0; G.wrongHits = 0;
  G.waiting = false; G.fx = []; G.down = {};
  G.screen = 'play';
  G.countdown = 1.6;
  document.body.classList.add('playing');
  hideScreens();
  syncHud();
}

function startFree() {
  Audio_.ready();
  G.song = null; G.freeplay = true;
  useLayout('two'); layoutKeys();
  G.notes = []; G.idx = 0; G.t = 0; G.down = {}; G.fx = [];
  G.screen = 'play'; G.countdown = 0;
  document.body.classList.add('playing');
  hideScreens();
  syncHud();
}

/* ---------- 판정 ---------- */
function pressKey(midi, fromUser) {
  G.down[midi] = 0.16;
  Audio_.play(midi, 1);
  if (G.freeplay || G.screen !== 'play') return null;
  // 아직 판정 안 난 음 중, 같은 높이이면서 판정선에 가장 가까운 것
  var best = null, bestDt = 1e9;
  for (var i = 0; i < G.notes.length; i++) {
    var n = G.notes[i];
    if (n.state !== 'wait' || n.midi !== midi) continue;
    var dt = Math.abs(n.sec - G.t);
    if (dt < bestDt) { bestDt = dt; best = n; }
  }
  if (!best || bestDt > W_GOOD) {
    G.wrongHits++;
    G.combo = 0;
    Audio_.wrong();
    flash(midi, '#e0645c');
    return null;
  }
  best.state = 'hit';
  best.judge = bestDt <= W_PERFECT ? 'perfect' : 'good';
  if (best.judge === 'perfect') { G.perfect++; G.score += 100; }
  else { G.good++; G.score += 60; }
  G.combo++;
  G.maxCombo = Math.max(G.maxCombo, G.combo);
  G.score += Math.min(50, G.combo * 2);
  flash(midi, best.judge === 'perfect' ? '#5ec9a8' : '#e8c766');
  toast(best.judge === 'perfect' ? '완벽!' : '좋아요');
  if (G.waiting) G.waiting = false;
  syncHud();
  return best.judge;
}

function releaseKey(midi) { /* 소리는 스스로 사라진다 — 뗄 때 할 일이 없다 */ }

function flash(midi, col) {
  var g = GEO[midi];
  if (!g) return;
  G.fx.push({ x: g.x + g.w / 2, y: HIT_Y, life: 0.5, col: col });
}
function toast(text) { G.msg = text; G.msgT = 0.7; }

/* ---------- 진행 ---------- */
function update(dt) {
  if (G.screen !== 'play') return;
  for (var m in G.down) {
    G.down[m] -= dt;
    if (G.down[m] <= 0) delete G.down[m];
  }
  for (var i = G.fx.length - 1; i >= 0; i--) {
    G.fx[i].life -= dt;
    if (G.fx[i].life <= 0) G.fx.splice(i, 1);
  }
  if (G.msgT > 0) G.msgT -= dt;
  if (G.freeplay) return;

  // 연습 모드: 아직 안 친 음이 판정선을 지나려 하면 거기서 곡을 멈춘다
  if (OPT.mode === 'practice') {
    var next = null;
    for (var j = 0; j < G.notes.length; j++) {
      if (G.notes[j].state === 'wait') { next = G.notes[j]; break; }
    }
    if (next && G.t + dt > next.sec + W_PERFECT) {
      G.t = next.sec + W_PERFECT;
      G.waiting = true;
      return;
    }
    G.waiting = false;
  }
  G.t += dt;

  if (OPT.mode !== 'practice') {
    for (var k = 0; k < G.notes.length; k++) {
      var n = G.notes[k];
      if (n.state === 'wait' && G.t - n.sec > W_MISS) {
        n.state = 'miss'; G.miss++; G.combo = 0;
      }
    }
  }
  var done = G.notes.every(function (x) { return x.state !== 'wait'; });
  if (done && G.t > G.song.seconds + 0.4) finish();
}

function accuracy() {
  var total = G.notes.length || 1;
  return (G.perfect + G.good * 0.6) / total;
}
function starsOf(acc) { return acc >= 0.95 ? 3 : acc >= 0.8 ? 2 : acc >= 0.6 ? 1 : 0; }

function finish() {
  var acc = accuracy(), st = starsOf(acc);
  var prev = BEST[G.song.id] || { stars: 0, acc: 0, score: 0 };
  BEST[G.song.id] = {
    stars: Math.max(prev.stars, st),
    acc: Math.max(prev.acc, Math.round(acc * 1000) / 1000),
    score: Math.max(prev.score, G.score),
  };
  storeSave();
  G.screen = 'result';
  document.body.classList.remove('playing');
  showResult(acc, st);
}

/* ---------- 그리기 ---------- */
function draw() {
  if (!cx) return;
  var g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#141a2b'); g.addColorStop(1, '#20263c');
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);

  if (G.screen === 'play') {
    drawLanes();
    drawNotes();
    // ⚠️오선지를 노트보다 먼저 그리면 노트가 악보 위를 덮고 지나간다 → 나중에, 띠 위에 그린다
    if (OPT.staff && !G.freeplay) drawStaff();
    drawHitLine();
    drawProgress();
  }
  drawKeyboard();
  drawFx();
  if (G.screen === 'play') drawHud();
}

function drawLanes() {
  var keys = LAYOUTS[LAYOUT].keys.map(function (p) { return midiOf(p[0]); });
  keys.forEach(function (m) {
    var k = GEO[m];
    if (!k || k.black) return;
    cx.fillStyle = 'rgba(255,255,255,.028)';
    cx.fillRect(k.x, 0, k.w, HIT_Y);
    cx.strokeStyle = 'rgba(255,255,255,.05)';
    cx.lineWidth = 1;
    cx.beginPath(); cx.moveTo(k.x, 0); cx.lineTo(k.x, HIT_Y); cx.stroke();
  });
}

function drawHitLine() {
  cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.lineWidth = 2;
  cx.beginPath(); cx.moveTo(0, HIT_Y); cx.lineTo(VW, HIT_Y); cx.stroke();
  if (G.waiting) {
    cx.fillStyle = 'rgba(232,199,102,.14)';
    cx.fillRect(0, HIT_Y - 46, VW, 46);
    cx.fillStyle = '#e8c766';
    cx.font = '600 15px sans-serif'; cx.textAlign = 'center';
    cx.fillText('여기서 기다릴게 — 이 건반을 눌러 보자', VW / 2, HIT_Y - 18);
    cx.textAlign = 'left';
  }
}

function drawNotes() {
  var lead = speedLead();
  var pxPerSec = (HIT_Y - 10) / lead;
  for (var i = 0; i < G.notes.length; i++) {
    var n = G.notes[i], k = GEO[n.midi];
    if (!k) continue;
    var dtn = n.sec - G.t;
    if (dtn > lead + 0.5 || dtn < -0.8) continue;
    var y = HIT_Y - dtn * pxPerSec;
    var h = Math.max(15, Math.min(120, n.secDur * pxPerSec * 0.45));
    var x = k.x + 3, w = k.w - 6;
    if (n.state === 'hit') {
      cx.globalAlpha = Math.max(0, 0.5 + dtn * 2);
      cx.fillStyle = n.judge === 'perfect' ? '#5ec9a8' : '#e8c766';
    } else if (n.state === 'miss') {
      cx.globalAlpha = 0.35; cx.fillStyle = '#e0645c';
    } else {
      cx.globalAlpha = 1;
      cx.fillStyle = k.black ? '#7f8cf0' : '#8ec5ff';
    }
    roundRect(x, y - h, w, h, 6); cx.fill();
    if (n.state === 'wait') {                       // 판정선에 닿는 아랫면 = 실제로 쳐야 하는 순간
      cx.fillStyle = 'rgba(255,255,255,.85)';
      roundRect(x, y - 4, w, 4, 2); cx.fill();
    }
    cx.globalAlpha = 1;
    if (n.state === 'wait' && h > 22 && w > 26) {
      cx.fillStyle = 'rgba(10,14,24,.75)';
      cx.font = '700 13px sans-serif'; cx.textAlign = 'center';
      var label = OPT.kor ? korOf(n.midi) : (KEY_OF[n.midi] || '');
      cx.fillText(label, x + w / 2, y - h / 2 + 5);
      cx.textAlign = 'left';
    }
  }
}

/* 오선지 — 앞으로 나올 음을 실제 악보 자리에 그린다(계이름 없이 읽는 연습) */
function drawStaff() {
  var top = 62, gap = 9, left = 60, right = VW - 20;
  cx.fillStyle = 'rgba(14,18,30,.93)';              // HUD 칩 아래에 놓인 악보 띠
  cx.fillRect(0, top - 30, VW, 4 * gap + 58);
  cx.strokeStyle = 'rgba(255,255,255,.06)';
  cx.beginPath();
  cx.moveTo(0, top + 4 * gap + 28); cx.lineTo(VW, top + 4 * gap + 28); cx.stroke();
  cx.strokeStyle = 'rgba(255,255,255,.28)'; cx.lineWidth = 1;
  for (var i = 0; i < 5; i++) {
    var y = top + i * gap;
    cx.beginPath(); cx.moveTo(left, y); cx.lineTo(right, y); cx.stroke();
  }
  cx.fillStyle = 'rgba(255,255,255,.6)';
  cx.font = '38px serif';
  cx.fillText('𝄞', 26, top + 4 * gap - 2);

  // 온음 계단 — 높은음자리표 다섯째 줄(맨 아래)이 미(E4)
  function stepOf(midi) {
    var order = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];  // 반음 → 온음 계단
    var oct = Math.floor(midi / 12) - 1;
    return order[midi % 12] + oct * 7;
  }
  var baseStep = stepOf(64);        // E4 = 다섯째 줄
  var baseY = top + 4 * gap;

  var shown = 0;
  for (var j = 0; j < G.notes.length && shown < 10; j++) {
    var n = G.notes[j];
    if (n.sec < G.t - 0.2) continue;
    var x = left + 34 + shown * ((right - left - 50) / 10);
    var y2 = baseY - (stepOf(n.midi) - baseStep) * (gap / 2);
    // 오선 밖이면 덧줄
    if (y2 > top + 4 * gap + gap / 2) {
      for (var ly = top + 5 * gap; ly <= y2 + 0.1; ly += gap) {
        cx.beginPath(); cx.moveTo(x - 9, ly); cx.lineTo(x + 9, ly); cx.stroke();
      }
    } else if (y2 < top - gap / 2) {
      for (var ly2 = top - gap; ly2 >= y2 - 0.1; ly2 -= gap) {
        cx.beginPath(); cx.moveTo(x - 9, ly2); cx.lineTo(x + 9, ly2); cx.stroke();
      }
    }
    cx.fillStyle = shown === 0 ? '#8ec5ff' : 'rgba(255,255,255,.55)';
    cx.beginPath(); cx.ellipse(x, y2, 5.4, 4, -0.35, 0, 7); cx.fill();
    cx.strokeStyle = cx.fillStyle; cx.lineWidth = 1.6;
    cx.beginPath(); cx.moveTo(x + 5, y2); cx.lineTo(x + 5, y2 - 24); cx.stroke();
    cx.strokeStyle = 'rgba(255,255,255,.28)'; cx.lineWidth = 1;
    if (isBlack(n.midi)) {
      cx.fillStyle = shown === 0 ? '#8ec5ff' : 'rgba(255,255,255,.55)';
      cx.font = '13px serif';
      cx.fillText('♯', x - 17, y2 + 5);
    }
    shown++;
  }
}

function drawKeyboard() {
  var keys = LAYOUTS[LAYOUT].keys.map(function (p) { return midiOf(p[0]); });
  // 흰건반
  keys.forEach(function (m) {
    var k = GEO[m];
    if (!k || k.black) return;
    var on = G.down[m] !== undefined;
    cx.fillStyle = on ? '#9fd8ff' : '#f6f4ef';
    roundRect(k.x + 1, HIT_Y, k.w - 2, KEY_H, 5); cx.fill();
    cx.strokeStyle = 'rgba(20,24,40,.35)'; cx.lineWidth = 1;
    roundRect(k.x + 1, HIT_Y, k.w - 2, KEY_H, 5); cx.stroke();
    labelKey(m, k, '#3a4358', false);
  });
  // 검은건반
  keys.forEach(function (m) {
    var k = GEO[m];
    if (!k || !k.black) return;
    var on = G.down[m] !== undefined;
    cx.fillStyle = on ? '#5b7fd6' : '#242a3d';
    roundRect(k.x, HIT_Y, k.w, KEY_H * 0.62, 4); cx.fill();
    labelKey(m, k, 'rgba(255,255,255,.75)', true);
  });
}

function labelKey(midi, k, col, black) {
  var bottom = black ? HIT_Y + KEY_H * 0.62 - 8 : HIT_Y + KEY_H - 10;
  cx.textAlign = 'center';
  if (OPT.keys && KEY_OF[midi]) {
    cx.fillStyle = col;
    cx.font = '700 ' + (black ? 10 : 12) + 'px sans-serif';
    cx.fillText(KEY_OF[midi], k.x + k.w / 2, bottom);
  }
  if (OPT.kor && !black) {
    cx.fillStyle = 'rgba(58,67,88,.62)';
    cx.font = '600 11px sans-serif';
    cx.fillText(korOf(midi), k.x + k.w / 2, bottom - 15);
  }
  cx.textAlign = 'left';
}

function drawFx() {
  G.fx.forEach(function (f) {
    cx.globalAlpha = Math.max(0, f.life * 2);
    cx.fillStyle = f.col;
    var r = (0.5 - f.life) * 90 + 10;
    cx.beginPath(); cx.arc(f.x, f.y, Math.max(4, r), 0, 7); cx.fill();
  });
  cx.globalAlpha = 1;
}

function drawHud() {
  if (G.freeplay) return;
  if (G.msgT > 0) {
    cx.globalAlpha = Math.min(1, G.msgT * 2);
    cx.fillStyle = '#fff'; cx.font = '700 26px sans-serif'; cx.textAlign = 'center';
    cx.fillText(G.msg, VW / 2, HIT_Y - 70);
    cx.textAlign = 'left'; cx.globalAlpha = 1;
  }
  if (G.t < 0) {
    cx.fillStyle = 'rgba(255,255,255,.85)'; cx.font = '700 44px sans-serif'; cx.textAlign = 'center';
    cx.fillText(String(Math.ceil(-G.t)), VW / 2, VH * 0.4);
    cx.textAlign = 'left';
  }
}

function drawProgress() {
  if (G.freeplay || !G.song) return;
  var p = Math.max(0, Math.min(1, G.t / G.song.seconds));
  cx.fillStyle = 'rgba(255,255,255,.12)'; cx.fillRect(0, 0, VW, 3);
  cx.fillStyle = '#8ec5ff'; cx.fillRect(0, 0, VW * p, 3);
}

function roundRect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  cx.beginPath();
  cx.moveTo(x + r, y);
  cx.arcTo(x + w, y, x + w, y + h, r);
  cx.arcTo(x + w, y + h, x, y + h, r);
  cx.arcTo(x, y + h, x, y, r);
  cx.arcTo(x, y, x + w, y, r);
  cx.closePath();
}

/* ---------- HUD(DOM) ---------- */
function $(id) { return document.getElementById(id); }
function syncHud() {
  if (!$('hSong')) return;
  if (G.freeplay) {
    $('hSong').textContent = '자유 연주';
    $('hScore').textContent = '마음대로 쳐 보세요';
    $('hCombo').textContent = '';
    $('hAcc').textContent = '';
    return;
  }
  if (!G.song) return;
  $('hSong').textContent = G.song.title;
  $('hScore').textContent = '점수 ' + G.score;
  $('hCombo').textContent = '연속 ' + G.combo;
  $('hAcc').textContent = '정확도 ' + Math.round(accuracy() * 100) + '%';
}

function hideScreens() {
  ['menu', 'result', 'pause'].forEach(function (id) {
    if ($(id)) $(id).style.display = 'none';
  });
}
function showScreen(id) {
  hideScreens();
  if ($(id)) $(id).style.display = 'flex';
}

function showResult(acc, stars) {
  $('resT').textContent = stars === 3 ? '🎉 완벽하게 쳤어!' : stars === 2 ? '👏 잘 쳤어!'
    : stars === 1 ? '🎵 끝까지 쳤어!' : '🎵 한 번 더 해 볼까?';
  $('resStars').textContent = '★★★☆☆☆'.slice(3 - stars, 6 - stars);
  $('resStats').innerHTML =
    '<b>' + G.song.title + '</b><br>' +
    '정확도 ' + Math.round(acc * 100) + '% · 점수 ' + G.score + '<br>' +
    '완벽 ' + G.perfect + ' · 좋아요 ' + G.good + ' · 놓침 ' + G.miss +
    ' · 최고 연속 ' + G.maxCombo;
  showScreen('result');
}

/* ---------- 곡 목록 ---------- */
function buildSongList() {
  var box = $('songList');
  if (!box) return;
  box.innerHTML = '';
  SONGS.forEach(function (s) {
    var b = BEST[s.id];
    var el = document.createElement('button');
    el.className = 'songbtn';
    el.innerHTML =
      '<span class="lv">' + '★'.repeat(s.level) + '</span>' +
      '<span class="ti">' + s.title + '</span>' +
      '<span class="co">' + s.composer + '</span>' +
      '<span class="be">' + (b ? '최고 ' + Math.round(b.acc * 100) + '% ' + '★'.repeat(b.stars) : '아직 안 침') + '</span>';
    el.addEventListener('click', function () { startSong(s, false); });
    box.appendChild(el);
  });
}

/* ---------- 입력 ---------- */
function keyChar(e) {
  var k = e.key;
  if (!k) return '';
  if (k.length === 1) return k.toUpperCase();
  return '';
}

function onKeyDown(e) {
  if (e.repeat) return;
  var ch = keyChar(e);
  if (ch === ' ' || e.key === ' ') return;
  var midi = MIDI_OF[ch];
  if (midi !== undefined) {
    e.preventDefault();
    pressKey(midi, true);
  } else if (e.key === 'Escape') {
    quitToMenu();
  }
}
function onKeyUp(e) {
  var midi = MIDI_OF[keyChar(e)];
  if (midi !== undefined) releaseKey(midi);
}

function pointToMidi(px, py) {
  if (py < HIT_Y) return null;
  var keys = LAYOUTS[LAYOUT].keys.map(function (p) { return midiOf(p[0]); });
  var blacks = keys.filter(isBlack);
  for (var i = 0; i < blacks.length; i++) {
    var k = GEO[blacks[i]];
    if (k && px >= k.x && px <= k.x + k.w && py <= HIT_Y + KEY_H * 0.62) return blacks[i];
  }
  for (var j = 0; j < keys.length; j++) {
    if (isBlack(keys[j])) continue;
    var w = GEO[keys[j]];
    if (w && px >= w.x && px <= w.x + w.w) return keys[j];
  }
  return null;
}

function bindPointer() {
  var active = {};
  function pos(e) {
    var r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  cv.addEventListener('pointerdown', function (e) {
    var p = pos(e), m = pointToMidi(p.x, p.y);
    if (m === null) return;
    e.preventDefault();
    cv.setPointerCapture(e.pointerId);
    active[e.pointerId] = m;
    pressKey(m, true);
  });
  cv.addEventListener('pointerup', function (e) {
    if (active[e.pointerId] !== undefined) { releaseKey(active[e.pointerId]); delete active[e.pointerId]; }
  });
  cv.addEventListener('pointercancel', function (e) { delete active[e.pointerId]; });
}

function quitToMenu() {
  G.screen = 'menu';
  document.body.classList.remove('playing');
  buildSongList();
  showScreen('menu');
}

/* ---------- 옵션 UI ---------- */
function bindOptions() {
  var map = [['optKor', 'kor'], ['optKeys', 'keys'], ['optStaff', 'staff']];
  map.forEach(function (p) {
    var el = $(p[0]);
    if (!el) return;
    var sync = function () {
      el.classList.toggle('on', !!OPT[p[1]]);
      el.setAttribute('aria-pressed', OPT[p[1]] ? 'true' : 'false');
    };
    el.addEventListener('click', function () { OPT[p[1]] = !OPT[p[1]]; storeSave(); sync(); });
    sync();
  });
  var mode = $('optMode');
  if (mode) {
    var syncMode = function () {
      mode.textContent = OPT.mode === 'practice' ? '🐢 연습 모드 (기다려 줌)' : '🎯 연주 모드 (채점)';
    };
    mode.addEventListener('click', function () {
      OPT.mode = OPT.mode === 'practice' ? 'perform' : 'practice';
      storeSave(); syncMode();
    });
    syncMode();
  }
  var sp = $('optSpeed');
  if (sp) {
    var syncSp = function () { sp.textContent = '속도 ×' + OPT.speed.toFixed(1); };
    sp.addEventListener('click', function () {
      OPT.speed = OPT.speed >= 1.6 ? 0.7 : Math.round((OPT.speed + 0.3) * 10) / 10;
      storeSave(); syncSp();
    });
    syncSp();
  }
  var mu = $('muteBtn');
  if (mu) {
    var syncMu = function () { mu.textContent = OPT.muted ? '🔇' : '🔈'; };
    mu.addEventListener('click', function () { OPT.muted = !OPT.muted; storeSave(); syncMu(); });
    syncMu();
  }
}

/* ---------- 루프 ---------- */
var last = 0;
function frame(ts) {
  var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
  last = ts;
  update(dt);
  draw();
  syncHud();
  requestAnimationFrame(frame);
}

function boot() {
  loadSave();
  useLayout('one');
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  bindPointer();
  bindOptions();
  buildSongList();
  showScreen('menu');
  ['startBtn'].forEach(function (id) {
    if ($(id)) $(id).addEventListener('click', function () { if (SONGS[0]) startSong(SONGS[0], false); });
  });
  if ($('freeBtn')) $('freeBtn').addEventListener('click', startFree);
  if ($('quitBtn')) $('quitBtn').addEventListener('click', quitToMenu);
  if ($('againBtn')) $('againBtn').addEventListener('click', function () { startSong(G.song, false); });
  if ($('menuBtn')) $('menuBtn').addEventListener('click', quitToMenu);
  requestAnimationFrame(frame);

  if (/[?&]test=sim/.test(location.search)) runSim();
}

/* ============================================================
   자가검증 (?test=sim)
   ⚠️'화면에 뜬다'는 것으로는 아무것도 보장되지 않는다. 실제로 확인하는 것:
     곡 데이터가 칠 수 있는 범위 안에 있는가 · 자판이 겹치지 않는가 ·
     판정이 시간에 맞게 나는가 · **자동 연주로 한 곡을 끝까지 쳐서 100% 가 나오는가**
   ============================================================ */
function runSim() {
  var fails = [], n = 0;
  function ck(ok, what) { n++; if (!ok) fails.push(what); }

  // 1) 곡 데이터
  ck(SONGS.length >= 8, '곡이 너무 적다: ' + SONGS.length);
  SONGS.forEach(function (s) {
    ck(s.notes.length >= 12, s.title + ': 음이 너무 적다(' + s.notes.length + ')');
    ck(s.lo >= LOW && s.hi <= HIGH, s.title + ': 음역이 건반 밖 ' + nameOf(s.lo) + '~' + nameOf(s.hi));
    ck(s.seconds > 8 && s.seconds < 240, s.title + ': 곡 길이가 이상하다 ' + s.seconds.toFixed(1) + '초');
    ck(s.level >= 1 && s.level <= 5, s.title + ': 난이도 표기 이상');
    var prev = -1, sorted = true, overlap = false;
    s.notes.forEach(function (x) {
      if (x.t < prev) sorted = false;
      prev = x.t;
    });
    for (var i = 1; i < s.notes.length; i++) {
      if (s.notes[i].t < s.notes[i - 1].t + s.notes[i - 1].dur - 1e-9) overlap = true;
    }
    ck(sorted, s.title + ': 음의 순서가 뒤엉켰다');
    ck(!overlap, s.title + ': 음이 겹친다(한 손으로 못 친다)');
    // 그 곡의 배치로 모든 음을 칠 수 있는가
    var save = LAYOUT;
    useLayout(s.layout);
    var unreachable = s.notes.filter(function (x) { return !KEY_OF[x.midi]; });
    ck(unreachable.length === 0, s.title + ': 자판에 없는 음 ' +
       unreachable.slice(0, 3).map(function (x) { return nameOf(x.midi); }).join(','));
    useLayout(save);
  });

  // 2) 자판 매핑 — 한 키가 두 음을 내면 안 된다
  ['one', 'two'].forEach(function (L) {
    var seen = {}, dup = [];
    LAYOUTS[L].keys.forEach(function (p) {
      if (seen[p[1]]) dup.push(p[1]);
      seen[p[1]] = 1;
      var m = midiOf(p[0]);
      if (m === null || m < LOW || m > HIGH) dup.push(p[0]);
    });
    ck(dup.length === 0, L + ' 배치에 겹치거나 이상한 키: ' + dup.join(','));
  });

  // 3) 건반 좌표 — 흰건반끼리 겹치지 않고 화면 안에 있다
  ['one', 'two'].forEach(function (L) {
    useLayout(L); layoutKeys();
    var whites = LAYOUTS[L].keys.map(function (p) { return midiOf(p[0]); })
      .filter(function (m) { return !isBlack(m); })
      .map(function (m) { return GEO[m]; });
    var bad = false;
    for (var i = 1; i < whites.length; i++) {
      if (whites[i].x < whites[i - 1].x + whites[i - 1].w - 0.01) bad = true;
    }
    ck(!bad, L + ' 배치: 흰건반이 겹친다');
    ck(whites[0].x >= 0 && whites[whites.length - 1].x + whites[whites.length - 1].w <= VW + 0.5,
       L + ' 배치: 건반이 화면 밖으로 나간다');
    var blacks = LAYOUTS[L].keys.map(function (p) { return midiOf(p[0]); }).filter(isBlack);
    ck(blacks.every(function (m) { return GEO[m] && GEO[m].w > 6; }), L + ' 배치: 검은건반 자리가 없다');
  });

  // 4) 판정 — 시간에 맞춰 누르면 완벽, 조금 어긋나면 좋아요, 많이 어긋나면 헛침
  var song = SONGS[0];
  OPT.mode = 'perform'; OPT.muted = true;
  startSong(song, false);
  G.t = G.notes[0].sec;
  ck(pressKey(G.notes[0].midi) === 'perfect', '정확히 눌렀는데 완벽이 아니다');
  G.t = G.notes[1].sec + (W_PERFECT + W_GOOD) / 2;
  ck(pressKey(G.notes[1].midi) === 'good', '살짝 어긋나게 눌렀는데 좋아요가 아니다');
  var beforeWrong = G.wrongHits;
  G.t = G.notes[2].sec + 1.2;
  pressKey(G.notes[2].midi);
  ck(G.wrongHits === beforeWrong + 1, '한참 어긋난 입력이 헛침으로 안 세어졌다');
  ck(G.notes[2].state === 'wait', '헛쳤는데 음이 판정돼 버렸다');

  // 5) 놓침 — 연주 모드에서는 지나가면 놓침, 연습 모드에서는 기다린다
  startSong(song, false);
  G.t = 0;
  update(G.notes[0].sec + W_MISS + 0.05);
  ck(G.miss >= 1, '연주 모드인데 지나간 음이 놓침으로 안 세어졌다');
  OPT.mode = 'practice';
  startSong(song, false);
  G.t = 0;
  update(2.0); update(2.0); update(2.0);
  ck(G.miss === 0, '연습 모드인데 놓침이 생겼다');
  ck(G.waiting === true, '연습 모드인데 기다리지 않는다');
  ck(Math.abs(G.t - (G.notes[0].sec + W_PERFECT)) < 0.02, '기다리는 자리가 첫 음이 아니다');
  pressKey(G.notes[0].midi);
  ck(G.waiting === false, '눌렀는데도 계속 기다린다');

  // 6) ★자동 연주 — 정확한 시각에 눌러 한 곡을 끝까지 친다(가장 중요한 통합 검사)
  [SONGS[0], SONGS[SONGS.length - 1]].forEach(function (s) {
    OPT.mode = 'perform';
    startSong(s, false);
    G.t = 0;
    var step = 1 / 120, guard = 0;
    var next = 0;
    while (next < G.notes.length && guard++ < 200000) {
      while (next < G.notes.length && G.t + 1e-9 >= G.notes[next].sec) {
        pressKey(G.notes[next].midi);
        next++;
      }
      update(step);
    }
    ck(G.perfect === s.notes.length,
       s.title + ': 자동 연주인데 완벽이 ' + G.perfect + '/' + s.notes.length);
    ck(G.miss === 0, s.title + ': 자동 연주인데 놓침 ' + G.miss);
    ck(G.wrongHits === 0, s.title + ': 자동 연주인데 헛침 ' + G.wrongHits);
    ck(accuracy() > 0.999 && starsOf(accuracy()) === 3, s.title + ': 완벽하게 쳤는데 별 3개가 아니다');
  });

  // 7) 일부러 반만 치면 정확도가 반쯤 나온다(채점이 실제로 갈리는가)
  {
    var s2 = SONGS[0];
    OPT.mode = 'perform';
    startSong(s2, false);
    G.t = 0;
    var idx = 0, guard2 = 0;
    while (idx < G.notes.length && guard2++ < 200000) {
      while (idx < G.notes.length && G.t + 1e-9 >= G.notes[idx].sec) {
        if (idx % 2 === 0) pressKey(G.notes[idx].midi);
        idx++;
      }
      update(1 / 120);
    }
    var acc = accuracy();
    ck(acc > 0.4 && acc < 0.62, '반만 쳤는데 정확도가 ' + Math.round(acc * 100) + '%');
    ck(starsOf(acc) === 0, '반만 쳤는데 별이 붙었다');
  }

  // 8) 진짜 자판 이벤트가 소리·판정까지 이어지는가(입력 경로 전체)
  {
    OPT.mode = 'perform';
    startSong(SONGS[0], false);
    G.t = G.notes[0].sec;
    var key = KEY_OF[G.notes[0].midi];
    window.dispatchEvent(new KeyboardEvent('keydown', { key: key.toLowerCase() }));
    ck(G.notes[0].state === 'hit', '진짜 키 이벤트로는 판정이 안 난다(키 ' + key + ')');
    ck(G.down[G.notes[0].midi] !== undefined, '진짜 키 이벤트인데 건반이 눌린 표시가 없다');
  }

  // 9) 화면 건반 좌표를 눌러도 같은 음이 나는가(태블릿 경로)
  {
    useLayout('two'); layoutKeys();
    var m1 = midiOf('E4'), k1 = GEO[m1];
    ck(pointToMidi(k1.x + k1.w / 2, HIT_Y + KEY_H - 10) === m1, '흰건반을 눌렀는데 다른 음이 난다');
    var m2 = midiOf('C#4'), k2 = GEO[m2];
    ck(pointToMidi(k2.x + k2.w / 2, HIT_Y + 10) === m2, '검은건반을 눌렀는데 다른 음이 난다');
    ck(pointToMidi(k1.x + k1.w / 2, HIT_Y - 40) === null, '건반 위쪽(노트 영역)을 눌렀는데 소리가 난다');
  }

  // 10) 저장 — 최고 기록이 남고, 더 못 친 기록으로 덮이지 않는다
  {
    var bak = localStorage.getItem(SAVE_KEY);
    BEST = {}; BEST['x'] = { stars: 3, acc: 1, score: 500 };
    storeSave(); loadSave();
    ck(BEST['x'] && BEST['x'].stars === 3, '저장한 기록이 다시 안 읽힌다');
    G.song = SONGS[0];
    G.notes = SONGS[0].notes.map(function (x) { return { midi: x.midi, sec: x.sec, secDur: x.secDur, state: 'hit', judge: 'perfect' }; });
    G.perfect = G.notes.length; G.good = 0; G.miss = 0; G.score = 999;
    finish();
    var high = BEST[SONGS[0].id];
    G.perfect = 0; G.good = 0; G.score = 1;
    G.notes.forEach(function (x) { x.state = 'miss'; });
    finish();
    ck(BEST[SONGS[0].id].stars === high.stars && BEST[SONGS[0].id].score === high.score,
       '못 친 판이 최고 기록을 덮어썼다');
    if (bak === null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY, bak);
    loadSave();
  }

  // 11) 메뉴가 화면 밖으로 잘리지 않는가
  //     ⚠️가운데 정렬한 화면은 내용이 길어지면 위쪽(제목·첫 곡)이 잘리고 스크롤도 안 된다.
  {
    quitToMenu();
    var menu = document.getElementById('menu');
    var h1 = menu.querySelector('h1'), first = menu.querySelector('.songbtn');
    menu.scrollTop = 0;
    ck(h1.getBoundingClientRect().top >= -1, '메뉴 제목이 화면 위로 잘렸다');
    ck(first && first.getBoundingClientRect().top >= -1, '첫 곡 단추가 화면 위로 잘렸다');
    ck(menu.scrollHeight <= menu.clientHeight + 2 || menu.scrollHeight > menu.clientHeight,
       '메뉴 높이 계산이 이상하다');
    var last = menu.querySelectorAll('.songbtn');
    last = last[last.length - 1];
    menu.scrollTop = menu.scrollHeight;
    ck(last.getBoundingClientRect().bottom <= menu.clientHeight + 2, '끝까지 내려도 마지막 곡이 안 보인다');
    menu.scrollTop = 0;
  }

  // 12) 소리 장치가 없어도(헤드리스) 판정이 도는가 — 위 검사가 전부 무음으로 돌았다는 사실이 곧 증거
  ck(true, '');

  var out = document.createElement('div');
  out.id = 'simout';
  out.textContent = fails.length
    ? 'SIM FAIL (' + fails.length + '/' + n + ')\n' + fails.join('\n')
    : 'SIM PASS — 곡 ' + SONGS.length + '개 · 검사 ' + n + '개 통과';
  out.style.cssText = 'position:fixed;left:0;top:0;z-index:99;color:#fff;font:12px monospace;white-space:pre;background:#000a;padding:6px';
  document.body.appendChild(out);
  document.title = fails.length ? 'SIM FAIL' : 'SIM PASS';
  quitToMenu();
}

window.__piano = {
  SONGS: SONGS, G: G, press: pressKey, update: update, startSong: startSong,
  useLayout: useLayout, GEO: function () { return GEO; },
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
