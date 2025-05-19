
/**
 * Enhanced custom storage adapter that provides reliable session token storage
 * with multiple fallback mechanisms for different browser environments
 */
import { StorageAdapter } from './StorageAdapter';
import { 
  isStorageAvailable, 
  getFromStorage, 
  setInStorage, 
  removeFromStorage,
  clearPrefixedItems 
} from './browserStorage';
import { 
  migrateExistingTokens, 
  clearStaleData 
} from './tokenMigration';

export class CustomStorageAdapter implements StorageAdapter {
  private inMemoryStorage: Record<string, string> = {};
  private localStorageAvailable: boolean;
  private sessionStorageAvailable: boolean;
  private readonly prefix: string;
  private readonly authTokenKey: string;
  private initTime: number = Date.now();

  constructor(prefix: string = 'app:') {
    // Set up prefix and auth token key
    this.prefix = prefix;
    this.authTokenKey = this.prefix + 'supabase.auth.token';
    
    // Check available storage mechanisms
    this.localStorageAvailable = isStorageAvailable('localStorage');
    this.sessionStorageAvailable = isStorageAvailable('sessionStorage');
    
    // Log available storage methods
    console.log(`🧰 Storage available: localStorage=${this.localStorageAvailable}, sessionStorage=${this.sessionStorageAvailable}`);
    
    // Initialize by loading any existing auth data
    migrateExistingTokens(
      this.prefix, 
      this.authTokenKey, 
      this.inMemoryStorage,
      this.localStorageAvailable,
      this.sessionStorageAvailable
    );
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
        const value = getFromStorage('localStorage', prefixedKey);
        if (value !== null) {
          this.inMemoryStorage[prefixedKey] = value; // Sync to memory
          if (isAuthToken) console.log(`📤 Retrieved auth token from localStorage (${key})`);
          return value;
        }
      }
      
      // Try sessionStorage as fallback
      if (this.sessionStorageAvailable) {
        const value = getFromStorage('sessionStorage', prefixedKey);
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
      const success = setInStorage('localStorage', prefixedKey, value);
      
      if (!success && isAuthToken) {
        this.clearStaleData(); // Try to make space
        setInStorage('localStorage', prefixedKey, value);
      }
    }
    
    // Backup to sessionStorage
    if (this.sessionStorageAvailable) {
      setInStorage('sessionStorage', prefixedKey, value);
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
      removeFromStorage('localStorage', prefixedKey);
    }
    
    if (this.sessionStorageAvailable) {
      removeFromStorage('sessionStorage', prefixedKey);
    }
  }

  /**
   * Clear all items handled by this storage adapter
   */
  clear(): void {
    console.log('🧹 Clearing all storage');
    this.inMemoryStorage = {};
    
    if (this.localStorageAvailable) {
      clearPrefixedItems('localStorage', this.prefix);
    }
    
    if (this.sessionStorageAvailable) {
      clearPrefixedItems('sessionStorage', this.prefix);
    }
  }
  
  /**
   * Cleans up non-essential data to make space for important items
   */
  private clearStaleData(): void {
    clearStaleData(this.prefix, this.localStorageAvailable);
  }
}
