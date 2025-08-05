import React from 'react';
import { CheckCircle2, Circle, Calendar as CalendarIcon, Flag } from 'lucide-react';
import { GoogleTask } from '../../../../types/google';
import { useUnifiedTaskStore } from '../../../../stores/unifiedTaskStore';
import { asanaTypography, priorityConfig } from '../config';
import { parseGoogleTaskDate, formatTaskDate } from '../../../../utils/dateUtils';

interface AsanaTaskItemProps {
  task: GoogleTask;
  onToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSchedule: () => void;
  onContextMenu: (e: React.MouseEvent, task: GoogleTask) => void;
}

export const AsanaTaskItem: React.FC<AsanaTaskItemProps> = ({ 
  task, 
  onToggle, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onSchedule, 
  onContextMenu 
}) => {
  const { getTaskByGoogleId, tasks } = useUnifiedTaskStore();
  const unifiedTask = getTaskByGoogleId(task.id) || tasks[task.id];
  const priority = unifiedTask?.priority || 'normal';
  
  return (
    <div 
      className="draggable-task p-3 transition-all cursor-pointer"
      style={{ 
        backgroundColor: 'transparent'
      }}
      data-task={JSON.stringify(task)}
      onClick={(e) => {
        // Open edit modal on click (unless clicking on checkbox or button)
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('input')) {
          onEdit();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, task);
      }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="flex-shrink-0 mt-0.5"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 size={18} style={{ color: '#14A085' }} />
          ) : (
            <Circle size={18} style={{ color: '#DDD' }} />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 
            style={{ 
              ...asanaTypography.body,
              fontWeight: 500,
              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
              color: task.status === 'completed' ? '#9CA3AF' : '#151B26'
            }}
          >
            {task.title}
          </h4>
          
          {task.notes && (
            <p style={{ ...asanaTypography.small, marginTop: '4px' }}>
              {task.notes}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            {task.due && (
              <div className="flex items-center gap-1.5">
                <CalendarIcon size={12} style={{ color: '#9CA6AF' }} />
                <span style={asanaTypography.small}>
                  {formatTaskDate(parseGoogleTaskDate(task.due))}
                </span>
              </div>
            )}
            
            {priority !== 'none' && (
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: priorityConfig[priority as keyof typeof priorityConfig]?.bgColor || '#F3F4F6',
                  color: priorityConfig[priority as keyof typeof priorityConfig]?.textColor || '#6B6F76'
                }}
              >
                <Flag size={10} />
                <span style={{ fontSize: '11px', fontWeight: 500 }}>
                  {priorityConfig[priority as keyof typeof priorityConfig]?.label || priority}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};