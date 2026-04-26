CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT NOT NULL,
  business_brand TEXT,
  country TEXT,
  email TEXT,
  phone TEXT,
  service_type TEXT,
  onboarded_on TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  hourly_rate REAL,
  currency TEXT,
  total_sales REAL,
  last_contact TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ebay_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  ebay_username TEXT NOT NULL,
  ebay_email TEXT,
  ebay_password TEXT,
  marketplace TEXT,
  account_type TEXT,
  account_health TEXT,
  feedback_score INTEGER,
  top_rated INTEGER NOT NULL DEFAULT 0,
  active_listings INTEGER,
  selling_limit REAL,
  mc_restriction INTEGER NOT NULL DEFAULT 0,
  last_login TEXT,
  last_pwd_change TEXT,
  pwd_expires_in INTEGER,
  two_fa_enabled INTEGER NOT NULL DEFAULT 0,
  linked_bank_id TEXT,
  linked_card_id TEXT,
  status TEXT DEFAULT 'Active',
  health_score INTEGER DEFAULT 80,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wise_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_code TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  provider TEXT,
  card_type TEXT,
  card_holder TEXT,
  card_number_masked TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  currency TEXT,
  wise_email TEXT,
  wise_password TEXT,
  wise_2fa INTEGER NOT NULL DEFAULT 0,
  linked_bank_id TEXT,
  balance REAL,
  status TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_code TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  bank_name TEXT,
  account_holder TEXT,
  account_number TEXT,
  routing_code TEXT,
  swift_bic TEXT,
  iban TEXT,
  currency TEXT,
  online_banking_url TEXT,
  online_username TEXT,
  online_password TEXT,
  two_fa_method TEXT,
  status TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  issue_date TEXT,
  due_date TEXT,
  hours REAL,
  rate REAL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  paid_on TEXT,
  method TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  ebay_username TEXT NOT NULL,
  date TEXT,
  policy_code TEXT,
  severity TEXT,
  description TEXT,
  action_taken TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  resolved_on TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  task TEXT NOT NULL,
  priority TEXT,
  due_date TEXT,
  done INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Not Started',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT,
  source TEXT,
  status TEXT DEFAULT 'Received',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  category TEXT,
  vendor TEXT,
  description TEXT,
  amount REAL NOT NULL,
  currency TEXT,
  recurring INTEGER NOT NULL DEFAULT 0,
  linked_client_id INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recovery_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  account_service TEXT NOT NULL,
  recovery_email TEXT,
  recovery_phone TEXT,
  security_q1 TEXT,
  answer1 TEXT,
  security_q2 TEXT,
  answer2 TEXT,
  two_fa_method TEXT,
  backup_codes TEXT,
  totp_seed TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_logins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  ebay_username TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  target_per_week INTEGER,
  login_days TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  label TEXT,
  "group" TEXT DEFAULT 'general',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id INTEGER,
  description TEXT NOT NULL,
  previous_data TEXT,
  new_data TEXT,
  performed_by TEXT DEFAULT 'admin',
  undone INTEGER DEFAULT 0,
  undone_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  client_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO settings (key, value, label, "group") VALUES
  ('admin_password', 'admin123', 'Admin Password', 'security'),
  ('google_sheet_id', '', 'Google Sheet ID', 'integrations'),
  ('google_sheet_sync', 'false', 'Auto-sync to Google Sheets', 'integrations');
