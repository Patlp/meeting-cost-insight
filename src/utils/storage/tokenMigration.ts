/**
 * Utilities for migrating auth tokens between storage mechanisms
 */
import { getFromStorage, setInStorage } from './browserStorage';

/**
 * Find and consolidate existing auth tokens from multiple storage locations
 */
export function migrateExistingTokens(
  prefix: string,
  authTokenKey: string,
  inMemoryStorage: Record<string, string>,
  isLocalStorageAvailable: boolean,
  isSessionStorageAvailable: boolean
): boolean {
  try {
    let foundToken = false;
    
    // Key variations to check
    const possibleKeys = [
      'supabase.auth.token',
      authTokenKey,
      'app-storage:supabase.auth.token'
    ];
    
    // Check localStorage
    if (isLocalStorageAvailable) {
      for (const key of possibleKeys) {
        const value = getFromStorage('localStorage', key);
        if (value) {
          console.log(`🔑 Found auth token in localStorage with key: ${key}`);
          inMemoryStorage[authTokenKey] = value;
          foundToken = true;
          
          // Also write to our standard format for future use
          try {
            setInStorage('localStorage', authTokenKey, value);
          } catch (e) {
            console.error("❌ Failed to migrate token to standard format", e);
          }
        }
      }
    }
    
    // Check sessionStorage as fallback
    if (isSessionStorageAvailable && !foundToken) {
      for (const key of possibleKeys) {
        const value = getFromStorage('sessionStorage', key);
        if (value) {
          console.log(`🔑 Found auth token in sessionStorage with key: ${key}`);
          inMemoryStorage[authTokenKey] = value;
          foundToken = true;
        }
      }
    }
    
    // Alert if we found a token
    console.log(foundToken 
      ? "✅ Successfully loaded existing auth token"
      : "ℹ️ No existing auth token found");
      
    return foundToken;
  } catch (e) {
    console.error("❌ Error during token migration:", e);
    return false;
  }
}

/**
 * Cleans up non-essential data to make space for important items
 */
export function clearStaleData(
  prefix: string,
  isLocalStorageAvailable: boolean
): void {
  if (isLocalStorageAvailable) {
    try {
      // Keep auth tokens, remove other items with our prefix
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix) && 
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
