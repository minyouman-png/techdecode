---
title: "IA física, explicada de forma sencilla: por qué importa, quién va ganando y qué tan buenos son realmente los robots ahora"
description: "Una guía en lenguaje sencillo sobre la 'IA física' — el término de la industria para la IA que puede percibir y actuar en el mundo físico, no solo responder a instrucciones de texto. Por qué Jensen Huang la llama la próxima ola tras los chatbots, quién está realmente vendiendo robots humanoides en 2026, y el estado real de la tecnología detrás de las demostraciones."
date: 2026-07-19T09:00:00
lang: es
key: physical-ai-explainer-2026
author: menew
category: ai
---

Ahora mismo, un robot Figure 03 trabaja un turno remunerado en la planta de ensamblaje más grande de BMW en el mundo, facturado a unos 25 dólares por hora-robot. En Amazon se puede comprar un humanoide Unitree G1 por 17.990 dólares, entregado como un electrodoméstico grande. La planta canadiense de Toyota tiene más de siete robots Agility Digit haciendo trabajo real de manejo de materiales tras un piloto exitoso. Nada de esto era cierto hace dos años. Esto es lo que la gente quiere decir cuando afirma que la "IA física" ha llegado — y merece la pena explicar en lenguaje sencillo qué es exactamente, por qué de repente se trata como algo tan importante, y qué tan lejos ha llegado realmente la tecnología frente a lo que aparentan los videos de demostración.

## Qué significa realmente la "IA física"

La IA normal —un chatbot, un generador de imágenes— solo tiene que acertar dentro de una pantalla. La IA física tiene que acertar dentro de un cuerpo: recibe datos de sensores (cámaras, tacto, equilibrio) en lugar de solo texto, y su salida es una orden motora en lugar de una frase. La industria describe los modelos subyacentes como una evolución por etapas: de modelos de lenguaje (LLM), a modelos que también entienden imágenes y vídeo (LMM), hasta "modelos de acción a gran escala" (LAM) que producen acciones físicas en el mundo real. Un brazo robótico que solo puede soldar una pieza específica en un coche específico es automatización antigua. Un robot que puede mirar una caja de piezas desconocidas, escuchar una instrucción en lenguaje corriente y decidir por sí mismo qué hacer — eso es IA física.

## Por qué se trata como algo urgente ahora mismo

El argumento a favor de la IA física es sobre todo demográfico, y las cifras son contundentes. Solo Estados Unidos tiene hoy unos 600.000 puestos de manufactura sin cubrir, y se prevé que su escasez de cuidadores para personas mayores llegue al millón en 2030. Corea, Japón y China están envejeciendo todos más rápido de lo que se renueva su fuerza laboral. Goldman Sachs estima que, incluso a los precios actuales, los robots humanoides podrían cubrir cerca del 4% del déficit laboral manufacturero de EE. UU. y el 2% de la demanda mundial de cuidado de mayores para 2030 — modesto por sí solo, pero la dirección importa más que el porcentaje exacto.

La otra razón es el precio. El precio de venta promedio de un robot humanoide rondaba los 114.700 dólares en 2024; las previsiones lo sitúan cerca de los 37.000 dólares para 2030, una caída de más de dos tercios en seis años. No es hipotético — ya es visible en la gama baja: un Unitree G1 cuesta hoy entre 13.500 y 17.990 dólares, y 1X vende su robot doméstico NEO por 20.000 dólares al contado o 499 dólares al mes por suscripción. Cuando un robot capaz cuesta más o menos lo mismo que un coche usado, el mercado potencial deja de ser "las grandes fábricas" y pasa a ser "la casa de cualquiera", que es por lo que los analistas manejan cifras como un mercado de humanoides de 38.000 millones de dólares para 2035 (Goldman Sachs) y una oportunidad de 5 billones de dólares para 2050 (Morgan Stanley).

## Qué tan buena es realmente la tecnología en 2026

El problema difícil en la IA física nunca ha sido construir el cuerpo del robot — es enseñarle a ese cuerpo a manejar situaciones para las que no fue programado explícitamente, usando muchos menos datos del mundo real de los que se usan para entrenar modelos de lenguaje. La familia Isaac GR00T de Nvidia, "modelos fundacionales para robots", es la ventana pública más clara sobre cómo la industria está atacando ese problema. GR00T N1 usa un diseño de doble sistema inspirado libremente en la cognición humana: un "Sistema 2" lento que razona sobre una escena y planifica qué hacer, y un "Sistema 1" rápido que traduce ese plan en movimientos motores precisos y en tiempo real. Para sortear la escasez de datos de entrenamiento reales, Nvidia generó 780.000 secuencias sintéticas de movimiento robótico —el equivalente a 6.500 horas de demostración humana— en once horas de simulación, y mezclar esos datos sintéticos con grabaciones reales mejoró el rendimiento del modelo en aproximadamente un 40%. La versión más reciente, GR00T N1.7, se preentrena con 20.000 horas de vídeo humano en primera persona además de demostraciones robóticas, y Nvidia ya ha presentado un modelo de próxima generación, GR00T N2, que afirma más del doble de tasa de éxito en tareas frente a los modelos anteriores de visión-lenguaje-acción, con lanzamiento previsto para finales de 2026.

Ese avance en los modelos fundacionales es lo que permite que los despliegues reales superen las demostraciones guionizadas en fábricas. La flota de Figure en BMW y los robots de Agility en Toyota realizan hoy trabajo genuino, aunque acotado, de almacén y ensamblaje, facturado por hora como mano de obra contratada. Boston Dynamics está ampliando sus unidades eléctricas de Atlas para Hyundai y DeepMind. Tesla apunta a la producción en volumen del Optimus Gen 3 en su planta de Fremont para finales del verano de 2026, aunque de momento sigue desplegado internamente y no se vende a clientes externos. El resumen honesto: los robots de hoy son lo bastante fiables para tareas acotadas, bien definidas y supervisadas en entornos controlados, y todavía están lejos del generalista que "hace cualquier cosa que una persona pueda hacer" que sugiere el marketing.

## Quién compite realmente, y en qué

| Empresa | Respaldo / Valoración | Estado en 2026 |
|---|---|---|
| Figure AI | Valoración de 39.000 M$, ronda de 675 M$ liderada por OpenAI | Flota de 40 unidades en despliegue remunerado en BMW |
| 1X Technologies | ~10.000 M$, respaldada por OpenAI, Tiger Global, Samsung | Robot doméstico NEO, primeras entregas en EE. UU. a finales de 2026 |
| Unitree (China) | Capital privado | Más de 5.500 unidades enviadas solo en 2025; el G1 se vende en Amazon |
| Tesla | Cotiza en bolsa (TSLA) | Optimus Gen 3, solo uso interno, producción en volumen prevista para finales de verano de 2026 |
| Agility Robotics | Capital privado | Robots Digit realizando trabajo remunerado en Toyota Canadá |
| Boston Dynamics | Propiedad de Hyundai | Flotas eléctricas de Atlas para Hyundai y Google DeepMind |

La división competitiva que más importa no es empresa por empresa, sino geográfica. Estados Unidos mantiene una clara ventaja en el "cerebro": los modelos fundacionales de Nvidia, OpenAI y Google DeepMind, y el razonamiento multimodal que permite a un robot entender una instrucción que nunca ha visto. China ha tomado una ventaja contundente en el "cuerpo": solo Unitree envió en 2025 aproximadamente 35 veces más unidades que Tesla, y los fabricantes chinos tratan 2025-2026 como la primera ola real de comercialización del hardware humanoide, construida sobre una cadena de suministro ya dominante de motores, actuadores e imanes de tierras raras. Apostar por la IA física significa cada vez más elegir un lado de esa división, o una empresa que pueda abarcar ambos.

La posición de Corea merece una mención aparte. Ya tiene la mayor densidad de robots industriales del mundo —1.012 robots por cada 10.000 trabajadores de manufactura en 2024— y varios analistas la presentan ahora como una plausible "tercera vía" en la IA física: ni el modelo estadounidense (modelo fundacional primero, hardware después) ni el chino (hardware y volumen primero), sino una apuesta de integración industrial construida sobre una base robótica que pocos otros países pueden igualar.

## Qué cambiaría realmente el panorama desde aquí

Conviene vigilar tres cosas en lugar de los vídeos de demostración: si el GR00T N2 de Nvidia entrega el salto prometido en tasa de éxito de tareas una vez se lance, ya que eso es una lectura directa de si el problema de datos de simulación a realidad se está resolviendo de verdad o solo se está vendiendo así; si despliegues como el de Figure en BMW o el de Digit en Toyota crecen de forma significativa en número de unidades durante el próximo año, porque esa es la diferencia entre un piloto y un producto real; y si los precios de los humanoides siguen bajando según el calendario que esperan los analistas, ya que toda la tesis de "un robot en cada casa" depende de que se sostenga la curva de precios, no solo la de capacidad.

*Este artículo tiene fines informativos y no constituye asesoramiento financiero o de inversión. Las valoraciones de empresas, cifras de envíos y precios provienen de reportes públicos vigentes a la fecha de publicación y cambian rápido en esta industria; verifique las cifras actuales antes de actuar sobre ellas.*

### Fuentes

- [LumiChats — Humanoid Robots 2026: Tesla Optimus vs Figure AI vs Unitree](https://lumichats.com/blog/humanoid-robots-2026-tesla-optimus-figure-ai-unitree-complete-guide)
- [ValueAdd VC — Humanoid Robots 2026: Figure vs Apptronik vs 1X vs Tesla Optimus vs Unitree](https://valueaddvc.com/blog/humanoid-robots-in-2026-figure-apptronik-1x-and-tesla-optimus-compared)
- [NVIDIA Newsroom — NVIDIA Isaac GR00T N1: the World's First Open Humanoid Robot Foundation Model](https://nvidianews.nvidia.com/news/nvidia-isaac-gr00t-n1-open-humanoid-robot-foundation-model-simulation-frameworks)
- [NVIDIA Developer Blog — Develop Humanoid Robot Policies End-to-End with NVIDIA Isaac GR00T](https://developer.nvidia.com/blog/develop-humanoid-robot-policies-end-to-end-with-nvidia-isaac-gr00t/)
- [Tech Times/IDTechEx — Humanoid Robot Price Falls 68% by 2030](https://www.techtimes.com/articles/316906/20260520/idtechex-humanoid-robot-price-falls-68-2030-six-month-payback-possible-now.htm)
- [Herald Business (Corea) — "En 2035 habrá más robots que coches"… Corea emerge como alternativa a EE. UU. y China en la era de la IA física](https://biz.heraldcorp.com/article/10810166)
- [Digital Daily (Corea) — [Primer plano de IA] La IA física se abre paso donde faltan manos](https://www.ddaily.co.kr/page/view/2026061017503562514)
