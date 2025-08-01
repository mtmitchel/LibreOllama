import React, { useEffect, useRef, useState } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!contextMenu || !menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let x = contextMenu.x;
    let y = contextMenu.y;
    
    // Check if menu would go off the right edge
    if (x + menuRect.width > windowWidth - 10) {
      x = windowWidth - menuRect.width - 10;
    }
    
    // Check if menu would go off the bottom edge
    if (y + menuRect.height > windowHeight - 10) {
      y = windowHeight - menuRect.height - 10;
    }
    
    // Ensure menu doesn't go off the left or top
    x = Math.max(10, x);
    y = Math.max(10, y);
    
    setPosition({ x, y });
  }, [contextMenu]);

  if (!contextMenu) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
      style={{
        left: position.x,
        top: position.y,
        minWidth: '160px'
      }}
    >
      <button
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => {
          onEdit(contextMenu.task);
          onClose();
        }}
      >
        <Edit2 size={14} />
        Edit Task
      </button>
      
      <button
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => {
          onSchedule(contextMenu.task);
          onClose();
        }}
      >
        <Calendar size={14} />
        Schedule
      </button>
      
      <button
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => {
          onDuplicate(contextMenu.task);
          onClose();
        }}
      >
        <Copy size={14} />
        Duplicate
      </button>
      
      <div className="border-t border-gray-100 my-1" />
      
      <div className="px-3 py-1 text-xs text-gray-500 font-medium">Priority</div>
      {(['urgent', 'high', 'low'] as const).map(priority => (
        <button
          key={priority}
          className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          onClick={() => {
            onUpdatePriority(contextMenu.task, priority);
            onClose();
          }}
        >
          <Flag size={14} className={
            priority === 'urgent' ? 'text-red-500' :
            priority === 'high' ? 'text-orange-500' :
            'text-blue-500'
          } />
          {priority === 'urgent' ? 'Urgent' :
           priority === 'high' ? 'High' :
           'Low'}
        </button>
      ))}
      
      <div className="border-t border-gray-200 mt-1 pt-1" />
      
      <button
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
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