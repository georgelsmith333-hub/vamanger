import { pgTable, text, serial, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ebayAccountsTable = pgTable("ebay_accounts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  ebayUsername: text("ebay_username").notNull(),
  ebayEmail: text("ebay_email"),
  ebayPassword: text("ebay_password"),
  marketplace: text("marketplace"),
  accountType: text("account_type"),
  accountHealth: text("account_health"),
  feedbackScore: integer("feedback_score"),
  topRated: boolean("top_rated").notNull().default(false),
  activeListings: integer("active_listings"),
  sellingLimit: numeric("selling_limit", { precision: 14, scale: 2 }),
  mcRestriction: boolean("mc_restriction").notNull().default(false),
  lastLogin: text("last_login"),
  lastPwdChange: text("last_pwd_change"),
  pwdExpiresIn: integer("pwd_expires_in"),
  twoFaEnabled: boolean("two_fa_enabled").notNull().default(false),
  linkedBankId: text("linked_bank_id"),
  linkedCardId: text("linked_card_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEbayAccountSchema = createInsertSchema(ebayAccountsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEbayAccount = z.infer<typeof insertEbayAccountSchema>;
export type EbayAccount = typeof ebayAccountsTable.$inferSelect;
