import React from 'react';
import { Shield } from 'lucide-react';

const SettingsHeader: React.FC = () => {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Family Configuration</h1>
        <p className="text-slate-500">Manage rates, privacy, and care details.</p>
      </header>

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
    </>
  );
};

export default SettingsHeader;
