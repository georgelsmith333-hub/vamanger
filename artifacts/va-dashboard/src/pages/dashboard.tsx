import React from 'react';
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetDashboardRecentActivity, getGetDashboardRecentActivityQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, ShoppingCart, FileText, AlertTriangle, CheckSquare, CreditCard, TrendingUp, Receipt, Activity, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: recentActivity, isLoading: isLoadingActivity } = useGetDashboardRecentActivity({
    query: { queryKey: getGetDashboardRecentActivityQueryKey() }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of all client accounts and critical alerts.</p>
      </div>

      {isLoadingSummary || !summary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Active Clients" value={summary.activeClients} subtitle={`Total: ${summary.totalClients}`} icon={Users} />
            <KpiCard title="eBay Accounts" value={summary.totalEbayAccounts} subtitle={`${summary.accountsWithIssues} with issues`} icon={ShoppingCart} alert={summary.accountsWithIssues > 0} />
            <KpiCard title="Open Violations" value={summary.openViolationsCount} icon={AlertTriangle} alert={summary.openViolationsCount > 0} />
            <KpiCard title="Pending Tasks" value={summary.pendingTasksCount} subtitle={`${summary.overdueTasksCount} overdue`} icon={CheckSquare} alert={summary.overdueTasksCount > 0} />
            
            <KpiCard title="Net Profit (Month)" value={`$${summary.netProfitThisMonth.toLocaleString()}`} icon={TrendingUp} />
            <KpiCard title="Overdue Invoices" value={summary.overdueInvoicesCount} subtitle={`$${summary.overdueInvoicesAmount.toLocaleString()}`} icon={FileText} alert={summary.overdueInvoicesCount > 0} />
            <KpiCard title="Expiring Cards" value={summary.expiringCardsCount} icon={CreditCard} alert={summary.expiringCardsCount > 0} />
            <KpiCard title="Expenses (Month)" value={`$${summary.totalExpensesThisMonth.toLocaleString()}`} icon={Receipt} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
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
                  <div className="text-center py-8 text-muted-foreground">No recent activity.</div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-secondary text-secondary-foreground">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.clientName && <span className="font-semibold text-primary">{activity.clientName}</span>}
                            {activity.clientName && " • "}
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Alerts Panel</CardTitle>
                <CardDescription>Requires immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                   {summary.openViolationsCount > 0 && (
                     <div className="flex items-center p-3 border border-destructive/50 bg-destructive/10 rounded-lg text-destructive">
                       <AlertTriangle className="w-5 h-5 mr-3" />
                       <div className="flex-1">
                         <h4 className="text-sm font-medium">Policy Violations</h4>
                         <p className="text-xs opacity-90">{summary.openViolationsCount} unresolved policy violations</p>
                       </div>
                     </div>
                   )}
                   {summary.overdueInvoicesCount > 0 && (
                     <div className="flex items-center p-3 border border-destructive/50 bg-destructive/10 rounded-lg text-destructive">
                       <FileText className="w-5 h-5 mr-3" />
                       <div className="flex-1">
                         <h4 className="text-sm font-medium">Overdue Invoices</h4>
                         <p className="text-xs opacity-90">{summary.overdueInvoicesCount} invoices overdue totaling ${summary.overdueInvoicesAmount.toLocaleString()}</p>
                       </div>
                     </div>
                   )}
                   {summary.overdueTasksCount > 0 && (
                     <div className="flex items-center p-3 border border-destructive/50 bg-destructive/10 rounded-lg text-destructive">
                       <CheckSquare className="w-5 h-5 mr-3" />
                       <div className="flex-1">
                         <h4 className="text-sm font-medium">Overdue Tasks</h4>
                         <p className="text-xs opacity-90">{summary.overdueTasksCount} tasks past due date</p>
                       </div>
                     </div>
                   )}
                   {summary.expiringCardsCount > 0 && (
                     <div className="flex items-center p-3 border border-amber-500/50 bg-amber-500/10 rounded-lg text-amber-500">
                       <CreditCard className="w-5 h-5 mr-3" />
                       <div className="flex-1">
                         <h4 className="text-sm font-medium">Expiring Cards</h4>
                         <p className="text-xs opacity-90">{summary.expiringCardsCount} cards expiring soon</p>
                       </div>
                     </div>
                   )}
                   {summary.openViolationsCount === 0 && summary.overdueInvoicesCount === 0 && summary.overdueTasksCount === 0 && summary.expiringCardsCount === 0 && (
                     <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                       <Shield className="w-8 h-8 mb-2 opacity-50" />
                       <p>All clear. No urgent alerts.</p>
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

function KpiCard({ title, value, subtitle, icon: Icon, alert }: { title: string; value: string | number; subtitle?: string; icon: React.ElementType; alert?: boolean }) {
  return (
    <Card className={`relative overflow-hidden ${alert ? 'border-destructive/50' : ''}`}>
      {alert && <div className="absolute top-0 right-0 w-2 h-2 m-2 rounded-full bg-destructive" />}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${alert ? 'text-destructive' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
