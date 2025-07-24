# Documentation Cleanup Plan

**Date:** 2025-01-24
**Status:** In Progress

## Current State Analysis

### Root Directory Documentation
- `README.md` - Main project readme ✅ Keep
- `CLAUDE.md` - AI assistant guidance ✅ Keep
- `GEMINI.md` - Alternative AI guidance ❌ Archive (redundant with CLAUDE.md)
- `LICENSE` - Legal ✅ Keep
- `PRODUCTION_READINESS_PLAN.md` - Production roadmap ✅ Keep & Update
- `CHANGELOG.md` - Change history ✅ Keep
- `phase-1-stabilization.md` - Phase 1 details ➡️ Merge into PRODUCTION_READINESS_PLAN.md
- `phase-2-mvp-completion.md` - Phase 2 details ➡️ Merge into PRODUCTION_READINESS_PLAN.md
- `phase-3-hardening.md` - Phase 3 details ➡️ Merge into PRODUCTION_READINESS_PLAN.md

### Docs Folder - Active Documents
- `README.md` - Documentation hub ✅ Keep & Update
- `COMPLETE_DESIGN_SYSTEM.md` - Design system ✅ Keep as primary design doc
- `IMPLEMENTATION_GUIDE.md` - Technical guide ✅ Keep
- `ROADMAP.md` - Feature roadmap ✅ Keep
- `ANIMATION_SYSTEM_STANDARDS.md` - Animation standards ➡️ Merge into COMPLETE_DESIGN_SYSTEM.md
- `AUTHENTICATION_PERSISTENCE_TEST_GUIDE.md` - Test guide ➡️ Move to testing section of IMPLEMENTATION_GUIDE.md
- `NOTES_TESTING_STRATEGY.md` - Notes testing ➡️ Move to testing section of IMPLEMENTATION_GUIDE.md
- `TESTING_AUDIT_SUMMARY.md` - Test audit ➡️ Archive (outdated)
- `CALENDAR_DEBUGGING_RESEARCH.txt` - Debug notes ➡️ Archive

### Docs/Roadmap Folder
- All files (01-12) - Feature-specific roadmaps ✅ Keep all

### Progress Folder
- Various progress tracking files ➡️ Consolidate into single PROGRESS_LOG.md

## Proposed New Structure

### Root Directory (Clean & Professional)
```
├── README.md                      # Project overview & quick start
├── CHANGELOG.md                   # Version history
├── LICENSE                        # Legal
├── CLAUDE.md                      # AI assistant guidance
└── CONTRIBUTING.md                # New: Contribution guidelines
```

### Docs Folder (Organized by Purpose)
```
docs/
├── README.md                      # Documentation index
├── PRODUCTION_READINESS.md        # Consolidated production plan with phases
├── DESIGN_SYSTEM.md              # Complete design system with animations
├── ARCHITECTURE.md               # Technical architecture & implementation
├── TESTING_STRATEGY.md           # Consolidated testing documentation
├── roadmap/                      # Feature-specific roadmaps
│   ├── README.md                 # Roadmap index
│   ├── 01_canvas.md
│   ├── 02_gmail_integration.md
│   └── ...
├── guides/                       # New: How-to guides
│   ├── getting-started.md
│   ├── development-setup.md
│   └── deployment.md
└── _archive/                     # Historical documents
```

## Consolidation Actions

### 1. Create PRODUCTION_READINESS.md
Combine:
- Current PRODUCTION_READINESS_PLAN.md
- phase-1-stabilization.md
- phase-2-mvp-completion.md  
- phase-3-hardening.md

### 2. Create DESIGN_SYSTEM.md
Combine:
- COMPLETE_DESIGN_SYSTEM.md
- ANIMATION_SYSTEM_STANDARDS.md
- Design tokens and component standards

### 3. Create ARCHITECTURE.md
Rename/Update:
- IMPLEMENTATION_GUIDE.md → ARCHITECTURE.md
- Add system overview diagrams
- Include backend architecture details

### 4. Create TESTING_STRATEGY.md
Combine:
- Testing section from IMPLEMENTATION_GUIDE.md
- AUTHENTICATION_PERSISTENCE_TEST_GUIDE.md
- NOTES_TESTING_STRATEGY.md
- Testing best practices

### 5. Create PROGRESS_LOG.md
Consolidate all progress files into chronological log

## Archive List

Move to docs/_archive/:
- GEMINI.md
- TESTING_AUDIT_SUMMARY.md
- CALENDAR_DEBUGGING_RESEARCH.txt
- All individual phase files (after merging)
- All progress files (after consolidating)
- Konva guides (already in archive)

## New Documents to Create

1. **CONTRIBUTING.md** - Guidelines for contributors
2. **guides/getting-started.md** - Quick start for new developers
3. **guides/development-setup.md** - Detailed dev environment setup
4. **guides/deployment.md** - Production deployment guide
5. **roadmap/README.md** - Index for feature roadmaps

## Benefits

1. **Reduced Redundancy** - No duplicate information
2. **Clear Organization** - Easy to find information
3. **Professional Structure** - Industry-standard layout
4. **Maintainable** - Fewer files to keep updated
5. **Discoverable** - Clear navigation paths

## Next Steps

1. Review and approve this plan
2. Execute consolidation in order
3. Update all internal references
4. Archive outdated documents
5. Create new guide documents
6. Update README files as indexes