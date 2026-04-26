import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const now = () => sql`(datetime('now'))`;

export const clientsTable = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientName: text('client_name').notNull(),
  businessBrand: text('business_brand'),
  country: text('country'),
  email: text('email'),
  phone: text('phone'),
  serviceType: text('service_type'),
  onboardedOn: text('onboarded_on'),
  status: text('status').notNull().default('Active'),
  hourlyRate: real('hourly_rate'),
  currency: text('currency'),
  totalSales: real('total_sales'),
  lastContact: text('last_contact'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const ebayAccountsTable = sqliteTable('ebay_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull(),
  ebayUsername: text('ebay_username').notNull(),
  ebayEmail: text('ebay_email'),
  ebayPassword: text('ebay_password'),
  marketplace: text('marketplace'),
  accountType: text('account_type'),
  accountHealth: text('account_health'),
  feedbackScore: integer('feedback_score'),
  topRated: integer('top_rated', { mode: 'boolean' }).notNull().default(false),
  activeListings: integer('active_listings'),
  sellingLimit: real('selling_limit'),
  mcRestriction: integer('mc_restriction', { mode: 'boolean' }).notNull().default(false),
  lastLogin: text('last_login'),
  lastPwdChange: text('last_pwd_change'),
  pwdExpiresIn: integer('pwd_expires_in'),
  twoFaEnabled: integer('two_fa_enabled', { mode: 'boolean' }).notNull().default(false),
  linkedBankId: text('linked_bank_id'),
  linkedCardId: text('linked_card_id'),
  status: text('status').default('Active'),
  healthScore: integer('health_score').default(80),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const wiseCardsTable = sqliteTable('wise_cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardCode: text('card_code').notNull(),
  clientId: integer('client_id').notNull(),
  provider: text('provider'),
  cardType: text('card_type'),
  cardHolder: text('card_holder'),
  cardNumberMasked: text('card_number_masked'),
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  currency: text('currency'),
  wiseEmail: text('wise_email'),
  wisePassword: text('wise_password'),
  wise2fa: integer('wise_2fa', { mode: 'boolean' }).notNull().default(false),
  linkedBankId: text('linked_bank_id'),
  balance: real('balance'),
  status: text('status'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const bankAccountsTable = sqliteTable('bank_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bankCode: text('bank_code').notNull(),
  clientId: integer('client_id').notNull(),
  bankName: text('bank_name'),
  accountHolder: text('account_holder'),
  accountNumber: text('account_number'),
  routingCode: text('routing_code'),
  swiftBic: text('swift_bic'),
  iban: text('iban'),
  currency: text('currency'),
  onlineBankingUrl: text('online_banking_url'),
  onlineUsername: text('online_username'),
  onlinePassword: text('online_password'),
  twoFaMethod: text('two_fa_method'),
  status: text('status'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const invoicesTable = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceNumber: text('invoice_number').notNull(),
  clientId: integer('client_id').notNull(),
  issueDate: text('issue_date'),
  dueDate: text('due_date'),
  hours: real('hours'),
  rate: real('rate'),
  amount: real('amount').notNull(),
  status: text('status').notNull().default('Draft'),
  paidOn: text('paid_on'),
  method: text('method'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const violationsTable = sqliteTable('violations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull(),
  ebayUsername: text('ebay_username').notNull(),
  date: text('date'),
  policyCode: text('policy_code'),
  severity: text('severity'),
  description: text('description'),
  actionTaken: text('action_taken'),
  resolved: integer('resolved', { mode: 'boolean' }).notNull().default(false),
  resolvedOn: text('resolved_on'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const tasksTable = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id'),
  task: text('task').notNull(),
  priority: text('priority'),
  dueDate: text('due_date'),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('Not Started'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const earningsTable = sqliteTable('earnings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull(),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency'),
  source: text('source'),
  status: text('status').default('Received'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const expensesTable = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date'),
  category: text('category'),
  vendor: text('vendor'),
  description: text('description'),
  amount: real('amount').notNull(),
  currency: text('currency'),
  recurring: integer('recurring', { mode: 'boolean' }).notNull().default(false),
  linkedClientId: integer('linked_client_id'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const recoveryEntriesTable = sqliteTable('recovery_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull(),
  accountService: text('account_service').notNull(),
  recoveryEmail: text('recovery_email'),
  recoveryPhone: text('recovery_phone'),
  securityQ1: text('security_q1'),
  answer1: text('answer1'),
  securityQ2: text('security_q2'),
  answer2: text('answer2'),
  twoFaMethod: text('two_fa_method'),
  backupCodes: text('backup_codes'),
  totpSeed: text('totp_seed'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const dailyLoginsTable = sqliteTable('daily_logins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull(),
  ebayUsername: text('ebay_username').notNull(),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  targetPerWeek: integer('target_per_week'),
  loginDays: text('login_days').notNull().default('[]'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const settingsTable = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  label: text('label'),
  group: text('group').default('general'),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const auditLogTable = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  tableName: text('table_name').notNull(),
  recordId: integer('record_id'),
  description: text('description').notNull(),
  previousData: text('previous_data'),
  newData: text('new_data'),
  performedBy: text('performed_by').default('admin'),
  undone: integer('undone', { mode: 'boolean' }).default(false),
  undoneAt: text('undone_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const activityTable = sqliteTable('activity', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  description: text('description').notNull(),
  clientName: text('client_name'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
