---
title: "Kimi K3 把芯片股拖入熊市——但数字讲的并不是标题党讲的那个故事"
description: "月之暗面(Moonshot AI)推出的2.8万亿参数模型Kimi K3，本周把费城半导体指数拖入了正式熊市，交易员称之为DeepSeek时刻重演。但价格数据讲的是另一个故事——这个模型其实并不便宜。这里梳理实际发生了什么，以及这对三星和SK海力士押注的AI资本支出意味着什么、又不意味着什么。"
date: 2026-07-18T09:00:00
lang: zh
key: kimi-k3-semiconductor-bear-market-2026
author: menew
category: markets
---

费城半导体指数(SOX)较6月22日高点已下跌20.2%，正式进入熊市——创下自去年4月以来最糟糕的一个月。英伟达因这则消息下跌2.21%，AMD跌1.03%，闪迪跌近4%，英特尔跌2%。台湾加权指数单日暴跌超过6%，日本股市收跌4%，纳斯达克创下当周最差单日表现。引发这一切的既不是财报爆雷，也不是美联储决议，而是一款来自北京的AI模型发布。

中国创业公司月之暗面(Moonshot AI)在7月16日深夜发布了Kimi K3，交易员一觉醒来就开始把它和2025年初那次原版"DeepSeek时刻"相提并论——正是那次事件，第一次给"有能力的AI或许根本不需要科技巨头们承诺投入的那数千亿美元芯片和数据中心"这种恐惧，安上了一个具体的数字。这种恐惧是真实存在的，也不会消失。但Kimi K3真实的价格数据讲述的，是一个比"廉价中国AI再次出手"复杂得多的故事，而标题和数字之间的这道落差，值得停下来好好看看。

## Kimi K3究竟是什么

Kimi K3拥有2.8万亿参数，是迄今发布的最大开源权重模型——采用混合专家(MoE)架构，具备100万token的上下文窗口。在独立评测机构Artificial Analysis的基准测试中，它的得分与Anthropic的Claude Opus 4.8、OpenAI的GPT-5.5处于同一档位，只落后于最新的旗舰级别(Claude Fable 5、GPT-5.6 Sol)。在部分单项基准测试(自动化任务、电子表格操作、网页浏览)中，它甚至直接登顶。一个开源权重模型能在真实基准测试中追平闭源前沿模型，这确实是一个真正的里程碑，也正是它立刻被拿来和DeepSeek当初那次冲击相比较的原因。

## 价格数据实际显示了什么

问题恰恰出在这里，比较开始站不住脚。DeepSeek最初的模型便宜得令人震惊——价格比美国实验室低了一个数量级，而这正是当时吓坏市场的原因:如果一个有能力的模型运行成本几乎为零，那么持续砸钱购买更多GPU和内存这整套逻辑看起来就站不住脚了。Kimi K3不是这样的模型。月之暗面把它的定价定在每百万输入token 3美元、每百万输出token 15美元——正好落在Anthropic的Claude Sonnet档位，大约是DeepSeek自家最新模型V4 Flash输出价格(0.28美元)的21倍。按Artificial Analysis测算的单任务实际成本，Kimi K3约为0.94美元，比GPT-5.6 Sol的1.04美元便宜，也远低于Claude Opus 4.8的1.80美元——但这个优势来自于解决一个任务所需的输出token更少，而不是因为单价token的价格触底。这是一个实验室在为接近前沿水准的能力，定出接近前沿水准的价格，而不是一个实验室在白送能力。

这个区别对于这次发布究竟证明了什么、又没有证明什么，至关重要。它确实是中国开源权重实验室与美国前沿实验室之间能力差距正在迅速缩小的实证——月之暗面直接从Kimi K2的1万亿参数，越过DeepSeek、小米等所有对手，一步跳到了2.8万亿。但作为"AI算力即将变得一文不值"的证据，它就弱得多了——而这恰恰正是眼下这场20%跌幅的半导体熊市据称正在计入的那种具体恐惧。

## 那市场为什么还是抛售了

被烫过一次的市场，往往习惯先抛售、再回头看价格表。"中国实验室发布开源权重模型→基准测试看起来有竞争力→市场恐慌科技巨头投入AI基础设施的那约7000亿美元收不回来"，这套DeepSeek式剧本，如今已经成了交易员一眼就能认出的模式，而Kimi K3(中国实验室、开源权重、有竞争力的基准分数)在外形上和这套模式足够相似，因而触发了同样的条件反射——尽管这一次，实际的定价细节并不支持"AI算力正在变得免费"这个版本的恐惧。完整的模型权重定于7月27日公开发布;在开发者能够亲自运行并压力测试这些说法之前，那些自我披露的基准数据，终究只是自我披露而已。

## 韩国这条线

在这件事发生之前，三星电子和SK海力士本就已经神经紧绷。这两只股票刚刚经历了艰难的一周，起因是另一件事——中国存储芯片厂商长鑫存储(CXMT)约14万亿韩元规模的IPO，引发了市场对三星、SK海力士、美光三家存储寡头格局可能被打破的担忧，再叠加SK海力士纳斯达克ADR上市后由套利交易带来的股价剧烈波动。那是一个供给侧的担忧(韩美存储厂商能否保住定价权)，而Kimi K3带来的则是一个需求侧的担忧(科技巨头是否会继续按现在的规模采购算力)。这是两个不同的问题，但在同一周砸向了同样这两只股票，这也是为什么这次的跌幅让人感觉比任何单一事件本身所能解释的都要大。Kimi K3的发布，丝毫没有改变SK海力士一直在强调的那套供需测算——未来至少三年HBM需求都将超过供给。但一个紧张的市场，不会等你把这两件事分清楚了再抛售。

## 真正能改变局面的变量

值得关注的不是和DeepSeek的标题式类比，而是这三件事:7月27日公布的开源权重，能否在独立测试而非自我披露的分数下站得住脚;Kimi K3的溢价定价(而非它的能力)，会不会在下个季度科技巨头的资本支出指引中有所体现——因为真正决定更便宜的算力是否会成为现实的，是价格，而不是基准测试分数;以及三星电子和SK海力士的HBM订单簿——作为真实AI需求最具体的证据——是否出现任何松动的迹象。截至本周，尚未出现。一款以Claude Sonnet级别价格、卖出Claude Opus级别性能的模型，确实是一次真正的竞争事件。但就目前为止的数据来看，它还不是一场20%跌幅的半导体熊市所暗示的"AI刚刚变得免费"那种事件。

*本文内容均不构成金融或投资建议。关于Kimi K3基准测试和定价的数据，均取自月之暗面自身发布的资料及第三方评测机构(Artificial Analysis)截至发稿时的评估，待7月27日权重公开后经独立验证，可能会有所修正。市场涨跌数据均为所引用日期当时的情况，读者阅读本文时可能已经发生变化。作者未持有本文所涉证券的仓位。*

### 资料来源

- [CryptoBriefing — Moonshot's Kimi K3 sends AI and semiconductor stocks into a tailspin](https://cryptobriefing.com/moonshot-kimi-k3-ai-semiconductor-stocks-selloff/)
- [Yahoo Finance/Decrypt — Kimi K3 Just Triggered DeepSeek Flashbacks for the Stock Market](https://finance.yahoo.com/markets/stocks/articles/kimi-k3-just-triggered-deepseek-175532711.html)
- [Bloomberg — Moonshot Unveils Kimi K3 AI Model, Narrowing Gap With US Rivals](https://www.bloomberg.com/news/articles/2026-07-17/china-s-powerful-new-moonshot-ai-model-closes-gap-with-us-rivals)
- [VentureBeat — China's Moonshot AI releases Kimi K3, the largest open-source model ever](https://venturebeat.com/technology/chinas-moonshot-ai-releases-kimi-k3-the-largest-open-source-model-ever-rivaling-top-u-s-systems)
- [The Decoder — Kimi's open model K3 nears GPT-5.6 Sol and Fable 5 while signaling the end of super cheap Chinese AI](https://the-decoder.com/kimis-open-model-k3-nears-gpt-5-6-sol-and-fable-5-while-signaling-the-end-of-super-cheap-chinese-ai/)
- [자본시장뉴스(韩国) — 키미 K3 '제2 딥시크 모먼트'…이번엔 '프리미엄'으로 정면 도전](https://www.jabon.co.kr/news/articleView.html?idxno=5045)
- [뉴스핌(韩国) — 뉴욕증시, 반도체 약세장 진입 여파에 일제히 하락](https://www.newspim.com/news/view/20260718000012)
- [Simon Willison — Kimi K3, and what we can still learn from the pelican benchmark](https://simonwillison.net/2026/Jul/16/kimi-k3/)
