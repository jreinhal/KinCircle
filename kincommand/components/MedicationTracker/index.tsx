import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Medication, MedicationLog } from '../../types';
import MedicationForm, { MedicationFormState } from './MedicationForm';
import MedicationStats from './MedicationStats';
import MedicationList from './MedicationList';
import DiscontinuedList from './DiscontinuedList';
import MedicationEmptyState from './MedicationEmptyState';
import { useMedicationsStore } from '../../hooks/useMedicationsStore';
import { useSettingsStore } from '../../hooks/useSettingsStore';
import { useAppContext } from '../../context/AppContext';
import { hasPermission } from '../../utils/rbac';

const initialFormState: MedicationFormState = {
  name: '',
  dosage: '',
  frequency: 'Once daily',
  prescribedFor: '',
  pharmacy: '',
  monthlyCost: '',
  notes: ''
};

const MedicationTracker: React.FC = () => {
  const { medications, medicationLogs, addMedication, updateMedication, deleteMedication, logMedication } = useMedicationsStore();
  const { settings } = useSettingsStore();
  const { currentUser } = useAppContext();
  const canCreate = hasPermission(currentUser, 'medications:create');
  const canUpdate = hasPermission(currentUser, 'medications:update');
  const canDelete = hasPermission(currentUser, 'medications:delete');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<MedicationFormState>(initialFormState);

  const resetForm = () => setForm(initialFormState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.dosage) return;

    if (editingId) {
      const existing = medications.find(m => m.id === editingId);
      if (existing) {
        if (!canUpdate) return;
        updateMedication({
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
      if (!canCreate) return;
      addMedication(newMed);
    }

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

  const handleLogTaken = (medId: string, status: 'taken' | 'skipped' | 'late') => {
    const log: MedicationLog = {
      id: crypto.randomUUID(),
      medicationId: medId,
      takenAt: new Date().toISOString(),
      status
    };
    if (!canUpdate) return;
    logMedication(log);
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

  const totalMonthlyCost = activeMeds.reduce((sum, m) => sum + (m.monthlyCost || 0), 0);

  const refillsDueSoon = activeMeds.filter(m => {
    if (!m.refillDate) return false;
    const refillDate = new Date(m.refillDate);
    const today = new Date();
    const diffDays = Math.ceil((refillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  return (
    <div className="space-y-6">
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
              if (!canCreate) return;
              resetForm();
              setEditingId(null);
              setIsAdding(true);
            }}
            disabled={!canCreate}
            className={`btn-primary ${canCreate ? '' : 'opacity-50 cursor-not-allowed'}`}
          >
            <Plus size={18} />
            Add Medication
          </button>
        )}
      </div>

      <MedicationStats
        activeCount={activeMeds.length}
        totalMonthlyCost={totalMonthlyCost}
        refillsDueSoonCount={refillsDueSoon.length}
      />

      {isAdding && (
        <MedicationForm
          form={form}
          editingId={editingId}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsAdding(false);
            setEditingId(null);
            resetForm();
          }}
        />
      )}

      {activeMeds.length > 0 && (
        <MedicationList
          medications={activeMeds}
          expandedId={expandedId}
          onToggleExpand={setExpandedId}
          getTodayLog={getTodayLog}
          getRecentLogs={getRecentLogs}
          onLog={handleLogTaken}
          onEdit={startEdit}
          canLog={canUpdate}
          onUpdateMedication={canUpdate ? updateMedication : undefined}
          onDeleteMedication={canDelete ? deleteMedication : undefined}
        />
      )}

      <DiscontinuedList
        medications={inactiveMeds}
        onReactivate={canUpdate ? updateMedication : undefined}
      />

      {medications.length === 0 && !isAdding && (
        <MedicationEmptyState
          settings={settings}
          canAdd={canCreate}
          onAdd={() => setIsAdding(true)}
        />
      )}
    </div>
  );
};

export default MedicationTracker;
