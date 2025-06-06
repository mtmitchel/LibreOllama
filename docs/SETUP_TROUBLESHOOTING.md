# LibreOllama - Setup & Troubleshooting Guide

*Comprehensive guide for development environment setup, debugging, and troubleshooting.*

---

## Table of Contents

1. [Quick Start Setup](#quick-start-setup)
2. [Rust Development Environment](#rust-development-environment)
3. [Development Server Configuration](#development-server-configuration)
4. [Database Setup](#database-setup)
5. [Performance Optimization](#performance-optimization)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start Setup

### Kill Existing Processes (if needed)
```powershell
# Kill all Node.js processes
taskkill /F /IM node.exe

# Check if port 1420 is clear
netstat -ano | findstr :1420
```

### Start Development Server
```powershell
cd tauri-app
npm run dev
```

The development server should start on `http://localhost:1420`

### Troubleshooting Quick Start

**Port Conflicts**
If you get "Port 1420 is already in use" error:
1. Kill all Node.js processes: `taskkill /F /IM node.exe`
2. Wait 30 seconds for TIME_WAIT connections to clear
3. Restart the server: `npm run dev`

**PostCSS Errors**
The PostCSS configuration has been fixed to use the standard `tailwindcss` package instead of the problematic `@tailwindcss/postcss` package.

---

## Rust Development Environment

### Environment Setup
The Tauri development requires Rust toolchain to be properly configured in your environment.

### For PowerShell (Windows)
```powershell
# Add Rust to PATH for current session
$env:PATH += ";C:\Users\$env:USERNAME\.cargo\bin"

# Or permanently add to PATH
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Users\$env:USERNAME\.cargo\bin", "User")
```

### Verify Setup
```powershell
# Check Rust installation
rustc --version
cargo --version

# Test compilation
cd src-tauri
cargo check
```

### Development Commands

#### Rust Backend Only
```powershell
# Build backend
cd src-tauri
cargo build

# Run backend tests
cargo test

# Check for compilation errors
cargo check

# Format code
cargo fmt

# Run clippy linter
cargo clippy
```

#### Frontend + Backend Integration
```powershell
# Run full Tauri development server
npm run tauri dev

# Build for production
npm run tauri build
```

---

## Development Server Configuration

### ✅ Working URLs
- **Frontend Development**: http://localhost:1420
- **Tauri Configuration**: Correctly set to port 1420

### ❌ Not Working URLs
- **Port 3001**: This port is not configured for this application
- **Port 5173**: Default Vite port, overridden by Tauri configuration

### Starting the Development Server

#### Option 1: Simple Frontend Development
```powershell
cd tauri-app
npm run dev
```
Access at: http://localhost:1420

#### Option 2: Full Tauri Desktop Application
```powershell
cd tauri-app
npm run tauri dev
```
This will open the desktop application window.

#### Option 3: Using the Start Script (Windows)
```powershell
# Custom start script (if available)
.\scripts\start-dev.ps1
```

### Configuration Files

**vite.config.ts Configuration:**
```typescript
export default defineConfig({
  server: {
    port: 1420,
    strictPort: true
  },
  // ... other configuration
});
```

**tauri.conf.json Configuration:**
```json
{
  "build": {
    "devPath": "http://localhost:1420"
  }
}
```

---

## Database Setup

### LibreOllama SQLCipher Database Setup

The database system provides secure, encrypted data persistence for LibreOllama using SQLCipher.

#### Overview

The database system includes:
- **Encrypted Storage**: SQLCipher provides transparent 256-bit AES encryption
- **Schema Management**: Versioned migrations for database evolution
- **Type Safety**: Rust structs for all database entities
- **Connection Pooling**: Efficient database connection management
- **CRUD Operations**: Complete database operations for all entities

#### Architecture

```
src-tauri/src/database/
├── mod.rs           # Module exports and initialization
├── connection.rs    # SQLCipher connection management
├── schema.rs        # Table creation and migrations
├── models.rs        # Database model structs
├── operations.rs    # CRUD operations
└── test.rs          # Integration tests
```

#### Database Schema

**Core Tables:**
1. **chat_sessions**: Chat conversation sessions
2. **messages**: Individual chat messages
3. **notes**: Knowledge management notes
4. **tasks**: Task and project management
5. **canvas_elements**: Whiteboard/canvas elements
6. **user_preferences**: Application settings

#### Setup Commands

```powershell
# Initialize database
cd src-tauri
cargo run --bin db-setup

# Run database migrations
cargo run --bin migrate

# Test database connection
cargo test database::test
```

#### Connection Management

The database uses connection pooling for optimal performance:

```rust
// Connection configuration
let config = SQLitePoolOptions::new()
    .max_connections(10)
    .test_before_acquire(true);
```

#### Security Features

- **Encryption**: All data encrypted at rest with SQLCipher
- **Key Management**: Secure key derivation and storage
- **Access Control**: Role-based access to database operations
- **Audit Logging**: Transaction logging for debugging

---

## Performance Optimization

### 🚨 CPU Spike Debugging Guide

After analyzing the codebase, several potential causes of CPU spikes have been identified:

#### 1. **Aggressive Polling Intervals** ⚠️ HIGH PRIORITY

**Google API Manager (`src/lib/google-api-manager.ts`)**
- **Issue**: Multiple `setInterval` calls for calendar, tasks, and Gmail sync
- **Location**: Lines 238, 257, 276
- **Impact**: Continuous API calls every few minutes

```typescript
// PROBLEMATIC CODE:
const interval = setInterval(syncFunction, this.syncConfig.calendar.syncInterval * 60 * 1000);
const interval = setInterval(syncFunction, this.syncConfig.tasks.syncInterval * 60 * 1000);
const interval = setInterval(syncFunction, this.syncConfig.gmail.syncInterval * 60 * 1000);
```

**Solution:**
```typescript
// IMPROVED CODE:
const createThrottledInterval = (func: Function, interval: number, maxConcurrent: number = 1) => {
  let running = 0;
  return setInterval(async () => {
    if (running >= maxConcurrent) return;
    running++;
    try {
      await func();
    } finally {
      running--;
    }
  }, interval);
};
```

**Auto-Save System (`src/lib/auto-save-system.ts`)**
- **Issue**: Periodic sync interval without proper cleanup
- **Location**: Line 427
- **Impact**: Continuous background processing

**Ollama Hook (`src/hooks/use-ollama.ts`)**
- **Issue**: Auto-refresh interval for model status
- **Location**: Line 342
- **Impact**: Frequent API calls to check Ollama status

#### 2. **Infinite Animation Loops** ⚠️ HIGH PRIORITY

**Knowledge Graph (`src/components/knowledge/KnowledgeGraph.tsx`)**
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

**Solution:**
```typescript
// IMPROVED CODE:
const animate = (currentTime: number) => {
  if (currentTime - lastFrameTime >= frameInterval) {
    runSimulation();
    lastFrameTime = currentTime;
  }
  if (isVisible) {
    animationRef.current = requestAnimationFrame(animate);
  }
};
```

#### 3. **Rapid State Updates** ⚠️ MEDIUM PRIORITY

**Today's Focus Dashboard (`src/components/dashboard/TodaysFocusDashboard.tsx`)**
- **Issue**: 30-second interval for tip rotation
- **Location**: Line 100
- **Impact**: Unnecessary re-renders

### Performance Best Practices

1. **Use React.memo for expensive components**
2. **Implement proper cleanup in useEffect hooks**
3. **Debounce user input and API calls**
4. **Lazy load components and data**
5. **Optimize database queries with indexing**
6. **Use Web Workers for CPU-intensive tasks**

---

## Troubleshooting

### Common Issues

#### Port 1420 Already in Use
```powershell
# Check what's using the port
netstat -ano | findstr :1420

# Kill the process (replace PID with actual process ID)
taskkill /F /PID <PID>

# Alternative: Kill all Node processes
taskkill /F /IM node.exe
```

#### Rust Compilation Errors
```powershell
# Update Rust toolchain
rustup update

# Clean and rebuild
cd src-tauri
cargo clean
cargo build
```

#### Database Connection Issues
```powershell
# Check database file permissions
# Ensure SQLCipher is properly installed
# Verify encryption key configuration
```

#### Frontend Build Errors
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Clear Vite cache
npm run build -- --force
```

#### Tauri Development Issues
```powershell
# Reinstall Tauri CLI
cargo install tauri-cli --force

# Check Tauri configuration
npm run tauri info
```

### Performance Monitoring

#### CPU Usage Monitoring
```powershell
# Monitor Node.js processes
Get-Process -Name node | Select-Object Name, CPU, WorkingSet

# Monitor Rust processes
Get-Process | Where-Object {$_.ProcessName -like "*tauri*"}
```

#### Memory Usage Analysis
```typescript
// Frontend memory monitoring
console.log('Memory usage:', performance.memory);

// Add to development tools
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log('Memory:', Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB');
  }, 5000);
}
```

### Debug Mode

#### Enable Debug Logging
```powershell
# Set environment variables
$env:RUST_LOG = "debug"
$env:TAURI_DEBUG = "true"

# Run with debug output
npm run tauri dev
```

#### Browser Developer Tools
- Open DevTools in development: `Ctrl+Shift+I`
- Performance tab for profiling
- Memory tab for leak detection
- Network tab for API monitoring

---

*This guide consolidates all setup and troubleshooting information. For general documentation, see [MASTER_GUIDE.md](./MASTER_GUIDE.md). For feature-specific guides, see [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md).*
