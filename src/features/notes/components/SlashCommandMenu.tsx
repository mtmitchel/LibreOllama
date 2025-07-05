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
          className="absolute z-50 w-80 shadow-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]"
          style={{ top: position.y, left: position.x }}
          padding="sm"
        >
            <div className="space-y-[var(--space-2)]">
                <Text size="xs" weight="semibold" className="text-[var(--text-muted)] px-[var(--space-2)] pb-[var(--space-2)] uppercase tracking-wider">
                    Block Types
                </Text>
                <ul className="space-y-[var(--space-1)]">
                    {blockTypes.map(cmd => (
                        <li key={cmd.id}>
                            <Button 
                                variant="ghost"
                                onClick={() => onSelect(cmd.id)} 
                                className="w-full text-left flex items-start gap-[var(--space-3)] p-[var(--space-2)] rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            >
                                <cmd.icon size={16} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" /> 
                                <div className="flex-1 min-w-0">
                                    <Text size="sm" weight="medium" className="text-[var(--text-primary)]">
                                        {cmd.label}
                                    </Text>
                                    <Text size="xs" className="text-[var(--text-muted)] mt-0.5">
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