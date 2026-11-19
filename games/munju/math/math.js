/* ============================================================
   문주의 수학 방탈출 — 초등 6학년 수학 (menewsoft.com AI 인디게임)

   여섯 개의 방. 방마다 자물쇠 세 개가 걸려 있고, 자물쇠 하나가 문제 하나다.
   세 개를 다 풀면 문이 열린다.

   ★설계에서 뒤집지 말 것
   1. **틀려도 잃는 것이 없다.** 목숨·시간 제한이 아예 없다(변수 자체가 없다).
      틀리면 왜 틀렸는지 짚어 주고 다시 풀면 된다.
   2. **힌트는 세 단계로 나누고, 봐도 벌하지 않는다.** ①무엇을 묻는지 ②어떤 식을 세우는지
      ③첫 계산까지. 답은 마지막까지 말하지 않는다 — 답을 주면 풀 기회가 사라진다.
   3. **문제는 규칙으로 그 자리에서 만든다.** 미리 적어 둔 문제를 돌려쓰면 두 번째 판부터
      외운 답을 넣게 된다. 대신 생성기가 정답을 함께 계산하고, 자가검증이 500번 검산한다.
   4. **답은 딱 떨어져야 한다.** 6학년에게 3.333…을 입력하게 하면 게임이 아니라 반올림 시험이 된다.
      생성기는 나누어떨어지는 수만 고른다.

   자가검증: `?test=sim`
   ============================================================ */
(function () {
'use strict';

/* ---------- 도구 ---------- */
function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
function reduce(n, d) { var g = gcd(n, d) || 1; return { n: n / g, d: d / g }; }
function round2(x) { return Math.round(x * 100) / 100; }
function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function frac(n, d) { return '<span class="frac"><b>' + n + '</b><i>' + d + '</i></span>'; }

/* ---------- 문제 생성기 ----------
   반환: { text(HTML), ansType:'int'|'dec'|'frac', ans, unit, hints:[3], why }
     · ans 는 int/dec 면 숫자, frac 이면 {n,d}(기약분수)
     · why 는 틀렸을 때 짚어 줄 한 줄(답은 담지 않는다) */
var GEN = {
  /* 1. 분수의 나눗셈 */
  fracdiv: function () {
    var kind = pick(['frac', 'frac', 'nat']);
    if (kind === 'nat') {
      var n0 = ri(2, 9), b = ri(2, 9), a = ri(1, b - 1);
      var r0 = reduce(n0 * b, a);
      return {
        text: '자연수를 분수로 나눕니다.<br>' + n0 + ' ÷ ' + frac(a, b) + ' = ?',
        ansType: 'frac', ans: r0,
        hints: ['나눗셈은 나누는 수의 <b>역수를 곱하는 것</b>과 같아요.',
                '식을 바꿔 쓰면 ' + n0 + ' × ' + frac(b, a) + ' 예요.',
                '분자는 ' + n0 + '×' + b + ', 분모는 ' + a + '. 마지막에 <b>약분</b>하는 걸 잊지 마세요.'],
        why: '나누는 분수를 뒤집어 곱했는지, 약분을 끝까지 했는지 확인해 보세요.',
      };
    }
    var b1 = ri(2, 9), a1 = ri(1, b1 - 1), b2 = ri(2, 9), a2 = ri(1, b2 - 1);
    var r = reduce(a1 * b2, b1 * a2);
    return {
      text: '분수끼리의 나눗셈입니다.<br>' + frac(a1, b1) + ' ÷ ' + frac(a2, b2) + ' = ?',
      ansType: 'frac', ans: r,
      hints: ['÷ 를 × 로 바꾸고 <b>뒤의 분수를 뒤집어요</b>(역수).',
              '식은 ' + frac(a1, b1) + ' × ' + frac(b2, a2) + ' 가 돼요.',
              '분자끼리 ' + a1 + '×' + b2 + ', 분모끼리 ' + b1 + '×' + a2 + '. 그 다음 약분!'],
      why: '뒤의 분수만 뒤집어야 해요. 앞의 분수는 그대로예요.',
    };
  },

  /* 2. 소수의 나눗셈 — 반드시 나누어떨어지게 만든다 */
  decdiv: function () {
    var q = ri(2, 24) / (pick([1, 1, 2]) === 1 ? 1 : 2);      // 몫: 정수 또는 .5
    var dv = ri(2, 45) / 10;                                   // 나누는 수: 소수 한 자리
    if (dv < 0.3) dv = 0.6;
    var dividend = round2(q * dv);
    if (Math.abs(dividend * 100 - Math.round(dividend * 100)) > 1e-9) dividend = round2(dividend);
    var exact = round2(dividend / dv);
    return {
      text: '소수의 나눗셈입니다.<br>' + dividend + ' ÷ ' + dv + ' = ?',
      ansType: 'dec', ans: exact,
      hints: ['나누는 수의 소수점을 <b>오른쪽으로 옮겨 자연수</b>로 만들어요.',
              '나누는 수를 10배 하면 나누어지는 수도 <b>똑같이 10배</b> 해야 몫이 그대로예요.',
              '즉 ' + round2(dividend * 10) + ' ÷ ' + round2(dv * 10) + ' 를 계산하면 돼요.'],
      why: '두 수를 같은 배수만큼 키웠는지 확인해 보세요. 한쪽만 키우면 몫이 달라져요.',
    };
  },

  /* 3. 비와 비율 · 비례식 */
  ratio: function () {
    var kind = pick(['prop', 'percent', 'share']);
    if (kind === 'prop') {
      var a = ri(2, 12), b = ri(2, 12), k = ri(2, 9);
      return {
        text: '비례식의 빈칸을 채우세요.<br>' + a + ' : ' + b + ' = ' + (a * k) + ' : <b>□</b>',
        ansType: 'int', ans: b * k,
        hints: ['비례식은 <b>외항의 곱 = 내항의 곱</b> 이에요.',
                a + ' × □ = ' + b + ' × ' + (a * k) + ' 로 놓을 수 있어요.',
                '앞의 비가 ' + a + ' → ' + (a * k) + ' 로 <b>' + k + '배</b>가 됐으니, 뒤도 같은 배수예요.'],
        why: '앞이 몇 배가 되었는지 보고, 뒤에도 같은 배를 하면 돼요.',
      };
    }
    if (kind === 'percent') {
      var whole = pick([20, 25, 40, 50, 80, 200, 250]);
      var pct = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]);
      var part = whole * pct / 100;
      if (Math.abs(part - Math.round(part)) > 1e-9) { whole = 200; part = whole * pct / 100; }
      return {
        text: '전체 ' + comma(whole) + ' 중에서 ' + comma(part) + ' 는 몇 %일까요?',
        ansType: 'int', ans: pct, unit: '%',
        hints: ['비율은 <b>비교하는 양 ÷ 기준량</b> 이에요.',
                part + ' ÷ ' + whole + ' 를 계산하면 비율(소수)이 나와요.',
                '거기에 <b>100을 곱하면</b> 백분율(%)이 돼요.'],
        why: '기준량(전체)으로 나누어야 해요. 순서가 바뀌지 않았는지 보세요.',
      };
    }
    var total = pick([1000, 1200, 1500, 2000, 2400, 3000, 3600]);
    var r1 = ri(1, 5), r2 = ri(1, 5);
    while ((r1 + r2) === 0 || total % (r1 + r2) !== 0) { r1 = ri(1, 5); r2 = ri(1, 5); }
    return {
      text: '사탕 ' + comma(total) + '개를 ' + r1 + ' : ' + r2 + ' 로 나눕니다.<br>' +
            '<b>' + r1 + '</b> 쪽은 몇 개일까요?',
      ansType: 'int', ans: total / (r1 + r2) * r1, unit: '개',
      hints: ['비례배분은 전체를 <b>' + (r1 + r2) + '묶음</b>으로 본다는 뜻이에요.',
              '한 묶음은 ' + comma(total) + ' ÷ ' + (r1 + r2) + ' 예요.',
              '그 한 묶음을 <b>' + r1 + '배</b> 하면 답이에요.'],
      why: '전체를 두 수의 <b>합</b>으로 나눠야 해요(' + r1 + '이나 ' + r2 + '로 나누는 게 아니에요).',
    };
  },

  /* 4. 원의 둘레와 넓이 (원주율 3.14) */
  circle: function () {
    var r = ri(2, 12), kind = pick(['area', 'round', 'half']);
    if (kind === 'area') {
      return {
        text: '반지름이 ' + r + ' cm 인 원의 <b>넓이</b>는? (원주율 3.14)',
        ansType: 'dec', ans: round2(3.14 * r * r), unit: 'cm²',
        hints: ['원의 넓이 = <b>반지름 × 반지름 × 원주율</b> 이에요.',
                r + ' × ' + r + ' × 3.14 를 계산해요.',
                r + ' × ' + r + ' = ' + (r * r) + ' 이고, 여기에 3.14를 곱해요.'],
        why: '지름이 아니라 <b>반지름</b>을 두 번 곱해야 해요.',
      };
    }
    if (kind === 'round') {
      return {
        text: '반지름이 ' + r + ' cm 인 원의 <b>둘레</b>는? (원주율 3.14)',
        ansType: 'dec', ans: round2(2 * 3.14 * r), unit: 'cm',
        hints: ['원의 둘레(원주) = <b>지름 × 원주율</b> 이에요.',
                '지름은 반지름의 두 배니까 ' + (2 * r) + ' cm 예요.',
                (2 * r) + ' × 3.14 를 계산하면 돼요.'],
        why: '반지름이 아니라 <b>지름</b>에 3.14를 곱해요.',
      };
    }
    return {
      text: '반지름이 ' + r + ' cm 인 <b>반원</b>의 넓이는? (원주율 3.14)',
      ansType: 'dec', ans: round2(3.14 * r * r / 2), unit: 'cm²',
      hints: ['먼저 <b>온전한 원</b>의 넓이를 구해요.',
              r + ' × ' + r + ' × 3.14 가 원 전체의 넓이예요.',
              '반원이니까 그 값을 <b>2로 나눠요</b>.'],
      why: '원 넓이를 구한 다음 2로 나누는 순서예요.',
    };
  },

  /* 5. 부피와 겉넓이 */
  volume: function () {
    var kind = pick(['box', 'surface', 'cyl']);
    if (kind === 'box') {
      var a = ri(2, 12), b = ri(2, 12), c = ri(2, 12);
      return {
        text: '가로 ' + a + ' cm, 세로 ' + b + ' cm, 높이 ' + c + ' cm 인 직육면체의 <b>부피</b>는?',
        ansType: 'int', ans: a * b * c, unit: 'cm³',
        hints: ['직육면체의 부피 = <b>가로 × 세로 × 높이</b> 예요.',
                a + ' × ' + b + ' × ' + c + ' 를 계산해요.',
                a + ' × ' + b + ' = ' + (a * b) + ' 이고, 여기에 ' + c + ' 를 곱해요.'],
        why: '세 변을 모두 곱해야 해요. 두 개만 곱하면 넓이가 돼요.',
      };
    }
    if (kind === 'surface') {
      var d = ri(2, 9), e = ri(2, 9), f = ri(2, 9);
      return {
        text: '가로 ' + d + ' cm, 세로 ' + e + ' cm, 높이 ' + f + ' cm 인 직육면체의 <b>겉넓이</b>는?',
        ansType: 'int', ans: 2 * (d * e + e * f + f * d), unit: 'cm²',
        hints: ['직육면체는 <b>마주 보는 면이 두 개씩</b> 세 쌍이에요.',
                '한 쌍씩 넓이를 구하면 ' + d + '×' + e + ', ' + e + '×' + f + ', ' + f + '×' + d + ' 예요.',
                '세 넓이를 더한 다음 <b>2를 곱하면</b> 겉넓이예요.'],
        why: '여섯 면을 모두 세었는지 보세요. 세 쌍이니까 마지막에 2를 곱해요.',
      };
    }
    var r = ri(2, 8), h = ri(2, 12);
    return {
      text: '밑면의 반지름이 ' + r + ' cm, 높이가 ' + h + ' cm 인 <b>원기둥의 부피</b>는? (원주율 3.14)',
      ansType: 'dec', ans: round2(3.14 * r * r * h), unit: 'cm³',
      hints: ['기둥의 부피 = <b>밑넓이 × 높이</b> 예요.',
              '밑면은 원이니까 밑넓이는 ' + r + ' × ' + r + ' × 3.14 예요.',
              '밑넓이 ' + round2(3.14 * r * r) + ' 에 높이 ' + h + ' 를 곱해요.'],
      why: '밑넓이를 먼저 구하고, 거기에 높이를 곱하는 순서예요.',
    };
  },

  /* 6. 경우의 수와 평균 */
  stat: function () {
    var kind = pick(['avg', 'cases', 'pair']);
    if (kind === 'avg') {
      var n = ri(4, 6), nums = [], sum = 0;
      for (var i = 0; i < n; i++) { var v = ri(60, 100); nums.push(v); sum += v; }
      var fix = sum % n;
      if (fix) { nums[0] += (n - fix); sum += (n - fix); }        // 평균이 딱 떨어지게 맞춘다
      return {
        text: '시험 점수가 ' + nums.join(', ') + ' 입니다.<br><b>평균</b>은?',
        ansType: 'int', ans: sum / n, unit: '점',
        hints: ['평균 = <b>자료의 합 ÷ 자료의 수</b> 예요.',
                '먼저 ' + n + '개 점수를 모두 더해요.',
                '합은 ' + sum + ' 이고, 이것을 ' + n + ' 으로 나눠요.'],
        why: '모두 더한 다음 <b>개수</b>로 나누었는지 확인해 보세요.',
      };
    }
    if (kind === 'cases') {
      var tops = ri(3, 6), bottoms = ri(3, 6);
      return {
        text: '윗옷 ' + tops + ' 벌과 바지 ' + bottoms + ' 벌이 있습니다.<br>' +
              '옷을 한 벌씩 골라 입는 <b>경우의 수</b>는?',
        ansType: 'int', ans: tops * bottoms, unit: '가지',
        hints: ['윗옷 하나를 정할 때마다 바지를 <b>' + bottoms + '가지</b>로 고를 수 있어요.',
                '그런 윗옷이 ' + tops + '벌 있어요.',
                '그래서 ' + tops + ' × ' + bottoms + ' 예요(곱의 법칙).'],
        why: '더하는 게 아니라 <b>곱해요</b>. 각각을 따로 고르니까요.',
      };
    }
    var m = ri(4, 7);
    return {
      text: m + '명 중에서 회장 1명과 부회장 1명을 뽑습니다.<br>' +
            '<b>몇 가지</b> 방법이 있을까요?',
      ansType: 'int', ans: m * (m - 1), unit: '가지',
      hints: ['회장을 먼저 뽑으면 <b>' + m + '가지</b> 예요.',
              '회장이 정해지면 부회장은 남은 사람 중에서 뽑아요.',
              '남은 사람은 ' + (m - 1) + '명이니까 ' + m + ' × ' + (m - 1) + ' 예요.'],
      why: '회장을 뽑고 나면 한 명이 줄어요. 같은 수를 두 번 쓰지 않아요.',
    };
  },
};

/* ---------- 방 ---------- */
var ROOMS = [
  { key: 'fracdiv', name: '분수의 방', desc: '분수의 나눗셈', color: '#4b7fd6', deco: 'water' },
  { key: 'decdiv', name: '소수의 방', desc: '소수의 나눗셈', color: '#3fa88b', deco: 'gear' },
  { key: 'ratio', name: '비율의 방', desc: '비와 비율 · 비례식', color: '#c98f45', deco: 'scale' },
  { key: 'circle', name: '원의 방', desc: '원의 둘레와 넓이', color: '#a86fd0', deco: 'circle' },
  { key: 'volume', name: '입체의 방', desc: '부피와 겉넓이', color: '#d0674f', deco: 'cube' },
  { key: 'stat', name: '자료의 방', desc: '평균과 경우의 수', color: '#4f9d52', deco: 'chart' },
];
var LOCKS = 3;                 // 방마다 자물쇠(문제) 수

/* ---------- 상태 ---------- */
var SAVE_KEY = 'munju_math_v1';
var SAVE = { cleared: {}, solo: 0 };
var G = {
  screen: 'menu',
  room: 0,
  locks: [],                   // [{q, open, tries, hint}]
  cur: 0,
  solvedSolo: 0, solved: 0, wrongs: 0, hintsUsed: 0,
  anim: 0,
  doorOpen: 0,
};

function loadSave() {
  try {
    var d = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    SAVE.cleared = d.cleared || {};
    SAVE.solo = d.solo || 0;
  } catch (e) { SAVE.cleared = {}; }
}
function storeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {}
}

/* ---------- 방 시작 ---------- */
function makeLock(roomKey) {
  var q = GEN[roomKey]();
  return { q: q, open: false, tries: 0, hint: 0 };
}

function startRoom(idx) {
  G.room = idx;
  G.locks = [];
  for (var i = 0; i < LOCKS; i++) G.locks.push(makeLock(ROOMS[idx].key));
  G.cur = 0;
  G.doorOpen = 0;
  G.screen = 'play';
  document.body.classList.add('playing');
  hideScreens();
  renderPuzzle();
}

/* ---------- 답 맞히기 ---------- */
function normNum(s) {
  if (typeof s === 'number') return s;
  s = String(s).replace(/[,\s]/g, '');
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  return parseFloat(s);
}

/** 입력값이 정답인가. 분수는 약분해서 비교하므로 6/8 도 3/4 로 인정한다. */
function checkAnswer(q, input) {
  if (q.ansType === 'frac') {
    var n = normNum(input.n), d = normNum(input.d);
    if (n === null || d === null || d === 0) return false;
    if (!Number.isInteger(n) || !Number.isInteger(d)) return false;
    var r = reduce(n, d);
    return r.n === q.ans.n && r.d === q.ans.d;
  }
  var v = normNum(input.v);
  if (v === null) return false;
  if (q.ansType === 'int') return Math.abs(v - q.ans) < 1e-9;
  return Math.abs(v - q.ans) < 0.005;          // 소수는 소수 둘째 자리까지 맞으면 인정
}

function submit(input) {
  var lock = G.locks[G.cur];
  if (!lock || lock.open) return 'none';
  var ok = checkAnswer(lock.q, input);
  if (ok) {
    lock.open = true;
    G.solved++;
    if (lock.hint === 0) { G.solvedSolo++; SAVE.solo++; storeSave(); }
    G.anim = 0.9;
    var next = G.locks.findIndex(function (l) { return !l.open; });
    if (next < 0) {
      SAVE.cleared[ROOMS[G.room].key] = true;
      storeSave();
      G.doorOpen = 0.01;
    } else {
      G.cur = next;
    }
    return 'right';
  }
  lock.tries++;
  G.wrongs++;
  return 'wrong';
}

function useHint() {
  var lock = G.locks[G.cur];
  if (!lock || lock.open) return null;
  if (lock.hint < lock.q.hints.length) { lock.hint++; G.hintsUsed++; }
  return lock.q.hints.slice(0, lock.hint);
}

function allCleared() { return ROOMS.every(function (r) { return SAVE.cleared[r.key]; }); }

/* ---------- 화면 ---------- */
var cv, cx, VW = 900, VH = 600, DPR = 1;

function $(id) { return document.getElementById(id); }

function fitCanvas() {
  cv = $('room');
  if (!cv) return;
  cx = cv.getContext('2d');
  var w = cv.clientWidth || window.innerWidth;
  var h = cv.clientHeight || window.innerHeight;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
  VW = w; VH = h;
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function draw() {
  if (!cx) return;
  var room = ROOMS[G.room];
  var g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#191d2a'); g.addColorStop(1, '#0f1219');
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);

  // 돌벽
  cx.strokeStyle = 'rgba(255,255,255,.04)'; cx.lineWidth = 1;
  for (var y = 40; y < VH; y += 44) {
    cx.beginPath(); cx.moveTo(0, y); cx.lineTo(VW, y); cx.stroke();
    var off = (Math.floor(y / 44) % 2) * 44;
    for (var x = off; x < VW; x += 88) {
      cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x, y + 44); cx.stroke();
    }
  }

  if (G.screen !== 'play') return;

  // 문
  // ⚠️문제 패널이 화면 아래를 덮는다 — 문과 자물쇠는 그 위에 있어야 보인다.
  var dw = Math.min(220, VW * 0.32), dh = Math.min(280, VH * 0.40);
  var dx = VW / 2 - dw / 2, dy = Math.max(52, VH * 0.14);
  var open = Math.min(1, G.doorOpen);
  cx.fillStyle = '#0a0d14';
  cx.fillRect(dx, dy, dw, dh);
  cx.save();
  cx.translate(dx, dy);
  cx.transform(1 - open * 0.86, 0, 0, 1, 0, 0);      // 문이 열리며 얇아진다
  var dg = cx.createLinearGradient(0, 0, dw, 0);
  dg.addColorStop(0, '#5a4632'); dg.addColorStop(0.5, '#7a6244'); dg.addColorStop(1, '#4b3a29');
  cx.fillStyle = dg;
  cx.fillRect(0, 0, dw, dh);
  cx.strokeStyle = 'rgba(0,0,0,.45)'; cx.lineWidth = 3;
  cx.strokeRect(2, 2, dw - 4, dh - 4);
  cx.restore();

  // 자물쇠 세 개
  var lw = 58, gapx = 22;
  var total = LOCKS * lw + (LOCKS - 1) * gapx;
  for (var i = 0; i < LOCKS; i++) {
    var lx = VW / 2 - total / 2 + i * (lw + gapx);
    var ly = dy + dh * 0.46;
    drawLock(lx, ly, lw, G.locks[i] && G.locks[i].open, i === G.cur, room.color);
  }

  // 방 이름표
  cx.fillStyle = 'rgba(255,255,255,.9)';
  cx.font = '700 20px sans-serif'; cx.textAlign = 'center';
  cx.fillText((G.room + 1) + '. ' + room.name, VW / 2, dy - 26);
  cx.fillStyle = 'rgba(255,255,255,.45)';
  cx.font = '13px sans-serif';
  cx.fillText(room.desc, VW / 2, dy - 6);
  cx.textAlign = 'left';

  // 횃불
  drawTorch(dx - 46, dy + 54, room.color);
  drawTorch(dx + dw + 46, dy + 54, room.color);
}

function drawLock(x, y, w, open, cur, col) {
  var h = w * 1.1;
  cx.save();
  if (open) cx.globalAlpha = 0.42;
  // 고리
  cx.strokeStyle = open ? '#6fd6a8' : '#c9ccd6';
  cx.lineWidth = 6;
  cx.beginPath();
  if (open) cx.arc(x + w * 0.28, y - h * 0.18, w * 0.26, Math.PI * 1.1, Math.PI * 2.1);
  else cx.arc(x + w / 2, y - h * 0.16, w * 0.26, Math.PI, 0);
  cx.stroke();
  // 몸통
  cx.fillStyle = open ? '#2f6b55' : '#b9bdc9';
  roundRect(x, y, w, h * 0.72, 7); cx.fill();
  cx.fillStyle = open ? '#8ff0c4' : '#5a5f6e';
  cx.beginPath(); cx.arc(x + w / 2, y + h * 0.3, w * 0.1, 0, 7); cx.fill();
  if (cur && !open) {
    cx.strokeStyle = col; cx.lineWidth = 3;
    roundRect(x - 6, y - h * 0.42, w + 12, h * 1.18, 10); cx.stroke();
  }
  cx.restore();
}

function drawTorch(x, y, col) {
  cx.fillStyle = '#3b2b1c';
  cx.fillRect(x - 4, y, 8, 52);
  var f = 12 + Math.sin(Date.now() / 140 + x) * 3;
  var g = cx.createRadialGradient(x, y - 6, 2, x, y - 6, f * 2.4);
  g.addColorStop(0, 'rgba(255,220,140,.95)');
  g.addColorStop(0.4, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  cx.fillStyle = g;
  cx.beginPath(); cx.arc(x, y - 6, f * 2.2, 0, 7); cx.fill();
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

/* ---------- 문제 패널(DOM) ---------- */
function renderPuzzle() {
  var lock = G.locks[G.cur];
  var panel = $('puzzle');
  if (!panel) return;
  if (!lock || G.doorOpen > 0) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  $('pRoom').textContent = (G.room + 1) + '/' + ROOMS.length + ' · ' + ROOMS[G.room].name +
    ' · 자물쇠 ' + (G.cur + 1) + '/' + LOCKS;
  $('pText').innerHTML = lock.q.text;
  $('pHint').innerHTML = lock.q.hints.slice(0, lock.hint)
    .map(function (h, i) { return '<div class="hintline"><b>힌트 ' + (i + 1) + '</b> ' + h + '</div>'; })
    .join('');
  $('pMsg').innerHTML = '';
  var inp = $('pInput');
  inp.innerHTML = '';
  if (lock.q.ansType === 'frac') {
    inp.innerHTML =
      '<div class="fracin"><input id="ansN" inputmode="numeric" autocomplete="off" aria-label="분자">' +
      '<span class="bar"></span>' +
      '<input id="ansD" inputmode="numeric" autocomplete="off" aria-label="분모"></div>' +
      '<span class="unit">기약분수로</span>';
  } else {
    inp.innerHTML = '<input id="ansV" inputmode="decimal" autocomplete="off" aria-label="답">' +
      '<span class="unit">' + (lock.q.unit || '') + '</span>';
  }
  bindInputs();
  var first = $('ansN') || $('ansV');
  if (first && !window.__SIMMODE) first.focus();
}

function readInput() {
  if ($('ansN')) return { n: $('ansN').value, d: $('ansD').value };
  return { v: $('ansV') ? $('ansV').value : '' };
}

function bindInputs() {
  ['ansN', 'ansD', 'ansV'].forEach(function (id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); onSubmit(); }
    });
  });
}

function onSubmit() {
  var lock = G.locks[G.cur];
  if (!lock) return;
  var r = submit(readInput());
  if (r === 'right') {
    if (G.doorOpen > 0) {
      $('puzzle').style.display = 'none';
      setTimeout(showRoomClear, 900);
    } else {
      $('pMsg').innerHTML = '<span class="ok">딸깍 — 자물쇠가 열렸어요!</span>';
      setTimeout(renderPuzzle, 700);
    }
  } else if (r === 'wrong') {
    $('pMsg').innerHTML = '<span class="no">다시 생각해 볼까요? ' + lock.q.why + '</span>';
    if (lock.hint === 0) { useHint(); renderHintOnly(); }
  }
}

function renderHintOnly() {
  var lock = G.locks[G.cur];
  $('pHint').innerHTML = lock.q.hints.slice(0, lock.hint)
    .map(function (h, i) { return '<div class="hintline"><b>힌트 ' + (i + 1) + '</b> ' + h + '</div>'; })
    .join('');
}

function showRoomClear() {
  G.screen = 'clear';
  document.body.classList.remove('playing');
  var last = G.room >= ROOMS.length - 1;
  $('cT').textContent = last && allCleared() ? '🎉 모든 방을 빠져나왔어요!' : '🔓 문이 열렸어요!';
  $('cStats').innerHTML =
    '<b>' + ROOMS[G.room].name + '</b> — ' + ROOMS[G.room].desc + '<br>' +
    '푼 문제 ' + G.solved + ' · 혼자 푼 문제 ' + G.solvedSolo + ' · 다시 푼 횟수 ' + G.wrongs;
  $('nextBtn').style.display = last ? 'none' : '';
  showScreen('clear');
}

/* ---------- 메뉴 ---------- */
function buildRoomList() {
  var box = $('roomList');
  if (!box) return;
  box.innerHTML = '';
  ROOMS.forEach(function (r, i) {
    var b = document.createElement('button');
    b.className = 'roombtn' + (SAVE.cleared[r.key] ? ' done' : '');
    b.innerHTML = '<span class="no">' + (i + 1) + '</span>' +
      '<span class="nm">' + r.name + '</span>' +
      '<span class="de">' + r.desc + '</span>' +
      '<span class="st">' + (SAVE.cleared[r.key] ? '✅ 빠져나옴' : '자물쇠 3개') + '</span>';
    b.addEventListener('click', function () { startRoom(i); });
    box.appendChild(b);
  });
  if ($('soloCount')) $('soloCount').textContent = SAVE.solo;
}

function hideScreens() {
  ['menu', 'clear'].forEach(function (id) { if ($(id)) $(id).style.display = 'none'; });
}
function showScreen(id) {
  hideScreens();
  if ($(id)) $(id).style.display = 'flex';
  if ($('puzzle')) $('puzzle').style.display = 'none';
}
function toMenu() {
  G.screen = 'menu';
  document.body.classList.remove('playing');
  buildRoomList();
  showScreen('menu');
}

/* ---------- 루프 ---------- */
function frame() {
  if (G.doorOpen > 0 && G.doorOpen < 1) G.doorOpen = Math.min(1, G.doorOpen + 0.03);
  draw();
  requestAnimationFrame(frame);
}

function boot() {
  loadSave();
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  buildRoomList();
  showScreen('menu');
  if ($('okBtn')) $('okBtn').addEventListener('click', onSubmit);
  if ($('hintBtn')) $('hintBtn').addEventListener('click', function () { useHint(); renderHintOnly(); });
  if ($('quitBtn')) $('quitBtn').addEventListener('click', toMenu);
  if ($('nextBtn')) $('nextBtn').addEventListener('click', function () {
    startRoom(Math.min(ROOMS.length - 1, G.room + 1));
  });
  if ($('againBtn')) $('againBtn').addEventListener('click', function () { startRoom(G.room); });
  if ($('menuBtn')) $('menuBtn').addEventListener('click', toMenu);
  if ($('startBtn')) $('startBtn').addEventListener('click', function () {
    var next = ROOMS.findIndex(function (r) { return !SAVE.cleared[r.key]; });
    startRoom(next < 0 ? 0 : next);
  });
  requestAnimationFrame(frame);
  if (/[?&]test=sim/.test(location.search)) runSim();
}

/* ============================================================
   자가검증 (?test=sim)
   ⚠️생성기가 만든 정답을 **그 생성기로 다시 검산하면 아무것도 검증되지 않는다.**
     그래서 문제 문장에 적힌 숫자를 도로 읽어 내 독립적으로 계산해 본다.
   ============================================================ */
function runSim() {
  window.__SIMMODE = true;
  var fails = [], n = 0;
  function ck(ok, what) { n++; if (!ok) fails.push(what); }

  function plain(html) {
    return String(html).replace(/<span class="frac"><b>(\d+)<\/b><i>(\d+)<\/i><\/span>/g, '$1/$2')
      .replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/,/g, '');
  }

  // 1) 생성기 — 각 방 500문제
  Object.keys(GEN).forEach(function (key) {
    var seen = {}, bad = 0, badAns = 0, noHint = 0, weird = 0;
    for (var i = 0; i < 500; i++) {
      var q = GEN[key]();
      var t = plain(q.text);
      seen[t] = 1;
      if (!q.hints || q.hints.length !== 3) noHint++;
      if (!q.why) noHint++;
      if (q.ansType === 'frac') {
        if (!q.ans || !Number.isInteger(q.ans.n) || !Number.isInteger(q.ans.d) || q.ans.d <= 0) badAns++;
        else if (gcd(q.ans.n, q.ans.d) !== 1) badAns++;              // 기약분수인가
        if (q.ans && q.ans.n <= 0) badAns++;
      } else {
        if (typeof q.ans !== 'number' || !isFinite(q.ans) || q.ans <= 0) badAns++;
        if (q.ansType === 'int' && !Number.isInteger(q.ans)) badAns++;
        // 소수 답은 소수 둘째 자리 안에서 딱 떨어져야 한다(3.333… 을 입력하게 하지 않는다)
        if (q.ansType === 'dec' && Math.abs(q.ans * 100 - Math.round(q.ans * 100)) > 1e-9) weird++;
      }
      // ★문장에 적힌 수로 독립 검산
      var nums = (t.match(/\d+(\.\d+)?/g) || []).map(Number);
      if (key === 'circle') {
        var r = nums[0];
        var cand = [round2(3.14 * r * r), round2(2 * 3.14 * r), round2(3.14 * r * r / 2)];
        if (cand.every(function (c) { return Math.abs(c - q.ans) > 1e-6; })) bad++;
      } else if (key === 'volume') {
        if (/직육면체의 부피/.test(t)) {
          if (nums[0] * nums[1] * nums[2] !== q.ans) bad++;
        } else if (/겉넓이/.test(t)) {
          var a = nums[0], b = nums[1], c = nums[2];
          if (2 * (a * b + b * c + c * a) !== q.ans) bad++;
        } else {
          if (Math.abs(round2(3.14 * nums[0] * nums[0] * nums[1]) - q.ans) > 1e-6) bad++;
        }
      } else if (key === 'decdiv') {
        if (Math.abs(nums[0] / nums[1] - q.ans) > 1e-6) bad++;
      } else if (key === 'fracdiv') {
        var f = t.match(/(\d+)\/(\d+)/g) || [];
        if (f.length === 2) {
          var p1 = f[0].split('/').map(Number), p2 = f[1].split('/').map(Number);
          var rr = reduce(p1[0] * p2[1], p1[1] * p2[0]);
          if (rr.n !== q.ans.n || rr.d !== q.ans.d) bad++;
        } else if (f.length === 1) {
          var nat = nums[0], p3 = f[0].split('/').map(Number);
          var r2 = reduce(nat * p3[1], p3[0]);
          if (r2.n !== q.ans.n || r2.d !== q.ans.d) bad++;
        } else bad++;
      } else if (key === 'stat') {
        if (/평균/.test(t)) {
          var arr = nums.slice(0, nums.length);
          var sum = arr.reduce(function (s, v) { return s + v; }, 0);
          if (Math.abs(sum / arr.length - q.ans) > 1e-9) bad++;
        } else if (/경우의 수/.test(t)) {
          if (nums[0] * nums[1] !== q.ans) bad++;
        } else {
          if (nums[0] * (nums[0] - 1) !== q.ans) bad++;
        }
      } else if (key === 'ratio') {
        if (/비례식/.test(t)) {
          if (nums[0] * q.ans !== nums[1] * nums[2]) bad++;          // 외항의 곱 = 내항의 곱
        } else if (/%/.test(t)) {
          if (Math.abs(nums[1] / nums[0] * 100 - q.ans) > 1e-9) bad++;
        } else {
          if (Math.abs(nums[0] / (nums[1] + nums[2]) * nums[1] - q.ans) > 1e-9) bad++;
        }
      }
    }
    ck(bad === 0, key + ': 문장과 정답이 안 맞는 문제 ' + bad + '개/500');
    ck(badAns === 0, key + ': 정답 형식이 이상한 문제 ' + badAns + '개/500');
    ck(weird === 0, key + ': 딱 떨어지지 않는 소수 답 ' + weird + '개/500');
    ck(noHint === 0, key + ': 힌트 3단계나 설명이 없는 문제 ' + noHint + '개');
    ck(Object.keys(seen).length >= 25, key + ': 500번 돌렸는데 문제가 ' +
       Object.keys(seen).length + '가지뿐(같은 문제만 나온다)');
  });

  // 2) 답 맞히기 — 분수는 약분 안 한 답도 인정, 빈칸·글자는 오답
  {
    var q1 = { ansType: 'frac', ans: { n: 3, d: 4 } };
    ck(checkAnswer(q1, { n: '3', d: '4' }), '기약분수 정답을 못 알아본다');
    ck(checkAnswer(q1, { n: '6', d: '8' }), '약분 안 한 정답을 인정하지 않는다');
    ck(!checkAnswer(q1, { n: '4', d: '3' }), '뒤집힌 답을 정답으로 본다');
    ck(!checkAnswer(q1, { n: '', d: '4' }), '빈칸을 정답으로 본다');
    ck(!checkAnswer(q1, { n: '삼', d: '4' }), '글자를 정답으로 본다');
    ck(!checkAnswer(q1, { n: '3', d: '0' }), '분모 0을 정답으로 본다');
    var q2 = { ansType: 'dec', ans: 12.56 };
    ck(checkAnswer(q2, { v: '12.56' }), '소수 정답을 못 알아본다');
    ck(!checkAnswer(q2, { v: '12.6' }), '반올림한 값을 정답으로 본다');
    var q3 = { ansType: 'int', ans: 240 };
    ck(checkAnswer(q3, { v: '240' }), '정수 정답을 못 알아본다');
    ck(checkAnswer(q3, { v: '240 ' }), '뒤에 공백이 있으면 못 알아본다');
    ck(!checkAnswer(q3, { v: '24' }), '틀린 수를 정답으로 본다');
  }

  // 3) 방 진행 — 세 자물쇠를 풀면 문이 열린다. 틀려도 잃는 것이 없다
  {
    localStorage.removeItem(SAVE_KEY);
    loadSave();
    startRoom(0);
    ck(G.locks.length === LOCKS, '자물쇠가 ' + G.locks.length + '개다');
    var before = JSON.stringify({ solved: G.solved, locks: G.locks.length });
    submit({ v: '-99999', n: '-99999', d: '7' });
    ck(G.locks[0].open === false, '틀렸는데 자물쇠가 열렸다');
    ck(G.wrongs === 1 && G.solved === 0, '틀린 횟수만 세어져야 한다');
    ck(JSON.stringify({ solved: G.solved, locks: G.locks.length }) === before,
       '틀렸는데 무언가 줄어들었다(목숨·시간이 있으면 안 된다)');
    ck(!('lives' in G) && !('time' in G), '상태에 목숨이나 시간이 있다');
    // 정답으로 세 개 다 풀기
    for (var s = 0; s < LOCKS; s++) {
      var lk = G.locks[G.cur];
      var inp = lk.q.ansType === 'frac' ? { n: lk.q.ans.n, d: lk.q.ans.d } : { v: lk.q.ans };
      ck(submit(inp) === 'right', (s + 1) + '번째 자물쇠: 정답인데 안 열린다');
    }
    ck(G.locks.every(function (l) { return l.open; }), '세 개를 다 풀었는데 안 열린 자물쇠가 있다');
    ck(G.doorOpen > 0, '자물쇠를 다 풀었는데 문이 안 열린다');
    ck(SAVE.cleared[ROOMS[0].key] === true, '방을 나왔는데 기록이 저장되지 않았다');
  }

  // 4) 여섯 방 전부 자동으로 통과
  {
    localStorage.removeItem(SAVE_KEY); loadSave();
    for (var r2 = 0; r2 < ROOMS.length; r2++) {
      startRoom(r2);
      var guard = 0;
      while (G.locks.some(function (l) { return !l.open; }) && guard++ < 50) {
        var lk2 = G.locks[G.cur];
        submit(lk2.q.ansType === 'frac' ? { n: lk2.q.ans.n, d: lk2.q.ans.d } : { v: lk2.q.ans });
      }
      ck(G.locks.every(function (l) { return l.open; }), ROOMS[r2].name + ': 자동 풀이로 못 나갔다');
    }
    ck(allCleared(), '여섯 방을 다 나왔는데 완주로 안 쳐진다');
  }

  // 5) 힌트 — 세 단계까지만 열리고, 답은 힌트에 없다
  {
    startRoom(0);
    var lk3 = G.locks[G.cur];
    var h1 = useHint(); ck(h1.length === 1, '힌트가 한 단계씩 열리지 않는다');
    useHint(); useHint(); var h4 = useHint();
    ck(h4.length === 3, '힌트가 3단계를 넘어간다: ' + h4.length);
    var joined = plain(lk3.q.hints.join(' '));
    var answer = lk3.q.ansType === 'frac' ? (lk3.q.ans.n + '/' + lk3.q.ans.d) : String(lk3.q.ans);
    ck(joined.indexOf(answer) < 0 || lk3.q.ansType === 'frac',
       '힌트에 답이 그대로 적혀 있다(' + answer + ')');
  }

  // 6) 화면 — 문제 패널이 화면 밖으로 나가지 않는가
  {
    startRoom(2);
    renderPuzzle();
    var p = $('puzzle').getBoundingClientRect();
    ck(p.left >= -1 && p.right <= window.innerWidth + 1,
       '문제 패널이 화면 밖으로 나간다 (' + Math.round(p.left) + '~' + Math.round(p.right) + ')');
    ck(p.top >= -1, '문제 패널 위쪽이 잘렸다');
    ck(p.height > 80, '문제 패널이 안 그려졌다');
    var inpEl = $('ansV') || $('ansN');
    ck(!!inpEl, '입력칸이 없다');
    var ir = inpEl.getBoundingClientRect();
    ck(ir.width > 30 && ir.right <= window.innerWidth + 1, '입력칸이 화면 밖이거나 너무 좁다');
  }

  // 7) 진짜로 눌러서 푸는 경로(확인 단추 → 자물쇠 열림)
  {
    startRoom(1);
    renderPuzzle();
    var lk4 = G.locks[G.cur];
    if (lk4.q.ansType === 'frac') { $('ansN').value = lk4.q.ans.n; $('ansD').value = lk4.q.ans.d; }
    else $('ansV').value = lk4.q.ans;
    $('okBtn').click();
    ck(lk4.open === true, '확인 단추를 눌렀는데 자물쇠가 안 열린다');
  }

  // 8) 이어하기 — 나온 방은 기억된다
  {
    localStorage.removeItem(SAVE_KEY); loadSave();
    SAVE.cleared['circle'] = true; SAVE.solo = 7; storeSave();
    SAVE.cleared = {}; SAVE.solo = 0;
    loadSave();
    ck(SAVE.cleared['circle'] === true && SAVE.solo === 7, '진도가 저장되지 않는다');
    localStorage.removeItem(SAVE_KEY); loadSave();
  }

  var out = document.createElement('div');
  out.id = 'simout';
  out.textContent = fails.length
    ? 'SIM FAIL (' + fails.length + '/' + n + ')\n' + fails.join('\n')
    : 'SIM PASS — 방 ' + ROOMS.length + '개 · 생성기 ' + Object.keys(GEN).length +
      '종 × 500문제 · 검사 ' + n + '개 통과';
  out.style.cssText = 'position:fixed;left:0;top:0;z-index:99;color:#fff;font:12px monospace;white-space:pre;background:#000a;padding:6px';
  document.body.appendChild(out);
  document.title = fails.length ? 'SIM FAIL' : 'SIM PASS';
  toMenu();
}

window.__math = { GEN: GEN, ROOMS: ROOMS, G: G, submit: submit, check: checkAnswer };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
