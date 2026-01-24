import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LedgerEntry, User, EntryType, FamilySettings } from '../types';
import { DollarSign, Clock, Users, PlusCircle, ArrowRight } from 'lucide-react';

interface DashboardProps {
  entries: LedgerEntry[];
  users: User[];
  settings: FamilySettings;
}

const Dashboard: React.FC<DashboardProps> = ({ entries, users, settings }) => {
  
  // Empty State Handling
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] animate-fade-in text-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <PlusCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to KinCommand</h2>
          <p className="text-slate-500 mb-8">
            The operating system for your family's caregiving. Start by logging your first expense or care hours to build the sibling ledger.
          </p>
          <div className="space-y-4">
             <div className="flex items-center p-4 bg-slate-50 rounded-lg text-left">
                <div className="p-2 bg-white rounded-md shadow-sm mr-4 text-blue-500"><DollarSign size={20}/></div>
                <div>
                   <h3 className="font-semibold text-slate-900">Track Expenses</h3>
                   <p className="text-xs text-slate-500">Log receipts and purchases for {settings.patientName}.</p>
                </div>
             </div>
             <div className="flex items-center p-4 bg-slate-50 rounded-lg text-left">
                <div className="p-2 bg-white rounded-md shadow-sm mr-4 text-green-500"><Clock size={20}/></div>
                <div>
                   <h3 className="font-semibold text-slate-900">Log Sweat Equity</h3>
                   <p className="text-xs text-slate-500">Record time spent to ensure fair recognition.</p>
                </div>
             </div>
          </div>
          <div className="mt-8 text-sm text-slate-400 flex items-center justify-center">
             <span>Click "Add Entry" in the sidebar to begin</span>
             <ArrowRight size={14} className="ml-1" />
          </div>
        </div>
      </div>
    );
  }

  // Process data for the Sibling Equity Chart
  const userTotals = users.map(user => {
    const userEntries = entries.filter(e => e.userId === user.id);
    const cashTotal = userEntries
      .filter(e => e.type === EntryType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const timeTotal = userEntries
      .filter(e => e.type === EntryType.TIME)
      .reduce((acc, curr) => acc + curr.amount, 0); // Amount is already calculated value

    return {
      name: user.name,
      Cash: cashTotal,
      SweatEquity: timeTotal,
      Total: cashTotal + timeTotal
    };
  });

  const totalFamilyContribution = userTotals.reduce((acc, curr) => acc + curr.Total, 0);

  const colors = {
    Cash: '#3b82f6', // blue-500
    SweatEquity: '#10b981', // green-500
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">The Sibling Ledger</h1>
        <p className="text-slate-500">Tracking financial and time contributions for {settings.patientName}.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Expenses</p>
              <h3 className="text-2xl font-bold text-slate-900">
                ${userTotals.reduce((acc, curr) => acc + curr.Cash, 0).toLocaleString()}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Sweat Equity Value</p>
              <h3 className="text-2xl font-bold text-slate-900">
                 ${userTotals.reduce((acc, curr) => acc + curr.SweatEquity, 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-400">@{settings.hourlyRate}/hr rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Top Contributor</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {userTotals.sort((a, b) => b.Total - a.Total)[0]?.name || 'N/A'}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Contribution Balance</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-slate-600">Cash</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-slate-600">Sweat Equity</span>
            </div>
          </div>
        </div>
        
        <div className="h-80 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
            <BarChart
              data={userTotals}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={(val) => `$${val}`} stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" stroke="#64748b" width={80} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="Cash" stackId="a" fill={colors.Cash} radius={[0, 4, 4, 0]} barSize={32} />
              <Bar dataKey="SweatEquity" stackId="a" fill={colors.SweatEquity} radius={[0, 4, 4, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-sm text-slate-500 italic text-center">
          "Sweat Equity" is calculated at an agreed family rate of ${settings.hourlyRate}/hour to value time spent caregiving.
        </p>
      </div>

      {/* Settlement Section */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">Fair Settlement Calculation</h3>
        <p className="text-indigo-700 text-sm mb-4">
          To equalize contributions based on the total value of ${totalFamilyContribution.toLocaleString()}:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userTotals.map((u, idx) => {
            const fairShare = totalFamilyContribution / users.length;
            const diff = u.Total - fairShare;
            return (
              <div key={idx} className="flex items-center justify-between bg-white/60 p-3 rounded-lg">
                <span className="font-medium text-indigo-900">{u.name}</span>
                <span className={`font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {diff >= 0 ? 'Over' : 'Under'} by ${Math.abs(diff).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;