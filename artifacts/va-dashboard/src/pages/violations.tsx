import React, { useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { useGetViolations, getGetViolationsQueryKey, useCreateViolation, useUpdateViolation, useDeleteViolation, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Trash2, ShieldCheck, ShieldAlert, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  clientId: z.coerce.number().min(1, 'Client is required'),
  ebayUsername: z.string().optional(),
  date: z.string().optional(),
  policyCode: z.string().optional(),
  severity: z.string().default('Warning'),
  description: z.string().min(1, 'Description is required'),
  actionTaken: z.string().optional(),
  notes: z.string().optional(),
});

function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return null;
  switch (severity) {
    case 'Suspended': return <Badge className="bg-red-900/30 text-red-300 border-red-700/50">Suspended</Badge>;
    case 'Restricted': return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Restricted</Badge>;
    case 'Warning': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>;
    default: return <Badge variant="secondary">{severity}</Badge>;
  }
}

export default function Violations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: violations, isLoading } = useGetViolations({ query: { queryKey: getGetViolationsQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createViolation = useCreateViolation();
  const updateViolation = useUpdateViolation();
  const deleteViolation = useDeleteViolation();

  const [editingViolation, setEditingViolation] = useState<{ id: number } & z.infer<typeof schema> | null>(null);

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { severity: 'Warning' } });
  const editForm = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const openEditViolation = (v: { id: number; clientId?: number | null; ebayUsername?: string | null; date?: string | null; policyCode?: string | null; severity?: string | null; description: string; actionTaken?: string | null; notes?: string | null }) => {
    const reset = { clientId: v.clientId ?? 0, ebayUsername: v.ebayUsername ?? '', date: v.date ?? '', policyCode: v.policyCode ?? '', severity: v.severity ?? 'Warning', description: v.description, actionTaken: v.actionTaken ?? '', notes: v.notes ?? '' };
    setEditingViolation({ id: v.id, ...reset });
    editForm.reset(reset);
  };

  const onEditSubmit = (data: z.infer<typeof schema>) => {
    if (!editingViolation) return;
    updateViolation.mutate({ id: editingViolation.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetViolationsQueryKey() });
        setEditingViolation(null);
        toast({ title: 'Violation updated', description: 'The violation record has been updated.' });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to update violation.', variant: 'destructive' }),
    });
  };

  const onSubmit = (data: z.infer<typeof schema>) => {
    createViolation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetViolationsQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: 'Violation logged', description: 'Policy violation has been recorded.' });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to log violation.', variant: 'destructive' }),
    });
  };

  const handleResolve = (id: number, clientName: string) => {
    updateViolation.mutate({ id, data: { resolved: true } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetViolationsQueryKey() });
        toast({ title: 'Violation resolved', description: `${clientName}'s violation has been marked as resolved.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to resolve violation.', variant: 'destructive' }),
    });
  };

  const handleDelete = async (id: number) => {
    if (await confirm({ title: 'Delete Violation', description: 'Delete this violation record? This cannot be undone.', confirmText: 'Delete', variant: 'destructive' })) {
      deleteViolation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetViolationsQueryKey() });
          toast({ title: 'Violation deleted', description: 'The violation record has been removed.', variant: 'destructive' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to delete violation.', variant: 'destructive' }),
      });
    }
  };

  const filtered = violations?.filter(v => ((v.clientName || '') + v.description + (v.policyCode || '')).toLowerCase().includes(search.toLowerCase())) || [];
  const open = violations?.filter(v => !v.resolved).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Violations</h1>
          <p className="text-muted-foreground">eBay policy violations and account health issues. {open > 0 && <span className="text-destructive font-semibold">{open} unresolved.</span>}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Log Violation</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Log Violation</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="clientId" render={({ field }) => (
                    <FormItem><FormLabel>Client</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value || '')}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl>
                        <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="ebayUsername" render={({ field }) => (
                    <FormItem><FormLabel>eBay Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="policyCode" render={({ field }) => (
                    <FormItem><FormLabel>Policy Code</FormLabel><FormControl><Input {...field} placeholder="MC011" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="severity" render={({ field }) => (
                    <FormItem><FormLabel>Severity</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Warning">Warning</SelectItem><SelectItem value="Restricted">Restricted</SelectItem><SelectItem value="Suspended">Suspended</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="actionTaken" render={({ field }) => (
                  <FormItem><FormLabel>Action Taken</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={createViolation.isPending}>Save</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search violations..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead><TableHead>eBay Account</TableHead><TableHead>Date</TableHead><TableHead>Policy</TableHead><TableHead>Severity</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No violations logged.</TableCell></TableRow>
            ) : filtered.map(v => (
              <TableRow key={v.id} className={!v.resolved ? 'bg-destructive/5' : 'opacity-60'}>
                <TableCell className="font-medium">{v.clientName}</TableCell>
                <TableCell className="font-mono text-sm">{v.ebayUsername || '-'}</TableCell>
                <TableCell>{v.date || '-'}</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{v.policyCode || '-'}</code></TableCell>
                <TableCell><SeverityBadge severity={v.severity} /></TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">{v.description}</TableCell>
                <TableCell>
                  {v.resolved
                    ? <span className="flex items-center gap-1 text-emerald-500 text-sm"><ShieldCheck className="w-4 h-4" />Resolved</span>
                    : <span className="flex items-center gap-1 text-destructive text-sm"><ShieldAlert className="w-4 h-4" />Open</span>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {!v.resolved && (
                      <Button variant="ghost" size="sm" className="text-emerald-500 h-8 px-2 text-xs" onClick={() => handleResolve(v.id, v.clientName || 'Client')}>
                        <ShieldCheck className="w-3 h-3 mr-1" />Resolve
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditViolation(v)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Violation Dialog */}
      <Dialog open={!!editingViolation} onOpenChange={(open) => { if (!open) setEditingViolation(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Violation</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="clientId" render={({ field }) => (
                  <FormItem><FormLabel>Client</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value || '')}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl>
                      <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="ebayUsername" render={({ field }) => (
                  <FormItem><FormLabel>eBay Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="policyCode" render={({ field }) => (
                  <FormItem><FormLabel>Policy Code</FormLabel><FormControl><Input {...field} placeholder="MC011" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="severity" render={({ field }) => (
                  <FormItem><FormLabel>Severity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="Warning">Warning</SelectItem><SelectItem value="Restricted">Restricted</SelectItem><SelectItem value="Suspended">Suspended</SelectItem></SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="actionTaken" render={({ field }) => (
                <FormItem><FormLabel>Action Taken</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditingViolation(null)}>Cancel</Button>
                <Button type="submit" disabled={updateViolation.isPending}>Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
