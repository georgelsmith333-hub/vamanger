import { db, auditLogTable } from "@workspace/db";

export async function logAudit({
  action,
  tableName,
  recordId,
  description,
  previousData,
  newData,
  performedBy = "admin",
}: {
  action: "CREATE" | "UPDATE" | "DELETE";
  tableName: string;
  recordId?: number;
  description: string;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  performedBy?: string;
}) {
  try {
    await db.insert(auditLogTable).values({
      action,
      tableName,
      recordId: recordId ?? null,
      description,
      previousData: previousData ?? null,
      newData: newData ?? null,
      performedBy,
      undone: false,
    });
  } catch (e) {
    // Non-blocking — audit failures should not break business logic
    console.error("Audit log failed:", e);
  }
}
