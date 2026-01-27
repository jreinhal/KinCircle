import React, { useState } from 'react';
import { Task, EntryType, LedgerEntry } from '../types';
import { Calendar, CheckCircle2, Circle, Clock, Plus, User as UserIcon, ArrowRight, DollarSign, Pencil, X } from 'lucide-react';
import { useTasksStore } from '../hooks/useTasksStore';
import { useSettingsStore } from '../hooks/useSettingsStore';
import { useAppContext } from '../context/AppContext';

const Schedule: React.FC = () => {
    const { tasks, addTask, updateTask, convertTaskToEntry } = useTasksStore();
    const { settings } = useSettingsStore();
    const { users, currentUser } = useAppContext();
    const [filter, setFilter] = useState<'UPCOMING' | 'COMPLETED'>('UPCOMING');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
    const [assignedUser, setAssignedUser] = useState(currentUser.id);

    // State for "Log to Ledger" modal
    const [loggingTask, setLoggingTask] = useState<Task | null>(null);
    const [logType, setLogType] = useState<EntryType>(EntryType.TIME);
    const [logAmount, setLogAmount] = useState(''); // Duration in hours OR Amount in $

    // State for editing task
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editAssignee, setEditAssignee] = useState('');

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const task: Task = {
            id: crypto.randomUUID(),
            title: newTaskTitle,
            dueDate: newTaskDate,
            assignedUserId: assignedUser,
            isCompleted: false
        };

        addTask(task);
        setNewTaskTitle('');
    };

    const toggleComplete = (task: Task) => {
        const updated = { ...task, isCompleted: !task.isCompleted };
        updateTask(updated);
    };

    const handleEditClick = (task: Task) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditDate(task.dueDate);
        setEditAssignee(task.assignedUserId);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask || !editTitle.trim()) return;

        const updated: Task = {
            ...editingTask,
            title: editTitle,
            dueDate: editDate,
            assignedUserId: editAssignee
        };
        updateTask(updated);
        setEditingTask(null);
    };

    const cancelEdit = () => {
        setEditingTask(null);
        setEditTitle('');
        setEditDate('');
        setEditAssignee('');
    };

    const handleLogSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loggingTask) return;

        let finalAmount = 0;
        let timeMinutes = 0;

        if (logType === EntryType.EXPENSE) {
            finalAmount = parseFloat(logAmount);
        } else {
            const hours = parseFloat(logAmount);
            timeMinutes = hours * 60;
            finalAmount = hours * settings.hourlyRate;
        }

        const entry: LedgerEntry = {
            id: crypto.randomUUID(),
            userId: loggingTask.assignedUserId,
            type: logType,
            date: loggingTask.dueDate, // Use task due date as completion date
            description: loggingTask.title,
            amount: finalAmount,
            timeDurationMinutes: logType === EntryType.TIME ? timeMinutes : undefined,
            category: 'Task Completion',
            isMedicaidFlagged: false
        };

        convertTaskToEntry(loggingTask, entry);
        setLoggingTask(null);
        setLogAmount('');
    };

    const filteredTasks = tasks
        .filter(t => filter === 'UPCOMING' ? !t.isCompleted : t.isCompleted)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const getUser = (id: string) => users.find(u => u.id === id);

    return (
        <div className="space-y-6 animate-fade-in relative">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Care Schedule</h1>
                    <p className="text-slate-500">Coordinate tasks and turn effort into equity.</p>
                </div>

                {/* Toggle */}
                <div className="bg-slate-100 p-1 rounded-lg flex">
                    <button
                        onClick={() => setFilter('UPCOMING')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'UPCOMING' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setFilter('COMPLETED')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'COMPLETED' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Completed
                    </button>
                </div>
            </header>

            {/* Add Task Form */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-slate-500 mb-1">New Task</label>
                        <input
                            type="text"
                            placeholder="e.g. Pick up prescription from Walgreens"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="bg-white text-slate-900 placeholder:text-slate-400 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>
                    <div className="w-full md:w-40">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Due Date</label>
                        <input
                            type="date"
                            value={newTaskDate}
                            onChange={(e) => setNewTaskDate(e.target.value)}
                            className="bg-white text-slate-900 placeholder:text-slate-400 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>
                    <div className="w-full md:w-40">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Assignee</label>
                        <select
                            value={assignedUser}
                            onChange={(e) => setAssignedUser(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-900"
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn-primary w-full md:w-auto px-6 py-2">
                        <Plus size={18} />
                    </button>
                </form>
            </div>

            {/* Task List */}
            <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No {filter.toLowerCase()} tasks found.</p>
                    </div>
                ) : filteredTasks.map(task => {
                    const assignee = getUser(task.assignedUserId);
                    const isLate = new Date(task.dueDate) < new Date() && !task.isCompleted;

                    return (
                        <div key={task.id} className={`group bg-white p-4 rounded-xl border transition-all hover:shadow-md flex items-center justify-between
                    ${task.isCompleted ? 'border-slate-100 bg-slate-50/50' : 'border-slate-200'}
                    ${isLate ? 'border-red-200 bg-red-50/10' : ''}
                `}>
                            <div className="flex items-center space-x-4 flex-1">
                                <button onClick={() => toggleComplete(task)} className="text-slate-400 hover:text-teal-500 transition-colors">
                                    {task.isCompleted ? <CheckCircle2 size={24} className="text-green-500" /> : <Circle size={24} />}
                                </button>
                                <div>
                                    <h3 className={`font-medium ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{task.title}</h3>
                                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                                        <span className={`flex items-center ${isLate ? 'text-red-500 font-medium' : ''}`}>
                                            <Calendar size={12} className="mr-1" />
                                            {isLate ? 'Overdue: ' : ''}{task.dueDate}
                                        </span>
                                        <span className="flex items-center">
                                            <UserIcon size={12} className="mr-1" />
                                            {assignee?.name}
                                        </span>
                                        {task.relatedEntryId && (
                                            <span className="text-green-600 bg-green-100 px-1.5 rounded flex items-center">
                                                <DollarSign size={10} className="mr-0.5" /> Logged
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="flex items-center gap-2">
                                {!task.isCompleted && (
                                    <button
                                        onClick={() => handleEditClick(task)}
                                        className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center"
                                    >
                                        <Pencil size={14} className="mr-1" /> Edit
                                    </button>
                                )}
                                {task.isCompleted && !task.relatedEntryId && (
                                    <button
                                        onClick={() => setLoggingTask(task)}
                                        className="btn-secondary px-3 py-1.5 text-xs"
                                    >
                                        Log to Ledger <ArrowRight size={12} className="ml-1" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Log to Ledger Modal */}
            {loggingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">Log Completed Task</h3>
                            <p className="text-xs text-slate-500 mt-1 truncate">{loggingTask.title}</p>
                        </div>

                        <form onSubmit={handleLogSubmit} className="p-4 space-y-4">
                            <div className="flex p-1 bg-slate-100 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setLogType(EntryType.TIME)}
                                    className={`flex-1 py-2 text-xs font-medium rounded ${logType === EntryType.TIME ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}
                                >
                                    Care Hours (Time)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLogType(EntryType.EXPENSE)}
                                    className={`flex-1 py-2 text-xs font-medium rounded ${logType === EntryType.EXPENSE ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}
                                >
                                    Expense ($)
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                    {logType === EntryType.TIME ? 'Duration (Hours)' : 'Amount Spent ($)'}
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    autoFocus
                                    value={logAmount}
                                    onChange={(e) => setLogAmount(e.target.value)}
                                    placeholder={logType === EntryType.TIME ? 'e.g. 1.5' : 'e.g. 24.50'}
                                    className="bg-white text-slate-900 placeholder:text-slate-400 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                                {logType === EntryType.TIME && logAmount && (
                                    <p className="text-xs text-green-600 mt-1 text-right">
                                        = ${(parseFloat(logAmount) * settings.hourlyRate).toFixed(2)} Value
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLoggingTask(null)}
                                    className="btn-muted flex-1 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex-1 py-2"
                                >
                                    Save Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Edit Task</h3>
                            <button onClick={cancelEdit} className="btn-ghost p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Task Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="bg-white text-slate-900 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="bg-white text-slate-900 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Assignee</label>
                                <select
                                    value={editAssignee}
                                    onChange={(e) => setEditAssignee(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-900"
                                >
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="btn-muted flex-1 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex-1 py-2"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;
