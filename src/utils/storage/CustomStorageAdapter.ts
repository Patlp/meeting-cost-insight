
/**
 * Enhanced custom storage adapter that provides reliable session token storage
 * with multiple fallback mechanisms for different browser environments
 */
import { StorageAdapter } from './StorageAdapter';

export class CustomStorageAdapter implements StorageAdapter {
  private inMemoryStorage: Record<string, string> = {};
  private readonly prefix: string;
  private readonly authTokenKey: string;
  private canUseLocalStorage: boolean = false;
  private canUseSessionStorage: boolean = false;
  private memoryOnlyMode = false;
  private storageChecked = false;

  constructor(prefix: string = 'app:') {
    // Set up prefix and auth token key
    this.prefix = prefix;
    this.authTokenKey = this.prefix + 'supabase.auth.token';
    
    // Initialize storage mode
    this.detectStorageMode();
    
    // Initialize by migrating any existing tokens
    this.migrateExistingTokens();
    
    console.log(`🧰 Storage adapter initialized: localStorage=${this.canUseLocalStorage}, sessionStorage=${this.canUseSessionStorage}, memory-only=${this.memoryOnlyMode}`);
  }
  
  /**
   * Detect which storage mode we can use safely
   */
  private detectStorageMode(): void {
    if (this.storageChecked) return;
    this.storageChecked = true;
    
    try {
      // Check for localStorage availability
      if (typeof window !== 'undefined') {
        try {
          const testKey = '__storage_test__';
          window.localStorage.setItem(testKey, testKey);
          const result = window.localStorage.getItem(testKey);
          window.localStorage.removeItem(testKey);
          this.canUseLocalStorage = result === testKey;
        } catch (e) {
          console.warn('❌ localStorage not available:', e instanceof Error ? e.message : String(e));
          this.canUseLocalStorage = false;
        }
        
        // Check for sessionStorage availability
        try {
          const testKey = '__storage_test__';
          window.sessionStorage.setItem(testKey, testKey);
          const result = window.sessionStorage.getItem(testKey);
          window.sessionStorage.removeItem(testKey);
          this.canUseSessionStorage = result === testKey;
        } catch (e) {
          console.warn('❌ sessionStorage not available:', e instanceof Error ? e.message : String(e));
          this.canUseSessionStorage = false;
        }
      }
    } catch (e) {
      console.error('❌ Critical error checking storage availability:', e);
    }
    
    // Default to memory-only mode if browser storage is unavailable
    this.memoryOnlyMode = !this.canUseLocalStorage && !this.canUseSessionStorage;
    
    if (this.memoryOnlyMode) {
      console.warn('⚠️ Using memory-only storage mode. Session will be lost on page refresh.');
    }
  }
  
  /**
   * Find and migrate existing auth tokens from various storage locations
   */
  private migrateExistingTokens(): void {
    if (this.memoryOnlyMode || typeof window === 'undefined') return;
    
    try {
      // Check possible token locations
      const possibleKeys = [
        'supabase.auth.token',
        this.authTokenKey,
        'app-storage:supabase.auth.token'
      ];
      
      let foundToken = false;
      
      // Try to find token in localStorage
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
            // Silently continue if we can't read a key
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
            // Silently continue if we can't read a key
          }
        }
      }
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
        if (isAuthToken) console.log(`📤 Retrieved auth token from memory (${key.substring(0, 15)}...)`);
        return this.inMemoryStorage[prefixedKey];
      }
      
      // Skip browser storage in memory-only mode or if window is undefined
      if (this.memoryOnlyMode || typeof window === 'undefined') {
        return null;
      }
      
      // Try localStorage
      if (this.canUseLocalStorage) {
        try {
          const value = window.localStorage.getItem(prefixedKey);
          if (value !== null) {
            this.inMemoryStorage[prefixedKey] = value; // Sync to memory
            if (isAuthToken) console.log(`📤 Retrieved auth token from localStorage (${key.substring(0, 15)}...)`);
            return value;
          }
        } catch (e) {
          // Silently fail and try next storage option
        }
      }
      
      // Try sessionStorage as fallback
      if (this.canUseSessionStorage) {
        try {
          const value = window.sessionStorage.getItem(prefixedKey);
          if (value !== null) {
            this.inMemoryStorage[prefixedKey] = value; // Sync to memory
            if (isAuthToken) console.log(`📤 Retrieved auth token from sessionStorage (${key.substring(0, 15)}...)`);
            return value;
          }
        } catch (e) {
          // Silently fail and return null
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
    
    try {
      // Always store in memory for quick access
      this.inMemoryStorage[prefixedKey] = value;
      
      if (isAuthToken) {
        console.log(`📥 Storing auth token (${key.substring(0, 15)}...)`);
      }
      
      // Skip browser storage in memory-only mode or if window is undefined
      if (this.memoryOnlyMode || typeof window === 'undefined') {
        return;
      }
      
      // Try localStorage first
      if (this.canUseLocalStorage) {
        try {
          window.localStorage.setItem(prefixedKey, value);
        } catch (e) {
          console.warn(`⚠️ Failed to write ${key} to localStorage:`, e);
          // No need for retry here, we'll fall back to sessionStorage
        }
      }
      
      // Always try sessionStorage as backup if available
      if (this.canUseSessionStorage) {
        try {
          window.sessionStorage.setItem(prefixedKey, value);
        } catch (e) {
          console.warn(`⚠️ Failed to write ${key} to sessionStorage:`, e);
        }
      }
    } catch (e) {
      console.error(`❌ Critical error storing ${key}:`, e);
      // At this point we've already stored in memory, so the value isn't lost
    }
  }

  /**
   * Removes an item from all storage mechanisms
   */
  removeItem(key: string): void {
    const prefixedKey = this.prefix + key;
    const isAuthToken = key.includes('auth') || key.includes('supabase');
    
    if (isAuthToken) {
      console.log(`🗑️ Removing auth token (${key.substring(0, 15)}...)`);
    }
    
    // Always remove from memory
    delete this.inMemoryStorage[prefixedKey];
    
    // Skip browser storage operations in memory-only mode or if window is undefined
    if (this.memoryOnlyMode || typeof window === 'undefined') {
      return;
    }
    
    // Remove from localStorage
    if (this.canUseLocalStorage) {
      try {
        window.localStorage.removeItem(prefixedKey);
      } catch (e) {
        // Just log and continue
        console.warn(`⚠️ Failed to remove ${key} from localStorage:`, e);
      }
    }
    
    // Remove from sessionStorage
    if (this.canUseSessionStorage) {
      try {
        window.sessionStorage.removeItem(prefixedKey);
      } catch (e) {
        // Just log and continue
        console.warn(`⚠️ Failed to remove ${key} from sessionStorage:`, e);
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
    
    // Skip browser storage operations in memory-only mode or if window is undefined
    if (this.memoryOnlyMode || typeof window === 'undefined') {
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
            // Just log and continue
            console.warn(`⚠️ Failed to remove ${key} from localStorage:`, e);
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
            // Just log and continue
            console.warn(`⚠️ Failed to remove ${key} from sessionStorage:`, e);
          }
        });
      } catch (e) {
        console.error('❌ Error clearing sessionStorage items:', e);
      }
    }
  }
}
