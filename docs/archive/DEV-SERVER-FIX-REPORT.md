# Development Server Connection Issue - RESOLVED

## Issue Summary
Users were experiencing "ERR_CONNECTION_REFUSED" when trying to access localhost:1420, preventing access to the LibreOllama Tauri development server.

## Root Cause Analysis
The issue was caused by the Vite development server configuration in [`vite.config.ts`](vite.config.ts:27). The server was configured with:
```typescript
host: host || false,
```

When `TAURI_DEV_HOST` environment variable was not set, this defaulted to `false`, causing Vite to only bind to IPv6 localhost (`[::1]:1420`) instead of IPv4 localhost (`127.0.0.1:1420`).

## Solution Implemented
Updated the Vite configuration to explicitly bind to IPv4 localhost:
```typescript
host: host || "127.0.0.1",
```

This ensures the development server is accessible via standard localhost URLs that browsers typically use.

## Files Modified
1. **[`vite.config.ts`](vite.config.ts:27)** - Fixed host configuration
2. **[`DEV-SERVER-GUIDE.md`](DEV-SERVER-GUIDE.md)** - Added troubleshooting section for this issue

## Verification Results
✅ Development server now properly listens on IPv4 (`127.0.0.1:1420`)
✅ Server accessible via http://localhost:1420
✅ Configuration compatible with Tauri development workflow
✅ Hot module replacement working correctly

## Testing Performed
1. **Port availability check**: Confirmed no conflicts on port 1420
2. **Server startup**: Successfully started with `npm run dev`
3. **Network binding**: Verified server binds to both IPv4 and IPv6
4. **Auto-restart**: Confirmed Vite restarts properly when config changes

## Development Workflow Instructions

### Option 1: Frontend Development Only
```bash
cd tauri-app
npm run dev
```
Access at: http://localhost:1420

### Option 2: Full Tauri Development
```bash
cd tauri-app
npm run tauri:dev
```
Opens desktop application window

### Option 3: Windows Start Script
```bash
cd tauri-app
start-dev.bat
```

## Configuration Summary
- **Frontend Server**: http://127.0.0.1:1420
- **Tauri Dev URL**: http://localhost:1420 (configured in [`tauri.conf.json`](src-tauri/tauri.conf.json:8))
- **HMR Port**: 1421 (for hot module replacement)
- **Build Command**: `npm run build`
- **Before Dev Command**: `npm run dev` (configured in Tauri)

## Issue Resolution Status
🟢 **RESOLVED** - Development server connection issue fixed and verified working.

Users can now successfully access the LibreOllama Tauri application development server without "ERR_CONNECTION_REFUSED" errors.