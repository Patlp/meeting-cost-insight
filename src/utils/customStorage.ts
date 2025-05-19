/**
 * Enhanced custom storage adapter that provides reliable session token storage
 * with multiple fallback mechanisms for different browser environments
 */
class CustomStorageAdapter {
  private inMemoryStorage: Record<string, string> = {};
  private localStorageAvailable: boolean;
  private sessionStorageAvailable: boolean;
  private readonly prefix = 'app:';
  private readonly authTokenKey: string = this.prefix + 'supabase.auth.token';
  private initTime: number = Date.now();

  constructor() {
    // Check available storage mechanisms
    this.localStorageAvailable = this.checkStorageAvailable('localStorage');
    this.sessionStorageAvailable = this.checkStorageAvailable('sessionStorage');
    
    // Log available storage methods
    console.log(`🧰 Storage available: localStorage=${this.localStorageAvailable}, sessionStorage=${this.sessionStorageAvailable}`);
    
    // Initialize by loading any existing auth data
    this.migrateExistingTokens();
  }
  
  /**
   * Checks if a specific storage type is available and working
   */
  private checkStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      const result = storage.getItem(testKey);
      storage.removeItem(testKey);
      return result === testKey;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Finds and consolidates any existing auth tokens from multiple storage locations
   */
  private migrateExistingTokens(): void {
    try {
      // Check for tokens in various locations and formats
      let foundToken = false;
      
      // Key variations to check
      const possibleKeys = [
        'supabase.auth.token',
        this.authTokenKey,
        'app-storage:supabase.auth.token'
      ];
      
      // Check localStorage
      if (this.localStorageAvailable) {
        for (const key of possibleKeys) {
          const value = localStorage.getItem(key);
          if (value) {
            console.log(`🔑 Found auth token in localStorage with key: ${key}`);
            this.inMemoryStorage[this.authTokenKey] = value;
            foundToken = true;
            
            // Also write to our standard format for future use
            try {
              localStorage.setItem(this.authTokenKey, value);
            } catch (e) {
              console.error("❌ Failed to migrate token to standard format", e);
            }
          }
        }
      }
      
      // Check sessionStorage as fallback
      if (this.sessionStorageAvailable && !foundToken) {
        for (const key of possibleKeys) {
          const value = sessionStorage.getItem(key);
          if (value) {
            console.log(`🔑 Found auth token in sessionStorage with key: ${key}`);
            this.inMemoryStorage[this.authTokenKey] = value;
            foundToken = true;
          }
        }
      }
      
      // Alert if we found a token
      console.log(foundToken 
        ? "✅ Successfully loaded existing auth token"
        : "ℹ️ No existing auth token found");
    } catch (e) {
      console.error("❌ Error during token migration:", e);
    }
  }

  /**
   * Gets an item from the most reliable storage available
   */
  getItem(key: string): string | null {
    const prefixedKey = this.prefix + key;
    const isAuthToken = key.includes('auth') || key.includes('supabase');
    
    try {
      // Always check memory first for auth tokens (fastest)
      if (isAuthToken && this.inMemoryStorage[prefixedKey]) {
        console.log(`📤 Retrieved auth token from memory (${key})`);
        return this.inMemoryStorage[prefixedKey];
      }
      
      // Then check localStorage
      if (this.localStorageAvailable) {
        const value = localStorage.getItem(prefixedKey);
        if (value !== null) {
          this.inMemoryStorage[prefixedKey] = value; // Sync to memory
          if (isAuthToken) console.log(`📤 Retrieved auth token from localStorage (${key})`);
          return value;
        }
      }
      
      // Try sessionStorage as fallback
      if (this.sessionStorageAvailable) {
        const value = sessionStorage.getItem(prefixedKey);
        if (value !== null) {
          this.inMemoryStorage[prefixedKey] = value; // Sync to memory
          if (isAuthToken) console.log(`📤 Retrieved auth token from sessionStorage (${key})`);
          return value;
        }
      }
      
      // Final fallback to in-memory
      return this.inMemoryStorage[prefixedKey] || null;
    } catch (e) {
      console.error(`❌ Error retrieving ${key}:`, e);
      return this.inMemoryStorage[prefixedKey] || null;
    }
  }

  /**
   * Stores an item in all available storage mechanisms for redundancy
   */
  setItem(key: string, value: string): void {
    const prefixedKey = this.prefix + key;
    const isAuthToken = key.includes('auth') || key.includes('supabase');
    
    // Always store in memory
    this.inMemoryStorage[prefixedKey] = value;
    
    if (isAuthToken) {
      console.log(`📥 Storing auth token (${key}), uptime: ${Math.round((Date.now() - this.initTime)/1000)}s`);
    }
    
    // Try to store in localStorage
    if (this.localStorageAvailable) {
      try {
        localStorage.setItem(prefixedKey, value);
      } catch (e) {
        console.error(`❌ Failed to save ${key} to localStorage:`, e);
        this.clearStaleData(); // Try to make space
        
        try {
          localStorage.setItem(prefixedKey, value);
        } catch (retryError) {
          console.error(`❌ Still failed to save ${key} after clearing space`);
        }
      }
    }
    
    // Backup to sessionStorage
    if (this.sessionStorageAvailable) {
      try {
        sessionStorage.setItem(prefixedKey, value);
      } catch (e) {
        console.error(`❌ Failed to save ${key} to sessionStorage:`, e);
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
    
    // Remove from all storage mechanisms
    delete this.inMemoryStorage[prefixedKey];
    
    if (this.localStorageAvailable) {
      try {
        localStorage.removeItem(prefixedKey);
      } catch (e) {
        console.error(`❌ Failed to remove ${key} from localStorage:`, e);
      }
    }
    
    if (this.sessionStorageAvailable) {
      try {
        sessionStorage.removeItem(prefixedKey);
      } catch (e) {
        console.error(`❌ Failed to remove ${key} from sessionStorage:`, e);
      }
    }
  }

  /**
   * Clear all items handled by this storage adapter
   */
  clear(): void {
    console.log('🧹 Clearing all storage');
    this.inMemoryStorage = {};
    
    if (this.localStorageAvailable) {
      try {
        // Only clear our prefixed keys
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.error('❌ Failed to clear localStorage:', e);
      }
    }
    
    if (this.sessionStorageAvailable) {
      try {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith(this.prefix)) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.error('❌ Failed to clear sessionStorage:', e);
      }
    }
  }
  
  /**
   * Cleans up non-essential data to make space for important items
   */
  private clearStaleData(): void {
    if (this.localStorageAvailable) {
      try {
        // Keep auth tokens, remove other items with our prefix
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(this.prefix) && 
              !key.includes('auth') && 
              !key.includes('supabase')) {
            localStorage.removeItem(key);
            console.log(`🧹 Removed non-essential item: ${key}`);
          }
        });
      } catch (e) {
        console.error('❌ Error during storage cleanup:', e);
      }
    }
  }
}

// Export a single instance to be used throughout the app
export const customStorage = new CustomStorageAdapter();
