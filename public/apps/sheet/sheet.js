/* MeNew Sheet — 브라우저 안에서만 동작하는 스프레드시트 (SheetJS + x-spreadsheet, 서버 전송 없음) */
(function () {
  'use strict';

  /* ---------- i18n ---------- */
  var LANGS = ['en', 'ko', 'ja', 'es', 'zh'];
  var qs = new URLSearchParams(location.search);
  var lang = qs.get('lang');
  if (LANGS.indexOf(lang) < 0) lang = (navigator.language || 'en').slice(0, 2);
  if (LANGS.indexOf(lang) < 0) lang = 'en';
  var STR = {
    en: { open: 'Open', save: 'Save XLSX', neu: 'New', priv: 'Your file never leaves this browser.', confirmNew: 'Discard current sheet and start new?', unsaved: 'You have unsaved changes.' },
    ko: { open: '열기', save: 'XLSX 저장', neu: '새 문서', priv: '파일은 브라우저 밖으로 나가지 않습니다.', confirmNew: '현재 시트를 버리고 새로 시작할까요?', unsaved: '저장하지 않은 변경사항이 있습니다.' },
    ja: { open: '開く', save: 'XLSX保存', neu: '新規', priv: 'ファイルはブラウザの外に送信されません。', confirmNew: '現在のシートを破棄して新規作成しますか？', unsaved: '未保存の変更があります。' },
    es: { open: 'Abrir', save: 'Guardar XLSX', neu: 'Nuevo', priv: 'Tu archivo nunca sale de este navegador.', confirmNew: '¿Descartar la hoja actual y empezar de nuevo?', unsaved: 'Tienes cambios sin guardar.' },
    zh: { open: '打开', save: '保存 XLSX', neu: '新建', priv: '文件不会离开你的浏览器。', confirmNew: '放弃当前表格并新建？', unsaved: '有未保存的更改。' }
  };
  var T = STR[lang];
  document.getElementById('btnOpen').textContent = T.open;
  document.getElementById('btnSave').textContent = T.save;
  document.getElementById('btnNew').textContent = T.neu;
  document.getElementById('privnote').textContent = '🔒 ' + T.priv;
  var back = document.getElementById('backLink');
  back.href = (lang === 'en' ? '/tools/' : '/' + lang + '/tools/');

  /* ---------- x-spreadsheet 초기화 ---------- */
  var topbarH = 52;
  var xs = x_spreadsheet('#grid', {
    showToolbar: true,
    showGrid: true,
    showBottomBar: true,
    view: {
      height: function () { return window.innerHeight - topbarH; },
      width: function () { return window.innerWidth; }
    },
    row: { len: 200, height: 25 },
    col: { len: 40, width: 100 }
  });
  var dirty = false;
  xs.change(function () { dirty = true; });
  window.addEventListener('resize', function () { xs.reRender(); });
  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = T.unsaved; }
  });

  var currentName = '';
  function setName(n) {
    currentName = n || '';
    document.getElementById('fname').textContent = currentName;
  }

  /* ---------- SheetJS ↔ x-spreadsheet 변환 ---------- */
  function stox(wb) {
    return wb.SheetNames.map(function (name) {
      var ws = wb.Sheets[name];
      var o = { name: name, rows: {}, merges: [], cols: {} };
      if (!ws || !ws['!ref']) return o;
      var range = XLSX.utils.decode_range(ws['!ref']);
      for (var R = range.s.r; R <= range.e.r; ++R) {
        var row = { cells: {} };
        var has = false;
        for (var C = range.s.c; C <= range.e.c; ++C) {
          var cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (!cell) continue;
          var txt;
          if (cell.f) txt = '=' + cell.f;
          else if (cell.w !== undefined) txt = cell.w;
          else if (cell.v !== undefined) txt = String(cell.v);
          else continue;
          row.cells[C] = { text: txt };
          has = true;
        }
        if (has) o.rows[R] = row;
      }
      (ws['!merges'] || []).forEach(function (m) {
        o.merges.push(XLSX.utils.encode_range(m));
        var r0 = m.s.r, c0 = m.s.c;
        if (!o.rows[r0]) o.rows[r0] = { cells: {} };
        if (!o.rows[r0].cells[c0]) o.rows[r0].cells[c0] = { text: '' };
        o.rows[r0].cells[c0].merge = [m.e.r - m.s.r, m.e.c - m.s.c];
      });
      (ws['!cols'] || []).forEach(function (col, i) {
        if (col && col.wpx) o.cols[i] = { width: Math.round(col.wpx) };
      });
      return o;
    });
  }

  function xtos(dataArr) {
    var wb = XLSX.utils.book_new();
    dataArr.forEach(function (data, idx) {
      var ws = {};
      var maxR = 0, maxC = 0, hasCell = false;
      var rows = data.rows || {};
      Object.keys(rows).forEach(function (rk) {
        if (rk === 'len') return;
        var R = parseInt(rk, 10);
        var cells = (rows[rk] && rows[rk].cells) || {};
        Object.keys(cells).forEach(function (ck) {
          var C = parseInt(ck, 10);
          var txt = cells[ck].text;
          if (txt === undefined || txt === null || txt === '') {
            if (!cells[ck].merge) return;
            txt = '';
          }
          var addr = XLSX.utils.encode_cell({ r: R, c: C });
          var cell;
          if (typeof txt === 'string' && txt.charAt(0) === '=') {
            cell = { t: 'n', f: txt.slice(1) };
          } else if (txt !== '' && !isNaN(Number(txt)) && String(txt).trim() !== '') {
            cell = { t: 'n', v: Number(txt) };
          } else {
            cell = { t: 's', v: String(txt) };
          }
          ws[addr] = cell;
          hasCell = true;
          if (R > maxR) maxR = R;
          if (C > maxC) maxC = C;
        });
      });
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
      if (data.merges && data.merges.length) {
        ws['!merges'] = data.merges.map(function (m) { return XLSX.utils.decode_range(m); });
      }
      if (data.cols) {
        var cols = [];
        Object.keys(data.cols).forEach(function (i) {
          if (i === 'len') return;
          cols[parseInt(i, 10)] = { wpx: data.cols[i].width };
        });
        if (cols.length) ws['!cols'] = cols;
      }
      if (!hasCell) ws['!ref'] = 'A1';
      XLSX.utils.book_append_sheet(wb, ws, data.name || ('Sheet' + (idx + 1)));
    });
    return wb;
  }

  /* ---------- 파일 열기/저장 ---------- */
  var fileInput = document.getElementById('fileInput');
  document.getElementById('btnOpen').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    var f = fileInput.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var wb = XLSX.read(e.target.result, { type: 'array', cellStyles: true });
        xs.loadData(stox(wb));
        setName(f.name);
        dirty = false;
      } catch (err) {
        alert('Error: ' + err.message);
      }
      fileInput.value = '';
    };
    reader.readAsArrayBuffer(f);
  });

  function baseName() {
    return (currentName || 'menew-sheet').replace(/\.(xlsx|xls|csv|ods)$/i, '');
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
    var wb = xtos(xs.getData());
    var out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    download(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), baseName() + '.xlsx');
    dirty = false;
  });

  document.getElementById('btnCsv').addEventListener('click', function () {
    var wb = xtos(xs.getData());
    var ws = wb.Sheets[wb.SheetNames[0]];
    var csv = XLSX.utils.sheet_to_csv(ws);
    download(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), baseName() + '.csv');
  });

  document.getElementById('btnNew').addEventListener('click', function () {
    if (dirty && !confirm(T.confirmNew)) return;
    xs.loadData([{ name: 'Sheet1', rows: {} }]);
    setName('');
    dirty = false;
  });

  /* ---------- 헤드리스 검증 훅 (?test=1) ---------- */
  if (qs.get('test') === '1') {
    setTimeout(function () {
      try {
        var demo = [{
          name: 'T', merges: ['A4:B4'],
          rows: {
            0: { cells: { 0: { text: 'item' }, 1: { text: 'price' } } },
            1: { cells: { 0: { text: 'apple' }, 1: { text: '1200' } } },
            2: { cells: { 0: { text: 'sum' }, 1: { text: '=SUM(B2:B2)' } } },
            3: { cells: { 0: { text: 'merged', merge: [0, 1] } } }
          }
        }];
        xs.loadData(demo);
        var wb = xtos(xs.getData());
        var out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        var wb2 = XLSX.read(out, { type: 'array' });
        var ws2 = wb2.Sheets[wb2.SheetNames[0]];
        console.warn('[TEST] ref=' + ws2['!ref'] +
          ' B2=' + JSON.stringify(ws2['B2']) +
          ' B3f=' + (ws2['B3'] && ws2['B3'].f) +
          ' merges=' + JSON.stringify(ws2['!merges']) +
          ' bytes=' + out.byteLength);
        var round = stox(wb2);
        console.warn('[TEST] roundtrip rows=' + Object.keys(round[0].rows).length +
          ' A1=' + round[0].rows[0].cells[0].text);
        console.warn('[TEST] SHEET OK');
      } catch (e) {
        console.warn('[TEST] SHEET FAIL ' + e.message);
      }
    }, 600);
  }
})();
