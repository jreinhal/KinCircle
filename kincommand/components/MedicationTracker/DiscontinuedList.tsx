import React, { useState } from 'react';
import { Pill, ChevronDown } from 'lucide-react';
import { Medication } from '../../types';

interface DiscontinuedListProps {
  medications: Medication[];
  onReactivate?: (medication: Medication) => void;
}

const DiscontinuedList: React.FC<DiscontinuedListProps> = ({ medications, onReactivate }) => {
  if (medications.length === 0) return null;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="discontinued-medications"
        className="w-full flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2 text-left transition-colors hover:bg-white/70 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900/80"
      >
        <div>
          <p className="text-sm font-semibold text-slate-800">Discontinued</p>
          <p className="text-xs text-slate-500">{medications.length} inactive meds</p>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id="discontinued-medications"
        className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'max-h-[520px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
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
      </div>
    </div>
  );
};

export default DiscontinuedList;
