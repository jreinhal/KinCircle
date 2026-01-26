import React, { useRef, useState, useEffect } from 'react';
import { FamilySettings, LedgerEntry, Task, VaultDocument } from '../types';
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
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const confirm = useConfirm();

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const canUpdateSettings = hasPermission(currentUser, 'settings:update');
  const canExportData = hasPermission(currentUser, 'data:export');
  const canImportData = hasPermission(currentUser, 'data:import');
  const canResetData = hasPermission(currentUser, 'data:reset');
  const canViewSecurityLogs = hasPermission(currentUser, 'security_logs:read');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdateSettings) {
      alert('You do not have permission to update settings.');
      return;
    }
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
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
      />

      <DataSyncSection
        onCloudSync={handleCloudSync}
        onExport={handleExport}
        onImportFile={handleImportFile}
        fileInputRef={fileInputRef}
        canExport={canExportData}
        canImport={canImportData}
      />

      <SecurityLogsSection securityLogs={securityLogs} canView={canViewSecurityLogs} />

      <DangerZoneSection onReset={handleReset} canReset={canResetData} />

      <SettingsFooter />
    </div>
  );
};

export default Settings;
