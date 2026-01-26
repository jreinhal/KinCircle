import React, { useState } from 'react';
import { MedicaidReportItem } from '../types';
import { analyzeLedgerForMedicaid } from '../services/geminiService';
import { ShieldAlert, CheckCircle, AlertTriangle, Loader2, FileCheck } from 'lucide-react';
import { useEntriesStore } from '../hooks/useEntriesStore';
import { useSettingsStore } from '../hooks/useSettingsStore';

const MedicaidReport: React.FC = () => {
  const { entries } = useEntriesStore();
  const { settings } = useSettingsStore();
  const [report, setReport] = useState<MedicaidReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runAnalysis = async () => {
    setIsLoading(true);
    const results = await analyzeLedgerForMedicaid(entries, settings);
    setReport(results);
    setIsLoading(false);
    setHasRun(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return <CheckCircle className="text-green-500" size={20} />;
      case 'WARNING': return <ShieldAlert className="text-red-500" size={20} />;
      default: return <AlertTriangle className="text-yellow-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'bg-green-50 text-green-700 border-green-200';
      case 'WARNING': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Medicaid Look-Back Auditor</h1>
        <p className="text-slate-500 mt-2">
          AI analysis of your ledger to identify potential "Gift" classifications vs. legitimate "Care Services" for the 5-year look-back period.
        </p>
        {settings.privacyMode && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
            <ShieldAlert size={12} className="mr-1" />
            Privacy Mode Active: Names Scrubbed
          </span>
        )}
      </header>

      {!hasRun && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
          <ShieldAlert size={48} className="mx-auto text-blue-500 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Ready to Audit?</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            We will send your {settings.privacyMode ? 'anonymized' : ''} transaction descriptions to Gemini AI to categorize them according to standard elder law principles.
          </p>
          <button
            onClick={runAnalysis}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Analyzing Ledger...
              </>
            ) : (
              'Run AI Compliance Check'
            )}
          </button>
        </div>
      )}

      {hasRun && (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
                 <div>
                    <h3 className="font-semibold text-slate-800">Audit Complete</h3>
                    <p className="text-sm text-slate-500">{report.filter(r => r.status === 'COMPLIANT').length} compliant, {report.filter(r => r.status === 'WARNING').length} warnings found.</p>
                 </div>
                 <button onClick={runAnalysis} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Re-run</button>
            </div>

          <div className="grid gap-4">
            {report.map((item, idx) => {
              const entry = entries.find(e => e.id === item.entryId);
              if (!entry) return null;

              return (
                <div key={idx} className={`p-4 rounded-lg border flex flex-col md:flex-row gap-4 md:items-start bg-white ${item.status === 'WARNING' ? 'border-red-200 shadow-sm' : 'border-slate-100'}`}>
                  <div className="mt-1 flex-shrink-0">
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-medium text-slate-900">{entry.description}</h4>
                            <span className="text-xs text-slate-400">{entry.date} • ${entry.amount.toFixed(2)}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(item.status)}`}>
                            {item.status}
                        </span>
                    </div>
                    
                    <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
                      <span className="font-semibold">AI Reason:</span> {item.reason}
                    </p>
                    
                    {item.status !== 'COMPLIANT' && (
                        <div className="mt-2 text-xs text-slate-500">
                             Suggested Action: Clarify if this was for fair market value or obtain a receipt proving it was for the elder's sole benefit.
                        </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicaidReport;
