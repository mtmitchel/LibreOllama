# LibreOllama Documentation Hub

Welcome to the central documentation hub for LibreOllama. This is your starting point for all project information, organized by role and purpose.

## Quick Navigation

### 🎯 For Product Managers & Leadership
- **[Production Readiness Plan](./PRODUCTION_READINESS.md)** - Complete roadmap with phases, status, and deliverables
- **[Feature Roadmap](./roadmap/README.md)** - Detailed feature specifications and requirements
- **[Task System Implementation](./TASK_SYSTEM_UNIFIED_STORE_IMPLEMENTATION.md)** - Unified task management architecture and sync strategy

### 🎨 For Designers & UI/UX
- **[Design System](./DESIGN_SYSTEM.md)** - Complete design system with tokens, components, and animations
- **[Design Mockups](../design/mockups/)** - Visual mockups for all application screens
- **[Component Explorer](https://storybook.js.org/)** - Run `npm run ladle` for interactive component gallery

### 👩‍💻 For Developers & Engineers
- **[Architecture Guide](./ARCHITECTURE.md)** - Technical implementation patterns and system design
- **[Testing Strategy](./TESTING_STRATEGY.md)** - Comprehensive testing approach and best practices
- **[Development Setup](./guides/getting-started.md)** - Quick start guide for new contributors

---

## Core Documentation

### System Architecture
- **[Architecture Guide](./ARCHITECTURE.md)** - System design, patterns, and technical implementation
- **[Testing Strategy](./TESTING_STRATEGY.md)** - Testing approach, frameworks, and best practices
- **[Task System Implementation](./TASK_SYSTEM_UNIFIED_STORE_IMPLEMENTATION.md)** - Unified task management with Google Tasks sync

### Design & User Experience  
- **[Design System](./DESIGN_SYSTEM.md)** - Colors, typography, components, animations, and accessibility
- **Component Library** - Run `npm run ladle` for interactive component explorer

### Project Management
- **[Production Readiness](./PRODUCTION_READINESS.md)** - Complete project roadmap with 3 phases
- **[Feature Roadmap](./roadmap/)** - Individual feature specifications and requirements

### Development Guides
- **[Getting Started](./guides/getting-started.md)** - New developer onboarding
- **[Development Setup](./guides/development-setup.md)** - Detailed environment configuration
- **[Deployment Guide](./guides/deployment.md)** - Production deployment instructions

---

## Feature-Specific Documentation

The `/roadmap` directory contains detailed specifications for each major feature:

- [Canvas System](./roadmap/01_canvas.md) - Visual content creation and manipulation
- [Gmail Integration](./roadmap/02_gmail_integration.md) - Email client functionality  
- [Tasks Management](./roadmap/03_tasks_management.md) - Unified Kanban board with Google Tasks sync
- [Calendar Integration](./roadmap/04_calendar_integration.md) - Google Calendar sync and management
- [Backend Services](./roadmap/05_backend_services.md) - Rust/Tauri backend architecture
- [Chat System](./roadmap/06_chat_system.md) - AI chat with multi-provider support
- [Dashboard](./roadmap/07_dashboard.md) - Main application dashboard
- [UI/UX](./roadmap/08_ui_ux.md) - User interface and experience guidelines
- [Projects](./roadmap/09_projects.md) - Project management features
- [Agents](./roadmap/10_agents.md) - AI agent system
- [Notes](./roadmap/11_notes.md) - Rich text note-taking with BlockNote
- [Settings](./roadmap/12_settings.md) - Application configuration

---

## Development Workflow

### Getting Started
1. Read [Getting Started Guide](./guides/getting-started.md)
2. Set up development environment with [Development Setup](./guides/development-setup.md)
3. Review [Architecture Guide](./ARCHITECTURE.md) for patterns and conventions
4. Explore components with `npm run ladle`

### Contributing
1. Follow [Design System](./DESIGN_SYSTEM.md) guidelines
2. Write tests according to [Testing Strategy](./TESTING_STRATEGY.md)
3. Reference feature roadmaps for requirements
4. Use production readiness plan for prioritization

### Quality Standards
- **TypeScript**: Zero errors policy
- **Testing**: Comprehensive coverage with Vitest
- **Design**: Design system compliance
- **Accessibility**: WCAG AA minimum
- **Performance**: 60fps animations, optimized renders

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:tauri        # Start Tauri dev mode

# Testing  
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Quality
npm run lint             # ESLint check
npm run type-check       # TypeScript validation

# Design System
npm run ladle            # Component explorer
```

---

## Support & Questions

- **Technical Issues**: Check [Architecture Guide](./ARCHITECTURE.md) and [Testing Strategy](./TESTING_STRATEGY.md)
- **Design Questions**: Reference [Design System](./DESIGN_SYSTEM.md)
- **Feature Requirements**: See feature-specific roadmaps in `/roadmap`
- **Project Status**: Check [Production Readiness Plan](./PRODUCTION_READINESS.md)

---

*This documentation is maintained by the LibreOllama team. For updates or corrections, please follow the standard contribution process.*