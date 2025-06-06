# LibreOllama Development Guide

**Created**: December 2024  
**Status**: Active Development Phase  
**Project Phase**: UI/UX Enhancement & Polish (Phase 3)

---

## 🎯 Project Overview

LibreOllama has undergone a complete transformation from LibreChat to a **comprehensive ADHD-optimized AI productivity desktop application** built with Tauri. This guide provides complete development instructions for the current UI/UX enhancement phase.

### Current State Summary

#### ✅ **COMPLETED MAJOR PHASES** (December 2024)
1. **Phase 1**: Design System Foundation - Modern design tokens, components, layout system
2. **Phase 2**: Core Features - Dual-view chat, Kanban tasks, block-based notes, context management
3. **Phase 3**: Advanced Features - Canvas/Whiteboard, AI Agent Builder, Knowledge Graph, Productivity Dashboard
4. **Phase 4**: Final Cleanup - Legacy file removal, Docker cleanup, Next.js migration complete
5. **Phase 5**: Google APIs Integration - Calendar, Tasks, Gmail integration
6. **Canvas Redesign**: Professional-grade whiteboard with Miro/FigJam functionality
7. **Enhanced Focus Mode**: ADHD-optimized focus features with cognitive load management
8. **Whiteboard Performance Optimization Phase 1a**: Spatial indexing system (10-100x performance improvement)

#### 🚀 **CORE FEATURES IMPLEMENTED**
- **Unified Workspace**: Three-column layout with focus mode, command palette, onboarding wizard
- **Enhanced Chat Interface**: Streaming chat, dual-view model comparison, context visualization, auto-save
- **Professional Whiteboard**: Spatial indexing, performance monitoring, advanced drawing tools
- **Task Management**: Kanban boards, list views, drag-drop functionality
- **Note-Taking**: Block-based editor with rich text formatting
- **Context Management**: Smart cross-feature suggestions, workflow-specific actions
- **Google Integration**: Calendar, Tasks, Gmail synchronization
- **Focus Mode**: ADHD-optimized concentration tools with cognitive load management
- **Theme System**: Complete light/dark mode with CSS variables and accessibility compliance

---

## 🔄 **CURRENT FOCUS: UI/UX Enhancement & Polish**

### **Project Status**: ~85% Complete

We are currently in **Phase 3: UI/UX Enhancement & Polish**, focusing on refining existing components to fully align with Design System v1.1 specifications.

### **Implementation Roadmap**

#### **Week 1-2: Foundation Component Enhancements** 🎯

##### 1. Enhanced Button System

**Current State**: Base button variants implemented in `src/styles/components/buttons.css`

**Required Enhancements**:

###### 1.1 Icon Support Implementation
```typescript
// src/components/ui/button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth && 'btn-full-width',
        loading && 'btn-loading'
      )}
      disabled={loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={16} />}
      {!loading && leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
      <span className="btn-content">{children}</span>
      {!loading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
    </button>
  );
};
```

###### 1.2 Loading States CSS
```css
/* src/styles/components/buttons.css */
.btn-loading {
  pointer-events: none;
  opacity: 0.7;
}

.btn-icon-left {
  margin-right: var(--space-2);
  display: flex;
  align-items: center;
}

.btn-icon-right {
  margin-left: var(--space-2);
  display: flex;
  align-items: center;
}

.btn-content {
  display: flex;
  align-items: center;
}

/* Size variants */
.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: 12px;
  min-height: 28px;
}

.btn-md {
  padding: var(--space-2) var(--space-4);
  font-size: 14px;
  min-height: 36px;
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: 16px;
  min-height: 44px;
}
```

**Files to Modify**:
- `src/styles/components/buttons.css`
- `src/components/ui/button.tsx`

**Priority**: HIGH - Foundation component used throughout application

##### 2. Advanced Input Components

**Current State**: Basic input fields implemented

**Required Enhancements**:

###### 2.1 Enhanced Input Component
```typescript
// src/components/ui/input.tsx
interface InputProps {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'search';
  size?: 'sm' | 'md' | 'lg';
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className={cn(
        'input-wrapper',
        `input-${variant}`,
        `input-${size}`,
        error && 'input-error',
        leftIcon && 'input-has-left-icon',
        rightIcon && 'input-has-right-icon'
      )}>
        {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
        <input
          className={cn('input-field', className)}
          {...props}
        />
        {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
    </div>
  );
};
```

**Files to Modify**:
- `src/styles/components/inputs.css`
- `src/components/ui/input.tsx`

**Priority**: HIGH - Core form component

##### 3. Navigation Enhancements

**Current State**: Basic navigation and command palette foundation implemented

**Required Enhancements**:
- Left sidebar contextual intelligence
- Enhanced command palette integration
- Comprehensive keyboard shortcut system
- Breadcrumb improvements

**Files to Modify**:
- `src/components/navigation/`
- `src/components/PrimaryNavigation.tsx`
- `src/hooks/use-command-palette.ts`

**Priority**: MEDIUM - UX improvement

#### **Week 3-4: Dashboard Widget Enhancements** 🎯

##### 1. Dashboard Widgets

**Current State**: Basic widgets implemented (`TodaysFocusDashboard`, `ActivityAggregationHub`)

**Required Enhancements**:

###### 1.1 Enhanced Progress Indicators
```typescript
// src/components/widgets/ProgressWidget.tsx
interface ProgressWidgetProps {
  title: string;
  current: number;
  total: number;
  variant?: 'circular' | 'linear';
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export const ProgressWidget: React.FC<ProgressWidgetProps> = ({
  title,
  current,
  total,
  variant = 'circular',
  showPercentage = true,
  color = 'primary'
}) => {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="progress-widget">
      <h3 className="widget-title">{title}</h3>
      {variant === 'circular' ? (
        <CircularProgress value={percentage} color={color} />
      ) : (
        <LinearProgress value={percentage} color={color} />
      )}
      {showPercentage && (
        <span className="progress-text">{percentage}%</span>
      )}
    </div>
  );
};
```

###### 1.2 Quick Actions Widget
```typescript
// src/components/widgets/QuickActionsWidget.tsx
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export const QuickActionsWidget: React.FC<{ actions: QuickAction[] }> = ({ actions }) => {
  return (
    <div className="quick-actions-widget">
      <h3 className="widget-title">Quick actions</h3>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            className="quick-action-btn"
            onClick={action.action}
          >
            <span className="quick-action-icon">{action.icon}</span>
            <span className="quick-action-label">{action.label}</span>
            {action.shortcut && (
              <span className="quick-action-shortcut">{action.shortcut}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
```

**Files to Modify**:
- `src/components/dashboard/TodaysFocusDashboard.tsx`
- `src/components/dashboard/ActivityAggregationHub.tsx`
- `src/components/widgets/`
- `src/styles/components/widgets.css`

**Priority**: MEDIUM - Dashboard enhancement

##### 2. Layout Improvements

**Required Enhancements**:
- Drag-and-drop widget reordering
- Customizable dashboard layouts
- Widget resize functionality
- Responsive grid system

**Files to Modify**:
- `src/components/MainDashboardView.tsx`
- `src/hooks/use-drag-drop.ts`
- `src/styles/layouts/dashboard.css`

**Priority**: LOW - Nice-to-have feature

#### **Week 5-6: Chat Interface Polish** 🎯

##### 1. Enhanced Message Bubbles

**Current State**: Basic message bubbles implemented

**Required Enhancements**:

###### 1.1 Improved Message Design
```css
/* src/styles/components/chat.css */
.message {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  max-width: 100%;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 14px;
}

.message.user .message-avatar {
  background: var(--accent-primary);
  color: white;
}

.message.ai .message-avatar {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
}

.message-content {
  max-width: 70%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  position: relative;
}

.message.user .message-content {
  background: var(--accent-primary);
  color: white;
  border-bottom-right-radius: var(--radius-sm);
}

.message.ai .message-content {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-bottom-left-radius: var(--radius-sm);
}
```

##### 2. Enhanced Attachments

**Required Enhancements**:
- Rich file previews
- Drag-and-drop upload
- Progress indicators
- File type icons

**Files to Modify**:
- `src/components/chat/`
- `src/styles/components/chat.css`
- `src/hooks/use-chat.ts`

**Priority**: MEDIUM - User experience improvement

---

## 📁 Key File Structure Reference

### **Main Components**
```
src/components/
├── MainDashboardView.tsx          # Main dashboard container
├── PrimaryNavigation.tsx          # Left sidebar navigation
├── UnifiedWorkspace.tsx           # Main app shell
├── dashboard/
│   ├── TodaysFocusDashboard.tsx   # Focus dashboard widget
│   ├── ActivityAggregationHub.tsx # Activity tracking widget
│   └── index.ts                   # Dashboard exports
├── ui/
│   ├── button.tsx                 # Button component
│   ├── input.tsx                  # Input component
│   ├── card.tsx                   # Card component
│   └── ...                        # Other UI components
├── chat/
│   └── ...                        # Chat components
├── navigation/
│   └── ...                        # Navigation components
└── widgets/
    └── ...                        # Dashboard widgets
```

### **Design System**
```
src/styles/
├── components/
│   ├── buttons.css                # Button styles
│   ├── inputs.css                 # Input styles
│   ├── cards.css                  # Card styles
│   ├── chat.css                   # Chat styles
│   └── widgets.css                # Widget styles
├── layouts/
│   ├── dashboard.css              # Dashboard layout
│   ├── workspace.css              # Main workspace layout
│   └── navigation.css             # Navigation layout
└── globals.css                    # Global styles and variables
```

### **Documentation**
```
docs/
├── QUICK_REFERENCE_CURRENT_STATE.md  # Quick reference (entry point)
├── DEVELOPMENT_GUIDE.md              # This comprehensive guide
├── CURRENT_PHASE_ROADMAP.md          # Current phase roadmap
└── archive/
    └── HISTORICAL_ROADMAP.md          # Completed phases archive
```

---

## 🎨 Design System Alignment

### **Color Variables** (from Design System v1.1)
```css
/* Primary Accent */
--accent-primary: #3b82f6;
--accent-secondary: #1d4ed8;
--accent-soft: rgba(59, 130, 246, 0.15);
--accent-hover: rgba(59, 130, 246, 0.2);

/* Semantic Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;

/* Text Colors (Dark Theme) */
--text-primary: #ffffff;
--text-secondary: #94a3b8;
--text-tertiary: #64748b;
--text-muted: #475569;

/* Background Colors (Dark Theme) */
--bg-primary: #0f1419;
--bg-secondary: #1a2332;
--bg-tertiary: #242b3d;
--bg-surface: #2a3441;
--bg-elevated: #323a47;
```

### **Typography Scale**
```css
/* Font Sizes */
--text-xs: 11px;    /* Small/muted text */
--text-sm: 12px;    /* Secondary text/labels */
--text-base: 14px;  /* Body text */
--text-lg: 16px;    /* Emphasized body text */
--text-xl: 18px;    /* Section titles */
--text-2xl: 20px;   /* Widget titles */
--text-3xl: 26px;   /* Note editor title */
--text-4xl: 28px;   /* Page titles */
--text-5xl: 32px;   /* Large page titles */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### **Spacing System** (8px grid)
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

---

## ✅ Implementation Checklist

### **Week 1-2: Foundation Components**
- [ ] Enhanced Button System
  - [ ] Icon support (left/right)
  - [ ] Loading states with spinner
  - [ ] Size variants (sm, md, lg)
  - [ ] Full-width option
  - [ ] Accessibility improvements
- [ ] Advanced Input Components
  - [ ] Icon support (left/right)
  - [ ] Error handling and validation
  - [ ] Label and helper text integration
  - [ ] Search input variant
  - [ ] Enhanced focus states
- [ ] Navigation Enhancements
  - [ ] Sidebar contextual intelligence
  - [ ] Command palette improvements
  - [ ] Keyboard shortcuts
  - [ ] Breadcrumb enhancements

### **Week 3-4: Dashboard Widgets**
- [ ] Widget Enhancements
  - [ ] Progress indicators (circular/linear)
  - [ ] Quick actions with shortcuts
  - [ ] Better visual hierarchy
  - [ ] Consistent spacing and typography
- [ ] Layout Improvements
  - [ ] Drag-and-drop reordering
  - [ ] Customizable layouts
  - [ ] Widget resize functionality
  - [ ] Responsive grid system

### **Week 5-6: Chat Interface**
- [ ] Message Bubble Enhancements
  - [ ] Improved avatar design
  - [ ] Better message spacing
  - [ ] Enhanced code block styling
  - [ ] Consistent border radius
- [ ] Attachment System
  - [ ] Rich file previews
  - [ ] Drag-and-drop upload
  - [ ] Progress indicators
  - [ ] File type icons
- [ ] Context Visualization
  - [ ] Better context indicators
  - [ ] Token count display
  - [ ] Clear context functionality

---

## 🧪 Testing Strategy

### **Component Testing**
1. **Visual Regression Testing**: Ensure components match design system
2. **Accessibility Testing**: WCAG 2.1 AA compliance
3. **Responsive Testing**: Mobile and desktop layouts
4. **Interaction Testing**: Hover states, focus states, loading states

### **Integration Testing**
1. **Cross-component Compatibility**: Ensure components work together
2. **Theme Testing**: Light and dark mode consistency
3. **Performance Testing**: Component render performance
4. **User Flow Testing**: Complete user journeys

---

## 📚 Resources

### **Design System Reference**
- Design System v1.1 specification
- Component library documentation
- Color palette and typography guidelines

### **Development Tools**
- React + TypeScript
- Tailwind CSS + Custom CSS
- Lucide Icons
- shadcn/ui components

### **Key Technologies**
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Desktop**: Tauri (Rust backend)
- **Database**: SQLCipher (encrypted SQLite)
- **Icons**: Lucide Icons
- **UI Components**: shadcn/ui + custom components

---

## 🚀 Getting Started

### **For Developers**
1. Review this development guide
2. Check current component implementations
3. Start with Week 1-2 foundation components
4. Follow design system specifications
5. Test thoroughly before moving to next phase

### **For Designers**
1. Review Design System v1.1
2. Validate component designs against specifications
3. Provide feedback on implementation
4. Create additional component variants as needed

### **For Project Managers**
1. Track progress using the implementation checklist
2. Prioritize high-impact components first
3. Ensure quality over speed
4. Plan user testing sessions for each phase

---

## 📝 Implementation Notes

- **Maintain Backward Compatibility**: Ensure existing functionality continues to work
- **Progressive Enhancement**: Add new features without breaking existing ones
- **Performance First**: Optimize for performance, especially on lower-end devices
- **Accessibility**: Follow WCAG 2.1 AA guidelines throughout
- **Documentation**: Update component documentation as you implement changes
- **Testing**: Write tests for new components and features

This guide serves as the single source of truth for current development work. Update it as implementation progresses and new requirements emerge.