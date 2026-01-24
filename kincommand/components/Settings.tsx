import React, { useRef } from 'react';
import { FamilySettings, LedgerEntry, User, SecurityEvent, Task, VaultDocument } from '../types';
import { Save, Shield, DollarSign, User as UserIcon, Trash2, AlertTriangle, Lock, FileText, Activity, Download, Upload, Share2, GitBranch, Cloud } from 'lucide-react';
import { storageService } from '../services/storageService';

interface SettingsProps {
  settings: FamilySettings;
  onSave: (newSettings: FamilySettings) => void;
  entries: LedgerEntry[];
  tasks: Task[];
  documents: VaultDocument[];
  users: User[];
  onImport: (data: any) => void;
  securityLogs: SecurityEvent[];
}

// Simple hash function for PIN storage (Phase 1 - not cryptographically secure)
const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

const Settings: React.FC<SettingsProps> = ({ settings, onSave, entries, tasks, documents, users, onImport, securityLogs }) => {
  const [formData, setFormData] = React.useState<FamilySettings>(settings);
  const [isSaved, setIsSaved] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPin, setNewPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [pinError, setPinError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to erase all data and reset the app? This action cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleExport = () => {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      settings: formData,
      entries,
      tasks,
      documents
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kin_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (window.confirm(`Found ${data.entries?.length || 0} entries in backup. Merge with current data?`)) {
          onImport(data);
        }
      } catch (err) {
        alert("Error parsing backup file");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Family Configuration</h1>
        <p className="text-slate-500">Manage rates, privacy, and care details.</p>
      </header>

      {/* HIPAA Warning Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start space-x-3">
        <Shield className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="text-sm font-bold text-orange-900">Prototype Compliance Notice</h3>
          <p className="text-xs text-orange-800 mt-1">
            This application uses <strong>Local Storage</strong> and is NOT currently HIPAA compliant for real-world medical data storage.
            Do not store sensitive SSNs or detailed medical histories without an Enterprise upgrade.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Financial Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="text-blue-500" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Financial Agreement</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sweat Equity Hourly Rate ($)</label>
              <p className="text-xs text-slate-500 mb-2">The agreed value for one hour of caregiving work.</p>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                className="bg-white text-slate-900 placeholder:text-slate-400 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-4">
            <UserIcon className="text-purple-500" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Care Recipient</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                className="bg-white text-slate-900 placeholder:text-slate-400 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Privacy & AI */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-4">
            <Lock className="text-green-500" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Privacy & Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="privacyMode"
                checked={formData.privacyMode}
                onChange={(e) => setFormData({ ...formData, privacyMode: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <label htmlFor="privacyMode" className="block text-sm font-medium text-slate-900">Enhanced Privacy Masking</label>
                <p className="text-sm text-slate-500 mt-1">
                  When enabled, the app uses regex to scrub Patient Names, Emails, Phone Numbers, and SSN patterns before sending data to the AI.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="autoLock"
                checked={formData.autoLockEnabled}
                onChange={(e) => setFormData({ ...formData, autoLockEnabled: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <label htmlFor="autoLock" className="block text-sm font-medium text-slate-900">Auto-Lock Inactivity Timer</label>
                <p className="text-sm text-slate-500 mt-1">
                  Automatically lock the application after 60 seconds of inactivity.
                  <span className="text-orange-600 font-medium ml-1">
                    Disabling this reduces HIPAA compliance.
                  </span>
                </p>
              </div>
            </div>

            {/* Custom PIN Configuration */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Custom PIN Code</h4>
              <p className="text-xs text-blue-700 mb-3">
                Set a 4-digit PIN for lock screen authentication. Default is "1234".
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="New PIN"
                    value={newPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setNewPin(val);
                      setPinError('');
                    }}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Confirm PIN"
                    value={confirmPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setConfirmPin(val);
                      setPinError('');
                    }}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              {pinError && <p className="text-xs text-red-600 mt-2">{pinError}</p>}
              <button
                type="button"
                onClick={() => {
                  if (newPin.length !== 4) {
                    setPinError('PIN must be exactly 4 digits');
                    return;
                  }
                  if (newPin !== confirmPin) {
                    setPinError('PINs do not match');
                    return;
                  }
                  setFormData({ ...formData, customPinHash: hashPin(newPin) });
                  setNewPin('');
                  setConfirmPin('');
                  setIsSaved(false);
                  alert('PIN updated! Remember to save your settings.');
                }}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update PIN
              </button>
              {formData.customPinHash && (
                <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                  <Lock size={12} /> Custom PIN is set
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
        >
          {isSaved ? <span>Saved Successfully!</span> : (
            <>
              <Save size={18} />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </form>

      {/* Sync & Backup Section */}
      <div className="mt-8 pt-8 border-t border-slate-200">

        {/* Cloud Sync Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Cloud className="text-indigo-500" size={24} />
            <h3 className="text-lg font-semibold text-slate-800">Cloud Sync (Beta)</h3>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-sm text-indigo-900 mb-3">
              Migrate your local data to the secure cloud. This enables sharing with family members.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("Upload local data to cloud? This will overwrite cloud data with local copies.")) return;
                try {
                  // Manual migration: Read Local -> Write Cloud
                  const localEntries = localStorage.getItem('kin_entries');
                  const localTasks = localStorage.getItem('kin_tasks');
                  const localDocs = localStorage.getItem('kin_documents');
                  const localSettings = localStorage.getItem('kin_settings');

                  if (localEntries) await storageService.save('kin_entries', JSON.parse(localEntries));
                  if (localTasks) await storageService.save('kin_tasks', JSON.parse(localTasks));
                  if (localDocs) await storageService.save('kin_documents', JSON.parse(localDocs));
                  if (localSettings) await storageService.save('kin_settings', JSON.parse(localSettings));

                  alert("Migration Success! Your data is now in the cloud.");
                  window.location.reload(); // Refresh to load from cloud
                } catch (e) {
                  console.error(e);
                  alert("Migration Failed. Check console.");
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Cloud className="w-4 h-4" />
              <span>Sync Local Data to Cloud</span>
            </button>
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Manual Data Sync</h3>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
          <div className="flex items-center space-x-2 text-indigo-900 mb-2">
            <Share2 size={18} />
            <h4 className="font-semibold">Share Ledger with Family</h4>
          </div>
          <p className="text-sm text-indigo-700 mb-4">
            To sync data between devices without a cloud server, export your data and send the file to your family members to import.
          </p>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              <Download size={16} />
              <span>Export Backup</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Upload size={16} />
              <span>Import Backup</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleImportFile}
            />
          </div>
        </div>
      </div>

      {/* Security Audit Log Viewer */}
      <div className="bg-slate-900 text-slate-300 rounded-xl overflow-hidden border border-slate-800 shadow-lg mt-8">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity size={18} className="text-blue-400" />
            <h3 className="font-mono text-sm font-bold text-white">Security Audit Trail</h3>
          </div>
          <div className="text-xs text-slate-500 font-mono">Immutable</div>
        </div>
        <div className="p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-2">
          {securityLogs.length === 0 && <span className="text-slate-600 italic">No events logged yet.</span>}
          {[...securityLogs].reverse().map((log) => (
            <div key={log.id} className="flex gap-4 border-l-2 border-slate-700 pl-3 py-1">
              <span className="text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <div className="flex-1">
                <span className={`font-bold mr-2 ${log.severity === 'CRITICAL' ? 'text-red-500' :
                  log.severity === 'WARNING' ? 'text-yellow-500' : 'text-blue-400'
                  }`}>
                  [{log.type}]
                </span>
                <span>{log.details}</span>
                <span className="text-slate-600 ml-2">({log.user})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Management Section */}
      <div className="mt-8 pt-8 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Danger Zone</h3>

        <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-red-800 mb-1">
              <AlertTriangle size={18} />
              <h4 className="font-semibold">Reset Application Data</h4>
            </div>
            <p className="text-sm text-red-600">
              This will permanently delete all local entries and settings. The app will revert to the default demo state.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
          >
            <Trash2 size={16} />
            <span>Reset Everything</span>
          </button>
        </div>
      </div>

      {/* Version Footer */}
      <div className="text-center text-slate-400 text-xs mt-8 pb-4 flex flex-col items-center">
        <div className="flex items-center space-x-1">
          <GitBranch size={10} />
          <span>KinCommand v0.1.0-alpha</span>
        </div>
        <p className="mt-1">Build: {new Date().toISOString().split('T')[0]}</p>
      </div>
    </div>
  );
};

export default Settings;