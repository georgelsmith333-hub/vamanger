#!/usr/bin/env bash
set -e

echo "=== VA Manager – Cloudflare Deployment ==="
echo ""

CF_ACCOUNT_ID="a5190f614965188b2218d06eebc4dabf"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "ERROR: Set CLOUDFLARE_API_TOKEN environment variable first."
  exit 1
fi

echo "[1/6] Installing CF API dependencies…"
cd artifacts/cf-api
pnpm install

echo "[2/6] Creating D1 database (skip if already exists)…"
npx wrangler d1 create va-manager-db 2>/dev/null || true

echo "[3/6] Fetching D1 database ID…"
DB_INFO=$(npx wrangler d1 list --json 2>/dev/null | python3 -c "import sys,json; dbs=json.load(sys.stdin); db=next((d for d in dbs if d['name']=='va-manager-db'),None); print(db['uuid'] if db else '')" 2>/dev/null || true)
if [ -n "$DB_INFO" ]; then
  sed -i "s/REPLACE_WITH_D1_DATABASE_ID/$DB_INFO/" wrangler.toml
  echo "  D1 ID: $DB_INFO"
fi

echo "[4/6] Running D1 migrations…"
npx wrangler d1 execute va-manager-db --file migrations/0001_initial.sql --remote

echo "[5/6] Deploying Worker…"
npx wrangler deploy

echo "[6/6] Deploying frontend to Pages…"
cd ../va-dashboard
pnpm build
npx wrangler pages deploy dist --project-name va-manager --branch main

echo ""
echo "=== Deployment Complete ==="
echo "Worker:  https://va-manager-api.$CF_ACCOUNT_ID.workers.dev"
echo "Pages:   https://va-manager.pages.dev"
echo ""
echo "Next: Set Worker secrets via:"
echo "  wrangler secret put ADMIN_PASSWORD"
echo "  wrangler secret put JWT_SECRET"
echo "  wrangler secret put GOOGLE_SHEET_ID          (optional)"
echo "  wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY  (optional)"
