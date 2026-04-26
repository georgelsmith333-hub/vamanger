import React, { useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { useGetExpenses, getGetExpensesQueryKey, useCreateExpense, useUpdateExpense, useDeleteExpense, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit2, Trash2, RefreshCw, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
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

const CATEGORIES = ['Subscription', 'Tools/Software', 'Marketing', 'Office', 'Travel', 'Shipping', 'Other'];
type FormData = z.infer<typeof schema>;
type Expense = FormData & { id: number; clientName?: string | null };

export default function Expenses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { data: expenses, isLoading } = useGetExpenses({ query: { queryKey: getGetExpensesQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const addForm = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { currency: 'USD', recurring: false, amount: 0, category: 'Subscription' } });
  const editForm = useForm<FormData>({ resolver: zodResolver(schema) });

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    editForm.reset({
      date: expense.date ?? '',
      category: expense.category,
      vendor: expense.vendor,
      description: expense.description,
      amount: expense.amount ?? 0,
      currency: expense.currency ?? 'USD',
      recurring: expense.recurring ?? false,
      linkedClientId: expense.linkedClientId ?? undefined,
      notes: expense.notes ?? '',
    });
  };

  const onAdd = (data: FormData) => {
    createExpense.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
        setIsAddOpen(false);
        addForm.reset();
        toast({ title: 'Expense added', description: `${data.vendor} — $${data.amount} added.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to add expense.', variant: 'destructive' }),
    });
  };

  const onEdit = (data: FormData) => {
    if (!editingExpense) return;
    updateExpense.mutate({ id: editingExpense.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
        setEditingExpense(null);
        toast({ title: 'Expense updated', description: `${data.vendor} has been updated.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to update expense.', variant: 'destructive' }),
    });
  };

  const handleDelete = async (id: number, vendor: string) => {
    if (await confirm({ title: 'Delete Expense', description: `Delete expense from ${vendor}? This cannot be undone.`, confirmText: 'Delete', variant: 'destructive' })) {
      deleteExpense.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
          toast({ title: 'Expense deleted', description: `${vendor} expense removed.`, variant: 'destructive' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to delete expense.', variant: 'destructive' }),
      });
    }
  };

  const filtered = expenses?.filter(e => (e.vendor + e.description + e.category).toLowerCase().includes(search.toLowerCase())) || [];
  const total = expenses?.reduce((s, e) => s + e.amount, 0) || 0;
  const recurring = expenses?.filter(e => e.recurring).reduce((s, e) => s + e.amount, 0) || 0;

  const ExpenseFormFields = ({ form }: { form: ReturnType<typeof useForm<FormData>> }) => (
    <div className="grid grid-cols-2 gap-4">
      <FormField control={form.control} name="date" render={({ field }) => (
        <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="category" render={({ field }) => (
        <FormItem><FormLabel>Category *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="vendor" render={({ field }) => (
        <FormItem><FormLabel>Vendor *</FormLabel><FormControl><Input {...field} placeholder="e.g. Shopify, Canva" /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="amount" render={({ field }) => (
        <FormItem><FormLabel>Amount *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="description" render={({ field }) => (
        <FormItem className="col-span-2"><FormLabel>Description *</FormLabel><FormControl><Input {...field} placeholder="What was this for?" /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="linkedClientId" render={({ field }) => (
        <FormItem><FormLabel>Linked Client</FormLabel>
          <Select onValueChange={(v) => field.onChange(v ? Number(v) : undefined)} value={field.value ? String(field.value) : ''}>
            <FormControl><SelectTrigger><SelectValue placeholder="None (general)" /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="">None (general)</SelectItem>
              {clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>)}
            </SelectContent>
          </Select><FormMessage /></FormItem>
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
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track all business expenses and subscriptions.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Expense</Button></DialogTrigger>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
            <Form {...addForm}><form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4">
              <ExpenseFormFields form={addForm} />
              <DialogFooter><Button type="submit" disabled={createExpense.isPending}>Add Expense</Button></DialogFooter>
            </form></Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-2xl font-bold text-destructive">${total.toFixed(2)}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Recurring Monthly</p><p className="text-2xl font-bold text-amber-500">${recurring.toFixed(2)}</p><div className="flex items-center gap-1 mt-1"><RefreshCw className="w-3 h-3 text-muted-foreground" /><p className="text-xs text-muted-foreground">per month</p></div></div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 max-w-sm flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToCsv(filtered as Record<string, unknown>[], 'expenses')}>
          <Download className="w-4 h-4 mr-2" />Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Vendor</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Client</TableHead><TableHead>Recurring</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                {search ? `No expenses matching "${search}".` : 'No expenses yet.'}
              </TableCell></TableRow>
            ) : filtered.map(exp => (
              <TableRow key={exp.id}>
                <TableCell className="text-sm">{exp.date || '-'}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{exp.category}</Badge></TableCell>
                <TableCell className="font-medium">{exp.vendor}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">{exp.description}</TableCell>
                <TableCell className="font-medium text-destructive">${Number(exp.amount).toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{exp.clientName || 'General'}</TableCell>
                <TableCell>
                  {exp.recurring
                    ? <div className="flex items-center gap-1 text-amber-500 text-xs"><RefreshCw className="w-3 h-3" />Monthly</div>
                    : <span className="text-muted-foreground text-xs">One-time</span>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(exp as Expense)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(exp.id, exp.vendor)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingExpense} onOpenChange={(open) => { if (!open) setEditingExpense(null); }}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit Expense — {editingExpense?.vendor}</DialogTitle></DialogHeader>
          <Form {...editForm}><form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <ExpenseFormFields form={editForm} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingExpense(null)}>Cancel</Button>
              <Button type="submit" disabled={updateExpense.isPending}>Save Changes</Button>
            </DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
