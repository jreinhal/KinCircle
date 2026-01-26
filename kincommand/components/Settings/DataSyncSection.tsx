import React from 'react';
import { Cloud, Share2, Download, Upload } from 'lucide-react';

interface DataSyncSectionProps {
  onCloudSync: () => void;
  onExport: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  canExport: boolean;
  canImport: boolean;
}

const DataSyncSection: React.FC<DataSyncSectionProps> = ({
  onCloudSync,
  onExport,
  onImportFile,
  fileInputRef,
  canExport,
  canImport
}) => {
  return (
    <div className="mt-8 pt-8 border-t border-slate-200">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Cloud className="text-indigo-500" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Cloud Sync (Beta)</h3>
        </div>

        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-sm text-indigo-900 mb-3">
            One-way migration of local data to the cloud. Ongoing sync is manual until automated sync ships.
          </p>
          <button
            type="button"
            onClick={onCloudSync}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Cloud className="w-4 h-4" />
            <span>Sync Local Data to Cloud</span>
          </button>
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Manual Data Sync</h3>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <div className="flex items-center space-x-2 text-indigo-900 mb-2">
          <Share2 size={18} />
          <h4 className="font-semibold">Share Ledger with Family</h4>
        </div>
        <p className="text-sm text-indigo-700 mb-4">
          To sync data between devices without a cloud server, export your data and send the file to your family members to import.
        </p>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onExport}
            disabled={!canExport}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            <Download size={16} />
            <span>Export Backup</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canImport}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
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
