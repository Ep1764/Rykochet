#!/usr/bin/env bash
# Pull main and deploy to https://rykochet.io
set -euo pipefail

DIR="/var/www/rykochet"
BRANCH="main"

cd "$DIR"
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
npm ci
npm run build
pm2 reload rykochet-prod
echo "✓ prod deployed from $BRANCH"
