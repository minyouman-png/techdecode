#!/usr/bin/env python3
"""수학여행(유진·수호) — 나레이션 음성 생성.

쇼츠공장([[shorts-factory-project]])과 **같은 TTS 스택**(edge-tts)을 쓴다. 다만 파라미터는 다르다:
⚠️쇼츠 나레이션 속도(1.35)로 1학년에게 문제를 읽어 주면 문제가 아니라 재촉이 된다.
   여기선 **기본보다 느리게(-8%)** 읽고, 성우도 남성 나레이터가 아니라 SunHi(여성)로 간다.

  cd ~/techdecode && python3 tools/yujin-tts.py            # 없는 것만 생성
  python3 tools/yujin-tts.py --force                       # 전부 다시 생성
  python3 tools/yujin-tts.py --only s3p1                   # 한 문제만

⚠️edge-tts 는 shorts-factory 의 venv 에 들어 있다 — 이 스크립트는 그 venv 로 실행해야 한다.
"""
from __future__ import annotations
import argparse
import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / 'public' / 'games'
HEROES = ('yujin', 'suho')      # 수학여행은 아이마다 자기 이름으로 부르는 음성을 따로 갖는다

VOICE = 'ko-KR-SunHiNeural'
RATE = '-8%'      # 1학년이 따라올 수 있는 속도
PITCH = '+0Hz'


def clips(bank: dict):
    """(파일이름, 읽을 문장) 목록. v3 부터 대본은 `lines` 하나에 다 들어 있다
    (숫자는 게임이 실행 중에 만들기 때문에 문제별 음성이 없다)."""
    return list(bank['lines'].items())


async def gen(text: str, path: Path):
    import edge_tts
    await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(str(path))


def shrink(path: Path):
    """edge-tts 는 48kbps 로 준다 — 아이 목소리 나레이션엔 과하다.
    32kbps 모노로 다시 인코딩해 **받는 용량을 3분의 1 줄인다**(음질 차이는 말소리에선 안 들린다).
    ffmpeg 가 없으면 원본을 그대로 둔다(게임은 어느 쪽이든 돈다)."""
    import shutil
    import subprocess
    if not shutil.which('ffmpeg'):
        return
    tmp = path.with_suffix('.tmp.mp3')
    r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(path),
                        '-c:a', 'libmp3lame', '-b:a', '32k', '-ac', '1', '-ar', '24000', str(tmp)],
                       capture_output=True)
    if r.returncode == 0 and tmp.exists() and tmp.stat().st_size > 500:
        tmp.replace(path)
    elif tmp.exists():
        tmp.unlink()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--only', default='')
    ap.add_argument('--hero', default='', choices=('',) + HEROES)
    args = ap.parse_args()

    made = skipped = failed = 0
    for hero in ([args.hero] if args.hero else list(HEROES)):
        made_h, skipped_h, failed_h = run_hero(hero, args)
        made += made_h; skipped += skipped_h; failed += failed_h
    return 1 if failed else 0


def run_hero(hero: str, args) -> tuple[int, int, int]:
    BANK = BASE / hero / 'bank.json'
    VOICE_DIR = BASE / hero / 'voice'
    bank = json.loads(BANK.read_text(encoding='utf-8'))
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    todo = [(n, t) for n, t in clips(bank) if not args.only or args.only in n]
    made = skipped = failed = 0
    for i, (name, text) in enumerate(todo, 1):
        path = VOICE_DIR / f'{name}.mp3'
        if path.exists() and path.stat().st_size > 500 and not args.force:
            skipped += 1
            continue
        try:
            asyncio.run(gen(text, path))
            shrink(path)
            made += 1
            if made % 20 == 0:
                print(f'  [{hero}] … {i}/{len(todo)}', flush=True)
        except Exception as e:              # 네트워크 실패는 다시 돌리면 이어서 채워진다
            print(f'  ⚠️ {name}: {e}', file=sys.stderr)
            failed += 1
    total = sum(f.stat().st_size for f in VOICE_DIR.glob('*.mp3'))
    print(f'[{hero}] 생성 {made} · 건너뜀 {skipped} · 실패 {failed} · '
          f'총 {len(list(VOICE_DIR.glob("*.mp3")))}개 {total/1024/1024:.2f}MB')
    return made, skipped, failed


if __name__ == '__main__':
    raise SystemExit(main())
