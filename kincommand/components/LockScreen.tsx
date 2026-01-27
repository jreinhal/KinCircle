import React, { useState, useCallback } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { verifyPin, hashPinLegacy } from '../utils/crypto';

interface LockScreenProps {
  onUnlock: (method: string, pin?: string) => void;
  onFailure: () => void;
  user: string;
  customPinHash?: string; // Hash of user's custom PIN (secure or legacy)
  isSecureHash?: boolean; // Whether the hash uses new secure format
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, onFailure, user, customPinHash, isSecureHash }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const isLockedOut = lockoutUntil !== null && now < lockoutUntil;
  const lockoutSeconds = lockoutUntil ? Math.max(0, Math.ceil((lockoutUntil - now) / 1000)) : 0;

  const verifyPinEntry = useCallback(async (enteredPin: string) => {
    if (isLockedOut) return;
    setIsVerifying(true);
    try {
      if (!customPinHash) {
        setError(true);
        onFailure();
        return;
      }

      const expectedHash = customPinHash;

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
        setFailedAttempts(0);
        setLockoutUntil(null);
        onUnlock('PIN', enteredPin);
        setPin('');
      } else {
        setError(true);
        setPin('');
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 3) {
          const backoffSeconds = Math.min(60, Math.pow(2, nextAttempts - 3));
          setLockoutUntil(Date.now() + backoffSeconds * 1000);
        }
        onFailure();
      }
    } finally {
      setIsVerifying(false);
    }
  }, [customPinHash, isSecureHash, onUnlock, onFailure, failedAttempts, isLockedOut]);

  const handleNumClick = (num: string) => {
    if (pin.length < 4 && !isVerifying && !isLockedOut) {
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

  React.useEffect(() => {
    if (!lockoutUntil) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center animate-fade-in backdrop-blur-md">
      <div className="w-full max-w-sm p-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/20">
          <Lock size={32} className="text-white" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">KinCircle Protected</h2>
        <p className="text-slate-400 mb-8 text-center">
          Session timed out for security.<br />
          Enter PIN for <span className="text-white font-semibold">{user}</span>
        </p>

        {/* PIN Indicators */}
        <div className="flex space-x-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i
              ? 'bg-teal-500 scale-110'
              : error
                ? 'bg-red-500/50'
                : 'bg-slate-700'
              }`} />
          ))}
        </div>

        {error && !isLockedOut && (
          <p className="text-red-500 text-sm font-bold mb-4 animate-pulse">Invalid PIN.</p>
        )}
        {isLockedOut && (
          <p className="text-orange-400 text-sm font-bold mb-4">
            Too many attempts. Try again in {lockoutSeconds}s.
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumClick(num.toString())}
              className="h-16 rounded-xl bg-slate-800 text-white text-xl font-medium hover:bg-slate-700 active:bg-teal-600 transition-colors"
            >
              {num}
            </button>
          ))}

          <div className="col-start-2">
            <button
              onClick={() => handleNumClick('0')}
              className="h-16 w-full rounded-xl bg-slate-800 text-white text-xl font-medium hover:bg-slate-700 active:bg-teal-600 transition-colors"
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
