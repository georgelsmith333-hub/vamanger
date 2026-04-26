import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, wiseCardsTable, clientsTable } from "@workspace/db";
import {
  CreateWiseCardBody,
  UpdateWiseCardBody,
  UpdateWiseCardParams,
  DeleteWiseCardParams,
  GetWiseCardsQueryParams,
  GetWiseCardsResponse,
  UpdateWiseCardResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router = Router();

function daysToExpiry(expiryMonth: number | null, expiryYear: number | null): number | null {
  if (!expiryMonth || !expiryYear) return null;
  const expiry = new Date(expiryYear, expiryMonth - 1, 1);
  expiry.setMonth(expiry.getMonth() + 1);
  expiry.setDate(expiry.getDate() - 1);
  return Math.floor((expiry.getTime() - Date.now()) / 86400000);
}

function enrichCard(card: typeof wiseCardsTable.$inferSelect, clients: { id: number; clientName: string }[]) {
  const client = clients.find((c) => c.id === card.clientId);
  return serializeDates({
    ...card,
    clientName: client?.clientName ?? "Unknown",
    balance: card.balance != null ? Number(card.balance) : null,
    daysToExpiry: daysToExpiry(card.expiryMonth, card.expiryYear),
  });
}

router.get("/wise-cards", async (req, res): Promise<void> => {
  const qp = GetWiseCardsQueryParams.safeParse(req.query);
  const cards = qp.success && qp.data.clientId
    ? await db.select().from(wiseCardsTable).where(eq(wiseCardsTable.clientId, qp.data.clientId))
    : await db.select().from(wiseCardsTable);
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(GetWiseCardsResponse.parse(cards.map((c) => enrichCard(c, clients))));
});

router.post("/wise-cards", async (req, res): Promise<void> => {
  const parsed = CreateWiseCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [card] = await db.insert(wiseCardsTable).values(parsed.data).returning();
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.status(201).json(enrichCard(card, clients));
});

router.patch("/wise-cards/:id", async (req, res): Promise<void> => {
  const params = UpdateWiseCardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateWiseCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updateData[k] = v;
  }
  const [card] = await db.update(wiseCardsTable).set(updateData).where(eq(wiseCardsTable.id, params.data.id)).returning();
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(UpdateWiseCardResponse.parse(enrichCard(card, clients)));
});

router.delete("/wise-cards/:id", async (req, res): Promise<void> => {
  const params = DeleteWiseCardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(wiseCardsTable).where(eq(wiseCardsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
