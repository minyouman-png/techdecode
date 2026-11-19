/* ══ 말 ═══════════════════════════════════════════════════════════════════
 * CrazyGames 는 세계 포털이라 한국어 전용으로는 관객이 아예 못 논다.
 *
 * ⚠️★**전역 `t` 를 지역 `const t` 가 가리면 화면이 통째로 빈다**(삼한통일전에서 실측).
 *   그래서 `t` 를 피해 `tx` 로 지었는데 — **그것도 가려졌다.** 게임 코드의
 *   `const [tx, ty] = P(...)`(타일 좌표)가 같은 이름이라 `tx is not a function` 으로 죽었다.
 *   짧은 이름은 전부 좌표·시간으로 이미 쓰이고 있다 → **`L10N`** 처럼 지역 변수가 될 리 없는 이름을 쓴다.
 * ⚠️번역이 빠진 열쇠는 **한국어로 조용히 되돌아간다**(영어 화면에 한글이 섞인다).
 *   그래서 `?test=sim` 이 **빠진 열쇠를 세어 검증**한다 — 조용한 폴백은 눈으로 못 잡는다. */

// ⚠️node 로도 불러온다(열쇠 짝 맞추기 검사) — 브라우저 전역이 없어도 죽지 않아야 한다
const P = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
/** ko 는 한국어권에서만 기본값이다. 포털 기본은 영어. */
export const LANG = (() => {
  const q = (P.get('lang') || '').toLowerCase();
  if (q === 'ko' || q === 'en') return q;
  try { if ((globalThis.navigator?.language || '').toLowerCase().startsWith('ko')) return 'ko'; } catch (e) {}
  return 'en';
})();

/** 데이터 객체의 언어 필드 고르기.
 * ⚠️꼴이 두 가지다: 도둑·장치는 `{ ko, note, en, en_note }`, 금고·장은 `{ name, hint, en, en_hint }`.
 *   처음엔 `o[k || 'ko']` 만 봐서 **금고 이름이 빈칸으로 나왔다**(검증이 잡았다).
 * ⚠️번역이 없으면 **있는 쪽으로** 돌아간다 — 빈칸보다 낫고, 빠진 것은 자가검증이 따로 센다. */
export const nm = (o, k = '') => {
  if (!o) return '';
  const en = o['en' + (k ? '_' + k : '')];
  const ko = o[k || 'ko'] ?? o[k || 'name'];
  return (LANG === 'en' ? (en ?? ko) : (ko ?? en)) ?? '';
};

const S = {
  ko: {},   // 기본값이 곧 한국어라 비워 둔다(아래 EN 에 없는 열쇠는 한국어로 나간다)
  en: {
    // 머리·단추
    title: 'Vault Maker', tagBuild: 'prototype',
    pause: '⏸ Pause', resume: '▶ Resume', speed: '▶ ×', again: '↺ Retry',
    campaign: '🏛 Campaign', design: '🔨 Design', close: 'Close', restart: '↺ Start over',
    // 시작 화면
    homeT: '🔓 Crack the vault',
    homeP: 'Spend your budget on thieves, and decide <b>when to send each one in</b>.<br>'
         + 'One thief reaching the vault (◆) wins. You get <b>one</b> intervention per run.',
    campT: '🏛 Campaign',
    campP: '36 vaults you can finish alone. <b>Each vault teaches one thing.</b>',
    mkMine: '🔨 Build my own vault', getVault: '📥 Open a vault you received (code or file)',
    // 옆 패널
    team: 'Your team', moves: 'Intervention (once)', log: 'Log', place: 'What to place', state: 'Status',
    budgetLeft: 'Budget left', proveBtn: 'Break into my own vault →',
    exportBtn: '📤 Export (code or file)', exportLocked: '📤 Export — prove it first',
    // 화면 안내
    hintSend: 'Click a thief on the left to send them in',
    hintSendM: 'Tap a thief below to send them in',
    hintBreach: 'Click the wall to blow up', hintDecoy: 'Click where to lure the dogs',
    hintPaint: 'Drag to paint · paint the same thing again to erase',
    noPath: '⛔ No path to the vault', pathLen: 'entrance→vault', tiles: ' tiles',
    noBudget: 'Not enough budget', cantAfford: 'Not enough budget',
    // 결과
    win: '🔓 Cracked', lose: '🚨 Failed',
    allDead: 'Every thief is down. Try a different team or a different order.',
    reached: '◆ Reached the vault — success',
    nextVault: 'Next vault →', toCamp: 'Back to campaign →', backDesign: '← Back to design',
    proveOk: '🔓 Proven — you can publish it', proveNo: '⛔ Not proven — you cannot publish it',
    proveOkP: 'You broke into the vault you built.',
    proveNoP: 'A vault its own maker cannot crack never leaves your machine.'
            + '<br>Go back and leave it a weakness.',
    fixIt: 'Back to design (fix it)',
    tookS: 'Time', thievesN: 'Thieves', usedMove: 'Intervention', yes: 'used', no: 'not used',
    bestRec: 'Best', tryNoMove: 'Could you do it without an intervention?',
    // 주고받기
    shareOutT: '📤 Export vault',
    shareOutP: 'Hand over this code and anyone can try your vault. <b>No server, no account.</b>',
    shareInT: '📥 Open a vault', shareInP: 'Paste the code you received, or open a file.',
    copy: '📋 Copy', saveFile: '💾 Save as file', openFile: '📂 Open file', raidIt: 'Crack this vault →',
    copied: 'Copied. (If not, select the text above and copy it.)',
    errNotCode: 'That is not a vault code', errCorrupt: 'The code is damaged (looks truncated)',
    errSize: 'Vault size does not match', errNoSV: 'No entrance or vault room',
    errGlyph: 'Unknown symbols in the code', errSealed: 'No path from the entrance to the vault',
    mine: 'My vault', iBuilt: 'I built this', received: 'Received vault', makerRec: 'Maker’s record',
    unnamed: 'Unnamed vault',
    // 설계
    designTitle: 'Building my vault — walls cost budget too', designHud: '🔨 Design　Budget left ',
    proveTitle: 'Proving — cracking the vault I built',
    // 기록 줄
    sent: 'sent in', down: 'down', spotted: 'spotted', heldDoor: 'held at the locked door',
    plateAll: '📿 Pressure plate! The whole area is exposed',
    blackout: '⚡ Blackout — electric devices down for 3.5s',
    breached: '💥 Breach — a wall is gone', notWall: '💥 That tile is not a wall',
    outerWall: '💥 You cannot breach the outer wall', decoyed: '📢 Decoy — the dogs go there',
  },
};

export const L10N = (k) => (LANG === 'ko' ? null : S.en[k]) ?? S.ko[k] ?? KO[k] ?? k;

/* 한국어 원문 — 영어 열쇠와 **하나씩 짝**이라야 한다(검증이 그걸 센다) */
const KO = {
  title: '금고 설계자', tagBuild: '프로토타입',
  pause: '⏸ 일시정지', resume: '▶ 계속', speed: '▶ ', again: '↺ 다시',
  campaign: '🏛 캠페인', design: '🔨 설계', close: '닫기', restart: '↺ 처음부터',
  homeT: '🔓 금고를 턴다',
  homeP: '예산으로 도둑을 뽑고, <b>언제 넣을지</b>를 정하세요.<br>'
       + '한 명이라도 금고실(◆)에 닿으면 성공입니다. 개입은 판당 <b>한 번</b>뿐입니다.',
  campT: '🏛 캠페인',
  campP: '혼자서도 끝나는 36개. <b>한 금고가 한 가지를 가르칩니다.</b>',
  mkMine: '🔨 내 금고를 짓는다', getVault: '📥 받은 금고 열기 (코드·파일)',
  team: '팀 편성', moves: '개입 (한 번)', log: '기록', place: '무엇을 놓나', state: '상태',
  budgetLeft: '남은 예산', proveBtn: '내 금고를 털어 본다 →',
  exportBtn: '📤 내보내기 (코드·파일)', exportLocked: '📤 내보내기 — 먼저 증명하세요',
  hintSend: '왼쪽에서 도둑을 눌러 투입하세요', hintSendM: '아래에서 도둑을 눌러 투입하세요',
  hintBreach: '부술 벽을 클릭하세요', hintDecoy: '개를 부를 곳을 클릭하세요',
  hintPaint: '끌어서 칠하세요 · 같은 것을 또 칠하면 지워집니다',
  noPath: '⛔ 길이 끊겼습니다', pathLen: '입구→금고실', tiles: '칸',
  noBudget: '예산이 모자랍니다', cantAfford: '예산이 모자란다',
  win: '🔓 돌파', lose: '🚨 실패',
  allDead: '도둑이 전부 쓰러졌다. 편성이나 순서를 바꿔 보세요.',
  reached: '◆ 금고 도달 — 성공',
  nextVault: '다음 금고 →', toCamp: '캠페인으로 →', backDesign: '← 설계로',
  proveOk: '🔓 증명 완료 — 공개할 수 있습니다', proveNo: '⛔ 증명 실패 — 공개할 수 없습니다',
  proveOkP: '내가 지은 금고를 내가 뚫었습니다.',
  proveNoP: '자기도 못 뚫는 금고는 세상에 나가지 않습니다.<br>설계로 돌아가 약점을 만들어 주세요.',
  fixIt: '설계로 돌아가기 (고치기)',
  tookS: '걸린 시간', thievesN: '도둑', usedMove: '개입', yes: '사용', no: '안 씀',
  bestRec: '최고 기록', tryNoMove: '개입 없이도 될까?',
  shareOutT: '📤 금고 내보내기',
  shareOutP: '이 코드를 건네면 상대가 그대로 털어 볼 수 있습니다. <b>서버도 계정도 필요 없습니다.</b>',
  shareInT: '📥 금고 받기', shareInP: '받은 코드를 붙여넣거나 파일을 여세요.',
  copy: '📋 복사', saveFile: '💾 파일로 저장', openFile: '📂 파일 열기', raidIt: '이 금고를 턴다 →',
  copied: '복사했습니다. (안 됐으면 위 글상자에서 직접 복사하세요)',
  errNotCode: '금고 코드가 아닙니다', errCorrupt: '코드가 손상됐습니다 (복사가 잘린 것 같습니다)',
  errSize: '금고 크기가 맞지 않습니다', errNoSV: '입구나 금고실이 없습니다',
  errGlyph: '모르는 기호가 들어 있습니다', errSealed: '입구에서 금고실까지 길이 없습니다',
  mine: '내 금고', iBuilt: '내가 지었다', received: '받은 금고', makerRec: '설계자 기록',
  unnamed: '이름 없는 금고',
  designTitle: '내 금고 짓기 — 벽에도 값이 든다', designHud: '🔨 설계　남은 예산 ',
  proveTitle: '증명 — 내 금고를 내가 턴다',
  sent: '투입', down: '쓰러짐', spotted: '발각', heldDoor: '잠금문에 걸림',
  plateAll: '📿 압력판! 구역 전체 발각',
  blackout: '⚡ 정전 — 전기 장치 3.5초 정지',
  breached: '💥 폭파 — 벽이 뚫렸다', notWall: '💥 그 칸은 벽이 아니다',
  outerWall: '💥 바깥벽은 못 부순다', decoyed: '📢 양동 — 개들이 그쪽으로',
};

export const KEYS = { ko: Object.keys(KO), en: Object.keys(S.en) };
