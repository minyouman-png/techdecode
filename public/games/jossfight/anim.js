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
    { t: 8, e: 'inout', p: pose(STAND) },
    { t: 8, e: 'inout', p: pose(STAND, { y: -1, torso: P - 0.17, aU: [0.47, 0.85], aF: [1.28, 1.74],
                                         lU: [-0.46, 0.38], lS: [0.26, -0.10] }) },
    { t: 8, e: 'inout', p: pose(STAND, { y: 4, torso: P - 0.11, aU: [0.55, 0.94], aF: [1.35, 1.80],
                                         lU: [-0.54, 0.46], lS: [0.34, -0.14] }) },
    { t: 8, e: 'inout', p: pose(STAND, { y: 1, torso: P - 0.14, aU: [0.50, 0.88], aF: [1.30, 1.76] }) },
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
     ★기술 하나는 다섯 박자다: **준비(감기) → 발사 → 타격(가장 크게 뻗고 잠깐 머문다) →
       되돌림(빠르게) → 안착(살짝 지나쳤다 제자리)**. 예전에는 세 칸뿐이라 때린 뒤 10프레임을
       가만히 굳어 있었다 — 그림표로 보면 '죽은 프레임'이 절반이었다.
     ★**타격 칸은 startup 프레임에 정확히 떨어져야** 한다(판정이 살아나는 순간).
       그래서 칸의 t 합을 startup 에 맞춰 나눈다. 아래 주석의 f숫자가 그 자리다.
     ★칸 수의 총합은 startup+active+recovery 와 같게 둔다(자가검증이 확인한다). */
  lp: [   // 약손 11F · 타격 f3
    { t: 2, e: 'in',   p: pose(STAND, { xA: 0.94, aU: [0.52, 0.78], aF: [1.30, 1.66] }) },
    { t: 1, e: 'out3', p: pose(STAND, { xA: 1.00, aU: [0.52, 0.95], aF: [1.30, 1.72] }) },
    { t: 2, e: 'in',   p: pose(STAND, { y: 2, torso: P - 0.22, xA: 1.16,          // ← 타격
                                        aU: [0.46, 1.42], aF: [1.24, 1.60] }) },
    { t: 2, e: 'out',  p: pose(STAND, { y: 2, torso: P - 0.17, xA: 1.02, aU: [0.50, 1.10], aF: [1.28, 1.70] }) },
    { t: 4, e: 'back', p: pose(STAND) },
  ],
  hp: [   // 강손 19F · 타격 f6 — 허리를 크게 감았다가 몸째 실어 보낸다
    { t: 3, e: 'out',  p: pose(STAND, { y: 4, torso: P + 0.14, xA: 0.92,
                                        aU: [0.30, 0.52], aF: [1.05, 1.30], lU: [-0.56, 0.36], lS: [0.36, -0.06] }) },
    { t: 3, e: 'out3', p: pose(STAND, { y: 5, torso: P + 0.30, xA: 0.84,          // 최대로 감음
                                        aU: [-0.20, 0.18], aF: [0.55, 0.70], lU: [-0.62, 0.30], lS: [0.42, 0.00] }) },
    { t: 2, e: 'in',   p: pose(STAND, { y: -3, torso: P - 0.34, xA: 1.26,         // ← 타격
                                        aU: [0.78, 1.56], aF: [1.50, 1.62], lU: [-0.44, 0.62], lS: [0.30, -0.20] }) },
    { t: 3, e: 'out',  p: pose(STAND, { y: -2, torso: P - 0.26, xA: 1.16,
                                        aU: [0.70, 1.40], aF: [1.44, 1.66], lU: [-0.42, 0.60], lS: [0.28, -0.18] }) },
    { t: 4, e: 'out',  p: pose(STAND, { y: 4, torso: P - 0.10, xA: 0.88,          // 주먹을 턱 앞까지 당긴다
                                        aU: [0.58, 0.72], aF: [1.38, 2.02], lU: [-0.54, 0.38], lS: [0.32, -0.10] }) },
    { t: 4, e: 'back', p: pose(STAND) },
  ],
  lk: [   // 약발 12F · 타격 f3
    { t: 2, e: 'out',  p: pose(STAND, { y: 5, lU: [-0.52, 0.72], lS: [0.32, 0.32] }) },
    { t: 1, e: 'out3', p: pose(STAND, { y: 4, lU: [-0.52, 0.92], lS: [0.32, 0.72] }) },
    { t: 2, e: 'in',   p: pose(STAND, { y: 2, torso: P + 0.06, xL: 1.18,          // ← 타격
                                        lU: [-0.58, 1.42], lS: [0.34, 1.50], aU: [0.44, 0.96], aF: [1.20, 1.82] }) },
    { t: 3, e: 'out',  p: pose(STAND, { y: 3, xL: 1.04, lU: [-0.54, 0.86], lS: [0.32, 0.46] }) },
    { t: 4, e: 'back', p: pose(STAND) },
  ],
  hk: [   // 강발 24F · 타격 f7 — 무릎을 접었다가 머리 높이까지 편다
    { t: 4, e: 'out',  p: pose(STAND, { y: 4, torso: P + 0.16, xL: 0.96,
                                        lU: [-0.58, 0.62], lS: [0.36, 0.86], aU: [0.20, 0.90], aF: [0.75, 1.70] }) },
    { t: 3, e: 'out3', p: pose(STAND, { y: 1, torso: P + 0.30, xL: 1.02,          // 무릎을 가슴까지
                                        lU: [-0.62, 1.24], lS: [0.40, 1.62], aU: [-0.10, 1.10], aF: [0.30, 1.86] }) },
    { t: 3, e: 'in',   p: pose(STAND, { y: -8, torso: P + 0.42, xL: 1.30,         // ← 타격
                                        lU: [-0.66, 1.78], lS: [0.44, 1.82], aU: [-0.45, 1.30], aF: [-0.25, 1.95] }) },
    { t: 4, e: 'out',  p: pose(STAND, { y: -5, torso: P + 0.34, xL: 1.16,
                                        lU: [-0.62, 1.48], lS: [0.42, 1.60], aU: [-0.30, 1.20], aF: [-0.05, 1.90] }) },
    { t: 5, e: 'out',  p: pose(STAND, { y: 9, torso: P - 0.02, xL: 0.96,          // 발을 내리며 무릎으로 받는다
                                        lU: [-0.62, 0.56], lS: [0.44, 0.06], aU: [0.40, 0.94], aF: [1.15, 1.80] }) },
    { t: 5, e: 'back', p: pose(STAND) },
  ],
  clp: [  // 앉아 약손 11F · 타격 f3
    { t: 2, e: 'in',   p: pose(CROUCH, { xA: 0.94, aU: [0.55, 0.74], aF: [1.28, 1.48] }) },
    { t: 1, e: 'out3', p: pose(CROUCH, { xA: 1.02, aU: [0.55, 0.96], aF: [1.28, 1.54] }) },
    { t: 2, e: 'in',   p: pose(CROUCH, { torso: P - 0.36, xA: 1.18,               // ← 타격
                                         aU: [0.50, 1.40], aF: [1.26, 1.56] }) },
    { t: 2, e: 'out',  p: pose(CROUCH, { torso: P - 0.32, xA: 1.04, aU: [0.52, 1.10], aF: [1.28, 1.58] }) },
    { t: 4, e: 'back', p: pose(CROUCH) },
  ],
  clk: [  // 앉아 하단차기 15F · 타격 f4 — 발목을 쓸어 찬다
    { t: 3, e: 'out',  p: pose(CROUCH, { lU: [-0.88, 1.05], lS: [1.05, 1.10] }) },
    { t: 1, e: 'out3', p: pose(CROUCH, { y: 24, xL: 1.08, lU: [-0.92, 1.35], lS: [1.05, 1.42] }) },
    { t: 2, e: 'in',   p: pose(CROUCH, { y: 27, xL: 1.24, lU: [-0.96, 1.66], lS: [1.06, 1.72] }) },  // ← 타격
    { t: 4, e: 'out',  p: pose(CROUCH, { y: 25, xL: 1.08, lU: [-0.92, 1.30], lS: [1.05, 1.30] }) },
    { t: 5, e: 'back', p: pose(CROUCH) },
  ],
  chk: [  // 다리 후리기 24F · 타격 f6 — 바닥을 쓸어 넘어뜨린다
    { t: 4, e: 'out',  p: pose(CROUCH, { y: 26, torso: P - 0.48, lU: [-1.00, 0.95], lS: [1.10, 1.05] }) },
    { t: 2, e: 'out3', p: pose(CROUCH, { y: 30, torso: P - 0.66, xL: 1.12, lU: [-1.10, 1.42], lS: [1.20, 1.50] }) },
    { t: 3, e: 'in',   p: pose(CROUCH, { y: 33, torso: P - 0.82, xL: 1.28,        // ← 타격
                                         lU: [-1.18, 1.74], lS: [1.26, 1.78] }) },
    { t: 5, e: 'out',  p: pose(CROUCH, { y: 31, torso: P - 0.70, xL: 1.12, lU: [-1.12, 1.40], lS: [1.22, 1.40] }) },
    { t: 5, e: 'back', p: pose(CROUCH, { y: 26 }) },
    { t: 5,            p: pose(CROUCH) },
  ],
  jp: [   // 점프 손 14F · 타격 f4 — 공중이라 뻗은 채로 유지된다
    { t: 3, e: 'out',  p: pose(STAND, { y: -4, torso: P - 0.16, xA: 0.96,
                                        aU: [0.4, 0.95], aF: [1.1, 1.30], lU: [-0.5, 0.4], lS: [0.7, 0.2] }) },
    { t: 1, e: 'out3', p: pose(STAND, { y: -4, torso: P - 0.22, xA: 1.10,
                                        aU: [0.4, 1.35], aF: [1.1, 1.50], lU: [-0.5, 0.4], lS: [0.7, 0.2] }) },
    { t: 6, e: 'lin',  p: pose(STAND, { y: -4, torso: P - 0.30, xA: 1.20,         // ← 타격(유지)
                                        aU: [0.4, 1.58], aF: [1.1, 1.64], lU: [-0.5, 0.4], lS: [0.7, 0.2] }) },
    { t: 4,            p: pose(STAND, { y: -4, torso: P - 0.26, xA: 1.12,
                                        aU: [0.4, 1.45], aF: [1.1, 1.60], lU: [-0.5, 0.45], lS: [0.7, 0.25] }) },
  ],
  jk: [   // 점프 발 16F · 타격 f4 — 무릎을 접었다 편다
    { t: 3, e: 'out',  p: pose(STAND, { y: -4, torso: P - 0.06, xL: 0.98,
                                        lU: [-0.5, 0.95], lS: [0.7, 1.25], aU: [1.6, 1.9], aF: [1.9, 2.1] }) },
    { t: 1, e: 'out3', p: pose(STAND, { y: -4, torso: P - 0.04, xL: 1.12,
                                        lU: [-0.5, 1.30], lS: [0.7, 1.45], aU: [1.6, 1.9], aF: [1.9, 2.1] }) },
    { t: 8, e: 'lin',  p: pose(STAND, { y: -4, torso: P - 0.02, xL: 1.26,         // ← 타격(유지)
                                        lU: [-0.5, 1.58], lS: [0.7, 1.66], aU: [1.6, 1.9], aF: [1.9, 2.1] }) },
    { t: 4,            p: pose(STAND, { y: -4, torso: P - 0.04, xL: 1.14,
                                        lU: [-0.5, 1.40], lS: [0.7, 1.50], aU: [1.6, 1.9], aF: [1.9, 2.1] }) },
  ],

  /* ---------- 필살기 자세 ---------- */
  fire: [   // 장풍 28F · 발사 f8 — 허리를 낮춰 손을 당겼다가 두 손을 밀어낸다
    { t: 4, e: 'in',   p: pose(STAND, { y: 6, torso: P - 0.20, xA: 0.88,
                                        aU: [0.10, 0.20], aF: [0.55, 0.70], lU: [-0.56, 0.36], lS: [0.36, -0.04] }) },
    { t: 4, e: 'out3', p: pose(STAND, { y: 8, torso: P - 0.34, xA: 0.82,          // 두 손을 허리로
                                        aU: [-0.30, -0.10], aF: [0.35, 0.55], lU: [-0.62, 0.30], lS: [0.42, 0.02] }) },
    { t: 3, e: 'in',   p: pose(STAND, { y: -2, torso: P - 0.14, xA: 1.22,         // ← 밀어냄
                                        aU: [1.40, 1.48], aF: [1.58, 1.62], lU: [-0.48, 0.56], lS: [0.30, -0.14] }) },
    { t: 4, e: 'out',  p: pose(STAND, { y: -1, torso: P - 0.13, xA: 1.12, aU: [1.30, 1.40], aF: [1.52, 1.58] }) },
    { t: 6, e: 'back', p: pose(STAND, { y: 2, torso: P - 0.13, xA: 0.98, aU: [0.90, 1.00], aF: [1.34, 1.72] }) },
    { t: 7,            p: pose(STAND) },
  ],
  upper: [  // 대공기 27F · 솟구침 f5 — 감았다가 주먹으로 하늘을 가른다
    { t: 3, e: 'in',   p: pose(STAND, { y: 12, torso: P - 0.40, xA: 0.90,
                                        aU: [-0.25, 0.15], aF: [0.55, 0.95], lU: [-0.66, 0.72], lS: [0.76, -0.52] }) },
    { t: 2, e: 'out3', p: pose(STAND, { y: -6, torso: P + 0.04, xA: 1.16,
                                        aU: [0.2, 2.30], aF: [0.6, 2.55], lU: [-0.40, 0.60], lS: [0.85, 0.20] }) },
    { t: 3, e: 'lin',  p: pose(STAND, { y: -20, torso: P + 0.12, xA: 1.22,        // ← 정점
                                        aU: [0.2, 2.80], aF: [0.6, 2.92], lU: [-0.35, 0.55], lS: [0.90, 0.35] }) },
    { t: 5, e: 'out',  p: pose(STAND, { y: -10, torso: P + 0.08, xA: 1.10,
                                        aU: [0.3, 2.50], aF: [0.8, 2.70], lU: [-0.35, 0.55], lS: [0.85, 0.30] }) },
    { t: 7, e: 'back', p: pose(STAND, { y: 8, torso: P - 0.24, xA: 0.96,          // 착지
                                        aU: [0.45, 1.30], aF: [1.10, 1.90], lU: [-0.60, 0.60], lS: [0.60, -0.30] }) },
    { t: 7,            p: pose(STAND) },
  ],
  spin: [   // 회전 발차기 25F · 앞발 f6 → 뒷발 f9 — ★예비동작 없이 시작하던 것을 고쳤다
    { t: 4, e: 'out',  p: pose(STAND, { y: 4, torso: P - 0.34, xL: 0.94,          // 몸을 반대로 감는다
                                        lU: [-0.30, 0.30], lS: [0.20, 0.20], aU: [0.90, 0.30], aF: [1.70, 0.90] }) },
    { t: 2, e: 'out3', p: pose(STAND, { y: -4, torso: P + 0.14, xL: 1.16,
                                        lU: [-0.30, 1.30], lS: [0.35, 1.50], aU: [0.60, 0.60], aF: [1.50, 1.40] }) },
    { t: 3, e: 'in',   p: pose(STAND, { y: -10, torso: P + 0.06, xL: 1.28,        // ← 앞발
                                        lU: [-0.20, 1.80], lS: [0.50, 1.82], aU: [0.30, 0.90], aF: [1.20, 1.80] }) },
    { t: 3, e: 'out3', p: pose(STAND, { y: -10, torso: P - 0.40, xL: 1.28,        // ← 이어서 뒷발
                                        lU: [1.80, -0.20], lS: [1.82, 0.50], aU: [0.90, 0.30], aF: [1.80, 1.20] }) },
    { t: 5, e: 'out',  p: pose(STAND, { y: 2, torso: P - 0.16, xL: 1.04,
                                        lU: [-0.40, 0.60], lS: [0.30, 0.20], aU: [0.60, 0.80], aF: [1.40, 1.70] }) },
    { t: 8, e: 'back', p: pose(STAND) },
  ],
  dash: [   // 돌진기 30F · 어깨 f7 — 낮게 깔았다가 어깨부터 들어간다
    { t: 4, e: 'in',   p: pose(STAND, { y: 8, torso: P - 0.40, xA: 0.90,
                                        aU: [-0.10, 0.60], aF: [0.50, 1.10], lU: [-0.66, 0.60], lS: [0.72, -0.34] }) },
    { t: 3, e: 'out3', p: pose(STAND, { y: 6, torso: P - 0.62, xA: 1.06,
                                        aU: [-0.20, 1.20], aF: [0.45, 1.45], lU: [-0.85, 0.75], lS: [0.90, 0.10] }) },
    { t: 4, e: 'lin',  p: pose(STAND, { y: 4, torso: P - 0.78, xA: 1.18,          // ← 어깨로 파고듦
                                        aU: [-0.30, 1.48], aF: [0.40, 1.62], lU: [-0.98, 0.88], lS: [1.00, 0.32] }) },
    { t: 5, e: 'out',  p: pose(STAND, { y: 5, torso: P - 0.60, xA: 1.08,
                                        aU: [-0.20, 1.30], aF: [0.55, 1.50], lU: [-0.80, 0.80], lS: [0.85, 0.10] }) },
    { t: 6, e: 'back', p: pose(STAND, { y: 3, torso: P - 0.30, xA: 0.98, aU: [0.30, 1.00], aF: [1.00, 1.70] }) },
    { t: 8,            p: pose(STAND) },
  ],
  super: [  // 초필살기 48F · 폭발 f12 — 오래 모았다가 한 번에 터뜨린다
    { t: 8, e: 'in',   p: pose(STAND, { y: 10, torso: P - 0.02, xA: 0.86,
                                        aU: [-0.55, -0.50], aF: [-0.15, -0.10], lU: [-0.66, 0.66], lS: [0.76, -0.54] }) },
    { t: 4, e: 'out3', p: pose(STAND, { y: 12, torso: P + 0.06, xA: 0.80,         // 끝까지 감음
                                        aU: [-0.70, -0.66], aF: [-0.35, -0.30], lU: [-0.72, 0.72], lS: [0.82, -0.58] }) },
    { t: 4, e: 'lin',  p: pose(STAND, { y: -10, torso: P - 0.26, xA: 1.28,        // ← 폭발
                                        aU: [1.48, 1.56], aF: [1.60, 1.66], lU: [-0.44, 0.62], lS: [0.30, -0.22] }) },
    { t: 6, e: 'out',  p: pose(STAND, { y: -6, torso: P - 0.20, xA: 1.18, aU: [1.35, 1.45], aF: [1.52, 1.60] }) },
    { t: 10, e: 'back', p: pose(STAND, { y: 2, torso: P - 0.14, xA: 1.00, aU: [0.95, 1.05], aF: [1.35, 1.72] }) },
    { t: 16,           p: pose(STAND) },
  ],

  /* ---------- 맞고 막고 넘어지고 ----------
     ★맞는 쪽 동작이 때리는 쪽만큼 중요하다. 맞고 **꺾였다가 돌아오는** 두 박자가 있어야
       때린 쪽이 세 보인다. 예전에는 두 칸뿐이라 그냥 뒤로 기울었다 폈다. */
  block: [
    { t: 2, e: 'out3', p: pose(STAND, { y: 4, torso: P + 0.06, xA: 0.92,
                                        aU: [0.95, 1.15], aF: [2.10, 2.28], lU: [-0.42, 0.40], lS: [0.34, -0.16] }) },
    { t: 4, e: 'out',  p: pose(STAND, { y: 2, torso: P - 0.02, xA: 0.96,
                                        aU: [0.90, 1.12], aF: [2.05, 2.22], lU: [-0.46, 0.42], lS: [0.32, -0.14] }) },
  ],
  blockLow: [
    { t: 2, e: 'out3', p: pose(CROUCH, { aU: [1.05, 1.25], aF: [2.25, 2.40] }) },
    { t: 4, e: 'out',  p: pose(CROUCH, { aU: [1.00, 1.20], aF: [2.20, 2.35] }) },
  ],
  hit: [    // 꺾임 → 되돌아옴
    { t: 2, e: 'out3', p: pose(STAND, { y: -3, torso: P + 0.40, head: -0.55, xA: 0.88,
                                        aU: [-0.55, -0.25], aF: [-1.00, -0.45],
                                        lU: [0.30, -0.34], lS: [-0.18, 0.24] }) },
    { t: 4, e: 'out',  p: pose(STAND, { y: 2, torso: P + 0.22, head: -0.30, xA: 0.92,
                                        aU: [-0.30, 0.00], aF: [-0.50, 0.10], lU: [0.10, -0.10], lS: [0.00, 0.10] }) },
    { t: 6, e: 'back', p: pose(STAND, { y: 3, torso: P + 0.05, head: -0.10, aU: [0.30, 0.60], aF: [0.90, 1.30] }) },
  ],
  hitLow: [
    { t: 2, e: 'out3', p: pose(CROUCH, { torso: P + 0.45, head: -0.50, aU: [-0.45, -0.15], aF: [-0.80, -0.25] }) },
    { t: 4, e: 'out',  p: pose(CROUCH, { torso: P + 0.20, head: -0.25, aU: [-0.20, 0.15], aF: [-0.30, 0.35] }) },
    { t: 6, e: 'back', p: pose(CROUCH, { torso: P + 0.02 }) },
  ],
  down: [   // 넘어짐 — 날아가 등으로 떨어지고 **한 번 튄다**
    { t: 4, e: 'out3', p: pose(STAND, { y: 0, torso: P + 0.85, head: -0.65, xA: 0.9,
                                        aU: [-0.95, -0.75], aF: [-1.35, -1.05], lU: [0.95, 0.55], lS: [0.15, 0.60] }) },
    { t: 6, e: 'in',   p: pose(STAND, { y: 30, torso: P + 1.40, head: -0.90,
                                        aU: [-1.40, -1.20], aF: [-1.80, -1.50], lU: [1.50, 1.20], lS: [1.00, 1.30] }) },
    { t: 3, e: 'out',  p: pose(STAND, { y: 24, torso: P + 1.48, head: -0.95,   // 튀어오름
                                        aU: [-1.45, -1.25], aF: [-1.85, -1.55], lU: [1.35, 1.10], lS: [0.85, 1.15] }) },
    { t: 4, e: 'in',   p: pose(STAND, { y: 40, torso: P + 1.55, head: -1.00,
                                        aU: [-1.50, -1.30], aF: [-1.90, -1.60], lU: [1.60, 1.35], lS: [1.20, 1.40] }) },
    { t: 17,           p: pose(STAND, { y: 41, torso: P + 1.56, head: -1.02,
                                        aU: [-1.50, -1.30], aF: [-1.90, -1.60], lU: [1.62, 1.36], lS: [1.22, 1.42] }) },
  ],
  getup: [  // 일어나기 — 몸을 접어 세우고 자세를 잡는다
    { t: 6, e: 'out',  p: pose(STAND, { y: 32, torso: P + 1.00, aU: [-0.85, -0.55], aF: [-1.05, -0.65],
                                        lU: [1.20, 0.85], lS: [0.65, 0.95] }) },
    { t: 6, e: 'out3', p: pose(STAND, { y: 16, torso: P - 0.10, aU: [-0.10, 0.30], aF: [0.55, 0.90],
                                        lU: [-0.70, 0.70], lS: [0.80, -0.45] }) },
    { t: 4, e: 'back', p: pose(STAND, { y: 6, torso: P - 0.30, aU: [0.35, 0.70], aF: [1.10, 1.55],
                                        lU: [-0.60, 0.55], lS: [0.55, -0.25] }) },
    { t: 4,            p: pose(STAND) },
  ],
  win: [    // 승리 — 주먹을 들고 숨을 고른다
    { t: 8,  e: 'out3', p: pose(STAND, { y: -4, torso: P - 0.05, xA: 1.06,
                                         aU: [0.40, 2.60], aF: [1.00, 2.80], lU: [-0.30, 0.30], lS: [0.16, 0.02] }) },
    { t: 14, e: 'inout', p: pose(STAND, { y: 2, torso: P - 0.14, aU: [0.40, 2.40], aF: [1.00, 2.62] }) },
    { t: 14, e: 'inout', p: pose(STAND, { y: -1, torso: P - 0.08, aU: [0.42, 2.52], aF: [1.02, 2.72] }) },
  ],
  lose: [
    { t: 40, p: pose(STAND, { y: 40, torso: P + 1.52, head: -1.0, aU: [-1.4, -1.2], aF: [-1.8, -1.5],
                              lU: [1.5, 1.2], lS: [1.1, 1.35] }) },
  ],
  intro: [  // 등장 — 팔을 크게 휘둘러 자세를 잡는다
    { t: 8,  e: 'out3', p: pose(STAND, { y: 6, torso: P - 0.30, xA: 1.08,
                                         aU: [1.35, 0.10], aF: [1.90, 0.45], lU: [-0.50, 0.55], lS: [0.55, -0.32] }) },
    { t: 8,  e: 'out',  p: pose(STAND, { y: 2, torso: P - 0.18, aU: [0.75, 0.62], aF: [1.55, 1.40],
                                         lU: [-0.54, 0.48], lS: [0.40, -0.20] }) },
    { t: 20, e: 'back', p: pose(STAND) },
  ],
};

/* ---------- 보간 ----------
   ★직선 보간만 쓰면 예비동작도 타격도 회수도 **같은 속도**로 움직인다 — 로봇처럼 보이는
     가장 큰 이유다. 칸마다 완급 곡선(e)을 붙인다: 다음 칸으로 갈 때 어떻게 갈 것인가.
       in    천천히 출발(힘을 모은다)      out   빠르게 출발해 멎는다(때린다)
       out3  더 매섭게 — 앞 절반에서 대부분 간다(타격 프레임에 쓴다)
       back  살짝 지나쳤다 돌아온다(회수·착지의 반동)
     기본은 inout(부드럽게). */
var EASE = {
  lin: function (t) { return t; },
  in: function (t) { return t * t; },
  out: function (t) { return 1 - (1 - t) * (1 - t); },
  out3: function (t) { return 1 - Math.pow(1 - t, 3); },
  inout: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  back: function (t) { var c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
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
      var k = (EASE[seq[i].e] || EASE.inout)((f - acc) / seq[i].t);
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
  cx.fillStyle = cel(cx, mx + nx * w, my + ny * w, mx - nx * w, my - ny * w, col);
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

/** 셀 셰이딩 — 밝은 면 · 바탕 · 그늘 세 톤을 **경계를 세워** 칠한다.
    ⚠️같은 색을 두 번 이어 찍어 경계를 만든다(0.5 에서 밝은 톤이 끝나고 바탕이 바로 시작). */
function cel(cx, x1, y1, x2, y2, col) {
  var g = cx.createLinearGradient(x1, y1, x2, y2);
  var hi = tint(col, 0.24), dk = tint(col, -0.34);
  g.addColorStop(0, hi); g.addColorStop(0.36, hi);
  g.addColorStop(0.36, col); g.addColorStop(0.74, col);
  g.addColorStop(0.74, dk); g.addColorStop(1, dk);
  return g;
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

  drawCloth(cx, px, py, p.torso, C, edge, opt.sway || 0);   // 허리띠 자락(몸통 뒤에)
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
  cx.fillStyle = cel(cx, 6, -11, -7, 10, C.skin);
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
  hairTail(cx, C, opt.sway || 0);            // 뒷머리 — 늦게 따라온다
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
/** 뒷머리 술 — 짧은 머리도 뒤통수에 조금은 흔들린다(움직임이 몸에서 끝나지 않게) */
function hairTail(cx, C, sway) {
  var a = 0.5 + sway * 2.2;
  cx.fillStyle = tint(C.hair, -0.12);
  cx.beginPath();
  cx.moveTo(-8, -7);
  cx.quadraticCurveTo(-13 - Math.sin(a) * 5, -1, -11 - Math.sin(a) * 9, 7);
  cx.lineTo(-6 - Math.sin(a) * 7, 7);
  cx.quadraticCurveTo(-8, 0, -4, -6);
  cx.closePath();
  cx.fill();
}

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
  cx.fillStyle = cel(cx, 14, -30, -14, 2, C.top);
  cx.fill();
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

/** 옷자락 — 몸이 멈춰도 천은 한 박자 늦게 따라온다. 이 지연이 '살아 있음'을 만든다.
    sway 는 fight.js 가 계산해 넘겨 주는 늦음(라디안). 초상화에서는 0. */
function drawCloth(cx, px, py, torso, C, edge, sway) {
  if (!C.beltCol) return;                    // 띠가 없는 사람에게 자락을 달면 앞치마가 된다
  var col = C.beltCol;
  cx.save();
  cx.translate(px, py);
  cx.rotate(-(torso - Math.PI));
  cx.fillStyle = col;
  cx.globalAlpha = 0.95;
  [[-7, 1.0], [-11, 0.7]].forEach(function (t) {
    var x0 = t[0], len = 15 * t[1], a = 0.35 + sway * 1.6 * t[1];
    cx.beginPath();
    cx.moveTo(x0, -2);
    cx.quadraticCurveTo(x0 - Math.sin(a) * len * 0.6, len * 0.5,
                        x0 - Math.sin(a) * len, len * 0.95);
    cx.lineTo(x0 - Math.sin(a) * len + 3.6, len * 0.95);
    cx.quadraticCurveTo(x0 - Math.sin(a) * len * 0.6 + 4, len * 0.5, x0 + 3.6, -2);
    cx.closePath();
    cx.fill();
    cx.strokeStyle = edge; cx.lineWidth = 1.3; cx.stroke();
  });
  cx.globalAlpha = 1;
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

/** 주먹 — 공이 아니라 **주먹**으로 그린다. 마디가 보이면 '때리는 손'이 된다.
    팔뚝 방향으로 눕혀 그려야 손목이 꺾이지 않는다. */
function fist(cx, x, y, ang, r, skin, edge) {
  cx.save();
  cx.translate(x, y);
  cx.rotate(-(ang - Math.PI / 2));            // 팔뚝 방향으로
  var g = cx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, tint(skin, 0.28));
  g.addColorStop(0.55, skin);
  g.addColorStop(1, tint(skin, -0.32));
  cx.fillStyle = g;
  cx.beginPath();
  if (cx.roundRect) cx.roundRect(-r * 0.95, -r, r * 2.0, r * 2, r * 0.62);
  else cx.arc(0, 0, r, 0, 7);
  cx.fill();
  cx.strokeStyle = edge; cx.lineWidth = 1.8; cx.lineJoin = 'round'; cx.stroke();
  cx.strokeStyle = 'rgba(0,0,0,.22)'; cx.lineWidth = 1.1;   // 손가락 마디
  cx.beginPath();
  cx.moveTo(r * 0.35, -r * 0.72); cx.lineTo(r * 0.35, r * 0.72);
  cx.moveTo(-r * 0.15, -r * 0.66); cx.lineTo(-r * 0.15, r * 0.66);
  cx.stroke();
  cx.restore();
}

/** 앞손은 ext 만큼 더 뻗고, 주먹도 그만큼 커진다(때리는 순간을 크게 보이게 한다) */
function drawArm(cx, sh, aU, aF, sleeve, skin, edge, ext) {
  ext = ext || 1;
  var eu = 1 + (ext - 1) * 0.45;
  var el = seg(sh[0], sh[1], aU, 18 * eu);
  var hand = seg(el[0], el[1], aF, 17 * ext);
  limb(cx, sh[0], sh[1], el[0], el[1], 8.0, 5.0, sleeve, edge);   // 어깨(삼각근)에서 팔꿈치로 좁아진다
  limb(cx, el[0], el[1], hand[0], hand[1], 4.9, 4.0, skin, edge);
  fist(cx, hand[0], hand[1], aF, 5.4 + (ext - 1) * 9, skin, edge);
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
