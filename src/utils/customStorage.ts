
/**
 * Custom storage adapter that falls back to in-memory storage when localStorage is unavailable
 * This helps the app work in environments where localStorage access is restricted (like Lovable editor)
 */
class CustomStorageAdapter {
  private inMemoryStorage: Record<string, string> = {};
  private localStorageAvailable: boolean;

  constructor() {
    this.localStorageAvailable = this.checkLocalStorageAvailable();
  }

  // Check if localStorage is available
  private checkLocalStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Get item from storage
  getItem(key: string): string | null {
    if (this.localStorageAvailable) {
      return localStorage.getItem(key);
    }
    return this.inMemoryStorage[key] || null;
  }

  // Set item in storage
  setItem(key: string, value: string): void {
    if (this.localStorageAvailable) {
      localStorage.setItem(key, value);
    } else {
      this.inMemoryStorage[key] = value;
    }
  }

  // Remove item from storage
  removeItem(key: string): void {
    if (this.localStorageAvailable) {
      localStorage.removeItem(key);
    } else {
      delete this.inMemoryStorage[key];
    }
  }

  // Clear all items from storage
  clear(): void {
    if (this.localStorageAvailable) {
      localStorage.clear();
    } else {
      this.inMemoryStorage = {};
    }
  }
}

// Export a single instance to be used throughout the app
export const customStorage = new CustomStorageAdapter();
