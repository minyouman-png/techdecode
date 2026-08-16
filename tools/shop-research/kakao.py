"""카카오맵 모바일 검색(서버 렌더 HTML)에서 장소 목록을 뽑는다."""
import sys, re, html, subprocess, urllib.parse

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")


def search(q):
    url = "https://m.map.kakao.com/actions/searchView?q=" + urllib.parse.quote(q)
    raw = subprocess.run(["curl", "-s", "--max-time", "25", "-A", UA, url],
                         capture_output=True).stdout.decode("utf-8", "replace")
    t = re.sub(r"<script.*?</script>", "", raw, flags=re.S)
    hits = [(m.group(1), m.group(2), m.group(3), m.start()) for m in
            re.finditer(r'data-id="(\d+)".*?data-title="([^"]*)".*?data-phone="([^"]*)"', t)]
    out = []
    for i, (pid, title, phone, pos) in enumerate(hits):
        end = hits[i + 1][3] if i + 1 < len(hits) else pos + 4000
        x = html.unescape(re.sub(r"<[^>]+>", "|", t[pos:end]))
        x = re.sub(r"\|{2,}", "|", x)
        x = re.sub(r"\s+", " ", x).strip("| ")
        out.append((pid, title, phone, x))
    return out


if __name__ == "__main__":
    for pid, title, phone, body in search(sys.argv[1]):
        print(f"[{pid}] {title}  ☎{phone}")
        print("   ", body[:320])
        print()
