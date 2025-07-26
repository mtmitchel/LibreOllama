# LibreOllama UI Assets

This directory contains SVG assets extracted from the Obra shadcn/ui Community Figma design file for the LibreOllama project.

## Asset Categories

### 🔧 Input Components

#### Input OTP Elements
- `input-otp-column-2.svg` through `input-otp-column-12.svg` (11 files)
  - UI elements for OTP (One-Time Password) input fields
  - Different column configurations and states

#### Textarea Components
- `textarea-resizable-empty.svg` - Empty state resizable handle
- `textarea-resizable-placeholder.svg` - Placeholder state resizable handle
- `textarea-resizable-value.svg` - With value resizable handle
- `textarea-resizable-focus.svg` - Focused state resizable handle
- `textarea-resizable-error.svg` - Error state resizable handle
- `textarea-resizable-error-focus.svg` - Error + focused state resizable handle
- `textarea-resizable-disabled.svg` - Disabled state resizable handle

### 🎯 Navigation & Control Icons

#### Chevron Icons
- `chevron-up.svg` (12x7px) - Upward pointing chevron
- `chevron-down.svg` (12x7px) - Downward pointing chevron
- `accordion-chevron-up.svg` (14x8px) - Accordion upward chevron
- `accordion-chevron-down.svg` (14x8px) - Accordion downward chevron

#### Close/Action Icons
- `close-icon-x-1.svg` (14x14px) - Close/X icon variant 1
- `close-icon-x-2.svg` (14x14px) - Close/X icon variant 2
- `check-icon.svg` (18x13px) - Checkmark icon

### 📊 Data & Form Icons

#### Table Sorting
- `arrow-up-down-1.svg` (10x6px) - Sort arrow component 1
- `arrow-up-down-2.svg` (2x18px) - Sort arrow component 2
- `arrow-up-down-3.svg` (10x6px) - Sort arrow component 3
- `arrow-up-down-4.svg` (2x18px) - Sort arrow component 4

#### Action Icons
- `pencil-icon.svg` (24x24px) - Edit/pencil icon
- `trash-icon.svg` (24x24px) - Delete/trash icon

### 🎚️ Form Elements
- `slider-value-1.svg` (163x6px) - Slider progress indicator 1
- `slider-value-2.svg` (100x6px) - Slider progress indicator 2

## Usage Guidelines

### File Naming Convention
Files are named descriptively based on their function and component type:
- `{component}-{element}-{state}.svg`
- `{icon-name}-icon.svg`

### Integration Notes
1. **Input OTP**: Use the column SVGs for building OTP input fields with different configurations
2. **Textarea**: The resizable handles provide visual feedback for different textarea states
3. **Navigation**: Chevron icons for dropdowns, accordions, and navigation elements
4. **Actions**: Standard edit/delete icons for data tables and forms
5. **Data Tables**: Arrow components for sortable table headers

### Recommended Usage
- Import these SVGs as React components or use them directly in your UI
- Maintain the aspect ratios when scaling
- Consider using CSS classes for consistent styling across similar icon types

## Source Information
- **Source**: Obra shadcn/ui Community Figma Design
- **File Key**: 6c1QnVhlUeGWor0qIZUR90
- **Extracted**: July 25, 2025
- **Components Covered**: Input OTP, Textarea, Field, Accordion, Dialog, Data Table

## File Formats
All assets are in SVG format for:
- ✅ Scalability without quality loss
- ✅ Small file sizes
- ✅ Easy integration with web technologies
- ✅ Customizable colors and styles via CSS

---

*This asset collection provides a comprehensive foundation for building UI components consistent with modern design systems.*
