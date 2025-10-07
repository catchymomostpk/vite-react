import { MemStorage } from "../storage";
import { MongoStorage } from "./mongodb";

let storageInstance: MemStorage | MongoStorage;

export function initializeStorage() {
  const mongoConnectionString = process.env.MONGODB_URI || process.env.DATABASE_URL;
  
  if (mongoConnectionString) {
    console.log("Initializing MongoDB Atlas storage...");
    storageInstance = new MongoStorage(mongoConnectionString);
    
    
    (async () => {
      try {
        await (storageInstance as MongoStorage).connect();
        console.log("MongoDB Atlas connected successfully");
      } catch (error) {
        console.error("MongoDB Atlas connection failed:", error);
        console.log("Falling back to in-memory storage...");
        storageInstance = new MemStorage();
      }
    })();
  } else {
    console.log("Using in-memory storage (MongoDB connection string not provided)");
    storageInstance = new MemStorage();
  }

  return storageInstance;
}

export function getStorage(): MemStorage | MongoStorage {
  if (!storageInstance) {
    return initializeStorage();
  }
  return storageInstance;
}

// Graceful shutdown for MongoDB
process.on('SIGINT', async () => {
  if (storageInstance instanceof MongoStorage) {
    await storageInstance.disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (storageInstance instanceof MongoStorage) {
    await storageInstance.disconnect();
  }
  process.exit(0);
});
