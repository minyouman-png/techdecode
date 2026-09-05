/* ============================================================
   문주의 한국사 탐험 — 초등 6학년 사회 (menewsoft.com AI 인디게임)

   시간의 길을 따라 여덟 정거장. 정거장마다 두 가지를 한다.
     ① 사건 카드 4장을 **시간 순서대로** 짚기   ② 3지선다 3문제

   ★설계에서 뒤집지 말 것
   1. **틀려도 잃는 것이 없다.** 목숨도 시간도 없다. 순서를 잘못 짚으면 "그건 더 뒤의 일이야"
      하고 알려 주고, 문제를 틀리면 왜 그런지 말해 준 다음 다시 고르게 한다.
   2. **순서 맞히기가 먼저다.** 6학년 역사는 사건을 외우는 것이 아니라 **흐름을 잇는** 공부다.
      연표를 손으로 세우고 나서 문제를 푼다.
   3. **연도(year)가 곧 정답이다.** 정답 순서를 따로 적어 두지 않는다 — 데이터가 어긋날 자리를
      아예 만들지 않는다. 자가검증이 연도의 중복·범위를 본다.
   4. **틀린 뒤에 바로 답을 주지 않는다.** 왜 그런지(why)만 알려 주고 다시 고르게 한다.

   자가검증: `?test=sim`
   ============================================================ */
(function () {
'use strict';

var ERAS = window.ERAS || [];
var QUIZ_PER_ERA = 3;

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function sortedByYear(cards) {
  return cards.slice().sort(function (x, y) { return x.year - y.year; });
}

/* ---------- 저장 ---------- */
var SAVE_KEY = 'munju_history_v1';
var SAVE = { cleared: {}, best: {} };
function loadSave() {
  try {
    var d = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    SAVE.cleared = d.cleared || {};
    SAVE.best = d.best || {};
  } catch (e) { SAVE.cleared = {}; SAVE.best = {}; }
}
function storeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {}
}

/* ---------- 상태 ---------- */
var G = {
  screen: 'menu',           // menu | play | clear
  era: 0,
  phase: 'order',           // order | quiz
  deck: [],                 // 섞인 카드
  picked: [],               // 지금까지 바르게 짚은 카드
  quiz: [], qi: 0,
  wrongs: 0, rights: 0, orderMistakes: 0,
};

function startEra(i) {
  G.era = i;
  var era = ERAS[i];
  G.deck = shuffle(era.cards);
  G.picked = [];
  G.quiz = shuffle(era.quiz).slice(0, QUIZ_PER_ERA);
  G.qi = 0;
  G.phase = 'order';
  G.wrongs = 0; G.rights = 0; G.orderMistakes = 0;
  G.screen = 'play';
  document.body.classList.add('playing');
  hideScreens();
  render();
}

/** 카드를 짚었다. 순서가 맞으면 담고, 아니면 알려만 준다(잃는 것 없음). */
function pickCard(card) {
  if (G.phase !== 'order') return 'none';
  if (G.picked.indexOf(card) >= 0) return 'already';
  var want = sortedByYear(ERAS[G.era].cards)[G.picked.length];
  if (want !== card) {
    G.orderMistakes++;
    return 'wrong';
  }
  G.picked.push(card);
  if (G.picked.length === ERAS[G.era].cards.length) G.phase = 'quiz';
  return 'right';
}

/** 3지선다. 맞으면 다음 문제로, 틀리면 까닭만 알려 주고 그대로 둔다. */
function answer(idx) {
  if (G.phase !== 'quiz') return 'none';
  var q = G.quiz[G.qi];
  if (!q) return 'none';
  if (idx !== q.a) { G.wrongs++; return 'wrong'; }
  G.rights++;
  G.qi++;
  if (G.qi >= G.quiz.length) {
    var key = ERAS[G.era].key;
    SAVE.cleared[key] = true;
    var b = SAVE.best[key];
    var score = { wrongs: G.wrongs, orderMistakes: G.orderMistakes };
    if (!b || (score.wrongs + score.orderMistakes) < (b.wrongs + b.orderMistakes)) SAVE.best[key] = score;
    storeSave();
    return 'clear';
  }
  return 'right';
}

function allCleared() { return ERAS.every(function (e) { return SAVE.cleared[e.key]; }); }

/* ---------- 화면(DOM) ---------- */
function $(id) { return document.getElementById(id); }

function render() {
  var era = ERAS[G.era];
  if (!$('stage')) return;
  $('stage').style.display = 'block';
  $('sName').textContent = (G.era + 1) + '. ' + era.name;
  $('sSpan').textContent = era.span;
  $('sIntro').textContent = era.intro;
  $('sMsg').innerHTML = '';
  if (G.phase === 'order') renderOrder();
  else renderQuiz();
  drawRoad();
}

function renderOrder() {
  var era = ERAS[G.era];
  $('sStep').textContent = '① 사건을 일어난 순서대로 짚어 보세요 (' + G.picked.length + '/' + era.cards.length + ')';
  $('quizBox').style.display = 'none';
  $('cardBox').style.display = 'grid';
  $('cardBox').innerHTML = '';
  G.deck.forEach(function (c) {
    var done = G.picked.indexOf(c) >= 0;
    var b = document.createElement('button');
    b.className = 'card' + (done ? ' done' : '');
    b.setAttribute('data-t', c.t);
    b.innerHTML = '<span class="ord">' + (done ? (G.picked.indexOf(c) + 1) : '?') + '</span>' +
      '<span class="ct">' + c.t + '</span>' +
      '<span class="cd">' + c.d + '</span>' +
      (done ? '<span class="cy">' + c.year + '년</span>' : '');
    b.addEventListener('click', function () { onPick(c); });
    $('cardBox').appendChild(b);
  });
}

function onPick(c) {
  var r = pickCard(c);
  if (r === 'wrong') {
    $('sMsg').innerHTML = '<span class="no">그 일은 조금 더 뒤에 일어났어요. 가장 먼저 일어난 일부터 찾아볼까요?</span>';
    render();
  } else if (r === 'right') {
    if (G.phase === 'quiz') {
      $('sMsg').innerHTML = '<span class="ok">연표를 완성했어요! 이제 문제를 풀어 볼까요?</span>';
    } else {
      $('sMsg').innerHTML = '<span class="ok">맞아요!</span>';
    }
    render();
  }
}

function renderQuiz() {
  var q = G.quiz[G.qi];
  $('sStep').textContent = '② 문제 ' + (G.qi + 1) + ' / ' + G.quiz.length;
  $('cardBox').style.display = 'none';
  $('quizBox').style.display = 'block';
  if (!q) { $('quizBox').innerHTML = ''; return; }
  $('quizBox').innerHTML = '<div class="qtext">' + q.q + '</div><div class="choices"></div>';
  var box = $('quizBox').querySelector('.choices');
  q.c.forEach(function (text, i) {
    var b = document.createElement('button');
    b.className = 'choice';
    b.textContent = text;
    b.addEventListener('click', function () { onAnswer(i); });
    box.appendChild(b);
  });
}

function onAnswer(i) {
  var q = G.quiz[G.qi];
  var r = answer(i);
  if (r === 'wrong') {
    $('sMsg').innerHTML = '<span class="no">다시 한 번 볼까요? ' + q.why + '</span>';
  } else if (r === 'right') {
    $('sMsg').innerHTML = '<span class="ok">맞아요! ' + q.why + '</span>';
    renderQuiz();
  } else if (r === 'clear') {
    showClear(q);
  }
}

function showClear(lastQ) {
  G.screen = 'clear';
  document.body.classList.remove('playing');
  if ($('stage')) $('stage').style.display = 'none';
  var era = ERAS[G.era];
  $('cT').textContent = allCleared() ? '🎉 시간의 길 끝까지 걸었어요!' : '🚩 ' + era.name + ' 통과!';
  $('cWhy').textContent = lastQ ? lastQ.why : '';
  $('cLine').innerHTML = sortedByYear(era.cards).map(function (c) {
    return '<div class="tl"><b>' + c.year + '</b><span>' + c.t + '</span><i>' + c.d + '</i></div>';
  }).join('');
  $('cStats').textContent = '순서를 다시 짚은 횟수 ' + G.orderMistakes + ' · 문제를 다시 푼 횟수 ' + G.wrongs;
  $('nextBtn').style.display = G.era >= ERAS.length - 1 ? 'none' : '';
  showScreen('clear');
}

/* ---------- 배경: 시간의 길 ---------- */
var cv, cx, VW = 900, VH = 600, DPR = 1;
function fitCanvas() {
  cv = $('road');
  if (!cv) return;
  cx = cv.getContext('2d');
  var w = cv.clientWidth || window.innerWidth, h = cv.clientHeight || window.innerHeight;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
  VW = w; VH = h;
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawRoad();
}

function drawRoad() {
  if (!cx) return;
  var g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#1a1b26'); g.addColorStop(1, '#12131b');
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);

  var y = 64, pad = 56;
  var n = ERAS.length;
  var step = (VW - pad * 2) / Math.max(1, n - 1);
  cx.strokeStyle = 'rgba(255,255,255,.14)'; cx.lineWidth = 2;
  cx.beginPath(); cx.moveTo(pad, y); cx.lineTo(VW - pad, y); cx.stroke();
  for (var i = 0; i < n; i++) {
    var x = pad + i * step;
    var done = !!SAVE.cleared[ERAS[i].key];
    var cur = (G.screen === 'play' && i === G.era);
    cx.fillStyle = cur ? '#e8c766' : done ? '#6fd6a8' : 'rgba(255,255,255,.28)';
    cx.beginPath(); cx.arc(x, y, cur ? 9 : 6, 0, 7); cx.fill();
    if (cur) {
      cx.strokeStyle = 'rgba(232,199,102,.4)'; cx.lineWidth = 3;
      cx.beginPath(); cx.arc(x, y, 15, 0, 7); cx.stroke();
    }
    cx.fillStyle = cur ? '#f0dda0' : 'rgba(255,255,255,.34)';
    cx.font = (cur ? '700 ' : '') + '11px sans-serif';
    // ⚠️가운데 정렬만 하면 양 끝 정거장 이름이 화면 밖으로 잘린다 — 끝은 안쪽으로 붙인다.
    var w = cx.measureText(ERAS[i].name).width;
    var tx = Math.min(VW - 4 - w / 2, Math.max(4 + w / 2, x));
    cx.textAlign = 'center';
    cx.fillText(ERAS[i].name, tx, y + 26);
    cx.textAlign = 'left';
  }
}

/* ---------- 메뉴 ---------- */
function buildEraList() {
  var box = $('eraList');
  if (!box) return;
  box.innerHTML = '';
  ERAS.forEach(function (e, i) {
    var done = !!SAVE.cleared[e.key];
    var b = document.createElement('button');
    b.className = 'erabtn' + (done ? ' done' : '');
    b.innerHTML = '<span class="no">' + (i + 1) + '</span>' +
      '<span class="nm">' + e.name + '</span>' +
      '<span class="sp">' + e.span + '</span>' +
      '<span class="st">' + (done ? '✅ 지나감' : '카드 4 · 문제 ' + QUIZ_PER_ERA) + '</span>';
    b.addEventListener('click', function () { startEra(i); });
    box.appendChild(b);
  });
}

function hideScreens() {
  ['menu', 'clear'].forEach(function (id) { if ($(id)) $(id).style.display = 'none'; });
}
function showScreen(id) {
  hideScreens();
  if ($(id)) $(id).style.display = 'flex';
  if ($('stage')) $('stage').style.display = 'none';
}
function toMenu() {
  G.screen = 'menu';
  document.body.classList.remove('playing');
  buildEraList();
  showScreen('menu');
  drawRoad();
}

function boot() {
  loadSave();
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  buildEraList();
  showScreen('menu');
  if ($('startBtn')) $('startBtn').addEventListener('click', function () {
    var next = ERAS.findIndex(function (e) { return !SAVE.cleared[e.key]; });
    startEra(next < 0 ? 0 : next);
  });
  if ($('quitBtn')) $('quitBtn').addEventListener('click', toMenu);
  if ($('menuBtn')) $('menuBtn').addEventListener('click', toMenu);
  if ($('againBtn')) $('againBtn').addEventListener('click', function () { startEra(G.era); });
  if ($('nextBtn')) $('nextBtn').addEventListener('click', function () {
    startEra(Math.min(ERAS.length - 1, G.era + 1));
  });
  if (/[?&]test=sim/.test(location.search)) runSim();
}

/* ============================================================
   자가검증 (?test=sim)
   ============================================================ */
function runSim() {
  var fails = [], n = 0;
  function ck(ok, what) { n++; if (!ok) fails.push(what); }

  // 1) 문제 은행 — 연도가 곧 정답이므로 연도부터 본다
  ck(ERAS.length >= 8, '정거장이 ' + ERAS.length + '개뿐이다');
  var seenKey = {};
  ERAS.forEach(function (e) {
    ck(!seenKey[e.key], '정거장 key 중복: ' + e.key);
    seenKey[e.key] = 1;
    ck(e.cards.length === 4, e.name + ': 카드가 ' + e.cards.length + '장');
    ck(e.quiz.length >= 5, e.name + ': 문제가 ' + e.quiz.length + '개(3개를 뽑으려면 5개는 있어야 한다)');
    var years = e.cards.map(function (c) { return c.year; });
    ck(new Set(years).size === years.length, e.name + ': 연도가 겹친다 ' + years.join(','));
    years.forEach(function (y) {
      ck(y >= 1500 && y <= 2026, e.name + ': 연도가 범위 밖 ' + y);
    });
    e.cards.forEach(function (c) {
      ck(!!c.t && c.t.length >= 2, e.name + ': 사건 이름이 비었다');
      ck(!!c.d && c.d.length >= 8, e.name + '/' + c.t + ': 설명이 너무 짧다');
    });
    e.quiz.forEach(function (q, qi) {
      ck(!!q.q && q.q.length >= 8, e.name + ' 문제' + qi + ': 문장이 너무 짧다');
      ck(q.c.length === 3, e.name + ' 문제' + qi + ': 보기가 ' + q.c.length + '개');
      ck(new Set(q.c).size === 3, e.name + ' 문제' + qi + ': 보기가 겹친다');
      ck(q.a >= 0 && q.a < q.c.length, e.name + ' 문제' + qi + ': 정답 번호가 보기 밖(' + q.a + ')');
      ck(!!q.why && q.why.length >= 8, e.name + ' 문제' + qi + ': 까닭 설명이 없다');
      q.c.forEach(function (t) { ck(!!t && t.length >= 1, e.name + ' 문제' + qi + ': 빈 보기'); });
    });
  });

  // 2) 시대 순서 — 정거장끼리도 앞뒤가 맞는가(뒤 시대의 첫 사건이 앞 시대 첫 사건보다 늦어야 한다)
  for (var i = 1; i < ERAS.length; i++) {
    var prev = Math.min.apply(null, ERAS[i - 1].cards.map(function (c) { return c.year; }));
    var cur = Math.min.apply(null, ERAS[i].cards.map(function (c) { return c.year; }));
    ck(cur >= prev, ERAS[i].name + ' 이 앞 정거장보다 이르다(' + cur + ' < ' + prev + ')');
  }

  // 3) 순서 맞히기 — 바르게 짚으면 담기고, 틀리면 아무것도 잃지 않는다
  {
    localStorage.removeItem(SAVE_KEY); loadSave();
    startEra(0);
    var sorted = sortedByYear(ERAS[0].cards);
    var wrongCard = sorted[3];
    var before = JSON.stringify(G.picked);
    ck(pickCard(wrongCard) === 'wrong', '순서가 틀린 카드를 받아들였다');
    ck(JSON.stringify(G.picked) === before, '틀렸는데 카드가 담겼다');
    ck(!('lives' in G) && !('time' in G), '상태에 목숨이나 시간이 있다');
    ck(pickCard(sorted[0]) === 'right', '가장 이른 사건을 짚었는데 안 받아 준다');
    ck(pickCard(sorted[0]) === 'already', '같은 카드를 두 번 담는다');
    ck(pickCard(sorted[1]) === 'right' && pickCard(sorted[2]) === 'right', '순서대로 짚는데 막힌다');
    ck(G.phase === 'order', '아직 한 장 남았는데 문제로 넘어갔다');
    ck(pickCard(sorted[3]) === 'right', '마지막 카드를 안 받아 준다');
    ck(G.phase === 'quiz', '카드를 다 짚었는데 문제로 안 넘어간다');
  }

  // 4) 문제 — 맞히면 넘어가고, 틀리면 그 자리에 남는다
  {
    var q0 = G.quiz[0];
    var wrongIdx = (q0.a + 1) % 3;
    ck(answer(wrongIdx) === 'wrong', '오답을 정답으로 받아들였다');
    ck(G.qi === 0, '틀렸는데 다음 문제로 넘어갔다');
    ck(G.rights === 0, '틀렸는데 맞힌 수가 늘었다');
    ck(answer(q0.a) === 'right', '정답인데 안 넘어간다');
    ck(G.qi === 1, '정답인데 문제가 안 바뀐다');
  }

  // 5) 여덟 정거장 자동 통과
  {
    localStorage.removeItem(SAVE_KEY); loadSave();
    for (var e2 = 0; e2 < ERAS.length; e2++) {
      startEra(e2);
      var srt = sortedByYear(ERAS[e2].cards);
      srt.forEach(function (c) { pickCard(c); });
      ck(G.phase === 'quiz', ERAS[e2].name + ': 카드 단계를 못 넘었다');
      var guard = 0, last = '';
      while (G.qi < G.quiz.length && guard++ < 20) last = answer(G.quiz[G.qi].a);
      ck(last === 'clear', ERAS[e2].name + ': 문제를 다 맞혔는데 통과가 안 된다');
      ck(SAVE.cleared[ERAS[e2].key] === true, ERAS[e2].name + ': 통과 기록이 저장 안 됐다');
    }
    ck(allCleared(), '여덟 정거장을 다 지났는데 완주로 안 쳐진다');
  }

  // 6) 같은 정거장을 다시 가면 문제가 바뀌는가(외운 답이 아니라 아는 답이 되게)
  {
    var sets = {};
    for (var t = 0; t < 40; t++) {
      startEra(0);
      sets[G.quiz.map(function (q) { return q.q; }).sort().join('|')] = 1;
    }
    ck(Object.keys(sets).length >= 4, '40번 들어갔는데 문제 묶음이 ' +
       Object.keys(sets).length + '가지뿐이다');
    var decks = {};
    for (var t2 = 0; t2 < 40; t2++) {
      startEra(0);
      decks[G.deck.map(function (c) { return c.t; }).join('|')] = 1;
    }
    ck(Object.keys(decks).length >= 4, '카드가 늘 같은 자리에 놓인다(' +
       Object.keys(decks).length + '가지)');
  }

  // 7) 진짜로 눌러서 푸는 경로 — 화면의 카드·보기를 클릭한다
  {
    localStorage.removeItem(SAVE_KEY); loadSave();
    startEra(1);
    var want = sortedByYear(ERAS[1].cards)[0];
    var btn = Array.prototype.slice.call(document.querySelectorAll('#cardBox .card'))
      .filter(function (b) { return b.getAttribute('data-t') === want.t; })[0];
    ck(!!btn, '화면에서 사건 카드를 못 찾겠다');
    btn.click();
    ck(G.picked.length === 1 && G.picked[0] === want, '카드를 눌렀는데 담기지 않는다');
    sortedByYear(ERAS[1].cards).slice(1).forEach(function (c) { pickCard(c); });
    render();
    var qq = G.quiz[0];
    var choices = document.querySelectorAll('#quizBox .choice');
    ck(choices.length === 3, '보기 단추가 ' + choices.length + '개 그려졌다');
    choices[qq.a].click();
    ck(G.rights === 1, '정답 보기를 눌렀는데 안 맞혔다');
  }

  // 8) 좁은 화면에서 카드와 보기가 화면 밖으로 나가지 않는가
  {
    startEra(0);
    render();
    var bad = [];
    document.querySelectorAll('#cardBox .card, #quizBox .choice, #stage').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (r.left < -1 || r.right > window.innerWidth + 1) bad.push(el.className);
      if (r.height < 34 && el.className === 'choice') bad.push('choice 가 너무 낮다');
    });
    ck(bad.length === 0, '화면 밖으로 나가는 요소: ' + bad.join(','));
    var stage = $('stage').getBoundingClientRect();
    ck(stage.top >= -1, '문제판 위쪽이 잘렸다');
  }

  // 9) 시간의 길 — 정거장 이름이 화면 밖으로 잘리지 않는가
  {
    fitCanvas();
    var pad2 = 56, step2 = (VW - pad2 * 2) / Math.max(1, ERAS.length - 1);
    var over = [];
    cx.font = '11px sans-serif';
    ERAS.forEach(function (e, i) {
      var x = pad2 + i * step2, w = cx.measureText(e.name).width;
      var tx = Math.min(VW - 4 - w / 2, Math.max(4 + w / 2, x));
      if (tx - w / 2 < -0.5 || tx + w / 2 > VW + 0.5) over.push(e.name);
    });
    ck(over.length === 0, '시간의 길에서 잘리는 정거장 이름: ' + over.join(','));
  }

  // 10) 저장 — 지나온 정거장이 기억된다
  {
    localStorage.removeItem(SAVE_KEY); loadSave();
    SAVE.cleared['empire'] = true; SAVE.best['empire'] = { wrongs: 1, orderMistakes: 0 };
    storeSave();
    SAVE.cleared = {}; SAVE.best = {};
    loadSave();
    ck(SAVE.cleared['empire'] === true && SAVE.best['empire'].wrongs === 1, '진도가 저장되지 않는다');
    localStorage.removeItem(SAVE_KEY); loadSave();
  }

  var out = document.createElement('div');
  out.id = 'simout';
  out.textContent = fails.length
    ? 'SIM FAIL (' + fails.length + '/' + n + ')\n' + fails.join('\n')
    : 'SIM PASS — 정거장 ' + ERAS.length + '개 · 사건 ' + ERAS.length * 4 +
      '개 · 문제 ' + ERAS.reduce(function (s, e) { return s + e.quiz.length; }, 0) +
      '개 · 검사 ' + n + '개 통과';
  out.style.cssText = 'position:fixed;left:0;top:0;z-index:99;color:#fff;font:12px monospace;white-space:pre;background:#000a;padding:6px';
  document.body.appendChild(out);
  document.title = fails.length ? 'SIM FAIL' : 'SIM PASS';
  toMenu();
}

window.__hist = { ERAS: ERAS, G: G, pick: pickCard, answer: answer, startEra: startEra };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
