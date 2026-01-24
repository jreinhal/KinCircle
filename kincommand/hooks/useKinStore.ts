import { useState, useEffect, useCallback } from 'react';
import { LedgerEntry, Task, VaultDocument, FamilySettings, SecurityEvent, User } from '../types';
import { storageService } from '../services/storageService';

/**
 * Custom hook for managing KinCommand's centralized state
 * Abstracts business logic away from UI components
 */
export const useKinStore = (
    defaultEntries: LedgerEntry[],
    defaultTasks: Task[],
    defaultDocuments: VaultDocument[],
    defaultSettings: FamilySettings,
    currentUser: User
) => {
    // Initialize state from storage
    const [entries, setEntries] = useState<LedgerEntry[]>(() =>
        storageService.load('kin_entries', defaultEntries)
    );

    const [tasks, setTasks] = useState<Task[]>(() =>
        storageService.load('kin_tasks', defaultTasks)
    );

    const [documents, setDocuments] = useState<VaultDocument[]>(() =>
        storageService.load('kin_documents', defaultDocuments)
    );

    const [settings, setSettings] = useState<FamilySettings>(() =>
        storageService.load('kin_settings', defaultSettings)
    );

    const [securityLogs, setSecurityLogs] = useState<SecurityEvent[]>(() =>
        storageService.load('kin_security_logs', [])
    );

    // Persist changes to storage
    useEffect(() => {
        storageService.save('kin_entries', entries);
    }, [entries]);

    useEffect(() => {
        storageService.save('kin_tasks', tasks);
    }, [tasks]);

    useEffect(() => {
        storageService.save('kin_documents', documents);
    }, [documents]);

    useEffect(() => {
        storageService.save('kin_settings', settings);
    }, [settings]);

    useEffect(() => {
        storageService.save('kin_security_logs', securityLogs);
    }, [securityLogs]);

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

    // Import data (merge logic)
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
