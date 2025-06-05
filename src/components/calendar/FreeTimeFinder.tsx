import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Brain, 
  Clock, 
  Zap, 
  Target, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  TrendingUp,
  Moon,
  Sun,
  Coffee
} from 'lucide-react';
import { useCalendar } from '../../hooks/use-calendar';
import { useFocusMode } from '../../hooks/use-focus-mode';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import type { TaskItem, EnergyLevel, FreeTimeSlot } from '../../lib/types';

interface SchedulingSuggestion {
  id: string;
  task: TaskItem;
  suggestedSlot: FreeTimeSlot;
  confidence: number;
  reason: string;
  benefits: string[];
  energyMatch: boolean;
  optimalTiming: boolean;
}

interface AIPreferences {
  preferredEnergyTimes: {
    high: number[]; // Hours of day (0-23)
    medium: number[];
    low: number[];
  };
  focusSessionPreference: boolean;
  breakInterval: number; // minutes
  maxDailyHours: number;
  workDayStart: number;
  workDayEnd: number;
}

interface FreeTimeFinderProps {
  tasks: TaskItem[];
  onScheduleTask: (taskId: string, startTime: Date) => void;
  className?: string;
}

const DEFAULT_AI_PREFERENCES: AIPreferences = {
  preferredEnergyTimes: {
    high: [9, 10, 11, 14, 15], // Morning and early afternoon
    medium: [8, 12, 13, 16, 17], // Around meals and late afternoon
    low: [7, 18, 19, 20] // Early morning and evening
  },
  focusSessionPreference: true,
  breakInterval: 15,
  maxDailyHours: 8,
  workDayStart: 9,
  workDayEnd: 17
};

export function FreeTimeFinder({ 
  tasks, 
  onScheduleTask, 
  className = '' 
}: FreeTimeFinderProps) {
  const { freeTimeSlots, findOptimalTimeSlots, selectedDate, addTimeBlockedTask } = useCalendar();
  const { focusMode } = useFocusMode();
  
  const [aiPreferences, setAiPreferences] = useState<AIPreferences>(DEFAULT_AI_PREFERENCES);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
  const [energyOptimization, setEnergyOptimization] = useState(true);
  const [prioritizeUrgent, setPrioritizeUrgent] = useState(true);
  const [batchSimilarTasks, setBatchSimilarTasks] = useState(false);

  // Filter unscheduled tasks
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(task => 
      task.status !== 'done' && 
      !task.dueDate // Assuming scheduled tasks have due dates
    );
  }, [tasks]);

  // AI-powered energy analysis
  const analyzeEnergyPatterns = useCallback((task: TaskItem, slot: FreeTimeSlot): number => {
    const hour = slot.start.getHours();
    const taskEnergy = task.energyLevel || 'medium';
    const preferredHours = aiPreferences.preferredEnergyTimes[taskEnergy];
    
    let score = 0.5; // Base score
    
    // Energy time matching
    if (preferredHours.includes(hour)) {
      score += 0.3;
    }
    
    // Task complexity vs available time
    const taskDuration = task.estimatedMinutes || 60;
    if (slot.duration >= taskDuration * 1.5) {
      score += 0.2; // Buffer time available
    } else if (slot.duration < taskDuration) {
      score -= 0.3; // Not enough time
    }
    
    // Focus session alignment
    if (focusMode.isActive && taskDuration >= 25) {
      score += 0.25;
    }
    
    // Priority consideration
    if (task.priority === 'high' && hour >= 9 && hour <= 11) {
      score += 0.15; // High priority tasks in peak hours
    }
    
    return Math.min(1, Math.max(0, score));
  }, [aiPreferences, focusMode]);

  // Generate AI scheduling suggestions
  const generateSuggestions = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      const newSuggestions: SchedulingSuggestion[] = [];
      const targetDate = selectedDate;
      
      // Sort tasks by priority and urgency
      const sortedTasks = [...unscheduledTasks].sort((a, b) => {
        if (prioritizeUrgent) {
          const aUrgent = a.isOverdue || a.priority === 'high';
          const bUrgent = b.isOverdue || b.priority === 'high';
          if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
        }
        
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium']);
      });
      
      // Group similar tasks if enabled
      const taskGroups = batchSimilarTasks 
        ? groupSimilarTasks(sortedTasks)
        : sortedTasks.map(task => [task]);
      
      for (const taskGroup of taskGroups) {
        for (const task of taskGroup) {
          const optimalSlots = findOptimalTimeSlots(task, targetDate, 5);
          
          for (const slot of optimalSlots) {
            const confidence = energyOptimization 
              ? analyzeEnergyPatterns(task, slot)
              : slot.confidence;
            
            if (confidence >= 0.6) { // Minimum confidence threshold
              const energyMatch = slot.energySuitability === (task.energyLevel || 'medium');
              const optimalTiming = isOptimalTiming(task, slot);
              
              newSuggestions.push({
                id: `${task.id}-${slot.start.getTime()}`,
                task,
                suggestedSlot: slot,
                confidence,
                reason: generateReason(task, slot, energyMatch, optimalTiming),
                benefits: generateBenefits(task, slot, energyMatch),
                energyMatch,
                optimalTiming
              });
              break; // One suggestion per task
            }
          }
        }
      }
      
      // Sort suggestions by confidence
      newSuggestions.sort((a, b) => b.confidence - a.confidence);
      setSuggestions(newSuggestions.slice(0, 10)); // Top 10 suggestions
      
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    unscheduledTasks, 
    selectedDate, 
    findOptimalTimeSlots, 
    energyOptimization,
    prioritizeUrgent,
    batchSimilarTasks,
    analyzeEnergyPatterns
  ]);

  // Helper functions
  const groupSimilarTasks = (tasks: TaskItem[]): TaskItem[][] => {
    const groups: { [key: string]: TaskItem[] } = {};
    
    tasks.forEach(task => {
      const key = task.tags?.[0] || task.priority || 'misc';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    
    return Object.values(groups);
  };

  const isOptimalTiming = (task: TaskItem, slot: FreeTimeSlot): boolean => {
    const hour = slot.start.getHours();
    const taskEnergy = task.energyLevel || 'medium';
    
    switch (taskEnergy) {
      case 'high':
        return hour >= 9 && hour <= 11; // Peak morning hours
      case 'medium':
        return (hour >= 8 && hour <= 12) || (hour >= 14 && hour <= 16);
      case 'low':
        return hour >= 16 || hour <= 8;
      default:
        return true;
    }
  };

  const generateReason = (
    task: TaskItem, 
    slot: FreeTimeSlot, 
    energyMatch: boolean, 
    optimalTiming: boolean
  ): string => {
    const reasons: string[] = [];
    
    if (energyMatch) {
      reasons.push(`matches your ${task.energyLevel} energy level`);
    }
    
    if (optimalTiming) {
      reasons.push('optimal timing for this type of work');
    }
    
    if (slot.duration > (task.estimatedMinutes || 60) * 1.5) {
      reasons.push('provides buffer time');
    }
    
    if (task.priority === 'high') {
      reasons.push('high priority task');
    }
    
    if (task.isOverdue) {
      reasons.push('overdue and needs immediate attention');
    }
    
    return reasons.length > 0 
      ? `Best fit because it ${reasons.join(', ')}`
      : 'Good available time slot';
  };

  const generateBenefits = (
    task: TaskItem, 
    slot: FreeTimeSlot, 
    energyMatch: boolean
  ): string[] => {
    const benefits: string[] = [];
    
    if (energyMatch) {
      benefits.push('Optimal energy alignment');
    }
    
    if (slot.duration >= (task.estimatedMinutes || 60) + 30) {
      benefits.push('Includes buffer time');
    }
    
    if (focusMode.isActive && (task.estimatedMinutes || 60) >= 25) {
      benefits.push('Perfect for focus session');
    }
    
    benefits.push(`${Math.round(slot.confidence * 100)}% confidence match`);
    
    return benefits;
  };

  // Schedule task with AI suggestion
  const scheduleWithSuggestion = useCallback(async (suggestion: SchedulingSuggestion) => {
    try {
      await addTimeBlockedTask(
        suggestion.task, 
        suggestion.suggestedSlot.start, 
        suggestion.task.estimatedMinutes
      );
      
      onScheduleTask(suggestion.task.id, suggestion.suggestedSlot.start);
      
      // Remove suggestion after scheduling
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      
    } catch (error) {
      console.error('Error scheduling task:', error);
    }
  }, [addTimeBlockedTask, onScheduleTask]);

  // Auto-generate suggestions when tasks or preferences change
  useEffect(() => {
    if (unscheduledTasks.length > 0 && freeTimeSlots.length > 0) {
      generateSuggestions();
    }
  }, [unscheduledTasks, freeTimeSlots, generateSuggestions]);

  const getEnergyIcon = (energy: EnergyLevel) => {
    switch (energy) {
      case 'high': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'medium': return <Sun className="h-4 w-4 text-orange-500" />;
      case 'low': return <Moon className="h-4 w-4 text-blue-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Schedule Assistant
          <Badge variant="secondary" className="ml-auto">
            {suggestions.length} suggestions
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* AI Preferences */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Energy Optimization</label>
            <Switch 
              checked={energyOptimization} 
              onCheckedChange={setEnergyOptimization}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Prioritize Urgent Tasks</label>
            <Switch 
              checked={prioritizeUrgent} 
              onCheckedChange={setPrioritizeUrgent}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Batch Similar Tasks</label>
            <Switch 
              checked={batchSimilarTasks} 
              onCheckedChange={setBatchSimilarTasks}
            />
          </div>
        </div>

        <Separator />

        {/* Generate Suggestions Button */}
        <Button 
          onClick={generateSuggestions} 
          disabled={isAnalyzing || unscheduledTasks.length === 0}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Sparkles className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Target className="h-4 w-4 mr-2" />
              Find Optimal Times
            </>
          )}
        </Button>

        {/* Suggestions List */}
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="p-3">
                  <div className="space-y-2">
                    {/* Task and confidence */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{suggestion.task.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{suggestion.reason}</p>
                      </div>
                      <Badge 
                        className={`ml-2 ${getConfidenceColor(suggestion.confidence)}`}
                      >
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                    </div>
                    
                    {/* Suggested time slot */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>
                        {suggestion.suggestedSlot.start.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} - {suggestion.suggestedSlot.end.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {getEnergyIcon(suggestion.suggestedSlot.energySuitability)}
                      {suggestion.energyMatch && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    
                    {/* Benefits */}
                    <div className="flex flex-wrap gap-1">
                      {suggestion.benefits.map((benefit, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => scheduleWithSuggestion(suggestion)}
                        className="flex-1"
                      >
                        Schedule Now
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSuggestions(prev => 
                          prev.filter(s => s.id !== suggestion.id)
                        )}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : unscheduledTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>All tasks are scheduled!</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Click "Find Optimal Times" to get AI suggestions</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}