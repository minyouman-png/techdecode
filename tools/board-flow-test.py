#!/usr/bin/env python3
"""게시판 — **로그인한 사람이 하는 일 전부**를 실제로 눌러 보는 검증.

실행: cd ~/techdecode && npm run board:flow      (에뮬레이터는 스크립트가 띄운다)

★왜 따로 있는가
  `board-selftest.py` 는 **비로그인 방문자**만 본다. 진짜 구글 계정으로는 헤드리스에서
  로그인할 수 없기 때문이다. 그래서 2026-09-05 까지 **로그인 이후의 화면은 검증이 0** 이었다.
  닉네임을 정하고 · 글을 쓰고 · 댓글을 달고 · 고치고 · 지우는 그 전부가 한 번도 눌린 적이 없다.
  여기서는 Firebase 에뮬레이터에 붙어(`?emu=1`) 그 경로를 끝까지 돌린다.
  규칙(firestore.rules)도 에뮬레이터에 실제로 얹히므로 **권한까지 진짜로** 걸린다.

⚠️`?emu=1` 은 localhost 에서만 먹는다(board.js 의 USE_EMU). 공개 사이트에는 영향이 없다.
⚠️에뮬레이터 포트는 Firestore 8085 · Auth 9099 (8080 은 쇼츠공장 python 서버가 쓴다).
"""
from __future__ import annotations
import json, os, shutil, subprocess, sys, tempfile, threading, time, urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT, DBG = 4403, 9337
EMAIL, PW = "flow-tester@example.com", "test-1234"
NICK = "검증나그네"          # 사람이 쓰지 않을 이름 — 실제 닉네임과 겹치지 않게.


def serve(port: int):
    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(DIST), **k)
        def log_message(self, *a):
            pass
    srv = ThreadingHTTPServer(("127.0.0.1", port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def run() -> int:
    if not DIST.exists():
        sys.exit("dist 가 없습니다 — `npm run build` 를 먼저 돌리세요.")
    serve(PORT)
    base = f"http://127.0.0.1:{PORT}"
    profile = tempfile.mkdtemp(prefix="board-flow-")
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={DBG}",
         "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check",
         f"--user-data-dir={profile}", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    checks: list[tuple[str, bool]] = []
    try:
        import websocket  # type: ignore
        for _ in range(60):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{DBG}/json", timeout=1); break
            except Exception:
                time.sleep(0.25)
        tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{DBG}/json").read())
        page = next(t for t in tabs if t["type"] == "page")
        ws = websocket.create_connection(page["webSocketDebuggerUrl"],
                                         origin="http://127.0.0.1", suppress_origin=True)
        events: list = []; n = [0]

        def send(method, params=None):
            n[0] += 1
            ws.send(json.dumps({"id": n[0], "method": method, "params": params or {}}))
            while True:
                m = json.loads(ws.recv())
                if m.get("id") == n[0]:
                    return m
                events.append(m)

        def ev(expr, await_promise=False):
            r = send("Runtime.evaluate",
                     {"expression": expr, "returnByValue": True,
                      "awaitPromise": await_promise, "userGesture": True})
            res = r.get("result", {})
            if "exceptionDetails" in res:
                return {"__error": str(res["exceptionDetails"].get("text"))[:160]}
            return res.get("result", {}).get("value")

        def go(path, wait=5.0):
            send("Page.navigate", {"url": base + path})
            time.sleep(wait)

        def wait_for(expr, secs=15.0, step=0.5):
            end = time.time() + secs
            while time.time() < end:
                if ev(expr) is True:
                    return True
                time.sleep(step)
            return False

        send("Runtime.enable"); send("Log.enable"); send("Page.enable")
        send("Network.enable"); send("Network.setCacheDisabled", {"cacheDisabled": True})

        # ── 1. 에뮬레이터에 붙어 로그인 ───────────────────────────
        print("\n  ■ 로그인")
        go("/board/?emu=1", 6.0)
        emu_on = wait_for("window.__emuOn === true", 20)
        checks.append(("에뮬레이터 통로가 열린다(?emu=1)", emu_on))
        if not emu_on:
            print("    ⛔ 에뮬레이터에 붙지 못했습니다 — 이후 검사를 건너뜁니다.")
            raise SystemExit(1)

        uid = ev(f"window.__emuSignIn({EMAIL!r}, {PW!r})", await_promise=True)
        print(f"    로그인 uid={uid}")
        checks.append(("★이메일 계정으로 실제 로그인된다", bool(uid) and "__error" not in str(uid)))

        # ── 2. 닉네임 — 처음 온 사람에게 반드시 떠야 한다 ─────────
        print("\n  ■ 닉네임")
        appeared = wait_for("!!document.getElementById('nickModal')", 15)
        checks.append(("★처음 로그인하면 닉네임 창이 뜬다", appeared))
        if appeared:
            ev(f"""(() => {{
              const i = document.getElementById('nickInput');
              i.value = {NICK!r};
              i.dispatchEvent(new Event('input', {{bubbles:true}}));
              document.getElementById('nickSave').click();
            }})()""")
            gone = wait_for("!document.getElementById('nickModal')", 15)
            checks.append(("★닉네임을 저장하면 창이 닫힌다", gone))
            shown = wait_for(f"(document.getElementById('auth')||{{}}).innerText.includes({NICK!r})", 15)
            checks.append(("★저장한 닉네임이 화면에 표시된다", shown))

        # ── 3. 글쓰기 ────────────────────────────────────────────
        print("\n  ■ 글쓰기")
        stamp = str(int(time.time()))
        title = f"검증 글 {stamp}"
        body = f"이 글은 board-flow-test 가 {stamp} 에 남긴 것입니다. 자동으로 지웁니다."
        go("/board/write/?cat=free", 6.0)
        ready = wait_for("!document.getElementById('title').disabled", 20)
        checks.append(("★로그인 상태면 글쓰기 폼이 열린다(잠금 해제)", ready))
        if ready:
            ev(f"""(() => {{
              const t = document.getElementById('title'), b = document.getElementById('body');
              t.value = {title!r}; t.dispatchEvent(new Event('input', {{bubbles:true}}));
              b.value = {body!r};  b.dispatchEvent(new Event('input', {{bubbles:true}}));
              document.getElementById('writeForm').requestSubmit();
            }})()""")
            time.sleep(6.0)
            # ★실패했을 때 '왜' 를 남긴다 — 폼이 화면에 적어 주는 그 문장이 제일 정확하다.
            msg = ev("(document.getElementById('formMsg')||{}).textContent || ''")
            print(f"    등록 결과: {msg!r} · 주소 {ev('location.pathname')}")
            checks.append(("★글 등록이 실패 메시지를 남기지 않는다", "실패" not in str(msg)))

        go("/board/?cat=free", 7.0)
        listed = wait_for(f"[...document.querySelectorAll('#list .bd-item')].some(e => e.innerText.includes({title!r}))", 20)
        # ★안 보이면 '화면에 대신 무엇이 있는지' 를 남긴다 — 빈 목록인지 오류 안내인지가 갈린다.
        seen = ev("((document.getElementById('list')||{}).textContent||'').trim().slice(0,120)")
        cnt = ev("document.querySelectorAll('#list .bd-item').length")
        print(f"    목록에 보이는가: {listed} · 항목 {cnt}건 · 화면 {seen!r}")
        checks.append(("★쓴 글이 목록에 나타난다", listed))

        href = ev(f"""(() => {{
          const a = [...document.querySelectorAll('#list .bd-item a')]
            .find(a => a.innerText.includes({title!r}));
          return a ? a.getAttribute('href') : '';
        }})()""")
        checks.append(("★쓴 글의 상세 주소가 잡힌다", bool(href)))

        # ── 4. 댓글 ─────────────────────────────────────────────
        print("\n  ■ 댓글")
        if href:
            go(href, 7.0)
            title_ok = wait_for(f"(document.querySelector('.bd-post-title')||{{}}).innerText.includes({title!r})", 20)
            checks.append(("★상세에 방금 쓴 글이 열린다", title_ok))
            checks.append(("★내 글에는 수정·삭제가 보인다",
                           ev("!!document.getElementById('editBtn') && !!document.getElementById('delBtn')") is True))

            ctext = f"검증 댓글 {stamp}"
            ev(f"""(() => {{
              const c = document.getElementById('cbody');
              c.value = {ctext!r}; c.dispatchEvent(new Event('input', {{bubbles:true}}));
              document.getElementById('cform').requestSubmit();
            }})()""")
            posted = wait_for(f"[...document.querySelectorAll('.bd-citem')].some(e => e.innerText.includes({ctext!r}))", 20)
            checks.append(("★댓글이 등록되고 목록에 붙는다", posted))
            cnt_ok = wait_for("(() => {const m=(document.getElementById('commentsTitle')||{}).innerText.match(/(\\d+)/);"
                              "return !!m && Number(m[1]) === document.querySelectorAll('.bd-citem').length;})()", 15)
            checks.append(("★댓글 수 표시가 실제 개수와 맞는다", cnt_ok))

            # ── 5. 수정 ──────────────────────────────────────────
            print("\n  ■ 수정")
            newbody = body + " (수정됨)"
            ev("document.getElementById('editBtn').click()")
            edit_open = wait_for("!!document.getElementById('editForm')", 15)
            checks.append(("★수정 창이 열린다", edit_open))
            if edit_open:
                ev(f"""(() => {{
                  const b = document.getElementById('ebody');
                  b.value = {newbody!r}; b.dispatchEvent(new Event('input', {{bubbles:true}}));
                  document.getElementById('editForm').requestSubmit();
                }})()""")
                saved = wait_for("(document.querySelector('.bd-post-body')||{}).innerText.includes('(수정됨)')", 20)
                checks.append(("★수정한 내용이 반영된다", saved))

            # ── 6. 댓글 삭제 ─────────────────────────────────────
            print("\n  ■ 삭제")
            ev("window.confirm = () => true; window.alert = () => {};")
            before = ev("document.querySelectorAll('.bd-citem').length") or 0
            ev("(document.querySelector('.bd-citem [data-del]')||{click(){}}).click()")
            cdel = wait_for(f"document.querySelectorAll('.bd-citem').length < {before}", 20)
            checks.append(("★내 댓글을 지울 수 있다", cdel))

            # ── 7. 글 삭제 ───────────────────────────────────────
            ev("window.confirm = () => true; window.alert = () => {};")
            ev("document.getElementById('delBtn').click()")
            time.sleep(7.0)
            go("/board/?cat=free", 7.0)
            gone = wait_for(f"![...document.querySelectorAll('#list .bd-item')].some(e => e.innerText.includes({title!r}))", 20)
            checks.append(("★지운 글은 목록에서 사라진다", gone))

        # ── 8. 로그아웃 ─────────────────────────────────────────
        print("\n  ■ 로그아웃")
        go("/board/", 6.0)
        wait_for("!!document.getElementById('logoutBtn')", 15)
        ev("(document.getElementById('logoutBtn')||{click(){}}).click()")
        out = wait_for("!!document.getElementById('loginBtn')", 20)
        checks.append(("★로그아웃하면 다시 로그인 단추로 돌아간다", out))
        go("/board/write/", 6.0)
        locked = wait_for("document.getElementById('title').disabled === true", 20)
        checks.append(("★로그아웃 뒤 글쓰기 폼은 잠긴다", locked))

        # ── 잡히지 않은 예외 ────────────────────────────────────
        ws.settimeout(0.4)
        while True:
            try:
                events.append(json.loads(ws.recv()))
            except Exception:
                break
        fatal = [str(e["params"]["exceptionDetails"].get("text"))[:200]
                 for e in events if e.get("method") == "Runtime.exceptionThrown"]
        checks.append(("잡히지 않은 예외 없음", not fatal))
        errs = []
        for e in events:
            if e.get("method") == "Runtime.consoleAPICalled" and e["params"]["type"] == "error":
                errs.append("".join(str(a.get("value", "")) for a in e["params"]["args"])[:200])
            if e.get("method") == "Log.entryAdded" and e["params"]["entry"]["level"] == "error":
                errs.append(e["params"]["entry"]["text"][:200])
        if errs:
            print("\n  콘솔 에러(참고):")
            for e in dict.fromkeys(errs):
                print("   ·", e)
        if fatal:
            print("\n  ⛔ 예외:")
            for e in dict.fromkeys(fatal):
                print("   ·", e)
    except SystemExit:
        pass
    finally:
        proc.terminate(); proc.wait(timeout=10)
        shutil.rmtree(profile, ignore_errors=True)

    print("\n  ■ 결과")
    for name, ok in checks:
        print(f"    {'OK  ' if ok else 'FAIL'} {name}")
    bad = sum(1 for _, ok in checks if not ok)
    print(f"\n{'✅ 전부 통과' if not bad else f'⛔ {bad}건 실패'} ({len(checks)}건 검사)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(run())
