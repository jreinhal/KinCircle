import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DangerZoneSectionProps {
  onReset: () => void;
  canReset: boolean;
}

const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({ onReset, canReset }) => {
  return (
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
          onClick={onReset}
          disabled={!canReset}
          className={`flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${canReset ? 'hover:bg-red-100' : 'opacity-50 cursor-not-allowed'}`}
        >
          <Trash2 size={16} />
          <span>Reset Everything</span>
        </button>
      </div>
    </div>
  );
};

export default DangerZoneSection;
