// 게임 공략(`/guide/`) 레지스트리 — 우리 모바일 게임의 소개·공략 문구 원본.
// 게임마다 파일 하나(`./guides/<slug>.ts`). 문구는 개발팀이 게임 저장소(데이터·설계 문서·코드)를 보고
// 확인한 사실만 쓴다 — 지어낸 수치는 공략 사이트에서 제일 빨리 들킨다.
// ⚠️`cat` 은 게시판 분류 키(src/scripts/board.js CATS · firestore.rules catOk)와 같아야 한다.
import { yuja } from './guides/yuja';
import { khan } from './guides/khan';
import { ansi } from './guides/ansi';

export interface Guide {
  slug: string;
  cat: 'yuja' | 'khan' | 'ansi';
  title: string;
  fullTitle: string;
  subtitle: string;
  genre: string;
  platform: string;
  color: string;
  tagline: string;
  pills: string[];
  metaTitle: string;
  metaDesc: string;
  hero: string;
  cover: string;
  icon: string;
  playUrl?: string;
  privacyUrl?: string;
  updated?: string;
  intro: string[];
  facts: [string, string][];
  shots: { src: string; cap: string }[];
  shotsWide?: boolean;
  shotsNote?: string;
  story: string[];
  people: { name: string; desc: string }[];
  chaptersTitle?: string;
  chapters?: { name: string; desc: string }[];
  spoiler?: string[];
  controls: { title: string; rows: [string, string][] }[];
  systems: { icon?: string; title: string; body: string; points?: string[] }[];
  tables?: { title: string; head: string[]; rows: string[][]; note?: string }[];
  foesTitle: string;
  foes: { name: string; where?: string; desc: string; tip?: string }[];
  tips: string[];
  faq: { q: string; a: string }[];
}

export const guides: Guide[] = [yuja, khan, ansi];

// 세 게임 모두 Google Play 비공개 테스트(Alpha)의 테스터 = 이 Google 그룹 회원이다.
// 그룹에 먼저 가입해야 테스트 참여 링크의 '테스터 되기'가 열린다.
export const TESTER_GROUP_URL = 'https://groups.google.com/g/cnklab_tester';

export const guideUrl = (slug: string) => `/guide/${slug}/`;
