import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useUnifiedTaskStore } from "../../stores/unifiedTaskStore";
import type { UnifiedTask } from "../../stores/unifiedTaskStore.types";
import { KanbanColumn } from "./KanbanColumn";
import { UnifiedTaskCard } from "../tasks/UnifiedTaskCard";
import { Button, Card } from "../ui";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import '../../styles/asana-design-system.css';
import { createTaskList } from "../../api/googleTasksApi";
import { realtimeSync } from "../../services/realtimeSync";

type KanbanTask = UnifiedTask;

interface KanbanBoardProps {
  className?: string;
  searchQuery?: string;
  onDeleteList?: (listId: string) => void;
  onRenameList?: (listId: string, newTitle: string) => void;
  onEditTask?: (taskId: string) => void;
  selectedTaskId?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  className = "", 
  searchQuery,
  onDeleteList,
  onRenameList,
  onEditTask,
  selectedTaskId 
}) => {
  const {
    columns: taskColumns,
    moveTask,
    isSyncing,
    getTasksByColumn,
  } = useUnifiedTaskStore();
  
  // Transform columns to old format
  const columns = taskColumns.map(col => ({
    id: col.id,
    title: col.title,
    tasks: getTasksByColumn(col.id),
    isLoading: false,
    error: undefined,
  }));
  
  const isInitialized = true;
  const error = null;
  const clearError = () => {};
  const initialize = () => {};

  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    })
  );

  // Initialize the kanban board
  useEffect(() => {
    if (!isInitialized) {
      // Initializing kanban board
      initialize();
    }
  }, [initialize, isInitialized]);


  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const taskId = active.id as string;

      // Find the task being dragged
      for (const column of columns) {
        const task = column.tasks.find((t) => t.id === taskId);
        if (task) {
          setActiveTask(task);
          setActiveColumn(column.id);
          break;
        }
      }
    },
    [columns]
  );

  // Handle drag over (for visual feedback)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // This could be used for visual feedback during drag
    // For now, we'll keep it simple
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveTask(null);
      setActiveColumn(null);

      if (!over || !activeColumn) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      // Determine the target column
      let targetColumnId: string;

      if (overId.startsWith("column-")) {
        // Dropped on a column
        targetColumnId = overId.replace("column-", "");
      } else {
        // Dropped on a task, find which column it belongs to
        const targetColumn = columns.find((col) =>
          col.tasks.some((task) => task.id === overId)
        );
        if (!targetColumn) return;
        targetColumnId = targetColumn.id;
      }

      // Only move if dropping in a different column
      console.log('Drag end:', { taskId, activeColumn, targetColumnId });
      if (activeColumn !== targetColumnId) {
        console.log('Moving task between columns...');
        try {
          await moveTask(taskId, targetColumnId);
          console.log('Move task completed');
        } catch (error) {
          console.error('Failed to move task:', error);
          alert(`Failed to move task: ${error}`);
        }
      } else {
        console.log('Same column, not moving');
      }
    },
    [activeColumn, columns, moveTask]
  );

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    setActiveColumn(null);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await initialize();
    } catch (error) {
      // Failed to refresh kanban board
    }
  }, [initialize]);

  const handleCreateList = async (title: string) => {
    if (!title.trim() || isCreatingList) return;
    
    setIsCreatingList(true);
    try {
      // Create the list in Google Tasks
      const newList = await createTaskList(title.trim());
      
      // If successful, sync to get the new list
      await realtimeSync.syncNow();
      
      setNewColumnTitle('');
      setIsAddingColumn(false);
    } catch (error) {
      console.error('Failed to create task list:', error);
      alert('Failed to create task list. Please check your Google account permissions.');
    } finally {
      setIsCreatingList(false);
    }
  };


  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="mb-4 text-red-600">
          <p className="font-medium">Error loading kanban board</p>
          <p className="text-sm">{error}</p>
        </div>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={clearError}>
            Dismiss
          </Button>
          <Button variant="primary" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted">Loading kanban board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-sidebar ${className}`}>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="h-full overflow-x-auto overflow-y-hidden asana-board-scroll" 
          style={{ 
            display: 'flex',
            padding: '24px',
            gap: '20px',
            alignItems: 'flex-start'
          }}
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              className=""
              searchQuery={searchQuery}
              onDelete={onDeleteList}
              onRename={onRenameList}
              onEditTask={onEditTask}
              selectedTaskId={selectedTaskId}
            />
          ))}
          
          {/* Add section button */}
          <div style={{ 
            minWidth: '200px',
            paddingTop: '4px'
          }}>
            {isAddingColumn ? (
              <div className="asana-column" style={{ padding: '16px' }}>
                <input
                  type="text"
                  placeholder="List name"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateList(newColumnTitle);
                    } else if (e.key === 'Escape') {
                      setNewColumnTitle('');
                      setIsAddingColumn(false);
                    }
                  }}
                  onBlur={() => {
                    handleCreateList(newColumnTitle);
                  }}
                  className="asana-input"
                  style={{ 
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 600,
                    padding: '8px 12px',
                    marginBottom: '8px'
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCreateList(newColumnTitle)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#F06A6A',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setNewColumnTitle('');
                      setIsAddingColumn(false);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      color: '#6B6F76',
                      border: '1px solid #E6E6E6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="whitespace-nowrap flex items-center gap-2 cursor-pointer"
                style={{ 
                  fontSize: '14px',
                  color: '#6B6F76',
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  border: '2px dashed rgba(0, 0, 0, 0.08)',
                  borderRadius: '8px',
                  width: '100%',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  fontWeight: 500
                }}
                onClick={() => setIsAddingColumn(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                  e.currentTarget.style.color = '#1E1E1F';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6B6F76';
                }}
              >
                <Plus size={18} strokeWidth={2} />
                <span>Add list</span>
              </button>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div style={{ transform: 'rotate(2deg) scale(1.05)', opacity: 0.95 }}>
              <UnifiedTaskCard
                task={activeTask}
                columnId={activeColumn || ""}
                onToggle={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                onDuplicate={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      </div>

      {/* Empty State */}
      {columns.length === 0 && (
        <div className="flex h-full min-h-96 items-center justify-center">
          <div className="mx-auto max-w-md px-6 text-center">
            <div className="from-primary/10 to-accent/10 mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br">
              <svg className="size-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-primary">
              Get organized with task lists
            </h3>
            <p className="mb-6 leading-relaxed text-muted">
              Create task lists to organize your work by project, priority, or any way that helps you stay focused.
            </p>
            <p className="text-sm text-muted">
              Click "New List" in the header to create your first task list.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
