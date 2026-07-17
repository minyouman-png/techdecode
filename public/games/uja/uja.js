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
    help: '<b>←→</b> Move · <b>Space/↑</b> Jump (hold = higher) · <b>Shift</b> Run<br>Stomp on ghosts to defeat them · ride the unicorn <b>Uni</b> for a double jump!<br><b>ESC</b> Pause · 📱 touch controls on mobile',
    credit: 'An indie game built 100% with AI · July 2026 · ',
    expSave: '💾 Export Save', impSave: '📂 Import Save',
    impConfirm: 'Overwrite your current records with this save file?',
    impErr: 'Not a valid SUPER UJA save file', expDone: 'Save file downloaded',
    recNote: 'Records are stored in this browser. Export your save to move them to another computer.',
    colRank: '#', colName: 'NAME', colScore: 'SCORE', colStage: 'STAGE', colDate: 'DATE',
    emptyRec: 'No records yet — go save Joseon!',
    pauseT: '⏸ Paused', resume: '▶ Resume', quit: '🏳 Quit',
    quitConfirm: 'Quit to menu? You can continue from the start of this stage.',
    stages: ['Thatched Village', 'Pine Forest', 'Palace Roofs', 'Underworld Road', "King Yeomra's Palace"],
    stageLbl: 'STAGE', gameOver: 'GAME OVER', stageClear: 'STAGE CLEAR!', timeBonus: 'Time bonus',
    worldClear: '👑 King Yeomra is defeated! Joseon is safe!', newRecord: '🎉 New personal best!',
    finalScore: 'Score', reachedStage: 'Reached', resTitle: '🍋 Result',
    oneUp: '1UP!', mounted: '🦄 Uni joins you!', bossWarn: '⚡ King Yeomra appears!',
    lifeLost: 'Try again!', timeUp: "Time's up!",
  },
  ko: {
    sub: '조선 대모험', start: '▶ 게임 시작', cont: '▶ 이어하기', records: '🏆 기록실',
    back: '← 뒤로', retry: '🔄 다시 도전', menu: '메뉴로', nickPh: '닉네임',
    help: '<b>←→</b> 이동 · <b>Space/↑</b> 점프(길게 = 높이) · <b>Shift</b> 달리기<br>요괴는 밟아서 물리치세요 · 유니콘 <b>유니</b>를 타면 2단 점프!<br><b>ESC</b> 일시정지 · 📱 모바일 터치 지원',
    credit: 'AI로 100% 제작한 인디게임 · 2026년 7월 · ',
    expSave: '💾 세이브 내보내기', impSave: '📂 세이브 불러오기',
    impConfirm: '이 세이브 파일로 현재 기록을 덮어쓸까요?',
    impErr: '올바른 슈퍼유자 세이브 파일이 아닙니다', expDone: '세이브 파일이 다운로드되었습니다',
    recNote: '기록은 이 브라우저에 저장됩니다. 다른 컴퓨터로 옮기려면 세이브를 내보내세요.',
    colRank: '순위', colName: '닉네임', colScore: '점수', colStage: '스테이지', colDate: '날짜',
    emptyRec: '아직 기록이 없습니다 — 조선을 구하러 가요!',
    pauseT: '⏸ 일시정지', resume: '▶ 계속하기', quit: '🏳 그만하기',
    quitConfirm: '메뉴로 나갈까요? 이 스테이지 시작부터 이어할 수 있습니다.',
    stages: ['초가마을', '소나무 숲', '궁궐 지붕', '저승길', '염라대왕궁'],
    stageLbl: '스테이지', gameOver: '게임 오버', stageClear: '스테이지 클리어!', timeBonus: '시간 보너스',
    worldClear: '👑 염라대왕을 물리쳤다! 조선에 평화가!', newRecord: '🎉 개인 최고기록 갱신!',
    finalScore: '점수', reachedStage: '도달', resTitle: '🍋 결과',
    oneUp: '생명 +1!', mounted: '🦄 유니가 함께합니다!', bossWarn: '⚡ 염라대왕 등장!',
    lifeLost: '다시 도전!', timeUp: '시간 초과!',
  },
  ja: {
    sub: '朝鮮大冒険', start: '▶ ゲーム開始', cont: '▶ つづきから', records: '🏆 記録室',
    back: '← 戻る', retry: '🔄 もう一度', menu: 'メニューへ', nickPh: 'ニックネーム',
    help: '<b>←→</b> 移動 · <b>Space/↑</b> ジャンプ(長押し=高く) · <b>Shift</b> ダッシュ<br>妖怪は踏んで倒そう · ユニコーン<b>ユニ</b>に乗ると2段ジャンプ！<br><b>ESC</b> 一時停止 · 📱 モバイルタッチ対応',
    credit: 'AIだけで作られたインディーゲーム · 2026年7月 · ',
    expSave: '💾 セーブを書き出す', impSave: '📂 セーブを読み込む',
    impConfirm: 'このセーブファイルで現在の記録を上書きしますか？',
    impErr: '正しいスーパーユジャのセーブファイルではありません', expDone: 'セーブファイルをダウンロードしました',
    recNote: '記録はこのブラウザに保存されます。別のパソコンへはセーブの書き出しで移行できます。',
    colRank: '順位', colName: '名前', colScore: 'スコア', colStage: 'ステージ', colDate: '日付',
    emptyRec: 'まだ記録がありません — 朝鮮を救いに行こう！',
    pauseT: '⏸ 一時停止', resume: '▶ つづける', quit: '🏳 やめる',
    quitConfirm: 'メニューに戻りますか？このステージの最初から再開できます。',
    stages: ['わらぶきの村', '松の森', '宮殿の屋根', '冥途の道', '閻魔大王宮'],
    stageLbl: 'ステージ', gameOver: 'ゲームオーバー', stageClear: 'ステージクリア！', timeBonus: 'タイムボーナス',
    worldClear: '👑 閻魔大王を倒した！朝鮮に平和が！', newRecord: '🎉 自己ベスト更新！',
    finalScore: 'スコア', reachedStage: '到達', resTitle: '🍋 リザルト',
    oneUp: '残機 +1！', mounted: '🦄 ユニが仲間に！', bossWarn: '⚡ 閻魔大王あらわる！',
    lifeLost: 'もう一度！', timeUp: 'タイムアップ！',
  },
  es: {
    sub: 'AVENTURA EN JOSEON', start: '▶ Empezar', cont: '▶ Continuar', records: '🏆 Récords',
    back: '← Atrás', retry: '🔄 Jugar otra vez', menu: 'Menú', nickPh: 'Apodo',
    help: '<b>←→</b> Moverse · <b>Espacio/↑</b> Saltar (mantén = más alto) · <b>Shift</b> Correr<br>Pisa a los fantasmas para vencerlos · ¡monta a la unicornio <b>Uni</b> para doble salto!<br><b>ESC</b> Pausa · 📱 controles táctiles en móvil',
    credit: 'Un juego indie creado 100% con IA · Julio de 2026 · ',
    expSave: '💾 Exportar partida', impSave: '📂 Importar partida',
    impConfirm: '¿Sobrescribir tus récords actuales con esta partida?',
    impErr: 'No es un archivo de guardado válido de SUPER UJA', expDone: 'Partida descargada',
    recNote: 'Los récords se guardan en este navegador. Exporta tu partida para llevarlos a otro ordenador.',
    colRank: '#', colName: 'NOMBRE', colScore: 'PUNTOS', colStage: 'FASE', colDate: 'FECHA',
    emptyRec: 'Aún no hay récords — ¡ve a salvar Joseon!',
    pauseT: '⏸ Pausa', resume: '▶ Continuar', quit: '🏳 Salir',
    quitConfirm: '¿Salir al menú? Podrás continuar desde el inicio de esta fase.',
    stages: ['Aldea de paja', 'Bosque de pinos', 'Tejados de palacio', 'Camino al inframundo', 'Palacio del Rey Yeomra'],
    stageLbl: 'FASE', gameOver: 'FIN DEL JUEGO', stageClear: '¡FASE SUPERADA!', timeBonus: 'Bono de tiempo',
    worldClear: '👑 ¡El Rey Yeomra ha caído! ¡Joseon está a salvo!', newRecord: '🎉 ¡Nueva mejor marca!',
    finalScore: 'Puntuación', reachedStage: 'Alcanzado', resTitle: '🍋 Resultado',
    oneUp: '¡Vida extra!', mounted: '🦄 ¡Uni se une a ti!', bossWarn: '⚡ ¡Aparece el Rey Yeomra!',
    lifeLost: '¡Inténtalo de nuevo!', timeUp: '¡Se acabó el tiempo!',
  },
  zh: {
    sub: '朝鲜大冒险', start: '▶ 开始游戏', cont: '▶ 继续游戏', records: '🏆 记录室',
    back: '← 返回', retry: '🔄 再来一次', menu: '菜单', nickPh: '昵称',
    help: '<b>←→</b> 移动 · <b>空格/↑</b> 跳跃(长按=更高) · <b>Shift</b> 奔跑<br>踩到妖怪就能打倒它们 · 骑上独角兽<b>Uni</b>可以二段跳！<br><b>ESC</b> 暂停 · 📱 移动端触控支持',
    credit: '100% 由 AI 制作的独立游戏 · 2026年7月 · ',
    expSave: '💾 导出存档', impSave: '📂 导入存档',
    impConfirm: '用此存档覆盖当前记录？',
    impErr: '不是有效的超级柚子存档文件', expDone: '存档已下载',
    recNote: '记录保存在此浏览器中。导出存档即可迁移到其他电脑。',
    colRank: '#', colName: '昵称', colScore: '分数', colStage: '关卡', colDate: '日期',
    emptyRec: '还没有记录——快去拯救朝鲜吧！',
    pauseT: '⏸ 暂停', resume: '▶ 继续', quit: '🏳 退出',
    quitConfirm: '返回菜单？可以从本关开头继续。',
    stages: ['草屋村', '松树林', '宫殿屋顶', '黄泉路', '阎罗大王宫'],
    stageLbl: '关卡', gameOver: '游戏结束', stageClear: '过关！', timeBonus: '时间奖励',
    worldClear: '👑 打败了阎罗大王！朝鲜恢复了和平！', newRecord: '🎉 刷新个人最佳！',
    finalScore: '分数', reachedStage: '到达', resTitle: '🍋 结算',
    oneUp: '生命 +1！', mounted: '🦄 Uni加入了！', bossWarn: '⚡ 阎罗大王出现！',
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
/* 유자: 한복 소녀 (frame 0 idle/걷기1, 1 걷기2, 2 점프) */
function drawUja(x, w, h, frame, powered) {
  const jeog = powered ? '#ffd34d' : '#ffe9a8';   // 저고리
  const chima = powered ? '#e0344a' : '#e8556a';  // 치마
  const legL = frame === 1 ? 3 : 0, legR = frame === 1 ? 0 : 3;
  const jump = frame === 2;
  // 다리 (버선+꽃신)
  x.fillStyle = '#fff';
  x.fillRect(9, h - 8 - (jump ? 2 : legL), 4, 6);
  x.fillRect(17, h - 8 - (jump ? 2 : legR), 4, 6);
  x.fillStyle = '#c0392b';
  x.fillRect(8, h - 4 - (jump ? 2 : legL), 6, 3);
  x.fillRect(16, h - 4 - (jump ? 2 : legR), 6, 3);
  // 치마 (플레어)
  x.fillStyle = chima;
  x.beginPath();
  x.moveTo(10, 16); x.lineTo(20, 16);
  x.lineTo(24 + (jump ? 2 : 0), h - 6); x.lineTo(6 - (jump ? 2 : 0), h - 6);
  x.closePath(); x.fill();
  // 저고리
  x.fillStyle = jeog;
  rr(x, 8, 12, 14, 8, 3); x.fill();
  // 동정(흰 깃) + 고름
  x.strokeStyle = '#fff'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(15, 13); x.lineTo(13, 18); x.stroke();
  x.beginPath(); x.moveTo(15, 13); x.lineTo(17, 18); x.stroke();
  x.strokeStyle = '#d33'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(15, 17); x.lineTo(13, 21); x.stroke();
  // 팔
  x.strokeStyle = jeog; x.lineWidth = 3.4;
  if (jump) {
    x.beginPath(); x.moveTo(9, 15); x.lineTo(4, 10); x.stroke();
    x.beginPath(); x.moveTo(21, 15); x.lineTo(26, 10); x.stroke();
  } else {
    x.beginPath(); x.moveTo(9, 15); x.lineTo(6, 20); x.stroke();
    x.beginPath(); x.moveTo(21, 15); x.lineTo(24, 20); x.stroke();
  }
  // 얼굴
  x.fillStyle = '#ffe3cd';
  x.beginPath(); x.arc(15, 8, 7, 0, 6.283); x.fill();
  // 머리(단발) + 앞머리
  x.fillStyle = '#2a1a14';
  x.beginPath(); x.arc(15, 6.4, 7.2, Math.PI * 0.95, Math.PI * 2.05); x.fill();
  x.beginPath(); x.moveTo(7.8, 6); x.quadraticCurveTo(8, 13, 10, 14);
  x.lineTo(10.5, 8); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(22.2, 6); x.quadraticCurveTo(22, 13, 20, 14);
  x.lineTo(19.5, 8); x.closePath(); x.fill();
  // 댕기 리본
  x.fillStyle = powered ? '#ff5d2e' : '#e8556a';
  x.beginPath(); x.arc(21.5, 3.6, 2.1, 0, 6.283); x.fill();
  x.beginPath(); x.arc(24.2, 5.2, 1.7, 0, 6.283); x.fill();
  // 눈 + 볼터치 + 입
  x.fillStyle = '#241a16';
  x.beginPath(); x.arc(12.4, 8.4, 1.15, 0, 6.283); x.fill();
  x.beginPath(); x.arc(17.6, 8.4, 1.15, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(12.8, 8, 0.4, 0, 6.283); x.fill();
  x.beginPath(); x.arc(18, 8, 0.4, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,130,140,.55)';
  x.beginPath(); x.arc(10.6, 10.6, 1.3, 0, 6.283); x.fill();
  x.beginPath(); x.arc(19.4, 10.6, 1.3, 0, 6.283); x.fill();
  x.strokeStyle = '#b0524a'; x.lineWidth = 0.9;
  x.beginPath(); x.arc(15, 10.4, 1.6, 0.25, Math.PI - 0.25); x.stroke();
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
  // 다리
  x.fillStyle = '#f6f2f8';
  x.fillRect(8, 20 + Math.max(0, step), 4, 10 - Math.max(0, step));
  x.fillRect(24, 20 + Math.max(0, -step), 4, 10 - Math.max(0, -step));
  x.fillRect(13, 21 + Math.max(0, -step), 4, 9 - Math.max(0, -step));
  x.fillRect(19, 21 + Math.max(0, step), 4, 9 - Math.max(0, step));
  // 몸
  rr(x, 6, 12, 24, 11, 6); x.fill();
  // 꼬리 (분홍)
  x.strokeStyle = '#ff9cc8'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(29, 15); x.quadraticCurveTo(35, 17, 33, 24); x.stroke();
  x.strokeStyle = '#c883f0'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(29.5, 16); x.quadraticCurveTo(34, 18, 32.5, 23); x.stroke();
  // 목+머리
  x.fillStyle = '#f6f2f8';
  x.beginPath(); x.moveTo(8, 14); x.lineTo(4, 4); x.lineTo(12, 8); x.closePath(); x.fill();
  x.beginPath(); x.ellipse(5.4, 5, 5, 3.6, -0.3, 0, 6.283); x.fill();
  // 갈기
  x.fillStyle = '#ff9cc8';
  x.beginPath(); x.arc(8.6, 3.4, 2.2, 0, 6.283); x.arc(10.4, 6.4, 2.2, 0, 6.283); x.arc(11.6, 9.8, 2.2, 0, 6.283); x.fill();
  // 뿔 (금색)
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.moveTo(3.4, 2.6); x.lineTo(-0.8, -2.8); x.lineTo(5.4, 0.6); x.closePath(); x.fill();
  // 눈 + 코
  x.fillStyle = '#241a16';
  x.beginPath(); x.arc(3.6, 4.6, 1, 0, 6.283); x.fill();
  x.fillStyle = '#f0b8c8';
  x.beginPath(); x.arc(1, 6.4, 1.1, 0, 6.283); x.fill();
  // 안장 (색동)
  x.fillStyle = '#e8556a'; rr(x, 14, 11, 9, 5, 2); x.fill();
  x.fillStyle = '#4aa8d8'; x.fillRect(14, 13, 9, 1.4);
  x.fillStyle = '#ffd34d'; x.fillRect(14, 14.6, 9, 1.2);
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
  SPR.uja = [0, 1, 2].map(f => mk(30, 34, (x, w, h) => drawUja(x, w, h, f, false)));
  SPR.ujaP = [0, 1, 2].map(f => mk(30, 34, (x, w, h) => drawUja(x, w, h, f, true)));
  SPR.ghost = [0, 1].map(f => mk(28, 30, (x, w, h) => drawGhost(x, w, h, f)));
  SPR.reaper = [0, 1].map(f => mk(28, 32, (x, w, h) => drawReaper(x, w, h, f)));
  SPR.hat = [mk(26, 16, drawHat)];
  SPR.dok = [0, 1].map(f => mk(28, 30, (x, w, h) => drawDokkaebi(x, w, h, f)));
  SPR.egg = [0, 1].map(f => mk(26, 32, (x, w, h) => drawEgg(x, w, h, f)));
  SPR.fox = [0, 1].map(f => mk(36, 28, (x, w, h) => drawFox(x, w, h, f)));
  SPR.uni = [0, 1].map(f => mk(36, 32, (x, w, h) => drawUnicorn(x, w, h, f)));
  SPR.boss = [0, 1].map(f => mk(56, 64, (x, w, h) => drawBoss(x, w, h, f)));
  SPR.tal = [mk(20, 22, drawTalisman)];
  SPR.coin = [mk(20, 20, drawCoin)];
  SPR.fruit = [mk(24, 26, drawFruit)];
  SPR.flame = [mk(22, 24, drawFlame)];
  SPR.goal = [mk(40, 96, drawGoal)];
  SPR.lantern = [mk(20, 28, drawLantern)];
  SPR.tile = {
    1: mk(32, 32, drawTileGround), 2: mk(32, 32, drawTileBrick), 3: mk(32, 32, drawTileQ),
    4: mk(32, 32, drawTileUsed), 5: mk(32, 32, drawTileStone), 6: mk(32, 32, drawTilePlat),
  };
}

/* ============================================================
   레벨 생성 (시드 고정 → 결정적)
   테마: 1 초가마을(낮) 2 소나무숲(석양) 3 궁궐지붕(밤) 4 저승길(동굴) 5 염라궁
   ============================================================ */
const THEMES = [
  { sky: ['#8ed4f2', '#d8f0fa'], hill: '#7ec06a', hill2: '#5ea84e', deco: 'hut', light: 1 },
  { sky: ['#f0975a', '#fce8b8'], hill: '#4a7a52', hill2: '#38663f', deco: 'pine', light: 0.9 },
  { sky: ['#1a2a5e', '#3e4e8e'], hill: '#26325e', hill2: '#1c2648', deco: 'roof', light: 0.7, moon: 1 },
  { sky: ['#241830', '#3c2a4a'], hill: '#302040', hill2: '#241830', deco: 'spirit', light: 0.55, lanterns: 1 },
  { sky: ['#38101c', '#601c28'], hill: '#42141e', hill2: '#300e16', deco: 'palace', light: 0.65, lanterns: 1 },
];
let LV = null; // {t:Uint8Array, W, ents:[], goalX, theme, qc:Map, deco:[], bossArena}
function ti(x, y) { return (x < 0 || x >= LV.W) ? 5 : (y < 0 ? 0 : y >= ROWS ? 0 : LV.t[y * LV.W + x]); }
function setT(t, W, x, y, v) { if (x >= 0 && x < W && y >= 0 && y < ROWS) t[y * W + x] = v; }
const SOLID = [false, true, true, true, true, true, false]; // 6=플랫폼(반통과)

function genLevel(stage) {
  const rng = mulberry32(4200 + stage * 131);
  const W = [150, 165, 175, 185, 150][stage - 1];
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
  ][stage - 1];
  const gapMax = stage <= 1 ? 3 : 4;
  const eDen = 0.16 + stage * 0.035;
  let x = 0, gh = 2; // gh = 지면 높이(타일 수)
  let firstQ = true, uniPlaced = false, powerCnt = 0;
  const uniAt = Math.floor(W * 0.35);
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
      // 적
      if (rng() < eDen && n >= 4) {
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
            if (firstQ || (powerCnt < 2 && rng() < 0.3)) { c = 'fruit'; firstQ = false; powerCnt++; }
            else if (rng() < 0.07) c = 'flame';
            qc.set(by * W + bx, c);
          } else setT(t, W, bx, by, 2);
        }
        i += len + 1;
        continue;
      }
      // 등불 장식
      if (rng() < 0.08) deco.push({ x: gx, y: top - 2, k: 'lantern' });
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
  const endLen = stage === 5 ? 36 : 12;
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
  if (stage === 5) { // 보스 아레나
    ground(x, W, gh);
    const ax = x + 4;
    bossArena = { x0: ax * TILE, x1: (W - 2) * TILE, entered: false };
    for (let r = 0; r < ROWS; r++) setT(t, W, W - 1, r, 5); // 끝벽
    ents.push({ type: 'boss', tx: W - 12, ty: ROWS - gh - 1 });
    goalX = (W - 5) * TILE; // 보스 처치 후 등장
  } else {
    ground(x, W, gh);
    goalX = (W - 6) * TILE;
    deco.push({ x: W - 4, y: ROWS - gh - 2, k: 'lantern' });
  }
  // 유니콘 미배치 시 시작 지점 근처에
  if (!uniPlaced) ents.push({ type: 'uni', tx: 12, ty: ROWS - 3 });
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
let jumpBuf = 0, jumpWasDown = false;

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
  }
  LV.goalActive = LV.stage !== 5;
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
  // 가변 점프 (홀드)
  p.grav = (p.vy < 0 && keys.j) ? GRAV * 0.52 : GRAV;
  p.prevB = p.y + p.h;
  p.hitWall = 0;
  const head = tileCollide(p, dt);
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
    G.msg = L.bossWarn; G.msgT = 2.2;
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
    }
    // 플레이어 상호작용 (적 계열)
    if (!e.dead && !p.dead && ['ghost', 'reaper', 'dok', 'egg', 'fox', 'hat', 'tal', 'boss'].includes(e.type)) {
      if (!overlap(e, p)) continue;
      if (e.type === 'hat' && e.t < 0.3) continue;
      const stomp = p.vy > 130 && p.prevB <= e.y + 10 && e.type !== 'tal';
      if (stomp) {
        p.vy = keys.j ? -500 : -330;
        if (e.type === 'boss') { bossStomp(e); }
        else if (e.type === 'reaper') {
          e.dead = true;
          poof(e.x + 11, e.y + 10, '#cfd6de');
          addScore(100, e.x, e.y); sfx.stomp();
          ents.push({ type: 'hat', x: e.x, y: e.y + e.h - 16, w: 24, h: 15, dir: p.x + p.w / 2 > e.x + e.w / 2 ? -1 : 1, vy: 0, t: 0 });
        } else killEnemy(e, e.type === 'fox' ? 200 : e.type === 'hat' ? 100 : e.type === 'dok' ? 150 : 100);
      } else if (p.star > 0 && e.type !== 'boss') {
        killEnemy(e, 200, true);
      } else if (e.type !== 'boss' || e.inv <= 0) {
        damagePlayer();
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
function bossStomp(e) {
  if (e.inv > 0) return;
  e.hp--; e.inv = 1.0; e.stun = 0.8;
  poof(e.x + e.w / 2, e.y + 8, '#ffd34d');
  addScore(500, e.x + e.w / 2, e.y);
  sfx.bossHit();
  if (e.hp <= 0) {
    e.dead = true;
    for (let i = 0; i < 4; i++)
      setTimeout(() => poof(e.x + 10 + Math.random() * 40, e.y + 10 + Math.random() * 40, i % 2 ? '#8a1a28' : '#ffd34d'), i * 130);
    addScore(5000, e.x + e.w / 2, e.y - 20);
    sfx.bossDie();
    LV.goalActive = true;
    bgmStart(false);
    G.msg = '👑'; G.msgT = 1.5;
  }
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
  if (G.stage >= 5) { G.won = true; finishGame(true); }
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
    cx.fillStyle = th.deco === 'pine' ? '#ff8c4a' : '#ffe082';
    cx.beginPath(); cx.arc(vw - 90, 78, 26, 0, 6.283); cx.fill();
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
      cx.drawImage(SPR.tile[v], tx * TILE - camX, ty * TILE + by, TILE, TILE);
    }
  }
  // 장식 (등불)
  for (const d of LV.deco) {
    const dx = d.x * TILE - camX;
    if (dx < -40 || dx > vw + 40) continue;
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
      case 'flame': cx.drawImage(SPR.flame[0], ex, e.y + Math.sin(e.t * 4) * 3, 22, 24); break;
      case 'tal': cx.drawImage(SPR.tal[0], ex, e.y, 20, 22); break;
      case 'boss': {
        if (e.inv > 0 && Math.floor(nowS * 14) % 2) break;
        flip(SPR.boss[Math.floor((e.animT || 0) * 4) % 2], ex - 4, e.y - 3, 56, 64, -e.dir);
        break;
      }
    }
  }
  // 플레이어
  if (player && !(player.inv > 0 && Math.floor(nowS * 14) % 2 && !player.dead)) {
    const p = player;
    const set = p.pw > 0 ? SPR.ujaP : SPR.uja;
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
  const boss = ents.find(e => e.type === 'boss');
  if (boss && LV.bossArena && LV.bossArena.entered) {
    const bw = 200, bx = vw / 2 - bw / 2;
    cx.fillStyle = 'rgba(0,0,0,.5)';
    cx.beginPath(); cx.roundRect(bx - 6, 14, bw + 12, 22, 10); cx.fill();
    cx.fillStyle = '#3a3a44';
    cx.beginPath(); cx.roundRect(bx, 20, bw, 10, 5); cx.fill();
    cx.fillStyle = '#d8425a';
    cx.beginPath(); cx.roundRect(bx, 20, bw * boss.hp / boss.maxHp, 10, 5); cx.fill();
    cx.font = '900 11px sans-serif'; cx.fillStyle = '#ffe28a';
    cx.fillText('☠ ' + L.stages[4], vw / 2, 10);
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
  document.getElementById('hLife').textContent = `💗 ${Math.max(0, G.lives)}`;
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
  T('sprites built', !!(SPR.uja && SPR.uja[0].width && SPR.boss && SPR.tile[1]));
  // 레벨 5종 정적 검증
  for (let s = 1; s <= 5; s++) {
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
    const enemies = lv.ents.filter(e => !['coin', 'uni', 'boss'].includes(e.type)).length;
    const hasUni = lv.ents.some(e => e.type === 'uni');
    const hasFruit = [...lv.qc.values()].includes('fruit');
    const okBoss = s !== 5 || lv.ents.some(e => e.type === 'boss');
    T(`stage ${s} valid`, maxGap <= 4 && maxStep <= 3 && enemies > 3 && hasUni && hasFruit && okBoss && lv.goalX < lv.W * TILE,
      `gap=${maxGap} step=${maxStep} foes=${enemies} uni=${hasUni} fruit=${hasFruit}`);
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
  // 데미지 체인: 파워 → 일반 → 사망
  LV = makeTestLevel(60); ents = [];
  player = mkPlayer(5 * TILE, (ROWS - 4) * TILE);
  player.pw = 1;
  simSteps(20);
  const foe = { type: 'ghost', x: player.x, y: player.y, w: 22, h: 28, vx: 0, vy: 0, dir: -1 };
  ents.push(foe);
  simSteps(3);
  T('hit powered → lose power', player.pw === 0 && !player.dead, `inv=${player.inv.toFixed(1)}`);
  player.inv = 0;
  simSteps(3);
  T('hit normal → death', player.dead === true);
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
  cam.x = player.x - 200;
  showScreen(null);
  document.body.classList.add('playing');
  G.introT = 0;
  sparkle(player.x + 20, player.y + 30, '#ffe28a');
  updateHUD();
  window._SHOT_READY = true;
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
  if (G.mode === 'play' || SHOT) render(tms / 1000);
}
if (qs.get('test') === 'sim') { runSim(); }
else if (SHOT) { setupShot(); }
else { buildSprites(); }
requestAnimationFrame((t) => { lastT = t; requestAnimationFrame(frame); });
