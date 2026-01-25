import React, { useState } from 'react';
import {
  Pill, Plus, Edit2, Trash2, Calendar, DollarSign,
  AlertCircle, CheckCircle, Clock, Building2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Medication, MedicationLog, FamilySettings } from '../types';

interface MedicationTrackerProps {
  medications: Medication[];
  medicationLogs: MedicationLog[];
  settings: FamilySettings;
  onAddMedication: (med: Medication) => void;
  onUpdateMedication: (med: Medication) => void;
  onDeleteMedication: (id: string) => void;
  onLogMedication: (log: MedicationLog) => void;
}

const MedicationTracker: React.FC<MedicationTrackerProps> = ({
  medications,
  medicationLogs,
  settings,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
  onLogMedication
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    prescribedFor: '',
    pharmacy: '',
    monthlyCost: '',
    notes: ''
  });

  const resetForm = () => {
    setForm({
      name: '',
      dosage: '',
      frequency: 'Once daily',
      prescribedFor: '',
      pharmacy: '',
      monthlyCost: '',
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.dosage) return;

    if (editingId) {
      const existing = medications.find(m => m.id === editingId);
      if (existing) {
        onUpdateMedication({
          ...existing,
          name: form.name,
          dosage: form.dosage,
          frequency: form.frequency,
          prescribedFor: form.prescribedFor || undefined,
          pharmacy: form.pharmacy || undefined,
          monthlyCost: form.monthlyCost ? parseFloat(form.monthlyCost) : undefined,
          notes: form.notes || undefined
        });
      }
    } else {
      const newMed: Medication = {
        id: crypto.randomUUID(),
        name: form.name,
        dosage: form.dosage,
        frequency: form.frequency,
        prescribedFor: form.prescribedFor || undefined,
        pharmacy: form.pharmacy || undefined,
        monthlyCost: form.monthlyCost ? parseFloat(form.monthlyCost) : undefined,
        notes: form.notes || undefined,
        isActive: true
      };
      onAddMedication(newMed);
    }

    // Clean up all form state together
    setEditingId(null);
    setIsAdding(false);
    setExpandedId(null);
    resetForm();
  };

  const startEdit = (med: Medication) => {
    setForm({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      prescribedFor: med.prescribedFor || '',
      pharmacy: med.pharmacy || '',
      monthlyCost: med.monthlyCost?.toString() || '',
      notes: med.notes || ''
    });
    setEditingId(med.id);
    setIsAdding(true);
  };

  const handleLogTaken = (medId: string, status: 'taken' | 'skipped') => {
    const log: MedicationLog = {
      id: crypto.randomUUID(),
      medicationId: medId,
      takenAt: new Date().toISOString(),
      status
    };
    onLogMedication(log);
  };

  const getRecentLogs = (medId: string) => {
    return medicationLogs
      .filter(l => l.medicationId === medId)
      .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())
      .slice(0, 7);
  };

  const getTodayLog = (medId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return medicationLogs.find(
      l => l.medicationId === medId && l.takenAt.startsWith(today)
    );
  };

  const activeMeds = medications.filter(m => m.isActive);
  const inactiveMeds = medications.filter(m => !m.isActive);

  // Calculate monthly cost total
  const totalMonthlyCost = activeMeds.reduce((sum, m) => sum + (m.monthlyCost || 0), 0);

  // Check for refills due soon (within 7 days)
  const refillsDueSoon = activeMeds.filter(m => {
    if (!m.refillDate) return false;
    const refillDate = new Date(m.refillDate);
    const today = new Date();
    const diffDays = Math.ceil((refillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Medications</h2>
          <p className="text-slate-500 text-sm mt-1">
            Track {settings.patientName || 'your loved one'}'s medications and costs
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={18} />
            Add Medication
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Pill size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeMeds.length}</p>
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
        {refillsDueSoon.length > 0 && (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{refillsDueSoon.length}</p>
                <p className="text-sm text-amber-600">Refills Due Soon</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">
            {editingId ? 'Edit Medication' : 'Add New Medication'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Medication Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, prescribedFor: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, pharmacy: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, monthlyCost: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g., Take with food, don't take with grapefruit..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                {editingId ? 'Save Changes' : 'Add Medication'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medication List */}
      {activeMeds.length > 0 && (
        <div className="space-y-3">
          {activeMeds.map(med => {
            const todayLog = getTodayLog(med.id);
            const recentLogs = getRecentLogs(med.id);
            const isExpanded = expandedId === med.id;

            return (
              <div
                key={med.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
              >
                {/* Main Row */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Pill size={24} className="text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{med.name}</p>
                        <p className="text-sm text-slate-500">
                          {med.dosage} • {med.frequency}
                        </p>
                        {med.prescribedFor && (
                          <p className="text-xs text-slate-400">For: {med.prescribedFor}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Today's Status */}
                      {!todayLog ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleLogTaken(med.id, 'taken')}
                            className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle size={14} />
                            Taken
                          </button>
                          <button
                            onClick={() => handleLogTaken(med.id, 'skipped')}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            Skip
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${
                          todayLog.status === 'taken'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {todayLog.status === 'taken' ? (
                            <><CheckCircle size={14} /> Taken today</>
                          ) : (
                            <><Clock size={14} /> Skipped today</>
                          )}
                        </span>
                      )}

                      {/* Expand/Actions */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : med.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {med.pharmacy && (
                        <div>
                          <p className="text-xs text-slate-500">Pharmacy</p>
                          <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                            <Building2 size={14} /> {med.pharmacy}
                          </p>
                        </div>
                      )}
                      {med.monthlyCost && (
                        <div>
                          <p className="text-xs text-slate-500">Monthly Cost</p>
                          <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                            <DollarSign size={14} /> ${med.monthlyCost.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {med.refillDate && (
                        <div>
                          <p className="text-xs text-slate-500">Next Refill</p>
                          <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                            <Calendar size={14} /> {new Date(med.refillDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {med.notes && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">{med.notes}</p>
                      </div>
                    )}

                    {/* Recent Log History */}
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
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                              title={`${new Date(log.takenAt).toLocaleDateString()}: ${log.status}`}
                            >
                              {log.status === 'taken' ? '✓' : '–'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(med)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => onUpdateMedication({ ...med, isActive: false })}
                        className="px-3 py-1.5 text-slate-600 hover:bg-white rounded-lg transition-colors text-sm"
                      >
                        Discontinue
                      </button>
                      <button
                        onClick={() => onDeleteMedication(med.id)}
                        className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Discontinued Medications */}
      {inactiveMeds.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-700">
            Discontinued ({inactiveMeds.length})
          </summary>
          <div className="mt-3 space-y-2">
            {inactiveMeds.map(med => (
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
                  <button
                    onClick={() => onUpdateMedication({ ...med, isActive: true })}
                    className="px-3 py-1 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    Reactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Empty State */}
      {medications.length === 0 && !isAdding && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Pill size={32} className="text-teal-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Track Medications</h3>
          <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">
            Keep a list of {settings.patientName || 'your loved one'}'s medications,
            track costs, and never miss a dose.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={18} />
            Add First Medication
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicationTracker;
