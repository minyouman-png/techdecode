#!/usr/bin/env python3
"""조스 오브 파이터즈 배경·초상화 생성 — 쇼츠공장의 윈도우 렌더호스트(RTX 4070)를 빌려 쓴다.

  python3 tools/joss-art.py --what stages     # 무대 배경 7장
  python3 tools/joss-art.py --what chars      # 캐릭터 초상 10장
  python3 tools/joss-art.py --what stages --only palace,beer   # 다시 뽑을 것만

⚠️그림은 **배경 위층**으로만 쓴다 — 바닥과 캐릭터가 서는 띠는 지금처럼 코드가 그린다.
  AI 배경에 바닥까지 맡기면 캐릭터 발이 배경 바닥과 어긋나고, 시차(패럴랙스)도 죽는다.
⚠️생성물은 **반드시 눈으로 보고** 넣는다. 사람이 들어갔거나 글자가 박힌 그림은 버린다.
⚠️호스트를 깨우고 재우는 책임은 remote_render 가 진다(유휴 30분 판정 뒤 최대절전).
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

SF = Path.home() / "shorts-factory"
sys.path.insert(0, str(SF))
sys.path.insert(0, str(SF / "src"))

ART = Path(__file__).resolve().parent.parent / "public" / "games" / "jossfight" / "art"

# 회화풍 체크포인트 — 지금 게임 그림이 셀 셰이딩(2D)이라 3D 카툰보다 이쪽이 붙는다
MODEL = "Lykon/dreamshaper-xl-1-0"

STAGE_SUFFIX = (", 2D fighting game stage background, wide establishing shot, "
                "empty foreground, dramatic cinematic lighting, digital painting, "
                "highly detailed, no people, no text")
STAGE_NEG = ("people, person, human, figure, crowd, text, letters, watermark, signature, "
             "logo, ui, hud, blurry, lowres, jpeg artifacts, distorted perspective")

STAGES = {
    "palace":     "empty courtyard in front of a grand desert mosque at golden sunset, ornate arches and minarets, sand dunes far behind, warm orange sky, god rays",
    "postoffice": "front yard of a small Korean town post office, red brick walls, parked delivery scooters, quiet morning street, soft warm light",
    "somo":       "plaza in front of a modern corporate glass tower at dusk, revolving door lobby glowing, cold blue light, wet pavement reflections",
    "beer":       "interior of a dim warehouse stacked high with wooden beer crates and barrels, hanging industrial lamps, dusty air, shafts of light",
    "jokgu":      "outdoor clay sports court in late afternoon, chain link fence, big green trees behind, long shadows, warm sunlight",
    "pangyo":     "modern subway station platform, tiled walls, bright fluorescent ceiling, a train stopped at the platform, clean futuristic korean station",
    "halla":      "university campus lawn with red brick buildings and tall trees, bright blue afternoon sky, wide open quad",
}

CHAR_SUFFIX = (", solo, single character, fighting game character select portrait, upper body, facing viewer, "
               "confident determined expression, dramatic rim lighting, dark simple background, "
               "painterly anime illustration, highly detailed, clean")
# ⚠️`collage, grid, panels, multiple views` 를 빼면 4분할 콜라주가 나온다(동식이 실제로 그랬다)
CHAR_NEG = ("collage, grid, multiple panels, split image, multiple views, two people, "
            "nude, nsfw, revealing clothes, cleavage, lingerie, swimsuit, sexualized, "
            "text, letters, watermark, signature, extra limbs, extra fingers, deformed hands, "
            "deformed face, blurry, lowres, multiple people")

# ⚠️게임 안 색과 맞춘다(파란 후드=민유 …). 안 맞으면 초상과 캐릭터가 딴 사람처럼 보인다.
CHARS = [
    # ⚠️서사와 그림이 어긋나면 소개 화면에서 바로 들킨다 — 설정(chars.js story)에 맞춰 적는다.
    ("minyu",    "young Korean man, short black hair, blue hoodie over dark shirt, tired but confident programmer, arms crossed"),
    ("jongbeom", "Korean man in a navy postal worker uniform and cap, shoulder bag, cheerful and quick, holding a parcel"),
    # ⚠️'안경'은 준원 것이다 — 여기서 안경이 붙으면 두 사람이 헷갈린다
    ("inwoo",    "tired Korean man in his thirties, no glasses, short messy black hair, wrinkled grey work shirt, dark circles under his eyes, holding a baby bottle, faint warm smile, young father"),
    ("nodeok",   "athletic Korean man in a yellow sports jersey with a headband, sepak takraw player, ready stance"),
    ("gilsu",    "middle aged Korean man in an amateur sunday league soccer kit, weathered face, short hair, strong legs, slightly out of shape, veteran confidence, dawn football pitch behind"),
    ("dongsik",  "one middle aged Korean man standing, waist up, arms visible, thinning hair, big round belly, light blue dress shirt with loosened tie, rosy cheeks, cheerful drunk uncle, no glasses"),
    ("junwon",   "middle aged Korean man with glasses in a worn beige work shirt with oil stains, holding a strange handmade electronic device, cluttered garage workshop behind him, quiet genius inventor"),
    ("joss",     "wealthy Korean man in an expensive dark suit with red tie, slicked back hair, glasses, confident smirk"),
    ("yujin",    "young Korean woman in her twenties, long brown hair, pink jacket over a plain tee, arms crossed, rebellious confident stare, modest casual outfit, night city street behind"),
    ("yujeong",  "Korean teenage girl in a navy school uniform with white collar, short bob hair, heavy school backpack, sullen annoyed expression, arms crossed, modest full school uniform"),
]



def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--what", choices=["stages", "chars"], required=True)
    ap.add_argument("--only", default="", help="쉼표로 고른 것만")
    ap.add_argument("--seed", type=int, default=7100)
    args = ap.parse_args()

    import yaml
    import remote_render as RR

    cfg = yaml.safe_load((SF / "config.yaml").read_text(encoding="utf-8"))
    rc = RR.config(cfg)
    if not rc:
        print("⛔ 렌더호스트 설정이 꺼져 있다(config image.remote.enabled)")
        return 1

    ART.mkdir(parents=True, exist_ok=True)
    only = {s.strip() for s in args.only.split(",") if s.strip()}

    if args.what == "stages":
        keys = [k for k in STAGES if not only or k in only]
        items = [{"index": i, "prompt": STAGES[k] + STAGE_SUFFIX, "seed": args.seed + i * 17}
                 for i, k in enumerate(keys)]
        ic = {"model": MODEL, "width": 1344, "height": 768, "steps": 30,
              "guidance": 6.5, "negative": STAGE_NEG}
        names = keys
        prefix = "stage_"
    else:
        picks = [(k, p) for k, p in CHARS if not only or k in only]
        keys = [k for k, _ in picks]
        items = [{"index": i, "prompt": p + CHAR_SUFFIX, "seed": args.seed + 500 + i * 23}
                 for i, (k, p) in enumerate(picks)]
        ic = {"model": MODEL, "width": 832, "height": 1216, "steps": 30,
              "guidance": 6.5, "negative": CHAR_NEG}
        names = keys
        prefix = "char_"

    print(f"▶ {len(items)}장 요청 — {', '.join(names)}")
    tmp = ART / ".raw"
    tmp.mkdir(exist_ok=True)
    got = RR.render(items, ic, tmp, rc)
    if not got:
        print("⛔ 원격 렌더 실패(호스트가 안 깨어났거나 워커 오류) — 로그를 보라")
        return 1

    from PIL import Image
    made = []
    for i, name in enumerate(names):
        src = tmp / f"img_{i:02d}.png"
        if i not in got or not src.exists():
            print(f"  · {name}: 못 받음")
            continue
        out = ART / f"{prefix}{name}.jpg"
        im = Image.open(src).convert("RGB")
        im.save(out, "JPEG", quality=86, optimize=True)
        made.append(f"{out.name} {im.size[0]}x{im.size[1]} {out.stat().st_size // 1024}KB")
        src.unlink()
    print("✅ 저장:", *made, sep="\n  ")
    return 0


if __name__ == "__main__":
    sys.exit(main())
