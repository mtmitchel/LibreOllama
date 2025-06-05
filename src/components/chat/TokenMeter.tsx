import React, { useMemo } from 'react';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  AlertTriangle, 
  Clock, 
  Zap, 
  Brain,
  TrendingDown,
  Info
} from 'lucide-react';

export interface TokenSegment {
  id: string;
  type: 'system' | 'conversation' | 'recent' | 'context' | 'memory';
  tokens: number;
  color: string;
  label: string;
  description?: string;
  priority: number; // Higher = more important
  decayFactor?: number; // 0-1, how much this segment decays over time
}

export interface TokenMeterProps {
  totalTokens: number;
  maxTokens: number;
  segments: TokenSegment[];
  showDetails?: boolean;
  showDecayIndicators?: boolean;
  onOptimize?: () => void;
  className?: string;
}

export function TokenMeter({ 
  totalTokens, 
  maxTokens, 
  segments, 
  showDetails = true,
  showDecayIndicators = true,
  onOptimize,
  className = '' 
}: TokenMeterProps) {
  
  // Calculate usage percentage and warning levels
  const usagePercentage = (totalTokens / maxTokens) * 100;
  const isWarning = usagePercentage > 70;
  const isCritical = usagePercentage > 90;
  
  // Sort segments by priority for display
  const sortedSegments = useMemo(() => {
    return [...segments].sort((a, b) => b.priority - a.priority);
  }, [segments]);

  // Calculate segment percentages
  const segmentData = useMemo(() => {
    return sortedSegments.map(segment => ({
      ...segment,
      percentage: (segment.tokens / maxTokens) * 100,
      relativePercentage: totalTokens > 0 ? (segment.tokens / totalTokens) * 100 : 0
    }));
  }, [sortedSegments, totalTokens, maxTokens]);

  // Get status color and icon
  const getStatusInfo = () => {
    if (isCritical) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        icon: <AlertTriangle className="h-4 w-4" />,
        message: 'Context window nearly full'
      };
    } else if (isWarning) {
      return {
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 border-amber-200',
        icon: <Clock className="h-4 w-4" />,
        message: 'Context window filling up'
      };
    } else {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        icon: <Zap className="h-4 w-4" />,
        message: 'Context window healthy'
      };
    }
  };

  const statusInfo = getStatusInfo();

  // Calculate memory decay visualization
  const getDecayIndicator = (segment: TokenSegment) => {
    if (!showDecayIndicators || !segment.decayFactor) return null;
    
    const decayPercentage = (1 - segment.decayFactor) * 100;
    
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <TrendingDown className="h-3 w-3" />
        <span>{decayPercentage.toFixed(0)}% decay</span>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className={`space-y-3 ${className}`}>
        {/* Header with status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Context Window</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-1 text-xs ${statusInfo.color}`}>
                  {statusInfo.icon}
                  <span>{totalTokens.toLocaleString()} / {maxTokens.toLocaleString()}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{statusInfo.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {usagePercentage.toFixed(1)}% of context window used
                </p>
              </TooltipContent>
            </Tooltip>
            
            {onOptimize && (isWarning || isCritical) && (
              <button
                onClick={onOptimize}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Optimize
              </button>
            )}
          </div>
        </div>

        {/* Progress bar with segments */}
        <div className="space-y-2">
          <div className="relative">
            <Progress 
              value={usagePercentage} 
              className={`h-3 ${isCritical ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-green-100'}`}
            />
            
            {/* Segment overlays */}
            <div className="absolute inset-0 flex">
              {segmentData.map((segment, index) => {
                const leftOffset = segmentData
                  .slice(0, index)
                  .reduce((acc, seg) => acc + seg.percentage, 0);
                
                return (
                  <Tooltip key={segment.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`h-full ${segment.color} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                        style={{
                          width: `${segment.percentage}%`,
                          marginLeft: index === 0 ? '0' : '1px'
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{segment.label}</p>
                        <p className="text-xs">{segment.tokens.toLocaleString()} tokens ({segment.relativePercentage.toFixed(1)}%)</p>
                        {segment.description && (
                          <p className="text-xs text-muted-foreground">{segment.description}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Warning/Critical message */}
          {(isWarning || isCritical) && (
            <div className={`p-2 rounded border text-xs ${statusInfo.bgColor} ${statusInfo.color}`}>
              <div className="flex items-center gap-2">
                {statusInfo.icon}
                <span className="font-medium">{statusInfo.message}</span>
              </div>
              <p className="mt-1 text-xs">
                {isCritical 
                  ? 'Consider starting a new conversation or optimizing context to maintain performance.'
                  : 'Monitor token usage to prevent context overflow.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Detailed breakdown */}
        {showDetails && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>Context Breakdown</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {segmentData.map(segment => (
                <div key={segment.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-3 h-3 rounded-sm ${segment.color}`} />
                    <span className="font-medium truncate">{segment.label}</span>
                    {getDecayIndicator(segment)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{segment.tokens.toLocaleString()}</span>
                    <Badge variant="outline" className="text-xs">
                      {segment.relativePercentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memory optimization suggestions */}
        {isCritical && (
          <div className="space-y-2 text-xs">
            <div className="font-medium text-muted-foreground">Optimization Suggestions:</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Summarize older conversation history</li>
              <li>• Remove redundant context information</li>
              <li>• Start a new conversation thread</li>
              <li>• Archive less relevant messages</li>
            </ul>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Helper function to create common token segments
export const createTokenSegments = (
  systemTokens: number,
  conversationTokens: number,
  recentTokens: number,
  contextTokens: number = 0,
  memoryTokens: number = 0
): TokenSegment[] => {
  const segments: TokenSegment[] = [
    {
      id: 'system',
      type: 'system' as const,
      tokens: systemTokens,
      color: 'bg-blue-500',
      label: 'System Prompt',
      description: 'Instructions and system context',
      priority: 5,
      decayFactor: 0 // System prompt doesn't decay
    },
    {
      id: 'recent',
      type: 'recent' as const,
      tokens: recentTokens,
      color: 'bg-green-500',
      label: 'Recent Messages',
      description: 'Last few messages with highest priority',
      priority: 4,
      decayFactor: 0.1 // Recent messages decay slowly
    },
    {
      id: 'conversation',
      type: 'conversation' as const,
      tokens: conversationTokens - recentTokens,
      color: 'bg-yellow-500',
      label: 'Conversation History',
      description: 'Older messages in the conversation',
      priority: 2,
      decayFactor: 0.3 // Older messages decay faster
    },
    ...(contextTokens > 0 ? [{
      id: 'context',
      type: 'context' as const,
      tokens: contextTokens,
      color: 'bg-purple-500',
      label: 'External Context',
      description: 'Linked notes and external information',
      priority: 3,
      decayFactor: 0.2
    }] : []),
    ...(memoryTokens > 0 ? [{
      id: 'memory',
      type: 'memory' as const,
      tokens: memoryTokens,
      color: 'bg-indigo-500',
      label: 'Long-term Memory',
      description: 'Summarized conversation history',
      priority: 1,
      decayFactor: 0.5 // Memory decays over time
    }] : [])
  ].filter(segment => segment.tokens > 0);
  
  return segments;
};