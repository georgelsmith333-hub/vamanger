import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, Monitor, MailCheck, AlertTriangle, FileText, CheckSquare, Info, CreditCard, Users, TrendingDown } from "lucide-react";

import { API_BASE as BASE } from "@/lib/api-base";
import { getAdminToken } from "@/pages/admin/login";

function authHeaders() {
  const token = getAdminToken();
  return token ? { "Content-Type": "application/json", "X-Admin-Token": token } : { "Content-Type": "application/json" };
}
const fetchJson = <T,>(url: string): Promise<T> => fetch(url, { headers: authHeaders() }).then(r => r.json());

interface NotificationRule {
  id: number;
  eventType: string;
  label: string;
  enabled: boolean;
  channels: string;
  emailRecipients?: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  OVERDUE_INVOICE: <FileText className="w-4 h-4 text-amber-400" />,
  NEW_VIOLATION: <AlertTriangle className="w-4 h-4 text-red-400" />,
  ACCOUNT_RESTRICTION: <AlertTriangle className="w-4 h-4 text-red-500" />,
  TASK_DUE: <CheckSquare className="w-4 h-4 text-blue-400" />,
  CLIENT_INACTIVE: <Users className="w-4 h-4 text-muted-foreground" />,
  CARD_EXPIRY: <CreditCard className="w-4 h-4 text-purple-400" />,
  LOW_BALANCE: <TrendingDown className="w-4 h-4 text-orange-400" />,
  DAILY_SUMMARY: <Info className="w-4 h-4 text-muted-foreground" />,
};

const CHANNEL_OPTIONS = [
  { value: "app", label: "App only", icon: <Monitor className="w-3 h-3" /> },
  { value: "email", label: "Email only", icon: <Mail className="w-3 h-3" /> },
  { value: "both", label: "App + Email", icon: <MailCheck className="w-3 h-3" /> },
];

export default function AdminNotificationsConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localRules, setLocalRules] = React.useState<Record<number, Partial<NotificationRule>>>({});

  const { data: rules = [], isLoading } = useQuery<NotificationRule[]>({
    queryKey: ["notification-rules"],
    queryFn: () => fetchJson<NotificationRule[]>(`${BASE}/api/notification-rules`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<NotificationRule>) =>
      fetch(`${BASE}/api/notification-rules/${id}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Notification rule saved" });
      queryClient.invalidateQueries({ queryKey: ["notification-rules"] });
      setLocalRules({});
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const getLocal = (rule: NotificationRule) => ({ ...rule, ...localRules[rule.id] });
  const setLocal = (id: number, patch: Partial<NotificationRule>) =>
    setLocalRules(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleSave = (rule: NotificationRule) => {
    const local = getLocal(rule);
    updateMutation.mutate({ id: rule.id, enabled: local.enabled, channels: local.channels, emailRecipients: local.emailRecipients });
  };

  const activeCount = rules.filter(r => r.enabled).length;
  const emailCount = rules.filter(r => r.channels === "email" || r.channels === "both").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Notification Rules</h2>
        <p className="text-sm text-muted-foreground mt-1">Control when and how you receive alerts. Changes take effect immediately.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Active Rules</p>
          <p className="text-2xl font-bold text-primary">{activeCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Email Alerts</p>
          <p className="text-2xl font-bold text-blue-400">{emailCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Events</p>
          <p className="text-2xl font-bold">{rules.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading rules…</div>
        ) : rules.map(rule => {
          const local = getLocal(rule);
          const isDirty = JSON.stringify(local) !== JSON.stringify(rule);
          return (
            <div key={rule.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{EVENT_ICONS[rule.eventType] ?? <Bell className="w-4 h-4 text-muted-foreground" />}</div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{rule.label}</p>
                      <p className="text-xs text-muted-foreground">{rule.eventType}</p>
                    </div>
                    <Switch
                      checked={local.enabled}
                      onCheckedChange={v => setLocal(rule.id, { enabled: v })}
                    />
                  </div>

                  {local.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground font-medium">Delivery channel</label>
                        <Select value={local.channels ?? "app"} onValueChange={v => setLocal(rule.id, { channels: v })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark">
                            {CHANNEL_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">{opt.icon}{opt.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {(local.channels === "email" || local.channels === "both") && (
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Email recipients</label>
                          <Input
                            className="h-8 text-xs"
                            placeholder="email1@example.com, email2@example.com"
                            value={local.emailRecipients ?? ""}
                            onChange={e => setLocal(rule.id, { emailRecipients: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {isDirty && (
                    <div className="flex justify-end">
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleSave(rule)} disabled={updateMutation.isPending}>
                        Save changes
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
