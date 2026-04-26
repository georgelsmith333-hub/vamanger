import React, { useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { useGetRecoveryEntries, getGetRecoveryEntriesQueryKey, useCreateRecoveryEntry, useUpdateRecoveryEntry, useDeleteRecoveryEntry, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';

const schema = z.object({
  clientId: z.coerce.number().min(1, 'Client is required'),
  accountService: z.string().min(1, 'Service name required'),
  recoveryEmail: z.string().optional(),
  recoveryPhone: z.string().optional(),
  twoFaMethod: z.string().optional(),
  backupCodes: z.string().optional(),
  totpSeed: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type RecoveryEntry = FormData & { id: number; clientName?: string | null };

function MaskedField({ value }: { value: string | null | undefined }) {
  const [shown, setShown] = useState(false);
  if (!value) return <span className="text-muted-foreground">-</span>;
  return (
    <span className="flex items-center gap-1 font-mono text-xs">
      {shown ? value : '••••••••'}
      <button type="button" onClick={() => setShown(s => !s)} className="text-muted-foreground hover:text-foreground">
        {shown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </span>
  );
}

export default function Recovery() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RecoveryEntry | null>(null);

  const { data: entries, isLoading } = useGetRecoveryEntries({ query: { queryKey: getGetRecoveryEntriesQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createEntry = useCreateRecoveryEntry();
  const updateEntry = useUpdateRecoveryEntry();
  const deleteEntry = useDeleteRecoveryEntry();

  const addForm = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: {} });
  const editForm = useForm<FormData>({ resolver: zodResolver(schema) });

  const openEdit = (entry: RecoveryEntry) => {
    setEditingEntry(entry);
    editForm.reset({
      clientId: entry.clientId,
      accountService: entry.accountService,
      recoveryEmail: entry.recoveryEmail ?? '',
      recoveryPhone: entry.recoveryPhone ?? '',
      twoFaMethod: entry.twoFaMethod ?? '',
      backupCodes: entry.backupCodes ?? '',
      totpSeed: entry.totpSeed ?? '',
      notes: entry.notes ?? '',
    });
  };

  const onAdd = (data: FormData) => {
    createEntry.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRecoveryEntriesQueryKey() });
        setIsAddOpen(false);
        addForm.reset();
        toast({ title: 'Recovery entry added', description: `${data.accountService} recovery info saved.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to save recovery entry.', variant: 'destructive' }),
    });
  };

  const onEdit = (data: FormData) => {
    if (!editingEntry) return;
    updateEntry.mutate({ id: editingEntry.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRecoveryEntriesQueryKey() });
        setEditingEntry(null);
        toast({ title: 'Recovery entry updated', description: `${data.accountService} has been updated.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to update recovery entry.', variant: 'destructive' }),
    });
  };

  const handleDelete = async (id: number, service: string) => {
    if (await confirm({ title: 'Delete Recovery Entry', description: `Delete recovery entry for ${service}? This cannot be undone.`, confirmText: 'Delete', variant: 'destructive' })) {
      deleteEntry.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRecoveryEntriesQueryKey() });
          toast({ title: 'Entry deleted', description: `${service} recovery entry removed.`, variant: 'destructive' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to delete entry.', variant: 'destructive' }),
      });
    }
  };

  const filtered = entries?.filter(e => ((e.clientName || '') + e.accountService).toLowerCase().includes(search.toLowerCase())) || [];

  const RecoveryFormFields = ({ form }: { form: ReturnType<typeof useForm<FormData>> }) => (
    <div className="grid grid-cols-2 gap-4">
      <FormField control={form.control} name="clientId" render={({ field }) => (
        <FormItem><FormLabel>Client *</FormLabel>
          <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value || '')}>
            <FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl>
            <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>)}</SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="accountService" render={({ field }) => (
        <FormItem><FormLabel>Service *</FormLabel><FormControl><Input {...field} placeholder="e.g. eBay, Wise, Gmail" /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="recoveryEmail" render={({ field }) => (
        <FormItem><FormLabel>Recovery Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="recoveryPhone" render={({ field }) => (
        <FormItem><FormLabel>Recovery Phone</FormLabel><FormControl><Input {...field} placeholder="+1 555 0000" /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="twoFaMethod" render={({ field }) => (
        <FormItem><FormLabel>2FA Method</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ''}>
            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              <SelectItem value="Authenticator">Authenticator App</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
              <SelectItem value="TOTP">TOTP Seed</SelectItem>
            </SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="totpSeed" render={({ field }) => (
        <FormItem><FormLabel>TOTP Seed</FormLabel><FormControl><Input {...field} type="password" placeholder="Sensitive — store securely" /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="backupCodes" render={({ field }) => (
        <FormItem className="col-span-2"><FormLabel>Backup Codes</FormLabel><FormControl><Input {...field} placeholder="Comma-separated backup codes" /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="notes" render={({ field }) => (
        <FormItem className="col-span-2"><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Recovery</h1>
          <p className="text-muted-foreground flex items-center gap-1.5"><Shield className="w-4 h-4 text-amber-500" />Secure 2FA and recovery credentials for all client accounts.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Entry</Button></DialogTrigger>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Add Recovery Entry</DialogTitle></DialogHeader>
            <Form {...addForm}><form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4">
              <RecoveryFormFields form={addForm} />
              <DialogFooter><Button type="submit" disabled={createEntry.isPending}>Save Entry</Button></DialogFooter>
            </form></Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search entries..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Client</TableHead><TableHead>Service</TableHead><TableHead>Recovery Email</TableHead><TableHead>Phone</TableHead><TableHead>2FA</TableHead><TableHead>TOTP Seed</TableHead><TableHead>Backup Codes</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                {search ? `No entries matching "${search}".` : 'No recovery entries yet.'}
              </TableCell></TableRow>
            ) : filtered.map(entry => (
              <TableRow key={entry.id}>
                <TableCell>{entry.clientName}</TableCell>
                <TableCell className="font-medium">{entry.accountService}</TableCell>
                <TableCell><MaskedField value={entry.recoveryEmail} /></TableCell>
                <TableCell><MaskedField value={entry.recoveryPhone} /></TableCell>
                <TableCell className="text-muted-foreground text-sm">{entry.twoFaMethod || '-'}</TableCell>
                <TableCell><MaskedField value={entry.totpSeed} /></TableCell>
                <TableCell><MaskedField value={entry.backupCodes} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry as RecoveryEntry)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(entry.id, entry.accountService)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingEntry} onOpenChange={(open) => { if (!open) setEditingEntry(null); }}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit — {editingEntry?.accountService}</DialogTitle></DialogHeader>
          <Form {...editForm}><form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <RecoveryFormFields form={editForm} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingEntry(null)}>Cancel</Button>
              <Button type="submit" disabled={updateEntry.isPending}>Save Changes</Button>
            </DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
