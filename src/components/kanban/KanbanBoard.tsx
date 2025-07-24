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
import { Plus, RefreshCw } from "lucide-react";

interface KanbanBoardProps {
  className?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ className = "" }) => {
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
      {/* Header */}
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-2">
          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <RefreshCw size={14} className="animate-spin" />
              <span>Syncing...</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isSyncing}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

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
        <div className="flex gap-6 h-full overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              className="min-w-80 flex-shrink-0"
            />
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 opacity-95">
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw size={24} className="text-secondary" />
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">
              No task lists found
            </h3>
            <p className="text-muted mb-4">
              Click "Sync with Google" to load your Google Task lists
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
