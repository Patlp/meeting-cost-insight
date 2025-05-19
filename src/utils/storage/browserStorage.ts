
/**
 * Utility functions for browser storage - simplified version
 * 
 * This version focuses on basic storage operations with error handling
 * and minimal complexity.
 */

/**
 * Check if a specific storage type is available and working
 * @deprecated Use the built-in checks in CustomStorageAdapter instead
 */
export function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  if (typeof window === 'undefined') return false;
  
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
 * Get an item from the specified storage
 * @deprecated Use CustomStorageAdapter.getItem instead
 */
export function getFromStorage(
  type: 'localStorage' | 'sessionStorage',
  key: string
): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return window[type].getItem(key);
  } catch (e) {
    console.error(`❌ Error getting ${key} from ${type}:`, e);
    return null;
  }
}

/**
 * Set an item in the specified storage
 * @deprecated Use CustomStorageAdapter.setItem instead
 */
export function setInStorage(
  type: 'localStorage' | 'sessionStorage',
  key: string,
  value: string
): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    window[type].setItem(key, value);
    return true;
  } catch (e) {
    console.error(`❌ Error setting ${key} in ${type}:`, e);
    return false;
  }
}

/**
 * Remove an item from the specified storage
 * @deprecated Use CustomStorageAdapter.removeItem instead
 */
export function removeFromStorage(
  type: 'localStorage' | 'sessionStorage',
  key: string
): void {
  if (typeof window === 'undefined') return;
  
  try {
    window[type].removeItem(key);
  } catch (e) {
    console.error(`❌ Error removing ${key} from ${type}:`, e);
  }
}

/**
 * Clear items with a specific prefix from the specified storage
 * @deprecated Use CustomStorageAdapter.clear instead
 */
export function clearPrefixedItems(
  type: 'localStorage' | 'sessionStorage',
  prefix: string
): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove: string[] = [];
    const storage = window[type];
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      try {
        storage.removeItem(key);
      } catch (e) {
        console.error(`❌ Error removing ${key} from ${type}:`, e);
      }
    });
  } catch (e) {
    console.error(`❌ Error clearing prefixed items from ${type}:`, e);
  }
}
