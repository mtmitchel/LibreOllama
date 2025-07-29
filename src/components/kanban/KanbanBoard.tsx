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

type KanbanTask = UnifiedTask;

interface KanbanBoardProps {
  className?: string;
  searchQuery?: string;
  onDeleteList?: (listId: string) => void;
  onRenameList?: (listId: string, newTitle: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  className = "", 
  searchQuery,
  onDeleteList,
  onRenameList 
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
    <div className={`h-full bg-white ${className}`}>
      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="flex h-full gap-6 overflow-x-auto px-6 py-6">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              className="w-[340px] flex-shrink-0"
              searchQuery={searchQuery}
              onDelete={onDeleteList}
              onRename={onRenameList}
            />
          ))}
          
          {/* Add section button */}
          <button
            className="h-10 px-4 text-[13px] text-neutral-600 hover:text-neutral-800 hover:underline whitespace-nowrap flex items-center gap-1 cursor-pointer relative z-10"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement add section functionality
              console.log('Add section clicked');
              alert('Add section functionality not yet implemented');
            }}
          >
            <Plus size={16} />
            <span>Add section</span>
          </button>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 scale-105 opacity-95 shadow-2xl">
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
