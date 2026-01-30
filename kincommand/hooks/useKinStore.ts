import { useState, useEffect, useCallback } from 'react';
import {
    LedgerEntry, Task, VaultDocument, FamilySettings, SecurityEvent, User,
    RecurringExpense, FamilyInvite, HelpTask, Medication, MedicationLog
} from '../types';
import {
    storageService,
    getStorageProvider,
    setActiveFamilyId,
    getActiveFamilyId,
    migrateLegacyLocalStorage
} from '../services/storageService';
import { initSupabaseAuth } from '../services/supabaseAuth';
import { logger } from '../utils/logger';
import { ensureFamilyContext } from '../services/familyService';
import { generateSecureToken } from '../utils/crypto';
import { backupDataSchema, formatZodErrors } from '../utils/validation';
import { hasPermission } from '../utils/rbac';

/**
 * Custom hook for managing KinCircle's centralized state
 * Abstracts business logic away from UI components
 * 
 * @param defaultEntries - Initial ledger entries if storage is empty
 * @param defaultTasks - Initial tasks if storage is empty
 * @param defaultDocuments - Initial vault documents if storage is empty
 * @param defaultSettings - Initial family settings if storage is empty
 * @param currentUser - Current authenticated user for security logging
 * @returns Object containing all state and mutation functions
 */
export const useKinStore = (
    defaultEntries: LedgerEntry[],
    defaultTasks: Task[],
    defaultDocuments: VaultDocument[],
    defaultSettings: FamilySettings,
    currentUser: User
) => {
    // Loading State
    const [isLoading, setIsLoading] = useState(true);

    // Initialize state (empty/default initially, populated via async effect)
    const [entries, setEntries] = useState<LedgerEntry[]>(defaultEntries);
    const [tasks, setTasks] = useState<Task[]>(defaultTasks);
    const [documents, setDocuments] = useState<VaultDocument[]>(defaultDocuments);
    const [settings, setSettings] = useState<FamilySettings>(defaultSettings);
    const [securityLogs, setSecurityLogs] = useState<SecurityEvent[]>([]);

    // Phase 1 & 2: New feature state
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
    const [familyInvites, setFamilyInvites] = useState<FamilyInvite[]>([]);
    const [helpTasks, setHelpTasks] = useState<HelpTask[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);

    // Async Data Loading
    const loadAllData = useCallback(async () => {
            try {
                let familyId = getActiveFamilyId();

                if (getStorageProvider() === 'supabase') {
                    await initSupabaseAuth();
                    familyId = await ensureFamilyContext();
                }

                if (!familyId) {
                    familyId = generateSecureToken(16);
                    migrateLegacyLocalStorage(familyId);
                }

                setActiveFamilyId(familyId);

                const settingsDefaults: FamilySettings = {
                    ...defaultSettings,
                    familyId
                };

                // Determine if we should load defaultTasks or use empty if loading fails
                // In a real app, defaults might only be used if storage is truly empty
                const [
                    loadedEntries,
                    loadedTasks,
                    loadedDocs,
                    loadedSettings,
                    loadedLogs,
                    loadedRecurring,
                    loadedInvites,
                    loadedHelpTasks,
                    loadedMeds,
                    loadedMedLogs
                ] = await Promise.all([
                    storageService.load('kin_entries', defaultEntries),
                    storageService.load('kin_tasks', defaultTasks),
                    storageService.load('kin_documents', defaultDocuments),
                    storageService.load('kin_settings', settingsDefaults),
                    storageService.load('kin_security_logs', []),
                    storageService.load('kin_recurring_expenses', []),
                    storageService.load('kin_family_invites', []),
                    storageService.load('kin_help_tasks', []),
                    storageService.load('kin_medications', []),
                    storageService.load('kin_medication_logs', [])
                ]);

                // Batch updates to reduce renders (React 18 does this automatically)
                setEntries(loadedEntries);
                setTasks(loadedTasks);
                setDocuments(loadedDocs);
                const normalizedSettings: FamilySettings = {
                    ...loadedSettings,
                    familyId: loadedSettings.familyId ?? familyId,
                    themeMode: loadedSettings.themeMode ?? 'system',
                    securityProfile: loadedSettings.securityProfile ?? 'standard'
                };

                if (!loadedSettings.familyId || !loadedSettings.themeMode) {
                    storageService.save('kin_settings', normalizedSettings);
                }

                setSettings(normalizedSettings);
                setSecurityLogs(loadedLogs);
                setRecurringExpenses(loadedRecurring);
                setFamilyInvites(loadedInvites);
                setHelpTasks(loadedHelpTasks);
                setMedications(loadedMeds);
                setMedicationLogs(loadedMedLogs);
            } catch (error) {
                logger.error("Failed to load application data:", error);
                // Fallback to defaults is redundant here as they are initial state,
                // but good practice to handle critical failures.
            } finally {
                setIsLoading(false);
            }
        }, [defaultDocuments, defaultEntries, defaultSettings, defaultTasks]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // Persist changes to storage (Fire and Forget)
    // In Phase 2, we might want to debounce these or handle 'saving' states
    useEffect(() => {
        if (!isLoading) storageService.save('kin_entries', entries);
    }, [entries, isLoading]);

    useEffect(() => {
        if (!isLoading) storageService.save('kin_tasks', tasks);
    }, [tasks, isLoading]);

    useEffect(() => {
        if (!isLoading) storageService.save('kin_documents', documents);
    }, [documents, isLoading]);

    useEffect(() => {
        if (!isLoading) storageService.save('kin_settings', settings);
    }, [settings, isLoading]);

    useEffect(() => {
        if (!isLoading) storageService.save('kin_security_logs', securityLogs);
    }, [securityLogs, isLoading]);

    useEffect(() => {
        if (!isLoading) storageService.save('kin_recurring_expenses', recurringExpenses);
    }, [recurringExpenses, isLoading]);

    useEffect(() => {
        if (!isLoading) storageService.save('kin_family_invites', familyInvites);
    }, [familyInvites, isLoading]);

    useEffect(() => {
        if (!isLoading) storageService.save('kin_help_tasks', helpTasks);
    }, [helpTasks, isLoading]);

    useEffect(() => {
        if (!isLoading) storageService.save('kin_medications', medications);
    }, [medications, isLoading]);

    useEffect(() => {
        if (!isLoading) storageService.save('kin_medication_logs', medicationLogs);
    }, [medicationLogs, isLoading]);

    // Logging helper
    const logSecurityEvent = useCallback((
        details: string,
        severity: 'INFO' | 'WARNING' | 'CRITICAL',
        typeOverride?: SecurityEvent['type']
    ) => {
        const newLog: SecurityEvent = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type: typeOverride || 'SYSTEM_INIT',
            details,
            severity,
            user: currentUser.name
        };

        setSecurityLogs(prev => [...prev, newLog]);
    }, [currentUser.name]);

    const ensurePermission = useCallback((permission: Parameters<typeof hasPermission>[1], action: string) => {
        if (hasPermission(currentUser, permission)) return true;
        logSecurityEvent(`Permission denied: ${action}`, 'WARNING', 'AUTH_FAILURE');
        alert(`You do not have permission to ${action}.`);
        return false;
    }, [currentUser, logSecurityEvent]);

    // Entry operations

    /**
     * Adds a new ledger entry (expense or time tracking)
     * @param entry - The ledger entry to add
     */
    const addEntry = (entry: LedgerEntry) => {
        if (!ensurePermission('entries:create', 'add entries')) return;
        setEntries(prev => [entry, ...prev]);
    };

    const addEntries = (newEntries: LedgerEntry[]) => {
        if (!ensurePermission('entries:create', 'add entries')) return;
        setEntries(prev => [...newEntries, ...prev]);
    };

    const deleteEntry = (id: string) => {
        if (!ensurePermission('entries:delete', 'delete entries')) return;
        setEntries(prev => prev.filter(e => e.id !== id));
    };

    // Task operations

    /**
     * Adds a new task to the schedule
     * @param task - The task to add
     */
    const addTask = (task: Task) => {
        if (!ensurePermission('tasks:create', 'create tasks')) return;
        setTasks(prev => [...prev, task]);
    };

    const updateTask = (updatedTask: Task) => {
        if (!ensurePermission('tasks:update', 'update tasks')) return;
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const convertTaskToEntry = (task: Task, entry: LedgerEntry) => {
        if (!ensurePermission('entries:create', 'convert tasks to entries')) return;
        if (!ensurePermission('tasks:update', 'update tasks')) return;
        setEntries(prev => [entry, ...prev]);
        const updatedTask: Task = { ...task, relatedEntryId: entry.id };
        updateTask(updatedTask);
    };

    // Document operations

    /**
     * Adds a new document to the vault
     * @param doc - The vault document to add
     */
    const addDocument = (doc: VaultDocument) => {
        if (!ensurePermission('documents:create', 'add documents')) return;
        setDocuments(prev => [doc, ...prev]);
    };

    const deleteDocument = (id: string) => {
        if (!ensurePermission('documents:delete', 'delete documents')) return;
        setDocuments(prev => prev.filter(d => d.id !== id));
    };

    // Settings operations
    const updateSettings = (newSettings: FamilySettings) => {
        if (!ensurePermission('settings:update', 'update settings')) return;
        // Check if security setting changed
        if (newSettings.autoLockEnabled !== settings.autoLockEnabled) {
            logSecurityEvent(
                `Auto-lock feature ${newSettings.autoLockEnabled ? 'ENABLED' : 'DISABLED'}`,
                newSettings.autoLockEnabled ? 'INFO' : 'WARNING',
                'SETTINGS_CHANGE'
            );
        }
        setSettings(newSettings);
    };

    // Type for backup data import
    interface BackupData {
        version?: string;
        timestamp?: string;
        settings: FamilySettings;
        entries: LedgerEntry[];
        tasks?: Task[];
        documents?: VaultDocument[];
    }

    /**
     * Imports data from backup file with smart merge logic
     * Merges by ID - updates existing items, adds new ones
     * @param data - Backup data object containing entries, tasks, documents, and settings
     */
    const importData = (data: BackupData) => {
        try {
            if (!ensurePermission('data:import', 'import data')) return;
            const validation = backupDataSchema.safeParse(data);
            if (!validation.success) {
                const errors = formatZodErrors(validation.error);
                alert(`Import Failed:\n${errors.join('\n')}`);
                return;
            }

            const validated = validation.data;

            // Settings (force overwrite)
            setSettings(validated.settings);

            // Entries (merge)
            setEntries(prev => {
                const merged = [...prev];
                validated.entries.forEach((newEntry: LedgerEntry) => {
                    const idx = merged.findIndex(e => e.id === newEntry.id);
                    if (idx >= 0) merged[idx] = newEntry;
                    else merged.push(newEntry);
                });
                return merged;
            });

            // Tasks (merge)
            if (validated.tasks) {
                setTasks(prev => {
                    const merged = [...prev];
                    validated.tasks?.forEach((newTask: Task) => {
                        const idx = merged.findIndex(t => t.id === newTask.id);
                        if (idx >= 0) merged[idx] = newTask;
                        else merged.push(newTask);
                    });
                    return merged;
                });
            }

            // Documents (merge)
            if (validated.documents) {
                setDocuments(prev => {
                    const merged = [...prev];
                    validated.documents?.forEach((newDoc: VaultDocument) => {
                        const idx = merged.findIndex(d => d.id === newDoc.id);
                        if (idx >= 0) merged[idx] = newDoc;
                        else merged.push(newDoc);
                    });
                    return merged;
                });
            }

            logSecurityEvent("External data imported via Sync", "WARNING", "DATA_RESET");
            alert(`Sync Complete!\nImported ${validated.entries.length} entries and settings.`);

        } catch (e) {
            logger.error('Import failed:', e);
            alert("Import Failed: Invalid JSON file.");
        }
    };

    // ============================================
    // Recurring Expense Operations
    // ============================================
    const addRecurringExpense = (expense: RecurringExpense) => {
        if (!ensurePermission('recurring_expenses:create', 'add recurring expenses')) return;
        setRecurringExpenses(prev => [expense, ...prev]);
    };

    const updateRecurringExpense = (expense: RecurringExpense) => {
        if (!ensurePermission('recurring_expenses:update', 'update recurring expenses')) return;
        setRecurringExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    };

    const deleteRecurringExpense = (id: string) => {
        if (!ensurePermission('recurring_expenses:delete', 'delete recurring expenses')) return;
        setRecurringExpenses(prev => prev.filter(e => e.id !== id));
    };

    // ============================================
    // Family Invite Operations
    // ============================================
    const addFamilyInvite = (invite: FamilyInvite) => {
        if (!ensurePermission('family:invite', 'invite family members')) return;
        setFamilyInvites(prev => [invite, ...prev]);
    };

    const updateFamilyInvite = (invite: FamilyInvite) => {
        if (!ensurePermission('family:manage', 'update invites')) return;
        setFamilyInvites(prev => prev.map(i => i.id === invite.id ? invite : i));
    };

    const cancelFamilyInvite = (id: string) => {
        if (!ensurePermission('family:manage', 'cancel invites')) return;
        setFamilyInvites(prev => prev.filter(i => i.id !== id));
    };

    // ============================================
    // Help Task Operations
    // ============================================
    const addHelpTask = (task: HelpTask) => {
        if (!ensurePermission('help_tasks:create', 'create help tasks')) return;
        setHelpTasks(prev => [task, ...prev]);
    };

    const updateHelpTask = (task: HelpTask) => {
        if (!ensurePermission('help_tasks:update', 'update help tasks')) return;
        setHelpTasks(prev => prev.map(t => t.id === task.id ? task : t));
    };

    const claimHelpTask = (taskId: string, userId: string) => {
        if (!ensurePermission('help_tasks:claim', 'claim help tasks')) return;
        setHelpTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, claimedByUserId: userId || undefined, status: userId ? 'claimed' : 'available' }
                : t
        ));
    };

    const completeHelpTask = (taskId: string) => {
        if (!ensurePermission('help_tasks:complete', 'complete help tasks')) return;
        setHelpTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: 'completed' } : t
        ));
    };

    // ============================================
    // Medication Operations
    // ============================================
    const addMedication = (med: Medication) => {
        if (!ensurePermission('medications:create', 'add medications')) return;
        setMedications(prev => [med, ...prev]);
    };

    const updateMedication = (med: Medication) => {
        if (!ensurePermission('medications:update', 'update medications')) return;
        setMedications(prev => prev.map(m => m.id === med.id ? med : m));
    };

    const deleteMedication = (id: string) => {
        if (!ensurePermission('medications:delete', 'delete medications')) return;
        setMedications(prev => prev.filter(m => m.id !== id));
    };

    const logMedication = (log: MedicationLog) => {
        if (!ensurePermission('medications:update', 'log medications')) return;
        setMedicationLogs(prev => [log, ...prev]);
    };

    return {
        // State
        entries,
        tasks,
        documents,
        settings,
        securityLogs,
        isLoading,

        // Phase 1 & 2: New feature state
        recurringExpenses,
        familyInvites,
        helpTasks,
        medications,
        medicationLogs,

        // Entry Operations
        addEntry,
        addEntries,
        deleteEntry,

        // Task Operations
        addTask,
        updateTask,
        convertTaskToEntry,

        // Document Operations
        addDocument,
        deleteDocument,

        // Settings & Import Operations
        updateSettings,
        importData,
        logSecurityEvent,

        // Recurring Expense Operations
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,

        // Family Invite Operations
        addFamilyInvite,
        updateFamilyInvite,
        cancelFamilyInvite,

        // Help Task Operations
        addHelpTask,
        updateHelpTask,
        claimHelpTask,
        completeHelpTask,

        // Medication Operations
        addMedication,
        updateMedication,
        deleteMedication,
        logMedication
    };
};
