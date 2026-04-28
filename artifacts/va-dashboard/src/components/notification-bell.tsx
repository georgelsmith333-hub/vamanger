import React, { useState, useRef, useEffect } from "react";
import { Bell, X, Check, AlertTriangle, FileText, CheckSquare, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetDashboardSummary } from "@workspace/api-client-react";

import { API_BASE as BASE } from "@/lib/api-base";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: string;
  entityType?: string;
  entityId?: number;
  readAt?: string;
  createdAt: string;
}

const severityIcon = (severity: string, type: string) => {
  if (type === "OVERDUE_INVOICE" || type === "LOW_BALANCE") return <FileText className="w-4 h-4 text-amber-400" />;
  if (type === "NEW_VIOLATION" || type === "ACCOUNT_RESTRICTION") return <AlertTriangle className="w-4 h-4 text-red-400" />;
  if (type === "TASK_DUE") return <CheckSquare className="w-4 h-4 text-blue-400" />;
  return <Info className="w-4 h-4 text-muted-foreground" />;
};

const entityLink = (entityType?: string, entityId?: number) => {
  if (!entityType) return null;
  const map: Record<string, string> = {
    invoices: "/invoices", violations: "/violations", tasks: "/tasks",
    clients: "/clients", ebay_accounts: "/ebay-accounts",
  };
  return map[entityType] ?? null;
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: summary } = useGetDashboardSummary({});
  const alertCount = (summary?.openViolationsCount ?? 0) + (summary?.overdueInvoicesCount ?? 0) + (summary?.pendingTasksCount ?? 0);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => fetch(`${BASE}/api/notifications`).then(r => r.json()),
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.readAt).length;
  const totalBadge = Math.max(unreadCount, alertCount);

  const markRead = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/notifications/${id}/read`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => fetch(`${BASE}/api/notifications/read-all`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteNotif = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/notifications/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const systemAlerts: Notification[] = [];
  if ((summary?.overdueInvoicesCount ?? 0) > 0) {
    systemAlerts.push({ id: -1, type: "OVERDUE_INVOICE", title: "Overdue Invoices", message: `${summary!.overdueInvoicesCount} invoice(s) are overdue`, severity: "warning", entityType: "invoices", createdAt: new Date().toISOString() });
  }
  if ((summary?.openViolationsCount ?? 0) > 0) {
    systemAlerts.push({ id: -2, type: "NEW_VIOLATION", title: "Open Violations", message: `${summary!.openViolationsCount} violation(s) need attention`, severity: "error", entityType: "violations", createdAt: new Date().toISOString() });
  }
  if ((summary?.pendingTasksCount ?? 0) > 0) {
    systemAlerts.push({ id: -3, type: "TASK_DUE", title: "Pending Tasks", message: `${summary!.pendingTasksCount} task(s) are pending`, severity: "info", entityType: "tasks", createdAt: new Date().toISOString() });
  }

  const allItems = [...systemAlerts, ...notifications].slice(0, 20);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => setOpen(o => !o)}>
        <Bell className="w-4 h-4" />
        {totalBadge > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-bold leading-none">
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Notifications</span>
              {totalBadge > 0 && <Badge className="bg-destructive text-white text-xs px-1.5 py-0">{totalBadge}</Badge>}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => markAllRead.mutate()}>
                  <Check className="w-3 h-3 mr-1" /> All read
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {allItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">All clear — no alerts</p>
              </div>
            ) : (
              allItems.map((n) => {
                const link = entityLink(n.entityType, n.entityId);
                const isSystem = n.id < 0;
                const isRead = !!n.readAt;
                const content = (
                  <div className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${!isRead && !isSystem ? "bg-primary/5" : ""}`}>
                    <div className="mt-0.5 flex-shrink-0">{severityIcon(n.severity, n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${!isRead && !isSystem ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!isSystem && (
                      <div className="flex flex-col gap-1">
                        {!isRead && (
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.preventDefault(); e.stopPropagation(); markRead.mutate(n.id); }}>
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={e => { e.preventDefault(); e.stopPropagation(); deleteNotif.mutate(n.id); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
                return link ? (
                  <Link key={n.id} href={link} onClick={() => { if (!isSystem) markRead.mutate(n.id); setOpen(false); }}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>

          <div className="border-t border-border px-4 py-2 bg-muted/20">
            <Link href="/admin" onClick={() => setOpen(false)}>
              <span className="text-xs text-primary hover:underline cursor-pointer">Manage notification settings →</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
