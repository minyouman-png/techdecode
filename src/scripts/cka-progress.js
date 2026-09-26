// CKA 학습 진도 — 이 브라우저(localStorage)에만 저장한다. 서버로 보내지 않는다.
// (학습 코너의 다른 진도와 같은 원칙. 로그인이 없으니 기기를 바꾸면 처음부터다 — 페이지에 적어 둔다.)
const KEY = 'menew_cka_v1';

function blank() { return { lessons: {}, quiz: {}, labs: {}, exams: [] }; }
export function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return v && typeof v === 'object' ? { ...blank(), ...v } : blank();
  } catch { return blank(); }
}
export function save(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* 사생활 보호 모드 등 — 진도만 안 남는다 */ }
}
export function update(fn) { const p = load(); fn(p); save(p); return p; }
export function markLesson(slug) { return update((p) => { p.lessons[slug] = Date.now(); }); }
export function saveQuiz(slug, got, total) { return update((p) => { const prev = p.quiz[slug]; if (!prev || got >= prev.got) p.quiz[slug] = { got, total }; }); }
export function saveLab(id, ratio) { return update((p) => { p.labs[id] = Math.max(p.labs[id] || 0, ratio); }); }
export function saveExam(rec) { return update((p) => { p.exams.push(rec); p.exams = p.exams.slice(-20); }); }
export function reset() { save(blank()); }

// 과제 지시문 서식: `코드`, **굵게**, 목록(- / 1.), 줄바꿈. 먼저 이스케이프한다.
export function fmt(text) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const out = [];
  let list = null;
  for (const line of String(text).split('\n')) {
    const m = line.match(/^\s*(?:[-•]|(\d+)\.)\s+(.*)$/);
    if (m) {
      const tag = m[1] ? 'ol' : 'ul';
      const indent = /^\s{2,}/.test(line);
      if (!list || list.tag !== tag) { if (list) out.push(`</${list.tag}>`); list = { tag }; out.push(`<${tag}>`); }
      out.push(`<li${indent ? ' class="sub"' : ''}>${inline(m[2])}</li>`);
      continue;
    }
    if (list) { out.push(`</${list.tag}>`); list = null; }
    if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  if (list) out.push(`</${list.tag}>`);
  return out.join('');
}
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
