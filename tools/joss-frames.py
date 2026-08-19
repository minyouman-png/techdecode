#!/usr/bin/env python3
"""조스 오브 파이터즈 동작 검수 — 한 기술의 프레임을 **한 줄로 늘어놓고** 본다.

  python3 tools/joss-frames.py --anim hk               # 강발 한 판
  python3 tools/joss-frames.py --anim hk --char 3 --zoom 1.6
  python3 tools/joss-frames.py --anim hp,hk,spin       # 여러 개를 세로로

⚠️격투게임 동작은 '돌아간다'로 확인할 수 없다. 예비동작이 있는가 · 타격 프레임이 제일 크게
  뻗는가 · 회수가 질질 끌지 않는가는 **프레임을 나란히 놓고** 봐야 보인다.
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

STRIP = """(function(anims, chI, zoom, cols){
  var FA=window.FIGHTANIM, CH=window.CHARS[chI];
  var W=150, H=270, rows=[];
  anims.forEach(function(name){
    var len=Math.round(FA.animLength(name));
    rows.push({name:name, len:len, n:Math.min(cols, len)});
  });
  var c=document.createElement('canvas');
  c.width=W*cols+20; c.height=rows.length*H+20;
  var x=c.getContext('2d');
  x.fillStyle='#161a26'; x.fillRect(0,0,c.width,c.height);
  rows.forEach(function(r,ri){
    for(var i=0;i<r.n;i++){
      var f=r.len<=1?0:Math.round(i*(r.len-1)/(r.n-1));
      var ox=10+i*W, oy=20+ri*H;
      x.fillStyle=(i%2)?'#1b2030':'#20263a'; x.fillRect(ox,oy,W,H-10);
      x.strokeStyle='rgba(255,255,255,.06)'; x.strokeRect(ox+.5,oy+.5,W,H-10);
      x.fillStyle='#7f8db0'; x.font='11px monospace';
      x.fillText((ri===0||i===0? r.name+' ':'')+'f'+f, ox+6, oy+14);
      x.strokeStyle='rgba(255,255,255,.10)';
      x.beginPath(); x.moveTo(ox,oy+H-40); x.lineTo(ox+W,oy+H-40); x.stroke();
      x.save(); x.translate(ox+W/2, oy+H-40);
      FA.drawFighter(x, 0, 0, 1, CH, FA.poseAt(r.name, f, false), {zoom:zoom});
      x.restore();
    }
  });
  document.body.style.margin='0'; document.body.style.background='#161a26';
  document.body.innerHTML=''; document.body.appendChild(c);
  return c.width+'x'+c.height;
})(__ANIMS__, __CHAR__, __ZOOM__, __COLS__)"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--anim", default="hp,hk,spin")
    ap.add_argument("--char", type=int, default=0)
    ap.add_argument("--zoom", type=float, default=1.5)
    ap.add_argument("--cols", type=int, default=9)
    ap.add_argument("--out", default="/tmp/joss-frames.png")
    ap.add_argument("--port", type=int, default=8815)
    ap.add_argument("--debug-port", type=int, default=9465)
    args = ap.parse_args()
    anims = [a.strip() for a in args.anim.split(",") if a.strip()]

    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(PUB), **k)

        def log_message(self, *a):
            pass

    srv = ThreadingHTTPServer(("127.0.0.1", args.port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={args.debug_port}",
         "--user-data-dir=/tmp/joss-frames-profile", "--no-first-run",
         "--window-size=1400,1000", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(80):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{args.debug_port}/json", timeout=1)
                break
            except Exception:
                time.sleep(0.25)
        import websocket  # type: ignore
        tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{args.debug_port}/json").read())
        page = next(t for t in tabs if t["type"] == "page")
        ws = websocket.create_connection(page["webSocketDebuggerUrl"],
                                         origin="http://127.0.0.1", suppress_origin=True)
        n = [0]

        def cdp(m, p=None):
            n[0] += 1
            ws.send(json.dumps({"id": n[0], "method": m, "params": p or {}}))
            while True:
                msg = json.loads(ws.recv())
                if msg.get("id") == n[0]:
                    return msg

        def js(e):
            r = cdp("Runtime.evaluate", {"expression": e, "returnByValue": True}).get("result", {})
            if r.get("exceptionDetails"):
                return "EXC " + json.dumps(r["exceptionDetails"])[:400]
            return r.get("result", {}).get("value")

        cdp("Runtime.enable")
        cdp("Network.enable")
        cdp("Network.setCacheDisabled", {"cacheDisabled": True})
        cdp("Page.navigate", {"url": f"http://127.0.0.1:{args.port}/games/jossfight/index.html"})
        time.sleep(1.8)
        expr = (STRIP.replace('__ANIMS__', json.dumps(anims))
                     .replace('__CHAR__', str(args.char))
                     .replace('__ZOOM__', str(args.zoom))
                     .replace('__COLS__', str(args.cols)))
        size = js(expr)
        print("그림표", size, "· 캐릭터", js(f"window.CHARS[{args.char}].name"))
        w, h = [int(v) for v in str(size).split("x")]
        cdp("Emulation.setDeviceMetricsOverride",
            {"width": w, "height": h, "deviceScaleFactor": 2, "mobile": False})
        time.sleep(0.4)
        shot = cdp("Page.captureScreenshot", {"format": "png"})
        Path(args.out).write_bytes(base64.b64decode(shot["result"]["data"]))
        print("→", args.out)
        return 0
    finally:
        proc.kill()
        srv.shutdown()


if __name__ == "__main__":
    sys.exit(main())
