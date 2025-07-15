import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  ChevronDown, 
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Copy,
  Move3D,
  Square,
  Circle,
  Type,
  StickyNote,
  Image as ImageIcon
} from 'lucide-react';
import { Button, Text, Card, Badge } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { useShallow } from 'zustand/react/shallow';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { CanvasElement, ElementId, isConnectorElement, isSectionElement } from '../types/enhanced.types';

interface LayersPanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

interface LayerItemProps {
  element: CanvasElement;
  isSelected: boolean;
  isVisible: boolean;
  isLocked: boolean;
  depth?: number;
  onSelect: (elementId: ElementId) => void;
  onToggleVisibility: (elementId: ElementId) => void;
  onToggleLock: (elementId: ElementId) => void;
  onDelete: (elementId: ElementId) => void;
  onDuplicate: (elementId: ElementId) => void;
}

// Helper function to get appropriate icon for element types
function getElementIcon(elementType: string) {
  switch (elementType) {
    case 'rectangle':
    case 'draw-rectangle':
      return <Square className="size-4" />;
    case 'circle':
    case 'draw-circle':
      return <Circle className="size-4" />;
    case 'text':
      return <Type className="size-4" />;
    case 'sticky-note':
      return <StickyNote className="size-4" />;
    case 'image':
      return <ImageIcon className="size-4" />;
    case 'connector':
      return <Move3D className="size-4" />;
    default:
      return <Square className="size-4" />;
  }
}

function LayerItem({
  element,
  isSelected,
  isVisible,
  isLocked,
  depth = 0,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate
}: LayerItemProps) {
  
  const hasChildren = element.type === 'section' && 'childElementIds' in element && 
    Array.isArray((element as { childElementIds?: string[] }).childElementIds) && 
    (element as { childElementIds?: string[] }).childElementIds!.length > 0;

  const handleElementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id as ElementId);
  };

  return (
    <div className="w-full">
      <div 
        className={`
          group flex w-full items-center gap-2 rounded-md p-2 transition-colors
          ${isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}
          ${isLocked ? 'opacity-50' : ''}
        `}
        onClick={handleElementClick}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Hierarchy Icon */}
        <div className="flex size-4 items-center justify-center">
          {getElementIcon(element.type)}
        </div>

        {/* Element Name */}
        <div className="min-w-0 flex-1">
          <Text size="sm" className="truncate">
            {(element as { name?: string }).name || `${element.type} ${element.id.slice(-4)}`}
          </Text>
        </div>

        {/* Element Type Badge */}
        <Badge variant="outline" className="mr-2 text-xs">
          {element.type}
        </Badge>

        {/* Visibility Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 size-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(element.id as ElementId);
          }}
        >
          {isVisible ? (
            <Eye className="size-3 text-secondary" />
          ) : (
            <EyeOff className="size-3 text-muted" />
          )}
        </Button>

        {/* Lock Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 size-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(element.id as ElementId);
          }}
        >
          {isLocked ? (
            <Lock className="size-3 text-secondary" />
          ) : (
            <Unlock className="size-3 text-muted" />
          )}
        </Button>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onSelect={() => onDuplicate(element.id as ElementId)}>
              <Copy className="mr-2 size-4" />
              Duplicate
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item 
              onSelect={() => onDelete(element.id as ElementId)}
              className="text-error"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>

      {/* Child Elements (for sections) */}
      {hasChildren && (
        <div className="ml-4">
          {/* Render child elements here when section children are implemented */}
          {element.type === 'section' && 'childElementIds' in element && element.childElementIds && Array.isArray(element.childElementIds) && (
            element.childElementIds.map(childId => {
              const childElement = useUnifiedCanvasStore.getState().elements.get(childId);
              if (childElement) {
                return (
                  <LayerItem
                    key={childElement.id}
                    element={childElement}
                    isSelected={isSelected} // Pass selection status down
                    isVisible={'isVisible' in childElement ? childElement.isVisible !== false : true}
                    isLocked={'isLocked' in childElement ? childElement.isLocked === true : false}
                    depth={depth + 1}
                    onSelect={onSelect}
                    onToggleVisibility={onToggleVisibility}
                    onToggleLock={onToggleLock}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                  />
                );
              }
              return null;
            })
          )}
        </div>
      )}
    </div>
  );
}

export function LayersPanel({ isOpen = true, onToggle, className = '' }: LayersPanelProps) {
  const { 
    elements, 
    selectedElementIds, 
    selectElement, 
    deleteElement,
    updateElement 
  } = useUnifiedCanvasStore(useShallow((state) => ({
    elements: state.elements,
    selectedElementIds: state.selectedElementIds,
    selectElement: state.selectElement,
    deleteElement: state.deleteElement,
    updateElement: state.updateElement
  })));

  // Group elements by type for better organization
  const organizedElements = useMemo(() => {
    const elementsArray = Array.from(elements.values());
    
    const sections = elementsArray.filter(el => isSectionElement(el));
    const connectors = elementsArray.filter(el => isConnectorElement(el));
    const shapes = elementsArray.filter(el => 
      !isSectionElement(el) && !isConnectorElement(el)
    );

    return { sections, shapes, connectors };
  }, [elements]);

  const handleElementSelect = (elementId: ElementId) => {
    selectElement(elementId, false);
  };

  const handleToggleVisibility = (elementId: ElementId) => {
    const element = elements.get(elementId);
    if (element) {
      updateElement(elementId, { 
        isVisible: !('isVisible' in element ? element.isVisible : true) 
      } as any);
    }
  };

  const handleToggleLock = (elementId: ElementId) => {
    const element = elements.get(elementId);
    if (element) {
      updateElement(elementId, { 
        isLocked: !('isLocked' in element ? element.isLocked : false) 
      });
    }
  };

  const handleDelete = (elementId: ElementId) => {
    deleteElement(elementId);
  };

  const handleDuplicate = (elementId: ElementId) => {
    const element = elements.get(elementId);
    if (element) {
      const newElement = {
        ...element,
        id: `${element.type}-${Date.now()}` as ElementId,
        x: element.x + 20,
        y: element.y + 20
      };
      useUnifiedCanvasStore.getState().addElement(newElement as CanvasElement);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Card className={`flex h-full w-80 flex-col ${className}`} padding="none">
      {/* Header */}
      <div className="border-border-default flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-secondary" />
          <Text weight="semibold">Layers</Text>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <MoreHorizontal className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {organizedElements.sections.length === 0 && 
         organizedElements.shapes.length === 0 && 
         organizedElements.connectors.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-center">
            <Layers className="mb-2 size-8 text-muted" />
            <Text variant="secondary" size="sm">
              No elements on canvas
            </Text>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sections */}
            {organizedElements.sections.length > 0 && (
              <div>
                <Text variant="secondary" size="xs" className="mb-2 px-2 uppercase tracking-wider">
                  Sections
                </Text>
                <div className="space-y-1">
                  {organizedElements.sections.map((element) => (
                    <LayerItem
                      key={element.id}
                      element={element}
                      isSelected={selectedElementIds.has(element.id as unknown as ElementId)}
                      isVisible={'isVisible' in element ? element.isVisible !== false : true}
                      isLocked={'isLocked' in element ? element.isLocked === true : false}
                      onSelect={handleElementSelect}
                      onToggleVisibility={handleToggleVisibility}
                      onToggleLock={handleToggleLock}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Shapes */}
            {organizedElements.shapes.length > 0 && (
              <div>
                <Text variant="secondary" size="xs" className="mb-2 px-2 uppercase tracking-wider">
                  Elements
                </Text>
                <div className="space-y-1">
                  {organizedElements.shapes.map((element) => (
                    <LayerItem
                      key={element.id}
                      element={element}
                      isSelected={selectedElementIds.has(element.id as ElementId)}
                      isVisible={'isVisible' in element ? element.isVisible !== false : true}
                      isLocked={'isLocked' in element ? element.isLocked === true : false}
                      onSelect={handleElementSelect}
                      onToggleVisibility={handleToggleVisibility}
                      onToggleLock={handleToggleLock}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Connectors */}
            {organizedElements.connectors.length > 0 && (
              <div>
                <Text variant="secondary" size="xs" className="mb-2 px-2 uppercase tracking-wider">
                  Connectors
                </Text>
                <div className="space-y-1">
                  {organizedElements.connectors.map((element) => (
                    <LayerItem
                      key={element.id}
                      element={element}
                      isSelected={selectedElementIds.has(element.id)}
                      isVisible={'visible' in element ? element.visible !== false : true}
                      isLocked={'locked' in element ? element.locked === true : false}
                      onSelect={handleElementSelect}
                      onToggleVisibility={handleToggleVisibility}
                      onToggleLock={handleToggleLock}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-border-default border-t bg-secondary p-3">
        <Text variant="secondary" size="xs">
          {Array.from(elements.values()).length} element{elements.size !== 1 ? 's' : ''} total
        </Text>
      </div>
    </Card>
  );
} 