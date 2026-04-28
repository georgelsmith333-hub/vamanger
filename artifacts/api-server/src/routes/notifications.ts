import { Router } from "express";
import { db, notificationsTable, notificationRulesTable } from "@workspace/db";
import { eq, desc, isNull } from "drizzle-orm";
import { serializeDates } from "../lib/serialize";

const router = Router();

const DEFAULT_RULES = [
  { eventType: "OVERDUE_INVOICE", label: "Overdue Invoice" },
  { eventType: "NEW_VIOLATION", label: "New Violation" },
  { eventType: "ACCOUNT_RESTRICTION", label: "Account Restriction" },
  { eventType: "TASK_DUE", label: "Task Due Soon" },
  { eventType: "CLIENT_INACTIVE", label: "Client Inactive" },
  { eventType: "CARD_EXPIRY", label: "Card Expiring Soon" },
  { eventType: "LOW_BALANCE", label: "Low Balance Warning" },
  { eventType: "DAILY_SUMMARY", label: "Daily Summary" },
];

router.get("/notifications", async (_req, res): Promise<void> => {
  const rows = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt)).limit(50);
  res.json(rows.map(serializeDates));
});

router.get("/notifications/unread-count", async (_req, res): Promise<void> => {
  const rows = await db.select().from(notificationsTable).where(isNull(notificationsTable.readAt));
  res.json({ count: rows.length });
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  await db.update(notificationsTable).set({ readAt: new Date() }).where(eq(notificationsTable.id, id));
  res.json({ success: true });
});

router.post("/notifications/read-all", async (_req, res): Promise<void> => {
  await db.update(notificationsTable).set({ readAt: new Date() }).where(isNull(notificationsTable.readAt));
  res.json({ success: true });
});

router.post("/notifications", async (req, res): Promise<void> => {
  const { type, title, message, severity = "info", entityType, entityId } = req.body;
  if (!type || !title || !message) { res.status(400).json({ error: "type, title, message required" }); return; }
  const [row] = await db.insert(notificationsTable).values({ type, title, message, severity, entityType, entityId }).returning();
  res.status(201).json(serializeDates(row));
});

router.delete("/notifications/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
  res.status(204).send();
});

router.get("/notification-rules", async (_req, res): Promise<void> => {
  let rules = await db.select().from(notificationRulesTable);
  if (rules.length === 0) {
    const inserted = await db.insert(notificationRulesTable).values(DEFAULT_RULES).returning();
    rules = inserted;
  }
  res.json(rules.map(serializeDates));
});

router.put("/notification-rules/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { enabled, channels, emailRecipients } = req.body;
  const [row] = await db.update(notificationRulesTable).set({ enabled, channels, emailRecipients }).where(eq(notificationRulesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Rule not found" }); return; }
  res.json(serializeDates(row));
});

export default router;
