import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, X, Filter, Plus, MoreHorizontal, ChevronLeft,
  Folder, FileText, CheckSquare, Image as ImageIcon, Calendar, 
  Mail as MailIcon, MessageSquare, Users, LayoutGrid, List, Star,
  Clock, ChevronUp, ChevronDown, Eye, EyeOff
} from 'lucide-react';
import { Button } from '../../components/ui/design-system/Button';
import { Card } from '../../components/ui/design-system/Card';
import { Badge } from '../../components/ui/badge';
import { ActionMenu } from '../../components/ui/design-system/Dropdown';
import { useHeader } from '../contexts/HeaderContext';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { useSpacesStore } from '../../stores/spacesStore';
import { SimpleDialog as Dialog } from '../../components/ui/design-system';
import { Input, Tabs, TabsList, TabsTrigger } from '../../components/ui';

// Icons per unified item type
const typeIconMap = {
  note: FileText,
  task: CheckSquare,
  canvas: ImageIcon,
  calendar: Calendar,
  mail: MailIcon,
  chat: MessageSquare,
  agent: Users,
} as const;

type UnifiedItem = { 
  id: string; 
  type: 'note' | 'task' | 'canvas' | 'calendar' | 'mail' | 'chat' | 'agent'; 
  title: string; 
  subtitle?: string; 
  updatedAt?: number;
  starred?: boolean;
};

type ViewMode = 'grid' | 'list';
type ItemFilter = 'all' | 'notes' | 'tasks' | 'canvas' | 'calendar' | 'mail' | 'chats' | 'agents';
type SortBy = 'name' | 'type' | 'updated' | 'created';
type SortOrder = 'asc' | 'desc';

export default function SpaceDetail() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { clearHeaderProps } = useHeader();
  const { getSpace, updateSpace, deleteSpace: deleteSpaceFromStore } = useSpacesStore();
  
  // Main state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ItemFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [showSpaceActions, setShowSpaceActions] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const spaceActionsRef = useRef<HTMLDivElement>(null);
  
  // Get space data from store
  const space = spaceId ? getSpace(spaceId) : null;
  
  // Get data from stores
  const tasksState = useUnifiedTaskStore((s) => s.tasks);
  const eventsState = useGoogleCalendarStore((s) => s.events);
  
  // Notes state via store getState (not a hook)
  const notesState = (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useNotesStore } = require('../../features/notes/store');
      return useNotesStore.getState().notes as Array<any>;
    } catch {
      return [] as Array<any>;
    }
  })();
  
  // Build unified items list - filtered by space label
  const unifiedItems: UnifiedItem[] = useMemo(() => {
    if (!space) return [];
    const items: UnifiedItem[] = [];
    const spaceLabel = space.name.toLowerCase();
    
    // Add tasks - only those with matching space label
    Object.values(tasksState || {}).forEach((t: any) => {
      // Check if task has labels and if any match the space name
      const hasSpaceLabel = t.labels && t.labels.some((label: any) => {
        const labelName = typeof label === 'string' ? label : label.name;
        return labelName.toLowerCase() === spaceLabel;
      });
      
      if (hasSpaceLabel) {
        items.push({ 
          id: `task:${t.id}`, 
          type: 'task', 
          title: t.title || 'Untitled task', 
          subtitle: formatTaskMeta(t), 
          updatedAt: Date.parse(t.updated || new Date().toISOString()),
          starred: t.starred || false
        });
      }
    });
    
    // Add notes - only those with matching space label
    (notesState || []).forEach((n: any) => {
      // Check if note has tags/labels that match the space name
      const hasSpaceLabel = n.tags && n.tags.some((tag: string) => 
        tag.toLowerCase() === spaceLabel
      );
      
      if (hasSpaceLabel) {
        items.push({ 
          id: `note:${n.id}`, 
          type: 'note', 
          title: n.title || 'Untitled note', 
          subtitle: new Date(n.metadata?.updatedAt || Date.now()).toLocaleString(), 
          updatedAt: Date.parse(n.metadata?.updatedAt || new Date().toISOString()),
          starred: n.starred || false
        });
      }
    });
    
    // Add calendar events - only those with matching space label in title or description
    getTodaysEvents(eventsState || []).forEach((ev: any) => {
      // Check if event title or description contains space name as a tag
      const eventText = `${ev.summary || ''} ${ev.description || ''}`.toLowerCase();
      const hasSpaceLabel = eventText.includes(`#${spaceLabel}`) || 
                           eventText.includes(`[${spaceLabel}]`);
      
      if (hasSpaceLabel) {
        items.push({ 
          id: `event:${ev.id}`, 
          type: 'calendar', 
          title: ev.summary || 'Untitled event', 
          subtitle: formatEventTimeRange(ev), 
          updatedAt: Date.now(),
          starred: false
        });
      }
    });
    
    return items;
  }, [space, tasksState, notesState, eventsState]);
  
  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = unifiedItems;
    
    // Apply type filter
    if (filter !== 'all') {
      const filterMap: Record<ItemFilter, UnifiedItem['type']> = {
        notes: 'note',
        tasks: 'task',
        canvas: 'canvas',
        calendar: 'calendar',
        mail: 'mail',
        chats: 'chat',
        agents: 'agent',
        all: 'note' // Won't be used
      };
      filtered = filtered.filter(item => item.type === filterMap[filter]);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.subtitle?.toLowerCase().includes(query)
      );
    }
    
    // Apply label filter if applicable
    if (selectedLabels.length > 0) {
      // TODO: Implement label filtering when labels are added to items
    }
    
    // Sort with order
    filtered.sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return dir * a.title.localeCompare(b.title);
        case 'type':
          return dir * a.type.localeCompare(b.type);
        case 'updated':
        case 'created':
          return dir * ((a.updatedAt || 0) - (b.updatedAt || 0));
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [unifiedItems, filter, searchQuery, selectedLabels, sortBy, sortOrder]);
  
  // Recent items (for grid view)
  const recentItems = useMemo(() => {
    return filteredItems.slice(0, 8);
  }, [filteredItems]);
  
  // Starred items
  const starredItems = useMemo(() => {
    return filteredItems.filter(item => item.starred);
  }, [filteredItems]);
  
  useEffect(() => {
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);
  
  // Handle click outside for filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node) &&
          filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    
    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilterDropdown]);
  
  useEffect(() => {
    if (space) {
      setFormName(space.name);
      setFormDescription(space.description || '');
    }
  }, [space]);

  // Initialize preferences when space changes
  useEffect(() => {
    if (!space) return;
    const prefs = (space as any).preferences || {};
    if (prefs.viewMode && prefs.viewMode !== viewMode) setViewMode(prefs.viewMode);
    if (prefs.sortBy && prefs.sortBy !== sortBy) setSortBy(prefs.sortBy);
    if (prefs.sortOrder && prefs.sortOrder !== sortOrder) setSortOrder(prefs.sortOrder);
  }, [space?.id]);

  // Persist preferences per-space (guard against no-op updates)
  useEffect(() => {
    if (!space) return;
    const current = (space as any).preferences || {};
    const next = { viewMode, sortBy, sortOrder } as const;
    const changed = current.viewMode !== next.viewMode || current.sortBy !== next.sortBy || current.sortOrder !== next.sortOrder;
    if (changed) {
      updateSpace((space as any).id, { preferences: { ...current, ...next } } as any);
    }
  }, [space?.id, viewMode, sortBy, sortOrder]);
  
  if (!space) {
    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Space not found</h2>
          <p className="text-secondary mb-4">The space you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/spaces')}>Back to Spaces</Button>
        </div>
      </div>
    );
  }
  
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };
  
  const toggleSort = (key: SortBy) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };
  
  const handleCreateItem = (type: string) => {
    // Navigate to appropriate creation page
    switch (type) {
      case 'note':
        navigate('/notes?new=true');
        break;
      case 'task':
        navigate('/tasks?new=true');
        break;
      case 'canvas':
        navigate('/canvas?new=true');
        break;
      case 'event':
        navigate('/calendar?new=true');
        break;
      case 'mail':
        navigate('/mail?compose=true');
        break;
      case 'chat':
        navigate('/chat?new=true');
        break;
      case 'agent':
        navigate('/agents?new=true');
        break;
      default:
        break;
    }
  };
  
  const openItem = (item: UnifiedItem) => {
    switch (item.type) {
      case 'note':
        navigate('/notes');
        break;
      case 'task':
        {
          const underlyingId = item.id.includes(':') ? item.id.split(':')[1] : item.id;
          navigate(`/tasks?taskId=${encodeURIComponent(underlyingId)}`);
        }
        break;
      case 'canvas':
        navigate('/canvas');
        break;
      case 'calendar':
        navigate('/calendar');
        break;
      case 'mail':
        navigate('/mail');
        break;
      case 'chat':
        navigate('/chat');
        break;
      case 'agent':
        navigate('/agents');
        break;
      default:
        break;
    }
  };
  
  // Handle click outside for New dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.new-dropdown-container')) {
        setShowQuickCreate(false);
      }
    };
    
    if (showQuickCreate) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQuickCreate]);
  
  const handleRenameSpace = () => {
    if (!space) return;
    updateSpace(space.id, {
      name: formName.trim(),
      description: formDescription.trim() || undefined
    });
    setIsRenameOpen(false);
  };
  
  const handleDeleteSpace = () => {
    if (!space) return;
    // Note: Content within the space is preserved, only the space container is deleted
    console.log('Deleting space:', space.id);
    console.log('Note: Content within this space will be preserved');
    
    deleteSpaceFromStore(space.id);
    
    // Navigate back to spaces list after deletion
    navigate('/spaces');
  };
  
  // Handle click outside for space actions menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (spaceActionsRef.current && !spaceActionsRef.current.contains(event.target as Node)) {
        setShowSpaceActions(false);
      }
    };
    
    if (showSpaceActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSpaceActions]);
  
  return (
    <>
      {/* Header - matching Calendar/Tasks style */}
      <header className="flex items-center justify-between px-6 py-3" 
        style={{ 
          backgroundColor: 'var(--asana-bg-primary)', 
          borderBottom: '1px solid var(--asana-border-default)', 
          position: 'relative', 
          zIndex: 10
        }}
      >
        {/* Left side - Back button, space name and description */}
        <div className="flex items-center gap-4" style={{ flex: '1 1 0' }}>
          <button
            onClick={() => navigate('/spaces')}
            className="p-2 rounded-lg hover:bg-[color:var(--bg-hover)] transition-colors"
            aria-label="Back to spaces"
          >
            <ChevronLeft size={20} style={{ color: 'var(--asana-text-secondary)' }} />
          </button>
          
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--asana-text-primary)' }}>
              {space.name}
            </h1>
            {space.description && (
              <p className="asana-text-sm" style={{ color: 'var(--asana-text-secondary)' }}>
                {space.description}
              </p>
            )}
          </div>
          
          {/* View toggle - segmented control using Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => handleViewModeChange(v as ViewMode)}>
            <TabsList className="bg-[color:var(--asana-bg-input)]">
              <TabsTrigger value="grid" className="gap-1">
                <LayoutGrid size={16} />
                Grid
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1">
                <List size={16} />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Center - Search */}
        <div className="relative max-w-md flex-1 mx-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" 
            style={{ color: 'var(--asana-text-placeholder)' }} 
          />
          <input
            id="space-search-input"
            name="spaceSearch"
            type="search"
            placeholder="Search in this space..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search items in space"
            className="pl-10 pr-4 py-2 rounded-xl outline-none transition-all w-full asana-text-base"
            style={{ backgroundColor: 'var(--asana-bg-input)', border: '1px solid transparent' }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--asana-bg-primary)';
              e.currentTarget.style.borderColor = 'var(--asana-border-hover)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[color:var(--bg-hover)] transition-colors"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Right side controls */}
        <div className="flex items-center gap-2 justify-end" style={{ flex: '1 1 0', position: 'relative', zIndex: 200 }}>
          {/* Filter button - mobile only */}
          <button 
            ref={filterButtonRef}
            className="px-4 py-2 text-sm rounded-xl flex items-center gap-2 transition-colors md:hidden"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              backgroundColor: filter !== 'all' ? 'var(--accent-primary)' : 'var(--asana-bg-input)',
              color: filter !== 'all' ? 'var(--text-on-brand)' : 'var(--text-secondary)',
              position: 'relative',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              if (filter === 'all') {
                e.currentTarget.style.backgroundColor = 'var(--state-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter === 'all') {
                e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
              }
            }}
          >
            <Filter size={16} />
            Filter
            {filter !== 'all' && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-[color:var(--bg-overlay)]">
                1
              </span>
            )}
          </button>
          
          {showFilterDropdown && (
            <div 
              ref={filterDropdownRef}
              className="absolute top-full mt-1 right-0 min-w-[160px] bg-[color:var(--bg-primary)] rounded-lg shadow-xl border border-[color:var(--border-default)] overflow-hidden z-50"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              <div className="py-1">
                {[
                  { value: 'all', label: 'All items', icon: Folder },
                  { value: 'notes', label: 'Notes', icon: FileText },
                  { value: 'tasks', label: 'Tasks', icon: CheckSquare },
                  { value: 'canvas', label: 'Canvas', icon: ImageIcon },
                  { value: 'calendar', label: 'Events', icon: Calendar },
                  { value: 'mail', label: 'Emails', icon: MailIcon },
                  { value: 'chats', label: 'Chats', icon: MessageSquare },
                  { value: 'agents', label: 'Agents', icon: Users },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-[color:var(--bg-hover)] transition-colors flex items-center gap-2"
                    style={{ 
                      color: filter === value ? 'var(--accent-primary)' : 'var(--text-primary)',
                      backgroundColor: filter === value ? 'var(--state-selected)' : 'transparent'
                    }}
                    onClick={() => {
                      setFilter(value as ItemFilter);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <Icon size={14} className="flex-shrink-0" style={{ color: filter === value ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Create button with dropdown - matching Calendar/Tasks style */}
          <div className="relative new-dropdown-container">
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setShowQuickCreate(!showQuickCreate)}
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              className="asana-text-sm font-medium"
            >
              <Plus size={16} />
              New
            </Button>
            
            {showQuickCreate && (
              <div className="absolute top-full mt-1 right-0 min-w-[180px] bg-[color:var(--bg-primary)] rounded-lg shadow-xl border border-[color:var(--border-default)] overflow-hidden z-50"
                style={{ boxShadow: 'var(--shadow-lg)' }}
              >
                <div className="py-1">
                  {[
                    { value: 'note', label: 'New note', icon: FileText },
                    { value: 'task', label: 'New task', icon: CheckSquare },
                    { value: 'canvas', label: 'New canvas', icon: ImageIcon },
                    { value: 'event', label: 'New event', icon: Calendar },
                    { value: 'mail', label: 'New email', icon: MailIcon },
                    { value: 'chat', label: 'New chat', icon: MessageSquare },
                    { value: 'agent', label: 'New agent', icon: Users },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-[color:var(--bg-hover)] transition-colors flex items-center gap-2"
                      style={{ color: 'var(--text-primary)' }}
                      onClick={() => {
                        handleCreateItem(value);
                        setShowQuickCreate(false);
                      }}
                    >
                      <Icon size={14} className="flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Space actions - three dot menu */}
          <div className="relative" ref={spaceActionsRef}>
            <button
              onClick={() => setShowSpaceActions(!showSpaceActions)}
              className="p-2 rounded-lg hover:bg-[color:var(--bg-hover)] transition-colors"
              aria-label="Space actions"
              style={{ color: 'var(--text-secondary)' }}
            >
              <MoreHorizontal size={18} />
            </button>
            
            {showSpaceActions && (
              <div className="absolute top-full mt-1 right-0 min-w-[160px] bg-[color:var(--bg-primary)] rounded-lg shadow-xl border border-[color:var(--border-default)] overflow-hidden z-50"
                style={{ boxShadow: 'var(--shadow-lg)' }}
              >
                <div className="py-1">
                  <button
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-[color:var(--bg-hover)] transition-colors flex items-center gap-2"
                    style={{ color: 'var(--text-primary)' }}
                    onClick={() => {
                      console.log('Rename clicked, current space:', space);
                      // Make sure form is populated with current values
                      if (space) {
                        setFormName(space.name);
                        setFormDescription(space.description || '');
                      }
                      setIsRenameOpen(true);
                      setShowSpaceActions(false);
                      console.log('isRenameOpen set to true');
                    }}
                  >
                    Rename space
                  </button>
                  <div className="mx-2 my-1 border-t" style={{ borderColor: 'var(--border-subtle)' }} />
                  <button
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => {
                      setIsDeleteOpen(true);
                      setShowSpaceActions(false);
                    }}
                  >
                    Delete space
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--asana-bg-secondary)', position: 'relative', zIndex: 1 }}>
        <div className="flex flex-1 gap-6 p-6 min-h-0 overflow-hidden">
          {/* Left sidebar - Categories */}
          <aside className="w-64 flex-shrink-0">
            <Card className="p-2 h-full" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <nav className="flex flex-col gap-1">
                {[
                  { key: 'all', label: 'All items', icon: Folder, count: unifiedItems.length },
                  { key: 'notes', label: 'Notes', icon: FileText, count: unifiedItems.filter(i => i.type === 'note').length },
                  { key: 'tasks', label: 'Tasks', icon: CheckSquare, count: unifiedItems.filter(i => i.type === 'task').length },
                  { key: 'canvas', label: 'Canvas', icon: ImageIcon, count: unifiedItems.filter(i => i.type === 'canvas').length },
                  { key: 'calendar', label: 'Events', icon: Calendar, count: unifiedItems.filter(i => i.type === 'calendar').length },
                  { key: 'mail', label: 'Emails', icon: MailIcon, count: unifiedItems.filter(i => i.type === 'mail').length },
                  { key: 'chats', label: 'Chats', icon: MessageSquare, count: unifiedItems.filter(i => i.type === 'chat').length },
                  { key: 'agents', label: 'Agents', icon: Users, count: unifiedItems.filter(i => i.type === 'agent').length },
                ].map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      filter === key 
                        ? 'bg-[color:var(--state-selected)] text-[color:var(--text-primary)]' 
                        : 'hover:bg-[color:var(--hover-bg)] text-[color:var(--text-secondary)]'
                    }`}
                    onClick={() => setFilter(key as ItemFilter)}
                    aria-current={filter === key}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={16} />
                      <span>{label}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-xs opacity-60">{count}</span>
                    )}
                  </button>
                ))}
              </nav>
              
              {/* Starred section */}
              {starredItems.length > 0 && (
                <>
                  <div className="mt-4 mb-2 px-3 text-xs font-medium text-[color:var(--text-tertiary)] uppercase">
                    Starred
                  </div>
                  <div className="flex flex-col gap-1">
                    {starredItems.slice(0, 5).map(item => {
                      const Icon = typeIconMap[item.type];
                      return (
                        <button
                          key={item.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[color:var(--hover-bg)] text-left"
                        >
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <Icon size={14} className="text-[color:var(--text-secondary)]" />
                          <span className="truncate flex-1">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          </aside>
          
          {/* Main content area with subtle patterned background */}
          <div className="flex-1 min-w-0 overflow-auto relative">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(color-mix(in srgb, var(--space-accent, var(--accent-primary)) 12%, transparent) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                opacity: 0.06
              }}
            />
            {viewMode === 'grid' ? (
              <div className="space-y-6">
                {/* Recent items */}
                {recentItems.length > 0 && (
                  <div>
                    <h2 className="asana-text-base font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                      Recent
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {recentItems.map(item => {
                        const Icon = typeIconMap[item.type];
                        return (
                          <Card
                            key={item.id}
                            className="p-4 hover:shadow-lg transition-all cursor-pointer group"
                            style={{ backgroundColor: 'var(--bg-primary)' }}
                            onClick={() => openItem(item)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <Icon size={20} className="text-[color:var(--text-secondary)]" />
                            </div>
                            <h3 className="font-medium asana-text-base mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                              {item.title}
                            </h3>
                            {item.subtitle && (
                              <p className="asana-text-sm truncate" style={{ color: 'var(--text-tertiary)' }}>
                                {item.subtitle}
                              </p>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* All items grid */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="asana-text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
                      All items ({filteredItems.length})
                    </h2>
                  </div>
                  {/* Active filter chips row */}
                  <div className="flex items-center flex-wrap gap-2 mb-3">
                    <Badge variant="outline" size="sm">label: {space.name}</Badge>
                    {/* Future removable chips for additional filters can be added here */}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredItems.map(item => {
                      const Icon = typeIconMap[item.type];
                      return (
                        <Card
                          key={item.id}
                          className="p-4 hover:shadow-lg transition-all cursor-pointer group"
                          style={{ backgroundColor: 'var(--bg-primary)' }}
                          onClick={() => openItem(item)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Icon size={20} className="text-[color:var(--text-secondary)]" />
                          </div>
                          <h3 className="font-medium asana-text-base mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="asana-text-sm truncate" style={{ color: 'var(--text-tertiary)' }}>
                              {item.subtitle}
                            </p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                  
                  {filteredItems.length === 0 && (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <div className="text-center">
                        <Folder size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                          No items in this space yet
                        </h3>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* List view */
              <Card className="p-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="asana-text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
                      All items ({filteredItems.length})
                    </h2>
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-2 px-4 pb-2">
                  <Badge variant="outline" size="sm">label: {space.name}</Badge>
                </div>
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-[color:var(--bg-primary)]">
                    <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                      <th className="text-left p-4 asana-text-sm font-medium select-none">
                        <button className="inline-flex items-center gap-1 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]" onClick={() => toggleSort('name')}>
                          Name
                          {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </button>
                      </th>
                      <th className="text-left p-4 asana-text-sm font-medium select-none">
                        <button className="inline-flex items-center gap-1 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]" onClick={() => toggleSort('type')}>
                          Type
                          {sortBy === 'type' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </button>
                      </th>
                      <th className="text-left p-4 asana-text-sm font-medium select-none">
                        <button className="inline-flex items-center gap-1 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]" onClick={() => toggleSort('updated')}>
                          Updated
                          {sortBy === 'updated' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </button>
                      </th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => {
                      const Icon = typeIconMap[item.type];
                      return (
                        <tr 
                          key={item.id} 
                          className="border-b hover:bg-[color:var(--hover-bg)] transition-colors cursor-pointer group"
                          style={{ borderColor: 'var(--border-subtle)' }}
                          onClick={() => openItem(item)}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Icon size={16} className="text-[color:var(--text-secondary)]" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium asana-text-base truncate" style={{ color: 'var(--text-primary)' }}>
                                  {item.title}
                                </div>
                                {item.subtitle && (
                                  <div className="asana-text-sm truncate" style={{ color: 'var(--text-tertiary)' }}>
                                    {item.subtitle}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                              {item.type}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="asana-text-sm" style={{ color: 'var(--text-tertiary)' }}>
                              {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end">
                              <ActionMenu
                                items={[
                                  { label: 'Open', onClick: () => openItem(item) },
                                  { separator: true, label: '—', onClick: () => {} },
                                  { label: 'Remove from space', onClick: () => {} },
                                ]}
                                trigger={
                                  <button className="p-1 rounded hover:bg-[color:var(--bg-hover)]" aria-label="Row actions" onClick={(e) => { e.stopPropagation(); }}>
                                    <MoreHorizontal size={16} className="text-[color:var(--text-secondary)]" />
                                  </button>
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {filteredItems.length === 0 && (
                  <div className="p-12 text-center">
                    <Folder size={48} className="mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                      No items in this space yet
                    </h3>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Rename Dialog */}
      {console.log('Rename dialog open state:', isRenameOpen)}
      <Dialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        title="Rename space"
        description="Update the space name and description."
        footer={(
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameSpace} disabled={!formName.trim()}>Save</Button>
          </div>
        )}
        size="sm"
      >
        <div className="space-y-3">
          <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} />
          <Input label="Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
        </div>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete space"
        description=""
        footer={(
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSpace}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        )}
        size="sm"
      >
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Delete {space?.name}?
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This action removes the space container but keeps all your content.
          </p>
        </div>
      </Dialog>
    </>
  );
}

// Helper functions
function getTodaysEvents(events: any[]) {
  const today = new Date();
  return (events || [])
    .filter((ev) => {
      const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : (ev.start?.date ? new Date(ev.start.date + 'T00:00:00') : null);
      if (!start) return false;
      return isSameLocalDate(start, today);
    })
    .sort((a, b) => {
      const aStart = a.start?.dateTime ? new Date(a.start.dateTime).getTime() : 0;
      const bStart = b.start?.dateTime ? new Date(b.start.dateTime).getTime() : 0;
      return aStart - bStart;
    });
}

function isSameLocalDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && 
         a.getMonth() === b.getMonth() && 
         a.getDate() === b.getDate();
}

function formatEventTimeRange(ev: any) {
  const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : (ev.start?.date ? new Date(ev.start.date + 'T00:00:00') : null);
  const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : (ev.end?.date ? new Date(ev.end.date + 'T23:59:00') : null);
  if (!start) return 'All-day';
  if (!ev.start?.dateTime) return 'All-day';
  const startStr = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endStr = end ? end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return endStr ? `${startStr}–${endStr}` : startStr;
}

function formatTaskMeta(t: any) {
  const parts: string[] = [];
  
  // Add priority
  if (t.priority && t.priority !== 'none') {
    const displayPriority = t.priority.charAt(0).toUpperCase() + t.priority.slice(1);
    parts.push(`${displayPriority} priority`);
  }
  
  // Format date
  let dateStr = t.due_date_only || (t.due ? (t.due as string).split('T')[0] : null);
  if (dateStr) {
    const [year, month, day] = dateStr.split('-');
    parts.push(`${month}.${day}.${year}`);
  }
  
  return parts.join(' • ');
}