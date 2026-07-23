#!/usr/bin/env bash
# Pull develop and deploy to https://dev.rykochet.io
set -euo pipefail

DIR="/var/www/rykochet-dev"
BRANCH="develop"

cd "$DIR"
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
npm ci
npm run build
pm2 reload rykochet-dev
echo "✓ dev deployed from $BRANCH"
