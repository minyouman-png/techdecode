/* ============================================================
   조스 오브 파이터즈 — 캐릭터 10명

   ★모두 새로 만든 캐릭터다. 옛 대전격투의 '역할 분담'(주인공형·힘형·스피드형·견제형)이라는
     장르 문법만 따랐고, 특정 게임의 캐릭터·이름·그림을 가져오지 않았다.
     열 명은 **직업**으로 구분된다 — 프로그래머·집배원·엔지니어·족구선수·축구선수·
     술 좋아하는 아저씨·안경 쓴 아저씨·부자·20대 미녀·여고생.
     기술 이름과 소품도 전부 그 직업에서 나온다(그게 이 게임의 농담이다).

   ★기술 프레임 표기 (60분의 1초 단위)
     startup  나가기까지 — 이 동안 맞으면 그대로 얻어맞는다
     active   판정이 살아 있는 구간
     recovery 끝나고 굳는 구간 — 길수록 헛쳤을 때 위험하다
     ⚠️anim.js 의 동작 길이와 합이 맞아야 한다(자가검증이 확인한다).

   ★판정 상자 box:[앞으로, 위로(음수), 너비, 높이] — 바라보는 쪽이 +x, 발밑이 0.
   ★커맨드 (텐키 방향) 2=아래 4=뒤 6=앞 8=위 / 236=↓↘→ 214=↓↙← 623=→↓↘
     P=주먹(약손·강손) K=발(약발·강발)
   ============================================================ */
(function () {
'use strict';

/* 보통기는 열 명이 같은 뼈대를 쓰고 리치·위력만 다르다.
   ⚠️보통기까지 전부 다르게 만들면 열 명이 아니라 열 개의 게임이 되고, 균형을 잡을 수 없다. */
function normals(mul) {
  mul = mul || {};
  var r = mul.reach || 0, d = mul.dmg || 1;
  return {
    lp: { anim: 'lp', startup: 3, active: 3, recovery: 5, dmg: Math.round(26 * d), hit: 11, block: 7, kb: 2.2, box: [34 + r, -88, 34, 17], type: 'mid', name: '약손' },
    hp: { anim: 'hp', startup: 6, active: 4, recovery: 9, dmg: Math.round(62 * d), hit: 17, block: 10, kb: 5.0, box: [38 + r, -86, 46, 21], type: 'mid', name: '강손' },
    lk: { anim: 'lk', startup: 3, active: 3, recovery: 6, dmg: Math.round(30 * d), hit: 12, block: 7, kb: 2.6, box: [38 + r, -62, 40, 17], type: 'mid', name: '약발' },
    hk: { anim: 'hk', startup: 7, active: 5, recovery: 12, dmg: Math.round(72 * d), hit: 19, block: 11, kb: 6.4, box: [42 + r, -88, 52, 23], type: 'mid', name: '강발' },
    clp: { anim: 'clp', startup: 3, active: 3, recovery: 5, dmg: Math.round(24 * d), hit: 10, block: 6, kb: 1.8, box: [32 + r, -64, 32, 15], type: 'mid', name: '앉아 약손' },
    clk: { anim: 'clk', startup: 4, active: 4, recovery: 7, dmg: Math.round(28 * d), hit: 11, block: 7, kb: 2.2, box: [36 + r, -26, 42, 15], type: 'low', name: '앉아 약발 · 하단' },
    chk: { anim: 'chk', startup: 6, active: 5, recovery: 13, dmg: Math.round(66 * d), hit: 0, block: 12, kb: 6.0, box: [38 + r, -20, 56, 16], type: 'low', knockdown: true, name: '앉아 강발 · 다리 후리기' },
    jp: { anim: 'jp', startup: 4, active: 10, recovery: 0, dmg: Math.round(46 * d), hit: 15, block: 9, kb: 3.4, box: [28 + r, -72, 36, 22], type: 'high', air: true, name: '점프 손' },
    jk: { anim: 'jk', startup: 4, active: 12, recovery: 0, dmg: Math.round(52 * d), hit: 16, block: 10, kb: 3.8, box: [32 + r, -54, 42, 24], type: 'high', air: true, name: '점프 발' },
  };
}

function proj(o) {
  return {
    speed: o.speed || 7, dmg: o.dmg || 70, hit: 18, block: 10, kb: o.kb || 5,
    w: o.w || 34, h: o.h || 26, y: o.y === undefined ? -74 : o.y,
    color: o.color, shape: o.shape || 'ball', life: o.life || 150, hits: o.hits || 1,
  };
}

var C = [
  /* ---------------------------------------------------------- 1. 민유 — 프로그래머 */
  {
    key: 'minyu', name: '민유', job: '프로그래머', tag: '분당 20년차',
    desc: '장풍·대공·돌진을 고루 갖춘 주인공형. 처음 잡기에 가장 좋다.',
    hp: 1000, walk: 2.5, dash: 6.2, jump: 13.6, weight: 1, scale: 1,
    cry: '이번엔 진짜 됩니다.',
    story: '분당에서만 20년을 개발했다. 회사는 여섯 번 바뀌었는데 자리는 같은 층이었다. 남들이 배운 건 프레임워크였고 그가 배운 건 **끝까지 돌아가게 만드는 법**이다. 새벽 세 시에 배포를 눌러 본 사람만 아는 손버릇이 기술이 됐다. 두 딸이 있고, 둘 다 아버지 말을 안 듣는다.',
    bond: '유진·유정의 아버지 · 조스클럽 회원',
    col: { skin: '#f0c9a4', skinDark: '#d8ab86', hair: '#20222e', top: '#2f6ad0', sleeve: '#2f6ad0', sleeveDark: '#25529f',
           pants: '#1d2333', pantsDark: '#161b28', shoe: '#e8eef8', shoeDark: '#b9c2d0', beltCol: '#e8c766' },
    hairDraw: 'hood', prop: 'laptop',
    normals: normals(),
    specials: [
      { key: 'fireball', name: '컴파일 에러', cmd: '236P', anim: 'fire', startup: 8, active: 6, recovery: 14,
        meter: 6, proj: proj({ color: '#4aa8ff', dmg: 72, speed: 7.2, shape: 'code' }),
        note: '빨간 에러 로그를 앞으로 쏟아 낸다. 거리를 벌리고 상대를 움직이게 만든다.' },
      { key: 'upper', name: '스택 오버플로', cmd: '623P', anim: 'upper', startup: 4, active: 8, recovery: 18,
        meter: 8, dmg: 96, hit: 22, kb: 6, launch: -9, box: [22, -120, 44, 82], invuln: [0, 6],
        note: '끝없이 쌓이며 솟구친다. 뛰어드는 상대를 떨어뜨리는 대공기 — 처음 6프레임 무적.' },
      { key: 'spin', name: '무한 루프', cmd: '214K', anim: 'spin', startup: 5, active: 8, recovery: 12,
        meter: 6, dmg: 78, hit: 18, kb: 7, move: 5.2, box: [26, -92, 52, 62],
        note: '돌면서 앞으로 파고든다. 장풍을 넘어 들어갈 때 쓴다.' },
    ],
    super: { key: 'super', name: '금요일 밤 배포', cmd: '236236P', anim: 'super', startup: 14, active: 8, recovery: 26,
      proj: proj({ color: '#7cc4ff', dmg: 60, speed: 6.0, w: 70, h: 62, y: -80, hits: 4, kb: 9, shape: 'code' }),
      note: '되돌릴 수 없는 것을 앞으로 밀어낸다. 네 번 맞는다.' },
  },

  /* ---------------------------------------------------------- 2. 종범 — 집배원 */
  {
    key: 'jongbeom', name: '종범', job: '우체국 공무원', tag: '오늘도 정시 배달',
    desc: '무거운 소포로 밀어붙이는 힘형. 느리지만 한 번 붙으면 크게 가져간다.',
    hp: 1100, walk: 2.0, dash: 5.2, jump: 12.4, weight: 1.25, scale: 1.1,
    cry: '등기 왔습니다!',
    story: '18년째 같은 구역을 돈다. 골목 개 이름과 어느 집 초인종이 고장 났는지까지 안다. 규정을 어긴 적이 한 번도 없고, 그래서 **정시**라는 말을 몸으로 지킨다. 무거운 걸 하루 300개씩 드는 사람과 붙어 본 적 있는가. 정년까지 12년 남았다는 말을 자랑처럼 한다.',
    bond: '조스클럽 회원 · 조스의 소포를 제일 많이 나른다',
    col: { skin: '#e8b58c', skinDark: '#cf9b74', hair: '#2b1d16', top: '#c8262e', sleeve: '#c8262e', sleeveDark: '#9e1c23',
           pants: '#2b3242', pantsDark: '#212736', shoe: '#3a2b1e', shoeDark: '#291e15', beltCol: '#1b2230' },
    hairDraw: 'cap', prop: 'parcel',
    normals: normals({ dmg: 1.12, reach: 2 }),
    specials: [
      { key: 'tackle', name: '총알 배송', cmd: '236K', anim: 'dash', startup: 6, active: 10, recovery: 14,
        meter: 7, dmg: 88, hit: 20, kb: 7, move: 9.5, box: [18, -96, 56, 74], armor: true,
        note: '소포를 안고 그대로 돌진한다. 나가는 동안 한 대는 버틴다(슈퍼아머).' },
      { key: 'upper', name: '등기 어퍼', cmd: '623P', anim: 'upper', startup: 5, active: 7, recovery: 20,
        meter: 8, dmg: 104, hit: 22, kb: 6, launch: -8.5, box: [24, -118, 46, 78], invuln: [0, 5],
        note: '소포째로 퍼올린다. "여기 서명해 주세요."' },
      { key: 'grab', name: '착불 들배지기', cmd: '214P', anim: 'dash', startup: 4, active: 4, recovery: 24,
        meter: 10, dmg: 130, hit: 30, kb: 9, launch: -6, box: [16, -100, 44, 84], grab: true,
        note: '붙어서만 나가는 잡기. 막을 수 없다 — 대신 헛치면 크게 굳는다.' },
    ],
    super: { key: 'super', name: '전국 일괄 배송', cmd: '236236K', anim: 'dash', startup: 12, active: 16, recovery: 26,
      dmg: 210, hit: 30, kb: 11, move: 12.5, box: [16, -104, 66, 86], armor: true, invuln: [0, 10],
      note: '무적으로 뛰어들어 상대를 벽까지 밀고 간다.' },
  },

  /* ---------------------------------------------------------- 3. 인우 — 컴퓨터 엔지니어 */
  {
    key: 'inwoo', name: '인우', job: '컴퓨터 엔지니어', tag: '밤에 세 번 깬다',
    desc: '짧은 기술을 이어 붙여 몰아치는 속도형. 손이 빠른 사람에게 맞는다.',
    hp: 950, walk: 3.0, dash: 7.0, jump: 14.2, weight: 0.9, scale: 0.98,
    cry: '원인은 늘 전원입니다.',
    story: '서버는 열두 대를 혼자 돌보는데 집에서는 두 살짜리 하나를 못 이긴다. 요즘 그의 하루는 새벽 두 시·네 시·여섯 시로 나뉜다. 잠이 모자란 사람 특유의 **짧고 빠른 손**이 그대로 기술이 됐다 — 길게 갈 체력이 없어서다. 분유 타는 속도가 팀에서 제일 빠르다.',
    bond: '조스클럽 회원 · 민유와 같은 건물에서 일한다',
    col: { skin: '#f2cba6', skinDark: '#d9ac88', hair: '#141821', top: '#3f8f6a', sleeve: '#3f8f6a', sleeveDark: '#317355',
           pants: '#3a4150', pantsDark: '#2c313d', shoe: '#f4f6fa', shoeDark: '#c3c9d4', beltCol: '#d8b24a' },
    hairDraw: 'short', prop: 'driver',
    normals: normals({ dmg: 0.92, reach: 3 }),
    specials: [
      { key: 'knee', name: '연속 케이블 타격', cmd: '236K', anim: 'dash', startup: 5, active: 12, recovery: 12,
        meter: 6, dmg: 30, hit: 12, kb: 2.5, move: 7.5, box: [20, -86, 48, 56], multi: 3,
        note: '랜선을 휘두르며 세 번 파고든다.' },
      { key: 'upper', name: '쿨링팬 상승', cmd: '623K', anim: 'upper', startup: 4, active: 8, recovery: 17,
        meter: 8, dmg: 92, hit: 21, kb: 6, launch: -9.5, box: [20, -122, 42, 84], invuln: [0, 6],
        note: '돌아가며 솟는 대공기. 뛰어드는 상대를 걷어 낸다.' },
      { key: 'slide', name: '책상 밑 슬라이딩', cmd: '214K', anim: 'chk', startup: 5, active: 9, recovery: 16,
        meter: 5, dmg: 62, hit: 0, kb: 6, move: 10, box: [24, -22, 62, 18], type: 'low', knockdown: true, lowProfile: true,
        note: '낮게 미끄러져 들어간다. 장풍 밑으로 빠져나간다.' },
    ],
    super: { key: 'super', name: '블루스크린', cmd: '236236K', anim: 'spin', startup: 10, active: 24, recovery: 24,
      dmg: 26, hit: 10, kb: 2, move: 6.5, box: [20, -96, 56, 76], multi: 9, invuln: [0, 8],
      note: '아홉 번 몰아친다. 상대는 아무것도 못 한 채 화면이 파래진다.' },
  },

  /* ---------------------------------------------------------- 4. 노덕 — 족구선수 */
  {
    key: 'nodeok', name: '노덕', job: '족구 선수', tag: '족구에 미친 사람',
    desc: '공을 띄우고 내리꽂는 발 기술 중심. 자기 이름을 내건 코트에서 특히 강하다.',
    hp: 980, walk: 2.4, dash: 6.0, jump: 14.0, weight: 1, scale: 1.03,
    cry: '내 코트에 온 걸 환영한다.',
    story: '회사 점심시간에 시작한 족구가 인생을 먹었다. 지금은 코트 옆에 컨테이너를 놓고 산다. 휴가는 전부 전국 대회 일정에 맞춰 쓰고, 결혼기념일도 그렇게 잊었다. "공이 땅에 닿기 전에 끝내면 된다"가 그의 유일한 전술이다. 궁전이라 불리는 그 코트는 사실 그가 직접 깔았다.',
    bond: '조스클럽 회원 · 코트 공사비는 조스가 냈다',
    col: { skin: '#efc79f', skinDark: '#d5aa81', hair: '#241a12', top: '#f0c344', sleeve: '#f0c344', sleeveDark: '#c99f2f',
           pants: '#1f2a44', pantsDark: '#172034', shoe: '#f2f2ee', shoeDark: '#cfcfc9', beltCol: '#1f2a44' },
    hairDraw: 'headband', prop: 'jokgu',
    normals: normals({ reach: 3 }),
    specials: [
      { key: 'spike', name: '족구 스파이크', cmd: '236P', anim: 'fire', startup: 9, active: 6, recovery: 15,
        meter: 6, proj: proj({ color: '#f0c344', dmg: 66, speed: 6.6, shape: 'ballspin', w: 34, h: 34 }),
        note: '공을 앞으로 내리꽂는다. 상대의 전진을 끊는 기술.' },
      { key: 'upper', name: '오버헤드 킥', cmd: '623K', anim: 'upper', startup: 5, active: 7, recovery: 19,
        meter: 8, dmg: 92, hit: 21, kb: 6, launch: -8.8, box: [24, -120, 44, 80], invuln: [0, 5],
        note: '몸을 뒤집으며 차올린다. 대공기.' },
      { key: 'robe', name: '네트 넘기기', cmd: '214K', anim: 'spin', startup: 6, active: 8, recovery: 14,
        meter: 6, dmg: 76, hit: 17, kb: 7.5, move: 4.8, box: [24, -94, 54, 66],
        note: '몸을 돌려 앞을 쓸어 낸다. 파고들 때 쓴다.' },
    ],
    super: { key: 'super', name: '폭풍 스파이크', cmd: '236236P', anim: 'super', startup: 14, active: 8, recovery: 26,
      proj: proj({ color: '#ffd75e', dmg: 55, speed: 5.6, w: 74, h: 66, y: -84, hits: 5, shape: 'ballspin', kb: 9 }),
      note: '공 다섯 개를 연달아 내리꽂는다.' },
  },

  /* ---------------------------------------------------------- 5. 길수 — 축구선수 */
  {
    key: 'gilsu', name: '길수', job: '조기축구회', tag: '피파는 늘 진다',
    desc: '슛과 태클로 거리를 자유롭게 오간다. 균형이 잘 잡힌 중거리형.',
    hp: 1000, walk: 2.7, dash: 6.6, jump: 14.0, weight: 0.98, scale: 1.0,
    cry: '실전은 다르다니까.',
    story: '일요일 새벽 여섯 시, 이슬 맺힌 잔디에서 스무 해를 뛰었다. 왼발 하나는 진짜다. 그런데 게임기 앞에만 앉으면 조카한테도 5대 0으로 진다 — 손가락이 발을 못 따라간다. "실전은 다르다"는 말을 그날 저녁 내내 한다. 실제로 다르긴 하다. 그라운드에서는 아무도 그를 못 막는다.',
    bond: '조스클럽 회원 · 조기축구회 회비는 조스가 낸다',
    col: { skin: '#eec49c', skinDark: '#d4a67e', hair: '#1b1b22', top: '#e23c3c', sleeve: '#e23c3c', sleeveDark: '#b62e2e',
           pants: '#f2f2ee', pantsDark: '#d5d5cf', shoe: '#22c07a', shoeDark: '#189060', beltCol: '#ffffff' },
    hairDraw: 'short', prop: 'soccer',
    normals: normals({ dmg: 1.0, reach: 2 }),
    specials: [
      { key: 'shot', name: '강슛', cmd: '236P', anim: 'fire', startup: 9, active: 5, recovery: 15,
        meter: 6, proj: proj({ color: '#f4f6fa', dmg: 68, speed: 8.2, shape: 'soccer', w: 30, h: 30, y: -60 }),
        note: '낮게 깔리는 강슛. 서 있는 상대의 발밑을 노린다.' },
      { key: 'upper', name: '바이시클 킥', cmd: '623K', anim: 'upper', startup: 4, active: 7, recovery: 19,
        meter: 8, dmg: 98, hit: 22, kb: 6.4, launch: -9.2, box: [22, -120, 44, 82], invuln: [0, 5],
        note: '거꾸로 솟구치며 찬다. 대공기.' },
      { key: 'slide', name: '슬라이딩 태클', cmd: '214K', anim: 'chk', startup: 6, active: 9, recovery: 17,
        meter: 6, dmg: 70, hit: 0, kb: 6.5, move: 9.5, box: [24, -22, 64, 18], type: 'low', knockdown: true, lowProfile: true,
        note: '길게 미끄러져 발밑을 걷어 낸다. 넘어뜨린다 — 다만 헛치면 크게 굳는다.' },
    ],
    super: { key: 'super', name: '페널티킥 난사', cmd: '236236P', anim: 'super', startup: 12, active: 10, recovery: 28,
      proj: proj({ color: '#ffffff', dmg: 48, speed: 7.4, w: 44, h: 44, y: -70, hits: 5, shape: 'soccer', kb: 9 }),
      note: '공을 다섯 개 연달아 찬다.' },
  },

  /* ---------------------------------------------------------- 6. 동식 — 술 좋아하는 아저씨 */
  {
    key: 'dongsik', name: '동식', job: '전업 투자자', tag: '다음 주엔 리스본',
    desc: '가장 단단하고 가장 아프다. 대신 느리고, 어디로 움직일지 본인도 모른다.',
    hp: 1180, walk: 1.9, dash: 5.0, jump: 11.8, weight: 1.4, scale: 1.14,
    cry: '한 잔 하고 가.',
    story: '2008년에 산 주식을 15년 들고 있었다. 그게 전부다. 지금은 일 년의 절반을 밖에서 보낸다 — 포르투에서 포트와인, 뮌헨에서 맥주, 제주에서 소주. 취한 사람은 예측이 안 된다. 어디서 어떤 팔이 날아올지 **본인도 모른다**. 그래서 이 판에서 제일 상대하기 싫은 사람이다.',
    bond: '조스클럽 회원 · 유일하게 조스 돈을 안 받는 사람',
    col: { skin: '#e8b48a', skinDark: '#cd9769', hair: '#2a2018', top: '#7a8ea0', sleeve: '#7a8ea0', sleeveDark: '#63747f',
           pants: '#3a3f4a', pantsDark: '#2c3038', shoe: '#5a4326', shoeDark: '#3f2e1a', beltCol: '#4a3526' },
    hairDraw: 'thin', prop: 'bottle', belly: true,
    normals: normals({ dmg: 1.22, reach: 4 }),
    specials: [
      { key: 'headbutt', name: '취권 박치기', cmd: '236P', anim: 'dash', startup: 8, active: 10, recovery: 18,
        meter: 7, dmg: 102, hit: 22, kb: 8, move: 7.6, box: [18, -100, 58, 74], armor: true,
        note: '비틀거리며 머리부터 들어간다. 한 대는 버틴다.' },
      // ⚠️처음엔 여기에 '바닥 내려치기'(하단)를 두었더니 **동식에게만 무적 대공기가 없었다**.
      //   뛰어드는 상대를 떨어뜨릴 방법이 없는 캐릭터는 그 자체로 고장이다(자가검증이 잡아냈다).
      { key: 'upper', name: '술병 어퍼', cmd: '623P', anim: 'upper', startup: 6, active: 7, recovery: 21,
        meter: 8, dmg: 108, hit: 22, kb: 6.6, launch: -8.2, box: [24, -118, 48, 80], invuln: [0, 5],
        note: '술병째로 퍼올린다. 뛰어드는 상대를 떨어뜨리는 대공기 — 처음 5프레임 무적.' },
      { key: 'lariat', name: '회전 팔 휘두르기', cmd: '214P', anim: 'spin', startup: 6, active: 12, recovery: 16,
        meter: 6, dmg: 34, hit: 12, kb: 3, box: [-30, -96, 110, 60], multi: 3,
        note: '팔을 벌리고 돈다. 앞뒤가 다 판정이라 등 뒤로 돌아 들어와도 맞는다.' },
    ],
    super: { key: 'super', name: '2차 가자', cmd: '236236P', anim: 'super', startup: 16, active: 10, recovery: 30,
      dmg: 205, hit: 0, kb: 10, box: [4, -26, 190, 26], type: 'low', knockdown: true, shake: 26, armor: true,
      note: '바닥을 통째로 뒤흔든다. 화면 절반이 판정이다.' },
  },

  /* ---------------------------------------------------------- 7. 준원 — 안경 쓴 아저씨 */
  {
    key: 'junwon', name: '준원', job: '발명가', tag: '차고에 뭔가 있다',
    desc: '멀리서 잔소리로 상대를 묶어 두는 견제형. 다가오면 도장으로 찍는다.',
    hp: 960, walk: 2.4, dash: 5.8, jump: 12.8, weight: 1.02, scale: 1.02,
    cry: '자네, 그건 아니지.',
    story: '동네에서는 그냥 잔소리 많은 안경 아저씨다. 그런데 그 집 차고 문은 20년째 안 열린다. 전기차 배터리 특허가 넉 장, 위성 부품 도면이 몇 개. 회사는 안 만들었다 — 귀찮아서다. 말투는 느린데 계산은 이미 세 수 앞이라, 다가오기 전에 길이 다 막혀 있다. 그가 진짜로 뭘 만들고 있는지는 아무도 모른다.',
    bond: '조스클럽 회원 · 조스가 가장 탐내는 사람',
    col: { skin: '#e8c39c', skinDark: '#cea67f', hair: '#3b3b44', top: '#9fb6cc', sleeve: '#9fb6cc', sleeveDark: '#7f94a8',
           pants: '#4a4f5c', pantsDark: '#3a3e49', shoe: '#2c2f3e', shoeDark: '#1e2029', beltCol: '#3a2f26' },
    hairDraw: 'glasses', prop: 'stamp',
    normals: normals({ dmg: 0.96, reach: 5 }),
    specials: [
      { key: 'nag', name: '잔소리 파동', cmd: '236P', anim: 'fire', startup: 7, active: 5, recovery: 13,
        meter: 5, proj: proj({ color: '#b6c6ff', dmg: 50, speed: 8.6, w: 30, h: 28, shape: 'wave' }),
        note: '말이 파도처럼 밀려 나간다. 빠르고 계속 나가서 상대를 못 오게 만든다.' },
      { key: 'upper', name: '결재 도장', cmd: '623P', anim: 'upper', startup: 5, active: 7, recovery: 19,
        meter: 8, dmg: 96, hit: 22, kb: 6, launch: -8.8, box: [24, -118, 44, 80], invuln: [0, 5],
        note: '도장을 위로 찍어 올린다. 대공기. "반려."' },
      { key: 'chair', name: '회전 의자 돌진', cmd: '214K', anim: 'dash', startup: 6, active: 10, recovery: 15,
        meter: 6, dmg: 74, hit: 17, kb: 7, move: 8.2, box: [20, -92, 54, 66],
        note: '의자째로 굴러 들어온다. 견제만 하다 갑자기 들어갈 때 쓴다.' },
    ],
    super: { key: 'super', name: '야근 명령', cmd: '236236P', anim: 'super', startup: 12, active: 10, recovery: 28,
      proj: proj({ color: '#8fa8ff', dmg: 52, speed: 6.4, w: 70, h: 78, y: -88, hits: 5, shape: 'wave', kb: 9 }),
      note: '거절할 수 없는 말이 벽처럼 밀려 온다.' },
  },

  /* ---------------------------------------------------------- 8. 조스 — 부자 (간판) */
  {
    key: 'joss', name: '조스', job: '조스클럽 회장', tag: '이 게임의 이름값',
    desc: '리치가 가장 길고 견제가 촘촘하다. 이 게임의 간판 캐릭터.',
    hp: 990, walk: 2.4, dash: 6.0, jump: 13.0, weight: 1.05, scale: 1.03,
    cry: '수익률로 말하지.',
    story: '조스클럽의 수장. 이 판에 선 남자들은 대부분 그의 돈으로 여기까지 왔다 — 족구 코트도, 조기축구회 회비도, 심지어 우체국 회식비도. 그는 주먹으로 이기지 않는다. **먼저 사람을 사고, 그다음에 링을 산다.** 아직 못 산 사람이 둘 있다. 술 마시는 아저씨와, 차고 문을 안 여는 아저씨.',
    bond: '조스클럽 수장 · 남자 캐릭터 대부분의 후원자',
    col: { skin: '#eec49c', skinDark: '#d4a67e', hair: '#22242e', top: '#2b3350', sleeve: '#2b3350', sleeveDark: '#212841',
           pants: '#2b3350', pantsDark: '#212841', shoe: '#171a22', shoeDark: '#0f1117', beltCol: '#111319' },
    hairDraw: 'slick', prop: 'case',
    normals: normals({ reach: 6 }),
    specials: [
      { key: 'money', name: '돈다발 투척', cmd: '236P', anim: 'fire', startup: 8, active: 6, recovery: 14,
        meter: 6, proj: proj({ color: '#8fd6a0', dmg: 64, speed: 6.8, shape: 'bill', w: 36, h: 26 }),
        note: '지폐 뭉치를 흩뿌리며 날린다.' },
      { key: 'upper', name: '가방 어퍼', cmd: '623P', anim: 'upper', startup: 5, active: 7, recovery: 19,
        meter: 8, dmg: 94, hit: 21, kb: 6.4, launch: -8.8, box: [26, -120, 46, 80], invuln: [0, 5],
        note: '서류가방을 통째로 퍼올린다. 리치가 길다.' },
      { key: 'papers', name: '서류 폭풍', cmd: '214P', anim: 'spin', startup: 7, active: 10, recovery: 15,
        meter: 6, dmg: 30, hit: 11, kb: 2.5, box: [16, -100, 76, 74], multi: 3,
        note: '가방을 열어 서류를 흩뿌린다. 앞쪽 넓은 범위를 세 번 때린다.' },
    ],
    super: { key: 'super', name: '폭등', cmd: '236236P', anim: 'super', startup: 14, active: 10, recovery: 28,
      proj: proj({ color: '#7ee6a8', dmg: 52, speed: 6.2, w: 66, h: 88, y: -92, hits: 5, shape: 'bill', kb: 9 }),
      note: '지폐가 기둥처럼 치솟아 앞으로 밀려 나간다.' },
  },

  /* ---------------------------------------------------------- 9. 유진 — 20대 */
  {
    key: 'yujin', name: '유진', job: '민유의 큰딸', tag: '아빠처럼은 안 산다',
    desc: '가장 빠르고 가장 높이 뛴다. 공중에서 흔들다가 파고드는 캐릭터.',
    hp: 900, walk: 3.2, dash: 7.4, jump: 15.2, weight: 0.82, scale: 0.96,
    cry: '그 말 20년째잖아.',
    story: '스물넷. 아버지가 20년 다닌 그 동네를 떠나는 게 목표다. "안정적인 게 최고야"라는 말을 들을 때마다 한 발씩 더 멀리 뛴다. 실은 아버지의 손버릇을 제일 많이 물려받았는데, 그 말을 하면 화를 낸다. 발이 이 판에서 제일 빠르다.',
    bond: '민유의 큰딸 · 유정의 언니',
    col: { skin: '#f8d3b2', skinDark: '#deb491', hair: '#4a2a1c', top: '#d94f76', sleeve: '#f8d3b2', sleeveDark: '#deb491',
           pants: '#2f3550', pantsDark: '#242940', shoe: '#e8556f', shoeDark: '#b83f55', beltCol: '#e8c766' },
    hairDraw: 'long', prop: 'bag',
    normals: normals({ dmg: 0.88, reach: 1 }),
    specials: [
      { key: 'orb', name: '립스틱 섬광', cmd: '236P', anim: 'fire', startup: 8, active: 5, recovery: 13,
        meter: 5, proj: proj({ color: '#ff9ecb', dmg: 56, speed: 8.0, w: 28, h: 26, shape: 'star' }),
        note: '작고 빠른 섬광. 견제용이다.' },
      { key: 'upper', name: '하이힐 상승킥', cmd: '623K', anim: 'upper', startup: 4, active: 8, recovery: 16,
        meter: 8, dmg: 84, hit: 20, kb: 6, launch: -10, box: [20, -124, 40, 86], invuln: [0, 6],
        note: '돌면서 높이 솟는 대공기.' },
      { key: 'dive', name: '급강하 차기', cmd: '214K', anim: 'jk', startup: 5, active: 14, recovery: 14,
        meter: 6, dmg: 76, hit: 18, kb: 6, move: 6.5, dive: true, box: [22, -60, 46, 60],
        note: '떴다가 비스듬히 내리꽂는다. 앉아 막는 상대를 넘어 들어간다.' },
    ],
    super: { key: 'super', name: '별빛 난무', cmd: '236236P', anim: 'super', startup: 10, active: 22, recovery: 24,
      dmg: 26, hit: 10, kb: 2, move: 6.8, box: [18, -102, 54, 82], multi: 9, invuln: [0, 8],
      note: '별을 흩뿌리며 아홉 번 몰아친다.' },
  },

  /* ---------------------------------------------------------- 10. 유정 — 여고생 */
  {
    key: 'yujeong', name: '유정', job: '민유의 작은딸', tag: '말 걸지 마세요',
    desc: '가방과 필기구로 거리를 재는 원거리형. 다가오지 못하게 하는 데 가장 능하다.',
    hp: 930, walk: 2.6, dash: 6.4, jump: 13.8, weight: 0.88, scale: 0.95,
    cry: '나 학원 가야 되는데.',
    story: '열여섯. 요즘 아버지와 하는 대화는 하루 네 마디를 안 넘는다. 가방에는 문제집 여섯 권이 들어 있고, 그게 이 판에서 가장 무거운 무기다. 아무도 자기 반경 안에 못 들어오게 하는 법을 혼자 터득했다 — 집에서 배운 기술이다. 언니가 집을 나가면 자기도 나갈 거라고 한다.',
    bond: '민유의 작은딸 · 유진의 동생',
    col: { skin: '#f6d2b0', skinDark: '#dcb28f', hair: '#241a20', top: '#f2f4f8', sleeve: '#f2f4f8', sleeveDark: '#d3d6dd',
           pants: '#3a4a6e', pantsDark: '#2c3a58', shoe: '#3a3236', shoeDark: '#282226', beltCol: '#8d2b3a' },
    hairDraw: 'school', prop: 'schoolbag', skirt: true,
    normals: normals({ dmg: 0.9, reach: 7 }),
    specials: [
      { key: 'needle', name: '샤프심 난사', cmd: '236P', anim: 'fire', startup: 7, active: 4, recovery: 12,
        meter: 4, proj: proj({ color: '#c8b4ff', dmg: 42, speed: 9.6, w: 22, h: 16, shape: 'star', y: -80 }),
        note: '가늘고 빠르다. 계속 던져 상대가 못 오게 만든다.' },
      { key: 'upper', name: '가방 올려치기', cmd: '623P', anim: 'upper', startup: 5, active: 7, recovery: 18,
        meter: 8, dmg: 88, hit: 20, kb: 6, launch: -9, box: [24, -120, 44, 82], invuln: [0, 5],
        note: '책 든 가방을 퍼올린다. 대공기. 무겁다.' },
      { key: 'sweepkick', name: '체육시간 후려차기', cmd: '214K', anim: 'spin', startup: 6, active: 8, recovery: 16,
        meter: 6, dmg: 70, hit: 0, kb: 7, move: 4.0, box: [26, -24, 68, 20], type: 'low', knockdown: true,
        note: '길게 뻗어 발목을 후린다. 하단이라 서서 막으면 맞는다.' },
    ],
    super: { key: 'super', name: '야자 탈출', cmd: '214214K', anim: 'super', startup: 12, active: 20, recovery: 26,
      dmg: 27, hit: 10, kb: 2, move: 5.4, box: [20, -112, 60, 96], multi: 8, invuln: [0, 8],
      note: '가방을 휘두르며 여덟 번 몰아친다. 아무도 못 막는다.' },
  },
];

/* ---------- 머리·소품 ----------
   ⚠️캐릭터는 **투명한 배경 위에** 그려진다 — 네모난 판을 깔지 않는다.
     머리 뒤에 사각형을 하나라도 칠하면 그 순간 배경에서 캐릭터가 오려낸 스티커처럼 보인다.
   좌표는 머리 중심이 원점, +x 가 앞쪽(바라보는 쪽). */
var HAIR = {
  short: function (cx, col) {
    cx.fillStyle = col.hair;
    cx.beginPath();
    cx.moveTo(-11, -2); cx.quadraticCurveTo(-11, -14, 0, -14);
    cx.quadraticCurveTo(11, -14, 10.5, -2);
    cx.quadraticCurveTo(7, -8.5, -1, -8);
    cx.quadraticCurveTo(-8, -7.5, -11, -2);
    cx.closePath(); cx.fill();
  },
  hood: function (cx, col) {                    // 민유 — 개발자 후드
    HAIR.short(cx, col);
    cx.fillStyle = '#26365c';
    cx.beginPath();
    cx.moveTo(-12, 2); cx.quadraticCurveTo(-16, -12, -2, -16);
    cx.quadraticCurveTo(-12, -6, -9, 4); cx.closePath(); cx.fill();
  },
  cap: function (cx, col) {                     // 종범 — 우체국 모자
    HAIR.short(cx, col);
    cx.fillStyle = '#1b2230';
    cx.beginPath(); cx.arc(0, -8, 11.5, Math.PI, 0); cx.fill();
    cx.fillRect(-11.5, -9, 23, 3);
    cx.fillStyle = '#243046';
    cx.beginPath(); cx.moveTo(4, -8.5); cx.lineTo(18, -6.5); cx.lineTo(17, -3.5); cx.lineTo(4, -5.5); cx.closePath(); cx.fill();
    cx.fillStyle = '#e8c766';
    cx.beginPath(); cx.arc(6, -12, 2.2, 0, 7); cx.fill();
  },
  headband: function (cx, col) {                // 노덕 — 족구 머리띠
    HAIR.short(cx, col);
    cx.fillStyle = '#1f2a44';
    cx.fillRect(-11.5, -8, 23, 4.5);
    cx.beginPath(); cx.moveTo(-11, -7); cx.lineTo(-20, -3); cx.lineTo(-19, -7.5); cx.closePath(); cx.fill();
  },
  thin: function (cx, col) {                    // 동식 — 숱이 없는 머리
    cx.fillStyle = col.hair;
    cx.beginPath(); cx.arc(-3, -5, 10.5, Math.PI * 1.05, Math.PI * 1.9); cx.fill();
    cx.fillRect(-11, -6, 8, 4);
    cx.fillStyle = 'rgba(220,120,110,.35)';     // 발그레한 얼굴
    cx.beginPath(); cx.arc(4, 2.5, 4.6, 0, 7); cx.fill();
  },
  glasses: function (cx, col) {                 // 준원 — 안경
    HAIR.short(cx, col);
    cx.strokeStyle = 'rgba(30,32,40,.9)'; cx.lineWidth = 1.7;
    cx.beginPath(); cx.arc(5.6, -1.6, 4.6, 0, 7); cx.stroke();
    cx.beginPath(); cx.arc(-2.6, -2.4, 3.6, 0, 7); cx.stroke();
    cx.beginPath(); cx.moveTo(1.2, -2.2); cx.lineTo(1.9, -2.1); cx.stroke();
    cx.fillStyle = 'rgba(200,225,255,.22)';
    cx.beginPath(); cx.arc(5.6, -1.6, 4.4, 0, 7); cx.fill();
  },
  slick: function (cx, col) {                   // 조스 — 넘긴 머리 + 안경
    cx.fillStyle = col.hair;
    cx.beginPath();
    cx.moveTo(-11, -2); cx.quadraticCurveTo(-12, -13, 2, -13.5);
    cx.quadraticCurveTo(12, -13, 10.5, -3);
    cx.quadraticCurveTo(2, -6, -11, -2);
    cx.closePath(); cx.fill();
    cx.strokeStyle = 'rgba(20,22,30,.85)'; cx.lineWidth = 1.6;
    cx.beginPath(); cx.arc(5.6, -1.6, 4.2, 0, 7); cx.stroke();
  },
  long: function (cx, col) {                    // 유진 — 긴 머리
    cx.fillStyle = col.hair;
    cx.beginPath();
    cx.moveTo(-9, -8); cx.quadraticCurveTo(-22, -2, -19, 20);
    cx.quadraticCurveTo(-12, 8, -6, 3); cx.closePath(); cx.fill();
    HAIR.short(cx, col);
    cx.beginPath();
    cx.moveTo(-2, -13); cx.quadraticCurveTo(8, -13, 11, -3);
    cx.quadraticCurveTo(9, -9, -2, -9); cx.closePath(); cx.fill();
  },
  school: function (cx, col) {                  // 유정 — 단발 + 머리핀
    cx.fillStyle = col.hair;
    cx.beginPath();
    cx.moveTo(-12, -2); cx.quadraticCurveTo(-13, -15, 0, -15);
    cx.quadraticCurveTo(12, -15, 11, -2);
    cx.quadraticCurveTo(12, 7, 8, 7);
    cx.quadraticCurveTo(9, -4, 2, -7);
    cx.quadraticCurveTo(-6, -9, -9, -1);
    cx.quadraticCurveTo(-10, 7, -13, 6);
    cx.closePath(); cx.fill();
    cx.fillStyle = '#e8556f';
    cx.fillRect(2, -12, 5, 2.4);
  },
};

/* 손에 든 소품 — 앞손 위치에 그린다(포즈를 따라 움직인다) */
var PROP = {
  laptop: function (cx, C) {                    // 민유
    cx.fillStyle = '#c9d2e0'; cx.fillRect(-9, -6, 18, 11);
    cx.fillStyle = '#2b3350'; cx.fillRect(-8, -5, 16, 8);
    cx.fillStyle = '#7cc4ff'; cx.fillRect(-6, -3.5, 8, 1.4);
  },
  parcel: function (cx) {                       // 종범
    cx.fillStyle = '#c9a06a'; cx.fillRect(-9, -9, 18, 17);
    cx.strokeStyle = '#8d1f2d'; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(0, -9); cx.lineTo(0, 8); cx.moveTo(-9, 0); cx.lineTo(9, 0); cx.stroke();
  },
  driver: function (cx) {                       // 인우
    cx.fillStyle = '#e8c766'; cx.fillRect(-2, -12, 4, 12);
    cx.fillStyle = '#c0392b'; cx.fillRect(-3.5, 0, 7, 9);
  },
  jokgu: function (cx) {                        // 노덕
    cx.fillStyle = '#f0c344';
    cx.beginPath(); cx.arc(0, 0, 8.5, 0, 7); cx.fill();
    cx.strokeStyle = '#8a6a20'; cx.lineWidth = 1.4;
    cx.beginPath(); cx.moveTo(-8, 0); cx.lineTo(8, 0); cx.stroke();
    cx.beginPath(); cx.arc(0, 0, 8.5, 0, 7); cx.stroke();
  },
  soccer: function (cx) {                       // 길수
    cx.fillStyle = '#f4f6fa';
    cx.beginPath(); cx.arc(0, 0, 8.5, 0, 7); cx.fill();
    cx.fillStyle = '#20222e';
    cx.beginPath(); cx.arc(0, 0, 3.2, 0, 7); cx.fill();
    cx.strokeStyle = '#20222e'; cx.lineWidth = 1.2;
    cx.beginPath(); cx.arc(0, 0, 8.5, 0, 7); cx.stroke();
  },
  bottle: function (cx) {                       // 동식
    cx.fillStyle = '#2f7a3f'; cx.fillRect(-4, -4, 8, 14);
    cx.fillRect(-2, -13, 4, 9);
    cx.fillStyle = '#f2e2b0'; cx.fillRect(-4, 0, 8, 5);
  },
  stamp: function (cx) {                        // 준원
    cx.fillStyle = '#3a2f26'; cx.fillRect(-4, -11, 8, 11);
    cx.fillStyle = '#c0392b'; cx.fillRect(-5, 0, 10, 5);
  },
  case: function (cx) {                         // 조스
    cx.fillStyle = '#3a2b1e'; cx.fillRect(-10, -7, 20, 14);
    cx.fillStyle = '#e8c766'; cx.fillRect(-10, -1, 20, 2.4);
    cx.strokeStyle = '#241a12'; cx.lineWidth = 1.4;
    cx.beginPath(); cx.arc(0, -7, 5, Math.PI, 0); cx.stroke();
  },
  bag: function (cx) {                          // 유진
    cx.fillStyle = '#8d2b3a'; cx.fillRect(-7, -5, 14, 11);
    cx.fillStyle = '#e8c766'; cx.fillRect(-7, -1, 14, 2);
  },
  schoolbag: function (cx) {                    // 유정
    cx.fillStyle = '#3a4a6e'; cx.fillRect(-9, -8, 18, 16);
    cx.fillStyle = '#f2f4f8'; cx.fillRect(-9, -2, 18, 3);
    cx.fillStyle = '#e8556f'; cx.fillRect(4, -8, 4, 5);
  },
};

C.forEach(function (ch) {
  var h = HAIR[ch.hairDraw] || HAIR.short;
  ch.draw = { head: function (cx, col) { h(cx, col); } };
  ch.propDraw = PROP[ch.prop] || null;
  // 몸통에 얹는 것 — 넥타이·배·치마처럼 실루엣을 바꾸는 것만
  ch.draw.torso = function (cx, px, py, cxp, cyp) {
    if (ch.key === 'joss' || ch.key === 'junwon') {
      cx.fillStyle = ch.key === 'joss' ? '#c0392b' : '#4a6f8a';
      cx.beginPath();
      cx.moveTo(cxp + 2, cyp + 4); cx.lineTo(cxp + 7, cyp + 8);
      cx.lineTo((cxp + px) / 2 + 4, (cyp + py) / 2 + 7); cx.closePath(); cx.fill();
    }
    if (ch.belly) {                              // 동식 — 나온 배
      cx.fillStyle = ch.col.top;
      cx.beginPath();
      cx.ellipse((cxp + px) / 2 + 5, (cyp + py) / 2 + 2, 13, 11, 0, 0, 7);
      cx.fill();
      cx.strokeStyle = 'rgba(12,10,20,.35)'; cx.lineWidth = 1.2; cx.stroke();
    }
    if (ch.skirt) {                              // 유정 — 체크 치마
      cx.save();
      cx.translate(px, py);
      cx.fillStyle = '#3a4a6e';
      cx.beginPath();
      cx.moveTo(-11, -4); cx.lineTo(11, -4); cx.lineTo(16, 14); cx.lineTo(-16, 14);
      cx.closePath(); cx.fill();
      cx.strokeStyle = 'rgba(240,244,250,.35)'; cx.lineWidth = 1.2;
      for (var i = -10; i <= 10; i += 7) {
        cx.beginPath(); cx.moveTo(i, -4); cx.lineTo(i * 1.45, 14); cx.stroke();
      }
      cx.restore();
    }
    if (ch.key === 'nodeok' || ch.key === 'gilsu') {   // 유니폼 줄무늬
      // ⚠️여기에 등번호를 글자로 찍었더니 **왼쪽을 볼 때 글자가 뒤집혀** 보였다
      //   (파이터는 face 로 좌우를 뒤집어 그린다). 글자 대신 무늬를 쓴다.
      cx.save();
      cx.translate((cxp + px) / 2, (cyp + py) / 2);
      cx.fillStyle = 'rgba(255,255,255,.8)';
      cx.fillRect(-9, -6, 18, 3.5);
      cx.fillRect(-9, 1, 18, 3.5);
      cx.restore();
    }
  };
});

window.CHARS = C;
})();
