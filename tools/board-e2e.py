#!/usr/bin/env python3
"""게시판 사람 경로 e2e — **로그인한 뒤에 사람이 하는 일**을 처음부터 끝까지 해 본다.

usage: npm run board:e2e            (firebase emulators:exec 가 감싸서 부른다)

★왜 따로 있는가
  `board-selftest.py` 는 **비로그인 방문자**만 본다. 구글 로그인은 자동화할 수 없어서
  (구글이 헤드리스 브라우저를 막는다) 로그인 뒤의 화면 —— 닉네임 정하기, 글쓰기,
  댓글, 수정, 삭제 —— 가 통째로 검증 밖에 있었다. 2026-09-05 로그인 문의를 계기로,
  Firebase **에뮬레이터**에 붙여 그 전부를 사람처럼 눌러 보게 만들었다.
  운영 DB 에는 손대지 않는다(에뮬레이터는 메모리에서 돌고 끝나면 사라진다).

무엇을 확인하는가
  ① 로그인하면 **닉네임 창이 저절로 뜬다** — 닉네임이 없으면 규칙이 글쓰기를 거부하므로,
     창을 안 띄우면 사람은 다 쓰고 나서야 실패를 본다.
  ② 예약어('운영자' 등)와 한 글자 닉네임이 **거부되고 이유가 보인다.**
  ③ 닉네임을 정하면 글쓰기가 **풀린다**(그 전에는 입력칸이 잠겨 있어야 한다).
  ④ 글쓰기 단추가 **팝업 창을 연다**.
  ⑤ 글을 쓰면 **목록에 뜬다**.
  ⑥ 댓글을 달면 보이고 **댓글 수가 함께 오른다**.
  ⑦ 내 글은 **수정·삭제 단추가 보이고 실제로 고쳐진다.**
  ⑧ ★**남의 글에는 수정·삭제가 안 보인다**(다른 계정으로 다시 로그인해 확인).
  ⑨ 공지 분류는 **운영자가 아니면 선택지에 없다.**
  ⑩ 글을 지우면 목록에서 사라진다.
"""
from __future__ import annotations
import json, shutil, subprocess, sys, tempfile, threading, time, urllib.error, urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SERVE_PORT, DBG = 4403, 9337
AUTH_EMU = "http://127.0.0.1:9099"
PROJECT = "menewsoft-board"

# 에뮬레이터 안에서만 쓰는 시험 계정 둘. 운영 계정과 아무 상관이 없다.
USERS = [
    {"email": "tester1@example.com", "pw": "test1234", "nick": "장영실"},
    {"email": "tester2@example.com", "pw": "test1234", "nick": "허준"},
]


def serve(port: int):
    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(DIST), **k)
        def log_message(self, *a):
            pass
    srv = ThreadingHTTPServer(("127.0.0.1", port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def emu_signup(email: str, pw: str) -> str:
    """에뮬레이터에 계정을 만든다. 이미 있으면 그대로 쓴다."""
    url = (f"{AUTH_EMU}/identitytoolkit.googleapis.com/v1/accounts:signUp"
           f"?key=fake-api-key")
    body = json.dumps({"email": email, "password": pw, "returnSecureToken": True}).encode()
    req = urllib.request.Request(url, data=body, method="POST",
                                 headers={"Content-Type": "application/json"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=10).read())["localId"]
    except urllib.error.HTTPError as e:
        if b"EMAIL_EXISTS" in e.read():
            return "(기존 계정)"
        raise


def main() -> int:
    if not DIST.exists():
        sys.exit("dist 가 없습니다 — `npm run build` 를 먼저 돌리세요.")
    # 에뮬레이터가 살아 있는지부터 본다(없이 돌면 운영 DB 를 건드릴 뻔한 것처럼 보인다 —
    # 실제로는 board.js 가 localhost 에서만 붙지만, 검사는 명확히 실패해야 한다).
    try:
        urllib.request.urlopen(f"{AUTH_EMU}/", timeout=3)
    except Exception:
        sys.exit("⛔ 인증 에뮬레이터(9099)가 안 떠 있습니다 — `npm run board:e2e` 로 돌리세요.")

    for u in USERS:
        emu_signup(u["email"], u["pw"])
    serve(SERVE_PORT)
    base = f"http://127.0.0.1:{SERVE_PORT}"
    print(f"  대상: {base}/board/?emu=1  (에뮬레이터)")

    profile = tempfile.mkdtemp(prefix="board-e2e-")
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
        events: list = []
        n = [0]

        def send(method, params=None):
            n[0] += 1
            ws.send(json.dumps({"id": n[0], "method": method, "params": params or {}}))
            while True:
                m = json.loads(ws.recv())
                if m.get("id") == n[0]:
                    return m
                events.append(m)

        def ev(expr, wait=0.0):
            if wait:
                time.sleep(wait)
            r = send("Runtime.evaluate",
                     {"expression": expr, "returnByValue": True, "awaitPromise": True,
                      "userGesture": True})
            return r.get("result", {}).get("result", {}).get("value")

        def js(expr, wait=0.0):
            v = ev(expr, wait)
            return json.loads(v) if v else {}

        def goto(path, wait=5.0):
            send("Page.navigate", {"url": base + path})
            time.sleep(wait)

        send("Runtime.enable"); send("Log.enable"); send("Page.enable")
        send("Network.enable"); send("Network.setCacheDisabled", {"cacheDisabled": True})
        send("Target.setDiscoverTargets", {"discover": True})

        SNAP = """JSON.stringify({
          emu: !!window.__emu,
          auth: (document.getElementById('auth')||{}).innerText||'',
          modal: !!document.getElementById('nickModal'),
          nickMsg: (document.getElementById('nickMsg')||{}).innerText||'',
          titles: [...document.querySelectorAll('#pinned .bd-item, #list .bd-item')]
                    .map(e => e.innerText.replace(/\\s+/g,' ').trim().slice(0,60)),
          writeHint: (document.getElementById('writeHint')||{}).innerText||'',
        })"""

        # ── 1부: 로그인 → 닉네임 ────────────────────────────
        print("\n  ■ 로그인하고 닉네임 정하기")
        goto("/board/?emu=1", 6.0)
        s0 = js(SNAP)
        checks.append(("에뮬레이터에 붙었다(운영 DB 아님)", s0["emu"] is True))

        ev(f"window.__emuSignIn('{USERS[0]['email']}','{USERS[0]['pw']}')")
        s1 = js(SNAP, 4.0)
        print(f"    로그인 후: 닉네임 창 {s1['modal']} · 안내 {s1['writeHint'][:30]!r}")
        checks.append(("★로그인하면 닉네임 창이 저절로 뜬다", s1["modal"] is True))

        # 예약어는 거부돼야 한다 — 규칙에도 있지만 사람은 이유를 화면에서 봐야 한다.
        ev("document.getElementById('nickInput').value='운영자';"
           "document.getElementById('nickSave').click()")
        s2 = js(SNAP, 2.0)
        print(f"    '운영자' 시도: {s2['nickMsg'][:40]!r}")
        checks.append(("★예약어 닉네임을 이유와 함께 거부한다",
                       bool(s2["nickMsg"].strip()) and s2["modal"] is True))

        ev("document.getElementById('nickInput').value='가';"
           "document.getElementById('nickSave').click()")
        s3 = js(SNAP, 2.0)
        checks.append(("한 글자 닉네임을 거부한다",
                       bool(s3["nickMsg"].strip()) and s3["modal"] is True))

        ev(f"document.getElementById('nickInput').value='{USERS[0]['nick']}';"
           "document.getElementById('nickSave').click()")
        s4 = js(SNAP, 4.0)
        print(f"    닉네임 확정: {s4['auth'][:40]!r}")
        checks += [
            ("닉네임을 정하면 창이 닫힌다", s4["modal"] is False),
            ("★닉네임이 화면에 반영된다", USERS[0]["nick"] in s4["auth"]),
        ]

        # ── 2부: 글쓰기 ─────────────────────────────────────
        print("\n  ■ 글쓰기")
        events.clear()
        ev("window.__opened=[];const _o=window.open;"
           "window.open=function(u){window.__opened.push(String(u||''));return _o.apply(window,arguments)};")
        ev("document.getElementById('writeToggle').click()")
        opened = ev("JSON.stringify(window.__opened||[])", 2.0)
        print(f"    글쓰기 단추 → 팝업 {opened}")
        checks.append(("★글쓰기 단추가 팝업 창을 연다",
                       bool(json.loads(opened or "[]"))))

        goto("/board/write/", 5.0)
        cats = ev("JSON.stringify([...document.querySelectorAll('#cat option')].map(o=>o.textContent))", 1.0)
        locked = ev("document.getElementById('title').disabled")
        print(f"    분류 선택지 {cats} · 제목칸 잠김 {locked}")
        checks += [
            ("★닉네임이 있으면 입력칸이 풀린다", locked is False),
            ("★공지는 일반 사용자 선택지에 없다", "공지" not in (cats or "")),
        ]

        TITLE = "자가검증이 쓴 글 " + time.strftime("%H:%M:%S")
        ev(f"""(() => {{
          const t = document.getElementById('title'), b = document.getElementById('body');
          t.value = {json.dumps(TITLE)}; t.dispatchEvent(new Event('input', {{bubbles:true}}));
          b.value = '사람이 하는 일을 끝까지 해 보는 검사입니다. 이 글은 검사가 지웁니다.';
          b.dispatchEvent(new Event('input', {{bubbles:true}}));
          document.getElementById('writeForm').requestSubmit();
        }})()""")
        time.sleep(5.0)

        goto("/board/", 5.0)
        s5 = js(SNAP)
        print(f"    목록 {len(s5['titles'])}건 · 첫 글 {s5['titles'][0][:40]!r}")
        checks.append(("★쓴 글이 목록에 뜬다", any(TITLE[:20] in t for t in s5["titles"])))

        # ── 3부: 상세 · 댓글 · 수정 ─────────────────────────
        print("\n  ■ 댓글과 수정")
        href = ev("""(() => {const a=[...document.querySelectorAll('#pinned .bd-item a, #list .bd-item a')]
                     .find(a=>a.innerText.includes(%s)); return a ? a.getAttribute('href') : '';})()"""
                  % json.dumps(TITLE[:20]))
        if not href:
            checks.append(("상세로 갈 내 글이 있다", False))
            raise SystemExit
        goto(href, 5.0)

        DETAIL = """JSON.stringify({
          title: (document.querySelector('.bd-post-title')||{}).innerText||'',
          actions: ((document.querySelector('.bd-post-actions')||{}).innerText||'').trim(),
          comments: (document.getElementById('commentsTitle')||{}).innerText||'',
          citems: document.querySelectorAll('.bd-citem').length,
          ctext: [...document.querySelectorAll('.bd-citem')].map(e=>e.innerText.slice(0,50)),
          delLinks: document.querySelectorAll('[data-del]').length,
        })"""
        d0 = js(DETAIL)
        print(f"    내 글: 단추 {d0['actions']!r} · {d0['comments']}")
        checks += [
            ("★내 글에는 수정·삭제가 보인다", "수정" in d0["actions"] and "삭제" in d0["actions"]),
        ]

        CMT = "검사가 단 댓글입니다."
        ev(f"""(() => {{
          const b = document.getElementById('cbody');
          b.value = {json.dumps(CMT)}; b.dispatchEvent(new Event('input', {{bubbles:true}}));
          document.getElementById('cform').requestSubmit();
        }})()""")
        d1 = js(DETAIL, 5.0)
        print(f"    댓글 후: {d1['comments']} · 목록 {d1['citems']}개")
        checks += [
            ("★댓글이 화면에 붙는다", any(CMT in c for c in d1["ctext"])),
            ("★댓글 수 표시가 함께 오른다", "1" in d1["comments"]),
            ("내 댓글은 지울 수 있다", d1["delLinks"] >= 1),
        ]

        NEWT = TITLE + " (고침)"
        ev("document.getElementById('editBtn').click()")
        ev(f"""(() => {{
          const t = document.getElementById('etitle');
          t.value = {json.dumps(NEWT)}; t.dispatchEvent(new Event('input', {{bubbles:true}}));
          document.getElementById('editForm').requestSubmit();
        }})()""", 1.5)
        d2 = js(DETAIL, 5.0)
        print(f"    수정 후 제목: {d2['title'][:44]!r}")
        checks.append(("★글 수정이 실제로 반영된다", "고침" in d2["title"]))

        # ── 4부: 남의 글 ────────────────────────────────────
        print("\n  ■ 다른 사람 계정으로 보기")
        ev("(async () => { const m = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');"
           " await m.signOut(m.getAuth()); })()")
        goto(href, 5.0)
        ev(f"window.__emuSignIn('{USERS[1]['email']}','{USERS[1]['pw']}')")
        time.sleep(4.0)
        ev(f"(document.getElementById('nickInput')||{{}}).value='{USERS[1]['nick']}';"
           "document.getElementById('nickSave')?.click()", 1.0)
        d3 = js(DETAIL, 4.0)
        print(f"    남의 글: 단추 {d3['actions']!r} · 댓글 삭제 링크 {d3['delLinks']}개")
        checks += [
            ("★★남의 글에는 수정·삭제가 안 보인다", d3["actions"] == ""),
            ("★★남의 댓글은 지울 수 없다", d3["delLinks"] == 0),
        ]

        # ── 5부: 삭제 ───────────────────────────────────────
        print("\n  ■ 원래 글쓴이가 지우기")
        ev("(async () => { const m = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');"
           " await m.signOut(m.getAuth()); })()")
        goto(href, 4.0)
        ev(f"window.__emuSignIn('{USERS[0]['email']}','{USERS[0]['pw']}')")
        time.sleep(4.0)
        ev("window.confirm = () => true; document.getElementById('delBtn').click()")
        time.sleep(5.0)
        goto("/board/", 5.0)
        s6 = js(SNAP)
        checks.append(("★지운 글이 목록에서 사라진다",
                       not any(TITLE[:20] in t for t in s6["titles"])))
        print(f"    삭제 후 목록 {len(s6['titles'])}건")

    except SystemExit:
        pass
    finally:
        try:
            ws.settimeout(0.4)
            while True:
                try:
                    events.append(json.loads(ws.recv()))
                except Exception:
                    break
            fatal = [str(e["params"]["exceptionDetails"].get("text"))[:200]
                     for e in events if e.get("method") == "Runtime.exceptionThrown"]
            checks.append(("잡히지 않은 예외 없음", not fatal))
            if fatal:
                print("\n  ⛔ 예외:")
                for e in dict.fromkeys(fatal):
                    print("   ·", e)
        except Exception:
            pass
        proc.terminate(); proc.wait(timeout=10)
        shutil.rmtree(profile, ignore_errors=True)

    print("\n  ■ 결과")
    for name, ok in checks:
        print(f"    {'OK  ' if ok else 'FAIL'} {name}")
    bad = sum(1 for _, ok in checks if not ok)
    print(f"\n{'✅ 전부 통과' if not bad else f'⛔ {bad}건 실패'} ({len(checks)}건 검사)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
