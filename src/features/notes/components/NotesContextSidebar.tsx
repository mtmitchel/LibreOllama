import React from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { Text, Heading } from '../../../components/ui';
import { PanelRight, FileText, Calendar, Tag, Clock, CheckSquare, Link } from 'lucide-react';

interface NotesContextSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const NotesContextSidebar: React.FC<NotesContextSidebarProps> = ({ 
  isOpen = true, 
  onToggle
}) => {
  // If closed, show slim 40px gutter handle aligned like Canvas/Chat
  if (!isOpen) {
    return (
      <div
        style={{
          width: '40px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-24px',
          flexShrink: 0
        }}
      >
        <button
          onClick={onToggle}
          title="Show context panel"
          aria-label="Show context panel"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            padding: 0
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-secondary)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
        >
          <PanelRight size={18} strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <Card className="flex h-full w-80 shrink-0 flex-col" padding="none">
      {/* Header */}
      <div 
        className="border-border-default flex items-center justify-between border-b p-4"
      >
        <div>
          <Heading level={4} className="mb-1">
            Context
          </Heading>
          <Text variant="secondary" size="sm">
            Related items for this note
          </Text>
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Hide context panel"
            className="text-secondary hover:text-primary"
          >
            <PanelRight size={18} />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <div>
            <Text size="sm" weight="semibold" variant="body" className="mb-3">
              Quick actions
            </Text>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" className="justify-start">
                <CheckSquare size={14} className="mr-2" />
                Create task
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                <Link size={14} className="mr-2" />
                Link note
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                <Calendar size={14} className="mr-2" />
                Schedule
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                <Tag size={14} className="mr-2" />
                Add tag
              </Button>
            </div>
          </div>

          {/* Separator */}
          <div className="border-border-subtle border-t" />

          {/* Related Tasks */}
          <div>
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Related tasks
              </Text>
            </div>
            <div className="py-4 text-center">
              <Text size="xs" variant="tertiary">
                No related tasks yet
              </Text>
            </div>
          </div>

          {/* Linked Notes */}
          <div>
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Linked notes
              </Text>
            </div>
            <div className="py-4 text-center">
              <Text size="xs" variant="tertiary">
                No linked notes yet
              </Text>
            </div>
          </div>

          {/* Related Events */}
          <div>
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Related events
              </Text>
            </div>
            <div className="py-4 text-center">
              <Text size="xs" variant="tertiary">
                No related events yet
              </Text>
            </div>
          </div>

          {/* Related Chats */}
          <div>
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Related chats
              </Text>
            </div>
            <div className="py-4 text-center">
              <Text size="xs" variant="tertiary">
                No related chats yet
              </Text>
            </div>
          </div>

          {/* Related Mails */}
          <div>
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Related mails
              </Text>
            </div>
            <div className="py-4 text-center">
              <Text size="xs" variant="tertiary">
                No related mails yet
              </Text>
            </div>
          </div>

          {/* Related Projects */}
          <div>
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Related projects
              </Text>
            </div>
            <div className="py-4 text-center">
              <Text size="xs" variant="tertiary">
                No related projects yet
              </Text>
            </div>
          </div>

          {/* Separator */}
          <div className="border-border-subtle border-t" />

          {/* Note Details */}
          <div>
            <Text size="sm" weight="semibold" variant="body" className="mb-4">
              Note details
            </Text>
            <div className="flex flex-col gap-4">
              <div>
                <Text size="sm" weight="medium" color="secondary" className="mb-2">
                  Tags
                </Text>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-accent-soft px-2 py-1 text-[11px] font-medium text-accent-primary">
                    Project X
                  </span>
                  <span className="rounded-full bg-accent-soft px-2 py-1 text-[11px] font-medium text-accent-primary">
                    Meeting
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Text size="sm" weight="medium" color="secondary">
                  Created
                </Text>
                <Text size="sm">January 1, 2025</Text>
              </div>
              <div className="space-y-1">
                <Text size="sm" weight="medium" color="secondary">
                  Last modified
                </Text>
                <Text size="sm">January 1, 2025</Text>
              </div>
              <div className="space-y-1">
                <Text size="sm" weight="medium" color="secondary">
                  Word count
                </Text>
                <Text size="sm">0 words</Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 