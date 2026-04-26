import { Router } from "express";
import { db, clientsTable, ebayAccountsTable, wiseCardsTable, invoicesTable, tasksTable, violationsTable, expensesTable, earningsTable, activityTable } from "@workspace/db";
import { GetDashboardSummaryResponse, GetDashboardRecentActivityResponse } from "@workspace/api-zod";

const router = Router();

function daysToExpiry(expiryMonth: number | null, expiryYear: number | null): number | null {
  if (!expiryMonth || !expiryYear) return null;
  const expiry = new Date(expiryYear, expiryMonth - 1, 1);
  expiry.setMonth(expiry.getMonth() + 1);
  expiry.setDate(expiry.getDate() - 1);
  return Math.floor((expiry.getTime() - Date.now()) / 86400000);
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [clients, accounts, cards, invoices, tasks, violations, expenses, earnings] = await Promise.all([
    db.select().from(clientsTable),
    db.select().from(ebayAccountsTable),
    db.select().from(wiseCardsTable),
    db.select().from(invoicesTable),
    db.select().from(tasksTable),
    db.select().from(violationsTable),
    db.select().from(expensesTable),
    db.select().from(earningsTable),
  ]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "Active").length;
  const totalEbayAccounts = accounts.length;
  const accountsWithIssues = accounts.filter((a) => a.mcRestriction || ["Below Standard", "Restricted", "Suspended"].includes(a.accountHealth ?? "")).length;

  const overdueInvoices = invoices.filter((i) => i.status === "Overdue");
  const overdueInvoicesCount = overdueInvoices.length;
  const overdueInvoicesAmount = overdueInvoices.reduce((s, i) => s + Number(i.amount), 0);

  const pendingTasks = tasks.filter((t) => !t.done && t.status !== "Done");
  const pendingTasksCount = pendingTasks.length;
  const overdueTasks = pendingTasks.filter((t) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < now;
  });
  const overdueTasksCount = overdueTasks.length;

  const expiringCards = cards.filter((c) => {
    const days = daysToExpiry(c.expiryMonth, c.expiryYear);
    return days !== null && days <= 60;
  });
  const expiringCardsCount = expiringCards.length;
  const openViolationsCount = violations.filter((v) => !v.resolved).length;

  const thisMonthEarnings = earnings.filter((e) => e.year === currentYear && e.month === currentMonth);
  const totalRevenueThisMonth = thisMonthEarnings.reduce((s, e) => s + Number(e.amount), 0);
  const thisMonthExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
  });
  const totalExpensesThisMonth = thisMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfitThisMonth = totalRevenueThisMonth - totalExpensesThisMonth;

  res.json(GetDashboardSummaryResponse.parse({
    totalClients, activeClients, totalEbayAccounts, accountsWithIssues,
    overdueInvoicesCount, overdueInvoicesAmount,
    pendingTasksCount, overdueTasksCount,
    expiringCardsCount, openViolationsCount,
    totalRevenueThisMonth, totalExpensesThisMonth, netProfitThisMonth,
  }));
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const activity = await db.select().from(activityTable).orderBy(activityTable.createdAt).limit(20);
  const result = activity.reverse().map((a) => ({
    id: a.id,
    type: a.type,
    description: a.description,
    clientName: a.clientName ?? null,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
  }));
  res.json(GetDashboardRecentActivityResponse.parse(result));
});

export default router;
