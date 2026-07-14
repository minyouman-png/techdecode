---
title: "ASML:すべてのAIチップが必ず通過する、ただ一つの会社"
description: "NVIDIAのGPUも、HBMスタックも、地球上で一社しか作れない機械の中で生まれる。ASMLのEUV独占の実体、それがAIハードウェアの最下層の岩盤である理由、そしてこの株がAIブームをどう駆け抜けたか——半導体の冬の363ドルから史上最高値1,768ドルまで。"
date: 2026-07-14T11:00:00
lang: ja
key: asml-ai-hardware-bedrock-2026
author: menew
category: semiconductors
---

AIブームを土台まで掘り下げると、ほとんどの人が地図で指させないオランダの小都市フェルトホーフェン(Veldhoven)の工場群にたどり着く。地球上のすべての最先端AIチップ——すべてのNVIDIA GPU、すべてのHBMスタック、グーグルやアマゾンが設計するすべてのカスタムアクセラレータ——は、極端紫外線(EUV)リソグラフィ装置の中で生を受ける。そしてその機械を作れる会社は、正確に一社しかない。ASMLだ。

私たちは[HBMメモリのボトルネック](/ja/blog/hbm-ai-bottleneck-2026/)と[NVIDIAを取り囲む規制包囲網](/ja/blog/nvidia-antitrust-2026/)を扱ってきた。本稿はさらに一層深く降りる。AIハードウェア・ピラミッドの最底部へ——そして暴落も含めてAIブーム全体をチャート一枚で語ってくれる株へ。折しもASMLは7月15日に第2四半期決算を発表する。この会社の実体を整理しておくには良いタイミングだ。

## ASMLは実際に何をする会社か

1984年にフィリップスから分離独立したASMLは、リソグラフィ(露光)装置を作る。光でシリコンウェハーに回路パターンを印刷する機械だ。リソグラフィはトランジスタがどこまで小さくなれるかの下限を決める。つまりムーアの法則のペースメーカーである。チップは光源が進化する速さでしか小さくならない。

現在の頂点がEUV——極端紫外線だ。その物理はSFのように読める。毎秒5万回、空中を飛ぶ溶融スズの液滴を高出力CO₂レーザーで撃ち、プラズマに気化させ、そこから波長13.5ナノメートルの光を取り出す。この波長は空気にも、既知のあらゆるレンズ素材にも吸収されるため、光は真空中を通り、原子レベルの平坦度に研磨されたツァイス製ミラー——人類が作った最も精密な鏡と呼ばれる——で導かれなければならない。装置一台に約5,000社のサプライヤーから来た部品およそ10万点が組み込まれ、貨物コンテナ40個分で出荷され、価格は2億ユーロ前後。次世代機はその倍近い。

他の誰にもこれは作れない。1990年代のリソグラフィの巨人だったニコンとキヤノンは、とうの昔にEUV競争から降りた。この技術が商業的に機能するまでに約20年と100億ドルを超える研究開発が費やされた。ASMLのEUV市場シェアは事実上100%である。

## なぜこれがAIハードウェアの岩盤なのか

AIサプライチェーンは普通ピラミッドで描かれる。頂点にモデル、その下にGPU、その下にそれらを製造するファウンドリ(TSMC・サムスン)とメモリメーカー(SKハイニックス・マイクロン・サムスン)。ASMLはそのすべての下にいる。7ナノ以下のロジック——あらゆるAIアクセラレータが属するクラス——はEUVなしには量産できない。AIメモリとの結びつきも強まる一方だ。[HBM4](/ja/blog/hbm-ai-bottleneck-2026/)を支える最新世代のDRAMも、ますますEUVレイヤーに依存している。ハイパースケーラーが数千億ドル規模の設備投資を発表するとき、その資金の一部は時間差でフェルトホーフェンの発注書として着地する。

次の章はHigh-NA EUVだ。開口数(NA)を0.33から0.55に引き上げ、より微細なパターンをより少ない工程で印刷する。ここで顧客の勢力図が異様に雄弁だ。[インテルは2025年12月、業界初のHigh-NA装置](https://www.trendforce.com/news/2026/05/20/news-asml-expects-first-high-na-euv-memory-logic-products-within-months-amid-tsmcs-cost-driven-delay/)(Twinscan EXE:5200B)を稼働させ、14Aノードの命運を賭けた。ASMLのCEOは2026年5月、[初のHigh-NA製チップは数か月以内](https://anysilicon.com/news/asml-expects-first-high-na-euv-chips-within-months-as-tsmc-delays-adoption-over-cost-concerns/)と明かした。一方TSMCは[一台3億5,000万ユーロ超という価格を理由に、2029年より前の量産導入はないとASMLに通告](https://www.trendforce.com/news/2026/05/01/news-behind-tsmcs-high-na-euv-deferral-low-na-stays-strong-customer-landscape-shifts-and-asml-quietly-pivots/)した。サムスンとSKハイニックスは2027年前後を狙う。最大顧客が「後で」と言える余裕を持つ独占企業——この緊張こそ、ASMLの物語で本当に開かれた唯一の問いだ。

## 株価:チャート一枚に収まったAIブーム

ASMLの株価(米国上場ADR)は、AIサイクルのほぼ完全な歴史である:

| 時点 | 株価(概算) | 何が起きていたか |
|---|---|---|
| 2021年末 | 〜$895 高値 | パンデミック半導体スーパーサイクル |
| 2022年10月 | 〜$363 安値 | 半導体の冬、高値から−60% |
| 2024年7月 | 〜$1,100 | ChatGPT発のAIラリー |
| 2024年10月15日 | 一日で−16% | Q3受注ショック:€26億 vs 予想〜€54億 |
| 2026年7月10日 | 〜$1,768 最高値 | 年初来+35%、12か月+107% |

二つの場面が注目に値する。第一は[2024年10月の暴落](https://news.futunn.com/en/post/48768331/asml-shares-crash-16-over-bookings-miss-guidance-cut-and)だ。その四半期の売上はむしろ市場予想を上回っていた。問題は新規受注が予想の半分にとどまったこと——自動車・スマホ・産業用など非AI需要の不振が続き、2年間前倒しで買い込んでいた中国の注文が正常化したためだ。市場が学んだ教訓:**シェア100%の独占企業もサイクル企業であり、株価は堀ではなくサイクルに値付けされる。**

第二はその後の回復だ。2025年第4四半期の受注は史上最高の€132億(うちEUVが€74億)を記録し、[2025年通年は売上€327億・純利益€96億で着地](https://www.asml.com/en/news/press-releases/2026/q4-2025-financial-results)。[2026年第1四半期は売上€88億・粗利率53%](https://www.asml.com/en/news/press-releases/2026/q1-2026-financial-results)を叩き出し、経営陣は顧客が増設計画を前倒ししているとしてAI需要を名指しし、[2026年通年ガイダンスを€360億〜400億に引き上げた](https://finance.yahoo.com/markets/stocks/articles/asml-lifts-2026-sales-outlook-021328025.html)。見逃せない脚注が一つ:ASMLは2026年第1四半期から四半期受注額の開示自体をやめた。巨額注文が不規則に入り、シグナルを歪めるという理由だが——独占企業だけが許される贅沢であり、2024年の鞭打ちへの直接の返答でもある。

## 数字で見る

| 指標 | 値 |
|---|---|
| 2025年売上高 | €327億 |
| 2025年純利益 | €96億(純利益率〜29%) |
| 2026年Q1売上 / 粗利率 | €88億 / 53.0% |
| 2026年ガイダンス | €360〜400億(€340〜390億から引き上げ) |
| 2025年Q4受注(最後の開示) | €132億 史上最高 |
| EUV市場シェア | 〜100% |
| High-NA一台の価格 | €3.5億超 |

## 堀がカバーしてくれないリスク

機械の独占はサイクルの独占ではない。競合が一社も現れなくてもASMLを傷つけうるものが四つある。(1) **設備投資のタイミング** — [AI設備投資vs収益ギャップの論争](/ja/blog/ai-bubble-2026-debate/)が示唆するように、AI増設が一息つく瞬間、注文はまず装置レイヤーで止まる。(2) **中国政策** — EUVは最初から中国に輸出できず、DUV規制も締まり続けており、最近まで売上の大きな割合を占めた市場に構造的な上限がかかっている。(3) **顧客集中** — 需要を決めるのはTSMC・サムスン・インテル・SKハイニックス・マイクロンという一握りの買い手で、TSMCのHigh-NA先送りは技術移行期に彼らが実質的な交渉力を持つことを示す。(4) **地政学** — EUV装置の大半が物理的に稼働する場所は台湾だ。ASMLの運命は台湾の運命と切り離せない。

そのどれも構造的事実は変えられない。人類がより小さなトランジスタを望む限り——そしてAIは史上最も高価な「望むべき理由」を与えた——すべての道はフェルトホーフェンを通る。AI時代のツルハシとシャベルの商売にも、ツルハシとシャベルを納める商売があり、そこに書かれた名前は正確に一つだけだ。

*本記事のいかなる内容も金融・投資助言ではありません。数値は2026年7月14日時点の会社開示および引用報道に基づきます。意思決定の前に必ず原典でご確認ください。*

### 出典

- [ASML — 2026年第1四半期決算(売上€88億、純利益€28億)](https://www.asml.com/en/news/press-releases/2026/q1-2026-financial-results)
- [ASML — 2025年通年決算(売上€327億、純利益€96億)](https://www.asml.com/en/news/press-releases/2026/q4-2025-financial-results)
- [Yahoo Finance — ASML、AI需要で2026年売上見通しを引き上げ](https://finance.yahoo.com/markets/stocks/articles/asml-lifts-2026-sales-outlook-021328025.html)
- [TrendForce — TSMCのHigh-NA先送りの背景(2026年5月)](https://www.trendforce.com/news/2026/05/01/news-behind-tsmcs-high-na-euv-deferral-low-na-stays-strong-customer-landscape-shifts-and-asml-quietly-pivots/)
- [AnySilicon — 初のHigh-NA EUVチップは数か月以内(2026年5月)](https://anysilicon.com/news/asml-expects-first-high-na-euv-chips-within-months-as-tsmc-delays-adoption-over-cost-concerns/)
- [Futu News — ASML、受注ミスで一日16%暴落(2024年10月)](https://news.futunn.com/en/post/48768331/asml-shares-crash-16-over-bookings-miss-guidance-cut-and)
- [TOPONE Markets — ASML株価分析、2026年7月の価格水準](https://www.top1markets.com/news/asml-stock-analysis-euv-lithography-semiconductor-equipment-earnings)
