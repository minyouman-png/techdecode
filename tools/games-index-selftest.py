#!/usr/bin/env python3
"""놀이공간(/games/) 왼쪽 '놀이방' 목록 자가검증 — 진짜로 눌러서 진짜로 걸러지는지 본다.

usage: python3 tools/games-index-selftest.py [--width 1200]

⚠️'왼쪽에 이름이 뜬다'는 것으로는 아무것도 보장되지 않는다. 실제로 확인하는 것:
  · 방마다 적힌 개수와 **눌렀을 때 실제로 보이는 카드 수**가 같은가
  · 보이는 카드가 전부 그 방의 게임인가(data-hero 대조)
  · 전체 게임으로 돌아오면 다시 다 보이는가
  · `?who=<방>` 으로 바로 들어가도 그 방이 열려 있는가(링크 공유·뒤로 가기)
★한 번 여기서 터졌다: `.game-card { display:flex }` 가 브라우저 기본 `[hidden]` 규칙을 이겨서
  걸러도 카드가 그대로 보였다. 화면을 안 봤으면 못 잡는다.
"""
from __future__ import annotations
import argparse
import json
import subprocess
import sys
import threading
import time
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def serve(port: int):
    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(DIST), **k)

        def log_message(self, *a):
            pass

    srv = ThreadingHTTPServer(("127.0.0.1", port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


class CDP:
    def __init__(self, port: int):
        import websocket  # type: ignore
        tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{port}/json").read())
        page = next(t for t in tabs if t["type"] == "page")
        self.ws = websocket.create_connection(page["webSocketDebuggerUrl"],
                                              origin="http://127.0.0.1", suppress_origin=True)
        self.n = 0

    def __call__(self, method: str, params: dict | None = None):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.n:
                return msg

    def js(self, expr: str):
        r = self("Runtime.evaluate", {"expression": expr, "returnByValue": True,
                                      "awaitPromise": True})
        res = r.get("result", {}).get("result", {})
        if r.get("result", {}).get("exceptionDetails"):
            raise RuntimeError(json.dumps(r["result"]["exceptionDetails"])[:300])
        return res.get("value")


# 보이는 카드 = 실제로 화면에 자리를 차지하는 카드(hidden 이면 offsetParent 가 없다)
VISIBLE = """(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.game-card[data-hero]'));
  var vis = cards.filter(function (c) { return c.offsetParent !== null; });
  return {
    total: cards.length,
    visible: vis.length,
    heroes: vis.map(function (c) { return c.dataset.hero; }),
    current: (document.querySelector("a.room[aria-current='true']") || {}).dataset,
  };
})()"""


def check(width: int, port: int, dbg: int) -> list[str]:
    bad: list[str] = []
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={dbg}",
         "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check",
         f"--user-data-dir=/tmp/games-index-selftest-{width}", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(80):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{dbg}/json", timeout=1)
                break
            except Exception:
                time.sleep(0.25)
        c = CDP(dbg)
        c("Emulation.setDeviceMetricsOverride",
          {"width": width, "height": 900, "deviceScaleFactor": 1, "mobile": width < 500})
        c("Runtime.enable")
        c("Page.navigate", {"url": f"http://127.0.0.1:{port}/games/"})
        time.sleep(1.6)

        rooms = c.js("""Array.prototype.map.call(document.querySelectorAll('a.room[data-room]'),
            function (a) { return {key: a.dataset.room,
                                   label: a.querySelector('.room-name').textContent,
                                   count: parseInt(a.querySelector('.room-count').textContent, 10)}; })""")
        if not rooms:
            return [f'{width}px: 왼쪽 놀이방 목록이 아예 없다']
        keys = [r["key"] for r in rooms]
        for must in ("all", "common", "yujin", "suho", "kkaebi"):
            if must not in keys:
                bad.append(f'{width}px: 놀이방에 {must} 가 없다 (있는 것: {keys})')

        st = c.js(VISIBLE)
        total = st["total"]
        if st["visible"] != total:
            bad.append(f'{width}px: 처음 화면인데 {total}개 중 {st["visible"]}개만 보인다')

        for r in rooms:
            c.js(f"document.querySelector(\"a.room[data-room='{r['key']}']\").click()")
            time.sleep(0.25)
            st = c.js(VISIBLE)
            if st["visible"] != r["count"]:
                bad.append(f'{width}px: {r["label"]} — 목록엔 {r["count"]}개인데 '
                           f'실제로 보이는 건 {st["visible"]}개')
            if r["key"] not in ("all",):
                want = "common" if r["key"] == "common" else r["key"]
                wrong = [h for h in st["heroes"] if h != want]
                if wrong:
                    bad.append(f'{width}px: {r["label"]} 에 남의 게임이 섞였다 {wrong}')
            if r["count"] == 0:
                bad.append(f'{width}px: {r["label"]} 은 게임이 0개다 (빈 방을 만들지 말 것)')
            cur = (c.js("(document.querySelector(\"a.room[aria-current='true']\")||{}).dataset"
                        " ? document.querySelector(\"a.room[aria-current='true']\").dataset.room : ''"))
            if cur != r["key"]:
                bad.append(f'{width}px: {r["label"]} 을 눌렀는데 선택 표시는 {cur!r} 이다')

        # 전체로 돌아오면 다시 다 보이는가
        c.js("document.querySelector(\"a.room[data-room='all']\").click()")
        time.sleep(0.25)
        st = c.js(VISIBLE)
        if st["visible"] != total:
            bad.append(f'{width}px: 전체 게임으로 돌아왔는데 {st["visible"]}/{total} 만 보인다')

        # 주소로 바로 들어가기(링크 공유) — ?who=kkaebi
        c("Page.navigate", {"url": f"http://127.0.0.1:{port}/games/?who=kkaebi"})
        time.sleep(1.4)
        st = c.js(VISIBLE)
        kk = next((r["count"] for r in rooms if r["key"] == "kkaebi"), 0)
        if st["visible"] != kk:
            bad.append(f'{width}px: ?who=kkaebi 로 들어갔는데 {st["visible"]}개 보인다(깨비는 {kk}개)')
        if any(h != "kkaebi" for h in st["heroes"]):
            bad.append(f'{width}px: ?who=kkaebi 인데 {set(st["heroes"])} 가 보인다')

        # 모르는 방 이름이 와도 화면이 비면 안 된다
        c("Page.navigate", {"url": f"http://127.0.0.1:{port}/games/?who=nobody"})
        time.sleep(1.4)
        st = c.js(VISIBLE)
        if st["visible"] != total:
            bad.append(f'{width}px: ?who=nobody 인데 {st["visible"]}/{total} 만 보인다(전체가 나와야 한다)')
        return bad
    finally:
        proc.terminate()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8791)
    ap.add_argument("--debug-port", type=int, default=9421)
    ap.add_argument("--width", type=int, default=0, help="한 폭만 검사")
    args = ap.parse_args()
    if not DIST.exists():
        print("⛔ dist 가 없다 — npm run build 먼저", file=sys.stderr)
        return 1
    serve(args.port)
    widths = [args.width] if args.width else [1200, 390]   # 넓은 화면 + 좁은 화면(가로 칩)
    bad: list[str] = []
    for i, w in enumerate(widths):
        bad += check(w, args.port, args.debug_port + i)
    if bad:
        print(f"⛔ 놀이방 목록 {len(bad)}건")
        for b in bad:
            print("  ·", b)
        return 1
    print(f"✅ 놀이방 목록 통과 — {', '.join(str(w) + 'px' for w in widths)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
