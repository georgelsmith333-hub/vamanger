import React, { useState } from "react";
import { Download, CheckCircle2, AlertCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const ENTITIES = [
  { key: "clients", label: "Clients", description: "Client profiles, contact info, rates", icon: "👥" },
  { key: "ebay-accounts", label: "eBay Accounts", description: "All eBay accounts with health status", icon: "🛍️" },
  { key: "wise-cards", label: "Wise Cards", description: "Payment cards and balances", icon: "💳" },
  { key: "bank-accounts", label: "Bank Accounts", description: "Bank account details", icon: "🏦" },
  { key: "invoices", label: "Invoices", description: "All invoices and payment status", icon: "📄" },
  { key: "violations", label: "Violations", description: "eBay policy violations log", icon: "⚠️" },
  { key: "tasks", label: "Tasks", description: "All VA tasks across clients", icon: "✅" },
  { key: "earnings", label: "Earnings", description: "Monthly earning records", icon: "📈" },
  { key: "expenses", label: "Expenses", description: "Business expenses", icon: "💸" },
  { key: "recovery", label: "Recovery & 2FA", description: "Sensitive recovery data", icon: "🔐" },
  { key: "daily-logins", label: "Daily Logins", description: "Login tracker data", icon: "📅" },
  { key: "audit-log", label: "Audit Log", description: "Full system audit trail", icon: "🔍" },
];

export default function AdminExport() {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  const handleExport = async (entity: { key: string; label: string }) => {
    setDownloading(entity.key);
    try {
      const res = await fetch(`${BASE}/api/admin/export/${entity.key}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entity.key}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(prev => new Set([...prev, entity.key]));
      toast({ title: "Export Downloaded", description: `${entity.label} data exported as CSV.` });
    } catch (err) {
      toast({ title: "Export Failed", description: String(err), variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  const handleExportAll = async () => {
    for (const entity of ENTITIES) {
      await handleExport(entity);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Export</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Download all data as CSV files for backup or analysis</p>
        </div>
        <Button onClick={handleExportAll} disabled={!!downloading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Download className="w-4 h-4 mr-2" />Export All
        </Button>
      </div>

      {/* Warning for sensitive data */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-zinc-300">
          <strong className="text-amber-400">Sensitive Data:</strong> Recovery & 2FA exports contain sensitive credentials. Store CSV files securely and delete when no longer needed.
        </p>
      </div>

      {/* Export Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {ENTITIES.map(entity => {
          const isDone = downloaded.has(entity.key);
          const isLoading = downloading === entity.key;
          return (
            <div key={entity.key} className={`rounded-lg border p-4 transition-all ${isDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{entity.icon}</span>
                  <div>
                    <p className="font-medium text-zinc-200">{entity.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{entity.description}</p>
                  </div>
                </div>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700">.csv</Badge>
                <Button
                  size="sm"
                  variant={isDone ? "outline" : "default"}
                  onClick={() => handleExport(entity)}
                  disabled={isLoading}
                  className={isDone ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "bg-zinc-700 hover:bg-zinc-600 text-zinc-100"}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-1"><Database className="w-3 h-3 animate-pulse" />Exporting...</span>
                  ) : isDone ? (
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Downloaded</span>
                  ) : (
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />Download</span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-500">
        <p className="font-medium text-zinc-400 mb-1">About CSV Exports</p>
        <p>All exports are generated in real-time directly from the database. Sensitive fields (passwords, tokens) are exported as-is — handle with care. Use these files for Excel analysis, backup archives, or migrating data to other systems.</p>
      </div>
    </div>
  );
}
