import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Users, Shield, Eye, UserCheck } from "lucide-react";

import { API_BASE as BASE } from "@/lib/api-base";
const fetchJson = <T,>(url: string): Promise<T> => fetch(url).then(r => r.json());

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  assignedClients?: string;
  lastLogin?: string;
  createdAt: string;
}

const ROLES = [
  { value: "admin", label: "Admin", icon: Shield, color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "manager", label: "Manager", icon: UserCheck, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "viewer", label: "Viewer", icon: Eye, color: "bg-muted text-muted-foreground border-border" },
];

const roleColor = (role: string) => ROLES.find(r => r.value === role)?.color ?? "";

const emptyForm = { name: "", email: "", role: "viewer", status: "active", assignedClients: "" };

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<{ open: boolean; user?: User }>({ open: false });
  const [form, setForm] = useState(emptyForm);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: () => fetchJson<User[]>(`${BASE}/api/users`),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const url = dialog.user ? `${BASE}/api/users/${dialog.user.id}` : `${BASE}/api/users`;
      const method = dialog.user ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: dialog.user ? "User Updated" : "User Created", description: "User saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDialog({ open: false });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "User Deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const openCreate = () => { setForm(emptyForm); setDialog({ open: true }); };
  const openEdit = (u: User) => { setForm({ name: u.name, email: u.email, role: u.role, status: u.status, assignedClients: u.assignedClients ?? "" }); setDialog({ open: true, user: u }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage who can access the platform and their permissions</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add User</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {ROLES.map(r => (
          <div key={r.value} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><r.icon className="w-4 h-4 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{r.label}s</p>
              <p className="text-xl font-bold">{users.filter(u => u.role === r.value).length}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-3 text-muted-foreground font-medium">User</th>
            <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
            <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
            <th className="text-left px-4 py-3 text-muted-foreground font-medium">Access</th>
            <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading users…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No users yet. Add your first user.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${roleColor(u.role)}`}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.status === "active" ? "default" : "secondary"} className="text-xs">
                    {u.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {u.assignedClients ? `${u.assignedClients.split(",").length} client(s)` : "All clients"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => { if (confirm("Delete this user?")) deleteMutation.mutate(u.id); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialog.open} onOpenChange={o => setDialog({ open: o })}>
        <DialogContent className="sm:max-w-md dark">
          <DialogHeader><DialogTitle>{dialog.user ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Email</label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-sm font-medium">Role</label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="dark">{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1"><label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="dark"><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                </Select></div>
            </div>
            <div className="space-y-1"><label className="text-sm font-medium">Assigned Clients <span className="text-muted-foreground text-xs">(leave blank = all)</span></label>
              <Input value={form.assignedClients} onChange={e => setForm(f => ({ ...f, assignedClients: e.target.value }))} placeholder="Client IDs comma-separated e.g. 1,2,3" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
