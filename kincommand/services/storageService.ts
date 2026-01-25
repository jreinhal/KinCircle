import { LedgerEntry, Task, VaultDocument, SecurityEvent } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

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

type StorageKey = 'kin_entries' | 'kin_tasks' | 'kin_documents' | 'kin_settings' | 'kin_security_logs';
type StorageProvider = 'local' | 'supabase';
type StorageProviderOverride = StorageProvider | 'auto';

const storageProviderEnv = (import.meta.env.VITE_STORAGE_PROVIDER || '').toLowerCase();

const resolveStorageProvider = (override?: StorageProviderOverride): StorageProvider => {
  if (override === 'local' || override === 'supabase') return override;
  if (storageProviderEnv === 'local' || storageProviderEnv === 'supabase') {
    return storageProviderEnv as StorageProvider;
  }
  return isSupabaseConfigured ? 'supabase' : 'local';
};

const toDateOnly = (value?: string | null): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toISOString().split('T')[0];
};

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
  private getTableName(key: StorageKey): string {
    switch (key) {
      case 'kin_entries': return 'ledger_entries';
      case 'kin_tasks': return 'tasks';
      case 'kin_documents': return 'vault_documents';
      case 'kin_settings': return 'family_settings'; // Singleton table
      case 'kin_security_logs': return 'security_logs';
      default: throw new Error(`Unknown storage key: ${key}`);
    }
  }

  private normalizeArray<T>(data: T | T[]): T[] {
    return Array.isArray(data) ? data : [data];
  }

  private mapEntryToRow(entry: LedgerEntry) {
    return {
      id: entry.id,
      user_id: entry.userId,
      amount: entry.amount,
      description: entry.description,
      category: entry.category,
      type: entry.type,
      date: entry.date,
      time_duration_minutes: entry.timeDurationMinutes ?? null,
      receipt_url: entry.receiptUrl ?? null,
      is_medicaid_flagged: entry.isMedicaidFlagged ?? null,
      ai_analysis: entry.aiAnalysis ?? null
    };
  }

  private mapRowToEntry(row: any): LedgerEntry {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      date: toDateOnly(row.date),
      description: row.description ?? '',
      amount: Number(row.amount ?? 0),
      timeDurationMinutes: row.time_duration_minutes ?? undefined,
      category: row.category ?? '',
      receiptUrl: row.receipt_url ?? undefined,
      isMedicaidFlagged: row.is_medicaid_flagged ?? undefined,
      aiAnalysis: row.ai_analysis ?? undefined
    };
  }

  private mapTaskToRow(task: Task) {
    return {
      id: task.id,
      title: task.title,
      assigned_user_id: task.assignedUserId,
      due_date: task.dueDate,
      is_completed: task.isCompleted,
      related_entry_id: task.relatedEntryId ?? null
    };
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title ?? '',
      assignedUserId: row.assigned_user_id ?? '',
      dueDate: toDateOnly(row.due_date),
      isCompleted: Boolean(row.is_completed),
      relatedEntryId: row.related_entry_id ?? undefined
    };
  }

  private mapDocumentToRow(doc: VaultDocument) {
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      date: doc.date
    };
  }

  private mapRowToDocument(row: any): VaultDocument {
    return {
      id: row.id,
      name: row.name ?? '',
      type: row.type ?? '',
      size: row.size ?? '',
      date: toDateOnly(row.date)
    };
  }

  private mapLogToRow(log: SecurityEvent) {
    return {
      id: log.id,
      timestamp: log.timestamp,
      type: log.type,
      details: log.details,
      severity: log.severity,
      user_name: log.user ?? null
    };
  }

  private mapRowToLog(row: any): SecurityEvent {
    return {
      id: row.id,
      timestamp: row.timestamp ?? new Date().toISOString(),
      type: row.type,
      details: row.details ?? '',
      severity: row.severity ?? 'INFO',
      user: row.user_name ?? undefined
    };
  }

  private mapToRow(key: StorageKey, item: unknown) {
    switch (key) {
      case 'kin_entries': return this.mapEntryToRow(item as LedgerEntry);
      case 'kin_tasks': return this.mapTaskToRow(item as Task);
      case 'kin_documents': return this.mapDocumentToRow(item as VaultDocument);
      case 'kin_security_logs': return this.mapLogToRow(item as SecurityEvent);
      default: throw new Error(`Unknown storage key: ${key}`);
    }
  }

  private mapFromRow(key: StorageKey, item: any) {
    switch (key) {
      case 'kin_entries': return this.mapRowToEntry(item);
      case 'kin_tasks': return this.mapRowToTask(item);
      case 'kin_documents': return this.mapRowToDocument(item);
      case 'kin_security_logs': return this.mapRowToLog(item);
      default: throw new Error(`Unknown storage key: ${key}`);
    }
  }

  async save<T>(key: string, data: T): Promise<void> {
    const storageKey = key as StorageKey;
    const table = this.getTableName(storageKey);

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

      const items = this.normalizeArray(data as unknown as Array<unknown>);
      if (items.length === 0) return; // Nothing to save

      const mappedData = items.map(item => this.mapToRow(storageKey, item));
      const { error } = await supabase.from(table).upsert(mappedData);
      if (error) throw error;
    } catch (error) {
      console.error(`Supabase Save Error (${key}):`, error);
    }
  }

  async load<T>(key: string, defaultValue: T): Promise<T> {
    const storageKey = key as StorageKey;
    const table = this.getTableName(storageKey);

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

      const mappedData = data.map(item => this.mapFromRow(storageKey, item));
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
}

let activeProvider: StorageProvider = resolveStorageProvider();

const createStorageService = (override?: StorageProviderOverride): IStorageService => {
  const provider = resolveStorageProvider(override);
  activeProvider = provider;
  return provider === 'supabase' ? new SupabaseStorageService() : new LocalStorageService();
};

let activeService: IStorageService = createStorageService();

export const storageService: IStorageService = {
  save: (...args) => activeService.save(...args),
  load: (...args) => activeService.load(...args),
  remove: (...args) => activeService.remove(...args)
};

export const setStorageProviderForTests = (provider: StorageProviderOverride) => {
  activeService = createStorageService(provider);
};

export const getStorageProvider = (): StorageProvider => activeProvider;
