import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const violationsTable = pgTable("violations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  ebayUsername: text("ebay_username").notNull(),
  date: text("date"),
  policyCode: text("policy_code"),
  severity: text("severity"),
  description: text("description"),
  actionTaken: text("action_taken"),
  resolved: boolean("resolved").notNull().default(false),
  resolvedOn: text("resolved_on"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertViolationSchema = createInsertSchema(violationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertViolation = z.infer<typeof insertViolationSchema>;
export type Violation = typeof violationsTable.$inferSelect;
