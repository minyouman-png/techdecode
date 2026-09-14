// 삼한통일전 — 소리. 파일을 싣지 않고 Web Audio 로 만들어 쓴다(용량 0).
//
// ★음계: 고대 동아시아의 5음(궁상각치우)에 맞춰 펜타토닉만 쓴다. 서양 7음계를 쓰면
//   같은 악기로도 시대가 어긋나 들린다.
'use strict';

const Sound = (() => {
  let ctx = null, master = null, bgmGain = null, sfxGain = null;
  let cur = null, timer = null, on = true;

  // 계이름: 황종(C) 기준 5음 — 궁·상·각·치·우
  const PENTA = [0, 2, 4, 7, 9];
  const hz = (semi) => 261.63 * Math.pow(2, semi / 12);
  const note = (deg, oct = 0) => hz(PENTA[((deg % 5) + 5) % 5] + 12 * (oct + Math.floor(deg / 5)));

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // ★cg.js 가 광고 중 음소거하려면 이 핸들이 필요하다(포털 정책)
    window.__actx = ctx;
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    bgmGain = ctx.createGain(); bgmGain.gain.value = 0.30; bgmGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.55; sfxGain.connect(master);
    try { on = localStorage.getItem('samhan_mute') !== '1'; } catch (e) { /* 시크릿 */ }
    master.gain.value = on ? 0.5 : 0;
    return ctx;
  }

  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  // ── 악기 ─────────────────────────────────────
  // 대금 비슷한 소리 — 삼각파에 숨소리(노이즈)를 살짝 얹는다
  function flute(f, t, dur, gain = 0.16) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(f, t);
    o.frequency.linearRampToValueAtTime(f * 1.003, t + dur);
    lp.type = 'lowpass'; lp.frequency.value = 2200;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + Math.min(0.12, dur * 0.3));
    g.gain.setTargetAtTime(0, t + dur * 0.6, dur * 0.25);
    o.connect(lp); lp.connect(g); g.connect(bgmGain);
    o.start(t); o.stop(t + dur + 0.4);
  }
  // 가야금 뜯는 소리 — 짧은 감쇠
  function pluck(f, t, gain = 0.12) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2600, t);
    lp.frequency.exponentialRampToValueAtTime(500, t + 0.5);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.9);
    o.connect(lp); lp.connect(g); g.connect(bgmGain);
    o.start(t); o.stop(t + 1.0);
  }
  // 북 — 노이즈 + 낮은 사인
  function drum(t, gain = 0.4, pitch = 90) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(pitch * 2, t);
    o.frequency.exponentialRampToValueAtTime(pitch * 0.6, t + 0.16);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    o.connect(g); g.connect(bgmGain);
    o.start(t); o.stop(t + 0.36);
  }
  function noise(t, dur, gain, hpf) {
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = gain;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hpf || 800;
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t);
  }

  // ── 위임 전투 연출의 소리 (09-14) ────────────────
  // 띠를 통과시킨 노이즈 — 주파수가 f0 에서 f1 로 흘러간다
  function noiseBand(t, dur, gain, f0, f1, q, attack) {
    const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1 || f0, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t); src.stop(t + dur + 0.02);
  }
  // 함성 '우와아아' — 여러 사람의 톱니파 목소리를 모음 울림통(F1·F2) 필터 두 개에 통과시킨다.
  //   필터가 '우'(낮고 좁은 입) 자리에서 '아'(열린 입) 자리로 올라가면서 '우와' 가 된다.
  function shout(t, dur, voices) {
    for (let i = 0; i < voices; i++) {
      const st = t + i * 0.035 + Math.random() * 0.05;
      const f0 = 115 + Math.random() * 120;
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0 * 0.82, st);
      o.frequency.linearRampToValueAtTime(f0 * 1.15, st + dur * 0.3);
      o.frequency.linearRampToValueAtTime(f0 * 0.92, st + dur);
      const vib = ctx.createOscillator(), vg = ctx.createGain();
      vib.frequency.value = 4.5 + Math.random() * 2.5; vg.gain.value = f0 * 0.035;
      vib.connect(vg); vg.connect(o.frequency);
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 5;
      f1.frequency.setValueAtTime(330, st); f1.frequency.linearRampToValueAtTime(780, st + dur * 0.35);
      const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 7;
      f2.frequency.setValueAtTime(760, st); f2.frequency.linearRampToValueAtTime(1180, st + dur * 0.35);
      const g = ctx.createGain(), peak = 0.07 + Math.random() * 0.04;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(peak, st + 0.22 + Math.random() * 0.12);
      g.gain.setValueAtTime(peak, st + dur * 0.65);
      g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
      o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(sfxGain);
      o.start(st); vib.start(st); o.stop(st + dur + 0.05); vib.stop(st + dur + 0.05);
    }
    noiseBand(t, dur, 0.06, 700, 1100, 0.8, 0.3);          // 흙먼지 속 숨소리
  }
  // 칼 부딪침 '챙'·'캉' — 쇠붙이의 비조화 배음(1 : 2.76 : 5.40 : 8.93) + 날카로운 첫소리
  function clang(t, gain, bright) {
    const base = (bright ? 1250 : 820) * (0.85 + Math.random() * 0.3);
    [1, 2.76, 5.40, 8.93].forEach((r, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = base * r;
      const d = (bright ? 0.42 : 0.3) / (1 + i * 0.7);
      g.gain.setValueAtTime(gain / (1 + i * 0.8), t);
      g.gain.exponentialRampToValueAtTime(0.0003, t + d);
      o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + d + 0.02);
    });
    noiseBand(t, 0.06, gain * 1.1, 4200, 2500, 0.7, 0.002);
  }
  // 화살 한 대 — 높은 바람 소리가 내려온다
  function whoosh(t, gain) { noiseBand(t, 0.32, gain, 3400, 900, 2.2, 0.04); }

  // ── 배경음 ───────────────────────────────────
  const TRACKS = {
    // 전략 — 느리고 비어 있다. 드론 위에 대금 가락.
    field: { bpm: 52, bars: 8, build(t, bar) {
      const beat = 60 / 52;
      if (bar % 2 === 0) drum(t, 0.22, 70);
      const seq = [0, 2, 1, 4, 3, 2, 0, 1];
      const d = seq[bar % seq.length];
      flute(note(d, 0), t + beat * 0.5, beat * 2.2, 0.15);
      pluck(note(d - 2, -1), t, 0.10);
      if (bar % 4 === 2) pluck(note(d + 2, 0), t + beat * 1.5, 0.07);
    } },
    // 전투 — 북이 앞으로 나온다
    battle: { bpm: 96, bars: 8, build(t, bar) {
      const beat = 60 / 96;
      drum(t, 0.34, 84);
      drum(t + beat * 1.5, 0.20, 96);
      drum(t + beat * 2.5, 0.26, 78);
      const seq = [0, 0, 3, 2, 4, 3, 1, 0];
      const d = seq[bar % seq.length];
      pluck(note(d, 0), t, 0.13);
      pluck(note(d + 1, 0), t + beat * 2, 0.10);
      if (bar % 4 === 3) flute(note(d + 4, 0), t + beat, beat * 1.6, 0.12);
    } },
  };

  function play(name) {
    if (!init()) return;
    resume();
    if (cur === name) return;
    stop();
    cur = name;
    const T = TRACKS[name];
    if (!T) return;
    let bar = 0;
    let next = ctx.currentTime + 0.15;
    const barLen = (60 / T.bpm) * 4;
    const tick = () => {
      // 4마디 앞까지 미리 예약해 둔다 — 탭이 뒤로 가도 끊기지 않는다
      while (next < ctx.currentTime + barLen * 3) {
        T.build(next, bar++);
        next += barLen;
      }
    };
    tick();
    timer = setInterval(tick, barLen * 1000);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    cur = null;
  }

  // ── 효과음 ───────────────────────────────────
  function beep(f, dur, type, gain) {
    if (!init()) return;
    resume();
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(gain || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const SFX = {
    click:   () => beep(note(2, 0), 0.07, 'triangle', 0.06),
    ok:      () => { beep(note(0, 0), 0.10, 'triangle', 0.10); setTimeout(() => beep(note(3, 0), 0.16, 'triangle', 0.09), 70); },
    no:      () => beep(110, 0.16, 'square', 0.07),
    hit:     () => { if (!init()) return; resume(); noise(ctx.currentTime, 0.16, 0.28, 900); beep(150, 0.12, 'square', 0.09); },
    arrow:   () => { if (!init()) return; resume(); noise(ctx.currentTime, 0.10, 0.16, 2600); },
    fire:    () => { if (!init()) return; resume(); noise(ctx.currentTime, 0.55, 0.22, 350); },
    duel:    () => { beep(note(4, 1), 0.09, 'sawtooth', 0.10); setTimeout(() => beep(note(2, 1), 0.14, 'sawtooth', 0.09), 80); },
    capture: () => { if (!init()) return; resume(); const t = ctx.currentTime;
                     drum(t, 0.42, 70); drum(t + 0.28, 0.36, 82);
                     [0, 2, 4].forEach((d, i) => flute(note(d, 0), t + 0.15 + i * 0.22, 0.9, 0.17)); },
    lose:    () => { [4, 2, 0].forEach((d, i) => setTimeout(() => beep(note(d, -1), 0.35, 'triangle', 0.10), i * 190)); },
    event:   () => { if (!init()) return; resume(); const t = ctx.currentTime;
                     drum(t, 0.30, 64); flute(note(1, 0), t + 0.1, 1.3, 0.16); },
    month:   () => beep(note(0, -1), 0.28, 'sine', 0.07),
    // 위임 전투 연출
    warcry:  () => { if (!init()) return; resume(); const t = ctx.currentTime;
                     shout(t, 1.9, 10); drum(t, 0.40, 66); drum(t + 0.45, 0.32, 74); },
    clang:   () => { if (!init()) return; resume(); const t = ctx.currentTime;
                     clang(t, 0.20, Math.random() < 0.5);
                     if (Math.random() < 0.55) clang(t + 0.11, 0.14, true); },     // 챙챙 · 캉캉
    volley:  () => { if (!init()) return; resume(); const t = ctx.currentTime;
                     for (let i = 0; i < 6; i++) whoosh(t + i * 0.045 + Math.random() * 0.03, 0.05); },
    thud:    () => { if (!init()) return; resume(); const t = ctx.currentTime;
                     drum(t, 0.42, 58); drum(t + 0.16, 0.30, 64); },
  };
  function sfx(name) { const f = SFX[name]; if (f) { try { f(); } catch (e) { /* 소리는 게임을 막지 않는다 */ } } }

  function toggle() {
    if (!init()) return on;
    on = !on;
    master.gain.value = on ? 0.5 : 0;
    try { localStorage.setItem('samhan_mute', on ? '0' : '1'); } catch (e) { /* 시크릿 */ }
    if (on) resume();
    return on;
  }
  function muted() { return !on; }

  return { init, play, stop, sfx, toggle, muted, resume, get track() { return cur; } };
})();
