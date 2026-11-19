/* ⚠️★이 파일은 한때 `/tmp` 에 있었고 `tune.py` 가 절대경로로 불러 썼다.
   임시 폴더는 비워지므로 **어느 날 조용히 난이도 측정이 통째로 깨질** 자리였다.
   생성기는 산출물(`vaults.js`)의 진짜 원본이다 — 저장소 안에 둔다. */
import { check } from './checkgrid.mjs';
/* 나선 금고 생성 — 손으로 그리면 고리마다 연결이 끊긴다(실제로 그랬다).
   바깥에서 안으로 도는 길 하나를 만들고, 그 길 위에 장치를 얹는다. */
export function spiral(W,H){
  const g=Array.from({length:H},()=>Array(W).fill('#'));
  let top=1,bot=H-2,left=1,right=W-2;
  const path=[];
  while(top<=bot&&left<=right){
    for(let x=left;x<=right;x++)path.push([x,top]);
    for(let y=top+1;y<=bot;y++)path.push([right,y]);
    if(top<bot)for(let x=right-1;x>=left;x--)path.push([x,bot]);
    if(left<right)for(let y=bot-1;y>=top+1;y--)path.push([left,y]);
    top+=2;bot-=2;left+=2;right-=2;
  }
  for(const[x,y]of path)g[y][x]='.';
  /* 고리와 고리 사이를 잇는다.
     ⚠️함정 둘을 실측으로 밟았다.
       ① (left, top+1) 에 뚫기 — 그 칸은 이미 바깥 고리의 길이라 아무것도 안 이어진다.
       ② (left+2, top+1) 에 뚫기 — 이어지긴 하는데 **구멍이 전부 같은 모서리**라
          입구에서 금고까지 계단처럼 **13칸 지름길**이 생겼다. 나선을 통째로 건너뛴다.
     → 구멍을 고리의 **반대쪽 끝**(오른아래)에 낸다. 그러면 각 고리를 4분의 3쯤 돌아야
       다음 구멍에 닿는다. 긴 길이 이 게임의 전제다 — 짧으면 장치가 반응할 틈이 없다. */
  const links=[];
  let t=1,b=H-2,l=1,r=W-2;
  while(t+2<=b-2&&l+2<=r-2){
    g[b-1][r-2]='.'; links.push([r-2,b-1]);
    t+=2;b-=2;l+=2;r-=2;
  }
  return {g,path,links};
}
export function route(g){
  const H=g.length,W=g[0].length; const wall=new Set(); let S,G;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=g[y][x];
    if(c==='#')wall.add(y*W+x); else if(c==='S')S={x,y}; else if(c==='V')G={x,y};}
  const dist=new Int32Array(W*H).fill(-1); const q=[G.y*W+G.x]; dist[G.y*W+G.x]=0;
  while(q.length){const c=q.shift(),cy=(c/W)|0,cx=c%W;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy,n=ny*W+nx;
      if(nx<0||ny<0||nx>=W||ny>=H||wall.has(n)||dist[n]>=0)continue;dist[n]=dist[c]+1;q.push(n);}}
  if(dist[S.y*W+S.x]<0)return null;
  const out=[];let cur={...S};
  for(let i=0;i<W*H;i++){out.push({...cur});
    if(cur.x===G.x&&cur.y===G.y)break;
    let best=null,bd=dist[cur.y*W+cur.x];
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cur.x+dx,ny=cur.y+dy,n=ny*W+nx;
      if(nx<0||ny<0||nx>=W||ny>=H||wall.has(n))continue;
      if(dist[n]>=0&&dist[n]<bd){bd=dist[n];best={x:nx,y:ny};}}
    if(!best)break;cur=best;}
  return out;
}
/* ⚠️장치는 **실제로 도둑이 지나는 길(BFS 경로)** 위에 놓는다.
   처음엔 나선 생성 순서(path)의 비율로 놓았는데, 최단 경로는 그 반대 방향으로 돌아서
   장치가 아무도 안 지나는 자리에 박혔다. 경로를 먼저 구하고 그 위에 얹는다. */
export function build(W,H,devs){
  const {g}=spiral(W,H);
  // 입구·금고: 나선의 바깥 시작과 가장 안쪽
  g[1][1]='S';
  let inner=null;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++) if(g[y][x]==='.'){
    const d=Math.min(x,y,W-1-x,H-1-y); if(!inner||d>inner.d) inner={x,y,d};
  }
  g[inner.y][inner.x]='V';
  const r=route(g); if(!r) return null;
  const slots=r.slice(4,r.length-2);
  for(const[ch,frac]of devs){
    const i=Math.min(slots.length-1,Math.max(0,Math.round(slots.length*frac)));
    for(let k=0;k<slots.length;k++){const j=(i+k)%slots.length,{x,y}=slots[j];
      if(g[y][x]==='.'){g[y][x]=ch;break;}}
  }
  return g.map(q=>q.join(''));
}

/* ══ 배치 유형 ═══════════════════════════════════════════════════════════
 * ⚠️★나선 하나로 30개를 찍으면 설계서 §1-2 가 지목한 그 불만("맵이 적어서 1~2판이면
 *   볼 것을 다 본다")에 정확히 걸린다. **길의 모양이 곧 맵의 정체성**이므로
 *   유형을 넷 둔다. 전부 '한 줄기 긴 길'이라 장치가 반응할 틈이 생긴다는 전제는 공유한다. */

/** 뱀길 — 가로 복도가 좌우 번갈아 이어진다. 길이 길고 되돌아오는 맛이 있다. */
export function serpentine(W, H, step = 2) {
  const g = Array.from({ length: H }, () => Array(W).fill('#'));
  const rows = [];
  for (let y = 1; y <= H - 2; y += step) { rows.push(y); for (let x = 1; x <= W - 2; x++) g[y][x] = '.'; }
  rows.forEach((y, i) => {
    if (i >= rows.length - 1) return;
    const x = i % 2 === 0 ? W - 2 : 1;
    for (let k = 1; k < step; k++) g[y + k][x] = '.';   // 간격이 넓으면 잇는 칸도 여럿이다
  });
  return g;
}

/** 빗살 — 세로 복도. 같은 규칙인데 9:16 이 아닌 화면에서 인상이 확 다르다. */
export function comb(W, H, step = 2) {
  const g = Array.from({ length: H }, () => Array(W).fill('#'));
  const cols = [];
  for (let x = 1; x <= W - 2; x += step) { cols.push(x); for (let y = 1; y <= H - 2; y++) g[y][x] = '.'; }
  cols.forEach((x, i) => {
    if (i >= cols.length - 1) return;
    const y = i % 2 === 0 ? H - 2 : 1;
    for (let k = 1; k < step; k++) g[y][x + k] = '.';
  });
  return g;
}

/** 방 — 넓은 칸 여럿을 문 하나씩으로 잇는다. 복도와 달리 **장치 범위가 겹칠 자리**가 생긴다.
 * ⚠️★처음엔 문을 '위아래 어긋나게' 고정 위치에 냈는데, **방을 늘릴수록 경로가 짧아졌다**
 *   (3×2 에서 18칸 → 4×3 에서 12칸). 문이 어긋나 방이 통째로 끊겼고, 그래서 `make` 가
 *   도달 가능한 좁은 영역 안에서만 '가장 먼 칸'을 골랐던 것이다.
 *   → 방을 **신장 트리로 잇는다.** 트리라 임의의 두 방 사이 길이 하나뿐이고, 연결이 보장된다. */
export function rooms(W, H, cols = 3, rowsN = 2, seed = 7) {
  const g = Array.from({ length: H }, () => Array(W).fill('#'));
  for (let y = 1; y <= H - 2; y++) for (let x = 1; x <= W - 2; x++) g[y][x] = '.';
  const vx = [], hy = [];
  for (let i = 1; i < cols; i++) { const x = Math.round(i * (W - 1) / cols); vx.push(x); for (let y = 1; y <= H - 2; y++) g[y][x] = '#'; }
  for (let j = 1; j < rowsN; j++) { const y = Math.round(j * (H - 1) / rowsN); hy.push(y); for (let x = 1; x <= W - 2; x++) g[x !== undefined ? y : y][x] = '#'; }
  for (const y of hy) for (let x = 1; x <= W - 2; x++) g[y][x] = '#';

  // 방 i 의 내부 범위
  const xEdge = [0, ...vx, W - 1], yEdge = [0, ...hy, H - 1];
  const rid = (c, r) => r * cols + c;
  // 결정적 난수 — 같은 설정이면 같은 금고가 나와야 측정이 재현된다
  let st = seed >>> 0;
  const rnd = () => (st = (Math.imul(st, 1664525) + 1013904223) >>> 0) / 4294967296;

  const seen = new Set([0]), stack = [0];
  while (stack.length) {
    const cur = stack[stack.length - 1], c = cur % cols, r = (cur / cols) | 0;
    const nb = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]]
      .filter(([a, b]) => a >= 0 && b >= 0 && a < cols && b < rowsN && !seen.has(rid(a, b)));
    if (!nb.length) { stack.pop(); continue; }
    const [nc, nr] = nb[Math.floor(rnd() * nb.length)];
    // 두 방 사이 벽에 문 한 칸
    if (nc !== c) {
      const wallX = vx[Math.min(c, nc)];
      const lo = yEdge[r] + 1, hi = yEdge[r + 1] - 1;
      g[lo + Math.floor(rnd() * (hi - lo + 1))][wallX] = '.';
    } else {
      const wallY = hy[Math.min(r, nr)];
      const lo = xEdge[c] + 1, hi = xEdge[c + 1] - 1;
      g[wallY][lo + Math.floor(rnd() * (hi - lo + 1))] = '.';
    }
    seen.add(rid(nc, nr)); stack.push(rid(nc, nr));
  }
  return g;
}

export const LAYOUTS = {
  spiral: (W, H) => spiral(W, H).g,
  serpentine: (W, H, a) => serpentine(W, H, a || 2),
  comb: (W, H, a) => comb(W, H, a || 2),
  rooms: (W, H, a, b, c) => rooms(W, H, a || 3, b || 2, c || 7),
};

/** 배치 유형 무관 조립. ⚠️입구·금고는 **가장 먼 두 칸**으로 잡는다 —
 *  유형마다 '안쪽'의 뜻이 달라서 나선 전용 규칙(가장 안쪽 고리)을 그대로 쓸 수 없다. */
export function make(kind, W, H, devs, opt = {}) {
  const g = (LAYOUTS[kind] || LAYOUTS.spiral)(W, H, opt.a, opt.b, opt.seed);
  const floor = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === '.') floor.push({ x, y });
  if (!floor.length) return null;
  const S = floor[0];
  const dist = bfsFrom(g, S, W, H);
  let far = S, fd = -1;
  for (const c of floor) { const d = dist[c.y * W + c.x]; if (d > fd) { fd = d; far = c; } }
  g[S.y][S.x] = 'S'; g[far.y][far.x] = 'V';
  const r = route(g);
  if (!r) return null;
  const slots = r.slice(3, r.length - 2);
  /* ⚠️★★위치를 **경로의 비율**로만 주면 맵 길이에 따라 뜻이 달라진다.
     `[['K',.22],['D',.25]]` 은 45칸 맵에서 1칸 차이(개가 문 옆)지만 **142칸 맵에서는 4칸**이라
     개가 문에서 멀찍이 서고, 그러면 '멈춰 세워 물리게 한다'는 장치 조합 자체가 성립하지 않는다.
     실측으로 이걸 밟았다: 비전기 금고 셋이 장치를 8개까지 넣어도 **6/6 전부 통과**였다.
     → 1 이상의 값은 **'앞 장치로부터 N칸 뒤'** 라는 절대 거리로 읽는다. 짝은 이걸로 묶는다. */
  let prev = -1;
  for (const [ch, at] of devs) {
    const i = at >= 1
      ? Math.min(slots.length - 1, prev + Math.round(at))
      : Math.min(slots.length - 1, Math.max(0, Math.round(slots.length * at)));
    let put = -1;
    for (let k = 0; k < slots.length; k++) {
      const j = (i + k) % slots.length, { x, y } = slots[j];
      if (g[y][x] === '.') { g[y][x] = ch; put = j; break; }
    }
    if (put >= 0) prev = put;
  }
  return { grid: g.map(q => q.join('')), path: r.length };
}

function bfsFrom(g, S, W, H) {
  const dist = new Int32Array(W * H).fill(-1), q = [S.y * W + S.x];
  dist[S.y * W + S.x] = 0;
  while (q.length) {
    const c = q.shift(), cy = (c / W) | 0, cx = c % W;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx + dx, ny = cy + dy, n = ny * W + nx;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || g[ny][nx] === '#' || dist[n] >= 0) continue;
      dist[n] = dist[c] + 1; q.push(n);
    }
  }
  return dist;
}
