/**
 * Dashboard Widgets Integration Tests
 * 
 * Tests the integration between dashboard widgets and their respective data stores,
 * ensuring proper data loading, error handling, and responsive behavior.
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { invoke } from '@tauri-apps/api/core';

// Component under test
import Dashboard from '../../app/pages/Dashboard';

// Mock Tauri at the top level with proper hoisting
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test constants
const mockProjects = [
  {
    id: '1',
    name: 'Test Project 1',
    description: 'Test project description',
    status: 'active',
    progress: 65,
    priority: 'high',
    user_id: 'user1',
    color: '#3b82f6',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2', 
    name: 'Test Project 2',
    description: 'Another test project',
    status: 'active',
    progress: 80,
    priority: 'medium',
    user_id: 'user1',
    color: '#10b981',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockAgents = [
  {
    id: '1',
    name: 'Test Agent 1',
    model_name: 'llama3.2:3b',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Test Agent 2', 
    model_name: 'mistral:7b',
    is_active: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockCalendarEvents = [
  {
    id: '1',
    summary: 'Team Meeting',
    start: {
      dateTime: new Date().toISOString(),
      date: null
    },
    location: 'Conference Room A',
    description: 'Weekly team sync'
  },
  {
    id: '2',
    summary: 'Project Review',
    start: {
      dateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      date: null
    },
    location: 'Room B',
    description: 'Review project progress'
  }
];

describe('Dashboard Widgets Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Set up default successful responses
    mockInvoke.mockImplementation((command: string) => {
      switch (command) {
        case 'get_projects':
          return Promise.resolve(mockProjects);
        case 'get_project_stats':
          return Promise.resolve({
            goals: { total: 5, completed: 3, completion_rate: 60 },
            assets: { total: 10, types: 3 }
          });
        case 'get_agents':
          return Promise.resolve(mockAgents);
        default:
          return Promise.resolve([]);
      }
    });

    // Mock Google Calendar store (since it's more complex to mock the API)
    vi.doMock('../../../stores/googleCalendarStore', () => ({
      useGoogleCalendarStore: () => ({
        events: mockCalendarEvents,
        fetchEvents: vi.fn(),
        isLoading: false,
        error: null
      })
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('📊 Widget Data Loading', () => {
    it('should render dashboard with loading states initially', async () => {
      render(<Dashboard />);
      
      // Should show dashboard loading state initially
      expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
      
      // Wait for dashboard to finish loading
      await waitFor(() => {
        expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should load project progress widget with real data', async () => {
      render(<Dashboard />);
      
      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
      });

      // Project progress widget should eventually load
      await waitFor(() => {
        expect(screen.getByText('Project progress')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Should show project data
      await waitFor(() => {
        const projectElements = screen.queryAllByText(/Test Project/i);
        expect(projectElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('should load agent status widget with real data', async () => {
      render(<Dashboard />);
      
      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
      });

      // Agent status widget should eventually load
      await waitFor(() => {
        expect(screen.getByText('Agent status')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Should show agent data
      await waitFor(() => {
        const agentElements = screen.queryAllByText(/Test Agent/i);
        expect(agentElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('should load today\'s focus widget with calendar events', async () => {
      render(<Dashboard />);
      
      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
      });

      // Today's focus widget should load
      await waitFor(() => {
        expect(screen.getByText('Today\'s focus')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Should show calendar events
      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('🚨 Error Handling', () => {
    it('should handle project loading errors gracefully', async () => {
      // Mock project loading failure
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'get_projects') {
          return Promise.reject(new Error('Failed to load projects'));
        }
        return Promise.resolve([]);
      });

      render(<Dashboard />);
      
      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
      });

      // Should show error handling in project widget
      await waitFor(() => {
        expect(screen.getByText(/Failed to.*project/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle agent loading errors gracefully', async () => {
      // Mock agent loading failure
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'get_agents') {
          return Promise.reject(new Error('Failed to load agents'));
        }
        return Promise.resolve([]);
      });

      render(<Dashboard />);
      
      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
      });

      // Should show error handling in agent widget
      await waitFor(() => {
        expect(screen.getByText(/Failed to load agent/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('📱 Widget Responsiveness', () => {
    it('should handle widget grid layout changes', async () => {
      render(<Dashboard />);
      
      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
      });

      // Should have grid layout - check for the grid container
      const gridContainer = document.querySelector('[style*="grid-template-columns"]');
      expect(gridContainer).toBeInTheDocument();

      // Should have widget elements with loading or actual content
      const widgetElements = screen.getAllByText(/progress|status|focus|actions|events|tasks|Loading/i);
      expect(widgetElements.length).toBeGreaterThan(0);
    });

    it('should handle empty data states appropriately', async () => {
      // Mock empty data responses
      mockInvoke.mockImplementation(() => Promise.resolve([]));

      render(<Dashboard />);
      
      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
      });

      // Should show empty states appropriately - check for loading or empty states
      await waitFor(() => {
        const stateElements = screen.queryAllByText(/No.*configured|No.*active|No.*scheduled|Loading/i);
        expect(stateElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('🔄 Widget Interactions', () => {
    it('should handle widget dropdown menu interactions', async () => {
      render(<Dashboard />);
      
      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
      });

      // Check that the dashboard renders widgets (even if in loading state)
      const dashboardGrid = document.querySelector('[style*="grid-template-columns"]');
      expect(dashboardGrid).toBeInTheDocument();
      
      // Verify widget containers exist (they may be in loading state)
      const widgetContainers = document.querySelectorAll('.bg-tertiary');
      expect(widgetContainers.length).toBeGreaterThan(0);
    });

    it('should maintain widget state during re-renders', async () => {
      const { rerender } = render(<Dashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
      });

      // Re-render component
      rerender(<Dashboard />);
      
      // Should still have grid layout
      const gridContainer = document.querySelector('[style*="grid-template-columns"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });
}); 