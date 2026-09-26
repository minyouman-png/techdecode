#!/usr/bin/env python3
"""배포 전 전체 검증 — 게시판 + 학습 코너 + 게임 11종을 한 번에 돌린다.

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
        jobs.append((f'영어 동물원 sim #{i + 1}', [PY, 'tools/englishzoo-selftest.py']))
    # ⚠️소리는 sim 이 못 잡는다 — 실제 출력 파형을 재는 검사가 따로 있어야 한다
    jobs.append(('조스 오브 파이터즈 소리(파형 측정)', [PY, 'tools/joss-audio-check.py']))
    # ⚠️컷아웃 그림은 비동기로 실린다 — sim 이 끝난 뒤에 와서 sim 으로는 못 잡는다
    jobs.append(('조스 오브 파이터즈 컷아웃 그림', [PY, 'tools/joss-tex-check.py']))
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
        # 자격증 학원 — 시뮬레이터 과제 전부(준비≠만점, 답안=만점) + 페이지(UI 로 답안 입력·모의고사·강의 퀴즈)
        jobs.append(('자격증 학원 시뮬레이터 과제', ['node', 'tools/cka-sim-test.mjs']))
        jobs.append(('자격증 학원 /academy/ 자가검증', [PY, 'tools/cka-selftest.py']))
        # 태블릿(iPad 세로·가로, 갤럭시 탭) 크기 + 터치 입력 — 손가락 탭으로 풀고 채점까지
        jobs.append(('자격증 학원 태블릿·터치', [PY, 'tools/cka-selftest.py', '--tablet']))
        # dist 가 필요하다 — 게임만 돌릴 때(--games)는 빌드를 건너뛰므로 같이 뺀다
        jobs.append(('놀이공간 놀이방 목록(좌측 분류)', [PY, 'tools/games-index-selftest.py']))
        # ★게시판이 여기 빠져 있었다 — 그래서 2026-09-05 로그인 문의 때 통합 검증은
        #   게시판을 **한 번도 열어 보지 않은 채** 통과하고 있었다. 로그인 경로와
        #   장애 주입(SDK·Firestore 차단)까지 보므로 다른 검사보다 시간이 좀 걸린다.
        jobs.append(('게시판 /board/ 자가검증', [PY, 'tools/board-selftest.py']))
        # ★로그인한 뒤에 사람이 하는 일(닉네임·글쓰기·댓글·수정·삭제)은 구글 로그인을
        #   자동화할 수 없어 통째로 검증 밖에 있었다 → 에뮬레이터로 끝까지 해 본다.
        #   ⚠️firebase CLI 와 JDK 21+ 가 있어야 한다(npm 스크립트가 openjdk@25 를 박아 준다).
        jobs.append(('게시판 로그인 뒤 사람 경로 e2e', ['npm', 'run', '--silent', 'board:e2e']))

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
