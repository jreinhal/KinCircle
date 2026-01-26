import React from 'react';
import { Medication, MedicationLog } from '../../types';
import MedicationCard from './MedicationCard';

interface MedicationListProps {
  medications: Medication[];
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
  getTodayLog: (medId: string) => MedicationLog | undefined;
  getRecentLogs: (medId: string) => MedicationLog[];
  onLog: (medId: string, status: 'taken' | 'skipped' | 'late') => void;
  onEdit: (med: Medication) => void;
  canLog: boolean;
  onUpdateMedication?: (med: Medication) => void;
  onDeleteMedication?: (id: string) => void;
}

const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  expandedId,
  onToggleExpand,
  getTodayLog,
  getRecentLogs,
  onLog,
  onEdit,
  canLog,
  onUpdateMedication,
  onDeleteMedication
}) => {
  return (
    <div className="space-y-3">
      {medications.map(med => {
        const todayLog = getTodayLog(med.id);
        const recentLogs = getRecentLogs(med.id);
        const isExpanded = expandedId === med.id;

        return (
          <MedicationCard
            key={med.id}
            medication={med}
            todayLog={todayLog}
            recentLogs={recentLogs}
            isExpanded={isExpanded}
            onToggleExpand={() => onToggleExpand(isExpanded ? null : med.id)}
            onLog={(status) => onLog(med.id, status)}
            onEdit={onUpdateMedication ? () => onEdit(med) : undefined}
            onDiscontinue={onUpdateMedication ? () => onUpdateMedication({ ...med, isActive: false }) : undefined}
            onDelete={onDeleteMedication ? () => onDeleteMedication(med.id) : undefined}
            canLog={canLog}
          />
        );
      })}
    </div>
  );
};

export default MedicationList;
