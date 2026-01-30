import {
  LedgerEntry,
  Task,
  VaultDocument,
  SecurityEvent,
  EntryType,
  RecurringExpense,
  FamilyInvite,
  HelpTask,
  Medication,
  MedicationLog,
  FamilySettings
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { logger } from '../utils/logger';
import { decryptJson, encryptJson, isEncryptedPayload } from '../utils/storageCrypto';
import { getSecurityMeta } from '../utils/securityMeta';

// Supabase row types for type-safe mapping
interface SupabaseEntryRow {
  id: string;
  family_id: string;
  user_id: string;
  type: string;
  date: string;
  description: string | null;
  amount: number | null;
  time_duration_minutes: number | null;
  receipt_url: string | null;
  is_medicaid_flagged: boolean | null;
  ai_analysis: string | null;
  category: string | null;
}

interface SupabaseTaskRow {
  id: string;
  family_id: string;
  title: string | null;
  assigned_user_id: string | null;
  due_date: string | null;
  is_completed: boolean | null;
  related_entry_id: string | null;
}

interface SupabaseDocumentRow {
  id: string;
  family_id: string;
  name: string | null;
  type: string | null;
  size: string | null;
  date: string | null;
}

interface SupabaseLogRow {
  id: string;
  family_id: string;
  timestamp: string | null;
  type: string;
  details: string | null;
  severity: string | null;
  user_name: string | null;
}

interface SupabaseRecurringExpenseRow {
  id: string;
  family_id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  frequency: string;
  next_due_date: string;
  is_active: boolean;
  created_at: string | null;
}

interface SupabaseFamilyInviteRow {
  id: string;
  family_id: string;
  email: string | null;
  name: string;
  role: string;
  status: string;
  invited_by_user_id: string;
  invited_at: string | null;
  invite_code: string;
}

interface SupabaseHelpTaskRow {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  category: string;
  date: string;
  time_slot: string | null;
  created_by_user_id: string;
  claimed_by_user_id: string | null;
  status: string;
  estimated_minutes: number | null;
  converted_to_entry_id: string | null;
}

interface SupabaseMedicationRow {
  id: string;
  family_id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribed_for: string | null;
  pharmacy: string | null;
  refill_date: string | null;
  monthly_cost: number | null;
  notes: string | null;
  is_active: boolean;
}

interface SupabaseMedicationLogRow {
  id: string;
  family_id: string;
  medication_id: string;
  taken_at: string | null;
  status: string;
  notes: string | null;
}

interface SupabaseFamilySettingsRow {
  family_id: string;
  settings: FamilySettings;
}

type SupabaseRow =
  | SupabaseEntryRow
  | SupabaseTaskRow
  | SupabaseDocumentRow
  | SupabaseLogRow
  | SupabaseRecurringExpenseRow
  | SupabaseFamilyInviteRow
  | SupabaseHelpTaskRow
  | SupabaseMedicationRow
  | SupabaseMedicationLogRow
  | SupabaseFamilySettingsRow;

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

type StorageKey =
  | 'kin_entries'
  | 'kin_tasks'
  | 'kin_documents'
  | 'kin_settings'
  | 'kin_security_logs'
  | 'kin_recurring_expenses'
  | 'kin_family_invites'
  | 'kin_help_tasks'
  | 'kin_medications'
  | 'kin_medication_logs';
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

const FAMILY_ID_KEY = 'kin_family_id';
const SCOPED_KEYS: StorageKey[] = [
  'kin_entries',
  'kin_tasks',
  'kin_documents',
  'kin_settings',
  'kin_security_logs',
  'kin_recurring_expenses',
  'kin_family_invites',
  'kin_help_tasks',
  'kin_medications',
  'kin_medication_logs'
];

let activeFamilyId: string | null = null;
let encryptionKey: CryptoKey | null = null;
let encryptionEnabled = false;

const getScopedKey = (key: string): string => {
  if (!SCOPED_KEYS.includes(key as StorageKey)) return key;
  const familyId = getActiveFamilyId();
  if (!familyId) return key;
  return `${key}:${familyId}`;
};

export const setActiveFamilyId = (familyId: string) => {
  activeFamilyId = familyId;
  try {
    localStorage.setItem(FAMILY_ID_KEY, familyId);
  } catch {
    // Ignore storage errors (private mode, etc.)
  }
};

export const getActiveFamilyId = (): string | null => {
  if (activeFamilyId) return activeFamilyId;
  try {
    activeFamilyId = localStorage.getItem(FAMILY_ID_KEY);
  } catch {
    activeFamilyId = null;
  }
  return activeFamilyId;
};

export const migrateLegacyLocalStorage = (familyId: string) => {
  try {
    SCOPED_KEYS.forEach((key) => {
      const legacy = localStorage.getItem(key);
      const scoped = localStorage.getItem(`${key}:${familyId}`);
      if (legacy && !scoped) {
        localStorage.setItem(`${key}:${familyId}`, legacy);
      }
    });
  } catch {
    // Best-effort migration
  }
};

export const setEncryptionKey = (key: CryptoKey | null) => {
  encryptionKey = key;
};

export const hasEncryptionKey = (): boolean => Boolean(encryptionKey);

export const setEncryptionEnabled = (enabled: boolean) => {
  encryptionEnabled = enabled;
};

export const isEncryptionEnabled = (): boolean => encryptionEnabled;

export const refreshEncryptionState = () => {
  const meta = getSecurityMeta();
  encryptionEnabled = Boolean(meta.encryptionEnabled);
};

export const encryptAllLocalStorage = async (): Promise<void> => {
  const key = encryptionKey;
  if (!encryptionEnabled || !key) return;
  try {
    for (const storageKey of SCOPED_KEYS) {
      const scopedKey = getScopedKey(storageKey);
      const raw = localStorage.getItem(scopedKey);
      if (!raw || isEncryptedPayload(raw)) continue;
      const parsed = JSON.parse(raw);
      const payload = await encryptJson(parsed, key);
      localStorage.setItem(scopedKey, payload);
    }
  } catch (error) {
    logger.warn('Failed to encrypt legacy local storage:', error);
  }
};

/**
 * LocalStorage implementation of IStorageService
 * Used for Phase 1 (Prototype) - Wraps synchronous localStorage in Promises
 */
class LocalStorageService implements IStorageService {
  async save<T>(key: string, data: T): Promise<void> {
    try {
      const scopedKey = getScopedKey(key);
      if (encryptionEnabled) {
        if (!encryptionKey) {
          throw new Error('Encryption key is not available');
        }
        const payload = await encryptJson(data, encryptionKey);
        localStorage.setItem(scopedKey, payload);
      } else {
        localStorage.setItem(scopedKey, JSON.stringify(data));
      }
    } catch (error) {
      logger.error(`Failed to save ${key} to localStorage:`, error);
    }
  }

  async load<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const scopedKey = getScopedKey(key);
      const saved = localStorage.getItem(scopedKey);
      if (!saved) return defaultValue;

      if (encryptionEnabled) {
        if (!encryptionKey) {
          throw new Error('Encryption key is not available');
        }
        if (!isEncryptedPayload(saved)) {
          const parsed = JSON.parse(saved) as T;
          encryptJson(parsed, encryptionKey)
            .then(payload => localStorage.setItem(scopedKey, payload))
            .catch((error) => logger.warn('Failed to migrate legacy payload:', error));
          return parsed;
        }
        return await decryptJson<T>(saved, encryptionKey);
      }

      return JSON.parse(saved) as T;
    } catch (error) {
      logger.error(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const scopedKey = getScopedKey(key);
      localStorage.removeItem(scopedKey);
    } catch (error) {
      logger.error(`Failed to remove ${key} from localStorage:`, error);
    }
  }
}

/**
 * Supabase implementation of IStorageService
 * Maps application keys to Supabase database tables
 */
class SupabaseStorageService implements IStorageService {
  private requireFamilyId(): string {
    const familyId = getActiveFamilyId();
    if (!familyId) {
      throw new Error('Family context not initialized');
    }
    return familyId;
  }

  // Map internal app keys to Supabase table names
  private getTableName(key: StorageKey): string {
    switch (key) {
      case 'kin_entries': return 'ledger_entries';
      case 'kin_tasks': return 'tasks';
      case 'kin_documents': return 'vault_documents';
      case 'kin_settings': return 'family_settings';
      case 'kin_security_logs': return 'security_logs';
      case 'kin_recurring_expenses': return 'recurring_expenses';
      case 'kin_family_invites': return 'family_invites';
      case 'kin_help_tasks': return 'help_tasks';
      case 'kin_medications': return 'medications';
      case 'kin_medication_logs': return 'medication_logs';
      default: {
        const exhaustiveCheck: never = key;
        throw new Error(`Unknown storage key: ${exhaustiveCheck}`);
      }
    }
  }

  private normalizeArray<T>(data: T | T[]): T[] {
    return Array.isArray(data) ? data : [data];
  }

  private mapEntryToRow(entry: LedgerEntry) {
    const familyId = this.requireFamilyId();
    return {
      id: entry.id,
      family_id: familyId,
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

  private mapRowToEntry(row: SupabaseEntryRow): LedgerEntry {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as EntryType,
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
    const familyId = this.requireFamilyId();
    return {
      id: task.id,
      family_id: familyId,
      title: task.title,
      assigned_user_id: task.assignedUserId,
      due_date: task.dueDate,
      is_completed: task.isCompleted,
      related_entry_id: task.relatedEntryId ?? null
    };
  }

  private mapRowToTask(row: SupabaseTaskRow): Task {
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
    const familyId = this.requireFamilyId();
    return {
      id: doc.id,
      family_id: familyId,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      date: doc.date
    };
  }

  private mapRowToDocument(row: SupabaseDocumentRow): VaultDocument {
    return {
      id: row.id,
      name: row.name ?? '',
      type: row.type ?? '',
      size: row.size ?? '',
      date: toDateOnly(row.date)
    };
  }

  private mapLogToRow(log: SecurityEvent) {
    const familyId = this.requireFamilyId();
    return {
      id: log.id,
      family_id: familyId,
      timestamp: log.timestamp,
      type: log.type,
      details: log.details,
      severity: log.severity,
      user_name: log.user ?? null
    };
  }

  private mapRowToLog(row: SupabaseLogRow): SecurityEvent {
    return {
      id: row.id,
      timestamp: row.timestamp ?? new Date().toISOString(),
      type: row.type as SecurityEvent['type'],
      details: row.details ?? '',
      severity: (row.severity ?? 'INFO') as SecurityEvent['severity'],
      user: row.user_name ?? undefined
    };
  }

  private mapRecurringExpenseToRow(expense: RecurringExpense) {
    const familyId = this.requireFamilyId();
    return {
      id: expense.id,
      family_id: familyId,
      user_id: expense.userId,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      frequency: expense.frequency,
      next_due_date: expense.nextDueDate,
      is_active: expense.isActive,
      created_at: expense.createdAt ?? null
    };
  }

  private mapRowToRecurringExpense(row: SupabaseRecurringExpenseRow): RecurringExpense {
    return {
      id: row.id,
      userId: row.user_id,
      description: row.description,
      amount: Number(row.amount),
      category: row.category,
      frequency: row.frequency as RecurringExpense['frequency'],
      nextDueDate: toDateOnly(row.next_due_date),
      isActive: Boolean(row.is_active),
      createdAt: row.created_at ?? new Date().toISOString()
    };
  }

  private mapFamilyInviteToRow(invite: FamilyInvite) {
    const familyId = this.requireFamilyId();
    return {
      id: invite.id,
      family_id: familyId,
      email: invite.email ?? null,
      name: invite.name,
      role: invite.role,
      status: invite.status,
      invited_by_user_id: invite.invitedByUserId,
      invited_at: invite.invitedAt,
      invite_code: invite.inviteCode
    };
  }

  private mapRowToFamilyInvite(row: SupabaseFamilyInviteRow): FamilyInvite {
    return {
      id: row.id,
      email: row.email ?? '',
      name: row.name,
      role: row.role as FamilyInvite['role'],
      status: row.status as FamilyInvite['status'],
      invitedByUserId: row.invited_by_user_id,
      invitedAt: row.invited_at ?? new Date().toISOString(),
      inviteCode: row.invite_code
    };
  }

  private mapHelpTaskToRow(task: HelpTask) {
    const familyId = this.requireFamilyId();
    return {
      id: task.id,
      family_id: familyId,
      title: task.title,
      description: task.description ?? null,
      category: task.category,
      date: task.date,
      time_slot: task.timeSlot ?? null,
      created_by_user_id: task.createdByUserId,
      claimed_by_user_id: task.claimedByUserId ?? null,
      status: task.status,
      estimated_minutes: task.estimatedMinutes ?? null,
      converted_to_entry_id: task.convertedToEntryId ?? null
    };
  }

  private mapRowToHelpTask(row: SupabaseHelpTaskRow): HelpTask {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      category: row.category as HelpTask['category'],
      date: toDateOnly(row.date),
      timeSlot: row.time_slot ?? undefined,
      createdByUserId: row.created_by_user_id,
      claimedByUserId: row.claimed_by_user_id ?? undefined,
      status: row.status as HelpTask['status'],
      estimatedMinutes: row.estimated_minutes ?? undefined,
      convertedToEntryId: row.converted_to_entry_id ?? undefined
    };
  }

  private mapMedicationToRow(med: Medication) {
    const familyId = this.requireFamilyId();
    return {
      id: med.id,
      family_id: familyId,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      prescribed_for: med.prescribedFor ?? null,
      pharmacy: med.pharmacy ?? null,
      refill_date: med.refillDate ?? null,
      monthly_cost: med.monthlyCost ?? null,
      notes: med.notes ?? null,
      is_active: med.isActive
    };
  }

  private mapRowToMedication(row: SupabaseMedicationRow): Medication {
    return {
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      prescribedFor: row.prescribed_for ?? undefined,
      pharmacy: row.pharmacy ?? undefined,
      refillDate: row.refill_date ?? undefined,
      monthlyCost: row.monthly_cost ?? undefined,
      notes: row.notes ?? undefined,
      isActive: Boolean(row.is_active)
    };
  }

  private mapMedicationLogToRow(log: MedicationLog) {
    const familyId = this.requireFamilyId();
    return {
      id: log.id,
      family_id: familyId,
      medication_id: log.medicationId,
      taken_at: log.takenAt,
      status: log.status,
      notes: log.notes ?? null
    };
  }

  private mapRowToMedicationLog(row: SupabaseMedicationLogRow): MedicationLog {
    return {
      id: row.id,
      medicationId: row.medication_id,
      takenAt: row.taken_at ?? new Date().toISOString(),
      status: row.status as MedicationLog['status'],
      notes: row.notes ?? undefined
    };
  }

  private mapToRow(key: StorageKey, item: unknown) {
    switch (key) {
      case 'kin_entries': return this.mapEntryToRow(item as LedgerEntry);
      case 'kin_tasks': return this.mapTaskToRow(item as Task);
      case 'kin_documents': return this.mapDocumentToRow(item as VaultDocument);
      case 'kin_security_logs': return this.mapLogToRow(item as SecurityEvent);
      case 'kin_recurring_expenses': return this.mapRecurringExpenseToRow(item as RecurringExpense);
      case 'kin_family_invites': return this.mapFamilyInviteToRow(item as FamilyInvite);
      case 'kin_help_tasks': return this.mapHelpTaskToRow(item as HelpTask);
      case 'kin_medications': return this.mapMedicationToRow(item as Medication);
      case 'kin_medication_logs': return this.mapMedicationLogToRow(item as MedicationLog);
      default: throw new Error(`Unknown storage key: ${key}`);
    }
  }

  private mapFromRow(
    key: StorageKey,
    item: SupabaseRow
  ): LedgerEntry | Task | VaultDocument | SecurityEvent | RecurringExpense | FamilyInvite | HelpTask | Medication | MedicationLog {
    switch (key) {
      case 'kin_entries': return this.mapRowToEntry(item as SupabaseEntryRow);
      case 'kin_tasks': return this.mapRowToTask(item as SupabaseTaskRow);
      case 'kin_documents': return this.mapRowToDocument(item as SupabaseDocumentRow);
      case 'kin_security_logs': return this.mapRowToLog(item as SupabaseLogRow);
      case 'kin_recurring_expenses': return this.mapRowToRecurringExpense(item as SupabaseRecurringExpenseRow);
      case 'kin_family_invites': return this.mapRowToFamilyInvite(item as SupabaseFamilyInviteRow);
      case 'kin_help_tasks': return this.mapRowToHelpTask(item as SupabaseHelpTaskRow);
      case 'kin_medications': return this.mapRowToMedication(item as SupabaseMedicationRow);
      case 'kin_medication_logs': return this.mapRowToMedicationLog(item as SupabaseMedicationLogRow);
      default: throw new Error(`Unknown storage key: ${key}`);
    }
  }

  async save<T>(key: string, data: T): Promise<void> {
    const storageKey = key as StorageKey;
    const table = this.getTableName(storageKey);
    const familyId = this.requireFamilyId();

    try {
      // Special handling for singleton 'settings'
      if (key === 'kin_settings') {
        // Family settings is scoped by family_id
        const { error } = await supabase
          .from(table)
          .upsert({ family_id: familyId, settings: data });

        if (error) throw error;
        return;
      }

      const items: unknown[] = this.normalizeArray(data as unknown | unknown[]);
      if (items.length === 0) return; // Nothing to save

      const mappedData = items.map(item => this.mapToRow(storageKey, item));
      const { error } = await supabase.from(table).upsert(mappedData);
      if (error) throw error;
    } catch (error) {
      logger.error(`Supabase Save Error (${key}):`, error);
    }
  }

  async load<T>(key: string, defaultValue: T): Promise<T> {
    const storageKey = key as StorageKey;
    const table = this.getTableName(storageKey);
    const familyId = this.requireFamilyId();

    try {
      // Settings special case
      if (key === 'kin_settings') {
        const { data, error } = await supabase
          .from(table)
          .select('settings')
          .eq('family_id', familyId)
          .single();
        if (error || !data) return defaultValue;
        return data.settings as T;
      }

      // Standard tables
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('family_id', familyId);

      if (error) throw error;
      if (!data) return defaultValue;

      const rows = data as SupabaseRow[];
      const mappedData = rows.map(item => this.mapFromRow(storageKey, item));
      return mappedData as unknown as T;

    } catch (error) {
      logger.error(`Supabase Load Error (${key}):`, error);
      return defaultValue;
    }
  }

  async remove(key: string): Promise<void> {
    // In Phase 2, we probably don't want to drop tables via app code
    logger.warn(`Remove operation not fully supported in Supabase mode for safety (key: ${key})`);
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

export const createStorageServiceInstance = (provider: StorageProviderOverride): IStorageService => {
  return provider === 'supabase' ? new SupabaseStorageService() : new LocalStorageService();
};
