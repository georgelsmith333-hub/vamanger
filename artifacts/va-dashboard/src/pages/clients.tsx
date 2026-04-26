import React, { useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { useGetClients, getGetClientsQueryKey, useCreateClient, useUpdateClient, useDeleteClient } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit2, Trash2, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';

const clientSchema = z.object({
  clientName: z.string().min(1, 'Name is required'),
  status: z.string().min(1, 'Status is required'),
  serviceType: z.string().optional(),
  hourlyRate: z.coerce.number().optional(),
  currency: z.string().optional(),
  totalSales: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;
type Client = { id: number; clientName: string; status: string; serviceType?: string | null; hourlyRate?: number | null; currency?: string | null; totalSales?: number | null; ebayAccountsCount: number; notes?: string | null; createdAt: string };

export default function Clients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data: clients, isLoading } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const addForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { clientName: '', status: 'Active', serviceType: 'Full Management', hourlyRate: 15, currency: 'USD', totalSales: 0 },
  });

  const editForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const openEdit = (client: Client) => {
    setEditingClient(client);
    editForm.reset({
      clientName: client.clientName,
      status: client.status,
      serviceType: client.serviceType ?? '',
      hourlyRate: client.hourlyRate ?? 0,
      currency: client.currency ?? 'USD',
      totalSales: client.totalSales ?? 0,
      notes: (client as { notes?: string | null }).notes ?? '',
    });
  };

  const onAdd = (data: ClientFormData) => {
    createClient.mutate({ data }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getGetClientsQueryKey() });
        setIsAddOpen(false);
        addForm.reset();
        toast({ title: 'Client added', description: `${res.clientName} has been added.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to add client.', variant: 'destructive' }),
    });
  };

  const onEdit = (data: ClientFormData) => {
    if (!editingClient) return;
    updateClient.mutate({ id: editingClient.id, data }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getGetClientsQueryKey() });
        setEditingClient(null);
        toast({ title: 'Client updated', description: `${res.clientName} has been updated.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to update client.', variant: 'destructive' }),
    });
  };

  const handleDelete = async (id: number, name: string) => {
    if (await confirm({ title: 'Delete Client', description: `Permanently delete "${name}"? This cannot be undone.`, confirmText: 'Delete', variant: 'destructive' })) {
      deleteClient.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetClientsQueryKey() });
          toast({ title: 'Client deleted', description: `${name} has been removed.`, variant: 'destructive' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to delete client.', variant: 'destructive' }),
      });
    }
  };

  const filteredClients = clients?.filter(c => c.clientName.toLowerCase().includes(search.toLowerCase())) || [];

  const ClientForm = ({ form, onSubmit, isPending, submitLabel }: { form: ReturnType<typeof useForm<ClientFormData>>; onSubmit: (d: ClientFormData) => void; isPending: boolean; submitLabel: string }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="clientName" render={({ field }) => (
            <FormItem className="col-span-2"><FormLabel>Client Name *</FormLabel><FormControl><Input {...field} placeholder="e.g. John Carter" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="serviceType" render={({ field }) => (
            <FormItem><FormLabel>Service Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Full Management">Full Management</SelectItem>
                  <SelectItem value="Listing Only">Listing Only</SelectItem>
                  <SelectItem value="Customer Service">Customer Service</SelectItem>
                  <SelectItem value="Order Fulfillment">Order Fulfillment</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="hourlyRate" render={({ field }) => (
            <FormItem><FormLabel>Hourly Rate</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem><FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="totalSales" render={({ field }) => (
            <FormItem><FormLabel>Total Sales ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem className="col-span-2"><FormLabel>Notes</FormLabel><FormControl><Input {...field} placeholder="Any notes about this client..." /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : submitLabel}</Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your dropshipping client accounts and rates.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-client"><Plus className="w-4 h-4 mr-2" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
            <ClientForm form={addForm} onSubmit={onAdd} isPending={createClient.isPending} submitLabel="Add Client" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 max-w-sm flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" data-testid="search-clients" />
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToCsv(filteredClients as Record<string, unknown>[], 'clients')}>
          <Download className="w-4 h-4 mr-2" />Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>eBay Accts</TableHead>
              <TableHead>Total Sales</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filteredClients.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                {search ? `No clients matching "${search}".` : 'No clients yet. Click "Add Client" to get started.'}
              </TableCell></TableRow>
            ) : filteredClients.map(client => (
              <TableRow key={client.id} data-testid={`client-row-${client.id}`}>
                <TableCell className="font-medium">{client.clientName}</TableCell>
                <TableCell>
                  <Badge variant={client.status === 'Active' ? 'default' : 'secondary'} className={client.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}>
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{client.serviceType || '-'}</TableCell>
                <TableCell>{client.hourlyRate ? `${client.hourlyRate} ${client.currency || 'USD'}/hr` : '-'}</TableCell>
                <TableCell>{client.ebayAccountsCount}</TableCell>
                <TableCell>{client.totalSales ? `$${client.totalSales.toLocaleString()}` : '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(client as Client)} data-testid={`button-edit-client-${client.id}`}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(client.id, client.clientName)} data-testid={`button-delete-client-${client.id}`}>
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
      <Dialog open={!!editingClient} onOpenChange={(open) => { if (!open) setEditingClient(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Client — {editingClient?.clientName}</DialogTitle></DialogHeader>
          <ClientForm form={editForm} onSubmit={onEdit} isPending={updateClient.isPending} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
