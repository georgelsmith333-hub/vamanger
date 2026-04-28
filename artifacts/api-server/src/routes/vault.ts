import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

const VAULT_PASSWORD_KEY = "vault_password_hash";
const VAULT_TOKENS = new Set<string>();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "va-manager-vault-salt-2024").digest("hex");
}

function maskValue(value: string | undefined): string {
  if (!value || value.length === 0) return "NOT SET";
  if (value.length <= 8) return "●".repeat(value.length);
  return value.slice(0, 4) + "●".repeat(Math.min(value.length - 8, 20)) + value.slice(-4);
}

function isSet(value: string | undefined): boolean {
  return !!(value && value.length > 0);
}

async function getVaultPasswordHash(): Promise<string | null> {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.key, VAULT_PASSWORD_KEY));
  if (rows.length > 0 && rows[0].value) return rows[0].value;
  const seed = process.env["SESSION_SECRET"];
  if (!seed) return null;
  const hash = hashPassword(seed.slice(0, 16));
  await db.insert(settingsTable).values({ key: VAULT_PASSWORD_KEY, value: hash, label: "Vault Password Hash", group: "security" }).onConflictDoNothing();
  return hash;
}

router.post("/admin/vault/auth", async (req, res): Promise<void> => {
  const { password } = req.body;
  if (!password) { res.status(400).json({ error: "Password required" }); return; }
  const storedHash = await getVaultPasswordHash();
  if (!storedHash) {
    res.status(503).json({ error: "Vault not configured. Set SESSION_SECRET environment variable on the server." });
    return;
  }
  const inputHash = hashPassword(password);
  if (inputHash !== storedHash) {
    res.status(401).json({ error: "Incorrect vault password" });
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  VAULT_TOKENS.add(token);
  setTimeout(() => VAULT_TOKENS.delete(token), 30 * 60 * 1000); // 30 min expiry
  res.json({ token });
});

function requireVaultToken(req: any, res: any): boolean {
  const token = req.headers["x-vault-token"] as string;
  if (!token || !VAULT_TOKENS.has(token)) {
    res.status(403).json({ error: "Vault authentication required" });
    return false;
  }
  return true;
}

router.get("/admin/vault/status", async (req, res): Promise<void> => {
  if (!requireVaultToken(req, res)) return;

  const env = process.env;
  const credentials = [
    {
      key: "GOOGLE_CLIENT_ID",
      label: "Google OAuth Client ID",
      group: "Google OAuth",
      description: "Identifies your app to Google OAuth",
      set: isSet(env.GOOGLE_CLIENT_ID),
      masked: maskValue(env.GOOGLE_CLIENT_ID),
    },
    {
      key: "GOOGLE_CLIENT_SECRET",
      label: "Google OAuth Client Secret",
      group: "Google OAuth",
      description: "Secret key for Google OAuth authentication",
      set: isSet(env.GOOGLE_CLIENT_SECRET),
      masked: maskValue(env.GOOGLE_CLIENT_SECRET),
    },
    {
      key: "GOOGLE_SA_EMAIL",
      label: "Service Account Email",
      group: "Google Sheets",
      description: "Email address of the Google service account",
      set: isSet(env.GOOGLE_SA_EMAIL),
      masked: maskValue(env.GOOGLE_SA_EMAIL),
    },
    {
      key: "GOOGLE_SA_PRIVATE_KEY",
      label: "Service Account Private Key",
      group: "Google Sheets",
      description: "RSA private key for Google Sheets API access",
      set: isSet(env.GOOGLE_SA_PRIVATE_KEY),
      masked: "●●●●●●●●●●●●●● (PEM key stored)",
    },
    {
      key: "GOOGLE_PROJECT_ID",
      label: "Google Project ID",
      group: "Google Cloud",
      description: "Google Cloud project identifier",
      set: isSet(env.GOOGLE_PROJECT_ID),
      masked: maskValue(env.GOOGLE_PROJECT_ID),
    },
    {
      key: "GOOGLE_SHEET_ID",
      label: "Google Sheet ID",
      group: "Google Sheets",
      description: "ID of the spreadsheet used for data sync",
      set: isSet(env.GOOGLE_SHEET_ID),
      masked: maskValue(env.GOOGLE_SHEET_ID),
    },
    {
      key: "DATABASE_URL",
      label: "Database URL",
      group: "Database",
      description: "PostgreSQL connection string",
      set: isSet(env.DATABASE_URL),
      masked: env.DATABASE_URL ? env.DATABASE_URL.replace(/:([^:@]+)@/, ":●●●●●●●●@") : "NOT SET",
    },
  ];

  const techStack = [
    { layer: "Frontend", tech: "React 19 + TypeScript", detail: "Vite build, deployed on Cloudflare Pages", status: "live" },
    { layer: "Backend API", tech: "Node.js + Express", detail: "TypeScript, esbuild, deployed on Render", status: "live" },
    { layer: "Database", tech: "PostgreSQL", detail: "Drizzle ORM, Neon/Render Postgres", status: "live" },
    { layer: "Auth", tech: "Google OAuth 2.0", detail: "Session-based, express-session", status: "configured" },
    { layer: "Sheets Sync", tech: "Google Sheets API v4", detail: "Service account auth, real-time sync", status: "configured" },
    { layer: "Frontend CDN", tech: "Cloudflare Pages", detail: "Global CDN, va-client-manager.pages.dev", status: "live" },
    { layer: "API Host", tech: "Render.com", detail: "Free tier, Oregon region", status: "deploying" },
    { layer: "ORM", tech: "Drizzle ORM", detail: "Type-safe SQL, drizzle-kit migrations", status: "live" },
    { layer: "UI Library", tech: "shadcn/ui + Tailwind CSS", detail: "Radix UI primitives, dark theme", status: "live" },
    { layer: "State Mgmt", tech: "TanStack Query v5", detail: "Server state, caching, auto-refresh", status: "live" },
  ];

  res.json({ credentials, techStack, allSet: credentials.every(c => c.set) });
});

router.post("/admin/vault/change-password", async (req, res): Promise<void> => {
  if (!requireVaultToken(req, res)) return;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) { res.status(400).json({ error: "Both passwords required" }); return; }
  if (newPassword.length < 8) { res.status(400).json({ error: "New password must be at least 8 characters" }); return; }
  const storedHash = await getVaultPasswordHash();
  if (hashPassword(currentPassword) !== storedHash) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  const newHash = hashPassword(newPassword);
  await db.update(settingsTable).set({ value: newHash }).where(eq(settingsTable.key, VAULT_PASSWORD_KEY));
  VAULT_TOKENS.clear();
  res.json({ success: true, message: "Vault password changed. All sessions invalidated." });
});


router.post("/admin/vault/test-sheets", async (req, res): Promise<void> => {
  if (!requireVaultToken(req, res)) return;
  const saEmail = process.env.GOOGLE_SA_EMAIL;
  const saKey = process.env.GOOGLE_SA_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!saEmail || !saKey || !sheetId) {
    res.json({ success: false, message: "Missing Google Sheets credentials" }); return;
  }
  try {
    const { google } = await import("googleapis");
    const auth = new google.auth.JWT(saEmail, undefined, saKey.replace(/\\n/g, "\n"), ["https://www.googleapis.com/auth/spreadsheets.readonly"]);
    await auth.authorize();
    res.json({ success: true, message: "Google Sheets connection successful" });
  } catch (e: any) {
    res.json({ success: false, message: e.message });
  }
});

export default router;
