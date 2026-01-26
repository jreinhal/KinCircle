import React from 'react';
import { DollarSign, User as UserIcon, Lock, Save } from 'lucide-react';
import { FamilySettings } from '../../types';

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
  canUpdateSettings
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="text-blue-500" size={20} />
          <h2 className="text-lg font-semibold text-slate-800">Financial Agreement</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Care Hours Hourly Rate ($)</label>
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
              onChange={(e) => {
                if (e.target.checked && !formData.customPinHash) {
                  alert('Please set a PIN before enabling Auto-Lock.');
                  return;
                }
                setFormData({ ...formData, autoLockEnabled: e.target.checked });
              }}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <label htmlFor="autoLock" className="block text-sm font-medium text-slate-900">Auto-Lock Inactivity Timer</label>
              <p className="text-sm text-slate-500 mt-1">
                Automatically lock the application after 60 seconds of inactivity.
                <span className="text-orange-600 font-medium ml-1">
                  Disabling this reduces recommended security posture.
                </span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Custom PIN Code</h4>
            <p className="text-xs text-blue-700 mb-3">
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
              onClick={onUpdatePin}
              disabled={!canUpdateSettings}
              className={`mt-3 w-full px-4 py-2 text-sm rounded-lg transition-colors ${canUpdateSettings ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
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
        disabled={!canUpdateSettings}
        className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors shadow-lg ${canUpdateSettings ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
      >
        {isSaved ? <span>Saved Successfully!</span> : (
          <>
            <Save size={18} />
            <span>Save Configuration</span>
          </>
        )}
      </button>
    </form>
  );
};

export default SettingsForm;
