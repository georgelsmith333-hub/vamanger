import React, { useState } from 'react';
import { useGetInvoices, getGetInvoicesQueryKey, useCreateInvoice, useUpdateInvoice, useDeleteInvoice, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  clientId: z.coerce.number().min(1, 'Client is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  hours: z.coerce.number().optional(),
  rate: z.coerce.number().optional(),
  amount: z.coerce.number().min(0, 'Amount is required'),
  status: z.string().default('Draft'),
  method: z.string().optional(),
  notes: z.string().optional(),
});

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Paid': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Paid</Badge>;
    case 'Sent': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />Sent</Badge>;
    case 'Overdue': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function Invoices() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: invoices, isLoading } = useGetInvoices({ query: { queryKey: getGetInvoicesQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { status: 'Draft', amount: 0 } });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createInvoice.mutate({ data }, {
      onSuccess: (inv) => {
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: 'Invoice created', description: `${(inv as { invoiceNumber?: string }).invoiceNumber || 'Invoice'} added successfully.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to create invoice.', variant: 'destructive' }),
    });
  };

  const handleMarkPaid = (id: number, invoiceNumber: string) => {
    updateInvoice.mutate({ id, data: { status: 'Paid', paidOn: new Date().toISOString().slice(0, 10) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        toast({ title: 'Invoice paid', description: `${invoiceNumber} marked as paid.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to update invoice.', variant: 'destructive' }),
    });
  };

  const handleDelete = (id: number, invoiceNumber: string) => {
    if (confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) {
      deleteInvoice.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
          toast({ title: 'Invoice deleted', description: `${invoiceNumber} has been removed.`, variant: 'destructive' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to delete invoice.', variant: 'destructive' }),
      });
    }
  };

  const filtered = invoices?.filter(i => i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || (i.clientName || '').toLowerCase().includes(search.toLowerCase())) || [];
  const totalBilled = invoices?.reduce((s, i) => s + i.amount, 0) || 0;
  const totalPaid = invoices?.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0) || 0;
  const totalOverdue = invoices?.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Track billing, payments, and outstanding amounts.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Invoice</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
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
                  <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                    <FormItem><FormLabel>Invoice #</FormLabel><FormControl><Input {...field} placeholder="INV-2026-005" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="issueDate" render={({ field }) => (
                    <FormItem><FormLabel>Issue Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="hours" render={({ field }) => (
                    <FormItem><FormLabel>Hours</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="rate" render={({ field }) => (
                    <FormItem><FormLabel>Rate ($/hr)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Sent">Sent</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Overdue">Overdue</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={createInvoice.isPending}>Create Invoice</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Total Billed</p><p className="text-2xl font-bold">${totalBilled.toFixed(2)}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Collected</p><p className="text-2xl font-bold text-emerald-500">${totalPaid.toFixed(2)}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-destructive">${totalOverdue.toFixed(2)}</p></div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Issue Date</TableHead><TableHead>Due Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No invoices found.</TableCell></TableRow>
            ) : filtered.map(inv => (
              <TableRow key={inv.id} className={inv.status === 'Overdue' ? 'bg-destructive/5' : ''}>
                <TableCell className="font-mono font-medium">{inv.invoiceNumber}</TableCell>
                <TableCell className="text-muted-foreground">{inv.clientName}</TableCell>
                <TableCell>{inv.issueDate || '-'}</TableCell>
                <TableCell>
                  {inv.dueDate || '-'}
                  {(inv.daysOverdue ?? 0) > 0 && <span className="ml-1 text-xs text-destructive">({inv.daysOverdue}d late)</span>}
                </TableCell>
                <TableCell className="font-medium">${Number(inv.amount).toFixed(2)}</TableCell>
                <TableCell><StatusBadge status={inv.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {inv.status !== 'Paid' && (
                      <Button variant="ghost" size="sm" className="text-emerald-500 h-8 px-2 text-xs" onClick={() => handleMarkPaid(inv.id, inv.invoiceNumber)}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />Mark Paid
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(inv.id, inv.invoiceNumber)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
