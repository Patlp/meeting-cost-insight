
/**
 * Export a single instance of the CustomStorageAdapter to be used throughout the app
 */
import { CustomStorageAdapter } from './storage/CustomStorageAdapter';

// Export a single instance to be used throughout the app
export const customStorage = new CustomStorageAdapter();
