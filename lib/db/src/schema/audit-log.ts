import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditLogTable = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(), // CREATE | UPDATE | DELETE
  tableName: text("table_name").notNull(),
  recordId: integer("record_id"),
  description: text("description").notNull(),
  previousData: jsonb("previous_data"),
  newData: jsonb("new_data"),
  performedBy: text("performed_by").default("admin"),
  undone: boolean("undone").default(false),
  undoneAt: timestamp("undone_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogTable).omit({ id: true, createdAt: true, undoneAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogTable.$inferSelect;
