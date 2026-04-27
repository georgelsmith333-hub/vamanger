import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import { ConfirmProvider } from "@/components/confirm-dialog";

import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import EbayAccounts from "@/pages/ebay-accounts";
import WiseCards from "@/pages/wise-cards";
import BankAccounts from "@/pages/bank-accounts";
import Invoices from "@/pages/invoices";
import Violations from "@/pages/violations";
import Tasks from "@/pages/tasks";
import Earnings from "@/pages/earnings";
import Expenses from "@/pages/expenses";
import Recovery from "@/pages/recovery";
import DailyLogin from "@/pages/daily-login";
import UserManual from "@/pages/user-manual";
import SheetsSync from "@/pages/sheets-sync";
import Download from "@/pages/download";
import Admin from "@/pages/admin/index";
import AdminLogin from "@/pages/admin/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function Router() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");
  const isDownload = location.startsWith("/download");

  if (isAdmin) {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/:rest*" component={Admin} />
      </Switch>
    );
  }

  if (isDownload) {
    return <Download />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/clients" component={Clients} />
        <Route path="/ebay-accounts" component={EbayAccounts} />
        <Route path="/wise-cards" component={WiseCards} />
        <Route path="/bank-accounts" component={BankAccounts} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/violations" component={Violations} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/earnings" component={Earnings} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/recovery" component={Recovery} />
        <Route path="/daily-login" component={DailyLogin} />
        <Route path="/manual" component={UserManual} />
        <Route path="/sheets-sync" component={SheetsSync} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConfirmProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </ConfirmProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
