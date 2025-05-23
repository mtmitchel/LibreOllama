
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from 'lucide-react';

interface CustomWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widgetName: string, widgetType: string) => void;
}

const mockWidgetTypes = [
  { id: 'text-note', name: 'Text note' },
  { id: 'image-display', name: 'Image display (placeholder)' },
  { id: 'simple-list', name: 'Simple list (placeholder)' },
  { id: 'mini-chart', name: 'Mini chart (placeholder)' },
];

export default function CustomWidgetModal({ isOpen, onClose, onSave }: CustomWidgetModalProps) {
  const [widgetName, setWidgetName] = useState('');
  const [widgetType, setWidgetType] = useState(mockWidgetTypes[0].id);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!widgetName.trim()) {
      setError('Widget name is required.');
      return;
    }
    setError('');
    onSave(widgetName, widgetType);
    setWidgetName('');
    setWidgetType(mockWidgetTypes[0].id);
    onClose();
  };

  const handleClose = () => {
    setWidgetName('');
    setWidgetType(mockWidgetTypes[0].id);
    setError('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create custom dashboard widget</DialogTitle>
          <DialogDescription>
            Configure your new custom widget. (Content configuration is mock).
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="widget-name">Widget name*</Label>
            <Input 
              id="widget-name" 
              value={widgetName} 
              onChange={(e) => setWidgetName(e.target.value)}
              placeholder="e.g., My daily quote" 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="widget-type">Widget type (mock)</Label>
            <Select value={widgetType} onValueChange={setWidgetType}>
                <SelectTrigger id="widget-type">
                    <SelectValue placeholder="Select mock type" />
                </SelectTrigger>
                <SelectContent>
                    {mockWidgetTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          
          {/* Placeholder for content configuration based on type */}
          <div className="space-y-1.5 opacity-50 cursor-not-allowed">
            <Label>Content configuration (not implemented)</Label>
            <Input placeholder="Depends on widget type..." disabled />
          </div>

          {error && (
            <div className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>Add widget</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
