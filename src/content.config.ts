import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 다국어 블로그. 파일명 예: dram-lawsuit.en.md / dram-lawsuit.ko.md ...
// slug(번역 공통키) + lang 조합으로 라우팅한다.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    lang: z.enum(['en', 'ko', 'ja', 'es', 'zh']),
    key: z.string(),
    author: z.string().default('Tech Decode'),
    category: z.string().default(''),
  }),
});

export const collections = { blog };
