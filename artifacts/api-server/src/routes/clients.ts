import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, clientsTable, activityTable, ebayAccountsTable } from "@workspace/db";
import { coerceNumeric } from "../lib/coerce";

const NUMERIC_KEYS = ["hourlyRate", "totalSales"] as const;
import {
  CreateClientBody,
  UpdateClientBody,
  GetClientParams,
  UpdateClientParams,
  DeleteClientParams,
  GetClientsResponse,
  GetClientResponse,
  UpdateClientResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";
import { logAudit } from "../lib/audit";

const router = Router();

function toClient(c: typeof clientsTable.$inferSelect, ebayCount: number) {
  return serializeDates({
    ...c,
    hourlyRate: c.hourlyRate != null ? Number(c.hourlyRate) : null,
    totalSales: c.totalSales != null ? Number(c.totalSales) : null,
    ebayAccountsCount: ebayCount,
  });
}

router.get("/clients", async (_req, res): Promise<void> => {
  const clients = await db.select().from(clientsTable).orderBy(clientsTable.clientName);
  const accounts = await db.select().from(ebayAccountsTable);
  const result = clients.map((c) => {
    const count = accounts.filter((a) => a.clientId === c.id).length;
    return toClient(c, count);
  });
  res.json(GetClientsResponse.parse(result));
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [client] = await db.insert(clientsTable).values(coerceNumeric(parsed.data, NUMERIC_KEYS) as unknown as typeof clientsTable.$inferInsert).returning();
  await db.insert(activityTable).values({
    type: "client_created",
    description: `New client added: ${client.clientName}`,
    clientName: client.clientName,
  });
  await logAudit({
    action: "CREATE",
    tableName: "clients",
    recordId: client.id,
    description: `Client created: ${client.clientName}`,
    previousData: null,
    newData: { ...client } as Record<string, unknown>,
  });
  res.status(201).json(GetClientResponse.parse(toClient(client, 0)));
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const accounts = await db.select().from(ebayAccountsTable).where(eq(ebayAccountsTable.clientId, client.id));
  res.json(GetClientResponse.parse(toClient(client, accounts.length)));
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // Capture previous state for undo
  const [before] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  const updateData: Record<string, unknown> = {};
  const coerced = coerceNumeric(parsed.data, NUMERIC_KEYS);
  for (const [k, v] of Object.entries(coerced)) {
    if (v !== undefined) updateData[k] = v;
  }
  const [client] = await db.update(clientsTable).set(updateData).where(eq(clientsTable.id, params.data.id)).returning();
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  await logAudit({
    action: "UPDATE",
    tableName: "clients",
    recordId: client.id,
    description: `Client updated: ${client.clientName}`,
    previousData: before ? ({ ...before } as Record<string, unknown>) : null,
    newData: { ...client } as Record<string, unknown>,
  });
  const accounts = await db.select().from(ebayAccountsTable).where(eq(ebayAccountsTable.clientId, client.id));
  res.json(UpdateClientResponse.parse(toClient(client, accounts.length)));
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [before] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  await db.delete(clientsTable).where(eq(clientsTable.id, params.data.id));
  if (before) {
    await logAudit({
      action: "DELETE",
      tableName: "clients",
      recordId: params.data.id,
      description: `Client deleted: ${before.clientName}`,
      previousData: { ...before } as Record<string, unknown>,
      newData: null,
    });
    await db.insert(activityTable).values({
      type: "client_deleted",
      description: `Client removed: ${before.clientName}`,
      clientName: before.clientName,
    });
  }
  res.sendStatus(204);
});

export default router;
