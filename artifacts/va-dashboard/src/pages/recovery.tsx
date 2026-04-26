import React, { useState } from 'react';
import { useGetRecoveryEntries, getGetRecoveryEntriesQueryKey, useCreateRecoveryEntry, useDeleteRecoveryEntry, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Trash2, Eye, EyeOff, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  clientId: z.coerce.number().min(1, 'Client is required'),
  accountService: z.string().min(1, 'Service name required'),
  recoveryEmail: z.string().email().optional(),
  recoveryPhone: z.string().optional(),
  twoFaMethod: z.string().optional(),
  backupCodes: z.string().optional(),
  totpSeed: z.string().optional(),
  notes: z.string().optional(),
});

function MaskedField({ value }: { value: string | null | undefined }) {
  const [shown, setShown] = useState(false);
  if (!value) return <span className="text-muted-foreground">-</span>;
  return (
    <span className="flex items-center gap-1 font-mono text-xs">
      {shown ? value : '••••••••'}
      <button onClick={() => setShown(s => !s)} className="text-muted-foreground hover:text-foreground">
        {shown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </span>
  );
}

export default function Recovery() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: entries, isLoading } = useGetRecoveryEntries({ query: { queryKey: getGetRecoveryEntriesQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createEntry = useCreateRecoveryEntry();
  const deleteEntry = useDeleteRecoveryEntry();

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: {} });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createEntry.mutate({ data }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetRecoveryEntriesQueryKey() }); setIsAddOpen(false); form.reset(); },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this recovery entry?')) {
      deleteEntry.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetRecoveryEntriesQueryKey() }) });
    }
  };

  const filtered = entries?.filter(e => ((e.clientName || '') + e.accountService).toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recovery & 2FA</h1>
          <p className="text-muted-foreground flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Secure vault for account recovery codes and 2FA info.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Entry</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Recovery Entry</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="clientId" render={({ field }) => (
                    <FormItem><FormLabel>Client</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value || '')}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="accountService" render={({ field }) => (
                    <FormItem><FormLabel>Account / Service</FormLabel><FormControl><Input {...field} placeholder="eBay - username" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="recoveryEmail" render={({ field }) => (
                    <FormItem><FormLabel>Recovery Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="recoveryPhone" render={({ field }) => (
                    <FormItem><FormLabel>Recovery Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="twoFaMethod" render={({ field }) => (
                    <FormItem><FormLabel>2FA Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Authenticator">Authenticator</SelectItem><SelectItem value="SMS">SMS</SelectItem><SelectItem value="Email">Email</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="totpSeed" render={({ field }) => (
                    <FormItem><FormLabel>TOTP Seed</FormLabel><FormControl><Input {...field} placeholder="Base32 seed" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="backupCodes" render={({ field }) => (
                  <FormItem><FormLabel>Backup Codes</FormLabel><FormControl><Input {...field} placeholder="1234-5678 / 9012-3456" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={createEntry.isPending}>Save Entry</Button></DialogFooter>
              </form>
            </Form>
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
            <TableRow>
              <TableHead>Client</TableHead><TableHead>Service</TableHead><TableHead>Recovery Email</TableHead><TableHead>Recovery Phone</TableHead><TableHead>2FA</TableHead><TableHead>Backup Codes</TableHead><TableHead>TOTP Seed</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No recovery entries found.</TableCell></TableRow>
            ) : filtered.map(e => (
              <TableRow key={e.id}>
                <TableCell>{e.clientName}</TableCell>
                <TableCell className="font-medium">{e.accountService}</TableCell>
                <TableCell className="text-sm"><MaskedField value={e.recoveryEmail} /></TableCell>
                <TableCell className="text-sm"><MaskedField value={e.recoveryPhone} /></TableCell>
                <TableCell>{e.twoFaMethod ? <Badge variant="outline"><Shield className="w-3 h-3 mr-1" />{e.twoFaMethod}</Badge> : '-'}</TableCell>
                <TableCell><MaskedField value={e.backupCodes} /></TableCell>
                <TableCell><MaskedField value={e.totpSeed} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
