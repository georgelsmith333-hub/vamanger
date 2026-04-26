import React, { useState } from 'react';
import { useGetExpenses, getGetExpensesQueryKey, useCreateExpense, useDeleteExpense, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Trash2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  date: z.string().optional(),
  category: z.string().min(1, 'Category required'),
  vendor: z.string().min(1, 'Vendor required'),
  description: z.string().min(1, 'Description required'),
  amount: z.coerce.number().min(0),
  currency: z.string().default('USD'),
  recurring: z.boolean().default(false),
  linkedClientId: z.coerce.number().optional(),
  notes: z.string().optional(),
});

const CATEGORIES = ['Subscription', 'Tools/Software', 'Marketing', 'Office', 'Travel', 'Other'];

export default function Expenses() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: expenses, isLoading } = useGetExpenses({ query: { queryKey: getGetExpensesQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { currency: 'USD', recurring: false, amount: 0 } });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createExpense.mutate({ data }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() }); setIsAddOpen(false); form.reset(); },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this expense?')) {
      deleteExpense.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() }) });
    }
  };

  const filtered = expenses?.filter(e => (e.vendor + e.description + e.category).toLowerCase().includes(search.toLowerCase())) || [];
  const total = expenses?.reduce((s, e) => s + e.amount, 0) || 0;
  const recurring = expenses?.filter(e => e.recurring).reduce((s, e) => s + e.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track VA business expenses and subscriptions.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="vendor" render={({ field }) => (
                    <FormItem><FormLabel>Vendor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>Currency</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="linkedClientId" render={({ field }) => (
                    <FormItem><FormLabel>Linked Client (opt)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value || '')}>
                        <FormControl><SelectTrigger><SelectValue placeholder="General" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="">General</SelectItem>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={createExpense.isPending}>Save Expense</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-2xl font-bold text-destructive">${total.toFixed(2)}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground flex items-center gap-1"><RefreshCw className="w-3 h-3" />Monthly Recurring</p><p className="text-2xl font-bold text-amber-400">${recurring.toFixed(2)}</p></div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Vendor</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Client</TableHead><TableHead>Recurring</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No expenses found.</TableCell></TableRow>
            ) : filtered.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-sm">{e.date || '-'}</TableCell>
                <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                <TableCell className="font-medium">{e.vendor}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.description}</TableCell>
                <TableCell className="font-semibold">${Number(e.amount).toFixed(2)}</TableCell>
                <TableCell className="text-sm">{e.linkedClientName || <span className="text-muted-foreground">General</span>}</TableCell>
                <TableCell>{e.recurring ? <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><RefreshCw className="w-3 h-3 mr-1" />Monthly</Badge> : '-'}</TableCell>
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
