// 삼한통일전 — 두 언어. 한국어가 원본이고 영어는 그 뜻을 옮긴 것이다.
// ★CrazyGames 는 영어권 포털이라 UI 가 영어로 읽혀야 한다.
'use strict';

const MON_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const I18N = {
  ko: {
    lang: '한국어',
    modeCampaign: '통일전', modeCampaignSub: '246년부터 25년. 삼한을 하나로.',
    modeSkirmish: '기리영 싸움', modeSkirmishSub: '한 판으로 끝나는 전투. 3분이면 붙습니다.',
    skirmishIntro: '246년 8월. 낙랑의 부종사가 진한 여덟 나라를 떼어 가려 하자 한(韓)이 격분했다. ' +
      '그대는 마한의 군사를 이끌고 대방군의 기리영을 친다.',
    skirmishWin: '기리영을 불태웠습니다. 대방태수 궁준이 이 싸움에서 전사했습니다.',
    skirmishLose: '한(韓)의 군사가 흩어졌습니다. 두 군이 끝내 한을 눌렀습니다.',
    again: '다시', toCampaign: '통일전 시작', backMenu: '처음으로',
    brand: '삼한통일전',
    szL: '대', szM: '중', szS: '소',
    abMu: '무', abJi: '지', abJg: '정',
    // 시작
    eyebrow: '서기 246년 · 관구검이 환도성을 치고 마한이 기리영을 친 해',
    title: '삼한통일전', lede:
      '부여에서 규슈까지 거점 서른일곱, 세력 열일곱. 한 달이 한 턴으로 흐릅니다. ' +
      '농사를 짓고 저자를 열고 사람을 얻어, 흩어진 삼한을 하나로 묶으십시오.',
    cont: '이어하기', pickHead: '세력을 고르십시오',
    pickSub: '17개 세력 · 어느 쪽이든 첫 달부터 할 일이 있습니다',
    lord: '군주', castlesN: '거점',
    // 상단
    ym: (y, m) => `${y}년 ${m}월`, turn: (n) => `${n}턴`,
    tYm: '연월', tTurn: '턴', tFac: '세력', tCastle: '거점',
    tGold: '자금', tFood: '군량', tTroop: '병력',
    next: '다음 달 ▸', restart: '처음부터', sound: '소리',
    // 탭
    tabCastle: '거점', tabRoster: '무장', tabDiplo: '외교',
    // 거점
    농업: '농업', 상업: '상업', 치안: '치안', 훈련도: '훈련도', 사기: '사기', 성벽: '성벽',
    harvest: '추수', income: '월수입', draft: '징집가능',
    pop: '인구', gold: '자금', food: '군량', upkeep: '유지비',
    garrison: '주둔', corps: '부대', hosp: '부상병',
    보병: '보병', 기병: '기병', 궁병: '궁병',
    here: '주둔 무장', wild: '재야',
    hidden: (n) => `이 고을에 아직 찾지 못한 인재가 ${n}명 있습니다. 탐색해 보십시오.`,
    bio: '열전',
    // 명령
    oDev: '내정', oTrain: '훈련', oRecruit: '징집', oCorps: '부대', oMisc: '기타',
    oMove: '이동', oAttack: '출병', oEnvoy: '사자',
    doTrain: '훈련 실시', doAssign: '편성', doDisband: '해산',
    doSearch: '인재 탐색', doReward: '하사 (300금)', doMove: '이동',
    모병: '모병', 징병: '징병',
    sally: '출진', quick: '자동 판정', attack: '공격',
    capLead: (n) => `통솔 상한 ${n}`,
    pickOfficer: '무장을 고르면 이번 달 명령을 내릴 수 있습니다.',
    doneThisMonth: '이번 달 명령을 이미 받았습니다.',
    noOfficer: '명령을 내릴 수 있는 무장이 없습니다.',
    forceMine: '아군', forceTheirs: '적',
    forceNote: '수비는 성벽 보정을 받습니다',
    v_plenty: '넉넉합니다', v_even: '비등합니다',
    v_short: '모자랍니다', v_none: '턱없이 모자랍니다',
    relAlly: '동맹의 거점입니다. 치려면 먼저 동맹을 파기해야 합니다.',
    relTruce: (n) => `화친 중입니다 (${n}개월 남음).`,
    relWar: '교전 중입니다. 인접한 아군 거점에서 출병할 수 있습니다.',
    relPeace: '평시입니다. 출병하면 자동으로 선전포고가 됩니다.',
    // 외교
    war: '교전', peace: '평시', ally: '동맹', truce: '화친',
    dNeighbor: '국경을 맞댄 세력', dFar: '멀리 있는 세력',
    dEyes: (n) => `나를 보는 눈 ${n}`,
    dPeace: '강화 (500금)', dWar: '선전포고', dAlly: '동맹',
    dBreak: '동맹 파기', dGift: '예물 (300금)',
    dCash: (c, g) => `수도 ${c}의 자금 ${g} — 외교에 드는 값은 여기서 나갑니다.`,
    // 전투
    btl: '전투', btlTurn: (t, m, p) => `${t} / ${m}턴 · ${p === 'A' ? '아군 차례' : '적 차례'}`,
    btlEnd: '차례 종료 ▸', bMove: '이동', bAttack: '공격', bDuel: '일기토', bWait: '대기',
    화계: '화계', 혼란: '혼란', 매복: '매복', 응급: '응급처치',
    bPick: (n) => `부대를 고르십시오. 남은 부대 ${n}개.`,
    bEnemy: '적이 움직이고 있습니다…', bKi: (n) => `계략 ${n}회`,
    평지: '평지', 숲: '숲', 산: '산', 하천: '하천', 성벽: '성벽', 성문: '성문',
    // 결과
    over: '천하가 정해졌습니다',
    winMe: (f) => `${f}가 삼한을 통일했습니다.`,
    winOther: (w, me) => `${w}가 삼한을 통일했습니다. ${me}는 뜻을 이루지 못했습니다.`,
    evOk: '알겠습니다',
    real: '실존', fic: '가상', ficNote: '— 이 인물과 열전은 창작입니다.',
    lv: 'Lv', exp: '경험치', capT: '통솔 상한', loy: '충성', men: '명',
    female: '女',
  },

  en: {
    lang: 'English',
    modeCampaign: 'Campaign', modeCampaignSub: 'Twenty-five years from AD 246. Unite the Three Han.',
    modeSkirmish: 'Battle of Girinyeong', modeSkirmishSub: 'A single battle. You are fighting within three minutes.',
    skirmishIntro: 'The eighth month of AD 246. When a Lelang officer moved to detach eight Jinhan states, ' +
      'the Han took offence. You lead the men of Mahan against the Wei fort at Girinyeong.',
    skirmishWin: 'Girinyeong burns. Gong Zun, Grand Administrator of Daifang, fell in this fight.',
    skirmishLose: 'The Han host is scattered. The two commanderies prevailed in the end.',
    again: 'Again', toCampaign: 'Start the campaign', backMenu: 'Back to menu',
    brand: 'Three Han',
    szL: 'L', szM: 'M', szS: 'S',
    abMu: 'M', abJi: 'W', abJg: 'R',
    eyebrow: 'AD 246 — the year Wei stormed Hwando and Mahan struck Girinyeong',
    title: 'War for the Three Han', lede:
      'Thirty-seven strongholds from Buyeo to Kyushu, seventeen powers. One month is one turn. ' +
      'Work the fields, open the markets, win people over — and bind the scattered Han into one.',
    cont: 'Continue', pickHead: 'Choose your power',
    pickSub: '17 powers — every one of them has work to do in the first month',
    lord: 'Lord', castlesN: 'holds',
    ym: (y, m) => `${MON_EN[m - 1]} ${y} AD`, turn: (n) => `Turn ${n}`,
    tYm: 'Date', tTurn: 'Turn', tFac: 'Power', tCastle: 'Holds',
    tGold: 'Gold', tFood: 'Grain', tTroop: 'Troops',
    next: 'Next month ▸', restart: 'Restart', sound: 'Sound',
    tabCastle: 'Hold', tabRoster: 'Officers', tabDiplo: 'Diplomacy',
    농업: 'Farming', 상업: 'Trade', 치안: 'Order', 훈련도: 'Training', 사기: 'Morale', 성벽: 'Walls',
    harvest: 'harvest', income: 'monthly', draft: 'levy cap',
    pop: 'People', gold: 'Gold', food: 'Grain', upkeep: 'Upkeep',
    garrison: 'Garrison', corps: 'In corps', hosp: 'Wounded',
    보병: 'Foot', 기병: 'Horse', 궁병: 'Bow',
    here: 'Officers here', wild: 'Unattached',
    hidden: (n) => `${n} talented people remain unfound in this district. Send someone to search.`,
    bio: 'Life',
    oDev: 'Develop', oTrain: 'Drill', oRecruit: 'Levy', oCorps: 'Corps', oMisc: 'Other',
    oMove: 'Move', oAttack: 'March', oEnvoy: 'Envoy',
    doTrain: 'Drill troops', doAssign: 'Assign', doDisband: 'Disband',
    doSearch: 'Search for talent', doReward: 'Reward (300g)', doMove: 'Move',
    모병: 'Hire', 징병: 'Conscript',
    sally: 'March out', quick: 'Auto-resolve', attack: 'Attack',
    capLead: (n) => `command limit ${n}`,
    pickOfficer: 'Choose an officer to give this month’s order.',
    doneThisMonth: 'Already given an order this month.',
    noOfficer: 'No officer is free to act.',
    forceMine: 'Ours', forceTheirs: 'Theirs',
    forceNote: 'The defender fights behind walls',
    v_plenty: 'ample', v_even: 'even', v_short: 'short', v_none: 'hopelessly short',
    relAlly: 'This hold belongs to an ally. Break the alliance first.',
    relTruce: (n) => `A truce holds (${n} months left).`,
    relWar: 'At war. March from an adjacent hold of yours.',
    relPeace: 'At peace. Marching here declares war.',
    war: 'At war', peace: 'At peace', ally: 'Allied', truce: 'Truce',
    dNeighbor: 'Bordering powers', dFar: 'Distant powers',
    dEyes: (n) => `regards you ${n}`,
    dPeace: 'Sue for peace (500g)', dWar: 'Declare war', dAlly: 'Propose alliance',
    dBreak: 'Break alliance', dGift: 'Send gifts (300g)',
    dCash: (c, g) => `${g} gold in your capital ${c} — diplomacy is paid from there.`,
    btl: 'Battle', btlTurn: (t, m, p) => `Turn ${t} / ${m} · ${p === 'A' ? 'your phase' : 'enemy phase'}`,
    btlEnd: 'End phase ▸', bMove: 'Move', bAttack: 'Attack', bDuel: 'Duel', bWait: 'Hold',
    화계: 'Fire attack', 혼란: 'Confuse', 매복: 'Ambush', 응급: 'Field aid',
    bPick: (n) => `Choose a corps. ${n} left to act.`,
    bEnemy: 'The enemy is moving…', bKi: (n) => `${n} stratagems left`,
    평지: 'Plain', 숲: 'Wood', 산: 'Hill', 하천: 'River', 성벽: 'Wall', 성문: 'Gate',
    over: 'The realm is settled',
    winMe: (f) => `${f} has united the Three Han.`,
    winOther: (w, me) => `${w} has united the Three Han. ${me} fell short.`,
    evOk: 'Understood',
    real: 'historical', fic: 'invented', ficNote: '— This person and this account are invented.',
    lv: 'Lv', exp: 'exp', capT: 'command limit', loy: 'loyalty', men: '',
    female: 'F',
  },
};

// 세력·거점 이름
const NAMES_EN = {
  fac: {
    고구려: 'Goguryeo', 위: 'Wei', 부여: 'Buyeo', 읍루: 'Yilou', 선비: 'Xianbei',
    옥저: 'Okjeo', 동예: 'Ye', 마한: 'Mahan', 백제: 'Baekje', 진한: 'Jinhan',
    신라: 'Saro', 변한: 'Byeonhan', 가야: 'Guya', 야마토: 'Yamatai',
    도래인: 'Ito', 이즈모: 'Izumo', 구노국: 'Kuna',
  },
  castle: {
    1: 'Gungnae', 2: 'Jolbon', 3: 'Seoanpyeong', 4: 'Uiju', 5: 'Chaekseong',
    6: 'Beiping', 7: 'Xiangping', 8: 'Lelang', 9: 'Ansi', 10: 'Daifang',
    11: 'Liucheng', 12: 'Baegam', 13: 'Bisa', 14: 'Buyeo Fort', 15: 'Yilou',
    16: 'Xianbei Camp', 17: 'Hamju', 18: 'Haseulla', 19: 'Wiryeseong',
    20: 'Jungwon', 21: 'Bugwon', 22: 'Mokji', 23: 'Ungjin', 24: 'Sabi',
    25: 'Mujin', 26: 'Balla', 27: 'Michuhol', 28: 'Gaeseong', 29: 'Geumseong',
    30: 'Sabeol', 31: 'Guya', 32: 'Dongnae', 33: 'Yamato', 34: 'Ito',
    35: 'Izumo', 36: 'Kuna', 37: 'Awa',
  },
  size: { 대: 'Great', 중: 'Middling', 소: 'Minor' },
  lord: {"동천왕": "King Dongcheon", "관구검": "Guanqiu Jian", "마여": "Mayeo", "루한": "Ruhan", "설귀니": "Xie Guini", "옥저후": "Lord of Okjeo", "불내후": "Lord Bulnae", "진왕": "The Jin King", "고이왕": "King Goi", "사벌군주": "Lord of Sabeol", "조분이사금": "King Jobun", "독로거수": "Chief of Dongnae", "구야국주": "Lord of Guya", "히미코": "Himiko", "이지마": "Ijima", "이즈모누시": "Izumo-nushi", "히미쿠코": "Himikuko"},
};

let LANG = 'ko';
function setLang(l) {
  LANG = I18N[l] ? l : 'ko';
  try { localStorage.setItem('samhan_lang', LANG); } catch (e) { /* 시크릿 */ }
  document.documentElement.lang = LANG;
}
function initLang() {
  // ★menewsoft.com 은 ?lang=ko 처럼 사이트 언어를 넘겨 준다 — 그게 가장 앞선다.
  let l = null;
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q) l = q.toLowerCase().startsWith('ko') ? 'ko' : 'en';
  } catch (e) { /* 구형 브라우저 */ }
  if (!l) { try { l = localStorage.getItem('samhan_lang'); } catch (e) { /* 시크릿 */ } }
  if (!l) l = (navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : 'en';
  setLang(l);
}
// t('key') 또는 t('key', ...인자) — 함수형 문구도 같은 자리에서 부른다
function t(k, ...a) {
  const v = I18N[LANG][k];
  if (v == null) return I18N.ko[k] != null ? (typeof I18N.ko[k] === 'function' ? I18N.ko[k](...a) : I18N.ko[k]) : k;
  return typeof v === 'function' ? v(...a) : v;
}
function facName(id) {
  const F = FACTIONS[id];
  if (!F) return id;
  return LANG === 'en' ? (NAMES_EN.fac[id] || F.nm) : F.nm;
}
function castleName(n) {
  const c = (typeof CASTLE_LOOKUP !== 'undefined' ? CASTLE_LOOKUP[n] : null) ||
            CASTLES.find(x => x.n === n);
  if (!c) return String(n);
  return LANG === 'en' ? (NAMES_EN.castle[n] || c.nm) : c.nm;
}
function lordName(id) {
  const F = FACTIONS[id];
  if (!F) return '';
  return LANG === 'en' ? (NAMES_EN.lord[F.lord] || F.lord) : F.lord;
}
function sizeName(sz) { return LANG === 'en' ? (NAMES_EN.size[sz] || sz) : sz; }
// 배지에 들어가는 한 글자
function sizeMark(sz) { return t(sz === '대' ? 'szL' : sz === '중' ? 'szM' : 'szS'); }
function unitName(u) { return t(u); }
