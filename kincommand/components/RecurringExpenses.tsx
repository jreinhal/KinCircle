import React, { useState } from 'react';
import { Plus, Repeat, Pause, Play, Trash2, DollarSign, ChevronDown } from 'lucide-react';
import { RecurringExpense, RecurrenceFrequency, EntryType } from '../types';
import { useConfirm } from './ConfirmDialog';
import { useRecurringExpensesStore } from '../hooks/useRecurringExpensesStore';
import { useEntriesStore } from '../hooks/useEntriesStore';
import { useAppContext } from '../context/AppContext';
import { hasPermission } from '../utils/rbac';

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Every 3 months'
};

const CATEGORY_OPTIONS = [
  'Medical', 'Groceries', 'Prescriptions', 'Transport',
  'Utilities', 'Insurance', 'Home Care', 'Other'
];

const RecurringExpenses: React.FC = () => {
  const { recurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense } = useRecurringExpensesStore();
  const { addEntry } = useEntriesStore();
  const { currentUser } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [isPausedOpen, setIsPausedOpen] = useState(false);
  const confirm = useConfirm();
  const canAdd = hasPermission(currentUser, 'recurring_expenses:create');
  const canUpdate = hasPermission(currentUser, 'recurring_expenses:update');
  const canDelete = hasPermission(currentUser, 'recurring_expenses:delete');
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'Medical',
    frequency: 'monthly' as RecurrenceFrequency,
    nextDueDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;

    const newExpense: RecurringExpense = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      frequency: form.frequency,
      nextDueDate: form.nextDueDate,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    if (!canAdd) return;
    addRecurringExpense(newExpense);
    setIsAdding(false);
    setForm({
      description: '',
      amount: '',
      category: 'Medical',
      frequency: 'monthly',
      nextDueDate: new Date().toISOString().split('T')[0]
    });
  };

  const toggleActive = (expense: RecurringExpense) => {
    if (!canUpdate) return;
    updateRecurringExpense({ ...expense, isActive: !expense.isActive });
  };

  const isDueSoon = (dateStr: string) => {
    const dueDate = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isOverdue = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  const activeExpenses = recurringExpenses.filter(e => e.isActive);
  const pausedExpenses = recurringExpenses.filter(e => !e.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Recurring Expenses</h2>
          <p className="text-slate-500 text-sm mt-1">
            Automate regular expenses like prescriptions and utilities
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => canAdd && setIsAdding(true)}
            disabled={!canAdd}
            className={`btn-primary ${canAdd ? '' : 'opacity-50 cursor-not-allowed'}`}
          >
            <Plus size={18} />
            Add Recurring
          </button>
        )}
      </div>

      {/* Add Form - Progressive disclosure */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">New Recurring Expense</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g., Monthly prescriptions"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Frequency
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value as RecurrenceFrequency })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Next Due Date
                </label>
                <input
                  type="date"
                  value={form.nextDueDate}
                  onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="btn-primary"
              >
                Save Recurring Expense
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Recurring Expenses */}
      {activeExpenses.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-slate-700">Active ({activeExpenses.length})</h3>
          {activeExpenses.map(expense => (
            <div
              key={expense.id}
              className={`bg-white p-4 rounded-xl shadow-sm border ${
                isOverdue(expense.nextDueDate)
                  ? 'border-red-200 bg-red-50'
                  : isDueSoon(expense.nextDueDate)
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Repeat size={20} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{expense.description}</p>
                    <p className="text-sm text-slate-500">
                      {expense.category} • {FREQUENCY_LABELS[expense.frequency]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${expense.amount.toFixed(2)}</p>
                    <p className={`text-xs ${
                      isOverdue(expense.nextDueDate)
                        ? 'text-red-600 font-medium'
                        : isDueSoon(expense.nextDueDate)
                          ? 'text-amber-600'
                          : 'text-slate-500'
                    }`}>
                      {isOverdue(expense.nextDueDate) ? 'Overdue: ' : 'Due: '}
                      {new Date(expense.nextDueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => addEntry({
                        id: crypto.randomUUID(),
                        userId: currentUser.id,
                        type: EntryType.EXPENSE,
                        date: new Date().toISOString().split('T')[0],
                        description: expense.description,
                        amount: expense.amount,
                        category: expense.category
                      })}
                      className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Log this expense now"
                    >
                      <DollarSign size={18} />
                    </button>
                    <button
                      onClick={() => toggleActive(expense)}
                      disabled={!canUpdate}
                      className={`p-2 rounded-lg transition-colors ${canUpdate ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                      title="Pause recurring"
                    >
                      <Pause size={18} />
                    </button>
                    {canDelete && (
                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete recurring expense',
                            message: `Delete "${expense.description}"? This cannot be undone.`,
                            confirmLabel: 'Delete',
                            destructive: true
                          });
                          if (ok) deleteRecurringExpense(expense.id);
                        }}
                        className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paused Expenses - Collapsed by default */}
      {pausedExpenses.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setIsPausedOpen((prev) => !prev)}
            aria-expanded={isPausedOpen}
            aria-controls="paused-expenses"
            className="w-full flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2 text-left transition-colors hover:bg-white/70 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900/80"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">Paused expenses</p>
              <p className="text-xs text-slate-500">{pausedExpenses.length} paused items</p>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isPausedOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div
            id="paused-expenses"
            className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isPausedOpen ? 'max-h-[520px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none'
            }`}
          >
            <div className="mt-3 space-y-3">
              {pausedExpenses.map(expense => (
                <div
                  key={expense.id}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Repeat size={20} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{expense.description}</p>
                        <p className="text-sm text-slate-400">
                          {expense.category} • {FREQUENCY_LABELS[expense.frequency]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600">${expense.amount.toFixed(2)}</span>
                      <button
                        onClick={() => toggleActive(expense)}
                        disabled={!canUpdate}
                        className={`p-2 rounded-lg transition-colors ${canUpdate ? 'text-teal-600 hover:bg-teal-50' : 'text-slate-300 cursor-not-allowed'}`}
                        title="Resume recurring"
                      >
                        <Play size={18} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Delete recurring expense',
                              message: `Delete "${expense.description}"? This cannot be undone.`,
                              confirmLabel: 'Delete',
                              destructive: true
                            });
                            if (ok) deleteRecurringExpense(expense.id);
                          }}
                          className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {recurringExpenses.length === 0 && !isAdding && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Repeat size={32} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">No recurring expenses yet</h3>
          <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">
            Set up recurring expenses for things like monthly prescriptions,
            utilities, or regular grocery runs. We&apos;ll remind you when they&apos;re due.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary"
          >
            <Plus size={18} />
            Add Your First Recurring Expense
          </button>
        </div>
      )}
    </div>
  );
};

export default RecurringExpenses;
