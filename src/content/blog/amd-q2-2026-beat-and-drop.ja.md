---
title: "コンセンサスを全て上回って5%下落 — AMD決算が本当に試したもの"
description: "AMDの第2四半期は売上115億ドル、データセンター107%増。第3四半期ガイダンスも市場予想を上回った。それでも株価は時間外で5%超下落した。問題は数字ではなく、株価にすでに織り込まれていた期待だった。そして韓国メモリには株価より重要なシグナルが残った。"
date: 2026-08-05T10:00:00
lang: ja
key: amd-q2-2026-beat-and-drop
author: menew
category: semiconductors
---

8月5日未明（韓国時間）、韓国の半導体投資家が待っていた数字が出た。AMDの第2四半期決算である。

前日、KB証券は「8月5日未明のAMD決算が、相対的に弱かった半導体株のムード転換を決める」と[指摘していた](https://www.mt.co.kr/stock/2026/08/04/2026080416551484894)。8月4日のKOSPIは1.62%高の6,358.95で引けたが、サムスン電子（+0.21%）とSKハイニックス（+0.64%）はほぼ横ばい。指数を押し上げたのは非半導体で、半導体は様子見だった。

そしてAMDはほぼ全項目で市場予想を上回った。株価は下がった。

## 数字は勝った

| 項目 | 第2四半期 | 前年比 | コンセンサス |
|---|---|---|---|
| 売上高 | 115.4億ドル | +50% | 112.8億ドル |
| 調整後EPS | 1.66ドル | +246% | 1.61ドル |
| GAAP EPS | 1.38ドル | +156% | — |
| GAAP粗利益率 | 54% | +14pt | — |

セグメント別に分けると輪郭がはっきりする（[AMD開示](https://ir.amd.com/news-events/press-releases/detail/1295/amd-reports-second-quarter-2026-financial-results)ベース）。

| セグメント | 売上高 | 前年比 |
|---|---|---|
| データセンター | 67.2億ドル | **+107%** |
| クライアント | 30.6億ドル | +23% |
| 組み込み | 9.8億ドル | +19% |
| ゲーミング | 7.8億ドル | **-31%** |

データセンターだけで全社売上の58%。1年で倍になった。リサ・スーCEOは「データセンター売上が前年比で2倍以上になった」「AIが当社の全市場でコンピュート需要を大きく拡大させている」と述べた。

第3四半期ガイダンスは**約130億ドル（±3億）**。市場コンセンサスの125.2億ドルを上回る。教科書どおりのbeat and raiseである。

## それでも株価は下がった

時間外取引でAMDは**5.48%安の490.18ドル**で[推移した](https://www.benzinga.com/markets/earnings/26/08/60931767/amd-delivers-double-beat-in-q2-as-data-center-revenue-more-than-doubles)。実況中継では下げ幅が一時9%近くまで[広がる場面もあった](https://247wallst.com/investing/2026/08/04/live-is-amd-about-to-smash-q2-earnings-after-rising-8-today/)。

理由は決算表の中にない。外にある。

AMDは決算発表に入る前の時点で**年初来146%高**だった。ここまで走った株では、コンセンサスはもはや越えるべき線ではない。越えるべきなのは、アナリストが公式に書いた数字の上に市場が乗せた「ウィスパー・ナンバー」だ。130億ドルのガイダンスはコンセンサスを5億ドル上回ったが、買い手が織り込んでいた期待は上回らなかった。

もう一つある。成長率の方向だ。第2四半期の+50%は、第3四半期ガイダンス基準で+41%に下がる。絶対水準としては依然驚異的だが、**AI銘柄のバリュエーションは成長率の水準ではなく、その微分に反応する。** [設備投資が試される決算](/ja/blog/ai-capex-earnings-test-2026/)で整理したのと同じ構造だ。良い決算が悪い株価に翻訳される局面に入ったなら、それは会社への評価ではなく価格への評価である。

[AIバブル論争](/ja/blog/ai-bubble-2026-debate/)の視点で見れば、今回の反応はむしろ健全な側だ。AI売上という数字さえ出れば無条件に買われる局面は終わった、ということだから。

## MI400とHelios: 本当のニュースはこちら

株価より長く残るのは製品の側だ。AMDはこの四半期に**Instinct MI400シリーズ**を正式に投入した。

- **MI455X** — 大規模AI学習・推論向けフラッグシップ。FP4で40ペタフロップス、**HBM4を432GB**、帯域19.6TB/s。
- **MI430X** — HPCとソブリンAIワークロード向け。
- **Helios** — ラックスケール基盤。ラックあたり最大3 AIエクサフロップス。2026年下期に量産立ち上げ。

顧客リストのほうが重要だ。AMDはHelios採用先として**Anthropic、Meta、Microsoft、OpenAI、Oracle**を明示し、AnthropicとはMI450シリーズを**最大2ギガワット**規模で配備するパートナーシップを結んだ。

2ギガワットはマーケティング文句ではなく電力単位だ。「性能が良い」という主張ではなく「これだけ実際に挿すと契約した相手がいる」という話である。[HBMボトルネック](/ja/blog/hbm-ai-bottleneck-2026/)の記事で整理した構造 — AIハードウェア需要が事実上1社のロードマップに縛られていた構造 — に亀裂が入るのがここだ。

## 韓国メモリにとっての意味

ここからが実務的な部分になる。

HBM市場の最大リスクは技術ではなく**顧客集中**だった。需要の圧倒的多数が1社から出ていた。エヌビディアの発注計画がそのままメモリ3社の業績計画だった。[エヌビディアを狙う規制包囲網](/ja/blog/nvidia-antitrust-2026/)が韓国メモリ株の変数になるのもそのためだ。

MI455X 1枚にHBM4が432GB入る。そしてその量を買うアンカー顧客が契約書に名前を載せた。**HBMに二人目の実需要買い手が生まれるということだ。**

供給側の配置も興味深い。現在報じられている図はこうだ。

- SKハイニックスはエヌビディアのVera Rubin向けHBM4の約3分の2を[確保するとされる](https://www.trendforce.com/news/2026/01/28/news-sk-hynix-reportedly-to-supply-about-two-thirds-of-nvidia-hbm4-samsung-targets-early-delivery/)。
- サムスン電子はエヌビディアと並んで**AMD向けHBM4の供給ポジション**を取ったと[言われている](https://markets.financialcontent.com/stocks/article/tokenring-2026-1-26-the-hbm4-era-begins-samsung-and-sk-hynix-trigger-mass-production-for-next-gen-ai)。

いずれも確定開示ではなく業界報道ベースである点は明記しておく。ただ方向が正しいなら結論は単純だ。**AMDのデータセンター成長は、SKハイニックスよりサムスン電子に相対的に大きなレバレッジとなる。** エヌビディアのバリューチェーンで2番手だった側が、二つ目のバリューチェーンではアンカーになる構造だからだ。

## 反対側にあるもの

同じ決算を逆に読む根拠もある。

**第一に供給。** 8月4日に韓国の半導体株が指数についていけなかった直接の理由は、AMD待ちだけではない。大信証券は「中国CXMTの新工場建設検討の報道でメモリ供給拡大の可能性が意識され、半導体株の下押し圧力を強めた」と[指摘した](https://www.mt.co.kr/stock/2026/08/04/2026080416551484894)。HBMの買い手が一社増えることと、汎用DRAM供給が増えることは、同じ損益計算書で逆方向に働く。

**第二に、AIの外は良くない。** ゲーミング売上は前年比31%減。AMDの成長は全方位ではなくデータセンターという一本足に乗っている。その足がぐらつけば緩衝材は薄い。

**第三に、立ち上げはまだ未来形。** MI450シリーズとHeliosの本格量産は2026年下期。2ギガワット契約は複数年で執行される数字であって、今期の売上ではない。発表と売上計上の時差は、この業界で常に過小評価される。

## 注目点

| 確認すべきこと | なぜ重要か |
|---|---|
| エヌビディアの次の決算 | AI加速器需要全体の減速か、AMDへのシェア移動かが分かれる |
| HBM4 16段の量産時期 | SKハイニックスの第3四半期目標達成が供給者序列を固める |
| AMD向けHBM4供給社の確定 | 報道段階のサムスンのポジションが実契約になるか |
| MI450の下期ランプ | 2ギガワットが実出荷に変わる速度 |
| CXMTの増設進行 | 汎用DRAM供給拡大がメモリ価格サイクルをいつ押すか |

## まとめ

AMDはよくやった。売上も利益率もガイダンスも市場予想の上で、データセンターは1年で倍になった。株価が下がったのは会社が悪かったからではなく、**価格がすでにそれ以上を含んでいたから**だ。2026年のAI銘柄でこの二つを区別できないと、決算シーズンのたびに方向を読み違える。

韓国の投資家に残る一文はこうだ。今回の核心はAMDの株価ではなく、**HBMに二人目の本物の買い手が生まれつつあるという事実**である。その買い手がどこからメモリを買うかが、今後数四半期のサムスン電子とSKハイニックスの相対パフォーマンスを分ける。

*本記事は情報提供を目的とした分析であり、投資勧誘ではありません。引用した数値は開示・報道ベースであり、供給契約に関する内容は確定開示ではなく業界報道です。*

### 出典

- [AMD Reports Second Quarter 2026 Financial Results — AMD IR](https://ir.amd.com/news-events/press-releases/detail/1295/amd-reports-second-quarter-2026-financial-results)
- [AMD Delivers Double Beat in Q2 as Data Center Revenue More Than Doubles — Benzinga](https://www.benzinga.com/markets/earnings/26/08/60931767/amd-delivers-double-beat-in-q2-as-data-center-revenue-more-than-doubles)
- [AMD Q2 Earnings: $11.5B Revenue, Up 50% — StockTitan](https://www.stocktitan.net/news/AMD/amd-reports-second-quarter-2026-financial-s9qsl4zgkkw3.html)
- [Live: Is AMD About to Smash Q2 Earnings — 24/7 Wall St.](https://247wallst.com/investing/2026/08/04/live-is-amd-about-to-smash-q2-earnings-after-rising-8-today/)
- [韓国市場まとめ 2026年8月4日 — マネートゥデイ](https://www.mt.co.kr/stock/2026/08/04/2026080416551484894)
- [SK hynix Reportedly to Supply About Two-Thirds of NVIDIA HBM4 — TrendForce](https://www.trendforce.com/news/2026/01/28/news-sk-hynix-reportedly-to-supply-about-two-thirds-of-nvidia-hbm4-samsung-targets-early-delivery/)
- [The HBM4 Era Begins: Samsung and SK Hynix Trigger Mass Production — FinancialContent](https://markets.financialcontent.com/stocks/article/tokenring-2026-1-26-the-hbm4-era-begins-samsung-and-sk-hynix-trigger-mass-production-for-next-gen-ai)
