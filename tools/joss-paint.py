#!/usr/bin/env python3
"""벡터 캐릭터를 **그림풍으로 덧칠**한다(img2img) — 컷아웃 리깅용 바탕 그림 만들기.

  python3 tools/joss-paint.py --pilot                  # 강도 3종 비교(민유)
  python3 tools/joss-paint.py --chars minyu,joss       # 실제 생성

⚠️새로 그리는 게 아니라 **덧칠**이다. 실루엣·색·관절 위치가 그대로여야 지금 뼈대에 얹을 수
  있다. 그래서 strength 를 낮게 잡는다 — 높이면 예쁘지만 **다른 사람**이 되어 못 쓴다.
⚠️워커(img2img_worker.py)는 실행할 때마다 호스트로 올린다(파일이 작고, 버전 어긋남이 제일 무섭다).
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

SF = Path.home() / "shorts-factory"
sys.path.insert(0, str(SF))
sys.path.insert(0, str(SF / "src"))

ROOT = Path(__file__).resolve().parent.parent
BASE_DIR = Path("/tmp/joss-parts")
MODEL = "Lykon/dreamshaper-xl-1-0"
REMOTE_WORKER = r"C:\render\img2img_worker.py"

# ⚠️자세를 말로 못박지 않으면 모델이 '자연스러운 자세'로 고쳐 버린다 — 팔이 내려오고
#   머리가 젖혀지면 관절이 어긋나 뼈대에 못 얹는다(0.42에서 실제로 그랬다).
STYLE = (", standing straight facing right, one arm stretched out sideways, legs apart, "
         "head upright, full body game character, painted 2D fighting game art, "
         "clean thick outline, cel shaded, soft top light, plain grey background")
NEG = ("head tilted back, looking up, different pose, photo, realistic photo, 3d render, blurry, messy, extra limbs, extra arms, "
       "extra legs, deformed hands, text, watermark, background clutter, multiple characters")

WHO = {
    "minyu":    "young Korean man programmer in a blue hoodie and dark pants, black hair, white sneakers",
    "jongbeom": "Korean postal worker in a navy uniform and cap, shoulder bag",
    "inwoo":    "Korean computer engineer in a grey work shirt and dark pants",
    "nodeok":   "Korean sepak takraw player in a yellow jersey with a headband",
    "gilsu":    "Korean amateur footballer in a red and white kit",
    "dongsik":  "chubby middle aged Korean man in a light blue dress shirt with a red tie",
    "junwon":   "middle aged Korean man with glasses in a beige shirt and tie",
    "joss":     "wealthy Korean man in a dark suit with a red tie, slicked hair",
    "yujin":    "young Korean woman in a pink top and dark jeans, long brown hair",
    "yujeong":  "Korean schoolgirl in a navy school uniform with a white collar, bob hair",
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pilot", action="store_true", help="강도 0.30/0.42/0.55 비교(민유)")
    ap.add_argument("--chars", default="", help="쉼표로 고른 캐릭터")
    ap.add_argument("--strength", type=float, default=0.42)
    ap.add_argument("--seed", type=int, default=8801)
    ap.add_argument("--out", default="/tmp/joss-paint")
    args = ap.parse_args()

    import yaml
    import remote_render as RR

    cfg = yaml.safe_load((SF / "config.yaml").read_text(encoding="utf-8"))
    rc = RR.config(cfg)
    if not rc:
        print("⛔ 렌더호스트가 꺼져 있다")
        return 1

    # 워커를 먼저 올린다(호스트가 자고 있으면 여기서 깨운다)
    ok, woke = RR.wake(rc)
    if not ok:
        print("⛔ 호스트를 못 깨웠다")
        return 1
    src = SF / "setup" / "render_host" / "img2img_worker.py"
    r = RR._scp([str(src), f"{RR._target(rc)}:C:/render/img2img_worker.py"], timeout=60)
    if r.returncode != 0:
        print("⛔ 워커 전송 실패:", r.stderr[:200])
        return 1
    print("· 워커 전송 완료")

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    items, files, names = [], {}, []
    if args.pilot:
        base = BASE_DIR / "minyu_base.png"
        if not base.exists():
            print("⛔ 바탕 그림이 없다:", base)
            return 1
        files["minyu.png"] = base
        for i, st in enumerate((0.30, 0.42, 0.55)):
            items.append({"index": i, "file": "minyu.png", "seed": args.seed,
                          "strength": st, "prompt": WHO["minyu"] + STYLE})
            names.append(f"minyu_s{int(st * 100)}")
    else:
        keys = [k.strip() for k in args.chars.split(",") if k.strip()] or list(WHO)
        for i, k in enumerate(keys):
            base = BASE_DIR / f"{k}_base.png"
            if not base.exists():
                print("· 바탕 없음, 건너뜀:", k)
                continue
            files[f"{k}.png"] = base
            items.append({"index": len(items), "file": f"{k}.png", "seed": args.seed + i * 13,
                          "strength": args.strength, "prompt": WHO[k] + STYLE})
            names.append(k)

    if not items:
        print("⛔ 보낼 것이 없다")
        return 1

    job = {"model": MODEL, "dtype": "float16", "steps": 30, "guidance": 6.0,
           "negative": NEG, "items": items}
    got = RR.run_job(rc, job, REMOTE_WORKER, out,
                     budget=90 * len(items) + 900, in_files=files, label=f"덧칠 {len(items)}장")
    if not got:
        print("⛔ 실패 — 로그를 보라")
        return 1
    for i, nm in enumerate(names):
        src2 = out / ("img_%02d.png" % i)
        if src2.exists():
            src2.rename(out / f"{nm}.png")
            print("  ✓", out / f"{nm}.png")
    return 0


if __name__ == "__main__":
    sys.exit(main())
