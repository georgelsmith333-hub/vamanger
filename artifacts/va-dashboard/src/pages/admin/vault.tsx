import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Lock, CheckCircle, XCircle, Key, Database,
  Globe, Server, RefreshCw, AlertTriangle, ChevronDown, ChevronRight,
  Layers, TestTube, KeyRound, ShieldCheck
} from "lucide-react";

import { API_BASE as BASE } from "@/lib/api-base";
const VAULT_TOKEN_KEY = "va_vault_token";

const getToken = () => sessionStorage.getItem(VAULT_TOKEN_KEY);
const setToken = (t: string) => sessionStorage.setItem(VAULT_TOKEN_KEY, t);
const clearToken = () => sessionStorage.removeItem(VAULT_TOKEN_KEY);

interface Credential {
  key: string;
  label: string;
  group: string;
  description: string;
  set: boolean;
  masked: string;
}

interface TechEntry {
  layer: string;
  tech: string;
  detail: string;
  status: string;
}

interface VaultData {
  credentials: Credential[];
  techStack: TechEntry[];
  allSet: boolean;
}

const GROUP_ICONS: Record<string, React.ReactNode> = {
  "Google OAuth": <Globe className="w-4 h-4 text-blue-400" />,
  "Google Sheets": <Database className="w-4 h-4 text-green-400" />,
  "Google Cloud": <Server className="w-4 h-4 text-yellow-400" />,
  "Security": <Shield className="w-4 h-4 text-red-400" />,
  "Database": <Database className="w-4 h-4 text-purple-400" />,
};

const STATUS_COLORS: Record<string, string> = {
  live: "bg-green-500/20 text-green-400 border-green-500/30",
  configured: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  deploying: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  pending: "bg-muted text-muted-foreground border-border",
};

function VaultLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/admin/vault/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLocked(true);
          setError("Too many failed attempts. Locked for 5 minutes.");
          setTimeout(() => { setLocked(false); setAttempts(0); }, 5 * 60 * 1000);
        } else {
          setError(`Incorrect password. ${5 - newAttempts} attempt(s) remaining.`);
        }
      } else {
        setToken(data.token);
        onSuccess();
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-900/40">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold">Secrets Vault</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Step 2 of 2 — Vault authentication required
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300">This vault contains sensitive credentials. All access is logged.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Vault Password</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter vault password"
              disabled={locked}
              className="bg-zinc-900 border-zinc-700"
              autoComplete="current-password"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter the vault password set by your administrator</p>
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 flex items-center gap-2">
              <XCircle className="w-3 h-3 flex-shrink-0" /> {error}
            </div>
          )}
          <Button type="submit" className="w-full bg-red-700 hover:bg-red-600" disabled={loading || locked}>
            <Lock className="w-4 h-4 mr-2" />
            {loading ? "Verifying…" : "Unlock Vault"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function VaultContent({ onLock }: { onLock: () => void }) {
  const { toast } = useToast();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "Google OAuth": true, "Google Sheets": true, "Google Cloud": true, "Security": true, "Database": true });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpForm, setCpForm] = useState({ current: "", newPass: "", confirm: "" });
  const token = getToken() ?? "";

  const { data, isLoading, refetch } = useQuery<VaultData>({
    queryKey: ["vault-status"],
    queryFn: () => fetch(`${BASE}/api/admin/vault/status`, { headers: { "x-vault-token": token } }).then(r => r.json()),
  });

  const testSheets = useMutation({
    mutationFn: () => fetch(`${BASE}/api/admin/vault/test-sheets`, { method: "POST", headers: { "x-vault-token": token } }).then(r => r.json()),
    onSuccess: (d: any) => toast({ title: d.success ? "Connection Successful" : "Connection Failed", description: d.message, variant: d.success ? "default" : "destructive" }),
  });

  const changePassword = useMutation({
    mutationFn: () => fetch(`${BASE}/api/admin/vault/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vault-token": token },
      body: JSON.stringify({ currentPassword: cpForm.current, newPassword: cpForm.newPass }),
    }).then(r => r.json()),
    onSuccess: (d: any) => {
      if (d.success) { toast({ title: "Password Changed", description: "All vault sessions have been invalidated." }); clearToken(); onLock(); }
      else toast({ title: "Error", description: d.error, variant: "destructive" });
    },
  });

  const toggleGroup = (g: string) => setExpandedGroups(p => ({ ...p, [g]: !p[g] }));

  const grouped = data?.credentials.reduce((acc, c) => {
    if (!acc[c.group]) acc[c.group] = [];
    acc[c.group].push(c);
    return acc;
  }, {} as Record<string, Credential[]>) ?? {};

  const allSet = data?.allSet ?? false;
  const setCount = data?.credentials.filter(c => c.set).length ?? 0;
  const totalCount = data?.credentials.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-400" /> Secrets Vault
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Credential status, tech stack, and operational controls</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-8">
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onLock} className="gap-1 h-8 text-muted-foreground">
            <Lock className="w-3 h-3" /> Lock
          </Button>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl p-4 border flex items-center gap-3 ${allSet ? "bg-green-500/10 border-green-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
        {allSet ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
        <div>
          <p className={`font-semibold text-sm ${allSet ? "text-green-400" : "text-amber-400"}`}>
            {allSet ? "All credentials configured" : `${setCount} of ${totalCount} credentials set`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allSet ? "System is fully configured and operational." : "Some credentials are missing — features may not work correctly."}
          </p>
        </div>
      </div>

      {/* Credentials by group */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading vault…</div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([group, creds]) => (
            <div key={group} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                onClick={() => toggleGroup(group)}
              >
                <div className="flex items-center gap-2">
                  {GROUP_ICONS[group] ?? <Key className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-medium text-sm">{group}</span>
                  <Badge variant="outline" className="text-xs ml-1">
                    {creds.filter(c => c.set).length}/{creds.length}
                  </Badge>
                </div>
                {expandedGroups[group] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>

              {expandedGroups[group] && (
                <div className="divide-y divide-border border-t border-border">
                  {creds.map(c => (
                    <div key={c.key} className="px-4 py-3 flex items-start gap-3">
                      <div className="mt-0.5">
                        {c.set
                          ? <CheckCircle className="w-4 h-4 text-green-400" />
                          : <XCircle className="w-4 h-4 text-red-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded font-mono">{c.key}</code>
                          <span className="text-xs text-muted-foreground">{c.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <code className="text-xs font-mono text-muted-foreground bg-zinc-900 px-2 py-1 rounded flex-1 min-w-0 break-all">
                            {c.masked}
                          </code>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${c.set ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                        {c.set ? "SET" : "MISSING"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Operational Controls */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <TestTube className="w-4 h-4 text-blue-400" /> Operational Controls
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/20 rounded-lg p-3 border border-border">
            <p className="text-xs font-medium mb-1">Google Sheets Sync</p>
            <p className="text-xs text-muted-foreground mb-3">Test the service account connection to your spreadsheet</p>
            <Button size="sm" variant="outline" className="h-7 text-xs w-full" onClick={() => testSheets.mutate()} disabled={testSheets.isPending}>
              {testSheets.isPending ? "Testing…" : "Test Connection"}
            </Button>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 border border-border">
            <p className="text-xs font-medium mb-1">Vault Password</p>
            <p className="text-xs text-muted-foreground mb-3">Change the vault access password (invalidates all sessions)</p>
            <Button size="sm" variant="outline" className="h-7 text-xs w-full" onClick={() => setShowChangePassword(p => !p)}>
              Change Password
            </Button>
          </div>
        </div>

        {showChangePassword && (
          <div className="mt-4 p-4 bg-zinc-900 rounded-lg border border-zinc-700 space-y-3">
            <p className="text-xs font-medium text-amber-400">⚠ Changing the vault password will lock all active vault sessions</p>
            <Input className="h-8 text-xs" type="password" placeholder="Current vault password" value={cpForm.current} onChange={e => setCpForm(p => ({ ...p, current: e.target.value }))} />
            <Input className="h-8 text-xs" type="password" placeholder="New password (min 8 chars)" value={cpForm.newPass} onChange={e => setCpForm(p => ({ ...p, newPass: e.target.value }))} />
            <Input className="h-8 text-xs" type="password" placeholder="Confirm new password" value={cpForm.confirm} onChange={e => setCpForm(p => ({ ...p, confirm: e.target.value }))} />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={() => {
                if (cpForm.newPass !== cpForm.confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
                changePassword.mutate();
              }} disabled={changePassword.isPending || !cpForm.current || !cpForm.newPass}>
                {changePassword.isPending ? "Changing…" : "Confirm Change"}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowChangePassword(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* Tech Stack */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Tech Stack</h3>
        </div>
        <div className="divide-y divide-border">
          {(data?.techStack ?? []).map(t => (
            <div key={t.layer} className="px-4 py-3 flex items-center gap-4">
              <div className="w-28 flex-shrink-0">
                <span className="text-xs text-muted-foreground">{t.layer}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.tech}</p>
                <p className="text-xs text-muted-foreground truncate">{t.detail}</p>
              </div>
              <Badge variant="outline" className={`text-xs flex-shrink-0 ${STATUS_COLORS[t.status] ?? STATUS_COLORS.pending}`}>
                {t.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-red-400">Security Notice</p>
          <p className="text-xs text-muted-foreground mt-1">
            Credentials shown here are masked — only first/last 4 characters are visible.
            Full values are never transmitted to the browser. This vault session expires in 30 minutes.
            All vault access is protected by a separate password from the admin panel.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminVault() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) setUnlocked(true);
  }, []);

  const handleLock = () => { clearToken(); setUnlocked(false); };

  return unlocked ? <VaultContent onLock={handleLock} /> : <VaultLogin onSuccess={() => setUnlocked(true)} />;
}
