'use strict';

/* ============================================================
   SUPER UJA · 슈퍼유자  (AI-built indie game, July 2026)
   - 슈퍼마리오류 횡스크롤 플랫포머 × 조선시대 · 한국 요괴
   - 유자(한복 소녀) 주인공, 유니콘 '유니' 탑승(요시 포지션)
   - 요괴: 처녀귀신·저승사자(갓 슬라이드)·도깨비·달걀귀신·구미호
   - 5 스테이지 + 최종보스 염라대왕, 엽전·복주머니 블록·유자열매
   - 그래픽 전부 캔버스 벡터, 국악풍 합성 BGM/SFX
   - 기록: 닉네임 Top10 + 스테이지 이어하기 자동저장
   ============================================================ */

window.onerror = function (msg, src, line) {
  var e = document.getElementById('err');
  if (e) { e.style.display = 'block'; e.textContent = 'Error: ' + msg + ' (line ' + line + ')'; }
};

/* ===== 다국어 ===== */
const I18N = {
  en: {
    sub: 'JOSEON ADVENTURE', start: '▶ Start Game', cont: '▶ Continue', records: '🏆 Records',
    back: '← Back', retry: '🔄 Play Again', menu: 'Menu', nickPh: 'Nickname',
    help: '<b>←→</b> Move · <b>Space/↑</b> Jump (hold = higher) · <b>Shift</b> Run<br>Stomp on ghosts to defeat them · ride the unicorn <b>Uni</b> for a double jump!<br>🌶️ Chili = tap <b>Shift</b> to shoot fireballs · 🐯 Tiger charm = hold jump to glide<br><b>ESC</b> Pause · 📱 touch controls on mobile',
    credit: 'An indie game built 100% with AI · July 2026 · ',
    expSave: '💾 Export Save', impSave: '📂 Import Save',
    impConfirm: 'Overwrite your current records with this save file?',
    impErr: 'Not a valid SUPER UJA save file', expDone: 'Save file downloaded',
    recNote: 'Records are stored in this browser. Export your save to move them to another computer.',
    colRank: '#', colName: 'NAME', colScore: 'SCORE', colStage: 'STAGE', colDate: 'DATE',
    emptyRec: 'No records yet — go save Joseon!',
    pauseT: '⏸ Paused', resume: '▶ Resume', quit: '🏳 Quit',
    quitConfirm: 'Quit to menu? You can continue from the start of this stage.',
    stages: ['Thatched Village', 'Pine Forest', 'Palace Roofs', 'Underworld Road', "King Yeomra's Palace", 'Plum-Bamboo Grove', 'Snowy Pass', 'Sunset Shore', 'Cloud Skyway', "Queen JJOJJO's Sky Palace"],
    stageLbl: 'STAGE', gameOver: 'GAME OVER', stageClear: 'STAGE CLEAR!', timeBonus: 'Time bonus',
    worldClear: '👑 Queen JJOJJO is defeated! Peace returns to Joseon!', newRecord: '🎉 New personal best!',
    finalScore: 'Score', reachedStage: 'Reached', resTitle: '🍋 Result',
    oneUp: '1UP!', mounted: '🦄 Uni joins you!', bossWarn: '⚡ King Yeomra appears!', bossWarn2: '⚡ Queen JJOJJO appears!',
    lifeLost: 'Try again!', timeUp: "Time's up!",
  },
  ko: {
    sub: '조선 대모험', start: '▶ 게임 시작', cont: '▶ 이어하기', records: '🏆 기록실',
    back: '← 뒤로', retry: '🔄 다시 도전', menu: '메뉴로', nickPh: '닉네임',
    help: '<b>←→</b> 이동 · <b>Space/↑</b> 점프(길게 = 높이) · <b>Shift</b> 달리기<br>요괴는 밟아서 물리치세요 · 유니콘 <b>유니</b>를 타면 2단 점프!<br>🌶️ 고추 = <b>Shift</b> 탭으로 불꽃 발사 · 🐯 호랑이 부적 = 공중에서 점프 길게 눌러 활강<br><b>ESC</b> 일시정지 · 📱 모바일 터치 지원',
    credit: 'AI로 100% 제작한 인디게임 · 2026년 7월 · ',
    expSave: '💾 세이브 내보내기', impSave: '📂 세이브 불러오기',
    impConfirm: '이 세이브 파일로 현재 기록을 덮어쓸까요?',
    impErr: '올바른 슈퍼유자 세이브 파일이 아닙니다', expDone: '세이브 파일이 다운로드되었습니다',
    recNote: '기록은 이 브라우저에 저장됩니다. 다른 컴퓨터로 옮기려면 세이브를 내보내세요.',
    colRank: '순위', colName: '닉네임', colScore: '점수', colStage: '스테이지', colDate: '날짜',
    emptyRec: '아직 기록이 없습니다 — 조선을 구하러 가요!',
    pauseT: '⏸ 일시정지', resume: '▶ 계속하기', quit: '🏳 그만하기',
    quitConfirm: '메뉴로 나갈까요? 이 스테이지 시작부터 이어할 수 있습니다.',
    stages: ['초가마을', '소나무 숲', '궁궐 지붕', '저승길', '염라대왕궁', '매화 대나무숲', '설산 고개', '노을 바닷가', '구름 하늘길', '쪼쪼 여왕의 하늘궁전'],
    stageLbl: '스테이지', gameOver: '게임 오버', stageClear: '스테이지 클리어!', timeBonus: '시간 보너스',
    worldClear: '👑 쪼쪼 여왕을 물리쳤다! 조선에 평화가!', newRecord: '🎉 개인 최고기록 갱신!',
    finalScore: '점수', reachedStage: '도달', resTitle: '🍋 결과',
    oneUp: '생명 +1!', mounted: '🦄 유니가 함께합니다!', bossWarn: '⚡ 염라대왕 등장!', bossWarn2: '⚡ 쪼쪼 여왕 등장!',
    lifeLost: '다시 도전!', timeUp: '시간 초과!',
  },
  ja: {
    sub: '朝鮮大冒険', start: '▶ ゲーム開始', cont: '▶ つづきから', records: '🏆 記録室',
    back: '← 戻る', retry: '🔄 もう一度', menu: 'メニューへ', nickPh: 'ニックネーム',
    help: '<b>←→</b> 移動 · <b>Space/↑</b> ジャンプ(長押し=高く) · <b>Shift</b> ダッシュ<br>妖怪は踏んで倒そう · ユニコーン<b>ユニ</b>に乗ると2段ジャンプ！<br>🌶️ 唐辛子 = <b>Shift</b>で火の玉発射 · 🐯 虎のお守り = 空中でジャンプ長押しで滑空<br><b>ESC</b> 一時停止 · 📱 モバイルタッチ対応',
    credit: 'AIだけで作られたインディーゲーム · 2026年7月 · ',
    expSave: '💾 セーブを書き出す', impSave: '📂 セーブを読み込む',
    impConfirm: 'このセーブファイルで現在の記録を上書きしますか？',
    impErr: '正しいスーパーユジャのセーブファイルではありません', expDone: 'セーブファイルをダウンロードしました',
    recNote: '記録はこのブラウザに保存されます。別のパソコンへはセーブの書き出しで移行できます。',
    colRank: '順位', colName: '名前', colScore: 'スコア', colStage: 'ステージ', colDate: '日付',
    emptyRec: 'まだ記録がありません — 朝鮮を救いに行こう！',
    pauseT: '⏸ 一時停止', resume: '▶ つづける', quit: '🏳 やめる',
    quitConfirm: 'メニューに戻りますか？このステージの最初から再開できます。',
    stages: ['わらぶきの村', '松の森', '宮殿の屋根', '冥途の道', '閻魔大王宮', '梅と竹の林', '雪山峠', '夕焼けの浜辺', '雲の空道', 'チョチョ女王の天空宮'],
    stageLbl: 'ステージ', gameOver: 'ゲームオーバー', stageClear: 'ステージクリア！', timeBonus: 'タイムボーナス',
    worldClear: '👑 チョチョ女王を倒した！朝鮮に平和が！', newRecord: '🎉 自己ベスト更新！',
    finalScore: 'スコア', reachedStage: '到達', resTitle: '🍋 リザルト',
    oneUp: '残機 +1！', mounted: '🦄 ユニが仲間に！', bossWarn: '⚡ 閻魔大王あらわる！', bossWarn2: '⚡ チョチョ女王あらわる！',
    lifeLost: 'もう一度！', timeUp: 'タイムアップ！',
  },
  es: {
    sub: 'AVENTURA EN JOSEON', start: '▶ Empezar', cont: '▶ Continuar', records: '🏆 Récords',
    back: '← Atrás', retry: '🔄 Jugar otra vez', menu: 'Menú', nickPh: 'Apodo',
    help: '<b>←→</b> Moverse · <b>Espacio/↑</b> Saltar (mantén = más alto) · <b>Shift</b> Correr<br>Pisa a los fantasmas para vencerlos · ¡monta a la unicornio <b>Uni</b> para doble salto!<br>🌶️ Chile = pulsa <b>Shift</b> para lanzar bolas de fuego · 🐯 Amuleto de tigre = mantén salto para planear<br><b>ESC</b> Pausa · 📱 controles táctiles en móvil',
    credit: 'Un juego indie creado 100% con IA · Julio de 2026 · ',
    expSave: '💾 Exportar partida', impSave: '📂 Importar partida',
    impConfirm: '¿Sobrescribir tus récords actuales con esta partida?',
    impErr: 'No es un archivo de guardado válido de SUPER UJA', expDone: 'Partida descargada',
    recNote: 'Los récords se guardan en este navegador. Exporta tu partida para llevarlos a otro ordenador.',
    colRank: '#', colName: 'NOMBRE', colScore: 'PUNTOS', colStage: 'FASE', colDate: 'FECHA',
    emptyRec: 'Aún no hay récords — ¡ve a salvar Joseon!',
    pauseT: '⏸ Pausa', resume: '▶ Continuar', quit: '🏳 Salir',
    quitConfirm: '¿Salir al menú? Podrás continuar desde el inicio de esta fase.',
    stages: ['Aldea de paja', 'Bosque de pinos', 'Tejados de palacio', 'Camino al inframundo', 'Palacio del Rey Yeomra', 'Bosque de ciruelos y bambú', 'Paso nevado', 'Costa al atardecer', 'Camino de nubes', 'Palacio celestial de la Reina JJOJJO'],
    stageLbl: 'FASE', gameOver: 'FIN DEL JUEGO', stageClear: '¡FASE SUPERADA!', timeBonus: 'Bono de tiempo',
    worldClear: '👑 ¡La Reina JJOJJO ha caído! ¡La paz vuelve a Joseon!', newRecord: '🎉 ¡Nueva mejor marca!',
    finalScore: 'Puntuación', reachedStage: 'Alcanzado', resTitle: '🍋 Resultado',
    oneUp: '¡Vida extra!', mounted: '🦄 ¡Uni se une a ti!', bossWarn: '⚡ ¡Aparece el Rey Yeomra!', bossWarn2: '⚡ ¡Aparece la Reina JJOJJO!',
    lifeLost: '¡Inténtalo de nuevo!', timeUp: '¡Se acabó el tiempo!',
  },
  zh: {
    sub: '朝鲜大冒险', start: '▶ 开始游戏', cont: '▶ 继续游戏', records: '🏆 记录室',
    back: '← 返回', retry: '🔄 再来一次', menu: '菜单', nickPh: '昵称',
    help: '<b>←→</b> 移动 · <b>空格/↑</b> 跳跃(长按=更高) · <b>Shift</b> 奔跑<br>踩到妖怪就能打倒它们 · 骑上独角兽<b>Uni</b>可以二段跳！<br>🌶️ 辣椒 = 按<b>Shift</b>发射火球 · 🐯 虎符 = 空中长按跳跃滑翔<br><b>ESC</b> 暂停 · 📱 移动端触控支持',
    credit: '100% 由 AI 制作的独立游戏 · 2026年7月 · ',
    expSave: '💾 导出存档', impSave: '📂 导入存档',
    impConfirm: '用此存档覆盖当前记录？',
    impErr: '不是有效的超级柚子存档文件', expDone: '存档已下载',
    recNote: '记录保存在此浏览器中。导出存档即可迁移到其他电脑。',
    colRank: '#', colName: '昵称', colScore: '分数', colStage: '关卡', colDate: '日期',
    emptyRec: '还没有记录——快去拯救朝鲜吧！',
    pauseT: '⏸ 暂停', resume: '▶ 继续', quit: '🏳 退出',
    quitConfirm: '返回菜单？可以从本关开头继续。',
    stages: ['草屋村', '松树林', '宫殿屋顶', '黄泉路', '阎罗大王宫', '梅花竹林', '雪山垭口', '落日海边', '云中天路', '啾啾女王的天空宫'],
    stageLbl: '关卡', gameOver: '游戏结束', stageClear: '过关！', timeBonus: '时间奖励',
    worldClear: '👑 打败了啾啾女王！朝鲜恢复了和平！', newRecord: '🎉 刷新个人最佳！',
    finalScore: '分数', reachedStage: '到达', resTitle: '🍋 结算',
    oneUp: '生命 +1！', mounted: '🦄 Uni加入了！', bossWarn: '⚡ 阎罗大王出现！', bossWarn2: '⚡ 啾啾女王出现！',
    lifeLost: '再试一次！', timeUp: '时间到！',
  },
};
let LANG = new URLSearchParams(location.search).get('lang');
if (!I18N[LANG]) LANG = (navigator.language || 'en').slice(0, 2);
if (!I18N[LANG]) LANG = 'en';
const L = I18N[LANG];

/* ===== 상수 ===== */
const TILE = 32, ROWS = 15, VH = ROWS * TILE; // 480
const GRAV = 1900, JUMP_V = 570, RUN = 235, WALK = 145;
const REC_KEY = 'uja_save', GAME_KEY = 'uja_game';
const qs = new URLSearchParams(location.search);
const SHOT = qs.has('shot');

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ===== 기록 ===== */
function loadRec() {
  try { const s = JSON.parse(localStorage.getItem(REC_KEY)); if (s && Array.isArray(s.top10)) return s; } catch (e) {}
  return { nick: '', top10: [], muted: false, best: 0 };
}
function storeRec() { try { localStorage.setItem(REC_KEY, JSON.stringify(REC)); } catch (e) {} }
let REC = loadRec();
function addRecord(score, stage) {
  const nick = REC.nick || 'UJA';
  const isBest = score > (REC.best || 0);
  if (isBest) REC.best = score;
  REC.top10.push({ n: nick, s: score, g: stage, d: new Date().toISOString().slice(0, 10) });
  REC.top10.sort((a, b) => b.s - a.s); REC.top10 = REC.top10.slice(0, 10);
  storeRec();
  return isBest;
}

/* ============================================================
   오디오 (국악풍 합성)
   ============================================================ */
let AC = null, bgmGain = null, bgmTimer = null, bgmBeat = 0, bgmBoss = false;
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  bgmGain = AC.createGain(); bgmGain.gain.value = 0; bgmGain.connect(AC.destination);
}
function muted() { return REC.muted; }
function tone(f0, dur, type, gain, f1, when) {
  if (!AC || muted()) return;
  const t0 = when || AC.currentTime;
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t0);
  if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  gn.gain.setValueAtTime(0, t0);
  gn.gain.linearRampToValueAtTime(gain || 0.13, t0 + 0.01);
  gn.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(gn); gn.connect(AC.destination);
  o.start(t0); o.stop(t0 + dur + 0.03);
}
function noiseS(dur, ff, gain, slide) {
  if (!AC || muted()) return;
  const t0 = AC.currentTime;
  const len = Math.max(1, (AC.sampleRate * dur) | 0);
  const buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource(); src.buffer = buf;
  const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(ff, t0);
  if (slide) f.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  const gn = AC.createGain();
  gn.gain.setValueAtTime(gain || 0.15, t0);
  gn.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f); f.connect(gn); gn.connect(AC.destination);
  src.start(t0);
}
const sfx = {
  jump() { tone(340, 0.16, 'square', 0.07, 760); },
  stomp() { noiseS(0.1, 900, 0.16, 250); tone(300, 0.1, 'sine', 0.14, 120); },
  coin() { tone(1318, 0.08, 'triangle', 0.12); tone(1760, 0.16, 'triangle', 0.11, undefined, AC ? AC.currentTime + 0.06 : 0); },
  power() { if (!AC || muted()) return; [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.11, undefined, AC.currentTime + i * 0.06)); },
  flame() { if (!AC || muted()) return; [660, 880, 1100, 1320, 1560].forEach((f, i) => tone(f, 0.1, 'sine', 0.09, undefined, AC.currentTime + i * 0.04)); },
  hurt() { tone(420, 0.22, 'sawtooth', 0.1, 140); },
  die() { if (!AC || muted()) return; [660, 494, 392, 262].forEach((f, i) => tone(f, 0.22, 'square', 0.08, undefined, AC.currentTime + i * 0.12)); },
  bump() { tone(140, 0.08, 'sine', 0.12, 90); },
  brk() { noiseS(0.16, 1400, 0.16, 300); },
  kick() { noiseS(0.08, 700, 0.1, 2000); },
  mount() { tone(523, 0.1, 'triangle', 0.11, 784); tone(784, 0.14, 'triangle', 0.1, 1047, AC ? AC.currentTime + 0.09 : 0); },
  oneUp() { if (!AC || muted()) return; [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.1, 'square', 0.07, undefined, AC.currentTime + i * 0.07)); },
  clear() { if (!AC || muted()) return; [440, 523, 587, 659, 880, 1047].forEach((f, i) => tone(f, 0.24, 'triangle', 0.12, undefined, AC.currentTime + i * 0.1)); },
  bossHit() { tone(180, 0.3, 'sawtooth', 0.16, 60); noiseS(0.25, 500, 0.2, 100); },
  bossDie() { if (!AC || muted()) return; noiseS(0.8, 400, 0.25, 60); [220, 185, 147, 110].forEach((f, i) => tone(f, 0.4, 'sawtooth', 0.1, undefined, AC.currentTime + i * 0.2)); },
  throwP() { noiseS(0.12, 1800, 0.07, 500); },
  warn() { tone(110, 0.5, 'sawtooth', 0.13, 90); tone(220, 0.5, 'sawtooth', 0.07, 180); },
  fire() { noiseS(0.12, 900, 0.1, 2200); tone(500, 0.09, 'square', 0.06, 900); },
  shot() { noiseS(0.06, 1600, 0.13, 350); tone(240, 0.05, 'square', 0.05, 110); },
};
/* BGM: A단조 펜타토닉(국악풍) + 장구 리듬 · 보스전 변주 */
const PENTA = [220, 262, 294, 330, 392, 440, 523, 587];
const MELO = (() => {
  const rg = mulberry32(777); const arr = [];
  for (let i = 0; i < 64; i++) {
    if (i % 2 === 0 || rg() < 0.4) arr.push(PENTA[(rg() * 6) | 0 + (i % 16 === 14 ? 1 : 0)]);
    else arr.push(0);
  }
  return arr;
})();
function bgmSchedule() {
  if (!AC) return;
  const bpm = bgmBoss ? 138 : 104;
  const step = 60 / bpm / 2;
  const ahead = AC.currentTime + 0.35;
  while (bgmSchedule.next < ahead) {
    const t = bgmSchedule.next, i = bgmBeat % 64;
    const f = MELO[i];
    if (f) {
      const o = AC.createOscillator(), gn = AC.createGain();
      o.type = bgmBoss ? 'sawtooth' : 'square';
      o.frequency.value = bgmBoss ? f * 0.5 : f;
      gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(bgmBoss ? 0.045 : 0.05, t + 0.015);
      gn.gain.exponentialRampToValueAtTime(0.001, t + step * 1.6);
      o.connect(gn); gn.connect(bgmGain); o.start(t); o.stop(t + step * 2);
    }
    // 장구: 덩(저음) - 덕(고음)
    if (i % 8 === 0 || (bgmBoss && i % 8 === 6)) {
      const o = AC.createOscillator(), gn = AC.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.09);
      gn.gain.setValueAtTime(0.12, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(gn); gn.connect(bgmGain); o.start(t); o.stop(t + 0.14);
    }
    if (i % 8 === 4) {
      const len = (AC.sampleRate * 0.05) | 0;
      const buf = AC.createBuffer(1, len, AC.sampleRate); const d = buf.getChannelData(0);
      for (let j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / len);
      const src = AC.createBufferSource(); src.buffer = buf;
      const hf = AC.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 3000;
      const gn = AC.createGain(); gn.gain.value = 0.06;
      src.connect(hf); hf.connect(gn); gn.connect(bgmGain); src.start(t);
    }
    bgmSchedule.next += step; bgmBeat++;
  }
}
function bgmStart(boss) {
  bgmBoss = !!boss;
  if (!AC) return;
  if (!bgmTimer) {
    bgmSchedule.next = AC.currentTime + 0.05; bgmBeat = 0;
    bgmTimer = setInterval(bgmSchedule, 100);
  }
  bgmGain.gain.cancelScheduledValues(AC.currentTime);
  bgmGain.gain.setTargetAtTime(muted() ? 0 : 1, AC.currentTime, 0.4);
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
   스프라이트 공장 (전부 벡터 드로잉, 2x 해상도)
   ============================================================ */
const SPR = {};
function mk(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w * 2; c.height = h * 2;
  const x = c.getContext('2d');
  x.scale(2, 2);
  x.lineJoin = 'round'; x.lineCap = 'round';
  fn(x, w, h);
  return c;
}
function rr(x, a, b, w, h, r) {
  x.beginPath();
  x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
}
/* 유자: 한복 소녀 (frame 0 idle/걷기1, 1 걷기2, 2 점프)
   form: 0 기본 · 1 유자열매 · 2 매운고추(불꽃) · 3 호랑이 부적(활강) */
const UJA_FORMS = [
  { jeog: '#fff6dc', jeogD: '#f0dcae', chima: '#f2688a', chimaD: '#cf4568', rib: '#ff8aa8', gorum: '#e8556a' },
  { jeog: '#ffd968', jeogD: '#efb83e', chima: '#e0344a', chimaD: '#b32038', rib: '#ff5d2e', gorum: '#c02020' },
  { jeog: '#ffb03c', jeogD: '#f0871a', chima: '#e83a20', chimaD: '#b8240e', rib: '#ffd34d', gorum: '#a01808', fire: 1 },
  { jeog: '#ffcf6e', jeogD: '#eda63a', chima: '#c8742a', chimaD: '#9c5616', rib: '#ff9a3c', gorum: '#8a4a10', tiger: 1 },
];
function drawUja(x, w, h, frame, form) {
  const F = UJA_FORMS[form] || UJA_FORMS[0];
  const legL = frame === 1 ? 3 : 0, legR = frame === 1 ? 0 : 3;
  const jump = frame === 2;
  const OUT = 'rgba(94,44,58,.5)';
  // 다리 (버선+꽃신)
  x.fillStyle = '#fff';
  x.fillRect(9, h - 8 - (jump ? 2 : legL), 4, 6);
  x.fillRect(17, h - 8 - (jump ? 2 : legR), 4, 6);
  x.fillStyle = '#c0392b';
  rr(x, 8, h - 4.6 - (jump ? 2 : legL), 6, 3.2, 1.4); x.fill();
  rr(x, 16, h - 4.6 - (jump ? 2 : legR), 6, 3.2, 1.4); x.fill();
  x.fillStyle = 'rgba(255,255,255,.5)';
  x.fillRect(9, h - 4 - (jump ? 2 : legL), 2, 1);
  x.fillRect(17, h - 4 - (jump ? 2 : legR), 2, 1);
  // 치마 (플레어 + 그라데이션 + 주름)
  const cg = x.createLinearGradient(0, 16, 0, h - 6);
  cg.addColorStop(0, F.chima); cg.addColorStop(1, F.chimaD);
  x.fillStyle = cg;
  x.beginPath();
  x.moveTo(10, 16); x.lineTo(20, 16);
  x.quadraticCurveTo(23 + (jump ? 2 : 0), 22, 24 + (jump ? 2 : 0), h - 6);
  x.lineTo(6 - (jump ? 2 : 0), h - 6);
  x.quadraticCurveTo(7 - (jump ? 2 : 0), 22, 10, 16);
  x.closePath(); x.fill();
  x.strokeStyle = OUT; x.lineWidth = 1; x.stroke();
  x.strokeStyle = 'rgba(0,0,0,.14)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(13, 19); x.quadraticCurveTo(12, 24, 11, h - 7); x.stroke();
  x.beginPath(); x.moveTo(18, 19); x.quadraticCurveTo(19, 24, 20, h - 7); x.stroke();
  // 치맛단 장식
  if (F.fire) { // 불꽃 자락
    x.fillStyle = '#ffd34d';
    for (let k = 0; k < 4; k++) {
      x.beginPath(); x.moveTo(8 + k * 4.4, h - 6); x.lineTo(10 + k * 4.4, h - 10); x.lineTo(12 + k * 4.4, h - 6); x.closePath(); x.fill();
    }
  } else if (F.tiger) { // 호랑이 줄무늬
    x.strokeStyle = '#6a3808'; x.lineWidth = 1.8;
    x.beginPath(); x.moveTo(9, 22); x.lineTo(13, 24); x.stroke();
    x.beginPath(); x.moveTo(21, 22); x.lineTo(17, 24); x.stroke();
    x.beginPath(); x.moveTo(8, 27); x.lineTo(12, 29); x.stroke();
    x.beginPath(); x.moveTo(22, 27); x.lineTo(18, 29); x.stroke();
  } else {
    x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.3;
    x.beginPath(); x.moveTo(7, h - 7.6); x.lineTo(23, h - 7.6); x.stroke();
  }
  // 저고리 (그라데이션 + 윤곽)
  const jg = x.createLinearGradient(0, 12, 0, 20);
  jg.addColorStop(0, F.jeog); jg.addColorStop(1, F.jeogD);
  x.fillStyle = jg;
  rr(x, 8, 12, 14, 8, 3); x.fill();
  x.strokeStyle = OUT; x.lineWidth = 0.9; x.stroke();
  // 동정(흰 깃) + 고름
  x.strokeStyle = '#fff'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(15, 13); x.lineTo(13, 18); x.stroke();
  x.beginPath(); x.moveTo(15, 13); x.lineTo(17, 18); x.stroke();
  x.strokeStyle = F.gorum; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(15, 17); x.lineTo(13, 21); x.stroke();
  x.beginPath(); x.moveTo(15, 17); x.lineTo(15.8, 20.4); x.stroke();
  // 팔 (소매 끝동)
  x.strokeStyle = F.jeog; x.lineWidth = 3.6;
  if (jump) {
    x.beginPath(); x.moveTo(9, 15); x.lineTo(4, 10); x.stroke();
    x.beginPath(); x.moveTo(21, 15); x.lineTo(26, 10); x.stroke();
    x.strokeStyle = F.gorum; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(5.2, 11.2); x.lineTo(4, 10); x.stroke();
    x.beginPath(); x.moveTo(24.8, 11.2); x.lineTo(26, 10); x.stroke();
    x.fillStyle = '#ffe3cd';
    x.beginPath(); x.arc(3.4, 9.4, 1.5, 0, 6.283); x.fill();
    x.beginPath(); x.arc(26.6, 9.4, 1.5, 0, 6.283); x.fill();
  } else {
    x.beginPath(); x.moveTo(9, 15); x.lineTo(6, 20); x.stroke();
    x.beginPath(); x.moveTo(21, 15); x.lineTo(24, 20); x.stroke();
    x.strokeStyle = F.gorum; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(6.6, 19); x.lineTo(6, 20); x.stroke();
    x.beginPath(); x.moveTo(23.4, 19); x.lineTo(24, 20); x.stroke();
    x.fillStyle = '#ffe3cd';
    x.beginPath(); x.arc(5.8, 21.2, 1.5, 0, 6.283); x.fill();
    x.beginPath(); x.arc(24.2, 21.2, 1.5, 0, 6.283); x.fill();
  }
  // 얼굴 (은은한 입체)
  const fg = x.createRadialGradient(13.4, 6.4, 2, 15, 8, 8);
  fg.addColorStop(0, '#fff2e4'); fg.addColorStop(1, '#ffdcc0');
  x.fillStyle = fg;
  x.beginPath(); x.arc(15, 8, 7, 0, 6.283); x.fill();
  // 머리(단발) + 앞머리 + 윤기
  const hg = x.createLinearGradient(0, 0, 0, 14);
  hg.addColorStop(0, '#3c2418'); hg.addColorStop(1, '#1d120c');
  x.fillStyle = hg;
  x.beginPath(); x.arc(15, 6.4, 7.2, Math.PI * 0.95, Math.PI * 2.05); x.fill();
  x.beginPath(); x.moveTo(7.8, 6); x.quadraticCurveTo(8, 13, 10, 14);
  x.lineTo(10.5, 8); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(22.2, 6); x.quadraticCurveTo(22, 13, 20, 14);
  x.lineTo(19.5, 8); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 1.2;
  x.beginPath(); x.arc(14.4, 5.6, 5.2, Math.PI * 1.18, Math.PI * 1.62); x.stroke();
  // 호랑이 후드 (귀)
  if (F.tiger) {
    x.fillStyle = '#f5a256';
    x.beginPath(); x.arc(15, 5.6, 7.6, Math.PI * 0.98, Math.PI * 2.02); x.fill();
    x.strokeStyle = '#6a3808'; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(11, 1.6); x.lineTo(12.6, 3.6); x.stroke();
    x.beginPath(); x.moveTo(15, 0.8); x.lineTo(15, 3); x.stroke();
    x.beginPath(); x.moveTo(19, 1.6); x.lineTo(17.4, 3.6); x.stroke();
    x.fillStyle = '#f5a256';
    x.beginPath(); x.arc(9.4, 1.8, 2.6, 0, 6.283); x.fill();
    x.beginPath(); x.arc(20.6, 1.8, 2.6, 0, 6.283); x.fill();
    x.fillStyle = '#fff0d8';
    x.beginPath(); x.arc(9.4, 1.8, 1.2, 0, 6.283); x.fill();
    x.beginPath(); x.arc(20.6, 1.8, 1.2, 0, 6.283); x.fill();
  }
  // 댕기 리본
  x.fillStyle = F.rib;
  x.beginPath(); x.arc(21.5, 3.6, 2.1, 0, 6.283); x.fill();
  x.beginPath(); x.arc(24.2, 5.2, 1.7, 0, 6.283); x.fill();
  x.strokeStyle = F.rib; x.lineWidth = 1.3;
  x.beginPath(); x.moveTo(24.6, 6.4); x.quadraticCurveTo(25.6, 9, 24.6, 11.4); x.stroke();
  // 눈 (반짝이 하이라이트 2개) + 속눈썹
  x.fillStyle = '#241a16';
  x.beginPath(); x.ellipse(12.3, 8.4, 1.5, 1.75, 0, 0, 6.283); x.fill();
  x.beginPath(); x.ellipse(17.7, 8.4, 1.5, 1.75, 0, 0, 6.283); x.fill();
  x.strokeStyle = '#241a16'; x.lineWidth = 0.8;
  x.beginPath(); x.moveTo(10.6, 7); x.lineTo(11.4, 7.5); x.stroke();
  x.beginPath(); x.moveTo(19.4, 7); x.lineTo(18.6, 7.5); x.stroke();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(12.8, 7.8, 0.62, 0, 6.283); x.fill();
  x.beginPath(); x.arc(18.2, 7.8, 0.62, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,.7)';
  x.beginPath(); x.arc(11.8, 9, 0.32, 0, 6.283); x.fill();
  x.beginPath(); x.arc(17.2, 9, 0.32, 0, 6.283); x.fill();
  // 볼터치 + 입
  x.fillStyle = 'rgba(255,120,132,.42)';
  x.beginPath(); x.ellipse(10.5, 10.5, 1.6, 1.1, 0, 0, 6.283); x.fill();
  x.beginPath(); x.ellipse(19.5, 10.5, 1.6, 1.1, 0, 0, 6.283); x.fill();
  if (jump) {
    x.fillStyle = '#c0392b';
    x.beginPath(); x.ellipse(15, 11, 1.3, 1.6, 0, 0, 6.283); x.fill();
    x.fillStyle = '#ff8a8a';
    x.beginPath(); x.ellipse(15, 11.8, 0.8, 0.7, 0, 0, 6.283); x.fill();
  } else {
    x.strokeStyle = '#b0524a'; x.lineWidth = 1;
    x.beginPath(); x.arc(15, 10.4, 1.6, 0.25, Math.PI - 0.25); x.stroke();
  }
}
/* 처녀귀신 */
function drawGhost(x, w, h, frame) {
  const bob = frame ? 1 : 0;
  x.fillStyle = 'rgba(240,244,252,.94)';
  x.beginPath();
  x.moveTo(5, 8 + bob); x.quadraticCurveTo(14, -2 + bob, 23, 8 + bob);
  x.lineTo(24, h - 4); x.quadraticCurveTo(19, h - 7, 14, h - 4);
  x.quadraticCurveTo(9, h - 7, 4, h - 4); x.closePath(); x.fill();
  // 긴 검은 머리
  x.fillStyle = '#1c1218';
  x.beginPath(); x.moveTo(6, 6 + bob); x.quadraticCurveTo(14, -3 + bob, 22, 6 + bob);
  x.lineTo(22, 16 + bob); x.lineTo(19, 9 + bob); x.lineTo(17, 13 + bob);
  x.lineTo(14, 6 + bob); x.lineTo(11, 13 + bob); x.lineTo(9, 9 + bob); x.lineTo(6, 16 + bob);
  x.closePath(); x.fill();
  // 창백한 얼굴 + 입술
  x.fillStyle = '#f4f0ec';
  x.beginPath(); x.arc(14, 10 + bob, 4.6, 0, 6.283); x.fill();
  x.fillStyle = '#1c1218';
  x.beginPath(); x.arc(12.4, 9.6 + bob, 0.9, 0, 6.283); x.fill();
  x.beginPath(); x.arc(15.6, 9.6 + bob, 0.9, 0, 6.283); x.fill();
  x.fillStyle = '#c0392b';
  x.beginPath(); x.arc(14, 12.4 + bob, 1, 0, 6.283); x.fill();
}
/* 저승사자 */
function drawReaper(x, w, h, frame) {
  const step = frame ? 1.4 : 0;
  // 도포
  x.fillStyle = '#181820';
  x.beginPath();
  x.moveTo(7, 12); x.lineTo(21, 12); x.lineTo(24, h - 2 - step); x.lineTo(4, h - 2 + step);
  x.closePath(); x.fill();
  // 얼굴
  x.fillStyle = '#cfd6de';
  x.beginPath(); x.arc(14, 10, 4.6, 0, 6.283); x.fill();
  x.fillStyle = '#111';
  x.beginPath(); x.arc(12.4, 9.6, 0.9, 0, 6.283); x.fill();
  x.beginPath(); x.arc(15.8, 9.6, 0.9, 0, 6.283); x.fill();
  // 갓
  x.fillStyle = '#0c0c10';
  x.beginPath(); x.ellipse(14, 6, 10, 2.4, 0, 0, 6.283); x.fill();
  rr(x, 10, 0, 8, 6.4, 2); x.fill();
  x.strokeStyle = '#0c0c10'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(11, 8); x.lineTo(13, 13); x.stroke();
  x.beginPath(); x.moveTo(17, 8); x.lineTo(15, 13); x.stroke();
}
/* 갓 (등껍질 대체 슬라이드) */
function drawHat(x, w, h) {
  x.fillStyle = '#0c0c10';
  x.beginPath(); x.ellipse(13, h - 5, 12, 4, 0, 0, 6.283); x.fill();
  rr(x, 8, 2, 10, h - 8, 3); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 1.2;
  x.beginPath(); x.ellipse(13, h - 5, 9, 2.6, 0, Math.PI, Math.PI * 2); x.stroke();
}
/* 도깨비 */
function drawDokkaebi(x, w, h, frame) {
  const hop = frame ? -1.5 : 0;
  // 몸
  x.fillStyle = '#d95848';
  x.beginPath(); x.arc(14, 14 + hop, 9, 0, 6.283); x.fill();
  // 호피 바지
  x.fillStyle = '#e8b34a';
  x.fillRect(7, 18 + hop, 14, 7);
  x.fillStyle = '#7a5218';
  x.fillRect(9, 19 + hop, 2.4, 2.4); x.fillRect(14, 21 + hop, 2.4, 2.4); x.fillRect(18, 19 + hop, 2.4, 2.4);
  // 다리
  x.fillStyle = '#d95848';
  x.fillRect(9, h - 6, 4, 5); x.fillRect(16, h - 6, 4, 5);
  // 뿔 + 곱슬머리
  x.fillStyle = '#f5e6c8';
  x.beginPath(); x.moveTo(14, 1 + hop); x.lineTo(12, 6 + hop); x.lineTo(16, 6 + hop); x.closePath(); x.fill();
  x.fillStyle = '#7a3428';
  x.beginPath(); x.arc(10, 7 + hop, 2.4, 0, 6.283); x.arc(14, 6 + hop, 2.6, 0, 6.283); x.arc(18, 7 + hop, 2.4, 0, 6.283); x.fill();
  // 얼굴
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(11, 12 + hop, 1.6, 0, 6.283); x.fill();
  x.beginPath(); x.arc(17, 12 + hop, 1.6, 0, 6.283); x.fill();
  x.fillStyle = '#241a16';
  x.beginPath(); x.arc(11.3, 12.3 + hop, 0.8, 0, 6.283); x.fill();
  x.beginPath(); x.arc(17.3, 12.3 + hop, 0.8, 0, 6.283); x.fill();
  x.strokeStyle = '#fff'; x.lineWidth = 1.4;
  x.beginPath(); x.arc(14, 15.6 + hop, 2.6, 0.15, Math.PI - 0.15); x.stroke(); // 씩 웃음+이빨
  // 방망이
  x.fillStyle = '#8a6a3a';
  x.save(); x.translate(23, 12 + hop); x.rotate(0.5);
  rr(x, -2, -9, 4.6, 12, 2); x.fill();
  x.fillStyle = '#6a4a24';
  x.beginPath(); x.arc(-0.5, -7, 0.8, 0, 6.283); x.arc(1.4, -3.4, 0.8, 0, 6.283); x.fill();
  x.restore();
}
/* 달걀귀신 (얼굴 없는 달걀) */
function drawEgg(x, w, h, frame) {
  const bob = frame ? 1.2 : 0;
  x.fillStyle = 'rgba(200,210,230,.4)';
  x.beginPath(); x.ellipse(13, h / 2 + bob + 4, 11, 12, 0, 0, 6.283); x.fill();
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#fbf6ee'); g.addColorStop(1, '#d8ccc0');
  x.fillStyle = g;
  x.beginPath(); x.ellipse(13, h / 2 + bob, 9, 12, 0, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,.5)';
  x.beginPath(); x.ellipse(10, h / 2 - 5 + bob, 2.6, 4, -0.4, 0, 6.283); x.fill();
}
/* 구미호 */
function drawFox(x, w, h, frame) {
  const step = frame ? 1.4 : -1.4;
  // 꼬리 아홉 갈래 부채
  x.fillStyle = '#f5a256';
  for (let i = -2; i <= 2; i++) {
    x.save(); x.translate(26, 14); x.rotate(-0.5 + i * 0.3);
    x.beginPath(); x.ellipse(6, 0, 7, 2.6, 0, 0, 6.283); x.fill();
    x.restore();
  }
  x.fillStyle = '#fff';
  for (let i = -2; i <= 2; i++) {
    x.save(); x.translate(26, 14); x.rotate(-0.5 + i * 0.3);
    x.beginPath(); x.ellipse(11, 0, 2.2, 1.4, 0, 0, 6.283); x.fill();
    x.restore();
  }
  // 몸
  x.fillStyle = '#f5a256';
  rr(x, 6, 12, 20, 10, 5); x.fill();
  // 다리
  x.fillRect(9, 20 + Math.max(0, step), 3.4, 6 - Math.max(0, step));
  x.fillRect(19, 20 + Math.max(0, -step), 3.4, 6 - Math.max(0, -step));
  // 머리
  x.beginPath(); x.arc(8, 10, 6.4, 0, 6.283); x.fill();
  // 귀
  x.beginPath(); x.moveTo(3.4, 6); x.lineTo(5, 0.6); x.lineTo(8, 5); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(12.6, 6); x.lineTo(11, 0.6); x.lineTo(8, 5); x.closePath(); x.fill();
  // 흰 주둥이 + 눈
  x.fillStyle = '#fff';
  x.beginPath(); x.ellipse(6, 12.4, 3.6, 2.6, 0, 0, 6.283); x.fill();
  x.fillStyle = '#241a16';
  x.beginPath(); x.arc(3.6, 12, 0.9, 0, 6.283); x.fill();
  x.beginPath(); x.arc(5.6, 9, 1, 0, 6.283); x.fill();
  x.beginPath(); x.arc(10, 9, 1, 0, 6.283); x.fill();
}
/* 유니콘 '유니' */
function drawUnicorn(x, w, h, frame) {
  const step = frame ? 2 : -2;
  // 다리 (발굽)
  x.fillStyle = '#f6f2f8';
  x.fillRect(8, 20 + Math.max(0, step), 4, 10 - Math.max(0, step));
  x.fillRect(24, 20 + Math.max(0, -step), 4, 10 - Math.max(0, -step));
  x.fillRect(13, 21 + Math.max(0, -step), 4, 9 - Math.max(0, -step));
  x.fillRect(19, 21 + Math.max(0, step), 4, 9 - Math.max(0, step));
  x.fillStyle = '#d8c8ea';
  x.fillRect(8, 28 + Math.max(0, step) - Math.max(0, step), 4, 2);
  x.fillRect(24, 28, 4, 2); x.fillRect(13, 28, 4, 2); x.fillRect(19, 28, 4, 2);
  // 꼬리 (무지개 3색)
  x.strokeStyle = '#ff9cc8'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(29, 15); x.quadraticCurveTo(35, 17, 33, 24); x.stroke();
  x.strokeStyle = '#c883f0'; x.lineWidth = 1.8;
  x.beginPath(); x.moveTo(29.5, 16); x.quadraticCurveTo(34, 18, 32.5, 23); x.stroke();
  x.strokeStyle = '#7ae0f0'; x.lineWidth = 1.1;
  x.beginPath(); x.moveTo(29, 17); x.quadraticCurveTo(33, 19, 31.8, 22.6); x.stroke();
  // 몸 (입체 그라데이션)
  const bg2 = x.createLinearGradient(0, 12, 0, 23);
  bg2.addColorStop(0, '#ffffff'); bg2.addColorStop(1, '#e2d6f0');
  x.fillStyle = bg2;
  rr(x, 6, 12, 24, 11, 6); x.fill();
  x.strokeStyle = 'rgba(150,120,180,.4)'; x.lineWidth = 0.9;
  rr(x, 6, 12, 24, 11, 6); x.stroke();
  // 목+머리
  x.fillStyle = '#f8f4fc';
  x.beginPath(); x.moveTo(8, 14); x.lineTo(4, 4); x.lineTo(12, 8); x.closePath(); x.fill();
  x.beginPath(); x.ellipse(5.4, 5, 5, 3.6, -0.3, 0, 6.283); x.fill();
  // 갈기 (무지개)
  x.fillStyle = '#ff9cc8';
  x.beginPath(); x.arc(8.6, 3.4, 2.3, 0, 6.283); x.fill();
  x.fillStyle = '#c883f0';
  x.beginPath(); x.arc(10.4, 6.4, 2.3, 0, 6.283); x.fill();
  x.fillStyle = '#7ae0f0';
  x.beginPath(); x.arc(11.6, 9.8, 2.3, 0, 6.283); x.fill();
  // 뿔 (금색 그라데이션)
  const hg2 = x.createLinearGradient(-1, -3, 5, 3);
  hg2.addColorStop(0, '#fff0b0'); hg2.addColorStop(1, '#f0b830');
  x.fillStyle = hg2;
  x.beginPath(); x.moveTo(3.4, 2.6); x.lineTo(-0.8, -2.8); x.lineTo(5.4, 0.6); x.closePath(); x.fill();
  // 눈 (하이라이트+속눈썹) + 볼 + 코
  x.fillStyle = '#241a16';
  x.beginPath(); x.ellipse(3.6, 4.6, 1.1, 1.3, 0, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(3.9, 4.2, 0.45, 0, 6.283); x.fill();
  x.strokeStyle = '#241a16'; x.lineWidth = 0.7;
  x.beginPath(); x.moveTo(2.2, 3.2); x.lineTo(2.9, 3.7); x.stroke();
  x.fillStyle = 'rgba(255,150,170,.5)';
  x.beginPath(); x.ellipse(2.2, 6.6, 1.2, 0.8, 0, 0, 6.283); x.fill();
  x.fillStyle = '#f0b8c8';
  x.beginPath(); x.arc(0.8, 6, 1, 0, 6.283); x.fill();
  // 안장 (색동)
  x.fillStyle = '#e8556a'; rr(x, 14, 11, 9, 5, 2); x.fill();
  x.fillStyle = '#4aa8d8'; x.fillRect(14, 13, 9, 1.4);
  x.fillStyle = '#ffd34d'; x.fillRect(14, 14.6, 9, 1.2);
}
/* 쪼쪼(JJOJJO) 여왕 보스: 아름다운 여왕 + 황금 기관총
   frame 0/1 걷기(드레스 흔들림), 2 발사(총구 화염) */
function drawJjojjo(x, w, h, frame) {
  const sway = frame === 1 ? 2 : 0;
  const firing = frame === 2;
  const cxm = w / 2 - 4; // 몸 중심 (오른쪽에 총 공간)
  // 긴 흑발 (뒤로 흐르는)
  const hgr = x.createLinearGradient(0, 4, 0, h);
  hgr.addColorStop(0, '#2c1a2e'); hgr.addColorStop(1, '#120a16');
  x.fillStyle = hgr;
  x.beginPath();
  x.moveTo(cxm - 9, 8); x.quadraticCurveTo(cxm - 15, 24 + sway, cxm - 12, h - 8);
  x.quadraticCurveTo(cxm - 8, h - 4, cxm - 6, h - 10);
  x.lineTo(cxm - 6, 16); x.closePath(); x.fill();
  x.beginPath();
  x.moveTo(cxm + 9, 8); x.quadraticCurveTo(cxm + 14, 22 - sway, cxm + 11, h - 12);
  x.quadraticCurveTo(cxm + 8, h - 8, cxm + 6, h - 12);
  x.lineTo(cxm + 6, 16); x.closePath(); x.fill();
  // 드레스 (보라→금 대례복)
  const dg = x.createLinearGradient(0, 20, 0, h - 2);
  dg.addColorStop(0, '#7a2a8e'); dg.addColorStop(0.75, '#5a1a6e'); dg.addColorStop(1, '#42104e');
  x.fillStyle = dg;
  x.beginPath();
  x.moveTo(cxm - 7, 22); x.lineTo(cxm + 7, 22);
  x.quadraticCurveTo(cxm + 13 + sway, h * 0.6, cxm + 15 + sway, h - 2);
  x.lineTo(cxm - 15 - sway, h - 2);
  x.quadraticCurveTo(cxm - 13 - sway, h * 0.6, cxm - 7, 22);
  x.closePath(); x.fill();
  // 금 자수 무늬 + 치맛단
  x.strokeStyle = '#ffd34d'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(cxm - 13 - sway, h - 5); x.lineTo(cxm + 13 + sway, h - 5); x.stroke();
  x.lineWidth = 1;
  x.beginPath(); x.moveTo(cxm - 10, h - 9); x.lineTo(cxm + 10, h - 9); x.stroke();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(cxm, 27, 1.6, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm - 4, 32, 1.2, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm + 4, 32, 1.2, 0, 6.283); x.fill();
  // 허리 금띠
  x.fillStyle = '#ffd34d'; x.fillRect(cxm - 7, 23, 14, 2.6);
  // 팔 + 황금 기관총 (개틀링)
  x.strokeStyle = '#6a2280'; x.lineWidth = 5;
  x.beginPath(); x.moveTo(cxm + 5, 24); x.lineTo(cxm + 11, 30); x.stroke();
  x.beginPath(); x.moveTo(cxm - 5, 24); x.lineTo(cxm + 2, 31); x.stroke();
  x.fillStyle = '#eec89a';
  x.beginPath(); x.arc(cxm + 11.5, 31, 2.2, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm + 2.5, 32, 2.2, 0, 6.283); x.fill();
  // 총몸
  const gg2 = x.createLinearGradient(0, 27, 0, 35);
  gg2.addColorStop(0, '#ffe082'); gg2.addColorStop(1, '#c89020');
  x.fillStyle = gg2;
  rr(x, cxm + 2, 27.5, 15, 7, 2.4); x.fill();
  x.strokeStyle = '#8a5a10'; x.lineWidth = 1; rr(x, cxm + 2, 27.5, 15, 7, 2.4); x.stroke();
  // 3연장 총열
  x.fillStyle = '#d8a838';
  x.fillRect(cxm + 16, 28, 8, 1.8);
  x.fillRect(cxm + 16, 30.6, 9.5, 1.8);
  x.fillRect(cxm + 16, 33.2, 8, 1.8);
  x.fillStyle = '#8a5a10';
  x.fillRect(cxm + 23.5, 27.7, 1.6, 7.8);
  // 탄창 (봉황 문양 원형)
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(cxm + 8, 36.5, 3.4, 0, 6.283); x.fill();
  x.strokeStyle = '#8a5a10'; x.lineWidth = 1;
  x.beginPath(); x.arc(cxm + 8, 36.5, 3.4, 0, 6.283); x.stroke();
  x.beginPath(); x.arc(cxm + 8, 36.5, 1.4, 0, 6.283); x.stroke();
  // 총구 화염
  if (firing) {
    x.fillStyle = '#fff0b0';
    x.beginPath(); x.moveTo(cxm + 25.5, 31.5); x.lineTo(cxm + 32, 28.5); x.lineTo(cxm + 29.5, 31.5); x.lineTo(cxm + 32, 34.5); x.closePath(); x.fill();
    x.fillStyle = '#ffab2e';
    x.beginPath(); x.arc(cxm + 26.5, 31.5, 2.4, 0, 6.283); x.fill();
  }
  // 얼굴 (갸름한 미인형)
  const fgr = x.createRadialGradient(cxm - 2, 12, 2, cxm, 14, 9);
  fgr.addColorStop(0, '#fff4e8'); fgr.addColorStop(1, '#f8dcc4');
  x.fillStyle = fgr;
  x.beginPath(); x.ellipse(cxm, 14, 7.4, 8.2, 0, 0, 6.283); x.fill();
  // 앞머리 (가르마)
  x.fillStyle = '#241428';
  x.beginPath(); x.moveTo(cxm - 7.4, 12);
  x.quadraticCurveTo(cxm - 7, 4.6, cxm, 4.4);
  x.quadraticCurveTo(cxm + 7, 4.6, cxm + 7.4, 12);
  x.quadraticCurveTo(cxm + 5, 7.6, cxm + 1.2, 7.2);
  x.quadraticCurveTo(cxm - 5, 7.6, cxm - 7.4, 12);
  x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 1;
  x.beginPath(); x.arc(cxm - 2, 6.6, 4.4, Math.PI * 1.1, Math.PI * 1.5); x.stroke();
  // 봉황 금 화관 + 비녀
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.moveTo(cxm - 6, 4); x.lineTo(cxm - 4, -1); x.lineTo(cxm - 2, 3);
  x.lineTo(cxm, -2.6); x.lineTo(cxm + 2, 3); x.lineTo(cxm + 4, -1); x.lineTo(cxm + 6, 4);
  x.closePath(); x.fill();
  x.fillStyle = '#e8556a';
  x.beginPath(); x.arc(cxm, 1.4, 1.3, 0, 6.283); x.fill();
  x.fillStyle = '#7ae0f0';
  x.beginPath(); x.arc(cxm - 4, 2.2, 0.9, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm + 4, 2.2, 0.9, 0, 6.283); x.fill();
  x.strokeStyle = '#ffd34d'; x.lineWidth = 1.4;
  x.beginPath(); x.moveTo(cxm + 7, 6.4); x.lineTo(cxm + 12, 4.4); x.stroke();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(cxm + 12.6, 4.2, 1.4, 0, 6.283); x.fill();
  // 눈 (또렷한 미녀 눈매 + 속눈썹) — 화날수록 애니는 게임에서 처리
  x.fillStyle = '#2c1a1e';
  x.beginPath(); x.ellipse(cxm - 3.2, 13.4, 1.5, 1.9, 0, 0, 6.283); x.fill();
  x.beginPath(); x.ellipse(cxm + 3.2, 13.4, 1.5, 1.9, 0, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(cxm - 2.7, 12.8, 0.6, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm + 3.7, 12.8, 0.6, 0, 6.283); x.fill();
  x.strokeStyle = '#2c1a1e'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(cxm - 5.4, 11.2); x.lineTo(cxm - 1.6, 11.4); x.stroke();
  x.beginPath(); x.moveTo(cxm + 5.4, 11.2); x.lineTo(cxm + 1.6, 11.4); x.stroke();
  x.lineWidth = 0.8;
  x.beginPath(); x.moveTo(cxm - 5.2, 12.6); x.lineTo(cxm - 6, 12.2); x.stroke();
  x.beginPath(); x.moveTo(cxm + 5.2, 12.6); x.lineTo(cxm + 6, 12.2); x.stroke();
  // 볼터치 + 붉은 입술 + 이마 곤지
  x.fillStyle = 'rgba(255,120,140,.35)';
  x.beginPath(); x.ellipse(cxm - 5, 16.4, 1.6, 1, 0, 0, 6.283); x.fill();
  x.beginPath(); x.ellipse(cxm + 5, 16.4, 1.6, 1, 0, 0, 6.283); x.fill();
  x.fillStyle = '#d8203a';
  x.beginPath(); x.ellipse(cxm, 18.6, 2, 1.2, 0, 0, 6.283); x.fill();
  x.fillStyle = '#ff7a8a';
  x.beginPath(); x.ellipse(cxm - 0.6, 18.2, 0.8, 0.5, 0, 0, 6.283); x.fill();
  x.fillStyle = '#e8556a';
  x.beginPath(); x.arc(cxm, 9.4, 0.8, 0, 6.283); x.fill();
}
/* 기관총탄 (금색 탄환 + 분홍 궤적) */
function drawBullet(x, w, h) {
  x.strokeStyle = 'rgba(255,150,190,.55)'; x.lineWidth = 2.4;
  x.beginPath(); x.moveTo(1, h / 2); x.lineTo(w * 0.55, h / 2); x.stroke();
  const g = x.createLinearGradient(w * 0.4, 0, w, 0);
  g.addColorStop(0, '#c89020'); g.addColorStop(1, '#ffe082');
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(w * 0.4, h / 2 - 2.4); x.lineTo(w - 3, h / 2 - 2.4);
  x.arc(w - 3, h / 2, 2.4, -Math.PI / 2, Math.PI / 2);
  x.lineTo(w * 0.4, h / 2 + 2.4); x.closePath(); x.fill();
  x.fillStyle = 'rgba(255,255,255,.6)';
  x.fillRect(w * 0.45, h / 2 - 1.7, w * 0.3, 1);
}
/* 유자 불꽃 (파이어볼) */
function drawFireball(x, w, h) {
  const g = x.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
  g.addColorStop(0, '#fff6c8'); g.addColorStop(0.45, '#ffab2e'); g.addColorStop(0.85, '#f0561e'); g.addColorStop(1, 'rgba(240,86,30,0)');
  x.fillStyle = g;
  x.beginPath(); x.arc(w / 2, h / 2, w / 2, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(w / 2 - 1.4, h / 2 - 1.4, 1.8, 0, 6.283); x.fill();
}
/* 매운 고추 (불꽃 파워업) */
function drawPepper(x, w, h) {
  x.save(); x.translate(w / 2, h / 2); x.rotate(0.35);
  const g = x.createLinearGradient(-4, -8, 5, 8);
  g.addColorStop(0, '#ff5d3c'); g.addColorStop(1, '#c81e10');
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(0, -7); x.quadraticCurveTo(6.5, -3, 5, 4);
  x.quadraticCurveTo(4, 9.5, 0, 10);
  x.quadraticCurveTo(-2.6, 9.5, -2.4, 5);
  x.quadraticCurveTo(-2.6, -3, 0, -7);
  x.closePath(); x.fill();
  x.fillStyle = 'rgba(255,255,255,.45)';
  x.beginPath(); x.ellipse(2.2, -1.5, 1.2, 3.4, 0.2, 0, 6.283); x.fill();
  x.fillStyle = '#4a8a2a';
  x.beginPath(); x.moveTo(-1.8, -6.6); x.quadraticCurveTo(0, -9.5, 2.4, -8.4); x.quadraticCurveTo(0.6, -6.4, -1.8, -6.6); x.closePath(); x.fill();
  x.strokeStyle = '#3a6a1e'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(0, -8); x.quadraticCurveTo(1.4, -10.6, 3.4, -10.8); x.stroke();
  x.restore();
}
/* 호랑이 부적 (활강 파워업) — 귀여운 호랑이 얼굴 */
function drawTigerCharm(x, w, h) {
  x.fillStyle = '#f5a256';
  x.beginPath(); x.arc(w / 2 - 5.6, h / 2 - 6, 3, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 5.6, h / 2 - 6, 3, 0, 6.283); x.fill();
  x.fillStyle = '#fff0d8';
  x.beginPath(); x.arc(w / 2 - 5.6, h / 2 - 6, 1.4, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 5.6, h / 2 - 6, 1.4, 0, 6.283); x.fill();
  const g = x.createRadialGradient(w / 2 - 2, h / 2 - 2, 2, w / 2, h / 2, 9);
  g.addColorStop(0, '#ffc078'); g.addColorStop(1, '#ef8f3c');
  x.fillStyle = g;
  x.beginPath(); x.arc(w / 2, h / 2, 8.4, 0, 6.283); x.fill();
  // 줄무늬 + 이마 王
  x.strokeStyle = '#6a3808'; x.lineWidth = 1.4;
  x.beginPath(); x.moveTo(w / 2 - 8, h / 2 - 2); x.lineTo(w / 2 - 5.4, h / 2 - 1); x.stroke();
  x.beginPath(); x.moveTo(w / 2 + 8, h / 2 - 2); x.lineTo(w / 2 + 5.4, h / 2 - 1); x.stroke();
  x.lineWidth = 1.1;
  x.beginPath(); x.moveTo(w / 2 - 2, h / 2 - 6.4); x.lineTo(w / 2 + 2, h / 2 - 6.4); x.stroke();
  x.beginPath(); x.moveTo(w / 2, h / 2 - 7.4); x.lineTo(w / 2, h / 2 - 4.4); x.stroke();
  x.beginPath(); x.moveTo(w / 2 - 1.6, h / 2 - 4.4); x.lineTo(w / 2 + 1.6, h / 2 - 4.4); x.stroke();
  // 흰 주둥이 + 눈코입
  x.fillStyle = '#fff6ea';
  x.beginPath(); x.ellipse(w / 2, h / 2 + 3.4, 4, 3, 0, 0, 6.283); x.fill();
  x.fillStyle = '#241a16';
  x.beginPath(); x.arc(w / 2 - 3, h / 2 - 0.6, 1.1, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 3, h / 2 - 0.6, 1.1, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(w / 2 - 2.7, h / 2 - 1, 0.4, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 3.3, h / 2 - 1, 0.4, 0, 6.283); x.fill();
  x.fillStyle = '#c05a3a';
  x.beginPath(); x.arc(w / 2, h / 2 + 2.2, 1, 0, 6.283); x.fill();
  x.strokeStyle = '#8a5a3a'; x.lineWidth = 0.9;
  x.beginPath(); x.arc(w / 2 - 1.4, h / 2 + 4, 1.2, 0.2, Math.PI - 0.6); x.stroke();
  x.beginPath(); x.arc(w / 2 + 1.4, h / 2 + 4, 1.2, 0.4, Math.PI - 0.2); x.stroke();
}
/* 꽃 (배경 장식, v 0/1 색 변형) */
function drawFlower(x, w, h, v) {
  const pet = v ? '#ffb0c8' : '#ffd34d', core = v ? '#ffe28a' : '#f0871a';
  x.strokeStyle = '#5a9a3e'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(w / 2, h); x.quadraticCurveTo(w / 2 + 1.4, h - 5, w / 2, h - 8); x.stroke();
  x.fillStyle = '#6fae4e';
  x.beginPath(); x.ellipse(w / 2 + 3, h - 4, 2.6, 1.2, -0.5, 0, 6.283); x.fill();
  x.fillStyle = pet;
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * 6.283 - 1.57;
    x.beginPath(); x.ellipse(w / 2 + Math.cos(a) * 3.2, h - 8 + Math.sin(a) * 3.2, 2.4, 2.4, 0, 0, 6.283); x.fill();
  }
  x.fillStyle = core;
  x.beginPath(); x.arc(w / 2, h - 8, 2, 0, 6.283); x.fill();
}
/* 풀숲 (배경 장식) */
function drawGrassTuft(x, w, h) {
  x.strokeStyle = '#5e9e42'; x.lineWidth = 1.8;
  x.beginPath(); x.moveTo(w / 2, h); x.quadraticCurveTo(w / 2 - 1, h - 5, w / 2 - 3, h - 9); x.stroke();
  x.beginPath(); x.moveTo(w / 2 - 3.4, h); x.quadraticCurveTo(w / 2 - 4.4, h - 4, w / 2 - 6.4, h - 6.6); x.stroke();
  x.strokeStyle = '#78bc56';
  x.beginPath(); x.moveTo(w / 2 + 3, h); x.quadraticCurveTo(w / 2 + 4, h - 5, w / 2 + 6, h - 8); x.stroke();
  x.beginPath(); x.moveTo(w / 2 + 0.6, h); x.quadraticCurveTo(w / 2 + 1.6, h - 6, w / 2 + 1, h - 10.4); x.stroke();
}
/* 염라대왕 (보스) */
function drawBoss(x, w, h, frame) {
  const step = frame ? 2 : 0;
  // 곤룡포 (붉은 대례복)
  x.fillStyle = '#8a1a28';
  x.beginPath();
  x.moveTo(10, 22); x.lineTo(w - 10, 22);
  x.lineTo(w - 4, h - 4 - step); x.lineTo(4, h - 4 + step);
  x.closePath(); x.fill();
  x.fillStyle = '#ffd34d';
  x.fillRect(w / 2 - 3, 26, 6, h - 32); // 중앙 금띠
  // 어깨 + 팔
  x.strokeStyle = '#8a1a28'; x.lineWidth = 9;
  x.beginPath(); x.moveTo(12, 26); x.lineTo(2, 40 + step); x.stroke();
  x.beginPath(); x.moveTo(w - 12, 26); x.lineTo(w - 2, 40 - step); x.stroke();
  x.fillStyle = '#eec89a';
  x.beginPath(); x.arc(2, 42 + step, 4, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w - 2, 42 - step, 4, 0, 6.283); x.fill();
  // 얼굴 (분노)
  x.fillStyle = '#eec89a';
  rr(x, w / 2 - 11, 6, 22, 18, 6); x.fill();
  // 수염
  x.fillStyle = '#241a16';
  x.beginPath(); x.moveTo(w / 2 - 7, 20); x.quadraticCurveTo(w / 2, 30, w / 2 + 7, 20);
  x.lineTo(w / 2 + 4, 19); x.quadraticCurveTo(w / 2, 24, w / 2 - 4, 19); x.closePath(); x.fill();
  // 성난 눈썹 + 눈
  x.strokeStyle = '#241a16'; x.lineWidth = 2.2;
  x.beginPath(); x.moveTo(w / 2 - 8, 10); x.lineTo(w / 2 - 3, 12.6); x.stroke();
  x.beginPath(); x.moveTo(w / 2 + 8, 10); x.lineTo(w / 2 + 3, 12.6); x.stroke();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(w / 2 - 5, 14.6, 2.4, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 5, 14.6, 2.4, 0, 6.283); x.fill();
  x.fillStyle = '#8a1a28';
  x.beginPath(); x.arc(w / 2 - 5, 14.9, 1.2, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 5, 14.9, 1.2, 0, 6.283); x.fill();
  x.strokeStyle = '#7a2020'; x.lineWidth = 1.6;
  x.beginPath(); x.arc(w / 2, 20.4, 2.6, Math.PI + 0.4, Math.PI * 2 - 0.4); x.stroke(); // 찡그린 입
  // 관모 (일월관)
  x.fillStyle = '#16161e';
  rr(x, w / 2 - 12, -2, 24, 10, 3); x.fill();
  x.fillRect(w / 2 - 16, 6, 32, 3);
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(w / 2, 2.6, 2.6, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.fillRect(w / 2 - 14, 2, 2, 5); x.fillRect(w / 2 + 12, 2, 2, 5);
}
/* 부적 (보스 투사체) */
function drawTalisman(x, w, h) {
  x.save(); x.translate(w / 2, h / 2); x.rotate(0.3);
  x.fillStyle = '#f5e6b8';
  x.fillRect(-5, -8, 10, 16);
  x.strokeStyle = '#c0392b'; x.lineWidth = 1.4;
  x.strokeRect(-3.6, -6.6, 7.2, 13.2);
  x.beginPath(); x.moveTo(-2, -4); x.lineTo(2, -4); x.moveTo(0, -4); x.lineTo(0, 2);
  x.moveTo(-2, 4); x.lineTo(2, 4); x.stroke();
  x.restore();
}
/* 아이템 */
function drawCoin(x, w, h) { // 엽전
  x.fillStyle = '#e8b34a';
  x.beginPath(); x.arc(w / 2, h / 2, 8, 0, 6.283); x.fill();
  x.fillStyle = '#c8932a';
  x.beginPath(); x.arc(w / 2, h / 2, 8, 0, 6.283); x.lineWidth = 1.6; x.strokeStyle = '#a8781a'; x.stroke();
  x.fillStyle = '#7a5a14';
  x.fillRect(w / 2 - 2.6, h / 2 - 2.6, 5.2, 5.2);
  x.fillStyle = 'rgba(255,255,255,.45)';
  x.beginPath(); x.arc(w / 2 - 3, h / 2 - 4, 1.6, 0, 6.283); x.fill();
}
function drawFruit(x, w, h) { // 유자열매
  x.fillStyle = '#ffca28';
  x.beginPath(); x.arc(w / 2, h / 2 + 2, 9, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,.4)';
  x.beginPath(); x.arc(w / 2 - 3, h / 2 - 1, 2.6, 0, 6.283); x.fill();
  x.fillStyle = '#e8a800';
  x.beginPath(); x.arc(w / 2 + 3, h / 2 + 5, 1.2, 0, 6.283); x.arc(w / 2 - 4, h / 2 + 4, 1, 0, 6.283); x.fill();
  x.strokeStyle = '#6a8a2a'; x.lineWidth = 2.4;
  x.beginPath(); x.moveTo(w / 2, h / 2 - 7); x.quadraticCurveTo(w / 2 + 3, h / 2 - 11, w / 2 + 5, h / 2 - 10); x.stroke();
  x.fillStyle = '#7aa834';
  x.beginPath(); x.ellipse(w / 2 + 6, h / 2 - 10, 4, 2, 0.4, 0, 6.283); x.fill();
}
function drawFlame(x, w, h) { // 도깨비불
  const g = x.createRadialGradient(w / 2, h / 2 + 2, 1, w / 2, h / 2 + 2, 10);
  g.addColorStop(0, '#eaffff'); g.addColorStop(0.45, '#7ae0f0'); g.addColorStop(1, 'rgba(60,140,220,0)');
  x.fillStyle = g;
  x.beginPath(); x.arc(w / 2, h / 2 + 2, 10, 0, 6.283); x.fill();
  x.fillStyle = '#bff2fa';
  x.beginPath();
  x.moveTo(w / 2, 2); x.quadraticCurveTo(w / 2 + 6, h / 2 - 1, w / 2 + 5, h / 2 + 4);
  x.arc(w / 2, h / 2 + 4, 5, 0, Math.PI);
  x.quadraticCurveTo(w / 2 - 6, h / 2 - 1, w / 2, 2); x.fill();
}
/* 타일 */
function drawTileGround(x) { // 흙+잔디
  x.fillStyle = '#a8734a'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#96613c';
  x.fillRect(4, 12, 6, 5); x.fillRect(18, 20, 7, 5); x.fillRect(10, 25, 5, 4); x.fillRect(22, 8, 5, 4);
  x.fillStyle = '#6fae4e'; x.fillRect(0, 0, 32, 7);
  x.fillStyle = '#8ecb68';
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(3 + i * 5.4, 6.4, 3, Math.PI, 0); x.fill(); }
}
function drawTileGroundDark(x) { // 저승 보랏빛 흙
  x.fillStyle = '#4a3a5e'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#3c2e4e';
  x.fillRect(4, 12, 6, 5); x.fillRect(18, 20, 7, 5); x.fillRect(10, 25, 5, 4); x.fillRect(22, 8, 5, 4);
  x.fillStyle = '#6a5490'; x.fillRect(0, 0, 32, 7);
  x.fillStyle = '#8a70b8';
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(3 + i * 5.4, 6.4, 3, Math.PI, 0); x.fill(); }
}
function drawTileSnow(x) { // 설원
  x.fillStyle = '#8d7f9e'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#7c6e8c';
  x.fillRect(4, 14, 6, 5); x.fillRect(18, 21, 7, 5); x.fillRect(11, 26, 5, 4);
  x.fillStyle = '#cfe2f4'; x.fillRect(0, 5, 32, 3);
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 32, 6);
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(3 + i * 5.4, 6, 3.2, Math.PI, 0); x.fill(); }
  x.fillStyle = 'rgba(180,210,240,.5)';
  x.beginPath(); x.arc(9, 4, 1, 0, 6.283); x.arc(22, 3, 1, 0, 6.283); x.fill();
}
function drawTileSand(x) { // 모래사장
  x.fillStyle = '#e0b872'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#cfa25c';
  x.fillRect(5, 13, 5, 4); x.fillRect(19, 21, 6, 4); x.fillRect(11, 26, 4, 3); x.fillRect(23, 9, 4, 3);
  x.fillStyle = '#f5dfa0'; x.fillRect(0, 0, 32, 7);
  x.fillStyle = '#fdf0c8';
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(3 + i * 5.4, 6.4, 3, Math.PI, 0); x.fill(); }
  x.fillStyle = '#f8c8d8'; // 조개
  x.beginPath(); x.arc(24, 4, 1.6, Math.PI, 0); x.fill();
  x.fillStyle = 'rgba(120,90,40,.35)';
  x.beginPath(); x.arc(8, 18, 0.8, 0, 6.283); x.arc(16, 12, 0.8, 0, 6.283); x.arc(27, 24, 0.8, 0, 6.283); x.fill();
}
function drawTileCloud(x) { // 구름 발판
  x.fillStyle = '#dce8f8'; x.fillRect(0, 2, 32, 30);
  x.fillStyle = '#c4d4ec';
  x.beginPath(); x.arc(8, 30, 6, 0, 6.283); x.arc(20, 32, 7, 0, 6.283); x.arc(30, 29, 5, 0, 6.283); x.fill();
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 32, 7);
  for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(3.5 + i * 6.4, 7, 4, Math.PI, 0); x.fill(); }
  x.fillStyle = 'rgba(160,190,230,.35)';
  x.beginPath(); x.arc(12, 18, 3, 0, 6.283); x.arc(24, 22, 2.4, 0, 6.283); x.fill();
}
function drawTilePalace(x) { // 궁궐 단청 바닥
  x.fillStyle = '#6a1420'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#7c1c2a'; x.fillRect(0, 0, 32, 8);
  x.strokeStyle = '#ffd34d'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(0, 8); x.lineTo(32, 8); x.stroke();
  x.lineWidth = 1;
  x.beginPath(); x.moveTo(16, 12); x.lineTo(22, 20); x.lineTo(16, 28); x.lineTo(10, 20); x.closePath(); x.stroke();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(16, 20, 1.6, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,211,77,.5)';
  x.beginPath(); x.arc(4, 4, 1.1, 0, 6.283); x.arc(28, 4, 1.1, 0, 6.283); x.fill();
}
function drawTileStone(x) { // 돌담/기와벽
  x.fillStyle = '#9aa2ae'; x.fillRect(0, 0, 32, 32);
  x.strokeStyle = '#6d7684'; x.lineWidth = 2;
  x.strokeRect(1, 1, 30, 30);
  x.beginPath(); x.moveTo(0, 16); x.lineTo(32, 16); x.moveTo(16, 0); x.lineTo(16, 16); x.moveTo(8, 16); x.lineTo(8, 32); x.moveTo(24, 16); x.lineTo(24, 32); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(2, 2, 28, 3);
}
function drawTileBrick(x) { // 나무궤짝/벽돌
  x.fillStyle = '#c98a4b'; x.fillRect(0, 0, 32, 32);
  x.strokeStyle = '#8a5a28'; x.lineWidth = 2;
  x.strokeRect(1.5, 1.5, 29, 29);
  x.beginPath(); x.moveTo(2, 11); x.lineTo(30, 11); x.moveTo(2, 21); x.lineTo(30, 21); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(3, 3, 26, 3);
}
function drawTileQ(x) { // 복주머니 블록
  x.fillStyle = '#d8425a';
  rr(x, 1, 1, 30, 30, 7); x.fill();
  x.strokeStyle = '#8a1a2e'; x.lineWidth = 2; x.stroke();
  x.fillStyle = '#e86a80';
  x.beginPath(); x.arc(16, 20, 10, 0, 6.283); x.fill();
  x.strokeStyle = '#ffd34d'; x.lineWidth = 2.6;
  x.beginPath(); x.moveTo(9, 10); x.quadraticCurveTo(16, 16, 23, 10); x.stroke();
  x.beginPath(); x.arc(13.4, 8, 2.6, 0, 6.283); x.stroke();
  x.beginPath(); x.arc(18.6, 8, 2.6, 0, 6.283); x.stroke();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(16, 9.4, 2, 0, 6.283); x.fill();
}
function drawTileUsed(x) {
  x.fillStyle = '#9a8878';
  rr(x, 1, 1, 30, 30, 7); x.fill();
  x.strokeStyle = '#6a5a4c'; x.lineWidth = 2; x.stroke();
  x.fillStyle = '#8a7868';
  x.beginPath(); x.arc(16, 16, 6, 0, 6.283); x.fill();
}
function drawTilePlat(x) { // 마루 판자 (반통과)
  x.fillStyle = '#b8894e'; x.fillRect(0, 4, 32, 12);
  x.strokeStyle = '#7a5424'; x.lineWidth = 1.6;
  x.strokeRect(1, 5, 30, 10);
  x.beginPath(); x.moveTo(11, 5); x.lineTo(11, 15); x.moveTo(21, 5); x.lineTo(21, 15); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.2)'; x.fillRect(1, 5, 30, 2.4);
}
function drawGoal(x, w, h) { // 장승 + 깃발
  x.fillStyle = '#9a6a3a';
  rr(x, w / 2 - 6, 14, 12, h - 16, 3); x.fill();
  // 장승 얼굴
  x.fillStyle = '#b8834a';
  rr(x, w / 2 - 9, 14, 18, 26, 4); x.fill();
  x.fillStyle = '#241a16';
  x.beginPath(); x.arc(w / 2 - 4, 22, 1.6, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 4, 22, 1.6, 0, 6.283); x.fill();
  x.strokeStyle = '#241a16'; x.lineWidth = 1.6;
  x.beginPath(); x.arc(w / 2, 29, 4.6, 0.3, Math.PI - 0.3); x.stroke();
  x.strokeRect(w / 2 - 7, 33, 14, 4);
  // 깃발
  x.strokeStyle = '#5a4a3a'; x.lineWidth = 2.6;
  x.beginPath(); x.moveTo(w / 2, 14); x.lineTo(w / 2, 0); x.stroke();
  x.fillStyle = '#e8556a';
  x.beginPath(); x.moveTo(w / 2, 1); x.lineTo(w / 2 + 16, 5); x.lineTo(w / 2, 10); x.closePath(); x.fill();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(w / 2 + 5, 5.4, 1.8, 0, 6.283); x.fill();
}
function drawLantern(x, w, h) { // 청사초롱
  x.strokeStyle = '#5a4a3a'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, 5); x.stroke();
  const g = x.createLinearGradient(0, 5, 0, h - 4);
  g.addColorStop(0, '#4a90c8'); g.addColorStop(0.5, '#ffe9a8'); g.addColorStop(1, '#d8425a');
  x.fillStyle = g;
  rr(x, w / 2 - 7, 5, 14, h - 11, 5); x.fill();
  x.strokeStyle = 'rgba(90,60,40,.6)'; x.lineWidth = 1.2;
  rr(x, w / 2 - 7, 5, 14, h - 11, 5); x.stroke();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(w / 2, h - 3, 2.2, 0, 6.283); x.fill();
}
function buildSprites() {
  SPR.ujaF = [0, 1, 2, 3].map(fm => [0, 1, 2].map(f => mk(30, 34, (x, w, h) => drawUja(x, w, h, f, fm))));
  SPR.uja = SPR.ujaF[0]; SPR.ujaP = SPR.ujaF[1];
  SPR.ghost = [0, 1].map(f => mk(28, 30, (x, w, h) => drawGhost(x, w, h, f)));
  SPR.reaper = [0, 1].map(f => mk(28, 32, (x, w, h) => drawReaper(x, w, h, f)));
  SPR.hat = [mk(26, 16, drawHat)];
  SPR.dok = [0, 1].map(f => mk(28, 30, (x, w, h) => drawDokkaebi(x, w, h, f)));
  SPR.egg = [0, 1].map(f => mk(26, 32, (x, w, h) => drawEgg(x, w, h, f)));
  SPR.fox = [0, 1].map(f => mk(36, 28, (x, w, h) => drawFox(x, w, h, f)));
  SPR.uni = [0, 1].map(f => mk(36, 32, (x, w, h) => drawUnicorn(x, w, h, f)));
  SPR.boss = [0, 1].map(f => mk(56, 64, (x, w, h) => drawBoss(x, w, h, f)));
  SPR.jjo = [0, 1, 2].map(f => mk(60, 66, (x, w, h) => drawJjojjo(x, w, h, f)));
  SPR.blt = [mk(18, 10, drawBullet)];
  SPR.fb = [mk(16, 16, drawFireball)];
  SPR.pepper = [mk(22, 26, drawPepper)];
  SPR.tiger = [mk(24, 24, drawTigerCharm)];
  SPR.tal = [mk(20, 22, drawTalisman)];
  SPR.coin = [mk(20, 20, drawCoin)];
  SPR.fruit = [mk(24, 26, drawFruit)];
  SPR.flame = [mk(22, 24, drawFlame)];
  SPR.goal = [mk(40, 96, drawGoal)];
  SPR.lantern = [mk(20, 28, drawLantern)];
  SPR.flower = [0, 1].map(v => mk(16, 18, (x, w, h) => drawFlower(x, w, h, v)));
  SPR.grass = [mk(16, 12, drawGrassTuft)];
  SPR.ground = {
    grass: mk(32, 32, drawTileGround), dark: mk(32, 32, drawTileGroundDark),
    snow: mk(32, 32, drawTileSnow), sand: mk(32, 32, drawTileSand),
    cloud: mk(32, 32, drawTileCloud), palace: mk(32, 32, drawTilePalace),
  };
  SPR.tile = {
    1: SPR.ground.grass, 2: mk(32, 32, drawTileBrick), 3: mk(32, 32, drawTileQ),
    4: mk(32, 32, drawTileUsed), 5: mk(32, 32, drawTileStone), 6: mk(32, 32, drawTilePlat),
  };
}

/* ============================================================
   레벨 생성 (시드 고정 → 결정적)
   테마: 1 초가마을(낮) 2 소나무숲(석양) 3 궁궐지붕(밤) 4 저승길(동굴) 5 염라궁
   ============================================================ */
const THEMES = [
  { sky: ['#8ed4f2', '#d8f0fa'], hill: '#7ec06a', hill2: '#5ea84e', deco: 'hut', light: 1, ground: 'grass', amb: 'butterfly' },
  { sky: ['#f0975a', '#fce8b8'], hill: '#4a7a52', hill2: '#38663f', deco: 'pine', light: 0.9, ground: 'grass', amb: 'leaf' },
  { sky: ['#1a2a5e', '#3e4e8e'], hill: '#26325e', hill2: '#1c2648', deco: 'roof', light: 0.7, moon: 1, ground: 'grass' },
  { sky: ['#241830', '#3c2a4a'], hill: '#302040', hill2: '#241830', deco: 'spirit', light: 0.55, lanterns: 1, ground: 'dark' },
  { sky: ['#38101c', '#601c28'], hill: '#42141e', hill2: '#300e16', deco: 'palace', light: 0.65, lanterns: 1, ground: 'palace', amb: 'ember' },
  { sky: ['#b8e4cc', '#f2fbe4'], hill: '#6cae74', hill2: '#4e9458', deco: 'bamboo', light: 1, ground: 'grass', amb: 'petal' },
  { sky: ['#a0bce4', '#eef5fc'], hill: '#ccd8ea', hill2: '#aabfd8', deco: 'snowpine', light: 1, ground: 'snow', amb: 'snow' },
  { sky: ['#f7a75c', '#ffe3b8'], hill: '#d87a4e', hill2: '#b85e38', deco: 'wave', light: 0.95, ground: 'sand', amb: 'sparkle', sea: 1 },
  { sky: ['#6fb4f0', '#d8ecff'], hill: '#c2daf4', hill2: '#a2c6ea', deco: 'cloudsea', light: 1, ground: 'cloud', amb: 'wind' },
  { sky: ['#2a1040', '#5c2470'], hill: '#3c1852', hill2: '#2a1040', deco: 'palace2', light: 0.7, lanterns: 1, ground: 'palace', amb: 'gold' },
];
let LV = null; // {t:Uint8Array, W, ents:[], goalX, theme, qc:Map, deco:[], bossArena}
function ti(x, y) { return (x < 0 || x >= LV.W) ? 5 : (y < 0 ? 0 : y >= ROWS ? 0 : LV.t[y * LV.W + x]); }
function setT(t, W, x, y, v) { if (x >= 0 && x < W && y >= 0 && y < ROWS) t[y * W + x] = v; }
const SOLID = [false, true, true, true, true, true, false]; // 6=플랫폼(반통과)

function genLevel(stage) {
  const rng = mulberry32(4200 + stage * 131);
  const W = [150, 165, 175, 185, 150, 180, 185, 190, 195, 155][stage - 1];
  const t = new Uint8Array(W * ROWS);
  const ents = [];
  const qc = new Map();
  const deco = [];
  const mix = [
    ['ghost'],
    ['ghost', 'egg', 'ghost'],
    ['ghost', 'reaper', 'egg'],
    ['reaper', 'dok', 'ghost', 'reaper'],
    ['reaper', 'fox', 'dok'],
    ['ghost', 'dok', 'egg', 'ghost'],
    ['reaper', 'egg', 'dok'],
    ['fox', 'ghost', 'reaper', 'egg'],
    ['egg', 'dok', 'fox'],
    ['fox', 'reaper', 'dok', 'fox'],
  ][stage - 1];
  const bossStage = stage === 5 || stage === 10;
  const flowery = [1, 2, 6, 8, 9].includes(stage); // 아기자기 꽃/풀 장식 테마
  const gapMax = stage <= 1 ? 3 : 4;
  const eDen = 0.16 + Math.min(stage, 7) * 0.035;
  let x = 0, gh = 2; // gh = 지면 높이(타일 수)
  let firstQ = true, uniPlaced = false, powerCnt = 0;
  const uniAt = Math.floor(W * 0.35);
  const SAFE_START = 10; // 플레이어 스폰(타일3) 주변: 이 타일 전에는 적/공중달걀 미스폰
  const ground = (from, to, h) => {
    for (let i = from; i < to; i++)
      for (let r = ROWS - h; r < ROWS; r++) setT(t, W, i, r, r === ROWS - h ? 1 : 5);
  };
  const flat = (n) => {
    ground(x, x + n, gh);
    const top = ROWS - gh - 1;
    for (let i = 1; i < n - 1; i++) {
      const gx = x + i;
      // 유니콘
      if (!uniPlaced && gx >= uniAt) { ents.push({ type: 'uni', tx: gx, ty: top }); uniPlaced = true; continue; }
      // 적 (시작 안전지대 이후에만)
      if (rng() < eDen && n >= 4 && gx >= SAFE_START) {
        ents.push({ type: mix[(rng() * mix.length) | 0], tx: gx, ty: top });
        continue;
      }
      // 엽전 아치
      if (rng() < 0.1) {
        for (let k = 0; k < 3 && i + k < n - 1; k++) ents.push({ type: 'coin', tx: gx + k, ty: top - 3 });
      }
      // 블록 줄 (?블록/궤짝)
      if (rng() < 0.11 && i + 2 < n - 1) {
        const by = top - 3;
        const len = 2 + ((rng() * 2) | 0);
        for (let k = 0; k < len; k++) {
          const bx = gx + k;
          if (rng() < 0.45) {
            setT(t, W, bx, by, 3);
            let c = 'coin';
            if (firstQ || (powerCnt < 2 && rng() < 0.3)) {
              // 파워업: 1~2스테이지 유자열매, 이후 고추/호랑이 부적 등장
              const r = rng();
              c = stage < 3 || r < 0.4 ? 'fruit' : r < 0.75 ? 'pepper' : 'tiger';
              firstQ = false; powerCnt++;
            }
            else if (rng() < 0.07) c = 'flame';
            qc.set(by * W + bx, c);
          } else setT(t, W, bx, by, 2);
        }
        i += len + 1;
        continue;
      }
      // 등불 장식
      if (rng() < 0.08) deco.push({ x: gx, y: top - 2, k: 'lantern' });
      // 꽃·풀숲 (밝은 테마)
      else if (flowery && rng() < 0.16) deco.push({ x: gx, y: top, k: rng() < 0.55 ? 'flower' : 'grass', v: (rng() * 2) | 0 });
    }
    x += n;
  };
  const gap = (n) => {
    // 절벽 위 엽전 (점프 유도)
    for (let k = 0; k < n; k++) ents.push({ type: 'coin', tx: x + k, ty: ROWS - gh - 4 });
    x += n;
  };
  const plats = () => { // 떠 있는 마루 (보너스)
    const py = ROWS - gh - 5;
    const len = 3 + ((rng() * 2) | 0);
    ground(x, x + len + 4, gh);
    for (let k = 0; k < len; k++) {
      setT(t, W, x + 1 + k, py, 6);
      if (rng() < 0.7) ents.push({ type: 'coin', tx: x + 1 + k, ty: py - 2 });
    }
    x += len + 4;
  };
  // 시작 안전지대
  flat(9);
  const endLen = bossStage ? 36 : 12;
  while (x < W - endLen - 6) {
    const roll = rng();
    if (roll < 0.42) flat(5 + ((rng() * 7) | 0));
    else if (roll < 0.62) { gap(2 + ((rng() * (gapMax - 1)) | 0)); flat(4 + ((rng() * 4) | 0)); }
    else if (roll < 0.78) { // 언덕 (높이 변화 ≤2)
      gh = Math.max(2, Math.min(5, gh + (rng() < 0.5 ? 1 : -1) * (1 + (rng() < 0.3 ? 1 : 0))));
      flat(4 + ((rng() * 4) | 0));
    } else plats();
  }
  gh = 2;
  let goalX, bossArena = null;
  if (bossStage) { // 보스 아레나 (5 염라대왕 · 10 쪼쪼 여왕)
    ground(x, W, gh);
    const ax = x + 4;
    bossArena = { x0: ax * TILE, x1: (W - 2) * TILE, entered: false };
    for (let r = 0; r < ROWS; r++) setT(t, W, W - 1, r, 5); // 끝벽
    ents.push({ type: stage === 10 ? 'jjojjo' : 'boss', tx: W - 12, ty: ROWS - gh - 1 });
    goalX = (W - 5) * TILE; // 보스 처치 후 등장
  } else {
    ground(x, W, gh);
    goalX = (W - 6) * TILE;
    deco.push({ x: W - 4, y: ROWS - gh - 2, k: 'lantern' });
  }
  // 유니콘 미배치 시 시작 지점 근처에
  if (!uniPlaced) ents.push({ type: 'uni', tx: 12, ty: ROWS - 3 });
  // 파워업 블록 보장 (시드 운으로 없을 때)
  if (![...qc.values()].some(c => c === 'fruit' || c === 'pepper' || c === 'tiger')) {
    const first = qc.keys().next();
    if (!first.done) qc.set(first.value, stage < 3 ? 'fruit' : 'pepper');
    else { const by = ROWS - 6, bx2 = 6; setT(t, W, bx2, by, 3); qc.set(by * W + bx2, stage < 3 ? 'fruit' : 'pepper'); }
  }
  return { t, W, ents, qc, deco, goalX, theme: THEMES[stage - 1], stage, bossArena };
}

/* ============================================================
   게임 상태
   ============================================================ */
const G = {
  mode: 'menu', stage: 1, lives: 3, score: 0, coins: 0, time: 300,
  paused: false, introT: 0, clearT: 0, msg: '', msgT: 0, won: false, recorded: false,
};
let player = null;
let ents = [];
const particles = [], popups = [], bumps = [];
const cam = { x: 0 };
const keys = { l: false, r: false, j: false, run: false };
let jumpBuf = 0, jumpWasDown = false, runWasDown = false;

function mkPlayer(px, py) {
  return {
    x: px, y: py, w: 20, h: 30, vx: 0, vy: 0, dir: 1,
    onG: false, coyote: 0, pw: 0, inv: 0, star: 0, riding: false, airJump: false,
    animT: 0, dead: false, deadT: 0, prevB: py + 30,
  };
}
function spawnEnts() {
  ents = [];
  for (const s of LV.ents) {
    const px = s.tx * TILE + 4, py = (s.ty + 1) * TILE;
    if (s.type === 'coin') ents.push({ type: 'coin', x: s.tx * TILE + 6, y: s.ty * TILE + 6, w: 20, h: 20 });
    else if (s.type === 'ghost') ents.push({ type: 'ghost', x: px, y: py - 30, w: 22, h: 28, vx: -40, vy: 0, dir: -1 });
    else if (s.type === 'reaper') ents.push({ type: 'reaper', x: px, y: py - 32, w: 22, h: 30, vx: -55, vy: 0, dir: -1 });
    else if (s.type === 'dok') ents.push({ type: 'dok', x: px, y: py - 30, w: 24, h: 28, vx: 0, vy: 0, dir: -1, hopT: 1 + Math.random() });
    else if (s.type === 'egg') ents.push({ type: 'egg', x: px, y: py - 90, w: 22, h: 28, base: py - 90, t: Math.random() * 6 });
    else if (s.type === 'fox') ents.push({ type: 'fox', x: px, y: py - 28, w: 30, h: 26, vx: -110, vy: 0, dir: -1 });
    else if (s.type === 'uni') ents.push({ type: 'uni', x: px, y: py - 32, w: 30, h: 30, vx: 0, vy: 0, dir: -1, bob: 0 });
    else if (s.type === 'boss') ents.push({
      type: 'boss', x: s.tx * TILE, y: (s.ty + 1) * TILE - 62, w: 48, h: 60,
      vx: 0, vy: 0, dir: -1, hp: 5, maxHp: 5, throwT: 2.2, stun: 0, inv: 0, dead: false,
    });
    else if (s.type === 'jjojjo') ents.push({
      type: 'jjojjo', x: s.tx * TILE, y: (s.ty + 1) * TILE - 60, w: 44, h: 58,
      vx: 0, vy: 0, dir: -1, hp: 6, maxHp: 6, burstT: 2.6, burstN: 0, shotT: 0, flash: 0, stun: 0, inv: 0, dead: false,
    });
  }
  LV.goalActive = !LV.bossArena;
}

/* ===== 타일 충돌 ===== */
function tileCollide(e, dt) {
  const head = [];
  // 수평
  e.x += e.vx * dt;
  if (e.vx > 0) {
    const tx = Math.floor((e.x + e.w) / TILE);
    for (let ty = Math.floor(e.y / TILE); ty <= Math.floor((e.y + e.h - 1) / TILE); ty++) {
      if (SOLID[ti(tx, ty)]) { e.x = tx * TILE - e.w - 0.01; e.hitWall = 1; break; }
    }
  } else if (e.vx < 0) {
    const tx = Math.floor(e.x / TILE);
    for (let ty = Math.floor(e.y / TILE); ty <= Math.floor((e.y + e.h - 1) / TILE); ty++) {
      if (SOLID[ti(tx, ty)]) { e.x = (tx + 1) * TILE + 0.01; e.hitWall = -1; break; }
    }
  }
  if (e.x < 0) { e.x = 0; e.hitWall = -1; }
  // 수직
  const prevB = e.y + e.h;
  e.vy = Math.min(950, e.vy + (e.grav === undefined ? GRAV : e.grav) * dt);
  e.y += e.vy * dt;
  e.onG = false;
  if (e.vy >= 0) {
    const ty = Math.floor((e.y + e.h) / TILE);
    for (let tx = Math.floor((e.x + 2) / TILE); tx <= Math.floor((e.x + e.w - 2) / TILE); tx++) {
      const v = ti(tx, ty);
      if (SOLID[v] || (v === 6 && prevB <= ty * TILE + 6)) {
        e.y = ty * TILE - e.h - 0.01; e.vy = 0; e.onG = true; break;
      }
    }
  } else {
    const ty = Math.floor(e.y / TILE);
    for (let tx = Math.floor((e.x + 2) / TILE); tx <= Math.floor((e.x + e.w - 2) / TILE); tx++) {
      const v = ti(tx, ty);
      if (SOLID[v]) { e.y = (ty + 1) * TILE + 0.01; e.vy = 0; head.push([tx, ty, v]); }
    }
  }
  return head;
}
function groundAhead(e) {
  const tx = Math.floor((e.dir > 0 ? e.x + e.w + 4 : e.x - 4) / TILE);
  const ty = Math.floor((e.y + e.h + 6) / TILE);
  return SOLID[ti(tx, ty)] || ti(tx, ty) === 6;
}
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ===== 이펙트 ===== */
function poof(x, y, col) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * 6.283, sp = 60 + Math.random() * 130;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, g: 500, t: 0, life: 0.5 + Math.random() * 0.3, r: 3 + Math.random() * 4, col: col || '#fff' });
  }
}
function sparkle(x, y, col) {
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * 6.283, sp = 40 + Math.random() * 90;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, g: 300, t: 0, life: 0.45, r: 2 + Math.random() * 2.5, col: col || '#ffe28a', star: true });
  }
}
function popup(x, y, txt, col) { popups.push({ x, y, txt, col: col || '#ffe28a', t: 0 }); }
function addScore(n, x, y) { G.score += n; if (x !== undefined) popup(x, y, '+' + n); }

/* ===== 플레이어 ===== */
function damagePlayer() {
  const p = player;
  if (p.inv > 0 || p.star > 0 || p.dead) return;
  if (p.riding) {
    p.riding = false; p.airJump = false;
    ents.push({ type: 'uniFlee', x: p.x - 6, y: p.y, w: 30, h: 30, vx: p.dir * -240, vy: -220, dir: -p.dir, t: 0 });
    p.inv = 1.6; sfx.hurt();
    return;
  }
  if (p.pw > 1) { p.pw = 1; p.inv = 1.8; sfx.hurt(); return; } // 불꽃/호랑이 → 유자열매 폼으로
  if (p.pw > 0) { p.pw = 0; p.inv = 1.8; sfx.hurt(); return; }
  p.dead = true; p.deadT = 0; p.vy = -520; p.vx = 0;
  sfx.die(); bgmStop();
}
function killEnemy(e, pts, byStar) {
  e.dead = true;
  poof(e.x + e.w / 2, e.y + e.h / 2, e.type === 'ghost' ? '#e8ecf4' : e.type === 'fox' ? '#f5a256' : '#cfc4d8');
  addScore(pts, e.x + e.w / 2, e.y);
  if (byStar) sfx.kick(); else sfx.stomp();
}
function updatePlayer(dt) {
  const p = player;
  if (p.dead) {
    p.deadT += dt;
    p.vy += GRAV * dt; p.y += p.vy * dt;
    if (p.deadT > 1.6) respawn();
    return;
  }
  p.inv = Math.max(0, p.inv - dt);
  p.star = Math.max(0, p.star - dt);
  // 이동
  const spd = (keys.run ? RUN : WALK) * (p.riding ? 1.12 : 1);
  const target = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  if (target !== 0) { p.dir = target; p.vx += target * 1500 * dt; }
  else p.vx *= Math.pow(0.0008, dt);
  p.vx = Math.max(-spd, Math.min(spd, p.vx));
  // 점프 (버퍼+코요테)
  if (keys.j && !jumpWasDown) jumpBuf = 0.11;
  jumpWasDown = keys.j;
  jumpBuf = Math.max(0, jumpBuf - dt);
  p.coyote = p.onG ? 0.09 : Math.max(0, p.coyote - dt);
  if (jumpBuf > 0) {
    if (p.onG || p.coyote > 0) {
      p.vy = -(p.riding ? 640 : JUMP_V); p.coyote = 0; jumpBuf = 0;
      if (p.riding) p.airJump = true;
      sfx.jump();
    } else if (p.riding && p.airJump) {
      p.vy = -540; p.airJump = false; jumpBuf = 0;
      for (let i = 0; i < 8; i++) sparkle(p.x + p.w / 2, p.y + p.h, ['#ff9cc8', '#ffe28a', '#7ae0f0', '#b8f27a'][i % 4]);
      sfx.jump();
    }
  }
  // 불꽃 발사 (고추 폼, 달리기 버튼 탭 = 마리오 방식)
  if (keys.run && !runWasDown && p.pw === 2) {
    if (ents.filter(e => e.type === 'fb' && !e.dead).length < 2) {
      ents.push({ type: 'fb', x: p.x + (p.dir > 0 ? p.w - 2 : -12), y: p.y + 8, w: 14, h: 14, vx: p.dir * 360, vy: -60, t: 0, dir: p.dir });
      sfx.fire();
    }
  }
  runWasDown = keys.run;
  // 가변 점프 (홀드) + 호랑이 활강
  p.grav = (p.vy < 0 && keys.j) ? GRAV * 0.52 : GRAV;
  if (p.pw === 3 && keys.j && p.vy > 0 && !p.onG) p.grav = GRAV * 0.3;
  p.prevB = p.y + p.h;
  p.hitWall = 0;
  const head = tileCollide(p, dt);
  if (p.pw === 3 && keys.j && !p.onG && p.vy > 120) {
    p.vy = 120; // 활강: 낙하 속도 제한
    if (Math.random() < 0.12) sparkle(p.x + p.w / 2 - p.dir * 10, p.y + p.h - 4, '#ffcf6e');
  }
  // 머리로 블록 침
  for (const [tx, ty, v] of head) {
    if (v === 3) {
      const key = ty * LV.W + tx;
      const c = LV.qc.get(key) || 'coin';
      LV.t[key] = 4;
      bumps.push({ tx, ty, t: 0 });
      spawnItem(tx, ty, c);
      sfx.bump();
    } else if (v === 2) {
      if (p.pw > 0 || p.riding) {
        LV.t[ty * LV.W + tx] = 0;
        poof(tx * TILE + 16, ty * TILE + 16, '#c98a4b');
        addScore(50); sfx.brk();
      } else { bumps.push({ tx, ty, t: 0 }); sfx.bump(); }
    }
  }
  if (target !== 0 && p.onG) p.animT += dt * Math.abs(p.vx) / 26;
  // 낙사
  if (p.y > VH + 80) { p.inv = 0; p.star = 0; p.pw = 0; p.riding = false; p.dead = true; p.deadT = 1.0; sfx.die(); bgmStop(); }
  // 골인
  if (LV.goalActive && p.x + p.w > LV.goalX + 8 && !G.clearT) stageClear();
  // 보스 아레나 진입
  const ba = LV.bossArena;
  if (ba && !ba.entered && p.x > ba.x0 + 40) {
    ba.entered = true;
    bgmStart(true); sfx.warn();
    G.msg = G.stage === 10 ? L.bossWarn2 : L.bossWarn; G.msgT = 2.2;
  }
  if (ba && ba.entered && p.x < ba.x0) p.x = ba.x0;
}
function spawnItem(tx, ty, kind) {
  const x = tx * TILE + 5, y = ty * TILE - 28;
  if (kind === 'coin') {
    G.coins++; addScore(200, tx * TILE + 16, ty * TILE - 10);
    sparkle(tx * TILE + 16, ty * TILE - 8);
    sfx.coin(); checkCoinLife();
  } else if (kind === 'fruit') {
    ents.push({ type: 'fruit', x, y, w: 22, h: 24, vx: 60, vy: -160, dir: 1 });
  } else if (kind === 'flame') {
    ents.push({ type: 'flame', x, y: y - 4, w: 20, h: 22, base: y - 4, t: 0 });
  } else if (kind === 'pepper') {
    ents.push({ type: 'pepper', x, y, w: 20, h: 24, vx: 55, vy: -160, dir: 1 });
  } else if (kind === 'tiger') {
    ents.push({ type: 'tiger', x, y, w: 22, h: 22, vx: 50, vy: -160, dir: 1 });
  }
}
function checkCoinLife() {
  if (G.coins >= 100) { G.coins -= 100; G.lives++; popup(player.x + 10, player.y - 20, L.oneUp, '#8ef78a'); sfx.oneUp(); }
}
function respawn() {
  G.lives--;
  if (G.lives < 0) { finishGame(false); return; }
  G.msg = L.lifeLost; G.msgT = 1.4;
  startStage(G.stage, true);
}

/* ===== 엔티티 ===== */
function updateEnts(dt) {
  const p = player;
  for (const e of ents) {
    if (e.dead) continue;
    switch (e.type) {
      case 'ghost': case 'reaper': {
        e.vx = e.dir * (e.type === 'ghost' ? 40 : 55);
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.hitWall || (e.onG && !groundAhead(e))) e.dir *= -1;
        e.animT = (e.animT || 0) + dt;
        break;
      }
      case 'fox': {
        e.vx = e.dir * 110;
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.hitWall || (e.onG && !groundAhead(e))) e.dir *= -1;
        e.animT = (e.animT || 0) + dt * 2;
        break;
      }
      case 'dok': {
        e.hopT -= dt;
        if (e.onG) { e.vx = 0; if (e.hopT <= 0) { e.hopT = 1.3; e.vy = -430; e.dir = p.x > e.x ? 1 : -1; e.vx = e.dir * 95; } }
        e.hitWall = 0;
        tileCollide(e, dt);
        e.animT = e.onG ? 0 : 1;
        break;
      }
      case 'egg': {
        e.t += dt;
        e.y = e.base + Math.sin(e.t * 2.2) * 30;
        e.animT = e.t;
        break;
      }
      case 'hat': {
        e.vx = e.dir * 300;
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.hitWall) { e.dir *= -1; sfx.kick(); }
        e.t += dt;
        if (e.t > 8 || e.y > VH + 60) e.dead = true;
        for (const o of ents) {
          if (o === e || o.dead || ['coin', 'uni', 'fruit', 'flame', 'hat', 'uniFlee', 'tal'].includes(o.type)) continue;
          if (o.type === 'boss') continue;
          if (overlap(e, o)) killEnemy(o, 100, true);
        }
        break;
      }
      case 'uni': {
        e.bob += dt;
        tileCollide(e, dt);
        if (!p.riding && !p.dead && overlap(e, p)) {
          e.dead = true;
          p.riding = true; p.airJump = false;
          popup(p.x, p.y - 24, L.mounted, '#ff9cc8');
          sparkle(p.x + 10, p.y + 10, '#ff9cc8');
          sfx.mount();
        }
        break;
      }
      case 'uniFlee': {
        e.t += dt;
        tileCollide(e, dt);
        if (e.t > 5 || e.y > VH + 60) e.dead = true;
        e.animT = (e.animT || 0) + dt * 3;
        break;
      }
      case 'fruit': {
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.hitWall) e.dir *= -1;
        e.vx = e.dir * 60;
        if (e.y > VH + 60) e.dead = true;
        if (!p.dead && overlap(e, p)) {
          e.dead = true;
          if (p.pw > 0) addScore(1000, e.x, e.y);
          else { p.pw = 1; popup(e.x, e.y - 10, '🍋', '#ffca28'); }
          sparkle(e.x + 10, e.y + 10, '#ffca28');
          sfx.power();
        }
        break;
      }
      case 'flame': {
        e.t += dt;
        e.y = e.base + Math.sin(e.t * 3) * 8 - Math.min(20, e.t * 30);
        if (!p.dead && overlap(e, p)) {
          e.dead = true; p.star = 8;
          popup(e.x, e.y - 10, '✨', '#7ae0f0');
          sfx.flame();
        }
        break;
      }
      case 'pepper': case 'tiger': {
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.hitWall) e.dir *= -1;
        e.vx = e.dir * (e.type === 'pepper' ? 55 : 50);
        if (e.y > VH + 60) e.dead = true;
        if (!p.dead && overlap(e, p)) {
          e.dead = true;
          const target = e.type === 'pepper' ? 2 : 3;
          if (p.pw === target) addScore(1000, e.x, e.y);
          else { p.pw = target; popup(e.x, e.y - 10, e.type === 'pepper' ? '🌶️' : '🐯', '#ffcf6e'); }
          sparkle(e.x + 10, e.y + 10, e.type === 'pepper' ? '#ff5d3c' : '#ffcf6e');
          sfx.power();
        }
        break;
      }
      case 'fb': { // 유자 불꽃 (바운드하며 전진)
        e.t += dt;
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.onG) { e.vy = -300; e.onG = false; }
        e.vx = e.dir * 360;
        if (e.hitWall || e.t > 2.5 || e.y > VH + 40) {
          e.dead = true; sparkle(e.x + 7, e.y + 7, '#ffab2e');
          break;
        }
        for (const o of ents) {
          if (o.dead || o === e) continue;
          if (['ghost', 'reaper', 'dok', 'egg', 'fox', 'hat'].includes(o.type) && overlap(e, o)) {
            killEnemy(o, 200, true); e.dead = true; break;
          }
          if ((o.type === 'boss' || o.type === 'jjojjo') && o.inv <= 0 && overlap(e, o)) {
            bossHurt(o); e.dead = true; break;
          }
        }
        break;
      }
      case 'blt': { // 쪼쪼 기관총탄 (직선탄)
        e.t += dt;
        e.x += e.vx * dt; e.y += e.vy * dt;
        const ctx2 = Math.floor((e.x + e.w / 2) / TILE), cty = Math.floor((e.y + e.h / 2) / TILE);
        if (SOLID[ti(ctx2, cty)] || e.t > 2.6 || e.y > VH + 40 || e.y < -40) {
          e.dead = true;
          if (e.t <= 2.6) sparkle(e.x + 5, e.y + 5, '#ffd34d');
        }
        break;
      }
      case 'coin': {
        if (!p.dead && overlap(e, p)) {
          e.dead = true;
          G.coins++; addScore(200, e.x + 10, e.y);
          sparkle(e.x + 10, e.y + 10);
          sfx.coin(); checkCoinLife();
        }
        break;
      }
      case 'tal': {
        e.grav = GRAV * 0.42;
        tileCollide(e, dt);
        if (e.onG || e.y > VH + 60) { e.dead = true; poof(e.x + 8, e.y + 8, '#f5e6b8'); }
        break;
      }
      case 'boss': updateBoss(e, dt); break;
      case 'jjojjo': updateJjojjo(e, dt); break;
    }
    // 플레이어 상호작용 (적 계열)
    if (!e.dead && !p.dead && ['ghost', 'reaper', 'dok', 'egg', 'fox', 'hat', 'tal', 'boss', 'jjojjo', 'blt'].includes(e.type)) {
      if (!overlap(e, p)) continue;
      if (e.type === 'hat' && e.t < 0.3) continue;
      const isBoss = e.type === 'boss' || e.type === 'jjojjo';
      const stomp = p.vy > 130 && p.prevB <= e.y + 10 && e.type !== 'tal' && e.type !== 'blt';
      if (stomp) {
        p.vy = keys.j ? -500 : -330;
        if (isBoss) { bossStomp(e); }
        else if (e.type === 'reaper') {
          e.dead = true;
          poof(e.x + 11, e.y + 10, '#cfd6de');
          addScore(100, e.x, e.y); sfx.stomp();
          ents.push({ type: 'hat', x: e.x, y: e.y + e.h - 16, w: 24, h: 15, dir: p.x + p.w / 2 > e.x + e.w / 2 ? -1 : 1, vy: 0, t: 0 });
        } else killEnemy(e, e.type === 'fox' ? 200 : e.type === 'hat' ? 100 : e.type === 'dok' ? 150 : 100);
      } else if (p.star > 0 && !isBoss) {
        killEnemy(e, 200, true);
      } else if (!isBoss || e.inv <= 0) {
        damagePlayer();
        if (e.type === 'blt') { e.dead = true; sparkle(e.x + 5, e.y + 5, '#ffd34d'); }
      }
    }
  }
  ents = ents.filter(e => !e.dead);
}

/* ===== 보스: 염라대왕 ===== */
function updateBoss(e, dt) {
  const p = player;
  const ba = LV.bossArena;
  if (!ba || !ba.entered) return;
  e.inv = Math.max(0, e.inv - dt);
  if (e.stun > 0) { e.stun -= dt; e.vx = 0; tileCollide(e, dt); return; }
  e.dir = p.x > e.x ? 1 : -1;
  const speed = 55 + (e.maxHp - e.hp) * 22;
  e.vx = e.dir * speed;
  e.hitWall = 0;
  tileCollide(e, dt);
  e.animT = (e.animT || 0) + dt * (1 + (e.maxHp - e.hp) * 0.3);
  e.throwT -= dt;
  if (e.throwT <= 0) {
    e.throwT = Math.max(1.1, 2.4 - (e.maxHp - e.hp) * 0.28);
    const dx = (p.x - e.x), dist = Math.abs(dx);
    ents.push({
      type: 'tal', x: e.x + e.w / 2, y: e.y + 8, w: 18, h: 20,
      vx: Math.sign(dx) * Math.min(320, dist * 0.9), vy: -320, dir: e.dir,
    });
    sfx.throwP();
  }
}
function bossHurt(e) { // 공통 보스 피해 (밟기·불꽃)
  if (e.inv > 0) return;
  e.hp--; e.inv = 1.0;
  poof(e.x + e.w / 2, e.y + 8, '#ffd34d');
  addScore(500, e.x + e.w / 2, e.y);
  sfx.bossHit();
  if (e.hp <= 0) {
    e.dead = true;
    const col = e.type === 'jjojjo' ? '#7a2a8e' : '#8a1a28';
    for (let i = 0; i < 4; i++)
      setTimeout(() => poof(e.x + 10 + Math.random() * 40, e.y + 10 + Math.random() * 40, i % 2 ? col : '#ffd34d'), i * 130);
    addScore(5000, e.x + e.w / 2, e.y - 20);
    sfx.bossDie();
    LV.goalActive = true;
    bgmStart(false);
    G.msg = '👑'; G.msgT = 1.5;
  }
}
function bossStomp(e) {
  if (e.inv > 0) return;
  e.stun = 0.8;
  bossHurt(e);
}

/* ===== 최종보스: 쪼쪼(JJOJJO) 여왕 — 황금 기관총 연사 ===== */
function updateJjojjo(e, dt) {
  const p = player;
  const ba = LV.bossArena;
  if (!ba || !ba.entered) return;
  e.inv = Math.max(0, e.inv - dt);
  e.flash = Math.max(0, e.flash - dt);
  if (e.stun > 0) { e.stun -= dt; e.vx = 0; tileCollide(e, dt); return; }
  e.dir = p.x > e.x ? 1 : -1;
  if (e.burstN > 0) {
    // 연사 중: 정지 사격
    e.vx = 0;
    e.shotT -= dt;
    if (e.shotT <= 0) {
      e.shotT = 0.13; e.burstN--;
      const gy = e.y + 26;
      const dx = p.x + p.w / 2 - (e.x + e.w / 2), dy = p.y + p.h / 2 - gy;
      const d = Math.max(60, Math.hypot(dx, dy));
      const sp = 330;
      ents.push({
        type: 'blt', x: e.x + e.w / 2 + e.dir * 22, y: gy, w: 14, h: 8,
        vx: dx / d * sp, vy: dy / d * sp * 0.55 + (Math.random() - 0.5) * 55, t: 0, dir: e.dir,
      });
      e.flash = 0.1;
      sfx.shot();
    }
  } else {
    // 접근 (체력 줄수록 빠르고 연사 간격 단축)
    const speed = 40 + (e.maxHp - e.hp) * 14;
    e.vx = e.dir * speed;
    e.burstT -= dt;
    if (e.burstT <= 0) {
      e.burstT = Math.max(1.6, 3.0 - (e.maxHp - e.hp) * 0.22);
      e.burstN = 4 + Math.min(4, e.maxHp - e.hp); // 4~8발
      e.shotT = 0.3;
      sfx.throwP();
    }
  }
  e.animT = (e.animT || 0) + dt * 1.6;
  e.hitWall = 0;
  tileCollide(e, dt);
}

/* ===== 스테이지 플로우 ===== */
function startStage(n, isRespawn) {
  G.stage = n;
  LV = genLevel(n);
  spawnEnts();
  player = mkPlayer(3 * TILE, (ROWS - 4) * TILE);
  G.time = 300; G.introT = 1.7; G.clearT = 0;
  cam.x = 0;
  particles.length = 0; popups.length = 0; bumps.length = 0;
  try { localStorage.setItem(GAME_KEY, JSON.stringify({ v: 1, stage: n, lives: G.lives, score: G.score, coins: G.coins })); } catch (e) {}
  if (!isRespawn) sfxSafeClearMsg();
  bgmStart(false);
  updateHUD();
}
function sfxSafeClearMsg() { /* 자리표시 */ }
function stageClear() {
  const bonus = Math.ceil(G.time) * 5;
  G.score += 1000 + bonus;
  G.clearT = 2.6;
  G.msg = `${L.stageClear} +${1000 + bonus}`; G.msgT = 2.4;
  sfx.clear();
  bgmStop();
}
function afterClear() {
  if (G.stage >= 10) { G.won = true; finishGame(true); }
  else startStage(G.stage + 1);
}
function finishGame(won) {
  if (G.recorded) return;
  G.recorded = true;
  const isBest = addRecord(G.score, G.stage);
  try { localStorage.removeItem(GAME_KEY); } catch (e) {}
  G.mode = 'results';
  document.body.classList.remove('playing');
  bgmStop();
  if (won) sfx.clear();
  document.getElementById('resT').textContent = won ? L.worldClear : L.gameOver;
  document.getElementById('resStats').innerHTML =
    `${L.finalScore}: <span class="big">${G.score.toLocaleString()}</span><br>` +
    `${L.reachedStage}: ${L.stageLbl} ${G.stage} · ${L.stages[G.stage - 1]}` +
    (isBest && G.score > 0 ? `<br>${L.newRecord}` : '');
  document.getElementById('resPanel').innerHTML = recordsTable();
  showScreen('results');
}

/* ===== 업데이트 (고정 스텝) ===== */
function update(dt) {
  if (G.introT > 0) { G.introT -= dt; return; }
  if (G.clearT > 0) {
    G.clearT -= dt;
    for (let i = particles.length - 1; i >= 0; i--) stepParticle(particles[i], dt, i);
    if (G.clearT <= 0) afterClear();
    return;
  }
  G.msgT = Math.max(0, G.msgT - dt);
  if (!player.dead) {
    G.time -= dt;
    if (G.time <= 0) { G.time = 0; G.msg = L.timeUp; G.msgT = 1.5; player.pw = 0; player.riding = false; player.dead = true; player.deadT = 0.8; sfx.die(); bgmStop(); }
  }
  updatePlayer(dt);
  updateEnts(dt);
  for (let i = bumps.length - 1; i >= 0; i--) { bumps[i].t += dt; if (bumps[i].t > 0.24) bumps.splice(i, 1); }
  for (let i = particles.length - 1; i >= 0; i--) stepParticle(particles[i], dt, i);
  for (let i = popups.length - 1; i >= 0; i--) { popups[i].t += dt; popups[i].y -= 40 * dt; if (popups[i].t > 0.9) popups.splice(i, 1); }
  // 카메라
  const vw = viewW();
  let target = player.x - vw * 0.38;
  const ba = LV.bossArena;
  let lo = 0, hi = LV.W * TILE - vw;
  if (ba && ba.entered) { lo = Math.max(lo, ba.x0 - 20); hi = Math.min(hi, ba.x1 - vw + 20); }
  cam.x += (Math.max(lo, Math.min(hi, target)) - cam.x) * Math.min(1, dt * 9);
  updateHUD();
}
function stepParticle(p, dt, i) {
  p.t += dt;
  if (p.t >= p.life) { particles.splice(i, 1); return; }
  p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
}

/* ============================================================
   렌더링
   ============================================================ */
const cvs = document.getElementById('game');
const cx = cvs.getContext('2d');
let SW = 0, SH = 0, DPR = 1, scaleF = 1, offY = 0;
function layout() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  SW = window.innerWidth; SH = window.innerHeight;
  cvs.width = SW * DPR; cvs.height = SH * DPR;
  cvs.style.width = SW + 'px'; cvs.style.height = SH + 'px';
  scaleF = SH / VH;
  if (SW / scaleF < 460) scaleF = SW / 460;
  offY = (SH - VH * scaleF) / 2;
}
function viewW() { return SW / scaleF; }
function flip(spr, x, y, w, h, dir) {
  if (dir >= 0) cx.drawImage(spr, x, y, w, h);
  else { cx.save(); cx.translate(x + w, y); cx.scale(-1, 1); cx.drawImage(spr, 0, 0, w, h); cx.restore(); }
}
function drawBG(th, vw, t) {
  const g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
  cx.fillStyle = g; cx.fillRect(0, 0, vw, VH);
  // 해/달
  if (th.moon) {
    cx.fillStyle = '#f5edc8';
    cx.beginPath(); cx.arc(vw - 90, 80, 30, 0, 6.283); cx.fill();
    cx.fillStyle = th.sky[0];
    cx.beginPath(); cx.arc(vw - 78, 72, 26, 0, 6.283); cx.fill();
    cx.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 14; i++) {
      const sx = ((i * 421 + 60) % (vw + 80)) - 40, sy = (i * 173) % 200 + 12;
      cx.fillRect(sx, sy, 2, 2);
    }
  } else if (th.light >= 0.9) {
    cx.fillStyle = th.deco === 'pine' || th.sea ? '#ff8c4a' : '#ffe082';
    cx.beginPath(); cx.arc(vw - 90, 78, 26, 0, 6.283); cx.fill();
  }
  // 바다 (노을 수평선 + 물결 반짝임)
  if (th.sea) {
    const sg = cx.createLinearGradient(0, VH - 220, 0, VH);
    sg.addColorStop(0, '#f0a05a'); sg.addColorStop(0.35, '#d06a48'); sg.addColorStop(1, '#8a3a4a');
    cx.fillStyle = sg; cx.fillRect(0, VH - 220, vw, 220);
    cx.strokeStyle = 'rgba(255,230,170,.5)'; cx.lineWidth = 2;
    for (let k = 0; k < 7; k++) {
      const wy = VH - 200 + k * 26;
      const wx = ((k * 173 + t * (14 + k * 4)) % (vw + 120)) - 60;
      cx.beginPath(); cx.moveTo(wx, wy); cx.quadraticCurveTo(wx + 22, wy - 3, wx + 44, wy); cx.stroke();
    }
    // 노을 윤슬 (해 반사)
    cx.fillStyle = 'rgba(255,200,120,.35)';
    for (let k = 0; k < 5; k++) cx.fillRect(vw - 110 + (k % 3) * 14, VH - 210 + k * 34, 44 - k * 6, 3);
  }
  // 원경 산 (2겹 시차)
  for (const [par, col, hbase] of [[0.18, th.hill2, 190], [0.36, th.hill, 130]]) {
    cx.fillStyle = col;
    const off = cam.x * par;
    cx.beginPath();
    cx.moveTo(0, VH);
    for (let sx = -60; sx <= vw + 60; sx += 30) {
      const wx = sx + off;
      const hh = hbase + Math.sin(wx * 0.008) * 46 + Math.sin(wx * 0.021) * 22;
      cx.lineTo(sx, VH - hh);
    }
    cx.lineTo(vw, VH); cx.closePath(); cx.fill();
  }
  // 테마 장식 (시차 0.55)
  const par = 0.55, off = cam.x * par;
  const step = 260;
  for (let k = Math.floor(off / step) - 1; k < (off + vw) / step + 1; k++) {
    const bx = k * step - off + (k % 3) * 40;
    const by = VH - 96;
    if (th.deco === 'hut') { // 초가집
      cx.fillStyle = '#c8a06a'; cx.fillRect(bx + 8, by + 28, 44, 26);
      cx.fillStyle = '#8a6a3a'; cx.fillRect(bx + 24, by + 40, 12, 14);
      cx.fillStyle = '#d8b878';
      cx.beginPath(); cx.moveTo(bx, by + 30); cx.quadraticCurveTo(bx + 30, by - 2, bx + 60, by + 30); cx.closePath(); cx.fill();
    } else if (th.deco === 'pine') { // 소나무
      cx.fillStyle = '#6a4a2a'; cx.fillRect(bx + 26, by + 10, 8, 46);
      cx.fillStyle = '#2e5e3a';
      for (let l = 0; l < 3; l++) {
        cx.beginPath(); cx.ellipse(bx + 30 - l * 8, by + 6 + l * 12, 22 - l * 4, 9, 0, 0, 6.283); cx.fill();
        cx.beginPath(); cx.ellipse(bx + 42 + l * 4, by + 14 + l * 10, 16, 7, 0, 0, 6.283); cx.fill();
      }
    } else if (th.deco === 'roof') { // 기와 지붕
      cx.fillStyle = '#141c3a';
      cx.beginPath(); cx.moveTo(bx - 6, by + 34); cx.quadraticCurveTo(bx + 30, by + 20, bx + 66, by + 34);
      cx.lineTo(bx + 58, by + 46); cx.quadraticCurveTo(bx + 30, by + 36, bx + 2, by + 46); cx.closePath(); cx.fill();
      cx.fillStyle = '#0e1430'; cx.fillRect(bx + 10, by + 44, 40, 14);
    } else if (th.deco === 'spirit') { // 도깨비불 원경
      cx.fillStyle = 'rgba(120,220,240,.16)';
      cx.beginPath(); cx.arc(bx + 30, by + Math.sin((t + k) * 1.4) * 14 + 8, 9, 0, 6.283); cx.fill();
      cx.fillStyle = 'rgba(120,220,240,.28)';
      cx.beginPath(); cx.arc(bx + 30, by + Math.sin((t + k) * 1.4) * 14 + 8, 4, 0, 6.283); cx.fill();
    } else if (th.deco === 'palace') { // 궁궐 기둥
      cx.fillStyle = '#58101c'; cx.fillRect(bx + 12, by - 30, 14, 88);
      cx.fillStyle = '#701824'; cx.fillRect(bx + 4, by - 40, 30, 12);
      cx.fillStyle = '#ffd34d'; cx.fillRect(bx + 16, by - 36, 6, 4);
    } else if (th.deco === 'bamboo') { // 대나무 숲
      for (let b2 = 0; b2 < 3; b2++) {
        const sx2 = bx + b2 * 16, hh2 = 90 + (b2 % 2) * 24;
        cx.fillStyle = b2 % 2 ? '#5e9e52' : '#6fae5e';
        cx.fillRect(sx2, by + 56 - hh2, 6, hh2);
        cx.fillStyle = '#4a8a42';
        for (let n = 1; n < 4; n++) cx.fillRect(sx2 - 0.5, by + 56 - hh2 * n / 4, 7, 2);
        cx.strokeStyle = '#6fae5e'; cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(sx2 + 3, by + 56 - hh2 + 8); cx.quadraticCurveTo(sx2 + 16, by + 46 - hh2, sx2 + 22, by + 50 - hh2); cx.stroke();
      }
      // 매화 가지
      cx.strokeStyle = '#7a5238'; cx.lineWidth = 2.4;
      cx.beginPath(); cx.moveTo(bx + 48, by + 56); cx.quadraticCurveTo(bx + 54, by + 10, bx + 66, by - 2); cx.stroke();
      cx.fillStyle = '#ffc0d4';
      for (let n = 0; n < 5; n++) { cx.beginPath(); cx.arc(bx + 56 + n * 3.2, by + 22 - n * 6, 3, 0, 6.283); cx.fill(); }
    } else if (th.deco === 'snowpine') { // 눈 덮인 소나무
      cx.fillStyle = '#5a4430'; cx.fillRect(bx + 26, by + 10, 8, 46);
      for (let l = 0; l < 3; l++) {
        cx.fillStyle = '#2e5e46';
        cx.beginPath(); cx.ellipse(bx + 30, by + 8 + l * 13, 22 - l * 5, 9, 0, 0, 6.283); cx.fill();
        cx.fillStyle = '#f4f8ff';
        cx.beginPath(); cx.ellipse(bx + 30, by + 4 + l * 13, 20 - l * 5, 4.6, 0, 0, 6.283); cx.fill();
      }
      // 눈사람
      if (k % 3 === 0) {
        cx.fillStyle = '#fff';
        cx.beginPath(); cx.arc(bx + 62, by + 48, 8, 0, 6.283); cx.fill();
        cx.beginPath(); cx.arc(bx + 62, by + 36, 5.6, 0, 6.283); cx.fill();
        cx.fillStyle = '#241a16';
        cx.beginPath(); cx.arc(bx + 60, by + 35, 0.9, 0, 6.283); cx.arc(bx + 64, by + 35, 0.9, 0, 6.283); cx.fill();
        cx.fillStyle = '#f08a1a';
        cx.beginPath(); cx.moveTo(bx + 62, by + 37); cx.lineTo(bx + 67, by + 38); cx.lineTo(bx + 62, by + 39); cx.closePath(); cx.fill();
      }
    } else if (th.deco === 'wave') { // 바닷가: 갈매기 + 돛단배
      cx.strokeStyle = 'rgba(60,40,50,.8)'; cx.lineWidth = 2;
      const gy2 = by - 60 + Math.sin((t + k) * 1.1) * 8;
      cx.beginPath(); cx.moveTo(bx + 10, gy2); cx.quadraticCurveTo(bx + 16, gy2 - 6, bx + 22, gy2); cx.stroke();
      cx.beginPath(); cx.moveTo(bx + 22, gy2); cx.quadraticCurveTo(bx + 28, gy2 - 6, bx + 34, gy2); cx.stroke();
      if (k % 3 === 1) { // 돛단배
        const byb = by + 26 + Math.sin((t * 0.7 + k)) * 3;
        cx.fillStyle = '#5a3a28';
        cx.beginPath(); cx.moveTo(bx + 6, byb); cx.lineTo(bx + 46, byb); cx.lineTo(bx + 38, byb + 9); cx.lineTo(bx + 14, byb + 9); cx.closePath(); cx.fill();
        cx.fillStyle = '#f5ead0';
        cx.beginPath(); cx.moveTo(bx + 26, byb - 30); cx.lineTo(bx + 26, byb - 2); cx.lineTo(bx + 8, byb - 2); cx.closePath(); cx.fill();
        cx.beginPath(); cx.moveTo(bx + 29, byb - 26); cx.lineTo(bx + 29, byb - 2); cx.lineTo(bx + 43, byb - 2); cx.closePath(); cx.fill();
      }
    } else if (th.deco === 'cloudsea') { // 구름바다
      cx.fillStyle = 'rgba(255,255,255,.9)';
      const cy2 = by + 46 + Math.sin((t * 0.5 + k)) * 4;
      cx.beginPath();
      cx.arc(bx + 14, cy2, 16, 0, 6.283); cx.arc(bx + 38, cy2 - 8, 20, 0, 6.283); cx.arc(bx + 62, cy2, 15, 0, 6.283);
      cx.fill();
      cx.fillStyle = 'rgba(190,215,245,.7)';
      cx.beginPath(); cx.arc(bx + 38, cy2 + 6, 24, 0, Math.PI); cx.fill();
    } else if (th.deco === 'palace2') { // 쪼쪼 하늘궁전: 황금 기둥 + 비단 휘장
      cx.fillStyle = '#c89020'; cx.fillRect(bx + 12, by - 34, 14, 92);
      cx.fillStyle = '#ffd34d'; cx.fillRect(bx + 14.5, by - 34, 3.5, 92);
      cx.fillStyle = '#e8b030'; cx.fillRect(bx + 4, by - 44, 30, 12);
      cx.fillStyle = '#7a2a8e';
      cx.beginPath();
      cx.moveTo(bx + 40, by - 40); cx.quadraticCurveTo(bx + 44 + Math.sin(t + k) * 3, by - 4, bx + 40, by + 26);
      cx.lineTo(bx + 50, by + 20); cx.quadraticCurveTo(bx + 52 + Math.sin(t + k) * 3, by - 8, bx + 48, by - 40);
      cx.closePath(); cx.fill();
      cx.fillStyle = '#ffd34d';
      cx.beginPath(); cx.arc(bx + 44, by - 40, 3, 0, 6.283); cx.fill();
    }
  }
  // 구름 (밝은 테마)
  if (th.light >= 0.9) {
    cx.fillStyle = 'rgba(255,255,255,.85)';
    const coff = cam.x * 0.1 + t * 8;
    for (let k = 0; k < 4; k++) {
      const cxp = ((k * 340 + 80 - coff) % (vw + 200) + vw + 200) % (vw + 200) - 100;
      const cyp = 46 + (k % 3) * 34;
      cx.beginPath();
      cx.arc(cxp, cyp, 15, 0, 6.283); cx.arc(cxp + 18, cyp - 7, 12, 0, 6.283); cx.arc(cxp + 34, cyp, 13, 0, 6.283);
      cx.fill();
    }
  }
  // 어두운 테마 비네트
  if (th.light < 0.8) {
    cx.fillStyle = `rgba(6,4,14,${(0.8 - th.light) * 0.8})`;
    cx.fillRect(0, 0, vw, VH);
  }
  drawAmbient(th, vw, t);
}
/* 앰비언트 파티클 (상태 없는 시간 함수 — 나비·낙엽·꽃잎·눈·윤슬·바람·금가루·불티) */
function drawAmbient(th, vw, t) {
  if (!th.amb) return;
  if (th.amb === 'butterfly') {
    for (let i = 0; i < 4; i++) {
      const bx2 = ((i * 331 + t * (18 + i * 6)) % (vw + 80)) - 40;
      const by2 = 120 + (i * 97) % 200 + Math.sin(t * 2 + i * 2) * 24;
      const flap = Math.abs(Math.sin(t * 9 + i)) * 0.8 + 0.2;
      cx.fillStyle = i % 2 ? '#ffb0c8' : '#ffe28a';
      cx.beginPath(); cx.ellipse(bx2 - 3 * flap, by2, 3.4 * flap, 4, 0.5, 0, 6.283); cx.fill();
      cx.beginPath(); cx.ellipse(bx2 + 3 * flap, by2, 3.4 * flap, 4, -0.5, 0, 6.283); cx.fill();
      cx.fillStyle = '#5a3a2a'; cx.fillRect(bx2 - 0.8, by2 - 3.4, 1.6, 7);
    }
    return;
  }
  const N = th.amb === 'wind' ? 6 : 14;
  for (let i = 0; i < N; i++) {
    const seedX = (i * 467) % 900, seedY = (i * 211) % 480;
    if (th.amb === 'petal' || th.amb === 'leaf' || th.amb === 'snow') {
      const fall = th.amb === 'snow' ? 34 + (i % 4) * 10 : 26 + (i % 4) * 8;
      const py2 = ((seedY + t * fall) % (VH + 40)) - 20;
      const px2 = ((seedX + Math.sin(t * 1.1 + i) * 30 - cam.x * 0.2) % (vw + 60) + vw + 60) % (vw + 60) - 30;
      if (th.amb === 'snow') {
        cx.fillStyle = 'rgba(255,255,255,.85)';
        cx.beginPath(); cx.arc(px2, py2, 1.6 + (i % 3) * 0.8, 0, 6.283); cx.fill();
      } else {
        cx.fillStyle = th.amb === 'petal' ? 'rgba(255,182,206,.9)' : 'rgba(214,150,66,.85)';
        cx.save(); cx.translate(px2, py2); cx.rotate(t * 2 + i);
        cx.beginPath(); cx.ellipse(0, 0, 3, 1.7, 0, 0, 6.283); cx.fill();
        cx.restore();
      }
    } else if (th.amb === 'sparkle') {
      const tw = (Math.sin(t * 3 + i * 2.1) + 1) / 2;
      cx.fillStyle = `rgba(255,226,138,${0.25 + tw * 0.5})`;
      const px2 = (seedX % vw), py2 = VH - 230 + (seedY % 90);
      cx.fillRect(px2 - 2 - tw, py2, 4 + tw * 2, 1.6);
    } else if (th.amb === 'wind') {
      const px2 = ((seedX + t * 130) % (vw + 200)) - 100;
      const py2 = 60 + (seedY % 300) + Math.sin(t + i) * 10;
      cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1.6;
      cx.beginPath(); cx.moveTo(px2, py2); cx.quadraticCurveTo(px2 + 24, py2 - 4, px2 + 48, py2); cx.stroke();
    } else if (th.amb === 'gold' || th.amb === 'ember') {
      const rise = th.amb === 'ember';
      const py2 = rise
        ? VH - (((seedY + t * 26) % (VH + 40)) - 20)
        : ((seedY + t * 20) % (VH + 40)) - 20;
      const px2 = ((seedX + Math.sin(t * 1.3 + i) * 18) % (vw + 40) + vw + 40) % (vw + 40) - 20;
      const tw = (Math.sin(t * 4 + i * 1.7) + 1) / 2;
      cx.fillStyle = rise ? `rgba(255,160,80,${0.25 + tw * 0.45})` : `rgba(255,211,77,${0.3 + tw * 0.5})`;
      cx.save(); cx.translate(px2, py2); cx.rotate(t * 3 + i);
      cx.fillRect(-1.6, -1.6, 3.2, 3.2);
      cx.restore();
    }
  }
}
function render(nowS) {
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.fillStyle = '#08060e'; cx.fillRect(0, 0, SW, SH);
  if (G.mode !== 'play' && G.mode !== 'results' || !LV) {
    if (LV && G.mode === 'menu') { /* 메뉴 배경으로 스테이지1 풍경 */ } else return;
  }
  if (!LV) return;
  cx.save();
  cx.translate(0, offY); cx.scale(scaleF, scaleF);
  cx.beginPath(); cx.rect(0, 0, viewW(), VH); cx.clip();
  const vw = viewW();
  const th = LV.theme;
  drawBG(th, vw, nowS);
  cx.imageSmoothingEnabled = true;
  const camX = cam.x;
  // 타일
  const tx0 = Math.max(0, Math.floor(camX / TILE) - 1), tx1 = Math.min(LV.W - 1, Math.ceil((camX + vw) / TILE) + 1);
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const v = LV.t[ty * LV.W + tx];
      if (!v) continue;
      let by = 0;
      for (const b of bumps) if (b.tx === tx && b.ty === ty) by = -Math.sin(b.t / 0.24 * Math.PI) * 8;
      const spr = v === 1 ? (SPR.ground[th.ground] || SPR.ground.grass) : SPR.tile[v];
      cx.drawImage(spr, tx * TILE - camX, ty * TILE + by, TILE, TILE);
    }
  }
  // 장식 (등불·꽃·풀숲)
  for (const d of LV.deco) {
    const dx = d.x * TILE - camX;
    if (dx < -40 || dx > vw + 40) continue;
    if (d.k === 'flower') {
      cx.drawImage(SPR.flower[(d.v || 0) % 2], dx + 8, (d.y + 1) * TILE - 18, 16, 18);
      continue;
    }
    if (d.k === 'grass') {
      cx.drawImage(SPR.grass[0], dx + 8, (d.y + 1) * TILE - 12, 16, 12);
      continue;
    }
    if (th.lanterns || th.light < 0.8) {
      const gg = cx.createRadialGradient(dx + 10, d.y * TILE + 16, 2, dx + 10, d.y * TILE + 16, 46);
      gg.addColorStop(0, 'rgba(255,214,120,.4)'); gg.addColorStop(1, 'rgba(255,214,120,0)');
      cx.fillStyle = gg;
      cx.beginPath(); cx.arc(dx + 10, d.y * TILE + 16, 46, 0, 6.283); cx.fill();
    }
    cx.drawImage(SPR.lantern[0], dx, d.y * TILE, 20, 28);
  }
  // 골 장승
  if (LV.goalActive) {
    cx.drawImage(SPR.goal[0], LV.goalX - camX, VH - 2 * TILE - 96, 40, 96);
  }
  // 엔티티
  for (const e of ents) {
    const ex = e.x - camX;
    if (ex < -80 || ex > vw + 80) continue;
    const fr = Math.floor((e.animT || 0) * 6) % 2;
    switch (e.type) {
      case 'coin': {
        const ph = Math.sin(nowS * 5 + e.x * 0.05);
        cx.save(); cx.translate(ex + 10, e.y + 10); cx.scale(Math.abs(ph) * 0.8 + 0.2, 1);
        cx.drawImage(SPR.coin[0], -10, -10, 20, 20); cx.restore();
        break;
      }
      case 'ghost': cx.globalAlpha = 0.92; flip(SPR.ghost[fr], ex - 3, e.y - 2, 28, 30, -e.dir); cx.globalAlpha = 1; break;
      case 'reaper': flip(SPR.reaper[fr], ex - 3, e.y - 2, 28, 32, -e.dir); break;
      case 'hat': flip(SPR.hat[0], ex, e.y, 26, 16, e.dir); break;
      case 'dok': flip(SPR.dok[e.onG ? 0 : 1], ex - 2, e.y - 2, 28, 30, -e.dir); break;
      case 'egg': cx.globalAlpha = 0.94; cx.drawImage(SPR.egg[fr], ex - 2, e.y - 2, 26, 32); cx.globalAlpha = 1; break;
      case 'fox': flip(SPR.fox[fr], ex - 3, e.y - 2, 36, 28, -e.dir); break;
      case 'uni': flip(SPR.uni[0], ex - 3, e.y - 2 + Math.sin(e.bob * 3) * 2, 36, 32, -e.dir); break;
      case 'uniFlee': flip(SPR.uni[fr], ex - 3, e.y - 2, 36, 32, -e.dir); break;
      case 'fruit': cx.drawImage(SPR.fruit[0], ex, e.y, 24, 26); break;
      case 'pepper': cx.drawImage(SPR.pepper[0], ex, e.y, 20, 24); break;
      case 'tiger': cx.drawImage(SPR.tiger[0], ex, e.y, 22, 22); break;
      case 'flame': cx.drawImage(SPR.flame[0], ex, e.y + Math.sin(e.t * 4) * 3, 22, 24); break;
      case 'fb': {
        cx.save(); cx.translate(ex + 7, e.y + 7); cx.rotate(e.t * 12 * e.dir);
        cx.drawImage(SPR.fb[0], -8, -8, 16, 16); cx.restore();
        break;
      }
      case 'blt': flip(SPR.blt[0], ex, e.y - 1, 18, 10, e.vx >= 0 ? 1 : -1); break;
      case 'tal': cx.drawImage(SPR.tal[0], ex, e.y, 20, 22); break;
      case 'boss': {
        if (e.inv > 0 && Math.floor(nowS * 14) % 2) break;
        flip(SPR.boss[Math.floor((e.animT || 0) * 4) % 2], ex - 4, e.y - 3, 56, 64, -e.dir);
        break;
      }
      case 'jjojjo': {
        if (e.inv > 0 && Math.floor(nowS * 14) % 2) break;
        const jf = e.flash > 0 ? 2 : Math.floor((e.animT || 0) * 3) % 2;
        flip(SPR.jjo[jf], ex - 8, e.y - 7, 60, 66, e.dir);
        break;
      }
    }
  }
  // 플레이어
  if (player && !(player.inv > 0 && Math.floor(nowS * 14) % 2 && !player.dead)) {
    const p = player;
    const set = SPR.ujaF[Math.max(0, Math.min(3, p.pw))] || SPR.uja;
    const fr = p.dead ? 2 : !p.onG ? 2 : Math.abs(p.vx) > 12 ? (Math.floor(p.animT) % 2) : 0;
    const px = p.x - camX - 5, py = p.y - 4;
    if (p.star > 0) {
      const gg = cx.createRadialGradient(px + 15, py + 17, 4, px + 15, py + 17, 30);
      gg.addColorStop(0, 'rgba(140,240,255,.5)'); gg.addColorStop(1, 'rgba(140,240,255,0)');
      cx.fillStyle = gg;
      cx.beginPath(); cx.arc(px + 15, py + 17, 30, 0, 6.283); cx.fill();
    }
    if (p.riding) {
      flip(SPR.uni[p.onG && Math.abs(p.vx) > 12 ? Math.floor(p.animT) % 2 : 0], p.x - camX - 6, p.y + p.h - 30, 36, 32, p.dir);
      flip(set[fr], px, py - 16, 30, 34, p.dir);
    } else {
      flip(set[fr], px, py, 30, 34, p.dir);
    }
  }
  // 파티클
  for (const pt of particles) {
    cx.globalAlpha = 1 - pt.t / pt.life;
    cx.fillStyle = pt.col;
    if (pt.star) {
      cx.save(); cx.translate(pt.x - camX, pt.y); cx.rotate(pt.t * 6);
      cx.fillRect(-pt.r, -pt.r / 3, pt.r * 2, pt.r / 1.5);
      cx.fillRect(-pt.r / 3, -pt.r, pt.r / 1.5, pt.r * 2);
      cx.restore();
    } else {
      cx.beginPath(); cx.arc(pt.x - camX, pt.y, pt.r * (1 - pt.t / pt.life * 0.5), 0, 6.283); cx.fill();
    }
  }
  cx.globalAlpha = 1;
  // 점수 팝업
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for (const pp of popups) {
    cx.globalAlpha = 1 - pp.t / 0.9;
    cx.font = '900 14px sans-serif';
    cx.lineWidth = 3; cx.strokeStyle = 'rgba(0,0,0,.6)';
    cx.strokeText(pp.txt, pp.x - camX, pp.y);
    cx.fillStyle = pp.col; cx.fillText(pp.txt, pp.x - camX, pp.y);
  }
  cx.globalAlpha = 1;
  // 보스 HP
  const boss = ents.find(e => e.type === 'boss' || e.type === 'jjojjo');
  if (boss && LV.bossArena && LV.bossArena.entered) {
    const bw = 200, bx = vw / 2 - bw / 2;
    cx.fillStyle = 'rgba(0,0,0,.5)';
    cx.beginPath(); cx.roundRect(bx - 6, 14, bw + 12, 22, 10); cx.fill();
    cx.fillStyle = '#3a3a44';
    cx.beginPath(); cx.roundRect(bx, 20, bw, 10, 5); cx.fill();
    cx.fillStyle = boss.type === 'jjojjo' ? '#e858a8' : '#d8425a';
    cx.beginPath(); cx.roundRect(bx, 20, bw * boss.hp / boss.maxHp, 10, 5); cx.fill();
    cx.font = '900 11px sans-serif'; cx.fillStyle = '#ffe28a';
    cx.fillText((boss.type === 'jjojjo' ? '👑 ' : '☠ ') + L.stages[G.stage - 1], vw / 2, 10);
  }
  // 스테이지 인트로 / 메시지
  if (G.introT > 0) {
    cx.fillStyle = 'rgba(10,6,18,.55)'; cx.fillRect(0, VH / 2 - 60, vw, 120);
    cx.font = '900 34px sans-serif';
    cx.fillStyle = '#ffe28a';
    cx.fillText(`${L.stageLbl} ${G.stage}`, vw / 2, VH / 2 - 16);
    cx.font = '800 20px sans-serif'; cx.fillStyle = '#fff';
    cx.fillText(L.stages[G.stage - 1], vw / 2, VH / 2 + 18);
  } else if (G.msgT > 0 && G.msg) {
    cx.font = '900 24px sans-serif';
    cx.lineWidth = 5; cx.strokeStyle = 'rgba(0,0,0,.65)';
    cx.strokeText(G.msg, vw / 2, VH * 0.3);
    cx.fillStyle = '#ffe28a'; cx.fillText(G.msg, vw / 2, VH * 0.3);
  }
  cx.restore();
}
function updateHUD() {
  document.getElementById('hStage').textContent = `${L.stageLbl} ${G.stage} · ${L.stages[G.stage - 1]}`;
  document.getElementById('hScore').textContent = `⭐ ${G.score.toLocaleString()}`;
  document.getElementById('hCoin').textContent = `🪙 ${G.coins}`;
  document.getElementById('hLife').textContent = `💗 ${Math.max(0, G.lives)}` +
    (player && player.pw === 2 ? ' · 🌶️' : player && player.pw === 3 ? ' · 🐯' : '');
  const tEl = document.getElementById('hTime');
  tEl.textContent = `⏱ ${Math.ceil(G.time)}`;
  tEl.classList.toggle('low', G.time < 60);
}

/* ============================================================
   입력
   ============================================================ */
window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.l = true;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.r = true;
  if ([' ', 'ArrowUp', 'w', 'W', 'z', 'Z'].includes(e.key)) { keys.j = true; e.preventDefault(); }
  if (e.key === 'Shift' || e.key === 'x' || e.key === 'X') keys.run = true;
  if (e.key === 'Escape' && G.mode === 'play') togglePause();
});
window.addEventListener('keyup', (e) => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.l = false;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.r = false;
  if ([' ', 'ArrowUp', 'w', 'W', 'z', 'Z'].includes(e.key)) keys.j = false;
  if (e.key === 'Shift' || e.key === 'x' || e.key === 'X') keys.run = false;
});
function bindTouch(id, key) {
  const el = document.getElementById(id);
  const on = (e) => { e.preventDefault(); keys[key] = true; el.classList.add('on'); audioInit(); };
  const off = (e) => { e.preventDefault(); keys[key] = false; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('pointerleave', off);
}
if (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) document.body.classList.add('touch');
if (qs.has('touch')) document.body.classList.add('touch');
window.addEventListener('resize', layout);

/* ============================================================
   화면 · 플로우
   ============================================================ */
function $(id) { return document.getElementById(id); }
function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.style.display = 'none';
  if (id) $(id).style.display = 'flex';
}
function togglePause() {
  G.paused = !G.paused;
  if (G.paused) { showScreen('pause'); bgmStop(); }
  else { showScreen(null); bgmStart(bgmBoss); }
}
function startGame(fresh) {
  const nick = ($('nick').value || '').trim() || 'UJA';
  REC.nick = nick; storeRec();
  audioInit();
  G.mode = 'play'; G.won = false; G.recorded = false; G.paused = false;
  let st = 1;
  if (!fresh) {
    try {
      const s = JSON.parse(localStorage.getItem(GAME_KEY));
      if (s && s.v === 1) { st = s.stage; G.lives = s.lives; G.score = s.score; G.coins = s.coins; }
    } catch (e) {}
  }
  if (fresh) { G.lives = 3; G.score = 0; G.coins = 0; }
  showScreen(null);
  document.body.classList.add('playing');
  startStage(st);
}
function recordsTable() {
  if (!REC.top10.length) return `<div class="note">${L.emptyRec}</div>`;
  let h = `<table><tr><th>${L.colRank}</th><th>${L.colName}</th><th>${L.colScore}</th><th>${L.colStage}</th><th>${L.colDate}</th></tr>`;
  REC.top10.forEach((r, i) => {
    h += `<tr><td>${i + 1}</td><td>${String(r.n).replace(/[<>&]/g, '')}</td><td>${r.s.toLocaleString()}</td><td>${r.g}</td><td>${r.d}</td></tr>`;
  });
  return h + '</table>';
}
function uiInit() {
  $('subT').textContent = L.sub;
  $('startBtn').textContent = L.start;
  $('contBtn').textContent = L.cont;
  $('recBtn').textContent = L.records;
  $('exportBtn').textContent = L.expSave;
  $('importBtn').textContent = L.impSave;
  $('helpBox').innerHTML = L.help;
  $('credit').innerHTML = L.credit + '<a href="https://menewsoft.com" target="_blank" rel="noopener">menewsoft.com</a>';
  $('nick').placeholder = L.nickPh;
  $('nick').value = REC.nick || '';
  $('recT').textContent = L.records;
  $('recNote').textContent = L.recNote;
  $('recBackBtn').textContent = L.back;
  $('pauseT').textContent = L.pauseT;
  $('resumeBtn').textContent = L.resume;
  $('quitBtn').textContent = L.quit;
  $('retryBtn').textContent = L.retry;
  $('menuBtn').textContent = L.menu;
  applyMute();
  let hasSave = false;
  try { hasSave = !!localStorage.getItem(GAME_KEY); } catch (e) {}
  if (hasSave) $('contBtn').style.display = '';
  $('startBtn').onclick = () => startGame(true);
  $('contBtn').onclick = () => startGame(false);
  $('recBtn').onclick = () => { $('recPanel').innerHTML = recordsTable(); showScreen('records'); };
  $('recBackBtn').onclick = () => showScreen('menu');
  $('resumeBtn').onclick = togglePause;
  $('quitBtn').onclick = () => {
    if (!confirm(L.quitConfirm)) return;
    G.paused = false; G.mode = 'menu';
    document.body.classList.remove('playing');
    bgmStop();
    $('contBtn').style.display = '';
    showScreen('menu');
  };
  $('retryBtn').onclick = () => startGame(true);
  $('menuBtn').onclick = () => { G.mode = 'menu'; showScreen('menu'); };
  $('pauseBtn').onclick = togglePause;
  $('muteBtn').onclick = () => { REC.muted = !REC.muted; storeRec(); applyMute(); };
  $('exportBtn').onclick = () => {
    const blob = new Blob([JSON.stringify({ game: 'superuja', v: 1, rec: REC })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'super-uja-save.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    alert(L.expDone);
  };
  $('importBtn').onclick = () => $('importFile').click();
  $('importFile').addEventListener('change', (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const j = JSON.parse(rd.result);
        if (j.game !== 'superuja' || !j.rec || !Array.isArray(j.rec.top10)) throw 0;
        if (!confirm(L.impConfirm)) return;
        REC = j.rec; storeRec();
        $('nick').value = REC.nick || ''; applyMute();
      } catch (err) { alert(L.impErr); }
    };
    rd.readAsText(f);
  });
  bindTouch('tLeft', 'l'); bindTouch('tRight', 'r');
  bindTouch('tJump', 'j'); bindTouch('tRun', 'run');
  document.addEventListener('pointerdown', audioInit, { once: true });
}

/* ============================================================
   테스트 (?test=sim)
   ============================================================ */
function makeTestLevel(cols) {
  const t = new Uint8Array(cols * ROWS);
  for (let x = 0; x < cols; x++) { setT(t, cols, x, ROWS - 2, 1); setT(t, cols, x, ROWS - 1, 5); }
  return { t, W: cols, ents: [], qc: new Map(), deco: [], goalX: (cols - 2) * TILE, theme: THEMES[0], stage: 1, bossArena: null, goalActive: false };
}
function simSteps(n) { for (let i = 0; i < n; i++) update(1 / 60); }
function runSim() {
  let pass = 0, fail = 0;
  const T = (name, ok, extra) => {
    if (ok) pass++; else fail++;
    console.warn(`[SIM] ${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  };
  buildSprites();
  T('sprites built', !!(SPR.uja && SPR.uja[0].width && SPR.boss && SPR.jjo && SPR.jjo[2].width && SPR.pepper && SPR.tiger && SPR.ground.snow && SPR.tile[1]));
  // 레벨 10종 정적 검증
  for (let s = 1; s <= 10; s++) {
    const lv = genLevel(s);
    // 표면 높이/구멍 검사 (바닥에서 연속된 지면만 = 걷는 표면, 공중 블록 제외)
    const surf = [];
    for (let x2 = 0; x2 < lv.W; x2++) {
      let sY = -1;
      if (SOLID[lv.t[(ROWS - 1) * lv.W + x2]]) {
        sY = ROWS - 1;
        while (sY > 0 && SOLID[lv.t[(sY - 1) * lv.W + x2]]) sY--;
      }
      surf.push(sY);
    }
    let maxGap = 0, run = 0, maxStep = 0;
    let prev = -1;
    for (let x2 = 0; x2 < lv.W - 2; x2++) { // 끝벽(아레나) 제외
      if (surf[x2] < 0) { run++; maxGap = Math.max(maxGap, run); }
      else {
        run = 0;
        if (prev >= 0) maxStep = Math.max(maxStep, Math.abs(surf[x2] - prev));
        prev = surf[x2];
      }
    }
    const enemies = lv.ents.filter(e => !['coin', 'uni', 'boss', 'jjojjo'].includes(e.type)).length;
    const hasUni = lv.ents.some(e => e.type === 'uni');
    const hasPower = [...lv.qc.values()].some(c => c === 'fruit' || c === 'pepper' || c === 'tiger');
    const okBoss = s === 5 ? lv.ents.some(e => e.type === 'boss')
      : s === 10 ? lv.ents.some(e => e.type === 'jjojjo')
      : !lv.bossArena;
    T(`stage ${s} valid`, maxGap <= 4 && maxStep <= 3 && enemies > 3 && hasUni && hasPower && okBoss && lv.goalX < lv.W * TILE,
      `gap=${maxGap} step=${maxStep} foes=${enemies} uni=${hasUni} power=${hasPower}`);
  }
  // 물리: 점프 높이·활강 거리
  G.mode = 'play'; G.introT = 0; G.lives = 3; G.score = 0; G.coins = 0; G.time = 300;
  LV = makeTestLevel(60); ents = [];
  player = mkPlayer(5 * TILE, (ROWS - 4) * TILE);
  simSteps(30); // 착지
  const groundY = player.y;
  keys.j = true;
  let peak = 1e9;
  for (let i = 0; i < 90; i++) { update(1 / 60); peak = Math.min(peak, player.y); }
  keys.j = false;
  const jumpTiles = (groundY - peak) / TILE;
  T('jump height ≥ 3.2 tiles', jumpTiles >= 3.2, jumpTiles.toFixed(2));
  // 달리기 점프 거리
  simSteps(60);
  keys.r = true; keys.run = true;
  simSteps(80); // 가속
  const x0 = player.x;
  keys.j = true;
  let air = 0;
  simSteps(3);
  while (!player.onG && air < 300) { update(1 / 60); air++; }
  const distT = (player.x - x0) / TILE;
  keys.r = false; keys.run = false; keys.j = false;
  T('run-jump distance ≥ 4.5 tiles', distT >= 4.5, distT.toFixed(2));
  // 밟기
  LV = makeTestLevel(60); ents = [{ type: 'ghost', x: 8 * TILE, y: (ROWS - 2) * TILE - 28, w: 22, h: 28, vx: 0, vy: 0, dir: -1 }];
  player = mkPlayer(8 * TILE - 10, (ROWS - 2) * TILE - 160);
  const sc0 = G.score;
  simSteps(60);
  T('stomp kills enemy', ents.every(e => e.type !== 'ghost') && G.score > sc0, `score+${G.score - sc0}`);
  // 데미지 체인: 불꽃폼 → 파워 → 일반 → 사망
  LV = makeTestLevel(60); ents = [];
  player = mkPlayer(5 * TILE, (ROWS - 4) * TILE);
  player.pw = 2;
  simSteps(20);
  const foe = { type: 'ghost', x: player.x, y: player.y, w: 22, h: 28, vx: 0, vy: 0, dir: -1 };
  ents.push(foe);
  simSteps(3);
  T('hit fire form → downgrade to fruit form', player.pw === 1 && !player.dead, `pw=${player.pw}`);
  player.inv = 0;
  simSteps(3);
  T('hit powered → lose power', player.pw === 0 && !player.dead, `inv=${player.inv.toFixed(1)}`);
  player.inv = 0;
  simSteps(3);
  T('hit normal → death', player.dead === true);
  // 불꽃 발사 (고추 폼): Shift 탭 → 파이어볼 → 전방 적 처치
  LV = makeTestLevel(60);
  ents = [{ type: 'ghost', x: 10 * TILE, y: (ROWS - 2) * TILE - 28, w: 22, h: 28, vx: 0, vy: 0, dir: -1 }];
  player = mkPlayer(6 * TILE, (ROWS - 3) * TILE);
  player.pw = 2; player.dir = 1;
  keys.run = false; runWasDown = false;
  simSteps(20);
  keys.run = true; simSteps(2);
  const fbSpawned = ents.some(e => e.type === 'fb');
  simSteps(80); keys.run = false;
  T('pepper form → fireball kills enemy', fbSpawned && ents.every(e => e.type !== 'ghost'), `fb=${fbSpawned}`);
  // 호랑이 활강: 점프 홀드 낙하 속도 제한
  LV = makeTestLevel(60); ents = [];
  player = mkPlayer(6 * TILE, 2 * TILE);
  player.pw = 3;
  keys.j = true; jumpWasDown = true; jumpBuf = 0;
  let maxFall = 0;
  for (let i = 0; i < 40; i++) { update(1 / 60); if (!player.onG) maxFall = Math.max(maxFall, player.vy); }
  keys.j = false; jumpWasDown = false;
  T('tiger form glide caps fall speed', maxFall <= 130 && maxFall > 0, `maxVy=${maxFall.toFixed(0)}`);
  // 유니콘 탑승/피격 이탈
  LV = makeTestLevel(60); ents = [{ type: 'uni', x: 6 * TILE, y: (ROWS - 2) * TILE - 32, w: 30, h: 30, vx: 0, vy: 0, dir: 1, bob: 0 }];
  player = mkPlayer(6 * TILE - 6, (ROWS - 2) * TILE - 40);
  G.lives = 3;
  simSteps(20);
  T('unicorn mount', player.riding === true);
  ents.push({ type: 'ghost', x: player.x, y: player.y + 10, w: 22, h: 28, vx: 0, vy: 0, dir: -1 });
  simSteps(3);
  T('damage while riding → unicorn flees', player.riding === false && !player.dead && ents.some(e => e.type === 'uniFlee'));
  // 엽전 100개 → 1UP
  LV = makeTestLevel(60);
  player = mkPlayer(5 * TILE, (ROWS - 3) * TILE);
  G.coins = 99;
  ents = [{ type: 'coin', x: player.x, y: player.y + 4, w: 20, h: 20 }];
  const lv0 = G.lives;
  simSteps(5);
  T('100 coins → 1UP', G.coins === 0 && G.lives === lv0 + 1, `coins=${G.coins} lives=${G.lives}`);
  // 복주머니 블록
  LV = makeTestLevel(60);
  setT(LV.t, LV.W, 7, ROWS - 6, 3);
  LV.qc.set((ROWS - 6) * LV.W + 7, 'fruit');
  player = mkPlayer(7 * TILE + 5, (ROWS - 4) * TILE);
  ents = [];
  simSteps(30); // 착지 후 점프 (점프버퍼 만료 방지)
  keys.j = true; simSteps(30); keys.j = false;
  T('? block spawns item', LV.t[(ROWS - 6) * LV.W + 7] === 4 && ents.some(e => e.type === 'fruit'));
  // 보스 5회 밟기 → 처치 + 골 등장
  LV = makeTestLevel(80);
  LV.stage = 5;
  LV.bossArena = { x0: 2 * TILE, x1: 78 * TILE, entered: true };
  LV.goalActive = false;
  const bossE = { type: 'boss', x: 30 * TILE, y: (ROWS - 2) * TILE - 60, w: 48, h: 60, vx: 0, vy: 0, dir: -1, hp: 5, maxHp: 5, throwT: 99, stun: 0, inv: 0, dead: false };
  ents = [bossE];
  player = mkPlayer(10 * TILE, (ROWS - 4) * TILE);
  for (let k = 0; k < 5; k++) { bossE.inv = 0; bossStomp(bossE); }
  T('boss dies after 5 stomps → goal appears', bossE.hp <= 0 && LV.goalActive === true && G.score >= 5000);
  // 쪼쪼 여왕: 기관총 연사 + 6회 타격 처치
  LV = makeTestLevel(80);
  LV.stage = 10; G.stage = 10;
  LV.bossArena = { x0: 2 * TILE, x1: 78 * TILE, entered: true };
  LV.goalActive = false;
  const jjo = { type: 'jjojjo', x: 40 * TILE, y: (ROWS - 2) * TILE - 58, w: 44, h: 58, vx: 0, vy: 0, dir: -1, hp: 6, maxHp: 6, burstT: 0.05, burstN: 0, shotT: 0, flash: 0, stun: 0, inv: 0, dead: false };
  ents = [jjo];
  player = mkPlayer(10 * TILE, (ROWS - 4) * TILE);
  player.inv = 99; // 탄환 피해 무시하고 발사만 검증
  simSteps(90);
  T('jjojjo fires machine-gun bullets', ents.some(e => e.type === 'blt') || jjo.burstN > 0, `blts=${ents.filter(e => e.type === 'blt').length}`);
  for (let k = 0; k < 6; k++) { jjo.inv = 0; bossStomp(jjo); }
  T('jjojjo dies after 6 hits → goal appears', jjo.hp <= 0 && jjo.dead && LV.goalActive === true);
  G.stage = 1;
  // 시작 안전지대: 각 스테이지 스폰 후 2초간 정지해도 죽지 않아야 (공중 달걀·근접 적 사전차단)
  {
    let allSafe = true, badStage = 0;
    for (let s = 1; s <= 10; s++) {
      G.mode = 'play'; G.introT = 0; G.clearT = 0; G.lives = 5; G.time = 300;
      G.stage = s; LV = genLevel(s); spawnEnts();
      player = mkPlayer(3 * TILE, (ROWS - 4) * TILE);
      keys.l = keys.r = keys.j = keys.run = false;
      if (LV.bossArena) LV.bossArena.entered = false; // 보스전 미개시 상태
      simSteps(120); // 2초 정지
      if (player.dead) { allSafe = false; badStage = s; break; }
    }
    T('spawn-safe: idle 2s at start survives (all 10 stages)', allSafe, badStage ? `died on stage ${badStage}` : 'ok');
  }
  G.stage = 1;
  // 골인 → 클리어
  LV = makeTestLevel(40);
  LV.goalActive = true;
  ents = [];
  player = mkPlayer(LV.goalX - 40, (ROWS - 3) * TILE - 4);
  G.clearT = 0; G.stage = 1;
  keys.r = true; simSteps(60); keys.r = false;
  T('goal touch → stage clear', G.clearT > 0 || G.stage === 2, `clearT=${G.clearT.toFixed(2)} stage=${G.stage}`);
  G.clearT = 0;
  // 기록 라운드트립
  {
    const bak = localStorage.getItem(REC_KEY);
    REC = { nick: 'SIM', top10: [], muted: false, best: 0 };
    addRecord(7777, 3);
    const re = loadRec();
    T('record round-trip', re.top10.length === 1 && re.top10[0].s === 7777 && re.best === 7777);
    if (bak === null) localStorage.removeItem(REC_KEY); else localStorage.setItem(REC_KEY, bak);
    REC = loadRec();
  }
  // 렌더 스모크
  try { layout(); G.mode = 'play'; LV = genLevel(1); spawnEnts(); player = mkPlayer(3 * TILE, (ROWS - 4) * TILE); render(1.2); T('render ok', true); }
  catch (e) { T('render ok', false, e.message); }
  console.warn(`[SIM] DONE pass=${pass} fail=${fail}`);
}

/* ===== 스크린샷 모드 (?shot=1) ===== */
function setupShot() {
  buildSprites();
  REC.nick = 'UJA';
  G.mode = 'play'; G.stage = 1; G.lives = 3; G.score = 12480; G.coins = 37; G.time = 248;
  LV = genLevel(1);
  spawnEnts();
  player = mkPlayer(30 * TILE, (ROWS - 5) * TILE);
  player.vy = -200; player.onG = false; player.dir = 1;
  if (qs.get('shot') === '2') { player.riding = true; G.stage = 3; LV = genLevel(3); spawnEnts(); player.x = 40 * TILE; player.y = (ROWS - 6) * TILE; }
  if (qs.get('shot') === '3') { // 설산 활강 (호랑이 폼)
    G.stage = 7; LV = genLevel(7); spawnEnts();
    player.x = 44 * TILE; player.y = (ROWS - 8) * TILE; player.pw = 3; player.vy = 120; player.onG = false;
  }
  if (qs.get('shot') === '4') { // 쪼쪼 보스전 (불꽃 폼)
    G.stage = 10; LV = genLevel(10); spawnEnts();
    const jj = ents.find(e => e.type === 'jjojjo');
    LV.bossArena.entered = true;
    player.pw = 2; player.x = jj.x - 260; player.y = (ROWS - 4) * TILE; player.dir = 1;
    jj.hp = 4; jj.flash = 1; jj.animT = 0; jj.dir = -1;
    for (let k = 0; k < 3; k++) ents.push({ type: 'blt', x: jj.x - 40 - k * 60, y: jj.y + 26 + k * 8, w: 14, h: 8, vx: -330, vy: 0, t: 0, dir: -1 });
    ents.push({ type: 'fb', x: player.x + 60, y: player.y + 6, w: 14, h: 14, vx: 360, vy: 0, t: 0.4, dir: 1 });
  }
  if (qs.get('shot') === '5') { // 매화 대나무숲 (기본 폼 + 꽃)
    G.stage = 6; LV = genLevel(6); spawnEnts();
    player.x = 26 * TILE; player.y = (ROWS - 5) * TILE;
  }
  if (qs.get('shot') === '6') { // 노을 바닷가
    G.stage = 8; LV = genLevel(8); spawnEnts();
    player.x = 30 * TILE; player.y = (ROWS - 5) * TILE;
  }
  if (qs.get('shot') === '7') { // 구름 하늘길
    G.stage = 9; LV = genLevel(9); spawnEnts();
    player.x = 34 * TILE; player.y = (ROWS - 6) * TILE;
  }
  if (qs.get('shot') === '9s') { // 스테이지9 실제 스폰지점 (시작 안전 확인)
    G.stage = 9; LV = genLevel(9); spawnEnts();
    player = mkPlayer(3 * TILE, (ROWS - 4) * TILE); player.dir = 1;
  }
  if (qs.get('shot') === '10s') { // 스테이지10 실제 스폰지점
    G.stage = 10; LV = genLevel(10); spawnEnts();
    player = mkPlayer(3 * TILE, (ROWS - 4) * TILE); player.dir = 1;
  }
  cam.x = qs.get('shot') && qs.get('shot').endsWith('s') ? 0 : player.x - 200;
  showScreen(null);
  document.body.classList.add('playing');
  G.introT = 0;
  sparkle(player.x + 20, player.y + 30, '#ffe28a');
  updateHUD();
  window._SHOT_READY = true;
}

/* ===== 스프라이트 시트 (?shot=z, 디자인 검수용) ===== */
function setupSheet() {
  window._SHEET = true;
  buildSprites();
  showScreen(null);
  drawSheet();
  window._SHOT_READY = true;
}
function drawSheet() {
  const c = document.getElementById('game');
  if (c.width !== 1240) { c.width = 1240; c.height = 760; c.style.width = '1240px'; c.style.height = '760px'; }
  const g = c.getContext('2d');
  g.fillStyle = '#39465a'; g.fillRect(0, 0, 1240, 760);
  g.imageSmoothingEnabled = true;
  // 유자 4폼 × 3프레임
  for (let fm = 0; fm < 4; fm++)
    for (let f = 0; f < 3; f++)
      g.drawImage(SPR.ujaF[fm][f], 25 + (fm * 3 + f) * 100, 20, 90, 102);
  // 쪼쪼 3프레임 + 유니콘 + 아이템
  SPR.jjo.forEach((s, i) => g.drawImage(s, 25 + i * 195, 150, 180, 198));
  g.drawImage(SPR.uni[0], 620, 180, 144, 128);
  g.drawImage(SPR.pepper[0], 790, 190, 66, 78);
  g.drawImage(SPR.tiger[0], 870, 195, 72, 72);
  g.drawImage(SPR.fruit[0], 960, 195, 72, 78);
  g.drawImage(SPR.fb[0], 1050, 200, 64, 64);
  g.drawImage(SPR.blt[0], 1120, 210, 90, 50);
  // 요괴들
  [SPR.ghost[0], SPR.reaper[0], SPR.dok[0], SPR.egg[0], SPR.fox[0], SPR.boss[0]].forEach((s, i) =>
    g.drawImage(s, 25 + i * 130, 380, s.width * 0.9, s.height * 0.9));
  // 지면 타일 6종 + 장식
  ['grass', 'dark', 'snow', 'sand', 'cloud', 'palace'].forEach((k, i) =>
    g.drawImage(SPR.ground[k], 25 + i * 90, 560, 80, 80));
  g.drawImage(SPR.flower[0], 590, 560, 48, 54);
  g.drawImage(SPR.flower[1], 650, 560, 48, 54);
  g.drawImage(SPR.grass[0], 710, 575, 48, 36);
}

/* ===== 부팅 ===== */
layout();
uiInit();
let lastT = 0, acc = 0;
function frame(tms) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (tms - lastT) / 1000 || 0.016);
  lastT = tms;
  if (G.mode === 'play' && !G.paused) {
    acc += dt;
    while (acc >= 1 / 60) { update(1 / 60); acc -= 1 / 60; }
  }
  if (window._SHEET) drawSheet();
  else if (G.mode === 'play' || SHOT) render(tms / 1000);
}
if (qs.get('test') === 'sim') { runSim(); }
else if (qs.get('shot') === 'z') { setupSheet(); }
else if (SHOT) { setupShot(); }
else { buildSprites(); }
requestAnimationFrame((t) => { lastT = t; requestAnimationFrame(frame); });
