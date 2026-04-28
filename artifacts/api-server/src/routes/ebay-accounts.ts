import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, ebayAccountsTable, clientsTable, activityTable } from "@workspace/db";
import {
  CreateEbayAccountBody,
  UpdateEbayAccountBody,
  GetEbayAccountParams,
  UpdateEbayAccountParams,
  DeleteEbayAccountParams,
  GetEbayAccountsQueryParams,
  GetEbayAccountsResponse,
  GetEbayAccountResponse,
  UpdateEbayAccountResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";
import { coerceNumeric } from "../lib/coerce";

const NUMERIC_KEYS = ["sellingLimit"] as const;
const router = Router();

function enrichAccount(account: typeof ebayAccountsTable.$inferSelect, clients: { id: number; clientName: string }[]) {
  const client = clients.find((c) => c.id === account.clientId);
  return serializeDates({
    ...account,
    clientName: client?.clientName ?? "Unknown",
    feedbackScore: account.feedbackScore ?? null,
    sellingLimit: account.sellingLimit != null ? Number(account.sellingLimit) : null,
    pwdExpiresIn: account.pwdExpiresIn ?? null,
  });
}

router.get("/ebay-accounts", async (req, res): Promise<void> => {
  const qp = GetEbayAccountsQueryParams.safeParse(req.query);
  const accounts = qp.success && qp.data.clientId
    ? await db.select().from(ebayAccountsTable).where(eq(ebayAccountsTable.clientId, qp.data.clientId))
    : await db.select().from(ebayAccountsTable);
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(GetEbayAccountsResponse.parse(accounts.map((a) => enrichAccount(a, clients))));
});

router.post("/ebay-accounts", async (req, res): Promise<void> => {
  const parsed = CreateEbayAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [account] = await db.insert(ebayAccountsTable).values(coerceNumeric(parsed.data, NUMERIC_KEYS) as unknown as typeof ebayAccountsTable.$inferInsert).returning();
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  await db.insert(activityTable).values({
    type: "ebay_account_added",
    description: `eBay account added: ${account.ebayUsername}`,
    clientName: clients.find((c) => c.id === account.clientId)?.clientName ?? null,
  });
  res.status(201).json(GetEbayAccountResponse.parse(enrichAccount(account, clients)));
});

router.get("/ebay-accounts/:id", async (req, res): Promise<void> => {
  const params = GetEbayAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [account] = await db.select().from(ebayAccountsTable).where(eq(ebayAccountsTable.id, params.data.id));
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(GetEbayAccountResponse.parse(enrichAccount(account, clients)));
});

router.patch("/ebay-accounts/:id", async (req, res): Promise<void> => {
  const params = UpdateEbayAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEbayAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  const coerced = coerceNumeric(parsed.data, NUMERIC_KEYS);
  for (const [k, v] of Object.entries(coerced)) {
    if (v !== undefined) updateData[k] = v;
  }
  const [account] = await db.update(ebayAccountsTable).set(updateData).where(eq(ebayAccountsTable.id, params.data.id)).returning();
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(UpdateEbayAccountResponse.parse(enrichAccount(account, clients)));
});

router.delete("/ebay-accounts/:id", async (req, res): Promise<void> => {
  const params = DeleteEbayAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(ebayAccountsTable).where(eq(ebayAccountsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
