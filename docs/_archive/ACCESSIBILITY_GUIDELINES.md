# Design System Accessibility Guidelines

## Overview

This document establishes formal accessibility (A11y) requirements for the Asana-inspired Design Language Specification (DLS). Every component, both existing and new, must meet these standards to ensure inclusive design and WCAG AA compliance.

## Core Accessibility Principles

### 1. **Perceivable**
- Information and UI components must be presentable in ways users can perceive
- Provide text alternatives for non-text content
- Ensure sufficient color contrast
- Make content adaptable to different presentations

### 2. **Operable** 
- UI components and navigation must be operable
- Make all functionality keyboard accessible
- Give users enough time to read content
- Don't use content that causes seizures

### 3. **Understandable**
- Information and UI operation must be understandable
- Make text readable and understandable
- Make content appear and operate predictably
- Help users avoid and correct mistakes

### 4. **Robust**
- Content must be robust enough for interpretation by assistive technologies
- Maximize compatibility with current and future assistive tools

## Design System A11y Requirements Checklist

### **Mandatory Requirements for All Components**

#### ✅ **1. Keyboard Navigation**
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus is visible with `--border-focus` token (2px solid)
- [ ] Focus trapping works correctly in modals/dropdowns
- [ ] Escape key closes overlays and cancels actions
- [ ] Arrow keys navigate within grouped controls
- [ ] Enter/Space activate buttons and toggles

**Implementation:**
```tsx
// Focus management example
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Escape':
      handleClose();
      break;
    case 'ArrowDown':
      e.preventDefault();
      focusNextItem();
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      handleActivate();
      break;
  }
};
```

#### ✅ **2. ARIA Attributes**
- [ ] Proper semantic HTML elements used (`button`, `input`, `select`, etc.)
- [ ] ARIA roles added only when semantic HTML isn't sufficient
- [ ] `aria-label` or `aria-labelledby` on all interactive elements
- [ ] `aria-describedby` links to help text and error messages
- [ ] `aria-expanded` on collapsible controls
- [ ] `aria-selected` on selectable items
- [ ] `aria-checked` on checkboxes and radio buttons
- [ ] `aria-invalid` on form fields with validation errors
- [ ] `aria-live` regions for dynamic content updates

**Implementation:**
```tsx
// ARIA attributes example
<button
  aria-expanded={isOpen}
  aria-haspopup="menu"
  aria-controls={menuId}
  aria-describedby={helpTextId}
>
  Menu
</button>
```

#### ✅ **3. Color Contrast**
- [ ] Text meets WCAG AA contrast ratios (4.5:1 for normal, 3:1 for large)
- [ ] Interactive elements meet 3:1 contrast with surrounding colors
- [ ] Focus indicators meet 3:1 contrast with background
- [ ] Information isn't conveyed by color alone
- [ ] High contrast themes available for enhanced accessibility

**DLS Token Compliance:**
```css
/* Our design tokens ensure compliance */
--text-primary: #151B26;    /* 16.75:1 on white background */
--text-secondary: #6B6F76;  /* 5.74:1 on white background */
--border-focus: #796EFF;    /* 4.51:1 contrast ratio */
```

#### ✅ **4. Screen Reader Support**
- [ ] All content is accessible to screen readers
- [ ] Images have alt text (empty alt="" for decorative)
- [ ] Form labels properly associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Dynamic content changes announced
- [ ] Loading states communicated
- [ ] Progress indicators have accessible names

**Implementation:**
```tsx
// Screen reader friendly updates
<div aria-live="polite" aria-atomic="true">
  {isLoading ? "Loading..." : `${items.length} items loaded`}
</div>
```

### **Component-Specific Requirements**

#### **Form Components**
- [ ] Labels properly associated with form controls
- [ ] Required field indicators (`*` or "required" text)
- [ ] Error messages linked with `aria-describedby`
- [ ] Validation errors announced immediately
- [ ] Help text available and accessible
- [ ] Fieldsets group related controls with legends

#### **Navigation Components**
- [ ] Skip links provided for keyboard users
- [ ] Breadcrumbs use `nav` element with `aria-label`
- [ ] Current page indicated with `aria-current="page"`
- [ ] Menu items have proper roles and states
- [ ] Nested menus properly structured

#### **Interactive Components**
- [ ] Buttons have descriptive text (not just "Click here")
- [ ] Loading/disabled states communicated
- [ ] Toggle buttons show pressed state with `aria-pressed`
- [ ] Sliders have `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- [ ] Progress indicators have labels and current values

#### **Modal/Overlay Components**
- [ ] Focus trapped within modal
- [ ] Focus returned to trigger element on close
- [ ] Modal labeled with `aria-labelledby` or `aria-label`
- [ ] Background content hidden from screen readers (`aria-hidden="true"`)
- [ ] Escape key closes modal

#### **Data Display Components**
- [ ] Tables have proper headers and captions
- [ ] Complex data has multiple access methods
- [ ] Charts have text alternatives
- [ ] Status information available to screen readers
- [ ] Sort states announced in data tables

### **Motion & Animation**

#### ✅ **5. Reduced Motion Support**
- [ ] Respects `prefers-reduced-motion: reduce`
- [ ] Essential motion (loading indicators) still functions
- [ ] Animations can be disabled without breaking functionality
- [ ] No flashing content that could cause seizures

**Implementation:**
```css
/* Built into our design tokens */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### **Mobile & Touch**

#### ✅ **6. Touch Accessibility**
- [ ] Touch targets at least 44x44px (iOS) or 48x48px (Android)
- [ ] Adequate spacing between touch targets
- [ ] Gestures have accessible alternatives
- [ ] Content scales properly up to 200% zoom
- [ ] Horizontal scrolling avoided at standard zoom levels

**DLS Implementation:**
```css
/* Minimum touch target sizes */
.btn-sm { min-height: 32px; min-width: 64px; } /* Small buttons */
.btn-md { min-height: 40px; min-width: 88px; } /* Standard buttons */  
.btn-lg { min-height: 48px; min-width: 120px; } /* Large buttons */
```

## Testing & Validation

### **Automated Testing Tools**
- **axe-core**: Automated accessibility testing
- **Lighthouse**: Accessibility audit scores
- **WAVE**: Browser extension for manual testing
- **Pa11y**: Command line accessibility testing

### **Manual Testing Procedures**

#### **1. Keyboard Testing**
1. Disconnect mouse/trackpad
2. Navigate entire interface using only keyboard
3. Verify all functionality is accessible
4. Check focus indicators are visible
5. Ensure focus doesn't get trapped unexpectedly

#### **2. Screen Reader Testing**
- **Windows**: Test with NVDA (free) or JAWS
- **macOS**: Test with built-in VoiceOver
- **Linux**: Test with Orca
- **Mobile**: Test with iOS VoiceOver/Android TalkBack

#### **3. Visual Testing**
1. Test with 400% zoom (WCAG requirement)
2. Test high contrast mode
3. Verify color contrast with tools like Colour Contrast Analyser
4. Test with color blindness simulators

#### **4. Motor Accessibility Testing**
1. Test with reduced motion enabled
2. Verify touch targets are appropriately sized
3. Test with switch navigation (if possible)
4. Verify drag-and-drop has keyboard alternatives

### **Browser & Assistive Technology Support**

#### **Minimum Support Matrix**
| Browser | Screen Reader | Platform | Support Level |
|---------|---------------|----------|---------------|
| Chrome  | NVDA         | Windows  | Full |
| Firefox | NVDA         | Windows  | Full |
| Edge    | NVDA         | Windows  | Full |
| Safari  | VoiceOver    | macOS    | Full |
| Safari  | VoiceOver    | iOS      | Full |
| Chrome  | TalkBack     | Android  | Full |

## Implementation Guidelines

### **Development Workflow**

#### **1. Design Phase**
- [ ] Consider accessibility from initial design
- [ ] Document keyboard interactions in design specs
- [ ] Specify ARIA requirements for complex components
- [ ] Design focus states alongside default states

#### **2. Development Phase**
- [ ] Use semantic HTML first, ARIA second
- [ ] Test keyboard navigation during development
- [ ] Implement focus management for complex components
- [ ] Add accessibility tests to component test suites

#### **3. Review Phase**
- [ ] Run automated accessibility tests
- [ ] Perform manual keyboard testing
- [ ] Test with screen reader
- [ ] Validate color contrast
- [ ] Review with accessibility checklist

#### **4. QA Phase**
- [ ] Full accessibility audit on new features
- [ ] Test with assistive technology users if possible
- [ ] Validate across different browsers and devices
- [ ] Document any accessibility limitations

### **Documentation Requirements**

Each component must include:
1. **Accessibility Features**: List of A11y features implemented
2. **Keyboard Interactions**: Table of supported keyboard shortcuts
3. **ARIA Implementation**: Description of ARIA attributes used
4. **Usage Guidelines**: Best practices for accessible implementation

### **Common A11y Anti-Patterns to Avoid**

❌ **Don't:**
- Use `div` or `span` for buttons without proper ARIA
- Rely on color alone to convey information
- Create keyboard traps that can't be escaped
- Use placeholder text as the only form label
- Hide focus indicators entirely
- Use `aria-label` on non-interactive elements
- Create custom controls without keyboard support
- Use auto-playing audio/video without controls

✅ **Do:**
- Use semantic HTML elements by default
- Provide multiple ways to access information
- Design with keyboard-first approach
- Include assistive technology users in testing
- Provide clear, descriptive error messages
- Follow established interaction patterns
- Test early and often with real users
- Document accessibility features clearly

## Resources & Tools

### **Testing Tools**
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome DevTools  
- [WAVE](https://wave.webaim.org/extension/) - Browser extension
- [Color Contrast Analyser](https://www.tpgi.com/color-contrast-checker/) - Desktop app
- [Pa11y](https://pa11y.org/) - Command line testing

### **Documentation**
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project](https://www.a11yproject.com/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### **Screen Readers**
- [NVDA](https://www.nvaccess.org/) - Free Windows screen reader
- [VoiceOver](https://support.apple.com/guide/voiceover/) - Built into macOS/iOS
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) - Windows commercial
- [Orca](https://wiki.gnome.org/Projects/Orca) - Linux screen reader

---

**Remember**: Accessibility is not a checkbox to tick off, but an ongoing commitment to inclusive design. Every user deserves equal access to our applications.