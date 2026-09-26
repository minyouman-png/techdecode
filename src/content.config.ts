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

// 자격증 학원 — CKA 강의. 파일명 = 주소(slug). 순서는 part·order 로 정한다.
// quiz.answer 는 0부터 세는 보기 번호. labs 는 src/scripts/kubesim/tasks.js 의 과제 id.
const cka = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cka' }),
  schema: z.object({
    title: z.string(),
    part: z.number(),
    order: z.number(),
    summary: z.string(),
    minutes: z.number(),
    domain: z.enum(['intro', 'basics', 'workloads', 'arch', 'network', 'storage', 'trouble', 'strategy']),
    goals: z.array(z.string()),
    labs: z.array(z.string()).default([]),
    quiz: z.array(z.object({ q: z.string(), options: z.array(z.string()), answer: z.number(), explain: z.string() })).default([]),
  }),
});

export const collections = { blog, cka };
