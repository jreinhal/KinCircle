import React from 'react';
import { Cloud, Share2, Download, Upload } from 'lucide-react';

interface DataSyncSectionProps {
  onCloudSync: () => void;
  onExport: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  canExport: boolean;
  canImport: boolean;
  compact?: boolean;
}

const DataSyncSection: React.FC<DataSyncSectionProps> = ({
  onCloudSync,
  onExport,
  onImportFile,
  fileInputRef,
  canExport,
  canImport,
  compact = false
}) => {
  return (
    <div className={compact ? 'space-y-6' : 'mt-8 pt-8 border-t border-slate-200 dark:border-slate-800'}>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 dark:bg-slate-900/60 dark:border-slate-800 dark:shadow-none">
        <div className="flex items-center space-x-2 mb-4">
          <Cloud className="text-teal-500 dark:text-teal-300" size={24} />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Cloud Sync (Beta)</h3>
        </div>

        <div className="p-4 bg-teal-50/80 rounded-lg border border-teal-200 dark:bg-teal-900/20 dark:border-teal-700/40">
          <p className="text-sm text-teal-900 dark:text-teal-100 mb-3">
            One-way migration of local data to the cloud. Ongoing sync is manual until automated sync ships.
          </p>
          <button
            type="button"
            onClick={onCloudSync}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 bg-teal-600 text-white hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400"
          >
            <Cloud className="w-4 h-4" />
            <span>Sync Local Data to Cloud</span>
          </button>
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 dark:text-slate-400">Manual Data Sync</h3>

      <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-5 dark:bg-slate-900/60 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-teal-900 dark:text-teal-100 mb-2">
          <Share2 size={18} />
          <h4 className="font-semibold">Share Ledger with Family</h4>
        </div>
        <p className="text-sm text-teal-700 dark:text-teal-200 mb-4">
          To sync data between devices without a cloud server, export your data and send the file to your family members to import.
        </p>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onExport}
            disabled={!canExport}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
              canExport
                ? 'border-teal-200 bg-white text-teal-700 hover:bg-teal-50 dark:border-teal-500/30 dark:bg-slate-900/50 dark:text-teal-200 dark:hover:bg-teal-500/10'
                : 'border-transparent bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            <Download size={16} />
            <span>Export Backup</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canImport}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
              canImport
                ? 'bg-teal-600 text-white hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            <Upload size={16} />
            <span>Import Backup</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={onImportFile}
          />
        </div>
      </div>
    </div>
  );
};

export default DataSyncSection;
