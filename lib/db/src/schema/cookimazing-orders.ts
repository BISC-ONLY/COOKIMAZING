import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, serial, smallint, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type SavedOrderTopping = {
  id: string;
  name: string;
  price: number;
};

export type SavedOrderCookieSelection = {
  cookieId: string;
  cookieName: string;
  toppings: SavedOrderTopping[];
};

export type SavedOrderItem = {
  productId: string;
  productType: "cookie" | "shake";
  name: string;
  quantity: number;
  toppings: SavedOrderTopping[];
  cookieSelections?: SavedOrderCookieSelection[];
  unitPrice: number;
  lineTotal: number;
};

export const COOKIMAZINGOrdersTable = pgTable("COOKIMAZING_orders", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 20 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  className: varchar("class_name", { length: 30 }).notNull(),
  yearGroup: varchar("year_group", { length: 30 }).notNull(),
  // Retained for historical orders that stored a calendar day-of-month.
  requestedOrderDay: smallint("requested_order_day"),
  requestedWeekday: varchar("requested_weekday", { length: 9 }),
  specialNote: text("special_note"),
  paymentMethod: varchar("payment_method", { length: 32 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 32 }).notNull(),
  items: jsonb("items").$type<SavedOrderItem[]>().notNull(),
  total: integer("total").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCOOKIMAZINGOrderSchema = createInsertSchema(COOKIMAZINGOrdersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCOOKIMAZINGOrder = z.infer<typeof insertCOOKIMAZINGOrderSchema>;
export type COOKIMAZINGOrder = typeof COOKIMAZINGOrdersTable.$inferSelect;