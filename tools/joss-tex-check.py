#!/usr/bin/env python3
"""컷아웃 텍스처 검증 — 열 명의 부위 그림이 **실제로 실려서 그려지는가**.

  python3 tools/joss-tex-check.py

⚠️`?test=sim` 은 그림이 실리기 전에 끝난다(그림은 비동기로 온다) — 그래서 텍스처는 이 도구가
  따로 본다. 그림이 없으면 벡터로 그려지므로 sim 은 통과해 버리고, **아무도 눈치채지 못한 채
  예전 그림으로 되돌아가 있을 수** 있다.
"""
from __future__ import annotations
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
PORT, DPORT = 8819, 9469


def main() -> int:
    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(PUB), **k)

        def log_message(self, *a):
            pass

    srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={DPORT}",
         "--user-data-dir=/tmp/joss-tex-profile", "--no-first-run",
         "--window-size=1280,720", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(80):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{DPORT}/json", timeout=1)
                break
            except Exception:
                time.sleep(0.25)
        import websocket  # type: ignore
        tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{DPORT}/json").read())
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
                return {"err": json.dumps(r["exceptionDetails"])[:300]}
            return r.get("result", {}).get("value")

        cdp("Runtime.enable")
        cdp("Network.enable")
        cdp("Network.setCacheDisabled", {"cacheDisabled": True})
        cdp("Page.navigate", {"url": f"http://127.0.0.1:{PORT}/games/jossfight/index.html"})
        time.sleep(3.0)

        out = js("""(function(){
          var FA=window.FIGHTANIM, bad=[], ready=0;
          var c=document.createElement('canvas'); c.width=400; c.height=400;
          var x=c.getContext('2d');
          window.CHARS.forEach(function(ch){
            var T=FA.texOf(ch);
            if(!T){ bad.push(ch.key+': 텍스처 없음'); return; }
            ready++;
            ['torso','armU','armL','legU','legL'].forEach(function(p){
              if(!T.parts[p]) bad.push(ch.key+'/'+p+': 그림 없음');
              if(!T.parts[p+'Dark']) bad.push(ch.key+'/'+p+': 어두운 사본 없음');
              var g=T.geom[p];
              if(!g || !(g.w>2 && g.h>2)) bad.push(ch.key+'/'+p+': 크기가 이상하다');
              if(p!=='torso' && !(g.len>3)) bad.push(ch.key+'/'+p+': 뼈 길이가 이상하다');
            });
            // 전 동작을 텍스처로 그려 본다(그리다 터지면 여기서 잡힌다)
            Object.keys(FA.ANIM).forEach(function(nm){
              var len=FA.animLength(nm);
              for(var f=0; f<len; f+=Math.max(1,Math.floor(len/6))){
                try { x.clearRect(0,0,400,400); x.save(); x.translate(200,360);
                      FA.drawFighter(x,0,0,1,ch,FA.poseAt(nm,f,false),{zoom:2.1});
                      x.restore(); }
                catch(e){ bad.push(ch.key+'/'+nm+'@'+f+': '+e.message); }
              }
            });
          });
          return {ready: ready, bad: bad.slice(0,12), errs: window.__errs.join(' | ')};
        })()""")
        if not isinstance(out, dict) or out.get("err"):
            print("⛔ 검사 자체가 실패했다:", out)
            return 1
        print(f"  텍스처 준비된 캐릭터: {out['ready']}/10")
        if out["errs"]:
            print("  스크립트 오류:", out["errs"])
        if out["ready"] != 10 or out["bad"] or out["errs"]:
            print("⛔ 컷아웃 텍스처 검증 실패")
            for b in out["bad"]:
                print("   -", b)
            return 1
        print("✅ 컷아웃 텍스처 검증 통과 — 열 명 전부 그림으로 그려진다")
        return 0
    finally:
        proc.kill()
        srv.shutdown()


if __name__ == "__main__":
    sys.exit(main())
