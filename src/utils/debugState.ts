import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';

export const debugStoreState = () => {
  if (process.env.NODE_ENV === 'development') {
    const unifiedStore = useUnifiedTaskStore.getState();
    
    console.group('🔍 Store State Debug');
    console.log('UnifiedTaskStore:', {
      columnsCount: unifiedStore.columns.length,
      totalTasks: unifiedStore.tasks.length,
      columns: unifiedStore.columns.map(col => ({
        id: col.id,
        title: col.title,
        taskCount: unifiedStore.getTasksByColumn(col.id).length,
        googleTaskListId: col.googleTaskListId
      })),
      tasksByStatus: {
        synced: unifiedStore.tasks.filter(t => t.syncState === 'synced').length,
        pendingCreate: unifiedStore.tasks.filter(t => t.syncState === 'pending_create').length,
        pendingUpdate: unifiedStore.tasks.filter(t => t.syncState === 'pending_update').length,
        pendingDelete: unifiedStore.tasks.filter(t => t.syncState === 'pending_delete').length,
        error: unifiedStore.tasks.filter(t => t.syncState === 'error').length
      },
      syncEnabled: unifiedStore.syncEnabled,
      isInitialized: unifiedStore.isInitialized
    });
    console.groupEnd();
  }
};