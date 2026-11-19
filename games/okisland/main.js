// 옥구슬 섬 — 3D 섬 탐험 시제품
// 에셋: Kenney Nature Kit · Survival Kit · Mini Characters (전부 CC0)
// 검증: ?test=sim (자가검증) · ?shot=spawn|west|east|north|shrine|aerial (화면 확인용 구도)
import * as THREE from 'three';
import { GLTFLoader } from './vendor/addons/loaders/GLTFLoader.js';

const QS = new URLSearchParams(location.search);
const TEST = QS.get('test');
const SHOT = QS.get('shot');
const $ = id => document.getElementById(id);

// ───────────────────────────── 수학 도구
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function hash2(ix, iz) {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967295;
}
function vnoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  const top = a + (b - a) * u, bot = c + (d - c) * u; return top + (bot - top) * v;
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const lerp = (a, b, t) => a + (b - a) * t;

// ───────────────────────────── 지형
const SEA = 0;
const SHRINE = { x: 6, z: -2 };
const WEST = { x: -34, z: 6 };
const NORTH = { x: -2, z: -36 };
const EZ = -6;                       // 동쪽 돌기둥 줄의 z
const FLATS = [];                    // 평탄화 구역 {x,z,r,level}

function rawHeight(x, z) {
  const r = Math.hypot(x, z), a = Math.atan2(z, x);
  const R = 58 + 5 * Math.sin(3 * a + 0.5) + 3 * Math.sin(5 * a + 1.3) + 4 * (vnoise(x * 0.04 + 10, z * 0.04) - 0.5);
  const t = clamp((R - r) / 24, 0, 1);
  let h = -4.5 + smooth(0, 1, t) * 6.5;
  h += t * t * ((vnoise(x * 0.06, z * 0.06) - 0.5) * 3 + (vnoise(x * 0.15 + 3, z * 0.15) - 0.5) * 0.8);
  const dS = Math.hypot(x - SHRINE.x, z - SHRINE.z);
  h += 6.5 * Math.exp(-(dS * dS) / (2 * 13 * 13)) * t;
  return h;
}
function height(x, z) {
  let h = rawHeight(x, z);
  for (const f of FLATS) {
    const d = Math.hypot(x - f.x, z - f.z);
    if (d < f.r) h += (f.level - h) * smooth(f.r, f.r * 0.55, d);
  }
  return h;
}
function addFlat(x, z, r, minLevel = 1.4) { const f = { x, z, r, level: Math.max(rawHeight(x, z), minLevel) }; FLATS.push(f); return f; }

const N = 192, HALF = 120, STEP = HALF * 2 / N;
const Hgrid = new Float32Array((N + 1) * (N + 1));
function terrainAt(x, z) {
  const fx = (x + HALF) / STEP, fz = (z + HALF) / STEP;
  const ix = Math.floor(fx), iz = Math.floor(fz);
  if (ix < 0 || iz < 0 || ix >= N || iz >= N) return -6;
  const u = fx - ix, v = fz - iz, W = N + 1;
  const h00 = Hgrid[iz * W + ix], h10 = Hgrid[iz * W + ix + 1], h01 = Hgrid[(iz + 1) * W + ix], h11 = Hgrid[(iz + 1) * W + ix + 1];
  return (u + v <= 1) ? h00 + u * (h10 - h00) + v * (h01 - h00) : h11 + (1 - u) * (h01 - h11) + (1 - v) * (h10 - h11);
}

// ───────────────────────────── 충돌체
const boxes = [];    // {minx,maxx,minz,maxz,bottom,top}
const circles = [];  // {x,z,r,bottom,top}
const PR = 0.4, PH = 1.6, STEP_UP = 0.45, GRAV = 28, JUMP_V = 10;
const addBox = (cx, cz, hx, hz, bottom, top) => { const b = { minx: cx - hx, maxx: cx + hx, minz: cz - hz, maxz: cz + hz, bottom, top }; boxes.push(b); return b; };
const addCircle = (x, z, r, bottom, top) => { const c = { x, z, r, bottom, top }; circles.push(c); return c; };

function groundAt(x, z, feetY) {
  let g = terrainAt(x, z);
  for (const b of boxes) {
    if (b.off) continue;
    if (x > b.minx - 0.15 && x < b.maxx + 0.15 && z > b.minz - 0.15 && z < b.maxz + 0.15 && b.top <= feetY + STEP_UP && b.top > g) g = b.top;
  }
  return g;
}
function overlapsSolid(x, z, r, y0, y1, ignore) {
  for (const c of circles) if (y0 < c.top && y1 > c.bottom && Math.hypot(x - c.x, z - c.z) < c.r + r) return true;
  for (const b of boxes) {
    if (b.off || b === ignore) continue;
    if (y0 < b.top - 0.05 && y1 > b.bottom) {
      const qx = clamp(x, b.minx, b.maxx), qz = clamp(z, b.minz, b.maxz);
      if (Math.hypot(x - qx, z - qz) < r) return true;
    }
  }
  return false;
}

// ───────────────────────────── 렌더러·장면
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!(TEST || SHOT) });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfe8fb, 70, 230);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1500);

scene.add(new THREE.HemisphereLight(0xdff2ff, 0x6a8a4a, 1.25));
const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 160 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const SUN_DIR = new THREE.Vector3(-0.55, 1, 0.35).normalize();

const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
  uniforms: { top: { value: new THREE.Color(0x4aa6ee) }, bot: { value: new THREE.Color(0xdcf0ff) } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float t = clamp(vP.y*1.8+0.05,0.,1.); gl_FragColor = vec4(mix(bot,top,t),1.); }',
}));
sky.renderOrder = -1;
scene.add(sky);

function fitView() {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 1 ? 72 : 55;   // 세로 화면은 좌우가 좁으니 시야를 넓힌다
  camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', fitView);
fitView();

// ───────────────────────────── 모델 불러오기
const CHAR = 'char/character-female-b';
const N_ = k => 'nature/' + k;
const MODEL_KEYS = [
  CHAR, 'surv/box', 'surv/chest', 'surv/barrel', 'surv/campfire-pit', 'surv/bucket', 'surv/resource-wood',
  ...['tree_oak', 'tree_default', 'tree_detailed', 'tree_pineDefaultA', 'tree_fat', 'tree_palmTall', 'tree_palmBend', 'tree_palmShort',
    'rock_largeA', 'rock_largeB', 'rock_largeC', 'rock_largeD', 'rock_tallA', 'rock_tallB', 'rock_smallA', 'rock_smallC',
    'plant_bushLarge', 'plant_bush', 'plant_bushDetailed', 'grass_large', 'grass', 'flower_redA', 'flower_yellowB', 'flower_purpleC',
    'mushroom_redGroup', 'mushroom_tanGroup', 'log_large', 'stump_round',
    'cliff_block_rock', 'cliff_block_stone', 'platform_stone', 'statue_obelisk', 'statue_column', 'statue_columnDamaged',
    'statue_head', 'statue_ring', 'statue_block', 'sign', 'tent_detailedOpen', 'campfire_stones', 'lily_large'].map(N_),
];
const models = {}, clips = {};
async function loadAll(onProgress) {
  const loader = new GLTFLoader();
  let n = 0;
  await Promise.all(MODEL_KEYS.map(async k => {
    const g = await loader.loadAsync(`assets/${k}.glb`);
    g.scene.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      // glTF 는 metallicFactor 가 없으면 1 로 읽힌다 — 환경맵이 없으니 옆면이 새까매진다
      for (const m of [].concat(o.material)) { m.metalness = 0; m.roughness = Math.max(m.roughness, 0.8); }
    });
    models[k] = g.scene; clips[k] = g.animations;
    onProgress(++n / MODEL_KEYS.length);
  }));
}
function place(key, x, y, z, s = 1, ry = 0, sy) {
  const o = models[key].clone(true);
  o.position.set(x, y, z); o.scale.set(s, sy ?? s, s); o.rotation.y = ry;
  scene.add(o); return o;
}
// 흩뿌리는 장식은 모델마다 InstancedMesh 하나로 — 그리기 호출을 수백 개에서 수십 개로 줄인다
function instance(key, mats, shadow = true) {
  if (!mats.length) return;
  const src = models[key]; src.updateMatrixWorld(true);
  const tmp = new THREE.Matrix4();
  src.traverse(o => {
    if (!o.isMesh) return;
    const im = new THREE.InstancedMesh(o.geometry, o.material, mats.length);
    mats.forEach((m, i) => im.setMatrixAt(i, tmp.multiplyMatrices(m, o.matrixWorld)));
    im.castShadow = shadow; im.receiveShadow = true; im.computeBoundingSphere();
    scene.add(im);
  });
}
const mat4 = (x, y, z, s, ry) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s));

// ───────────────────────────── 게임 상태
const S = {
  started: false, time: 0, orbs: 0, respawns: 0,
  carrying: false, gateOpen: false, gateOff: 0, plateHintShown: false,
  obProg: 0, obSolved: false, obWrong: 0,
  finale: null, cleared: false,
};
const P = { pos: new THREE.Vector3(), vy: 0, onGround: false, heading: 0, lastSafe: new THREE.Vector3(), safeT: 0, oneShot: null, speed: 0 };
const cam = { yaw: 0, pitch: 0.38, dist: 8.5, target: new THREE.Vector3() };
const input = { x: 0, z: 0, sprint: false, jumpPressed: false, actPressed: false };
const W = {};   // 세계 물체 참조

// ───────────────────────────── 세계 만들기
function findShore(x0, z0, dx, dz, below) {
  let x = x0, z = z0;
  for (let i = 0; i < 400; i++) { const nx = x + dx * 0.25, nz = z + dz * 0.25; if (height(nx, nz) < below) break; x = nx; z = nz; }
  return { x, z };
}

function buildWorld() {
  // 평탄화 구역 먼저 (높이장이 이것을 반영한다)
  W.fWest = addFlat(WEST.x + 6, WEST.z, 22);
  W.fNorth = addFlat(NORTH.x, NORTH.z, 13);
  W.fShrine = addFlat(SHRINE.x, SHRINE.z - 2, 9);
  const sp = findShore(0, 12, 0, 1, 1.1);
  W.spawn = { x: sp.x, z: sp.z - 3 };
  W.fCamp = addFlat(W.spawn.x, W.spawn.z, 8, 1.2);

  for (let iz = 0; iz <= N; iz++) for (let ix = 0; ix <= N; ix++) Hgrid[iz * (N + 1) + ix] = height(-HALF + ix * STEP, -HALF + iz * STEP);
  buildTerrainMesh();
  buildWater();
  buildCamp();
  buildWest();
  buildEast();
  buildNorth();
  buildShrine();
  scatter();
  buildPlayer();
}

function buildTerrainMesh() {
  const pos = new Float32Array(N * N * 18), col = new Float32Array(N * N * 18);
  const cSand = new THREE.Color(0xf0dca2), cWet = new THREE.Color(0xc8b07a), cGrassA = new THREE.Color(0x8bcf5e), cGrassB = new THREE.Color(0x63ad48),
    cRock = new THREE.Color(0xa49d90), cDirt = new THREE.Color(0xb8a27a), c = new THREE.Color();
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  let p = 0;
  const W1 = N + 1;
  const tri = (ax, az, bx, bz, cx, cz) => {
    const pts = [[ax, az], [bx, bz], [cx, cz]];
    pts.forEach(([ix, iz], k) => v[k].set(-HALF + ix * STEP, Hgrid[iz * W1 + ix], -HALF + iz * STEP));
    const ny = e1.subVectors(v[1], v[0]).cross(e2.subVectors(v[2], v[0])).normalize().y;
    const h = (v[0].y + v[1].y + v[2].y) / 3, mx = (v[0].x + v[1].x + v[2].x) / 3, mz = (v[0].z + v[1].z + v[2].z) / 3;
    const j = (hash2(ax * 7 + bz, az * 13 + cx) - 0.5) * 0.06;
    if (h < -0.2) c.copy(cWet).multiplyScalar(clamp(1 + h * 0.06, 0.7, 1));
    else if (h < 0.85) c.copy(cSand);
    else if (ny < 0.8) c.copy(cRock);
    else { c.copy(cGrassA).lerp(cGrassB, vnoise(mx * 0.09, mz * 0.09)); if (h < 1.25) c.lerp(cSand, 0.45); }
    // 퍼즐 구역 바닥은 흙빛으로 — 멀리서도 "여기 뭔가 있다"가 보이게
    for (const f of [W.fWest, W.fNorth, W.fShrine]) { const d = Math.hypot(mx - f.x, mz - f.z); if (d < f.r * 0.5 && h > 0.85) c.lerp(cDirt, 0.35 * (1 - d / (f.r * 0.5))); }
    c.offsetHSL(0, 0, j);
    for (let k = 0; k < 3; k++) { pos.set([v[k].x, v[k].y, v[k].z], p); col.set([c.r, c.g, c.b], p); p += 3; }
  };
  for (let iz = 0; iz < N; iz++) for (let ix = 0; ix < N; ix++) {
    tri(ix, iz, ix, iz + 1, ix + 1, iz);
    tri(ix + 1, iz, ix, iz + 1, ix + 1, iz + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  m.receiveShadow = true;
  scene.add(m);
}

function buildWater() {
  const g = new THREE.PlaneGeometry(520, 520, 90, 90); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x2f9ed8, transparent: true, opacity: 0.8, roughness: 0.25, metalness: 0.05, flatShading: true }));
  m.position.y = SEA; m.receiveShadow = true;
  W.water = m; W.waterBase = g.attributes.position.array.slice();
  const far = new THREE.Mesh(new THREE.RingGeometry(250, 1400, 48, 1), m.material); far.rotation.x = -Math.PI / 2; far.position.y = SEA - 0.02;
  scene.add(m, far);
}
function updateWater(t) {
  const a = W.water.geometry.attributes.position, arr = a.array, b = W.waterBase;
  for (let i = 0; i < arr.length; i += 3) arr[i + 1] = Math.sin(b[i] * 0.18 + t * 1.3) * 0.09 + Math.cos(b[i + 2] * 0.21 + t * 1.1) * 0.09;
  a.needsUpdate = true;
}

function buildCamp() {
  const { x, z } = W.spawn, y = terrainAt(x, z);
  place(N_('tent_detailedOpen'), x - 6, terrainAt(x - 6, z + 2), z + 2, 4.2, 0.5);
  addBox(x - 6, z + 2, 1.7, 1.4, y - 1, y + 2);
  place(N_('campfire_stones'), x - 2.5, terrainAt(x - 2.5, z + 3.5), z + 3.5, 3);
  place('surv/campfire-pit', x - 2.5, terrainAt(x - 2.5, z + 3.5), z + 3.5, 5);
  const flame = new THREE.Group();
  const fo = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 5), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  const fi = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.6, 5), new THREE.MeshBasicMaterial({ color: 0xffe07a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  fo.position.y = 0.45; fi.position.y = 0.32; flame.add(fo, fi);
  flame.position.set(x - 2.5, terrainAt(x - 2.5, z + 3.5) + 0.15, z + 3.5); scene.add(flame);
  const fl = new THREE.PointLight(0xff9a40, 6, 9, 1.6); fl.position.set(x - 2.5, flame.position.y + 0.6, z + 3.5); scene.add(fl);
  W.flame = flame; W.fireLight = fl;
  place('surv/barrel', x - 8.5, terrainAt(x - 8.5, z - 0.5), z - 0.5, 4.5); addCircle(x - 8.5, z - 0.5, 0.6, y - 1, y + 1.6);
  place('surv/resource-wood', x - 4, terrainAt(x - 4, z + 6), z + 6, 4.5, 1.2);
  place('surv/bucket', x - 7.5, terrainAt(x - 7.5, z + 0.8), z + 0.8, 4.5);
  const sx = x + 2.2, sz = z - 2.2;
  place(N_('sign'), sx, terrainAt(sx, sz), sz, 4.5, Math.PI + 0.3);
  addCircle(sx, sz, 0.35, y - 1, y + 1.6);
  interactables.push({ x: sx, z: sz, r: 2.6, label: () => '표지판 읽기',
    use: () => toast('〈옥구슬 섬〉 언덕 위 제단은 옥구슬 세 개로 빛났다고 한다. 구슬은 <b>서쪽 돌담</b>, <b>동쪽 바다</b>, <b>북쪽 유적</b>에 흩어져 있다.', 7) });
}

// 서쪽: 돌담 속 구슬 — 무거운 상자를 발판에 올리면 문이 열린다
function buildWest() {
  const L = W.fWest.level, cx = WEST.x, cz = WEST.z;
  W.westLevel = L;
  for (const ox of [-6, -2, 2, 6]) for (const oz of [-6, -2, 2, 6]) {
    if (Math.abs(ox) !== 6 && Math.abs(oz) !== 6) continue;
    if (ox === 6 && oz === -2) continue;                        // 문 자리
    place(N_(hash2(ox, oz) > 0.5 ? 'cliff_block_rock' : 'cliff_block_stone'), cx + ox, L - 0.2 + 0.2, cz + oz, 4, Math.floor(hash2(oz, ox) * 4) * Math.PI / 2);
    addBox(cx + ox, cz + oz, 2, 2, L - 1, L + 3.8);
  }
  // 문 — 통나무 울타리
  const gate = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x8a5a32, flatShading: true, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 3.7, 7), wood);
    log.position.set(0, 1.85, -1.66 + i * 0.66); log.castShadow = true; gate.add(log);
  }
  for (const yy of [0.9, 2.7]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 4.1), wood); bar.position.set(0.32, yy, 0); bar.castShadow = true; gate.add(bar); }
  gate.position.set(cx + 6, L, cz - 2); scene.add(gate);
  W.gate = gate; W.gateBox = addBox(cx + 6, cz - 2, 0.4, 2, L - 1, L + 3.7);

  // 발판
  W.plate = { x: cx + 12, z: cz + 6, hx: 1.35, hz: 1.1 };
  place(N_('platform_stone'), W.plate.x, L, W.plate.z, 3);
  W.plateBox = addBox(W.plate.x, W.plate.z, W.plate.hx, W.plate.hz, L - 1, L + 0.12);
  const rune = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.8, 24), new THREE.MeshBasicMaterial({ color: 0x5a6a70, transparent: true, opacity: 0.9 }));
  rune.rotation.x = -Math.PI / 2; rune.position.set(W.plate.x, L + 0.14, W.plate.z); scene.add(rune); W.plateRune = rune;

  // 상자
  const bx = cx + 15, bz = cz - 6, by = terrainAt(bx, bz);
  const mesh = place('surv/box', bx, by, bz, 3.6);
  W.box = { mesh, x: bx, z: bz, y: by, home: { x: bx, z: bz } };
  W.boxCol = addBox(bx, bz, 0.45, 0.45, by - 0.2, by + 0.9);
  interactables.push({ get x() { return W.box.x; }, get z() { return W.box.z; }, r: 2.1,
    label: () => (!S.carrying && Math.abs(W.box.y + 0.2 - P.pos.y) < 1.4) ? '상자 들기' : null,
    use: pickBox });

  addOrb(0, cx, L + 1.3, cz);
  place(N_('statue_head'), cx - 2.3, L, cz - 2.3, 3, 0.7);
  place(N_('mushroom_tanGroup'), cx + 2.5, L, cz + 2.4, 4);
}

// 동쪽: 바다 돌기둥 오르기
function buildEast() {
  const shore = findShore(24, EZ, 1, 0, 0.45);
  W.shoreX = shore.x;
  const base = terrainAt(shore.x - 0.3, EZ);
  W.pillars = [];
  for (let i = 1; i <= 6; i++) {
    const last = i === 6, half = last ? 1.6 : 1.35;
    const x = shore.x + 2.6 + 3.4 * (i - 1) + (last ? 0.4 : 0);
    const top = base + 1.0 * i;
    const bottom = terrainAt(x, EZ) - 0.6;
    const sy = top - bottom;
    place(N_(i % 2 ? 'cliff_block_rock' : 'cliff_block_stone'), x, bottom + 0.05 * sy, EZ, 1, i * Math.PI / 2, sy).scale.set(half * 2, sy, half * 2);
    W.pillars.push({ x, z: EZ, half, top });
    addBox(x, EZ, half, half, bottom, top);
  }
  const lp = W.pillars[5];
  addOrb(1, lp.x, lp.top + 1.3, lp.z);
  place(N_('lily_large'), shore.x + 4, SEA + 0.02, EZ + 4, 4);
  place(N_('lily_large'), shore.x + 9, SEA + 0.02, EZ - 3.5, 3.5, 1);
}

// 북쪽: 오벨리스크를 낮은 것부터 두드리기
function buildNorth() {
  const L = W.fNorth.level, cx = NORTH.x, cz = NORTH.z;
  W.northLevel = L;
  const ranks = [3, 1, 4, 2];
  W.obelisks = [];
  [-6, -2, 2, 6].forEach((ox, i) => {
    const rank = ranks[i], s = 2.2 + 0.75 * rank, x = cx + ox, z = cz - 4;
    place(N_('statue_obelisk'), x, L, z, s);
    const h = 0.83 * s;
    const rune = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshStandardMaterial({ color: 0x556070, emissive: 0x000000, flatShading: true }));
    rune.position.set(x, L + h + 0.45, z); scene.add(rune);
    addCircle(x, z, 0.62, L - 1, L + h);
    const ob = { rank, x, z, rune, h, lit: false };
    W.obelisks.push(ob);
    interactables.push({ x, z, r: 2.3, label: () => S.obSolved ? null : '돌기둥 두드리기', use: () => strikeObelisk(ob) });
  });
  const tx = cx, tz = cz + 3;
  place(N_('statue_block'), tx, L, tz, 3.2);
  addCircle(tx, tz, 0.75, L - 1, L + 1.1);
  interactables.push({ x: tx, z: tz, r: 2.4, label: () => '비문 읽기',
    use: () => toast('비문: <b>「낮은 돌이 먼저 노래하고, 높은 돌이 마지막에 답한다.」</b>', 6) });
  place(N_('platform_stone'), cx, L, cz, 3.6);
  place(N_('statue_columnDamaged'), cx - 9, L, cz + 1, 3.2, 0.4); addCircle(cx - 9, cz + 1, 0.55, L - 1, L + 3);
  place(N_('statue_column'), cx + 9, L, cz + 1, 3.2); addCircle(cx + 9, cz + 1, 0.55, L - 1, L + 3);
  place(N_('rock_tallB'), cx + 8.5, L, cz - 7, 3, 2.1); addCircle(cx + 8.5, cz - 7, 1.2, L - 1, L + 3);
  addOrb(2, cx, L - 1.5, cz, false);
}

function buildShrine() {
  const L = W.fShrine.level, cx = SHRINE.x, cz = SHRINE.z - 2;
  W.shrineLevel = L; W.shrine = { x: cx, z: cz };
  place(N_('statue_ring'), cx, L, cz - 3.2, 4.6);
  addCircle(cx - 1.25, cz - 3.2, 0.55, L - 1, L + 3.4); addCircle(cx + 1.25, cz - 3.2, 0.55, L - 1, L + 3.4);
  W.pedestals = [[-3.6, -2.6], [3.6, -2.6], [0, -6.4]].map(([ox, oz]) => {
    place(N_('statue_column'), cx + ox, L, cz + oz, 1.7);
    addCircle(cx + ox, cz + oz, 0.4, L - 1, L + 1.6);
    return new THREE.Vector3(cx + ox, L + 2.05, cz + oz);
  });
  const chest = place('surv/chest', cx, L - 1.6, cz, 5);
  chest.visible = false;
  W.chest = chest; W.chestMixer = new THREE.AnimationMixer(chest);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 60, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x9dffd0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(cx, L + 30, cz - 3.2); scene.add(beam); W.beam = beam;
  interactables.push({ x: cx, z: cz - 1.5, r: 3.2,
    label: () => S.finale ? null : (S.orbs >= 3 ? '옥구슬 바치기' : '제단 살펴보기'),
    use: () => {
      if (S.orbs >= 3) startFinale();
      else toast(`제단에 구슬을 끼울 자리가 세 개 있다. (${S.orbs}/3)`, 4);
    } });
}

function scatter() {
  const R = rng(20260917);
  const exclusions = [
    { x: WEST.x + 6, z: WEST.z, r: 23 }, { x: NORTH.x, z: NORTH.z, r: 14 }, { x: SHRINE.x, z: SHRINE.z - 3, r: 10 },
    { x: W.spawn.x - 3, z: W.spawn.z + 1, r: 10 },
  ];
  const excluded = (x, z) => exclusions.some(e => Math.hypot(x - e.x, z - e.z) < e.r) || (x > W.shoreX - 8 && Math.abs(z - EZ) < 6);
  const slopeOk = (x, z) => Math.abs(terrainAt(x + 1, z) - terrainAt(x - 1, z)) + Math.abs(terrainAt(x, z + 1) - terrainAt(x, z - 1)) < 1.2;
  const buckets = {};
  const put = (k, m) => (buckets[k] ||= []).push(m);
  const trees = [];
  const tryN = (n, fn) => { for (let i = 0; i < n; i++) { const x = (R() - 0.5) * 140, z = (R() - 0.5) * 140; fn(x, z, terrainAt(x, z)); } };

  const TREE = ['tree_oak', 'tree_default', 'tree_detailed', 'tree_pineDefaultA', 'tree_fat'];
  tryN(700, (x, z, h) => {
    if (trees.length >= 95 || h < 1.4 || h > 9 || excluded(x, z) || !slopeOk(x, z)) return;
    if (trees.some(t => Math.hypot(t.x - x, t.z - z) < 4.2)) return;
    if (vnoise(x * 0.05 + 40, z * 0.05) < 0.38) return;     // 숲과 빈터가 생기게
    const s = 3.3 + R() * 1.2; trees.push({ x, z });
    put(N_(TREE[Math.floor(R() * TREE.length)]), mat4(x, h - 0.1, z, s, R() * 6.28));
    addCircle(x, z, 0.5, h - 1, h + 6);
  });
  const PALM = ['tree_palmTall', 'tree_palmBend', 'tree_palmShort'];
  let palms = 0;
  tryN(900, (x, z, h) => {
    if (palms >= 34 || h < 0.35 || h > 1.35 || excluded(x, z)) return;
    if (trees.some(t => Math.hypot(t.x - x, t.z - z) < 5)) return;
    trees.push({ x, z }); palms++;
    put(N_(PALM[Math.floor(R() * 3)]), mat4(x, h - 0.1, z, 3.4 + R(), R() * 6.28));
    addCircle(x, z, 0.45, h - 1, h + 6);
  });
  const ROCK = ['rock_largeA', 'rock_largeB', 'rock_largeC', 'rock_largeD'];
  tryN(260, (x, z, h) => {
    if (h < 0.2 || excluded(x, z) || R() < 0.55) return;
    if (trees.some(t => Math.hypot(t.x - x, t.z - z) < 3)) return;
    const s = 2.4 + R() * 1.6; put(N_(ROCK[Math.floor(R() * 4)]), mat4(x, h - 0.1, z, s, R() * 6.28));
    addCircle(x, z, 0.35 * s, h - 1, h + 0.2 * s + 0.2);
  });
  const SMALL = [['plant_bushLarge', 4.5, 1.4, 9], ['plant_bush', 4.5, 1.2, 9], ['plant_bushDetailed', 4, 1.3, 9], ['grass_large', 4.5, 0.9, 9],
    ['grass', 5, 0.9, 9], ['flower_redA', 4.5, 1.3, 8], ['flower_yellowB', 4.5, 1.3, 8], ['flower_purpleC', 4.5, 1.3, 8],
    ['mushroom_redGroup', 4, 1.5, 8], ['rock_smallA', 4, 0.2, 9], ['rock_smallC', 4, 0.2, 9]];
  tryN(2600, (x, z, h) => {
    const [k, s, hmin, hmax] = SMALL[Math.floor(R() * SMALL.length)];
    if (h < hmin || h > hmax || excluded(x, z) && R() < 0.8) return;
    if (k.startsWith('grass') || k.startsWith('flower')) { if (vnoise(x * 0.12, z * 0.12) < 0.35) return; }
    put(N_(k), mat4(x, h - 0.05, z, s * (0.8 + R() * 0.4), R() * 6.28));
  });
  for (let i = 0; i < 10; i++) {                      // 쓰러진 통나무·그루터기
    const x = (R() - 0.5) * 110, z = (R() - 0.5) * 110, h = terrainAt(x, z);
    if (h < 1.5 || excluded(x, z) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 3)) continue;
    put(N_(i % 2 ? 'log_large' : 'stump_round'), mat4(x, h - 0.1, z, 3.5, R() * 6.28));
    addCircle(x, z, i % 2 ? 1.2 : 0.6, h - 1, h + 1.2);
  }
  for (const k in buckets) instance(k, buckets[k], !/grass|flower|rock_small/.test(k));
}

// ───────────────────────────── 옥구슬
W.orbs = [];
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(190,255,220,1)'); gr.addColorStop(0.35, 'rgba(90,240,170,.55)'); gr.addColorStop(1, 'rgba(60,220,150,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
function addOrb(id, x, y, z, active = true, register = true) {
  const grp = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 1),
    new THREE.MeshStandardMaterial({ color: 0x5cf0a8, emissive: 0x1fbf7a, emissiveIntensity: 1.4, flatShading: true, roughness: 0.3 }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.setScalar(2.6);
  grp.add(core, halo); grp.position.set(x, y, z); grp.visible = active;
  scene.add(grp);
  const o = { id, grp, core, base: new THREE.Vector3(x, y, z), active, taken: false, rise: 0 };
  if (register) W.orbs[id] = o; return o;
}
const QUEST_NAMES = ['서쪽 돌담 속', '동쪽 바다 돌기둥 꼭대기', '북쪽 유적의 비밀'];
function updateOrbs(dt, t) {
  for (const o of W.orbs) {
    if (o.taken) continue;
    if (o.id === 2 && S.obSolved && o.rise < 1) {
      o.rise = Math.min(1, o.rise + dt / 2.2); o.grp.visible = true;
      o.base.y = lerp(W.northLevel - 1.5, W.northLevel + 1.4, smooth(0, 1, o.rise));
      if (o.rise >= 1) o.active = true;
    }
    if (!o.grp.visible) continue;
    o.grp.position.set(o.base.x, o.base.y + Math.sin(t * 2 + o.id) * 0.18, o.base.z);
    o.core.rotation.y += dt * 1.5;
    if (o.active && P.pos.distanceTo(tmpV.set(o.base.x, o.base.y - 0.8, o.base.z)) < 1.5) {
      o.taken = true; o.grp.visible = false; S.orbs++;
      burst(o.base, 0x7dffc0); sfx.pick();
      toast(S.orbs < 3 ? `옥구슬을 찾았다! (${S.orbs}/3)` : '옥구슬 세 개를 모두 찾았다! 섬 한가운데 <b>언덕 위 제단</b>으로 가자.', 4.5);
      questDirty = true;
    }
  }
}

// ───────────────────────────── 퍼즐 동작
const interactables = [];
function pickBox() {
  if (S.carrying) return;
  S.carrying = true; W.boxCol.off = true;
  P.oneShot = { name: 'pick-up', t: 0.35 };
  sfx.thud();
}
function dropBox() {
  const fx = Math.sin(P.heading), fz = Math.cos(P.heading);
  for (const d of [1.45, 1.05]) {
    const x = P.pos.x + fx * d, z = P.pos.z + fz * d;
    const y = groundAt(x, z, P.pos.y + 0.3);
    if (Math.abs(y - P.pos.y) > 1.2) continue;
    if (overlapsSolid(x, z, 0.45, y + 0.05, y + 0.85, W.boxCol)) continue;
    if (Math.hypot(x - P.pos.x, z - P.pos.z) < PR + 0.5) continue;
    S.carrying = false;
    Object.assign(W.box, { x, z, y });
    Object.assign(W.boxCol, { minx: x - 0.45, maxx: x + 0.45, minz: z - 0.45, maxz: z + 0.45, bottom: y - 0.2, top: y + 0.9, off: false });
    W.box.mesh.position.set(x, y, z); W.box.mesh.rotation.set(0, P.heading, 0);
    sfx.thud();
    return true;
  }
  toast('여기에는 내려놓을 수 없다.', 2);
  return false;
}
function boxOnPlate() {
  const b = W.box, p = W.plate;
  return !S.carrying && Math.abs(b.x - p.x) < p.hx + 0.3 && Math.abs(b.z - p.z) < p.hz + 0.3 && b.y >= W.westLevel + 0.05;
}
function updateWest(dt) {
  const onPlate = boxOnPlate();
  if (onPlate && !S.gateOpen) {
    S.gateOpen = true; sfx.solve();
    toast('쿠웅… 돌담의 나무문이 땅속으로 가라앉는다!', 4);
  }
  const playerOnPlate = Math.abs(P.pos.x - W.plate.x) < W.plate.hx && Math.abs(P.pos.z - W.plate.z) < W.plate.hz && P.onGround;
  if (playerOnPlate && !onPlate && !S.gateOpen && !S.plateHintShown && !S.carrying) {
    S.plateHintShown = true; toast('발판이 살짝 눌렸다가 다시 올라온다. 사람보다 <b>무거운 것</b>이 필요할 것 같다.', 5);
  }
  W.plateRune.material.color.set(onPlate || S.gateOpen ? 0x6dffc0 : (playerOnPlate ? 0xb8c870 : 0x5a6a70));
  if (S.gateOpen && S.gateOff > -3.75) {
    S.gateOff = Math.max(-3.75, S.gateOff - dt * 2.2);
    W.gate.position.y = W.westLevel + S.gateOff;
    W.gate.position.x = WEST.x + 6 + Math.sin(S.time * 60) * 0.03;
    W.gateBox.top = W.westLevel + 3.7 + S.gateOff;
  }
  // 상자
  const m = W.box.mesh;
  if (S.carrying) {
    m.position.set(P.pos.x + Math.sin(P.heading) * 0.6, P.pos.y + 0.5, P.pos.z + Math.cos(P.heading) * 0.6);
    m.rotation.set(0, P.heading, 0);
  }
}
const OB_NOTES = [523.25, 659.25, 783.99, 1046.5];
function strikeObelisk(ob) {
  if (S.obSolved) return;
  P.oneShot = { name: 'interact-right', t: 0.45 };
  sfx.tap(OB_NOTES[ob.rank - 1] / 2);
  if (ob.rank === S.obProg + 1) {
    S.obProg++; ob.lit = true;
    ob.rune.material.emissive.set(0x3dffb0); ob.rune.material.color.set(0x9fffe0);
    if (S.obProg === 4) {
      S.obSolved = true;
      setTimeout(() => sfx.solve(), 350);
      toast('네 돌기둥이 함께 울린다. 유적 가운데에서 무언가 떠오른다!', 4.5);
    }
  } else {
    S.obProg = 0; S.obWrong++;
    for (const o of W.obelisks) { o.lit = false; o.rune.material.emissive.set(0x000000); o.rune.material.color.set(0x556070); }
    setTimeout(() => sfx.wrong(), 120);
    toast(S.obWrong >= 2 ? '소리가 어긋났다. 비문을 다시 읽어 보자. (돌기둥의 <b>높이</b>를 비교해 보자)' : '소리가 어긋나며 빛이 꺼졌다…', 3.5);
  }
}
function startFinale() {
  if (S.finale) return;
  S.finale = { t: 0, from: W.pedestals.map(() => P.pos.clone().add(new THREE.Vector3(0, 1.4, 0))), opened: false, bursted: false };
  W.finaleOrbs = W.pedestals.map((_, i) => { const o = addOrb(10 + i, P.pos.x, P.pos.y + 1.4, P.pos.z, false, false); o.grp.visible = true; return o; });
  sfx.solve();
}
function updateFinale(dt) {
  const F = S.finale; if (!F) return;
  F.t += dt;
  W.finaleOrbs.forEach((o, i) => {
    const k = smooth(0.1 + i * 0.25, 1.1 + i * 0.25, F.t);
    o.base.lerpVectors(F.from[i], W.pedestals[i], k);
    o.base.y += Math.sin(k * Math.PI) * 2.5;
    o.grp.position.copy(o.base); o.core.rotation.y += dt * 3;
  });
  W.beam.material.opacity = smooth(1.6, 2.6, F.t) * (0.35 + Math.sin(S.time * 4) * 0.05);
  if (F.t > 2.0) {
    const k = smooth(2.0, 3.6, F.t);
    W.chest.visible = true; W.chest.position.y = lerp(W.shrineLevel - 1.6, W.shrineLevel, k);
  }
  if (F.t > 3.8 && !F.opened) {
    F.opened = true;
    const clip = clips['surv/chest'].find(c => c.name === 'open');
    if (clip) { const a = W.chestMixer.clipAction(clip); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.play(); }
  }
  W.chestMixer.update(dt);
  if (F.t > 4.3 && !F.bursted) { F.bursted = true; burst(W.chest.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffe08a, 90); sfx.fanfare(); }
  if (F.t > 6.5 && !S.cleared) {
    S.cleared = true;
    const mm = Math.floor(S.time / 60), ss = Math.floor(S.time % 60);
    $('clearStats').innerHTML = `걸린 시간 <b>${mm}분 ${ss}초</b> · 바다에 빠진 횟수 <b>${S.respawns}번</b>`;
    if (!TEST) $('clear').hidden = false;
  }
}

// ───────────────────────────── 입자
const bursts = [];
function burst(at, color, n = 50) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) {
    pos.set([at.x, at.y, at.z], i * 3);
    const a = Math.random() * 6.28, u = Math.random() * 2 - 1, s = 3 + Math.random() * 4;
    vel.push(new THREE.Vector3(Math.cos(a) * Math.sqrt(1 - u * u), Math.abs(u) + 0.3, Math.sin(a) * Math.sqrt(1 - u * u)).multiplyScalar(s));
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size: 0.28, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(pts); bursts.push({ pts, vel, t: 0 });
}
function updateBursts(dt) {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i]; b.t += dt;
    const a = b.pts.geometry.attributes.position;
    b.vel.forEach((v, k) => { v.y -= 6 * dt; a.array[k * 3] += v.x * dt; a.array[k * 3 + 1] += v.y * dt; a.array[k * 3 + 2] += v.z * dt; });
    a.needsUpdate = true; b.pts.material.opacity = 1 - b.t / 1.3;
    if (b.t > 1.3) { scene.remove(b.pts); b.pts.geometry.dispose(); bursts.splice(i, 1); }
  }
}

// ───────────────────────────── 주인공
const A = { mixer: null, acts: {}, cur: null, holding: false };
function buildPlayer() {
  const m = models[CHAR];
  m.scale.setScalar(2.4);
  scene.add(m); W.player = m;
  A.mixer = new THREE.AnimationMixer(m);
  const base = clips[CHAR], get = n => base.find(c => c.name === n);
  const reg = (name, clip, loop = true) => {
    if (!clip) return; const a = A.mixer.clipAction(clip);
    if (!loop) { a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; }
    A.acts[name] = a;
  };
  for (const n of ['idle', 'walk', 'sprint', 'fall', 'holding-both']) reg(n, get(n));
  for (const n of ['jump', 'pick-up', 'interact-right']) reg(n, get(n), false);
  for (const n of ['idle', 'walk', 'sprint', 'fall']) {
    const c = get(n)?.clone(); if (!c) continue;
    c.name = n + '_legs'; c.tracks = c.tracks.filter(t => !/arm-/.test(t.name)); reg(n + '_legs', c);
  }
  const up = get('holding-both')?.clone();
  if (up) { up.name = 'hold_arms'; up.tracks = up.tracks.filter(t => /arm-/.test(t.name)); reg('hold_arms', up); }

  const { x, z } = W.spawn;
  P.pos.set(x, terrainAt(x, z), z); P.lastSafe.copy(P.pos);
  cam.yaw = Math.atan2(-(SHRINE.x - x), -(SHRINE.z - z));   // 카메라가 제단 쪽을 바라보게 (앞 = -sin yaw, -cos yaw)
  P.heading = Math.atan2(SHRINE.x - x, SHRINE.z - z);
  cam.target.set(x, P.pos.y + 1.3, z);
}
function setAnim(name) {
  if (A.cur === name || !A.acts[name]) return;
  const next = A.acts[name];
  next.reset().setEffectiveWeight(1).fadeIn(0.15).play();
  if (A.cur) A.acts[A.cur].fadeOut(0.15);
  A.cur = name;
}
function updateAnim(dt, moving) {
  let name;
  const legs = S.carrying ? '_legs' : '';
  if (P.oneShot && P.oneShot.t > 0) { P.oneShot.t -= dt; name = P.oneShot.name; }
  else if (!P.onGround && P.airT > 0.12) name = (P.vy > 0 && !S.carrying ? 'jump' : 'fall' + legs);
  else if (moving) name = (P.speed > 6.5 ? 'sprint' : 'walk') + legs;
  else name = S.carrying ? 'holding-both' : 'idle';
  setAnim(name);
  const hold = A.acts.hold_arms;
  if (hold) {
    const want = S.carrying && name !== 'holding-both' && !P.oneShot?.t;
    if (want && !A.holding) { hold.reset().fadeIn(0.15).play(); A.holding = true; }
    if (!want && A.holding) { hold.fadeOut(0.15); A.holding = false; }
  }
  A.mixer.update(dt);
}

// ───────────────────────────── 한 프레임
const tmpV = new THREE.Vector3();
let nearest = null, questDirty = true;
function step(dt) {
  S.time += dt;
  const frozen = !!S.finale;
  // 이동 입력 → 카메라 기준 방향
  let ix = frozen ? 0 : input.x, iz = frozen ? 0 : input.z;
  const len = Math.hypot(ix, iz); if (len > 1) { ix /= len; iz /= len; }
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw);
  let mx = fx * iz + (-fz) * ix, mz = fz * iz + fx * ix;
  const moving = Math.hypot(mx, mz) > 0.05;
  const inWater = terrainAt(P.pos.x, P.pos.z) < SEA - 0.25 && P.pos.y < SEA + 0.1;
  let speed = (input.sprint && !S.carrying ? 8.5 : 5) * (S.carrying ? 0.8 : 1) * (inWater ? 0.6 : 1);
  P.speed = moving ? speed * Math.min(1, len) : 0;
  if (moving) {
    const target = Math.atan2(mx, mz);
    P.heading += wrapA(target - P.heading) * Math.min(1, dt * 12);
  }
  if (input.jumpPressed && P.onGround && !S.carrying && !frozen) { P.vy = JUMP_V; P.onGround = false; sfx.jump(); }

  // 수평 이동 + 밀어내기
  // 공중에선 수평 속도 상한 — 달리기 점프가 다음 발판을 훌쩍 넘어가지 않게
  const hs = P.onGround ? P.speed : Math.min(P.speed, 6.5);
  P.pos.x += mx * hs * dt; P.pos.z += mz * hs * dt;
  for (let it = 0; it < 2; it++) {
    for (const c of circles) {
      if (P.pos.y >= c.top - 0.05 || P.pos.y + PH <= c.bottom) continue;
      const dx = P.pos.x - c.x, dz = P.pos.z - c.z, d = Math.hypot(dx, dz), min = c.r + PR;
      if (d < min && d > 1e-5) { P.pos.x = c.x + dx / d * min; P.pos.z = c.z + dz / d * min; }
    }
    for (const b of boxes) {
      if (b.off || P.pos.y >= b.top - STEP_UP || P.pos.y + PH <= b.bottom) continue;
      const qx = clamp(P.pos.x, b.minx, b.maxx), qz = clamp(P.pos.z, b.minz, b.maxz);
      const dx = P.pos.x - qx, dz = P.pos.z - qz, d = Math.hypot(dx, dz);
      if (d >= PR) continue;
      if (d > 1e-5) { P.pos.x = qx + dx / d * PR; P.pos.z = qz + dz / d * PR; }
      else {  // 중심이 상자 안 — 가장 가까운 면으로
        const pen = [P.pos.x - b.minx, b.maxx - P.pos.x, P.pos.z - b.minz, b.maxz - P.pos.z], k = pen.indexOf(Math.min(...pen));
        if (k === 0) P.pos.x = b.minx - PR; else if (k === 1) P.pos.x = b.maxx + PR; else if (k === 2) P.pos.z = b.minz - PR; else P.pos.z = b.maxz + PR;
      }
    }
  }
  // 수직
  const prevY = P.pos.y, wasGround = P.onGround;
  P.vy -= GRAV * dt; P.pos.y += P.vy * dt;
  const g = groundAt(P.pos.x, P.pos.z, Math.max(prevY, P.pos.y));
  if (P.pos.y <= g) { if (!wasGround && P.vy < -12) sfx.land(); P.pos.y = g; P.vy = 0; P.onGround = true; }
  else if (wasGround && P.vy <= 0 && P.pos.y - g < 0.5) { P.pos.y = g; P.vy = 0; P.onGround = true; }
  else P.onGround = false;
  P.airT = P.onGround ? 0 : (P.airT || 0) + dt;

  // 바다에 빠짐
  if (P.pos.y < SEA - 0.95) respawn();
  else if (P.onGround && g > SEA + 0.2) { P.safeT += dt; if (P.safeT > 0.4) P.lastSafe.copy(P.pos); }
  else P.safeT = 0;

  // 상호작용
  nearest = null;
  if (!frozen) {
    let best = 1e9;
    for (const it of interactables) {
      const d = Math.hypot(it.x - P.pos.x, it.z - P.pos.z);
      if (d < it.r && d < best) { const l = it.label(); if (l) { best = d; nearest = { it, label: l }; } }
    }
    if (input.actPressed) {
      if (S.carrying) dropBox();
      else if (nearest) nearest.it.use();
    }
  }
  input.jumpPressed = input.actPressed = false;

  updateWest(dt);
  updateOrbs(dt, S.time);
  updateFinale(dt);
  updateBursts(dt);
  updateAnim(dt, moving && P.onGround);
  W.player.position.copy(P.pos);
  W.player.rotation.y = P.heading;
  updateCamera(dt);
}

function respawn() {
  S.respawns++;
  if (S.carrying) { S.carrying = false; resetBox(); }
  P.pos.copy(P.lastSafe); P.vy = 0; P.onGround = true;
  cam.target.set(P.pos.x, P.pos.y + 1.3, P.pos.z);
  sfx.splash();
  const f = $('fade'); f.style.transition = 'none'; f.style.opacity = 0.9;
  requestAnimationFrame(() => { f.style.transition = 'opacity .6s'; f.style.opacity = 0; });
}
function resetBox() {
  const h = W.box.home, y = terrainAt(h.x, h.z);
  Object.assign(W.box, { x: h.x, z: h.z, y });
  Object.assign(W.boxCol, { minx: h.x - 0.45, maxx: h.x + 0.45, minz: h.z - 0.45, maxz: h.z + 0.45, bottom: y - 0.2, top: y + 0.9, off: false });
  W.box.mesh.position.set(h.x, y, h.z);
  toast('상자는 원래 자리로 돌아갔다.', 2.5);
}

function updateCamera(dt) {
  const want = tmpV.set(P.pos.x, P.pos.y + 1.3, P.pos.z);
  cam.target.lerp(want, Math.min(1, dt * 10));
  cam.pitch = clamp(cam.pitch, 0.05, 1.25);
  cam.dist = clamp(cam.dist, 4, 18);
  const cp = Math.cos(cam.pitch);
  let x = cam.target.x + Math.sin(cam.yaw) * cp * cam.dist, z = cam.target.z + Math.cos(cam.yaw) * cp * cam.dist;
  let y = cam.target.y + Math.sin(cam.pitch) * cam.dist;
  const floor = Math.max(terrainAt(x, z), SEA) + 0.6;
  if (y < floor) y = floor;
  camera.position.set(x, y, z);
  camera.lookAt(cam.target);
  sky.position.copy(camera.position);
  sun.position.copy(P.pos).addScaledVector(SUN_DIR, 60);
  sun.target.position.copy(P.pos);
}

// ───────────────────────────── 화면 표시
let toastTimer = 0;
function toast(html, sec = 3) { const t = $('toast'); t.innerHTML = html; t.style.opacity = 1; toastTimer = sec; }
function updateHUD(dt) {
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').style.opacity = 0; }
  const pr = $('prompt');
  const lbl = S.finale ? null : (S.carrying ? '상자 내려놓기' : nearest?.label);
  if (lbl) { pr.hidden = false; const key = IS_TOUCH ? '행동' : 'E'; if (pr.dataset.l !== lbl) { pr.innerHTML = `<kbd>${key}</kbd>${lbl}`; pr.dataset.l = lbl; } }
  else pr.hidden = true;
  if (questDirty) {
    questDirty = false;
    let h = `<b>옥구슬 찾기 (${S.orbs}/3)</b><br>`;
    W.orbs.slice(0, 3).forEach((o, i) => { h += `<span class="${o.taken ? 'done' : ''}">${o.taken ? '◆' : '◇'} ${QUEST_NAMES[i]}</span><br>`; });
    if (S.orbs >= 3) h += `<b>★ 언덕 위 제단에 바치기</b>`;
    $('quest').innerHTML = h;
  }
  // 나침: 북 = -z
  const cmp = $('compass'), w = cmp.clientWidth, fwd = -cam.yaw;
  const items = [['N', 0, '북'], ['E', Math.PI / 2, '동'], ['S', Math.PI, '남'], ['W', -Math.PI / 2, '서']].map(([k, a, t]) => ({ k, a, html: t, cls: 'tick' }));
  const targets = [[WEST.x, WEST.z], [W.pillars[5].x, EZ], [NORTH.x, NORTH.z]];
  W.orbs.slice(0, 3).forEach((o, i) => { if (!o.taken) items.push({ k: 'o' + i, a: Math.atan2(targets[i][0] - P.pos.x, -(targets[i][1] - P.pos.z)), html: '◆', cls: 'mk', color: '#7dffc0' }); });
  if (S.orbs >= 3 && !S.finale) items.push({ k: 'sh', a: Math.atan2(W.shrine.x - P.pos.x, -(W.shrine.z - P.pos.z)), html: '★', cls: 'mk', color: '#ffe08a' });
  let html = '';
  for (const it of items) {
    const rel = wrapA(it.a - fwd);
    if (Math.abs(rel) > Math.PI * 0.5) continue;
    html += `<span class="${it.cls}" style="left:${(w / 2 + rel / (Math.PI * 0.5) * (w / 2)).toFixed(1)}px${it.color ? ';color:' + it.color : ''}">${it.html}</span>`;
  }
  cmp.innerHTML = html;
}

// ───────────────────────────── 소리 (전부 합성)
const AU = { ctx: null, master: null };
function audioInit() {
  if (AU.ctx) return;
  try {
    AU.ctx = new AudioContext(); AU.master = AU.ctx.createGain(); AU.master.gain.value = 0.55; AU.master.connect(AU.ctx.destination);
    const c = AU.ctx, len = c.sampleRate * 3, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const g = c.createGain(); g.gain.value = 0.05;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 0.035; lfo.connect(lg).connect(g.gain); lfo.start();
    src.connect(lp).connect(g).connect(AU.master); src.start();
  } catch (e) { AU.ctx = null; }
}
function tone(freq, dur, type = 'sine', vol = 0.3, when = 0) {
  const c = AU.ctx; if (!c) return;
  const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(AU.master); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  pick: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.35, 'triangle', 0.22, i * 0.07)),
  solve: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'triangle', 0.22, i * 0.13)),
  fanfare: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i === 6 ? 1.2 : 0.35, 'triangle', 0.24, i * 0.15)),
  wrong: () => { tone(196, 0.35, 'sawtooth', 0.12); tone(147, 0.45, 'sawtooth', 0.1, 0.1); },
  jump: () => tone(380, 0.12, 'sine', 0.07),
  land: () => tone(110, 0.1, 'sine', 0.12),
  thud: () => tone(95, 0.2, 'square', 0.1),
  tap: f => { tone(f, 1.1, 'sine', 0.3); tone(f * 2.01, 0.6, 'sine', 0.08); tone(f * 3.02, 0.3, 'sine', 0.04); },
  splash: () => { tone(300, 0.25, 'triangle', 0.1); tone(180, 0.35, 'sine', 0.1, 0.05); },
};

// ───────────────────────────── 조작
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const keys = new Set();
function syncKeys() {
  input.x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  input.z = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight') || runToggle;
}
let runToggle = false;
addEventListener('keydown', e => {
  if (!S.started) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!e.repeat) { if (e.code === 'Space') input.jumpPressed = true; if (e.code === 'KeyE' || e.code === 'KeyF') input.actPressed = true; }
  keys.add(e.code); syncKeys();
});
addEventListener('keyup', e => { keys.delete(e.code); syncKeys(); });
addEventListener('blur', () => { keys.clear(); syncKeys(); });

const cv = renderer.domElement;
const drags = new Map();
cv.addEventListener('pointerdown', e => { window.focus(); drags.set(e.pointerId, { x: e.clientX, y: e.clientY }); cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => {
  const d = drags.get(e.pointerId); if (!d) return;
  const k = e.pointerType === 'touch' ? 0.007 : 0.005;
  cam.yaw -= (e.clientX - d.x) * k; cam.pitch += (e.clientY - d.y) * k * 0.8;
  d.x = e.clientX; d.y = e.clientY;
});
const endDrag = e => drags.delete(e.pointerId);
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
cv.addEventListener('wheel', e => { cam.dist *= Math.exp(e.deltaY * 0.001); e.preventDefault(); }, { passive: false });

function setupTouch() {
  $('touch').hidden = false;
  $('keys').innerHTML = '왼쪽 원 = 이동 · 화면 끌기 = 시점 · 행동/점프 단추';
  const joy = $('joy'), knob = joy.querySelector('i');
  let jid = null, ox = 0, oy = 0;
  joy.addEventListener('pointerdown', e => { jid = e.pointerId; const r = joy.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; joy.setPointerCapture(jid); move(e); });
  const move = e => {
    if (e.pointerId !== jid) return;
    let dx = e.clientX - ox, dy = e.clientY - oy; const d = Math.hypot(dx, dy), mx = 52;
    if (d > mx) { dx = dx / d * mx; dy = dy / d * mx; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    input.x = dx / mx; input.z = -dy / mx;
    input.sprint = runToggle || d > mx * 1.6;
  };
  joy.addEventListener('pointermove', move);
  const end = e => { if (e.pointerId !== jid) return; jid = null; knob.style.transform = ''; input.x = input.z = 0; input.sprint = runToggle; };
  joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
  $('bJump').addEventListener('pointerdown', e => { e.preventDefault(); input.jumpPressed = true; });
  $('bAct').addEventListener('pointerdown', e => { e.preventDefault(); input.actPressed = true; });
  $('bRun').addEventListener('pointerdown', e => { e.preventDefault(); runToggle = !runToggle; input.sprint = runToggle; $('bRun').classList.toggle('on', runToggle); });
}

// ───────────────────────────── 시작
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (S.started) { step(dt); updateHUD(dt); }
  else { cam.yaw += dt * 0.08; updateCamera(dt); }
  const t = clock.elapsedTime;
  updateWater(t);
  if (W.flame) { W.flame.scale.y = 1 + Math.sin(t * 17) * 0.15 + Math.sin(t * 7.3) * 0.1; W.flame.rotation.y = t * 2; W.fireLight.intensity = 5.5 + Math.sin(t * 13) * 0.8; }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

async function main() {
  await loadAll(p => { $('loadbar').firstElementChild.style.width = (p * 100).toFixed(0) + '%'; });
  buildWorld();
  if (TEST === 'sim') return runSim();
  if (SHOT) return shotMode(SHOT);
  const btn = $('startBtn'); btn.disabled = false; btn.textContent = '시작하기';
  $('loadbar').hidden = true;
  if (IS_TOUCH) setupTouch();
  btn.onclick = () => {
    window.focus();   // 사이트의 /play/ iframe 안에서 키가 부모로 새지 않게
    audioInit();
    $('title').hidden = true; $('quest').hidden = false; $('compass').hidden = false;
    S.started = true; clock.getDelta();
    toast('표지판을 읽어 보자. (<b>' + (IS_TOUCH ? '행동' : 'E') + '</b>)', 4);
  };
  loop();
}

// ───────────────────────────── 화면 확인용 구도
function shotMode(name) {
  const hud = QS.get('hud') !== '0';
  $('title').hidden = true; $('quest').hidden = !hud; $('compass').hidden = !hud;
  S.started = true;
  const presets = {
    spawn: () => {},
    west: () => { P.pos.set(WEST.x + 13, W.westLevel, WEST.z - 1); cam.yaw = Math.PI / 2 - 0.25; cam.pitch = 0.42; cam.dist = 13; },
    east: () => { const p = W.pillars[1]; P.pos.set(p.x, p.top, p.z); cam.yaw = -Math.PI / 2 + 0.6; cam.pitch = 0.3; cam.dist = 11; },
    north: () => { P.pos.set(NORTH.x, W.northLevel, NORTH.z + 5); cam.yaw = 0; cam.pitch = 0.3; cam.dist = 11; },
    shrine: () => { P.pos.set(W.shrine.x, W.shrineLevel, W.shrine.z + 4); cam.yaw = 0.2; cam.pitch = 0.35; cam.dist = 12; },
    cover: () => { const p = W.pillars[2]; P.pos.set(p.x, p.top, p.z); P.heading = Math.PI / 2; cam.yaw = -Math.PI / 2 - 0.75; cam.pitch = 0.32; cam.dist = 9; },
    carry: () => { S.carrying = true; W.boxCol.off = true; P.pos.set(W.box.x - 2, W.westLevel, W.box.z); cam.yaw = Math.PI / 2 + 0.9; cam.pitch = 0.25; cam.dist = 6; },
    aerial: () => {},
  };
  (presets[name] || presets.spawn)();
  P.lastSafe.copy(P.pos);
  cam.target.set(P.pos.x, P.pos.y + 1.3, P.pos.z);
  for (let i = 0; i < 40; i++) { step(1 / 60); updateHUD(1 / 60); }
  if (name === 'aerial') { camera.position.set(40, 120, 110); camera.lookAt(0, 0, -5); }
  updateWater(1.3);
  renderer.render(scene, camera);
  window.__ready = true;
}

// ───────────────────────────── 자가검증 (?test=sim)
function runSim() {
  const R = [];
  const ok = (name, cond, info = '') => R.push({ name, pass: !!cond, info });
  const H = 1 / 60;
  S.started = true;
  const stepN = (sec, inp = {}) => {
    const n = Math.max(1, Math.round(sec / H));
    for (let i = 0; i < n; i++) {
      Object.assign(input, { x: 0, z: 0, sprint: false }, inp);
      if (i > 0) { input.jumpPressed = false; input.actPressed = false; }
      step(H);
    }
    Object.assign(input, { x: 0, z: 0, sprint: false, jumpPressed: false, actPressed: false });
  };
  const faceFwd = (tx, tz) => { const dx = tx - P.pos.x, dz = tz - P.pos.z; cam.yaw = Math.atan2(-dx, -dz); };
  const walkTo = (tx, tz, maxSec = 6, sprint = false) => {
    for (let i = 0; i < maxSec / H; i++) {
      if (Math.hypot(tx - P.pos.x, tz - P.pos.z) < 0.35) break;
      faceFwd(tx, tz); stepN(H, { z: 1, sprint });
    }
    return Math.hypot(tx - P.pos.x, tz - P.pos.z);
  };
  const tp = (x, z, y) => { P.pos.set(x, y ?? groundAt(x, z, 999), z); P.vy = 0; P.onGround = true; cam.target.set(x, P.pos.y + 1.3, z); stepN(0.2); };
  const inWestInterior = () => Math.abs(P.pos.x - WEST.x) < 4 && Math.abs(P.pos.z - WEST.z) < 4;

  try {
    ok('모델 전부 불러옴', Object.keys(models).length === MODEL_KEYS.length, `${Object.keys(models).length}/${MODEL_KEYS.length}`);
    ok('캐릭터 동작 준비', ['idle', 'walk', 'sprint', 'jump', 'fall', 'pick-up', 'hold_arms', 'walk_legs'].every(k => A.acts[k]), Object.keys(A.acts).join(','));
    ok('퍼즐 구역이 물 위', [W.westLevel, W.northLevel, W.shrineLevel].every(l => l > 1.2), [W.westLevel, W.northLevel, W.shrineLevel].map(v => v.toFixed(2)).join(' / '));
    ok('시작 지점이 물 위', terrainAt(W.spawn.x, W.spawn.z) > 0.6, terrainAt(W.spawn.x, W.spawn.z).toFixed(2));
    ok('동쪽 기둥 6개가 바다 위', W.pillars.length === 6 && W.pillars.slice(1).every(p => terrainAt(p.x, p.z) < SEA - 0.95), W.pillars.map(p => terrainAt(p.x, p.z).toFixed(1)).join(','));

    stepN(1);
    ok('시작하면 땅에 선다', P.onGround && Math.abs(P.pos.y - terrainAt(P.pos.x, P.pos.z)) < 0.05, `y=${P.pos.y.toFixed(2)}`);

    const a = P.pos.clone(); faceFwd(SHRINE.x, SHRINE.z); stepN(1, { z: 1 });
    const walked = Math.hypot(P.pos.x - a.x, P.pos.z - a.z);
    const dirOk = Math.hypot(SHRINE.x - P.pos.x, SHRINE.z - P.pos.z) < Math.hypot(SHRINE.x - a.x, SHRINE.z - a.z) - 3;
    ok('W 누르면 카메라가 보는 쪽으로 걷는다', walked > 4 && dirOk, `${walked.toFixed(2)}m`);
    const camFwd = new THREE.Vector3(); camera.getWorldDirection(camFwd);
    const mv = new THREE.Vector3(P.pos.x - a.x, 0, P.pos.z - a.z).normalize();
    ok('카메라 시선과 이동 방향 일치', camFwd.setY(0).normalize().dot(mv) > 0.9, camFwd.dot(mv).toFixed(2));

    const tree = circles.find(c => c.top - c.bottom > 6 && Math.abs(terrainAt(c.x + 3, c.z) - terrainAt(c.x, c.z)) < 0.5);
    tp(tree.x + 3, tree.z); walkTo(tree.x, tree.z, 2);
    ok('나무를 뚫고 지나가지 못한다', Math.hypot(P.pos.x - tree.x, P.pos.z - tree.z) >= tree.r + PR - 0.05, Math.hypot(P.pos.x - tree.x, P.pos.z - tree.z).toFixed(2));

    tp(W.spawn.x, W.spawn.z); const y0 = P.pos.y; let apex = y0;
    input.jumpPressed = true;
    for (let i = 0; i < 90; i++) { step(H); apex = Math.max(apex, P.pos.y); }
    ok('점프 높이 1.6~2.0', apex - y0 > 1.6 && apex - y0 < 2.0 && P.onGround, (apex - y0).toFixed(2));

    // 서쪽
    tp(WEST.x + 9, WEST.z - 2); walkTo(WEST.x, WEST.z - 2, 4);
    ok('닫힌 문은 못 지나간다', !inWestInterior(), `x=${(P.pos.x - WEST.x).toFixed(2)}`);
    tp(WEST.x - 10, WEST.z); walkTo(WEST.x, WEST.z, 4);
    ok('돌담은 못 지나간다', !inWestInterior());
    tp(W.plate.x, W.plate.z); stepN(2);
    ok('사람이 올라서도 문은 안 열린다', !S.gateOpen && S.plateHintShown);
    ok('발판 위에 설 수 있다', Math.abs(P.pos.y - (W.westLevel + 0.12)) < 0.05, P.pos.y.toFixed(2));

    // 상자를 돌담 옆에 두고 밟고 뛰어도 못 넘는다
    const home = { ...W.box.home };
    Object.assign(W.box.home, { x: WEST.x, z: WEST.z - 8.6 }); resetBox();
    tp(WEST.x, WEST.z - 8.6, W.westLevel + 0.9);
    ok('상자 위에 올라설 수 있다', Math.abs(P.pos.y - (W.westLevel + 0.9)) < 0.05, P.pos.y.toFixed(2));
    for (let k = 0; k < 3; k++) { faceFwd(WEST.x, WEST.z); stepN(1.2, { z: 1, jumpPressed: true }); }
    ok('상자 밟고 뛰어도 돌담을 못 넘는다', !inWestInterior(), `z=${(P.pos.z - WEST.z).toFixed(2)} y=${P.pos.y.toFixed(2)}`);
    Object.assign(W.box.home, home); resetBox();

    tp(W.box.x + 1.6, W.box.z); faceFwd(W.box.x, W.box.z); stepN(0.1);
    ok('상자 앞에서 "상자 들기"가 뜬다', nearest?.label === '상자 들기', `${nearest?.label} p=${P.pos.x.toFixed(1)},${P.pos.y.toFixed(2)},${P.pos.z.toFixed(1)} box=${W.box.x.toFixed(1)},${W.box.y.toFixed(2)},${W.box.z.toFixed(1)} d=${Math.hypot(W.box.x-P.pos.x,W.box.z-P.pos.z).toFixed(2)} carry=${S.carrying}`);
    stepN(H, { actPressed: true });
    ok('상자를 든다', S.carrying && W.boxCol.off);
    stepN(0.2, { jumpPressed: true });
    ok('상자를 든 채로는 점프하지 않는다', P.onGround);
    walkTo(W.plate.x + 2.2, W.plate.z, 8);
    faceFwd(W.plate.x, W.plate.z); stepN(0.12, { z: 0.3 });
    stepN(H, { actPressed: true });
    ok('발판 위에 상자를 내려놓는다', !S.carrying && boxOnPlate(), `box ${(W.box.x - W.plate.x).toFixed(2)},${(W.box.z - W.plate.z).toFixed(2)} y=${W.box.y.toFixed(2)}`);
    stepN(2.2);
    ok('문이 가라앉는다', S.gateOpen && S.gateOff <= -3.7, S.gateOff.toFixed(2));
    walkTo(WEST.x + 10, WEST.z - 2, 6); walkTo(WEST.x + 2, WEST.z - 2, 6); walkTo(WEST.x, WEST.z, 3);
    ok('열린 문으로 들어가 옥구슬 1', S.orbs === 1 && W.orbs[0].taken, `orbs=${S.orbs} in=${inWestInterior()}`);

    // 바다 빠짐 → 마지막 안전 지점
    tp(W.shoreX - 3, EZ); stepN(1);
    const safe = P.lastSafe.clone();
    tp(W.pillars[2].x, EZ + 5); stepN(1.2);
    ok('바다에 빠지면 마지막 안전 지점으로', S.respawns === 1 && P.pos.distanceTo(safe) < 0.5 && P.onGround, `respawns=${S.respawns} d=${P.pos.distanceTo(safe).toFixed(2)}`);

    // 동쪽 기둥을 실제 점프로 오른다
    tp(W.shoreX - 0.3, EZ);
    let hopOk = true, hopInfo = '';
    for (const [i, p] of W.pillars.entries()) {
      faceFwd(p.x, p.z);
      let air = false;
      for (let k = 0; k < 150; k++) {
        faceFwd(p.x, p.z);
        stepN(H, { z: 1, jumpPressed: k === 0 });
        if (!P.onGround) air = true;
        if (air && P.onGround) break;
      }
      walkTo(p.x, p.z, 1);
      const on = Math.abs(P.pos.y - p.top) < 0.05;
      if (!on) { hopOk = false; hopInfo = `기둥 ${i + 1}에서 실패 y=${P.pos.y.toFixed(2)} top=${p.top.toFixed(2)}`; break; }
    }
    ok('걷기+점프로 기둥 6개를 오른다', hopOk, hopInfo || `${W.pillars.length}개`);
    stepN(0.5);
    ok('기둥 꼭대기 옥구슬 2', S.orbs === 2, `orbs=${S.orbs}`);
    // 달리기 점프도 한 칸은 넘을 수 있어야 한다 (가장자리에서)
    const p1 = W.pillars[0], p2 = W.pillars[1];
    tp(p1.x + p1.half - 0.45, EZ, p1.top); faceFwd(p2.x, EZ);
    { let air = false; for (let k = 0; k < 150; k++) { stepN(H, { z: 1, sprint: true, jumpPressed: k === 0 }); if (!P.onGround) air = true; if (air && P.onGround) break; } }
    ok('달리기 점프(가장자리)로도 다음 기둥에 선다', Math.abs(P.pos.y - p2.top) < 0.05, `y=${P.pos.y.toFixed(2)} top=${p2.top.toFixed(2)}`);

    // 북쪽
    const byRank = r => W.obelisks.find(o => o.rank === r);
    const strike = ob => { tp(ob.x, ob.z + 1.7); stepN(0.05); const lbl = nearest?.label; stepN(H, { actPressed: true }); stepN(0.5); return lbl; };
    strike(byRank(2));
    ok('틀린 순서면 처음부터', S.obProg === 0 && S.obWrong === 1);
    for (const r of [1, 2, 3, 4]) strike(byRank(r));
    ok('낮은 것부터 두드리면 풀린다', S.obSolved);
    ok('각 돌기둥 높이가 순서대로 다르다', [1, 2, 3].every(r => byRank(r + 1).h - byRank(r).h > 0.5));
    stepN(2.6);
    ok('유적 가운데 구슬이 떠오른다', W.orbs[2].active && W.orbs[2].grp.visible);
    tp(NORTH.x, NORTH.z + 2); walkTo(NORTH.x, NORTH.z, 3); stepN(0.3);
    ok('옥구슬 3', S.orbs === 3, `orbs=${S.orbs}`);

    // 제단
    tp(W.shrine.x, W.shrine.z + 1); stepN(0.05);
    ok('제단 앞에서 "옥구슬 바치기"', nearest?.label === '옥구슬 바치기', nearest?.label);
    stepN(H, { actPressed: true }); stepN(7);
    ok('상자가 열리고 끝난다', S.cleared && W.chest.visible && Math.abs(W.chest.position.y - W.shrineLevel) < 0.05);

    // 카메라가 땅속으로 안 들어간다
    let under = 0;
    const RR = rng(5);
    for (let i = 0; i < 300; i++) {
      const x = (RR() - 0.5) * 100, z = (RR() - 0.5) * 100; P.pos.set(x, Math.max(terrainAt(x, z), SEA), z);
      cam.yaw = RR() * 6.28; cam.pitch = RR() * 1.3; cam.target.set(x, P.pos.y + 1.3, z); updateCamera(1);
      if (camera.position.y < terrainAt(camera.position.x, camera.position.z) + 0.3) under++;
    }
    ok('카메라가 땅속에 안 들어간다(300회)', under === 0, `${under}회`);

    renderer.render(scene, camera);
    ok('그리기 호출 수 적정', renderer.info.render.calls < 700, `calls=${renderer.info.render.calls} tris=${renderer.info.render.triangles}`);
  } catch (e) {
    ok('예외 없이 끝까지', false, e.stack);
  }
  ok('자바스크립트 오류 없음', window.__errs.length === 0, window.__errs.join(' | '));

  const pass = R.filter(r => r.pass).length;
  const out = [`${pass === R.length ? 'SIM PASS' : 'SIM FAIL'} ${pass}/${R.length}`, ...R.map(r => `${r.pass ? '✅' : '⛔'} ${r.name}${r.info ? '  — ' + r.info : ''}`)].join('\n');
  const el = $('simout'); el.textContent = out; el.style.display = 'block';
  document.title = `${pass === R.length ? 'SIM PASS' : 'SIM FAIL'} ${pass}/${R.length}`;
  window.__simDone = true;
}

main().catch(e => { window.__errs.push('main: ' + (e.stack || e)); document.title = 'SIM FAIL (load)'; $('simout').textContent = String(e.stack || e); $('simout').style.display = 'block'; });
