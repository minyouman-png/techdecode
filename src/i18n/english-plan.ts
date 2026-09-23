/* 유진이 영어학습 프로그램 — 2026년 9월 4째주 ~ 12월 5째주, 주 3일 · 총 45회.
 *
 * ★무엇을 가장 중요하게 두었나: **아이가 영어를 좋아하게 되는 것.**
 *   1학년에게 영어 진도는 목표가 아니다. 초등학교 영어는 3학년에 시작한다.
 *   지금 필요한 건 "영어 = 재미있는 것"이라는 기억이고, 그게 3학년 이후를 결정한다.
 *   그래서 이 프로그램은 다음을 지킨다:
 *
 *   ① **한 회 10~15분.** 짧게 끝내서 "또 하고 싶다"로 남긴다. 길면 그날 하루가 아니라
 *      영어 자체가 싫어진다. 아이가 더 하고 싶어 하면 그때 더 한다(먼저 늘리지 않는다).
 *   ② **주 3일의 역할이 다르다.** 같은 낱말도 형태를 바꿔야 지루해지지 않는다.
 *        1일차 만나기 — 새 낱말을 듣고 따라 한다(놀이터)
 *        2일차 놀이   — 새 낱말 없이 게임과 몸으로 하는 놀이로 굳힌다
 *        3일차 찾기   — 집·바깥에서 실제로 써먹는다(부모와 함께)
 *   ③ **새 낱말은 한 회 6개 이하.** 85개를 15주에 나누면 주 6개면 충분하다. 서두를 이유가 없다.
 *   ④ **4주마다 복습 주간.** 새 낱말 없이 놀이만 한다. 아는 것을 다시 만나는 것도 공부다.
 *   ⑤ **틀린 것을 고치지 않는다.** 발음이 이상해도 그대로 둔다. 지적하는 순간 입을 닫는다.
 *      맞는 소리는 mp3 가 계속 들려준다 — 그게 교정이다.
 *   ⑥ **12월은 크리스마스로 묶는다.** 아이가 일 년 중 가장 신나는 때다. 그 기운을 쓴다.
 *
 * ⚠️유튜브 영상은 전부 oEmbed 로 실재를 확인했다(2026-09-23). 죽은 링크는 아이에게 그대로 실패 경험이다.
 *   확인 도구: `tools/learn-video-check.py`(learn.ts 용) / 이 파일은 `tools/english-plan-check.py`.
 *   ⚠️실측: 후보 20개 중 10개가 404 였고, 살아 있는 것 중에도 '염소 우는 영상'과 '개발 강의'가 섞여 있었다.
 *     제목까지 확인하지 않으면 엉뚱한 것이 아이에게 간다.
 */

export type PlanDay = {
  /** 1 만나기 · 2 놀이 · 3 찾기 */
  kind: 1 | 2 | 3;
  title: string;
  /** 대략 걸리는 시간 */
  min: string;
  /** 그날 할 일 — 순서대로 */
  steps: string[];
  /** 그날 다루는 낱말(words.js 의 id). 2·3일차는 보통 1일차와 같다. */
  words?: string[];
  /** 부모가 해 줄 한 가지 */
  parent?: string;
  /** 노래 — 확인된 유튜브 영상만 */
  video?: { id: string; title: string; channel: string };
};

export type PlanWeek = {
  no: number;
  /** 화면에 그대로 쓰는 이름 */
  label: string;
  /** 월~일 */
  range: string;
  /** 이번 주 한 줄 */
  theme: string;
  /** 복습 주간인가 */
  review?: boolean;
  days: [PlanDay, PlanDay, PlanDay];
};

const V = {
  babyShark: { id: 'XqZsoesa55w', title: 'Baby Shark Dance', channel: 'Pinkfong' },
  jungle: { id: 'GoSq-yZcJ-4', title: 'Walking In The Jungle', channel: 'Super Simple Songs' },
  pet: { id: 'pWepfJ-8XU0', title: 'I Have A Pet', channel: 'Super Simple Songs' },
  farm: { id: '_6HzoUcx3eo', title: 'Old MacDonald Had A Farm', channel: 'Super Simple Songs' },
  farmVocab: { id: 'hewioIU4a64', title: 'Farm animals for kids', channel: 'Smile and Learn' },
  fruit: { id: 'mfReSbQ7jzE', title: 'Fruit Song', channel: 'The Singing Walrus' },
  broccoli: { id: 'frN3nvhIHUk', title: 'Do You Like Broccoli Ice Cream?', channel: 'Super Simple Songs' },
  rainbow: { id: 'SLZcWGQQsmg', title: 'Rainbow Colors Song', channel: 'The Singing Walrus' },
  favColor: { id: 'zxIpA5nF_LY', title: "What's Your Favorite Color?", channel: 'Super Simple Songs' },
  family: { id: 'd_WQEw13TCo', title: 'Family Members Song', channel: 'English Tree' },
  numbers: { id: 'D0Ajq682yrA', title: 'Number Song 1-20', channel: 'The Singing Walrus' },
  count20: { id: 'S84fcGdEULk', title: 'Counting Up To 20', channel: 'Super Simple Songs' },
  body: { id: 'QkHQ0CYwjaI', title: 'Body Parts Song — This is ME!', channel: 'ELF Kids Videos' },
  head: { id: 'ZanHgPprl-0', title: 'Head Shoulders Knees & Toes', channel: 'Super Simple Songs' },
  abc: { id: 'HTyxQGPw_HA', title: 'ABC Song — 알파벳송', channel: '주니토니' },
  phonics: { id: 'ffeZXPtTGC4', title: 'Phonics Song 2', channel: 'KidsTV123' },
  twinkle: { id: 'yCjJyiqpAuU', title: 'Twinkle Twinkle Little Star', channel: 'Super Simple Songs' },
  snow: { id: 'tbbKjDjMDok', title: 'Little Snowflake', channel: 'Super Simple Songs' },
  xmas: { id: 'hNkvV4PR-q0', title: 'We Wish You A Merry Christmas', channel: 'Super Simple Songs' },
  xmasMore: { id: '7xdUgzQvTKY', title: 'Merry Christmas from Super Simple!', channel: 'Super Simple Songs' },
};

export const weeks: PlanWeek[] = [
  /* ═══ 9월 — 시작. 아는 것부터 꺼내 자신감을 준다 ═══ */
  {
    no: 1, label: '9월 4째주', range: '9/21~9/27',
    theme: '이미 아는 영어로 시작해요 · 호랑이와 사자 구별하기',
    days: [
      { kind: 1, title: '나 이거 알아!', min: '10분',
        words: ['elephant', 'shark', 'teacher', 'student', 'baby'],
        steps: [
          '낱말 놀이터를 열고 <b>동물</b> 칸에서 코끼리와 상어를 눌러 봅니다. "어? 나 이거 아는데!"가 나오면 성공입니다.',
          '<b>학교</b> 칸에서 선생님·학생, <b>가족</b> 칸에서 아기를 눌러 봅니다.',
          '베이비 샤크 노래를 같이 봅니다. 아는 노래로 시작하는 날입니다.',
        ],
        parent: '오늘은 가르치지 마세요. "이거 알아?" 하고 물어만 보세요. 아는 게 이미 다섯 개라는 걸 아이가 알게 되는 날입니다.',
        video: V.babyShark },
      { kind: 2, title: '호랑이와 사자', min: '15분',
        words: ['tiger', 'lion'],
        steps: [
          '놀이터 <b>헷갈리는 짝</b> 칸에서 tiger 와 lion 을 번갈아 눌러 봅니다. 🐢 를 켜고 천천히도 들어 봅니다.',
          '게임에서 <b>헷갈리는 짝</b> 주제를 골라 한 판 합니다.',
          '흉내 놀이 — 부모가 "tiger!" 하면 호랑이, "lion!" 하면 사자 흉내를 냅니다. 바꿔서도 해 봅니다.',
        ],
        parent: '둘을 꼭 붙여서 내주세요. 따로 배우면 각각은 알아도 나란히 두면 못 고릅니다.' },
      { kind: 3, title: '집에서 찾기', min: '10분',
        words: ['elephant', 'shark', 'tiger', 'lion', 'baby'],
        steps: [
          '집에 있는 인형·그림책에서 오늘 배운 동물을 찾아봅니다.',
          '찾으면 영어로 말해 봅니다. 틀려도 고치지 말고 놀이터에서 한 번 더 들려주세요.',
          '게임 <b>동물</b> 주제로 한 판 더 합니다.',
        ],
        parent: '발음을 고치지 마세요. 지적하는 순간 아이가 입을 닫습니다. 맞는 소리는 🔊 가 계속 들려줍니다.' },
    ],
  },
  {
    no: 2, label: '10월 1째주', range: '9/28~10/4',
    theme: '집에서 기르는 동물들',
    days: [
      { kind: 1, title: '강아지와 고양이', min: '10분',
        words: ['dog', 'cat', 'rabbit', 'bird', 'fish'],
        steps: ['놀이터 <b>동물</b> 칸에서 다섯 개를 눌러 듣습니다.',
          '각각 세 번씩 따라 말해 봅니다. 🐢 로 천천히 한 번씩.',
          'I Have A Pet 노래를 같이 봅니다.'],
        parent: '한 번에 다섯 개면 충분합니다. 더 하고 싶어 해도 내일로 미루세요 — 아쉬울 때 끝내는 게 좋습니다.',
        video: V.pet },
      { kind: 2, title: '동물 소리 놀이', min: '15분',
        words: ['dog', 'cat', 'rabbit', 'bird', 'fish'],
        steps: ['게임 <b>동물</b> 주제로 두 판 합니다.',
          '소리 알아맞히기 — 부모가 동물 소리를 내면 아이가 영어로 말합니다. 멍멍 → dog!',
          '거꾸로도 해 봅니다. 아이가 소리를 내고 부모가 맞힙니다.'],
        parent: '부모가 일부러 틀려 주세요. 아이가 고쳐 주는 경험이 제일 잘 남습니다.' },
      { kind: 3, title: '우리 동네 동물 찾기', min: '10분',
        words: ['dog', 'cat', 'bird'],
        steps: ['산책하며 강아지·고양이·새를 찾습니다. 보이면 영어로 말합니다.',
          '못 찾으면 창밖으로 봐도 됩니다.',
          '집에 와서 오늘 본 것을 놀이터에서 다시 들어 봅니다.'],
        parent: '밖에서 영어를 쓰는 경험이 교실보다 오래갑니다. 한 마리만 찾아도 성공입니다.' },
    ],
  },
  {
    no: 3, label: '10월 2째주', range: '10/5~10/11',
    theme: '농장에 사는 동물들',
    days: [
      { kind: 1, title: '농장 친구들', min: '10분',
        words: ['pig', 'cow', 'duck', 'horse', 'sheep'],
        steps: ['놀이터 <b>동물</b> 칸에서 다섯 개를 듣습니다.',
          'Old MacDonald 노래를 봅니다. 나오는 동물을 손가락으로 짚어 봅니다.',
          '노래에 나온 동물을 놀이터에서 다시 눌러 봅니다.'],
        parent: '노래가 먼저, 낱말이 나중이어도 됩니다. 아이가 신나면 순서는 상관없습니다.',
        video: V.farm },
      { kind: 2, title: '농장 흉내내기', min: '15분',
        words: ['pig', 'cow', 'duck', 'horse', 'sheep'],
        steps: ['게임 <b>동물</b> 주제로 두 판.',
          '방 안을 농장으로 만들어 봅니다. 부모가 영어로 부르면 그 동물이 되어 움직입니다.',
          'sheep 과 ship 을 놀이터 <b>헷갈리는 짝</b>에서 들어 봅니다. 양과 배, 소리가 닮았죠.'],
        parent: '몸을 쓰면 낱말이 몸에 붙습니다. 같이 네발로 기어 주세요.' },
      { kind: 3, title: '그림책에서 찾기', min: '10분',
        words: ['pig', 'cow', 'duck', 'horse', 'sheep', 'dog', 'cat'],
        steps: ['그림책이나 동물 사진에서 이번 주 동물을 찾습니다.',
          '찾은 동물을 영어로 말하고 놀이터에서 확인합니다.',
          '게임 한 판으로 마무리.'],
        parent: '책장에 있는 아무 그림책이면 됩니다. 영어책일 필요 없습니다.' },
    ],
  },
  {
    no: 4, label: '10월 3째주', range: '10/12~10/18',
    theme: '동물원에 가면 · 정글 동물',
    days: [
      { kind: 1, title: '동물원 동물들', min: '10분',
        words: ['monkey', 'bear', 'giraffe', 'zebra', 'panda'],
        steps: ['놀이터 <b>동물</b> 칸에서 다섯 개를 듣습니다.',
          'Walking In The Jungle 노래를 보며 같이 걷습니다.',
          '가장 마음에 드는 동물 하나를 골라 열 번 말해 봅니다.'],
        parent: '아이가 고른 동물을 그날의 주인공으로 삼으세요. 고른 것은 더 잘 남습니다.',
        video: V.jungle },
      { kind: 2, title: '누가 누구게?', min: '15분',
        words: ['monkey', 'bear', 'giraffe', 'zebra', 'panda', 'tiger', 'lion'],
        steps: ['게임 <b>동물</b> 주제로 두 판.',
          '스무고개 — 부모가 영어 동물 하나를 생각하고 아이가 흉내로 맞힙니다.',
          'bear 와 pear 를 <b>헷갈리는 짝</b>에서 들어 봅니다. 곰과 배(과일)입니다.'],
        parent: '맞히는 게 목적이 아닙니다. 소리를 여러 번 듣는 게 목적입니다.' },
      { kind: 3, title: '동물원 가는 날', min: '15분',
        words: ['monkey', 'bear', 'giraffe', 'zebra', 'panda', 'elephant', 'tiger', 'lion'],
        steps: ['동물원에 가면 제일 좋습니다. 못 가면 동물원 영상이나 사진으로 합니다.',
          '보이는 동물을 영어로 말해 봅니다.',
          '집에 와서 본 동물을 놀이터에서 전부 눌러 봅니다.'],
        parent: '이번 주말에 동물원 나들이를 잡아 보세요. 이 프로그램에서 가장 크게 남을 하루가 될 수 있습니다.' },
    ],
  },
  {
    no: 5, label: '10월 4째주', range: '10/19~10/25', review: true,
    theme: '🎉 복습 주간 — 새 낱말 없이 놀기만',
    days: [
      { kind: 2, title: '동물 총출동', min: '15분',
        steps: ['게임 <b>동물</b> 주제로 세 판. 동물원을 얼마나 채웠는지 봅니다.',
          '놀이터 동물 칸에서 별이 없는 낱말만 찾아 눌러 봅니다.',
          '가장 좋아하는 동물 다섯 개를 골라 말해 봅니다.'],
        parent: '오늘은 새로 가르치지 마세요. 아는 것을 다시 만나는 것도 공부입니다.' },
      { kind: 2, title: '헷갈리는 짝 정복', min: '15분',
        words: ['tiger', 'lion', 'bear', 'pear', 'sheep', 'ship'],
        steps: ['게임 <b>헷갈리는 짝</b> 주제로 두 판.',
          '틀린 짝만 놀이터에서 번갈아 들어 봅니다.',
          '부모가 하나를 말하면 아이가 가리키는 놀이.'],
        parent: '9월에 헷갈리던 tiger/lion 이 어떻게 됐는지 보세요. 여기가 이 프로그램의 첫 확인 지점입니다.' },
      { kind: 3, title: '동물 그리기', min: '15분',
        steps: ['좋아하는 동물 세 마리를 그립니다.',
          '그림 옆에 영어 이름을 씁니다. 철자가 틀려도 그냥 둡니다.',
          '그린 것을 들고 영어로 소개합니다. "This is a tiger."'],
        parent: '철자를 고치지 마세요. 지금은 쓰기를 배우는 때가 아니라 영어가 즐거운 때입니다.' },
    ],
  },
  {
    no: 6, label: '10월 5째주', range: '10/26~11/1',
    theme: '먹을 것 — 매일 쓰는 영어',
    days: [
      { kind: 1, title: '과일 이름', min: '10분',
        words: ['apple', 'banana', 'grape', 'pear', 'carrot'],
        steps: ['놀이터 <b>먹을 것</b> 칸에서 다섯 개를 듣습니다.',
          'Fruit Song 을 봅니다.',
          '집에 있는 과일을 하나 가져와 영어로 말해 봅니다.'],
        parent: '진짜 과일을 손에 쥐고 말하게 해 주세요. 그림보다 훨씬 잘 붙습니다.',
        video: V.fruit },
      { kind: 2, title: '좋아해? 싫어해?', min: '15분',
        words: ['apple', 'banana', 'grape', 'pear', 'carrot'],
        steps: ['Do You Like Broccoli Ice Cream? 을 보며 웃습니다.',
          '게임 <b>먹을 것</b> 주제로 두 판.',
          '"Do you like apple?" 하고 물으면 Yes/No 로 답하는 놀이.'],
        parent: '이 노래는 말도 안 되는 조합이 나와서 아이들이 아주 좋아합니다. 같이 웃어 주세요.',
        video: V.broccoli },
      { kind: 3, title: '밥상 영어', min: '10분',
        words: ['milk', 'bread', 'water', 'egg', 'rice'],
        steps: ['식사 시간에 밥상 위의 것을 영어로 말해 봅니다.',
          '놀이터 <b>먹을 것</b> 칸에서 오늘 먹은 것을 찾아 눌러 봅니다.',
          '내일 먹고 싶은 것을 영어로 말해 봅니다.'],
        parent: '따로 시간을 내지 말고 밥 먹으면서 하세요. 일상에 섞이는 게 가장 좋습니다.' },
    ],
  },
  /* ═══ 11월 — 색깔·학교·가족. 아이 주변으로 범위를 넓힌다 ═══ */
  {
    no: 7, label: '11월 1째주', range: '11/2~11/8',
    theme: '색깔 — 온 세상이 교재가 된다',
    days: [
      { kind: 1, title: '무지개 색깔', min: '10분',
        words: ['red', 'blue', 'yellow', 'green', 'orange'],
        steps: ['놀이터 <b>색깔</b> 칸에서 다섯 개를 듣습니다.',
          'Rainbow Colors Song 을 봅니다.',
          '입고 있는 옷에서 아는 색을 찾아 말해 봅니다.'],
        parent: '색깔은 어디에나 있어서 하루 종일 연습할 수 있습니다. 오늘 하루는 색만 영어로 불러 보세요.',
        video: V.rainbow },
      { kind: 2, title: '색깔 찾아 달리기', min: '15분',
        words: ['red', 'blue', 'yellow', 'green', 'orange', 'black', 'white'],
        steps: ['놀이터에서 남은 색깔도 듣습니다.',
          '"Find something red!" 하면 빨간 물건을 찾아 뛰어옵니다. 색을 바꿔 가며 합니다.',
          '게임 <b>색깔</b> 주제로 한 판.'],
        parent: '몸을 쓰는 놀이입니다. 거실을 좀 어지럽혀도 오늘은 봐주세요.' },
      { kind: 3, title: '색칠하며 말하기', min: '15분',
        words: ['red', 'blue', 'yellow', 'green', 'purple', 'pink', 'brown'],
        steps: ['그림을 색칠합니다.',
          '색연필을 집을 때마다 그 색을 영어로 말합니다.',
          '다 그리면 어떤 색을 썼는지 영어로 세어 봅니다.'],
        parent: '"무슨 색 줄까?" 하고 영어로 물어 주세요. 대답하려면 영어를 써야 하는 상황을 만드는 게 요령입니다.' },
    ],
  },
  {
    no: 8, label: '11월 2째주', range: '11/9~11/15',
    theme: '우리 가족',
    days: [
      { kind: 1, title: '엄마 아빠', min: '10분',
        words: ['mom', 'dad', 'sister', 'brother', 'family'],
        steps: ['놀이터 <b>가족</b> 칸에서 다섯 개를 듣습니다.',
          'Family Members Song 을 봅니다.',
          '가족 사진을 보며 한 사람씩 영어로 불러 봅니다.'],
        parent: '아이에게 가장 가까운 낱말입니다. 사진을 꼭 꺼내 주세요.',
        video: V.family },
      { kind: 2, title: '가족 소개하기', min: '15분',
        words: ['mom', 'dad', 'baby', 'grandma', 'grandpa', 'family'],
        steps: ['놀이터에서 할머니·할아버지도 듣습니다.',
          '"This is my mom." 하고 손으로 가리키며 소개하는 놀이.',
          '게임 <b>가족</b> 주제로 한 판.'],
        parent: '문장이 나왔습니다. 외우게 하지 말고 따라 하게만 하세요. 틀려도 넘어갑니다.' },
      { kind: 3, title: '가족 그림 그리기', min: '15분',
        steps: ['가족을 그립니다.',
          '각 사람 옆에 영어를 씁니다.',
          '완성한 그림을 가족에게 영어로 소개합니다.'],
        parent: '그림을 냉장고에 붙여 주세요. 매일 보면서 저절로 복습됩니다.' },
    ],
  },
  {
    no: 9, label: '11월 3째주', range: '11/16~11/22', review: true,
    theme: '🎉 복습 주간 — 지금까지의 절반 지점',
    days: [
      { kind: 2, title: '전체 게임 대회', min: '15분',
        steps: ['게임에서 동물·먹을 것·색깔·가족을 한 판씩 합니다.',
          '가장 점수가 높았던 주제를 한 번 더 합니다.',
          '동물원이 얼마나 찼는지 봅니다.'],
        parent: '점수를 비교하지 마세요. "지난번보다 잘했네"만 말해 주세요.' },
      { kind: 2, title: '섞어서 맞히기', min: '15분',
        steps: ['놀이터에서 별이 안 붙은 낱말만 골라 듣습니다.',
          '부모가 무작위로 영어를 말하면 아이가 한국어로 답합니다.',
          '거꾸로도 해 봅니다.'],
        parent: '여기까지 절반입니다. 아이가 아는 낱말 수를 같이 세어 보세요. 눈에 보이는 성과가 필요한 시점입니다.' },
      { kind: 3, title: '영어로 하루 보내기', min: '하루',
        steps: ['하루 동안 아는 낱말은 영어로 말해 봅니다.',
          '밥 먹을 때, 옷 입을 때, 밖에 나갈 때.',
          '몇 번이나 영어를 썼는지 세어 봅니다.'],
        parent: '가족 전체가 같이 하면 훨씬 재미있습니다. 부모가 먼저 쓰세요.' },
    ],
  },
  {
    no: 10, label: '11월 4째주', range: '11/23~11/29',
    theme: '학교에서 쓰는 말',
    days: [
      { kind: 1, title: '내 가방 속', min: '10분',
        words: ['book', 'pencil', 'bag', 'crayon', 'scissors'],
        steps: ['놀이터 <b>학교</b> 칸에서 다섯 개를 듣습니다.',
          '진짜 가방을 열고 하나씩 꺼내며 영어로 말해 봅니다.',
          '게임 <b>학교</b> 주제로 한 판.'],
        parent: '실제 물건을 꺼내게 하세요. 그림보다 훨씬 잘 붙습니다.' },
      { kind: 2, title: '학교 놀이', min: '15분',
        words: ['teacher', 'student', 'school', 'friend', 'desk'],
        steps: ['놀이터에서 나머지도 듣습니다.',
          '선생님 놀이 — 아이가 teacher, 부모가 student 가 됩니다. 역할을 바꿔서도.',
          'cat 과 hat 을 <b>헷갈리는 짝</b>에서 들어 봅니다.'],
        parent: '아이를 선생님으로 세워 주세요. 가르치는 쪽이 제일 많이 배웁니다.' },
      { kind: 3, title: '가방 속 보물찾기', min: '10분',
        words: ['book', 'pencil', 'bag', 'crayon', 'scissors', 'desk'],
        steps: ['부모가 영어로 말하면 아이가 가방에서 꺼냅니다.',
          '시간을 재며 해 봅니다.',
          '게임 <b>학교</b> 주제로 한 판 더.'],
        parent: '시간을 재면 갑자기 신납니다. 일부러 좀 봐주세요.' },
    ],
  },
  /* ═══ 12월 — 숫자·몸, 그리고 크리스마스 ═══ */
  {
    no: 11, label: '12월 1째주', range: '11/30~12/6',
    theme: '숫자 세기',
    days: [
      { kind: 1, title: '하나 둘 셋', min: '10분',
        words: ['one', 'two', 'three', 'four', 'five'],
        steps: ['놀이터 <b>숫자</b> 칸에서 1~5 를 듣습니다.',
          '손가락을 펴며 같이 세어 봅니다.',
          'Number Song 1-20 을 봅니다.'],
        parent: '손가락을 꼭 쓰게 하세요. 몸으로 세는 것과 입으로 세는 것이 같이 가야 합니다.',
        video: V.numbers },
      { kind: 2, title: '열까지 세기', min: '15분',
        words: ['six', 'seven', 'eight', 'nine', 'ten'],
        steps: ['놀이터에서 6~10 을 듣습니다.',
          '계단을 오르며 세기, 사탕을 세기, 장난감을 세기.',
          '게임 <b>숫자</b> 주제로 한 판.'],
        parent: '집 안의 아무거나 세면 됩니다. 하루에 열 번쯤 세어 보세요.' },
      { kind: 3, title: '숫자 찾기 놀이', min: '10분',
        words: ['one', 'three', 'tree', 'five', 'ten'],
        steps: ['밖에서 숫자를 찾습니다. 엘리베이터, 자동차 번호판, 가게 간판.',
          '찾으면 영어로 읽습니다.',
          'three 와 tree 를 <b>헷갈리는 짝</b>에서 들어 봅니다. 셋과 나무입니다.'],
        parent: '엘리베이터 버튼이 제일 좋습니다. 매일 타니까요.' },
    ],
  },
  {
    no: 12, label: '12월 2째주', range: '12/7~12/13',
    theme: '내 몸 · 노래로 익히기',
    days: [
      { kind: 1, title: '머리 어깨 무릎 발', min: '10분',
        words: ['head', 'hand', 'foot', 'eye', 'nose'],
        steps: ['놀이터 <b>몸</b> 칸에서 다섯 개를 듣습니다.',
          'Head Shoulders Knees & Toes 를 보며 같이 몸을 짚습니다.',
          '노래를 두 번 더 봅니다. 점점 빨라집니다.'],
        parent: '이 노래는 몸을 움직여서 아이들이 제일 좋아합니다. 같이 하세요. 숨차게.',
        video: V.head },
      { kind: 2, title: '얼굴 만들기', min: '15분',
        words: ['mouth', 'ear', 'hair', 'eye', 'nose', 'mouse'],
        steps: ['놀이터에서 나머지도 듣습니다.',
          '종이에 얼굴을 그리며 부위를 영어로 말합니다.',
          'mouse 와 mouth 를 <b>헷갈리는 짝</b>에서 들어 봅니다. 쥐와 입, 아주 닮았습니다.'],
        parent: 'mouse/mouth 는 어른도 헷갈립니다. 천천히 여러 번 들려주세요.',
        video: V.body },
      { kind: 3, title: '가리키기 시합', min: '10분',
        words: ['head', 'hand', 'foot', 'eye', 'nose', 'mouth', 'ear', 'hair'],
        steps: ['부모가 영어로 말하면 그 부위를 재빨리 짚습니다.',
          '점점 빠르게 합니다.',
          '역할을 바꿔서도 해 봅니다.'],
        parent: '일부러 틀리게 짚어 주세요. 아이가 웃으면서 고쳐 줍니다.' },
    ],
  },
  {
    no: 13, label: '12월 3째주', range: '12/14~12/20', review: true,
    theme: '🎉 복습 주간 — 겨울 노래와 함께',
    days: [
      { kind: 2, title: '겨울 노래', min: '15분',
        steps: ['Little Snowflake 를 봅니다.',
          '게임에서 아무 주제나 두 판.',
          '놀이터에서 별이 안 붙은 낱말을 찾아 눌러 봅니다.'],
        parent: '겨울 분위기를 내 주세요. 계절과 함께 기억되면 더 오래갑니다.',
        video: V.snow },
      { kind: 2, title: '헷갈리는 짝 마지막 점검', min: '15분',
        words: ['tiger', 'lion', 'cat', 'hat', 'bear', 'pear', 'sheep', 'ship', 'mouse', 'mouth', 'three', 'tree'],
        steps: ['게임 <b>헷갈리는 짝</b> 주제로 세 판.',
          '아직 헷갈리는 짝만 놀이터에서 반복해 듣습니다.',
          '부모가 말하면 아이가 가리키는 놀이.'],
        parent: '9월에 tiger/lion 을 헷갈렸던 걸 기억하시죠. 석 달 뒤의 결과를 보는 날입니다.' },
      { kind: 3, title: '내가 아는 영어 세어 보기', min: '15분',
        steps: ['놀이터의 일곱 주제를 하나씩 열어 봅니다.',
          '별이 붙은 낱말이 몇 개인지 세어 봅니다.',
          '아이가 좋아하는 낱말 열 개를 골라 말해 봅니다.'],
        parent: '숫자로 보여 주세요. "석 달 전에는 다섯 개였는데 지금은 몇 개야?"' },
    ],
  },
  {
    no: 14, label: '12월 4째주', range: '12/21~12/27',
    theme: '🎄 크리스마스 주간',
    days: [
      { kind: 1, title: '메리 크리스마스', min: '15분',
        steps: ['We Wish You A Merry Christmas 를 봅니다.',
          '같이 불러 봅니다. 가사를 몰라도 괜찮습니다.',
          '"Merry Christmas!" 를 가족에게 한 명씩 말해 봅니다.'],
        parent: '이번 주는 공부가 아닙니다. 영어가 즐거운 날의 배경음이 되게 하는 주입니다.',
        video: V.xmas },
      { kind: 2, title: '영어로 소원 빌기', min: '15분',
        words: ['book', 'candy', 'cake', 'dog', 'cat'],
        steps: ['산타에게 받고 싶은 것을 영어로 말해 봅니다. 놀이터에서 찾아 눌러 보면 됩니다.',
          '편지에 그림을 그리고 영어 낱말을 적습니다.',
          '게임 한 판.'],
        parent: '받고 싶은 게 낱말에 없으면 그냥 한국어로 두세요. 영어가 방해가 되면 안 됩니다.' },
      { kind: 3, title: '크리스마스 인사', min: '10분',
        steps: ['Merry Christmas from Super Simple! 을 봅니다.',
          '가족·친구에게 영어로 인사해 봅니다.',
          '오늘은 게임을 아이가 하고 싶은 만큼 합니다.'],
        parent: '오늘만은 시간 제한을 두지 마세요.',
        video: V.xmasMore },
    ],
  },
  {
    no: 15, label: '12월 5째주', range: '12/28~1/3',
    theme: '🏆 한 해 마무리 — 시상식',
    days: [
      { kind: 2, title: '올해의 영어왕', min: '15분',
        steps: ['게임에서 좋아하는 주제 세 개를 골라 한 판씩 합니다.',
          '동물원에 모인 동물을 전부 봅니다.',
          '가장 좋아하는 낱말 다섯 개를 뽑아 봅니다.'],
        parent: '상장을 만들어 주세요. 종이에 손으로 써도 좋습니다. 아이는 그걸 몇 년 기억합니다.' },
      { kind: 2, title: '엄마 아빠에게 가르치기', min: '15분',
        steps: ['아이가 선생님이 되어 부모에게 영어를 가르칩니다.',
          '부모는 일부러 틀리고 아이가 고쳐 줍니다.',
          '놀이터를 아이가 직접 넘겨 가며 설명합니다.'],
        parent: '가르치는 쪽이 제일 많이 배웁니다. 모르는 척해 주세요.' },
      { kind: 3, title: '내년에 배우고 싶은 것', min: '10분',
        steps: ['놀이터를 넘겨 보며 더 배우고 싶은 주제를 고릅니다.',
          '알고 싶은 영어 낱말을 말해 봅니다.',
          '마지막으로 좋아하는 노래 한 곡을 봅니다.'],
        parent: '아이가 말한 낱말을 적어 두세요. 다음 프로그램은 거기서 시작합니다.' },
    ],
  },
];

export const KIND = {
  1: { ko: '만나기', emoji: '👋', hint: '새 낱말을 듣고 따라 해요' },
  2: { ko: '놀이',   emoji: '🎮', hint: '게임과 몸놀이로 굳혀요' },
  3: { ko: '찾기',   emoji: '🔍', hint: '집·바깥에서 써먹어요' },
} as const;

export const totalSessions = weeks.length * 3;
export const totalWeeks = weeks.length;
