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
  private preferenceKey = 'app:auth:remember_me';
  private rememberMe = true; // Default to true, but check preference

  constructor(prefix: string = 'app:') {
    // Set up prefix and auth token key
    this.prefix = prefix;
    this.authTokenKey = this.prefix + 'supabase.auth.token';

    // Initial memory-only mode check from restricted environments
    if (typeof window !== 'undefined') {
      try {
        const isPrivateMode = !window.localStorage || !window.sessionStorage;
        if (isPrivateMode) {
          console.warn('🔒 Browser appears to be in private/incognito mode. Using memory-only storage.');
          this.memoryOnlyMode = true;
        }
      } catch (e) {
        console.warn('🔒 Storage access restricted. Using memory-only storage:', e);
        this.memoryOnlyMode = true;
      }
    }
    
    // Check for Remember Me preference if we can access storage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedPreference = window.localStorage.getItem(this.preferenceKey);
        if (savedPreference !== null) {
          this.rememberMe = savedPreference === 'true';
          console.log(`🔒 Using saved "Remember Me" preference: ${this.rememberMe}`);
        }
      }
    } catch (e) {
      // Ignore errors checking preference, default to true
    }
    
    // Initialize storage mode
    this.detectStorageMode();
    
    // Initialize by migrating any existing tokens
    this.migrateExistingTokens();
    
    console.log(`🧰 Storage adapter initialized: localStorage=${this.canUseLocalStorage}, sessionStorage=${this.canUseSessionStorage}, memory-only=${this.memoryOnlyMode}, remember-me=${this.rememberMe}`);
  }
  
  /**
   * Set the "Remember Me" preference
   */
  public setRememberMe(value: boolean): void {
    this.rememberMe = value;
    console.log(`🔐 "Remember Me" set to ${value}`);
    
    try {
      if (typeof window !== 'undefined' && window.localStorage && this.canUseLocalStorage) {
        window.localStorage.setItem(this.preferenceKey, String(value));
      }
    } catch (e) {
      console.warn('⚠️ Could not save "Remember Me" preference:', e);
    }
  }
  
  /**
   * Get the current "Remember Me" preference
   */
  public getRememberMe(): boolean {
    return this.rememberMe;
  }
  
  /**
   * Detect which storage mode we can use safely
   */
  private detectStorageMode(): void {
    if (this.storageChecked) return;
    this.storageChecked = true;
    
    try {
      // If forced memory-only mode, skip checks
      if (this.memoryOnlyMode) {
        console.log('🔒 Using forced memory-only mode, skipping storage checks');
        this.canUseLocalStorage = false;
        this.canUseSessionStorage = false;
        return;
      }
      
      // Check for localStorage availability if remember me is on
      if (typeof window !== 'undefined' && this.rememberMe) {
        try {
          const testKey = '__storage_test__';
          window.localStorage.setItem(testKey, testKey);
          const result = window.localStorage.getItem(testKey);
          window.localStorage.removeItem(testKey);
          this.canUseLocalStorage = result === testKey;
          
          if (!this.canUseLocalStorage) {
            console.warn('❌ localStorage not available despite Remember Me being on. Will try sessionStorage.');
          }
        } catch (e: any) {
          console.warn('❌ localStorage not available:', e instanceof Error ? e.message : String(e));
          this.canUseLocalStorage = false;
          
          if (e instanceof DOMException && (
            // Firefox private mode issues
            e.code === 1014 ||
            // LockManager.request() errors
            e.message.includes('LockManager') ||
            e.message.includes('request()') ||
            // Security errors
            e.name === 'SecurityError' ||
            e.message.includes('security') ||
            e.message.includes('Storage')
          )) {
            console.warn('🔒 Detected restricted browser environment. Using memory-only mode.');
            this.memoryOnlyMode = true;
          }
        }
      } else {
        this.canUseLocalStorage = false; // Explicitly disable if Remember Me is off
      }
      
      // Check for sessionStorage availability (always try this if localStorage fails)
      if (typeof window !== 'undefined' && (!this.canUseLocalStorage || !this.rememberMe)) {
        try {
          const testKey = '__storage_test__';
          window.sessionStorage.setItem(testKey, testKey);
          const result = window.sessionStorage.getItem(testKey);
          window.sessionStorage.removeItem(testKey);
          this.canUseSessionStorage = result === testKey;
        } catch (e: any) {
          console.warn('❌ sessionStorage not available:', e instanceof Error ? e.message : String(e));
          this.canUseSessionStorage = false;
          
          if (e instanceof DOMException && (
            e.code === 1014 ||
            e.message.includes('LockManager') ||
            e.message.includes('request()') ||
            e.name === 'SecurityError' ||
            e.message.includes('security') ||
            e.message.includes('Storage')
          )) {
            console.warn('🔒 Detected restricted browser environment. Using memory-only mode.');
            this.memoryOnlyMode = true;
          }
        }
      }
    } catch (e) {
      console.error('❌ Critical error checking storage availability:', e);
      this.memoryOnlyMode = true;
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
      
      // Try to find token in localStorage if Remember Me is enabled
      if (this.canUseLocalStorage && this.rememberMe) {
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
      
      // Try sessionStorage if no token in localStorage or Remember Me is disabled
      if ((!foundToken || !this.rememberMe) && this.canUseSessionStorage) {
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
      
      // Try localStorage if Remember Me is enabled
      if (this.canUseLocalStorage && this.rememberMe) {
        try {
          const value = window.localStorage.getItem(prefixedKey);
          if (value !== null) {
            this.inMemoryStorage[prefixedKey] = value; // Sync to memory
            if (isAuthToken) console.log(`📤 Retrieved auth token from localStorage (${key.substring(0, 15)}...)`);
            return value;
          }
        } catch (e: any) {
          // Check for specific errors that suggest restricted environment
          if (e instanceof DOMException && (
            e.code === 1014 ||
            e.message.includes('LockManager') ||
            e.message.includes('request()') ||
            e.name === 'SecurityError'
          )) {
            console.warn('🔒 Storage access error. Switching to memory-only mode:', e.message);
            this.memoryOnlyMode = true;
          } else {
            // Silently fail and try next storage option
            console.warn('⚠️ Error accessing localStorage:', e.message);
          }
        }
      }
      
      // Try sessionStorage as fallback or if Remember Me is disabled
      if (this.canUseSessionStorage) {
        try {
          const value = window.sessionStorage.getItem(prefixedKey);
          if (value !== null) {
            this.inMemoryStorage[prefixedKey] = value; // Sync to memory
            if (isAuthToken) console.log(`📤 Retrieved auth token from sessionStorage (${key.substring(0, 15)}...)`);
            return value;
          }
        } catch (e: any) {
          // Check for specific errors that suggest restricted environment
          if (e instanceof DOMException && (
            e.code === 1014 ||
            e.message.includes('LockManager') ||
            e.message.includes('request()') ||
            e.name === 'SecurityError'
          )) {
            console.warn('🔒 Storage access error. Switching to memory-only mode:', e.message);
            this.memoryOnlyMode = true;
          } else {
            // Silently fail and return null
            console.warn('⚠️ Error accessing sessionStorage:', e.message);
          }
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
      
      // Try localStorage if Remember Me is enabled
      if (this.canUseLocalStorage && this.rememberMe) {
        try {
          window.localStorage.setItem(prefixedKey, value);
        } catch (e: any) {
          // Check for specific errors that suggest restricted environment
          if (e instanceof DOMException && (
            e.code === 1014 ||
            e.message.includes('LockManager') ||
            e.message.includes('request()') ||
            e.name === 'SecurityError'
          )) {
            console.warn('🔒 Storage access error. Switching to memory-only mode:', e.message);
            this.memoryOnlyMode = true;
          } else {
            console.warn(`⚠️ Failed to write ${key} to localStorage:`, e.message);
          }
        }
      }
      
      // Always try sessionStorage as backup or if Remember Me is disabled
      if (this.canUseSessionStorage && (!this.rememberMe || !this.canUseLocalStorage)) {
        try {
          window.sessionStorage.setItem(prefixedKey, value);
        } catch (e: any) {
          // Check for specific errors that suggest restricted environment
          if (e instanceof DOMException && (
            e.code === 1014 ||
            e.message.includes('LockManager') ||
            e.message.includes('request()') ||
            e.name === 'SecurityError'
          )) {
            console.warn('🔒 Storage access error. Switching to memory-only mode:', e.message);
            this.memoryOnlyMode = true;
          } else {
            console.warn(`⚠️ Failed to write ${key} to sessionStorage:`, e.message);
          }
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
