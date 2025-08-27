import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page, PageContent, PageCard, PageBody } from '../../components/ui/design-system/Page';
import { Card } from '../../components/ui/design-system/Card';
import { Button, Skeleton, ToggleButton, Input, Heading, Text, CountBadge, MetricPill } from '../../components/ui';
import WidgetHeader from '../../components/ui/design-system/WidgetHeader';
import ListItem from '../../components/ui/design-system/ListItem';
import { SimpleDialog as Dialog } from '../../components/ui/design-system';
import { Grid } from '../../components/ui/design-system/Grid';
import { Dropdown } from '../../components/ui/design-system';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { Plus, LayoutGrid, List, FileText, CheckSquare, Users, Calendar, Image as ImageIcon, MessageSquare, Mail as MailIcon, Clock, Sun, TrendingUp, Activity, Target, Zap, BookOpen, Rocket, Folder, Search, Filter } from 'lucide-react';
import { FloatingActionMenu } from '../../components/ui/FloatingActionButton';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { useSpacesStore, type Space } from '../../stores/spacesStore';

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


function SpaceCard({ space, onOpen }: { space: Space; onOpen: () => void }) {
  // Use a subtle tokenized tint; remove multi-user stats in favor of resume + quick actions
  const cardGradient = space.name === 'Research'
    ? `linear-gradient(135deg, rgba(168, 85, 247, 0.12), transparent)`
    : `linear-gradient(135deg, color-mix(in oklab, ${space.color || 'var(--accent-primary)'} 14%, transparent), transparent)`;

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className="text-left w-full h-full transition-all duration-300 hover:scale-[1.02] focus:outline-none group"
      aria-label={`Open space ${space.name}`}
    >
      <Card className="p-5 hover:shadow-xl transition-all duration-300 border-opacity-50 group-hover:border-accent/30 h-full flex flex-col min-h-[140px]" style={{ backgroundImage: cardGradient }}>
        <div className="min-w-0 flex-1">
          <div className="asana-text-lg font-bold text-primary truncate">{space.name}</div>
          <div className="asana-text-base text-secondary opacity-90 truncate h-6">
            {space.description || '\u00A0'}
          </div>
        </div>

        {/* Primary action only: View */}
        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            aria-label={`View ${space.name}`}
          >
            View
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SpacesList({ spaces, onOpen, onAction }: { spaces: Space[]; onOpen: (id: string) => void; onAction: (action: 'open' | 'rename' | 'archive', id: string) => void }) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <thead className="text-left text-muted">
            <tr className="border-b border-border-default bg-secondary/30">
              <th className="p-3 font-medium">Space</th>
              <th className="p-3 font-medium text-right">Tasks</th>
              <th className="p-3 font-medium text-right">Notes</th>
              <th className="p-3 font-medium text-right">Canvas</th>
              <th className="p-3 font-medium text-right">Agents</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {spaces.map((s, idx) => (
              <tr
                key={s.id}
                className={`cursor-pointer transition-all bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg hover:shadow-[var(--shadow-sm)] hover:bg-[var(--hover-bg)]`}
                onClick={() => onOpen(s.id)}
                tabIndex={0}
                aria-label={`Open space ${s.name}`}
              >
                <td className="p-3 min-w-0 rounded-l-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center size-6 rounded-md bg-[var(--hover-bg)] text-[color:var(--brand-primary)]">
                      <Folder size={14} />
                    </span>
                    <div className="min-w-0">
                      <div className="asana-text-lg font-semibold text-primary truncate">{s.name}</div>
                      <div className="asana-text-sm text-tertiary truncate">{s.description}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right font-semibold text-primary">{s.stats.tasks}</td>
                <td className="p-3 text-right font-semibold text-primary">{s.stats.notes}</td>
                <td className="p-3 text-right font-semibold text-primary">{s.stats.canvas}</td>
                <td className="p-3 text-right font-semibold text-primary">{s.stats.agents}</td>
                <td className="p-3 text-right rounded-r-lg" onClick={(e) => e.stopPropagation()}>
                  <Dropdown
                    items={[
                      { value: 'open', label: 'Open' },
                      { value: 'rename', label: 'Rename' },
                      { value: 'archive', label: 'Archive', destructive: true },
                    ]}
                    onSelect={(val) => {
                      if (val === 'open') onAction('open', s.id);
                      if (val === 'rename') onAction('rename', s.id);
                      if (val === 'archive') onAction('archive', s.id);
                    }}
                    aria-label={`Actions for ${s.name}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
            </div>
    </Card>
  );
}

export default function Spaces() {
  const navigate = useNavigate();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { spaces, addSpace, updateSpace, deleteSpace } = useSpacesStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [widgetView, setWidgetView] = useState<'cards' | 'list'>('cards');
  const tasksState = useUnifiedTaskStore((s) => s.tasks);
  const eventsState = useGoogleCalendarStore((s) => s.events);
  
  // Get notes store if available
  const notesState = (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useNotesStore } = require('../../features/notes/store');
      return useNotesStore.getState().notes as Array<any>;
    } catch {
      return [] as Array<any>;
    }
  })();
  
  // Calculate actual space stats based on label filtering
  const spacesWithStats = useMemo(() => {
    return spaces.map(space => {
      const spaceLabel = space.name.toLowerCase();
      let taskCount = 0;
      let noteCount = 0;
      let canvasCount = 0;
      let agentCount = 0;
      
      // Count tasks with matching label
      Object.values(tasksState || {}).forEach((t: any) => {
        const hasSpaceLabel = t.labels && t.labels.some((label: any) => {
          const labelName = typeof label === 'string' ? label : label.name;
          return labelName.toLowerCase() === spaceLabel;
        });
        if (hasSpaceLabel) taskCount++;
      });
      
      // Count notes with matching tag
      (notesState || []).forEach((n: any) => {
        const hasSpaceLabel = n.tags && n.tags.some((tag: string) => 
          tag.toLowerCase() === spaceLabel
        );
        if (hasSpaceLabel) noteCount++;
      });
      
      // Canvas and agents would be counted similarly when implemented
      // For now, keep the existing counts from the space data
      
      return {
        ...space,
        stats: {
          tasks: taskCount,
          notes: noteCount,
          canvas: space.stats.canvas || 0,
          agents: space.stats.agents || 0
        }
      };
    });
  }, [spaces, tasksState, notesState]);

  // Subtle gradient backgrounds per widget (card + list views)
  const gradient = {
    tasks: 'linear-gradient(135deg, rgba(121,110,255,0.08) 0%, rgba(121,110,255,0.02) 60%)',
    notes: 'linear-gradient(135deg, rgba(108,115,125,0.08) 0%, rgba(108,115,125,0.02) 60%)',
    canvas: 'linear-gradient(135deg, rgba(125,167,249,0.08) 0%, rgba(125,167,249,0.02) 60%)',
    projects: 'linear-gradient(135deg, rgba(78,203,196,0.10) 0%, rgba(78,203,196,0.03) 60%)',
    events: 'linear-gradient(135deg, rgba(167,139,250,0.10) 0%, rgba(167,139,250,0.03) 60%)',
    mail: 'linear-gradient(135deg, rgba(246,173,85,0.10) 0%, rgba(246,173,85,0.03) 60%)',
    activity: 'linear-gradient(135deg, rgba(244,114,182,0.10) 0%, rgba(244,114,182,0.03) 60%)',
  } as const;

  const headerActions = (
    <div className="flex items-center gap-2">
      <div role="group" aria-label="View toggle" className="inline-flex rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <ToggleButton
          pressed={view === 'grid'}
          onPressedChange={() => setView('grid')}
          size="md"
          variant="ghost"
          aria-label="Grid view"
        >
          <LayoutGrid size={16} />
        </ToggleButton>
        <ToggleButton
          pressed={view === 'list'}
          onPressedChange={() => setView('list')}
          size="md"
          variant="ghost"
          aria-label="List view"
        >
          <List size={16} />
        </ToggleButton>
      </div>
      <Button variant="primary" size="sm" onClick={() => { setFormName(''); setFormDescription(''); setIsCreateOpen(true); }}>
        <Plus size={16} className="mr-1" /> New space
      </Button>
    </div>
  );


  // List/Grid selection view
  return (
    <Page>
      <PageContent className="overflow-x-hidden">
        <PageCard>
          <PageBody>
            {/* Today strip */}
            <TodayStrip />
            
            {/* Spaces header with refined styling */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="asana-text-3xl font-bold text-primary tracking-tight">Spaces</h1>
              </div>
              <div className="flex items-center gap-2">{headerActions}</div>
            </div>

            {view === 'grid' ? (
              <Grid columns="auto-md" gap="6">
                {spacesWithStats.map((s) => (
                  <SpaceCard key={s.id} space={s} onOpen={() => navigate(`/spaces/${s.id}`)} />
                ))}
              </Grid>
            ) : (
              <SpacesList spaces={spacesWithStats} onOpen={(id) => navigate(`/spaces/${id}`)} onAction={(action, id) => {
                const sp = spacesWithStats.find(x => x.id === id);
                if (!sp) return;
                if (action === 'open') navigate(`/spaces/${id}`);
                if (action === 'rename') {
                  setEditingId(id);
                  setFormName(sp.name);
                  setFormDescription(sp.description || '');
                  setIsRenameOpen(true);
                }
                if (action === 'archive') setArchiveId(id);
              }} />
            )}

            {/* Create Space Dialog */}
            <Dialog
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              title="Create space"
              description="Name your space and optionally add a short description."
              footer={(
                <div className="flex items-center justify-end gap-2 w-full">
                  <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    const name = formName.trim();
                    if (!name) return;
                    addSpace({
                      name,
                      description: formDescription.trim() || undefined,
                      color: 'var(--accent-primary)',
                      stats: { tasks: 0, notes: 0, canvas: 0, agents: 0 },
                    });
                    setIsCreateOpen(false);
                    setFormName('');
                    setFormDescription('');
                  }} disabled={!formName.trim()}>Create</Button>
                </div>
              )}
              size="sm"
            >
              <div className="space-y-3">
                <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Marketing" />
                <Input label="Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Campaign planning and assets" />
              </div>
            </Dialog>

            {/* Rename Space Dialog */}
            <Dialog
              open={isRenameOpen}
              onOpenChange={(open) => { setIsRenameOpen(open); if (!open) setEditingId(null); }}
              title="Rename space"
              description="Update the space name and description."
              footer={(
                <div className="flex items-center justify-end gap-2 w-full">
                  <Button variant="ghost" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    if (!editingId) return;
                    const name = formName.trim();
                    if (!name) return;
                    updateSpace(editingId, { name, description: formDescription.trim() || undefined });
                    setIsRenameOpen(false);
                    setEditingId(null);
                  }} disabled={!formName.trim()}>Save</Button>
                </div>
              )}
              size="sm"
            >
              <div className="space-y-3">
                <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} />
                <Input label="Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </div>
            </Dialog>

            {/* Archive confirmation */}
            <Dialog
              open={!!archiveId}
              onOpenChange={(open) => { if (!open) setArchiveId(null); }}
              title="Archive space"
              description="Archived spaces are hidden from the list. You can restore them later."
              footer={(
                <div className="flex items-center justify-end gap-2 w-full">
                  <Button variant="ghost" onClick={() => setArchiveId(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => { if (!archiveId) return; deleteSpace(archiveId); setArchiveId(null); }}>Archive</Button>
                </div>
              )}
              size="sm"
            />
          </PageBody>
        </PageCard>
      </PageContent>
      {/* Floating Action Menu */}
      <FloatingActionMenu
        icon={Plus}
        position="bottom-right"
        items={[
          { icon: Plus, label: 'New space', onClick: () => { setFormName(''); setFormDescription(''); setIsCreateOpen(true); } },
          { icon: FileText, label: 'New note', onClick: () => {/* TODO: route to notes new */} },
          { icon: CheckSquare, label: 'New task', onClick: () => {/* TODO: route to tasks new */} },
          { icon: Calendar, label: 'New event', onClick: () => {/* TODO: route to calendar new */} },
          { icon: MailIcon, label: 'New mail', onClick: () => {/* TODO: route to mail compose */} },
        ]}
      />
    </Page>
  );
}

// FloatingQuickActions removed for simplified personal layout prototype

function TodayStrip() {
  const [now, setNow] = useState(new Date());
  // Select slices directly to avoid returning new objects each render
  const events = useGoogleCalendarStore((s) => s.events);
  const isCalLoading = useGoogleCalendarStore((s) => s.isLoading);
  const tasks = useUnifiedTaskStore((s) => s.tasks);
  const spaces = useSpacesStore((s) => s.spaces);
  

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000); // Update every second for smooth time
    return () => clearInterval(interval);
  }, []);

  const greeting = getGreeting(now);
  const timeLabel = formatTime(now);
  const dateLabel = formatLongDate(now);

  const todaysEvents = getTodaysEvents(events).slice(0, 4);
  const importantTasks = getImportantTasks(Object.values(tasks)).slice(0, 5);
  
  // Calculate stats
  const activeProjects = spaces.length;
  const totalTasks = Object.values(tasks).filter(t => t.status !== 'completed').length;
  const completedToday = Object.values(tasks).filter(t => {
    if (t.status !== 'completed') return false;
    // Use the updated timestamp as completion time since completed_at doesn't exist
    const completedDate = t.updated ? new Date(t.updated) : null;
    return completedDate && isSameLocalDate(completedDate, now);
  }).length;
  const focusScore = totalTasks > 0 ? Math.round((completedToday / (completedToday + totalTasks)) * 100) : 0;

    return (
    <div className="mb-8">
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 sm:p-6 lg:p-8">
        
        {/* Main content grid with cards on sides and central clock */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          
          {/* Today's events - Left side */}
          <Card className="p-5 hover:shadow-lg transition-all duration-300 border-indigo-500/10 order-2 lg:order-1 min-w-0">
              <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar size={16} className="text-indigo-500 flex-shrink-0" />
                <div className="asana-text-xl font-semibold text-primary truncate">Today's events</div>
              </div>
                <Link to="/calendar" className="asana-text-base text-[color:var(--brand-primary)] hover:text-[var(--brand-hover)] underline decoration-[var(--brand-primary)]/40 hover:decoration-[var(--brand-hover)]/60 whitespace-nowrap">Open calendar</Link>
            </div>
              {isCalLoading ? (
              <div className="space-y-2" aria-busy>
                <Skeleton variant="text" className="h-4 w-40" />
                <Skeleton variant="text" className="h-4 w-56" />
                <Skeleton variant="text" className="h-4 w-48" />
              </div>
            ) : todaysEvents.length === 0 ? (
              <div className="py-3 text-center">
                <div className="asana-text-sm text-tertiary">No events today</div>
              </div>
            ) : (
              <ul className="space-y-2">
                {todaysEvents.slice(0, 3).map((ev) => (
                  <li key={`${ev.id}-${ev.start?.dateTime || ev.start?.date}`} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                    <span className="asana-text-lg text-indigo-600 font-medium shrink-0 w-[84px]">{formatEventTimeRange(ev)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="asana-text-lg text-primary font-medium truncate">{ev.summary || 'Untitled event'}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Central circular clock (reduced glow per DS elevation scale) */}
          <div className="flex justify-center px-4 lg:px-8 order-1 lg:order-2">
            <div className="relative flex flex-col items-center">
              {/* Progress ring around the clock using conic-gradient */}
              <div
                className="rounded-full p-1.5"
                style={{
                  background: `conic-gradient(var(--brand-primary, #796EFF) ${focusScore}%, var(--border-default) ${focusScore}% 100%)`,
                }}
                aria-label={`Today's progress ${focusScore}%`}
              >
                {/* Subtle aura */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-xl scale-105" />
                  {/* Clock circle */}
                  <div className="relative size-48 sm:size-56 lg:size-64 rounded-full bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-purple-500/10 border border-[var(--border-default)] shadow-[var(--shadow-card)] flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-light text-primary tracking-tight">
                        {timeLabel}
                      </div>
                      <div className="mt-2 text-xs sm:text-sm text-secondary">
                        {dateLabel}
                      </div>
                      {/* Weather placeholder */}
                      <div className="mt-3 lg:mt-4 flex items-center justify-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full bg-secondary/30 backdrop-blur-sm">
                        <Sun size={14} className="text-yellow-500 lg:size-4" />
                        <span className="text-[10px] lg:text-xs text-secondary font-medium">72°F · Sunny</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Quick controls beneath clock */}
              <div className="mt-3 flex items-center gap-2">
                <Link to="/calendar" className="asana-btn asana-btn-secondary asana-btn-sm">Plan my day</Link>
              </div>
            </div>
          </div>

          

          {/* Important tasks - Right side */}
          <Card className="p-5 hover:shadow-lg transition-all duration-300 border-purple-500/10 order-3 lg:order-3 min-w-0">
              <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckSquare size={16} className="text-purple-500 flex-shrink-0" />
                <div className="asana-text-xl font-semibold text-primary truncate">Important tasks</div>
              </div>
                <Link to="/tasks" className="asana-text-base text-[color:var(--brand-primary)] hover:text-[var(--brand-hover)] underline decoration-[var(--brand-primary)]/40 hover:decoration-[var(--brand-hover)]/60 whitespace-nowrap">View tasks</Link>
            </div>
            {importantTasks.length === 0 ? (
              <div className="py-3 text-center">
                <div className="asana-text-sm text-tertiary">You're all caught up!</div>
              </div>
            ) : (
              <>
                <ul className="space-y-2">
                  {importantTasks.slice(0, 4).map((t) => {
                    const dueDate = t.due_date_only || (t.due ? t.due.split('T')[0] : null);
                    const today = new Date().toISOString().split('T')[0];
                    const isOverdue = dueDate && dueDate < today;
                    const isDueToday = dueDate === today;
                    
                    // Format date as MM.DD.YYYY for display
                    let formattedDate = '';
                    if (dueDate) {
                      const [year, month, day] = dueDate.split('-');
                      formattedDate = `${month}.${day}.${year}`;
                    }
                    
  return (
                      <li key={t.id} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                        <span 
                          className={`mt-[2px] size-1.5 rounded-full ${
                            isOverdue ? 'bg-red-500' : 
                            isDueToday ? 'bg-orange-500' : 
                            t.priority === 'high' ? 'bg-gradient-to-br from-purple-500 to-purple-400' :
                            'bg-gradient-to-br from-blue-500 to-blue-400'
                          }`} 
                          aria-hidden 
                        />
                        <div className="min-w-0 flex-1">
                          <div className="asana-text-lg text-primary font-medium truncate">{t.title || 'Untitled task'}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {t.priority && t.priority !== 'none' && (
                              <span className={`inline-flex px-1.5 py-0.5 text-[12px] font-medium rounded whitespace-nowrap ${
                                t.priority === 'high' 
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                                  : t.priority === 'medium'
                                  ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                  : t.priority === 'low'
                                  ? 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                                  : ''
                              }`}>
                                {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                              </span>
                            )}
                            {formattedDate && (
                              <span className={`asana-text-sm whitespace-nowrap ${isOverdue ? 'text-red-500 font-medium' : 'text-tertiary'}`}>
                                {formattedDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {importantTasks.length > 4 && (
                  <div className="mt-2 flex justify-center">
                    <Link 
                      to="/tasks" 
                      className="px-3 py-1 asana-text-sm text-secondary bg-secondary/30 hover:bg-secondary/50 rounded-full transition-colors"
                    >
                      +{importantTasks.length - 4} more
                    </Link>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to get time until an event
function getTimeUntil(eventTime: Date): string {
  const now = new Date();
  const diff = eventTime.getTime() - now.getTime();
  if (diff < 0) return 'Started';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

function getGreeting(now: Date) {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function isSameLocalDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

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

function formatEventTimeRange(ev: any) {
  const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : (ev.start?.date ? new Date(ev.start.date + 'T00:00:00') : null);
  const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : (ev.end?.date ? new Date(ev.end.date + 'T23:59:00') : null);
  if (!start) return 'All-day';
  if (!ev.start?.dateTime) return 'All-day';
  const startStr = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endStr = end ? end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return endStr ? `${startStr}–${endStr}` : startStr;
}

function getImportantTasks(all: Array<any>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Get date 7 days from now for "upcoming" threshold
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekStr = `${weekFromNow.getFullYear()}-${String(weekFromNow.getMonth() + 1).padStart(2, '0')}-${String(weekFromNow.getDate()).padStart(2, '0')}`;

  return (all || [])
    .filter((t) => t.status !== 'completed')
    .filter((t) => {
      // Include if high or medium priority (handle both cases)
      const priority = t.priority?.toLowerCase();
      if (priority === 'high' || priority === 'medium') return true;
      
      // Include if has a due date within the next week or is overdue
      const dueDate = t.due_date_only || (t.due ? t.due.split('T')[0] : null);
      if (dueDate) {
        // Include if past due (overdue)
        if (dueDate < todayStr) return true;
        // Include if due within next 7 days (including today)
        if (dueDate <= weekStr) return true;
      }
      
      return false;
    })
    .sort((a, b) => {
      // Sort by: 1) Past due first, 2) Due soon, 3) High priority, 4) Medium priority
      const aDueDate = a.due_date_only || (a.due ? a.due.split('T')[0] : null);
      const bDueDate = b.due_date_only || (b.due ? b.due.split('T')[0] : null);
      
      // Past due items first
      const aOverdue = aDueDate && aDueDate < todayStr ? 1 : 0;
      const bOverdue = bDueDate && bDueDate < todayStr ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      
      // Then items due today
      const aDueToday = aDueDate === todayStr ? 1 : 0;
      const bDueToday = bDueDate === todayStr ? 1 : 0;
      if (aDueToday !== bDueToday) return bDueToday - aDueToday;
      
      // Then by due date (earlier first)
      if (aDueDate && bDueDate && aDueDate !== bDueDate) {
        return aDueDate < bDueDate ? -1 : 1;
      }
      
      // Finally by priority (lowercase)
      const pri = { high: 3, medium: 2, low: 1, none: 0 } as Record<string, number>;
      return (pri[b.priority || 'none'] || 0) - (pri[a.priority || 'none'] || 0);
    });
}

function formatTaskMeta(t: any) {
  const parts: string[] = [];
  
  // Add priority as a chip-style indicator (handle lowercase)
  if (t.priority && t.priority !== 'none') {
    const displayPriority = t.priority.charAt(0).toUpperCase() + t.priority.slice(1);
    parts.push(`${displayPriority} priority`);
  }
  
  // Format date as MM.DD.YYYY
  let dateStr = t.due_date_only || (t.due ? (t.due as string).split('T')[0] : null);
  if (dateStr) {
    const [year, month, day] = dateStr.split('-');
    parts.push(`${month}.${day}.${year}`);
  }
  
  return parts.join(' • ');
}