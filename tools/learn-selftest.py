#!/usr/bin/env python3
"""/learn/ 자가 검증 — `?test=learn` 을 헤드리스 크롬으로 돌리고 결과를 읽는다.

usage: python3 tools/learn-selftest.py [--serve-port 4399]

⚠️★**헤드리스 크롬은 `--window-size` 로 500px 아래로 못 내려간다**(창 최소폭).
  2026-08-13 에 360px 에서 통과했다고 믿었는데 실제 뷰포트는 500px 이었다.
  → CDP `Emulation.setDeviceMetricsOverride` 로 **진짜 320/360/414px** 을 만든다.
  DevTools 에 붙을 때 `--remote-allow-origins=*` 가 없으면 403 이 난다.
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
PAGES = ["/learn/", "/learn/korean/", "/learn/math/", "/learn/world/",
         "/learn/safety/", "/learn/english/"]
WIDTHS = [320, 360, 414, 768]


def serve(port: int):
    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(DIST), **k)

        def log_message(self, *a):
            pass

    srv = ThreadingHTTPServer(("127.0.0.1", port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def cdp(port: int, method: str, params: dict | None = None, sid: str | None = None):
    """DevTools 프로토콜을 최소 구현으로 호출(websocket-client 의존성 회피)."""
    import websocket  # type: ignore
    tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{port}/json").read())
    page = next(t for t in tabs if t["type"] == "page")
    ws = websocket.create_connection(page["webSocketDebuggerUrl"],
                                     origin="http://127.0.0.1", suppress_origin=True)
    ws.send(json.dumps({"id": 1, "method": method, "params": params or {}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get("id") == 1:
            ws.close()
            return msg


def run(port: int, dbg: int, url: str, width: int) -> tuple[bool, str]:
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={dbg}",
         "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check",
         "--user-data-dir=/tmp/learn-selftest-profile", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(60):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{dbg}/json", timeout=1)
                break
            except Exception:
                time.sleep(0.25)
        cdp(dbg, "Emulation.setDeviceMetricsOverride",
            {"width": width, "height": 900, "deviceScaleFactor": 1, "mobile": width < 500})
        cdp(dbg, "Page.navigate", {"url": f"http://127.0.0.1:{port}{url}?test=learn"})
        time.sleep(3.0)
        r = cdp(dbg, "Runtime.evaluate",
                {"expression": "document.title + '\\n' + ((document.querySelector('#learn-test')||{}).textContent||'')",
                 "returnByValue": True})
        out = r["result"]["result"].get("value", "")
        return ("FAIL" not in out.split("\n")[0], out)
    finally:
        proc.terminate()
        proc.wait(timeout=10)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--serve-port", type=int, default=4399)
    ap.add_argument("--debug-port", type=int, default=9333)
    args = ap.parse_args()
    if not DIST.exists():
        sys.exit("dist 가 없습니다 — `npx astro build` 를 먼저 돌리세요.")
    serve(args.serve_port)

    bad = 0
    for url in PAGES:
        for w in WIDTHS:
            ok, title = run(args.serve_port, args.debug_port, url, w)
            mark = "OK  " if ok else "FAIL"
            print(f"  {mark} {w:>4}px  {url:<18} {title.splitlines()[0]}")
            if not ok:
                for ln in title.splitlines()[1:]:
                    if ln.strip(): print("        ·", ln.strip()[:160])
            if not ok:
                bad += 1
    print(("\n✅ 전부 통과" if not bad else f"\n⛔ {bad}건 실패"))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
