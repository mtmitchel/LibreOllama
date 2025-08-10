import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../ui/design-system/Button';
import { Card } from '../ui/design-system/Card';
import { Heading, Text } from '../ui';
import { useHeader } from '../../app/contexts/HeaderContext';
import { 
  Filter, 
  Plus, 
  Calendar as CalendarIcon, 
  List,
  LayoutGrid,
  Settings2,
  FileText,
  Download,
  Upload
} from 'lucide-react';

// Type definitions for the UnifiedHeader component
interface BreadcrumbItem {
  path: string;
  label: string;
}

interface PrimaryAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface SecondaryAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode; // Added icon property
  variant?: 'ghost' | 'secondary';
}

// UnifiedHeaderProps now only defines props not managed by HeaderContext
interface UnifiedHeaderProps {
  breadcrumb?: BreadcrumbItem[];
  // title: string; // Title will now come from HeaderContext
  subtitle?: string;
  primaryAction?: PrimaryAction;
  viewSwitcher?: React.ReactNode;
  secondaryActions?: SecondaryAction[];
}

export function UnifiedHeader({
  breadcrumb,
  subtitle,
  primaryAction,
  viewSwitcher,
  secondaryActions
}: UnifiedHeaderProps) {
  const { headerProps } = useHeader();
  const location = useLocation();
  const currentPath = location.pathname;

  // Don't show header for pages that have their own header
  const pagesWithCustomHeader = ['/mail', '/chat'];
  if (pagesWithCustomHeader.includes(currentPath)) {
    return null;
  }

  // Contextual headers for different pages
  const renderContextualHeader = () => {
    switch (currentPath) {
      case '/':
        // Dashboard - minimal header with actions
        return (
          <header className="border-border-default bg-surface/50 flex h-12 items-center justify-between border-b px-6 ">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <CalendarIcon size={16} className="mr-2" />
                Today
              </Button>
              <Button variant="ghost" size="sm">
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              <Settings2 size={16} className="mr-2" />
              Customize
            </Button>
          </header>
        );

      case '/calendar':
        // Calendar - date navigation and view controls
        return (
          <header className="border-border-default bg-surface/50 flex h-12 items-center justify-between border-b px-6 ">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">Today</Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon">←</Button>
                <Button variant="ghost" size="icon">→</Button>
              </div>
              <Text size="sm" weight="medium">January 2025</Text>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">Month</Button>
              <Button variant="ghost" size="sm">Week</Button>
              <Button variant="ghost" size="sm">Day</Button>
              <div className="bg-border-default mx-2 h-5 w-px" />
              <Button variant="primary" size="sm">
                <Plus size={16} className="mr-1" />
                New Event
              </Button>
            </div>
          </header>
        );

      case '/tasks':
        // Tasks - view toggle and filters
        return (
          <header className="border-border-default bg-surface/50 flex h-12 items-center justify-between border-b px-6 ">
            <div className="flex items-center gap-3">
              <div className="border-border-default flex items-center rounded-lg border bg-surface p-0.5">
                <Button variant="ghost" size="sm" className="rounded-md">
                  <LayoutGrid size={16} className="mr-1" />
                  Kanban
                </Button>
                <Button variant="ghost" size="sm" className="rounded-md">
                  <List size={16} className="mr-1" />
                  List
                </Button>
              </div>
              <Button variant="ghost" size="sm">
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
            </div>
            <Button variant="primary" size="sm">
              <Plus size={16} className="mr-1" />
              New Task
            </Button>
          </header>
        );

      case '/notes':
        // Notes - search and quick actions
        return (
          <header className="border-border-default bg-surface/50 flex h-12 items-center justify-between border-b px-6 ">
            <div className="flex max-w-2xl flex-1 items-center gap-3">
              <input
                id="notes-search-input"
                name="notesSearch"
                type="text"
                placeholder="Search notes..."
                aria-label="Search notes"
                className="flex-1 rounded-lg border px-3 py-1.5 asana-text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Upload size={16} className="mr-1" />
                Import
              </Button>
              <Button variant="primary" size="sm">
                <FileText size={16} className="mr-1" />
                New Note
              </Button>
            </div>
          </header>
        );

      case '/canvas':
        // Canvas - zoom controls and canvas selector
        return (
          <header className="border-border-default bg-surface/50 flex h-12 items-center justify-between border-b px-6 ">
            <div className="flex items-center gap-3">
              <select 
                id="canvas-selector"
                name="canvasSelector"
                aria-label="Select canvas"
                className="rounded-lg border bg-surface px-3 py-1.5 asana-text-sm"
                style={{
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              >
                <option>Canvas 1</option>
                <option>Canvas 2</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="border-border-default flex items-center gap-1 rounded-lg border bg-surface px-2 py-1">
                <Button variant="ghost" size="icon">-</Button>
                <Text size="sm" className="px-2">100%</Text>
                <Button variant="ghost" size="icon">+</Button>
              </div>
              <Button variant="ghost" size="sm">
                <Download size={16} className="mr-1" />
                Export
              </Button>
            </div>
          </header>
        );

      case '/projects':
        // Projects - view and filters
        return (
          <header className="border-border-default bg-surface/50 flex h-12 items-center justify-between border-b px-6 ">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                All Projects
              </Button>
              <Button variant="ghost" size="sm">
                Active
              </Button>
              <Button variant="ghost" size="sm">
                Archived
              </Button>
            </div>
            <Button variant="primary" size="sm">
              <Plus size={16} className="mr-1" />
              New Project
            </Button>
          </header>
        );

      case '/agents':
        // Agents - search and filter
        return (
          <header className="border-border-default bg-surface/50 flex h-12 items-center justify-between border-b px-6 ">
            <div className="flex max-w-md flex-1 items-center gap-3">
              <input
                type="text"
                placeholder="Search agents..."
                className="flex-1 rounded-lg border px-3 py-1.5 asana-text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
              <Button variant="primary" size="sm">
                <Plus size={16} className="mr-1" />
                Create Agent
              </Button>
            </div>
          </header>
        );

      case '/settings':
        // Settings - minimal header, just a subtle border
        return (
          <header className="border-border-default bg-surface/50 h-12 border-b " />
        );

      default:
        // Fallback - show nothing
        return null;
    }
  };

  return renderContextualHeader();
}

export default UnifiedHeader; 