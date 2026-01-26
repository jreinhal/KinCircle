import { useKinStoreContext } from '../context/KinStoreContext';

export const useMedicationsStore = () => {
  const { medications, medicationLogs, addMedication, updateMedication, deleteMedication, logMedication } = useKinStoreContext();
  return { medications, medicationLogs, addMedication, updateMedication, deleteMedication, logMedication };
};
