import { useGoogleTasksStore } from '../stores/googleTasksStore';
import { useKanbanStore } from '../stores/useKanbanStore';

export const debugStoreState = () => {
  if (process.env.NODE_ENV === 'development') {
    const googleStore = useGoogleTasksStore.getState();
    const kanbanStore = useKanbanStore.getState();
    
    console.group('🔍 Store State Debug');
    console.log('GoogleTasksStore:', {
      taskListsCount: googleStore.taskLists.length,
      tasksPerList: Object.entries(googleStore.tasks).map(([listId, tasks]) => ({
        listId,
        taskCount: tasks.length,
        tasksWithMetadata: tasks.filter(t => t.metadata).length
      }))
    });
    
    console.log('KanbanStore:', {
      columnsCount: kanbanStore.columns.length,
      tasksPerColumn: kanbanStore.columns.map(col => ({
        columnId: col.id,
        title: col.title,
        taskCount: col.tasks.length,
        tasksWithMetadata: col.tasks.filter(t => t.metadata).length
      }))
    });
    console.groupEnd();
  }
};