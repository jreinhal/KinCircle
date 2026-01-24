import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
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
// Lazy load AgentLab for better performance (only loads when user accesses the feature)
const AgentLab = lazy(() => import('./components/AgentLab'));
import LockScreen from './components/LockScreen';
import OnboardingWizard from './components/OnboardingWizard';
import { User, LedgerEntry, EntryType, FamilySettings, UserRole, Task, VaultDocument } from './types';
import { useKinStore } from './hooks/useKinStore';

// Mock Data
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Sarah Miller', role: UserRole.ADMIN },
  { id: 'u2', name: 'David Miller', role: UserRole.CONTRIBUTOR },
];

// NOTE: hasCompletedOnboarding default is FALSE to trigger wizard for new instances
// NOTE: autoLockEnabled default is FALSE for development ease (can be enabled in Settings)
const DEFAULT_SETTINGS: FamilySettings = {
  hourlyRate: 25,
  patientName: '',
  privacyMode: false,
  autoLockEnabled: false,
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
  const [isLocked, setIsLocked] = useState(false);

  // State for User Switching
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);

  // Use centralized store hook
  const {
    entries,
    tasks,
    documents,
    settings,
    securityLogs,
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
    logSecurityEvent,
    isLoading
  } = useKinStore(MOCK_ENTRIES, MOCK_TASKS, MOCK_DOCS, DEFAULT_SETTINGS, currentUser);

  // Initial App Load Log
  useEffect(() => {
    if (securityLogs.length === 0 && !isLoading) {
      logSecurityEvent('Application Initialized', 'INFO', 'SYSTEM_INIT');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

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
    updateSettings(newSettings);
    logSecurityEvent('User completed onboarding wizard', 'INFO', 'SYSTEM_INIT');
  };

  const handleAddEntry = (entry: LedgerEntry) => {
    addEntry(entry);
    setActiveTab('dashboard');
  };

  const handleSwitchUser = () => {
    setCurrentUser(prev => {
      const newUser = prev.id === 'u1' ? MOCK_USERS[1] : MOCK_USERS[0];
      logSecurityEvent(
        `User switched from ${prev.name} to ${newUser.name}`,
        'INFO',
        'AUTH_SUCCESS'
      );
      return newUser;
    });
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
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onConvertTaskToEntry={convertTaskToEntry}
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
        return <Ledger entries={entries} users={MOCK_USERS} onDelete={deleteEntry} />;
      case 'medicaid':
        return <MedicaidReport entries={entries} settings={settings} />;
      case 'vault':
        return (
          <Vault
            documents={documents}
            settings={settings}
            users={MOCK_USERS}
            onAddDocument={addDocument}
            onDeleteDocument={deleteDocument}
            onLogSecurityEvent={(details, severity) => logSecurityEvent(details, severity, 'EMERGENCY_ACCESS')}
          />
        );
      case 'agent-lab':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-slate-500">Loading Agent Lab...</div></div>}>
            <AgentLab
              entries={entries}
              users={MOCK_USERS}
              settings={settings}
              onAddEntries={addEntries}
            />
          </Suspense>
        );
      case 'settings':
        return (
          <Settings
            settings={settings}
            onSave={updateSettings}
            entries={entries}
            tasks={tasks}
            documents={documents}
            users={MOCK_USERS}
            onImport={importData}
            securityLogs={securityLogs}
          />
        );
      default:
        return <Dashboard entries={entries} users={MOCK_USERS} settings={settings} />;
    }
  };

  // Show Loading Screen
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-700">Loading KinCommand...</h2>
        </div>
      </div>
    );
  }

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
          customPinHash={settings.customPinHash}
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
            <span className="font-bold text-slate-900">KinCircle</span>
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