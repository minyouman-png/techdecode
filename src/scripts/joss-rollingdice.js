// 조스프로젝트1 — 롤링다이스 주문예약 (menewsoft.com/joss/rollingdice/)
//
// ⚠️★이 페이지는 **주문을 하지 않는다.** menewsoft.com 은 GitHub Pages 정적 사이트라
//   서버가 없고, 브라우저에서 남의 도메인(mtgrollingdice.com)에 로그인·주문 요청을
//   보내면 CORS 로 막힌다. 그래서 구조를 이렇게 나눴다:
//
//     이 페이지  →  Firestore(예약 큐)  →  맥의 실행기(reserve_worker.py)  →  롤링다이스
//                ←            결과·화면 캡처            ←
//
//   즉 **맥이 백엔드**다. 이 페이지는 예약을 적어 두고 결과를 보여주는 창구일 뿐이라,
//   예약을 걸어 둔 뒤 브라우저를 꺼도 정해진 시각에 맥이 주문한다.
//   반대로 **맥이 꺼져 있으면 아무 일도 일어나지 않는다** — 그래서 실행기 생존 여부를
//   화면 맨 위에 계속 띄운다(감추면 '예약했으니 되겠지'가 가장 위험하다).
//
// ⚠️`src/` 에 두는 이유는 board.js 와 같다 — Vite 가 내용 해시 붙은 파일명으로 내보내야
//   GitHub Pages 의 10분 캐시가 '새 HTML + 옛 JS' 를 만들지 않는다.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, connectAuthEmulator,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {
  getFirestore, connectFirestoreEmulator, collection, doc, addDoc, updateDoc,
  onSnapshot, query, orderBy, limit, serverTimestamp, getDoc,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDoY2F1m19qae7Jw0TMZ1NmDEI2aYg9I0s',
  authDomain: 'menewsoft-board.firebaseapp.com',
  projectId: 'menewsoft-board',
  storageBucket: 'menewsoft-board.firebasestorage.app',
  messagingSenderId: '784946517867',
  appId: '1:784946517867:web:09f08d5473d376f77e5e2e',
};

// 아이디는 짧게 받고 도메인은 우리가 붙인다 — 사용자가 외울 것은 'dsl' 하나면 된다.
const ID_DOMAIN = '@menewsoft.com';
const RESERVER_UID = 'yQrF5CDdm0RkCla6Kh0a0OIsD6A2';

// 실행기가 30초마다 심장박동을 찍는다. 그 2배 넘게 조용하면 죽은 것으로 본다.
const HEARTBEAT_DEAD_MS = 90 * 1000;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
auth.languageCode = 'ko';
window.__jrReady = true;

/* 자가검증용 에뮬레이터 통로 — board.js 와 같은 이유(구글/실계정 로그인은 자동화가 어렵다). */
const onLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname);
if (onLocalhost && new URLSearchParams(location.search).get('emu') === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  window.__jrEmu = true;
}

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ─────────────────────────── 프리셋 상품 ─────────────────────────── */
// 자유 입력만 두면 주소를 매번 찾아와야 한다. 실제로 쓰는 둘을 미리 넣어 둔다.
const PRESETS = [
  {
    name: '[예약] Origin Booster Pack 1 DP — 120,000원 (본 목표)',
    url: 'https://mtgrollingdice.com/index.php?mode=card&set=XXROLDA&code=AA573',
    titleContains: 'Origin Booster Pack',
    maxPrice: 130000,
  },
  {
    name: '[연습용] The Hobbit Play Booster — 9,500원 (재고 있음)',
    url: 'https://mtgrollingdice.com/index.php?mode=card&set=HOB&code=AA2',
    titleContains: '',
    maxPrice: 12000,
  },
];

/* ─────────────────────────── 시각 다루기 ─────────────────────────── */
// datetime-local 은 타임존이 없는 '벽시계 문자열'이다. 저장은 ISO(UTC 기준)로 하되
// 화면 입출력은 브라우저 로컬 시각으로 맞춘다. 이걸 섞으면 9시간 어긋난 예약이 된다.
function toLocalInput(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
/** 다음 자정(오늘 밤 24:00 = 내일 00:00). '밤 12시에 열린다'가 기본 시나리오다. */
export function nextMidnight(now = new Date()) {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d;
}
function fmt(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '—';
  return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ─────────────────────────── 화면 ─────────────────────────── */
const STATUS_LABEL = {
  pending: '대기', running: '진행 중', done: '완료',
  failed: '실패', canceled: '취소됨',
};

let lastShipTo = '';

function renderWorker(snap) {
  const box = $('workerState');
  const ship = $('shipState');
  if (!box) return;
  const d = snap && snap.exists() ? snap.data() : null;
  const beat = d?.beatAt?.toDate ? d.beatAt.toDate() : null;
  const alive = beat && (Date.now() - beat.getTime()) < HEARTBEAT_DEAD_MS;
  box.className = 'jr-worker ' + (alive ? 'ok' : 'bad');
  box.innerHTML = alive
    ? `<b>실행기 살아 있음</b> — 맥이 예약을 지켜보고 있습니다. (마지막 신호 ${fmt(d.beatAt)})`
    : `<b>실행기가 멎어 있습니다</b> — 지금 예약을 걸어도 <u>주문되지 않습니다</u>.
       맥에서 <code>~/rollingdice-bot/start.command</code> 를 실행하세요.
       ${beat ? `(마지막 신호 ${fmt(d.beatAt)})` : '(신호 기록 없음)'}`;

  lastShipTo = d?.shipTo || '';
  if (ship) {
    const ready = !!d?.shippingReady;
    ship.className = 'jr-worker ' + (ready ? 'ok' : 'bad');
    ship.innerHTML = ready
      ? `<b>배송지</b> ${esc(lastShipTo)} — 맥에 설정된 주소로만 갑니다.`
      : `<b>맥에 배송정보가 없습니다</b> — 주문할 수 없습니다.
         맥의 대시보드(<code>start.command</code> → 설정 탭)에서 입력하세요.`;
  }
}

function resultHtml(r) {
  if (!r) return '';
  const rows = [];
  if (r.message) rows.push(`<p class="jr-msg">${esc(r.message)}</p>`);
  if (r.product) rows.push(`<p class="jr-kv"><b>상품</b> ${esc(r.product)}</p>`);
  if (r.price) rows.push(`<p class="jr-kv"><b>가격</b> ${Number(r.price).toLocaleString()}원</p>`);
  if (r.stock) rows.push(`<p class="jr-kv"><b>재고</b> ${esc(r.stock)}</p>`);
  if (r.total) rows.push(`<p class="jr-kv"><b>결제 예정액</b> ${Number(r.total).toLocaleString()}원</p>`);
  if (r.shipTo) rows.push(`<p class="jr-kv"><b>배송지</b> ${esc(r.shipTo)}</p>`);
  if (r.bank) rows.push(`<p class="jr-bank"><b>입금 계좌</b><br>${esc(r.bank)}</p>`);
  if (Array.isArray(r.logs) && r.logs.length) {
    rows.push(`<details class="jr-logs"><summary>진행 기록 ${r.logs.length}줄</summary><pre>${esc(r.logs.join('\n'))}</pre></details>`);
  }
  // ★'결제창'. 직접결제(무통장입금)에는 카드사 결제 팝업이 없다 — 주문이 확정되고
  //   입금 안내가 뜨는 화면이 곧 결제 화면이라, 맥이 그 화면을 찍어 여기로 보낸다.
  if (r.shot) {
    rows.push(`<figure class="jr-shot"><figcaption>주문 화면 (맥에서 캡처)</figcaption>
      <img alt="주문 결과 화면" src="data:image/jpeg;base64,${r.shot}"></figure>`);
  }
  return rows.join('');
}

function renderList(docs) {
  const box = $('list');
  if (!box) return;
  if (!docs.length) {
    box.innerHTML = '<li class="jr-empty">아직 예약이 없습니다.</li>';
    return;
  }
  box.innerHTML = docs.map(({ id, d }) => {
    const st = d.status || 'pending';
    const kind = d.kind === 'check' ? '상품확인' : (d.mode === 'real' ? '실전 주문' : '연습');
    const when = d.kind === 'check' ? '즉시' : fmt(d.runAt);
    const cancelable = st === 'pending';
    return `<li class="jr-item jr-${esc(st)}">
      <div class="jr-row">
        <span class="jr-badge jr-b-${esc(st)}">${esc(STATUS_LABEL[st] || st)}</span>
        <span class="jr-kind">${esc(kind)}</span>
        <span class="jr-when">${esc(when)}</span>
        ${cancelable ? `<button type="button" class="jr-cancel" data-id="${esc(id)}">취소</button>` : ''}
      </div>
      <div class="jr-url">${esc(d.productUrl || '')}</div>
      ${resultHtml(d.result)}
    </li>`;
  }).join('');
  box.querySelectorAll('.jr-cancel').forEach((b) => {
    b.onclick = async () => {
      if (!confirm('이 예약을 취소할까요?')) return;
      b.disabled = true;
      await updateDoc(doc(db, 'reservations', b.dataset.id), {
        status: 'canceled', updatedAt: serverTimestamp(),
      });
    };
  });
}

function say(msg, bad = false) {
  const el = $('note');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'jr-note' + (bad ? ' bad' : '');
}

/* ─────────────────────────── 예약 만들기 ─────────────────────────── */
// ★★배송정보는 이 페이지에서 다루지 않는다(2026-09-08). 주소를 여기서 정할 수 있게
//   두면 아이디·비밀번호를 아는 사람이 물건을 자기 주소로 보내게 만들 수 있고, 과거
//   예약에 남은 이름·전화·주소가 클라우드에서 그대로 읽힌다. 주소의 유일한 출처는
//   **맥의 config.json** 이고, 이 페이지는 '무엇을 언제' 만 정한다.
//   firestore.rules 가 shipping 필드를 아예 거부하고, 맥 실행기도 읽지 않는다.

export function validate(form) {
  const errs = [];
  if (!/^https:\/\/mtgrollingdice\.com\//.test(form.productUrl)) errs.push('상품 주소가 롤링다이스가 아닙니다.');
  if (!(form.quantity >= 1 && form.quantity <= 20)) errs.push('수량은 1~20 사이여야 합니다.');
  if (!(form.maxPrice > 0)) errs.push('가격 상한을 입력하세요.');
  if (form.kind === 'order' && (!form.runAt || isNaN(new Date(form.runAt)))) {
    errs.push('예약 시각이 올바르지 않습니다.');
  }
  return errs;
}

async function submit(kind) {
  const mode = document.querySelector('input[name=jr_mode]:checked')?.value || 'practice';
  const form = {
    kind,
    mode,
    productUrl: $('f_url').value.trim(),
    titleContains: $('f_title').value.trim(),
    quantity: parseInt($('f_qty').value, 10) || 1,
    maxPrice: parseInt(String($('f_max').value).replace(/[^\d]/g, ''), 10) || 0,
    runAt: $('f_when').value ? new Date($('f_when').value).toISOString() : null,
  };
  const errs = validate(form);
  if (errs.length) { say(errs.join(' '), true); return; }

  if (kind === 'order' && mode === 'real') {
    const when = new Date(form.runAt).toLocaleString('ko-KR');
    if (!confirm(`실전 주문입니다.\n\n${when} 에 재고가 있으면 진짜로 주문합니다.\n`
      + `배송지: ${lastShipTo || '(맥에 설정된 주소)'}\n`
      + `직접결제(무통장입금)라 주문은 확정되고, 입금은 다음날 16시까지입니다.\n\n계속할까요?`)) return;
  }

  const btn = kind === 'check' ? $('b_check') : $('b_reserve');
  btn.disabled = true;
  try {
    await addDoc(collection(db, 'reservations'), {
      ...form,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    say(kind === 'check' ? '상품 확인을 요청했습니다. 맥이 곧 결과를 올립니다.'
                         : '예약했습니다. 시각이 되면 맥이 주문합니다.');
  } catch (e) {
    say('저장 실패: ' + (e?.message || e), true);
  } finally {
    btn.disabled = false;
  }
}

/* ─────────────────────────── 기동 ─────────────────────────── */
let unsubList = null, unsubWorker = null;

function showApp(on) {
  $('gate').hidden = on;
  $('app').hidden = !on;
}

function fillPresets() {
  const sel = $('f_preset');
  sel.innerHTML = PRESETS.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join('')
    + '<option value="custom">직접 입력</option>';
  sel.onchange = () => {
    const v = sel.value;
    if (v === 'custom') return;
    const p = PRESETS[Number(v)];
    $('f_url').value = p.url;
    $('f_title').value = p.titleContains;
    $('f_max').value = p.maxPrice;
  };
  sel.onchange();
}

function boot() {
  fillPresets();
  $('f_when').value = toLocalInput(nextMidnight());
  $('gateForm').onsubmit = async (e) => {
    e.preventDefault();
    const id = $('g_id').value.trim();
    const pw = $('g_pw').value;
    const msg = $('g_msg');
    msg.textContent = '확인 중…';
    try {
      await signInWithEmailAndPassword(auth, id.includes('@') ? id : id + ID_DOMAIN, pw);
      msg.textContent = '';
    } catch (err) {
      msg.textContent = '아이디 또는 비밀번호가 맞지 않습니다.';
    }
  };
  $('b_out').onclick = () => signOut(auth);
  $('b_check').onclick = () => submit('check');
  $('b_reserve').onclick = () => submit('order');
  $('b_midnight').onclick = () => { $('f_when').value = toLocalInput(nextMidnight()); say('예약 시각을 오늘 밤 12시로 맞췄습니다.'); };

  onAuthStateChanged(auth, (user) => {
    const ok = !!user && (user.uid === RESERVER_UID || window.__jrEmu);
    showApp(ok);
    unsubList?.(); unsubWorker?.();
    if (!ok) return;
    unsubWorker = onSnapshot(doc(db, 'workers', 'mac'), renderWorker,
      () => renderWorker(null));
    unsubList = onSnapshot(
      query(collection(db, 'reservations'), orderBy('createdAt', 'desc'), limit(20)),
      (snap) => renderList(snap.docs.map((x) => ({ id: x.id, d: x.data() }))),
      (e) => say('목록을 불러오지 못했습니다: ' + e.message, true));
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
