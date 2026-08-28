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
    ("gilsu",    "middle aged Korean man upside down in mid air performing a bicycle kick, plain crimson red football shirt with a completely blank chest, "
                 "white shorts, boot striking a football, mud and grass exploding below, misty dawn pitch, low dramatic angle, extreme motion"),
    ("dongsik",  "one middle aged Korean man standing, waist up, arms visible, thinning hair, big round belly, light blue dress shirt with loosened tie, rosy cheeks, cheerful drunk uncle, no glasses"),
    ("junwon",   "middle aged Korean man with glasses in a worn beige work shirt with oil stains, holding a strange handmade electronic device, cluttered garage workshop behind him, quiet genius inventor"),
    ("joss",     "wealthy Korean man in an expensive dark suit with red tie, slicked back hair, glasses, confident smirk"),
    ("yujin",    "young Korean woman in her twenties, long brown hair, pink jacket over a plain tee, arms crossed, rebellious confident stare, modest casual outfit, night city street behind"),
    ("yujeong",  "Korean teenage girl in a navy school uniform with white collar, short bob hair, heavy school backpack, sullen annoyed expression, arms crossed, modest full school uniform"),
]

# ── 초필살기 컷인 일러스트 (2026-08-21) ─────────────────────────────────────
# ★컷인은 초상과 다르다. 초상은 '누구인가', 컷인은 **'지금 무슨 짓을 하는가'**다.
#   그래서 정면 상반신이 아니라 **기술을 쓰는 한순간**을 그린다(팔이 뻗어 있고 빛이 터진다).
# ⚠️게임 화면 위에 비스듬한 판으로 얹히므로 가장자리는 잘린다 — 인물을 가운데에 크게.
SUPER_SUFFIX = (", solo, single character, dynamic action pose, extreme dramatic angle, "
                "fighting game super move cut-in, glowing rim light, speed lines, "
                "dark background, painterly anime illustration, highly detailed, cinematic")
SUPER_NEG = CHAR_NEG + (", full body, wide shot, small figure, static pose, calm, standing still, portrait, logo, brand mark, sponsor logo, swoosh, jersey number")

SUPERS = [
    ("minyu",    "young Korean man in a blue hoodie, short black hair, shouting, both palms thrust forward, "
                 "torrent of glowing blue code and red error text erupting from his hands, laptop light behind him"),
    ("jongbeom", "Korean postal worker in navy uniform and cap charging forward shoulder first, "
                 "huge tower of brown parcels flying behind him, motion blur, fierce shout"),
    ("inwoo",    "tired Korean man in a wrinkled grey work shirt, no glasses, lunging forward low with one arm swung wide, "
                 "network cables whipping like whips around him, crackling blue electricity and sparks, diagonal composition, motion blur"),
    ("nodeok",   "athletic Korean man in a yellow jersey and headband leaping high, twisting to smash a ball downward, "
                 "several rattan balls trailing fire, dust exploding below"),
    ("gilsu",    "middle aged Korean man upside down in mid air performing a bicycle kick, plain crimson red football shirt with a completely blank chest, "
                 "white shorts, boot striking a football, mud and grass exploding below, misty dawn pitch, low dramatic angle, extreme motion"),
    ("dongsik",  "heavy middle aged Korean man with thinning hair and a big round belly, light blue dress shirt with loosened tie, "
                 "roaring, swinging a green glass soju bottle down onto the floor, wooden floor cracking, shockwave ring of dust, low angle"),
    ("junwon",   "middle aged Korean man with glasses in a beige work shirt pointing sternly forward, "
                 "a wall of glowing blue documents and stamped papers surging away from his hand"),
    ("joss",     "wealthy Korean man in a dark suit and red tie, slicked hair, glasses, smirking, "
                 "hurling a briefcase open as a column of green banknotes erupts upward like a geyser"),
    ("yujin",    "young Korean woman with long brown hair in a pink jacket, mid spin kick, "
                 "trails of pink and gold stars swirling around her leg, casual modest outfit"),
    ("yujeong",  "Korean teenage girl in a navy school uniform, short bob hair, swinging a heavy school backpack overhead, "
                 "textbooks and worksheets flying everywhere, annoyed shout, modest full uniform"),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--what", choices=["stages", "chars", "supers"], required=True)
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
    elif args.what == "supers":
        picks = [(k, p) for k, p in SUPERS if not only or k in only]
        keys = [k for k, _ in picks]
        items = [{"index": i, "prompt": p + SUPER_SUFFIX, "seed": args.seed + 900 + i * 31}
                 for i, (k, p) in enumerate(picks)]
        ic = {"model": MODEL, "width": 832, "height": 1216, "steps": 30,
              "guidance": 6.5, "negative": SUPER_NEG}
        names = keys
        prefix = "super_"
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
        if prefix == "super_":                      # 컷인은 화면에서 작게 쓴다 — 줄여서 담는다
            im = im.resize((704, 1028), Image.LANCZOS)
        im.save(out, "JPEG", quality=85, optimize=True)
        made.append(f"{out.name} {im.size[0]}x{im.size[1]} {out.stat().st_size // 1024}KB")
        src.unlink()
    print("✅ 저장:", *made, sep="\n  ")
    return 0


if __name__ == "__main__":
    sys.exit(main())
