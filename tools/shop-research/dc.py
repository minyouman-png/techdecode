"""다이닝코드 내부 API 로 원주 후보 수집.

⚠️수집 범위를 일부러 좁게 둔다 — 'DB 의 상당 부분을 체계적으로 반복 수집'은 데이터베이스제작자의
   권리(저작권법 91조) 영역이다. 후보 훑기용으로만 쓰고, 실제 게재는 손으로 고른 소수만 한다.
"""
import json, subprocess, sys, urllib.parse, time

API = "https://im.diningcode.com/API/isearch/"


def search(query, addr="원주", size=30):
    args = ["curl", "-s", "--max-time", "25", "-X", "POST", API,
            "--data-urlencode", f"query={query}",
            "--data-urlencode", f"addr={addr}",
            "--data-urlencode", f"size={size}"]
    raw = subprocess.run(args, capture_output=True).stdout.decode("utf-8", "replace")
    try:
        d = json.loads(raw)
    except Exception:
        return []
    return (d.get("result_data") or {}).get("poi_section", {}).get("list") or []


FRANCHISE = ("본죽", "김밥천국", "맥도날드", "롯데리아", "버거킹", "스타벅스", "투썸", "이디야",
             "명랑핫도그", "빽다방", "메가커피", "교촌", "BBQ", "bhc", "굽네", "네네",
             "피자헛", "도미노", "미스터피자", "파리바게뜨", "뚜레쥬르", "설빙", "공차",
             "한솥", "compose", "컴포즈", "새마을식당", "홍콩반점", "마porta")


def is_franchise(name):
    return any(f.lower() in name.lower() for f in FRANCHISE)


if __name__ == "__main__":
    queries = sys.argv[1:] or ["원주 맛집"]
    seen = {}
    for q in queries:
        for p in search(q):
            nm = p.get("nm", "")
            if not nm or is_franchise(nm):
                continue
            rid = p.get("v_rid")
            if rid and rid not in seen:
                seen[rid] = p
        time.sleep(0.4)

    rows = []
    for rid, p in seen.items():
        try:
            us = float(p.get("user_score") or 0)
        except (TypeError, ValueError):
            us = 0.0
        rows.append({
            "rid": rid, "nm": p.get("nm"), "score": p.get("score"),
            "user_score": us, "review": p.get("review_cnt") or 0,
            "cat": p.get("category"), "addr": p.get("addr"),
            "road": p.get("road_addr"), "phone": p.get("phone") or "",
        })
    rows.sort(key=lambda r: (-(r["user_score"] or 0), -(r["review"] or 0)))
    print(f"총 {len(rows)}곳\n")
    for r in rows:
        print(f"{r['user_score']:>4} ({r['review']:>3}) {str(r['score']):>4}점 | {r['nm'][:20]:22s} "
              f"| {str(r['cat'])[:22]:24s} | {str(r['addr'])[:34]}")
    json.dump(rows, open("cand.json", "w"), ensure_ascii=False, indent=1)
