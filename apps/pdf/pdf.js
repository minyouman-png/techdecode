/* MeNew PDF — 브라우저 안에서만 동작하는 PDF 편집기 (pdf-lib + pdf.js, 서버 전송 없음) */
(function () {
  'use strict';

  /* ---------- i18n ---------- */
  var LANGS = ['en', 'ko', 'ja', 'es', 'zh'];
  var qs = new URLSearchParams(location.search);
  var lang = qs.get('lang');
  if (LANGS.indexOf(lang) < 0) lang = (navigator.language || 'en').slice(0, 2);
  if (LANGS.indexOf(lang) < 0) lang = 'en';
  var STR = {
    en: {
      open: 'Open PDF', img: 'Images → PDF', save: 'Save PDF',
      all: 'Select all', none: 'Clear', left: '⟲ Left', right: '⟳ Right', del: 'Delete',
      extract: 'Save selected', png: 'Save as PNG',
      dropTitle: 'Drop PDF files here',
      dropBody: 'Open several files to merge them. Drag the pages to reorder, select pages to rotate, delete or split them out. Nothing is uploaded — everything happens inside this browser.',
      priv: 'Your file never leaves this browser. Nothing is uploaded to a server.',
      count: function (n, s) { return n + ' pages · ' + s + ' selected'; },
      working: 'Working…', rendering: 'Rendering…',
      noPdf: 'That file is not a readable PDF.',
      encrypted: 'This PDF is password-protected and cannot be opened.',
      unsaved: 'You have unsaved changes.', empty: 'No pages left.'
    },
    ko: {
      open: 'PDF 열기', img: '이미지 → PDF', save: 'PDF 저장',
      all: '전체 선택', none: '선택 해제', left: '⟲ 왼쪽', right: '⟳ 오른쪽', del: '삭제',
      extract: '선택만 저장', png: 'PNG로 저장',
      dropTitle: '여기에 PDF를 놓으세요',
      dropBody: '여러 개를 열면 하나로 합쳐집니다. 페이지를 끌어 순서를 바꾸고, 선택해서 회전·삭제하거나 따로 저장할 수 있습니다. 업로드되지 않고 전부 이 브라우저 안에서 처리됩니다.',
      priv: '파일은 이 브라우저 밖으로 나가지 않습니다. 서버로 전송되지 않습니다.',
      count: function (n, s) { return n + '페이지 · ' + s + '개 선택'; },
      working: '처리 중…', rendering: '그리는 중…',
      noPdf: '읽을 수 있는 PDF가 아닙니다.',
      encrypted: '암호가 걸린 PDF라 열 수 없습니다.',
      unsaved: '저장하지 않은 변경사항이 있습니다.', empty: '남은 페이지가 없습니다.'
    },
    ja: {
      open: 'PDFを開く', img: '画像 → PDF', save: 'PDF保存',
      all: '全選択', none: '選択解除', left: '⟲ 左', right: '⟳ 右', del: '削除',
      extract: '選択のみ保存', png: 'PNGで保存',
      dropTitle: 'ここにPDFをドロップ',
      dropBody: '複数開くと1つに結合されます。ページをドラッグして並べ替え、選択して回転・削除・抽出できます。アップロードされず、すべてこのブラウザ内で処理されます。',
      priv: 'ファイルはこのブラウザの外に出ません。サーバーに送信されません。',
      count: function (n, s) { return n + 'ページ · ' + s + '件選択'; },
      working: '処理中…', rendering: '描画中…',
      noPdf: '読み取れるPDFではありません。',
      encrypted: 'パスワード保護されたPDFのため開けません。',
      unsaved: '未保存の変更があります。', empty: '残りのページがありません。'
    },
    es: {
      open: 'Abrir PDF', img: 'Imágenes → PDF', save: 'Guardar PDF',
      all: 'Seleccionar todo', none: 'Limpiar', left: '⟲ Izquierda', right: '⟳ Derecha', del: 'Eliminar',
      extract: 'Guardar selección', png: 'Guardar como PNG',
      dropTitle: 'Suelta aquí tus PDF',
      dropBody: 'Abre varios archivos para combinarlos. Arrastra las páginas para reordenarlas, selecciónalas para rotarlas, borrarlas o extraerlas. Nada se sube: todo ocurre dentro de este navegador.',
      priv: 'Tu archivo nunca sale de este navegador. No se envía a ningún servidor.',
      count: function (n, s) { return n + ' páginas · ' + s + ' seleccionadas'; },
      working: 'Procesando…', rendering: 'Dibujando…',
      noPdf: 'Ese archivo no es un PDF legible.',
      encrypted: 'Este PDF está protegido con contraseña y no se puede abrir.',
      unsaved: 'Tienes cambios sin guardar.', empty: 'No quedan páginas.'
    },
    zh: {
      open: '打开 PDF', img: '图片 → PDF', save: '保存 PDF',
      all: '全选', none: '取消选择', left: '⟲ 左转', right: '⟳ 右转', del: '删除',
      extract: '仅保存所选', png: '保存为 PNG',
      dropTitle: '将 PDF 拖到这里',
      dropBody: '打开多个文件即可合并。拖动页面可重新排序，选中后可旋转、删除或单独导出。文件不会上传，全部在此浏览器内处理。',
      priv: '文件不会离开此浏览器，也不会发送到任何服务器。',
      count: function (n, s) { return n + ' 页 · 已选 ' + s + ' 个'; },
      working: '处理中…', rendering: '绘制中…',
      noPdf: '该文件不是可读取的 PDF。',
      encrypted: '此 PDF 有密码保护，无法打开。',
      unsaved: '有未保存的更改。', empty: '没有剩余页面。'
    }
  };
  var T = STR[lang];

  var $ = function (id) { return document.getElementById(id); };
  function setText(id, v) { $(id).textContent = v; }
  setText('btnOpen', T.open); setText('btnImg', T.img); setText('btnSave', T.save);
  setText('btnAll', T.all); setText('btnNone', T.none);
  setText('btnLeft', T.left); setText('btnRight', T.right); setText('btnDel', T.del);
  setText('btnExtract', T.extract); setText('btnPng', T.png);
  setText('dropTitle', T.dropTitle); setText('dropBody', T.dropBody);
  setText('privnote', '🔒 ' + T.priv);
  $('backLink').href = (lang === 'en' ? '/tools/' : '/' + lang + '/tools/');

  /* pdf.js 워커도 같은 도메인의 로컬 파일 — 외부 CDN 을 쓰지 않는다. */
  pdfjsLib.GlobalWorkerOptions.workerSrc = '../vendor/pdfjs.worker.min.js';

  /* ---------- 상태 ----------
     sources: 열어둔 원본 PDF (bytes + pdf.js 문서)
     pages:   화면에 보이는 페이지 목록. 원본을 가리키기만 하므로 편집이 가벼움. */
  var sources = [];
  var pages = [];
  var uid = 0;
  var dirty = false;

  function busy(on, msg) {
    document.body.classList.toggle('busy', !!on);
    if (msg) setText('busyText', msg);
  }
  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function baseName(n) { return String(n).replace(/\.[^.]+$/, ''); }
  function selected() { return pages.filter(function (p) { return p.sel; }); }

  function refreshBar() {
    var n = selected().length;
    setText('count', T.count(pages.length, n));
    ['btnLeft', 'btnRight', 'btnDel', 'btnExtract', 'btnPng'].forEach(function (id) {
      $(id).disabled = n === 0;
    });
    $('btnSave').disabled = pages.length === 0;
    $('drop').style.display = pages.length ? 'none' : 'flex';
    var names = sources.map(function (s) { return s.name; }).join(', ');
    setText('fname', names.length > 60 ? names.slice(0, 60) + '…' : names);
  }

  /* ---------- 파일 열기 ---------- */
  async function openPdfFiles(files) {
    busy(true, T.working);
    try {
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var buf = new Uint8Array(await f.arrayBuffer());
        var doc;
        try {
          /* pdf.js 가 bytes 를 detach 시키므로 사본을 넘긴다 */
          doc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
        } catch (err) {
          alert((err && /password/i.test(err.message || '') ? T.encrypted : T.noPdf) + '\n' + f.name);
          continue;
        }
        var srcIdx = sources.length;
        sources.push({ name: f.name, bytes: buf, doc: doc });
        for (var p = 1; p <= doc.numPages; p++) {
          pages.push({ id: ++uid, src: srcIdx, page: p, rot: 0, sel: false });
        }
      }
      dirty = sources.length > 1;
      renderGrid();
    } finally { busy(false); }
  }

  /* ---------- 썸네일 ---------- */
  async function drawThumb(cv, item) {
    var src = sources[item.src];
    var page = await src.doc.getPage(item.page);
    var vp0 = page.getViewport({ scale: 1 });
    var box = { w: 132, h: 162 };
    var scale = Math.min(box.w / vp0.width, box.h / vp0.height);
    var vp = page.getViewport({ scale: scale });
    cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
    await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    applyRot(cv, item);
  }
  /* 회전은 원본을 다시 그리지 않고 표시만 돌린다(저장 시 실제로 적용). */
  function applyRot(cv, item) {
    var r = ((item.rot % 360) + 360) % 360;
    var s = 1;
    if (r === 90 || r === 270) {
      s = Math.min(162 / cv.width, 132 / cv.height, 1);
    }
    cv.style.transform = 'rotate(' + r + 'deg) scale(' + s + ')';
  }

  function renderGrid() {
    var grid = $('grid');
    grid.innerHTML = '';
    pages.forEach(function (item, idx) {
      var el = document.createElement('div');
      el.className = 'pg' + (item.sel ? ' sel' : '');
      el.draggable = true;
      el.dataset.idx = idx;
      el.innerHTML =
        '<div class="thumbwrap"><canvas></canvas></div>' +
        '<div class="lbl"><span>' + (idx + 1) + '</span>' +
        '<span class="src">' + escapeHtml(sources[item.src].name) + '</span></div>' +
        '<div class="mark">✓</div>';
      el.addEventListener('click', function () {
        item.sel = !item.sel;
        el.classList.toggle('sel', item.sel);
        refreshBar();
      });
      /* 드래그로 순서 변경 */
      el.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', String(idx));
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragover', function (e) { e.preventDefault(); });
      el.addEventListener('drop', function (e) {
        e.preventDefault(); e.stopPropagation();
        var from = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (isNaN(from) || from === idx) return;
        var moved = pages.splice(from, 1)[0];
        pages.splice(idx, 0, moved);
        dirty = true;
        renderGrid();
      });
      grid.appendChild(el);
      drawThumb(el.querySelector('canvas'), item);
    });
    refreshBar();
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- 저장 ---------- */
  /* 선택 목록(없으면 전체)을 새 PDF 로 조립. 원본 회전값에 우리가 준 회전을 더한다. */
  async function buildPdf(list) {
    var PDFDocument = PDFLib.PDFDocument, degrees = PDFLib.degrees;
    var out = await PDFDocument.create();
    var cache = {};
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!cache[item.src]) {
        cache[item.src] = await PDFDocument.load(sources[item.src].bytes.slice(0), {
          ignoreEncryption: true
        });
      }
      var copied = await out.copyPages(cache[item.src], [item.page - 1]);
      var pg = copied[0];
      if (item.rot) {
        var base = 0;
        try { base = pg.getRotation().angle || 0; } catch (e) { base = 0; }
        pg.setRotation(degrees((((base + item.rot) % 360) + 360) % 360));
      }
      out.addPage(pg);
    }
    return out.save();
  }

  async function savePdf(list, suffix) {
    if (!list.length) { alert(T.empty); return; }
    busy(true, T.working);
    try {
      var bytes = await buildPdf(list);
      var name = (sources[0] ? baseName(sources[0].name) : 'document') + suffix + '.pdf';
      download(new Blob([bytes], { type: 'application/pdf' }), name);
      dirty = false;
    } catch (e) {
      alert(String(e && e.message || e));
    } finally { busy(false); }
  }

  /* 선택 페이지를 PNG 로. 1장이면 그대로, 여러 장이면 zip 으로 묶는다. */
  async function savePng() {
    var list = selected();
    if (!list.length) return;
    busy(true, T.rendering);
    try {
      var blobs = [];
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var page = await sources[item.src].doc.getPage(item.page);
        var rot = ((page.rotate || 0) + item.rot) % 360;
        var vp = page.getViewport({ scale: 2, rotation: ((rot % 360) + 360) % 360 });
        var cv = document.createElement('canvas');
        cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
        await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
        var blob = await new Promise(function (res) { cv.toBlob(res, 'image/png'); });
        blobs.push({ name: 'page-' + String(pages.indexOf(item) + 1).padStart(3, '0') + '.png', blob: blob });
      }
      var stem = sources[0] ? baseName(sources[0].name) : 'pages';
      if (blobs.length === 1) {
        download(blobs[0].blob, stem + '.png');
      } else {
        var zip = new JSZip();
        blobs.forEach(function (b) { zip.file(b.name, b.blob); });
        var z = await zip.generateAsync({ type: 'blob' });
        download(z, stem + '-pages.zip');
      }
    } catch (e) {
      alert(String(e && e.message || e));
    } finally { busy(false); }
  }

  /* ---------- 이미지 → PDF ---------- */
  async function imagesToPdf(files) {
    busy(true, T.working);
    try {
      var PDFDocument = PDFLib.PDFDocument;
      var out = await PDFDocument.create();
      var added = 0;
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var bytes = new Uint8Array(await f.arrayBuffer());
        var img;
        if (/\.png$/i.test(f.name) || f.type === 'image/png') img = await out.embedPng(bytes);
        else if (/\.jpe?g$/i.test(f.name) || f.type === 'image/jpeg') img = await out.embedJpg(bytes);
        else continue;
        var pg = out.addPage([img.width, img.height]);
        pg.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        added++;
      }
      if (!added) { alert(T.noPdf); return; }
      var b = await out.save();
      download(new Blob([b], { type: 'application/pdf' }), 'images.pdf');
    } catch (e) {
      alert(String(e && e.message || e));
    } finally { busy(false); }
  }

  /* ---------- 버튼 ---------- */
  $('btnOpen').onclick = function () { $('fileInput').click(); };
  $('btnImg').onclick = function () { $('imgInput').click(); };
  /* ⚠️ FileList 는 input.value 를 비우면 같이 비워진다. 비동기로 읽기 전에
     반드시 배열로 복사해 둘 것(안 그러면 두 번째 파일부터 조용히 사라진다). */
  $('fileInput').onchange = function (e) {
    var fs = Array.prototype.slice.call(e.target.files);
    e.target.value = '';
    if (fs.length) openPdfFiles(fs);
  };
  $('imgInput').onchange = function (e) {
    var fs = Array.prototype.slice.call(e.target.files);
    e.target.value = '';
    if (fs.length) imagesToPdf(fs);
  };
  $('btnSave').onclick = function () { savePdf(pages, ''); };
  $('btnExtract').onclick = function () { savePdf(selected(), '-selected'); };
  $('btnPng').onclick = savePng;
  $('btnAll').onclick = function () { pages.forEach(function (p) { p.sel = true; }); renderGrid(); };
  $('btnNone').onclick = function () { pages.forEach(function (p) { p.sel = false; }); renderGrid(); };
  $('btnLeft').onclick = function () { selected().forEach(function (p) { p.rot -= 90; }); dirty = true; renderGrid(); };
  $('btnRight').onclick = function () { selected().forEach(function (p) { p.rot += 90; }); dirty = true; renderGrid(); };
  $('btnDel').onclick = function () {
    pages = pages.filter(function (p) { return !p.sel; });
    dirty = true;
    renderGrid();
  };

  /* ---------- 드래그 앤 드롭 ---------- */
  ['dragenter', 'dragover'].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (!e.dataTransfer || !e.dataTransfer.types || e.dataTransfer.types.indexOf('Files') < 0) return;
      e.preventDefault(); document.body.classList.add('dragging');
    });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (ev === 'dragleave' && e.relatedTarget) return;
      document.body.classList.remove('dragging');
    });
  });
  window.addEventListener('drop', function (e) {
    if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
    e.preventDefault();
    var fs = Array.prototype.slice.call(e.dataTransfer.files);
    var pdfs = fs.filter(function (f) { return /\.pdf$/i.test(f.name) || f.type === 'application/pdf'; });
    var imgs = fs.filter(function (f) { return /\.(png|jpe?g)$/i.test(f.name) || /^image\//.test(f.type); });
    if (pdfs.length) openPdfFiles(pdfs);
    else if (imgs.length) imagesToPdf(imgs);
  });

  window.addEventListener('beforeunload', function (e) {
    if (dirty && pages.length) { e.preventDefault(); e.returnValue = T.unsaved; }
  });

  refreshBar();

  /* 자동 검증용 훅 (?test=1). 실제 사용에는 영향이 없다. */
  window.__pdfapp = {
    state: function () { return { sources: sources.length, pages: pages.length, sel: selected().length }; },
    openBytes: async function (name, u8) {
      var doc = await pdfjsLib.getDocument({ data: u8.slice(0) }).promise;
      var srcIdx = sources.length;
      sources.push({ name: name, bytes: u8, doc: doc });
      for (var p = 1; p <= doc.numPages; p++) pages.push({ id: ++uid, src: srcIdx, page: p, rot: 0, sel: false });
      renderGrid();
      return doc.numPages;
    },
    build: async function (idxList) {
      var list = idxList ? idxList.map(function (i) { return pages[i]; }) : pages;
      var bytes = await buildPdf(list);
      return Array.from(bytes.slice(0, 8));
    },
    buildLen: async function () { return (await buildPdf(pages)).length; },
    buildB64: async function () {
      var u8 = await buildPdf(pages), s = '';
      for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
      return btoa(s);
    },
    select: function (idxs) { pages.forEach(function (p, i) { p.sel = idxs.indexOf(i) >= 0; }); renderGrid(); },
    rotate: function (d) { selected().forEach(function (p) { p.rot += d; }); renderGrid(); },
    del: function () { pages = pages.filter(function (p) { return !p.sel; }); renderGrid(); },
    imagesToPdfBytes: async function (items) {
      var out = await PDFLib.PDFDocument.create();
      for (var i = 0; i < items.length; i++) {
        var img = items[i].png ? await out.embedPng(items[i].bytes) : await out.embedJpg(items[i].bytes);
        var pg = out.addPage([img.width, img.height]);
        pg.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      return (await out.save()).length;
    }
  };
})();
