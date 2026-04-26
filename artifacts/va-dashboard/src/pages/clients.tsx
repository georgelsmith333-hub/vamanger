import React, { useState } from 'react';
import { useGetClients, getGetClientsQueryKey, useCreateClient, useUpdateClient, useDeleteClient } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
});

export default function Clients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const { data: clients, isLoading } = useGetClients({
    query: { queryKey: getGetClientsQueryKey() }
  });

  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      clientName: '',
      status: 'Active',
      serviceType: 'Full Management',
      hourlyRate: 15,
      currency: 'USD',
      totalSales: 0,
    },
  });

  const onSubmit = (data: z.infer<typeof clientSchema>) => {
    createClient.mutate(
      { data },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getGetClientsQueryKey() });
          setIsAddOpen(false);
          form.reset();
          toast({ title: "Client Added", description: `${data.clientName} has been added successfully.` });
        },
        onError: (err: Error) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete client "${name}"? This cannot be undone from the main app.`)) {
      deleteClient.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetClientsQueryKey() });
          toast({ title: "Client Deleted", description: `${name} has been removed.` });
        },
        onError: (err: Error) => {
          toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
        },
      });
    }
  };

  const filteredClients = clients?.filter(c => c.clientName.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your client list and details.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-client">
              <Plus className="w-4 h-4 mr-2" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-client-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-client-status" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-client-service-type" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-client-hourly-rate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-client-currency" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createClient.isPending} data-testid="button-save-client">
                    Save Client
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
          placeholder="Search clients..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9"
          data-testid="input-search-clients"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>eBay Accounts</TableHead>
              <TableHead>Total Sales</TableHead>
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
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                  <TableCell className="font-medium">{client.clientName}</TableCell>
                  <TableCell>
                    <Badge variant={client.status.toLowerCase() === 'active' ? 'default' : 'secondary'} className="bg-primary/10 text-primary hover:bg-primary/20">
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.serviceType || '-'}</TableCell>
                  <TableCell>{client.hourlyRate ? `${client.hourlyRate} ${client.currency || 'USD'}/hr` : '-'}</TableCell>
                  <TableCell>{client.ebayAccountsCount}</TableCell>
                  <TableCell>{client.totalSales ? `$${client.totalSales.toLocaleString()}` : '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(client.id, client.clientName)} data-testid={`button-delete-client-${client.id}`}>
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
