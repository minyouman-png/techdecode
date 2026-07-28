#!/usr/bin/env python3
"""블로그 글별 OG 이미지(1200x630) + 사이트 기본 OG 이미지를 생성한다.

공유 링크(카톡·디스코드·X·슬랙)에 뜨는 미리보기 카드용이다. og:image 가 없으면
카드가 빈 상태로 나가서 클릭률이 크게 떨어진다.

출력: public/og/default.png  ·  public/og/blog/<key>.<lang>.png
글을 추가한 뒤 다시 돌리면 새 글만 생긴다(--force 로 전체 재생성).

실행:  python3 tools/make_og.py            (PIL 필요)
"""
import argparse
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BLOG = ROOT / "src" / "content" / "blog"
OUT = ROOT / "public" / "og"

W, H = 1200, 630
BG = "#0b0d11"
FG = "#fbfaf7"
MUTED = "#9aa1ad"
ACCENT = "#cba35c"
PAD = 80

# 한/일/중/영/스페인어를 한 파일로 커버(맥 기본 제공)
FONT = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"

CATEGORY_LABEL = {
    "markets": {"en": "MARKETS", "ko": "마켓", "ja": "マーケット", "es": "MERCADOS", "zh": "市场"},
    "ai": {"en": "AI", "ko": "AI", "ja": "AI", "es": "IA", "zh": "AI"},
    "semiconductors": {"en": "SEMICONDUCTORS", "ko": "반도체", "ja": "半導体",
                       "es": "SEMICONDUCTORES", "zh": "半导体"},
    "regulation": {"en": "REGULATION", "ko": "규제", "ja": "規制",
                   "es": "REGULACIÓN", "zh": "监管"},
}


def parse_frontmatter(path: Path) -> dict | None:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return None
    fm = text.split("---", 2)[1]
    out = {}
    for line in fm.splitlines():
        m = re.match(r'^(\w+):\s*(.*)$', line.strip())
        if m:
            out[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return out


def wrap(draw, text, font, max_w, max_lines):
    """글자 단위 줄바꿈(CJK 는 공백이 없어 단어 단위로는 안 잘림)."""
    lines, cur = [], ""
    for ch in text:
        trial = cur + ch
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
            continue
        # 라틴 문자면 단어 경계에서 끊어 보기 좋게
        if " " in cur and ch != " ":
            head, _, tail = cur.rpartition(" ")
            lines.append(head)
            cur = tail + ch
        else:
            lines.append(cur)
            cur = ch
        if len(lines) == max_lines:
            return lines, True
    if cur:
        lines.append(cur)
    # 줄바꿈 지점에 남은 앞뒤 공백 제거(들여쓰기처럼 보이는 것 방지)
    return [ln.strip() for ln in lines[:max_lines]], len(lines) > max_lines


def render(title: str, kicker: str, path: Path):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # 왼쪽 금색 액센트 바
    d.rectangle([0, 0, 10, H], fill=ACCENT)

    f_kick = ImageFont.truetype(FONT, 26)
    f_foot = ImageFont.truetype(FONT, 28)

    if kicker:
        d.text((PAD, PAD), kicker, font=f_kick, fill=ACCENT)

    # 제목 길이에 따라 크기를 낮춰가며 4줄 안에 맞춘다
    y_top, y_bottom = PAD + 70, H - PAD - 70
    for size in (72, 64, 56, 48, 42):
        f = ImageFont.truetype(FONT, size)
        lines, overflow = wrap(d, title, f, W - PAD * 2, 4)
        lh = int(size * 1.32)
        if not overflow and len(lines) * lh <= (y_bottom - y_top):
            break
    if overflow and lines:
        lines[-1] = lines[-1][:-1] + "…"

    y = y_top + ((y_bottom - y_top) - len(lines) * lh) // 2
    for ln in lines:
        d.text((PAD, y), ln, font=f, fill=FG)
        y += lh

    # 하단 구분선 + 브랜드
    d.line([PAD, H - PAD - 20, W - PAD, H - PAD - 20], fill="#232833", width=2)
    d.text((PAD, H - PAD + 2), "Tech Decode", font=f_foot, fill=FG)
    t = "menewsoft.com"
    d.text((W - PAD - d.textlength(t, font=f_foot), H - PAD + 2), t, font=f_foot, fill=MUTED)

    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)


def main():
    ap = argparse.ArgumentParser(description="OG 이미지 생성")
    ap.add_argument("--force", action="store_true", help="이미 있는 것도 다시 생성")
    args = ap.parse_args()

    render("We decode AI — and build with it.", "TECH DECODE", OUT / "default.png")
    print("기본 이미지: public/og/default.png")

    # 브라우저 오피스 3종(정적 HTML이라 자기 OG 이미지가 필요)
    for name, kicker, title in [
        ("sheet", "MENEW SHEET",
         "Open and edit Excel files in your browser — no install, no upload"),
        ("write", "MENEW WRITE",
         "Open and edit Word documents in your browser — no install, no upload"),
        ("show", "MENEW SHOW",
         "Open and edit PowerPoint slides in your browser — no install, no upload"),
        ("pdf", "MENEW PDF",
         "Merge, split and rotate PDFs in your browser — no install, no upload"),
        ("hwp", "MENEW HWP",
         "한글 파일(.hwp)을 브라우저에서 바로 열기 — 설치 없음, 업로드 없음"),
    ]:
        render(title, kicker, OUT / "apps" / f"{name}.png")
    print("앱 이미지: public/og/apps/{sheet,write,show,pdf,hwp}.png")

    made = skipped = 0
    for md in sorted(BLOG.glob("*.md")):
        fm = parse_frontmatter(md)
        if not fm or not fm.get("key") or not fm.get("lang"):
            print(f"  ⚠ 건너뜀(프론트매터 부족): {md.name}")
            continue
        out = OUT / "blog" / f"{fm['key']}.{fm['lang']}.png"
        if out.exists() and not args.force:
            skipped += 1
            continue
        kicker = CATEGORY_LABEL.get(fm.get("category", ""), {}).get(fm["lang"], "")
        render(fm["title"], kicker or "TECH DECODE", out)
        made += 1

    print(f"글 이미지: 생성 {made}개 · 기존 유지 {skipped}개 → public/og/blog/")


if __name__ == "__main__":
    main()
