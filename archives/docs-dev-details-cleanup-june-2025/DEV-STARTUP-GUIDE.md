# LibreOllama Tauri Development Environment Setup

## Quick Start Commands

### Kill Existing Processes (if needed)
```bash
# Kill all Node.js processes
taskkill /F /IM node.exe

# Check if port 1420 is clear
netstat -ano | findstr :1420
```

### Start Development Server
```bash
cd tauri-app
npm run dev
```

The development server should start on `http://localhost:1420`

## Troubleshooting

### Port Conflicts
If you get "Port 1420 is already in use" error:
1. Kill all Node.js processes: `taskkill /F /IM node.exe`
2. Wait 30 seconds for TIME_WAIT connections to clear
3. Restart the server: `npm run dev`

### PostCSS Errors
The PostCSS configuration has been fixed to use the standard `tailwindcss` package instead of the problematic `@tailwindcss/postcss` package.

### Dependencies
- **PostCSS**: Uses `tailwindcss` and `autoprefixer`
- **Vite**: Development server on port 1420
- **Tauri**: Desktop application framework

## Current Status
✅ Port conflicts resolved
✅ PostCSS configuration fixed
✅ Development server running on http://localhost:1420
✅ Chat interface from Phase 1.3 accessible

## Verified Working Configuration
- **PostCSS**: Standard `tailwindcss` plugin
- **Port**: 1420 (as configured in `tauri.conf.json`)
- **Dependencies**: Clean, no conflicting packages