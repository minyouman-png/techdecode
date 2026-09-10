// menewsoft.com 게시판 — Firebase 초기화 + 목록/글/댓글 공용 함수.
//
// ⚠️★`public/` 이 아니라 `src/` 에 둔다 — Astro(Vite)가 **내용 해시가 붙은 파일명**
//   (`/_astro/board.<해시>.js`)으로 내보내게 하려는 것이다.
//   처음엔 public/js/board.js 였는데, 그 주소는 고정인 데다 GitHub Pages 가 `max-age=600`
//   을 걸어서 **배포 직후 최대 10분간 '새 HTML + 캐시된 옛 JS'** 조합이 만들어졌다.
//   모듈 import 는 없는 export 하나에도 스크립트 전체가 죽으므로 게시판이 통째로 백지가 된다
//   (2026-08-28 카테고리 배포 때 실측). 해시가 붙으면 내용이 바뀔 때 주소도 바뀌어 이 창이 없다.
//   아래 `https://www.gstatic.com/...` 원격 import 는 Vite 가 번들에 넣지 않고 그대로 둔다(확인함).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged, connectAuthEmulator,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {
  getFirestore, connectFirestoreEmulator,
  collection, doc, addDoc, setDoc, getDoc, getDocs, deleteDoc, updateDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, increment, writeBatch,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

// ⚠️apiKey 는 비밀값이 아니다. 웹 Firebase 는 이 값이 모든 방문자 브라우저에 내려가는 것을
//   전제로 설계돼 있고, 실제 보호는 저장소 루트의 `firestore.rules` 가 한다.
const firebaseConfig = {
  apiKey: 'AIzaSyDoY2F1m19qae7Jw0TMZ1NmDEI2aYg9I0s',
  authDomain: 'menewsoft-board.firebaseapp.com',
  projectId: 'menewsoft-board',
  storageBucket: 'menewsoft-board.firebasestorage.app',
  messagingSenderId: '784946517867',
  appId: '1:784946517867:web:09f08d5473d376f77e5e2e',
};

// ★이 줄이 돌았다는 것은 **원격 SDK 3개가 모두 내려왔고 모듈이 살아 있다**는 뜻이다.
//   BoardWatchdog 이 이 표시를 보고 '스크립트가 죽은 화면'을 잡아낸다.
//   (모듈 import 는 하나만 실패해도 파일 전체가 실행되지 않는다 — 그때 버튼은 그냥 안 눌린다.)
window.__bdReady = true;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
auth.languageCode = 'ko';

/* ─────────────── 자가검증용 에뮬레이터 통로 (localhost 전용) ─────────────── */
//
// ★왜 필요한가 — **구글 로그인은 자동화할 수 없다.** 구글이 헤드리스 브라우저의 로그인을
//   막기 때문이다. 그래서 '로그인한 뒤에 사람이 하는 일'(닉네임·글쓰기·댓글·수정·삭제)이
//   통째로 검증 밖에 있었다. Firebase 에뮬레이터에 붙으면 그 전부를 사람처럼 해 볼 수 있다.
//
// ⚠️★**`localhost`/`127.0.0.1` 에서만 열린다.** 배포된 menewsoft.com 에서는 이 분기가
//   절대 참이 되지 않으므로 운영 데이터에 닿을 수 없다. 조건을 느슨하게 고치지 말 것.
// ⚠️`?emu=1` 은 sessionStorage 에 새겨 둔다 — 글쓰기 팝업(`/board/write/`)은 쿼리스트링을
//   물려받지 않지만 **같은 출처라 sessionStorage 는 공유**되기 때문이다.
const EMU = (() => {
  if (!['localhost', '127.0.0.1'].includes(location.hostname)) return false;
  try {
    if (new URLSearchParams(location.search).get('emu') === '1') sessionStorage.setItem('bd:emu', '1');
    return sessionStorage.getItem('bd:emu') === '1';
  } catch { return false; }
})();

if (EMU) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
  // 검사가 '사람처럼 로그인'하는 유일한 통로. 에뮬레이터 안에서만 뜻이 있다.
  window.__emuSignIn = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
  window.__emu = true;
}

/* ─────────────────────── 로컬 검증용 에뮬레이터 ─────────────────────── */
//
// ★왜 있는가 — **로그인한 사람이 하는 일**(닉네임 정하기·글쓰기·댓글·수정·삭제)은
//   지금까지 검증이 하나도 없었다. 진짜 구글 계정으로는 헤드리스에서 로그인할 수 없어서다.
//   에뮬레이터를 쓰면 그 경로를 끝까지 눌러 볼 수 있다(tools/board-flow-test.py).
//
// ⚠️두 조건을 **모두** 만족해야 켜진다.
//     ① 주소가 localhost / 127.0.0.1 일 것  ② 주소에 `?emu=1` 이 붙을 것
//   공개 사이트(menewsoft.com)는 ①에서 이미 걸린다. 실수로 켜질 수 있는 길이 없다.
// ⚠️`?emu=1` 은 sessionStorage 에 붙잡아 둔다 — 글쓰기 창(/board/write/)처럼
//   주소를 새로 만드는 곳으로 넘어가도 같은 탭 안에서는 계속 에뮬레이터를 본다.
const EMU_HOSTS = ['localhost', '127.0.0.1', '[::1]'];
let USE_EMU = false;
try {
  if (EMU_HOSTS.includes(location.hostname)) {
    if (new URLSearchParams(location.search).get('emu') === '1') sessionStorage.setItem('bd:emu', '1');
    USE_EMU = sessionStorage.getItem('bd:emu') === '1';
  }
} catch { /* 사생활 보호 모드에서는 그냥 끈다 */ }

if (USE_EMU) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
  // 검증 스크립트가 부를 로그인 통로. **에뮬레이터일 때만** 만들어진다.
  window.__emuSignIn = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      await createUserWithEmailAndPassword(auth, email, password);
    }
    return auth.currentUser?.uid || '';
  };
  window.__emuOn = true;
}

export const POSTS = collection(db, 'posts');
export const PAGE_SIZE = 20;
// 운영자 UID. ⚠️firestore.rules 의 isAdmin() 과 **같은 값이어야 한다** — 여기는 화면 표시용
// (공지 선택지·삭제 버튼)일 뿐이고, 실제 차단은 규칙이 한다. 한쪽만 고치면 버튼은 보이는데
// 눌리지 않거나, 권한은 있는데 버튼이 안 보이는 상태가 된다.
export const ADMIN_UIDS = ['wj7sXdNgssea8DqOSYK23XgX0Pq1'];

// 카테고리. `key` 는 Firestore 에 저장되는 값이라 **바꾸면 기존 글이 어느 탭에도 안 잡힌다.**
// `admin: true` 는 운영자만 쓸 수 있다는 뜻인데, 이건 화면 표시용일 뿐이고
// 실제 차단은 firestore.rules 의 catOk() 가 한다(선택지를 숨기는 건 보호가 아니다).
export const CATS = [
  { key: 'notice', label: '공지', admin: true },
  { key: 'free', label: '자유' },
  { key: 'qna', label: '질문' },
];
export const DEFAULT_CAT = 'free';
export const catLabel = (k) => CATS.find((c) => c.key === k)?.label ?? '자유';
export const isCat = (k) => CATS.some((c) => c.key === k);

/* ────────────────────────── 닉네임(프로필) ────────────────────────── */

// 닉네임을 직접 정하지 않은 사람에게 붙여 줄 이름. 한국사 인물에서 고른다.
// ⚠️생존 인물이나 평가가 갈리는 근현대 정치인은 넣지 않는다 — 남의 이름으로 글이 남는 꼴이 된다.
export const NICK_POOL = [
  '세종대왕', '이순신', '장영실', '신사임당', '정약용', '허준', '김정호', '최무선',
  '강감찬', '을지문덕', '김유신', '계백', '연개소문', '대조영', '광개토대왕', '근초고왕',
  '진흥왕', '선덕여왕', '무열왕', '문무왕', '왕건', '서희', '윤관', '최영',
  '정몽주', '정도전', '황희', '맹사성', '이황', '이이', '유성룡', '권율',
  '곽재우', '김시민', '원효', '의상', '최치원', '설총', '일연', '김부식',
  '장보고', '문익점', '박문수', '김홍도', '신윤복', '안견', '정선', '김만중',
  '허난설헌', '황진이', '박지원', '박제가', '홍대용', '유형원', '김대건', '지석영',
  '주시경', '안중근', '윤봉길', '이봉창', '김좌진', '홍범도', '안창호', '이회영',
  '신채호', '한용운', '이육사', '윤동주', '유관순', '김마리아', '남자현', '방정환',
];

export function randomNick() {
  return NICK_POOL[Math.floor(Math.random() * NICK_POOL.length)];
}

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export function saveNick(uid, nick, isNew) {
  return setDoc(doc(db, 'users', uid), isNew
    ? { nick: nick.trim(), createdAt: serverTimestamp() }
    : { nick: nick.trim(), updatedAt: serverTimestamp() }, { merge: !isNew });
}

// 이미 쓰는 닉네임인지 가볍게 본다.
// ⚠️이건 **안내일 뿐 보장이 아니다** — 두 사람이 동시에 같은 이름을 저장하면 둘 다 통과한다.
//   규칙으로 막으려면 닉네임을 문서 id 로 쓰는 별도 컬렉션이 필요한데, 그만한 문제는 아니라고 봤다.
export async function nickTaken(nick, myUid) {
  const snap = await getDocs(query(collection(db, 'users'), where('nick', '==', nick.trim()), limit(2)));
  return snap.docs.some((d) => d.id !== myUid);
}

// 닉네임 글자 검사. firestore.rules 의 nickOk() 와 **같은 기준이어야 한다**.
const RESERVED = /(운영자|관리자|미뉴소프트|menewsoft|admin)/i;
export function nickError(nick) {
  const n = (nick || '').trim();
  if (n.length < 2) return '두 글자 이상 입력해 주세요.';
  if (n.length > 20) return '스무 글자까지 쓸 수 있습니다.';
  if (RESERVED.test(n)) return '운영자를 뜻하는 이름은 쓸 수 없습니다.';
  return '';
}

/* ─────────────────────────── 로그인 ─────────────────────────── */
//
// ★2026-09-05 문의: "로그인 버튼을 눌러도 아무 반응이 없다."
//   원인은 버튼이 아니라 **로그인이 조용히 실패하는 경로가 셋** 있었다는 것이다.
//     ⓐ 팝업 차단 → signInWithRedirect 로 넘어가는데, 우리 인증 핸들러는
//        `menewsoft-board.firebaseapp.com` 이라 **menewsoft.com 과 다른 출처**다.
//        사파리(ITP)·iOS·서드파티 저장소를 막은 크롬은 이 왕복을 끊는다. 그러면 사용자는
//        구글 화면을 보고 돌아왔는데 **로그아웃 상태 그대로**다. 에러도 안 뜬다.
//        (GitHub Pages 라 `/__/auth/` 를 같은 도메인으로 프록시할 수 없다 — 그래서 '안내'가 답이다.)
//     ⓑ 카카오톡·네이버 앱 등 **인앱 브라우저**는 구글이 아예 거부한다(disallowed_useragent).
//        팝업도 리다이렉트도 안 되므로 **누르기 전에** 알려 줘야 한다.
//     ⓒ alert() 로만 알리던 것 — 리다이렉트로 돌아온 뒤에는 띄울 시점 자체가 없다.
//   그래서 실패를 **화면에 남는 안내**로 바꾸고, 돌아왔는데 로그인이 안 된 경우를 감지한다.

// 구글 로그인을 거부하는 인앱 브라우저들.
const IN_APP_UA = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|FB_IAB|Line\/|DaumApps|everytimeApp/i;
export const isInAppBrowser = () => IN_APP_UA.test(navigator.userAgent);

// 리다이렉트로 넘어가기 직전에 남기는 표시. 돌아왔는데 이 표시가 살아 있고 로그인도 안 됐으면
// **왕복이 끊긴 것**이다. sessionStorage 라 탭을 닫으면 같이 사라진다.
const REDIRECT_FLAG = 'bd:auth-redirect';

// 안내 상자. 세 페이지가 공유하므로 board.js 가 직접 그린다(페이지마다 markup 을 두면
// 한 곳을 고칠 때 나머지를 잊는다). 스타일은 팝업 안내(.bd-popup-help)를 그대로 쓴다.
export function showAuthProblem(title, bodyHtml) {
  const host = document.querySelector('main .bd') || document.querySelector('main') || document.body;
  if (!host) return;
  let box = document.getElementById('authProblem');
  if (!box) {
    box = document.createElement('div');
    box.id = 'authProblem';
    box.className = 'bd-popup-help';
    box.setAttribute('role', 'alert');
    host.prepend(box);
  }
  box.hidden = false;
  box.innerHTML = `<strong>${title}</strong>${bodyHtml}`;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function clearAuthProblem() {
  const box = document.getElementById('authProblem');
  if (box) box.hidden = true;
}

// 이 브라우저에서는 구글 로그인 왕복이 막힌다 — 무엇을 하면 되는지까지 적는다.
function blockedNotice(reason) {
  showAuthProblem(reason, `
    <p>구글 로그인은 <b>다른 사이트의 저장소를 쓰는 왕복</b>이 필요한데, 이 브라우저가 그것을 막고 있습니다.
       아래 중 하나로 하시면 됩니다.</p>
    <ul>
      <li><b>사파리(아이폰·맥)</b> — 설정 → Safari → <b>팝업 차단</b>을 끄고, <b>사이트 간 추적 방지</b>를 잠시 꺼 주세요</li>
      <li><b>크롬·엣지</b> — 주소창 오른쪽 <b>차단 아이콘</b> → “menewsoft.com의 팝업 항상 허용”</li>
      <li>가장 확실한 방법은 <b>크롬으로 열기</b>입니다</li>
    </ul>
    <p class="bd-popup-alt">읽는 것은 로그인 없이 그대로 하실 수 있습니다.</p>`);
}

// 인앱 브라우저 — 구글이 UA 를 보고 거부하므로 아예 시도하지 않는다.
function inAppNotice() {
  showAuthProblem('이 앱 안에서는 구글 로그인이 되지 않습니다', `
    <p>카카오톡·네이버 같은 앱 안의 브라우저는 <b>구글이 로그인을 막아 둔 곳</b>입니다.
       (우리 쪽 문제가 아니라 구글 정책입니다.)</p>
    <ul>
      <li>화면 <b>오른쪽 위 ⋮ 또는 공유 단추</b> → <b>“다른 브라우저로 열기”</b>를 눌러 주세요</li>
      <li>또는 주소를 복사해 크롬·사파리에 붙여넣으시면 됩니다</li>
    </ul>
    <p class="bd-popup-alt"><button type="button" class="bd-btn bd-btn-sm" id="copyAddr">주소 복사</button></p>`);
  document.getElementById('copyAddr')?.addEventListener('click', (e) => {
    navigator.clipboard?.writeText(location.href);
    e.target.textContent = '복사했습니다';
  });
}

export async function login() {
  clearAuthProblem();
  if (isInAppBrowser()) { inAppNotice(); return; }

  const provider = new GoogleAuthProvider();
  // 계정이 여럿인 사람이 '이전에 쓰던 계정'으로 조용히 들어가지 않도록 매번 고르게 한다.
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
    clearAuthProblem();
  } catch (e) {
    // 팝업 차단·모바일 인앱 브라우저에서는 팝업이 아예 열리지 않는다. 그때는 리다이렉트로.
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment',
         'auth/cancelled-popup-request'].includes(e.code)) {
      // ★돌아왔을 때 '왕복이 끊겼는지' 알아보려면 지금 표시를 남겨야 한다.
      try { sessionStorage.setItem(REDIRECT_FLAG, String(Date.now())); } catch { /* 사생활 보호 모드 */ }
      try {
        await signInWithRedirect(auth, provider);
      } catch (e2) {
        try { sessionStorage.removeItem(REDIRECT_FLAG); } catch { /* noop */ }
        blockedNotice('로그인 창을 열지 못했습니다');
      }
      return;
    }
    if (e.code === 'auth/popup-closed-by-user') return;   // 사용자가 그냥 닫음 — 조용히 넘어간다
    if (e.code === 'auth/unauthorized-domain') {
      showAuthProblem('이 주소는 아직 로그인 허용 목록에 없습니다',
        '<p>Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에 이 주소를 추가해 주세요.</p>');
      return;
    }
    if (e.code === 'auth/configuration-not-found' || e.code === 'auth/operation-not-allowed') {
      showAuthProblem('구글 로그인이 아직 켜져 있지 않습니다',
        '<p>Firebase 콘솔 → Authentication → Sign-in method → Google 을 사용 설정해 주세요.</p>');
      return;
    }
    if (e.code === 'auth/network-request-failed') {
      showAuthProblem('인터넷 연결이 끊겨 로그인하지 못했습니다',
        '<p>연결을 확인하신 뒤 다시 눌러 주세요.</p>');
      return;
    }
    showAuthProblem('로그인에 실패했습니다', `<p>${esc(e.message || e.code || '')}</p>`);
  }
}

// ★리다이렉트로 돌아온 뒤를 처리한다. 예전에는 이 함수 자체가 없어서,
//   왕복이 끊겨도 **아무 일도 일어나지 않은 화면**만 남았다.
export async function settleRedirect() {
  let flagged = null;
  try { flagged = sessionStorage.getItem(REDIRECT_FLAG); } catch { /* noop */ }
  try {
    const res = await getRedirectResult(auth);
    if (res?.user) {
      try { sessionStorage.removeItem(REDIRECT_FLAG); } catch { /* noop */ }
      clearAuthProblem();
      return;
    }
  } catch (e) {
    try { sessionStorage.removeItem(REDIRECT_FLAG); } catch { /* noop */ }
    if (e?.code === 'auth/unauthorized-domain') {
      showAuthProblem('이 주소는 아직 로그인 허용 목록에 없습니다',
        '<p>Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에 이 주소를 추가해 주세요.</p>');
    } else {
      blockedNotice('로그인이 끝까지 되지 않았습니다');
    }
    return;
  }
  // 표시는 남아 있는데 결과도 없고 사용자도 없다 = 왕복이 조용히 끊긴 것.
  if (flagged && !auth.currentUser) {
    try { sessionStorage.removeItem(REDIRECT_FLAG); } catch { /* noop */ }
    blockedNotice('로그인이 끝까지 되지 않았습니다');
  }
}

export function logout() {
  return signOut(auth);
}

// 현재 로그인 사용자의 프로필(닉네임). 글쓰기·댓글이 이 값을 쓴다.
let profile = null;
let listener = null;
export const currentNick = () => profile?.nick || '';

// ⚠️cb(user, profile) 로 넘긴다. profile 이 null 이면 **아직 닉네임을 정하지 않은 사람**이고,
//   그 상태에서는 규칙이 글쓰기를 거부하므로 화면도 닉네임 설정을 먼저 띄운다.
export function onUser(cb) {
  listener = cb;
  // ★리다이렉트 복귀 처리는 **여기서** 건다 — 세 페이지가 모두 onUser 를 부르므로
  //   한 곳만 고치면 되고, 페이지를 새로 만들 때 빠뜨릴 수가 없다.
  settleRedirect();
  return onAuthStateChanged(auth, async (u) => {
    if (u) clearAuthProblem();
    profile = u ? await getProfile(u.uid).catch(() => null) : null;
    cb(u, profile);
    if (u && !profile) openNickModal(u);
  });
}

// 닉네임 설정이 끝난 뒤 화면을 다시 그리게 한다.
function refresh(u) {
  listener?.(u, profile);
}

export function isAdmin(user) {
  return !!user && ADMIN_UIDS.includes(user.uid);
}

/* ─────────────────────────── 데이터 ─────────────────────────── */

// cat 이 없으면 전체. 카테고리 필터는 `cat ASC + createdAt DESC` 복합색인을 쓴다
// (firestore.indexes.json — 색인이 빠지면 필터 탭만 failed-precondition 으로 죽는다).
export async function listPosts(cat, after) {
  const parts = [];
  if (cat && isCat(cat)) parts.push(where('cat', '==', cat));
  parts.push(orderBy('createdAt', 'desc'));
  if (after) parts.push(startAfter(after));
  parts.push(limit(PAGE_SIZE));
  const snap = await getDocs(query(POSTS, ...parts));
  // ★★'글이 없다'와 '못 받았다'는 다르다 (2026-09-05 검증에서 잡힌 결함).
  //   Firestore 가 막히면 getDocs 는 **에러를 던지지 않고 빈 캐시를 준다.** 그러면 화면에
  //   "아직 글이 없습니다. 첫 글을 남겨 보세요." 가 뜬다 — 글이 아홉 편 있는데도.
  //   쓰는 사람에게는 '게시판이 텅 비었다'로 보이고, 우리는 아무 신호도 못 받는다.
  //   서버에서 온 적이 없는 빈 결과는 실패로 올린다(호출부의 안내 경로로 간다).
  if (snap.empty && snap.metadata.fromCache) {
    const err = new Error('목록을 서버에서 받지 못했습니다');
    err.code = 'unavailable';
    throw err;
  }
  return {
    posts: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    cursor: snap.docs[snap.docs.length - 1] || null,
    done: snap.docs.length < PAGE_SIZE,
  };
}

// '전체' 탭 맨 위에 붙일 공지 몇 건. 공지는 운영자만 쓰므로 수가 적다.
export async function listNotices(n = 3) {
  const snap = await getDocs(query(POSTS, where('cat', '==', 'notice'), orderBy('createdAt', 'desc'), limit(n)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPost(id) {
  const snap = await getDoc(doc(db, 'posts', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function createPost(user, title, body, cat) {
  return addDoc(POSTS, {
    title: title.trim(),
    body: body.trim(),
    cat: isCat(cat) ? cat : DEFAULT_CAT,
    authorUid: user.uid,
    authorName: currentNick(),
    authorPhoto: user.photoURL || '',
    commentCount: 0,
    createdAt: serverTimestamp(),
  });
}

export function updatePost(id, title, body, cat) {
  return updateDoc(doc(db, 'posts', id), {
    title: title.trim(), body: body.trim(),
    cat: isCat(cat) ? cat : DEFAULT_CAT, updatedAt: serverTimestamp(),
  });
}

// ⚠️댓글을 **먼저** 지운다. 순서가 반대면 부모 글이 사라져 규칙의 get() 이 실패하고,
//   남의 댓글이 달린 글은 영영 정리되지 않는다(firestore.rules 주석 참고).
export async function deletePost(id) {
  const comments = await getDocs(collection(db, 'posts', id, 'comments'));
  for (let i = 0; i < comments.docs.length; i += 400) {
    const batch = writeBatch(db);
    comments.docs.slice(i, i + 400).forEach((c) => batch.delete(c.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, 'posts', id));
}

export async function listComments(postId) {
  const snap = await getDocs(
    query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addComment(postId, user, body) {
  await addDoc(collection(db, 'posts', postId, 'comments'), {
    body: body.trim(),
    authorUid: user.uid,
    authorName: currentNick(),
    authorPhoto: user.photoURL || '',
    createdAt: serverTimestamp(),
  });
  // 카운터가 틀어져도 글·댓글은 멀쩡하므로 실패해도 흐름을 막지 않는다.
  updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) }).catch(() => {});
}

export async function deleteComment(postId, commentId) {
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
  updateDoc(doc(db, 'posts', postId), { commentCount: increment(-1) }).catch(() => {});
}

/* ─────────────────────── 닉네임 설정 창 ─────────────────────── */

// ⚠️★창을 Astro 페이지가 아니라 여기서 만든다 — 목록·상세 두 페이지가 똑같이 필요한데,
//   양쪽 HTML 에 같은 마크업을 두면 한쪽만 고치는 사고가 난다.
export function openNickModal(user, { editing = false } = {}) {
  if (document.getElementById('nickModal')) return;

  const suggested = editing ? currentNick() : randomNick();
  const el = document.createElement('div');
  el.id = 'nickModal';
  el.className = 'bd-modal';
  el.innerHTML = `
    <div class="bd-modal-box" role="dialog" aria-modal="true" aria-labelledby="nickTitle">
      <h2 id="nickTitle">${editing ? '닉네임 바꾸기' : '닉네임을 정해 주세요'}</h2>
      <p class="bd-modal-lead">${editing
        ? '앞으로 쓰는 글에 이 이름이 표시됩니다. 이미 쓴 글의 이름은 그대로 남습니다.'
        : '게시판에는 구글 계정 이름 대신 이 이름이 표시됩니다.<br />비워 두고 넘어가면 아래 이름을 그대로 씁니다.'}</p>
      <label class="bd-modal-field">
        <input id="nickInput" maxlength="20" autocomplete="off" value="${esc(suggested)}" />
      </label>
      <p class="bd-modal-msg" id="nickMsg"></p>
      <div class="bd-modal-actions">
        <button type="button" class="bd-btn" id="nickDice">🎲 다른 이름</button>
        <button type="button" class="bd-btn bd-btn-primary" id="nickSave">${editing ? '저장' : '이 이름으로 시작'}</button>
      </div>
      ${editing ? '<button type="button" class="bd-modal-close" id="nickCancel" aria-label="닫기">✕</button>' : ''}
    </div>`;
  document.body.appendChild(el);

  const input = el.querySelector('#nickInput');
  const msg = el.querySelector('#nickMsg');
  input.focus();
  input.select();

  el.querySelector('#nickDice').addEventListener('click', () => {
    input.value = randomNick();
    msg.textContent = '';
    input.focus();
  });
  el.querySelector('#nickCancel')?.addEventListener('click', () => el.remove());

  const save = async () => {
    // 비워 두고 넘어가면 랜덤 이름을 준다(요구사항: 설정 안 하면 랜덤 닉네임).
    const nick = input.value.trim() || randomNick();
    const err = nickError(nick);
    if (err) { msg.textContent = err; return; }

    const btn = el.querySelector('#nickSave');
    btn.disabled = true;
    msg.textContent = '확인 중…';
    try {
      if (await nickTaken(nick, user.uid)) {
        msg.textContent = '이미 쓰고 있는 이름입니다. 다른 이름으로 해주세요.';
        btn.disabled = false;
        return;
      }
      await saveNick(user.uid, nick, !editing);
      profile = { ...(profile || {}), nick };
      el.remove();
      refresh(user);
    } catch (e) {
      msg.textContent = '저장하지 못했습니다: ' + (e.message || e.code);
      btn.disabled = false;
    }
  };
  el.querySelector('#nickSave').addEventListener('click', save);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
}

/* ─────────────────────────── 표시용 ─────────────────────────── */

// ⚠️★사용자가 쓴 글은 **반드시** 이걸 거쳐서 넣는다. innerHTML 에 날것으로 넣으면
//   남의 브라우저에서 스크립트가 도는 XSS 가 된다(로그인한 사람 누구나 글을 쓸 수 있다).
export function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

// 서버 시각이 아직 안 온 낙관적 표시(방금 쓴 글)는 createdAt 이 null 이다.
export function when(ts) {
  if (!ts?.toDate) return '방금';
  const d = ts.toDate();
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function avatar(url, name) {
  return url
    ? `<img class="bd-ava" src="${esc(url)}" alt="" referrerpolicy="no-referrer" width="28" height="28" />`
    : `<span class="bd-ava bd-ava-none" aria-hidden="true">${esc((name || '?').slice(0, 1))}</span>`;
}
