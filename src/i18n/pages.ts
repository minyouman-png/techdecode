// About / Contact / Privacy 페이지의 다국어 콘텐츠.
// 내부 링크(About/Contact/Privacy)는 언어별 경로로 미리 계산해 넣는다.
import { localizeUrl } from './utils';
import type { Lang } from './ui';

interface PageCopy {
  title: string;
  description: string;
  html: string;
}

const EMAIL = 'minyouman@gmail.com';
const ADS_SETTINGS = 'https://www.google.com/settings/ads';
const ADS_POLICY = 'https://policies.google.com/technologies/partner-sites';

function paths(lang: Lang) {
  return {
    about: localizeUrl('/about/', lang),
    contact: localizeUrl('/contact/', lang),
    privacy: localizeUrl('/privacy/', lang),
  };
}

function about(lang: Lang): PageCopy {
  const p = paths(lang);
  const by: Record<Lang, PageCopy> = {
    en: {
      title: 'About',
      description: 'What Tech Decode is and who writes it.',
      html: `
        <h1>About Tech Decode</h1>
        <p class="lede">Independent, plain-English analysis of technology and markets.</p>
        <p>Tech Decode exists to answer one question well: <em>what is actually going on, and what does it mean?</em> The tech and semiconductor world runs on hype cycles and press releases. We cut through them with careful reading of primary sources — court filings, earnings data, and industry research — and explain the story in language a normal person can follow.</p>
        <p>Every article is researched and edited by a human before it is published. We cite our sources, we flag what is proven versus alleged, and we tell you when something is speculation. We do not publish auto-generated filler.</p>
        <h2>Who writes this</h2>
        <p>Tech Decode is written and edited by <strong>menew</strong>, a working software developer and individual investor based in South Korea. That background shapes what you read here in two concrete ways. First, as a developer who has built and run local AI-automation systems hands-on — not just read about them — the coverage of chips, AI infrastructure, and developer tools is grounded in real, first-hand experience. Second, as an active retail investor, the market and governance pieces are written from the perspective of someone with actual skin in the game, not a detached observer.</p>
        <p>menew writes under a handle rather than a full legal name, but every piece reflects one person's research, judgment, and accountability. If something here is wrong, that's on menew — and we want to hear about it (see <a href="${p.contact}">Contact</a>).</p>
        <h2>What we cover</h2>
        <ul>
          <li>The semiconductor and memory market (DRAM, HBM, NAND)</li>
          <li>Antitrust, regulation, and the legal side of big tech</li>
          <li>AI infrastructure and the companies building it</li>
        </ul>
        <h2>A note on independence</h2>
        <p>Some links on this site are affiliate links, and we may run display ads. These never influence our analysis, and nothing on this site is financial or investment advice. Always do your own research before making money decisions.</p>
      `,
    },
    ko: {
      title: '소개',
      description: 'Tech Decode(미뉴소프트, menewsoft.com)는 무엇이고 누가 쓰는지 소개합니다.',
      html: `
        <h1>Tech Decode 소개</h1>
        <p class="lede">기술과 시장에 대한 독립적이고 쉬운 분석.</p>
        <p>Tech Decode는 하나의 질문에 제대로 답하기 위해 존재합니다: <em>지금 실제로 무슨 일이 일어나고 있고, 그것이 무엇을 의미하는가?</em> 테크·반도체 업계는 보도자료와 과장 사이클로 돌아갑니다. 저희는 소송 서류, 실적 데이터, 산업 리서치 같은 1차 자료를 꼼꼼히 읽어 그 과장을 걷어내고, 평범한 사람도 따라갈 수 있는 언어로 이야기를 설명합니다.</p>
        <p>모든 글은 게시 전에 사람이 직접 리서치하고 편집합니다. 출처를 표기하고, 입증된 것과 의혹인 것을 구분하며, 추측일 때는 추측이라고 밝힙니다. 자동 생성된 채우기 글은 게시하지 않습니다.</p>
        <p>사이트 주소인 menewsoft.com은 한글로 <strong>미뉴소프트</strong>라고 읽습니다. 미뉴소프트에서는 분석 글과 함께, 브라우저에서 바로 쓰는 <a href="/ko/tools/">무료 문서 도구(MeNew Docs)</a>와 <a href="/ko/games/">웹 게임</a>도 제공합니다.</p>
        <h2>누가 쓰나요</h2>
        <p>Tech Decode는 한국에 거주하는 현직 소프트웨어 개발자이자 개인 투자자인 <strong>menew</strong>가 쓰고 편집합니다. 이 배경은 이 사이트의 글에 두 가지 방식으로 반영됩니다. 첫째, 로컬 AI 자동화 시스템을 직접 만들고 운영해 본 개발자로서, 단순히 읽고 쓰는 게 아니라 반도체·AI 인프라·개발자 도구에 대한 글은 실제 1차 경험에 근거합니다. 둘째, 실제로 투자하고 있는 개인 투자자로서, 시장과 거버넌스 관련 글은 관망자가 아니라 실제 이해관계가 걸린 사람의 시각에서 쓰입니다.</p>
        <p>menew는 실명이 아닌 핸들로 글을 씁니다만, 모든 글은 한 사람의 리서치와 판단, 책임을 반영합니다. 여기서 틀린 것이 있다면 그것은 menew의 책임이며, 저희는 그 이야기를 듣고 싶습니다 (<a href="${p.contact}">문의</a>).</p>
        <h2>다루는 주제</h2>
        <ul>
          <li>반도체·메모리 시장(D램, HBM, 낸드)</li>
          <li>빅테크의 반독점·규제·법률 이슈</li>
          <li>AI 인프라와 이를 만드는 기업들</li>
        </ul>
        <h2>독립성에 대하여</h2>
        <p>이 사이트의 일부 링크는 제휴 링크이며, 디스플레이 광고를 운영할 수 있습니다. 이는 저희의 분석에 전혀 영향을 주지 않으며, 이 사이트의 어떤 내용도 재무·투자 조언이 아닙니다. 돈과 관련된 결정을 내리기 전에는 항상 스스로 조사하시기 바랍니다.</p>
      `,
    },
    ja: {
      title: '概要',
      description: 'Tech Decodeとは何か、誰が書いているか。',
      html: `
        <h1>Tech Decode について</h1>
        <p class="lede">テクノロジーと市場についての、独立した分かりやすい分析。</p>
        <p>Tech Decodeは、ひとつの問いにきちんと答えるために存在します — <em>実際に何が起きていて、それは何を意味するのか?</em> テック・半導体業界は、プレスリリースと誇張のサイクルで回っています。私たちは訴訟書類、決算データ、業界リサーチといった一次資料を丁寧に読み込み、誇張を取り除いて、普通の人にも追える言葉で物語を説明します。</p>
        <p>すべての記事は、公開前に人間がリサーチし編集します。出典を明記し、証明されたことと申し立てを区別し、推測であるときはそう明示します。自動生成された埋め草記事は掲載しません。</p>
        <h2>執筆者について</h2>
        <p>Tech Decodeは、韓国在住の現役ソフトウェア開発者であり個人投資家でもある<strong>menew</strong>が執筆・編集しています。この背景は、ここでの記事に二つの形で反映されています。まず、ローカルAI自動化システムを実際に構築・運用してきた開発者として、半導体・AIインフラ・開発者ツールに関する記事は、単なる伝聞ではなく実体験に基づいています。次に、現役の個人投資家として、市場やガバナンスに関する記事は、傍観者ではなく実際に利害を持つ人の視点から書かれています。</p>
        <p>menewは本名ではなくハンドルネームで執筆していますが、すべての記事は一人の人間のリサーチと判断、そして責任を反映しています。もし間違いがあれば、それはmenewの責任です — ぜひお知らせください(<a href="${p.contact}">お問い合わせ</a>)。</p>
        <h2>取り扱うテーマ</h2>
        <ul>
          <li>半導体・メモリ市場(DRAM、HBM、NAND)</li>
          <li>ビッグテックの独占禁止・規制・法律問題</li>
          <li>AIインフラとそれを構築する企業</li>
        </ul>
        <h2>独立性について</h2>
        <p>このサイトの一部のリンクはアフィリエイトリンクであり、ディスプレイ広告を掲載することもあります。これらは私たちの分析に一切影響を与えません。また、このサイトの内容は財務・投資助言ではありません。お金に関する判断を下す前には、必ずご自身で調査してください。</p>
      `,
    },
    es: {
      title: 'Sobre nosotros',
      description: 'Qué es Tech Decode y quién lo escribe.',
      html: `
        <h1>Sobre Tech Decode</h1>
        <p class="lede">Análisis independiente y en lenguaje claro sobre tecnología y mercados.</p>
        <p>Tech Decode existe para responder bien a una pregunta: <em>¿qué está pasando realmente, y qué significa?</em> El mundo de la tecnología y los semiconductores funciona a base de ciclos de hype y notas de prensa. Nosotros los atravesamos leyendo con cuidado las fuentes primarias — documentos judiciales, datos de resultados e investigación del sector — y explicamos la historia en un lenguaje que cualquiera pueda seguir.</p>
        <p>Cada artículo es investigado y editado por una persona antes de publicarse. Citamos nuestras fuentes, señalamos qué está probado y qué es solo una acusación, y avisamos cuando algo es especulación. No publicamos relleno generado automáticamente.</p>
        <h2>Quién escribe esto</h2>
        <p>Tech Decode está escrito y editado por <strong>menew</strong>, desarrollador de software en activo e inversor particular residente en Corea del Sur. Ese trasfondo moldea lo que lees aquí de dos formas concretas. Primero, como desarrollador que ha construido y operado sistemas de automatización de IA local con sus propias manos — no solo leído sobre ellos —, la cobertura de chips, infraestructura de IA y herramientas para desarrolladores está anclada en experiencia real de primera mano. Segundo, como inversor particular activo, las piezas sobre mercados y gobernanza están escritas desde la perspectiva de alguien con intereses reales en juego, no de un observador distante.</p>
        <p>menew escribe bajo un seudónimo y no con su nombre legal completo, pero cada pieza refleja la investigación, el juicio y la responsabilidad de una sola persona. Si algo aquí está mal, es responsabilidad de menew — y queremos saberlo (ver <a href="${p.contact}">Contacto</a>).</p>
        <h2>Qué cubrimos</h2>
        <ul>
          <li>El mercado de semiconductores y memoria (DRAM, HBM, NAND)</li>
          <li>Antimonopolio, regulación y el lado legal de las grandes tecnológicas</li>
          <li>Infraestructura de IA y las empresas que la construyen</li>
        </ul>
        <h2>Una nota sobre la independencia</h2>
        <p>Algunos enlaces en este sitio son enlaces de afiliados, y podemos mostrar anuncios display. Estos nunca influyen en nuestro análisis, y nada en este sitio es asesoramiento financiero o de inversión. Investiga siempre por tu cuenta antes de tomar decisiones sobre tu dinero.</p>
      `,
    },
    zh: {
      title: '关于我们',
      description: 'Tech Decode 是什么、由谁撰写。',
      html: `
        <h1>关于 Tech Decode</h1>
        <p class="lede">关于科技与市场的独立、通俗分析。</p>
        <p>Tech Decode 的存在就是为了认真回答一个问题:<em>到底发生了什么,这又意味着什么?</em>科技和半导体行业靠新闻稿和炒作周期运转。我们仔细阅读法庭文件、财报数据、行业研究等一手资料,拨开炒作的迷雾,用普通人也能看懂的语言讲清楚。</p>
        <p>每篇文章在发布前都由真人研究和编辑。我们标明信息来源,区分已证实和仅为指控的内容,遇到推测时也会明确说明。我们不发布 AI 批量生成的水文。</p>
        <h2>作者是谁</h2>
        <p>Tech Decode 由常驻韩国的在职软件开发者兼个人投资者 <strong>menew</strong> 撰写和编辑。这个背景以两种具体方式影响着这里的内容。首先,作为亲手构建并运行本地 AI 自动化系统的开发者——而不只是读过相关资料——芯片、AI 基础设施和开发者工具方面的报道都扎根于真实的第一手经验。其次,作为活跃的个人投资者,市场与公司治理相关的文章是从真正有切身利益的人的视角写的,而不是旁观者。</p>
        <p>menew 用昵称而非本名署名,但每一篇文章都体现着一个人的研究、判断与责任。如果这里有错误,责任在 menew——我们也很想听到你的反馈(见<a href="${p.contact}">联系我们</a>)。</p>
        <h2>我们关注什么</h2>
        <ul>
          <li>半导体与存储市场(DRAM、HBM、NAND)</li>
          <li>大型科技公司的反垄断、监管与法律事务</li>
          <li>AI 基础设施及其建设者</li>
        </ul>
        <h2>关于独立性的说明</h2>
        <p>本网站的部分链接为联盟链接,我们也可能展示展示广告。这些都不会影响我们的分析,本网站的任何内容都不构成财务或投资建议。在做出任何与金钱相关的决定之前,请务必自行研究。</p>
      `,
    },
  };
  return by[lang];
}

function contact(lang: Lang): PageCopy {
  const p = paths(lang);
  const by: Record<Lang, PageCopy> = {
    en: {
      title: 'Contact',
      description: 'How to reach Tech Decode — questions, corrections, and feedback.',
      html: `
        <h1>Contact</h1>
        <p class="lede">Questions, corrections, tips, or feedback — we'd genuinely like to hear from you.</p>
        <p>Tech Decode is an independent publication written by <strong>menew</strong>, and we take accuracy seriously. If you spot an error in an article, have a question about our analysis, or want to suggest a topic, please email us:</p>
        <p style="font-size:1.15rem;"><strong><a href="mailto:${EMAIL}">${EMAIL}</a></strong></p>
        <p>We read every message. For corrections, please include the article title and a link if you can — we update pieces when the facts warrant it and note significant changes.</p>
        <h2>What we can't do</h2>
        <p>We can't offer personalized financial, investment, or legal advice. Everything we publish is general analysis for information only. Please see our <a href="${p.about}">About</a> and <a href="${p.privacy}">Privacy Policy</a> pages for more.</p>
      `,
    },
    ko: {
      title: '문의',
      description: 'Tech Decode에 문의하는 방법 — 질문, 정정, 피드백.',
      html: `
        <h1>문의</h1>
        <p class="lede">질문, 정정 요청, 제보, 피드백 — 진심으로 듣고 싶습니다.</p>
        <p>Tech Decode는 <strong>menew</strong>가 쓰는 독립 매체이며, 정확성을 중요하게 생각합니다. 글에서 오류를 발견했거나, 저희 분석에 대해 궁금한 점이 있거나, 다루었으면 하는 주제가 있다면 이메일로 알려주세요:</p>
        <p style="font-size:1.15rem;"><strong><a href="mailto:${EMAIL}">${EMAIL}</a></strong></p>
        <p>모든 메시지를 읽습니다. 정정 요청 시 가능하면 글 제목과 링크를 함께 보내주세요 — 사실관계가 필요하면 글을 수정하고, 중요한 변경 사항은 표시합니다.</p>
        <h2>저희가 할 수 없는 것</h2>
        <p>개인 맞춤형 재무·투자·법률 조언은 드릴 수 없습니다. 저희가 게시하는 모든 것은 정보 제공 목적의 일반적인 분석입니다. 자세한 내용은 <a href="${p.about}">소개</a> 및 <a href="${p.privacy}">개인정보처리방침</a> 페이지를 참고해 주세요.</p>
      `,
    },
    ja: {
      title: 'お問い合わせ',
      description: 'Tech Decodeへの連絡方法 — 質問、訂正、ご意見。',
      html: `
        <h1>お問い合わせ</h1>
        <p class="lede">ご質問、訂正のご指摘、情報提供、ご意見 — ぜひお聞かせください。</p>
        <p>Tech Decodeは<strong>menew</strong>が執筆する独立系メディアであり、正確性を重視しています。記事の誤りを見つけた場合、分析について質問がある場合、取り上げてほしいテーマがある場合は、メールでお知らせください:</p>
        <p style="font-size:1.15rem;"><strong><a href="mailto:${EMAIL}">${EMAIL}</a></strong></p>
        <p>いただいたメッセージはすべて読んでいます。訂正のご指摘には、可能であれば記事タイトルとリンクを添えてください — 事実関係に応じて記事を更新し、重要な変更は明記します。</p>
        <h2>できないこと</h2>
        <p>個別の財務・投資・法律アドバイスは提供できません。私たちが公開するものはすべて、情報提供のみを目的とした一般的な分析です。詳しくは<a href="${p.about}">概要</a>および<a href="${p.privacy}">プライバシーポリシー</a>ページをご覧ください。</p>
      `,
    },
    es: {
      title: 'Contacto',
      description: 'Cómo contactar con Tech Decode — preguntas, correcciones y comentarios.',
      html: `
        <h1>Contacto</h1>
        <p class="lede">Preguntas, correcciones, pistas o comentarios — nos encantaría saber de ti.</p>
        <p>Tech Decode es una publicación independiente escrita por <strong>menew</strong>, y nos tomamos la precisión en serio. Si detectas un error en un artículo, tienes una pregunta sobre nuestro análisis o quieres sugerir un tema, escríbenos a:</p>
        <p style="font-size:1.15rem;"><strong><a href="mailto:${EMAIL}">${EMAIL}</a></strong></p>
        <p>Leemos todos los mensajes. Para correcciones, incluye el título del artículo y un enlace si puedes — actualizamos las piezas cuando los hechos lo justifican y señalamos los cambios importantes.</p>
        <h2>Lo que no podemos hacer</h2>
        <p>No podemos ofrecer asesoramiento financiero, de inversión o legal personalizado. Todo lo que publicamos es análisis general con fines informativos. Consulta nuestras páginas de <a href="${p.about}">Sobre nosotros</a> y <a href="${p.privacy}">Política de privacidad</a> para más información.</p>
      `,
    },
    zh: {
      title: '联系我们',
      description: '如何联系 Tech Decode——问题、更正与反馈。',
      html: `
        <h1>联系我们</h1>
        <p class="lede">问题、更正、爆料或反馈——我们都很想听到。</p>
        <p>Tech Decode 是由 <strong>menew</strong> 撰写的独立媒体,我们非常重视准确性。如果你在文章中发现错误、对我们的分析有疑问,或想建议一个话题,请发邮件告诉我们:</p>
        <p style="font-size:1.15rem;"><strong><a href="mailto:${EMAIL}">${EMAIL}</a></strong></p>
        <p>我们会阅读每一条消息。如需更正,请尽量附上文章标题和链接——我们会在事实需要时更新文章,并标注重大改动。</p>
        <h2>我们做不到的事</h2>
        <p>我们无法提供个性化的财务、投资或法律建议。我们发布的一切内容都只是用于信息参考的一般性分析。更多信息请参阅<a href="${p.about}">关于我们</a>和<a href="${p.privacy}">隐私政策</a>页面。</p>
      `,
    },
  };
  return by[lang];
}

function privacy(lang: Lang): PageCopy {
  const p = paths(lang);
  const by: Record<Lang, PageCopy> = {
    en: {
      title: 'Privacy Policy',
      description: 'How Tech Decode handles data, cookies, and advertising.',
      html: `
        <h1>Privacy Policy</h1>
        <p class="post-meta">Last updated: July 2026</p>
        <p>This Privacy Policy explains how Tech Decode ("we", "us") handles information when you visit this website.</p>
        <h2>Information we collect</h2>
        <p>We do not ask you to create an account or submit personal information to read this site. Like most websites, our hosting provider may automatically log standard technical data such as your IP address, browser type, and the pages you visit, for security and analytics purposes.</p>
        <h2>Cookies and advertising</h2>
        <p>We may use third-party advertising, including Google AdSense, to support this site. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the Internet.</p>
        <p>You may opt out of personalized advertising by visiting <a href="${ADS_SETTINGS}" rel="nofollow noopener" target="_blank">Google Ads Settings</a>. For more on how Google uses data, see <a href="${ADS_POLICY}" rel="nofollow noopener" target="_blank">Google's policy page</a>.</p>
        <h2>Affiliate links</h2>
        <p>Some articles contain affiliate links. If you click one and make a purchase, we may earn a commission at no additional cost to you. This does not affect our editorial content.</p>
        <h2>Contact</h2>
        <p>Questions about this policy? Email us at <a href="mailto:${EMAIL}">${EMAIL}</a> or via our <a href="${p.contact}">Contact</a> page.</p>
      `,
    },
    ko: {
      title: '개인정보처리방침',
      description: 'Tech Decode가 데이터, 쿠키, 광고를 다루는 방식.',
      html: `
        <h1>개인정보처리방침</h1>
        <p class="post-meta">최종 수정: 2026년 7월</p>
        <p>이 개인정보처리방침은 귀하가 이 웹사이트를 방문할 때 Tech Decode("저희")가 정보를 어떻게 처리하는지 설명합니다.</p>
        <h2>수집하는 정보</h2>
        <p>이 사이트를 읽기 위해 계정을 만들거나 개인정보를 제출하도록 요구하지 않습니다. 대부분의 웹사이트와 마찬가지로, 저희 호스팅 제공업체는 보안과 분석 목적으로 IP 주소, 브라우저 종류, 방문한 페이지 같은 표준 기술 데이터를 자동으로 기록할 수 있습니다.</p>
        <h2>쿠키와 광고</h2>
        <p>이 사이트를 유지하기 위해 Google 애드센스를 포함한 제3자 광고를 사용할 수 있습니다. Google을 포함한 제3자 공급업체는 귀하가 이 사이트 및 다른 사이트를 방문한 기록을 바탕으로 광고를 게재하기 위해 쿠키를 사용합니다. Google의 광고 쿠키 사용을 통해 Google과 파트너사는 귀하가 이 사이트 및/또는 인터넷의 다른 사이트를 방문한 기록을 바탕으로 광고를 게재할 수 있습니다.</p>
        <p>맞춤 광고를 원하지 않으시면 <a href="${ADS_SETTINGS}" rel="nofollow noopener" target="_blank">Google 광고 설정</a> 페이지를 방문해 옵트아웃할 수 있습니다. Google이 데이터를 어떻게 사용하는지는 <a href="${ADS_POLICY}" rel="nofollow noopener" target="_blank">Google 정책 페이지</a>를 참고하세요.</p>
        <h2>제휴 링크</h2>
        <p>일부 글에는 제휴 링크가 포함되어 있습니다. 링크를 클릭해 구매하시면 추가 비용 없이 저희가 수수료를 받을 수 있습니다. 이는 편집 내용에 영향을 주지 않습니다.</p>
        <h2>문의</h2>
        <p>이 정책에 대해 궁금한 점이 있으시면 <a href="mailto:${EMAIL}">${EMAIL}</a> 이메일이나 <a href="${p.contact}">문의</a> 페이지를 통해 연락해 주세요.</p>
      `,
    },
    ja: {
      title: 'プライバシーポリシー',
      description: 'Tech Decodeによるデータ、クッキー、広告の取り扱いについて。',
      html: `
        <h1>プライバシーポリシー</h1>
        <p class="post-meta">最終更新: 2026年7月</p>
        <p>このプライバシーポリシーは、あなたがこのウェブサイトを訪問した際にTech Decode(「私たち」)が情報をどのように扱うかを説明します。</p>
        <h2>収集する情報</h2>
        <p>このサイトを読むために、アカウント作成や個人情報の提出を求めることはありません。多くのウェブサイトと同様、ホスティングプロバイダーがセキュリティおよび分析目的で、IPアドレス、ブラウザの種類、閲覧ページなどの標準的な技術データを自動的に記録することがあります。</p>
        <h2>クッキーと広告</h2>
        <p>このサイトを支えるために、Googleアドセンスを含むサードパーティ広告を使用することがあります。Googleを含むサードパーティベンダーは、あなたが本サイトや他のサイトを訪問した履歴に基づいて広告を配信するためにクッキーを使用します。Googleの広告クッキーの利用により、Googleおよびそのパートナーは、あなたが本サイトおよび/またはインターネット上の他のサイトを訪問した履歴に基づいて広告を配信できます。</p>
        <p>パーソナライズ広告を無効にしたい場合は、<a href="${ADS_SETTINGS}" rel="nofollow noopener" target="_blank">Google広告設定</a>ページからオプトアウトできます。Googleによるデータの利用方法については、<a href="${ADS_POLICY}" rel="nofollow noopener" target="_blank">Googleのポリシーページ</a>をご覧ください。</p>
        <h2>アフィリエイトリンク</h2>
        <p>一部の記事にはアフィリエイトリンクが含まれています。リンクをクリックして購入された場合、追加費用なしで私たちに手数料が支払われることがあります。これは編集内容に影響を与えません。</p>
        <h2>お問い合わせ</h2>
        <p>このポリシーについてご質問がある場合は、<a href="mailto:${EMAIL}">${EMAIL}</a>宛のメール、または<a href="${p.contact}">お問い合わせ</a>ページからご連絡ください。</p>
      `,
    },
    es: {
      title: 'Política de privacidad',
      description: 'Cómo maneja Tech Decode los datos, las cookies y la publicidad.',
      html: `
        <h1>Política de privacidad</h1>
        <p class="post-meta">Última actualización: julio de 2026</p>
        <p>Esta Política de privacidad explica cómo Tech Decode ("nosotros") maneja la información cuando visitas este sitio web.</p>
        <h2>Información que recopilamos</h2>
        <p>No te pedimos crear una cuenta ni enviar información personal para leer este sitio. Como la mayoría de los sitios web, nuestro proveedor de alojamiento puede registrar automáticamente datos técnicos estándar, como tu dirección IP, tipo de navegador y las páginas que visitas, con fines de seguridad y análisis.</p>
        <h2>Cookies y publicidad</h2>
        <p>Podemos usar publicidad de terceros, incluido Google AdSense, para financiar este sitio. Proveedores externos, incluido Google, usan cookies para mostrar anuncios basados en tus visitas previas a este y otros sitios web. El uso de cookies publicitarias de Google permite que Google y sus socios muestren anuncios basados en tus visitas a este sitio y/u otros sitios de Internet.</p>
        <p>Puedes optar por no recibir publicidad personalizada visitando la <a href="${ADS_SETTINGS}" rel="nofollow noopener" target="_blank">Configuración de anuncios de Google</a>. Para más información sobre cómo Google usa los datos, consulta la <a href="${ADS_POLICY}" rel="nofollow noopener" target="_blank">página de políticas de Google</a>.</p>
        <h2>Enlaces de afiliados</h2>
        <p>Algunos artículos contienen enlaces de afiliados. Si haces clic en uno y realizas una compra, podemos ganar una comisión sin costo adicional para ti. Esto no afecta a nuestro contenido editorial.</p>
        <h2>Contacto</h2>
        <p>¿Preguntas sobre esta política? Escríbenos a <a href="mailto:${EMAIL}">${EMAIL}</a> o a través de nuestra página de <a href="${p.contact}">Contacto</a>.</p>
      `,
    },
    zh: {
      title: '隐私政策',
      description: 'Tech Decode 如何处理数据、Cookie 与广告。',
      html: `
        <h1>隐私政策</h1>
        <p class="post-meta">最后更新:2026年7月</p>
        <p>本隐私政策说明当你访问本网站时,Tech Decode("我们")如何处理相关信息。</p>
        <h2>我们收集的信息</h2>
        <p>阅读本站无需你创建账户或提交个人信息。和大多数网站一样,我们的托管服务商可能会出于安全和统计分析目的,自动记录标准技术数据,例如你的 IP 地址、浏览器类型以及访问的页面。</p>
        <h2>Cookie 与广告</h2>
        <p>我们可能使用包括 Google AdSense 在内的第三方广告来支持本站运营。包括 Google 在内的第三方供应商会使用 Cookie,根据你之前对本站及其他网站的访问记录来投放广告。Google 使用广告 Cookie,使其及其合作伙伴能够根据你对本站和/或互联网上其他网站的访问情况投放广告。</p>
        <p>你可以访问 <a href="${ADS_SETTINGS}" rel="nofollow noopener" target="_blank">Google 广告设置</a>页面选择退出个性化广告。关于 Google 如何使用数据,请参阅 <a href="${ADS_POLICY}" rel="nofollow noopener" target="_blank">Google 的政策页面</a>。</p>
        <h2>联盟链接</h2>
        <p>部分文章包含联盟链接。如果你点击链接并完成购买,我们可能会获得佣金,你无需为此支付额外费用。这不会影响我们的编辑内容。</p>
        <h2>联系我们</h2>
        <p>对本政策有疑问?请发邮件至 <a href="mailto:${EMAIL}">${EMAIL}</a> 或通过我们的<a href="${p.contact}">联系我们</a>页面与我们联络。</p>
      `,
    },
  };
  return by[lang];
}

export const pagesCopy = { about, contact, privacy };
