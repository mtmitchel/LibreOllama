# Visual Regression Testing with Chromatic

This document explains how to use the visual regression testing system integrated into LibreOllama to automatically catch unintended visual changes and ensure design system consistency.

## Overview

Visual regression testing automatically compares visual snapshots of UI components to detect unexpected changes across code updates. This system:

- ✅ **Prevents design system drift** - Catches deviations from design tokens
- ✅ **Reduces manual QA time** - Automated visual testing in CI/CD  
- ✅ **Ensures consistency** - Cross-browser visual compatibility
- ✅ **Catches regressions** - Detects unintended visual changes in pull requests

## Technology Stack

- **[Ladle](https://ladle.dev/)** - Component story development (Storybook alternative)
- **[Chromatic](https://www.chromatic.com/)** - Visual regression testing service
- **GitHub Actions** - CI/CD automation

## Quick Start

### 1. Local Development

Run the component library locally:
```bash
npm run ladle
```

Build stories for testing:
```bash  
npm run ladle:build
```

### 2. Visual Testing Scripts

Test visual changes locally:
```bash
npm run visual-test
```

CI-focused testing (exits after upload):
```bash
npm run visual-test:ci
```

### 3. CI/CD Integration

Visual tests run automatically on:
- **Pull Requests** - Tests only changed components
- **Main/Develop pushes** - Full baseline updates

## Setup Instructions

### For Project Maintainers

1. **Create Chromatic Account**
   - Go to [chromatic.com](https://www.chromatic.com/)
   - Connect your GitHub repository
   - Get your project token

2. **Configure Repository Secrets**
   ```
   GitHub Settings > Secrets and Variables > Actions
   Add: CHROMATIC_PROJECT_TOKEN = your_chromatic_token
   ```

3. **Initialize Baseline**
   ```bash
   npm run visual-test:ci
   ```

### For Contributors

No additional setup required! Visual tests run automatically on pull requests.

## How It Works

### Component Stories

Stories are defined using Ladle format in `.stories.tsx` files:

```typescript
// Button.stories.tsx
export default {
  title: 'UI/Button'
};

export const Primary = () => <Button variant="primary">Primary Button</Button>;
export const Secondary = () => <Button variant="secondary">Secondary Button</Button>;
```

### Automatic Testing

1. **Developer creates PR** with UI changes
2. **GitHub Actions** triggers visual regression workflow  
3. **Ladle builds** component stories
4. **Chromatic captures** visual snapshots
5. **Comparison** against baseline images
6. **Results posted** to PR for review

### Review Process

When visual changes are detected:

1. **Review changes** in Chromatic dashboard
2. **Accept intended changes** to update baseline
3. **Reject unintended changes** and fix code
4. **Merge PR** once all visuals approved

## Best Practices

### Writing Good Stories

```typescript
// ✅ Good - Tests multiple states  
export const ButtonStates = () => (
  <div className="space-y-4">
    <Button variant="primary">Default</Button>
    <Button variant="primary" disabled>Disabled</Button>  
    <Button variant="primary" className="hover:bg-red-500">Hover</Button>
  </div>
);

// ❌ Avoid - No visual context
export const JustAButton = () => <Button>Button</Button>;
```

### Design System Coverage

Ensure stories cover:
- **All component variants** (primary, secondary, etc.)
- **Different states** (default, hover, active, disabled)
- **Responsive behavior** (mobile, tablet, desktop)
- **Dark/light themes** (if applicable)
- **Accessibility states** (focus, error, etc.)

### Handling False Positives

For intentional changes (new features, design updates):

1. **Review differences** in Chromatic  
2. **Accept changes** if intentional
3. **Document** the reason in PR description

For animations or dynamic content:
```typescript
// Disable animations for consistent snapshots
export const StableComponent = () => (
  <div className="motion-safe:animate-none">
    <AnimatedButton />
  </div>
);
```

## Workflow Integration

### Pull Request Process

1. **Create PR** with visual changes
2. **Wait for tests** to complete (~2-5 minutes)
3. **Check PR comments** for visual test results
4. **Review flagged changes** in Chromatic dashboard
5. **Approve/reject** visual changes as needed
6. **Merge** when all checks pass

### Baseline Management

The main branch serves as the visual baseline. When changes are merged to main:
- **New baselines** are automatically created  
- **Future PRs** compare against updated baselines
- **History** is preserved in Chromatic

## Troubleshooting

### Common Issues

**Build failures:**
```bash
# Clear cache and rebuild
rm -rf node_modules build
npm ci
npm run ladle:build
```

**Token issues:**
- Verify `CHROMATIC_PROJECT_TOKEN` is set correctly
- Check token hasn't expired in Chromatic dashboard

**Too many changes detected:**
- Consider if baseline needs updating
- Check for unintended global CSS changes

### Getting Help

- **Chromatic Docs**: [chromatic.com/docs](https://www.chromatic.com/docs)
- **Ladle Docs**: [ladle.dev](https://ladle.dev/)
- **Internal**: Check existing stories in `src/core/design-system/` for examples

## Maintenance

### Regular Tasks

- **Review baselines** monthly for outdated components
- **Update dependencies** quarterly
- **Archive unused** stories periodically

### Monitoring

Monitor build performance and adjust as needed:
- **Build times** should stay under 5 minutes
- **Snapshot count** growth impacts performance  
- **False positive rate** should be <5%

---

This visual regression testing system ensures LibreOllama maintains design consistency and catches visual regressions before they reach users. 🎨✨ 