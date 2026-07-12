'use strict';

/* ============================================================
   MENEW KART  (AI-built indie game, July 2026)
   - 마리오카트류 3D 레이싱: 서킷(언덕·뱅킹), 캐릭터 11종
   - 드리프트 부스터, 아이템(버섯/바나나/등껍질), CPU 10대
   - 바퀴 회전·조향 모션, 경사 정렬, 미니맵, 랩/순위
   - 기록: localStorage 랭킹 + 세이브 내보내기/불러오기
   - 전역 랭킹 훅: REMOTE_API 설정 시 서버 연동 (기본 비활성)
   ============================================================ */

window.onerror = function (msg, src, line) {
  var e = document.getElementById('err');
  if (e) { e.style.display = 'block'; e.textContent = 'Error: ' + msg + ' (line ' + line + ')'; }
};

const REMOTE_API = ''; // 예: 'https://kart-api.example.workers.dev' — 비우면 로컬 랭킹만 사용

/* ===== 다국어 ===== */
const I18N = {
  en: {
    sub: 'GRAND PRIX', start: '🏁 Start Race', records: '🏆 Records', back: '← Back',
    retry: '🔄 Race Again', menu: 'Menu', selectTitle: 'Choose Your Racer', nickPh: 'Nickname',
    help: '<b>↑/W</b> Accelerate &nbsp; <b>↓/S</b> Brake &nbsp; <b>←→/A D</b> Steer<br><b>Space</b> Drift (hold → turbo boost) &nbsp; <b>Shift</b> Use item &nbsp; <b>ESC</b> Menu',
    credit: 'An indie game built 100% with AI · July 2026 · ',
    expSave: '💾 Export Save', impSave: '📂 Import Save',
    impConfirm: 'Overwrite your current records with this save file?',
    impErr: 'Not a valid MeNew Kart save file', expDone: 'Save file downloaded',
    recNote: 'Rankings are stored in this browser. Export your save to move them to another computer.',
    resTitle: '🏁 Race Results', myBest: 'Personal best', running: 'racing…',
    colRank: '#', colName: 'NAME', colChar: 'RACER', colTime: 'TIME', colDate: 'DATE',
    emptyRec: 'No records yet — finish a race!', quitConfirm: 'Quit the race and return to the menu?',
    go: 'GO!', finish: 'FINISH!', lap: 'LAP', newRecord: '🎉 New personal best!'
  },
  ko: {
    sub: '그랑프리', start: '🏁 경주 시작', records: '🏆 기록실', back: '← 뒤로',
    retry: '🔄 다시 경주', menu: '메뉴로', selectTitle: '캐릭터 선택', nickPh: '닉네임',
    help: '<b>↑/W</b> 가속 &nbsp; <b>↓/S</b> 브레이크 &nbsp; <b>←→/A D</b> 조향<br><b>Space</b> 드리프트 (길게 → 부스터) &nbsp; <b>Shift</b> 아이템 사용 &nbsp; <b>ESC</b> 메뉴',
    credit: 'AI로 100% 제작한 인디게임 · 2026년 7월 · ',
    expSave: '💾 세이브 내보내기', impSave: '📂 세이브 불러오기',
    impConfirm: '이 세이브 파일로 현재 기록을 덮어쓸까요?',
    impErr: '올바른 MeNew 카트 세이브 파일이 아닙니다', expDone: '세이브 파일이 다운로드되었습니다',
    recNote: '랭킹은 이 브라우저에 저장됩니다. 다른 컴퓨터로 옮기려면 세이브를 내보내세요.',
    resTitle: '🏁 경기 결과', myBest: '개인 최고기록', running: '주행 중…',
    colRank: '순위', colName: '닉네임', colChar: '캐릭터', colTime: '기록', colDate: '날짜',
    emptyRec: '아직 기록이 없습니다 — 첫 경주를 완주해 보세요!', quitConfirm: '경주를 그만두고 메뉴로 돌아갈까요?',
    go: 'GO!', finish: 'FINISH!', lap: 'LAP', newRecord: '🎉 개인 최고기록 갱신!'
  },
  ja: {
    sub: 'グランプリ', start: '🏁 レース開始', records: '🏆 記録室', back: '← 戻る',
    retry: '🔄 もう一度', menu: 'メニューへ', selectTitle: 'キャラクター選択', nickPh: 'ニックネーム',
    help: '<b>↑/W</b> アクセル &nbsp; <b>↓/S</b> ブレーキ &nbsp; <b>←→/A D</b> ハンドル<br><b>Space</b> ドリフト (長押し → ターボ) &nbsp; <b>Shift</b> アイテム使用 &nbsp; <b>ESC</b> メニュー',
    credit: 'AIだけで作られたインディーゲーム · 2026年7月 · ',
    expSave: '💾 セーブを書き出す', impSave: '📂 セーブを読み込む',
    impConfirm: 'このセーブファイルで現在の記録を上書きしますか？',
    impErr: '正しいMeNewカートのセーブファイルではありません', expDone: 'セーブファイルをダウンロードしました',
    recNote: 'ランキングはこのブラウザに保存されます。別のパソコンへはセーブの書き出しで移行できます。',
    resTitle: '🏁 レース結果', myBest: '自己ベスト', running: '走行中…',
    colRank: '順位', colName: '名前', colChar: 'レーサー', colTime: 'タイム', colDate: '日付',
    emptyRec: 'まだ記録がありません — レースを完走しよう！', quitConfirm: 'レースをやめてメニューに戻りますか？',
    go: 'GO!', finish: 'FINISH!', lap: 'LAP', newRecord: '🎉 自己ベスト更新！'
  },
  es: {
    sub: 'GRAN PREMIO', start: '🏁 Empezar carrera', records: '🏆 Récords', back: '← Atrás',
    retry: '🔄 Otra carrera', menu: 'Menú', selectTitle: 'Elige tu corredor', nickPh: 'Apodo',
    help: '<b>↑/W</b> Acelerar &nbsp; <b>↓/S</b> Frenar &nbsp; <b>←→/A D</b> Girar<br><b>Space</b> Derrape (mantén → turbo) &nbsp; <b>Shift</b> Usar objeto &nbsp; <b>ESC</b> Menú',
    credit: 'Un juego indie creado 100% con IA · Julio de 2026 · ',
    expSave: '💾 Exportar partida', impSave: '📂 Importar partida',
    impConfirm: '¿Sobrescribir tus récords actuales con esta partida?',
    impErr: 'No es un archivo de guardado válido de MeNew Kart', expDone: 'Partida descargada',
    recNote: 'Los récords se guardan en este navegador. Exporta tu partida para llevarlos a otro ordenador.',
    resTitle: '🏁 Resultados', myBest: 'Mejor marca personal', running: 'corriendo…',
    colRank: '#', colName: 'NOMBRE', colChar: 'CORREDOR', colTime: 'TIEMPO', colDate: 'FECHA',
    emptyRec: 'Aún no hay récords — ¡termina una carrera!', quitConfirm: '¿Abandonar la carrera y volver al menú?',
    go: '¡YA!', finish: '¡META!', lap: 'VUELTA', newRecord: '🎉 ¡Nueva mejor marca!'
  },
  zh: {
    sub: '大奖赛', start: '🏁 开始比赛', records: '🏆 记录室', back: '← 返回',
    retry: '🔄 再来一局', menu: '菜单', selectTitle: '选择角色', nickPh: '昵称',
    help: '<b>↑/W</b> 加速 &nbsp; <b>↓/S</b> 刹车 &nbsp; <b>←→/A D</b> 转向<br><b>Space</b> 漂移 (长按 → 加速) &nbsp; <b>Shift</b> 使用道具 &nbsp; <b>ESC</b> 菜单',
    credit: '100% 由 AI 制作的独立游戏 · 2026年7月 · ',
    expSave: '💾 导出存档', impSave: '📂 导入存档',
    impConfirm: '用该存档覆盖当前记录？',
    impErr: '不是有效的 MeNew Kart 存档文件', expDone: '存档已下载',
    recNote: '排行榜保存在此浏览器中。导出存档即可迁移到其他电脑。',
    resTitle: '🏁 比赛结果', myBest: '个人最佳', running: '比赛中…',
    colRank: '#', colName: '昵称', colChar: '角色', colTime: '成绩', colDate: '日期',
    emptyRec: '还没有记录——先完成一场比赛吧！', quitConfirm: '退出比赛并返回菜单？',
    go: 'GO!', finish: '完赛!', lap: '圈', newRecord: '🎉 刷新个人最佳！'
  }
};
let LANG = new URLSearchParams(location.search).get('lang');
if (!I18N[LANG]) LANG = (navigator.language || 'en').slice(0, 2);
if (!I18N[LANG]) LANG = 'en';
const L = I18N[LANG];

/* ===== 캐릭터 (f=여성 캐릭터: 헤어+리본) ===== */
const CHARS = [
  { id: 'Uja',    f: 1, body: 0xff7fa8, skin: 0xf2c9a5, hair: 0x5a3a22, sp: 33.0, ac: 13.0, hd: 2.00 },
  { id: 'Uni',    f: 1, body: 0x66d9c5, skin: 0xf7d3b0, hair: 0xf2d16b, sp: 32.0, ac: 13.0, hd: 2.20 },
  { id: 'MeNew',  f: 0, body: 0x8a1f2d, skin: 0xe8b48c, hair: 0xd4a72c, sp: 35.0, ac: 10.5, hd: 1.70 },
  { id: 'jjojjo', f: 1, body: 0xb98fe8, skin: 0xf2c9a5, hair: 0x2a2a2a, sp: 31.5, ac: 15.0, hd: 2.10 },
  { id: 'ND',     f: 0, body: 0xf7d63e, skin: 0xffffff, hair: 0xf29e38, sp: 32.0, ac: 13.5, hd: 1.90 },
  { id: 'JB',     f: 0, body: 0x2c4f8a, skin: 0xa8d492, hair: 0x1d3a1d, sp: 33.0, ac: 12.0, hd: 1.80 },
  { id: 'JW',     f: 0, body: 0x8a8a8a, skin: 0xbdbdbd, hair: 0x555555, sp: 34.5, ac: 10.0, hd: 1.60 },
  { id: 'IW',     f: 0, body: 0x6fd44f, skin: 0x8fe06f, hair: 0x3c8a30, sp: 31.0, ac: 16.0, hd: 2.00 },
  { id: 'DS',     f: 0, body: 0x3c8a30, skin: 0x7fc46f, hair: 0x111111, sp: 32.5, ac: 12.5, hd: 1.90 },
  { id: 'GS',     f: 0, body: 0xf28c28, skin: 0xe8b48c, hair: 0x333333, sp: 33.5, ac: 12.0, hd: 1.85 },
  { id: 'KJ',     f: 0, body: 0x2a2a36, skin: 0x9a86b8, hair: 0x8b4fd4, sp: 32.0, ac: 13.0, hd: 2.20 }
];

/* ===== 저장 ===== */
let save = { game: 'menewkart', version: 1, nick: '', records: [] };
try {
  const s0 = JSON.parse(localStorage.getItem('mkart_save') || 'null');
  if (s0 && s0.game === 'menewkart') save = s0;
} catch (e) {}
function persist() { try { localStorage.setItem('mkart_save', JSON.stringify(save)); } catch (e) {} }
function remoteSubmit(entry) {
  if (!REMOTE_API) return;
  try {
    fetch(REMOTE_API + '/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry)
    }).catch(function () {});
  } catch (e) {}
}

/* ===== THREE 셋업 ===== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc9ef);
scene.fog = new THREE.Fog(0x8fc9ef, 90, 260);
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0xffffff, 0.62));
const sun = new THREE.DirectionalLight(0xffffff, 0.75);
sun.position.set(80, 140, 60);
scene.add(sun);
addEventListener('resize', function () {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ===== 트랙 ===== */
const ROAD_W = 10, N = 700, LAPS = 3;
const CTRL = [
  [-55, 0, 0], [10, 0, 4], [60, 0, 0], [95, 3, -30], [100, 7, -75], [75, 11, -110],
  [35, 12, -130], [-5, 10, -118], [-30, 8, -140], [-65, 6, -125], [-80, 3, -80],
  [-70, 1, -40], [-45, 0, -12]
];
const curve = new THREE.CatmullRomCurve3(
  CTRL.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }), true, 'catmullrom', 0.55);
const S = []; // {p, t(수평 단위 접선), left, bankS(측면 기울기), head}
for (let i = 0; i < N; i++) {
  const p = curve.getPointAt(i / N);
  const t = curve.getTangentAt(i / N);
  const tl = Math.hypot(t.x, t.z) || 1;
  const tx = t.x / tl, tz = t.z / tl;
  S.push({ p: p, tx: tx, tz: tz, lx: tz, lz: -tx, bankS: 0, head: Math.atan2(tx, tz) });
}
const trackLen = curve.getLength();
const SEG = trackLen / N; // 샘플 간 거리(m)
function wrapA(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
// 곡률 → 뱅킹 (커브 안쪽이 낮게)
for (let i = 0; i < N; i++) {
  const dh = wrapA(S[(i + 6) % N].head - S[(i - 6 + N) % N].head);
  S[i].bankRaw = Math.max(-0.16, Math.min(0.16, dh * 0.55));
}
for (let i = 0; i < N; i++) { // 스무딩
  let b = 0;
  for (let j = -8; j <= 8; j++) b += S[(i + j + N) % N].bankRaw;
  S[i].bankS = b / 17;
}
function sampleAt(i) { return S[((i % N) + N) % N]; }
// 지면 높이/샘플 탐색 (hint 주변 검색)
function nearestIdx(x, z, hint) {
  let best = hint, bd = 1e18;
  for (let j = -22; j <= 22; j++) {
    const i = ((hint + j) % N + N) % N;
    const dx = x - S[i].p.x, dz = z - S[i].p.z;
    const d = dx * dx + dz * dz;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
function groundAt(x, z, hint) {
  const i = nearestIdx(x, z, hint);
  const s = S[i];
  const lat = (x - s.p.x) * s.lx + (z - s.p.z) * s.lz;
  return { y: s.p.y + s.bankS * lat, idx: i, lat: lat, s: s };
}

/* 도로 메쉬 */
(function buildRoad() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const v = 52 + Math.random() * 14;
    g.fillStyle = 'rgb(' + (v | 0) + ',' + (v | 0) + ',' + (v + 4 | 0) + ')';
    g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, 3, 64); g.fillRect(61, 0, 3, 64);   // 가장자리 흰선
  g.fillStyle = '#ffd23e'; g.fillRect(31, 0, 2, 40);                            // 중앙 점선
  const tex = new THREE.CanvasTexture(c);
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  const pos = [], uv = [], ind = [];
  for (let i = 0; i <= N; i++) {
    const s = sampleAt(i);
    const hw = ROAD_W / 2;
    pos.push(s.p.x + s.lx * hw, s.p.y + s.bankS * hw + 0.02, s.p.z + s.lz * hw);
    pos.push(s.p.x - s.lx * hw, s.p.y - s.bankS * hw + 0.02, s.p.z - s.lz * hw);
    uv.push(0, i * 0.35, 1, i * 0.35);
    if (i < N) {
      const a = i * 2;
      ind.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(ind);
  geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex })));
})();

/* 잔디 지형 (트랙 높이를 따라가는 스커트) */
(function buildGround() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const v = Math.random() * 18;
    g.fillStyle = 'rgb(' + (86 + v | 0) + ',' + (158 + v | 0) + ',' + (66 + v | 0) + ')';
    g.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  const G = 72, X0 = -150, X1 = 170, Z0 = -210, Z1 = 70;
  const geo = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, G, G);
  geo.rotateX(-Math.PI / 2);
  const pp = geo.attributes.position;
  for (let vi = 0; vi < pp.count; vi++) {
    const x = pp.getX(vi) + (X0 + X1) / 2, z = pp.getZ(vi) + (Z0 + Z1) / 2;
    let bd = 1e18, bi = 0;
    for (let i = 0; i < N; i += 4) {
      const dx = x - S[i].p.x, dz = z - S[i].p.z;
      const d = dx * dx + dz * dz;
      if (d < bd) { bd = d; bi = i; }
    }
    const dist = Math.sqrt(bd);
    const k = Math.max(0, Math.min(1, 1 - (dist - ROAD_W * 0.5) / 34));
    pp.setY(vi, S[bi].p.y * k - 0.12);
    pp.setX(vi, pp.getX(vi) + (X0 + X1) / 2);
    pp.setZ(vi, pp.getZ(vi) + (Z0 + Z1) / 2);
  }
  geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex })));
})();

/* 장식: 나무 + 출발 게이트 */
(function decorate() {
  const trunkM = new THREE.MeshLambertMaterial({ color: 0x6b4a2c });
  const leafM = new THREE.MeshLambertMaterial({ color: 0x2f7d2f });
  for (let k = 0; k < 60; k++) {
    const i = (Math.random() * N) | 0;
    const s = S[i];
    const side = Math.random() < 0.5 ? 1 : -1;
    const lat = side * (ROAD_W / 2 + 8 + Math.random() * 22);
    const x = s.p.x + s.lx * lat, z = s.p.z + s.lz * lat;
    const y = groundAt(x, z, i).y;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 2.4, 6), trunkM);
    tr.position.set(x, Math.max(y, -0.1) + 1.2, z);
    const lf = new THREE.Mesh(new THREE.ConeGeometry(1.9, 3.6, 7), leafM);
    lf.position.set(x, Math.max(y, -0.1) + 4.1, z);
    scene.add(tr); scene.add(lf);
  }
  // 출발 게이트
  const s0 = S[0];
  const pillarM = new THREE.MeshLambertMaterial({ color: 0xdddddd });
  [-1, 1].forEach(function (sd) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.4, 0.7), pillarM);
    p.position.set(s0.p.x + s0.lx * sd * (ROAD_W / 2 + 0.6), s0.p.y + 3.2, s0.p.z + s0.lz * sd * (ROAD_W / 2 + 0.6));
    scene.add(p);
  });
  const bc = document.createElement('canvas');
  bc.width = 256; bc.height = 40;
  const bg = bc.getContext('2d');
  bg.fillStyle = '#c92a4e'; bg.fillRect(0, 0, 256, 40);
  bg.fillStyle = '#fff'; bg.font = 'bold 26px Menlo, monospace';
  bg.textAlign = 'center'; bg.textBaseline = 'middle';
  bg.fillText('MENEW KART', 128, 21);
  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(ROAD_W + 2.6, 1.15, 0.25),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(bc) })
  );
  banner.position.set(s0.p.x, s0.p.y + 6.0, s0.p.z);
  banner.rotation.y = Math.atan2(s0.lx, s0.lz) + Math.PI / 2;
  scene.add(banner);
  // 체커 라인
  const cc = document.createElement('canvas');
  cc.width = 64; cc.height = 16;
  const cg = cc.getContext('2d');
  for (let y = 0; y < 2; y++) for (let x = 0; x < 8; x++) {
    cg.fillStyle = (x + y) % 2 ? '#fff' : '#222';
    cg.fillRect(x * 8, y * 8, 8, 8);
  }
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD_W, 2.4),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(cc) })
  );
  line.rotation.x = -Math.PI / 2;
  line.rotation.z = -Math.atan2(s0.lx, s0.lz) + Math.PI / 2;
  line.position.set(s0.p.x, s0.p.y + 0.06, s0.p.z);
  scene.add(line);
})();

/* 부스트 패드 & 아이템 박스 */
const PADS = [150, 420, 620];
PADS.forEach(function (si) {
  const s = sampleAt(si);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 5.4),
    new THREE.MeshBasicMaterial({ color: 0x35c8ff, transparent: true, opacity: 0.82 })
  );
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = -Math.atan2(s.lx, s.lz) + Math.PI / 2;
  m.position.set(s.p.x, s.p.y + 0.07, s.p.z);
  scene.add(m);
});
const itemBoxes = [];
[80, 320, 560].forEach(function (si) {
  [-3, 0, 3].forEach(function (lat) {
    const s = sampleAt(si);
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 1.05, 1.05),
      new THREE.MeshLambertMaterial({ color: 0x66c8ff, transparent: true, opacity: 0.8 })
    );
    m.position.set(s.p.x + s.lx * lat, s.p.y + s.bankS * lat + 1.0, s.p.z + s.lz * lat);
    scene.add(m);
    itemBoxes.push({ si: si, lat: lat, mesh: m, t: 0, y: m.position.y });
  });
});

/* ===== 카트 모델 ===== */
function buildKartMesh(ch) {
  const g = new THREE.Group();
  function box(w, h, d, color, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: color }));
    m.position.set(x, y, z);
    (parent || g).add(m);
    return m;
  }
  const body = new THREE.Group(); g.add(body);
  box(1.5, 0.42, 2.5, ch.body, 0, 0.5, 0, body);                       // 차체
  box(1.1, 0.24, 0.9, 0x222222, 0, 0.76, 0.6, body);                   // 후드
  box(1.5, 0.34, 0.34, ch.body, 0, 0.72, -1.25, body);                 // 스포일러
  box(0.34, 0.3, 0.34, 0x333333, -0.5, 0.62, -1.05, body);
  box(0.34, 0.3, 0.34, 0x333333, 0.5, 0.62, -1.05, body);
  // 드라이버
  box(0.62, 0.62, 0.44, ch.body, 0, 1.06, -0.34, body);                // 몸통
  const head = box(0.5, 0.5, 0.5, ch.skin, 0, 1.62, -0.34, body);      // 머리
  box(0.1, 0.08, 0.05, 0x111111, -0.12, 1.66, -0.08, body);            // 눈
  box(0.1, 0.08, 0.05, 0x111111, 0.12, 1.66, -0.08, body);
  if (ch.id === 'ND') {
    box(0.24, 0.12, 0.3, 0xf29e38, 0, 1.55, -0.04, body);              // 오리 부리
  } else if (ch.id === 'MeNew') {
    box(0.56, 0.16, 0.56, 0xd4a72c, 0, 1.94, -0.34, body);             // 왕관
  } else if (ch.f) {
    box(0.54, 0.5, 0.2, ch.hair, 0, 1.66, -0.62, body);                // 뒷머리(장발)
    box(0.54, 0.18, 0.54, ch.hair, 0, 1.9, -0.34, body);               // 앞머리
    box(0.2, 0.12, 0.12, 0xff4f8a, 0.24, 1.9, -0.5, body);             // 리본
  } else {
    box(0.54, 0.16, 0.54, ch.hair, 0, 1.9, -0.34, body);               // 캡/머리
    box(0.54, 0.1, 0.2, ch.hair, 0, 1.84, -0.02, body);                // 챙
  }
  // 바퀴 (앞바퀴는 조향 피봇)
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.3, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1c1c1c });
  const wheels = [], frontPivots = [];
  [[-0.82, 0.95], [0.82, 0.95], [-0.82, -0.95], [0.82, -0.95]].forEach(function (wp, i) {
    const piv = new THREE.Group();
    piv.position.set(wp[0], 0.34, wp[1]);
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    piv.add(w);
    g.add(piv);
    wheels.push(w);
    if (i < 2) frontPivots.push(piv);
  });
  return { group: g, body: body, wheels: wheels, front: frontPivots, headMesh: head };
}

/* ===== 레이스 상태 ===== */
let state = 'menu'; // menu | select | records | countdown | race | finish
let karts = [], player = null;
let raceT = 0, cdT = 0, finishOrder = [];
const keys = {};
const bananas = [], shells = [];
const ITEMS = ['mush', 'banana', 'shell'];
const ITEM_ICON = { mush: '🍄', banana: '🍌', shell: '🐢' };

function makeKart(ch, isCPU, gridIdx) {
  const mesh = buildKartMesh(ch);
  scene.add(mesh.group);
  const si = ((N - 10 - gridIdx * 6) % N + N) % N;
  const lat = (gridIdx % 2 ? 2.3 : -2.3);
  const s = S[si];
  const k = {
    ch: ch, cpu: isCPU, mesh: mesh,
    pos: new THREE.Vector3(s.p.x + s.lx * lat, s.p.y, s.p.z + s.lz * lat),
    head: s.head, speed: 0, si: si, prevSi: si, lat: lat, lap: 1, half: false,
    boost: 0, drift: 0, drifting: false, spin: 0, item: null, itemCd: 2 + Math.random() * 3,
    finished: false, time: 0, offroad: false, wheelSpin: 0,
    lane: (Math.random() - 0.5) * 4.4, cpuSpd: 0.88 + Math.random() * 0.09
  };
  k.mesh.group.position.copy(k.pos);
  k.mesh.group.rotation.y = k.head;
  return k;
}

function startRace(charIdx) {
  // 기존 정리
  karts.forEach(function (k) { scene.remove(k.mesh.group); });
  bananas.forEach(function (b) { scene.remove(b.mesh); });
  shells.forEach(function (sh) { scene.remove(sh.mesh); });
  karts = []; bananas.length = 0; shells.length = 0; finishOrder = [];
  const order = [];
  for (let i = 0; i < CHARS.length; i++) if (i !== charIdx) order.push(i);
  for (let i = 0; i < order.length; i++) karts.push(makeKart(CHARS[order[i]], true, i));
  player = makeKart(CHARS[charIdx], false, CHARS.length - 1);
  karts.push(player);
  raceT = 0; cdT = 3.6;
  state = 'countdown';
  showScreen(null);
  document.body.classList.add('racing');
  startEngine();
  updateCamera(1);
}

/* ===== 물리/AI ===== */
function kartInput(k) {
  if (!k.cpu) {
    return {
      up: keys.ArrowUp || keys.KeyW, down: keys.ArrowDown || keys.KeyS,
      st: (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0),
      drift: keys.Space
    };
  }
  // CPU: 앞 샘플 추적
  const tgt = sampleAt(k.si + 16);
  const tx = tgt.p.x + tgt.lx * k.lane, tz = tgt.p.z + tgt.lz * k.lane;
  const want = Math.atan2(tx - k.pos.x, tz - k.pos.z);
  const dh = wrapA(want - k.head);
  return { up: true, down: Math.abs(dh) > 1.15 && k.speed > k.ch.sp * 0.55, st: Math.max(-1, Math.min(1, dh * 2.4)), drift: false };
}

function updateKart(k, dt) {
  const inp = kartInput(k);
  const maxBase = k.ch.sp * (k.cpu ? k.cpuSpd : 1);
  // CPU 러버밴딩
  let rubber = 1;
  if (k.cpu && player) {
    const gap = (k.lap * N + k.si) - (player.lap * N + player.si);
    rubber = gap < -120 ? 1.07 : (gap > 120 ? 0.93 : 1);
  }
  let vmax = maxBase * rubber * (k.boost > 0 ? 1.34 : 1) * (k.offroad ? 0.5 : 1);

  if (k.spin > 0) {
    k.spin -= dt;
    k.speed *= Math.max(0, 1 - 2.6 * dt);
  } else if (!k.finished || k.cpu) {
    if (inp.up) k.speed += k.ch.ac * dt * Math.max(0.15, 1 - k.speed / Math.max(vmax, 1));
    else k.speed *= Math.max(0, 1 - 0.55 * dt);
    if (inp.down) k.speed -= 26 * dt;
    if (k.speed < -7) k.speed = -7;
    if (k.speed > vmax) k.speed = Math.max(vmax, k.speed - 18 * dt);
    // 조향 (속도 비례)
    k.drifting = !!(inp.drift && Math.abs(inp.st) > 0.15 && k.speed > 13);
    const hd = k.ch.hd * (k.drifting ? 1.55 : 1);
    if (k.drifting) k.drift += dt; else if (k.drift > 0) {
      if (k.drift > 1.5) { k.boost = Math.max(k.boost, 1.15); boostFx(k); }
      else if (k.drift > 0.7) { k.boost = Math.max(k.boost, 0.65); boostFx(k); }
      k.drift = 0;
    }
    const spdF = Math.min(1, Math.abs(k.speed) / 7) * (1.45 - 0.75 * Math.min(1, Math.abs(k.speed) / maxBase));
    k.head += inp.st * hd * spdF * dt * (k.speed >= 0 ? 1 : -1);
  } else {
    k.speed *= Math.max(0, 1 - 1.2 * dt); // 완주한 플레이어는 감속
  }
  if (k.boost > 0) { k.boost -= dt; k.speed = Math.max(k.speed, vmax); }

  // 이동 + 지면 스냅
  k.pos.x += Math.sin(k.head) * k.speed * dt;
  k.pos.z += Math.cos(k.head) * k.speed * dt;
  const g = groundAt(k.pos.x, k.pos.z, k.si);
  k.pos.y = g.y;
  k.lat = g.lat;
  k.offroad = Math.abs(g.lat) > ROAD_W / 2 + 0.4;
  const LIM = ROAD_W / 2 + 13;
  if (Math.abs(g.lat) > LIM) { // 소프트 월
    const over = Math.abs(g.lat) - LIM;
    const sgn = g.lat > 0 ? 1 : -1;
    k.pos.x -= g.s.lx * sgn * over;
    k.pos.z -= g.s.lz * sgn * over;
    k.speed *= 0.94;
  }
  // 랩/진행
  k.prevSi = k.si;
  k.si = g.idx;
  if (k.si > N * 0.45 && k.si < N * 0.6) k.half = true;
  if (k.half && k.prevSi > N - 70 && k.si < 70) {
    k.half = false;
    k.lap++;
    if (k.lap > LAPS && !k.finished) {
      k.finished = true;
      k.time = raceT;
      finishOrder.push(k);
      if (!k.cpu) onPlayerFinish();
    }
    if (!k.cpu && k.lap <= LAPS) sound('lap');
  }
  // 부스트 패드
  for (let i = 0; i < PADS.length; i++) {
    const d = ((k.si - PADS[i]) % N + N) % N;
    if (d < 6 && Math.abs(k.lat) < 2.6 && k.boost < 0.85) { k.boost = 0.9; boostFx(k); sound('boost'); }
  }
  // 아이템 박스
  for (let i = 0; i < itemBoxes.length; i++) {
    const b = itemBoxes[i];
    if (b.t > 0) continue;
    const dx = k.pos.x - b.mesh.position.x, dz = k.pos.z - b.mesh.position.z;
    if (dx * dx + dz * dz < 2.2 && !k.item) {
      b.t = 3;
      k.item = ITEMS[(Math.random() * ITEMS.length) | 0];
      if (!k.cpu) { sound('pick'); updItemHUD(); }
    }
  }
  // CPU 아이템 사용
  if (k.cpu && k.item) {
    k.itemCd -= dt;
    if (k.itemCd <= 0) { useItem(k); k.itemCd = 3 + Math.random() * 4; }
  }
  // 시각 업데이트
  const m = k.mesh;
  m.group.position.copy(k.pos);
  const spinRot = k.spin > 0 ? (1.2 - k.spin) * 10.5 : 0;
  m.group.rotation.y = k.head + spinRot;
  // 경사 정렬 (피치/롤)
  const f2 = { x: Math.sin(k.head), z: Math.cos(k.head) };
  const yF = groundAt(k.pos.x + f2.x * 1.3, k.pos.z + f2.z * 1.3, k.si).y;
  const yB = groundAt(k.pos.x - f2.x * 1.3, k.pos.z - f2.z * 1.3, k.si).y;
  const yL = groundAt(k.pos.x + g.s.lx * 0.9, k.pos.z + g.s.lz * 0.9, k.si).y;
  const yR = groundAt(k.pos.x - g.s.lx * 0.9, k.pos.z - g.s.lz * 0.9, k.si).y;
  m.group.rotation.x = Math.atan2(yB - yF, 2.6);
  const latHeadF = Math.sin(k.head) * g.s.lx + Math.cos(k.head) * g.s.lz; // 진행방향 대비 좌우 정렬
  m.group.rotation.z = Math.atan2(yL - yR, 1.8) * (latHeadF >= 0 ? -1 : 1) * -1;
  // 드리프트 기울임 + 바퀴
  m.body.rotation.z = k.drifting ? (inp.st * -0.16) : 0;
  k.wheelSpin += k.speed / 0.34 * dt;
  for (let i = 0; i < 4; i++) m.wheels[i].rotation.x = k.wheelSpin;
  m.front[0].rotation.y = m.front[1].rotation.y = inp.st * 0.42;
}

function boostFx(k) {
  if (!k.cpu) {
    const el = document.getElementById('hudBoost');
    el.style.opacity = '1';
    setTimeout(function () { el.style.opacity = '0'; }, 500);
  }
}

/* 카트끼리 충돌 */
function kartCollisions() {
  for (let i = 0; i < karts.length; i++) for (let j = i + 1; j < karts.length; j++) {
    const a = karts[i], b = karts[j];
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < 2.9 && d2 > 1e-6) {
      const d = Math.sqrt(d2), push = (1.7 - d) * 0.5;
      const ux = dx / d, uz = dz / d;
      a.pos.x -= ux * push; a.pos.z -= uz * push;
      b.pos.x += ux * push; b.pos.z += uz * push;
    }
  }
}

/* ===== 아이템 ===== */
function useItem(k) {
  if (!k.item || k.spin > 0) return;
  const it = k.item;
  k.item = null;
  if (!k.cpu) updItemHUD();
  if (it === 'mush') { k.boost = Math.max(k.boost, 1.25); boostFx(k); sound('boost'); }
  else if (it === 'banana') {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xffd23e }));
    m.scale.y = 0.7;
    const bx = k.pos.x - Math.sin(k.head) * 2.4, bz = k.pos.z - Math.cos(k.head) * 2.4;
    m.position.set(bx, groundAt(bx, bz, k.si).y + 0.3, bz);
    scene.add(m);
    bananas.push({ mesh: m, owner: k, age: 0 });
    sound('drop');
  } else if (it === 'shell') {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0x2f9d3a }));
    m.position.copy(k.pos); m.position.y += 0.5;
    scene.add(m);
    shells.push({ mesh: m, si: k.si + 6, lat: k.lat, owner: k, life: 6, age: 0 });
    sound('shoot');
  }
}
function updateHazards(dt) {
  for (let i = bananas.length - 1; i >= 0; i--) {
    const b = bananas[i];
    b.age += dt;
    let hit = false;
    for (let j = 0; j < karts.length; j++) {
      const k = karts[j];
      if (k === b.owner && b.age < 1) continue;
      const dx = k.pos.x - b.mesh.position.x, dz = k.pos.z - b.mesh.position.z;
      if (dx * dx + dz * dz < 1.4 && k.spin <= 0) { spinOut(k); hit = true; break; }
    }
    if (hit || b.age > 40) { scene.remove(b.mesh); bananas.splice(i, 1); }
  }
  for (let i = shells.length - 1; i >= 0; i--) {
    const sh = shells[i];
    sh.age += dt; sh.life -= dt;
    sh.si += (34 / SEG) * dt;
    const s = sampleAt(Math.floor(sh.si));
    sh.lat *= Math.max(0, 1 - 1.5 * dt); // 중앙으로 수렴
    sh.mesh.position.set(s.p.x + s.lx * sh.lat, s.p.y + s.bankS * sh.lat + 0.5, s.p.z + s.lz * sh.lat);
    let done = sh.life <= 0;
    for (let j = 0; j < karts.length && !done; j++) {
      const k = karts[j];
      if (k === sh.owner && sh.age < 0.6) continue;
      const dx = k.pos.x - sh.mesh.position.x, dz = k.pos.z - sh.mesh.position.z;
      if (dx * dx + dz * dz < 1.9 && k.spin <= 0) { spinOut(k); done = true; }
    }
    if (done) { scene.remove(sh.mesh); shells.splice(i, 1); }
  }
  for (let i = 0; i < itemBoxes.length; i++) {
    const b = itemBoxes[i];
    if (b.t > 0) { b.t -= dt; b.mesh.visible = b.t <= 0; }
    b.mesh.rotation.y += dt * 2;
    b.mesh.rotation.x += dt * 1.3;
    b.mesh.position.y = b.y + Math.sin(perfNow() * 0.002 + i) * 0.12;
  }
}
function spinOut(k) {
  k.spin = 1.2;
  k.drift = 0; k.drifting = false;
  if (!k.cpu) sound('hit2'); else sound('hit');
}

/* ===== 순위 ===== */
function rankOf(k) {
  const my = k.lap * N + k.si;
  let r = 1;
  for (let i = 0; i < karts.length; i++) {
    const o = karts[i];
    if (o === k) continue;
    if (o.finished && k.finished) { if (o.time < k.time) r++; continue; }
    if (o.finished && !k.finished) { r++; continue; }
    if (!o.finished && k.finished) continue;
    if (o.lap * N + o.si > my) r++;
  }
  return r;
}

/* ===== 완주/기록 ===== */
function fmtT(ms) {
  const m = Math.floor(ms / 60000), s2 = Math.floor(ms % 60000 / 1000), c = Math.floor(ms % 1000 / 10);
  return m + ':' + String(s2).padStart(2, '0') + '.' + String(c).padStart(2, '0');
}
function onPlayerFinish() {
  state = 'finish';
  showMsg(L.finish, 2.4);
  sound('fanfare');
  const tMs = Math.round(raceT * 1000);
  const entry = { n: save.nick, c: player.ch.id, t: tMs, d: new Date().toISOString().slice(0, 10) };
  const prevBest = personalBest();
  save.records.push(entry);
  save.records.sort(function (a, b) { return a.t - b.t; });
  save.records = save.records.slice(0, 30);
  persist();
  remoteSubmit(entry);
  const isNewBest = !prevBest || tMs < prevBest;
  setTimeout(function () { showResults(isNewBest); }, 2600);
}
function personalBest() {
  let b = null;
  for (let i = 0; i < save.records.length; i++) {
    if (save.records[i].n === save.nick && (b === null || save.records[i].t < b)) b = save.records[i].t;
  }
  return b;
}
function showResults(newBest) {
  const rows = karts.slice().sort(function (a, b) {
    if (a.finished && b.finished) return a.time - b.time;
    if (a.finished !== b.finished) return a.finished ? -1 : 1;
    return (b.lap * N + b.si) - (a.lap * N + a.si);
  });
  let h = '<table><tr><th>' + L.colRank + '</th><th>' + L.colName + '</th><th>' + L.colTime + '</th></tr>';
  for (let i = 0; i < rows.length; i++) {
    const k = rows[i];
    const nm = k.cpu ? k.ch.id : (save.nick + ' (' + k.ch.id + ')');
    h += '<tr' + (k.cpu ? '' : ' class="me"') + '><td>' + (i + 1) + '</td><td>' + nm + '</td><td>' +
      (k.finished ? fmtT(Math.round(k.time * 1000)) : L.running) + '</td></tr>';
  }
  h += '</table>';
  if (newBest) h += '<p style="color:#ffe957;margin-top:10px;font-weight:bold">' + L.newRecord + '</p>';
  document.getElementById('resPanel').innerHTML = h;
  showScreen('results');
}
function showRecords() {
  let h;
  if (!save.records.length) h = '<p style="color:#ccc">' + L.emptyRec + '</p>';
  else {
    h = '<table><tr><th>' + L.colRank + '</th><th>' + L.colName + '</th><th>' + L.colChar +
      '</th><th>' + L.colTime + '</th><th>' + L.colDate + '</th></tr>';
    for (let i = 0; i < Math.min(save.records.length, 10); i++) {
      const r = save.records[i];
      h += '<tr' + (r.n === save.nick ? ' class="me"' : '') + '><td>' + (i + 1) + '</td><td>' + esc(r.n) +
        '</td><td>' + r.c + '</td><td>' + fmtT(r.t) + '</td><td>' + r.d + '</td></tr>';
    }
    h += '</table>';
    const pb = personalBest();
    if (pb) h += '<p style="color:#ffe957;margin-top:10px">' + L.myBest + ': ' + fmtT(pb) + '</p>';
  }
  document.getElementById('recPanel').innerHTML = h;
  showScreen('records');
}
function esc(s2) { return String(s2).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

/* ===== HUD ===== */
const mmCanvas = document.getElementById('minimap');
const mmCtx = mmCanvas.getContext('2d');
let mmPts = null;
(function initMinimap() {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < N; i++) {
    x0 = Math.min(x0, S[i].p.x); x1 = Math.max(x1, S[i].p.x);
    z0 = Math.min(z0, S[i].p.z); z1 = Math.max(z1, S[i].p.z);
  }
  const sc = 128 / Math.max(x1 - x0, z1 - z0);
  mmPts = { x0: x0, z0: z0, sc: sc, ox: (150 - (x1 - x0) * sc) / 2, oz: (150 - (z1 - z0) * sc) / 2 };
})();
function mmXY(x, z) { return [mmPts.ox + (x - mmPts.x0) * mmPts.sc, mmPts.oz + (z - mmPts.z0) * mmPts.sc]; }
function drawMinimap() {
  mmCtx.clearRect(0, 0, 150, 150);
  mmCtx.strokeStyle = 'rgba(255,255,255,.85)';
  mmCtx.lineWidth = 4;
  mmCtx.beginPath();
  for (let i = 0; i <= N; i += 6) {
    const p = mmXY(sampleAt(i).p.x, sampleAt(i).p.z);
    if (i === 0) mmCtx.moveTo(p[0], p[1]); else mmCtx.lineTo(p[0], p[1]);
  }
  mmCtx.closePath(); mmCtx.stroke();
  for (let i = 0; i < karts.length; i++) {
    const k = karts[i];
    const p = mmXY(k.pos.x, k.pos.z);
    mmCtx.fillStyle = k.cpu ? '#' + k.ch.body.toString(16).padStart(6, '0') : '#ffe957';
    mmCtx.beginPath();
    mmCtx.arc(p[0], p[1], k.cpu ? 3.4 : 5, 0, 6.3);
    mmCtx.fill();
    if (!k.cpu) { mmCtx.strokeStyle = '#000'; mmCtx.lineWidth = 1.6; mmCtx.stroke(); }
  }
}
function updItemHUD() {
  document.getElementById('hudItem').textContent = player && player.item ? ITEM_ICON[player.item] : '';
}
let msgT = 0;
function showMsg(t, dur) {
  const el = document.getElementById('hudMsg');
  el.textContent = t;
  el.style.opacity = '1';
  msgT = dur || 1;
}
function updateHUD(dt) {
  if (msgT > 0) { msgT -= dt; if (msgT <= 0) document.getElementById('hudMsg').style.opacity = '0'; }
  if (!player) return;
  document.getElementById('hudLap').textContent = L.lap + ' ' + Math.min(player.lap, LAPS) + '/' + LAPS;
  document.getElementById('hudTime').textContent = fmtT(Math.round(raceT * 1000));
  const r = rankOf(player);
  document.getElementById('hudPos').innerHTML = r + '<small>/' + karts.length + '</small>';
  document.getElementById('hudSpeed').innerHTML = Math.round(Math.abs(player.speed) * 3.4) + '<small> km/h</small>';
  drawMinimap();
}

/* ===== 카메라 ===== */
const camTgt = new THREE.Vector3(), camPos = new THREE.Vector3();
function updateCamera(snap) {
  if (!player) return;
  const fx = Math.sin(player.head), fz = Math.cos(player.head);
  camPos.set(player.pos.x - fx * 7.6, player.pos.y + 3.6, player.pos.z - fz * 7.6);
  camTgt.set(player.pos.x + fx * 3, player.pos.y + 1.4, player.pos.z + fz * 3);
  if (snap) { camera.position.copy(camPos); }
  else {
    camera.position.lerp(camPos, 0.12);
    const gy = groundAt(camera.position.x, camera.position.z, player.si).y + 1.1;
    if (camera.position.y < gy) camera.position.y = gy;
  }
  camera.lookAt(camTgt);
}

/* ===== 사운드 ===== */
let actx = null, engOsc = null, engGain = null;
function AC() {
  actx = actx || new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function sound(kind) {
  try {
    const a = AC(), t = a.currentTime;
    function osc(type, f0, f1, dur, vol, delay) {
      const o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      const t0 = t + (delay || 0);
      o.type = type;
      o.frequency.setValueAtTime(f0, t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur + 0.02);
      o.start(t0); o.stop(t0 + dur + 0.05);
    }
    if (kind === 'beep') osc('square', 440, 440, 0.12, 0.09);
    else if (kind === 'go') osc('square', 880, 880, 0.3, 0.11);
    else if (kind === 'boost') osc('sawtooth', 200, 900, 0.35, 0.08);
    else if (kind === 'pick') osc('sine', 660, 990, 0.09, 0.08);
    else if (kind === 'drop') osc('square', 220, 120, 0.08, 0.07);
    else if (kind === 'shoot') osc('square', 500, 200, 0.12, 0.07);
    else if (kind === 'hit') osc('sawtooth', 300, 60, 0.25, 0.09);
    else if (kind === 'hit2') osc('sawtooth', 260, 40, 0.4, 0.13);
    else if (kind === 'lap') { osc('sine', 660, 660, 0.1, 0.08); osc('sine', 880, 880, 0.12, 0.08, 0.12); }
    else if (kind === 'fanfare') { osc('square', 523, 523, 0.16, 0.09); osc('square', 659, 659, 0.16, 0.09, 0.17); osc('square', 784, 784, 0.3, 0.1, 0.34); }
  } catch (e) {}
}
function startEngine() {
  try {
    const a = AC();
    if (engOsc) return;
    engOsc = a.createOscillator();
    engGain = a.createGain();
    engOsc.type = 'sawtooth';
    engOsc.frequency.value = 55;
    engGain.gain.value = 0;
    engOsc.connect(engGain); engGain.connect(a.destination);
    engOsc.start();
  } catch (e) {}
}
function updateEngine() {
  if (!engOsc || !player) return;
  const on = state === 'race' || state === 'countdown' || state === 'finish';
  engGain.gain.value = on ? 0.022 : 0;
  engOsc.frequency.value = 50 + Math.abs(player.speed) * 3.4 + (player.boost > 0 ? 40 : 0);
}
function perfNow() { return performance.now(); }

/* ===== 화면 전환 / 메뉴 ===== */
function showScreen(id) {
  ['menu', 'select', 'records', 'results'].forEach(function (s2) {
    document.getElementById(s2).style.display = s2 === id ? 'flex' : 'none';
  });
  if (id === 'menu' || id === 'select' || id === 'records') document.body.classList.remove('racing');
}
let lastChar = 2;
(function initUI() {
  const $ = function (i) { return document.getElementById(i); };
  $('subT').textContent = L.sub;
  $('startBtn').textContent = L.start;
  $('recBtn').textContent = L.records;
  $('backBtn').textContent = L.back;
  $('recBackBtn').textContent = L.back;
  $('retryBtn').textContent = L.retry;
  $('menuBtn').textContent = L.menu;
  $('selT').textContent = L.selectTitle;
  $('recT').textContent = L.records;
  $('resT').textContent = L.resTitle;
  $('recNote').textContent = L.recNote;
  $('helpBox').innerHTML = L.help;
  $('exportBtn').textContent = L.expSave;
  $('importBtn').textContent = L.impSave;
  $('nick').placeholder = L.nickPh;
  $('nick').value = save.nick || '';
  const gamesUrl = LANG === 'en' ? '/games/' : '/' + LANG + '/games/';
  $('credit').innerHTML = L.credit + '<a href="' + gamesUrl + '">MENEW SOFT</a>';
  document.documentElement.lang = LANG;

  // 캐릭터 그리드
  const grid = $('charGrid');
  CHARS.forEach(function (ch, i) {
    const card = document.createElement('div');
    card.className = 'charCard';
    const hex = '#' + ch.body.toString(16).padStart(6, '0');
    const hairHex = '#' + ch.hair.toString(16).padStart(6, '0');
    card.innerHTML =
      '<div class="charKart" style="background:' + hex + '"></div>' +
      '<div class="charHead" style="background:#' + ch.skin.toString(16).padStart(6, '0') +
      ';box-shadow:0 -5px 0 ' + hairHex + (ch.f ? ',6px -5px 0 ' + hairHex : '') + '"></div>' +
      '<div class="charName">' + ch.id + (ch.f ? ' 🎀' : '') + '</div>' +
      '<div class="charStat">' +
      '<div class="bar"><i style="width:' + ((ch.sp - 30) / 5.5 * 100) + '%"></i></div>' +
      '<div class="bar"><i style="width:' + ((ch.ac - 9) / 7.5 * 100) + '%"></i></div>' +
      '<div class="bar"><i style="width:' + ((ch.hd - 1.5) / 0.8 * 100) + '%"></i></div>' +
      '</div>';
    card.addEventListener('click', function () { lastChar = i; startRace(i); });
    grid.appendChild(card);
  });

  $('startBtn').addEventListener('click', function () {
    save.nick = ($('nick').value || '').trim() || 'Player' + (100 + (Math.random() * 900 | 0));
    $('nick').value = save.nick;
    persist();
    showScreen('select');
  });
  $('backBtn').addEventListener('click', function () { showScreen('menu'); });
  $('recBtn').addEventListener('click', showRecords);
  $('recBackBtn').addEventListener('click', function () { showScreen('menu'); });
  $('retryBtn').addEventListener('click', function () { startRace(lastChar); });
  $('menuBtn').addEventListener('click', function () { showScreen('menu'); });

  // 세이브
  $('exportBtn').addEventListener('click', function () {
    const blob = new Blob([JSON.stringify(save)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'menewkart-save-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    alert(L.expDone);
  });
  $('importBtn').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function (e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = function () {
      let d = null;
      try { d = JSON.parse(r.result); } catch (err) {}
      if (!d || d.game !== 'menewkart' || !Array.isArray(d.records)) { alert(L.impErr); return; }
      if (!confirm(L.impConfirm)) return;
      save = d; persist();
      $('nick').value = save.nick || '';
      alert('OK');
    };
    r.readAsText(f);
  });
})();

addEventListener('keydown', function (e) {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0 &&
      document.activeElement !== document.getElementById('nick')) e.preventDefault();
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && state === 'race' && player) useItem(player);
  if (e.code === 'Escape' && (state === 'race' || state === 'countdown' || state === 'finish')) {
    if (confirm(L.quitConfirm)) { state = 'menu'; showScreen('menu'); }
  }
});
addEventListener('keyup', function (e) { keys[e.code] = false; });

/* ===== 메인 루프 ===== */
function stepGame(dt) {
  if (state === 'countdown') {
    const before = Math.ceil(cdT);
    cdT -= dt;
    const now2 = Math.ceil(cdT);
    if (now2 !== before && now2 > 0) { showMsg(String(now2), 0.9); sound('beep'); }
    if (cdT <= 0) { state = 'race'; showMsg(L.go, 1); sound('go'); }
    updateHUD(dt);
    return;
  }
  if (state !== 'race' && state !== 'finish') return;
  raceT += dt;
  for (let i = 0; i < karts.length; i++) updateKart(karts[i], dt);
  kartCollisions();
  updateHazards(dt);
  updateHUD(dt);
}
let last = performance.now();
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  stepGame(dt);
  updateCamera(false);
  updateEngine();
  renderer.render(scene, camera);
}
// 대기 화면 카메라(메뉴 배경으로 트랙 돌기)
let idleA = 0;
setInterval(function () {
  if (state === 'menu' || state === 'select' || state === 'records') {
    idleA += 0.0016;
    const i = Math.floor((idleA % 1) * N);
    const s = sampleAt(i), s2 = sampleAt(i + 30);
    camera.position.set(s.p.x, s.p.y + 14, s.p.z);
    camera.lookAt(s2.p.x, s2.p.y + 2, s2.p.z);
  }
}, 33);
requestAnimationFrame(tick);

// ?screen=select|records : 특정 화면 바로 열기 (스크린샷/디버그용)
(function () {
  const scr = new URLSearchParams(location.search).get('screen');
  if (scr === 'select') showScreen('select');
  else if (scr === 'records') showRecords();
})();

/* ===== 테스트 모드 (?test=1 쇼케이스 / ?test=sim 시뮬 검증) ===== */
if (new URLSearchParams(location.search).has('test')) {
  window._TEST = true;
  setTimeout(function () {
    save.nick = 'TEST';
    startRace(2); // MeNew
    player.cpu = true; // 자율 주행
    cdT = 0.01;
    if (new URLSearchParams(location.search).get('test') === 'sim') {
      state = 'race';
      for (let k2 = 0; k2 < 3600; k2++) stepGame(1 / 60); // 60초 시뮬
      const r = rankOf(player);
      console.warn('[TEST] after 60s: playerLap=' + player.lap + ' rank=' + r +
        ' spd=' + player.speed.toFixed(1) + ' finished=' + player.finished +
        ' records=' + save.records.length);
      let laps = karts.map(function (k3) { return k3.lap; }).join(',');
      console.warn('[TEST] laps: ' + laps);
    }
    updateCamera(true);
  }, 1000);
}
