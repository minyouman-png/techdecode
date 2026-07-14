// AI 도구 섹션: 도구 레지스트리 + 언어별 카피.
// 새 도구 추가 시 tools 배열에 항목을 추가하고, 대응하는 인터랙티브 컴포넌트를 만들어 ToolPage에서 slug로 분기한다.
import type { Lang } from './ui';

/* ===== 섹션 공통 문자열 ===== */
export const toolsUi: Record<Lang, Record<string, string>> = {
  en: {
    kicker: 'TOOLS',
    pageTitle: 'Tools',
    metaDescription:
      'Free in-browser tools — spreadsheet, document and presentation editors plus interactive AI-cost calculators. No sign-up, and your files never leave your browser.',
    intro:
      'Small, focused tools that run entirely in your browser: document editors that open and save real office files, and calculators built around our analysis. No sign-up, nothing sent to a server.',
    openTool: '▶ Open tool',
    backToList: '← All tools',
    aboutTitle: 'About this tool',
    openApp: 'Open the app ↗',
    appPriv: 'Runs entirely in your browser — your files are never uploaded to any server.',
  },
  ko: {
    kicker: '도구',
    pageTitle: '도구',
    metaDescription: '브라우저에서 바로 쓰는 무료 도구 모음 — 스프레드시트·문서·프레젠테이션 편집기와 AI 비용 계산기. 가입 없이, 파일은 브라우저 밖으로 나가지 않습니다.',
    intro: '전부 브라우저 안에서만 동작하는 작고 목적이 뚜렷한 도구들입니다. 실제 오피스 파일을 열고 저장하는 문서 편집기와, 저희 분석 기사를 보완하는 계산기를 제공합니다. 가입도, 서버 전송도 없습니다.',
    openTool: '▶ 도구 열기',
    backToList: '← 전체 도구',
    aboutTitle: '도구 소개',
    openApp: '앱 열기 ↗',
    appPriv: '전부 브라우저 안에서만 동작합니다 — 파일이 서버로 업로드되지 않습니다.',
  },
  ja: {
    kicker: 'ツール',
    pageTitle: 'ツール',
    metaDescription: 'ブラウザでそのまま使える無料ツール — 表計算・文書・プレゼン編集ツールとAIコスト計算機。登録不要、ファイルはブラウザの外に送信されません。',
    intro: 'すべてブラウザ内だけで動く、小さく目的の絞られたツール群です。実際のオフィスファイルを開いて保存できる文書編集ツールと、分析記事を補完する計算ツールを提供します。登録不要、サーバー送信なし。',
    openTool: '▶ ツールを開く',
    backToList: '← ツール一覧へ',
    aboutTitle: 'このツールについて',
    openApp: 'アプリを開く ↗',
    appPriv: 'すべてブラウザ内で動作します — ファイルがサーバーにアップロードされることはありません。',
  },
  es: {
    kicker: 'HERRAMIENTAS',
    pageTitle: 'Herramientas',
    metaDescription:
      'Herramientas gratuitas que funcionan en tu navegador — editores de hojas de cálculo, documentos y presentaciones, además de calculadoras de costes de IA. Sin registro, y tus archivos nunca salen de tu navegador.',
    intro:
      'Herramientas pequeñas y enfocadas que funcionan por completo en tu navegador: editores que abren y guardan archivos de oficina reales, y calculadoras construidas en torno a nuestro análisis. Sin registro, nada se envía a un servidor.',
    openTool: '▶ Abrir herramienta',
    backToList: '← Todas las herramientas',
    aboutTitle: 'Sobre esta herramienta',
    openApp: 'Abrir la aplicación ↗',
    appPriv: 'Funciona por completo en tu navegador — tus archivos nunca se suben a ningún servidor.',
  },
  zh: {
    kicker: '工具',
    pageTitle: '工具',
    metaDescription: '在浏览器里直接使用的免费工具——电子表格、文档、演示文稿编辑器，以及 AI 成本计算器。无需注册，文件不会离开你的浏览器。',
    intro: '这些小巧、目标明确的工具全部在你的浏览器内运行:既有能打开并保存真实办公文件的文档编辑器，也有配合我们分析文章的计算器。无需注册，不向服务器发送任何数据。',
    openTool: '▶ 打开工具',
    backToList: '← 所有工具',
    aboutTitle: '关于此工具',
    openApp: '打开应用 ↗',
    appPriv: '完全在你的浏览器内运行——文件不会上传到任何服务器。',
  },
};

/* ===== 도구별 카피 ===== */
export interface ToolCopy {
  title: string;
  tagline: string;
  about: string[];
}

export interface ToolEntry {
  slug: string;
  relatedPost?: string; // 연관 블로그 글 key
  appUrl?: string; // 전체화면 정적 앱 경로 (있으면 ToolPage가 런처를 렌더링)
  copy: Record<Lang, ToolCopy>;
}

export const tools: ToolEntry[] = [
  {
    slug: 'menew-sheet',
    appUrl: '/apps/sheet/',
    copy: {
      en: {
        title: 'MeNew Sheet',
        tagline: 'A free spreadsheet editor that runs in your browser — open, edit and save XLSX and CSV files without uploading them anywhere.',
        about: [
          'MeNew Sheet opens Excel-format workbooks (.xlsx, .xls, .csv) directly in your browser. You can edit cells, use formulas, apply formatting, merge cells, work across multiple sheets, and save the result back as a real .xlsx or .csv file.',
          'Everything happens locally: the file you open is read by your browser and never uploaded to a server. Very complex workbooks — charts, macros, pivot tables — are beyond what a lightweight web editor can reproduce, but core data, formulas and layout are preserved.',
          'How to use: double-click a cell (or just start typing) to enter data, and start with = for formulas like =SUM(B2:B10). The toolbar covers fonts, colors, borders, merging and number formats, and the tabs at the bottom switch between sheets. Open ▸ pick a file ▸ edit ▸ Save XLSX.',
        ],
      },
      ko: {
        title: 'MeNew Sheet',
        tagline: '브라우저에서 바로 도는 무료 스프레드시트 편집기 — XLSX·CSV 파일을 어디에도 업로드하지 않고 열고, 편집하고, 저장합니다.',
        about: [
          'MeNew Sheet는 엑셀 형식 문서(.xlsx, .xls, .csv)를 브라우저에서 바로 엽니다. 셀 편집, 수식, 서식, 셀 병합, 다중 시트 작업이 가능하고, 결과를 다시 실제 .xlsx나 .csv 파일로 저장할 수 있습니다.',
          '모든 처리는 로컬에서 이루어집니다. 연 파일은 브라우저가 읽을 뿐 서버로 전송되지 않습니다. 차트·매크로·피벗테이블 같은 아주 복잡한 문서까지 재현하지는 못하지만, 핵심 데이터와 수식, 레이아웃은 보존됩니다.',
          '사용법: 셀을 더블클릭하거나 바로 입력하면 데이터가 들어가고, =로 시작하면 =SUM(B2:B10) 같은 수식이 됩니다. 툴바에서 글꼴·색·테두리·병합·숫자 서식을 지정하고, 하단 탭으로 시트를 오갑니다. 열기 ▸ 파일 선택 ▸ 편집 ▸ XLSX 저장 순서면 됩니다.',
        ],
      },
      ja: {
        title: 'MeNew Sheet',
        tagline: 'ブラウザで動く無料の表計算エディタ — XLSX・CSVファイルをどこにもアップロードせずに開き、編集し、保存できます。',
        about: [
          'MeNew SheetはExcel形式のファイル(.xlsx、.xls、.csv)をブラウザで直接開きます。セル編集、数式、書式設定、セル結合、複数シートでの作業ができ、結果を本物の.xlsxや.csvファイルとして保存できます。',
          'すべての処理はローカルで完結します。開いたファイルはブラウザが読み取るだけで、サーバーに送信されることはありません。グラフ・マクロ・ピボットテーブルのような非常に複雑なファイルまでは再現できませんが、主要なデータ・数式・レイアウトは保持されます。',
          '使い方: セルをダブルクリック(またはそのまま入力)でデータを入れ、=で始めると=SUM(B2:B10)のような数式になります。ツールバーでフォント・色・罫線・結合・表示形式を設定でき、下部のタブでシートを切り替えます。開く ▸ ファイル選択 ▸ 編集 ▸ XLSX保存の流れです。',
        ],
      },
      es: {
        title: 'MeNew Sheet',
        tagline: 'Un editor de hojas de cálculo gratuito que funciona en tu navegador — abre, edita y guarda archivos XLSX y CSV sin subirlos a ningún sitio.',
        about: [
          'MeNew Sheet abre libros en formato Excel (.xlsx, .xls, .csv) directamente en tu navegador. Puedes editar celdas, usar fórmulas, aplicar formato, combinar celdas, trabajar con varias hojas y guardar el resultado como un archivo .xlsx o .csv real.',
          'Todo ocurre localmente: el archivo que abres lo lee tu navegador y nunca se sube a un servidor. Los libros muy complejos — gráficos, macros, tablas dinámicas — quedan fuera del alcance de un editor web ligero, pero los datos, las fórmulas y la estructura principal se conservan.',
          'Cómo se usa: haz doble clic en una celda (o simplemente empieza a escribir) para introducir datos, y empieza con = para fórmulas como =SUM(B2:B10). La barra de herramientas cubre fuentes, colores, bordes, combinación y formatos numéricos, y las pestañas inferiores cambian de hoja. Abrir ▸ elegir archivo ▸ editar ▸ Guardar XLSX.',
        ],
      },
      zh: {
        title: 'MeNew Sheet',
        tagline: '在浏览器中运行的免费电子表格编辑器——无需上传即可打开、编辑并保存 XLSX 和 CSV 文件。',
        about: [
          'MeNew Sheet 可以直接在浏览器中打开 Excel 格式的工作簿(.xlsx、.xls、.csv)。你可以编辑单元格、使用公式、设置格式、合并单元格、在多个工作表间切换，并把结果保存为真正的 .xlsx 或 .csv 文件。',
          '一切都在本地完成:你打开的文件只由浏览器读取，绝不会上传到服务器。图表、宏、数据透视表等非常复杂的工作簿超出了轻量级网页编辑器的能力范围，但核心数据、公式和布局都会被保留。',
          '使用方法:双击单元格(或直接输入)即可录入数据，以 = 开头即为公式，如 =SUM(B2:B10)。工具栏提供字体、颜色、边框、合并和数字格式，底部标签页可切换工作表。打开 ▸ 选择文件 ▸ 编辑 ▸ 保存 XLSX 即可。',
        ],
      },
    },
  },
  {
    slug: 'menew-write',
    appUrl: '/apps/write/',
    copy: {
      en: {
        title: 'MeNew Write',
        tagline: 'A free document editor that runs in your browser — open DOCX files, write with headings, tables and images, and save back to real DOCX.',
        about: [
          'MeNew Write is a word processor in your browser. Open a .docx file or start blank, then write with headings, bold/italic/underline, colors, bullet and numbered lists, tables, images and links. Saving produces a genuine .docx file that opens in Word, LibreOffice and Google Docs — and the print button gives you a PDF.',
          'Your document never leaves the browser: opening and saving are both done locally on your device. Heavily designed documents — columns, text boxes, tracked changes — are beyond a lightweight editor, but everyday documents keep their structure and formatting.',
          'How to use: select text and hit the toolbar for bold/italic/underline, colors, alignment and lists; the dropdown switches between body text and headings. ▦ inserts a table at your chosen size, 🖼 inserts an image from your device, 🔗 adds a link — and Print/PDF uses your browser\'s print dialog to make a PDF.',
        ],
      },
      ko: {
        title: 'MeNew Write',
        tagline: '브라우저에서 바로 도는 무료 문서 편집기 — DOCX 파일을 열어 제목·표·이미지로 문서를 작성하고, 다시 진짜 DOCX로 저장합니다.',
        about: [
          'MeNew Write는 브라우저 속 워드프로세서입니다. .docx 파일을 열거나 빈 문서에서 시작해 제목, 굵게/기울임/밑줄, 글자색, 글머리·번호 목록, 표, 이미지, 링크로 문서를 작성하세요. 저장하면 Word·LibreOffice·Google Docs에서 열리는 진짜 .docx 파일이 만들어지고, 인쇄 버튼으로 PDF도 만들 수 있습니다.',
          '문서는 브라우저 밖으로 나가지 않습니다. 열기와 저장 모두 기기 안에서 처리됩니다. 다단·텍스트상자·변경추적 같은 고급 서식까지는 다루지 못하지만, 일상 문서는 구조와 서식이 유지됩니다.',
          '사용법: 텍스트를 선택한 뒤 툴바에서 굵게/기울임/밑줄·글자색·정렬·목록을 적용하고, 드롭다운으로 본문↔제목을 전환합니다. ▦는 원하는 크기의 표, 🖼는 내 기기의 이미지, 🔗는 링크를 삽입하며, 인쇄/PDF 버튼은 브라우저 인쇄 대화상자로 PDF를 만들어줍니다.',
        ],
      },
      ja: {
        title: 'MeNew Write',
        tagline: 'ブラウザで動く無料の文書エディタ — DOCXファイルを開き、見出し・表・画像を使って文書を書き、本物のDOCXとして保存できます。',
        about: [
          'MeNew Writeはブラウザ内のワープロです。.docxファイルを開くか白紙から始めて、見出し、太字/斜体/下線、文字色、箇条書き・番号付きリスト、表、画像、リンクで文書を作成できます。保存するとWord・LibreOffice・Google Docsで開ける本物の.docxファイルが生成され、印刷ボタンからPDFも作れます。',
          '文書がブラウザの外に出ることはありません。開く処理も保存も端末内で完結します。段組み・テキストボックス・変更履歴のような高度な書式までは扱えませんが、日常的な文書なら構造と書式が保たれます。',
          '使い方: テキストを選択してツールバーから太字/斜体/下線・文字色・配置・リストを適用し、ドロップダウンで本文↔見出しを切り替えます。▦は指定サイズの表、🖼は端末内の画像、🔗はリンクを挿入し、印刷/PDFボタンはブラウザの印刷ダイアログでPDFを作成します。',
        ],
      },
      es: {
        title: 'MeNew Write',
        tagline: 'Un editor de documentos gratuito que funciona en tu navegador — abre archivos DOCX, escribe con títulos, tablas e imágenes, y guarda de nuevo en DOCX real.',
        about: [
          'MeNew Write es un procesador de textos en tu navegador. Abre un archivo .docx o empieza en blanco, y escribe con títulos, negrita/cursiva/subrayado, colores, listas con viñetas y numeradas, tablas, imágenes y enlaces. Al guardar se genera un archivo .docx auténtico que se abre en Word, LibreOffice y Google Docs — y el botón de imprimir te da un PDF.',
          'Tu documento nunca sale del navegador: abrir y guardar se hacen localmente en tu dispositivo. Los documentos con diseño muy elaborado — columnas, cuadros de texto, control de cambios — quedan fuera del alcance de un editor ligero, pero los documentos cotidianos conservan su estructura y formato.',
          'Cómo se usa: selecciona texto y usa la barra de herramientas para negrita/cursiva/subrayado, colores, alineación y listas; el desplegable cambia entre cuerpo de texto y títulos. ▦ inserta una tabla del tamaño que elijas, 🖼 inserta una imagen de tu dispositivo, 🔗 añade un enlace — y el botón Imprimir/PDF usa el diálogo de impresión de tu navegador para generar un PDF.',
        ],
      },
      zh: {
        title: 'MeNew Write',
        tagline: '在浏览器中运行的免费文档编辑器——打开 DOCX 文件，用标题、表格和图片撰写文档，再保存为真正的 DOCX。',
        about: [
          'MeNew Write 是浏览器里的文字处理器。打开 .docx 文件或从空白开始，使用标题、加粗/斜体/下划线、文字颜色、项目符号和编号列表、表格、图片和链接来撰写文档。保存后会生成可在 Word、LibreOffice 和 Google Docs 中打开的真正 .docx 文件，打印按钮还能输出 PDF。',
          '你的文档不会离开浏览器:打开和保存都在你的设备上本地完成。分栏、文本框、修订跟踪等重度排版超出了轻量编辑器的范围，但日常文档的结构和格式都能保留。',
          '使用方法:选中文字后用工具栏设置加粗/斜体/下划线、颜色、对齐和列表，下拉框可在正文与标题之间切换。▦ 按所选尺寸插入表格，🖼 从设备插入图片，🔗 添加链接——打印/PDF 按钮会调用浏览器打印对话框生成 PDF。',
        ],
      },
    },
  },
  {
    slug: 'menew-show',
    appUrl: '/apps/show/',
    copy: {
      en: {
        title: 'MeNew Show',
        tagline: 'A free presentation editor that runs in your browser — build slides with text and images, present full-screen, and save as real PPTX.',
        about: [
          'MeNew Show lets you build a slide deck in your browser: add and reorder 16:9 slides, drop in text boxes and images, drag and resize them, set colors and backgrounds, then present full-screen with keyboard or tap navigation. Saving produces a real .pptx file that opens in PowerPoint, Keynote and Google Slides, and you can open existing .pptx files too (text boxes, images and backgrounds).',
          'Like every MeNew Docs tool, it runs entirely on your device — no upload, no account. Animations, transitions and slide-master themes are beyond a lightweight editor, but the content of your slides survives the round trip.',
          'How to use: click a text box or image to select it, drag to move, and pull the gold corner handle to resize. Double-click (double-tap on mobile) or hit ✏️ to edit text; A−/A+, B, the color swatch and the alignment buttons style the selected box, and Delete removes it. +T adds a text box, +🖼 adds an image, the BG swatch recolors the slide, and ▶ starts the full-screen show — advance with arrow keys, click or tap.',
        ],
      },
      ko: {
        title: 'MeNew Show',
        tagline: '브라우저에서 바로 도는 무료 프레젠테이션 편집기 — 텍스트와 이미지로 슬라이드를 만들고, 전체화면으로 발표하고, 진짜 PPTX로 저장합니다.',
        about: [
          'MeNew Show로 브라우저에서 슬라이드 덱을 만들 수 있습니다. 16:9 슬라이드를 추가·복제·정렬하고, 텍스트 상자와 이미지를 넣어 드래그·크기조절하고, 색과 배경을 정한 뒤 전체화면으로 발표하세요(키보드·탭 넘김). 저장하면 PowerPoint·Keynote·Google Slides에서 열리는 진짜 .pptx 파일이 만들어지고, 기존 .pptx 파일(텍스트 상자·이미지·배경)도 열 수 있습니다.',
          '다른 MeNew Docs 도구처럼 전부 기기 안에서만 동작합니다. 업로드도, 계정도 없습니다. 애니메이션·전환효과·슬라이드 마스터 테마까지는 다루지 못하지만, 슬라이드의 내용은 열고 저장하는 과정에서 그대로 유지됩니다.',
          '사용법: 텍스트 상자나 이미지를 클릭해 선택하고, 드래그로 옮기고, 금색 모서리 핸들을 끌어 크기를 바꿉니다. 더블클릭(모바일은 두 번 탭)이나 ✏️ 버튼으로 텍스트를 편집하고, A−/A+·B·색상·정렬 버튼으로 선택한 상자를 꾸미며, Delete 키로 삭제합니다. +T는 텍스트 상자, +🖼는 이미지 추가, 배경 색상으로 슬라이드 배경을 바꾸고, ▶ 발표 버튼으로 전체화면 발표를 시작합니다(방향키·클릭·탭으로 넘김).',
        ],
      },
      ja: {
        title: 'MeNew Show',
        tagline: 'ブラウザで動く無料のプレゼンテーションエディタ — テキストと画像でスライドを作り、フルスクリーンで発表し、本物のPPTXとして保存できます。',
        about: [
          'MeNew Showならブラウザでスライドを作成できます。16:9のスライドを追加・複製・並べ替えし、テキストボックスや画像を配置してドラッグ・リサイズし、色や背景を設定して、フルスクリーンで発表できます(キーボード・タップ操作)。保存するとPowerPoint・Keynote・Google Slidesで開ける本物の.pptxファイルが生成され、既存の.pptxファイル(テキストボックス・画像・背景)を開くこともできます。',
          '他のMeNew Docsツールと同様、すべて端末内だけで動作します。アップロードもアカウントも不要です。アニメーション・画面切り替え・スライドマスターのテーマまでは扱えませんが、スライドの内容は開いて保存しても保たれます。',
          '使い方: テキストボックスや画像をクリックして選択し、ドラッグで移動、金色のコーナーハンドルでサイズ変更します。ダブルクリック(モバイルはダブルタップ)または✏️ボタンでテキストを編集し、A−/A+・B・色・配置ボタンで選択中のボックスを装飾、Deleteキーで削除します。+Tでテキストボックス、+🖼で画像を追加、背景色でスライドの背景を変更し、▶ボタンでフルスクリーン発表を開始します(矢印キー・クリック・タップで進みます)。',
        ],
      },
      es: {
        title: 'MeNew Show',
        tagline: 'Un editor de presentaciones gratuito que funciona en tu navegador — crea diapositivas con texto e imágenes, preséntalas a pantalla completa y guárdalas como PPTX real.',
        about: [
          'MeNew Show te permite crear una presentación en tu navegador: añade y reordena diapositivas 16:9, inserta cuadros de texto e imágenes, arrástralos y cambia su tamaño, define colores y fondos, y presenta a pantalla completa con teclado o toques. Al guardar se genera un archivo .pptx real que se abre en PowerPoint, Keynote y Google Slides, y también puedes abrir archivos .pptx existentes (cuadros de texto, imágenes y fondos).',
          'Como todas las herramientas de MeNew Docs, funciona por completo en tu dispositivo — sin subidas, sin cuenta. Las animaciones, transiciones y temas de patrón de diapositivas quedan fuera del alcance de un editor ligero, pero el contenido de tus diapositivas sobrevive al ciclo de abrir y guardar.',
          'Cómo se usa: haz clic en un cuadro de texto o imagen para seleccionarlo, arrástralo para moverlo y tira del asa dorada de la esquina para cambiar su tamaño. Doble clic (doble toque en móvil) o el botón ✏️ para editar el texto; A−/A+, B, el selector de color y los botones de alineación dan estilo al cuadro seleccionado, y Supr lo elimina. +T añade un cuadro de texto, +🖼 una imagen, el selector de fondo recolorea la diapositiva y ▶ inicia la presentación a pantalla completa — avanza con las flechas, clic o toque.',
        ],
      },
      zh: {
        title: 'MeNew Show',
        tagline: '在浏览器中运行的免费演示文稿编辑器——用文字和图片制作幻灯片，全屏放映，并保存为真正的 PPTX。',
        about: [
          'MeNew Show 让你在浏览器里制作幻灯片:添加、复制、排序 16:9 幻灯片，插入文本框和图片并拖拽、缩放，设置颜色和背景，然后全屏放映(支持键盘和触摸翻页)。保存后会生成可在 PowerPoint、Keynote 和 Google Slides 中打开的真正 .pptx 文件，也可以打开现有的 .pptx 文件(文本框、图片和背景)。',
          '和所有 MeNew Docs 工具一样，它完全在你的设备上运行——无上传、无账号。动画、切换效果和母版主题超出了轻量编辑器的范围，但幻灯片的内容在打开与保存之间不会丢失。',
          '使用方法:点击文本框或图片进行选择，拖拽移动，拉动金色角部手柄调整大小。双击(手机上双击两下)或点 ✏️ 按钮编辑文字;A−/A+、B、颜色和对齐按钮用于装饰选中的框，Delete 键删除。+T 添加文本框，+🖼 添加图片，背景色块更换幻灯片背景，▶ 开始全屏放映——用方向键、点击或触摸翻页。',
        ],
      },
    },
  },
  {
    slug: 'ai-cost-calculator',
    relatedPost: 'ai-developer-journey-2026',
    copy: {
      en: {
        title: 'AI API Cost Calculator',
        tagline: 'Estimate the monthly cost of an AI feature from token usage and per-token pricing — any model, any provider.',
        about: [
          'AI providers price API usage per token, and per-token prices vary by model tier and change often. Rather than hard-coding numbers that go stale, this calculator lets you enter your own pricing — from a provider\'s current pricing page — alongside your expected usage, and computes cost per request, per day, per month, and per year instantly.',
          'Three illustrative pricing tiers are included as starting points (a budget-tier model, a mid-tier model, and a frontier-tier model) so you can see how cost scales with model choice before plugging in real numbers.',
        ],
      },
      ko: {
        title: 'AI API 비용 계산기',
        tagline: '토큰 사용량과 토큰당 가격으로 AI 기능의 월간 비용을 추정합니다 — 어떤 모델, 어떤 제공사든 상관없이.',
        about: [
          'AI 제공사들은 API 사용량을 토큰 단위로 과금하고, 토큰당 가격은 모델 등급마다 다르며 자주 바뀝니다. 그래서 이 계산기는 금방 낡아버릴 숫자를 하드코딩하는 대신, 제공사의 현재 가격 페이지에서 확인한 가격을 직접 입력하고 예상 사용량과 함께 넣으면 요청당·일간·월간·연간 비용을 즉시 계산해줍니다.',
          '시작점으로 참고할 수 있도록 예시용 가격 등급 3종(저가형·중급형·최상급형 모델)을 함께 제공하니, 실제 숫자를 넣기 전에 모델 등급에 따라 비용이 어떻게 달라지는지 감을 잡을 수 있습니다.',
        ],
      },
      ja: {
        title: 'AI APIコスト計算機',
        tagline: 'トークン使用量とトークン単価から、AI機能の月間コストを見積もります — モデルやプロバイダーを問わず使えます。',
        about: [
          'AIプロバイダーはAPI利用をトークン単位で課金し、トークン単価はモデルのグレードごとに異なり、頻繁に変わります。すぐに古くなる数字をハードコードする代わりに、このツールではプロバイダーの現在の価格ページで確認した単価を自分で入力し、想定利用量と合わせることで、リクエストごと・1日・1か月・1年のコストを即座に計算できます。',
          '出発点として参考になるよう、例示用の価格帯を3段階(廉価モデル・中位モデル・最上位モデル)用意しているので、実際の数字を入力する前にモデルの選択によってコストがどう変わるかを把握できます。',
        ],
      },
      es: {
        title: 'Calculadora de coste de API de IA',
        tagline: 'Estima el coste mensual de una función de IA a partir del uso de tokens y el precio por token — para cualquier modelo, cualquier proveedor.',
        about: [
          'Los proveedores de IA cobran el uso de la API por token, y el precio por token varía según el nivel del modelo y cambia con frecuencia. En lugar de fijar cifras que quedarían obsoletas, esta calculadora te deja introducir tu propio precio — de la página de precios actual de tu proveedor — junto con tu uso esperado, y calcula al instante el coste por petición, por día, por mes y por año.',
          'Se incluyen tres niveles de precio ilustrativos como punto de partida (un modelo económico, uno intermedio y uno de gama alta) para que veas cómo escala el coste según el modelo antes de introducir cifras reales.',
        ],
      },
      zh: {
        title: 'AI API 成本计算器',
        tagline: '根据 token 用量和单价估算 AI 功能的月度成本——不限模型、不限服务商。',
        about: [
          'AI 服务商按 token 对 API 用量计费，而每种 token 的单价因模型档次而异，且经常变动。与其写死很快就会过时的数字，不如让你自己输入从服务商当前定价页面查到的价格，再结合预期用量，这个计算器就能立即算出每次请求、每天、每月、每年的成本。',
          '工具内置了三档示例定价(经济型、中端型、旗舰型模型)作为参考起点，方便你在填入真实数字之前，先感受一下模型档次如何影响成本。',
        ],
      },
    },
  },
  {
    slug: 'ai-capex-gap-explorer',
    relatedPost: 'ai-bubble-2026-debate',
    copy: {
      en: {
        title: 'AI Capex-vs-Revenue Gap Explorer',
        tagline: 'Adjust the growth assumptions behind the 2026 "AI bubble" debate and see in which year — if any — AI revenue catches up with AI infrastructure spending.',
        about: [
          'Our piece on the AI bubble debate centers on one uncomfortable number: hyperscalers are spending an estimated $700B or more a year on AI infrastructure while AI-attributable revenue runs closer to $50–150B. Whether that gap is a temporary, self-correcting investment cycle or a structural problem depends entirely on how fast each side grows from here — and reasonable people disagree.',
          'This tool projects both lines forward from 2026 using growth rates you choose, and shows the year they cross, if they do within the time horizon. It is a simple compounding model built from the estimates in our article, not a forecast — moving the sliders is a way to stress-test the bull case and the bear case yourself, not to predict the future.',
        ],
      },
      ko: {
        title: 'AI 자본지출 vs 매출 격차 탐색기',
        tagline: '2026년 “AI 버블” 논쟁의 성장률 가정을 직접 조정해서, 만약 그런 해가 온다면 AI 매출이 AI 인프라 지출을 따라잡는 해가 언제일지 확인해보세요.',
        about: [
          '저희 AI 버블 논쟁 기사는 불편한 숫자 하나를 중심에 둡니다. 빅테크들은 연간 7,000억 달러 이상을 AI 인프라에 쏟아붓는데, AI로 인한 실제 매출은 500억~1,500억 달러 수준에 그친다는 것입니다. 이 격차가 일시적이고 스스로 조정될 투자 사이클인지, 구조적인 문제인지는 전적으로 앞으로 양쪽이 각각 얼마나 빨리 성장하느냐에 달려 있고, 합리적인 사람들 사이에서도 의견이 갈립니다.',
          '이 도구는 사용자가 고른 성장률을 바탕으로 2026년부터 두 값을 앞으로 투영하고, 정해진 기간 안에 두 선이 교차한다면 그 해를 보여줍니다. 저희 기사 속 추정치를 바탕으로 만든 단순 복리 모델일 뿐, 예측이 아닙니다. 슬라이더를 움직여보는 것은 미래를 맞히기 위해서가 아니라 낙관론과 비관론을 직접 시험해보기 위한 것입니다.',
        ],
      },
      ja: {
        title: 'AI設備投資 vs 収益ギャップ探索ツール',
        tagline: '2026年の“AIバブル”論争の成長率の前提を自分で調整し、もしそうなるならAI収益がAIインフラ投資に追いつく年がいつになるかを確かめられます。',
        about: [
          '私たちのAIバブル論争に関する記事は、一つの居心地の悪い数字を中心に据えています。ビッグテックは年間7,000億ドル以上をAIインフラに投じている一方、AI起因の実際の収益は500億〜1,500億ドル程度にとどまるというものです。このギャップが一時的で自己修正される投資サイクルなのか、構造的な問題なのかは、これから両者がそれぞれどれだけ速く成長するかに完全に左右され、合理的な人々の間でも意見が分かれています。',
          'このツールは、選択した成長率をもとに2026年から両方の値を将来へ投影し、設定した期間内に両者が交差するなら、その年を示します。私たちの記事の推定値をもとに作った単純な複利モデルであり、予測ではありません。スライダーを動かすのは未来を言い当てるためではなく、強気派・弱気派それぞれの主張を自分自身で検証してみるためのものです。',
        ],
      },
      es: {
        title: 'Explorador de la brecha entre capex y ingresos de IA',
        tagline: 'Ajusta los supuestos de crecimiento detrás del debate de 2026 sobre la "burbuja de IA" y descubre en qué año, si ocurre, los ingresos de IA alcanzan al gasto en infraestructura de IA.',
        about: [
          'Nuestro artículo sobre el debate de la burbuja de IA gira en torno a una cifra incómoda: las grandes tecnológicas gastan un estimado de 700.000 millones de dólares o más al año en infraestructura de IA, mientras que los ingresos atribuibles a la IA rondan los 50.000-150.000 millones. Que esa brecha sea un ciclo de inversión temporal que se autocorrige o un problema estructural depende por completo de la rapidez con que crezca cada lado a partir de ahora — y hay opiniones razonables encontradas.',
          'Esta herramienta proyecta ambas líneas hacia adelante desde 2026 usando las tasas de crecimiento que elijas, y muestra el año en que se cruzan, si ocurre dentro del horizonte temporal. Es un modelo simple de interés compuesto construido a partir de las estimaciones de nuestro artículo, no una predicción: mover los deslizadores sirve para poner a prueba tú mismo el caso alcista y el bajista, no para predecir el futuro.',
        ],
      },
      zh: {
        title: 'AI 资本支出 vs 营收差距探索器',
        tagline: '调整 2026 年"AI 泡沫"争论背后的增长假设，看看如果差距会缩小，AI 营收追上 AI 基础设施支出会是哪一年。',
        about: [
          '我们那篇关于 AI 泡沫争论的文章，核心是一个令人不安的数字:大型科技公司每年在 AI 基础设施上的支出估计高达 7000 亿美元甚至更多，而 AI 相关的实际营收只有大约 500 亿到 1500 亿美元。这个差距究竟是一个会自我修正的暂时性投资周期，还是结构性问题，完全取决于双方接下来各自的增长速度——而且理性的人们对此意见并不一致。',
          '这个工具会用你选择的增长率，从 2026 年开始向后推演这两条曲线，并在给定的时间范围内(如果确实会发生)显示两者交叉的年份。这只是根据我们文章中的估算数字构建的简单复利模型，并非预测——拖动滑块是为了让你自己检验乐观派和悲观派的论点，而不是为了预测未来。',
        ],
      },
    },
  },
];

export function toolUrl(slug: string, lang: Lang): string {
  return lang === 'en' ? `/tools/${slug}/` : `/${lang}/tools/${slug}/`;
}
export function toolsIndexUrl(lang: Lang): string {
  return lang === 'en' ? '/tools/' : `/${lang}/tools/`;
}
