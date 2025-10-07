import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  image: text("image").notNull(),
  available: boolean("available").notNull().default(true),
  stockQuantity: integer("stock_quantity").notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  items: jsonb("items").notNull(), // Array of {id, name, price, quantity}
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // 'gpay', 'cash', 'split', or 'creditor'
  billerName: text("biller_name").notNull().default('Sriram'),
  splitPayment: jsonb("split_payment"), // {gpayAmount: number, cashAmount: number} for split payments
  extras: jsonb("extras"), // Array of {name: string, amount: number}
  creditor: jsonb("creditor"), // {name: string, totalAmount: number, paidAmount: number, balanceAmount: number} for creditor payments
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  date: text("date").notNull(), // YYYY-MM-DD format
  dayName: text("day_name").notNull(),
  time: text("time").notNull(), // HH:MM AM/PM format
});

export const dailySummaries = pgTable("daily_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull().unique(), // YYYY-MM-DD format
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  gpayAmount: decimal("gpay_amount", { precision: 10, scale: 2 }).notNull(),
  cashAmount: decimal("cash_amount", { precision: 10, scale: 2 }).notNull(),
  orderCount: integer("order_count").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const weeklySummaries = pgTable("weekly_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekStart: text("week_start").notNull(), // YYYY-MM-DD format (Monday)
  weekEnd: text("week_end").notNull(), // YYYY-MM-DD format (Sunday)
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  gpayAmount: decimal("gpay_amount", { precision: 10, scale: 2 }).notNull(),
  cashAmount: decimal("cash_amount", { precision: 10, scale: 2 }).notNull(),
  orderCount: integer("order_count").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const monthlySummaries = pgTable("monthly_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: text("month").notNull(), // YYYY-MM format
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  gpayAmount: decimal("gpay_amount", { precision: 10, scale: 2 }).notNull(),
  cashAmount: decimal("cash_amount", { precision: 10, scale: 2 }).notNull(),
  orderCount: integer("order_count").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertDailySummarySchema = createInsertSchema(dailySummaries).omit({
  id: true,
  createdAt: true,
});

export const insertWeeklySummarySchema = createInsertSchema(weeklySummaries).omit({
  id: true,
  createdAt: true,
});

export const insertMonthlySummarySchema = createInsertSchema(monthlySummaries).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type DailySummary = typeof dailySummaries.$inferSelect;
export type InsertDailySummary = z.infer<typeof insertDailySummarySchema>;

export type WeeklySummary = typeof weeklySummaries.$inferSelect;
export type InsertWeeklySummary = z.infer<typeof insertWeeklySummarySchema>;

export type MonthlySummary = typeof monthlySummaries.$inferSelect;
export type InsertMonthlySummary = z.infer<typeof insertMonthlySummarySchema>;

// Cart item type for frontend
export type CartItem = {
  id: string;
  name: string;
  price: string;
  quantity: number;
};
