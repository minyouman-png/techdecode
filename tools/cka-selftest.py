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


# 태블릿 전용 검사: 터치 판정 · iOS 확대 방지 글자 크기 · 터미널이 화면에 다 들어오는지 · 누를 곳 크기 · 자동 포커스 없음
TABLET_LAB_JS = """(() => { const f = [];
  if (!matchMedia('(pointer: coarse)').matches) f.push('터치 기기로 인식 안 됨');
  if (document.activeElement && document.activeElement.classList.contains('term-input')) f.push('열자마자 입력칸 포커스(가상 키보드가 튀어나옴)');
  const fs = parseFloat(getComputedStyle(document.querySelector('.term-input')).fontSize); if (fs < 16) f.push('입력칸 글자 ' + fs + 'px(iOS 확대)');
  const tb = document.querySelector('.termbox'); if (tb.getBoundingClientRect().height > innerHeight) f.push('터미널이 화면보다 큼 ' + Math.round(tb.getBoundingClientRect().height) + '>' + innerHeight);
  tb.scrollIntoView({block: 'end', behavior: 'instant'}); const inb = document.querySelector('.term-in').getBoundingClientRect();
  if (inb.bottom > innerHeight + 1 || inb.top < 0) f.push('입력줄이 화면 밖 ' + Math.round(inb.top) + '~' + Math.round(inb.bottom) + ' / ' + innerHeight);
  const small = [...document.querySelectorAll('.acad button, .acad .btn, .acad select')].filter(b => { const r = b.getBoundingClientRect(); return r.width && r.height && r.height < 36; }).map(b => (b.textContent || b.className).trim().slice(0, 12) + ':' + Math.round(b.getBoundingClientRect().height));
  if (small.length) f.push('작은 버튼 ' + small.slice(0, 5).join(', '));
  scrollTo({top: 0, behavior: 'instant'});
  return f.length ? 'FAIL ' + f.join(' | ') : 'PASS'; })()"""


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


def rect(cdp, sel):
    return cdp.eval(f"(() => {{ const e = document.querySelector({json.dumps(sel)}); if (!e) return null; e.scrollIntoView({{block: 'center', behavior: 'instant'}}); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }})()")


def tap(cdp, sel):
    """진짜 터치 이벤트로 누른다(click() 이 아니라 손가락 — 터치에서만 생기는 문제를 잡으려고)"""
    xy = rect(cdp, sel)
    if not xy: return False
    time.sleep(0.15)
    xy = rect(cdp, sel)
    pt = [{"x": xy[0], "y": xy[1]}]
    cdp.call("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": pt})
    cdp.call("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    time.sleep(0.35)
    return True


TABLETS = [("iPad mini 세로", 768, 1024), ("iPad Air 세로", 820, 1180), ("iPad mini 가로", 1024, 768), ("iPad Air 가로", 1180, 820), ("iPad Pro 12.9 세로", 1024, 1366), ("갤럭시 탭 S9 가로", 1280, 800)]


def tablet(cdp, go, shot, report, base):
    cdp.call("Emulation.setTouchEmulationEnabled", {"enabled": True, "maxTouchPoints": 5})
    cdp.call("Emulation.setUserAgentOverride", {"userAgent": "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"})
    for name, w, h in TABLETS:
        tag = f"{w}x{h} {name}"
        # 1) 기존 자가검증(UI 로 답안 입력·채점, 모의고사, 강의 퀴즈, 넘침)을 태블릿 크기에서
        go("/academy/cka/lab/?test=cka", w, h, wait=1.0)
        for _ in range(40):
            if (cdp.eval("document.title") or "").startswith("CKA-TEST"): break
            time.sleep(0.5)
        report(f"{tag} 실습 ?test=cka", cdp.eval("document.getElementById('cka-test').textContent"))
        go("/academy/cka/exam/?test=cka", w, h, wait=1.0)
        for _ in range(60):
            if (cdp.eval("document.title") or "").startswith("CKA-TEST"): break
            time.sleep(0.5)
        report(f"{tag} 모의고사 ?test=cka", cdp.eval("document.getElementById('cka-test').textContent"))
        # 2) 태블릿 전용 — 화면 맞춤·글자 크기·버튼 크기·자동 포커스
        go("/academy/cka/lab/?task=t1", w, h, wait=1.5)
        report(f"{tag} 실습 화면(터치·확대·크기)", cdp.eval(TABLET_LAB_JS))
        # 3) 손가락으로: 힌트 → 명령 입력 → ↑ 버튼 → vi 편집기 저장 버튼 → 채점
        f = []
        tap(cdp, "#b-hint")
        if "힌트 1" not in (cdp.eval("document.getElementById('hints').textContent") or ""): f.append("힌트 탭")
        cdp.eval("(()=>{const i=document.querySelector('.term-input');i.value='kubectl get pods -n prod';document.querySelector('.term-in').requestSubmit()})()")
        tap(cdp, ".term-hist")
        if cdp.eval("document.querySelector('.term-input').value") != "kubectl get pods -n prod": f.append("↑ 버튼")
        cdp.eval("(()=>{const i=document.querySelector('.term-input');i.value='vi /root/a.yaml';document.querySelector('.term-in').requestSubmit()})()")
        if cdp.eval("document.querySelector('.term-ed').hidden"): f.append("편집기 안 열림")
        vis = cdp.eval("(()=>{const r=document.querySelector('.term-ed-save').getBoundingClientRect();return r.height>=36&&r.width>0})()")
        if not vis: f.append("저장 버튼이 작거나 안 보임")
        cdp.eval("document.querySelector('.term-ed-text').value = " + json.dumps("hello: tablet\n"))
        tap(cdp, ".term-ed-save")
        if not cdp.eval("document.querySelector('.term-ed').hidden"): f.append("저장 탭 후 편집기 안 닫힘")
        cdp.eval("(()=>{const i=document.querySelector('.term-input');i.value='cat /root/a.yaml';document.querySelector('.term-in').requestSubmit()})()")
        if "hello: tablet" not in (cdp.eval("document.querySelector('.term-out').textContent") or ""): f.append("편집기 저장 내용: " + str(cdp.eval("[...document.querySelectorAll('.term-out .tl')].slice(-5).map(x=>x.textContent.slice(0,70)).join(' || ')")))
        cdp.eval("(()=>{const i=document.querySelector('.term-input');i.value='kubectl set image deployment/web-app nginx=nginx:1.27 -n prod';document.querySelector('.term-in').requestSubmit()})()")
        tap(cdp, "#b-grade")
        if "2 / 2" not in (cdp.eval("document.getElementById('result').textContent") or ""): f.append("채점 탭 결과: " + str(cdp.eval("document.getElementById('result').textContent"))[:80])
        report(f"{tag} 손가락으로 풀고 채점", "PASS" if not f else "FAIL " + " | ".join(f))
        shot(f"tablet-lab-{w}x{h}")
        # 4) 강의 퀴즈를 손가락으로
        go("/academy/cka/rbac/", w, h, wait=1.2)
        ans = cdp.eval("JSON.parse(document.getElementById('quiz-box').dataset.quiz).map(q=>q.answer)")
        for i, a in enumerate(ans or []):
            tap(cdp, f".quiz .q:nth-child({i + 1}) .opt:nth-child({a + 1})")
        sc = cdp.eval("document.getElementById('quiz-score').textContent") or ""
        report(f"{tag} 강의 퀴즈 터치", "PASS" if f"{len(ans)} / {len(ans)}" in sc else "FAIL " + sc[:80])
        # 5) 모의고사 문항 번호를 손가락으로
        go("/academy/cka/exam/", w, h, wait=1.0)
        tap(cdp, "[data-mode=half]")
        tap(cdp, "#qnav button:nth-child(3)")
        cur = cdp.eval("document.querySelector('#qnav button.cur') && document.querySelector('#qnav button.cur').textContent")
        report(f"{tag} 모의고사 문항 이동 터치", "PASS" if cur == "3" else f"FAIL 현재 문항 {cur}")
        shot(f"tablet-exam-{w}x{h}")
        # 시험 중 이탈 경고(beforeunload)는 의도된 동작 — 검사는 시험을 끝내고 떠난다
        cdp.eval("window.confirm = () => true; document.getElementById('finish').click()")
        for page in ("/academy/", "/academy/cka/"):
            go(page, w, h, wait=1.0)
            report(f"{tag} {page} 넘침", cdp.eval(OVERFLOW_JS))
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="")
    ap.add_argument("--serve-port", type=int, default=4411)
    ap.add_argument("--debug-port", type=int, default=9341)
    ap.add_argument("--shots", default="")
    ap.add_argument("--tablet", action="store_true", help="태블릿 크기 + 터치 입력으로 검사")
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
            cdp.call("Emulation.setDeviceMetricsOverride", {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": width < 600 or args.tablet})
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

        if args.tablet:
            return tablet(cdp, go, shot, report, base) or (1 if bad else 0)
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
