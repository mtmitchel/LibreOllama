import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { mapTaskFromDB, mapTaskToDB } from '@/lib/dataMappers';
import { useAuth } from './use-auth';
import type { TaskItem, KanbanColumn, TaskStatus } from '@/lib/types';
import { useToast } from './use-toast';

interface UseTasksResult {
  tasks: TaskItem[];
  kanbanColumns: KanbanColumn[];
  loading: boolean;
  error: string | null;
  createTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TaskItem | null>;
  updateTask: (task: TaskItem) => Promise<TaskItem | null>;
  updateTaskStatus: (id: string, newStatus: TaskStatus) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  getTaskById: (id: string) => TaskItem | undefined;
  refreshTasks: () => Promise<void>;
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([
    { id: 'todo', title: 'To do', tasks: [] },
    { id: 'inprogress', title: 'In progress', tasks: [] },
    { id: 'done', title: 'Done', tasks: [] },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentUserId } = useAuth();
  const { toast } = useToast();

  // Helper function to organize tasks into kanban columns
  const organizeTasksIntoColumns = (tasksList: TaskItem[]) => {
    const columns: KanbanColumn[] = [
      { id: 'todo', title: 'To do', tasks: [] },
      { id: 'inprogress', title: 'In progress', tasks: [] },
      { id: 'done', title: 'Done', tasks: [] },
    ];
    
    // Populate columns with tasks
    tasksList.forEach(task => {
      const columnIndex = columns.findIndex(col => col.id === task.status);
      if (columnIndex !== -1) {
        columns[columnIndex].tasks.push(task);
      }
    });
    
    // Sort tasks by priority (high first) and then by due date
    columns.forEach(column => {
      column.tasks.sort((a, b) => {
        // First sort by priority (high, medium, low)
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const aPriority = a.priority ? priorityOrder[a.priority] : 3; // No priority goes last
        const bPriority = b.priority ? priorityOrder[b.priority] : 3;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Then sort by due date (soonest first)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        
        // Tasks with due dates come before tasks without
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        
        // Finally sort by created date
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    });
    
    return columns;
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', getCurrentUserId())
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      const mappedTasks: TaskItem[] = data.map(mapTaskFromDB);
      
      setTasks(mappedTasks);
      setKanbanColumns(organizeTasksIntoColumns(mappedTasks));
    } catch (err: any) {
      console.error('Error fetching tasks:', err.message);
      setError(err.message);
      toast({
        title: 'Error fetching tasks',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    // Set up real-time subscription for tasks
    const tasksSubscription = supabase
      .channel('public:tasks')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `user_id=eq.${getCurrentUserId()}`
      }, (payload) => {
        // For simplicity, just refetch all tasks when anything changes
        fetchTasks();
      })
      .subscribe();
      
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(tasksSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createTask = async (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskItem | null> => {
    try {
      const now = new Date().toISOString();
      const taskToCreate: TaskItem = {
        ...taskData,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      
      const dbTask = mapTaskToDB(taskToCreate);
      dbTask.user_id = getCurrentUserId();
      
      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert(dbTask)
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      const createdTask = mapTaskFromDB(data);
      
      // Update local state
      setTasks(prevTasks => [createdTask, ...prevTasks]);
      setKanbanColumns(organizeTasksIntoColumns([createdTask, ...tasks]));
      
      toast({
        title: 'Task created',
        description: `"${createdTask.title}" has been added to ${createdTask.status}.`,
      });
      
      return createdTask;
    } catch (err: any) {
      console.error('Error creating task:', err.message);
      setError(err.message);
      toast({
        title: 'Error creating task',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTask = async (task: TaskItem): Promise<TaskItem | null> => {
    try {
      const now = new Date().toISOString();
      const taskToUpdate = {
        ...task,
        updatedAt: now,
      };
      
      const dbTask = mapTaskToDB(taskToUpdate);
      dbTask.user_id = getCurrentUserId();
      
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description || null,
          status: task.status,
          priority: task.priority || null,
          due_date: task.dueDate || null,
          tags: task.tags || null,
          updated_at: now,
        })
        .eq('id', task.id)
        .eq('user_id', getCurrentUserId())
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      const updatedTask = mapTaskFromDB(data);
      
      // Update local state
      const updatedTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
      setTasks(updatedTasks);
      setKanbanColumns(organizeTasksIntoColumns(updatedTasks));
      
      toast({
        title: 'Task updated',
        description: `"${updatedTask.title}" has been updated.`,
      });
      
      return updatedTask;
    } catch (err: any) {
      console.error('Error updating task:', err.message);
      setError(err.message);
      toast({
        title: 'Error updating task',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTaskStatus = async (id: string, newStatus: TaskStatus): Promise<boolean> => {
    try {
      const task = getTaskById(id);
      if (!task) {
        throw new Error('Task not found');
      }
      
      const now = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: now,
        })
        .eq('id', id)
        .eq('user_id', getCurrentUserId());
      
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      const updatedTask = { ...task, status: newStatus, updatedAt: now };
      const updatedTasks = tasks.map(t => t.id === id ? updatedTask : t);
      setTasks(updatedTasks);
      setKanbanColumns(organizeTasksIntoColumns(updatedTasks));
      
      toast({
        title: 'Task moved',
        description: `"${task.title}" has been moved to ${newStatus}.`,
      });
      
      return true;
    } catch (err: any) {
      console.error('Error updating task status:', err.message);
      setError(err.message);
      toast({
        title: 'Error moving task',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      // Get the task title before deleting for the toast message
      const taskToDelete = getTaskById(id);
      
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', getCurrentUserId());
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Update local state
      const updatedTasks = tasks.filter(task => task.id !== id);
      setTasks(updatedTasks);
      setKanbanColumns(organizeTasksIntoColumns(updatedTasks));
      
      toast({
        title: 'Task deleted',
        description: taskToDelete 
          ? `"${taskToDelete.title}" has been deleted.` 
          : 'Task has been deleted.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting task:', err.message);
      setError(err.message);
      toast({
        title: 'Error deleting task',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getTaskById = (id: string): TaskItem | undefined => {
    return tasks.find(task => task.id === id);
  };

  const refreshTasks = async (): Promise<void> => {
    await fetchTasks();
  };

  return {
    tasks,
    kanbanColumns,
    loading,
    error,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getTaskById,
    refreshTasks,
  };
} 