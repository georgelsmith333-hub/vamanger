import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recoveryEntriesTable = pgTable("recovery_entries", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  accountService: text("account_service").notNull(),
  recoveryEmail: text("recovery_email"),
  recoveryPhone: text("recovery_phone"),
  securityQ1: text("security_q1"),
  answer1: text("answer1"),
  securityQ2: text("security_q2"),
  answer2: text("answer2"),
  twoFaMethod: text("two_fa_method"),
  backupCodes: text("backup_codes"),
  totpSeed: text("totp_seed"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRecoveryEntrySchema = createInsertSchema(recoveryEntriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRecoveryEntry = z.infer<typeof insertRecoveryEntrySchema>;
export type RecoveryEntry = typeof recoveryEntriesTable.$inferSelect;
