import dotenv from "dotenv";
dotenv.config();

import { type User, type InsertUser, type MenuItem, type InsertMenuItem, type Transaction, type InsertTransaction, type DailySummary, type InsertDailySummary, type WeeklySummary, type InsertWeeklySummary, type MonthlySummary, type InsertMonthlySummary } from "@shared/schema";
import { randomUUID } from "crypto";
import { format } from "date-fns";
import { MongoStorage } from "./db/mongodb";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Menu Items
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem | undefined>;
  resetStock(resetType: 'today' | 'all'): Promise<MenuItem[]>;

  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactions(limit?: number): Promise<Transaction[]>;
  getTransactionsByDate(date: string): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
  deleteAllTransactions(): Promise<void>;
  deleteTransactionsByItemAndDate(itemId: string, date: string): Promise<void>;

  // Daily Summaries
  createDailySummary(summary: InsertDailySummary): Promise<DailySummary>;
  getDailySummary(date: string): Promise<DailySummary | undefined>;
  getDailySummaries(limit?: number): Promise<DailySummary[]>;

  // Weekly Summaries
  createWeeklySummary(summary: InsertWeeklySummary): Promise<WeeklySummary>;
  getWeeklySummary(weekStart: string): Promise<WeeklySummary | undefined>;
  getWeeklySummaries(limit?: number): Promise<WeeklySummary[]>;

  // Monthly Summaries
  createMonthlySummary(summary: InsertMonthlySummary): Promise<MonthlySummary>;
  getMonthlySummary(month: string): Promise<MonthlySummary | undefined>;
  getMonthlySummaries(limit?: number): Promise<MonthlySummary[]>;

  // Clear data methods
  clearDataByDay(date: string): Promise<void>;
  clearDataByWeek(weekStart: string): Promise<void>;
  clearDataByMonth(month: string): Promise<void>;

  // MongoDB connection methods
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private menuItems: Map<string, MenuItem>;
  private transactions: Map<string, Transaction>;
  private dailySummaries: Map<string, DailySummary>;
  private weeklySummaries: Map<string, WeeklySummary>;
  private monthlySummaries: Map<string, MonthlySummary>;

  constructor() {
    this.users = new Map();
    this.menuItems = new Map();
    this.transactions = new Map();
    this.dailySummaries = new Map();
    this.weeklySummaries = new Map();
    this.monthlySummaries = new Map();

    // Initialize default users
    this.createUser({ username: "admin", password: "admin@2020" }); // Admin user
    this.createUser({ username: "Chai-fi", password: "Chai-fi@2025" }); // Regular user

    // Initialize menu items
    this.initializeMenuItems();
  }

  private async initializeMenuItems() {
    const defaultItems: InsertMenuItem[] = [
      {
        name: "Masala Chai",
        description: "Traditional spiced tea",
        price: "25.00",
        category: "Tea",
        image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        available: true,
        stockQuantity: 0,
      },
      {
        name: "Green Tea",
        description: "Healthy herbal tea",
        price: "30.00",
        category: "Tea",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        available: true,
        stockQuantity: 0,
      },
      {
        name: "Cappuccino",
        description: "Rich coffee with foam",
        price: "80.00",
        category: "Coffee",
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        available: true,
        stockQuantity: 0,
      },
      {
        name: "Black Coffee",
        description: "Strong black coffee",
        price: "50.00",
        category: "Coffee",
        image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        available: true,
        stockQuantity: 0,
      },
      {
        name: "Samosa",
        description: "Crispy fried snack",
        price: "20.00",
        category: "Snacks",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        available: true,
        stockQuantity: 0,
      },
      {
        name: "Veg Sandwich",
        description: "Fresh vegetable sandwich",
        price: "60.00",
        category: "Snacks",
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        available: true,
        stockQuantity: 0,
      },
      {
        name: "Orange Juice",
        description: "Fresh squeezed orange",
        price: "40.00",
        category: "Beverages",
        image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        available: true,
        stockQuantity: 0,
      },
      {
        name: "Mango Lassi",
        description: "Sweet yogurt drink",
        price: "45.00",
        category: "Beverages",
        image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        available: true,
        stockQuantity: 0,
      },
    ];

    for (const item of defaultItems) {
      await this.createMenuItem(item);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(insertItem: InsertMenuItem): Promise<MenuItem> {
    const id = randomUUID();
    const item: MenuItem = {
      ...insertItem,
      id,
      available: insertItem.available ?? true,
      stockQuantity: insertItem.stockQuantity ?? 100
    };
    this.menuItems.set(id, item);
    return item;
  }

  async updateMenuItem(id: string, updateData: Partial<MenuItem>): Promise<MenuItem | undefined> {
    const existing = this.menuItems.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updateData };
    this.menuItems.set(id, updated);
    return updated;
  }

  async resetStock(resetType: 'today' | 'all'): Promise<MenuItem[]> {
    const menuItems = Array.from(this.menuItems.values());
    const updatedItems: MenuItem[] = [];

    for (const item of menuItems) {
      const updatedItem = { ...item, stockQuantity: 0 };
      this.menuItems.set(item.id, updatedItem);
      updatedItems.push(updatedItem);
    }

    return updatedItems;
  }

  // Transactions
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const now = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      createdAt: now,
      billerName: insertTransaction.billerName || 'Sriram',
      extras: insertTransaction.extras || null,
      splitPayment: insertTransaction.splitPayment || null
    };
    this.transactions.set(id, transaction);

    // Check stock availability and reduce stock for items in the transaction
    if (transaction.items && Array.isArray(transaction.items)) {
      for (const item of transaction.items) {
        const menuItem = await this.getMenuItem(item.id);
        if (!menuItem) {
          throw new Error(`Menu item ${item.id} not found`);
        }

        // Check if there's enough stock
        if (menuItem.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${menuItem.name}. Available: ${menuItem.stockQuantity}, Requested: ${item.quantity}`);
        }

        // Reduce stock
        const newStockQuantity = menuItem.stockQuantity - item.quantity;
        await this.updateMenuItem(item.id, {
          stockQuantity: newStockQuantity,
          available: newStockQuantity > 0
        });
      }
    }

    // Update summaries
    await this.updateSummaries(transaction);

    return transaction;
  }

  async getTransactions(limit?: number): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? transactions.slice(0, limit) : transactions;
  }

  async getTransactionsByDate(date: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.date === date)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.date >= startDate && t.date <= endDate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async deleteAllTransactions(): Promise<void> {
    // Clear all transactions
    this.transactions.clear();

    // Also clear all summaries since they depend on transactions
    this.dailySummaries.clear();
    this.weeklySummaries.clear();
    this.monthlySummaries.clear();
  }

  async deleteTransactionsByItemAndDate(itemId: string, date: string): Promise<void> {
    // Filter out transactions for this item and date
    const filteredTransactions = Array.from(this.transactions.values())
      .filter(t => !(t.date === date && t.items && t.items.some(item => item.id === itemId)));

    // Clear and repopulate transactions
    this.transactions.clear();
    filteredTransactions.forEach(t => this.transactions.set(t.id, t));

    // Update summaries for this date
    await this.recalculateSummariesForDate(date);
  }

  // Daily Summaries
  async createDailySummary(insertSummary: InsertDailySummary): Promise<DailySummary> {
    const id = randomUUID();
    const summary: DailySummary = { 
      ...insertSummary, 
      id,
      createdAt: new Date()
    };
    this.dailySummaries.set(insertSummary.date, summary);
    return summary;
  }

  async getDailySummary(date: string): Promise<DailySummary | undefined> {
    return this.dailySummaries.get(date);
  }

  async getDailySummaries(limit?: number): Promise<DailySummary[]> {
    const summaries = Array.from(this.dailySummaries.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return limit ? summaries.slice(0, limit) : summaries;
  }

  // Weekly Summaries
  async createWeeklySummary(insertSummary: InsertWeeklySummary): Promise<WeeklySummary> {
    const id = randomUUID();
    const summary: WeeklySummary = { 
      ...insertSummary, 
      id,
      createdAt: new Date()
    };
    this.weeklySummaries.set(insertSummary.weekStart, summary);
    return summary;
  }

  async getWeeklySummary(weekStart: string): Promise<WeeklySummary | undefined> {
    return this.weeklySummaries.get(weekStart);
  }

  async getWeeklySummaries(limit?: number): Promise<WeeklySummary[]> {
    const summaries = Array.from(this.weeklySummaries.values())
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
    
    return limit ? summaries.slice(0, limit) : summaries;
  }

  // Monthly Summaries
  async createMonthlySummary(insertSummary: InsertMonthlySummary): Promise<MonthlySummary> {
    const id = randomUUID();
    const summary: MonthlySummary = { 
      ...insertSummary, 
      id,
      createdAt: new Date()
    };
    this.monthlySummaries.set(insertSummary.month, summary);
    return summary;
  }

  async getMonthlySummary(month: string): Promise<MonthlySummary | undefined> {
    return this.monthlySummaries.get(month);
  }

  async getMonthlySummaries(limit?: number): Promise<MonthlySummary[]> {
    const summaries = Array.from(this.monthlySummaries.values())
      .sort((a, b) => new Date(b.month + '-01').getTime() - new Date(a.month + '-01').getTime());
    
    return limit ? summaries.slice(0, limit) : summaries;
  }

  private async updateSummaries(transaction: Transaction) {
    let gpayAmount = 0;
    let cashAmount = 0;

    if (transaction.paymentMethod === 'gpay') {
      gpayAmount = parseFloat(transaction.totalAmount);
    } else if (transaction.paymentMethod === 'cash') {
      cashAmount = parseFloat(transaction.totalAmount);
    } else if (transaction.paymentMethod === 'split' && transaction.splitPayment) {
      const splitData = transaction.splitPayment as any;
      gpayAmount = splitData.gpayAmount || 0;
      cashAmount = splitData.cashAmount || 0;
    }

    // Update daily summary
    const existingDaily = await this.getDailySummary(transaction.date);
    if (existingDaily) {
      existingDaily.totalAmount = (parseFloat(existingDaily.totalAmount) + parseFloat(transaction.totalAmount)).toFixed(2);
      existingDaily.gpayAmount = (parseFloat(existingDaily.gpayAmount) + gpayAmount).toFixed(2);
      existingDaily.cashAmount = (parseFloat(existingDaily.cashAmount) + cashAmount).toFixed(2);
      existingDaily.orderCount += 1;
      this.dailySummaries.set(transaction.date, existingDaily);
    } else {
      await this.createDailySummary({
        date: transaction.date,
        totalAmount: transaction.totalAmount,
        gpayAmount: gpayAmount.toFixed(2),
        cashAmount: cashAmount.toFixed(2),
        orderCount: 1,
      });
    }

    // Update weekly summary
    const weekStart = this.getWeekStart(new Date(transaction.date));
    const weekEnd = this.getWeekEnd(new Date(transaction.date));
    const existingWeekly = await this.getWeeklySummary(weekStart);
    if (existingWeekly) {
      existingWeekly.totalAmount = (parseFloat(existingWeekly.totalAmount) + parseFloat(transaction.totalAmount)).toFixed(2);
      existingWeekly.gpayAmount = (parseFloat(existingWeekly.gpayAmount) + gpayAmount).toFixed(2);
      existingWeekly.cashAmount = (parseFloat(existingWeekly.cashAmount) + cashAmount).toFixed(2);
      existingWeekly.orderCount += 1;
      this.weeklySummaries.set(weekStart, existingWeekly);
    } else {
      await this.createWeeklySummary({
        weekStart,
        weekEnd,
        totalAmount: transaction.totalAmount,
        gpayAmount: gpayAmount.toFixed(2),
        cashAmount: cashAmount.toFixed(2),
        orderCount: 1,
      });
    }

    // Update monthly summary
    const month = transaction.date.substring(0, 7); // YYYY-MM
    const existingMonthly = await this.getMonthlySummary(month);
    if (existingMonthly) {
      existingMonthly.totalAmount = (parseFloat(existingMonthly.totalAmount) + parseFloat(transaction.totalAmount)).toFixed(2);
      existingMonthly.gpayAmount = (parseFloat(existingMonthly.gpayAmount) + gpayAmount).toFixed(2);
      existingMonthly.cashAmount = (parseFloat(existingMonthly.cashAmount) + cashAmount).toFixed(2);
      existingMonthly.orderCount += 1;
      this.monthlySummaries.set(month, existingMonthly);
    } else {
      await this.createMonthlySummary({
        month,
        totalAmount: transaction.totalAmount,
        gpayAmount: gpayAmount.toFixed(2),
        cashAmount: cashAmount.toFixed(2),
        orderCount: 1,
      });
    }
  }

  private async recalculateSummariesForDate(date: string) {
    const transactionsForDate = await this.getTransactionsByDate(date);

    // Reset daily summary
    this.dailySummaries.delete(date);

    // Reset weekly summary for this week
    const weekStart = this.getWeekStart(new Date(date));
    this.weeklySummaries.delete(weekStart);

    // Reset monthly summary for this month
    const month = date.substring(0, 7);
    this.monthlySummaries.delete(month);

    // Recalculate all summaries from remaining transactions
    for (const transaction of transactionsForDate) {
      await this.updateSummaries(transaction);
    }
  }

  private getWeekStart(date: Date): string {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date.setDate(diff));
    return format(weekStart, 'yyyy-MM-dd');
  }

  private getWeekEnd(date: Date): string {
    const day = date.getDay();
    const diff = date.getDate() - day + 6;
    const weekEnd = new Date(date.setDate(diff));
    return format(weekEnd, 'yyyy-MM-dd');
  }

  // Clear data methods
  async clearDataByDay(date: string): Promise<void> {
    // Get the daily summary before deleting to update higher-level summaries
    const dailySummary = await this.getDailySummary(date);

    // Remove transactions for the day
    const transactionsToDelete = Array.from(this.transactions.entries())
      .filter(([_, transaction]) => transaction.date === date)
      .map(([id, _]) => id);

    transactionsToDelete.forEach(id => this.transactions.delete(id));

    // Update weekly summary by subtracting the daily amounts
    if (dailySummary) {
      const weekStart = this.getWeekStart(new Date(date));
      const existingWeekly = await this.getWeeklySummary(weekStart);
      if (existingWeekly) {
        existingWeekly.totalAmount = (parseFloat(existingWeekly.totalAmount) - parseFloat(dailySummary.totalAmount)).toFixed(2);
        existingWeekly.gpayAmount = (parseFloat(existingWeekly.gpayAmount) - parseFloat(dailySummary.gpayAmount)).toFixed(2);
        existingWeekly.cashAmount = (parseFloat(existingWeekly.cashAmount) - parseFloat(dailySummary.cashAmount)).toFixed(2);
        existingWeekly.orderCount -= dailySummary.orderCount;
        this.weeklySummaries.set(weekStart, existingWeekly);
      }

      // Update monthly summary by subtracting the daily amounts
      const month = date.substring(0, 7); // YYYY-MM
      const existingMonthly = await this.getMonthlySummary(month);
      if (existingMonthly) {
        existingMonthly.totalAmount = (parseFloat(existingMonthly.totalAmount) - parseFloat(dailySummary.totalAmount)).toFixed(2);
        existingMonthly.gpayAmount = (parseFloat(existingMonthly.gpayAmount) - parseFloat(dailySummary.gpayAmount)).toFixed(2);
        existingMonthly.cashAmount = (parseFloat(existingMonthly.cashAmount) - parseFloat(dailySummary.cashAmount)).toFixed(2);
        existingMonthly.orderCount -= dailySummary.orderCount;
        this.monthlySummaries.set(month, existingMonthly);
      }
    }

    // Remove daily summary
    this.dailySummaries.delete(date);
  }

  async clearDataByWeek(weekStart: string): Promise<void> {
    const weekEnd = this.getWeekEnd(new Date(weekStart));

    // Get the weekly summary before deleting to update monthly summary
    const weeklySummary = await this.getWeeklySummary(weekStart);

    // Remove transactions for the week
    const transactionsToDelete = Array.from(this.transactions.entries())
      .filter(([_, transaction]) => transaction.date >= weekStart && transaction.date <= weekEnd)
      .map(([id, _]) => id);

    transactionsToDelete.forEach(id => this.transactions.delete(id));

    // Update monthly summary by subtracting the weekly amounts
    if (weeklySummary) {
      const month = weekStart.substring(0, 7); // YYYY-MM
      const existingMonthly = await this.getMonthlySummary(month);
      if (existingMonthly) {
        existingMonthly.totalAmount = (parseFloat(existingMonthly.totalAmount) - parseFloat(weeklySummary.totalAmount)).toFixed(2);
        existingMonthly.gpayAmount = (parseFloat(existingMonthly.gpayAmount) - parseFloat(weeklySummary.gpayAmount)).toFixed(2);
        existingMonthly.cashAmount = (parseFloat(existingMonthly.cashAmount) - parseFloat(weeklySummary.cashAmount)).toFixed(2);
        existingMonthly.orderCount -= weeklySummary.orderCount;
        this.monthlySummaries.set(month, existingMonthly);
      }
    }

    // Remove weekly summary
    this.weeklySummaries.delete(weekStart);

    // Remove affected daily summaries
    const dates = this.getDatesBetween(weekStart, weekEnd);
    dates.forEach(date => this.dailySummaries.delete(date));
  }

  async clearDataByMonth(month: string): Promise<void> {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    
    // Remove transactions for the month
    const transactionsToDelete = Array.from(this.transactions.entries())
      .filter(([_, transaction]) => transaction.date >= startDate && transaction.date <= endDate)
      .map(([id, _]) => id);
    
    transactionsToDelete.forEach(id => this.transactions.delete(id));
    
    // Remove monthly summary
    this.monthlySummaries.delete(month);
    
    // Remove affected daily summaries
    const dates = this.getDatesBetween(startDate, endDate);
    dates.forEach(date => this.dailySummaries.delete(date));
    
    // Remove affected weekly summaries
    const weeklySummariesToDelete = Array.from(this.weeklySummaries.entries())
      .filter(([weekStart, _]) => weekStart >= startDate && weekStart <= endDate)
      .map(([weekStart, _]) => weekStart);
    
    weeklySummariesToDelete.forEach(weekStart => this.weeklySummaries.delete(weekStart));
  }

  private getDatesBetween(startDate: string, endDate: string): string[] {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
}

// Storage instance for graceful shutdown
let storageInstance: IStorage;

// Initialize storage synchronously for in-memory, async for MongoDB
const mongoConnectionString = process.env.MONGODB_URI || process.env.DATABASE_URL;

export let storage: IStorage;

if (mongoConnectionString && mongoConnectionString.includes('mongodb')) {
  console.log("  Initializing MongoDB Atlas storage...");
  // Initialize MongoDB asynchronously
  (async () => {
    try {
      const mongoStorage = new MongoStorage(mongoConnectionString);
      await mongoStorage.connect();
      storage = mongoStorage;
      storageInstance = mongoStorage;
      console.log(" MongoDB Atlas storage initialized successfully");
    } catch (error) {
      console.error("❌ MongoDB Atlas initialization failed:", error);
      console.log("  Falling back to in-memory storage...");
      storage = new MemStorage();
      storageInstance = storage;
      console.log(" Fallback in-memory storage initialized");
    }
  })();
} else {
  console.log("📝 MongoDB connection string not provided, using in-memory storage");
  storage = new MemStorage();
  storageInstance = storage;
  console.log(" In-memory storage initialized");
}

// Graceful shutdown for MongoDB
process.on('SIGINT', async () => {
  if (storageInstance && 'disconnect' in storageInstance) {
    await storageInstance.disconnect?.();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (storageInstance && 'disconnect' in storageInstance) {
    await storageInstance.disconnect?.();
  }
  process.exit(0);
});