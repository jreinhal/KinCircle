import React from 'react';
import { HelpTask, User } from '../../types';
import { FilterStatus } from './types';

interface FilterStatsProps {
  helpTasks: HelpTask[];
  currentUser: User;
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
}

const FilterStats: React.FC<FilterStatsProps> = ({
  helpTasks,
  currentUser,
  filterStatus,
  onFilterChange
}) => {
  const stats = {
    all: helpTasks.length,
    available: helpTasks.filter(t => t.status === 'available').length,
    mine: helpTasks.filter(t => t.claimedByUserId === currentUser.id).length,
    completed: helpTasks.filter(t => t.status === 'completed').length
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      <button
        onClick={() => onFilterChange('all')}
        className={`p-3 rounded-xl text-center transition-all ${
          filterStatus === 'all' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200'
        }`}
      >
        <p className="text-lg font-bold">{stats.all}</p>
        <p className="text-xs opacity-70">All</p>
      </button>
      <button
        onClick={() => onFilterChange('available')}
        className={`p-3 rounded-xl text-center transition-all ${
          filterStatus === 'available' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200'
        }`}
      >
        <p className="text-lg font-bold">{stats.available}</p>
        <p className="text-xs opacity-70">Open</p>
      </button>
      <button
        onClick={() => onFilterChange('mine')}
        className={`p-3 rounded-xl text-center transition-all ${
          filterStatus === 'mine' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200'
        }`}
      >
        <p className="text-lg font-bold">{stats.mine}</p>
        <p className="text-xs opacity-70">Mine</p>
      </button>
      <button
        onClick={() => onFilterChange('completed')}
        className={`p-3 rounded-xl text-center transition-all ${
          filterStatus === 'completed' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200'
        }`}
      >
        <p className="text-lg font-bold">{stats.completed}</p>
        <p className="text-xs opacity-70">Done</p>
      </button>
    </div>
  );
};

export default FilterStats;
