import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HelpTask } from '../../types';
import { CATEGORY_CONFIG } from './constants';

interface CalendarWeekViewProps {
  currentWeekStart: Date;
  helpTasks: HelpTask[];
  onNavigateWeek: (direction: 'prev' | 'next') => void;
  onSelectTask: (taskId: string) => void;
}

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  currentWeekStart,
  helpTasks,
  onNavigateWeek,
  onSelectTask
}) => {
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return helpTasks.filter(t => t.date === dateStr);
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isPast = (date: Date) => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return date < todayDate;
  };

  return (
    <div className="hidden md:block bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onNavigateWeek('prev')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-semibold text-slate-900">
          {weekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => onNavigateWeek('next')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}

        {weekDays.map(date => {
          const tasks = getTasksForDate(date);
          const dateStr = date.toISOString().split('T')[0];

          return (
            <div
              key={dateStr}
              className={`min-h-[100px] p-2 rounded-lg border ${
                isToday(date)
                  ? 'border-teal-300 bg-teal-50'
                  : isPast(date)
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-200 bg-white'
              }`}
            >
              <div className={`text-sm font-medium mb-2 ${
                isToday(date) ? 'text-teal-700' : isPast(date) ? 'text-slate-400' : 'text-slate-700'
              }`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {tasks.slice(0, 3).map(task => {
                  const config = CATEGORY_CONFIG[task.category];
                  const Icon = config.icon;
                  return (
                    <button
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      className={`w-full text-left px-2 py-1 rounded text-xs truncate flex items-center gap-1 ${
                        task.status === 'available'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : task.status === 'claimed'
                            ? 'bg-amber-100 text-amber-700'
                            : task.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <Icon size={12} />
                      <span className="truncate">{task.title}</span>
                    </button>
                  );
                })}
                {tasks.length > 3 && (
                  <div className="text-xs text-slate-500">+{tasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarWeekView;
