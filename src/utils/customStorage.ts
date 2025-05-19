/**
 * Enhanced custom storage adapter that provides more reliable fallback when localStorage is unavailable
 * This helps the app work in environments where localStorage access is restricted (like Lovable editor)
 */
class CustomStorageAdapter {
  private inMemoryStorage: Record<string, string> = {};
  private localStorageAvailable: boolean;
  private readonly prefix = 'app-storage:';
  private sessionStartTime: number;

  constructor() {
    this.localStorageAvailable = this.checkLocalStorageAvailable();
    this.sessionStartTime = Date.now();
    console.log(`CustomStorageAdapter initialized, localStorage available: ${this.localStorageAvailable}, session started at: ${new Date(this.sessionStartTime).toISOString()}`);
    
    // Load any existing session data during initialization
    this.loadExistingSession();
  }

  // Load any existing session data when the adapter initializes
  private loadExistingSession(): void {
    if (this.localStorageAvailable) {
      try {
        // Scan localStorage for our prefixed keys and load them into memory as backup
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            const value = localStorage.getItem(key);
            if (value) {
              const unprefixedKey = key.substring(this.prefix.length);
              this.inMemoryStorage[key] = value;
              console.log(`Loaded existing key from localStorage: ${unprefixedKey} (length: ${value.length})`);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load existing session data:', e);
      }
    }
  }

  // Check if localStorage is available with better error detection
  private checkLocalStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      const testValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      // Verify that the test actually worked
      if (testValue !== testKey) {
        console.warn('localStorage test failed: values don\'t match');
        return false;
      }
      
      return true;
    } catch (e) {
      console.warn('localStorage not available, using in-memory storage instead:', e);
      return false;
    }
  }

  // Get item from storage with enhanced logging and fallback mechanisms
  getItem(key: string): string | null {
    const prefixedKey = this.prefix + key;
    let value: string | null = null;
    const isAuthKey = key.includes('auth') || key.includes('supabase');
    
    try {
      if (this.localStorageAvailable) {
        value = localStorage.getItem(prefixedKey);
      }
      
      // If not found in localStorage, try in-memory
      if (value === null) {
        value = this.inMemoryStorage[prefixedKey] || null;
        if (value && isAuthKey) {
          console.log(`Retrieved auth key ${key} from in-memory fallback (length: ${value.length})`);
        }
      } else if (isAuthKey) {
        console.log(`Retrieved auth key ${key} from localStorage (length: ${value.length})`);
        
        // Sync to in-memory as backup
        this.inMemoryStorage[prefixedKey] = value;
      }
      
      return value;
    } catch (e) {
      console.error(`Error retrieving key ${key}:`, e);
      return this.inMemoryStorage[prefixedKey] || null;
    }
  }

  // Set item in storage with enhanced error recovery
  setItem(key: string, value: string): void {
    const prefixedKey = this.prefix + key;
    const isAuthKey = key.includes('auth') || key.includes('supabase');
    
    // Always store in in-memory for fallback purposes
    this.inMemoryStorage[prefixedKey] = value;
    
    if (isAuthKey) {
      console.log(`Storing auth key ${key} (length: ${value.length}), uptime: ${Math.floor((Date.now() - this.sessionStartTime)/1000)}s`);
    }
    
    if (this.localStorageAvailable) {
      try {
        localStorage.setItem(prefixedKey, value);
      } catch (e) {
        console.error(`Failed to save ${key} to localStorage:`, e);
        
        // If localStorage is full, try to clear some space
        if (e instanceof DOMException && (
            e.name === 'QuotaExceededError' || 
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          this.clearOldItems();
          
          // Try again after clearing
          try {
            localStorage.setItem(prefixedKey, value);
          } catch (retryError) {
            console.error(`Still failed to save ${key} after clearing space:`, retryError);
          }
        }
      }
    }
  }

  // Remove item from storage
  removeItem(key: string): void {
    const prefixedKey = this.prefix + key;
    const isAuthKey = key.includes('auth') || key.includes('supabase');
    
    if (isAuthKey) {
      console.log(`Removing auth key ${key}`);
    }
    
    delete this.inMemoryStorage[prefixedKey];
    
    if (this.localStorageAvailable) {
      try {
        localStorage.removeItem(prefixedKey);
      } catch (e) {
        console.error(`Failed to remove ${key} from localStorage:`, e);
      }
    }
  }

  // Clear all items from storage
  clear(): void {
    console.log('Clearing all storage');
    this.inMemoryStorage = {};
    
    if (this.localStorageAvailable) {
      try {
        // Only clear our prefixed keys
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        
        // Remove in a separate loop to avoid index shifting issues
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    }
  }
  
  // Utility method to clear older items if storage is full
  private clearOldItems(): void {
    if (!this.localStorageAvailable) return;
    
    try {
      const keysToKeep: string[] = [];
      const keysToRemove: string[] = [];
      
      // Find auth-related keys to keep, and non-auth keys to potentially remove
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          if (key.includes('auth') || key.includes('supabase')) {
            keysToKeep.push(key);
          } else {
            keysToRemove.push(key);
          }
        }
      }
      
      console.log(`Storage cleanup: keeping ${keysToKeep.length} auth keys, removing ${keysToRemove.length} non-auth keys`);
      
      // Remove non-auth keys to make space
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        // But keep them in memory
        if (this.inMemoryStorage[key]) {
          console.log(`Removed ${key} from localStorage but kept in memory`);
        }
      });
    } catch (e) {
      console.error('Error during storage cleanup:', e);
    }
  }
}

// Export a single instance to be used throughout the app
export const customStorage = new CustomStorageAdapter();
