/**
 * TasksAsanaClean Component - Unified Store Version
 * 
 * This is an example of how to migrate a component to use the unified store.
 * It demonstrates the simplified data access patterns and improved reactivity.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { Button } from '../../components/ui';
import { 
  LayoutGrid, List, RefreshCw, Plus, Search, X, ArrowUpDown, ChevronDown, 
  GripVertical, Calendar, Type, MoreHorizontal, CheckCircle2, MessageSquare, Circle,
  Edit, Edit2, Trash2, Copy, Tag, Clock, Flag
} from 'lucide-react';
import { useUnifiedTaskStore, useFilteredTasks, useSelectedList } from '../../stores/unifiedTaskStore';
import { UnifiedStoreMigration } from '../../components/UnifiedStoreMigration';

// Example of simplified task card using unified store
const UnifiedTaskCard: React.FC<{ 
  taskId: string; 
  listId: string;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ taskId, listId, onEdit, onDelete }) => {
  const store = useUnifiedTaskStore();
  const task = store.getTask(listId, taskId);
  
  if (!task || task.deleted) return null;
  
  const handleToggleComplete = async () => {
    await store.updateTask(listId, taskId, {
      status: task.status === 'completed' ? 'needsAction' : 'completed'
    });
  };
  
  const handleUpdatePriority = async (priority: typeof task.priority) => {
    await store.updateTask(listId, taskId, { priority });
  };
  
  return (
    <div className={`p-4 bg-white rounded-lg shadow-sm border ${
      task.isUpdating ? 'opacity-70' : ''
    } ${task.syncStatus === 'error' ? 'border-red-300' : 'border-gray-200'}`}>
      {/* Sync Status Indicator */}
      {task.syncStatus !== 'synced' && (
        <div className="mb-2 text-xs">
          {task.syncStatus === 'syncing' && (
            <span className="text-blue-600 flex items-center gap-1">
              <RefreshCw size={12} className="animate-spin" />
              Syncing...
            </span>
          )}
          {task.syncStatus === 'pending' && (
            <span className="text-yellow-600">Pending sync</span>
          )}
          {task.syncStatus === 'error' && (
            <span className="text-red-600">Sync error: {task.updateError}</span>
          )}
          {task.syncStatus === 'conflict' && (
            <span className="text-orange-600">Conflict - needs resolution</span>
          )}
        </div>
      )}
      
      {/* Task Content */}
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggleComplete}
          className="mt-1 flex-shrink-0"
          disabled={task.isUpdating}
        >
          {task.status === 'completed' ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <Circle size={20} className="text-gray-400" />
          )}
        </button>
        
        <div className="flex-1">
          <h4 className={`font-medium ${
            task.status === 'completed' ? 'line-through text-gray-500' : ''
          }`}>
            {task.title}
          </h4>
          
          {task.notes && (
            <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
          )}
          
          {/* Metadata - now part of the task object */}
          <div className="flex flex-wrap gap-2 mt-2">
            {task.labels.map(label => (
              <span key={label} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                {label}
              </span>
            ))}
            
            {task.priority !== 'normal' && (
              <span className={`px-2 py-1 text-xs rounded ${
                task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }`}>
                {task.priority}
              </span>
            )}
            
            {task.due && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                <Calendar size={12} />
                {new Date(task.due).toLocaleDateString()}
              </span>
            )}
          </div>
          
          {/* Subtasks */}
          {task.subtasks.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks completed
            </div>
          )}
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={task.isUpdating}
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-gray-100 rounded text-red-600"
            disabled={task.isUpdating}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main component using unified store
export const TasksAsanaCleanUnified: React.FC = () => {
  const { clearHeaderProps } = useHeader();
  const store = useUnifiedTaskStore();
  const selectedList = useSelectedList();
  const tasks = useFilteredTasks(selectedList?.id || '');
  
  const [showMigration, setShowMigration] = useState(false);
  
  useEffect(() => {
    clearHeaderProps();
  }, [clearHeaderProps]);
  
  // Handle sync
  const handleSync = async () => {
    await store.syncAll();
  };
  
  // Handle task creation
  const handleCreateTask = async () => {
    if (!selectedList) return;
    
    const title = prompt('Task title:');
    if (!title) return;
    
    await store.createTask({
      listId: selectedList.id,
      title,
      priority: 'normal',
      labels: [],
    });
  };
  
  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (!selectedList || !confirm('Delete this task?')) return;
    
    await store.deleteTask(selectedList.id, taskId);
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Tasks {store.features.useUnifiedStore && '(Unified Store)'}
          </h1>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowMigration(!showMigration)}
              className="text-sm"
            >
              Migration Tools
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={store.isSyncing}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={store.isSyncing ? 'animate-spin' : ''} />
              Sync
            </Button>
            
            <Button
              onClick={handleCreateTask}
              disabled={!selectedList}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Task
            </Button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tasks..."
              value={store.searchQuery}
              onChange={(e) => store.setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          
          <select
            value={store.filterBy.status || 'all'}
            onChange={(e) => store.setFilterBy({ 
              ...store.filterBy, 
              status: e.target.value as any 
            })}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Tasks</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          
          <select
            value={`${store.sortBy.field}-${store.sortBy.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              store.setSortBy({ field: field as any, direction: direction as any });
            }}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="due-asc">Due Date ↑</option>
            <option value="due-desc">Due Date ↓</option>
            <option value="priority-asc">Priority ↑</option>
            <option value="priority-desc">Priority ↓</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="updated-desc">Recently Updated</option>
          </select>
        </div>
      </div>
      
      {/* Migration Tools */}
      {showMigration && (
        <div className="border-b bg-gray-100">
          <UnifiedStoreMigration />
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 flex">
        {/* Lists Sidebar */}
        <div className="w-64 bg-white border-r p-4">
          <h3 className="font-medium mb-3">Lists</h3>
          <div className="space-y-1">
            {store.getOrderedLists().map(list => (
              <button
                key={list.id}
                onClick={() => store.selectList(list.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedList?.id === list.id 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{list.title}</span>
                  <span className="text-sm text-gray-500">
                    {Object.keys(list.tasks).length}
                  </span>
                </div>
                {list.syncStatus !== 'synced' && (
                  <span className="text-xs text-yellow-600">
                    {list.syncStatus}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tasks List */}
        <div className="flex-1 p-6">
          {!selectedList ? (
            <div className="text-center text-gray-500 mt-12">
              Select a list to view tasks
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-gray-500 mt-12">
              No tasks found
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <UnifiedTaskCard
                  key={task.id}
                  taskId={task.id}
                  listId={selectedList.id}
                  onEdit={() => {
                    // Open edit modal
                    alert(`Edit task: ${task.title}`);
                  }}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Sync Status Bar */}
      {store.isSyncing && (
        <div className="bg-blue-50 border-t px-6 py-2 text-sm text-blue-700">
          Syncing with Google Tasks...
        </div>
      )}
      
      {store.lastSyncError && (
        <div className="bg-red-50 border-t px-6 py-2 text-sm text-red-700">
          Sync error: {store.lastSyncError}
        </div>
      )}
      
      {/* Sync Progress */}
      {store.features.useUnifiedStore && (
        <div className="bg-gray-100 border-t px-6 py-2 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              {store.isOnline ? '🟢 Online' : '🔴 Offline'} | 
              Tasks: {store.getSyncProgress().synced}/{store.getSyncProgress().total} synced
            </span>
            <span>
              Pending: {store.getPendingSyncTasks().length} | 
              Conflicts: {store.getConflictedTasks().length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};