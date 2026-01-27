import React from 'react';
import { Hand, CheckCircle, Clock, AlertCircle, User as UserIcon, Pencil } from 'lucide-react';
import { HelpTask, User } from '../../types';
import { CATEGORY_CONFIG } from './constants';

interface TaskCardProps {
  task: HelpTask;
  users: User[];
  currentUser: User;
  isExpanded: boolean;
  today: string;
  onToggleExpand: (taskId: string | null) => void;
  onClaimTask: (task: HelpTask) => void;
  onCompleteAndLog: (task: HelpTask) => void;
  onUnclaimTask: (taskId: string) => void;
  onEditTask: (task: HelpTask) => void;
}

const getStatusBadge = (task: HelpTask) => {
  switch (task.status) {
    case 'available':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <Hand size={12} /> Open
        </span>
      );
    case 'claimed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          <Clock size={12} /> Claimed
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle size={12} /> Done
        </span>
      );
    case 'missed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
          <AlertCircle size={12} /> Missed
        </span>
      );
  }
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  currentUser,
  isExpanded,
  today,
  onToggleExpand,
  onClaimTask,
  onCompleteAndLog,
  onUnclaimTask,
  onEditTask
}) => {
  const config = CATEGORY_CONFIG[task.category];
  const Icon = config.icon;
  const isClaimedByMe = task.claimedByUserId === currentUser.id;
  const isOverdue = task.date < today && task.status !== 'completed';

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  return (
    <div
      className={`bg-white rounded-xl border transition-all ${
        isOverdue ? 'border-red-200' : 'border-slate-200'
      } ${isExpanded ? 'shadow-md' : 'shadow-sm hover:shadow-md'}`}
    >
      {/* Main row - always visible */}
      <button
        onClick={() => onToggleExpand(isExpanded ? null : task.id)}
        className="w-full p-4 text-left flex items-center gap-3"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgClass}`}>
          <Icon size={20} className={config.textClass} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`font-medium truncate ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
              {task.title}
            </span>
            {isOverdue && <span className="text-xs text-red-500 font-medium">Overdue</span>}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{task.timeSlot}</span>
            {task.estimatedMinutes && <span>• ~{task.estimatedMinutes}m</span>}
          </div>
        </div>

        {getStatusBadge(task)}
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 mt-0">
          {task.description && (
            <p className="text-sm text-slate-600 mt-3 mb-3">{task.description}</p>
          )}

          {task.claimedByUserId && (
            <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
              <UserIcon size={14} />
              {isClaimedByMe ? 'You claimed this' : `Claimed by ${getUserName(task.claimedByUserId).split(' ')[0]}`}
            </p>
          )}

          <p className="text-xs text-slate-400 mb-3">
            Posted by {getUserName(task.createdByUserId).split(' ')[0]}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {task.status === 'available' && (
              <button
                onClick={(e) => { e.stopPropagation(); onClaimTask(task); }}
                className="btn-primary px-4 py-2 text-sm"
              >
                I'll do this
              </button>
            )}
            {task.status === 'claimed' && isClaimedByMe && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onCompleteAndLog(task); }}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Complete & Log
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onUnclaimTask(task.id); }}
                  className="btn-muted px-4 py-2 text-sm"
                >
                  Unclaim
                </button>
              </>
            )}
            {task.status !== 'completed' && (
              <button
                onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                className="btn-muted px-4 py-2 text-sm"
              >
                <Pencil size={14} />
                Edit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
