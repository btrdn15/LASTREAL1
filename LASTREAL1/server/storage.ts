import { 
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct,
  type Transaction,
  type InsertTransaction,
  users,
  products,
  transactions
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, ilike, and } from "drizzle-orm";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductByName(name: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  updateProductQuantity(id: string, quantity: number): Promise<Product | undefined>;
  
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
}

const VALID_USERS = [
  { username: "admin1", password: "admin123" },
  { username: "admin2", password: "admin123" },
  { username: "admin3", password: "admin123" },
  { username: "btrdn", password: "ud02db3510" },
];

export class DatabaseStorage implements IStorage {
  async initializeUsers() {
    try {
      for (const validUser of VALID_USERS) {
        try {
          const existing = await this.getUserByUsername(validUser.username);
          if (!existing) {
            await this.createUser(validUser);
            console.log(`User created: ${validUser.username}`);
          } else {
            console.log(`User already exists: ${validUser.username}`);
          }
        } catch (err) {
          console.error(`Error initializing user ${validUser.username}:`, err);
        }
      }
    } catch (err) {
      console.error("Error during user initialization:", err);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db.insert(users).values({ id, ...insertUser }).returning();
    return user;
  }

  async getProducts(username?: string): Promise<Product[]> {
    let result: Product[];
    if (username) {
      result = await db.select().from(products).where(eq(products.createdBy, username));
    } else {
      result = await db.select().from(products);
    }
    return result.sort((a, b) => a.name.localeCompare(b.name, 'mn'));
  }

  async getProduct(id: string, username?: string): Promise<Product | undefined> {
    let result: Product[];
    if (username) {
      result = await db.select().from(products).where(and(eq(products.id, id), eq(products.createdBy, username))).limit(1);
    } else {
      result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    }
    const [product] = result;
    return product;
  }

  async getProductByName(name: string, username?: string): Promise<Product | undefined> {
    const allProducts = await this.getProducts(username);
    return allProducts.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode)).limit(1);
    return product;
  }

  async createProduct(insertProduct: InsertProduct, createdBy: string = "unknown"): Promise<Product> {
    const id = randomUUID();
    const [product] = await db.insert(products).values({ 
      id, 
      name: insertProduct.name,
      quantity: insertProduct.quantity,
      category: insertProduct.category || "other",
      lowStockThreshold: insertProduct.lowStockThreshold || 10,
      barcode: insertProduct.barcode || null,
      createdBy,
    }).returning();
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async updateProductQuantity(id: string, quantity: number): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({ quantity })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async getTransactions(username?: string): Promise<Transaction[]> {
    let result: Transaction[];
    if (username) {
      result = await db.select().from(transactions).where(eq(transactions.createdBy, username));
    } else {
      result = await db.select().from(transactions);
    }
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTransaction(id: string, username?: string): Promise<Transaction | undefined> {
    let result: Transaction[];
    if (username) {
      result = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.createdBy, username))).limit(1);
    } else {
      result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    }
    const [transaction] = result;
    return transaction;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const [transaction] = await db.insert(transactions).values({ 
      id, 
      items: insertTransaction.items,
      totalAmount: insertTransaction.totalAmount,
      createdAt: insertTransaction.createdAt,
      createdBy: insertTransaction.createdBy,
      customerName: insertTransaction.customerName || null,
    }).returning();
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [transaction] = await db.update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();

storage.initializeUsers().catch(console.error);
