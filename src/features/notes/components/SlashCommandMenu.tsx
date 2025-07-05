import React from 'react';
import { Card, Button, Text } from '../../../components/ui';
import {
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Code2,
  PencilRuler,
  Type,
  Image as ImageIcon,
  Quote,
} from 'lucide-react';

interface SlashCommandMenuProps {
  onSelect: (type: 'heading1' | 'heading2' | 'text' | 'list' | 'checklist' | 'code' | 'canvas' | 'image' | 'quote') => void;
  position: { x: number; y: number } | null;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({ onSelect, position }) => {
    const commands = [
        { id: 'text' as const, label: 'Text', icon: Type }, 
        { id: 'heading1' as const, label: 'Heading 1', icon: Heading1 }, 
        { id: 'heading2' as const, label: 'Heading 2', icon: Heading2 }, 
        { id: 'checklist' as const, label: 'Checklist', icon: CheckSquare }, 
        { id: 'list' as const, label: 'Bulleted List', icon: List }, 
        { id: 'quote' as const, label: 'Quote', icon: Quote }, 
        { id: 'canvas' as const, label: 'Canvas', icon: PencilRuler }, 
        { id: 'image' as const, label: 'Image', icon: ImageIcon },
    ];
    if (!position) return null;
    return (
        <Card
          className="absolute z-50 w-64 shadow-xl border border-[var(--border-default)]"
          style={{ top: position.y, left: position.x }}
          padding="sm"
        >
            <Text size="xs" weight="semibold" className="text-[var(--text-muted)] px-[var(--space-2)] pb-[var(--space-2)]">
                BLOCKS
            </Text>
            <ul>
                {commands.map(cmd => (
                    <li key={cmd.id}>
                        <Button 
                            variant="ghost"
                            onClick={() => onSelect(cmd.id)} 
                            className="w-full text-left flex items-center gap-[var(--space-3)] p-[var(--space-2)] rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)]"
                        >
                            <cmd.icon size={18} className="text-[var(--text-muted)]" /> 
                            <Text size="sm" weight="medium" className="text-[var(--text-primary)]">
                                {cmd.label}
                            </Text>
                        </Button>
                    </li>
                ))}
            </ul>
        </Card>
    );
}; 