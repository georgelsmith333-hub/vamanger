import React, { useState } from 'react';
import { BookOpen, ChevronRight, ChevronDown, Users, ShoppingCart, CreditCard, Landmark, FileText, AlertTriangle, CheckSquare, TrendingUp, DollarSign, Shield, Calendar } from 'lucide-react';

type Section = { id: string; icon: React.ReactNode; title: string; content: React.ReactNode };

function Accordion({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="text-primary">{section.icon}</span>
          <span className="font-semibold text-base">{section.title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground space-y-3 border-t border-border">{section.content}</div>}
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: 'dashboard',
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Dashboard — Overview & KPI Cards',
    content: (
      <div className="space-y-2">
        <p>The Dashboard is your command center. It shows real-time KPI cards at the top:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Active Clients</strong> — click to go to Clients page.</li>
          <li><strong>eBay Accounts</strong> — click to go to eBay Accounts page.</li>
          <li><strong>Outstanding Invoices</strong> — click to go to Invoices.</li>
          <li><strong>Open Violations</strong> — click to go to Violations.</li>
          <li><strong>Pending Tasks</strong> — click to go to Tasks.</li>
          <li><strong>Monthly Earnings</strong> — click to go to Earnings.</li>
        </ul>
        <p>The Alerts Panel below shows items that need immediate attention. Clicking an alert navigates directly to the relevant record.</p>
        <p>Recent Activity at the bottom shows the last 10 actions taken across the system.</p>
      </div>
    ),
  },
  {
    id: 'clients',
    icon: <Users className="w-5 h-5" />,
    title: 'Clients — Managing Your Client List',
    content: (
      <div className="space-y-2">
        <p>The Clients page lets you manage all dropshipping clients.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Add Client</strong> — click the button top-right to open the Add Client form. Fill in name, email, phone, business name, country, and hourly rate.</li>
          <li><strong>Edit Client</strong> — click the pencil icon on any row to open the edit dialog with pre-filled fields.</li>
          <li><strong>Change Status</strong> — use the Edit dialog to set Active, Inactive, or Paused.</li>
          <li><strong>Delete Client</strong> — click the trash icon. This is permanent.</li>
          <li><strong>Search</strong> — type in the search bar to filter by name, email, or business.</li>
        </ul>
        <p>Each client card shows their status badge, hourly rate, and linked eBay accounts count.</p>
      </div>
    ),
  },
  {
    id: 'ebay',
    icon: <ShoppingCart className="w-5 h-5" />,
    title: 'eBay Accounts — Account Health Tracking',
    content: (
      <div className="space-y-2">
        <p>Track all eBay seller accounts for your clients.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Add Account</strong> — link an eBay username to a client, set the account status and health score.</li>
          <li><strong>Health Score</strong> — a 0–100 score shown with a color-coded bar (green/yellow/red).</li>
          <li><strong>Status</strong> — Active, Suspended, Restricted, or Inactive.</li>
          <li><strong>Edit</strong> — update any field including health score, status, and linked Wise card.</li>
          <li><strong>Search</strong> — filter by eBay username or client name.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'wise',
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Wise Cards — Payment Card Management',
    content: (
      <div className="space-y-2">
        <p>Manage Wise payment cards used for supplier purchases.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Add Card</strong> — enter card number (last 4 only for security), cardholder name, expiry, balance, and status.</li>
          <li><strong>Expiry Warning</strong> — cards expiring within 60 days are highlighted in yellow. Expired cards show in red.</li>
          <li><strong>Balance</strong> — track current balance on each card.</li>
          <li><strong>Edit</strong> — update balance, status, or expiry date at any time.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'bank',
    icon: <Landmark className="w-5 h-5" />,
    title: 'Bank Accounts — Banking Details',
    content: (
      <div className="space-y-2">
        <p>Store banking details for client payouts.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Add accounts with bank name, account holder, account number, routing number, and IBAN.</li>
          <li>Link each bank account to a specific client.</li>
          <li>Use the search bar to filter by client or bank name.</li>
          <li>Edit or delete any entry using the row action buttons.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'invoices',
    icon: <FileText className="w-5 h-5" />,
    title: 'Invoices — Billing & Payments',
    content: (
      <div className="space-y-2">
        <p>Create and track client invoices.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>New Invoice</strong> — select a client, enter an invoice number, dates, hours worked, rate, and total amount.</li>
          <li><strong>Status flow</strong> — Draft → Sent → Paid (or Overdue if past due date).</li>
          <li><strong>Mark Paid</strong> — one-click button to mark an invoice as paid with today's date.</li>
          <li><strong>Edit</strong> — click the pencil icon to modify any invoice field.</li>
          <li><strong>Overdue Detection</strong> — invoices past their due date are highlighted and tagged with how many days late.</li>
          <li><strong>Summary Cards</strong> — see Total Billed, Collected, and Overdue at the top of the page.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'violations',
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Violations — eBay Policy Violations',
    content: (
      <div className="space-y-2">
        <p>Log and track eBay policy violations for client accounts.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Log Violation</strong> — record the client, eBay username, date, policy code (e.g. MC011), severity, and description.</li>
          <li><strong>Severity Levels</strong> — Warning (yellow), Restricted (orange), Suspended (red).</li>
          <li><strong>Resolve</strong> — once a violation is addressed, mark it as resolved with one click.</li>
          <li><strong>Edit</strong> — update any field including action taken and notes.</li>
          <li>Unresolved violations are highlighted in red and also appear in the Dashboard Alerts Panel.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'tasks',
    icon: <CheckSquare className="w-5 h-5" />,
    title: 'Tasks — VA Task Tracker',
    content: (
      <div className="space-y-2">
        <p>Track all your VA work tasks across clients.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Add Task</strong> — describe the task, assign to a client (or leave as General), set priority and due date.</li>
          <li><strong>Priority</strong> — High (red), Medium (yellow), Low (blue).</li>
          <li><strong>Toggle Done</strong> — click the circle icon on the left of any row to mark a task complete.</li>
          <li><strong>Edit</strong> — click the pencil icon to update any task field including status and notes.</li>
          <li>Overdue tasks (past due date, not done) show an alert icon and a red row background.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'earnings',
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Earnings — Monthly Income Records',
    content: (
      <div className="space-y-2">
        <p>Record your monthly VA earnings per client.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Add an earning entry with client, month, amount, source (e.g. Wise, PayPal), and payment status.</li>
          <li>Summary cards at the top show total earnings, received, and pending amounts.</li>
          <li>Edit or delete any entry using the row icons.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'expenses',
    icon: <DollarSign className="w-5 h-5" />,
    title: 'Expenses — Business Costs',
    content: (
      <div className="space-y-2">
        <p>Track business expenses to maintain accurate profit/loss records.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Add expenses with category (Software, Tools, Office, etc.), amount, date, and notes.</li>
          <li>Link to a client if it's a client-specific cost.</li>
          <li>Summary cards show total and this month's expenses.</li>
          <li>Edit or delete expenses with the row action buttons.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'recovery',
    icon: <Shield className="w-5 h-5" />,
    title: 'Recovery & 2FA — Sensitive Credentials',
    content: (
      <div className="space-y-2">
        <p>Store recovery codes and 2FA backup information securely.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Link recovery info to a client and eBay account.</li>
          <li>Store recovery email, recovery phone, 2FA backup codes, and notes.</li>
          <li><strong>Sensitive fields are hidden by default</strong> — click the eye icon to reveal recovery codes.</li>
          <li>Edit or delete entries with the row action buttons.</li>
          <li><strong>Caution:</strong> This data is extremely sensitive. Limit access to trusted personnel only.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'daily',
    icon: <Calendar className="w-5 h-5" />,
    title: 'Daily Logins — Login Activity Tracker',
    content: (
      <div className="space-y-2">
        <p>Track daily eBay account logins to meet client requirements.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Log each login with client, eBay account, date, time, and any notes.</li>
          <li>Use the search bar to filter by client or eBay username.</li>
          <li>Add entries with the "Log Login" button in the top-right corner.</li>
        </ul>
      </div>
    ),
  },
];

export default function UserManual() {
  const [allOpen, setAllOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" /> User Manual
          </h1>
          <p className="text-muted-foreground mt-1">Complete guide to using the VA eBay Client Manager</p>
        </div>
        <button
          className="text-sm text-primary hover:underline"
          onClick={() => setAllOpen(v => !v)}
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
        <p className="text-sm"><strong>Quick Start:</strong> Use the left sidebar to navigate between sections. Each page has an <strong>Add</strong> button (top-right) to create new records, and <strong>pencil</strong> / <strong>trash</strong> icons on each row to edit or delete. All changes show a toast notification confirming success or failure.</p>
      </div>

      <div className="space-y-2">
        {SECTIONS.map(section => (
          <ExpandableSection key={section.id} section={section} forceOpen={allOpen} />
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Need Admin Access?</p>
        <p>The Admin Panel is accessible from the bottom of the left sidebar. Default admin password is <code className="bg-muted px-1 rounded">admin123</code> — change it in Admin → Settings immediately after setup.</p>
      </div>
    </div>
  );
}

function ExpandableSection({ section, forceOpen }: { section: Section; forceOpen: boolean }) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = forceOpen || localOpen;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setLocalOpen(!localOpen)}
      >
        <div className="flex items-center gap-3">
          <span className="text-primary">{section.icon}</span>
          <span className="font-semibold text-base">{section.title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground space-y-3 border-t border-border">{section.content}</div>}
    </div>
  );
}
