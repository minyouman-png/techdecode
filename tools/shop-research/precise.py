"""영업시간·휴무를 문맥과 함께 뽑는다 — 정규식만 쓰면 브레이크타임과 영업시간이 섞인다."""
import re, html, subprocess, sys, json

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"


def text_of(rid):
    t = subprocess.run(["curl", "-s", "--max-time", "25", "-A", UA,
                        f"https://www.diningcode.com/profile.php?rid={rid}"],
                       capture_output=True).stdout.decode("utf-8", "replace")
    x = html.unescape(re.sub(r"<script.*?</script>", "", t, flags=re.S))
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", x))


def rid_of(name):
    raw = subprocess.run(
        ["curl", "-s", "--max-time", "25", "-X", "POST", "https://im.diningcode.com/API/isearch/",
         "--data-urlencode", f"query={name}", "--data-urlencode", "addr=원주"],
        capture_output=True).stdout.decode("utf-8", "replace")
    lst = json.loads(raw)["result_data"]["poi_section"]["list"]
    return lst[0]


for name in sys.argv[1:]:
    p = rid_of(name)
    x = text_of(p["v_rid"])
    print("=" * 78)
    print(f"■ {p['nm']} · {p.get('road_addr')} · 평점{p.get('user_score')}({p.get('review_cnt')})")
    for kw in ("영업 중", "영업시간", "휴무", "브레이크", "라스트오더"):
        for m in list(re.finditer(kw, x))[:2]:
            print(f"  [{kw}] …{x[max(0,m.start()-90):m.start()+230].strip()}…")
    i = x.find("메뉴정보")
    if i > 0:
        print(f"  [메뉴] {x[i:i+430].strip()}")
    j = x.find("리뷰")
    print(f"  [리뷰] {x[j:j+430].strip()}")
