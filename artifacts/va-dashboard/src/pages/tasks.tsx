import React, { useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { useGetTasks, getGetTasksQueryKey, useCreateTask, useUpdateTask, useDeleteTask, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Trash2, CheckCircle2, Circle, AlertCircle, Edit2, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
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
  const { toast } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [editingTask, setEditingTask] = useState<{ id: number; task: string } & z.infer<typeof schema> | null>(null);

  const { data: tasks, isLoading } = useGetTasks({ query: { queryKey: getGetTasksQueryKey() } });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { priority: 'Medium', status: 'Not Started' } });
  const editForm = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const openEditTask = (t: { id: number; task: string; clientId?: number | null; priority?: string | null; dueDate?: string | null; status?: string | null; notes?: string | null }) => {
    setEditingTask({ id: t.id, task: t.task, clientId: t.clientId ?? undefined, priority: t.priority ?? 'Medium', dueDate: t.dueDate ?? '', status: t.status ?? 'Not Started', notes: t.notes ?? '' });
    editForm.reset({ task: t.task, clientId: t.clientId ?? undefined, priority: t.priority ?? 'Medium', dueDate: t.dueDate ?? '', status: t.status ?? 'Not Started', notes: t.notes ?? '' });
  };

  const onEditSubmit = (data: z.infer<typeof schema>) => {
    if (!editingTask) return;
    updateTask.mutate({ id: editingTask.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        setEditingTask(null);
        toast({ title: 'Task updated', description: `"${data.task}" has been updated.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to update task.', variant: 'destructive' }),
    });
  };

  const onSubmit = (data: z.infer<typeof schema>) => {
    createTask.mutate({ data }, {
      onSuccess: (task) => {
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: 'Task created', description: `"${(task as { task?: string }).task || 'Task'}" added successfully.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to create task.', variant: 'destructive' }),
    });
  };

  const handleToggleDone = (id: number, done: boolean, taskTitle: string) => {
    updateTask.mutate({ id, data: { done: !done, status: !done ? 'Done' : 'In Progress' } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        toast({ title: !done ? 'Task completed' : 'Task reopened', description: `"${taskTitle}" marked as ${!done ? 'done' : 'in progress'}.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to update task.', variant: 'destructive' }),
    });
  };

  const handleDelete = async (id: number, taskTitle: string) => {
    if (await confirm({ title: 'Delete Task', description: `Delete "${taskTitle}"? This cannot be undone.`, confirmText: 'Delete', variant: 'destructive' })) {
      deleteTask.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          toast({ title: 'Task deleted', description: `"${taskTitle}" has been removed.`, variant: 'destructive' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to delete task.', variant: 'destructive' }),
      });
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

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 max-w-sm flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToCsv(filtered as Record<string, unknown>[], 'tasks')}>
          <Download className="w-4 h-4 mr-2" />Export CSV
        </Button>
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
                    <button onClick={() => handleToggleDone(t.id, t.done ?? false, t.task)} className="text-muted-foreground hover:text-primary">
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
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditTask(t)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id, t.task)}>
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

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField control={editForm.control} name="task" render={({ field }) => (
                <FormItem><FormLabel>Task *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="clientId" render={({ field }) => (
                  <FormItem><FormLabel>Client</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v ? Number(v) : undefined)} value={field.value ? String(field.value) : ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="General" /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="">General</SelectItem>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="priority" render={({ field }) => (
                  <FormItem><FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="dueDate" render={({ field }) => (
                  <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="Not Started">Not Started</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Blocked">Blocked</SelectItem><SelectItem value="Done">Done</SelectItem></SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditingTask(null)}>Cancel</Button>
                <Button type="submit" disabled={updateTask.isPending}>Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
