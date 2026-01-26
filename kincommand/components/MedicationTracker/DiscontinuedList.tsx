import React from 'react';
import { Pill } from 'lucide-react';
import { Medication } from '../../types';

interface DiscontinuedListProps {
  medications: Medication[];
  onReactivate?: (medication: Medication) => void;
}

const DiscontinuedList: React.FC<DiscontinuedListProps> = ({ medications, onReactivate }) => {
  if (medications.length === 0) return null;

  return (
    <details className="group">
      <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-700">
        Discontinued ({medications.length})
      </summary>
      <div className="mt-3 space-y-2">
        {medications.map(med => (
          <div
            key={med.id}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 opacity-60"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pill size={20} className="text-slate-400" />
                <div>
                  <p className="font-medium text-slate-600">{med.name}</p>
                  <p className="text-sm text-slate-400">{med.dosage} • {med.frequency}</p>
                </div>
              </div>
              {onReactivate && (
                <button
                  onClick={() => onReactivate({ ...med, isActive: true })}
                  className="px-3 py-1 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
};

export default DiscontinuedList;
