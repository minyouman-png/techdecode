'use strict';

/* ============================================================
   MENEW EMPIRES  (AI-built indie game, July 2026)
   - 에이지오브히스토리류 세계 역사 시뮬레이션 (턴제 대전략)
   - 실제 세계지도(Natural Earth 50m) → 보로노이 프로빈스 ~1300개
   - 지역별: 인구·식량생산·농업·기술·교육(지식)·문화·군사·불안도
   - AI 국가 경영/전쟁/평화, 외교 패널, 이벤트, 승리/멸망
   - 절차 지형(고도·기후 바이옴·음영) + WebAudio 합성 BGM/SFX
   - 기록: localStorage 닉네임 Top10 + 자동저장(이어하기) + 내보내기
   ============================================================ */

window.onerror = function (msg, src, line) {
  var e = document.getElementById('err');
  if (e) { e.style.display = 'block'; e.textContent = 'Error: ' + msg + ' (line ' + line + ')'; }
};

/* ===== 다국어 ===== */
const I18N = {
  en: {
    sub: 'WORLD HISTORY SIMULATION', start: '🌍 New Game', cont: '▶ Continue', records: '🏆 Records',
    back: '← Back', retry: '🌍 New Game', menu: 'Menu', nickPh: 'Nickname',
    help: '<b>Pick a nation</b> and rule it turn by turn: grow <b>population & food</b>, invest in <b>agriculture · technology · education</b>, raise armies, wage wars.<br><b>Drag</b> to pan · <b>wheel/pinch</b> to zoom · click a province to inspect · <b>End Turn</b> to advance 3 months',
    credit: 'An indie game built 100% with AI · July 2026 · ',
    expSave: '💾 Export Save', impSave: '📂 Import Save',
    impConfirm: 'Overwrite your current records with this save file?',
    impErr: 'Not a valid MENEW EMPIRES save file', expDone: 'Save file downloaded',
    recNote: 'Records are stored in this browser. Export your save to move them to another computer.',
    worldGen: 'Generating world… (provinces, terrain, nations)',
    pickTitle: 'Choose your nation — click on the map', pickGo: '▶ Start in ', pickProv: 'provinces',
    colRank: '#', colName: 'NAME', colScore: 'SCORE', colNation: 'NATION', colProv: 'PROV.', colTurns: 'TURNS', colDate: 'DATE',
    emptyRec: 'No records yet — lead a nation!',
    endTurn: 'End Turn ▶', diplo: '🕊 Diplomacy', pop: 'Population', food: 'Food', agri: 'Agriculture',
    tech: 'Technology', edu: 'Education', culture: 'Culture', army: 'Army', fert: 'Fertility',
    unrest: 'Unrest', capital: 'Capital', gold: 'Gold', income: 'income', upkeep: 'upkeep',
    invest: 'Invest', recruit: '⚔ Recruit', maxLvl: 'MAX', noGold: 'Not enough gold',
    moveHint: 'An army is stationed here. Click a highlighted neighbor to move / attack.',
    attackHint: 'Enemy province — move an army next to it, then attack.',
    foreignHint: 'Foreign province. Declare war in Diplomacy to invade.',
    declareWar: '⚔ Declare War', offerPeace: '🕊 Offer Peace', accept: '✔ Accept',
    atWar: 'AT WAR', rel: 'Relations', offerFrom: 'offers peace',
    warDeclared: '⚔ {a} declared war on {b}!', peaceMade: '🕊 {a} and {b} made peace',
    captured: '{a} captured {p}', fell: '💀 {a} has fallen!', rejected: '{a} rejected the peace offer',
    battleWin: 'Victory! Casualties {n}', battleLose: 'Attack repelled! Casualties {n}',
    ev_harvest: '🌾 Bumper harvest in {p} — population booms', ev_drought: '☀️ Drought in {p} — crops fail',
    ev_plague: '🦠 Plague strikes {p}', ev_tech: '💡 Breakthrough in {p} — technology +1',
    ev_unrest: '🔥 Riots in {p}', turnOf: 'Turn', quitConfirm: 'Return to menu? Progress is auto-saved.',
    victory: '👑 WORLD HEGEMONY!', defeat: '💀 Your nation has fallen', resTitle: '📜 Chronicle',
    finalScore: 'Score', peakProv: 'Peak provinces', survived: 'Turns reigned', newRecord: '🎉 New personal best!',
    dirs: { c: 'Central', n: 'North', s: 'South', e: 'East', w: 'West' },
    q: ['Q1', 'Q2', 'Q3', 'Q4'], newGameConfirm: 'Start a new game? The auto-save will be replaced.',
    militia: 'militia', navalHint: '⚓ coastal — naval invasions possible within range',
    send: '📤 Deploy size', atk: 'Attack', defP: 'Defense',
    techNote: 'Military tech {t} → combat ×{m} (defender bonus ×1.28)',
    perTurn: '/turn', brBase: 'base', brFoodB: 'food', brEduB: 'edu', brGrowth: 'growth',
    tax: 'tax revenue', net: 'Net', prod: 'production', consume: 'consumption', surplus: 'Surplus',
    foodNote: 'Surplus food speeds up population growth; deficit shrinks it.',
    popNote: 'Growth = base 0.2% + food + education − unrest (per province)',
    incNote: 'Income = pop × (1 + 0.28·tech + 0.18·edu) × unrest penalty',
  },
  ko: {
    sub: '세계 역사 시뮬레이션', start: '🌍 새 게임', cont: '▶ 이어하기', records: '🏆 기록실',
    back: '← 뒤로', retry: '🌍 새 게임', menu: '메뉴로', nickPh: '닉네임',
    help: '<b>국가를 선택</b>해 턴마다 통치하세요: <b>인구와 식량</b>을 키우고 <b>농업·기술·교육</b>에 투자하고 군대를 길러 전쟁을 벌입니다.<br><b>드래그</b> 이동 · <b>휠/핀치</b> 확대 · 프로빈스 클릭=정보 · <b>턴 종료</b>=3개월 진행',
    credit: 'AI로 100% 제작한 인디게임 · 2026년 7월 · ',
    expSave: '💾 세이브 내보내기', impSave: '📂 세이브 불러오기',
    impConfirm: '이 세이브 파일로 현재 기록을 덮어쓸까요?',
    impErr: '올바른 MENEW EMPIRES 세이브 파일이 아닙니다', expDone: '세이브 파일이 다운로드되었습니다',
    recNote: '기록은 이 브라우저에 저장됩니다. 다른 컴퓨터로 옮기려면 세이브를 내보내세요.',
    worldGen: '세계 생성 중… (프로빈스·지형·국가)',
    pickTitle: '지도를 클릭해 통치할 국가를 선택하세요', pickGo: '▶ 시작: ', pickProv: '프로빈스',
    colRank: '순위', colName: '닉네임', colScore: '점수', colNation: '국가', colProv: '영토', colTurns: '턴', colDate: '날짜',
    emptyRec: '아직 기록이 없습니다 — 첫 국가를 이끌어 보세요!',
    endTurn: '턴 종료 ▶', diplo: '🕊 외교', pop: '인구', food: '식량', agri: '농업',
    tech: '기술', edu: '교육', culture: '문화', army: '군대', fert: '비옥도',
    unrest: '불안도', capital: '수도', gold: '금', income: '수입', upkeep: '유지비',
    invest: '투자', recruit: '⚔ 모병', maxLvl: '최대', noGold: '금이 부족합니다',
    moveHint: '이 지역에 군대가 주둔 중입니다. 강조된 인접 지역을 클릭하면 이동/공격합니다.',
    attackHint: '적 프로빈스 — 군대를 인접시킨 뒤 공격하세요.',
    foreignHint: '외국 프로빈스입니다. 침공하려면 외교에서 선전포고하세요.',
    declareWar: '⚔ 선전포고', offerPeace: '🕊 평화 제안', accept: '✔ 수락',
    atWar: '전쟁 중', rel: '관계', offerFrom: '평화를 제안했습니다',
    warDeclared: '⚔ {a}이(가) {b}에 선전포고!', peaceMade: '🕊 {a} · {b} 평화 체결',
    captured: '{a}이(가) {p} 점령', fell: '💀 {a} 멸망!', rejected: '{a}이(가) 평화 제안을 거절했습니다',
    battleWin: '승리! 사상자 {n}', battleLose: '공격 격퇴됨! 사상자 {n}',
    ev_harvest: '🌾 {p} 대풍년 — 인구 급증', ev_drought: '☀️ {p} 가뭄 — 흉작',
    ev_plague: '🦠 {p}에 전염병 창궐', ev_tech: '💡 {p} 기술 혁신 — 기술 +1',
    ev_unrest: '🔥 {p} 폭동 발생', turnOf: '턴', quitConfirm: '메뉴로 돌아갈까요? 진행 상황은 자동 저장됩니다.',
    victory: '👑 세계 패권 달성!', defeat: '💀 국가가 멸망했습니다', resTitle: '📜 연대기',
    finalScore: '점수', peakProv: '최대 영토', survived: '통치 턴수', newRecord: '🎉 개인 최고기록 갱신!',
    dirs: { c: '중부', n: '북부', s: '남부', e: '동부', w: '서부' },
    q: ['1분기', '2분기', '3분기', '4분기'], newGameConfirm: '새 게임을 시작할까요? 자동 저장이 교체됩니다.',
    militia: '민병대', navalHint: '⚓ 해안 지역 — 사거리 내 상륙 작전 가능',
    send: '📤 파병 규모', atk: '공격력', defP: '방어력',
    techNote: '군사 기술 {t} → 전투력 ×{m} (방어 시 추가 ×1.28)',
    perTurn: '/턴', brBase: '기본', brFoodB: '식량', brEduB: '교육', brGrowth: '성장률',
    tax: '세금 수입', net: '순수입', prod: '생산', consume: '소비', surplus: '잉여',
    foodNote: '잉여 식량은 인구 성장을 가속하고, 부족하면 인구가 줄어듭니다.',
    popNote: '성장률 = 기본 0.2% + 식량 + 교육 − 불안 (프로빈스별)',
    incNote: '수입 = 인구 × (1 + 0.28×기술 + 0.18×교육) × 불안 보정',
  },
  ja: {
    sub: '世界歴史シミュレーション', start: '🌍 新しいゲーム', cont: '▶ つづきから', records: '🏆 記録室',
    back: '← 戻る', retry: '🌍 新しいゲーム', menu: 'メニューへ', nickPh: 'ニックネーム',
    help: '<b>国家を選び</b>、ターンごとに統治しましょう: <b>人口と食料</b>を増やし、<b>農業・技術・教育</b>に投資し、軍を育てて戦争へ。<br><b>ドラッグ</b>移動 · <b>ホイール/ピンチ</b>拡大 · 州クリック=情報 · <b>ターン終了</b>=3ヶ月進行',
    credit: 'AIだけで作られたインディーゲーム · 2026年7月 · ',
    expSave: '💾 セーブを書き出す', impSave: '📂 セーブを読み込む',
    impConfirm: 'このセーブファイルで現在の記録を上書きしますか？',
    impErr: '正しいMENEW EMPIRESのセーブファイルではありません', expDone: 'セーブファイルをダウンロードしました',
    recNote: '記録はこのブラウザに保存されます。別のパソコンへはセーブの書き出しで移行できます。',
    worldGen: '世界を生成中… (州・地形・国家)',
    pickTitle: '地図をクリックして統治する国を選んでください', pickGo: '▶ 開始: ', pickProv: '州',
    colRank: '順位', colName: '名前', colScore: 'スコア', colNation: '国家', colProv: '領土', colTurns: 'ターン', colDate: '日付',
    emptyRec: 'まだ記録がありません — 国家を率いてみよう！',
    endTurn: 'ターン終了 ▶', diplo: '🕊 外交', pop: '人口', food: '食料', agri: '農業',
    tech: '技術', edu: '教育', culture: '文化', army: '軍隊', fert: '肥沃度',
    unrest: '不安度', capital: '首都', gold: '金', income: '収入', upkeep: '維持費',
    invest: '投資', recruit: '⚔ 徴兵', maxLvl: '最大', noGold: '金が足りません',
    moveHint: 'ここには軍が駐留しています。ハイライトされた隣接州をクリックで移動/攻撃。',
    attackHint: '敵の州 — 軍を隣接させてから攻撃しましょう。',
    foreignHint: '外国の州です。侵攻するには外交で宣戦布告を。',
    declareWar: '⚔ 宣戦布告', offerPeace: '🕊 和平提案', accept: '✔ 受諾',
    atWar: '交戦中', rel: '関係', offerFrom: 'が和平を提案しました',
    warDeclared: '⚔ {a}が{b}に宣戦布告！', peaceMade: '🕊 {a}と{b}が和平を締結',
    captured: '{a}が{p}を占領', fell: '💀 {a}が滅亡！', rejected: '{a}は和平提案を拒否しました',
    battleWin: '勝利！ 死傷者 {n}', battleLose: '攻撃は撃退された！ 死傷者 {n}',
    ev_harvest: '🌾 {p}で大豊作 — 人口急増', ev_drought: '☀️ {p}で干ばつ — 凶作',
    ev_plague: '🦠 {p}で疫病が流行', ev_tech: '💡 {p}で技術革新 — 技術 +1',
    ev_unrest: '🔥 {p}で暴動発生', turnOf: 'ターン', quitConfirm: 'メニューに戻りますか？進行は自動保存されます。',
    victory: '👑 世界覇権を達成！', defeat: '💀 国家が滅亡しました', resTitle: '📜 年代記',
    finalScore: 'スコア', peakProv: '最大領土', survived: '統治ターン数', newRecord: '🎉 自己ベスト更新！',
    dirs: { c: '中部', n: '北部', s: '南部', e: '東部', w: '西部' },
    q: ['第1四半期', '第2四半期', '第3四半期', '第4四半期'], newGameConfirm: '新しいゲームを始めますか？自動セーブは置き換えられます。',
    militia: '民兵', navalHint: '⚓ 沿岸州 — 射程内なら上陸作戦が可能',
    send: '📤 派兵規模', atk: '攻撃力', defP: '防御力',
    techNote: '軍事技術 {t} → 戦闘力 ×{m} (防御時さらに ×1.28)',
    perTurn: '/ターン', brBase: '基本', brFoodB: '食料', brEduB: '教育', brGrowth: '成長率',
    tax: '税収', net: '純収入', prod: '生産', consume: '消費', surplus: '余剰',
    foodNote: '余剰食料は人口増加を加速し、不足すると人口が減ります。',
    popNote: '成長率 = 基本 0.2% + 食料 + 教育 − 不安 (州ごと)',
    incNote: '収入 = 人口 × (1 + 0.28×技術 + 0.18×教育) × 不安補正',
  },
  es: {
    sub: 'SIMULACIÓN DE HISTORIA MUNDIAL', start: '🌍 Nueva partida', cont: '▶ Continuar', records: '🏆 Récords',
    back: '← Atrás', retry: '🌍 Nueva partida', menu: 'Menú', nickPh: 'Apodo',
    help: '<b>Elige una nación</b> y gobiérnala turno a turno: haz crecer <b>población y comida</b>, invierte en <b>agricultura · tecnología · educación</b>, recluta ejércitos y libra guerras.<br><b>Arrastra</b> para mover · <b>rueda/pellizco</b> para zoom · clic en una provincia = información · <b>Fin de turno</b> = 3 meses',
    credit: 'Un juego indie creado 100% con IA · Julio de 2026 · ',
    expSave: '💾 Exportar partida', impSave: '📂 Importar partida',
    impConfirm: '¿Sobrescribir tus récords actuales con esta partida?',
    impErr: 'No es un archivo de guardado válido de MENEW EMPIRES', expDone: 'Partida descargada',
    recNote: 'Los récords se guardan en este navegador. Exporta tu partida para llevarlos a otro ordenador.',
    worldGen: 'Generando el mundo… (provincias, terreno, naciones)',
    pickTitle: 'Elige tu nación — haz clic en el mapa', pickGo: '▶ Empezar: ', pickProv: 'provincias',
    colRank: '#', colName: 'NOMBRE', colScore: 'PUNTOS', colNation: 'NACIÓN', colProv: 'PROV.', colTurns: 'TURNOS', colDate: 'FECHA',
    emptyRec: 'Aún no hay récords — ¡lidera una nación!',
    endTurn: 'Fin de turno ▶', diplo: '🕊 Diplomacia', pop: 'Población', food: 'Comida', agri: 'Agricultura',
    tech: 'Tecnología', edu: 'Educación', culture: 'Cultura', army: 'Ejército', fert: 'Fertilidad',
    unrest: 'Descontento', capital: 'Capital', gold: 'Oro', income: 'ingresos', upkeep: 'mantenimiento',
    invest: 'Invertir', recruit: '⚔ Reclutar', maxLvl: 'MÁX', noGold: 'No hay oro suficiente',
    moveHint: 'Hay un ejército aquí. Haz clic en un vecino resaltado para mover / atacar.',
    attackHint: 'Provincia enemiga — acerca un ejército y ataca.',
    foreignHint: 'Provincia extranjera. Declara la guerra en Diplomacia para invadir.',
    declareWar: '⚔ Declarar guerra', offerPeace: '🕊 Ofrecer paz', accept: '✔ Aceptar',
    atWar: 'EN GUERRA', rel: 'Relaciones', offerFrom: 'ofrece la paz',
    warDeclared: '⚔ ¡{a} declaró la guerra a {b}!', peaceMade: '🕊 {a} y {b} firmaron la paz',
    captured: '{a} capturó {p}', fell: '💀 ¡{a} ha caído!', rejected: '{a} rechazó la oferta de paz',
    battleWin: '¡Victoria! Bajas {n}', battleLose: '¡Ataque repelido! Bajas {n}',
    ev_harvest: '🌾 Cosecha récord en {p} — la población crece', ev_drought: '☀️ Sequía en {p} — malas cosechas',
    ev_plague: '🦠 La peste golpea {p}', ev_tech: '💡 Avance en {p} — tecnología +1',
    ev_unrest: '🔥 Disturbios en {p}', turnOf: 'Turno', quitConfirm: '¿Volver al menú? El progreso se guarda automáticamente.',
    victory: '👑 ¡HEGEMONÍA MUNDIAL!', defeat: '💀 Tu nación ha caído', resTitle: '📜 Crónica',
    finalScore: 'Puntuación', peakProv: 'Máx. provincias', survived: 'Turnos de reinado', newRecord: '🎉 ¡Nueva mejor marca!',
    dirs: { c: 'Central', n: 'Norte', s: 'Sur', e: 'Este', w: 'Oeste' },
    q: ['T1', 'T2', 'T3', 'T4'], newGameConfirm: '¿Empezar una nueva partida? El autoguardado será reemplazado.',
    militia: 'milicia', navalHint: '⚓ costera — invasiones navales posibles dentro del alcance',
    send: '📤 Tropas a enviar', atk: 'Ataque', defP: 'Defensa',
    techNote: 'Tecnología militar {t} → combate ×{m} (defensor ×1.28 extra)',
    perTurn: '/turno', brBase: 'base', brFoodB: 'comida', brEduB: 'edu.', brGrowth: 'crecimiento',
    tax: 'impuestos', net: 'Neto', prod: 'producción', consume: 'consumo', surplus: 'Excedente',
    foodNote: 'El excedente de comida acelera el crecimiento; el déficit lo reduce.',
    popNote: 'Crecimiento = base 0,2% + comida + educación − descontento (por provincia)',
    incNote: 'Ingresos = población × (1 + 0,28·tec. + 0,18·edu.) × ajuste por descontento',
  },
  zh: {
    sub: '世界历史模拟', start: '🌍 新游戏', cont: '▶ 继续游戏', records: '🏆 记录室',
    back: '← 返回', retry: '🌍 新游戏', menu: '菜单', nickPh: '昵称',
    help: '<b>选择一个国家</b>，逐回合统治：发展<b>人口与粮食</b>，投资<b>农业·科技·教育</b>，招募军队，发动战争。<br><b>拖动</b>平移 · <b>滚轮/双指</b>缩放 · 点击省份=查看信息 · <b>结束回合</b>=推进3个月',
    credit: '100% 由 AI 制作的独立游戏 · 2026年7月 · ',
    expSave: '💾 导出存档', impSave: '📂 导入存档',
    impConfirm: '用此存档覆盖当前记录？',
    impErr: '不是有效的 MENEW EMPIRES 存档文件', expDone: '存档已下载',
    recNote: '记录保存在此浏览器中。导出存档即可迁移到其他电脑。',
    worldGen: '正在生成世界…（省份·地形·国家）',
    pickTitle: '点击地图选择你要统治的国家', pickGo: '▶ 开始: ', pickProv: '省份',
    colRank: '#', colName: '昵称', colScore: '分数', colNation: '国家', colProv: '领土', colTurns: '回合', colDate: '日期',
    emptyRec: '还没有记录——去领导一个国家吧！',
    endTurn: '结束回合 ▶', diplo: '🕊 外交', pop: '人口', food: '粮食', agri: '农业',
    tech: '科技', edu: '教育', culture: '文化', army: '军队', fert: '肥沃度',
    unrest: '动荡度', capital: '首都', gold: '金币', income: '收入', upkeep: '维护费',
    invest: '投资', recruit: '⚔ 征兵', maxLvl: '最高', noGold: '金币不足',
    moveHint: '此地驻有军队。点击高亮的相邻省份即可移动/进攻。',
    attackHint: '敌方省份——将军队移到相邻处再进攻。',
    foreignHint: '外国省份。想入侵请先在外交中宣战。',
    declareWar: '⚔ 宣战', offerPeace: '🕊 求和', accept: '✔ 接受',
    atWar: '交战中', rel: '关系', offerFrom: '提出和平',
    warDeclared: '⚔ {a}向{b}宣战！', peaceMade: '🕊 {a}与{b}缔结和平',
    captured: '{a}占领了{p}', fell: '💀 {a}灭亡！', rejected: '{a}拒绝了和平提议',
    battleWin: '胜利！伤亡 {n}', battleLose: '进攻被击退！伤亡 {n}',
    ev_harvest: '🌾 {p}大丰收——人口激增', ev_drought: '☀️ {p}遭遇干旱——歉收',
    ev_plague: '🦠 瘟疫席卷{p}', ev_tech: '💡 {p}技术突破——科技 +1',
    ev_unrest: '🔥 {p}爆发暴乱', turnOf: '回合', quitConfirm: '返回菜单？进度已自动保存。',
    victory: '👑 称霸世界！', defeat: '💀 你的国家灭亡了', resTitle: '📜 编年史',
    finalScore: '分数', peakProv: '最大领土', survived: '统治回合数', newRecord: '🎉 刷新个人最佳！',
    dirs: { c: '中部', n: '北部', s: '南部', e: '东部', w: '西部' },
    q: ['第一季度', '第二季度', '第三季度', '第四季度'], newGameConfirm: '开始新游戏？自动存档将被替换。',
    militia: '民兵', navalHint: '⚓ 沿海省份——射程内可发动登陆作战',
    send: '📤 派兵规模', atk: '攻击力', defP: '防御力',
    techNote: '军事科技 {t} → 战斗力 ×{m}（防守方额外 ×1.28）',
    perTurn: '/回合', brBase: '基础', brFoodB: '粮食', brEduB: '教育', brGrowth: '增长率',
    tax: '税收', net: '净收入', prod: '生产', consume: '消耗', surplus: '盈余',
    foodNote: '粮食盈余会加速人口增长，短缺则使人口减少。',
    popNote: '增长率 = 基础 0.2% + 粮食 + 教育 − 动荡（按省份）',
    incNote: '收入 = 人口 × (1 + 0.28×科技 + 0.18×教育) × 动荡修正',
  },
};
let LANG = new URLSearchParams(location.search).get('lang');
if (!I18N[LANG]) LANG = (navigator.language || 'en').slice(0, 2);
if (!I18N[LANG]) LANG = 'en';
const L = I18N[LANG];
const NKEY = { en: 'NAME', ko: 'NAME_KO', ja: 'NAME_JA', es: 'NAME_ES', zh: 'NAME_ZH' }[LANG];

/* 문화권(SUBREGION) 번역 */
const CULT = {
  'Northern Africa': ['N. African', '북아프리카', '北アフリカ', 'Norteafricana', '北非'],
  'Western Africa': ['W. African', '서아프리카', '西アフリカ', 'Africana occ.', '西非'],
  'Eastern Africa': ['E. African', '동아프리카', '東アフリカ', 'Africana or.', '东非'],
  'Middle Africa': ['C. African', '중앙아프리카', '中央アフリカ', 'Africana cen.', '中部非洲'],
  'Southern Africa': ['S. African', '남아프리카', '南アフリカ', 'Sudafricana', '南部非洲'],
  'Northern America': ['N. American', '북아메리카', '北アメリカ', 'Norteamericana', '北美'],
  'Central America': ['C. American', '중앙아메리카', '中米', 'Centroamericana', '中美'],
  'Caribbean': ['Caribbean', '카리브', 'カリブ', 'Caribeña', '加勒比'],
  'South America': ['S. American', '남아메리카', '南アメリカ', 'Sudamericana', '南美'],
  'Northern Europe': ['N. European', '북유럽', '北欧', 'Nordeuropea', '北欧'],
  'Western Europe': ['W. European', '서유럽', '西欧', 'Europea occ.', '西欧'],
  'Eastern Europe': ['E. European', '동유럽', '東欧', 'Europea or.', '东欧'],
  'Southern Europe': ['S. European', '남유럽', '南欧', 'Sureuropea', '南欧'],
  'Central Asia': ['C. Asian', '중앙아시아', '中央アジア', 'Centroasiática', '中亚'],
  'Eastern Asia': ['E. Asian', '동아시아', '東アジア', 'Asiática or.', '东亚'],
  'South-Eastern Asia': ['SE. Asian', '동남아시아', '東南アジア', 'Sudesteasiática', '东南亚'],
  'Southern Asia': ['S. Asian', '남아시아', '南アジア', 'Surasiática', '南亚'],
  'Western Asia': ['W. Asian', '서아시아', '西アジア', 'Asiática occ.', '西亚'],
  'Australia and New Zealand': ['Oceanian', '오세아니아', 'オセアニア', 'Oceánica', '大洋洲'],
  'Melanesia': ['Melanesian', '멜라네시아', 'メラネシア', 'Melanesia', '美拉尼西亚'],
  'Micronesia': ['Micronesian', '미크로네시아', 'ミクロネシア', 'Micronesia', '密克罗尼西亚'],
  'Polynesia': ['Polynesian', '폴리네시아', 'ポリネシア', 'Polinesia', '波利尼西亚'],
  'Seven seas (open ocean)': ['Islander', '도서', '島嶼', 'Insular', '岛屿'],
};
const LI = { en: 0, ko: 1, ja: 2, es: 3, zh: 4 }[LANG];
function cultName(sub) { const c = CULT[sub]; return c ? c[LI] : sub; }

/* ===== 상수 ===== */
const MAPW = 2048, MAPH = 1024;
const NAVAL_RANGE = 90;           // px (≈1,700km)
const REC_KEY = 'empires_save', GAME_KEY = 'empires_game';
const qs = new URLSearchParams(location.search);
const SHOT = qs.has('shot');

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function fmt(n) {
  n = Math.round(n); const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (a >= 1e4) return (n / 1e3).toFixed(0) + 'K';
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return '' + n;
}
const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X', ' XI', ' XII'];

/* ===== 기록 세이브 ===== */
function loadRec() {
  try { const s = JSON.parse(localStorage.getItem(REC_KEY)); if (s && Array.isArray(s.top10)) return s; } catch (e) {}
  return { nick: '', top10: [], muted: false, best: 0 };
}
function storeRec() { try { localStorage.setItem(REC_KEY, JSON.stringify(REC)); } catch (e) {} }
let REC = loadRec();

/* ============================================================
   노이즈 · 지형
   ============================================================ */
function h2(x, y) {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return h2(xi, yi) * (1 - u) * (1 - v) + h2(xi + 1, yi) * u * (1 - v) +
         h2(xi, yi + 1) * (1 - u) * v + h2(xi + 1, yi + 1) * u * v;
}
function fbm(x, y) { return vnoise(x, y) * 0.55 + vnoise(x * 2.13, y * 2.13) * 0.28 + vnoise(x * 4.31, y * 4.31) * 0.17; }

/* ============================================================
   세계 생성
   ============================================================ */
const C = [];   // 국가
const P = [];   // 프로빈스
let grid = null;          // Uint16 pid+1 per px (0=바다, 65535=중립대륙)
let adjArr = [];          // pid → Int32Array 인접(육상+해상)
let landAdj = [];         // pid → 육상 인접만
let terCanvas = null;     // 지형 오프스크린
let antarcticaPath = null;
let cAdj = [];            // cid → Set(cid) 국가 인접

function proj(lon, lat) { return [(lon + 180) / 360 * MAPW, (90 - lat) / 180 * MAPH]; }

// 영문 도시명 → 해당 도시가 포함된 프로빈스 id (grid 생성 이후 사용 가능)
function cityProvOf(en) {
  if (typeof CITIES === 'undefined' || !grid) return -1;
  for (const ct of CITIES) {
    if (ct[4].split('|')[0] !== en) continue;
    const gx = Math.round(ct[0]), gy = Math.round(ct[1]);
    if (gx < 1 || gx >= MAPW - 1 || gy < 1 || gy >= MAPH - 1) continue;
    let g = grid[gy * MAPW + gx];
    if (!g || g >= 65534) {
      for (const off of [1, -1, MAPW, -MAPW]) {
        const gg = grid[gy * MAPW + gx + off];
        if (gg && gg < 65534) { g = gg; break; }
      }
    }
    if (g && g < 65534 && !P[g - 1].dead) return g - 1;
  }
  return -1;
}

function ringsOf(geom) {
  const out = [];
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) for (const ring of poly) {
    const r = ring.map(pt => proj(pt[0], pt[1]));
    if (r.length >= 4) out.push(r);
  }
  return out;
}
function pathOf(rings) {
  const p = new Path2D();
  for (const r of rings) {
    p.moveTo(r[0][0], r[0][1]);
    for (let i = 1; i < r.length; i++) p.lineTo(r[i][0], r[i][1]);
    p.closePath();
  }
  return p;
}
function bboxOf(rings) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const r of rings) for (const p of r) {
    if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
    if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
  }
  return [x0, y0, x1, y1];
}

/* Sutherland–Hodgman: 링(오목 가능)을 볼록 셀로 클리핑 */
function clipRing(ring, cell) {
  let area = 0;
  for (let i = 0; i < cell.length; i++) {
    const a = cell[i], b = cell[(i + 1) % cell.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const s = area >= 0 ? 1 : -1;
  let out = ring;
  for (let i = 0; i < cell.length && out.length; i++) {
    const a = cell[i], b = cell[(i + 1) % cell.length];
    const ex = b[0] - a[0], ey = b[1] - a[1];
    if (!ex && !ey) continue;
    const inp = out; out = [];
    for (let j = 0; j < inp.length; j++) {
      const p = inp[j], q = inp[(j + 1) % inp.length];
      const cp = ex * (p[1] - a[1]) - ey * (p[0] - a[0]);
      const cq = ex * (q[1] - a[1]) - ey * (q[0] - a[0]);
      const pi = s * cp >= -1e-9, qi = s * cq >= -1e-9;
      if (pi) out.push(p);
      if (pi !== qi) {
        const dx = q[0] - p[0], dy = q[1] - p[1];
        const den = ex * dy - ey * dx;
        if (den) {
          const t = -cp / den;
          out.push([p[0] + dx * t, p[1] + dy * t]);
        }
      }
    }
  }
  return out.length >= 3 ? out : null;
}

const TIER3 = new Set(['Western Europe', 'Northern Europe', 'Northern America', 'Australia and New Zealand']);
const TIER2 = new Set(['Southern Europe', 'Eastern Europe', 'South America', 'Central America', 'Caribbean',
  'South-Eastern Asia', 'Western Asia', 'Central Asia', 'Eastern Asia', 'Southern Africa']);
const ISO_TIER = { KR: 3, JP: 3, TW: 3, SG: 3, IL: 3, CN: 2, KP: 1, MN: 1, AF: 1, YE: 1 };

let genSeed = 1;
function generateWorld(seed) {
  genSeed = seed;
  const rng = mulberry32(seed);
  C.length = 0; P.length = 0; cAdj = [];
  const hit = document.createElement('canvas'); hit.width = 4; hit.height = 4;
  const hx = hit.getContext('2d');

  // ── 국가 파싱
  const antRings = [];
  for (const f of WORLD_GEO.features) {
    if (!f.geometry) continue;
    const pr = f.properties;
    if (pr.CONTINENT === 'Antarctica') { antRings.push(...ringsOf(f.geometry)); continue; }
    const rings = ringsOf(f.geometry);
    if (!rings.length) continue;
    const id = C.length;
    const tier = ISO_TIER[pr.ISO_A2] || (TIER3.has(pr.SUBREGION) ? 3 : TIER2.has(pr.SUBREGION) ? 2 : 1);
    const hue = (id * 137.508 + seed * 31) % 360;
    C.push({
      id, iso: pr.ISO_A2, sub: pr.SUBREGION || '', cont: pr.CONTINENT || '',
      names: { en: pr.NAME, ko: pr.NAME_KO || pr.NAME, ja: pr.NAME_JA || pr.NAME, es: pr.NAME_ES || pr.NAME, zh: pr.NAME_ZH || pr.NAME },
      pop0: Math.max(1000, pr.POP_EST || 100000), tier,
      rings, path: pathOf(rings), bbox: bboxOf(rings),
      color: `hsl(${hue.toFixed(0)},${(42 + (id * 7) % 20)}%,${(50 + (id * 11) % 16)}%)`,
      hue,
      gold: 0, wars: new Set(), rel: new Map(), offers: [], alive: true,
      aggr: rng(), provs: [], capital: -1, frontTarget: -1,
    });
  }
  antarcticaPath = antRings.length ? pathOf(antRings) : null;

  // ── 프로빈스: 국가별 보로노이 분할
  for (const c of C) {
    const [x0, y0, x1, y1] = c.bbox;
    const bw = x1 - x0, bh = y1 - y0;
    const areaEst = Math.max(1, bw * bh * 0.45);
    let k = Math.round(Math.sqrt(areaEst) / 8 + Math.sqrt(c.pop0) / 2400);
    k = Math.max(1, Math.min(46, k));
    let provRings = [];
    if (k <= 1 || bw < 6 || bh < 6) {
      provRings = [c.rings];
    } else {
      // 시드 샘플링 (국가 내부, 최소 간격 시도)
      const seeds = [];
      const minD2 = (areaEst / k) * 0.28;
      let guard = 0;
      while (seeds.length < k && guard++ < k * 260) {
        const x = x0 + rng() * bw, y = y0 + rng() * bh;
        if (!hx.isPointInPath(c.path, x, y, 'evenodd')) continue;
        let ok = true;
        for (const s2 of seeds) {
          const dx = s2[0] - x, dy = s2[1] - y;
          if (dx * dx + dy * dy < minD2 && guard < k * 170) { ok = false; break; }
        }
        if (ok) seeds.push([x, y]);
      }
      if (seeds.length <= 1) provRings = [c.rings];
      else {
        const del = d3.Delaunay.from(seeds);
        const vor = del.voronoi([x0 - 4, y0 - 4, x1 + 4, y1 + 4]);
        for (let i = 0; i < seeds.length; i++) {
          const cell = vor.cellPolygon(i);
          if (!cell) continue;
          const clipped = [];
          for (const ring of c.rings) {
            const cr = clipRing(ring, cell);
            if (cr) clipped.push(cr);
          }
          if (clipped.length) provRings.push(clipped);
        }
        if (!provRings.length) provRings = [c.rings];
      }
    }
    for (const rings of provRings) {
      const pid = P.length;
      P.push({
        id: pid, cid: c.id, ocid: c.id, rings, path: pathOf(rings), bbox: bboxOf(rings),
        cx: 0, cy: 0, px: 0, coastal: false, capital: false, dead: false,
        pop: 0, agri: 1, tech: 1, edu: 1, unrest: 0, fert: 1, name: '',
      });
      c.provs.push(pid);
    }
  }

  // ── 인덱스 래스터 (히트테스트·인접·면적·중심)
  const rc = document.createElement('canvas'); rc.width = MAPW; rc.height = MAPH;
  const rx = rc.getContext('2d', { willReadFrequently: true });
  rx.imageSmoothingEnabled = false;
  for (const p of P) {
    const v = p.id + 1;
    rx.fillStyle = `rgb(${(v >> 8) & 255},${v & 255},255)`;
    rx.fill(p.path, 'evenodd');
  }
  if (antarcticaPath) { rx.fillStyle = 'rgb(255,254,255)'; rx.fill(antarcticaPath, 'evenodd'); } // 65534+1
  const img = rx.getImageData(0, 0, MAPW, MAPH).data;
  grid = new Uint16Array(MAPW * MAPH);
  const N = MAPW * MAPH;
  for (let i = 0; i < N; i++) {
    const o = i * 4;
    if (img[o + 3] < 200) continue;                 // 바다
    if (img[o + 2] > 250) {
      const v = (img[o] << 8) | img[o + 1];
      if (v >= 1 && v <= P.length) {
        // AA 블렌딩이 만든 팬텀 ID 방어: 벡터 bbox 안에 있어야 유효
        const b = P[v - 1].bbox, x = i % MAPW, y = (i / MAPW) | 0;
        if (x >= b[0] - 2 && x <= b[2] + 2 && y >= b[1] - 2 && y <= b[3] + 2) { grid[i] = v; continue; }
      }
      if (v === 65534) { grid[i] = 65535; continue; } // 남극(중립)
    }
    grid[i] = 65534;                                 // 블렌딩 픽셀 → 후처리
  }
  // 블렌딩 픽셀: 이웃 다수결
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < N; i++) {
      if (grid[i] !== 65534) continue;
      const x = i % MAPW;
      const cand = [i - 1, i + 1, i - MAPW, i + MAPW];
      let got = 0;
      for (const j of cand) {
        if (j < 0 || j >= N) continue;
        if (Math.abs((j % MAPW) - x) > 1) continue;
        const g = grid[j];
        if (g > 0 && g !== 65534) { got = g; break; }
      }
      grid[i] = got || (pass ? 0 : 65534);
    }
  }
  // 면적·중심·해안·인접
  const cnt = new Float64Array(P.length), sx = new Float64Array(P.length), sy = new Float64Array(P.length);
  const adjSets = P.map(() => new Set());
  const coast = new Uint8Array(P.length);
  for (let y = 0; y < MAPH; y++) for (let x = 0; x < MAPW; x++) {
    const i = y * MAPW + x, g = grid[i];
    if (g === 0 || g === 65535) {
      continue;
    }
    const pid = g - 1;
    cnt[pid]++; sx[pid] += x; sy[pid] += y;
    const gr = x + 1 < MAPW ? grid[i + 1] : 0, gd = y + 1 < MAPH ? grid[i + MAPW] : 0;
    if (gr === 0 || gd === 0 || (x > 0 && grid[i - 1] === 0) || (y > 0 && grid[i - MAPW] === 0)) coast[pid] = 1;
    if (gr > 0 && gr !== 65535 && gr !== g) { adjSets[pid].add(gr - 1); adjSets[gr - 1].add(pid); }
    if (gd > 0 && gd !== 65535 && gd !== g) { adjSets[pid].add(gd - 1); adjSets[gd - 1].add(pid); }
  }
  for (const p of P) {
    p.px = cnt[p.id];
    if (p.px < 2) { p.dead = true; continue; }
    p.cx = sx[p.id] / p.px; p.cy = sy[p.id] / p.px;
    p.coastal = !!coast[p.id];
  }
  // 죽은(래스터 0px) 프로빈스 정리
  for (const c of C) {
    c.provs = c.provs.filter(pid => !P[pid].dead);
    if (!c.provs.length) c.alive = false;
  }
  landAdj = adjSets.map(s => Int32Array.from(s));
  // 해상 인접 (해안 ↔ 해안, 랩어라운드 거리)
  const navSets = P.map(() => new Set());
  const coastal = P.filter(p => p.coastal && !p.dead);
  const bucket = new Map();
  const BS = NAVAL_RANGE;
  for (const p of coastal) {
    const bxk = Math.floor(p.cx / BS), byk = Math.floor(p.cy / BS);
    const key = bxk + '_' + byk;
    if (!bucket.has(key)) bucket.set(key, []);
    bucket.get(key).push(p);
  }
  for (const p of coastal) {
    const bxk = Math.floor(p.cx / BS), byk = Math.floor(p.cy / BS);
    const nbx = Math.ceil(MAPW / BS);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const arr = bucket.get(((bxk + dx + nbx) % nbx) + '_' + (byk + dy));
      if (!arr) continue;
      for (const q of arr) {
        if (q.id <= p.id) continue;
        let ddx = Math.abs(q.cx - p.cx); if (ddx > MAPW / 2) ddx = MAPW - ddx;
        const ddy = q.cy - p.cy;
        if (ddx * ddx + ddy * ddy < NAVAL_RANGE * NAVAL_RANGE && !adjSets[p.id].has(q.id)) {
          navSets[p.id].add(q.id); navSets[q.id].add(p.id);
        }
      }
    }
  }
  adjArr = P.map((p, i) => Int32Array.from(new Set([...adjSets[i], ...navSets[i]])));
  // 국가 인접
  cAdj = C.map(() => new Set());
  for (const p of P) {
    if (p.dead) continue;
    for (const q of adjArr[p.id]) {
      const oc = P[q].cid;
      if (oc !== p.cid) { cAdj[p.cid].add(oc); cAdj[oc].add(p.cid); }
    }
  }

  // ── 주요 도시 → 프로빈스 이름·수도 (CITIES: 인구순 정렬, [x,y,pop,capFlag,names])
  const cityByProv = new Map(), capCity = new Map();
  if (typeof CITIES !== 'undefined') {
    for (const ct of CITIES) {
      const gx = Math.round(ct[0]), gy = Math.round(ct[1]);
      if (gx < 1 || gx >= MAPW - 1 || gy < 1 || gy >= MAPH - 1) continue;
      let g = grid[gy * MAPW + gx];
      if (!g || g >= 65534) { // 해안 도시가 바다 픽셀에 떨어진 경우 이웃 탐색
        for (const off of [1, -1, MAPW, -MAPW, MAPW + 1, MAPW - 1, 1 - MAPW, -1 - MAPW]) {
          const gg = grid[gy * MAPW + gx + off];
          if (gg && gg < 65534) { g = gg; break; }
        }
      }
      if (!g || g >= 65534) continue;
      const pid = g - 1;
      if (P[pid].dead) continue;
      if (!cityByProv.has(pid)) cityByProv.set(pid, ct);
      if (ct[3] && !capCity.has(P[pid].cid)) capCity.set(P[pid].cid, pid);
    }
  }

  // ── 시뮬 초기화: 비옥도·인구 배분·수도·이름·레벨
  for (const c of C) {
    if (!c.alive) continue;
    let wsum = 0;
    let ccx = 0, ccy = 0, cpx = 0;
    for (const pid of c.provs) { const p = P[pid]; ccx += p.cx * p.px; ccy += p.cy * p.px; cpx += p.px; }
    ccx /= cpx; ccy /= cpx; c.cx = ccx; c.cy = ccy; c.px = cpx;
    for (const pid of c.provs) {
      const p = P[pid];
      const lat = Math.abs(90 - p.cy / MAPH * 180);
      let f = lat <= 10 ? 0.95 : lat <= 22 ? 0.62 : lat <= 38 ? 1.18 : lat <= 55 ? 1.3 : lat <= 65 ? 0.72 : 0.32;
      f *= 0.72 + 0.56 * fbm(p.cx * 0.02 + 31, p.cy * 0.02 + 77);
      if (p.coastal) f += 0.12;
      p.fert = Math.max(0.2, Math.min(1.6, f));
      p.w = p.px * p.fert;
      wsum += p.w;
    }
    // 수도 = 실제 수도 도시 위치 (없으면 가중치 최대)
    let cap = capCity.get(c.id);
    if (cap === undefined || P[cap].dead || P[cap].cid !== c.id) {
      cap = c.provs[0];
      for (const pid of c.provs) if (P[pid].w > P[cap].w) cap = pid;
    }
    c.capital = cap; P[cap].capital = true; P[cap].w *= 2.4; wsum += P[cap].w / 2.4 * 1.4;
    const dirCount = { c: 0, n: 0, s: 0, e: 0, w: 0 };
    for (const pid of c.provs) {
      const p = P[pid];
      p.pop = Math.max(500, Math.round(c.pop0 * p.w / wsum));
      p.agri = Math.min(10, c.tier + (p.fert > 1 ? 1 : 0));
      p.tech = c.tier; p.edu = c.tier;
      // 이름: 방위 + 로마숫자
      const dx = p.cx - ccx, dy = p.cy - ccy;
      const rr = Math.hypot(dx, dy);
      let d = 'c';
      if (c.provs.length > 1 && rr > Math.sqrt(cpx) * 0.34) {
        d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
      }
      p.dir = d;
      const ct = cityByProv.get(pid);
      if (ct) {
        const parts = ct[4].split('|');
        p.name = (p.capital ? '★ ' : '') + (parts[LI] || parts[0]);
        p.cityNamed = true;
      } else {
        p.name = (p.capital && c.provs.length > 1) ? '★ ' + c.names[LANG] :
          c.names[LANG] + ' ' + L.dirs[d] + ROMAN[Math.min(dirCount[d], 11)];
      }
      dirCount[d]++;
    }
    // 초기 군대·금
    c.gold = 1500 + c.pop0 * 3e-5 * c.tier;
  }
  // ── 시나리오 튜닝: 한반도 버프 (2026-07 커스텀)
  // 한반도 국가(KR·KP) 전역: 기술·교육 +1
  for (const c of C) {
    if (!c.alive || (c.iso !== 'KR' && c.iso !== 'KP')) continue;
    for (const pid of c.provs) {
      P[pid].tech = Math.min(10, P[pid].tech + 1);
      P[pid].edu = Math.min(10, P[pid].edu + 1);
    }
  }
  const seoulPid = cityProvOf('Seoul');
  const wonjuPid = cityProvOf('Wonju');
  // 서울: 인구 2배
  if (seoulPid >= 0) P[seoulPid].pop = Math.round(P[seoulPid].pop * 2);
  // 원주: 인구 5배, 기술·교육 +3, 불안도 항상 0
  if (wonjuPid >= 0) {
    const p = P[wonjuPid];
    p.pop = Math.round(p.pop * 5);
    p.tech = Math.min(10, p.tech + 3);
    p.edu = Math.min(10, p.edu + 3);
    p.unrest = 0; p.calm = true;
    if (wonjuPid !== seoulPid) { // 원주가 서울과 다른 프로빈스일 때만 이름 교체
      const wct = CITIES.find(ct => ct[4].split('|')[0] === 'Wonju');
      if (wct) {
        const parts = wct[4].split('|');
        p.name = (p.capital ? '★ ' : '') + (parts[LI] || parts[0]);
        p.cityNamed = true;
      }
    }
  }

  // 초기 군대: 수도+국경에 배치
  armies.clear();
  for (const c of C) {
    if (!c.alive) continue;
    const total = Math.round(c.pop0 * 0.006 * (0.7 + 0.3 * c.tier));
    const spots = [c.capital];
    for (const pid of c.provs) if (spots.length < 4 && pid !== c.capital && P[pid].coastal) spots.push(pid);
    for (let i = 0; i < spots.length; i++) {
      const sz = Math.round(total / spots.length);
      if (sz > 200) armies.set(spots[i], { size: sz, cid: c.id, moved: false });
    }
  }
  buildTerrain();
}

/* ── 지형 텍스처 ── */
function buildTerrain() {
  terCanvas = document.createElement('canvas'); terCanvas.width = MAPW; terCanvas.height = MAPH;
  const tx = terCanvas.getContext('2d');
  const out = tx.createImageData(MAPW, MAPH);
  const d = out.data;
  const elev = new Float32Array(MAPW * MAPH);
  for (let y = 0; y < MAPH; y++) for (let x = 0; x < MAPW; x++)
    elev[y * MAPW + x] = fbm(x * 0.009, y * 0.009);
  for (let y = 0; y < MAPH; y++) {
    const lat = Math.abs(90 - y / MAPH * 180);
    for (let x = 0; x < MAPW; x++) {
      const i = y * MAPW + x, o = i * 4;
      const g = grid[i];
      const e = elev[i];
      if (g === 0) { // 바다
        let r = 14, gg = 45, b = 78;
        const depth = 0.75 + 0.25 * vnoise(x * 0.02, y * 0.02);
        r *= depth; gg *= depth; b *= depth;
        // 해안 얕은 물
        let nearLand = false;
        for (let k = 1; k <= 2 && !nearLand; k++) {
          if (x >= k && grid[i - k] && grid[i - k] !== 0) nearLand = true;
          else if (x + k < MAPW && grid[i + k] !== 0) nearLand = true;
          else if (y >= k && grid[i - k * MAPW] !== 0) nearLand = true;
          else if (y + k < MAPH && grid[i + k * MAPW] !== 0) nearLand = true;
        }
        if (nearLand) { r += 24; gg += 42; b += 46; }
        if (lat > 74 + 5 * vnoise(x * 0.05, y * 0.05)) { r = 205; gg = 222; b = 232; } // 유빙
        d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255;
        continue;
      }
      // 육지 바이옴
      const moist = fbm(x * 0.012 + 53, y * 0.012 + 91);
      let r, gg, b;
      if (g === 65535 || lat > 77 || (lat > 58 && e > 0.74)) { r = 226; gg = 233; b = 238; }             // 만년설
      else if (lat > 62) { const t = (lat - 62) / 15; r = 138 + 60 * t; gg = 142 + 55 * t; b = 118 + 70 * t; } // 툰드라
      else if (lat > 14 && lat < 36 && moist < 0.44) { r = 205; gg = 182; b = 132; }                     // 사막
      else if (lat < 12 && moist > 0.5) { r = 40; gg = 105; b = 52; }                                    // 열대우림
      else if (lat < 24 && moist <= 0.5) { r = 158; gg = 158; b = 92; }                                  // 사바나
      else { const t = Math.min(1, moist * 1.4); r = 118 - 40 * t; gg = 138 + 8 * t; b = 70; }           // 온대
      if (e > 0.76 && lat < 77 && g !== 65535) { const t = (e - 0.76) / 0.24; r = r * (1 - t) + 148 * t; gg = gg * (1 - t) + 140 * t; b = b * (1 - t) + 132 * t; }
      // 음영(힐셰이드)
      const ew = x > 0 ? elev[i - 1] : e, ee = x + 1 < MAPW ? elev[i + 1] : e;
      const en = y > 0 ? elev[i - MAPW] : e, es = y + 1 < MAPH ? elev[i + MAPW] : e;
      const sh = 1 + (ew - ee + en - es) * 1.7;
      r *= sh; gg *= sh; b *= sh;
      d[o] = Math.max(0, Math.min(255, r));
      d[o + 1] = Math.max(0, Math.min(255, gg));
      d[o + 2] = Math.max(0, Math.min(255, b));
      d[o + 3] = 255;
    }
  }
  tx.putImageData(out, 0, 0);
}

/* ============================================================
   게임 상태
   ============================================================ */
const armies = new Map();  // pid → {size, cid, moved}
const G = {
  mode: 'menu', player: -1, turn: 0, sel: -1, moveTargets: null,
  peakProv: 0, peakPop: 0, busy: false, recorded: false, wonShown: false,
  sendPct: 100,
};
const warMeta = new Map(); // 'a_b' → {t, aG, bG}
function wkey(a, b) { return a < b ? a + '_' + b : b + '_' + a; }

function nameOf(c) { return c.names[LANG]; }
function armyTotal(cid) { let t = 0; for (const a of armies.values()) if (a.cid === cid) t += a.size; return t; }
function techAvg(c) {
  if (!c.provs.length) return 1;
  let t = 0; for (const pid of c.provs) t += P[pid].tech;
  return t / c.provs.length;
}
function popTotal(c) { let t = 0; for (const pid of c.provs) t += P[pid].pop; return t; }
function incomeOf(c) {
  let inc = 0;
  for (const pid of c.provs) {
    const p = P[pid];
    inc += p.pop * 2e-5 * (1 + 0.28 * p.tech + 0.18 * p.edu) * (1 - p.unrest * 0.5);
  }
  return inc;
}
function upkeepOf(c) { return armyTotal(c.id) * 0.003; }
function foodBalance(c) {
  let s = 0;
  for (const pid of c.provs) { const p = P[pid]; s += foodProd(p) - foodNeed(p); }
  return s;
}
function foodProd(p) { return p.pop * 0.01 * p.fert * (0.55 + 0.45 * p.agri); }
function foodNeed(p) { return p.pop * 0.01; }
function powerOf(c) { return armyTotal(c.id) + incomeOf(c) * 6 + popTotal(c) * 0.001; }
function militiaOf(p) { return p.pop * 0.0015 * (1 + 0.05 * p.tech); }
function investCost(lvl) { return Math.round(600 * lvl * lvl); }

/* ── 전쟁·평화 ── */
function declareWar(a, b, silent) {
  const A = C[a], B = C[b];
  if (A.wars.has(b)) return;
  A.wars.add(b); B.wars.add(a);
  A.rel.set(b, -80); B.rel.set(a, -80);
  warMeta.set(wkey(a, b), { t: 0, aG: 0, bG: 0 });
  if (!silent && (a === G.player || b === G.player || isVisible(a) || isVisible(b)))
    toast(L.warDeclared.replace('{a}', nameOf(A)).replace('{b}', nameOf(B)), 'war');
  if (a === G.player || b === G.player) sfx.horn();
  mapDirty = true;
}
function makePeace(a, b, silent) {
  const A = C[a], B = C[b];
  if (!A.wars.has(b)) return;
  A.wars.delete(b); B.wars.delete(a);
  A.rel.set(b, -25); B.rel.set(a, -25);
  warMeta.delete(wkey(a, b));
  A.offers = A.offers.filter(o => o !== b); B.offers = B.offers.filter(o => o !== a);
  if (!silent && (a === G.player || b === G.player))
    toast(L.peaceMade.replace('{a}', nameOf(A)).replace('{b}', nameOf(B)), 'good');
  if (a === G.player || b === G.player) sfx.bell();
  mapDirty = true;
}
function isVisible(cid) { return G.player >= 0 && cAdj[G.player] && cAdj[G.player].has(cid); }

/* ── 전투 ── */
function resolveBattle(fromPid, toPid, amount) {
  const att = armies.get(fromPid);
  const send = Math.min(att.size, Math.max(100, Math.round(amount || att.size)));
  const tp = P[toPid];
  const atkC = C[att.cid], defC = C[tp.cid];
  const defA = armies.get(toPid);
  const naval = !isLandAdj(fromPid, toPid);
  const atkStr = send * (1 + 0.12 * techAvg(atkC)) * (0.85 + Math.random() * 0.3) * (naval ? 0.8 : 1);
  const defSize = (defA ? defA.size : 0) + militiaOf(tp);
  const defStr = defSize * (1 + 0.12 * techAvg(defC)) * 1.28;
  const meta = warMeta.get(wkey(att.cid, tp.cid));
  // 파견 병력을 본대에서 분리
  if (send >= att.size) armies.delete(fromPid); else att.size -= send;
  let casual;
  if (atkStr > defStr) {
    const lossR = 0.55 * defStr / atkStr;
    casual = Math.round(send * lossR + defSize);
    const surv = Math.round(send * (1 - lossR));
    armies.delete(toPid);
    if (surv > 100) armies.set(toPid, { size: surv, cid: atkC.id, moved: true });
    captureProvince(toPid, atkC.id);
    if (meta) { if (att.cid < tp.cid) meta.aG++; else meta.bG++; }
    fxFlash(toPid, '#ffdd66');
    fxText(tp.cx, tp.cy, '⚔ ' + fmt(casual));
    if (att.cid === G.player) { toast(L.battleWin.replace('{n}', fmt(casual)), 'good'); sfx.winSmall(); }
    else if (tp.cid === G.player || defC.id === G.player) sfx.battle();
    return true;
  } else {
    const lossR = 0.65 * atkStr / defStr;
    casual = Math.round(send * 0.75 + defSize * lossR * 0.4);
    const surv = Math.round(send * 0.25);
    if (defA) defA.size = Math.max(100, Math.round(defA.size * (1 - lossR * 0.4)));
    // 생존 병력 본대 복귀
    if (surv >= 100) {
      const home = armies.get(fromPid);
      if (home && home.cid === atkC.id) home.size += surv;
      else if (!home) armies.set(fromPid, { size: surv, cid: atkC.id, moved: true });
    }
    tp.pop = Math.max(400, Math.round(tp.pop * 0.985));
    fxFlash(toPid, '#ff6655');
    fxText(tp.cx, tp.cy, '✖ ' + fmt(casual));
    if (att.cid === G.player) { toast(L.battleLose.replace('{n}', fmt(casual)), 'war'); sfx.battle(); }
    return false;
  }
}
function captureProvince(pid, newCid) {
  const p = P[pid];
  const old = C[p.cid];
  old.provs = old.provs.filter(x => x !== pid);
  p.cid = newCid; p.unrest = p.calm ? 0 : Math.min(1, p.unrest + 0.35);
  p.pop = Math.max(400, Math.round(p.pop * 0.93));
  p.capital = false;
  C[newCid].provs.push(pid);
  if (newCid === G.player || old.id === G.player)
    toast(L.captured.replace('{a}', nameOf(C[newCid])).replace('{p}', p.name), newCid === G.player ? 'good' : 'war');
  if (!old.provs.length) {
    old.alive = false;
    for (const w of [...old.wars]) makePeace(old.id, w, true);
    for (const [apid, a] of [...armies]) if (a.cid === old.id) armies.delete(apid);
    toast(L.fell.replace('{a}', nameOf(old)), 'war');
    if (old.id === G.player) playerDefeated();
  } else if (P[old.capital].cid !== old.id) {
    let cap = old.provs[0];
    for (const q of old.provs) if (P[q].pop > P[cap].pop) cap = q;
    old.capital = cap; P[cap].capital = true;
  }
  // 국가 인접 갱신 (간단히 재계산은 비싸므로 양쪽 병합)
  for (const q of adjArr[pid]) {
    const oc = P[q].cid;
    if (oc !== newCid) { cAdj[newCid].add(oc); cAdj[oc].add(newCid); }
  }
  mapDirty = true;
}
function isLandAdj(a, b) { return landAdj[a].includes(b); }

/* ── AI ── */
let globalWarCount = 0;
function aiTurn(c) {
  if (!c.alive || c.id === G.player) return;
  // 투자
  let inv = 0;
  while (c.gold > 4200 && inv < 2 && c.provs.length) {
    const p = P[c.provs[(Math.random() * c.provs.length) | 0]];
    const stat = p.agri <= p.tech ? (p.agri <= p.edu ? 'agri' : 'edu') : (p.tech <= p.edu ? 'tech' : 'edu');
    const cost = investCost(p[stat]);
    if (p[stat] >= 10 || c.gold - cost < 2600) break;
    c.gold -= cost; p[stat]++; inv++;
  }
  // 모병
  const atWar = c.wars.size > 0;
  const total = armyTotal(c.id);
  const pop = popTotal(c);
  const want = pop * (atWar ? 0.02 : 0.011);
  if (total < want && c.gold > 1800) {
    const pid = atWar ? borderProv(c) : c.capital;
    if (pid >= 0) {
      const batch = Math.min(Math.round((c.gold - 800) / 0.12), Math.round(P[pid].pop * 0.06), Math.round(want - total));
      if (batch > 1500) {
        c.gold -= batch * 0.12;
        P[pid].pop -= Math.round(batch * 0.8);
        const a = armies.get(pid);
        if (a && a.cid === c.id) a.size += batch;
        else if (!a) armies.set(pid, { size: batch, cid: c.id, moved: true });
      }
    }
  }
  // 선전포고
  if (!atWar && globalWarCount < 14 && Math.random() < 0.018 + 0.045 * c.aggr) {
    let best = -1, bestR = 0;
    for (const nc of cAdj[c.id]) {
      const t = C[nc];
      if (!t.alive || t.wars.has(c.id)) continue;
      if ((c.rel.get(nc) || 0) > 35) continue;
      const ratio = powerOf(c) / Math.max(1, powerOf(t));
      if (ratio > 1.45 && ratio > bestR) { bestR = ratio; best = nc; }
    }
    if (best >= 0) { declareWar(c.id, best); globalWarCount++; }
  }
  // 평화 판단
  for (const w of [...c.wars]) {
    const meta = warMeta.get(wkey(c.id, w));
    if (!meta) continue;
    const myG = c.id < w ? meta.aG : meta.bG, theirG = c.id < w ? meta.bG : meta.aG;
    const tired = meta.t > 26 || (theirG - myG >= 3) || armyTotal(c.id) < popTotal(c) * 0.003;
    if (tired && Math.random() < 0.3) {
      const other = C[w];
      if (w === G.player) {
        if (!other.offers.includes(c.id) && !c.offers.includes(w)) { C[G.player].offers.push(c.id); toast(nameOf(c) + ' ' + L.offerFrom, 'good'); }
      } else {
        const om = warMeta.get(wkey(c.id, w));
        const oTired = om.t > 18 || (myG - theirG >= 2);
        if (oTired || Math.random() < 0.35) makePeace(c.id, w);
      }
    }
  }
  // 군대 이동/공격
  for (const [pid, a] of [...armies]) {
    if (a.cid !== c.id || a.moved) continue;
    if (!c.wars.size) continue;
    const nb = adjArr[pid];
    let target = -1, weakest = 1e18;
    for (const q of nb) {
      const tp = P[q];
      if (tp.dead || !c.wars.has(tp.cid)) continue;
      const da = armies.get(q);
      const def = ((da ? da.size : 0) + militiaOf(tp)) * 1.28;
      if (def < weakest) { weakest = def; target = q; }
    }
    if (target >= 0) {
      if (a.size * (1 + 0.12 * techAvg(c)) > weakest * 1.08 || (c.aggr > 0.72 && a.size > weakest * 0.8)) {
        resolveBattle(pid, target);
      }
      a.moved = true;
      continue;
    }
    // 전선으로 이동
    let goal = c.frontTarget;
    if (goal < 0 || !c.wars.has(P[goal] && P[goal].cid)) {
      goal = -1;
      for (const w of c.wars) { const e = C[w]; if (e.alive && e.provs.length) { goal = e.capital; break; } }
      c.frontTarget = goal;
    }
    if (goal >= 0) {
      const gp = P[goal];
      let bestN = -1, bd = 1e18;
      for (const q of nb) {
        const tp = P[q];
        if (tp.dead || tp.cid !== c.id) continue;
        const qa = armies.get(q);
        if (qa && qa.cid === c.id && qa.size > a.size * 3) continue;
        let dx = Math.abs(tp.cx - gp.cx); if (dx > MAPW / 2) dx = MAPW - dx;
        const dd = dx * dx + (tp.cy - gp.cy) ** 2;
        if (dd < bd) { bd = dd; bestN = q; }
      }
      let cdx = Math.abs(P[pid].cx - gp.cx); if (cdx > MAPW / 2) cdx = MAPW - cdx;
      const cur = cdx * cdx + (P[pid].cy - gp.cy) ** 2;
      if (bestN >= 0 && bd < cur) moveArmy(pid, bestN);
      a.moved = true;
    }
  }
}
function borderProv(c) {
  for (const pid of c.provs) {
    for (const q of adjArr[pid]) if (c.wars.has(P[q].cid)) return pid;
  }
  return c.capital;
}
function moveArmy(from, to, amount) {
  const a = armies.get(from);
  if (!a) return;
  const amt = Math.min(a.size, Math.max(100, Math.round(amount || a.size)));
  const b = armies.get(to);
  if (amt >= a.size) armies.delete(from); else a.size -= amt;
  if (b && b.cid === a.cid) { b.size += amt; b.moved = true; }
  else armies.set(to, { size: amt, cid: a.cid, moved: true });
}

/* ── 월드 페이즈 ── */
function worldPhase() {
  globalWarCount = 0;
  for (const c of C) globalWarCount += c.wars.size;
  globalWarCount >>= 1;
  for (const c of C) {
    if (!c.alive) continue;
    // 경제
    c.gold += incomeOf(c) - upkeepOf(c);
    if (c.gold < 0) {
      c.gold = 0;
      for (const a of armies.values()) if (a.cid === c.id) a.size = Math.round(a.size * 0.97);
    }
    // 인구·불안
    for (const pid of c.provs) {
      const p = P[pid];
      const ratio = foodProd(p) / Math.max(1, foodNeed(p));
      const g = 0.002 + 0.0035 * Math.max(-1, Math.min(1, ratio - 1)) + 0.0004 * p.edu - p.unrest * 0.01;
      p.pop = Math.max(400, Math.round(p.pop * (1 + g)));
      p.unrest = p.calm ? 0 : Math.max(0, p.unrest - 0.045);
    }
    // 관계 회복
    for (const [k, v] of c.rel) if (!c.wars.has(k)) c.rel.set(k, v + (v < 0 ? 1 : v > 0 ? -1 : 0));
    // 이벤트
    if (Math.random() < 0.02 && c.provs.length) {
      const p = P[c.provs[(Math.random() * c.provs.length) | 0]];
      const roll = Math.random();
      let msg;
      if (roll < 0.3) { p.pop = Math.round(p.pop * 1.05); msg = L.ev_harvest; }
      else if (roll < 0.5) { p.pop = Math.round(p.pop * 0.97); msg = L.ev_drought; }
      else if (roll < 0.65) { p.pop = Math.round(p.pop * 0.94); msg = L.ev_plague; }
      else if (roll < 0.85) { p.tech = Math.min(10, p.tech + 1); msg = L.ev_tech; }
      else { if (!p.calm) p.unrest = Math.min(1, p.unrest + 0.3); msg = L.ev_unrest; }
      if (c.id === G.player) { toast(msg.replace('{p}', p.name), roll < 0.3 || (roll >= 0.65 && roll < 0.85) ? 'good' : 'war'); sfx.chime(); }
    }
  }
  for (const m of warMeta.values()) m.t++;
  // 플레이어 피크
  if (G.player >= 0 && C[G.player].alive) {
    G.peakProv = Math.max(G.peakProv, C[G.player].provs.length);
    G.peakPop = Math.max(G.peakPop, popTotal(C[G.player]));
  }
}

function endTurn() {
  if (G.busy || G.mode !== 'play') return;
  G.busy = true;
  document.getElementById('endTurn').disabled = true;
  sfx.turn();
  setTimeout(() => {
    for (const c of C) aiTurn(c);
    worldPhase();
    for (const a of armies.values()) a.moved = false;
    G.turn++;
    G.sel = -1; G.moveTargets = null;
    hidePanel();
    autosave();
    // 승리 체크 (전 세계 60%)
    if (!G.wonShown && G.player >= 0 && C[G.player].alive) {
      const alive = P.filter(p => !p.dead).length;
      if (C[G.player].provs.length >= alive * 0.6) {
        G.wonShown = true;
        toast(L.victory, 'good'); sfx.fanfare();
      }
    }
    G.busy = false;
    document.getElementById('endTurn').disabled = false;
    mapDirty = true;
    updateHUD(); requestRender();
  }, 30);
}

function playerDefeated() {
  if (G.recorded) return;
  finishGame(false);
}
function finishGame(voluntary) {
  if (G.recorded) return;
  G.recorded = true;
  const score = G.peakProv * 1000 + G.turn * 10 + Math.round(G.peakPop / 1e6);
  const nick = REC.nick || 'MENEW';
  const isBest = score > (REC.best || 0);
  if (isBest) REC.best = score;
  REC.top10.push({ n: nick, s: score, c: G.player >= 0 ? nameOf(C[G.player]) : '?', p: G.peakProv, t: G.turn, d: new Date().toISOString().slice(0, 10) });
  REC.top10.sort((a, b) => b.s - a.s); REC.top10 = REC.top10.slice(0, 10);
  storeRec();
  try { localStorage.removeItem(GAME_KEY); } catch (e) {}
  G.mode = 'results';
  document.body.classList.remove('playing');
  bgmStop(); if (!voluntary) sfx.lose();
  document.getElementById('resT').textContent = (C[G.player] && C[G.player].alive) ? L.resTitle : L.defeat;
  document.getElementById('resStats').innerHTML =
    `${L.finalScore}: <span class="big">${score.toLocaleString()}</span><br>` +
    `${L.peakProv}: ${G.peakProv} · ${L.survived}: ${G.turn}` +
    (isBest ? `<br>${L.newRecord}` : '');
  document.getElementById('resPanel').innerHTML = recordsTable();
  showScreen('results');
}

/* ── 저장/불러오기 ── */
function serialize() {
  return {
    v: 1, seed: genSeed, player: G.player, turn: G.turn,
    peakProv: G.peakProv, peakPop: G.peakPop, wonShown: G.wonShown,
    provs: P.map(p => [p.cid, p.pop, p.agri, p.tech, p.edu, Math.round(p.unrest * 100)]),
    armies: [...armies].map(([pid, a]) => [pid, a.cid, a.size]),
    cs: C.map(c => [Math.round(c.gold), c.alive ? 1 : 0, [...c.wars], c.capital, c.offers]),
    wm: [...warMeta].map(([k, m]) => [k, m.t, m.aG, m.bG]),
  };
}
function applySave(s) {
  G.player = s.player; G.turn = s.turn;
  G.peakProv = s.peakProv; G.peakPop = s.peakPop; G.wonShown = !!s.wonShown;
  for (const c of C) { c.provs = []; c.wars = new Set(); c.offers = []; }
  s.provs.forEach((row, i) => {
    const p = P[i];
    p.cid = row[0]; p.pop = row[1]; p.agri = row[2]; p.tech = row[3]; p.edu = row[4]; p.unrest = p.calm ? 0 : row[5] / 100;
    p.capital = false;
    if (!p.dead) C[p.cid].provs.push(i);
  });
  armies.clear();
  for (const [pid, cid, size] of s.armies) armies.set(pid, { pid, cid, size, moved: false });
  s.cs.forEach((row, i) => {
    const c = C[i];
    c.gold = row[0]; c.alive = !!row[1];
    for (const w of row[2]) c.wars.add(w);
    c.capital = row[3]; c.offers = row[4] || [];
    if (c.capital >= 0 && P[c.capital] && P[c.capital].cid === i) P[c.capital].capital = true;
  });
  warMeta.clear();
  for (const [k, t, aG, bG] of (s.wm || [])) warMeta.set(k, { t, aG, bG });
  mapDirty = true;
}
function autosave() {
  try { localStorage.setItem(GAME_KEY, JSON.stringify(serialize())); } catch (e) {}
}

/* ============================================================
   렌더링
   ============================================================ */
const cv = document.getElementById('game');
const cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const view = { x: MAPW / 2, y: MAPH / 2, z: 0.5 };
let mapDirty = true, renderQueued = false;
const fxList = [];

function layout() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  requestRender();
}
function minZoom() { return Math.max(W / MAPW, H / MAPH) * 0.62; }
function clampView() {
  view.z = Math.max(minZoom(), Math.min(14, view.z));
  const hw = W / 2 / view.z, hh = H / 2 / view.z;
  view.x = Math.max(hw * 0.2, Math.min(MAPW - hw * 0.2, view.x));
  view.y = Math.max(hh * 0.4, Math.min(MAPH - hh * 0.4, view.y));
}
function s2m(sx, sy) { return [(sx - W / 2) / view.z + view.x, (sy - H / 2) / view.z + view.y]; }
function m2s(mx, my) { return [(mx - view.x) * view.z + W / 2, (my - view.y) * view.z + H / 2]; }

function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => { renderQueued = false; render(); });
}
function colorOf(c, alpha) {
  return `hsla(${c.hue.toFixed(0)},${(42 + (c.id * 7) % 20)}%,${(50 + (c.id * 11) % 16)}%,${alpha})`;
}
function render() {
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.fillStyle = '#081522'; cx.fillRect(0, 0, W, H);
  clampView();
  const [vx0, vy0] = s2m(0, 0), [vx1, vy1] = s2m(W, H);
  cx.save();
  cx.translate(W / 2, H / 2); cx.scale(view.z, view.z); cx.translate(-view.x, -view.y);
  cx.imageSmoothingEnabled = true;
  if (terCanvas) cx.drawImage(terCanvas, 0, 0);
  const inPick = G.mode === 'pick';
  const pc = G.player >= 0 ? C[G.player] : null;
  // 프로빈스 채색
  for (const p of P) {
    if (p.dead) continue;
    const b = p.bbox;
    if (b[2] < vx0 || b[0] > vx1 || b[3] < vy0 || b[1] > vy1) continue;
    const c = C[p.cid];
    let alpha = 0.5;
    if (inPick && pickSel === p.cid) alpha = 0.82;
    if (G.sel === p.id) alpha = 0.75;
    cx.fillStyle = colorOf(c, alpha);
    cx.fill(p.path, 'evenodd');
    if (pc && pc.wars.has(p.cid)) { cx.fillStyle = 'rgba(255,40,20,.16)'; cx.fill(p.path, 'evenodd'); }
    if (p.unrest > 0.2) { cx.fillStyle = `rgba(180,20,60,${p.unrest * 0.25})`; cx.fill(p.path, 'evenodd'); }
    cx.strokeStyle = 'rgba(10,14,24,.35)';
    cx.lineWidth = 0.6 / view.z;
    cx.stroke(p.path);
  }
  // 이동 대상 하이라이트
  if (G.moveTargets) {
    for (const t of G.moveTargets) {
      const p = P[t.pid];
      cx.fillStyle = t.enemy ? 'rgba(255,60,40,.4)' : 'rgba(90,255,120,.35)';
      cx.fill(p.path, 'evenodd');
    }
  }
  if (G.sel >= 0) {
    cx.strokeStyle = '#ffe28a'; cx.lineWidth = 2.4 / view.z;
    cx.stroke(P[G.sel].path);
  }
  // 국가 경계 (현재 소유 기준: 다른 나라와 접한 프로빈스만 두껍게)
  cx.strokeStyle = 'rgba(8,10,18,.8)';
  cx.lineWidth = 1.5 / view.z;
  for (const c of C) {
    if (!c.alive) continue;
    const b = c.bbox;
    if (b[2] < vx0 - 50 || b[0] > vx1 + 50 || b[3] < vy0 - 50 || b[1] > vy1 + 50) continue;
    cx.stroke(c.path);
  }
  // FX (플래시)
  const now = performance.now();
  for (let i = fxList.length - 1; i >= 0; i--) {
    const f = fxList[i];
    const k = (f.until - now) / f.dur;
    if (k <= 0) { fxList.splice(i, 1); continue; }
    if (f.type === 'flash') {
      cx.fillStyle = f.color;
      cx.globalAlpha = k * 0.65;
      cx.fill(P[f.pid].path, 'evenodd');
      cx.globalAlpha = 1;
    }
  }
  cx.restore();

  // ── 화면 공간 오버레이 ──
  // 국가 라벨
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  if (view.z < 3.4) {
    for (const c of C) {
      if (!c.alive || !c.provs.length) continue;
      const size = 5.5 + Math.sqrt(c.px || 100) * 0.085 * Math.sqrt(view.z) * 2.4;
      if (size < 8.5) continue;
      const [sx0, sy0] = m2s(c.cx, c.cy);
      if (sx0 < -80 || sx0 > W + 80 || sy0 < -40 || sy0 > H + 40) continue;
      cx.font = '800 ' + Math.min(26, size) + 'px sans-serif';
      cx.lineWidth = 3; cx.strokeStyle = 'rgba(0,0,0,.55)';
      const nm = nameOf(c);
      cx.strokeText(nm, sx0, sy0); cx.fillStyle = 'rgba(255,255,255,.92)'; cx.fillText(nm, sx0, sy0);
    }
  }
  // 프로빈스 라벨
  if (view.z >= 3.4 && G.mode !== 'pick') {
    cx.font = '700 10px sans-serif';
    for (const p of P) {
      if (p.dead) continue;
      const [sx0, sy0] = m2s(p.cx, p.cy);
      if (sx0 < -60 || sx0 > W + 60 || sy0 < -20 || sy0 > H + 20) continue;
      if (p.px * view.z * view.z < 2600) continue;
      cx.lineWidth = 2.5; cx.strokeStyle = 'rgba(0,0,0,.5)';
      cx.strokeText(p.name, sx0, sy0 + 12);
      cx.fillStyle = 'rgba(255,255,255,.8)'; cx.fillText(p.name, sx0, sy0 + 12);
    }
  }
  // 군대 배지
  if (G.mode !== 'pick') {
    let drawn = 0;
    for (const [pid, a] of armies) {
      if (drawn > 420) break;
      const p = P[pid];
      if (p.dead) continue;
      if (view.z < 0.85 && a.size < 60000 && a.cid !== G.player) continue;
      const [sx0, sy0] = m2s(p.cx, p.cy);
      if (sx0 < -30 || sx0 > W + 30 || sy0 < -30 || sy0 > H + 30) continue;
      const txt = fmt(a.size);
      cx.font = '800 10px sans-serif';
      const w2 = cx.measureText(txt).width / 2 + 6;
      cx.fillStyle = colorOf(C[a.cid], 0.95);
      cx.strokeStyle = a.cid === G.player ? '#fff' : 'rgba(0,0,0,.7)';
      cx.lineWidth = 1.2;
      cx.beginPath();
      cx.roundRect(sx0 - w2, sy0 - 8, w2 * 2, 16, 8);
      cx.fill(); cx.stroke();
      cx.fillStyle = '#fff';
      cx.strokeStyle = 'rgba(0,0,0,.6)'; cx.lineWidth = 2;
      cx.strokeText('⚔' + txt, sx0, sy0);
      cx.fillText('⚔' + txt, sx0, sy0);
      drawn++;
    }
    // 수도 별
    if (view.z >= 1.1) {
      cx.font = '11px sans-serif';
      for (const c of C) {
        if (!c.alive || c.capital < 0) continue;
        const p = P[c.capital];
        if (!p || p.cid !== c.id) continue;
        const [sx0, sy0] = m2s(p.cx, p.cy);
        if (sx0 < -20 || sx0 > W + 20 || sy0 < -20 || sy0 > H + 20) continue;
        cx.fillText('⭐', sx0, sy0 - (armies.has(c.capital) ? 16 : 0));
      }
    }
  }
  // FX 텍스트
  for (let i = fxList.length - 1; i >= 0; i--) {
    const f = fxList[i];
    if (f.type !== 'text') continue;
    const k = (f.until - now) / f.dur;
    if (k <= 0) { fxList.splice(i, 1); continue; }
    const [sx0, sy0] = m2s(f.x, f.y);
    cx.globalAlpha = Math.min(1, k * 2);
    cx.font = '900 15px sans-serif';
    cx.lineWidth = 3; cx.strokeStyle = 'rgba(0,0,0,.7)';
    const yy = sy0 - (1 - k) * 34;
    cx.strokeText(f.txt, sx0, yy);
    cx.fillStyle = '#ffe28a'; cx.fillText(f.txt, sx0, yy);
    cx.globalAlpha = 1;
  }
  if (fxList.length) requestRender();
}
function fxFlash(pid, color) { fxList.push({ type: 'flash', pid, color, dur: 700, until: performance.now() + 700 }); requestRender(); }
function fxText(x, y, txt) { fxList.push({ type: 'text', x, y, txt, dur: 1400, until: performance.now() + 1400 }); requestRender(); }

/* ============================================================
   오디오
   ============================================================ */
let AC = null, bgmGain = null, bgmTimer = null, bgmBeat = 0;
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
  gn.gain.linearRampToValueAtTime(gain || 0.12, t0 + 0.012);
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
  f.Q.value = 0.9;
  const gn = AC.createGain();
  gn.gain.setValueAtTime(gain || 0.15, t0);
  gn.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f); f.connect(gn); gn.connect(AC.destination);
  src.start(t0);
}
const sfx = {
  click() { tone(880, 0.05, 'triangle', 0.06); },
  coin() { tone(1245, 0.1, 'triangle', 0.1); tone(1661, 0.14, 'triangle', 0.09, undefined, AC ? AC.currentTime + 0.06 : 0); },
  drum() { noiseS(0.14, 300, 0.2, 90); tone(140, 0.13, 'sine', 0.2, 70); },
  march() { noiseS(0.08, 500, 0.1); tone(110, 0.1, 'sine', 0.12, 80); },
  battle() { noiseS(0.5, 600, 0.28, 100); tone(120, 0.4, 'sawtooth', 0.1, 45); },
  winSmall() { tone(659, 0.12, 'triangle', 0.11); tone(880, 0.18, 'triangle', 0.11, undefined, AC ? AC.currentTime + 0.09 : 0); },
  horn() { tone(196, 0.7, 'sawtooth', 0.12, 233); tone(98, 0.8, 'sawtooth', 0.09, 117); },
  bell() { tone(1047, 0.5, 'sine', 0.1); tone(2093, 0.4, 'sine', 0.04); },
  chime() { tone(1568, 0.2, 'triangle', 0.08); },
  turn() { noiseS(0.16, 900, 0.06, 2200); },
  fanfare() { if (!AC || muted()) return; [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.34, 'triangle', 0.13, undefined, AC.currentTime + i * 0.12)); },
  lose() { if (!AC || muted()) return; [392, 311, 262, 196].forEach((f, i) => tone(f, 0.4, 'sine', 0.12, undefined, AC.currentTime + i * 0.18)); },
};
/* BGM: 잔잔한 단조 아르페지오 + 저음 패드 */
const BGM_STEP = 60 / 76 / 2;
const BCHORD = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 196, 246.9]];
function bgmSchedule() {
  if (!AC) return;
  const ahead = AC.currentTime + 0.4;
  while (bgmSchedule.next < ahead) {
    const t = bgmSchedule.next, i = bgmBeat % 64, bar = (i / 16) | 0;
    const ch = BCHORD[bar % 4];
    if (i % 16 === 0) { // 패드
      for (const f of ch) {
        const o = AC.createOscillator(), gn = AC.createGain();
        o.type = 'sine'; o.frequency.value = f / 2;
        gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(0.035, t + 1.2);
        gn.gain.linearRampToValueAtTime(0.001, t + BGM_STEP * 16);
        o.connect(gn); gn.connect(bgmGain); o.start(t); o.stop(t + BGM_STEP * 16.2);
      }
    }
    if (i % 2 === 0 && (i % 16) % 6 !== 4) { // 아르페지오
      const f = ch[((i / 2) | 0) % 3] * (i % 8 === 6 ? 2 : 1);
      const o = AC.createOscillator(), gn = AC.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(0.04, t + 0.02);
      gn.gain.exponentialRampToValueAtTime(0.001, t + BGM_STEP * 2.6);
      o.connect(gn); gn.connect(bgmGain); o.start(t); o.stop(t + BGM_STEP * 3);
    }
    bgmSchedule.next += BGM_STEP; bgmBeat++;
  }
}
function bgmStart() {
  if (!AC || bgmTimer) return;
  bgmSchedule.next = AC.currentTime + 0.1; bgmBeat = 0;
  bgmGain.gain.cancelScheduledValues(AC.currentTime);
  bgmGain.gain.setTargetAtTime(muted() ? 0 : 1, AC.currentTime, 0.6);
  bgmTimer = setInterval(bgmSchedule, 120);
}
function bgmStop() {
  if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
  if (AC) bgmGain.gain.setTargetAtTime(0, AC.currentTime, 0.4);
}
function applyMute() {
  document.getElementById('muteBtn').textContent = muted() ? '🔇' : '🔊';
  if (AC && bgmTimer) bgmGain.gain.setTargetAtTime(muted() ? 0 : 1, AC.currentTime, 0.2);
}

/* ============================================================
   UI
   ============================================================ */
function $(id) { return document.getElementById(id); }
function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.style.display = 'none';
  if (id) $(id).style.display = 'flex';
}
function toast(msg, cls) {
  const log = $('log');
  const el = document.createElement('div');
  el.className = 'toast' + (cls ? ' ' + cls : '');
  el.textContent = msg;
  log.appendChild(el);
  while (log.children.length > 6) log.removeChild(log.firstChild);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 700); }, 5200);
}
function dateStr() {
  const y = 2026 + Math.floor((G.turn + 2) / 4);
  return y + ' ' + L.q[(G.turn + 2) % 4];
}
function updateHUD() {
  if (G.player < 0) return;
  const c = C[G.player];
  const nEl = $('tcNation');
  nEl.innerHTML = `<i style="background:${colorOf(c, 1)}"></i>${nameOf(c)} · ${c.provs.length}`;
  const inc = incomeOf(c) - upkeepOf(c);
  $('tcGold').innerHTML = `💰 ${fmt(c.gold)} <small>(${inc >= 0 ? '+' : ''}${fmt(inc)})</small>`;
  const fb = foodBalance(c);
  $('tcFood').innerHTML = `🌾 ${fb >= 0 ? '+' : ''}${fmt(fb)}`;
  $('tcPop').innerHTML = `👥 ${fmt(popTotal(c))}`;
  $('tcArmy').innerHTML = `⚔️ ${fmt(armyTotal(c.id))}`;
  $('tcTech').innerHTML = `🔬 ${techAvg(c).toFixed(1)}`;
  $('tcDate').innerHTML = `📅 ${dateStr()} <small>· ${L.turnOf} ${G.turn}</small>`;
}

/* ── 상단바 내역 팝업 ── */
let infoPopType = null;
function toggleInfoPop(type, anchorId) {
  const ip = $('infoPop');
  if (infoPopType === type && ip.style.display === 'block') { ip.style.display = 'none'; infoPopType = null; return; }
  if (G.player < 0) return;
  const c = C[G.player];
  let html = '';
  if (type === 'gold') {
    const tax = incomeOf(c), up = upkeepOf(c);
    html = `<b>💰 ${L.gold}</b><br>` +
      `<span class="plus">+${fmt(tax)}</span> ${L.tax}<br>` +
      `<span class="minus">−${fmt(up)}</span> ${L.upkeep} (⚔️ ${fmt(armyTotal(c.id))} × 0.003)<br>` +
      `<b>${L.net} ${tax - up >= 0 ? '+' : ''}${fmt(tax - up)}${L.perTurn}</b>` +
      `<div class="nt">${L.incNote}</div>`;
  } else if (type === 'food') {
    let prod = 0, need = 0;
    for (const pid of c.provs) { prod += foodProd(P[pid]); need += foodNeed(P[pid]); }
    html = `<b>🌾 ${L.food}</b><br>` +
      `<span class="plus">+${fmt(prod)}</span> ${L.prod}<br>` +
      `<span class="minus">−${fmt(need)}</span> ${L.consume} (${L.pop} × 1%)<br>` +
      `<b>${L.surplus} ${prod - need >= 0 ? '+' : ''}${fmt(prod - need)}${L.perTurn}</b>` +
      `<div class="nt">${L.foodNote}</div>`;
  } else if (type === 'pop') {
    let growth = 0, pop = 0;
    for (const pid of c.provs) {
      const p = P[pid];
      const ratio = foodProd(p) / Math.max(1, foodNeed(p));
      const g = 0.002 + 0.0035 * Math.max(-1, Math.min(1, ratio - 1)) + 0.0004 * p.edu - p.unrest * 0.01;
      growth += p.pop * g; pop += p.pop;
    }
    html = `<b>👥 ${L.pop}</b><br>` +
      `${fmt(pop)} <span class="${growth >= 0 ? 'plus' : 'minus'}">(${growth >= 0 ? '+' : ''}${fmt(growth)}${L.perTurn} · ${(growth / Math.max(1, pop) * 100).toFixed(2)}%)</span>` +
      `<div class="nt">${L.popNote}</div>`;
  } else if (type === 'army') {
    const m = 1 + 0.12 * techAvg(c);
    const total = armyTotal(c.id);
    html = `<b>⚔️ ${L.army}</b><br>` +
      `${fmt(total)} · <span class="pw" style="color:#ffb0b0">${L.atk} ${fmt(total * m)}</span> · <span style="color:#9fd8ff">${L.defP} ${fmt(total * m * 1.28)}</span><br>` +
      `<span class="minus">−${fmt(total * 0.003)}</span> ${L.upkeep}${L.perTurn}` +
      `<div class="nt">${L.techNote.replace('{t}', techAvg(c).toFixed(1)).replace('{m}', m.toFixed(2))}</div>`;
  }
  ip.innerHTML = html;
  const r = $(anchorId).getBoundingClientRect();
  ip.style.display = 'block';
  ip.style.left = Math.min(window.innerWidth - 330, Math.max(6, r.left)) + 'px';
  ip.style.top = (r.bottom + 6) + 'px';
  infoPopType = type;
}

/* ── 프로빈스 패널 ── */
function showPanel(pid) {
  const p = P[pid];
  const c = C[p.cid];
  const mine = p.cid === G.player;
  $('pname').textContent = p.name + (p.capital ? ' ⭐' : '');
  $('powner').innerHTML = `<i style="background:${colorOf(c, 1)}"></i>${nameOf(c)} · ${cultName(C[p.ocid].sub)} ${L.culture}`;
  const a = armies.get(pid);
  const rows = [];
  const pct = (x) => (x * 100).toFixed(2) + '%';
  const bal = foodProd(p) - foodNeed(p);
  // 인구 + 성장 내역
  const ratio = foodProd(p) / Math.max(1, foodNeed(p));
  const gBase = 0.002, gFood = 0.0035 * Math.max(-1, Math.min(1, ratio - 1)),
        gEdu = 0.0004 * p.edu, gUn = p.unrest * 0.01;
  const gTot = gBase + gFood + gEdu - gUn;
  rows.push(row('👥 ' + L.pop, fmt(p.pop)));
  rows.push(brk(`${gTot >= 0 ? '+' : ''}${fmt(p.pop * gTot)}${L.perTurn} · ${L.brGrowth} ${pct(gTot)} = ${L.brBase} ${pct(gBase)} + ${L.brFoodB} ${pct(gFood)} + ${L.brEduB} ${pct(gEdu)} − ${L.unrest} ${pct(gUn)}`));
  // 식량 + 생산 내역
  rows.push(row('🌾 ' + L.food, `${fmt(foodProd(p))} / ${fmt(foodNeed(p))} <b style="color:${bal >= 0 ? '#8be28a' : '#ff8a8a'}">(${bal >= 0 ? '+' : ''}${fmt(bal)})</b>`));
  rows.push(brk(`${L.prod} = ${L.brBase} ${fmt(foodNeed(p))} × ${L.fert} ${(p.fert * 100).toFixed(0)}% × ${L.agri} ×${(0.55 + 0.45 * p.agri).toFixed(2)} · ${L.consume} = ${L.pop}×1%`));
  // 수입 내역
  const incBase = p.pop * 2e-5, incMul = 1 + 0.28 * p.tech + 0.18 * p.edu, incUn = 1 - p.unrest * 0.5;
  rows.push(row('💰 ' + L.income, `+${fmt(incBase * incMul * incUn)}${L.perTurn}`));
  rows.push(brk(`= ${L.brBase} ${fmt(incBase)} × ${L.tech}·${L.edu} ×${incMul.toFixed(2)} × ${L.unrest} ×${incUn.toFixed(2)}`));
  rows.push(row('🌱 ' + L.fert, (p.fert * 100).toFixed(0) + '%'));
  rows.push(lvlRow(pid, 'agri', '🚜 ' + L.agri, mine));
  rows.push(lvlRow(pid, 'tech', '🔬 ' + L.tech, mine));
  rows.push(lvlRow(pid, 'edu', '📚 ' + L.edu, mine));
  rows.push(row('😠 ' + L.unrest, (p.unrest * 100).toFixed(0) + '%'));
  // 군대 + 전투력 (군사 기술 배율)
  const ownerTech = techAvg(a ? C[a.cid] : c);
  const mult = 1 + 0.12 * ownerTech;
  rows.push(row('⚔️ ' + L.army, a ? `<b>${fmt(a.size)}</b> (${nameOf(C[a.cid])})` : `<small>${L.militia} ${fmt(militiaOf(p))}</small>`));
  const atkP = a ? a.size * mult : 0;
  const defP = ((a ? a.size : 0) + militiaOf(p)) * mult * 1.28;
  rows.push(brk(`<span class="pw">${L.atk} ${a ? fmt(atkP) : '—'}</span> · <span class="pw2">${L.defP} ${fmt(defP)}</span><br>${L.techNote.replace('{t}', ownerTech.toFixed(1)).replace('{m}', mult.toFixed(2))}`));
  // 파병 슬라이더
  const canSend = mine && a && a.cid === G.player && !a.moved;
  if (canSend) {
    const amt = Math.max(100, Math.round(a.size * G.sendPct / 100));
    rows.push(`<div class="prow"><span>${L.send}</span><input type="range" id="sendR" min="10" max="100" step="5" value="${G.sendPct}"><b id="sendV">${G.sendPct}% (${fmt(amt)})</b></div>`);
  }
  $('prows').innerHTML = rows.join('');
  if (canSend) {
    const sr = $('sendR');
    sr.oninput = () => {
      G.sendPct = +sr.value;
      $('sendV').textContent = `${G.sendPct}% (${fmt(Math.max(100, Math.round(a.size * G.sendPct / 100)))})`;
    };
  }
  // 액션
  const act = [];
  if (mine) {
    const batch = Math.max(1000, Math.min(200000, Math.round(p.pop * 0.05 / 1000) * 1000));
    const cost = Math.round(batch * 0.12);
    act.push(`<button id="recruitBtn" ${C[G.player].gold < cost ? 'disabled' : ''}>${L.recruit} ${fmt(batch)} (💰${fmt(cost)})</button>`);
  }
  $('pactions').innerHTML = act.join('');
  if (mine) {
    const rb = $('recruitBtn');
    if (rb) rb.onclick = () => {
      const pc = C[G.player];
      const batch = Math.max(1000, Math.min(200000, Math.round(p.pop * 0.05 / 1000) * 1000));
      const cost = Math.round(batch * 0.12);
      if (pc.gold < cost) { toast(L.noGold, 'war'); return; }
      pc.gold -= cost;
      p.pop -= Math.round(batch * 0.8);
      const ex = armies.get(pid);
      if (ex && ex.cid === G.player) ex.size += batch;
      else if (!ex) armies.set(pid, { size: batch, cid: G.player, moved: false });
      else { toast('⚠', 'war'); pc.gold += cost; p.pop += Math.round(batch * 0.8); return; }
      sfx.drum(); updateHUD(); showPanel(pid); requestRender();
    };
  }
  for (const st of ['agri', 'tech', 'edu']) {
    const b = $('inv_' + st);
    if (b) b.onclick = () => {
      const pc = C[G.player];
      const cost = investCost(p[st]);
      if (p[st] >= 10) return;
      if (pc.gold < cost) { toast(L.noGold, 'war'); return; }
      pc.gold -= cost; p[st]++;
      sfx.coin(); updateHUD(); showPanel(pid);
    };
  }
  // 힌트
  let hint = '';
  if (mine && a && a.cid === G.player && !a.moved) hint = L.moveHint;
  else if (!mine && C[G.player] && C[G.player].wars.has(p.cid)) hint = L.attackHint;
  else if (!mine) hint = L.foreignHint;
  if (p.coastal) hint += (hint ? '<br>' : '') + L.navalHint;
  $('phint').innerHTML = hint;
  $('ppanel').style.display = 'block';
}
function row(k, v) { return `<div class="prow"><span>${k}</span><span><b>${v}</b></span></div>`; }
function brk(html) { return `<div class="brk">${html}</div>`; }
function lvlRow(pid, st, label, mine) {
  const p = P[pid];
  const lvl = p[st];
  const bar = '▰'.repeat(Math.min(10, lvl)) + '▱'.repeat(Math.max(0, 10 - lvl));
  let btn = '';
  if (mine) {
    btn = lvl >= 10 ? `<span class="lvlbtn" style="opacity:.4">${L.maxLvl}</span>` :
      `<button class="lvlbtn" id="inv_${st}">+1 💰${fmt(investCost(lvl))}</button>`;
  }
  return `<div class="prow"><span>${label} <b>${lvl}</b></span><span style="font-size:9px;letter-spacing:-1px;color:#8fc8ff">${bar}</span>${btn}</div>`;
}
function hidePanel() { $('ppanel').style.display = 'none'; }

/* ── 클릭 처리 ── */
function pickProvince(sx, sy) {
  const [mx, my] = s2m(sx, sy);
  const gx = Math.floor(mx), gy = Math.floor(my);
  if (gx < 0 || gx >= MAPW || gy < 0 || gy >= MAPH) return -1;
  const g = grid[gy * MAPW + gx];
  if (g === 0 || g >= 65534) return -1;
  return g - 1;
}
let pickSel = -1;
function onClick(sx, sy) {
  const pid = pickProvince(sx, sy);
  if (G.mode === 'pick') {
    if (pid >= 0) {
      pickSel = P[pid].cid;
      const c = C[pickSel];
      $('pcName').textContent = nameOf(c);
      $('pcStats').innerHTML =
        `👥 ${fmt(popTotal(c))} · 🗺 ${c.provs.length} ${L.pickProv} · 🔬 ${techAvg(c).toFixed(1)}<br>` +
        `💰 ${fmt(c.gold)} · ⚔️ ${fmt(armyTotal(c.id))} · ${cultName(c.sub)}`;
      $('pcGo').textContent = L.pickGo + nameOf(c);
      $('pickCard').style.display = 'block';
      sfx.click();
      mapDirty = true; requestRender();
    }
    return;
  }
  if (G.mode !== 'play') return;
  if (pid < 0) { G.sel = -1; G.moveTargets = null; hidePanel(); requestRender(); return; }
  // 이동/공격 대상 클릭?
  if (G.moveTargets) {
    const t = G.moveTargets.find(t => t.pid === pid);
    if (t) {
      const from = G.sel;
      const a = armies.get(from);
      if (a && a.cid === G.player && !a.moved) {
        const amount = Math.max(100, Math.round(a.size * G.sendPct / 100));
        if (t.enemy) {
          resolveBattle(from, pid, amount);
        } else {
          moveArmy(from, pid, amount); sfx.march();
        }
        G.sel = -1; G.moveTargets = null; hidePanel();
        updateHUD(); requestRender();
        return;
      }
    }
  }
  // 선택
  G.sel = pid;
  G.moveTargets = null;
  const a = armies.get(pid);
  if (a && a.cid === G.player && !a.moved) {
    const pc = C[G.player];
    G.moveTargets = [];
    for (const q of adjArr[pid]) {
      const tp = P[q];
      if (tp.dead) continue;
      if (tp.cid === G.player) G.moveTargets.push({ pid: q, enemy: false });
      else if (pc.wars.has(tp.cid)) G.moveTargets.push({ pid: q, enemy: true });
    }
  }
  sfx.click();
  showPanel(pid);
  requestRender();
}

/* ── 외교 패널 ── */
function renderDiplo() {
  const pc = C[G.player];
  const rowsEl = [];
  const others = C.filter(c => c.alive && c.id !== G.player);
  others.sort((a, b) => {
    const wa = pc.wars.has(a.id) ? 2 : 0, wb = pc.wars.has(b.id) ? 2 : 0;
    const oa = pc.offers.includes(a.id) ? 4 : 0, ob = pc.offers.includes(b.id) ? 4 : 0;
    const na = cAdj[G.player].has(a.id) ? 1 : 0, nb2 = cAdj[G.player].has(b.id) ? 1 : 0;
    return (ob + wb + nb2) - (oa + wa + na) || popTotal(b) - popTotal(a);
  });
  for (const c of others.slice(0, 70)) {
    const atWar = pc.wars.has(c.id);
    const offer = pc.offers.includes(c.id);
    const rel = pc.rel.get(c.id) || 0;
    let btn = '';
    if (offer) btn = `<button class="peaceBtn" data-act="accept" data-c="${c.id}">${L.accept}</button>`;
    else if (atWar) btn = `<button class="peaceBtn" data-act="peace" data-c="${c.id}">${L.offerPeace}</button>`;
    else btn = `<button class="warBtn" data-act="war" data-c="${c.id}">${L.declareWar}</button>`;
    rowsEl.push(`<div class="drow"><i class="cc" style="background:${colorOf(c, 1)}"></i>
      <span class="dn"><b>${nameOf(c)}${atWar ? ' <span class="war">⚔ ' + L.atWar + '</span>' : ''}</b>
      <small>👥${fmt(popTotal(c))} · ⚔️${fmt(armyTotal(c.id))} · 🔬${techAvg(c).toFixed(1)} · ${L.rel} ${rel}</small></span>${btn}</div>`);
  }
  $('dlist').innerHTML = rowsEl.join('');
  for (const b of $('dlist').querySelectorAll('button')) {
    b.onclick = () => {
      const cid = +b.dataset.c, act = b.dataset.act;
      const pc2 = C[G.player];
      if (act === 'war') { declareWar(G.player, cid); }
      else if (act === 'accept') { makePeace(G.player, cid); }
      else if (act === 'peace') {
        const meta = warMeta.get(wkey(G.player, cid));
        const myG = G.player < cid ? (meta ? meta.aG : 0) : (meta ? meta.bG : 0);
        const theirG = G.player < cid ? (meta ? meta.bG : 0) : (meta ? meta.aG : 0);
        const tired = (meta && meta.t > 14) || theirG - myG >= 1 || powerOf(C[cid]) < powerOf(pc2) * 0.7;
        if (tired || Math.random() < 0.25) makePeace(G.player, cid);
        else { toast(L.rejected.replace('{a}', nameOf(C[cid])), 'war'); C[cid].rel.set(G.player, (C[cid].rel.get(G.player) || 0) - 5); }
      }
      renderDiplo(); updateHUD();
    };
  }
}

/* ============================================================
   입력 (팬·줌·클릭·핀치)
   ============================================================ */
const pointers = new Map();
let dragInfo = null, pinch0 = 0, pinchZ0 = 0;
cv.addEventListener('pointerdown', (e) => {
  audioInit();
  cv.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) dragInfo = { x: e.clientX, y: e.clientY, moved: false };
  else if (pointers.size === 2) {
    const ps = [...pointers.values()];
    pinch0 = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
    pinchZ0 = view.z; dragInfo = null;
  }
  e.preventDefault();
});
cv.addEventListener('pointermove', (e) => {
  const pt = pointers.get(e.pointerId);
  if (!pt) {
    if (G.mode === 'play' && !('ontouchstart' in window)) hover(e.clientX, e.clientY);
    return;
  }
  const dx = e.clientX - pt.x, dy = e.clientY - pt.y;
  pt.x = e.clientX; pt.y = e.clientY;
  if (pointers.size === 1 && dragInfo) {
    if (Math.abs(e.clientX - dragInfo.x) + Math.abs(e.clientY - dragInfo.y) > 6) dragInfo.moved = true;
    if (dragInfo.moved) {
      view.x -= dx / view.z; view.y -= dy / view.z;
      cv.classList.add('grabbing');
      requestRender();
    }
  } else if (pointers.size === 2) {
    const ps = [...pointers.values()];
    const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
    if (pinch0 > 0) {
      const cxm = (ps[0].x + ps[1].x) / 2, cym = (ps[0].y + ps[1].y) / 2;
      zoomAt(cxm, cym, pinchZ0 * d / pinch0);
    }
  }
});
cv.addEventListener('pointerup', (e) => {
  const wasDrag = dragInfo && dragInfo.moved;
  pointers.delete(e.pointerId);
  cv.classList.remove('grabbing');
  if (pointers.size === 0) {
    if (!wasDrag && dragInfo) onClick(e.clientX, e.clientY);
    dragInfo = null;
  }
});
cv.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); dragInfo = null; });
cv.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoomAt(e.clientX, e.clientY, view.z * Math.pow(1.0016, -e.deltaY));
}, { passive: false });
function zoomAt(sx, sy, nz) {
  nz = Math.max(minZoom(), Math.min(14, nz));
  const [mx, my] = s2m(sx, sy);
  view.z = nz;
  view.x = mx - (sx - W / 2) / nz;
  view.y = my - (sy - H / 2) / nz;
  requestRender();
}
let hoverT = 0;
function hover(sx, sy) {
  const now = performance.now();
  if (now - hoverT < 60) return;
  hoverT = now;
  const tip = $('tip');
  const pid = pickProvince(sx, sy);
  if (pid < 0 || G.mode !== 'play') { tip.style.display = 'none'; return; }
  const p = P[pid];
  const a = armies.get(pid);
  tip.innerHTML = `<b>${p.name}</b> · ${nameOf(C[p.cid])}<br>👥 ${fmt(p.pop)}${a ? ` · ⚔️ ${fmt(a.size)}` : ''}`;
  tip.style.display = 'block';
  tip.style.left = Math.min(W - 190, sx + 14) + 'px';
  tip.style.top = Math.max(40, sy - 10) + 'px';
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && G.mode === 'play') {
    if ($('diplo').style.display === 'flex') $('diplo').style.display = 'none';
    else { G.sel = -1; G.moveTargets = null; hidePanel(); requestRender(); }
  }
  if ((e.key === 'Enter' || e.key === ' ') && G.mode === 'play' && !G.busy) {
    if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
    endTurn();
  }
});
window.addEventListener('resize', layout);

/* ============================================================
   플로우 (메뉴 → 국가선택 → 플레이)
   ============================================================ */
let worldReady = false;
function ensureWorld(seed, cb) {
  $('loadmsg').textContent = L.worldGen;
  setTimeout(() => {
    if (!worldReady || seed !== genSeed) { generateWorld(seed); worldReady = true; }
    $('loadmsg').textContent = '';
    cb();
  }, 30);
}
function startPick() {
  const nick = ($('nick').value || '').trim() || 'MENEW';
  REC.nick = nick; storeRec();
  const seed = (Math.random() * 1e9) | 0;
  ensureWorld(seed, () => {
    G.mode = 'pick'; pickSel = -1;
    showScreen(null);
    $('pick').style.display = 'block';
    $('pickCard').style.display = 'none';
    $('pickTop').textContent = L.pickTitle;
    view.x = MAPW / 2; view.y = MAPH / 2; view.z = minZoom();
    requestRender();
  });
}
function startPlay(cid) {
  G.mode = 'play'; G.player = cid; G.turn = 0;
  G.peakProv = C[cid].provs.length; G.peakPop = popTotal(C[cid]);
  G.recorded = false; G.wonShown = false; G.sel = -1; G.moveTargets = null;
  $('pick').style.display = 'none';
  document.body.classList.add('playing');
  // 시야를 내 나라로
  const c = C[cid];
  view.x = c.cx; view.y = c.cy;
  view.z = Math.max(minZoom(), Math.min(5, Math.sqrt(60000 / Math.max(40, c.px))));
  bgmStart();
  autosave();
  updateHUD(); requestRender();
  toast('👑 ' + nameOf(c) + ' — ' + dateStr(), 'good');
}
function continueGame() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(GAME_KEY)); } catch (e) {}
  if (!s || s.v !== 1) return;
  ensureWorld(s.seed, () => {
    applySave(s);
    G.mode = 'play'; G.recorded = false;
    G.sel = -1; G.moveTargets = null;
    $('pick').style.display = 'none';
    showScreen(null);
    document.body.classList.add('playing');
    const c = C[G.player];
    view.x = c.cx; view.y = c.cy; view.z = Math.max(minZoom(), 1.4);
    bgmStart();
    updateHUD(); requestRender();
  });
}

/* ── 기록 테이블 ── */
function recordsTable() {
  if (!REC.top10.length) return `<div class="note">${L.emptyRec}</div>`;
  let h = `<table><tr><th>${L.colRank}</th><th>${L.colName}</th><th>${L.colScore}</th><th>${L.colNation}</th><th>${L.colProv}</th><th>${L.colTurns}</th><th>${L.colDate}</th></tr>`;
  REC.top10.forEach((r, i) => {
    h += `<tr><td>${i + 1}</td><td>${String(r.n).replace(/[<>&]/g, '')}</td><td>${r.s.toLocaleString()}</td><td>${String(r.c).replace(/[<>&]/g, '')}</td><td>${r.p}</td><td>${r.t}</td><td>${r.d}</td></tr>`;
  });
  return h + '</table>';
}

/* ── UI 초기화 ── */
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
  $('retryBtn').textContent = L.retry;
  $('menuBtn').textContent = L.menu;
  $('endTurn').textContent = L.endTurn;
  $('diploBtn').textContent = L.diplo;
  $('dtitle').textContent = L.diplo;
  $('pickBack').textContent = L.back;
  applyMute();
  let hasSave = false;
  try { hasSave = !!localStorage.getItem(GAME_KEY); } catch (e) {}
  if (hasSave) $('contBtn').style.display = '';

  $('startBtn').onclick = () => {
    if (hasSave && !confirm(L.newGameConfirm)) return;
    audioInit(); startPick();
  };
  $('contBtn').onclick = () => { audioInit(); continueGame(); };
  $('recBtn').onclick = () => { $('recPanel').innerHTML = recordsTable(); showScreen('records'); };
  $('recBackBtn').onclick = () => showScreen('menu');
  $('retryBtn').onclick = () => { showScreen('menu'); G.mode = 'menu'; };
  $('menuBtn').onclick = () => { showScreen('menu'); G.mode = 'menu'; };
  $('pickBack').onclick = () => { G.mode = 'menu'; $('pick').style.display = 'none'; showScreen('menu'); };
  $('pcGo').onclick = () => { if (pickSel >= 0) startPlay(pickSel); };
  $('endTurn').onclick = endTurn;
  $('pclose').onclick = () => { G.sel = -1; G.moveTargets = null; hidePanel(); requestRender(); };
  $('diploBtn').onclick = () => {
    const d = $('diplo');
    if (d.style.display === 'flex') d.style.display = 'none';
    else { renderDiplo(); d.style.display = 'flex'; }
  };
  $('dclose').onclick = () => { $('diplo').style.display = 'none'; };
  $('muteBtn').onclick = () => { REC.muted = !REC.muted; storeRec(); applyMute(); };
  // 상단바 내역 팝업
  for (const [id, type] of [['tcGold', 'gold'], ['tcFood', 'food'], ['tcPop', 'pop'], ['tcArmy', 'army']]) {
    const el = $(id);
    el.classList.add('click');
    el.style.pointerEvents = 'auto';
    el.onclick = (e) => { e.stopPropagation(); toggleInfoPop(type, id); };
  }
  document.addEventListener('pointerdown', (e) => {
    const ip = $('infoPop');
    if (ip.style.display === 'block' && !ip.contains(e.target) && !e.target.closest('.tchip')) {
      ip.style.display = 'none'; infoPopType = null;
    }
  });
  $('exitBtn').onclick = () => {
    if (!confirm(L.quitConfirm)) return;
    autosave();
    G.mode = 'menu';
    document.body.classList.remove('playing');
    hidePanel(); $('diplo').style.display = 'none';
    bgmStop();
    $('contBtn').style.display = '';
    hasSave = true;
    showScreen('menu');
  };
  $('exportBtn').onclick = () => {
    const blob = new Blob([JSON.stringify({ game: 'empires', v: 1, rec: REC, save: (() => { try { return JSON.parse(localStorage.getItem(GAME_KEY)); } catch (e) { return null; } })() })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'menew-empires-save.json'; a.click();
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
        if (j.game !== 'empires' || !j.rec || !Array.isArray(j.rec.top10)) throw 0;
        if (!confirm(L.impConfirm)) return;
        REC = j.rec; storeRec();
        if (j.save) { try { localStorage.setItem(GAME_KEY, JSON.stringify(j.save)); $('contBtn').style.display = ''; } catch (e2) {} }
        $('nick').value = REC.nick || ''; applyMute();
      } catch (err) { alert(L.impErr); }
    };
    rd.readAsText(f);
  });
  document.addEventListener('pointerdown', audioInit, { once: true });
}

/* ============================================================
   테스트 (?test=sim) · 스크린샷 (?shot=1)
   ============================================================ */
function runSim() {
  let pass = 0, fail = 0;
  const T = (name, ok, extra) => {
    if (ok) pass++; else fail++;
    console.warn(`[SIM] ${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  };
  const t0 = performance.now();
  generateWorld(12345); worldReady = true;
  T('worldgen < 30s', performance.now() - t0 < 30000, ((performance.now() - t0) / 1000).toFixed(1) + 's');
  const liveP = P.filter(p => !p.dead);
  T('province count sane', liveP.length > 600 && liveP.length < 3200, 'n=' + liveP.length);
  T('countries alive', C.filter(c => c.alive).length > 150, 'n=' + C.filter(c => c.alive).length);
  let orphan = 0;
  for (const p of liveP) if (!C[p.cid].provs.includes(p.id)) orphan++;
  T('ownership consistent', orphan === 0, 'orphans=' + orphan);
  let asym = 0;
  for (const p of liveP) for (const q of adjArr[p.id]) if (!adjArr[q].includes(p.id)) asym++;
  T('adjacency symmetric', asym === 0, 'asym=' + asym);
  let isolated = 0;
  for (const p of liveP) if (adjArr[p.id].length === 0 && C[p.cid].provs.length > 1) isolated++;
  T('few isolated provinces', isolated < liveP.length * 0.05, 'iso=' + isolated);
  const kor = C.find(c => c.iso === 'KR');
  T('Korea exists with provinces', !!kor && kor.provs.length >= 2, kor ? 'provs=' + kor.provs.length : 'missing');
  const popW0 = C.reduce((s, c) => s + (c.alive ? popTotal(c) : 0), 0);
  T('world pop ≈ 7-9B', popW0 > 5e9 && popW0 < 1.1e10, fmt(popW0));
  T('armies placed', armies.size > 150, 'stacks=' + armies.size);
  // 한반도 버프
  {
    const kp = C.find(c => c.iso === 'KP');
    T('KR tech/edu +1 (tier3→4+)', !!kor && kor.provs.every(pid => P[pid].tech >= 4 && P[pid].edu >= 4));
    T('KP tech/edu +1 (tier1→2+)', !!kp && kp.provs.every(pid => P[pid].tech >= 2 && P[pid].edu >= 2));
    const wj = cityProvOf('Wonju'), se = cityProvOf('Seoul');
    T('Wonju province buffed', wj >= 0 && P[wj].tech >= 7 && P[wj].edu >= 7 && P[wj].calm === true && P[wj].unrest === 0,
      wj >= 0 ? `name=${P[wj].name} tech=${P[wj].tech} edu=${P[wj].edu}` : 'missing');
    T('Seoul pop boosted', se >= 0 && P[se].pop > 15e6, se >= 0 ? `name=${P[se].name} pop=${fmt(P[se].pop)}` : 'missing');
    if (wj >= 0) { // calm 고정: 점령해도 불안도 0
      const before = P[wj].cid;
      captureProvince(wj, (before + 1) % C.length);
      T('Wonju calm survives capture', P[wj].unrest === 0);
      captureProvince(wj, before); // 원상복구
      P[wj].capital = kor && kor.capital === wj;
    }
  }

  // 30턴 관전 시뮬
  G.player = -1; G.mode = 'play'; G.turn = 0;
  let battles = 0, capturedN = 0;
  const origResolve = resolveBattle;
  const capBefore = P.map(p => p.cid).join(',');
  for (let t = 0; t < 30; t++) {
    for (const c of C) aiTurn(c);
    worldPhase();
    for (const a of armies.values()) a.moved = false;
    G.turn++;
  }
  let wars = 0; for (const c of C) wars += c.wars.size;
  const capAfter = P.map(p => p.cid).join(',');
  let nan = 0;
  for (const c of C) if (c.alive && (!isFinite(c.gold) || !isFinite(popTotal(c)))) nan++;
  for (const p of liveP) if (!isFinite(p.pop) || !isFinite(p.unrest)) nan++;
  T('30 turns: no NaN', nan === 0, 'nan=' + nan);
  const popW1 = C.reduce((s, c) => s + (c.alive ? popTotal(c) : 0), 0);
  T('pop drift sane', popW1 > popW0 * 0.6 && popW1 < popW0 * 1.6, fmt(popW0) + '→' + fmt(popW1));
  T('wars happened', warMeta.size > 0 || wars > 0 || capBefore !== capAfter, 'wars=' + (wars >> 1) + ' metas=' + warMeta.size);
  T('conquests happened', capBefore !== capAfter);
  // 도시 이름 명명
  {
    let named = 0;
    for (const p of liveP) if (p.cityNamed) named++;
    T('provinces named by real cities', named > liveP.length * 0.35, `${named}/${liveP.length}`);
    const capName = kor ? P[kor.capital].name : '';
    T('KR capital is Seoul', /Seoul|서울/.test(capName), capName);
  }
  // 분할 이동: 병력 보존
  {
    let ok = false, det = 'no candidate';
    for (const [pid, a] of armies) {
      if (a.size < 2000) continue;
      const q = [...landAdj[pid]].find(x => P[x].cid === a.cid && !armies.has(x) && !P[x].dead);
      if (q === undefined) continue;
      const before = a.size;
      moveArmy(pid, q, Math.round(before / 2));
      const s1 = armies.get(pid), s2 = armies.get(q);
      ok = !!s1 && !!s2 && s1.size + s2.size === before && s2.moved && !s1.moved;
      det = `${before} → ${s1 && s1.size} + ${s2 && s2.size}`;
      break;
    }
    T('split move conserves troops', ok, det);
  }
  // 분할 공격: 본대 잔류
  {
    let ok = false, det = 'no candidate';
    outer:
    for (const p of liveP) {
      if (!C[p.cid].alive) continue;
      for (const q of landAdj[p.id]) {
        const tq = P[q];
        if (tq.dead || tq.cid === p.cid || !C[tq.cid].alive) continue;
        declareWar(p.cid, tq.cid, true);
        armies.set(p.id, { size: 80000, cid: p.cid, moved: false });
        const res = resolveBattle(p.id, q, 40000);
        const home = armies.get(p.id);
        ok = !!home && home.cid === p.cid && home.size >= 40000 && home.size <= 80000 && typeof res === 'boolean';
        det = `res=${res} home=${home && home.size}`;
        break outer;
      }
    }
    T('split attack keeps reserve at home', ok, det);
  }
  // 저장 라운드트립
  const s1 = JSON.stringify(serialize());
  applySave(JSON.parse(s1));
  const s2 = JSON.stringify(serialize());
  T('save round-trip stable', s1 === s2);
  // 렌더 스모크
  try { view.z = minZoom(); render(); T('render ok', true); }
  catch (e) { T('render ok', false, e.message); }
  console.warn(`[SIM] DONE pass=${pass} fail=${fail}`);
}

function setupShot() {
  REC.nick = 'MENEW';
  generateWorld(777); worldReady = true;
  // 유럽에 전쟁 연출
  const fr = C.find(c => c.iso === 'FR'), de = C.find(c => c.iso === 'DE');
  const ru = C.find(c => c.iso === 'RU'), ua = C.find(c => c.iso === 'UA');
  if (fr && de) declareWar(fr.id, de.id, true);
  if (ru && ua) declareWar(ru.id, ua.id, true);
  G.player = (de || C[0]).id; G.mode = 'play'; G.turn = 14;
  showScreen(null);
  document.body.classList.add('playing');
  // 국경 군대 몇 개 증강
  if (de) for (const pid of de.provs.slice(0, 4)) armies.set(pid, { size: 120000 + ((Math.random() * 80000) | 0), cid: de.id, moved: false });
  if (fr) for (const pid of fr.provs.slice(0, 3)) armies.set(pid, { size: 100000, cid: fr.id, moved: false });
  if (de && fr) {
    fxFlash(fr.provs[0], '#ffdd66');
    fxText(P[fr.provs[0]].cx, P[fr.provs[0]].cy, '⚔ 48K');
  }
  view.x = 1100; view.y = 265; view.z = 3.6;
  updateHUD();
  const p0 = de ? de.provs[0] : 0;
  G.sel = p0; showPanel(p0);
  toast(L.warDeclared.replace('{a}', nameOf(fr || C[0])).replace('{b}', nameOf(de || C[1])), 'war');
  toast(L.ev_tech.replace('{p}', P[p0].name), 'good');
  requestRender();
  window._SHOT_READY = true;
}

/* ===== 부팅 ===== */
layout();
uiInit();
if (qs.get('test') === 'geo') {
  generateWorld(777);
  for (const iso of ['DE', 'FR', 'KR', 'US', 'BR']) {
    const c = C.find(x => x.iso === iso);
    if (!c) { console.warn('[GEO] ' + iso + ' missing'); continue; }
    const b = c.bbox;
    const bc = [((b[0] + b[2]) / 2).toFixed(0), ((b[1] + b[3]) / 2).toFixed(0)];
    let inBox = 0, tot = 0;
    for (const pid of c.provs) {
      const p = P[pid]; tot++;
      if (p.cx >= b[0] - 5 && p.cx <= b[2] + 5 && p.cy >= b[1] - 5 && p.cy <= b[3] + 5) inBox++;
    }
    console.warn(`[GEO] ${iso} provs=${c.provs.length} bboxC=${bc} cxy=${c.cx.toFixed(0)},${c.cy.toFixed(0)} centroidsInBbox=${inBox}/${tot} bbox=${b.map(v => v.toFixed(0))}`);
    for (const pid of c.provs.slice(0, 6)) {
      const p = P[pid];
      console.warn(`[GEO]   pid=${pid} cx=${p.cx.toFixed(0)},${p.cy.toFixed(0)} px=${p.px} vecBbox=${p.bbox.map(v => v.toFixed(0))}`);
    }
  }
}
if (qs.get('test') === 'sim') runSim();
else if (SHOT) setupShot();
else {
  // 메뉴 배경: 세계지도 미리 생성 (부드러운 첫 경험)
  ensureWorld(20260717, () => { view.z = minZoom(); requestRender(); });
}
