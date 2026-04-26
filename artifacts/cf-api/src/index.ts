import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt, sign } from 'hono/jwt';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import * as schema from './schema';

export type Env = {
  DB: D1Database;
  KV: KVNamespace;
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
  GOOGLE_SHEET_ID?: string;
  GOOGLE_SERVICE_ACCOUNT_KEY?: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use('*', cors({
  origin: ['https://va-manager.pages.dev', 'http://localhost:5173', 'http://localhost:4173'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

function db(env: Env) {
  return drizzle(env.DB, { schema });
}

async function auditLog(env: Env, action: string, tableName: string, recordId: number | null, description: string, prev?: unknown, next?: unknown) {
  const d = db(env);
  await d.insert(schema.auditLogTable).values({
    action,
    tableName,
    recordId,
    description,
    previousData: prev ? JSON.stringify(prev) : null,
    newData: next ? JSON.stringify(next) : null,
    performedBy: 'admin',
  });
  await d.insert(schema.activityTable).values({
    type: action,
    description,
  });
}

const jwtSecret = (env: Env) => env.JWT_SECRET ?? 'va-manager-jwt-secret-change-me';

app.get('/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));

app.post('/admin/auth', async (c) => {
  const { password } = await c.req.json();
  const expected = c.env.ADMIN_PASSWORD ?? 'admin123';
  if (password !== expected) return c.json({ error: 'Invalid password' }, 401);
  const token = await sign({ admin: true, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 30 }, jwtSecret(c.env));
  return c.json({ token, ok: true });
});

const adminAuth = jwt({ secret: (c) => jwtSecret(c.env as Env) });

app.get('/dashboard', async (c) => {
  const d = db(c.env);
  const [clients, accounts, invoices, tasks, violations, expenses, earnings] = await Promise.all([
    d.select({ id: schema.clientsTable.id, status: schema.clientsTable.status }).from(schema.clientsTable),
    d.select({ id: schema.ebayAccountsTable.id, accountHealth: schema.ebayAccountsTable.accountHealth, mcRestriction: schema.ebayAccountsTable.mcRestriction }).from(schema.ebayAccountsTable),
    d.select({ id: schema.invoicesTable.id, amount: schema.invoicesTable.amount, status: schema.invoicesTable.status }).from(schema.invoicesTable),
    d.select({ id: schema.tasksTable.id, done: schema.tasksTable.done, priority: schema.tasksTable.priority, dueDate: schema.tasksTable.dueDate }).from(schema.tasksTable),
    d.select({ id: schema.violationsTable.id, resolved: schema.violationsTable.resolved, severity: schema.violationsTable.severity }).from(schema.violationsTable),
    d.select({ id: schema.expensesTable.id, amount: schema.expensesTable.amount }).from(schema.expensesTable),
    d.select({ id: schema.earningsTable.id, amount: schema.earningsTable.amount }).from(schema.earningsTable),
  ]);
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.amount ?? 0), 0);
  const pendingInvoices = invoices.filter(i => ['Draft', 'Sent'].includes(i.status ?? '')).length;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const overdueTasks = tasks.filter(t => !t.done && t.dueDate && new Date(t.dueDate) < new Date()).length;
  return c.json({
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'Active').length,
    totalAccounts: accounts.length,
    accountsWithMcRestriction: accounts.filter(a => a.mcRestriction).length,
    totalRevenue,
    pendingInvoices,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    openTasks: tasks.filter(t => !t.done).length,
    overdueTasks,
    openViolations: violations.filter(v => !v.resolved).length,
    criticalViolations: violations.filter(v => !v.resolved && v.severity === 'High').length,
    totalEarnings: earnings.reduce((s, e) => s + (e.amount ?? 0), 0),
  });
});

app.get('/clients', async (c) => {
  const d = db(c.env);
  const rows = await d.select().from(schema.clientsTable).orderBy(desc(schema.clientsTable.createdAt));
  return c.json(rows);
});
app.post('/clients', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.insert(schema.clientsTable).values(body).returning();
  await auditLog(c.env, 'CREATE', 'clients', row.id, `Created client: ${row.clientName}`, null, row);
  return c.json(row, 201);
});
app.get('/clients/:id', async (c) => {
  const d = db(c.env);
  const row = await d.select().from(schema.clientsTable).where(eq(schema.clientsTable.id, +c.req.param('id'))).get();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});
app.put('/clients/:id', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const prev = await d.select().from(schema.clientsTable).where(eq(schema.clientsTable.id, +c.req.param('id'))).get();
  const [row] = await d.update(schema.clientsTable).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.clientsTable.id, +c.req.param('id'))).returning();
  await auditLog(c.env, 'UPDATE', 'clients', row.id, `Updated client: ${row.clientName}`, prev, row);
  return c.json(row);
});
app.delete('/clients/:id', async (c) => {
  const d = db(c.env);
  const prev = await d.select().from(schema.clientsTable).where(eq(schema.clientsTable.id, +c.req.param('id'))).get();
  await d.delete(schema.clientsTable).where(eq(schema.clientsTable.id, +c.req.param('id')));
  await auditLog(c.env, 'DELETE', 'clients', +c.req.param('id'), `Deleted client: ${prev?.clientName}`, prev, null);
  return c.json({ ok: true });
});

app.get('/ebay-accounts', async (c) => {
  const d = db(c.env);
  const rows = await d.select().from(schema.ebayAccountsTable).orderBy(desc(schema.ebayAccountsTable.createdAt));
  return c.json(rows);
});
app.post('/ebay-accounts', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.insert(schema.ebayAccountsTable).values(body).returning();
  await auditLog(c.env, 'CREATE', 'ebay_accounts', row.id, `Created eBay account: ${row.ebayUsername}`, null, row);
  return c.json(row, 201);
});
app.put('/ebay-accounts/:id', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const prev = await d.select().from(schema.ebayAccountsTable).where(eq(schema.ebayAccountsTable.id, +c.req.param('id'))).get();
  const [row] = await d.update(schema.ebayAccountsTable).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.ebayAccountsTable.id, +c.req.param('id'))).returning();
  await auditLog(c.env, 'UPDATE', 'ebay_accounts', row.id, `Updated eBay account: ${row.ebayUsername}`, prev, row);
  return c.json(row);
});
app.delete('/ebay-accounts/:id', async (c) => {
  const d = db(c.env);
  const prev = await d.select().from(schema.ebayAccountsTable).where(eq(schema.ebayAccountsTable.id, +c.req.param('id'))).get();
  await d.delete(schema.ebayAccountsTable).where(eq(schema.ebayAccountsTable.id, +c.req.param('id')));
  await auditLog(c.env, 'DELETE', 'ebay_accounts', +c.req.param('id'), `Deleted eBay account: ${prev?.ebayUsername}`, prev, null);
  return c.json({ ok: true });
});

app.get('/wise-cards', async (c) => {
  const d = db(c.env);
  return c.json(await d.select().from(schema.wiseCardsTable).orderBy(desc(schema.wiseCardsTable.createdAt)));
});
app.post('/wise-cards', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.insert(schema.wiseCardsTable).values(body).returning();
  await auditLog(c.env, 'CREATE', 'wise_cards', row.id, `Created Wise card: ${row.cardCode}`, null, row);
  return c.json(row, 201);
});
app.put('/wise-cards/:id', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const prev = await d.select().from(schema.wiseCardsTable).where(eq(schema.wiseCardsTable.id, +c.req.param('id'))).get();
  const [row] = await d.update(schema.wiseCardsTable).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.wiseCardsTable.id, +c.req.param('id'))).returning();
  await auditLog(c.env, 'UPDATE', 'wise_cards', row.id, `Updated Wise card: ${row.cardCode}`, prev, row);
  return c.json(row);
});
app.delete('/wise-cards/:id', async (c) => {
  const d = db(c.env);
  const prev = await d.select().from(schema.wiseCardsTable).where(eq(schema.wiseCardsTable.id, +c.req.param('id'))).get();
  await d.delete(schema.wiseCardsTable).where(eq(schema.wiseCardsTable.id, +c.req.param('id')));
  await auditLog(c.env, 'DELETE', 'wise_cards', +c.req.param('id'), `Deleted Wise card: ${prev?.cardCode}`, prev, null);
  return c.json({ ok: true });
});

app.get('/bank-accounts', async (c) => {
  const d = db(c.env);
  return c.json(await d.select().from(schema.bankAccountsTable).orderBy(desc(schema.bankAccountsTable.createdAt)));
});
app.post('/bank-accounts', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.insert(schema.bankAccountsTable).values(body).returning();
  await auditLog(c.env, 'CREATE', 'bank_accounts', row.id, `Created bank account: ${row.bankCode}`, null, row);
  return c.json(row, 201);
});
app.put('/bank-accounts/:id', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const prev = await d.select().from(schema.bankAccountsTable).where(eq(schema.bankAccountsTable.id, +c.req.param('id'))).get();
  const [row] = await d.update(schema.bankAccountsTable).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.bankAccountsTable.id, +c.req.param('id'))).returning();
  await auditLog(c.env, 'UPDATE', 'bank_accounts', row.id, `Updated bank account: ${row.bankCode}`, prev, row);
  return c.json(row);
});
app.delete('/bank-accounts/:id', async (c) => {
  const d = db(c.env);
  const prev = await d.select().from(schema.bankAccountsTable).where(eq(schema.bankAccountsTable.id, +c.req.param('id'))).get();
  await d.delete(schema.bankAccountsTable).where(eq(schema.bankAccountsTable.id, +c.req.param('id')));
  await auditLog(c.env, 'DELETE', 'bank_accounts', +c.req.param('id'), `Deleted bank account: ${prev?.bankCode}`, prev, null);
  return c.json({ ok: true });
});

app.get('/invoices', async (c) => {
  const d = db(c.env);
  return c.json(await d.select().from(schema.invoicesTable).orderBy(desc(schema.invoicesTable.createdAt)));
});
app.post('/invoices', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.insert(schema.invoicesTable).values(body).returning();
  await auditLog(c.env, 'CREATE', 'invoices', row.id, `Created invoice: ${row.invoiceNumber}`, null, row);
  return c.json(row, 201);
});
app.put('/invoices/:id', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const prev = await d.select().from(schema.invoicesTable).where(eq(schema.invoicesTable.id, +c.req.param('id'))).get();
  const [row] = await d.update(schema.invoicesTable).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.invoicesTable.id, +c.req.param('id'))).returning();
  await auditLog(c.env, 'UPDATE', 'invoices', row.id, `Updated invoice: ${row.invoiceNumber}`, prev, row);
  return c.json(row);
});
app.delete('/invoices/:id', async (c) => {
  const d = db(c.env);
  const prev = await d.select().from(schema.invoicesTable).where(eq(schema.invoicesTable.id, +c.req.param('id'))).get();
  await d.delete(schema.invoicesTable).where(eq(schema.invoicesTable.id, +c.req.param('id')));
  await auditLog(c.env, 'DELETE', 'invoices', +c.req.param('id'), `Deleted invoice: ${prev?.invoiceNumber}`, prev, null);
  return c.json({ ok: true });
});

app.get('/violations', async (c) => {
  const d = db(c.env);
  return c.json(await d.select().from(schema.violationsTable).orderBy(desc(schema.violationsTable.createdAt)));
});
app.post('/violations', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.insert(schema.violationsTable).values(body).returning();
  await auditLog(c.env, 'CREATE', 'violations', row.id, `Created violation for: ${row.ebayUsername}`, null, row);
  return c.json(row, 201);
});
app.put('/violations/:id', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const prev = await d.select().from(schema.violationsTable).where(eq(schema.violationsTable.id, +c.req.param('id'))).get();
  const [row] = await d.update(schema.violationsTable).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.violationsTable.id, +c.req.param('id'))).returning();
  await auditLog(c.env, 'UPDATE', 'violations', row.id, `Updated violation: ${row.policyCode}`, prev, row);
  return c.json(row);
});
app.delete('/violations/:id', async (c) => {
  const d = db(c.env);
  const prev = await d.select().from(schema.violationsTable).where(eq(schema.violationsTable.id, +c.req.param('id'))).get();
  await d.delete(schema.violationsTable).where(eq(schema.violationsTable.id, +c.req.param('id')));
  await auditLog(c.env, 'DELETE', 'violations', +c.req.param('id'), `Deleted violation: ${prev?.policyCode}`, prev, null);
  return c.json({ ok: true });
});

app.get('/tasks', async (c) => {
  const d = db(c.env);
  return c.json(await d.select().from(schema.tasksTable).orderBy(desc(schema.tasksTable.createdAt)));
});
app.post('/tasks', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.insert(schema.tasksTable).values(body).returning();
  await auditLog(c.env, 'CREATE', 'tasks', row.id, `Created task: ${row.task}`, null, row);
  return c.json(row, 201);
});
app.put('/tasks/:id', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const prev = await d.select().from(schema.tasksTable).where(eq(schema.tasksTable.id, +c.req.param('id'))).get();
  const [row] = await d.update(schema.tasksTable).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.tasksTable.id, +c.req.param('id'))).returning();
  await auditLog(c.env, 'UPDATE', 'tasks', row.id, `Updated task: ${row.task}`, prev, row);
  return c.json(row);
});
app.delete('/tasks/:id', async (c) => {
  const d = db(c.env);
  const prev = await d.select().from(schema.tasksTable).where(eq(schema.tasksTable.id, +c.req.param('id'))).get();
  await d.delete(schema.tasksTable).where(eq(schema.tasksTable.id, +c.req.param('id')));
  await auditLog(c.env, 'DELETE', 'tasks', +c.req.param('id'), `Deleted task: ${prev?.task}`, prev, null);
  return c.json({ ok: true });
});

app.get('/earnings', async (c) => {
  const d = db(c.env);
  return c.json(await d.select().from(schema.earningsTable).orderBy(desc(schema.earningsTable.createdAt)));
});
app.post('/earnings', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.insert(schema.earningsTable).values(body).returning();
  await auditLog(c.env, 'CREATE', 'earnings', row.id, `Created earnings entry: $${row.amount}`, null, row);
  return c.json(row, 201);
});
app.put('/earnings/:id', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const prev = await d.select().from(schema.earningsTable).where(eq(schema.earningsTable.id, +c.req.param('id'))).get();
  const [row] = await d.update(schema.earningsTable).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.earningsTable.id, +c.req.param('id'))).returning();
  await auditLog(c.env, 'UPDATE', 'earnings', row.id, `Updated earnings entry`, prev, row);
  return c.json(row);
});
app.delete('/earnings/:id', async (c) => {
  const d = db(c.env);
  const prev = await d.select().from(schema.earningsTable).where(eq(schema.earningsTable.id, +c.req.param('id'))).get();
  await d.delete(schema.earningsTable).where(eq(schema.earningsTable.id, +c.req.param('id')));
  await auditLog(c.env, 'DELETE', 'earnings', +c.req.param('id'), `Deleted earnings entry`, prev, null);
  return c.json({ ok: true });
});

app.get('/expenses', async (c) => {
  const d = db(c.env);
  return c.json(await d.select().from(schema.expensesTable).orderBy(desc(schema.expensesTable.createdAt)));
});
app.post('/expenses', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.insert(schema.expensesTable).values(body).returning();
  await auditLog(c.env, 'CREATE', 'expenses', row.id, `Created expense: ${row.vendor ?? row.category} $${row.amount}`, null, row);
  return c.json(row, 201);
});
app.put('/expenses/:id', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const prev = await d.select().from(schema.expensesTable).where(eq(schema.expensesTable.id, +c.req.param('id'))).get();
  const [row] = await d.update(schema.expensesTable).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.expensesTable.id, +c.req.param('id'))).returning();
  await auditLog(c.env, 'UPDATE', 'expenses', row.id, `Updated expense`, prev, row);
  return c.json(row);
});
app.delete('/expenses/:id', async (c) => {
  const d = db(c.env);
  const prev = await d.select().from(schema.expensesTable).where(eq(schema.expensesTable.id, +c.req.param('id'))).get();
  await d.delete(schema.expensesTable).where(eq(schema.expensesTable.id, +c.req.param('id')));
  await auditLog(c.env, 'DELETE', 'expenses', +c.req.param('id'), `Deleted expense: ${prev?.vendor ?? prev?.category}`, prev, null);
  return c.json({ ok: true });
});

app.get('/recovery', async (c) => {
  const d = db(c.env);
  return c.json(await d.select().from(schema.recoveryEntriesTable).orderBy(desc(schema.recoveryEntriesTable.createdAt)));
});
app.post('/recovery', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.insert(schema.recoveryEntriesTable).values(body).returning();
  await auditLog(c.env, 'CREATE', 'recovery_entries', row.id, `Created recovery entry: ${row.accountService}`, null, row);
  return c.json(row, 201);
});
app.put('/recovery/:id', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const prev = await d.select().from(schema.recoveryEntriesTable).where(eq(schema.recoveryEntriesTable.id, +c.req.param('id'))).get();
  const [row] = await d.update(schema.recoveryEntriesTable).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.recoveryEntriesTable.id, +c.req.param('id'))).returning();
  await auditLog(c.env, 'UPDATE', 'recovery_entries', row.id, `Updated recovery: ${row.accountService}`, prev, row);
  return c.json(row);
});
app.delete('/recovery/:id', async (c) => {
  const d = db(c.env);
  const prev = await d.select().from(schema.recoveryEntriesTable).where(eq(schema.recoveryEntriesTable.id, +c.req.param('id'))).get();
  await d.delete(schema.recoveryEntriesTable).where(eq(schema.recoveryEntriesTable.id, +c.req.param('id')));
  await auditLog(c.env, 'DELETE', 'recovery_entries', +c.req.param('id'), `Deleted recovery: ${prev?.accountService}`, prev, null);
  return c.json({ ok: true });
});

app.get('/daily-logins', async (c) => {
  const d = db(c.env);
  return c.json(await d.select().from(schema.dailyLoginsTable).orderBy(desc(schema.dailyLoginsTable.createdAt)));
});
app.post('/daily-logins', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.insert(schema.dailyLoginsTable).values(body).returning();
  return c.json(row, 201);
});
app.put('/daily-logins/:id', async (c) => {
  const body = await c.req.json();
  const d = db(c.env);
  const [row] = await d.update(schema.dailyLoginsTable).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.dailyLoginsTable.id, +c.req.param('id'))).returning();
  return c.json(row);
});
app.delete('/daily-logins/:id', async (c) => {
  const d = db(c.env);
  await d.delete(schema.dailyLoginsTable).where(eq(schema.dailyLoginsTable.id, +c.req.param('id')));
  return c.json({ ok: true });
});

app.get('/settings', async (c) => {
  const d = db(c.env);
  return c.json(await d.select().from(schema.settingsTable));
});
app.put('/settings/:key', async (c) => {
  const { value } = await c.req.json();
  const d = db(c.env);
  await d.insert(schema.settingsTable).values({ key: c.req.param('key'), value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({ target: schema.settingsTable.key, set: { value, updatedAt: new Date().toISOString() } });
  return c.json({ ok: true });
});

app.get('/audit-log', async (c) => {
  const d = db(c.env);
  const rows = await d.select().from(schema.auditLogTable).orderBy(desc(schema.auditLogTable.createdAt)).limit(500);
  return c.json(rows);
});

app.get('/activity', async (c) => {
  const d = db(c.env);
  const rows = await d.select().from(schema.activityTable).orderBy(desc(schema.activityTable.createdAt)).limit(20);
  return c.json(rows);
});

app.get('/admin/backup', async (c) => {
  const d = db(c.env);
  const [clients, ebayAccounts, wiseCards, bankAccounts, invoices, violations, tasks, earnings, expenses, recovery, dailyLogins, settings] = await Promise.all([
    d.select().from(schema.clientsTable),
    d.select().from(schema.ebayAccountsTable),
    d.select().from(schema.wiseCardsTable),
    d.select().from(schema.bankAccountsTable),
    d.select().from(schema.invoicesTable),
    d.select().from(schema.violationsTable),
    d.select().from(schema.tasksTable),
    d.select().from(schema.earningsTable),
    d.select().from(schema.expensesTable),
    d.select().from(schema.recoveryEntriesTable),
    d.select().from(schema.dailyLoginsTable),
    d.select().from(schema.settingsTable),
  ]);
  return c.json({ exportedAt: new Date().toISOString(), version: 2, data: { clients, ebayAccounts, wiseCards, bankAccounts, invoices, violations, tasks, earnings, expenses, recovery, dailyLogins, settings } });
});

app.post('/sheets/export', async (c) => {
  const { table } = await c.req.json();
  const sheetId = c.env.GOOGLE_SHEET_ID;
  const serviceKey = c.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!sheetId || !serviceKey) return c.json({ error: 'Google Sheets not configured. Add GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_KEY to worker secrets.' }, 400);
  const d = db(c.env);
  let rows: unknown[] = [];
  if (table === 'clients') rows = await d.select().from(schema.clientsTable);
  else if (table === 'invoices') rows = await d.select().from(schema.invoicesTable);
  else if (table === 'earnings') rows = await d.select().from(schema.earningsTable);
  else if (table === 'expenses') rows = await d.select().from(schema.expensesTable);
  else if (table === 'tasks') rows = await d.select().from(schema.tasksTable);
  else if (table === 'violations') rows = await d.select().from(schema.violationsTable);
  else return c.json({ error: 'Unknown table' }, 400);
  if (!rows.length) return c.json({ ok: true, rows: 0, message: 'No data to export' });
  const headers = Object.keys(rows[0] as Record<string, unknown>);
  const values = [headers, ...rows.map(r => headers.map(h => String((r as Record<string, unknown>)[h] ?? '')))];
  const key = JSON.parse(serviceKey);
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: key.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 };
  const encoder = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signingInput = `${header}.${payloadB64}`;
  const pkPem = key.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const pkDer = Uint8Array.from(atob(pkPem), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey('pkcs8', pkDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${signingInput}.${sigB64}`;
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}` });
  const { access_token } = await tokenResp.json() as { access_token: string };
  const range = `${table}!A1`;
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:clear`, { method: 'POST', headers: { Authorization: `Bearer ${access_token}` } });
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=RAW`, { method: 'PUT', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values }) });
  return c.json({ ok: true, rows: rows.length, sheetId });
});

export default app;
