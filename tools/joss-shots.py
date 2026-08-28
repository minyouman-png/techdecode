#!/usr/bin/env python3
"""조스 오브 파이터즈 — 새 연출을 **눈으로** 확인하는 캡처 도구 (2026-08-21)

  python3 tools/joss-shots.py --out /tmp/joss

`?test=sim` 은 '터지지 않는가'까지만 본다. 컷인이 화면 밖으로 나갔는지, 대사창이 얼굴을
가리는지, 이펙트가 캐릭터 뒤에 숨었는지는 **그려 놓고 보는 수밖에 없다.**

⚠️캔버스는 requestAnimationFrame 으로 흐르므로, 원하는 순간을 잡으려면 그 순간에 멈춰야 한다
  (여기서는 JOSS.G.paused 대신 step 을 직접 돌려 원하는 프레임까지 간다).
"""
from __future__ import annotations
import argparse, base64, sys, time
from pathlib import Path

import json, subprocess, urllib.request
ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PATH = "/games/jossfight/index.html"


def serve(port: int):
    import threading
    from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

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

    def __call__(self, method, params=None):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.n:
                return msg

    def js(self, expr):
        r = self("Runtime.evaluate", {"expression": expr, "returnByValue": True})
        res = r.get("result", {}).get("result", {})
        if r.get("result", {}).get("exceptionDetails"):
            raise RuntimeError(json.dumps(r["result"]["exceptionDetails"])[:300])
        return res.get("value")

    def shot(self, out: Path):
        s = self("Page.captureScreenshot", {"format": "png"})
        out.write_bytes(base64.b64decode(s["result"]["data"]))
        print("  ·", out.name)


# 캐릭터 순서(chars.js) — 컷인·이펙트를 캐릭터별로 잡을 때 쓴다
KEYS = ["minyu", "jongbeom", "inwoo", "nodeok", "gilsu", "dongsik", "junwon", "joss", "yujin", "yujeong"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="/tmp/joss")
    ap.add_argument("--port", type=int, default=8807)
    ap.add_argument("--debug-port", type=int, default=9457)
    ap.add_argument("--width", type=int, default=1100)
    ap.add_argument("--height", type=int, default=700)
    ap.add_argument("--only", default="", help="cutin,dialog,chapter,story,fx,pad")
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    want = {s.strip() for s in args.only.split(",") if s.strip()}

    serve(args.port)
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={args.debug_port}",
         "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check",
         "--mute-audio", "--user-data-dir=/tmp/joss-shots", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(80):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{args.debug_port}/json", timeout=1)
                break
            except Exception:
                time.sleep(0.25)
        c = CDP(args.debug_port)
        c("Emulation.setDeviceMetricsOverride", {"width": args.width, "height": args.height,
                                                 "deviceScaleFactor": 1, "mobile": args.width < 500})
        c("Runtime.enable"); c("Network.enable")
        c("Network.setCacheDisabled", {"cacheDisabled": True})
        c("Page.navigate", {"url": f"http://127.0.0.1:{args.port}{PATH}"})
        time.sleep(2.5)
        c.js("window.__joss_ui.toTitle()")

        def match(me, opp, stage=0):
            c.js(f"window.__joss_ui.beginMatch({me},{opp},{stage},false,false);"
                 "var g=JOSS.G; g.phase='fight'; g.phaseT=0; g.p1.state='idle'; g.p2.state='idle';")

        def steps(n):
            c.js(f"for(var i=0;i<{n};i++) JOSS.step(); JOSS.draw();")

        # 1) 초필살기 컷인 — 열 명 전부
        if not want or "cutin" in want:
            print("초필살기 컷인:")
            for i, k in enumerate(KEYS):
                match(i, (i + 3) % 10, i % 7)
                time.sleep(0.5)                      # 컷인 그림이 도착할 시간
                c.js("var g=JOSS.G; g.p1.meter=100; JOSS.startMove(g.p1, g.p1.ch.super);")
                steps(14)
                c.shot(out / f"cutin_{k}.png")

        # 2) 필살기 이펙트 — 새로 넣은 네 번째 기술
        if not want or "fx" in want:
            print("네 번째 필살기 이펙트:")
            for i, k in enumerate(KEYS):
                match(i, (i + 5) % 10, (i + 2) % 7)
                c.js("var g=JOSS.G; JOSS.startMove(g.p1, g.p1.ch.specials[3]);")
                mv = c.js("JOSS.G.p1.mv.startup")
                steps(int(mv) + 3)
                c.shot(out / f"fx_{k}.png")

        # 3) 슬로모션 화면
        if not want or "cutin" in want:
            match(0, 7, 5)
            c.js("var g=JOSS.G; g.p1.meter=100; JOSS.startMove(g.p1, g.p1.ch.super);")
            steps(90)
            c.shot(out / "slowmo.png")

        # 4) 대사 화면
        if not want or "dialog" in want:
            print("대사·막·이야기:")
            c.js("window.__joss_ui.playDialog('yujin','minyu',false,function(){});")
            time.sleep(1.2)
            c.shot(out / "dialog.png")
            c.js("window.__joss_ui.playDialog('minyu','joss',true,function(){});")
            time.sleep(1.6)
            c.js("window.__joss_ui.dlgNext();")
            time.sleep(1.4)
            c.shot(out / "dialog_boss.png")

        if not want or "chapter" in want:
            c.js("window.__joss_ui.showChapter('1막 — 왜 나왔는가','민유 · 프로그래머',"
                 "window.JOSSTORY.prologue.minyu,'대회장으로',function(){});")
            time.sleep(0.4)
            c.shot(out / "prologue.png")
            c.js("window.__joss_ui.showChapter('마지막 막 — 그 뒤','유진의 결말',"
                 "window.JOSSTORY.ending.yujin,'처음으로',function(){});")
            time.sleep(0.4)
            c.shot(out / "ending.png")

        if not want or "story" in want:
            c.js("window.__joss_ui.buildStory(-1); window.__joss_ui.show('story');")
            time.sleep(0.5)
            c.shot(out / "story_world.png")
            c.js("window.__joss_ui.buildStory(8);")
            time.sleep(0.5)
            c.shot(out / "story_char.png")

        if not want or "pad" in want:
            c.js("window.__joss_ui.toTitle();")
            time.sleep(0.3)
            c.shot(out / "title.png")
            c.js("document.getElementById('howBody').innerHTML = window.__joss_ui.buildControls();"
                 "window.__joss_ui.show('howto');")
            time.sleep(0.3)
            c.shot(out / "howto.png")
            match(0, 8, 3)
            c.js("document.body.classList.add('pad'); JOSS.draw();")
            time.sleep(0.3)
            c.shot(out / "pad.png")

        print("✅ 캡처 끝 →", out)
        return 0
    finally:
        proc.terminate()


if __name__ == "__main__":
    raise SystemExit(main())
