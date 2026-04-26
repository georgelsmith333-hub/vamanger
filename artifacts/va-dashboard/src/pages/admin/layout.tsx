import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Activity, Settings, Download, ArrowLeft,
  Shield, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/activity", label: "Audit Log", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/export", label: "Data Export", icon: Download },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden dark text-foreground">
      {/* Admin Sidebar */}
      <aside className="w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center gap-3 px-4 border-b border-zinc-800">
          <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Admin Panel</p>
            <p className="text-xs text-zinc-500">System Control</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact ? location === item.href : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-red-600/20 text-red-400 font-medium"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center px-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="text-zinc-200 font-medium">Admin</span>
            {location !== "/admin" && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-zinc-200 capitalize">{location.split("/admin/")[1]}</span>
              </>
            )}
          </div>
          <div className="ml-auto">
            <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 rounded px-2 py-0.5">
              Administrator Access
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-zinc-950">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
