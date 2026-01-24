import React, { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import Ledger from './components/Ledger';
import MedicaidReport from './components/MedicaidReport';
import Vault from './components/Vault';
import Settings from './components/Settings';
import ChatAssistant from './components/ChatAssistant';
import Schedule from './components/Schedule';
import AgentLab from './components/AgentLab';
import LockScreen from './components/LockScreen';
import OnboardingWizard from './components/OnboardingWizard';
import { User, LedgerEntry, EntryType, FamilySettings, UserRole, Task, VaultDocument, SecurityEvent } from './types';

// Mock Data
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Sarah Miller', role: UserRole.ADMIN },
  { id: 'u2', name: 'David Miller', role: UserRole.CONTRIBUTOR },
];

// NOTE: hasCompletedOnboarding default is FALSE to trigger wizard for new instances
const DEFAULT_SETTINGS: FamilySettings = {
  hourlyRate: 25,
  patientName: '',
  privacyMode: false,
  autoLockEnabled: true,
  hasCompletedOnboarding: false 
};

const MOCK_ENTRIES: LedgerEntry[] = [
  { id: '1', userId: 'u1', type: EntryType.EXPENSE, date: '2023-10-01', description: 'Groceries', amount: 156.40, category: 'Groceries' },
  { id: '2', userId: 'u2', type: EntryType.EXPENSE, date: '2023-10-05', description: 'CVS Prescriptions', amount: 45.20, category: 'Medical' },
  { id: '3', userId: 'u1', type: EntryType.TIME, date: '2023-10-06', description: 'Driving to Cardiology Appt', amount: 75.00, timeDurationMinutes: 180, category: 'Transport' },
];

const MOCK_TASKS: Task[] = [
    { id: 't1', title: 'Schedule Annual Physical', assignedUserId: 'u1', dueDate: new Date().toISOString().split('T')[0], isCompleted: false },
];

const MOCK_DOCS: VaultDocument[] = [
  { id: 'd1', name: 'Durable Power of Attorney', date: '2023-11-15', type: 'Legal', size: '2.4 MB' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Security Lock State
  
  // State for User Switching
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);

  // Initialize state from LocalStorage or Fallback to defaults
  const [entries, setEntries] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('kin_entries');
    return saved ? JSON.parse(saved) : MOCK_ENTRIES;
  });

  const [settings, setSettings] = useState<FamilySettings>(() => {
    const saved = localStorage.getItem('kin_settings');
    // If no saved settings, use default (which has hasCompletedOnboarding: false)
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
      const saved = localStorage.getItem('kin_tasks');
      return saved ? JSON.parse(saved) : MOCK_TASKS;
  });

  const [documents, setDocuments] = useState<VaultDocument[]>(() => {
    const saved = localStorage.getItem('kin_documents');
    return saved ? JSON.parse(saved) : MOCK_DOCS;
  });

  const [securityLogs, setSecurityLogs] = useState<SecurityEvent[]>(() => {
    const saved = localStorage.getItem('kin_security_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // --- LOGGING HELPER ---
  const logSecurityEvent = (details: string, severity: 'INFO' | 'WARNING' | 'CRITICAL', typeOverride?: SecurityEvent['type']) => {
    const newLog: SecurityEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: typeOverride || 'SYSTEM_INIT',
        details,
        severity,
        user: currentUser.name
    };
    
    // Using functional state update to ensure we get the latest logs
    setSecurityLogs(prev => {
        const updated = [...prev, newLog];
        localStorage.setItem('kin_security_logs', JSON.stringify(updated));
        return updated;
    });
  };

  // Persist changes
  useEffect(() => {
    localStorage.setItem('kin_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('kin_settings', JSON.stringify(settings));
  }, [settings]);
  
  useEffect(() => {
      localStorage.setItem('kin_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('kin_documents', JSON.stringify(documents));
  }, [documents]);

  // Initial App Load Log
  useEffect(() => {
      if (securityLogs.length === 0) {
        logSecurityEvent('Application Initialized', 'INFO', 'SYSTEM_INIT');
      }
  }, []);

  // --- IDLE TIMER LOGIC ---
  const handleActivity = useCallback(() => {
    // If auto-lock is disabled in settings, do nothing
    if (!settings.autoLockEnabled) {
        clearTimeout(window.idleTimer);
        return;
    }

    // Don't auto-lock if we are in onboarding
    if (!settings.hasCompletedOnboarding) return;

    if (isLocked) return;

    clearTimeout(window.idleTimer);
    window.idleTimer = setTimeout(() => {
        setIsLocked(true);
        logSecurityEvent('Session timeout - Auto lock engaged', 'INFO', 'SESSION_TIMEOUT');
    }, 60000); // 1 minute auto-lock
  }, [isLocked, settings.autoLockEnabled, settings.hasCompletedOnboarding, currentUser]);

  useEffect(() => {
    if (settings.autoLockEnabled && settings.hasCompletedOnboarding) {
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        window.idleTimer = setTimeout(() => {
            setIsLocked(true);
        }, 60000);
    } else {
        clearTimeout(window.idleTimer);
    }

    return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('scroll', handleActivity);
        clearTimeout(window.idleTimer);
    };
  }, [handleActivity, settings.autoLockEnabled, settings.hasCompletedOnboarding]);


  const handleUnlock = (method: string) => {
      setIsLocked(false);
      logSecurityEvent(`User successfully unlocked session via ${method}`, 'INFO', 'AUTH_SUCCESS');
  };

  const handleAuthFailure = () => {
      logSecurityEvent('Invalid PIN attempt detected', 'WARNING', 'AUTH_FAILURE');
  };

  const handleOnboardingComplete = (newSettings: FamilySettings) => {
      setSettings(newSettings);
      logSecurityEvent('User completed onboarding wizard', 'INFO', 'SYSTEM_INIT');
  };

  const handleAddEntry = (entry: LedgerEntry) => {
    setEntries(prev => [entry, ...prev]);
    setActiveTab('dashboard');
  };

  const handleAddEntries = (newEntries: LedgerEntry[]) => {
    setEntries(prev => [...newEntries, ...prev]);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleUpdateSettings = (newSettings: FamilySettings) => {
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

  const handleSwitchUser = () => {
    setCurrentUser(prev => {
        const newUser = prev.id === 'u1' ? MOCK_USERS[1] : MOCK_USERS[0];
        // Manually log here since state update isn't immediate for the log function to pick up new user name immediately
        const log: SecurityEvent = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type: 'AUTH_SUCCESS',
            details: `User switched from ${prev.name} to ${newUser.name}`,
            severity: 'INFO',
            user: newUser.name
        };
        setSecurityLogs(logs => {
             const updated = [...logs, log];
             localStorage.setItem('kin_security_logs', JSON.stringify(updated));
             return updated;
        });
        return newUser;
    });
  };

  // Task Handlers
  const handleAddTask = (task: Task) => {
      setTasks(prev => [...prev, task]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleConvertTaskToEntry = (task: Task, entry: LedgerEntry) => {
      setEntries(prev => [entry, ...prev]);
      const updatedTask: Task = { ...task, relatedEntryId: entry.id };
      handleUpdateTask(updatedTask);
  };

  // Vault Handlers
  const handleAddDocument = (doc: VaultDocument) => {
    setDocuments(prev => [doc, ...prev]);
  };

  const handleDeleteDocument = (id: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
        setDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  // --- IMPORT LOGIC ---
  const handleImportData = (data: any) => {
    try {
        if (!data.entries || !data.settings) throw new Error("Invalid backup format");
        
        // 1. Settings (Force Overwrite for consistency)
        setSettings(data.settings);

        // 2. Entries (Merge: Overwrite if ID exists, else Add)
        setEntries(prev => {
            const merged = [...prev];
            data.entries.forEach((newEntry: LedgerEntry) => {
                const idx = merged.findIndex(e => e.id === newEntry.id);
                if (idx >= 0) merged[idx] = newEntry;
                else merged.push(newEntry);
            });
            return merged;
        });

        // 3. Tasks (Merge)
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

        // 4. Docs (Merge)
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
        console.error(e);
        alert("Import Failed: Invalid JSON file.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard entries={entries} users={MOCK_USERS} settings={settings} />;
      case 'schedule':
        return (
            <Schedule 
                tasks={tasks}
                users={MOCK_USERS}
                currentUser={currentUser}
                settings={settings}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onConvertTaskToEntry={handleConvertTaskToEntry}
            />
        );
      case 'add-entry':
        return (
          <EntryForm 
            currentUser={currentUser} 
            settings={settings} 
            onAddEntry={handleAddEntry} 
            onCancel={() => setActiveTab('dashboard')} 
          />
        );
      case 'chat':
        return <ChatAssistant entries={entries} users={MOCK_USERS} settings={settings} />;
      case 'entries':
        return <Ledger entries={entries} users={MOCK_USERS} onDelete={handleDeleteEntry} />;
      case 'medicaid':
        return <MedicaidReport entries={entries} settings={settings} />;
      case 'vault':
        return (
          <Vault 
            documents={documents}
            settings={settings}
            users={MOCK_USERS}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
            onLogSecurityEvent={(details, severity) => logSecurityEvent(details, severity, 'EMERGENCY_ACCESS')}
          />
        );
      case 'agent-lab':
        return (
          <AgentLab 
            entries={entries}
            users={MOCK_USERS}
            settings={settings}
            onAddEntries={handleAddEntries}
          />
        );
      case 'settings':
        return (
          <Settings 
            settings={settings} 
            onSave={handleUpdateSettings} 
            entries={entries}
            tasks={tasks}
            documents={documents}
            users={MOCK_USERS}
            onImport={handleImportData}
            securityLogs={securityLogs}
          />
        );
      default:
        return <Dashboard entries={entries} users={MOCK_USERS} settings={settings} />;
    }
  };

  // Show Onboarding Wizard if not completed
  if (!settings.hasCompletedOnboarding) {
      return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* Security Overlay */}
      {isLocked && (
          <LockScreen 
            onUnlock={(method) => handleUnlock(method)} 
            onFailure={handleAuthFailure}
            user={currentUser.name}
          />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
           <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900">KinCommand</span>
           </div>
           <button onClick={() => setIsMobileOpen(true)} className="text-slate-600">
             <Menu size={24} />
           </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

// Add type definition for window to support custom timeout property
declare global {
    interface Window {
        idleTimer: any;
    }
}