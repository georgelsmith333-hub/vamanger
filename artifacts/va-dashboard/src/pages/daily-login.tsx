import React, { useState } from 'react';
import { useGetDailyLogins, getGetDailyLoginsQueryKey, useCreateDailyLogin, useUpdateDailyLogin, useGetClients, getGetClientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, CalendarDays, CheckCircle2, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const schema = z.object({
  clientId: z.coerce.number().min(1, 'Client is required'),
  ebayUsername: z.string().min(1, 'eBay username required'),
  year: z.coerce.number().min(2020).max(2099),
  month: z.coerce.number().min(1).max(12),
  targetPerWeek: z.coerce.number().min(1).max(7).default(5),
  loginDays: z.array(z.number()).default([]),
});

function CalendarGrid({ loginDays, year, month, onToggle }: { loginDays: number[]; year: number; month: number; onToggle: (day: number) => void }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  return (
    <div className="grid grid-cols-7 gap-1">
      {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
        <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
      ))}
      {Array.from({ length: (new Date(year, month - 1, 1).getDay() + 6) % 7 }).map((_, i) => (
        <div key={`empty-${i}`} />
      ))}
      {days.map(day => {
        const done = loginDays.includes(day);
        const today = new Date();
        const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
        return (
          <button key={day} onClick={() => onToggle(day)}
            className={`rounded p-1 text-xs text-center transition-all ${done ? 'bg-emerald-500 text-white' : isToday ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
            {day}
          </button>
        );
      })}
    </div>
  );
}

export default function DailyLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const now = new Date();

  const { data: logins, isLoading } = useGetDailyLogins({
    params: { year: now.getFullYear(), month: now.getMonth() + 1 },
    query: { queryKey: [...getGetDailyLoginsQueryKey(), now.getFullYear(), now.getMonth() + 1] }
  });
  const { data: clients } = useGetClients({ query: { queryKey: getGetClientsQueryKey() } });
  const createLogin = useCreateDailyLogin();
  const updateLogin = useUpdateDailyLogin();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { year: now.getFullYear(), month: now.getMonth() + 1, targetPerWeek: 5, loginDays: [] },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createLogin.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDailyLoginsQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: 'Tracker created', description: `Login tracker for ${data.ebayUsername} added.` });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to create tracker.', variant: 'destructive' }),
    });
  };

  const handleToggleDay = (loginId: number, currentDays: number[], day: number) => {
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);
    updateLogin.mutate({ id: loginId, data: { loginDays: newDays } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetDailyLoginsQueryKey() }),
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Login Tracker</h1>
          <p className="text-muted-foreground flex items-center gap-2"><CalendarDays className="w-4 h-4" />
            Track daily eBay login activity — {MONTHS[now.getMonth()]} {now.getFullYear()}
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Tracker</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Login Tracker</DialogTitle></DialogHeader>
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
                  <FormField control={form.control} name="ebayUsername" render={({ field }) => (
                    <FormItem><FormLabel>eBay Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="year" render={({ field }) => (
                    <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="month" render={({ field }) => (
                    <FormItem><FormLabel>Month</FormLabel>
                      <Select onValueChange={v => field.onChange(Number(v))} defaultValue={String(field.value)}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="targetPerWeek" render={({ field }) => (
                    <FormItem><FormLabel>Target Days/Week</FormLabel><FormControl><Input type="number" min="1" max="7" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <DialogFooter><Button type="submit" disabled={createLogin.isPending}>Create Tracker</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
        </div>
      ) : !logins || logins.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No trackers for this month. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {logins.map(login => {
            const loginDays = Array.isArray(login.loginDays) ? login.loginDays as number[] : [];
            const adherence = login.adherencePct ?? 0;
            return (
              <div key={login.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{login.ebayUsername}</p>
                    <p className="text-xs text-muted-foreground">{login.clientName} • {MONTHS[(login.month ?? 1) - 1]} {login.year}</p>
                  </div>
                  <Badge className={adherence >= 0.8 ? 'bg-emerald-500/20 text-emerald-400' : adherence >= 0.5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}>
                    {Math.round(adherence * 100)}%
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />{login.doneThisMonth ?? loginDays.length} days logged
                  <Circle className="w-4 h-4" />Target: {login.targetPerWeek ?? 5}/week
                </div>

                <CalendarGrid
                  loginDays={loginDays}
                  year={login.year ?? now.getFullYear()}
                  month={login.month ?? now.getMonth() + 1}
                  onToggle={(day) => handleToggleDay(login.id, loginDays, day)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
