import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch, adminPut, type Setting } from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, Settings as SettingsIcon } from "lucide-react";

const GROUP_LABELS: Record<string, string> = {
  general: "General",
  invoices: "Invoices",
  tasks: "Tasks",
  logins: "Daily Logins",
  cards: "Cards & Wallets",
  admin: "Admin & Security",
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ["admin-settings"],
    queryFn: () => adminFetch<Setting[]>("/settings"),
  });

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      settings.forEach(s => { vals[s.key] = s.value ?? ""; });
      setLocalValues(vals);
      setDirty(new Set());
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (updates: Record<string, string>) => adminPut<{ success: boolean }>("/settings", updates),
    onSuccess: () => {
      toast({ title: "Settings Saved", description: "All changes have been saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setDirty(new Set());
    },
    onError: (err: Error) => {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleChange = (key: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
    setDirty(prev => new Set([...prev, key]));
  };

  const handleSaveAll = () => {
    const updates: Record<string, string> = {};
    dirty.forEach(k => { updates[k] = localValues[k] ?? ""; });
    if (Object.keys(updates).length === 0) {
      toast({ title: "No Changes", description: "Nothing to save." });
      return;
    }
    saveMutation.mutate(updates);
  };

  const handleReset = () => {
    if (settings) {
      const vals: Record<string, string> = {};
      settings.forEach(s => { vals[s.key] = s.value ?? ""; });
      setLocalValues(vals);
      setDirty(new Set());
    }
  };

  const grouped = settings ? settings.reduce<Record<string, Setting[]>>((acc, s) => {
    const g = s.group ?? "general";
    if (!acc[g]) acc[g] = [];
    acc[g].push(s);
    return acc;
  }, {}) : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Configure system-wide defaults and behavior</p>
        </div>
        <div className="flex gap-2">
          {dirty.size > 0 && (
            <Button variant="outline" size="sm" onClick={handleReset} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <RefreshCw className="w-3 h-3 mr-2" />Reset
            </Button>
          )}
          <Button size="sm" onClick={handleSaveAll} disabled={saveMutation.isPending || dirty.size === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="w-3 h-3 mr-2" />
            Save{dirty.size > 0 ? ` (${dirty.size})` : ""}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-32 bg-zinc-800" />
              {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-16 w-full bg-zinc-800 rounded-lg" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, groupSettings]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                <SettingsIcon className="w-4 h-4 text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">{GROUP_LABELS[group] || group}</h2>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
              <div className="grid gap-3">
                {groupSettings.map(s => (
                  <div key={s.key} className={`rounded-lg border p-4 transition-colors ${dirty.has(s.key) ? "border-blue-500/40 bg-blue-500/5" : "border-zinc-800 bg-zinc-900"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                          {s.label}
                          {dirty.has(s.key) && <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">Modified</Badge>}
                        </label>
                        <p className="text-xs text-zinc-600 mt-0.5 font-mono">{s.key}</p>
                      </div>
                      <div className="w-64">
                        {s.key === "allow_bulk_delete" ? (
                          <select
                            value={localValues[s.key] ?? "true"}
                            onChange={e => handleChange(s.key, e.target.value)}
                            className="w-full h-9 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm px-3"
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        ) : (
                          <Input
                            value={localValues[s.key] ?? ""}
                            onChange={e => handleChange(s.key, e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-zinc-100 h-9"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
