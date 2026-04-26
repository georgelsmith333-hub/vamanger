import { Router } from "express";
import { db, clientsTable, ebayAccountsTable, invoicesTable, tasksTable, earningsTable, expensesTable, violationsTable } from "@workspace/db";

const router = Router();

async function getServiceAccountToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson) as {
    client_email: string;
    private_key: string;
  };

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const base64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const signingInput = `${base64url(header)}.${base64url(payload)}`;

  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(sa.private_key, "base64url");

  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokenData.access_token) throw new Error(tokenData.error ?? "Failed to get access token");
  return tokenData.access_token;
}

type TableRow = Record<string, unknown>;

async function getTableData(table: string): Promise<{ headers: string[]; rows: TableRow[] }> {
  switch (table) {
    case "clients": {
      const rows = await db.select().from(clientsTable);
      return { headers: Object.keys(rows[0] ?? {}), rows: rows as TableRow[] };
    }
    case "ebay_accounts": {
      const rows = await db.select().from(ebayAccountsTable);
      return { headers: Object.keys(rows[0] ?? {}), rows: rows as TableRow[] };
    }
    case "invoices": {
      const rows = await db.select().from(invoicesTable);
      return { headers: Object.keys(rows[0] ?? {}), rows: rows as TableRow[] };
    }
    case "tasks": {
      const rows = await db.select().from(tasksTable);
      return { headers: Object.keys(rows[0] ?? {}), rows: rows as TableRow[] };
    }
    case "earnings": {
      const rows = await db.select().from(earningsTable);
      return { headers: Object.keys(rows[0] ?? {}), rows: rows as TableRow[] };
    }
    case "expenses": {
      const rows = await db.select().from(expensesTable);
      return { headers: Object.keys(rows[0] ?? {}), rows: rows as TableRow[] };
    }
    case "violations": {
      const rows = await db.select().from(violationsTable);
      return { headers: Object.keys(rows[0] ?? {}), rows: rows as TableRow[] };
    }
    default:
      throw new Error(`Unknown table: ${table}`);
  }
}

router.post("/sheets/export", async (req, res): Promise<void> => {
  const { sheetId, sheetName, table } = req.body as { sheetId?: string; sheetName?: string; table?: string };

  const GOOGLE_SHEET_ID = sheetId ?? process.env.GOOGLE_SHEET_ID;
  const GOOGLE_SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!GOOGLE_SHEET_ID) {
    res.status(400).json({ error: "No Google Sheet ID provided. Pass sheetId in request body or set GOOGLE_SHEET_ID env var." });
    return;
  }
  if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
    res.status(400).json({ error: "GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set. Add your Google service account JSON as this env var." });
    return;
  }
  if (!table) {
    res.status(400).json({ error: "table parameter required (clients, invoices, tasks, earnings, expenses, violations, ebay_accounts)" });
    return;
  }

  let tableData: { headers: string[]; rows: TableRow[] };
  try {
    tableData = await getTableData(table);
  } catch (err) {
    res.status(400).json({ error: String(err) });
    return;
  }

  let accessToken: string;
  try {
    accessToken = await getServiceAccountToken(GOOGLE_SERVICE_ACCOUNT_KEY);
  } catch (err) {
    res.status(500).json({ error: `Auth failed: ${String(err)}` });
    return;
  }

  const targetSheet = sheetName ?? table;
  const values = [
    tableData.headers,
    ...tableData.rows.map(row => tableData.headers.map(h => {
      const v = row[h];
      if (v === null || v === undefined) return "";
      if (v instanceof Date) return v.toISOString();
      return String(v);
    })),
  ];

  const clearRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${encodeURIComponent(targetSheet)}!A1:ZZ99999:clear`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!clearRes.ok) {
    const txt = await clearRes.text();
    res.status(500).json({ error: `Failed to clear sheet: ${txt}` });
    return;
  }

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${encodeURIComponent(targetSheet)}!A1?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    }
  );

  if (!updateRes.ok) {
    const txt = await updateRes.text();
    res.status(500).json({ error: `Failed to update sheet: ${txt}` });
    return;
  }

  res.json({
    success: true,
    table,
    sheet: targetSheet,
    rows: tableData.rows.length,
    message: `Exported ${tableData.rows.length} rows from '${table}' to sheet '${targetSheet}'`,
  });
});

router.get("/sheets/status", (_req, res): void => {
  res.json({
    configured: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    sheetId: process.env.GOOGLE_SHEET_ID ? "[set]" : null,
    tables: ["clients", "ebay_accounts", "invoices", "tasks", "earnings", "expenses", "violations"],
  });
});

export default router;
