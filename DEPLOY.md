# VA Manager — Deployment Guide

## Option 1: Render (Express + PostgreSQL) — Easiest

1. Push this repo to GitHub (or connect via Render's GitHub integration)
2. Go to render.com → New → Blueprint
3. Connect your GitHub repo — Render auto-detects `render.yaml`
4. Click **Apply** — Render creates:
   - `va-api` web service (Node.js Express)
   - `va-dashboard` static site (React/Vite)
   - `va-postgres` PostgreSQL database (free tier)
5. Wait ~5 min for first deploy
6. Your dashboard: `https://va-dashboard.onrender.com`
7. Your API: `https://va-api.onrender.com`

**Required env vars** (set in Render dashboard):
- `DATABASE_URL` — auto-set from linked DB
- `SESSION_SECRET` — auto-generated
- `NODE_ENV=production`

---

## Option 2: Cloudflare Workers + Pages (Free Forever)

### Prerequisites
- Cloudflare account (free)
- `CLOUDFLARE_API_TOKEN` with: Workers Scripts, D1, Pages, KV permissions
- Node.js + pnpm installed

### Step 1 — Install tools
```bash
cd artifacts/cf-api
pnpm install
```

### Step 2 — Create D1 database
```bash
npx wrangler d1 create va-manager-db
```
Copy the `database_id` from output, then update `wrangler.toml`:
```toml
database_id = "paste-your-id-here"
```

### Step 3 — Create KV namespace
```bash
npx wrangler kv namespace create va-manager-kv
```
Copy the `id`, update `wrangler.toml`:
```toml
id = "paste-your-kv-id-here"
```

### Step 4 — Run database migration
```bash
npx wrangler d1 execute va-manager-db --file migrations/0001_initial.sql --remote
```

### Step 5 — Deploy the Worker
```bash
npx wrangler deploy
```

### Step 6 — Set Worker secrets
```bash
echo "YourAdminPassword" | npx wrangler secret put ADMIN_PASSWORD
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" | npx wrangler secret put JWT_SECRET
# Optional — for Google Sheets sync:
echo "your-sheet-id" | npx wrangler secret put GOOGLE_SHEET_ID
echo "$(cat service-account.json)" | npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY
```

### Step 7 — Deploy frontend to Pages
```bash
cd ../va-dashboard
pnpm build
cd ../cf-api
npx wrangler pages deploy ../va-dashboard/dist --project-name va-manager --branch main
```

### Step 8 — Update CORS
Edit `artifacts/cf-api/src/index.ts`, add your Pages URL to the `origin` array:
```typescript
origin: ['https://va-manager.pages.dev', ...],
```
Then re-deploy: `npx wrangler deploy`

---

## Google Sheets Integration

1. Create a Google Cloud project at console.cloud.google.com
2. Enable the **Google Sheets API**
3. Create a **Service Account** → Download JSON key
4. Create a Google Sheet → Share it with the service account email (Editor)
5. Set secrets on your server:
   - `GOOGLE_SHEET_ID` = the ID from the sheet URL
   - `GOOGLE_SERVICE_ACCOUNT_KEY` = full contents of the JSON key file
6. In the app, go to **Sheets Sync** → paste Sheet ID → Export any table

---

## Quick Health Checks

```bash
# Render
curl https://va-api.onrender.com/api/health

# Cloudflare
curl https://va-manager-api.<ACCOUNT_ID>.workers.dev/health
```
