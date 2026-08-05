// 한국어(기본 언어) RSS 피드
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE_NAME, ui } from '../i18n/ui';
import { blogUrl } from '../i18n/utils';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog'))
    .filter((p) => p.data.lang === 'ko')
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, 30);
  return rss({
    title: SITE_NAME,
    description: ui.ko.metaDescription,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: blogUrl(p.data.key, 'ko'),
    })),
    customData: '<language>ko</language>',
  });
}
