import { Router } from "express";
import { db, auditLogTable, settingsTable, clientsTable, ebayAccountsTable, wiseCardsTable, bankAccountsTable, invoicesTable, violationsTable, tasksTable, earningsTable, expensesTable, recoveryEntriesTable, dailyLoginsTable, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { serializeDates } from "../lib/serialize";

const router = Router();

// ─── Stats ─────────────────────────────────────────────────────────────────
router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [clients, ebay, invoices, violations, tasks, earnings, expenses] = await Promise.all([
    db.select().from(clientsTable),
    db.select().from(ebayAccountsTable),
    db.select().from(invoicesTable),
    db.select().from(violationsTable),
    db.select().from(tasksTable),
    db.select().from(earningsTable),
    db.select().from(expensesTable),
  ]);

  const totalRevenue = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalEarnings = earnings.reduce((s, e) => s + Number(e.amount), 0);

  res.json({
    clients: { total: clients.length, active: clients.filter(c => c.status === "Active").length },
    ebayAccounts: { total: ebay.length, active: ebay.filter(a => a.status === "Active").length },
    invoices: {
      total: invoices.length,
      paid: invoices.filter(i => i.status === "Paid").length,
      overdue: invoices.filter(i => i.status === "Overdue").length,
      totalRevenue,
    },
    violations: { total: violations.length, open: violations.filter(v => !v.resolved).length },
    tasks: { total: tasks.length, pending: tasks.filter(t => !t.done).length, done: tasks.filter(t => t.done).length },
    financials: { totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses, totalEarnings },
  });
});

// ─── Audit Log ─────────────────────────────────────────────────────────────
router.get("/admin/audit", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query["limit"] ?? 100), 500);
  const tableName = req.query["table"] as string | undefined;
  const rows = tableName
    ? await db.select().from(auditLogTable).where(eq(auditLogTable.tableName, tableName)).orderBy(desc(auditLogTable.createdAt)).limit(limit)
    : await db.select().from(auditLogTable).orderBy(desc(auditLogTable.createdAt)).limit(limit);
  res.json(rows.map(serializeDates));
});

// ─── Undo ──────────────────────────────────────────────────────────────────
router.post("/admin/audit/:id/undo", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [entry] = await db.select().from(auditLogTable).where(eq(auditLogTable.id, id));
  if (!entry) { res.status(404).json({ error: "Audit entry not found" }); return; }
  if (entry.undone) { res.status(400).json({ error: "This action has already been undone" }); return; }
  if (!entry.previousData && entry.action !== "CREATE") {
    res.status(400).json({ error: "No previous data to restore" }); return;
  }

  const tableMap: Record<string, typeof clientsTable | typeof ebayAccountsTable | typeof invoicesTable | typeof tasksTable | typeof violationsTable> = {
    clients: clientsTable,
    ebay_accounts: ebayAccountsTable,
    invoices: invoicesTable,
    tasks: tasksTable,
    violations: violationsTable,
  };

  try {
    const table = tableMap[entry.tableName];
    if (entry.action === "DELETE" && entry.previousData && table) {
      // Restore deleted record
      const data = entry.previousData as Record<string, unknown>;
      delete data["id"];
      delete data["createdAt"];
      delete data["updatedAt"];
      await (db.insert(table) as ReturnType<typeof db.insert>).values(data as never);
    } else if (entry.action === "UPDATE" && entry.previousData && table && entry.recordId) {
      // Restore previous state
      const data = entry.previousData as Record<string, unknown>;
      delete data["id"];
      delete data["createdAt"];
      await (db.update(table) as ReturnType<typeof db.update>).set(data as never).where(eq((table as typeof clientsTable).id, entry.recordId));
    } else if (entry.action === "CREATE" && table && entry.recordId) {
      // Remove newly created record
      await (db.delete(table) as ReturnType<typeof db.delete>).where(eq((table as typeof clientsTable).id, entry.recordId));
    }

    await db.update(auditLogTable).set({ undone: true, undoneAt: new Date() }).where(eq(auditLogTable.id, id));

    await db.insert(activityTable).values({
      type: "undo",
      description: `Undone: ${entry.description}`,
      clientName: null,
    });

    res.json({ success: true, message: `Undone: ${entry.description}` });
  } catch (err) {
    console.error("Undo failed:", err);
    res.status(500).json({ error: "Undo failed — this action may not be reversible automatically." });
  }
});

// ─── CSV Export ────────────────────────────────────────────────────────────
function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0] ?? {});
  const header = keys.join(",");
  const lines = rows.map(r => keys.map(k => {
    const v = r[k];
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(","));
  return [header, ...lines].join("\n");
}

const EXPORT_MAP: Record<string, typeof clientsTable> = {
  clients: clientsTable,
  "ebay-accounts": ebayAccountsTable as unknown as typeof clientsTable,
  "wise-cards": wiseCardsTable as unknown as typeof clientsTable,
  "bank-accounts": bankAccountsTable as unknown as typeof clientsTable,
  invoices: invoicesTable as unknown as typeof clientsTable,
  violations: violationsTable as unknown as typeof clientsTable,
  tasks: tasksTable as unknown as typeof clientsTable,
  earnings: earningsTable as unknown as typeof clientsTable,
  expenses: expensesTable as unknown as typeof clientsTable,
  recovery: recoveryEntriesTable as unknown as typeof clientsTable,
  "daily-logins": dailyLoginsTable as unknown as typeof clientsTable,
  "audit-log": auditLogTable as unknown as typeof clientsTable,
};

router.get("/admin/export/:entity", async (req, res): Promise<void> => {
  const entity = req.params["entity"] as string;
  const table = EXPORT_MAP[entity];
  if (!table) { res.status(404).json({ error: "Unknown entity" }); return; }

  const rows = await db.select().from(table as typeof clientsTable);
  const csv = toCSV(rows.map(r => ({ ...r } as Record<string, unknown>)));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${entity}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

// ─── Bulk Delete ────────────────────────────────────────────────────────────
router.delete("/admin/bulk", async (req, res): Promise<void> => {
  const { entity, ids } = req.body as { entity: string; ids: number[] };
  if (!entity || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "entity and ids[] required" }); return;
  }
  const table = EXPORT_MAP[entity];
  if (!table) { res.status(404).json({ error: "Unknown entity" }); return; }

  let deleted = 0;
  for (const id of ids) {
    await (db.delete(table) as ReturnType<typeof db.delete>).where(eq((table as typeof clientsTable).id, id));
    deleted++;
  }

  await db.insert(activityTable).values({
    type: "bulk_delete",
    description: `Bulk deleted ${deleted} records from ${entity}`,
    clientName: null,
  });

  res.json({ success: true, deleted });
});

// ─── Settings ──────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = [
  { key: "company_name", value: "VA eBay Client Manager", label: "Company Name", group: "general" },
  { key: "admin_email", value: "admin@va.com", label: "Admin Email", group: "general" },
  { key: "default_currency", value: "USD", label: "Default Currency", group: "general" },
  { key: "invoice_prefix", value: "INV", label: "Invoice Number Prefix", group: "invoices" },
  { key: "overdue_days", value: "30", label: "Invoice Overdue After (days)", group: "invoices" },
  { key: "task_reminder_days", value: "3", label: "Task Reminder Before Due (days)", group: "tasks" },
  { key: "login_target_per_week", value: "5", label: "Default Login Target/Week", group: "logins" },
  { key: "card_expiry_warning_days", value: "60", label: "Card Expiry Warning (days)", group: "cards" },
  { key: "audit_retention_days", value: "90", label: "Audit Log Retention (days)", group: "admin" },
  { key: "allow_bulk_delete", value: "true", label: "Allow Bulk Delete", group: "admin" },
];

router.get("/admin/settings", async (_req, res): Promise<void> => {
  // Auto-seed defaults on first access
  for (const s of DEFAULT_SETTINGS) {
    await db.insert(settingsTable).values(s).onConflictDoNothing();
  }
  const rows = await db.select().from(settingsTable).orderBy(settingsTable.group, settingsTable.key);
  res.json(rows.map(serializeDates));
});

router.put("/admin/settings/:key", async (req, res): Promise<void> => {
  const key = req.params["key"];
  const { value } = req.body as { value: string };
  if (value === undefined) { res.status(400).json({ error: "value required" }); return; }

  const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  if (!existing) { res.status(404).json({ error: "Setting not found" }); return; }

  const [updated] = await db.update(settingsTable).set({ value }).where(eq(settingsTable.key, key)).returning();
  res.json(serializeDates(updated as unknown as Record<string, unknown>));
});

router.put("/admin/settings", async (req, res): Promise<void> => {
  const updates = req.body as Record<string, string>;
  const results: Record<string, string> = {};
  for (const [key, value] of Object.entries(updates)) {
    const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
    if (existing) {
      await db.update(settingsTable).set({ value: String(value) }).where(eq(settingsTable.key, key));
      results[key] = String(value);
    }
  }
  res.json({ success: true, updated: results });
});

// ─── Activity Feed ──────────────────────────────────────────────────────────
router.get("/admin/activity", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query["limit"] ?? 50), 200);
  const rows = await db.select().from(activityTable).orderBy(desc(activityTable.createdAt)).limit(limit);
  res.json(rows.map(serializeDates));
});

export default router;
