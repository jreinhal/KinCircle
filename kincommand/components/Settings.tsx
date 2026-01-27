import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { FamilySettings, LedgerEntry, Task, VaultDocument, ThemeMode } from '../types';
import {
  encryptAllLocalStorage,
  setEncryptionEnabled,
  setEncryptionKey,
  refreshEncryptionState,
  getStorageProvider,
  createStorageServiceInstance
} from '../services/storageService';
import { hashPinSecure } from '../utils/crypto';
import { logger } from '../utils/logger';
import { hasPermission } from '../utils/rbac';
import { backupDataSchema, formatZodErrors } from '../utils/validation';
import { deriveKeyFromPin, generateSaltHex } from '../utils/storageCrypto';
import { getSecurityMeta, updateSecurityMeta } from '../utils/securityMeta';
import { useConfirm } from './ConfirmDialog';
import { sha256Hex, stableStringify } from '../utils/checksum';
import SettingsHeader from './Settings/SettingsHeader';
import SettingsForm from './Settings/SettingsForm';
import DataSyncSection from './Settings/DataSyncSection';
import SecurityLogsSection from './Settings/SecurityLogsSection';
import DangerZoneSection from './Settings/DangerZoneSection';
import SettingsFooter from './Settings/SettingsFooter';
import { useEntriesStore } from '../hooks/useEntriesStore';
import { useTasksStore } from '../hooks/useTasksStore';
import { useDocumentsStore } from '../hooks/useDocumentsStore';
import { useSettingsStore } from '../hooks/useSettingsStore';
import { useAppContext } from '../context/AppContext';

interface BackupData {
  version?: string;
  timestamp?: string;
  settings: FamilySettings;
  entries: LedgerEntry[];
  tasks?: Task[];
  documents?: VaultDocument[];
}

interface BackupFile extends BackupData {
  checksum?: string;
  checksumVersion?: string;
}

const CHECKSUM_VERSION = 'sha256-1';

const Settings: React.FC = () => {
  const { entries } = useEntriesStore();
  const { tasks } = useTasksStore();
  const { documents } = useDocumentsStore();
  const { settings, updateSettings, importData, securityLogs } = useSettingsStore();
  const { currentUser } = useAppContext();
  const [formData, setFormData] = useState<FamilySettings>(settings);
  const previousSettingsRef = useRef<FamilySettings | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const confirm = useConfirm();

  const hasUnsavedChanges = useMemo(() => {
    const keys = Object.keys(formData) as (keyof FamilySettings)[];
    return keys.some((key) => formData[key] !== settings[key]);
  }, [formData, settings]);
  const showSavedState = isSaved && !hasUnsavedChanges;

  useEffect(() => {
    if (!previousSettingsRef.current) {
      setFormData(settings);
      previousSettingsRef.current = settings;
      return;
    }

    const previous = previousSettingsRef.current;
    previousSettingsRef.current = settings;
    const keys = Object.keys(settings) as (keyof FamilySettings)[];
    const changedKeys = keys.filter((key) => settings[key] !== previous[key]);

    if (changedKeys.length === 1 && changedKeys[0] === 'themeMode') {
      setFormData((prev) => ({ ...prev, themeMode: settings.themeMode }));
      return;
    }

    setFormData(settings);
  }, [settings]);

  const canUpdateSettings = hasPermission(currentUser, 'settings:update');
  const canExportData = hasPermission(currentUser, 'data:export');
  const canImportData = hasPermission(currentUser, 'data:import');
  const canResetData = hasPermission(currentUser, 'data:reset');
  const canViewSecurityLogs = hasPermission(currentUser, 'security_logs:read');

  const handleSave = () => {
    if (!canUpdateSettings) {
      alert('You do not have permission to update settings.');
      return;
    }
    if (!hasUnsavedChanges) return;
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const handleThemeChange = (mode: ThemeMode) => {
    if (!canUpdateSettings) {
      alert('You do not have permission to update settings.');
      return;
    }
    if (settings.themeMode === mode) return;
    updateSettings({ ...settings, themeMode: mode });
  };

  const handleReset = async () => {
    if (!canResetData) {
      alert('You do not have permission to reset application data.');
      return;
    }
    const ok = await confirm({
      title: 'Reset application data',
      message: 'Are you sure you want to erase all data and reset the app? This action cannot be undone.',
      confirmLabel: 'Erase all data',
      destructive: true
    });
    if (!ok) return;
    localStorage.clear();
    window.location.reload();
  };

  const buildExportPayload = (): BackupData => ({
    version: '1.0',
    timestamp: new Date().toISOString(),
    settings: formData,
    entries,
    tasks,
    documents
  });

  const handleExport = async () => {
    if (!canExportData) {
      alert('You do not have permission to export data.');
      return;
    }

    try {
      const payload = buildExportPayload();
      const checksum = await sha256Hex(stableStringify(payload));
      const exportData: BackupFile = { ...payload, checksum, checksumVersion: CHECKSUM_VERSION };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kin_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      logger.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canImportData) {
      alert('You do not have permission to import data.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as BackupFile;
        const { checksum, checksumVersion, ...payload } = data;

        if (checksum) {
          const expected = await sha256Hex(stableStringify(payload));
          if (expected !== checksum) {
            alert('Import failed: backup checksum does not match. The file may be corrupted or edited.');
            return;
          }
          if (checksumVersion && checksumVersion !== CHECKSUM_VERSION) {
            logger.warn('Backup checksum version mismatch', { checksumVersion });
          }
        }

        const validation = backupDataSchema.safeParse(payload);
        if (!validation.success) {
          const errors = formatZodErrors(validation.error);
          alert(`Import failed due to validation errors:\n${errors.join('\n')}`);
          return;
        }

        const ok = await confirm({
          title: 'Import backup',
          message: `Found ${validation.data.entries?.length || 0} entries in this backup. Merge with current data?`,
          confirmLabel: 'Merge backup'
        });
        if (ok) importData(validation.data);
      } catch (err) {
        alert('Error parsing backup file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdatePin = async () => {
    if (!canUpdateSettings) {
      alert('You do not have permission to update settings.');
      return;
    }
    if (newPin.length !== 4) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    try {
      const secureHash = await hashPinSecure(newPin);
      setFormData({ ...formData, customPinHash: secureHash, isSecurePinHash: true });

      if (getStorageProvider() === 'local') {
        const meta = getSecurityMeta();
        const saltHex = meta.saltHex || generateSaltHex();
        const key = await deriveKeyFromPin(newPin, saltHex);

        setEncryptionKey(key);
        setEncryptionEnabled(true);
        refreshEncryptionState();
        updateSecurityMeta({
          pinHash: secureHash,
          isSecurePinHash: true,
          encryptionEnabled: true,
          saltHex,
          version: 1
        });

        await encryptAllLocalStorage();
      }

      setNewPin('');
      setConfirmPin('');
      setIsSaved(false);
      alert('PIN updated and encryption enabled. Remember to save your settings.');
    } catch (err) {
      setPinError('Failed to encrypt PIN. Please try again.');
    }
  };

  const handleCloudSync = async () => {
    if (!canExportData || !canImportData) {
      alert('You do not have permission to sync data.');
      return;
    }
    const ok = await confirm({
      title: 'Sync local data to cloud',
      message: 'Upload local data to cloud? This will overwrite cloud data with local copies.',
      confirmLabel: 'Sync now'
    });
    if (!ok) return;

    try {
      const localStore = createStorageServiceInstance('local');
      const cloudStore = createStorageServiceInstance('supabase');

      const localEntries = await localStore.load('kin_entries', []);
      const localTasks = await localStore.load('kin_tasks', []);
      const localDocs = await localStore.load('kin_documents', []);
      const localSettings = await localStore.load('kin_settings', formData);

      await cloudStore.save('kin_entries', localEntries);
      await cloudStore.save('kin_tasks', localTasks);
      await cloudStore.save('kin_documents', localDocs);
      await cloudStore.save('kin_settings', localSettings);

      alert('Migration Success! Your data is now in the cloud.');
      window.location.reload();
    } catch (e) {
      logger.error('Cloud migration failed:', e);
      alert('Migration Failed. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-24">
      <SettingsHeader />

      <SettingsForm
        formData={formData}
        setFormData={setFormData}
        newPin={newPin}
        confirmPin={confirmPin}
        pinError={pinError}
        setNewPin={setNewPin}
        setConfirmPin={setConfirmPin}
        setPinError={setPinError}
        onUpdatePin={handleUpdatePin}
        onSubmit={handleSubmit}
        isSaved={isSaved}
        canUpdateSettings={canUpdateSettings}
        onThemeChange={handleThemeChange}
        showSaveButton={false}
      />

      <details
        className="group rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none"
        open={isAdvancedOpen}
        onToggle={(event) => setIsAdvancedOpen((event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer list-none flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-white/70 dark:hover:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/90 border border-slate-200 text-teal-600 flex items-center justify-center shadow-sm dark:bg-slate-900/80 dark:border-slate-700 dark:text-teal-300 dark:shadow-none">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Advanced Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sync, audit logs, and resets.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span>{isAdvancedOpen ? 'Collapse' : 'Expand'}</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
          </div>
        </summary>
        <div className="mt-4 space-y-6">
          <DataSyncSection
            onCloudSync={handleCloudSync}
            onExport={handleExport}
            onImportFile={handleImportFile}
            fileInputRef={fileInputRef}
            canExport={canExportData}
            canImport={canImportData}
            compact
          />

          <SecurityLogsSection securityLogs={securityLogs} canView={canViewSecurityLogs} compact />

          <DangerZoneSection onReset={handleReset} canReset={canResetData} compact />
        </div>
      </details>

      <div className={`sticky bottom-4 z-10 rounded-2xl border px-4 py-3 backdrop-blur transition-all duration-200 ease-out shadow-lg shadow-slate-900/5 dark:shadow-none ${
        hasUnsavedChanges
          ? 'border-amber-200 bg-amber-50/90 dark:border-amber-500/30 dark:bg-amber-900/20'
          : 'border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/70'
      }`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            {hasUnsavedChanges ? (
              <span className="text-amber-900 font-medium dark:text-amber-200">Unsaved changes</span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">All changes saved</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canUpdateSettings || !hasUnsavedChanges}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
              canUpdateSettings && hasUnsavedChanges
                ? 'bg-teal-600 text-white hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            {showSavedState ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      <SettingsFooter />
    </div>
  );
};

export default Settings;
