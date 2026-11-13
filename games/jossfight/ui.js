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
var ST = window.JOSSTORY;
var SAVE_KEY = 'joss_fighters_v1';
var SAVE = { cleared: {}, best: {}, level: 'normal' };

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
    SAVE.level = d.level || 'normal';
    // ⚠️처음에는 '어려움'이 기본이었다 — 너무 벅차다는 말이 나와 한 번만 '보통'으로 내린다.
    //   (딱 한 번 — 그 뒤에 직접 올린 난이도는 건드리지 않는다)
    if (!d.lvFix) { SAVE.level = 'normal'; SAVE.lvFix = 1; storeSave(); }
    else SAVE.lvFix = 1;
  } catch (e) {}
  J.setLevel(SAVE.level);
}
function storeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {}
}

/* ---------- 화면 전환 ---------- */
var SCREENS = ['title', 'select', 'result', 'pause', 'movelist', 'howto', 'intro', 'dialog', 'chapter', 'story'];
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

/* 그린 초상 — 있으면 쓰고, 없으면 조용히 넘어간다(그림이 빠져도 화면이 깨지지 않게) */
var ART = {};
function artOf(key) {
  if (ART[key]) return ART[key];
  var im = new Image();
  im.src = 'art/char_' + key + '.jpg';
  ART[key] = im;
  return im;
}

function showProfile(i) {
  var ch = CHARS[i];
  if (!$('pf')) return;
  if ($('pfArt')) {
    $('pfArt').src = 'art/char_' + ch.key + '.jpg';
    $('pfArt').alt = ch.name;
  }
  $('pfName').innerHTML = ch.name + ' <span>' + ch.job + '</span>';
  $('pfTag').textContent = '"' + ch.cry + '"  — ' + ch.tag;
  $('pfDesc').innerHTML = ch.desc + '<br><span style="color:#8ea0c8;font-size:12px">' + ch.bond + '</span>';
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

/* ---------- 조작법 ----------
   ★기술표만 있고 '어떤 키가 무슨 버튼인지'가 없으면 처음 온 사람은 한 대도 못 때린다.
     그래서 타이틀·잠깐 멈춤·기술표 **세 곳 모두**에서 같은 글을 보여 준다.
   ★키 이름을 여기 한 번만 적는다 — 키 배치는 J.KEYMAP 이 진짜다. */
function buildControls() {
  var rows = [
    ['앞으로 걷기', 'D', '→', '▶'],
    ['뒤로 걷기 <i>(= 막기)</i>', 'A', '←', '◀'],
    ['앉기 <i>(= 하단 막기)</i>', 'S', '↓', '▼'],
    ['점프', 'W', '↑', '▲'],
    ['약손 <i>빠르다 · 약하다</i>', 'J', '숫자판 1', '약손'],
    ['강손 <i>느리다 · 세다</i>', 'K', '숫자판 2', '강손'],
    ['약발 <i>빠르다 · 약하다</i>', 'U', '숫자판 4', '약발'],
    ['강발 <i>느리다 · 세다</i>', 'I', '숫자판 5', '강발'],
    ['<b>필살기</b> <i>커맨드 없이</i>', 'L', '숫자판 3', '필살'],
    ['잠깐 멈춤', 'ESC', 'ESC', '⏸'],
  ];
  var html = '<h3>조작법</h3>' +
    '<p class="hint">움직이는 건 <b>방향 넷</b>, 때리는 건 <b>손 둘 · 발 둘</b> 네 버튼이 전부입니다. ' +
    '막기 버튼은 따로 없습니다.</p>' +
    '<table><tr><th>무엇</th><th>1P 키보드</th><th>2P 키보드</th><th>📱 화면 버튼</th></tr>';
  rows.forEach(function (r) {
    html += '<tr><td>' + r[0] + '</td><td><code>' + r[1] + '</code></td><td><code>' + r[2] +
      '</code></td><td>' + r[3] + '</td></tr>';
  });
  html += '</table>' +
    '<p class="hint">📱 폰·태블릿은 오른쪽 아래 <b>🎮</b> 를 누르면 화면 버튼(왼쪽 방향 · 오른쪽 공격)이 나옵니다. ' +
    '옆의 <b>🎵</b> 는 배경음악을 켜고 끕니다.</p>' +

    '<h4>필살기 버튼 — 커맨드를 못 넣어도 됩니다</h4>' +
    '<p class="hint"><b>L</b>(2P는 숫자판 <b>3</b>) 하나로 필살기가 나갑니다. ' +
    '같이 누른 <b>방향</b>에 따라 네 가지 중 하나가 나가고, 게이지가 가득 찼을 때 ' +
    '방향 없이 누르면 <b>초필살기</b>가 나갑니다.</p>' +
    '<table><tr><th>누르는 것</th><th>나가는 기술</th></tr>' +
    '<tr><td><code>L</code> <i>(방향 없이)</i></td><td>1번 필살기 — 게이지가 <b>가득</b>이면 <b>초필살기</b></td></tr>' +
    '<tr><td><code>↓</code> + <code>L</code></td><td>2번 필살기 <i>(대개 대공기)</i></td></tr>' +
    '<tr><td><code>←</code>(뒤) + <code>L</code></td><td>3번 필살기</td></tr>' +
    '<tr><td><code>→</code>(앞) + <code>L</code></td><td>4번 필살기</td></tr></table>' +
    '<p class="hint">옛날 방식이 편한 사람은 <b>커맨드도 그대로</b> 씁니다 — 둘은 서로를 막지 않습니다. ' +
    '커맨드 쪽이 조금 더 빠르게 나갑니다. 공중에서는 필살기 버튼이 안 먹습니다.</p>' +

    '<h4>막기와 잡기</h4><ul class="tips">' +
    '<li><b>막기는 뒤로 미는 것</b>입니다 — 상대의 <b>반대쪽</b> 방향을 누르고 있으면 막습니다.</li>' +
    '<li>발밑을 노리는 <b>하단 기술은 앉아서</b>(뒤 + 아래), 뛰어드는 <b>점프 공격은 서서</b> 막습니다.</li>' +
    '<li><b>잡기는 막을 수 없습니다.</b> 대신 헛치면 크게 굳으니, 그 틈에 때리면 됩니다.</li>' +
    '</ul>' +

    '<h4>커맨드 읽는 법</h4><ul class="tips">' +
    '<li>화살표는 <b>내가 바라보는 쪽</b> 기준입니다. <code>→</code> 는 늘 상대 쪽, <code>←</code> 는 늘 등 뒤쪽.</li>' +
    '<li><code>↓ ↘ → + 손</code> — 아래에서 앞으로 굴리고 손 버튼. 대개 <b>장풍</b>입니다.</li>' +
    '<li><code>→ ↓ ↘ + 손</code> — 앞·아래·아래앞. 뛰어드는 상대를 떨어뜨리는 <b>대공기</b>입니다.</li>' +
    '<li><code>↓ ↙ ← + 손/발</code> — 뒤로 굴리는 기술(잡기·구르기가 여기 많습니다).</li>' +
    '<li>방향은 <b>연달아</b> 넣습니다. 마지막 방향을 넣자마자 버튼을 누르세요.</li>' +
    '<li><b>초필살기</b>는 <code>↓ ↘ → ↓ ↘ →</code> 처럼 두 번 굴립니다 — 체력 막대 아래 <b>파란 게이지가 100%</b>일 때만.</li>' +
    '<li>게이지는 때리고 맞으면서 찹니다. 캐릭터마다 커맨드가 다르니 <b>기술표</b>를 보세요.</li>' +
    '</ul>' +

    '<h4>대전 규칙</h4><ul class="tips">' +
    '<li>한 판 60초, <b>2선승</b>입니다. 시간이 다 되면 체력이 많은 쪽이 이깁니다.</li>' +
    '<li>커맨드가 손에 익지 않으면 <b>연습</b>을 고르세요 — 상대가 가만히 서 있습니다.</li>' +
    '</ul>';
  return html;
}

/* 필살기 버튼 + 방향 → 몇 번째 기술인가. ⚠️여기 순서는 fight.js 의 spByDir 과 같아야 한다
   (자가검증이 실제로 눌러 보고 대조한다 — 설명이 틀리면 없느니만 못하다). */
var SPBTN = ['L', '↓ + L', '← + L', '→ + L'];

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
  html += '</table><h4>필살기</h4><table><tr><th>기술</th><th>커맨드</th><th>필살기 버튼</th><th>설명</th></tr>';
  ch.specials.forEach(function (sp, i) {
    html += '<tr><td>' + sp.name + '</td><td><code>' + cmdText(sp.cmd) + '</code></td><td><code>' +
      SPBTN[i] + '</code></td><td class="nt">' + sp.note + '</td></tr>';
  });
  html += '<tr class="sup"><td>' + ch.super.name + '</td><td><code>' + cmdText(ch.super.cmd) +
    '</code></td><td><code>L</code> <i>게이지 가득</i></td><td class="nt">' + ch.super.note + ' · 게이지 100%</td></tr></table>';
  return html;
}

/* ---------- 컷아웃 텍스처 불러오기 ----------
   ★부위 그림이 있으면 캐릭터를 그림으로 그린다. 없으면 지금까지처럼 벡터로 — 그림 파일이
     하나라도 빠지면 그 캐릭터만 조용히 벡터로 남는다(반쪽짜리로 그리지 않는다).
   ★뒤쪽 팔다리용 **어두운 사본**을 여기서 한 번 만들어 둔다(매 프레임 어둡게 칠하면 느리다). */
function darken(im, amt) {
  var c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  var x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(10,14,26,' + amt + ')';
  x.fillRect(0, 0, c.width, c.height);
  return c;
}
function loadParts(ch) {
  // ⚠️머리는 늘 벡터로 그리므로 불러오지 않는다(파일은 만들어 두되 쓰지 않는다)
  var names = ['torso', 'armU', 'armL', 'legU', 'legL'];
  fetch('art/parts/' + ch.key + '/parts.json')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (meta) {
      if (!meta) return;
      var parts = {}, left = names.length, bad = false;
      names.forEach(function (n) {
        var im = new Image();
        im.onload = function () {
          parts[n] = im;
          parts[n + "Dark"] = darken(im, 0.52);   // 뒤쪽은 실루엣으로 읽혀야 한다 — 어중간하면 진흙처럼 보인다
          if (--left === 0 && !bad) FA.setTextures(ch.key, { ready: true, parts: parts, geom: meta });
        };
        im.onerror = function () { bad = true; };
        im.src = 'art/parts/' + ch.key + '/' + n + '.png';
      });
    })
    .catch(function () {});
}

/* ---------- 인물 소개 ----------
   ★서사를 적어 두면 캐릭터가 '색깔이 다른 열 명'에서 **아는 사람 열 명**이 된다.
     그림·서사·기술이 한 화면에 같이 있어야 서로를 설명한다. */
function buildIntro(sel) {
  var list = $('introList'), body = $('introBody');
  if (!list || !body) return;
  list.innerHTML = '';
  CHARS.forEach(function (ch, i) {
    var b = document.createElement('button');
    b.className = 'introItem' + (i === sel ? ' on' : '');
    b.innerHTML = '<img src="art/char_' + ch.key + '.jpg" alt=""><span><b>' + ch.name +
      '</b><i>' + ch.job + '</i></span>';
    b.addEventListener('click', function () { buildIntro(i); });
    list.appendChild(b);
  });
  var c = CHARS[sel];
  body.innerHTML =
    '<div class="top">' +
      '<img src="art/char_' + c.key + '.jpg" alt="' + c.name + '">' +
      '<div>' +
        '<h3>' + c.name + '</h3>' +
        '<div class="job">' + c.job + ' · ' + c.tag + '</div>' +
        '<div class="cry">"' + c.cry + '"</div>' +
        '<div class="skills">' +
          c.specials.map(function (sp) {
            return '<div><b>' + sp.name + '</b> <code>' + cmdText(sp.cmd) + '</code></div>';
          }).join('') +
          '<div><b>초필살기 · ' + c.super.name + '</b> <code>' + cmdText(c.super.cmd) + '</code></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<p class="story">' + c.story.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + '</p>' +
    '<div class="bond">' + c.bond + '</div>';
}

/* ---------- 승리 컷인 ----------
   ★이긴 사람을 **크게** 보여 준다. 글자만 뜨는 결과 화면은 '게임이 끝났다'가 아니라
     '화면이 바뀌었다'로 읽힌다. 뒤에 빛살을 깔고 이름과 대사를 얹는다. */
function drawCutIn(canvas, ch, won) {
  var c = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  c.clearRect(0, 0, W, H);
  // 빛살
  var g = c.createRadialGradient(W * 0.5, H * 0.55, 10, W * 0.5, H * 0.55, W * 0.6);
  g.addColorStop(0, won ? 'rgba(255,209,94,.42)' : 'rgba(90,110,160,.34)');
  g.addColorStop(1, 'rgba(12,16,28,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save();
  c.translate(W / 2, H * 0.55);
  for (var i = 0; i < 18; i++) {
    c.rotate(Math.PI * 2 / 18);
    c.fillStyle = i % 2 ? (won ? 'rgba(255,209,94,.10)' : 'rgba(150,170,210,.07)') : 'rgba(255,255,255,.03)';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(W, -26); c.lineTo(W, 26); c.closePath(); c.fill();
  }
  c.restore();
  // 바닥 그림자
  c.fillStyle = 'rgba(8,10,18,.35)';
  c.beginPath(); c.ellipse(W / 2, H - 26, 86, 13, 0, 0, 7); c.fill();
  // 그린 초상이 있으면 그것을, 없으면 그 자리에서 그린 캐릭터를 세운다
  var im = artOf(ch.key);
  if (im.complete && im.naturalWidth) {
    var ih = H * 0.94, iw = ih * (im.naturalWidth / im.naturalHeight);
    c.save();
    c.beginPath();
    c.rect(W / 2 - iw / 2, H - 8 - ih, iw, ih);
    c.clip();
    c.drawImage(im, W / 2 - iw / 2, H - 8 - ih, iw, ih);
    var fade = c.createLinearGradient(0, H - 70, 0, H - 8);   // 아래를 어둡게 지워 바닥에 녹인다
    fade.addColorStop(0, 'rgba(11,13,20,0)');
    fade.addColorStop(1, 'rgba(11,13,20,.95)');
    c.fillStyle = fade; c.fillRect(W / 2 - iw / 2, H - 70, iw, 62);
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2;
    c.strokeRect(W / 2 - iw / 2, H - 8 - ih, iw, ih);
  } else {
    c.save();
    c.translate(W / 2, H - 24);
    FA.drawFighter(c, 0, 0, 1, ch, FA.poseAt(won ? 'win' : 'lose', won ? 10 : 20, false), { zoom: 1.65 });
    c.restore();
  }
}


/* ============================================================
   이야기 모드 (아케이드) — 2026-08-21
   ★아홉 판을 순서대로 붙는 것과 **이야기를 지나가는 것**은 다르다. 다른 건 셋뿐이다:
     (1) 시작할 때 내가 왜 나왔는지 (2) 붙기 전에 두 마디 (3) 다 이겼을 때 어떻게 됐는지.
   ★상대 순서는 판마다 섞이지만 **마지막은 늘 조스**다(조스로 할 때는 준원). 이야기에는 끝이
     있어야 한다 — 마지막 상대가 매번 다르면 아홉 번째 판은 그냥 아홉 번째 판이다.
   ★무대는 그 사람의 자리(ch.home)로 간다. 우체국에서 집배원과, 코트에서 족구 선수와 붙는다.
   ============================================================ */
function idxOf(key) {
  for (var i = 0; i < CHARS.length; i++) if (CHARS[i].key === key) return i;
  return 0;
}
function stageIdxOf(key) {
  for (var i = 0; i < STAGES.length; i++) if (STAGES[i].key === key) return i;
  return 0;
}

/* ---------- 막 화면(프롤로그 · 마지막 상대 · 엔딩) ---------- */
function showChapter(tag, title, body, btn, next) {
  show('chapter');
  $('chTag').textContent = tag;
  $('chTitle').textContent = title;
  $('chBody').innerHTML = body.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split('\n')
    .map(function (l) { return l ? '<p>' + l + '</p>' : ''; }).join('');
  $('chNext').textContent = btn;
  chapterNext = next;
}
var chapterNext = null;

/* ---------- 대사 화면 ----------
   ★한 글자씩 찍는다. 다 뜬 글을 그냥 보여 주면 사람은 읽기 전에 넘겨 버린다.
   ⚠️찍는 도중에 누르면 **먼저 다 보여 주고**, 그다음 눌러야 넘어간다(성급한 손을 봐준다). */
var DLG = { steps: [], i: 0, timer: null, full: '', shown: 0, done: null };
function playDialog(meKey, oppKey, isBoss, done) {
  var steps = [];
  var L = ST.lines(meKey, oppKey);
  if (isBoss) steps.push({ side: 'none', text: meKey === 'joss' ? ST.bossLeadJoss : ST.bossLead });
  if (L) { steps.push({ side: 'me', text: L[0] }); steps.push({ side: 'opp', text: L[1] }); }
  if (isBoss && ST.bossIntro[meKey]) steps.push({ side: 'me', text: ST.bossIntro[meKey] });
  if (!steps.length) { done(); return; }

  var me = CHARS[idxOf(meKey)], opp = CHARS[idxOf(oppKey)];
  show('dialog');
  $('dlgL').src = 'art/char_' + me.key + '.jpg';
  $('dlgR').src = 'art/char_' + opp.key + '.jpg';
  $('dlgNameL').textContent = me.name;
  $('dlgNameR').textContent = opp.name;
  DLG.steps = steps; DLG.i = -1; DLG.done = done; DLG.me = me; DLG.opp = opp;
  dlgNext();
}
function dlgNext() {
  if (DLG.timer) { clearInterval(DLG.timer); DLG.timer = null; }
  if (DLG.shown < DLG.full.length) {          // 아직 찍는 중이면 먼저 다 보여 준다
    DLG.shown = DLG.full.length;
    $('dlgText').textContent = DLG.full;
    return;
  }
  DLG.i++;
  if (DLG.i >= DLG.steps.length) { var d = DLG.done; DLG.done = null; if (d) d(); return; }
  var st = DLG.steps[DLG.i];
  var who = st.side === 'me' ? DLG.me : st.side === 'opp' ? DLG.opp : null;
  $('dlgWho').textContent = who ? who.name : '';
  $('dlgWho').style.display = who ? '' : 'none';
  $('dlgSideL').classList.toggle('on', st.side === 'me');
  $('dlgSideR').classList.toggle('on', st.side === 'opp');
  $('dlgBox').classList.toggle('narration', st.side === 'none');
  DLG.full = st.text; DLG.shown = 0;
  $('dlgText').textContent = '';
  DLG.timer = setInterval(function () {
    DLG.shown++;
    $('dlgText').textContent = DLG.full.slice(0, DLG.shown);
    if (DLG.shown >= DLG.full.length) { clearInterval(DLG.timer); DLG.timer = null; }
  }, 24);
}
function dlgSkip() {
  if (DLG.timer) { clearInterval(DLG.timer); DLG.timer = null; }
  DLG.i = DLG.steps.length; DLG.shown = 0; DLG.full = '';
  var d = DLG.done; DLG.done = null; if (d) d();
}

/* ---------- 이야기 화면(타이틀 → 이야기) ----------
   ⚠️엔딩은 **그 캐릭터로 아케이드를 깬 사람에게만** 보여 준다. 안 깬 사람에게 결말을
     먼저 보여 주면 이길 이유가 하나 사라진다. */
function buildStory(sel) {
  var list = $('storyList'), body = $('storyBody');
  if (!list || !body) return;
  list.innerHTML = '';
  var mk = function (label, i, on) {
    var b = document.createElement('button');
    b.className = 'introItem' + (sel === i ? ' on' : '');
    b.innerHTML = label;
    b.addEventListener('click', function () { buildStory(i); });
    list.appendChild(b);
  };
  mk('<span><b>대회</b><i>왜 열렸는가</i></span>', -1);
  CHARS.forEach(function (ch, i) {
    mk('<img src="art/char_' + ch.key + '.jpg" alt=""><span><b>' + ch.name + '</b><i>' +
       (SAVE.cleared[ch.key] ? '결말까지' : '시작만') + '</i></span>', i);
  });
  if (sel === -1 || sel === undefined) {
    body.innerHTML = '<h3>조스 오브 파이터즈</h3><div class="story">' +
      ST.world.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split('\n\n')
        .map(function (t) { return '<p>' + t + '</p>'; }).join('') + '</div>';
    return;
  }
  var c = CHARS[sel];
  var html = '<div class="top"><img src="art/char_' + c.key + '.jpg" alt="' + c.name + '"><div>' +
    '<h3>' + c.name + '</h3><div class="job">' + c.job + ' · ' + c.tag + '</div>' +
    '<div class="cry">"' + c.cry + '"</div></div></div>' +
    '<h4>시작</h4><div class="story">' + para(ST.prologue[c.key]) + '</div>';
  if (SAVE.cleared[c.key]) {
    html += '<h4>결말</h4><div class="story ending">' + para(ST.ending[c.key]) + '</div>';
  } else {
    html += '<h4>결말</h4><p class="locked">🔒 ' + c.name + '(으)로 아케이드를 끝내면 열립니다.</p>';
  }
  body.innerHTML = html;
}
function para(t) {
  return (t || '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split('\n')
    .map(function (l) { return '<p>' + l + '</p>'; }).join('');
}

/* ---------- 대전 시작 ---------- */
function beginMatch(myIdx, oppIdx, stageIdx, twoPlayers, training) {
  J.Snd.ready();
  J.Mus.duck(false);
  J.Mus.play(STAGES[stageIdx].music);
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
  J.Mus.duck(true);              // 결과 화면에서는 음악을 뒤로 물린다
  var last = UI.mode === 'arcade' && UI.arcade && UI.arcade.step >= UI.arcade.order.length;
  drawCutIn($('rArt'), iWon ? CHARS[UI.myIdx] : g.p2.ch, iWon);
  $('rTitle').textContent = iWon ? (last ? '🏆 아케이드 제패!' : 'YOU WIN') : 'YOU LOSE';
  // ★이긴 뒤 한 마디는 **그 상대에게 하는 말**이다 — 관계가 있는 짝은 따로 적어 두었다
  var meKey = CHARS[UI.myIdx].key, oppKey = g.p2.ch.key;
  var wl = iWon ? ST.winLine(meKey, oppKey, (UI.arcade ? UI.arcade.step : 0)) : '';
  $('rSub').textContent = iWon
    ? (last ? CHARS[UI.myIdx].name + '(으)로 아홉 명을 모두 이겼습니다.' : '"' + (wl || CHARS[UI.myIdx].cry) + '"')
    : '"' + ST.winLine(oppKey, meKey, 0) + '" — ' + g.p2.ch.name + '에게 졌습니다.';
  UI.endingReady = false;
  $('rNext').textContent = '다음 상대';
  $('rNext').style.display = (UI.mode === 'arcade' && iWon && !last) ? '' : 'none';
  $('rRetry').style.display = iWon ? 'none' : '';
  if (last && iWon) {
    SAVE.cleared[CHARS[UI.myIdx].key] = true;
    storeSave();
    // 마지막 판을 이겼으면 '다음 상대' 자리에 **결말**을 놓는다
    UI.endingReady = true;
    $('rNext').style.display = '';
    $('rNext').textContent = '결말 보기 →';
  }
}

function nextArcade() {
  var a = UI.arcade;
  var oppIdx = a.order[a.step];
  var opp = CHARS[oppIdx];
  var st = stageIdxOf(opp.home || STAGES[a.step % STAGES.length].key);   // 상대의 자리로 간다
  UI.oppIdx = oppIdx; UI.stageIdx = st;
  var isBoss = a.step === a.order.length - 1;
  var go = function () { beginMatch(UI.myIdx, oppIdx, st, false, false); };
  var meKey = CHARS[UI.myIdx].key;
  if (isBoss) {
    showChapter(ST.bossTitle, opp.name + ' · ' + opp.job,
      (meKey === 'joss' ? ST.bossLeadJoss : ST.bossLead), '맞선다',
      function () { playDialog(meKey, opp.key, true, go); });
    return;
  }
  playDialog(meKey, opp.key, false, go);
}

/** 검사용 — 화면을 띄우지 않고 상대 순서만 만든다 */
function startArcadeOrderOnly(myIdx) {
  var real = showChapter, out;
  showChapter = function () {};
  try { startArcade(myIdx); } finally { showChapter = real; }
  return UI.arcade;
}

function startArcade(myIdx) {
  UI.myIdx = myIdx;
  var me = CHARS[myIdx];
  var bossKey = ST.bossOf(me.key);
  var order = [];
  CHARS.forEach(function (c, i) { if (i !== myIdx && c.key !== bossKey) order.push(i); });
  for (var i = order.length - 1; i > 0; i--) {          // 앞의 여덟은 판마다 순서가 다르다
    var j = Math.floor(Math.random() * (i + 1));
    var t = order[i]; order[i] = order[j]; order[j] = t;
  }
  order.push(idxOf(bossKey));                            // ★마지막은 늘 정해져 있다
  UI.arcade = { order: order, step: 0 };
  showChapter('1막 — 왜 나왔는가', me.name + ' · ' + me.job, ST.prologue[me.key] || me.story,
              '대회장으로', nextArcade);
}

/* ---------- 화면 만들기 ---------- */
function toTitle() {
  show('title');
  J.Mus.duck(false);
  J.Mus.play('menu');
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
  var map = { tL: 'left', tR: 'right', tU: 'up', tD: 'down', tLP: 'lp', tHP: 'hp', tLK: 'lk', tHK: 'hk', tSP: 'sp' };
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

/* ---------- 배경음악 켜고 끄기 ----------
   ⚠️브라우저는 **사람이 건드리기 전에는** 소리를 못 내게 막는다. 그래서 첫 클릭·첫 키에서
     소리 장치를 만들고, 그때 걸려 있던 곡을 시작한다. */
function bindMusic() {
  var want = null;
  try { want = localStorage.getItem('joss_bgm'); } catch (e) {}
  var on = want !== '0';
  J.Mus.setOn(on);
  function label() {
    if ($('bgmBtn')) $('bgmBtn').textContent = on ? '🎵 음악 · 켬' : '🔇 음악 · 끔';
    if ($('bgmHud')) $('bgmHud').textContent = on ? '🎵' : '🔇';
  }
  function toggle() {
    on = !on;
    J.Snd.ready();
    J.Mus.setOn(on);
    try { localStorage.setItem('joss_bgm', on ? '1' : '0'); } catch (e) {}
    label();
  }
  label();
  if ($('bgmBtn')) $('bgmBtn').addEventListener('click', toggle);
  if ($('bgmHud')) $('bgmHud').addEventListener('click', toggle);

  // 첫 손짓에 소리 장치를 만든다(잠들어 있으면 깨운다)
  // ⚠️touchstart 도 함께 듣는다 — 옛 iOS 사파리는 pointerdown 을 손짓으로 안 쳐 준다.
  function wake() { J.Snd.ready(); }
  window.addEventListener('pointerdown', wake);
  window.addEventListener('touchstart', wake);
  window.addEventListener('keydown', wake);
}

/* ---------- 시작 ---------- */
function boot() {
  loadSave();
  CHARS.forEach(loadParts);          // 있으면 그림 텍스처로, 없으면 벡터로
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
    $('mlBody').innerHTML = '<div class="ctlbox">' + buildControls() + '</div><hr>' +
      CHARS.map(buildMoveList).join('<hr>');
    show('movelist');
  });
  $('mlClose').addEventListener('click', toTitle);
  $('howBtn').addEventListener('click', function () {
    $('howBody').innerHTML = buildControls();
    show('howto');
  });
  $('howClose').addEventListener('click', toTitle);
  $('introBtn').addEventListener('click', function () { buildIntro(0); show('intro'); });
  $('introClose').addEventListener('click', toTitle);
  $('storyBtn').addEventListener('click', function () { buildStory(-1); show('story'); });
  $('storyClose').addEventListener('click', toTitle);
  $('chNext').addEventListener('click', function () { var f = chapterNext; chapterNext = null; if (f) f(); });
  $('dlgSkip').addEventListener('click', dlgSkip);
  // 대사는 화면 아무 데나 눌러도 넘어간다(버튼을 찾게 만들면 안 읽는다)
  $('dialog').addEventListener('click', function (e) {
    if (e.target.id === 'dlgSkip') return;
    dlgNext();
  });
  window.addEventListener('keydown', function (e) {
    if ($('dialog').style.display === 'flex' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); dlgNext(); }
    else if ($('chapter').style.display === 'flex' && (e.code === 'Enter' || e.code === 'Space')) {
      e.preventDefault(); var f = chapterNext; chapterNext = null; if (f) f();
    }
  });
  bindMusic();
  $('rNext').addEventListener('click', function () {
    if (UI.endingReady) {
      var meC = CHARS[UI.myIdx];
      UI.endingReady = false;
      showChapter('마지막 막 — 그 뒤', meC.name + '의 결말', ST.ending[meC.key] || '', '처음으로', toTitle);
      return;
    }
    nextArcade();
  });
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
  J.Mus.duck(g.paused);
  if (g.paused) {
    $('pMoves').innerHTML = '<div class="ctlbox">' + buildControls() + '</div><hr>' + buildMoveList(g.p1.ch);
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
    ck(ch.specials.length === 4, ch.name + ': 필살기가 ' + ch.specials.length + '개');
    ck(!!ch.home && STAGES.some(function (st) { return st.key === ch.home; }), ch.name + ': 자기 무대(home)가 없다 ' + ch.home);
    ck(!!ch.cutin && ch.cutin.length > 4, ch.name + ': 초필살기 외침이 없다');
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
    // ★같은 캐릭터 안에서 커맨드가 겹치면 뒤엣것은 **영영 안 나간다**
    var cmds = {};
    moves.forEach(function (mv) {
      ck(!cmds[mv.cmd], ch.name + ': 커맨드 ' + mv.cmd + ' 가 두 기술에 걸려 있다');
      cmds[mv.cmd] = 1;
    });
    // 이펙트·소리 이름이 실제로 있는가(없으면 조용히 아무 일도 안 난다 — 가장 찾기 어려운 고장)
    moves.forEach(function (mv) {
      if (mv.fx) ck(!!J.MOVEFX[mv.fx], ch.name + '/' + mv.name + ': 없는 이펙트 ' + mv.fx);
      if (mv.sound) ck(!!J.SFX[mv.sound], ch.name + '/' + mv.name + ': 없는 효과음 ' + mv.sound);
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
    var fb9 = J.findSpecial(g9.p1, ['fireball']);
    J.startMove(g9.p1, fb9);
    J.startMove(g9.p2, J.findSpecial(g9.p2, ['fireball']));
    // ⚠️좁은 화면(폰)에서는 두 사람이 화면 안으로 끌려와 붙는다 → 장풍이 나오자마자 부딪힌다.
    //   그래서 '날아가는 도중'이 아니라 **나온 직후**에 센다(화면 크기에 기대는 검사는 검사가 아니다).
    for (var iA = 0; iA < fb9.startup + 1; iA++) J.step();
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
    var out = 0, far = 0;
    // ⚠️'900보다 벌어지면 안 된다'는 **화면 크기에 기댄 숫자**였다. 진짜 규칙은
    //   '둘 다 화면 안에 있어야 한다' — 넓은 화면에서는 900보다 벌어지는 게 정상이다.
    var maxGap = J.VW - 60;
    for (var iD = 0; iD < 3000; iD++) {
      J.step();
      [gE.p1, gE.p2].forEach(function (f) {
        if (f.x < 40 || f.x > J.ARENA - 40) out++;
        if (f.y > 1) out++;                     // 바닥을 뚫고 내려가지 않는다
      });
      if (Math.abs(gE.p1.x - gE.p2.x) > maxGap) far++;
    }
    ck(out === 0, '무대 밖으로 나가거나 바닥을 뚫은 프레임이 ' + out + '개');
    ck(far === 0, '둘이 화면 밖으로 갈라진 프레임이 ' + far + '개(한계 ' + Math.round(maxGap) + ')');
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
          // ⚠️이제 기술 하나에 **컷인(72F 정지) + 슬로모션(3배 느림)** 이 붙을 수 있다.
          //   '몇 프레임 돌렸나'로 세면 초필살기가 전부 실패한다 — 끝날 때까지 돌려 본다.
          for (var guard = 0; gF.p1.mv && guard < 900; guard++) J.step();
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

  /* 16-b) 히트스톱 — 맞는 순간 실제로 멈추는가, 연타 기술이 게임을 얼려 버리지 않는가 */
  {
    var gH = setup(0, 1, 80);
    J.applyHit(gH, gH.p1, gH.p2, CHARS[0].normals.hp, false);
    ck(gH.freezeT > 0, '맞았는데 히트스톱이 안 걸린다');
    var af0 = gH.p2.af, hp0 = gH.p2.hp;
    J.step();
    ck(gH.p2.af === af0, '멈춘 동안에도 동작이 흘러간다');
    var t0 = gH.timeF;
    J.step();
    ck(gH.timeF === t0, '멈춘 동안 시계가 흘러간다');
    var guard17 = 0;
    while (gH.freezeT > 0 && guard17++ < 30) J.step();
    ck(guard17 < 30, '히트스톱이 안 풀린다');
    ck(gH.p2.hp === hp0, '멈춘 동안 체력이 더 깎인다');

    var multi = null;
    CHARS.forEach(function (c) { if (c.super.multi && !multi) multi = c.super; });
    if (multi) {
      var gM = setup(0, 1, 80);
      J.applyHit(gM, gM.p1, gM.p2, multi, false);
      ck(gM.freezeT <= 3, '연타 기술이 오래 멈춘다(' + gM.freezeT + 'F) — 게임이 얼어 보인다');
    }
  }

  /* 17) 배경음악 — 무대마다 곡이 있는가, 가락이 마디를 넘거나 모자라지 않는가 */
  {
    var TH = J.Mus.THEMES, MO = J.Mus.MOTIF;
    ck(!!TH.menu, '메뉴 곡이 없다');
    STAGES.forEach(function (st) {
      ck(!!st.music && !!TH[st.music], st.name + ': 무대 곡이 없다(' + st.music + ')');
    });
    Object.keys(MO).forEach(function (k) {
      var sum = 0;
      MO[k].forEach(function (nt) { sum += nt.l; });
      ck(sum === 16, '가락 ' + k + ': 한 마디가 16칸이 아니다(' + sum + ')');
    });
    Object.keys(TH).forEach(function (k) {
      var t = TH[k];
      ['kick', 'snare', 'hat', 'bass'].forEach(function (d) {
        ck(t[d].length === 16, k + '/' + d + ': 북 패턴이 16칸이 아니다');
        ck(/^[01]+$/.test(t[d]), k + '/' + d + ': 북 패턴에 0·1 아닌 글자가 있다');
      });
      ck(t.prog.length === 4, k + ': 화음 진행이 네 마디가 아니다');
      ck(!!MO[t.motif] && !!MO[t.motif2], k + ': 없는 가락을 가리킨다');
      ck(t.bpm >= 80 && t.bpm <= 170, k + ': 빠르기가 이상하다 ' + t.bpm);
    });
  }

  /* 16-c) 확대 배율 — 화면 폭에 맞게 잡히는가(좁은 화면에서 둘이 몸에 붙으면 장풍이 죽는다) */
  {
    ck(J.ZOOM >= 1.35 && J.ZOOM <= 2.1, '확대 배율이 범위 밖이다: ' + J.ZOOM);
    // 화면이 좁을수록 작아야 한다 — 넓은 화면에서 최대치, 좁으면 그 아래
    ck(window.innerWidth > 900 ? J.ZOOM > 1.8 : J.ZOOM <= 2.1,
       '화면 폭 ' + window.innerWidth + '에 배율 ' + J.ZOOM + ' 은 맞지 않는다');
    // 판정 상자는 배율을 그대로 따라야 한다(그림만 커지면 안 보이는 곳에서 맞는다)
    var gZ = setup(0, 1, 120);
    var hb = J.hitBox(gZ.p1, CHARS[0].normals.hp);
    ck(Math.abs(hb.w - CHARS[0].normals.hp.box[2] * CHARS[0].scale * J.ZOOM) < 0.01,
       '판정 상자가 확대 배율을 안 따른다');
  }

  /* 17-b) 인물 소개 — 서사가 비어 있으면 소개 화면이 껍데기가 된다 */
  {
    CHARS.forEach(function (ch) {
      ck(!!ch.story && ch.story.length >= 60, ch.name + ': 서사가 없거나 너무 짧다');
      ck(!!ch.bond, ch.name + ': 관계 한 줄이 없다');
      ck(!!ch.tag && !!ch.job, ch.name + ': 별명·직업이 없다');
    });
    buildIntro(3);
    show('intro');
    var ib = $('introBody');
    ck(ib.innerHTML.indexOf(CHARS[3].name) >= 0, '소개 화면에 고른 사람이 안 나온다');
    ck(document.querySelectorAll('#introList .introItem').length === 10, '소개 목록이 10명이 아니다');
    var r = ib.getBoundingClientRect();
    ck(r.left >= -1 && r.right <= window.innerWidth + 1, '소개 화면이 옆으로 넘친다');
    toTitle();
  }

  /* 18) 조작법 — 실제 키 배치와 글이 어긋나면 안 된다(설명이 틀리면 없느니만 못하다) */
  {
    var htm = buildControls();
    ck(htm.length > 600, '조작법 글이 너무 짧다');
    ['D', 'A', 'S', 'W', 'J', 'K', 'U', 'I'].forEach(function (k) {
      ck(htm.indexOf('<code>' + k + '</code>') >= 0, '조작법에 1P 키 ' + k + ' 가 없다');
    });
    ck(htm.indexOf('막기') >= 0 && htm.indexOf('반대쪽') >= 0, '조작법에 막는 법이 없다');
    ck(htm.indexOf('게이지') >= 0, '조작법에 게이지 설명이 없다');
    // 글에 적은 키가 진짜 그 키인지 대조한다
    var M = J.KEYMAP[0];
    ck(M.right === 'KeyD' && M.left === 'KeyA' && M.up === 'KeyW' && M.down === 'KeyS',
       '조작법과 실제 방향키 배치가 다르다');
    ck(M.lp === 'KeyJ' && M.hp === 'KeyK' && M.lk === 'KeyU' && M.hk === 'KeyI',
       '조작법과 실제 공격키 배치가 다르다');
    $('howBody').innerHTML = htm;
    show('howto');
    var hb = $('howBody').getBoundingClientRect();
    ck(hb.left >= -1 && hb.right <= window.innerWidth + 1, '조작법 판이 화면 밖으로 나간다');
    toTitle();
  }

  /* 19) 난이도 — 쉬움이 실제로 더 쉬운가(쉬는 틈·피해 배율이 순서대로인가) */
  {
    var order = ['easy', 'normal', 'hard', 'master'];
    for (var li = 1; li < order.length; li++) {
      var lo = J.DIFF[order[li - 1]], hi = J.DIFF[order[li]];
      ck(lo.react > hi.react, order[li] + ': 반응이 더 느리다');
      ck(lo.rest >= hi.rest, order[li] + ': 쉬는 틈이 더 많다');
      ck(lo.dmg <= hi.dmg, order[li] + ': 피해가 더 크다');
      ck(lo.block <= hi.block, order[li] + ': 더 잘 막는다');
    }
  }


  /* 20) ★필살기 버튼 — 진짜 키(L)를 눌러 방향별로 다른 기술이 나가는가
     ⚠️커맨드 검사와 따로 해야 한다. 커맨드가 멀쩡해도 버튼 배선이 끊어져 있을 수 있다. */
  {
    var K2 = J.KEYMAP[0];
    function clearKeys() { Object.keys(J.held).forEach(function (k) { J.held[k] = 0; }); }
    function pressSP(dir, meter) {
      var g = setup(0, 1, 300);
      g.p1.human = true; g.p1.meter = meter || 0;
      clearKeys();
      if (dir) J.held[dir] = 1;
      for (var i = 0; i < 2; i++) J.step();      // 방향을 먼저 잡고
      J.held[K2.sp] = 1;
      J.step();
      var mv = g.p1.mv;
      clearKeys();
      return mv;
    }
    var ch0 = CHARS[0];
    var m0 = pressSP(null, 0), m1 = pressSP(K2.down, 0), m2 = pressSP(K2.left, 0), m3 = pressSP(K2.right, 0);
    ck(!!m0 && m0.key === ch0.specials[0].key, '필살기 버튼(중립)이 1번 기술을 안 낸다');
    ck(!!m1 && m1.key === ch0.specials[1].key, '↓ + 필살기가 2번 기술을 안 낸다');
    ck(!!m2 && m2.key === ch0.specials[2].key, '뒤 + 필살기가 3번 기술을 안 낸다');
    ck(!!m3 && m3.key === ch0.specials[3].key, '앞 + 필살기가 4번 기술을 안 낸다');
    var ms = pressSP(null, 100);
    ck(!!ms && ms.key === 'super', '게이지가 가득인데 필살기 버튼이 초필살기를 안 낸다');
    var mNot = pressSP(K2.down, 100);
    ck(!!mNot && mNot.key !== 'super', '방향을 넣었는데도 초필살기가 나간다(아껴 쓸 수가 없다)');
    // 조작법에 적은 설명이 실제 배선과 같은가
    var htm2 = buildControls();
    ck(htm2.indexOf('<code>L</code>') >= 0, '조작법에 필살기 키가 없다');
    ck(K2.sp === 'KeyL' && J.KEYMAP[1].sp === 'Numpad3', '조작법과 실제 필살기 키가 다르다');
    ck(SPBTN.length === 4, '기술표의 필살기 버튼 표기가 4칸이 아니다');
    ck(J.spByDir(J.Fighter(CHARS[3], 0, 1, true), J.blank()).key === CHARS[3].specials[0].key,
       'spByDir 이 중립에서 1번을 안 준다');
  }

  /* 21) ★초필살기 연출 — 멈추고, 컷인이 뜨고, 그다음 느려지는가
     ⚠️'연출 중에는 세계가 멈춰야 한다'가 핵심이다. 멈추지 않으면 컷인 뒤에서 맞아 죽는다. */
  {
    var gS = setup(0, 1, 120);
    gS.p1.meter = 100;
    var hpS = gS.p2.hp, tS = gS.timeF;
    J.startMove(gS.p1, CHARS[0].super);
    ck(!!gS.cine, '초필살기를 썼는데 컷인이 없다');
    var mvf0 = gS.p1.mvf;
    for (var i20 = 0; i20 < 20; i20++) J.step();
    ck(gS.p1.mvf === mvf0, '컷인 중인데 기술이 흘러간다');
    ck(gS.timeF === tS, '컷인 중인데 시계가 흘러간다');
    ck(gS.p2.hp === hpS, '컷인 중인데 체력이 깎인다');
    var guard20 = 0;
    while (gS.cine && guard20++ < 200) J.step();
    ck(guard20 < 200, '컷인이 안 끝난다');
    ck(gS.slowT > 0, '컷인이 끝났는데 슬로모션으로 안 이어진다');
    // 슬로모션 — 세 번 돌려야 한 프레임 나아간다
    var fr0 = gS.frame;
    for (var i21 = 0; i21 < 3; i21++) J.step();
    ck(gS.frame - fr0 === 1, '슬로모션인데 ' + (gS.frame - fr0) + '프레임이 나아갔다(1이어야 한다)');
    // 그리기가 터지지 않는가(컷인 그림이 아직 안 왔을 때가 제일 위험하다)
    var drawErr2 = null;
    try { gS.cine = { t: 4, dur: 72, ch: CHARS[0], name: CHARS[0].super.name, side: 0 }; J.draw();
          gS.cine = { t: 4, dur: 72, ch: CHARS[9], name: CHARS[9].super.name, side: 1 }; J.draw();
          gS.cine = null; }
    catch (e) { drawErr2 = e.message; }
    ck(!drawErr2, '컷인을 그리다 터졌다: ' + drawErr2);
    // KO 도 느리게 끝나야 한다
    var gK = setup(0, 1, 70);
    gK.p2.hp = 1;
    J.applyHit(gK, gK.p1, gK.p2, CHARS[0].normals.hp, false);
    ck(gK.slowT > 0, 'KO 인데 슬로모션이 안 걸린다');
  }

  /* 22) 새로 생긴 장풍들 — 포물선·머리 위·막는 높낮이 */
  {
    // 소포(포물선): 던지면 나가고, 결국 땅에 떨어져 사라진다
    var gP = setup(1, 0, 420);
    J.startMove(gP.p1, J.findSpecial(gP.p1, ['express']));
    for (var i22 = 0; i22 < 12; i22++) J.step();
    ck(gP.projs.length === 1, '속달 소포가 안 나갔다');
    var y0 = gP.projs[0] ? gP.projs[0].y : 0;
    for (var i23 = 0; i23 < 40; i23++) J.step();
    ck(gP.projs.length === 0 || gP.projs[0].y > y0, '포물선 장풍이 떨어지지 않는다');
    // 문제집 폭격: 상대 머리 위에서 시작한다
    var gB2 = setup(9, 0, 360);
    J.startMove(gB2.p1, J.findSpecial(gB2.p1, ['bomb']));
    for (var i24 = 0; i24 < 12; i24++) J.step();
    ck(gB2.projs.length === 1, '문제집 폭격이 안 나갔다');
    if (gB2.projs.length) {
      ck(Math.abs(gB2.projs[0].x - gB2.p2.x) < 80,
         '문제집이 상대 머리 위가 아니라 던진 사람 앞에서 생긴다');
      ck(gB2.projs[0].type === 'high', '문제집이 서서 막는 판정(high)이 아니다');
    }
    // 위에서 오는 것은 앉아 막을 수 없다
    var gH2 = setup(9, 0, 70);
    var d5 = gH2.p2, hp5 = d5.hp;
    d5.blocking = true; d5.crouch = true;
    J.applyHit(gH2, gH2.p1, d5, { dmg: 60, hit: 16, block: 10, kb: 4, type: 'high' }, true);
    ck(hp5 - d5.hp > 20, '앉아 막기로 머리 위 공격이 막힌다');
    // 내리꽂기(오버헤드)도 마찬가지
    var gO = setup(3, 0, 70);
    var d6 = gO.p2, hp6 = d6.hp;
    d6.blocking = true; d6.crouch = true;
    J.applyHit(gO, gO.p1, d6, J.findSpecial(gO.p1, ['smash']), false);
    ck(hp6 - d6.hp > 20, '앉아 막기로 내리꽂기가 막힌다');
  }

  /* 23) 새 기술의 특별한 성질 — 끌어당기기 · 게이지 회복 · 무적 회피 */
  {
    // 자석 집게: 밀려나는 게 아니라 끌려온다
    var gM = setup(6, 0, 110);
    var before = Math.abs(gM.p2.x - gM.p1.x);
    J.applyHit(gM, gM.p1, gM.p2, J.findSpecial(gM.p1, ['magnet']), false);
    ck(gM.p2.vx * (gM.p2.x > gM.p1.x ? 1 : -1) < 0, '자석 집게를 맞았는데 밀려난다');
    // 배당금: 맞히면 게이지가 크게 찬다
    var gD2 = setup(7, 0, 70);
    gD2.p1.meter = 0;
    J.applyHit(gD2, gD2.p1, gD2.p2, J.findSpecial(gD2.p1, ['dividend']), false);
    ck(gD2.p1.meter >= 22, '배당금을 맞혔는데 게이지가 안 찬다(' + gD2.p1.meter + ')');
    // 긴급 롤백: 뒤로 물러나고 그동안 무적이다
    var gR = setup(0, 1, 120);
    var x0 = gR.p1.x;
    J.startMove(gR.p1, J.findSpecial(gR.p1, ['rollback']));
    ck(gR.p1.invuln > 0, '롤백 중인데 무적이 아니다');
    ck(gR.p1.x < x0, '롤백인데 뒤로 안 물러난다');
  }

  /* 24) ★서사와 대사 — 90쌍이 다 있는가, 짧고 겹치지 않는가
     ⚠️'대사를 넣었다'는 것으로는 아무것도 보장되지 않는다. 하나라도 비면 그 판만 조용해진다. */
  {
    var pairs = 0, seenLine = {}, dupe = 0, long = 0, missing = [];
    CHARS.forEach(function (a) {
      ck(!!ST.prologue[a.key] && ST.prologue[a.key].length > 60, a.name + ': 프롤로그가 없다');
      ck(!!ST.ending[a.key] && ST.ending[a.key].length > 60, a.name + ': 엔딩이 없다');
      ck(!!ST.bossIntro[a.key], a.name + ': 마지막 상대 앞 대사가 없다');
      ck(!!(ST.winLines[a.key] && ST.winLines[a.key].length >= 3), a.name + ': 승리 대사가 3개가 안 된다');
      ck(!ST.vs[a.key][a.key], a.name + ': 자기 자신과 붙는 대사가 있다');
      CHARS.forEach(function (b) {
        if (a === b) return;
        var L = ST.lines(a.key, b.key);
        if (!L || L.length !== 2 || !L[0] || !L[1]) { missing.push(a.name + '→' + b.name); return; }
        pairs++;
        L.forEach(function (t) {
          if (t.length > 40) long++;
          if (seenLine[t]) dupe++;
          seenLine[t] = 1;
        });
      });
    });
    ck(missing.length === 0, '대사가 빠진 짝: ' + missing.slice(0, 5).join(', '));
    ck(pairs === 90, '대사가 있는 짝이 ' + pairs + '쌍이다(90이어야 한다)');
    ck(dupe === 0, '똑같은 대사가 ' + dupe + '군데 있다(돌려쓰면 두 번째 판에서 들킨다)');
    ck(long === 0, '한 줄이 40자를 넘는 대사가 ' + long + '개다(대화창이 세 줄이 된다)');
    ck(!!ST.world && ST.world.length > 150, '대회 이야기(world)가 없다');
    ck(ST.bossOf('minyu') === 'joss' && ST.bossOf('joss') === 'junwon', '마지막 상대가 정해져 있지 않다');
    ck(!!ST.winLine('minyu', 'yujin', 0) && !!ST.winLine('nodeok', 'inwoo', 1), '승리 대사가 안 나온다');
  }

  /* 25) 아케이드 — 마지막은 늘 조스, 무대는 상대의 자리 */
  {
    for (var t25 = 0; t25 < 10; t25++) {
      startArcadeOrderOnly(t25);
      var a25 = UI.arcade;
      ck(a25.order.length === 9, CHARS[t25].name + ': 상대가 9명이 아니다(' + a25.order.length + ')');
      ck(CHARS[a25.order[8]].key === ST.bossOf(CHARS[t25].key),
         CHARS[t25].name + ': 마지막 상대가 ' + CHARS[a25.order[8]].name + '이다');
      var dup25 = {};
      a25.order.forEach(function (o) { dup25[o] = (dup25[o] || 0) + 1; });
      ck(Object.keys(dup25).length === 9, CHARS[t25].name + ': 같은 상대가 두 번 나온다');
      ck(a25.order.indexOf(t25) < 0, CHARS[t25].name + ': 자기 자신과 붙는다');
    }
    // 대사 화면이 실제로 뜨고, 넘기면 대전이 시작되는가
    var started = 0;
    UI.myIdx = 0;
    playDialog('minyu', 'joss', true, function () { started++; });
    ck($('dialog').style.display === 'flex', '대사 화면이 안 뜬다');
    ck($('dlgText').textContent.length >= 0 && $('dlgWho') !== null, '대사창이 비어 있다');
    for (var s25 = 0; s25 < 8; s25++) { dlgNext(); dlgNext(); }
    ck(started === 1, '대사를 다 넘겼는데 대전으로 안 넘어간다');
    var r25 = $('dlgWrap').getBoundingClientRect();
    ck(r25.left >= -1 && r25.right <= window.innerWidth + 1, '대사 화면이 옆으로 넘친다');
    // 막 화면(프롤로그)
    showChapter('1막', '민유', ST.prologue.minyu, '계속', function () {});
    ck($('chBody').textContent.length > 60, '프롤로그 화면이 비어 있다');
    // 이야기 화면 — 안 깬 캐릭터의 결말은 잠겨 있어야 한다
    var savedCleared = SAVE.cleared;
    SAVE.cleared = {};
    buildStory(0);
    ck($('storyBody').innerHTML.indexOf('🔒') >= 0, '안 깬 캐릭터의 결말이 그냥 보인다');
    SAVE.cleared = { minyu: true };
    buildStory(0);
    ck($('storyBody').innerHTML.indexOf('🔒') < 0, '깬 캐릭터인데 결말이 잠겨 있다');
    SAVE.cleared = savedCleared;
    buildStory(-1);
    ck($('storyBody').textContent.indexOf('조스클럽') >= 0, '이야기 화면에 대회 이야기가 없다');
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

window.__joss_ui = { UI: UI, beginMatch: beginMatch, openSelect: openSelect, toTitle: toTitle,
  show: show, playDialog: playDialog, dlgNext: dlgNext, showChapter: showChapter,
  buildStory: buildStory, buildControls: buildControls, buildMoveList: buildMoveList };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
