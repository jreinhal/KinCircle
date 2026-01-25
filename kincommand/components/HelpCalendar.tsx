import React, { useState } from 'react';
import {
  Calendar, Plus, ChevronLeft, ChevronRight,
  UtensilsCrossed, Car, ShoppingBag, Heart,
  Stethoscope, Home, MoreHorizontal, Hand,
  CheckCircle, Clock, AlertCircle, User as UserIcon,
  Pencil, X
} from 'lucide-react';
import { HelpTask, HelpTaskCategory, HelpTaskStatus, User, FamilySettings, LedgerEntry, EntryType } from '../types';

interface HelpCalendarProps {
  helpTasks: HelpTask[];
  users: User[];
  currentUser: User;
  settings: FamilySettings;
  onAddTask: (task: HelpTask) => void;
  onUpdateTask: (task: HelpTask) => void;
  onClaimTask: (taskId: string, userId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onConvertToEntry: (task: HelpTask) => void;
}

const CATEGORY_CONFIG: Record<HelpTaskCategory, { icon: React.ElementType; label: string; color: string }> = {
  meals: { icon: UtensilsCrossed, label: 'Meals', color: 'orange' },
  transport: { icon: Car, label: 'Transport', color: 'blue' },
  errands: { icon: ShoppingBag, label: 'Errands', color: 'purple' },
  companionship: { icon: Heart, label: 'Companionship', color: 'pink' },
  medical: { icon: Stethoscope, label: 'Medical', color: 'red' },
  household: { icon: Home, label: 'Household', color: 'green' },
  other: { icon: MoreHorizontal, label: 'Other', color: 'slate' }
};

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Flexible'];

const HelpCalendar: React.FC<HelpCalendarProps> = ({
  helpTasks,
  users,
  currentUser,
  settings,
  onAddTask,
  onUpdateTask,
  onClaimTask,
  onCompleteTask,
  onConvertToEntry
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    return new Date(today.setDate(diff));
  });

  const [isAdding, setIsAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<HelpTask | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other' as HelpTaskCategory,
    date: new Date().toISOString().split('T')[0],
    timeSlot: 'Flexible',
    estimatedMinutes: ''
  });

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return helpTasks.filter(t => t.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

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

    onAddTask(newTask);
    setIsAdding(false);
    setForm({
      title: '',
      description: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'Flexible',
      estimatedMinutes: ''
    });
  };

  const handleClaimTask = (task: HelpTask) => {
    onClaimTask(task.id, currentUser.id);
  };

  const handleEditTask = (task: HelpTask) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      category: task.category,
      date: task.date,
      timeSlot: task.timeSlot,
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

    onUpdateTask(updatedTask);
    setEditingTask(null);
    setForm({
      title: '',
      description: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'Flexible',
      estimatedMinutes: ''
    });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setForm({
      title: '',
      description: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'Flexible',
      estimatedMinutes: ''
    });
  };

  const handleCompleteAndLog = (task: HelpTask) => {
    onCompleteTask(task.id);
    onConvertToEntry(task);
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  const getStatusBadge = (task: HelpTask) => {
    switch (task.status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
            <Hand size={12} /> Available
          </span>
        );
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
            <Clock size={12} /> Claimed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
            <CheckCircle size={12} /> Done
          </span>
        );
      case 'missed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
            <AlertCircle size={12} /> Missed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Help Calendar</h2>
          <p className="text-slate-500 text-sm mt-1">
            Coordinate who's helping with what
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={18} />
            Request Help
          </button>
        )}
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">Request Help</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  What do you need help with?
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Drive Mom to doctor's appointment"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as HelpTaskCategory })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Time
                </label>
                <select
                  value={form.timeSlot}
                  onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={form.estimatedMinutes}
                  onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Any details helpers should know..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Post Request
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Week Navigation */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-semibold text-slate-900">
            {weekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
              {day}
            </div>
          ))}

          {/* Day Cells */}
          {weekDays.map(date => {
            const tasks = getTasksForDate(date);
            const dateStr = date.toISOString().split('T')[0];

            return (
              <div
                key={dateStr}
                className={`min-h-[120px] p-2 rounded-lg border ${
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
                        onClick={() => setSelectedDate(dateStr)}
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
                    <button
                      onClick={() => setSelectedDate(dateStr)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      +{tasks.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Modal/Panel */}
      {selectedDate && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">
              Tasks for {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>

          <div className="space-y-3">
            {helpTasks
              .filter(t => t.date === selectedDate)
              .map(task => {
                const config = CATEGORY_CONFIG[task.category];
                const Icon = config.icon;
                const isClaimedByMe = task.claimedByUserId === currentUser.id;

                return (
                  <div
                    key={task.id}
                    className="p-4 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${config.color}-100`}>
                          <Icon size={18} className={`text-${config.color}-600`} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <p className="text-sm text-slate-500">
                            {task.timeSlot}
                            {task.estimatedMinutes && ` • ~${task.estimatedMinutes} min`}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(task)}
                    </div>

                    {task.description && (
                      <p className="text-sm text-slate-600 mb-3 pl-10">{task.description}</p>
                    )}

                    {task.claimedByUserId && (
                      <p className="text-sm text-slate-500 mb-3 pl-10 flex items-center gap-1">
                        <UserIcon size={14} />
                        {isClaimedByMe ? 'You claimed this' : `Claimed by ${getUserName(task.claimedByUserId).split(' ')[0]}`}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pl-10 flex-wrap">
                      {task.status === 'available' && (
                        <button
                          onClick={() => handleClaimTask(task)}
                          className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          I'll do this
                        </button>
                      )}
                      {task.status === 'claimed' && isClaimedByMe && (
                        <>
                          <button
                            onClick={() => handleCompleteAndLog(task)}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Complete & Log Time
                          </button>
                          <button
                            onClick={() => onClaimTask(task.id, '')}
                            className="px-3 py-1.5 text-slate-600 text-sm hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            Unclaim
                          </button>
                        </>
                      )}
                      {/* Edit button - only for non-completed tasks */}
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => handleEditTask(task)}
                          className="px-3 py-1.5 text-slate-600 text-sm hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {helpTasks.filter(t => t.date === selectedDate).length === 0 && (
              <p className="text-center text-slate-500 py-4">No tasks for this day</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Edit Task</h3>
                <button
                  onClick={cancelEdit}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as HelpTaskCategory })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Time
                    </label>
                    <select
                      value={form.timeSlot}
                      onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Est. Minutes
                    </label>
                    <input
                      type="number"
                      value={form.estimatedMinutes}
                      onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {helpTasks.filter(t => t.status === 'available').length}
          </p>
          <p className="text-sm text-slate-500">Available</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {helpTasks.filter(t => t.status === 'claimed' && t.claimedByUserId === currentUser.id).length}
          </p>
          <p className="text-sm text-slate-500">You Claimed</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-green-600">
            {helpTasks.filter(t => t.status === 'completed' && t.claimedByUserId === currentUser.id).length}
          </p>
          <p className="text-sm text-slate-500">You Completed</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-slate-600">
            {helpTasks.filter(t => t.status === 'completed').length}
          </p>
          <p className="text-sm text-slate-500">Total Completed</p>
        </div>
      </div>
    </div>
  );
};

export default HelpCalendar;
