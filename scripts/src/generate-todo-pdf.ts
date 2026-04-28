/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from "pdfkit";
import { createWriteStream, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "deliverables", "VA-Manager-TODO.pdf");
if (!existsSync(dirname(OUT))) mkdirSync(dirname(OUT), { recursive: true });

interface Section {
  title: string;
  intro?: string;
  items: { label: string; url?: string; note?: string }[];
}

const sections: Section[] = [
  {
    title: "1. Verify GitHub push landed",
    intro:
      "Your local Replit changes have been pushed to GitHub. This triggers the auto-deploy hooks for both Cloudflare Pages (frontend) and Render (API).",
    items: [
      {
        label: "Open the GitHub repo and confirm the latest commit is from today",
        url: "https://github.com/georgelsmith333-hub/vamanger/commits/main",
      },
      {
        label: "Check the Actions / commit status",
        url: "https://github.com/georgelsmith333-hub/vamanger/actions",
      },
    ],
  },
  {
    title: "2. Confirm Cloudflare Pages deploy succeeded",
    intro:
      "Cloudflare Pages auto-builds the dashboard on every push to main. Build command is set to `pnpm install && pnpm --filter @workspace/va-dashboard run build`, output dir `artifacts/va-dashboard/dist/public`.",
    items: [
      {
        label: "Open the Cloudflare Pages project deployments page",
        url: "https://dash.cloudflare.com/a5190f614965188b2218d06eebc4dabf/pages/view/va-client-manager",
      },
      {
        label: "Wait for the latest deployment to show 'Success' (~3-5 min)",
      },
      {
        label: "Open the live site",
        url: "https://va-client-manager.pages.dev",
      },
      {
        label:
          "Project settings — confirm env var VITE_API_BASE_URL = https://va-api.onrender.com (Production AND Preview)",
        url: "https://dash.cloudflare.com/a5190f614965188b2218d06eebc4dabf/pages/view/va-client-manager/settings/environment-variables",
      },
    ],
  },
  {
    title: "3. Confirm Render API deploy succeeded",
    intro:
      "Render auto-builds the API server on every push to main. Build cmd: `pnpm install && pnpm --filter @workspace/api-server run build`. Start cmd: `node --enable-source-maps artifacts/api-server/dist/index.mjs`.",
    items: [
      {
        label: "Open the Render service dashboard",
        url: "https://dashboard.render.com/web/srv-d7o08gho3t8c73evuj80",
      },
      {
        label: "Watch the live build log; should finish in 4-7 min",
      },
      {
        label: "Once Live, hit the health endpoint to confirm",
        url: "https://va-api.onrender.com/api/healthz",
      },
      {
        label:
          "Environment tab — confirm ALL of these are set: DATABASE_URL, ADMIN_TOKEN, VAULT_TOKEN, GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, GOOGLE_SHEET_ID, NODE_ENV=production",
        url: "https://dashboard.render.com/web/srv-d7o08gho3t8c73evuj80/env",
      },
    ],
  },
  {
    title: "4. End-to-end smoke test",
    items: [
      {
        label: "Open the dashboard and log in as admin",
        url: "https://va-client-manager.pages.dev/admin/login",
      },
      {
        label: "Visit each page in turn (Clients, eBay Accounts, Wise Cards, Bank Accounts, Tasks, Violations, Invoices, Expenses, Earnings, Daily Login) and confirm no console errors",
      },
      {
        label:
          "Try CREATE on each: Add Client, Add eBay Account, Add Wise Card (now requires Card Code), Add Bank Account (now requires Bank Code), Add Task, Add Violation (now requires eBay Username), Add Invoice, Add Expense",
        note: "These were broken before today (form schema vs API contract mismatch). Now fixed.",
      },
      {
        label:
          "Test Google Sheets sync from the Sync page (requires GOOGLE_SA_* env vars set on Render)",
      },
    ],
  },
  {
    title: "5. Optional cleanup (cosmetic, non-blocking)",
    intro:
      "These leftover files are no longer used by the production deploy and can be deleted from the repo whenever you want a tidier project. The deploys do not depend on any of them.",
    items: [
      { label: "Delete `va-cloudflare-deploy/` folder (legacy export)" },
      { label: "Delete `va-cloudflare-upload.tar.gz` and `va-cloudflare-upload.zip` (legacy export archives)" },
      { label: "Delete `electron/` folder (Electron desktop wrapper, never finished)" },
      { label: "Delete `capacitor.config.ts` and `android/` if present (mobile wrapper, never finished)" },
      { label: "Delete root `wrangler.toml` (only the dashboard-internal one is used)" },
      { label: "Delete `.replit`, `.replitignore`, and `replit.md` if you fully leave Replit" },
      { label: "Delete `artifacts/cf-api/` if you confirm you never used the Cloudflare Workers + D1 path" },
    ],
  },
  {
    title: "6. Token & secret rotation (now that the old ones were exposed)",
    items: [
      {
        label:
          "The previous Cloudflare API token and GitHub PAT in your old chat history should be considered burned. New ones are now in Replit Secrets only. Rotate again any time at:",
      },
      { label: "Cloudflare API tokens", url: "https://dash.cloudflare.com/profile/api-tokens" },
      { label: "GitHub Personal Access Tokens", url: "https://github.com/settings/tokens" },
      { label: "Render API keys", url: "https://dashboard.render.com/u/settings#api-keys" },
    ],
  },
];

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 56, bottom: 56, left: 56, right: 56 },
  info: {
    Title: "VA eBay Client Manager — Remaining TODO",
    Author: "Replit Agent build assistant",
    Subject: "Manual steps to verify deploy and finish migration off Replit",
    CreationDate: new Date(),
  },
});

doc.pipe(createWriteStream(OUT));

const NAVY = "#0f172a";
const SLATE = "#334155";
const MUTED = "#64748b";
const ACCENT = "#2563eb";
const RULE = "#e2e8f0";

// --- Title block
doc
  .fillColor(NAVY)
  .font("Helvetica-Bold")
  .fontSize(22)
  .text("VA eBay Client Manager", { align: "left" })
  .moveDown(0.15);
doc
  .fillColor(SLATE)
  .font("Helvetica-Bold")
  .fontSize(14)
  .text("Post-migration TODO — manual steps to finish the cutover", { align: "left" })
  .moveDown(0.4);
doc
  .fillColor(MUTED)
  .font("Helvetica")
  .fontSize(10)
  .text(
    "All Replit-specific dependencies removed. Codebase typechecks clean. API server and dashboard production builds verified locally. The only remaining work is verifying the auto-deploys fired and doing a smoke test in production.",
    { align: "left" },
  )
  .moveDown(0.3);
doc
  .fillColor(MUTED)
  .fontSize(9)
  .text(`Generated ${new Date().toUTCString()}`, { align: "left" })
  .moveDown(0.6);

// rule
doc
  .strokeColor(RULE)
  .lineWidth(1)
  .moveTo(56, doc.y)
  .lineTo(556, doc.y)
  .stroke()
  .moveDown(0.6);

function ensureRoom(linesNeeded = 3) {
  const lineHeight = 14;
  if (doc.y + lineHeight * linesNeeded > doc.page.height - 70) doc.addPage();
}

for (const section of sections) {
  ensureRoom(5);
  doc
    .fillColor(NAVY)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(section.title)
    .moveDown(0.2);
  if (section.intro) {
    doc
      .fillColor(SLATE)
      .font("Helvetica")
      .fontSize(10)
      .text(section.intro, { align: "left" })
      .moveDown(0.35);
  }
  for (const it of section.items) {
    ensureRoom(2);
    const startX = 56;
    const indentX = 72;
    // bullet
    doc
      .fillColor(SLATE)
      .font("Helvetica")
      .fontSize(10)
      .text("•", startX, doc.y, { continued: false, lineBreak: false });
    const yLabel = doc.y;
    doc.text(it.label, indentX, yLabel, { width: 470, align: "left" });
    if (it.url) {
      doc
        .fillColor(ACCENT)
        .font("Helvetica-Oblique")
        .fontSize(9)
        .text(it.url, indentX, doc.y, {
          width: 470,
          link: it.url,
          underline: true,
        });
    }
    if (it.note) {
      doc
        .fillColor(MUTED)
        .font("Helvetica-Oblique")
        .fontSize(9)
        .text(it.note, indentX, doc.y, { width: 470 });
    }
    doc.moveDown(0.25);
  }
  doc.moveDown(0.4);
  // section rule
  doc
    .strokeColor(RULE)
    .lineWidth(0.5)
    .moveTo(56, doc.y)
    .lineTo(556, doc.y)
    .stroke()
    .moveDown(0.4);
}

// Footer
ensureRoom(4);
doc
  .fillColor(MUTED)
  .font("Helvetica-Oblique")
  .fontSize(9)
  .text(
    "If a deploy fails, check that the build command, start command, and env vars on the platform match this PDF. The two most common causes are: (1) missing env vars on Render, (2) wrong VITE_API_BASE_URL on Cloudflare Pages.",
    { align: "left" },
  );

doc.end();
console.log(`Wrote ${OUT}`);
