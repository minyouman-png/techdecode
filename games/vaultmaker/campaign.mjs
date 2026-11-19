/* ══ 캠페인 30개 — 혼자서도 완결되는 게임 (설계서 §7-① · §10-4) ═════════════
 * UGC 게임이 죽는 이유는 '아무도 없는 방'이다. 네트워크가 없어도 게임이 끝나야 한다.
 *
 * ★캠페인의 일은 '어렵게 만들기'가 아니라 **가르치기**다.
 *   설계서 §1-3 의 불만 3번이 "타워·적 설명을 안 알려준다 — 무엇이 무엇인지 모른 채 찍는다"이고,
 *   §5 가 내놓은 답이 "설명을 늘리는 게 아니라 **설명이 필요 없게 만드는 것**"이었다.
 *   그래서 1~3장은 장치를 **하나씩** 내놓는다. 혼자 있을 땐 아무것도 못 한다는 걸 먼저 보여 주고,
 *   그다음 짝을 붙인다. 한 금고가 한 문장을 가르친다.
 *
 * ⚠️격자는 손으로 그리지 않는다(gen.mjs). 난이도는 눈으로 정하지 않는다(campaign_tune.py).
 * ⚠️장치의 '위치'는 0~1 의 **경로상 비율**이다 — 칸 좌표를 쓰면 배치 유형을 바꿀 때 전부 깨진다. */
import { make } from './gen.mjs';

export const CHAPTERS = [
  { n: 1, ko: '눈과 총', en: 'Eyes and guns', en_note: 'A camera never hurts; a laser cannot see on its own',        note: '카메라는 때리지 않고, 레이저는 혼자 못 본다' },
  { n: 2, ko: '느린 것만 문다', en: 'They bite the slow', en_note: 'The moment you stop, you are slow', note: '멈춰 선 순간 누구든 느리다' },
  { n: 3, ko: '바닥', en: 'The floor', en_note: 'The ghost dodges cameras but not the floor',           note: '그림자는 카메라를 피하지만 바닥은 못 피한다' },
  { n: 4, ko: '한 번의 개입', en: 'One intervention', en_note: 'Once per run — when do you spend it?',   note: '판당 한 번, 언제 쓰나' },
  { n: 5, ko: '설계자의 금고', en: 'The maker\u2019s vaults', en_note: 'Everything at once',  note: '전부 섞인다' },
  { n: 6, ko: '유리와 자물쇠', en: 'Glass and locks', en_note: 'A floor that punishes speed, a hand that opens doors',  note: '빠른 것을 벌하는 바닥, 문을 여는 손' },
];

/* [이름, 힌트, 장(章), 배치, 폭, 높이, 도둑예산, [[장치, 경로비율]…], 옵션] */
/* ⚠️표는 도구도 읽는다(`campaign_autotune.py`). 정규식으로 JS 를 파싱하려다
   `.45` 같은 표기에서 깨졌다 — **내보내서 node 가 읽게** 한다. */
export const SPEC = [
  // ── 1장 눈과 총 ───────────────────────────────────────────────────────
  ['첫 복도',       '카메라는 아무도 때리지 않는다', 1, 'spiral', 16, 12, 14, [['C', .45]], {en: 'First corridor', en_hint: "A camera hurts nobody"}],
  ['빨간 선',       '레이저는 발각된 것만 쏜다. 아무도 발각되지 않았다면?', 1, 'spiral', 16, 12, 14, [['L', .35], ['L', .65]], {en: 'Red line', en_hint: "Lasers only fire at marked thieves. What if nobody is marked?"}],
  ['둘이 만나면',   '카메라와 레이저가 만나야 비로소 방어가 된다', 1, 'spiral', 16, 12, 13, [['C', .34], ['L', 2]], {en: 'When the two meet', en_hint: "Camera and laser together — only now is it a defense"}],
  ['두 눈',         '눈이 둘이면 피할 곳이 없다', 1, 'serpentine', 18, 14, 13, [['C', .24], ['L', 2], ['C', .52], ['L', 2], ['C', .80], ['L', 2]], { a: 4, en: 'Two eyes', en_hint: "With two eyes there is nowhere to slip past"}],
  ['그림자의 값',   '그림자는 카메라에 잡히지 않는다. 대신 아주 약하다', 1, 'comb', 18, 14, 12, [['C', .18], ['C', .40], ['L', 2], ['C', .64], ['L', 2], ['C', .88]], { a: 4, en: 'What a ghost is worth', en_hint: "The ghost is invisible to cameras. And very fragile"}],
  ['기술자의 자리', '기술자 곁에서는 전기 장치가 눈을 감는다', 1, 'spiral', 18, 14, 12, [['C', .20], ['L', 2], ['C', .46], ['L', 2], ['C', .72], ['L', 2], ['C', .92]], {en: 'Where the tech stands', en_hint: "Electrics close their eyes next to a tech"}],

  // ── 2장 느린 것만 문다 ────────────────────────────────────────────────
  ['개 한 마리',   '개는 느린 것만 문다. 빠른 것은 그냥 지나간다', 2, 'spiral', 16, 12, 14, [['D', .50]], {en: 'One dog', en_hint: "Dogs bite only the slow. The fast just walk by"}],
  ['잠긴 문',      '잠금문은 때리지 않는다. 시간만 끈다', 2, 'serpentine', 18, 14, 14, [['K', .30], ['K', .70]], { a: 4, en: 'Locked door', en_hint: "A locked door never hurts you. It only costs time"}],
  ['문 앞의 개',   '멈춰 선 순간, 누구든 느려진다', 2, 'spiral', 18, 14, 12, [['K', .24], ['D', 1], ['K', .52], ['D', 1], ['K', .80], ['D', 1]], {en: 'The dog at the door', en_hint: "The moment you stop, you are slow"}],
  ['개가 지키는 방', '문이 셋이면 셋 다 물린다', 2, 'rooms', 20, 16, 12, [['K', .22], ['D', 1], ['K', .52], ['D', 1], ['K', .82], ['D', 1]], { a: 3, b: 2, seed: 11, en: 'The room the dogs watch', en_hint: "Three doors means three bites"}],
  ['몸빵의 자리',  '몸빵은 물리면서 간다. 그동안 다른 누군가가 지나간다', 2, 'comb', 20, 16, 13, [['K', .14], ['D', 1], ['K', .36], ['D', 1], ['K', .58], ['D', 1], ['K', .8]], { a: 4, en: 'Where the bruiser earns it', en_hint: "The bruiser walks through the bites. Someone else slips past meanwhile"}],
  ['개를 부른다',  '개입 📢 양동 — 개를 5초간 엉뚱한 곳으로 부른다', 2, 'spiral', 20, 16, 12, [['K', .24], ['D', 1], ['D', 2], ['K', .52], ['D', 1]], {en: 'Call the dogs away', en_hint: "📢 Decoy — pull the dogs somewhere else for 5 seconds"}],

  // ── 3장 바닥 ──────────────────────────────────────────────────────────
  ['첫 판',        '압력판은 밟은 사람만이 아니라 그 구역을 발각시킨다', 3, 'spiral', 18, 14, 14, [['P', .40], ['L', .52]], {en: 'First plate', en_hint: "A plate exposes the whole area, not just whoever stepped on it"}],
  ['그림자도 밟는다', '카메라는 피해도 바닥은 못 피한다', 3, 'serpentine', 20, 16, 13, [['P', .30], ['L', .38], ['P', .66], ['L', .74]], { a: 4, en: 'Even a ghost steps', en_hint: "You can dodge a camera. You cannot dodge a floor"}],
  ['바닥을 조심할 것', '판이 발각시키고 레이저가 쏜다 — 그림자도 예외가 아니다', 3, 'spiral', 22, 18, 13, [['P', .26], ['L', 2], ['P', .58]], {en: 'Mind the floor', en_hint: "The plate marks you and the laser fires — the ghost is no exception"}],
  ['판과 개',      '판이 발각시키고 개가 문다 — 레이저가 없어도 아프다', 3, 'rooms', 20, 16, 12, [['P', .26], ['D', 1], ['L', .44], ['K', .58]], { a: 3, b: 2, seed: 23, en: 'Plate and dog', en_hint: "The plate marks, the dog bites — no laser needed to hurt"}],
  ['정전',         '개입 ⚡ 정전 — 꺼지는 것은 전기뿐이다', 3, 'comb', 20, 16, 12, [['C', .18], ['L', .24], ['C', .46], ['L', .52], ['C', .74], ['L', .80]], { a: 4, en: 'Blackout', en_hint: "⚡ Blackout — only the electrics go out"}],
  ['막다른 길',    '전기가 하나도 없다. 기술자가 할 일이 없다', 3, 'spiral', 22, 18, 12, [['P', .18], ['K', 2], ['D', 1], ['P', .48], ['K', 2], ['D', 1], ['K', .78]], {en: 'Dead end', en_hint: "Not one electric device here. The tech has nothing to do"}],

  // ── 4장 한 번의 개입 ──────────────────────────────────────────────────
  ['세 갈래',      '무엇을 아낄 것인가', 4, 'rooms', 22, 18, 12, [['K', .18], ['D', 1], ['K', .44], ['D', 1], ['K', .68], ['D', 1], ['K', .88]], { a: 4, b: 3, seed: 7, en: 'Three ways', en_hint: "What will you save?"}],
  ['긴 복도',      '길수록 오래 노출된다', 4, 'serpentine', 22, 18, 12, [['C', .20], ['L', .26], ['C', .56], ['L', .62]], { a: 4, en: 'Long corridor', en_hint: "The longer the walk, the longer you are exposed"}],
  ['이빨의 방',    '개만으로는 못 막는다. 세워야 문다', 4, 'rooms', 22, 18, 12, [['D', .16], ['K', .34], ['D', 1], ['K', .56], ['D', 1], ['K', .78]], { a: 4, b: 3, seed: 11, en: 'Room of teeth', en_hint: "Dogs alone cannot stop you. Something must make you stop"}],
  ['눈의 방',      '카메라 넷. 그림자 아니면 기술자다', 4, 'comb', 22, 18, 12, [['C', .14], ['L', .20], ['C', .42], ['C', .58], ['L', .64], ['C', .86]], { a: 4, en: 'Room of eyes', en_hint: "Four cameras. The ghost, or the tech"}],
  ['좁은 길',      '예산이 빠듯하다. 누구를 버릴 것인가', 4, 'spiral', 20, 16, 11, [['C', .24], ['L', .30], ['K', .54], ['D', .57], ['L', .84]], {en: 'Tight budget', en_hint: "Money is short. Who do you leave behind?"}],
  ['되돌아오기',   '한 번 지난 길을 다시 지난다 — 판은 두 번 밟힌다', 4, 'serpentine', 22, 18, 12, [['P', .2], ['L', 2], ['P', .52]], { a: 3, en: 'Doubling back', en_hint: "You walk the same path twice — the plates get stepped on twice"}],

  // ── 5장 설계자의 금고 ─────────────────────────────────────────────────
  ['다섯의 합',    '다섯 장치가 전부 있다', 5, 'spiral', 22, 18, 12, [['C', .16], ['L', 2], ['P', .40], ['K', .58], ['D', 1], ['C', .80], ['L', 2]], {en: 'All five', en_hint: "Every device is here"}],
  ['미로',         '길을 외울 시간이 없다', 5, 'rooms', 24, 20, 12, [['K', .16], ['D', 1], ['K', .42], ['D', 1], ['K', .68], ['D', 1], ['K', .88]], { a: 4, b: 3, seed: 23, en: 'Maze', en_hint: "No time to memorise the path"}],
  ['톱니',         '들어갔다 나왔다', 5, 'comb', 24, 20, 12, [['C', .12], ['L', .18], ['C', .32], ['L', .38], ['P', .56], ['K', .72]], { a: 4, en: 'Sawtooth', en_hint: "In and out, in and out"}],
  ['두 개의 심장', '같은 함정이 두 번. 전기는 없다', 5, 'serpentine', 24, 20, 12, [['P', .14], ['K', 2], ['D', 1], ['P', .44], ['K', 2], ['D', 1], ['K', .74], ['D', 1]], { a: 3, en: 'Two hearts', en_hint: "The same trap, twice. No electrics"}],
  ['마지막 문',    '문 앞에 전부 모여 있다', 5, 'spiral', 24, 20, 11, [['C', .18], ['L', 2], ['P', .46], ['C', .72], ['L', 2], ['K', .88], ['D', 1]], {en: 'The last door', en_hint: "Everything waits at the door"}],
  ['설계자',       '이걸 뚫으면 당신도 지을 수 있다', 5, 'rooms', 24, 20, 11, [['C', .12], ['L', 2], ['P', .32], ['K', .46], ['D', 1], ['C', .66], ['L', 2], ['D', .88]], { a: 4, b: 3, seed: 11, en: 'The maker', en_hint: "Crack this and you can build your own"}],

  // ── 6장 유리와 자물쇠 ─────────────────────────────────────────────────
  // ★로스터를 늘린 뒤 신설. 새 장치·새 도둑도 **하나씩** 내놓는 규칙은 그대로다.
  ['유리 바닥',    '빠르게 지나면 깨진다. 처음으로 느린 것이 유리하다', 6, 'spiral', 18, 14, 12, [['G', .30], ['G', .58], ['G', .84]], {en: 'Glass floor', en_hint: "Move fast and it breaks. For once, slow is better"}],
  ['느린 것이 옳다', '빠른 발이 전부 유리에 빠진다', 6, 'serpentine', 20, 16, 12, [['G', .18], ['G', .38], ['G', .58], ['G', .76], ['G', .92]], { a: 4, en: 'Slow is right', en_hint: "Every fast foot falls through the glass"}],
  ['열쇠공',       '자물쇠공은 문 앞에서 멈추지 않는다. 그래서 개도 못 문다', 6, 'spiral', 20, 16, 12, [['K', .18], ['D', 1], ['K', .4], ['D', 1], ['K', .62], ['D', 1], ['K', .84]], {en: 'The locksmith', en_hint: "A locksmith never stops at a door — so the dog never bites"}],
  ['가벼운 발',    '곡예사는 판을 밟지 않는다', 6, 'rooms', 20, 16, 12, [['P', .2], ['L', 2], ['P', .46]], { a: 3, b: 2, seed: 7, en: 'Light feet', en_hint: "An acrobat never puts weight on a plate"}],
  ['유리와 눈',    '유리를 피해 느리게 가면 카메라가 오래 본다', 6, 'comb', 22, 18, 12, [['G', .20], ['C', .40], ['L', 2], ['G', .62], ['C', .84], ['L', 2]], { a: 4, en: 'Glass and eyes', en_hint: "Go slow to dodge the glass and the cameras watch you longer"}],
  ['마지막 금고',  '여섯 장치가 전부 있다. 무엇을 버릴 것인가', 6, 'rooms', 24, 20, 12, [['G', .12], ['C', .26], ['L', 2], ['P', .42], ['K', .58], ['D', 1], ['G', .74], ['C', .88], ['L', 2]], { a: 4, b: 3, seed: 23, en: 'The last vault', en_hint: "All six devices. What will you give up?"}],
];

export const CAMPAIGN = SPEC.map(([name, hint, ch, kind, w, h, budget, devs, opt], i) => {
  const r = make(kind, w, h, devs, opt || {});
  if (!r) throw new Error(`금고 ${i + 1} (${name}) 생성 실패`);
  // ⚠️영문은 opt 칸에 얹혀 있다(표의 열을 늘리면 36줄을 전부 다시 써야 한다).
  //   여기서 꺼내 주지 않으면 **화면에 undefined 가 뜬다** — 실제로 한 번 그랬다.
  const o = opt || {};
  return { id: `c${String(i + 1).padStart(2, '0')}`, no: i + 1, ch, name, hint,
           en: o.en, en_hint: o.en_hint, kind, budget, grid: r.grid, path: r.path };
});
