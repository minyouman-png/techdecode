import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 나중에 커스텀 도메인을 붙이면 이 site 값만 바꾸면 됩니다.
export default defineConfig({
  site: 'https://minyouman-png.github.io',
  integrations: [sitemap()],
});
