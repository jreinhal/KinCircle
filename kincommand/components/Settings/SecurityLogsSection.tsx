import React from 'react';
import { Activity } from 'lucide-react';
import { SecurityEvent } from '../../types';

interface SecurityLogsSectionProps {
  securityLogs: SecurityEvent[];
  canView: boolean;
}

const SecurityLogsSection: React.FC<SecurityLogsSectionProps> = ({ securityLogs, canView }) => {
  if (!canView) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-500 mt-8">
        You do not have permission to view the security audit trail.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-slate-300 rounded-xl overflow-hidden border border-slate-800 shadow-lg mt-8">
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Activity size={18} className="text-blue-400" />
          <h3 className="font-mono text-sm font-bold text-white">Security Audit Trail</h3>
        </div>
        <div className="text-xs text-slate-500 font-mono">Append-only</div>
      </div>
      <div className="p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-2">
        {securityLogs.length === 0 && <span className="text-slate-600 italic">No events logged yet.</span>}
        {[...securityLogs].reverse().map((log) => (
          <div key={log.id} className="flex gap-4 border-l-2 border-slate-700 pl-3 py-1">
            <span className="text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <div className="flex-1">
              <span className={`font-bold mr-2 ${log.severity === 'CRITICAL' ? 'text-red-500' :
                log.severity === 'WARNING' ? 'text-yellow-500' : 'text-blue-400'
                }`}>
                [{log.type}]
              </span>
              <span>{log.details}</span>
              <span className="text-slate-600 ml-2">({log.user})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityLogsSection;
