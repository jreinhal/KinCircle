import { useKinStoreContext } from '../context/KinStoreContext';

export const useSettingsStore = () => {
  const { settings, updateSettings, importData, logSecurityEvent, securityLogs } = useKinStoreContext();
  return { settings, updateSettings, importData, logSecurityEvent, securityLogs };
};
