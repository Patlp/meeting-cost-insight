
/**
 * Utility functions for browser storage
 */

/**
 * Checks if a specific storage type is available and working
 */
export function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
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
 */
export function getFromStorage(
  type: 'localStorage' | 'sessionStorage',
  key: string
): string | null {
  if (!isStorageAvailable(type)) return null;
  
  try {
    return window[type].getItem(key);
  } catch (e) {
    console.error(`❌ Error getting ${key} from ${type}:`, e);
    return null;
  }
}

/**
 * Set an item in the specified storage
 */
export function setInStorage(
  type: 'localStorage' | 'sessionStorage',
  key: string,
  value: string
): boolean {
  if (!isStorageAvailable(type)) return false;
  
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
 */
export function removeFromStorage(
  type: 'localStorage' | 'sessionStorage',
  key: string
): void {
  if (!isStorageAvailable(type)) return;
  
  try {
    window[type].removeItem(key);
  } catch (e) {
    console.error(`❌ Error removing ${key} from ${type}:`, e);
  }
}

/**
 * Clear items with a specific prefix from the specified storage
 */
export function clearPrefixedItems(
  type: 'localStorage' | 'sessionStorage',
  prefix: string
): void {
  if (!isStorageAvailable(type)) return;
  
  try {
    Object.keys(window[type]).forEach(key => {
      if (key.startsWith(prefix)) {
        window[type].removeItem(key);
      }
    });
  } catch (e) {
    console.error(`❌ Error clearing prefixed items from ${type}:`, e);
  }
}
