---
title: "全面超预期，股价却跌了5% — AMD财报真正考验的是什么"
description: AMD第二季度营收115亿美元，数据中心同比增长107%，第三季度指引也高于市场共识。可股价在盘后仍下跌超过5%。问题从来不是数字，而是价格里早已包含的预期。对韩国存储芯片而言，这份财报留下了比股价更重要的信号。
date: 2026-08-05T10:00:00
lang: zh
key: amd-q2-2026-beat-and-drop
author: menew
category: semiconductors
---

韩国时间8月5日凌晨，韩国半导体投资者等待的数字出炉了：AMD第二季度财报。

前一天，KB证券[指出](https://www.mt.co.kr/stock/2026/08/04/2026080416551484894)，8月5日凌晨的AMD财报将决定相对弱势的半导体股能否扭转气氛。8月4日韩国综合指数上涨1.62%至6,358.95点，但三星电子（+0.21%）和SK海力士（+0.64%）几乎原地踏步。推高指数的是非半导体板块，芯片股在观望。

然后AMD几乎每一项都超出了市场预期。股价却跌了。

## 数字赢了

| 项目 | 二季度 | 同比 | 市场共识 |
|---|---|---|---|
| 营收 | 115.4亿美元 | +50% | 112.8亿美元 |
| 调整后每股收益 | 1.66美元 | +246% | 1.61美元 |
| GAAP每股收益 | 1.38美元 | +156% | — |
| GAAP毛利率 | 54% | +14个百分点 | — |

按业务拆分，图景更清晰（依据[AMD公告](https://ir.amd.com/news-events/press-releases/detail/1295/amd-reports-second-quarter-2026-financial-results)）：

| 业务 | 营收 | 同比 |
|---|---|---|
| 数据中心 | 67.2亿美元 | **+107%** |
| 客户端 | 30.6亿美元 | +23% |
| 嵌入式 | 9.77亿美元 | +19% |
| 游戏 | 7.79亿美元 | **-31%** |

仅数据中心一项就占全公司营收的58%，一年翻了一倍。CEO苏姿丰表示，数据中心营收同比增长超过一倍，并称人工智能正在推动公司所有市场的算力需求大幅扩张。

第三季度指引为**约130亿美元（±3亿）**，高于125.2亿美元的市场共识。这是教科书式的超预期加上调指引。

## 股价还是跌了

盘后交易中，AMD[下跌5.48%至490.18美元](https://www.benzinga.com/markets/earnings/26/08/60931767/amd-delivers-double-beat-in-q2-as-data-center-revenue-more-than-doubles)。财报直播[显示](https://247wallst.com/investing/2026/08/04/live-is-amd-about-to-smash-q2-earnings-after-rising-8-today/)，跌幅一度扩大到接近9%。

原因不在财报表里，而在表外。

进入这份财报时，AMD**年初至今已上涨146%**。对涨幅如此之大的股票来说，市场共识早已不是要跨过的门槛。真正的门槛是买方在公开预估之上加码的那个「耳语数字」。130亿美元的指引比共识高出5亿美元，却没有高过边际买家已经计入价格的期待。

还有第二点：增速的方向。二季度的50%，按三季度指引计算降至约41%。绝对水平依然惊人，但**AI股的估值反应的是增速的导数，而不是增速本身。** 这与我们在[资本开支的财报大考](/zh/blog/ai-capex-earnings-test-2026/)中梳理的机制相同。当好财报开始翻译成坏股价，市场投票的对象就不再是公司，而是价格。

从[AI泡沫之争](/zh/blog/ai-bubble-2026-debate/)的角度看，这种反应反而偏健康：只要报出AI营收就无条件被买入的阶段，已经过去了。

## MI400与Helios：真正的新闻在这里

比股价更长久的内容在产品线。AMD本季度正式推出了**Instinct MI400系列**。

- **MI455X** — 面向大规模AI训练与推理的旗舰：FP4算力40 PFLOPS，**432GB HBM4**，带宽19.6TB/s。
- **MI430X** — 面向高性能计算与主权AI负载。
- **Helios** — 机柜级平台，单机柜最高3 AI EFLOPS，2026年下半年放量。

客户名单更重要。AMD明确列出**Anthropic、Meta、微软、OpenAI、甲骨文**为Helios采用方，并与Anthropic达成合作，部署规模最高达**2吉瓦**的MI450系列GPU。

2吉瓦是电力单位，不是营销措辞。它不是在说性能好，而是说有人签了合同要实际插上这么多。我们在[HBM瓶颈](/zh/blog/hbm-ai-bottleneck-2026/)一文中描述的结构——AI硬件需求事实上被绑定在一家公司的路线图上——正是从这里出现裂缝。

## 对韩国存储意味着什么

以下是对投资者最有实际意义的部分。

HBM市场最大的风险从来不是技术，而是**客户集中**。绝大部分需求来自单一买家。英伟达的订单计划，实际上就是三家存储厂的业绩计划。这也是[针对英伟达的监管包围网](/zh/blog/nvidia-antitrust-2026/)会成为韩国存储股变量的原因。

一张MI455X装载432GB HBM4，而愿意吃下这批量的锚定客户已经签字。**这意味着HBM出现了第二个真实买家。**

供应方的排布同样值得看。目前的报道版本是：

- SK海力士据称[拿下](https://www.trendforce.com/news/2026/01/28/news-sk-hynix-reportedly-to-supply-about-two-thirds-of-nvidia-hbm4-samsung-targets-early-delivery/)英伟达Vera Rubin平台约三分之二的HBM4份额。
- 三星电子则被[认为](https://markets.financialcontent.com/stocks/article/tokenring-2026-1-26-the-hbm4-era-begins-samsung-and-sk-hynix-trigger-mass-production-for-next-gen-ai)在英伟达之外，取得了向AMD供应HBM4的位置。

必须说明：两者都是业界报道，而非确定公告。但若方向无误，结论很简单：**AMD数据中心业务的成长，对三星电子的杠杆相对大于SK海力士。** 在英伟达价值链里排第二的一方，在第二条价值链里有机会成为锚。

## 天平的另一端

同一份财报也支持看空的读法。

**第一是供给。** 8月4日韩国芯片股跑输指数，原因不只是等待AMD。大信证券[指出](https://www.mt.co.kr/stock/2026/08/04/2026080416551484894)，中国长鑫存储（CXMT）考虑新建工厂的消息，使存储供给扩张的可能性受到关注，加大了芯片股的下行压力。多一个HBM买家，与通用DRAM供给增加，会在同一张损益表上朝相反方向拉扯。

**第二，AI之外并不好。** 游戏业务同比下滑31%。AMD的增长靠的是数据中心一条腿，不是四条。这条腿一晃，缓冲很薄。

**第三，放量仍是将来时。** MI450系列与Helios的量产在2026年下半年。2吉瓦是跨越数年执行的数字，不是本季度营收。发布与收入确认之间的时间差，在这个行业长期被低估。

## 观察要点

| 要看什么 | 为什么重要 |
|---|---|
| 英伟达下一份财报 | 区分是AI加速器需求整体放缓，还是份额向AMD转移 |
| HBM4 16层量产时间 | SK海力士能否达成三季度目标，决定供应商座次 |
| AMD的HBM4供应商落定 | 三星被报道的位置能否变成公开合同 |
| MI450下半年放量 | 2吉瓦转化为实际出货的速度 |
| 长鑫扩产进度 | 通用DRAM供给何时开始压制存储价格周期 |

## 小结

AMD做得很好。营收、毛利率、指引都高于预期，数据中心一年翻倍。股价下跌不是因为公司差，而是因为**价格里已经包含了比公司交付更多的东西。** 在2026年的AI板块里，分不清这两件事，就会在每个财报季读错方向。

留给韩国投资者的一句话是：这份财报的核心不是AMD的股价，而是**HBM正在获得第二个真实买家**。这个买家从谁那里采购存储，将决定未来几个季度三星电子与SK海力士的相对表现。

*本文为信息目的的分析，不构成投资建议。文中数字来自公司公告与媒体报道；涉及供应安排的内容为业界报道，并非已确认的正式披露。*

### 来源

- [AMD Reports Second Quarter 2026 Financial Results — AMD IR](https://ir.amd.com/news-events/press-releases/detail/1295/amd-reports-second-quarter-2026-financial-results)
- [AMD Delivers Double Beat in Q2 as Data Center Revenue More Than Doubles — Benzinga](https://www.benzinga.com/markets/earnings/26/08/60931767/amd-delivers-double-beat-in-q2-as-data-center-revenue-more-than-doubles)
- [AMD Q2 Earnings: $11.5B Revenue, Up 50% — StockTitan](https://www.stocktitan.net/news/AMD/amd-reports-second-quarter-2026-financial-s9qsl4zgkkw3.html)
- [Live: Is AMD About to Smash Q2 Earnings — 24/7 Wall St.](https://247wallst.com/investing/2026/08/04/live-is-amd-about-to-smash-q2-earnings-after-rising-8-today/)
- [韩国股市收盘 2026年8月4日 — MoneyToday](https://www.mt.co.kr/stock/2026/08/04/2026080416551484894)
- [SK hynix Reportedly to Supply About Two-Thirds of NVIDIA HBM4 — TrendForce](https://www.trendforce.com/news/2026/01/28/news-sk-hynix-reportedly-to-supply-about-two-thirds-of-nvidia-hbm4-samsung-targets-early-delivery/)
- [The HBM4 Era Begins: Samsung and SK Hynix Trigger Mass Production — FinancialContent](https://markets.financialcontent.com/stocks/article/tokenring-2026-1-26-the-hbm4-era-begins-samsung-and-sk-hynix-trigger-mass-production-for-next-gen-ai)
