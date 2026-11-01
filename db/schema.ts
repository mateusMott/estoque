import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey, check } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(), name: text("name").notNull(),
  barcode: text("barcode").notNull().unique(), gemco: text("gemco").notNull().unique(),
});
// A single namespace prevents a barcode from matching another product's Gemco.
export const codes = sqliteTable("codes", {
  code: text("code").primaryKey(), productId: text("product_id").notNull().references(() => products.id),
});
export const balances = sqliteTable("balances", {
  productId: text("product_id").notNull().references(() => products.id),
  location: text("location").notNull(), quantity: integer("quantity").notNull(),
}, t => [primaryKey({columns:[t.productId,t.location]}), check("nonnegative_quantity",sql`${t.quantity} >= 0 AND ${t.quantity} <= 1000000000`)]);
export const operations = sqliteTable("operations", {
  id: text("id").primaryKey(), productId: text("product_id").notNull().references(() => products.id),
  kind: text("kind").notNull(), quantity: integer("quantity").notNull(),
  source: text("source"), destination: text("destination"), reason: text("reason"),
  payload: text("payload").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, t => [check("positive_quantity",sql`${t.quantity} > 0 AND ${t.quantity} <= 1000000`), check("operation_kind",sql`${t.kind} IN ('entry', 'add', 'move', 'remove')`)]);
