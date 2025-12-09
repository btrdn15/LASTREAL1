import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const PRODUCT_CATEGORIES = [
  { value: "food", label: "Хүнсний бүтээгдэхүүн" },
  { value: "beverage", label: "Уух зүйлс" },
  { value: "electronics", label: "Цахилгаан бараа" },
  { value: "clothing", label: "Хувцас" },
  { value: "household", label: "Ахуйн бараа" },
  { value: "cosmetics", label: "Гоо сайхан" },
  { value: "medicine", label: "Эм тариа" },
  { value: "stationery", label: "Бичгийн хэрэгсэл" },
  { value: "other", label: "Бусад" },
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]["value"];

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const products = pgTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(0),
  category: text("category").notNull().default("other"),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  barcode: text("barcode"),
  createdBy: text("created_by").notNull().default("admin"),
});

export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  items: jsonb("items").notNull().$type<TransactionItem[]>(),
  totalAmount: integer("total_amount").notNull(),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
  customerName: text("customer_name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  quantity: true,
  category: true,
  lowStockThreshold: true,
  barcode: true,
}).extend({
  name: z.string().min(1, "Бүтээгдэхүүний нэр оруулна уу"),
  quantity: z.number().min(0, "Тоо хэмжээ 0-с их байх ёстой"),
  category: z.string().default("other"),
  lowStockThreshold: z.number().min(0).default(10),
  barcode: z.string().optional().nullable(),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const transactionItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().min(1),
  price: z.number().min(0),
});

export type TransactionItem = z.infer<typeof transactionItemSchema>;

export const insertTransactionSchema = z.object({
  items: z.array(transactionItemSchema).min(1),
  totalAmount: z.number().min(0),
  createdAt: z.string(),
  createdBy: z.string(),
  customerName: z.string().min(1, "Хүний нэр оруулна уу").optional().nullable(),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type CartItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};
