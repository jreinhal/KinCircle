import React from 'react';
import { Shield } from 'lucide-react';

const SettingsHeader: React.FC = () => {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Family Configuration</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage rates, privacy, and care details.</p>
      </header>

      <details className="bg-orange-50/70 border border-orange-200/70 rounded-xl p-3 sm:p-4 transition-colors dark:bg-orange-900/20 dark:border-orange-700/40">
        <summary className="cursor-pointer list-none flex items-start justify-between gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/30">
          <div className="flex items-start space-x-3">
            <Shield className="text-orange-600 dark:text-orange-300 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-orange-900 dark:text-orange-100">Prototype Compliance Notice</h3>
              <p className="text-xs text-orange-800 dark:text-orange-200 mt-1">This app stores data locally and is not HIPAA compliant.</p>
            </div>
          </div>
          <span className="text-xs text-orange-700 dark:text-orange-200">Learn more</span>
        </summary>
        <p className="text-xs text-orange-800 dark:text-orange-200 mt-3 ml-7 leading-relaxed">
          This application uses <strong>Local Storage</strong> and is NOT currently HIPAA compliant for real-world medical data storage.
          Do not store sensitive SSNs or detailed medical histories without an Enterprise upgrade.
        </p>
      </details>
    </>
  );
};

export default SettingsHeader;
