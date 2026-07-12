// AI 인디게임 섹션: 게임 레지스트리 + 언어별 카피.
// 새 게임 추가 시 games 배열에 항목을 추가하면 인덱스/상세 페이지가 자동 생성된다.
import type { Lang } from './ui';

/* ===== 섹션 공통 문자열 ===== */
export const gamesUi: Record<Lang, Record<string, string>> = {
  en: {
    kicker: 'AI INDIE GAMES',
    pageTitle: 'AI Indie Games',
    metaDescription:
      'Free browser games built 100% with AI. Each game is a time capsule of what AI could create at the moment it was made.',
    intro1:
      'Every game here was built entirely with AI — the engine code, the physics, the textures, even the sound effects. No game engine, no asset store. Just prompts.',
    intro2:
      'Each game is stamped with the date it was made. As AI evolves, new games will join this shelf — and the older ones will stay exactly as they are, a playable record of what AI could build at that moment in time. Play them free, right in your browser.',
    playNow: '▶ Play now',
    aboutTitle: 'About this game',
    howTitle: 'How to play',
    openFull: 'Open in full window ↗',
    releasedLabel: 'Released',
    techLabel: 'Tech',
    aiBadge: '100% AI-built',
    backToList: '← All games',
    saveNote: 'Your progress is saved automatically in your browser — close the tab and your world will be here when you return.',
    clickToPlay: 'Click inside the game to start. Press ESC to release the mouse.',
  },
  ko: {
    kicker: 'AI 인디게임',
    pageTitle: 'AI 인디게임',
    metaDescription:
      'AI로 100% 제작한 무료 브라우저 게임. 각 게임은 제작 시점의 AI가 무엇을 만들 수 있었는지 보여주는 타임캡슐입니다.',
    intro1:
      '여기 있는 게임은 전부 AI가 만들었습니다. 엔진 코드, 물리, 텍스처, 효과음까지 — 게임 엔진도, 에셋 스토어도 없이 오직 프롬프트만으로.',
    intro2:
      '각 게임에는 만든 날짜가 새겨져 있습니다. AI가 발전할수록 새 게임이 이 선반에 추가되고, 이전 게임들은 그 시점의 AI가 만들 수 있었던 것의 기록으로 그대로 남습니다. 브라우저에서 무료로 즐겨보세요.',
    playNow: '▶ 지금 플레이',
    aboutTitle: '게임 소개',
    howTitle: '조작 방법',
    openFull: '전체 창으로 열기 ↗',
    releasedLabel: '제작 시점',
    techLabel: '기술',
    aiBadge: '100% AI 제작',
    backToList: '← 게임 목록',
    saveNote: '진행 상황은 브라우저에 자동 저장됩니다. 탭을 닫아도 다시 돌아오면 만들던 세계가 그대로 있습니다.',
    clickToPlay: '게임 화면을 클릭하면 시작됩니다. ESC로 마우스를 해제할 수 있습니다.',
  },
  ja: {
    kicker: 'AI インディーゲーム',
    pageTitle: 'AI インディーゲーム',
    metaDescription:
      '100% AIで作られた無料ブラウザゲーム。各ゲームは、制作時点のAIに何が作れたかを示すタイムカプセルです。',
    intro1:
      'ここにあるゲームはすべてAIが作りました。エンジンコード、物理演算、テクスチャ、効果音まで — ゲームエンジンもアセットストアも使わず、プロンプトだけで。',
    intro2:
      '各ゲームには制作日が刻まれています。AIが進化するたびに新しいゲームがこの棚に加わり、古いゲームはその時点のAIが作れたものの記録としてそのまま残ります。ブラウザで無料でお楽しみください。',
    playNow: '▶ 今すぐプレイ',
    aboutTitle: 'このゲームについて',
    howTitle: '遊び方',
    openFull: 'フルウィンドウで開く ↗',
    releasedLabel: '制作時期',
    techLabel: '技術',
    aiBadge: '100% AI制作',
    backToList: '← ゲーム一覧',
    saveNote: '進行状況はブラウザに自動保存されます。タブを閉じても、戻ればあなたの世界がそのまま残っています。',
    clickToPlay: 'ゲーム画面をクリックすると開始します。ESCでマウスを解放できます。',
  },
  es: {
    kicker: 'JUEGOS INDIE DE IA',
    pageTitle: 'Juegos indie de IA',
    metaDescription:
      'Juegos de navegador gratuitos creados 100% con IA. Cada juego es una cápsula del tiempo de lo que la IA podía crear en el momento de su creación.',
    intro1:
      'Todos los juegos de esta página fueron creados íntegramente con IA: el código del motor, las físicas, las texturas e incluso los efectos de sonido. Sin motor de juegos, sin tienda de assets. Solo prompts.',
    intro2:
      'Cada juego lleva grabada su fecha de creación. A medida que la IA evolucione, se añadirán juegos nuevos a esta estantería — y los antiguos permanecerán tal cual, como un registro jugable de lo que la IA podía construir en ese momento. Juega gratis, directamente en tu navegador.',
    playNow: '▶ Jugar ahora',
    aboutTitle: 'Sobre este juego',
    howTitle: 'Cómo jugar',
    openFull: 'Abrir en ventana completa ↗',
    releasedLabel: 'Creado en',
    techLabel: 'Tecnología',
    aiBadge: '100% hecho con IA',
    backToList: '← Todos los juegos',
    saveNote: 'Tu progreso se guarda automáticamente en tu navegador: cierra la pestaña y tu mundo seguirá aquí cuando vuelvas.',
    clickToPlay: 'Haz clic dentro del juego para empezar. Pulsa ESC para liberar el ratón.',
  },
  zh: {
    kicker: 'AI 独立游戏',
    pageTitle: 'AI 独立游戏',
    metaDescription:
      '100% 由 AI 制作的免费浏览器游戏。每款游戏都是一个时间胶囊，记录了制作当时 AI 能创造什么。',
    intro1:
      '这里的每款游戏都完全由 AI 制作——引擎代码、物理系统、贴图，甚至音效。没有游戏引擎，没有素材商店，只有提示词。',
    intro2:
      '每款游戏都标注了制作日期。随着 AI 的进化，新游戏会不断上架，而旧游戏将原样保留，成为那个时间点 AI 能力的可玩记录。在浏览器中免费畅玩。',
    playNow: '▶ 立即游玩',
    aboutTitle: '关于本游戏',
    howTitle: '操作方法',
    openFull: '全窗口打开 ↗',
    releasedLabel: '制作时间',
    techLabel: '技术',
    aiBadge: '100% AI 制作',
    backToList: '← 所有游戏',
    saveNote: '进度会自动保存在你的浏览器中——关闭标签页后再回来，你的世界依然还在。',
    clickToPlay: '点击游戏画面即可开始。按 ESC 释放鼠标。',
  },
};

/* ===== 게임별 카피 ===== */
export interface GameCopy {
  title: string;
  tagline: string;
  about: string[];
  how: string[];
}

export interface GameEntry {
  slug: string;
  released: string;          // 표기용 (ISO 연-월)
  tech: string;
  playPath: string;          // 실제 게임 정적 파일 (?lang= 붙여 사용)
  cover: string;
  copy: Record<Lang, GameCopy>;
}

export const games: GameEntry[] = [
  {
    slug: 'voxel-world',
    released: '2026-07',
    tech: 'Three.js · WebGL',
    playPath: '/games/voxel/index.html',
    cover: '/games/voxel/cover.jpg',
    copy: {
      en: {
        title: 'MENEW SOFT: Voxel World',
        tagline: 'An infinite block sandbox — mine, build, swim and fly through a world that generates itself as you walk.',
        about: [
          'Voxel World is a first-person block sandbox that runs entirely in your browser. The terrain is infinite and procedurally generated from a random seed: plains, forests, oceans, sandy shores, snow-capped mountains, and coal and iron ore hidden in the stone. Break blocks, place nine different materials, watch the sun set and the stars-dark night roll in on a four-minute day cycle.',
          'Everything in this game was created by AI in July 2026, in a single session from a single prompt: the chunk-based terrain engine, the collision physics, the day-night lighting — even the block textures, which are not image files but are drawn pixel-by-pixel in code, and the sound effects, synthesized from raw oscillators. No game engine, no downloaded assets.',
          'This page is a time capsule. AI models keep improving, and future games on this site will show that. This one stays as it is — a playable snapshot of what AI could build in mid-2026. Your world is saved automatically in your browser, so the castle you start today will still be standing tomorrow.',
        ],
        how: [
          'W A S D — move · Mouse — look around',
          'Left click — break a block · Right click — place a block',
          '1–9 or mouse wheel — choose a block · Space — jump / swim',
          'Shift — sprint · F — toggle fly mode (Space up, C down) · ESC — menu',
        ],
      },
      ko: {
        title: 'MENEW SOFT: 복셀 월드',
        tagline: '걷는 만큼 스스로 생성되는 무한 블록 세계 — 캐고, 짓고, 헤엄치고, 날아다니세요.',
        about: [
          '복셀 월드는 브라우저에서 바로 실행되는 1인칭 블록 샌드박스입니다. 지형은 랜덤 시드로 무한 생성됩니다. 평원, 숲, 바다, 모래사장, 눈 덮인 산, 그리고 돌 속에 숨은 석탄·철 광석까지. 블록을 부수고 9종의 재료를 설치하며, 4분 주기로 해가 지고 밤이 오는 세계를 누벼보세요.',
          '이 게임의 모든 것은 2026년 7월, 단 하나의 프롬프트로 AI가 한 번에 만들었습니다. 청크 기반 지형 엔진, 충돌 물리, 낮밤 조명은 물론 — 블록 텍스처조차 이미지 파일이 아니라 코드가 픽셀 단위로 그린 것이고, 효과음도 오실레이터로 합성한 것입니다. 게임 엔진도, 다운로드한 에셋도 없습니다.',
          '이 페이지는 타임캡슐입니다. AI는 계속 발전하고, 이 사이트의 다음 게임들이 그것을 보여줄 것입니다. 이 게임은 지금 모습 그대로 남아 2026년 중반의 AI가 만들 수 있었던 것의 기록이 됩니다. 세계는 브라우저에 자동 저장되니, 오늘 짓기 시작한 성은 내일도 그 자리에 있습니다.',
        ],
        how: [
          'W A S D — 이동 · 마우스 — 시점',
          '좌클릭 — 블록 부수기 · 우클릭 — 블록 설치',
          '1~9 또는 휠 — 블록 선택 · Space — 점프/수영',
          'Shift — 달리기 · F — 비행 모드 (Space 상승, C 하강) · ESC — 메뉴',
        ],
      },
      ja: {
        title: 'MENEW SOFT: ボクセルワールド',
        tagline: '歩くほどに自ら生成される無限のブロック世界 — 掘って、建てて、泳いで、空を飛ぼう。',
        about: [
          'ボクセルワールドは、ブラウザだけで動く一人称ブロックサンドボックスです。地形はランダムシードから無限に生成されます。平原、森、海、砂浜、雪山、そして石の中に眠る石炭・鉄鉱石。ブロックを壊し、9種類の素材を設置し、4分周期で日が沈み夜が訪れる世界を旅してください。',
          'このゲームのすべては、2026年7月にたった一つのプロンプトからAIが一度に作り上げました。チャンク方式の地形エンジン、衝突物理、昼夜の光 — さらにブロックのテクスチャは画像ファイルではなくコードがピクセル単位で描いたもので、効果音もオシレーターで合成しています。ゲームエンジンも、既存アセットも一切なし。',
          'このページはタイムカプセルです。AIは進化し続け、このサイトの次のゲームがそれを示すでしょう。このゲームはこのままの姿で残り、2026年半ばのAIに何が作れたかの記録になります。世界はブラウザに自動保存されるので、今日建て始めた城は明日もそこにあります。',
        ],
        how: [
          'W A S D — 移動 · マウス — 視点',
          '左クリック — ブロック破壊 · 右クリック — ブロック設置',
          '1~9 またはホイール — ブロック選択 · Space — ジャンプ/水泳',
          'Shift — ダッシュ · F — 飛行モード (Spaceで上昇、Cで下降) · ESC — メニュー',
        ],
      },
      es: {
        title: 'MENEW SOFT: Voxel World',
        tagline: 'Un sandbox de bloques infinito: excava, construye, nada y vuela por un mundo que se genera a medida que caminas.',
        about: [
          'Voxel World es un sandbox de bloques en primera persona que funciona íntegramente en tu navegador. El terreno es infinito y se genera proceduralmente a partir de una semilla aleatoria: llanuras, bosques, océanos, playas, montañas nevadas y menas de carbón y hierro escondidas en la piedra. Rompe bloques, coloca nueve materiales distintos y contempla cómo el sol se pone en un ciclo de día de cuatro minutos.',
          'Todo en este juego fue creado por IA en julio de 2026, en una sola sesión y a partir de un solo prompt: el motor de terreno por chunks, las físicas de colisión, la iluminación día-noche — incluso las texturas, que no son archivos de imagen sino que el código dibuja píxel a píxel, y los efectos de sonido, sintetizados con osciladores. Sin motor de juegos, sin assets descargados.',
          'Esta página es una cápsula del tiempo. Los modelos de IA siguen mejorando, y los próximos juegos de este sitio lo demostrarán. Este permanecerá tal cual: una instantánea jugable de lo que la IA podía construir a mediados de 2026. Tu mundo se guarda automáticamente en tu navegador, así que el castillo que empieces hoy seguirá en pie mañana.',
        ],
        how: [
          'W A S D — moverse · Ratón — mirar',
          'Clic izquierdo — romper bloque · Clic derecho — colocar bloque',
          '1–9 o rueda del ratón — elegir bloque · Espacio — saltar / nadar',
          'Shift — correr · F — modo vuelo (Espacio sube, C baja) · ESC — menú',
        ],
      },
      zh: {
        title: 'MENEW SOFT: 体素世界',
        tagline: '随你脚步无限生成的方块世界——挖掘、建造、游泳、飞行。',
        about: [
          '《体素世界》是一款完全在浏览器中运行的第一人称方块沙盒游戏。地形由随机种子无限程序化生成：平原、森林、海洋、沙滩、雪山，以及藏在石头中的煤矿和铁矿。破坏方块、放置九种不同的材料，在四分钟一轮的昼夜循环中看太阳落下、黑夜降临。',
          '这款游戏的一切都由 AI 在 2026 年 7 月、凭一条提示词一次性完成：分块地形引擎、碰撞物理、昼夜光照——甚至方块贴图都不是图片文件，而是由代码逐像素绘制；音效也是用振荡器合成的。没有游戏引擎，没有下载素材。',
          '这个页面是一个时间胶囊。AI 模型在不断进步，本站未来的游戏会证明这一点。而这款游戏将保持原样，成为 2026 年年中 AI 能力的可玩快照。你的世界会自动保存在浏览器中——今天开始建造的城堡，明天依然屹立。',
        ],
        how: [
          'W A S D — 移动 · 鼠标 — 视角',
          '左键 — 破坏方块 · 右键 — 放置方块',
          '1~9 或滚轮 — 选择方块 · 空格 — 跳跃/游泳',
          'Shift — 奔跑 · F — 飞行模式（空格上升，C 下降）· ESC — 菜单',
        ],
      },
    },
  },
];

export function gameUrl(slug: string, lang: Lang): string {
  return lang === 'en' ? `/games/${slug}/` : `/${lang}/games/${slug}/`;
}
export function gamesIndexUrl(lang: Lang): string {
  return lang === 'en' ? '/games/' : `/${lang}/games/`;
}
