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
import { useKanbanStore, KanbanTask } from "../../stores/useKanbanStore";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { Button, Card } from "../ui";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useGoogleTasksStore } from "../../stores/googleTasksStore";

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
    columns,
    initialize,
    isInitialized,
    isSyncing,
    error,
    moveTask,
    clearError,
  } = useKanbanStore();

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
      if (activeColumn !== targetColumnId) {
        try {
          await moveTask(taskId, activeColumn, targetColumnId);
        } catch (error) {
          // Failed to move task
        }
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
        <div className="text-red-600 mb-4">
          <p className="font-medium">Error loading kanban board</p>
          <p className="text-sm">{error}</p>
        </div>
        <div className="flex gap-2 justify-center">
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading kanban board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
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
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              className="flex-1 min-w-80"
              onDelete={onDeleteList}
              onRename={onRenameList}
            />
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 opacity-95 scale-105 shadow-2xl">
              <KanbanTaskCard
                task={activeTask}
                isDragging={true}
                columnId={activeColumn || ""}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {columns.length === 0 && (
        <div className="flex items-center justify-center h-full min-h-96">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary mb-3">
              Get organized with task lists
            </h3>
            <p className="text-muted mb-6 leading-relaxed">
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
