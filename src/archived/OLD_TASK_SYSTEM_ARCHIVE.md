# Old Task System Archive

This directory contains the archived files from the old three-store task management system that was replaced by the unified task store implementation in January 2025.

## Why These Were Archived

The old system had critical architectural flaws:
- **Fragmented State**: Data split across 3 stores caused race conditions
- **ID Instability**: Temporary IDs changing to Google IDs caused React remounts and metadata loss
- **Sync Feedback Loops**: Two-loop sync logic caused exponential task duplication
- **Deletion Failures**: Tasks would resurrect after deletion due to sync issues

## Archived Files

### Stores
- `stores/old-task-system/taskMetadataStore.archived.ts` - Handled custom metadata (labels, priority)
- `stores/old-task-system/googleTasksStore.archived.ts` - Managed Google Tasks API data cache
- `stores/old-task-system/taskMetadataStore.old.ts` - Previous version of metadata store

### Services  
- `services/old-task-system/kanbanGoogleTasksSync.archived.ts` - Flawed two-loop sync service

### Hooks
- `hooks/old-task-system/useGoogleTasks.archived.ts` - Hook for Google Tasks integration

### Components
- `pages/Tasks.tsx` - Old tasks page implementation (already archived)

## Migration Status

These files are preserved for reference but should NOT be used. The new unified system provides:
- `stores/unifiedTaskStore.ts` - Single source of truth
- `services/realtimeSync.ts` - Improved sync without duplication
- `stores/migrationAdapter.ts` - Backward compatibility layer

## Important Notes

1. **DO NOT USE THESE FILES** - They contain the flawed architecture
2. The migration adapter provides compatibility for existing components
3. New code should use the unified store directly
4. These files can be deleted once all components are migrated

## See Also

- `/docs/TASK_SYSTEM_UNIFIED_STORE_IMPLEMENTATION.md` - New architecture documentation
- `/src/stores/unifiedTaskStore.ts` - New implementation
- `/src/services/realtimeSync.ts` - New sync service