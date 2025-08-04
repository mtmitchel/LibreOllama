import { useMemo } from 'react';
import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';
import type { UnifiedTask } from '../stores/unifiedTaskStore.types';

interface FilteredColumn {
  id: string;
  title: string;
  tasks: UnifiedTask[];
  isLoading: boolean;
  error: undefined;
}

export function useFilteredColumns(): FilteredColumn[] {
  const columns = useUnifiedTaskStore(state => state.columns);
  const tasks = useUnifiedTaskStore(state => state.tasks);
  const showCompletedByList = useUnifiedTaskStore(state => state.showCompletedByList);
  const globalShowCompleted = useUnifiedTaskStore(state => state.showCompleted);
  
  return useMemo(() => {
    console.log('🔍 useFilteredColumns computing');
    
    return columns.map(col => {
      const showCompleted = showCompletedByList[col.id] ?? globalShowCompleted;
      console.log('🔍 useFilteredColumns - Column:', col.id, 'showCompleted:', showCompleted);
      
      const colTasks = col.taskIds
        .map(id => tasks[id])
        .filter(Boolean);
      
      const completedTasks = colTasks.filter(task => task.status === 'completed');
      const incompleteTasks = colTasks.filter(task => task.status !== 'completed');
      
      const visibleTasks = showCompleted 
        ? colTasks 
        : incompleteTasks;
        
      console.log('📊 Column', col.id, 'has', colTasks.length, 'total tasks,', completedTasks.length, 'completed,', incompleteTasks.length, 'incomplete,', visibleTasks.length, 'visible');
        
      return {
        id: col.id,
        title: col.title,
        tasks: visibleTasks,
        isLoading: false,
        error: undefined,
      };
    });
  }, [columns, tasks, showCompletedByList, globalShowCompleted]);
}