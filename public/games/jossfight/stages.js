/* ============================================================
   조스 오브 파이터즈 — 무대 7곳

   ★배경은 **캐릭터 뒤에서 조용해야** 한다. 대비가 세거나 무늬가 촘촘하면 캐릭터가 묻힌다.
     그래서 모든 무대는 (1)하늘 (2)먼 배경 (3)건물·주요 사물 (4)바닥 네 겹으로 나누고,
     캐릭터가 서는 띠(바닥 위 120px)는 일부러 **어둡고 단순하게** 둔다.
   ★겹마다 카메라를 따라가는 정도(시차)가 다르다 — 멀수록 천천히 움직인다.
   ★캐릭터는 투명하게 그려지므로 배경 위에 그대로 겹친다. 배경에 캐릭터 크기의
     밝은 덩어리를 두지 않는다(스티커처럼 보인다).

   무대 함수 인자: (cx, VW, VH, camX, groundY, t)  — t 는 흐르는 시간(초)
   ============================================================ */
(function () {
'use strict';

function sky(cx, VW, VH, a, b) {
  var g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, a); g.addColorStop(1, b);
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);
}
function floor(cx, VW, VH, groundY, near, far, line) {
  var g = cx.createLinearGradient(0, groundY, 0, VH);
  g.addColorStop(0, far); g.addColorStop(1, near);
  cx.fillStyle = g; cx.fillRect(0, groundY, VW, VH - groundY);
  cx.fillStyle = line || 'rgba(0,0,0,.22)';
  cx.fillRect(0, groundY, VW, 4);
}
/** 바닥 앞의 어두운 띠 — 캐릭터를 배경에서 떼어 놓는 가장 값싼 방법 */
function shade(cx, VW, groundY) {
  // 캐릭터가 커졌으므로 그늘도 머리 높이까지 올린다(밝은 하늘에 캐릭터가 묻히지 않게)
  var g = cx.createLinearGradient(0, groundY - 260, 0, groundY);
  g.addColorStop(0, 'rgba(6,8,16,0)'); g.addColorStop(0.55, 'rgba(6,8,16,.14)');
  g.addColorStop(1, 'rgba(6,8,16,.38)');
  cx.fillStyle = g; cx.fillRect(0, groundY - 260, VW, 260);
}
function px(camX, f) { return -camX * f; }
function rep(cx, camX, f, span, fn) {
  var off = px(camX, f) % span;
  for (var i = -1; i < Math.ceil(cx.canvas.width / span) + 2; i++) fn(off + i * span);
}
function txt(cx, s, x, y, size, col, weight) {
  cx.fillStyle = col; cx.font = (weight || 700) + ' ' + size + 'px sans-serif';
  cx.textAlign = 'center'; cx.fillText(s, x, y); cx.textAlign = 'left';
}

var STAGES = [
  /* ---------------------------------------------------------- 1 */
  {
    key: 'palace', name: '노덕후의 궁전', where: '이슬람 사원 앞뜰',
    music: 'sand',
    draw: function (cx, VW, VH, camX, gy, t) {
      sky(cx, VW, VH, '#f3c98a', '#e79a5c');
      // 해
      cx.fillStyle = 'rgba(255,244,214,.85)';
      cx.beginPath(); cx.arc(VW * 0.72 + px(camX, .04), gy - 300, 46, 0, 7); cx.fill();
      // 먼 모래언덕
      cx.fillStyle = '#d99a5e';
      rep(cx, camX, .12, 420, function (x) {
        cx.beginPath(); cx.moveTo(x, gy - 90);
        cx.quadraticCurveTo(x + 210, gy - 210, x + 420, gy - 90);
        cx.lineTo(x + 420, gy); cx.lineTo(x, gy); cx.closePath(); cx.fill();
      });
      // 사원 — 큰 돔과 첨탑 두 개
      var bx = VW / 2 + px(camX, .35);
      cx.fillStyle = '#f0e2c8';
      cx.fillRect(bx - 210, gy - 250, 420, 250);
      cx.fillStyle = '#e5d3b2';
      cx.beginPath(); cx.arc(bx, gy - 250, 120, Math.PI, 0); cx.fill();
      cx.fillStyle = '#c9a227';
      cx.beginPath(); cx.arc(bx, gy - 250, 120, Math.PI, Math.PI * 1.25); cx.fill();
      cx.beginPath(); cx.moveTo(bx - 4, gy - 372); cx.lineTo(bx + 4, gy - 372);
      cx.lineTo(bx + 2, gy - 400); cx.lineTo(bx - 2, gy - 400); cx.closePath(); cx.fill();
      [-1, 1].forEach(function (s) {
        var mx = bx + s * 250;
        cx.fillStyle = '#f0e2c8'; cx.fillRect(mx - 20, gy - 330, 40, 330);
        cx.fillStyle = '#e5d3b2';
        cx.beginPath(); cx.arc(mx, gy - 330, 26, Math.PI, 0); cx.fill();
        cx.fillStyle = '#c9a227'; cx.fillRect(mx - 22, gy - 250, 44, 8);
      });
      // 아치문 세 개
      cx.fillStyle = '#5c4326';
      for (var i = -1; i <= 1; i++) {
        var ax = bx + i * 120;
        cx.beginPath();
        cx.moveTo(ax - 34, gy); cx.lineTo(ax - 34, gy - 84);
        cx.quadraticCurveTo(ax, gy - 150, ax + 34, gy - 84);
        cx.lineTo(ax + 34, gy); cx.closePath(); cx.fill();
      }
      // ★팻말 — 이 무대의 이름이자 농담
      var sx = bx - 300 + px(camX, .12);
      cx.fillStyle = '#6b4a2a'; cx.fillRect(sx - 4, gy - 110, 8, 110);
      cx.fillStyle = '#f6efe0'; cx.fillRect(sx - 92, gy - 176, 184, 66);
      cx.strokeStyle = '#8d6a3a'; cx.lineWidth = 4; cx.strokeRect(sx - 92, gy - 176, 184, 66);
      txt(cx, '노덕후의 궁전', sx, gy - 145, 22, '#6b3a1a');
      txt(cx, 'NODEOK PALACE', sx, gy - 124, 11, '#a07a4a', 600);
      floor(cx, VW, VH, gy, '#c8894c', '#e0a768');
      shade(cx, VW, gy);
    },
  },

  /* ---------------------------------------------------------- 2 */
  {
    key: 'postoffice', name: '원주우체국', where: '앞마당',
    music: 'post',
    draw: function (cx, VW, VH, camX, gy, t) {
      sky(cx, VW, VH, '#bfe0f5', '#eaf5fb');
      rep(cx, camX, .08, 300, function (x) {          // 구름
        cx.fillStyle = 'rgba(255,255,255,.8)';
        cx.beginPath(); cx.ellipse(x + 90, gy - 320, 62, 24, 0, 0, 7); cx.fill();
        cx.beginPath(); cx.ellipse(x + 140, gy - 336, 44, 20, 0, 0, 7); cx.fill();
      });
      rep(cx, camX, .18, 260, function (x) {          // 먼 산
        cx.fillStyle = '#9fb8c8';
        cx.beginPath(); cx.moveTo(x, gy - 120); cx.lineTo(x + 130, gy - 240);
        cx.lineTo(x + 260, gy - 120); cx.closePath(); cx.fill();
      });
      var bx = VW / 2 + px(camX, .35);
      cx.fillStyle = '#eceff4'; cx.fillRect(bx - 260, gy - 260, 520, 260);
      cx.fillStyle = '#d6262e'; cx.fillRect(bx - 268, gy - 286, 536, 30);
      txt(cx, '원주우체국', bx, gy - 264, 20, '#ffffff');
      cx.fillStyle = '#c9d3de';
      for (var i = 0; i < 6; i++) cx.fillRect(bx - 230 + i * 82, gy - 232, 54, 62);
      cx.fillStyle = '#2b3a52'; cx.fillRect(bx - 46, gy - 132, 92, 132);
      cx.fillStyle = '#4a5e7e'; cx.fillRect(bx - 40, gy - 126, 38, 126);
      cx.fillStyle = '#e8c766'; cx.fillRect(bx - 268, gy - 292, 536, 6);
      // 우체통 · 우편 수레
      var mx = bx - 340 + px(camX, .35);
      cx.fillStyle = '#d6262e'; cx.fillRect(mx - 16, gy - 96, 32, 96);
      cx.beginPath(); cx.arc(mx, gy - 96, 16, Math.PI, 0); cx.fill();
      cx.fillStyle = '#8f1a20'; cx.fillRect(mx - 10, gy - 84, 20, 6);
      var cxx = bx + 320 + px(camX, .35);
      cx.fillStyle = '#c9a06a'; cx.fillRect(cxx - 30, gy - 46, 60, 46);
      cx.fillStyle = '#8d1f2d'; cx.fillRect(cxx - 30, gy - 26, 60, 5);
      floor(cx, VW, VH, gy, '#6d757f', '#8b939c');
      shade(cx, VW, gy);
    },
  },

  /* ---------------------------------------------------------- 3 */
  {
    key: 'somo', name: '소모그룹', where: '본사 로비 앞',
    music: 'corp',
    draw: function (cx, VW, VH, camX, gy, t) {
      sky(cx, VW, VH, '#20304e', '#4a6a94');
      rep(cx, camX, .10, 190, function (x) {          // 도시 실루엣
        cx.fillStyle = '#16233c';
        var h = 150 + ((Math.abs(Math.round(x / 190)) * 67) % 160);
        cx.fillRect(x, gy - h, 150, h);
        cx.fillStyle = 'rgba(255,220,150,.30)';
        for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) {
          if ((r * 7 + c * 3 + Math.round(x / 190)) % 3) continue;
          cx.fillRect(x + 16 + c * 32, gy - h + 18 + r * 26, 16, 14);
        }
      });
      var bx = VW / 2 + px(camX, .35);
      cx.fillStyle = '#2c3a58'; cx.fillRect(bx - 240, gy - 400, 480, 400);
      cx.fillStyle = '#3d5580';
      for (var r2 = 0; r2 < 8; r2++)
        for (var c2 = 0; c2 < 7; c2++)
          cx.fillRect(bx - 216 + c2 * 64, gy - 384 + r2 * 44, 48, 30);
      cx.fillStyle = '#101828'; cx.fillRect(bx - 120, gy - 120, 240, 120);
      cx.fillStyle = 'rgba(160,200,255,.18)'; cx.fillRect(bx - 112, gy - 112, 104, 112);
      cx.fillStyle = 'rgba(160,200,255,.18)'; cx.fillRect(bx + 8, gy - 112, 104, 112);
      cx.fillStyle = '#e8c766'; cx.fillRect(bx - 150, gy - 150, 300, 30);
      txt(cx, '소모그룹', bx, gy - 128, 21, '#1a2233');
      txt(cx, 'SOMO GROUP', bx, gy - 160, 12, 'rgba(255,255,255,.6)', 600);
      floor(cx, VW, VH, gy, '#1b2436', '#2b3852');
      shade(cx, VW, gy);
    },
  },

  /* ---------------------------------------------------------- 4 */
  {
    key: 'beer', name: '칭따오 창고', where: '맥주 상자가 쌓인 창고',
    music: 'beer',
    draw: function (cx, VW, VH, camX, gy, t) {
      sky(cx, VW, VH, '#2a2f3a', '#3c4450');
      rep(cx, camX, .10, 300, function (x) {          // 창고 벽 · 채광창
        cx.fillStyle = '#454d5e'; cx.fillRect(x, gy - 420, 290, 420);
        cx.fillStyle = 'rgba(200,220,255,.16)';
        cx.fillRect(x + 30, gy - 400, 230, 70);
      });
      // 맥주 상자 더미
      var bx = px(camX, .3);
      function crate(x, y, w, h) {
        cx.fillStyle = '#2f7a3f'; cx.fillRect(x, y, w, h);
        cx.strokeStyle = 'rgba(10,20,12,.55)'; cx.lineWidth = 2; cx.strokeRect(x, y, w, h);
        cx.fillStyle = '#f2e2b0'; cx.fillRect(x + 6, y + h * 0.32, w - 12, h * 0.30);
        cx.fillStyle = '#2f7a3f';
        cx.font = 'bold ' + Math.max(9, h * 0.20) + 'px sans-serif';
        cx.textAlign = 'center';
        cx.fillText('칭따오', x + w / 2, y + h * 0.56);
        cx.textAlign = 'left';
      }
      for (var s = -1; s < Math.ceil(VW / 420) + 1; s++) {
        var sx = bx % 420 + s * 420;
        for (var row = 0; row < 4; row++) {
          var n = 4 - row;
          for (var i = 0; i < n; i++) {
            crate(sx + 20 + i * 78 + row * 39, gy - 74 * (row + 1), 74, 70);
          }
        }
      }
      // 앞쪽 낮은 상자(무대 바닥 장식)
      cx.fillStyle = 'rgba(10,14,20,.35)'; cx.fillRect(0, gy - 8, VW, 8);
      floor(cx, VW, VH, gy, '#2b3038', '#3a4150');
      shade(cx, VW, gy);
    },
  },

  /* ---------------------------------------------------------- 5 */
  {
    key: 'jokgu', name: '족구장', where: '동네 족구 코트',
    music: 'jokgu',
    draw: function (cx, VW, VH, camX, gy, t) {
      sky(cx, VW, VH, '#8fd0f0', '#dff0fa');
      rep(cx, camX, .08, 340, function (x) {          // 나무
        cx.fillStyle = '#4a3526'; cx.fillRect(x + 60, gy - 130, 14, 130);
        cx.fillStyle = '#3f8a44';
        cx.beginPath(); cx.arc(x + 67, gy - 150, 46, 0, 7); cx.fill();
        cx.beginPath(); cx.arc(x + 40, gy - 128, 32, 0, 7); cx.fill();
        cx.beginPath(); cx.arc(x + 96, gy - 128, 32, 0, 7); cx.fill();
      });
      rep(cx, camX, .2, 200, function (x) {           // 철망 울타리 — 기둥과 촘촘한 격자
        cx.strokeStyle = 'rgba(170,186,198,.55)'; cx.lineWidth = 3;
        cx.beginPath(); cx.moveTo(x, gy - 150); cx.lineTo(x, gy); cx.stroke();
        cx.save();
        cx.beginPath(); cx.rect(x, gy - 150, 200, 150); cx.clip();   // 울타리 밖으로 선이 새지 않게
        cx.strokeStyle = 'rgba(180,195,205,.22)'; cx.lineWidth = 1;
        for (var i = -8; i < 14; i++) {
          cx.beginPath(); cx.moveTo(x + i * 18, gy); cx.lineTo(x + i * 18 + 150, gy - 150); cx.stroke();
          cx.beginPath(); cx.moveTo(x + i * 18, gy); cx.lineTo(x + i * 18 - 150, gy - 150); cx.stroke();
        }
        cx.restore();
        cx.strokeStyle = 'rgba(170,186,198,.5)'; cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(x, gy - 150); cx.lineTo(x + 200, gy - 150); cx.stroke();
      });
      // 네트
      var nx = VW / 2 + px(camX, .35);
      cx.fillStyle = '#6a7280'; cx.fillRect(nx - 150, gy - 110, 6, 110);
      cx.fillRect(nx + 144, gy - 110, 6, 110);
      cx.strokeStyle = 'rgba(240,244,250,.75)'; cx.lineWidth = 1.2;
      for (var i2 = 0; i2 <= 14; i2++) {
        cx.beginPath(); cx.moveTo(nx - 150 + i2 * 21, gy - 106); cx.lineTo(nx - 150 + i2 * 21, gy - 40); cx.stroke();
      }
      for (var j = 0; j <= 5; j++) {
        cx.beginPath(); cx.moveTo(nx - 150, gy - 106 + j * 13); cx.lineTo(nx + 150, gy - 106 + j * 13); cx.stroke();
      }
      cx.fillStyle = '#f2f4f8'; cx.fillRect(nx - 150, gy - 112, 300, 7);
      floor(cx, VW, VH, gy, '#b4552f', '#cf6a3c');
      // 코트 선
      cx.strokeStyle = 'rgba(255,255,255,.7)'; cx.lineWidth = 3;
      cx.beginPath(); cx.moveTo(0, gy + 40); cx.lineTo(VW, gy + 40); cx.stroke();
      cx.beginPath(); cx.moveTo(nx, gy); cx.lineTo(nx, VH); cx.stroke();
      shade(cx, VW, gy);
    },
  },

  /* ---------------------------------------------------------- 6 */
  {
    key: 'pangyo', name: '판교역', where: '승강장',
    music: 'pangyo',
    draw: function (cx, VW, VH, camX, gy, t) {
      sky(cx, VW, VH, '#161b26', '#232a3a');
      // 승강장 안쪽 벽 · 노선도
      rep(cx, camX, .12, 360, function (x) {
        cx.fillStyle = '#2b3242'; cx.fillRect(x, gy - 300, 340, 300);
        cx.fillStyle = '#1d2330'; cx.fillRect(x + 20, gy - 280, 300, 140);
        cx.strokeStyle = '#f0c344'; cx.lineWidth = 4;
        cx.beginPath(); cx.moveTo(x + 40, gy - 210); cx.lineTo(x + 300, gy - 210); cx.stroke();
        cx.fillStyle = '#f0c344';
        for (var i = 0; i < 5; i++) {
          cx.beginPath(); cx.arc(x + 60 + i * 55, gy - 210, 6, 0, 7); cx.fill();
        }
      });
      // 역 이름 간판
      var sx = VW / 2 + px(camX, .35);
      cx.fillStyle = '#f2f4f8'; cx.fillRect(sx - 130, gy - 330, 260, 62);
      cx.fillStyle = '#2b3a52'; cx.fillRect(sx - 130, gy - 330, 260, 8);
      txt(cx, '판교', sx, gy - 296, 30, '#1a2233');
      txt(cx, 'PANGYO', sx, gy - 278, 12, '#5a6a80', 600);
      // 전동차 — 천천히 지나간다
      var tx = ((t * 90) % (VW + 900)) - 450;
      cx.fillStyle = '#7f8b9c'; cx.fillRect(tx, gy - 210, 420, 150);
      cx.fillStyle = '#2b3242'; cx.fillRect(tx, gy - 210, 420, 16);
      cx.fillStyle = 'rgba(190,220,255,.35)';
      for (var w = 0; w < 5; w++) cx.fillRect(tx + 22 + w * 82, gy - 180, 60, 54);
      cx.fillStyle = '#e8c766'; cx.fillRect(tx, gy - 76, 420, 6);
      // 승강장 안전문
      cx.fillStyle = 'rgba(210,220,235,.5)';
      for (var d = 0; d < Math.ceil(VW / 180) + 1; d++) {
        var dx = (px(camX, .35) % 180) + d * 180 - 90;
        cx.fillRect(dx, gy - 118, 6, 118);
      }
      cx.fillStyle = 'rgba(210,220,235,.28)'; cx.fillRect(0, gy - 124, VW, 8);
      floor(cx, VW, VH, gy, '#3a4150', '#4b5464');
      cx.fillStyle = '#f0c344'; cx.fillRect(0, gy + 26, VW, 6);   // 노란 안전선
      shade(cx, VW, gy);
    },
  },

  /* ---------------------------------------------------------- 7 */
  {
    key: 'halla', name: '한라대학교', where: '캠퍼스 잔디밭',
    music: 'halla',
    draw: function (cx, VW, VH, camX, gy, t) {
      sky(cx, VW, VH, '#a8d0f0', '#e8f2fa');
      rep(cx, camX, .1, 380, function (x) {           // 먼 산
        cx.fillStyle = '#7f9ec0';
        cx.beginPath(); cx.moveTo(x, gy - 150); cx.lineTo(x + 190, gy - 300);
        cx.lineTo(x + 380, gy - 150); cx.closePath(); cx.fill();
      });
      var bx = VW / 2 + px(camX, .35);
      // 본관 — 가운데 시계탑
      cx.fillStyle = '#e6dccb'; cx.fillRect(bx - 300, gy - 240, 600, 240);
      cx.fillStyle = '#8d4a3a'; cx.fillRect(bx - 310, gy - 258, 620, 20);
      cx.fillStyle = '#e6dccb'; cx.fillRect(bx - 60, gy - 350, 120, 110);
      cx.fillStyle = '#8d4a3a';
      cx.beginPath(); cx.moveTo(bx - 72, gy - 350); cx.lineTo(bx, gy - 404); cx.lineTo(bx + 72, gy - 350); cx.closePath(); cx.fill();
      cx.fillStyle = '#f6efe0';
      cx.beginPath(); cx.arc(bx, gy - 305, 24, 0, 7); cx.fill();
      cx.strokeStyle = '#3a3a44'; cx.lineWidth = 2.4;
      cx.beginPath(); cx.moveTo(bx, gy - 305); cx.lineTo(bx, gy - 321); cx.stroke();
      cx.beginPath(); cx.moveTo(bx, gy - 305); cx.lineTo(bx + 13, gy - 301); cx.stroke();
      cx.fillStyle = '#9fb6cc';
      for (var r = 0; r < 3; r++)
        for (var c = 0; c < 12; c++)
          cx.fillRect(bx - 280 + c * 48, gy - 220 + r * 62, 32, 40);
      cx.fillStyle = '#2b3a52'; cx.fillRect(bx - 40, gy - 96, 80, 96);
      txt(cx, '한라대학교', bx, gy - 250, 18, '#f6efe0');
      // 잔디밭 · 벤치
      floor(cx, VW, VH, gy, '#3f7a3c', '#57a04a');
      var bnx = bx - 380 + px(camX, .35);
      cx.fillStyle = '#8d6a3a'; cx.fillRect(bnx - 44, gy - 30, 88, 8);
      cx.fillRect(bnx - 38, gy - 22, 8, 22); cx.fillRect(bnx + 30, gy - 22, 8, 22);
      shade(cx, VW, gy);
    },
  },
];

window.STAGES = STAGES;
})();
