import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  businessBrand: text("business_brand"),
  country: text("country"),
  email: text("email"),
  phone: text("phone"),
  serviceType: text("service_type"),
  onboardedOn: text("onboarded_on"),
  status: text("status").notNull().default("Active"),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  currency: text("currency"),
  totalSales: numeric("total_sales", { precision: 14, scale: 2 }),
  lastContact: text("last_contact"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
