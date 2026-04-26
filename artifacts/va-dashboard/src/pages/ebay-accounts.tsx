import React, { useState } from 'react';
import { useGetEbayAccounts, getGetEbayAccountsQueryKey, useCreateEbayAccount, useUpdateEbayAccount, useDeleteEbayAccount, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit2, Trash2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const ebayAccountSchema = z.object({
  clientId: z.coerce.number().min(1, 'Client is required'),
  ebayUsername: z.string().min(1, 'Username is required'),
  accountHealth: z.string().optional(),
  feedbackScore: z.coerce.number().optional(),
  topRated: z.boolean().default(false),
  activeListings: z.coerce.number().optional(),
  mcRestriction: z.boolean().default(false),
  twoFaEnabled: z.boolean().default(false),
});

export default function EbayAccounts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const { data: accounts, isLoading } = useGetEbayAccounts({
    query: { queryKey: getGetEbayAccountsQueryKey() }
  });

  const { data: clients } = useGetClients({
    query: { queryKey: getGetClientsQueryKey() }
  });

  const createAccount = useCreateEbayAccount();
  const deleteAccount = useDeleteEbayAccount();

  const form = useForm<z.infer<typeof ebayAccountSchema>>({
    resolver: zodResolver(ebayAccountSchema),
    defaultValues: {
      clientId: 0,
      ebayUsername: '',
      accountHealth: 'Good',
      feedbackScore: 0,
      topRated: false,
      activeListings: 0,
      mcRestriction: false,
      twoFaEnabled: true,
    },
  });

  const onSubmit = (data: z.infer<typeof ebayAccountSchema>) => {
    createAccount.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEbayAccountsQueryKey() });
          setIsAddOpen(false);
          form.reset();
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this account?')) {
      deleteAccount.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetEbayAccountsQueryKey() });
          },
        }
      );
    }
  };

  const filteredAccounts = accounts?.filter(a => 
    a.ebayUsername.toLowerCase().includes(search.toLowerCase()) || 
    a.clientName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getHealthBadge = (health: string | null | undefined) => {
    const h = health?.toLowerCase();
    if (h === 'excellent' || h === 'above standard') return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">{health}</Badge>;
    if (h === 'good') return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">{health}</Badge>;
    if (h === 'below standard') return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">{health}</Badge>;
    if (h === 'restricted' || h === 'suspended') return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">{health}</Badge>;
    return <Badge variant="outline">{health || 'Unknown'}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">eBay Accounts</h1>
          <p className="text-muted-foreground">Manage and monitor client eBay accounts.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ebay-account">
              <Plus className="w-4 h-4 mr-2" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add eBay Account</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} defaultValue={field.value ? field.value.toString() : ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>{client.clientName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ebayUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>eBay Username</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-ebay-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accountHealth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Health</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select health" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                            <SelectItem value="Above Standard">Above Standard</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Below Standard">Below Standard</SelectItem>
                            <SelectItem value="Restricted">Restricted</SelectItem>
                            <SelectItem value="Suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="feedbackScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Feedback Score</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-ebay-feedback" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createAccount.isPending} data-testid="button-save-ebay-account">
                    Save Account
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search accounts or clients..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9"
          data-testid="input-search-ebay-accounts"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>eBay Username</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead>Active Listings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No accounts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id} data-testid={`row-ebay-account-${account.id}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {account.ebayUsername}
                      {account.topRated && <Badge className="h-5 px-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px]">TRS</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{account.clientName}</TableCell>
                  <TableCell>{getHealthBadge(account.accountHealth)}</TableCell>
                  <TableCell>{account.feedbackScore || 0}</TableCell>
                  <TableCell>{account.activeListings || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {account.mcRestriction ? (
                         <Badge variant="outline" className="text-destructive border-destructive/50" title="MC Restriction">MC-R</Badge>
                      ) : null}
                      {account.twoFaEnabled ? (
                         <ShieldCheck className="w-4 h-4 text-emerald-500" title="2FA Enabled" />
                      ) : (
                         <ShieldAlert className="w-4 h-4 text-destructive" title="2FA Disabled" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(account.id)} data-testid={`button-delete-ebay-account-${account.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
