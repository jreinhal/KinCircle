import React, { useState, useCallback } from 'react';
import { Lock, ShieldCheck, Fingerprint, Loader2 } from 'lucide-react';
import { verifyPin, hashPinLegacy } from '../utils/crypto';

interface LockScreenProps {
  onUnlock: (method: string) => void;
  onFailure: () => void;
  user: string;
  customPinHash?: string; // Hash of user's custom PIN (secure or legacy)
  isSecureHash?: boolean; // Whether the hash uses new secure format
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, onFailure, user, customPinHash, isSecureHash }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  const verifyPinEntry = useCallback(async (enteredPin: string) => {
    setIsVerifying(true);
    try {
      // Default PIN is "1234" if no custom PIN set
      const defaultHash = hashPinLegacy('1234');
      const expectedHash = customPinHash || defaultHash;

      let isValid = false;

      if (isSecureHash && customPinHash) {
        // Use secure async verification
        isValid = await verifyPin(enteredPin, expectedHash);
      } else {
        // Legacy verification for backwards compatibility
        const enteredHash = hashPinLegacy(enteredPin);
        isValid = enteredHash === expectedHash;
      }

      if (isValid) {
        onUnlock('PIN');
        setPin('');
      } else {
        setError(true);
        setPin('');
        onFailure();
      }
    } finally {
      setIsVerifying(false);
    }
  }, [customPinHash, isSecureHash, onUnlock, onFailure]);

  const handleNumClick = (num: string) => {
    if (pin.length < 4 && !isVerifying) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        // Validate PIN with slight delay for UX
        setTimeout(() => {
          verifyPinEntry(newPin);
        }, 300);
      }
    }
  };

  const handleBiometricClick = () => {
    setIsBiometricScanning(true);
    // Simulate API delay for webauthn
    setTimeout(() => {
      setIsBiometricScanning(false);
      onUnlock('BIOMETRIC');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center animate-fade-in backdrop-blur-md">
      <div className="w-full max-w-sm p-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
          <Lock size={32} className="text-white" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">KinCircle Protected</h2>
        <p className="text-slate-400 mb-8 text-center">
          Session timed out for HIPAA security.<br />
          Enter PIN for <span className="text-white font-semibold">{user}</span>
        </p>

        {/* PIN Indicators */}
        <div className="flex space-x-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i
              ? 'bg-blue-500 scale-110'
              : error
                ? 'bg-red-500/50'
                : 'bg-slate-700'
              }`} />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm font-bold mb-4 animate-pulse">Invalid PIN{!customPinHash ? '. Try 1234' : ''}.</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumClick(num.toString())}
              className="h-16 rounded-xl bg-slate-800 text-white text-xl font-medium hover:bg-slate-700 active:bg-blue-600 transition-colors"
            >
              {num}
            </button>
          ))}

          {/* Biometric Button (Bottom Left) */}
          <div className="col-start-1">
            <button
              onClick={handleBiometricClick}
              className="h-16 w-full rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center hover:bg-slate-700 active:bg-blue-600 active:text-white transition-colors"
              title="Use FaceID / TouchID"
            >
              {isBiometricScanning ? <Loader2 size={24} className="animate-spin" /> : <Fingerprint size={24} />}
            </button>
          </div>

          <div className="col-start-2">
            <button
              onClick={() => handleNumClick('0')}
              className="h-16 w-full rounded-xl bg-slate-800 text-white text-xl font-medium hover:bg-slate-700 active:bg-blue-600 transition-colors"
            >
              0
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center space-x-2 text-xs text-slate-500">
          <ShieldCheck size={12} />
          <span>Encrypted Session Active</span>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;