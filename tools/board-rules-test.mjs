// firestore.rules 검증 — 에뮬레이터에 실제 규칙을 얹고 시나리오별로 통과/차단을 확인한다.
//
// 실행: cd ~/techdecode && npm run board:rules
//
// ⚠️firebase-tools 15 는 **JDK 21 이상**을 요구하는데 이 맥의 기본 java 는 17 이다.
//   그래서 npm 스크립트가 openjdk@25 경로를 앞에 붙여 준다(직접 실행하면 Java 버전 오류).
// ⚠️에뮬레이터 포트는 8080 이 아니라 **8085** — 8080 은 쇼츠공장 쪽 python 서버가 쓰고 있다.
//
// ⚠️★게시판은 서버가 없다. 클라이언트 JS 의 검사는 F12 로 우회되므로 **규칙이 유일한 방어선**이다.
//   그래서 '되는 것'만이 아니라 **'막혀야 하는 것이 실제로 막히는지'** 를 같은 비중으로 본다.
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, serverTimestamp,
} from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'menewsoft-board-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 },
});

const guest = env.unauthenticatedContext().firestore();
const alice = env.authenticatedContext('alice', { email: 'alice@example.com' }).firestore();
const bob = env.authenticatedContext('bob', { email: 'bob@example.com' }).firestore();
// ⚠️운영자 판정은 **UID** 다(firestore.rules 의 isAdmin). 이메일만 같고 UID 가 다른 계정은
// 운영자가 아니어야 하므로, 그 경우도 아래에서 함께 확인한다.
const ADMIN_UID = 'wj7sXdNgssea8DqOSYK23XgX0Pq1';
const admin = env.authenticatedContext(ADMIN_UID, { email: 'minyouman@gmail.com' }).firestore();
const fakeAdmin = env.authenticatedContext('impostor', { email: 'minyouman@gmail.com' }).firestore();

// ⚠️authorName 은 users/{uid}.nick 과 같아야 규칙을 통과한다(사칭 방지). 아래 NICK 참고.
const NICK = { alice: '유관순', bob: '안중근', carol: '윤동주',
               ['wj7sXdNgssea8DqOSYK23XgX0Pq1']: '미뉴소프트' };
const post = (uid, name, over = {}) => ({
  title: '제목', body: '본문', cat: 'free', authorUid: uid, authorName: name,
  authorPhoto: '', commentCount: 0, createdAt: serverTimestamp(), ...over,
});
const comment = (uid, name, over = {}) => ({
  body: '댓글', authorUid: uid, authorName: name, authorPhoto: '',
  createdAt: serverTimestamp(), ...over,
});

let pass = 0, fail = 0;
async function check(label, fn) {
  try { await fn(); console.log(`  OK   ${label}`); pass++; }
  catch (e) { console.log(`  FAIL ${label}\n         ${String(e).slice(0, 160)}`); fail++; }
}

// 기존 글 하나와 닉네임들을 규칙 우회로 심어 둔다(수정·삭제 시나리오의 준비물).
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  for (const [uid, nick] of Object.entries(NICK)) {
    await setDoc(doc(db, 'users', uid), { nick, createdAt: new Date() });
  }
  await setDoc(doc(db, 'posts/p1'), { ...post('alice', NICK.alice), createdAt: new Date() });
  await setDoc(doc(db, 'posts/p1/comments/c1'), { ...comment('bob', NICK.bob), createdAt: new Date() });
});

console.log('\n■ 읽기 — 누구나 볼 수 있어야 한다');
await check('비로그인 방문자가 글을 읽는다', () => assertSucceeds(getDoc(doc(guest, 'posts/p1'))));
await check('비로그인 방문자가 댓글을 읽는다', () => assertSucceeds(getDocs(collection(guest, 'posts/p1/comments'))));

console.log('\n■ 글쓰기 — 로그인한 사람만');
await check('비로그인 글쓰기는 차단', () => assertFails(addDoc(collection(guest, 'posts'), post('nobody', '손님'))));
await check('로그인 사용자는 글을 쓴다', () => assertSucceeds(addDoc(collection(alice, 'posts'), post('alice', NICK.alice))));
await check('남의 이름(uid)으로 쓰는 것은 차단', () => assertFails(addDoc(collection(alice, 'posts'), post('bob', NICK.bob))));
await check('작성시각을 직접 정하는 것은 차단', () => assertFails(addDoc(collection(alice, 'posts'), post('alice', NICK.alice, { createdAt: new Date(2000, 0, 1) }))));
await check('제목 없는 글은 차단', () => assertFails(addDoc(collection(alice, 'posts'), post('alice', NICK.alice, { title: '' }))));
await check('본문 1만자 초과는 차단', () => assertFails(addDoc(collection(alice, 'posts'), post('alice', NICK.alice, { body: 'ㄱ'.repeat(10001) }))));
await check('댓글수를 0 아닌 값으로 시작하는 것은 차단', () => assertFails(addDoc(collection(alice, 'posts'), post('alice', NICK.alice, { commentCount: 999 }))));

console.log('\n■ 닉네임 — 정하기 전에는 글을 쓸 수 없다');
const dave = env.authenticatedContext('dave', { email: 'd@e.com' }).firestore();
await check('닉네임 없는 사람은 글을 못 쓴다', () => assertFails(addDoc(collection(dave, 'posts'), post('dave', '데이브'))));
await check('닉네임 없는 사람은 댓글도 못 단다', () => assertFails(addDoc(collection(dave, 'posts/p1/comments'), comment('dave', '데이브'))));
await check('비로그인은 닉네임을 못 만든다', () => assertFails(setDoc(doc(guest, 'users/nobody'), { nick: '손님', createdAt: serverTimestamp() })));
await check('남의 닉네임 문서는 못 만든다', () => assertFails(setDoc(doc(dave, 'users/alice'), { nick: '가로채기', createdAt: serverTimestamp() })));
await check('본인 닉네임 설정', () => assertSucceeds(setDoc(doc(dave, 'users/dave'), { nick: '장영실', createdAt: serverTimestamp() })));
await check('닉네임 설정 후에는 글을 쓴다', () => assertSucceeds(addDoc(collection(dave, 'posts'), post('dave', '장영실'))));
await check('★저장된 닉네임과 다른 이름으로는 못 쓴다(사칭)', () => assertFails(addDoc(collection(dave, 'posts'), post('dave', '이순신'))));
await check('한 글자 닉네임은 차단', () => assertFails(setDoc(doc(dave, 'users/dave'), { nick: '가', updatedAt: serverTimestamp() })));
await check('스무 글자 초과 닉네임은 차단', () => assertFails(setDoc(doc(dave, 'users/dave'), { nick: '가'.repeat(21), updatedAt: serverTimestamp() })));
await check("★'운영자' 가 든 닉네임은 차단", () => assertFails(setDoc(doc(dave, 'users/dave'), { nick: '운영자입니다', updatedAt: serverTimestamp() })));
await check("★'미뉴소프트' 사칭 닉네임은 차단", () => assertFails(setDoc(doc(dave, 'users/dave'), { nick: '미뉴소프트', updatedAt: serverTimestamp() })));
await check("★대소문자 섞은 'Admin' 도 차단", () => assertFails(setDoc(doc(dave, 'users/dave'), { nick: 'Admin김', updatedAt: serverTimestamp() })));
await check('운영자는 예약된 이름을 쓸 수 있다', () => assertSucceeds(setDoc(doc(admin, `users/${ADMIN_UID}`), { nick: '미뉴소프트', updatedAt: serverTimestamp() })));
await check('닉네임 문서에 딴 필드는 못 넣는다', () => assertFails(setDoc(doc(dave, 'users/dave'), { nick: '홍범도', role: 'admin', updatedAt: serverTimestamp() })));
await check('닉네임은 누구나 읽는다', () => assertSucceeds(getDoc(doc(guest, 'users/alice'))));

console.log('\n■ 카테고리 — 공지는 운영자만');
await check('자유 글쓰기', () => assertSucceeds(addDoc(collection(alice, 'posts'), post('alice', NICK.alice, { cat: 'free' }))));
await check('질문 글쓰기', () => assertSucceeds(addDoc(collection(alice, 'posts'), post('alice', NICK.alice, { cat: 'qna' }))));
await check('일반 사용자의 공지 작성은 차단', () => assertFails(addDoc(collection(alice, 'posts'), post('alice', NICK.alice, { cat: 'notice' }))));
await check('운영자는 공지를 쓴다', () => assertSucceeds(addDoc(collection(admin, 'posts'), post(ADMIN_UID, '미뉴소프트', { cat: 'notice' }))));
await check('★이메일만 같고 UID 가 다르면 운영자가 아니다', () => assertFails(addDoc(collection(fakeAdmin, 'posts'), post('impostor', '사칭', { cat: 'notice' }))));
await check('없는 분류는 차단', () => assertFails(addDoc(collection(alice, 'posts'), post('alice', NICK.alice, { cat: 'hack' }))));
await check('분류 없는 글은 차단', () => assertFails(addDoc(collection(alice, 'posts'), post('alice', NICK.alice, { cat: null }))));

console.log('\n■ 글 수정 — 본인만, 제목·본문·분류만');
await check('본인 글 수정', () => assertSucceeds(updateDoc(doc(alice, 'posts/p1'), { title: '고침', body: '고침', cat: 'qna', updatedAt: serverTimestamp() })));
await check('수정하면서 공지로 올리는 것은 차단', () => assertFails(updateDoc(doc(alice, 'posts/p1'), { title: '고침', body: '고침', cat: 'notice', updatedAt: serverTimestamp() })));
await check('남의 글 수정은 차단', () => assertFails(updateDoc(doc(bob, 'posts/p1'), { title: '가로채기', body: 'x', cat: 'free' })));
await check('작성자 바꿔치기는 차단', () => assertFails(updateDoc(doc(alice, 'posts/p1'), { authorUid: 'bob' })));
await check('운영자도 남의 글 내용은 못 고친다', () => assertFails(updateDoc(doc(admin, 'posts/p1'), { title: '운영자수정', body: 'x' })));

console.log('\n■ 댓글수 카운터 — 남의 글에도 댓글을 달 수 있어야 하므로 그 칸만 열려 있다');
await check('로그인 사용자가 댓글수만 올린다', () => assertSucceeds(updateDoc(doc(bob, 'posts/p1'), { commentCount: 5 })));
await check('댓글수에 다른 필드를 끼워 넣으면 차단', () => assertFails(updateDoc(doc(bob, 'posts/p1'), { commentCount: 6, title: '몰래' })));
await check('비로그인은 댓글수도 못 건드린다', () => assertFails(updateDoc(doc(guest, 'posts/p1'), { commentCount: 7 })));

console.log('\n■ 댓글');
await check('비로그인 댓글은 차단', () => assertFails(addDoc(collection(guest, 'posts/p1/comments'), comment('nobody', '손님'))));
await check('로그인 사용자가 댓글을 단다', () => assertSucceeds(addDoc(collection(bob, 'posts/p1/comments'), comment('bob', NICK.bob))));
await check('댓글 1000자 초과는 차단', () => assertFails(addDoc(collection(bob, 'posts/p1/comments'), comment('bob', NICK.bob, { body: 'ㄱ'.repeat(1001) }))));
await check('댓글 수정은 아무도 못 한다', () => assertFails(updateDoc(doc(bob, 'posts/p1/comments/c1'), { body: '고침' })));
await check('제3자는 남의 댓글을 못 지운다', () => assertFails(deleteDoc(doc(env.authenticatedContext('carol', { email: 'c@e.com' }).firestore(), 'posts/p1/comments/c1'))));
await check('댓글 작성자 본인은 지운다', () => assertSucceeds(deleteDoc(doc(bob, 'posts/p1/comments/c1'))));

console.log('\n■ 삭제 권한');
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'posts/p2'), { ...post('alice', NICK.alice), createdAt: new Date() });
  await setDoc(doc(ctx.firestore(), 'posts/p2b'), { ...post('alice', NICK.alice), createdAt: new Date() });
  await setDoc(doc(ctx.firestore(), 'posts/p3'), { ...post('alice', NICK.alice), createdAt: new Date() });
  await setDoc(doc(ctx.firestore(), 'posts/p3/comments/c9'), { ...comment('bob', NICK.bob), createdAt: new Date() });
});
await check('남의 글 삭제는 차단', () => assertFails(deleteDoc(doc(bob, 'posts/p2'))));
await check('글쓴이는 자기 글에 달린 남의 댓글을 지운다', () => assertSucceeds(deleteDoc(doc(alice, 'posts/p3/comments/c9'))));
await check('본인 글 삭제', () => assertSucceeds(deleteDoc(doc(alice, 'posts/p2'))));
await check('운영자는 남의 글을 지운다', () => assertSucceeds(deleteDoc(doc(admin, 'posts/p3'))));
await check('★이메일만 같은 계정은 남의 글을 못 지운다', () => assertFails(deleteDoc(doc(fakeAdmin, 'posts/p2b'))));

await env.cleanup();
console.log(`\n${fail ? '⛔' : '✅'} ${pass}건 통과 / ${fail}건 실패`);
process.exit(fail ? 1 : 0);
