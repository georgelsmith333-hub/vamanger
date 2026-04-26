import React, { useState } from 'react';
import { useGetTasks, getGetTasksQueryKey, useCreateTask, useUpdateTask, useDeleteTask, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  task: z.string().min(1, 'Task description is required'),
  clientId: z.coerce.number().optional(),
  priority: z.string().default('Medium'),
  dueDate: z.string().optional(),
  status: z.string().default('Not Started'),
  notes: z.string().optional(),
});

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return null;
  switch (priority) {
    case 'High': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High</Badge>;
    case 'Medium': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
    case 'Low': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Low</Badge>;
    default: return <Badge variant="secondary">{priority}</Badge>;
  }
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  switch (status) {
    case 'Done': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Done</Badge>;
    case 'In Progress': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">In Progress</Badge>;
    case 'Blocked': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Blocked</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function Tasks() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: tasks, isLoading } = useGetTasks({ query: { queryKey: getGetTasksQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { priority: 'Medium', status: 'Not Started' } });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createTask.mutate({ data }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() }); setIsAddOpen(false); form.reset(); },
    });
  };

  const handleToggleDone = (id: number, done: boolean) => {
    updateTask.mutate({ id, data: { done: !done, status: !done ? 'Done' : 'In Progress' } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() }),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this task?')) {
      deleteTask.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() }) });
    }
  };

  const filtered = tasks?.filter(t => t.task.toLowerCase().includes(search.toLowerCase()) || (t.clientName || '').toLowerCase().includes(search.toLowerCase())) || [];
  const pending = tasks?.filter(t => !t.done).length || 0;
  const overdue = tasks?.filter(t => !t.done && (t.daysLeft ?? 1) < 0).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Track all VA tasks across clients. {pending} pending{overdue > 0 ? `, ${overdue} overdue` : ''}.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Task</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="task" render={({ field }) => (
                  <FormItem><FormLabel>Task</FormLabel><FormControl><Input {...field} placeholder="Describe the task..." /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="clientId" render={({ field }) => (
                    <FormItem><FormLabel>Client (optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value || '')}>
                        <FormControl><SelectTrigger><SelectValue placeholder="All / General" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="">General</SelectItem>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem><FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Not Started">Not Started</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Blocked">Blocked</SelectItem><SelectItem value="Done">Done</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={createTask.isPending}>Save Task</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead><TableHead>Task</TableHead><TableHead>Client</TableHead><TableHead>Priority</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No tasks found.</TableCell></TableRow>
            ) : filtered.map(t => {
              const isOverdue = !t.done && (t.daysLeft ?? 1) < 0;
              return (
                <TableRow key={t.id} className={t.done ? 'opacity-60' : isOverdue ? 'bg-destructive/5' : ''}>
                  <TableCell>
                    <button onClick={() => handleToggleDone(t.id, t.done ?? false)} className="text-muted-foreground hover:text-primary">
                      {t.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                    </button>
                  </TableCell>
                  <TableCell className={`font-medium ${t.done ? 'line-through text-muted-foreground' : ''}`}>{t.task}</TableCell>
                  <TableCell className="text-muted-foreground">{t.clientName || '-'}</TableCell>
                  <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                  <TableCell>
                    {t.dueDate || '-'}
                    {isOverdue && <AlertCircle className="inline ml-1 w-3 h-3 text-destructive" />}
                  </TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id)}>
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
