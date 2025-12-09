import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertProductSchema, type CartItem, PRODUCT_CATEGORIES } from "@shared/schema";
import { z } from "zod";
import * as XLSX from "xlsx";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "warehouse-management-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  function requireAuth(req: Request, res: Response, next: Function) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Нэвтрээгүй байна" });
    }
    next();
  }

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Нэвтрэх нэр болон нууц үг шаардлагатай" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Нэвтрэх нэр эсвэл нууц үг буруу байна" });
      }

      req.session.userId = user.id;
      
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Серверийн алдаа" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Гарахад алдаа гарлаа" });
      }
      res.json({ message: "Амжилттай гарлаа" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Нэвтрээгүй байна" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    res.json({ id: user.id, username: user.username });
  });

  app.get("/api/categories", requireAuth, (req, res) => {
    res.json(PRODUCT_CATEGORIES);
  });

  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      const products = await storage.getProducts(user?.username);
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Бүтээгдэхүүн авахад алдаа гарлаа" });
    }
  });

  app.get("/api/products/barcode/:barcode", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProductByBarcode(req.params.barcode);
      if (!product) {
        return res.status(404).json({ message: "Бүтээгдэхүүн олдсонгүй" });
      }
      res.json(product);
    } catch (error) {
      console.error("Get product by barcode error:", error);
      res.status(500).json({ message: "Бүтээгдэхүүн авахад алдаа гарлаа" });
    }
  });

  app.get("/api/products/low-stock", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const lowStockProducts = products.filter(p => p.quantity <= p.lowStockThreshold);
      res.json(lowStockProducts);
    } catch (error) {
      console.error("Get low stock products error:", error);
      res.status(500).json({ message: "Бүтээгдэхүүн авахад алдаа гарлаа" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const result = insertProductSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Буруу мэдээлэл", 
          errors: result.error.errors 
        });
      }

      const { name, quantity, category, lowStockThreshold, barcode } = result.data;

      const user = await storage.getUser(req.session.userId!);
      const existingProduct = await storage.getProductByName(name, user?.username);
      
      if (existingProduct) {
        const updated = await storage.updateProduct(existingProduct.id, {
          quantity: existingProduct.quantity + quantity,
          category: category || existingProduct.category,
          lowStockThreshold: lowStockThreshold ?? existingProduct.lowStockThreshold,
          barcode: barcode || existingProduct.barcode,
        });
        return res.json(updated);
      }

      const product = await storage.createProduct({ 
        name, 
        quantity, 
        category: category || "other",
        lowStockThreshold: lowStockThreshold || 10,
        barcode: barcode || null,
      }, user?.username || "unknown");
      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Бүтээгдэхүүн нэмэхэд алдаа гарлаа" });
    }
  });

  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const product = await storage.updateProduct(id, updates);
      if (!product) {
        return res.status(404).json({ message: "Бүтээгдэхүүн олдсонгүй" });
      }
      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Бүтээгдэхүүн засахад алдаа гарлаа" });
    }
  });

  const transactionSchema = z.object({
    items: z.array(z.object({
      productId: z.string(),
      productName: z.string(),
      quantity: z.number().min(1),
      price: z.number().min(0),
    })).min(1),
    customerName: z.string().trim().optional().or(z.literal("")),
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const result = transactionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Буруу мэдээлэл", 
          errors: result.error.errors 
        });
      }

      const { items, customerName } = result.data;

      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ 
            message: `Бүтээгдэхүүн олдсонгүй: ${item.productName}` 
          });
        }
        if (product.quantity < item.quantity) {
          return res.status(400).json({ 
            message: `${item.productName} бүтээгдэхүүний үлдэгдэл хүрэлцэхгүй байна. Үлдэгдэл: ${product.quantity}` 
          });
        }
      }

      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          await storage.updateProductQuantity(
            item.productId,
            product.quantity - item.quantity
          );
        }
      }

      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      const user = await storage.getUser(req.session.userId!);

      const transaction = await storage.createTransaction({
        items,
        totalAmount,
        createdAt: new Date().toISOString(),
        createdBy: user?.username || "Unknown",
        customerName: customerName || null,
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(500).json({ message: "Гүйлгээ бүртгэхэд алдаа гарлаа" });
    }
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      const transactions = await storage.getTransactions(user?.username);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Гүйлгээ авахад алдаа гарлаа" });
    }
  });

  // Routes with literal strings must come BEFORE parameterized routes to avoid conflicts
  app.get("/api/transactions/today/csv", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      const allTransactions = await storage.getTransactions(user?.username);
      
      // Get today's date in Ulaanbaatar timezone
      const today = new Date();
      const todayStr = today.toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" });
      
      // Filter transactions for today only
      const todayTransactions = allTransactions.filter(transaction => {
        const transDate = new Date(transaction.createdAt);
        const transDateStr = transDate.toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" });
        return transDateStr === todayStr;
      });
      
      const data: any[] = [];
      
      todayTransactions.forEach((transaction, index) => {
        const date = new Date(transaction.createdAt);
        const dateStr = date.toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" });
        const timeStr = date.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ulaanbaatar" });
        
        transaction.items.forEach((item, itemIndex) => {
          data.push({
            "Гүйлгээний дугаар": index + 1,
            "Огноо": dateStr,
            "Цаг": timeStr,
            "Бүтээгдэхүүн": item.productName,
            "Тоо ширхэг": item.quantity,
            "Үнэ": item.price,
            "Нийт үнэ": item.quantity * item.price,
            "Гүйлгээний нийт дүн": itemIndex === 0 ? transaction.totalAmount : "",
            "Үйлчүүлэгч": transaction.customerName || "",
            "Хэрэглэгч": transaction.createdBy
          });
        });
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Өнөөдрийн Гүйлгээ");
      
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=transactions-today-${new Date().toISOString().split("T")[0]}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Today transactions CSV export error:", error);
      res.status(500).json({ message: "CSV татахад алдаа гарлаа" });
    }
  });

  app.get("/api/transactions/:id/csv", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(req.session.userId!);
      const transaction = await storage.getTransaction(id, user?.username);
      
      if (!transaction) {
        return res.status(404).json({ message: "Гүйлгээ олдсонгүй" });
      }
      
      const date = new Date(transaction.createdAt);
      const dateStr = date.toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" });
      const timeStr = date.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ulaanbaatar" });
      
      const data: any[] = [];
      transaction.items.forEach((item, itemIndex) => {
        data.push({
          "Огноо": dateStr,
          "Цаг": timeStr,
          "Бүтээгдэхүүн": item.productName,
          "Тоо ширхэг": item.quantity,
          "Үнэ": item.price,
          "Нийт үнэ": item.quantity * item.price,
          "Гүйлгээний нийт дүн": itemIndex === 0 ? transaction.totalAmount : "",
          "Үйлчүүлэгч": transaction.customerName || "",
          "Хэрэглэгч": transaction.createdBy
        });
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Гүйлгээ");
      
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=transaction-${id.substring(0, 8)}-${new Date().toISOString().split("T")[0]}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Transaction CSV export error:", error);
      res.status(500).json({ message: "CSV татахад алдаа гарлаа" });
    }
  });

  app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { restoreStock } = req.query;
      
      const user = await storage.getUser(req.session.userId!);
      const transaction = await storage.getTransaction(id, user?.username);
      if (!transaction) {
        return res.status(404).json({ message: "Гүйлгээ олдсонгүй" });
      }

      if (restoreStock === "true") {
        for (const item of transaction.items) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            await storage.updateProductQuantity(
              item.productId,
              product.quantity + item.quantity
            );
          }
        }
      }

      const deleted = await storage.deleteTransaction(id);
      if (!deleted) {
        return res.status(500).json({ message: "Гүйлгээ устгахад алдаа гарлаа" });
      }

      res.json({ message: "Гүйлгээ амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Delete transaction error:", error);
      res.status(500).json({ message: "Гүйлгээ устгахад алдаа гарлаа" });
    }
  });

  app.get("/api/transactions/csv", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      const transactions = await storage.getTransactions(user?.username);
      
      const data: any[] = [];
      
      transactions.forEach((transaction, index) => {
        const date = new Date(transaction.createdAt);
        const dateStr = date.toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" });
        const timeStr = date.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ulaanbaatar" });
        
        transaction.items.forEach((item, itemIndex) => {
          data.push({
            "Гүйлгээний дугаар": index + 1,
            "Огноо": dateStr,
            "Цаг": timeStr,
            "Бүтээгдэхүүн": item.productName,
            "Тоо ширхэг": item.quantity,
            "Үнэ": item.price,
            "Нийт үнэ": item.quantity * item.price,
            "Гүйлгээний нийт дүн": itemIndex === 0 ? transaction.totalAmount : "",
            "Үйлчүүлэгч": transaction.customerName || "",
            "Хэрэглэгч": transaction.createdBy
          });
        });
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Гүйлгээнүүд");
      
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=transactions-${new Date().toISOString().split("T")[0]}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({ message: "CSV татахад алдаа гарлаа" });
    }
  });

  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const products = await storage.getProducts();

      const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
      const totalTransactions = transactions.length;
      const totalProducts = products.length;
      const lowStockCount = products.filter(p => p.quantity <= p.lowStockThreshold).length;

      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      transactions.forEach(t => {
        t.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.quantity * item.price;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const dailySales: Record<string, number> = {};
      transactions.forEach(t => {
        const date = t.createdAt.split("T")[0];
        dailySales[date] = (dailySales[date] || 0) + t.totalAmount;
      });

      const salesByDay = Object.entries(dailySales)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);

      const categorySales: Record<string, number> = {};
      transactions.forEach(t => {
        t.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          const category = product?.category || "other";
          categorySales[category] = (categorySales[category] || 0) + item.quantity * item.price;
        });
      });

      const salesByCategory = Object.entries(categorySales)
        .map(([category, amount]) => {
          const categoryInfo = PRODUCT_CATEGORIES.find(c => c.value === category);
          return { category: categoryInfo?.label || category, amount };
        })
        .sort((a, b) => b.amount - a.amount);

      res.json({
        summary: {
          totalRevenue,
          totalTransactions,
          totalProducts,
          lowStockCount,
        },
        topProducts,
        salesByDay,
        salesByCategory,
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Аналитик авахад алдаа гарлаа" });
    }
  });

  return httpServer;
}
