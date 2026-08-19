#!/usr/bin/env python3
"""조스 오브 파이터즈 소리 검증 — **실제 출력 파형**을 재서 소리가 들리는지 확인한다.

  python3 tools/joss-audio-check.py

⚠️'오실레이터가 만들어졌다'는 소리가 난다는 뜻이 아니다. 실제로 한 번 겪은 사고가 그것이다 —
  음악과 효과음이 전부 예약되고 있는데도 최고 진폭이 20/127 밖에 안 돼서, 노트북 스피커에서는
  '소리가 아예 안 난다'와 구별되지 않았다. 그래서 이 도구는 destination 에 몰래 분석기를 물려
  **최고 진폭과 실효값(RMS)** 을 재고, 기준에 못 미치면 실패한다.
⚠️autoplay 정책을 끄지 않는다 — 사용자의 브라우저와 같은 조건이어야 한다. 대신 CDP 로
  **진짜 마우스 눌림**(신뢰된 손짓)을 보내 소리를 허용받는다.
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
PORT, DPORT = 8814, 9464

# 기준 — 0~127 (128 = 최대 진폭). 아래로 내려가면 '안 들린다'와 구별되지 않는다.
MIN_PEAK, MIN_RMS = 35, 8

PROBE = """(function(){
 var A=window.AudioContext||window.webkitAudioContext, oc=AudioNode.prototype.connect;
 function Wrap(){ var c=new A(); window.__ac=c;
   var an=c.createAnalyser(); an.fftSize=2048; window.__an=an;
   AudioNode.prototype.connect=function(dst){ if(dst===c.destination){ try{oc.call(this,an);}catch(e){} }
     return oc.apply(this,arguments); };
   return c; }
 Wrap.prototype=A.prototype; window.AudioContext=Wrap; window.webkitAudioContext=Wrap;
 window.__peak=function(){ if(!window.__an) return -1;
   var b=new Uint8Array(window.__an.fftSize); window.__an.getByteTimeDomainData(b);
   var m=0,sq=0,clip=0;
   for(var i=0;i<b.length;i++){var d=Math.abs(b[i]-128); if(d>m)m=d; sq+=d*d; if(d>=126)clip++;}
   if(m>window.__mx)window.__mx=m;
   var r=Math.sqrt(sq/b.length); if(r>window.__rms)window.__rms=r;
   window.__clip+=clip; return m; };
 window.__watch=function(ms){ window.__mx=0; window.__rms=0; window.__clip=0;
   var t0=performance.now();
   (function loop(){ window.__peak();
     if(performance.now()-t0<ms) requestAnimationFrame(loop); })(); };
 return 'ok';})()"""


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
         "--user-data-dir=/tmp/joss-audio-profile", "--no-first-run",
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
            return r.get("result", {}).get("value")

        cdp("Runtime.enable")
        cdp("Network.enable")
        cdp("Network.setCacheDisabled", {"cacheDisabled": True})
        cdp("Page.navigate", {"url": f"http://127.0.0.1:{PORT}/games/jossfight/index.html"})
        time.sleep(2.0)
        js(PROBE)
        for typ in ("mousePressed", "mouseReleased"):       # 진짜 손짓
            cdp("Input.dispatchMouseEvent",
                {"type": typ, "x": 30, "y": 30, "button": "left", "clickCount": 1})
        time.sleep(0.8)

        def watch(sec):
            js(f"window.__watch({int(sec * 1000)})")
            time.sleep(sec + 0.3)
            return js("window.__mx"), round(js("window.__rms") or 0), js("window.__clip")

        fails, lines = [], []
        state = js("window.__ac && window.__ac.state")
        if state != "running":
            fails.append(f"손짓을 줬는데도 소리 장치가 '{state}' 다")

        pk, rms, clip = watch(3.0)
        lines.append(f"메뉴 음악   최고 {pk}/127 · 실효 {rms} · 찌그러짐 {clip}")
        if pk < MIN_PEAK or rms < MIN_RMS:
            fails.append(f"메뉴 음악이 너무 작다(최고 {pk}, 실효 {rms})")
        if clip:
            fails.append(f"메뉴 음악이 찌그러진다(표본 {clip}개)")

        # 끄기 — ⚠️여기서 재야 한다. 대전이 시작된 뒤에는 CPU 가 때리는 **효과음**이 섞여서
        #   '음악을 껐는데 소리가 난다'는 잘못된 실패가 난다(실제로 그렇게 한 번 속았다).
        js("window.JOSS.Mus.setOn(false)")
        time.sleep(1.0)
        pk, rms, clip = watch(1.2)
        lines.append(f"음악 끔      최고 {pk}/127 (0 에 가까워야 한다)")
        if pk > 12:
            fails.append(f"음악을 껐는데 소리가 남아 있다(최고 {pk})")
        js("window.JOSS.Mus.setOn(true)")

        js("""(function(){document.getElementById('versusBtn').click();
             document.querySelectorAll('#grid .charbtn')[0].click();
             document.querySelectorAll('#grid .charbtn')[1].click();
             document.querySelectorAll('#stageBox .stagebtn')[0].click();
             window.JOSS.G.paused = true;})()""")   # 대전은 멈춰 둔다(타격음이 섞이지 않게)
        time.sleep(0.6)
        key = js("window.JOSS.Mus.key")
        pk, rms, clip = watch(3.0)
        lines.append(f"무대 곡({key}) 최고 {pk}/127 · 실효 {rms} · 찌그러짐 {clip}")
        if pk < MIN_PEAK or rms < MIN_RMS:
            fails.append(f"무대 곡이 너무 작다(최고 {pk}, 실효 {rms})")
        if clip:
            fails.append(f"무대 곡이 찌그러진다(표본 {clip}개)")

        # 음악을 끄고 효과음만 — 효과음이 음악에 묻혀서 통과하면 안 된다
        js("window.JOSS.Mus.setOn(false)")
        time.sleep(1.0)
        js("window.__watch(1500)")
        for _ in range(6):
            js("window.JOSS.Snd.hit(true)")
            time.sleep(0.15)
        time.sleep(0.5)
        pk, rms = js("window.__mx"), round(js("window.__rms") or 0)
        lines.append(f"효과음(타격)  최고 {pk}/127 · 실효 {rms}")
        if pk < MIN_PEAK:
            fails.append(f"효과음이 너무 작다(최고 {pk})")
        js("window.JOSS.Mus.setOn(true)")

        errs = js("window.__errs ? window.__errs.join(' | ') : ''")
        if errs:
            fails.append("스크립트 오류: " + errs)

        for ln in lines:
            print("  " + ln)
        if fails:
            print("⛔ 소리 검증 실패")
            for f in fails:
                print("   -", f)
            return 1
        print("✅ 소리 검증 통과 — 음악·효과음 모두 들리는 크기다")
        return 0
    finally:
        proc.kill()
        srv.shutdown()


if __name__ == "__main__":
    sys.exit(main())
