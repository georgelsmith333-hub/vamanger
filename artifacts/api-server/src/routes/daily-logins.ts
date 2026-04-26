import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, dailyLoginsTable, clientsTable } from "@workspace/db";
import {
  CreateDailyLoginBody,
  UpdateDailyLoginBody,
  UpdateDailyLoginParams,
  GetDailyLoginsQueryParams,
  GetDailyLoginsResponse,
  UpdateDailyLoginResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router = Router();

function calcAdherence(loginDays: number[], year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  return daysInMonth > 0 ? loginDays.length / daysInMonth : 0;
}

function parseLoginDays(raw: string): number[] {
  try { return JSON.parse(raw) as number[]; } catch { return []; }
}

function enrichLogin(d: typeof dailyLoginsTable.$inferSelect, clients: { id: number; clientName: string }[]) {
  const client = clients.find((c) => c.id === d.clientId);
  const loginDays = parseLoginDays(d.loginDays);
  return serializeDates({
    ...d,
    clientName: client?.clientName ?? "Unknown",
    loginDays,
    doneThisMonth: loginDays.length,
    adherencePct: calcAdherence(loginDays, d.year, d.month),
  });
}

router.get("/daily-logins", async (req, res): Promise<void> => {
  const qp = GetDailyLoginsQueryParams.safeParse(req.query);
  let records = await db.select().from(dailyLoginsTable).orderBy(dailyLoginsTable.year, dailyLoginsTable.month);
  if (qp.success) {
    if (qp.data.year) records = records.filter((r) => r.year === qp.data.year);
    if (qp.data.month) records = records.filter((r) => r.month === qp.data.month);
  }
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(GetDailyLoginsResponse.parse(records.map((r) => enrichLogin(r, clients))));
});

router.post("/daily-logins", async (req, res): Promise<void> => {
  const parsed = CreateDailyLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const loginDaysJson = JSON.stringify(parsed.data.loginDays);
  const [record] = await db.insert(dailyLoginsTable).values({ ...parsed.data, loginDays: loginDaysJson }).returning();
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.status(201).json(enrichLogin(record, clients));
});

router.patch("/daily-logins/:id", async (req, res): Promise<void> => {
  const params = UpdateDailyLoginParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDailyLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.targetPerWeek !== undefined) updateData.targetPerWeek = parsed.data.targetPerWeek;
  if (parsed.data.loginDays !== undefined) updateData.loginDays = JSON.stringify(parsed.data.loginDays);
  const [record] = await db.update(dailyLoginsTable).set(updateData).where(eq(dailyLoginsTable.id, params.data.id)).returning();
  if (!record) {
    res.status(404).json({ error: "Record not found" });
    return;
  }
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(UpdateDailyLoginResponse.parse(enrichLogin(record, clients)));
});

export default router;
