#!/usr/bin/env python3
"""학습 게임 4종의 **자산 검사** — 브라우저 자가검증(`?test=sim`)이 못 보는 것을 본다.

`?test=sim` 은 파일이 200 으로 내려오는지까지만 안다. 그런데 실제로 겪는 사고는 그 앞이다:
  · TTS 가 문장을 **중간에서 잘라** 내보낸 mp3 (파일은 멀쩡히 존재한다)
  · 문제를 고친 뒤 **음성을 다시 안 만들어** 대본과 소리가 어긋난 경우
  · 은행에서 지운 문제의 mp3 가 남아 저장소만 불리는 경우
  · 커버 이미지가 없거나 크기가 다른 경우

  python3 tools/verify-games.py            # 전부
  python3 tools/verify-games.py --quick    # 음성 길이 검사 생략(빠름)
"""
from __future__ import annotations
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / 'public' / 'games'

# (이름, bank.json 경로, voice 폴더, 대본을 뽑는 함수, 커버들)
GAMES = [
    ('유진이의 수학여행', PUB / 'yujin' / 'bank.json', PUB / 'yujin' / 'voice',
     [PUB / 'yujin' / 'cover.jpg']),
    ('수호의 수학여행', PUB / 'suho' / 'bank.json', PUB / 'suho' / 'voice',
     [PUB / 'suho' / 'cover.jpg']),
    ('깨비의 수학여행', PUB / 'kkaebi' / 'bank.json', PUB / 'kkaebi' / 'voice',
     [PUB / 'kkaebi' / 'cover.jpg']),
    ('유자의 과학동산 여행', PUB / 'ujaquest' / 'science.json', PUB / 'ujaquest' / 'voice' / 'science',
     [PUB / 'ujaquest' / 'cover-science.jpg']),
    ('유자의 도덕동산 여행', PUB / 'ujaquest' / 'moral.json', PUB / 'ujaquest' / 'voice' / 'moral',
     [PUB / 'ujaquest' / 'cover-moral.jpg']),
    # ⚠️깨비의 동산 여행은 문제·음성을 유자와 통째로 같이 쓴다(다른 것은 인사말 한 줄뿐).
    #    같은 은행을 두 번 검사하는 셈이라 커버만 확인한다.
    ('깨비의 과학동산 여행', None, None, [PUB / 'ujaquest' / 'cover-kkaebi-science.jpg']),
    ('깨비의 도덕동산 여행', None, None, [PUB / 'ujaquest' / 'cover-kkaebi-moral.jpg']),
    # 문주(6학년) 게임 3종은 나레이션 음성이 없다 — 6학년은 글을 읽는다. 커버만 본다.
    ('문주의 피아노', None, None, [PUB / 'munju' / 'piano' / 'cover.jpg']),
    ('문주의 수학 방탈출', None, None, [PUB / 'munju' / 'math' / 'cover.jpg']),
    ('문주의 한국사 탐험', None, None, [PUB / 'munju' / 'history' / 'cover.jpg']),
]

# 한국어 나레이션 속도의 대략치(글자/초). edge-tts SunHi, rate -8% 실측 기준.
CPS_MIN, CPS_MAX = 2.6, 10.0
DUR_MIN, DUR_MAX = 0.7, 30.0


def dur(path: Path) -> float | None:
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                        '-of', 'csv=p=0', str(path)], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return None


def check_text(name: str, lines: dict) -> list[str]:
    """읽히는 문장 자체의 흠 — 아이가 귀로 듣는 문장이라 그냥 두면 안 된다."""
    bad = []
    for k, v in lines.items():
        if not v or not v.strip():
            bad.append(f'{name}/{k}: 문장이 비었음')
            continue
        if re.search(r'[*#`_]{1,}', v):
            bad.append(f'{name}/{k}: 마크다운 기호가 읽힌다 — {v[:40]}')
        if '  ' in v:
            bad.append(f'{name}/{k}: 공백이 두 번 — {v[:40]}')
        if re.search(r'undefined|NaN|None', v):
            bad.append(f'{name}/{k}: undefined/NaN — {v[:40]}')
        if v.count('볼까?') > 1 or v.count('풀어 볼까? 다시') > 0:
            bad.append(f'{name}/{k}: 꼬리말이 두 번 붙었다 — {v[:60]}')
        # 숫자 뒤 조사 — "3를", "8야" 같은 어긋남
        for m in re.finditer(r'(\d)(이|가|은|는|을|를|과|와|야|이야)(?![가-힣])', v):
            d, jo = int(m.group(1)), m.group(2)
            jong = {0: 1, 1: 1, 2: 0, 3: 1, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1, 9: 0}[d]
            ok = {'이': jong, '가': not jong, '은': jong, '는': not jong, '을': jong,
                  '를': not jong, '과': jong, '와': not jong, '야': not jong,
                  '이야': jong}[jo]
            if not ok:
                bad.append(f'{name}/{k}: 조사가 어긋남 "{m.group(0)}" — {v[:44]}')
    return bad


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--quick', action='store_true', help='음성 길이 검사 생략')
    args = ap.parse_args()
    if not shutil.which('ffprobe'):
        print('⚠️ffprobe 가 없어 음성 길이 검사를 건너뜁니다')
        args.quick = True

    bad: list[str] = []
    for name, bankp, vdir, covers in GAMES:
        if bankp is None:            # 문제·음성을 다른 주인공과 통째로 같이 쓰는 게임 — 커버만 본다
            for c in covers:
                if not c.exists():
                    bad.append(f'{name}: 커버 없음 {c.name}')
                elif c.stat().st_size < 10_000:
                    bad.append(f'{name}: 커버가 너무 작다 {c.name}')
            continue
        if not bankp.exists():
            bad.append(f'{name}: 문제 은행이 없음 {bankp}')
            continue
        bank = json.loads(bankp.read_text(encoding='utf-8'))
        lines = bank['lines']

        # 1) 대본 ↔ 음성 파일 1:1
        want = set(lines)
        have = {f.stem for f in vdir.glob('*.mp3')} if vdir.exists() else set()
        for k in sorted(want - have):
            bad.append(f'{name}: 음성 없음 — {k}.mp3 (대본에는 있다)')
        for k in sorted(have - want):
            bad.append(f'{name}: 남은 음성 — {k}.mp3 (대본에 없다)')

        # 2) 문제마다 q_/o_ 음성이 있는가 (은행에 문제를 추가하고 TTS 를 안 돌린 경우)
        for st in bank.get('stages', []):
            for p in st.get('problems', []) or []:
                if isinstance(p, dict) and 'id' in p and 'a' in p and 'c' in p:
                    for pre in ('q_', 'o_'):
                        if f'{pre}{p["id"]}' not in want:
                            bad.append(f'{name}: 문제 {p["id"]} 의 {pre} 대본이 없다')

        # 3) 문장 자체의 흠
        bad += check_text(name, lines)

        # 4) 음성 길이 — 파일이 있어도 **중간에서 잘려 있으면** 소용이 없다
        if not args.quick:
            for k, text in lines.items():
                f = vdir / f'{k}.mp3'
                if not f.exists():
                    continue
                d = dur(f)
                if d is None:
                    bad.append(f'{name}/{k}: mp3 를 읽을 수 없다(깨진 파일)')
                    continue
                if not (DUR_MIN <= d <= DUR_MAX):
                    bad.append(f'{name}/{k}: 길이 이상 {d:.1f}초')
                    continue
                cps = len(text) / d
                if not (CPS_MIN <= cps <= CPS_MAX):
                    bad.append(f'{name}/{k}: 글자수 대비 길이가 이상하다 '
                               f'({len(text)}자 / {d:.1f}초 = {cps:.1f}자per초) — 잘렸을 수 있다')

        # 5) 커버
        for c in covers:
            if not c.exists():
                bad.append(f'{name}: 커버 없음 {c.name}')
            elif c.stat().st_size < 10_000:
                bad.append(f'{name}: 커버가 너무 작다 {c.name}')

        n_clip = len(want)
        n_prob = sum(len(s.get('problems', []) or []) for s in bank.get('stages', []))
        print(f'  {name}: 음성 {n_clip}개 · 문제 {n_prob or "(실행 중 생성)"} · '
              f'{sum(f.stat().st_size for f in vdir.glob("*.mp3"))/1024/1024:.1f}MB')

    # 6) games.ts 에 등록된 경로가 실제로 있는가
    gts = (ROOT / 'src' / 'i18n' / 'games.ts').read_text()
    for m in re.finditer(r"playPath: '([^']+)'", gts):
        f = ROOT / 'public' / m.group(1).lstrip('/')
        if not f.exists():
            bad.append(f'games.ts: playPath 파일이 없다 {m.group(1)}')
    for m in re.finditer(r"cover: '([^']+)'", gts):
        f = ROOT / 'public' / m.group(1).lstrip('/')
        if not f.exists():
            bad.append(f'games.ts: cover 파일이 없다 {m.group(1)}')

    # 7) ★게임 파일이 **사이트가 만드는 페이지에 가려지지 않는가**
    #    `/games/<슬러그>/` 는 그 게임의 소개 페이지 주소다. 게임 폴더를 슬러그와 같은 이름으로
    #    두면 빌드가 소개 페이지로 덮어써서, 게임 주소를 열면 게임 대신 소개 글이 나온다.
    #    (2026-08-19 문주 게임 3종이 실제로 이렇게 배포됐다. 로컬은 public/ 을 직접 띄워서 못 잡았다.)
    for m in re.finditer(r"slug: '([^']+)',\n(?:.*\n)*?    playPath: '([^']+)'", gts):
        slug, play = m.group(1), m.group(2)
        if play.rstrip('/') in (f'/games/{slug}/index.html', f'/games/{slug}'):
            bad.append(f'{slug}: 게임 파일 경로가 소개 페이지 주소와 겹친다 ({play}) '
                       f'— 폴더 이름을 슬러그와 다르게 두세요')
    dist = ROOT / 'dist'
    if dist.exists():
        for m in re.finditer(r"playPath: '([^']+)'", gts):
            f = dist / m.group(1).lstrip('/')
            if not f.exists():
                bad.append(f'빌드 결과에 게임 파일이 없다 {m.group(1)}')
                continue
            head = f.read_text(encoding='utf-8', errors='ignore')[:4000]
            if 'MeNew Soft' in head or 'astro' in head.lower():
                bad.append(f'빌드 결과의 {m.group(1)} 가 게임이 아니라 **사이트 페이지**다 '
                           f'(소개 페이지가 게임을 덮어썼다)')

    if bad:
        print(f'\n⛔ {len(bad)}건')
        for b in bad[:40]:
            print('  ·', b)
        if len(bad) > 40:
            print(f'  … 외 {len(bad) - 40}건')
        return 1
    print('\n✅ 자산 검사 통과')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
