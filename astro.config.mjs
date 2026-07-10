import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 커스텀 도메인(menewsoft.com) 루트 서빙. base 제거 → 내부링크는 BASE_URL('/')로 자동 대응.
export default defineConfig({
  site: 'https://menewsoft.com',
  integrations: [sitemap()],
});
