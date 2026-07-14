---
title: "ASML: The One Company Every AI Chip Must Pass Through"
description: "Every Nvidia GPU and every HBM stack begins inside a machine only one company on Earth can build. What ASML's EUV monopoly actually is, why it is the bedrock layer of AI hardware, and how the stock traveled the AI boom — from a $363 chip-winter low to a $1,768 record."
date: 2026-07-14T11:00:00
lang: en
key: asml-ai-hardware-bedrock-2026
author: menew
category: semiconductors
---

Strip the AI boom down to its foundations and you arrive at a factory campus in Veldhoven, a Dutch town most people cannot place on a map. Every leading-edge AI chip on Earth — every Nvidia GPU, every stack of high-bandwidth memory, every custom accelerator Google or Amazon designs — begins its life inside an extreme ultraviolet lithography machine. Exactly one company can build that machine: ASML.

We have written about [the HBM memory bottleneck](/blog/hbm-ai-bottleneck-2026/) and [Nvidia's regulatory siege](/blog/nvidia-antitrust-2026/). This piece goes one layer deeper, to the bottom of the AI hardware pyramid — and to a stock that tells the whole AI boom in one chart, crash included. ASML reports Q2 results on July 15, which makes this a good moment to lay out what the company actually is.

## What ASML actually does

ASML, spun out of Philips in 1984, makes lithography machines — the tools that print circuit patterns onto silicon wafers with light. Lithography sets the floor for how small a transistor can be, which makes it the pacemaker of Moore's Law: chips only shrink as fast as the light source does.

The current pinnacle is EUV — extreme ultraviolet. The physics reads like science fiction: a molten tin droplet, fifty thousand times per second, is hit mid-flight by a high-power CO₂ laser and vaporized into plasma that radiates 13.5-nanometer light. Because that wavelength is absorbed by air and by every known lens material, the light must travel through vacuum and be steered by Zeiss mirrors polished to sub-atomic flatness — reportedly the most precise mirrors ever manufactured. A single machine integrates roughly a hundred thousand parts from a network of some five thousand suppliers, ships in about 40 freight containers, and costs on the order of €200 million. The next generation costs nearly twice that.

Nobody else makes one. Nikon and Canon, the lithography giants of the 1990s, abandoned the EUV race years ago; the technology consumed roughly two decades and well over $10 billion of R&D before it worked commercially. ASML's EUV market share is, for all practical purposes, 100%.

## Why this is the bedrock of AI hardware

The AI supply chain is usually drawn as a pyramid: models on top, then GPUs, then the foundries (TSMC, Samsung) and memory makers (SK Hynix, Micron, Samsung) that fabricate them. ASML sits beneath all of it. Sub-7-nanometer logic — the class every AI accelerator belongs to — cannot be produced in volume without EUV. And the connection to AI memory has tightened: the newest DRAM generations that feed [HBM4](/blog/hbm-ai-bottleneck-2026/) increasingly rely on EUV layers too. When hyperscalers announce hundred-billion-dollar capex plans, some fraction of that money ends, with a lag, as purchase orders in Veldhoven.

The next chapter is High-NA EUV — numerical aperture raised from 0.33 to 0.55, printing finer features in fewer steps. Here the customer map is unusually revealing. [Intel deployed the industry's first High-NA system](https://www.trendforce.com/news/2026/05/20/news-asml-expects-first-high-na-euv-memory-logic-products-within-months-amid-tsmcs-cost-driven-delay/) (the Twinscan EXE:5200B) in December 2025 and is betting its 14A node on it; ASML's CEO said in May 2026 that the [first High-NA-made products are months away](https://anysilicon.com/news/asml-expects-first-high-na-euv-chips-within-months-as-tsmc-delays-adoption-over-cost-concerns/). TSMC, by contrast, has told ASML it won't use High-NA for volume production [before 2029, citing the €350-million-plus price per machine](https://www.trendforce.com/news/2026/05/01/news-behind-tsmcs-high-na-euv-deferral-low-na-stays-strong-customer-landscape-shifts-and-asml-quietly-pivots/); Samsung and SK Hynix are aiming around 2027. A monopolist whose biggest customer can afford to say "later" — that tension is the one genuinely open question in the story.

## The stock: the AI boom in one chart

ASML's share price (US-listed ADR) is close to a complete history of the AI cycle:

| When | Price (approx.) | What was happening |
|---|---|---|
| Late 2021 | ~$895 peak | pandemic chip super-cycle |
| October 2022 | ~$363 trough | chip winter, −60% from peak |
| July 2024 | ~$1,100 | ChatGPT-era AI rally |
| October 15, 2024 | −16% in a day | Q3 bookings shock: €2.6B vs ~€5.4B expected |
| July 10, 2026 | ~$1,768 record | +35% YTD, +107% in 12 months |

Two episodes deserve attention. The first is the [October 2024 crash](https://news.futunn.com/en/post/48768331/asml-shares-crash-16-over-bookings-miss-guidance-cut-and): revenue actually beat that quarter, but new bookings came in at half of estimates as non-AI demand (autos, phones, industrial) stayed weak and China orders normalized after two years of pull-forward. The market's lesson: even a 100% monopoly is a cyclical company, and it gets priced on the cycle, not the moat.

The second is the recovery since. Q4 2025 bookings hit a record €13.2 billion (€7.4 billion of it EUV); [full-year 2025 closed at €32.7 billion in sales and €9.6 billion net income](https://www.asml.com/en/news/press-releases/2026/q4-2025-financial-results); [Q1 2026 delivered €8.8 billion at a 53% gross margin](https://www.asml.com/en/news/press-releases/2026/q1-2026-financial-results), and management [raised full-year 2026 guidance to €36–40 billion](https://finance.yahoo.com/markets/stocks/articles/asml-lifts-2026-sales-outlook-021328025.html), explicitly crediting AI-driven demand as customers accelerate capacity plans. One notable footnote: from Q1 2026 ASML stopped publishing quarterly bookings at all, arguing lumpy mega-orders distort the signal — a luxury only a monopolist enjoys, and a direct response to the 2024 whiplash.

## The numbers

| Metric | Value |
|---|---|
| FY2025 net sales | €32.7B |
| FY2025 net income | €9.6B (~29% net margin) |
| Q1 2026 sales / gross margin | €8.8B / 53.0% |
| FY2026 guidance | €36–40B (raised from €34–39B) |
| Q4 2025 bookings (last published) | €13.2B record |
| EUV market share | ~100% |
| High-NA price per unit | >€350M |

## Risks the moat does not cover

A monopoly on the machine is not a monopoly on the cycle. Four things can hurt ASML without any competitor appearing: (1) **capex timing** — if the AI buildout pauses, as [the capex-vs-revenue gap debate](/blog/ai-bubble-2026-debate/) suggests it eventually must, orders stall first at the equipment layer; (2) **China policy** — EUV has never been exportable to China and DUV restrictions keep tightening, structurally capping a market that recently supplied a large slice of revenue; (3) **customer concentration** — a handful of buyers (TSMC, Samsung, Intel, SK Hynix, Micron) sets demand, and TSMC's High-NA deferral shows they have real bargaining power on technology transitions; (4) **geopolitics** — ASML's fortunes are inseparable from Taiwan's, where most EUV machines physically operate.

None of that changes the structural fact: as long as humanity wants smaller transistors — and AI has given it the most expensive reason in history to want them — every road runs through Veldhoven. The picks-and-shovels trade of the AI era has a picks-and-shovels trade of its own, and it has exactly one name on it.

*Nothing in this article is financial or investment advice. Figures are from company disclosures and cited reporting as of July 14, 2026; verify against original sources before making decisions.*

### Sources

- [ASML — Q1 2026 financial results (€8.8B sales, €2.8B net income)](https://www.asml.com/en/news/press-releases/2026/q1-2026-financial-results)
- [ASML — FY2025 results (€32.7B sales, €9.6B net income)](https://www.asml.com/en/news/press-releases/2026/q4-2025-financial-results)
- [Yahoo Finance — ASML lifts 2026 sales outlook on AI demand](https://finance.yahoo.com/markets/stocks/articles/asml-lifts-2026-sales-outlook-021328025.html)
- [TrendForce — Behind TSMC's High-NA deferral (May 2026)](https://www.trendforce.com/news/2026/05/01/news-behind-tsmcs-high-na-euv-deferral-low-na-stays-strong-customer-landscape-shifts-and-asml-quietly-pivots/)
- [AnySilicon — First High-NA EUV chips within months (May 2026)](https://anysilicon.com/news/asml-expects-first-high-na-euv-chips-within-months-as-tsmc-delays-adoption-over-cost-concerns/)
- [Futu News — ASML shares crash 16% on bookings miss (Oct 2024)](https://news.futunn.com/en/post/48768331/asml-shares-crash-16-over-bookings-miss-guidance-cut-and)
- [TOPONE Markets — ASML stock analysis, July 2026 price levels](https://www.top1markets.com/news/asml-stock-analysis-euv-lithography-semiconductor-equipment-earnings)
