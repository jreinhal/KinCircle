import { useKinStoreContext } from '../context/KinStoreContext';

export const useTasksStore = () => {
  const { tasks, addTask, updateTask, convertTaskToEntry } = useKinStoreContext();
  return { tasks, addTask, updateTask, convertTaskToEntry };
};
