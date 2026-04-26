import React, { useState } from 'react';
import { useGetWiseCards, getGetWiseCardsQueryKey, useCreateWiseCard, useUpdateWiseCard, useDeleteWiseCard, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit2, Trash2, CreditCard, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';

const schema = z.object({
  cardCode: z.string().optional(),
  clientId: z.coerce.number().min(1, 'Client is required'),
  provider: z.string().default('Wise'),
  cardType: z.string().default('Debit'),
  cardHolder: z.string().min(1, 'Card holder required'),
  cardNumberMasked: z.string().optional(),
  expiryMonth: z.coerce.number().min(1).max(12).optional(),
  expiryYear: z.coerce.number().optional(),
  currency: z.string().default('USD'),
  wiseEmail: z.string().optional(),
  balance: z.coerce.number().optional(),
  status: z.string().default('Active'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Card = FormData & { id: number; clientName?: string; daysToExpiry?: number | null };

export default function WiseCards() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const { data: cards, isLoading } = useGetWiseCards({ query: { queryKey: getGetWiseCardsQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createCard = useCreateWiseCard();
  const updateCard = useUpdateWiseCard();
  const deleteCard = useDeleteWiseCard();

  const addForm = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { provider: 'Wise', cardType: 'Debit', currency: 'USD', status: 'Active' } });
  const editForm = useForm<FormData>({ resolver: zodResolver(schema) });

  const openEdit = (card: Card) => {
    setEditingCard(card);
    editForm.reset({
      cardCode: card.cardCode ?? '',
      clientId: card.clientId,
      provider: card.provider ?? 'Wise',
      cardType: card.cardType ?? 'Debit',
      cardHolder: card.cardHolder,
      cardNumberMasked: card.cardNumberMasked ?? '',
      expiryMonth: card.expiryMonth ?? undefined,
      expiryYear: card.expiryYear ?? undefined,
      currency: card.currency ?? 'USD',
      wiseEmail: card.wiseEmail ?? '',
      balance: card.balance ?? 0,
      status: card.status ?? 'Active',
      notes: card.notes ?? '',
    });
  };

  const onAdd = (data: FormData) => {
    createCard.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWiseCardsQueryKey() });
        setIsAddOpen(false);
        addForm.reset();
        toast({ title: 'Card added', description: `${data.cardHolder}'s card has been added.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to add card.', variant: 'destructive' }),
    });
  };

  const onEdit = (data: FormData) => {
    if (!editingCard) return;
    updateCard.mutate({ id: editingCard.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWiseCardsQueryKey() });
        setEditingCard(null);
        toast({ title: 'Card updated', description: `${data.cardHolder}'s card has been updated.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to update card.', variant: 'destructive' }),
    });
  };

  const handleDelete = (id: number, holder: string) => {
    if (confirm(`Remove card for ${holder}?`)) {
      deleteCard.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWiseCardsQueryKey() });
          toast({ title: 'Card removed', description: `${holder}'s card has been removed.`, variant: 'destructive' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to remove card.', variant: 'destructive' }),
      });
    }
  };

  const filtered = cards?.filter(c => ((c.clientName || '') + (c.cardHolder || '') + (c.cardNumberMasked || '')).toLowerCase().includes(search.toLowerCase())) || [];
  const expiringSoon = cards?.filter(c => (c.daysToExpiry ?? 999) <= 60).length || 0;

  const CardFormFields = ({ form }: { form: ReturnType<typeof useForm<FormData>> }) => (
    <div className="grid grid-cols-2 gap-4">
      <FormField control={form.control} name="clientId" render={({ field }) => (
        <FormItem><FormLabel>Client *</FormLabel>
          <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value || '')}>
            <FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl>
            <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>)}</SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="cardHolder" render={({ field }) => (
        <FormItem><FormLabel>Card Holder *</FormLabel><FormControl><Input {...field} placeholder="Full name on card" /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="provider" render={({ field }) => (
        <FormItem><FormLabel>Provider</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="Wise">Wise</SelectItem>
              <SelectItem value="Payoneer">Payoneer</SelectItem>
              <SelectItem value="Mercury">Mercury</SelectItem>
              <SelectItem value="Stripe">Stripe</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="cardType" render={({ field }) => (
        <FormItem><FormLabel>Card Type</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="Debit">Debit</SelectItem>
              <SelectItem value="Virtual">Virtual</SelectItem>
              <SelectItem value="Credit">Credit</SelectItem>
            </SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="cardNumberMasked" render={({ field }) => (
        <FormItem><FormLabel>Card Number (last 4)</FormLabel><FormControl><Input {...field} placeholder="**** **** **** 1234" /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="currency" render={({ field }) => (
        <FormItem><FormLabel>Currency</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="expiryMonth" render={({ field }) => (
        <FormItem><FormLabel>Exp. Month</FormLabel><FormControl><Input type="number" min="1" max="12" placeholder="MM" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="expiryYear" render={({ field }) => (
        <FormItem><FormLabel>Exp. Year</FormLabel><FormControl><Input type="number" placeholder="YYYY" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="balance" render={({ field }) => (
        <FormItem><FormLabel>Balance</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="status" render={({ field }) => (
        <FormItem><FormLabel>Status</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="wiseEmail" render={({ field }) => (
        <FormItem className="col-span-2"><FormLabel>Wise Email</FormLabel><FormControl><Input type="email" {...field} placeholder="account@email.com" /></FormControl><FormMessage /></FormItem>
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
          <h1 className="text-3xl font-bold tracking-tight">Wise Cards</h1>
          <p className="text-muted-foreground">Manage payment cards and balances.{expiringSoon > 0 && <span className="text-amber-500 ml-2 font-medium">{expiringSoon} expiring soon.</span>}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Card</Button></DialogTrigger>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Add Card</DialogTitle></DialogHeader>
            <Form {...addForm}><form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4">
              <CardFormFields form={addForm} />
              <DialogFooter><Button type="submit" disabled={createCard.isPending}>Add Card</Button></DialogFooter>
            </form></Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search cards..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Card Holder</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Card Number</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                {search ? `No cards matching "${search}".` : 'No cards yet.'}
              </TableCell></TableRow>
            ) : filtered.map(card => {
              const expiring = (card.daysToExpiry ?? 999) <= 60;
              return (
                <TableRow key={card.id} className={expiring ? 'bg-amber-500/5' : ''}>
                  <TableCell className="font-medium">{card.cardHolder}</TableCell>
                  <TableCell className="text-muted-foreground">{card.clientName}</TableCell>
                  <TableCell><div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-muted-foreground" />{card.provider || 'Wise'}</div></TableCell>
                  <TableCell className="font-mono text-sm">{card.cardNumberMasked || '•••• ••••'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {card.expiryMonth && card.expiryYear ? `${String(card.expiryMonth).padStart(2, '0')}/${card.expiryYear}` : '-'}
                      {expiring && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                  </TableCell>
                  <TableCell>{card.balance != null ? `$${Number(card.balance).toFixed(2)}` : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={card.status === 'Active' ? 'default' : 'secondary'} className={card.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs' : 'text-xs'}>
                      {card.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(card as Card)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(card.id, card.cardHolder || '')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingCard} onOpenChange={(open) => { if (!open) setEditingCard(null); }}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit Card — {editingCard?.cardHolder}</DialogTitle></DialogHeader>
          <Form {...editForm}><form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <CardFormFields form={editForm} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingCard(null)}>Cancel</Button>
              <Button type="submit" disabled={updateCard.isPending}>Save Changes</Button>
            </DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
