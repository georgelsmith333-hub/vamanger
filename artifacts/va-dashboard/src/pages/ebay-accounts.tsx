import React, { useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { useGetEbayAccounts, getGetEbayAccountsQueryKey, useCreateEbayAccount, useUpdateEbayAccount, useDeleteEbayAccount, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit2, Trash2, ShieldAlert, ShieldCheck, RefreshCw, Download } from 'lucide-react';
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
  clientId: z.coerce.number().min(1, 'Client is required'),
  ebayUsername: z.string().min(1, 'Username is required'),
  accountHealth: z.string().optional(),
  feedbackScore: z.coerce.number().optional(),
  topRated: z.boolean().default(false),
  activeListings: z.coerce.number().optional(),
  mcRestriction: z.boolean().default(false),
  twoFaEnabled: z.boolean().default(true),
  status: z.string().default('Active'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Account = { id: number; ebayUsername: string; clientId: number; clientName: string; accountHealth?: string | null; feedbackScore?: number | null; topRated?: boolean | null; activeListings?: number | null; mcRestriction?: boolean | null; twoFaEnabled?: boolean | null; status?: string | null; notes?: string | null };

function HealthBadge({ health }: { health: string | null | undefined }) {
  const h = health?.toLowerCase();
  if (!health) return <Badge variant="outline">Unknown</Badge>;
  if (h === 'excellent' || h === 'above standard') return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{health}</Badge>;
  if (h === 'good') return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">{health}</Badge>;
  if (h === 'below standard') return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">{health}</Badge>;
  if (h === 'restricted' || h === 'suspended') return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{health}</Badge>;
  return <Badge variant="outline">{health}</Badge>;
}

export default function EbayAccounts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const { data: accounts, isLoading } = useGetEbayAccounts({ query: { queryKey: getGetEbayAccountsQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createAccount = useCreateEbayAccount();
  const updateAccount = useUpdateEbayAccount();
  const deleteAccount = useDeleteEbayAccount();

  const addForm = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { accountHealth: 'Good', feedbackScore: 0, topRated: false, activeListings: 0, mcRestriction: false, twoFaEnabled: true, status: 'Active' } });
  const editForm = useForm<FormData>({ resolver: zodResolver(schema) });

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    editForm.reset({
      clientId: account.clientId,
      ebayUsername: account.ebayUsername,
      accountHealth: account.accountHealth ?? 'Good',
      feedbackScore: account.feedbackScore ?? 0,
      topRated: account.topRated ?? false,
      activeListings: account.activeListings ?? 0,
      mcRestriction: account.mcRestriction ?? false,
      twoFaEnabled: account.twoFaEnabled ?? true,
      status: account.status ?? 'Active',
      notes: account.notes ?? '',
    });
  };

  const onAdd = (data: FormData) => {
    createAccount.mutate({ data }, {
      onSuccess: (acc) => {
        queryClient.invalidateQueries({ queryKey: getGetEbayAccountsQueryKey() });
        setIsAddOpen(false);
        addForm.reset();
        toast({ title: 'Account added', description: `${(acc as { ebayUsername?: string }).ebayUsername} has been added.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to add account.', variant: 'destructive' }),
    });
  };

  const onEdit = (data: FormData) => {
    if (!editingAccount) return;
    updateAccount.mutate({ id: editingAccount.id, data }, {
      onSuccess: (acc) => {
        queryClient.invalidateQueries({ queryKey: getGetEbayAccountsQueryKey() });
        setEditingAccount(null);
        toast({ title: 'Account updated', description: `${(acc as { ebayUsername?: string }).ebayUsername} has been updated.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to update account.', variant: 'destructive' }),
    });
  };

  const handleDelete = async (id: number, username: string) => {
    if (await confirm({ title: 'Remove eBay Account', description: `Remove "${username}"? All associated data will be unlinked.`, confirmText: 'Remove', variant: 'destructive' })) {
      deleteAccount.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEbayAccountsQueryKey() });
          toast({ title: 'Account removed', description: `${username} has been removed.`, variant: 'destructive' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to remove account.', variant: 'destructive' }),
      });
    }
  };

  const filtered = accounts?.filter(a => (a.ebayUsername + a.clientName).toLowerCase().includes(search.toLowerCase())) || [];
  const issues = accounts?.filter(a => a.accountHealth === 'Restricted' || a.accountHealth === 'Suspended' || a.accountHealth === 'Below Standard' || a.mcRestriction).length || 0;

  const AccountFormFields = ({ form }: { form: ReturnType<typeof useForm<FormData>> }) => (
    <div className="grid grid-cols-2 gap-4">
      <FormField control={form.control} name="clientId" render={({ field }) => (
        <FormItem><FormLabel>Client *</FormLabel>
          <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value || '')}>
            <FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl>
            <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>)}</SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="ebayUsername" render={({ field }) => (
        <FormItem><FormLabel>eBay Username *</FormLabel><FormControl><Input {...field} placeholder="e.g. store_seller123" /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="accountHealth" render={({ field }) => (
        <FormItem><FormLabel>Account Health</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="Excellent">Excellent</SelectItem>
              <SelectItem value="Above Standard">Above Standard</SelectItem>
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Below Standard">Below Standard</SelectItem>
              <SelectItem value="Restricted">Restricted</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="status" render={({ field }) => (
        <FormItem><FormLabel>Status</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="feedbackScore" render={({ field }) => (
        <FormItem><FormLabel>Feedback Score</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="activeListings" render={({ field }) => (
        <FormItem><FormLabel>Active Listings</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="notes" render={({ field }) => (
        <FormItem className="col-span-2"><FormLabel>Notes</FormLabel><FormControl><Input {...field} placeholder="Any notes..." /></FormControl><FormMessage /></FormItem>
      )} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">eBay Accounts</h1>
          <p className="text-muted-foreground">Monitor health, feedback, and restrictions.{issues > 0 && <span className="text-destructive ml-2 font-medium">{issues} with issues.</span>}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ebay-account"><Plus className="w-4 h-4 mr-2" /> Add Account</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add eBay Account</DialogTitle></DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4">
                <AccountFormFields form={addForm} />
                <DialogFooter><Button type="submit" disabled={createAccount.isPending}>Add Account</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 max-w-sm flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToCsv(filtered as Record<string, unknown>[], 'ebay-accounts')}>
          <Download className="w-4 h-4 mr-2" />Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>eBay Username</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead>Listings</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>MC</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                {search ? `No accounts matching "${search}".` : 'No eBay accounts yet.'}
              </TableCell></TableRow>
            ) : filtered.map(acc => (
              <TableRow key={acc.id} className={acc.mcRestriction ? 'bg-destructive/5' : ''}>
                <TableCell className="font-mono font-medium">{acc.ebayUsername}</TableCell>
                <TableCell className="text-muted-foreground">{acc.clientName}</TableCell>
                <TableCell><HealthBadge health={acc.accountHealth} /></TableCell>
                <TableCell>{acc.feedbackScore ?? '-'}</TableCell>
                <TableCell>{acc.activeListings ?? '-'}</TableCell>
                <TableCell>
                  {acc.twoFaEnabled
                    ? <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    : <ShieldAlert className="w-4 h-4 text-destructive" />}
                </TableCell>
                <TableCell>
                  {acc.mcRestriction
                    ? <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">MC Restricted</Badge>
                    : <span className="text-muted-foreground text-xs">Clear</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={acc.status === 'Active' ? 'default' : 'secondary'} className={acc.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs' : 'text-xs'}>
                    {acc.status || 'Active'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(acc as Account)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(acc.id, acc.ebayUsername)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => { if (!open) setEditingAccount(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit — {editingAccount?.ebayUsername}</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
              <AccountFormFields form={editForm} />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditingAccount(null)}>Cancel</Button>
                <Button type="submit" disabled={updateAccount.isPending}>Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
