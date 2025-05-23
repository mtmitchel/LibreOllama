
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from 'lucide-react';
import type { AgentTool } from '@/lib/types';

interface CustomToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTool: (tool: Omit<AgentTool, 'id'>) => void;
}

export default function CustomToolModal({ isOpen, onClose, onSaveTool }: CustomToolModalProps) {
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!toolName.trim()) {
      setError('Tool name is required.');
      return;
    }
    setError('');
    onSaveTool({ name: toolName, description: toolDescription });
    setToolName('');
    setToolDescription('');
    onClose();
  };

  const handleClose = () => {
    setToolName('');
    setToolDescription('');
    setError('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create custom tool</DialogTitle>
          <DialogDescription>
            Define a new tool for your AI agents. (Schema definition UI not implemented in this prototype).
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="tool-name">Tool name*</Label>
            <Input 
              id="tool-name" 
              value={toolName} 
              onChange={(e) => setToolName(e.target.value)}
              placeholder="e.g., GetWeatherForecast" 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tool-description">Tool description</Label>
            <Textarea 
              id="tool-description" 
              value={toolDescription} 
              onChange={(e) => setToolDescription(e.target.value)}
              placeholder="Describe what this tool does and when to use it."
              rows={3}
            />
          </div>
          {/* Placeholder for schema inputs */}
          <div className="space-y-1.5 opacity-50 cursor-not-allowed">
            <Label>Input schema (Zod - not implemented)</Label>
            <Textarea placeholder="z.object({ location: z.string() })" disabled rows={2}/>
          </div>
           <div className="space-y-1.5 opacity-50 cursor-not-allowed">
            <Label>Output schema (Zod - not implemented)</Label>
            <Textarea placeholder="z.object({ forecast: z.string() })" disabled rows={2}/>
          </div>

          {error && (
            <div className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>Save tool</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
