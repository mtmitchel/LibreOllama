import React, { useState, useEffect } from 'react';
import { FileText, Save, Check, Edit3, ArrowRight, Clock } from 'lucide-react';
import { WidgetWrapper } from '../ui/widget-wrapper';
import { Button } from '../ui/button-v2';
import { Badge } from '../ui/badge';
import { designTokens } from '../../lib/design-tokens';

export interface QuickNotesWidgetProps {
  onNavigate?: (workflow: string) => void;
}

export function QuickNotesWidget({ onNavigate }: QuickNotesWidgetProps) {
  const [noteContent, setNoteContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (noteContent.trim() === '') {
      setSaveStatus('idle');
      return;
    }

    const timeoutId = setTimeout(() => {
      setSaveStatus('saving');
      
      // Simulate save operation
      setTimeout(() => {
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        // Reset to idle after showing saved status
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }, 500);
    }, 1000); // Auto-save after 1 second of no typing

    return () => clearTimeout(timeoutId);
  }, [noteContent]);

  const handleMoreOptions = () => {
    console.log('Quick notes options clicked');
  };

  const handleWidgetClick = () => {
    onNavigate?.('notes');
  };

  const handleTextareaClick = (e: React.MouseEvent) => {
    // Prevent widget click when clicking on textarea
    e.stopPropagation();
  };

  const getSaveStatusConfig = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          text: 'Saving...',
          icon: <Save className="h-3 w-3 animate-pulse text-blue-500" />,
          badge: 'default' as const
        };
      case 'saved':
        return {
          text: 'Saved',
          icon: <Check className="h-3 w-3 text-emerald-500" />,
          badge: 'secondary' as const
        };
      default:
        return {
          text: lastSaved ? `Last saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '',
          icon: lastSaved ? <Clock className="h-3 w-3 text-gray-400" /> : null,
          badge: 'outline' as const
        };
    }
  };

  const statusConfig = getSaveStatusConfig();
  const wordCount = noteContent.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <WidgetWrapper
      title="Quick Notes"
      moreOptions
      onMoreOptions={handleMoreOptions}
      onClick={handleWidgetClick}
    >
      <div className="space-y-5">
        {/* V2 Enhanced textarea with better styling */}
        <div className="relative">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            onClick={handleTextareaClick}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Jot down quick thoughts, ideas, or reminders..."
            className="w-full resize-none transition-all duration-200 focus:outline-none"
            style={{
              height: '144px', // 36 * 4px
              padding: designTokens.spacing[4],
              fontSize: designTokens.typography.fontSize.sm.size,
              lineHeight: designTokens.typography.fontSize.sm.lineHeight,
              fontFamily: designTokens.typography.fontFamily.sans.join(', '),
              border: `1px solid ${isFocused ? designTokens.colors.accent.primary : designTokens.colors.background.quaternary}`,
              borderRadius: designTokens.borderRadius.lg,
              backgroundColor: isFocused
                ? designTokens.colors.background.tertiary
                : designTokens.colors.background.secondary,
              color: 'white',
              boxShadow: isFocused ? `0 0 0 2px ${designTokens.colors.accent.primary}20` : 'none'
            }}
          />
          
          {/* V2 Floating action hint */}
          {noteContent.trim() && !isFocused && (
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.('notes');
                }}
                className="shadow-sm transition-colors"
                style={{
                  height: designTokens.spacing[8],
                  padding: `0 ${designTokens.spacing[3]}`,
                  fontSize: designTokens.typography.fontSize.xs.size,
                  backgroundColor: `${designTokens.colors.background.tertiary}cc`,
                  border: `1px solid ${designTokens.colors.background.quaternary}`,
                  borderRadius: designTokens.borderRadius.md,
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        {/* V2 Enhanced status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusConfig.text && (
              <Badge
                variant={statusConfig.badge}
                className="font-medium"
                style={{
                  fontSize: designTokens.typography.fontSize.xs.size,
                  borderColor: designTokens.colors.background.quaternary,
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
              >
                {statusConfig.icon}
                <span className="ml-1">{statusConfig.text}</span>
              </Badge>
            )}
          </div>
          
          {noteContent.trim() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.('notes');
              }}
              className="transition-colors"
              style={{
                fontSize: designTokens.typography.fontSize.xs.size,
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: designTokens.typography.fontFamily.sans.join(', ')
              }}
            >
              <FileText className="h-3 w-3 mr-1" />
              Open in Notes
            </Button>
          )}
        </div>
        
        {/* V2 Enhanced stats */}
        {noteContent.length > 0 && (
          <div
            className="flex items-center justify-between"
            style={{
              fontSize: designTokens.typography.fontSize.xs.size,
              color: 'rgba(255, 255, 255, 0.6)',
              fontFamily: designTokens.typography.fontFamily.sans.join(', ')
            }}
          >
            <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
            <span>{noteContent.length} characters</span>
          </div>
        )}
        
        {/* V2 Enhanced empty state */}
        {noteContent.trim() === '' && (
          <div
            className="text-center"
            style={{
              paddingTop: designTokens.spacing[8],
              paddingBottom: designTokens.spacing[8]
            }}
          >
            <div
              className="mx-auto rounded-full flex items-center justify-center"
              style={{
                width: designTokens.spacing[14],
                height: designTokens.spacing[14],
                marginBottom: designTokens.spacing[4],
                backgroundColor: `${designTokens.colors.background.tertiary}80`,
                border: `1px solid ${designTokens.colors.background.quaternary}80`
              }}
            >
              <Edit3
                style={{
                  width: designTokens.spacing[7],
                  height: designTokens.spacing[7],
                  color: 'rgba(255, 255, 255, 0.6)'
                }}
              />
            </div>
            <p
              style={{
                fontSize: designTokens.typography.fontSize.sm.size,
                fontWeight: designTokens.typography.fontWeight.medium,
                color: 'white',
                marginBottom: designTokens.spacing[2],
                fontFamily: designTokens.typography.fontFamily.sans.join(', ')
              }}
            >
              Quick capture
            </p>
            <p
              style={{
                fontSize: designTokens.typography.fontSize.xs.size,
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: designTokens.typography.fontFamily.sans.join(', ')
              }}
            >
              Start typing to capture your thoughts instantly
            </p>
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
}