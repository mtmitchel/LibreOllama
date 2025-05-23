
"use client";

import type { AgentTool } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
// Removed Card imports as they are not used in this simplified version for direct inclusion

interface ToolSelectorProps {
  availableTools: AgentTool[];
  selectedTools: string[]; // Array of tool IDs
  onSelectionChange: (selectedToolIds: string[]) => void;
}

export default function ToolSelector({ availableTools, selectedTools, onSelectionChange }: ToolSelectorProps) {
  const handleToolToggle = (toolId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTools, toolId]);
    } else {
      onSelectionChange(selectedTools.filter(id => id !== toolId));
    }
  };

  return (
    <div className="space-y-3">
      {availableTools.length === 0 && (
        <p className="text-sm text-muted-foreground">No tools available for selection.</p>
      )}
      {availableTools.map((tool) => (
        <div key={tool.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-accent/50 transition-colors bg-card shadow-sm">
          <Checkbox
            id={`tool-${tool.id}`}
            checked={selectedTools.includes(tool.id)}
            onCheckedChange={(checked) => handleToolToggle(tool.id, !!checked)}
            className="mt-1"
          />
          <div className="grid gap-0.5 leading-none">
            <Label htmlFor={`tool-${tool.id}`} className="text-sm font-medium cursor-pointer">
              {tool.name}
            </Label>
            {tool.description && (
              <p className="text-xs text-muted-foreground">
                {tool.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
