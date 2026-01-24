import React, { useState } from 'react';
import { LedgerEntry, User, EntryType } from '../types';
import { Clock, Search, Filter, Trash2, Download } from 'lucide-react';

interface LedgerProps {
  entries: LedgerEntry[];
  users: User[];
  onDelete?: (id: string) => void;
}

const Ledger: React.FC<LedgerProps> = ({ entries, users, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'TIME'>('ALL');

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredEntries = sortedEntries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          entry.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || entry.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    const headers = ['Date', 'User', 'Type', 'Category', 'Description', 'Amount', 'Duration (Min)'];
    const rows = filteredEntries.map(e => [
        e.date,
        getUserName(e.userId),
        e.type,
        e.category,
        `"${e.description.replace(/"/g, '""')}"`, // Escape quotes
        e.amount.toFixed(2),
        e.timeDurationMinutes || 0
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'kincommand_ledger.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">All Transactions</h1>
           <p className="text-slate-500">A complete history of care and costs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search ledger..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full md:w-64"
                />
            </div>
            
            <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                <button 
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1.5 text-xs font-medium rounded ${filterType === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
                >
                    All
                </button>
                <button 
                    onClick={() => setFilterType('EXPENSE')}
                    className={`px-3 py-1.5 text-xs font-medium rounded ${filterType === 'EXPENSE' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}
                >
                    $$
                </button>
                <button 
                    onClick={() => setFilterType('TIME')}
                    className={`px-3 py-1.5 text-xs font-medium rounded ${filterType === 'TIME' ? 'bg-green-50 text-green-700' : 'text-slate-500'}`}
                >
                    Time
                </button>
            </div>

            <button 
                onClick={handleExportCSV}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm transition-colors"
            >
                <Download size={16} />
                <span className="hidden md:inline">Export CSV</span>
            </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Value</th>
                {onDelete && <th className="px-6 py-4 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No transactions found matching your filters.
                      </td>
                  </tr>
              ) : filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{entry.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">
                        {getUserName(entry.userId).charAt(0)}
                    </span>
                    <span className="hidden md:inline">{getUserName(entry.userId)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{entry.description}</span>
                        {entry.type === EntryType.TIME && (
                            <span className="text-xs text-slate-400 flex items-center mt-0.5">
                                <Clock size={10} className="mr-1"/> {entry.timeDurationMinutes ? (entry.timeDurationMinutes / 60).toFixed(1) : 0} hrs
                            </span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium">
                    <span className={entry.type === EntryType.EXPENSE ? 'text-blue-600' : 'text-green-600'}>
                       {entry.type === EntryType.EXPENSE ? '$' : '~$'}
                       {entry.amount.toFixed(2)}
                    </span>
                  </td>
                  {onDelete && (
                      <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => onDelete(entry.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="Delete Entry"
                          >
                              <Trash2 size={16} />
                          </button>
                      </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ledger;