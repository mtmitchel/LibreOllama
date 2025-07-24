# LibreOllama Testing Strategy

**Version:** 2.0  
**Last Updated:** 2025-01-24  
**Status:** Production Ready

## Overview

This document defines the comprehensive testing approach for LibreOllama, including unit testing, integration testing, end-to-end testing, and quality assurance practices.

## Testing Philosophy

### Core Principles

1. **Real Implementation Testing**
   - Use vanilla Zustand patterns with real store instances
   - Avoid global mocks that hide integration bugs
   - Test actual user workflows, not implementation details

2. **User-Centric Testing**
   - Focus on user behavior and outcomes
   - Test complete user journeys
   - Validate accessibility and usability

3. **Integration-First Approach**
   - Integration tests catch more real bugs than unit tests
   - Test component interactions and data flow
   - Validate frontend-backend contracts

4. **Performance Awareness**
   - Test for memory leaks and performance regressions
   - Validate animation performance (60fps)
   - Monitor bundle size impact

## Testing Framework

### Primary Tools

- **Test Runner:** Vitest with ESM configuration
- **Testing Library:** @testing-library/react + @testing-library/jest-dom
- **Mocking:** Manual mocks for external dependencies
- **Coverage:** Built-in Vitest coverage reporting
- **UI Testing:** Ladle + Chromatic for visual regression

### Configuration

```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts', './vitest.hoisted.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

## Testing Patterns

### Store Testing (Vanilla Zustand)

**✅ Recommended Pattern:**
```typescript
import { createStore } from 'zustand/vanilla';
import { createSelectionStore } from '../stores/selectionStore';

describe('SelectionStore', () => {
  let store: ReturnType<typeof createSelectionStore>;

  beforeEach(() => {
    store = createStore(createSelectionStore);
  });

  it('should select elements', () => {
    const elementId = 'test-id';
    store.getState().selectElement(elementId);
    
    expect(store.getState().selectedElementIds).toEqual(
      new Set([elementId])
    );
  });
});
```

**❌ Avoid React Hook Testing:**
```typescript
// This causes useSyncExternalStore errors
const { result } = renderHook(() => useSelectionStore());
```

### Component Testing

**Integration Test Pattern:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('should handle click events', async () => {
    const handleClick = vi.fn();
    
    render(
      <Button onClick={handleClick} variant="primary">
        Click me
      </Button>
    );
    
    const button = screen.getByRole('button', { name: /click me/i });
    await fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveClass('bg-accent-primary');
  });
});
```

### Mocking Strategy

**Konva.js Mocking:**
```typescript
// vitest.hoisted.setup.ts
vi.mock('konva', () => ({
  Konva: {
    Stage: vi.fn(),
    Layer: vi.fn(),
    Rect: vi.fn(),
    Circle: vi.fn(),
    Text: vi.fn(),
    Transformer: vi.fn()
  }
}));
```

**Tauri API Mocking:**
```typescript
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn().mockResolvedValue(null)
}));
```

## Test Categories

### Unit Tests

**Purpose:** Test individual functions and utilities in isolation.

**Examples:**
- Utility functions (date formatting, validation)
- Pure data transformations
- Mathematical calculations
- String manipulations

**Coverage Target:** 90%+

```typescript
// Example: Utility function test
describe('formatDate', () => {
  it('should format dates correctly', () => {
    const date = new Date('2025-01-24T10:30:00Z');
    expect(formatDate(date)).toBe('Jan 24, 2025 at 10:30 AM');
  });
});
```

### Integration Tests

**Purpose:** Test component interactions and data flow between multiple systems.

**Examples:**
- Store state updates affecting UI
- Component communication patterns
- Service layer integration
- API request/response cycles

**Coverage Target:** 80%+

```typescript
// Example: Canvas integration test
describe('Canvas Integration', () => {
  it('should create and select elements', async () => {
    const { container } = render(<CanvasTestWrapper />);
    
    // Create element
    const createButton = screen.getByRole('button', { name: /rectangle/i });
    await fireEvent.click(createButton);
    
    // Verify element exists in store
    const elements = store.getState().elements;
    expect(elements).toHaveLength(1);
    expect(elements[0].type).toBe('rectangle');
  });
});
```

### End-to-End Tests

**Purpose:** Test complete user workflows across the entire application.

**Examples:**
- User authentication flow
- Email composition and sending
- Task creation and management
- Canvas drawing and saving

**Coverage Target:** Core user journeys

```typescript
// Example: E2E workflow test
describe('Email Workflow', () => {
  it('should compose and send email', async () => {
    // Login
    await authenticateUser();
    
    // Navigate to compose
    await clickComposeButton();
    
    // Fill form
    await fillEmailForm({
      to: 'test@example.com',
      subject: 'Test Email',
      body: 'Hello World'
    });
    
    // Send
    await clickSendButton();
    
    // Verify sent
    expect(await findSentMessage()).toBeInTheDocument();
  });
});
```

### Visual Regression Tests

**Purpose:** Detect unexpected UI changes and maintain design consistency.

**Tools:** Chromatic + Storybook/Ladle

**Process:**
1. Component stories in Ladle
2. Automated screenshots via Chromatic
3. Visual diff detection
4. Manual approval workflow

### Performance Tests

**Purpose:** Ensure application performance meets standards.

**Metrics:**
- Memory usage < 500MB
- 60fps animations
- Component render times
- Bundle size limits

```typescript
// Example: Performance test
describe('Canvas Performance', () => {
  it('should maintain 60fps during drawing', async () => {
    const perfObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        expect(entry.duration).toBeLessThan(16.67); // 60fps
      });
    });
    
    perfObserver.observe({ entryTypes: ['measure'] });
    
    // Simulate drawing operations
    await performDrawingTest();
  });
});
```

## Accessibility Testing

### Automated Testing

**axe-core Integration:**
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Component />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing Checklist

- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announcements are appropriate
- [ ] Focus indicators are visible and clear
- [ ] Color contrast meets WCAG AA standards
- [ ] Form labels are properly associated
- [ ] ARIA attributes are correct and necessary

## Authentication & Persistence Testing

### OAuth Flow Testing

```typescript
describe('Gmail Authentication', () => {
  it('should handle OAuth token refresh', async () => {
    // Mock expired token
    mockTokenExpiry();
    
    // Attempt API call
    const result = await gmailService.getMessages();
    
    // Verify token refresh was triggered
    expect(mockRefreshToken).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
```

### Persistence Testing

```typescript
describe('State Persistence', () => {
  it('should restore state after app restart', async () => {
    // Set initial state
    store.getState().updateSettings({ theme: 'dark' });
    
    // Simulate app restart
    await simulateAppRestart();
    
    // Verify state restoration
    expect(store.getState().settings.theme).toBe('dark');
  });
});
```

## Notes System Testing

### BlockNote Editor Testing

```typescript
describe('Notes Editor', () => {
  it('should handle rich text editing', async () => {
    render(<NotesEditor />);
    
    const editor = screen.getByRole('textbox');
    
    // Type content
    await fireEvent.input(editor, {
      target: { innerHTML: '<h1>Test Heading</h1><p>Test paragraph</p>' }
    });
    
    // Verify formatting
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Heading');
    expect(screen.getByText('Test paragraph')).toBeInTheDocument();
  });
});
```

### Notes Integration Testing

```typescript
describe('Notes Integration', () => {
  it('should save and load notes', async () => {
    const { getByRole, getByText } = render(<NotesPage />);
    
    // Create new note
    await fireEvent.click(getByRole('button', { name: /new note/i }));
    
    // Add content
    const editor = getByRole('textbox');
    await fireEvent.input(editor, {
      target: { innerHTML: '<p>Test note content</p>' }
    });
    
    // Save note
    await fireEvent.click(getByRole('button', { name: /save/i }));
    
    // Reload page
    render(<NotesPage />);
    
    // Verify note exists
    expect(getByText('Test note content')).toBeInTheDocument();
  });
});
```

## Test Organization

### Directory Structure

```
src/
├── tests/
│   ├── __mocks__/           # Mock implementations
│   ├── helpers/             # Test utilities
│   ├── integration/         # Integration test suites
│   ├── performance/         # Performance tests
│   └── setup.ts            # Test configuration
├── features/
│   └── [feature]/
│       └── tests/          # Feature-specific tests
└── components/
    └── [component]/
        └── Component.test.tsx
```

### Test Naming Conventions

```typescript
// Component tests
Button.test.tsx
Modal.test.tsx

// Integration tests
gmail-integration.test.tsx
canvas-drawing.test.tsx

// Feature tests
notes-editor.test.tsx
tasks-kanban.test.tsx
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Quality Gates

- All tests must pass
- Coverage must be ≥ 80%
- No TypeScript errors
- No ESLint errors
- Visual regression tests approved

## Common Testing Scenarios

### Memory Leak Detection

```typescript
describe('Memory Leaks', () => {
  it('should not leak memory during navigation', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Perform navigation cycles
    for (let i = 0; i < 10; i++) {
      await navigateToPage('/canvas');
      await navigateToPage('/mail');
      await navigateToPage('/dashboard');
    }
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Allow for some memory growth but detect leaks
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

### Race Condition Testing

```typescript
describe('Race Conditions', () => {
  it('should handle concurrent store updates', async () => {
    const operations = [
      () => store.getState().addElement({ type: 'rectangle' }),
      () => store.getState().addElement({ type: 'circle' }),
      () => store.getState().addElement({ type: 'text' })
    ];
    
    // Run operations concurrently
    await Promise.all(operations.map(op => op()));
    
    // Verify consistent state
    const elements = store.getState().elements;
    expect(elements).toHaveLength(3);
    expect(elements.map(e => e.type)).toEqual(['rectangle', 'circle', 'text']);
  });
});
```

## Debugging Tests

### Debug Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Enable debugging
    pool: 'forks',
    isolate: false,
    watch: false,
    
    // Increase timeout for debugging
    testTimeout: 30000,
    
    // Verbose output
    reporter: 'verbose'
  }
});
```

### Debug Commands

```bash
# Run specific test in debug mode
npm test -- --run ComponentName.test.tsx

# Run with UI for debugging
npm run test:ui

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Best Practices

### Do's ✅

- Use real store instances with vanilla Zustand patterns
- Test user behavior, not implementation details
- Write descriptive test names that explain the expected behavior
- Use proper cleanup in afterEach/beforeEach hooks
- Mock external dependencies at the module boundary
- Test error conditions and edge cases
- Maintain test isolation (no shared state)

### Don'ts ❌

- Don't use global store mocks (they hide real bugs)
- Don't test implementation details (internal function calls)
- Don't skip test cleanup (causes test pollution)
- Don't use arbitrary timeouts (prefer waitFor)
- Don't test third-party library behavior
- Don't ignore flaky tests (fix the root cause)

## Troubleshooting

### Common Issues

**Issue:** Tests hang or timeout
**Solution:** Check for infinite loops, missing await keywords, or improper cleanup

**Issue:** React hook errors in tests
**Solution:** Use vanilla Zustand testing patterns instead of renderHook

**Issue:** Konva-related test failures
**Solution:** Ensure proper Konva mocking in hoisted setup file

**Issue:** Flaky integration tests
**Solution:** Use waitFor for async operations, avoid arbitrary timeouts

### Performance Optimization

- Use `vi.fn()` sparingly (prefer real implementations)
- Clean up subscriptions and timers in test cleanup
- Use `beforeEach` for test isolation
- Avoid heavy setup in test files

## Metrics and Reporting

### Coverage Targets

- **Unit Tests:** 90%+ coverage
- **Integration Tests:** 80%+ coverage
- **Critical Paths:** 100% coverage

### Quality Metrics

- Test execution time < 30 seconds
- No flaky tests (>95% reliability)
- Memory usage increase < 10MB per test run
- All accessibility tests pass

### Reporting

- Coverage reports generated on every CI run
- Visual regression reports via Chromatic
- Performance metrics tracked over time
- Test results integrated with GitHub PR status

---

*This testing strategy ensures LibreOllama maintains high quality standards while enabling rapid development and reliable user experiences.*