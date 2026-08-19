/* ============================================================
   미뉴 파이터 — 뼈대와 동작 (menewsoft.com AI 인디게임)

   ★왜 뼈대인가
     캐릭터 10명 × 동작 20종을 그림으로 찍으면 200장이다. 그리고 그림이 200장이 되는 순간
     **캐릭터마다 판정 상자가 미묘하게 달라진다** — 격투게임에서 그건 곧 불공평이다.
     그래서 뼈대 하나를 모두가 공유하고, 캐릭터는 **색·머리·덩치·소품**으로만 갈린다.

   ★각도 규칙 (뒤집지 말 것)
     모든 각도는 라디안. **0 = 아래(발 쪽), π/2 = 앞(바라보는 쪽), π = 위**.
       dir(a) = (sin a, cos a)
     팔을 늘어뜨리면 0, 앞으로 뻗으면 π/2, 위로 들면 π.
     몸통은 골반에서 위로 자라므로 서 있으면 π 근처, 앞으로 숙이면 π - 0.2.
     ⚠️상대 각도가 아니라 **절대 각도**다. 관절을 이어 붙이며 각도를 더하지 않는다
       (더하기 시작하면 포즈 하나를 고칠 때마다 아래 관절이 전부 틀어진다).

   포즈 = { y, torso, head, aU:[뒤,앞], aF:[뒤,앞], lU:[뒤,앞], lS:[뒤,앞] }
     · aU 위팔 / aF 아래팔 / lU 허벅지 / lS 정강이, 각 배열은 [먼 쪽, 가까운 쪽]
     · y 는 골반 높이 보정(+가 아래로 내려앉음)
   동작 = [{ t: 프레임수, p: 포즈 }, …]  — 사이는 부드럽게 이어 준다(보간).
   ============================================================ */
(function () {
'use strict';

var P = Math.PI;

/** 포즈를 조금씩 고쳐 쓸 때 쓰는 도구 — 원본을 건드리지 않는다. */
function pose(base, over) {
  var o = {
    y: base.y, torso: base.torso, head: base.head,
    aU: base.aU.slice(), aF: base.aF.slice(),
    lU: base.lU.slice(), lS: base.lS.slice(),
  };
  if (over) for (var k in over) o[k] = over[k].slice ? over[k].slice() : over[k];
  return o;
}

/* ---------- 기본 자세들 ---------- */
var STAND = {
  y: 0, torso: P - 0.10, head: 0.04,
  aU: [0.30, 0.55], aF: [0.95, 1.15],
  lU: [-0.16, 0.20], lS: [0.06, 0.02],
};
var CROUCH = {
  y: 22, torso: P - 0.30, head: 0.10,
  aU: [0.45, 0.70], aF: [1.25, 1.45],
  lU: [-0.85, 0.95], lS: [1.05, -0.80],
};

/* 각 동작의 마지막 칸은 그대로 멈춰 있는 자세다(그 상태로 유지). */
var ANIM = {
  /* 대기 — 숨 쉬는 정도만 움직인다. 격투게임의 대기 자세는 '준비된 몸'이어야 한다. */
  idle: [
    { t: 14, p: pose(STAND) },
    { t: 14, p: pose(STAND, { y: -2, torso: P - 0.13, aU: [0.24, 0.50], aF: [0.90, 1.10] }) },
  ],
  walk: [
    { t: 7, p: pose(STAND, { lU: [-0.50, 0.55], lS: [0.30, -0.35], aU: [0.55, 0.20], aF: [1.05, 0.95] }) },
    { t: 7, p: pose(STAND, { lU: [0.00, 0.05], lS: [0.05, 0.00], aU: [0.35, 0.45], aF: [1.00, 1.05] }) },
    { t: 7, p: pose(STAND, { lU: [0.55, -0.50], lS: [-0.35, 0.30], aU: [0.20, 0.55], aF: [0.95, 1.05] }) },
    { t: 7, p: pose(STAND, { lU: [0.00, 0.05], lS: [0.05, 0.00], aU: [0.35, 0.45], aF: [1.00, 1.05] }) },
  ],
  back: [
    { t: 8, p: pose(STAND, { lU: [-0.40, 0.42], lS: [0.24, -0.26], aU: [0.45, 0.30] }) },
    { t: 8, p: pose(STAND, { lU: [0.05, -0.05] }) },
    { t: 8, p: pose(STAND, { lU: [0.42, -0.40], lS: [-0.26, 0.24], aU: [0.30, 0.45] }) },
    { t: 8, p: pose(STAND, { lU: [0.05, -0.05] }) },
  ],
  /* 달리기 — 몸을 앞으로 던지듯 기울인다(걷기와 실루엣부터 달라야 한다) */
  run: [
    { t: 5, p: pose(STAND, { y: 2, torso: P - 0.34, lU: [-0.80, 0.85], lS: [0.75, -0.55], aU: [1.10, -0.35], aF: [1.70, 0.30] }) },
    { t: 5, p: pose(STAND, { y: -3, torso: P - 0.30, lU: [-0.15, 0.20], lS: [0.35, 0.10], aU: [0.55, 0.20], aF: [1.35, 0.85] }) },
    { t: 5, p: pose(STAND, { y: 2, torso: P - 0.34, lU: [0.85, -0.80], lS: [-0.55, 0.75], aU: [-0.35, 1.10], aF: [0.30, 1.70] }) },
    { t: 5, p: pose(STAND, { y: -3, torso: P - 0.30, lU: [0.20, -0.15], lS: [0.10, 0.35], aU: [0.20, 0.55], aF: [0.85, 1.35] }) },
  ],
  crouch: [
    { t: 3, p: pose(STAND, { y: 10, lU: [-0.45, 0.5], lS: [0.5, -0.4] }) },
    { t: 6, p: pose(CROUCH) },
  ],
  jumpUp: [
    { t: 4, p: pose(STAND, { y: 12, torso: P - 0.22, lU: [-0.55, 0.60], lS: [0.65, -0.5], aU: [-0.5, -0.45], aF: [-0.2, -0.15] }) },
    { t: 10, p: pose(STAND, { y: -6, torso: P - 0.06, lU: [-0.55, 0.35], lS: [0.75, 0.25], aU: [2.1, 2.3], aF: [2.4, 2.5] }) },
  ],
  jumpFall: [
    { t: 10, p: pose(STAND, { y: -4, torso: P - 0.02, lU: [-0.35, 0.55], lS: [0.55, 0.15], aU: [1.9, 2.2], aF: [2.2, 2.4] }) },
  ],
  land: [
    { t: 5, p: pose(STAND, { y: 14, torso: P - 0.28, lU: [-0.55, 0.60], lS: [0.70, -0.5], aU: [0.7, 0.9], aF: [1.3, 1.5] }) },
  ],

  /* ---------- 공격 ----------
     각 동작의 칸 수는 캐릭터 자료의 startup/active/recovery 와 **맞물려야** 한다.
     맞물리지 않으면 "때리는 그림"과 "판정이 나오는 순간"이 어긋나 보인다. */
  lp: [   // 약손 — 짧게 찌른다
    { t: 3, p: pose(STAND, { aU: [0.35, 1.25], aF: [1.00, 1.35] }) },
    { t: 3, p: pose(STAND, { torso: P - 0.16, aU: [0.35, 1.55], aF: [1.05, 1.60] }) },
    { t: 5, p: pose(STAND, { aU: [0.35, 1.00], aF: [1.00, 1.30] }) },
  ],
  hp: [   // 강손 — 허리를 돌려 크게 지른다
    { t: 6, p: pose(STAND, { torso: P + 0.14, aU: [-0.35, 0.55], aF: [-0.55, 1.10] }) },
    { t: 4, p: pose(STAND, { y: -2, torso: P - 0.24, aU: [0.55, 1.62], aF: [1.35, 1.66] }) },
    { t: 9, p: pose(STAND, { torso: P - 0.12, aU: [0.45, 1.10], aF: [1.15, 1.40] }) },
  ],
  lk: [   // 약발 — 앞발로 툭
    { t: 3, p: pose(STAND, { lU: [-0.10, 0.75], lS: [0.10, 0.55] }) },
    { t: 3, p: pose(STAND, { torso: P - 0.02, lU: [-0.12, 1.35], lS: [0.12, 1.42] }) },
    { t: 6, p: pose(STAND, { lU: [-0.10, 0.55], lS: [0.10, 0.30] }) },
  ],
  hk: [   // 강발 — 몸을 젖히며 돌려찬다
    { t: 7, p: pose(STAND, { y: -2, torso: P + 0.18, lU: [-0.30, 0.35], lS: [0.30, 0.65] }) },
    { t: 5, p: pose(STAND, { y: -6, torso: P + 0.30, lU: [-0.45, 1.70], lS: [0.35, 1.75] }) },
    { t: 12, p: pose(STAND, { y: -1, torso: P - 0.05, lU: [-0.20, 0.70], lS: [0.20, 0.45] }) },
  ],
  clp: [  // 앉아 약손
    { t: 3, p: pose(CROUCH, { aU: [0.5, 1.35], aF: [1.3, 1.45] }) },
    { t: 3, p: pose(CROUCH, { aU: [0.5, 1.60], aF: [1.3, 1.66] }) },
    { t: 5, p: pose(CROUCH) },
  ],
  clk: [  // 앉아 약발(하단) — 발목을 쓸어 찬다
    { t: 4, p: pose(CROUCH, { lU: [-0.9, 1.25], lS: [1.0, 1.35] }) },
    { t: 4, p: pose(CROUCH, { y: 26, lU: [-0.95, 1.62], lS: [1.05, 1.68] }) },
    { t: 7, p: pose(CROUCH) },
  ],
  chk: [  // 앉아 강발(다리 후리기) — 넘어뜨린다
    { t: 6, p: pose(CROUCH, { y: 28, torso: P - 0.55, lU: [-1.05, 1.05], lS: [1.15, 1.25] }) },
    { t: 5, p: pose(CROUCH, { y: 32, torso: P - 0.70, lU: [-1.15, 1.68], lS: [1.25, 1.72] }) },
    { t: 13, p: pose(CROUCH, { y: 26 }) },
  ],
  jp: [   // 점프 손
    { t: 4, p: pose(STAND, { y: -4, torso: P - 0.20, aU: [0.4, 1.45], aF: [1.1, 1.55], lU: [-0.5, 0.4], lS: [0.7, 0.2] }) },
    { t: 10, p: pose(STAND, { y: -4, torso: P - 0.24, aU: [0.4, 1.62], aF: [1.1, 1.66], lU: [-0.5, 0.4], lS: [0.7, 0.2] }) },
  ],
  jk: [   // 점프 발 — 무릎을 접었다 편다
    { t: 4, p: pose(STAND, { y: -4, torso: P - 0.10, lU: [-0.5, 1.05], lS: [0.7, 1.35], aU: [1.6, 1.9], aF: [1.9, 2.1] }) },
    { t: 12, p: pose(STAND, { y: -4, torso: P - 0.06, lU: [-0.5, 1.55], lS: [0.7, 1.62], aU: [1.6, 1.9], aF: [1.9, 2.1] }) },
  ],

  /* ---------- 필살기 자세 ---------- */
  fire: [   // 장풍 — 허리를 낮췄다가 두 손을 앞으로 밀어낸다
    { t: 8, p: pose(STAND, { y: 6, torso: P - 0.34, aU: [-0.30, -0.10], aF: [0.35, 0.55] }) },
    { t: 6, p: pose(STAND, { y: -2, torso: P - 0.16, aU: [1.35, 1.45], aF: [1.55, 1.60] }) },
    { t: 14, p: pose(STAND, { torso: P - 0.12, aU: [0.9, 1.0], aF: [1.3, 1.35] }) },
  ],
  upper: [  // 대공기(승룡형) — 몸을 감았다가 솟구친다
    { t: 5, p: pose(STAND, { y: 12, torso: P - 0.40, aU: [-0.25, 0.15], aF: [0.55, 0.95], lU: [-0.6, 0.65], lS: [0.7, -0.5] }) },
    { t: 6, p: pose(STAND, { y: -16, torso: P + 0.10, aU: [0.2, 2.75], aF: [0.6, 2.85], lU: [-0.35, 0.55], lS: [0.9, 0.35] }) },
    { t: 16, p: pose(STAND, { y: -4, torso: P + 0.05, aU: [0.4, 2.2], aF: [0.9, 2.3], lU: [-0.3, 0.5], lS: [0.7, 0.3] }) },
  ],
  spin: [   // 회전 발차기 — 다리를 크게 돌린다
    { t: 5, p: pose(STAND, { y: -4, torso: P + 0.22, lU: [-0.45, 0.9], lS: [0.35, 1.2] }) },
    { t: 4, p: pose(STAND, { y: -10, torso: P + 0.05, lU: [-0.2, 1.72], lS: [0.5, 1.75] }) },
    { t: 4, p: pose(STAND, { y: -10, torso: P - 0.35, lU: [1.72, -0.2], lS: [1.75, 0.5] }) },
    { t: 12, p: pose(STAND, { y: -2, torso: P - 0.10, lU: [-0.2, 0.6], lS: [0.3, 0.35] }) },
  ],
  dash: [   // 돌진기 — 어깨부터 들어간다
    { t: 6, p: pose(STAND, { y: 8, torso: P - 0.55, aU: [-0.2, 1.1], aF: [0.5, 1.5], lU: [-0.7, 0.7], lS: [0.8, -0.4] }) },
    { t: 10, p: pose(STAND, { y: 4, torso: P - 0.75, aU: [-0.3, 1.45], aF: [0.4, 1.62], lU: [-0.95, 0.85], lS: [1.0, 0.3] }) },
    { t: 14, p: pose(STAND, { y: 2, torso: P - 0.35, aU: [0.2, 1.0], aF: [0.9, 1.3] }) },
  ],
  super: [  // 초필살기 — 힘을 모았다가 터뜨린다
    { t: 14, p: pose(STAND, { y: 10, torso: P - 0.05, aU: [-0.55, -0.5], aF: [-0.15, -0.1], lU: [-0.6, 0.6], lS: [0.7, -0.5] }) },
    { t: 8, p: pose(STAND, { y: -8, torso: P - 0.20, aU: [1.5, 1.55], aF: [1.62, 1.66] }) },
    { t: 26, p: pose(STAND, { y: -2, torso: P - 0.12, aU: [1.0, 1.1], aF: [1.35, 1.4] }) },
  ],

  /* ---------- 맞고 막고 넘어지고 ---------- */
  block: [
    { t: 2, p: pose(STAND, { y: 2, torso: P - 0.02, aU: [0.9, 1.15], aF: [2.1, 2.25], lU: [-0.35, 0.45], lS: [0.35, -0.2] }) },
  ],
  blockLow: [
    { t: 2, p: pose(CROUCH, { aU: [1.0, 1.2], aF: [2.2, 2.35] }) },
  ],
  hit: [
    { t: 4, p: pose(STAND, { y: -2, torso: P + 0.30, head: -0.45, aU: [-0.5, -0.2], aF: [-0.9, -0.4], lU: [0.25, -0.30], lS: [-0.15, 0.2] }) },
    { t: 8, p: pose(STAND, { torso: P + 0.14, head: -0.2, aU: [-0.2, 0.1], aF: [-0.3, 0.3] }) },
  ],
  hitLow: [
    { t: 4, p: pose(CROUCH, { torso: P + 0.35, head: -0.4, aU: [-0.4, -0.1], aF: [-0.7, -0.2] }) },
    { t: 8, p: pose(CROUCH, { torso: P + 0.10 }) },
  ],
  down: [   // 넘어짐 — 뒤로 날아가 등으로 떨어진다
    { t: 6, p: pose(STAND, { y: 6, torso: P + 0.75, head: -0.6, aU: [-0.9, -0.7], aF: [-1.3, -1.0], lU: [0.9, 0.5], lS: [0.2, 0.6] }) },
    { t: 10, p: pose(STAND, { y: 34, torso: P + 1.45, head: -0.9, aU: [-1.4, -1.2], aF: [-1.8, -1.5], lU: [1.5, 1.2], lS: [1.0, 1.3] }) },
    { t: 18, p: pose(STAND, { y: 40, torso: P + 1.55, head: -1.0, aU: [-1.5, -1.3], aF: [-1.9, -1.6], lU: [1.6, 1.35], lS: [1.2, 1.4] }) },
  ],
  getup: [
    { t: 8, p: pose(STAND, { y: 30, torso: P + 0.9, aU: [-0.8, -0.5], aF: [-1.0, -0.6], lU: [1.1, 0.8], lS: [0.6, 0.9] }) },
    { t: 8, p: pose(STAND, { y: 12, torso: P - 0.45, aU: [0.2, 0.5], aF: [0.9, 1.1], lU: [-0.6, 0.6], lS: [0.7, -0.4] }) },
    { t: 4, p: pose(STAND) },
  ],
  win: [
    { t: 18, p: pose(STAND, { y: -2, torso: P - 0.05, aU: [0.4, 2.55], aF: [1.0, 2.75], lU: [-0.2, 0.25], lS: [0.1, 0.05] }) },
    { t: 18, p: pose(STAND, { y: 2, torso: P - 0.12, aU: [0.4, 2.35], aF: [1.0, 2.6] }) },
  ],
  lose: [
    { t: 40, p: pose(STAND, { y: 38, torso: P + 1.5, head: -1.0, aU: [-1.4, -1.2], aF: [-1.8, -1.5], lU: [1.5, 1.2], lS: [1.1, 1.35] }) },
  ],
  intro: [
    { t: 20, p: pose(STAND, { y: 4, torso: P - 0.25, aU: [1.25, 0.2], aF: [1.75, 0.6], lU: [-0.45, 0.5], lS: [0.5, -0.3] }) },
    { t: 16, p: pose(STAND) },
  ],
};

/* ---------- 보간 ---------- */
function lerp(a, b, t) { return a + (b - a) * t; }

/** 동작의 frame 번째 포즈. loop 면 되돌아 이어지고, 아니면 마지막 자세로 멈춘다. */
function poseAt(name, frame, loop) {
  var seq = ANIM[name] || ANIM.idle;
  var total = 0, i;
  for (i = 0; i < seq.length; i++) total += seq[i].t;
  var f = loop ? ((frame % total) + total) % total : Math.min(frame, total - 0.001);
  var acc = 0;
  for (i = 0; i < seq.length; i++) {
    if (f < acc + seq[i].t) {
      var k = (f - acc) / seq[i].t;
      var a = seq[i].p;
      var b = (loop || i < seq.length - 1) ? seq[(i + 1) % seq.length].p : a;
      return blend(a, b, k);
    }
    acc += seq[i].t;
  }
  return seq[seq.length - 1].p;
}

function blend(a, b, k) {
  var o = { y: lerp(a.y, b.y, k), torso: lerp(a.torso, b.torso, k), head: lerp(a.head, b.head, k),
            aU: [], aF: [], lU: [], lS: [] };
  ['aU', 'aF', 'lU', 'lS'].forEach(function (key) {
    o[key][0] = lerp(a[key][0], b[key][0], k);
    o[key][1] = lerp(a[key][1], b[key][1], k);
  });
  return o;
}

function animLength(name) {
  var seq = ANIM[name] || ANIM.idle, t = 0;
  for (var i = 0; i < seq.length; i++) t += seq[i].t;
  return t;
}

/* ---------- 그리기 ----------
   dir(a) = (sin a, cos a) — 0 은 아래, π/2 는 앞, π 는 위. */
function seg(x, y, ang, len) { return [x + Math.sin(ang) * len, y + Math.cos(ang) * len]; }

/** 뼈 하나 — 끝으로 갈수록 가늘어지는 몸통을 그린다. */
function limb(cx, x1, y1, x2, y2, w1, w2, col, edge) {
  var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  var nx = -dy / L, ny = dx / L;
  cx.beginPath();
  cx.moveTo(x1 + nx * w1, y1 + ny * w1);
  cx.lineTo(x2 + nx * w2, y2 + ny * w2);
  cx.lineTo(x2 - nx * w2, y2 - ny * w2);
  cx.lineTo(x1 - nx * w1, y1 - ny * w1);
  cx.closePath();
  cx.fillStyle = col; cx.fill();
  if (edge) { cx.strokeStyle = edge; cx.lineWidth = 1.4; cx.stroke(); }
  cx.beginPath(); cx.arc(x2, y2, w2, 0, 7); cx.fillStyle = col; cx.fill();
}

/**
 * 파이터 한 명을 그린다.
 *  cx: 캔버스, x·y: 발이 닿는 자리, face: 1(오른쪽 보기)/-1, ch: 캐릭터 자료, p: 포즈
 *  ★뼈 길이는 모두가 같다 — 판정 상자가 캐릭터마다 갈리면 안 된다. 덩치는 scale 로만 바꾼다.
 */
function drawFighter(cx, x, y, face, ch, p, opt) {
  opt = opt || {};
  var s = (ch.scale || 1) * (opt.zoom || 1);
  var C = ch.col;
  cx.save();
  cx.translate(x, y);
  cx.scale(face * s, s);
  if (opt.alpha !== undefined) cx.globalAlpha = opt.alpha;

  var PELVIS_Y = -46 + p.y;
  var px = 0, py = PELVIS_Y;
  var chest = seg(px, py, p.torso, 30);
  var cxp = chest[0], cyp = chest[1];
  var headC = seg(cxp, cyp, p.torso + p.head, 15);
  var edge = 'rgba(12,10,20,.55)';

  // 뒤쪽 팔·다리 먼저(멀리 있는 것부터)
  var hipB = [px - 3, py], hipF = [px + 3, py];
  var shB = [cxp - 4, cyp + 2], shF = [cxp + 4, cyp + 2];

  drawLeg(cx, hipB, p.lU[0], p.lS[0], C.pantsDark, C.shoeDark, edge);
  drawArm(cx, shB, p.aU[0], p.aF[0], C.sleeveDark, C.skinDark, edge);

  // 몸통
  limb(cx, px, py, cxp, cyp, 12, 13, C.top, edge);
  if (C.beltCol) {
    cx.save(); cx.translate(px, py); cx.rotate(-(p.torso - Math.PI));
    cx.fillStyle = C.beltCol; cx.fillRect(-12, -5, 24, 7); cx.restore();
  }
  if (ch.draw && ch.draw.torso) ch.draw.torso(cx, px, py, cxp, cyp, p);

  // 앞쪽 다리·팔
  drawLeg(cx, hipF, p.lU[1], p.lS[1], C.pants, C.shoe, edge);

  // 머리
  var hx = headC[0], hy = headC[1];
  limb(cx, cxp, cyp, hx, hy, 6, 6, C.skin, edge);   // 목
  cx.save();
  cx.translate(hx, hy);
  cx.rotate(-(p.torso + p.head - Math.PI));
  cx.fillStyle = C.skin;
  cx.beginPath(); cx.ellipse(0, 0, 11, 12.5, 0, 0, 7); cx.fill();
  cx.strokeStyle = edge; cx.lineWidth = 1.4; cx.stroke();
  // 눈 — 앞쪽만 보이게(옆얼굴)
  cx.fillStyle = '#20141a';
  cx.beginPath(); cx.ellipse(5.4, -1.6, 1.9, 2.4, 0, 0, 7); cx.fill();
  cx.fillStyle = 'rgba(255,255,255,.9)';
  cx.beginPath(); cx.arc(6, -2.4, 0.7, 0, 7); cx.fill();
  // 눈썹 — 격투가는 늘 인상을 쓰고 있다
  cx.strokeStyle = C.hair; cx.lineWidth = 2;
  cx.beginPath(); cx.moveTo(3.2, -6.2); cx.lineTo(8.2, -4.6); cx.stroke();
  // 입
  cx.strokeStyle = 'rgba(60,26,30,.8)'; cx.lineWidth = 1.3;
  cx.beginPath(); cx.moveTo(6.5, 4.6); cx.lineTo(9.6, 4.2); cx.stroke();
  if (ch.draw && ch.draw.head) ch.draw.head(cx, C);
  else defaultHair(cx, C);
  cx.restore();

  drawArm(cx, shF, p.aU[1], p.aF[1], C.sleeve, C.skin, edge);

  cx.restore();
}

function defaultHair(cx, C) {
  cx.fillStyle = C.hair;
  cx.beginPath();
  cx.moveTo(-11, -4); cx.quadraticCurveTo(-9, -15, 2, -13.5);
  cx.quadraticCurveTo(12, -12, 10.5, -3.5);
  cx.quadraticCurveTo(6, -9, -2, -8);
  cx.quadraticCurveTo(-8, -7.5, -11, -4);
  cx.closePath(); cx.fill();
}

function drawArm(cx, sh, aU, aF, sleeve, skin, edge) {
  var el = seg(sh[0], sh[1], aU, 18);
  var hand = seg(el[0], el[1], aF, 17);
  limb(cx, sh[0], sh[1], el[0], el[1], 6.5, 5.2, sleeve, edge);
  limb(cx, el[0], el[1], hand[0], hand[1], 5, 4.2, skin, edge);
  cx.beginPath(); cx.arc(hand[0], hand[1], 5.4, 0, 7); cx.fillStyle = skin; cx.fill();
  cx.strokeStyle = edge; cx.lineWidth = 1.2; cx.stroke();
}

function drawLeg(cx, hip, lU, lS, pants, shoe, edge) {
  var kn = seg(hip[0], hip[1], lU, 20);
  var ft = seg(kn[0], kn[1], lS, 20);
  limb(cx, hip[0], hip[1], kn[0], kn[1], 8.5, 6.5, pants, edge);
  limb(cx, kn[0], kn[1], ft[0], ft[1], 6, 5, pants, edge);
  // 신발 — 발끝이 앞을 향한다
  cx.save();
  cx.translate(ft[0], ft[1]);
  cx.rotate(-(lS - Math.PI) * 0.25);
  cx.fillStyle = shoe;
  cx.beginPath();
  cx.moveTo(-5, -3); cx.lineTo(9, -2); cx.quadraticCurveTo(12, 3, 8, 4);
  cx.lineTo(-5, 4); cx.closePath(); cx.fill();
  cx.strokeStyle = edge; cx.lineWidth = 1.2; cx.stroke();
  cx.restore();
}

/** 그 포즈에서 앞손·앞발이 실제로 닿는 자리(타격 효과를 그 자리에 띄우려고 쓴다) */
function handPos(p, face, s) {
  var py = -46 + p.y;
  var chest = seg(0, py, p.torso, 30);
  var sh = [chest[0] + 4, chest[1] + 2];
  var el = seg(sh[0], sh[1], p.aU[1], 18);
  var hand = seg(el[0], el[1], p.aF[1], 17);
  return { x: hand[0] * face * s, y: hand[1] * s };
}
function footPos(p, face, s) {
  var py = -46 + p.y;
  var hip = [3, py];
  var kn = seg(hip[0], hip[1], p.lU[1], 20);
  var ft = seg(kn[0], kn[1], p.lS[1], 20);
  return { x: ft[0] * face * s, y: ft[1] * s };
}

window.FIGHTANIM = {
  ANIM: ANIM, pose: pose, STAND: STAND, CROUCH: CROUCH,
  poseAt: poseAt, animLength: animLength, drawFighter: drawFighter,
  handPos: handPos, footPos: footPos, blend: blend,
};
})();
