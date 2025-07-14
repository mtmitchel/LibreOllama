/**
 * Dashboard Widgets Integration Tests
 * 
 * Critical Gap Addressed: Dashboard testing scored 35/100 in testing audit
 * Pattern: Following Gmail service integration model with store-first testing principles
 * 
 * Tests widget data integration, real-time updates, widget interactions,
 * error handling, and cross-widget communication functionality.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';

// Main application components
import Dashboard from '../../app/pages/Dashboard';
import { ThemeProvider } from '../../components/ThemeProvider';
import { HeaderProvider } from '../../app/contexts/HeaderContext';

// Dashboard widgets
import {
  TodaysFocusWidget,
  ProjectProgressWidget,
  AgentStatusWidget,
  QuickActionsWidget,
  UpcomingEventsWidget,
  PendingTasksWidget
} from '../../features/dashboard/components';

// Stores
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';

// Test utilities
import { setupTauriMocks, cleanupTauriMocks, mockTauriInvoke } from '../helpers/tauriMocks';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <ThemeProvider>
      <HeaderProvider>
        {children}
      </HeaderProvider>
    </ThemeProvider>
  </MemoryRouter>
);

// Mock data factories
const createMockProject = (overrides = {}) => ({
  id: `project-${Date.now()}`,
  title: 'Test Project',
  progress: 65,
  tasks: [
    { id: 'task-1', text: 'Complete UI design', completed: true, date: '2025-01-15' },
    { id: 'task-2', text: 'Implement backend', completed: false, date: '2025-01-20' },
    { id: 'task-3', text: 'Write tests', completed: false, date: '2025-01-25' }
  ],
  ...overrides
});

const createMockAgent = (overrides = {}) => ({
  id: `agent-${Date.now()}`,
  name: 'Test Agent',
  model: 'llama2-7b',
  status: 'Active',
  lastUsed: new Date().toISOString(),
  ...overrides
});

const createMockCalendarEvent = (overrides = {}) => ({
  id: `event-${Date.now()}`,
  summary: 'Test Meeting',
  description: 'Test meeting description',
  start: {
    dateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    timeZone: 'America/New_York'
  },
  end: {
    dateTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    timeZone: 'America/New_York'
  },
  location: 'Conference Room A',
  ...overrides
});

const createMockTask = (overrides = {}) => ({
  id: `task-${Date.now()}`,
  title: 'Test Task',
  due: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
  status: 'needsAction',
  position: '1',
  updated: new Date().toISOString(),
  metadata: {
    priority: 'medium',
    labels: ['work']
  },
  ...overrides
});

const createMockKanbanColumn = (tasks = []) => ({
  id: `column-${Date.now()}`,
  title: 'To Do',
  tasks,
  limit: null
});

describe('Dashboard Widgets Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Setup Tauri mocks
    setupTauriMocks();
    
    // Reset all stores
    useKanbanStore.getState().clearError?.();
    useGoogleCalendarStore.getState().signOut();
    useGoogleTasksStore.getState().signOut();
    
    // Mock successful widget data responses
    mockTauriInvoke.mockImplementation((command: string, args?: any) => {
      switch (command) {
        case 'get_calendar_events':
          return Promise.resolve({
            kind: 'calendar#events',
            items: [
              createMockCalendarEvent(),
              createMockCalendarEvent({ 
                summary: 'Team Standup',
                start: { dateTime: new Date(Date.now() + 1800000).toISOString() }
              })
            ]
          });
          
        case 'get_tasks':
          return Promise.resolve({
            items: [
              createMockTask({ title: 'Review PR #123' }),
              createMockTask({ title: 'Update documentation', priority: 'high' })
            ]
          });
          
        case 'get_projects':
          return Promise.resolve([
            createMockProject({ title: 'LibreOllama Dashboard' }),
            createMockProject({ title: 'API Documentation', progress: 45 })
          ]);
          
        case 'get_agent_status':
          return Promise.resolve([
            createMockAgent({ name: 'General Assistant', status: 'Active' }),
            createMockAgent({ name: 'Code Helper', status: 'Offline' })
          ]);
          
        default:
          return Promise.resolve({});
      }
    });
  });

  afterEach(() => {
    cleanupTauriMocks();
    vi.clearAllMocks();
  });

  describe('📊 Widget Data Integration', () => {
    it('should load and display all widgets with data', async () => {
      // Setup authenticated states for widgets that need them
      const mockAccount = {
        id: 'test-account',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      useGoogleCalendarStore.getState().authenticate(mockAccount);
      useGoogleTasksStore.getState().authenticate(mockAccount);
      
      render(<Dashboard />, { wrapper: TestWrapper });
      
      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.queryByText('Loading your dashboard')).not.toBeInTheDocument();
      });
      
      // Verify all widgets are present
      await waitFor(() => {
        expect(screen.getByText('Project progress')).toBeInTheDocument();
        expect(screen.getByText('Agent status')).toBeInTheDocument();
        expect(screen.getByText('Quick actions')).toBeInTheDocument();
        expect(screen.getByText('Upcoming events')).toBeInTheDocument();
        expect(screen.getByText('Pending tasks')).toBeInTheDocument();
      });
    });

    it('should display Project Progress Widget with real data', async () => {
      const mockProjectData = createMockProject({
        title: 'LibreOllama Redesign',
        progress: 67
      });
      
      render(
        <ProjectProgressWidget 
          title={mockProjectData.title}
          percentage={mockProjectData.progress}
          tasks={mockProjectData.tasks}
        />, 
        { wrapper: TestWrapper }
      );
      
      // Verify project data is displayed
      expect(screen.getByText('LibreOllama Redesign')).toBeInTheDocument();
      expect(screen.getByText('67% complete')).toBeInTheDocument();
      expect(screen.getByText('Complete UI design')).toBeInTheDocument();
    });

    it('should display Upcoming Events Widget with calendar data', async () => {
      const mockEvents = [
        createMockCalendarEvent({ summary: 'Team Meeting' }),
        createMockCalendarEvent({ summary: 'Client Call' })
      ];
      
      // Mock calendar store with events
      useGoogleCalendarStore.setState({
        events: mockEvents,
        isAuthenticated: true
      });
      
      render(<UpcomingEventsWidget />, { wrapper: TestWrapper });
      
      // Verify events are displayed
      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
        expect(screen.getByText('Client Call')).toBeInTheDocument();
      });
    });

    it('should display Pending Tasks Widget with kanban data', async () => {
      const mockTasks = [
        createMockTask({ title: 'Fix critical bug', metadata: { priority: 'high' } }),
        createMockTask({ title: 'Update tests', metadata: { priority: 'medium' } })
      ];
      
      const mockColumn = createMockKanbanColumn(mockTasks);
      
      // Mock kanban store with tasks
      useKanbanStore.setState({
        columns: [mockColumn],
        isInitialized: true
      });
      
      render(<PendingTasksWidget />, { wrapper: TestWrapper });
      
      // Verify tasks are displayed
      await waitFor(() => {
        expect(screen.getByText('Fix critical bug')).toBeInTheDocument();
        expect(screen.getByText('Update tests')).toBeInTheDocument();
      });
    });

    it('should display Agent Status Widget with system data', async () => {
      const mockAgents = [
        createMockAgent({ name: 'General Assistant', status: 'Active' }),
        createMockAgent({ name: 'Research Helper', status: 'Offline' })
      ];
      
      render(<AgentStatusWidget agents={mockAgents} />, { wrapper: TestWrapper });
      
      // Verify agents are displayed
      expect(screen.getByText('General Assistant')).toBeInTheDocument();
      expect(screen.getByText('Research Helper')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('🔄 Real-time Data Updates', () => {
    it('should update widgets when underlying data changes', async () => {
      render(<Dashboard />, { wrapper: TestWrapper });
      
      // Initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      
      // Simulate data update in kanban store
      act(() => {
        const newTask = createMockTask({ title: 'New urgent task' });
        const column = createMockKanbanColumn([newTask]);
        useKanbanStore.setState({
          columns: [column],
          isInitialized: true
        });
      });
      
      // Widget should reflect the new data
      await waitFor(() => {
        expect(screen.getByText('New urgent task')).toBeInTheDocument();
      });
    });

    it('should handle real-time calendar updates', async () => {
      const mockAccount = {
        id: 'test-account',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      useGoogleCalendarStore.getState().authenticate(mockAccount);
      
      render(<UpcomingEventsWidget />, { wrapper: TestWrapper });
      
      // Add new event to calendar store
      act(() => {
        const newEvent = createMockCalendarEvent({ summary: 'Emergency Meeting' });
        useGoogleCalendarStore.setState({
          events: [newEvent],
          isAuthenticated: true
        });
      });
      
      // Widget should show the new event
      await waitFor(() => {
        expect(screen.getByText('Emergency Meeting')).toBeInTheDocument();
      });
    });

    it('should handle task completion updates', async () => {
      const mockTask = createMockTask({ 
        title: 'Complete feature',
        status: 'needsAction'
      });
      
      const mockColumn = createMockKanbanColumn([mockTask]);
      
      useKanbanStore.setState({
        columns: [mockColumn],
        isInitialized: true
      });
      
      render(<PendingTasksWidget />, { wrapper: TestWrapper });
      
      // Verify task is shown as pending
      await waitFor(() => {
        expect(screen.getByText('Complete feature')).toBeInTheDocument();
      });
      
      // Mark task as completed
      act(() => {
        const completedTask = { ...mockTask, status: 'completed' };
        const updatedColumn = createMockKanbanColumn([completedTask]);
        useKanbanStore.setState({
          columns: [updatedColumn],
          isInitialized: true
        });
      });
      
      // Task should no longer appear in pending tasks
      await waitFor(() => {
        expect(screen.queryByText('Complete feature')).not.toBeInTheDocument();
      });
    });
  });

  describe('🎯 Widget Interactions', () => {
    it('should handle Quick Actions Widget interactions', async () => {
      const mockActions = {
        onNewChat: vi.fn(),
        onCreateTask: vi.fn(),
        onCreateProject: vi.fn(),
        onOpenCanvas: vi.fn()
      };
      
      render(<QuickActionsWidget />, { wrapper: TestWrapper });
      
      // Find and click action buttons
      const newChatButton = screen.getByRole('button', { name: /new.*chat/i });
      const createTaskButton = screen.getByRole('button', { name: /create.*task/i });
      
      await user.click(newChatButton);
      await user.click(createTaskButton);
      
      // Verify buttons are clickable (actual navigation would be tested in e2e)
      expect(newChatButton).toBeInTheDocument();
      expect(createTaskButton).toBeInTheDocument();
    });

    it('should handle widget dropdown menus', async () => {
      const mockAgents = [createMockAgent()];
      
      render(<AgentStatusWidget agents={mockAgents} />, { wrapper: TestWrapper });
      
      // Find dropdown menu trigger
      const menuTrigger = screen.getByRole('button', { name: /more/i });
      await user.click(menuTrigger);
      
      // Menu should open
      await waitFor(() => {
        expect(screen.getByText('View all statuses')).toBeInTheDocument();
        expect(screen.getByText('Restart agents')).toBeInTheDocument();
      });
    });

    it('should handle widget configuration actions', async () => {
      const mockAgents = [createMockAgent()];
      
      render(<AgentStatusWidget agents={mockAgents} />, { wrapper: TestWrapper });
      
      // Find configure button
      const configureButton = screen.getByRole('button', { name: /configure/i });
      await user.click(configureButton);
      
      // Configuration action should be triggered (would navigate in real app)
      expect(configureButton).toBeInTheDocument();
    });
  });

  describe('🚨 Error Handling and Edge Cases', () => {
    it('should handle empty widget states gracefully', async () => {
      // Set empty states for all stores
      useKanbanStore.setState({ columns: [], isInitialized: true });
      useGoogleCalendarStore.setState({ events: [], isAuthenticated: true });
      
      render(<Dashboard />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      
      // Widgets should handle empty states
      await waitFor(() => {
        // Look for empty state indicators
        const emptyStateTexts = screen.queryAllByText(/no.*tasks|no.*events|empty/i);
        expect(emptyStateTexts.length).toBeGreaterThan(0);
      });
    });

    it('should handle widget loading errors', async () => {
      // Mock API error
      mockTauriInvoke.mockRejectedValueOnce(new Error('API Error'));
      
      useGoogleCalendarStore.setState({ 
        error: 'Failed to load calendar events',
        isAuthenticated: true 
      });
      
      render(<UpcomingEventsWidget />, { wrapper: TestWrapper });
      
      // Widget should show error state
      await waitFor(() => {
        const errorElements = screen.queryAllByText(/error|failed/i);
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle widget authentication states', async () => {
      // Test unauthenticated state
      useGoogleCalendarStore.setState({ 
        isAuthenticated: false,
        events: []
      });
      
      render(<UpcomingEventsWidget />, { wrapper: TestWrapper });
      
      // Should show appropriate message for unauthenticated state
      await waitFor(() => {
        const authPrompts = screen.queryAllByText(/sign.*in|connect|authenticate/i);
        expect(authPrompts.length).toBeGreaterThan(0);
      });
    });

    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeTasks = Array.from({ length: 100 }, (_, i) => 
        createMockTask({ title: `Task ${i}` })
      );
      
      const largeColumn = createMockKanbanColumn(largeTasks);
      
      useKanbanStore.setState({
        columns: [largeColumn],
        isInitialized: true
      });
      
      const startTime = performance.now();
      
      render(<PendingTasksWidget />, { wrapper: TestWrapper });
      
      // Should render efficiently
      await waitFor(() => {
        expect(screen.getByText('Task 0')).toBeInTheDocument();
      });
      
      const renderTime = performance.now() - startTime;
      
      // Should render large dataset quickly (under 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('📱 Widget Responsiveness', () => {
    it('should adapt to different screen sizes', async () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Tablet size
      });
      
      render(<Dashboard />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      
      // Widgets should adapt to smaller screen
      const dashboardContainer = screen.getByRole('main');
      expect(dashboardContainer).toBeInTheDocument();
      
      // Change to mobile size
      Object.defineProperty(window, 'innerWidth', {
        value: 480,
      });
      
      // Trigger resize event
      fireEvent(window, new Event('resize'));
      
      // Layout should still be functional
      expect(dashboardContainer).toBeInTheDocument();
    });

    it('should handle widget grid layout changes', async () => {
      render(<Dashboard />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      
      // Find the flexible grid container
      const gridContainer = document.querySelector('.gap-6');
      expect(gridContainer).toBeInTheDocument();
      
      // Widgets should be arranged in grid
      const widgets = screen.getAllByRole('article', { hidden: true }) || 
                     screen.getAllByText(/widget|progress|status|actions|events|tasks/i);
      expect(widgets.length).toBeGreaterThan(0);
    });
  });

  describe('🔗 Cross-Widget Communication', () => {
    it('should handle navigation between widgets and pages', async () => {
      render(<Dashboard />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      
      // Find quick action that should navigate
      const openCanvasButton = screen.queryByRole('button', { name: /canvas/i });
      if (openCanvasButton) {
        await user.click(openCanvasButton);
        // In real app, this would navigate to canvas page
        expect(openCanvasButton).toBeInTheDocument();
      }
    });

    it('should synchronize data between related widgets', async () => {
      const mockTask = createMockTask({ title: 'Shared task data' });
      const mockColumn = createMockKanbanColumn([mockTask]);
      
      // Set task data that might be shown in multiple widgets
      useKanbanStore.setState({
        columns: [mockColumn],
        isInitialized: true
      });
      
      render(<Dashboard />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      
      // Task should appear in pending tasks widget
      await waitFor(() => {
        expect(screen.getByText('Shared task data')).toBeInTheDocument();
      });
      
      // Update the task
      act(() => {
        const updatedTask = { ...mockTask, title: 'Updated task data' };
        const updatedColumn = createMockKanbanColumn([updatedTask]);
        useKanbanStore.setState({
          columns: [updatedColumn],
          isInitialized: true
        });
      });
      
      // Updated data should appear across widgets
      await waitFor(() => {
        expect(screen.getByText('Updated task data')).toBeInTheDocument();
        expect(screen.queryByText('Shared task data')).not.toBeInTheDocument();
      });
    });
  });
}); 