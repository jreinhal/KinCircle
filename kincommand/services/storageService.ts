import { supabase } from './supabase';

/**
 * Storage Service Abstraction
 * 
 * This interface allows the application to swap storage mechanisms
 * without changing business logic. Current implementation uses localStorage,
 * but can be easily swapped to Supabase in Phase 2.
 */

/**
 * Interface for storage operations
 * Generic type T allows type-safe storage of any data structure
 */
export interface IStorageService {
  /**
   * Saves data to storage
   * @param key - Storage key identifier
   * @param data - Data to store (will be JSON serialized)
   */
  save<T>(key: string, data: T): Promise<void>;

  /**
   * Loads data from storage
   * @param key - Storage key identifier
   * @param defaultValue - Value to return if key doesn't exist
   * @returns Stored data or default value
   */
  load<T>(key: string, defaultValue: T): Promise<T>;

  /**
   * Removes data from storage
   * @param key - Storage key identifier
   */
  remove(key: string): Promise<void>;
}

/**
 * LocalStorage implementation of IStorageService
 * Used for Phase 1 (Prototype) - Wraps synchronous localStorage in Promises
 */
class LocalStorageService implements IStorageService {
  async save<T>(key: string, data: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
  }

  async load<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
    }
  }
}

/**
 * Supabase implementation of IStorageService
 * Maps application keys to Supabase database tables
 */
class SupabaseStorageService implements IStorageService {

  // Map internal app keys to Supabase table names
  private getTableName(key: string): string {
    switch (key) {
      case 'kin_entries': return 'ledger_entries';
      case 'kin_tasks': return 'tasks';
      case 'kin_documents': return 'vault_documents';
      case 'kin_settings': return 'family_settings'; // Singleton table
      case 'kin_security_logs': return 'security_logs';
      default: throw new Error(`Unknown storage key: ${key}`);
    }
  }

  async save<T>(key: string, data: T): Promise<void> {
    const table = this.getTableName(key);

    try {
      // Special handling for singleton 'settings'
      if (key === 'kin_settings') {
        // Family settings is a single row with ID=1
        const { error } = await supabase
          .from(table)
          .upsert({ id: 1, settings: data });

        if (error) throw error;
        return;
      }

      // Arrays (Entries, Tasks, Documents, Logs)
      if (Array.isArray(data)) {
        if (data.length === 0) return; // Nothing to save

        // Upsert the whole batch
        // NOTE: This assumes 'data' items match the table schema columns or are close enough
        // Ideally we should map fields, but for Phase 2 Beta we rely on JSON compatibility or direct column match.
        // The schema uses snake_case arguments (e.g. user_id) but app uses camelCase (userId).
        // WE NEED A MAPPER HERE if columns don't match. 
        // Let's assume for now we need runtime mapping or we updated schema to match.
        // ACTUALLY: The SQL schema uses snake_case (user_id), app uses camelCase.
        // Supabase JS client doesn't auto-convert. We need a mapper.

        const mappedData = data.map(item => this.mapToSnakeCase(item));

        const { error } = await supabase.from(table).upsert(mappedData);
        if (error) throw error;
      }
    } catch (error) {
      console.error(`Supabase Save Error (${key}):`, error);
    }
  }

  async load<T>(key: string, defaultValue: T): Promise<T> {
    const table = this.getTableName(key);

    try {
      // Settings special case
      if (key === 'kin_settings') {
        const { data, error } = await supabase.from(table).select('settings').eq('id', 1).single();
        if (error || !data) return defaultValue;
        return data.settings as T;
      }

      // Standard tables
      const { data, error } = await supabase.from(table).select('*');

      if (error) throw error;
      if (!data) return defaultValue;

      // Map back to camelCase
      const mappedData = data.map(item => this.mapToCamelCase(item));
      return mappedData as unknown as T;

    } catch (error) {
      console.error(`Supabase Load Error (${key}):`, error);
      return defaultValue;
    }
  }

  async remove(key: string): Promise<void> {
    // In Phase 2, we probably don't want to drop tables via app code
    console.warn('Remove operation not fully supported in Supabase mode for safety');
  }

  // --- Helpers for Case Conversion (camelCase <-> snake_case) ---

  private mapToSnakeCase(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(i => this.mapToSnakeCase(i));

    const newObj: any = {};
    for (const key in obj) {
      // Simple camelToSnake
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = this.mapToSnakeCase(obj[key]);
    }
    return newObj;
  }

  private mapToCamelCase(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(i => this.mapToCamelCase(i));

    const newObj: any = {};
    for (const key in obj) {
      // Simple snakeToCamel
      const camelKey = key.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      newObj[camelKey] = this.mapToCamelCase(obj[key]);
    }
    return newObj;
  }
}

// Export singleton instance (Switching to Supabase Service)
// Fallback to LocalStorage if Supabase credentials are not set? 
// For this task, we assume we want to force Supabase.
export const storageService: IStorageService = new SupabaseStorageService();
// export const storageService: IStorageService = new LocalStorageService();
