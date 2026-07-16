'use strict';

/* ============================================================
   FRUIT BLOCKS · 과일블럭게임  (AI-built indie game, July 2026)
   - 캔디크러시류 매치3 퍼즐: 8x8 보드, 과일 6종
   - 스페셜 블록: 줄폭탄(4매치) · 폭탄(L/T매치) · 레인보우(5매치)
   - 과즙 파티클·화면 흔들림·콤보 연출, WebAudio 합성 효과음+BGM
   - 레벨 무한 진행(목표점수·이동수 난이도 상승) · 등급 칭호
   - 기록: localStorage 닉네임 Top10 + 세이브 내보내기/불러오기
   ============================================================ */

window.onerror = function (msg, src, line) {
  var e = document.getElementById('err');
  if (e) { e.style.display = 'block'; e.textContent = 'Error: ' + msg + ' (line ' + line + ')'; }
};

/* ===== 다국어 ===== */
const I18N = {
  en: {
    sub: 'JUICY MATCH-3', start: '🍉 Start Game', records: '🏆 Records', back: '← Back',
    retry: '🔄 Play Again', menu: 'Menu', nickPh: 'Nickname',
    help: '<b>Tap / click</b> a fruit, then an adjacent one — or <b>drag</b> to swap.<br>Match <b>3+</b> to burst · <b>4</b> in a row → line blast · <b>L/T</b> → bomb · <b>5</b> → rainbow<br><b>ESC</b> Pause',
    credit: 'An indie game built 100% with AI · July 2026 · ',
    expSave: '💾 Export Save', impSave: '📂 Import Save',
    impConfirm: 'Overwrite your current records with this save file?',
    impErr: 'Not a valid Fruit Blocks save file', expDone: 'Save file downloaded',
    recNote: 'Rankings are stored in this browser. Export your save to move them to another computer.',
    resTitle: '🍒 Game Over', pauseTitle: '⏸ Paused', resume: '▶ Resume', quit: '🏳 Give Up',
    quitConfirm: 'Give up this run? Your score will be recorded.',
    colRank: '#', colName: 'NAME', colScore: 'SCORE', colLevel: 'LEVEL', colDate: 'DATE',
    emptyRec: 'No records yet — play a game!', myBest: 'Personal best',
    finalScore: 'Final score', reached: 'Reached', newRecord: '🎉 New personal best!',
    level: 'LEVEL', moves: 'MOVES', score: 'SCORE', target: 'TARGET',
    levelClear: 'LEVEL CLEAR!', gameOver: 'GAME OVER', shuffle: 'NO MOVES — SHUFFLE!',
    combo: 'COMBO', bonus: 'MOVE BONUS', getReady: 'LEVEL ',
    ranks: ['Seed', 'Sprout', 'Fruit Keeper', 'Orchard Expert', 'Fruit Master', 'Fruit Legend'],
  },
  ko: {
    sub: '과즙 팡팡 매치3', start: '🍉 게임 시작', records: '🏆 기록실', back: '← 뒤로',
    retry: '🔄 다시 도전', menu: '메뉴로', nickPh: '닉네임',
    help: '과일을 <b>탭/클릭</b>한 뒤 옆 과일을 누르거나 <b>드래그</b>해서 교환하세요.<br><b>3개</b> 이상 매치 → 팡! · <b>4개</b> 일렬 → 줄폭탄 · <b>L/T자</b> → 폭탄 · <b>5개</b> → 레인보우<br><b>ESC</b> 일시정지',
    credit: 'AI로 100% 제작한 인디게임 · 2026년 7월 · ',
    expSave: '💾 세이브 내보내기', impSave: '📂 세이브 불러오기',
    impConfirm: '이 세이브 파일로 현재 기록을 덮어쓸까요?',
    impErr: '올바른 과일블럭게임 세이브 파일이 아닙니다', expDone: '세이브 파일이 다운로드되었습니다',
    recNote: '랭킹은 이 브라우저에 저장됩니다. 다른 컴퓨터로 옮기려면 세이브를 내보내세요.',
    resTitle: '🍒 게임 오버', pauseTitle: '⏸ 일시정지', resume: '▶ 계속하기', quit: '🏳 포기하기',
    quitConfirm: '이번 판을 포기할까요? 점수는 기록됩니다.',
    colRank: '순위', colName: '닉네임', colScore: '점수', colLevel: '레벨', colDate: '날짜',
    emptyRec: '아직 기록이 없습니다 — 첫 게임을 해보세요!', myBest: '개인 최고기록',
    finalScore: '최종 점수', reached: '도달', newRecord: '🎉 개인 최고기록 갱신!',
    level: '레벨', moves: '이동', score: '점수', target: '목표',
    levelClear: '레벨 클리어!', gameOver: '게임 오버', shuffle: '이동 불가 — 섞는 중!',
    combo: '콤보', bonus: '이동수 보너스', getReady: '레벨 ',
    ranks: ['씨앗', '새싹', '열매지기', '과수원 달인', '과일 고수', '전설의 과일 마스터'],
  },
  ja: {
    sub: '果汁はじけるマッチ3', start: '🍉 ゲーム開始', records: '🏆 記録室', back: '← 戻る',
    retry: '🔄 もう一度', menu: 'メニューへ', nickPh: 'ニックネーム',
    help: 'フルーツを<b>タップ/クリック</b>して隣を選ぶか、<b>ドラッグ</b>で入れ替え。<br><b>3個</b>以上でパン！ · <b>4個</b>一列 → ラインボム · <b>L/T字</b> → ボム · <b>5個</b> → レインボー<br><b>ESC</b> 一時停止',
    credit: 'AIだけで作られたインディーゲーム · 2026年7月 · ',
    expSave: '💾 セーブを書き出す', impSave: '📂 セーブを読み込む',
    impConfirm: 'このセーブファイルで現在の記録を上書きしますか？',
    impErr: '正しいフルーツブロックのセーブファイルではありません', expDone: 'セーブファイルをダウンロードしました',
    recNote: 'ランキングはこのブラウザに保存されます。別のパソコンへはセーブの書き出しで移行できます。',
    resTitle: '🍒 ゲームオーバー', pauseTitle: '⏸ 一時停止', resume: '▶ つづける', quit: '🏳 ギブアップ',
    quitConfirm: 'このゲームをあきらめますか？スコアは記録されます。',
    colRank: '順位', colName: '名前', colScore: 'スコア', colLevel: 'レベル', colDate: '日付',
    emptyRec: 'まだ記録がありません — プレイしてみよう！', myBest: '自己ベスト',
    finalScore: '最終スコア', reached: '到達', newRecord: '🎉 自己ベスト更新！',
    level: 'レベル', moves: '手数', score: 'スコア', target: '目標',
    levelClear: 'レベルクリア！', gameOver: 'ゲームオーバー', shuffle: '手詰まり — シャッフル！',
    combo: 'コンボ', bonus: '手数ボーナス', getReady: 'レベル ',
    ranks: ['タネ', '新芽', '実の番人', '果樹園の達人', 'フルーツの名人', '伝説のフルーツマスター'],
  },
  es: {
    sub: 'MATCH-3 JUGOSO', start: '🍉 Empezar', records: '🏆 Récords', back: '← Atrás',
    retry: '🔄 Jugar otra vez', menu: 'Menú', nickPh: 'Apodo',
    help: '<b>Toca/clic</b> en una fruta y luego en una adyacente — o <b>arrastra</b> para intercambiar.<br>Une <b>3+</b> para explotar · <b>4</b> en línea → rayo · <b>L/T</b> → bomba · <b>5</b> → arcoíris<br><b>ESC</b> Pausa',
    credit: 'Un juego indie creado 100% con IA · Julio de 2026 · ',
    expSave: '💾 Exportar partida', impSave: '📂 Importar partida',
    impConfirm: '¿Sobrescribir tus récords actuales con esta partida?',
    impErr: 'No es un archivo de guardado válido de Fruit Blocks', expDone: 'Partida descargada',
    recNote: 'Los récords se guardan en este navegador. Exporta tu partida para llevarlos a otro ordenador.',
    resTitle: '🍒 Fin de la partida', pauseTitle: '⏸ Pausa', resume: '▶ Continuar', quit: '🏳 Rendirse',
    quitConfirm: '¿Rendirte? Tu puntuación quedará registrada.',
    colRank: '#', colName: 'NOMBRE', colScore: 'PUNTOS', colLevel: 'NIVEL', colDate: 'FECHA',
    emptyRec: 'Aún no hay récords — ¡juega una partida!', myBest: 'Mejor marca personal',
    finalScore: 'Puntuación final', reached: 'Alcanzado', newRecord: '🎉 ¡Nueva mejor marca!',
    level: 'NIVEL', moves: 'MOV.', score: 'PUNTOS', target: 'META',
    levelClear: '¡NIVEL SUPERADO!', gameOver: 'FIN DEL JUEGO', shuffle: '¡SIN JUGADAS — BARAJANDO!',
    combo: 'COMBO', bonus: 'BONO DE MOVIMIENTOS', getReady: 'NIVEL ',
    ranks: ['Semilla', 'Brote', 'Guardián frutal', 'Experto del huerto', 'Maestro frutal', 'Leyenda de la fruta'],
  },
  zh: {
    sub: '果汁四溅消消乐', start: '🍉 开始游戏', records: '🏆 记录室', back: '← 返回',
    retry: '🔄 再来一局', menu: '菜单', nickPh: '昵称',
    help: '<b>点击</b>一个水果再点相邻的，或<b>拖动</b>交换。<br>连成 <b>3个</b> 爆炸 · <b>4个</b>一排 → 直线炸弹 · <b>L/T形</b> → 炸弹 · <b>5个</b> → 彩虹<br><b>ESC</b> 暂停',
    credit: '100% 由 AI 制作的独立游戏 · 2026年7月 · ',
    expSave: '💾 导出存档', impSave: '📂 导入存档',
    impConfirm: '用此存档覆盖当前记录？',
    impErr: '不是有效的水果方块存档文件', expDone: '存档已下载',
    recNote: '排行榜保存在此浏览器中。导出存档即可迁移到其他电脑。',
    resTitle: '🍒 游戏结束', pauseTitle: '⏸ 暂停', resume: '▶ 继续', quit: '🏳 放弃',
    quitConfirm: '放弃本局？分数将被记录。',
    colRank: '#', colName: '昵称', colScore: '分数', colLevel: '关卡', colDate: '日期',
    emptyRec: '还没有记录——玩一局吧！', myBest: '个人最佳',
    finalScore: '最终得分', reached: '到达', newRecord: '🎉 刷新个人最佳！',
    level: '关卡', moves: '步数', score: '分数', target: '目标',
    levelClear: '过关！', gameOver: '游戏结束', shuffle: '无可消除——洗牌！',
    combo: '连击', bonus: '步数奖励', getReady: '关卡 ',
    ranks: ['种子', '新芽', '果实守护者', '果园达人', '水果高手', '传说水果大师'],
  },
};
let LANG = new URLSearchParams(location.search).get('lang');
if (!I18N[LANG]) LANG = (navigator.language || 'en').slice(0, 2);
if (!I18N[LANG]) LANG = 'en';
const L = I18N[LANG];

/* ===== 상수 ===== */
const NROW = 8, NCOL = 8;
const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍉', '🍑'];
const FCOLOR = ['#ff5252', '#ffa726', '#ffe94e', '#ba68c8', '#7ed36f', '#ff8fa3'];
// special: 0 없음 · 1 가로줄폭탄 · 2 세로줄폭탄 · 3 폭탄(3x3) · 4 레인보우
const S_NONE = 0, S_ROW = 1, S_COL = 2, S_BOMB = 3, S_RAINBOW = 4;
const SAVE_KEY = 'fruitb_save';

const qs = new URLSearchParams(location.search);
const SHOT = qs.has('shot');

/* ===== 시드 RNG ===== */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rnd = qs.has('seed') ? mulberry32(+qs.get('seed') || 1) : Math.random;

/* ===== 세이브 ===== */
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && Array.isArray(s.top10)) return s;
  } catch (e) { /* corrupt → reset */ }
  return { nick: '', best: { score: 0, level: 0 }, top10: [], muted: false };
}
function storeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }
let SAVE = loadSave();

function addRecord(nick, score, level) {
  SAVE.nick = nick;
  const isBest = score > SAVE.best.score;
  if (isBest) SAVE.best = { score, level };
  else if (score === SAVE.best.score && level > SAVE.best.level) SAVE.best.level = level;
  SAVE.top10.push({ n: nick, s: score, l: level, d: new Date().toISOString().slice(0, 10) });
  SAVE.top10.sort((a, b) => b.s - a.s || b.l - a.l);
  SAVE.top10 = SAVE.top10.slice(0, 10);
  storeSave();
  return isBest;
}

/* ===== 레벨 설정 · 등급 ===== */
function levelCfg(lv) {
  // 밸런스 실측(?test=bal): 무작위 플레이 평균 득점/이동 ≈ 과일5종 400 · 6종 240.
  // 요구평균 = 100 + 50(lv-1): 1~2렙 워밍업 → 5렙부터 전략 필요 → 12렙(최고등급) 고수 영역
  const moves = Math.max(12, 20 - ((lv - 1) >> 1));
  return {
    types: lv < 3 ? 5 : 6,
    moves,
    target: Math.round(moves * (100 + 50 * (lv - 1)) / 100) * 100,
  };
}
function rankIdx(lv) { return lv >= 12 ? 5 : lv >= 9 ? 4 : lv >= 7 ? 3 : lv >= 5 ? 2 : lv >= 3 ? 1 : 0; }
function rankName(lv) { return L.ranks[rankIdx(lv)]; }

/* ============================================================
   보드 로직 (순수 함수 — ?test=sim 에서 그대로 검증)
   grid[r][c] = { t: 과일종류(레인보우 -1), s: 스페셜 } | null
   ============================================================ */
function makeCell(t, s) { return { t, s: s || 0, oy: 0, vy: 0, sq: 0, spin: rnd() * 6.28 }; }

function makeBoard(types, rng) {
  rng = rng || rnd;
  for (let tries = 0; tries < 50; tries++) {
    const g = [];
    for (let r = 0; r < NROW; r++) {
      g[r] = [];
      for (let c = 0; c < NCOL; c++) {
        let t;
        do { t = (rng() * types) | 0; }
        while ((c >= 2 && g[r][c - 1].t === t && g[r][c - 2].t === t) ||
               (r >= 2 && g[r - 1][c].t === t && g[r - 2][c].t === t));
        g[r][c] = makeCell(t);
      }
    }
    if (hasValidMove(g)) return g;
  }
  return null; // 사실상 도달 불가
}

function findRuns(g) {
  const runs = [];
  for (let r = 0; r < NROW; r++) {
    let c = 0;
    while (c < NCOL) {
      const cell = g[r][c];
      if (!cell || cell.t < 0) { c++; continue; }
      let e = c + 1;
      while (e < NCOL && g[r][e] && g[r][e].t === cell.t) e++;
      if (e - c >= 3) {
        const cells = []; for (let i = c; i < e; i++) cells.push({ r, c: i });
        runs.push({ cells, dir: 'h', len: e - c, t: cell.t });
      }
      c = e;
    }
  }
  for (let c = 0; c < NCOL; c++) {
    let r = 0;
    while (r < NROW) {
      const cell = g[r][c];
      if (!cell || cell.t < 0) { r++; continue; }
      let e = r + 1;
      while (e < NROW && g[e][c] && g[e][c].t === cell.t) e++;
      if (e - r >= 3) {
        const cells = []; for (let i = r; i < e; i++) cells.push({ r: i, c });
        runs.push({ cells, dir: 'v', len: e - r, t: cell.t });
      }
      r = e;
    }
  }
  return runs;
}

const K = (r, c) => r * NCOL + c;

// 스페셜 발동 확산: initial(Set of key) → 최종 제거 대상 + 발동된 스페셜 목록
function expandClear(g, initial, protectedKeys) {
  const cleared = new Set(initial);
  const queue = [...initial];
  const fired = [];
  const add = (r, c) => {
    if (r < 0 || r >= NROW || c < 0 || c >= NCOL || !g[r][c]) return;
    const k = K(r, c);
    if (!cleared.has(k)) { cleared.add(k); queue.push(k); }
  };
  while (queue.length) {
    const k = queue.pop();
    if (protectedKeys && protectedKeys.has(k)) continue; // 새로 생성될 자리는 발동 없이 변신
    const r = (k / NCOL) | 0, c = k % NCOL;
    const cell = g[r][c];
    if (!cell || cell.s === S_NONE) continue;
    fired.push({ r, c, s: cell.s });
    if (cell.s === S_ROW) { for (let i = 0; i < NCOL; i++) add(r, i); }
    else if (cell.s === S_COL) { for (let i = 0; i < NROW; i++) add(i, c); }
    else if (cell.s === S_BOMB) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) add(r + dr, c + dc);
    } else if (cell.s === S_RAINBOW) {
      // 폭발에 휘말린 레인보우: 보드에서 가장 많은 과일색 전체 제거
      const cnt = {};
      for (let rr = 0; rr < NROW; rr++) for (let cc = 0; cc < NCOL; cc++) {
        const x = g[rr][cc]; if (x && x.t >= 0) cnt[x.t] = (cnt[x.t] || 0) + 1;
      }
      let best = -1, bn = -1;
      for (const t in cnt) if (cnt[t] > bn) { bn = cnt[t]; best = +t; }
      if (best >= 0) {
        for (let rr = 0; rr < NROW; rr++) for (let cc = 0; cc < NCOL; cc++)
          if (g[rr][cc] && g[rr][cc].t === best) add(rr, cc);
      }
    }
    cell.s = S_NONE; // 재발동 방지
  }
  return { cleared, fired };
}

// 매치 탐색 → 제거 대상 + 생성될 스페셜. prefer = 스왑된 좌표(스페셜 생성 위치 우선)
function computeClear(g, prefer) {
  const runs = findRuns(g);
  if (!runs.length) return null;
  // 셀 공유 run 병합 → 그룹
  const owner = new Map(); const groups = [];
  for (const run of runs) {
    let gi = -1;
    for (const cl of run.cells) { const k = K(cl.r, cl.c); if (owner.has(k)) { gi = owner.get(k); break; } }
    if (gi < 0) { gi = groups.length; groups.push({ runs: [], keys: new Set() }); }
    groups[gi].runs.push(run);
    for (const cl of run.cells) { owner.set(K(cl.r, cl.c), gi); groups[gi].keys.add(K(cl.r, cl.c)); }
  }
  const initial = new Set(); const specials = [];
  for (const grp of groups) {
    for (const k of grp.keys) initial.add(k);
    let maxLen = 0, longest = null, hasH = false, hasV = false;
    for (const run of grp.runs) {
      if (run.len > maxLen) { maxLen = run.len; longest = run; }
      if (run.dir === 'h') hasH = true; else hasV = true;
    }
    let s = S_NONE;
    if (maxLen >= 5) s = S_RAINBOW;
    else if (hasH && hasV) s = S_BOMB;
    else if (maxLen === 4) s = longest.dir === 'h' ? S_COL : S_ROW; // 가로4 → 세로줄폭탄
    if (s !== S_NONE) {
      let pos = null;
      if (prefer) for (const p of prefer) if (grp.keys.has(K(p.r, p.c))) { pos = p; break; }
      if (!pos) pos = longest.cells[(longest.len / 2) | 0];
      specials.push({ r: pos.r, c: pos.c, s, t: s === S_RAINBOW ? -1 : longest.t });
    }
  }
  const protectedKeys = new Set(specials.map(sp => K(sp.r, sp.c)));
  const { cleared, fired } = expandClear(g, initial, protectedKeys);
  return { cleared, specials, fired, protectedKeys };
}

// 제거·변신 적용 (파티클 생성은 호출부에서 이 전에 수행)
function applyClear(g, res) {
  for (const sp of res.specials) {
    const cell = g[sp.r][sp.c];
    if (cell) { cell.t = sp.t; cell.s = sp.s; }
  }
  let n = 0;
  for (const k of res.cleared) {
    if (res.protectedKeys.has(k)) continue;
    const r = (k / NCOL) | 0, c = k % NCOL;
    if (g[r][c]) { g[r][c] = null; n++; }
  }
  return n;
}

// 중력 + 리필. cellPx>0이면 낙하 애니 오프셋 설정
function gravity(g, types, cellPx, rng) {
  rng = rng || rnd;
  for (let c = 0; c < NCOL; c++) {
    let write = NROW - 1;
    for (let r = NROW - 1; r >= 0; r--) {
      if (g[r][c]) {
        if (write !== r) {
          g[write][c] = g[r][c]; g[r][c] = null;
          if (cellPx) { g[write][c].oy -= (write - r) * cellPx; g[write][c].vy = 0; }
        }
        write--;
      }
    }
    for (let i = 0; write >= 0; write--, i++) {
      const cell = makeCell((rng() * types) | 0);
      if (cellPx) { cell.oy = -(i + 1.3) * cellPx - cellPx * 0.6 * rng(); cell.vy = 0; }
      g[write][c] = cell;
    }
  }
}

function swapCells(g, a, b) {
  const tmp = g[a.r][a.c]; g[a.r][a.c] = g[b.r][b.c]; g[b.r][b.c] = tmp;
}

function hasValidMove(g) { return !!findValidMove(g); }
function findValidMove(g) {
  for (let r = 0; r < NROW; r++) for (let c = 0; c < NCOL; c++) {
    const cell = g[r][c]; if (!cell) continue;
    if (cell.s === S_RAINBOW) {
      const nb = [[r, c + 1], [r + 1, c]].find(([rr, cc]) => rr < NROW && cc < NCOL && g[rr][cc]);
      if (nb) return [{ r, c }, { r: nb[0], c: nb[1] }];
    }
    for (const [rr, cc] of [[r, c + 1], [r + 1, c]]) {
      if (rr >= NROW || cc >= NCOL || !g[rr][cc]) continue;
      if (g[rr][cc].s === S_RAINBOW) return [{ r, c }, { r: rr, c: cc }];
      if (cell.s > 0 && g[rr][cc].s > 0) return [{ r, c }, { r: rr, c: cc }];
      swapCells(g, { r, c }, { r: rr, c: cc });
      const ok = findRuns(g).length > 0;
      swapCells(g, { r, c }, { r: rr, c: cc });
      if (ok) return [{ r, c }, { r: rr, c: cc }];
    }
  }
  return null;
}

function shuffleBoard(g, rng) {
  rng = rng || rnd;
  for (let tries = 0; tries < 300; tries++) {
    const cells = [];
    for (let r = 0; r < NROW; r++) for (let c = 0; c < NCOL; c++) if (g[r][c]) cells.push(g[r][c]);
    for (let i = cells.length - 1; i > 0; i--) {
      const j = (rng() * (i + 1)) | 0; const t = cells[i]; cells[i] = cells[j]; cells[j] = t;
    }
    let i = 0;
    for (let r = 0; r < NROW; r++) for (let c = 0; c < NCOL; c++) if (g[r][c]) g[r][c] = cells[i++];
    if (!findRuns(g).length && hasValidMove(g)) return true;
  }
  return false;
}

/* ============================================================
   오디오 (WebAudio 전부 합성 — 효과음 + BGM)
   ============================================================ */
let AC = null, bgmGain = null, bgmTimer = null, bgmBeat = 0;
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  bgmGain = AC.createGain(); bgmGain.gain.value = 0; bgmGain.connect(AC.destination);
}
function muted() { return SAVE.muted; }

function tone(f0, dur, type, gain, f1, when) {
  if (!AC || muted()) return;
  const t0 = (when || AC.currentTime);
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t0);
  if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  gn.gain.setValueAtTime(0, t0);
  gn.gain.linearRampToValueAtTime(gain || 0.15, t0 + 0.008);
  gn.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(gn); gn.connect(AC.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, filterF, gain, slideF) {
  if (!AC || muted()) return;
  const t0 = AC.currentTime;
  const len = Math.max(1, (AC.sampleRate * dur) | 0);
  const buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource(); src.buffer = buf;
  const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(filterF, t0);
  if (slideF) f.frequency.exponentialRampToValueAtTime(slideF, t0 + dur);
  f.Q.value = 1.2;
  const gn = AC.createGain();
  gn.gain.setValueAtTime(gain || 0.2, t0);
  gn.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f); f.connect(gn); gn.connect(AC.destination);
  src.start(t0);
}
const PENTA = [523, 587, 659, 784, 880, 1047, 1175, 1319];
const sfx = {
  pop(chain, n) {
    const f = PENTA[Math.min(chain - 1, 7)];
    tone(f, 0.14, 'sine', 0.22, f * 1.5);
    tone(f * 2, 0.1, 'triangle', 0.08, f * 2.6);
    noise(0.08, 2400, 0.1, 4500);
    if (n >= 6) noise(0.16, 900, 0.12, 300);
  },
  swap() { noise(0.1, 1200, 0.09, 3000); },
  bad() { tone(140, 0.16, 'square', 0.07, 90); },
  blast() { noise(0.35, 700, 0.3, 120); tone(190, 0.32, 'sine', 0.3, 55); },
  create() { tone(1568, 0.16, 'triangle', 0.14); tone(2093, 0.22, 'triangle', 0.1, undefined, AC ? AC.currentTime + 0.06 : 0); },
  rainbow() { if (!AC || muted()) return; [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'triangle', 0.13, undefined, AC.currentTime + i * 0.05)); },
  fanfare() { if (!AC || muted()) return; [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.16, undefined, AC.currentTime + i * 0.11)); },
  over() { if (!AC || muted()) return; [440, 349, 294, 220].forEach((f, i) => tone(f, 0.34, 'sine', 0.14, undefined, AC.currentTime + i * 0.16)); },
  bonusPop(i) { tone(880 + i * 90, 0.1, 'sine', 0.14, 1400 + i * 90); },
};

/* BGM: 8마디 루프 시퀀서 (경쾌한 장조 아르페지오 + 베이스 + 하이햇) */
const BGM_BPM = 132, BGM_STEP = 60 / BGM_BPM / 2; // 8분음표
// C-Am-F-G ×2. 음계: C장조 펜타토닉
const CHORD = [[262, 330, 392], [220, 262, 330], [175, 220, 262], [196, 247, 294]];
const BASS = [131, 110, 87, 98];
const MELO = (() => { // 결정적 패턴 (시드 고정)
  const rg = mulberry32(20260717); const arr = [];
  for (let bar = 0; bar < 8; bar++) {
    const ch = CHORD[bar % 4];
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0 || rg() < 0.45) {
        const oct = rg() < 0.3 ? 4 : 2;
        arr.push(ch[(rg() * 3) | 0] * oct);
      } else arr.push(0);
    }
  }
  return arr;
})();
function bgmSchedule() {
  if (!AC) return;
  const ahead = AC.currentTime + 0.35;
  while (bgmSchedule.next < ahead) {
    const t = bgmSchedule.next, i = bgmBeat % 64, bar = (i / 8) | 0;
    const f = MELO[i];
    if (f) {
      const o = AC.createOscillator(), gn = AC.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(0.055, t + 0.015);
      gn.gain.exponentialRampToValueAtTime(0.001, t + BGM_STEP * 1.7);
      o.connect(gn); gn.connect(bgmGain); o.start(t); o.stop(t + BGM_STEP * 2);
    }
    if (i % 4 === 0) {
      const o = AC.createOscillator(), gn = AC.createGain();
      o.type = 'square'; o.frequency.value = BASS[bar % 4];
      gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(0.05, t + 0.02);
      gn.gain.exponentialRampToValueAtTime(0.001, t + BGM_STEP * 3);
      o.connect(gn); gn.connect(bgmGain); o.start(t); o.stop(t + BGM_STEP * 3.2);
    }
    if (i % 2 === 1) {
      const len = (AC.sampleRate * 0.03) | 0;
      const buf = AC.createBuffer(1, len, AC.sampleRate); const d = buf.getChannelData(0);
      for (let j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / len);
      const src = AC.createBufferSource(); src.buffer = buf;
      const hf = AC.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 6500;
      const gn = AC.createGain(); gn.gain.value = 0.05;
      src.connect(hf); hf.connect(gn); gn.connect(bgmGain); src.start(t);
    }
    bgmSchedule.next += BGM_STEP; bgmBeat++;
  }
}
function bgmStart() {
  if (!AC || bgmTimer) return;
  bgmSchedule.next = AC.currentTime + 0.05; bgmBeat = 0;
  bgmGain.gain.cancelScheduledValues(AC.currentTime);
  bgmGain.gain.setTargetAtTime(muted() ? 0 : 1, AC.currentTime, 0.4);
  bgmTimer = setInterval(bgmSchedule, 100);
}
function bgmStop() {
  if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
  if (AC) bgmGain.gain.setTargetAtTime(0, AC.currentTime, 0.3);
}
function applyMute() {
  document.getElementById('muteBtn').textContent = muted() ? '🔇' : '🔊';
  if (AC && bgmTimer) bgmGain.gain.setTargetAtTime(muted() ? 0 : 1, AC.currentTime, 0.2);
}

/* ============================================================
   렌더링 · 이펙트
   ============================================================ */
const cv = document.getElementById('game');
const cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
let cs = 0, bx = 0, by = 0; // 셀 px, 보드 좌상단

const sprites = [];
function buildSprites() {
  const sz = Math.max(64, Math.min(160, Math.ceil(cs * DPR * 1.1)));
  for (let i = 0; i < FRUITS.length; i++) {
    const oc = document.createElement('canvas'); oc.width = oc.height = sz;
    const c = oc.getContext('2d');
    c.font = Math.floor(sz * 0.82) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(FRUITS[i], sz / 2, sz / 2 + sz * 0.04);
    sprites[i] = oc;
  }
}
function layout() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const hudH = W < 520 ? 72 : 84;
  const size = Math.min(W * 0.965, H - hudH - 18, 620);
  cs = size / NCOL;
  bx = (W - size) / 2; by = hudH + Math.max(0, (H - hudH - 14 - size) / 2);
  buildSprites();
  if (G.grid) for (const row of G.grid) for (const cell of row) if (cell) { cell.oy = Math.max(cell.oy, -H); }
}

const particles = [], popups = [], banners = [];
let shakeT = 0, shakeMag = 0, flashT = 0;

function burst(px, py, fi, big) {
  const col = fi >= 0 ? FCOLOR[fi] : '#fff';
  const n = big ? 26 : 15;
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.283, sp = (big ? 340 : 230) * (0.35 + rnd() * 0.8);
    particles.push({ kind: 'drop', x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90,
      g: 900, life: 0.55 + rnd() * 0.4, t: 0, size: cs * (0.06 + rnd() * 0.09), color: col });
  }
  for (let i = 0; i < (big ? 8 : 4); i++) {
    const a = rnd() * 6.283, sp = 150 + rnd() * 220;
    particles.push({ kind: 'star', x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
      g: 500, life: 0.5 + rnd() * 0.35, t: 0, size: cs * (0.1 + rnd() * 0.12), color: '#fff', rot: rnd() * 6.28 });
  }
  particles.push({ kind: 'ring', x: px, y: py, t: 0, life: big ? 0.5 : 0.34, size: cs * (big ? 2.2 : 1.15), color: col });
  if (fi >= 0) particles.push({ kind: 'ghost', x: px, y: py, t: 0, life: 0.18, fi, size: cs });
}
function lineFX(row, col) {
  const horiz = col === undefined;
  for (let i = 0; i < 26; i++) {
    const along = rnd() * NCOL * cs;
    particles.push({ kind: 'streak', t: 0, life: 0.3 + rnd() * 0.2, color: '#fff',
      x: horiz ? bx + along : bx + col * cs + cs / 2 + (rnd() - 0.5) * cs * 0.5,
      y: horiz ? by + row * cs + cs / 2 + (rnd() - 0.5) * cs * 0.5 : by + along,
      vx: horiz ? (rnd() < 0.5 ? -1 : 1) * (600 + rnd() * 600) : (rnd() - 0.5) * 60,
      vy: horiz ? (rnd() - 0.5) * 60 : (rnd() < 0.5 ? -1 : 1) * (600 + rnd() * 600),
      g: 0, size: cs * 0.09 });
  }
}
function popup(px, py, txt, color, big) {
  popups.push({ x: px, y: py, txt, color: color || '#ffe957', t: 0, life: 0.9, big: !!big });
}
function banner(txt, dur, color, sub) {
  banners.push({ txt, sub, t: 0, life: dur || 1.0, color: color || '#ffe957' });
}
function shake(m) { shakeMag = Math.max(shakeMag, m); shakeT = 0.4; }

function cellXY(r, c) { return [bx + c * cs + cs / 2, by + r * cs + cs / 2]; }

function drawRounded(x, y, w, h, rad) {
  cx.beginPath();
  cx.moveTo(x + rad, y); cx.arcTo(x + w, y, x + w, y + h, rad); cx.arcTo(x + w, y + h, x, y + h, rad);
  cx.arcTo(x, y + h, x, y, rad); cx.arcTo(x, y, x + w, y, rad); cx.closePath();
}

/* 메뉴 배경: 과일비 */
const rain = [];
function drawMenuBG(dt) {
  if (rain.length < 26 && rnd() < 0.12)
    rain.push({ x: rnd() * W, y: -60, v: 60 + rnd() * 120, fi: (rnd() * FRUITS.length) | 0,
      s: 26 + rnd() * 44, rot: rnd() * 6.28, vr: (rnd() - 0.5) * 1.6 });
  cx.globalAlpha = 0.5;
  for (let i = rain.length - 1; i >= 0; i--) {
    const f = rain[i]; f.y += f.v * dt; f.rot += f.vr * dt;
    if (f.y > H + 80) { rain.splice(i, 1); continue; }
    const sp = sprites[f.fi]; if (!sp) continue;
    cx.save(); cx.translate(f.x, f.y); cx.rotate(f.rot);
    cx.drawImage(sp, -f.s / 2, -f.s / 2, f.s, f.s); cx.restore();
  }
  cx.globalAlpha = 1;
}

function drawBoard(now, dt) {
  const pad = cs * 0.1;
  drawRounded(bx - pad, by - pad, NCOL * cs + pad * 2, NROW * cs + pad * 2, cs * 0.24);
  cx.fillStyle = 'rgba(8,10,30,.55)'; cx.fill();
  cx.strokeStyle = 'rgba(255,255,255,.22)'; cx.lineWidth = 2; cx.stroke();

  for (let r = 0; r < NROW; r++) for (let c = 0; c < NCOL; c++) {
    drawRounded(bx + c * cs + 1.5, by + r * cs + 1.5, cs - 3, cs - 3, cs * 0.18);
    cx.fillStyle = (r + c) % 2 ? 'rgba(255,255,255,.055)' : 'rgba(255,255,255,.1)';
    cx.fill();
  }

  // 힌트 글로우
  if (G.hint && G.phase === 'idle') {
    const p = 0.55 + 0.45 * Math.sin(now / 180);
    for (const h of G.hint) {
      drawRounded(bx + h.c * cs + 2, by + h.r * cs + 2, cs - 4, cs - 4, cs * 0.18);
      cx.strokeStyle = `rgba(255,255,180,${0.35 + 0.4 * p})`; cx.lineWidth = 3 + 2 * p; cx.stroke();
    }
  }

  for (let r = 0; r < NROW; r++) for (let c = 0; c < NCOL; c++) {
    const cell = G.grid[r][c]; if (!cell) continue;
    let dx = 0, dy = cell.oy, scale = 1;
    if (G.pend) { // 스왑 애니 중인 두 셀
      const p = G.pend, tt = p.back ? 1 - p.t : p.t, ease = tt * tt * (3 - 2 * tt);
      if (r === p.a.r && c === p.a.c) { dx = (p.b.c - p.a.c) * cs * ease; dy += (p.b.r - p.a.r) * cs * ease; }
      else if (r === p.b.r && c === p.b.c) { dx = (p.a.c - p.b.c) * cs * ease; dy += (p.a.r - p.b.r) * cs * ease; }
    }
    const [px0, py0] = cellXY(r, c);
    const px = px0 + dx, py = py0 + dy;
    const sel = G.sel && G.sel.r === r && G.sel.c === c;
    if (sel) scale = 1.12 + 0.06 * Math.sin(now / 110);
    const sq = cell.sq; // 착지 스쿼시
    const sxs = scale * (1 + 0.18 * sq), sys = scale * (1 - 0.22 * sq);
    const sz = cs * 0.86;

    if (sel) {
      drawRounded(bx + c * cs + 1.5, by + r * cs + 1.5, cs - 3, cs - 3, cs * 0.18);
      cx.fillStyle = 'rgba(255,233,87,.25)'; cx.fill();
      cx.strokeStyle = '#ffe957'; cx.lineWidth = 3; cx.stroke();
    }

    cx.save(); cx.translate(px, py);
    // 스페셜 배경 이펙트
    if (cell.s === S_ROW || cell.s === S_COL) {
      const pl = 0.6 + 0.4 * Math.sin(now / 150 + cell.spin);
      cx.save(); if (cell.s === S_COL) cx.rotate(Math.PI / 2);
      const gr = cx.createLinearGradient(-sz / 2, 0, sz / 2, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${0.55 * pl})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      cx.fillStyle = gr; cx.fillRect(-cs / 2 + 2, -cs * 0.14, cs - 4, cs * 0.28);
      cx.fillStyle = `rgba(255,255,255,${0.75 * pl})`;
      cx.beginPath(); cx.moveTo(-cs / 2 + 3, 0); cx.lineTo(-cs / 2 + cs * 0.18, -cs * 0.1); cx.lineTo(-cs / 2 + cs * 0.18, cs * 0.1); cx.fill();
      cx.beginPath(); cx.moveTo(cs / 2 - 3, 0); cx.lineTo(cs / 2 - cs * 0.18, -cs * 0.1); cx.lineTo(cs / 2 - cs * 0.18, cs * 0.1); cx.fill();
      cx.restore();
    } else if (cell.s === S_BOMB) {
      const pl = 0.5 + 0.5 * Math.sin(now / 130 + cell.spin);
      cx.beginPath(); cx.arc(0, 0, cs * (0.42 + 0.05 * pl), 0, 6.283);
      cx.fillStyle = `rgba(30,10,40,${0.5 + 0.2 * pl})`; cx.fill();
      cx.strokeStyle = `rgba(255,120,60,${0.5 + 0.5 * pl})`; cx.lineWidth = 2.5; cx.stroke();
    } else if (cell.s === S_RAINBOW) {
      cell.spin += dt * 2;
      for (let i = 0; i < 6; i++) {
        cx.beginPath();
        cx.arc(0, 0, cs * 0.36, cell.spin + i * 1.047, cell.spin + i * 1.047 + 0.9);
        cx.strokeStyle = FCOLOR[i]; cx.lineWidth = cs * 0.13; cx.stroke();
      }
      cx.beginPath(); cx.arc(0, 0, cs * 0.2, 0, 6.283); cx.fillStyle = '#fff'; cx.fill();
    }
    cx.scale(sxs, sys);
    if (cell.t >= 0) {
      const sp = sprites[cell.t];
      if (sp) cx.drawImage(sp, -sz / 2, -sz / 2, sz, sz);
    } else if (cell.s === S_RAINBOW) {
      cx.font = Math.floor(cs * 0.34) + 'px sans-serif';
      cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('✨', 0, 0);
    }
    cx.restore();
  }
}

function drawParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.t += dt;
    if (p.t >= p.life) { particles.splice(i, 1); continue; }
    const k = p.t / p.life, a = 1 - k;
    if (p.kind === 'drop' || p.kind === 'streak') {
      p.x += p.vx * dt; p.y += (p.vy += p.g * dt) * dt * (p.kind === 'streak' ? 0 : 1);
      if (p.kind === 'streak') p.y += p.vy * dt;
      cx.globalAlpha = a;
      cx.fillStyle = p.color;
      cx.beginPath(); cx.arc(p.x, p.y, p.size * (1 - k * 0.6), 0, 6.283); cx.fill();
    } else if (p.kind === 'star') {
      p.x += p.vx * dt; p.y += (p.vy += p.g * dt) * dt; p.rot += dt * 6;
      cx.globalAlpha = a; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
      cx.fillStyle = p.color;
      const s = p.size * (1 - k * 0.4);
      cx.beginPath();
      for (let j = 0; j < 4; j++) {
        cx.rotate(Math.PI / 2);
        cx.moveTo(0, 0); cx.lineTo(s * 0.18, s * 0.18); cx.lineTo(0, s); cx.lineTo(-s * 0.18, s * 0.18);
      }
      cx.fill(); cx.restore();
    } else if (p.kind === 'ring') {
      cx.globalAlpha = a * 0.8;
      cx.strokeStyle = p.color; cx.lineWidth = 3 + (1 - k) * 4;
      cx.beginPath(); cx.arc(p.x, p.y, p.size * k + cs * 0.2, 0, 6.283); cx.stroke();
    } else if (p.kind === 'ghost') {
      const sp = sprites[p.fi]; if (sp) {
        cx.globalAlpha = a * 0.9; const s = p.size * (1 + k * 0.9);
        cx.drawImage(sp, p.x - s / 2, p.y - s / 2, s, s);
      }
    }
  }
  cx.globalAlpha = 1;
  if (particles.length > 700) particles.splice(0, particles.length - 700);
}

function drawPopups(dt) {
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i]; p.t += dt;
    if (p.t >= p.life) { popups.splice(i, 1); continue; }
    const k = p.t / p.life;
    cx.globalAlpha = k < 0.75 ? 1 : (1 - k) * 4;
    cx.font = '900 ' + Math.floor(p.big ? cs * 0.55 : cs * 0.42) + 'px sans-serif';
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.lineWidth = 4; cx.strokeStyle = 'rgba(0,0,0,.65)';
    const y = p.y - k * cs * 1.1;
    cx.strokeText(p.txt, p.x, y);
    cx.fillStyle = p.color; cx.fillText(p.txt, p.x, y);
  }
  cx.globalAlpha = 1;
}

function drawBanners(dt) {
  for (let i = banners.length - 1; i >= 0; i--) {
    const b = banners[i]; b.t += dt;
    if (b.t >= b.life) { banners.splice(i, 1); continue; }
    const k = b.t / b.life;
    let scale = 1;
    if (k < 0.14) { const u = k / 0.14; scale = 0.4 + 0.75 * u; } // 팝 등장
    else if (k < 0.22) scale = 1.15 - 0.15 * ((k - 0.14) / 0.08);
    const alpha = k > 0.82 ? (1 - k) / 0.18 : 1;
    cx.save(); cx.globalAlpha = alpha;
    cx.translate(W / 2, H * 0.42); cx.scale(scale, scale);
    cx.font = '900 ' + Math.min(64, W * 0.09) + 'px sans-serif';
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.lineWidth = 8; cx.strokeStyle = 'rgba(0,0,0,.7)'; cx.strokeText(b.txt, 0, 0);
    cx.fillStyle = b.color; cx.fillText(b.txt, 0, 0);
    if (b.sub) {
      cx.font = '800 ' + Math.min(24, W * 0.04) + 'px sans-serif';
      cx.lineWidth = 5; cx.strokeText(b.sub, 0, Math.min(52, W * 0.075));
      cx.fillStyle = '#fff'; cx.fillText(b.sub, 0, Math.min(52, W * 0.075));
    }
    cx.restore();
  }
}

/* ============================================================
   게임 상태 머신
   ============================================================ */
const G = {
  mode: 'menu',     // menu | play | results
  phase: 'idle',    // idle | swapping | swapback | popping | falling | clearing | prelevel | over
  grid: null, level: 1, cfg: levelCfg(1),
  moves: 0, score: 0, lscore: 0, chain: 1,
  sel: null, pend: null, hint: null, idleT: 0, timer: 0,
  pendRes: null, bonusLeft: 0, bonusT: 0, recorded: false,
};

function hud(id) { return document.getElementById(id); }
function updateHUD() {
  hud('hudLevel').textContent = `${L.level} ${G.level}`;
  hud('hudRank').textContent = `🏅 ${rankName(G.level)}`;
  hud('hudMoves').textContent = `👆 ${G.moves}`;
  hud('hudScore').textContent = `⭐ ${G.score.toLocaleString()}`;
  const pct = Math.min(100, G.lscore / G.cfg.target * 100);
  hud('bar').style.width = pct + '%';
  hud('barTxt').textContent = `${L.target} ${G.lscore.toLocaleString()} / ${G.cfg.target.toLocaleString()}`;
}

function startGame() {
  const nick = (document.getElementById('nick').value || '').trim() || 'MENEW';
  SAVE.nick = nick; storeSave();
  G.mode = 'play'; G.level = 1; G.score = 0; G.recorded = false;
  audioInit(); bgmStart();
  showScreen(null); document.body.classList.add('playing');
  startLevel();
}
function startLevel() {
  G.cfg = levelCfg(G.level);
  G.moves = G.cfg.moves; G.lscore = 0; G.chain = 1;
  G.sel = null; G.pend = null; G.hint = null; G.idleT = 0;
  G.grid = makeBoard(G.cfg.types);
  // 등장 낙하 연출
  for (let r = 0; r < NROW; r++) for (let c = 0; c < NCOL; c++) {
    const cell = G.grid[r][c];
    cell.oy = -(NROW - r + 1.5) * cs - rnd() * cs * 2; cell.vy = 0;
  }
  banner(L.getReady + G.level, 1.1, '#ffe957', `${L.target} ${G.cfg.target.toLocaleString()}`);
  G.phase = 'falling';
  updateHUD();
}

function trySwap(a, b) {
  if (G.phase !== 'idle') return;
  const A = G.grid[a.r][a.c], B = G.grid[b.r][b.c];
  if (!A || !B) return;
  G.sel = null; G.idleT = 0; G.hint = null;
  G.pend = { a, b, t: 0, back: false };
  G.phase = 'swapping';
  sfx.swap();
}

function commitSwap() {
  const { a, b } = G.pend;
  const A = G.grid[a.r][a.c], B = G.grid[b.r][b.c];
  // 레인보우 스왑
  if (A.s === S_RAINBOW || B.s === S_RAINBOW) {
    swapCells(G.grid, a, b);
    G.pend = null; G.moves--; G.chain = 1;
    const initial = new Set([K(a.r, a.c), K(b.r, b.c)]);
    const other = A.s === S_RAINBOW ? B : A;
    if (A.s === S_RAINBOW && B.s === S_RAINBOW) {
      for (let r = 0; r < NROW; r++) for (let c = 0; c < NCOL; c++) if (G.grid[r][c]) initial.add(K(r, c));
    } else if (other.t >= 0) {
      for (let r = 0; r < NROW; r++) for (let c = 0; c < NCOL; c++)
        if (G.grid[r][c] && G.grid[r][c].t === other.t) initial.add(K(r, c));
    }
    // 레인보우 본체는 발동 확산 없이 소멸해야 하므로 s 제거
    if (A.s === S_RAINBOW) A.s = S_NONE; if (B.s === S_RAINBOW) B.s = S_NONE;
    const { cleared, fired } = expandClear(G.grid, initial, null);
    sfx.rainbow(); flashT = 0.3; shake(14);
    beginPop({ cleared, specials: [], fired, protectedKeys: new Set() }, 500);
    return;
  }
  swapCells(G.grid, a, b);
  const res = computeClear(G.grid, [b, a]);
  if (res) {
    G.pend = null; G.moves--; G.chain = 1;
    beginPop(res, 0);
  } else if (A.s > 0 && B.s > 0) {
    // 스페셜 + 스페셜: 매치 없이도 동시 발동
    G.pend = null; G.moves--; G.chain = 1;
    const { cleared, fired } = expandClear(G.grid, new Set([K(a.r, a.c), K(b.r, b.c)]), null);
    beginPop({ cleared, specials: [], fired, protectedKeys: new Set() }, 0);
  } else {
    sfx.bad();
    G.pend.back = true; G.pend.t = 0;
    G.phase = 'swapback';
  }
}

function beginPop(res, bonusPts) {
  // 점수
  let count = 0;
  for (const k of res.cleared) if (!res.protectedKeys.has(k)) count++;
  const pts = count * 30 * G.chain + res.specials.length * 200 + (bonusPts || 0);
  G.score += pts; G.lscore += pts;

  // 이펙트
  let cxm = 0, cym = 0, n = 0;
  for (const k of res.cleared) {
    if (res.protectedKeys.has(k)) continue;
    const r = (k / NCOL) | 0, c = k % NCOL;
    const cell = G.grid[r][c]; if (!cell) continue;
    const [px, py] = cellXY(r, c);
    burst(px, py, cell.t, false);
    cxm += px; cym += py; n++;
  }
  for (const f of res.fired) {
    const [px, py] = cellXY(f.r, f.c);
    if (f.s === S_ROW) lineFX(f.r, undefined);
    else if (f.s === S_COL) lineFX(undefined, f.c);
    else burst(px, py, -1, true);
  }
  for (const sp of res.specials) {
    const [px, py] = cellXY(sp.r, sp.c);
    particles.push({ kind: 'ring', x: px, y: py, t: 0, life: 0.5, size: cs * 1.6, color: '#fff' });
    sfx.create();
  }
  if (n) {
    popup(cxm / n, cym / n, '+' + pts.toLocaleString(), G.chain >= 3 ? '#ff8fa3' : '#ffe957', G.chain >= 2);
    if (G.chain >= 2) banner(`${L.combo} ×${G.chain}`, 0.7, '#7ed36f');
  }
  sfx.pop(G.chain, n);
  if (res.fired.length) { sfx.blast(); flashT = Math.max(flashT, 0.18); }
  shake(Math.min(16, 3 + n * 0.7 + res.fired.length * 5));

  applyClear(G.grid, res);
  G.timer = 0.16;
  G.phase = 'popping';
  updateHUD();
}

function afterFall() {
  const res = computeClear(G.grid, null);
  if (res) { G.chain++; beginPop(res, 0); return; }
  // 이동 종료 판정
  if (G.lscore >= G.cfg.target) {
    G.phase = 'clearing'; G.bonusLeft = G.moves; G.bonusT = 0.9;
    banner(L.levelClear, 1.2, '#7ed36f', G.moves > 0 ? `${L.bonus} +${G.moves * 150}` : '');
    sfx.fanfare(); flashT = 0.25;
    return;
  }
  if (G.moves <= 0) { gameOver(); return; }
  if (!hasValidMove(G.grid)) {
    banner(L.shuffle, 1.0, '#ffa726');
    shuffleBoard(G.grid);
    if (!hasValidMove(G.grid)) { G.grid = makeBoard(G.cfg.types); }
  }
  G.chain = 1; G.phase = 'idle'; G.idleT = 0;
  updateHUD();
}

function gameOver() {
  G.phase = 'over'; G.timer = 1.4;
  banner(L.gameOver, 1.3, '#ff5252');
  bgmStop(); sfx.over();
}

function finishToResults() {
  if (!G.recorded) {
    G.recorded = true;
    const nick = SAVE.nick || 'MENEW';
    G.isBest = addRecord(nick, G.score, G.level);
  }
  G.mode = 'results';
  document.body.classList.remove('playing');
  const st = document.getElementById('resStats');
  st.innerHTML =
    `${L.finalScore}: <span class="big">${G.score.toLocaleString()}</span><br>` +
    `${L.reached}: ${L.level} ${G.level} · <span class="rankName">🏅 ${rankName(G.level)}</span>` +
    (G.isBest && G.score > 0 ? `<br>${L.newRecord}` : '');
  document.getElementById('resPanel').innerHTML = recordsTable();
  showScreen('results');
  if (G.isBest && G.score > 0) {
    for (let i = 0; i < 5; i++)
      setTimeout(() => burst(W * (0.2 + rnd() * 0.6), H * (0.2 + rnd() * 0.4), (rnd() * 6) | 0, true), i * 180);
  }
}

/* ===== 업데이트 루프 ===== */
let lastT = 0, paused = false;
function frame(tms) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (tms - lastT) / 1000 || 0.016); lastT = tms;
  if (paused || SHOT) dt = 0; // 스크린샷 모드: 연출 순간 정지
  step(dt, tms);
}
function step(dt, now) {

  // 물리: 낙하
  let falling = false;
  if (G.grid) {
    for (let r = 0; r < NROW; r++) for (let c = 0; c < NCOL; c++) {
      const cell = G.grid[r][c]; if (!cell) continue;
      if (cell.oy < 0) {
        cell.vy += 4200 * dt; cell.oy += cell.vy * dt;
        if (cell.oy >= 0) { cell.oy = 0; cell.vy = 0; cell.sq = 0.9; }
        else falling = true;
      }
      if (cell.sq > 0) cell.sq = Math.max(0, cell.sq - dt * 5);
    }
  }

  if (!paused && G.mode === 'play') {
    if (G.phase === 'swapping' || G.phase === 'swapback') {
      G.pend.t += dt / 0.15;
      if (G.pend.t >= 1) {
        if (G.phase === 'swapping') commitSwap();
        else { G.pend = null; G.phase = 'idle'; }
      }
    } else if (G.phase === 'popping') {
      G.timer -= dt;
      if (G.timer <= 0) { gravity(G.grid, G.cfg.types, cs); G.phase = 'falling'; }
    } else if (G.phase === 'falling') {
      if (!falling) afterFall();
    } else if (G.phase === 'clearing') {
      G.bonusT -= dt;
      if (G.bonusT <= 0) {
        if (G.bonusLeft > 0) {
          G.bonusLeft--; G.moves--;
          const r = (rnd() * NROW) | 0, c = (rnd() * NCOL) | 0;
          const [px, py] = cellXY(r, c);
          burst(px, py, (rnd() * FRUITS.length) | 0, true);
          G.score += 150; G.lscore += 150;
          popup(px, py, '+150', '#7ed36f');
          sfx.bonusPop(G.cfg.moves - G.bonusLeft);
          shake(5);
          G.bonusT = 0.13;
          updateHUD();
        } else { G.level++; startLevel(); }
      }
    } else if (G.phase === 'over') {
      G.timer -= dt;
      if (G.timer <= 0) finishToResults();
    } else if (G.phase === 'idle') {
      G.idleT += dt;
      if (G.idleT > 4.5 && !G.hint) G.hint = findValidMove(G.grid);
    }
  }

  // ===== 렌더 =====
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.clearRect(0, 0, W, H);
  // 배경 비네트
  const bg = cx.createRadialGradient(W / 2, H * 0.35, H * 0.1, W / 2, H * 0.5, H * 0.9);
  bg.addColorStop(0, 'rgba(255,255,255,.05)'); bg.addColorStop(1, 'rgba(0,0,0,.25)');
  cx.fillStyle = bg; cx.fillRect(0, 0, W, H);

  if (shakeT > 0) {
    shakeT -= dt;
    const m = shakeMag * Math.max(0, shakeT / 0.4);
    cx.translate((rnd() - 0.5) * m, (rnd() - 0.5) * m);
    if (shakeT <= 0) shakeMag = 0;
  }

  if (G.mode === 'play') drawBoard(now, dt);
  else drawMenuBG(dt);

  drawParticles(dt);
  drawPopups(dt);
  drawBanners(dt);

  if (flashT > 0) {
    flashT -= dt;
    cx.globalAlpha = Math.max(0, flashT * 2.2);
    cx.fillStyle = '#fff'; cx.fillRect(-20, -20, W + 40, H + 40);
    cx.globalAlpha = 1;
  }
}

/* ===== 입력 ===== */
let drag = null;
function evCell(e) {
  const x = e.clientX, y = e.clientY;
  const c = Math.floor((x - bx) / cs), r = Math.floor((y - by) / cs);
  if (r < 0 || r >= NROW || c < 0 || c >= NCOL) return null;
  return { r, c };
}
cv.addEventListener('pointerdown', (e) => {
  audioInit();
  if (G.mode !== 'play' || paused || G.phase !== 'idle') return;
  const cell = evCell(e); if (!cell) { G.sel = null; return; }
  drag = { start: cell, x: e.clientX, y: e.clientY, done: false };
  e.preventDefault();
});
cv.addEventListener('pointermove', (e) => {
  if (!drag || drag.done || G.phase !== 'idle') return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.abs(dx) < cs * 0.3 && Math.abs(dy) < cs * 0.3) return;
  const a = drag.start;
  const b = Math.abs(dx) > Math.abs(dy)
    ? { r: a.r, c: a.c + (dx > 0 ? 1 : -1) }
    : { r: a.r + (dy > 0 ? 1 : -1), c: a.c };
  drag.done = true;
  if (b.r >= 0 && b.r < NROW && b.c >= 0 && b.c < NCOL) trySwap(a, b);
});
cv.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const wasDrag = drag.done; const start = drag.start; drag = null;
  if (wasDrag || G.mode !== 'play' || paused || G.phase !== 'idle') return;
  // 탭 선택 방식
  const cell = start;
  if (G.sel) {
    if (G.sel.r === cell.r && G.sel.c === cell.c) { G.sel = null; return; }
    if (Math.abs(G.sel.r - cell.r) + Math.abs(G.sel.c - cell.c) === 1) { trySwap(G.sel, cell); return; }
  }
  G.sel = cell; G.idleT = 0;
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && G.mode === 'play') togglePause();
});
window.addEventListener('resize', layout);

/* ===== 화면 전환 · 메뉴 ===== */
function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.style.display = 'none';
  if (id) document.getElementById(id).style.display = 'flex';
}
function togglePause() {
  if (G.mode !== 'play') return;
  paused = !paused;
  if (paused) { showScreen('pause'); bgmStop(); }
  else { showScreen(null); bgmStart(); }
}
function fmtDate(d) { return d || ''; }
function recordsTable() {
  if (!SAVE.top10.length) return `<div class="note">${L.emptyRec}</div>`;
  let h = `<table><tr><th>${L.colRank}</th><th>${L.colName}</th><th>${L.colScore}</th><th>${L.colLevel}</th><th>${L.colDate}</th></tr>`;
  SAVE.top10.forEach((r, i) => {
    const me = r.n === SAVE.nick && r.s === SAVE.best.score ? ' class="me"' : '';
    h += `<tr${me}><td>${i + 1}</td><td>${String(r.n).replace(/[<>&]/g, '')}</td><td>${r.s.toLocaleString()}</td><td>${r.l}</td><td>${fmtDate(r.d)}</td></tr>`;
  });
  h += '</table>';
  h += `<div class="note" style="margin-top:8px">${L.myBest}: ${SAVE.best.score.toLocaleString()} (${L.level} ${SAVE.best.level}, 🏅 ${rankName(SAVE.best.level)})</div>`;
  return h;
}

function bind(id, fn) { document.getElementById(id).addEventListener('click', fn); }
function uiInit() {
  const $ = (id) => document.getElementById(id);
  $('subT').textContent = L.sub;
  $('startBtn').textContent = L.start;
  $('recBtn').textContent = L.records;
  $('exportBtn').textContent = L.expSave;
  $('importBtn').textContent = L.impSave;
  $('helpBox').innerHTML = L.help;
  $('credit').innerHTML = L.credit + '<a href="https://menewsoft.com" target="_blank" rel="noopener">menewsoft.com</a>';
  $('nick').placeholder = L.nickPh;
  $('nick').value = SAVE.nick || '';
  $('recT').textContent = L.records;
  $('recNote').textContent = L.recNote;
  $('recBackBtn').textContent = L.back;
  $('pauseT').textContent = L.pauseTitle;
  $('resumeBtn').textContent = L.resume;
  $('quitBtn').textContent = L.quit;
  $('resT').textContent = L.resTitle;
  $('retryBtn').textContent = L.retry;
  $('menuBtn').textContent = L.menu;
  applyMute();

  bind('startBtn', startGame);
  bind('recBtn', () => { $('recPanel').innerHTML = recordsTable(); showScreen('records'); });
  bind('recBackBtn', () => showScreen('menu'));
  bind('resumeBtn', togglePause);
  bind('quitBtn', () => {
    if (!confirm(L.quitConfirm)) return;
    paused = false; bgmStop();
    if (G.score > 0) finishToResults();
    else { G.mode = 'menu'; document.body.classList.remove('playing'); showScreen('menu'); }
  });
  bind('retryBtn', () => { startGame(); });
  bind('menuBtn', () => { G.mode = 'menu'; showScreen('menu'); });
  bind('pauseBtn', togglePause);
  bind('muteBtn', () => { SAVE.muted = !SAVE.muted; storeSave(); applyMute(); });

  bind('exportBtn', () => {
    const blob = new Blob([JSON.stringify({ game: 'fruitblocks', v: 1, data: SAVE })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fruit-blocks-save.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    alert(L.expDone);
  });
  bind('importBtn', () => $('importFile').click());
  $('importFile').addEventListener('change', (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const j = JSON.parse(rd.result);
        if (j.game !== 'fruitblocks' || !j.data || !Array.isArray(j.data.top10)) throw 0;
        if (!confirm(L.impConfirm)) return;
        SAVE = j.data; storeSave(); $('nick').value = SAVE.nick || ''; applyMute();
      } catch (err) { alert(L.impErr); }
    };
    rd.readAsText(f);
  });
  document.addEventListener('pointerdown', audioInit, { once: true });
}

/* ============================================================
   테스트 모드 (?test=sim — 헤드리스 동기 검증, console.warn 출력)
   ============================================================ */
function runSim() {
  let pass = 0, fail = 0;
  const T = (name, ok, extra) => {
    if (ok) pass++; else fail++;
    console.warn(`[SIM] ${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  };
  // 1. 보드 생성: 초기 매치 없음 + 유효 이동 존재 (시드 30개)
  let ok1 = true, ok2 = true;
  for (let s = 1; s <= 30; s++) {
    const g = makeBoard(5, mulberry32(s));
    if (!g || findRuns(g).length) ok1 = false;
    if (!g || !hasValidMove(g)) ok2 = false;
  }
  T('board: no initial matches (30 seeds)', ok1);
  T('board: valid move exists (30 seeds)', ok2);

  // 2. 3매치 → 3개 제거, 스페셜 없음
  const rg = mulberry32(99);
  const mk = () => {
    const g = makeBoard(6, rg);
    // 윗줄을 결정적 패턴으로 덮어쓰기 (매치 없는 상태 유지)
    return g;
  };
  {
    const g = mk();
    // 수동 구성: row0 = 0 0 0 1 2 3 4 5 → 3매치
    const pat = [[0,0,0,1,2,3,4,5],[1,2,3,4,5,0,1,2],[2,3,4,5,0,1,2,3],[3,4,5,0,1,2,3,4],
                 [4,5,0,1,2,3,4,5],[5,0,1,2,3,4,5,0],[0,1,2,3,4,5,0,1],[1,2,3,4,5,0,1,2]];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g[r][c] = makeCell(pat[r][c]);
    const res = computeClear(g, null);
    T('3-match detected', !!res && res.cleared.size === 3 && res.specials.length === 0,
      res ? `cleared=${res.cleared.size} specials=${res.specials.length}` : 'null');
    const n = applyClear(g, res);
    T('3-match removes 3', n === 3, 'n=' + n);
    gravity(g, 6, 0, mulberry32(7));
    let nulls = 0; for (const row of g) for (const cell of row) if (!cell) nulls++;
    T('gravity fills board', nulls === 0, 'nulls=' + nulls);
  }
  // 3. 4매치 → 줄폭탄 생성 & 발동 시 한 줄 제거
  {
    const g = [];
    const pat = [[0,0,0,0,2,3,4,5],[1,2,3,4,5,0,1,2],[2,3,4,5,0,1,2,3],[3,4,5,0,1,2,3,4],
                 [4,5,0,1,2,3,4,5],[5,0,1,2,3,4,5,0],[0,1,2,3,4,5,0,1],[1,2,3,4,5,0,1,2]];
    for (let r = 0; r < 8; r++) { g[r] = []; for (let c = 0; c < 8; c++) g[r][c] = makeCell(pat[r][c]); }
    const res = computeClear(g, null);
    T('4-match creates striped', !!res && res.specials.length === 1 && (res.specials[0].s === S_COL || res.specials[0].s === S_ROW),
      res ? 's=' + (res.specials[0] && res.specials[0].s) : 'null');
    applyClear(g, res);
    const sp = res.specials[0];
    T('striped survives at position', g[sp.r][sp.c] && g[sp.r][sp.c].s === sp.s);
    // 발동: 스페셜 셀을 initial로 확산
    const { cleared } = expandClear(g, new Set([K(sp.r, sp.c)]), null);
    T('striped fires full line', cleared.size >= 8, 'cleared=' + cleared.size);
  }
  // 4. 5매치 → 레인보우
  {
    const g = [];
    const pat = [[0,0,0,0,0,3,4,5],[1,2,3,4,5,0,1,2],[2,3,4,5,0,1,2,3],[3,4,5,0,1,2,3,4],
                 [4,5,0,1,2,3,4,5],[5,0,1,2,3,4,5,0],[0,1,2,3,4,5,0,1],[1,2,3,4,5,0,1,2]];
    for (let r = 0; r < 8; r++) { g[r] = []; for (let c = 0; c < 8; c++) g[r][c] = makeCell(pat[r][c]); }
    const res = computeClear(g, null);
    T('5-match creates rainbow', !!res && res.specials.length === 1 && res.specials[0].s === S_RAINBOW);
  }
  // 5. L자 → 폭탄
  {
    const g = [];
    const pat = [[0,0,0,3,2,3,4,5],[0,2,3,4,5,0,1,2],[0,3,4,5,0,1,2,3],[3,4,5,0,1,2,3,4],
                 [4,5,0,1,2,3,4,5],[5,0,1,2,3,4,5,0],[0,1,2,3,4,5,0,1],[1,2,3,4,5,0,1,2]];
    for (let r = 0; r < 8; r++) { g[r] = []; for (let c = 0; c < 8; c++) g[r][c] = makeCell(pat[r][c]); }
    const res = computeClear(g, null);
    T('L-match creates bomb', !!res && res.specials.length === 1 && res.specials[0].s === S_BOMB,
      res ? 's=' + (res.specials[0] && res.specials[0].s) : 'null');
    // 발동 검증은 꽉 찬 보드 중앙에 폭탄을 직접 배치해 확인
    const g2 = makeBoard(6, mulberry32(555));
    g2[4][4].s = S_BOMB;
    const { cleared } = expandClear(g2, new Set([K(4, 4)]), null);
    T('bomb fires 3x3', cleared.size === 9, 'cleared=' + cleared.size);
  }
  // 6. 캐스케이드 전체 해소: 무작위 보드 스왑 → 안정 상태까지 (매치 잔존 없음)
  {
    let okStable = true, okFilled = true, guard = true;
    for (let s = 100; s < 110; s++) {
      const rr = mulberry32(s);
      const g = makeBoard(6, rr);
      const mv = findValidMove(g);
      swapCells(g, mv[0], mv[1]);
      let iter = 0;
      let res;
      while ((res = computeClear(g, null)) && iter < 40) {
        applyClear(g, res); gravity(g, 6, 0, rr); iter++;
      }
      if (iter >= 40) guard = false;
      if (findRuns(g).length) okStable = false;
      for (const row of g) for (const cell of row) if (!cell) okFilled = false;
    }
    T('cascade resolves to stable (10 seeds)', okStable && guard);
    T('board stays filled after cascades', okFilled);
  }
  // 7. 셔플: 매치 없는 상태 + 유효 이동
  {
    const rr = mulberry32(777);
    const g = makeBoard(6, rr);
    const ok = shuffleBoard(g, rr);
    T('shuffle keeps no-match + valid move', ok && !findRuns(g).length && hasValidMove(g));
  }
  // 8. 점수/레벨 밸런스 스팟체크
  {
    const c1 = levelCfg(1), c5 = levelCfg(5), c10 = levelCfg(10);
    T('level curve rises', c1.target < c5.target && c5.target < c10.target,
      `${c1.target}/${c5.target}/${c10.target}`);
    T('moves shrink with level', c1.moves >= c5.moves && c5.moves >= c10.moves && c10.moves >= 12,
      `${c1.moves}/${c5.moves}/${c10.moves}`);
    T('types 5→6 at level 3', levelCfg(2).types === 5 && levelCfg(3).types === 6);
    T('rank titles span', rankIdx(1) === 0 && rankIdx(12) === 5);
  }
  // 9. 세이브 라운드트립
  {
    const bak = localStorage.getItem(SAVE_KEY);
    SAVE = { nick: 'SIM', best: { score: 1234, level: 3 }, top10: [{ n: 'SIM', s: 1234, l: 3, d: '2026-07-17' }], muted: false };
    storeSave();
    const re = loadSave();
    T('save round-trip', re.nick === 'SIM' && re.best.score === 1234 && re.top10.length === 1);
    const isBest = addRecord('SIM', 2000, 4);
    T('addRecord updates best', isBest && SAVE.best.score === 2000 && SAVE.top10[0].s === 2000);
    if (bak === null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY, bak);
    SAVE = loadSave();
  }
  console.warn(`[SIM] DONE pass=${pass} fail=${fail}`);
}

/* ===== 밸런스 측정 (?test=bal — 무작위 플레이 평균 득점/이동) ===== */
function runBalance() {
  const allMoves = (g) => {
    const list = [];
    for (let r = 0; r < NROW; r++) for (let c = 0; c < NCOL; c++) {
      for (const [rr, cc] of [[r, c + 1], [r + 1, c]]) {
        if (rr >= NROW || cc >= NCOL || !g[r][c] || !g[rr][cc]) continue;
        if (g[r][c].s === S_RAINBOW || g[rr][cc].s === S_RAINBOW) continue; // 단순화: 일반 매치만
        swapCells(g, { r, c }, { r: rr, c: cc });
        if (findRuns(g).length) list.push([{ r, c }, { r: rr, c: cc }]);
        swapCells(g, { r, c }, { r: rr, c: cc });
      }
    }
    return list;
  };
  for (const types of [5, 6]) {
    let total = 0, moves = 0, cascades = 0;
    for (let s = 1; s <= 12; s++) {
      const rr = mulberry32(s * 31);
      const g = makeBoard(types, rr);
      for (let m = 0; m < 22; m++) {
        const list = allMoves(g);
        if (!list.length) { shuffleBoard(g, rr); m--; continue; }
        const mv = list[(rr() * list.length) | 0];
        swapCells(g, mv[0], mv[1]);
        let chain = 1, res;
        while ((res = computeClear(g, [mv[1], mv[0]])) && chain < 30) {
          let count = 0;
          for (const k of res.cleared) if (!res.protectedKeys.has(k)) count++;
          total += count * 30 * chain + res.specials.length * 200;
          if (chain > 1) cascades++;
          applyClear(g, res); gravity(g, types, 0, rr); chain++;
        }
        moves++;
      }
    }
    console.warn(`[BAL] types=${types} avg/move=${(total / moves).toFixed(0)} moves=${moves} cascadeSteps=${cascades}`);
  }
}

/* ===== 실플레이 자동 테스트 (?test=play — 상태머신 통과 검증) ===== */
function runPlayTest() {
  document.getElementById('nick').value = 'TEST';
  rnd = mulberry32(4242);
  startGame();
  // rAF 없이 동기 구동 (헤드리스 가상시간은 rAF를 충분히 돌리지 않음)
  let swaps = 0, t = 0, done = false;
  for (let i = 0; i < 6000; i++) {
    t += 33; step(0.033, t);
    if (G.mode === 'play' && G.phase === 'idle') {
      if (swaps >= 6) { done = true; break; }
      const mv = findValidMove(G.grid);
      if (mv) { trySwap(mv[0], mv[1]); swaps++; }
    }
    if (G.mode === 'results') break; // 조기 게임오버도 유효한 종료
  }
  let filled = true;
  for (const row of G.grid) for (const c of row) if (!c) filled = false;
  console.warn(`[PLAY] ${done || G.mode === 'results' ? 'DONE' : 'TIMEOUT'} swaps=${swaps} level=${G.level} score=${G.score} moves=${G.moves} phase=${G.phase} filled=${filled} leftoverRuns=${findRuns(G.grid).length} hasMove=${hasValidMove(G.grid)}`);
  bgmStop();
}

/* ===== 스크린샷 모드 (?shot=1 — 커버 촬영용 연출 프레임) ===== */
function setupShot() {
  SAVE.nick = 'MENEW';
  document.getElementById('nick').value = 'MENEW';
  rnd = mulberry32(20260717);
  G.mode = 'play'; G.level = 3; G.cfg = levelCfg(3);
  G.moves = 14; G.score = 8420; G.lscore = 2140; G.chain = 3;
  G.grid = makeBoard(6, mulberry32(42));
  // 스페셜 몇 개 심기
  G.grid[2][3].s = S_BOMB;
  G.grid[4][6].s = S_COL;
  G.grid[5][1].s = S_RAINBOW; G.grid[5][1].t = -1;
  showScreen(null); document.body.classList.add('playing');
  updateHUD();
  // 파티클 미리 스폰 후 0.22초 진행시켜 한창 터지는 순간 연출
  const spots = [[1, 5], [3, 2], [6, 4]];
  for (const [r, c] of spots) {
    const [px, py] = cellXY(r, c);
    burst(px, py, G.grid[r][c].t, true);
  }
  popup(...cellXY(3, 2), '+1,080', '#ff8fa3', true);
  banner(`${L.combo} ×3`, 0.7, '#7ed36f');
  const step = 0.22;
  for (const p of particles) p.t = Math.min(p.life * 0.45, step * 0.8);
  for (const p of particles) {
    if (p.kind === 'drop' || p.kind === 'star') {
      p.x += p.vx * p.t; p.y += p.vy * p.t + 0.5 * p.g * p.t * p.t; p.vy += p.g * p.t;
    }
  }
  for (const b of banners) b.t = 0.25;
  for (const p of popups) p.t = 0.2;
  window._SHOT_READY = true;
}

/* ===== 부팅 ===== */
layout();
uiInit();
if (qs.get('test') === 'sim') runSim();
if (qs.get('test') === 'play') runPlayTest();
if (qs.get('test') === 'bal') runBalance();
if (SHOT) setupShot();
requestAnimationFrame((t) => { lastT = t; requestAnimationFrame(frame); });
