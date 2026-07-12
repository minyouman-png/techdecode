'use strict';

/* ============================================================
   MENEW SOFT — VOXEL WORLD  (AI-built indie game, July 2026)
   - 무한 청크 지형 (시드 기반 절차 생성)
   - 블록 부수기/설치, 물, 나무, 광석, 눈 산
   - 1인칭 물리 (중력/점프/수영/비행), 낮밤 사이클
   - 편집 내용 localStorage 자동 저장, 5개 언어 지원
   ============================================================ */

window.onerror = function (msg, src, line) {
  var e = document.getElementById('err');
  if (e) { e.style.display = 'block'; e.textContent = 'Error: ' + msg + ' (line ' + line + ')'; }
};

/* ===== 다국어 (?lang=en|ko|ja|es|zh, 미지정 시 브라우저 언어) ===== */
const I18N = {
  en: {
    play: '▶ Play', newWorld: '🌍 New World',
    help: '<b>W A S D</b> Move &nbsp;&nbsp; <b>Mouse</b> Look &nbsp;&nbsp; <b>Space</b> Jump · Swim<br><b>Left click</b> Break block &nbsp;&nbsp; <b>Right click</b> Place block<br><b>1–9 / Wheel</b> Select block &nbsp;&nbsp; <b>Shift</b> Sprint &nbsp;&nbsp; <b>F</b> Fly (Space↑ C↓)<br><b>ESC</b> Menu',
    tip: 'Click the screen to start · Your builds are saved automatically in this browser',
    credit: 'An indie game built 100% with AI · July 2026 · ',
    flyOn: '✈️ Fly mode ON (Space↑ / C↓)', flyOff: 'Fly mode OFF',
    bedrock: 'Bedrock cannot be broken',
    day: '☀️ Day', night: '🌙 Night', fly: '✈️ Flying',
    confirmNew: 'Delete this world and create a new one?',
    blocks: { 1: 'Grass', 2: 'Dirt', 3: 'Stone', 4: 'Sand', 5: 'Wood Log', 6: 'Leaves', 7: 'Water', 8: 'Planks', 9: 'Cobblestone', 10: 'Bricks', 11: 'Coal Ore', 12: 'Iron Ore', 13: 'Snow', 14: 'Bedrock' }
  },
  ko: {
    play: '▶ 게임 시작', newWorld: '🌍 새 세계 만들기',
    help: '<b>W A S D</b> 이동 &nbsp;&nbsp; <b>마우스</b> 시점 &nbsp;&nbsp; <b>Space</b> 점프·수영<br><b>좌클릭</b> 블록 부수기 &nbsp;&nbsp; <b>우클릭</b> 블록 설치<br><b>1~9 / 휠</b> 블록 선택 &nbsp;&nbsp; <b>Shift</b> 달리기 &nbsp;&nbsp; <b>F</b> 비행 (Space↑ C↓)<br><b>ESC</b> 메뉴',
    tip: '화면을 클릭하면 시작됩니다 · 만든 건물은 이 브라우저에 자동 저장됩니다',
    credit: 'AI로 100% 제작한 인디게임 · 2026년 7월 · ',
    flyOn: '✈️ 비행 모드 ON (Space↑ / C↓)', flyOff: '비행 모드 OFF',
    bedrock: '기반암은 부술 수 없습니다',
    day: '☀️ 낮', night: '🌙 밤', fly: '✈️ 비행',
    confirmNew: '현재 세계를 지우고 새 세계를 만들까요?',
    blocks: { 1: '잔디', 2: '흙', 3: '돌', 4: '모래', 5: '원목', 6: '나뭇잎', 7: '물', 8: '판자', 9: '조약돌', 10: '벽돌', 11: '석탄 광석', 12: '철 광석', 13: '눈', 14: '기반암' }
  },
  ja: {
    play: '▶ ゲーム開始', newWorld: '🌍 新しい世界',
    help: '<b>W A S D</b> 移動 &nbsp;&nbsp; <b>マウス</b> 視点 &nbsp;&nbsp; <b>Space</b> ジャンプ·水泳<br><b>左クリック</b> ブロック破壊 &nbsp;&nbsp; <b>右クリック</b> ブロック設置<br><b>1~9 / ホイール</b> ブロック選択 &nbsp;&nbsp; <b>Shift</b> ダッシュ &nbsp;&nbsp; <b>F</b> 飛行 (Space↑ C↓)<br><b>ESC</b> メニュー',
    tip: '画面をクリックすると開始します · 建てたものはこのブラウザに自動保存されます',
    credit: 'AIだけで作られたインディーゲーム · 2026年7月 · ',
    flyOn: '✈️ 飛行モード ON (Space↑ / C↓)', flyOff: '飛行モード OFF',
    bedrock: '岩盤は破壊できません',
    day: '☀️ 昼', night: '🌙 夜', fly: '✈️ 飛行中',
    confirmNew: 'この世界を削除して新しい世界を作りますか？',
    blocks: { 1: '草ブロック', 2: '土', 3: '石', 4: '砂', 5: '原木', 6: '葉', 7: '水', 8: '板材', 9: '丸石', 10: 'レンガ', 11: '石炭鉱石', 12: '鉄鉱石', 13: '雪', 14: '岩盤' }
  },
  es: {
    play: '▶ Jugar', newWorld: '🌍 Nuevo mundo',
    help: '<b>W A S D</b> Moverse &nbsp;&nbsp; <b>Ratón</b> Mirar &nbsp;&nbsp; <b>Space</b> Saltar · Nadar<br><b>Clic izq.</b> Romper bloque &nbsp;&nbsp; <b>Clic der.</b> Colocar bloque<br><b>1–9 / Rueda</b> Elegir bloque &nbsp;&nbsp; <b>Shift</b> Correr &nbsp;&nbsp; <b>F</b> Volar (Space↑ C↓)<br><b>ESC</b> Menú',
    tip: 'Haz clic en la pantalla para empezar · Tus construcciones se guardan automáticamente en este navegador',
    credit: 'Un juego indie creado 100% con IA · Julio de 2026 · ',
    flyOn: '✈️ Modo vuelo ON (Space↑ / C↓)', flyOff: 'Modo vuelo OFF',
    bedrock: 'La roca madre no se puede romper',
    day: '☀️ Día', night: '🌙 Noche', fly: '✈️ Volando',
    confirmNew: '¿Borrar este mundo y crear uno nuevo?',
    blocks: { 1: 'Hierba', 2: 'Tierra', 3: 'Piedra', 4: 'Arena', 5: 'Tronco', 6: 'Hojas', 7: 'Agua', 8: 'Tablones', 9: 'Adoquín', 10: 'Ladrillos', 11: 'Mena de carbón', 12: 'Mena de hierro', 13: 'Nieve', 14: 'Roca madre' }
  },
  zh: {
    play: '▶ 开始游戏', newWorld: '🌍 新世界',
    help: '<b>W A S D</b> 移动 &nbsp;&nbsp; <b>鼠标</b> 视角 &nbsp;&nbsp; <b>Space</b> 跳跃·游泳<br><b>左键</b> 破坏方块 &nbsp;&nbsp; <b>右键</b> 放置方块<br><b>1~9 / 滚轮</b> 选择方块 &nbsp;&nbsp; <b>Shift</b> 奔跑 &nbsp;&nbsp; <b>F</b> 飞行 (Space↑ C↓)<br><b>ESC</b> 菜单',
    tip: '点击屏幕开始 · 你的建筑会自动保存在此浏览器中',
    credit: '100% 由 AI 制作的独立游戏 · 2026年7月 · ',
    flyOn: '✈️ 飞行模式 ON (Space↑ / C↓)', flyOff: '飞行模式 OFF',
    bedrock: '基岩无法破坏',
    day: '☀️ 白天', night: '🌙 夜晚', fly: '✈️ 飞行中',
    confirmNew: '删除当前世界并创建新世界？',
    blocks: { 1: '草方块', 2: '泥土', 3: '石头', 4: '沙子', 5: '原木', 6: '树叶', 7: '水', 8: '木板', 9: '圆石', 10: '砖块', 11: '煤矿石', 12: '铁矿石', 13: '雪', 14: '基岩' }
  }
};
let LANG = new URLSearchParams(location.search).get('lang');
if (!I18N[LANG]) LANG = (navigator.language || 'en').slice(0, 2);
if (!I18N[LANG]) LANG = 'en';
const L = I18N[LANG];
(function applyLang() {
  document.documentElement.lang = LANG;
  document.getElementById('playBtn').textContent = L.play;
  document.getElementById('newBtn').textContent = L.newWorld;
  document.getElementById('help').innerHTML = L.help;
  document.getElementById('tip').textContent = L.tip;
  const gamesUrl = LANG === 'en' ? '/games/' : '/' + LANG + '/games/';
  document.getElementById('credit').innerHTML =
    L.credit + '<a href="' + gamesUrl + '">MENEW SOFT</a>';
  document.querySelectorAll('#overlay a').forEach(function (a) {
    a.addEventListener('click', function (e) { e.stopPropagation(); });
  });
})();

/* ===== 상수 ===== */
const CHUNK = 16;          // 청크 가로/세로
const WH = 64;             // 월드 높이
const SEA = 12;            // 해수면
const R = 4;               // 렌더 거리(청크)
const EPS = 1e-4;
const P_HALF = 0.3, P_H = 1.8, EYE = 1.62;

/* ===== 시드 / 저장 ===== */
let SEED = parseInt(localStorage.getItem('mcw_seed') || '0', 10);
if (!SEED) { SEED = (Math.random() * 2147483646 | 0) + 1; localStorage.setItem('mcw_seed', String(SEED)); }
let edits = {};
try { edits = JSON.parse(localStorage.getItem('mcw_edits') || '{}') || {}; } catch (e) { edits = {}; }
let saveTimer = null;
function saveEdits() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    try { localStorage.setItem('mcw_edits', JSON.stringify(edits)); } catch (e) {}
  }, 600);
}

/* ===== 노이즈 ===== */
function hash2(ix, iz, salt) {
  let n = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(SEED + (salt | 0), 974634121)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 4294967296;
}
function noise2(x, z, salt) {
  const ix = Math.floor(x), iz = Math.floor(z);
  let fx = x - ix, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, salt), b = hash2(ix + 1, iz, salt);
  const c = hash2(ix, iz + 1, salt), d = hash2(ix + 1, iz + 1, salt);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}
function terrainH(x, z) {
  const cont = noise2(x * 0.004, z * 0.004, 7);
  const hill = noise2(x * 0.016, z * 0.016, 13);
  const det = noise2(x * 0.06, z * 0.06, 29);
  const h = 5 + cont * cont * 34 + hill * 14 + det * 4;
  return Math.max(2, Math.min(WH - 14, Math.floor(h)));
}

/* ===== 블록 정의 ===== */
// tiles: [윗면, 옆면, 아랫면] 아틀라스 타일 번호
const BLOCKS = {
  1:  { name: '잔디',     tiles: [0, 1, 2] },
  2:  { name: '흙',       tiles: [2, 2, 2] },
  3:  { name: '돌',       tiles: [3, 3, 3] },
  4:  { name: '모래',     tiles: [4, 4, 4] },
  5:  { name: '원목',     tiles: [6, 5, 6] },
  6:  { name: '나뭇잎',   tiles: [7, 7, 7] },
  7:  { name: '물',       tiles: [14, 14, 14], water: true },
  8:  { name: '판자',     tiles: [8, 8, 8] },
  9:  { name: '조약돌',   tiles: [9, 9, 9] },
  10: { name: '벽돌',     tiles: [10, 10, 10] },
  11: { name: '석탄 광석', tiles: [11, 11, 11] },
  12: { name: '철 광석',  tiles: [12, 12, 12] },
  13: { name: '눈',       tiles: [13, 13, 13] },
  14: { name: '기반암',   tiles: [15, 15, 15] }
};
const HOTBAR = [1, 2, 3, 4, 5, 6, 8, 9, 10];

/* ===== 텍스처 아틀라스 (4x4 타일, 절차 생성) ===== */
const atlasCanvas = document.createElement('canvas');
(function makeAtlas() {
  atlasCanvas.width = 64; atlasCanvas.height = 64;
  const g = atlasCanvas.getContext('2d');
  const rnd = function (a, b) { return a + Math.random() * (b - a); };
  function vary(r, gr, b, v) {
    const d = rnd(-v, v);
    return 'rgb(' + Math.max(0, Math.min(255, r + d | 0)) + ',' +
      Math.max(0, Math.min(255, gr + d | 0)) + ',' +
      Math.max(0, Math.min(255, b + d | 0)) + ')';
  }
  function tile(t, fn) {
    const tx = (t % 4) * 16, ty = Math.floor(t / 4) * 16;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      g.fillStyle = fn(x, y); g.fillRect(tx + x, ty + y, 1, 1);
    }
  }
  tile(0, function () { return vary(112, 176, 66, 16); });                       // 잔디 윗면
  tile(2, function () { return vary(134, 96, 67, 13); });                        // 흙
  tile(1, function (x, y) {                                                     // 잔디 옆면
    return y < 3 + (x * 7 % 3 === 0 ? 1 : 0) ? vary(112, 176, 66, 14) : vary(134, 96, 67, 13);
  });
  tile(3, function () { return vary(127, 127, 127, 11); });                      // 돌
  tile(4, function () { return vary(219, 207, 163, 10); });                      // 모래
  tile(5, function (x) { return x % 4 === 0 ? vary(74, 55, 34, 6) : vary(104, 80, 50, 10); }); // 원목 옆
  tile(6, function (x, y) {                                                     // 원목 윗면(나이테)
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    return d % 3 < 1.2 ? vary(88, 65, 40, 6) : vary(172, 140, 96, 8);
  });
  tile(7, function () { return Math.random() < 0.2 ? vary(36, 82, 24, 8) : vary(56, 122, 38, 16); }); // 나뭇잎
  tile(8, function (x, y) {                                                     // 판자
    const seam = (y % 4 === 3) || (y % 8 < 4 ? x === 11 : x === 3);
    return seam ? vary(94, 72, 44, 5) : vary(160, 130, 78, 8);
  });
  tile(9, function (x, y) {                                                     // 조약돌
    const m = (Math.sin(x * 2.1 + y * 0.7) + Math.cos(y * 1.9 - x * 0.5)) * 16;
    return vary(112 + m, 112 + m, 114 + m, 10);
  });
  tile(10, function (x, y) {                                                    // 벽돌
    const off = (Math.floor(y / 4) % 2) * 4;
    const mortar = (y % 4 === 3) || ((x + off) % 8 === 7);
    return mortar ? vary(186, 186, 186, 6) : vary(150, 70, 58, 11);
  });
  tile(11, function () { return Math.random() < 0.15 ? vary(28, 28, 32, 8) : vary(127, 127, 127, 10); }); // 석탄
  tile(12, function () { return Math.random() < 0.15 ? vary(216, 168, 138, 12) : vary(127, 127, 127, 10); }); // 철
  tile(13, function () { return vary(238, 242, 246, 6); });                     // 눈
  tile(14, function () { return vary(52, 110, 205, 14); });                     // 물
  tile(15, function () { return Math.random() < 0.5 ? vary(58, 58, 58, 14) : vary(30, 30, 30, 10); }); // 기반암
})();

/* ===== THREE 기본 셋업 ===== */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 400);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const canvas = renderer.domElement;

const atlasTex = new THREE.CanvasTexture(atlasCanvas);
atlasTex.magFilter = THREE.NearestFilter;
atlasTex.minFilter = THREE.NearestFilter;
atlasTex.generateMipmaps = false;

const solidMat = new THREE.MeshLambertMaterial({ map: atlasTex, vertexColors: true });
const waterMat = new THREE.MeshLambertMaterial({
  map: atlasTex, vertexColors: true, transparent: true, opacity: 0.65,
  side: THREE.DoubleSide, depthWrite: false
});

const amb = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(amb);
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
scene.add(sun); scene.add(sun.target);

const DAY_SKY = new THREE.Color(0x8fc9ef), NIGHT_SKY = new THREE.Color(0x0a0e26);
const skyColor = DAY_SKY.clone();
scene.fog = new THREE.Fog(skyColor.getHex(), 24, R * CHUNK - 4);

/* 구름 */
const clouds = [];
(function makeClouds() {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, fog: false });
  for (let i = 0; i < 22; i++) {
    const w = 10 + Math.random() * 18, h = 7 + Math.random() * 10;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((Math.random() - 0.5) * 300, 52 + Math.random() * 8, (Math.random() - 0.5) * 300);
    scene.add(m); clouds.push(m);
  }
})();

/* 타겟 블록 하이라이트 */
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)),
  new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 })
);
highlight.visible = false;
scene.add(highlight);

/* ===== 월드 데이터 ===== */
const chunkData = new Map();   // "cx,cz" -> Uint8Array
const chunkMeshes = new Map(); // "cx,cz" -> {solid, water}

function genChunk(cx, cz) {
  const data = new Uint8Array(CHUNK * CHUNK * WH);
  const idx = function (x, y, z) { return (y * CHUNK + z) * CHUNK + x; };
  for (let lx = 0; lx < CHUNK; lx++) for (let lz = 0; lz < CHUNK; lz++) {
    const wx = cx * CHUNK + lx, wz = cz * CHUNK + lz;
    const h = terrainH(wx, wz);
    const sandy = h <= SEA + 1;
    for (let y = 0; y <= h; y++) {
      let b = 3;
      if (y === 0) b = 14;
      else if (y === h) b = h >= 36 ? 13 : (h >= 32 ? 3 : (sandy ? 4 : 1));
      else if (y >= h - 3) b = h >= 32 ? 3 : (sandy ? 4 : 2);
      else {
        if (y < 32 && hash2(wx * 3 + y * 7, wz * 5 - y * 11, 101) < 0.045) b = 11;
        else if (y < 20 && hash2(wx * 7 - y * 3, wz * 3 + y * 13, 103) < 0.028) b = 12;
      }
      data[idx(lx, y, lz)] = b;
    }
    for (let y = h + 1; y <= SEA; y++) data[idx(lx, y, lz)] = 7;
    // 나무
    if (!sandy && h < 30 && h > SEA && lx >= 2 && lx <= 13 && lz >= 2 && lz <= 13 && hash2(wx, wz, 55) < 0.022) {
      const th = 4 + Math.floor(hash2(wx, wz, 56) * 3);
      const topY = h + th;
      for (let ly = topY - 2; ly <= topY + 1 && ly < WH; ly++) {
        const rad = ly <= topY - 1 ? 2 : 1;
        for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) {
          if (dx === 0 && dz === 0 && ly <= topY) continue;
          if (Math.abs(dx) === rad && Math.abs(dz) === rad &&
            (rad === 1 ? ly > topY : hash2(wx + dx * 3 + ly, wz + dz * 5 - ly, 57) < 0.5)) continue;
          const i = idx(lx + dx, ly, lz + dz);
          if (data[i] === 0) data[i] = 6;
        }
      }
      for (let y = h + 1; y <= topY && y < WH; y++) data[idx(lx, y, lz)] = 5;
    }
  }
  // 저장된 편집 적용
  const ce = edits[cx + ',' + cz];
  if (ce) for (const k in ce) {
    const p = k.split(',');
    data[idx(+p[0], +p[1], +p[2])] = ce[k];
  }
  return data;
}

function dataAt(cx, cz) {
  const k = cx + ',' + cz;
  let d = chunkData.get(k);
  if (!d) { d = genChunk(cx, cz); chunkData.set(k, d); }
  return d;
}
function getBlock(x, y, z) {
  if (y < 0) return 14;
  if (y >= WH) return 0;
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  const d = chunkData.get(cx + ',' + cz);
  if (!d) return 0;
  return d[(y * CHUNK + (z - cz * CHUNK)) * CHUNK + (x - cx * CHUNK)];
}
function isSolid(x, y, z) { const b = getBlock(x, y, z); return b !== 0 && b !== 7; }

function setBlock(x, y, z, id) {
  if (y < 1 || y >= WH) return;
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  const lx = x - cx * CHUNK, lz = z - cz * CHUNK;
  dataAt(cx, cz)[(y * CHUNK + lz) * CHUNK + lx] = id;
  const ck = cx + ',' + cz;
  if (!edits[ck]) edits[ck] = {};
  edits[ck][lx + ',' + y + ',' + lz] = id;
  saveEdits();
  buildChunkMesh(cx, cz);
  if (lx === 0) buildChunkMesh(cx - 1, cz);
  if (lx === CHUNK - 1) buildChunkMesh(cx + 1, cz);
  if (lz === 0) buildChunkMesh(cx, cz - 1);
  if (lz === CHUNK - 1) buildChunkMesh(cx, cz + 1);
}

/* ===== 메싱 ===== */
// three.js 복셀 표준 면 정의 (CCW 앞면)
const FACES = [
  { dir: [-1, 0, 0], ti: 1, shade: 0.62, corners: [[[0,1,0],[0,1]],[[0,0,0],[0,0]],[[0,1,1],[1,1]],[[0,0,1],[1,0]]] },
  { dir: [ 1, 0, 0], ti: 1, shade: 0.62, corners: [[[1,1,1],[0,1]],[[1,0,1],[0,0]],[[1,1,0],[1,1]],[[1,0,0],[1,0]]] },
  { dir: [ 0,-1, 0], ti: 2, shade: 0.50, corners: [[[1,0,1],[1,0]],[[0,0,1],[0,0]],[[1,0,0],[1,1]],[[0,0,0],[0,1]]] },
  { dir: [ 0, 1, 0], ti: 0, shade: 1.00, corners: [[[0,1,1],[1,1]],[[1,1,1],[0,1]],[[0,1,0],[1,0]],[[1,1,0],[0,0]]] },
  { dir: [ 0, 0,-1], ti: 1, shade: 0.80, corners: [[[1,0,0],[0,0]],[[0,0,0],[1,0]],[[1,1,0],[0,1]],[[0,1,0],[1,1]]] },
  { dir: [ 0, 0, 1], ti: 1, shade: 0.80, corners: [[[0,0,1],[0,0]],[[1,0,1],[1,0]],[[0,1,1],[0,1]],[[1,1,1],[1,1]]] }
];

function buildChunkMesh(cx, cz) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) dataAt(cx + dx, cz + dz);
  const d = dataAt(cx, cz);
  const key = cx + ',' + cz;
  const old = chunkMeshes.get(key);
  if (old) {
    scene.remove(old.solid); scene.remove(old.water);
    old.solid.geometry.dispose(); old.water.geometry.dispose();
  }
  const S = { pos: [], nor: [], uv: [], col: [], ind: [] };
  const W = { pos: [], nor: [], uv: [], col: [], ind: [] };
  const x0 = cx * CHUNK, z0 = cz * CHUNK;

  for (let y = 0; y < WH; y++) for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
    const id = d[(y * CHUNK + lz) * CHUNK + lx];
    if (!id) continue;
    const wx = x0 + lx, wz = z0 + lz;
    const water = id === 7;
    const T = water ? W : S;
    const tiles = BLOCKS[id].tiles;
    for (let f = 0; f < 6; f++) {
      const F = FACES[f];
      const nb = getBlock(wx + F.dir[0], y + F.dir[1], wz + F.dir[2]);
      if (water) { if (nb !== 0) continue; }
      else if (nb !== 0 && nb !== 7) continue;
      const tl = tiles[F.ti];
      const tx = tl % 4, ty = Math.floor(tl / 4);
      const ndx = T.pos.length / 3;
      for (let c = 0; c < 4; c++) {
        const P = F.corners[c][0], U = F.corners[c][1];
        // 물 윗면은 살짝 낮게
        const yTop = (water && P[1] === 1 && f === 3) ? 0.88 : P[1];
        T.pos.push(wx + P[0], y + yTop, wz + P[2]);
        T.nor.push(F.dir[0], F.dir[1], F.dir[2]);
        T.uv.push((tx + U[0]) / 4, (3 - ty + U[1]) / 4);
        T.col.push(F.shade, F.shade, F.shade);
      }
      T.ind.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
    }
  }
  function toMesh(T, mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(T.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(T.col, 3));
    g.setIndex(T.ind);
    const m = new THREE.Mesh(g, mat);
    m.matrixAutoUpdate = false;
    return m;
  }
  const solid = toMesh(S, solidMat), water = toMesh(W, waterMat);
  scene.add(solid); scene.add(water);
  chunkMeshes.set(key, { solid: solid, water: water });
}

/* ===== 청크 스트리밍 ===== */
let camCx = 1e9, camCz = 1e9;
const buildQueue = [];
function updateChunks() {
  const cx = Math.floor(player.pos.x / CHUNK), cz = Math.floor(player.pos.z / CHUNK);
  if (cx !== camCx || cz !== camCz) {
    camCx = cx; camCz = cz;
    buildQueue.length = 0;
    for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
      if (!chunkMeshes.has((cx + dx) + ',' + (cz + dz))) buildQueue.push([cx + dx, cz + dz, dx * dx + dz * dz]);
    }
    buildQueue.sort(function (a, b) { return a[2] - b[2]; });
    chunkMeshes.forEach(function (m, k) {
      const p = k.split(',');
      if (Math.max(Math.abs(+p[0] - cx), Math.abs(+p[1] - cz)) > R + 1) {
        scene.remove(m.solid); scene.remove(m.water);
        m.solid.geometry.dispose(); m.water.geometry.dispose();
        chunkMeshes.delete(k);
        chunkData.delete(k);
      }
    });
  }
  let n = 0;
  while (buildQueue.length && n < 2) {
    const c = buildQueue.shift();
    if (!chunkMeshes.has(c[0] + ',' + c[1])) { buildChunkMesh(c[0], c[1]); n++; }
  }
}

/* ===== 플레이어 ===== */
const player = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), onGround: false, fly: false };
let yaw = 0, pitch = 0, locked = false, sel = 0;
const keys = {};

function findSpawn() {
  for (let rr = 0; rr < 200; rr += 4) {
    for (let a = 0; a < 12; a++) {
      const x = Math.round(Math.cos(a / 12 * 6.283) * rr);
      const z = Math.round(Math.sin(a / 12 * 6.283) * rr);
      const h = terrainH(x, z);
      if (h > SEA + 1 && h < 28) return new THREE.Vector3(x + 0.5, h + 1.01, z + 0.5);
    }
  }
  return new THREE.Vector3(0.5, terrainH(0, 0) + 2, 0.5);
}

function eachOverlap(cb) {
  const p = player.pos;
  const x0 = Math.floor(p.x - P_HALF), x1 = Math.floor(p.x + P_HALF - EPS);
  const y0 = Math.floor(p.y), y1 = Math.floor(p.y + P_H - EPS);
  const z0 = Math.floor(p.z - P_HALF), z1 = Math.floor(p.z + P_HALF - EPS);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    if (isSolid(x, y, z)) cb(x, y, z);
  }
}

function physics(dt) {
  const p = player.pos, v = player.vel;
  dataAt(Math.floor(p.x / CHUNK), Math.floor(p.z / CHUNK)); // 발밑 데이터 보장

  const inWater = getBlock(Math.floor(p.x), Math.floor(p.y + 0.4), Math.floor(p.z)) === 7 ||
                  getBlock(Math.floor(p.x), Math.floor(p.y + 1.4), Math.floor(p.z)) === 7;

  // 수평 이동
  let ix = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  let iz = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  const il = Math.hypot(ix, iz);
  if (il > 0) { ix /= il; iz /= il; }
  let speed = player.fly ? 13 : ((keys.ShiftLeft || keys.ShiftRight) ? 6.8 : 4.4);
  if (inWater && !player.fly) speed *= 0.55;
  const sy = Math.sin(yaw), cy = Math.cos(yaw);
  v.x = (-sy * iz + cy * ix) * speed;
  v.z = (-cy * iz - sy * ix) * speed;

  // 수직 이동
  if (player.fly) {
    v.y = ((keys.Space ? 1 : 0) - (keys.KeyC ? 1 : 0)) * 9;
  } else if (inWater) {
    v.y -= 10 * dt;
    if (v.y < -3.5) v.y = -3.5;
    if (keys.Space) v.y = 4.2;
  } else {
    v.y -= 26 * dt;
    if (v.y < -50) v.y = -50;
    if (keys.Space && player.onGround) { v.y = 8.4; player.onGround = false; }
  }

  // X축
  p.x += v.x * dt;
  eachOverlap(function (x) {
    if (v.x > 0) p.x = x - P_HALF - EPS; else if (v.x < 0) p.x = x + 1 + P_HALF + EPS;
    v.x = 0;
  });
  // Z축
  p.z += v.z * dt;
  eachOverlap(function (x, y, z) {
    if (v.z > 0) p.z = z - P_HALF - EPS; else if (v.z < 0) p.z = z + 1 + P_HALF + EPS;
    v.z = 0;
  });
  // Y축
  player.onGround = false;
  p.y += v.y * dt;
  eachOverlap(function (x, y) {
    if (v.y > 0) p.y = y - P_H - EPS;
    else if (v.y < 0) { p.y = y + 1 + EPS; player.onGround = true; }
    v.y = 0;
  });
  if (p.y < -10) { p.y = WH; v.y = 0; } // 만일의 낙사 방지
}

/* ===== 레이캐스트 (DDA) ===== */
const _dir = new THREE.Vector3();
function raycast(maxD) {
  const o = camera.position;
  camera.getWorldDirection(_dir);
  const d = _dir;
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
  const stepX = d.x >= 0 ? 1 : -1, stepY = d.y >= 0 ? 1 : -1, stepZ = d.z >= 0 ? 1 : -1;
  const tdx = Math.abs(1 / d.x), tdy = Math.abs(1 / d.y), tdz = Math.abs(1 / d.z);
  let tmx = d.x !== 0 ? Math.abs((stepX > 0 ? x + 1 - o.x : o.x - x)) * tdx : Infinity;
  let tmy = d.y !== 0 ? Math.abs((stepY > 0 ? y + 1 - o.y : o.y - y)) * tdy : Infinity;
  let tmz = d.z !== 0 ? Math.abs((stepZ > 0 ? z + 1 - o.z : o.z - z)) * tdz : Infinity;
  let fx = 0, fy = 0, fz = 0, t = 0;
  for (let i = 0; i < 200; i++) {
    const b = getBlock(x, y, z);
    if (b !== 0 && b !== 7) return { x: x, y: y, z: z, fx: fx, fy: fy, fz: fz, id: b };
    if (tmx < tmy && tmx < tmz) { x += stepX; t = tmx; tmx += tdx; fx = -stepX; fy = 0; fz = 0; }
    else if (tmy < tmz) { y += stepY; t = tmy; tmy += tdy; fx = 0; fy = -stepY; fz = 0; }
    else { z += stepZ; t = tmz; tmz += tdz; fx = 0; fy = 0; fz = -stepZ; }
    if (t > maxD) return null;
  }
  return null;
}

/* ===== 사운드 ===== */
let actx = null;
function sound(kind) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    const t = actx.currentTime;
    if (kind === 'break') {
      o.type = 'square';
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.09);
      g.gain.setValueAtTime(0.12, t);
    } else {
      o.type = 'square';
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(150, t + 0.05);
      g.gain.setValueAtTime(0.09, t);
    }
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    o.start(t); o.stop(t + 0.13);
  } catch (e) {}
}

/* ===== 입력 ===== */
addEventListener('keydown', function (e) {
  keys[e.code] = true;
  if (e.code.indexOf('Digit') === 0) {
    const n = +e.code.slice(5);
    if (n >= 1 && n <= HOTBAR.length) selectSlot(n - 1);
  }
  if (e.code === 'KeyF' && locked) {
    player.fly = !player.fly; player.vel.y = 0;
    showName(player.fly ? L.flyOn : L.flyOff);
  }
  if (e.code === 'Space' && locked) e.preventDefault();
});
addEventListener('keyup', function (e) { keys[e.code] = false; });

document.addEventListener('mousemove', function (e) {
  if (!locked) return;
  yaw -= e.movementX * 0.0023;
  pitch -= e.movementY * 0.0023;
  pitch = Math.max(-1.55, Math.min(1.55, pitch));
});

canvas.addEventListener('mousedown', function (e) {
  if (!locked) return;
  const hit = raycast(6);
  if (!hit) return;
  if (e.button === 0) {
    if (hit.id === 14) { showName(L.bedrock); return; }
    setBlock(hit.x, hit.y, hit.z, 0);
    sound('break');
  } else if (e.button === 2) {
    const px = hit.x + hit.fx, py = hit.y + hit.fy, pz = hit.z + hit.fz;
    const cur = getBlock(px, py, pz);
    if (cur !== 0 && cur !== 7) return;
    const p = player.pos;
    if (px + 1 > p.x - P_HALF && px < p.x + P_HALF &&
        pz + 1 > p.z - P_HALF && pz < p.z + P_HALF &&
        py + 1 > p.y && py < p.y + P_H) return; // 자기 몸 위치엔 설치 금지
    setBlock(px, py, pz, HOTBAR[sel]);
    sound('place');
  }
});
canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

addEventListener('wheel', function (e) {
  if (!locked) return;
  e.preventDefault();
  selectSlot((sel + (e.deltaY > 0 ? 1 : -1) + HOTBAR.length) % HOTBAR.length);
}, { passive: false });

/* 포인터 락 */
const overlay = document.getElementById('overlay');
overlay.addEventListener('click', function () {
  try { canvas.requestPointerLock(); } catch (e) {}
});
document.addEventListener('pointerlockchange', function () {
  locked = document.pointerLockElement === canvas;
  overlay.style.display = locked ? 'none' : 'flex';
  if (!locked) for (const k in keys) keys[k] = false;
});
document.getElementById('newBtn').addEventListener('click', function (e) {
  e.stopPropagation();
  if (!confirm(L.confirmNew)) return;
  localStorage.removeItem('mcw_seed');
  localStorage.removeItem('mcw_edits');
  location.reload();
});
addEventListener('resize', function () {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ===== HUD ===== */
const infoEl = document.getElementById('info');
const nameEl = document.getElementById('itemname');
let nameTimer = null;
function showName(t) {
  nameEl.textContent = t;
  nameEl.style.opacity = '1';
  clearTimeout(nameTimer);
  nameTimer = setTimeout(function () { nameEl.style.opacity = '0'; }, 1400);
}
function selectSlot(i) {
  sel = i;
  const slots = document.querySelectorAll('#hotbar .slot');
  slots.forEach(function (s, j) { s.className = 'slot' + (j === sel ? ' on' : ''); });
  showName(L.blocks[HOTBAR[sel]]);
}
(function buildHotbar() {
  const bar = document.getElementById('hotbar');
  HOTBAR.forEach(function (id, i) {
    const slot = document.createElement('div');
    slot.className = 'slot' + (i === 0 ? ' on' : '');
    const c = document.createElement('canvas');
    c.width = 40; c.height = 40;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const tl = BLOCKS[id].tiles[1];
    g.drawImage(atlasCanvas, (tl % 4) * 16, Math.floor(tl / 4) * 16, 16, 16, 0, 0, 40, 40);
    const num = document.createElement('span');
    num.textContent = i + 1;
    slot.appendChild(c); slot.appendChild(num);
    bar.appendChild(slot);
  });
})();

/* ===== 낮밤 ===== */
let dayT = 0.2; // 아침부터 시작
function updateDayNight(dt) {
  dayT = (dayT + dt / 240) % 1; // 4분 = 하루
  const s = Math.sin(dayT * Math.PI * 2);
  const f = Math.max(0, Math.min(1, s * 1.4 + 0.1));
  skyColor.copy(NIGHT_SKY).lerp(DAY_SKY, f);
  scene.fog.color.copy(skyColor);
  renderer.setClearColor(skyColor);
  amb.intensity = 0.28 + 0.34 * f;
  sun.intensity = 0.15 + 0.8 * f;
  const p = player.pos;
  sun.position.set(p.x + Math.cos(dayT * Math.PI * 2) * 90, s * 110 + 20, p.z + 40);
  sun.target.position.copy(p);
  sun.target.updateMatrixWorld();
}
function updateClouds(dt) {
  const p = player.pos;
  for (let i = 0; i < clouds.length; i++) {
    const c = clouds[i];
    c.position.x += dt * 1.6;
    if (c.position.x - p.x > 170) c.position.x -= 340;
    if (c.position.x - p.x < -170) c.position.x += 340;
    if (c.position.z - p.z > 170) c.position.z -= 340;
    if (c.position.z - p.z < -170) c.position.z += 340;
  }
}

/* ===== 메인 루프 ===== */
player.pos.copy(findSpawn());
dataAt(Math.floor(player.pos.x / CHUNK), Math.floor(player.pos.z / CHUNK));
selectSlot(0);

let last = performance.now(), fps = 60;
function tick(now) {
  requestAnimationFrame(tick);
  let dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  fps = fps * 0.95 + (1 / Math.max(dt, 1e-4)) * 0.05;

  updateChunks();

  if (locked) {
    const steps = Math.max(1, Math.ceil(dt / 0.0167));
    const sub = dt / steps;
    for (let i = 0; i < steps; i++) physics(sub);
  }

  camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z);
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  const hit = locked ? raycast(6) : null;
  if (hit) {
    highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    highlight.visible = true;
  } else highlight.visible = false;

  updateDayNight(dt);
  updateClouds(dt);

  const p = player.pos;
  infoEl.textContent = 'FPS ' + Math.round(fps) +
    '  |  XYZ ' + p.x.toFixed(1) + ' / ' + p.y.toFixed(1) + ' / ' + p.z.toFixed(1) +
    '  |  ' + (Math.sin(dayT * Math.PI * 2) > 0 ? L.day : L.night) +
    (player.fly ? '  |  ' + L.fly : '');

  renderer.render(scene, camera);
}
requestAnimationFrame(tick);
