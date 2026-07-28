import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 커스텀 도메인(menewsoft.com) 루트 서빙 + 5개 언어 i18n.
export default defineConfig({
  site: 'https://menewsoft.com',
  i18n: {
    locales: ['en', 'ko', 'ja', 'es', 'zh'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  // 브라우저 앱은 public/ 의 정적 파일이라 Astro 가 페이지로 인식하지 못한다.
  // 검색 유입을 노리는 실제 착지 페이지이므로 사이트맵에 직접 넣어준다.
  integrations: [sitemap({
    customPages: [
      'https://menewsoft.com/apps/sheet/',
      'https://menewsoft.com/apps/write/',
      'https://menewsoft.com/apps/show/',
      'https://menewsoft.com/apps/pdf/',
      'https://menewsoft.com/apps/hwp/',
    ],
  })],
});
