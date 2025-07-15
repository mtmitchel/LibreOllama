import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import { DragOverlay, LiftedCard, DragPreview, DropZone, DragIndicator } from './DragOverlay';
import { GripVertical, Calendar, Mail, User, FileText } from 'lucide-react';

export const DragOverlays: Story = () => {
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [dragIndicatorPosition, setDragIndicatorPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  const sampleCards = [
    { id: '1', title: 'Task: Review PR #123', description: 'Code review for new authentication system', icon: <FileText className="size-4" /> },
    { id: '2', title: 'Meeting: Design sync', description: 'Weekly design team alignment', icon: <Calendar className="size-4" /> },
    { id: '3', title: 'Email: Client follow-up', description: 'Response to project requirements', icon: <Mail className="size-4" /> },
    { id: '4', title: 'User: John Doe', description: 'Product manager, Frontend team', icon: <User className="size-4" /> }
  ];

  return (
    <div className="space-y-12 bg-primary p-8">
      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">DragOverlay elevations</h2>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <div className="border-border-default rounded-lg border bg-surface p-4">
            <h3 className="mb-3 font-medium text-primary">Small elevation</h3>
            <DragOverlay elevation="sm" isActive={true}>
              <div className="rounded-lg bg-accent-soft p-4 text-center text-accent-primary">
                Dragging (sm)
              </div>
            </DragOverlay>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-4">
            <h3 className="mb-3 font-medium text-primary">Medium elevation</h3>
            <DragOverlay elevation="md" isActive={true}>
              <div className="rounded-lg bg-accent-soft p-4 text-center text-accent-primary">
                Dragging (md)
              </div>
            </DragOverlay>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-4">
            <h3 className="mb-3 font-medium text-primary">Large elevation</h3>
            <DragOverlay elevation="lg" isActive={true}>
              <div className="rounded-lg bg-accent-soft p-4 text-center text-accent-primary">
                Dragging (lg)
              </div>
            </DragOverlay>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-4">
            <h3 className="mb-3 font-medium text-primary">XL elevation</h3>
            <DragOverlay elevation="xl" isActive={true}>
              <div className="rounded-lg bg-accent-soft p-4 text-center text-accent-primary">
                Dragging (xl)
              </div>
            </DragOverlay>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">LiftedCard states</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <h3 className="font-medium text-primary">Normal state</h3>
            <LiftedCard>
              <div className="flex items-center gap-3">
                <Calendar className="size-5 text-accent-primary" />
                <div>
                  <p className="font-medium text-primary">Team meeting</p>
                  <p className="text-sm text-secondary">Today at 2:00 PM</p>
                </div>
              </div>
            </LiftedCard>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-primary">Hovered state</h3>
            <LiftedCard isHovered={true}>
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-accent-primary" />
                <div>
                  <p className="font-medium text-primary">Important email</p>
                  <p className="text-sm text-secondary">From: client@example.com</p>
                </div>
              </div>
            </LiftedCard>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-primary">Dragging state</h3>
            <LiftedCard isDragging={true}>
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-accent-primary" />
                <div>
                  <p className="font-medium text-primary">Project document</p>
                  <p className="text-sm text-secondary">Last edited: 2 hours ago</p>
                </div>
              </div>
            </LiftedCard>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Interactive card grid</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <p className="mb-4 text-sm text-secondary">Hover over cards to see lift effect</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sampleCards.map((card) => (
              <LiftedCard
                key={card.id}
                isHovered={hoveredCard === card.id}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => console.log('Card clicked:', card.title)}
                className="cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-accent-primary">{card.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-primary">{card.title}</p>
                    <p className="text-sm text-secondary">{card.description}</p>
                  </div>
                  <GripVertical className="size-4 text-secondary opacity-50" />
                </div>
              </LiftedCard>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">DragPreview</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <p className="mb-4 text-sm text-secondary">Preview of dragged item appearance</p>
          <DragPreview>
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-accent-primary" />
              <div>
                <p className="font-medium text-primary">Dragging this item...</p>
                <p className="text-sm text-secondary">Enhanced appearance with rotation</p>
              </div>
            </div>
          </DragPreview>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">DropZone variants</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-medium text-primary">Default drop zone</h3>
            <DropZone
              isActive={dropZoneActive}
              isHovered={false}
            >
              <div className="py-8 text-center">
                <p className="text-secondary">Drop items here</p>
              </div>
            </DropZone>
            <button
              onClick={() => setDropZoneActive(!dropZoneActive)}
              className="hover:bg-accent-primary/90 rounded bg-accent-primary px-3 py-1 text-sm text-white"
            >
              Toggle active state
            </button>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-primary">Variant drop zones</h3>
            <div className="grid grid-cols-2 gap-3">
              <DropZone variant="success" isActive={true}>
                <div className="py-4 text-center">
                  <p className="text-xs text-success">Success zone</p>
                </div>
              </DropZone>
              
              <DropZone variant="warning" isActive={true}>
                <div className="py-4 text-center">
                  <p className="text-xs text-warning">Warning zone</p>
                </div>
              </DropZone>
              
              <DropZone variant="error" isActive={true}>
                <div className="py-4 text-center">
                  <p className="text-xs text-error">Error zone</p>
                </div>
              </DropZone>
              
              <DropZone variant="default" isHovered={true}>
                <div className="py-4 text-center">
                  <p className="text-xs text-secondary">Hovered</p>
                </div>
              </DropZone>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">DragIndicator</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-4">
              <label className="text-sm text-primary">Position:</label>
              <select
                value={dragIndicatorPosition}
                onChange={(e) => setDragIndicatorPosition(e.target.value as 'top' | 'bottom' | 'left' | 'right')}
                className="border-border-default rounded border px-2 py-1 text-sm"
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            
            <div className="relative flex items-center justify-center rounded-lg bg-tertiary p-6">
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <p className="text-sm text-primary">Item being reordered</p>
              </div>
              <DragIndicator
                isVisible={true}
                position={dragIndicatorPosition}
                variant="default"
                className={
                  dragIndicatorPosition === 'top' ? 'absolute inset-x-4 top-0' :
                  dragIndicatorPosition === 'bottom' ? 'absolute inset-x-4 bottom-0' :
                  dragIndicatorPosition === 'left' ? 'absolute inset-y-4 left-0' :
                  'absolute inset-y-4 right-0'
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Use cases</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Kanban board</h3>
            <div className="space-y-3">
              <DropZone isActive={false} className="min-h-[80px]">
                <div className="space-y-2">
                  <LiftedCard padding="sm">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-success"></div>
                      <span className="text-sm text-primary">Feature: Login system</span>
                    </div>
                  </LiftedCard>
                  <LiftedCard padding="sm" isDragging={true}>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-warning"></div>
                      <span className="text-sm text-primary">Bug: Header layout</span>
                    </div>
                  </LiftedCard>
                </div>
              </DropZone>
              <p className="text-xs text-secondary">Drag cards between columns</p>
            </div>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">File upload area</h3>
            <DropZone isActive={false} isHovered={true}>
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-2 size-8 text-secondary" />
                <p className="font-medium text-primary">Drop files here</p>
                <p className="text-sm text-secondary">or click to browse</p>
              </div>
            </DropZone>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Card variations</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <h3 className="font-medium text-primary">Size variants</h3>
            <LiftedCard elevation="sm" padding="sm">
              <p className="text-sm text-primary">Small card</p>
            </LiftedCard>
            <LiftedCard elevation="md" padding="md">
              <p className="text-primary">Medium card</p>
            </LiftedCard>
            <LiftedCard elevation="lg" padding="lg">
              <p className="text-lg text-primary">Large card</p>
            </LiftedCard>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-primary">Border radius</h3>
            <LiftedCard borderRadius="sm">
              <p className="text-sm text-primary">Small radius</p>
            </LiftedCard>
            <LiftedCard borderRadius="md">
              <p className="text-sm text-primary">Medium radius</p>
            </LiftedCard>
            <LiftedCard borderRadius="xl">
              <p className="text-sm text-primary">Large radius</p>
            </LiftedCard>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-primary">Elevation levels</h3>
            <LiftedCard elevation="none">
              <p className="text-sm text-primary">No elevation</p>
            </LiftedCard>
            <LiftedCard elevation="md">
              <p className="text-sm text-primary">Medium elevation</p>
            </LiftedCard>
            <LiftedCard elevation="xl">
              <p className="text-sm text-primary">High elevation</p>
            </LiftedCard>
          </div>
        </div>
      </div>
    </div>
  );
};

DragOverlays.meta = {
  title: 'Design System/Components/DragOverlay',
}; 