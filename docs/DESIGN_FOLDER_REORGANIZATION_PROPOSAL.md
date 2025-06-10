# Design System Folder Reorganization Proposal

## Current Issues
- ❌ Folder name with spaces: `Design System/` 
- ❌ Mixed content (specs + mockups + assets)
- ❌ Split documentation across multiple locations
- ❌ Not following development conventions

## Proposed Structure

```
design/                           # 🆕 New root design folder (no spaces)
├── system/                       # Design system specifications
│   ├── overview.md              # From "Design system overview"
│   ├── components/              # From "Component Details" 
│   └── guidelines/              # Design guidelines and standards
├── mockups/                     # Visual mockups and designs  
│   ├── agents.png               # From "agents mockup.png"
│   ├── calendar.png             # From "calendar mockup.png"
│   ├── canvas.png               # From "canvas mockup.png"
│   ├── chat-hub.png             # From "chats mockup.png"
│   ├── dashboard.png            # From "dashboard mockup.png"
│   ├── notes.png                # From "notes mockup.png"
│   ├── projects.png             # From "projects mockup.png"
│   ├── settings-agents.png      # From "settings agents and models mockup.png"
│   ├── settings-general.png     # From "Settings general mockup.png"
│   ├── settings-integrations.png# From "settings integrations mockup.png"
│   └── tasks.png                # From "tasks mockup.png"
└── specs/                       # Detailed component specifications
    ├── agents/                  # From "Agents" folder
    ├── calendar/                # From "Calendar" folder
    ├── canvas/                  # From "Canvas" folder
    ├── chat-hub/                # From "Chat hub" folder
    ├── dashboard/               # From "Dashboard" folder
    ├── notes/                   # From "Notes" folder
    ├── projects/                # From "Projects" folder
    ├── settings/                # From settings folders
    └── tasks/                   # From "Tasks" folder

docs/                            # 📝 Keep implementation docs here
└── design-system/               # Already well organized
    ├── DESIGN_SYSTEM_DOCUMENTATION.md
    └── capitalization-guidelines.md

src/                             # 💻 Code implementation stays here
├── styles/
│   └── design-system.css        # ✅ Already consolidated
└── components/ui/               # ✅ Already consolidated
```

## Benefits

### 1. **Developer-Friendly**
- ✅ No spaces in folder names (shell/CLI friendly)
- ✅ Clear separation of concerns
- ✅ Follows industry conventions

### 2. **Better Organization**
- 📁 **mockups/**: Visual designs for reference
- 📋 **specs/**: Detailed component specifications  
- 🎨 **system/**: High-level design system documentation
- 💻 **docs/**: Developer implementation docs (existing)

### 3. **Maintenance**
- 🔍 Easy to find specific assets
- 🔧 Build tools can reference without escaping spaces
- 📝 Clear distinction between design and implementation

## Migration Commands

```powershell
# Create new structure
New-Item -ItemType Directory -Path "design/system" -Force
New-Item -ItemType Directory -Path "design/mockups" -Force  
New-Item -ItemType Directory -Path "design/specs" -Force

# Move mockups
Move-Item "Design System/*.png" "design/mockups/"

# Move specifications
Move-Item "Design System/Agents" "design/specs/agents"
Move-Item "Design System/Calendar" "design/specs/calendar"
Move-Item "Design System/Canvas" "design/specs/canvas"
Move-Item "Design System/Chat hub" "design/specs/chat-hub"
Move-Item "Design System/Dashboard" "design/specs/dashboard"
Move-Item "Design System/Notes" "design/specs/notes"
Move-Item "Design System/Projects" "design/specs/projects"
Move-Item "Design System/Tasks" "design/specs/tasks"

# Move system documentation
Move-Item "Design System/Design system overview" "design/system/overview.md"
Move-Item "Design System/Component Details" "design/system/components"

# Remove old folder
Remove-Item "Design System" -Recurse
```

## Decision

**Recommendation**: ✅ **Yes, reorganize it**

The current structure will cause issues as the project grows. The proposed structure:
- Follows industry standards
- Eliminates technical debt
- Makes assets easier to find and reference
- Separates design concerns cleanly

**Impact**: Low risk, high benefit improvement
