# Master Implementation Plan - CME Content Worker

**Generated**: 2025-10-10
**Status**: Ready for Execution
**Priority**: Critical Path to Autonomous Agent Work

---

## Executive Summary

**Current State**: System is 80% complete but suffers from non-deterministic behavior preventing autonomous development.

**Root Causes Identified**:
1. **Singleton state management** causing unpredictable rendering
2. **Missing media library features** blocking content workflow
3. **Incomplete semantic block library** requiring pattern extraction from source posts

**Goal**: Achieve deterministic, stable system enabling autonomous agent implementation.

**Timeline**: 2-3 days for critical path, 1-2 weeks for complete implementation

---

## Critical Path (Blocks Autonomous Work)

### Phase 1: State Management Fixes (Priority: CRITICAL)
**Estimated Time**: 1 hour
**Blocks**: All autonomous development
**Dependencies**: None

#### Tasks:
1. **Refactor TemplateRenderer to Stateless** (30 min)
   - File: `src/utils/template-renderer.ts`
   - Remove singleton pattern (lines 6-20)
   - Convert to pure function: `renderPage(variables, templates)`
   - Update all callers in `src/worker/routes/template-render.ts`
   - Test: Request same route 10x, verify identical output

2. **Simplify PerformanceMonitor** (30 min)
   - File: `src/utils/performance-monitor.ts`
   - Remove singleton pattern (lines 23-32)
   - Convert to: `createPerformanceTracker(route)` factory function
   - Keep `addPerformanceHeaders()` function (stateless)
   - Delete `src/worker/routes/performance.ts` (353 lines)
   - Update callers to use factory function
   - Test: Verify response headers still show timing

#### Success Criteria:
- ✅ No singleton classes in codebase
- ✅ 10 sequential requests produce identical output (±5ms timing variance)
- ✅ No memory accumulation over 100 requests
- ✅ Hero image consistently renders between sessions

#### Documentation:
- Reference: `ROOT_INSTABILITY_CAUSE.md`
- Reference: `PERFORMANCE_MONITORING_REFACTOR.md`

---

### Phase 2: Media Library UX Improvements (Priority: HIGH)
**Estimated Time**: 90 minutes
**Blocks**: Content creation workflow
**Dependencies**: None

#### Tasks:
1. **Double-Click to Insert** (10 min)
   - File: `src/react-app/components/MediaThumbnail.tsx`
   - Add `onDoubleClick` handler
   - Call parent's insert function with default settings

2. **Remove Confirmation Button** (15 min)
   - File: `src/react-app/components/media/MediaPicker.tsx`
   - Auto-insert on image select (skip options panel)
   - Make options panel appear AFTER insertion for adjustments

3. **Category Selection in Upload** (30 min)
   - File: `src/react-app/components/MediaUpload.tsx`
   - Add category dropdown to upload form
   - Pre-select based on current filter context
   - Default to "Uncategorized" if none chosen

4. **Empty State UI** (20 min)
   - File: `src/react-app/components/MediaLibrary.tsx`
   - Show "Create your first category" when empty
   - Suggest default categories (Featured, Content, Social)
   - Allow category creation without media

5. **Simplify CDN URL Handling** (15 min)
   - File: `src/react-app/components/media/MediaPicker.tsx`
   - Remove proxy logic (line 78-79)
   - Use `file_url` directly from database

#### Success Criteria:
- ✅ Upload → Auto-insert (no confirmation click)
- ✅ Double-click thumbnail → Immediate insert
- ✅ Category selection available during upload
- ✅ Empty library shows helpful UI
- ✅ No localhost vs remote URL complexity

#### Documentation:
- Reference: `MEDIA_LIBRARY_IMPROVEMENTS.md`

---

## Parallel Workstreams (Can Execute Simultaneously)

### Workstream A: Semantic Block Analysis (Priority: HIGH)
**Estimated Time**: 4-6 hours (autonomous local LLM work)
**Blocks**: Block library implementation
**Dependencies**: None (can run in parallel)

#### Task:
**Autonomous Analysis via Local LLMs**
- **Prompt**: "Analyze WordPress posts following SEMANTIC_BLOCK_ANALYSIS_PLAN.md"
- **Input**: Post URLs from source list
- **Process**:
  - Route to local LLMs via model-router → executor
  - Extract semantic patterns from each post
  - Classify patterns (covered vs gaps)
  - Generate block specifications
- **Output**: Comprehensive block library specification

#### Deliverables:
1. Pattern analysis report (all discovered patterns with HTML/CSS)
2. Block library specification (complete definitions with metadata)
3. Implementation priority backlog
4. Gap analysis (existing blocks vs needs)

#### Success Criteria:
- ✅ Every pattern from source posts mapped to semantic blocks
- ✅ Metadata panel requirements defined for each block
- ✅ No missing patterns (can recreate all source layouts)
- ✅ Clear prioritization for implementation

#### Documentation:
- Reference: `SEMANTIC_BLOCK_ANALYSIS_PLAN.md`
- Output: `SEMANTIC_BLOCK_LIBRARY_SPEC.md` (to be generated)

---

### Workstream B: Template System Consolidation (Priority: MEDIUM)
**Estimated Time**: 2 hours
**Blocks**: Template maintenance complexity
**Dependencies**: Phase 1 complete

#### Tasks:
1. **Audit Template Duplication** (30 min)
   - Identify overlap between:
     - `/cme-posts-abstraction/templates/` (source)
     - `src/utils/compiled-templates.ts` (compiled)
     - `src/react-app/components/` (React versions)
   - Document which are actually used

2. **Choose Unified Approach** (Decision)
   - **Option A**: Keep compiled templates (current, working)
   - **Option B**: Migrate to Astro (future, better DX)
   - **Option C**: Pure React SSR (complex, overkill)
   - **Recommendation**: Option A for stability, Option B for future

3. **Remove Unused Templates** (30 min)
   - Delete duplicate/unused template files
   - Consolidate CSS loading
   - Document template dependencies

4. **Automate CSS Build** (1 hour)
   - Create `npm run build:css` script
   - Auto-upload to R2 on build
   - Remove manual drag-and-drop workflow

#### Success Criteria:
- ✅ Single source of truth for each template
- ✅ No manual CSS upload steps
- ✅ Automated asset versioning
- ✅ Clear template dependency map

---

## Sequential Implementation (After Critical Path)

### Phase 3: Semantic Block Implementation
**Estimated Time**: 1-2 weeks
**Dependencies**: Phase 1 complete, Workstream A complete
**Priority**: HIGH

#### Subtasks (Per Block Type):
1. **Define Block Type** (15 min each)
   - Add to `src/types/database.ts`
   - Define content structure interface

2. **Create TipTap Extension** (1-2 hours each)
   - File: `src/react-app/components/editor/extensions/[BlockName]Extension.tsx`
   - Implement node type, rendering, commands
   - Add keyboard shortcuts

3. **Add to Block Browser** (15 min each)
   - File: `src/react-app/components/editor/BlockBrowser.tsx`
   - Add icon, hotkey, description
   - Categorize appropriately

4. **Build Metadata Panel** (1-2 hours each)
   - File: `src/react-app/components/editor/BlockSettingsSidebar.tsx`
   - Add controls (color pickers, dropdowns, sliders)
   - Wire to TipTap commands

5. **Update Block Converter** (30 min each)
   - File: `src/react-app/utils/block-converter.ts`
   - Add TipTap JSON ↔ ContentBlock conversion

6. **Add Block Renderer** (1 hour each)
   - File: `src/utils/block-renderer.ts`
   - Implement HTML generation with CSS classes
   - Apply metadata options

#### Implementation Order (From Workstream A Output):
- Priority 1: Most frequently used blocks
- Priority 2: Critical for content structure
- Priority 3: Nice-to-have variations

#### Success Criteria:
- ✅ All patterns from source posts can be recreated
- ✅ Metadata panels fully functional
- ✅ Alt+I block insertion works for all blocks
- ✅ Preview matches published output exactly

---

## Post-Implementation Validation

### Test Suite (After All Phases Complete)
1. **Determinism Test**
   ```bash
   for i in {1..10}; do
     curl http://localhost:8787/ > output$i.html
   done
   # All outputs should be identical (except timestamps)
   ```

2. **Memory Stability Test**
   ```bash
   # Make 1000 requests, monitor worker memory
   for i in {1..1000}; do
     curl -s http://localhost:8787/ > /dev/null
   done
   # Memory should not grow beyond initial allocation
   ```

3. **Feature Completeness Test**
   - Create post with all semantic blocks
   - Style via metadata panels
   - Verify preview matches published
   - Check hero image renders consistently

4. **Autonomous Agent Test**
   - Launch autonomous agent to make 5 sequential changes
   - Each change should succeed deterministically
   - No circular debugging loops

---

## Documentation Cleanup

### Files to Keep (Current + New from This Session):
- ✅ `CLAUDE.md` - Project context (UPDATE with new info)
- ✅ `README.md` - Overview (UPDATE to remove "transformation in progress" warning)
- ✅ `setup.md` - Development setup
- ✅ `TROUBLESHOOTING.md` - Debugging guide
- ✅ `MEDIA_LIBRARY_IMPROVEMENTS.md` - NEW (this session)
- ✅ `HERO_IMAGE_DIAGNOSTIC.md` - NEW (this session)
- ✅ `ROOT_INSTABILITY_CAUSE.md` - NEW (this session)
- ✅ `PERFORMANCE_MONITORING_REFACTOR.md` - NEW (this session)
- ✅ `SEMANTIC_BLOCK_ANALYSIS_PLAN.md` - NEW (this session)
- ✅ `MASTER_IMPLEMENTATION_PLAN.md` - NEW (this document)

### Files to Archive/Remove (Outdated or Conflicting):
- ❌ `MODEL_SELECTION_SUMMARY.md` - Outdated AI model info
- ❌ `PERFORMANCE_OPTIMIZATION.md` - Superseded by PERFORMANCE_MONITORING_REFACTOR.md
- ❌ `DATABASE_SCHEMA_ANALYSIS.md` - Historical, not actionable
- ❌ `PHASE3_INTEGRATION_COMPLETE.md` - Historical milestone, obsolete
- ❌ `POST_EDITOR_IMPLEMENTATION.md` - Already implemented, superseded by SEMANTIC_BLOCK_ANALYSIS_PLAN.md

**Action**: Move to `docs/archive/` directory

---

## Risk Management

### Known Risks:
1. **Semantic block analysis reveals 50+ block types**
   - **Mitigation**: Implement top 20 by frequency, defer rest
   - **Fallback**: Provide "custom HTML" block for edge cases

2. **TipTap extensions prove complex**
   - **Mitigation**: Start with simplest blocks (heading, paragraph)
   - **Fallback**: Use basic contentEditable with JSON structure

3. **Preview vs published rendering still diverges**
   - **Mitigation**: Share rendering logic between preview and published
   - **Fallback**: Accept minor differences, prioritize published accuracy

4. **User workflow friction remains**
   - **Mitigation**: User testing after Phase 2 completion
   - **Fallback**: Iterate based on real usage patterns

---

## Success Metrics

### Phase 1 Success (State Management):
- ✅ Zero singleton classes
- ✅ Deterministic output across 100 requests
- ✅ Hero image stable between sessions

### Phase 2 Success (Media Library):
- ✅ Upload-to-insert in 2 clicks (upload + select)
- ✅ Category selection during upload
- ✅ Empty state helpful

### Phase 3 Success (Semantic Blocks):
- ✅ All source post patterns recreatable
- ✅ Metadata panels functional
- ✅ Preview = published output

### Overall Success (Autonomous Work Ready):
- ✅ Agents can make 10 sequential changes without manual intervention
- ✅ No circular debugging loops
- ✅ Changes produce predictable outcomes
- ✅ System stable over 1000+ requests

---

## Timeline Summary

**Critical Path (Enables Autonomous Work)**:
- Phase 1: 1 hour (state management)
- Phase 2: 90 minutes (media library)
- **Total**: 2.5 hours to unblock autonomous development

**Parallel Work**:
- Workstream A: 4-6 hours (semantic analysis via local LLMs)
- Workstream B: 2 hours (template consolidation)

**Sequential Work**:
- Phase 3: 1-2 weeks (semantic block implementation)

**Total Project Timeline**: 2-3 days for stability, 2-3 weeks for feature completion

---

## Execution Strategy

### Immediate (Next Session):
1. Execute Phase 1 (state management fixes) - 1 hour
2. Launch Workstream A (semantic analysis) - background autonomous
3. Execute Phase 2 (media library improvements) - 90 minutes
4. Test determinism and stability

### Short-term (After Critical Path):
1. Review Workstream A output (semantic block specs)
2. Prioritize top 20 blocks by frequency
3. Execute Workstream B (template consolidation)
4. Begin Phase 3 (block implementation)

### Medium-term (After Phase 3):
1. Full system testing
2. User workflow validation
3. Performance optimization (if needed)
4. Documentation updates

---

## Conclusion

**The system is architecturally sound.** The issues are localized to:
1. Two singleton classes causing non-determinism
2. Missing UX features in media library
3. Incomplete semantic block library

**All issues are fixable with focused, deterministic work.**

Once Phase 1 and Phase 2 are complete (~2.5 hours), autonomous agents can work reliably to implement Phase 3.

**Ready for execution.**
