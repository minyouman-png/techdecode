// 초등 1학년 학습 코너 레지스트리 (`/learn/`).
//
// ⚠️이 섹션은 **한국어 전용**이다. 대한민국 초등학교 1학년 교육과정에 맞춘 내용이라
//   기계 번역해 5개 언어로 뿌리면 아무도 안 읽는 페이지만 늘어난다(사이트 정체성도 흐려진다).
//   그래서 헤더 링크도 `lang === 'ko'` 일 때만 나온다.
//
// ⚠️★유튜브 영상은 **전부 oEmbed(youtube.com/oembed)로 실재를 확인한 것만** 넣는다.
//   죽은 링크는 아이가 클릭했을 때 그대로 실패 경험이 된다. 확인 도구는
//   `tools/learn-video-check.py` — 영상을 추가하거나 가끔 점검할 때 그걸 돌린다.
//   임베드(iframe)가 아니라 **유튜브로 나가는 링크**다: 채널이 임베드를 막아둔 경우에도
//   깨지지 않고, 광고·추천 영상 처리를 유튜브 쪽에 맡길 수 있다.

export type LearnVideo = {
  /** 유튜브 videoId */
  id: string;
  /** 카드에 보여줄 제목(원제를 아이가 읽기 쉽게 줄인 것) */
  title: string;
  /** 채널명 — 출처를 항상 밝힌다 */
  channel: string;
  /** 대략적인 길이 */
  len?: string;
};

/** 연습 위젯 종류. LearnPractice.astro 의 생성기 이름과 1:1 로 대응한다. */
export type PracticeKind =
  | 'jamo'      // 자음·모음 이름
  | 'syllable'  // 자음 + 모음 = 글자
  | 'batchim'   // 받침 찾기
  | 'mimetic'   // 흉내 내는 말
  | 'punct'     // 문장 부호
  | 'diary'     // 그림일기 도우미(퀴즈가 아님)
  | 'count9'    // 9까지의 수 세기
  | 'order9'    // 수의 순서 · 1 큰 수/작은 수
  | 'shape3d'   // 상자·둥근기둥·공 모양
  | 'shape2d'   // 네모·세모·동그라미
  | 'addsub'    // 9까지의 덧셈과 뺄셈
  | 'compare'   // 길이·무게·양 비교
  | 'num50'     // 50까지의 수(십몇, 몇십몇)
  | 'num100'    // 100까지의 수 비교
  | 'make10'    // 10 만들기 · 받아올림/받아내림
  | 'clock'     // 시계 보기(캔버스)
  | 'pattern'   // 규칙 찾기
  | 'alphabet'  // 알파벳 대문자/소문자
  | 'phonics'   // 첫소리 파닉스
  | 'wordmake'  // 낱말 만들기
  | 'sentence'  // 문장 순서 맞추기
  | 'dictation' // 받아쓰기(소리 나는 대로 vs 바르게)
  | 'story'     // 이야기로 푸는 덧셈·뺄셈
  | 'skip'      // 뛰어 세기(2·5·10)
  | 'time2'     // 몇 시 몇 분(5분 단위)
  | 'color'     // 색깔 영어
  | 'numen'     // 숫자 영어 1~20
  | 'quiz';     // 데이터로 주는 객관식(통합교과·안전)

export type QuizItem = { q: string; choices: string[]; answer: number; hint?: string };

export type LearnTopic = {
  /** 앵커 id (URL 해시로 쓰인다) */
  id: string;
  /** 교과서 단원명 또는 학습 주제 */
  title: string;
  /** 학부모용 한 줄 목표 — "이걸 할 수 있으면 통과" */
  goal: string;
  /** 집에서 확인할 포인트 */
  points: string[];
  videos: LearnVideo[];
  practice?: PracticeKind;
  /** practice 가 'quiz' 일 때 쓰는 문제 */
  quiz?: QuizItem[];
};

export type LearnUnit = {
  /** 1학기 / 2학기 / 연중 */
  term: string;
  /** 단원 묶음 이름 */
  name: string;
  topics: LearnTopic[];
};

export type LearnSubject = {
  slug: string;
  emoji: string;
  /** 과목명 */
  title: string;
  /** 카드 한 줄 소개 */
  tagline: string;
  /** 교육과정상의 이름 */
  subjectLabel: string;
  /** 페이지 도입부 */
  intro: string[];
  /** 카드 색 계열 */
  hue: number;
  units: LearnUnit[];
};

export const learnUi = {
  kicker: '초등 1학년 학습',
  pageTitle: '초등 1학년 학습 놀이터',
  metaDescription:
    '대한민국 초등학교 1학년 교육과정에 맞춘 무료 학습 페이지. 국어(한글·받침·그림일기), 수학(9까지의 수·덧셈뺄셈·시계 보기), 통합교과, 안전 생활을 골라 보는 유튜브 학습 영상과 바로 풀어 보는 연습 문제로 정리했습니다.',
  hero1:
    '학교에서 배우는 순서 그대로 정리했습니다. 단원을 고르고, 영상을 보고, 바로 아래에서 문제를 풀어 보세요.',
  hero2: '맞힐 때마다 ⭐ 별이 쌓입니다. 계정도 로그인도 필요 없고, 전부 무료입니다.',
  namePrompt: '이름을 알려 주면 반갑게 인사할게요',
  namePlaceholder: '이름 (예: 유진)',
  nameSave: '저장',
  greeting: (n: string) => `${n}야, 안녕! 오늘도 같이 공부해 볼까?`,
  greetingNone: '안녕! 오늘은 뭘 배워 볼까?',
  starsLabel: '모은 별',
  todayLabel: '오늘의 추천',
  todayNew: '다른 걸로 바꾸기',
  subjectsLabel: '과목 고르기',
  parentsLabel: '학부모님께',
  watch: '유튜브에서 보기 ▶',
  videosLabel: '학습 영상',
  practiceLabel: '연습해 볼까요?',
  goalLabel: '이만큼 할 수 있으면 돼요',
  pointsLabel: '집에서 확인해요',
  backToLearn: '← 학습 놀이터',
  termLabel: '학기',
  topicCount: (n: number) => `${n}가지 주제`,
  videoCount: (n: number) => `영상 ${n}개`,
  newTab: '유튜브 새 창에서 열립니다',
};

/* ===================== 국어 ===================== */
const korean: LearnSubject = {
  slug: 'korean',
  emoji: '📖',
  title: '국어',
  tagline: '자음·모음부터 받침, 흉내 내는 말, 그림일기까지 — 한글을 통째로.',
  subjectLabel: '국어 1-1 · 1-2',
  hue: 28,
  intro: [
    '1학년 국어는 “한글을 읽고 쓸 수 있게 되는 해”입니다. 2022 개정 교육과정에서 1~2학년 국어 시간이 늘고 한글 익히기가 특히 강화됐습니다.',
    '자음자와 모음자 → 글자의 짜임 → 받침 → 낱말 → 문장 → 띄어 읽기 → 그림일기 순서로 올라갑니다. 아래 순서대로 따라오면 됩니다.',
  ],
  units: [
    {
      term: '1학기',
      name: '한글을 익혀요',
      topics: [
        {
          id: 'jamo',
          title: '자음자와 모음자',
          goal: '자음 14자와 모음 10자의 이름을 말하고, 순서에 맞게 쓸 수 있어요.',
          points: [
            '“ㄱ”을 보고 “기역”이라고 이름을 말할 수 있는지 물어보세요.',
            '쓰는 순서(획순)가 중요합니다. 위에서 아래로, 왼쪽에서 오른쪽으로.',
            '“ㅏ”와 “ㅓ”, “ㅗ”와 “ㅜ”처럼 방향만 다른 짝을 헷갈려 하면 손가락으로 방향을 짚어 주세요.',
          ],
          videos: [
            { id: 'F0GTE-bxNiM', title: '자음송 — 노래로 ㄱ부터 ㅎ까지', channel: '로티프렌즈', len: '2분' },
            { id: 'FeDRjHBqqnU', title: '모음송 — 아 야 어 여 오 요 우 유 으 이', channel: '로티프렌즈', len: '2분' },
            { id: '8r0FpakQmcs', title: '뽀로로 한글송 ㄱ에서 ㅎ까지', channel: '뽀로로(Pororo)', len: '15분' },
            { id: 'w7PDCokKFcY', title: '자음자 알아보기 (교과서 진도용)', channel: '밀크티타임', len: '3분' },
          ],
          practice: 'jamo',
        },
        {
          id: 'syllable',
          title: '글자를 만들어요',
          goal: '자음자와 모음자를 합쳐 글자를 만들고 읽을 수 있어요. (ㄱ + ㅏ = 가)',
          points: [
            '모음이 오른쪽에 붙는 글자(가, 너)와 아래에 붙는 글자(고, 무)를 구분해 보세요.',
            '“가나다라마바사” 를 손으로 짚어 가며 읽으면 글자의 규칙이 눈에 들어옵니다.',
            '아이 이름, 가족 이름부터 만들어 보는 게 제일 빠릅니다.',
          ],
          videos: [
            { id: '77Ydwvdy5zo', title: '곰지와 함께 1학년 한글떼기 — 모음자 ㅏ, ㅓ', channel: '어디든학교', len: '15분' },
            { id: 'E9ZzGUZdPAQ', title: '가나다라송 — 입 모양 따라 하기', channel: '슈퍼홈스쿨', len: '5분' },
          ],
          practice: 'syllable',
        },
        {
          id: 'batchim',
          title: '받침이 있는 글자를 읽어요',
          goal: '받침이 있는 글자를 소리 내어 읽고, 낱말을 보고 받침을 찾을 수 있어요.',
          points: [
            '받침은 글자의 “발”입니다. 강 → ㄱ+ㅏ+ㅇ 처럼 세 조각으로 나눠 보세요.',
            '“밥, 강, 산, 물, 곰” 처럼 받침이 하나씩 다른 낱말로 연습하면 좋습니다.',
            '소리와 글자가 다른 받침(꽃 → [꼳])은 1학년에서는 읽기만 되면 충분합니다.',
          ],
          videos: [
            { id: 'J1qJ2mdZVCs', title: '받침 글자 모아보기 — 입학 준비용', channel: '슈퍼홈스쿨', len: '3분' },
            { id: '8TXGYTjaSSQ', title: '4분 안에 받침 떼기 (받침송)', channel: '슈퍼홈스쿨', len: '4분' },
            { id: 'HicyD4jyFmY', title: '받침 있는 글자의 짜임 알기', channel: '밀크티타임', len: '1분' },
          ],
          practice: 'batchim',
        },
      ],
    },
    {
      term: '2학기',
      name: '문장으로 말하고 써요',
      topics: [
        {
          id: 'mimetic',
          title: '소리와 모양을 흉내 내요',
          goal: '흉내 내는 말을 알고, 그 말을 넣어 문장을 만들 수 있어요.',
          points: [
            '소리를 흉내 낸 말(개굴개굴)과 모양을 흉내 낸 말(뒤뚱뒤뚱)을 구분해 보세요.',
            '“어떻게?” 라고 물어보면 흉내 내는 말이 나옵니다. — 비가 어떻게 와? 주룩주룩!',
            '집에서 나는 소리를 같이 흉내 내 보면 놀이가 됩니다.',
          ],
          videos: [
            { id: '20LbcA-Dkiw', title: '소리와 모양을 흉내 내요 (단원 정리)', channel: '동아출판', len: '11분' },
            { id: 'GU3byi-mOgg', title: '흉내 내는 말 퀴즈 (소리 포함)', channel: '한글하는당근쌤', len: '4분' },
          ],
          practice: 'mimetic',
        },
        {
          id: 'punct',
          title: '문장 부호와 띄어 읽기',
          goal: '마침표·물음표·느낌표·쉼표를 알고, 부호에 맞게 띄어 읽을 수 있어요.',
          points: [
            '마침표(.)에서는 한 박자 쉬고, 쉼표(,)에서는 반 박자만 쉽니다.',
            '물음표가 있으면 끝을 올려서, 느낌표가 있으면 힘주어 읽어 보세요.',
            '소리 내어 읽기(음독)는 1학년 내내 계속하는 게 좋습니다.',
          ],
          videos: [
            { id: 'j-2WnaNDvHs', title: '1학년 문장 부호 알기', channel: '잇몸교육연구소', len: '2분' },
            { id: '9x3v1IUJx0w', title: '글을 바르게 띄어 읽는 방법', channel: '밀크티타임', len: '2분' },
          ],
          practice: 'punct',
        },
        {
          id: 'diary',
          title: '겪은 일을 글로 써요 (그림일기)',
          goal: '오늘 있었던 일 중 하나를 골라 그림과 두세 문장으로 쓸 수 있어요.',
          points: [
            '하루 전체를 쓰려 하면 어렵습니다. **가장 기억에 남는 한 장면**만 고르게 하세요.',
            '“언제 / 어디서 / 누구와 / 무엇을 / 어땠는지” 다섯 가지면 충분합니다.',
            '맞춤법 지적은 나중에. 처음에는 쓰는 즐거움이 먼저입니다.',
          ],
          videos: [
            { id: 'cO5AqTw2gIk', title: '그림일기 쓰는 방법 (1학년 선생님과 함께)', channel: 'teacher Yoon 혜인쌤', len: '11분' },
            { id: 'BmJxaj1jFxs', title: '일기를 잘 쓰는 5가지 방법', channel: '어디든학교', len: '9분' },
          ],
          practice: 'diary',
        },
      ],
    },
    {
      term: '연중',
      name: '한 걸음 더',
      topics: [
        {
          id: 'wordmake',
          title: '낱말을 만들어요',
          goal: '글자 두 개를 이어 뜻이 있는 낱말을 만들고, 낱말을 소리 내어 읽을 수 있어요.',
          points: [
            '“나무”, “바다”처럼 아는 낱말을 손가락으로 짚어 가며 읽게 해 보세요.',
            '틀린 낱말(“무나”)을 일부러 보여 주고 어디가 이상한지 물어보면 글자 순서 감각이 생깁니다.',
          ],
          videos: [
            { id: 'ZwXSZDnR5qI', title: '한글 단어 배우기 — 가~하로 시작하는 낱말', channel: 'For Kids [포키즈]', len: '9분' },
            { id: 'lPrDnVp1HwQ', title: '동물의 이름을 맞춰 보세요 — 낱말 카드', channel: '한글씽씽', len: '5분' },
            { id: 'Uk5FlhkFMO4', title: '글자의 짜임 알기 (교과서 진도용)', channel: '밀크티타임', len: '1분' },
          ],
          practice: 'wordmake',
        },
        {
          id: 'sentence',
          title: '문장을 만들어요',
          goal: '흩어진 낱말을 “누가 + 무엇을 + 어떻게” 순서로 놓아 문장을 만들 수 있어요.',
          points: [
            '말할 때는 잘하는데 쓸 때 순서가 엉키는 시기입니다. 소리 내어 읽어 보게 하면 스스로 고칩니다.',
            '“누가?”, “무엇을?”, “어디서?”를 차례로 물어 주면 문장이 저절로 길어집니다.',
          ],
          videos: [
            { id: 'j15SzHtcY5w', title: '1학년 1학기 7단원 — 문장을 만들어요', channel: '경기초등온배움교실', len: '5분' },
            { id: 'J2uzYlL4oaQ', title: '그림을 보고 문장 만들기', channel: '밀크티타임', len: '1분' },
            { id: 'w4PUoW_qIis', title: '주어진 낱말로 문장 만들기', channel: 'Aurora', len: '4분' },
          ],
          practice: 'sentence',
        },
        {
          id: 'dictation',
          title: '받아쓰기 — 소리와 다르게 쓰는 말',
          goal: '소리 나는 대로 쓰면 틀리는 낱말(“가치” → “같이”)을 골라낼 수 있어요.',
          points: [
            '1학년 받아쓰기에서 가장 많이 틀리는 자리가 **받침**과 **연음**입니다.',
            '틀린 글자를 지적하기보다 맞는 글자를 옆에 크게 써 주는 편이 오래 남습니다.',
          ],
          videos: [
            { id: 'WBDcZ2DlHZ0', title: '1학년 받아쓰기 급수장 1회 따라쓰기', channel: 'teacher Yoon 혜인쌤', len: '7분' },
            { id: 'TlShVubMrxg', title: '1학년 받아쓰기 급수장 4회 — 마침표 찍는 법까지', channel: 'teacher Yoon 혜인쌤', len: '6분' },
            { id: 'sIySXkV1DYY', title: '하루하루 맞춤법 + 받아쓰기 급수 1', channel: '랭귀지북스', len: '4분' },
          ],
          practice: 'dictation',
        },
      ],
    },
  ],
};

/* ===================== 수학 ===================== */
const math: LearnSubject = {
  slug: 'math',
  emoji: '🔢',
  title: '수학',
  tagline: '9까지의 수부터 100까지, 덧셈·뺄셈과 시계 보기까지 한 해 전부.',
  subjectLabel: '수학 1-1 · 1-2',
  hue: 205,
  intro: [
    '1학년 수학은 1학기에 「9까지의 수 · 여러 가지 모양 · 덧셈과 뺄셈 · 비교하기 · 50까지의 수」, 2학기에 「100까지의 수 · 덧셈과 뺄셈(1) · 여러 가지 모양 · 덧셈과 뺄셈(2) · 시계 보기와 규칙 찾기 · 덧셈과 뺄셈(3)」 순서로 갑니다.',
    '이 학년의 핵심은 계산 속도가 아니라 **수 감각**입니다. 모으기와 가르기, 10 만들기가 되면 2학년 받아올림이 저절로 풀립니다.',
  ],
  units: [
    {
      term: '1학기',
      name: '수와 모양을 알아요',
      topics: [
        {
          id: 'count9',
          title: '9까지의 수',
          goal: '1부터 9까지 세고 읽고 쓰며, 몇째인지 말하고, 1 큰 수와 1 작은 수를 알 수 있어요.',
          points: [
            '“하나, 둘, 셋”(수 세기)과 “일, 이, 삼”(수 읽기)을 둘 다 씁니다.',
            '“셋째”와 “세 개”는 다릅니다 — 순서와 개수를 구분하는 게 이 단원의 함정입니다.',
            '0도 수라는 것(아무것도 없음)을 이 단원에서 배웁니다.',
          ],
          videos: [
            { id: '_7k7Bx5WueE', title: '9까지의 수를 알아볼까요?', channel: '밀크티타임', len: '2분' },
            { id: 'qEDd7eq3Eo4', title: '수의 순서를 알아볼까요', channel: '밀크티타임', len: '2분' },
            { id: 'g_B8i8RwPlw', title: '1 큰 수와 1 작은 수', channel: '밀크티타임', len: '3분' },
            { id: 'B0uklux2rXo', title: '1단원 9까지의 수 (전체 정리)', channel: '써밋특강', len: '10분' },
          ],
          practice: 'count9',
        },
        {
          id: 'order9',
          title: '수의 순서 · 몇째일까요',
          goal: '수를 순서대로 늘어놓고, 앞에서 몇째인지 말할 수 있어요.',
          points: [
            '“앞에서 셋째”와 “뒤에서 셋째”를 둘 다 물어보세요.',
            '수직선(수를 일렬로 놓은 줄)에 손가락을 짚어 가며 세는 습관을 들이면 좋습니다.',
          ],
          videos: [
            { id: '3T7ECkZT728', title: '1학년 처음 수학 — 9까지의 수', channel: '어디든학교', len: '4분' },
          ],
          practice: 'order9',
        },
        {
          id: 'shape3d',
          title: '여러 가지 모양 (상자·둥근기둥·공)',
          goal: '주변 물건을 상자 모양, 둥근 기둥 모양, 공 모양으로 나눌 수 있어요.',
          points: [
            '집에 있는 물건으로 찾아보세요 — 휴지 상자(상자), 음료수 캔(둥근 기둥), 공(공).',
            '“잘 굴러가나?”, “쌓을 수 있나?” 두 가지 질문이면 분류가 됩니다.',
          ],
          videos: [
            { id: 'I1ZJbdgxQ8E', title: '여러 가지 모양을 알아볼까요 (입체)', channel: '밀크티타임', len: '2분' },
            { id: 'anliGvkbWt0', title: '여러 가지 모양을 찾아볼까요', channel: '밀크티타임', len: '2분' },
          ],
          practice: 'shape3d',
        },
        {
          id: 'addsub',
          title: '덧셈과 뺄셈 (모으기·가르기)',
          goal: '9까지의 수를 모으고 가르며, 한 자리 수의 덧셈과 뺄셈을 할 수 있어요.',
          points: [
            '★이 단원이 1학년 수학의 심장입니다. 모으기·가르기가 되면 뒤가 다 쉬워집니다.',
            '손가락을 써도 괜찮습니다. 다만 “5는 2와 3”처럼 **입으로 말하는 연습**을 같이 하세요.',
            '식(3 + 2 = 5)을 읽는 법 — “3 더하기 2는 5와 같습니다”.',
          ],
          videos: [
            { id: 'UrfFOE4L-l4', title: '모으기와 가르기', channel: '키출판사', len: '1분' },
            { id: 'TkwKiRvtK14', title: '가르기와 모으기로 더해 볼까요', channel: 'KOFAC', len: '1분' },
            { id: 'CwB5ogcHDo0', title: '가르기와 모으기로 빼 볼까요', channel: 'KOFAC', len: '1분' },
            { id: '2miRGtazHKs', title: '3단원 덧셈과 뺄셈 (전체 정리)', channel: '써밋특강', len: '18분' },
          ],
          practice: 'addsub',
        },
        {
          id: 'compare',
          title: '비교하기 (길이·무게·넓이·들이)',
          goal: '두 물건의 길이·무게·넓이·들이를 비교해 “더 길다 / 더 무겁다”로 말할 수 있어요.',
          points: [
            '비교하는 말을 정확히 쓰게 하세요 — 길다/짧다, 무겁다/가볍다, 넓다/좁다, 많다/적다.',
            '길이 비교는 **한쪽 끝을 맞춰서** 재야 한다는 걸 꼭 짚어 주세요.',
            '양팔 저울(양손에 하나씩)로 무게를 비교해 보면 몸으로 이해합니다.',
          ],
          videos: [
            { id: '2sDwBD6FHxk', title: '4단원 길이와 무게 비교하기', channel: '써밋특강', len: '9분' },
            { id: 'PRmQltuvHMk', title: '재미있게 비교하기 — 길이 비교', channel: '어디든학교', len: '10분' },
          ],
          practice: 'compare',
        },
        {
          id: 'num50',
          title: '50까지의 수',
          goal: '10개씩 묶어 세고, 십몇·몇십몇을 읽고 쓸 수 있어요.',
          points: [
            '★“10개씩 묶음”이 핵심입니다. 25 = 10개 묶음 2개 + 낱개 5개.',
            '한자어 수(이십오)와 우리말 수(스물다섯)를 둘 다 말해 보세요.',
            '달걀판, 사탕, 젤리처럼 10개씩 묶기 좋은 것으로 해 보면 좋습니다.',
          ],
          videos: [
            { id: 'ALWo1THJTfA', title: '5단원 50까지의 수', channel: '벨라수학쌤', len: '7분' },
            { id: 'cujW1PpLl6o', title: '50까지의 수 — 모으기와 가르기', channel: '선생님 클라쓰', len: '11분' },
            { id: 'zHfSYjtThWU', title: '모으기와 가르기를 해 볼까요 (수학익힘)', channel: '들꽃쌤', len: '13분' },
          ],
          practice: 'num50',
        },
      ],
    },
    {
      term: '2학기',
      name: '더 큰 수, 시계, 규칙',
      topics: [
        {
          id: 'num100',
          title: '100까지의 수',
          goal: '100까지 세고, 두 수의 크기를 비교하고, 짝수와 홀수를 구분할 수 있어요.',
          points: [
            '크기 비교는 **10개씩 묶음 수를 먼저** 봅니다. 묶음이 같으면 그때 낱개를 봅니다.',
            '수 배열표(1~100)를 벽에 붙여 두면 규칙이 저절로 보입니다.',
            '99 다음이 100이라는 것, 100은 10개씩 묶음이 10개라는 것.',
          ],
          videos: [
            { id: 'SECCHF_a9E8', title: '1단원 100까지의 수 (선수학습)', channel: '어디든학교', len: '12분' },
            { id: 'qesuOK2chLA', title: '100까지의 수 — 수의 순서 알기', channel: '어디든학교', len: '11분' },
            { id: 'BtC_RFBA3u8', title: '수의 순서를 알아볼까요 (두 자리 수)', channel: '밀크티타임', len: '2분' },
          ],
          practice: 'num100',
        },
        {
          id: 'shape2d',
          title: '여러 가지 모양 (네모·세모·동그라미)',
          goal: '평면 모양을 네모·세모·동그라미로 나누고, 그 모양으로 그림을 꾸밀 수 있어요.',
          points: [
            '“곧은 선이 몇 개?”, “뾰족한 곳이 몇 개?” 로 물어보세요.',
            '입체(상자 모양)의 바닥을 종이에 찍으면 평면(네모)이 나온다는 연결이 중요합니다.',
          ],
          videos: [
            { id: '7Ogk1dZUtM0', title: '여러 가지 모양을 알아볼까요 (평면)', channel: '밀크티타임', len: '2분' },
            { id: 'I5sRoOsg2W4', title: '여러 가지 모양을 살펴볼까요', channel: '밀크티타임', len: '2분' },
            { id: 'zDMAh-Z6UGY', title: '곰끼와 처음 수학 — 우주선의 모양은 세모? 네모?', channel: 'EBS 키즈', len: '13분' },
          ],
          practice: 'shape2d',
        },
        {
          id: 'make10',
          title: '덧셈과 뺄셈 (10 만들기·받아올림)',
          goal: '10이 되는 두 수를 알고, 10을 이용해 (몇)+(몇)=(십몇)을 계산할 수 있어요.',
          points: [
            '★10의 짝(1·9, 2·8, 3·7, 4·6, 5·5)을 **외우지 말고 손으로 만들어** 보게 하세요.',
            '8 + 5 = 8 + 2 + 3 = 10 + 3 = 13 — 이 과정을 소리 내어 말하게 하는 게 핵심입니다.',
            '2학년 받아올림 덧셈의 전부가 여기서 결정됩니다.',
          ],
          videos: [
            { id: '9eNLpBjElWI', title: '10을 이용하여 모으기와 가르기', channel: '어디든학교', len: '10분' },
            { id: 'L4H1hZxY-hc', title: '뺄셈을 해 볼까요 (덧셈과 뺄셈 3)', channel: '어디든학교', len: '6분' },
          ],
          practice: 'make10',
        },
        {
          id: 'clock',
          title: '시계 보기',
          goal: '몇 시와 몇 시 30분을 시계에서 읽고, 시곗바늘을 그릴 수 있어요.',
          points: [
            '짧은바늘이 “몇 시”, 긴바늘이 “몇 분”. 먼저 짧은바늘부터 봅니다.',
            '“몇 시 30분”에서 짧은바늘이 숫자와 숫자 **사이**에 있는 걸 꼭 확인하세요(3시 30분의 짧은바늘은 3과 4 사이).',
            '집에 있는 아날로그 시계로 하루에 한 번씩 물어보는 게 제일 빠릅니다.',
          ],
          videos: [
            { id: 'psU9rtP4m04', title: '몇 시를 알아볼까요', channel: '밀크티타임', len: '3분' },
            { id: 'R8YH9IciVQ4', title: '몇 시 30분을 알아볼까요', channel: '밀크티타임', len: '4분' },
            { id: 'UZlZWxsoC64', title: '시계 보기 — 몇 시 반일까요? (시계송)', channel: '핑크퐁', len: '2분' },
            { id: 'qOzWZNvpEQE', title: '곰끼와 처음 수학 — 시계를 읽어라!', channel: 'EBS 키즈', len: '13분' },
          ],
          practice: 'clock',
        },
        {
          id: 'pattern',
          title: '규칙 찾기',
          goal: '색·모양·수의 규칙을 찾아 다음에 올 것을 말할 수 있어요.',
          points: [
            '“다음엔 뭐가 올까?” 하고 물으면 됩니다. 규칙을 **말로 설명**하게 하는 게 진짜 목표입니다.',
            '수 배열표에서 2씩·5씩 뛰어 세기를 해 보세요.',
          ],
          videos: [
            { id: 'hZx5thzziuM', title: '5단원 시계 보기와 규칙 찾기', channel: '어디든학교', len: '8분' },
          ],
          practice: 'pattern',
        },
      ],
    },
    {
      term: '연중',
      name: '한 걸음 더',
      topics: [
        {
          id: 'story',
          title: '이야기로 푸는 덧셈과 뺄셈',
          goal: '짧은 이야기를 읽고 더하기인지 빼기인지 스스로 정해 답을 구할 수 있어요.',
          points: [
            '“모두”, “남은”, “더”, “먹었다” 같은 말이 힌트입니다. 그 말에 동그라미를 치게 해 보세요.',
            '식을 먼저 쓰게 하지 말고 손가락이나 그림으로 풀게 두면 개념이 더 단단해집니다.',
          ],
          videos: [
            { id: 'uXVU1OGh0H4', title: '그림을 보고 덧셈을 해 볼까요', channel: '밀크티타임', len: '2분' },
            { id: 'KzdBZUoeEwA', title: '수학동화 — 핫도그 더 주세요! (더하기 이야기)', channel: '대발이TV', len: '4분' },
            { id: 'z-pyCRH7Rw0', title: '초1 수학 — 덧셈과 뺄셈 이야기', channel: '엄마의성장', len: '6분' },
          ],
          practice: 'story',
        },
        {
          id: 'skip',
          title: '뛰어 세기 — 2씩, 5씩, 10씩',
          goal: '2·5·10씩 뛰어 세며 다음에 올 수를 말할 수 있어요.',
          points: [
            '곱셈의 씨앗입니다. 계단을 오르며 “2, 4, 6…” 세는 놀이가 그대로 공부가 됩니다.',
            '10씩 뛰어 세기가 익숙해지면 100까지의 수가 훨씬 쉬워집니다.',
          ],
          videos: [
            { id: 'bPcTDkJb04c', title: '10씩 뛰어 세기 (수동요)', channel: '핑크퐁', len: '1분' },
            { id: '5qx75Cb8Nqw', title: '뛰어 세기 — 2씩 5씩 노래로', channel: '핑크퐁', len: '3분' },
            { id: '2IQneQ5owkQ', title: '10개씩 묶어 세기 (1학년 1학기)', channel: '키출판사', len: '2분' },
          ],
          practice: 'skip',
        },
        {
          id: 'time2',
          title: '몇 시 몇 분 — 5분 단위로 읽기',
          goal: '긴바늘이 가리키는 숫자를 5씩 뛰어 세어 “몇 시 몇 분”을 읽을 수 있어요.',
          points: [
            '“몇 시, 몇 시 30분”을 먼저 완전히 익힌 뒤에 시작하세요.',
            '긴바늘의 숫자 1은 5분, 2는 10분 — **5씩 뛰어 세기**와 이어서 알려 주면 빨리 붙습니다.',
          ],
          videos: [
            { id: 'gZBppbLDpy4', title: '몇 시 몇 분? 5분 단위 시각 퀴즈', channel: '나다움교육', len: '5분' },
            { id: 'japJUYaIqW0', title: '1학년 2학기 5단원 — 몇 시 몇 분', channel: '박영수', len: '6분' },
            { id: 'bp6DZeP2MuM', title: '몇 시 몇 분을 알아볼까요 (한 걸음 더)', channel: '밀크티타임', len: '2분' },
          ],
          practice: 'time2',
        },
      ],
    },
  ],
};

/* ===================== 통합교과 ===================== */
const world: LearnSubject = {
  slug: 'world',
  emoji: '🌏',
  title: '통합교과',
  tagline: '학교 · 사람들 · 우리나라 · 탐험 — 세상을 알아가는 네 가지 주제.',
  subjectLabel: '바른 생활 · 슬기로운 생활 · 즐거운 생활',
  hue: 145,
  intro: [
    '2022 개정 교육과정의 1학년 통합교과는 「학교」·「사람들」(1학기), 「우리나라」·「탐험」(2학기) 네 권의 주제책으로 배웁니다. 「안전한 생활」도 여기에 통합됐습니다.',
    '정답을 외우는 과목이 아니라 **보고, 이야기하고, 해 보는** 과목입니다. 영상을 본 뒤 “너는 어떻게 생각해?” 하고 물어보는 게 이 과목의 공부법입니다.',
  ],
  units: [
    {
      term: '1학기',
      name: '학교 · 사람들',
      topics: [
        {
          id: 'school',
          title: '학교 — 함께 지내는 약속',
          goal: '학교에서 지켜야 할 약속을 알고, 친구와 사이좋게 지낼 수 있어요.',
          points: [
            '교실에서 지킬 약속 세 가지를 아이 입으로 말하게 해 보세요.',
            '“싫어”라고 말하는 법, 도움을 요청하는 법도 이 시기에 배웁니다.',
            '급식·화장실·복도 같은 학교 공간별 규칙을 이야기해 보세요.',
          ],
          videos: [
            { id: 'e9mTfT-jQFs', title: '교실에서 지켜야 할 약속', channel: '깨비키즈', len: '4분' },
            { id: 'NfqDPKVd8ug', title: '친구와 사이좋게 지내요', channel: '키드키즈', len: '6분' },
            { id: 'XbUeI7Ejj8A', title: '친구들과 학교에서 재미있게 노는 방법 (놀이터 안전)', channel: '아이쿠TV', len: '11분' },
          ],
          practice: 'quiz',
          quiz: [
            { q: '수업 시간에 하고 싶은 말이 생겼어요. 어떻게 할까요?', choices: ['손을 들고 기다려요', '큰 소리로 말해요', '옆 친구에게 속삭여요', '자리에서 일어나요'], answer: 0 },
            { q: '친구가 내 물건을 허락 없이 가져갔어요. 가장 좋은 방법은?', choices: ['똑같이 뺏어와요', '“내 거야, 돌려줘”라고 말해요', '아무 말도 안 해요', '때려요'], answer: 1 },
            { q: '복도에서는 어떻게 다녀야 할까요?', choices: ['뛰어다녀요', '오른쪽으로 걸어가요', '벽을 짚고 미끄러져요', '친구를 밀어요'], answer: 1 },
            { q: '친구가 넘어져서 울고 있어요. 제일 먼저 할 일은?', choices: ['웃어요', '모른 척해요', '괜찮은지 물어보고 선생님께 알려요', '사진을 찍어요'], answer: 2 },
            { q: '급식을 먹기 전에 꼭 해야 하는 것은?', choices: ['손을 씻어요', '뛰어다녀요', '큰 소리로 노래해요', '친구 밥을 먹어요'], answer: 0 },
          ],
        },
        {
          id: 'people',
          title: '사람들 — 마음과 이웃',
          goal: '내 마음을 말로 표현하고, 우리 동네 사람들이 하는 일을 알 수 있어요.',
          points: [
            '기쁘다/슬프다/화난다/무섭다 — 감정에 이름을 붙이는 연습을 해 주세요.',
            '“때리면 안 돼”가 아니라 “화가 나면 어떻게 할까?”로 물어보세요.',
            '동네를 걸으며 직업을 찾아보면 그대로 수업이 됩니다.',
          ],
          videos: [
            { id: 'KQW4hoM95v4', title: '지금 느끼는 감정은 뭘까? (감정송)', channel: '핑크퐁', len: '3분' },
            { id: '9lSoWNxqX9A', title: '내 마음을 말해요 (인성교육)', channel: '세종시교육청', len: '4분' },
            { id: 'Trew2YiCnUg', title: '때리면 아파요!', channel: '지니키즈', len: '8분' },
            { id: 's6GTl_JOeDo', title: '어디일까요? 경찰서·슈퍼마켓·병원', channel: '핑크퐁', len: '3분' },
            { id: 'cT1VgO74vlk', title: '세상에 존재하는 모든 직업', channel: '지니키즈', len: '12분' },
          ],
          practice: 'quiz',
          quiz: [
            { q: '아픈 사람을 치료해 주시는 분이 일하는 곳은?', choices: ['병원', '소방서', '우체국', '은행'], answer: 0 },
            { q: '불이 났을 때 와 주시는 분은?', choices: ['경찰관', '소방관', '집배원', '요리사'], answer: 1 },
            { q: '편지와 택배를 배달해 주시는 분은?', choices: ['집배원', '의사', '농부', '가수'], answer: 0 },
            { q: '너무 화가 날 때 하면 좋은 것은?', choices: ['친구를 때려요', '물건을 던져요', '숨을 크게 쉬고 “나 화났어”라고 말해요', '소리를 질러요'], answer: 2 },
            { q: '친구가 “고마워”라고 했어요. 뭐라고 답할까요?', choices: ['천만에, 괜찮아', '싫어', '왜?', '아무 말 안 해요'], answer: 0 },
            { q: '기분이 아주 좋을 때의 마음을 뭐라고 할까요?', choices: ['슬프다', '기쁘다', '무섭다', '심심하다'], answer: 1 },
          ],
        },
      ],
    },
    {
      term: '2학기',
      name: '우리나라 · 탐험',
      topics: [
        {
          id: 'korea',
          title: '우리나라 — 태극기·애국가·무궁화',
          goal: '우리나라를 나타내는 것들을 알고, 태극기를 바르게 그릴 수 있어요.',
          points: [
            '태극기: 흰 바탕, 가운데 빨강·파랑 태극, 네 귀퉁이에 건곤감리 4괘.',
            '나라꽃은 무궁화, 나라 노래는 애국가입니다.',
            '한복·한글·김치처럼 우리나라의 것들을 같이 찾아보세요.',
          ],
          videos: [
            { id: 'Xq27nyfvDkI', title: '우리나라 알아보기 — 태극기·무궁화·애국가', channel: '토끼끼', len: '9분' },
            { id: 'vmY1mHffKQU', title: '태극기 참 쉽다 — 태극기 그리기', channel: 'BaBaYo바바요', len: '4분' },
            { id: 'jrFgGVK1HJs', title: '애국가 1~4절 따라 부르기', channel: '밀크티타임', len: '4분' },
            { id: 'WpDUmozeoOg', title: '태극기 동요 (노래방)', channel: '지니키즈', len: '1분' },
          ],
          practice: 'quiz',
          quiz: [
            { q: '우리나라 국기의 이름은?', choices: ['태극기', '무궁화', '애국가', '한글'], answer: 0 },
            { q: '우리나라의 꽃은?', choices: ['장미', '무궁화', '개나리', '해바라기'], answer: 1 },
            { q: '태극기 가운데 동그라미의 색깔 두 가지는?', choices: ['빨강과 파랑', '노랑과 초록', '검정과 흰색', '보라와 분홍'], answer: 0 },
            { q: '우리나라의 노래는?', choices: ['아리랑', '애국가', '동요', '교가'], answer: 1 },
            { q: '우리나라 글자의 이름은?', choices: ['한자', '영어', '한글', '알파벳'], answer: 2 },
            { q: '태극기의 네 귀퉁이에 있는 검은 무늬는 모두 몇 개일까요?', choices: ['2개', '4개', '6개', '8개'], answer: 1 },
          ],
        },
        {
          id: 'explore',
          title: '탐험 — 계절과 자연',
          goal: '봄·여름·가을·겨울의 특징을 알고, 계절에 따라 달라지는 것을 찾을 수 있어요.',
          points: [
            '창밖을 보며 “지금은 무슨 계절이야? 왜 그렇게 생각해?” 하고 물어보세요.',
            '계절별 옷차림, 먹는 것, 노는 것으로 나눠 보면 정리가 쉽습니다.',
            '나뭇잎·돌·씨앗을 모아 관찰하는 것도 이 단원의 활동입니다.',
          ],
          videos: [
            { id: '9KjYKUMVFFI', title: '랄랄라 사계절 — 어떤 계절이 좋아?', channel: '핑크퐁', len: '3분' },
            { id: 'cl15rSwrerI', title: '봄 여름 가을 겨울 (과학송)', channel: '깨비키즈', len: '3분' },
            { id: '_LV3_iaWLQ0', title: '바람이 들려주는 사계절 이야기', channel: '키드키즈', len: '3분' },
          ],
          practice: 'quiz',
          quiz: [
            { q: '눈이 오고 가장 추운 계절은?', choices: ['봄', '여름', '가을', '겨울'], answer: 3 },
            { q: '나뭇잎이 빨갛고 노랗게 물드는 계절은?', choices: ['봄', '여름', '가을', '겨울'], answer: 2 },
            { q: '개구리가 겨울잠에서 깨어나고 꽃이 피는 계절은?', choices: ['봄', '여름', '가을', '겨울'], answer: 0 },
            { q: '장마가 오고 가장 더운 계절은?', choices: ['봄', '여름', '가을', '겨울'], answer: 1 },
            { q: '겨울에 입으면 좋은 옷은?', choices: ['반팔 티셔츠', '수영복', '두꺼운 외투', '민소매'], answer: 2 },
            { q: '계절은 모두 몇 개일까요?', choices: ['2개', '3개', '4개', '5개'], answer: 2 },
          ],
        },
      ],
    },
    {
      term: '연중',
      name: '한 걸음 더',
      topics: [
        {
          id: 'season',
          title: '계절과 날씨 — 오늘은 어떤 날일까',
          goal: '네 계절의 차례를 말하고, 날씨에 맞는 옷과 준비물을 고를 수 있어요.',
          points: [
            '아침에 창밖을 보며 “오늘은 무슨 옷이 좋을까?” 하고 아이가 정하게 해 보세요.',
            '계절이 바뀌는 이유까지 설명할 필요는 없습니다. 1학년은 **관찰과 말하기**가 목표입니다.',
          ],
          videos: [
            { id: 'HoV_bb14ISk', title: '곰끼의 사계절 열두 달 (노래)', channel: 'EBS 키즈', len: '1분' },
            { id: 'lnzKs2QSu0c', title: '봄 인사 — 봄의 동식물과 생활 모습', channel: '밀크티타임', len: '4분' },
            { id: 'CuwHv3jPGRg', title: '여름철 건강 지키기 — 날씨·음식·옷차림', channel: '밀크티타임', len: '10분' },
          ],
          practice: 'quiz',
          quiz: [
            { q: '봄 다음에 오는 계절은?', choices: ['여름', '가을', '겨울', '봄'], answer: 0, hint: '봄 → 여름 → 가을 → 겨울' },
            { q: '눈이 오고 가장 추운 계절은?', choices: ['겨울', '봄', '여름', '가을'], answer: 0 },
            { q: '비가 많이 오는 날 챙기면 좋은 것은?', choices: ['우산', '부채', '썰매', '수영복'], answer: 0 },
            { q: '나뭇잎이 붉게 물드는 계절은?', choices: ['가을', '봄', '여름', '겨울'], answer: 0 },
            { q: '아주 더운 날 몸을 지키려면?', choices: ['물을 자주 마셔요', '옷을 더 껴입어요', '뛰어다녀요', '창문을 다 닫아요'], answer: 0 },
            { q: '겨울에 밖에 나갈 때 좋은 옷차림은?', choices: ['목도리와 장갑', '반팔과 반바지', '수영복', '슬리퍼'], answer: 0 },
            { q: '봄에 피는 꽃이 아닌 것은?', choices: ['국화', '개나리', '진달래', '벚꽃'], answer: 0, hint: '국화는 가을에 피어요.' },
            { q: '날씨를 알려 주는 방송을 무엇이라 하나요?', choices: ['일기 예보', '뉴스 속보', '만화 영화', '광고'], answer: 0 },
          ],
        },
      ],
    },
  ],
};

/* ===================== 안전한 생활 ===================== */
const safety: LearnSubject = {
  slug: 'safety',
  emoji: '🚦',
  title: '안전한 생활',
  tagline: '길 건너기, 손 씻기, 그리고 나를 지키는 법.',
  subjectLabel: '통합교과 · 안전한 생활 (연중)',
  hue: 5,
  intro: [
    '1학년은 처음으로 혼자 다니기 시작하는 나이입니다. 안전 교육은 학기와 상관없이 **자주, 반복해서** 하는 게 맞습니다.',
    '아래 영상은 한국교통안전공단·행정안전부 같은 공공기관 자료를 우선으로 골랐습니다.',
  ],
  units: [
    {
      term: '연중',
      name: '언제나 지켜요',
      topics: [
        {
          id: 'traffic',
          title: '교통안전 — 멈춘다, 살핀다, 건넌다',
          goal: '횡단보도를 건널 때 서고·보고·손을 들고 건널 수 있어요.',
          points: [
            '★핵심 문장 하나: **“멈춘다 → 살핀다 → 손을 든다 → 걸어서 건넌다.”**',
            '초록불이 켜져도 차가 멈췄는지 눈으로 확인하고 건너야 합니다.',
            '주차된 차 사이에서 갑자기 나오지 않기 — 어린이 사고의 가장 흔한 원인입니다.',
          ],
          videos: [
            { id: '5rvk-_g-AkU', title: '코코몽 — 횡단보도에서는 좌우를 살펴야 해', channel: '코코몽', len: '5분' },
            { id: 'tI4uSbK2N2I', title: '만화로 배우는 교통안전교육', channel: '한국교통안전공단', len: '11분' },
            { id: 'BLxy2jCrd8s', title: '학교 앞 차로를 안전하게 건너요', channel: '아이쿠TV', len: '10분' },
            { id: 't7-pOkME988', title: '어린이 교통안전교육 애니메이션', channel: '아동안전위원회', len: '6분' },
          ],
          practice: 'quiz',
          quiz: [
            { q: '횡단보도 앞에 왔어요. 가장 먼저 할 일은?', choices: ['뛰어서 건너요', '멈춰 서요', '전화를 봐요', '자전거를 타고 건너요'], answer: 1 },
            { q: '초록불로 바뀌었어요. 바로 건너도 될까요?', choices: ['바로 뛰어가요', '차가 멈췄는지 보고 건너요', '눈을 감고 건너요', '한 발로 건너요'], answer: 1 },
            { q: '길을 건널 때 손은 어떻게 할까요?', choices: ['주머니에 넣어요', '높이 들어요', '흔들어요', '뒤로 숨겨요'], answer: 1 },
            { q: '자동차 뒤쪽에서 놀아도 될까요?', choices: ['괜찮아요', '안 돼요. 운전하는 사람이 볼 수 없어요', '재미있어요', '한 명만 놀면 돼요'], answer: 1 },
            { q: '자전거나 킥보드를 탈 때 꼭 써야 하는 것은?', choices: ['모자', '안전모(헬멧)', '선글라스', '장갑'], answer: 1 },
          ],
        },
        {
          id: 'habit',
          title: '건강한 습관 — 손 씻기와 양치',
          goal: '밖에서 돌아오면 손을 씻고, 하루 세 번 이를 닦을 수 있어요.',
          points: [
            '손은 비누로 30초 — 손등, 손가락 사이, 손톱 밑까지.',
            '이는 위아래·안쪽·씹는 면까지 3분. 자기 전 양치가 가장 중요합니다.',
            '일찍 자기(9시 취침)도 1학년에게는 학습만큼 중요합니다.',
          ],
          videos: [
            { id: 'pyoVHOl2rrU', title: '핑크퐁 손씻기송', channel: '핑크퐁', len: '2분' },
            { id: 'jaEt8qwrahY', title: '치카치카 양치해요 (양치송)', channel: '핑크퐁', len: '2분' },
          ],
          practice: 'quiz',
          quiz: [
            { q: '밖에서 놀다 집에 왔어요. 제일 먼저 할 일은?', choices: ['간식 먹기', '손 씻기', 'TV 보기', '눕기'], answer: 1 },
            { q: '손은 무엇으로 씻는 게 가장 좋을까요?', choices: ['물만', '비누와 물', '휴지', '옷'], answer: 1 },
            { q: '이는 하루에 몇 번 닦으면 좋을까요?', choices: ['한 번', '세 번', '일주일에 한 번', '안 닦아도 돼요'], answer: 1 },
            { q: '기침이 나올 때는 어떻게 할까요?', choices: ['손바닥으로 막아요', '옷소매로 막아요', '그냥 해요', '친구 쪽으로 해요'], answer: 1 },
          ],
        },
        {
          id: 'protect',
          title: '나를 지키는 힘',
          goal: '싫은 일이 있을 때 “싫어”라고 말하고 어른에게 도움을 요청할 수 있어요.',
          points: [
            '★“비밀로 하자”고 하는 어른의 말은 따르지 않아도 된다고 알려 주세요.',
            '도와줄 어른 세 명의 이름을 아이와 함께 정해 두세요.',
            '괴롭힘을 당하면 참는 게 아니라 **말하는 것**이 용기라고 반복해 주세요.',
          ],
          videos: [
            { id: 'xQl7wu38n1M', title: '친구가 괴롭히거나 속상하게 하면 이렇게 하세요', channel: '행정안전부', len: '3분' },
          ],
          practice: 'quiz',
          quiz: [
            { q: '모르는 사람이 “같이 가자”고 해요. 어떻게 할까요?', choices: ['따라가요', '“싫어요” 하고 어른에게 가요', '조용히 서 있어요', '차에 타요'], answer: 1 },
            { q: '친구가 계속 괴롭혀요. 어떻게 할까요?', choices: ['참아요', '선생님이나 부모님께 말해요', '똑같이 괴롭혀요', '학교에 안 가요'], answer: 1 },
            { q: '길을 잃었어요. 어디로 가면 좋을까요?', choices: ['가게나 경찰서 같은 안전한 곳', '어두운 골목', '아무 차', '집까지 혼자 뛰어가요'], answer: 0 },
          ],
        },
      ],
    },
    {
      term: '연중',
      name: '한 걸음 더',
      topics: [
        {
          id: 'fire',
          title: '불이 나면 · 땅이 흔들리면',
          goal: '화재와 지진이 났을 때 가장 먼저 할 일을 말하고, 몸으로 해 볼 수 있어요.',
          points: [
            '**설명보다 연습**입니다. 집에서 한 번이라도 “나가는 길”을 같이 걸어 보세요.',
            '“불이야!” 하고 크게 외치는 연습도 해 두면 실제 상황에서 목소리가 나옵니다.',
          ],
          videos: [
            { id: 'yxRdPgtstTc', title: '초등 1~3학년 — 불이 나면, 이렇게 대피해요!', channel: '학교안전공제중앙회', len: '9분' },
            { id: 'yVQ1sTDEAvA', title: '갑자기 불이 났을 때 어떻게 해야 할까?', channel: '행정안전부', len: '5분' },
            { id: '5ANoKYg0Dbo', title: '땅이 흔들려요 — 지진 대피', channel: '아이클래스', len: '7분' },
            { id: 'eoCVuTQ7uG4', title: '으악! 지진이다! 지진 대피 방법', channel: '깨비키즈', len: '9분' },
          ],
          practice: 'quiz',
          quiz: [
            { q: '불이 난 것을 보면 가장 먼저 할 일은?', choices: ['크게 “불이야!” 하고 알려요', '가방을 챙겨요', '숨어요', '사진을 찍어요'], answer: 0 },
            { q: '연기가 가득한 곳을 지날 때는?', choices: ['자세를 낮추고 코와 입을 막아요', '똑바로 서서 뛰어요', '숨을 크게 들이마셔요', '문을 활짝 열어 둬요'], answer: 0 },
            { q: '불이 났을 때 타면 안 되는 것은?', choices: ['엘리베이터', '계단', '비상구', '복도'], answer: 0, hint: '전기가 끊기면 갇힐 수 있어요.' },
            { q: '불이 났을 때 거는 번호는?', choices: ['119', '112', '114', '110'], answer: 0 },
            { q: '땅이 흔들리기 시작하면 먼저?', choices: ['책상 아래로 들어가 머리를 보호해요', '창문으로 뛰어내려요', '그대로 서 있어요', '불을 켜요'], answer: 0 },
            { q: '흔들림이 멈춘 뒤에 나갈 곳은?', choices: ['넓은 운동장', '건물 사이 좁은 길', '지하실', '옥상 난간'], answer: 0 },
            { q: '옷에 불이 붙었을 때는?', choices: ['멈추고, 엎드리고, 뒹굴어요', '뛰어다녀요', '바람을 불어요', '손으로 털어요'], answer: 0 },
            { q: '집에서 미리 정해 두면 좋은 것은?', choices: ['가족이 만날 장소', '좋아하는 간식', '텔레비전 채널', '잠자는 순서'], answer: 0 },
          ],
        },
      ],
    },
  ],
};

/* ===================== 놀이 영어 ===================== */
const english: LearnSubject = {
  slug: 'english',
  emoji: '🔤',
  title: '놀이 영어',
  tagline: '정규 과목은 3학년부터 — 지금은 노래로 알파벳과 소리만 친해지기.',
  subjectLabel: '보너스 (교육과정 밖)',
  hue: 268,
  intro: [
    '초등학교 영어는 **3학년부터** 시작합니다. 1학년에게 필요한 건 문법이나 단어 암기가 아니라 “영어 소리가 낯설지 않은 상태”입니다.',
    '그래서 이 코너는 노래와 파닉스만 담았습니다. 하루 한 곡, 따라 부르기만 해도 충분합니다.',
  ],
  units: [
    {
      term: '보너스',
      name: '노래로 친해져요',
      topics: [
        {
          id: 'alphabet',
          title: '알파벳 — 대문자와 소문자',
          goal: 'A부터 Z까지 노래로 부르고, 대문자와 소문자를 짝지을 수 있어요.',
          points: [
            '이름(에이·비·씨)과 소리(아·브·크)는 다릅니다. 지금은 이름부터.',
            '대문자 A와 소문자 a처럼 모양이 다른 짝(A/a, B/b, D/d, E/e, G/g, Q/q, R/r)을 특히 헷갈려 합니다.',
          ],
          videos: [
            { id: 'HTyxQGPw_HA', title: 'ABC Song — 알파벳송', channel: '주니토니', len: '2분' },
            { id: 'tTtpHQ0J9ew', title: '알파벳송 — 대문자송 소문자송', channel: '아빠같이놀까', len: '4분' },
          ],
          practice: 'alphabet',
        },
        {
          id: 'phonics',
          title: '파닉스 — 글자의 소리',
          goal: '알파벳이 내는 대표 소리를 듣고 따라 할 수 있어요.',
          points: [
            'A는 “애”, B는 “브” — 소리만 나오면 단어 읽기가 시작됩니다.',
            '하루에 서너 글자씩, 노래로만 해도 충분합니다.',
          ],
          videos: [
            { id: 'ffeZXPtTGC4', title: 'Phonics Song 2 — 세계에서 가장 많이 본 파닉스송', channel: 'KidsTV123', len: '3분' },
            { id: 'Kd3YRvCT4W8', title: '슈퍼 매직 파닉스 — 첫 파닉스', channel: '슈퍼홈스쿨', len: '5분' },
            { id: 'Q7ojIAY24zs', title: 'A부터 Z까지 파닉스 동요 모음', channel: '리틀팍스', len: '38분' },
          ],
          practice: 'phonics',
        },
      ],
    },
    {
      term: '연중',
      name: '한 걸음 더',
      topics: [
        {
          id: 'color',
          title: '색깔 말하기 — Colors',
          goal: '기본 색깔 8가지를 영어로 듣고 말할 수 있어요.',
          points: [
            '옷·과일·자동차를 보며 “What color?” 하고 물어보는 것만으로 충분합니다.',
            '철자를 외우게 하지 마세요. 1학년 영어는 **듣고 말하기**가 전부입니다.',
          ],
          videos: [
            { id: 'SLZcWGQQsmg', title: 'Rainbow Colors Song — 색깔 노래', channel: 'The Singing Walrus', len: '3분' },
            { id: 'zxIpA5nF_LY', title: 'What\'s Your Favorite Color?', channel: 'Super Simple Songs', len: '2분' },
            { id: 'iCrQVRq8UMM', title: '색깔 영단어 배우기 (한국어 안내)', channel: '길벗스쿨', len: '1분' },
          ],
          practice: 'color',
        },
        {
          id: 'numen',
          title: '숫자 세기 — Numbers 1~20',
          goal: '1부터 20까지 영어로 세고, 숫자를 보고 영어 낱말을 고를 수 있어요.',
          points: [
            '계단·사탕·손가락을 세며 영어로 말해 보게 하세요.',
            '13~19는 -teen 으로 끝난다는 규칙을 알려 주면 스무 개가 아니라 열 개만 외우면 됩니다.',
          ],
          videos: [
            { id: 'D0Ajq682yrA', title: 'Number Song 1-20 — 1부터 20까지', channel: 'The Singing Walrus', len: '2분' },
            { id: 'S84fcGdEULk', title: 'Counting Up To 20', channel: 'Super Simple Songs', len: '3분' },
            { id: '6mqdzGUUVE8', title: 'Number Rock — 숫자송 영어 1~20', channel: '비비파닉스', len: '2분' },
          ],
          practice: 'numen',
        },
      ],
    },
  ],
};

export const subjects: LearnSubject[] = [korean, math, world, safety, english];


/* ===================== 학습 과정 =====================
 * ⚠️왜 '과정'이 따로 있나: 과목별 목차만 있으면 **오늘 뭘 할지**를 매번 어른이 정해 줘야 한다.
 *   1학년은 스스로 고르는 힘이 아직 약해서, 고르는 화면이 곧 멈추는 자리가 된다.
 *   그래서 36개 주제를 **12주 × 3단계**의 한 줄짜리 길로 다시 깔았다. 아이는 "다음 단계"만 누르면 된다.
 * ⚠️순서 원칙: ①한 주에 국어·수학을 반드시 하나씩 넣어 감각이 끊기지 않게 하고
 *   ②나머지 한 칸에 통합·안전·영어를 돌려 지루함을 막는다. ③쉬운 것에서 어려운 것으로.
 * ⚠️학교 진도와 1:1로 맞추지 않았다 — 학교는 학급마다 순서가 다르고, 여기서 앞서 배워도 손해가 없다.
 */
export type CourseStep = { subject: string; topic: string };
export type CourseWeek = { no: number; title: string; goal: string; steps: CourseStep[] };

const S = (subject: string, topic: string): CourseStep => ({ subject, topic });

export const course: CourseWeek[] = [
  { no: 1, title: '시작해요', goal: '자음·모음을 알고 9까지 셀 수 있어요.',
    steps: [S('korean', 'jamo'), S('math', 'count9'), S('safety', 'traffic')] },
  { no: 2, title: '글자가 만들어져요', goal: '자음+모음으로 글자를 만들고 순서를 셀 수 있어요.',
    steps: [S('korean', 'syllable'), S('math', 'order9'), S('world', 'school')] },
  { no: 3, title: '받침을 만나요', goal: '받침 있는 글자를 읽고 모양을 구별할 수 있어요.',
    steps: [S('korean', 'batchim'), S('math', 'shape3d'), S('english', 'alphabet')] },
  { no: 4, title: '낱말과 덧셈', goal: '낱말을 만들고 9까지 더하고 뺄 수 있어요.',
    steps: [S('korean', 'wordmake'), S('math', 'addsub'), S('world', 'people')] },
  { no: 5, title: '흉내말과 비교', goal: '흉내 내는 말을 알고 길이·무게를 비교할 수 있어요.',
    steps: [S('korean', 'mimetic'), S('math', 'compare'), S('safety', 'habit')] },
  { no: 6, title: '문장을 만들어요', goal: '낱말을 순서대로 놓아 문장을 만들고 50까지 셀 수 있어요.',
    steps: [S('korean', 'sentence'), S('math', 'num50'), S('english', 'phonics')] },
  { no: 7, title: '문장 부호와 이야기 문제', goal: '문장 부호를 알고 이야기 문제를 식으로 바꿀 수 있어요.',
    steps: [S('korean', 'punct'), S('math', 'story'), S('world', 'korea')] },
  { no: 8, title: '바르게 쓰기', goal: '소리와 다르게 쓰는 말을 알고 100까지 셀 수 있어요.',
    steps: [S('korean', 'dictation'), S('math', 'num100'), S('safety', 'fire')] },
  { no: 9, title: '내 이야기를 써요', goal: '그림일기를 쓰고 평면도형을 구별할 수 있어요.',
    steps: [S('korean', 'diary'), S('math', 'shape2d'), S('world', 'explore')] },
  { no: 10, title: '10을 만들어요', goal: '10을 만들어 더하고, 색깔을 영어로 말할 수 있어요.',
    steps: [S('math', 'make10'), S('english', 'color'), S('world', 'season')] },
  { no: 11, title: '시계를 읽어요', goal: '몇 시 몇 분까지 읽을 수 있어요.',
    steps: [S('math', 'clock'), S('math', 'time2'), S('safety', 'protect')] },
  { no: 12, title: '규칙을 찾아요', goal: '규칙을 찾고 뛰어 세며 한 해를 마무리해요.',
    steps: [S('math', 'pattern'), S('math', 'skip'), S('english', 'numen')] },
];

export const courseSteps = (): { week: CourseWeek; step: CourseStep; index: number }[] =>
  course.flatMap((week) => week.steps.map((step) => ({ week, step, index: 0 })))
    .map((x, i) => ({ ...x, index: i }));

/** 단계 id — localStorage 진도 키. 주제 id 만으로는 과목이 겹칠 수 있어 과목까지 붙인다. */
export const stepId = (s: CourseStep) => `${s.subject}:${s.topic}`;

export function findTopic(subject: string, topic: string) {
  const sub = subjects.find((x) => x.slug === subject);
  if (!sub) return undefined;
  for (const u of sub.units) {
    const t = u.topics.find((x) => x.id === topic);
    if (t) return { subject: sub, unit: u, topic: t };
  }
  return undefined;
}

/** 코스가 실제 레지스트리와 어긋나지 않는지 — 빌드 때 터지게 둔다(조용한 링크 깨짐 방지). */
const missing = course.flatMap((w) => w.steps).filter((s) => !findTopic(s.subject, s.topic));
if (missing.length) {
  throw new Error('learn 코스에 없는 주제가 있습니다: ' + missing.map(stepId).join(', '));
}

export function subjectBySlug(slug: string): LearnSubject | undefined {
  return subjects.find((s) => s.slug === slug);
}

export function allTopics(): { subject: LearnSubject; unit: LearnUnit; topic: LearnTopic }[] {
  return subjects.flatMap((subject) =>
    subject.units.flatMap((unit) => unit.topics.map((topic) => ({ subject, unit, topic })))
  );
}

export function countVideos(s: LearnSubject): number {
  return s.units.reduce((a, u) => a + u.topics.reduce((b, t) => b + t.videos.length, 0), 0);
}

export function countTopics(s: LearnSubject): number {
  return s.units.reduce((a, u) => a + u.topics.length, 0);
}

/**
 * 본문 문자열의 `**강조**` 를 <strong> 으로 바꾼다.
 * ⚠️Astro 는 문자열을 그대로 출력하므로 마크다운 표기가 화면에 별표로 그대로 보인다.
 *   HTML 을 먼저 이스케이프한 뒤 강조만 되살리므로 set:html 로 써도 안전하다.
 */
export function emphasize(s: string): string {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export const learnIndexUrl = '/learn/';
export const subjectUrl = (slug: string) => `/learn/${slug}/`;
export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const thumbUrl = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
