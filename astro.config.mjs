import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 커스텀 도메인(menewsoft.com) 루트 서빙 + 5개 언어 i18n.
//
// ⚠️★2026-08-05: 기본 언어를 **한국어**로 바꿨다(`/` = 한국어 업체 디렉토리, 영어는 `/en/`).
//   대상 고객이 한국 소상공인이라 대표 주소가 영어면 안 된다. URL 이 대거 바뀌지만 전환 시점
//   트래픽이 하루 9명이라 잃을 색인 자산이 사실상 없었다(GoatCounter 실측).
export default defineConfig({
  site: 'https://menewsoft.com',
  i18n: {
    locales: ['ko', 'en', 'ja', 'es', 'zh'],
    defaultLocale: 'ko',
    routing: { prefixDefaultLocale: false },
  },
  // ⚠️`/apps/*`(브라우저 앱 실물)은 **사이트맵에 넣지 않는다.**
  // 예전엔 착지 페이지로 보고 customPages 에 넣었는데, 같은 검색어를 `/tools/<slug>/` 랜딩과
  // 다투는 카니벌라이제이션이 됐다(둘 다 각자 canonical). 색인은 랜딩이 담당하고
  // 앱 쪽은 `noindex,follow` 로 돌렸으므로, 사이트맵에 남겨두면 서치콘솔이
  // '제출된 URL 이 noindex 처리됨' 오류로 잡는다.
  // 기본 언어가 en→ko 로 바뀌면서 예전 한국어 주소(`/ko/...`)가 전부 루트로 이동했다.
  // 이미 공유된 링크(가게 페이지·블로그·서치콘솔 제출분)가 404 나지 않도록 리다이렉트를 남긴다.
  // ⚠️GitHub Pages 는 서버 리다이렉트가 없어서 Astro 가 meta refresh + canonical HTML 을 생성한다.
  redirects: {
    '/ko/': '/',
    '/ko/shops/': '/',
    '/ko/about/': '/about/',
    '/ko/contact/': '/contact/',
    '/ko/privacy/': '/privacy/',
    '/ko/games/': '/games/',
    '/ko/news/': '/news/',
    '/ko/blog/': '/blog/',
    '/ko/tools/': '/tools/',
    '/ko/glossary/': '/glossary/',
    '/ko/shops/[slug]': '/shops/[slug]',
    '/ko/games/[slug]': '/games/[slug]',
    '/ko/blog/[slug]': '/blog/[slug]',
    '/ko/tools/[slug]': '/tools/[slug]',
    '/ko/glossary/[slug]': '/glossary/[slug]',
    '/ko/category/[slug]': '/category/[slug]',
  },

  // ★격리 대상은 사이트맵에서도 뺀다.
  // 블로그(AI·시장 분석)·용어사전·도구는 이제 이 사이트의 성격(업체 홈페이지 제작)과 무관하다.
  // 링크만 지우고 사이트맵에 남겨두면 구글이 계속 그쪽으로 사이트를 이해하고, 다국어 대량
  // 자동생성 페이지가 도메인 평가를 끌어내린다. noindex 와 세트로 간다.
  // ⚠️**noindex 인 페이지는 사이트맵에도 넣지 않는다.** 둘이 어긋나면 서치콘솔이
  //   '제출된 URL 이 noindex 처리됨' 오류로 잡는다(예전에 `/apps/*` 로 한 번 겪은 실수).
  //   그래서 아래 목록은 noindex 를 건 곳과 정확히 같아야 한다:
  //   블로그·카테고리·용어사전·도구(격리) · `/apps/*`(랜딩이 대표) · `/play/*`(상세가 대표)
  //   · `/shops/`(홈이 대표) · `/shops/admin`(가게 전용 작성기).
  //   `/shops/<slug>/` 는 색인 대상이므로 index 페이지만 정확히 제외한다.
  integrations: [
    sitemap({
      filter: (page) => {
        const p = new URL(page).pathname;
        if (/\/(blog|glossary|tools|category)(\/|$)/.test(p)) return false;
        if (p.startsWith('/apps/') || p.startsWith('/play/')) return false;
        if (p.includes('/shops/admin')) return false;
        if (/^\/([a-z]{2}\/)?shops\/$/.test(p)) return false; // 목록만 제외, 개별 가게는 유지
        return true;
      },
    }),
  ],
});
