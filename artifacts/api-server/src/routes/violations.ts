import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, violationsTable, clientsTable } from "@workspace/db";
import {
  CreateViolationBody,
  UpdateViolationBody,
  UpdateViolationParams,
  DeleteViolationParams,
  GetViolationsResponse,
  UpdateViolationResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router = Router();

function enrichViolation(v: typeof violationsTable.$inferSelect, clients: { id: number; clientName: string }[]) {
  const client = clients.find((c) => c.id === v.clientId);
  return serializeDates({ ...v, clientName: client?.clientName ?? "Unknown" });
}

router.get("/violations", async (_req, res): Promise<void> => {
  const violations = await db.select().from(violationsTable).orderBy(violationsTable.createdAt);
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(GetViolationsResponse.parse(violations.map((v) => enrichViolation(v, clients))));
});

router.post("/violations", async (req, res): Promise<void> => {
  const parsed = CreateViolationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [violation] = await db.insert(violationsTable).values(parsed.data).returning();
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.status(201).json(enrichViolation(violation, clients));
});

router.patch("/violations/:id", async (req, res): Promise<void> => {
  const params = UpdateViolationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateViolationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updateData[k] = v;
  }
  const [violation] = await db.update(violationsTable).set(updateData).where(eq(violationsTable.id, params.data.id)).returning();
  if (!violation) {
    res.status(404).json({ error: "Violation not found" });
    return;
  }
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(UpdateViolationResponse.parse(enrichViolation(violation, clients)));
});

router.delete("/violations/:id", async (req, res): Promise<void> => {
  const params = DeleteViolationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(violationsTable).where(eq(violationsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
