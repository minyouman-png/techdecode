---
title: "ASML: la única empresa por la que debe pasar todo chip de IA"
description: "Cada GPU de Nvidia y cada pila de HBM nace dentro de una máquina que solo una empresa en la Tierra sabe construir. Qué es realmente el monopolio EUV de ASML, por qué es la capa de roca madre del hardware de IA, y cómo viajó la acción por el boom de la IA — del mínimo de 363 dólares del invierno de los chips al récord de 1.768."
date: 2026-07-14T11:00:00
lang: es
key: asml-ai-hardware-bedrock-2026
author: menew
category: semiconductors
---

Si excavas el boom de la IA hasta sus cimientos, llegas a un campus fabril en Veldhoven, una ciudad holandesa que la mayoría no sabría situar en el mapa. Todos los chips de IA de vanguardia de la Tierra — cada GPU de Nvidia, cada pila de memoria de alto ancho de banda, cada acelerador a medida que diseñan Google o Amazon — comienzan su vida dentro de una máquina de litografía ultravioleta extrema (EUV). Exactamente una empresa sabe construir esa máquina: ASML.

Ya escribimos sobre [el cuello de botella de la memoria HBM](/es/blog/hbm-ai-bottleneck-2026/) y sobre [el asedio regulatorio a Nvidia](/es/blog/nvidia-antitrust-2026/). Esta pieza baja un nivel más, hasta el fondo de la pirámide del hardware de IA — y hasta una acción que cuenta todo el boom de la IA en un solo gráfico, crash incluido. ASML presenta resultados del segundo trimestre el 15 de julio, buen momento para explicar qué es realmente esta empresa.

## Qué hace realmente ASML

ASML, escindida de Philips en 1984, fabrica máquinas de litografía: las herramientas que imprimen con luz los patrones de circuitos sobre las obleas de silicio. La litografía fija el suelo de cuán pequeño puede ser un transistor, lo que la convierte en el marcapasos de la ley de Moore: los chips solo se encogen tan rápido como evoluciona la fuente de luz.

La cima actual es el EUV — ultravioleta extremo. La física se lee como ciencia ficción: cincuenta mil veces por segundo, una gota de estaño fundido es alcanzada en pleno vuelo por un láser de CO₂ de alta potencia y vaporizada en un plasma que irradia luz de 13,5 nanómetros. Como esa longitud de onda es absorbida por el aire y por todos los materiales de lente conocidos, la luz debe viajar en vacío y ser dirigida por espejos de Zeiss pulidos a planitud subatómica — según se dice, los espejos más precisos jamás fabricados. Una sola máquina integra unas cien mil piezas de una red de unos cinco mil proveedores, se envía en unos 40 contenedores y cuesta del orden de 200 millones de euros. La siguiente generación cuesta casi el doble.

Nadie más la fabrica. Nikon y Canon, los gigantes de la litografía de los años noventa, abandonaron la carrera del EUV hace años; la tecnología consumió unas dos décadas y más de 10.000 millones de dólares de I+D antes de funcionar comercialmente. La cuota de ASML en EUV es, a efectos prácticos, del 100%.

## Por qué es la roca madre del hardware de IA

La cadena de suministro de la IA suele dibujarse como una pirámide: los modelos arriba, luego las GPU, luego las fundiciones (TSMC, Samsung) y los fabricantes de memoria (SK Hynix, Micron, Samsung). ASML está debajo de todo eso. La lógica por debajo de 7 nanómetros — la clase a la que pertenece todo acelerador de IA — no puede producirse en volumen sin EUV. Y el vínculo con la memoria de IA se estrecha: las generaciones más nuevas de DRAM que alimentan el [HBM4](/es/blog/hbm-ai-bottleneck-2026/) dependen cada vez más de capas EUV. Cuando los hiperescaladores anuncian planes de capex de cientos de miles de millones, una fracción de ese dinero termina, con retardo, como órdenes de compra en Veldhoven.

El siguiente capítulo es el High-NA EUV — apertura numérica elevada de 0,33 a 0,55, que imprime rasgos más finos en menos pasos. Aquí el mapa de clientes es inusualmente revelador. [Intel desplegó el primer sistema High-NA de la industria](https://www.trendforce.com/news/2026/05/20/news-asml-expects-first-high-na-euv-memory-logic-products-within-months-amid-tsmcs-cost-driven-delay/) (el Twinscan EXE:5200B) en diciembre de 2025 y apuesta su nodo 14A a esta tecnología; el CEO de ASML dijo en mayo de 2026 que [los primeros productos fabricados con High-NA llegarán en cuestión de meses](https://anysilicon.com/news/asml-expects-first-high-na-euv-chips-within-months-as-tsmc-delays-adoption-over-cost-concerns/). TSMC, en cambio, ha comunicado a ASML que no usará High-NA en producción en volumen [antes de 2029, citando el precio de más de 350 millones de euros por máquina](https://www.trendforce.com/news/2026/05/01/news-behind-tsmcs-high-na-euv-deferral-low-na-stays-strong-customer-landscape-shifts-and-asml-quietly-pivots/); Samsung y SK Hynix apuntan a alrededor de 2027. Un monopolista cuyo mayor cliente puede permitirse decir "más tarde" — esa tensión es la única pregunta genuinamente abierta de la historia.

## La acción: el boom de la IA en un solo gráfico

La cotización de ASML (ADR en EE. UU.) es casi una historia completa del ciclo de la IA:

| Cuándo | Precio (aprox.) | Qué pasaba |
|---|---|---|
| Finales de 2021 | ~895 $ máximo | superciclo pandémico de chips |
| Octubre de 2022 | ~363 $ mínimo | invierno de los chips, −60% desde el pico |
| Julio de 2024 | ~1.100 $ | rally de la era ChatGPT |
| 15 de octubre de 2024 | −16% en un día | shock de pedidos del T3: 2.600 M€ frente a ~5.400 M€ esperados |
| 10 de julio de 2026 | ~1.768 $ récord | +35% en el año, +107% en 12 meses |

Dos episodios merecen atención. El primero, [el desplome de octubre de 2024](https://news.futunn.com/en/post/48768331/asml-shares-crash-16-over-bookings-miss-guidance-cut-and): los ingresos de ese trimestre en realidad batieron previsiones, pero los pedidos nuevos quedaron en la mitad de lo estimado, con la demanda no-IA (autos, móviles, industria) débil y los pedidos chinos normalizándose tras dos años de acopio. La lección que aprendió el mercado: **incluso un monopolio del 100% es una empresa cíclica, y cotiza según el ciclo, no según el foso.**

El segundo, la recuperación posterior. Los pedidos del T4 2025 marcaron un récord de 13.200 millones de euros (7.400 de ellos en EUV); [el ejercicio 2025 cerró con 32.700 millones en ventas y 9.600 millones de beneficio neto](https://www.asml.com/en/news/press-releases/2026/q4-2025-financial-results); [el T1 2026 entregó 8.800 millones con un margen bruto del 53%](https://www.asml.com/en/news/press-releases/2026/q1-2026-financial-results), y la dirección [elevó la guía de 2026 a 36.000–40.000 millones de euros](https://finance.yahoo.com/markets/stocks/articles/asml-lifts-2026-sales-outlook-021328025.html), atribuyéndolo explícitamente a la demanda impulsada por la IA. Una nota al pie llamativa: desde el T1 2026 ASML dejó de publicar los pedidos trimestrales, alegando que los mega-pedidos irregulares distorsionan la señal — un lujo que solo un monopolista puede permitirse, y una respuesta directa al latigazo de 2024.

## Los números

| Métrica | Valor |
|---|---|
| Ventas netas 2025 | 32.700 M€ |
| Beneficio neto 2025 | 9.600 M€ (~29% de margen) |
| Ventas / margen bruto T1 2026 | 8.800 M€ / 53,0% |
| Guía 2026 | 36.000–40.000 M€ (elevada desde 34.000–39.000) |
| Pedidos T4 2025 (último dato publicado) | 13.200 M€, récord |
| Cuota de mercado EUV | ~100% |
| Precio por unidad High-NA | >350 M€ |

## Los riesgos que el foso no cubre

El monopolio de la máquina no es el monopolio del ciclo. Cuatro cosas pueden dañar a ASML sin que aparezca competidor alguno: (1) **el calendario del capex** — si la construcción de IA se pausa, como sugiere [el debate del desfase capex-ingresos](/es/blog/ai-bubble-2026-debate/), los pedidos se frenan primero en la capa de equipos; (2) **la política china** — el EUV nunca ha podido exportarse a China y las restricciones al DUV siguen endureciéndose, poniendo techo estructural a un mercado que hasta hace poco aportaba una parte importante de los ingresos; (3) **la concentración de clientes** — un puñado de compradores (TSMC, Samsung, Intel, SK Hynix, Micron) fija la demanda, y el aplazamiento del High-NA por parte de TSMC demuestra su poder de negociación real en las transiciones tecnológicas; (4) **la geopolítica** — la suerte de ASML es inseparable de la de Taiwán, donde opera físicamente la mayoría de las máquinas EUV.

Nada de eso cambia el hecho estructural: mientras la humanidad quiera transistores más pequeños — y la IA le ha dado la razón más cara de la historia para quererlos — todos los caminos pasan por Veldhoven. El negocio de picos y palas de la era de la IA tiene su propio negocio de picos y palas, y lleva exactamente un nombre.

*Nada en este artículo es asesoramiento financiero o de inversión. Las cifras proceden de las divulgaciones de la empresa y de la prensa citada a 14 de julio de 2026; verifícalas en las fuentes originales antes de decidir.*

### Fuentes

- [ASML — Resultados del T1 2026 (8.800 M€ de ventas, 2.800 M€ de beneficio)](https://www.asml.com/en/news/press-releases/2026/q1-2026-financial-results)
- [ASML — Resultados de 2025 (32.700 M€ de ventas, 9.600 M€ de beneficio)](https://www.asml.com/en/news/press-releases/2026/q4-2025-financial-results)
- [Yahoo Finance — ASML eleva su previsión de ventas 2026 por la demanda de IA](https://finance.yahoo.com/markets/stocks/articles/asml-lifts-2026-sales-outlook-021328025.html)
- [TrendForce — Detrás del aplazamiento del High-NA de TSMC (mayo 2026)](https://www.trendforce.com/news/2026/05/01/news-behind-tsmcs-high-na-euv-deferral-low-na-stays-strong-customer-landscape-shifts-and-asml-quietly-pivots/)
- [AnySilicon — Primeros chips High-NA EUV en cuestión de meses (mayo 2026)](https://anysilicon.com/news/asml-expects-first-high-na-euv-chips-within-months-as-tsmc-delays-adoption-over-cost-concerns/)
- [Futu News — ASML se desploma un 16% por los pedidos (oct 2024)](https://news.futunn.com/en/post/48768331/asml-shares-crash-16-over-bookings-miss-guidance-cut-and)
- [TOPONE Markets — Análisis de la acción de ASML, niveles de julio 2026](https://www.top1markets.com/news/asml-stock-analysis-euv-lithography-semiconductor-equipment-earnings)
