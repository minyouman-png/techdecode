---
title: "ASML: 모든 AI 칩이 반드시 통과하는 단 하나의 회사"
description: "엔비디아 GPU도, HBM 스택도, 지구상 단 한 회사만 만들 수 있는 기계 안에서 태어난다. ASML의 EUV 독점이 실제로 무엇인지, 왜 AI 하드웨어의 최하층 기반암인지, 그리고 이 주식이 AI 붐을 어떻게 통과해왔는지 — 칩 겨울의 363달러부터 사상 최고가 1,768달러까지."
date: 2026-07-14T11:00:00
lang: ko
key: asml-ai-hardware-bedrock-2026
author: menew
category: semiconductors
---

AI 붐을 기초까지 파내려가면, 대부분의 사람이 지도에서 짚지도 못할 네덜란드 소도시 펠트호번(Veldhoven)의 공장 단지에 도착한다. 지구상의 모든 최첨단 AI 칩 — 모든 엔비디아 GPU, 모든 HBM 스택, 구글과 아마존이 설계하는 모든 커스텀 가속기 — 은 극자외선(EUV) 리소그래피 장비 안에서 생을 시작한다. 그리고 그 기계를 만들 수 있는 회사는 정확히 하나다. ASML.

우리는 [HBM 메모리 병목](/ko/blog/hbm-ai-bottleneck-2026/)과 [엔비디아를 겨눈 규제 포위망](/ko/blog/nvidia-antitrust-2026/)을 다룬 바 있다. 이번 글은 한 층 더 내려간다. AI 하드웨어 피라미드의 맨 밑바닥으로 — 그리고 폭락까지 포함해 AI 붐 전체를 차트 하나로 이야기해주는 주식으로. 마침 ASML은 7월 15일 2분기 실적을 발표한다. 이 회사가 실제로 무엇인지 정리해두기 좋은 시점이다.

## ASML은 실제로 뭘 하는 회사인가

1984년 필립스에서 분사한 ASML은 리소그래피(노광) 장비를 만든다. 빛으로 실리콘 웨이퍼에 회로 패턴을 인쇄하는 기계다. 리소그래피는 트랜지스터가 얼마나 작아질 수 있는지의 바닥을 결정한다. 즉 무어의 법칙의 페이스메이커다. 칩은 광원이 진화하는 속도만큼만 작아진다.

현재의 정점이 EUV — 극자외선이다. 물리학은 SF처럼 읽힌다. 초당 5만 번, 공중을 나는 용융 주석(tin) 방울을 고출력 CO₂ 레이저로 맞춰 플라즈마로 기화시키고, 거기서 13.5나노미터 파장의 빛을 뽑아낸다. 이 파장은 공기에도, 알려진 모든 렌즈 소재에도 흡수되기 때문에, 빛은 진공 속을 지나 원자 수준 평탄도로 연마된 자이스(Zeiss) 거울 — 인류가 만든 가장 정밀한 거울로 불린다 — 로 조향해야 한다. 기계 한 대에 약 5천 개 협력사에서 온 부품 약 10만 개가 들어가고, 화물 컨테이너 40개 분량으로 출하되며, 가격은 2억 유로 안팎. 차세대 기종은 그 두 배에 가깝다.

다른 누구도 이걸 만들지 못한다. 1990년대 리소그래피의 거인이었던 니콘과 캐논은 오래전에 EUV 경쟁을 포기했다. 이 기술이 상업적으로 작동하기까지 약 20년과 100억 달러가 넘는 연구개발이 들어갔다. ASML의 EUV 시장 점유율은 사실상 100%다.

## 왜 이것이 AI 하드웨어의 기반암인가

AI 공급망은 보통 피라미드로 그려진다. 꼭대기에 모델, 그 아래 GPU, 그 아래 그것을 제조하는 파운드리(TSMC·삼성)와 메모리 3사(SK하이닉스·마이크론·삼성). ASML은 그 전부의 아래에 있다. 7나노 이하 로직 — 모든 AI 가속기가 속한 급 — 은 EUV 없이 양산이 불가능하다. AI 메모리와의 연결도 갈수록 조여진다. [HBM4](/ko/blog/hbm-ai-bottleneck-2026/)에 들어가는 최신 D램 세대들도 점점 더 EUV 레이어에 의존한다. 하이퍼스케일러가 수천억 달러 단위 설비투자를 발표할 때, 그 돈의 일부는 시차를 두고 펠트호번의 구매주문서로 끝난다.

다음 챕터는 High-NA EUV다. 개구수(NA)를 0.33에서 0.55로 올려 더 미세한 패턴을 더 적은 공정으로 인쇄한다. 여기서 고객 지도가 유난히 많은 것을 말해준다. [인텔은 2025년 12월 업계 최초의 High-NA 장비](https://www.trendforce.com/news/2026/05/20/news-asml-expects-first-high-na-euv-memory-logic-products-within-months-amid-tsmcs-cost-driven-delay/)(Twinscan EXE:5200B)를 가동하며 14A 노드의 명운을 걸었고, ASML CEO는 2026년 5월 [첫 High-NA 양산 제품이 수개월 내](https://anysilicon.com/news/asml-expects-first-high-na-euv-chips-within-months-as-tsmc-delays-adoption-over-cost-concerns/)라고 밝혔다. 반면 TSMC는 [대당 3억 5천만 유로가 넘는 가격을 이유로 2029년 이전 양산 도입은 없다고 ASML에 통보](https://www.trendforce.com/news/2026/05/01/news-behind-tsmcs-high-na-euv-deferral-low-na-stays-strong-customer-landscape-shifts-and-asml-quietly-pivots/)했다. 삼성과 SK하이닉스는 2027년 전후를 겨냥한다. 최대 고객이 "나중에"라고 말할 여유가 있는 독점기업 — 이 긴장이 ASML 스토리에서 진짜로 열려 있는 유일한 질문이다.

## 주가: 차트 하나에 담긴 AI 붐

ASML 주가(미국 상장 ADR)는 AI 사이클의 거의 완전한 역사다:

| 시점 | 주가(대략) | 무슨 일이 있었나 |
|---|---|---|
| 2021년 말 | ~$895 고점 | 팬데믹 칩 슈퍼사이클 |
| 2022년 10월 | ~$363 저점 | 칩 겨울, 고점 대비 −60% |
| 2024년 7월 | ~$1,100 | ChatGPT발 AI 랠리 |
| 2024년 10월 15일 | 하루 −16% | 3분기 수주 쇼크: €26억 vs 예상 ~€54억 |
| 2026년 7월 10일 | ~$1,768 신고가 | YTD +35%, 12개월 +107% |

두 장면이 주목할 만하다. 첫째는 [2024년 10월의 폭락](https://news.futunn.com/en/post/48768331/asml-shares-crash-16-over-bookings-miss-guidance-cut-and)이다. 그 분기 매출은 오히려 시장 기대를 웃돌았다. 문제는 신규 수주가 예상치의 절반에 그친 것 — 자동차·스마트폰·산업용 등 비(非)AI 수요가 계속 부진했고, 2년간 앞당겨 사들이던 중국 주문이 정상화된 탓이다. 시장이 배운 교훈: **점유율 100%의 독점기업도 사이클 기업이며, 주가는 해자가 아니라 사이클에 값이 매겨진다.**

둘째는 그 이후의 회복이다. 2025년 4분기 수주는 사상 최대 €132억(그중 EUV €74억)을 찍었고, [2025년 연간 매출 €327억·순이익 €96억으로 마감](https://www.asml.com/en/news/press-releases/2026/q4-2025-financial-results)했으며, [2026년 1분기 매출 €88억에 총마진 53%](https://www.asml.com/en/news/press-releases/2026/q1-2026-financial-results)를 기록했다. 경영진은 고객들이 증설 계획을 앞당기고 있다며 AI 수요를 명시적으로 지목하고 [2026년 연간 가이던스를 €360억~400억으로 상향](https://finance.yahoo.com/markets/stocks/articles/asml-lifts-2026-sales-outlook-021328025.html)했다. 눈여겨볼 각주 하나: ASML은 2026년 1분기부터 분기 수주액 공시 자체를 중단했다. 대형 주문이 불규칙하게 들어와 신호를 왜곡한다는 이유인데 — 독점기업만 누릴 수 있는 사치이자, 2024년의 채찍질에 대한 직접적인 응답이다.

## 숫자로 보면

| 지표 | 값 |
|---|---|
| 2025년 매출 | €327억 |
| 2025년 순이익 | €96억 (순마진 ~29%) |
| 2026년 1분기 매출 / 총마진 | €88억 / 53.0% |
| 2026년 가이던스 | €360~400억 (기존 €340~390억에서 상향) |
| 2025년 4분기 수주 (마지막 공시) | €132억 사상 최대 |
| EUV 시장 점유율 | ~100% |
| High-NA 대당 가격 | €3.5억 초과 |

## 해자가 막아주지 못하는 리스크

기계에 대한 독점이 사이클에 대한 독점은 아니다. 경쟁자가 하나도 나타나지 않아도 ASML을 다치게 할 수 있는 것이 넷 있다. (1) **설비투자 타이밍** — [AI 자본지출 vs 매출 격차 논쟁](/ko/blog/ai-bubble-2026-debate/)이 시사하듯 AI 증설이 숨을 고르는 순간, 주문은 장비 층에서 가장 먼저 멈춘다. (2) **중국 정책** — EUV는 처음부터 중국 수출이 불가능했고 DUV 규제도 계속 조여지는 중이라, 최근까지 매출의 큰 몫을 대던 시장에 구조적 상한이 걸려 있다. (3) **고객 집중** — 수요를 정하는 건 TSMC·삼성·인텔·SK하이닉스·마이크론 등 한 줌의 구매자이고, TSMC의 High-NA 연기는 기술 전환기에 이들이 실질적 협상력을 가진다는 걸 보여준다. (4) **지정학** — EUV 장비 대부분이 물리적으로 가동되는 곳은 대만이다. ASML의 운명은 대만의 운명과 분리되지 않는다.

그 무엇도 구조적 사실을 바꾸지는 못한다. 인류가 더 작은 트랜지스터를 원하는 한 — 그리고 AI는 역사상 가장 비싼 '원해야 할 이유'를 제공했다 — 모든 길은 펠트호번을 지난다. AI 시대의 곡괭이와 삽 장사에도 곡괭이와 삽을 대는 장사가 있고, 거기 적힌 이름은 정확히 하나다.

*이 글의 어떤 내용도 금융·투자 조언이 아닙니다. 수치는 2026년 7월 14일 기준 회사 공시 및 인용 보도에서 가져왔으며, 의사결정 전 원본 소스로 확인하시기 바랍니다.*

### 출처

- [ASML — 2026년 1분기 실적 (매출 €88억, 순이익 €28억)](https://www.asml.com/en/news/press-releases/2026/q1-2026-financial-results)
- [ASML — 2025년 연간 실적 (매출 €327억, 순이익 €96억)](https://www.asml.com/en/news/press-releases/2026/q4-2025-financial-results)
- [야후파이낸스 — ASML, AI 수요로 2026년 매출 전망 상향](https://finance.yahoo.com/markets/stocks/articles/asml-lifts-2026-sales-outlook-021328025.html)
- [트렌드포스 — TSMC High-NA 연기의 배경 (2026.5)](https://www.trendforce.com/news/2026/05/01/news-behind-tsmcs-high-na-euv-deferral-low-na-stays-strong-customer-landscape-shifts-and-asml-quietly-pivots/)
- [AnySilicon — 첫 High-NA EUV 칩 수개월 내 (2026.5)](https://anysilicon.com/news/asml-expects-first-high-na-euv-chips-within-months-as-tsmc-delays-adoption-over-cost-concerns/)
- [Futu News — ASML 수주 미스에 하루 16% 폭락 (2024.10)](https://news.futunn.com/en/post/48768331/asml-shares-crash-16-over-bookings-miss-guidance-cut-and)
- [TOPONE Markets — ASML 주가 분석, 2026년 7월 가격대](https://www.top1markets.com/news/asml-stock-analysis-euv-lithography-semiconductor-equipment-earnings)
