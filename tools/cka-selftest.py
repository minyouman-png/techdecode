#!/usr/bin/env python3
"""자격증 학원(/academy/) 자가검증 — 헤드리스 크롬 + CDP 로 진짜 화면 폭에서 돌린다.

  python3 tools/cka-selftest.py                 # dist 필요(npm run build)
  python3 tools/cka-selftest.py --shots DIR     # 화면 캡처도 저장(눈으로 확인용)
  python3 tools/cka-selftest.py --base https://menewsoft.com   # 배포본 검사

검사:
  · 실습 터미널 ?test=cka — 과제 7개를 **UI 로** 입력(편집기 창 포함)해 채점 통과, 힌트·답안·자동완성, 가로 넘침
  · 모의고사 ?test=cka — 16문항 출제·배점 합 100·타이머·절반 풀이 점수 일치·결과표·기록 저장
  · 과정 홈 · 허브 · 강의 — 가로 넘침, 강의는 퀴즈를 전부 맞혀 점수·완료 표시가 되는지
⚠️헤드리스 크롬은 --window-size 로 500px 아래가 안 된다 → Emulation.setDeviceMetricsOverride(학습 코너에서 겪음).
"""
from __future__ import annotations
import argparse, base64, json, subprocess, sys, threading, time, urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

OVERFLOW_JS = """(() => { const W = document.documentElement.clientWidth; const sw = document.documentElement.scrollWidth;
  let worst = ''; if (sw > W + 1) { for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.right > W + 1 && !el.closest('pre,.tablewrap,.body table,.term-out')) { worst = el.tagName + '.' + el.className; } } }
  return sw > W + 1 ? 'FAIL 가로 넘침 ' + sw + '>' + W + ' ' + worst : 'PASS'; })()"""

LESSON_JS = """(async () => { const f = [];
  const qs = [...document.querySelectorAll('.quiz .q')];
  const data = JSON.parse(document.getElementById('quiz-box').dataset.quiz);
  if (qs.length !== data.length || !qs.length) f.push('퀴즈 문항 수 ' + qs.length);
  qs.forEach((li, i) => li.querySelectorAll('.opt')[data[i].answer].click());
  const sc = document.getElementById('quiz-score').textContent;
  if (!sc.includes(data.length + ' / ' + data.length)) f.push('점수 표시: ' + sc);
  if (!/완료한 강의/.test(document.getElementById('done-btn').textContent)) f.push('만점인데 완료 표시 안 됨');
  const st = JSON.parse(localStorage.getItem('menew_cka_v1'));
  if (!st.lessons[document.querySelector('main.acad').dataset.slug]) f.push('진도 저장 안 됨');
  const ov = %s; if (ov !== 'PASS') f.push(ov);
  return f.length ? 'FAIL ' + f.join(' | ') : 'PASS'; })()""" % OVERFLOW_JS

HOME_JS = """(() => { const f = [];
  const n = document.querySelectorAll('.lessons li').length; if (n < 20) f.push('강의 목록 ' + n);
  const t = document.getElementById('ptext').textContent; if (!/\\d+ \\/ \\d+ 강의/.test(t)) f.push('진도 ' + t);
  if (!document.querySelector('.lessons li.done')) f.push('앞 단계에서 완료한 강의가 체크되지 않음');
  const ov = %s; if (ov !== 'PASS') f.push(ov);
  return f.length ? 'FAIL ' + f.join(' | ') : 'PASS'; })()""" % OVERFLOW_JS


def serve(port):
    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k): super().__init__(*a, directory=str(DIST), **k)
        def log_message(self, *a): pass
    srv = ThreadingHTTPServer(("127.0.0.1", port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()


class CDP:
    def __init__(self, port):
        import websocket  # type: ignore
        for _ in range(80):
            try:
                tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=1).read()); break
            except Exception: time.sleep(0.25)
        page = next(t for t in tabs if t["type"] == "page")
        self.ws = websocket.create_connection(page["webSocketDebuggerUrl"], origin="http://127.0.0.1", suppress_origin=True, timeout=120)
        self.i = 0

    def call(self, method, params=None):
        self.i += 1
        self.ws.send(json.dumps({"id": self.i, "method": method, "params": params or {}}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get("id") == self.i: return m

    def eval(self, expr):
        r = self.call("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
        res = r.get("result", {})
        if "exceptionDetails" in res: return "FAIL 예외 " + json.dumps(res["exceptionDetails"].get("exception", {}).get("description", ""))[:300]
        return res.get("result", {}).get("value")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="")
    ap.add_argument("--serve-port", type=int, default=4411)
    ap.add_argument("--debug-port", type=int, default=9341)
    ap.add_argument("--shots", default="")
    args = ap.parse_args()
    base = args.base.rstrip("/")
    if not base:
        if not DIST.exists(): sys.exit("dist 가 없습니다 — npm run build 먼저")
        serve(args.serve_port); base = f"http://127.0.0.1:{args.serve_port}"
    shots = Path(args.shots) if args.shots else None
    if shots: shots.mkdir(parents=True, exist_ok=True)

    proc = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={args.debug_port}", "--remote-allow-origins=*",
                             "--no-first-run", "--no-default-browser-check", "--user-data-dir=/tmp/cka-selftest-profile", "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    bad = 0
    try:
        cdp = CDP(args.debug_port)
        cdp.call("Page.enable")

        def go(url, width, height=900, wait=2.5):
            cdp.call("Emulation.setDeviceMetricsOverride", {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": width < 600})
            cdp.call("Page.navigate", {"url": base + url})
            time.sleep(wait)

        def shot(name):
            if not shots: return
            r = cdp.call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            (shots / f"{name}.png").write_bytes(base64.b64decode(r["result"]["data"]))

        def report(label, out):
            nonlocal bad
            ok = isinstance(out, str) and out.startswith("PASS")
            if not ok: bad += 1
            print(f"  {'OK  ' if ok else 'FAIL'} {label:<44} {'' if ok else str(out)[:400]}")

        for w in (360, 768, 1280):
            go("/academy/cka/lab/?test=cka", w, wait=1.0)
            for _ in range(40):
                t = cdp.eval("document.title")
                if t and t.startswith("CKA-TEST"): break
                time.sleep(0.5)
            out = cdp.eval("document.getElementById('cka-test').textContent")
            report(f"{w}px 실습 터미널 ?test=cka", out)
            go("/academy/cka/lab/?task=t6", w, wait=1.5); shot(f"lab-{w}")
            go("/academy/cka/exam/?test=cka", w, wait=1.0)
            for _ in range(60):
                t = cdp.eval("document.title")
                if t and t.startswith("CKA-TEST"): break
                time.sleep(0.5)
            report(f"{w}px 모의고사 ?test=cka", cdp.eval("document.getElementById('cka-test').textContent"))
            shot(f"exam-result-{w}")
            for slug in ("exam-guide", "network-policy", "etcd-backup"):
                go(f"/academy/cka/{slug}/", w, wait=1.2)
                report(f"{w}px 강의 {slug}", cdp.eval(LESSON_JS))
                if slug == "network-policy": shot(f"lesson-{w}")
            go("/academy/cka/", w, wait=1.2)
            report(f"{w}px 과정 홈", cdp.eval(HOME_JS)); shot(f"home-{w}")
            go("/academy/", w, wait=1.0)
            report(f"{w}px 자격증 학원 허브", cdp.eval(OVERFLOW_JS)); shot(f"hub-{w}")
    finally:
        proc.terminate(); proc.wait(timeout=10)
    print("\n✅ 전부 통과" if not bad else f"\n⛔ {bad}건 실패")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
