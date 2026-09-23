#!/usr/bin/env python3
"""영어 낱말 발음 mp3 생성 — macOS `say` + ffmpeg.

왜 미리 만들어 두는가:
  브라우저 내장 음성(speechSynthesis)은 기기마다 영어 목소리가 없거나 비동기로 늦게 뜬다.
  아이가 쓰는 화면에서 그건 '눌렀는데 아무 소리도 안 남'이 된다. 그래서 파일로 박아 둔다.
  (내장 음성은 게임 쪽에서 mp3 가 실패했을 때의 보조로만 쓴다.)

낱말마다 두 개를 만든다:
  <id>.mp3       보통 속도(rate 165)
  <id>_slow.mp3  천천히 — 아이가 따라 말할 때 쓴다.
  ⚠️★`say -r` 은 '분당 낱말 수'라 **낱말 하나에는 거의 안 먹는다**(실측: rate 165→0.59s,
    100→0.71s, 70→0.77s, 50→0.77s로 70에서 포화). 그래서 느림 버전은 rate 70 으로 뽑은 뒤
    ffmpeg `atempo` 로 **음높이를 유지한 채** 늘린다(0.65 → 1.15s, 보통 0.49s의 2.3배).
    브라우저 playbackRate 로 늦추는 방법은 음높이가 내려가 발음 본보기로 못 쓴다.

사용: python3 tools/englishzoo-audio.py [--force]
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "public/games/englishzoo"
OUT = GAME / "audio"
VOICE = "Samantha"          # en_US, macOS 기본 탑재 — 또렷하고 아이가 듣기 편하다
# (rate, atempo) — atempo 는 음높이를 유지하는 시간 늘이기. None 이면 그대로.
RATES = {"": (165, None), "_slow": (70, 0.65)}
FORCE = "--force" in sys.argv


def words():
    src = (GAME / "words.js").read_text(encoding="utf-8")
    out = []
    for m in re.finditer(r"\{\s*id:'([^']+)',\s*en:'([^']+)'", src):
        out.append((m.group(1), m.group(2)))
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ws = words()
    assert ws, "words.js 에서 낱말을 못 읽었다"
    made = skipped = 0
    for wid, en in ws:
        for suf, (rate, tempo) in RATES.items():
            mp3 = OUT / f"{wid}{suf}.mp3"
            if mp3.exists() and not FORCE:
                skipped += 1
                continue
            aiff = OUT / f"_{wid}{suf}.aiff"
            subprocess.run(["say", "-v", VOICE, "-r", str(rate), "-o", str(aiff), en], check=True)
            trim = ("silenceremove=start_periods=1:start_silence=0.05:start_threshold=-45dB,"
                    "areverse,silenceremove=start_periods=1:start_silence=0.05:start_threshold=-45dB,areverse")
            af = f"{trim},atempo={tempo}" if tempo else trim
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(aiff),
                            "-codec:a", "libmp3lame", "-b:a", "64k", "-ar", "24000",
                            "-af", af, str(mp3)], check=True)
            aiff.unlink()
            made += 1
    # 낱말 목록과 실제 파일이 어긋나면 게임에서 조용히 무음이 된다 → 여기서 잡는다.
    missing = [f"{w}{s}" for w, _ in ws for s in RATES if not (OUT / f"{w}{s}.mp3").exists()]
    total = sum(f.stat().st_size for f in OUT.glob("*.mp3"))
    print(f"낱말 {len(ws)} · 생성 {made} · 건너뜀 {skipped} · 누락 {len(missing)}")
    print(f"파일 {len(list(OUT.glob('*.mp3')))}개 · 합계 {total/1024:.0f}KB")
    if missing:
        print("⚠️ 누락:", missing[:10]); sys.exit(1)


if __name__ == "__main__":
    main()
