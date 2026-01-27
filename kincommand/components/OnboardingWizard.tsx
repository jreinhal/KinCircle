import React, { useState } from 'react';
import { FamilySettings } from '../types';
import { ArrowRight, Heart, DollarSign, ShieldCheck, CheckCircle2, User } from 'lucide-react';
import { hashPinSecure } from '../utils/crypto';
import { pinSchema } from '../utils/validation';
import { deriveKeyFromPin, generateSaltHex } from '../utils/storageCrypto';
import { getSecurityMeta, updateSecurityMeta } from '../utils/securityMeta';
import { encryptAllLocalStorage, getStorageProvider, refreshEncryptionState, setEncryptionEnabled, setEncryptionKey } from '../services/storageService';

interface OnboardingWizardProps {
  onComplete: (settings: FamilySettings) => void;
  initialSettings?: FamilySettings;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, initialSettings }) => {
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [settings, setSettings] = useState<FamilySettings>({
    patientName: initialSettings?.patientName ?? '',
    hourlyRate: initialSettings?.hourlyRate ?? 25,
    privacyMode: initialSettings?.privacyMode ?? false,
    autoLockEnabled: initialSettings?.autoLockEnabled ?? true,
    hasCompletedOnboarding: true,
    customPinHash: initialSettings?.customPinHash,
    isSecurePinHash: initialSettings?.isSecurePinHash,
    familyId: initialSettings?.familyId,
    securityProfile: initialSettings?.securityProfile ?? 'standard',
    themeMode: initialSettings?.themeMode ?? 'system'
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const finish = async () => {
    setIsFinishing(true);
    setPinError('');

    try {
      if (!settings.customPinHash) {
        const pinValidation = pinSchema.safeParse(pin);
        if (!pinValidation.success) {
          setPinError(pinValidation.error.errors[0]?.message || 'Invalid PIN');
          return;
        }
        if (pin !== confirmPin) {
          setPinError('PINs do not match');
          return;
        }

        const secureHash = await hashPinSecure(pin);
        const updatedSettings = {
          ...settings,
          customPinHash: secureHash,
          isSecurePinHash: true
        };

        // Enable encryption at rest for local storage
        if (getStorageProvider() === 'local') {
          const meta = getSecurityMeta();
          const saltHex = meta.saltHex || generateSaltHex();
          const key = await deriveKeyFromPin(pin, saltHex);

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

        onComplete(updatedSettings);
        return;
      }

      onComplete(settings);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 animate-fade-in">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10">
          {/* Progress Bar */}
          <div className="h-1 bg-slate-100 w-full">
            <div
              className="h-full bg-teal-600 transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

        <div className="p-8 md:p-12">

          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="animate-fade-in text-center space-y-6">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto text-teal-600 mb-6">
                <Heart size={40} fill="currentColor" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome to KinCircle</h1>
              <p className="text-slate-500 text-lg leading-relaxed">
                Caregiving is hard work—but it doesn't have to be lonely. We help you track expenses, recognize everyone's effort, and keep your family on the same page.
              </p>
              <div className="pt-6">
                <button
                  onClick={nextStep}
                  className="btn-primary w-full py-4 text-lg rounded-xl transition-transform active:scale-95"
                >
                  Let's Get Started <ArrowRight className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PATIENT INFO */}
          {step === 2 && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Who are we caring for?</h2>
                <p className="text-slate-500">This helps us personalize your reports and AI insights.</p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Care Recipient Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Mom, Dad, Aunt Marie"
                    value={settings.patientName}
                    onChange={(e) => {
                      const value = e.target.value;
                      const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
                      setSettings({ ...settings, patientName: capitalized });
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-white text-slate-900 placeholder:text-slate-400 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:ring-0 outline-none text-lg transition-colors"
                  />
                </div>
              </div>

              <div className="pt-8 flex space-x-4">
                <button onClick={prevStep} className="btn-muted flex-1 py-3 rounded-xl">Back</button>
                <button
                  onClick={nextStep}
                  disabled={!settings.patientName.trim()}
                  className="btn-primary flex-1 py-3 rounded-xl disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FINANCIAL AGREEMENT */}
          {step === 3 && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Value Your Time</h2>
                <p className="text-slate-500">
                  Care hours are time spent caregiving. Set an hourly rate to ensure fairness—even if no money changes hands.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">Hourly Rate ($)</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSettings({ ...settings, hourlyRate: Math.max(0, settings.hourlyRate - 5) })}
                    className="btn-muted w-10 h-10 p-0"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-bold text-slate-900">${settings.hourlyRate}</span>
                    <span className="text-slate-500">/hr</span>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, hourlyRate: settings.hourlyRate + 5 })}
                    className="btn-muted w-10 h-10 p-0"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-8 flex space-x-4">
                <button onClick={prevStep} className="btn-muted flex-1 py-3 rounded-xl">Back</button>
                <button onClick={nextStep} className="btn-primary flex-1 py-3 rounded-xl">
                  Looks Good
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SECURITY */}
        {step === 4 && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Stay Secure</h2>
                <p className="text-slate-500">
                  We recommend enabling Auto-Lock to follow healthcare privacy best practices.
                </p>
              </div>

              <div className="space-y-4">
                <div
                  onClick={() => setSettings({ ...settings, autoLockEnabled: !settings.autoLockEnabled })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${settings.autoLockEnabled ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'
                    }`}
                >
                  <div>
                    <h3 className="font-bold text-slate-900">Enable Auto-Lock</h3>
                    <p className="text-xs text-slate-500">Locks app after 5 minutes of inactivity</p>
                  </div>
                  {settings.autoLockEnabled && <CheckCircle2 className="text-teal-600" size={24} />}
                </div>

                <div
                  onClick={() => setSettings({ ...settings, privacyMode: !settings.privacyMode })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${settings.privacyMode ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'
                    }`}
                >
                  <div>
                    <h3 className="font-bold text-slate-900">AI Privacy Mode</h3>
                    <p className="text-xs text-slate-500">Anonymize names before AI processing</p>
                  </div>
                  {settings.privacyMode && <CheckCircle2 className="text-teal-600" size={24} />}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">Set Your Security PIN</h3>
                <p className="text-xs text-slate-500 mb-3">Required to unlock the app and encrypt local data.</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="PIN"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setPinError('');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center text-lg tracking-widest focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Confirm"
                    value={confirmPin}
                    onChange={(e) => {
                      setConfirmPin(e.target.value.replace(/\D/g, ''));
                      setPinError('');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center text-lg tracking-widest focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                {pinError && <p className="text-xs text-red-600 mt-2">{pinError}</p>}
              </div>

              <div className="pt-8 flex space-x-4">
                <button onClick={prevStep} className="btn-muted flex-1 py-3 rounded-xl">Back</button>
                <button
                  onClick={finish}
                  disabled={isFinishing}
                  className="btn-primary flex-1 py-3 rounded-xl shadow-lg shadow-teal-900/20 disabled:opacity-60"
                >
                  {isFinishing ? 'Saving...' : 'Finish Setup'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
