
/**
 * Enhanced custom storage adapter that provides more reliable fallback when localStorage is unavailable
 * This helps the app work in environments where localStorage access is restricted (like Lovable editor)
 */
class CustomStorageAdapter {
  private inMemoryStorage: Record<string, string> = {};
  private localStorageAvailable: boolean;
  private readonly prefix = 'app-storage:';

  constructor() {
    this.localStorageAvailable = this.checkLocalStorageAvailable();
    console.log('CustomStorageAdapter initialized, localStorage available:', this.localStorageAvailable);
  }

  // Check if localStorage is available
  private checkLocalStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.log('localStorage not available, using in-memory storage instead');
      return false;
    }
  }

  // Get item from storage
  getItem(key: string): string | null {
    const prefixedKey = this.prefix + key;
    
    if (this.localStorageAvailable) {
      const value = localStorage.getItem(prefixedKey);
      if (value === null) {
        // Try to get from in-memory as fallback in case localStorage lost the value
        const inMemoryValue = this.inMemoryStorage[prefixedKey];
        return inMemoryValue || null;
      }
      return value;
    }
    
    return this.inMemoryStorage[prefixedKey] || null;
  }

  // Set item in storage
  setItem(key: string, value: string): void {
    const prefixedKey = this.prefix + key;
    
    // Always store in in-memory for fallback purposes
    this.inMemoryStorage[prefixedKey] = value;
    
    if (this.localStorageAvailable) {
      try {
        localStorage.setItem(prefixedKey, value);
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
  }

  // Remove item from storage
  removeItem(key: string): void {
    const prefixedKey = this.prefix + key;
    
    delete this.inMemoryStorage[prefixedKey];
    
    if (this.localStorageAvailable) {
      try {
        localStorage.removeItem(prefixedKey);
      } catch (e) {
        console.error('Failed to remove from localStorage:', e);
      }
    }
  }

  // Clear all items from storage
  clear(): void {
    this.inMemoryStorage = {};
    
    if (this.localStorageAvailable) {
      try {
        // Only clear our prefixed keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    }
  }
}

// Export a single instance to be used throughout the app
export const customStorage = new CustomStorageAdapter();
