/* MeNew Write — 브라우저 안에서만 동작하는 문서 편집기.
   열기: mammoth(docx→HTML) / 저장: 자체 OOXML 생성기(JSZip)로 진짜 .docx 생성. 서버 전송 없음. */
(function () {
  'use strict';

  /* ---------- i18n ---------- */
  var LANGS = ['en', 'ko', 'ja', 'es', 'zh'];
  var qs = new URLSearchParams(location.search);
  var lang = qs.get('lang');
  if (LANGS.indexOf(lang) < 0) lang = (navigator.language || 'en').slice(0, 2);
  if (LANGS.indexOf(lang) < 0) lang = 'en';
  var STR = {
    en: { open: 'Open', save: 'Save DOCX', neu: 'New', print: 'Print/PDF', para: 'Paragraph', h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3', priv: 'Your file never leaves this browser.', confirmNew: 'Discard current document?', unsaved: 'You have unsaved changes.', linkUrl: 'Link URL:', tableSize: 'Table size (e.g. 3x3):', start: 'Start writing…' },
    ko: { open: '열기', save: 'DOCX 저장', neu: '새 문서', print: '인쇄/PDF', para: '본문', h1: '제목 1', h2: '제목 2', h3: '제목 3', priv: '파일은 브라우저 밖으로 나가지 않습니다.', confirmNew: '현재 문서를 버릴까요?', unsaved: '저장하지 않은 변경사항이 있습니다.', linkUrl: '링크 주소:', tableSize: '표 크기 (예: 3x3):', start: '여기에 입력하세요…' },
    ja: { open: '開く', save: 'DOCX保存', neu: '新規', print: '印刷/PDF', para: '本文', h1: '見出し1', h2: '見出し2', h3: '見出し3', priv: 'ファイルはブラウザの外に送信されません。', confirmNew: '現在の文書を破棄しますか？', unsaved: '未保存の変更があります。', linkUrl: 'リンクURL:', tableSize: '表のサイズ (例: 3x3):', start: 'ここに入力…' },
    es: { open: 'Abrir', save: 'Guardar DOCX', neu: 'Nuevo', print: 'Imprimir/PDF', para: 'Párrafo', h1: 'Título 1', h2: 'Título 2', h3: 'Título 3', priv: 'Tu archivo nunca sale de este navegador.', confirmNew: '¿Descartar el documento actual?', unsaved: 'Tienes cambios sin guardar.', linkUrl: 'URL del enlace:', tableSize: 'Tamaño de tabla (ej. 3x3):', start: 'Empieza a escribir…' },
    zh: { open: '打开', save: '保存 DOCX', neu: '新建', print: '打印/PDF', priv: '文件不会离开你的浏览器。', para: '正文', h1: '标题 1', h2: '标题 2', h3: '标题 3', confirmNew: '放弃当前文档？', unsaved: '有未保存的更改。', linkUrl: '链接地址:', tableSize: '表格大小 (如 3x3):', start: '开始输入…' }
  };
  var T = STR[lang];
  document.getElementById('btnOpen').textContent = T.open;
  document.getElementById('btnSave').textContent = T.save;
  document.getElementById('btnNew').textContent = T.neu;
  document.getElementById('btnPrint').textContent = T.print;
  document.getElementById('privnote').textContent = '🔒 ' + T.priv;
  document.getElementById('backLink').href = (lang === 'en' ? '/tools/' : '/' + lang + '/tools/');
  var selBlock = document.getElementById('selBlock');
  selBlock.options[0].text = T.para;
  selBlock.options[1].text = T.h1;
  selBlock.options[2].text = T.h2;
  selBlock.options[3].text = T.h3;

  /* ---------- 편집기 ---------- */
  var page = document.getElementById('page');
  document.execCommand('defaultParagraphSeparator', false, 'p');
  page.innerHTML = '<p><br></p>';
  var dirty = false;
  page.addEventListener('input', function () { dirty = true; });
  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = T.unsaved; }
  });

  var currentName = '';
  function setName(n) { currentName = n || ''; document.getElementById('fname').textContent = currentName; }

  document.querySelectorAll('.tb[data-cmd]').forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () {
      page.focus();
      document.execCommand(b.dataset.cmd, false, null);
    });
  });
  selBlock.addEventListener('change', function () {
    page.focus();
    document.execCommand('formatBlock', false, '<' + selBlock.value + '>');
  });
  document.getElementById('foreColor').addEventListener('input', function () {
    page.focus();
    document.execCommand('foreColor', false, this.value);
  });
  document.getElementById('btnLink').addEventListener('click', function () {
    var url = prompt(T.linkUrl, 'https://');
    if (url) { page.focus(); document.execCommand('createLink', false, url); }
  });
  document.getElementById('btnTable').addEventListener('click', function () {
    var s = prompt(T.tableSize, '3x3');
    if (!s) return;
    var m = s.toLowerCase().split(/[x×*]/);
    var rows = Math.min(30, parseInt(m[0], 10) || 3), cols = Math.min(12, parseInt(m[1], 10) || 3);
    var html = '<table>';
    for (var r = 0; r < rows; r++) {
      html += '<tr>';
      for (var c = 0; c < cols; c++) html += '<td><br></td>';
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    page.focus();
    document.execCommand('insertHTML', false, html);
  });
  var imgInput = document.getElementById('imgInput');
  document.getElementById('btnImage').addEventListener('click', function () { imgInput.click(); });
  imgInput.addEventListener('change', function () {
    var f = imgInput.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      page.focus();
      document.execCommand('insertImage', false, e.target.result);
      imgInput.value = '';
    };
    reader.readAsDataURL(f);
  });
  document.getElementById('btnPrint').addEventListener('click', function () { window.print(); });
  document.getElementById('btnNew').addEventListener('click', function () {
    if (dirty && !confirm(T.confirmNew)) return;
    page.innerHTML = '<p><br></p>';
    setName('');
    dirty = false;
  });

  /* ---------- DOCX 열기 (mammoth) ---------- */
  var fileInput = document.getElementById('fileInput');
  document.getElementById('btnOpen').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    var f = fileInput.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      mammoth.convertToHtml({ arrayBuffer: e.target.result })
        .then(function (res) {
          page.innerHTML = res.value || '<p><br></p>';
          setName(f.name);
          dirty = false;
        })
        .catch(function (err) { alert('Error: ' + err.message); });
      fileInput.value = '';
    };
    reader.readAsArrayBuffer(f);
  });

  /* ---------- DOCX 저장: DOM → OOXML ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/ /g, ' ');
  }
  function cssColorToHex(c) {
    if (!c) return null;
    c = c.trim();
    var m = c.match(/^#([0-9a-f]{6})$/i);
    if (m) return m[1].toUpperCase();
    m = c.match(/^#([0-9a-f]{3})$/i);
    if (m) return (m[1][0] + m[1][0] + m[1][1] + m[1][1] + m[1][2] + m[1][2]).toUpperCase();
    m = c.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (m) {
      var h = function (n) { return ('0' + parseInt(n, 10).toString(16)).slice(-2); };
      return (h(m[1]) + h(m[2]) + h(m[3])).toUpperCase();
    }
    return null;
  }

  function buildDocx(root) {
    var rels = [];      // {id, type, target, mode?}
    var media = [];     // {name, data(base64), ext}
    var numInstances = []; // abstract id per instance (0=bullet, 1=decimal)
    var relIdSeq = 10;

    function newRel(type, target, external) {
      var id = 'rId' + (relIdSeq++);
      rels.push({ id: id, type: type, target: target, mode: external ? ' TargetMode="External"' : '' });
      return id;
    }
    function addImage(src, el) {
      var m = /^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/i.exec(src);
      if (!m) return '';
      var ext = m[1].toLowerCase() === 'jpg' ? 'jpeg' : m[1].toLowerCase();
      var name = 'image' + (media.length + 1) + '.' + ext;
      media.push({ name: name, data: m[2], ext: ext });
      var rid = newRel('http://schemas.openxmlformats.org/officeDocument/2006/relationships/image', 'media/' + name);
      var w = el.naturalWidth || 300, h = el.naturalHeight || 200;
      var rect = el.getBoundingClientRect();
      var dispW = Math.min(rect.width || w, 620);
      var dispH = dispW * (h / w);
      var cx = Math.round(dispW * 9525), cy = Math.round(dispH * 9525);
      var did = media.length;
      return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">' +
        '<wp:extent cx="' + cx + '" cy="' + cy + '"/>' +
        '<wp:docPr id="' + did + '" name="Picture ' + did + '"/>' +
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
        '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
        '<pic:nvPicPr><pic:cNvPr id="' + did + '" name="Picture ' + did + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
        '<pic:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>' +
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
        '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    }

    function runProps(f) {
      var p = '';
      if (f.bold) p += '<w:b/>';
      if (f.italic) p += '<w:i/>';
      if (f.strike) p += '<w:strike/>';
      if (f.underline) p += '<w:u w:val="single"/>';
      if (f.color) p += '<w:color w:val="' + f.color + '"/>';
      if (f.size) p += '<w:sz w:val="' + f.size + '"/><w:szCs w:val="' + f.size + '"/>';
      return p ? '<w:rPr>' + p + '</w:rPr>' : '';
    }

    // 인라인 노드들 → w:r 시퀀스
    function runsFromInline(node, f) {
      var out = '';
      if (node.nodeType === 3) {
        var txt = node.nodeValue;
        if (!txt) return '';
        return '<w:r>' + runProps(f) + '<w:t xml:space="preserve">' + esc(txt) + '</w:t></w:r>';
      }
      if (node.nodeType !== 1) return '';
      var tag = node.tagName.toLowerCase();
      if (tag === 'br') return '<w:r>' + runProps(f) + '<w:br/></w:r>';
      if (tag === 'img') return addImage(node.getAttribute('src') || '', node);
      var nf = {
        bold: f.bold, italic: f.italic, underline: f.underline, strike: f.strike,
        color: f.color, size: f.size
      };
      if (tag === 'b' || tag === 'strong') nf.bold = true;
      if (tag === 'i' || tag === 'em') nf.italic = true;
      if (tag === 'u') nf.underline = true;
      if (tag === 's' || tag === 'strike' || tag === 'del') nf.strike = true;
      if (node.style) {
        if (/bold|[6-9]00/.test(node.style.fontWeight)) nf.bold = true;
        if (node.style.fontStyle === 'italic') nf.italic = true;
        if (/underline/.test(node.style.textDecoration || '')) nf.underline = true;
        if (/line-through/.test(node.style.textDecoration || '')) nf.strike = true;
        var col = cssColorToHex(node.style.color);
        if (col) nf.color = col;
        var fs = node.style.fontSize;
        if (fs && /px$/.test(fs)) nf.size = Math.round(parseFloat(fs) * 0.75 * 2);
        if (fs && /pt$/.test(fs)) nf.size = Math.round(parseFloat(fs) * 2);
      }
      if (tag === 'font' && node.getAttribute('color')) {
        var fc = cssColorToHex(node.getAttribute('color'));
        if (fc) nf.color = fc;
      }
      if (tag === 'a' && node.getAttribute('href')) {
        var rid = newRel('http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', node.getAttribute('href'), true);
        var inner = '';
        node.childNodes.forEach(function (c) {
          inner += runsFromInline(c, { bold: nf.bold, italic: nf.italic, underline: true, strike: nf.strike, color: '0563C1', size: nf.size });
        });
        return '<w:hyperlink r:id="' + rid + '">' + inner + '</w:hyperlink>';
      }
      node.childNodes.forEach(function (c) { out += runsFromInline(c, nf); });
      return out;
    }

    function paraProps(el, opts) {
      var p = '';
      if (opts && opts.style) p += '<w:pStyle w:val="' + opts.style + '"/>';
      if (opts && opts.numId !== undefined) {
        p += '<w:numPr><w:ilvl w:val="' + opts.ilvl + '"/><w:numId w:val="' + opts.numId + '"/></w:numPr>';
      }
      if (opts && opts.indent) p += '<w:ind w:left="720"/>';
      var align = el && el.style ? el.style.textAlign : '';
      if (!align && el && el.getAttribute) align = el.getAttribute('align') || '';
      if (align === 'center') p += '<w:jc w:val="center"/>';
      else if (align === 'right') p += '<w:jc w:val="right"/>';
      else if (align === 'justify') p += '<w:jc w:val="both"/>';
      return p ? '<w:pPr>' + p + '</w:pPr>' : '';
    }

    function paragraph(el, opts) {
      var runs = '';
      el.childNodes.forEach(function (c) { runs += runsFromInline(c, {}); });
      return '<w:p>' + paraProps(el, opts) + runs + '</w:p>';
    }

    function listToXml(listEl, numId, ilvl) {
      var out = '';
      Array.prototype.forEach.call(listEl.children, function (li) {
        if (li.tagName.toLowerCase() !== 'li') return;
        // li 안의 인라인 내용은 numPr 문단으로, 중첩 리스트는 재귀로
        var inlineWrap = document.createElement('span');
        var nested = [];
        Array.prototype.forEach.call(li.childNodes, function (c) {
          var t = c.nodeType === 1 ? c.tagName.toLowerCase() : '';
          if (t === 'ul' || t === 'ol') nested.push(c);
          else inlineWrap.appendChild(c.cloneNode(true));
        });
        var runs = '';
        inlineWrap.childNodes.forEach(function (c) { runs += runsFromInline(c, {}); });
        out += '<w:p><w:pPr><w:numPr><w:ilvl w:val="' + ilvl + '"/><w:numId w:val="' + numId + '"/></w:numPr></w:pPr>' + runs + '</w:p>';
        nested.forEach(function (n) { out += listToXml(n, numId, Math.min(ilvl + 1, 4)); });
      });
      return out;
    }

    function tableToXml(tbl) {
      var rows = tbl.querySelectorAll(':scope > tr, :scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr');
      if (!rows.length) return '';
      var maxCols = 0;
      rows.forEach(function (tr) {
        var n = 0;
        Array.prototype.forEach.call(tr.children, function (td) { n += (parseInt(td.getAttribute('colspan'), 10) || 1); });
        if (n > maxCols) maxCols = n;
      });
      if (!maxCols) return '';
      var colW = Math.floor(9026 / maxCols);
      var xml = '<w:tbl><w:tblPr><w:tblW w:w="9026" w:type="dxa"/>' +
        '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/>' +
        '<w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/>' +
        '<w:insideH w:val="single" w:sz="4" w:color="999999"/><w:insideV w:val="single" w:sz="4" w:color="999999"/></w:tblBorders></w:tblPr>' +
        '<w:tblGrid>';
      for (var i = 0; i < maxCols; i++) xml += '<w:gridCol w:w="' + colW + '"/>';
      xml += '</w:tblGrid>';
      rows.forEach(function (tr) {
        xml += '<w:tr>';
        Array.prototype.forEach.call(tr.children, function (td) {
          var span = parseInt(td.getAttribute('colspan'), 10) || 1;
          var isTh = td.tagName.toLowerCase() === 'th';
          xml += '<w:tc><w:tcPr><w:tcW w:w="' + (colW * span) + '" w:type="dxa"/>' +
            (span > 1 ? '<w:gridSpan w:val="' + span + '"/>' : '') + '</w:tcPr>';
          // 셀 내부: 블록이 없으면 통째로 한 문단
          var blocks = Array.prototype.filter.call(td.childNodes, function (c) {
            return c.nodeType === 1 && /^(p|h[1-6]|ul|ol|table|div|blockquote)$/i.test(c.tagName);
          });
          if (blocks.length) {
            var cellXml = '';
            Array.prototype.forEach.call(td.childNodes, function (c) { cellXml += blockToXml(c); });
            if (!/<w:p[ >]/.test(cellXml)) cellXml += '<w:p/>';
            xml += cellXml;
          } else {
            var runs = '';
            td.childNodes.forEach(function (c) { runs += runsFromInline(c, isTh ? { bold: true } : {}); });
            xml += '<w:p>' + (isTh ? '<w:pPr><w:jc w:val="center"/></w:pPr>' : '') + runs + '</w:p>';
          }
          xml += '</w:tc>';
        });
        xml += '</w:tr>';
      });
      xml += '</w:tbl>';
      return xml;
    }

    function blockToXml(node) {
      if (node.nodeType === 3) {
        if (!node.nodeValue.trim()) return '';
        return '<w:p><w:r><w:t xml:space="preserve">' + esc(node.nodeValue) + '</w:t></w:r></w:p>';
      }
      if (node.nodeType !== 1) return '';
      var tag = node.tagName.toLowerCase();
      switch (tag) {
        case 'h1': return paragraph(node, { style: 'Heading1' });
        case 'h2': return paragraph(node, { style: 'Heading2' });
        case 'h3': case 'h4': return paragraph(node, { style: 'Heading3' });
        case 'p': case 'div': return paragraph(node, {});
        case 'blockquote': {
          var out = '';
          Array.prototype.forEach.call(node.childNodes, function (c) {
            if (c.nodeType === 1 && /^(p|div)$/i.test(c.tagName)) out += paragraph(c, { indent: true });
          });
          if (!out) out = paragraph(node, { indent: true });
          return out;
        }
        case 'ul': case 'ol': {
          var abstract = tag === 'ul' ? 0 : 1;
          numInstances.push(abstract);
          var numId = numInstances.length;
          return listToXml(node, numId, 0);
        }
        case 'table': return tableToXml(node);
        case 'hr': return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:color="999999"/></w:pBdr></w:pPr></w:p>';
        case 'img': return '<w:p>' + addImage(node.getAttribute('src') || '', node) + '</w:p>';
        default: return paragraph(node, {});
      }
    }

    var body = '';
    Array.prototype.forEach.call(root.childNodes, function (n) { body += blockToXml(n); });
    if (!body) body = '<w:p/>';
    body += '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';

    var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">' +
      '<w:body>' + body + '</w:body></w:document>';

    var stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:docDefaults><w:rPrDefault><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault>' +
      '<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/>' +
      '<w:pPr><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr>' +
      '<w:rPr><w:b/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/>' +
      '<w:pPr><w:spacing w:before="200" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr>' +
      '<w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/>' +
      '<w:pPr><w:spacing w:before="160" w:after="80"/><w:outlineLvl w:val="2"/></w:pPr>' +
      '<w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style></w:styles>';

    var bulletChars = ['•', '◦', '▪', '•', '◦'];
    var abstractBullet = '<w:abstractNum w:abstractNumId="0">';
    var abstractDecimal = '<w:abstractNum w:abstractNumId="1">';
    for (var lv = 0; lv < 5; lv++) {
      var ind = 720 * (lv + 1);
      abstractBullet += '<w:lvl w:ilvl="' + lv + '"><w:start w:val="1"/><w:numFmt w:val="bullet"/>' +
        '<w:lvlText w:val="' + bulletChars[lv] + '"/><w:lvlJc w:val="left"/>' +
        '<w:pPr><w:ind w:left="' + ind + '" w:hanging="360"/></w:pPr>' +
        '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:hint="default"/></w:rPr></w:lvl>';
      abstractDecimal += '<w:lvl w:ilvl="' + lv + '"><w:start w:val="1"/><w:numFmt w:val="decimal"/>' +
        '<w:lvlText w:val="%' + (lv + 1) + '."/><w:lvlJc w:val="left"/>' +
        '<w:pPr><w:ind w:left="' + ind + '" w:hanging="360"/></w:pPr></w:lvl>';
    }
    abstractBullet += '</w:abstractNum>';
    abstractDecimal += '</w:abstractNum>';
    var numsXml = '';
    numInstances.forEach(function (abs, i) {
      numsXml += '<w:num w:numId="' + (i + 1) + '"><w:abstractNumId w:val="' + abs + '"/></w:num>';
    });
    var numberingXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      abstractBullet + abstractDecimal + numsXml + '</w:numbering>';

    var relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
      rels.map(function (r) {
        return '<Relationship Id="' + r.id + '" Type="' + r.type + '" Target="' + esc(r.target) + '"' + r.mode + '/>';
      }).join('') +
      '</Relationships>';

    var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>';

    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Default Extension="png" ContentType="image/png"/>' +
      '<Default Extension="jpeg" ContentType="image/jpeg"/>' +
      '<Default Extension="gif" ContentType="image/gif"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
      '</Types>';

    var zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypes);
    zip.file('_rels/.rels', rootRels);
    zip.file('word/document.xml', documentXml);
    zip.file('word/styles.xml', stylesXml);
    zip.file('word/numbering.xml', numberingXml);
    zip.file('word/_rels/document.xml.rels', relsXml);
    media.forEach(function (mfile) {
      zip.file('word/media/' + mfile.name, mfile.data, { base64: true });
    });
    return zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  }

  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  document.getElementById('btnSave').addEventListener('click', function () {
    var name = (currentName || 'menew-write').replace(/\.docx$/i, '') + '.docx';
    buildDocx(page).then(function (blob) {
      download(blob, name);
      dirty = false;
    }).catch(function (e) { alert('Error: ' + e.message); });
  });

  /* ---------- 헤드리스 UI 검증 훅 (?test=ui): 툴바 기본 동작 검증 ---------- */
  if (qs.get('test') === 'ui') {
    setTimeout(function () {
      var results = {};
      function selectAllOf(node) {
        var r = document.createRange();
        r.selectNodeContents(node);
        var s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
      }
      function caretEnd() {
        var r = document.createRange();
        r.selectNodeContents(page);
        r.collapse(false);
        var s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
      }
      try {
        page.innerHTML = '<p>hello world</p>';
        page.focus();
        // 굵게
        selectAllOf(page.firstChild);
        document.querySelector('.tb[data-cmd="bold"]').click();
        results.bold = /<(b|strong)\b/i.test(page.innerHTML);
        // 제목1
        selectAllOf(page.firstChild);
        selBlock.value = 'h1';
        selBlock.dispatchEvent(new Event('change'));
        results.h1 = /<h1\b/i.test(page.innerHTML);
        // 글자색
        selectAllOf(page.querySelector('h1') || page.firstChild);
        var fc = document.getElementById('foreColor');
        fc.value = '#cc0000';
        fc.dispatchEvent(new Event('input'));
        results.color = /color/i.test(page.innerHTML);
        // 목록
        caretEnd();
        document.execCommand('insertParagraph');
        document.execCommand('insertText', false, '항목');
        document.querySelector('.tb[data-cmd="insertUnorderedList"]').click();
        results.list = /<ul\b/i.test(page.innerHTML);
        // 표 (prompt 스텁)
        caretEnd();
        var oldPrompt = window.prompt;
        window.prompt = function () { return '2x2'; };
        document.getElementById('btnTable').click();
        window.prompt = oldPrompt;
        results.table = (page.querySelectorAll('table tr').length === 2 && page.querySelectorAll('table td').length === 4);
        // 가운데 정렬
        selectAllOf(page.querySelector('h1') || page.firstChild);
        document.querySelector('.tb[data-cmd="justifyCenter"]').click();
        results.center = /text-align:\s*center/i.test(page.innerHTML);
        // 실행취소 동작 여부
        results.undo = document.queryCommandSupported('undo');
        var fails = Object.keys(results).filter(function (k) { return !results[k]; });
        console.warn('[TEST] ui=' + JSON.stringify(results));
        console.warn(fails.length ? '[TEST] WRITE-UI FAIL ' + fails.join(',') : '[TEST] WRITE-UI OK');
      } catch (e) {
        console.warn('[TEST] WRITE-UI FAIL ' + e.message);
      }
    }, 600);
  }

  /* ---------- 헤드리스 검증 훅 (?test=1) ---------- */
  if (qs.get('test') === '1') {
    setTimeout(function () {
      var PNG1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      page.innerHTML = '<h1>제목입니다</h1><p>본문 <b>굵게</b> <i>기울임</i> <u>밑줄</u> <span style="color: rgb(200, 30, 30);">빨강</span></p>' +
        '<ul><li>항목1</li><li>항목2<ul><li>중첩</li></ul></li></ul>' +
        '<ol><li>첫째</li><li>둘째</li></ol>' +
        '<table><tr><th>a</th><th>b</th></tr><tr><td>1</td><td>2</td></tr></table>' +
        '<p style="text-align: center;">가운데</p>' +
        '<p><a href="https://menewsoft.com">링크</a></p>' +
        '<p><img src="' + PNG1 + '"></p>';
      buildDocx(page).then(function (blob) {
        return JSZip.loadAsync(blob).then(function (z) {
          return z.file('word/document.xml').async('string').then(function (doc) {
            var checks = {
              heading: doc.indexOf('Heading1') > -1,
              bold: doc.indexOf('<w:b/>') > -1,
              color: doc.indexOf('C81E1E') > -1,
              numPr: doc.indexOf('<w:numPr>') > -1,
              ilvl1: doc.indexOf('<w:ilvl w:val="1"/>') > -1,
              tbl: doc.indexOf('<w:tbl>') > -1,
              jc: doc.indexOf('<w:jc w:val="center"/>') > -1,
              link: doc.indexOf('<w:hyperlink') > -1,
              img: doc.indexOf('<w:drawing>') > -1,
              media: !!z.file('word/media/image1.png')
            };
            var parsed = new DOMParser().parseFromString(doc, 'application/xml');
            checks.xmlValid = !parsed.querySelector('parsererror');
            var fails = Object.keys(checks).filter(function (k) { return !checks[k]; });
            console.warn('[TEST] docx bytes=' + blob.size + ' checks=' + JSON.stringify(checks));
            return blob.arrayBuffer().then(function (buf) {
              return mammoth.convertToHtml({ arrayBuffer: buf });
            }).then(function (res) {
              var html = res.value;
              var round = {
                h1: /<h1>제목입니다<\/h1>/.test(html),
                bold: /<strong>굵게<\/strong>/.test(html),
                list: /<li>항목1/.test(html),
                table: /<table>/.test(html) && /<td>.*2.*<\/td>/.test(html.replace(/<p>|<\/p>/g, '')),
                link: html.indexOf('https://menewsoft.com') > -1,
                img: html.indexOf('<img') > -1
              };
              var rfails = Object.keys(round).filter(function (k) { return !round[k]; });
              console.warn('[TEST] mammoth roundtrip=' + JSON.stringify(round));
              console.warn((fails.length || rfails.length) ? '[TEST] WRITE FAIL ' + fails.concat(rfails).join(',') : '[TEST] WRITE OK');
            });
          });
        });
      }).catch(function (e) { console.warn('[TEST] WRITE FAIL ' + e.message); });
    }, 600);
  }
})();
