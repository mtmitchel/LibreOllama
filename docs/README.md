# LibreOllama Documentation

**Welcome to the LibreOllama documentation!** This index provides a comprehensive guide to all available documentation, organized for easy navigation.

## 📋 Core Documentation

### **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - **PRIMARY REFERENCE**
- Current implementation status for all systems
- Accurate assessment without exaggerated claims
- Production readiness evaluation
- Known issues and limitations
- **Status**: ✅ Current and accurate

### **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - **DEVELOPER GUIDE**
- Practical development patterns and best practices
- Architecture guidelines for each system
- Common development tasks and troubleshooting
- Testing strategies and setup requirements
- **Status**: ✅ Consolidated from multiple sources

## 🎯 System-Specific Documentation

### Canvas System
- **Current Status**: Functional with active development
- **Architecture**: React Konva with unified store pattern
- **Key Tools**: Text, Sticky Notes, Sections, Connectors, Pen tool
- **Location**: `src/features/canvas/`

### Gmail Integration
- **Current Status**: Functional backend with frontend integration
- **Architecture**: Service-oriented Rust backend with Tauri commands
- **Security**: OAuth2 with OS keyring token storage
- **Location**: `src-tauri/src/services/gmail/`, `src/features/mail/`

### Calendar & Tasks Integration
- **Current Status**: Implemented with Google Services
- **Architecture**: Real Google API integration with TypeScript types
- **Features**: FullCalendar integration, Kanban board, multi-account support
- **Location**: `src/services/google/`, `src/stores/googleStore.ts`

## 🔧 Technical References

### **[TECHNICAL_DEBT.md](TECHNICAL_DEBT.md)** - Issue Tracking
- High-priority technical debt items
- Known issues and their solutions
- Production insights from testing

### **[KONVA REACT GUIDES/](KONVA%20REACT%20GUIDES/)** - Canvas Technical Reference
- Detailed Konva React implementation patterns
- Canvas development best practices
- Component architecture guides

## 📁 Archived Documentation

Historical documentation is preserved in `docs/_archive/` for reference only. These files represent previous iterations of the development process and should not be used for current development work.

**Note**: The archived documentation contains outdated information and exaggerated claims. Always refer to the current documentation above.

## 🚀 Quick Start

1. **Check Status**: Review [PROJECT_STATUS.md](PROJECT_STATUS.md) for current implementation status
2. **Development**: Follow [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for practical development patterns
3. **Issues**: Check [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) for known issues and solutions

## 📋 Documentation Guidelines

### When to Update Documentation
- ✅ Implementation status changes → Update PROJECT_STATUS.md
- ✅ New development patterns → Update IMPLEMENTATION_GUIDE.md
- ✅ Technical issues identified → Update TECHNICAL_DEBT.md

### When NOT to Create New Documentation
- ❌ Duplicate information already covered in existing docs
- ❌ Temporary implementation details
- ❌ Exaggerated claims about production readiness

## 🎯 Current Project Status Summary

- **Canvas**: Functional with known consistency issues
- **Gmail**: Backend complete, frontend integration ongoing
- **Calendar/Tasks**: Implemented with Google API integration
- **Backend**: Service-oriented architecture with 95% test success rate
- **Overall**: Active development with solid foundations

---

**Last Updated**: January 2025  
**Documentation Status**: Consolidated and accurate  
**Next Review**: After major implementation milestones