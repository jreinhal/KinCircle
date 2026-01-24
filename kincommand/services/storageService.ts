/**
 * Storage Service Abstraction
 * 
 * This interface allows the application to swap storage mechanisms
 * without changing business logic. Current implementation uses localStorage,
 * but can be easily swapped to Supabase in Phase 2.
 */

export interface IStorageService {
  save<T>(key: string, data: T): void;
  load<T>(key: string, defaultValue: T): T;
  remove(key: string): void;
}

/**
 * LocalStorage implementation of IStorageService
 * Used for Phase 1 (Prototype)
 */
class LocalStorageService implements IStorageService {
  save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
  }

  load<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
    }
  }
}

// Export singleton instance
export const storageService: IStorageService = new LocalStorageService();

/**
 * Example Supabase implementation (for Phase 2 migration):
 * 
 * class SupabaseStorageService implements IStorageService {
 *   constructor(private supabase: SupabaseClient) {}
 * 
 *   async save<T>(key: string, data: T): Promise<void> {
 *     await this.supabase.from(key).upsert(data);
 *   }
 * 
 *   async load<T>(key: string, defaultValue: T): Promise<T> {
 *     const { data, error } = await this.supabase.from(key).select('*');
 *     return error ? defaultValue : data;
 *   }
 * 
 *   async remove(key: string): Promise<void> {
 *     await this.supabase.from(key).delete();
 *   }
 * }
 */
