import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, bankAccountsTable, clientsTable } from "@workspace/db";
import {
  CreateBankAccountBody,
  UpdateBankAccountBody,
  UpdateBankAccountParams,
  DeleteBankAccountParams,
  GetBankAccountsResponse,
  UpdateBankAccountResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router = Router();

function enrichBank(account: typeof bankAccountsTable.$inferSelect, clients: { id: number; clientName: string }[]) {
  const client = clients.find((c) => c.id === account.clientId);
  return serializeDates({ ...account, clientName: client?.clientName ?? "Unknown" });
}

router.get("/bank-accounts", async (_req, res): Promise<void> => {
  const accounts = await db.select().from(bankAccountsTable);
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(GetBankAccountsResponse.parse(accounts.map((a) => enrichBank(a, clients))));
});

router.post("/bank-accounts", async (req, res): Promise<void> => {
  const parsed = CreateBankAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [account] = await db.insert(bankAccountsTable).values(parsed.data).returning();
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.status(201).json(enrichBank(account, clients));
});

router.patch("/bank-accounts/:id", async (req, res): Promise<void> => {
  const params = UpdateBankAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBankAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updateData[k] = v;
  }
  const [account] = await db.update(bankAccountsTable).set(updateData).where(eq(bankAccountsTable.id, params.data.id)).returning();
  if (!account) {
    res.status(404).json({ error: "Bank account not found" });
    return;
  }
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(UpdateBankAccountResponse.parse(enrichBank(account, clients)));
});

router.delete("/bank-accounts/:id", async (req, res): Promise<void> => {
  const params = DeleteBankAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(bankAccountsTable).where(eq(bankAccountsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
