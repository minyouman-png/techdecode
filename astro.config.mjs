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
    '/ko/shops/': '/shops/',   // ⚠️2026-08-20: 홈이 아니라 가게 목록으로. 홈은 회사 소개가 됐다.
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

  // ⚠️**noindex 인 페이지는 사이트맵에도 넣지 않는다.** 둘이 어긋나면 서치콘솔이
  //   '제출된 URL 이 noindex 처리됨' 오류로 잡는다(예전에 `/apps/*` 로 한 번 겪은 실수).
  //   그래서 아래 목록은 noindex 를 건 곳과 **정확히 같아야 한다.**
  //
  // ★2026-08-20: 블로그·용어사전·도구를 **다시 넣었다**(2026-08-05에 격리했던 것).
  //   사이트가 'AI로 여러 사업을 하는 곳'으로 넓어지면서 'AI 기술 소개'가 사업 한 축이 됐고,
  //   글이 색인되지 않으면 그 축은 검색에 존재하지 않는다. Header·Footer 링크 복귀,
  //   각 컴포넌트의 noindex 해제와 **세트**로 움직인 변경이다.
  //   ⚠️단, `/category/*` 는 계속 뺀다 — 글 목록을 다시 늘어놓기만 하는 얇은 페이지라
  //     같은 글이 여러 주소로 색인되는 쪽 손해가 더 크다.
  //
  //   남는 제외 대상: `/category/*`(얇은 목록) · `/apps/*`(랜딩이 대표)
  //   · `/play/*`(게임 상세가 대표) · `/shops/admin`(가게 전용 작성기).
  //   ⚠️`/shops/` 제외도 함께 풀었다 — 홈이 더는 가게 목록이 아니라서 이제 **`/shops/` 가
  //     가게 디렉토리의 대표 주소**다(src/pages/shops/index.astro 와 세트).
  integrations: [
    sitemap({
      filter: (page) => {
        const p = new URL(page).pathname;
        if (/\/category(\/|$)/.test(p)) return false;
        if (p.startsWith('/apps/') || p.startsWith('/play/')) return false;
        if (p.includes('/shops/admin')) return false;
        return true;
      },
    }),
  ],
});
