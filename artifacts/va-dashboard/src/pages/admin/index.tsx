import React from "react";
import { Switch, Route } from "wouter";
import AdminLayout from "./layout";
import AdminDashboard from "./dashboard";
import AdminActivity from "./activity";
import AdminSettings from "./settings";
import AdminExport from "./export";

export default function Admin() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/activity" component={AdminActivity} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/export" component={AdminExport} />
      </Switch>
    </AdminLayout>
  );
}
