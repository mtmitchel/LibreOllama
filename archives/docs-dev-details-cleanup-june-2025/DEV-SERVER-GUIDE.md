# LibreOllama Tauri Development Server Guide

## Quick Start

The LibreOllama Tauri application development server has been configured and is ready to use.

### ✅ Working URLs
- **Frontend Development**: http://localhost:1420
- **Tauri Configuration**: Correctly set to port 1420

### ❌ Not Working URLs
- **Port 3001**: This port is not configured for this application
- **Port 5173**: Default Vite port, overridden by Tauri configuration

## Starting the Development Server

### Option 1: Simple Frontend Development
```bash
cd tauri-app
npm run dev
```
Access at: http://localhost:1420

### Option 2: Full Tauri Desktop Application
```bash
cd tauri-app
npm run tauri dev
```
This will open the desktop application window.

### Option 3: Using the Start Script (Windows)
```bash
cd tauri-app
start-dev.bat
```

## Troubleshooting

### Issue: ERR_CONNECTION_REFUSED when accessing localhost
**Solution**: Updated Vite configuration to bind to IPv4 localhost
- Fixed `vite.config.ts` to use `host: "127.0.0.1"` instead of `false`
- This ensures the server is accessible via standard localhost URLs
- Server now properly listens on both IPv4 and IPv6

### Issue: Application not accessible on port 3001
**Solution**: The application is configured to run on port 1420, not 3001.
- Access the application at http://localhost:1420 instead
- The port is configured in `vite.config.ts` and `tauri.conf.json`

### Issue: "Failed to resolve import @/lib/utils"
**Solution**: Path aliases have been configured in `vite.config.ts`
- The `@` alias points to the `src` directory
- If errors persist, restart the development server

### Issue: PostCSS/Tailwind CSS errors
**Solution**: Updated PostCSS configuration
- Installed `@tailwindcss/postcss` package
- Updated `postcss.config.js` to use the correct plugin

### Issue: Development server not starting
**Steps to resolve**:
1. Stop all running Node.js processes: `taskkill /f /im node.exe`
2. Navigate to tauri-app directory: `cd tauri-app`
3. Install dependencies: `npm install`
4. Start the server: `npm run dev`

## Configuration Files

### Key Files Modified:
- **`vite.config.ts`**: Added path aliases (`@` → `./src`)
- **`postcss.config.js`**: Updated to use `@tailwindcss/postcss`
- **`tauri.conf.json`**: Configured `devUrl` to `http://localhost:1420`

### Port Configuration:
- **Vite Dev Server**: Port 1420 (configured in `vite.config.ts`)
- **Tauri Dev URL**: `http://localhost:1420` (configured in `tauri.conf.json`)
- **HMR Port**: 1421 (for hot module replacement)

## Development Workflow

1. **Start the development server**: Run `npm run dev` in the `tauri-app` directory
2. **Access the application**: Open http://localhost:1420 in your browser
3. **Hot reload**: Changes to frontend code will automatically reload
4. **Tauri development**: Use `npm run tauri dev` for desktop app development

## Features Available

✅ Chat interface from Phase 1.3
✅ Tailwind CSS styling
✅ React with TypeScript
✅ Hot module replacement
✅ Path aliases (@/lib/utils, etc.)
✅ Tauri desktop integration ready

## Common Commands

```bash
# Start frontend development server
npm run dev

# Start full Tauri development (desktop app)
npm run tauri dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install
```

## Notes

- The application is designed to work primarily on port 1420
- Port 3001 was a misconception - the app is not configured for this port
- All import errors have been resolved with proper path aliases
- PostCSS/Tailwind configuration has been updated for compatibility