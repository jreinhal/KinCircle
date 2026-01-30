import React, { useState } from 'react';
import { ArrowRight, TrendingUp, TrendingDown, Minus, Users, DollarSign, ChevronDown } from 'lucide-react';
import { LedgerEntry, User, DebtSummary as DebtSummaryType } from '../types';

interface DebtSummaryProps {
  entries: LedgerEntry[];
  users: User[];
  currentUser: User;
}

/**
 * Calculates simplified debts between family members
 * Based on who spent what on behalf of the family
 */
const calculateDebts = (entries: LedgerEntry[], users: User[]): DebtSummaryType[] => {
  // Calculate total spending per user
  const userTotals: Record<string, number> = {};
  users.forEach(u => { userTotals[u.id] = 0; });

  entries.forEach(entry => {
    userTotals[entry.userId] = (userTotals[entry.userId] || 0) + entry.amount;
  });

  const totalSpent = Object.values(userTotals).reduce((a, b) => a + b, 0);
  const fairShare = totalSpent / users.length;

  // Calculate who owes whom (simplified)
  // Positive balance = they overpaid (are owed money)
  // Negative balance = they underpaid (owe money)
  const balances: Record<string, number> = {};
  users.forEach(u => {
    balances[u.id] = userTotals[u.id] - fairShare;
  });

  // Create simplified debt transactions
  const debts: DebtSummaryType[] = [];
  const debtors = users.filter(u => balances[u.id] < 0).sort((a, b) => balances[a.id] - balances[b.id]);
  const creditors = users.filter(u => balances[u.id] > 0).sort((a, b) => balances[b.id] - balances[a.id]);

  let i = 0, j = 0;
  const tempBalances = { ...balances };

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const debtAmount = Math.min(
      Math.abs(tempBalances[debtor.id]),
      tempBalances[creditor.id]
    );

    if (debtAmount > 0.01) { // Ignore tiny amounts
      debts.push({
        fromUserId: debtor.id,
        toUserId: creditor.id,
        netAmount: Math.round(debtAmount * 100) / 100
      });
    }

    tempBalances[debtor.id] += debtAmount;
    tempBalances[creditor.id] -= debtAmount;

    if (Math.abs(tempBalances[debtor.id]) < 0.01) i++;
    if (Math.abs(tempBalances[creditor.id]) < 0.01) j++;
  }

  return debts;
};

const DebtSummary: React.FC<DebtSummaryProps> = ({ entries, users, currentUser }) => {
  const debts = calculateDebts(entries, users);

  // Calculate user stats
  const userTotals: Record<string, number> = {};
  users.forEach(u => { userTotals[u.id] = 0; });
  entries.forEach(entry => {
    userTotals[entry.userId] = (userTotals[entry.userId] || 0) + entry.amount;
  });

  const totalSpent = Object.values(userTotals).reduce((a, b) => a + b, 0);
  const fairShare = totalSpent / users.length;

  // Find current user's status
  const currentUserBalance = userTotals[currentUser.id] - fairShare;
  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';
  const hasDebts = debts.length > 0;
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);

  if (entries.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-slate-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Family Balance</h3>
            <p className="text-sm text-slate-500">See who owes whom</p>
          </div>
        </div>
        <p className="text-slate-500 text-sm text-center py-4">
          Add expenses to see how contributions balance out between family members.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
          <Users size={20} className="text-teal-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Simplified Balances</h3>
          <p className="text-sm text-slate-500">Who owes whom</p>
        </div>
      </div>

      {/* Your Status - Always visible */}
      <div className={`p-4 rounded-lg mb-6 ${
        currentUserBalance > 0.01
          ? 'bg-green-50 border border-green-200'
          : currentUserBalance < -0.01
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-slate-50 border border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentUserBalance > 0.01 ? (
              <TrendingUp size={20} className="text-green-600" />
            ) : currentUserBalance < -0.01 ? (
              <TrendingDown size={20} className="text-amber-600" />
            ) : (
              <Minus size={20} className="text-slate-400" />
            )}
            <span className="font-medium text-slate-900">Your Status</span>
          </div>
          <div className="text-right">
            {currentUserBalance > 0.01 ? (
              <span className="text-green-700 font-semibold">
                You&apos;re owed ${Math.abs(currentUserBalance).toFixed(2)}
              </span>
            ) : currentUserBalance < -0.01 ? (
              <span className="text-amber-700 font-semibold">
                You owe ${Math.abs(currentUserBalance).toFixed(2)}
              </span>
            ) : (
              <span className="text-slate-600">All balanced!</span>
            )}
          </div>
        </div>

        {/* Quick breakdown for current user */}
        <div className="mt-2 text-sm text-slate-600">
          You&apos;ve contributed ${userTotals[currentUser.id].toFixed(2)} of ${totalSpent.toFixed(2)} total
          <span className="text-slate-400"> (fair share: ${fairShare.toFixed(2)})</span>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setIsSettlementOpen((prev) => !prev)}
          aria-expanded={isSettlementOpen}
          aria-controls="settlement-details"
          className="w-full flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2 text-left transition-colors hover:bg-white/70 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900/80"
        >
          <div>
            <p className="text-sm font-semibold text-slate-800">Settlement details</p>
            <p className="text-xs text-slate-500">Payments and contribution breakdown</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{hasDebts ? `${debts.length} suggested` : 'No payments'}</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-400 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                isSettlementOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        <div
          id="settlement-details"
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
            isSettlementOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-4 space-y-6">
              {/* Simplified Transactions */}
              {hasDebts ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">To Settle Up:</h4>
                  {debts.map((debt, idx) => {
                    const isCurrentUserDebtor = debt.fromUserId === currentUser.id;
                    const isCurrentUserCreditor = debt.toUserId === currentUser.id;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isCurrentUserDebtor
                            ? 'bg-amber-50'
                            : isCurrentUserCreditor
                              ? 'bg-green-50'
                              : 'bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            isCurrentUserDebtor ? 'bg-amber-500' : 'bg-slate-400'
                          }`}>
                            {getUserName(debt.fromUserId).charAt(0)}
                          </div>
                          <ArrowRight size={16} className="text-slate-400" />
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            isCurrentUserCreditor ? 'bg-green-500' : 'bg-slate-400'
                          }`}>
                            {getUserName(debt.toUserId).charAt(0)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">${debt.netAmount.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">
                            {getUserName(debt.fromUserId).split(' ')[0]} → {getUserName(debt.toUserId).split(' ')[0]}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <DollarSign size={24} className="text-green-600" />
                  </div>
                  <p className="text-green-700 font-medium">Everyone is balanced!</p>
                  <p className="text-sm text-slate-500">No payments needed</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Contribution breakdown</h4>
                <div className="space-y-2">
                  {users.map(user => {
                    const total = userTotals[user.id];
                    const percentage = totalSpent > 0 ? (total / totalSpent) * 100 : 0;

                    return (
                      <div key={user.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">
                              {user.name.split(' ')[0]}
                              {user.id === currentUser.id && ' (You)'}
                            </span>
                            <span className="text-sm text-slate-600">${total.toFixed(2)}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtSummary;
