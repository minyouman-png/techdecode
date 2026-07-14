/* MeNew Show — 브라우저 안에서만 동작하는 프레젠테이션 편집기.
   저장: pptxgenjs(.pptx) / 열기: JSZip으로 pptx 텍스트박스·이미지·배경 파싱. 서버 전송 없음. */
(function () {
  'use strict';

  var W = 960, H = 540; // 슬라이드 논리 좌표계 (16:9, 96dpi 기준 10in)

  /* ---------- i18n ---------- */
  var LANGS = ['en', 'ko', 'ja', 'es', 'zh'];
  var qs = new URLSearchParams(location.search);
  var lang = qs.get('lang');
  if (LANGS.indexOf(lang) < 0) lang = (navigator.language || 'en').slice(0, 2);
  if (LANGS.indexOf(lang) < 0) lang = 'en';
  var STR = {
    en: { open: 'Open', save: 'Save PPTX', neu: 'New', present: '▶ Present', priv: 'Your file never leaves this browser.', confirmNew: 'Discard current slides?', unsaved: 'You have unsaved changes.', newText: 'Double-tap to edit', bg: 'BG', slideOf: ' / ' },
    ko: { open: '열기', save: 'PPTX 저장', neu: '새 문서', present: '▶ 발표', priv: '파일은 브라우저 밖으로 나가지 않습니다.', confirmNew: '현재 슬라이드를 버릴까요?', unsaved: '저장하지 않은 변경사항이 있습니다.', newText: '두 번 눌러 편집', bg: '배경', slideOf: ' / ' },
    ja: { open: '開く', save: 'PPTX保存', neu: '新規', present: '▶ 発表', priv: 'ファイルはブラウザの外に送信されません。', confirmNew: '現在のスライドを破棄しますか？', unsaved: '未保存の変更があります。', newText: 'ダブルタップで編集', bg: '背景', slideOf: ' / ' },
    es: { open: 'Abrir', save: 'Guardar PPTX', neu: 'Nuevo', present: '▶ Presentar', priv: 'Tu archivo nunca sale de este navegador.', confirmNew: '¿Descartar las diapositivas actuales?', unsaved: 'Tienes cambios sin guardar.', newText: 'Doble clic para editar', bg: 'Fondo', slideOf: ' / ' },
    zh: { open: '打开', save: '保存 PPTX', neu: '新建', present: '▶ 放映', priv: '文件不会离开你的浏览器。', confirmNew: '放弃当前幻灯片？', unsaved: '有未保存的更改。', newText: '双击编辑', bg: '背景', slideOf: ' / ' }
  };
  var T = STR[lang];
  document.getElementById('btnOpen').textContent = T.open;
  document.getElementById('btnSave').textContent = T.save;
  document.getElementById('btnNew').textContent = T.neu;
  document.getElementById('btnPresent').textContent = T.present;
  document.getElementById('privnote').textContent = '🔒 ' + T.priv;
  document.getElementById('bgLabel').textContent = T.bg;
  document.getElementById('backLink').href = (lang === 'en' ? '/tools/' : '/' + lang + '/tools/');

  /* ---------- 상태 ---------- */
  function newTextEl(txt) {
    return { type: 'text', x: 80, y: 80, w: 420, h: 90, text: txt || T.newText, size: 28, color: '#1c1a16', bold: false, align: 'left' };
  }
  function newSlide() { return { bg: '#ffffff', els: [] }; }
  function titleSlide() {
    var s = newSlide();
    s.els.push({ type: 'text', x: 90, y: 190, w: 780, h: 100, text: 'MeNew Show', size: 54, color: '#1c1a16', bold: true, align: 'center' });
    s.els.push({ type: 'text', x: 90, y: 305, w: 780, h: 60, text: T.newText, size: 22, color: '#8a8271', bold: false, align: 'center' });
    return s;
  }
  var slides = [titleSlide()];
  var cur = 0;          // 현재 슬라이드 인덱스
  var selEl = -1;       // 선택된 요소 인덱스
  var dirty = false;
  var currentName = '';
  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = T.unsaved; }
  });
  function setName(n) { currentName = n || ''; document.getElementById('fname').textContent = currentName; }
  function markDirty() { dirty = true; }

  /* ---------- 렌더링 ---------- */
  var canvas = document.getElementById('canvas');
  var holder = document.getElementById('canvasHolder');
  var stage = document.getElementById('stage');
  var rail = document.getElementById('rail');
  var scale = 1;

  function layout() {
    var availW = stage.clientWidth - 48, availH = stage.clientHeight - 48;
    scale = Math.min(availW / W, availH / H);
    if (scale <= 0) scale = 0.1;
    holder.style.width = (W * scale) + 'px';
    holder.style.height = (H * scale) + 'px';
    canvas.style.transform = 'scale(' + scale + ')';
  }
  window.addEventListener('resize', function () { layout(); });

  function renderElInto(container, el, idx, interactive) {
    var d = document.createElement('div');
    d.className = 'el ' + el.type;
    d.style.left = el.x + 'px';
    d.style.top = el.y + 'px';
    d.style.width = el.w + 'px';
    d.style.height = el.h + 'px';
    if (el.type === 'text') {
      d.style.fontSize = el.size + 'px';
      d.style.color = el.color;
      d.style.fontWeight = el.bold ? '700' : '400';
      d.style.textAlign = el.align;
      d.textContent = el.text;
    } else {
      var img = document.createElement('img');
      img.src = el.src;
      d.appendChild(img);
    }
    if (interactive) {
      d.dataset.idx = idx;
      if (idx === selEl) d.classList.add('sel');
      var h = document.createElement('div');
      h.className = 'handle';
      h.dataset.resize = '1';
      d.appendChild(h);
    }
    container.appendChild(d);
    return d;
  }

  function render() {
    canvas.innerHTML = '';
    var s = slides[cur];
    canvas.style.background = s.bg;
    document.getElementById('bgColor').value = s.bg;
    s.els.forEach(function (el, i) { renderElInto(canvas, el, i, true); });
    renderRail();
    updateOps();
  }

  function renderRail() {
    rail.innerHTML = '';
    slides.forEach(function (s, i) {
      var t = document.createElement('div');
      t.className = 'thumb' + (i === cur ? ' sel' : '');
      var no = document.createElement('span');
      no.className = 'tno';
      no.textContent = i + 1;
      t.appendChild(no);
      var mini = document.createElement('div');
      mini.className = 'mini';
      mini.style.background = s.bg;
      s.els.forEach(function (el, j) { renderElInto(mini, el, j, false); });
      t.appendChild(mini);
      t.addEventListener('click', function () { cur = i; selEl = -1; render(); });
      rail.appendChild(t);
      var sc = t.clientWidth / W;
      mini.style.transform = 'scale(' + sc + ')';
    });
  }

  function updateOps() {
    var has = selEl >= 0;
    document.querySelectorAll('.elop').forEach(function (b) {
      if (b.tagName === 'INPUT') b.disabled = !has;
      else b.toggleAttribute('disabled', !has);
    });
    if (has) {
      var el = slides[cur].els[selEl];
      if (el.type === 'text') document.getElementById('elColor').value = el.color;
    }
  }

  /* ---------- 선택/드래그/리사이즈/텍스트 편집 ---------- */
  var drag = null;
  canvas.addEventListener('pointerdown', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.resize) {
      var host = t.parentElement;
      selEl = parseInt(host.dataset.idx, 10);
      var el = slides[cur].els[selEl];
      drag = { mode: 'resize', sx: e.clientX, sy: e.clientY, ox: el.w, oy: el.h };
      canvas.setPointerCapture(e.pointerId);
      render();
      e.preventDefault();
      return;
    }
    while (t && t !== canvas && !(t.classList && t.classList.contains('el'))) t = t.parentElement;
    if (t && t !== canvas && t.classList.contains('el')) {
      if (t.classList.contains('editing')) return;
      selEl = parseInt(t.dataset.idx, 10);
      var el2 = slides[cur].els[selEl];
      drag = { mode: 'move', sx: e.clientX, sy: e.clientY, ox: el2.x, oy: el2.y, moved: false };
      canvas.setPointerCapture(e.pointerId);
      render();
      e.preventDefault();
    } else {
      commitEditing();
      selEl = -1;
      render();
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag || selEl < 0) return;
    var dx = (e.clientX - drag.sx) / scale, dy = (e.clientY - drag.sy) / scale;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    var el = slides[cur].els[selEl];
    if (drag.mode === 'move') {
      el.x = Math.round(Math.max(-el.w + 20, Math.min(W - 20, drag.ox + dx)));
      el.y = Math.round(Math.max(-el.h + 20, Math.min(H - 20, drag.oy + dy)));
    } else {
      el.w = Math.round(Math.max(40, drag.ox + dx));
      el.h = Math.round(Math.max(30, drag.oy + dy));
    }
    var d = canvas.querySelector('.el[data-idx="' + selEl + '"]');
    if (d) {
      d.style.left = el.x + 'px'; d.style.top = el.y + 'px';
      d.style.width = el.w + 'px'; d.style.height = el.h + 'px';
    }
    markDirty();
  });
  canvas.addEventListener('pointerup', function () {
    if (drag && drag.moved) renderRail();
    drag = null;
  });

  var lastTap = 0;
  canvas.addEventListener('dblclick', function (e) { tryEdit(e.target); });
  canvas.addEventListener('pointerup', function (e) {
    var now = Date.now();
    if (now - lastTap < 350 && !(drag && drag.moved)) tryEdit(e.target);
    lastTap = now;
  });
  function tryEdit(t) {
    while (t && t !== canvas && !(t.classList && t.classList.contains('el'))) t = t.parentElement;
    if (!t || t === canvas || !t.classList.contains('text')) return;
    var idx = parseInt(t.dataset.idx, 10);
    selEl = idx;
    t.classList.add('editing');
    t.setAttribute('contenteditable', 'plaintext-only');
    if (t.contentEditable !== 'plaintext-only') t.setAttribute('contenteditable', 'true');
    var handle = t.querySelector('.handle');
    if (handle) handle.remove();
    t.focus();
    var sel = window.getSelection(), range = document.createRange();
    range.selectNodeContents(t);
    sel.removeAllRanges();
    sel.addRange(range);
    t.addEventListener('blur', function onblur() {
      t.removeEventListener('blur', onblur);
      var el = slides[cur].els[idx];
      if (el) { el.text = t.innerText.replace(/\n$/, ''); }
      markDirty();
      render();
    });
  }
  function commitEditing() {
    var ed = canvas.querySelector('.el.editing');
    if (ed) ed.blur();
  }
  document.addEventListener('keydown', function (e) {
    if (document.getElementById('present').classList.contains('on')) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && selEl >= 0 && !canvas.querySelector('.el.editing')) {
      slides[cur].els.splice(selEl, 1);
      selEl = -1;
      markDirty();
      render();
      e.preventDefault();
    }
  });

  /* ---------- 툴바 동작 ---------- */
  function withSel(fn) {
    if (selEl < 0) return;
    fn(slides[cur].els[selEl]);
    markDirty();
    render();
  }
  document.getElementById('addText').addEventListener('click', function () {
    slides[cur].els.push(newTextEl());
    selEl = slides[cur].els.length - 1;
    markDirty();
    render();
  });
  var imgInput = document.getElementById('imgInput');
  document.getElementById('addImage').addEventListener('click', function () { imgInput.click(); });
  imgInput.addEventListener('change', function () {
    var f = imgInput.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var probe = new Image();
      probe.onload = function () {
        var w = Math.min(probe.width, 500);
        var h = w * probe.height / probe.width;
        slides[cur].els.push({ type: 'image', x: (W - w) / 2, y: (H - h) / 2, w: Math.round(w), h: Math.round(h), src: e.target.result });
        selEl = slides[cur].els.length - 1;
        markDirty();
        render();
      };
      probe.src = e.target.result;
      imgInput.value = '';
    };
    reader.readAsDataURL(f);
  });
  document.getElementById('szUp').addEventListener('click', function () { withSel(function (el) { if (el.size) el.size = Math.min(140, el.size + 4); }); });
  document.getElementById('szDown').addEventListener('click', function () { withSel(function (el) { if (el.size) el.size = Math.max(10, el.size - 4); }); });
  document.getElementById('tbBold').addEventListener('click', function () { withSel(function (el) { el.bold = !el.bold; }); });
  document.getElementById('elColor').addEventListener('input', function () {
    var v = this.value;
    withSel(function (el) { el.color = v; });
  });
  document.getElementById('alLeft').addEventListener('click', function () { withSel(function (el) { el.align = 'left'; }); });
  document.getElementById('alCenter').addEventListener('click', function () { withSel(function (el) { el.align = 'center'; }); });
  document.getElementById('alRight').addEventListener('click', function () { withSel(function (el) { el.align = 'right'; }); });
  document.getElementById('zUp').addEventListener('click', function () {
    if (selEl < 0 || selEl >= slides[cur].els.length - 1) return;
    var arr = slides[cur].els;
    var t = arr[selEl]; arr[selEl] = arr[selEl + 1]; arr[selEl + 1] = t;
    selEl++; markDirty(); render();
  });
  document.getElementById('zDown').addEventListener('click', function () {
    if (selEl <= 0) return;
    var arr = slides[cur].els;
    var t = arr[selEl]; arr[selEl] = arr[selEl - 1]; arr[selEl - 1] = t;
    selEl--; markDirty(); render();
  });
  document.getElementById('elDel').addEventListener('click', function () {
    if (selEl < 0) return;
    slides[cur].els.splice(selEl, 1);
    selEl = -1; markDirty(); render();
  });
  document.getElementById('bgColor').addEventListener('input', function () {
    slides[cur].bg = this.value;
    markDirty(); render();
  });
  document.getElementById('slAdd').addEventListener('click', function () {
    slides.splice(cur + 1, 0, newSlide());
    cur++; selEl = -1; markDirty(); render();
  });
  document.getElementById('slDup').addEventListener('click', function () {
    slides.splice(cur + 1, 0, JSON.parse(JSON.stringify(slides[cur])));
    cur++; selEl = -1; markDirty(); render();
  });
  document.getElementById('slDel').addEventListener('click', function () {
    if (slides.length <= 1) { slides = [newSlide()]; cur = 0; }
    else { slides.splice(cur, 1); cur = Math.min(cur, slides.length - 1); }
    selEl = -1; markDirty(); render();
  });
  document.getElementById('slUp').addEventListener('click', function () {
    if (cur <= 0) return;
    var t = slides[cur]; slides[cur] = slides[cur - 1]; slides[cur - 1] = t;
    cur--; markDirty(); render();
  });
  document.getElementById('slDown').addEventListener('click', function () {
    if (cur >= slides.length - 1) return;
    var t = slides[cur]; slides[cur] = slides[cur + 1]; slides[cur + 1] = t;
    cur++; markDirty(); render();
  });
  document.getElementById('btnNew').addEventListener('click', function () {
    if (dirty && !confirm(T.confirmNew)) return;
    slides = [titleSlide()]; cur = 0; selEl = -1; dirty = false; setName('');
    render();
  });

  /* ---------- 발표 모드 ---------- */
  var present = document.getElementById('present');
  var pslide = document.getElementById('pslide');
  var pnav = document.getElementById('pnav');
  var pIdx = 0;
  function renderPresent() {
    pslide.innerHTML = '';
    var s = slides[pIdx];
    pslide.style.background = s.bg;
    s.els.forEach(function (el, i) { renderElInto(pslide, el, i, false); });
    var sc = Math.min(window.innerWidth / W, window.innerHeight / H);
    pslide.style.transform = 'scale(' + sc + ')';
    pnav.textContent = (pIdx + 1) + T.slideOf + slides.length;
  }
  document.getElementById('btnPresent').addEventListener('click', function () {
    commitEditing();
    pIdx = cur;
    present.classList.add('on');
    if (present.requestFullscreen) present.requestFullscreen().catch(function () {});
    renderPresent();
  });
  function exitPresent() {
    present.classList.remove('on');
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
  }
  present.addEventListener('click', function () {
    if (pIdx < slides.length - 1) { pIdx++; renderPresent(); }
    else exitPresent();
  });
  document.addEventListener('keydown', function (e) {
    if (!present.classList.contains('on')) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { if (pIdx < slides.length - 1) { pIdx++; renderPresent(); } }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { if (pIdx > 0) { pIdx--; renderPresent(); } }
    else if (e.key === 'Escape') exitPresent();
  });
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && present.classList.contains('on')) present.classList.remove('on');
  });
  window.addEventListener('resize', function () {
    if (present.classList.contains('on')) renderPresent();
  });

  /* ---------- PPTX 저장 (pptxgenjs) ---------- */
  var PX2IN = 1 / 96;
  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  function exportPptx() {
    var pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'MN16x9', width: 10, height: 5.625 });
    pptx.layout = 'MN16x9';
    slides.forEach(function (s) {
      var sl = pptx.addSlide();
      sl.background = { color: s.bg.replace('#', '') };
      s.els.forEach(function (el) {
        var box = { x: el.x * PX2IN, y: el.y * PX2IN, w: el.w * PX2IN, h: el.h * PX2IN };
        if (el.type === 'text') {
          sl.addText(el.text, {
            x: box.x, y: box.y, w: box.w, h: box.h,
            fontSize: Math.round(el.size * 0.75),
            color: el.color.replace('#', ''),
            bold: !!el.bold,
            align: el.align,
            valign: 'top'
          });
        } else if (el.type === 'image' && /^data:/.test(el.src)) {
          sl.addImage({ data: el.src, x: box.x, y: box.y, w: box.w, h: box.h });
        }
      });
    });
    return pptx.write('blob');
  }
  document.getElementById('btnSave').addEventListener('click', function () {
    commitEditing();
    var name = (currentName || 'menew-show').replace(/\.(pptx|json)$/i, '') + '.pptx';
    exportPptx().then(function (blob) {
      download(blob, name);
      dirty = false;
    }).catch(function (e) { alert('Error: ' + e.message); });
  });

  /* ---------- PPTX 열기 (JSZip 파싱: 텍스트박스·이미지·배경) ---------- */
  var EXT_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif' };
  function firstNS(el, name) {
    var list = el.getElementsByTagNameNS('*', name);
    return list.length ? list[0] : null;
  }
  function importPptx(arrayBuffer) {
    return JSZip.loadAsync(arrayBuffer).then(function (zip) {
      var presFile = zip.file('ppt/presentation.xml');
      if (!presFile) throw new Error('not a pptx');
      return presFile.async('string').then(function (presXml) {
        var pres = new DOMParser().parseFromString(presXml, 'application/xml');
        var sldSz = firstNS(pres.documentElement, 'sldSz');
        var cx = sldSz ? parseInt(sldSz.getAttribute('cx'), 10) : 12192000;
        var cy = sldSz ? parseInt(sldSz.getAttribute('cy'), 10) : 6858000;
        var slideNames = [];
        zip.forEach(function (path) {
          var m = /^ppt\/slides\/slide(\d+)\.xml$/.exec(path);
          if (m) slideNames.push({ n: parseInt(m[1], 10), path: path });
        });
        slideNames.sort(function (a, b) { return a.n - b.n; });
        var out = [];
        var chain = Promise.resolve();
        slideNames.forEach(function (sn) {
          chain = chain.then(function () {
            return parseSlide(zip, sn, cx, cy).then(function (s) { out.push(s); });
          });
        });
        return chain.then(function () {
          if (!out.length) throw new Error('no slides');
          return out;
        });
      });
    });
  }
  function parseSlide(zip, sn, cx, cy) {
    var relsPath = 'ppt/slides/_rels/slide' + sn.n + '.xml.rels';
    var relsFile = zip.file(relsPath);
    var relsPromise = relsFile ? relsFile.async('string') : Promise.resolve(null);
    return Promise.all([zip.file(sn.path).async('string'), relsPromise]).then(function (res) {
      var doc = new DOMParser().parseFromString(res[0], 'application/xml');
      var relMap = {};
      if (res[1]) {
        var rdoc = new DOMParser().parseFromString(res[1], 'application/xml');
        Array.prototype.forEach.call(rdoc.getElementsByTagNameNS('*', 'Relationship'), function (r) {
          relMap[r.getAttribute('Id')] = r.getAttribute('Target');
        });
      }
      var s = newSlide();
      var bg = firstNS(doc.documentElement, 'bg');
      if (bg) {
        var bgClr = firstNS(bg, 'srgbClr');
        if (bgClr) s.bg = '#' + bgClr.getAttribute('val');
      }
      function readXfrm(node) {
        var xfrm = firstNS(node, 'xfrm');
        if (!xfrm) return null;
        var off = firstNS(xfrm, 'off'), ext = firstNS(xfrm, 'ext');
        if (!off || !ext) return null;
        return {
          x: Math.round(parseInt(off.getAttribute('x'), 10) / cx * W),
          y: Math.round(parseInt(off.getAttribute('y'), 10) / cy * H),
          w: Math.round(parseInt(ext.getAttribute('cx'), 10) / cx * W),
          h: Math.round(parseInt(ext.getAttribute('cy'), 10) / cy * H)
        };
      }
      var imgPromises = [];
      var spTree = firstNS(doc.documentElement, 'spTree') || doc.documentElement;
      Array.prototype.forEach.call(spTree.childNodes, function (node) {
        if (node.nodeType !== 1) return;
        var local = node.localName;
        if (local === 'sp') {
          var box = readXfrm(node);
          if (!box) return;
          var txBody = firstNS(node, 'txBody');
          if (!txBody) return;
          var paras = txBody.getElementsByTagNameNS('*', 'p');
          var linesArr = [];
          var size = 0, color = '#1c1a16', bold = false, align = 'left';
          Array.prototype.forEach.call(paras, function (p) {
            var line = '';
            Array.prototype.forEach.call(p.getElementsByTagNameNS('*', 't'), function (t) { line += t.textContent; });
            linesArr.push(line);
            var pPr = firstNS(p, 'pPr');
            if (pPr && pPr.getAttribute('algn')) {
              var a = pPr.getAttribute('algn');
              if (a === 'ctr') align = 'center';
              else if (a === 'r') align = 'right';
            }
            var rPr = firstNS(p, 'rPr');
            if (rPr) {
              if (!size && rPr.getAttribute('sz')) size = Math.round(parseInt(rPr.getAttribute('sz'), 10) / 100 * (96 / 72));
              if (rPr.getAttribute('b') === '1') bold = true;
              var clr = firstNS(rPr, 'srgbClr');
              if (clr) color = '#' + clr.getAttribute('val');
            }
          });
          var text = linesArr.join('\n');
          if (!text.trim()) return;
          s.els.push({ type: 'text', x: box.x, y: box.y, w: box.w, h: box.h, text: text, size: size || 24, color: color, bold: bold, align: align });
        } else if (local === 'pic') {
          var pbox = readXfrm(node);
          var blip = firstNS(node, 'blip');
          if (!pbox || !blip) return;
          var rid = blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed') || blip.getAttribute('r:embed');
          var target = relMap[rid];
          if (!target) return;
          var mediaPath = target.replace(/^\.\.\//, 'ppt/');
          var mf = zip.file(mediaPath);
          if (!mf) return;
          var ext = (mediaPath.split('.').pop() || '').toLowerCase();
          var mime = EXT_MIME[ext];
          if (!mime) return;
          var elRef = { type: 'image', x: pbox.x, y: pbox.y, w: pbox.w, h: pbox.h, src: '' };
          s.els.push(elRef);
          imgPromises.push(mf.async('base64').then(function (b64) {
            elRef.src = 'data:' + mime + ';base64,' + b64;
          }));
        }
      });
      return Promise.all(imgPromises).then(function () {
        s.els = s.els.filter(function (el) { return el.type !== 'image' || el.src; });
        return s;
      });
    });
  }

  var fileInput = document.getElementById('fileInput');
  document.getElementById('btnOpen').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    var f = fileInput.files[0];
    if (!f) return;
    var reader = new FileReader();
    if (/\.json$/i.test(f.name)) {
      reader.onload = function (e) {
        try {
          var data = JSON.parse(e.target.result);
          if (!data.slides || !data.slides.length) throw new Error('invalid project');
          slides = data.slides; cur = 0; selEl = -1; dirty = false;
          setName(f.name);
          render();
        } catch (err) { alert('Error: ' + err.message); }
        fileInput.value = '';
      };
      reader.readAsText(f);
    } else {
      reader.onload = function (e) {
        importPptx(e.target.result).then(function (out) {
          slides = out; cur = 0; selEl = -1; dirty = false;
          setName(f.name);
          render();
        }).catch(function (err) { alert('Error: ' + err.message); });
        fileInput.value = '';
      };
      reader.readAsArrayBuffer(f);
    }
  });

  /* ---------- 초기화 ---------- */
  layout();
  render();

  /* ---------- 헤드리스 검증 훅 (?test=1) ---------- */
  if (qs.get('test') === '1') {
    setTimeout(function () {
      try {
        var PNG1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
        slides = [titleSlide(), newSlide()];
        slides[1].bg = '#222831';
        slides[1].els.push(newTextEl('테스트 둘째장'));
        slides[1].els.push({ type: 'image', x: 600, y: 300, w: 120, h: 120, src: PNG1 });
        cur = 0; selEl = -1;
        render();
        exportPptx().then(function (blob) {
          console.warn('[TEST] pptx bytes=' + blob.size);
          return blob.arrayBuffer();
        }).then(function (buf) {
          return importPptx(buf);
        }).then(function (out) {
          var s2 = out[1];
          var okBg = s2.bg.toLowerCase() === '#222831';
          var hasText = s2.els.some(function (e) { return e.type === 'text' && /둘째장/.test(e.text); });
          var hasImg = s2.els.some(function (e) { return e.type === 'image' && /^data:image\/png/.test(e.src); });
          console.warn('[TEST] reimport slides=' + out.length + ' bg=' + okBg + ' text=' + hasText + ' img=' + hasImg);
          console.warn((out.length === 2 && okBg && hasText && hasImg) ? '[TEST] SHOW OK' : '[TEST] SHOW FAIL');
        }).catch(function (e) { console.warn('[TEST] SHOW FAIL ' + e.message); });
      } catch (e) { console.warn('[TEST] SHOW FAIL ' + e.message); }
    }, 600);
  }
})();
