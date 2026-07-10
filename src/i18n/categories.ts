import { type Lang } from './ui';
import { localizeUrl } from './utils';

// 테크 계열 카테고리(공통 슬러그). frontmatter의 category 값은 이 슬러그를 씀.
export const categoryOrder = ['semiconductors', 'ai', 'markets', 'regulation'] as const;
export type CategorySlug = (typeof categoryOrder)[number];

export const categoryLabels: Record<CategorySlug, Record<Lang, string>> = {
  semiconductors: { en: 'Semiconductors', ko: '반도체', ja: '半導体', es: 'Semiconductores', zh: '半导体' },
  ai: { en: 'AI', ko: 'AI', ja: 'AI', es: 'IA', zh: '人工智能' },
  markets: { en: 'Markets', ko: '시장', ja: '市場', es: 'Mercados', zh: '市场' },
  regulation: {
    en: 'Regulation & Antitrust',
    ko: '규제·반독점',
    ja: '規制・独占禁止',
    es: 'Regulación y antimonopolio',
    zh: '监管与反垄断',
  },
};

export function isCategory(slug: string): slug is CategorySlug {
  return (categoryOrder as readonly string[]).includes(slug);
}

export function categoryLabel(slug: string, lang: Lang): string {
  return isCategory(slug) ? categoryLabels[slug][lang] : slug;
}

export function categoryUrl(slug: string, lang: Lang): string {
  return localizeUrl(`/category/${slug}/`, lang);
}
