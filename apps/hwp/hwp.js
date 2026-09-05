/* MeNew HWP — 브라우저 안에서만 동작하는 한글(.hwp/.hwpx) 뷰어. 서버 전송 없음.
   .hwpx 는 ZIP+XML(OWPML) 이라 구조를 읽고, .hwp 5.0 은 CFB 컨테이너 안의
   압축된 레코드 스트림에서 본문 텍스트를 추출한다. 서식·이미지 재현은 목표가 아니다. */
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
      open: 'Open .hwp', copy: 'Copy text', txt: 'Save as TXT', print: 'Print / PDF',
      dropTitle: 'Drop a .hwp or .hwpx file here',
      dropBody: 'Reads Hangul word processor files right in your browser — useful on a Mac or Linux machine with no Hancom Office installed. Nothing is uploaded.',
      priv: 'Your file never leaves this browser. Nothing is uploaded to a server.',
      limits: 'This is a reader, not an editor. It extracts the text and table contents so you can read and copy them. Fonts, layout, images and precise formatting are not reproduced. Password-protected or distribution-locked (DRM) files cannot be opened.',
      info: function (p, s) { return p + ' paragraphs · ' + s + ' section(s)'; },
      working: 'Reading…', copied: 'Copied to clipboard.',
      bad: 'This file could not be read as a Hangul document.',
      encrypted: 'This file is password-protected or distribution-locked, so it cannot be opened.',
      emptyDoc: 'The file opened, but no readable text was found in it.'
    },
    ko: {
      open: '한글 파일 열기', copy: '텍스트 복사', txt: 'TXT로 저장', print: '인쇄 / PDF',
      dropTitle: '여기에 .hwp 또는 .hwpx 파일을 놓으세요',
      dropBody: '한글 문서를 브라우저에서 바로 읽습니다. 한컴오피스가 없는 맥이나 리눅스에서도 내용을 확인하고 텍스트를 복사할 수 있습니다. 파일은 업로드되지 않습니다.',
      priv: '파일은 이 브라우저 밖으로 나가지 않습니다. 서버로 전송되지 않습니다.',
      limits: '읽기 전용 뷰어입니다. 본문과 표의 글자를 추출해 읽고 복사할 수 있게 해줍니다. 글꼴·쪽 배치·이미지·세부 서식은 그대로 재현되지 않습니다. 암호가 걸렸거나 배포용으로 잠긴(DRM) 문서는 열 수 없습니다.',
      info: function (p, s) { return p + '개 문단 · ' + s + '개 구역'; },
      working: '읽는 중…', copied: '클립보드에 복사했습니다.',
      bad: '한글 문서로 읽을 수 없는 파일입니다.',
      encrypted: '암호가 걸렸거나 배포용으로 잠긴 문서라 열 수 없습니다.',
      emptyDoc: '파일은 열렸지만 읽을 수 있는 글자를 찾지 못했습니다.'
    },
    ja: {
      open: 'HWPを開く', copy: 'テキストをコピー', txt: 'TXTで保存', print: '印刷 / PDF',
      dropTitle: 'ここに .hwp / .hwpx をドロップ',
      dropBody: '韓国語ワープロ(ハングル)の文書をブラウザで直接読みます。Hancom Office が入っていない Mac や Linux でも内容を確認できます。アップロードされません。',
      priv: 'ファイルはこのブラウザの外に出ません。サーバーに送信されません。',
      limits: '閲覧専用ビューアです。本文と表の文字を抽出して読める形にします。フォント・レイアウト・画像・詳細な書式は再現されません。パスワード保護や配布制限(DRM)のかかった文書は開けません。',
      info: function (p, s) { return p + '段落 · ' + s + 'セクション'; },
      working: '読み込み中…', copied: 'クリップボードにコピーしました。',
      bad: 'ハングル文書として読み取れないファイルです。',
      encrypted: 'パスワード保護または配布制限のため開けません。',
      emptyDoc: 'ファイルは開きましたが、読み取れる文字が見つかりませんでした。'
    },
    es: {
      open: 'Abrir .hwp', copy: 'Copiar texto', txt: 'Guardar TXT', print: 'Imprimir / PDF',
      dropTitle: 'Suelta aquí un archivo .hwp o .hwpx',
      dropBody: 'Lee documentos del procesador de textos coreano Hangul directamente en tu navegador, útil en Mac o Linux sin Hancom Office. No se sube nada.',
      priv: 'Tu archivo nunca sale de este navegador. No se envía a ningún servidor.',
      limits: 'Es un visor, no un editor. Extrae el texto y el contenido de las tablas para poder leerlos y copiarlos. No reproduce fuentes, maquetación, imágenes ni formato preciso. Los archivos protegidos con contraseña o con DRM no se pueden abrir.',
      info: function (p, s) { return p + ' párrafos · ' + s + ' sección(es)'; },
      working: 'Leyendo…', copied: 'Copiado al portapapeles.',
      bad: 'No se pudo leer este archivo como documento Hangul.',
      encrypted: 'El archivo está protegido con contraseña o con DRM y no se puede abrir.',
      emptyDoc: 'El archivo se abrió, pero no se encontró texto legible.'
    },
    zh: {
      open: '打开 .hwp', copy: '复制文本', txt: '保存为 TXT', print: '打印 / PDF',
      dropTitle: '将 .hwp 或 .hwpx 拖到这里',
      dropBody: '在浏览器中直接阅读韩国 Hangul 文字处理文档，在没有安装 Hancom Office 的 Mac 或 Linux 上尤其有用。文件不会上传。',
      priv: '文件不会离开此浏览器，也不会发送到任何服务器。',
      limits: '这是阅读器而非编辑器。它提取正文与表格文字，方便阅读和复制。字体、排版、图片与精确格式不会还原。设有密码或分发保护(DRM)的文档无法打开。',
      info: function (p, s) { return p + ' 段 · ' + s + ' 节'; },
      working: '读取中…', copied: '已复制到剪贴板。',
      bad: '无法作为 Hangul 文档读取该文件。',
      encrypted: '该文件有密码或分发保护，无法打开。',
      emptyDoc: '文件已打开，但未找到可读取的文字。'
    }
  };
  var T = STR[lang];

  var $ = function (id) { return document.getElementById(id); };
  function setText(id, v) { $(id).textContent = v; }
  setText('btnOpen', T.open); setText('btnCopy', T.copy);
  setText('btnTxt', T.txt); setText('btnPrint', T.print);
  setText('dropTitle', T.dropTitle); setText('dropBody', T.dropBody);
  setText('limits', 'ℹ️ ' + T.limits);
  setText('privnote', '🔒 ' + T.priv);
  $('backLink').href = (lang === 'en' ? '/tools/' : '/' + lang + '/tools/');

  var docName = '';

  function busy(on, msg) {
    document.body.classList.toggle('busy', !!on);
    if (msg) setText('busyText', msg);
  }
  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* ================= HWP 5.0 (CFB) ================= */
  var CTRL_1CHAR = [0, 10, 13, 24, 25, 26, 27, 28, 29, 30, 31];
  /* 나머지 제어문자(1~9, 11~12, 14~23)는 16바이트(8 wchar)를 차지한다. */

  function isCompressed(fileHeader) {
    if (!fileHeader || fileHeader.length < 40) return false;
    var dv = new DataView(fileHeader.buffer, fileHeader.byteOffset, fileHeader.byteLength);
    return (dv.getUint32(36, true) & 1) === 1;
  }
  function isEncrypted(fileHeader) {
    if (!fileHeader || fileHeader.length < 40) return false;
    var dv = new DataView(fileHeader.buffer, fileHeader.byteOffset, fileHeader.byteLength);
    var flags = dv.getUint32(36, true);
    return ((flags >> 1) & 1) === 1 || ((flags >> 2) & 1) === 1;  // 암호 설정 / 배포용 문서
  }
  function inflateMaybe(u8, compressed) {
    if (!compressed) return u8;
    try { return pako.inflateRaw(u8); } catch (e) {}
    try { return pako.inflate(u8); } catch (e) {}
    return u8;  // 압축 플래그가 틀린 파일도 있으므로 원본으로 시도
  }
  /* PARA_TEXT 페이로드(UTF-16LE + 제어문자)를 사람이 읽는 문자열로. */
  function decodeParaText(u8) {
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    var n = Math.floor(u8.length / 2), out = '';
    for (var i = 0; i < n; i++) {
      var c = dv.getUint16(i * 2, true);
      if (c >= 32) { out += String.fromCharCode(c); continue; }
      if (CTRL_1CHAR.indexOf(c) >= 0) {
        if (c === 10 || c === 13) out += '\n';
        continue;
      }
      if (c === 9) out += '\t';
      i += 7;  /* 확장·인라인 제어문자는 8 wchar 를 차지 */
    }
    return out;
  }
  function parseRecords(u8, onRec) {
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    var off = 0;
    while (off + 4 <= u8.length) {
      var h = dv.getUint32(off, true); off += 4;
      var tag = h & 0x3FF;
      var size = (h >>> 20) & 0xFFF;
      if (size === 0xFFF) {
        if (off + 4 > u8.length) break;
        size = dv.getUint32(off, true); off += 4;
      }
      if (off + size > u8.length) break;
      onRec(tag, u8.subarray(off, off + size));
      off += size;
    }
  }
  function readHwp5(bytes) {
    var cfb = CFB.read(bytes, { type: 'array' });
    var get = function (name) {
      var e = CFB.find(cfb, name);
      return e && e.content ? new Uint8Array(e.content) : null;
    };
    var fh = get('/FileHeader');
    if (!fh) throw new Error('NOHWP');
    var sig = '';
    for (var i = 0; i < 17; i++) sig += String.fromCharCode(fh[i]);
    if (sig !== 'HWP Document File') throw new Error('NOHWP');
    if (isEncrypted(fh)) throw new Error('ENCRYPTED');

    var comp = isCompressed(fh);
    var sections = [];
    /* BodyText/Section0, Section1 … 을 순서대로 */
    for (var s = 0; s < 256; s++) {
      var raw = get('/BodyText/Section' + s);
      if (!raw) break;
      var data = inflateMaybe(raw, comp);
      var paras = [], cur = null;
      parseRecords(data, function (tag, payload) {
        if (tag === 66) { cur = null; }                    /* PARA_HEADER: 새 문단 */
        else if (tag === 67) {                             /* PARA_TEXT */
          var t = decodeParaText(payload);
          if (cur === null) { paras.push(t); cur = paras.length - 1; }
          else paras[cur] += t;
        }
      });
      sections.push({ blocks: paras.map(function (t) { return { type: 'p', text: t }; }) });
    }
    if (!sections.length) {
      /* 본문을 못 읽으면 미리보기 텍스트라도 보여준다 */
      var prv = get('/PrvText');
      if (prv) {
        var txt = new TextDecoder('utf-16le').decode(prv);
        sections.push({ blocks: txt.split(/\r\n|\r|\n/).map(function (t) { return { type: 'p', text: t }; }) });
      }
    }
    return sections;
  }

  /* ================= HWPX (ZIP + OWPML) ================= */
  async function readHwpx(bytes) {
    var zip = await JSZip.loadAsync(bytes);
    var names = Object.keys(zip.files).filter(function (n) {
      return /^Contents\/section\d+\.xml$/i.test(n);
    }).sort(function (a, b) {
      var na = parseInt(a.replace(/\D+/g, ''), 10), nb = parseInt(b.replace(/\D+/g, ''), 10);
      return na - nb;
    });
    if (!names.length) {
      var prv = zip.file(/^Preview\/PrvText\.txt$/i)[0];
      if (!prv) throw new Error('NOHWP');
      var t = await prv.async('string');
      return [{ blocks: t.split(/\r\n|\r|\n/).map(function (x) { return { type: 'p', text: x }; }) }];
    }
    var sections = [];
    for (var i = 0; i < names.length; i++) {
      var xml = await zip.file(names[i]).async('string');
      sections.push({ blocks: parseSectionXml(xml) });
    }
    return sections;
  }
  function local(node) { return (node.localName || node.nodeName || '').replace(/^.*:/, ''); }
  function textOf(node) {
    /* hp:t 노드들을 모아 문단 텍스트로. 줄바꿈(hp:lineBreak)도 반영. */
    var out = '';
    (function walk(n) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 1) {
          var nm = local(c);
          if (nm === 't') out += c.textContent;
          else if (nm === 'lineBreak') out += '\n';
          else if (nm === 'tab') out += '\t';
          else if (nm !== 'tbl') walk(c);
        }
      }
    })(node);
    return out;
  }
  function parseSectionXml(xml) {
    var doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('NOHWP');
    var blocks = [];
    var ps = doc.getElementsByTagNameNS('*', 'p');
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      /* 표 안의 문단은 표를 그릴 때 함께 처리하므로 건너뛴다.
         네임스페이스 때문에 closest() 셀렉터가 안 먹어 조상을 직접 훑는다. */
      var inTable = false;
      for (var a = p.parentNode; a; a = a.parentNode) {
        if (a.nodeType === 1 && local(a) === 'tbl') { inTable = true; break; }
      }
      if (inTable) continue;

      var tbls = p.getElementsByTagNameNS('*', 'tbl');
      var t = textOf(p);
      if (t.trim()) blocks.push({ type: 'p', text: t });
      for (var k = 0; k < tbls.length; k++) blocks.push(readTable(tbls[k]));
    }
    return blocks;
  }
  function readTable(tbl) {
    var rows = [];
    var trs = tbl.getElementsByTagNameNS('*', 'tr');
    for (var r = 0; r < trs.length; r++) {
      var cells = [], tcs = trs[r].getElementsByTagNameNS('*', 'tc');
      for (var c = 0; c < tcs.length; c++) cells.push(textOf(tcs[c]).trim());
      rows.push(cells);
    }
    return { type: 'table', rows: rows };
  }

  /* ================= 렌더링 ================= */
  function render(sections) {
    var host = $('doc');
    host.innerHTML = '';
    var paraCount = 0;
    sections.forEach(function (sec, si) {
      if (sections.length > 1) {
        var h = document.createElement('h2');
        h.className = 'sec'; h.textContent = 'Section ' + (si + 1);
        host.appendChild(h);
      }
      sec.blocks.forEach(function (b) {
        if (b.type === 'table') {
          var tb = document.createElement('table');
          b.rows.forEach(function (row) {
            var tr = document.createElement('tr');
            row.forEach(function (cell) {
              var td = document.createElement('td');
              td.textContent = cell;
              tr.appendChild(td);
            });
            tb.appendChild(tr);
          });
          host.appendChild(tb);
        } else {
          var p = document.createElement('p');
          p.textContent = b.text;
          host.appendChild(p);
          paraCount++;
        }
      });
    });
    $('paper').classList.add('on');
    $('drop').style.display = 'none';
    $('limits').style.display = 'block';
    setText('info', T.info(paraCount, sections.length));
    ['btnCopy', 'btnTxt', 'btnPrint'].forEach(function (id) { $(id).disabled = false; });
    return paraCount;
  }

  async function openFile(file) {
    busy(true, T.working);
    try {
      docName = file.name;
      setText('fname', docName);
      var bytes = new Uint8Array(await file.arrayBuffer());
      var sections;
      var isZip = bytes[0] === 0x50 && bytes[1] === 0x4B;
      var isCfb = bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0;
      if (isZip) sections = await readHwpx(bytes);
      else if (isCfb) sections = readHwp5(bytes);
      else throw new Error('NOHWP');

      var n = render(sections);
      if (!n) alert(T.emptyDoc);
    } catch (e) {
      var m = String(e && e.message || e);
      alert(m === 'ENCRYPTED' ? T.encrypted : (m === 'NOHWP' ? T.bad : T.bad + '\n' + m));
    } finally { busy(false); }
  }

  function plainText() {
    var out = [];
    Array.prototype.forEach.call($('doc').children, function (el) {
      if (el.tagName === 'TABLE') {
        Array.prototype.forEach.call(el.rows, function (r) {
          out.push(Array.prototype.map.call(r.cells, function (c) { return c.textContent; }).join('\t'));
        });
      } else out.push(el.textContent);
    });
    return out.join('\n');
  }

  /* ---------- 버튼 ---------- */
  $('btnOpen').onclick = function () { $('fileInput').click(); };
  $('fileInput').onchange = function (e) {
    var f = e.target.files[0];
    e.target.value = '';
    if (f) openFile(f);
  };
  $('btnCopy').onclick = async function () {
    try { await navigator.clipboard.writeText(plainText()); alert(T.copied); }
    catch (err) { alert(String(err && err.message || err)); }
  };
  $('btnTxt').onclick = function () {
    var name = docName.replace(/\.[^.]+$/, '') || 'document';
    download(new Blob([plainText()], { type: 'text/plain;charset=utf-8' }), name + '.txt');
  };
  $('btnPrint').onclick = function () { window.print(); };

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
    openFile(e.dataTransfer.files[0]);
  });

  /* 자동 검증용 훅 (?test=1). 실제 사용에는 영향이 없다. */
  window.__hwpapp = {
    openUrl: async function (url) {
      var bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
      var isZip = bytes[0] === 0x50 && bytes[1] === 0x4B;
      var sections = isZip ? await readHwpx(bytes) : readHwp5(bytes);
      var n = render(sections);
      return { paras: n, sections: sections.length, text: plainText() };
    },
    text: plainText
  };
})();
