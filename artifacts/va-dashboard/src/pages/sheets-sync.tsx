import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { API_BASE as BASE } from "@/lib/api-base";

const TABLES = [
  { key: "clients", label: "Clients" },
  { key: "invoices", label: "Invoices" },
  { key: "earnings", label: "Earnings" },
  { key: "expenses", label: "Expenses" },
  { key: "tasks", label: "Tasks" },
  { key: "violations", label: "Violations" },
];

const SHEET_ID_KEY = "va_sheet_id";
const getSheetId = () => localStorage.getItem(SHEET_ID_KEY) ?? "";
const setSheetId = (id: string) => localStorage.setItem(SHEET_ID_KEY, id);

export default function SheetsSync() {
  const { toast } = useToast();
  const [sheetId, setSheetIdState] = useState(getSheetId);
  const [sheetIdInput, setSheetIdInput] = useState(getSheetId);
  const [selectedTable, setSelectedTable] = useState("clients");
  const [exporting, setExporting] = useState(false);
  const [lastSync, setLastSync] = useState<Record<string, string>>({});

  const saveSheetId = () => {
    setSheetId(sheetIdInput.trim());
    setSheetIdState(sheetIdInput.trim());
    toast({ title: "Sheet ID saved", description: "Google Sheet ID stored locally." });
  };

  const exportToSheet = async (table: string) => {
    if (!sheetId) {
      toast({ title: "No Sheet ID", description: "Please save your Google Sheet ID first.", variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      const resp = await fetch(`${BASE}/api/sheets/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, sheetId }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        const errMsg = (data as { error?: string }).error ?? "Export failed";
        if (errMsg.includes("not configured")) {
          toast({
            title: "Google Sheets not configured on server",
            description: "Ask your admin to add GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_KEY to the server secrets.",
            variant: "destructive",
          });
        } else {
          throw new Error(errMsg);
        }
        return;
      }
      const result = data as { rows?: number };
      setLastSync(prev => ({ ...prev, [table]: new Date().toLocaleString() }));
      toast({ title: "Exported", description: `${result.rows ?? 0} rows pushed to Google Sheets successfully.` });
    } catch (e: unknown) {
      toast({ title: "Export failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const openSheet = () => {
    if (!sheetId) return;
    window.open(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`, "_blank");
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Google Sheets Sync</h1>
        <p className="text-muted-foreground mt-1">Export your data live to a Google Sheet for manual review or sharing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔗</span> Connect Your Google Sheet
          </CardTitle>
          <CardDescription>
            Paste your Google Sheet ID below. You can find it in the sheet URL: docs.google.com/spreadsheets/d/<strong>SHEET_ID</strong>/edit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="sheet-id">Google Sheet ID</Label>
              <Input
                id="sheet-id"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                value={sheetIdInput}
                onChange={e => setSheetIdInput(e.target.value)}
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={saveSheetId}>Save</Button>
              {sheetId && <Button variant="outline" onClick={openSheet}>Open Sheet</Button>}
            </div>
          </div>
          {sheetId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-green-600 bg-green-600/10">Connected</Badge>
              <span className="font-mono truncate max-w-xs">{sheetId}</span>
            </div>
          )}
          <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
            <strong>Server setup required:</strong> For exports to work, your server admin must set <code className="font-mono">GOOGLE_SHEET_ID</code> and <code className="font-mono">GOOGLE_SERVICE_ACCOUNT_KEY</code> as environment secrets, and share the sheet with the service account email. Contact your admin if exports fail.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Tables to Sheets</CardTitle>
          <CardDescription>Push any table's data directly to a named tab in your Google Sheet. Each export overwrites the previous data for that tab.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Last Synced</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TABLES.map(t => (
                <TableRow key={t.key}>
                  <TableCell className="font-medium">{t.label}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {lastSync[t.key] ?? "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={exporting}
                      onClick={() => exportToSheet(t.key)}
                    >
                      {exporting ? "Exporting…" : "Export Now"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
          <CardDescription>Step-by-step to connect Google Sheets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            <div className="flex gap-3 items-start">
              <Badge className="mt-0.5 shrink-0">1</Badge>
              <p>Go to <strong>console.cloud.google.com</strong> → Create a project → Enable <strong>Google Sheets API</strong></p>
            </div>
            <div className="flex gap-3 items-start">
              <Badge className="mt-0.5 shrink-0">2</Badge>
              <p>Create a <strong>Service Account</strong> → Download the JSON key file</p>
            </div>
            <div className="flex gap-3 items-start">
              <Badge className="mt-0.5 shrink-0">3</Badge>
              <p>Create a <strong>Google Sheet</strong> → Share it with the service account email (Editor access)</p>
            </div>
            <div className="flex gap-3 items-start">
              <Badge className="mt-0.5 shrink-0">4</Badge>
              <p>Add two secrets to your server: <code className="font-mono bg-muted px-1 rounded">GOOGLE_SHEET_ID</code> (the Sheet ID from the URL) and <code className="font-mono bg-muted px-1 rounded">GOOGLE_SERVICE_ACCOUNT_KEY</code> (the full JSON key file contents)</p>
            </div>
            <div className="flex gap-3 items-start">
              <Badge className="mt-0.5 shrink-0">5</Badge>
              <p>Paste the Sheet ID above → click <strong>Save</strong> → click <strong>Export Now</strong> on any table</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
