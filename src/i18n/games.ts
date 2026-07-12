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
    saveTitle: 'Save data & moving to a new computer',
    save1: 'Your world is saved automatically in this browser on this device (localStorage). There is no account or server — a different browser or a different computer starts with a fresh world.',
    save2: 'To back up or move your world: open the game menu (press ESC) and click \u201c\ud83d\udcbe Export Save\u201d. A single .json file is downloaded containing everything — the world seed, every block you changed, and your quest progress. On the new computer, open the game and click \u201c\ud83d\udcc2 Import Save\u201d, then choose that file.',
    save3: 'That one .json file is all you need to migrate. Keep an export as a backup: clearing the browser\u2019s site data (cookies/cache cleanup) also deletes the save.',
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
    saveTitle: '세이브 데이터 · 컴퓨터 이전 가이드',
    save1: '세계는 지금 사용 중인 이 기기·이 브라우저 안(localStorage)에 자동 저장됩니다. 계정도 서버도 없기 때문에, 다른 브라우저나 다른 컴퓨터에서 열면 새 세계로 시작됩니다.',
    save2: '백업하거나 다른 컴퓨터로 옮기려면: 게임에서 ESC로 메뉴를 연 뒤 \u201c\ud83d\udcbe 세이브 내보내기\u201d를 누르세요. 세계 시드, 수정한 모든 블록, 도전과제 진행도가 담긴 .json 파일 하나가 다운로드됩니다. 새 컴퓨터에서 게임을 열고 \u201c\ud83d\udcc2 세이브 불러오기\u201d로 그 파일을 선택하면 끝입니다.',
    save3: '옮겨야 할 것은 그 .json 파일 하나가 전부입니다. 브라우저 사이트 데이터(쿠키·캐시) 삭제 시 세이브도 함께 지워지니, 내보내기 파일을 백업으로 보관해 두세요.',
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
    saveTitle: 'セーブデータ · パソコン移行ガイド',
    save1: '世界は現在お使いの端末・ブラウザの中(localStorage)に自動保存されます。アカウントもサーバーもないため、別のブラウザや別のパソコンで開くと新しい世界から始まります。',
    save2: 'バックアップや別のパソコンへの移行は: ゲーム内でESCを押してメニューを開き、\u201c\ud83d\udcbe セーブを書き出す\u201dをクリックしてください。ワールドのシード、変更したすべてのブロック、実績の進行を含む.jsonファイルが1つダウンロードされます。新しいパソコンでゲームを開き、\u201c\ud83d\udcc2 セーブを読み込む\u201dでそのファイルを選べば完了です。',
    save3: '移行に必要なのはその.jsonファイル1つだけです。ブラウザのサイトデータ(Cookie・キャッシュ)を消去するとセーブも消えるため、書き出したファイルをバックアップとして保管してください。',
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
    saveTitle: 'Datos de guardado y cambio de ordenador',
    save1: 'Tu mundo se guarda automáticamente en este navegador y en este dispositivo (localStorage). No hay cuenta ni servidor: otro navegador u otro ordenador empieza con un mundo nuevo.',
    save2: 'Para hacer una copia o mudarte de ordenador: abre el menú del juego (ESC) y pulsa \u201c\ud83d\udcbe Exportar partida\u201d. Se descarga un único archivo .json con todo: la semilla del mundo, cada bloque que cambiaste y tu progreso de logros. En el ordenador nuevo, abre el juego, pulsa \u201c\ud83d\udcc2 Importar partida\u201d y elige ese archivo.',
    save3: 'Ese único archivo .json es todo lo que necesitas para migrar. Guarda una exportación como copia de seguridad: borrar los datos de sitios del navegador (cookies/caché) también elimina la partida.',
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
    saveTitle: '存档数据 · 更换电脑指南',
    save1: '你的世界自动保存在当前设备的当前浏览器中(localStorage)。没有账号也没有服务器——换一个浏览器或换一台电脑，都会从新世界开始。',
    save2: '备份或迁移到新电脑: 在游戏中按ESC打开菜单，点击\u201c\ud83d\udcbe 导出存档\u201d，会下载一个.json文件，包含全部内容——世界种子、你改动过的每个方块、成就进度。在新电脑上打开游戏，点击\u201c\ud83d\udcc2 导入存档\u201d并选择该文件即可。',
    save3: '迁移只需要这一个.json文件。请把导出的文件留作备份: 清除浏览器站点数据(Cookie/缓存)也会删除存档。',
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
        title: 'MENEW CRAFT',
        tagline: 'An infinite voxel survival sandbox — build by day, survive the night, and face the boss MENEW.',
        about: [
          'MENEW CRAFT is a first-person block survival game that runs entirely in your browser. The terrain is infinite and procedurally generated from a random seed: plains, forests, oceans, sandy shores, snow-capped mountains, and coal and iron ore hidden in the stone. Break blocks, place nine different materials, and watch the sun set on a four-minute day cycle — because when night falls, you are no longer alone.',
          'Seven monsters roam the dark: NODUCK pelts you from range, SEOJB rushes in swinging, KS is terrifyingly fast, JW is a walking wall, DS sneaks up and explodes, IW bounces at you, and KJ teleports behind your back. Every third night the boss MENEW appears with his own health bar. You have ten hearts, natural regeneration, fall damage, a respawn point — and eight quests to complete, from chopping your first log to defeating MENEW himself. Fight back with your fists, a sword, or a bow with real arrows — and every quest you complete earns you a title.',
          'Everything in this game was created by AI in July 2026 from a single prompt: the chunk-based terrain engine, the collision physics, the monster AI, the day-night lighting — even the block textures, drawn pixel-by-pixel in code, and the sound effects, synthesized from raw oscillators. No game engine, no downloaded assets.',
          'This page is a time capsule. AI models keep improving, and future games on this site will show that. This one stays as it is — a playable snapshot of what AI could build in mid-2026. Your world, your quest progress and your builds are saved automatically in your browser.',
        ],
        how: [
          'W A S D — move · Mouse — look around · Space — jump / swim',
          'Left click — attack monsters / break blocks · Right click — place a block',
          'E — switch weapon: hand / sword / bow · 1–9 or wheel — choose a block · Q — quest log',
          'Shift — sprint · F — fly mode (Space up, C down) · ESC — menu',
        ],
      },
      ko: {
        title: 'MENEW CRAFT',
        tagline: '무한 복셀 서바이벌 샌드박스 — 낮에는 짓고, 밤에는 살아남고, 보스 MENEW와 맞서세요.',
        about: [
          'MENEW CRAFT는 브라우저에서 바로 실행되는 1인칭 블록 서바이벌 게임입니다. 지형은 랜덤 시드로 무한 생성됩니다. 평원, 숲, 바다, 모래사장, 눈 덮인 산, 그리고 돌 속에 숨은 석탄·철 광석까지. 블록을 부수고 9종의 재료를 설치하세요. 하루는 4분 — 해가 지고 나면, 이 세계에 당신 혼자가 아닙니다.',
          '어둠 속에는 7종의 몬스터가 돌아다닙니다. 원거리에서 쏘아대는 NODUCK, 달려들어 후려치는 SEOJB, 무섭게 빠른 KS, 걸어다니는 벽 JW, 몰래 다가와 폭발하는 DS, 튀어오르는 IW, 등 뒤로 순간이동하는 KJ까지. 그리고 사흘 밤마다 전용 체력바를 단 보스 MENEW가 나타납니다. 하트 10개, 자연 회복, 낙하 데미지, 리스폰, 그리고 첫 나무 캐기부터 MENEW 처치까지 도전과제 8종이 준비되어 있습니다. 맨손·검·활(진짜 화살 발사)로 맞서 싸우고, 도전과제를 달성할 때마다 칭호를 얻습니다.',
          '이 게임의 모든 것은 2026년 7월, 단 하나의 프롬프트로 AI가 한 번에 만들었습니다. 청크 기반 지형 엔진, 충돌 물리, 몬스터 AI, 낮밤 조명은 물론 — 블록 텍스처조차 이미지 파일이 아니라 코드가 픽셀 단위로 그린 것이고, 효과음도 오실레이터로 합성한 것입니다. 게임 엔진도, 다운로드한 에셋도 없습니다.',
          '이 페이지는 타임캡슐입니다. AI는 계속 발전하고, 이 사이트의 다음 게임들이 그것을 보여줄 것입니다. 이 게임은 지금 모습 그대로 남아 2026년 중반의 AI가 만들 수 있었던 것의 기록이 됩니다. 세계·건축물·도전과제 진행도는 모두 브라우저에 자동 저장됩니다.',
        ],
        how: [
          'W A S D — 이동 · 마우스 — 시점 · Space — 점프/수영',
          '좌클릭 — 몬스터 공격/블록 부수기 · 우클릭 — 블록 설치',
          'E — 무기 전환: 손/검/활 · 1~9 또는 휠 — 블록 선택 · Q — 도전과제 목록',
          'Shift — 달리기 · F — 비행 모드 (Space 상승, C 하강) · ESC — 메뉴',
        ],
      },
      ja: {
        title: 'MENEW CRAFT',
        tagline: '無限のボクセル・サバイバルサンドボックス — 昼は建てて、夜は生き延びて、ボスMENEWに挑め。',
        about: [
          'MENEW CRAFTは、ブラウザだけで動く一人称ブロック・サバイバルゲームです。地形はランダムシードから無限に生成されます。平原、森、海、砂浜、雪山、そして石の中に眠る石炭・鉄鉱石。ブロックを壊し、9種類の素材を設置してください。一日は4分 — 日が沈めば、この世界にいるのはあなただけではありません。',
          '闇には7種類のモンスターが徘徊します。遠くから撃ってくるNODUCK、殴りかかるSEOJB、恐ろしく速いKS、歩く壁のJW、忍び寄って爆発するDS、跳ねまわるIW、背後にテレポートするKJ。そして三日目の夜ごとに、専用HPバーを持つボスMENEWが現れます。ハート10個、自然回復、落下ダメージ、リスポーン、そして最初の原木からMENEW討伐まで8つの実績が待っています。素手・剣・弓(本物の矢を発射)で戦い、実績を達成するたびに称号を獲得できます。',
          'このゲームのすべては、2026年7月にたった一つのプロンプトからAIが一度に作り上げました。チャンク方式の地形エンジン、衝突物理、モンスターAI、昼夜の光 — さらにブロックのテクスチャは画像ファイルではなくコードがピクセル単位で描いたもので、効果音もオシレーターで合成しています。ゲームエンジンも、既存アセットも一切なし。',
          'このページはタイムカプセルです。AIは進化し続け、このサイトの次のゲームがそれを示すでしょう。このゲームはこのままの姿で残り、2026年半ばのAIに何が作れたかの記録になります。世界・建築・実績の進行はすべてブラウザに自動保存されます。',
        ],
        how: [
          'W A S D — 移動 · マウス — 視点 · Space — ジャンプ/水泳',
          '左クリック — モンスター攻撃/ブロック破壊 · 右クリック — ブロック設置',
          'E — 武器切替: 素手/剣/弓 · 1~9 またはホイール — ブロック選択 · Q — 実績リスト',
          'Shift — ダッシュ · F — 飛行モード (Spaceで上昇、Cで下降) · ESC — メニュー',
        ],
      },
      es: {
        title: 'MENEW CRAFT',
        tagline: 'Un sandbox de supervivencia voxel infinito: construye de día, sobrevive a la noche y enfréntate al jefe MENEW.',
        about: [
          'MENEW CRAFT es un juego de supervivencia de bloques en primera persona que funciona íntegramente en tu navegador. El terreno es infinito y se genera proceduralmente a partir de una semilla aleatoria: llanuras, bosques, océanos, playas, montañas nevadas y menas de carbón y hierro escondidas en la piedra. Rompe bloques y coloca nueve materiales distintos. El día dura cuatro minutos — y cuando cae la noche, ya no estás solo.',
          'Siete monstruos merodean en la oscuridad: NODUCK te dispara desde lejos, SEOJB carga contra ti, KS es aterradoramente rápido, JW es un muro andante, DS se acerca sigiloso y explota, IW rebota hacia ti y KJ se teletransporta a tu espalda. Cada tercera noche aparece el jefe MENEW con su propia barra de vida. Tienes diez corazones, regeneración natural, daño por caída, punto de reaparición — y ocho logros que completar, desde talar tu primer tronco hasta derrotar al propio MENEW. Lucha con los puños, una espada o un arco con flechas de verdad — y cada logro completado te otorga un título.',
          'Todo en este juego fue creado por IA en julio de 2026 a partir de un solo prompt: el motor de terreno por chunks, las físicas de colisión, la IA de los monstruos, la iluminación día-noche — incluso las texturas, dibujadas píxel a píxel por código, y los efectos de sonido, sintetizados con osciladores. Sin motor de juegos, sin assets descargados.',
          'Esta página es una cápsula del tiempo. Los modelos de IA siguen mejorando, y los próximos juegos de este sitio lo demostrarán. Este permanecerá tal cual: una instantánea jugable de lo que la IA podía construir a mediados de 2026. Tu mundo, tus logros y tus construcciones se guardan automáticamente en tu navegador.',
        ],
        how: [
          'W A S D — moverse · Ratón — mirar · Espacio — saltar / nadar',
          'Clic izquierdo — atacar monstruos / romper bloques · Clic derecho — colocar bloque',
          'E — cambiar arma: mano / espada / arco · 1–9 o rueda — elegir bloque · Q — registro de logros',
          'Shift — correr · F — modo vuelo (Espacio sube, C baja) · ESC — menú',
        ],
      },
      zh: {
        title: 'MENEW CRAFT',
        tagline: '无限体素生存沙盒——白天建造，夜晚求生，直面 Boss MENEW。',
        about: [
          'MENEW CRAFT 是一款完全在浏览器中运行的第一人称方块生存游戏。地形由随机种子无限程序化生成：平原、森林、海洋、沙滩、雪山，以及藏在石头中的煤矿和铁矿。破坏方块、放置九种不同的材料。一天只有四分钟——太阳落山后，这个世界就不止你一个了。',
          '黑暗中游荡着七种怪物：远程狙击的 NODUCK、挥拳冲锋的 SEOJB、快得吓人的 KS、行走的高墙 JW、悄悄靠近然后爆炸的 DS、蹦跳扑来的 IW，还有瞬移到你背后的 KJ。每到第三个夜晚，带专属血条的 Boss MENEW 就会现身。你有十颗心、自然回血、坠落伤害、重生点——还有八个成就等你完成：从砍下第一块原木，到击败 MENEW 本人。你可以徒手、用剑或用弓(发射真实的箭)战斗——每完成一个成就还会获得称号。',
          '这款游戏的一切都由 AI 在 2026 年 7 月、凭一条提示词一次性完成：分块地形引擎、碰撞物理、怪物 AI、昼夜光照——甚至方块贴图都不是图片文件，而是由代码逐像素绘制；音效也是用振荡器合成的。没有游戏引擎，没有下载素材。',
          '这个页面是一个时间胶囊。AI 模型在不断进步，本站未来的游戏会证明这一点。而这款游戏将保持原样，成为 2026 年年中 AI 能力的可玩快照。你的世界、建筑和成就进度都会自动保存在浏览器中。',
        ],
        how: [
          'W A S D — 移动 · 鼠标 — 视角 · 空格 — 跳跃/游泳',
          '左键 — 攻击怪物/破坏方块 · 右键 — 放置方块',
          'E — 切换武器: 徒手/剑/弓 · 1~9 或滚轮 — 选择方块 · Q — 成就列表',
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
