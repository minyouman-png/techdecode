#!/usr/bin/env python3
"""문주 게임 3종 자가검증 — `?test=sim` 을 헤드리스 크롬으로 돌리고 결과를 읽는다.

usage:
  python3 tools/munju-selftest.py --game piano        # 문주의 피아노
  python3 tools/munju-selftest.py --game math         # 수학 방탈출
  python3 tools/munju-selftest.py --game history      # 한국사 탐험
  python3 tools/munju-selftest.py --game piano --shot --run 6 --out /tmp/p.png

⚠️게임 안의 검사(`runSim`)가 진짜 검사다. 이 도구는 그것을 브라우저에서 돌리고
  `#simout` 과 document.title 을 읽어 오는 운반 장치일 뿐이다.
⚠️`dist` 가 아니라 **public/** 를 그대로 띄운다 — 게임은 정적 파일이라 빌드가 필요 없고,
  빌드를 기다리면 고치고 확인하는 주기가 느려진다.
"""
from __future__ import annotations
import argparse
import base64
import json
import subprocess
import sys
import threading
import time
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# ⚠️게임 파일은 `/games/munju/<게임>/` 에 있다 — `/games/munju-piano/` 는 사이트가 만드는
#   **게임 소개 페이지의 주소**라서, 폴더 이름을 슬러그와 같게 두면 소개 페이지가 게임을 덮어쓴다.
GAMES = {
    "piano": ("문주의 피아노", "/games/munju/piano/index.html"),
    "math": ("문주의 수학 방탈출", "/games/munju/math/index.html"),
    "history": ("문주의 한국사 탐험", "/games/munju/history/index.html"),
}


def serve(port: int):
    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(PUB), **k)

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
        r = self("Runtime.evaluate", {"expression": expr, "returnByValue": True})
        return r.get("result", {}).get("result", {}).get("value")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--game", default="piano", choices=list(GAMES))
    ap.add_argument("--port", type=int, default=8801)
    ap.add_argument("--debug-port", type=int, default=9451)
    ap.add_argument("--width", type=int, default=1100)
    ap.add_argument("--height", type=int, default=700)
    ap.add_argument("--wait", type=float, default=3.0)
    ap.add_argument("--shot", action="store_true", help="검사 대신 화면 캡처")
    ap.add_argument("--run", type=float, default=0.0, help="캡처 전 기다릴 초")
    ap.add_argument("--click", default="", help="캡처 전 누를 요소(CSS 선택자)")
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    name, path = GAMES[args.game]
    serve(args.port)
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={args.debug_port}",
         "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check",
         "--autoplay-policy=no-user-gesture-required", "--mute-audio",
         f"--user-data-dir=/tmp/munju-selftest-{args.game}", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(80):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{args.debug_port}/json", timeout=1)
                break
            except Exception:
                time.sleep(0.25)
        c = CDP(args.debug_port)
        c("Emulation.setDeviceMetricsOverride",
          {"width": args.width, "height": args.height, "deviceScaleFactor": 1,
           "mobile": args.width < 500})
        c("Runtime.enable")
        # ⚠️크롬 프로필을 재사용하므로 캐시를 끄지 않으면 **고친 파일이 아니라 예전 파일**을 검사한다.
        c("Network.enable")
        c("Network.setCacheDisabled", {"cacheDisabled": True})
        url = f"http://127.0.0.1:{args.port}{path}" + ("" if args.shot else "?test=sim")
        c("Page.navigate", {"url": url})
        time.sleep(args.wait if not args.shot else 1.5)

        if args.shot:
            if args.click:
                c.js(f"var e=document.querySelector({args.click!r}); e && e.click();")
            if args.run:
                time.sleep(args.run)
            shot = c("Page.captureScreenshot", {"format": "png"})
            out = Path(args.out or f"/tmp/munju-{args.game}.png")
            out.write_bytes(base64.b64decode(shot["result"]["data"]))
            print("캡처 →", out)
            return 0

        title = c.js("document.title") or ""
        report = c.js("(document.getElementById('simout')||{}).textContent || ''") or ""
        errs = c.js("window.__errs ? window.__errs.join('\\n') : ''") or ""
        if "SIM PASS" not in title:
            print(f"⛔ {name}")
            print(report.strip() or "(자가검증이 아예 돌지 않았다 — 자바스크립트 오류를 보라)")
            if errs:
                print("자바스크립트 오류:", errs)
            return 1
        print(f"✅ {name} — {report.strip().splitlines()[0]}")
        return 0
    finally:
        proc.terminate()


if __name__ == "__main__":
    raise SystemExit(main())
