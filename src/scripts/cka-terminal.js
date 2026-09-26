// 브라우저 터미널 — 실습실과 모의고사가 같이 쓴다.
// 세션(Session)에 한 줄씩 넘기고 출력을 그린다. vi / kubectl edit 은 편집기 창을 띄운다.
//
// ⚠️모바일에서도 쓸 수 있어야 한다: 입력칸은 진짜 <input>(가상 키보드가 뜨도록),
//   Tab 자동완성은 버튼으로도 제공한다.
import { esc } from './cka-progress.js';

export class Terminal {
  constructor(root, { onRun } = {}) {
    this.root = root;
    this.onRun = onRun || (() => {});
    this.hist = [];
    this.hi = 0;
    root.classList.add('term');
    root.innerHTML = `
      <div class="term-out" role="log" aria-live="polite"></div>
      <form class="term-in" autocomplete="off">
        <span class="term-ps"></span>
        <input class="term-input" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="명령 입력" enterkeyhint="send">
        <button type="button" class="term-hist" title="이전 명령(↑)" aria-label="이전 명령">↑</button>
        <button type="button" class="term-tab" title="자동완성(Tab)" aria-label="자동완성">⇥</button>
      </form>
      <div class="term-ed" hidden>
        <div class="term-ed-bar"><span class="term-ed-name"></span>
          <span class="term-ed-keys">저장 Ctrl+S · 닫기 Esc</span>
          <button type="button" class="term-ed-save">저장</button><button type="button" class="term-ed-cancel">취소</button></div>
        <textarea class="term-ed-text" spellcheck="false" autocapitalize="off" autocorrect="off" wrap="off"></textarea>
      </div>`;
    this.out = root.querySelector('.term-out');
    this.input = root.querySelector('.term-input');
    this.ps = root.querySelector('.term-ps');
    this.ed = root.querySelector('.term-ed');
    this.edText = root.querySelector('.term-ed-text');
    this.edName = root.querySelector('.term-ed-name');
    root.querySelector('.term-in').addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
    root.querySelector('.term-tab').addEventListener('click', () => { this.complete(); this.input.focus(); });
    // 태블릿 가상 키보드엔 ↑ 키가 없다 — 이전 명령 부르기를 버튼으로도
    root.querySelector('.term-hist').addEventListener('click', () => { if (this.hi > 0) { this.hi--; this.input.value = this.hist[this.hi]; } this.input.focus(); });
    this.input.addEventListener('keydown', (e) => this.key(e));
    this.input.addEventListener('paste', (e) => {
      const t = (e.clipboardData || window.clipboardData).getData('text');
      if (t && t.includes('\n')) { e.preventDefault(); this.runLines((this.input.value + t).split('\n')); this.input.value = ''; }
    });
    this.out.addEventListener('click', () => { if (!window.getSelection().toString()) this.input.focus(); });
    root.querySelector('.term-ed-save').addEventListener('click', () => this.edSave());
    root.querySelector('.term-ed-cancel').addEventListener('click', () => this.edClose(true));
    this.edText.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); this.edSave(); }
      else if (e.key === 'Escape') { e.preventDefault(); this.edClose(true); }
      else if (e.key === 'Tab') { e.preventDefault(); this.insertAtCursor('  '); }
    });
  }

  setSession(s, banner) {
    this.s = s;
    this.out.innerHTML = '';
    if (banner) this.print(banner, 'dim');
    this.prompt();
    this.edClose(null); // ⚠️null = 포커스 옮기지 않음 — 태블릿에서 페이지를 열자마자 가상 키보드가 튀어나왔다
  }
  prompt() { this.ps.textContent = this.s ? this.s.prompt() : '$ '; }
  print(text, cls = '') {
    if (text === undefined || text === null || text === '') return;
    const d = document.createElement('div');
    d.className = 'tl ' + cls;
    d.textContent = text;
    this.out.appendChild(d);
    while (this.out.childNodes.length > 1500) this.out.removeChild(this.out.firstChild);
    this.out.scrollTop = this.out.scrollHeight;
  }
  focus() { this.input.focus({ preventScroll: true }); }

  /** 한 줄 실행(사용자 입력·붙여넣기·'터미널로 보내기' 공통) */
  run(line) {
    if (!this.s) return null;
    const d = document.createElement('div');
    d.className = 'tl cmd';
    d.innerHTML = `<span class="p">${esc(this.s.prompt())}</span>${esc(line)}`;
    this.out.appendChild(d);
    if (line.trim()) { this.hist.push(line); this.hi = this.hist.length; }
    let r;
    try { r = this.s.run(line); } catch (err) { r = { out: '', err: `(시뮬레이터 내부 오류) ${err.message}` }; console.error(err); }
    if (r.clear) this.out.innerHTML = '';
    this.print(r.out);
    this.print(r.err, 'err');
    this.prompt();
    this.out.scrollTop = this.out.scrollHeight;
    if (r.edit) this.edOpen(r.edit);
    this.onRun(line, r);
    return r;
  }
  runLines(lines) { for (const l of lines) this.run(l); }
  submit() { const v = this.input.value; this.input.value = ''; this.run(v); }

  key(e) {
    if (e.key === 'ArrowUp') { if (this.hi > 0) { this.hi--; this.input.value = this.hist[this.hi]; } e.preventDefault(); }
    else if (e.key === 'ArrowDown') { if (this.hi < this.hist.length) { this.hi++; this.input.value = this.hist[this.hi] || ''; } e.preventDefault(); }
    else if (e.key === 'Tab') { e.preventDefault(); this.complete(); }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); this.out.innerHTML = ''; }
    else if (e.key === 'c' && e.ctrlKey && !window.getSelection().toString()) { e.preventDefault(); this.print(this.s.prompt() + this.input.value + '^C', 'cmd'); this.input.value = ''; }
  }
  complete() {
    if (!this.s) return;
    const v = this.input.value;
    const c = this.s.complete(v);
    if (!c.length) return;
    const toks = v.split(/\s+/);
    const cur = toks[toks.length - 1] || '';
    let common = c[0];
    for (const x of c) { let i = 0; while (i < common.length && x[i] === common[i]) i++; common = common.slice(0, i); }
    if (c.length === 1) { toks[toks.length - 1] = c[0] + (c[0].endsWith('/') ? '' : ' '); this.input.value = toks.join(' '); }
    else if (common.length > cur.length) { toks[toks.length - 1] = common; this.input.value = toks.join(' '); }
    else this.print(c.slice(0, 60).join('   '), 'dim');
  }

  // ── 편집기 ──
  edOpen(edit) {
    this.edit = edit;
    this.edName.textContent = edit.path + (edit.isNew ? ' [새 파일]' : '');
    this.edText.value = edit.content;
    this.ed.hidden = false;
    this.edText.focus();
    this.edText.setSelectionRange(0, 0);
    this.edText.scrollTop = 0;
  }
  edSave() {
    if (!this.edit) return;
    const r = this.edit.save(this.edText.value);
    this.print(r.out);
    this.print(r.err, 'err');
    this.edClose(false);
    this.onRun('(편집기 저장)', r);
  }
  edClose(cancelled) {
    if (cancelled && this.edit) this.print(this.edit.path.startsWith('/tmp/kubectl-edit') ? 'Edit cancelled, no changes made.' : '(저장하지 않고 닫음)', 'dim');
    this.edit = null;
    this.ed.hidden = true;
    this.prompt();
    if (cancelled !== null && !matchMedia('(pointer: coarse)').matches) this.focus();
  }
  insertAtCursor(t) {
    const el = this.edText, s = el.selectionStart, e = el.selectionEnd;
    el.value = el.value.slice(0, s) + t + el.value.slice(e);
    el.selectionStart = el.selectionEnd = s + t.length;
  }
}

export const TERM_CSS = `
.term{position:relative;display:flex;flex-direction:column;background:#0d1117;color:#d6deeb;border-radius:10px;border:1px solid #232a36;font:13.5px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,"D2Coding","Noto Sans Mono CJK KR",monospace;min-height:320px;overflow:hidden}
.term-out{flex:1;overflow:auto;padding:12px 14px 4px;white-space:pre-wrap;word-break:break-all;overflow-wrap:anywhere}
.term .tl{min-height:1.5em}.term .tl.cmd{color:#e6edf3;margin-top:4px}.term .tl.cmd .p{color:#7ee787}
.term .tl.err{color:#ff9e9e}.term .tl.dim{color:#8b98a9}
.term-in{display:flex;align-items:center;gap:6px;padding:6px 10px 10px 14px;border-top:1px solid #1b2230}
.term-ps{color:#7ee787;white-space:nowrap;max-width:45%;overflow:hidden;text-overflow:ellipsis}
.term-input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#e6edf3;font:inherit;caret-color:#7ee787;padding:4px 0}
.term-tab,.term-hist{background:#1b2230;color:#9fb0c3;border:1px solid #2b3445;border-radius:6px;padding:2px 9px;font:inherit;cursor:pointer}
/* ⚠️터치 기기: iOS 사파리는 16px 미만 입력칸을 누르면 화면을 확대한다 → 입력칸·편집기는 16px, 누를 곳은 손가락 크기로 */
@media (pointer: coarse){.term-input,.term-ed-text{font-size:16px}.term-tab,.term-hist{min-width:44px;min-height:40px;font-size:16px}.term-ed-bar button{min-height:40px;padding:6px 16px;font-size:15px}.term-ed-keys{display:none}}
.term-ed{position:absolute;inset:0;display:flex;flex-direction:column;background:#0b0f15;z-index:3}
.term-ed[hidden]{display:none}
.term-ed-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;background:#161b22;border-bottom:1px solid #232a36;color:#c9d1d9}
.term-ed-name{font-weight:700;color:#79c0ff;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.term-ed-keys{color:#8b98a9;font-size:12px}
.term-ed-bar button{font:inherit;font-size:12.5px;border-radius:6px;padding:3px 12px;cursor:pointer;border:1px solid #2b3445;background:#1b2230;color:#e6edf3}
.term-ed-bar .term-ed-save{background:#238636;border-color:#2ea043}
.term-ed-text{flex:1;resize:none;border:0;outline:0;background:#0b0f15;color:#e6edf3;font:inherit;padding:12px 14px;tab-size:2;white-space:pre;overflow:auto}
`;
