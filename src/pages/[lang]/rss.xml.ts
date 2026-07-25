// 비기본 언어 RSS 피드 (/ko/rss.xml 등)
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE_NAME, ui, languages, defaultLang, htmlLang, type Lang } from '../../i18n/ui';
import { blogUrl } from '../../i18n/utils';

export function getStaticPaths() {
  return (Object.keys(languages) as Lang[])
    .filter((l) => l !== defaultLang)
    .map((lang) => ({ params: { lang } }));
}

export async function GET(context: APIContext) {
  const lang = context.params.lang as Lang;
  const posts = (await getCollection('blog'))
    .filter((p) => p.data.lang === lang)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, 30);
  return rss({
    title: SITE_NAME,
    description: ui[lang].metaDescription,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: blogUrl(p.data.key, lang),
    })),
    customData: `<language>${htmlLang[lang]}</language>`,
  });
}
