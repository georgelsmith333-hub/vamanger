import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import AdminLayout from "./layout";
import AdminDashboard from "./dashboard";
import AdminActivity from "./activity";
import AdminSettings from "./settings";
import AdminExport from "./export";
import AdminManual from "./manual";
import AdminUsers from "./users";
import AdminNotificationsConfig from "./notifications-config";
import AdminVault from "./vault";
import { isAdminAuthenticated } from "./login";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
    }
  }, [navigate]);

  if (!isAdminAuthenticated()) return null;
  return <>{children}</>;
}

export default function Admin() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/activity" component={AdminActivity} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/admin/export" component={AdminExport} />
          <Route path="/admin/manual" component={AdminManual} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/notifications" component={AdminNotificationsConfig} />
          <Route path="/admin/vault" component={AdminVault} />
        </Switch>
      </AdminLayout>
    </AdminGuard>
  );
}
