import React, { useState } from 'react';
import { useGetEarnings, getGetEarningsQueryKey, useCreateEarning, useUpdateEarning, useDeleteEarning, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_OPTS = MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }));

const schema = z.object({
  clientId: z.coerce.number().min(1, 'Client is required'),
  year: z.coerce.number().min(2020).max(2099),
  month: z.coerce.number().min(1).max(12),
  amount: z.coerce.number().min(0),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Earning = FormData & { id: number; clientName?: string | null };

export default function Earnings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEarning, setEditingEarning] = useState<Earning | null>(null);

  const { data: earnings, isLoading } = useGetEarnings({ query: { queryKey: getGetEarningsQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createEarning = useCreateEarning();
  const updateEarning = useUpdateEarning();
  const deleteEarning = useDeleteEarning();

  const addForm = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { year: new Date().getFullYear(), month: new Date().getMonth() + 1, currency: 'USD', amount: 0 } });
  const editForm = useForm<FormData>({ resolver: zodResolver(schema) });

  const openEdit = (earning: Earning) => {
    setEditingEarning(earning);
    editForm.reset({ clientId: earning.clientId, year: earning.year, month: earning.month, amount: earning.amount, currency: earning.currency ?? 'USD', notes: earning.notes ?? '' });
  };

  const onAdd = (data: FormData) => {
    createEarning.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEarningsQueryKey() });
        setIsAddOpen(false);
        addForm.reset();
        toast({ title: 'Earning recorded', description: `$${data.amount} recorded for ${MONTHS[data.month - 1]} ${data.year}.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to record earning.', variant: 'destructive' }),
    });
  };

  const onEdit = (data: FormData) => {
    if (!editingEarning) return;
    updateEarning.mutate({ id: editingEarning.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEarningsQueryKey() });
        setEditingEarning(null);
        toast({ title: 'Earning updated', description: `Record for ${MONTHS[data.month - 1]} ${data.year} updated.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to update earning.', variant: 'destructive' }),
    });
  };

  const handleDelete = (id: number, label: string) => {
    if (confirm(`Delete earnings record for ${label}?`)) {
      deleteEarning.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEarningsQueryKey() });
          toast({ title: 'Record deleted', description: `${label} earnings removed.`, variant: 'destructive' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to delete record.', variant: 'destructive' }),
      });
    }
  };

  const totalYtd = earnings?.reduce((s, e) => s + e.amount, 0) || 0;
  const byClient = earnings ? Array.from(new Set(earnings.map(e => e.clientName))).map(name => ({
    name,
    total: earnings.filter(e => e.clientName === name).reduce((s, e) => s + e.amount, 0),
  })) : [];

  const EarningFormFields = ({ form }: { form: ReturnType<typeof useForm<FormData>> }) => (
    <div className="grid grid-cols-2 gap-4">
      <FormField control={form.control} name="clientId" render={({ field }) => (
        <FormItem className="col-span-2"><FormLabel>Client *</FormLabel>
          <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value || '')}>
            <FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl>
            <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>)}</SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="year" render={({ field }) => (
        <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="month" render={({ field }) => (
        <FormItem><FormLabel>Month</FormLabel>
          <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value || '')}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>{MONTH_OPTS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="amount" render={({ field }) => (
        <FormItem><FormLabel>Amount ($) *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="currency" render={({ field }) => (
        <FormItem><FormLabel>Currency</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent>
          </Select><FormMessage /></FormItem>
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
          <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground">Monthly earnings per client from eBay dropshipping.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Record Earning</Button></DialogTrigger>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Record Earning</DialogTitle></DialogHeader>
            <Form {...addForm}><form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4">
              <EarningFormFields form={addForm} />
              <DialogFooter><Button type="submit" disabled={createEarning.isPending}>Save</Button></DialogFooter>
            </form></Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Total YTD</p><p className="text-2xl font-bold text-emerald-500">${totalYtd.toLocaleString()}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Active Clients</p>
          <div className="flex flex-wrap gap-1 mt-1">{byClient.map(c => <span key={c.name} className="text-xs bg-muted rounded px-2 py-0.5">{c.name}: ${c.total.toLocaleString()}</span>)}</div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Period</TableHead><TableHead>Client</TableHead><TableHead>Amount</TableHead><TableHead>Currency</TableHead><TableHead>Notes</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : (earnings || []).length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No earnings recorded yet.</TableCell></TableRow>
            ) : (earnings || []).map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{MONTHS[(e.month || 1) - 1]} {e.year}</TableCell>
                <TableCell>{e.clientName}</TableCell>
                <TableCell className="font-bold text-emerald-500">${Number(e.amount).toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{e.currency || 'USD'}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{e.notes || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e as Earning)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(e.id, `${MONTHS[(e.month || 1) - 1]} ${e.year}`)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingEarning} onOpenChange={(open) => { if (!open) setEditingEarning(null); }}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Edit Earning</DialogTitle></DialogHeader>
          <Form {...editForm}><form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <EarningFormFields form={editForm} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingEarning(null)}>Cancel</Button>
              <Button type="submit" disabled={updateEarning.isPending}>Save Changes</Button>
            </DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
