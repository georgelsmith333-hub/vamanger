import React, { useState } from 'react';
import { useGetWiseCards, getGetWiseCardsQueryKey, useCreateWiseCard, useDeleteWiseCard, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Trash2, CreditCard, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  wiseEmail: z.string().email().optional(),
  balance: z.coerce.number().optional(),
  status: z.string().default('Active'),
  notes: z.string().optional(),
});

export default function WiseCards() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: cards, isLoading } = useGetWiseCards({ query: { queryKey: getGetWiseCardsQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createCard = useCreateWiseCard();
  const deleteCard = useDeleteWiseCard();

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { provider: 'Wise', cardType: 'Debit', currency: 'USD', status: 'Active' } });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createCard.mutate({ data }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetWiseCardsQueryKey() }); setIsAddOpen(false); form.reset(); },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Remove this card?')) {
      deleteCard.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWiseCardsQueryKey() }) });
    }
  };

  const filtered = cards?.filter(c => ((c.clientName || '') + (c.cardHolder || '') + (c.cardNumberMasked || '')).toLowerCase().includes(search.toLowerCase())) || [];
  const expiringSoon = cards?.filter(c => (c.daysToExpiry ?? 999) <= 60).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wise Cards</h1>
          <p className="text-muted-foreground">Manage Wise cards and payment methods.{expiringSoon > 0 && <span className="ml-2 text-amber-400 font-semibold">{expiringSoon} card(s) expiring soon.</span>}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Card</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Wise Card</DialogTitle></DialogHeader>
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
                  <FormField control={form.control} name="cardHolder" render={({ field }) => (
                    <FormItem><FormLabel>Card Holder</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="cardType" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Debit">Debit</SelectItem><SelectItem value="Virtual">Virtual</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>Currency</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="cardNumberMasked" render={({ field }) => (
                    <FormItem><FormLabel>Card # (masked)</FormLabel><FormControl><Input {...field} placeholder="**** **** **** 1234" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="balance" render={({ field }) => (
                    <FormItem><FormLabel>Balance</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="expiryMonth" render={({ field }) => (
                    <FormItem><FormLabel>Expiry Month</FormLabel><FormControl><Input type="number" min="1" max="12" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="expiryYear" render={({ field }) => (
                    <FormItem><FormLabel>Expiry Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="wiseEmail" render={({ field }) => (
                    <FormItem><FormLabel>Wise Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={createCard.isPending}>Add Card</Button></DialogFooter>
              </form>
            </Form>
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
              <TableHead>Client</TableHead><TableHead>Card Holder</TableHead><TableHead>Card Number</TableHead><TableHead>Type</TableHead><TableHead>Currency</TableHead><TableHead>Balance</TableHead><TableHead>Expiry</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No cards found.</TableCell></TableRow>
            ) : filtered.map(card => {
              const expiring = (card.daysToExpiry ?? 999) <= 60;
              return (
                <TableRow key={card.id} className={expiring ? 'bg-amber-500/5' : ''}>
                  <TableCell>{card.clientName}</TableCell>
                  <TableCell className="font-medium">{card.cardHolder}</TableCell>
                  <TableCell><span className="flex items-center gap-1 font-mono text-sm"><CreditCard className="w-3 h-3" />{card.cardNumberMasked || '****'}</span></TableCell>
                  <TableCell><Badge variant="outline">{card.cardType}</Badge></TableCell>
                  <TableCell>{card.currency}</TableCell>
                  <TableCell className="font-medium">{card.balance != null ? `${card.currency} ${Number(card.balance).toLocaleString()}` : '-'}</TableCell>
                  <TableCell>
                    <span className={expiring ? 'text-amber-400 flex items-center gap-1' : ''}>
                      {expiring && <AlertTriangle className="w-3 h-3" />}
                      {card.expiryMonth ? `${String(card.expiryMonth).padStart(2, '0')}/${card.expiryYear}` : '-'}
                      {expiring && card.daysToExpiry !== null && <span className="text-xs">({card.daysToExpiry}d)</span>}
                    </span>
                  </TableCell>
                  <TableCell><Badge className={card.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>{card.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(card.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
