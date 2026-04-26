import { pgTable, text, serial, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wiseCardsTable = pgTable("wise_cards", {
  id: serial("id").primaryKey(),
  cardCode: text("card_code").notNull(),
  clientId: integer("client_id").notNull(),
  provider: text("provider"),
  cardType: text("card_type"),
  cardHolder: text("card_holder"),
  cardNumberMasked: text("card_number_masked"),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  currency: text("currency"),
  wiseEmail: text("wise_email"),
  wisePassword: text("wise_password"),
  wise2fa: boolean("wise_2fa").notNull().default(false),
  linkedBankId: text("linked_bank_id"),
  balance: numeric("balance", { precision: 14, scale: 2 }),
  status: text("status"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWiseCardSchema = createInsertSchema(wiseCardsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWiseCard = z.infer<typeof insertWiseCardSchema>;
export type WiseCard = typeof wiseCardsTable.$inferSelect;
