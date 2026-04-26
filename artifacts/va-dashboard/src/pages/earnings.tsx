import React, { useState } from 'react';
import { useGetEarnings, getGetEarningsQueryKey, useCreateEarning, useDeleteEarning, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const schema = z.object({
  clientId: z.coerce.number().min(1, 'Client is required'),
  year: z.coerce.number().min(2020).max(2099),
  month: z.coerce.number().min(1).max(12),
  amount: z.coerce.number().min(0),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
});

export default function Earnings() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: earnings, isLoading } = useGetEarnings({ query: { queryKey: getGetEarningsQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createEarning = useCreateEarning();
  const deleteEarning = useDeleteEarning();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { year: new Date().getFullYear(), month: new Date().getMonth() + 1, currency: 'USD', amount: 0 },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createEarning.mutate({ data }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetEarningsQueryKey() }); setIsAddOpen(false); form.reset(); },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this earning record?')) {
      deleteEarning.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetEarningsQueryKey() }) });
    }
  };

  const totalYtd = earnings?.reduce((s, e) => s + e.amount, 0) || 0;
  const byClient = earnings ? Array.from(new Set(earnings.map(e => e.clientName))).map(name => ({
    name,
    total: earnings.filter(e => e.clientName === name).reduce((s, e) => s + e.amount, 0),
  })) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground">Monthly revenue tracking per client.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Earning</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Earning Record</DialogTitle></DialogHeader>
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
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>Currency</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="year" render={({ field }) => (
                    <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="month" render={({ field }) => (
                    <FormItem><FormLabel>Month</FormLabel>
                      <Select onValueChange={v => field.onChange(Number(v))} defaultValue={String(field.value)}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={createEarning.isPending}>Save</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Total YTD Earnings</p>
          <p className="text-3xl font-bold text-primary">${totalYtd.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-3">By Client</p>
          <div className="space-y-2">
            {byClient.map(c => (
              <div key={c.name} className="flex justify-between items-center">
                <span className="text-sm">{c.name}</span>
                <span className="font-semibold flex items-center gap-1"><TrendingUp className="w-3 h-3 text-primary" />${c.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead><TableHead>Year</TableHead><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Currency</TableHead><TableHead>Notes</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : !earnings || earnings.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No earnings recorded.</TableCell></TableRow>
            ) : earnings.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.clientName}</TableCell>
                <TableCell>{e.year}</TableCell>
                <TableCell>{MONTHS[(e.month || 1) - 1]}</TableCell>
                <TableCell className="font-semibold text-emerald-500">${Number(e.amount).toFixed(2)}</TableCell>
                <TableCell>{e.currency}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{e.notes || '-'}</TableCell>
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
