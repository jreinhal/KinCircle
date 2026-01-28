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
import RecurringExpenses from './components/RecurringExpenses';
import FamilyInvite from './components/FamilyInvite';
import HelpCalendar from './components/HelpCalendar';
import MedicationTracker from './components/MedicationTracker';
import ErrorBoundary from './components/ErrorBoundary';
import { ConfirmProvider } from './components/ConfirmDialog';
// Lazy load AgentLab for better performance (only loads when user accesses the feature)
const AgentLab = lazy(() => import('./components/AgentLab'));
import LockScreen from './components/LockScreen';
import OnboardingWizard from './components/OnboardingWizard';
import { User, LedgerEntry, EntryType, FamilySettings, UserRole, Task, VaultDocument, ThemeMode } from './types';
import { getSecurityMeta } from './utils/securityMeta';
import { deriveKeyFromPin } from './utils/storageCrypto';
import { refreshEncryptionState, setEncryptionEnabled, setEncryptionKey, hasEncryptionKey } from './services/storageService';
import { AppProvider, useAppContext } from './context/AppContext';
import { KinStoreProvider, useKinStoreContext } from './context/KinStoreContext';
import { useSettingsStore } from './hooks/useSettingsStore';

// Mock Data
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Sarah Miller', role: UserRole.ADMIN },
  { id: 'u2', name: 'David Miller', role: UserRole.CONTRIBUTOR },
];

// NOTE: hasCompletedOnboarding default is FALSE to trigger wizard for new instances
// Auto-lock defaults to true for safer out-of-the-box behavior
const DEFAULT_SETTINGS: FamilySettings = {
  hourlyRate: 25,
  patientName: '',
  privacyMode: false,
  autoLockEnabled: true,
  hasCompletedOnboarding: false,
  familyId: '',
  securityProfile: 'standard',
  themeMode: 'system'
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

const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [entryTypeDraft, setEntryTypeDraft] = useState<EntryType | null>(null);

  const { currentUser, setCurrentUser, users } = useAppContext();
  const { settings, updateSettings, logSecurityEvent, securityLogs } = useSettingsStore();
  const { isLoading } = useKinStoreContext();

  // Initial App Load Log
  useEffect(() => {
    if (securityLogs.length === 0 && !isLoading) {
      logSecurityEvent('Application Initialized', 'INFO', 'SYSTEM_INIT');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const themeMode: ThemeMode = settings.themeMode ?? 'system';

    const applyTheme = () => {
      const prefersDark = media.matches;
      const useDark = themeMode === 'dark' || (themeMode === 'system' && prefersDark);
      root.classList.toggle('dark', useDark);
      root.style.colorScheme = useDark ? 'dark' : 'light';

      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', useDark ? '#0f172a' : '#0d9488');
      }
    };

    applyTheme();

    if (themeMode === 'system') {
      const handler = () => applyTheme();
      if (media.addEventListener) {
        media.addEventListener('change', handler);
      } else {
        media.addListener(handler);
      }
      return () => {
        if (media.removeEventListener) {
          media.removeEventListener('change', handler);
        } else {
          media.removeListener(handler);
        }
      };
    }
    return undefined;
  }, [settings.themeMode]);

  const AUTO_LOCK_MS = 5 * 60 * 1000;

  // --- IDLE TIMER LOGIC ---
  const handleActivity = useCallback(() => {
    // If auto-lock is disabled in settings, do nothing
    if (!settings.autoLockEnabled || !settings.customPinHash) {
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
    }, AUTO_LOCK_MS);
  }, [isLocked, settings.autoLockEnabled, settings.hasCompletedOnboarding, logSecurityEvent]);

  useEffect(() => {
    if (settings.autoLockEnabled && settings.hasCompletedOnboarding && settings.customPinHash) {
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('scroll', handleActivity);

      window.idleTimer = setTimeout(() => {
        setIsLocked(true);
      }, AUTO_LOCK_MS);
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

  const handleSwitchUser = () => {
    setCurrentUser((prev: User) => {
      const currentIndex = users.findIndex(user => user.id === prev.id);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % users.length : 0;
      const newUser = users[nextIndex] || prev;
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
        return (
          <Dashboard
            onStartEntry={(type: EntryType) => {
              setEntryTypeDraft(type);
              setActiveTab('add-entry');
            }}
          />
        );
      case 'schedule':
        return <Schedule />;
      case 'add-entry':
        return (
          <EntryForm
            initialType={entryTypeDraft ?? EntryType.EXPENSE}
            onEntryAdded={() => {
              setEntryTypeDraft(null);
              setActiveTab('dashboard');
            }}
            onCancel={() => {
              setEntryTypeDraft(null);
              setActiveTab('dashboard');
            }}
          />
        );
      case 'chat':
        return <ChatAssistant />;
      case 'entries':
        return <Ledger />;
      case 'medicaid':
        return <MedicaidReport />;
      case 'vault':
        return <Vault />;
      case 'agent-lab':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-slate-500">Loading Agent Lab...</div></div>}>
            <AgentLab />
          </Suspense>
        );
      case 'recurring':
        return <RecurringExpenses />;
      case 'family':
        return <FamilyInvite />;
      case 'help-calendar':
        return <HelpCalendar />;
      case 'medications':
        return <MedicationTracker />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <Dashboard
            onStartEntry={(type: EntryType) => {
              setEntryTypeDraft(type);
              setActiveTab('add-entry');
            }}
          />
        );
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
    return <OnboardingWizard onComplete={handleOnboardingComplete} initialSettings={settings} />;
  }

  return (
    <div className="flex h-screen bg-slate-50">

      {/* Security Overlay */}
      {isLocked && (
        <LockScreen
          onUnlock={handleUnlock}
          onFailure={handleAuthFailure}
          user={currentUser.name}
          customPinHash={settings.customPinHash}
          isSecureHash={settings.isSecurePinHash}
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
        {/* Mobile Header - with safe area padding for notched devices */}
        <div className="md:hidden bg-white pt-[env(safe-area-inset-top)]">
          {/* Actual header content */}
          <header className="px-4 py-3 min-h-[56px] border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 leading-none">KinCircle</span>
            </div>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="text-slate-600 -mr-2 h-10 w-10 inline-flex items-center justify-center"
              aria-label="Open navigation"
            >
              <Menu size={24} />
            </button>
          </header>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 pb-20 md:p-8 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <ErrorBoundary>
              {renderContent()}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [securityMeta, setSecurityMeta] = useState(() => getSecurityMeta());
  const [encryptionReady, setEncryptionReady] = useState(() => !securityMeta.encryptionEnabled);

  useEffect(() => {
    const refresh = () => setSecurityMeta(getSecurityMeta());
    window.addEventListener('security-meta-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('security-meta-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    refreshEncryptionState();
    const enabled = Boolean(securityMeta.encryptionEnabled);
    if (enabled && !securityMeta.pinHash) {
      setEncryptionEnabled(false);
      setEncryptionReady(true);
      return;
    }
    setEncryptionEnabled(enabled);
    if (!enabled) {
      setEncryptionReady(true);
    }
  }, [securityMeta]);

  const handleInitialUnlock = async (_method: string, pin?: string) => {
    if (!securityMeta.encryptionEnabled) {
      setEncryptionReady(true);
      return;
    }

    if (!pin || !securityMeta.saltHex) {
      return;
    }

    const key = await deriveKeyFromPin(pin, securityMeta.saltHex);
    setEncryptionKey(key);
    setEncryptionReady(true);
  };

  if (!encryptionReady && securityMeta.encryptionEnabled) {
    return (
      <LockScreen
        onUnlock={handleInitialUnlock}
        onFailure={() => undefined}
        user="Family Admin"
        customPinHash={securityMeta.pinHash}
        isSecureHash={securityMeta.isSecurePinHash}
      />
    );
  }

  if (securityMeta.encryptionEnabled && !hasEncryptionKey()) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
          <p>Initializing secure storage...</p>
        </div>
      </div>
    );
  }

  return (
    <ConfirmProvider>
      <AppProvider users={MOCK_USERS}>
        <KinStoreProvider
          defaultEntries={MOCK_ENTRIES}
          defaultTasks={MOCK_TASKS}
          defaultDocuments={MOCK_DOCS}
          defaultSettings={DEFAULT_SETTINGS}
        >
          <AppShell />
        </KinStoreProvider>
      </AppProvider>
    </ConfirmProvider>
  );
}

// Add type definition for window to support custom timeout property
declare global {
  interface Window {
    idleTimer: ReturnType<typeof setTimeout> | undefined;
  }
}
