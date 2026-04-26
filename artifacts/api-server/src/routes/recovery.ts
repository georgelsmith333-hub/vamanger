import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, recoveryEntriesTable, clientsTable } from "@workspace/db";
import {
  CreateRecoveryEntryBody,
  UpdateRecoveryEntryBody,
  UpdateRecoveryEntryParams,
  DeleteRecoveryEntryParams,
  GetRecoveryEntriesResponse,
  UpdateRecoveryEntryResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router = Router();

function enrichEntry(e: typeof recoveryEntriesTable.$inferSelect, clients: { id: number; clientName: string }[]) {
  const client = clients.find((c) => c.id === e.clientId);
  return serializeDates({ ...e, clientName: client?.clientName ?? "Unknown" });
}

router.get("/recovery", async (_req, res): Promise<void> => {
  const entries = await db.select().from(recoveryEntriesTable).orderBy(recoveryEntriesTable.createdAt);
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(GetRecoveryEntriesResponse.parse(entries.map((e) => enrichEntry(e, clients))));
});

router.post("/recovery", async (req, res): Promise<void> => {
  const parsed = CreateRecoveryEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [entry] = await db.insert(recoveryEntriesTable).values(parsed.data).returning();
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.status(201).json(enrichEntry(entry, clients));
});

router.patch("/recovery/:id", async (req, res): Promise<void> => {
  const params = UpdateRecoveryEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateRecoveryEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updateData[k] = v;
  }
  const [entry] = await db.update(recoveryEntriesTable).set(updateData).where(eq(recoveryEntriesTable.id, params.data.id)).returning();
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(UpdateRecoveryEntryResponse.parse(enrichEntry(entry, clients)));
});

router.delete("/recovery/:id", async (req, res): Promise<void> => {
  const params = DeleteRecoveryEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(recoveryEntriesTable).where(eq(recoveryEntriesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
