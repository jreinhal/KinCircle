import { useKinStoreContext } from '../context/KinStoreContext';

export const useRecurringExpensesStore = () => {
  const { recurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense } = useKinStoreContext();
  return { recurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense };
};
