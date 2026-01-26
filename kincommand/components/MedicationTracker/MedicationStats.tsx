import React from 'react';
import { Pill, DollarSign, AlertCircle } from 'lucide-react';

interface MedicationStatsProps {
  activeCount: number;
  totalMonthlyCost: number;
  refillsDueSoonCount: number;
}

const MedicationStats: React.FC<MedicationStatsProps> = ({
  activeCount,
  totalMonthlyCost,
  refillsDueSoonCount
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <Pill size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
            <p className="text-sm text-slate-500">Active Medications</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">${totalMonthlyCost.toFixed(0)}</p>
            <p className="text-sm text-slate-500">Monthly Cost</p>
          </div>
        </div>
      </div>
      {refillsDueSoonCount > 0 && (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{refillsDueSoonCount}</p>
              <p className="text-sm text-amber-600">Refills Due Soon</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationStats;
