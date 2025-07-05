# Changelog

All notable changes to the LibreOllama project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2024-12-30

### 🐛 Fixed

#### Critical Console Errors Resolution
- **Fixed nested button DOM violations in DropdownMenu component**
  - Removed wrapper button element that was creating invalid `<button>` inside `<button>` nesting
  - Implemented proper trigger element cloning with event handlers
  - Added accessibility attributes (`aria-expanded`, `aria-haspopup`)
  - Location: `src/components/ui/DropdownMenu.tsx`

- **Fixed infinite re-render loop in Calendar component**
  - Memoized `handleNewEvent` callback using `useCallback`
  - Memoized `headerProps` object using `useMemo`
  - Resolved "Maximum update depth exceeded" errors
  - Location: `src/app/pages/Calendar.tsx`

- **Fixed DOM nesting violations in ChatMessageBubble component**
  - Changed Text component to render as `div` instead of `p` when containing nested paragraphs
  - Resolved "validateDOMNesting: <p> cannot appear as a descendant of <p>" warnings
  - Location: `src/features/chat/components/ChatMessageBubble.tsx`

- **Fixed DOM structure issues in Notes component**
  - Properly structured button elements within list items
  - Improved code formatting for better readability and accessibility
  - Location: `src/app/pages/Notes.tsx` (2 instances)

#### React Component Property Validation
- **Fixed invalid DOM props in ConversationList component**
  - Removed unsupported `lineHeight` prop from Caption components
  - Removed unsupported `weight` prop from Caption components
  - Resolved "React does not recognize the lineHeight prop on a DOM element" warnings
  - Location: `src/features/chat/components/ConversationList.tsx`

### 📈 Performance Improvements
- **Optimized React re-renders**
  - Implemented proper memoization patterns in Calendar component
  - Reduced unnecessary component re-renders through stable dependencies
  - Fixed HeaderContext memoization (previously implemented)

### 🔧 Technical Improvements
- **Enhanced accessibility**
  - Added proper ARIA attributes to dropdown triggers
  - Improved keyboard navigation support
  - Better semantic HTML structure

- **Code quality improvements**
  - Improved component prop validation
  - Better error handling patterns
  - Enhanced DOM compliance

### 📝 Development Experience
- **Console hygiene**
  - Eliminated critical React rendering errors
  - Reduced console noise during development
  - Improved debugging experience

### 🔍 Monitoring
- **Performance warnings identified**
  - Noted ~3-second message handler performance violations (non-critical)
  - CursorManager logging identified as verbose but functional
  - Canvas store initialization working correctly

---

## Summary

This update resolves all critical console errors that were causing React rendering issues, DOM nesting violations, and infinite re-render loops. The application now runs cleanly without console errors, with improved performance and better accessibility compliance.

**Before**: Multiple critical React errors, DOM violations, infinite re-renders
**After**: Clean console output, optimized performance, proper React patterns

The remaining performance warnings are optimization opportunities rather than critical issues and can be addressed in future updates. 