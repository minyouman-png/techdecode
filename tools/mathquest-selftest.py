#!/usr/bin/env python3
"""수학여행(유진·수호) — `?test=sim` 을 실제 크롬에서 돌리고 결과를 읽는다.

usage: python3 tools/yujin-selftest.py [--shot 3] [--width 900]

⚠️`--remote-allow-origins=*` 가 없으면 DevTools 접속이 403 이다(학습 코너에서 겪은 것과 같음).
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
SEP = "|||"


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
    def __init__(self, dbg):
        import websocket
        tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{dbg}/json").read())
        page = next(t for t in tabs if t["type"] == "page")
        self.ws = websocket.create_connection(page["webSocketDebuggerUrl"],
                                              origin="http://127.0.0.1", suppress_origin=True)
        self.i = 0

    def __call__(self, method, params=None):
        self.i += 1
        self.ws.send(json.dumps({"id": self.i, "method": method, "params": params or {}}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get("id") == self.i:
                return m


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=4501)
    ap.add_argument("--debug-port", type=int, default=9401)
    ap.add_argument("--width", type=int, default=900)
    ap.add_argument("--height", type=int, default=560)
    ap.add_argument("--shot", default="")        # 스테이지 번호 → 화면 캡처
    ap.add_argument("--wait", type=float, default=3.0)
    ap.add_argument("--run", type=float, default=0.0)   # 캡처 전 오른쪽으로 달릴 초
    ap.add_argument("--hero", default="yujin")   # yujin | suho
    ap.add_argument("--pad", default="")   # 1 이면 태블릿 모드 켠 화면
    ap.add_argument("--out", default="")
    args = ap.parse_args()
    serve(args.port)
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={args.debug_port}",
         "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check",
         "--autoplay-policy=no-user-gesture-required", "--mute-audio",
         f"--user-data-dir=/tmp/{args.hero}-selftest-profile", "about:blank"],
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
        base = f"http://127.0.0.1:{args.port}/games/{args.hero}/index.html"
        c("Page.navigate", {"url": f"{base}?stage={args.shot}" + (f"&pad={args.pad}" if args.pad else "") if args.shot else f"{base}?test=sim"})
        time.sleep(args.wait)
        if args.shot:
            # 실제 키 입력으로 오른쪽으로 달리게 해서 '문제 구역'이 보이는 장면을 잡는다
            for _ in range(int(args.run * 10)):
                c("Input.dispatchKeyEvent", {"type": "rawKeyDown", "key": "ArrowRight",
                                             "code": "ArrowRight", "windowsVirtualKeyCode": 39})
                time.sleep(0.1)
            shot = c("Page.captureScreenshot", {"format": "png"})
            out = Path(args.out or f"/tmp/yujin-stage{args.shot}.png")
            out.write_bytes(base64.b64decode(shot["result"]["data"]))
            print("캡처 →", out)
            return 0
        expr = ("document.title + '" + SEP + "' + "
                "((document.querySelector('#sim-test')||{}).textContent||'')")
        for _ in range(60):
            r = c("Runtime.evaluate", {"expression": expr, "returnByValue": True})
            val = r["result"]["result"].get("value", "") or ""
            title = val.split(SEP)[0]
            if title in ("SIM PASS", "SIM FAIL"):
                print(val.split(SEP, 1)[1].strip())
                return 0 if title == "SIM PASS" else 1
            time.sleep(0.5)
        print("⛔ 자가검증이 끝나지 않았습니다(로드 실패 가능)")
        r = c("Runtime.evaluate", {"expression": "document.body.innerText.slice(0,700)",
                                   "returnByValue": True})
        print(r["result"]["result"].get("value", ""))
        return 2
    finally:
        proc.terminate()
        proc.wait(timeout=10)


if __name__ == "__main__":
    sys.exit(main())
