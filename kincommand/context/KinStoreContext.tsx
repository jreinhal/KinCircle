import React, { createContext, useContext } from 'react';
import { useKinStore } from '../hooks/useKinStore';
import { FamilySettings, LedgerEntry, Task, VaultDocument } from '../types';
import { useAppContext } from './AppContext';

type KinStoreValue = ReturnType<typeof useKinStore>;

const KinStoreContext = createContext<KinStoreValue | null>(null);

interface KinStoreProviderProps {
  defaultEntries: LedgerEntry[];
  defaultTasks: Task[];
  defaultDocuments: VaultDocument[];
  defaultSettings: FamilySettings;
  children: React.ReactNode;
}

export const KinStoreProvider: React.FC<KinStoreProviderProps> = ({
  defaultEntries,
  defaultTasks,
  defaultDocuments,
  defaultSettings,
  children
}) => {
  const { currentUser } = useAppContext();
  const store = useKinStore(defaultEntries, defaultTasks, defaultDocuments, defaultSettings, currentUser);

  return <KinStoreContext.Provider value={store}>{children}</KinStoreContext.Provider>;
};

export const useKinStoreContext = (): KinStoreValue => {
  const ctx = useContext(KinStoreContext);
  if (!ctx) {
    throw new Error('useKinStoreContext must be used within KinStoreProvider');
  }
  return ctx;
};
