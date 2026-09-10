"""조스프로젝트1(주문예약) 자가검증 — 실제 배포본을 브라우저로 몰아본다.

★왜 헤드리스 브라우저인가 — 이 페이지는 내용이 전부 Firestore 에서 오고, 로그인
  게이트·규칙·실행기까지 네 조각이 맞물려야 동작한다. HTML 만 curl 로 봐서는
  '껍데기가 200 이다'밖에 알 수 없다(게시판에서 '56건 통과 중인데 단추가 안 눌리던'
  일을 겪었다). 그래서 **사람이 하는 순서 그대로** 눌러 본다.

⚠️캐시 함정: 매번 새 프로필 + 캐시 끄기. 고정 프로필을 재사용하면 옛 JS 를 그대로
  쓰는 바람에 배포를 의심하게 된다(게시판에서 겪음).
"""
from __future__ import annotations

import os
import sys
import time

from playwright.sync_api import sync_playwright

URL = "https://menewsoft.com/joss/rollingdice/"

# ⚠️★비밀번호를 이 파일에 적지 않는다. **techdecode 는 공개 저장소**라, 여기 박아 두면
#   커밋하는 순간 그대로 공개된다(2026-09-08에 실제로 그렇게 적어 뒀다가 고쳤다).
#   실행: JR_PW=... python3 tools/joss-rollingdice-selftest.py
ID = os.environ.get("JR_ID", "dsl")
PW = os.environ.get("JR_PW", "")
if not PW:
    sys.exit("JR_PW 환경변수에 비밀번호를 넣고 실행하세요. 예) JR_PW=… npm run joss:test")

ok_count = fail_count = 0


def check(name: str, cond, detail: str = "") -> bool:
    global ok_count, fail_count
    if cond:
        ok_count += 1
        print(f"  ✅ {name}")
    else:
        fail_count += 1
        print(f"  ❌ {name} {detail}")
    return bool(cond)


def main() -> int:
    with sync_playwright() as pw:
        br = pw.chromium.launch(headless=True)
        ctx = br.new_context(locale="ko-KR", viewport={"width": 1280, "height": 1000})
        ctx.route("**/*", lambda r: r.continue_())      # 캐시 없이 새로 받게
        page = ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))

        print("\n[1] 페이지 로드 · 잠금 상태")
        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_timeout(3500)
        check("스크립트가 살아 있다(__jrReady)", page.evaluate("() => !!window.__jrReady"))
        check("자물쇠 화면이 보인다", page.locator("#gate").is_visible())
        check("본 화면은 감춰져 있다", not page.locator("#app").is_visible())
        check("noindex 가 걸려 있다",
              page.locator('meta[name=robots]').get_attribute("content") == "noindex, nofollow")

        print("\n[2] 틀린 비밀번호는 막힌다")
        page.fill("#g_id", ID); page.fill("#g_pw", "wrongwrongwrong")
        page.click("#gateForm button[type=submit]")
        page.wait_for_timeout(3000)
        check("여전히 잠겨 있다", not page.locator("#app").is_visible())
        check("오류 문구가 뜬다", "맞지 않습니다" in page.locator("#g_msg").inner_text())

        print("\n[3] 로그인")
        page.fill("#g_pw", PW)
        page.click("#gateForm button[type=submit]")
        page.wait_for_selector("#app:not([hidden])", timeout=25000)
        check("본 화면이 열린다", page.locator("#app").is_visible())

        print("\n[4] 실행기(맥) 생존 표시")
        page.wait_for_timeout(4000)
        wtxt = page.locator("#workerState").inner_text()
        check("실행기가 살아 있다고 표시", "살아 있음" in wtxt, f"→ {wtxt[:70]}")

        print("\n[5] 기본값")
        when = page.input_value("#f_when")
        check("예약 시각 기본값이 자정", when.endswith("00:00"), f"→ {when}")
        check("프리셋이 본 목표 상품", "XXROLDA" in page.input_value("#f_url"))

        print("\n[6] 배송지는 이 화면에서 정할 수 없다")
        check("배송정보 입력칸이 없다",
              page.locator("#f_name, #f_zip, #f_addr").count() == 0)
        check("맥의 배송지 상태가 표시된다",
              "배송지" in page.locator("#shipState").inner_text()
              or "배송정보가 없습니다" in page.locator("#shipState").inner_text(),
              f"→ {page.locator('#shipState').inner_text()[:70]}")

        print("\n[7] 상품 확인 요청 → 맥이 응답")
        page.select_option("#f_preset", label=[o for o in page.locator("#f_preset option")
                                               .all_text_contents() if "연습용" in o][0])
        page.click("#b_check")
        page.wait_for_timeout(1500)
        got = False
        for _ in range(20):
            page.wait_for_timeout(3000)
            txt = page.locator("#list").inner_text()
            if "재고 있음" in txt or "품절" in txt:
                got = True
                break
        check("맥이 상품 정보를 올려줬다", got, f"→ {page.locator('#list').inner_text()[:90]}")
        if got:
            t = page.locator("#list").inner_text()
            check("가격이 표시된다", "9,500" in t, f"→ {t[:90]}")

        print("\n[8] 연습 예약 → 맥이 주문서까지 가고 화면을 보내준다")
        # 지금 시각으로 예약해 즉시 실행되게 한다(연습 모드라 주문은 안 들어간다).
        page.evaluate("""() => {
            const d = new Date(Date.now() - 5000);
            const p = n => String(n).padStart(2,'0');
            document.getElementById('f_when').value =
              `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
        }""")
        check("연습 모드가 기본 선택", page.locator("input[name=jr_mode][value=practice]").is_checked())
        page.click("#b_reserve")
        page.wait_for_timeout(2000)
        check("예약이 접수됐다", "예약했습니다" in page.locator("#note").inner_text(),
              f"→ {page.locator('#note').inner_text()[:70]}")

        done = False
        for _ in range(30):
            page.wait_for_timeout(4000)
            if "연습 완료" in page.locator("#list").inner_text():
                done = True
                break
        check("맥이 연습 주문을 마쳤다", done,
              f"→ {page.locator('#list').inner_text()[:120]}")
        if done:
            check("주문 화면 캡처가 실려 있다", page.locator(".jr-shot img").count() > 0)
            check("진행 기록이 있다", page.locator(".jr-logs").count() > 0)

        print("\n[9] 예약 취소")
        page.evaluate("""() => document.getElementById('f_when').value =
            new Date(Date.now()+3600e3).toISOString().slice(0,16)""")
        page.click("#b_reserve")
        page.wait_for_timeout(3000)
        cancel = page.locator(".jr-cancel").first
        check("취소 버튼이 생겼다", cancel.count() > 0)
        if cancel.count():
            page.on("dialog", lambda d: d.accept())
            cancel.click()
            page.wait_for_timeout(3500)
            check("취소됨으로 바뀐다", "취소됨" in page.locator("#list").inner_text())

        print("\n[10] 나가기 → 다시 잠긴다")
        page.click("#b_out")
        page.wait_for_timeout(2500)
        check("다시 자물쇠 화면", page.locator("#gate").is_visible())

        print("\n[11] 로그인 없이 데이터가 새지 않는가")
        p2 = ctx.new_page()
        leaked = p2.evaluate("""async () => {
          const r = await fetch('https://firestore.googleapis.com/v1/projects/menewsoft-board/'
            + 'databases/(default)/documents/reservations');
          return r.status;
        }""")
        check("비로그인 조회는 거부된다(403)", leaked == 403, f"→ HTTP {leaked}")

        print("\n[12] 규칙이 배송정보 쓰기를 거부하는가")
        # ★화면에서 칸을 없앤 것은 보호가 아니다. F12 로 직접 써 봐서 규칙이 막는지 본다.
        rejected = page.evaluate("""async () => {
          const { getFirestore, collection, addDoc, serverTimestamp } =
            await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
          const { getApp } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js');
          try {
            await addDoc(collection(getFirestore(getApp()), 'reservations'), {
              kind: 'order', status: 'pending', mode: 'practice',
              productUrl: 'https://mtgrollingdice.com/x', quantity: 1, maxPrice: 1,
              runAt: new Date().toISOString(), createdAt: serverTimestamp(),
              shipping: { buyername: '침입자', phone: '010', zipno: '00000', address: '남의집' },
            });
            return 'ALLOWED';
          } catch (e) { return String(e.code || e.message); }
        }""")
        check("배송정보가 포함된 예약은 거부된다", rejected != 'ALLOWED', f"→ {rejected}")

        check("자바스크립트 오류 없음", not errs, f"→ {errs[:2]}")
        ctx.close(); br.close()

    print(f"\n{'='*46}\n통과 {ok_count} · 실패 {fail_count}\n{'='*46}")
    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
