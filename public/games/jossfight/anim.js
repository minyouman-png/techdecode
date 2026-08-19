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
    // xA·xL = 앞손·앞발 **뻗기 배율**. 각도만으로는 타격이 커 보이지 않는다 —
    // 옛 격투게임 스프라이트는 때리는 순간 팔다리를 실제보다 길게, 주먹은 크게 그린다.
    xA: base.xA === undefined ? 1 : base.xA,
    xL: base.xL === undefined ? 1 : base.xL,
    aU: base.aU.slice(), aF: base.aF.slice(),
    lU: base.lU.slice(), lS: base.lS.slice(),
  };
  if (over) for (var k in over) o[k] = over[k].slice ? over[k].slice() : over[k];
  return o;
}

/* ---------- 기본 자세들 ---------- */
/* ★대기 자세가 그 게임의 얼굴이다. 팔을 늘어뜨리고 두 발을 모으고 서 있으면 아무리 잘
   그려도 '싸우러 온 사람'으로 보이지 않는다 — 앞발을 내고, 무릎을 굽히고, 주먹을 올린다. */
var STAND = {
  y: 3, torso: P - 0.13, head: 0.05,
  aU: [0.52, 0.90], aF: [1.32, 1.78],     // 뒷손은 가슴 앞, 앞손은 얼굴 앞으로
  lU: [-0.50, 0.42], lS: [0.30, -0.12],   // 뒷발은 뒤에서 버티고 앞발은 앞으로
};
var CROUCH = {
  y: 22, torso: P - 0.30, head: 0.10,
  aU: [0.55, 0.86], aF: [1.30, 1.62],
  lU: [-0.85, 0.95], lS: [1.05, -0.80],
};

/* 각 동작의 마지막 칸은 그대로 멈춰 있는 자세다(그 상태로 유지). */
var ANIM = {
  /* 대기 — 숨 쉬는 정도만 움직인다. 격투게임의 대기 자세는 '준비된 몸'이어야 한다. */
  idle: [
    { t: 14, p: pose(STAND) },
    { t: 14, p: pose(STAND, { y: 1, torso: P - 0.16, aU: [0.48, 0.86], aF: [1.28, 1.72] }) },
  ],
  walk: [
    { t: 7, p: pose(STAND, { lU: [-0.62, 0.60], lS: [0.34, -0.30], aU: [0.58, 0.82], aF: [1.36, 1.70] }) },
    { t: 7, p: pose(STAND, { lU: [-0.20, 0.22], lS: [0.18, 0.02], aU: [0.52, 0.90], aF: [1.30, 1.78] }) },
    { t: 7, p: pose(STAND, { lU: [0.44, -0.44], lS: [-0.30, 0.34], aU: [0.46, 0.96], aF: [1.26, 1.82] }) },
    { t: 7, p: pose(STAND, { lU: [-0.20, 0.22], lS: [0.18, 0.02], aU: [0.52, 0.90], aF: [1.30, 1.78] }) },
  ],
  back: [
    { t: 8, p: pose(STAND, { lU: [-0.56, 0.46], lS: [0.30, -0.22], aU: [0.56, 0.84], aF: [1.34, 1.72] }) },
    { t: 8, p: pose(STAND, { lU: [-0.30, 0.14], lS: [0.22, 0.06] }) },
    { t: 8, p: pose(STAND, { lU: [0.30, -0.52], lS: [-0.20, 0.32], aU: [0.48, 0.94], aF: [1.28, 1.80] }) },
    { t: 8, p: pose(STAND, { lU: [-0.30, 0.14], lS: [0.22, 0.06] }) },
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
    { t: 3, p: pose(STAND, { aU: [0.30, 1.20], aF: [0.95, 1.30] }) },
    { t: 3, p: pose(STAND, { torso: P - 0.20, xA: 1.14, aU: [0.30, 1.58], aF: [1.05, 1.62] }) },
    { t: 5, p: pose(STAND, { xA: 1.03, aU: [0.35, 1.00], aF: [1.00, 1.30] }) },
  ],
  hp: [   // 강손 — 허리를 크게 돌려 지른다(감았다가 몸째 실어 보낸다)
    { t: 6, p: pose(STAND, { y: 3, torso: P + 0.26, xA: 0.90, aU: [-0.55, 0.30], aF: [-0.80, 0.75], lU: [-0.35, 0.40], lS: [0.30, -0.20] }) },
    { t: 4, p: pose(STAND, { y: -4, torso: P - 0.32, xA: 1.26, aU: [0.70, 1.60], aF: [1.45, 1.64], lU: [-0.55, 0.60], lS: [0.45, 0.05] }) },
    { t: 9, p: pose(STAND, { y: -1, torso: P - 0.14, xA: 1.06, aU: [0.45, 1.10], aF: [1.15, 1.40] }) },
  ],
  lk: [   // 약발 — 앞발로 툭, 그래도 다리는 시원하게 편다
    { t: 3, p: pose(STAND, { lU: [-0.12, 0.85], lS: [0.10, 0.60] }) },
    { t: 3, p: pose(STAND, { torso: P + 0.08, xL: 1.16, lU: [-0.18, 1.42], lS: [0.14, 1.50] }) },
    { t: 6, p: pose(STAND, { xL: 1.04, lU: [-0.10, 0.55], lS: [0.10, 0.30] }) },
  ],
  hk: [   // 강발 — 몸을 크게 젖히며 머리 높이까지 돌려찬다
    { t: 7, p: pose(STAND, { y: -3, torso: P + 0.26, xL: 0.94, lU: [-0.35, 0.30], lS: [0.35, 0.80], aU: [-0.30, 0.95], aF: [-0.10, 1.50] }) },
    { t: 5, p: pose(STAND, { y: -9, torso: P + 0.40, xL: 1.28, lU: [-0.55, 1.78], lS: [0.40, 1.82], aU: [-0.55, 1.35], aF: [-0.35, 1.95] }) },
    { t: 12, p: pose(STAND, { y: -1, torso: P - 0.05, xL: 1.06, lU: [-0.20, 0.70], lS: [0.20, 0.45] }) },
  ],
  clp: [  // 앉아 약손
    { t: 3, p: pose(CROUCH, { aU: [0.5, 1.35], aF: [1.3, 1.45] }) },
    { t: 3, p: pose(CROUCH, { xA: 1.16, aU: [0.5, 1.58], aF: [1.3, 1.64] }) },
    { t: 5, p: pose(CROUCH) },
  ],
  clk: [  // 앉아 약발(하단) — 발목을 쓸어 찬다
    { t: 4, p: pose(CROUCH, { lU: [-0.9, 1.25], lS: [1.0, 1.35] }) },
    { t: 4, p: pose(CROUCH, { y: 26, xL: 1.20, lU: [-0.95, 1.66], lS: [1.05, 1.72] }) },
    { t: 7, p: pose(CROUCH) },
  ],
  chk: [  // 앉아 강발(다리 후리기) — 넘어뜨린다
    { t: 6, p: pose(CROUCH, { y: 28, torso: P - 0.55, lU: [-1.05, 1.05], lS: [1.15, 1.25] }) },
    { t: 5, p: pose(CROUCH, { y: 32, torso: P - 0.80, xL: 1.26, lU: [-1.15, 1.72], lS: [1.25, 1.76] }) },
    { t: 13, p: pose(CROUCH, { y: 26 }) },
  ],
  jp: [   // 점프 손
    { t: 4, p: pose(STAND, { y: -4, torso: P - 0.20, aU: [0.4, 1.45], aF: [1.1, 1.55], lU: [-0.5, 0.4], lS: [0.7, 0.2] }) },
    { t: 10, p: pose(STAND, { y: -4, torso: P - 0.28, xA: 1.20, aU: [0.4, 1.60], aF: [1.1, 1.66], lU: [-0.5, 0.4], lS: [0.7, 0.2] }) },
  ],
  jk: [   // 점프 발 — 무릎을 접었다 편다
    { t: 4, p: pose(STAND, { y: -4, torso: P - 0.10, lU: [-0.5, 1.05], lS: [0.7, 1.35], aU: [1.6, 1.9], aF: [1.9, 2.1] }) },
    { t: 12, p: pose(STAND, { y: -4, torso: P - 0.06, xL: 1.24, lU: [-0.5, 1.58], lS: [0.7, 1.66], aU: [1.6, 1.9], aF: [1.9, 2.1] }) },
  ],

  /* ---------- 필살기 자세 ---------- */
  fire: [   // 장풍 — 허리를 낮췄다가 두 손을 앞으로 밀어낸다
    { t: 8, p: pose(STAND, { y: 6, torso: P - 0.34, aU: [-0.30, -0.10], aF: [0.35, 0.55] }) },
    { t: 6, p: pose(STAND, { y: -2, torso: P - 0.16, xA: 1.18, aU: [1.35, 1.45], aF: [1.55, 1.60] }) },
    { t: 14, p: pose(STAND, { torso: P - 0.12, aU: [0.9, 1.0], aF: [1.3, 1.35] }) },
  ],
  upper: [  // 대공기(승룡형) — 몸을 감았다가 솟구친다
    { t: 5, p: pose(STAND, { y: 12, torso: P - 0.40, aU: [-0.25, 0.15], aF: [0.55, 0.95], lU: [-0.6, 0.65], lS: [0.7, -0.5] }) },
    { t: 6, p: pose(STAND, { y: -18, torso: P + 0.10, xA: 1.20, aU: [0.2, 2.80], aF: [0.6, 2.90], lU: [-0.35, 0.55], lS: [0.9, 0.35] }) },
    { t: 16, p: pose(STAND, { y: -4, torso: P + 0.05, aU: [0.4, 2.2], aF: [0.9, 2.3], lU: [-0.3, 0.5], lS: [0.7, 0.3] }) },
  ],
  spin: [   // 회전 발차기 — 다리를 크게 돌린다
    { t: 5, p: pose(STAND, { y: -4, torso: P + 0.22, lU: [-0.45, 0.9], lS: [0.35, 1.2] }) },
    { t: 4, p: pose(STAND, { y: -12, torso: P + 0.05, xL: 1.26, lU: [-0.2, 1.80], lS: [0.5, 1.82] }) },
    { t: 4, p: pose(STAND, { y: -12, torso: P - 0.38, xL: 1.26, lU: [1.80, -0.2], lS: [1.82, 0.5] }) },
    { t: 12, p: pose(STAND, { y: -2, torso: P - 0.10, lU: [-0.2, 0.6], lS: [0.3, 0.35] }) },
  ],
  dash: [   // 돌진기 — 어깨부터 들어간다
    { t: 6, p: pose(STAND, { y: 8, torso: P - 0.55, aU: [-0.2, 1.1], aF: [0.5, 1.5], lU: [-0.7, 0.7], lS: [0.8, -0.4] }) },
    { t: 10, p: pose(STAND, { y: 4, torso: P - 0.80, xA: 1.18, aU: [-0.3, 1.48], aF: [0.4, 1.64], lU: [-0.95, 0.85], lS: [1.0, 0.3] }) },
    { t: 14, p: pose(STAND, { y: 2, torso: P - 0.35, aU: [0.2, 1.0], aF: [0.9, 1.3] }) },
  ],
  super: [  // 초필살기 — 힘을 모았다가 터뜨린다
    { t: 14, p: pose(STAND, { y: 10, torso: P - 0.05, aU: [-0.55, -0.5], aF: [-0.15, -0.1], lU: [-0.6, 0.6], lS: [0.7, -0.5] }) },
    { t: 8, p: pose(STAND, { y: -10, torso: P - 0.24, xA: 1.24, aU: [1.5, 1.55], aF: [1.62, 1.66] }) },
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
            xA: lerp(a.xA === undefined ? 1 : a.xA, b.xA === undefined ? 1 : b.xA, k),
            xL: lerp(a.xL === undefined ? 1 : a.xL, b.xL === undefined ? 1 : b.xL, k),
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
   dir(a) = (sin a, cos a) — 0 은 아래, π/2 는 앞, π 는 위.

   ★그림의 '급'을 올리는 건 선이 아니라 **빛**이다. 옛 대전격투 스프라이트는 팔다리마다
     밝은 면과 어두운 면이 갈려 있고, 그 위에 굵고 진한 테두리가 둘러 있다. 여기서도
     (1)굵은 테두리 → (2)면을 가르는 그라데이션 → (3)빛 쪽 가장자리의 반사광 순서로 칠한다.
   ★빛은 늘 **앞 위쪽**에서 온다. 캐릭터가 뒤돌아도(face 뒤집기) 배경 조명은 그대로여야
     하므로, 빛 방향은 뒤집힌 좌표계 안에서 고정한다.
   ★뼈 길이·굵기는 열 명이 같다 — 그림이 캐릭터마다 달라지면 판정이 불공평해진다.       */
var LIGHT = { x: 0.52, y: -0.86 };          // 앞 위쪽에서 오는 빛
var TINTC = {};
/** 색을 밝게(+)·어둡게(-). 캐릭터 색은 hex 라 한 번 계산해 두고 재사용한다. */
function tint(col, amt) {
  var key = col + '|' + amt, v = TINTC[key];
  if (v) return v;
  var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(col || '');
  if (!m) return col;
  var h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  function f(c) {
    return Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  }
  v = 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  TINTC[key] = v;
  return v;
}

function seg(x, y, ang, len) { return [x + Math.sin(ang) * len, y + Math.cos(ang) * len]; }

/** 뼈 하나 — 양 끝이 둥근 캡슐. 빛 쪽이 밝고 반대쪽이 어둡다. */
function limb(cx, x1, y1, x2, y2, w1, w2, col, edge) {
  var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  var nx = -dy / L, ny = dx / L, ccw = false;
  if (nx * LIGHT.x + ny * LIGHT.y < 0) { nx = -nx; ny = -ny; ccw = true; }   // n 은 늘 빛 쪽
  var a1 = Math.atan2(ny, nx), dir = ccw ? -1 : 1;
  cx.beginPath();
  cx.arc(x1, y1, w1, a1, a1 + dir * Math.PI, ccw);            // 관절은 둥글게
  cx.arc(x2, y2, w2, a1 + dir * Math.PI, a1 + dir * 2 * Math.PI, ccw);
  cx.closePath();

  var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, w = Math.max(w1, w2);
  var g = cx.createLinearGradient(mx + nx * w, my + ny * w, mx - nx * w, my - ny * w);
  g.addColorStop(0, tint(col, 0.30));
  g.addColorStop(0.45, col);
  g.addColorStop(1, tint(col, -0.40));
  cx.fillStyle = g;
  cx.fill();
  if (edge) { cx.strokeStyle = edge; cx.lineWidth = 2.1; cx.lineJoin = 'round'; cx.stroke(); }
  // 빛 쪽 가장자리의 반사광 — 이 한 줄이 팔다리를 '굵은 막대'가 아니라 '살'로 만든다
  cx.beginPath();
  cx.moveTo(x1 + nx * w1 * 0.58, y1 + ny * w1 * 0.58);
  cx.lineTo(x2 + nx * w2 * 0.58, y2 + ny * w2 * 0.58);
  cx.strokeStyle = 'rgba(255,255,255,.13)';
  cx.lineWidth = Math.max(1, w2 * 0.55);
  cx.lineCap = 'round';
  cx.stroke();
  cx.lineCap = 'butt';
}

/** 둥근 덩어리(주먹·어깨) — 빛 쪽에 하이라이트가 몰린다 */
function ball(cx, x, y, r, col, edge) {
  var g = cx.createRadialGradient(x + LIGHT.x * r * 0.42, y + LIGHT.y * r * 0.42, r * 0.15, x, y, r);
  g.addColorStop(0, tint(col, 0.34));
  g.addColorStop(0.55, col);
  g.addColorStop(1, tint(col, -0.34));
  cx.beginPath(); cx.arc(x, y, r, 0, 7);
  cx.fillStyle = g; cx.fill();
  if (edge) { cx.strokeStyle = edge; cx.lineWidth = 1.8; cx.stroke(); }
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
  var headC = seg(cxp, cyp, p.torso + p.head, 16.5);   // 목이 조금 있어야 어깨와 머리가 갈린다
  var edge = 'rgba(10,8,16,.72)';                 // ★테두리는 진하고 굵게 — 배경에서 캐릭터가 떨어져 나온다
  var xA = p.xA === undefined ? 1 : p.xA;
  var xL = p.xL === undefined ? 1 : p.xL;

  // 뒤쪽 팔·다리 먼저(멀리 있는 것부터). 뒤쪽은 한 겹 더 어둡게 — 앞뒤가 갈린다.
  var hipB = [px - 3, py], hipF = [px + 3, py];
  var shB = [cxp - 4, cyp + 2], shF = [cxp + 4, cyp + 2];

  // ★앞으로 크게 뻗은 뒤쪽 팔다리는 **몸통 앞에** 그린다. 회전 발차기처럼 뒷발로 차는 기술이
  //   몸에 가려 보이지 않으면, 아무리 크게 휘둘러도 관객에게는 아무 일도 일어나지 않은 것이다.
  var legFront = p.lU[0] > 1.05, armFront = p.aU[0] > 1.25;
  if (!legFront) drawLeg(cx, hipB, p.lU[0], p.lS[0], tint(C.pantsDark, -0.14), tint(C.shoeDark, -0.14), edge, 1);
  if (!armFront) drawArm(cx, shB, p.aU[0], p.aF[0], tint(C.sleeveDark, -0.14), tint(C.skinDark, -0.12), edge, 1);

  drawTorso(cx, px, py, p.torso, C, edge);
  if (ch.draw && ch.draw.torso) ch.draw.torso(cx, px, py, cxp, cyp, p);

  // 앞쪽 다리
  if (legFront) drawLeg(cx, hipB, p.lU[0], p.lS[0], tint(C.pantsDark, -0.06), tint(C.shoeDark, -0.06), edge, xL);
  drawLeg(cx, hipF, p.lU[1], p.lS[1], C.pants, C.shoe, edge, xL);

  // 머리
  var hx = headC[0], hy = headC[1];
  limb(cx, cxp, cyp, hx, hy, 6.4, 6, C.skin, edge);   // 목
  cx.save();
  cx.translate(hx, hy);
  cx.rotate(-(p.torso + p.head - Math.PI));
  cx.scale(0.88, 0.88);
  // 얼굴
  var fg = cx.createLinearGradient(-8, -10, 9, 11);
  fg.addColorStop(0, tint(C.skin, 0.20));
  fg.addColorStop(0.55, C.skin);
  fg.addColorStop(1, tint(C.skin, -0.30));
  cx.fillStyle = fg;
  cx.beginPath(); cx.ellipse(0, 0, 11, 12.5, 0, 0, 7); cx.fill();
  cx.strokeStyle = edge; cx.lineWidth = 1.9; cx.stroke();
  // 턱선 — 옆얼굴의 각을 살짝 세운다
  cx.strokeStyle = 'rgba(0,0,0,.18)'; cx.lineWidth = 1.3;
  cx.beginPath(); cx.moveTo(9.4, 2.4); cx.quadraticCurveTo(7.2, 9.6, 1.6, 11.4); cx.stroke();
  // 귀
  cx.fillStyle = tint(C.skin, -0.12);
  cx.beginPath(); cx.ellipse(-4.6, 1.2, 2.1, 3.0, 0, 0, 7); cx.fill();
  cx.strokeStyle = 'rgba(0,0,0,.22)'; cx.lineWidth = 1; cx.stroke();
  // 눈 — 앞쪽만 보이게(옆얼굴). 흰자 → 눈동자 → 빛 순서로 겹친다
  cx.fillStyle = '#f6f1ea';
  cx.beginPath(); cx.ellipse(5.6, -1.6, 3.0, 2.7, 0, 0, 7); cx.fill();
  cx.fillStyle = '#20141a';
  cx.beginPath(); cx.ellipse(6.4, -1.4, 1.9, 2.4, 0, 0, 7); cx.fill();
  cx.fillStyle = 'rgba(255,255,255,.92)';
  cx.beginPath(); cx.arc(7.0, -2.4, 0.8, 0, 7); cx.fill();
  cx.strokeStyle = 'rgba(20,14,18,.8)'; cx.lineWidth = 1.1;   // 위 눈꺼풀
  cx.beginPath(); cx.moveTo(2.8, -3.4); cx.lineTo(8.6, -3.2); cx.stroke();
  // 눈썹 — 격투가는 늘 인상을 쓰고 있다
  cx.strokeStyle = C.hair; cx.lineWidth = 2.4; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(2.8, -6.6); cx.lineTo(8.4, -4.8); cx.stroke();
  cx.lineCap = 'butt';
  // 코와 입
  cx.strokeStyle = 'rgba(0,0,0,.28)'; cx.lineWidth = 1.2;
  cx.beginPath(); cx.moveTo(9.4, -1.2); cx.lineTo(10.4, 1.6); cx.lineTo(8.4, 2.0); cx.stroke();
  cx.strokeStyle = 'rgba(60,26,30,.85)'; cx.lineWidth = 1.4;
  cx.beginPath(); cx.moveTo(6.4, 5.0); cx.lineTo(9.6, 4.4); cx.stroke();
  if (ch.draw && ch.draw.head) ch.draw.head(cx, C);
  else defaultHair(cx, C);
  // 머리 위 빛 — 머리 모양을 다 그린 뒤 얹어야 머리카락에도 빛이 든다
  var hg = cx.createLinearGradient(0, -14, 0, 4);
  hg.addColorStop(0, 'rgba(255,255,255,.16)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = hg;
  cx.beginPath(); cx.ellipse(0, -3, 11, 12, 0, 0, 7); cx.fill();
  cx.restore();

  if (armFront) drawArm(cx, shB, p.aU[0], p.aF[0], tint(C.sleeveDark, -0.04), tint(C.skinDark, -0.04), edge, xA);
  drawArm(cx, shF, p.aU[1], p.aF[1], C.sleeve, C.skin, edge, xA);

  cx.restore();
}

/** 몸통 — 캡슐이 아니라 **어깨가 넓고 허리가 좁은 판**이다. 실루엣이 곧 '싸움꾼'이다.
    ⚠️몸통 좌표계는 골반이 원점, 위가 -y, 앞이 +x (허리띠·넥타이 자료가 이 약속을 쓴다). */
function drawTorso(cx, px, py, torso, C, edge) {
  cx.save();
  cx.translate(px, py);
  cx.rotate(-(torso - Math.PI));
  cx.beginPath();
  cx.moveTo(-10.2, 1.5);                              // 뒤 허리
  cx.lineTo(-13.6, -18);                              // 등
  cx.quadraticCurveTo(-15.2, -28, -7.0, -30.5);       // 뒤 어깨
  cx.lineTo(6.0, -31);                                // 어깨 위
  cx.quadraticCurveTo(15.4, -29.5, 14.0, -18);        // 앞 어깨 → 가슴
  cx.quadraticCurveTo(12.4, -8, 10.2, 1.5);           // 가슴 → 허리
  cx.closePath();
  var g = cx.createLinearGradient(14, -30, -14, 2);
  g.addColorStop(0, tint(C.top, 0.28));
  g.addColorStop(0.5, C.top);
  g.addColorStop(1, tint(C.top, -0.42));
  cx.fillStyle = g; cx.fill();
  cx.strokeStyle = edge; cx.lineWidth = 2.1; cx.lineJoin = 'round'; cx.stroke();
  // 가슴 쪽 반사광과 등 쪽 그늘 — 옷에 두께가 생긴다
  cx.beginPath();
  cx.moveTo(11.4, -26); cx.quadraticCurveTo(10.4, -14, 8.4, -1);
  cx.strokeStyle = 'rgba(255,255,255,.16)'; cx.lineWidth = 3.2; cx.lineCap = 'round'; cx.stroke();
  cx.beginPath();
  cx.moveTo(-4.2, -24); cx.lineTo(-4.2, -6);
  cx.strokeStyle = 'rgba(0,0,0,.16)'; cx.lineWidth = 2.4; cx.stroke();
  cx.lineCap = 'butt';
  if (C.beltCol) {
    cx.fillStyle = C.beltCol; cx.fillRect(-11, -5, 22, 7);
    cx.fillStyle = 'rgba(255,255,255,.24)'; cx.fillRect(-11, -5, 22, 2);
    cx.strokeStyle = edge; cx.lineWidth = 1.2; cx.strokeRect(-11, -5, 22, 7);
  }
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

/** 앞손은 ext 만큼 더 뻗고, 주먹도 그만큼 커진다(때리는 순간을 크게 보이게 한다) */
function drawArm(cx, sh, aU, aF, sleeve, skin, edge, ext) {
  ext = ext || 1;
  var eu = 1 + (ext - 1) * 0.45;
  var el = seg(sh[0], sh[1], aU, 18 * eu);
  var hand = seg(el[0], el[1], aF, 17 * ext);
  limb(cx, sh[0], sh[1], el[0], el[1], 8.0, 5.0, sleeve, edge);   // 어깨(삼각근)에서 팔꿈치로 좁아진다
  limb(cx, el[0], el[1], hand[0], hand[1], 4.9, 4.0, skin, edge);
  ball(cx, hand[0], hand[1], 5.6 + (ext - 1) * 10, skin, edge);
}

function drawLeg(cx, hip, lU, lS, pants, shoe, edge, ext) {
  ext = ext || 1;
  var eu = 1 + (ext - 1) * 0.45;
  var kn = seg(hip[0], hip[1], lU, 20 * eu);
  var ft = seg(kn[0], kn[1], lS, 20 * ext);
  limb(cx, hip[0], hip[1], kn[0], kn[1], 9.2, 6.0, pants, edge);   // 허벅지는 굵고 무릎은 가늘게
  limb(cx, kn[0], kn[1], ft[0], ft[1], 5.6, 4.4, pants, edge);
  // 신발 — 발끝이 앞을 향한다. 차는 발은 신발도 커 보인다.
  var sc = 1 + (ext - 1) * 1.5;
  cx.save();
  cx.translate(ft[0], ft[1]);
  cx.rotate(-(lS - Math.PI) * 0.25);
  cx.scale(sc, sc);
  var g = cx.createLinearGradient(0, -4, 0, 5);
  g.addColorStop(0, tint(shoe, 0.26));
  g.addColorStop(1, tint(shoe, -0.30));
  cx.fillStyle = g;
  cx.beginPath();
  cx.moveTo(-5.5, -3.4); cx.lineTo(9.5, -2.4); cx.quadraticCurveTo(13, 3, 8, 4.4);
  cx.lineTo(-5.5, 4.4); cx.closePath(); cx.fill();
  cx.strokeStyle = edge; cx.lineWidth = 1.6; cx.lineJoin = 'round'; cx.stroke();
  cx.fillStyle = 'rgba(0,0,0,.25)';               // 밑창
  cx.fillRect(-5.5, 2.6, 15, 1.9);
  cx.restore();
}

/** 그 포즈에서 앞손·앞발이 실제로 닿는 자리(타격 효과를 그 자리에 띄우려고 쓴다)
    ⚠️뻗기 배율(xA·xL)을 여기서도 똑같이 먹여야 효과가 손끝에서 터진다. */
function handPos(p, face, s) {
  var py = -46 + p.y, x = p.xA === undefined ? 1 : p.xA;
  var chest = seg(0, py, p.torso, 30);
  var sh = [chest[0] + 4, chest[1] + 2];
  var el = seg(sh[0], sh[1], p.aU[1], 18 * (1 + (x - 1) * 0.45));
  var hand = seg(el[0], el[1], p.aF[1], 17 * x);
  return { x: hand[0] * face * s, y: hand[1] * s };
}
function footPos(p, face, s) {
  var py = -46 + p.y, x = p.xL === undefined ? 1 : p.xL;
  var hip = [3, py];
  var kn = seg(hip[0], hip[1], p.lU[1], 20 * (1 + (x - 1) * 0.45));
  var ft = seg(kn[0], kn[1], p.lS[1], 20 * x);
  return { x: ft[0] * face * s, y: ft[1] * s };
}

window.FIGHTANIM = {
  ANIM: ANIM, pose: pose, STAND: STAND, CROUCH: CROUCH, tint: tint,
  poseAt: poseAt, animLength: animLength, drawFighter: drawFighter,
  handPos: handPos, footPos: footPos, blend: blend,
};
})();
