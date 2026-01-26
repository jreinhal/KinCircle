import { useKinStoreContext } from '../context/KinStoreContext';

export const useEntriesStore = () => {
  const { entries, addEntry, addEntries, deleteEntry } = useKinStoreContext();
  return { entries, addEntry, addEntries, deleteEntry };
};
