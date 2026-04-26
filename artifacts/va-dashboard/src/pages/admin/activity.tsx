import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch, adminPost, type AuditEntry } from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  RotateCcw, Search, Filter, CheckCircle2, AlertCircle,
  PlusCircle, Edit3, Trash2, RefreshCw
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  UPDATE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  CREATE: PlusCircle,
  UPDATE: Edit3,
  DELETE: Trash2,
};

const TABLES = ["clients", "ebay_accounts", "wise_cards", "bank_accounts", "invoices", "violations", "tasks", "earnings", "expenses", "recovery_entries", "daily_logins"];

export default function AdminActivity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: entries, isLoading, refetch } = useQuery<AuditEntry[]>({
    queryKey: ["admin-audit", tableFilter],
    queryFn: () => adminFetch<AuditEntry[]>(`/audit?limit=200${tableFilter !== "all" ? `&table=${tableFilter}` : ""}`),
  });

  const undoMutation = useMutation({
    mutationFn: (id: number) => adminPost<{ success: boolean; message: string }>(`/audit/${id}/undo`),
    onSuccess: (data) => {
      toast({ title: "Action Undone", description: data.message, variant: "default" });
      queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => {
      toast({ title: "Undo Failed", description: err.message, variant: "destructive" });
    },
  });

  const filtered = entries?.filter(e => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.tableName.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || e.action === actionFilter;
    return matchSearch && matchAction;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Every data change is tracked. Undo any action that supports restoration.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
          <RefreshCw className="w-3 h-3 mr-2" />Refresh
        </Button>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-zinc-300">
          <strong className="text-blue-400">How Undo Works:</strong> For <span className="text-emerald-400">CREATE</span> actions, the record is deleted. For <span className="text-blue-400">UPDATE</span> actions, the previous values are restored. For <span className="text-red-400">DELETE</span> actions, the record is re-created. Only supported entities (clients, invoices, tasks, violations, eBay accounts) can be undone automatically.
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
          <Input placeholder="Search actions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-100 h-9" />
        </div>
        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="w-44 bg-zinc-900 border-zinc-700 text-zinc-200 h-9">
            <Filter className="w-3 h-3 mr-2 text-zinc-500" /><SelectValue placeholder="All tables" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All tables</SelectItem>
            {TABLES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36 bg-zinc-900 border-zinc-700 text-zinc-200 h-9">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="CREATE">CREATE</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-zinc-500">{filtered.length} entries</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-[80px_120px_140px_1fr_100px_80px] bg-zinc-900 border-b border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          <span>Action</span>
          <span>Table</span>
          <span>Record ID</span>
          <span>Description</span>
          <span>When</span>
          <span className="text-right">Undo</span>
        </div>

        <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto">
          {isLoading ? Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[80px_120px_140px_1fr_100px_80px] px-4 py-3 items-center gap-2">
              <Skeleton className="h-5 w-16 bg-zinc-800" />
              <Skeleton className="h-4 w-20 bg-zinc-800" />
              <Skeleton className="h-4 w-12 bg-zinc-800" />
              <Skeleton className="h-4 w-full bg-zinc-800" />
              <Skeleton className="h-4 w-20 bg-zinc-800" />
            </div>
          )) : filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-zinc-500">No audit entries found.</div>
          ) : filtered.map(entry => {
            const Icon = ACTION_ICONS[entry.action] || Edit3;
            const canUndo = !entry.undone && ["clients", "ebay_accounts", "invoices", "tasks", "violations"].includes(entry.tableName);
            return (
              <div key={entry.id} className={`grid grid-cols-[80px_120px_140px_1fr_100px_80px] px-4 py-3 items-center gap-2 hover:bg-zinc-900/50 transition ${entry.undone ? "opacity-40" : ""}`}>
                <div>
                  <Badge className={`text-xs ${ACTION_COLORS[entry.action] || "bg-zinc-700 text-zinc-300"}`}>
                    <Icon className="w-2.5 h-2.5 mr-1" />{entry.action}
                  </Badge>
                </div>
                <span className="text-xs text-zinc-400 font-mono">{entry.tableName}</span>
                <span className="text-xs text-zinc-500">{entry.recordId ? `#${entry.recordId}` : "-"}</span>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{entry.description}</p>
                  {entry.undone && <p className="text-xs text-amber-500">↩ Undone at {entry.undoneAt ? new Date(entry.undoneAt).toLocaleString() : "-"}</p>}
                </div>
                <span className="text-xs text-zinc-600">
                  {new Date(entry.createdAt).toLocaleDateString()}<br />
                  <span className="text-zinc-700">{new Date(entry.createdAt).toLocaleTimeString()}</span>
                </span>
                <div className="text-right">
                  {entry.undone ? (
                    <CheckCircle2 className="w-4 h-4 text-zinc-600 ml-auto" />
                  ) : canUndo ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Undo: "${entry.description}"?\n\nThis will revert the data change.`)) {
                          undoMutation.mutate(entry.id);
                        }
                      }}
                      disabled={undoMutation.isPending}
                      className="h-7 text-xs text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />Undo
                    </Button>
                  ) : (
                    <span className="text-xs text-zinc-700">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
