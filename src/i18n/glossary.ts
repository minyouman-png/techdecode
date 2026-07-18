// AI 용어사전: 용어 레지스트리 + 언어별 정의.
// 새 용어 추가 시 terms 배열에 항목을 추가하면 인덱스/상세 페이지가 자동 생성된다.
import type { Lang } from './ui';

/* ===== 섹션 공통 문자열 ===== */
export const glossaryUi: Record<Lang, Record<string, string>> = {
  en: {
    kicker: 'AI GLOSSARY',
    pageTitle: 'AI Glossary',
    metaDescription:
      'Plain-English definitions of the AI and AI-chip terms that come up across our analysis — LLMs, tokens, HBM, RAG, and more.',
    intro:
      'Short, precise definitions of the terms that show up across our AI and semiconductor coverage — written so you can look one up in thirty seconds and get back to the article.',
    relatedLabel: 'Related terms',
    relatedReadingLabel: 'Related analysis',
    backToList: '← All terms',
  },
  ko: {
    kicker: 'AI 용어사전',
    pageTitle: 'AI 용어사전',
    metaDescription:
      '저희 분석 글에 자주 등장하는 AI·AI반도체 용어를 쉬운 말로 정리했습니다 — LLM, 토큰, HBM, RAG 등.',
    intro:
      'AI·반도체 기사에 반복해서 등장하는 용어를 짧고 정확하게 정리했습니다. 30초 안에 찾아보고 다시 본문으로 돌아가실 수 있도록.',
    relatedLabel: '관련 용어',
    relatedReadingLabel: '관련 분석',
    backToList: '← 전체 용어',
  },
  ja: {
    kicker: 'AI用語集',
    pageTitle: 'AI用語集',
    metaDescription: '記事に頻出するAI・AI半導体用語を平易に解説します — LLM、トークン、HBM、RAGなど。',
    intro: 'AI・半導体の記事に繰り返し登場する用語を、短く正確にまとめました。30秒で調べて、また記事に戻れるように。',
    relatedLabel: '関連用語',
    relatedReadingLabel: '関連分析',
    backToList: '← 用語一覧へ',
  },
  es: {
    kicker: 'GLOSARIO DE IA',
    pageTitle: 'Glosario de IA',
    metaDescription:
      'Definiciones claras de los términos de IA y chips de IA que aparecen en nuestros análisis — LLM, tokens, HBM, RAG y más.',
    intro:
      'Definiciones breves y precisas de los términos que aparecen en nuestra cobertura de IA y semiconductores — para consultarlos en treinta segundos y volver al artículo.',
    relatedLabel: 'Términos relacionados',
    relatedReadingLabel: 'Análisis relacionado',
    backToList: '← Todos los términos',
  },
  zh: {
    kicker: 'AI 术语表',
    pageTitle: 'AI 术语表',
    metaDescription: '用通俗语言解释我们分析文章中常见的 AI 与 AI 芯片术语——LLM、token、HBM、RAG 等。',
    intro: '对我们 AI 与半导体报道中反复出现的术语给出简短、准确的解释——三十秒查完，继续阅读正文。',
    relatedLabel: '相关术语',
    relatedReadingLabel: '相关分析',
    backToList: '← 所有术语',
  },
};

/* ===== 카테고리 ===== */
export const glossaryCategoryOrder = ['fundamentals', 'process', 'behavior', 'infrastructure'] as const;
export type GlossaryCategory = (typeof glossaryCategoryOrder)[number];

export const glossaryCategoryLabels: Record<GlossaryCategory, Record<Lang, string>> = {
  fundamentals: { en: 'Fundamentals', ko: '기본 개념', ja: '基礎', es: 'Fundamentos', zh: '基础概念' },
  process: { en: 'Model Lifecycle', ko: '모델 라이프사이클', ja: 'モデルのライフサイクル', es: 'Ciclo de vida del modelo', zh: '模型生命周期' },
  behavior: { en: 'Behavior & Risk', ko: '행동과 리스크', ja: '挙動とリスク', es: 'Comportamiento y riesgos', zh: '行为与风险' },
  infrastructure: { en: 'Infrastructure', ko: '인프라', ja: 'インフラ', es: 'Infraestructura', zh: '基础设施' },
};

/* ===== 용어별 정의 ===== */
export interface GlossaryCopy {
  term: string;
  short: string;   // 카드/메타디스크립션용 한 줄 정의
  body: string[];  // 본문 문단
}

export interface GlossaryEntry {
  slug: string;
  category: GlossaryCategory;
  related: string[];       // 관련 용어 slug
  relatedPost?: string;    // 관련 블로그 글의 key (선택)
  copy: Record<Lang, GlossaryCopy>;
}

export const glossaryTerms: GlossaryEntry[] = [
  {
    slug: 'llm',
    category: 'fundamentals',
    related: ['transformer', 'token', 'context-window'],
    copy: {
      en: {
        term: 'LLM (Large Language Model)',
        short: 'An AI system trained on massive amounts of text to predict and generate human-like language.',
        body: [
          "LLMs like GPT, Claude, and Gemini are built by training a neural network — usually a Transformer — on trillions of words of text, code, and other data. The model doesn't “look up” answers; it learns statistical patterns of how language works well enough to generate coherent, often useful, text one token at a time.",
          'Scale matters: bigger models trained on more data and more compute tend to perform better, which is part of why frontier labs spend billions of dollars on the GPUs and data centers needed to train them — spending that is now central to the debate over whether AI valuations have run ahead of AI revenue.',
        ],
      },
      ko: {
        term: 'LLM (거대 언어 모델)',
        short: '방대한 텍스트로 학습해 사람이 쓴 것 같은 언어를 예측·생성하는 AI 시스템.',
        body: [
          'GPT, Claude, Gemini 같은 LLM은 신경망(대개 트랜스포머 구조)을 수조 단어 분량의 텍스트·코드·기타 데이터로 학습시켜 만듭니다. 모델은 답을 어딘가에서 “찾아오는” 게 아니라, 언어가 작동하는 통계적 패턴을 학습해 한 번에 한 토큰씩 그럴듯한 텍스트를 생성합니다.',
          '규모가 클수록, 즉 더 많은 데이터와 연산으로 학습할수록 성능이 좋아지는 경향이 있습니다. 최상위 AI 연구소들이 학습용 GPU와 데이터센터에 수십억 달러를 쏟아붓는 이유이기도 하고, 이 지출이 바로 AI 밸류에이션이 실제 매출을 앞질렀는지에 대한 논쟁의 핵심이기도 합니다.',
        ],
      },
      ja: {
        term: 'LLM(大規模言語モデル)',
        short: '膨大なテキストで学習し、人間のような言語を予測・生成するAIシステム。',
        body: [
          'GPT、Claude、Geminiのようなモデルは、ニューラルネットワーク（多くはTransformer構造）を、テキスト・コードなど数兆語規模のデータで学習させて作られます。モデルは答えをどこかから“検索”しているのではなく、言語の統計的パターンを学習し、一度に1トークンずつ、筋の通った有用なテキストを生成しています。',
          '規模が大きいほど、つまりより多くのデータと計算資源で学習するほど性能が高まる傾向があります。最先端の研究所が学習用GPUとデータセンターに数十億ドルを投じる理由の一つであり、この支出こそがAIの評価額がAI収益を先取りしすぎているかという論争の中心になっています。',
        ],
      },
      es: {
        term: 'LLM (Modelo de Lenguaje Grande)',
        short: 'Un sistema de IA entrenado con enormes cantidades de texto para predecir y generar lenguaje humano.',
        body: [
          'Modelos como GPT, Claude y Gemini se construyen entrenando una red neuronal — normalmente un Transformer — con billones de palabras de texto, código y otros datos. El modelo no “busca” respuestas: aprende patrones estadísticos de cómo funciona el lenguaje lo bastante bien como para generar texto coherente y útil, un token a la vez.',
          'La escala importa: los modelos más grandes, entrenados con más datos y más cómputo, suelen rendir mejor, y por eso los laboratorios punteros gastan miles de millones de dólares en las GPU y centros de datos necesarios para entrenarlos — un gasto que hoy es central en el debate sobre si las valoraciones de IA se han adelantado a sus ingresos.',
        ],
      },
      zh: {
        term: 'LLM(大语言模型)',
        short: '通过海量文本训练、用来预测和生成类人语言的 AI 系统。',
        body: [
          'GPT、Claude、Gemini 这类模型的构建方式，是用神经网络(通常是 Transformer 结构)在数万亿词的文本、代码等数据上进行训练。模型并不是从某处"查找"答案，而是学习语言运作的统计规律，从而一次生成一个 token，拼出连贯、往往也有用的文本。',
          '规模很重要:用更多数据、更多算力训练出的更大模型往往表现更好，这也是顶尖实验室愿意为训练所需的 GPU 和数据中心投入数十亿美元的原因之一——而这笔支出，正是"AI 估值是否已经跑在营收前面"这场争论的核心。',
        ],
      },
    },
  },
  {
    slug: 'transformer',
    category: 'fundamentals',
    related: ['llm', 'token', 'moe'],
    copy: {
      en: {
        term: 'Transformer',
        short: 'The neural network architecture, introduced in 2017, that made modern large language models possible.',
        body: [
          'Before Transformers, language models processed text mostly in order, one word after another, which made it hard to capture long-range relationships and slow to train. The Transformer architecture — from the 2017 paper “Attention Is All You Need” — introduced self-attention, letting the model weigh the relevance of every word in a passage against every other word at once.',
          'That parallelism is what made today’s scale possible: Transformers can be trained efficiently across thousands of GPUs at the same time. Nearly every major LLM in production, from GPT to Claude to Gemini, is a Transformer variant.',
        ],
      },
      ko: {
        term: '트랜스포머 (Transformer)',
        short: '오늘날의 거대 언어 모델을 가능케 한, 2017년에 등장한 신경망 구조.',
        body: [
          '트랜스포머 이전의 언어 모델은 텍스트를 대체로 순서대로, 단어를 하나씩 처리했기 때문에 멀리 떨어진 단어 사이의 관계를 포착하기 어렵고 학습 속도도 느렸습니다. 2017년 논문 “Attention Is All You Need”에서 제시된 트랜스포머 구조는 셀프 어텐션(self-attention)을 도입해, 문장 속 모든 단어를 다른 모든 단어와 동시에 비교해 관련도를 계산할 수 있게 했습니다.',
          '이 병렬 처리 방식 덕분에 지금 같은 규모의 학습이 가능해졌습니다. 트랜스포머는 수천 개의 GPU에서 동시에 효율적으로 학습시킬 수 있기 때문입니다. GPT, Claude, Gemini를 포함해 현재 실제 서비스되는 주요 LLM은 거의 전부 트랜스포머 변형입니다.',
        ],
      },
      ja: {
        term: 'Transformer(トランスフォーマー)',
        short: '現在の大規模言語モデルを可能にした、2017年に登場したニューラルネットワーク構造。',
        body: [
          'Transformer以前の言語モデルは、テキストをおおむね順番通り、単語を一つずつ処理していたため、離れた単語同士の関係を捉えにくく、学習にも時間がかかりました。2017年の論文“Attention Is All You Need”で提案されたTransformer構造は、self-attention(自己注意機構)を導入し、文章中のすべての単語を他のすべての単語と同時に比較して関連度を計算できるようにしました。',
          'この並列処理こそが、現在の規模での学習を可能にしています。Transformerは数千のGPUで同時に効率よく学習させることができます。GPT、Claude、Geminiを含め、現在実運用されている主要なLLMのほぼすべてがTransformerの派生形です。',
        ],
      },
      es: {
        term: 'Transformer',
        short: 'La arquitectura de red neuronal, presentada en 2017, que hizo posibles los modelos de lenguaje actuales.',
        body: [
          'Antes de los Transformers, los modelos de lenguaje procesaban el texto casi siempre en orden, palabra por palabra, lo que dificultaba capturar relaciones a larga distancia y hacía el entrenamiento lento. La arquitectura Transformer — del artículo de 2017 “Attention Is All You Need” — introdujo la autoatención (self-attention), permitiendo al modelo sopesar la relevancia de cada palabra de un pasaje frente a todas las demás a la vez.',
          'Ese paralelismo es lo que hizo posible la escala actual: los Transformers pueden entrenarse de forma eficiente en miles de GPU simultáneamente. Casi todos los grandes LLM en producción, de GPT a Claude y Gemini, son variantes de Transformer.',
        ],
      },
      zh: {
        term: 'Transformer(变换器)',
        short: '2017 年提出的神经网络架构，正是它让现代大语言模型成为可能。',
        body: [
          '在 Transformer 出现之前，语言模型大多按顺序逐词处理文本，这使得捕捉远距离的词语关系很困难，训练速度也慢。2017 年论文《Attention Is All You Need》提出的 Transformer 架构引入了自注意力机制(self-attention)，让模型能同时衡量一段文字中每个词与其他所有词之间的相关性。',
          '正是这种并行性让今天的规模成为可能: Transformer 可以同时在数千块 GPU 上高效训练。从 GPT 到 Claude 再到 Gemini，如今几乎所有主流 LLM 都是 Transformer 的变体。',
        ],
      },
    },
  },
  {
    slug: 'token',
    category: 'fundamentals',
    related: ['context-window', 'llm', 'transformer'],
    copy: {
      en: {
        term: 'Token',
        short: 'The small chunks of text — often pieces of words — that a language model actually reads and generates, one at a time.',
        body: [
          "Models don't process raw letters or whole words; they break text into tokens — typically about 3-4 characters of English on average — using a fixed vocabulary learned during training. “Tokenization” is the process of converting text into these units, and back into text again when the model responds.",
          'Tokens matter commercially, too: nearly every AI API prices usage per token, and a model’s context window is measured in tokens rather than words or characters — which is why “how many tokens” is the first question in estimating what an AI feature will cost to run.',
        ],
      },
      ko: {
        term: '토큰 (Token)',
        short: '언어 모델이 실제로 읽고 생성하는, 단어보다 더 잘게 쪼갠 텍스트 조각.',
        body: [
          '모델은 원문 글자나 단어 단위를 그대로 처리하지 않고, 학습 과정에서 익힌 고정된 어휘 집합을 기준으로 텍스트를 토큰(영어 기준 평균 3~4글자 정도)으로 쪼갭니다. “토큰화(tokenization)”는 텍스트를 이 단위로 바꾸고, 모델이 답할 때 다시 텍스트로 되돌리는 과정입니다.',
          '토큰은 비용 측면에서도 중요합니다. 거의 모든 AI API는 토큰 단위로 요금을 매기고, 모델의 컨텍스트 윈도우도 단어나 글자가 아니라 토큰 수로 표시됩니다. AI 기능의 운영 비용을 가늠할 때 “토큰이 몇 개나 필요한가”가 가장 먼저 따져야 할 질문인 이유입니다.',
        ],
      },
      ja: {
        term: 'トークン(Token)',
        short: '言語モデルが実際に読み書きする、単語よりも細かいテキストの単位。',
        body: [
          'モデルは生の文字や単語をそのまま処理するのではなく、学習時に獲得した固定の語彙集合を基準にテキストをトークン(英語では平均3〜4文字程度)へと分割します。“トークナイズ(tokenization)”とは、テキストをこの単位に変換し、モデルが応答する際に再びテキストへ戻す処理のことです。',
          'トークンはコスト面でも重要です。ほぼすべてのAI APIはトークン単位で課金され、モデルのコンテキストウィンドウも単語や文字数ではなくトークン数で表されます。AI機能の運用コストを見積もる際、まず“トークンがいくつ必要か”を問うべき理由はここにあります。',
        ],
      },
      es: {
        term: 'Token',
        short: 'Los pequeños fragmentos de texto — a menudo trozos de palabras — que un modelo de lenguaje realmente lee y genera, uno a la vez.',
        body: [
          'Los modelos no procesan letras ni palabras completas tal cual; dividen el texto en tokens — en inglés, unos 3-4 caracteres en promedio — usando un vocabulario fijo aprendido durante el entrenamiento. La “tokenización” es el proceso de convertir texto en estas unidades, y de vuelta a texto cuando el modelo responde.',
          'Los tokens también importan comercialmente: casi toda API de IA cobra por token, y la ventana de contexto de un modelo se mide en tokens, no en palabras ni caracteres — por eso “cuántos tokens” es la primera pregunta al estimar el coste de operar una función de IA.',
        ],
      },
      zh: {
        term: 'Token(词元)',
        short: '语言模型实际读取和生成的最小文本单位——往往比一个完整单词还要小。',
        body: [
          '模型并不直接处理原始字母或完整单词，而是依据训练时习得的固定词表，把文本切分成 token(英文平均约 3-4 个字符)。"分词(tokenization)"就是把文本转换成这些单位、并在模型作答时再转换回文本的过程。',
          'Token 在商业上也很关键:几乎所有 AI API 都按 token 计费，模型的上下文窗口也是以 token 数而非单词或字符数来衡量的——这正是为什么估算一个 AI 功能的运行成本时，第一个要问的问题就是"需要多少 token"。',
        ],
      },
    },
  },
  {
    slug: 'context-window',
    category: 'fundamentals',
    related: ['token', 'llm', 'inference'],
    copy: {
      en: {
        term: 'Context Window',
        short: "The maximum amount of text — measured in tokens — a model can “see” at once, including your prompt and its own reply.",
        body: [
          'A context window works like short-term memory: anything outside it, the model simply cannot reference, until the conversation is trimmed or summarized. Windows have grown from a few thousand tokens in 2020-era models to over a million tokens in some 2026 frontier models, enabling use cases like reasoning over an entire codebase or an hour-long document in one pass.',
          'Bigger context windows cost more to run per request, since attention computation scales steeply with sequence length in the original Transformer design — one reason providers charge more per token for longer prompts.',
        ],
      },
      ko: {
        term: '컨텍스트 윈도우 (Context Window)',
        short: '모델이 한 번에 “볼” 수 있는 텍스트의 최대량(입력한 프롬프트와 모델의 답변 포함), 토큰 단위로 측정.',
        body: [
          '컨텍스트 윈도우는 일종의 단기 기억과 같습니다. 그 범위를 벗어난 내용은 대화를 잘라내거나 요약하기 전까지는 모델이 아예 참조할 수 없습니다. 윈도우 크기는 2020년대 초반 모델의 수천 토큰 수준에서 2026년 일부 최상위 모델의 100만 토큰 이상까지 커져서, 코드베이스 전체나 한 시간 분량의 문서를 한 번에 읽고 추론하는 용도까지 가능해졌습니다.',
          '컨텍스트 윈도우가 클수록 요청당 비용도 커집니다. 원래의 트랜스포머 설계에서는 어텐션 연산량이 시퀀스 길이에 따라 가파르게 늘어나기 때문인데, AI 제공업체들이 프롬프트가 길수록 토큰당 요금을 더 받는 이유 중 하나입니다.',
        ],
      },
      ja: {
        term: 'コンテキストウィンドウ(Context Window)',
        short: 'モデルが一度に“見る”ことができるテキストの最大量(入力したプロンプトと自身の返答を含む)。トークン数で測る。',
        body: [
          'コンテキストウィンドウは一種の短期記憶のように働きます。その範囲外の内容は、会話が削られるか要約されるまで、モデルはそもそも参照できません。ウィンドウのサイズは2020年代初頭のモデルの数千トークンから、2026年の一部の最先端モデルでは100万トークン超にまで拡大し、コードベース全体や1時間分のドキュメントを一度に読み込んで推論するような用途も可能にしています。',
          'コンテキストウィンドウが大きいほど、リクエストごとの実行コストも上がります。もとのTransformer設計ではアテンション計算量がシーケンス長に応じて急激に増えるためで、プロバイダーが長いプロンプトほどトークン単価を高く設定する理由の一つです。',
        ],
      },
      es: {
        term: 'Ventana de contexto',
        short: 'La cantidad máxima de texto — medida en tokens — que un modelo puede “ver” a la vez, incluyendo tu prompt y su propia respuesta.',
        body: [
          'Una ventana de contexto funciona como memoria a corto plazo: todo lo que quede fuera de ella, el modelo simplemente no puede referenciarlo, hasta que la conversación se recorta o se resume. Las ventanas han crecido de unos pocos miles de tokens en modelos de 2020 a más de un millón de tokens en algunos modelos punteros de 2026, lo que permite razonar sobre una base de código entera o un documento de una hora en una sola pasada.',
          'Las ventanas de contexto más grandes cuestan más por petición, ya que el cálculo de atención escala de forma pronunciada con la longitud de la secuencia en el diseño original del Transformer — una razón por la que los proveedores cobran más por token cuando el prompt es más largo.',
        ],
      },
      zh: {
        term: '上下文窗口(Context Window)',
        short: '模型一次能"看到"的最大文本量(包括你的提示词和它自己的回复)，以 token 数衡量。',
        body: [
          '上下文窗口的作用类似短期记忆:超出这个范围的内容，在对话被裁剪或总结之前，模型根本无法引用。窗口大小已经从 2020 年前后模型的几千 token，增长到 2026 年部分顶尖模型的百万 token 以上，使得一次性通读整个代码库或一小时长的文档、并据此推理成为可能。',
          '上下文窗口越大，每次请求的运行成本也越高，因为在最初的 Transformer 设计中，注意力计算量会随序列长度急剧增加——这也是为什么提示词越长，服务商往往按 token 收取更高单价的原因之一。',
        ],
      },
    },
  },
  {
    slug: 'inference',
    category: 'process',
    related: ['training', 'context-window', 'moe'],
    copy: {
      en: {
        term: 'Inference',
        short: 'The step where a trained AI model is actually used to generate an answer — as opposed to training, when it learns.',
        body: [
          'Training happens once, or periodically for updates; inference happens every single time someone sends a prompt. Inference is what runs when you chat with an assistant, generate an image, or call an AI API inside your own app.',
          "Most of the industry's day-to-day GPU demand — and a growing share of AI capital spending — is now inference rather than training, since usage scales with the number of people and products running on AI, not the number of new models being built.",
        ],
      },
      ko: {
        term: '추론 (Inference)',
        short: '학습이 끝난 AI 모델을 실제로 써서 답을 생성하는 단계 — 모델이 배우는 단계인 학습(training)과 대비되는 개념.',
        body: [
          '학습은 한 번, 또는 업데이트할 때마다 주기적으로 일어나지만, 추론은 누군가 프롬프트를 보낼 때마다 매번 일어납니다. AI 비서와 대화하거나, 이미지를 생성하거나, 자신이 만든 앱에서 AI API를 호출할 때 실제로 돌아가는 것이 바로 추론입니다.',
          '업계의 일상적인 GPU 수요, 그리고 AI 자본지출에서 점점 더 큰 비중을 차지하는 것도 이제는 학습이 아니라 추론입니다. 사용량은 새로 만들어지는 모델의 수가 아니라, AI를 쓰는 사람과 제품의 수에 비례해 늘어나기 때문입니다.',
        ],
      },
      ja: {
        term: '推論(Inference)',
        short: '学習済みのAIモデルを実際に使って答えを生成する段階 — モデルが学ぶ段階である学習(training)と対をなす概念。',
        body: [
          '学習は一度、あるいは更新のたびに周期的に行われますが、推論は誰かがプロンプトを送るたびに毎回行われます。AIアシスタントと会話したり、画像を生成したり、自作アプリからAI APIを呼び出したりするとき、実際に動いているのは推論です。',
          '業界の日々のGPU需要、そしてAI設備投資に占める割合が拡大し続けているのも、今では学習ではなく推論です。利用量は新たに作られるモデルの数ではなく、AIを使う人や製品の数に比例して増えるためです。',
        ],
      },
      es: {
        term: 'Inferencia',
        short: 'La etapa en la que un modelo de IA ya entrenado se usa realmente para generar una respuesta — a diferencia del entrenamiento, cuando aprende.',
        body: [
          'El entrenamiento ocurre una vez, o periódicamente para actualizaciones; la inferencia ocurre cada vez que alguien envía un prompt. La inferencia es lo que se ejecuta cuando chateas con un asistente, generas una imagen o llamas a una API de IA desde tu propia aplicación.',
          'Gran parte de la demanda diaria de GPU del sector — y una porción creciente del gasto de capital en IA — es ahora inferencia, no entrenamiento, porque el uso escala con el número de personas y productos que corren sobre IA, no con el número de modelos nuevos que se construyen.',
        ],
      },
      zh: {
        term: '推理(Inference)',
        short: '使用已训练好的 AI 模型来实际生成答案的阶段——与模型"学习"的训练阶段相对。',
        body: [
          '训练只发生一次，或在更新时周期性发生；而推理则是每当有人发送提示词时就会发生一次。当你和 AI 助手对话、生成图片，或在自己的应用里调用 AI API 时，实际运行的就是推理。',
          '如今，业界日常 GPU 需求中占比最大、且在 AI 资本支出中份额不断上升的，已经是推理而非训练——因为使用量的增长取决于使用 AI 的人和产品数量，而不是新模型的数量。',
        ],
      },
    },
  },
  {
    slug: 'training',
    category: 'process',
    related: ['fine-tuning', 'inference', 'llm'],
    copy: {
      en: {
        term: 'Training (Pretraining)',
        short: "The process of teaching a model its base knowledge and language ability by having it predict text across a huge dataset.",
        body: [
          "During pretraining, a model repeatedly guesses the next token in text pulled from books, websites, code, and more, adjusting billions of internal parameters (weights) each time it's wrong. This is the most compute-intensive phase of building an LLM, run across thousands of GPUs or TPUs for weeks or months at a time.",
          "Pretraining gives a model general capability, but it doesn't yet make the model good at following instructions or safe to talk to — that comes from fine-tuning afterward.",
        ],
      },
      ko: {
        term: '학습 / 사전학습 (Training / Pretraining)',
        short: '거대한 데이터셋에서 다음 텍스트를 계속 예측하게 함으로써 모델에게 기본 지식과 언어 능력을 가르치는 과정.',
        body: [
          '사전학습 과정에서 모델은 책·웹사이트·코드 등에서 가져온 텍스트의 다음 토큰을 계속 예측하고, 틀릴 때마다 내부의 수십억 개 매개변수(가중치)를 조정합니다. 이는 LLM을 만드는 과정 중 연산량이 가장 많은 단계로, 수천 개의 GPU나 TPU에서 몇 주에서 몇 달에 걸쳐 진행됩니다.',
          '사전학습은 모델에게 일반적인 능력을 부여하지만, 아직 지시를 잘 따르거나 안전하게 대화하도록 만들지는 못합니다. 그건 이후 이어지는 파인튜닝(fine-tuning) 단계에서 이루어집니다.',
        ],
      },
      ja: {
        term: '学習・事前学習(Training / Pretraining)',
        short: '巨大なデータセットに対して次のテキストを予測させ続けることで、モデルに基礎知識と言語能力を教え込む工程。',
        body: [
          '事前学習の過程でモデルは、書籍・ウェブサイト・コードなどから取り出したテキストの次のトークンを予測し続け、間違えるたびに内部の数十億のパラメータ(重み)を調整します。これはLLM構築の中で最も計算負荷が高い工程で、数千のGPUやTPU上で数週間から数か月かけて行われます。',
          '事前学習によってモデルは汎用的な能力を得ますが、指示に従うことや安全に会話することはまだ得意ではありません。それはこの後のファインチューニング(fine-tuning)によって実現されます。',
        ],
      },
      es: {
        term: 'Entrenamiento (Preentrenamiento)',
        short: 'El proceso de enseñar a un modelo su conocimiento base y capacidad de lenguaje haciéndole predecir texto sobre un enorme conjunto de datos.',
        body: [
          'Durante el preentrenamiento, un modelo predice repetidamente el siguiente token en texto extraído de libros, sitios web, código y más, ajustando miles de millones de parámetros internos (pesos) cada vez que se equivoca. Es la fase más intensiva en cómputo de construir un LLM, ejecutada en miles de GPU o TPU durante semanas o meses.',
          'El preentrenamiento da al modelo capacidad general, pero todavía no lo hace bueno siguiendo instrucciones ni seguro para conversar — eso llega después, con el ajuste fino (fine-tuning).',
        ],
      },
      zh: {
        term: '训练/预训练(Training / Pretraining)',
        short: '让模型在海量数据集上不断预测下一段文本，从而学到基础知识和语言能力的过程。',
        body: [
          '在预训练阶段，模型会反复预测从书籍、网站、代码等来源抽取的文本中的下一个 token，每次预测错误都会调整内部数十亿个参数(权重)。这是构建 LLM 中计算量最密集的阶段，需要在数千块 GPU 或 TPU 上运行数周到数月。',
          '预训练赋予模型通用能力，但还不能让它擅长听从指令或保证对话安全——那要靠之后的微调(fine-tuning)来实现。',
        ],
      },
    },
  },
  {
    slug: 'fine-tuning',
    category: 'process',
    related: ['training', 'rag', 'llm'],
    copy: {
      en: {
        term: 'Fine-tuning',
        short: 'Additional training on top of a pretrained model to specialize its behavior — for a task, a style, or a company’s own data.',
        body: [
          "Where pretraining teaches a model language and general knowledge, fine-tuning shapes what it does with that knowledge: following instructions, refusing unsafe requests, matching a brand's tone, or getting good at a narrow task like reviewing legal documents.",
          'Fine-tuning is far cheaper than pretraining because it starts from an already-capable model and needs a much smaller, more targeted dataset — often thousands rather than trillions of examples.',
        ],
      },
      ko: {
        term: '파인튜닝 (Fine-tuning)',
        short: '이미 사전학습된 모델에 추가 학습을 시켜 특정 작업, 말투, 또는 회사 자체 데이터에 맞게 행동을 특화시키는 과정.',
        body: [
          '사전학습이 모델에게 언어와 일반 지식을 가르친다면, 파인튜닝은 그 지식을 어떻게 활용할지를 다듬습니다. 지시를 잘 따르게 하고, 안전하지 않은 요청은 거부하게 하고, 브랜드 어조에 맞추거나, 법률 문서 검토 같은 좁은 작업을 잘하게 만드는 것 등입니다.',
          '파인튜닝은 사전학습보다 훨씬 저렴합니다. 이미 능력을 갖춘 모델에서 시작하고, 수조 개가 아니라 보통 수천 개 수준의 훨씬 작고 목적에 맞는 데이터셋만 있으면 되기 때문입니다.',
        ],
      },
      ja: {
        term: 'ファインチューニング(Fine-tuning)',
        short: '事前学習済みのモデルにさらに学習を加え、特定のタスク・語り口・自社データに合わせて挙動を特化させる工程。',
        body: [
          '事前学習がモデルに言語と一般知識を教えるのに対し、ファインチューニングはその知識をどう使うかを整えます。指示に従わせる、安全でない要求を拒否させる、ブランドの口調に合わせる、法律文書のレビューのような狭いタスクを得意にさせる、といった具合です。',
          'ファインチューニングは事前学習よりはるかに安価です。すでに能力を備えたモデルから始まり、必要なデータセットも数兆件ではなく数千件程度と、はるかに小規模で目的に特化したもので済むためです。',
        ],
      },
      es: {
        term: 'Ajuste fino (Fine-tuning)',
        short: 'Entrenamiento adicional sobre un modelo preentrenado para especializar su comportamiento — para una tarea, un estilo o los datos propios de una empresa.',
        body: [
          'Mientras el preentrenamiento enseña al modelo lenguaje y conocimiento general, el ajuste fino moldea qué hace con ese conocimiento: seguir instrucciones, rechazar solicitudes inseguras, adoptar el tono de una marca, o volverse experto en una tarea concreta como revisar documentos legales.',
          'El ajuste fino es mucho más barato que el preentrenamiento porque parte de un modelo ya capaz y necesita un conjunto de datos mucho más pequeño y específico — a menudo miles de ejemplos, no billones.',
        ],
      },
      zh: {
        term: '微调(Fine-tuning)',
        short: '在已完成预训练的模型基础上做进一步训练，使其行为专精于某项任务、某种风格或某家公司自有的数据。',
        body: [
          '预训练教会模型语言和通用知识，而微调则塑造模型如何运用这些知识:听从指令、拒绝不安全的请求、匹配品牌语气，或是精通法律文件审阅这类具体任务。',
          '微调比预训练便宜得多，因为它是在一个已经具备能力的模型基础上进行的，只需要规模小得多、也更有针对性的数据集——往往只是几千个样本，而不是万亿级别。',
        ],
      },
    },
  },
  {
    slug: 'rag',
    category: 'process',
    related: ['hallucination', 'context-window', 'fine-tuning'],
    copy: {
      en: {
        term: 'RAG (Retrieval-Augmented Generation)',
        short: "Giving a model outside documents to read at answer time, instead of relying only on what it memorized during training.",
        body: [
          "An LLM's training data has a cutoff date and can't include a company's private files. RAG fixes this by searching a document store for relevant passages when a question comes in, then feeding those passages into the model's context window alongside the question, so the answer is grounded in real, current source material.",
          'RAG is one of the most common patterns in production AI products because it reduces hallucination and makes answers traceable to a specific source, without the cost of retraining the model itself.',
        ],
      },
      ko: {
        term: 'RAG (검색 증강 생성)',
        short: '학습 때 외운 내용에만 의존하지 않고, 답변 시점에 외부 문서를 참고하도록 모델에게 제공하는 방식.',
        body: [
          'LLM의 학습 데이터에는 마감 시점이 있고, 회사 내부 문서 같은 건 애초에 포함될 수 없습니다. RAG는 질문이 들어오면 문서 저장소에서 관련 있는 부분을 검색한 다음, 그 내용을 질문과 함께 모델의 컨텍스트 윈도우에 넣어줌으로써 이 문제를 해결합니다. 그 결과 답변이 실제 최신 원문에 근거하게 됩니다.',
          'RAG는 실제 서비스되는 AI 제품에서 가장 흔히 쓰이는 방식 중 하나입니다. 모델을 다시 학습시키는 비용 없이도 환각을 줄이고, 답변의 출처를 특정 문서까지 추적할 수 있게 해주기 때문입니다.',
        ],
      },
      ja: {
        term: 'RAG(検索拡張生成)',
        short: '学習時に記憶した内容だけに頼るのではなく、回答時に外部の文書を参照させる仕組み。',
        body: [
          'LLMの学習データにはカットオフ日があり、企業の内部文書などはそもそも含まれていません。RAGは質問が来た時点で文書ストアから関連する箇所を検索し、その内容を質問と一緒にモデルのコンテキストウィンドウに渡すことでこれを解決します。その結果、回答は実際の最新の一次資料に基づいたものになります。',
          'RAGは実運用のAI製品で最もよく使われる方式の一つです。モデルを再学習させるコストをかけずに、幻覚(ハルシネーション)を減らし、回答の根拠を特定の文書までたどれるようにできるためです。',
        ],
      },
      es: {
        term: 'RAG (Generación Aumentada por Recuperación)',
        short: 'Dar al modelo documentos externos para leer en el momento de responder, en vez de depender solo de lo que memorizó durante el entrenamiento.',
        body: [
          'Los datos de entrenamiento de un LLM tienen una fecha de corte y no pueden incluir los archivos privados de una empresa. RAG resuelve esto buscando pasajes relevantes en un almacén de documentos cuando llega una pregunta, y luego introduciendo esos pasajes en la ventana de contexto del modelo junto con la pregunta, de modo que la respuesta se basa en material fuente real y actual.',
          'RAG es uno de los patrones más comunes en productos de IA en producción porque reduce las alucinaciones y hace que las respuestas sean rastreables hasta una fuente concreta, sin el coste de reentrenar el propio modelo.',
        ],
      },
      zh: {
        term: 'RAG(检索增强生成)',
        short: '在回答时为模型提供外部文档参考，而不是只依赖训练时记住的内容。',
        body: [
          'LLM 的训练数据有截止日期，也不可能包含某家公司的内部文件。RAG 的做法是:问题传入时先在文档库中检索相关段落，再把这些段落连同问题一起喂给模型的上下文窗口，这样答案就能建立在真实、最新的原始材料之上。',
          'RAG 是生产环境 AI 产品中最常见的模式之一，因为它能在不重新训练模型的前提下减少幻觉，并让答案可以追溯到具体来源。',
        ],
      },
    },
  },
  {
    slug: 'hallucination',
    category: 'behavior',
    related: ['rag', 'agentic-ai', 'llm'],
    copy: {
      en: {
        term: 'Hallucination',
        short: 'When an AI model states something false or fabricated with the same confidence as a correct answer.',
        body: [
          "Language models generate text by predicting what's statistically plausible, not by checking a fact database — so a fluent, confident-sounding sentence and a fabricated one can look identical from the outside. Hallucinations range from invented citations to wrong dates to entirely made-up events or people.",
          'Techniques like RAG and tool use — letting a model call a search engine or calculator instead of guessing — reduce hallucination rates, but no released model has eliminated it, which is why fact-checking AI output against primary sources still matters.',
        ],
      },
      ko: {
        term: '환각 (Hallucination)',
        short: 'AI 모델이 사실이 아니거나 지어낸 내용을, 맞는 답과 똑같이 자신 있게 말하는 현상.',
        body: [
          '언어 모델은 사실 데이터베이스를 확인하는 게 아니라 통계적으로 그럴듯한 것을 예측해서 텍스트를 생성합니다. 그래서 유창하고 자신감 있어 보이는 문장이 지어낸 내용이어도 겉보기엔 진짜 답변과 구분이 안 갈 수 있습니다. 환각은 존재하지 않는 인용문부터 잘못된 날짜, 완전히 지어낸 사건이나 인물까지 다양하게 나타납니다.',
          'RAG나 도구 사용(모델이 추측하는 대신 검색엔진이나 계산기를 직접 호출하게 하는 방식) 같은 기법이 환각 비율을 줄여주지만, 지금까지 출시된 어떤 모델도 환각을 완전히 없애지는 못했습니다. AI가 내놓은 내용을 1차 자료와 대조해 확인하는 작업이 여전히 중요한 이유입니다.',
        ],
      },
      ja: {
        term: 'ハルシネーション(幻覚)',
        short: 'AIモデルが事実でない内容や捏造した内容を、正しい答えと同じくらい自信ありげに述べる現象。',
        body: [
          '言語モデルは事実データベースを確認しているのではなく、統計的にそれらしいものを予測してテキストを生成しています。そのため、流暢で自信ありげな文章であっても、それが捏造かどうかは外見からは区別がつきません。ハルシネーションには、存在しない引用から誤った日付、完全に架空の出来事や人物まで、さまざまな形があります。',
          'RAGやツール利用(モデルが推測する代わりに検索エンジンや電卓を直接呼び出す方式)といった手法はハルシネーションの発生率を下げますが、これまでに公開されたどのモデルも完全にはなくせていません。AIの出力を一次資料と突き合わせて確認する作業が依然として重要な理由です。',
        ],
      },
      es: {
        term: 'Alucinación',
        short: 'Cuando un modelo de IA afirma algo falso o inventado con la misma confianza que una respuesta correcta.',
        body: [
          'Los modelos de lenguaje generan texto prediciendo lo que es estadísticamente plausible, no consultando una base de datos de hechos — así que una frase fluida y segura puede ser idéntica, vista desde fuera, a una inventada. Las alucinaciones van desde citas inventadas hasta fechas erróneas o eventos y personas completamente ficticios.',
          'Técnicas como RAG y el uso de herramientas — dejar que el modelo llame a un buscador o una calculadora en vez de adivinar — reducen la tasa de alucinaciones, pero ningún modelo publicado la ha eliminado, por lo que verificar la salida de la IA contra fuentes primarias sigue siendo importante.',
        ],
      },
      zh: {
        term: '幻觉(Hallucination)',
        short: 'AI 模型说出虚假或编造的内容时，语气和自信程度与给出正确答案时一模一样。',
        body: [
          '语言模型生成文本靠的是预测统计上"看似合理"的内容，而不是查证事实数据库——所以一句流畅、自信的话，和一句纯属编造的话，从外表上可能毫无区别。幻觉的表现形式多种多样，从编造的引用、错误的日期，到完全虚构的事件或人物。',
          'RAG 和工具调用(让模型去调用搜索引擎或计算器，而不是自己瞎猜)等技术能降低幻觉发生率，但目前发布的模型没有一个能彻底消除它——这也是为什么把 AI 输出的内容与一手资料核对仍然很重要。',
        ],
      },
    },
  },
  {
    slug: 'agentic-ai',
    category: 'behavior',
    related: ['rag', 'hallucination', 'inference'],
    relatedPost: 'ai-developer-journey-2026',
    copy: {
      en: {
        term: 'Agentic AI (AI Agents)',
        short: "AI systems that don't just answer a single question, but plan multiple steps and take actions — calling tools, browsing, writing and running code — to complete a goal.",
        body: [
          "A standard chatbot answers one prompt at a time. An agent is given a broader goal — “book this trip” or “fix this failing test” — and decides on its own what sequence of tool calls, searches, or code executions will get there, checking its own results along the way and adjusting course.",
          "Agentic AI is a major focus of 2026 product roadmaps because it turns AI from a research assistant into something that can complete real work end-to-end — but it also raises the stakes when the model hallucinates or misjudges a step, since it's now taking actions, not just suggesting text.",
        ],
      },
      ko: {
        term: '에이전틱 AI (AI 에이전트)',
        short: '단일 질문에 답하는 데 그치지 않고, 여러 단계를 계획하고 도구 호출·브라우징·코드 작성 및 실행 같은 행동을 취해 목표를 완수하는 AI 시스템.',
        body: [
          '일반적인 챗봇은 프롬프트 하나에 답 하나를 내놓습니다. 반면 에이전트는 “이 여행 예약해줘”나 “이 실패하는 테스트 고쳐줘” 같은 더 큰 목표를 받고, 그 목표에 도달하기 위해 어떤 순서로 도구를 호출하고, 검색하고, 코드를 실행할지 스스로 결정하며, 중간중간 자기 결과를 점검하고 방향을 수정합니다.',
          '에이전틱 AI는 2026년 제품 로드맵의 핵심 축입니다. AI를 단순한 리서치 보조 도구에서 실제 업무를 처음부터 끝까지 완수할 수 있는 존재로 바꿔주기 때문입니다. 하지만 동시에 위험 부담도 커집니다. 모델이 환각을 일으키거나 중간 단계를 잘못 판단했을 때, 이제는 그저 텍스트를 제안하는 게 아니라 실제 행동을 취하고 있기 때문입니다.',
        ],
      },
      ja: {
        term: 'エージェンティックAI(AIエージェント)',
        short: '単一の質問に答えるだけでなく、複数のステップを計画し、ツール呼び出し・ブラウジング・コードの作成と実行といった行動を取って目標を達成するAIシステム。',
        body: [
          '通常のチャットボットは、一つのプロンプトに一つの答えを返します。一方エージェントは、“この旅行を予約して”や“この失敗しているテストを直して”といった、より広い目標を与えられ、そこに到達するためにどの順序でツールを呼び出し、検索し、コードを実行するかを自ら判断し、途中で自分の結果を確認しながら軌道修正します。',
          'エージェンティックAIは2026年の製品ロードマップの大きな焦点です。AIを単なるリサーチアシスタントから、実際の作業を最初から最後までやり遂げられる存在へと変えるからです。しかし同時にリスクも高まります。モデルが幻覚を起こしたり、途中のステップを誤って判断したりした場合、今やそれは単なる文章の提案ではなく、実際の行動になっているためです。',
        ],
      },
      es: {
        term: 'IA agéntica (agentes de IA)',
        short: 'Sistemas de IA que no solo responden una pregunta, sino que planifican varios pasos y toman acciones — llamar herramientas, navegar, escribir y ejecutar código — para completar un objetivo.',
        body: [
          'Un chatbot estándar responde un prompt a la vez. A un agente se le da un objetivo más amplio — “reserva este viaje” o “arregla esta prueba que falla” — y decide por sí mismo qué secuencia de llamadas a herramientas, búsquedas o ejecuciones de código lo llevará hasta ahí, revisando sus propios resultados por el camino y ajustando el rumbo.',
          'La IA agéntica es un foco central de las hojas de ruta de producto en 2026 porque convierte a la IA de un asistente de investigación en algo capaz de completar trabajo real de principio a fin — pero también eleva el riesgo cuando el modelo alucina o juzga mal un paso, ya que ahora está tomando acciones, no solo sugiriendo texto.',
        ],
      },
      zh: {
        term: '智能体式 AI(AI Agent)',
        short: '不只是回答单个问题，而是能规划多个步骤并采取行动——调用工具、浏览网页、编写并运行代码——以完成一个目标的 AI 系统。',
        body: [
          '普通聊天机器人一次只回答一个提示词。而智能体(agent)被赋予的是更宏观的目标——比如"帮我订这趟行程"或"修好这个失败的测试"——它会自行决定用怎样的工具调用、搜索或代码执行顺序来达成目标，并在过程中检查自己的结果、随时调整路线。',
          '智能体式 AI 是 2026 年产品路线图的重点方向之一，因为它让 AI 从一个"研究助手"变成了能端到端完成实际工作的角色——但这也提高了风险:一旦模型出现幻觉或某一步判断失误，它执行的已经是真实行动，而不只是提出文字建议。',
        ],
      },
    },
  },
  {
    slug: 'moe',
    category: 'infrastructure',
    related: ['transformer', 'inference', 'hbm'],
    copy: {
      en: {
        term: 'MoE (Mixture of Experts)',
        short: "A model architecture that splits its parameters into specialized “expert” sub-networks and activates only a few of them per request, instead of the whole model.",
        body: [
          "A dense model uses all of its parameters for every single token it processes. A Mixture-of-Experts (MoE) model instead contains many smaller expert sub-networks and a “router” that picks a small subset — often just a handful out of dozens — to handle each token.",
          'The appeal is efficiency: MoE lets a model have a very large total parameter count, and the capability that implies, while only paying the inference compute cost of a much smaller active model. Several frontier-scale models in 2025-2026 use MoE designs for exactly this reason.',
        ],
      },
      ko: {
        term: 'MoE (전문가 혼합, Mixture of Experts)',
        short: '전체 파라미터를 여러 개의 전문 “전문가” 서브네트워크로 나누고, 요청마다 그중 일부만 활성화하는 모델 구조.',
        body: [
          '덴스(dense) 모델은 처리하는 토큰 하나하나에 전체 파라미터를 전부 사용합니다. 반면 MoE(전문가 혼합) 모델은 더 작은 전문가 서브네트워크를 여러 개 두고, “라우터”가 토큰마다 그중 극히 일부(수십 개 중 단 몇 개)만 골라 처리하게 합니다.',
          '장점은 효율성입니다. MoE는 모델 전체 파라미터 수를 아주 크게 유지해 그만큼의 능력을 확보하면서도, 실제 추론 연산 비용은 훨씬 작은 활성 모델 수준만 부담하면 됩니다. 2025~2026년 최상위급 모델 여러 개가 바로 이 이유로 MoE 구조를 채택하고 있습니다.',
        ],
      },
      ja: {
        term: 'MoE(専門家混合, Mixture of Experts)',
        short: '全パラメータを複数の専門的な“エキスパート”サブネットワークに分割し、リクエストごとにそのうちの一部だけを活性化させるモデル構造。',
        body: [
          '密(dense)モデルは、処理する一つ一つのトークンに全パラメータを使用します。一方MoE(専門家混合)モデルは、より小さなエキスパートのサブネットワークを多数持ち、“ルーター”がトークンごとにそのうちのごく一部(数十個のうちわずか数個)だけを選んで処理させます。',
          '利点は効率性です。MoEはモデル全体のパラメータ数を非常に大きく保ち、それに見合う能力を確保しながらも、実際の推論計算コストははるかに小さいアクティブモデル分だけで済みます。2025〜2026年の最先端規模のモデルの多くが、まさにこの理由でMoE設計を採用しています。',
        ],
      },
      es: {
        term: 'MoE (Mezcla de Expertos)',
        short: 'Una arquitectura de modelo que divide sus parámetros en subredes “expertas” especializadas y activa solo unas pocas por petición, en vez de todo el modelo.',
        body: [
          'Un modelo denso usa todos sus parámetros para cada token que procesa. Un modelo de Mezcla de Expertos (MoE), en cambio, contiene muchas subredes expertas más pequeñas y un “enrutador” que elige un pequeño subconjunto — a menudo solo un puñado de docenas — para gestionar cada token.',
          'El atractivo es la eficiencia: MoE permite que un modelo tenga un recuento total de parámetros muy grande, y la capacidad que eso implica, pagando solo el coste de cómputo de inferencia de un modelo activo mucho más pequeño. Varios modelos de vanguardia de 2025-2026 usan diseños MoE precisamente por esta razón.',
        ],
      },
      zh: {
        term: 'MoE(专家混合)',
        short: '一种模型架构，把全部参数拆分成多个专门化的"专家"子网络，每次请求只激活其中一小部分，而不是动用整个模型。',
        body: [
          '稠密(dense)模型处理每一个 token 时都要用上全部参数。而 MoE(专家混合)模型则包含许多更小的专家子网络，并由一个"路由器"为每个 token 挑选其中一小部分(往往是几十个专家里的寥寥几个)来处理。',
          'MoE 的吸引力在于效率:它让模型可以拥有非常庞大的总参数量、以及随之而来的能力，而实际推理所付出的算力成本却只相当于一个小得多的"激活模型"。2025-2026 年间多款顶尖规模的模型采用 MoE 设计，正是出于这个原因。',
        ],
      },
    },
  },
  {
    slug: 'hbm',
    category: 'infrastructure',
    related: ['moe', 'inference', 'transformer'],
    relatedPost: 'hbm-ai-bottleneck-2026',
    copy: {
      en: {
        term: 'HBM (High Bandwidth Memory)',
        short: 'A type of memory stacked directly next to an AI chip to feed it data fast enough to keep up with its compute — a key bottleneck in the AI buildout.',
        body: [
          "AI accelerators like GPUs can perform vastly more calculations per second than conventional memory can supply them with data — a gap known as the “memory wall.” HBM closes part of that gap by stacking multiple layers of memory chips vertically and connecting them to the processor with a very wide, very short interconnect, dramatically increasing bandwidth compared to standard DRAM.",
          'HBM supply is dominated by a handful of makers — principally SK hynix, Samsung, and Micron — and demand from AI training and inference has turned it into one of the tightest-supplied, most strategically important components in the entire AI stack.',
        ],
      },
      ko: {
        term: 'HBM (고대역폭 메모리)',
        short: 'AI 칩 바로 옆에 쌓아 올려, 칩의 연산 속도를 따라갈 만큼 빠르게 데이터를 공급하는 메모리 — AI 인프라 구축의 핵심 병목 지점.',
        body: [
          'GPU 같은 AI 가속기는 초당 처리할 수 있는 연산량이 일반 메모리가 데이터를 공급할 수 있는 속도보다 훨씬 앞서 있는데, 이 간극을 “메모리 벽(memory wall)”이라 부릅니다. HBM은 메모리 칩을 여러 층으로 수직으로 쌓고 프로세서와 매우 넓고 짧은 인터커넥트로 연결해, 일반 D램 대비 대역폭을 크게 끌어올림으로써 이 간극의 일부를 메웁니다.',
          'HBM 공급은 SK하이닉스, 삼성, 마이크론 등 소수 업체가 사실상 독점하고 있습니다. AI 학습과 추론 수요가 몰리면서 HBM은 전체 AI 스택 안에서 공급이 가장 빠듯하고 전략적으로도 가장 중요한 부품 중 하나가 됐습니다.',
        ],
      },
      ja: {
        term: 'HBM(高帯域幅メモリ)',
        short: 'AIチップのすぐそばに積み重ねて配置し、チップの演算速度に追いつけるだけの速さでデータを供給するメモリ — AIインフラ構築における主要なボトルネック。',
        body: [
          'GPUなどのAIアクセラレータは、1秒あたりに実行できる演算量が、一般的なメモリがデータを供給できる速度をはるかに上回っており、この差は“メモリウォール(memory wall)”と呼ばれます。HBMはメモリチップを複数層垂直に積み重ね、プロセッサと非常に幅広く短い配線でつなぐことで、通常のDRAMに比べて帯域幅を大幅に引き上げ、このギャップの一部を埋めています。',
          'HBMの供給はSKハイニックス、サムスン、マイクロンなどごく少数のメーカーに集中しています。AIの学習と推論からの需要が集中した結果、HBMはAIスタック全体の中でも供給が最も逼迫し、戦略的にも最も重要な部品の一つとなっています。',
        ],
      },
      es: {
        term: 'HBM (Memoria de Ancho de Banda Alto)',
        short: 'Un tipo de memoria apilada justo junto a un chip de IA para alimentarlo con datos lo bastante rápido como para seguir el ritmo de su cómputo — un cuello de botella clave en la expansión de la IA.',
        body: [
          'Los aceleradores de IA como las GPU pueden realizar muchísimos más cálculos por segundo de los que la memoria convencional puede suministrarles datos — una brecha conocida como el “muro de memoria”. HBM cierra parte de esa brecha apilando verticalmente varias capas de chips de memoria y conectándolas al procesador con una interconexión muy ancha y muy corta, aumentando drásticamente el ancho de banda frente a la DRAM estándar.',
          'El suministro de HBM está dominado por un puñado de fabricantes — principalmente SK hynix, Samsung y Micron — y la demanda del entrenamiento e inferencia de IA la ha convertido en uno de los componentes con suministro más ajustado y más importantes estratégicamente en toda la pila de IA.',
        ],
      },
      zh: {
        term: 'HBM(高带宽内存)',
        short: '一种直接堆叠在 AI 芯片旁边的内存，用于以足够快的速度为芯片供应数据、跟上其算力——是 AI 基础设施建设中的关键瓶颈。',
        body: [
          'GPU 等 AI 加速器每秒能完成的运算量，远超普通内存所能提供数据的速度，这一差距被称为"内存墙(memory wall)"。HBM 通过将多层内存芯片垂直堆叠、并用极宽极短的互联线路与处理器相连，大幅提升了相对于标准 DRAM 的带宽，从而弥补了这一差距的一部分。',
          'HBM 的供应被少数几家厂商主导——主要是 SK 海力士、三星和美光。来自 AI 训练与推理的需求，已经让它成为整个 AI 产业链中供应最紧张、也在战略上最重要的组件之一。',
        ],
      },
    },
  },
];

export function glossaryTerm(slug: string): GlossaryEntry | undefined {
  return glossaryTerms.find((g) => g.slug === slug);
}
export function glossaryUrl(slug: string, lang: Lang): string {
  return lang === 'en' ? `/glossary/${slug}/` : `/${lang}/glossary/${slug}/`;
}
export function glossaryIndexUrl(lang: Lang): string {
  return lang === 'en' ? '/glossary/' : `/${lang}/glossary/`;
}
