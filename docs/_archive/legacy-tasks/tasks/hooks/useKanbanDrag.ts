import { useState, useCallback, useMemo } from 'react';
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useGoogleStore } from '../../../stores/googleStore';
import { useShallow } from 'zustand/react/shallow';
import type { HierarchicalTask, DragState } from '../types';

export function useKanbanDrag(
    kanbanColumns: any[], 
    pendingOperations: React.MutableRefObject<any[]>, 
    processQueue: () => void
) {
    const { taskIdToListId, optimisticMoveTask, optimisticReorderTask, activeAccount } = useGoogleStore(
        useShallow((state) => ({
            taskIdToListId: state.taskIdToListId,
            optimisticMoveTask: state.optimisticMoveTask,
            optimisticReorderTask: state.optimisticReorderTask,
            activeAccount: state.activeAccount,
        }))
    );

    // Create a flat task lookup for better performance
    const taskLookup = useMemo(() => {
        const lookup = new Map<string, HierarchicalTask>();
        
        const addTasksToLookup = (tasks: HierarchicalTask[]) => {
            for (const task of tasks) {
                lookup.set(task.id, task);
                if (task.children) {
                    addTasksToLookup(task.children);
                }
            }
        };
        
        kanbanColumns.forEach(column => {
            addTasksToLookup(column.tasks);
        });
        
        return lookup;
    }, [kanbanColumns]);

    const [dragState, setDragState] = useState<DragState>({
        activeTask: null,
        sourceListId: null,
    });

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const sourceListId = taskIdToListId.get(active.id as string);
        const task = taskLookup.get(active.id as string);

        if (task && sourceListId) {
            setDragState({
                activeTask: task,
                sourceListId: sourceListId,
            });
        }
    }, [taskLookup, taskIdToListId]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        
        const activeId = active.id as string;
        const overId = over.id as string;
        const sourceListId = dragState.sourceListId;
        
        const overIsAColumn = kanbanColumns.some(c => c.taskList.id === overId);
        
        const targetListId = overIsAColumn ? overId : taskIdToListId.get(overId);

        if (!sourceListId || !targetListId) return;

        if (sourceListId !== targetListId) {
            optimisticMoveTask(activeId, sourceListId, targetListId);
            setDragState(prev => ({ ...prev, sourceListId: targetListId }));
        } else {
            // Only reorder if we're not dragging over a column
            if(!overIsAColumn) {
                optimisticReorderTask(sourceListId, activeId, overId);
            }
        }
    }, [dragState.sourceListId, kanbanColumns, optimisticMoveTask, optimisticReorderTask, taskIdToListId]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (over && active.id !== over.id && dragState.activeTask && activeAccount) {
            const { activeTask, sourceListId } = dragState;

            // Determine target list ID
            const overIsColumn = kanbanColumns.some(c => c.taskList.id === over.id);
            const targetListId = overIsColumn ? over.id as string : taskIdToListId.get(over.id as string);
            
            if (targetListId && sourceListId) {
                let previous: string | undefined;

                // For reordering within same list or moving to different list
                if (!overIsColumn) {
                    // Dropping on a task - use that task as the previous reference
                    previous = over.id as string;
                } else {
                    // Dropping on a column - add to the end
                    const targetColumn = kanbanColumns.find(c => c.taskList.id === targetListId);
                    if (targetColumn && targetColumn.tasks.length > 0) {
                        previous = targetColumn.tasks[targetColumn.tasks.length - 1].id;
                    }
                }

                pendingOperations.current.push({
                    id: `${activeTask.id}-${Date.now()}`,
                    taskId: activeTask.id,
                    accountId: activeAccount.id,
                    sourceListId: sourceListId,
                    targetListId: targetListId,
                    previous: previous,
                    timestamp: Date.now(),
                    originalTask: activeTask
                });
                
                // Process queue immediately instead of using setTimeout
                processQueue();
            }
        }
        
        setDragState({ activeTask: null, sourceListId: null });
    }, [dragState, kanbanColumns, processQueue, taskIdToListId, pendingOperations, activeAccount]);

    return {
        dragState,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
    };
} 