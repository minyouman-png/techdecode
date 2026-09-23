#!/usr/bin/env python3
"""영어 프로그램(`/learn/english-plan/`)에 걸린 유튜브 링크가 살아 있는지 확인한다.

⚠️아이가 클릭하는 링크다. 죽은 링크는 그대로 실패 경험이 된다.
⚠️★제목까지 보고 확인할 것. 실제로 겪은 일(2026-09-23): 후보 20개 중 10개가 404 였고,
  살아 있는 것 중에도 '염소 우는 영상'과 '개발 강의'가 섞여 있었다. 200 만 보면 엉뚱한 것이 간다.

    python3 tools/english-plan-check.py
"""
import json, re, sys, urllib.parse, urllib.request
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "src" / "i18n" / "english-plan.ts"
UA = {"User-Agent": "Mozilla/5.0 (compatible; menewsoft-linkcheck/1.0)"}

def main() -> int:
    text = SRC.read_text(encoding="utf-8")
    vids = re.findall(r"\{ id: '([A-Za-z0-9_-]{11})', title: '([^']+)'", text)
    bad = []
    for vid, title in vids:
        u = "https://www.youtube.com/oembed?" + urllib.parse.urlencode(
            {"url": f"https://www.youtube.com/watch?v={vid}", "format": "json"})
        try:
            d = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=10).read())
            print(f"  ✅ {vid}  {d['title'][:48]:50} — {d['author_name'][:24]}")
        except Exception as e:
            print(f"  ❌ {vid}  ({getattr(e, 'code', e)})  등록명: {title}")
            bad.append(vid)
    print(f"\n영상 {len(vids)}개 · 죽은 링크 {len(bad)}개")
    return 1 if bad else 0

if __name__ == "__main__":
    raise SystemExit(main())
