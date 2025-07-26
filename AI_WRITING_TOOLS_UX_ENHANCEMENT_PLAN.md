# AI Writing Tools UX Enhancement Plan

## Executive Summary
This document outlines critical UX improvements for the AI Writing Tools feature in LibreOllama, addressing modal interaction issues, feature completeness, and user control requirements.

## Current Issues & Solutions

### 1. Modal Close Functionality
**Issue**: Modal doesn't close properly when clicking outside or pressing ESC
**Root Cause**: Event handler conflicts and incorrect pointer-events configuration
**Solution**: 
- Fixed backdrop click handler
- Added proper pointer-events management
- Ensured ESC key works when not editing

### 2. Language Selection for Translation
**Issue**: Translation defaults to Spanish with no user control
**Solution Implemented**:
- Added language selector dropdown in modal
- Supports 12 major languages
- "Retranslate" button to regenerate with new language
- Dynamic prompt modification based on selected language

### 3. AI Model Selection
**Issue**: No way to designate default model for AI writing tools
**Solutions**:

#### Option A: Global Default in Settings
```typescript
interface AIWritingSettings {
  defaultModel: string;
  defaultProvider: LLMProvider;
  preferredStyle: 'concise' | 'detailed' | 'balanced';
  autoReplace: boolean; // Skip modal for simple actions
}
```

#### Option B: Per-Action Model Preferences
```typescript
interface AIActionPreferences {
  'rewrite-professional': { model: string; provider: LLMProvider };
  'translate': { model: string; provider: LLMProvider };
  'summarize': { model: string; provider: LLMProvider };
  // ... etc
}
```

**Recommendation**: Implement Option A first (simpler), then Option B as enhancement

### 4. Enhanced Modal Features

#### Implemented:
- **Character Count & Diff**: Shows original vs output length with percentage change
- **Edit Mode**: Users can modify AI output before replacing
- **Model Display**: Shows which AI model is being used
- **Original Text Reference**: Displays original text for comparison

#### Still Needed:
1. **Diff View**: Side-by-side or inline diff highlighting
2. **History**: Recent AI outputs for comparison
3. **Templates**: Save common prompts/styles
4. **Batch Processing**: Apply same action to multiple selections

## Feature-Specific Enhancements

### Translation
- ✅ Language selector
- ✅ Retranslate with different language
- 🔲 Auto-detect source language
- 🔲 Multiple translation engines comparison

### Professional Rewrite
- 🔲 Industry/domain selector (legal, medical, technical, etc.)
- 🔲 Formality level slider
- 🔲 Tone presets (assertive, diplomatic, persuasive)

### Summarization
- 🔲 Length preference (bullets, paragraph, percentage)
- 🔲 Focus selector (key points, conclusions, action items)
- 🔲 Format options (executive summary, abstract, tldr)

### Create Task
- 🔲 Project selector
- 🔲 Priority/due date assignment
- 🔲 Assignee selection
- 🔲 Task template application

## Settings Page Integration

### New Section: AI Writing Assistant
```
Settings > AI Writing Assistant
├── Default Model & Provider
│   ├── Provider: [Dropdown: OpenAI/Anthropic/Ollama/etc]
│   └── Model: [Dropdown: Available models for provider]
├── Writing Preferences
│   ├── Default tone: [Professional/Casual/Balanced]
│   ├── Output length: [Concise/Standard/Detailed]
│   └── Auto-replace for simple edits: [Toggle]
├── Advanced Options
│   ├── Show confidence scores: [Toggle]
│   ├── Keep conversation history: [Toggle]
│   └── Max response length: [Slider: 100-2000 chars]
└── Keyboard Shortcuts
    └── Trigger AI menu: [Customizable: Ctrl+J]
```

## UX Principles & Best Practices

### 1. User Control
- Never auto-replace without preview
- Always allow editing before replacement
- Provide clear cancel/undo options
- Show processing state clearly

### 2. Context Awareness
- Remember last used settings per action
- Adapt options based on selected text length
- Provide relevant suggestions based on content type

### 3. Performance & Feedback
- Stream responses when possible
- Show estimated completion time
- Cache recent outputs for instant re-display
- Provide clear error messages with recovery options

### 4. Accessibility
- Full keyboard navigation
- Screen reader announcements
- High contrast mode support
- Configurable text size

## Implementation Priority

### Phase 1 (Immediate)
1. ✅ Fix modal close issues
2. ✅ Add language selection for translation
3. ✅ Add character count and diff
4. ✅ Add edit capability
5. 🔲 Add AI Writing section to Settings

### Phase 2 (Next Sprint)
1. Add model selection per action
2. Implement diff view
3. Add templates/saved prompts
4. Add keyboard shortcut customization

### Phase 3 (Future)
1. Batch processing
2. History/comparison view
3. Advanced action-specific options
4. Integration with document templates

## Testing Requirements

### Functional Tests
- Modal open/close in all scenarios
- Language selection persistence
- Edit mode save/cancel
- Model selection impact on output
- Settings persistence

### UX Tests
- Time to complete common tasks
- Error recovery scenarios
- Accessibility compliance
- Cross-browser compatibility
- Mobile/tablet experience (if applicable)

## Success Metrics
- Task completion rate > 95%
- Average time to apply AI suggestion < 10 seconds
- User satisfaction score > 4.5/5
- Error rate < 2%
- Feature adoption rate > 60% of active users

## Conclusion
These enhancements will transform the AI Writing Tools from a basic feature to a professional-grade writing assistant that gives users full control while maintaining efficiency. The phased approach ensures we can deliver immediate value while building toward a comprehensive solution.