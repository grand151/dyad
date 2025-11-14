/**
 * Database Adapter - Abstraction layer for database operations
 * Supports SQLite (Electron) and IndexedDB (Web)
 */

import { isElectron } from "../lib/platform";

export interface DatabaseAdapter {
  initialize(): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  get<T = any>(sql: string, params?: any[]): Promise<T | null>;
  close(): Promise<void>;
}

/**
 * Electron SQLite Adapter (uses better-sqlite3 via IPC)
 */
class ElectronDatabaseAdapter implements DatabaseAdapter {
  async initialize(): Promise<void> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("db:initialize");
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("db:query", { sql, params });
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("db:execute", { sql, params });
  }

  async get<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("db:get", { sql, params });
  }

  async close(): Promise<void> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("db:close");
  }
}

/**
 * Web IndexedDB Adapter
 */
class WebDatabaseAdapter implements DatabaseAdapter {
  private db: IDBDatabase | null = null;
  private dbName = "dyad-db";
  private version = 1;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for main tables
        if (!db.objectStoreNames.contains("apps")) {
          const appsStore = db.createObjectStore("apps", { keyPath: "id" });
          appsStore.createIndex("name", "name", { unique: false });
        }

        if (!db.objectStoreNames.contains("chats")) {
          const chatsStore = db.createObjectStore("chats", { keyPath: "id" });
          chatsStore.createIndex("appId", "appId", { unique: false });
        }

        if (!db.objectStoreNames.contains("messages")) {
          const messagesStore = db.createObjectStore("messages", {
            keyPath: "id",
          });
          messagesStore.createIndex("chatId", "chatId", { unique: false });
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
      };
    });
  }

  async query<T = any>(sql: string, _params?: any[]): Promise<T[]> {
    // Simple SQL parsing for IndexedDB
    // This is a simplified implementation - in production, use a proper SQL-to-IndexedDB library
    const storeName = this.parseTableName(sql);
    if (!this.db || !storeName) {
      throw new Error("Database not initialized or invalid query");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        reject(new Error("Query failed"));
      };
    });
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    const storeName = this.parseTableName(sql);
    if (!this.db || !storeName) {
      throw new Error("Database not initialized or invalid query");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      // Parse operation type
      if (sql.toLowerCase().includes("insert")) {
        const data = params?.[0] || {};
        const request = store.add(data);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Insert failed"));
      } else if (sql.toLowerCase().includes("update")) {
        const data = params?.[0] || {};
        const request = store.put(data);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Update failed"));
      } else if (sql.toLowerCase().includes("delete")) {
        const key = params?.[0];
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Delete failed"));
      } else {
        reject(new Error("Unsupported operation"));
      }
    });
  }

  async get<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private parseTableName(sql: string): string | null {
    // Simple regex to extract table name
    const match = sql.match(/(?:from|into|update)\s+(\w+)/i);
    return match ? match[1] : null;
  }
}

/**
 * Get appropriate database adapter based on platform
 */
export function getDatabaseAdapter(): DatabaseAdapter {
  if (isElectron()) {
    return new ElectronDatabaseAdapter();
  } else {
    return new WebDatabaseAdapter();
  }
}

// Singleton instance
export const database = getDatabaseAdapter();
