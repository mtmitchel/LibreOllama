import React from 'react';
import { Edit2, Calendar, Copy, Flag, Trash2 } from 'lucide-react';
import { GoogleTask } from '../../../../types/google';
import { CalendarContextMenu } from '../types';
import { priorityConfig } from '../config';

interface TaskContextMenuProps {
  contextMenu: CalendarContextMenu | null;
  onEdit: (task: GoogleTask) => void;
  onSchedule: (task: GoogleTask) => void;
  onDuplicate: (task: GoogleTask) => void;
  onUpdatePriority: (task: GoogleTask, priority: string) => void;
  onDelete: (task: GoogleTask) => void;
  onClose: () => void;
}

export const TaskContextMenu: React.FC<TaskContextMenuProps> = ({
  contextMenu,
  onEdit,
  onSchedule,
  onDuplicate,
  onUpdatePriority,
  onDelete,
  onClose
}) => {
  if (!contextMenu) return null;

  return (
    <div
      className="context-menu fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        minWidth: '180px'
      }}
    >
      <button
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => {
          onEdit(contextMenu.task);
          onClose();
        }}
      >
        <Edit2 size={14} />
        Edit Task
      </button>
      
      <button
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => {
          onSchedule(contextMenu.task);
          onClose();
        }}
      >
        <Calendar size={14} />
        Schedule
      </button>
      
      <button
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => {
          onDuplicate(contextMenu.task);
          onClose();
        }}
      >
        <Copy size={14} />
        Duplicate
      </button>
      
      <div className="border-t border-gray-100 my-1" />
      
      <div className="px-4 py-1 text-xs text-gray-500 font-medium">Priority</div>
      {(['urgent', 'high', 'medium', 'low'] as const).map(priority => (
        <button
          key={priority}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          onClick={() => {
            onUpdatePriority(contextMenu.task, priority);
            onClose();
          }}
        >
          <Flag size={14} style={{ color: priorityConfig[priority]?.textColor || '#6B6F76' }} />
          {priorityConfig[priority]?.label || priority}
        </button>
      ))}
      
      <div className="border-t border-gray-100 my-1" />
      
      <button
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
        onClick={() => {
          onDelete(contextMenu.task);
          onClose();
        }}
      >
        <Trash2 size={14} />
        Delete Task
      </button>
    </div>
  );
};