import React from 'react';
import { X } from 'lucide-react';
import { HelpTask, HelpTaskCategory } from '../../types';
import { CATEGORY_CONFIG, TIME_SLOTS } from './constants';

export interface TaskFormData {
  title: string;
  description: string;
  category: HelpTaskCategory;
  date: string;
  timeSlot: string;
  estimatedMinutes: string;
}

interface TaskFormProps {
  formData: TaskFormData;
  isEditing: boolean;
  onFormChange: (data: TaskFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  formData,
  isEditing,
  onFormChange,
  onSubmit,
  onCancel
}) => {
  const updateField = <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <div className={isEditing ? "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" : ""}>
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${isEditing ? 'w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl' : ''}`}>
        <div className="p-5">
          {isEditing && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Edit Task</h3>
              <button
                onClick={onCancel}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X size={20} />
              </button>
            </div>
          )}
          {!isEditing && <h3 className="font-semibold text-slate-900 mb-4">Request Help</h3>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {isEditing ? 'Task Title' : 'What do you need help with?'}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Drive Mom to doctor's appointment"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
                autoFocus={!isEditing}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value as HelpTaskCategory)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <select
                  value={formData.timeSlot}
                  onChange={(e) => updateField('timeSlot', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Est. Minutes</label>
                <input
                  type="number"
                  value={formData.estimatedMinutes}
                  onChange={(e) => updateField('estimatedMinutes', e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes {!isEditing && '(optional)'}</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Any details helpers should know..."
                rows={2}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                {isEditing ? 'Save Changes' : 'Post Request'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
