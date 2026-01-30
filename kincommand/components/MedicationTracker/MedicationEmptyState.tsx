import React from 'react';
import { Pill, Plus } from 'lucide-react';
import { FamilySettings } from '../../types';

interface MedicationEmptyStateProps {
  settings: FamilySettings;
  canAdd: boolean;
  onAdd: () => void;
}

const MedicationEmptyState: React.FC<MedicationEmptyStateProps> = ({ settings, canAdd, onAdd }) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
      <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Pill size={32} className="text-teal-600" />
      </div>
      <h3 className="font-semibold text-slate-900 mb-2">Track Medications</h3>
      <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">
        Keep a list of {settings.patientName || 'your loved one'}&apos;s medications,
        track costs, and never miss a dose.
      </p>
      <button
        onClick={onAdd}
        disabled={!canAdd}
        className={`btn-primary ${canAdd ? '' : 'opacity-50 cursor-not-allowed'}`}
      >
        <Plus size={18} />
        Add First Medication
      </button>
    </div>
  );
};

export default MedicationEmptyState;
