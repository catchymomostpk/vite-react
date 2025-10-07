import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Wait for storage to be initialized
      if (!storage) {
        return res.status(503).json({ error: "Service temporarily unavailable" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Menu Items
  app.get("/api/menu", async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  // Menu item sales endpoint - MUST come before /api/menu/:id
  app.get("/api/menu/sales", async (req, res) => {
    try {
      let startDate: string, endDate: string;

      if (req.query.date) {
        // Daily sales
        startDate = req.query.date as string;
        endDate = startDate;
      } else {
        // Monthly sales (default)
        const month = req.query.month as string || new Date().toISOString().slice(0,7);
        const year = parseInt(month.split('-')[0]);
        const monthNum = parseInt(month.split('-')[1]) - 1; // 0-based
        startDate = new Date(year, monthNum, 1).toISOString().split('T')[0];
        endDate = new Date(year, monthNum + 1, 0).toISOString().split('T')[0]; // last day of month
      }

      const transactions = await storage.getTransactionsByDateRange(startDate, endDate);
      const menuItems = await storage.getMenuItems();

      const salesData = menuItems.map(item => {
        const totalSold = transactions.reduce((count, transaction) => {
          const items = transaction.items as any[];
          const itemSold = items.find(i => i.id === item.id);
          return count + (itemSold ? itemSold.quantity : 0);
        }, 0);

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          totalSold,
          revenue: totalSold * parseFloat(item.price)
        };
      });

      res.json(salesData.sort((a, b) => b.totalSold - a.totalSold));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu item sales" });
    }
  });

  app.get("/api/menu/:id", async (req, res) => {
    try {
      const item = await storage.getMenuItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu item" });
    }
  });

  app.post("/api/menu", async (req, res) => {
    try {
      const { name, description, price, category, image, available, stockQuantity } = req.body;
      const newItem = await storage.createMenuItem({
        name,
        description,
        price,
        category,
        image,
        available: available ?? true,
        stockQuantity: stockQuantity ?? 100
      });
      res.json(newItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to create menu item" });
    }
  });

  app.put("/api/menu/:id", async (req, res) => {
    try {
      const { name, description, price, category, image, available, stockQuantity } = req.body;
      const updatedItem = await storage.updateMenuItem(req.params.id, {
        name,
        description,
        price,
        category,
        image,
        available,
        stockQuantity
      });
      if (!updatedItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update menu item" });
    }
  });

  app.delete("/api/menu/:id", async (req, res) => {
    try {
      const item = await storage.getMenuItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      
      // For now, we'll just mark the item as unavailable since there's no delete method
      const updatedItem = await storage.updateMenuItem(req.params.id, { available: false });
      res.json({ message: "Menu item marked as unavailable", item: updatedItem });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  // Stock Management
  app.put("/api/stock/:id", async (req, res) => {
    try {
      const { stockQuantity } = req.body;
      const updatedItem = await storage.updateMenuItem(req.params.id, {
        stockQuantity
      });
      if (!updatedItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update stock" });
    }
  });

  app.post("/api/stock/reset", async (req, res) => {
    try {
      const { resetType } = req.body; // 'today' or 'all'
      const updatedItems = await storage.resetStock(resetType);
      res.json({ message: `${resetType} stock reset successfully`, updatedItems });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset stock" });
    }
  });

  // Transactions
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid transaction data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });
  

  app.get("/api/transactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactions(limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/date/:date", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByDate(req.params.date);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions for date" });
    }
  });

  app.delete("/api/transactions/delete-all", async (req, res) => {
    try {
      await storage.deleteAllTransactions();
      res.json({ message: "All transactions deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transactions" });
    }
  });

  app.delete("/api/transactions/item/:itemId/date/:date", async (req, res) => {
    try {
      await storage.deleteTransactionsByItemAndDate(req.params.itemId, req.params.date);
      res.json({ message: "Transactions deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transactions" });
    }
  });

  // Daily Summaries
  app.get("/api/summaries/daily", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const summaries = await storage.getDailySummaries(limit);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily summaries" });
    }
  });

  app.get("/api/summaries/daily/:date", async (req, res) => {
    try {
      const summary = await storage.getDailySummary(req.params.date);
      if (!summary) {
        return res.status(404).json({ error: "Daily summary not found" });
      }
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily summary" });
    }
  });

  // Weekly Summaries
  app.get("/api/summaries/weekly", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const summaries = await storage.getWeeklySummaries(limit);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly summaries" });
    }
  });

  // Monthly Summaries
  app.get("/api/summaries/monthly", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const summaries = await storage.getMonthlySummaries(limit);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly summaries" });
    }
  });





  // Clear data endpoint
  app.delete("/api/data/clear", async (req, res) => {
    try {
      const { period, date } = req.query;
      
      if (period === 'day' && date) {
        await storage.clearDataByDay(date as string);
        res.json({ message: `Cleared data for ${date}` });
      } else if (period === 'week' && date) {
        await storage.clearDataByWeek(date as string);
        res.json({ message: `Cleared weekly data starting ${date}` });
      } else if (period === 'month' && date) {
        await storage.clearDataByMonth(date as string);
        res.json({ message: `Cleared monthly data for ${date}` });
      } else {
        res.status(400).json({ error: "Invalid parameters. Required: period (day/week/month) and date" });
      }
    } catch (error) {
      console.error("Clear data error:", error);
      res.status(500).json({ error: "Failed to clear data" });
    }
  });

  // PDF Download endpoints
  app.get("/api/download/daily/:date", async (req, res) => {
    try {
      const summary = await storage.getDailySummary(req.params.date);
      const transactions = await storage.getTransactionsByDate(req.params.date);
      
      if (!summary) {
        return res.status(404).json({ error: "Daily summary not found" });
      }

      res.json({ summary, transactions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily data" });
    }
  });

  app.get("/api/download/weekly/:weekStart", async (req, res) => {
    try {
      const summary = await storage.getWeeklySummary(req.params.weekStart);
      
      if (!summary) {
        return res.status(404).json({ error: "Weekly summary not found" });
      }

      const transactions = await storage.getTransactionsByDateRange(
        summary.weekStart,
        summary.weekEnd
      );

      res.json({ summary, transactions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly data" });
    }
  });

  app.get("/api/download/monthly/:month", async (req, res) => {
    try {
      const summary = await storage.getMonthlySummary(req.params.month);
      
      if (!summary) {
        return res.status(404).json({ error: "Monthly summary not found" });
      }

      const startDate = `${req.params.month}-01`;
      const endDate = `${req.params.month}-31`;
      const transactions = await storage.getTransactionsByDateRange(startDate, endDate);

      res.json({ summary, transactions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly data" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
