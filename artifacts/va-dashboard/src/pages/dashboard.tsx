import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetDashboardRecentActivity, getGetDashboardRecentActivityQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, ShoppingCart, FileText, AlertTriangle, CheckSquare, CreditCard, TrendingUp, Receipt, Activity, Shield, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

import { API_BASE as BASE } from "@/lib/api-base";

function KpiCard({ title, value, subtitle, icon: Icon, alert, href }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  alert?: boolean;
  href?: string;
}) {
  const [, navigate] = useLocation();
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${alert ? 'border-destructive/50' : ''} ${href ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:border-primary/40 group' : ''}`}
      onClick={href ? () => navigate(href) : undefined}
      role={href ? 'button' : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={href ? (e) => { if (e.key === 'Enter') navigate(href); } : undefined}
    >
      {alert && <div className="absolute top-0 right-0 w-2 h-2 m-2 rounded-full bg-destructive animate-pulse" />}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex items-center gap-1">
          <Icon className={`h-4 w-4 ${alert ? 'text-destructive' : 'text-muted-foreground'}`} />
          {href && <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${alert ? 'text-destructive' : ''}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function AlertItem({ icon: Icon, title, description, href, color = 'destructive' }: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color?: 'destructive' | 'amber';
}) {
  const [, navigate] = useLocation();
  const cls = color === 'amber'
    ? 'border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
    : 'border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20';
  return (
    <div
      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${cls}`}
      onClick={() => navigate(href)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(href); }}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs opacity-90">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 opacity-60 ml-2" />
    </div>
  );
}

type ChartPoint = { label: string; earnings: number; expenses: number; net: number };

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl text-xs space-y-1">
        <p className="font-semibold text-zinc-200 mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            <span className="text-zinc-400 capitalize">{p.name}:</span>
            <span className="font-medium text-zinc-100">${p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  const { data: recentActivity, isLoading: isLoadingActivity } = useGetDashboardRecentActivity({
    query: { queryKey: getGetDashboardRecentActivityQueryKey() }
  });
  const { data: chartData, isLoading: isLoadingChart } = useQuery<ChartPoint[]>({
    queryKey: ['dashboard-chart'],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/dashboard/chart`);
      if (!r.ok) throw new Error('Failed to fetch chart data');
      return r.json() as Promise<ChartPoint[]>;
    },
    staleTime: 60000,
  });

  const activityIcons: Record<string, string> = {
    client_created: '👤',
    client_deleted: '🗑️',
    invoice_created: '📄',
    invoice_paid: '✅',
    undo: '↩️',
    bulk_delete: '🗑️',
  };

  const hasChartData = chartData && chartData.some(d => d.earnings > 0 || d.expenses > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Click any card to navigate. Real-time overview of all client accounts.</p>
      </div>

      {isLoadingSummary || !summary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent><Skeleton className="h-8 w-16 mb-1" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Active Clients" value={summary.activeClients} subtitle={`Total: ${summary.totalClients}`} icon={Users} href="/clients" />
            <KpiCard title="eBay Accounts" value={summary.totalEbayAccounts} subtitle={`${summary.accountsWithIssues} with issues`} icon={ShoppingCart} alert={summary.accountsWithIssues > 0} href="/ebay-accounts" />
            <KpiCard title="Open Violations" value={summary.openViolationsCount} icon={AlertTriangle} alert={summary.openViolationsCount > 0} href="/violations" />
            <KpiCard title="Pending Tasks" value={summary.pendingTasksCount} subtitle={`${summary.overdueTasksCount} overdue`} icon={CheckSquare} alert={summary.overdueTasksCount > 0} href="/tasks" />
            <KpiCard title="Net Profit (Month)" value={`$${summary.netProfitThisMonth.toLocaleString()}`} icon={TrendingUp} href="/earnings" />
            <KpiCard title="Overdue Invoices" value={summary.overdueInvoicesCount} subtitle={`$${summary.overdueInvoicesAmount.toLocaleString()}`} icon={FileText} alert={summary.overdueInvoicesCount > 0} href="/invoices" />
            <KpiCard title="Expiring Cards" value={summary.expiringCardsCount} icon={CreditCard} alert={summary.expiringCardsCount > 0} href="/wise-cards" />
            <KpiCard title="Expenses (Month)" value={`$${summary.totalExpensesThisMonth.toLocaleString()}`} icon={Receipt} href="/expenses" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue & Profit Trend</CardTitle>
              <CardDescription>Last 12 months — earnings, expenses, and net profit</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingChart ? (
                <Skeleton className="h-64 w-full" />
              ) : !hasChartData ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No earnings or expenses recorded yet.</p>
                  <p className="text-xs mt-1">Add earnings and expenses to see your trend chart.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gradEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="earnings" name="Earnings" stroke="#22c55e" strokeWidth={2} fill="url(#gradEarnings)" dot={false} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gradExpenses)" dot={false} />
                    <Area type="monotone" dataKey="net" name="Net" stroke="#3b82f6" strokeWidth={2} fill="url(#gradNet)" dot={false} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions across all clients</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActivity || !recentActivity ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-3 w-[100px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No recent activity yet. Add clients, create invoices, or log tasks to see activity here.</div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="p-2 rounded-full bg-secondary text-secondary-foreground text-sm flex-shrink-0">
                          {activityIcons[activity.type ?? ''] ?? <Activity className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <p className="text-sm font-medium leading-tight">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.clientName && <span className="font-semibold text-primary">{activity.clientName}</span>}
                            {activity.clientName && ' • '}
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alerts Panel</CardTitle>
                <CardDescription>Click to navigate — requires immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.openViolationsCount > 0 && (
                    <AlertItem icon={AlertTriangle} title="Policy Violations" description={`${summary.openViolationsCount} unresolved eBay policy violations`} href="/violations" />
                  )}
                  {summary.overdueInvoicesCount > 0 && (
                    <AlertItem icon={FileText} title="Overdue Invoices" description={`${summary.overdueInvoicesCount} invoices overdue — $${summary.overdueInvoicesAmount.toLocaleString()} outstanding`} href="/invoices" />
                  )}
                  {summary.overdueTasksCount > 0 && (
                    <AlertItem icon={CheckSquare} title="Overdue Tasks" description={`${summary.overdueTasksCount} tasks past their due date`} href="/tasks" />
                  )}
                  {summary.expiringCardsCount > 0 && (
                    <AlertItem icon={CreditCard} title="Expiring Cards" description={`${summary.expiringCardsCount} Wise/payment cards expiring soon`} href="/wise-cards" color="amber" />
                  )}
                  {summary.accountsWithIssues > 0 && (
                    <AlertItem icon={ShoppingCart} title="eBay Account Issues" description={`${summary.accountsWithIssues} accounts need attention`} href="/ebay-accounts" />
                  )}
                  {summary.openViolationsCount === 0 && summary.overdueInvoicesCount === 0 && summary.overdueTasksCount === 0 && summary.expiringCardsCount === 0 && summary.accountsWithIssues === 0 && (
                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                      <Shield className="w-8 h-8 mb-2 opacity-50" />
                      <p className="font-medium">All clear!</p>
                      <p className="text-xs mt-1">No urgent alerts. Everything looks good.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
