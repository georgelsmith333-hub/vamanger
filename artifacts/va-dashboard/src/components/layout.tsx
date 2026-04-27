import React from 'react';
import { useLocation, Link } from 'wouter';
import {
  LayoutDashboard, Users, ShoppingCart, CreditCard, Landmark,
  FileText, AlertTriangle, CheckSquare, TrendingUp, Receipt, Shield,
  CalendarDays, Menu, Bell, Search, Settings, ChevronRight, X, BookOpen, Sheet, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/ebay-accounts', label: 'eBay Accounts', icon: ShoppingCart },
  { href: '/wise-cards', label: 'Wise Cards', icon: CreditCard },
  { href: '/bank-accounts', label: 'Bank Accounts', icon: Landmark },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/violations', label: 'Violations', icon: AlertTriangle },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/earnings', label: 'Earnings', icon: TrendingUp },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/recovery', label: 'Recovery & 2FA', icon: Shield },
  { href: '/daily-login', label: 'Daily Logins', icon: CalendarDays },
  { href: '/sheets-sync', label: 'Sheets Sync', icon: Sheet },
  { href: '/manual', label: 'User Manual', icon: BookOpen },
  { href: '/download', label: 'Get the Apps', icon: Download },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const { data: summary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });

  const alertCount = (summary?.openViolationsCount ?? 0) + (summary?.overdueInvoicesCount ?? 0) + (summary?.pendingTasksCount ?? 0);

  const pageTitles: Record<string, string> = {
    '/': 'Dashboard', '/clients': 'Clients', '/ebay-accounts': 'eBay Accounts',
    '/wise-cards': 'Wise Cards', '/bank-accounts': 'Bank Accounts', '/invoices': 'Invoices',
    '/violations': 'Violations', '/tasks': 'Tasks', '/earnings': 'Earnings',
    '/expenses': 'Expenses', '/recovery': 'Recovery & 2FA', '/daily-login': 'Daily Logins',
  };
  const pageTitle = pageTitles[location] || 'VA Client Manager';

  return (
    <div className="flex h-screen bg-background overflow-hidden dark text-foreground">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex md:flex-col`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
              VA
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">Client Manager</span>
              <p className="text-xs text-muted-foreground leading-none">eBay VA Platform</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            const badge = item.href === '/violations' ? (summary?.openViolationsCount ?? 0) :
              item.href === '/invoices' ? (summary?.overdueInvoicesCount ?? 0) :
              item.href === '/tasks' ? (summary?.pendingTasksCount ?? 0) : 0;
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-sm flex-1">{item.label}</span>
                {badge > 0 && (
                  <Badge className={`h-4 min-w-4 text-xs px-1 ${item.href === '/violations' ? 'bg-destructive text-white' : 'bg-amber-500 text-white'}`}>
                    {badge}
                  </Badge>
                )}
                {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
              </Link>
            );
          })}
        </div>

        {/* Bottom section */}
        <div className="flex-shrink-0 border-t border-sidebar-border">
          <div className="p-3">
            <Link href="/admin">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all cursor-pointer">
                <Settings className="w-4 h-4" />
                <span className="text-xs">Admin Panel</span>
              </div>
            </Link>
          </div>
          <div className="px-4 py-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-semibold text-xs">
                AD
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">Admin User</span>
                <span className="text-xs text-muted-foreground truncate">admin@va.com</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-4 h-4" />
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{pageTitle}</span>
            </div>
            <div className="relative w-56 hidden lg:block">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." className="w-full pl-9 bg-background border-muted h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Alert summary */}
            {alertCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {alertCount} alert{alertCount !== 1 ? 's' : ''} need attention
              </div>
            )}
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-bold leading-none">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </Button>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          <div className="mx-auto max-w-7xl space-y-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
