# Canvas Modular Migration Orchestration Prompt

## Mission: Complete Canvas Modular Migration

You are coordinating the migration of LibreOllama's canvas system from its current **monolithic `CanvasRendererV2`** (4,502 lines) to a fully **modular architecture**. This is a critical project requiring zero feature loss and perfect UX parity.

## Current State (Critical Context)

### Production Reality
- **Primary System**: Monolithic `CanvasRendererV2.ts` handles ALL canvas functionality
- **File Size**: 4,502 lines of tightly coupled rendering logic
- **Status**: Stable, production-ready, feature-complete
- **Feature Flag**: `USE_NEW_CANVAS` defaults to `false` (uses monolithic renderer)

### Experimental Modular System
- **Infrastructure**: Built but incomplete (`src/features/canvas/renderer/modular/`)
- **Current Usage**: Only `SelectionModule` active in shadow mode when flag enabled
- **Modules Available**: Selection, Text, Viewport, Drawing, Eraser, Connector
- **Status**: Experimental, not feature-complete, needs full implementation

### Documentation Reference
- **Implementation Guide**: `docs/CANVAS_IMPLEMENTATION_GUIDE.md` (comprehensive reference)
- **Current Status**: `docs/CANVAS_STATUS.md` (accurate current state)
- **Agent Description**: `docs/CANVAS_MIGRATION_AGENT_DESCRIPTION.md` (QA methodology)

## Agent Coordination Protocol

### Primary Agents
1. **@Canvas Subsystem Engineer** - Handles all coding and implementation
2. **@Canvas Migration QA Lead** - Handles testing, validation, and quality gates

### Workflow Requirements

#### MANDATORY: QA-First Approach
- **QA Lead ALWAYS reviews before ANY code changes**
- **Engineer NEVER implements without QA approval**
- **QA Lead has veto power over any migration step**
- **Rollback authority**: QA Lead can mandate immediate rollback if issues found

#### Standard Workflow
1. **QA Lead**: Analyze current feature and create test plan
2. **QA Lead**: Document expected behavior and edge cases  
3. **QA Lead**: Approve Engineer to proceed with implementation
4. **Engineer**: Implement modular version of the feature
5. **QA Lead**: Validate implementation against current monolithic behavior
6. **QA Lead**: Sign off or request revisions
7. **Both**: Move to next feature only after QA approval

## Migration Strategy

### Phase 1: Module Completion (Current Priority)
Complete implementation of each module to handle its designated functionality:

#### TextModule (`src/features/canvas/renderer/modular/modules/TextModule.ts`)
**Current**: Minimal implementation  
**Needed**: Full text editing, live auto-resize, overlay positioning, commit measurement
**QA Focus**: Text creation flow, live resize behavior, World↔DOM conversion accuracy
**Parity Target**: Lines 419-703 in `NonReactCanvasStage.tsx` and text handling in `CanvasRendererV2.ts`

#### DrawingModule (`src/features/canvas/renderer/modular/modules/DrawingModule.ts`)  
**Current**: Shadow mode placeholder
**Needed**: Pen/marker/highlighter tools, preview layer management, node pooling
**QA Focus**: Drawing smoothness, preview clearing, stroke commit, memory usage
**Parity Target**: Drawing tool components and related CanvasRendererV2 methods

#### ConnectorModule (`src/features/canvas/renderer/modular/modules/ConnectorModule.ts`)
**Current**: Basic snap indicator
**Needed**: Full connector creation, snap logic, endpoint editing, reflow
**QA Focus**: Snap hysteresis (±8px), visual feedback, endpoint attachment  
**Parity Target**: Connector handling in CanvasRendererV2 and ConnectorTool components

#### ViewportModule (`src/features/canvas/renderer/modular/modules/ViewportModule.ts`)
**Current**: Placeholder
**Needed**: Pan/zoom handling, coordinate transformations, resize management
**QA Focus**: Smooth zoom/pan, coordinate accuracy, viewport bounds
**Parity Target**: Viewport management in NonReactCanvasStage and store modules

#### EraserModule (`src/features/canvas/renderer/modular/modules/EraserModule.ts`)
**Current**: Basic structure
**Needed**: Hit-testing, element deletion, multi-element erase
**QA Focus**: Accurate hit detection, performance with large element counts
**Parity Target**: Eraser functionality in current tools

### Phase 2: Integration & Event Routing
**Goal**: Replace direct stage event attachment with centralized `RendererCore` dispatch
**Current Issue**: Tools attach events directly to stage instead of through modular system
**Required**: Implement centralized event routing through `module.onEvent()` methods

### Phase 3: Primary Renderer Migration
**Goal**: Replace `CanvasRendererV2` instantiation with `RendererCore` + full module set
**Critical**: Feature flag flip from `false` to `true` default
**Validation**: Side-by-side testing of monolithic vs modular renderer

### Phase 4: Legacy Cleanup
**Goal**: Archive `CanvasRendererV2.ts` and remove monolithic dependencies
**Timing**: Only after 100% confidence in modular system

## Critical Migration Rules

### Non-Negotiables
1. **Zero Feature Loss**: Every current feature must work identically
2. **Performance Parity**: No degradation in FPS, memory, or responsiveness
3. **UX Consistency**: Subjective feel must be indistinguishable  
4. **Accessibility Preservation**: All keyboard shortcuts and screen reader support
5. **Rollback Capability**: Feature flag must enable instant revert

### Quality Gates
- **QA Lead approval required** for each module before integration
- **Full regression testing** after each major integration
- **Performance benchmarking** at each phase completion
- **User journey validation** for complete workflows

### Risk Mitigation
- **Incremental approach**: One module at a time
- **Parallel systems**: Keep monolithic renderer fully functional
- **Immediate rollback**: QA Lead authority to halt migration
- **Comprehensive testing**: Both automated and manual validation

## Specific Technical Instructions

### For Canvas Subsystem Engineer
1. **Start with smallest modules first** (ViewportModule, then EraserModule)
2. **Reference monolithic implementation** in CanvasRendererV2 for exact behavior
3. **Maintain existing performance characteristics** (RAF batching, node pooling)
4. **Use existing adapter interfaces** (StoreAdapterUnified, KonvaAdapterStage)
5. **Follow established patterns** from working SelectionModule
6. **Never break existing functionality** - feature flag protects rollback

### For Canvas Migration QA Lead  
1. **Document current behavior** before any changes (screenshots, measurements, timings)
2. **Create detailed test plans** for each module migration
3. **Validate edge cases** and error conditions
4. **Monitor performance metrics** throughout migration
5. **Test user workflows end-to-end** after each integration
6. **Maintain rollback readiness** - know how to instantly revert

## Example Coordination

```
@Canvas Migration QA Lead: Please analyze the TextModule migration requirements. Document current text editing behavior in CanvasRendererV2 and create a comprehensive test plan.

[QA Lead provides analysis and test plan]

@Canvas Subsystem Engineer: Based on QA Lead's analysis, implement the TextModule to achieve feature parity with the documented behavior. Focus on [specific aspects identified by QA].

[Engineer implements and reports completion]

@Canvas Migration QA Lead: Please validate the TextModule implementation against your test plan and current monolithic behavior. Approve or request specific revisions.

[Continue until QA Lead approval, then move to next module]
```

## Critical Success Factors

1. **QA Lead drives timeline** - Engineer waits for approval at each step
2. **Feature parity is sacred** - No compromises on existing functionality  
3. **Performance is protected** - Monitor and maintain current performance levels
4. **User experience is paramount** - Subjective feel must remain identical
5. **Rollback readiness** - Always maintain ability to revert instantly

## Final Goal

Replace the 4,502-line monolithic `CanvasRendererV2` with a clean, modular architecture while maintaining 100% feature parity and user experience consistency. The modular system should be more maintainable, testable, and performant than the current implementation.

**Success = Zero user-visible changes + better developer experience + identical performance**
