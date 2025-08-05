import { useState, useRef } from 'react';
import type { GoogleTask } from '../../../../types/google';
import type { CalendarContextMenu } from '../types/calendar';

type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'work_week';

export interface CalendarState {
  // Refs
  calendarRef: React.MutableRefObject<any>;
  calendarContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  
  // View state
  view: CalendarView;
  setView: React.Dispatch<React.SetStateAction<CalendarView>>;
  currentViewTitle: string;
  setCurrentViewTitle: React.Dispatch<React.SetStateAction<string>>;
  currentCalendarDate: Date;
  setCurrentCalendarDate: React.Dispatch<React.SetStateAction<Date>>;
  
  // Modal state
  showEventModal: boolean;
  setShowEventModal: React.Dispatch<React.SetStateAction<boolean>>;
  showTaskModal: boolean;
  setShowTaskModal: React.Dispatch<React.SetStateAction<boolean>>;
  showDeleteTaskDialog: boolean;
  setShowDeleteTaskDialog: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Selection state
  selectedDateInfo: any;
  setSelectedDateInfo: React.Dispatch<React.SetStateAction<any>>;
  selectedEvent: any;
  setSelectedEvent: React.Dispatch<React.SetStateAction<any>>;
  selectedColumnId: string;
  setSelectedColumnId: React.Dispatch<React.SetStateAction<string>>;
  
  // Task state
  editingTask: GoogleTask | null;
  setEditingTask: React.Dispatch<React.SetStateAction<GoogleTask | null>>;
  taskToDelete: GoogleTask | null;
  setTaskToDelete: React.Dispatch<React.SetStateAction<GoogleTask | null>>;
  
  // UI state
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isRefreshing: boolean;
  setIsRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  contextMenu: CalendarContextMenu | null;
  setContextMenu: React.Dispatch<React.SetStateAction<CalendarContextMenu | null>>;
  
  // Sidebar state
  showTasksSidebar: boolean;
  setShowTasksSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTaskListId: string;
  setSelectedTaskListId: React.Dispatch<React.SetStateAction<string>>;
  showInlineCreator: boolean;
  setShowInlineCreator: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCalendarState(): CalendarState {
  // Refs
  const calendarRef = useRef<any>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  
  // View state
  const [view, setView] = useState<CalendarView>('month');
  const [currentViewTitle, setCurrentViewTitle] = useState<string>('Calendar');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  // Modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
  
  // Selection state
  const [selectedDateInfo, setSelectedDateInfo] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('all');
  
  // Task state
  const [editingTask, setEditingTask] = useState<GoogleTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<GoogleTask | null>(null);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<CalendarContextMenu | null>(null);
  
  // Sidebar state
  const [showTasksSidebar, setShowTasksSidebar] = useState(true);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('all');
  const [showInlineCreator, setShowInlineCreator] = useState(false);
  
  return {
    // Refs
    calendarRef,
    calendarContainerRef,
    
    // View state
    view,
    setView,
    currentViewTitle,
    setCurrentViewTitle,
    currentCalendarDate,
    setCurrentCalendarDate,
    
    // Modal state
    showEventModal,
    setShowEventModal,
    showTaskModal,
    setShowTaskModal,
    showDeleteTaskDialog,
    setShowDeleteTaskDialog,
    
    // Selection state
    selectedDateInfo,
    setSelectedDateInfo,
    selectedEvent,
    setSelectedEvent,
    selectedColumnId,
    setSelectedColumnId,
    
    // Task state
    editingTask,
    setEditingTask,
    taskToDelete,
    setTaskToDelete,
    
    // UI state
    searchQuery,
    setSearchQuery,
    isRefreshing,
    setIsRefreshing,
    error,
    setError,
    contextMenu,
    setContextMenu,
    
    // Sidebar state
    showTasksSidebar,
    setShowTasksSidebar,
    selectedTaskListId,
    setSelectedTaskListId,
    showInlineCreator,
    setShowInlineCreator,
  };
}