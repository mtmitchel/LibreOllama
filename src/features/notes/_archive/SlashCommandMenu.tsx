import React from 'react';
import { Card, Button, Text } from '../../../components/ui';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  Code2,
  Type,
  Quote,
  Minus,
} from 'lucide-react';

interface SlashCommandMenuProps {
  onSelect: (type: 'heading1' | 'heading2' | 'heading3' | 'text' | 'list' | 'code' | 'quote' | 'divider') => void;
  position: { x: number; y: number } | null;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({ onSelect, position }) => {
    const blockTypes = [
        { id: 'text' as const, label: 'Paragraph', description: 'Just start typing with plain text', icon: Type }, 
        { id: 'heading1' as const, label: 'Heading 1', description: 'Big section heading', icon: Heading1 }, 
        { id: 'heading2' as const, label: 'Heading 2', description: 'Medium section heading', icon: Heading2 }, 
        { id: 'heading3' as const, label: 'Heading 3', description: 'Small section heading', icon: Heading3 }, 
        { id: 'list' as const, label: 'Bulleted List', description: 'Create a simple bulleted list', icon: List }, 
        { id: 'quote' as const, label: 'Quote', description: 'Capture a quote or callout', icon: Quote }, 
        { id: 'code' as const, label: 'Code', description: 'Code snippet with syntax highlighting', icon: Code2 },
        { id: 'divider' as const, label: 'Divider', description: 'Visually divide content sections', icon: Minus }, 
    ];
    
    if (!position) return null;
    
    return (
        <Card
          className="border-border-default absolute z-50 w-80 border bg-elevated shadow-xl"
          style={{ top: position.y, left: position.x }}
          padding="sm"
        >
            <div className="space-y-2">
                <Text size="xs" weight="semibold" className="px-2 pb-2 uppercase tracking-wider text-muted">
                    Block Types
                </Text>
                <ul className="space-y-1">
                    {blockTypes.map(cmd => (
                        <li key={cmd.id}>
                            <Button 
                                variant="ghost"
                                onClick={() => onSelect(cmd.id)} 
                                className="flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-tertiary"
                            >
                                <cmd.icon size={16} className="mt-0.5 shrink-0 text-muted" /> 
                                <div className="min-w-0 flex-1">
                                    <Text size="sm" weight="medium" className="text-primary">
                                        {cmd.label}
                                    </Text>
                                    <Text size="xs" className="mt-0.5 text-muted">
                                        {cmd.description}
                                    </Text>
                                </div>
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
}; 