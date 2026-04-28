import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, earningsTable, clientsTable } from "@workspace/db";
import { coerceNumeric } from "../lib/coerce";
import {
  CreateEarningBody,
  UpdateEarningBody,
  UpdateEarningParams,
  DeleteEarningParams,
  GetEarningsResponse,
  UpdateEarningResponse,
  GetEarningsSummaryResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router = Router();

function enrichEarning(e: typeof earningsTable.$inferSelect, clients: { id: number; clientName: string }[]) {
  const client = clients.find((c) => c.id === e.clientId);
  return serializeDates({ ...e, clientName: client?.clientName ?? "Unknown", amount: Number(e.amount) });
}

router.get("/earnings", async (_req, res): Promise<void> => {
  const earnings = await db.select().from(earningsTable).orderBy(earningsTable.year, earningsTable.month);
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(GetEarningsResponse.parse(earnings.map((e) => enrichEarning(e, clients))));
});

router.get("/earnings/summary", async (_req, res): Promise<void> => {
  const earnings = await db.select().from(earningsTable);
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);

  const byClientMap = new Map<number, { clientId: number; clientName: string; ytdTotal: number; monthlyData: { month: number; amount: number }[] }>();
  for (const e of earnings) {
    if (!byClientMap.has(e.clientId)) {
      const client = clients.find((c) => c.id === e.clientId);
      byClientMap.set(e.clientId, { clientId: e.clientId, clientName: client?.clientName ?? "Unknown", ytdTotal: 0, monthlyData: [] });
    }
    const entry = byClientMap.get(e.clientId)!;
    entry.ytdTotal += Number(e.amount);
    entry.monthlyData.push({ month: e.month, amount: Number(e.amount) });
  }

  const byClient = Array.from(byClientMap.values());
  const totalYtd = byClient.reduce((s, c) => s + c.ytdTotal, 0);
  res.json(GetEarningsSummaryResponse.parse({ byClient, totalYtd }));
});

router.post("/earnings", async (req, res): Promise<void> => {
  const parsed = CreateEarningBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [earning] = await db.insert(earningsTable).values(coerceNumeric(parsed.data, ["amount"] as const) as unknown as typeof earningsTable.$inferInsert).returning();
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.status(201).json(enrichEarning(earning, clients));
});

router.patch("/earnings/:id", async (req, res): Promise<void> => {
  const params = UpdateEarningParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEarningBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  const coerced = coerceNumeric(parsed.data, ["amount"] as const);
  for (const [k, v] of Object.entries(coerced)) {
    if (v !== undefined) updateData[k] = v;
  }
  const [earning] = await db.update(earningsTable).set(updateData).where(eq(earningsTable.id, params.data.id)).returning();
  if (!earning) {
    res.status(404).json({ error: "Earning not found" });
    return;
  }
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(UpdateEarningResponse.parse(enrichEarning(earning, clients)));
});

router.delete("/earnings/:id", async (req, res): Promise<void> => {
  const params = DeleteEarningParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(earningsTable).where(eq(earningsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
