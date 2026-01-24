import { useState, useEffect, useCallback } from 'react';
import { LedgerEntry, Task, VaultDocument, FamilySettings, SecurityEvent, User } from '../types';
import { storageService } from '../services/storageService';

/**
 * Custom hook for managing KinCommand's centralized state
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

    // Async Data Loading
    useEffect(() => {
        const loadAllData = async () => {
            try {
                // Determine if we should load defaultTasks or use empty if loading fails
                // In a real app, defaults might only be used if storage is truly empty
                const [
                    loadedEntries,
                    loadedTasks,
                    loadedDocs,
                    loadedSettings,
                    loadedLogs
                ] = await Promise.all([
                    storageService.load('kin_entries', defaultEntries),
                    storageService.load('kin_tasks', defaultTasks),
                    storageService.load('kin_documents', defaultDocuments),
                    storageService.load('kin_settings', defaultSettings),
                    storageService.load('kin_security_logs', [])
                ]);

                // Batch updates to reduce renders (React 18 does this automatically)
                setEntries(loadedEntries);
                setTasks(loadedTasks);
                setDocuments(loadedDocs);
                setSettings(loadedSettings);
                setSecurityLogs(loadedLogs);
            } catch (error) {
                console.error("Failed to load application data:", error);
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

    /**
     * Imports data from backup file with smart merge logic
     * Merges by ID - updates existing items, adds new ones
     * @param data - Backup data object containing entries, tasks, documents, and settings
     */
    const importData = (data: any) => {
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
            alert(`Sync Complete!\\nImported ${data.entries.length} entries and settings.`);

        } catch (e) {
            console.error(e);
            alert("Import Failed: Invalid JSON file.");
        }
    };

    return {
        // State
        entries,
        tasks,
        documents,
        settings,
        securityLogs,
        isLoading, // Exposed for UI

        // Operations
        addEntry,
        addEntries,
        deleteEntry,
        addTask,
        updateTask,
        convertTaskToEntry,
        addDocument,
        deleteDocument,
        updateSettings,
        importData,
        logSecurityEvent
    };
};
