import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, invoicesTable, clientsTable, activityTable } from "@workspace/db";
import {
  CreateInvoiceBody,
  UpdateInvoiceBody,
  UpdateInvoiceParams,
  DeleteInvoiceParams,
  GetInvoicesResponse,
  UpdateInvoiceResponse,
  GetInvoicesSummaryResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";
import { logAudit } from "../lib/audit";

const router = Router();

function calcDaysOverdue(dueDate: string | null, status: string): number | null {
  if (!dueDate || status === "Paid") return null;
  const due = new Date(dueDate);
  const diff = Math.floor((Date.now() - due.getTime()) / 86400000);
  return diff > 0 ? diff : null;
}

function enrichInvoice(inv: typeof invoicesTable.$inferSelect, clients: { id: number; clientName: string }[]) {
  const client = clients.find((c) => c.id === inv.clientId);
  return serializeDates({
    ...inv,
    clientName: client?.clientName ?? "Unknown",
    amount: Number(inv.amount),
    hours: inv.hours != null ? Number(inv.hours) : null,
    rate: inv.rate != null ? Number(inv.rate) : null,
    daysOverdue: calcDaysOverdue(inv.dueDate, inv.status),
  });
}

router.get("/invoices", async (_req, res): Promise<void> => {
  const invoices = await db.select().from(invoicesTable).orderBy(invoicesTable.createdAt);
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  res.json(GetInvoicesResponse.parse(invoices.map((i) => enrichInvoice(i, clients))));
});

router.get("/invoices/summary", async (_req, res): Promise<void> => {
  const invoices = await db.select().from(invoicesTable);
  const totalBilled = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + Number(i.amount), 0);
  const overdueInvs = invoices.filter((i) => i.status === "Overdue");
  const totalOverdue = overdueInvs.reduce((s, i) => s + Number(i.amount), 0);
  const pendingInvs = invoices.filter((i) => ["Sent", "Draft"].includes(i.status));
  const totalPending = pendingInvs.reduce((s, i) => s + Number(i.amount), 0);
  res.json(GetInvoicesSummaryResponse.parse({ totalBilled, totalPaid, totalOverdue, totalPending, overdueCount: overdueInvs.length }));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [invoice] = await db.insert(invoicesTable).values(parsed.data).returning();
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  const clientName = clients.find((c) => c.id === invoice.clientId)?.clientName ?? "Unknown";
  await db.insert(activityTable).values({
    type: "invoice_created",
    description: `Invoice ${invoice.invoiceNumber} created for $${Number(invoice.amount).toFixed(2)}`,
    clientName,
  });
  await logAudit({
    action: "CREATE",
    tableName: "invoices",
    recordId: invoice.id,
    description: `Invoice ${invoice.invoiceNumber} created for ${clientName} — $${Number(invoice.amount).toFixed(2)}`,
    previousData: null,
    newData: { ...invoice } as Record<string, unknown>,
  });
  res.status(201).json(enrichInvoice(invoice, clients));
});

router.patch("/invoices/:id", async (req, res): Promise<void> => {
  const params = UpdateInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [before] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id));
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updateData[k] = v;
  }
  const [invoice] = await db.update(invoicesTable).set(updateData).where(eq(invoicesTable.id, params.data.id)).returning();
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const clients = await db.select({ id: clientsTable.id, clientName: clientsTable.clientName }).from(clientsTable);
  const clientName = clients.find((c) => c.id === invoice.clientId)?.clientName ?? "Unknown";
  if (invoice.status === "Paid") {
    await db.insert(activityTable).values({
      type: "invoice_paid",
      description: `Invoice ${invoice.invoiceNumber} marked as paid`,
      clientName,
    });
  }
  await logAudit({
    action: "UPDATE",
    tableName: "invoices",
    recordId: invoice.id,
    description: `Invoice ${invoice.invoiceNumber} updated (status: ${invoice.status})`,
    previousData: before ? ({ ...before } as Record<string, unknown>) : null,
    newData: { ...invoice } as Record<string, unknown>,
  });
  res.json(UpdateInvoiceResponse.parse(enrichInvoice(invoice, clients)));
});

router.delete("/invoices/:id", async (req, res): Promise<void> => {
  const params = DeleteInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [before] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id));
  await db.delete(invoicesTable).where(eq(invoicesTable.id, params.data.id));
  if (before) {
    await logAudit({
      action: "DELETE",
      tableName: "invoices",
      recordId: params.data.id,
      description: `Invoice ${before.invoiceNumber} deleted ($${Number(before.amount).toFixed(2)})`,
      previousData: { ...before } as Record<string, unknown>,
      newData: null,
    });
  }
  res.sendStatus(204);
});

export default router;
