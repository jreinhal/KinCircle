import { useState, useEffect, useCallback } from 'react';
import {
    LedgerEntry, Task, VaultDocument, FamilySettings, SecurityEvent, User,
    RecurringExpense, FamilyInvite, HelpTask, Medication, MedicationLog
} from '../types';
import { storageService, getStorageProvider } from '../services/storageService';
import { initSupabaseAuth } from '../services/supabaseAuth';
import { logger } from '../utils/logger';

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
    useEffect(() => {
        const loadAllData = async () => {
            try {
                if (getStorageProvider() === 'supabase') {
                    await initSupabaseAuth();
                }

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
                    storageService.load('kin_settings', defaultSettings),
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
                setSettings(loadedSettings);
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
        };

        loadAllData();
    }, []); // Run once on mount

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

    // Entry operations

    /**
     * Adds a new ledger entry (expense or time tracking)
     * @param entry - The ledger entry to add
     */
    const addEntry = (entry: LedgerEntry) => {
        setEntries(prev => [entry, ...prev]);
    };

    const addEntries = (newEntries: LedgerEntry[]) => {
        setEntries(prev => [...newEntries, ...prev]);
    };

    const deleteEntry = (id: string) => {
        if (window.confirm("Are you sure you want to delete this entry?")) {
            setEntries(prev => prev.filter(e => e.id !== id));
        }
    };

    // Task operations

    /**
     * Adds a new task to the schedule
     * @param task - The task to add
     */
    const addTask = (task: Task) => {
        setTasks(prev => [...prev, task]);
    };

    const updateTask = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const convertTaskToEntry = (task: Task, entry: LedgerEntry) => {
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
        setDocuments(prev => [doc, ...prev]);
    };

    const deleteDocument = (id: string) => {
        if (window.confirm("Are you sure you want to delete this document?")) {
            setDocuments(prev => prev.filter(d => d.id !== id));
        }
    };

    // Settings operations
    const updateSettings = (newSettings: FamilySettings) => {
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
            if (!data.entries || !data.settings) throw new Error("Invalid backup format");

            // Settings (force overwrite)
            setSettings(data.settings);

            // Entries (merge)
            setEntries(prev => {
                const merged = [...prev];
                data.entries.forEach((newEntry: LedgerEntry) => {
                    const idx = merged.findIndex(e => e.id === newEntry.id);
                    if (idx >= 0) merged[idx] = newEntry;
                    else merged.push(newEntry);
                });
                return merged;
            });

            // Tasks (merge)
            if (data.tasks) {
                setTasks(prev => {
                    const merged = [...prev];
                    data.tasks.forEach((newTask: Task) => {
                        const idx = merged.findIndex(t => t.id === newTask.id);
                        if (idx >= 0) merged[idx] = newTask;
                        else merged.push(newTask);
                    });
                    return merged;
                });
            }

            // Documents (merge)
            if (data.documents) {
                setDocuments(prev => {
                    const merged = [...prev];
                    data.documents.forEach((newDoc: VaultDocument) => {
                        const idx = merged.findIndex(d => d.id === newDoc.id);
                        if (idx >= 0) merged[idx] = newDoc;
                        else merged.push(newDoc);
                    });
                    return merged;
                });
            }

            logSecurityEvent("External data imported via Sync", "WARNING", "DATA_RESET");
            alert(`Sync Complete!\nImported ${data.entries.length} entries and settings.`);

        } catch (e) {
            logger.error('Import failed:', e);
            alert("Import Failed: Invalid JSON file.");
        }
    };

    // ============================================
    // Recurring Expense Operations
    // ============================================
    const addRecurringExpense = (expense: RecurringExpense) => {
        setRecurringExpenses(prev => [expense, ...prev]);
    };

    const updateRecurringExpense = (expense: RecurringExpense) => {
        setRecurringExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    };

    const deleteRecurringExpense = (id: string) => {
        if (window.confirm("Delete this recurring expense?")) {
            setRecurringExpenses(prev => prev.filter(e => e.id !== id));
        }
    };

    // ============================================
    // Family Invite Operations
    // ============================================
    const addFamilyInvite = (invite: FamilyInvite) => {
        setFamilyInvites(prev => [invite, ...prev]);
    };

    const updateFamilyInvite = (invite: FamilyInvite) => {
        setFamilyInvites(prev => prev.map(i => i.id === invite.id ? invite : i));
    };

    const cancelFamilyInvite = (id: string) => {
        setFamilyInvites(prev => prev.filter(i => i.id !== id));
    };

    // ============================================
    // Help Task Operations
    // ============================================
    const addHelpTask = (task: HelpTask) => {
        setHelpTasks(prev => [task, ...prev]);
    };

    const updateHelpTask = (task: HelpTask) => {
        setHelpTasks(prev => prev.map(t => t.id === task.id ? task : t));
    };

    const claimHelpTask = (taskId: string, userId: string) => {
        setHelpTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, claimedByUserId: userId || undefined, status: userId ? 'claimed' : 'available' }
                : t
        ));
    };

    const completeHelpTask = (taskId: string) => {
        setHelpTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: 'completed' } : t
        ));
    };

    // ============================================
    // Medication Operations
    // ============================================
    const addMedication = (med: Medication) => {
        setMedications(prev => [med, ...prev]);
    };

    const updateMedication = (med: Medication) => {
        setMedications(prev => prev.map(m => m.id === med.id ? med : m));
    };

    const deleteMedication = (id: string) => {
        if (window.confirm("Delete this medication?")) {
            setMedications(prev => prev.filter(m => m.id !== id));
        }
    };

    const logMedication = (log: MedicationLog) => {
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
