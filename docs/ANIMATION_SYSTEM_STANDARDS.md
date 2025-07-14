# LibreOllama Animation System Standards

**Version:** 1.0  
**Last Updated:** Current  
**Status:** Production Ready

## Overview

This document defines standardized animation and transition patterns for the LibreOllama Design System. These standards ensure consistent, performant, and accessible animations across all components and features.

## Animation Principles

### 1. Purpose-Driven Animation
- **Micro-interactions** - Provide immediate feedback for user actions
- **State transitions** - Communicate system state changes clearly
- **Spatial awareness** - Help users understand layout and hierarchy changes
- **Progressive enhancement** - Never block functionality for reduced-motion users

### 2. Performance First
- Use `transform` and `opacity` for best performance
- Leverage hardware acceleration with `transform3d()`
- Prefer CSS transitions over JavaScript animations
- Respect `prefers-reduced-motion` accessibility preference

### 3. Consistent Timing
- Follow standardized duration scales
- Use semantic timing rather than arbitrary values
- Maintain visual rhythm across components

## Standardized Duration Scale

### **Duration Tokens**
```css
/* Micro-interactions (hover, focus) */
--duration-fast: 150ms;

/* State changes (active, selected) */
--duration-base: 200ms;

/* Layout transitions (modal open/close) */
--duration-slow: 300ms;

/* Complex animations (page transitions) */
--duration-slower: 500ms;
```

### **Usage Guidelines**
| Duration | Use Case | Examples |
|----------|----------|----------|
| `150ms` | Micro-interactions | Hover states, button press, focus indicators |
| `200ms` | State transitions | Color changes, selection, toggle states |
| `300ms` | Layout changes | Modal open/close, dropdown expand, card transforms |
| `500ms` | Complex animations | Page transitions, complex reveals, multi-step animations |

## Standardized Easing Functions

### **Easing Tokens**
```css
/* Natural motion curves */
--ease-out: cubic-bezier(0, 0, 0.2, 1);        /* Deceleration */
--ease-in: cubic-bezier(0.4, 0, 1, 1);         /* Acceleration */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);   /* Smooth acceleration + deceleration */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy spring effect */
```

### **Usage Guidelines**
| Easing | Use Case | Examples |
|--------|----------|----------|
| `ease-out` | Entrances, reveals | Elements appearing, modals opening |
| `ease-in` | Exits, dismissals | Elements disappearing, modals closing |
| `ease-in-out` | State changes | Color transitions, size changes |
| `ease-spring` | Playful interactions | Success feedback, fun micro-interactions |

## Animation Patterns

### 1. Hover Effects

**Standard Hover Pattern:**
```tsx
// ✅ CORRECT - Consistent hover timing
className="transition-colors duration-200 hover:bg-bg-secondary"

// ✅ CORRECT - Scale hover for interactive elements
className="transition-transform duration-150 hover:scale-105"

// ✅ CORRECT - Combined hover effects
className="transition-all duration-200 hover:bg-bg-secondary hover:shadow-md"
```

**Hover Guidelines:**
- Use `duration-200` for color changes
- Use `duration-150` for transform changes
- Apply subtle scale transforms: `hover:scale-105` (5% increase)
- Combine multiple properties with `transition-all` when needed

### 2. Button Interactions

**Standard Button Pattern:**
```tsx
className="transition-all duration-150 hover:scale-105 active:scale-95"
```

**Button States:**
- **Hover**: `scale-105` + color change
- **Active**: `scale-95` (pressed down effect)
- **Focus**: Ring with `focus:ring-2`
- **Loading**: Spinner with `animate-spin`

### 3. Modal Animations

**Standard Modal Pattern:**
```tsx
// Overlay
className="transition-all duration-300 animate-in fade-in"

// Modal container
className="transition-all duration-300 animate-in zoom-in-95"
```

**Modal Animation Sequence:**
1. Overlay fades in (300ms)
2. Modal scales in from 95% to 100% (300ms)
3. Reverse on close

### 4. Loading States

**Spinner Animation:**
```tsx
className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"
```

**Pulse Animation:**
```tsx
className="animate-pulse bg-bg-secondary rounded-md"
```

**Loading Guidelines:**
- Use `animate-spin` for active loading
- Use `animate-pulse` for skeleton content
- Always include loading text for screen readers

### 5. Toast Notifications

**Standard Toast Pattern:**
```tsx
className="transform transition-all duration-300 ease-in-out 
           translate-x-0 opacity-100
           data-[state=closed]:translate-x-full data-[state=closed]:opacity-0"
```

**Toast Animation Sequence:**
1. Slide in from right (300ms)
2. Auto-dismiss after duration
3. Slide out to right (300ms)

### 6. Dropdown Menus

**Standard Dropdown Pattern:**
```tsx
className="animate-in fade-in-0 zoom-in-95 duration-200"
```

**Dropdown Guidelines:**
- Quick entrance (200ms)
- Immediate exit (no animation)
- Scale from 95% to 100%
- Fade in from 0 opacity

## Component-Specific Patterns

### Button Component
```tsx
// Standard interactive button
className="transition-all duration-150 
           hover:scale-105 hover:bg-accent-secondary 
           active:scale-95 
           focus:ring-2 focus:ring-accent-primary"

// Icon button
className="transition-transform duration-150 hover:scale-110"

// Destructive button
className="transition-colors duration-200 
           hover:bg-error hover:text-white"
```

### Card Component
```tsx
// Interactive card
className="transition-all duration-200 
           hover:scale-[1.02] hover:shadow-lg"

// Subtle card hover
className="transition-shadow duration-200 hover:shadow-md"
```

### Form Controls
```tsx
// Input focus
className="transition-all duration-200 
           focus:border-accent-primary 
           focus:ring-2 focus:ring-accent-primary/20"

// Toggle switch
className="transition-transform duration-200 
           data-[state=checked]:translate-x-5"
```

### Navigation
```tsx
// Nav item hover
className="transition-colors duration-200 
           hover:bg-bg-secondary hover:text-text-primary"

// Active nav item
className="transition-all duration-200 
           bg-selected-bg text-selected-text"
```

## Accessibility Considerations

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Implementation Pattern:
```tsx
// Respect reduced motion preference
className="motion-safe:transition-transform motion-safe:duration-200 
           motion-safe:hover:scale-105"
```

### Guidelines:
- Always provide `motion-safe:` prefixes for non-essential animations
- Ensure core functionality works without animations
- Test with reduced motion enabled
- Use semantic HTML for screen reader compatibility

## Performance Optimization

### Hardware Acceleration
```css
/* Force hardware acceleration */
transform: translate3d(0, 0, 0);
will-change: transform;
```

### Efficient Properties
```tsx
// ✅ PERFORMANT - Uses transform and opacity
className="transition-transform duration-200 hover:scale-105"
className="transition-opacity duration-200 hover:opacity-80"

// ❌ AVOID - Triggers layout/paint
className="transition-all duration-200 hover:width-full"
className="transition-all duration-200 hover:height-full"
```

### Animation Guidelines:
- Prefer `transform` over changing layout properties
- Use `opacity` for fade effects
- Avoid animating `width`, `height`, `top`, `left`
- Use `transform: scale()` instead of width/height changes
- Use `transform: translate()` for position changes

## Implementation Utilities

### Tailwind Animation Classes

**Standard Animations:**
```css
/* Already available in Tailwind */
.animate-spin      /* 1s linear infinite rotation */
.animate-ping      /* 1s cubic-bezier(0,0,0.2,1) infinite scale + opacity */
.animate-pulse     /* 2s cubic-bezier(0.4,0,0.6,1) infinite opacity */
.animate-bounce    /* 1s infinite bounce effect */
```

**Custom Animation Classes:**
```css
/* Add to globals.css */
.animate-in {
  animation-fill-mode: both;
}

.fade-in {
  animation: fadeIn var(--duration-base) var(--ease-out);
}

.zoom-in-95 {
  animation: zoomIn95 var(--duration-base) var(--ease-out);
}

.slide-in-right {
  animation: slideInRight var(--duration-slow) var(--ease-out);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn95 {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

### React Animation Utilities

**Custom Hook for Animations:**
```tsx
import { useEffect, useState } from 'react';

export function useAnimation(isVisible: boolean, duration = 300) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  return { shouldRender, isAnimating };
}
```

## Testing Animations

### Visual Testing
```tsx
// Test animation states
expect(button).toHaveClass('hover:scale-105');
expect(modal).toHaveClass('animate-in fade-in zoom-in-95');

// Test reduced motion respect
expect(element).toHaveClass('motion-safe:transition-transform');
```

### Performance Testing
- Use Chrome DevTools Performance tab
- Monitor for layout thrashing
- Check frame rates during animations
- Validate 60fps performance on target devices

## Migration Guidelines

### Converting Legacy Animations

**Before (Inconsistent patterns):**
```tsx
// Various timing inconsistencies
className="transition-all duration-100"    // Too fast
className="transition-all duration-400"    // Non-standard
style={{ transition: '0.3s ease-in-out' }} // Inline styles
```

**After (Standardized patterns):**
```tsx
// Consistent, semantic timing
className="transition-colors duration-200"
className="transition-transform duration-150 hover:scale-105"
className="transition-all duration-300 ease-in-out"
```

### Systematic Conversion Process:
1. **Audit existing animations** - Find all transition/animation usage
2. **Categorize by purpose** - Hover, state change, layout, etc.
3. **Apply standard patterns** - Use appropriate duration and easing
4. **Test performance** - Ensure smooth 60fps animations
5. **Validate accessibility** - Test with reduced motion

## Quality Checklist

### Animation Standards Compliance:
- [ ] Uses standardized duration tokens
- [ ] Applies appropriate easing functions
- [ ] Respects reduced motion preferences
- [ ] Achieves 60fps performance
- [ ] Provides clear visual feedback
- [ ] Maintains accessibility
- [ ] Follows semantic timing patterns

### Component Animation Checklist:
- [ ] Hover states use `duration-150` or `duration-200`
- [ ] Modal animations use `duration-300`
- [ ] Button interactions include scale transforms
- [ ] Loading states use appropriate spinners
- [ ] Focus indicators are clearly visible
- [ ] Animations enhance rather than distract

---

## Conclusion

Consistent animation patterns create a cohesive and professional user experience. By following these standards, LibreOllama maintains visual continuity while ensuring performance and accessibility.

**Key Principles:**
- **Consistency** - Use standardized timing and easing
- **Performance** - Prioritize transform and opacity
- **Accessibility** - Respect user preferences and provide alternatives
- **Purpose** - Every animation should serve a clear function

For questions or updates to these standards, refer to the design system team or propose changes through the established review process. 