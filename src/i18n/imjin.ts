// 임진왜란: 조선의 반격 — 우리 상단 페이지(`/imjin/`) 자료. **한국어 전용**.
//
// ⚠️수치는 게임 화면(상단 창 · 구성원 탭 · 성 관리)에서 직접 읽어 옮긴 것이다. 기준 시각은 `asOf`.
//   상단원·전투력은 매일 바뀐다 — 다시 옮길 때는 asOf 도 같이 고칠 것.
// ⚠️'기여'는 구성원 탭 오른쪽 아래 퍼센트(상단 포인트 기여 비율)다.

export type Rank = '대행수' | '행수' | '갑사' | '서기' | '견습생';

export interface Member {
  name: string;
  lv: number;
  power: number;
  share: number;
  rank: Rank;
}

export interface Castle {
  slug: string;
  name: string;
  /** 성 관리 창의 주둔 병력 */
  troops: number;
  capital?: boolean;
  img: string;
}

export interface Video {
  id: string;
  title: string;
  boss: string;
  note: string;
}

export const guild = {
  tag: 'WIZ',
  name: '대한제국',
  server: '임진왜란: 조선의 반격',
  level: 10,
  power: 3_652_460_381,
  leader: '울라리',
  members: 52,
  capacity: 60,
  castlesHeld: 5,
  mark: '/imjin/daehan/mark.jpg',
  markSquare: '/imjin/daehan/mark-sq.jpg',
  territory: '/imjin/daehan/territory.jpg',
  asOf: '2026-10-29',
};

export const RANKS: { rank: Rank; perk: string }[] = [
  { rank: '대행수', perk: '상단 포인트 2배' },
  { rank: '행수', perk: '상단 포인트 2배 · 정원 5명' },
  { rank: '갑사', perk: '' },
  { rank: '서기', perk: '' },
  { rank: '견습생', perk: '' },
];

const m = (rank: Rank) => (name: string, lv: number, power: number, share: number): Member => ({ name, lv, power, share, rank });
const 대행수 = m('대행수'), 행수 = m('행수'), 갑사 = m('갑사'), 서기 = m('서기');

export const members: Member[] = [
  대행수('울라리', 75, 83_349_622, 3.20),

  행수('올라프', 85, 96_860_991, 5.13),
  행수('리아아빠', 75, 95_102_954, 3.45),
  행수('지니v', 80, 83_236_979, 1.80),
  행수('| 이순신 |', 80, 63_124_920, 2.22),
  행수('잔댜', 70, 44_230_768, 1.51),

  갑사('ICBM', 80, 94_683_703, 0.00),
  갑사('장씨후손', 75, 70_524_095, 0.49),
  갑사('까칠한', 75, 64_847_832, 0.00),
  갑사('어허이', 70, 51_485_606, 0.00),
  갑사('통제사방원', 75, 38_729_315, 0.00),
  갑사('부르고스', 65, 29_272_469, 1.76),
  갑사('아미고', 70, 27_422_083, 0.00),

  서기('온빈이', 75, 114_382_189, 2.31),
  서기('까뮤', 75, 107_935_681, 2.30),
  서기('은비수', 80, 102_655_758, 0.93),
  서기('수호가이', 75, 86_425_014, 1.45),
  서기('유정공주', 79, 84_966_739, 1.23),
  서기('태백무신', 75, 78_630_999, 1.91),
  서기('을지문덕현', 70, 74_197_863, 3.89),
  서기('백립', 75, 55_918_923, 3.18),
  서기('i리아엄마i', 65, 31_834_263, 2.44),
  서기('가을야구', 75, 69_537_395, 1.58),
  서기('거제굴튼', 79, 89_287_525, 3.33),
  서기('꿀라이머', 80, 84_001_475, 4.57),
  서기('레드라캄', 70, 38_707_558, 1.06),
  서기('꿀꺽깨비', 75, 75_011_452, 3.80),
  서기('갱아서방', 70, 41_650_172, 1.39),
  서기('I통제사I', 85, 122_850_055, 5.82),
  서기('메이지', 78, 63_024_364, 3.34),
  서기('유성파도', 80, 67_838_405, 0.45),
  서기('푸크린', 75, 96_522_987, 1.94),
  서기('루미나', 81, 106_488_347, 0.38),
  서기('구름위끝', 70, 46_066_717, 1.07),
  서기('꾸난', 80, 164_544_938, 3.65),
  서기('축복캐릭터', 70, 44_944_941, 0.77),
  서기('조선의반역', 70, 38_234_568, 0.92),
  서기('tayama', 75, 49_560_956, 2.20),
  서기('해상신', 71, 64_484_497, 1.38),
  서기('옴이온', 70, 73_985_056, 4.66),
  서기('송돼지', 75, 65_559_454, 1.62),
  서기('전주카리나', 70, 47_400_390, 2.28),
  서기('나혼자만렙', 70, 104_353_791, 3.89),
  서기('허신조', 70, 36_742_587, 0.12),
  서기('와이투제이', 76, 50_987_331, 1.21),
  서기('빵빵뿅뿅', 75, 54_932_487, 0.88),
  서기('여해이순신장군', 85, 118_812_999, 2.22),
  서기('오프로', 80, 100_495_153, 1.32),
  서기('시우왕장군', 60, 26_078_519, 0.14),
  서기('영웅찬', 75, 51_455_058, 0.17),
  서기('이에아스', 70, 47_383_392, 4.05),
  서기('측천난무', 70, 31_699_046, 0.34),
];

export const castles: Castle[] = [
  { slug: 'himeji', name: '히메지', troops: 55_726, capital: true, img: '/imjin/daehan/castle-himeji.jpg' },
  { slug: 'hizen-nagoya', name: '히젠나고야', troops: 98_089, img: '/imjin/daehan/castle-hizen-nagoya.jpg' },
  { slug: 'kumamoto', name: '구마모토', troops: 63_383, img: '/imjin/daehan/castle-kumamoto.jpg' },
  { slug: 'uwajima', name: '우와지마', troops: 60_000, img: '/imjin/daehan/castle-uwajima.jpg' },
  { slug: 'hiroshima', name: '히로시마', troops: 49_446, img: '/imjin/daehan/castle-hiroshima.jpg' },
];

/** 상단의 영광 — 실물 증빙(사진)이 있는 것만. date 는 증빙으로 확인한 날짜. */
export const awards: { date: string; title: string; body: string; img: string; credit: string }[] = [
  {
    date: '2026-10-08',
    title: '전주 서버 1위 달성 — 서버 1등 달성 표창장',
    body: '대한제국이 전주 서버 1위를 달성해 개발사(레드징코게임즈)로부터 받은 표창장. "지금의 영광은 혼자가 아닌, 함께한 모든 상단원들의 노력과 헌신이 있었기에 가능했습니다." 표창장에는 상단원 37명의 이름이 함께 새겨져 있습니다.',
    img: '/imjin/daehan/award-server1.jpg',
    credit: '표창장 실물 사진, 2026-10-08 촬영',
  },
];

/** 상단 일정 연혁 — 날짜가 확인된 것만 적는다. 새 일이 생기면 위에 추가. */
export const timeline: { date: string; title: string; body: string }[] = [
  { date: '2026-10-29', title: '상단 대전 신수 진행', body: '상단 창 공지: "금일 상단대전 신수 진행합니다." 선전포고 포인트 1/5.' },
  { date: '2026-10-29', title: '일본 서부 성 5곳 보유', body: '수도 히메지를 중심으로 히젠나고야·구마모토·우와지마·히로시마까지 성 보유 5/5(최대).' },
  { date: '2026-10-29', title: '상단 레벨 10 (MAX) · 상단원 52/60', body: '상단 전투력 3,652,460,381. 대행수 울라리, 행수 5명.' },
  { date: '2026-10-08', title: '전주 서버 1위 · 표창장 수령', body: '전주 서버 1위 달성으로 개발사 레드징코게임즈가 보낸 "서버 1등 달성 표창장"이 도착. 상단원 37명의 이름이 새겨졌다. (날짜는 표창장 실물 사진 촬영일 기준)' },
];

/** 히스토리마스터 × 임진왜란 '사냥터 인물 열전' — 유튜브 jabhakboy 채널 */
export const videos: Video[] = [
  { id: 'bSrC3kOa8jg', boss: '구루시마 미치후사 (순천)', title: '명량에서 전사한 해적 다이묘, 게임에선 매일 쓰러진다', note: '사냥터 인물 열전 ① · 졸개가 보스보다 은화가 많은 이유' },
  { id: 'EQ5iiFLIhlo', boss: '와키자카 야스하루 (인천)', title: '한산도에서 이순신에게 진 장수, 게임에선 초반 은화·목상 창고', note: '사냥터 인물 열전 ② · 레벨 20~50 전리품 비교' },
  { id: 'FVhTfHBVoxg', boss: '우키타 히데이에 (히메지)', title: '행주산성에서 권율에게 진 총대장, 게임에선 은화 1,234개 보스', note: '사냥터 인물 열전 ③ · Lv55 에서 은화 +45%' },
  { id: 'qNSGP-3r77A', boss: '고바야카와 다카카게 (전주)', title: '벽제관에서 명군을 꺾은 노장, 게임에선 와키자카와 같은 보상표?', note: '사냥터 인물 열전 ④' },
  { id: '3Dc-DtZpZVU', boss: '이벤트 · 강철의 바다', title: "PK 바다에 들어갔다가 3번 침몰했습니다 — '강철 이빨 교환' 이벤트 총정리", note: '이벤트 공략 · 괴물 상어·정화의 귀보선' },
];

export const DAEHAN_TABS = [
  { href: '/imjin/daehan/', label: '상단 연혁' },
  { href: '/imjin/daehan/members/', label: '상단원 소개' },
  { href: '/imjin/daehan/schedule/', label: '상단 일정 연혁' },
  { href: '/imjin/daehan/videos/', label: '임진왜란 공략영상' },
];

export const fmt = (n: number) => n.toLocaleString('ko-KR');
/** 전투력을 '1.6억'·'8,335만' 꼴로 */
export const short = (n: number) => (n >= 1e8 ? `${(n / 1e8).toFixed(2)}억` : `${Math.round(n / 1e4).toLocaleString('ko-KR')}만`);
