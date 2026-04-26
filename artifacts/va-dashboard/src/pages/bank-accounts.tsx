import React, { useState } from 'react';
import { useGetBankAccounts, getGetBankAccountsQueryKey, useCreateBankAccount, useDeleteBankAccount, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  bankCode: z.string().optional(),
  clientId: z.coerce.number().min(1, 'Client is required'),
  bankName: z.string().min(1, 'Bank name required'),
  accountHolder: z.string().min(1, 'Account holder required'),
  accountNumber: z.string().optional(),
  routingCode: z.string().optional(),
  swiftBic: z.string().optional(),
  iban: z.string().optional(),
  currency: z.string().default('USD'),
  onlineBankingUrl: z.string().optional(),
  onlineUsername: z.string().optional(),
  twoFaMethod: z.string().optional(),
  status: z.string().default('Active'),
  notes: z.string().optional(),
});

export default function BankAccounts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: accounts, isLoading } = useGetBankAccounts({ query: { queryKey: getGetBankAccountsQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createAccount = useCreateBankAccount();
  const deleteAccount = useDeleteBankAccount();

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { currency: 'USD', status: 'Active' } });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createAccount.mutate({ data }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetBankAccountsQueryKey() }); setIsAddOpen(false); form.reset(); },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Remove this bank account?')) {
      deleteAccount.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetBankAccountsQueryKey() }) });
    }
  };

  const filtered = accounts?.filter(a => ((a.clientName || '') + a.bankName + a.accountHolder).toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground">Manage client bank accounts linked to eBay accounts.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Bank Account</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
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
                  <FormField control={form.control} name="bankName" render={({ field }) => (
                    <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="accountHolder" render={({ field }) => (
                    <FormItem><FormLabel>Account Holder</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="accountNumber" render={({ field }) => (
                    <FormItem><FormLabel>Account # (masked)</FormLabel><FormControl><Input {...field} placeholder="**** **** 1234" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>Currency</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="swiftBic" render={({ field }) => (
                    <FormItem><FormLabel>SWIFT/BIC</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="routingCode" render={({ field }) => (
                    <FormItem><FormLabel>Routing Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="twoFaMethod" render={({ field }) => (
                    <FormItem><FormLabel>2FA Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="SMS">SMS</SelectItem><SelectItem value="Authenticator">Authenticator</SelectItem><SelectItem value="Email">Email</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={createAccount.isPending}>Add Account</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search bank accounts..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead><TableHead>Bank</TableHead><TableHead>Account Holder</TableHead><TableHead>Account #</TableHead><TableHead>Currency</TableHead><TableHead>SWIFT</TableHead><TableHead>2FA</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No bank accounts found.</TableCell></TableRow>
            ) : filtered.map(acct => (
              <TableRow key={acct.id}>
                <TableCell>{acct.clientName}</TableCell>
                <TableCell className="font-medium">{acct.bankName}</TableCell>
                <TableCell>{acct.accountHolder}</TableCell>
                <TableCell className="font-mono text-sm">{acct.accountNumber || '-'}</TableCell>
                <TableCell>{acct.currency}</TableCell>
                <TableCell className="font-mono text-xs">{acct.swiftBic || '-'}</TableCell>
                <TableCell>{acct.twoFaMethod ? <Badge variant="outline">{acct.twoFaMethod}</Badge> : '-'}</TableCell>
                <TableCell><Badge className={acct.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>{acct.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(acct.id)}>
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
