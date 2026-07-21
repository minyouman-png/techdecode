---
title: "Kimi K3在48小时内耗尽了GPU——这件事比跑分说明了更多"
description: "月之暗面在发布两天后暂停了Kimi K3的新订阅，因为其GPU集群已达上限。把它与7月27日的开源权重发布、微软为削减6亿美元成本而进行的测试，以及美国对华出口管制放在一起读，这次暂停看起来不像成长的烦恼，而更像是战略本身。本文深入分析成因、经济逻辑与后续走向。"
date: 2026-07-22T10:00:00
lang: zh
key: kimi-k3-gpu-crunch-2026
author: menew
category: ai
---

7月16日月之暗面发布Kimi K3时，市场把它当作一则跑分新闻来看待:2.8万亿参数、100万token上下文窗口、逼近前沿的分数，以及一轮把费城半导体指数拖入熊市的抛售。然而到了7月19日——发布仅48小时后——月之暗面停止接收新订阅用户，因为需求已经把它的GPU集群推到了极限。

从信息量上看，第二件事要有分量得多。跑分是自我披露的、存在争议的;而**一家公司把愿意付钱的客户拒之门外，是一道被摆到明面上的硬约束**。而当你把这次暂停，与同一周发生的另外三件事并排来看——定于7月27日的开源权重发布、有报道称微软正在测试K3以削减Copilot推理成本，以及美国对华AI芯片出口管制的现状——一种不同的解读就浮现了出来。这次算力见底并不是月之暗面战略的一个脚注。它很可能**正是那个战略的原因**。

## 实际发生了什么

月之暗面于7月19日，即7月16日发布约两天后，暂停了Kimi K3的新订阅，并表示此前48小时的需求已逼近其当前容量的极限。已有订阅用户不受影响，公司称将分批重新开放新订阅名额。API保持可用;被关闭的是面向消费者的订阅层。

这份需求是真实且可量化的。K3以约1,679分登顶Arena AI的前端编程排行榜，在该项基准上超越了GPT-5.6 Sol和Claude Fable 5，而定价为每百万输入token 3美元、输出15美元——处在Claude Sonnet的价位区间，却在部分任务上以远低于Opus的价格给出了Opus级别的结果。这样好、这样便宜的模型，被开发者们在一个周末里发现，任何现存的服务容量都会被撑满。

## 为什么会见底——这是结构问题，不是运营失误

任何实验室都可能误判发布时的需求量。这次不同之处在于，**月之暗面的天花板是由政策而非采购决定的**。

自2022年起，美国出口管制就禁止中国企业获取英伟达H100及此后的Blackwell世代加速器。H200在2026年1月特朗普政府政策转向后有条件放开，但须经工业与安全局(BIS)逐案审查，每批出货加征关税，且对华销售设有数量上限。月之暗面为K3公开的内核优化基准提到了英伟达H200硬件却未披露其所在地，旁边还并列着一项该公司技术博客仅描述为**「来自替代供应商的GPGPU」**的东西——没有名字。这个表述承载了大量信息，也是目前可得的最明确信号:月之暗面正在**把一切合法可及的算力资源搜刮到一起**。

在获准出口的旧款芯片这一侧，供应状况同样不容乐观。英伟达的中国合作伙伴新华三(H3C)已就需求激增下的H20短缺发出警告，称库存几近耗尽，国际供应链面临其所说的重大不确定性。而当2026年3月监管不确定性使对华H200销售陷入停滞时，英伟达把台积电的产能从H200转向了Vera Rubin——转向了那些已有OpenAI、谷歌等美国买家确认订单的产品线。**中国的实验室不只是被设了上限，而是排在了剩余产能队伍的最末尾。**

此外还有一重纯技术层面的放大效应。K3的架构使其服务成本高昂:这是一个从896个专家中激活16个的混合专家(MoE)设计，月之暗面建议部署在**至少64块加速器组成的超级节点**上，以便把专家并行的路由流量约束在单一高带宽互联域之内。这不是一个可以摊薄铺在零散闲置GPU上的模型。它要求密集、强耦合的集群——而这恰恰是出口管制让中国最难搭建起来的那种配置。

## 重新理解这次开源权重发布

月之暗面将于7月27日以修改版MIT许可证公开K3的权重。通常的解读是意识形态式的:中国实验室笃信开源模型，美国实验室则不然。但这次算力见底暗示了一种务实得多的读法。

一旦权重公开，大客户和云服务商就可以自行托管K3，彻底绕开月之暗面的排队。月之暗面那些受限的集群无法吸收的服务负载，**被分摊到了其他所有人的硬件上**——其中相当一部分在中国境外，跑在月之暗面自己都无法合法购买的芯片之上。开放权重的含义有很多，其中之一便是:**把一道硬性的基础设施天花板，转化为别人的运营支出，同时自己仍然稳稳占据生态位。**普通用户仍会涌向月之暗面的应用，所以拥堵是被缓解而非消失，但这个战略泄压阀是实打实的。

时间点也因此说得通了。如果在算力见底*之前*宣布权重公开，那看起来会像是慷慨。放在两天可见的饱和*之后*，它看起来就像是解决方案——而且恰好在八天之后落地，正是被挡在门外的用户不满达到顶点的时刻。

## 让「中国更便宜」这套叙事变复杂的经济学

对「廉价中国AI」叙事最有用的一记反驳，本周来自Stratechery的本·汤普森(Ben Thompson)，而它值得认真对待，因为它正面顶撞了那个显而易见的结论。

他的论点是:**开源权重免费的是下载，不是服务。**运行K3依然要付出实打实的销货成本(COGS)——GPU时间、内存、服务基础设施。而且这些成本不像训练那样可以摊销，而是**随使用量同比例增长**。汤普森认为，中国模型显得便宜并不是因为其边际成本更低;而是因为Anthropic和OpenAI受供给约束太深，其定价远高于「若供给能满足智能需求时」本该有的水平——所以相形之下显得便宜。前沿实验室是在训练主导GPU消耗的年代锚定价格的，在那个年代，为下一轮训练筹措资金意味着必须把推理收入最大化。

如果这个判断成立，那么有竞争力的开源权重模型的登场，做的事情就比单纯拉低美国实验室的价格更有意思。它**把整个行业拽回到一个边际成本和毛利率重新变得重要的世界**——那些在训练规模化年代里，所有人都得以推迟面对的枯燥基本功。而这也意味着，价格差距可能从任意一端收窄:要么中国实验室体会到大规模服务的昂贵，要么供给松动后的美国实验室主动降价。

## 微软那道6亿美元的选择题

这不是一则只关乎开发者的小众新闻，最清楚的证据在于:有报道称微软正在为Copilot测试K3，同时准备通过Azure上的Microsoft Foundry提供该模型，潜在的推理成本节约据称在**6亿美元**量级——其中一项估算将其表述为把Copilot的AI成本削减最多60%。

这里有几条分量很重的限定条件。这是任何大规模部署前的标准评估阶段;微软并未公开承诺要取代OpenAI或Anthropic;双方都没有宣布全面推广。但比起具体交易，更重要的是**方向**。Copilot正在演变为一个模型路由平台，按任务把负载分配给最好且最便宜的引擎——无论来自OpenAI、Anthropic、Meta，还是一家中国实验室。一旦路由成为架构，**任何模型供应商都不再握有结构性锁定，模型层开始表现得像一种大宗投入品。**

麻烦之处在于政治。将中国开发的模型大规模整合进美国企业基础设施，必然会招来审视——围绕数据治理、模型透明度和长期支持;据部分报道，还可能与现任政府产生摩擦。6亿美元的节约是一个有意义的数字。但要说它大到足以吸收一项没有上限的监管风险，恐怕并不显然。

## 接下来该预期什么

按对全局影响力从大到小，有四件事值得盯住。

**7月27日才是真正的试金石。**对已发布权重的独立评测，会证实或戳破那些自我披露的跑分。目前流通的所有数字——包括那些搅动了半导体指数的——都依赖于月之暗面自身的披露，外加有限的第三方评测。同时也要看，大规模服务的成本是否真的如其「64块加速器超级节点」的建议规格所暗示的那样昂贵;这个数字，是目前关于K3真实销货成本已公开信息中最接近下限的指标。

**算力短缺是否复发。**若月之暗面分批重开订阅后再次饱和，那就坐实了这一约束是结构性的，而非发布周的一次性尖峰。反之，如果权重公开后容量能从容吸收需求，说明负载转移策略奏效了，其他中国实验室会立刻效仿。

**微软是否走出评估阶段。**真正的生产环境部署，将成为美国超大规模云厂商把可观企业负载路由给中国模型的首个重大案例，并很可能同时触发监管层的反应，以及OpenAI和Anthropic的竞争性降价。若评估悄无声息地结束，那说明政治风险溢价超过了6亿美元。

**以及内存这条线。**上述种种没有一件削弱了HBM需求的论据;恰恰相反，一个需要64块加速器超级节点才能高效服务的模型，只会强化这个论据。但**机制**很关键:中国实验室买不到前沿加速器，意味着那部分需求会以西方超大规模云厂商订单的形式出现——而这正是三星和SK海力士已经在供货的那条渠道。真正该盯住的风险，不是「中国模型压制算力需求」。恰恰相反——**是出口管制持续把同样的需求，集中到数量更少、议价能力更强的西方买家手里。**

*本文仅供信息参考，不构成金融或投资建议。文中跑分、价格及所引数据均取自截至发稿时的公开报道与公司声明;其中多项关键数字仍属月之暗面自我披露，在7月27日权重公开前尚未经独立验证。请在据此采取任何行动前核实原始资料。*

### 资料来源

- [SCMP — Kimi K3 developer suspends new subscriptions amid compute constraints](https://www.scmp.com/tech/article/3361172/kimi-k3-developer-suspends-new-subscriptions-amid-compute-constraints)
- [The Decoder — Moonshot pauses new Kimi K3 subscriptions after GPU demand maxes out in 48 hours](https://the-decoder.com/moonshot-pauses-new-kimi-k3-subscriptions-after-gpu-demand-maxes-out-in-48-hours/)
- [TechTimes — Kimi K3 Subscription Pause Exposes GPU Crunch Behind Open-Weight Strategy](https://www.techtimes.com/articles/321155/20260721/kimi-k3-subscription-pause-exposes-gpu-crunch-behind-open-weight-strategy.htm)
- [TrendForce — Moonshot Suspends Kimi K3 Subscriptions Amid Compute Crunch; Microsoft Reportedly Weighs Adoption](https://www.trendforce.com/news/2026/07/21/news-moonshot-suspends-kimi-k3-subscriptions-amid-compute-crunch-microsoft-reportedly-weighs-adoption/)
- [Stratechery(本·汤普森) — Who's Afraid of Chinese Models?](https://stratechery.com/2026/whos-afraid-of-chinese-models/)
- [Interconnects(内森·兰伯特) — Kimi K3: The open-weights escalation](https://www.interconnects.ai/p/kimi-k3-the-open-weights-escalation)
- [Tech Startups — Microsoft reportedly tests China's Kimi K3 AI model for Copilot and Azure](https://techstartups.com/2026/07/20/microsoft-reportedly-tests-chinas-kimi-k3-ai-model-for-copilot-and-azure-as-ai-race-heats-up/)
- [CryptoBriefing — Microsoft tests Kimi K3 for Copilot in bid to cut AI costs by $600 million](https://cryptobriefing.com/microsoft-kimi-k3-ai-inference-costs/)
- [Introl — BIS H200 Export Policy Shift & AI OVERWATCH Act](https://introl.com/blog/bis-h200-china-export-policy-ai-overwatch-act-2026)
- [Reuters via AOL — China's H3C warns of Nvidia AI chip shortage amid surging demand](https://www.aol.com/exclusive-chinas-h3c-warns-nvidia-091018526.html)
- [CryptoBriefing — Kimi K3 launches with 2.8 trillion parameters, open weights dropping July 27](https://cryptobriefing.com/kimi-k3-open-weights-july-27/)
