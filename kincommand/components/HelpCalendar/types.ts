import { HelpTaskCategory } from '../../types';

export interface TaskFormData {
  title: string;
  description: string;
  category: HelpTaskCategory;
  date: string;
  timeSlot: string;
  estimatedMinutes: string;
}

export type ViewMode = 'list' | 'calendar';
export type FilterStatus = 'all' | 'available' | 'mine' | 'completed';

export const DEFAULT_FORM_DATA: TaskFormData = {
  title: '',
  description: '',
  category: 'other',
  date: new Date().toISOString().split('T')[0],
  timeSlot: 'Flexible',
  estimatedMinutes: ''
};
