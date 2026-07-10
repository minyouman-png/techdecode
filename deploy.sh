#!/usr/bin/env bash
# Tech Decode 배포 스크립트
# 소스(main)를 빌드해서 gh-pages 브랜치로 올려 GitHub Pages에 게시한다.
# 사용: cd ~/techdecode && ./deploy.sh
set -euo pipefail

REPO_URL="https://github.com/minyouman-png/techdecode.git"
cd "$(dirname "$0")"

echo "▶ 빌드…"
npm run build

echo "▶ gh-pages 브랜치로 배포…"
cd dist
git init -q
git checkout -q -b gh-pages
git add -A
git -c commit.gpgsign=false commit -qm "deploy $(date +%Y-%m-%d\ %H:%M)"
git push -f -q "$REPO_URL" gh-pages
cd ..
rm -rf dist/.git

echo "✅ 배포 완료 → https://minyouman-png.github.io/techdecode/"
