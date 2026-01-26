import React from 'react';
import {
  Pill,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Medication, MedicationLog } from '../../types';
import { useConfirm } from '../ConfirmDialog';

interface MedicationCardProps {
  medication: Medication;
  todayLog?: MedicationLog;
  recentLogs: MedicationLog[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLog: (status: 'taken' | 'skipped' | 'late') => void;
  onEdit?: () => void;
  onDiscontinue?: () => void;
  onDelete?: () => void;
  canLog: boolean;
}

const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  todayLog,
  recentLogs,
  isExpanded,
  onToggleExpand,
  onLog,
  onEdit,
  onDiscontinue,
  onDelete,
  canLog
}) => {
  const confirm = useConfirm();

  const handleDelete = async () => {
    if (!onDelete) return;
    const ok = await confirm({
      title: 'Delete medication',
      message: `Delete "${medication.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true
    });
    if (ok) onDelete();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Pill size={24} className="text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{medication.name}</p>
              <p className="text-sm text-slate-500">
                {medication.dosage} • {medication.frequency}
              </p>
              {medication.prescribedFor && (
                <p className="text-xs text-slate-400">For: {medication.prescribedFor}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!todayLog ? (
              <div className="flex gap-1">
                <button
                  onClick={() => onLog('taken')}
                  disabled={!canLog}
                  className={`px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg transition-colors flex items-center gap-1 ${canLog ? 'hover:bg-green-200' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <CheckCircle size={14} />
                  Taken
                </button>
                <button
                  onClick={() => onLog('late')}
                  disabled={!canLog}
                  className={`px-3 py-1.5 bg-amber-100 text-amber-700 text-sm rounded-lg transition-colors flex items-center gap-1 ${canLog ? 'hover:bg-amber-200' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <AlertCircle size={14} />
                  Late
                </button>
                <button
                  onClick={() => onLog('skipped')}
                  disabled={!canLog}
                  className={`px-3 py-1.5 bg-slate-100 text-slate-600 text-sm rounded-lg transition-colors ${canLog ? 'hover:bg-slate-200' : 'opacity-60 cursor-not-allowed'}`}
                >
                  Skip
                </button>
              </div>
            ) : (
              <span
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${
                  todayLog.status === 'taken'
                    ? 'bg-green-100 text-green-700'
                    : todayLog.status === 'late'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {todayLog.status === 'taken' && (
                  <>
                    <CheckCircle size={14} /> Taken today
                  </>
                )}
                {todayLog.status === 'late' && (
                  <>
                    <AlertCircle size={14} /> Taken late
                  </>
                )}
                {todayLog.status === 'skipped' && (
                  <>
                    <Clock size={14} /> Skipped today
                  </>
                )}
              </span>
            )}

            <button
              onClick={onToggleExpand}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {medication.pharmacy && (
              <div>
                <p className="text-xs text-slate-500">Pharmacy</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Building2 size={14} /> {medication.pharmacy}
                </p>
              </div>
            )}
            {medication.monthlyCost && (
              <div>
                <p className="text-xs text-slate-500">Monthly Cost</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <DollarSign size={14} /> ${medication.monthlyCost.toFixed(2)}
                </p>
              </div>
            )}
            {medication.refillDate && (
              <div>
                <p className="text-xs text-slate-500">Next Refill</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Calendar size={14} /> {new Date(medication.refillDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {medication.notes && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">{medication.notes}</p>
            </div>
          )}

          {recentLogs.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Last 7 days</p>
              <div className="flex gap-1">
                {recentLogs.map(log => (
                  <div
                    key={log.id}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs ${
                      log.status === 'taken'
                        ? 'bg-green-100 text-green-700'
                        : log.status === 'late'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                    title={`${new Date(log.takenAt).toLocaleDateString()}: ${log.status}`}
                  >
                    {log.status === 'taken' && '✓'}
                    {log.status === 'late' && '!'}
                    {log.status === 'skipped' && '–'}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-slate-600 hover:bg-white rounded-lg transition-colors flex items-center gap-1 text-sm"
              >
                <Edit2 size={14} /> Edit
              </button>
            )}
            {onDiscontinue && (
              <button
                onClick={onDiscontinue}
                className="px-3 py-1.5 text-slate-600 hover:bg-white rounded-lg transition-colors text-sm"
              >
                Discontinue
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationCard;
