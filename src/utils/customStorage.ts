
/**
 * Export a single instance of the CustomStorageAdapter to be used throughout the app
 */
import { CustomStorageAdapter } from './storage/CustomStorageAdapter';

// Create a single instance to be used throughout the app
// This ensures consistent storage behavior across the application
export const customStorage = new CustomStorageAdapter();

// Export the singleton instance
export default customStorage;
