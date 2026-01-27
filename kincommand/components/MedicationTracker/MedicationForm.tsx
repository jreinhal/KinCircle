import React from 'react';

export type MedicationFormState = {
  name: string;
  dosage: string;
  frequency: string;
  prescribedFor: string;
  pharmacy: string;
  monthlyCost: string;
  notes: string;
};

interface MedicationFormProps {
  form: MedicationFormState;
  editingId: string | null;
  onChange: (next: MedicationFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const MedicationForm: React.FC<MedicationFormProps> = ({
  form,
  editingId,
  onChange,
  onSubmit,
  onCancel
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-900 mb-4">
        {editingId ? 'Edit Medication' : 'Add New Medication'}
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Medication Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              placeholder="e.g., Lisinopril"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dosage <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.dosage}
              onChange={(e) => onChange({ ...form, dosage: e.target.value })}
              placeholder="e.g., 10mg, 1 tablet"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Frequency
            </label>
            <select
              value={form.frequency}
              onChange={(e) => onChange({ ...form, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option>Once daily</option>
              <option>Twice daily</option>
              <option>Three times daily</option>
              <option>Four times daily</option>
              <option>Every other day</option>
              <option>Weekly</option>
              <option>As needed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Prescribed For
            </label>
            <input
              type="text"
              value={form.prescribedFor}
              onChange={(e) => onChange({ ...form, prescribedFor: e.target.value })}
              placeholder="e.g., Blood pressure"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pharmacy
            </label>
            <input
              type="text"
              value={form.pharmacy}
              onChange={(e) => onChange({ ...form, pharmacy: e.target.value })}
              placeholder="e.g., CVS, Walgreens"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Monthly Cost
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.monthlyCost}
                onChange={(e) => onChange({ ...form, monthlyCost: e.target.value })}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
              placeholder="e.g., Take with food, don't take with grapefruit..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="btn-primary"
          >
            {editingId ? 'Save Changes' : 'Add Medication'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicationForm;
