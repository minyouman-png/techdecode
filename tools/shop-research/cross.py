"""다이닝코드 × 카카오맵 **양쪽** 평점을 대조한다.

⚠️★이 도구가 필요했던 이유(2026-08-11 실측): 다이닝코드 리뷰 7건에 4.8 이라 고른 장터추어탕이
   카카오에서는 **25건에 2.0** 이었다. 표본 7개짜리 평점으로 '인기맛집'을 고르면 틀린다.
   한쪽만 인용하면 체리피킹이고, 그 결과를 남의 가게 이름을 달고 발행하게 된다.
"""
import json, re, html, subprocess, sys, time, urllib.parse

UA_M = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"


def dc(name):
    raw = subprocess.run(
        ["curl", "-s", "--max-time", "20", "-X", "POST", "https://im.diningcode.com/API/isearch/",
         "--data-urlencode", f"query={name}", "--data-urlencode", "addr=원주"],
        capture_output=True).stdout.decode("utf-8", "replace")
    try:
        lst = json.loads(raw)["result_data"]["poi_section"]["list"]
    except Exception:
        return None
    return lst[0] if lst else None


def kakao(name):
    t = subprocess.run(["curl", "-s", "--max-time", "20", "-A", UA_M,
                        "https://m.map.kakao.com/actions/searchView?q=" +
                        urllib.parse.quote(f"원주 {name}")],
                       capture_output=True).stdout.decode("utf-8", "replace")
    t = re.sub(r"<script.*?</script>", "", t, flags=re.S)
    m = re.search(r'data-id="(\d+)".*?data-title="([^"]*)".*?data-phone="([^"]*)"', t)
    if not m:
        return None
    seg = re.sub(r"\s+", " ", re.sub(r"\|{2,}", "|", html.unescape(
        re.sub(r"<[^>]+>", "|", t[m.start():m.start() + 1500]))))
    r = re.search(r"평점 : \|[\s|]*(\d\.\d)\|[\s|]*\((\d+)\)", seg)
    rv = re.search(r"리뷰 \|[\s|]*(\d+)", seg)
    return {"title": m.group(2), "phone": m.group(3),
            "score": float(r.group(1)) if r else None,
            "cnt": int(r.group(2)) if r else 0,
            "reviews": int(rv.group(1)) if rv else 0}


print(f"{'가게':18s} {'DC평점(n)':>12s} {'카카오(n)':>13s} {'리뷰':>5s}  판정")
print("-" * 78)
for name in sys.argv[1:]:
    d, k = dc(name), kakao(name)
    if not d:
        print(f"{name:18s} {'DC없음':>12s}")
        continue
    ds, dn = float(d.get("user_score") or 0), d.get("review_cnt") or 0
    ks = k["score"] if k and k["score"] else 0
    kn = k["cnt"] if k else 0
    # 판정: 표본이 큰 쪽(카카오)을 신뢰하되, 양쪽이 어긋나면 보류한다.
    if kn >= 20 and ks < 3.5:
        verdict = "★제외(카카오 낮음)"
    elif kn < 10 and dn < 10:
        verdict = "보류(표본부족)"
    elif ks >= 4.0 and ds >= 4.0:
        verdict = "◎양호"
    elif ks >= 3.8:
        verdict = "○보통"
    else:
        verdict = "△확인필요"
    warn = ""
    dp = (d.get("phone") or "").replace("-", "")
    kp = ((k or {}).get("phone") or "").replace("-", "")
    if dp and kp and dp != kp and not (dp.startswith("0507") and dp[-4:] == kp[-4:]):
        warn = f"  ⚠️전화불일치 DC:{d['phone']} / KK:{k['phone']}"
    print(f"{d['nm'][:17]:18s} {ds:>7}({dn:>3}) {ks:>8}({kn:>4}) {(k or {}).get('reviews',0):>5}  {verdict}{warn}")
    time.sleep(0.4)
