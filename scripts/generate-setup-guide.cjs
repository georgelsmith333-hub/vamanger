const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '..', 'attached_assets', 'guides');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'VA-Manager-Setup-Guide.pdf');

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  info: {
    Title: 'VA eBay Client Manager — Setup Guide',
    Author: 'VA Manager',
    Subject: 'OAuth Login & Google Sheets Sync Configuration',
  },
});

doc.pipe(fs.createWriteStream(outPath));

const COLORS = {
  primary: '#0EA5E9',
  dark: '#0F172A',
  text: '#1E293B',
  muted: '#64748B',
  accent: '#F59E0B',
  success: '#10B981',
  bgBox: '#F1F5F9',
  bgCode: '#0F172A',
  codeText: '#E2E8F0',
  border: '#CBD5E1',
};

function H1(text) {
  doc.moveDown(0.3);
  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(22).text(text);
  const y = doc.y + 2;
  doc.moveTo(60, y).lineTo(552, y).strokeColor(COLORS.primary).lineWidth(2).stroke();
  doc.moveDown(0.6);
}

function H2(text) {
  doc.moveDown(0.5);
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(15).text(text);
  doc.moveDown(0.3);
}

function H3(text) {
  doc.moveDown(0.3);
  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(12).text(text);
  doc.moveDown(0.2);
}

function P(text) {
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(10.5).text(text, { align: 'left', lineGap: 2 });
  doc.moveDown(0.3);
}

function Note(text) {
  const startY = doc.y;
  const padding = 8;
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.text);
  const height = doc.heightOfString(text, { width: 472 }) + padding * 2;
  doc.save()
    .roundedRect(60, startY, 492, height, 4)
    .fillColor(COLORS.bgBox).fill()
    .restore();
  doc.rect(60, startY, 4, height).fillColor(COLORS.accent).fill();
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(10)
    .text(text, 72, startY + padding, { width: 472 });
  doc.y = startY + height + 6;
}

function Bullets(items) {
  items.forEach((item) => {
    doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(10.5).text('•  ', { continued: true });
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(10.5).text(item, { lineGap: 2 });
  });
  doc.moveDown(0.3);
}

function NumberedSteps(items) {
  items.forEach((item, i) => {
    doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(10.5).text(`${i + 1}.  `, { continued: true });
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(10.5).text(item, { lineGap: 2 });
    doc.moveDown(0.15);
  });
  doc.moveDown(0.2);
}

function Code(text) {
  const lines = text.split('\n');
  const lineHeight = 13;
  const padding = 10;
  const height = lines.length * lineHeight + padding * 2;
  const startY = doc.y;
  if (startY + height > 720) {
    doc.addPage();
  }
  const y = doc.y;
  doc.save()
    .roundedRect(60, y, 492, height, 4)
    .fillColor(COLORS.bgCode).fill()
    .restore();
  doc.fillColor(COLORS.codeText).font('Courier').fontSize(9.5)
    .text(text, 70, y + padding, { width: 472, lineGap: 2 });
  doc.y = y + height + 8;
}

function KV(rows) {
  const startY = doc.y;
  const rowH = 22;
  const totalH = rows.length * rowH + 8;
  doc.save().roundedRect(60, startY, 492, totalH, 4).fillColor(COLORS.bgBox).fill().restore();
  rows.forEach((row, i) => {
    const y = startY + 4 + i * rowH;
    doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(10).text(row[0], 72, y + 5, { width: 160 });
    doc.fillColor(COLORS.text).font('Courier').fontSize(9.5).text(row[1], 240, y + 5, { width: 300 });
  });
  doc.y = startY + totalH + 6;
}

function FooterPage() {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8)
      .text(`VA eBay Client Manager — Setup Guide`, 60, 770, { align: 'left', width: 200 });
    doc.text(`Page ${i + 1} of ${range.count}`, 350, 770, { align: 'right', width: 200 });
  }
}

doc.rect(0, 0, 612, 250).fillColor(COLORS.dark).fill();
doc.rect(0, 240, 612, 6).fillColor(COLORS.primary).fill();
doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(28).text('VA eBay', 60, 90);
doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(28).text('Client Manager', 60, 122);
doc.fillColor('#E2E8F0').font('Helvetica').fontSize(13).text('Complete Setup Guide', 60, 165);
doc.fillColor('#94A3B8').font('Helvetica').fontSize(11).text('OAuth User Login • Google Sheets Sync • Deployment', 60, 188);
doc.fillColor('#64748B').font('Helvetica-Oblique').fontSize(9).text('Generated automatically by your VA Manager workspace', 60, 215);

doc.y = 280;

H1('Table of Contents');
const toc = [
  '1. Quick Reference & Live URLs',
  '2. Part A — Google OAuth User Login (Sign in with Google)',
  '3. Part B — Google Sheets Sync (Service Account)',
  '4. Part C — Deployment to Render',
  '5. Part D — Deployment to Cloudflare Workers',
  '6. Part E — Environment Variables Reference',
  '7. Part F — Troubleshooting & FAQ',
];
toc.forEach((t) => {
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(11).text(t, { lineGap: 4 });
});

doc.addPage();
H1('1. Quick Reference & Live URLs');
P('Keep these handy — you will paste them into Google Cloud Console and other dashboards.');

H3('Your Replit dev URL (development)');
KV([
  ['Domain', 'f242e461-b0fa-4efd-84df-1ce2c3b62f08-00-2syqx17619hzn.janeway.replit.dev'],
  ['Full HTTPS', 'https://f242e461-b0fa-4efd-84df-1ce2c3b62f08-00-...replit.dev'],
]);

H3('Production URLs (after you deploy)');
KV([
  ['Render', 'https://va-manager.onrender.com (or your custom subdomain)'],
  ['Cloudflare', 'https://va-manager.<your-cf-account>.workers.dev'],
  ['Custom domain', 'https://app.yourdomain.com (after DNS is set)'],
]);

H3('Repo & secrets already configured for you');
KV([
  ['GitHub repo', 'github.com/georgelsmith333-hub/vamanger'],
  ['DATABASE_URL', 'set in Replit secrets'],
  ['SESSION_SECRET', 'set in Replit secrets'],
  ['CLOUDFLARE_API_TOKEN', 'set in Replit secrets'],
  ['GITHUB_TOKEN', 'set in Replit secrets'],
]);

Note('Important: never paste your client secret, service account JSON, or session secret into chats, tickets, or screenshots. They belong only in the Secrets pane of your hosting provider.');

doc.addPage();
H1('2. Google OAuth User Login');
P('This lets your team and clients click "Sign in with Google" instead of creating a username + password. You already created the OAuth Client in Google Cloud (named "vamanagerclientidforcreatingorlogin"). Below are the exact remaining steps.');

H2('Step 1 — Confirm the OAuth client type');
NumberedSteps([
  'Open https://console.cloud.google.com',
  'Top-left project picker → select "vamanager-494521".',
  'Left menu → APIs & Services → Credentials.',
  'Find "vamanagerclientidforcreatingorlogin" and click it.',
  'Type must be "Web application". If it says "Desktop" or "Native", create a new Web application credential — desktop credentials cannot accept HTTPS redirects.',
]);

H2('Step 2 — Add Authorized JavaScript origins');
P('Paste each of these on its own line in the "Authorized JavaScript origins" section:');
Code(`https://f242e461-b0fa-4efd-84df-1ce2c3b62f08-00-2syqx17619hzn.janeway.replit.dev
https://va-manager.onrender.com
https://va-manager.<your-cf-subdomain>.workers.dev`);
Note('Replace the Render and Cloudflare lines with whatever subdomain you actually use after you deploy. You can come back and edit these later — Google saves changes within ~5 minutes.');

H2('Step 3 — Add Authorized redirect URIs');
P('These are the exact callback URLs Google will POST the auth code back to:');
Code(`https://f242e461-b0fa-4efd-84df-1ce2c3b62f08-00-2syqx17619hzn.janeway.replit.dev/api/auth/google/callback
https://va-manager.onrender.com/api/auth/google/callback
https://va-manager.<your-cf-subdomain>.workers.dev/api/auth/google/callback`);

H2('Step 4 — Copy the Client ID and Client Secret');
NumberedSteps([
  'On the same Credentials page, copy "Client ID" — it ends in .apps.googleusercontent.com.',
  'Click "Reset client secret" if you have never seen the secret. Copy it.',
  'Open Replit → your project → Tools → Secrets.',
  'Add two secrets exactly named: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
  'On Render and Cloudflare add the same two secrets in their Environment Variables panels.',
]);

doc.addPage();

H2('Step 5 — Configure the OAuth consent screen');
NumberedSteps([
  'Left menu → APIs & Services → OAuth consent screen.',
  'User type: "External" if anyone outside your Google Workspace will sign in. Click "Create".',
  'App name: "VA eBay Client Manager".',
  'User support email: your email.',
  'App logo: optional but recommended (square PNG, ≥120×120, ≤1 MB).',
  'Application home page: your production URL (e.g. https://va-manager.onrender.com).',
  'Authorized domains: add onrender.com, workers.dev, and your custom domain root if you have one (e.g. yourdomain.com — not the full https URL).',
  'Developer contact: your email.',
  'Click Save and Continue → Scopes → "Add or Remove Scopes" → search and check: openid, /auth/userinfo.email, /auth/userinfo.profile.',
  'Test users: while in "Testing" mode, add the Gmail addresses of everyone who needs to log in.',
  'When ready, click "PUBLISH APP" to make it usable by any Google account (no review needed for the three basic scopes above).',
]);

H2('Step 6 — Test it');
NumberedSteps([
  'Restart the app workflow so it picks up the new secrets.',
  'Open the dashboard and click "Sign in with Google".',
  'Pick your Google account → grant access → you should land back on the dashboard signed in.',
  'If you see "Error 400: redirect_uri_mismatch", re-check Step 3: the URL in the error must match one of your Authorized redirect URIs character-for-character.',
]);

doc.addPage();
H1('3. Google Sheets Sync');
P('The Sheets API uses a *Service Account* — a robot identity that owns its own email address and JSON key. This is separate from the OAuth client above.');

H2('Step 1 — Enable the Sheets API');
NumberedSteps([
  'Console → top search bar → "Google Sheets API" → click it → "Enable".',
  'Same for "Google Drive API" (optional, but lets you list/create sheets).',
]);

H2('Step 2 — Create the Service Account');
NumberedSteps([
  'Left menu → IAM & Admin → Service Accounts → "Create service account".',
  'Service account name: "va-manager-sheets-sync".',
  'Service account ID: leave the auto value.',
  'Description: "Reads/writes Google Sheets for VA Manager".',
  'Click "Create and Continue".',
  'Role: skip (no project-wide role needed). Click "Continue" → "Done".',
]);

H2('Step 3 — Generate the JSON key');
NumberedSteps([
  'Click the new service account.',
  'Tab "Keys" → "Add Key" → "Create new key" → JSON → "Create".',
  'A .json file downloads. Open it in a text editor — you will need three values:',
]);
Code(`"client_email":  "va-manager-sheets-sync@vamanager-494521.iam.gserviceaccount.com"
"project_id":    "vamanager-494521"`);

H2('Step 4 — Add the secrets to your app');
P('Add these three secrets in Replit → Secrets (and the same three on Render / Cloudflare):');
KV([
  ['GOOGLE_SA_EMAIL', 'paste client_email exactly'],
  ['GOOGLE_SA_PRIVATE_KEY', 'paste private_key exactly (keep the \\n)'],
  ['GOOGLE_PROJECT_ID', 'vamanager-494521'],
]);
Note('When pasting the private key into Replit Secrets, paste it as one long line with the literal \\n characters (do not press Enter inside the value). The app converts \\n back into real newlines at runtime.');

doc.addPage();

H2('Step 5 — Share your Google Sheet with the Service Account');
NumberedSteps([
  'Open the Google Sheet you want to sync to.',
  'Click "Share" (top-right).',
  'Paste the service account email (the GOOGLE_SA_EMAIL from above).',
  'Set permission to "Editor".',
  'Untick "Notify people" (the robot does not read email).',
  'Click "Share" → "Share anyway".',
]);

H2('Step 6 — Get the Sheet ID');
P('Open your sheet. Look at the URL:');
Code(`https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       this is your Sheet ID`);
P('Add it to Secrets as GOOGLE_SHEET_ID. You can use a different ID per environment if you want a separate "staging" sheet vs "production" sheet.');

H2('Step 7 — Run the first sync');
NumberedSteps([
  'Open the dashboard → sidebar → "Sheets Sync".',
  'Click "Test connection" — you should see a green confirmation with the sheet title.',
  'Pick which tabs to push (Clients, Invoices, Tasks, Earnings, Expenses, Violations, eBay Accounts).',
  'Click "Sync now". The robot writes one tab per data type. Existing rows are overwritten so the sheet is always a mirror of the database.',
  'Subsequent syncs can be triggered manually from the page or scheduled — see the "Schedule" toggle.',
]);

H2('Optional — Bidirectional sync');
P('By default the sync is one-way: app → sheet. If you want to *import* edits back from the sheet, enable "Pull updates from sheet" on the Sheets Sync page. The app will read each tab on a 5-minute interval and apply changes by row ID. Be careful — typos in the sheet become typos in your database.');

doc.addPage();
H1('4. Deployment to Render');
P('Render reads the render.yaml file at the repo root and builds everything for you. There is nothing to install on your laptop.');

H2('One-time setup');
NumberedSteps([
  'Go to https://render.com → "New +" → "Blueprint".',
  'Connect your GitHub account when prompted, then pick the "vamanger" repo.',
  'Render reads render.yaml and previews the resources it will create: 1 web service + 1 PostgreSQL database.',
  'Click "Apply". Render builds and deploys automatically (~3–5 minutes).',
  'When the build is green, copy your URL — looks like https://va-manager.onrender.com.',
]);

H2('Add the secrets on Render');
P('Render → your service → Environment → "Add Environment Variable". Add every key from the table in section 6.');

H2('Custom domain (optional)');
NumberedSteps([
  'Render → your service → Settings → "Custom Domains" → "Add".',
  'Enter app.yourdomain.com.',
  'Render shows you a CNAME target — paste it into your DNS provider as a CNAME record.',
  'Wait ~5 minutes. Render auto-issues a free TLS certificate.',
]);

H2('Auto-deploy on push');
P('Every git push to main triggers a new Render deploy. You can disable this in Settings → Auto-Deploy if you prefer manual.');

doc.addPage();
H1('5. Deployment to Cloudflare Workers');
P('The Cloudflare deployment uses Workers + D1 (SQLite at the edge) + KV (sessions). The repo includes everything pre-wired in artifacts/cf-api.');

H2('Step 1 — Create the D1 database (one time)');
Code(`npx wrangler login
npx wrangler d1 create va-manager-db`);
P('Copy the database_id Wrangler prints. Paste it into artifacts/cf-api/wrangler.toml in place of REPLACE_WITH_D1_DATABASE_ID.');

H2('Step 2 — Create the KV namespace');
Code(`npx wrangler kv:namespace create SESSIONS`);
P('Copy the id Wrangler prints. Paste it into wrangler.toml in place of REPLACE_WITH_KV_NAMESPACE_ID.');

H2('Step 3 — Apply the migrations');
Code(`cd artifacts/cf-api
npx wrangler d1 migrations apply va-manager-db --remote`);

H2('Step 4 — Push secrets to Cloudflare');
Code(`npx wrangler secret put SESSION_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_SA_EMAIL
npx wrangler secret put GOOGLE_SA_PRIVATE_KEY
npx wrangler secret put GOOGLE_SHEET_ID`);

H2('Step 5 — Deploy');
Code(`npx wrangler deploy`);
P('Wrangler prints the live URL. Add that URL to your Google OAuth "Authorized JavaScript origins" and "Authorized redirect URIs" (section 2, steps 2 & 3).');

Note('The CLOUDFLARE_API_TOKEN secret in your Replit project has a "not_before" restriction set to 2026-04-27 — it activates at midnight UTC on April 27. If you try to deploy before then you will see a 9109 error. Just wait until the token activates and re-run wrangler deploy.');

doc.addPage();
H1('6. Environment Variables Reference');
P('Set the same variables on Replit, Render, and Cloudflare so the app behaves identically everywhere.');

KV([
  ['DATABASE_URL', 'Postgres connection string (auto on Render)'],
  ['SESSION_SECRET', 'long random string (32+ chars)'],
  ['GOOGLE_CLIENT_ID', 'from OAuth client (ends in .apps.googleusercontent.com)'],
  ['GOOGLE_CLIENT_SECRET', 'from OAuth client'],
  ['GOOGLE_SA_EMAIL', 'service account client_email'],
  ['GOOGLE_SA_PRIVATE_KEY', 'service account private_key (with \\n)'],
  ['GOOGLE_PROJECT_ID', 'vamanager-494521'],
  ['GOOGLE_SHEET_ID', 'ID from your sheet URL'],
  ['NODE_ENV', 'production'],
  ['ADMIN_EMAILS', 'comma list of Gmails allowed in /admin'],
]);

H2('How to generate a strong SESSION_SECRET');
Code(`node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`);
P('Paste the output as the SESSION_SECRET value.');

doc.addPage();
H1('7. Troubleshooting & FAQ');

H3('"redirect_uri_mismatch" when signing in with Google');
P('The URL the browser was sent to does not exactly match any URI in your OAuth client. Compare the URL in the error message to the list in your Credentials page — even a missing slash or http vs https will fail. Add the exact URL and wait ~3 minutes for Google to refresh.');

H3('"Sheets API has not been used in project … or it is disabled"');
P('You skipped Section 3, Step 1. Go enable the Google Sheets API on the project that owns your service account.');

H3('"The caller does not have permission" when syncing a sheet');
P('You forgot to share the sheet with the service account email (Section 3, Step 5) or you shared it as Viewer. Set it to Editor.');

H3('Cloudflare deploy returns "Authentication error [code 9109]"');
P('Your CLOUDFLARE_API_TOKEN is restricted by date or expired. Open the Cloudflare dashboard → My Profile → API Tokens → check the token start/expiry. Either wait, or create a fresh token with permissions: Account → Workers Scripts: Edit, Account → D1: Edit, Account → Workers KV Storage: Edit.');

H3('"relation \\"users\\" does not exist" on a fresh deploy');
P('You forgot to push the schema. Run "pnpm --filter @workspace/api-server db:push" against the new database, or for Cloudflare run "wrangler d1 migrations apply va-manager-db --remote".');

H3('Sessions logging out on every page reload in production');
P('SESSION_SECRET is missing or different between processes. Set it once and reuse the same value across all instances.');

H3('Google Sheets sync writes blank rows');
P('The service account is reading an empty range. Check that the GOOGLE_SHEET_ID is correct and that there is at least one data row in the source database table.');

H3('How do I rotate the OAuth client secret?');
P('Console → Credentials → click your client → "Reset client secret". Update GOOGLE_CLIENT_SECRET on every host. Old secret keeps working for ~1 hour as a grace period.');

H3('How do I revoke the service account?');
P('Console → IAM & Admin → Service Accounts → click → Keys → delete the key. Sheets sync stops immediately. Generate a new key and update the three GOOGLE_SA_* secrets.');

doc.addPage();
H1('You are done!');
P('You now have:');
Bullets([
  'Sign in with Google for the whole team',
  'One-click Google Sheets sync for every data table',
  'A Render deployment that auto-builds on every git push',
  'A Cloudflare Workers deployment for global edge performance',
  'Clear secrets and rotation procedures',
]);

P(' ');
Note('If anything in this guide changes (URLs, secret names, scopes), regenerate this PDF: from the project root run "node scripts/generate-setup-guide.cjs" and you will get a fresh copy in attached_assets/guides/.');

P(' ');
doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(9)
  .text('Generated for VA eBay Client Manager • ' + new Date().toISOString().slice(0, 10), { align: 'center' });

FooterPage();
doc.end();

doc.on('end', () => {
  console.log('Wrote', outPath);
});
