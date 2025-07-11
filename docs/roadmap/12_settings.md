**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT DELETE IT.**

# Settings Roadmap

This document provides a comprehensive overview of the Settings feature, including its current implementation details and future development plans.

## Design Assets

- **Mockups:** 
  - [Settings general mockup.png](../../design/mockups/Settings%20general%20mockup.png)
  - [settings integrations mockup.png](../../design/mockups/settings%20integrations%20mockup.png)
  - [settings angents and models mockup.png](../../design/mockups/settings%20angents%20and%20models%20mockup.png)
- **Specs:**
  - [settings-general.html](../../design/specs/settings-general.html)
  - [settings-integrations.html](../../design/specs/settings-integrations.html)
  - [settings-agents-models.html](../../design/specs/settings-agents-models.html)

## Current Implementation

The Settings page is a comprehensive configuration interface with a sidebar navigation and multiple sections for different types of settings.

### Frontend Architecture

- **Main Component:** The `Settings.tsx` page provides a full-featured settings interface with sidebar navigation and section-based content.
- **Navigation Structure:** A clean sidebar with categorized settings sections including General, Appearance, Agents & Models, Integrations, etc.
- **Design System Integration:** Uses the unified design system with proper design tokens, spacing, and component consistency.
- **State Management:** Currently uses local React state for settings values. No dedicated settings store yet.

### Backend Architecture

- **No Backend Implementation:** Settings are currently stored in localStorage or component state. No backend persistence or Tauri commands for settings management.

### Implemented Features

- Complete settings UI with sidebar navigation
- General settings section with startup preferences and regional settings
- Agents & Models section with Ollama server configuration and model management
- Integrations section with Google account management and API key configuration
- Professional toggle switches and form controls
- Responsive design with proper focus management and accessibility

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### High Priority / Known Issues

- [ ] **Settings Integration:** Settings page exists but needs to control actual app behavior - requires global settings store or context.
- [ ] **Theme Toggle Connection:** TopBar theme toggle and Settings Appearance section need to be connected.
- [ ] **Ollama Configuration:** Settings Ollama config needs to connect to Chat system.
- [ ] **Settings Persistence:** Settings reset on page refresh - need localStorage or backend persistence.

### MVP Must-Haves

- [x] **Settings UI:** Complete settings interface with sidebar navigation. *(Existing)*
- [x] **General Preferences:** Basic application startup and regional settings. *(Existing)*
- [x] **Ollama Configuration:** Local AI model server configuration. *(Existing)*
- [ ] **Global Settings Store:** Create unified settings store that other components can access.
- [ ] **Settings-App Integration:** Connect Settings to actual app behavior (theme, startup view, Ollama endpoint).
- [ ] **Settings Persistence:** Save settings to localStorage with automatic restoration on app start.

### Post-MVP Enhancements

- [ ] **Advanced Integrations:** Complete Google Calendar/Tasks integration settings.
- [ ] **Notification Preferences:** Email and push notification configuration.
- [ ] **Security Settings:** Password management and privacy controls.
- [ ] **Account Management:** User profile and account settings.
- [ ] **Export/Import Settings:** Backup and restore settings configuration.

### Future Vision & "Wow" Delighters

- [ ] **Settings Sync:** Cloud sync of settings across multiple devices.
- [ ] **Smart Defaults:** AI-powered recommendation of optimal settings based on usage patterns.
- [ ] **Plugin Settings:** Dynamic settings sections for third-party integrations.
- [ ] **Settings Search:** Quick search and filtering within settings sections.

### UX/UI Improvements

- [ ] **Appearance Section:** Complete the appearance section with theme selection, font size, and density options.
- [ ] **Notes & Editor Section:** Implement editor preferences and note-taking settings.
- [ ] **Notifications Section:** Design and implement notification preferences UI.
- [ ] **About Section:** Add version information, changelog, and support links.

### Technical Debt & Refactoring

- [ ] **Dedicated Settings Store:** Create a dedicated Zustand store (`settingsStore.ts`) to manage all settings state.
- [ ] **Cross-Module Integration:**
  - [ ] Connect Settings theme toggle to TopBar theme toggle (unified theme management).
  - [ ] Connect Settings Ollama endpoint to Chat system's AI service.
  - [ ] Connect Settings startup view to App.tsx routing logic.
  - [ ] Connect Settings language/region to app-wide localization.
- [ ] **Settings Context Provider:** Create React context to provide settings to all components.
- [ ] **Backend Integration:**
  - [ ] Design database schema for storing user settings.
  - [ ] Create backend services in Rust for settings CRUD operations.
  - [ ] Expose settings services via Tauri commands.
- [ ] **Settings Validation:** Implement comprehensive validation for all settings inputs.
- [ ] **Type Safety:** Add proper TypeScript interfaces for all settings sections.
- [ ] **Test Coverage:** Add comprehensive tests for settings functionality and persistence.
- [ ] **Documentation:** Document the settings architecture and available configuration options. 