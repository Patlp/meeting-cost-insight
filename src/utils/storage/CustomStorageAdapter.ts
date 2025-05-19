/**
 * Enhanced custom storage adapter that provides reliable session token storage
 * with multiple fallback mechanisms for different browser environments
 */
import { StorageAdapter } from './StorageAdapter';

export class CustomStorageAdapter implements StorageAdapter {
  private inMemoryStorage: Record<string, string> = {};
  private readonly prefix: string;
  private readonly authTokenKey: string;
  private canUseLocalStorage: boolean | null = null;
  private canUseSessionStorage: boolean | null = null;
  private memoryOnlyMode = false;

  constructor(prefix: string = 'app:') {
    // Set up prefix and auth token key
    this.prefix = prefix;
    this.authTokenKey = this.prefix + 'supabase.auth.token';
    
    // Check storage once and cache the result
    this.checkStorageAvailability();
    
    // Initialize by migrating any existing tokens
    this.migrateExistingTokens();
    
    console.log(`🧰 Storage adapter initialized: localStorage=${this.canUseLocalStorage}, sessionStorage=${this.canUseSessionStorage}, memory-only=${this.memoryOnlyMode}`);
  }
  
  /**
   * Check if we can use browser storage APIs
   */
  private checkStorageAvailability(): void {
    try {
      // Check localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, testKey);
        const result = window.localStorage.getItem(testKey);
        window.localStorage.removeItem(testKey);
        this.canUseLocalStorage = result === testKey;
      } else {
        this.canUseLocalStorage = false;
      }
    } catch (e) {
      console.warn('❌ localStorage not available:', e);
      this.canUseLocalStorage = false;
    }
    
    try {
      // Check sessionStorage
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const testKey = '__storage_test__';
        window.sessionStorage.setItem(testKey, testKey);
        const result = window.sessionStorage.getItem(testKey);
        window.sessionStorage.removeItem(testKey);
        this.canUseSessionStorage = result === testKey;
      } else {
        this.canUseSessionStorage = false;
      }
    } catch (e) {
      console.warn('❌ sessionStorage not available:', e);
      this.canUseSessionStorage = false;
    }
    
    // Fall back to memory-only mode if no browser storage is available
    this.memoryOnlyMode = !this.canUseLocalStorage && !this.canUseSessionStorage;
    
    if (this.memoryOnlyMode) {
      console.warn('⚠️ Using memory-only storage mode. Session will be lost on page refresh.');
    }
  }
  
  /**
   * Find and migrate existing auth tokens from various storage locations
   */
  private migrateExistingTokens(): void {
    if (this.memoryOnlyMode) return;
    
    try {
      // Check various possible token locations
      const possibleKeys = [
        'supabase.auth.token',
        this.authTokenKey,
        'app-storage:supabase.auth.token'
      ];
      
      let foundToken = false;
      
      // Try localStorage
      if (this.canUseLocalStorage) {
        for (const key of possibleKeys) {
          try {
            const value = window.localStorage.getItem(key);
            if (value) {
              console.log(`🔑 Found auth token in localStorage with key: ${key}`);
              this.inMemoryStorage[this.authTokenKey] = value;
              foundToken = true;
              break;
            }
          } catch (e) {
            console.warn(`Failed to read ${key} from localStorage:`, e);
          }
        }
      }
      
      // Try sessionStorage if no token in localStorage
      if (!foundToken && this.canUseSessionStorage) {
        for (const key of possibleKeys) {
          try {
            const value = window.sessionStorage.getItem(key);
            if (value) {
              console.log(`🔑 Found auth token in sessionStorage with key: ${key}`);
              this.inMemoryStorage[this.authTokenKey] = value;
              foundToken = true;
              break;
            }
          } catch (e) {
            console.warn(`Failed to read ${key} from sessionStorage:`, e);
          }
        }
      }
      
      console.log(foundToken 
        ? "✅ Successfully loaded existing auth token"
        : "ℹ️ No existing auth token found");
    } catch (e) {
      console.error("❌ Error during token migration:", e);
    }
  }

  /**
   * Gets an item from storage with fallbacks
   */
  getItem(key: string): string | null {
    const prefixedKey = this.prefix + key;
    const isAuthToken = key.includes('auth') || key.includes('supabase');
    
    try {
      // Always check memory first (fastest)
      if (this.inMemoryStorage[prefixedKey]) {
        if (isAuthToken) console.log(`📤 Retrieved auth token from memory (${key})`);
        return this.inMemoryStorage[prefixedKey];
      }
      
      // Skip browser storage in memory-only mode
      if (this.memoryOnlyMode) {
        return null;
      }
      
      // Try localStorage
      if (this.canUseLocalStorage) {
        try {
          const value = window.localStorage.getItem(prefixedKey);
          if (value !== null) {
            this.inMemoryStorage[prefixedKey] = value; // Sync to memory
            if (isAuthToken) console.log(`📤 Retrieved auth token from localStorage (${key})`);
            return value;
          }
        } catch (e) {
          console.warn(`Failed to get ${key} from localStorage:`, e);
        }
      }
      
      // Try sessionStorage as fallback
      if (this.canUseSessionStorage) {
        try {
          const value = window.sessionStorage.getItem(prefixedKey);
          if (value !== null) {
            this.inMemoryStorage[prefixedKey] = value; // Sync to memory
            if (isAuthToken) console.log(`📤 Retrieved auth token from sessionStorage (${key})`);
            return value;
          }
        } catch (e) {
          console.warn(`Failed to get ${key} from sessionStorage:`, e);
        }
      }
      
      return null;
    } catch (e) {
      console.error(`❌ Error retrieving ${key}:`, e);
      return null;
    }
  }

  /**
   * Stores an item with resilience against storage errors
   */
  setItem(key: string, value: string): void {
    const prefixedKey = this.prefix + key;
    const isAuthToken = key.includes('auth') || key.includes('supabase');
    
    // Always store in memory for quick access
    this.inMemoryStorage[prefixedKey] = value;
    
    if (isAuthToken) {
      console.log(`📥 Storing auth token (${key})`);
    }
    
    // Skip browser storage in memory-only mode
    if (this.memoryOnlyMode) {
      return;
    }
    
    // Try to store in localStorage (primary)
    if (this.canUseLocalStorage) {
      try {
        window.localStorage.setItem(prefixedKey, value);
      } catch (e) {
        console.error(`❌ Failed to store ${key} in localStorage:`, e);
        this.tryCleanupStorage();
        
        // Try again after cleanup
        try {
          window.localStorage.setItem(prefixedKey, value);
        } catch (retryError) {
          console.error(`❌ Still unable to store ${key} after cleanup:`, retryError);
        }
      }
    }
    
    // Backup to sessionStorage
    if (this.canUseSessionStorage) {
      try {
        window.sessionStorage.setItem(prefixedKey, value);
      } catch (e) {
        console.error(`❌ Failed to store ${key} in sessionStorage:`, e);
      }
    }
  }

  /**
   * Removes an item from all storage mechanisms
   */
  removeItem(key: string): void {
    const prefixedKey = this.prefix + key;
    const isAuthToken = key.includes('auth') || key.includes('supabase');
    
    if (isAuthToken) {
      console.log(`🗑️ Removing auth token (${key})`);
    }
    
    // Always remove from memory
    delete this.inMemoryStorage[prefixedKey];
    
    // Skip browser storage in memory-only mode
    if (this.memoryOnlyMode) {
      return;
    }
    
    // Remove from localStorage
    if (this.canUseLocalStorage) {
      try {
        window.localStorage.removeItem(prefixedKey);
      } catch (e) {
        console.error(`❌ Failed to remove ${key} from localStorage:`, e);
      }
    }
    
    // Remove from sessionStorage
    if (this.canUseSessionStorage) {
      try {
        window.sessionStorage.removeItem(prefixedKey);
      } catch (e) {
        console.error(`❌ Failed to remove ${key} from sessionStorage:`, e);
      }
    }
  }

  /**
   * Clear all items with our prefix
   */
  clear(): void {
    console.log('🧹 Clearing all storage');
    
    // Clear memory
    this.inMemoryStorage = {};
    
    // Skip browser storage in memory-only mode
    if (this.memoryOnlyMode) {
      return;
    }
    
    // Clear localStorage
    if (this.canUseLocalStorage) {
      try {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          try {
            window.localStorage.removeItem(key);
          } catch (e) {
            console.error(`❌ Failed to remove ${key} from localStorage:`, e);
          }
        });
      } catch (e) {
        console.error('❌ Error clearing localStorage items:', e);
      }
    }
    
    // Clear sessionStorage
    if (this.canUseSessionStorage) {
      try {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          try {
            window.sessionStorage.removeItem(key);
          } catch (e) {
            console.error(`❌ Failed to remove ${key} from sessionStorage:`, e);
          }
        });
      } catch (e) {
        console.error('❌ Error clearing sessionStorage items:', e);
      }
    }
  }
  
  /**
   * Cleans up non-essential data to make space for important items
   */
  private tryCleanupStorage(): void {
    if (!this.canUseLocalStorage) return;
    
    try {
      // Keep auth tokens, remove other items with our prefix
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(this.prefix) && 
            !key.includes('auth') && !key.includes('supabase')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          window.localStorage.removeItem(key);
          console.log(`🧹 Removed non-essential item: ${key}`);
        } catch (e) {
          // Ignore errors in cleanup
        }
      });
    } catch (e) {
      console.error('❌ Error during storage cleanup:', e);
    }
  }
}
