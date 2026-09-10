#!/usr/bin/env python3
"""게시판(/board/) 자가 검증 — 헤드리스 크롬으로 실제 Firestore 를 읽어 본다.

usage: python3 tools/board-selftest.py [--live]   (--live 는 dist 대신 실제 공개 주소를 본다)

무엇을 확인하는가:
  ① Firebase SDK(gstatic 원격 import)가 로드되는가 — Astro 가 번들에 손댔으면 여기서 깨진다.
  ② **비로그인 방문자가 목록을 읽는가** — 규칙이 실제로 배포됐는지를 네트워크로 확인한다.
  ③ **분류 탭이 주소로 열리는가** — 필터 질의는 `cat ASC + createdAt DESC` 복합색인을 쓴다.
     색인이 없거나 만들어지는 중이면 **전체 탭은 멀쩡한데 필터 탭만** failed-precondition 으로 죽는다.
  ④ ★★**탭을 '클릭'했을 때도 목록이 바뀌는가** — 주소로 여는 것과 클릭은 **다른 코드 경로**다
     (클릭은 pushState 로 페이지를 새로 부르지 않는다). 2026-08-28 에 클릭 핸들러 안의 죽은
     함수 호출 하나 때문에 **어느 탭을 눌러도 전체 목록이 그대로 나오는** 버그가 있었는데,
     그때 이 검사가 없어서(주소로만 열어 봐서) 사장님이 먼저 발견하셨다.
  ⑤ ★**콘솔에 잡히지 않은 예외가 없는가** — 위 버그의 정체가 그거였다. 예전에는 에러를
     출력만 하고 통과시켰다. 이제는 **실패로 센다.**
  ⑥ 들어가자마자 목록이 먼저 보이는가 — 글쓰기 입력칸이 목록 위를 차지하면 안 된다.
  ⑦ **글 상세**가 제목·본문·댓글을 그리는가, 비로그인에게 수정·삭제 단추가 안 보이는가.
  ⑧ **좁은 화면(360px)에서 가로 스크롤이 생기지 않는가** — 게시판은 제목이 길다.
     ⚠️헤드리스 크롬은 `--window-size` 로 500px 아래로 못 내려간다. CDP 로 진짜 360px 을 만든다.

  ★★2026-09-05 추가 — "로그인이 눌리지 않는다" 문의로 드러난 구멍.
     그날 이 검사는 **56건 전부 통과**하고 있었다. 로그인 단추가 '있는지'만 봤지
     **눌러 본 적이 한 번도 없었기** 때문이다. 아래 둘을 새로 본다.

  ⑨ 로그인 경로 — 단추를 실제로 누른다.
     · 누르면 **반드시 무언가 일어난다**(팝업이 열리거나 · 구글로 가거나 · 안내가 뜨거나).
       아무 일도 안 일어나는 것이 곧 그 문의의 정체였다.
     · **팝업이 막힌 환경**(window.open→null)에서도 구글 로그인 화면까지 간다.
     · **리다이렉트가 조용히 끊긴 경우** 안내가 뜬다. 우리 인증 핸들러는
       `menewsoft-board.firebaseapp.com` 이라 menewsoft.com 과 출처가 다르고,
       사파리·iOS 는 그 왕복을 끊는다. 그러면 구글까지 갔다 왔는데 **로그아웃 그대로**다.
     · **인앱 브라우저**(카카오톡 등)에서는 구글이 UA 를 보고 거부하므로,
       구글로 보내지 말고 먼저 안내해야 한다.
     · 비로그인으로 **글쓰기**를 눌러도 먹통이 아니다.

  ⑩ 장애 주입 — 되는 네트워크만 보지 않는다.
     · `www.gstatic.com` 차단(광고 차단 확장·사내망) → board.js 는 **모듈**이라 통째로 죽고
       단추는 보이는데 안 눌린다. 감시견 안내가 뜨고 죽은 단추가 잠기는지 본다.
     · Firestore 차단 → 목록이 '불러오는 중' 에서 영영 멈추지 않는지 본다.
"""
from __future__ import annotations
import json, shutil, subprocess, sys, tempfile, threading, time, urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SERVE_PORT, DBG = 4402, 9336
TABS = [("", "전체"), ("notice", "공지"), ("free", "자유"), ("qna", "질문")]

# 페이지 상태를 한 번에 긁어 오는 식. 여러 곳에서 재사용한다.
SNAPSHOT = """
  JSON.stringify({
    list: (document.getElementById('list')||{}).textContent.trim().slice(0,120),
    auth: (document.getElementById('auth')||{}).textContent.trim().slice(0,80),
    hasLoginBtn: !!document.getElementById('loginBtn'),
    tabOn: (document.querySelector('.bd-tabs a.on')||{}).textContent||'',
    tabCount: document.querySelectorAll('.bd-tabs a').length,
    ids: [...document.querySelectorAll('#pinned .bd-item a, #list .bd-item a')]
           .map(a => new URL(a.href).searchParams.get('id')),
    tags: [...document.querySelectorAll('#list .bd-item .bd-tag')].map(e => e.textContent.trim()),
    shown: document.querySelectorAll('#pinned .bd-item, #list .bd-item').length,
    listShown: document.querySelectorAll('#list .bd-item').length,
    url: location.pathname + location.search,
    inputAboveList: (() => {
      const first = document.querySelector('#pinned .bd-item, #list .bd-item, #list .bd-empty');
      if (!first) return false;
      const y = first.getBoundingClientRect().top;
      return [...document.querySelectorAll('main textarea, main input, main select')]
        .some(el => el.getBoundingClientRect().top < y);
    })(),
    writeBtn: !!document.getElementById('writeToggle'),
    popupHelpHidden: (document.getElementById('popupHelp')||{}).hidden,
  })"""


def serve(port: int):
    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(DIST), **k)
        def log_message(self, *a):
            pass
    srv = ThreadingHTTPServer(("127.0.0.1", port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def main() -> int:
    live = "--live" in sys.argv
    if live:
        base = "https://menewsoft.com"
    else:
        if not DIST.exists():
            sys.exit("dist 가 없습니다 — `npm run build` 를 먼저 돌리세요.")
        serve(SERVE_PORT)
        base = f"http://127.0.0.1:{SERVE_PORT}"
    print(f"  대상: {base}/board/")

    # ⚠️★프로필을 재사용하면 브라우저 캐시가 옛 HTML 을 물고 있다(쿼리스트링은 캐시 키가 따로라
    #   `/board/` 는 새것, `/board/?cat=x` 는 옛것인 상태가 생긴다). 매번 새 프로필 + 캐시 비활성.
    profile = tempfile.mkdtemp(prefix="board-selftest-")
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={DBG}",
         "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check",
         f"--user-data-dir={profile}", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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

        def snap():
            r = send("Runtime.evaluate", {"expression": SNAPSHOT, "returnByValue": True})
            return json.loads(r["result"]["result"]["value"])

        send("Runtime.enable"); send("Log.enable"); send("Page.enable")
        send("Network.enable"); send("Network.setCacheDisabled", {"cacheDisabled": True})

        checks: list[tuple[str, bool]] = []

        # ── 1부: 주소로 직접 열기 ──────────────────────────────
        print("\n  ■ 주소로 직접 열기")
        states = {}
        for key, label in TABS:
            send("Page.navigate", {"url": f"{base}/board/" + (f"?cat={key}" if key else "")})
            time.sleep(6.0 if not states else 4.0)   # 첫 방문은 원격 SDK 내려받기가 있다
            states[key] = st = snap()
            print(f"    [{label}] 글 {st['shown']}건 · {st['list'][:44]!r}")
        state = states[""]

        checks += [
            ("SDK 로드 · 스크립트 실행", "불러오는 중" not in state["list"]),
            ("비로그인 목록 읽기", "불러오지 못했습니다" not in state["list"]),
            ("로그인 버튼 표시", state["hasLoginBtn"]),
            ("분류 탭 4개", state["tabCount"] == 4),
            ("글쓰기 버튼 존재", state["writeBtn"]),
            ("팝업 안내는 평소 숨어 있음", state["popupHelpHidden"] is True),
        ]
        for key, label in TABS:
            st = states[key]
            checks += [
                (f"[{label}] 목록 읽기",
                 "불러오지 못했습니다" not in st["list"] and "불러오는 중" not in st["list"]),
                (f"[{label}] 탭 선택 표시", st["tabOn"].strip() == label),
                (f"[{label}] 글 중복 없음", len(st["ids"]) == len(set(st["ids"]))),
                (f"[{label}] 글 또는 안내문 표시", st["shown"] > 0 or "없습니다" in st["list"]),
                (f"[{label}] 목록이 먼저 (입력칸 없음)", not st["inputAboveList"]),
            ]
            # ★분류가 실제로 걸러졌는가. '전체'는 섞여 있는 게 정상이라 제외.
            if key:
                checks.append((f"[{label}] 그 분류만 나온다",
                               bool(st["tags"]) and all(t == label for t in st["tags"])))

        # ── 2부: 탭을 실제로 클릭 ────────────────────────────
        # ★주소로 여는 것과 다른 코드 경로다(pushState — 페이지를 새로 부르지 않는다).
        print("\n  ■ 탭 클릭 (한 번 연 페이지에서 전환)")
        send("Page.navigate", {"url": f"{base}/board/"})
        time.sleep(5.0)
        base_ids = snap()["ids"]
        clicked = {}
        for key, label in TABS[1:] + [TABS[0]]:
            send("Runtime.evaluate", {"expression":
                 f"document.querySelector('.bd-tabs a[data-cat=\"{key}\"]').click()"})
            time.sleep(3.0)
            clicked[key] = st = snap()
            print(f"    [{label}] 클릭 → 글 {st['listShown']}건 · 주소 {st['url']}")
            checks += [
                (f"클릭 [{label}] 주소가 바뀐다",
                 st["url"] == ("/board/" + (f"?cat={key}" if key else ""))),
                (f"클릭 [{label}] 탭 선택 표시", st["tabOn"].strip() == label),
                (f"클릭 [{label}] 글 중복 없음", len(st["ids"]) == len(set(st["ids"]))),
            ]
            if key:
                checks.append((f"★클릭 [{label}] 그 분류만 나온다",
                               bool(st["tags"]) and all(t == label for t in st["tags"])))

        # ★핵심: 클릭으로 필터가 걸리면 '전체'와 목록이 달라야 한다.
        #   달라지지 않으면 reload() 가 안 돈 것이다 — 그게 2026-08-28 버그였다.
        checks.append(("★클릭해도 목록이 그대로가 아니다(필터 동작)",
                       any(clicked[k]["ids"] != base_ids for k, _ in TABS[1:])))

        # 뒤로가기(popstate)도 같은 경로를 쓴다.
        send("Page.navigate", {"url": f"{base}/board/?cat=qna"}); time.sleep(4.0)
        send("Runtime.evaluate", {"expression": "history.back()"}); time.sleep(3.0)
        back = snap()
        checks.append(("뒤로가기로 돌아온 탭이 맞다", back["tabOn"].strip() in ("전체", "질문")))

        # ── 3부: 글 상세 ─────────────────────────────────────
        print("\n  ■ 글 상세")
        send("Page.navigate", {"url": f"{base}/board/"}); time.sleep(5.0)
        first = send("Runtime.evaluate", {"returnByValue": True, "expression":
            "(document.querySelector('#pinned .bd-item a, #list .bd-item a')||{}).href||''"}
            )["result"]["result"]["value"]
        if not first:
            checks.append(("상세로 갈 글이 있다", False))
        else:
            send("Page.navigate", {"url": first}); time.sleep(5.0)
            d = json.loads(send("Runtime.evaluate", {"returnByValue": True, "expression": """
              JSON.stringify({
                cat: (document.querySelector('.bd-post-cat')||{}).innerText||'',
                title: (document.querySelector('.bd-post-title')||{}).innerText||'',
                body: ((document.querySelector('.bd-post-body')||{}).innerText||'').length,
                comments: (document.getElementById('commentsTitle')||{}).innerText||'',
                citems: document.querySelectorAll('.bd-citem').length,
                actions: ((document.querySelector('.bd-post-actions')||{}).innerText||'').trim(),
                delLinks: document.querySelectorAll('[data-del]').length,
                cbtn: (document.getElementById('cbtn')||{}).innerText||'',
              })"""})["result"]["result"]["value"])
            print(f"    {d['cat']} · {d['title'][:30]} · 본문 {d['body']}자 · {d['comments']}")
            m = __import__('re').search(r'(\d+)', d['comments'])
            checks += [
                ("상세: 제목이 보인다", bool(d["title"].strip())),
                ("상세: 본문이 보인다", d["body"] > 10),
                ("상세: 분류 배지", bool(d["cat"].strip())),
                ("상세: 댓글 수와 실제 댓글 개수가 같다",
                 bool(m) and int(m.group(1)) == d["citems"]),
                ("★상세: 비로그인에게 수정·삭제 없음", d["actions"] == ""),
                ("★상세: 비로그인에게 댓글 삭제 없음", d["delLinks"] == 0),
                ("상세: 비로그인은 로그인 안내", "로그인" in d["cbtn"]),
            ]

        # ── 4부: 좁은 화면 ───────────────────────────────────
        print("\n  ■ 좁은 화면(360px)")
        send("Emulation.setDeviceMetricsOverride",
             {"width": 360, "height": 780, "deviceScaleFactor": 2, "mobile": True})
        for path, label in [("/board/", "목록"), (first.replace(base, "") if first else "/board/", "상세")]:
            send("Page.navigate", {"url": base + path}); time.sleep(4.5)
            w = json.loads(send("Runtime.evaluate", {"returnByValue": True, "expression":
                "JSON.stringify({doc: document.documentElement.scrollWidth, win: innerWidth})"}
                )["result"]["result"]["value"])
            over = w["doc"] - w["win"]
            print(f"    {label}: 문서 {w['doc']}px / 화면 {w['win']}px" + (f"  ⛔ {over}px 넘침" if over > 1 else ""))
            checks.append((f"360px [{label}] 가로 스크롤 없음", over <= 1))
        send("Emulation.clearDeviceMetricsOverride")

        # ── 5부: 로그인 경로 ─────────────────────────────────
        # ★여기가 2026-09-05 문의로 생긴 부분이다. 그 전까지 이 검사는 로그인 단추가
        #   '있는지'만 봤다. 있는 것과 눌리는 것은 다르다.
        print("\n  ■ 로그인 경로")

        # 클릭이 무엇을 했는지 남기려면 window.open 과 alert 을 가로채 둬야 한다.
        # (팝업이 열리면 창 주소가, 리다이렉트면 location 이, 실패면 안내가 증거다.)
        HOOK = """
          window.__opened = [];
          const _open = window.open;
          window.open = function (u) { window.__opened.push(String(u || '')); return _open.apply(window, arguments); };
          window.__alerts = []; window.alert = (m) => window.__alerts.push(String(m));
        """
        AUTH = """JSON.stringify({
          problem: (() => { const b = document.getElementById('authProblem');
                            return b && !b.hidden ? b.innerText : ''; })(),
          dead: (() => { const b = document.getElementById('bdDead'); return b ? b.innerText : ''; })(),
          url: location.href,
          opened: window.__opened || [],
          alerts: window.__alerts || [],
          writeDisabled: !!(document.getElementById('writeToggle') || {}).disabled,
          hasLoginBtn: !!document.getElementById('loginBtn'),
          listText: ((document.getElementById('list') || {}).textContent || '').trim().slice(0, 80),
        })"""

        def authsnap():
            # 클릭이 페이지를 구글로 넘겨 버리면 위 식이 통째로 못 돈다. 그때는 주소만 읽는다.
            r = send("Runtime.evaluate", {"expression": AUTH, "returnByValue": True})
            v = r.get("result", {}).get("result", {}).get("value")
            if not v:
                u = send("Runtime.evaluate", {"expression": "location.href", "returnByValue": True})
                return {"problem": "", "dead": "", "opened": [], "alerts": [], "hasLoginBtn": False,
                        "writeDisabled": False, "listText": "",
                        "url": u.get("result", {}).get("result", {}).get("value", "")}
            return json.loads(v)

        def open_board(hook=HOOK, wait=6.0, path="/board/"):
            send("Page.navigate", {"url": base + path})
            time.sleep(wait)
            if hook:
                send("Runtime.evaluate", {"expression": hook})
            return authsnap()

        def click(sel):
            send("Runtime.evaluate", {"expression": sel, "userGesture": True})

        GOOGLE = "accounts.google.com"

        # (1) 팝업이 되는 환경 — 누르면 구글 로그인 창이 열려야 한다.
        open_board()
        click("document.getElementById('loginBtn').click()")
        time.sleep(8.0)
        a1 = authsnap()
        acted1 = bool(a1["opened"]) or GOOGLE in a1["url"] or bool(a1["problem"])
        print(f"    팝업 허용: 열린 창 {len(a1['opened'])}개 · 주소 {a1['url'][:48]}"
              + (f" · 안내 {a1['problem'][:30]!r}" if a1["problem"] else ""))
        checks.append(("★로그인 클릭에 반드시 반응이 있다(팝업 허용)", acted1))

        # (2) 팝업이 막힌 환경 — 리다이렉트로라도 구글까지 가야 한다.
        #     차단기는 window.open 이 null 을 주는 것으로 흉내 낸다(실제 동작과 같다).
        open_board(hook=HOOK + "\nwindow.open = () => null;")
        click("document.getElementById('loginBtn').click()")
        time.sleep(10.0)
        a2 = authsnap()
        acted2 = GOOGLE in a2["url"] or bool(a2["problem"])
        print(f"    팝업 차단: 주소 {a2['url'][:56]}"
              + (f" · 안내 {a2['problem'][:30]!r}" if a2["problem"] else ""))
        checks.append(("★팝업이 막혀도 로그인이 진행된다(리다이렉트 또는 안내)", acted2))

        # (3) 리다이렉트가 조용히 끊긴 경우 — 사파리·iOS 에서 실제로 일어나는 일이다.
        #     구글까지 갔다 왔는데 로그아웃 그대로인 상태를 표시만 남겨 재현한다.
        open_board(hook=None)
        send("Runtime.evaluate", {"expression":
             "sessionStorage.setItem('bd:auth-redirect', String(Date.now()))"})
        send("Page.navigate", {"url": base + "/board/"})
        time.sleep(8.0)
        a3 = authsnap()
        print(f"    조용한 실패 재현: 안내 {a3['problem'][:44]!r}")
        checks.append(("★리다이렉트가 끊기면 안내가 뜬다(아무 일도 없는 화면 금지)",
                       "끝까지" in a3["problem"]))

        # (4) 인앱 브라우저 — 구글이 UA 를 보고 거부한다. 보내기 전에 알려 줘야 한다.
        KAKAO = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 "
                 "(KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.4.5")
        send("Network.setUserAgentOverride", {"userAgent": KAKAO})
        open_board()
        click("document.getElementById('loginBtn').click()")
        time.sleep(5.0)
        a4 = authsnap()
        print(f"    인앱(카카오톡): 안내 {a4['problem'][:40]!r} · 주소 {a4['url'][:40]}")
        checks += [
            ("★인앱 브라우저에 안내가 뜬다", "이 앱 안에서는" in a4["problem"]),
            ("★인앱 브라우저를 구글로 보내지 않는다", GOOGLE not in a4["url"]),
        ]
        send("Network.setUserAgentOverride", {"userAgent": ""})

        # (5) 비로그인으로 글쓰기 — login() 이 불려야 한다(먹통이면 안 된다).
        open_board()
        click("document.getElementById('writeToggle').click()")
        time.sleep(8.0)
        a5 = authsnap()
        acted5 = bool(a5["opened"]) or GOOGLE in a5["url"] or bool(a5["problem"])
        print(f"    비로그인 글쓰기: 열린 창 {len(a5['opened'])}개 · 안내 {a5['problem'][:24]!r}")
        checks.append(("★비로그인 글쓰기 클릭에 반응이 있다", acted5))

        # ── 콘솔 에러 ────────────────────────────────────────
        ws.settimeout(0.4)
        while True:
            try:
                events.append(json.loads(ws.recv()))
            except Exception:
                break
        errs, fatal = [], []
        for e in events:
            if e.get("method") == "Runtime.consoleAPICalled" and e["params"]["type"] == "error":
                errs.append("".join(str(a.get("value", "")) for a in e["params"]["args"])[:200])
            if e.get("method") == "Log.entryAdded" and e["params"]["entry"]["level"] == "error":
                errs.append(e["params"]["entry"]["text"][:200])
            if e.get("method") == "Runtime.exceptionThrown":
                fatal.append(str(e["params"]["exceptionDetails"].get("text"))[:200])
        # ★잡히지 않은 예외는 **실패**로 센다(예전엔 출력만 하고 넘어갔다).
        checks.append(("잡히지 않은 예외 없음", not fatal))

        # ── 6부: 장애 주입 ───────────────────────────────────
        # ★일부러 망가뜨리는 구간이라 **예외 검사 뒤에** 둔다(여기서 나는 예외는 정상이다).
        ws.settimeout(None)
        print("\n  ■ 장애 주입 (되는 네트워크만 보지 않는다)")

        # (6) 원격 SDK 차단 — 광고 차단 확장·사내망·DNS 필터에서 실제로 일어난다.
        #     board.js 는 모듈이라 import 하나가 막히면 **파일 전체가 실행되지 않는다.**
        #     그러면 '✎ 글쓰기' 는 화면에 보이는데 눌러도 아무 일이 없다 —
        #     쓰는 사람에게는 그것이 "클릭이 안 된다" 로 보인다.
        send("Network.setBlockedURLs", {"urls": ["*gstatic.com*"]})
        send("Page.navigate", {"url": base + "/board/"})
        time.sleep(15.0)
        d1 = authsnap()
        print(f"    SDK 차단: 안내 {d1['dead'][:38]!r} · 글쓰기 잠김 {d1['writeDisabled']}")
        checks += [
            ("★SDK 가 막히면 안내가 뜬다(먹통 대신)", "불러오지 못했습니다" in d1["dead"]),
            ("★SDK 가 막히면 죽은 단추를 잠근다", d1["writeDisabled"] is True),
        ]

        # (7) Firestore 차단 — 목록이 '불러오는 중' 에서 영영 멈추면 안 된다.
        send("Network.setBlockedURLs", {"urls": ["*firestore.googleapis.com*"]})
        send("Page.navigate", {"url": base + "/board/"})
        time.sleep(21.0)
        d2 = authsnap()
        told = ("불러오지 못했습니다" in d2["listText"]) or bool(d2["dead"])
        print(f"    Firestore 차단: 목록 {d2['listText'][:38]!r} · 안내 {d2['dead'][:28]!r}")
        checks.append(("★Firestore 가 막히면 '불러오는 중'에서 멈추지 않는다", told))

        send("Network.setBlockedURLs", {"urls": []})

        print("\n  ■ 결과")
        for name, ok in checks:
            print(f"    {'OK  ' if ok else 'FAIL'} {name}")
        if fatal:
            print("\n  ⛔ 예외:")
            for e in dict.fromkeys(fatal):
                print("   ·", e)
        if errs:
            print("\n  콘솔 에러(참고):")
            for e in dict.fromkeys(errs):
                print("   ·", e)
        bad = sum(1 for _, ok in checks if not ok)
        print(f"\n{'✅ 전부 통과' if not bad else f'⛔ {bad}건 실패'} ({len(checks)}건 검사)")
        return 1 if bad else 0
    finally:
        proc.terminate(); proc.wait(timeout=10)
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
