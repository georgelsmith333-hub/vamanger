import React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminFetch, type AdminStats, type ActivityItem } from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, ShoppingCart, FileText, AlertTriangle, CheckSquare,
  TrendingUp, DollarSign, Activity, RefreshCw, Database, Server
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function StatCard({ label, value, sub, icon: Icon, color = "primary" }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    yellow: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
        <Icon className="w-4 h-4 opacity-70" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats, refetch } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => adminFetch<AdminStats>("/stats"),
    refetchInterval: 30000,
  });

  const { data: activity, isLoading: loadingActivity } = useQuery<ActivityItem[]>({
    queryKey: ["admin-activity-recent"],
    queryFn: () => adminFetch<ActivityItem[]>("/activity?limit=8"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Overview</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Real-time stats across all data entities</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
          <RefreshCw className="w-3 h-3 mr-2" />Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      {loadingStats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg bg-zinc-800" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard label="Total Clients" value={stats!.clients.total} sub={`${stats!.clients.active} active`} icon={Users} color="primary" />
            <StatCard label="eBay Accounts" value={stats!.ebayAccounts.total} sub={`${stats!.ebayAccounts.active} active`} icon={ShoppingCart} color="purple" />
            <StatCard label="Invoices" value={stats!.invoices.total} sub={`${stats!.invoices.paid} paid, ${stats!.invoices.overdue} overdue`} icon={FileText} color="yellow" />
            <StatCard label="Open Violations" value={stats!.violations.open} sub={`${stats!.violations.total} total logged`} icon={AlertTriangle} color="red" />
            <StatCard label="Pending Tasks" value={stats!.tasks.pending} sub={`${stats!.tasks.done} done`} icon={CheckSquare} color="green" />
            <StatCard label="Total Revenue" value={`$${stats!.financials.totalRevenue.toFixed(0)}`} sub="from paid invoices" icon={DollarSign} color="green" />
            <StatCard label="Total Expenses" value={`$${stats!.financials.totalExpenses.toFixed(0)}`} icon={TrendingUp} color="red" />
            <StatCard label="Net Profit" value={`$${stats!.financials.netProfit.toFixed(0)}`} icon={Activity} color={stats!.financials.netProfit >= 0 ? "green" : "red"} />
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/admin/activity">
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 hover:bg-zinc-800 transition cursor-pointer">
              <Activity className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-sm font-medium text-zinc-200">Audit Log</p>
              <p className="text-xs text-zinc-500">View & undo changes</p>
            </div>
          </Link>
          <Link href="/admin/export">
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 hover:bg-zinc-800 transition cursor-pointer">
              <Database className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-sm font-medium text-zinc-200">Export Data</p>
              <p className="text-xs text-zinc-500">Download CSV backups</p>
            </div>
          </Link>
          <Link href="/admin/settings">
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 hover:bg-zinc-800 transition cursor-pointer">
              <Server className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-sm font-medium text-zinc-200">Settings</p>
              <p className="text-xs text-zinc-500">Configure system</p>
            </div>
          </Link>
          <Link href="/">
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 hover:bg-zinc-800 transition cursor-pointer">
              <Users className="w-5 h-5 text-amber-400 mb-2" />
              <p className="text-sm font-medium text-zinc-200">Client App</p>
              <p className="text-xs text-zinc-500">Go to main dashboard</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Recent Activity</h2>
          <Link href="/admin/activity">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 h-7 text-xs">View all →</Button>
          </Link>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {loadingActivity ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3"><Skeleton className="h-4 w-3/4 bg-zinc-700" /></div>
          )) : !activity || activity.length === 0 ? (
            <div className="px-4 py-8 text-center text-zinc-500 text-sm">No activity yet</div>
          ) : activity.map(a => (
            <div key={a.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{a.description}</p>
                {a.clientName && <p className="text-xs text-zinc-500">{a.clientName}</p>}
              </div>
              <p className="text-xs text-zinc-600 flex-shrink-0">
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
