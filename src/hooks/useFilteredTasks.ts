import { useMemo } from 'react';
import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';

export function useFilteredTasks(selectedListId: string = 'all') {
  const columns = useUnifiedTaskStore(state => state.columns);
  const tasks = useUnifiedTaskStore(state => state.tasks);
  const showCompleted = useUnifiedTaskStore(state => state.showCompleted);
  
  return useMemo(() => {
    console.log('🔍 useFilteredTasks computing, showCompleted:', showCompleted, 'selectedListId:', selectedListId);
    
    return columns
      .filter(column => selectedListId === 'all' || column.id === selectedListId)
      .flatMap(column => {
        const colTasks = column.taskIds
          .map(id => tasks[id])
          .filter(Boolean);
          
        const visibleTasks = showCompleted
          ? colTasks
          : colTasks.filter(task => task.status !== 'completed');
          
        return visibleTasks.map(task => ({ 
          ...task, 
          columnId: column.id, 
          columnTitle: column.title 
        }));
      });
  }, [columns, tasks, showCompleted, selectedListId]);
}