import React from 'react';
import { DollarSign, User as UserIcon, Lock, Save, Monitor, Sun, Moon, ShieldCheck } from 'lucide-react';
import { FamilySettings, ThemeMode, SecurityProfile } from '../../types';

interface SettingsFormProps {
  formData: FamilySettings;
  setFormData: React.Dispatch<React.SetStateAction<FamilySettings>>;
  newPin: string;
  confirmPin: string;
  pinError: string;
  setNewPin: (val: string) => void;
  setConfirmPin: (val: string) => void;
  setPinError: (val: string) => void;
  onUpdatePin: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaved: boolean;
  canUpdateSettings: boolean;
  onThemeChange?: (mode: ThemeMode) => void;
  showSaveButton?: boolean;
}

const SettingsForm: React.FC<SettingsFormProps> = ({
  formData,
  setFormData,
  newPin,
  confirmPin,
  pinError,
  setNewPin,
  setConfirmPin,
  setPinError,
  onUpdatePin,
  onSubmit,
  isSaved,
  canUpdateSettings,
  onThemeChange,
  showSaveButton = true
}) => {
  const themeMode = formData.themeMode ?? 'system';
  const securityProfile = formData.securityProfile ?? 'standard';
  const themeOptions = [
    { value: 'system', label: 'System', icon: Monitor, description: 'Match your device' },
    { value: 'light', label: 'Light', icon: Sun, description: 'Bright and clear' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Low glare' }
  ] as const;
  const profileOptions = [
    { value: 'standard', label: 'Standard', description: 'Low-friction defaults for families' },
    { value: 'compliance', label: 'Compliance-ready', description: 'Privacy-first for regulated use' }
  ] as const;

  const applySecurityProfile = (profile: SecurityProfile) => {
    const nextAutoLock = formData.customPinHash ? true : formData.autoLockEnabled;
    setFormData((prev) => ({
      ...prev,
      securityProfile: profile,
      privacyMode: profile === 'compliance',
      autoLockEnabled: nextAutoLock
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800 dark:shadow-none">
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="text-teal-500 dark:text-teal-300" size={20} />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Financial Agreement</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Care Hours Hourly Rate ($)</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">The agreed value for one hour of caregiving work.</p>
            <input
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
              className="bg-white text-slate-900 placeholder:text-slate-400 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:border-slate-800 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800 dark:shadow-none">
        <div className="flex items-center space-x-2 mb-4">
          <UserIcon className="text-teal-500 dark:text-teal-300" size={20} />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Care Recipient</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Patient Name</label>
            <input
              type="text"
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              className="bg-white text-slate-900 placeholder:text-slate-400 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:border-slate-800 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800 dark:shadow-none">
        <div className="flex items-center space-x-2 mb-4">
          <Monitor className="text-teal-500 dark:text-teal-300" size={20} />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Appearance</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Choose how KinCircle looks on this device.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {themeOptions.map(option => {
            const isActive = themeMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const nextMode = option.value as ThemeMode;
                  setFormData((prev) => ({ ...prev, themeMode: nextMode }));
                  onThemeChange?.(nextMode);
                }}
                className={`flex items-center justify-between gap-3 p-3 rounded-lg border text-sm font-medium transition-all duration-200 ease-out ${
                  isActive
                    ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm dark:border-teal-400/70 dark:bg-teal-500/15 dark:text-teal-200'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900/60'
                }`}
                aria-pressed={isActive}
              >
                <span className="flex items-center gap-2">
                  <option.icon size={16} />
                  {option.label}
                </span>
                <span className={`text-xs ${isActive ? 'text-teal-600 dark:text-teal-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Theme changes apply immediately.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800 dark:shadow-none">
        <div className="flex items-center space-x-2 mb-4">
          <Lock className="text-teal-500 dark:text-teal-300" size={20} />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Privacy & Security</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-900 dark:text-slate-100">
              <ShieldCheck size={16} className="text-teal-500 dark:text-teal-300" />
              Security profile
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profileOptions.map((option) => {
                const isActive = securityProfile === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => applySecurityProfile(option.value as SecurityProfile)}
                    className={`flex flex-col gap-1 p-3 rounded-lg border text-sm font-medium transition-all duration-200 ease-out ${
                      isActive
                        ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm dark:border-teal-400/70 dark:bg-teal-500/15 dark:text-teal-200'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/60 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900/70'
                    }`}
                    aria-pressed={isActive}
                  >
                    <span>{option.label}</span>
                    <span className={`text-xs ${isActive ? 'text-teal-600 dark:text-teal-200' : 'text-slate-400 dark:text-slate-500'}`}>
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
            {securityProfile === 'compliance' && !formData.customPinHash && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Compliance-ready works best with a PIN enabled for auto-lock.
              </p>
            )}
          </div>

          <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
            <input
              type="checkbox"
              id="privacyMode"
              checked={formData.privacyMode}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData((prev) => ({
                  ...prev,
                  privacyMode: checked,
                  securityProfile: checked && prev.autoLockEnabled ? 'compliance' : 'standard'
                }));
              }}
              className="mt-1 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
            <div>
              <label htmlFor="privacyMode" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Enhanced Privacy Masking</label>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                When enabled, the app scrubs names, emails, phone numbers, and SSN patterns before sending data to the AI.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
            <input
              type="checkbox"
              id="autoLock"
              checked={formData.autoLockEnabled}
              disabled={!formData.customPinHash}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData((prev) => ({
                  ...prev,
                  autoLockEnabled: checked,
                  securityProfile: prev.privacyMode && checked ? 'compliance' : 'standard'
                }));
              }}
              className="mt-1 w-4 h-4 text-teal-600 rounded focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div>
              <label htmlFor="autoLock" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Auto-Lock Inactivity Timer</label>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Automatically lock the application after 5 minutes of inactivity.
                <span className="text-orange-600 dark:text-amber-300 font-medium ml-1">
                  Disabling this reduces recommended security posture.
                </span>
              </p>
              {!formData.customPinHash && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Set a PIN to enable Auto-Lock.</p>
              )}
            </div>
          </div>

          <div className="p-4 bg-teal-50/80 rounded-lg border border-teal-200 dark:bg-teal-900/20 dark:border-teal-700/40">
            <h4 className="text-sm font-medium text-teal-900 dark:text-teal-100 mb-3">Custom PIN Code</h4>
            <p className="text-xs text-teal-700 dark:text-teal-200 mb-3">
              Set a 4-digit PIN for lock screen authentication and local data encryption.
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
                  className="w-full px-3 py-2 border border-teal-300 rounded-lg text-center text-lg tracking-widest focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:border-teal-700/40"
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
                  className="w-full px-3 py-2 border border-teal-300 rounded-lg text-center text-lg tracking-widest focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:border-teal-700/40"
                />
              </div>
            </div>
            {pinError && <p className="text-xs text-red-600 mt-2">{pinError}</p>}
            <button
              type="button"
              onClick={onUpdatePin}
              disabled={!canUpdateSettings}
              className={`mt-3 w-full inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                canUpdateSettings
                  ? 'border-teal-200 bg-white text-teal-700 hover:bg-teal-50 dark:border-teal-500/30 dark:bg-slate-900/50 dark:text-teal-200 dark:hover:bg-teal-500/10'
                  : 'border-transparent bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
              }`}
            >
              Update PIN
            </button>
            {formData.customPinHash && (
              <p className="text-xs text-green-700 dark:text-green-300 mt-2 flex items-center gap-1">
                <Lock size={12} /> Custom PIN is set
              </p>
            )}
          </div>
        </div>
      </div>

      {showSaveButton && (
        <button
          type="submit"
          disabled={!canUpdateSettings}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
            canUpdateSettings
              ? 'bg-teal-600 text-white hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
          }`}
        >
          {isSaved ? <span>Saved Successfully!</span> : (
            <>
              <Save size={18} />
            <span>Save Changes</span>
            </>
          )}
        </button>
      )}
    </form>
  );
};

export default SettingsForm;
