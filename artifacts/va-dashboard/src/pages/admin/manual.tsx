import React, { useState } from 'react';
import { BookOpen, ChevronRight, ChevronDown, Shield, Database, Settings, Activity, Download, RotateCcw, Lock, Users } from 'lucide-react';

type Section = { id: string; icon: React.ReactNode; title: string; content: React.ReactNode };

function ExpandableSection({ section, forceOpen }: { section: Section; forceOpen: boolean }) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = forceOpen || localOpen;

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/40 transition-colors"
        onClick={() => setLocalOpen(!localOpen)}
      >
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">{section.icon}</span>
          <span className="font-semibold text-base text-zinc-100">{section.title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 text-sm text-zinc-400 space-y-3 border-t border-zinc-800">{section.content}</div>}
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: 'login',
    icon: <Lock className="w-5 h-5" />,
    title: 'Admin Login & Authentication',
    content: (
      <div className="space-y-2">
        <p>The Admin Panel is protected by a password stored in the database.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Default password: <code className="bg-zinc-800 px-1 rounded text-emerald-400">admin123</code></li>
          <li>Navigate to <strong>/admin/login</strong> or click "Admin Panel" in the sidebar.</li>
          <li>Enter the admin password to gain access. Sessions are stored in localStorage.</li>
          <li>Click <strong>Sign Out</strong> in the top-right of any admin page to log out.</li>
          <li><strong>Change Password:</strong> Go to Admin → Settings and update the Admin Password field immediately after setup.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'dashboard',
    icon: <Activity className="w-5 h-5" />,
    title: 'Admin Dashboard — Stats & Overview',
    content: (
      <div className="space-y-2">
        <p>The Admin Dashboard provides a high-level overview of the entire system:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Total counts: clients, eBay accounts, invoices, violations, tasks.</li>
          <li>Financial summary: total revenue, expenses, and net profit.</li>
          <li>Quick-action links to manage settings, export data, view activity, and audit log.</li>
          <li>Recent Activity feed showing the last 10 system events.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'audit',
    icon: <Shield className="w-5 h-5" />,
    title: 'Audit Log — Change Tracking & Undo',
    content: (
      <div className="space-y-2">
        <p>Every create, update, and delete action is recorded in the audit log.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Filter by table (clients, invoices, tasks, violations, eBay accounts) using the dropdown.</li>
          <li><strong>Undo Button</strong> — for UPDATE and DELETE actions, click Undo to revert the change automatically.</li>
          <li>CREATE actions can also be undone (the newly created record will be deleted).</li>
          <li>Once undone, the action is marked and cannot be undone again.</li>
          <li>The audit log retains 90 days of history by default (configurable in Settings).</li>
        </ul>
        <p className="text-amber-400"><strong>Note:</strong> Undo only works for clients, ebay_accounts, invoices, tasks, and violations tables.</p>
      </div>
    ),
  },
  {
    id: 'settings',
    icon: <Settings className="w-5 h-5" />,
    title: 'Settings — System Configuration',
    content: (
      <div className="space-y-2">
        <p>Configure system-wide settings that affect all pages:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>General:</strong> Company name, admin email, default currency.</li>
          <li><strong>Security:</strong> Admin password — change this from the default immediately.</li>
          <li><strong>Invoices:</strong> Invoice number prefix (default: INV) and overdue threshold (days).</li>
          <li><strong>Tasks:</strong> How many days before due date to trigger a reminder.</li>
          <li><strong>Cards:</strong> How many days before card expiry to show a warning.</li>
          <li><strong>Admin:</strong> Audit log retention days and bulk delete permission toggle.</li>
        </ul>
        <p>Click <strong>Save All Settings</strong> after making changes. A toast confirms the save.</p>
      </div>
    ),
  },
  {
    id: 'export',
    icon: <Download className="w-5 h-5" />,
    title: 'Data Export — CSV & JSON Backup',
    content: (
      <div className="space-y-2">
        <p>Export and back up all data from Admin → Data Export:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Individual CSV Exports</strong> — download any table as a CSV file (clients, invoices, tasks, etc.).</li>
          <li><strong>Export All CSVs</strong> — downloads all tables as separate CSV files in sequence.</li>
          <li><strong>Full JSON Backup</strong> — creates a complete snapshot of all data in one JSON file. This is the recommended backup method.</li>
        </ul>
        <p className="text-amber-400"><strong>Security:</strong> Recovery & 2FA exports contain sensitive credentials. Handle these files with care and delete them after use.</p>
      </div>
    ),
  },
  {
    id: 'restore',
    icon: <RotateCcw className="w-5 h-5" />,
    title: 'Restore — Importing a Backup',
    content: (
      <div className="space-y-2">
        <p>Restore data from a previously downloaded JSON backup:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Navigate to Admin → Data Export and scroll to the <strong>Restore Backup</strong> section.</li>
          <li>Click <strong>Choose Backup File</strong> and select the <code>.json</code> file.</li>
          <li>Click <strong>Restore Backup</strong> to upload and process the file.</li>
          <li>The system will insert records that don't already exist (duplicates are skipped).</li>
          <li>A confirmation toast shows how many records were restored and any errors.</li>
        </ul>
        <p className="text-red-400"><strong>Warning:</strong> Restore ADDS records — it does not wipe existing data first. Run a fresh backup before restoring to avoid confusion.</p>
      </div>
    ),
  },
  {
    id: 'bulk',
    icon: <Database className="w-5 h-5" />,
    title: 'Bulk Operations & Data Management',
    content: (
      <div className="space-y-2">
        <p>The API supports bulk delete operations for admin use:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Bulk delete requires the <strong>Allow Bulk Delete</strong> setting to be enabled.</li>
          <li>Entity names match API paths (clients, ebay-accounts, invoices, etc.).</li>
          <li>All bulk operations are logged in the audit trail.</li>
        </ul>
        <p>For data integrity, always export a backup before performing bulk operations.</p>
      </div>
    ),
  },
  {
    id: 'users',
    icon: <Users className="w-5 h-5" />,
    title: 'User Access & Permissions',
    content: (
      <div className="space-y-2">
        <p>This system uses a single admin account model:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>There is one admin password that protects the Admin Panel.</li>
          <li>Regular dashboard users (VAs) can access all non-admin pages without a password.</li>
          <li>The admin password is stored in the Settings table in the database.</li>
          <li>To grant admin access, share the admin password securely with trusted team members.</li>
          <li>To revoke access, change the admin password in Admin → Settings.</li>
        </ul>
        <p>For multi-user access control, consider implementing full user accounts — contact your developer to upgrade.</p>
      </div>
    ),
  },
];

export default function AdminManual() {
  const [allOpen, setAllOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" /> Admin Manual
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5">Complete guide for administering the VA Client Manager system</p>
        </div>
        <button
          className="text-sm text-emerald-400 hover:underline"
          onClick={() => setAllOpen(v => !v)}
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
        <p className="text-sm text-zinc-300">
          <strong className="text-emerald-400">First-Time Setup Checklist:</strong>
          {' '}1. Change the admin password in Settings.{' '}
          2. Add your clients.{' '}
          3. Link eBay accounts to clients.{' '}
          4. Configure invoice prefix and overdue threshold.{' '}
          5. Take a full JSON backup.
        </p>
      </div>

      <div className="space-y-2">
        {SECTIONS.map(section => (
          <ExpandableSection key={section.id} section={section} forceOpen={allOpen} />
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-sm text-zinc-500">
        <p className="font-medium text-zinc-400 mb-1">API Reference</p>
        <p>All data endpoints are available at <code className="text-emerald-400">/api/</code>. Admin-only endpoints require no auth currently — secure your deployment with network-level restrictions or add token auth if needed. Key admin endpoints: <code className="text-emerald-400">POST /api/admin/auth</code>, <code className="text-emerald-400">GET /api/admin/backup</code>, <code className="text-emerald-400">POST /api/admin/restore</code>, <code className="text-emerald-400">GET /api/admin/audit</code>.</p>
      </div>
    </div>
  );
}
