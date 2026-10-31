/* 초등 1학년 영어 낱말 은행 — 학습 페이지(/learn/english-words)와 게임이 함께 쓴다.
 *
 * ★설계 근거(2026-09-23, 실제 아이 관찰):
 *   - elephant · teacher · student · baby shark 는 이미 안다. 전부 **노래·수업에서 자주 들은** 말이다.
 *   - 반면 tiger · lion 은 헷갈린다. 둘 다 짧은데도 그렇다.
 *   → 즉 낱말 길이가 아니라 **들은 횟수**가 아는 것과 모르는 것을 갈랐다.
 *     그래서 이 은행은 철자 난이도가 아니라 `known`(이미 아는 말)과 `pair`(헷갈리는 짝)로 배열한다.
 *
 * ⚠️그림은 이모지다. 초1에게 이미 익숙하고, 어떤 크기에서도 또렷하고, 받을 파일이 없다.
 * ⚠️발음은 미리 만들어 둔 mp3 를 쓴다(audio/<id>.mp3, <id>_slow.mp3).
 *   브라우저 내장 음성(speechSynthesis)은 기기마다 영어 목소리가 없거나 늦게 뜨는데,
 *   아이가 쓰는 화면에서 그건 그대로 '눌렀는데 아무 소리도 안 남'이 된다. 그건 못 쓴다.
 *   내장 음성은 mp3 가 실패했을 때의 **보조**로만 둔다.
 */
export const THEMES = [
  { id: 'animal', ko: '동물',   emoji: '🦁', color: '#f59e0b' },
  { id: 'school', ko: '학교',   emoji: '🎒', color: '#3b82f6' },
  { id: 'family', ko: '가족',   emoji: '👨‍👩‍👧', color: '#ec4899' },
  { id: 'food',   ko: '먹을 것', emoji: '🍎', color: '#ef4444' },
  { id: 'color',  ko: '색깔',   emoji: '🎨', color: '#8b5cf6' },
  { id: 'number', ko: '숫자',   emoji: '🔢', color: '#14b8a6' },
  { id: 'body',   ko: '몸',     emoji: '✋', color: '#f97316' },
];

/* known: 아이가 이미 아는 말 → 맨 앞에 배치해 '나 이거 알아'로 시작하게 한다.
 * pair : 소리나 생김새가 닮아 헷갈리는 짝. 게임에서 **일부러 같이** 낸다.
 *        따로 배우면 각각은 알아도 둘을 나란히 두면 못 고른다 — 그래서 붙여서 낸다. */
export const WORDS = [
  /* ── 동물 ── */
  { id:'elephant', en:'elephant', ko:'코끼리', emoji:'🐘', theme:'animal', known:true },
  { id:'shark',    en:'shark',    ko:'상어',   emoji:'🦈', theme:'animal', known:true },
  { id:'tiger',    en:'tiger',    ko:'호랑이', emoji:'🐯', theme:'animal', pair:'lion' },
  { id:'lion',     en:'lion',     ko:'사자',   emoji:'🦁', theme:'animal', pair:'tiger' },
  { id:'dog',      en:'dog',      ko:'강아지', emoji:'🐶', theme:'animal' },
  { id:'cat',      en:'cat',      ko:'고양이', emoji:'🐱', theme:'animal', pair:'hat' },
  { id:'rabbit',   en:'rabbit',   ko:'토끼',   emoji:'🐰', theme:'animal' },
  { id:'bear',     en:'bear',     ko:'곰',     emoji:'🐻', theme:'animal', pair:'pear' },
  { id:'monkey',   en:'monkey',   ko:'원숭이', emoji:'🐵', theme:'animal' },
  { id:'pig',      en:'pig',      ko:'돼지',   emoji:'🐷', theme:'animal' },
  { id:'cow',      en:'cow',      ko:'소',     emoji:'🐮', theme:'animal' },
  { id:'duck',     en:'duck',     ko:'오리',   emoji:'🦆', theme:'animal' },
  { id:'fish',     en:'fish',     ko:'물고기', emoji:'🐟', theme:'animal' },
  { id:'bird',     en:'bird',     ko:'새',     emoji:'🐦', theme:'animal' },
  { id:'frog',     en:'frog',     ko:'개구리', emoji:'🐸', theme:'animal' },
  { id:'horse',    en:'horse',    ko:'말',     emoji:'🐴', theme:'animal' },
  { id:'sheep',    en:'sheep',    ko:'양',     emoji:'🐑', theme:'animal', pair:'ship' },
  { id:'mouse',    en:'mouse',    ko:'쥐',     emoji:'🐭', theme:'animal', pair:'mouth' },
  { id:'giraffe',  en:'giraffe',  ko:'기린',   emoji:'🦒', theme:'animal' },
  { id:'zebra',    en:'zebra',    ko:'얼룩말', emoji:'🦓', theme:'animal' },
  { id:'panda',    en:'panda',    ko:'판다',   emoji:'🐼', theme:'animal' },
  { id:'penguin',  en:'penguin',  ko:'펭귄',   emoji:'🐧', theme:'animal' },
  { id:'turtle',   en:'turtle',   ko:'거북이', emoji:'🐢', theme:'animal' },
  { id:'bee',      en:'bee',      ko:'벌',     emoji:'🐝', theme:'animal' },

  /* ── 학교 ── */
  { id:'teacher', en:'teacher', ko:'선생님', emoji:'🧑‍🏫', theme:'school', known:true },
  { id:'student', en:'student', ko:'학생',   emoji:'🧑‍🎓', theme:'school', known:true },
  { id:'book',    en:'book',    ko:'책',     emoji:'📕', theme:'school' },
  { id:'pencil',  en:'pencil',  ko:'연필',   emoji:'✏️', theme:'school' },
  { id:'bag',     en:'bag',     ko:'가방',   emoji:'🎒', theme:'school' },
  { id:'desk',    en:'desk',    ko:'책상',   emoji:'🪑', theme:'school' },
  { id:'school',  en:'school',  ko:'학교',   emoji:'🏫', theme:'school' },
  { id:'friend',  en:'friend',  ko:'친구',   emoji:'🧒', theme:'school' },
  { id:'crayon',  en:'crayon',  ko:'크레용', emoji:'🖍️', theme:'school' },
  { id:'scissors',en:'scissors',ko:'가위',   emoji:'✂️', theme:'school' },
  { id:'ship',    en:'ship',    ko:'배',     emoji:'🚢', theme:'school', pair:'sheep' },
  { id:'hat',     en:'hat',     ko:'모자',   emoji:'🧢', theme:'school', pair:'cat' },

  /* ── 가족 ── */
  { id:'mom',     en:'mom',     ko:'엄마',   emoji:'👩', theme:'family' },
  { id:'dad',     en:'dad',     ko:'아빠',   emoji:'👨', theme:'family' },
  { id:'baby',    en:'baby',    ko:'아기',   emoji:'👶', theme:'family', known:true },
  { id:'sister',  en:'sister',  ko:'언니·누나', emoji:'👧', theme:'family' },
  { id:'brother', en:'brother', ko:'오빠·형', emoji:'👦', theme:'family' },
  { id:'grandma', en:'grandma', ko:'할머니', emoji:'👵', theme:'family' },
  { id:'grandpa', en:'grandpa', ko:'할아버지', emoji:'👴', theme:'family' },
  { id:'family',  en:'family',  ko:'가족',   emoji:'👨‍👩‍👧', theme:'family' },

  /* ── 먹을 것 ── */
  { id:'apple',   en:'apple',   ko:'사과',   emoji:'🍎', theme:'food' },
  { id:'banana',  en:'banana',  ko:'바나나', emoji:'🍌', theme:'food' },
  { id:'milk',    en:'milk',    ko:'우유',   emoji:'🥛', theme:'food' },
  { id:'bread',   en:'bread',   ko:'빵',     emoji:'🍞', theme:'food' },
  { id:'water',   en:'water',   ko:'물',     emoji:'💧', theme:'food' },
  { id:'egg',     en:'egg',     ko:'달걀',   emoji:'🥚', theme:'food' },
  { id:'rice',    en:'rice',    ko:'밥',     emoji:'🍚', theme:'food' },
  { id:'cake',    en:'cake',    ko:'케이크', emoji:'🍰', theme:'food' },
  { id:'candy',   en:'candy',   ko:'사탕',   emoji:'🍬', theme:'food' },
  { id:'pear',    en:'pear',    ko:'배',     emoji:'🍐', theme:'food', pair:'bear' },
  { id:'grape',   en:'grape',   ko:'포도',   emoji:'🍇', theme:'food' },
  { id:'carrot',  en:'carrot',  ko:'당근',   emoji:'🥕', theme:'food' },

  /* ── 색깔 ── */
  { id:'red',    en:'red',    ko:'빨강', emoji:'🔴', theme:'color' },
  { id:'blue',   en:'blue',   ko:'파랑', emoji:'🔵', theme:'color' },
  { id:'yellow', en:'yellow', ko:'노랑', emoji:'🟡', theme:'color' },
  { id:'green',  en:'green',  ko:'초록', emoji:'🟢', theme:'color' },
  { id:'black',  en:'black',  ko:'검정', emoji:'⚫', theme:'color' },
  { id:'white',  en:'white',  ko:'하양', emoji:'⚪', theme:'color' },
  { id:'purple', en:'purple', ko:'보라', emoji:'🟣', theme:'color' },
  { id:'orange', en:'orange', ko:'주황', emoji:'🟠', theme:'color' },
  { id:'brown',  en:'brown',  ko:'갈색', emoji:'🟤', theme:'color' },
  { id:'pink',   en:'pink',   ko:'분홍', emoji:'🌸', theme:'color' },

  /* ── 숫자 ── */
  { id:'one',   en:'one',   ko:'하나', emoji:'1️⃣',  theme:'number' },
  { id:'two',   en:'two',   ko:'둘',   emoji:'2️⃣',  theme:'number' },
  { id:'three', en:'three', ko:'셋',   emoji:'3️⃣',  theme:'number', pair:'tree' },
  { id:'four',  en:'four',  ko:'넷',   emoji:'4️⃣',  theme:'number' },
  { id:'five',  en:'five',  ko:'다섯', emoji:'5️⃣',  theme:'number' },
  { id:'six',   en:'six',   ko:'여섯', emoji:'6️⃣',  theme:'number' },
  { id:'seven', en:'seven', ko:'일곱', emoji:'7️⃣',  theme:'number' },
  { id:'eight', en:'eight', ko:'여덟', emoji:'8️⃣',  theme:'number' },
  { id:'nine',  en:'nine',  ko:'아홉', emoji:'9️⃣',  theme:'number' },
  { id:'ten',   en:'ten',   ko:'열',   emoji:'🔟',  theme:'number' },
  { id:'tree',  en:'tree',  ko:'나무', emoji:'🌳',  theme:'number', pair:'three' },

  /* ── 몸 ── */
  { id:'head',  en:'head',  ko:'머리', emoji:'🧠', theme:'body' },
  { id:'hand',  en:'hand',  ko:'손',   emoji:'✋', theme:'body' },
  { id:'foot',  en:'foot',  ko:'발',   emoji:'🦶', theme:'body' },
  { id:'eye',   en:'eye',   ko:'눈',   emoji:'👁️', theme:'body' },
  { id:'nose',  en:'nose',  ko:'코',   emoji:'👃', theme:'body' },
  { id:'mouth', en:'mouth', ko:'입',   emoji:'👄', theme:'body', pair:'mouse' },
  { id:'ear',   en:'ear',   ko:'귀',   emoji:'👂', theme:'body' },
  { id:'hair',  en:'hair',  ko:'머리카락', emoji:'💇', theme:'body' },
];

export const byId = Object.fromEntries(WORDS.map(w => [w.id, w]));
export const byTheme = (t) => WORDS.filter(w => w.theme === t);
/** 헷갈리는 짝 목록(중복 없이) — 학습 페이지의 '헷갈리는 짝' 칸과 게임의 함정 보기에 쓴다. */
export const PAIRS = (() => {
  const seen = new Set(), out = [];
  for (const w of WORDS) {
    if (!w.pair || seen.has(w.id)) continue;
    const o = byId[w.pair];
    if (!o) continue;
    seen.add(w.id); seen.add(o.id);
    out.push([w, o]);
  }
  return out;
})();
