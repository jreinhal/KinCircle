import { useKinStoreContext } from '../context/KinStoreContext';

export const useHelpTasksStore = () => {
  const { helpTasks, addHelpTask, updateHelpTask, claimHelpTask, completeHelpTask } = useKinStoreContext();
  return { helpTasks, addHelpTask, updateHelpTask, claimHelpTask, completeHelpTask };
};
