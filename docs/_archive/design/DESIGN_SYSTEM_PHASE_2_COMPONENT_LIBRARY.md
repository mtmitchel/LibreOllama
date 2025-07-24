# Phase 2: Living Component Library - Implementation Guide

## Overview

Phase 2 transforms your design system from static documentation into a living, interactive component library using **Ladle**. This provides a single source of truth for all UI components, enables rapid prototyping, and ensures consistency across your application.

## What Was Implemented

### 1. Component Library Infrastructure

#### Ladle Setup
- **Tool**: Ladle (lightweight alternative to Storybook)
- **Port**: 61000 (to avoid conflicts)
- **Integration**: Seamlessly integrates with existing Vite configuration

#### Configuration Files
- **`.ladle/config.mjs`**: Main configuration with viewport controls, theme switching, and Vite integration
- **`.ladle/components.tsx`**: Global provider that ensures all stories have access to design system CSS variables

#### Package Scripts
```json
{
  "ladle": "ladle serve",
  "ladle:build": "ladle build"
}
```

### 2. Design System Foundation Stories

#### Design Tokens Documentation (`src/core/design-system/DesignTokens.stories.tsx`)
- **Colors**: Interactive color palette showing all CSS variables
- **Typography**: Font scale with usage examples
- **Spacing**: Visual spacing scale with pixel values
- **Purpose**: Serves as visual documentation for developers

### 3. Component Stories

#### Button Component (`src/components/ui/Button.stories.tsx`)
- All variants: primary, secondary, ghost, outline, default
- All sizes: small, default, icon
- Interactive examples with Lucide React icons
- Real-world usage examples (dialogs, toolbars, quick actions)

#### Card Component (`src/components/ui/Card.stories.tsx`)
- Basic card layouts
- Widget-style cards with complex content
- Different padding variants
- Dashboard-style examples with realistic content

## How to Use the Component Library

### Starting the Component Library
```bash
npm run ladle
```
This starts the development server at `http://localhost:61000`

### Building for Production
```bash
npm run ladle:build
```
Generates a static build of the component library

### Creating New Stories

#### File Naming Convention
- `ComponentName.stories.tsx` in the same directory as the component
- Example: `src/components/ui/Button.stories.tsx`

#### Basic Story Structure
```typescript
import type { Story } from '@ladle/react';
import React from 'react';
import { YourComponent } from './index';

export const BasicExample: Story = () => (
  <YourComponent prop="value">
    Content
  </YourComponent>
);

export const WithControls: Story = ({ 
  text = 'Default text', 
  disabled = false 
}) => (
  <YourComponent disabled={disabled}>
    {text}
  </YourComponent>
);

WithControls.args = {
  text: 'Default text',
  disabled: false,
};

WithControls.argTypes = {
  text: { control: { type: 'text' } },
  disabled: { control: { type: 'boolean' } },
};

export default {
  title: 'Components/YourComponent',
};
```

### Design System Integration

#### Automatic Theme Support
- Stories automatically have access to CSS variables
- Dark/light theme switching works out of the box
- Responsive viewport testing included

#### Using Design Tokens in Stories
```typescript
const cardStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-4)',
  color: 'var(--text-primary)'
};
```

## Benefits of This Approach

### For Developers
1. **Visual Documentation**: See all components and their variants in one place
2. **Interactive Testing**: Test components in different states without building full pages
3. **Consistency**: Ensures all components follow the design system
4. **Rapid Prototyping**: Quickly build and test new component combinations

### For Designers
1. **Living Style Guide**: Components always reflect the current implementation
2. **Design Validation**: See exactly how designs translate to code
3. **Accessibility Testing**: Test components with different viewport sizes and themes

### For Teams
1. **Single Source of Truth**: No more guessing about component behavior
2. **Reduced Duplication**: Reuse existing components instead of recreating them
3. **Quality Assurance**: Catch visual regressions early
4. **Documentation**: Self-documenting components with usage examples

## Next Steps

### Immediate Actions
1. **Create More Stories**: Add stories for Input, Badge, Progress, Tabs, and other components
2. **Add Usage Guidelines**: Document when and how to use each component
3. **Accessibility Documentation**: Add accessibility guidelines to each story

### Future Enhancements
1. **Visual Regression Testing**: Integrate with tools like Chromatic
2. **Design Tokens Export**: Export design tokens to Figma or other design tools
3. **Component Templates**: Create templates for common component patterns
4. **Performance Monitoring**: Track component performance in the library

## File Structure

```
.ladle/
├── config.mjs              # Ladle configuration
└── components.tsx          # Global provider

src/
├── core/design-system/
│   └── DesignTokens.stories.tsx    # Design tokens documentation
└── components/ui/
    ├── Button.stories.tsx          # Button component stories
    ├── Card.stories.tsx            # Card component stories
    └── [Component].stories.tsx     # Additional component stories
```

## Integration with Existing Workflow

### Development Workflow
1. **Design**: Create component designs in Figma
2. **Implement**: Build components using design system tokens
3. **Document**: Create stories showing all variants and usage
4. **Test**: Use component library to test different states
5. **Review**: Share component library URL for design/code review

### Design Review Process
1. **Share Library**: Send Ladle URL to stakeholders
2. **Interactive Review**: Review components in different themes/viewports
3. **Feedback Integration**: Update components based on feedback
4. **Approval**: Components are ready for production use

## Troubleshooting

### Common Issues

#### Port Conflicts
If port 61000 is in use, update `.ladle/config.mjs`:
```javascript
export default {
  // ... other config
  port: 61001, // or another available port
};
```

#### CSS Variables Not Working
Ensure the global provider is properly importing your CSS:
```typescript
// In .ladle/components.tsx
import '../src/core/design-system/globals.css';
```

#### Stories Not Showing
Check that stories follow the naming convention:
- File must end with `.stories.tsx`
- Must be in the `src/` directory
- Must export at least one named export

## Conclusion

Phase 2 establishes a robust foundation for your design system with a living component library. This interactive documentation will accelerate development, ensure consistency, and provide a single source of truth for all UI components across your application.

The component library serves as both documentation and testing environment, making it easier to maintain design consistency as your application grows and evolves. 