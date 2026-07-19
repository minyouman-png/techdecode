'use strict';

/* ============================================================
   SUPER UJA · 슈퍼유자  (AI-built indie game, July 2026)
   - 슈퍼마리오류 횡스크롤 플랫포머 × 조선시대 · 한국 요괴
   - 유자(한복 소녀) 주인공, 유니콘 '유니' 탑승(요시 포지션)
   - 요괴: 처녀귀신·저승사자(갓 슬라이드)·도깨비·달걀귀신·구미호
   - 5 스테이지 + 최종보스 염라대왕, 엽전·복주머니 블록·유자열매
   - 그래픽 전부 캔버스 벡터, 국악풍 합성 BGM/SFX
   - 기록: 닉네임 Top10 + 스테이지 이어하기 자동저장
   ============================================================ */

window.onerror = function (msg, src, line) {
  var e = document.getElementById('err');
  if (e) { e.style.display = 'block'; e.textContent = 'Error: ' + msg + ' (line ' + line + ')'; }
};

/* ===== 다국어 ===== */
const I18N = {
  en: {
    sub: 'JOSEON ADVENTURE', start: '▶ Start Game', cont: '▶ Continue', records: '🏆 Records',
    back: '← Back', retry: '🔄 Play Again', menu: 'Menu', nickPh: 'Nickname',
    help: '<b>←→</b> Move · <b>Space/↑</b> Jump (hold = higher) · <b>Shift</b> Run<br>Stomp on ghosts to defeat them · ride the unicorn <b>Uni</b> for a double jump!<br>🌶️ Chili = tap <b>Shift</b> to shoot fireballs · 🐯 Tiger charm = hold jump to glide<br><b>ESC</b> Pause · 📱 touch controls on mobile',
    credit: 'An indie game built 100% with AI · July 2026 · ',
    expSave: '💾 Export Save', impSave: '📂 Import Save',
    impConfirm: 'Overwrite your current records with this save file?',
    impErr: 'Not a valid SUPER UJA save file', expDone: 'Save file downloaded',
    recNote: 'Records are stored in this browser. Export your save to move them to another computer.',
    colRank: '#', colName: 'NAME', colScore: 'SCORE', colStage: 'STAGE', colDate: 'DATE',
    emptyRec: 'No records yet — go save Joseon!',
    pauseT: '⏸ Paused', resume: '▶ Resume', quit: '🏳 Quit',
    quitConfirm: 'Quit to menu? You can continue from the start of this stage.',
    stages: ['Thatched Village', 'Pine Forest', 'Palace Roofs', 'Underworld Road', "King Yeomra's Palace", 'Plum-Bamboo Grove', 'Snowy Pass', 'Sunset Shore', 'Cloud Skyway', "Queen JJOJJO's Sky Palace", 'Cherry Garden', 'Crimson Volcano', 'Aurora Glacier', 'Golden Harbor', "JJOJJO's Iron Fortress"],
    stageLbl: 'STAGE', gameOver: 'GAME OVER', stageClear: 'STAGE CLEAR!', timeBonus: 'Time bonus',
    worldClear: "👑 JJOJJO's tank is destroyed! Peace returns to Joseon!", newRecord: '🎉 New personal best!',
    finalScore: 'Score', reachedStage: 'Reached', resTitle: '🍋 Result',
    oneUp: '1UP!', mounted: '🦄 Uni joins you!', bossWarn: '⚡ King Yeomra appears!', bossWarn2: '⚡ Queen JJOJJO appears!', bossWarn3: '⚡ JJOJJO rolls in on a tank!',
    lifeLost: 'Try again!', timeUp: "Time's up!",
    contT: 'Continue?', contYes: '▶ Continue', contNo: '🏳 Give up',
    contDesc: 'Spend half your score to carry on from this stage.', contScore: 'Score', contAfter: 'After',
    storyHint: '▶ Continue (Space/Tap)', storySkip: 'Skip: ESC',
    chars: { uja: 'Yuja', uni: 'Uni', yeomra: 'King Yeomra', jjo: 'Queen JJOJJO' },
    story: {
      intro: ["In a little mountain village, Yuja missed her mother, who had gone to the sky.", "I'm going to find Mom. Uni, will you come with me?", "And so Yuja and her unicorn Uni set off on a journey to the Underworld."],
      after5: ["A child of the living, here? ...Your courage impresses me.", "Take this Underworld Pass. But beware — the queen there has lost her memory.", "Clutching the pass, Yuja walked deeper into the Underworld."],
      before10: ["On the throne of the Sky Palace... that face was unmistakably her mother's.", "Mom!! It's me, Yuja!", "...Who are you? Insolent child. Begone!"],
      after10: ["The fallen queen still did not recognize her daughter.", "Come to the Iron Fortress. We finish this there!"],
      ending: ["As the tank crumbled... the fog lifted from the queen's eyes.", "...Yuja? My little Yuja... is it really you?", "Mom!! I missed you so much!!", "Hand in hand, the three returned together to the warm world of the living. — The End —"],
    },
  },
  ko: {
    sub: '조선 대모험', start: '▶ 게임 시작', cont: '▶ 이어하기', records: '🏆 기록실',
    back: '← 뒤로', retry: '🔄 다시 도전', menu: '메뉴로', nickPh: '닉네임',
    help: '<b>←→</b> 이동 · <b>Space/↑</b> 점프(길게 = 높이) · <b>Shift</b> 달리기<br>요괴는 밟아서 물리치세요 · 유니콘 <b>유니</b>를 타면 2단 점프!<br>🌶️ 고추 = <b>Shift</b> 탭으로 불꽃 발사 · 🐯 호랑이 부적 = 공중에서 점프 길게 눌러 활강<br><b>ESC</b> 일시정지 · 📱 모바일 터치 지원',
    credit: 'AI로 100% 제작한 인디게임 · 2026년 7월 · ',
    expSave: '💾 세이브 내보내기', impSave: '📂 세이브 불러오기',
    impConfirm: '이 세이브 파일로 현재 기록을 덮어쓸까요?',
    impErr: '올바른 슈퍼유자 세이브 파일이 아닙니다', expDone: '세이브 파일이 다운로드되었습니다',
    recNote: '기록은 이 브라우저에 저장됩니다. 다른 컴퓨터로 옮기려면 세이브를 내보내세요.',
    colRank: '순위', colName: '닉네임', colScore: '점수', colStage: '스테이지', colDate: '날짜',
    emptyRec: '아직 기록이 없습니다 — 조선을 구하러 가요!',
    pauseT: '⏸ 일시정지', resume: '▶ 계속하기', quit: '🏳 그만하기',
    quitConfirm: '메뉴로 나갈까요? 이 스테이지 시작부터 이어할 수 있습니다.',
    stages: ['초가마을', '소나무 숲', '궁궐 지붕', '저승길', '염라대왕궁', '매화 대나무숲', '설산 고개', '노을 바닷가', '구름 하늘길', '쪼쪼 여왕의 하늘궁전', '왕벚꽃 정원', '홍염 화산', '오로라 빙하', '황금 노을 포구', '쪼쪼의 강철 요새'],
    stageLbl: '스테이지', gameOver: '게임 오버', stageClear: '스테이지 클리어!', timeBonus: '시간 보너스',
    worldClear: '👑 쪼쪼의 탱크를 파괴했다! 조선에 평화가!', newRecord: '🎉 개인 최고기록 갱신!',
    finalScore: '점수', reachedStage: '도달', resTitle: '🍋 결과',
    oneUp: '생명 +1!', mounted: '🦄 유니가 함께합니다!', bossWarn: '⚡ 염라대왕 등장!', bossWarn2: '⚡ 쪼쪼 여왕 등장!', bossWarn3: '⚡ 탱크를 탄 쪼쪼 등장!',
    lifeLost: '다시 도전!', timeUp: '시간 초과!',
    contT: '이어서 할까요?', contYes: '▶ 이어하기', contNo: '🏳 그만두기',
    contDesc: '누적 점수의 절반을 사용해 이 스테이지부터 이어합니다.', contScore: '현재 점수', contAfter: '이어하기 후',
    storyHint: '▶ 계속 (Space·터치)', storySkip: '건너뛰기: ESC',
    chars: { uja: '유자', uni: '유니', yeomra: '염라대왕', jjo: '쪼쪼 여왕' },
    story: {
      intro: ['산골 마을의 소녀 유자는 하늘로 떠난 엄마가 사무치게 그리웠어요.', '엄마를 꼭 만나러 갈 거야. 유니, 함께 가 줄래?', '그렇게 유자와 유니콘 유니는 저승을 향한 모험을 떠났습니다.'],
      after5: ['이승의 아이가 여기까지 오다니… 그 용기, 인정하마.', '저승 출입권을 주마. 허나 조심하거라 — 그곳의 여왕은 기억을 잃었으니.', '출입권을 꼭 쥔 유자는 더 깊은 저승으로 나아갔습니다.'],
      before10: ['하늘궁전의 옥좌 위… 그 얼굴은 분명, 그리운 엄마였습니다.', '엄마!! 나야, 유자야!', '…누구냐? 무엄한 꼬마 같으니. 물러가라!'],
      after10: ['쓰러진 여왕은 끝내 유자를 알아보지 못했습니다.', '강철 요새로 오너라. 거기서 끝장을 내주마!'],
      ending: ['탱크가 부서지고… 여왕의 눈에서 안개가 걷혔습니다.', '…유자? 우리 딸… 유자 맞니?', '엄마!! 보고 싶었어!!', '셋은 손을 잡고, 따뜻한 이승으로 함께 돌아갔답니다. — 끝 —'],
    },
  },
  ja: {
    sub: '朝鮮大冒険', start: '▶ ゲーム開始', cont: '▶ つづきから', records: '🏆 記録室',
    back: '← 戻る', retry: '🔄 もう一度', menu: 'メニューへ', nickPh: 'ニックネーム',
    help: '<b>←→</b> 移動 · <b>Space/↑</b> ジャンプ(長押し=高く) · <b>Shift</b> ダッシュ<br>妖怪は踏んで倒そう · ユニコーン<b>ユニ</b>に乗ると2段ジャンプ！<br>🌶️ 唐辛子 = <b>Shift</b>で火の玉発射 · 🐯 虎のお守り = 空中でジャンプ長押しで滑空<br><b>ESC</b> 一時停止 · 📱 モバイルタッチ対応',
    credit: 'AIだけで作られたインディーゲーム · 2026年7月 · ',
    expSave: '💾 セーブを書き出す', impSave: '📂 セーブを読み込む',
    impConfirm: 'このセーブファイルで現在の記録を上書きしますか？',
    impErr: '正しいスーパーユジャのセーブファイルではありません', expDone: 'セーブファイルをダウンロードしました',
    recNote: '記録はこのブラウザに保存されます。別のパソコンへはセーブの書き出しで移行できます。',
    colRank: '順位', colName: '名前', colScore: 'スコア', colStage: 'ステージ', colDate: '日付',
    emptyRec: 'まだ記録がありません — 朝鮮を救いに行こう！',
    pauseT: '⏸ 一時停止', resume: '▶ つづける', quit: '🏳 やめる',
    quitConfirm: 'メニューに戻りますか？このステージの最初から再開できます。',
    stages: ['わらぶきの村', '松の森', '宮殿の屋根', '冥途の道', '閻魔大王宮', '梅と竹の林', '雪山峠', '夕焼けの浜辺', '雲の空道', 'チョチョ女王の天空宮', '八重桜の庭', '紅炎火山', 'オーロラ氷河', '黄金の夕焼け港', 'チョチョの鋼鉄要塞'],
    stageLbl: 'ステージ', gameOver: 'ゲームオーバー', stageClear: 'ステージクリア！', timeBonus: 'タイムボーナス',
    worldClear: '👑 チョチョの戦車を破壊した！朝鮮に平和が！', newRecord: '🎉 自己ベスト更新！',
    finalScore: 'スコア', reachedStage: '到達', resTitle: '🍋 リザルト',
    oneUp: '残機 +1！', mounted: '🦄 ユニが仲間に！', bossWarn: '⚡ 閻魔大王あらわる！', bossWarn2: '⚡ チョチョ女王あらわる！', bossWarn3: '⚡ 戦車に乗ったチョチョ登場！',
    lifeLost: 'もう一度！', timeUp: 'タイムアップ！',
    contT: 'つづけますか？', contYes: '▶ つづける', contNo: '🏳 やめる',
    contDesc: 'スコアの半分を使ってこのステージから再開します。', contScore: '現在スコア', contAfter: '再開後',
    storyHint: '▶ つづく (Space・タップ)', storySkip: 'スキップ: ESC',
    chars: { uja: 'ユジャ', uni: 'ユニ', yeomra: '閻魔大王', jjo: 'チョチョ女王' },
    story: {
      intro: ['山里の少女ユジャは、空へ旅立ったお母さんが恋しくてたまりませんでした。', 'お母さんに会いに行くの。ユニ、一緒に来てくれる？', 'こうしてユジャとユニコーンのユニは、冥界への冒険に旅立ちました。'],
      after5: ['この世の子供がここまで来るとは…その勇気、認めよう。', '冥界通行証を授けよう。だが気をつけよ、あの女王は記憶を失っておる。', '通行証を握りしめ、ユジャはさらに深い冥界へと進みました。'],
      before10: ['天空宮の玉座の上…その顔は、確かに恋しい母でした。', 'お母さん!! 私よ、ユジャよ！', '…何者だ？無礼な子め。去れ！'],
      after10: ['倒れた女王は、ついに娘に気づきませんでした。', '鋼鉄要塞に来い。そこで決着をつけてやる！'],
      ending: ['戦車が壊れると…女王の瞳から霧が晴れました。', '…ユジャ？私の娘…ユジャなの？', 'お母さん!! 会いたかった!!', '三人は手を取り合い、温かいこの世へ帰っていきました。― おしまい ―'],
    },
  },
  es: {
    sub: 'AVENTURA EN JOSEON', start: '▶ Empezar', cont: '▶ Continuar', records: '🏆 Récords',
    back: '← Atrás', retry: '🔄 Jugar otra vez', menu: 'Menú', nickPh: 'Apodo',
    help: '<b>←→</b> Moverse · <b>Espacio/↑</b> Saltar (mantén = más alto) · <b>Shift</b> Correr<br>Pisa a los fantasmas para vencerlos · ¡monta a la unicornio <b>Uni</b> para doble salto!<br>🌶️ Chile = pulsa <b>Shift</b> para lanzar bolas de fuego · 🐯 Amuleto de tigre = mantén salto para planear<br><b>ESC</b> Pausa · 📱 controles táctiles en móvil',
    credit: 'Un juego indie creado 100% con IA · Julio de 2026 · ',
    expSave: '💾 Exportar partida', impSave: '📂 Importar partida',
    impConfirm: '¿Sobrescribir tus récords actuales con esta partida?',
    impErr: 'No es un archivo de guardado válido de SUPER UJA', expDone: 'Partida descargada',
    recNote: 'Los récords se guardan en este navegador. Exporta tu partida para llevarlos a otro ordenador.',
    colRank: '#', colName: 'NOMBRE', colScore: 'PUNTOS', colStage: 'FASE', colDate: 'FECHA',
    emptyRec: 'Aún no hay récords — ¡ve a salvar Joseon!',
    pauseT: '⏸ Pausa', resume: '▶ Continuar', quit: '🏳 Salir',
    quitConfirm: '¿Salir al menú? Podrás continuar desde el inicio de esta fase.',
    stages: ['Aldea de paja', 'Bosque de pinos', 'Tejados de palacio', 'Camino al inframundo', 'Palacio del Rey Yeomra', 'Bosque de ciruelos y bambú', 'Paso nevado', 'Costa al atardecer', 'Camino de nubes', 'Palacio celestial de la Reina JJOJJO', 'Jardín de cerezos', 'Volcán carmesí', 'Glaciar de auroras', 'Puerto dorado', 'Fortaleza de hierro de JJOJJO'],
    stageLbl: 'FASE', gameOver: 'FIN DEL JUEGO', stageClear: '¡FASE SUPERADA!', timeBonus: 'Bono de tiempo',
    worldClear: '👑 ¡El tanque de JJOJJO ha caído! ¡La paz vuelve a Joseon!', newRecord: '🎉 ¡Nueva mejor marca!',
    finalScore: 'Puntuación', reachedStage: 'Alcanzado', resTitle: '🍋 Resultado',
    oneUp: '¡Vida extra!', mounted: '🦄 ¡Uni se une a ti!', bossWarn: '⚡ ¡Aparece el Rey Yeomra!', bossWarn2: '⚡ ¡Aparece la Reina JJOJJO!', bossWarn3: '⚡ ¡JJOJJO llega en un tanque!',
    lifeLost: '¡Inténtalo de nuevo!', timeUp: '¡Se acabó el tiempo!',
    contT: '¿Continuar?', contYes: '▶ Continuar', contNo: '🏳 Rendirse',
    contDesc: 'Gasta la mitad de tu puntuación para seguir desde esta fase.', contScore: 'Puntuación', contAfter: 'Después',
    storyHint: '▶ Continuar (Espacio/Toque)', storySkip: 'Saltar: ESC',
    chars: { uja: 'Yuja', uni: 'Uni', yeomra: 'Rey Yeomra', jjo: 'Reina JJOJJO' },
    story: {
      intro: ['En una aldea de montaña, Yuja extrañaba a su madre, que se había ido al cielo.', '¡Voy a buscar a mamá! Uni, ¿me acompañas?', 'Y así, Yuja y su unicornio Uni partieron hacia el Inframundo.'],
      after5: ['¿Una niña de los vivos, aquí? ...Tu valor me impresiona.', 'Toma este pase del Inframundo. Pero cuidado: la reina de allí perdió la memoria.', 'Con el pase en la mano, Yuja se adentró en el Inframundo.'],
      before10: ['En el trono del palacio celestial... ese rostro era, sin duda, el de su madre.', '¡¡Mamá!! ¡Soy yo, Yuja!', '...¿Quién eres? Niña insolente. ¡Fuera!'],
      after10: ['La reina caída seguía sin reconocer a su hija.', 'Ven a la Fortaleza de Hierro. ¡Allí acabaremos esto!'],
      ending: ['Cuando el tanque se destruyó... la niebla se disipó de los ojos de la reina.', '...¿Yuja? Mi pequeña Yuja... ¿de verdad eres tú?', '¡¡Mamá!! ¡¡Te extrañé tanto!!', 'Tomados de la mano, los tres volvieron juntos al cálido mundo de los vivos. — Fin —'],
    },
  },
  zh: {
    sub: '朝鲜大冒险', start: '▶ 开始游戏', cont: '▶ 继续游戏', records: '🏆 记录室',
    back: '← 返回', retry: '🔄 再来一次', menu: '菜单', nickPh: '昵称',
    help: '<b>←→</b> 移动 · <b>空格/↑</b> 跳跃(长按=更高) · <b>Shift</b> 奔跑<br>踩到妖怪就能打倒它们 · 骑上独角兽<b>Uni</b>可以二段跳！<br>🌶️ 辣椒 = 按<b>Shift</b>发射火球 · 🐯 虎符 = 空中长按跳跃滑翔<br><b>ESC</b> 暂停 · 📱 移动端触控支持',
    credit: '100% 由 AI 制作的独立游戏 · 2026年7月 · ',
    expSave: '💾 导出存档', impSave: '📂 导入存档',
    impConfirm: '用此存档覆盖当前记录？',
    impErr: '不是有效的超级柚子存档文件', expDone: '存档已下载',
    recNote: '记录保存在此浏览器中。导出存档即可迁移到其他电脑。',
    colRank: '#', colName: '昵称', colScore: '分数', colStage: '关卡', colDate: '日期',
    emptyRec: '还没有记录——快去拯救朝鲜吧！',
    pauseT: '⏸ 暂停', resume: '▶ 继续', quit: '🏳 退出',
    quitConfirm: '返回菜单？可以从本关开头继续。',
    stages: ['草屋村', '松树林', '宫殿屋顶', '黄泉路', '阎罗大王宫', '梅花竹林', '雪山垭口', '落日海边', '云中天路', '啾啾女王的天空宫', '樱花庭园', '赤焰火山', '极光冰川', '黄金落日港', '啾啾的钢铁要塞'],
    stageLbl: '关卡', gameOver: '游戏结束', stageClear: '过关！', timeBonus: '时间奖励',
    worldClear: '👑 摧毁了啾啾的坦克！朝鲜恢复了和平！', newRecord: '🎉 刷新个人最佳！',
    finalScore: '分数', reachedStage: '到达', resTitle: '🍋 结算',
    oneUp: '生命 +1！', mounted: '🦄 Uni加入了！', bossWarn: '⚡ 阎罗大王出现！', bossWarn2: '⚡ 啾啾女王出现！', bossWarn3: '⚡ 啾啾驾驶坦克登场！',
    lifeLost: '再试一次！', timeUp: '时间到！',
    contT: '要继续吗？', contYes: '▶ 继续', contNo: '🏳 放弃',
    contDesc: '消耗一半分数，从本关继续。', contScore: '当前分数', contAfter: '继续后',
    storyHint: '▶ 继续 (空格/点击)', storySkip: '跳过: ESC',
    chars: { uja: '柚子', uni: 'Uni', yeomra: '阎罗大王', jjo: '啾啾女王' },
    story: {
      intro: ['山村的少女柚子，非常想念去了天上的妈妈。', '我要去见妈妈！Uni，陪我一起去好吗？', '就这样，柚子和独角兽Uni踏上了前往冥界的冒险。'],
      after5: ['阳间的孩子竟敢来到这里…你的勇气，我认可了。', '给你冥界通行证。但要小心——那里的女王失去了记忆。', '柚子紧握通行证，走向更深的冥界。'],
      before10: ['天空宫的王座上…那张脸分明就是思念的妈妈。', '妈妈!!是我，柚子啊！', '…你是谁？无礼的小家伙，退下！'],
      after10: ['倒下的女王，终究没有认出女儿。', '来钢铁要塞吧。在那里做个了断！'],
      ending: ['坦克碎裂时…女王眼中的迷雾散去了。', '…柚子？我的女儿…真的是柚子吗？', '妈妈!!我好想你!!', '三人手牵着手，一起回到了温暖的人间。——完——'],
    },
  },
};
let LANG = new URLSearchParams(location.search).get('lang');
if (!I18N[LANG]) LANG = (navigator.language || 'en').slice(0, 2);
if (!I18N[LANG]) LANG = 'en';
const L = I18N[LANG];

/* ===== 상수 ===== */
const TILE = 32, ROWS = 15, VH = ROWS * TILE; // 480
const GRAV = 1900, JUMP_V = 570, RUN = 235, WALK = 145;
const REC_KEY = 'uja_save', GAME_KEY = 'uja_game';
const qs = new URLSearchParams(location.search);
const SHOT = qs.has('shot');

/* ===== HD 스프라이트 (SDXL 픽사풍 렌더 PNG) — 미로드 시 벡터 폴백 ===== */
const HD = {};
// 아트 기본 방향: 1=오른쪽을 봄, -1=왼쪽을 봄
const HD_FACE = {
  uja0: 1, uja1: 1, uja2: 1, uja3: 1, uja2atk: 1, uja3glide: 1, uni: -1,
  ghost: -1, reaper: -1, dok: -1, egg: -1, fox: -1,
  boss: -1, jjo: -1, jjotank: -1,
};
function loadHD() {
  if (typeof Image === 'undefined' || qs.get('hd') === '0') return;
  for (const n of Object.keys(HD_FACE)) {
    const im = new Image();
    im.onload = () => { if (im.naturalWidth > 0) HD[n] = im; };
    im.src = 'img/' + n + '.png';
  }
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ===== 기록 ===== */
function loadRec() {
  try { const s = JSON.parse(localStorage.getItem(REC_KEY)); if (s && Array.isArray(s.top10)) return s; } catch (e) {}
  return { nick: '', top10: [], muted: false, best: 0 };
}
function storeRec() { try { localStorage.setItem(REC_KEY, JSON.stringify(REC)); } catch (e) {} }
let REC = loadRec();
function addRecord(score, stage) {
  const nick = REC.nick || 'UJA';
  const isBest = score > (REC.best || 0);
  if (isBest) REC.best = score;
  REC.top10.push({ n: nick, s: score, g: stage, d: new Date().toISOString().slice(0, 10) });
  REC.top10.sort((a, b) => b.s - a.s); REC.top10 = REC.top10.slice(0, 10);
  storeRec();
  return isBest;
}

/* ============================================================
   오디오 (국악풍 합성)
   ============================================================ */
let AC = null, bgmGain = null, bgmTimer = null, bgmBeat = 0, bgmBoss = false, bgmCur = false;
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  bgmGain = AC.createGain(); bgmGain.gain.value = 0; bgmGain.connect(AC.destination);
}
function muted() { return REC.muted; }
function tone(f0, dur, type, gain, f1, when) {
  if (!AC || muted()) return;
  const t0 = when || AC.currentTime;
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t0);
  if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  gn.gain.setValueAtTime(0, t0);
  gn.gain.linearRampToValueAtTime(gain || 0.13, t0 + 0.01);
  gn.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(gn); gn.connect(AC.destination);
  o.start(t0); o.stop(t0 + dur + 0.03);
}
function noiseS(dur, ff, gain, slide) {
  if (!AC || muted()) return;
  const t0 = AC.currentTime;
  const len = Math.max(1, (AC.sampleRate * dur) | 0);
  const buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource(); src.buffer = buf;
  const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(ff, t0);
  if (slide) f.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  const gn = AC.createGain();
  gn.gain.setValueAtTime(gain || 0.15, t0);
  gn.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f); f.connect(gn); gn.connect(AC.destination);
  src.start(t0);
}
const sfx = {
  jump() { tone(392, 0.07, 'triangle', 0.09, 587); tone(587, 0.1, 'triangle', 0.06, 784, AC ? AC.currentTime + 0.05 : 0); },
  stomp() { noiseS(0.08, 900, 0.13, 250); tone(520, 0.16, 'sine', 0.13, 130); tone(1046, 0.08, 'triangle', 0.05, undefined, AC ? AC.currentTime + 0.05 : 0); },
  coin() { tone(1318, 0.07, 'triangle', 0.11); tone(1760, 0.12, 'triangle', 0.1, undefined, AC ? AC.currentTime + 0.05 : 0); tone(2637, 0.15, 'sine', 0.05, undefined, AC ? AC.currentTime + 0.1 : 0); },
  power() { if (!AC || muted()) return; [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, 0.13, 'triangle', 0.1, undefined, AC.currentTime + i * 0.055); tone(f * 2, 0.09, 'sine', 0.035, undefined, AC.currentTime + i * 0.055); }); },
  flame() { if (!AC || muted()) return; [660, 880, 1100, 1320, 1560].forEach((f, i) => tone(f, 0.1, 'sine', 0.09, undefined, AC.currentTime + i * 0.04)); },
  hurt() { tone(392, 0.2, 'triangle', 0.1, 165); tone(196, 0.16, 'sine', 0.08, 98); },
  die() { if (!AC || muted()) return; tone(988, 0.55, 'sine', 0.08, 165); [523, 415, 330, 262].forEach((f, i) => tone(f, 0.16, 'triangle', 0.07, undefined, AC.currentTime + 0.12 + i * 0.11)); },
  bump() { tone(140, 0.08, 'sine', 0.12, 90); },
  brk() { noiseS(0.16, 1400, 0.16, 300); },
  kick() { noiseS(0.08, 700, 0.1, 2000); },
  mount() { if (!AC || muted()) return; [523, 659, 880, 1175].forEach((f, i) => tone(f, 0.09, 'triangle', 0.09, f * 1.08, AC.currentTime + i * 0.05)); },
  oneUp() { if (!AC || muted()) return; [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, 0.1, 'triangle', 0.09, undefined, AC.currentTime + i * 0.06); tone(f * 2, 0.08, 'sine', 0.03, undefined, AC.currentTime + i * 0.06); }); },
  clear() { if (!AC || muted()) return; tone(65, 0.4, 'sine', 0.11, 45); [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, undefined, AC.currentTime + i * 0.09)); tone(1319, 0.55, 'sine', 0.07, undefined, AC.currentTime + 0.42); },
  bossHit() { tone(180, 0.3, 'sawtooth', 0.16, 60); noiseS(0.25, 500, 0.2, 100); },
  bossDie() { if (!AC || muted()) return; noiseS(0.8, 400, 0.25, 60); [220, 185, 147, 110].forEach((f, i) => tone(f, 0.4, 'sawtooth', 0.1, undefined, AC.currentTime + i * 0.2)); },
  throwP() { noiseS(0.12, 1800, 0.07, 500); },
  warn() { tone(110, 0.5, 'sawtooth', 0.13, 90); tone(220, 0.5, 'sawtooth', 0.07, 180); },
  fire() { noiseS(0.12, 900, 0.1, 2200); tone(500, 0.09, 'square', 0.06, 900); },
  shot() { noiseS(0.06, 1600, 0.13, 350); tone(240, 0.05, 'square', 0.05, 110); },
  cannon() { noiseS(0.28, 260, 0.22, 60); tone(150, 0.22, 'sawtooth', 0.14, 50); },
  flagSlide() { tone(1568, 0.85, 'triangle', 0.09, 330); tone(2093, 0.5, 'sine', 0.04, 523); },
  boom() { noiseS(0.34, 200, 0.2, 50); tone(110, 0.28, 'sine', 0.13, 40); },
};
/* BGM: 디즈니풍 — C장조 6/8 스윙 왈츠 (베이스+왈츠 코드+멜로디+벨 더블링) · 보스전 단조 변주 */
const NOTE = (st) => 261.63 * Math.pow(2, st / 12); // C4 기준 반음
// 8마디 코드 진행: C · Am · F · G · C · F · G · C  (root + 3화음, C4 기준 반음)
const BGM_CHORDS = [[0, 4, 7, 12], [9, 12, 16, 21], [5, 9, 12, 17], [7, 11, 14, 19], [0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [0, 4, 7, 12]];
// 보스전: Cm · Ab · Fm · G (하르모닉 마이너 긴장감)
const BGM_CHORDS_B = [[0, 3, 7, 12], [8, 12, 15, 20], [5, 8, 12, 17], [7, 11, 14, 19], [0, 3, 7, 12], [8, 12, 15, 20], [7, 11, 14, 19], [0, 3, 7, 12]];
// 멜로디: [마디, 6/8스텝, 반음, 길이스텝] — 통통 튀는 상행 아르페지오 + 해피 프레이즈
const BGM_MEL = [
  [0, 0, 4, 2], [0, 2, 7, 1], [0, 3, 12, 3],
  [1, 0, 9, 2], [1, 2, 7, 1], [1, 3, 4, 3],
  [2, 0, 5, 2], [2, 2, 9, 1], [2, 3, 12, 2], [2, 5, 14, 1],
  [3, 0, 11, 2], [3, 2, 7, 1], [3, 3, 2, 3],
  [4, 0, 4, 2], [4, 2, 7, 1], [4, 3, 12, 2], [4, 5, 16, 1],
  [5, 0, 17, 2], [5, 2, 16, 1], [5, 3, 14, 3],
  [6, 0, 11, 1], [6, 1, 12, 1], [6, 2, 14, 1], [6, 3, 11, 1], [6, 4, 7, 2],
  [7, 0, 12, 4], [7, 4, 7, 1], [7, 5, 9, 1],
];
const BGM_MEL_AT = new Map();
BGM_MEL.forEach(([b, p, s, l]) => BGM_MEL_AT.set(b * 6 + p, [s, l]));
const BGM_MINOR = { 4: 3, 9: 8, 16: 15 }; // 장→단 3·6음 플랫
// 스토리 테마 (감동 발라드): F · Dm · Bb · C 진행, 하프 아르페지오 + 오르골 멜로디
const BGM_CHORDS_S = [[5, 9, 12, 17], [2, 5, 9, 14], [-2, 2, 5, 10], [0, 4, 7, 12], [5, 9, 12, 17], [2, 5, 9, 14], [0, 4, 7, 12], [5, 9, 12, 17]];
const BGM_MEL_S = [
  [0, 0, 12, 3], [0, 3, 14, 2], [0, 5, 12, 1],
  [1, 0, 9, 4], [1, 4, 7, 2],
  [2, 0, 10, 3], [2, 3, 9, 2], [2, 5, 7, 1],
  [3, 0, 4, 4], [3, 4, 7, 2],
  [4, 0, 12, 3], [4, 3, 16, 3],
  [5, 0, 14, 3], [5, 3, 12, 2], [5, 5, 10, 1],
  [6, 0, 9, 2], [6, 2, 10, 2], [6, 4, 12, 2],
  [7, 0, 17, 6],
];
const BGM_MEL_S_AT = new Map();
BGM_MEL_S.forEach(([b, p, s, l]) => BGM_MEL_S_AT.set(b * 6 + p, [s, l]));
function bgmVoice(f, t, dur, type, gain) {
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = type; o.frequency.value = f;
  gn.gain.setValueAtTime(0, t);
  gn.gain.linearRampToValueAtTime(gain, t + 0.02);
  gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(gn); gn.connect(bgmGain); o.start(t); o.stop(t + dur + 0.05);
}
function bgmSchedule() {
  if (!AC) return;
  const story = bgmCur === 'story';
  const stepDur = story ? 0.21 : bgmBoss ? 0.125 : 0.152;
  const ahead = AC.currentTime + 0.4;
  while (bgmSchedule.next < ahead) {
    const t = bgmSchedule.next, i = bgmBeat % 48, bar = (i / 6) | 0, pos = i % 6;
    if (story) { // 감동 발라드: 하프 아르페지오 + 오르골 멜로디 (퍼커션 없음)
      const CH = BGM_CHORDS_S[bar];
      if (pos === 0) bgmVoice(NOTE(CH[0]) / 2, t, stepDur * 5.5, 'triangle', 0.07);
      if (pos < 4) bgmVoice(NOTE(CH[pos === 0 ? 1 : pos]), t, stepDur * 2.2, 'sine', 0.03); // 하프 분산화음
      const m = BGM_MEL_S_AT.get(i);
      if (m) {
        const f = NOTE(m[0]);
        bgmVoice(f, t, stepDur * m[1] * 0.95, 'triangle', 0.075);
        bgmVoice(f * 2.002, t, stepDur * m[1] * 0.7, 'sine', 0.04); // 오르골
        bgmVoice(f * 1.002, t, stepDur * m[1] * 0.9, 'sine', 0.025); // 온기 디튠
      }
      bgmSchedule.next += stepDur; bgmBeat++;
      continue;
    }
    const CH = (bgmBoss ? BGM_CHORDS_B : BGM_CHORDS)[bar];
    // 베이스 (움-파-파의 '움')
    if (pos === 0) bgmVoice(NOTE(CH[0]) / 2, t, stepDur * 2.6, bgmBoss ? 'sawtooth' : 'triangle', bgmBoss ? 0.075 : 0.095);
    if (pos === 3) bgmVoice(NOTE(CH[0]) / 2 * 1.5, t, stepDur * 1.6, 'triangle', 0.05); // 5도
    // 왈츠 코드 스탭 ('파-파')
    if (pos === 2 || pos === 4) {
      for (let v = 1; v < 4; v++) bgmVoice(NOTE(CH[v]), t, stepDur * 1.25, 'sine', 0.03);
    }
    // 멜로디 (따뜻한 트라이앵글) + 벨 더블링 (한 옥타브 위, 오르골 느낌)
    const m = BGM_MEL_AT.get(i);
    if (m) {
      const s = bgmBoss ? (BGM_MINOR[m[0]] !== undefined ? BGM_MINOR[m[0]] : m[0]) : m[0];
      const f = NOTE(s);
      bgmVoice(f, t, stepDur * m[1] * 0.95, 'triangle', 0.09);
      bgmVoice(f * 2.003, t, stepDur * m[1] * 0.55, 'sine', 0.032);
    }
    // 퍼커션: 낮은 쿵(다운비트) + 브러시 햇(왈츠 뒷박)
    if (pos === 0) {
      const o = AC.createOscillator(), gn = AC.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.08);
      gn.gain.setValueAtTime(bgmBoss ? 0.13 : 0.09, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      o.connect(gn); gn.connect(bgmGain); o.start(t); o.stop(t + 0.13);
    }
    if (pos === 2 || pos === 4) {
      const len = (AC.sampleRate * 0.04) | 0;
      const buf = AC.createBuffer(1, len, AC.sampleRate); const d = buf.getChannelData(0);
      for (let j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / len);
      const src = AC.createBufferSource(); src.buffer = buf;
      const hf = AC.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 5000;
      const gn = AC.createGain(); gn.gain.value = 0.045;
      src.connect(hf); hf.connect(gn); gn.connect(bgmGain); src.start(t);
    }
    bgmSchedule.next += stepDur; bgmBeat++;
  }
}
function bgmStart(mode) { // false=일반 true=보스 'story'=감동 발라드
  bgmCur = mode;
  bgmBoss = mode === true;
  if (!AC) return;
  if (!bgmTimer) {
    bgmSchedule.next = AC.currentTime + 0.05; bgmBeat = 0;
    bgmTimer = setInterval(bgmSchedule, 100);
  }
  bgmGain.gain.cancelScheduledValues(AC.currentTime);
  bgmGain.gain.setTargetAtTime(muted() ? 0 : 1, AC.currentTime, 0.4);
}
function bgmStop() {
  if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
  if (AC) bgmGain.gain.setTargetAtTime(0, AC.currentTime, 0.3);
}
function applyMute() {
  document.getElementById('muteBtn').textContent = muted() ? '🔇' : '🔊';
  if (AC && bgmTimer) bgmGain.gain.setTargetAtTime(muted() ? 0 : 1, AC.currentTime, 0.2);
}

/* ============================================================
   스프라이트 공장 (전부 벡터 드로잉, 2x 해상도)
   ============================================================ */
const SPR = {};
function mk(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w * 3; c.height = h * 3; // 3x 해상도 (픽사풍 선명도)
  const x = c.getContext('2d');
  x.scale(3, 3);
  x.lineJoin = 'round'; x.lineCap = 'round';
  fn(x, w, h);
  return c;
}
function rr(x, a, b, w, h, r) {
  x.beginPath();
  x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
}
/* 유자: 한복 소녀 (frame 0 idle/걷기1, 1 걷기2, 2 점프)
   form: 0 기본 · 1 유자열매 · 2 매운고추(불꽃) · 3 호랑이 부적(활강) */
const UJA_FORMS = [
  { jeog: '#fff6dc', jeogD: '#f0dcae', chima: '#f2688a', chimaD: '#cf4568', rib: '#ff8aa8', gorum: '#e8556a' },
  { jeog: '#ffd968', jeogD: '#efb83e', chima: '#e0344a', chimaD: '#b32038', rib: '#ff5d2e', gorum: '#c02020' },
  { jeog: '#ffb03c', jeogD: '#f0871a', chima: '#e83a20', chimaD: '#b8240e', rib: '#ffd34d', gorum: '#a01808', fire: 1 },
  { jeog: '#ffcf6e', jeogD: '#eda63a', chima: '#c8742a', chimaD: '#9c5616', rib: '#ff9a3c', gorum: '#8a4a10', tiger: 1 },
];
function drawUja(x, w, h, frame, form) {
  const F = UJA_FORMS[form] || UJA_FORMS[0];
  const legL = frame === 1 ? 3 : 0, legR = frame === 1 ? 0 : 3;
  const jump = frame === 2;
  const OUT = 'rgba(94,44,58,.5)';
  // 다리 (버선+꽃신)
  x.fillStyle = '#fff';
  x.fillRect(9, h - 8 - (jump ? 2 : legL), 4, 6);
  x.fillRect(17, h - 8 - (jump ? 2 : legR), 4, 6);
  x.fillStyle = '#c0392b';
  rr(x, 8, h - 4.6 - (jump ? 2 : legL), 6, 3.2, 1.4); x.fill();
  rr(x, 16, h - 4.6 - (jump ? 2 : legR), 6, 3.2, 1.4); x.fill();
  x.fillStyle = 'rgba(255,255,255,.5)';
  x.fillRect(9, h - 4 - (jump ? 2 : legL), 2, 1);
  x.fillRect(17, h - 4 - (jump ? 2 : legR), 2, 1);
  // 치마 (플레어 + 그라데이션 + 주름)
  const cg = x.createLinearGradient(0, 16, 0, h - 6);
  cg.addColorStop(0, F.chima); cg.addColorStop(1, F.chimaD);
  x.fillStyle = cg;
  x.beginPath();
  x.moveTo(10, 16); x.lineTo(20, 16);
  x.quadraticCurveTo(23 + (jump ? 2 : 0), 22, 24 + (jump ? 2 : 0), h - 6);
  x.lineTo(6 - (jump ? 2 : 0), h - 6);
  x.quadraticCurveTo(7 - (jump ? 2 : 0), 22, 10, 16);
  x.closePath(); x.fill();
  // 원통형 입체 오버레이 (좌측광)
  const cg2 = x.createLinearGradient(6, 0, 25, 0);
  cg2.addColorStop(0, 'rgba(255,255,255,.30)'); cg2.addColorStop(0.42, 'rgba(255,255,255,.05)');
  cg2.addColorStop(0.75, 'rgba(0,0,0,0)'); cg2.addColorStop(1, 'rgba(70,20,45,.30)');
  x.fillStyle = cg2; x.fill();
  x.strokeStyle = OUT; x.lineWidth = 1; x.stroke();
  x.strokeStyle = 'rgba(0,0,0,.14)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(13, 19); x.quadraticCurveTo(12, 24, 11, h - 7); x.stroke();
  x.beginPath(); x.moveTo(18, 19); x.quadraticCurveTo(19, 24, 20, h - 7); x.stroke();
  // 치맛단 장식
  if (F.fire) { // 불꽃 자락
    x.fillStyle = '#ffd34d';
    for (let k = 0; k < 4; k++) {
      x.beginPath(); x.moveTo(8 + k * 4.4, h - 6); x.lineTo(10 + k * 4.4, h - 10); x.lineTo(12 + k * 4.4, h - 6); x.closePath(); x.fill();
    }
  } else if (F.tiger) { // 호랑이 줄무늬
    x.strokeStyle = '#6a3808'; x.lineWidth = 1.8;
    x.beginPath(); x.moveTo(9, 22); x.lineTo(13, 24); x.stroke();
    x.beginPath(); x.moveTo(21, 22); x.lineTo(17, 24); x.stroke();
    x.beginPath(); x.moveTo(8, 27); x.lineTo(12, 29); x.stroke();
    x.beginPath(); x.moveTo(22, 27); x.lineTo(18, 29); x.stroke();
  } else {
    x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.3;
    x.beginPath(); x.moveTo(7, h - 7.6); x.lineTo(23, h - 7.6); x.stroke();
  }
  // 저고리 (그라데이션 + 윤곽)
  const jg = x.createLinearGradient(0, 12, 0, 20);
  jg.addColorStop(0, F.jeog); jg.addColorStop(1, F.jeogD);
  x.fillStyle = jg;
  rr(x, 8, 12, 14, 8, 3); x.fill();
  const jg2 = x.createLinearGradient(8, 0, 22, 0);
  jg2.addColorStop(0, 'rgba(255,255,255,.28)'); jg2.addColorStop(0.5, 'rgba(255,255,255,0)'); jg2.addColorStop(1, 'rgba(70,20,45,.18)');
  x.fillStyle = jg2; x.fill();
  x.strokeStyle = OUT; x.lineWidth = 0.9; x.stroke();
  // 동정(흰 깃) + 고름
  x.strokeStyle = '#fff'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(15, 13); x.lineTo(13, 18); x.stroke();
  x.beginPath(); x.moveTo(15, 13); x.lineTo(17, 18); x.stroke();
  x.strokeStyle = F.gorum; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(15, 17); x.lineTo(13, 21); x.stroke();
  x.beginPath(); x.moveTo(15, 17); x.lineTo(15.8, 20.4); x.stroke();
  // 팔 (소매 끝동)
  x.strokeStyle = F.jeog; x.lineWidth = 3.6;
  if (jump) {
    x.beginPath(); x.moveTo(9, 15); x.lineTo(4, 10); x.stroke();
    x.beginPath(); x.moveTo(21, 15); x.lineTo(26, 10); x.stroke();
    x.strokeStyle = F.gorum; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(5.2, 11.2); x.lineTo(4, 10); x.stroke();
    x.beginPath(); x.moveTo(24.8, 11.2); x.lineTo(26, 10); x.stroke();
    x.fillStyle = '#ffe3cd';
    x.beginPath(); x.arc(3.4, 9.4, 1.5, 0, 6.283); x.fill();
    x.beginPath(); x.arc(26.6, 9.4, 1.5, 0, 6.283); x.fill();
  } else {
    x.beginPath(); x.moveTo(9, 15); x.lineTo(6, 20); x.stroke();
    x.beginPath(); x.moveTo(21, 15); x.lineTo(24, 20); x.stroke();
    x.strokeStyle = F.gorum; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(6.6, 19); x.lineTo(6, 20); x.stroke();
    x.beginPath(); x.moveTo(23.4, 19); x.lineTo(24, 20); x.stroke();
    x.fillStyle = '#ffe3cd';
    x.beginPath(); x.arc(5.8, 21.2, 1.5, 0, 6.283); x.fill();
    x.beginPath(); x.arc(24.2, 21.2, 1.5, 0, 6.283); x.fill();
  }
  // 얼굴 (은은한 입체)
  const fg = x.createRadialGradient(12.8, 5.6, 1.5, 15, 8.4, 8.6);
  fg.addColorStop(0, '#fff8ee'); fg.addColorStop(0.55, '#ffe4c8'); fg.addColorStop(1, '#f2c09a');
  x.fillStyle = fg;
  x.beginPath(); x.arc(15, 8, 7, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,.45)'; // 이마 하이라이트
  x.beginPath(); x.ellipse(12.6, 5.4, 2.2, 1.2, -0.5, 0, 6.283); x.fill();
  // 머리(단발) + 앞머리 + 윤기
  const hg = x.createLinearGradient(0, 0, 0, 14);
  hg.addColorStop(0, '#3c2418'); hg.addColorStop(1, '#1d120c');
  x.fillStyle = hg;
  x.beginPath(); x.arc(15, 6.4, 7.2, Math.PI * 0.95, Math.PI * 2.05); x.fill();
  x.beginPath(); x.moveTo(7.8, 6); x.quadraticCurveTo(8, 13, 10, 14);
  x.lineTo(10.5, 8); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(22.2, 6); x.quadraticCurveTo(22, 13, 20, 14);
  x.lineTo(19.5, 8); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.38)'; x.lineWidth = 1.5;
  x.beginPath(); x.arc(14.4, 5.8, 5.2, Math.PI * 1.16, Math.PI * 1.6); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 0.8;
  x.beginPath(); x.arc(14.4, 6.2, 6.1, Math.PI * 1.2, Math.PI * 1.52); x.stroke();
  // 호랑이 후드 (귀)
  if (F.tiger) {
    x.fillStyle = '#f5a256';
    x.beginPath(); x.arc(15, 5.6, 7.6, Math.PI * 0.98, Math.PI * 2.02); x.fill();
    x.strokeStyle = '#6a3808'; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(11, 1.6); x.lineTo(12.6, 3.6); x.stroke();
    x.beginPath(); x.moveTo(15, 0.8); x.lineTo(15, 3); x.stroke();
    x.beginPath(); x.moveTo(19, 1.6); x.lineTo(17.4, 3.6); x.stroke();
    x.fillStyle = '#f5a256';
    x.beginPath(); x.arc(9.4, 1.8, 2.6, 0, 6.283); x.fill();
    x.beginPath(); x.arc(20.6, 1.8, 2.6, 0, 6.283); x.fill();
    x.fillStyle = '#fff0d8';
    x.beginPath(); x.arc(9.4, 1.8, 1.2, 0, 6.283); x.fill();
    x.beginPath(); x.arc(20.6, 1.8, 1.2, 0, 6.283); x.fill();
  }
  // 댕기 리본
  x.fillStyle = F.rib;
  x.beginPath(); x.arc(21.5, 3.6, 2.1, 0, 6.283); x.fill();
  x.beginPath(); x.arc(24.2, 5.2, 1.7, 0, 6.283); x.fill();
  x.strokeStyle = F.rib; x.lineWidth = 1.3;
  x.beginPath(); x.moveTo(24.6, 6.4); x.quadraticCurveTo(25.6, 9, 24.6, 11.4); x.stroke();
  // 눈 (홍채 그라데이션 + 반짝이 하이라이트 2개) + 속눈썹
  for (const ex0 of [12.3, 17.7]) {
    const eg = x.createRadialGradient(ex0 - 0.4, 7.7, 0.2, ex0, 8.5, 2.1);
    eg.addColorStop(0, '#6a4a34'); eg.addColorStop(0.55, '#33221a'); eg.addColorStop(1, '#100a07');
    x.fillStyle = eg;
    x.beginPath(); x.ellipse(ex0, 8.4, 1.65, 1.95, 0, 0, 6.283); x.fill();
  }
  x.strokeStyle = '#241a16'; x.lineWidth = 0.8;
  x.beginPath(); x.moveTo(10.5, 6.9); x.lineTo(11.3, 7.4); x.stroke();
  x.beginPath(); x.moveTo(19.5, 6.9); x.lineTo(18.7, 7.4); x.stroke();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(12.75, 7.7, 0.78, 0, 6.283); x.fill();
  x.beginPath(); x.arc(18.15, 7.7, 0.78, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,.85)';
  x.beginPath(); x.arc(11.75, 9.15, 0.4, 0, 6.283); x.fill();
  x.beginPath(); x.arc(17.15, 9.15, 0.4, 0, 6.283); x.fill();
  // 볼터치 (소프트 라디얼) + 입
  for (const bx0 of [10.5, 19.5]) {
    const bgr = x.createRadialGradient(bx0, 10.5, 0.2, bx0, 10.5, 1.9);
    bgr.addColorStop(0, 'rgba(255,105,122,.5)'); bgr.addColorStop(1, 'rgba(255,105,122,0)');
    x.fillStyle = bgr;
    x.beginPath(); x.ellipse(bx0, 10.5, 1.9, 1.4, 0, 0, 6.283); x.fill();
  }
  if (jump) {
    x.fillStyle = '#c0392b';
    x.beginPath(); x.ellipse(15, 11, 1.3, 1.6, 0, 0, 6.283); x.fill();
    x.fillStyle = '#ff8a8a';
    x.beginPath(); x.ellipse(15, 11.8, 0.8, 0.7, 0, 0, 6.283); x.fill();
  } else {
    x.strokeStyle = '#b0524a'; x.lineWidth = 1;
    x.beginPath(); x.arc(15, 10.4, 1.6, 0.25, Math.PI - 0.25); x.stroke();
  }
}
/* 처녀귀신 */
function drawGhost(x, w, h, frame) {
  const bob = frame ? 1 : 0;
  // 유령 오라 글로우
  const gl = x.createRadialGradient(14, 13 + bob, 3, 14, 13 + bob, 15);
  gl.addColorStop(0, 'rgba(185,215,255,.35)'); gl.addColorStop(1, 'rgba(185,215,255,0)');
  x.fillStyle = gl;
  x.beginPath(); x.arc(14, 13 + bob, 15, 0, 6.283); x.fill();
  const bodyg = x.createLinearGradient(0, bob, 0, h);
  bodyg.addColorStop(0, '#ffffff'); bodyg.addColorStop(0.55, '#eef3fb'); bodyg.addColorStop(1, '#c6d2e6');
  x.fillStyle = bodyg;
  x.beginPath();
  x.moveTo(5, 8 + bob); x.quadraticCurveTo(14, -2 + bob, 23, 8 + bob);
  x.lineTo(24, h - 4); x.quadraticCurveTo(19, h - 7, 14, h - 4);
  x.quadraticCurveTo(9, h - 7, 4, h - 4); x.closePath(); x.fill();
  // 긴 검은 머리
  x.fillStyle = '#1c1218';
  x.beginPath(); x.moveTo(6, 6 + bob); x.quadraticCurveTo(14, -3 + bob, 22, 6 + bob);
  x.lineTo(22, 16 + bob); x.lineTo(19, 9 + bob); x.lineTo(17, 13 + bob);
  x.lineTo(14, 6 + bob); x.lineTo(11, 13 + bob); x.lineTo(9, 9 + bob); x.lineTo(6, 16 + bob);
  x.closePath(); x.fill();
  // 창백한 얼굴 + 입술
  const fgh = x.createRadialGradient(12.8, 8.6 + bob, 1, 14, 10 + bob, 5.2);
  fgh.addColorStop(0, '#ffffff'); fgh.addColorStop(1, '#ddd4cc');
  x.fillStyle = fgh;
  x.beginPath(); x.arc(14, 10 + bob, 4.6, 0, 6.283); x.fill();
  x.fillStyle = '#1c1218';
  x.beginPath(); x.arc(12.4, 9.6 + bob, 0.9, 0, 6.283); x.fill();
  x.beginPath(); x.arc(15.6, 9.6 + bob, 0.9, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(12.7, 9.3 + bob, 0.32, 0, 6.283); x.fill();
  x.beginPath(); x.arc(15.9, 9.3 + bob, 0.32, 0, 6.283); x.fill();
  x.fillStyle = '#c0392b';
  x.beginPath(); x.arc(14, 12.4 + bob, 1, 0, 6.283); x.fill();
}
/* 저승사자 */
function drawReaper(x, w, h, frame) {
  const step = frame ? 1.4 : 0;
  // 도포 (입체 그라데이션)
  const rg2 = x.createLinearGradient(4, 12, 24, h);
  rg2.addColorStop(0, '#34344a'); rg2.addColorStop(0.5, '#1c1c28'); rg2.addColorStop(1, '#0c0c14');
  x.fillStyle = rg2;
  x.beginPath();
  x.moveTo(7, 12); x.lineTo(21, 12); x.lineTo(24, h - 2 - step); x.lineTo(4, h - 2 + step);
  x.closePath(); x.fill();
  // 얼굴
  const rf = x.createRadialGradient(12.8, 8.6, 1, 14, 10, 5.2);
  rf.addColorStop(0, '#eaf0f8'); rf.addColorStop(1, '#a8b2c0');
  x.fillStyle = rf;
  x.beginPath(); x.arc(14, 10, 4.6, 0, 6.283); x.fill();
  x.fillStyle = '#111';
  x.beginPath(); x.arc(12.4, 9.6, 0.9, 0, 6.283); x.fill();
  x.beginPath(); x.arc(15.8, 9.6, 0.9, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(12.7, 9.3, 0.3, 0, 6.283); x.fill();
  x.beginPath(); x.arc(16.1, 9.3, 0.3, 0, 6.283); x.fill();
  // 갓
  x.fillStyle = '#0c0c10';
  x.beginPath(); x.ellipse(14, 6, 10, 2.4, 0, 0, 6.283); x.fill();
  rr(x, 10, 0, 8, 6.4, 2); x.fill();
  x.strokeStyle = '#0c0c10'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(11, 8); x.lineTo(13, 13); x.stroke();
  x.beginPath(); x.moveTo(17, 8); x.lineTo(15, 13); x.stroke();
}
/* 갓 (등껍질 대체 슬라이드) */
function drawHat(x, w, h) {
  x.fillStyle = '#0c0c10';
  x.beginPath(); x.ellipse(13, h - 5, 12, 4, 0, 0, 6.283); x.fill();
  rr(x, 8, 2, 10, h - 8, 3); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 1.2;
  x.beginPath(); x.ellipse(13, h - 5, 9, 2.6, 0, Math.PI, Math.PI * 2); x.stroke();
}
/* 도깨비 */
function drawDokkaebi(x, w, h, frame) {
  const hop = frame ? -1.5 : 0;
  // 몸 (구형 볼륨)
  const dg = x.createRadialGradient(11, 10 + hop, 2, 14, 14 + hop, 10.5);
  dg.addColorStop(0, '#ff8a72'); dg.addColorStop(0.6, '#d95848'); dg.addColorStop(1, '#a03424');
  x.fillStyle = dg;
  x.beginPath(); x.arc(14, 14 + hop, 9, 0, 6.283); x.fill();
  // 호피 바지
  x.fillStyle = '#e8b34a';
  x.fillRect(7, 18 + hop, 14, 7);
  x.fillStyle = '#7a5218';
  x.fillRect(9, 19 + hop, 2.4, 2.4); x.fillRect(14, 21 + hop, 2.4, 2.4); x.fillRect(18, 19 + hop, 2.4, 2.4);
  // 다리
  x.fillStyle = '#d95848';
  x.fillRect(9, h - 6, 4, 5); x.fillRect(16, h - 6, 4, 5);
  // 뿔 + 곱슬머리
  x.fillStyle = '#f5e6c8';
  x.beginPath(); x.moveTo(14, 1 + hop); x.lineTo(12, 6 + hop); x.lineTo(16, 6 + hop); x.closePath(); x.fill();
  x.fillStyle = '#7a3428';
  x.beginPath(); x.arc(10, 7 + hop, 2.4, 0, 6.283); x.arc(14, 6 + hop, 2.6, 0, 6.283); x.arc(18, 7 + hop, 2.4, 0, 6.283); x.fill();
  // 얼굴
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(11, 12 + hop, 1.6, 0, 6.283); x.fill();
  x.beginPath(); x.arc(17, 12 + hop, 1.6, 0, 6.283); x.fill();
  x.fillStyle = '#241a16';
  x.beginPath(); x.arc(11.3, 12.3 + hop, 0.8, 0, 6.283); x.fill();
  x.beginPath(); x.arc(17.3, 12.3 + hop, 0.8, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(11.55, 12.05 + hop, 0.32, 0, 6.283); x.fill();
  x.beginPath(); x.arc(17.55, 12.05 + hop, 0.32, 0, 6.283); x.fill();
  x.strokeStyle = '#fff'; x.lineWidth = 1.4;
  x.beginPath(); x.arc(14, 15.6 + hop, 2.6, 0.15, Math.PI - 0.15); x.stroke(); // 씩 웃음+이빨
  // 방망이
  x.fillStyle = '#8a6a3a';
  x.save(); x.translate(23, 12 + hop); x.rotate(0.5);
  rr(x, -2, -9, 4.6, 12, 2); x.fill();
  x.fillStyle = '#6a4a24';
  x.beginPath(); x.arc(-0.5, -7, 0.8, 0, 6.283); x.arc(1.4, -3.4, 0.8, 0, 6.283); x.fill();
  x.restore();
}
/* 달걀귀신 (얼굴 없는 달걀) */
function drawEgg(x, w, h, frame) {
  const bob = frame ? 1.2 : 0;
  x.fillStyle = 'rgba(200,210,230,.4)';
  x.beginPath(); x.ellipse(13, h / 2 + bob + 4, 11, 12, 0, 0, 6.283); x.fill();
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#fbf6ee'); g.addColorStop(1, '#d8ccc0');
  x.fillStyle = g;
  x.beginPath(); x.ellipse(13, h / 2 + bob, 9, 12, 0, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,.5)';
  x.beginPath(); x.ellipse(10, h / 2 - 5 + bob, 2.6, 4, -0.4, 0, 6.283); x.fill();
}
/* 구미호 */
function drawFox(x, w, h, frame) {
  const step = frame ? 1.4 : -1.4;
  // 꼬리 아홉 갈래 부채
  x.fillStyle = '#f5a256';
  for (let i = -2; i <= 2; i++) {
    x.save(); x.translate(26, 14); x.rotate(-0.5 + i * 0.3);
    x.beginPath(); x.ellipse(6, 0, 7, 2.6, 0, 0, 6.283); x.fill();
    x.restore();
  }
  x.fillStyle = '#fff';
  for (let i = -2; i <= 2; i++) {
    x.save(); x.translate(26, 14); x.rotate(-0.5 + i * 0.3);
    x.beginPath(); x.ellipse(11, 0, 2.2, 1.4, 0, 0, 6.283); x.fill();
    x.restore();
  }
  // 몸 (볼륨 그라데이션)
  const fxg = x.createLinearGradient(0, 10, 0, 24);
  fxg.addColorStop(0, '#ffbe74'); fxg.addColorStop(1, '#e0862f');
  x.fillStyle = fxg;
  rr(x, 6, 12, 20, 10, 5); x.fill();
  // 다리
  x.fillRect(9, 20 + Math.max(0, step), 3.4, 6 - Math.max(0, step));
  x.fillRect(19, 20 + Math.max(0, -step), 3.4, 6 - Math.max(0, -step));
  // 머리
  const fxh = x.createRadialGradient(6, 7.5, 1, 8, 10, 7.2);
  fxh.addColorStop(0, '#ffc684'); fxh.addColorStop(1, '#e0862f');
  x.fillStyle = fxh;
  x.beginPath(); x.arc(8, 10, 6.4, 0, 6.283); x.fill();
  // 귀
  x.beginPath(); x.moveTo(3.4, 6); x.lineTo(5, 0.6); x.lineTo(8, 5); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(12.6, 6); x.lineTo(11, 0.6); x.lineTo(8, 5); x.closePath(); x.fill();
  // 흰 주둥이 + 눈
  x.fillStyle = '#fff';
  x.beginPath(); x.ellipse(6, 12.4, 3.6, 2.6, 0, 0, 6.283); x.fill();
  x.fillStyle = '#241a16';
  x.beginPath(); x.arc(3.6, 12, 0.9, 0, 6.283); x.fill();
  x.beginPath(); x.arc(5.6, 9, 1, 0, 6.283); x.fill();
  x.beginPath(); x.arc(10, 9, 1, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(5.9, 8.65, 0.35, 0, 6.283); x.fill();
  x.beginPath(); x.arc(10.3, 8.65, 0.35, 0, 6.283); x.fill();
}
/* 유니콘 '유니' */
function drawUnicorn(x, w, h, frame) {
  const step = frame ? 2 : -2;
  // 다리 (발굽)
  x.fillStyle = '#f6f2f8';
  x.fillRect(8, 20 + Math.max(0, step), 4, 10 - Math.max(0, step));
  x.fillRect(24, 20 + Math.max(0, -step), 4, 10 - Math.max(0, -step));
  x.fillRect(13, 21 + Math.max(0, -step), 4, 9 - Math.max(0, -step));
  x.fillRect(19, 21 + Math.max(0, step), 4, 9 - Math.max(0, step));
  x.fillStyle = '#d8c8ea';
  x.fillRect(8, 28 + Math.max(0, step) - Math.max(0, step), 4, 2);
  x.fillRect(24, 28, 4, 2); x.fillRect(13, 28, 4, 2); x.fillRect(19, 28, 4, 2);
  // 꼬리 (무지개 3색)
  x.strokeStyle = '#ff9cc8'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(29, 15); x.quadraticCurveTo(35, 17, 33, 24); x.stroke();
  x.strokeStyle = '#c883f0'; x.lineWidth = 1.8;
  x.beginPath(); x.moveTo(29.5, 16); x.quadraticCurveTo(34, 18, 32.5, 23); x.stroke();
  x.strokeStyle = '#7ae0f0'; x.lineWidth = 1.1;
  x.beginPath(); x.moveTo(29, 17); x.quadraticCurveTo(33, 19, 31.8, 22.6); x.stroke();
  // 몸 (입체 그라데이션)
  const bg2 = x.createLinearGradient(0, 12, 0, 23);
  bg2.addColorStop(0, '#ffffff'); bg2.addColorStop(1, '#e2d6f0');
  x.fillStyle = bg2;
  rr(x, 6, 12, 24, 11, 6); x.fill();
  x.strokeStyle = 'rgba(150,120,180,.4)'; x.lineWidth = 0.9;
  rr(x, 6, 12, 24, 11, 6); x.stroke();
  const ub = x.createLinearGradient(0, 12, 0, 23);
  ub.addColorStop(0, 'rgba(255,255,255,.4)'); ub.addColorStop(0.5, 'rgba(255,255,255,0)'); ub.addColorStop(1, 'rgba(120,90,150,.2)');
  x.fillStyle = ub;
  rr(x, 6, 12, 24, 11, 6); x.fill();
  // 목+머리
  x.fillStyle = '#f8f4fc';
  x.beginPath(); x.moveTo(8, 14); x.lineTo(4, 4); x.lineTo(12, 8); x.closePath(); x.fill();
  x.beginPath(); x.ellipse(5.4, 5, 5, 3.6, -0.3, 0, 6.283); x.fill();
  // 갈기 (무지개)
  x.fillStyle = '#ff9cc8';
  x.beginPath(); x.arc(8.6, 3.4, 2.3, 0, 6.283); x.fill();
  x.fillStyle = '#c883f0';
  x.beginPath(); x.arc(10.4, 6.4, 2.3, 0, 6.283); x.fill();
  x.fillStyle = '#7ae0f0';
  x.beginPath(); x.arc(11.6, 9.8, 2.3, 0, 6.283); x.fill();
  // 뿔 (금색 그라데이션)
  const hg2 = x.createLinearGradient(-1, -3, 5, 3);
  hg2.addColorStop(0, '#fff0b0'); hg2.addColorStop(1, '#f0b830');
  x.fillStyle = hg2;
  x.beginPath(); x.moveTo(3.4, 2.6); x.lineTo(-0.8, -2.8); x.lineTo(5.4, 0.6); x.closePath(); x.fill();
  // 눈 (하이라이트+속눈썹) + 볼 + 코
  x.fillStyle = '#241a16';
  x.beginPath(); x.ellipse(3.6, 4.6, 1.1, 1.3, 0, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(3.9, 4.2, 0.45, 0, 6.283); x.fill();
  x.strokeStyle = '#241a16'; x.lineWidth = 0.7;
  x.beginPath(); x.moveTo(2.2, 3.2); x.lineTo(2.9, 3.7); x.stroke();
  x.fillStyle = 'rgba(255,150,170,.5)';
  x.beginPath(); x.ellipse(2.2, 6.6, 1.2, 0.8, 0, 0, 6.283); x.fill();
  x.fillStyle = '#f0b8c8';
  x.beginPath(); x.arc(0.8, 6, 1, 0, 6.283); x.fill();
  // 안장 (색동)
  x.fillStyle = '#e8556a'; rr(x, 14, 11, 9, 5, 2); x.fill();
  x.fillStyle = '#4aa8d8'; x.fillRect(14, 13, 9, 1.4);
  x.fillStyle = '#ffd34d'; x.fillRect(14, 14.6, 9, 1.2);
}
/* 쪼쪼(JJOJJO) 여왕 보스: 아름다운 여왕 + 황금 기관총
   frame 0/1 걷기(드레스 흔들림), 2 발사(총구 화염) */
function drawJjojjo(x, w, h, frame) {
  const sway = frame === 1 ? 2 : 0;
  const firing = frame === 2;
  const cxm = w / 2 - 4; // 몸 중심 (오른쪽에 총 공간)
  // 긴 흑발 (뒤로 흐르는)
  const hgr = x.createLinearGradient(0, 4, 0, h);
  hgr.addColorStop(0, '#2c1a2e'); hgr.addColorStop(1, '#120a16');
  x.fillStyle = hgr;
  x.beginPath();
  x.moveTo(cxm - 9, 8); x.quadraticCurveTo(cxm - 15, 24 + sway, cxm - 12, h - 8);
  x.quadraticCurveTo(cxm - 8, h - 4, cxm - 6, h - 10);
  x.lineTo(cxm - 6, 16); x.closePath(); x.fill();
  x.beginPath();
  x.moveTo(cxm + 9, 8); x.quadraticCurveTo(cxm + 14, 22 - sway, cxm + 11, h - 12);
  x.quadraticCurveTo(cxm + 8, h - 8, cxm + 6, h - 12);
  x.lineTo(cxm + 6, 16); x.closePath(); x.fill();
  // 드레스 (보라→금 대례복)
  const dg = x.createLinearGradient(0, 20, 0, h - 2);
  dg.addColorStop(0, '#7a2a8e'); dg.addColorStop(0.75, '#5a1a6e'); dg.addColorStop(1, '#42104e');
  x.fillStyle = dg;
  x.beginPath();
  x.moveTo(cxm - 7, 22); x.lineTo(cxm + 7, 22);
  x.quadraticCurveTo(cxm + 13 + sway, h * 0.6, cxm + 15 + sway, h - 2);
  x.lineTo(cxm - 15 - sway, h - 2);
  x.quadraticCurveTo(cxm - 13 - sway, h * 0.6, cxm - 7, 22);
  x.closePath(); x.fill();
  const dv = x.createLinearGradient(cxm - 15, 0, cxm + 15, 0);
  dv.addColorStop(0, 'rgba(255,255,255,.2)'); dv.addColorStop(0.5, 'rgba(255,255,255,0)'); dv.addColorStop(1, 'rgba(15,4,25,.3)');
  x.fillStyle = dv; x.fill();
  // 금 자수 무늬 + 치맛단
  x.strokeStyle = '#ffd34d'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(cxm - 13 - sway, h - 5); x.lineTo(cxm + 13 + sway, h - 5); x.stroke();
  x.lineWidth = 1;
  x.beginPath(); x.moveTo(cxm - 10, h - 9); x.lineTo(cxm + 10, h - 9); x.stroke();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(cxm, 27, 1.6, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm - 4, 32, 1.2, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm + 4, 32, 1.2, 0, 6.283); x.fill();
  // 허리 금띠
  x.fillStyle = '#ffd34d'; x.fillRect(cxm - 7, 23, 14, 2.6);
  // 팔 + 황금 기관총 (개틀링)
  x.strokeStyle = '#6a2280'; x.lineWidth = 5;
  x.beginPath(); x.moveTo(cxm + 5, 24); x.lineTo(cxm + 11, 30); x.stroke();
  x.beginPath(); x.moveTo(cxm - 5, 24); x.lineTo(cxm + 2, 31); x.stroke();
  x.fillStyle = '#eec89a';
  x.beginPath(); x.arc(cxm + 11.5, 31, 2.2, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm + 2.5, 32, 2.2, 0, 6.283); x.fill();
  // 총몸
  const gg2 = x.createLinearGradient(0, 27, 0, 35);
  gg2.addColorStop(0, '#ffe082'); gg2.addColorStop(1, '#c89020');
  x.fillStyle = gg2;
  rr(x, cxm + 2, 27.5, 15, 7, 2.4); x.fill();
  x.strokeStyle = '#8a5a10'; x.lineWidth = 1; rr(x, cxm + 2, 27.5, 15, 7, 2.4); x.stroke();
  // 3연장 총열
  x.fillStyle = '#d8a838';
  x.fillRect(cxm + 16, 28, 8, 1.8);
  x.fillRect(cxm + 16, 30.6, 9.5, 1.8);
  x.fillRect(cxm + 16, 33.2, 8, 1.8);
  x.fillStyle = '#8a5a10';
  x.fillRect(cxm + 23.5, 27.7, 1.6, 7.8);
  // 탄창 (봉황 문양 원형)
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(cxm + 8, 36.5, 3.4, 0, 6.283); x.fill();
  x.strokeStyle = '#8a5a10'; x.lineWidth = 1;
  x.beginPath(); x.arc(cxm + 8, 36.5, 3.4, 0, 6.283); x.stroke();
  x.beginPath(); x.arc(cxm + 8, 36.5, 1.4, 0, 6.283); x.stroke();
  // 총구 화염
  if (firing) {
    x.fillStyle = '#fff0b0';
    x.beginPath(); x.moveTo(cxm + 25.5, 31.5); x.lineTo(cxm + 32, 28.5); x.lineTo(cxm + 29.5, 31.5); x.lineTo(cxm + 32, 34.5); x.closePath(); x.fill();
    x.fillStyle = '#ffab2e';
    x.beginPath(); x.arc(cxm + 26.5, 31.5, 2.4, 0, 6.283); x.fill();
  }
  // 얼굴 (갸름한 미인형)
  const fgr = x.createRadialGradient(cxm - 2, 12, 2, cxm, 14, 9);
  fgr.addColorStop(0, '#fff4e8'); fgr.addColorStop(1, '#f8dcc4');
  x.fillStyle = fgr;
  x.beginPath(); x.ellipse(cxm, 14, 7.4, 8.2, 0, 0, 6.283); x.fill();
  // 앞머리 (가르마)
  x.fillStyle = '#241428';
  x.beginPath(); x.moveTo(cxm - 7.4, 12);
  x.quadraticCurveTo(cxm - 7, 4.6, cxm, 4.4);
  x.quadraticCurveTo(cxm + 7, 4.6, cxm + 7.4, 12);
  x.quadraticCurveTo(cxm + 5, 7.6, cxm + 1.2, 7.2);
  x.quadraticCurveTo(cxm - 5, 7.6, cxm - 7.4, 12);
  x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 1;
  x.beginPath(); x.arc(cxm - 2, 6.6, 4.4, Math.PI * 1.1, Math.PI * 1.5); x.stroke();
  // 봉황 금 화관 + 비녀
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.moveTo(cxm - 6, 4); x.lineTo(cxm - 4, -1); x.lineTo(cxm - 2, 3);
  x.lineTo(cxm, -2.6); x.lineTo(cxm + 2, 3); x.lineTo(cxm + 4, -1); x.lineTo(cxm + 6, 4);
  x.closePath(); x.fill();
  x.fillStyle = '#e8556a';
  x.beginPath(); x.arc(cxm, 1.4, 1.3, 0, 6.283); x.fill();
  x.fillStyle = '#7ae0f0';
  x.beginPath(); x.arc(cxm - 4, 2.2, 0.9, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm + 4, 2.2, 0.9, 0, 6.283); x.fill();
  x.strokeStyle = '#ffd34d'; x.lineWidth = 1.4;
  x.beginPath(); x.moveTo(cxm + 7, 6.4); x.lineTo(cxm + 12, 4.4); x.stroke();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(cxm + 12.6, 4.2, 1.4, 0, 6.283); x.fill();
  // 눈 (또렷한 미녀 눈매 + 속눈썹) — 화날수록 애니는 게임에서 처리
  x.fillStyle = '#2c1a1e';
  x.beginPath(); x.ellipse(cxm - 3.2, 13.4, 1.5, 1.9, 0, 0, 6.283); x.fill();
  x.beginPath(); x.ellipse(cxm + 3.2, 13.4, 1.5, 1.9, 0, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(cxm - 2.7, 12.7, 0.72, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm + 3.7, 12.7, 0.72, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,.8)';
  x.beginPath(); x.arc(cxm - 3.6, 14.2, 0.32, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm + 2.8, 14.2, 0.32, 0, 6.283); x.fill();
  x.strokeStyle = '#2c1a1e'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(cxm - 5.4, 11.2); x.lineTo(cxm - 1.6, 11.4); x.stroke();
  x.beginPath(); x.moveTo(cxm + 5.4, 11.2); x.lineTo(cxm + 1.6, 11.4); x.stroke();
  x.lineWidth = 0.8;
  x.beginPath(); x.moveTo(cxm - 5.2, 12.6); x.lineTo(cxm - 6, 12.2); x.stroke();
  x.beginPath(); x.moveTo(cxm + 5.2, 12.6); x.lineTo(cxm + 6, 12.2); x.stroke();
  // 볼터치 + 붉은 입술 + 이마 곤지
  x.fillStyle = 'rgba(255,120,140,.35)';
  x.beginPath(); x.ellipse(cxm - 5, 16.4, 1.6, 1, 0, 0, 6.283); x.fill();
  x.beginPath(); x.ellipse(cxm + 5, 16.4, 1.6, 1, 0, 0, 6.283); x.fill();
  x.fillStyle = '#d8203a';
  x.beginPath(); x.ellipse(cxm, 18.6, 2, 1.2, 0, 0, 6.283); x.fill();
  x.fillStyle = '#ff7a8a';
  x.beginPath(); x.ellipse(cxm - 0.6, 18.2, 0.8, 0.5, 0, 0, 6.283); x.fill();
  x.fillStyle = '#e8556a';
  x.beginPath(); x.arc(cxm, 9.4, 0.8, 0, 6.283); x.fill();
}
/* 기관총탄 (금색 탄환 + 분홍 궤적) */
function drawBullet(x, w, h) {
  x.strokeStyle = 'rgba(255,150,190,.55)'; x.lineWidth = 2.4;
  x.beginPath(); x.moveTo(1, h / 2); x.lineTo(w * 0.55, h / 2); x.stroke();
  const g = x.createLinearGradient(w * 0.4, 0, w, 0);
  g.addColorStop(0, '#c89020'); g.addColorStop(1, '#ffe082');
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(w * 0.4, h / 2 - 2.4); x.lineTo(w - 3, h / 2 - 2.4);
  x.arc(w - 3, h / 2, 2.4, -Math.PI / 2, Math.PI / 2);
  x.lineTo(w * 0.4, h / 2 + 2.4); x.closePath(); x.fill();
  x.fillStyle = 'rgba(255,255,255,.6)';
  x.fillRect(w * 0.45, h / 2 - 1.7, w * 0.3, 1);
}
/* 대포알 (탱크 포탄, 도화선 불꽃) */
function drawShell(x, w, h) {
  const g = x.createRadialGradient(w / 2 - 2, h / 2 - 2, 1, w / 2, h / 2, w / 2);
  g.addColorStop(0, '#5a5e6e'); g.addColorStop(1, '#1a1c24');
  x.fillStyle = g;
  x.beginPath(); x.arc(w / 2, h / 2 + 1, w / 2 - 1, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,.35)';
  x.beginPath(); x.arc(w / 2 - 2.4, h / 2 - 1.6, 1.6, 0, 6.283); x.fill();
  // 도화선 + 불티
  x.strokeStyle = '#8a6a3a'; x.lineWidth = 1.4;
  x.beginPath(); x.moveTo(w / 2 + 3, 3); x.quadraticCurveTo(w / 2 + 6, 1, w / 2 + 5, -1); x.stroke();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(w / 2 + 5, -1.4, 1.8, 0, 6.283); x.fill();
  x.fillStyle = '#ff8a2e';
  x.beginPath(); x.arc(w / 2 + 5, -1.4, 1, 0, 6.283); x.fill();
}
/* 쪼쪼 전차 (탱크 탄 쪼쪼 · 최종보스) frame 0/1 궤도 회전, 2 포격 */
function drawJjojjoTank(x, w, h, frame) {
  const roll = frame === 1 ? 1 : 0;
  const firing = frame === 2;
  // 궤도 (캐터필러)
  x.fillStyle = '#1c1e26';
  rr(x, 4, h - 20, w - 8, 18, 9); x.fill();
  x.fillStyle = '#3a3e4c';
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(12 + i * ((w - 24) / 5), h - 11, 5.6, 0, 6.283); x.fill(); }
  x.strokeStyle = '#54596a'; x.lineWidth = 2.4;
  for (let i = 0; i < 9; i++) { const tx = 8 + ((i * 6 + roll * 3) % (w - 16)); x.beginPath(); x.moveTo(tx, h - 19); x.lineTo(tx, h - 3); x.stroke(); }
  x.fillStyle = '#7a8090';
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(12 + i * ((w - 24) / 5), h - 11, 1.6, 0, 6.283); x.fill(); }
  // 차체
  const bg = x.createLinearGradient(0, h - 34, 0, h - 18);
  bg.addColorStop(0, '#5c6272'); bg.addColorStop(1, '#3c4050');
  x.fillStyle = bg;
  rr(x, 8, h - 34, w - 16, 16, 4); x.fill();
  x.strokeStyle = '#2a2e3a'; x.lineWidth = 1.4; rr(x, 8, h - 34, w - 16, 16, 4); x.stroke();
  x.fillStyle = '#c89020'; x.fillRect(10, h - 33, w - 20, 2); // 금 몰딩
  // 포탑 + 포신 (전방)
  x.fillStyle = '#4a4e5e';
  rr(x, w / 2 - 12, h - 44, 24, 12, 4); x.fill();
  const gunY = h - 39;
  const gb2 = x.createLinearGradient(0, gunY - 2.4, 0, gunY + 3.2);
  gb2.addColorStop(0, '#6e7484'); gb2.addColorStop(0.5, '#3a3e4c'); gb2.addColorStop(1, '#22252e');
  x.fillStyle = gb2;
  x.fillRect(w / 2 + 8, gunY - 2.4, 26, 5.4);
  x.fillStyle = '#2a2e38';
  x.fillRect(w / 2 + 31, gunY - 3.2, 4, 7); // 포구
  if (firing) {
    x.fillStyle = '#fff0b0';
    x.beginPath(); x.moveTo(w / 2 + 35, gunY); x.lineTo(w / 2 + 46, gunY - 5); x.lineTo(w / 2 + 42, gunY); x.lineTo(w / 2 + 46, gunY + 5); x.closePath(); x.fill();
    x.fillStyle = '#ffab2e';
    x.beginPath(); x.arc(w / 2 + 36, gunY, 3.2, 0, 6.283); x.fill();
  }
  // 쪼쪼 여왕 (포탑 위 상반신) — drawJjojjo 상반신 축소 재현
  const cxm = w / 2 - 4, topY = h - 44;
  x.save(); x.translate(0, topY - 30); // 상반신을 포탑 위로
  // 긴 흑발
  x.fillStyle = '#1c1020';
  x.beginPath(); x.moveTo(cxm - 8, 14); x.quadraticCurveTo(cxm - 12, 26, cxm - 9, 33); x.lineTo(cxm - 5, 30); x.lineTo(cxm - 5, 16); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(cxm + 8, 14); x.quadraticCurveTo(cxm + 12, 26, cxm + 9, 33); x.lineTo(cxm + 5, 30); x.lineTo(cxm + 5, 16); x.closePath(); x.fill();
  // 드레스 상의
  const dg = x.createLinearGradient(0, 20, 0, 34);
  dg.addColorStop(0, '#7a2a8e'); dg.addColorStop(1, '#4a125a');
  x.fillStyle = dg;
  x.beginPath(); x.moveTo(cxm - 7, 22); x.lineTo(cxm + 7, 22); x.lineTo(cxm + 10, 34); x.lineTo(cxm - 10, 34); x.closePath(); x.fill();
  x.fillStyle = '#ffd34d'; x.fillRect(cxm - 7, 22.5, 14, 2);
  // 얼굴
  const fg = x.createRadialGradient(cxm - 2, 12, 2, cxm, 14, 8);
  fg.addColorStop(0, '#fff4e8'); fg.addColorStop(1, '#f8dcc4');
  x.fillStyle = fg;
  x.beginPath(); x.ellipse(cxm, 14, 6.6, 7.4, 0, 0, 6.283); x.fill();
  x.fillStyle = '#241428';
  x.beginPath(); x.moveTo(cxm - 6.6, 12); x.quadraticCurveTo(cxm, 4.6, cxm + 6.6, 12); x.quadraticCurveTo(cxm + 3, 8, cxm, 7.6); x.quadraticCurveTo(cxm - 3, 8, cxm - 6.6, 12); x.closePath(); x.fill();
  // 봉황 금관
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.moveTo(cxm - 5, 5); x.lineTo(cxm - 3, 0.6); x.lineTo(cxm, 4); x.lineTo(cxm + 3, 0.6); x.lineTo(cxm + 5, 5); x.closePath(); x.fill();
  x.fillStyle = '#e8556a'; x.beginPath(); x.arc(cxm, 2.6, 1.1, 0, 6.283); x.fill();
  // 눈 + 입술
  x.fillStyle = '#2c1a1e';
  x.beginPath(); x.ellipse(cxm - 2.8, 13.4, 1.3, 1.7, 0, 0, 6.283); x.fill();
  x.beginPath(); x.ellipse(cxm + 2.8, 13.4, 1.3, 1.7, 0, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(cxm - 2.4, 12.9, 0.5, 0, 6.283); x.fill();
  x.beginPath(); x.arc(cxm + 3.2, 12.9, 0.5, 0, 6.283); x.fill();
  x.fillStyle = '#d8203a';
  x.beginPath(); x.ellipse(cxm, 18, 1.7, 1, 0, 0, 6.283); x.fill();
  // 조종간 잡은 팔
  x.strokeStyle = '#6a2280'; x.lineWidth = 3.2;
  x.beginPath(); x.moveTo(cxm + 5, 24); x.lineTo(cxm + 10, 30); x.stroke();
  x.fillStyle = '#eec89a'; x.beginPath(); x.arc(cxm + 10.5, 30.5, 1.8, 0, 6.283); x.fill();
  x.restore();
}
/* 유자 불꽃 (파이어볼) */
function drawFireball(x, w, h) {
  const g = x.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
  g.addColorStop(0, '#fff6c8'); g.addColorStop(0.45, '#ffab2e'); g.addColorStop(0.85, '#f0561e'); g.addColorStop(1, 'rgba(240,86,30,0)');
  x.fillStyle = g;
  x.beginPath(); x.arc(w / 2, h / 2, w / 2, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(w / 2 - 1.4, h / 2 - 1.4, 1.8, 0, 6.283); x.fill();
}
/* 매운 고추 (불꽃 파워업) */
function drawPepper(x, w, h) {
  x.save(); x.translate(w / 2, h / 2); x.rotate(0.35);
  const g = x.createLinearGradient(-4, -8, 5, 8);
  g.addColorStop(0, '#ff5d3c'); g.addColorStop(1, '#c81e10');
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(0, -7); x.quadraticCurveTo(6.5, -3, 5, 4);
  x.quadraticCurveTo(4, 9.5, 0, 10);
  x.quadraticCurveTo(-2.6, 9.5, -2.4, 5);
  x.quadraticCurveTo(-2.6, -3, 0, -7);
  x.closePath(); x.fill();
  x.fillStyle = 'rgba(255,255,255,.45)';
  x.beginPath(); x.ellipse(2.2, -1.5, 1.2, 3.4, 0.2, 0, 6.283); x.fill();
  x.fillStyle = '#4a8a2a';
  x.beginPath(); x.moveTo(-1.8, -6.6); x.quadraticCurveTo(0, -9.5, 2.4, -8.4); x.quadraticCurveTo(0.6, -6.4, -1.8, -6.6); x.closePath(); x.fill();
  x.strokeStyle = '#3a6a1e'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(0, -8); x.quadraticCurveTo(1.4, -10.6, 3.4, -10.8); x.stroke();
  x.restore();
}
/* 호랑이 부적 (활강 파워업) — 귀여운 호랑이 얼굴 */
function drawTigerCharm(x, w, h) {
  x.fillStyle = '#f5a256';
  x.beginPath(); x.arc(w / 2 - 5.6, h / 2 - 6, 3, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 5.6, h / 2 - 6, 3, 0, 6.283); x.fill();
  x.fillStyle = '#fff0d8';
  x.beginPath(); x.arc(w / 2 - 5.6, h / 2 - 6, 1.4, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 5.6, h / 2 - 6, 1.4, 0, 6.283); x.fill();
  const g = x.createRadialGradient(w / 2 - 2, h / 2 - 2, 2, w / 2, h / 2, 9);
  g.addColorStop(0, '#ffc078'); g.addColorStop(1, '#ef8f3c');
  x.fillStyle = g;
  x.beginPath(); x.arc(w / 2, h / 2, 8.4, 0, 6.283); x.fill();
  // 줄무늬 + 이마 王
  x.strokeStyle = '#6a3808'; x.lineWidth = 1.4;
  x.beginPath(); x.moveTo(w / 2 - 8, h / 2 - 2); x.lineTo(w / 2 - 5.4, h / 2 - 1); x.stroke();
  x.beginPath(); x.moveTo(w / 2 + 8, h / 2 - 2); x.lineTo(w / 2 + 5.4, h / 2 - 1); x.stroke();
  x.lineWidth = 1.1;
  x.beginPath(); x.moveTo(w / 2 - 2, h / 2 - 6.4); x.lineTo(w / 2 + 2, h / 2 - 6.4); x.stroke();
  x.beginPath(); x.moveTo(w / 2, h / 2 - 7.4); x.lineTo(w / 2, h / 2 - 4.4); x.stroke();
  x.beginPath(); x.moveTo(w / 2 - 1.6, h / 2 - 4.4); x.lineTo(w / 2 + 1.6, h / 2 - 4.4); x.stroke();
  // 흰 주둥이 + 눈코입
  x.fillStyle = '#fff6ea';
  x.beginPath(); x.ellipse(w / 2, h / 2 + 3.4, 4, 3, 0, 0, 6.283); x.fill();
  x.fillStyle = '#241a16';
  x.beginPath(); x.arc(w / 2 - 3, h / 2 - 0.6, 1.1, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 3, h / 2 - 0.6, 1.1, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(w / 2 - 2.7, h / 2 - 1, 0.4, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 3.3, h / 2 - 1, 0.4, 0, 6.283); x.fill();
  x.fillStyle = '#c05a3a';
  x.beginPath(); x.arc(w / 2, h / 2 + 2.2, 1, 0, 6.283); x.fill();
  x.strokeStyle = '#8a5a3a'; x.lineWidth = 0.9;
  x.beginPath(); x.arc(w / 2 - 1.4, h / 2 + 4, 1.2, 0.2, Math.PI - 0.6); x.stroke();
  x.beginPath(); x.arc(w / 2 + 1.4, h / 2 + 4, 1.2, 0.4, Math.PI - 0.2); x.stroke();
}
/* 꽃 (배경 장식, v 0/1 색 변형) */
function drawFlower(x, w, h, v) {
  const pet = v ? '#ffb0c8' : '#ffd34d', core = v ? '#ffe28a' : '#f0871a';
  x.strokeStyle = '#5a9a3e'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(w / 2, h); x.quadraticCurveTo(w / 2 + 1.4, h - 5, w / 2, h - 8); x.stroke();
  x.fillStyle = '#6fae4e';
  x.beginPath(); x.ellipse(w / 2 + 3, h - 4, 2.6, 1.2, -0.5, 0, 6.283); x.fill();
  x.fillStyle = pet;
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * 6.283 - 1.57;
    x.beginPath(); x.ellipse(w / 2 + Math.cos(a) * 3.2, h - 8 + Math.sin(a) * 3.2, 2.4, 2.4, 0, 0, 6.283); x.fill();
  }
  x.fillStyle = core;
  x.beginPath(); x.arc(w / 2, h - 8, 2, 0, 6.283); x.fill();
}
/* 풀숲 (배경 장식) */
function drawGrassTuft(x, w, h) {
  x.strokeStyle = '#5e9e42'; x.lineWidth = 1.8;
  x.beginPath(); x.moveTo(w / 2, h); x.quadraticCurveTo(w / 2 - 1, h - 5, w / 2 - 3, h - 9); x.stroke();
  x.beginPath(); x.moveTo(w / 2 - 3.4, h); x.quadraticCurveTo(w / 2 - 4.4, h - 4, w / 2 - 6.4, h - 6.6); x.stroke();
  x.strokeStyle = '#78bc56';
  x.beginPath(); x.moveTo(w / 2 + 3, h); x.quadraticCurveTo(w / 2 + 4, h - 5, w / 2 + 6, h - 8); x.stroke();
  x.beginPath(); x.moveTo(w / 2 + 0.6, h); x.quadraticCurveTo(w / 2 + 1.6, h - 6, w / 2 + 1, h - 10.4); x.stroke();
}
/* 염라대왕 (보스) */
function drawBoss(x, w, h, frame) {
  const step = frame ? 2 : 0;
  // 곤룡포 (붉은 대례복, 입체)
  const rb = x.createLinearGradient(4, 22, w - 4, h);
  rb.addColorStop(0, '#aa2a3a'); rb.addColorStop(0.5, '#8a1a28'); rb.addColorStop(1, '#5c0e18');
  x.fillStyle = rb;
  x.beginPath();
  x.moveTo(10, 22); x.lineTo(w - 10, 22);
  x.lineTo(w - 4, h - 4 - step); x.lineTo(4, h - 4 + step);
  x.closePath(); x.fill();
  x.fillStyle = '#ffd34d';
  x.fillRect(w / 2 - 3, 26, 6, h - 32); // 중앙 금띠
  // 어깨 + 팔
  x.strokeStyle = '#8a1a28'; x.lineWidth = 9;
  x.beginPath(); x.moveTo(12, 26); x.lineTo(2, 40 + step); x.stroke();
  x.beginPath(); x.moveTo(w - 12, 26); x.lineTo(w - 2, 40 - step); x.stroke();
  x.fillStyle = '#eec89a';
  x.beginPath(); x.arc(2, 42 + step, 4, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w - 2, 42 - step, 4, 0, 6.283); x.fill();
  // 얼굴 (분노, 볼륨)
  const bf = x.createRadialGradient(w / 2 - 4, 10, 2, w / 2, 14, 15);
  bf.addColorStop(0, '#ffe0b4'); bf.addColorStop(1, '#d4a26e');
  x.fillStyle = bf;
  rr(x, w / 2 - 11, 6, 22, 18, 6); x.fill();
  // 수염
  x.fillStyle = '#241a16';
  x.beginPath(); x.moveTo(w / 2 - 7, 20); x.quadraticCurveTo(w / 2, 30, w / 2 + 7, 20);
  x.lineTo(w / 2 + 4, 19); x.quadraticCurveTo(w / 2, 24, w / 2 - 4, 19); x.closePath(); x.fill();
  // 성난 눈썹 + 눈
  x.strokeStyle = '#241a16'; x.lineWidth = 2.2;
  x.beginPath(); x.moveTo(w / 2 - 8, 10); x.lineTo(w / 2 - 3, 12.6); x.stroke();
  x.beginPath(); x.moveTo(w / 2 + 8, 10); x.lineTo(w / 2 + 3, 12.6); x.stroke();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(w / 2 - 5, 14.6, 2.4, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 5, 14.6, 2.4, 0, 6.283); x.fill();
  x.fillStyle = '#8a1a28';
  x.beginPath(); x.arc(w / 2 - 5, 14.9, 1.2, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 5, 14.9, 1.2, 0, 6.283); x.fill();
  x.strokeStyle = '#7a2020'; x.lineWidth = 1.6;
  x.beginPath(); x.arc(w / 2, 20.4, 2.6, Math.PI + 0.4, Math.PI * 2 - 0.4); x.stroke(); // 찡그린 입
  // 관모 (일월관)
  x.fillStyle = '#16161e';
  rr(x, w / 2 - 12, -2, 24, 10, 3); x.fill();
  x.fillRect(w / 2 - 16, 6, 32, 3);
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(w / 2, 2.6, 2.6, 0, 6.283); x.fill();
  x.fillStyle = '#fff';
  x.fillRect(w / 2 - 14, 2, 2, 5); x.fillRect(w / 2 + 12, 2, 2, 5);
}
/* 부적 (보스 투사체) */
function drawTalisman(x, w, h) {
  x.save(); x.translate(w / 2, h / 2); x.rotate(0.3);
  x.fillStyle = '#f5e6b8';
  x.fillRect(-5, -8, 10, 16);
  x.strokeStyle = '#c0392b'; x.lineWidth = 1.4;
  x.strokeRect(-3.6, -6.6, 7.2, 13.2);
  x.beginPath(); x.moveTo(-2, -4); x.lineTo(2, -4); x.moveTo(0, -4); x.lineTo(0, 2);
  x.moveTo(-2, 4); x.lineTo(2, 4); x.stroke();
  x.restore();
}
/* 아이템 */
function drawCoin(x, w, h) { // 엽전 (금속 광택)
  const cg0 = x.createRadialGradient(w / 2 - 2.6, h / 2 - 2.8, 1, w / 2, h / 2, 8.5);
  cg0.addColorStop(0, '#ffe9a0'); cg0.addColorStop(0.55, '#e8b34a'); cg0.addColorStop(1, '#ad7c20');
  x.fillStyle = cg0;
  x.beginPath(); x.arc(w / 2, h / 2, 8, 0, 6.283); x.fill();
  x.fillStyle = '#c8932a';
  x.beginPath(); x.arc(w / 2, h / 2, 8, 0, 6.283); x.lineWidth = 1.6; x.strokeStyle = '#a8781a'; x.stroke();
  x.fillStyle = '#7a5a14';
  x.fillRect(w / 2 - 2.6, h / 2 - 2.6, 5.2, 5.2);
  x.fillStyle = 'rgba(255,255,255,.45)';
  x.beginPath(); x.arc(w / 2 - 3, h / 2 - 4, 1.6, 0, 6.283); x.fill();
}
function drawFruit(x, w, h) { // 유자열매 (볼륨)
  const fr0 = x.createRadialGradient(w / 2 - 3, h / 2 - 1.5, 1, w / 2, h / 2 + 2, 9.5);
  fr0.addColorStop(0, '#ffe98a'); fr0.addColorStop(0.6, '#ffca28'); fr0.addColorStop(1, '#e09a10');
  x.fillStyle = fr0;
  x.beginPath(); x.arc(w / 2, h / 2 + 2, 9, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,.4)';
  x.beginPath(); x.arc(w / 2 - 3, h / 2 - 1, 2.6, 0, 6.283); x.fill();
  x.fillStyle = '#e8a800';
  x.beginPath(); x.arc(w / 2 + 3, h / 2 + 5, 1.2, 0, 6.283); x.arc(w / 2 - 4, h / 2 + 4, 1, 0, 6.283); x.fill();
  x.strokeStyle = '#6a8a2a'; x.lineWidth = 2.4;
  x.beginPath(); x.moveTo(w / 2, h / 2 - 7); x.quadraticCurveTo(w / 2 + 3, h / 2 - 11, w / 2 + 5, h / 2 - 10); x.stroke();
  x.fillStyle = '#7aa834';
  x.beginPath(); x.ellipse(w / 2 + 6, h / 2 - 10, 4, 2, 0.4, 0, 6.283); x.fill();
}
function drawFlame(x, w, h) { // 도깨비불
  const g = x.createRadialGradient(w / 2, h / 2 + 2, 1, w / 2, h / 2 + 2, 10);
  g.addColorStop(0, '#eaffff'); g.addColorStop(0.45, '#7ae0f0'); g.addColorStop(1, 'rgba(60,140,220,0)');
  x.fillStyle = g;
  x.beginPath(); x.arc(w / 2, h / 2 + 2, 10, 0, 6.283); x.fill();
  x.fillStyle = '#bff2fa';
  x.beginPath();
  x.moveTo(w / 2, 2); x.quadraticCurveTo(w / 2 + 6, h / 2 - 1, w / 2 + 5, h / 2 + 4);
  x.arc(w / 2, h / 2 + 4, 5, 0, Math.PI);
  x.quadraticCurveTo(w / 2 - 6, h / 2 - 1, w / 2, 2); x.fill();
}
/* 타일 */
function drawTileGround(x) { // 흙+잔디
  x.fillStyle = '#a8734a'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#96613c';
  x.fillRect(4, 12, 6, 5); x.fillRect(18, 20, 7, 5); x.fillRect(10, 25, 5, 4); x.fillRect(22, 8, 5, 4);
  x.fillStyle = '#6fae4e'; x.fillRect(0, 0, 32, 7);
  x.fillStyle = '#8ecb68';
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(3 + i * 5.4, 6.4, 3, Math.PI, 0); x.fill(); }
}
function drawTileGroundDark(x) { // 저승 보랏빛 흙
  x.fillStyle = '#4a3a5e'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#3c2e4e';
  x.fillRect(4, 12, 6, 5); x.fillRect(18, 20, 7, 5); x.fillRect(10, 25, 5, 4); x.fillRect(22, 8, 5, 4);
  x.fillStyle = '#6a5490'; x.fillRect(0, 0, 32, 7);
  x.fillStyle = '#8a70b8';
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(3 + i * 5.4, 6.4, 3, Math.PI, 0); x.fill(); }
}
function drawTileSnow(x) { // 설원
  x.fillStyle = '#8d7f9e'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#7c6e8c';
  x.fillRect(4, 14, 6, 5); x.fillRect(18, 21, 7, 5); x.fillRect(11, 26, 5, 4);
  x.fillStyle = '#cfe2f4'; x.fillRect(0, 5, 32, 3);
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 32, 6);
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(3 + i * 5.4, 6, 3.2, Math.PI, 0); x.fill(); }
  x.fillStyle = 'rgba(180,210,240,.5)';
  x.beginPath(); x.arc(9, 4, 1, 0, 6.283); x.arc(22, 3, 1, 0, 6.283); x.fill();
}
function drawTileSand(x) { // 모래사장
  x.fillStyle = '#e0b872'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#cfa25c';
  x.fillRect(5, 13, 5, 4); x.fillRect(19, 21, 6, 4); x.fillRect(11, 26, 4, 3); x.fillRect(23, 9, 4, 3);
  x.fillStyle = '#f5dfa0'; x.fillRect(0, 0, 32, 7);
  x.fillStyle = '#fdf0c8';
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(3 + i * 5.4, 6.4, 3, Math.PI, 0); x.fill(); }
  x.fillStyle = '#f8c8d8'; // 조개
  x.beginPath(); x.arc(24, 4, 1.6, Math.PI, 0); x.fill();
  x.fillStyle = 'rgba(120,90,40,.35)';
  x.beginPath(); x.arc(8, 18, 0.8, 0, 6.283); x.arc(16, 12, 0.8, 0, 6.283); x.arc(27, 24, 0.8, 0, 6.283); x.fill();
}
function drawTileCloud(x) { // 구름 발판
  x.fillStyle = '#dce8f8'; x.fillRect(0, 2, 32, 30);
  x.fillStyle = '#c4d4ec';
  x.beginPath(); x.arc(8, 30, 6, 0, 6.283); x.arc(20, 32, 7, 0, 6.283); x.arc(30, 29, 5, 0, 6.283); x.fill();
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 32, 7);
  for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(3.5 + i * 6.4, 7, 4, Math.PI, 0); x.fill(); }
  x.fillStyle = 'rgba(160,190,230,.35)';
  x.beginPath(); x.arc(12, 18, 3, 0, 6.283); x.arc(24, 22, 2.4, 0, 6.283); x.fill();
}
function drawTileLava(x) { // 화산암 (빛나는 균열)
  x.fillStyle = '#2a1416'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#3c1e1c';
  x.fillRect(4, 12, 6, 5); x.fillRect(18, 20, 7, 5); x.fillRect(10, 25, 5, 4);
  x.fillStyle = '#6a2418'; x.fillRect(0, 0, 32, 6);
  x.fillStyle = '#4a1a14';
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(3 + i * 5.4, 6, 3.2, Math.PI, 0); x.fill(); }
  // 용암 균열
  x.strokeStyle = '#ff6a1e'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(6, 10); x.lineTo(12, 18); x.lineTo(9, 26); x.stroke();
  x.beginPath(); x.moveTo(22, 8); x.lineTo(26, 16); x.lineTo(21, 24); x.stroke();
  x.strokeStyle = '#ffd34d'; x.lineWidth = 0.7;
  x.beginPath(); x.moveTo(6, 10); x.lineTo(12, 18); x.stroke();
  x.beginPath(); x.moveTo(22, 8); x.lineTo(26, 16); x.stroke();
}
function drawTileSteel(x) { // 강철 판 (리벳)
  const g = x.createLinearGradient(0, 0, 0, 32);
  g.addColorStop(0, '#5a5e6e'); g.addColorStop(1, '#3a3e4c');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  x.strokeStyle = '#2a2e3a'; x.lineWidth = 2;
  x.strokeRect(1, 1, 30, 30);
  x.beginPath(); x.moveTo(0, 16); x.lineTo(32, 16); x.stroke();
  x.fillStyle = '#7a8090'; // 리벳
  for (const [rx, ry] of [[5, 5], [27, 5], [5, 27], [27, 27], [16, 11], [16, 21]]) {
    x.beginPath(); x.arc(rx, ry, 1.8, 0, 6.283); x.fill();
  }
  x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(2, 2, 28, 3);
  x.fillStyle = '#c89020'; x.fillRect(0, 0, 32, 2); // 금 테두리
}
function drawTilePalace(x) { // 궁궐 단청 바닥
  x.fillStyle = '#6a1420'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#7c1c2a'; x.fillRect(0, 0, 32, 8);
  x.strokeStyle = '#ffd34d'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(0, 8); x.lineTo(32, 8); x.stroke();
  x.lineWidth = 1;
  x.beginPath(); x.moveTo(16, 12); x.lineTo(22, 20); x.lineTo(16, 28); x.lineTo(10, 20); x.closePath(); x.stroke();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(16, 20, 1.6, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,211,77,.5)';
  x.beginPath(); x.arc(4, 4, 1.1, 0, 6.283); x.arc(28, 4, 1.1, 0, 6.283); x.fill();
}
function drawTileStone(x) { // 돌담/기와벽
  x.fillStyle = '#9aa2ae'; x.fillRect(0, 0, 32, 32);
  x.strokeStyle = '#6d7684'; x.lineWidth = 2;
  x.strokeRect(1, 1, 30, 30);
  x.beginPath(); x.moveTo(0, 16); x.lineTo(32, 16); x.moveTo(16, 0); x.lineTo(16, 16); x.moveTo(8, 16); x.lineTo(8, 32); x.moveTo(24, 16); x.lineTo(24, 32); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(2, 2, 28, 3);
}
function drawTileBrick(x) { // 나무궤짝/벽돌
  x.fillStyle = '#c98a4b'; x.fillRect(0, 0, 32, 32);
  x.strokeStyle = '#8a5a28'; x.lineWidth = 2;
  x.strokeRect(1.5, 1.5, 29, 29);
  x.beginPath(); x.moveTo(2, 11); x.lineTo(30, 11); x.moveTo(2, 21); x.lineTo(30, 21); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(3, 3, 26, 3);
}
function drawTileQ(x) { // 복주머니 블록
  x.fillStyle = '#d8425a';
  rr(x, 1, 1, 30, 30, 7); x.fill();
  x.strokeStyle = '#8a1a2e'; x.lineWidth = 2; x.stroke();
  x.fillStyle = '#e86a80';
  x.beginPath(); x.arc(16, 20, 10, 0, 6.283); x.fill();
  x.strokeStyle = '#ffd34d'; x.lineWidth = 2.6;
  x.beginPath(); x.moveTo(9, 10); x.quadraticCurveTo(16, 16, 23, 10); x.stroke();
  x.beginPath(); x.arc(13.4, 8, 2.6, 0, 6.283); x.stroke();
  x.beginPath(); x.arc(18.6, 8, 2.6, 0, 6.283); x.stroke();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(16, 9.4, 2, 0, 6.283); x.fill();
}
function drawTileUsed(x) {
  x.fillStyle = '#9a8878';
  rr(x, 1, 1, 30, 30, 7); x.fill();
  x.strokeStyle = '#6a5a4c'; x.lineWidth = 2; x.stroke();
  x.fillStyle = '#8a7868';
  x.beginPath(); x.arc(16, 16, 6, 0, 6.283); x.fill();
}
function drawTilePlat(x) { // 마루 판자 (반통과)
  x.fillStyle = '#b8894e'; x.fillRect(0, 4, 32, 12);
  x.strokeStyle = '#7a5424'; x.lineWidth = 1.6;
  x.strokeRect(1, 5, 30, 10);
  x.beginPath(); x.moveTo(11, 5); x.lineTo(11, 15); x.moveTo(21, 5); x.lineTo(21, 15); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.2)'; x.fillRect(1, 5, 30, 2.4);
}
function drawGoal(x, w, h) { // 장승 + 깃발
  x.fillStyle = '#9a6a3a';
  rr(x, w / 2 - 6, 14, 12, h - 16, 3); x.fill();
  // 장승 얼굴
  x.fillStyle = '#b8834a';
  rr(x, w / 2 - 9, 14, 18, 26, 4); x.fill();
  x.fillStyle = '#241a16';
  x.beginPath(); x.arc(w / 2 - 4, 22, 1.6, 0, 6.283); x.fill();
  x.beginPath(); x.arc(w / 2 + 4, 22, 1.6, 0, 6.283); x.fill();
  x.strokeStyle = '#241a16'; x.lineWidth = 1.6;
  x.beginPath(); x.arc(w / 2, 29, 4.6, 0.3, Math.PI - 0.3); x.stroke();
  x.strokeRect(w / 2 - 7, 33, 14, 4);
  // 깃발
  x.strokeStyle = '#5a4a3a'; x.lineWidth = 2.6;
  x.beginPath(); x.moveTo(w / 2, 14); x.lineTo(w / 2, 0); x.stroke();
  x.fillStyle = '#e8556a';
  x.beginPath(); x.moveTo(w / 2, 1); x.lineTo(w / 2 + 16, 5); x.lineTo(w / 2, 10); x.closePath(); x.fill();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(w / 2 + 5, 5.4, 1.8, 0, 6.283); x.fill();
}
function drawLantern(x, w, h) { // 청사초롱
  x.strokeStyle = '#5a4a3a'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, 5); x.stroke();
  const g = x.createLinearGradient(0, 5, 0, h - 4);
  g.addColorStop(0, '#4a90c8'); g.addColorStop(0.5, '#ffe9a8'); g.addColorStop(1, '#d8425a');
  x.fillStyle = g;
  rr(x, w / 2 - 7, 5, 14, h - 11, 5); x.fill();
  x.strokeStyle = 'rgba(90,60,40,.6)'; x.lineWidth = 1.2;
  rr(x, w / 2 - 7, 5, 14, h - 11, 5); x.stroke();
  x.fillStyle = '#ffd34d';
  x.beginPath(); x.arc(w / 2, h - 3, 2.2, 0, 6.283); x.fill();
}
function buildSprites() {
  SPR.ujaF = [0, 1, 2, 3].map(fm => [0, 1, 2].map(f => mk(30, 34, (x, w, h) => drawUja(x, w, h, f, fm))));
  SPR.uja = SPR.ujaF[0]; SPR.ujaP = SPR.ujaF[1];
  SPR.ghost = [0, 1].map(f => mk(28, 30, (x, w, h) => drawGhost(x, w, h, f)));
  SPR.reaper = [0, 1].map(f => mk(28, 32, (x, w, h) => drawReaper(x, w, h, f)));
  SPR.hat = [mk(26, 16, drawHat)];
  SPR.dok = [0, 1].map(f => mk(28, 30, (x, w, h) => drawDokkaebi(x, w, h, f)));
  SPR.egg = [0, 1].map(f => mk(26, 32, (x, w, h) => drawEgg(x, w, h, f)));
  SPR.fox = [0, 1].map(f => mk(36, 28, (x, w, h) => drawFox(x, w, h, f)));
  SPR.uni = [0, 1].map(f => mk(36, 32, (x, w, h) => drawUnicorn(x, w, h, f)));
  SPR.boss = [0, 1].map(f => mk(56, 64, (x, w, h) => drawBoss(x, w, h, f)));
  SPR.jjo = [0, 1, 2].map(f => mk(60, 66, (x, w, h) => drawJjojjo(x, w, h, f)));
  SPR.jjotank = [0, 1, 2].map(f => mk(96, 78, (x, w, h) => drawJjojjoTank(x, w, h, f)));
  SPR.shell = [mk(18, 20, drawShell)];
  SPR.blt = [mk(18, 10, drawBullet)];
  SPR.fb = [mk(16, 16, drawFireball)];
  SPR.pepper = [mk(22, 26, drawPepper)];
  SPR.tiger = [mk(24, 24, drawTigerCharm)];
  SPR.tal = [mk(20, 22, drawTalisman)];
  SPR.coin = [mk(20, 20, drawCoin)];
  SPR.fruit = [mk(24, 26, drawFruit)];
  SPR.flame = [mk(22, 24, drawFlame)];
  SPR.goal = [mk(40, 96, drawGoal)];
  SPR.lantern = [mk(20, 28, drawLantern)];
  SPR.flower = [0, 1].map(v => mk(16, 18, (x, w, h) => drawFlower(x, w, h, v)));
  SPR.grass = [mk(16, 12, drawGrassTuft)];
  SPR.ground = {
    grass: mk(32, 32, drawTileGround), dark: mk(32, 32, drawTileGroundDark),
    snow: mk(32, 32, drawTileSnow), sand: mk(32, 32, drawTileSand),
    cloud: mk(32, 32, drawTileCloud), palace: mk(32, 32, drawTilePalace),
    lava: mk(32, 32, drawTileLava), steel: mk(32, 32, drawTileSteel),
  };
  SPR.tile = {
    1: SPR.ground.grass, 2: mk(32, 32, drawTileBrick), 3: mk(32, 32, drawTileQ),
    4: mk(32, 32, drawTileUsed), 5: mk(32, 32, drawTileStone), 6: mk(32, 32, drawTilePlat),
  };
}

/* ============================================================
   레벨 생성 (시드 고정 → 결정적)
   테마: 1 초가마을(낮) 2 소나무숲(석양) 3 궁궐지붕(밤) 4 저승길(동굴) 5 염라궁
   ============================================================ */
const THEMES = [
  { sky: ['#8ed4f2', '#d8f0fa'], hill: '#7ec06a', hill2: '#5ea84e', deco: 'hut', light: 1, ground: 'grass', amb: 'butterfly' },
  { sky: ['#f0975a', '#fce8b8'], hill: '#4a7a52', hill2: '#38663f', deco: 'pine', light: 0.9, ground: 'grass', amb: 'leaf' },
  { sky: ['#1a2a5e', '#3e4e8e'], hill: '#26325e', hill2: '#1c2648', deco: 'roof', light: 0.7, moon: 1, ground: 'grass' },
  { sky: ['#241830', '#3c2a4a'], hill: '#302040', hill2: '#241830', deco: 'spirit', light: 0.55, lanterns: 1, ground: 'dark' },
  { sky: ['#38101c', '#601c28'], hill: '#42141e', hill2: '#300e16', deco: 'palace', light: 0.65, lanterns: 1, ground: 'palace', amb: 'ember' },
  { sky: ['#b8e4cc', '#f2fbe4'], hill: '#6cae74', hill2: '#4e9458', deco: 'bamboo', light: 1, ground: 'grass', amb: 'petal' },
  { sky: ['#a0bce4', '#eef5fc'], hill: '#ccd8ea', hill2: '#aabfd8', deco: 'snowpine', light: 1, ground: 'snow', amb: 'snow' },
  { sky: ['#f7a75c', '#ffe3b8'], hill: '#d87a4e', hill2: '#b85e38', deco: 'wave', light: 0.95, ground: 'sand', amb: 'sparkle', sea: 1 },
  { sky: ['#6fb4f0', '#d8ecff'], hill: '#c2daf4', hill2: '#a2c6ea', deco: 'cloudsea', light: 1, ground: 'cloud', amb: 'wind' },
  { sky: ['#2a1040', '#5c2470'], hill: '#3c1852', hill2: '#2a1040', deco: 'palace2', light: 0.7, lanterns: 1, ground: 'palace', amb: 'gold' },
  { sky: ['#ffd2e2', '#fff2f8'], hill: '#8fce74', hill2: '#6cb45a', deco: 'cherry', light: 1, ground: 'grass', amb: 'petal' },
  { sky: ['#3a0c10', '#8a2412'], hill: '#4a1410', hill2: '#2c0a08', deco: 'volcano', light: 0.72, ground: 'lava', amb: 'ember', lava: 1 },
  { sky: ['#0a2044', '#16406a'], hill: '#9ec2da', hill2: '#7aa0c0', deco: 'snowpine', light: 0.82, moon: 1, ground: 'snow', amb: 'snow', aurora: 1 },
  { sky: ['#f5934a', '#ffe0a8'], hill: '#c86a44', hill2: '#a44e30', deco: 'lighthouse', light: 0.95, ground: 'sand', amb: 'sparkle', sea: 1 },
  { sky: ['#221a30', '#3c2c4e'], hill: '#2c2038', hill2: '#1a1226', deco: 'fortress', light: 0.7, lanterns: 1, ground: 'steel', amb: 'gold' },
];
let LV = null; // {t:Uint8Array, W, ents:[], goalX, theme, qc:Map, deco:[], bossArena}
function ti(x, y) { return (x < 0 || x >= LV.W) ? 5 : (y < 0 ? 0 : y >= ROWS ? 0 : LV.t[y * LV.W + x]); }
function setT(t, W, x, y, v) { if (x >= 0 && x < W && y >= 0 && y < ROWS) t[y * W + x] = v; }
const SOLID = [false, true, true, true, true, true, false]; // 6=플랫폼(반통과)

function genLevel(stage) {
  const rng = mulberry32(4200 + stage * 131);
  const W = [150, 165, 175, 185, 150, 180, 185, 190, 195, 155, 185, 190, 195, 200, 165][stage - 1];
  const t = new Uint8Array(W * ROWS);
  const ents = [];
  const qc = new Map();
  const deco = [];
  const mix = [
    ['ghost'],
    ['ghost', 'egg', 'ghost'],
    ['ghost', 'reaper', 'egg'],
    ['reaper', 'dok', 'ghost', 'reaper'],
    ['reaper', 'fox', 'dok'],
    ['ghost', 'dok', 'egg', 'ghost'],
    ['reaper', 'egg', 'dok'],
    ['fox', 'ghost', 'reaper', 'egg'],
    ['egg', 'dok', 'fox'],
    ['fox', 'reaper', 'dok', 'fox'],
    ['ghost', 'fox', 'dok', 'egg'],
    ['reaper', 'dok', 'fox', 'reaper'],
    ['fox', 'egg', 'reaper', 'dok'],
    ['dok', 'fox', 'reaper', 'egg', 'fox'],
    ['fox', 'reaper', 'dok', 'fox', 'reaper'],
  ][stage - 1];
  const bossStage = stage === 5 || stage === 10 || stage === 15;
  const flowery = [1, 2, 6, 8, 9, 11].includes(stage); // 아기자기 꽃/풀 장식 테마
  const gapMax = stage <= 1 ? 3 : 4;
  const eDen = 0.16 + Math.min(stage, 7) * 0.035;
  let x = 0, gh = 2; // gh = 지면 높이(타일 수)
  let firstQ = true, uniPlaced = false, powerCnt = 0;
  const uniAt = Math.floor(W * 0.35);
  const SAFE_START = 10; // 플레이어 스폰(타일3) 주변: 이 타일 전에는 적/공중달걀 미스폰
  const ground = (from, to, h) => {
    for (let i = from; i < to; i++)
      for (let r = ROWS - h; r < ROWS; r++) setT(t, W, i, r, r === ROWS - h ? 1 : 5);
  };
  const flat = (n) => {
    ground(x, x + n, gh);
    const top = ROWS - gh - 1;
    for (let i = 1; i < n - 1; i++) {
      const gx = x + i;
      // 유니콘
      if (!uniPlaced && gx >= uniAt) { ents.push({ type: 'uni', tx: gx, ty: top }); uniPlaced = true; continue; }
      // 적 (시작 안전지대 이후에만)
      if (rng() < eDen && n >= 4 && gx >= SAFE_START) {
        ents.push({ type: mix[(rng() * mix.length) | 0], tx: gx, ty: top });
        continue;
      }
      // 엽전 아치
      if (rng() < 0.1) {
        for (let k = 0; k < 3 && i + k < n - 1; k++) ents.push({ type: 'coin', tx: gx + k, ty: top - 3 });
      }
      // 블록 줄 (?블록/궤짝)
      if (rng() < 0.11 && i + 2 < n - 1) {
        const by = top - 3;
        const len = 2 + ((rng() * 2) | 0);
        for (let k = 0; k < len; k++) {
          const bx = gx + k;
          if (rng() < 0.45) {
            setT(t, W, bx, by, 3);
            let c = 'coin';
            if (firstQ || (powerCnt < 2 && rng() < 0.3)) {
              // 파워업: 1~2스테이지 유자열매, 이후 고추/호랑이 부적 등장
              const r = rng();
              c = stage < 3 || r < 0.4 ? 'fruit' : r < 0.75 ? 'pepper' : 'tiger';
              firstQ = false; powerCnt++;
            }
            else if (rng() < 0.07) c = 'flame';
            qc.set(by * W + bx, c);
          } else setT(t, W, bx, by, 2);
        }
        i += len + 1;
        continue;
      }
      // 등불 장식
      if (rng() < 0.08) deco.push({ x: gx, y: top - 2, k: 'lantern' });
      // 꽃·풀숲 (밝은 테마)
      else if (flowery && rng() < 0.16) deco.push({ x: gx, y: top, k: rng() < 0.55 ? 'flower' : 'grass', v: (rng() * 2) | 0 });
    }
    x += n;
  };
  const gap = (n) => {
    // 절벽 위 엽전 (점프 유도)
    for (let k = 0; k < n; k++) ents.push({ type: 'coin', tx: x + k, ty: ROWS - gh - 4 });
    x += n;
  };
  const plats = () => { // 떠 있는 마루 (보너스)
    const py = ROWS - gh - 5;
    const len = 3 + ((rng() * 2) | 0);
    ground(x, x + len + 4, gh);
    for (let k = 0; k < len; k++) {
      setT(t, W, x + 1 + k, py, 6);
      if (rng() < 0.7) ents.push({ type: 'coin', tx: x + 1 + k, ty: py - 2 });
    }
    x += len + 4;
  };
  // 시작 안전지대
  flat(9);
  const endLen = bossStage ? 36 : 12;
  while (x < W - endLen - 6) {
    const roll = rng();
    if (roll < 0.42) flat(5 + ((rng() * 7) | 0));
    else if (roll < 0.62) { gap(2 + ((rng() * (gapMax - 1)) | 0)); flat(4 + ((rng() * 4) | 0)); }
    else if (roll < 0.78) { // 언덕 (높이 변화 ≤2)
      gh = Math.max(2, Math.min(5, gh + (rng() < 0.5 ? 1 : -1) * (1 + (rng() < 0.3 ? 1 : 0))));
      flat(4 + ((rng() * 4) | 0));
    } else plats();
  }
  gh = 2;
  let goalX, bossArena = null;
  if (bossStage) { // 보스 아레나 (5 염라대왕 · 10 쪼쪼 여왕 · 15 탱크 쪼쪼)
    ground(x, W, gh);
    const ax = x + 4;
    bossArena = { x0: ax * TILE, x1: (W - 2) * TILE, entered: false };
    for (let r = 0; r < ROWS; r++) setT(t, W, W - 1, r, 5); // 끝벽
    const bossType = stage === 15 ? 'jjotank' : stage === 10 ? 'jjojjo' : 'boss';
    ents.push({ type: bossType, tx: W - 13, ty: ROWS - gh - 1 });
    goalX = (W - 5) * TILE; // 보스 처치 후 등장
  } else {
    ground(x, W, gh);
    goalX = (W - 6) * TILE;
    deco.push({ x: W - 4, y: ROWS - gh - 2, k: 'lantern' });
  }
  // 유니콘 미배치 시 시작 지점 근처에
  if (!uniPlaced) ents.push({ type: 'uni', tx: 12, ty: ROWS - 3 });
  // 파워업 블록 보장 (시드 운으로 없을 때)
  if (![...qc.values()].some(c => c === 'fruit' || c === 'pepper' || c === 'tiger')) {
    const first = qc.keys().next();
    if (!first.done) qc.set(first.value, stage < 3 ? 'fruit' : 'pepper');
    else { const by = ROWS - 6, bx2 = 6; setT(t, W, bx2, by, 3); qc.set(by * W + bx2, stage < 3 ? 'fruit' : 'pepper'); }
  }
  return { t, W, ents, qc, deco, goalX, theme: THEMES[stage - 1], stage, bossArena };
}

/* ============================================================
   게임 상태
   ============================================================ */
const G = {
  mode: 'menu', stage: 1, lives: 3, score: 0, coins: 0, time: 300,
  paused: false, introT: 0, clearT: 0, msg: '', msgT: 0, won: false, recorded: false,
};
let player = null;
let ents = [];
const particles = [], popups = [], bumps = [];
const cam = { x: 0 };
const keys = { l: false, r: false, j: false, run: false };
let jumpBuf = 0, jumpWasDown = false, runWasDown = false;

function mkPlayer(px, py) {
  return {
    x: px, y: py, w: 20, h: 30, vx: 0, vy: 0, dir: 1,
    onG: false, coyote: 0, pw: 0, inv: 0, star: 0, riding: false, airJump: false,
    animT: 0, dead: false, deadT: 0, prevB: py + 30, atkT: 0, gliding: false, flag: null,
  };
}
function spawnEnts() {
  ents = [];
  for (const s of LV.ents) {
    const px = s.tx * TILE + 4, py = (s.ty + 1) * TILE;
    if (s.type === 'coin') ents.push({ type: 'coin', x: s.tx * TILE + 6, y: s.ty * TILE + 6, w: 20, h: 20 });
    else if (s.type === 'ghost') ents.push({ type: 'ghost', x: px, y: py - 30, w: 22, h: 28, vx: -40, vy: 0, dir: -1 });
    else if (s.type === 'reaper') ents.push({ type: 'reaper', x: px, y: py - 32, w: 22, h: 30, vx: -55, vy: 0, dir: -1 });
    else if (s.type === 'dok') ents.push({ type: 'dok', x: px, y: py - 30, w: 24, h: 28, vx: 0, vy: 0, dir: -1, hopT: 1 + Math.random() });
    else if (s.type === 'egg') ents.push({ type: 'egg', x: px, y: py - 90, w: 22, h: 28, base: py - 90, t: Math.random() * 6 });
    else if (s.type === 'fox') ents.push({ type: 'fox', x: px, y: py - 28, w: 30, h: 26, vx: -110, vy: 0, dir: -1 });
    else if (s.type === 'uni') ents.push({ type: 'uni', x: px, y: py - 32, w: 30, h: 30, vx: 0, vy: 0, dir: -1, bob: 0 });
    else if (s.type === 'boss') ents.push({
      type: 'boss', x: s.tx * TILE, y: (s.ty + 1) * TILE - 62, w: 48, h: 60,
      vx: 0, vy: 0, dir: -1, hp: 5, maxHp: 5, throwT: 2.2, stun: 0, inv: 0, dead: false,
    });
    else if (s.type === 'jjojjo') ents.push({
      type: 'jjojjo', x: s.tx * TILE, y: (s.ty + 1) * TILE - 60, w: 44, h: 58,
      vx: 0, vy: 0, dir: -1, hp: 6, maxHp: 6, burstT: 2.6, burstN: 0, shotT: 0, flash: 0, stun: 0, inv: 0, dead: false,
    });
    else if (s.type === 'jjotank') ents.push({
      type: 'jjotank', x: s.tx * TILE, y: (s.ty + 1) * TILE - 78, w: 92, h: 74,
      vx: 0, vy: 0, dir: -1, hp: 8, maxHp: 8, throwT: 2.4, mgN: 0, shotT: 0, flash: 0, stun: 0, inv: 0, dead: false,
    });
  }
  LV.goalActive = !LV.bossArena;
}

/* ===== 타일 충돌 ===== */
function tileCollide(e, dt) {
  const head = [];
  // 수평
  e.x += e.vx * dt;
  if (e.vx > 0) {
    const tx = Math.floor((e.x + e.w) / TILE);
    for (let ty = Math.floor(e.y / TILE); ty <= Math.floor((e.y + e.h - 1) / TILE); ty++) {
      if (SOLID[ti(tx, ty)]) { e.x = tx * TILE - e.w - 0.01; e.hitWall = 1; break; }
    }
  } else if (e.vx < 0) {
    const tx = Math.floor(e.x / TILE);
    for (let ty = Math.floor(e.y / TILE); ty <= Math.floor((e.y + e.h - 1) / TILE); ty++) {
      if (SOLID[ti(tx, ty)]) { e.x = (tx + 1) * TILE + 0.01; e.hitWall = -1; break; }
    }
  }
  if (e.x < 0) { e.x = 0; e.hitWall = -1; }
  // 수직
  const prevB = e.y + e.h;
  e.vy = Math.min(950, e.vy + (e.grav === undefined ? GRAV : e.grav) * dt);
  e.y += e.vy * dt;
  e.onG = false;
  if (e.vy >= 0) {
    const ty = Math.floor((e.y + e.h) / TILE);
    for (let tx = Math.floor((e.x + 2) / TILE); tx <= Math.floor((e.x + e.w - 2) / TILE); tx++) {
      const v = ti(tx, ty);
      if (SOLID[v] || (v === 6 && prevB <= ty * TILE + 6)) {
        e.y = ty * TILE - e.h - 0.01; e.vy = 0; e.onG = true; break;
      }
    }
  } else {
    const ty = Math.floor(e.y / TILE);
    for (let tx = Math.floor((e.x + 2) / TILE); tx <= Math.floor((e.x + e.w - 2) / TILE); tx++) {
      const v = ti(tx, ty);
      if (SOLID[v]) { e.y = (ty + 1) * TILE + 0.01; e.vy = 0; head.push([tx, ty, v]); }
    }
  }
  return head;
}
function groundAhead(e) {
  const tx = Math.floor((e.dir > 0 ? e.x + e.w + 4 : e.x - 4) / TILE);
  const ty = Math.floor((e.y + e.h + 6) / TILE);
  return SOLID[ti(tx, ty)] || ti(tx, ty) === 6;
}
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ===== 이펙트 ===== */
function poof(x, y, col) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * 6.283, sp = 60 + Math.random() * 130;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, g: 500, t: 0, life: 0.5 + Math.random() * 0.3, r: 3 + Math.random() * 4, col: col || '#fff' });
  }
}
function sparkle(x, y, col) {
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * 6.283, sp = 40 + Math.random() * 90;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, g: 300, t: 0, life: 0.45, r: 2 + Math.random() * 2.5, col: col || '#ffe28a', star: true });
  }
}
function popup(x, y, txt, col) { popups.push({ x, y, txt, col: col || '#ffe28a', t: 0 }); }
function addScore(n, x, y) { G.score += n; if (x !== undefined) popup(x, y, '+' + n); }

/* ===== 플레이어 ===== */
function damagePlayer() {
  const p = player;
  if (p.inv > 0 || p.star > 0 || p.dead || p.flag) return;
  if (p.riding) {
    p.riding = false; p.airJump = false;
    ents.push({ type: 'uniFlee', x: p.x - 6, y: p.y, w: 30, h: 30, vx: p.dir * -240, vy: -220, dir: -p.dir, t: 0 });
    p.inv = 1.6; sfx.hurt();
    return;
  }
  if (p.pw > 1) { p.pw = 1; p.inv = 1.8; sfx.hurt(); return; } // 불꽃/호랑이 → 유자열매 폼으로
  if (p.pw > 0) { p.pw = 0; p.inv = 1.8; sfx.hurt(); return; }
  p.dead = true; p.deadT = 0; p.vy = -520; p.vx = 0;
  sfx.die(); bgmStop();
}
function killEnemy(e, pts, byStar) {
  e.dead = true;
  // 사망 모션: 밟기=납작 찌부, 불꽃/무적/갓=빙글 날아감
  ents.push({
    type: 'corpse', name: e.type, x: e.x, y: e.y, w: e.w, h: e.h,
    dir: e.dir || 1, t: 0, fly: !!byStar,
    vx: byStar ? (player && player.x > e.x ? -1 : 1) * 140 : 0, vy: byStar ? -330 : 0,
  });
  poof(e.x + e.w / 2, e.y + e.h / 2, e.type === 'ghost' ? '#e8ecf4' : e.type === 'fox' ? '#f5a256' : '#cfc4d8');
  addScore(pts, e.x + e.w / 2, e.y);
  if (byStar) sfx.kick(); else sfx.stomp();
}
function updatePlayer(dt) {
  const p = player;
  if (p.dead) {
    p.deadT += dt;
    p.vy += GRAV * dt; p.y += p.vy * dt;
    if (p.deadT > 1.6) respawn();
    return;
  }
  if (p.flag) { // 깃대 슬라이드 → 착지 후 클리어
    p.flag.t += dt;
    const base = VH - 2 * TILE;
    if (p.y + p.h < base) p.y = Math.min(base - p.h, p.y + 250 * dt);
    else if (p.flag.t > 0.35 && !G.clearT) stageClear();
    return;
  }
  p.inv = Math.max(0, p.inv - dt);
  p.star = Math.max(0, p.star - dt);
  // 이동
  const spd = (keys.run ? RUN : WALK) * (p.riding ? 1.12 : 1);
  const target = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  if (target !== 0) { p.dir = target; p.vx += target * 1500 * dt; }
  else p.vx *= Math.pow(0.0008, dt);
  p.vx = Math.max(-spd, Math.min(spd, p.vx));
  // 점프 (버퍼+코요테)
  if (keys.j && !jumpWasDown) jumpBuf = 0.11;
  jumpWasDown = keys.j;
  jumpBuf = Math.max(0, jumpBuf - dt);
  p.coyote = p.onG ? 0.09 : Math.max(0, p.coyote - dt);
  if (jumpBuf > 0) {
    if (p.onG || p.coyote > 0) {
      p.vy = -(p.riding ? 640 : JUMP_V); p.coyote = 0; jumpBuf = 0;
      if (p.riding) p.airJump = true;
      sfx.jump();
    } else if (p.riding && p.airJump) {
      p.vy = -540; p.airJump = false; jumpBuf = 0;
      for (let i = 0; i < 8; i++) sparkle(p.x + p.w / 2, p.y + p.h, ['#ff9cc8', '#ffe28a', '#7ae0f0', '#b8f27a'][i % 4]);
      sfx.jump();
    }
  }
  // 불꽃 발사 (고추 폼, 달리기 버튼 탭 = 마리오 방식)
  p.atkT = Math.max(0, p.atkT - dt);
  if (keys.run && !runWasDown && p.pw === 2) {
    if (ents.filter(e => e.type === 'fb' && !e.dead).length < 2) {
      ents.push({ type: 'fb', x: p.x + (p.dir > 0 ? p.w - 2 : -12), y: p.y + 8, w: 14, h: 14, vx: p.dir * 360, vy: -60, t: 0, dir: p.dir });
      p.atkT = 0.32; // 공격 포즈 유지 시간
      sfx.fire();
    }
  }
  runWasDown = keys.run;
  // 가변 점프 (홀드) + 호랑이 활강
  p.grav = (p.vy < 0 && keys.j) ? GRAV * 0.52 : GRAV;
  const glideNow = p.pw === 3 && keys.j && p.vy > 0 && !p.onG;
  if (glideNow) p.grav = GRAV * 0.3;
  p.gliding = glideNow;
  p.prevB = p.y + p.h;
  p.hitWall = 0;
  const head = tileCollide(p, dt);
  if (p.pw === 3 && keys.j && !p.onG && p.vy > 120) {
    p.vy = 120; // 활강: 낙하 속도 제한
    if (Math.random() < 0.12) sparkle(p.x + p.w / 2 - p.dir * 10, p.y + p.h - 4, '#ffcf6e');
  }
  // 머리로 블록 침
  for (const [tx, ty, v] of head) {
    if (v === 3) {
      const key = ty * LV.W + tx;
      const c = LV.qc.get(key) || 'coin';
      LV.t[key] = 4;
      bumps.push({ tx, ty, t: 0 });
      spawnItem(tx, ty, c);
      sfx.bump();
    } else if (v === 2) {
      if (p.pw > 0 || p.riding) {
        LV.t[ty * LV.W + tx] = 0;
        poof(tx * TILE + 16, ty * TILE + 16, '#c98a4b');
        addScore(50); sfx.brk();
      } else { bumps.push({ tx, ty, t: 0 }); sfx.bump(); }
    }
  }
  if (target !== 0 && p.onG) p.animT += dt * Math.abs(p.vx) / 26;
  // 낙사
  if (p.y > VH + 80) { p.inv = 0; p.star = 0; p.pw = 0; p.riding = false; p.dead = true; p.deadT = 1.0; sfx.die(); bgmStop(); }
  // 골인: 깃대 잡기 (마리오식 — 높이 비례 점수)
  if (LV.goalActive && !p.flag && p.x + p.w > LV.goalX + 8 && !G.clearT) {
    const base = VH - 2 * TILE, poleTop = base - 7 * TILE;
    const grabY = Math.max(poleTop, Math.min(p.y, base - p.h));
    const frac = (base - p.h - grabY) / (base - p.h - poleTop); // 0=바닥 1=꼭대기
    const tier = Math.max(0, Math.min(6, (frac * 7) | 0));
    const pts = [100, 200, 500, 1000, 2000, 4000, 5000][tier];
    p.flag = { t: 0 };
    p.x = LV.goalX + 8 - p.w / 2; p.y = grabY; p.vx = 0; p.vy = 0;
    p.riding = false; p.gliding = false;
    addScore(pts, p.x + p.w / 2, p.y - 8);
    if (frac >= 0.95) { G.lives++; popup(p.x, p.y - 26, L.oneUp, '#8ef78a'); sfx.oneUp(); }
    sfx.flagSlide();
  }
  // 보스 아레나 진입
  const ba = LV.bossArena;
  if (ba && !ba.entered && p.x > ba.x0 + 40) {
    ba.entered = true;
    bgmStart(true); sfx.warn();
    G.msg = G.stage === 15 ? L.bossWarn3 : G.stage === 10 ? L.bossWarn2 : L.bossWarn; G.msgT = 2.2;
  }
  if (ba && ba.entered && p.x < ba.x0) p.x = ba.x0;
}
function spawnItem(tx, ty, kind) {
  const x = tx * TILE + 5, y = ty * TILE - 28;
  if (kind === 'coin') {
    G.coins++; addScore(200, tx * TILE + 16, ty * TILE - 10);
    sparkle(tx * TILE + 16, ty * TILE - 8);
    sfx.coin(); checkCoinLife();
  } else if (kind === 'fruit') {
    ents.push({ type: 'fruit', x, y, w: 22, h: 24, vx: 60, vy: -160, dir: 1 });
  } else if (kind === 'flame') {
    ents.push({ type: 'flame', x, y: y - 4, w: 20, h: 22, base: y - 4, t: 0 });
  } else if (kind === 'pepper') {
    ents.push({ type: 'pepper', x, y, w: 20, h: 24, vx: 55, vy: -160, dir: 1 });
  } else if (kind === 'tiger') {
    ents.push({ type: 'tiger', x, y, w: 22, h: 22, vx: 50, vy: -160, dir: 1 });
  }
}
function checkCoinLife() {
  if (G.coins >= 100) { G.coins -= 100; G.lives++; popup(player.x + 10, player.y - 20, L.oneUp, '#8ef78a'); sfx.oneUp(); }
}
const CONTINUE_MIN = 500; // 이어하기 최소 점수 (절반 소모가 유의미해지는 하한)
function respawn() {
  G.lives--;
  if (G.lives < 0) { gameOver(); return; }
  G.msg = L.lifeLost; G.msgT = 1.4;
  startStage(G.stage, true);
}
function gameOver() {
  // 보너스 생명 소진 → 점수 절반을 소모해 이어하기 제안
  if (!G.won && G.score >= CONTINUE_MIN) {
    G.paused = true; // 프레임 업데이트 정지 (렌더는 프리즈 유지)
    bgmStop();
    const after = G.score - Math.floor(G.score * 0.5);
    $('contInfo').innerHTML =
      `<div class="contDesc">${L.contDesc}</div>` +
      `<div class="contRow"><span>${L.contScore}</span><b>${G.score.toLocaleString()}</b></div>` +
      `<div class="contRow contArrow">↓ −50%</div>` +
      `<div class="contRow"><span>${L.contAfter}</span><b class="contHi">${after.toLocaleString()}</b></div>`;
    showScreen('continue');
    return;
  }
  finishGame(false);
}
function doContinue() {
  G.score -= Math.floor(G.score * 0.5); // 점수 50% 소모
  G.lives = 3;
  G.paused = false;
  G.recorded = false;
  showScreen(null);
  startStage(G.stage);
}
function giveUp() {
  G.paused = false;
  finishGame(false);
}

/* ===== 엔티티 ===== */
function updateEnts(dt) {
  const p = player;
  for (const e of ents) {
    if (e.dead) continue;
    switch (e.type) {
      case 'ghost': case 'reaper': {
        e.vx = e.dir * (e.type === 'ghost' ? 40 : 55);
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.hitWall || (e.onG && !groundAhead(e))) e.dir *= -1;
        e.animT = (e.animT || 0) + dt;
        break;
      }
      case 'fox': {
        e.vx = e.dir * 110;
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.hitWall || (e.onG && !groundAhead(e))) e.dir *= -1;
        e.animT = (e.animT || 0) + dt * 2;
        break;
      }
      case 'dok': {
        e.hopT -= dt;
        if (e.onG) { e.vx = 0; if (e.hopT <= 0) { e.hopT = 1.3; e.vy = -430; e.dir = p.x > e.x ? 1 : -1; e.vx = e.dir * 95; } }
        e.hitWall = 0;
        tileCollide(e, dt);
        e.animT = e.onG ? 0 : 1;
        break;
      }
      case 'egg': {
        e.t += dt;
        e.y = e.base + Math.sin(e.t * 2.2) * 30;
        e.animT = e.t;
        break;
      }
      case 'hat': {
        e.vx = e.dir * 300;
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.hitWall) { e.dir *= -1; sfx.kick(); }
        e.t += dt;
        if (e.t > 8 || e.y > VH + 60) e.dead = true;
        for (const o of ents) {
          if (o === e || o.dead || !['ghost', 'reaper', 'dok', 'egg', 'fox'].includes(o.type)) continue;
          if (overlap(e, o)) killEnemy(o, 100, true);
        }
        break;
      }
      case 'uni': {
        e.bob += dt;
        tileCollide(e, dt);
        if (!p.riding && !p.dead && overlap(e, p)) {
          e.dead = true;
          p.riding = true; p.airJump = false;
          popup(p.x, p.y - 24, L.mounted, '#ff9cc8');
          sparkle(p.x + 10, p.y + 10, '#ff9cc8');
          sfx.mount();
        }
        break;
      }
      case 'uniFlee': {
        e.t += dt;
        tileCollide(e, dt);
        if (e.t > 5 || e.y > VH + 60) e.dead = true;
        e.animT = (e.animT || 0) + dt * 3;
        break;
      }
      case 'fruit': {
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.hitWall) e.dir *= -1;
        e.vx = e.dir * 60;
        if (e.y > VH + 60) e.dead = true;
        if (!p.dead && overlap(e, p)) {
          e.dead = true;
          if (p.pw > 0) addScore(1000, e.x, e.y);
          else { p.pw = 1; popup(e.x, e.y - 10, '🍋', '#ffca28'); }
          sparkle(e.x + 10, e.y + 10, '#ffca28');
          sfx.power();
        }
        break;
      }
      case 'flame': {
        e.t += dt;
        e.y = e.base + Math.sin(e.t * 3) * 8 - Math.min(20, e.t * 30);
        if (!p.dead && overlap(e, p)) {
          e.dead = true; p.star = 8;
          popup(e.x, e.y - 10, '✨', '#7ae0f0');
          sfx.flame();
        }
        break;
      }
      case 'pepper': case 'tiger': {
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.hitWall) e.dir *= -1;
        e.vx = e.dir * (e.type === 'pepper' ? 55 : 50);
        if (e.y > VH + 60) e.dead = true;
        if (!p.dead && overlap(e, p)) {
          e.dead = true;
          const target = e.type === 'pepper' ? 2 : 3;
          if (p.pw === target) addScore(1000, e.x, e.y);
          else { p.pw = target; popup(e.x, e.y - 10, e.type === 'pepper' ? '🌶️' : '🐯', '#ffcf6e'); }
          sparkle(e.x + 10, e.y + 10, e.type === 'pepper' ? '#ff5d3c' : '#ffcf6e');
          sfx.power();
        }
        break;
      }
      case 'fb': { // 유자 불꽃 (바운드하며 전진)
        e.t += dt;
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.onG) { e.vy = -300; e.onG = false; }
        e.vx = e.dir * 360;
        if (e.hitWall || e.t > 2.5 || e.y > VH + 40) {
          e.dead = true; sparkle(e.x + 7, e.y + 7, '#ffab2e');
          break;
        }
        for (const o of ents) {
          if (o.dead || o === e) continue;
          if (['ghost', 'reaper', 'dok', 'egg', 'fox', 'hat'].includes(o.type) && overlap(e, o)) {
            killEnemy(o, 200, true); e.dead = true; break;
          }
          if ((o.type === 'boss' || o.type === 'jjojjo' || o.type === 'jjotank') && o.inv <= 0 && overlap(e, o)) {
            bossHurt(o); e.dead = true; break;
          }
        }
        break;
      }
      case 'blt': { // 쪼쪼 기관총탄 (직선탄)
        e.t += dt;
        e.x += e.vx * dt; e.y += e.vy * dt;
        const ctx2 = Math.floor((e.x + e.w / 2) / TILE), cty = Math.floor((e.y + e.h / 2) / TILE);
        if (SOLID[ti(ctx2, cty)] || e.t > 2.6 || e.y > VH + 40 || e.y < -40) {
          e.dead = true;
          if (e.t <= 2.6) sparkle(e.x + 5, e.y + 5, '#ffd34d');
        }
        break;
      }
      case 'coin': {
        if (!p.dead && overlap(e, p)) {
          e.dead = true;
          G.coins++; addScore(200, e.x + 10, e.y);
          sparkle(e.x + 10, e.y + 10);
          sfx.coin(); checkCoinLife();
        }
        break;
      }
      case 'tal': {
        e.grav = GRAV * 0.42;
        tileCollide(e, dt);
        if (e.onG || e.y > VH + 60) { e.dead = true; poof(e.x + 8, e.y + 8, '#f5e6b8'); }
        break;
      }
      case 'corpse': { // 사망 모션 (찌부·날아감)
        e.t += dt;
        if (e.fly) {
          e.vy += GRAV * 0.85 * dt;
          e.x += e.vx * dt; e.y += e.vy * dt;
        }
        if (e.t > (e.fly ? 1.1 : 0.55) || e.y > VH + 80) e.dead = true;
        break;
      }
      case 'shell': { // 탱크 포탄 (포물선)
        e.t += dt;
        e.grav = GRAV * 0.5;
        e.hitWall = 0;
        tileCollide(e, dt);
        if (e.onG || e.y > VH + 60 || e.t > 4) {
          e.dead = true; poof(e.x + 9, e.y + 9, '#ffa83c'); sfx.boom();
        }
        break;
      }
      case 'boss': updateBoss(e, dt); break;
      case 'jjojjo': updateJjojjo(e, dt); break;
      case 'jjotank': updateJjotank(e, dt); break;
    }
    // 플레이어 상호작용 (적 계열)
    if (!e.dead && !p.dead && ['ghost', 'reaper', 'dok', 'egg', 'fox', 'hat', 'tal', 'boss', 'jjojjo', 'jjotank', 'blt', 'shell'].includes(e.type)) {
      if (!overlap(e, p)) continue;
      if (e.type === 'hat' && e.t < 0.3) continue;
      const isBoss = e.type === 'boss' || e.type === 'jjojjo' || e.type === 'jjotank';
      const proj = e.type === 'tal' || e.type === 'blt' || e.type === 'shell';
      const stomp = p.vy > 130 && p.prevB <= e.y + 10 && !proj;
      if (stomp) {
        p.vy = keys.j ? -500 : -330;
        if (isBoss) { bossStomp(e); }
        else if (e.type === 'reaper') {
          e.dead = true;
          ents.push({ type: 'corpse', name: 'reaper', x: e.x, y: e.y, w: e.w, h: e.h, dir: e.dir || 1, t: 0, fly: false, vx: 0, vy: 0 });
          poof(e.x + 11, e.y + 10, '#cfd6de');
          addScore(100, e.x, e.y); sfx.stomp();
          ents.push({ type: 'hat', x: e.x, y: e.y + e.h - 16, w: 24, h: 15, dir: p.x + p.w / 2 > e.x + e.w / 2 ? -1 : 1, vy: 0, t: 0 });
        } else killEnemy(e, e.type === 'fox' ? 200 : e.type === 'hat' ? 100 : e.type === 'dok' ? 150 : 100);
      } else if (p.star > 0 && !isBoss) {
        killEnemy(e, 200, true);
      } else if (!isBoss || e.inv <= 0) {
        damagePlayer();
        if (e.type === 'blt' || e.type === 'shell') { e.dead = true; sparkle(e.x + 5, e.y + 5, '#ffd34d'); if (e.type === 'shell') sfx.boom(); }
      }
    }
  }
  ents = ents.filter(e => !e.dead);
}

/* ===== 보스: 염라대왕 ===== */
function updateBoss(e, dt) {
  const p = player;
  const ba = LV.bossArena;
  if (!ba || !ba.entered) return;
  e.inv = Math.max(0, e.inv - dt);
  if (e.stun > 0) { e.stun -= dt; e.vx = 0; tileCollide(e, dt); return; }
  e.dir = p.x > e.x ? 1 : -1;
  const speed = 55 + (e.maxHp - e.hp) * 22;
  e.vx = e.dir * speed;
  e.hitWall = 0;
  tileCollide(e, dt);
  e.animT = (e.animT || 0) + dt * (1 + (e.maxHp - e.hp) * 0.3);
  e.throwT -= dt;
  if (e.throwT <= 0) {
    e.throwT = Math.max(1.1, 2.4 - (e.maxHp - e.hp) * 0.28);
    const dx = (p.x - e.x), dist = Math.abs(dx);
    ents.push({
      type: 'tal', x: e.x + e.w / 2, y: e.y + 8, w: 18, h: 20,
      vx: Math.sign(dx) * Math.min(320, dist * 0.9), vy: -320, dir: e.dir,
    });
    sfx.throwP();
  }
}
function bossHurt(e) { // 공통 보스 피해 (밟기·불꽃)
  if (e.inv > 0) return;
  e.hp--; e.inv = 1.0;
  poof(e.x + e.w / 2, e.y + 8, '#ffd34d');
  addScore(500, e.x + e.w / 2, e.y);
  sfx.bossHit();
  if (e.hp <= 0) {
    e.dead = true;
    const col = e.type === 'jjojjo' ? '#7a2a8e' : e.type === 'jjotank' ? '#4a5060' : '#8a1a28';
    const n = e.type === 'jjotank' ? 7 : 4;
    for (let i = 0; i < n; i++)
      setTimeout(() => { poof(e.x + 10 + Math.random() * (e.w - 20), e.y + 10 + Math.random() * (e.h - 20), i % 2 ? col : '#ffd34d'); if (e.type === 'jjotank') sfx.boom(); }, i * 130);
    addScore(e.type === 'jjotank' ? 8000 : 5000, e.x + e.w / 2, e.y - 20);
    sfx.bossDie();
    LV.goalActive = true;
    bgmStart(false);
    G.msg = '👑'; G.msgT = 1.5;
  }
}
function bossStomp(e) {
  if (e.inv > 0) return;
  e.stun = 0.8;
  bossHurt(e);
}

/* ===== 최종보스: 쪼쪼(JJOJJO) 여왕 — 황금 기관총 연사 ===== */
function updateJjojjo(e, dt) {
  const p = player;
  const ba = LV.bossArena;
  if (!ba || !ba.entered) return;
  e.inv = Math.max(0, e.inv - dt);
  e.flash = Math.max(0, e.flash - dt);
  if (e.stun > 0) { e.stun -= dt; e.vx = 0; tileCollide(e, dt); return; }
  e.dir = p.x > e.x ? 1 : -1;
  if (e.burstN > 0) {
    // 연사 중: 정지 사격
    e.vx = 0;
    e.shotT -= dt;
    if (e.shotT <= 0) {
      e.shotT = 0.13; e.burstN--;
      const gy = e.y + 26;
      const dx = p.x + p.w / 2 - (e.x + e.w / 2), dy = p.y + p.h / 2 - gy;
      const d = Math.max(60, Math.hypot(dx, dy));
      const sp = 330;
      ents.push({
        type: 'blt', x: e.x + e.w / 2 + e.dir * 22, y: gy, w: 14, h: 8,
        vx: dx / d * sp, vy: dy / d * sp * 0.55 + (Math.random() - 0.5) * 55, t: 0, dir: e.dir,
      });
      e.flash = 0.1;
      sfx.shot();
    }
  } else {
    // 접근 (체력 줄수록 빠르고 연사 간격 단축)
    const speed = 40 + (e.maxHp - e.hp) * 14;
    e.vx = e.dir * speed;
    e.burstT -= dt;
    if (e.burstT <= 0) {
      e.burstT = Math.max(1.6, 3.0 - (e.maxHp - e.hp) * 0.22);
      e.burstN = 4 + Math.min(4, e.maxHp - e.hp); // 4~8발
      e.shotT = 0.3;
      sfx.throwP();
    }
  }
  e.animT = (e.animT || 0) + dt * 1.6;
  e.hitWall = 0;
  tileCollide(e, dt);
}

/* ===== 최종보스 II: 탱크를 탄 쪼쪼 — 포격 + 기관총 ===== */
function updateJjotank(e, dt) {
  const p = player;
  const ba = LV.bossArena;
  if (!ba || !ba.entered) return;
  e.inv = Math.max(0, e.inv - dt);
  e.flash = Math.max(0, e.flash - dt);
  if (e.stun > 0) { e.stun -= dt; e.vx = 0; tileCollide(e, dt); return; }
  e.dir = p.x > e.x ? 1 : -1;
  const hpLost = e.maxHp - e.hp;
  if (e.mgN > 0) {
    // 기관총 연사 (저체력 광폭화)
    e.vx = 0;
    e.shotT -= dt;
    if (e.shotT <= 0) {
      e.shotT = 0.12; e.mgN--;
      const gy = e.y + 16;
      const dx = p.x + p.w / 2 - (e.x + e.w / 2), dy = p.y + p.h / 2 - gy;
      const d = Math.max(60, Math.hypot(dx, dy));
      const sp = 350;
      ents.push({
        type: 'blt', x: e.x + e.w / 2 + e.dir * 34, y: gy, w: 14, h: 8,
        vx: dx / d * sp, vy: dy / d * sp * 0.5 + (Math.random() - 0.5) * 45, t: 0, dir: e.dir,
      });
      e.flash = 0.1; sfx.shot();
    }
  } else {
    // 전차 전진 (체력 줄수록 빠름)
    e.vx = e.dir * (28 + hpLost * 9);
    e.throwT -= dt;
    if (e.throwT <= 0) {
      e.throwT = Math.max(1.3, 2.8 - hpLost * 0.18);
      if (hpLost >= 3 && Math.random() < 0.42) {
        // 기관총 버스트
        e.mgN = 5 + Math.min(5, hpLost); e.shotT = 0.3; sfx.throwP();
      } else {
        // 대포 (포물선 포탄, 플레이어 거리 겨냥)
        const dx = p.x - e.x, dist = Math.abs(dx);
        ents.push({
          type: 'shell', x: e.x + e.w / 2 + e.dir * 40, y: e.y + 6, w: 18, h: 20,
          vx: Math.sign(dx) * Math.min(300, 90 + dist * 0.55), vy: -360, dir: e.dir, t: 0,
        });
        e.flash = 0.14; sfx.cannon();
      }
    }
  }
  e.animT = (e.animT || 0) + dt * (2 + hpLost * 0.25);
  e.hitWall = 0;
  tileCollide(e, dt);
}

/* ============================================================
   스토리 모드 (만화 컷씬) — 유자와 엄마 쪼쪼 여왕의 이야기
   ============================================================ */
const SCENE_DEFS = {
  intro: { bg: 'dawn', panels: [
    { a: [['uja0', 0.36, 170], ['uni', 0.63, 140]], sp: null },
    { a: [['uja0', 0.5, 190]], sp: 'uja' },
    { a: [['uja0', 0.34, 160], ['uni', 0.6, 135]], sp: null },
  ] },
  after5: { bg: 'palace', panels: [
    { a: [['uja0', 0.3, 140], ['boss', 0.65, 210]], sp: 'yeomra' },
    { a: [['boss', 0.56, 220]], sp: 'yeomra' },
    { a: [['uja0', 0.5, 170]], sp: null },
  ] },
  before10: { bg: 'skypal', panels: [
    { a: [['jjo', 0.6, 220]], sp: null },
    { a: [['uja0', 0.32, 150], ['jjo', 0.67, 210]], sp: 'uja' },
    { a: [['uja0', 0.3, 140], ['jjo', 0.65, 220]], sp: 'jjo' },
  ] },
  after10: { bg: 'skypal', panels: [
    { a: [['jjo', 0.55, 200]], sp: null },
    { a: [['jjo', 0.6, 215]], sp: 'jjo' },
  ] },
  ending: { bg: 'dawn2', panels: [
    { a: [['jjotank', 0.58, 210]], sp: null },
    { a: [['jjo', 0.58, 210]], sp: 'jjo' },
    { a: [['uja0', 0.42, 160], ['jjo', 0.61, 210]], sp: 'uja' },
    { a: [['uja0', 0.32, 150], ['jjo', 0.51, 200], ['uni', 0.73, 130]], sp: null },
  ] },
};
const SPEAKER_ACTOR = { uja: 'uja', jjo: 'jjo', yeomra: 'boss', uni: 'uni' };
let STORY = null; // {key, def, texts, idx, t, onEnd}
function playStory(key, onEnd) {
  const def = SCENE_DEFS[key], texts = (L.story || {})[key];
  if (!def || !texts) { onEnd(); return; }
  STORY = { key, def, texts, idx: 0, t: 0, onEnd };
  G.mode = 'story';
  document.body.classList.remove('playing');
  showScreen(null);
  bgmStart('story');
}
function storyNext() {
  if (!STORY) return;
  const txt = STORY.texts[STORY.idx] || '';
  if (STORY.t * 36 < txt.length) { STORY.t = 999; return; } // 타자 진행 중 → 전체 공개
  STORY.idx++; STORY.t = 0;
  if (STORY.idx >= STORY.def.panels.length) storyEnd();
}
function storyEnd() {
  if (!STORY) return;
  const cb = STORY.onEnd;
  STORY = null;
  G.mode = 'play'; // 스토리 모드 해제 (콜백이 startStage/finishGame으로 이어감)
  document.body.classList.add('playing');
  cb();
}
function wrapText(txt, x0, y0, maxW, lh) { // CJK 대응 글자 단위 줄바꿈
  let line = '', yy = y0;
  for (const ch of txt) {
    if (cx.measureText(line + ch).width > maxW) { cx.fillText(line, x0, yy); line = ch; yy += lh; }
    else line += ch;
  }
  if (line) cx.fillText(line, x0, yy);
}
function renderStory(nowS) {
  if (!STORY) return;
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.fillStyle = '#0b0812'; cx.fillRect(0, 0, SW, SH);
  cx.save();
  cx.translate(0, offY); cx.scale(scaleF, scaleF);
  const vw = viewW();
  const pn = STORY.def.panels[STORY.idx];
  if (!pn) { cx.restore(); return; }
  const mx = Math.min(70, vw * 0.07), my = 34;
  const px0 = mx, py0 = my, pw2 = vw - mx * 2, ph2 = VH - my * 2;
  // 패널 배경 (만화 컷)
  const bgc = { dawn: ['#2a3f6e', '#f2a56a'], palace: ['#38101c', '#883042'], skypal: ['#2a1040', '#6c2c80'], dawn2: ['#f7a75c', '#ffe9c8'] }[STORY.def.bg] || ['#223', '#446'];
  cx.save();
  cx.beginPath(); cx.roundRect(px0, py0, pw2, ph2, 14); cx.clip();
  const g = cx.createLinearGradient(0, py0, 0, py0 + ph2);
  g.addColorStop(0, bgc[0]); g.addColorStop(1, bgc[1]);
  cx.fillStyle = g; cx.fillRect(px0, py0, pw2, ph2);
  // 반짝이
  for (let i = 0; i < 14; i++) {
    const sx = px0 + ((i * 379) % pw2), sy = py0 + ((i * 173) % (ph2 * 0.55));
    cx.globalAlpha = 0.15 + ((Math.sin(nowS * 2 + i) + 1) / 2) * 0.5;
    cx.fillStyle = '#fff'; cx.fillRect(sx, sy, 2, 2);
  }
  cx.globalAlpha = 1;
  // 바닥 그림자 밴드
  cx.fillStyle = 'rgba(0,0,0,.22)';
  cx.fillRect(px0, py0 + ph2 - 24, pw2, 24);
  // 배우들 (호흡 바운스, 중앙을 바라봄)
  const floorY = py0 + ph2 - 16;
  const actorX = {};
  for (const [n, xr, hh] of pn.a) {
    const ax2 = px0 + pw2 * xr;
    actorX[n] = ax2;
    const bob = Math.sin(nowS * 2.2 + xr * 9) * 2.5;
    if (!hdDraw(n, ax2, floorY, hh + bob, xr < 0.5 ? 1 : -1, 0)) {
      cx.fillStyle = 'rgba(255,255,255,.25)';
      cx.beginPath(); cx.ellipse(ax2, floorY - hh / 2, hh * 0.28, hh / 2, 0, 0, 6.283); cx.fill();
    }
  }
  cx.restore();
  // 컷 테두리
  cx.strokeStyle = '#fff'; cx.lineWidth = 4;
  cx.beginPath(); cx.roundRect(px0, py0, pw2, ph2, 14); cx.stroke();
  // 대사/나레이션 (타자 효과)
  const full = STORY.texts[STORY.idx] || '';
  const shown = full.slice(0, Math.ceil(STORY.t * 36));
  cx.textAlign = 'left'; cx.textBaseline = 'middle';
  if (pn.sp) { // 말풍선 (상단)
    const bh = 72, bx3 = px0 + 20, bw3 = pw2 - 40, by3 = py0 + 16;
    cx.fillStyle = 'rgba(255,255,255,.97)';
    cx.beginPath(); cx.roundRect(bx3, by3, bw3, bh, 14); cx.fill();
    // 꼬리 → 화자 방향
    const actor = SPEAKER_ACTOR[pn.sp];
    let tx2 = px0 + pw2 / 2;
    for (const k of Object.keys(actorX)) if (k.startsWith(actor)) tx2 = actorX[k];
    tx2 = Math.max(bx3 + 30, Math.min(bx3 + bw3 - 30, tx2));
    cx.beginPath();
    cx.moveTo(tx2 - 10, by3 + bh); cx.lineTo(tx2 + 8, by3 + bh); cx.lineTo(tx2, by3 + bh + 15);
    cx.closePath(); cx.fill();
    cx.fillStyle = '#c2405a'; cx.font = '900 13px sans-serif';
    cx.fillText(L.chars[pn.sp], bx3 + 16, by3 + 17);
    cx.fillStyle = '#211a1e'; cx.font = '700 15px sans-serif';
    wrapText(shown, bx3 + 16, by3 + 42, bw3 - 32, 19);
  } else { // 나레이션 (하단)
    const bh = 58, bx3 = px0 + 26, bw3 = pw2 - 52, by3 = py0 + ph2 - bh - 14;
    cx.fillStyle = 'rgba(10,8,18,.8)';
    cx.beginPath(); cx.roundRect(bx3, by3, bw3, bh, 10); cx.fill();
    cx.strokeStyle = 'rgba(255,226,138,.55)'; cx.lineWidth = 1.5; cx.stroke();
    cx.fillStyle = '#ffeccc'; cx.font = 'italic 700 15px sans-serif';
    wrapText(shown, bx3 + 16, by3 + 21, bw3 - 32, 19);
  }
  // 힌트/스킵/컷 번호
  cx.font = '800 12px sans-serif';
  cx.textAlign = 'right';
  cx.globalAlpha = 0.4 + ((Math.sin(nowS * 4) + 1) / 2) * 0.6;
  cx.fillStyle = '#fff';
  cx.fillText(L.storyHint, px0 + pw2 - 10, py0 + ph2 + 16);
  cx.globalAlpha = 0.7;
  cx.textAlign = 'left';
  cx.fillText(L.storySkip, px0 + 10, py0 + ph2 + 16);
  cx.globalAlpha = 1;
  cx.textAlign = 'center'; cx.fillStyle = '#ffe28a';
  cx.fillText(`${STORY.idx + 1} / ${STORY.def.panels.length}`, px0 + pw2 / 2, py0 - 12);
  cx.restore();
}

/* ===== 스테이지 플로우 ===== */
function startStage(n, isRespawn) {
  G.stage = n;
  LV = genLevel(n);
  spawnEnts();
  player = mkPlayer(3 * TILE, (ROWS - 4) * TILE);
  G.time = 300; G.introT = 1.7; G.clearT = 0;
  cam.x = 0;
  particles.length = 0; popups.length = 0; bumps.length = 0;
  try { localStorage.setItem(GAME_KEY, JSON.stringify({ v: 1, stage: n, lives: G.lives, score: G.score, coins: G.coins })); } catch (e) {}
  if (!isRespawn) sfxSafeClearMsg();
  bgmStart(false);
  updateHUD();
}
function sfxSafeClearMsg() { /* 자리표시 */ }
function stageClear() {
  const bonus = Math.ceil(G.time) * 5;
  G.score += 1000 + bonus;
  G.clearT = 2.6;
  G.msg = `${L.stageClear} +${1000 + bonus}`; G.msgT = 2.4;
  sfx.clear();
  bgmStop();
}
function afterClear() {
  // 스토리 컷씬: 5(염라·출입권)→6, 9→10(엄마와 재회), 10(1차전 후)→11, 15=엔딩
  if (G.stage === 5) playStory('after5', () => startStage(6));
  else if (G.stage === 9) playStory('before10', () => startStage(10));
  else if (G.stage === 10) playStory('after10', () => startStage(11));
  else if (G.stage >= 15) playStory('ending', () => { G.won = true; finishGame(true); });
  else startStage(G.stage + 1);
}
function finishGame(won) {
  if (G.recorded) return;
  G.recorded = true;
  const isBest = addRecord(G.score, G.stage);
  try { localStorage.removeItem(GAME_KEY); } catch (e) {}
  G.mode = 'results';
  document.body.classList.remove('playing');
  bgmStop();
  if (won) sfx.clear();
  document.getElementById('resT').textContent = won ? L.worldClear : L.gameOver;
  document.getElementById('resStats').innerHTML =
    `${L.finalScore}: <span class="big">${G.score.toLocaleString()}</span><br>` +
    `${L.reachedStage}: ${L.stageLbl} ${G.stage} · ${L.stages[G.stage - 1]}` +
    (isBest && G.score > 0 ? `<br>${L.newRecord}` : '');
  document.getElementById('resPanel').innerHTML = recordsTable();
  showScreen('results');
}

/* ===== 업데이트 (고정 스텝) ===== */
function update(dt) {
  if (G.introT > 0) { G.introT -= dt; return; }
  if (G.clearT > 0) {
    G.clearT -= dt;
    for (let i = particles.length - 1; i >= 0; i--) stepParticle(particles[i], dt, i);
    if (G.clearT <= 0) afterClear();
    return;
  }
  G.msgT = Math.max(0, G.msgT - dt);
  if (!player.dead) {
    G.time -= dt;
    if (G.time <= 0) { G.time = 0; G.msg = L.timeUp; G.msgT = 1.5; player.pw = 0; player.riding = false; player.dead = true; player.deadT = 0.8; sfx.die(); bgmStop(); }
  }
  updatePlayer(dt);
  updateEnts(dt);
  for (let i = bumps.length - 1; i >= 0; i--) { bumps[i].t += dt; if (bumps[i].t > 0.24) bumps.splice(i, 1); }
  for (let i = particles.length - 1; i >= 0; i--) stepParticle(particles[i], dt, i);
  for (let i = popups.length - 1; i >= 0; i--) { popups[i].t += dt; popups[i].y -= 40 * dt; if (popups[i].t > 0.9) popups.splice(i, 1); }
  // 카메라
  const vw = viewW();
  let target = player.x - vw * 0.38;
  const ba = LV.bossArena;
  let lo = 0, hi = LV.W * TILE - vw;
  if (ba && ba.entered) { lo = Math.max(lo, ba.x0 - 20); hi = Math.min(hi, ba.x1 - vw + 20); }
  cam.x += (Math.max(lo, Math.min(hi, target)) - cam.x) * Math.min(1, dt * 9);
  updateHUD();
}
function stepParticle(p, dt, i) {
  p.t += dt;
  if (p.t >= p.life) { particles.splice(i, 1); return; }
  p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
}

/* ============================================================
   렌더링
   ============================================================ */
const cvs = document.getElementById('game');
const cx = cvs.getContext('2d');
let SW = 0, SH = 0, DPR = 1, scaleF = 1, offY = 0;
function layout() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  SW = window.innerWidth; SH = window.innerHeight;
  cvs.width = SW * DPR; cvs.height = SH * DPR;
  cvs.style.width = SW + 'px'; cvs.style.height = SH + 'px';
  scaleF = SH / VH;
  if (SW / scaleF < 460) scaleF = SW / 460;
  offY = (SH - VH * scaleF) / 2;
}
function viewW() { return SW / scaleF; }
function flip(spr, x, y, w, h, dir) {
  if (dir >= 0) cx.drawImage(spr, x, y, w, h);
  else { cx.save(); cx.translate(x + w, y); cx.scale(-1, 1); cx.drawImage(spr, 0, 0, w, h); cx.restore(); }
}
function drawBG(th, vw, t) {
  const g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
  cx.fillStyle = g; cx.fillRect(0, 0, vw, VH);
  // 해/달
  if (th.moon) {
    cx.fillStyle = '#f5edc8';
    cx.beginPath(); cx.arc(vw - 90, 80, 30, 0, 6.283); cx.fill();
    cx.fillStyle = th.sky[0];
    cx.beginPath(); cx.arc(vw - 78, 72, 26, 0, 6.283); cx.fill();
    cx.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 14; i++) {
      const sx = ((i * 421 + 60) % (vw + 80)) - 40, sy = (i * 173) % 200 + 12;
      cx.fillRect(sx, sy, 2, 2);
    }
  } else if (th.light >= 0.9) {
    cx.fillStyle = th.deco === 'pine' || th.sea ? '#ff8c4a' : '#ffe082';
    cx.beginPath(); cx.arc(vw - 90, 78, 26, 0, 6.283); cx.fill();
  }
  // 바다 (노을 수평선 + 물결 반짝임)
  if (th.sea) {
    const sg = cx.createLinearGradient(0, VH - 220, 0, VH);
    sg.addColorStop(0, '#f0a05a'); sg.addColorStop(0.35, '#d06a48'); sg.addColorStop(1, '#8a3a4a');
    cx.fillStyle = sg; cx.fillRect(0, VH - 220, vw, 220);
    cx.strokeStyle = 'rgba(255,230,170,.5)'; cx.lineWidth = 2;
    for (let k = 0; k < 7; k++) {
      const wy = VH - 200 + k * 26;
      const wx = ((k * 173 + t * (14 + k * 4)) % (vw + 120)) - 60;
      cx.beginPath(); cx.moveTo(wx, wy); cx.quadraticCurveTo(wx + 22, wy - 3, wx + 44, wy); cx.stroke();
    }
    // 노을 윤슬 (해 반사)
    cx.fillStyle = 'rgba(255,200,120,.35)';
    for (let k = 0; k < 5; k++) cx.fillRect(vw - 110 + (k % 3) * 14, VH - 210 + k * 34, 44 - k * 6, 3);
  }
  // 원경 산 (2겹 시차)
  for (const [par, col, hbase] of [[0.18, th.hill2, 190], [0.36, th.hill, 130]]) {
    cx.fillStyle = col;
    const off = cam.x * par;
    cx.beginPath();
    cx.moveTo(0, VH);
    for (let sx = -60; sx <= vw + 60; sx += 30) {
      const wx = sx + off;
      const hh = hbase + Math.sin(wx * 0.008) * 46 + Math.sin(wx * 0.021) * 22;
      cx.lineTo(sx, VH - hh);
    }
    cx.lineTo(vw, VH); cx.closePath(); cx.fill();
  }
  // 테마 장식 (시차 0.55)
  const par = 0.55, off = cam.x * par;
  const step = 260;
  for (let k = Math.floor(off / step) - 1; k < (off + vw) / step + 1; k++) {
    const bx = k * step - off + (k % 3) * 40;
    const by = VH - 96;
    if (th.deco === 'hut') { // 초가집
      cx.fillStyle = '#c8a06a'; cx.fillRect(bx + 8, by + 28, 44, 26);
      cx.fillStyle = '#8a6a3a'; cx.fillRect(bx + 24, by + 40, 12, 14);
      cx.fillStyle = '#d8b878';
      cx.beginPath(); cx.moveTo(bx, by + 30); cx.quadraticCurveTo(bx + 30, by - 2, bx + 60, by + 30); cx.closePath(); cx.fill();
    } else if (th.deco === 'pine') { // 소나무
      cx.fillStyle = '#6a4a2a'; cx.fillRect(bx + 26, by + 10, 8, 46);
      cx.fillStyle = '#2e5e3a';
      for (let l = 0; l < 3; l++) {
        cx.beginPath(); cx.ellipse(bx + 30 - l * 8, by + 6 + l * 12, 22 - l * 4, 9, 0, 0, 6.283); cx.fill();
        cx.beginPath(); cx.ellipse(bx + 42 + l * 4, by + 14 + l * 10, 16, 7, 0, 0, 6.283); cx.fill();
      }
    } else if (th.deco === 'roof') { // 기와 지붕
      cx.fillStyle = '#141c3a';
      cx.beginPath(); cx.moveTo(bx - 6, by + 34); cx.quadraticCurveTo(bx + 30, by + 20, bx + 66, by + 34);
      cx.lineTo(bx + 58, by + 46); cx.quadraticCurveTo(bx + 30, by + 36, bx + 2, by + 46); cx.closePath(); cx.fill();
      cx.fillStyle = '#0e1430'; cx.fillRect(bx + 10, by + 44, 40, 14);
    } else if (th.deco === 'spirit') { // 도깨비불 원경
      cx.fillStyle = 'rgba(120,220,240,.16)';
      cx.beginPath(); cx.arc(bx + 30, by + Math.sin((t + k) * 1.4) * 14 + 8, 9, 0, 6.283); cx.fill();
      cx.fillStyle = 'rgba(120,220,240,.28)';
      cx.beginPath(); cx.arc(bx + 30, by + Math.sin((t + k) * 1.4) * 14 + 8, 4, 0, 6.283); cx.fill();
    } else if (th.deco === 'palace') { // 궁궐 기둥
      cx.fillStyle = '#58101c'; cx.fillRect(bx + 12, by - 30, 14, 88);
      cx.fillStyle = '#701824'; cx.fillRect(bx + 4, by - 40, 30, 12);
      cx.fillStyle = '#ffd34d'; cx.fillRect(bx + 16, by - 36, 6, 4);
    } else if (th.deco === 'bamboo') { // 대나무 숲
      for (let b2 = 0; b2 < 3; b2++) {
        const sx2 = bx + b2 * 16, hh2 = 90 + (b2 % 2) * 24;
        cx.fillStyle = b2 % 2 ? '#5e9e52' : '#6fae5e';
        cx.fillRect(sx2, by + 56 - hh2, 6, hh2);
        cx.fillStyle = '#4a8a42';
        for (let n = 1; n < 4; n++) cx.fillRect(sx2 - 0.5, by + 56 - hh2 * n / 4, 7, 2);
        cx.strokeStyle = '#6fae5e'; cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(sx2 + 3, by + 56 - hh2 + 8); cx.quadraticCurveTo(sx2 + 16, by + 46 - hh2, sx2 + 22, by + 50 - hh2); cx.stroke();
      }
      // 매화 가지
      cx.strokeStyle = '#7a5238'; cx.lineWidth = 2.4;
      cx.beginPath(); cx.moveTo(bx + 48, by + 56); cx.quadraticCurveTo(bx + 54, by + 10, bx + 66, by - 2); cx.stroke();
      cx.fillStyle = '#ffc0d4';
      for (let n = 0; n < 5; n++) { cx.beginPath(); cx.arc(bx + 56 + n * 3.2, by + 22 - n * 6, 3, 0, 6.283); cx.fill(); }
    } else if (th.deco === 'snowpine') { // 눈 덮인 소나무
      cx.fillStyle = '#5a4430'; cx.fillRect(bx + 26, by + 10, 8, 46);
      for (let l = 0; l < 3; l++) {
        cx.fillStyle = '#2e5e46';
        cx.beginPath(); cx.ellipse(bx + 30, by + 8 + l * 13, 22 - l * 5, 9, 0, 0, 6.283); cx.fill();
        cx.fillStyle = '#f4f8ff';
        cx.beginPath(); cx.ellipse(bx + 30, by + 4 + l * 13, 20 - l * 5, 4.6, 0, 0, 6.283); cx.fill();
      }
      // 눈사람
      if (k % 3 === 0) {
        cx.fillStyle = '#fff';
        cx.beginPath(); cx.arc(bx + 62, by + 48, 8, 0, 6.283); cx.fill();
        cx.beginPath(); cx.arc(bx + 62, by + 36, 5.6, 0, 6.283); cx.fill();
        cx.fillStyle = '#241a16';
        cx.beginPath(); cx.arc(bx + 60, by + 35, 0.9, 0, 6.283); cx.arc(bx + 64, by + 35, 0.9, 0, 6.283); cx.fill();
        cx.fillStyle = '#f08a1a';
        cx.beginPath(); cx.moveTo(bx + 62, by + 37); cx.lineTo(bx + 67, by + 38); cx.lineTo(bx + 62, by + 39); cx.closePath(); cx.fill();
      }
    } else if (th.deco === 'wave') { // 바닷가: 갈매기 + 돛단배
      cx.strokeStyle = 'rgba(60,40,50,.8)'; cx.lineWidth = 2;
      const gy2 = by - 60 + Math.sin((t + k) * 1.1) * 8;
      cx.beginPath(); cx.moveTo(bx + 10, gy2); cx.quadraticCurveTo(bx + 16, gy2 - 6, bx + 22, gy2); cx.stroke();
      cx.beginPath(); cx.moveTo(bx + 22, gy2); cx.quadraticCurveTo(bx + 28, gy2 - 6, bx + 34, gy2); cx.stroke();
      if (k % 3 === 1) { // 돛단배
        const byb = by + 26 + Math.sin((t * 0.7 + k)) * 3;
        cx.fillStyle = '#5a3a28';
        cx.beginPath(); cx.moveTo(bx + 6, byb); cx.lineTo(bx + 46, byb); cx.lineTo(bx + 38, byb + 9); cx.lineTo(bx + 14, byb + 9); cx.closePath(); cx.fill();
        cx.fillStyle = '#f5ead0';
        cx.beginPath(); cx.moveTo(bx + 26, byb - 30); cx.lineTo(bx + 26, byb - 2); cx.lineTo(bx + 8, byb - 2); cx.closePath(); cx.fill();
        cx.beginPath(); cx.moveTo(bx + 29, byb - 26); cx.lineTo(bx + 29, byb - 2); cx.lineTo(bx + 43, byb - 2); cx.closePath(); cx.fill();
      }
    } else if (th.deco === 'cloudsea') { // 구름바다
      cx.fillStyle = 'rgba(255,255,255,.9)';
      const cy2 = by + 46 + Math.sin((t * 0.5 + k)) * 4;
      cx.beginPath();
      cx.arc(bx + 14, cy2, 16, 0, 6.283); cx.arc(bx + 38, cy2 - 8, 20, 0, 6.283); cx.arc(bx + 62, cy2, 15, 0, 6.283);
      cx.fill();
      cx.fillStyle = 'rgba(190,215,245,.7)';
      cx.beginPath(); cx.arc(bx + 38, cy2 + 6, 24, 0, Math.PI); cx.fill();
    } else if (th.deco === 'palace2') { // 쪼쪼 하늘궁전: 황금 기둥 + 비단 휘장
      cx.fillStyle = '#c89020'; cx.fillRect(bx + 12, by - 34, 14, 92);
      cx.fillStyle = '#ffd34d'; cx.fillRect(bx + 14.5, by - 34, 3.5, 92);
      cx.fillStyle = '#e8b030'; cx.fillRect(bx + 4, by - 44, 30, 12);
      cx.fillStyle = '#7a2a8e';
      cx.beginPath();
      cx.moveTo(bx + 40, by - 40); cx.quadraticCurveTo(bx + 44 + Math.sin(t + k) * 3, by - 4, bx + 40, by + 26);
      cx.lineTo(bx + 50, by + 20); cx.quadraticCurveTo(bx + 52 + Math.sin(t + k) * 3, by - 8, bx + 48, by - 40);
      cx.closePath(); cx.fill();
      cx.fillStyle = '#ffd34d';
      cx.beginPath(); cx.arc(bx + 44, by - 40, 3, 0, 6.283); cx.fill();
    } else if (th.deco === 'cherry') { // 왕벚꽃 나무
      cx.fillStyle = '#7a5238'; cx.fillRect(bx + 26, by + 6, 8, 50);
      cx.strokeStyle = '#7a5238'; cx.lineWidth = 3;
      cx.beginPath(); cx.moveTo(bx + 30, by + 24); cx.lineTo(bx + 18, by + 12); cx.moveTo(bx + 30, by + 20); cx.lineTo(bx + 44, by + 8); cx.stroke();
      for (const [cxp, cyp, r] of [[bx + 30, by + 2, 16], [bx + 16, by + 12, 11], [bx + 46, by + 8, 12], [bx + 34, by + 16, 10]]) {
        cx.fillStyle = '#ffc0d8'; cx.beginPath(); cx.arc(cxp, cyp, r, 0, 6.283); cx.fill();
        cx.fillStyle = '#ffd8e8'; cx.beginPath(); cx.arc(cxp - r * 0.3, cyp - r * 0.3, r * 0.5, 0, 6.283); cx.fill();
      }
    } else if (th.deco === 'volcano') { // 화산 원경 (용암 흘러내림)
      cx.fillStyle = '#2c0e0a';
      cx.beginPath(); cx.moveTo(bx - 10, by + 58); cx.lineTo(bx + 30, by - 30); cx.lineTo(bx + 70, by + 58); cx.closePath(); cx.fill();
      cx.fillStyle = '#ff5a1e';
      cx.beginPath(); cx.moveTo(bx + 22, by - 22); cx.lineTo(bx + 30, by - 30); cx.lineTo(bx + 38, by - 22);
      cx.lineTo(bx + 34, by - 12); cx.lineTo(bx + 26, by - 12); cx.closePath(); cx.fill();
      cx.strokeStyle = '#ff7a2e'; cx.lineWidth = 2;
      cx.beginPath(); cx.moveTo(bx + 30, by - 14); cx.lineTo(bx + 26, by + 20); cx.stroke();
      cx.fillStyle = 'rgba(255,120,40,.5)';
      cx.beginPath(); cx.arc(bx + 30, by - 30, 5 + Math.sin(t * 3 + k) * 2, 0, 6.283); cx.fill();
    } else if (th.deco === 'lighthouse') { // 등대 + 갈매기
      cx.fillStyle = '#f4ede0'; cx.fillRect(bx + 22, by - 34, 14, 90);
      cx.fillStyle = '#d84838';
      for (let s2 = 0; s2 < 4; s2++) cx.fillRect(bx + 22, by - 34 + s2 * 24, 14, 12);
      cx.fillStyle = '#2a2e3a'; cx.fillRect(bx + 20, by - 44, 18, 12);
      cx.fillStyle = '#ffe9a8';
      cx.beginPath(); cx.arc(bx + 29, by - 38, 5, 0, 6.283); cx.fill();
      cx.fillStyle = 'rgba(255,233,168,.3)';
      cx.beginPath(); cx.moveTo(bx + 29, by - 38); cx.lineTo(bx + 70, by - 52); cx.lineTo(bx + 70, by - 24); cx.closePath(); cx.fill();
    } else if (th.deco === 'fortress') { // 강철 요새 (성벽 + 대포)
      cx.fillStyle = '#2c3040'; cx.fillRect(bx, by + 4, 68, 54);
      cx.fillStyle = '#3a3e50';
      for (let s2 = 0; s2 < 5; s2++) cx.fillRect(bx + s2 * 14, by - 4, 8, 8);
      cx.strokeStyle = '#1c2028'; cx.lineWidth = 1.4;
      for (let s2 = 1; s2 < 4; s2++) { cx.beginPath(); cx.moveTo(bx, by + 4 + s2 * 14); cx.lineTo(bx + 68, by + 4 + s2 * 14); cx.stroke(); }
      cx.fillStyle = '#c89020'; cx.fillRect(bx + 28, by + 24, 12, 34); // 금 성문
      cx.fillStyle = '#1a1c24';
      cx.beginPath(); cx.arc(bx + 34, by + 24, 6, Math.PI, 0); cx.fill();
      cx.fillRect(bx + 28, by + 24, 12, 20);
    }
  }
  // 구름 (밝은 테마)
  if (th.light >= 0.9) {
    cx.fillStyle = 'rgba(255,255,255,.85)';
    const coff = cam.x * 0.1 + t * 8;
    for (let k = 0; k < 4; k++) {
      const cxp = ((k * 340 + 80 - coff) % (vw + 200) + vw + 200) % (vw + 200) - 100;
      const cyp = 46 + (k % 3) * 34;
      cx.beginPath();
      cx.arc(cxp, cyp, 15, 0, 6.283); cx.arc(cxp + 18, cyp - 7, 12, 0, 6.283); cx.arc(cxp + 34, cyp, 13, 0, 6.283);
      cx.fill();
    }
  }
  // 오로라 (빙하 테마) — 상단 물결 리본
  if (th.aurora) {
    for (let b2 = 0; b2 < 3; b2++) {
      const col = ['rgba(120,240,200,', 'rgba(150,180,255,', 'rgba(220,150,255,'][b2];
      cx.strokeStyle = col + (0.14 + 0.06 * Math.sin(t * 0.7 + b2)) + ')';
      cx.lineWidth = 18 - b2 * 4;
      cx.beginPath();
      for (let sx = -20; sx <= vw + 20; sx += 24) {
        const yy = 40 + b2 * 26 + Math.sin(sx * 0.012 + t * 0.6 + b2) * 22 + Math.sin(sx * 0.03 - t) * 8;
        sx === -20 ? cx.moveTo(sx, yy) : cx.lineTo(sx, yy);
      }
      cx.stroke();
    }
  }
  // 용암 협곡 (화산 테마) — 하단 붉은 광원
  if (th.lava) {
    const lg = cx.createLinearGradient(0, VH - 90, 0, VH);
    lg.addColorStop(0, 'rgba(255,90,20,0)'); lg.addColorStop(1, 'rgba(255,90,20,.35)');
    cx.fillStyle = lg; cx.fillRect(0, VH - 90, vw, 90);
  }
  // 어두운 테마 비네트
  if (th.light < 0.8) {
    cx.fillStyle = `rgba(6,4,14,${(0.8 - th.light) * 0.8})`;
    cx.fillRect(0, 0, vw, VH);
  }
  drawAmbient(th, vw, t);
}
/* 앰비언트 파티클 (상태 없는 시간 함수 — 나비·낙엽·꽃잎·눈·윤슬·바람·금가루·불티) */
function drawAmbient(th, vw, t) {
  if (!th.amb) return;
  if (th.amb === 'butterfly') {
    for (let i = 0; i < 4; i++) {
      const bx2 = ((i * 331 + t * (18 + i * 6)) % (vw + 80)) - 40;
      const by2 = 120 + (i * 97) % 200 + Math.sin(t * 2 + i * 2) * 24;
      const flap = Math.abs(Math.sin(t * 9 + i)) * 0.8 + 0.2;
      cx.fillStyle = i % 2 ? '#ffb0c8' : '#ffe28a';
      cx.beginPath(); cx.ellipse(bx2 - 3 * flap, by2, 3.4 * flap, 4, 0.5, 0, 6.283); cx.fill();
      cx.beginPath(); cx.ellipse(bx2 + 3 * flap, by2, 3.4 * flap, 4, -0.5, 0, 6.283); cx.fill();
      cx.fillStyle = '#5a3a2a'; cx.fillRect(bx2 - 0.8, by2 - 3.4, 1.6, 7);
    }
    return;
  }
  const N = th.amb === 'wind' ? 6 : 14;
  for (let i = 0; i < N; i++) {
    const seedX = (i * 467) % 900, seedY = (i * 211) % 480;
    if (th.amb === 'petal' || th.amb === 'leaf' || th.amb === 'snow') {
      const fall = th.amb === 'snow' ? 34 + (i % 4) * 10 : 26 + (i % 4) * 8;
      const py2 = ((seedY + t * fall) % (VH + 40)) - 20;
      const px2 = ((seedX + Math.sin(t * 1.1 + i) * 30 - cam.x * 0.2) % (vw + 60) + vw + 60) % (vw + 60) - 30;
      if (th.amb === 'snow') {
        cx.fillStyle = 'rgba(255,255,255,.85)';
        cx.beginPath(); cx.arc(px2, py2, 1.6 + (i % 3) * 0.8, 0, 6.283); cx.fill();
      } else {
        cx.fillStyle = th.amb === 'petal' ? 'rgba(255,182,206,.9)' : 'rgba(214,150,66,.85)';
        cx.save(); cx.translate(px2, py2); cx.rotate(t * 2 + i);
        cx.beginPath(); cx.ellipse(0, 0, 3, 1.7, 0, 0, 6.283); cx.fill();
        cx.restore();
      }
    } else if (th.amb === 'sparkle') {
      const tw = (Math.sin(t * 3 + i * 2.1) + 1) / 2;
      cx.fillStyle = `rgba(255,226,138,${0.25 + tw * 0.5})`;
      const px2 = (seedX % vw), py2 = VH - 230 + (seedY % 90);
      cx.fillRect(px2 - 2 - tw, py2, 4 + tw * 2, 1.6);
    } else if (th.amb === 'wind') {
      const px2 = ((seedX + t * 130) % (vw + 200)) - 100;
      const py2 = 60 + (seedY % 300) + Math.sin(t + i) * 10;
      cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1.6;
      cx.beginPath(); cx.moveTo(px2, py2); cx.quadraticCurveTo(px2 + 24, py2 - 4, px2 + 48, py2); cx.stroke();
    } else if (th.amb === 'gold' || th.amb === 'ember') {
      const rise = th.amb === 'ember';
      const py2 = rise
        ? VH - (((seedY + t * 26) % (VH + 40)) - 20)
        : ((seedY + t * 20) % (VH + 40)) - 20;
      const px2 = ((seedX + Math.sin(t * 1.3 + i) * 18) % (vw + 40) + vw + 40) % (vw + 40) - 20;
      const tw = (Math.sin(t * 4 + i * 1.7) + 1) / 2;
      cx.fillStyle = rise ? `rgba(255,160,80,${0.25 + tw * 0.45})` : `rgba(255,211,77,${0.3 + tw * 0.5})`;
      cx.save(); cx.translate(px2, py2); cx.rotate(t * 3 + i);
      cx.fillRect(-1.6, -1.6, 3.2, 3.2);
      cx.restore();
    }
  }
}
const SHADOWED = new Set(['ghost', 'reaper', 'dok', 'fox', 'uni', 'uniFlee', 'boss', 'jjojjo', 'jjotank', 'fruit', 'pepper', 'tiger']);
/* HD 스프라이트 드로잉: 발밑 중앙 앵커·비율 유지·방향/기울기 지원. 미로드 시 false */
function hdDraw(name, cxp, bottomY, targetH, faceDir, rot) {
  const im = HD[name];
  if (!im) return false;
  const w = targetH * im.width / im.height;
  const mirror = (HD_FACE[name] === 1) ? faceDir < 0 : faceDir > 0;
  cx.save();
  cx.translate(cxp, bottomY);
  if (rot) cx.rotate(rot);
  if (mirror) cx.scale(-1, 1);
  cx.drawImage(im, -w / 2, -targetH, w, targetH);
  cx.restore();
  return true;
}
function render(nowS) {
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.fillStyle = '#08060e'; cx.fillRect(0, 0, SW, SH);
  if (G.mode !== 'play' && G.mode !== 'results' || !LV) {
    if (LV && G.mode === 'menu') { /* 메뉴 배경으로 스테이지1 풍경 */ } else return;
  }
  if (!LV) return;
  cx.save();
  cx.translate(0, offY); cx.scale(scaleF, scaleF);
  cx.beginPath(); cx.rect(0, 0, viewW(), VH); cx.clip();
  const vw = viewW();
  const th = LV.theme;
  drawBG(th, vw, nowS);
  cx.imageSmoothingEnabled = true;
  const camX = cam.x;
  // 타일
  const tx0 = Math.max(0, Math.floor(camX / TILE) - 1), tx1 = Math.min(LV.W - 1, Math.ceil((camX + vw) / TILE) + 1);
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const v = LV.t[ty * LV.W + tx];
      if (!v) continue;
      let by = 0;
      for (const b of bumps) if (b.tx === tx && b.ty === ty) by = -Math.sin(b.t / 0.24 * Math.PI) * 8;
      const spr = v === 1 ? (SPR.ground[th.ground] || SPR.ground.grass) : SPR.tile[v];
      cx.drawImage(spr, tx * TILE - camX, ty * TILE + by, TILE, TILE);
    }
  }
  // 장식 (등불·꽃·풀숲)
  for (const d of LV.deco) {
    const dx = d.x * TILE - camX;
    if (dx < -40 || dx > vw + 40) continue;
    if (d.k === 'flower') {
      cx.drawImage(SPR.flower[(d.v || 0) % 2], dx + 8, (d.y + 1) * TILE - 18, 16, 18);
      continue;
    }
    if (d.k === 'grass') {
      cx.drawImage(SPR.grass[0], dx + 8, (d.y + 1) * TILE - 12, 16, 12);
      continue;
    }
    if (th.lanterns || th.light < 0.8) {
      const gg = cx.createRadialGradient(dx + 10, d.y * TILE + 16, 2, dx + 10, d.y * TILE + 16, 46);
      gg.addColorStop(0, 'rgba(255,214,120,.4)'); gg.addColorStop(1, 'rgba(255,214,120,0)');
      cx.fillStyle = gg;
      cx.beginPath(); cx.arc(dx + 10, d.y * TILE + 16, 46, 0, 6.283); cx.fill();
    }
    cx.drawImage(SPR.lantern[0], dx, d.y * TILE, 20, 28);
  }
  // 골 깃대 (마리오식 — 깃발이 플레이어와 함께 하강)
  if (LV.goalActive) {
    const gx = LV.goalX - camX + 8;
    const base = VH - 2 * TILE, poleTop = base - 7 * TILE;
    // 받침돌
    cx.fillStyle = '#8a8f9a';
    cx.beginPath(); cx.roundRect(gx - 8, base - 8, 16, 8, 3); cx.fill();
    // 기둥 (금속 광택)
    const pg = cx.createLinearGradient(gx - 2.5, 0, gx + 2.5, 0);
    pg.addColorStop(0, '#e8f0e8'); pg.addColorStop(0.5, '#9aa89a'); pg.addColorStop(1, '#5a685a');
    cx.fillStyle = pg;
    cx.fillRect(gx - 2.5, poleTop, 5, base - poleTop - 6);
    // 꼭대기 금구슬
    const bg3 = cx.createRadialGradient(gx - 2, poleTop - 6, 1, gx, poleTop - 4, 7);
    bg3.addColorStop(0, '#fff0b0'); bg3.addColorStop(1, '#d8a020');
    cx.fillStyle = bg3;
    cx.beginPath(); cx.arc(gx, poleTop - 4, 6, 0, 6.283); cx.fill();
    // 깃발 (플레이어 슬라이드 시 함께 하강 + 펄럭임)
    const fy = (player && player.flag) ? Math.max(poleTop + 4, Math.min(player.y + 2, base - 40)) : poleTop + 4;
    const wav = Math.sin(nowS * 7) * 2.5;
    cx.fillStyle = '#e8556a';
    cx.beginPath();
    cx.moveTo(gx - 2, fy);
    cx.quadraticCurveTo(gx - 16, fy + 5 + wav * 0.4, gx - 30 + wav, fy + 11);
    cx.lineTo(gx - 2, fy + 22);
    cx.closePath(); cx.fill();
    cx.fillStyle = '#ffd34d'; // 유자 문양
    cx.beginPath(); cx.arc(gx - 13, fy + 11, 4, 0, 6.283); cx.fill();
    cx.fillStyle = '#7aa834';
    cx.beginPath(); cx.ellipse(gx - 10.5, fy + 6.5, 2.4, 1.2, 0.6, 0, 6.283); cx.fill();
  }
  // 엔티티
  for (const e of ents) {
    const ex = e.x - camX;
    if (ex < -80 || ex > vw + 80) continue;
    // 접지 그림자 (픽사풍 입체감)
    if (e.onG && SHADOWED.has(e.type)) {
      cx.fillStyle = 'rgba(14,8,22,.2)';
      cx.beginPath(); cx.ellipse(ex + e.w / 2, e.y + e.h + 2, e.w * 0.5, 3, 0, 0, 6.283); cx.fill();
    }
    const fr = Math.floor((e.animT || 0) * 6) % 2;
    switch (e.type) {
      case 'coin': {
        const ph = Math.sin(nowS * 5 + e.x * 0.05);
        cx.save(); cx.translate(ex + 10, e.y + 10); cx.scale(Math.abs(ph) * 0.8 + 0.2, 1);
        cx.drawImage(SPR.coin[0], -10, -10, 20, 20); cx.restore();
        break;
      }
      case 'ghost': {
        cx.globalAlpha = 0.94;
        if (!hdDraw('ghost', ex + e.w / 2, e.y + e.h + 2, 35, e.dir, Math.sin(nowS * 3 + e.x * 0.02) * 0.07))
          flip(SPR.ghost[fr], ex - 3, e.y - 2, 28, 30, -e.dir);
        cx.globalAlpha = 1;
        break;
      }
      case 'reaper': {
        if (!hdDraw('reaper', ex + e.w / 2, e.y + e.h + 2, 37, e.dir, Math.sin((e.animT || 0) * 9) * 0.05))
          flip(SPR.reaper[fr], ex - 3, e.y - 2, 28, 32, -e.dir);
        break;
      }
      case 'hat': flip(SPR.hat[0], ex, e.y, 26, 16, e.dir); break;
      case 'corpse': {
        const life = e.fly ? 1.1 : 0.55;
        const k = Math.min(1, e.t / life);
        const im = HD[e.name] || (SPR[e.name] || [])[0];
        if (!im) break;
        const hh = e.h + 6, ww = hh * im.width / im.height;
        if (!e.fly) { // 어질어질 별 (찌부 주위 궤도)
          cx.globalAlpha = 1 - k;
          cx.fillStyle = '#ffe28a';
          for (let s2 = 0; s2 < 2; s2++) {
            const a2 = e.t * 9 + s2 * Math.PI;
            const sxp = ex + e.w / 2 + Math.cos(a2) * 13, syp = e.y + e.h - 8 + Math.sin(a2) * 3.5;
            cx.beginPath();
            for (let v2 = 0; v2 < 5; v2++) {
              const aa = a2 + v2 * 1.2566;
              cx.lineTo(sxp + Math.cos(aa) * 2.6, syp + Math.sin(aa) * 2.6);
              cx.lineTo(sxp + Math.cos(aa + 0.628) * 1.1, syp + Math.sin(aa + 0.628) * 1.1);
            }
            cx.closePath(); cx.fill();
          }
          cx.globalAlpha = 1;
        }
        cx.save();
        cx.globalAlpha = 1 - k * k;
        if (e.fly) { // 빙글 날아감 (뒤집힌 채 회전)
          cx.translate(ex + e.w / 2, e.y + e.h / 2);
          cx.rotate(e.t * 8 * (e.vx > 0 ? 1 : -1));
          cx.scale(1, -1);
          cx.drawImage(im, -ww / 2, -hh / 2, ww, hh);
        } else { // 납작 찌부 (바닥 앵커)
          const sy = Math.max(0.16, 1 - k * 1.7), sx = 1 + k * 0.65;
          cx.translate(ex + e.w / 2, e.y + e.h + 2);
          cx.scale(sx, sy);
          cx.drawImage(im, -ww / 2, -hh, ww, hh);
        }
        cx.restore();
        cx.globalAlpha = 1;
        break;
      }
      case 'dok': {
        if (!hdDraw('dok', ex + e.w / 2, e.y + e.h + 2, 35, e.dir, e.onG ? 0 : -0.1 * e.dir))
          flip(SPR.dok[e.onG ? 0 : 1], ex - 2, e.y - 2, 28, 30, -e.dir);
        break;
      }
      case 'egg': {
        cx.globalAlpha = 0.94;
        if (!hdDraw('egg', ex + e.w / 2, e.y + e.h + 2, 33, 1, Math.sin((e.t || 0) * 2) * 0.09))
          cx.drawImage(SPR.egg[fr], ex - 2, e.y - 2, 26, 32);
        cx.globalAlpha = 1;
        break;
      }
      case 'fox': {
        if (!hdDraw('fox', ex + e.w / 2, e.y + e.h + 2, 31, e.dir, Math.sin((e.animT || 0) * 10) * 0.06))
          flip(SPR.fox[fr], ex - 3, e.y - 2, 36, 28, -e.dir);
        break;
      }
      case 'uni': {
        if (!hdDraw('uni', ex + e.w / 2, e.y + e.h + 2 + Math.sin(e.bob * 3) * 2, 40, e.dir, 0))
          flip(SPR.uni[0], ex - 3, e.y - 2 + Math.sin(e.bob * 3) * 2, 36, 32, -e.dir);
        break;
      }
      case 'uniFlee': {
        if (!hdDraw('uni', ex + e.w / 2, e.y + e.h + 2, 40, e.dir, Math.sin((e.t || 0) * 14) * 0.12))
          flip(SPR.uni[fr], ex - 3, e.y - 2, 36, 32, -e.dir);
        break;
      }
      case 'fruit': cx.drawImage(SPR.fruit[0], ex, e.y, 24, 26); break;
      case 'pepper': cx.drawImage(SPR.pepper[0], ex, e.y, 20, 24); break;
      case 'tiger': cx.drawImage(SPR.tiger[0], ex, e.y, 22, 22); break;
      case 'flame': cx.drawImage(SPR.flame[0], ex, e.y + Math.sin(e.t * 4) * 3, 22, 24); break;
      case 'fb': {
        cx.save(); cx.translate(ex + 7, e.y + 7); cx.rotate(e.t * 12 * e.dir);
        cx.drawImage(SPR.fb[0], -8, -8, 16, 16); cx.restore();
        break;
      }
      case 'blt': flip(SPR.blt[0], ex, e.y - 1, 18, 10, e.vx >= 0 ? 1 : -1); break;
      case 'shell': {
        cx.save(); cx.translate(ex + 9, e.y + 10); cx.rotate((e.t || 0) * 6 * (e.dir || 1));
        cx.drawImage(SPR.shell[0], -9, -10, 18, 20); cx.restore();
        break;
      }
      case 'tal': cx.drawImage(SPR.tal[0], ex, e.y, 20, 22); break;
      case 'boss': {
        if (e.inv > 0 && Math.floor(nowS * 14) % 2) break;
        if (!hdDraw('boss', ex + e.w / 2, e.y + e.h + 2, 72, e.dir, Math.sin((e.animT || 0) * 6) * 0.03))
          flip(SPR.boss[Math.floor((e.animT || 0) * 4) % 2], ex - 4, e.y - 3, 56, 64, -e.dir);
        break;
      }
      case 'jjojjo': {
        if (e.inv > 0 && Math.floor(nowS * 14) % 2) break;
        const jf = e.flash > 0 ? 2 : Math.floor((e.animT || 0) * 3) % 2;
        // 발사 반동: flash 중 살짝 뒤로
        if (!hdDraw('jjo', ex + e.w / 2 - (e.flash > 0 ? e.dir * 2.5 : 0), e.y + e.h + 2, 72, e.dir, Math.sin((e.animT || 0) * 5) * 0.03))
          flip(SPR.jjo[jf], ex - 8, e.y - 7, 60, 66, e.dir);
        else if (e.flash > 0) { // HD 총구 화염
          const mx = ex + e.w / 2 + e.dir * 34, my = e.y + 26;
          const mg = cx.createRadialGradient(mx, my, 1, mx, my, 9);
          mg.addColorStop(0, '#fff0b0'); mg.addColorStop(0.5, '#ffab2e'); mg.addColorStop(1, 'rgba(255,171,46,0)');
          cx.fillStyle = mg;
          cx.beginPath(); cx.arc(mx, my, 9, 0, 6.283); cx.fill();
        }
        break;
      }
      case 'jjotank': {
        if (e.inv > 0 && Math.floor(nowS * 14) % 2) break;
        const tf = e.flash > 0 ? 2 : Math.floor((e.animT || 0) * 5) % 2;
        if (!hdDraw('jjotank', ex + e.w / 2, e.y + e.h + 2, 86, e.dir, e.flash > 0 ? -e.dir * 0.03 : 0))
          flip(SPR.jjotank[tf], ex - 2, e.y - 2, 96, 78, e.dir);
        else if (e.flash > 0) { // HD 포구 화염
          const mx = ex + e.w / 2 + e.dir * 46, my = e.y + 34;
          const mg = cx.createRadialGradient(mx, my, 1, mx, my, 12);
          mg.addColorStop(0, '#fff0b0'); mg.addColorStop(0.5, '#ffab2e'); mg.addColorStop(1, 'rgba(255,171,46,0)');
          cx.fillStyle = mg;
          cx.beginPath(); cx.arc(mx, my, 12, 0, 6.283); cx.fill();
        }
        break;
      }
    }
  }
  // 플레이어
  if (player && !(player.inv > 0 && Math.floor(nowS * 14) % 2 && !player.dead)) {
    const p = player;
    const set = SPR.ujaF[Math.max(0, Math.min(3, p.pw))] || SPR.uja;
    const fr = p.dead ? 2 : !p.onG ? 2 : Math.abs(p.vx) > 12 ? (Math.floor(p.animT) % 2) : 0;
    const px = p.x - camX - 5, py = p.y - 4;
    if (p.onG && !p.dead) { // 접지 그림자
      cx.fillStyle = 'rgba(14,8,22,.22)';
      cx.beginPath(); cx.ellipse(p.x - camX + p.w / 2, p.y + p.h + 2, p.riding ? 16 : 12, 3.2, 0, 0, 6.283); cx.fill();
    }
    if (p.star > 0) {
      const gg = cx.createRadialGradient(px + 15, py + 17, 4, px + 15, py + 17, 30);
      gg.addColorStop(0, 'rgba(140,240,255,.5)'); gg.addColorStop(1, 'rgba(140,240,255,0)');
      cx.fillStyle = gg;
      cx.beginPath(); cx.arc(px + 15, py + 17, 30, 0, 6.283); cx.fill();
    }
    // 포즈 선택: 공격(불꽃 발사 직후) > 활강(호랑이 폼) > 기본 폼
    let hdName = 'uja' + Math.max(0, Math.min(3, p.pw));
    if (p.pw === 2 && p.atkT > 0 && HD.uja2atk) hdName = 'uja2atk';
    else if (p.gliding && HD.uja3glide) hdName = 'uja3glide';
    // 걷기 워블 + 공중 기울기 + 활강 전방 기울기 (프로시저럴 애니메이션)
    const walkRot = p.onG && Math.abs(p.vx) > 12 ? Math.sin(p.animT * 3.1) * 0.09 : 0;
    const airRot = p.gliding ? p.dir * 0.14
      : !p.onG ? p.dir * Math.max(-0.12, Math.min(0.17, p.vy * 0.00028)) : 0;
    const pcx = p.x - camX + p.w / 2;
    if (p.riding) {
      // 옆모습 유니콘 위 안장 자리에 라이더 (유니콘 먼저 → 라이더가 앞)
      const rideRot = p.gliding ? p.dir * 0.12 : walkRot;
      if (HD.uni) {
        hdDraw('uni', pcx + p.dir * 2, p.y + p.h + 2, 42, p.dir, rideRot * 0.7);
        hdDraw(hdName, pcx - p.dir * 6, p.y + p.h - 15, 30, p.dir, rideRot + (p.atkT > 0 ? -p.dir * 0.08 : 0));
      } else {
        flip(SPR.uni[p.onG && Math.abs(p.vx) > 12 ? Math.floor(p.animT) % 2 : 0], p.x - camX - 6, p.y + p.h - 30, 36, 32, p.dir);
        flip(set[fr], px, py - 16, 30, 34, p.dir);
      }
    } else if (!hdDraw(hdName, pcx, p.y + p.h + 2, 40, p.dir, walkRot + airRot)) {
      flip(set[fr], px, py, 30, 34, p.dir);
    }
  }
  // 파티클
  for (const pt of particles) {
    cx.globalAlpha = 1 - pt.t / pt.life;
    cx.fillStyle = pt.col;
    if (pt.star) {
      cx.save(); cx.translate(pt.x - camX, pt.y); cx.rotate(pt.t * 6);
      cx.fillRect(-pt.r, -pt.r / 3, pt.r * 2, pt.r / 1.5);
      cx.fillRect(-pt.r / 3, -pt.r, pt.r / 1.5, pt.r * 2);
      cx.restore();
    } else {
      cx.beginPath(); cx.arc(pt.x - camX, pt.y, pt.r * (1 - pt.t / pt.life * 0.5), 0, 6.283); cx.fill();
    }
  }
  cx.globalAlpha = 1;
  // 점수 팝업
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for (const pp of popups) {
    cx.globalAlpha = 1 - pp.t / 0.9;
    cx.font = '900 14px sans-serif';
    cx.lineWidth = 3; cx.strokeStyle = 'rgba(0,0,0,.6)';
    cx.strokeText(pp.txt, pp.x - camX, pp.y);
    cx.fillStyle = pp.col; cx.fillText(pp.txt, pp.x - camX, pp.y);
  }
  cx.globalAlpha = 1;
  // 보스 HP
  const boss = ents.find(e => e.type === 'boss' || e.type === 'jjojjo' || e.type === 'jjotank');
  if (boss && LV.bossArena && LV.bossArena.entered) {
    const bw = 200, bx = vw / 2 - bw / 2;
    cx.fillStyle = 'rgba(0,0,0,.5)';
    cx.beginPath(); cx.roundRect(bx - 6, 14, bw + 12, 22, 10); cx.fill();
    cx.fillStyle = '#3a3a44';
    cx.beginPath(); cx.roundRect(bx, 20, bw, 10, 5); cx.fill();
    cx.fillStyle = boss.type === 'jjotank' ? '#c89020' : boss.type === 'jjojjo' ? '#e858a8' : '#d8425a';
    cx.beginPath(); cx.roundRect(bx, 20, bw * boss.hp / boss.maxHp, 10, 5); cx.fill();
    cx.font = '900 11px sans-serif'; cx.fillStyle = '#ffe28a';
    const icon = boss.type === 'jjotank' ? '🛡 ' : boss.type === 'jjojjo' ? '👑 ' : '☠ ';
    cx.fillText(icon + L.stages[G.stage - 1], vw / 2, 10);
  }
  // 스테이지 인트로 / 메시지
  if (G.introT > 0) {
    cx.fillStyle = 'rgba(10,6,18,.55)'; cx.fillRect(0, VH / 2 - 60, vw, 120);
    cx.font = '900 34px sans-serif';
    cx.fillStyle = '#ffe28a';
    cx.fillText(`${L.stageLbl} ${G.stage}`, vw / 2, VH / 2 - 16);
    cx.font = '800 20px sans-serif'; cx.fillStyle = '#fff';
    cx.fillText(L.stages[G.stage - 1], vw / 2, VH / 2 + 18);
  } else if (G.msgT > 0 && G.msg) {
    cx.font = '900 24px sans-serif';
    cx.lineWidth = 5; cx.strokeStyle = 'rgba(0,0,0,.65)';
    cx.strokeText(G.msg, vw / 2, VH * 0.3);
    cx.fillStyle = '#ffe28a'; cx.fillText(G.msg, vw / 2, VH * 0.3);
  }
  cx.restore();
}
function updateHUD() {
  document.getElementById('hStage').textContent = `${L.stageLbl} ${G.stage} · ${L.stages[G.stage - 1]}`;
  document.getElementById('hScore').textContent = `⭐ ${G.score.toLocaleString()}`;
  document.getElementById('hCoin').textContent = `🪙 ${G.coins}`;
  document.getElementById('hLife').textContent = `💗 ${Math.max(0, G.lives)}` +
    (player && player.pw === 2 ? ' · 🌶️' : player && player.pw === 3 ? ' · 🐯' : '');
  const tEl = document.getElementById('hTime');
  tEl.textContent = `⏱ ${Math.ceil(G.time)}`;
  tEl.classList.toggle('low', G.time < 60);
}

/* ============================================================
   입력
   ============================================================ */
window.addEventListener('keydown', (e) => {
  if (G.mode === 'story') { // 스토리 컷씬 진행/스킵
    if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) { e.preventDefault(); storyNext(); }
    else if (e.key === 'Escape') storyEnd();
    return;
  }
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.l = true;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.r = true;
  if ([' ', 'ArrowUp', 'w', 'W', 'z', 'Z'].includes(e.key)) { keys.j = true; e.preventDefault(); }
  if (e.key === 'Shift' || e.key === 'x' || e.key === 'X') keys.run = true;
  if (e.key === 'Escape' && G.mode === 'play') togglePause();
});
window.addEventListener('keyup', (e) => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.l = false;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.r = false;
  if ([' ', 'ArrowUp', 'w', 'W', 'z', 'Z'].includes(e.key)) keys.j = false;
  if (e.key === 'Shift' || e.key === 'x' || e.key === 'X') keys.run = false;
});
function bindTouch(id, key) {
  const el = document.getElementById(id);
  const on = (e) => { e.preventDefault(); keys[key] = true; el.classList.add('on'); audioInit(); };
  const off = (e) => { e.preventDefault(); keys[key] = false; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('pointerleave', off);
}
if (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) document.body.classList.add('touch');
if (qs.has('touch')) document.body.classList.add('touch');
window.addEventListener('resize', layout);

/* ============================================================
   화면 · 플로우
   ============================================================ */
function $(id) { return document.getElementById(id); }
function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.style.display = 'none';
  if (id) $(id).style.display = 'flex';
}
function togglePause() {
  G.paused = !G.paused;
  if (G.paused) { showScreen('pause'); bgmStop(); }
  else { showScreen(null); bgmStart(bgmCur); }
}
function startGame(fresh) {
  const nick = ($('nick').value || '').trim() || 'UJA';
  REC.nick = nick; storeRec();
  audioInit();
  G.mode = 'play'; G.won = false; G.recorded = false; G.paused = false;
  let st = 1;
  if (!fresh) {
    try {
      const s = JSON.parse(localStorage.getItem(GAME_KEY));
      if (s && s.v === 1) { st = s.stage; G.lives = s.lives; G.score = s.score; G.coins = s.coins; }
    } catch (e) {}
  }
  if (fresh) { G.lives = 3; G.score = 0; G.coins = 0; }
  showScreen(null);
  document.body.classList.add('playing');
  if (fresh) playStory('intro', () => startStage(1)); // 새 게임 → 프롤로그
  else startStage(st);
}
function recordsTable() {
  if (!REC.top10.length) return `<div class="note">${L.emptyRec}</div>`;
  let h = `<table><tr><th>${L.colRank}</th><th>${L.colName}</th><th>${L.colScore}</th><th>${L.colStage}</th><th>${L.colDate}</th></tr>`;
  REC.top10.forEach((r, i) => {
    h += `<tr><td>${i + 1}</td><td>${String(r.n).replace(/[<>&]/g, '')}</td><td>${r.s.toLocaleString()}</td><td>${r.g}</td><td>${r.d}</td></tr>`;
  });
  return h + '</table>';
}
function uiInit() {
  $('subT').textContent = L.sub;
  $('startBtn').textContent = L.start;
  $('contBtn').textContent = L.cont;
  $('recBtn').textContent = L.records;
  $('exportBtn').textContent = L.expSave;
  $('importBtn').textContent = L.impSave;
  $('helpBox').innerHTML = L.help;
  $('credit').innerHTML = L.credit + '<a href="https://menewsoft.com" target="_blank" rel="noopener">menewsoft.com</a>';
  $('nick').placeholder = L.nickPh;
  $('nick').value = REC.nick || '';
  $('recT').textContent = L.records;
  $('recNote').textContent = L.recNote;
  $('recBackBtn').textContent = L.back;
  $('pauseT').textContent = L.pauseT;
  $('resumeBtn').textContent = L.resume;
  $('quitBtn').textContent = L.quit;
  $('retryBtn').textContent = L.retry;
  $('menuBtn').textContent = L.menu;
  $('contTitle').textContent = L.contT;
  $('doContBtn').textContent = L.contYes;
  $('giveupBtn').textContent = L.contNo;
  applyMute();
  let hasSave = false;
  try { hasSave = !!localStorage.getItem(GAME_KEY); } catch (e) {}
  if (hasSave) $('contBtn').style.display = '';
  $('startBtn').onclick = () => startGame(true);
  $('contBtn').onclick = () => startGame(false);
  $('recBtn').onclick = () => { $('recPanel').innerHTML = recordsTable(); showScreen('records'); };
  $('recBackBtn').onclick = () => showScreen('menu');
  $('resumeBtn').onclick = togglePause;
  $('quitBtn').onclick = () => {
    if (!confirm(L.quitConfirm)) return;
    G.paused = false; G.mode = 'menu';
    document.body.classList.remove('playing');
    bgmStop();
    $('contBtn').style.display = '';
    showScreen('menu');
  };
  $('retryBtn').onclick = () => startGame(true);
  $('menuBtn').onclick = () => { G.mode = 'menu'; showScreen('menu'); };
  $('doContBtn').onclick = doContinue;
  $('giveupBtn').onclick = giveUp;
  $('pauseBtn').onclick = togglePause;
  $('muteBtn').onclick = () => { REC.muted = !REC.muted; storeRec(); applyMute(); };
  $('exportBtn').onclick = () => {
    const blob = new Blob([JSON.stringify({ game: 'superuja', v: 1, rec: REC })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'super-uja-save.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    alert(L.expDone);
  };
  $('importBtn').onclick = () => $('importFile').click();
  $('importFile').addEventListener('change', (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const j = JSON.parse(rd.result);
        if (j.game !== 'superuja' || !j.rec || !Array.isArray(j.rec.top10)) throw 0;
        if (!confirm(L.impConfirm)) return;
        REC = j.rec; storeRec();
        $('nick').value = REC.nick || ''; applyMute();
      } catch (err) { alert(L.impErr); }
    };
    rd.readAsText(f);
  });
  cvs.addEventListener('pointerdown', () => { if (G.mode === 'story') { audioInit(); storyNext(); } });
  bindTouch('tLeft', 'l'); bindTouch('tRight', 'r');
  bindTouch('tJump', 'j'); bindTouch('tRun', 'run');
  document.addEventListener('pointerdown', audioInit, { once: true });
}

/* ============================================================
   테스트 (?test=sim)
   ============================================================ */
function makeTestLevel(cols) {
  const t = new Uint8Array(cols * ROWS);
  for (let x = 0; x < cols; x++) { setT(t, cols, x, ROWS - 2, 1); setT(t, cols, x, ROWS - 1, 5); }
  return { t, W: cols, ents: [], qc: new Map(), deco: [], goalX: (cols - 2) * TILE, theme: THEMES[0], stage: 1, bossArena: null, goalActive: false };
}
function simSteps(n) { for (let i = 0; i < n; i++) update(1 / 60); }
function runSim() {
  let pass = 0, fail = 0;
  const T = (name, ok, extra) => {
    if (ok) pass++; else fail++;
    console.warn(`[SIM] ${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  };
  buildSprites();
  T('sprites built', !!(SPR.uja && SPR.uja[0].width && SPR.boss && SPR.jjo && SPR.jjo[2].width && SPR.jjotank && SPR.jjotank[2].width && SPR.shell && SPR.pepper && SPR.tiger && SPR.ground.snow && SPR.ground.lava && SPR.ground.steel && SPR.tile[1]));
  // 레벨 15종 정적 검증
  for (let s = 1; s <= 15; s++) {
    const lv = genLevel(s);
    // 표면 높이/구멍 검사 (바닥에서 연속된 지면만 = 걷는 표면, 공중 블록 제외)
    const surf = [];
    for (let x2 = 0; x2 < lv.W; x2++) {
      let sY = -1;
      if (SOLID[lv.t[(ROWS - 1) * lv.W + x2]]) {
        sY = ROWS - 1;
        while (sY > 0 && SOLID[lv.t[(sY - 1) * lv.W + x2]]) sY--;
      }
      surf.push(sY);
    }
    let maxGap = 0, run = 0, maxStep = 0;
    let prev = -1;
    for (let x2 = 0; x2 < lv.W - 2; x2++) { // 끝벽(아레나) 제외
      if (surf[x2] < 0) { run++; maxGap = Math.max(maxGap, run); }
      else {
        run = 0;
        if (prev >= 0) maxStep = Math.max(maxStep, Math.abs(surf[x2] - prev));
        prev = surf[x2];
      }
    }
    const enemies = lv.ents.filter(e => !['coin', 'uni', 'boss', 'jjojjo', 'jjotank'].includes(e.type)).length;
    const hasUni = lv.ents.some(e => e.type === 'uni');
    const hasPower = [...lv.qc.values()].some(c => c === 'fruit' || c === 'pepper' || c === 'tiger');
    const okBoss = s === 5 ? lv.ents.some(e => e.type === 'boss')
      : s === 10 ? lv.ents.some(e => e.type === 'jjojjo')
      : s === 15 ? lv.ents.some(e => e.type === 'jjotank')
      : !lv.bossArena;
    T(`stage ${s} valid`, maxGap <= 4 && maxStep <= 3 && enemies > 3 && hasUni && hasPower && okBoss && lv.goalX < lv.W * TILE,
      `gap=${maxGap} step=${maxStep} foes=${enemies} uni=${hasUni} power=${hasPower}`);
  }
  // 물리: 점프 높이·활강 거리
  G.mode = 'play'; G.introT = 0; G.lives = 3; G.score = 0; G.coins = 0; G.time = 300;
  LV = makeTestLevel(60); ents = [];
  player = mkPlayer(5 * TILE, (ROWS - 4) * TILE);
  simSteps(30); // 착지
  const groundY = player.y;
  keys.j = true;
  let peak = 1e9;
  for (let i = 0; i < 90; i++) { update(1 / 60); peak = Math.min(peak, player.y); }
  keys.j = false;
  const jumpTiles = (groundY - peak) / TILE;
  T('jump height ≥ 3.2 tiles', jumpTiles >= 3.2, jumpTiles.toFixed(2));
  // 달리기 점프 거리
  simSteps(60);
  keys.r = true; keys.run = true;
  simSteps(80); // 가속
  const x0 = player.x;
  keys.j = true;
  let air = 0;
  simSteps(3);
  while (!player.onG && air < 300) { update(1 / 60); air++; }
  const distT = (player.x - x0) / TILE;
  keys.r = false; keys.run = false; keys.j = false;
  T('run-jump distance ≥ 4.5 tiles', distT >= 4.5, distT.toFixed(2));
  // 밟기
  LV = makeTestLevel(60); ents = [{ type: 'ghost', x: 8 * TILE, y: (ROWS - 2) * TILE - 28, w: 22, h: 28, vx: 0, vy: 0, dir: -1 }];
  player = mkPlayer(8 * TILE - 10, (ROWS - 2) * TILE - 160);
  const sc0 = G.score;
  let sawCorpse = false;
  for (let i = 0; i < 60; i++) { update(1 / 60); if (ents.some(e => e.type === 'corpse' && !e.fly)) sawCorpse = true; }
  T('stomp kills enemy', ents.every(e => e.type !== 'ghost') && G.score > sc0, `score+${G.score - sc0}`);
  // 밟기 사망 모션: 찌부 corpse 스폰 → 0.55초 후 소멸
  T('stomp spawns squash corpse', sawCorpse);
  simSteps(45);
  T('corpse expires', ents.every(e => e.type !== 'corpse'));
  // 데미지 체인: 불꽃폼 → 파워 → 일반 → 사망
  LV = makeTestLevel(60); ents = [];
  player = mkPlayer(5 * TILE, (ROWS - 4) * TILE);
  player.pw = 2;
  simSteps(20);
  const foe = { type: 'ghost', x: player.x, y: player.y, w: 22, h: 28, vx: 0, vy: 0, dir: -1 };
  ents.push(foe);
  simSteps(3);
  T('hit fire form → downgrade to fruit form', player.pw === 1 && !player.dead, `pw=${player.pw}`);
  player.inv = 0;
  simSteps(3);
  T('hit powered → lose power', player.pw === 0 && !player.dead, `inv=${player.inv.toFixed(1)}`);
  player.inv = 0;
  simSteps(3);
  T('hit normal → death', player.dead === true);
  // 불꽃 발사 (고추 폼): Shift 탭 → 파이어볼 → 전방 적 처치
  LV = makeTestLevel(60);
  ents = [{ type: 'ghost', x: 10 * TILE, y: (ROWS - 2) * TILE - 28, w: 22, h: 28, vx: 0, vy: 0, dir: -1 }];
  player = mkPlayer(6 * TILE, (ROWS - 3) * TILE);
  player.pw = 2; player.dir = 1;
  keys.run = false; runWasDown = false;
  simSteps(20);
  keys.run = true; simSteps(2);
  const fbSpawned = ents.some(e => e.type === 'fb');
  simSteps(80); keys.run = false;
  T('pepper form → fireball kills enemy', fbSpawned && ents.every(e => e.type !== 'ghost'), `fb=${fbSpawned}`);
  // 호랑이 활강: 점프 홀드 낙하 속도 제한
  LV = makeTestLevel(60); ents = [];
  player = mkPlayer(6 * TILE, 2 * TILE);
  player.pw = 3;
  keys.j = true; jumpWasDown = true; jumpBuf = 0;
  let maxFall = 0;
  for (let i = 0; i < 40; i++) { update(1 / 60); if (!player.onG) maxFall = Math.max(maxFall, player.vy); }
  keys.j = false; jumpWasDown = false;
  T('tiger form glide caps fall speed', maxFall <= 130 && maxFall > 0, `maxVy=${maxFall.toFixed(0)}`);
  // 유니콘 탑승/피격 이탈
  LV = makeTestLevel(60); ents = [{ type: 'uni', x: 6 * TILE, y: (ROWS - 2) * TILE - 32, w: 30, h: 30, vx: 0, vy: 0, dir: 1, bob: 0 }];
  player = mkPlayer(6 * TILE - 6, (ROWS - 2) * TILE - 40);
  G.lives = 3;
  simSteps(20);
  T('unicorn mount', player.riding === true);
  ents.push({ type: 'ghost', x: player.x, y: player.y + 10, w: 22, h: 28, vx: 0, vy: 0, dir: -1 });
  simSteps(3);
  T('damage while riding → unicorn flees', player.riding === false && !player.dead && ents.some(e => e.type === 'uniFlee'));
  // 엽전 100개 → 1UP
  LV = makeTestLevel(60);
  player = mkPlayer(5 * TILE, (ROWS - 3) * TILE);
  G.coins = 99;
  ents = [{ type: 'coin', x: player.x, y: player.y + 4, w: 20, h: 20 }];
  const lv0 = G.lives;
  simSteps(5);
  T('100 coins → 1UP', G.coins === 0 && G.lives === lv0 + 1, `coins=${G.coins} lives=${G.lives}`);
  // 복주머니 블록
  LV = makeTestLevel(60);
  setT(LV.t, LV.W, 7, ROWS - 6, 3);
  LV.qc.set((ROWS - 6) * LV.W + 7, 'fruit');
  player = mkPlayer(7 * TILE + 5, (ROWS - 4) * TILE);
  ents = [];
  simSteps(30); // 착지 후 점프 (점프버퍼 만료 방지)
  keys.j = true; simSteps(30); keys.j = false;
  T('? block spawns item', LV.t[(ROWS - 6) * LV.W + 7] === 4 && ents.some(e => e.type === 'fruit'));
  // 보스 5회 밟기 → 처치 + 골 등장
  LV = makeTestLevel(80);
  LV.stage = 5;
  LV.bossArena = { x0: 2 * TILE, x1: 78 * TILE, entered: true };
  LV.goalActive = false;
  const bossE = { type: 'boss', x: 30 * TILE, y: (ROWS - 2) * TILE - 60, w: 48, h: 60, vx: 0, vy: 0, dir: -1, hp: 5, maxHp: 5, throwT: 99, stun: 0, inv: 0, dead: false };
  ents = [bossE];
  player = mkPlayer(10 * TILE, (ROWS - 4) * TILE);
  for (let k = 0; k < 5; k++) { bossE.inv = 0; bossStomp(bossE); }
  T('boss dies after 5 stomps → goal appears', bossE.hp <= 0 && LV.goalActive === true && G.score >= 5000);
  // 쪼쪼 여왕: 기관총 연사 + 6회 타격 처치
  LV = makeTestLevel(80);
  LV.stage = 10; G.stage = 10;
  LV.bossArena = { x0: 2 * TILE, x1: 78 * TILE, entered: true };
  LV.goalActive = false;
  const jjo = { type: 'jjojjo', x: 40 * TILE, y: (ROWS - 2) * TILE - 58, w: 44, h: 58, vx: 0, vy: 0, dir: -1, hp: 6, maxHp: 6, burstT: 0.05, burstN: 0, shotT: 0, flash: 0, stun: 0, inv: 0, dead: false };
  ents = [jjo];
  player = mkPlayer(10 * TILE, (ROWS - 4) * TILE);
  player.inv = 99; // 탄환 피해 무시하고 발사만 검증
  simSteps(90);
  T('jjojjo fires machine-gun bullets', ents.some(e => e.type === 'blt') || jjo.burstN > 0, `blts=${ents.filter(e => e.type === 'blt').length}`);
  for (let k = 0; k < 6; k++) { jjo.inv = 0; bossStomp(jjo); }
  T('jjojjo dies after 6 hits → goal appears', jjo.hp <= 0 && jjo.dead && LV.goalActive === true);
  G.stage = 1;
  // 탱크 쪼쪼(스테이지15): 포탄/기관총 발사 + 8회 타격 처치
  LV = makeTestLevel(90);
  LV.stage = 15; G.stage = 15;
  LV.bossArena = { x0: 2 * TILE, x1: 88 * TILE, entered: true };
  LV.goalActive = false;
  G.introT = 0;
  const tank = { type: 'jjotank', x: 46 * TILE, y: (ROWS - 2) * TILE - 74, w: 92, h: 74, vx: 0, vy: 0, dir: -1, hp: 8, maxHp: 8, throwT: 0.05, mgN: 0, shotT: 0, flash: 0, stun: 0, inv: 0, dead: false };
  ents = [tank];
  player = mkPlayer(12 * TILE, (ROWS - 4) * TILE);
  player.inv = 999;
  let tankFired = false;
  for (let i = 0; i < 200 && !tankFired; i++) { update(1 / 60); if (ents.some(e => e.type === 'shell' || e.type === 'blt')) tankFired = true; }
  T('jjotank fires shells/MG', tankFired, `fired=${tankFired}`);
  for (let k = 0; k < 8; k++) { tank.inv = 0; bossStomp(tank); }
  T('jjotank dies after 8 hits → goal appears', tank.hp <= 0 && tank.dead && LV.goalActive === true && G.score >= 8000);
  G.stage = 1;
  // 시작 안전지대: 각 스테이지 스폰 후 2초간 정지해도 죽지 않아야 (공중 달걀·근접 적 사전차단)
  {
    let allSafe = true, badStage = 0;
    for (let s = 1; s <= 15; s++) {
      G.mode = 'play'; G.introT = 0; G.clearT = 0; G.lives = 5; G.time = 300;
      G.stage = s; LV = genLevel(s); spawnEnts();
      player = mkPlayer(3 * TILE, (ROWS - 4) * TILE);
      keys.l = keys.r = keys.j = keys.run = false;
      if (LV.bossArena) LV.bossArena.entered = false; // 보스전 미개시 상태
      simSteps(120); // 2초 정지
      if (player.dead) { allSafe = false; badStage = s; break; }
    }
    T('spawn-safe: idle 2s at start survives (all 15 stages)', allSafe, badStage ? `died on stage ${badStage}` : 'ok');
  }
  // 이어하기: 생명 소진 → 점수 50% 소모 후 이어하기, 스테이지 유지
  {
    G.mode = 'play'; G.won = false; G.recorded = false; G.paused = false;
    G.stage = 7; G.lives = 0; G.score = 4000; G.coins = 0;
    LV = genLevel(7); spawnEnts();
    player = mkPlayer(3 * TILE, (ROWS - 4) * TILE);
    respawn(); // lives 0 → -1 → gameOver
    const offered = G.paused === true;
    doContinue();
    T('continue: spends 50% score, restores lives, same stage',
      offered && G.score === 2000 && G.lives === 3 && G.stage === 7 && !G.paused,
      `score=${G.score} lives=${G.lives} stage=${G.stage}`);
    // 저점수(<500)면 이어하기 미제공 → 바로 결과
    G.recorded = true; // finishGame 부작용 차단
    G.mode = 'play'; G.paused = false; G.score = 300; G.lives = 0; G.stage = 3;
    respawn();
    T('continue: below min score → no offer', G.paused === false);
    G.recorded = false; G.mode = 'play';
  }
  G.stage = 1;
  // 깃대: 꼭대기 잡기 → 고득점 + 1UP
  LV = makeTestLevel(40);
  LV.goalActive = true;
  ents = [];
  G.clearT = 0; G.stage = 1; G.introT = 0;
  player = mkPlayer(LV.goalX + 1, 3 * TILE); // 깃대 상단 높이에서 교차
  const scFH = G.score, lvFH = G.lives;
  simSteps(3);
  T('flagpole high grab → 5000 + 1UP', !!player.flag && G.score - scFH >= 5000 && G.lives === lvFH + 1, `pts=${G.score - scFH}`);
  // 깃대: 바닥 잡기 → 최소 점수, 슬라이드 후 클리어
  LV = makeTestLevel(40);
  LV.goalActive = true;
  ents = [];
  player = mkPlayer(LV.goalX - 40, (ROWS - 3) * TILE - 4);
  G.clearT = 0; G.introT = 0;
  const scFL = G.score;
  keys.r = true; simSteps(30); keys.r = false;
  const lowPts = G.score - scFL;
  T('flagpole low grab → small points', !!player.flag && lowPts >= 100 && lowPts <= 200, `pts=${lowPts}`);
  simSteps(40);
  T('flag slide → stage clear', G.clearT > 0 || G.stage === 2, `clearT=${G.clearT.toFixed(2)} stage=${G.stage}`);
  G.clearT = 0;
  // 스토리 컷씬: 진행 → 콜백, 스킵 → 콜백
  {
    let ended = 0;
    playStory('intro', () => ended++);
    T('story mode starts', G.mode === 'story' && !!STORY);
    STORY.t = 999; storyNext(); STORY.t = 999; storyNext(); STORY.t = 999; storyNext();
    T('story advances to end → callback + play mode restored', ended === 1 && STORY === null && G.mode === 'play');
    playStory('after5', () => ended++);
    storyEnd();
    T('story skip → callback + play mode restored', ended === 2 && G.mode === 'play');
  }
  // 기록 라운드트립
  {
    const bak = localStorage.getItem(REC_KEY);
    REC = { nick: 'SIM', top10: [], muted: false, best: 0 };
    addRecord(7777, 3);
    const re = loadRec();
    T('record round-trip', re.top10.length === 1 && re.top10[0].s === 7777 && re.best === 7777);
    if (bak === null) localStorage.removeItem(REC_KEY); else localStorage.setItem(REC_KEY, bak);
    REC = loadRec();
  }
  // 렌더 스모크
  try { layout(); G.mode = 'play'; LV = genLevel(1); spawnEnts(); player = mkPlayer(3 * TILE, (ROWS - 4) * TILE); render(1.2); T('render ok', true); }
  catch (e) { T('render ok', false, e.message); }
  console.warn(`[SIM] DONE pass=${pass} fail=${fail}`);
}

/* ===== 스크린샷 모드 (?shot=1) ===== */
function setupShot() {
  buildSprites();
  REC.nick = 'UJA';
  G.mode = 'play'; G.stage = 1; G.lives = 3; G.score = 12480; G.coins = 37; G.time = 248;
  LV = genLevel(1);
  spawnEnts();
  player = mkPlayer(30 * TILE, (ROWS - 5) * TILE);
  player.vy = -200; player.onG = false; player.dir = 1;
  if (qs.get('shot') === '2') { player.riding = true; G.stage = 3; LV = genLevel(3); spawnEnts(); player.x = 40 * TILE; player.y = (ROWS - 6) * TILE; }
  if (qs.get('shot') === '3') { // 설산 활강 (호랑이 폼)
    G.stage = 7; LV = genLevel(7); spawnEnts();
    player.x = 44 * TILE; player.y = (ROWS - 8) * TILE; player.pw = 3; player.vy = 120; player.onG = false;
  }
  if (qs.get('shot') === '4') { // 쪼쪼 보스전 (불꽃 폼)
    G.stage = 10; LV = genLevel(10); spawnEnts();
    const jj = ents.find(e => e.type === 'jjojjo');
    LV.bossArena.entered = true;
    player.pw = 2; player.x = jj.x - 260; player.y = (ROWS - 4) * TILE; player.dir = 1;
    jj.hp = 4; jj.flash = 1; jj.animT = 0; jj.dir = -1;
    for (let k = 0; k < 3; k++) ents.push({ type: 'blt', x: jj.x - 40 - k * 60, y: jj.y + 26 + k * 8, w: 14, h: 8, vx: -330, vy: 0, t: 0, dir: -1 });
    ents.push({ type: 'fb', x: player.x + 60, y: player.y + 6, w: 14, h: 14, vx: 360, vy: 0, t: 0.4, dir: 1 });
  }
  if (qs.get('shot') === '5') { // 매화 대나무숲 (기본 폼 + 꽃)
    G.stage = 6; LV = genLevel(6); spawnEnts();
    player.x = 26 * TILE; player.y = (ROWS - 5) * TILE;
  }
  if (qs.get('shot') === '6') { // 노을 바닷가
    G.stage = 8; LV = genLevel(8); spawnEnts();
    player.x = 30 * TILE; player.y = (ROWS - 5) * TILE;
  }
  if (qs.get('shot') === '7') { // 구름 하늘길
    G.stage = 9; LV = genLevel(9); spawnEnts();
    player.x = 34 * TILE; player.y = (ROWS - 6) * TILE;
  }
  if (qs.get('shot') === '11') { // 왕벚꽃 정원
    G.stage = 11; LV = genLevel(11); spawnEnts();
    player.x = 28 * TILE; player.y = (ROWS - 5) * TILE; player.pw = 2;
  }
  if (qs.get('shot') === '12') { // 홍염 화산
    G.stage = 12; LV = genLevel(12); spawnEnts();
    player.x = 30 * TILE; player.y = (ROWS - 5) * TILE;
  }
  if (qs.get('shot') === '13') { // 오로라 빙하
    G.stage = 13; LV = genLevel(13); spawnEnts();
    player.x = 32 * TILE; player.y = (ROWS - 6) * TILE; player.pw = 3;
  }
  if (qs.get('shot') === '14') { // 황금 노을 포구
    G.stage = 14; LV = genLevel(14); spawnEnts();
    player.x = 30 * TILE; player.y = (ROWS - 5) * TILE;
  }
  if (qs.get('shot') === '15') { // 탱크 쪼쪼 보스전
    G.stage = 15; LV = genLevel(15); spawnEnts();
    const tk = ents.find(e => e.type === 'jjotank');
    LV.bossArena.entered = true;
    player.pw = 2; player.x = tk.x - 300; player.y = (ROWS - 4) * TILE; player.dir = 1;
    tk.hp = 5; tk.flash = 1; tk.animT = 0; tk.dir = -1;
    ents.push({ type: 'shell', x: tk.x - 90, y: player.y - 70, w: 18, h: 20, vx: -180, vy: -40, dir: -1, t: 0.5 });
    for (let k = 0; k < 2; k++) ents.push({ type: 'blt', x: tk.x - 60 - k * 70, y: tk.y + 16 + k * 10, w: 14, h: 8, vx: -350, vy: 20, t: 0, dir: -1 });
    ents.push({ type: 'fb', x: player.x + 50, y: player.y + 6, w: 14, h: 14, vx: 360, vy: 0, t: 0.4, dir: 1 });
  }
  if (qs.get('shot') === 'fl') { // 깃대 슬라이드 (정지 프레임)
    G.stage = 1; LV = genLevel(1); spawnEnts();
    const base = VH - 2 * TILE;
    player.x = LV.goalX + 8 - player.w / 2; player.y = base - 7 * TILE + 60;
    player.vx = 0; player.vy = 0; player.onG = false;
    player.flag = { t: 0.1 };
    cam.x = LV.goalX - 260;
    G.paused = true;
  }
  if (qs.get('shot') === 'a') { // 공격 포즈 (불꽃 폼, 정지 프레임)
    G.stage = 12; LV = genLevel(12); spawnEnts();
    player.x = 30 * TILE; player.y = (ROWS - 4) * TILE; player.pw = 2; player.dir = 1;
    player.atkT = 0.3; player.onG = true; player.vy = 0;
    ents.push({ type: 'fb', x: player.x + 44, y: player.y + 4, w: 14, h: 14, vx: 360, vy: -20, t: 0.1, dir: 1 });
    G.paused = true;
  }
  if (qs.get('shot') === 'g') { // 활강 포즈 (호랑이 폼, 정지 프레임)
    G.stage = 9; LV = genLevel(9); spawnEnts();
    player.x = 34 * TILE; player.y = (ROWS - 9) * TILE; player.pw = 3; player.dir = 1;
    player.gliding = true; player.onG = false; player.vy = 120;
    G.paused = true;
  }
  if (qs.get('shot') === 'k') { // 밟기/날아감 사망 모션 (정지 프레임)
    G.stage = 1; LV = genLevel(1); spawnEnts();
    player.x = 26 * TILE; player.y = (ROWS - 4) * TILE - 44; player.vy = 300; player.onG = false;
    ents.push({ type: 'corpse', name: 'ghost', x: player.x + 44, y: (ROWS - 3) * TILE + 4, w: 22, h: 28, dir: 1, t: 0.16, fly: false, vx: 0, vy: 0 });
    ents.push({ type: 'corpse', name: 'dok', x: player.x + 120, y: (ROWS - 6) * TILE, w: 24, h: 28, dir: 1, t: 0.3, fly: true, vx: 140, vy: -60 });
    G.paused = true;
  }
  if (qs.get('shot') === '9s') { // 스테이지9 실제 스폰지점 (시작 안전 확인)
    G.stage = 9; LV = genLevel(9); spawnEnts();
    player = mkPlayer(3 * TILE, (ROWS - 4) * TILE); player.dir = 1;
  }
  if (qs.get('shot') === '10s') { // 스테이지10 실제 스폰지점
    G.stage = 10; LV = genLevel(10); spawnEnts();
    player = mkPlayer(3 * TILE, (ROWS - 4) * TILE); player.dir = 1;
  }
  cam.x = qs.get('shot') && qs.get('shot').endsWith('s') ? 0 : player.x - 200;
  showScreen(null);
  document.body.classList.add('playing');
  G.introT = 0;
  sparkle(player.x + 20, player.y + 30, '#ffe28a');
  updateHUD();
  if (qs.get('shot') === 'cont') { // 이어하기 화면 검수
    G.stage = 12; G.score = 24800; G.lives = 0;
    gameOver();
  }
  window._SHOT_READY = true;
}

/* ===== 스프라이트 시트 (?shot=z, 디자인 검수용) ===== */
function setupSheet() {
  window._SHEET = true;
  buildSprites();
  showScreen(null);
  drawSheet();
  window._SHOT_READY = true;
}
function drawSheet() {
  const c = document.getElementById('game');
  if (c.width !== 1240) { c.width = 1240; c.height = 760; c.style.width = '1240px'; c.style.height = '760px'; }
  const g = c.getContext('2d');
  g.fillStyle = '#39465a'; g.fillRect(0, 0, 1240, 760);
  g.imageSmoothingEnabled = true;
  // 유자 4폼 × 3프레임
  for (let fm = 0; fm < 4; fm++)
    for (let f = 0; f < 3; f++)
      g.drawImage(SPR.ujaF[fm][f], 25 + (fm * 3 + f) * 100, 20, 90, 102);
  // 쪼쪼 3프레임 + 유니콘 + 아이템
  SPR.jjo.forEach((s, i) => g.drawImage(s, 25 + i * 195, 150, 180, 198));
  g.drawImage(SPR.uni[0], 620, 180, 144, 128);
  g.drawImage(SPR.pepper[0], 790, 190, 66, 78);
  g.drawImage(SPR.tiger[0], 870, 195, 72, 72);
  g.drawImage(SPR.fruit[0], 960, 195, 72, 78);
  g.drawImage(SPR.fb[0], 1050, 200, 64, 64);
  g.drawImage(SPR.blt[0], 1120, 210, 90, 50);
  g.drawImage(SPR.shell[0], 1150, 130, 54, 60);
  // 요괴들 + 탱크 쪼쪼
  [SPR.ghost[0], SPR.reaper[0], SPR.dok[0], SPR.egg[0], SPR.fox[0], SPR.boss[0]].forEach((s, i) =>
    g.drawImage(s, 25 + i * 105, 400, s.width * 0.55, s.height * 0.55));
  g.drawImage(SPR.jjotank[0], 700, 380, 240, 195);
  // 지면 타일 8종 + 장식
  ['grass', 'dark', 'snow', 'sand', 'cloud', 'palace', 'lava', 'steel'].forEach((k, i) =>
    g.drawImage(SPR.ground[k], 25 + i * 68, 590, 60, 60));
  g.drawImage(SPR.flower[0], 590, 592, 48, 54);
  g.drawImage(SPR.flower[1], 650, 592, 48, 54);
  g.drawImage(SPR.grass[0], 710, 605, 48, 36);
}

/* ===== 부팅 ===== */
layout();
uiInit();
let lastT = 0, acc = 0;
function frame(tms) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (tms - lastT) / 1000 || 0.016);
  lastT = tms;
  if (G.mode === 'play' && !G.paused) {
    acc += dt;
    while (acc >= 1 / 60) { update(1 / 60); acc -= 1 / 60; }
  }
  if (window._SHEET) drawSheet();
  else if (G.mode === 'story' && STORY) { STORY.t += dt; renderStory(tms / 1000); }
  else if (G.mode === 'play' || SHOT) render(tms / 1000);
}
loadHD();
if (qs.get('test') === 'sim') { runSim(); }
else if (qs.get('shot') === 'z') { setupSheet(); }
else if (qs.get('shot') === 'st') { // 스토리 컷 검수: ?shot=st&scene=ending&p=2
  buildSprites();
  playStory(qs.get('scene') || 'intro', () => {});
  if (STORY) { STORY.idx = Math.min(+(qs.get('p') || 0), STORY.def.panels.length - 1); STORY.t = 999; }
}
else if (SHOT) { setupShot(); }
else { buildSprites(); }
requestAnimationFrame((t) => { lastT = t; requestAnimationFrame(frame); });
