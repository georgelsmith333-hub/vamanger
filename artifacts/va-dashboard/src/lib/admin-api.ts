const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api/admin`;

export async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function adminPost<T>(path: string, body?: unknown): Promise<T> {
  return adminFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
}

export async function adminPut<T>(path: string, body: unknown): Promise<T> {
  return adminFetch<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export async function adminDelete<T>(path: string, body?: unknown): Promise<T> {
  return adminFetch<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined });
}

export type AdminStats = {
  clients: { total: number; active: number };
  ebayAccounts: { total: number; active: number };
  invoices: { total: number; paid: number; overdue: number; totalRevenue: number };
  violations: { total: number; open: number };
  tasks: { total: number; pending: number; done: number };
  financials: { totalRevenue: number; totalExpenses: number; netProfit: number; totalEarnings: number };
};

export type AuditEntry = {
  id: number;
  action: string;
  tableName: string;
  recordId: number | null;
  description: string;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  performedBy: string | null;
  undone: boolean;
  undoneAt: string | null;
  createdAt: string;
};

export type Setting = {
  id: number;
  key: string;
  value: string | null;
  label: string | null;
  group: string | null;
  updatedAt: string;
};

export type ActivityItem = {
  id: number;
  type: string;
  description: string;
  clientName: string | null;
  createdAt: string;
};
