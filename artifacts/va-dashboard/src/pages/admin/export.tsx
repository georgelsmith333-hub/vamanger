import React, { useState, useRef } from "react";
import { Download, CheckCircle2, AlertCircle, Database, Upload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { API_PREFIX } from "@/lib/api-base";

function RestoreSection({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [result, setResult] = useState<{ restored: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
    setResult(null);
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    if (!confirm("This will INSERT records from the backup into the database. Existing records are not deleted. Continue?")) return;
    setRestoring(true);
    setResult(null);
    try {
      const text = await selectedFile.text();
      const json = JSON.parse(text);
      const res = await fetch(`${API_PREFIX}/admin/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await res.json() as { restored: number; errors: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Restore failed");
      setResult({ restored: data.restored, errors: data.errors ?? [] });
      toast({ title: "Restore Complete", description: `${data.restored} records inserted.${data.errors?.length ? ` ${data.errors.length} errors.` : ""}` });
    } catch (err) {
      toast({ title: "Restore Failed", description: String(err), variant: "destructive" });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <RotateCcw className="w-5 h-5 text-amber-400" />
        <div>
          <p className="font-semibold text-zinc-100">Restore Backup</p>
          <p className="text-xs text-zinc-500">Import records from a previously downloaded JSON backup file</p>
        </div>
      </div>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-zinc-300">
          Restore <strong>adds</strong> records — it does NOT wipe existing data. Duplicates are silently skipped. Take a full backup before restoring.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {selectedFile ? selectedFile.name : "Choose Backup File"}
        </Button>
        {selectedFile && (
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleRestore}
            disabled={restoring}
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${restoring ? "animate-spin" : ""}`} />
            {restoring ? "Restoring..." : "Restore Backup"}
          </Button>
        )}
      </div>
      {result && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${result.errors.length > 0 ? "border-amber-500/30 bg-amber-500/5 text-amber-300" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"}`}>
          <p className="font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {result.restored} records restored successfully.
            {result.errors.length > 0 && ` ${result.errors.length} error(s) encountered.`}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-xs space-y-0.5 text-amber-400">
              {result.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

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
      const res = await fetch(`${API_PREFIX}/admin/export/${entity.key}`);
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

  const handleFullBackup = async () => {
    setDownloading("__backup__");
    try {
      const res = await fetch(`${API_PREFIX}/admin/backup`);
      if (!res.ok) throw new Error("Backup failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `va-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Full Backup Downloaded", description: "Complete JSON backup saved. Store it securely." });
    } catch (err) {
      toast({ title: "Backup Failed", description: String(err), variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Export</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Download all data as CSV files for backup or analysis</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleFullBackup} disabled={!!downloading} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <Database className="w-4 h-4 mr-2" />{downloading === "__backup__" ? "Backing up..." : "Full JSON Backup"}
          </Button>
          <Button onClick={handleExportAll} disabled={!!downloading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Download className="w-4 h-4 mr-2" />Export All CSVs
          </Button>
        </div>
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

      {/* Restore Section */}
      <RestoreSection toast={toast} />
    </div>
  );
}
