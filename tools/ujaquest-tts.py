#!/usr/bin/env python3
"""유자의 과학동산 / 도덕동산 — 나레이션 음성 생성.

[[yujin-math-game]] 의 tools/yujin-tts.py 와 같은 설정(edge-tts · SunHi · -8%)이다.
⚠️1학년에게 문제를 읽어 주는 속도다. 쇼츠 나레이션 속도(1.35)로 읽으면 재촉이 된다.
⚠️edge-tts 는 shorts-factory venv 에 있다:
    ~/shorts-factory/venv/bin/python tools/ujaquest-tts.py
"""
from __future__ import annotations
import argparse
import asyncio
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / 'public' / 'games' / 'ujaquest'
VOICE = 'ko-KR-SunHiNeural'
RATE = '-8%'


async def gen(text: str, path: Path):
    import edge_tts
    await edge_tts.Communicate(text, VOICE, rate=RATE, pitch='+0Hz').save(str(path))


def shrink(path: Path):
    """48kbps → 32kbps 모노. 말소리에선 차이가 안 들리고 받는 용량은 3분의 1 준다."""
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
    ap.add_argument('--subject', default='')      # science | moral (비우면 둘 다)
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()
    subjects = [args.subject] if args.subject else ['science', 'moral']
    failed = 0
    for name in subjects:
        bank = json.loads((BASE / f'{name}.json').read_text(encoding='utf-8'))
        vdir = BASE / 'voice' / name
        vdir.mkdir(parents=True, exist_ok=True)
        made = skipped = 0
        items = list(bank['lines'].items())
        for i, (key, text) in enumerate(items, 1):
            path = vdir / f'{key}.mp3'
            if path.exists() and path.stat().st_size > 500 and not args.force:
                skipped += 1
                continue
            try:
                asyncio.run(gen(text, path))
                shrink(path)
                made += 1
                if made % 40 == 0:
                    print(f'  {name} … {i}/{len(items)}', flush=True)
            except Exception as e:
                print(f'  ⚠️ {name}/{key}: {e}', file=sys.stderr)
                failed += 1
        total = sum(f.stat().st_size for f in vdir.glob('*.mp3'))
        print(f'{name}: 생성 {made} · 건너뜀 {skipped} · '
              f'총 {len(list(vdir.glob("*.mp3")))}개 {total/1024/1024:.2f}MB')
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
