# CPU Spike Debugging Guide for LibreOllama Tauri App

## 🚨 Identified CPU Spike Sources

After analyzing your codebase, I found several potential causes of CPU spikes:

### 1. **Aggressive Polling Intervals** ⚠️ HIGH PRIORITY

#### Google API Manager (`src/lib/google-api-manager.ts`)
- **Issue**: Multiple `setInterval` calls for calendar, tasks, and Gmail sync
- **Location**: Lines 238, 257, 276
- **Impact**: Continuous API calls every few minutes

```typescript
// PROBLEMATIC CODE:
const interval = setInterval(syncFunction, this.syncConfig.calendar.syncInterval * 60 * 1000);
const interval = setInterval(syncFunction, this.syncConfig.tasks.syncInterval * 60 * 1000);
const interval = setInterval(syncFunction, this.syncConfig.gmail.syncInterval * 60 * 1000);
```

#### Auto-Save System (`src/lib/auto-save-system.ts`)
- **Issue**: Periodic sync interval without proper cleanup
- **Location**: Line 427
- **Impact**: Continuous background processing

#### Ollama Hook (`src/hooks/use-ollama.ts`)
- **Issue**: Auto-refresh interval for model status
- **Location**: Line 342
- **Impact**: Frequent API calls to check Ollama status

### 2. **Infinite Animation Loops** ⚠️ HIGH PRIORITY

#### Knowledge Graph (`src/components/knowledge/KnowledgeGraph.tsx`)
- **Issue**: `requestAnimationFrame` loop without proper frame limiting
- **Location**: Lines 314-320
- **Impact**: Continuous rendering even when not visible

```typescript
// PROBLEMATIC CODE:
const animate = () => {
  runSimulation();
  animationRef.current = requestAnimationFrame(animate); // No frame limiting!
};
```

### 3. **Rapid State Updates** ⚠️ MEDIUM PRIORITY

#### Today's Focus Dashboard (`src/components/dashboard/TodaysFocusDashboard.tsx`)
- **Issue**: 30-second interval for tip rotation
- **Location**: Line 100
- **Impact**: Unnecessary re-renders

#### Activity Aggregation Hub (`src/components/dashboard/ActivityAggregationHub.tsx`)
- **Issue**: Frequent interval updates
- **Location**: Line 133

## 🔧 Quick Fixes

### Fix 1: Add Frame Limiting to Knowledge Graph

```typescript
// In src/components/knowledge/KnowledgeGraph.tsx
let lastFrameTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

const animate = (currentTime: number) => {
  if (currentTime - lastFrameTime >= frameInterval) {
    runSimulation();
    lastFrameTime = currentTime;
  }
  animationRef.current = requestAnimationFrame(animate);
};
```

### Fix 2: Increase Polling Intervals

```typescript
// In src/lib/google-api-manager.ts
// Change from minutes to longer intervals
const SYNC_INTERVALS = {
  calendar: 15, // 15 minutes instead of 5
  tasks: 30,    // 30 minutes instead of 10
  gmail: 60     // 1 hour instead of 15 minutes
};
```

### Fix 3: Add Visibility API Checks

```typescript
// Add to components with intervals
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Pause intervals when tab is not visible
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      // Resume when tab becomes visible
      startInterval();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

## 🔍 Debugging Steps

### Step 1: Enable Debug Logging

```bash
# In your terminal:
set RUST_LOG=debug
npm run tauri:dev
```

### Step 2: Monitor Performance

1. Open DevTools (F12)
2. Go to **Performance** tab
3. Click **Record** and use the app for 30 seconds
4. Stop recording and analyze:
   - Look for long tasks (red bars)
   - Check for excessive function calls
   - Identify memory leaks

### Step 3: Check Console Errors

Look for:
- Infinite loop warnings
- Failed API calls
- React warnings about missing dependencies

### Step 4: Network Tab Analysis

Check for:
- Excessive API requests
- Failed requests causing retries
- Large response payloads

## 🛠️ Immediate Actions

### 1. Disable Non-Essential Features

Temporarily comment out:
- Knowledge Graph simulation
- Google API sync intervals
- Auto-save periodic sync

### 2. Add Performance Monitoring

```typescript
// Add to main components
const performanceMonitor = {
  start: performance.now(),
  log: (label: string) => {
    console.log(`${label}: ${performance.now() - performanceMonitor.start}ms`);
  }
};
```

### 3. Implement Debouncing

```typescript
// For frequent state updates
const debouncedUpdate = useMemo(
  () => debounce((value) => {
    // Your update logic
  }, 300),
  []
);
```

## 🎯 Long-term Solutions

1. **Implement Web Workers** for heavy computations
2. **Use React.memo** for expensive components
3. **Add intersection observers** for off-screen components
4. **Implement virtual scrolling** for large lists
5. **Use React Suspense** for code splitting

## 📊 Performance Metrics to Track

- CPU usage in Task Manager
- Memory consumption
- Frame rate (should be 60fps)
- Network requests per minute
- Bundle size

## 🚀 Testing Commands

```bash
# Basic dev server
npm run dev

# Tauri dev with debug logging
set RUST_LOG=debug && npm run tauri:dev

# Build and analyze bundle
npm run build
npm run preview
```

---

**Next Steps**: Start with the frame limiting fix for KnowledgeGraph and increase the polling intervals. These should provide immediate relief from CPU spikes.