// 격자 후보의 도달성 검사 — 금고에 넣기 전에 여기서 먼저 본다
export function check(name, grid){
  const H=grid.length, W=grid[0].length;
  const wall=new Set(); let S=null,G=null;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const c=grid[y][x];
    if(c==='#')wall.add(y*W+x); else if(c==='S')S={x,y}; else if(c==='V')G={x,y};
  }
  if(!S||!G) return `${name}: 입구/금고 없음`;
  const dist=new Int32Array(W*H).fill(-1); const q=[G.y*W+G.x]; dist[G.y*W+G.x]=0;
  while(q.length){const c=q.shift(),cy=(c/W)|0,cx=c%W;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy,n=ny*W+nx;
      if(nx<0||ny<0||nx>=W||ny>=H||wall.has(n)||dist[n]>=0)continue; dist[n]=dist[c]+1; q.push(n);}}
  const d=dist[S.y*W+S.x];
  const widths=new Set(grid.map(r=>r.length));
  const border = grid[0].split('').every(c=>c==='#') && grid[H-1].split('').every(c=>c==='#')
    && grid.every(r=>r[0]==='#'&&r[r.length-1]==='#');
  return `${name}: 경로 ${d<0?'❌없음':'✅'+d+'칸'} · 폭 ${[...widths]} · 테두리 ${border?'✅':'❌'}`;
}
