
/**
 * Export a single instance of the CustomStorageAdapter to be used throughout the app
 */
import { CustomStorageAdapter } from './storage/CustomStorageAdapter';

// Create a single instance to be used throughout the app
// This ensures consistent storage behavior across the application
export const customStorage = new CustomStorageAdapter();

/**
 * Set the "Remember Me" preference
 * @param value Whether to remember the user's session across browser restarts
 */
export const setRememberMe = (value: boolean) => {
  if (customStorage instanceof CustomStorageAdapter) {
    customStorage.setRememberMe(value);
  }
};

/**
 * Get the current storage adapter instance
 */
export const getStorageAdapter = () => customStorage;

// Export the singleton instance
export default customStorage;
