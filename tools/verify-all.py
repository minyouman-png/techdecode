#!/usr/bin/env python3
"""배포 전 전체 검증 — 학습 코너 + 게임 11종을 한 번에 돌린다.

  python3 tools/verify-all.py           # 전부 (학습 코너는 dist 가 필요해 빌드부터)
  python3 tools/verify-all.py --games   # 게임만 (빌드 불필요, 빠름)
  python3 tools/verify-all.py --narrow  # 게임 자가검증을 좁은 화면(360px)에서도 한 번 더

⚠️게임 자가검증은 무작위로 만든 판을 돌린다 — **한 번 통과했다고 통과가 아니다.**
   그래서 게임마다 기본 2회 돌린다(`--rounds` 로 조절).
"""
from __future__ import annotations
import argparse
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PY = sys.executable


def run(title: str, cmd: list[str]) -> tuple[str, bool, float, str]:
    t0 = time.time()
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT.parent))
    out = (r.stdout + r.stderr).strip()
    return title, r.returncode == 0, time.time() - t0, out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--games', action='store_true', help='게임만 검증(빌드 생략)')
    ap.add_argument('--narrow', action='store_true', help='좁은 화면에서도 한 번 더')
    ap.add_argument('--rounds', type=int, default=2)
    ap.add_argument('--quick', action='store_true', help='음성 길이 검사 생략')
    args = ap.parse_args()

    jobs: list[tuple[str, list[str]]] = []
    jobs.append(('자산 검사(음성·커버·등록 경로)',
                 [PY, 'tools/verify-games.py'] + (['--quick'] if args.quick else [])))
    for i in range(args.rounds):
        jobs.append((f'유진이의 수학여행 sim #{i + 1}',
                     [PY, 'tools/mathquest-selftest.py', '--hero', 'yujin']))
        jobs.append((f'수호의 수학여행 sim #{i + 1}',
                     [PY, 'tools/mathquest-selftest.py', '--hero', 'suho']))
        jobs.append((f'깨비의 수학여행 sim #{i + 1}',
                     [PY, 'tools/mathquest-selftest.py', '--hero', 'kkaebi']))
        for _h in ('uja', 'kkaebi'):
            jobs.append((f'과학동산 sim {_h} #{i + 1}',
                         [PY, 'tools/ujaquest-selftest.py', '--subject', 'science', '--hero', _h]))
            jobs.append((f'도덕동산 sim {_h} #{i + 1}',
                         [PY, 'tools/ujaquest-selftest.py', '--subject', 'moral', '--hero', _h]))
        for _g in ('piano', 'math', 'history'):
            jobs.append((f'문주 {_g} sim #{i + 1}',
                         [PY, 'tools/munju-selftest.py', '--game', _g]))
        jobs.append((f'조스 오브 파이터즈 sim #{i + 1}',
                     [PY, 'tools/munju-selftest.py', '--game', 'joss', '--wait', '16']))
    # ⚠️소리는 sim 이 못 잡는다 — 실제 출력 파형을 재는 검사가 따로 있어야 한다
    jobs.append(('조스 오브 파이터즈 소리(파형 측정)', [PY, 'tools/joss-audio-check.py']))
    if args.narrow:
        for _g in ('piano', 'math', 'history'):
            jobs.append((f'문주 {_g} sim (390px)',
                         [PY, 'tools/munju-selftest.py', '--game', _g,
                          '--width', '390', '--height', '760']))
        for _h in ('yujin', 'suho', 'kkaebi'):
            jobs.append((f'수학여행 sim {_h} (360px)',
                         [PY, 'tools/mathquest-selftest.py', '--hero', _h,
                          '--width', '360', '--height', '760']))
        for _h in ('uja', 'kkaebi'):
            jobs.append((f'과학동산 sim {_h} (360px)',
                         [PY, 'tools/ujaquest-selftest.py', '--subject', 'science', '--hero', _h,
                          '--width', '360', '--height', '760']))
            jobs.append((f'도덕동산 sim {_h} (360px)',
                         [PY, 'tools/ujaquest-selftest.py', '--subject', 'moral', '--hero', _h,
                          '--width', '360', '--height', '760']))
    if not args.games:
        jobs.insert(0, ('사이트 빌드', ['npm', 'run', 'build']))
        jobs.append(('학습 코너 /learn/ 자가검증', [PY, 'tools/learn-selftest.py']))
        # dist 가 필요하다 — 게임만 돌릴 때(--games)는 빌드를 건너뛰므로 같이 뺀다
        jobs.append(('놀이공간 놀이방 목록(좌측 분류)', [PY, 'tools/games-index-selftest.py']))

    results = []
    for title, cmd in jobs:
        title, ok, sec, out = run(title, cmd)
        print(f'{"✅" if ok else "⛔"} {title:<34} {sec:5.1f}초')
        if not ok:
            for ln in out.splitlines()[:14]:
                print('     ', ln)
        results.append((title, ok))

    bad = [t for t, ok in results if not ok]
    print()
    if bad:
        print(f'⛔ {len(bad)}/{len(results)} 실패: ' + ', '.join(bad))
        return 1
    print(f'✅ {len(results)}개 검증 전부 통과')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
