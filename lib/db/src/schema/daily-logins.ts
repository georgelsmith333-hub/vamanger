import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyLoginsTable = pgTable("daily_logins", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  ebayUsername: text("ebay_username").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  targetPerWeek: integer("target_per_week"),
  loginDays: text("login_days").notNull().default("[]"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDailyLoginSchema = createInsertSchema(dailyLoginsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDailyLogin = z.infer<typeof insertDailyLoginSchema>;
export type DailyLogin = typeof dailyLoginsTable.$inferSelect;
