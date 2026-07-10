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
  integrations: [sitemap()],
});
