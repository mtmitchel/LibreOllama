import React, { useCallback, useState, useRef, useEffect } from 'react';
import { DragOverlay, DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { Plus, Edit, Trash2, Flag } from 'lucide-react';
import { useKanbanStore, KanbanTask } from '../../stores/useKanbanStore';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import { DroppableColumn } from './DroppableColumn';
import { asanaTypography, priorityConfig, columnColors } from '../../constants/asanaDesignSystem';

interface AsanaKanbanBoardProps {
  searchQuery?: string;
  onDeleteList?: (listId: string, listTitle: string) => void;
  onRenameList?: (listId: string, newTitle: string) => void;
  onAddList?: () => void;
  activeTask: KanbanTask | null;
  contextMenu: { x: number; y: number; task: KanbanTask; columnId: string } | null;
  setContextMenu: (menu: { x: number; y: number; task: KanbanTask; columnId: string } | null) => void;
  openEditTaskModal?: (task: KanbanTask, columnId: string) => void;
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
  activeAccount: any;
  isAuthenticated: boolean;
}

export const AsanaKanbanBoard: React.FC<AsanaKanbanBoardProps> = ({ 
  searchQuery,
  onDeleteList,
  onRenameList,
  onAddList,
  activeTask,
  contextMenu,
  setContextMenu,
  openEditTaskModal,
  inlineCreateTaskColumnId,
  setInlineCreateTaskColumnId,
  inlineTaskTitle,
  setInlineTaskTitle,
  inlineTaskTags,
  setInlineTaskTags,
  showInlineTagInput,
  setShowInlineTagInput,
  handleInlineTaskCreate,
  cancelInlineCreate,
  activeAccount,
  isAuthenticated
}) => {
  const { columns, updateTask, deleteTask } = useKanbanStore();
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  
  const dynamicColumns = columns.map((column, index) => ({
    ...column,
    color: columnColors[index % columnColors.length]
  }));

  const handleDeleteTask = async (taskId: string, columnId: string) => {
    try {
      
      // Get the task to find its Google Task ID
      const column = columns.find(c => c.id === columnId);
      const task = column?.tasks.find(t => t.id === taskId);
      
      if (!task) {
        return;
      }
      
      
      // Delete from local Kanban store first (optimistic deletion)
      await deleteTask(columnId, taskId);
      setContextMenu(null);
      
      // Then delete from Google Tasks if it has a Google Task ID
      if (task?.metadata?.googleTaskId && activeAccount && isAuthenticated) {
        const { deleteTask: deleteGoogleTask, taskLists, syncAllTasks } = useGoogleTasksStore.getState();
        
        // Log available task lists
        
        // Since columnId should be the Google Task List ID, use it directly
        const googleTaskListId = columnId;
        
        
        try {
          await deleteGoogleTask(googleTaskListId, task.metadata.googleTaskId);
          
          // Don't sync immediately - let the periodic sync handle it
          // This prevents race conditions where Google hasn't fully processed the deletion
        } catch (googleError) {
          
          // Check if this is a refresh token error
          const errorMessage = googleError instanceof Error ? googleError.message : String(googleError);
          const isAuthError = errorMessage.includes('No refresh token available') || 
                             errorMessage.includes('Failed to get or refresh tokens');
          
          if (isAuthError) {
            // Re-add the task to local store since deletion failed
            const { createTask: createLocalTask } = useKanbanStore.getState();
            await createLocalTask(columnId, task);
            
            // Inform user they need to re-authenticate
            alert(
              'Your Google authentication has expired. Please go to Settings > Integrations and reconnect your Google account to continue syncing tasks.'
            );
          } else {
            // Re-add the task to local store if Google deletion failed for other reasons
            const { createTask: createLocalTask } = useKanbanStore.getState();
            await createLocalTask(columnId, task);
            alert('Failed to delete task from Google Tasks. The task has been restored.');
          }
        }
      }
    } catch (error) {
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleUpdatePriority = async (task: KanbanTask, columnId: string, priority: 'low' | 'normal' | 'high' | 'urgent') => {
    try {
      await updateTask(columnId, task.id, {
        ...task,
        metadata: {
          labels: task.metadata?.labels || [],
          priority: priority,
          subtasks: task.metadata?.subtasks || [],
          recurring: task.metadata?.recurring,
          googleTaskId: task.metadata?.googleTaskId,
          lastGoogleSync: task.metadata?.lastGoogleSync
        }
      });
      setContextMenu(null);
    } catch (error) {
    }
  };

  return (
    <>
      <div className="flex-1 overflow-x-auto h-full">
        <div className="flex gap-5 px-8 py-6 h-full items-start" style={{ minWidth: 'fit-content' }}>
          {dynamicColumns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              searchQuery={searchQuery}
              onDeleteList={onDeleteList}
              onRenameList={onRenameList}
              activeTask={activeTask}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
              editingTask={editingTask}
              setEditingTask={setEditingTask}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              onEditTask={openEditTaskModal}
              inlineCreateTaskColumnId={inlineCreateTaskColumnId}
              setInlineCreateTaskColumnId={setInlineCreateTaskColumnId}
              inlineTaskTitle={inlineTaskTitle}
              setInlineTaskTitle={setInlineTaskTitle}
              inlineTaskTags={inlineTaskTags}
              setInlineTaskTags={setInlineTaskTags}
              showInlineTagInput={showInlineTagInput}
              setShowInlineTagInput={setShowInlineTagInput}
              handleInlineTaskCreate={handleInlineTaskCreate}
              cancelInlineCreate={cancelInlineCreate}
            />
          ))}
          
          {/* Add List Button */}
          <div className="w-80 flex-shrink-0" style={{ minWidth: '350px', alignSelf: 'flex-start', marginTop: '0' }}>
            <button
              onClick={onAddList}
              className="w-full text-left px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center gap-2 group"
              style={{
                fontSize: '16px',
                fontWeight: 500,
                color: '#6d6e6f'
              }}
            >
              <Plus size={18} className="group-hover:text-gray-700" />
              <span className="group-hover:text-gray-700">Add list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
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
              openEditTaskModal?.(contextMenu.task, contextMenu.columnId);
              setContextMenu(null);
            }}
          >
            <Edit size={14} />
            Edit Task
          </button>
          
          <div className="border-t border-gray-100 my-1" />
          
          <div className="px-4 py-1 text-xs text-gray-500 font-medium">Priority</div>
          {(['urgent', 'high', 'normal', 'low'] as const).map(priority => (
            <button
              key={priority}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={() => handleUpdatePriority(contextMenu.task, contextMenu.columnId, priority)}
            >
              <Flag size={14} style={{ color: priorityConfig[priority]?.textColor || '#6B6F76' }} />
              {priorityConfig[priority]?.label || priority}
              {contextMenu.task.metadata?.priority === priority && ' ✓'}
            </button>
          ))}
          
          <div className="border-t border-gray-100 my-1" />
          
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTask(contextMenu.task.id, contextMenu.columnId);
            }}
          >
            <Trash2 size={14} />
            Delete Task
          </button>
        </div>
      )}
    </>
  );
};