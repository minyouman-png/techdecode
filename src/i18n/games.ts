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
    slug: 'super-uja',
    released: '2026-07',
    tech: 'Canvas 2D · Web Audio',
    playPath: '/games/uja/index.html',
    cover: '/games/uja/cover.jpg',
    copy: {
      en: {
        title: 'SUPER UJA',
        tagline: 'A cute side-scrolling platformer set in old Korea — 5 stages of Joseon, Korean folk spirits, a rideable unicorn, and King Yeomra as the final boss.',
        about: [
          'SUPER UJA is a side-scrolling platformer in the spirit of the great mascot classics, reimagined entirely with Korean flavor. You play as Uja, a cheerful girl in hanbok, running and jumping across five hand-built stages of the Joseon dynasty: a thatched-roof village, a pine forest at sunset, moonlit palace rooftops, the road to the underworld, and the palace of King Yeomra himself. Every character, tile and background is drawn with vector code — no downloaded art.',
          'Instead of the usual enemies, the world is haunted by Korean folk spirits: the maiden ghost (cheonyeo-gwisin) drifts toward you, the black-robed grim reaper leaves behind a sliding gat hat when stomped, mischievous dokkaebi goblins hop about, faceless egg-ghosts bob in the air, and the nine-tailed gumiho fox dashes at you. Stomp them the classic way — and ride Uni, a pastel unicorn who takes the place of the famous dinosaur mount, complete with a sparkly mid-air double jump.',
          'Collect yeopjeon coins (100 for an extra life), smash lucky-pouch blocks for yuja fruit power-ups, and grab a dokkaebi flame for brief invincibility. Reach the flag at each stage, and at the very end, face King Yeomra, lord of the underworld, in a five-hit boss battle. Your score and the stage you reached are saved under your nickname in a local top-10 leaderboard — and your progress auto-saves so you can continue from the last stage you were on.',
          'Like everything on this shelf, this game was built entirely by AI in July 2026 from a single prompt — the physics, the level design, the folk-spirit artwork, the gugak-flavored soundtrack. A playable snapshot of what AI could build at that moment.',
        ],
        how: [
          '← → — move · Space / ↑ — jump (hold for a higher jump) · Shift — run',
          'Stomp on spirits to defeat them · reapers drop a sliding gat hat',
          'Ride the unicorn Uni for a sparkly double jump',
          '100 yeopjeon coins = 1 extra life · lucky-pouch blocks hide yuja fruit · ESC pauses',
          '📱 Mobile — on-screen buttons: move, jump and run',
        ],
      },
      ko: {
        title: '슈퍼유자',
        tagline: '조선시대 배경의 아기자기한 횡스크롤 플랫포머 — 조선 5스테이지, 한국 요괴, 탈 수 있는 유니콘, 최종보스 염라대왕까지.',
        about: [
          '슈퍼유자는 명작 마스코트 플랫포머의 감성을 온전히 한국풍으로 재해석한 횡스크롤 액션 게임입니다. 한복을 입은 명랑한 소녀 유자가 되어, 손으로 설계한 조선시대 다섯 스테이지를 달리고 뛰어넘습니다. 초가마을, 석양의 소나무 숲, 달빛 궁궐 지붕, 저승길, 그리고 염라대왕의 궁궐까지. 캐릭터·타일·배경 전부 이미지 파일 없이 벡터 코드로 그렸습니다.',
          '흔한 적 대신 이 세계엔 한국 요괴들이 출몰합니다. 스르륵 다가오는 처녀귀신, 밟으면 미끄러지는 갓을 남기는 검은 도포의 저승사자, 폴짝대는 도깨비, 허공에 둥실대는 얼굴 없는 달걀귀신, 그리고 쏜살같이 달려드는 아홉 꼬리 구미호까지. 고전 방식 그대로 밟아서 물리치세요. 그리고 그 유명한 공룡 탈것 자리를 대신하는 파스텔빛 유니콘 유니를 타면, 반짝이는 공중 2단 점프까지 쓸 수 있습니다.',
          '엽전을 모으고(100개면 생명 +1), 복주머니 블록을 쳐서 유자열매 파워업을 얻고, 도깨비불을 먹으면 잠깐 무적이 됩니다. 각 스테이지 끝의 깃발에 도달하고, 마지막엔 저승의 지배자 염라대왕과 5번 밟기 보스전을 치릅니다. 점수와 도달 스테이지는 닉네임과 함께 로컬 Top10 랭킹에 저장되고, 진행 상황이 자동 저장되어 마지막 스테이지부터 이어할 수 있습니다.',
          '이 선반의 다른 게임처럼, 이 게임도 2026년 7월 단 하나의 프롬프트로 AI가 전부 만들었습니다 — 물리, 레벨 디자인, 요괴 그래픽, 국악풍 사운드까지. 그 시점의 AI가 만들 수 있었던 것의 플레이 가능한 기록입니다.',
        ],
        how: [
          '← → — 이동 · Space / ↑ — 점프(길게 누르면 더 높이) · Shift — 달리기',
          '요괴는 밟아서 물리치세요 · 저승사자는 미끄러지는 갓을 남깁니다',
          '유니콘 유니를 타면 반짝이는 2단 점프!',
          '엽전 100개 = 생명 +1 · 복주머니 블록엔 유자열매가 · ESC로 일시정지',
          '📱 모바일 — 화면 버튼: 이동·점프·달리기',
        ],
      },
      ja: {
        title: 'スーパーユジャ',
        tagline: '朝鮮時代が舞台のかわいい横スクロールアクション — 朝鮮の5ステージ、韓国の妖怪、乗れるユニコーン、そしてラスボスは閻魔大王。',
        about: [
          'スーパーユジャは、名作マスコット・プラットフォーマーの魂を丸ごと韓国風に再解釈した横スクロールアクションです。韓服(ハンボク)を着た明るい少女ユジャとなり、手作りの朝鮮王朝5ステージを走り、跳びます。わらぶきの村、夕暮れの松林、月明かりの宮殿の屋根、冥途の道、そして閻魔大王の宮殿へ。キャラも地形も背景も、画像ファイルを使わずすべてベクターコードで描いています。',
          'ありふれた敵の代わりに、この世界には韓国の妖怪が出没します。すっと近づく処女鬼神、踏むと滑る笠(カッ)を残す黒い道袍の死者の使い、跳ね回るトッケビ、宙をふわふわ漂う顔のない卵鬼神、そして猛然と突進する九尾狐(クミホ)。古典どおり踏んで倒しましょう。そしてあの有名な恐竜の乗り物の座を受け継ぐパステルカラーのユニコーン「ユニ」に乗れば、キラキラの空中二段ジャンプも使えます。',
          '葉銭(ヨプチョン)を集め(100枚で残機+1)、福袋ブロックを叩いて柚子(ユジャ)の実パワーアップを得て、トッケビ火を取れば短時間無敵に。各ステージの旗に到達し、最後は冥界の主・閻魔大王との5回踏みボス戦へ。スコアと到達ステージはニックネームと共にローカルTop10ランキングに保存され、進行は自動セーブされるので最後のステージから再開できます。',
          'この棚の他のゲームと同じく、このゲームも2026年7月にたった一つのプロンプトからAIがすべて作りました — 物理、レベルデザイン、妖怪のアート、国楽風サウンドまで。その時点のAIに何が作れたかの、遊べる記録です。',
        ],
        how: [
          '← → — 移動 · Space / ↑ — ジャンプ(長押しで高く) · Shift — ダッシュ',
          '妖怪は踏んで倒そう · 死者の使いは滑る笠を残す',
          'ユニコーン「ユニ」に乗るとキラキラ二段ジャンプ！',
          '葉銭100枚 = 残機+1 · 福袋ブロックに柚子の実 · ESCで一時停止',
          '📱 モバイル — 画面ボタン: 移動・ジャンプ・ダッシュ',
        ],
      },
      es: {
        title: 'SUPER UJA',
        tagline: 'Un adorable plataformas de scroll lateral en la antigua Corea — 5 fases de Joseon, espíritus del folclore coreano, una unicornio montable y el Rey Yeomra como jefe final.',
        about: [
          'SUPER UJA es un juego de plataformas de scroll lateral con el espíritu de los grandes clásicos de mascota, reimaginado por completo con sabor coreano. Juegas como Uja, una alegre niña en hanbok, corriendo y saltando por cinco fases hechas a mano de la dinastía Joseon: una aldea de tejados de paja, un bosque de pinos al atardecer, tejados de palacio a la luz de la luna, el camino al inframundo y el mismísimo palacio del Rey Yeomra. Cada personaje, casilla y fondo está dibujado con código vectorial, sin arte descargado.',
          'En lugar de los enemigos habituales, el mundo está habitado por espíritus del folclore coreano: el fantasma doncella se desliza hacia ti, el segador de túnica negra deja caer un sombrero gat que se desliza al pisarlo, los traviesos duendes dokkaebi dan saltos, los fantasmas-huevo sin rostro flotan en el aire y la zorra de nueve colas gumiho se lanza contra ti. Písalos a la manera clásica, y monta a Uni, una unicornio pastel que ocupa el lugar del famoso dinosaurio, con un brillante doble salto en el aire.',
          'Reúne monedas yeopjeon (100 para una vida extra), rompe los bloques de bolsa de la suerte para conseguir mejoras de fruta yuja y coge una llama dokkaebi para una breve invencibilidad. Llega a la bandera de cada fase y, al final, enfréntate al Rey Yeomra, señor del inframundo, en una batalla de cinco pisotones. Tu puntuación y la fase alcanzada se guardan con tu apodo en un ranking local top-10, y tu progreso se guarda solo para que continúes desde la última fase.',
          'Como todo en esta estantería, este juego fue creado íntegramente por IA en julio de 2026 a partir de un solo prompt: la física, el diseño de niveles, el arte de los espíritus, la banda sonora al estilo gugak. Una instantánea jugable de lo que la IA podía construir en ese momento.',
        ],
        how: [
          '← → — moverse · Espacio / ↑ — saltar (mantén para saltar más alto) · Shift — correr',
          'Pisa a los espíritus para vencerlos · los segadores sueltan un sombrero gat deslizante',
          '¡Monta a la unicornio Uni para un doble salto brillante!',
          '100 monedas yeopjeon = 1 vida extra · los bloques de bolsa esconden fruta yuja · ESC pausa',
          '📱 Móvil — botones en pantalla: moverse, saltar y correr',
        ],
      },
      zh: {
        title: '超级柚子',
        tagline: '以古朝鲜为背景的可爱横版闯关游戏——朝鲜5大关卡、韩国妖怪、可骑乘的独角兽，以及最终boss阎罗大王。',
        about: [
          '《超级柚子》是一款横版闯关动作游戏，将经典吉祥物平台游戏的精髓完全以韩国风格重新演绎。你将扮演身穿韩服的开朗少女柚子，奔跑跳跃穿越五个纯手工设计的朝鲜王朝关卡：草屋村、夕阳下的松树林、月光下的宫殿屋顶、黄泉路，以及阎罗大王的宫殿。所有角色、地块和背景都用矢量代码绘制，没有任何下载素材。',
          '这个世界里出没的不是寻常敌人，而是韩国民间妖怪：处女鬼神朝你飘来，黑袍阴差被踩后会留下一顶滑动的官帽(笠)，调皮的独脚鬼(独脚鬼)蹦蹦跳跳，没有脸的鸡蛋鬼在空中浮沉，九尾狐(九尾狐)则向你猛冲。用经典方式踩踏它们吧——还能骑上柔和粉彩色的独角兽Uni，它接替了那只著名恐龙坐骑的位置，还带有闪亮的空中二段跳。',
          '收集叶钱(集满100枚加一条命)、敲碎福袋方块获得柚子果实强化、吃到独脚鬼火可短暂无敌。抵达每关终点的旗帜，最后与黄泉之主阎罗大王展开五次踩踏的boss战。你的分数和到达的关卡会以昵称保存在本地Top10排行榜中，进度还会自动保存，可从上次的关卡继续。',
          '和这个书架上的其他游戏一样，这款游戏也是AI在2026年7月凭一条提示词完成的——物理、关卡设计、妖怪美术、国乐风音乐，全部如此。它是那个时间点AI能力的可玩快照。',
        ],
        how: [
          '← → — 移动 · 空格 / ↑ — 跳跃(长按跳更高) · Shift — 奔跑',
          '踩踏妖怪即可打倒它们 · 阴差会留下滑动的官帽',
          '骑上独角兽Uni，来一记闪亮的二段跳！',
          '100枚叶钱 = 加1条命 · 福袋方块藏着柚子果实 · ESC暂停',
          '📱 移动端 — 屏幕按钮：移动、跳跃、奔跑',
        ],
      },
    },
  },
  {
    slug: 'menew-empires',
    released: '2026-07',
    tech: 'Canvas 2D · Voronoi · Web Audio',
    playPath: '/games/empires/index.html',
    cover: '/games/empires/cover.jpg',
    copy: {
      en: {
        title: 'MENEW EMPIRES',
        tagline: 'A grand-strategy world history simulation — 230 real nations, 1,200+ provinces, and every stat you can meddle with.',
        about: [
          'MENEW EMPIRES is a turn-based grand strategy game in the spirit of the classic world-map history simulators. The map is the real Earth — built from actual Natural Earth cartography — carved into more than 1,200 provinces across 230 playable nations, from superpowers to microstates. Pick any country and rule it: every province tracks its own population, food production, fertility, agriculture level, technology level, education level, culture, unrest and garrison, and they all feed back into each other. Provinces are even named after their real major cities — Seoul, Busan, Berlin, Istanbul.',
          'Each turn covers three months. Collect taxes, invest gold to level up agriculture, technology and education province by province, recruit armies from your population, and march them across land borders — or launch naval invasions along the coast. Declare wars and negotiate peace in the diplomacy panel while 200+ AI nations run their own economies, pick their own fights and sue for peace when they are losing. Random events — plagues, bumper harvests, technological breakthroughs, riots — keep history moving. Procedurally shaded terrain with climate biomes, relief shading and zoomable borders makes the world feel like a real atlas.',
          'Your campaign is auto-saved every turn, so you can close the tab and continue later. When your nation falls — or you retire — your score is recorded under your nickname in a local top-10 leaderboard, with the same export/import save system as our other games.',
          'Like everything on this shelf, this game was built entirely by AI in July 2026 from a single prompt — the map engine, the province generator, the simulation, the AI, the sounds. A playable snapshot of what AI could build at that moment.',
        ],
        how: [
          '🖱 Drag — pan the map · wheel / pinch — zoom · click a province — inspect & manage',
          '💰 Invest buttons — raise agriculture / technology / education · ⚔ Recruit — raise an army from the population',
          'Click your army, then a highlighted neighbor — move (green) or attack (red) · coastal provinces can invade across the sea · use the deploy slider to send only part of a stack',
          '🕊 Diplomacy — declare wars, offer and accept peace · watch relations',
          'End Turn (or Enter) — advance 3 months · reach 60% of the world for hegemony · records saved under your nickname',
        ],
      },
      ko: {
        title: 'MENEW EMPIRES',
        tagline: '대전략 세계 역사 시뮬레이션 — 실제 국가 230개, 프로빈스 1,200개+, 지역별 국력 스탯을 직접 주무르세요.',
        about: [
          'MENEW EMPIRES는 에이지 오브 히스토리류 세계지도 역사 시뮬레이션의 감성을 담은 턴제 대전략 게임입니다. 지도는 실제 지구 — Natural Earth 실측 지도 데이터로 만들어 230개 국가를 1,200개가 넘는 프로빈스로 분할했습니다. 초강대국부터 도시국가까지 아무 나라나 골라 통치하세요. 모든 프로빈스가 자기만의 인구·식량 생산·비옥도·농업 레벨·기술 레벨·교육(주민 지식) 레벨·문화권·불안도·주둔군을 갖고 서로 맞물려 돌아갑니다. 프로빈스에는 서울·부산·베를린·이스탄불처럼 실제 주요 도시의 이름이 붙습니다.',
          '한 턴은 3개월. 세금을 걷고, 금을 투자해 프로빈스별로 농업·기술·교육을 올리고, 인구에서 군대를 모병해 국경 너머로 진군시키세요. 해안 프로빈스는 바다 건너 상륙 작전도 가능합니다. 외교 패널에서 선전포고와 평화 협상을 하는 동안 200개가 넘는 AI 국가가 각자 경제를 굴리고, 전쟁을 일으키고, 불리하면 평화를 구걸합니다. 전염병·대풍년·기술 혁신·폭동 같은 랜덤 이벤트가 역사를 계속 움직입니다. 기후 바이옴과 음영 기복이 들어간 절차 생성 지형 위에 확대/축소되는 국경선까지 — 실제 지도책을 보는 느낌을 냈습니다.',
          '캠페인은 매 턴 자동 저장되어 탭을 닫아도 이어할 수 있습니다. 국가가 멸망하거나 스스로 물러나면 점수가 닉네임과 함께 로컬 Top10 랭킹에 기록되고, 다른 게임과 동일한 세이브 내보내기/불러오기를 지원합니다.',
          '이 선반의 다른 게임처럼, 이 게임도 2026년 7월 단 하나의 프롬프트로 AI가 전부 만들었습니다 — 지도 엔진, 프로빈스 생성기, 시뮬레이션, AI, 사운드까지. 그 시점의 AI가 만들 수 있었던 것의 플레이 가능한 기록입니다.',
        ],
        how: [
          '🖱 드래그 — 지도 이동 · 휠/핀치 — 확대 · 프로빈스 클릭 — 정보·관리',
          '💰 투자 버튼 — 농업/기술/교육 레벨업 · ⚔ 모병 — 인구에서 군대 양성',
          '내 군대 클릭 후 강조된 인접 지역 클릭 — 이동(초록)/공격(빨강) · 해안 지역은 바다 건너 침공 가능 · 파병 규모 슬라이더로 병력 일부만 파견',
          '🕊 외교 — 선전포고·평화 제안·수락 · 관계 수치 관리',
          '턴 종료(또는 Enter) — 3개월 진행 · 세계 60% 점령 시 패권 달성 · 기록은 닉네임으로 저장',
        ],
      },
      ja: {
        title: 'MENEW EMPIRES',
        tagline: 'グランドストラテジー世界歴史シミュレーション — 実在230カ国・1,200超の州、あらゆる国力ステータスを自分の手で。',
        about: [
          'MENEW EMPIRESは、世界地図系歴史シミュレーションの魂を受け継ぐターン制グランドストラテジーです。地図は本物の地球 — Natural Earthの実測地図データから、230カ国を1,200以上の州に分割しました。超大国から都市国家まで、どの国を選んで統治してもかまいません。すべての州が固有の人口・食料生産・肥沃度・農業レベル・技術レベル・教育(住民知識)レベル・文化圏・不安度・駐留軍を持ち、互いに影響し合います。州にはソウル・釜山・ベルリン・イスタンブールなど実在の主要都市の名前が付きます。',
          '1ターンは3ヶ月。税を集め、金を投資して州ごとに農業・技術・教育を上げ、人口から軍を徴兵して国境の向こうへ進軍させましょう。沿岸の州なら海を越えた上陸作戦も可能です。外交パネルで宣戦布告や和平交渉をする間にも、200以上のAI国家がそれぞれ経済を回し、戦争を起こし、不利になれば和平を求めてきます。疫病・大豊作・技術革新・暴動などのランダムイベントが歴史を動かし続けます。気候バイオームと陰影起伏の手続き生成地形、ズームできる国境線 — 本物の地図帳のような世界です。',
          'キャンペーンは毎ターン自動保存され、タブを閉じても続きから遊べます。国家が滅亡するか引退すると、スコアがニックネームと共にローカルTop10ランキングに記録され、他のゲームと同じセーブ書き出し/読み込みに対応しています。',
          'この棚の他のゲームと同じく、このゲームも2026年7月にたった一つのプロンプトからAIがすべて作りました — 地図エンジン、州生成、シミュレーション、AI、サウンドまで。その時点のAIに何が作れたかの、遊べる記録です。',
        ],
        how: [
          '🖱 ドラッグ — 地図移動 · ホイール/ピンチ — ズーム · 州クリック — 情報・管理',
          '💰 投資ボタン — 農業/技術/教育をレベルアップ · ⚔ 徴兵 — 人口から軍を編成',
          '自軍をクリック→ハイライトされた隣接州をクリック — 移動(緑)/攻撃(赤) · 沿岸州は海越え侵攻も可能 · 派兵規模スライダーで一部だけ派遣可能',
          '🕊 外交 — 宣戦布告・和平提案・受諾 · 関係値の管理',
          'ターン終了(またはEnter) — 3ヶ月進行 · 世界の60%を支配して覇権達成 · 記録はニックネームで保存',
        ],
      },
      es: {
        title: 'MENEW EMPIRES',
        tagline: 'Una simulación de gran estrategia histórica: 230 naciones reales, más de 1.200 provincias y cada estadística bajo tu control.',
        about: [
          'MENEW EMPIRES es un juego de gran estrategia por turnos con el espíritu de los clásicos simuladores históricos de mapa mundial. El mapa es la Tierra real — construido con cartografía de Natural Earth — dividido en más de 1.200 provincias repartidas entre 230 naciones jugables, de superpotencias a microestados. Elige cualquier país y gobiérnalo: cada provincia lleva su propia población, producción de alimentos, fertilidad, nivel agrícola, nivel tecnológico, nivel educativo, cultura, descontento y guarnición, y todo se retroalimenta. Las provincias llevan además nombres de ciudades reales: Seúl, Busan, Berlín, Estambul.',
          'Cada turno son tres meses. Recauda impuestos, invierte oro para subir agricultura, tecnología y educación provincia a provincia, recluta ejércitos de tu población y hazlos marchar por las fronteras — o lanza invasiones navales por la costa. Declara guerras y negocia la paz en el panel de diplomacia mientras más de 200 naciones IA gestionan sus economías, eligen sus batallas y piden la paz cuando pierden. Eventos aleatorios — pestes, cosechas récord, avances tecnológicos, disturbios — mantienen la historia en marcha. Un terreno procedural con biomas climáticos, sombreado de relieve y fronteras con zoom hace que el mundo parezca un atlas de verdad.',
          'Tu campaña se guarda automáticamente cada turno: cierra la pestaña y continúa después. Cuando tu nación caiga — o te retires — tu puntuación queda registrada con tu apodo en un ranking local top-10, con el mismo sistema de exportar/importar partida que nuestros otros juegos.',
          'Como todo en esta estantería, este juego fue creado íntegramente por IA en julio de 2026 a partir de un solo prompt: el motor del mapa, el generador de provincias, la simulación, la IA y los sonidos. Una instantánea jugable de lo que la IA podía construir en ese momento.',
        ],
        how: [
          '🖱 Arrastra — mueve el mapa · rueda / pellizco — zoom · clic en una provincia — inspeccionar y gestionar',
          '💰 Botones de inversión — sube agricultura / tecnología / educación · ⚔ Reclutar — levanta un ejército de la población',
          'Clic en tu ejército y luego en un vecino resaltado — mover (verde) o atacar (rojo) · las provincias costeras pueden invadir por mar · con el control de tropas puedes enviar solo una parte',
          '🕊 Diplomacia — declara guerras, ofrece y acepta la paz · vigila las relaciones',
          'Fin de turno (o Enter) — avanza 3 meses · domina el 60% del mundo para la hegemonía · récords con tu apodo',
        ],
      },
      zh: {
        title: 'MENEW EMPIRES',
        tagline: '大战略世界历史模拟——230个真实国家、1200多个省份，每一项国力数据都由你掌控。',
        about: [
          'MENEW EMPIRES 是一款致敬世界地图历史模拟经典的回合制大战略游戏。地图就是真实的地球——基于 Natural Earth 实测地图数据，把 230 个国家划分成 1200 多个省份，从超级大国到微型国家都可以选择统治。每个省份都有自己的人口、粮食产量、肥沃度、农业等级、科技等级、教育（居民知识）等级、文化圈、动荡度和驻军，它们相互影响、环环相扣。省份还以真实大城市命名——首尔、釜山、柏林、伊斯坦布尔。',
          '一回合三个月。征收税金，投资金币逐省提升农业、科技和教育，从人口中征募军队，越过陆地边境行军——沿海省份还能发动跨海登陆作战。在外交面板宣战、谈和的同时，200 多个 AI 国家也在经营各自的经济、挑起战争、战败时乞求和平。瘟疫、大丰收、技术突破、暴乱等随机事件让历史不断前进。程序生成的地形带有气候生物群系与地形晕渲，边界可无级缩放——世界看起来就像一本真正的地图册。',
          '战役每回合自动存档，关掉标签页也能随时继续。当你的国家灭亡——或你主动退位——分数会以昵称记录在本地 Top10 排行榜中，并支持与本站其他游戏相同的存档导出/导入。',
          '和这个书架上的其他游戏一样，这款游戏也是 AI 在 2026 年 7 月凭一条提示词完成的——地图引擎、省份生成器、模拟系统、AI、音效，全部如此。它是那个时间点 AI 能力的可玩快照。',
        ],
        how: [
          '🖱 拖动——平移地图 · 滚轮/双指——缩放 · 点击省份——查看与管理',
          '💰 投资按钮——提升农业/科技/教育 · ⚔ 征兵——从人口中组建军队',
          '点击己方军队，再点高亮的相邻省份——移动（绿）或进攻（红）· 沿海省份可跨海入侵 · 用派兵滑块可只派出部分兵力',
          '🕊 外交——宣战、求和、接受和平 · 关注关系数值',
          '结束回合（或 Enter）——推进 3 个月 · 占领世界 60% 达成霸权 · 记录以昵称保存',
        ],
      },
    },
  },
  {
    slug: 'fruit-blocks',
    released: '2026-07',
    tech: 'Canvas 2D · Web Audio',
    playPath: '/games/fruit/index.html',
    cover: '/games/fruit/cover.jpg',
    copy: {
      en: {
        title: 'Fruit Blocks',
        tagline: 'A juicy match-3 puzzle — burst fruit in showers of juice, chain combos, and climb the fruit ranks.',
        about: [
          'Fruit Blocks is a classic match-3 puzzle in the spirit of the candy-crushing greats. Swap two adjacent fruits on an 8×8 board to line up three or more of a kind — and watch them burst in a shower of juice droplets, sparkles and shockwave rings, with screen shake and rising combo notes to match. Match four in a row to forge a line blaster, an L or T shape to forge a bomb, and five in a row to earn a rainbow fruit that wipes every fruit of one kind off the board. Swap two specials together for even bigger fireworks.',
          'Every level gives you a score target and a limited number of moves. Clear it and your leftover moves explode into bonus points; miss it and the run ends. The difficulty climbs as you go — higher targets, fewer moves, and a sixth fruit joining the board from level 3 — and your progress earns you fruit ranks, from humble Seed all the way to Fruit Legend. Chain cascades multiply your score, so one clever swap can set off a glorious chain reaction. A cheerful synthesized soundtrack and juicy pop-and-blast sound effects — all generated in code — keep the fruit flying.',
          'Your total score is recorded under your nickname in a local top-10 leaderboard with your personal best — stored in this browser, with the same export/import save system as our other games, so you can carry your records to another computer.',
          'Like everything on this shelf, this game was built entirely by AI in July 2026 from a single prompt — the match engine, the particle effects, the sounds, the music. A playable snapshot of what AI could build at that moment.',
        ],
        how: [
          '🖱 Tap / click a fruit, then an adjacent one — or drag a fruit toward a neighbor — to swap',
          '3 in a row — burst · 4 in a row — line blaster · L / T shape — bomb · 5 in a row — rainbow fruit',
          'Reach the target score before your moves run out · leftover moves become bonus points',
          'ESC — pause · 🔊 button — mute · records are saved under your nickname',
          '📱 Mobile — fully touch-controlled: tap or swipe fruits to swap',
        ],
      },
      ko: {
        title: '과일블럭게임',
        tagline: '과즙 팡팡 매치3 퍼즐 — 과일을 시원하게 터뜨리고, 콤보를 쌓고, 과일 등급을 올려보세요.',
        about: [
          '과일블럭게임은 캔디크러시류 고전 매치3 퍼즐입니다. 8×8 보드에서 이웃한 과일 두 개를 교환해 같은 과일 3개 이상을 일렬로 맞추면 — 과즙 방울과 반짝이, 충격파 링이 사방으로 튀며 시원하게 터집니다. 화면 흔들림과 콤보마다 높아지는 팡! 소리는 덤. 4개를 일렬로 맞추면 줄폭탄, L/T자로 맞추면 폭탄, 5개를 맞추면 한 종류의 과일을 몽땅 쓸어버리는 레인보우 과일이 만들어집니다. 스페셜끼리 교환하면 더 큰 불꽃놀이가 터집니다.',
          '레벨마다 목표 점수와 제한된 이동 횟수가 주어집니다. 목표를 달성하면 남은 이동수가 보너스 점수로 펑펑 터지고, 실패하면 게임 오버. 레벨이 오를수록 목표는 높아지고 이동수는 줄어들며, 3레벨부터는 여섯 번째 과일까지 등장해 난이도가 올라갑니다. 진행에 따라 씨앗부터 전설의 과일 마스터까지 등급 칭호가 붙습니다. 연쇄(캐스케이드)는 점수를 배로 불려주니, 잘 노린 한 수가 화려한 연쇄 폭발로 이어집니다. 경쾌한 BGM과 과즙 터지는 효과음도 전부 코드로 합성했습니다.',
          '총점은 닉네임과 함께 이 브라우저의 로컬 Top10 랭킹에 저장되고 개인 최고기록도 관리됩니다. 다른 게임과 동일한 세이브 내보내기/불러오기를 지원해서 기록을 다른 컴퓨터로 옮길 수 있습니다.',
          '이 선반의 다른 게임처럼, 이 게임도 2026년 7월 단 하나의 프롬프트로 AI가 전부 만들었습니다 — 매치 엔진, 파티클 이펙트, 효과음, 음악까지. 그 시점의 AI가 만들 수 있었던 것의 플레이 가능한 기록입니다.',
        ],
        how: [
          '🖱 과일을 탭/클릭한 뒤 옆 과일을 누르거나, 원하는 방향으로 드래그해서 교환',
          '3개 일렬 — 팡! · 4개 일렬 — 줄폭탄 · L/T자 — 폭탄 · 5개 일렬 — 레인보우 과일',
          '이동수가 다 떨어지기 전에 목표 점수 달성 · 남은 이동수는 보너스 점수로 전환',
          'ESC — 일시정지 · 🔊 버튼 — 음소거 · 기록은 닉네임으로 저장됩니다',
          '📱 모바일 — 터치 완전 지원: 과일을 탭하거나 스와이프해서 교환',
        ],
      },
      ja: {
        title: 'フルーツブロック',
        tagline: '果汁はじけるマッチ3パズル — フルーツを爽快に弾けさせ、コンボを重ね、フルーツ称号を目指そう。',
        about: [
          'フルーツブロックは、キャンディクラッシュ系の王道マッチ3パズルです。8×8の盤面で隣り合うフルーツを入れ替え、同じ種類を3つ以上並べると — 果汁のしぶきとキラキラ、衝撃波リングが飛び散り、画面が揺れ、コンボごとに音程が上がるポップ音とともに爽快に弾けます。4つ並べるとラインボム、L/T字でボム、5つ並べると1種類のフルーツを一掃するレインボーフルーツが誕生。スペシャル同士を入れ替えれば、さらに大きな花火が上がります。',
          '各レベルには目標スコアと限られた手数があります。達成すれば残り手数がボーナス点として弾け、失敗すればゲームオーバー。レベルが上がるほど目標は高く、手数は少なくなり、レベル3からは6種類目のフルーツも登場します。進行に応じてタネから伝説のフルーツマスターまでの称号が付きます。連鎖はスコアを倍々に増やすので、狙いすました一手が華麗な連鎖爆発につながります。軽快なBGMも果汁弾ける効果音も、すべてコードで合成しています。',
          '合計スコアはニックネームと共にこのブラウザのローカルTop10ランキングに保存され、自己ベストも管理されます。他のゲームと同じセーブ書き出し/読み込みに対応し、記録を別のパソコンへ移せます。',
          'この棚の他のゲームと同じく、このゲームも2026年7月にたった一つのプロンプトからAIがすべて作りました — マッチエンジン、パーティクル、効果音、音楽まで。その時点のAIに何が作れたかの、遊べる記録です。',
        ],
        how: [
          '🖱 フルーツをタップ/クリックして隣を選ぶか、隣へドラッグして入れ替え',
          '3つ並び — パン！ · 4つ並び — ラインボム · L/T字 — ボム · 5つ並び — レインボー',
          '手数が尽きる前に目標スコアを達成 · 残り手数はボーナス点に変換',
          'ESC — 一時停止 · 🔊 ボタン — ミュート · 記録はニックネームで保存',
          '📱 モバイル — タッチ完全対応: タップまたはスワイプで入れ替え',
        ],
      },
      es: {
        title: 'Fruit Blocks',
        tagline: 'Un match-3 jugoso: revienta frutas en lluvias de zumo, encadena combos y sube de rango frutal.',
        about: [
          'Fruit Blocks es un puzle match-3 clásico al estilo de los grandes rompe-caramelos. Intercambia dos frutas adyacentes en un tablero de 8×8 para alinear tres o más iguales — y míralas estallar en una lluvia de gotas de zumo, destellos y anillos de choque, con temblor de pantalla y notas de combo ascendentes. Alinea cuatro para forjar un rayo de línea, una forma en L o T para una bomba, y cinco para ganar una fruta arcoíris que barre del tablero todas las frutas de un tipo. Intercambia dos especiales entre sí para fuegos artificiales aún mayores.',
          'Cada nivel te da una puntuación objetivo y un número limitado de movimientos. Si lo superas, tus movimientos sobrantes explotan en puntos extra; si fallas, la partida termina. La dificultad sube sin parar — objetivos más altos, menos movimientos y una sexta fruta desde el nivel 3 — y tu progreso te otorga rangos frutales, desde la humilde Semilla hasta la Leyenda de la fruta. Las cascadas multiplican tu puntuación, así que un intercambio ingenioso puede desatar una gloriosa reacción en cadena. La alegre banda sonora sintetizada y los jugosos efectos de sonido están generados íntegramente por código.',
          'Tu puntuación total se registra con tu apodo en un ranking local top-10 junto a tu mejor marca personal — guardada en este navegador, con el mismo sistema de exportar/importar partida que nuestros otros juegos para llevar tus récords a otro ordenador.',
          'Como todo en esta estantería, este juego fue creado íntegramente por IA en julio de 2026 a partir de un solo prompt: el motor de combinaciones, las partículas, los sonidos y la música. Una instantánea jugable de lo que la IA podía construir en ese momento.',
        ],
        how: [
          '🖱 Toca/clic en una fruta y luego en una adyacente — o arrástrala hacia su vecina — para intercambiar',
          '3 en línea — ¡pum! · 4 en línea — rayo de línea · forma L/T — bomba · 5 en línea — fruta arcoíris',
          'Alcanza la puntuación objetivo antes de agotar los movimientos · los sobrantes se vuelven puntos extra',
          'ESC — pausa · botón 🔊 — silenciar · los récords se guardan con tu apodo',
          '📱 Móvil — control táctil completo: toca o desliza las frutas para intercambiar',
        ],
      },
      zh: {
        title: '水果方块',
        tagline: '果汁四溅的消消乐——痛快地炸开水果，叠加连击，冲击水果段位。',
        about: [
          '水果方块是一款致敬糖果传奇的经典三消益智游戏。在 8×8 棋盘上交换相邻的两个水果，凑齐三个以上同类——它们会在果汁飞溅、星光闪烁和冲击波环中痛快爆开，伴随屏幕震动和音调步步升高的连击音效。四个一排锻造直线炸弹，L/T 形锻造范围炸弹，五个一排则获得能清空一种水果的彩虹果。两个特殊方块互换，还能引爆更大的烟花。',
          '每一关都有目标分数和有限步数。达成目标，剩余步数会化作奖励分连环爆炸；失败则游戏结束。难度不断攀升——目标更高、步数更少，第 3 关起还会加入第六种水果——你的进度会换来水果段位，从种子一路升到传说水果大师。连锁反应会成倍放大得分，一步妙手就能引发华丽的连环爆炸。欢快的背景音乐和果汁四溅的音效全部由代码合成。',
          '总分会以昵称记录在此浏览器的本地 Top10 排行榜中，并保存个人最佳。支持与本站其他游戏相同的存档导出/导入，可将记录迁移到其他电脑。',
          '和这个书架上的其他游戏一样，这款游戏也是 AI 在 2026 年 7 月凭一条提示词完成的——三消引擎、粒子特效、音效、音乐，全部如此。它是那个时间点 AI 能力的可玩快照。',
        ],
        how: [
          '🖱 点击一个水果再点相邻的，或朝相邻方向拖动，即可交换',
          '3 个一排 — 爆炸 · 4 个一排 — 直线炸弹 · L/T 形 — 炸弹 · 5 个一排 — 彩虹果',
          '在步数耗尽前达到目标分数 · 剩余步数转化为奖励分',
          'ESC — 暂停 · 🔊 按钮 — 静音 · 记录以昵称保存',
          '📱 移动端 — 完整触控支持：点按或滑动水果即可交换',
        ],
      },
    },
  },
  {
    slug: 'menew-kart',
    released: '2026-07',
    tech: 'Three.js · WebGL',
    playPath: '/games/kart/index.html',
    cover: '/games/kart/cover.jpg',
    copy: {
      en: {
        title: 'MeNew Kart',
        tagline: 'A 3D grand prix with 11 quirky racers — drift turbos, item battles, and a local time-attack leaderboard.',
        about: [
          'MeNew Kart is a browser kart racer in the spirit of the classics: a 3-lap circuit with hills and banked corners, 10 CPU rivals, boost pads, and item boxes. Grab a 🍄 mushroom for a burst of speed, drop a 🍌 banana behind you, or fire a 🐢 shell down the road. Hold drift through a corner and release it for a turbo boost — the longer the drift, the bigger the boost. Wheels spin and steer, karts lean into slopes, and a minimap tracks all eleven racers in real time.',
          'Eleven racers, each with their own top speed, acceleration and handling: the girls Uja, Uni and jjojjo 🎀, the crowned MeNew, duck-billed ND, and JB, JW, IW, DS, GS and KJ. Pick a nickname, pick a racer, and chase the finish line.',
          'Your finish times are recorded under your nickname in a local top-10 leaderboard with your personal best — stored in this browser, with the same export/import save system as our other games, so you can carry your records to another computer.',
          'Like everything on this shelf, this game was built entirely by AI in July 2026 from a single prompt — the track engine, the kart physics, the CPU drivers, the sounds. A playable snapshot of what AI could build at that moment.',
        ],
        how: [
          '↑ / W — accelerate · ↓ / S — brake · ← → / A D — steer',
          'Space — drift (hold through a corner, release for a turbo boost)',
          'Shift — use item (🍄 boost · 🍌 banana trap · 🐢 shell)',
          'ESC — menu · Finish 3 laps to set your record',
          '📱 Mobile — touch controls appear automatically: steer ◀ ▶ on the left, gas / brake / drift / item on the right',
        ],
      },
      ko: {
        title: 'MeNew 카트',
        tagline: '개성 만점 레이서 11명의 3D 그랑프리 — 드리프트 부스터, 아이템전, 로컬 타임어택 랭킹까지.',
        about: [
          'MeNew 카트는 고전 카트 레이싱의 감성을 담은 브라우저 레이싱 게임입니다. 언덕과 뱅킹 커브가 있는 서킷 3랩을 CPU 라이벌 10대와 겨루세요. 부스트 패드를 밟고, 아이템 박스에서 🍄 버섯(가속)·🍌 바나나(함정)·🐢 등껍질(발사)을 뽑아 쓸 수 있습니다. 코너에서 드리프트를 길게 유지했다 놓으면 터보 부스터가 터집니다 — 길게 끌수록 더 강력하게. 바퀴는 실제로 구르고 조향에 따라 꺾이며, 카트는 경사와 뱅킹에 맞춰 기울고, 미니맵에서 11대의 위치를 실시간으로 볼 수 있습니다.',
          '레이서는 11명, 각자 최고속도·가속·조향 스탯이 다릅니다. 여성 레이서 Uja·Uni·jjojjo 🎀, 왕관을 쓴 MeNew, 오리 부리 ND, 그리고 JB·JW·IW·DS·GS·KJ까지. 닉네임을 정하고 레이서를 골라 결승선을 노려보세요.',
          '완주 기록은 닉네임과 함께 이 브라우저의 로컬 Top10 랭킹에 저장되고 개인 최고기록도 관리됩니다. 다른 게임과 동일한 세이브 내보내기/불러오기를 지원해서 기록을 다른 컴퓨터로 옮길 수 있습니다.',
          '이 선반의 다른 게임처럼, 이 게임도 2026년 7월 단 하나의 프롬프트로 AI가 전부 만들었습니다 — 트랙 엔진, 카트 물리, CPU 드라이버, 사운드까지. 그 시점의 AI가 만들 수 있었던 것의 플레이 가능한 기록입니다.',
        ],
        how: [
          '↑ / W — 가속 · ↓ / S — 브레이크 · ← → / A D — 조향',
          'Space — 드리프트 (코너에서 길게 유지 후 놓으면 터보 부스터)',
          'Shift — 아이템 사용 (🍄 가속 · 🍌 바나나 함정 · 🐢 등껍질 발사)',
          'ESC — 메뉴 · 3랩 완주 시 기록이 저장됩니다',
          '📱 모바일 — 터치 컨트롤이 자동 표시됩니다: 왼쪽 ◀ ▶ 조향, 오른쪽 가속/브레이크/드리프트/아이템 버튼',
        ],
      },
      ja: {
        title: 'MeNew カート',
        tagline: '個性豊かな11人のレーサーによる3Dグランプリ — ドリフトターボ、アイテムバトル、ローカルタイムアタックランキング。',
        about: [
          'MeNewカートは、クラシックなカートレースの魂を受け継ぐブラウザレーシングゲームです。丘とバンクコーナーのあるサーキットを3周、10台のCPUライバルと競います。ブーストパッドを踏み、アイテムボックスから🍄キノコ(加速)・🍌バナナ(トラップ)・🐢甲羅(発射)を引き当てましょう。コーナーでドリフトを長く維持して離すとターボブースト — 長いほど強力です。タイヤは実際に回転・操舵し、カートは坂とバンクに合わせて傾き、ミニマップで11台の位置をリアルタイムに確認できます。',
          'レーサーは11人、それぞれ最高速・加速・ハンドリングが異なります。女子レーサーのUja・Uni・jjojjo 🎀、王冠のMeNew、アヒル口のND、そしてJB・JW・IW・DS・GS・KJ。ニックネームを決めて、レーサーを選び、ゴールを目指しましょう。',
          '完走タイムはニックネームと共にこのブラウザのローカルTop10ランキングに保存され、自己ベストも管理されます。他のゲームと同じセーブ書き出し/読み込みに対応し、記録を別のパソコンへ移せます。',
          'この棚の他のゲームと同じく、このゲームも2026年7月にたった一つのプロンプトからAIがすべて作りました — トラックエンジン、カート物理、CPUドライバー、サウンドまで。その時点のAIに何が作れたかの、遊べる記録です。',
        ],
        how: [
          '↑ / W — アクセル · ↓ / S — ブレーキ · ← → / A D — ハンドル',
          'Space — ドリフト (コーナーで長押し→離すとターボ)',
          'Shift — アイテム使用 (🍄 加速 · 🍌 バナナ · 🐢 甲羅)',
          'ESC — メニュー · 3周完走でタイムが記録されます',
          '📱 モバイル — タッチ操作を自動表示: 左の◀ ▶でハンドル、右にアクセル/ブレーキ/ドリフト/アイテム',
        ],
      },
      es: {
        title: 'MeNew Kart',
        tagline: 'Un gran premio 3D con 11 corredores únicos: turbos de derrape, batallas de objetos y ranking local contrarreloj.',
        about: [
          'MeNew Kart es un juego de karts para navegador con el espíritu de los clásicos: un circuito de 3 vueltas con colinas y curvas peraltadas, 10 rivales CPU, plataformas de turbo y cajas de objetos. Coge un 🍄 champiñón para acelerar, suelta un 🍌 plátano detrás de ti o lanza un 🐢 caparazón. Mantén el derrape en una curva y suéltalo para un turbo: cuanto más largo el derrape, mayor el impulso. Las ruedas giran y se orientan, los karts se inclinan con las pendientes y un minimapa sigue a los once corredores en tiempo real.',
          'Once corredores, cada uno con su velocidad punta, aceleración y manejo: las chicas Uja, Uni y jjojjo 🎀, MeNew con su corona, ND con pico de pato, y JB, JW, IW, DS, GS y KJ. Elige apodo, elige corredor y persigue la meta.',
          'Tus tiempos se registran con tu apodo en un ranking local top-10 junto a tu mejor marca personal — guardado en este navegador, con el mismo sistema de exportar/importar partida que nuestros otros juegos para llevar tus récords a otro ordenador.',
          'Como todo en esta estantería, este juego fue creado íntegramente por IA en julio de 2026 a partir de un solo prompt: el motor del circuito, las físicas del kart, los pilotos CPU y los sonidos. Una instantánea jugable de lo que la IA podía construir en ese momento.',
        ],
        how: [
          '↑ / W — acelerar · ↓ / S — frenar · ← → / A D — girar',
          'Space — derrape (mantén en la curva y suelta para turbo)',
          'Shift — usar objeto (🍄 turbo · 🍌 plátano · 🐢 caparazón)',
          'ESC — menú · Completa 3 vueltas para registrar tu tiempo',
          '📱 Móvil — controles táctiles automáticos: dirección ◀ ▶ a la izquierda; gas, freno, derrape y objeto a la derecha',
        ],
      },
      zh: {
        title: 'MeNew 卡丁车',
        tagline: '11 位个性车手的 3D 大奖赛——漂移加速、道具对战、本地计时排行榜。',
        about: [
          'MeNew 卡丁车是一款致敬经典卡丁车竞速的浏览器游戏：带坡道和倾斜弯道的赛道跑 3 圈，与 10 名 CPU 对手竞争，还有加速带和道具箱。抽到 🍄 蘑菇瞬间提速、往身后丢 🍌 香蕉设陷阱、或发射 🐢 龟壳攻击前方。过弯时长按漂移再松开即可触发涡轮加速——漂移越久，加速越强。车轮真实转动并随转向偏转，车身会顺着坡度和弯道倾斜，小地图实时显示全部 11 辆车的位置。',
          '11 位车手各有不同的极速、加速和操控：女车手 Uja、Uni、jjojjo 🎀，戴王冠的 MeNew，鸭嘴的 ND，以及 JB、JW、IW、DS、GS、KJ。取个昵称，选好车手，冲向终点吧。',
          '完赛成绩会以昵称记录在此浏览器的本地 Top10 排行榜中，并保存个人最佳。支持与本站其他游戏相同的存档导出/导入，可将记录迁移到其他电脑。',
          '和这个书架上的其他游戏一样，这款游戏也是 AI 在 2026 年 7 月凭一条提示词完成的——赛道引擎、卡丁车物理、CPU 车手、音效，全部如此。它是那个时间点 AI 能力的可玩快照。',
        ],
        how: [
          '↑ / W — 加速 · ↓ / S — 刹车 · ← → / A D — 转向',
          'Space — 漂移（弯道长按后松开触发涡轮加速）',
          'Shift — 使用道具（🍄 加速 · 🍌 香蕉 · 🐢 龟壳）',
          'ESC — 菜单 · 完成 3 圈即记录成绩',
          '📱 移动端 — 自动显示触控按键：左侧 ◀ ▶ 转向，右侧油门/刹车/漂移/道具',
        ],
      },
    },
  },
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
          '📱 Mobile — virtual joystick to move, drag the screen to look, buttons for jump / break / place, tap the hotbar to pick blocks',
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
          '📱 모바일 — 가상 조이스틱으로 이동, 화면 드래그로 시점 회전, 점프/파괴/설치 버튼, 핫바를 탭해 블록 선택',
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
          '📱 モバイル — 仮想ジョイスティックで移動、画面ドラッグで視点、ジャンプ/破壊/設置ボタン、ホットバーをタップして選択',
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
          '📱 Móvil — joystick virtual para moverte, arrastra la pantalla para mirar, botones de salto / romper / colocar, toca la barra para elegir bloques',
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
          '📱 移动端 — 虚拟摇杆移动，拖动屏幕转视角，跳跃/破坏/放置按键，点按物品栏选择方块',
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
