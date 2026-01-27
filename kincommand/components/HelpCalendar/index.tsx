import React, { useState, useMemo } from 'react';
import { Calendar, Plus, List, CalendarDays } from 'lucide-react';
import { HelpTask, EntryType, LedgerEntry } from '../../types';
import { ViewMode, FilterStatus, TaskFormData, DEFAULT_FORM_DATA } from './types';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import FilterStats from './FilterStats';
import CalendarWeekView from './CalendarWeekView';
import { useHelpTasksStore } from '../../hooks/useHelpTasksStore';
import { useEntriesStore } from '../../hooks/useEntriesStore';
import { useSettingsStore } from '../../hooks/useSettingsStore';
import { useAppContext } from '../../context/AppContext';

const HelpCalendar: React.FC = () => {
  const { helpTasks, addHelpTask, updateHelpTask, claimHelpTask, completeHelpTask } = useHelpTasksStore();
  const { addEntry } = useEntriesStore();
  const { settings } = useSettingsStore();
  const { users, currentUser } = useAppContext();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<HelpTask | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormData>(DEFAULT_FORM_DATA);

  // Calendar view state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    return new Date(today.setDate(diff));
  });

  const today = new Date().toISOString().split('T')[0];

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let tasks = [...helpTasks];

    switch (filterStatus) {
      case 'available':
        tasks = tasks.filter(t => t.status === 'available');
        break;
      case 'mine':
        tasks = tasks.filter(t => t.claimedByUserId === currentUser.id || t.createdByUserId === currentUser.id);
        break;
      case 'completed':
        tasks = tasks.filter(t => t.status === 'completed');
        break;
    }

    return tasks.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [helpTasks, filterStatus, currentUser.id]);

  // Group tasks by date for list view
  const tasksByDate = useMemo(() => {
    const groups: Record<string, HelpTask[]> = {};
    filteredTasks.forEach(task => {
      if (!groups[task.date]) {
        groups[task.date] = [];
      }
      groups[task.date].push(task);
    });
    return groups;
  }, [filteredTasks]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const todayDate = new Date();
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today) return 'Today';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const isOverdue = (dateStr: string) => dateStr < today;

  const resetForm = () => setForm(DEFAULT_FORM_DATA);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) return;

    const newTask: HelpTask = {
      id: crypto.randomUUID(),
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      date: form.date,
      timeSlot: form.timeSlot,
      createdByUserId: currentUser.id,
      status: 'available',
      estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : undefined
    };

    addHelpTask(newTask);
    setIsAdding(false);
    resetForm();
  };

  const handleEditTask = (task: HelpTask) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      category: task.category,
      date: task.date,
      timeSlot: task.timeSlot ?? 'Flexible',
      estimatedMinutes: task.estimatedMinutes?.toString() || ''
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !form.title || !form.date) return;

    const updatedTask: HelpTask = {
      ...editingTask,
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      date: form.date,
      timeSlot: form.timeSlot,
      estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : undefined
    };

    updateHelpTask(updatedTask);
    setEditingTask(null);
    resetForm();
  };

  const cancelEdit = () => {
    setEditingTask(null);
    resetForm();
  };

  const handleClaimTask = (task: HelpTask) => {
    claimHelpTask(task.id, currentUser.id);
  };

  const handleCompleteAndLog = (task: HelpTask) => {
    completeHelpTask(task.id);
    const minutes = task.estimatedMinutes ?? 60;
    const hours = minutes / 60;
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      type: EntryType.TIME,
      date: task.date,
      description: task.title,
      amount: hours * settings.hourlyRate,
      timeDurationMinutes: minutes,
      category: task.category
    };
    addEntry(entry);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Help Calendar</h2>
          <p className="text-slate-500 text-sm mt-1">
            Coordinate who's helping {settings.patientName}
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="btn-primary px-4 py-2 rounded-xl shadow-sm"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Request Help</span>
        </button>
      </div>

      {/* Filter Stats */}
      <FilterStats
        helpTasks={helpTasks}
        currentUser={currentUser}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />

      {/* View Toggle - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-end gap-2">
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <List size={16} />
          List
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'calendar' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarDays size={16} />
          Week
        </button>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <TaskForm
          formData={form}
          isEditing={false}
          onFormChange={setForm}
          onSubmit={handleSubmit}
          onCancel={() => { setIsAdding(false); resetForm(); }}
        />
      )}

      {/* List View */}
      {(viewMode === 'list' || typeof window !== 'undefined' && window.innerWidth < 768) && (
        <div className="space-y-6">
          {Object.keys(tasksByDate).length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} className="text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">No tasks found</h3>
              <p className="text-slate-500 text-sm mb-4">
                {filterStatus === 'all'
                  ? "No help requests yet. Create one to get started!"
                  : `No ${filterStatus} tasks. Try a different filter.`}
              </p>
              {filterStatus !== 'all' && (
                <button
                  onClick={() => setFilterStatus('all')}
                  className="btn-text text-sm"
                >
                  View all tasks
                </button>
              )}
            </div>
          ) : (
            Object.entries(tasksByDate).map(([date, tasks]) => (
              <div key={date}>
                <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                  isOverdue(date) ? 'text-red-600' : date === today ? 'text-teal-600' : 'text-slate-500'
                }`}>
                  {formatDateHeader(date)}
                  {tasks.length > 1 && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                      {tasks.length}
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      users={users}
                      currentUser={currentUser}
                      isExpanded={expandedTaskId === task.id}
                      today={today}
                      onToggleExpand={setExpandedTaskId}
                      onClaimTask={handleClaimTask}
                      onCompleteAndLog={handleCompleteAndLog}
                      onUnclaimTask={(taskId) => claimHelpTask(taskId, '')}
                      onEditTask={handleEditTask}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <CalendarWeekView
          currentWeekStart={currentWeekStart}
          helpTasks={helpTasks}
          onNavigateWeek={navigateWeek}
          onSelectTask={setExpandedTaskId}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskForm
          formData={form}
          isEditing={true}
          onFormChange={setForm}
          onSubmit={handleSaveEdit}
          onCancel={cancelEdit}
        />
      )}
    </div>
  );
};

export default HelpCalendar;
