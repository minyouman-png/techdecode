"""다이닝코드 프로필 + 카카오맵으로 개별 가게 사실 확인.

발행 가능 판정 = **메뉴(가격) AND 영업시간** 이 둘 다 잡히는가.
둘 중 하나라도 없으면 페이지의 절반이 빈칸이 되고, 채우려면 창작이 된다 → 발행하지 않는다.
"""
import json, re, html, subprocess, sys, time

UA_PC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"


def _curl(url, ua=UA_PC, timeout="25"):
    return subprocess.run(["curl", "-s", "--max-time", timeout, "-A", ua, url],
                          capture_output=True).stdout.decode("utf-8", "replace")


def find_rid(name):
    raw = subprocess.run(
        ["curl", "-s", "--max-time", "25", "-X", "POST", "https://im.diningcode.com/API/isearch/",
         "--data-urlencode", f"query={name}", "--data-urlencode", "addr=원주"],
        capture_output=True).stdout.decode("utf-8", "replace")
    try:
        lst = json.loads(raw)["result_data"]["poi_section"]["list"]
    except Exception:
        return None
    return lst[0] if lst else None


def profile(rid):
    t = _curl(f"https://www.diningcode.com/profile.php?rid={rid}")
    x = html.unescape(re.sub(r"<script.*?</script>", "", t, flags=re.S))
    x = re.sub(r"<[^>]+>", " ", x)
    x = re.sub(r"\s+", " ", x)
    menu = re.findall(r"([가-힣A-Za-z0-9()\s]{2,18}?)\s([0-9]{1,3},[0-9]{3})\s*원", x)
    hours = sorted(set(re.findall(r"\d{1,2}:\d{2}\s*[-~]\s*\d{1,2}:\d{2}", x)))
    closed = re.findall(r"(매주\s*[월화수목금토일]요일|[월화수목금토일]요일\s*휴무|정기휴무[^ ]{0,8}|연중무휴)", x)
    tags = re.findall(r"(생활의달인|최자로드|백종원|수요미식회|허영만|맛있는녀석들|3대천왕|노포|"
                      r"지역주민이찾는|숨은맛집|가성비좋은|무료주차|주차불가|포장|배달)", x)
    return {"menu": menu[:14], "hours": hours[:4], "closed": sorted(set(closed)),
            "tags": sorted(set(tags)), "text": x}


def kakao(name):
    t = _curl("https://m.map.kakao.com/actions/searchView?q=" +
              __import__("urllib.parse").parse.quote(f"원주 {name}"),
              ua="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15")
    t = re.sub(r"<script.*?</script>", "", t, flags=re.S)
    m = re.search(r'data-id="(\d+)".*?data-title="([^"]*)".*?data-phone="([^"]*)"', t)
    if not m:
        return {}
    seg = html.unescape(re.sub(r"<[^>]+>", "|", t[m.start():m.start() + 1600]))
    seg = re.sub(r"\|{2,}", "|", seg)
    seg = re.sub(r"\s+", " ", seg)
    addr = re.search(r"강원[^|]{5,50}", seg)
    hrs = re.search(r"(\d{1,2}:\d{2}\s*~\s*\d{1,2}:\d{2})", seg)
    rate = re.search(r"평점 : \| (\d\.\d)\| \|\((\d+)\)", seg)
    return {"kakao_title": m.group(2), "phone": m.group(3),
            "addr": addr.group(0).strip() if addr else "",
            "hours": hrs.group(1) if hrs else "",
            "rating": rate.groups() if rate else None, "raw": seg[:400]}


if __name__ == "__main__":
    for name in sys.argv[1:]:
        p = find_rid(name)
        print("=" * 78)
        if not p:
            print(f"{name}: 다이닝코드 없음")
            continue
        print(f"■ {p['nm']}  ({p.get('category')})  평점 {p.get('user_score')} / 리뷰 {p.get('review_cnt')} / {p.get('score')}점")
        print(f"  지번 {p.get('addr')}")
        print(f"  도로 {p.get('road_addr')}")
        d = profile(p["v_rid"])
        k = kakao(name)
        print(f"  카카오: {k.get('kakao_title')} ☎{k.get('phone')} | {k.get('addr')} | {k.get('hours')} | 평점{k.get('rating')}")
        print(f"  영업시간(DC): {d['hours']}  휴무: {d['closed']}")
        print(f"  태그: {d['tags']}")
        print(f"  메뉴: {[f'{a.strip()} {b}' for a, b in d['menu']][:12]}")
        ok = bool(d["menu"]) and bool(d["hours"] or k.get("hours"))
        print(f"  ▶ 발행가능: {'예' if ok else '★아니오(자료부족)'}")
        time.sleep(0.5)
