import React, { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Code,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Type,
  MoreHorizontal
} from 'lucide-react';
import { Button, Card } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';

interface ContextualToolbarProps {
  isVisible?: boolean;
  position?: { x: number; y: number };
  selectedText?: string;
  onFormat?: (command: string, value?: string) => void;
  className?: string;
}

interface FormatCommand {
  command: string;
  icon: React.ReactNode;
  tooltip: string;
  shortcut?: string;
}

interface FormatGroup {
  name: string;
  commands: FormatCommand[];
}

const formatGroups: FormatGroup[] = [
  {
    name: 'Basic',
    commands: [
      { command: 'bold', icon: <Bold className="size-4" />, tooltip: 'Bold', shortcut: '⌘B' },
      { command: 'italic', icon: <Italic className="size-4" />, tooltip: 'Italic', shortcut: '⌘I' },
      { command: 'underline', icon: <Underline className="size-4" />, tooltip: 'Underline', shortcut: '⌘U' },
      { command: 'strikethrough', icon: <Strikethrough className="size-4" />, tooltip: 'Strikethrough' },
    ]
  },
  {
    name: 'Structure',
    commands: [
      { command: 'heading1', icon: <Heading1 className="size-4" />, tooltip: 'Heading 1', shortcut: '⌘⌥1' },
      { command: 'heading2', icon: <Heading2 className="size-4" />, tooltip: 'Heading 2', shortcut: '⌘⌥2' },
      { command: 'heading3', icon: <Heading3 className="size-4" />, tooltip: 'Heading 3', shortcut: '⌘⌥3' },
      { command: 'paragraph', icon: <Type className="size-4" />, tooltip: 'Paragraph', shortcut: '⌘⌥0' },
    ]
  },
  {
    name: 'Lists',
    commands: [
      { command: 'bulletList', icon: <List className="size-4" />, tooltip: 'Bullet list', shortcut: '⌘⇧8' },
      { command: 'orderedList', icon: <ListOrdered className="size-4" />, tooltip: 'Numbered list', shortcut: '⌘⇧7' },
      { command: 'blockquote', icon: <Quote className="size-4" />, tooltip: 'Quote', shortcut: '⌘⇧>' },
    ]
  },
  {
    name: 'Formatting',
    commands: [
      { command: 'code', icon: <Code className="size-4" />, tooltip: 'Inline code', shortcut: '⌘E' },
      { command: 'highlight', icon: <Highlighter className="size-4" />, tooltip: 'Highlight' },
      { command: 'link', icon: <Link className="size-4" />, tooltip: 'Add link', shortcut: '⌘K' },
    ]
  }
];

// Semantic color options using design system tokens
const textColors = [
  { label: 'Default', value: '', color: 'rgb(24, 24, 27)' }, // gray-900
  { label: 'Red', value: '#ef4444', color: '#ef4444' }, // red-500
  { label: 'Orange', value: '#f97316', color: '#f97316' }, // orange-500
  { label: 'Yellow', value: '#f59e0b', color: '#f59e0b' }, // amber-500
  { label: 'Green', value: '#10b981', color: '#10b981' }, // green-500
  { label: 'Blue', value: '#6366f1', color: '#6366f1' }, // indigo-500
  { label: 'Purple', value: '#a855f7', color: '#a855f7' }, // purple-500
  { label: 'Pink', value: '#ec4899', color: '#ec4899' }, // pink-500
];

const highlightColors = [
  { label: 'None', value: '', color: 'transparent' },
  { label: 'Yellow', value: '#fef3c7', color: '#fef3c7' }, // amber-100
  { label: 'Green', value: '#bbf7d0', color: '#bbf7d0' }, // green-200
  { label: 'Blue', value: '#c7d2fe', color: '#c7d2fe' }, // indigo-200
  { label: 'Purple', value: '#e9d5ff', color: '#e9d5ff' }, // purple-200
  { label: 'Pink', value: '#fce7f3', color: '#fce7f3' }, // pink-200
  { label: 'Red', value: '#fecaca', color: '#fecaca' }, // red-200
];

export function ContextualToolbar({
  isVisible = false,
  position = { x: 0, y: 0 },
  selectedText = '',
  onFormat,
  className = ''
}: ContextualToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Hide toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        // Color picker functionality removed for now
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const handleCommand = (command: string, value?: string) => {
    onFormat?.(command, value);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card
      ref={toolbarRef}
      className={`
        border-border-default motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 fixed z-50
        border bg-surface shadow-lg motion-safe:duration-200
        ${className}
      `}
      style={{
        left: position.x,
        top: position.y - 60, // Position above the selection
        maxWidth: '400px'
      }}
      padding="sm"
    >
      <div className="flex flex-wrap items-center gap-1">
        {/* Basic formatting */}
        <div className="border-border-default flex items-center gap-1 border-r pr-2">
          {formatGroups[0].commands.map((cmd) => (
            <Button
              key={cmd.command}
              variant="ghost"
              size="icon"
              className="size-8 motion-safe:transition-colors motion-safe:duration-150"
              onClick={() => handleCommand(cmd.command)}
              title={cmd.tooltip + (cmd.shortcut ? ` (${cmd.shortcut})` : '')}
            >
              {cmd.icon}
            </Button>
          ))}
        </div>

        {/* Headings */}
        <div className="border-border-default flex items-center gap-1 border-r pr-2">
          {formatGroups[1].commands.map((cmd) => (
            <Button
              key={cmd.command}
              variant="ghost"
              size="icon"
              className="size-8 motion-safe:transition-colors motion-safe:duration-150"
              onClick={() => handleCommand(cmd.command)}
              title={cmd.tooltip + (cmd.shortcut ? ` (${cmd.shortcut})` : '')}
            >
              {cmd.icon}
            </Button>
          ))}
        </div>

        {/* Lists */}
        <div className="border-border-default flex items-center gap-1 border-r pr-2">
          {formatGroups[2].commands.map((cmd) => (
            <Button
              key={cmd.command}
              variant="ghost"
              size="icon"
              className="size-8 motion-safe:transition-colors motion-safe:duration-150"
              onClick={() => handleCommand(cmd.command)}
              title={cmd.tooltip + (cmd.shortcut ? ` (${cmd.shortcut})` : '')}
            >
              {cmd.icon}
            </Button>
          ))}
        </div>

        {/* Colors and highlights */}
        <div className="border-border-default flex items-center gap-1 border-r pr-2">
          {/* Text Color */}
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 motion-safe:transition-colors motion-safe:duration-150"
                title="Text color"
              >
                <Type className="size-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <div className="p-2">
                <div className="mb-2 text-xs font-medium text-secondary">Text color</div>
                <div className="grid grid-cols-4 gap-1">
                  {textColors.map((color) => (
                    <button
                      key={color.value}
                      className="border-border-default size-6 rounded border hover:scale-110 motion-safe:transition-transform motion-safe:duration-150"
                      style={{ backgroundColor: color.color }}
                      onClick={() => handleCommand('textColor', color.value)}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu>

          {/* Highlight Color */}
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 motion-safe:transition-colors motion-safe:duration-150"
                title="Highlight color"
              >
                <Highlighter className="size-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <div className="p-2">
                <div className="mb-2 text-xs font-medium text-secondary">Highlight</div>
                <div className="grid grid-cols-4 gap-1">
                  {highlightColors.map((color) => (
                    <button
                      key={color.value}
                      className="border-border-default size-6 rounded border hover:scale-110 motion-safe:transition-transform motion-safe:duration-150"
                      style={{ backgroundColor: color.color }}
                      onClick={() => handleCommand('highlight', color.value)}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>

        {/* Additional actions */}
        <div className="flex items-center gap-1">
          {formatGroups[3].commands.map((cmd) => (
            <Button
              key={cmd.command}
              variant="ghost"
              size="icon"
              className="size-8 motion-safe:transition-colors motion-safe:duration-150"
              onClick={() => handleCommand(cmd.command)}
              title={cmd.tooltip + (cmd.shortcut ? ` (${cmd.shortcut})` : '')}
            >
              {cmd.icon}
            </Button>
          ))}

          {/* More options */}
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 motion-safe:transition-colors motion-safe:duration-150"
                title="More options"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item onSelect={() => handleCommand('alignLeft')}>
                <AlignLeft className="mr-2 size-4" />
                Align left
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => handleCommand('alignCenter')}>
                <AlignCenter className="mr-2 size-4" />
                Align center
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => handleCommand('alignRight')}>
                <AlignRight className="mr-2 size-4" />
                Align right
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item onSelect={() => handleCommand('clearFormat')}>
                Clear formatting
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </div>

      {/* Selected text indicator */}
      {selectedText && (
        <div className="border-border-default mt-2 border-t pt-2">
          <div className="truncate text-xs text-secondary">
            "{selectedText.slice(0, 30)}{selectedText.length > 30 ? '...' : ''}"
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-subtle">
        <span>Press</span>
        <kbd className="bg-subtle text-xs px-1 py-0.5 rounded">Esc</kbd>
        <span>to close or select text and use &quot;/&quot; for commands</span>
      </div>
    </Card>
  );
} 