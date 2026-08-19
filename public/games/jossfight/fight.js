/* ============================================================
   조스 오브 파이터즈 — 대전 엔진 (menewsoft.com AI 인디게임)

   ★설계에서 뒤집지 말 것
   1. **60분의 1초 고정 걸음.** 그리기는 화면 주사율을 따라가도, 판정과 물리는 언제나
      1/60초씩 나아간다. 프레임이 흔들리면 격투게임은 그 순간 다른 게임이 된다.
   2. **판정 상자는 캐릭터가 아니라 기술이 갖는다.** 몸통 상자는 열 명이 같다(앉으면 낮아진다).
      캐릭터마다 몸 상자를 다르게 하면 균형을 잡을 수 없다.
   3. **막기는 뒤로 미는 것**이다. 버튼이 없다. 하단은 앉아서, 점프 공격은 서서 막는다.
      잡기는 못 막는다 — 대신 잡기는 헛치면 크게 굳는다.
   4. **CPU 는 커맨드를 입력하지 않는다.** 사람은 손으로 커맨드를 넣지만 CPU 는 기술을 직접
      고른다. 사람 흉내를 내느라 약해지는 것보다, 정직하게 강한 편이 상대할 맛이 난다.
   5. 캐릭터는 **투명하게** 그려진다. 배경 위에 네모난 판을 깔지 않는다.

   자가검증: `?test=sim`
   ============================================================ */
(function () {
'use strict';

var FA = window.FIGHTANIM, CHARS = window.CHARS, STAGES = window.STAGES;

/* ---------- 세계 ---------- */
var ARENA = 2200;          // 무대 가로 길이(월드 좌표)
var GY = 430;              // 바닥 높이(화면 좌표)
// ★확대 배율 — 옛 오락실 격투게임은 캐릭터가 **화면 높이의 3분의 1**쯤 된다.
//   뼈대는 116px 높이로 그려져 있으므로 여기서 한 번에 키운다.
//   ⚠️그림만 키우면 판정과 어긋난다 → 몸 상자·판정 상자·속도·중력에 **모두** 같은 배율을 건다.
var ZOOM = 1.8;
var GRAV = 0.85 * ZOOM;
var FPS = 60;
var ROUND_TIME = 60;
var WINS_NEEDED = 2;

var VW = 960, VH = 540, DPR = 1, cv, cx;

/* ---------- 소리 ---------- */
var AC = null;
var Snd = {
  on: true,
  ready: function () {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    var A = window.AudioContext || window.webkitAudioContext;
    if (A) { try { AC = new A(); } catch (e) { AC = null; } }
    if (AC) Mus.resume();                 // 첫 손짓 전에 걸어 둔 곡이 있으면 여기서 시작한다
  },
  blip: function (freq, dur, type, vol) {
    if (!AC || !Snd.on) return;
    var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.4), t + dur);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise: function (dur, vol, filt) {
    if (!AC || !Snd.on) return;
    var n = Math.floor(AC.sampleRate * dur);
    var buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = AC.createBufferSource(); s.buffer = buf;
    var f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filt || 900;
    var g = AC.createGain(); g.gain.value = vol || 0.18;
    s.connect(f); f.connect(g); g.connect(AC.destination);
    s.start();
  },
  hit: function (heavy) { Snd.noise(heavy ? 0.16 : 0.08, heavy ? 0.3 : 0.18, heavy ? 700 : 1400); Snd.blip(heavy ? 120 : 200, 0.08, 'sine', 0.18); },
  block: function () { Snd.blip(320, 0.05, 'square', 0.09); Snd.noise(0.05, 0.08, 2600); },
  whoosh: function () { Snd.noise(0.09, 0.05, 500); },
  fire: function () { Snd.blip(520, 0.22, 'sawtooth', 0.08); },
  ko: function () { Snd.blip(160, 0.6, 'sawtooth', 0.22); Snd.noise(0.5, 0.25, 500); },
};

/* ---------- 배경음악 ----------
   ★음악도 파일이 없다. 화음 진행과 한 마디짜리 가락만 적어 두고 그 자리에서 합성한다.
   ★박자는 **오디오 시계**로 맞춘다. setInterval 로 소리를 내면 대전 화면에 눌려 박자가
     흔들린다 → 타이머가 하는 일은 '앞으로 0.25초치 예약을 채우는' 것뿐이다.
   ★탭을 가리면 타이머가 느려져 예약이 밀린다. 시계가 이미 지나갔으면 밀린 칸은 버리고
     그 자리에서 다시 맞춘다(가렸다 돌아온 순간 한꺼번에 쏟아지는 사고를 막는다).
   ★모든 음은 out 하나로 모은다 — 끄기·잠깐 멈춤(작게 줄이기)이 한 줄로 끝난다.
   ★음악은 효과음보다 **작아야** 한다. 타격음이 묻히면 격투게임은 손맛을 잃는다.        */
var SCALES = {
  minor:   [0, 2, 3, 5, 7, 8, 10],
  harm:    [0, 2, 3, 5, 7, 8, 11],   // 화성단음계 — 6도와 7도 사이가 넓어 사막 냄새가 난다
  dorian:  [0, 2, 3, 5, 7, 9, 10],
  majpent: [0, 2, 4, 7, 9],
  minpent: [0, 3, 5, 7, 10],
};
/* 가락 한 마디(16분음표 16칸). d = 그 마디 화음 뿌리에서 음계 몇 칸 위, l = 길이, d:null 은 쉼표.
   ⚠️l 의 합은 16이어야 한다(모자라면 뒤가 비고, 넘치면 다음 마디를 먹는다) — ?test=sim 이 센다. */
var MOTIF = {
  call:   [{ d: 0, l: 2 }, { d: 2, l: 2 }, { d: 4, l: 2 }, { d: 2, l: 2 }, { d: 5, l: 4 }, { d: 4, l: 4 }],
  answer: [{ d: 4, l: 3 }, { d: 2, l: 1 }, { d: 0, l: 2 }, { d: 2, l: 2 }, { d: 4, l: 2 }, { d: 6, l: 2 }, { d: 5, l: 4 }],
  run:    [{ d: 0, l: 1 }, { d: 1, l: 1 }, { d: 2, l: 2 }, { d: 4, l: 1 }, { d: 2, l: 1 }, { d: 0, l: 2 }, { d: null, l: 2 }, { d: 2, l: 2 }, { d: 4, l: 4 }],
  calm:   [{ d: 2, l: 4 }, { d: 0, l: 4 }, { d: 4, l: 6 }, { d: null, l: 2 }],
  march:  [{ d: 0, l: 2 }, { d: 0, l: 2 }, { d: 4, l: 4 }, { d: 3, l: 2 }, { d: 2, l: 2 }, { d: 0, l: 4 }],
  swing:  [{ d: 4, l: 2 }, { d: 5, l: 2 }, { d: 4, l: 2 }, { d: 2, l: 2 }, { d: 0, l: 3 }, { d: 2, l: 1 }, { d: 4, l: 4 }],
  chase:  [{ d: 0, l: 2 }, { d: 4, l: 2 }, { d: 3, l: 2 }, { d: 4, l: 2 }, { d: 6, l: 2 }, { d: 4, l: 2 }, { d: 2, l: 4 }],
};
/* 무대마다 곡이 다르다. prog = 마디별 화음 뿌리(음계 칸), root = A 에서 몇 반음 위인가. */
var THEMES = {
  menu:    { bpm: 100, scale: 'minor',   root: 0, prog: [0, 5, 3, 4], motif: 'calm',  motif2: 'call',
             kick: '1000000010000000', snare: '0000000000000000', hat: '0010001000100010', bass: '1000100010001000', lead: 0.045 },
  sand:    { bpm: 124, scale: 'harm',    root: 2, prog: [0, 0, 3, 4], motif: 'call',  motif2: 'answer',
             kick: '1000001000100000', snare: '0000100000001000', hat: '0010101000101010', bass: '1001001010010010', lead: 0.052 },
  post:    { bpm: 138, scale: 'majpent', root: 5, prog: [0, 3, 4, 3], motif: 'march', motif2: 'swing',
             kick: '1000000010000100', snare: '0000100000001000', hat: '1010101010101010', bass: '1000100010001010', lead: 0.05 },
  corp:    { bpm: 132, scale: 'dorian',  root: 7, prog: [0, 4, 5, 4], motif: 'swing', motif2: 'answer',
             kick: '1000100000100000', snare: '0000100000001000', hat: '0010001010100010', bass: '1010001010100010', lead: 0.048 },
  beer:    { bpm: 148, scale: 'minpent', root: 3, prog: [0, 0, 3, 4], motif: 'run',   motif2: 'chase',
             kick: '1000001010000010', snare: '0000100000001000', hat: '1010101010101011', bass: '1010101010101010', lead: 0.05 },
  jokgu:   { bpm: 134, scale: 'majpent', root: 9, prog: [0, 2, 4, 2], motif: 'swing', motif2: 'march',
             kick: '1000000010001000', snare: '0000100000001000', hat: '0010101000101010', bass: '1000101010001000', lead: 0.05 },
  pangyo:  { bpm: 150, scale: 'dorian',  root: 4, prog: [0, 5, 3, 4], motif: 'chase', motif2: 'run',
             kick: '1000101000101000', snare: '0000100000001000', hat: '1111111111111111', bass: '1010101010101010', lead: 0.046 },
  halla:   { bpm: 128, scale: 'minor',   root: 10, prog: [0, 3, 5, 4], motif: 'call', motif2: 'chase',
             kick: '1000001000100000', snare: '0000100000001000', hat: '0010001000100010', bass: '1000100010100010', lead: 0.05 },
};

var Mus = (function () {
  var out = null, cur = null, curKey = '', pending = '';
  var timer = null, nextT = 0, idx = 0, stepDur = 0.12, lead = null, sc = null;
  var on = true, ducked = false;

  function freq(semi) { return 55 * Math.pow(2, semi / 12); }           // A1 = 55Hz
  /** 음계 위 d 칸을 반음으로. 음계를 넘어가면 옥타브를 올린다(7칸 = 한 옥타브 위 같은 음). */
  function degSemi(d) {
    var n = sc.length, o = Math.floor(d / n), i = ((d % n) + n) % n;
    return cur.root + sc[i] + 12 * o;
  }
  function tone(t, semi, dur, type, vol, cut) {
    var o1 = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter();
    o1.type = type; o1.frequency.setValueAtTime(freq(semi), t);
    f.type = 'lowpass'; f.frequency.setValueAtTime(cut || 2600, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.002, vol), t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.05, dur));
    o1.connect(f); f.connect(g); g.connect(out);
    o1.start(t); o1.stop(t + dur + 0.04);
  }
  function kick(t) {
    var o1 = AC.createOscillator(), g = AC.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(148, t);
    o1.frequency.exponentialRampToValueAtTime(46, t + 0.10);
    g.gain.setValueAtTime(0.34, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o1.connect(g); g.connect(out);
    o1.start(t); o1.stop(t + 0.2);
  }
  function noiseHit(t, dur, vol, hp) {
    var n = Math.max(1, Math.floor(AC.sampleRate * dur));
    var buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = AC.createBufferSource(); s.buffer = buf;
    var f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    var g = AC.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(out);
    s.start(t); s.stop(t + dur + 0.02);
  }
  /** 네 마디(=16분음표 64칸) 한 바퀴를 미리 깔아 둔다. 마지막 마디만 다른 가락으로 답한다. */
  function buildLead() {
    lead = [];
    for (var i = 0; i < 64; i++) lead.push(null);
    for (var b = 0; b < 4; b++) {
      var m = MOTIF[(b === 3 && cur.motif2) ? cur.motif2 : cur.motif], p = 0;
      for (var j = 0; j < m.length && p < 16; j++) {
        if (m[j].d !== null) lead[b * 16 + p] = { d: cur.prog[b] + m[j].d, l: m[j].l };
        p += m[j].l;
      }
    }
  }
  function playAt(t, s) {
    var b = Math.floor(s / 16) % 4, k = s % 16;
    if (cur.kick.charAt(k) === '1') kick(t);
    if (cur.snare.charAt(k) === '1') noiseHit(t, 0.13, 0.13, 1500);
    if (cur.hat.charAt(k) === '1') noiseHit(t, 0.03, 0.04, 7000);
    if (cur.bass.charAt(k) === '1') tone(t, degSemi(cur.prog[b]), stepDur * 1.8, 'sawtooth', 0.12, 380);
    if (k === 0) {                                   // 화음은 마디 첫 칸에 길게 깔아 둔다
      [0, 2, 4].forEach(function (o) {
        tone(t, degSemi(cur.prog[b] + o) + 24, stepDur * 15, 'triangle', 0.026, 1700);
      });
    }
    var L = lead[s];
    if (L) tone(t, degSemi(L.d) + 36, stepDur * L.l * 0.92, 'square', cur.lead || 0.05, 3200);
  }
  function tick() {
    if (!AC || !cur || !out) return;
    if (nextT < AC.currentTime) nextT = AC.currentTime + 0.04;   // 밀린 칸은 버리고 다시 맞춘다
    var horizon = AC.currentTime + 0.25, guard = 0;
    while (nextT < horizon && guard++ < 64) {
      try { playAt(nextT, idx); } catch (e) {}
      idx = (idx + 1) % 64;
      nextT += stepDur;
    }
  }
  function setVol() {
    if (!out || !AC) return;
    var v = on ? (ducked ? 0.22 : 1) * 0.5 : 0;
    out.gain.setTargetAtTime(v, AC.currentTime, 0.08);
  }
  function attach() {
    if (out || !AC) return;
    out = AC.createGain(); out.gain.value = 0; out.connect(AC.destination);
  }
  return {
    THEMES: THEMES, MOTIF: MOTIF,
    get on() { return on; },
    /** 곡을 건다. 소리 장치가 아직 없으면(첫 손짓 전) 적어만 두고 ready() 때 시작한다. */
    play: function (key) {
      if (!THEMES[key]) key = 'menu';
      pending = key;
      if (!AC) return;
      attach();
      if (curKey === key && timer) { setVol(); return; }
      curKey = key; cur = THEMES[key]; sc = SCALES[cur.scale];
      stepDur = 60 / cur.bpm / 4;
      buildLead();
      idx = 0; nextT = AC.currentTime + 0.06;
      if (!timer) timer = setInterval(tick, 45);
      setVol();
    },
    stop: function () {
      pending = ''; curKey = ''; cur = null;
      if (timer) { clearInterval(timer); timer = null; }
      if (out && AC) out.gain.setTargetAtTime(0, AC.currentTime, 0.05);
    },
    /** 잠깐 멈춤·화면 전환에서 음악만 작게 줄인다(끊지 않는다 — 끊으면 다시 붙을 때 튄다) */
    duck: function (v) { ducked = !!v; setVol(); },
    setOn: function (v) {
      on = !!v;
      if (on) { if (pending) this.play(pending); else setVol(); }
      else setVol();
    },
    /** 소리 장치가 생긴 뒤(첫 손짓) 적어 둔 곡을 시작한다 */
    resume: function () { if (pending) this.play(pending); },
    get key() { return curKey; },
  };
})();

/* ---------- 입력 ----------
   1P: 이동 A D · 앉기 S · 점프 W · 약손 J · 강손 K · 약발 U · 강발 I
   2P: 방향키 · 약손 numpad1 · 강손 numpad2 · 약발 numpad4 · 강발 numpad5
   ⚠️키는 code 로 읽는다. 한글 자판이어도 자리로 잡히기 때문이다. */
var KEYMAP = [
  { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', lp: 'KeyJ', hp: 'KeyK', lk: 'KeyU', hk: 'KeyI' },
  { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
    lp: 'Numpad1', hp: 'Numpad2', lk: 'Numpad4', hk: 'Numpad5' },
];
var held = {};
function blank() { return { left: 0, right: 0, up: 0, down: 0, lp: 0, hp: 0, lk: 0, hk: 0 }; }
function readPad(i) {
  var m = KEYMAP[i], o = blank();
  for (var k in m) o[k] = held[m[k]] ? 1 : 0;
  return o;
}

/* ---------- 커맨드 해석 ----------
   방향을 텐키 숫자로 바꿔 최근 프레임을 훑는다. 앞쪽(6)은 **바라보는 쪽** 기준이다. */
function dirNum(inp, face) {
  var h = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  var v = (inp.up ? 1 : 0) - (inp.down ? 1 : 0);
  h *= face;                                   // 앞/뒤를 바라보는 쪽 기준으로
  if (v > 0) return h > 0 ? 9 : h < 0 ? 7 : 8;
  if (v < 0) return h > 0 ? 3 : h < 0 ? 1 : 2;
  return h > 0 ? 6 : h < 0 ? 4 : 5;
}
/** 최근 입력에서 motion(예 '236')을 찾는다. within 프레임 안에 순서대로 있으면 성립. */
function matchMotion(buf, motion, within) {
  var need = motion.split('').map(Number);
  var idx = need.length - 1;
  var start = Math.max(0, buf.length - within);
  for (var i = buf.length - 1; i >= start; i--) {
    var d = buf[i];
    if (d === need[idx]) {
      idx--;
      if (idx < 0) return true;
    } else if (idx < need.length - 1 && d === need[idx + 1]) {
      // 같은 방향이 이어지는 것은 그냥 넘긴다(사람 손은 붙잡고 있는다)
      continue;
    }
  }
  return false;
}

/* ---------- 파이터 ---------- */
function Fighter(ch, x, face, human) {
  return {
    ch: ch, x: x, y: 0, vx: 0, vy: 0, face: face, human: human,
    hp: ch.hp, maxhp: ch.hp, meter: 0, wins: 0,
    state: 'idle', anim: 'idle', af: 0, loop: true,
    air: false, crouch: false, blocking: false,
    mv: null, mvf: 0, hitUsed: false, hits: 0,
    hitstun: 0, blockstun: 0, downT: 0, getupT: 0, invuln: 0, armorLeft: 0,
    buf: [], lastBtn: {}, combo: 0, comboT: 0, ai: null, aiT: 0, aiPlan: null,
    flash: 0, pushback: 0,
  };
}

function setAnim(f, name, loop) {
  if (f.anim !== name) { f.anim = name; f.af = 0; }
  f.loop = !!loop;
}

function grounded(f) { return f.y >= -0.001; }
function SC(f) { return f.ch.scale * ZOOM; }        // 이 파이터의 실제 배율

/* 몸통(맞는) 상자 — 열 명이 같다. 앉으면 낮아지고, 슬라이딩류는 더 낮아진다. */
function hurtBox(f) {
  var s = SC(f);
  var h = (f.crouch || (f.mv && f.mv.lowProfile)) ? 74 : 116;
  return { x: f.x - 24 * s, y: f.y + GY - h * s, w: 48 * s, h: h * s };
}
/** 기술 판정 상자 — 바라보는 쪽으로 뻗는다 */
function hitBox(f, mv) {
  var s = SC(f), b = mv.box;
  var x = f.face > 0 ? f.x + b[0] * s : f.x - (b[0] + b[2]) * s;
  return { x: x, y: f.y + GY + b[1] * s, w: b[2] * s, h: b[3] * s };
}
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ---------- 기술 시작 ---------- */
function startMove(f, mv) {
  f.mv = mv; f.mvf = 0; f.hitUsed = false; f.hits = 0;
  f.state = 'attack';
  setAnim(f, mv.anim, false);
  f.blocking = false;
  f.armorLeft = mv.armor ? 1 : 0;
  if (mv.invuln) f.invuln = mv.invuln[1];
  if (mv.move) f.vx = mv.move * f.face * ZOOM;
  if (mv.dive) { f.vy = -9 * ZOOM; f.air = true; }
  if (mv.teleport) {
    f.x += -f.face * mv.teleport * ZOOM;
    f.x = Math.max(60, Math.min(ARENA - 60, f.x));
  }
  if (mv.meter) f.meter = Math.max(0, f.meter - 0);          // 필살기는 게이지를 쓰지 않는다(모으기만)
  if (mv.key === 'super') f.meter = 0;
  Snd.whoosh();
}

function canAct(f) {
  return f.hitstun <= 0 && f.blockstun <= 0 && f.downT <= 0 && f.getupT <= 0 && !f.mv &&
         f.state !== 'intro' && f.state !== 'win' && f.state !== 'lose';
}

/** 사람 입력에서 필살기를 찾아본다(누른 순간에만). */
function tryHuman(f, inp, prev) {
  var pressedP = (inp.lp && !prev.lp) || (inp.hp && !prev.hp);
  var pressedK = (inp.lk && !prev.lk) || (inp.hk && !prev.hk);
  if (!pressedP && !pressedK) return null;
  var btn = pressedP ? 'P' : 'K';
  var sup = f.ch.super;
  var supBtn = sup.cmd.slice(-1);
  if (f.meter >= 100 && supBtn === btn && matchMotion(f.buf, sup.cmd.slice(0, -1), 40)) return sup;
  for (var i = 0; i < f.ch.specials.length; i++) {
    var sp = f.ch.specials[i];
    if (sp.cmd.slice(-1) !== btn) continue;
    if (matchMotion(f.buf, sp.cmd.slice(0, -1), 16)) return sp;
  }
  return null;
}

/* ---------- 한 프레임 ---------- */
var G = null;   // 대전 상태

function step() {
  var g = G;
  if (!g || g.paused) return;
  g.frame++;

  if (g.phase === 'intro') {
    g.phaseT--;
    stepFighter(g.p1, blank(), g.p2, true);
    stepFighter(g.p2, blank(), g.p1, true);
    if (g.phaseT <= 0) { g.phase = 'fight'; g.msg = 'FIGHT!'; g.msgT = 50; g.p1.state = 'idle'; g.p2.state = 'idle'; }
    return;
  }
  if (g.phase === 'over') {
    g.phaseT--;
    stepFighter(g.p1, blank(), g.p2, true);
    stepFighter(g.p2, blank(), g.p1, true);
    stepProjectiles(g);
    if (g.phaseT <= 0) endRound(g);
    return;
  }

  // 타이머
  if (g.phase === 'fight') {
    g.timeF--;
    if (g.timeF <= 0) { koCheck(g, true); }
  }

  var i1 = g.p1.human ? readPad(0) : aiInput(g.p1, g.p2, g);
  var i2 = g.p2.human ? readPad(1) : aiInput(g.p2, g.p1, g);
  if (g.demo) { i1 = aiInput(g.p1, g.p2, g); }

  stepFighter(g.p1, i1, g.p2, false);
  stepFighter(g.p2, i2, g.p1, false);
  resolveHits(g);
  stepProjectiles(g);
  separate(g);
  if (g.msgT > 0) g.msgT--;
  if (g.shake > 0) g.shake *= 0.88;
  [g.p1, g.p2].forEach(function (f) {
    if (f.comboT > 0 && --f.comboT <= 0) f.combo = 0;
    if (f.flash > 0) f.flash--;
  });
}

function stepFighter(f, inp, opp, frozen) {
  // 방향 기록(커맨드용)
  f.buf.push(dirNum(inp, f.face));
  if (f.buf.length > 60) f.buf.shift();

  if (f.invuln > 0) f.invuln--;
  if (f.hitstun > 0) f.hitstun--;
  if (f.blockstun > 0) f.blockstun--;

  // 다운 → 기상
  if (f.downT > 0) {
    f.downT--;
    f.vx *= 0.90;
    if (f.downT === 0) { f.getupT = FA.animLength('getup'); setAnim(f, 'getup', false); }
  } else if (f.getupT > 0) {
    f.getupT--;
    if (f.getupT === 0) { f.state = 'idle'; setAnim(f, 'idle', true); }
  }

  var prev = f.lastInp || blank();
  if (!frozen && canAct(f)) {
    // 필살기(사람)
    if (f.human) {
      var sp = tryHuman(f, inp, prev);
      if (sp) startMove(f, sp);
    }
  }

  // 기술 진행
  if (f.mv) {
    f.mvf++;
    var total = f.mv.startup + f.mv.active + f.mv.recovery;
    if (f.mv.proj && f.mvf === f.mv.startup) spawnProj(f, f.mv);
    if (f.mvf >= total) { f.mv = null; f.state = 'idle'; f.armorLeft = 0; setAnim(f, 'idle', true); }
  } else if (!frozen && f.hitstun <= 0 && f.blockstun <= 0 && f.downT <= 0 && f.getupT <= 0) {
    move(f, inp, opp);
  }

  // 물리
  f.x += f.vx;
  f.y += f.vy;
  if (!grounded(f) || f.vy < 0) { f.vy += GRAV; f.air = true; }
  if (f.y >= 0) {
    if (f.air && f.vy > 0) {                     // 착지
      f.air = false; f.vy = 0; f.y = 0; f.vx = 0;
      if (!f.mv && f.downT <= 0 && f.hitstun <= 0) { setAnim(f, 'land', false); f.state = 'land'; f.landT = 5; }
    }
    f.y = 0; f.vy = 0;
  }
  if (f.state === 'land' && !f.mv) {
    if (--f.landT <= 0) { f.state = 'idle'; setAnim(f, 'idle', true); }
  }
  if (!f.air && !f.mv && f.hitstun <= 0 && f.downT <= 0) f.vx *= 0.6;
  if (f.air) f.vx *= 0.995;
  f.x = Math.max(46, Math.min(ARENA - 46, f.x));

  // 서로 마주 본다(공중·경직 중에는 안 바뀐다)
  if (!f.air && !f.mv && f.hitstun <= 0 && f.downT <= 0 && opp) {
    f.face = opp.x >= f.x ? 1 : -1;
  }

  f.af++;
  f.lastInp = inp;
}

function move(f, inp, opp) {
  var back = (f.face > 0 ? inp.left : inp.right);
  var fwd = (f.face > 0 ? inp.right : inp.left);
  f.crouch = !!inp.down && !f.air;
  f.blocking = false;

  // 공중
  if (f.air) {
    if (pressAtk(f, inp)) {
      var m = inp.hp || inp.hk ? f.ch.normals.jk : f.ch.normals.jp;
      startMove(f, m);
    }
    return;
  }

  // 점프
  if (inp.up) {
    f.vy = -f.ch.jump * ZOOM;
    f.air = true;
    f.vx = (fwd ? f.ch.walk * 1.6 * f.face : back ? -f.ch.walk * 1.4 * f.face : 0) * ZOOM;
    f.state = 'jump'; setAnim(f, 'jumpUp', false);
    return;
  }

  // 공격
  if (pressAtk(f, inp)) {
    var N = f.ch.normals, mv2;
    if (f.crouch) mv2 = inp.lp ? N.clp : inp.hp ? N.clp : inp.lk ? N.clk : N.chk;
    else mv2 = inp.lp ? N.lp : inp.hp ? N.hp : inp.lk ? N.lk : N.hk;
    startMove(f, mv2);
    return;
  }

  // 막기 자세(뒤로 밀고 있으면) — 실제 막기 판정은 맞는 순간에 본다
  if (back) {
    f.blocking = true;
    f.state = f.crouch ? 'blockLow' : 'block';
    setAnim(f, f.crouch ? 'blockLow' : 'block', false);
    f.vx = -f.ch.walk * 0.72 * f.face * ZOOM;
    return;
  }

  if (f.crouch) { f.state = 'crouch'; setAnim(f, 'crouch', false); f.vx = 0; return; }

  if (fwd) {
    var run = f.dashT > 0;
    f.vx = (run ? f.ch.dash : f.ch.walk) * f.face * ZOOM;
    f.state = run ? 'run' : 'walk';
    setAnim(f, run ? 'run' : 'walk', true);
    if (f.dashT > 0) f.dashT--;
    return;
  }
  f.state = 'idle'; setAnim(f, 'idle', true); f.vx = 0;
}

function pressAtk(f, inp) {
  var p = f.lastInp || blank();
  return (inp.lp && !p.lp) || (inp.hp && !p.hp) || (inp.lk && !p.lk) || (inp.hk && !p.hk);
}

/* ---------- 장풍 ---------- */
function spawnProj(f, mv) {
  var p = mv.proj, s = SC(f);
  G.projs.push({
    x: f.x + f.face * 46 * s, y: f.y + GY + p.y * s, vx: p.speed * f.face * ZOOM,
    w: p.w * s, h: p.h * s, dmg: p.dmg, hit: p.hit, block: p.block, kb: p.kb,
    color: p.color, shape: p.shape, life: p.life, owner: f, hits: p.hits, done: 0, t: 0,
  });
  Snd.fire();
}

function stepProjectiles(g) {
  for (var i = g.projs.length - 1; i >= 0; i--) {
    var p = g.projs[i];
    p.x += p.vx; p.t++;
    if (--p.life <= 0 || p.x < -80 || p.x > ARENA + 80) { g.projs.splice(i, 1); continue; }
    var def = p.owner === g.p1 ? g.p2 : g.p1;
    var box = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
    // 장풍끼리 부딪히면 함께 사라진다
    for (var j = g.projs.length - 1; j >= 0; j--) {
      if (j === i) continue;
      var q = g.projs[j];
      if (q.owner === p.owner) continue;
      if (overlap(box, { x: q.x - q.w / 2, y: q.y - q.h / 2, w: q.w, h: q.h })) {
        boom(g, (p.x + q.x) / 2, (p.y + q.y) / 2, p.color);
        g.projs.splice(Math.max(i, j), 1); g.projs.splice(Math.min(i, j), 1);
        i = Math.min(i, j);
        p = null; break;
      }
    }
    if (!p) continue;
    if (def.invuln > 0 || def.downT > 0) continue;
    if (overlap(box, hurtBox(def))) {
      applyHit(g, p.owner, def, { dmg: p.dmg, hit: p.hit, block: p.block, kb: p.kb, type: 'mid' }, true);
      if (--p.hits <= 0) { boom(g, p.x, p.y, p.color); g.projs.splice(i, 1); }
    }
  }
}

function boom(g, x, y, col) {
  for (var i = 0; i < 10; i++) {
    g.fx.push({ x: x, y: y, vx: (Math.random() - .5) * 7, vy: (Math.random() - .5) * 7,
                life: 16, col: col, r: 3 + Math.random() * 5 });
  }
}

/* ---------- 맞았다 ---------- */
function resolveHits(g) {
  [[g.p1, g.p2], [g.p2, g.p1]].forEach(function (pair) {
    var a = pair[0], d = pair[1];
    if (!a.mv || !a.mv.box) return;
    var mv = a.mv;
    var act = a.mvf > mv.startup && a.mvf <= mv.startup + mv.active;
    if (!act) return;
    if (mv.multi) {
      var every = Math.max(2, Math.floor(mv.active / mv.multi));
      if ((a.mvf - mv.startup) % every !== 1) return;
      if (a.hits >= mv.multi) return;
    } else if (a.hitUsed) return;
    if (d.invuln > 0 || d.downT > 0) return;
    if (!overlap(hitBox(a, mv), hurtBox(d))) return;
    if (mv.grab && (d.air || d.downT > 0)) return;
    a.hitUsed = true; a.hits++;
    applyHit(g, a, d, mv, false);
  });
}

function applyHit(g, att, def, mv, isProj) {
  // CPU 가 때릴 때만 난이도 배율이 걸린다(사람끼리 붙을 때는 늘 그대로)
  var LV = (att.human ? 1 : ((DIFF[AI_LEVEL] || DIFF.normal).dmg || 1));
  var MD = Math.max(1, Math.round(mv.dmg * LV));
  // 막았는가 — 뒤로 밀고 있고, 땅에 있고, 기술을 내지 않는 중이며, 높낮이가 맞아야 한다
  var canBlock = def.blocking && !def.air && !def.mv && !mv.grab;
  if (canBlock) {
    if (mv.type === 'low' && !def.crouch) canBlock = false;      // 하단은 앉아 막아야
    if (mv.type === 'high' && def.crouch) canBlock = false;      // 점프 공격은 서서 막아야
  }
  if (canBlock) {
    def.hp -= Math.max(1, Math.round(MD * 0.12));
    def.blockstun = mv.block;
    def.vx = (att.x < def.x ? 1 : -1) * 2.6 * ZOOM;
    att.meter = Math.min(100, att.meter + 2);
    def.meter = Math.min(100, def.meter + 3);
    setAnim(def, def.crouch ? 'blockLow' : 'block', false);
    Snd.block();
    g.fx.push({ x: def.x + (att.x < def.x ? -20 : 20), y: def.y + GY - 70, vx: 0, vy: 0, life: 10, col: '#bcd7ff', r: 12, ring: true });
    if (def.hp <= 0) koCheck(g);
    return;
  }

  // 슈퍼아머 — 맞긴 맞되 밀리지 않는다
  if (def.armorLeft > 0 && !mv.grab) {
    def.armorLeft--;
    def.hp -= Math.round(MD * 0.5);
    Snd.hit(false);
    g.fx.push({ x: def.x, y: def.y + GY - 80, vx: 0, vy: 0, life: 12, col: '#ffd27a', r: 16, ring: true });
    if (def.hp <= 0) koCheck(g);
    return;
  }

  var dmg = MD;
  if (att.combo > 0) dmg = Math.round(dmg * Math.max(0.35, 1 - att.combo * 0.08));   // 콤보 보정
  def.hp -= dmg;
  def.mv = null; def.blocking = false;
  def.hitstun = mv.hit || 14;
  def.combo = 0;
  att.combo++; att.comboT = 90;
  att.meter = Math.min(100, att.meter + (isProj ? 4 : 6));
  def.meter = Math.min(100, def.meter + 4);
  def.flash = 6;
  var dir = att.x <= def.x ? 1 : -1;
  def.vx = dir * (mv.kb || 4) * (1 / (def.ch.weight || 1)) * ZOOM;
  if (mv.launch) { def.vy = mv.launch * ZOOM; def.air = true; }
  if (mv.knockdown || def.air || mv.launch) {
    def.downT = 46; def.hitstun = 0;
    setAnim(def, 'down', false);
    def.state = 'down';
  } else {
    setAnim(def, def.crouch ? 'hitLow' : 'hit', false);
    def.state = 'hit';
  }
  if (mv.shake) g.shake = mv.shake;
  Snd.hit(dmg > 60);
  for (var i = 0; i < (dmg > 60 ? 9 : 5); i++) {
    g.fx.push({ x: def.x + dir * -10, y: def.y + GY - 74 - Math.random() * 24,
                vx: dir * (1 + Math.random() * 4), vy: -2 + Math.random() * -3,
                life: 18, col: dmg > 60 ? '#ffd27a' : '#ffffff', r: 2.5 + Math.random() * 4 });
  }
  if (def.hp <= 0) koCheck(g);
}

function separate(g) {
  var a = g.p1, b = g.p2;
  var minD = 46 * (SC(a) + SC(b)) / 2;
  var d = b.x - a.x;
  if (Math.abs(d) < minD) {
    var push = (minD - Math.abs(d)) / 2 * (d >= 0 ? 1 : -1);
    a.x -= push; b.x += push;
  }
  // ⚠️둘이 화면 밖으로 갈라지면 안 된다 — 카메라가 담을 수 있는 만큼만 벌어진다.
  //   (이게 없으면 도망만 다니는 상대를 영영 못 잡는다)
  var mid = (a.x + b.x) / 2;
  var cam = Math.max(0, Math.min(ARENA - VW, mid - VW / 2));
  [a, b].forEach(function (f) {
    f.x = Math.max(cam + 44, Math.min(cam + VW - 44, f.x));
    f.x = Math.max(46, Math.min(ARENA - 46, f.x));
  });
}

/* ---------- 라운드 ---------- */
function koCheck(g, byTime) {
  if (g.phase !== 'fight') return;
  var p1 = g.p1, p2 = g.p2;
  if (byTime) {
    g.roundWinner = p1.hp === p2.hp ? 0 : (p1.hp > p2.hp ? 1 : 2);
    g.msg = 'TIME UP';
  } else {
    if (p1.hp <= 0 && p2.hp <= 0) g.roundWinner = 0;
    else if (p2.hp <= 0) g.roundWinner = 1;
    else if (p1.hp <= 0) g.roundWinner = 2;
    else return;
    g.msg = 'K.O.';
    Snd.ko();
  }
  p1.hp = Math.max(0, p1.hp); p2.hp = Math.max(0, p2.hp);
  g.msgT = 120;
  g.phase = 'over';
  g.phaseT = 150;
  var win = g.roundWinner === 1 ? p1 : g.roundWinner === 2 ? p2 : null;
  var lose = g.roundWinner === 1 ? p2 : g.roundWinner === 2 ? p1 : null;
  if (win) { win.wins++; win.state = 'win'; setAnim(win, 'win', true); win.mv = null; }
  if (lose) { lose.state = 'lose'; setAnim(lose, 'lose', false); lose.mv = null; lose.downT = 999; }
}

function endRound(g) {
  if (g.p1.wins >= WINS_NEEDED || g.p2.wins >= WINS_NEEDED || g.round >= 3) {
    g.phase = 'match';
    g.matchWinner = g.p1.wins > g.p2.wins ? 1 : g.p2.wins > g.p1.wins ? 2 : 0;
    if (window.onMatchEnd) window.onMatchEnd(g.matchWinner);
    return;
  }
  g.round++;
  newRound(g);
}

function newRound(g) {
  var a = g.p1, b = g.p2;
  [a, b].forEach(function (f, i) {
    f.hp = f.maxhp; f.x = i === 0 ? ARENA / 2 - 150 : ARENA / 2 + 150; f.y = 0;
    f.vx = 0; f.vy = 0; f.air = false; f.mv = null; f.hitstun = 0; f.blockstun = 0;
    f.downT = 0; f.getupT = 0; f.invuln = 0; f.combo = 0; f.crouch = false;
    f.state = 'intro'; setAnim(f, 'intro', false);
    f.face = i === 0 ? 1 : -1;
    f.buf = [];
  });
  g.projs = []; g.fx = [];
  g.timeF = ROUND_TIME * FPS;
  g.phase = 'intro'; g.phaseT = 90;
  g.msg = 'ROUND ' + g.round; g.msgT = 90;
  g.roundWinner = 0;
}

function newMatch(charA, charB, stage, humanP2, demo) {
  G = {
    p1: Fighter(charA, ARENA / 2 - 150, 1, !demo),
    p2: Fighter(charB, ARENA / 2 + 150, -1, !!humanP2),
    stage: stage, round: 1, projs: [], fx: [], frame: 0, shake: 0,
    phase: 'intro', phaseT: 90, msg: '', msgT: 0, timeF: ROUND_TIME * FPS,
    roundWinner: 0, matchWinner: 0, paused: false, demo: !!demo, camX: 0,
  };
  newRound(G);
  return G;
}

/* ============================================================
   CPU — 정직하게 강하다
   ★사람 흉내로 커맨드를 넣게 하면 CPU 는 약해지기만 한다. 대신 **기술을 직접 고르되
     반응 시간·막기 확률·거리 판단**으로 세기를 조절한다.
   ============================================================ */
/* ★난이도는 '반응 속도'만으로 만들지 않는다. 반응만 느리게 하면 CPU 는 **여전히 쉬지 않고**
     달려들어, 느려도 벅차다. 사람이 숨 돌릴 자리를 주는 건 rest(가만히 있는 틈)와
     dmg(CPU 가 주는 피해)다 — 실제로 난이도를 가르는 건 이 둘이다.
   rest  한 번 판단할 때 아무것도 하지 않고 쉴 확률
   dmg   CPU 가 때릴 때의 피해 배율(사람끼리 붙을 때는 걸리지 않는다) */
var DIFF = {
  easy:   { react: 30, block: 0.18, aa: 0.08, punish: 0.08, aggr: 0.22, meter: 0.20, rest: 0.55, dmg: 0.50 },
  normal: { react: 17, block: 0.38, aa: 0.28, punish: 0.28, aggr: 0.45, meter: 0.50, rest: 0.26, dmg: 0.80 },
  hard:   { react: 9,  block: 0.66, aa: 0.60, punish: 0.60, aggr: 0.68, meter: 0.80, rest: 0.10, dmg: 1.00 },
  master: { react: 4,  block: 0.90, aa: 0.88, punish: 0.90, aggr: 0.85, meter: 1.00, rest: 0.00, dmg: 1.12 },
};
var AI_LEVEL = 'normal';

function aiInput(f, opp, g) {
  var inp = blank();
  var D = DIFF[AI_LEVEL] || DIFF.hard;
  var dist = Math.abs(opp.x - f.x);
  var toward = opp.x > f.x ? 'right' : 'left';
  var away = opp.x > f.x ? 'left' : 'right';
  if (g.phase !== 'fight') return inp;
  if (!canAct(f)) return inp;

  f.aiT--;
  // 상대 장풍이 날아오는가
  var incoming = null;
  for (var i = 0; i < g.projs.length; i++) {
    var p = g.projs[i];
    if (p.owner === f) continue;
    if ((p.vx > 0 && p.x < f.x) || (p.vx < 0 && p.x > f.x)) incoming = p;
  }

  // 1) 대공 — 상대가 뛰어서 다가오면 대공기로 떨어뜨린다(가장 강한 습관)
  if (opp.air && opp.vy > -4 && dist < 150 && Math.random() < D.aa) {
    var aa = findSpecial(f, ['upper']);
    if (aa) { startMove(f, aa); return inp; }
  }
  // 2) 장풍 대응 — 막거나, 멀면 뛰어넘는다
  if (incoming) {
    var d2 = Math.abs(incoming.x - f.x);
    if (d2 < 260 && d2 > 90 && Math.random() < 0.35 && dist > 220) {
      inp.up = 1; inp[toward] = 1; return inp;
    }
    inp[away] = 1;                     // 뒤로 밀어 막는다
    if (Math.random() < 0.5) inp.down = 1;
    return inp;
  }
  // 3) 상대가 기술을 내는 중이고 내가 사정거리 안이면 막는다
  if (opp.mv && dist < 150 && Math.random() < D.block) {
    inp[away] = 1;
    if (opp.mv.type === 'low' || (opp.mv.box && opp.mv.box[1] > -40)) inp.down = 1;
    return inp;
  }
  // 4) 헛친 기술을 벌준다
  if (opp.mv && opp.mvf > opp.mv.startup + opp.mv.active && dist < 130 && Math.random() < D.punish) {
    var big = f.meter >= 100 && Math.random() < D.meter ? f.ch.super : findSpecial(f, ['upper', 'fireball', 'money']);
    if (big) { startMove(f, big); return inp; }
    inp.hp = 1; return inp;
  }
  // 5) 게이지가 찼고 가까우면 초필살기
  if (f.meter >= 100 && dist < 160 && Math.random() < D.meter * 0.06) {
    startMove(f, f.ch.super); return inp;
  }

  if (f.aiT > 0 && f.aiPlan) return f.aiPlan(inp, dist, toward, away);
  f.aiT = D.react + Math.floor(Math.random() * 10);

  // 쉬는 틈 — 쉬운 난이도가 쉬워지는 건 느려서가 아니라 **덜 몰아쳐서**다
  if (Math.random() < (D.rest || 0)) {
    f.aiPlan = function (o) { return o; };
    f.aiT = D.react + 12 + Math.floor(Math.random() * 26);
    return inp;
  }

  var r = Math.random();
  if (dist > 300) {
    // 멀다 — 장풍을 쏘거나 다가온다
    var fb = findSpecial(f, ['fireball', 'money', 'orb', 'needle', 'shot', 'spike', 'nag', 'shuriken']);
    if (fb && r < 0.45) { startMove(f, fb); return inp; }
    f.aiPlan = function (o, dd, tw) { o[tw] = 1; return o; };
    f.dashT = 20;
    return f.aiPlan(inp, dist, toward, away);
  }
  if (dist > 150) {
    // 중거리 — 파고들거나 견제한다
    if (r < 0.30 * D.aggr) {
      var rush = findSpecial(f, ['spin', 'tackle', 'knee', 'headbutt', 'chair', 'slide', 'robe', 'dive']);
      if (rush) { startMove(f, rush); return inp; }
    }
    if (r < 0.55) { f.aiPlan = function (o, dd, tw) { o[tw] = 1; return o; }; f.dashT = 14; }
    else if (r < 0.68) { f.aiPlan = function (o, dd, tw, aw) { o[aw] = 1; return o; }; }
    else if (r < 0.80) { f.aiPlan = function (o, dd, tw) { o.up = 1; o[tw] = 1; return o; }; }
    else { f.aiPlan = function (o) { o.hk = 1; return o; }; }
    return f.aiPlan(inp, dist, toward, away);
  }
  // 근접 — 때리거나 잡거나 하단
  if (r < 0.16) {
    var gr = findSpecial(f, ['grab']);
    if (gr) { startMove(f, gr); return inp; }
  }
  if (r < 0.34) { f.aiPlan = function (o) { o.lp = 1; return o; }; }
  else if (r < 0.52) { f.aiPlan = function (o) { o.down = 1; o.lk = 1; return o; }; }
  else if (r < 0.68) { f.aiPlan = function (o) { o.hp = 1; return o; }; }
  else if (r < 0.80) { f.aiPlan = function (o) { o.down = 1; o.hk = 1; return o; }; }
  else if (r < 0.90) {
    var sp2 = findSpecial(f, ['upper', 'spin', 'lariat', 'papers', 'sweepkick']);
    if (sp2) { startMove(f, sp2); return inp; }
    f.aiPlan = function (o) { o.hk = 1; return o; };
  } else { f.aiPlan = function (o, dd, tw, aw) { o[aw] = 1; return o; }; }
  return f.aiPlan(inp, dist, toward, away);
}

function findSpecial(f, keys) {
  for (var i = 0; i < keys.length; i++) {
    for (var j = 0; j < f.ch.specials.length; j++) {
      if (f.ch.specials[j].key === keys[i]) return f.ch.specials[j];
    }
  }
  return null;
}

/* ============================================================
   그리기
   ============================================================ */
function draw() {
  if (!cx || !G) return;
  var g = G;
  var mid = (g.p1.x + g.p2.x) / 2;
  g.camX = Math.max(0, Math.min(ARENA - VW, mid - VW / 2));
  var sh = g.shake > 0.5 ? (Math.random() - .5) * g.shake : 0;

  cx.save();
  cx.translate(sh, sh * 0.4);
  // ⚠️캐릭터만 키우면 건물이 장난감처럼 보인다 — 배경도 바닥선을 축으로 함께 키운다.
  //   캐릭터보다 조금 덜 키워서(1.5 vs 1.8) 멀리 있는 느낌을 남긴다.
  var bz = 1.25;   // ⚠️1.5 로 하면 간판·첨탑이 체력바 뒤로 올라가 잘린다
  cx.save();
  cx.translate(VW / 2, GY); cx.scale(bz, bz); cx.translate(-VW / 2, -GY);
  g.stage.draw(cx, VW, VH, g.camX / bz, GY, g.frame / 60);
  cx.restore();

  // 그림자 — 배경 위에 옅게(캐릭터는 투명하게 그 위에 올라간다)
  [g.p1, g.p2].forEach(function (f) {
    var sx = f.x - g.camX, s = SC(f);
    var k = Math.max(0.35, 1 + f.y / (220 * ZOOM));
    cx.fillStyle = 'rgba(8,10,18,' + (0.30 * k) + ')';
    cx.beginPath(); cx.ellipse(sx, GY + 2, 30 * s * k, 8 * k, 0, 0, 7); cx.fill();
  });

  drawFighterFull(g.p2, g.camX);
  drawFighterFull(g.p1, g.camX);

  // 장풍
  g.projs.forEach(function (p) { drawProj(cx, p, g.camX); });
  // 효과
  for (var i = g.fx.length - 1; i >= 0; i--) {
    var e = g.fx[i];
    e.x += e.vx || 0; e.y += e.vy || 0;
    if (e.vy !== undefined && !e.ring) e.vy += 0.25;
    e.life--;
    if (e.life <= 0) { g.fx.splice(i, 1); continue; }
    cx.globalAlpha = Math.max(0, e.life / 18);
    if (e.ring) {
      cx.strokeStyle = e.col; cx.lineWidth = 3;
      cx.beginPath(); cx.arc(e.x - g.camX, e.y, e.r + (12 - e.life) * 2, 0, 7); cx.stroke();
    } else {
      cx.fillStyle = e.col;
      cx.beginPath(); cx.arc(e.x - g.camX, e.y, e.r, 0, 7); cx.fill();
    }
    cx.globalAlpha = 1;
  }
  cx.restore();
  drawHud(g);
}

/* 발차기·주먹이 지나간 자리 — 큰 기술이 '커 보이는' 것의 절반은 이 자국이다.
   ⚠️그림이 아니라 **지나간 자리**를 남기는 것이라, 판정과는 아무 상관이 없다(공평은 그대로). */
var KICK_ANIM = { lk: 1, hk: 1, clk: 1, chk: 1, jk: 1, spin: 1 };
function drawSmear(f, x, y, pose) {
  var mv = f.mv;
  var live = mv && f.mvf >= mv.startup - 1 && f.mvf <= mv.startup + mv.active + 2;
  if (!live) { f.trail = null; return; }
  var pt = KICK_ANIM[mv.anim] ? FA.footPos(pose, f.face, SC(f)) : FA.handPos(pose, f.face, SC(f));
  if (!f.trail) f.trail = [];
  f.trail.push({ x: x + pt.x, y: y + pt.y });
  if (f.trail.length > 5) f.trail.shift();
  if (f.trail.length < 2) return;
  cx.save();
  cx.lineCap = 'round';
  for (var i = 1; i < f.trail.length; i++) {
    var a = f.trail[i - 1], b = f.trail[i], k = i / f.trail.length;
    cx.strokeStyle = 'rgba(255,255,255,' + (0.04 + 0.13 * k).toFixed(3) + ')';
    cx.lineWidth = (5 + 9 * k) * SC(f);
    cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
  }
  cx.restore();
}

function drawFighterFull(f, camX) {
  var pose = FA.poseAt(f.anim, f.af, f.loop);
  var x = f.x - camX, y = f.y + GY;
  drawSmear(f, x, y, pose);
  if (f.flash > 0 && f.flash % 2) {
    cx.save(); cx.globalCompositeOperation = 'lighter';
  }
  FA.drawFighter(cx, x, y, f.face, f.ch, pose, { zoom: ZOOM });
  if (f.flash > 0 && f.flash % 2) cx.restore();

  // 손에 든 소품
  if (f.ch.propDraw) {
    var h = FA.handPos(pose, f.face, SC(f));
    cx.save();
    cx.translate(x + h.x, y + h.y);
    cx.scale(f.face * SC(f), SC(f));
    cx.rotate((pose.aF[1] - Math.PI / 2) * 0.4);
    f.ch.propDraw(cx, f.ch.col);
    cx.restore();
  }
  // 무적일 때 옅은 테두리
  if (f.invuln > 0) {
    cx.strokeStyle = 'rgba(160,220,255,.5)'; cx.lineWidth = 2;
    var hb = hurtBox(f);
    cx.strokeRect(hb.x - camX, hb.y, hb.w, hb.h);
  }
}

function drawProj(cx2, p, camX) {
  var x = p.x - camX, y = p.y;
  cx2.save();
  cx2.translate(x, y);
  var t = p.t;
  cx2.shadowColor = p.color; cx2.shadowBlur = 18;
  cx2.fillStyle = p.color;
  if (p.shape === 'star') {
    cx2.rotate(t * 0.5);
    cx2.beginPath();
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, r = i % 2 ? p.w * 0.22 : p.w * 0.5;
      cx2[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    cx2.closePath(); cx2.fill();
  } else if (p.shape === 'bill') {
    for (var b = -1; b <= 1; b++) {
      cx2.save(); cx2.rotate(b * 0.4 + Math.sin(t * 0.2) * 0.2);
      cx2.fillRect(-p.w * 0.4, -p.h * 0.22 + b * 4, p.w * 0.8, p.h * 0.4);
      cx2.restore();
    }
  } else if (p.shape === 'soccer' || p.shape === 'ballspin') {
    cx2.rotate(t * 0.45);
    cx2.beginPath(); cx2.arc(0, 0, p.w * 0.45, 0, 7); cx2.fill();
    cx2.strokeStyle = 'rgba(30,30,40,.7)'; cx2.lineWidth = 2;
    cx2.beginPath(); cx2.moveTo(-p.w * 0.45, 0); cx2.lineTo(p.w * 0.45, 0); cx2.stroke();
  } else if (p.shape === 'code') {
    cx2.font = 'bold 13px monospace';
    cx2.fillText('{ }', -p.w * 0.35, 4);
    cx2.globalAlpha = 0.5; cx2.fillText('err', -p.w * 0.3, -10); cx2.globalAlpha = 1;
    cx2.strokeStyle = p.color; cx2.lineWidth = 2;
    cx2.strokeRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
  } else if (p.shape === 'wave') {
    cx2.strokeStyle = p.color; cx2.lineWidth = 3;
    for (var w = 0; w < 3; w++) {
      cx2.beginPath();
      cx2.arc(-w * 8, 0, p.w * 0.28 + w * 4, -1.1, 1.1);
      cx2.stroke();
    }
  } else {
    var g2 = cx2.createRadialGradient(0, 0, 2, 0, 0, p.w * 0.6);
    g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.4, p.color);
    g2.addColorStop(1, 'rgba(255,255,255,0)');
    cx2.fillStyle = g2;
    cx2.beginPath(); cx2.ellipse(0, 0, p.w * 0.6, p.h * 0.55, 0, 0, 7); cx2.fill();
  }
  cx2.restore();
}

function bar(x, y, w, h, v, max, col, flip) {
  cx.fillStyle = 'rgba(10,12,20,.75)';
  cx.fillRect(x - 2, y - 2, w + 4, h + 4);
  cx.fillStyle = 'rgba(120,20,20,.9)';
  cx.fillRect(x, y, w, h);
  var f = Math.max(0, Math.min(1, v / max));
  cx.fillStyle = col;
  if (flip) cx.fillRect(x + w * (1 - f), y, w * f, h);
  else cx.fillRect(x, y, w * f, h);
  cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1;
  cx.strokeRect(x, y, w, h);
}

function drawHud(g) {
  var w = Math.min(360, VW * 0.38), h = 20, y = 18;
  bar(20, y, w, h, g.p1.hp, g.p1.maxhp, g.p1.hp < g.p1.maxhp * 0.25 ? '#e05a4a' : '#5ec97a', false);
  bar(VW - 20 - w, y, w, h, g.p2.hp, g.p2.maxhp, g.p2.hp < g.p2.maxhp * 0.25 ? '#e05a4a' : '#5ec97a', true);
  // 게이지
  bar(20, y + h + 6, w * 0.7, 8, g.p1.meter, 100, '#7cc4ff', false);
  bar(VW - 20 - w * 0.7, y + h + 6, w * 0.7, 8, g.p2.meter, 100, '#7cc4ff', true);
  cx.fillStyle = '#fff'; cx.font = '700 14px sans-serif';
  cx.textAlign = 'left'; cx.fillText(g.p1.ch.name + ' · ' + g.p1.ch.job, 20, y + h + 30);
  cx.textAlign = 'right'; cx.fillText(g.p2.ch.name + ' · ' + g.p2.ch.job, VW - 20, y + h + 30);
  // 라운드 표시
  cx.textAlign = 'center';
  for (var i = 0; i < 2; i++) {
    cx.fillStyle = g.p1.wins > i ? '#e8c766' : 'rgba(255,255,255,.25)';
    cx.beginPath(); cx.arc(20 + w + 14 + i * 16, y + 10, 5.5, 0, 7); cx.fill();
    cx.fillStyle = g.p2.wins > i ? '#e8c766' : 'rgba(255,255,255,.25)';
    cx.beginPath(); cx.arc(VW - 20 - w - 14 - i * 16, y + 10, 5.5, 0, 7); cx.fill();
  }
  // 시간
  cx.fillStyle = 'rgba(10,12,20,.75)';
  cx.fillRect(VW / 2 - 36, 12, 72, 44);
  cx.fillStyle = '#fff'; cx.font = '800 30px sans-serif';
  cx.fillText(Math.max(0, Math.ceil(g.timeF / FPS)), VW / 2, 44);
  // 콤보
  [g.p1, g.p2].forEach(function (f, i) {
    if (f.combo >= 2 && f.comboT > 0) {
      cx.fillStyle = '#e8c766'; cx.font = '800 22px sans-serif';
      cx.textAlign = i === 0 ? 'left' : 'right';
      cx.fillText(f.combo + ' 연속', i === 0 ? 24 : VW - 24, 110);
    }
  });
  // 가운데 글자
  if (g.msgT > 0 && g.msg) {
    cx.textAlign = 'center';
    cx.font = '900 54px sans-serif';
    cx.lineWidth = 6; cx.strokeStyle = 'rgba(10,12,20,.8)';
    cx.strokeText(g.msg, VW / 2, VH * 0.42);
    cx.fillStyle = '#ffd75e';
    cx.fillText(g.msg, VW / 2, VH * 0.42);
  }
  cx.textAlign = 'left';
}

/* ---------- 화면 크기 ---------- */
function fit() {
  cv = document.getElementById('game');
  if (!cv) return;
  cx = cv.getContext('2d');
  var w = cv.clientWidth || window.innerWidth, h = cv.clientHeight || window.innerHeight;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
  VW = w; VH = h;
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  GY = Math.round(VH * 0.80);
}

/* ---------- 루프 ---------- */
var acc = 0, last = 0;
function frame(ts) {
  var dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
  last = ts;
  acc += dt;
  var guard = 0;
  while (acc >= 1 / FPS && guard++ < 5) { step(); acc -= 1 / FPS; }
  draw();
  requestAnimationFrame(frame);
}

window.JOSS = {
  newMatch: newMatch, get G() { return G; }, step: step, draw: draw, fit: fit,
  Fighter: Fighter, startMove: startMove, findSpecial: findSpecial,
  hurtBox: hurtBox, hitBox: hitBox, overlap: overlap, matchMotion: matchMotion,
  setLevel: function (l) { AI_LEVEL = l; }, getLevel: function () { return AI_LEVEL; },
  DIFF: DIFF, ARENA: ARENA, ZOOM: ZOOM, get GY() { return GY; }, Snd: Snd, Mus: Mus, held: held,
  KEYMAP: KEYMAP, FPS: FPS, aiInput: aiInput, applyHit: applyHit, blank: blank,
  loop: function () { requestAnimationFrame(frame); },
};

window.addEventListener('keydown', function (e) {
  held[e.code] = 1;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
});
window.addEventListener('keyup', function (e) { held[e.code] = 0; });
window.addEventListener('blur', function () { for (var k in held) held[k] = 0; });
// 탭을 가리면 오디오 시계까지 재운다 — 돌아왔을 때 밀린 음이 쏟아지지 않는다
document.addEventListener('visibilitychange', function () {
  if (!AC) return;
  try { document.hidden ? AC.suspend() : AC.resume(); } catch (e) {}
});
})();
