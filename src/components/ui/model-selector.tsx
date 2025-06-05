import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, Cpu, HardDrive, Zap, Clock, Star, Info } from 'lucide-react';
import { Button } from './button';
import { Card } from './card-v2';
import { Badge } from './badge';
import { cn } from '../../lib/utils';

export interface ModelInfo {
  name: string;
  size: number;
  modified_at: string;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (modelName: string) => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showModelInfo?: boolean;
  placeholder?: string;
}

interface ModelMetrics {
  performance: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'low';
  memoryUsage: 'low' | 'medium' | 'high';
  popularity: number; // 1-5 stars
  category: 'general' | 'code' | 'chat' | 'instruct' | 'embedding';
}

// Mock model metrics - in real app, this would come from API or config
const getModelMetrics = (modelName: string): ModelMetrics => {
  const name = modelName.toLowerCase();
  
  // Code models
  if (name.includes('code') || name.includes('coder')) {
    return {
      performance: 'medium',
      quality: 'high',
      memoryUsage: 'medium',
      popularity: 4,
      category: 'code'
    };
  }
  
  // Large models (7b+)
  if (name.includes('7b') || name.includes('13b') || name.includes('70b')) {
    return {
      performance: 'slow',
      quality: 'high',
      memoryUsage: 'high',
      popularity: 5,
      category: 'general'
    };
  }
  
  // Small models (1b-3b)
  if (name.includes('1b') || name.includes('2b') || name.includes('3b')) {
    return {
      performance: 'fast',
      quality: 'medium',
      memoryUsage: 'low',
      popularity: 4,
      category: 'chat'
    };
  }
  
  // Default
  return {
    performance: 'medium',
    quality: 'medium',
    memoryUsage: 'medium',
    popularity: 3,
    category: 'general'
  };
};

const formatModelSize = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
};

const getPerformanceColor = (performance: string) => {
  switch (performance) {
    case 'fast': return 'text-green-500';
    case 'medium': return 'text-yellow-500';
    case 'slow': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
};

const getMemoryColor = (usage: string) => {
  switch (usage) {
    case 'low': return 'text-green-500';
    case 'medium': return 'text-yellow-500';
    case 'high': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'code': return <Cpu className="w-3 h-3" />;
    case 'chat': return <Zap className="w-3 h-3" />;
    case 'general': return <Star className="w-3 h-3" />;
    default: return <Info className="w-3 h-3" />;
  }
};

export function ModelSelector({
  models,
  selectedModel,
  onModelChange,
  disabled = false,
  className,
  variant = 'default',
  showModelInfo = true,
  placeholder = 'Select model'
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedModelInfo = useMemo(() => {
    return models.find(m => m.name === selectedModel);
  }, [models, selectedModel]);

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models;
    
    return models.filter(model => 
      model.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [models, searchQuery]);

  const sortedModels = useMemo(() => {
    return [...filteredModels].sort((a, b) => {
      // Sort by popularity first, then by name
      const aMetrics = getModelMetrics(a.name);
      const bMetrics = getModelMetrics(b.name);
      
      if (aMetrics.popularity !== bMetrics.popularity) {
        return bMetrics.popularity - aMetrics.popularity;
      }
      
      return a.name.localeCompare(b.name);
    });
  }, [filteredModels]);

  const handleModelSelect = (modelName: string) => {
    onModelChange(modelName);
    setIsOpen(false);
    setSearchQuery('');
  };

  if (variant === 'compact') {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedModel || placeholder}
          </span>
          <ChevronDown className={cn(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )} />
        </Button>
        
        {isOpen && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto">
            <div className="p-2 space-y-1">
              {sortedModels.map((model) => (
                <button
                  key={model.name}
                  onClick={() => handleModelSelect(model.name)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                    'hover:bg-muted',
                    selectedModel === model.name && 'bg-primary text-primary-foreground'
                  )}
                >
                  {model.name}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full justify-between',
          variant === 'detailed' ? 'h-auto p-4' : 'h-10'
        )}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {selectedModelInfo && showModelInfo && (
            <div className="flex items-center space-x-2">
              {getCategoryIcon(getModelMetrics(selectedModelInfo.name).category)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="truncate font-medium">
                {selectedModel || placeholder}
              </span>
              
              {selectedModelInfo && showModelInfo && variant === 'detailed' && (
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {formatModelSize(selectedModelInfo.size)}
                  </Badge>
                  
                  {Array.from({ length: getModelMetrics(selectedModelInfo.name).popularity }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              )}
            </div>
            
            {selectedModelInfo && showModelInfo && variant === 'detailed' && (
              <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span className={getPerformanceColor(getModelMetrics(selectedModelInfo.name).performance)}>
                    {getModelMetrics(selectedModelInfo.name).performance}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <HardDrive className="w-3 h-3" />
                  <span className={getMemoryColor(getModelMetrics(selectedModelInfo.name).memoryUsage)}>
                    {getModelMetrics(selectedModelInfo.name).memoryUsage} memory
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform flex-shrink-0',
          isOpen && 'rotate-180'
        )} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-hidden">
          {/* Search */}
          {models.length > 5 && (
            <div className="p-3 border-b">
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
          )}
          
          {/* Model List */}
          <div className="max-h-60 overflow-auto">
            {sortedModels.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No models found
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {sortedModels.map((model) => {
                  const metrics = getModelMetrics(model.name);
                  const isSelected = selectedModel === model.name;
                  
                  return (
                    <button
                      key={model.name}
                      onClick={() => handleModelSelect(model.name)}
                      className={cn(
                        'w-full text-left p-3 rounded-md transition-colors',
                        'hover:bg-muted',
                        isSelected && 'bg-primary/10 border border-primary/20'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(metrics.category)}
                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium truncate">{model.name}</span>
                              
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: metrics.popularity }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                            
                            {showModelInfo && (
                              <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                                <span>{formatModelSize(model.size)}</span>
                                
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span className={getPerformanceColor(metrics.performance)}>
                                    {metrics.performance}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  <HardDrive className="w-3 h-3" />
                                  <span className={getMemoryColor(metrics.memoryUsage)}>
                                    {metrics.memoryUsage}
                                  </span>
                                </div>
                                
                                <Badge variant="outline" className="text-xs">
                                  {metrics.category}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default ModelSelector;