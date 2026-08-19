#!/usr/bin/env python3
"""덧칠한 그림을 **부위별 살점**으로 잘라 컷아웃 텍스처를 만든다.

  python3 tools/joss-cut.py --chars minyu

입력  /tmp/joss-parts/<키>/{mask_*.png, geom.json} + /tmp/joss-paint/<키>.png
출력  public/games/jossfight/art/parts/<키>/{torso,head,armU,armL,legU,legL}.png + parts.json

⚠️관절에서는 부위끼리 **반드시 겹친다**(어깨·엉덩이·팔꿈치·무릎). 위에 오는 부위가 픽셀을
  가져가고, 아래 부위에는 구멍이 남는다. 그 구멍은 **주변 색으로 메운다** — 실제로는 늘
  그 위를 다른 부위가 덮기 때문에 보이지 않지만, 안 메우면 팔을 들었을 때 가슴에 구멍이 뚫린다.
⚠️좌표는 게임의 **로컬 단위**로 적는다(내보낼 때 배율 s 로 나눈다). 그래야 게임에서 배율이
  달라져도 그대로 맞는다.
"""
from __future__ import annotations
import argparse
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "public" / "games" / "jossfight" / "art" / "parts"
PARTS_DIR = Path("/tmp/joss-parts")
PAINT_DIR = Path("/tmp/joss-paint")

# 위에 오는 것이 뒤 — 이 순서대로 픽셀 임자를 정한다
ORDER = ["torso", "legU", "legL", "head", "armU", "armL"]


def fill_holes(rgb, valid, want, rounds=60):
    """valid(임자로 확정된 픽셀)에서 want 안쪽으로 색을 번지게 해 구멍을 메운다."""
    import numpy as np
    out = rgb.astype(np.float32).copy()
    known = valid.copy()
    todo = want & ~known
    for _ in range(rounds):
        if not todo.any():
            break
        # 상하좌우 이웃의 평균으로 한 겹씩 채운다
        acc = np.zeros_like(out)
        cnt = np.zeros(known.shape, np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sh = np.roll(np.where(known[..., None], out, 0), (dy, dx), (0, 1))
            shk = np.roll(known, (dy, dx), (0, 1)).astype(np.float32)
            acc += sh
            cnt += shk
        grow = todo & (cnt > 0)
        if not grow.any():
            break
        out[grow] = acc[grow] / cnt[grow][..., None]
        known |= grow
        todo &= ~grow
    return out.astype("uint8")


def cut(key: str) -> bool:
    import numpy as np
    from PIL import Image

    src = PARTS_DIR / key
    paint = PAINT_DIR / f"{key}.png"
    if not (src / "geom.json").exists() or not paint.exists():
        print(f"· {key}: 재료 없음(마스크 {src.exists()} / 덧칠 {paint.exists()})")
        return False
    meta = json.loads((src / "geom.json").read_text())
    s = float(meta["scale"])
    img = np.array(Image.open(paint).convert("RGB"))

    masks = {}
    for p in ORDER:
        a = np.array(Image.open(src / f"mask_{p}.png").convert("RGBA"))[..., 3]
        m = a > 150                     # ⚠️반투명 가장자리를 넣으면 배경 회색이 묻어 흰 테두리가 생긴다
        m = m & np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1)
        masks[p] = m

    # 임자 정하기 — 뒤에 오는 부위가 이긴다
    owner = {}
    taken = np.zeros(masks[ORDER[0]].shape, bool)
    for p in reversed(ORDER):                     # 위에 오는 것부터 가져간다
        owner[p] = masks[p] & ~taken
        taken |= masks[p]

    out_dir = ART / key
    out_dir.mkdir(parents=True, exist_ok=True)
    parts_meta = {}
    for p in ORDER:
        own, mine = masks[p], owner[p]
        if own.sum() == 0:
            print(f"· {key}/{p}: 마스크가 비었다")
            return False
        rgb = fill_holes(img, mine, own)
        ys, xs = np.where(own)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = np.dstack([rgb[y0:y1, x0:x1], (own[y0:y1, x0:x1] * 255).astype("uint8")])
        Image.fromarray(crop, "RGBA").save(out_dir / f"{p}.png")

        g = meta["geom"][p]
        if p == "head":
            parts_meta[p] = {
                "ox": (x0 - g["x1"]) / s, "oy": (y0 - g["y1"]) / s,
                "w": (x1 - x0) / s, "h": (y1 - y0) / s, "len": 0, "ang": 0,
            }
        else:
            parts_meta[p] = {
                "ox": (x0 - g["x1"]) / s, "oy": (y0 - g["y1"]) / s,
                "w": (x1 - x0) / s, "h": (y1 - y0) / s,
                "len": g["len"] / s, "ang": g["ang"],
            }
    (out_dir / "parts.json").write_text(json.dumps(parts_meta, indent=1))
    sizes = ", ".join(f"{p} {parts_meta[p]['w']:.0f}x{parts_meta[p]['h']:.0f}" for p in ORDER)
    print(f"✅ {key}: {sizes}")
    return True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--chars", default="minyu")
    args = ap.parse_args()
    ok = all(cut(k.strip()) for k in args.chars.split(",") if k.strip())
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
