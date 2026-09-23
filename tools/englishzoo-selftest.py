#!/usr/bin/env python3
"""영어 동물원 자가검증 — `?test=sim` 을 헤드리스 크롬으로 돌리고 결과를 읽는다.

  python3 tools/englishzoo-selftest.py
  python3 tools/englishzoo-selftest.py --shot --out /tmp/ez.png     # 화면 캡처
  python3 tools/englishzoo-selftest.py --width 360 --height 740     # 폰 폭에서도

⚠️게임 안의 검사가 진짜 검사다. 이 도구는 그것을 브라우저에서 돌리고 결과를 읽어 오는 운반 장치다.
⚠️★발음 mp3 의 존재 확인이 이 검사의 핵심이다. 낱말을 고쳤는데 음성을 다시 안 만들면
  게임은 멀쩡히 돌면서 **그 낱말만 소리가 안 난다** — 아이는 고장인 줄도 모르고 찍게 된다.
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
PATH = "/games/englishzoo/index.html"


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
    ap.add_argument("--port", type=int, default=8802)
    ap.add_argument("--debug-port", type=int, default=9452)
    ap.add_argument("--width", type=int, default=1100)
    ap.add_argument("--height", type=int, default=760)
    ap.add_argument("--wait", type=float, default=6.0)
    ap.add_argument("--shot", action="store_true")
    ap.add_argument("--click", default="")
    ap.add_argument("--run", type=float, default=0.0)
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    serve(args.port)
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={args.debug_port}",
         "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check",
         "--autoplay-policy=no-user-gesture-required", "--mute-audio",
         "--user-data-dir=/tmp/englishzoo-selftest", "about:blank"],
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
        c("Network.enable")
        c("Network.setCacheDisabled", {"cacheDisabled": True})
        url = f"http://127.0.0.1:{args.port}{PATH}" + ("" if args.shot else "?test=sim")
        c("Page.navigate", {"url": url})
        time.sleep(args.wait if not args.shot else 2.0)

        if args.shot:
            if args.click:
                c.js(f"var e=document.querySelector({args.click!r}); e && e.click();")
            if args.run:
                time.sleep(args.run)
            shot = c("Page.captureScreenshot", {"format": "png"})
            out = Path(args.out or "/tmp/englishzoo.png")
            out.write_bytes(base64.b64decode(shot["result"]["data"]))
            print("캡처 →", out)
            return 0

        res = c.js("window.__TEST__ ? JSON.stringify(window.__TEST__) : ''") or ""
        if not res:
            print("⛔ 영어 동물원 — 자가검증이 아예 돌지 않았다(자바스크립트 오류를 보라)")
            print("  title:", c.js("document.title"))
            return 1
        d = json.loads(res)
        if d["fail"]:
            print(f"⛔ 영어 동물원 — {d['total'] - d['fail']}/{d['total']} 통과")
            for b in d["bad"]:
                print("   ❌", b)
            return 1
        print(f"✅ 영어 동물원 — {d['total']}/{d['total']} 통과")
        return 0
    finally:
        proc.terminate()


if __name__ == "__main__":
    raise SystemExit(main())
