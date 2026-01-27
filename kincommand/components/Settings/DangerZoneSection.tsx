import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DangerZoneSectionProps {
  onReset: () => void;
  canReset: boolean;
  compact?: boolean;
}

const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({ onReset, canReset, compact = false }) => {
  return (
    <div className={compact ? '' : 'mt-8 pt-8 border-t border-slate-200 dark:border-slate-800'}>
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 dark:text-slate-400">Danger Zone</h3>

      <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 dark:bg-red-900/20 dark:border-red-700/40">
        <div>
          <div className="flex items-center space-x-2 text-red-800 dark:text-red-200 mb-1">
            <AlertTriangle size={18} />
            <h4 className="font-semibold">Reset Application Data</h4>
          </div>
          <p className="text-sm text-red-600 dark:text-red-200/80">
            This will permanently delete all local entries and settings. The app will revert to the default demo state.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
            canReset
              ? 'border-red-200 bg-white text-red-600 hover:bg-red-100 dark:border-red-500/40 dark:bg-slate-900/60 dark:text-red-200 dark:hover:bg-red-500/10'
              : 'border-transparent bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
          }`}
        >
          <Trash2 size={16} />
          <span>Reset Everything</span>
        </button>
      </div>
    </div>
  );
};

export default DangerZoneSection;
