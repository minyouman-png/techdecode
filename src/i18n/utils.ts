import { ui, defaultLang, type Lang, type UIKey } from './ui';

// URL 경로에서 현재 언어 추출 (/ko/... → 'ko', / → 'en')
export function getLangFromUrl(url: URL): Lang {
  const [, seg] = url.pathname.split('/');
  if (seg in ui) return seg as Lang;
  return defaultLang as Lang;
}

// 번역 함수 반환. 키가 없으면 기본언어로 폴백.
export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLang as Lang][key];
  };
}

// 언어별 경로 생성. 기본언어(en)는 접두어 없음.
export function localizeUrl(path: string, lang: Lang): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) return clean;
  return `/${lang}${clean}`;
}

// 블로그 글 URL (slug + 언어)
export function blogUrl(slug: string, lang: Lang): string {
  return localizeUrl(`/blog/${slug}/`, lang);
}
