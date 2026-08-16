#!/usr/bin/env python3
"""학습 코너(`/learn/`)에 걸린 유튜브 링크가 아직 살아 있는지 확인한다.

`src/i18n/learn.ts` 에서 videoId 를 긁어 유튜브 oEmbed 로 하나씩 물어본다.
- 200 이면 살아 있는 공개 영상 (제목·채널명을 같이 찍는다 → 레지스트리의 표기와 대조 가능)
- 401/403/404 면 비공개·삭제·지역차단 → **그 항목은 learn.ts 에서 빼야 한다.**

⚠️아이가 클릭하는 링크라 죽은 링크는 그대로 실패 경험이 된다. 영상을 추가할 때,
   그리고 가끔(반년에 한 번쯤) 이 스크립트를 돌려 둘 것.

    cd ~/techdecode && python3 tools/learn-video-check.py
    python3 tools/learn-video-check.py --quiet   # 실패한 것만 출력
"""
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REG = Path(__file__).resolve().parent.parent / 'src' / 'i18n' / 'learn.ts'
UA = {'User-Agent': 'Mozilla/5.0 (compatible; menewsoft-linkcheck/1.0)'}


def entries(text: str):
    """{ id: 'xxx', title: '…', channel: '…' } 형태를 순서대로 뽑는다."""
    pat = re.compile(
        r"\{\s*id:\s*'([\w-]{11})'\s*,\s*title:\s*'((?:[^'\\]|\\.)*)'\s*,\s*channel:\s*'((?:[^'\\]|\\.)*)'"
    )
    return [(m.group(1), m.group(2), m.group(3)) for m in pat.finditer(text)]


def check(vid: str):
    url = ('https://www.youtube.com/oembed?url='
           + urllib.parse.quote(f'https://www.youtube.com/watch?v={vid}', safe='')
           + '&format=json')
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
            d = json.load(r)
        return True, d.get('author_name', ''), d.get('title', '')
    except urllib.error.HTTPError as e:
        return False, f'HTTP {e.code}', ''
    except Exception as e:  # 네트워크 문제 등
        return False, str(e), ''


def main() -> int:
    quiet = '--quiet' in sys.argv
    items = entries(REG.read_text(encoding='utf-8'))
    if not items:
        print('레지스트리에서 영상을 하나도 못 찾았습니다. learn.ts 형식이 바뀌었는지 확인하세요.')
        return 2

    seen, dead = set(), []
    for vid, title, channel in items:
        if vid in seen:
            continue
        seen.add(vid)
        ok, author, real_title = check(vid)
        if ok:
            if not quiet:
                print(f'OK   {vid} | {author} | {real_title[:60]}')
        else:
            dead.append((vid, title, channel, author))
            print(f'DEAD {vid} | 등록명: {channel} / {title} | {author}')

    print(f'\n총 {len(seen)}개 · 살아 있음 {len(seen) - len(dead)}개 · 죽음 {len(dead)}개')
    if dead:
        print('\n⚠️죽은 링크는 src/i18n/learn.ts 에서 제거하거나 대체 영상을 찾아 넣으세요.')
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
