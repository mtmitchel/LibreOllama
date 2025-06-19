import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Move, 
  Maximize, 
  Palette,
  Type,
  Layers,
  Settings
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { CanvasElement, ElementType } from '../../types/canvas';
import { cn } from '../../lib/utils';

interface PropertyPanelProps {
  className?: string;
  width?: number;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  className,
  width = 300
}) => {
  const { 
    selectedIds, 
    elements, 
    updateElement, 
    bringToFront, 
    sendToBack, 
    bringForward, 
    sendBackward 
  } = useCanvasStore();

  const selectedElements = selectedIds.map(id => elements[id]).filter(Boolean);
  const hasSelection = selectedElements.length > 0;
  const multipleSelection = selectedElements.length > 1;

  if (!hasSelection) {
    return (
      <Card className={cn('h-full', className)} style={{ width }}>
        <CardHeader>
          <CardTitle className="text-sm">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <div className="text-sm">No element selected</div>
            <div className="text-xs mt-1">Select an element to edit its properties</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const primaryElement = selectedElements[0];

  return (
    <Card className={cn('h-full overflow-auto', className)} style={{ width }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Properties</span>
          {multipleSelection && (
            <Badge variant="secondary" className="text-xs">
              {selectedElements.length} selected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs defaultValue="transform" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transform" className="text-xs">
              <Move className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs">
              <Palette className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs">
              <Type className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">
              <Settings className="h-3 w-3" />
            </TabsTrigger>
          </TabsList>

          {/* Transform Properties */}
          <TabsContent value="transform" className="space-y-4">
            <TransformProperties elements={selectedElements} />
          </TabsContent>

          {/* Appearance Properties */}
          <TabsContent value="appearance" className="space-y-4">
            <AppearanceProperties elements={selectedElements} />
          </TabsContent>

          {/* Content Properties */}
          <TabsContent value="content" className="space-y-4">
            <ContentProperties elements={selectedElements} />
          </TabsContent>

          {/* Advanced Properties */}
          <TabsContent value="advanced" className="space-y-4">
            <AdvancedProperties elements={selectedElements} />
          </TabsContent>
        </Tabs>

        {/* Layer Controls */}
        <Separator />
        <LayerControls elements={selectedElements} />
      </CardContent>
    </Card>
  );
};

const TransformProperties: React.FC<{ elements: CanvasElement[] }> = ({ elements }) => {
  const { updateElement } = useCanvasStore();
  const element = elements[0];
  const multipleSelection = elements.length > 1;

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value) || 0;
    elements.forEach(el => {
      updateElement(el.id, { [axis]: numValue, modifiedAt: Date.now() });
    });
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue <= 0) return;
    
    elements.forEach(el => {
      updateElement(el.id, { [dimension]: numValue, modifiedAt: Date.now() });
    });
  };

  const handleRotationChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    elements.forEach(el => {
      updateElement(el.id, { rotation: numValue, modifiedAt: Date.now() });
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium">Position</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <Label className="text-xs text-gray-500">X</Label>
            <Input
              type="number"
              value={multipleSelection ? '' : element.x}
              placeholder={multipleSelection ? 'Mixed' : '0'}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Y</Label>
            <Input
              type="number"
              value={multipleSelection ? '' : element.y}
              placeholder={multipleSelection ? 'Mixed' : '0'}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Size</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <Label className="text-xs text-gray-500">W</Label>
            <Input
              type="number"
              value={multipleSelection ? '' : element.width}
              placeholder={multipleSelection ? 'Mixed' : '0'}
              onChange={(e) => handleSizeChange('width', e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">H</Label>
            <Input
              type="number"
              value={multipleSelection ? '' : element.height}
              placeholder={multipleSelection ? 'Mixed' : '0'}
              onChange={(e) => handleSizeChange('height', e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Rotation</Label>
        <div className="flex items-center space-x-2 mt-1">
          <Input
            type="number"
            value={multipleSelection ? '' : Math.round((element.rotation * 180) / Math.PI)}
            placeholder={multipleSelection ? 'Mixed' : '0'}
            onChange={(e) => handleRotationChange(String((parseFloat(e.target.value) || 0) * Math.PI / 180))}
            className="h-7 text-xs flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRotationChange('0')}
            className="h-7 w-7 p-0"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const AppearanceProperties: React.FC<{ elements: CanvasElement[] }> = ({ elements }) => {
  const { updateElement } = useCanvasStore();
  const element = elements[0];
  const multipleSelection = elements.length > 1;

  const handleStyleChange = (property: string, value: any) => {
    elements.forEach(el => {
      updateElement(el.id, {
        style: { ...el.style, [property]: value },
        modifiedAt: Date.now()
      });
    });
  };

  const handleOpacityChange = (value: number[]) => {
    elements.forEach(el => {
      updateElement(el.id, { opacity: value[0] / 100, modifiedAt: Date.now() });
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium">Fill</Label>
        <div className="flex items-center space-x-2 mt-1">
          <div 
            className="w-8 h-7 rounded border border-gray-300 cursor-pointer"
            style={{ backgroundColor: element.style?.fill || '#ffffff' }}
          />
          <Input
            type="text"
            value={multipleSelection ? '' : (element.style?.fill || '#ffffff')}
            placeholder={multipleSelection ? 'Mixed' : '#ffffff'}
            onChange={(e) => handleStyleChange('fill', e.target.value)}
            className="h-7 text-xs flex-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Stroke</Label>
        <div className="space-y-2 mt-1">
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-7 rounded border border-gray-300 cursor-pointer"
              style={{ backgroundColor: element.style?.stroke || '#000000' }}
            />
            <Input
              type="text"
              value={multipleSelection ? '' : (element.style?.stroke || '#000000')}
              placeholder={multipleSelection ? 'Mixed' : '#000000'}
              onChange={(e) => handleStyleChange('stroke', e.target.value)}
              className="h-7 text-xs flex-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Width</Label>
            <Input
              type="number"
              value={multipleSelection ? '' : (element.style?.strokeWidth || 1)}
              placeholder={multipleSelection ? 'Mixed' : '1'}
              onChange={(e) => handleStyleChange('strokeWidth', parseFloat(e.target.value) || 0)}
              className="h-7 text-xs"
              min="0"
              step="0.5"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Opacity</Label>
        <div className="space-y-2 mt-1">
          <Slider
            value={[multipleSelection ? 100 : (element.opacity * 100)]}
            onValueChange={handleOpacityChange}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {multipleSelection ? 'Mixed' : `${Math.round(element.opacity * 100)}%`}
          </div>
        </div>
      </div>

      {element.style?.borderRadius !== undefined && (
        <div>
          <Label className="text-xs font-medium">Border Radius</Label>
          <Input
            type="number"
            value={multipleSelection ? '' : (element.style.borderRadius || 0)}
            placeholder={multipleSelection ? 'Mixed' : '0'}
            onChange={(e) => handleStyleChange('borderRadius', parseFloat(e.target.value) || 0)}
            className="h-7 text-xs mt-1"
            min="0"
          />
        </div>
      )}
    </div>
  );
};

const ContentProperties: React.FC<{ elements: CanvasElement[] }> = ({ elements }) => {
  const { updateElement } = useCanvasStore();
  const element = elements[0];
  const multipleSelection = elements.length > 1;

  if (element.type !== ElementType.TEXT && element.type !== ElementType.STICKY_NOTE) {
    return (
      <div className="text-center text-gray-500 py-4">
        <div className="text-xs">No content properties available</div>
        <div className="text-xs">for {element.type.toLowerCase()} elements</div>
      </div>
    );
  }

  const data = element.data as any;

  const handleDataChange = (property: string, value: any) => {
    elements.forEach(el => {
      updateElement(el.id, {
        data: { ...el.data, [property]: value },
        modifiedAt: Date.now()
      });
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium">Font Family</Label>
        <Select
          value={multipleSelection ? '' : (data?.fontFamily || 'Inter')}
          onValueChange={(value) => handleDataChange('fontFamily', value)}
        >
          <SelectTrigger className="h-7 text-xs mt-1">
            <SelectValue placeholder={multipleSelection ? 'Mixed' : 'Select font'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Inter">Inter</SelectItem>
            <SelectItem value="Roboto">Roboto</SelectItem>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Courier New">Courier New</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs font-medium">Size</Label>
          <Input
            type="number"
            value={multipleSelection ? '' : (data?.fontSize || 16)}
            placeholder={multipleSelection ? 'Mixed' : '16'}
            onChange={(e) => handleDataChange('fontSize', parseInt(e.target.value) || 16)}
            className="h-7 text-xs mt-1"
            min="8"
            max="128"
          />
        </div>
        <div>
          <Label className="text-xs font-medium">Line Height</Label>
          <Input
            type="number"
            value={multipleSelection ? '' : (data?.lineHeight || 1.2)}
            placeholder={multipleSelection ? 'Mixed' : '1.2'}
            onChange={(e) => handleDataChange('lineHeight', parseFloat(e.target.value) || 1.2)}
            className="h-7 text-xs mt-1"
            min="0.5"
            max="3"
            step="0.1"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Text Color</Label>
        <div className="flex items-center space-x-2 mt-1">
          <div 
            className="w-8 h-7 rounded border border-gray-300 cursor-pointer"
            style={{ backgroundColor: data?.color || '#000000' }}
          />
          <Input
            type="text"
            value={multipleSelection ? '' : (data?.color || '#000000')}
            placeholder={multipleSelection ? 'Mixed' : '#000000'}
            onChange={(e) => handleDataChange('color', e.target.value)}
            className="h-7 text-xs flex-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Text Align</Label>
        <Select
          value={multipleSelection ? '' : (data?.textAlign || 'left')}
          onValueChange={(value) => handleDataChange('textAlign', value)}
        >
          <SelectTrigger className="h-7 text-xs mt-1">
            <SelectValue placeholder={multipleSelection ? 'Mixed' : 'Select alignment'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="justify">Justify</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

const AdvancedProperties: React.FC<{ elements: CanvasElement[] }> = ({ elements }) => {
  const { updateElement } = useCanvasStore();
  const element = elements[0];
  const multipleSelection = elements.length > 1;

  const handlePropertyChange = (property: string, value: any) => {
    elements.forEach(el => {
      updateElement(el.id, { [property]: value, modifiedAt: Date.now() });
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium">Element ID</Label>
        <Input
          type="text"
          value={multipleSelection ? 'Multiple' : element.id}
          readOnly
          className="h-7 text-xs mt-1 bg-gray-50"
        />
      </div>

      <div>
        <Label className="text-xs font-medium">Element Type</Label>
        <Input
          type="text"
          value={multipleSelection ? 'Mixed' : element.type}
          readOnly
          className="h-7 text-xs mt-1 bg-gray-50"
        />
      </div>

      <div>
        <Label className="text-xs font-medium">Z-Index</Label>
        <Input
          type="number"
          value={multipleSelection ? '' : element.zIndex}
          placeholder={multipleSelection ? 'Mixed' : '0'}
          onChange={(e) => handlePropertyChange('zIndex', parseInt(e.target.value) || 0)}
          className="h-7 text-xs mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Visibility & Lock</Label>
        <div className="flex space-x-2">
          <Button
            variant={element.visible ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePropertyChange('visible', !element.visible)}
            className="flex-1"
          >
            {element.visible ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            {element.visible ? 'Visible' : 'Hidden'}
          </Button>
          <Button
            variant={element.locked ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePropertyChange('locked', !element.locked)}
            className="flex-1"
          >
            {element.locked ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
            {element.locked ? 'Locked' : 'Unlocked'}
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Timestamps</Label>
        <div className="space-y-1 mt-1">
          <div className="text-xs text-gray-500">
            Created: {new Date(element.createdAt).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            Modified: {new Date(element.modifiedAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

const LayerControls: React.FC<{ elements: CanvasElement[] }> = ({ elements }) => {
  const { bringToFront, sendToBack, bringForward, sendBackward } = useCanvasStore();
  const elementIds = elements.map(el => el.id);

  return (
    <div>
      <Label className="text-xs font-medium mb-2 block">Layer Order</Label>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => bringToFront(elementIds)}
          className="text-xs"
        >
          <Layers className="h-3 w-3 mr-1" />
          To Front
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => sendToBack(elementIds)}
          className="text-xs"
        >
          <Layers className="h-3 w-3 mr-1" />
          To Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => bringForward(elementIds)}
          className="text-xs"
        >
          Forward
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => sendBackward(elementIds)}
          className="text-xs"
        >
          Backward
        </Button>
      </div>
    </div>
  );
};

export default PropertyPanel;
