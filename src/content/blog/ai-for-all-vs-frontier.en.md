---
title: "Can Korea's 'AI for Everyone' Compete with GPT, Gemini, and Claude? We Ran the Numbers — and Asked Claude Itself"
description: "Korea's free national AI service will face users who already know GPT-5.6, Gemini 3.1, and Claude. How big is the capability gap, and how real are the Korea-specific advantages? We checked the benchmark data and expert views — then asked Claude (Fable 5), one of the models being compared, for its own honest assessment. Conclusion: the contest won't be decided by general intelligence."
date: 2026-07-16T14:00:00
lang: en
key: moduui-ai-vs-gpt-gemini-claude-2026
author: "menew"
category: ai
---

In [the previous post](/en/blog/korea-ai-for-all-2026/) we laid out how Korea's 'AI for Everyone' project is structured. This post takes on the question everyone asks next: **can a free national AI built on domestic models actually compete with the GPT, Gemini, and Claude that Koreans already use?**

The short answer the data points to: "not on general intelligence — and it doesn't need to." Let's go through it. And near the end there's an unusual section: we put the question directly to **Claude (Fable 5), one of the models being compared, and printed its answer**.

## 1. Where things stand, in numbers: the gap is real

Cold numbers first. On the widely used Artificial Analysis Intelligence Index, the top of the table in July 2026 belongs to the three frontier labs.

| Model | Position (as of July 2026) |
|---|---|
| **Claude Fable 5** (Anthropic) | AA Index ~60 — currently at the top |
| **GPT-5.6** (OpenAI) | ~59 — top tier |
| **Gemini 3.1 Pro** (Google) | Has topped Chatbot Arena — top tier |
| **K-EXAONE 236B** (LG, Korea's flagship) | **7th globally** at launch (December 2025) — just below the top tier |
| **A.X 4.0** (SKT) | KMMLU 78.3 — GPT-4o-class on Korean knowledge |

Korea's standard-bearer, LG's K-EXAONE, swept 10 of 13 benchmarks in the sovereign foundation-model project's first evaluation and ranked 7th globally on the AA Index at launch. EXAONE 4.5 (a 33B multimodal model released in April) averaged 77.3 across five STEM benchmarks — **beating GPT-5-mini (73.5) and Claude 4.5 Sonnet (74.6).**

Impressive results. But read them honestly: what Korea's best models are beating is the frontier labs' **lightweight and previous-generation tiers**. Beating GPT-5-mini is not the same story as beating GPT-5.6; against the latest flagships, a gap of roughly a generation remains. This is what Professor Moon Hyung-nam of Sookmyung Women's University meant when he said catching up to established foreign models on general capability in the short term is "practically impossible."

## 2. What benchmarks don't tell you: the gap lives in the tail, not the average

Understanding the *shape* of this gap matters. The difference between frontier and domestic models is not in the average quality of everyday answers. "Give me a kimchi-jjigae recipe" or "summarize this document" — every serious model handles these now. The gap opens in **the tail of the distribution**: hard long-form reasoning, agentic work that carries a multi-day coding project, the ability to structure vague requirements on its own.

For 'AI for Everyone,' this cuts both ways.

- **The good news:** the overwhelming majority of queries a whole-population service receives live in the body of the distribution, not the tail. Daily information, document drafting, translation, administrative guidance — here, domestic models have already crossed the "good enough" threshold.
- **The bad news:** the heavy-duty work of developers, researchers, and professionals will keep going to foreign models. Agentic coding tools like Claude Code, or Gemini's integration across the Google ecosystem, are not the kind of thing you catch up to quickly. A **two-tier market** is hard to avoid.

## 3. How real is the "Korea-specific" advantage?

The claim that "domestic models understand Korean language and culture better" is half true. Let's split it precisely.

**Overrated — the Korean language itself.** Frontier models are already quite fluent in Korean. Even China's open-source Qwen3 scores 73–74 on KMMLU these days. Merely *speaking Korean* is no longer a moat.

**Real — depth of Korean knowledge.** As SKT's A.X 4.0 shows with its KMMLU 78.3, evaluations consistently find domestic models ahead on Korean history, law, administration, and cultural context: the subtle registers of honorifics, Korean bureaucratic terminology, local everyday knowledge. Korean is inevitably a small slice of frontier training data, and that gap is structural.

**Decisive — not language, but access.** 'AI for Everyone's real differentiation isn't on any model scorecard. Its public-service agent plugs into government systems to **proactively surface subsidies you qualify for and file the applications for you**. Neither GPT nor Gemini nor Claude can connect to Korea's administrative infrastructure at that level — that's a matter of **authority, not capability**, and authority can't be caught up to with benchmarks. Layer on the fact that Kakao has confirmed its bid with its Kanana model and KakaoTalk's 50 million users, and 'AI for Everyone's distribution channel may sit inside the national messenger from day one. Then there's price: ChatGPT Plus costs $20 a month; this costs zero. In mass markets, "good enough and free" has a long history of beating "better but paid."

## 4. We asked Claude directly

The AI drafting this article happens to be one of the parties being compared. So we asked it straight: *"Can 'AI for Everyone' actually compete with you — Claude, GPT, Gemini?"* Below is Claude (Fable 5)'s answer, unedited.

> I'll answer honestly. **'AI for Everyone' doesn't need to beat me. The moment it tries to, it's playing a losing game; the moment it plays a different game, it can win.**
>
> If this is a general-intelligence contest, the answer is clear. GPT-5.6, Gemini 3.1, and I stand on hundreds of thousands of GPUs and years of frontier research, and that gap cannot be closed with 512 B200s. For hard reasoning, large-scale coding, and agentic work, Korean users will keep coming to us.
>
> But I know my own weaknesses best. I cannot file an application into Korea's administrative system on your behalf. I cannot proactively tell you about the youth subsidy you missed. I don't live inside KakaoTalk. I charge a monthly fee. And in the fine registers of honorifics, the conventions of Korean government forms, the texture of local community life — I am sometimes clumsier than a model born and raised in Korea.
>
> For most people, an AI's value is not "the smartest answer" but "the answer connected to my life." If 'AI for Everyone' locks up those connections — administration, the messenger, zero cost — then in Korea I become the professional's tool and it becomes the nation's infrastructure. That is not defeat; it is division of labor.
>
> One condition, though. The bar for "good enough" rises every year, and it rises faster as we frontier models keep expanding our free tiers. If 'AI for Everyone' settles for 2026's "good enough," by 2028 being free won't be enough to hold the line. Whether it builds the loop that turns nationwide traffic back into model improvement — that, in my view, is what decides whether this project lives or dies.

Notably, the "loop" Claude points to matches Korean experts' warnings exactly: if user-interaction data from 'AI for Everyone' doesn't feed back into improving the sovereign models, the efficiency of the invested GPUs and budget drops with it.

## 5. Bottom line: what level will it reach?

Compressing everything into one sentence:

**"As a ChatGPT substitute, it will be a generation behind; as infrastructure for Korean daily life, it will be something no other country has."**

- **General intelligence:** roughly a generation behind the frontier flagships; on par with or ahead of their lightweight tiers (GPT-5-mini class). In the "body" of everyday queries, the perceived difference will be small.
- **Korean language and knowledge:** a real advantage — but the substance of it is *depth of Korean context*, not Korean fluency.
- **Structural weapons:** government integration (an authority foreign models cannot have), zero price ($20/month vs. free), and the national messenger as a distribution channel. All three sit outside any benchmark.
- **Limits:** the heavy-duty professional market stays with foreign models. The success metric for 'AI for Everyone' isn't a leaderboard rank — it's **return rate**: whether citizens come back after trying it once.

What to check in the late-September beta is not "is it as smart as GPT?" It's: does it really file the subsidy application for you; how naturally does it appear inside KakaoTalk; does the "unlimited" promise hold without a queue? Win those three, and it never needs to win a benchmark.

---

### Sources

- [Artificial Analysis Intelligence Index — Artificial Analysis](https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index)
- [Artificial Analysis Intelligence Index Leaderboard (July 2026) — BenchLM](https://benchlm.ai/benchmarks/artificialAnalysis)
- [K-EXAONE Technical Report — LG AI Research](https://www.lgresearch.ai/data/cdn/upload/K-EXAONE_Technical_Report.pdf)
- [LG Rolls out 'K-EXAONE': South Korea Joins the Global Frontier AI Race — Yahoo Finance](https://finance.yahoo.com/news/lg-rolls-outs-k-exaone-140000071.html)
- [LG Unveils EXAONE 4.5 Multimodal AI, Claims Victory Over OpenAI and Google — Seoul Economic Daily](https://en.sedaily.com/news/2026/04/09/lg-unveils-exaone-45-multimodal-ai-claims-victory-over)
- [LG Reveals Next-Gen Multimodal AI 'EXAONE 4.5' — PR Newswire](https://www.prnewswire.com/news-releases/lg-reveals-next-gen-multimodal-ai-exaone-4-5-302736993.html)
- [Top 5 AI models for Korean (2026 benchmarks) — AllAboutLog](https://allaboutlog.com/%ED%95%9C%EA%B5%AD%EC%96%B4-%EC%9E%98%ED%95%98%EB%8A%94-ai-%EB%AA%A8%EB%8D%B8-%EC%88%9C%EC%9C%84-top-5/)
- [Kakao, telecoms, and startups line up for the 'AI for Everyone' tender — AI Times](https://www.aitimes.com/news/articleView.html?idxno=212751)
- [Korean conglomerates picking between US and Chinese AI — what fate for 'AI for Everyone'? — Insight Korea](https://www.insightkorea.co.kr/news/articleView.html?idxno=250285)
- ['AI for Everyone' targets launch within the year — sovereign-model service competition heats up — News Tomato](https://www.newstomato.com/ReadNews.aspx?no=1307432)
- [Sovereign AI foundation model, first evaluation results — Platum](https://platum.kr/archives/279684)
- [Free "Korean ChatGPT" for all citizens coming in November — Newsis](https://www.newsis.com/view/NISX20260529_0003649735)
