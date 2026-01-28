import React, { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EntryType } from '../types';
import { DollarSign, Clock, Users, PlusCircle, ArrowRight, Heart, Sun, ChevronDown } from 'lucide-react';
import DebtSummary from './DebtSummary';
import { useEntriesStore } from '../hooks/useEntriesStore';
import { useSettingsStore } from '../hooks/useSettingsStore';
import { useAppContext } from '../context/AppContext';

interface DashboardProps {
  onStartEntry: (type: EntryType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartEntry }) => {
  const { entries } = useEntriesStore();
  const { settings } = useSettingsStore();
  const { users, currentUser } = useAppContext();

  // Empty State Handling
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] animate-fade-in text-center p-6 bg-stone-50">
        <div className="bg-white p-8 rounded-3xl shadow-lg shadow-stone-200 border border-stone-100 max-w-lg w-full">
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={40} fill="currentColor" className="text-teal-500/20" />
            <span className="absolute text-teal-600"><PlusCircle size={32} /></span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Welcome to KinCircle ❤️</h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            Caring for a loved one is hard work. We're here to help you stay organized, recognize everyone's contributions, and keep your family connected.
          </p>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => onStartEntry(EntryType.EXPENSE)}
              className="w-full flex items-center p-4 bg-stone-50 rounded-2xl text-left hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <div className="p-3 bg-white rounded-xl shadow-sm mr-4 text-teal-500"><DollarSign size={20} /></div>
              <div>
                <h3 className="font-semibold text-stone-900">Track Expenses</h3>
                <p className="text-xs text-stone-500">Log receipts and purchases for {settings.patientName}.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onStartEntry(EntryType.TIME)}
              className="w-full flex items-center p-4 bg-stone-50 rounded-2xl text-left hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <div className="p-3 bg-white rounded-xl shadow-sm mr-4 text-orange-500"><Clock size={20} /></div>
              <div>
                <h3 className="font-semibold text-stone-900">Log Care Hours</h3>
                <p className="text-xs text-stone-500">Record time spent to ensure fair recognition.</p>
              </div>
            </button>
          </div>
          <div className="mt-8 text-sm text-slate-400 flex items-center justify-center">
            <span>Click "Add Entry" in the sidebar to begin</span>
            <ArrowRight size={14} className="ml-1" />
          </div>
        </div>
      </div>
    );
  }

  // Process data for the Care Equity Chart
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
      CareHours: timeTotal,
      Total: cashTotal + timeTotal
    };
  });

  const totalFamilyContribution = userTotals.reduce((acc, curr) => acc + curr.Total, 0);

  const colors = {
    Cash: '#0d9488', // Teal
    CareHours: '#f97316', // Orange
  };

  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const journalContentRef = useRef<HTMLDivElement | null>(null);
  const journalPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [journalPhotoName, setJournalPhotoName] = useState<string | null>(null);

  const handleJournalToggle = () => {
    setIsJournalOpen((prev) => {
      const next = !prev;
      if (next && typeof window !== 'undefined') {
        requestAnimationFrame(() => {
          const target = journalContentRef.current;
          if (!target) return;
          const container = target.closest('main');
          if (!(container instanceof HTMLElement)) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
          const targetTop = target.getBoundingClientRect().top;
          const containerTop = container.getBoundingClientRect().top;
          const offset = 24;
          const nextTop = targetTop - containerTop + container.scrollTop - offset;
          container.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
        });
      }
      return next;
    });
  };

  const handleAddPhotoClick = () => {
    journalPhotoInputRef.current?.click();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setJournalPhotoName(file.name);
    event.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 md:pb-0">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">The Care Ledger</h1>
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

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 transition-all hover:shadow-md">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-stone-500 font-medium">Care Hours Value</p>
              <h3 className="text-2xl font-bold text-stone-900">
                ${userTotals.reduce((acc, curr) => acc + curr.CareHours, 0).toLocaleString()}
              </h3>
              <p className="text-xs text-orange-400 font-medium">@{settings.hourlyRate}/hr rate</p>
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
              <span className="text-slate-600">Care Hours</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full min-w-0 [&_*]:outline-none [&_*]:focus:outline-none">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
            <BarChart
              data={userTotals}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid-stroke)" />
              <XAxis type="number" tickFormatter={(val) => `$${val}`} stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" stroke="#64748b" width={80} />
              <Tooltip
                cursor={{ fill: 'var(--chart-cursor-fill)' }}
                formatter={(value) => {
                  const numeric = typeof value === 'number' ? value : Number(value || 0);
                  return [`$${numeric.toLocaleString()}`, ''];
                }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--chart-tooltip-border)',
                  backgroundColor: 'var(--chart-tooltip-bg)',
                  color: 'var(--chart-tooltip-text)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: 'var(--chart-tooltip-text)' }}
                itemStyle={{ color: 'var(--chart-tooltip-text)' }}
              />
              <Bar dataKey="Cash" stackId="a" fill={colors.Cash} radius={[0, 4, 4, 0]} barSize={32} />
              <Bar dataKey="CareHours" stackId="a" fill={colors.CareHours} radius={[0, 4, 4, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-sm text-slate-500 italic text-center">
          Care hours are valued at ${settings.hourlyRate}/hour to fairly recognize time spent caregiving.
        </p>
      </div>

      {/* Debt Summary - Simplified Balances (Splitwise-style) */}
      <DebtSummary entries={entries} users={users} currentUser={currentUser} />

      {/* Family Journal Placeholder */}
      <div className="bg-white rounded-3xl border border-stone-100 p-6 shadow-sm">
        <button
          type="button"
          onClick={handleJournalToggle}
          aria-expanded={isJournalOpen}
          aria-controls="family-journal"
          className="w-full flex items-center justify-between text-left rounded-xl px-1 py-1 transition-colors hover:bg-stone-50 dark:hover:bg-slate-800/60"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
              <Heart size={20} fill="currentColor" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800">Family Journal</h3>
              <p className="text-xs text-stone-500">Share updates and photos</p>
            </div>
          </div>
          <ChevronDown
            size={18}
            className={`text-stone-400 transition-transform duration-400 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
              isJournalOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div
          id="family-journal"
          ref={journalContentRef}
          className={`grid scroll-mt-24 transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
            isJournalOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-4">
              <div className="flex items-center justify-end mb-4">
                <input
                  ref={journalPhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoClick}
                  className="text-sm text-teal-600 font-medium hover:underline"
                >
                  Add Photo
                </button>
              </div>
              <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-stone-300 shadow-sm">
                  <Sun size={24} />
                </div>
                <p className="text-stone-500 font-medium">Share a moment today</p>
                <p className="text-xs text-stone-400 mt-1">Photos and updates help everyone feel connected to {settings.patientName}.</p>
                {journalPhotoName && (
                  <p className="text-xs text-teal-600 mt-2">Selected: {journalPhotoName}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
