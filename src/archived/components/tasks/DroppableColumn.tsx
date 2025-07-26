import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from "@dnd-kit/core";
import { Plus, MoreHorizontal, Edit2, Trash2, CheckCircle2, Circle, Tag, Calendar } from 'lucide-react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { DraggableTaskCard } from './DraggableTaskCard';
import { asanaTypography } from '../../constants/asanaDesignSystem';
import { KanbanTask } from '../../stores/useKanbanStore';

interface DroppableColumnProps {
  column: any;
  searchQuery?: string;
  onDeleteList?: (listId: string, listTitle: string) => void;
  onRenameList?: (listId: string, newTitle: string) => void;
  activeTask: KanbanTask | null;
  contextMenu: any;
  setContextMenu: any;
  editingTask: string | null;
  setEditingTask: (id: string | null) => void;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  onEditTask?: (task: KanbanTask, columnId: string) => void;
  inlineCreateTaskColumnId: string | null;
  setInlineCreateTaskColumnId: (id: string | null) => void;
  inlineTaskTitle: string;
  setInlineTaskTitle: (title: string) => void;
  inlineTaskTags: string[];
  setInlineTaskTags: (tags: string[]) => void;
  showInlineTagInput: boolean;
  setShowInlineTagInput: (show: boolean) => void;
  handleInlineTaskCreate: (columnId: string) => Promise<void>;
  cancelInlineCreate: () => void;
}

export const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  searchQuery,
  onDeleteList,
  onRenameList,
  activeTask,
  contextMenu,
  setContextMenu,
  editingTask,
  setEditingTask,
  editingTitle,
  setEditingTitle,
  onEditTask,
  inlineCreateTaskColumnId,
  setInlineCreateTaskColumnId,
  inlineTaskTitle,
  setInlineTaskTitle,
  inlineTaskTags,
  setInlineTaskTags,
  showInlineTagInput,
  setShowInlineTagInput,
  handleInlineTaskCreate,
  cancelInlineCreate
}) => {
  const { setNodeRef } = useDroppable({
    id: `column-${column.id}`,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [editingColumnTitle, setEditingColumnTitle] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState(column.title);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setShowColumnMenu(false);
      }
    };
    
    if (showColumnMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColumnMenu]);

  const { updateTask } = useKanbanStore();

  const handleSaveEdit = async (task: KanbanTask) => {
    if (editingTitle.trim() && editingTitle !== task.title) {
      try {
        await updateTask(column.id, task.id, {
          ...task,
          title: editingTitle.trim()
        });
      } catch (error) {
      }
    }
    setEditingTask(null);
    setEditingTitle('');
  };

  return (
    <div 
      ref={setNodeRef}
      className="w-80 flex flex-col group h-full"
      style={{ minWidth: '350px', maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border-2 border-solid" 
             style={{ borderColor: column.color || '#E8E8E9', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <div className="flex items-center gap-2 flex-1">
            {editingColumnTitle ? (
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onBlur={() => {
                  if (newColumnTitle.trim() && newColumnTitle !== column.title) {
                    onRenameList?.(column.id, newColumnTitle);
                    setNewColumnTitle(column.title); // Reset in case of error
                  }
                  setEditingColumnTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newColumnTitle.trim() && newColumnTitle !== column.title) {
                      onRenameList?.(column.id, newColumnTitle);
                      setNewColumnTitle(column.title); // Reset in case of error
                    }
                    setEditingColumnTitle(false);
                  } else if (e.key === 'Escape') {
                    setNewColumnTitle(column.title);
                    setEditingColumnTitle(false);
                  }
                }}
                className="px-2 py-1 border border-gray-300 rounded flex-1 w-full"
                style={{ ...asanaTypography.h2, fontWeight: 500, maxWidth: '200px' }}
                autoFocus
              />
            ) : (
              <>
                <h2 style={{ 
                  ...asanaTypography.h2, 
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#1e1f21'
                }}>
                  {column.title}
                </h2>
                <span 
                  style={{ 
                    fontSize: '16px',
                    color: '#6d6e6f',
                    fontWeight: 400
                  }}
                >
                  {column.tasks.length}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              style={{ color: '#6B6F76' }}
              onClick={() => setInlineCreateTaskColumnId(column.id)}
              title="Add task"
            >
              <Plus size={18} />
            </button>
            <div className="relative" ref={columnMenuRef}>
              <button 
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                style={{ color: '#6B6F76' }}
                onClick={() => setShowColumnMenu(!showColumnMenu)}
              >
                <MoreHorizontal size={18} />
              </button>
              
              {showColumnMenu && (
                <div 
                  className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  style={{ minWidth: '150px' }}
                >
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      setEditingColumnTitle(true);
                      setShowColumnMenu(false);
                    }}
                  >
                    <Edit2 size={14} />
                    Rename List
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                    onClick={() => {
                      onDeleteList?.(column.id, column.title);
                      setShowColumnMenu(false);
                    }}
                  >
                    <Trash2 size={14} />
                    Delete List
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Create Task Form */}
      {inlineCreateTaskColumnId === column.id && (
        <div className="mb-3 bg-white rounded-xl" style={{ 
          border: '2px solid #E8E8E9',
          padding: '12px 16px'
        }} data-inline-create-form>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="mt-0.5" style={{ color: '#B8B8B8' }} />
            <div className="flex-1">
              <input
                type="text"
                value={inlineTaskTitle}
                onChange={(e) => setInlineTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inlineTaskTitle.trim()) {
                    e.preventDefault();
                    handleInlineTaskCreate(column.id);
                  } else if (e.key === 'Escape') {
                    cancelInlineCreate();
                  }
                }}
                placeholder="Write a task name"
                className="w-full text-sm border-0 outline-none"
                style={{ 
                  color: '#1e1f21',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  lineHeight: '20px'
                }}
                autoFocus
                onBlur={(e) => {
                  // Only process blur if we're not clicking within the inline form
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  const isInlineFormClick = relatedTarget?.closest('[data-inline-create-form]');
                  if (!isInlineFormClick) {
                    if (inlineTaskTitle.trim()) {
                      // Save the task when clicking away if there's content
                      handleInlineTaskCreate(column.id);
                    } else {
                      // Cancel if empty
                      cancelInlineCreate();
                    }
                  }
                }}
              />
              <div className="flex items-center gap-4 mt-2">
                <button
                  className="flex items-center gap-1.5 text-xs rounded px-2 py-1 border border-dashed hover:bg-gray-50 transition-colors"
                  style={{ color: '#6B6F76', borderColor: '#DDD' }}
                  title="Priority"
                >
                  <Circle size={12} />
                  <span>Priority</span>
                </button>
                <button
                  className="flex items-center gap-1.5 text-xs rounded px-2 py-1 border border-dashed hover:bg-gray-50 transition-colors"
                  style={{ color: '#6B6F76', borderColor: '#DDD' }}
                  title="Tags"
                  onClick={() => setShowInlineTagInput(!showInlineTagInput)}
                  type="button"
                >
                  <Tag size={12} />
                  <span>Tags</span>
                  {inlineTaskTags.length > 0 && (
                    <span className="ml-1 text-xs" style={{ color: '#796EFF' }}>({inlineTaskTags.length})</span>
                  )}
                </button>
                <button
                  className="flex items-center gap-1 p-1 rounded hover:bg-gray-100 transition-colors"
                  style={{ color: '#6B6F76' }}
                  title="Due date"
                >
                  <Calendar size={14} />
                </button>
              </div>
            </div>
          </div>
          {/* Tags input section */}
          {showInlineTagInput && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E8E8E9' }}>
              <div className="flex flex-wrap gap-2 mb-2">
                {inlineTaskTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-md text-xs flex items-center gap-1"
                    style={{ backgroundColor: '#EDF1F5', color: '#796EFF' }}
                  >
                    {tag}
                    <button
                      onClick={() => setInlineTaskTags(inlineTaskTags.filter((_, i) => i !== index))}
                      className="hover:opacity-70"
                      style={{ marginLeft: '4px', fontSize: '14px' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add a tag..."
                className="w-full text-xs px-2 py-1 border-0 outline-none"
                style={{ backgroundColor: '#F6F7F8' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    e.preventDefault();
                    const newTag = e.currentTarget.value.trim();
                    if (!inlineTaskTags.includes(newTag)) {
                      setInlineTaskTags([...inlineTaskTags, newTag]);
                    }
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden pb-4">
        {column.tasks
          .filter((task: KanbanTask) => !searchQuery || 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.metadata?.labels?.some(label => label.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map((task: KanbanTask) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              columnId={column.id}
              isActive={activeTask?.id === task.id}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
              editingTask={editingTask}
              setEditingTask={setEditingTask}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              onSaveEdit={handleSaveEdit}
              onEditTask={onEditTask}
            />
          ))}
        
        {/* Show Add task link when inline form is active */}
        {inlineCreateTaskColumnId === column.id && (
          <button
            className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 rounded-lg"
            style={{ color: '#6B6F76' }}
            onClick={() => setInlineCreateTaskColumnId(column.id)}
          >
            + Add task
          </button>
        )}

        {/* Add card button - hide when inline create is active or when column has tasks */}
        {inlineCreateTaskColumnId !== column.id && column.tasks.length === 0 && (
          <button
            className="w-full p-3 rounded-xl transition-all flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: 'transparent',
              border: '2px dashed #DDD',
              fontSize: '14px',
              color: '#6B6F76',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F6F7F8';
              e.currentTarget.style.borderColor = '#C7CBCF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#DDD';
            }}
            onClick={() => setInlineCreateTaskColumnId(column.id)}
          >
            <Plus size={16} />
            Add task
          </button>
        )}
      </div>
    </div>
  );
};