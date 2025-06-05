# Archive Documentation

This directory contains historical documentation from previous phases of LibreOllama development.

## Contents

### Outdated Architecture Documentation
- `ARCHITECTURE_NEXTJS_OUTDATED.md` - Previous Next.js-based architecture (replaced by Tauri)
- `DEVELOPMENT_NEXTJS_OUTDATED.md` - Development guide for the old Next.js version
- `TROUBLESHOOTING_NEXTJS_OUTDATED.md` - Troubleshooting for the deprecated Next.js implementation
- `CHANGELOG_LIBRECHAT_OUTDATED.md` - Legacy changelog from LibreChat fork

### Phase Completion Reports
- `PHASE_1_*` - Foundation and design system implementation
- `PHASE_2_*` - Core features and AI integration
- `PHASE_3_*` - Advanced features and linking system
- `PHASE_4_*` - Unified workspace and final cleanup
- `PHASE_5_*` - Google APIs integration

### Feature Implementation Reports
- `CANVAS_REDESIGN_COMPLETION_REPORT.md` - Professional whiteboard implementation
- `DATABASE_INTEGRATION_VALIDATION_REPORT.md` - SQLCipher database setup
- `ENHANCED_FOCUS_MODE_*` - ADHD-optimized focus features
- `FRONTEND_INTEGRATION_COMPLETE.md` - UI/UX integration completion
- `WHITEBOARD_PERFORMANCE_OPTIMIZATION_*` - Canvas performance improvements

### Technical Implementation
- `BACKEND_COMMANDS_COMPLETION.md` - Tauri command implementation
- `TAURI_DEVELOPMENT_FIXED.md` - Tauri development environment setup
- `DEV-SERVER-FIX-REPORT.md` - Development server configuration fixes

### Design and UX
- `UI_UX_*` - User interface and experience redesign documentation
- `THEME_AUDIT_CHECKLIST.md` - Design system audit
- `UX_OVERHAUL_AI_PROMPT.md` - AI-assisted UX improvements

## Purpose

These documents serve as:
1. **Historical Reference** - Understanding the project's evolution
2. **Migration Context** - Details about transitions between architectures
3. **Implementation Insights** - Lessons learned from each development phase
4. **Feature Documentation** - Comprehensive records of feature implementations

## Current Architecture

For current documentation, see:
- [Main Documentation](../README.md)
- [Development Guides](../development/)
- [Project README](../../README.md)

The project now uses:
- **Frontend**: React + TypeScript with Tauri
- **Backend**: Rust with Tauri framework
- **Database**: SQLCipher for encrypted local storage
- **AI Integration**: Local Ollama models